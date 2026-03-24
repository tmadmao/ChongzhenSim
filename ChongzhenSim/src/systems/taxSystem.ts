import type { Province, TaxResult, TaxReport, NationStats } from '../core/types';
import { updateProvince, insertTransaction, generateId } from '../db/database';
import { GAME_CONFIG } from '../config/gameConfig';

export class TaxSystem {
  private currentTurn: number = 1;
  private currentDate: string = '崇祯元年正月';

  setTurnInfo(turn: number, date: string): void {
    this.currentTurn = turn;
    this.currentDate = date;
  }

  calculateProvinceTax(province: Province, nationStats: NationStats): TaxResult {
    const baseTax = province.population * province.taxRate * GAME_CONFIG.TAX.BASE_TAX_RATE;
    
    const corruptionFactor = province.corruptionLevel / GAME_CONFIG.TAX.CORRUPTION_FACTOR_DENOMINATOR;
    const disasterFactor = province.disasterLevel * GAME_CONFIG.TAX.DISASTER_FACTOR;
    const moraleFactor = Math.max(GAME_CONFIG.TAX.MIN_MORALE_FACTOR, nationStats.peopleMorale / 100);
    
    const corruptionLoss = baseTax * corruptionFactor;
    const disasterLoss = baseTax * disasterFactor;
    
    const actualTax = Math.max(0, baseTax - corruptionLoss - disasterLoss) * moraleFactor;
    
    return {
      provinceId: province.id,
      provinceName: province.name,
      baseTax: Math.round(baseTax * 100) / 100,
      actualTax: Math.round(actualTax * 100) / 100,
      corruptionLoss: Math.round(corruptionLoss * 100) / 100,
      disasterLoss: Math.round(disasterLoss * 100) / 100
    };
  }

  calculateAllProvincesTax(provinces: Province[], nationStats: NationStats): TaxResult[] {
    return provinces.map(province => this.calculateProvinceTax(province, nationStats));
  }

  applyTaxEffects(provinces: Province[], taxResults: TaxResult[]): void {
    taxResults.forEach(result => {
      const province = provinces.find(p => p.id === result.provinceId);
      if (!province) return;
      
      updateProvince(result.provinceId, { taxRevenue: result.actualTax });
      
      insertTransaction({
        id: generateId(),
        turn: this.currentTurn,
        date: this.currentDate,
        type: 'income',
        category: 'tax',
        amount: result.actualTax,
        provinceId: result.provinceId,
        description: `${result.provinceName}税收`,
        createdAt: Date.now()
      });
      
      if (province.taxRate > GAME_CONFIG.TAX.TAX_UNREST.HIGH_TAX_THRESHOLD) {
        const unrestIncrease = Math.floor((province.taxRate - GAME_CONFIG.TAX.TAX_UNREST.HIGH_TAX_THRESHOLD) * GAME_CONFIG.TAX.TAX_UNREST.UNREST_PER_TAX_ABOVE_THRESHOLD);
        updateProvince(result.provinceId, {
          civilUnrest: Math.min(100, province.civilUnrest + unrestIncrease)
        });
      }
    });
  }

  adjustTaxRate(provinceId: string, newRate: number, provinces: Province[]): boolean {
    if (newRate < 0 || newRate > 1) {
      console.warn('[TaxSystem] Invalid tax rate:', newRate);
      return false;
    }
    
    const province = provinces.find(p => p.id === provinceId);
    if (!province) {
      console.warn('[TaxSystem] Province not found:', provinceId);
      return false;
    }
    
    const oldRate = province.taxRate;
    updateProvince(provinceId, { taxRate: newRate });
    
    const rateChange = newRate - oldRate;
    if (rateChange > GAME_CONFIG.TAX.TAX_UNREST.RATE_CHANGE_THRESHOLD) {
      const unrestIncrease = Math.floor(rateChange * GAME_CONFIG.TAX.TAX_UNREST.UNREST_PER_RATE_INCREASE);
      updateProvince(provinceId, {
        civilUnrest: Math.min(100, province.civilUnrest + unrestIncrease)
      });
    } else if (rateChange < -GAME_CONFIG.TAX.TAX_UNREST.RATE_CHANGE_THRESHOLD) {
      const unrestDecrease = Math.floor(Math.abs(rateChange) * GAME_CONFIG.TAX.TAX_UNREST.UNREST_PER_RATE_DECREASE);
      updateProvince(provinceId, {
        civilUnrest: Math.max(0, province.civilUnrest - unrestDecrease)
      });
    }
    
    return true;
  }

  getTaxReport(taxResults: TaxResult[]): TaxReport {
    const totalIncome = taxResults.reduce((sum, r) => sum + r.actualTax, 0);
    
    const sorted = [...taxResults].sort((a, b) => b.actualTax - a.actualTax);
    
    return {
      turn: this.currentTurn,
      totalIncome: Math.round(totalIncome * 100) / 100,
      provinceResults: taxResults,
      topProvince: sorted[0] || null,
      bottomProvince: sorted[sorted.length - 1] || null
    };
  }

  getTotalTaxRevenue(taxResults: TaxResult[]): number {
    return taxResults.reduce((sum, r) => sum + r.actualTax, 0);
  }

  getTaxEfficiency(province: Province, taxResult: TaxResult): number {
    if (taxResult.baseTax === 0) return 0;
    return Math.round((taxResult.actualTax / taxResult.baseTax) * 100);
  }

  getTaxBurden(province: Province): 'light' | 'moderate' | 'heavy' | 'extreme' {
    if (province.taxRate <= GAME_CONFIG.TAX.TAX_BURDEN.LIGHT_THRESHOLD) return 'light';
    if (province.taxRate <= GAME_CONFIG.TAX.TAX_BURDEN.MODERATE_THRESHOLD) return 'moderate';
    if (province.taxRate <= GAME_CONFIG.TAX.TAX_BURDEN.HEAVY_THRESHOLD) return 'heavy';
    return 'extreme';
  }

  estimateTaxRevenue(provinces: Province[], nationStats: NationStats): number {
    return provinces.reduce((sum, province) => {
      const result = this.calculateProvinceTax(province, nationStats);
      return sum + result.actualTax;
    }, 0);
  }
}

export const taxSystem = new TaxSystem();
