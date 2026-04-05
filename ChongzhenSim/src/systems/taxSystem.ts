import type { Province, TaxResult, TaxReport, NationStats } from '../core/types';
import { GAME_CONFIG } from '../config/gameConfig';

/**
 * 税收系统
 * 
 * 注意：此系统只负责计算税收与结算，不直接修改数据库
 * 所有修改都在 GameLoop.tick 的结算阶段统一执行
 */

export class TaxSystem {
  private currentTurn: number = 1;
  private currentDate: string = '';

  setTurnInfo(turn: number, date: string): void {
    this.currentTurn = turn;
    this.currentDate = date;
  }

  private getMonthByTurn(turn: number): number {
    return ((turn - 1) % 12) + 1;
  }

  isSettlementTurn(turn: number): boolean {
    const month = this.getMonthByTurn(turn);
    return month === 6 || month === 9;
  }

  getSettlementType(turn: number): 'summer' | 'autumn' | null {
    const month = this.getMonthByTurn(turn);
    if (month === 6) return 'summer';
    if (month === 9) return 'autumn';
    return null;
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
      disasterLoss: Math.round(disasterLoss * 100) / 100,
      settlementType: 'summer',
      assetType: 'gold'
    };
  }

  calculateProvinceGrain(province: Province, nationStats: NationStats): TaxResult {
    const baseGrain = province.population * province.taxRate * GAME_CONFIG.TAX.GRAIN_BASE_RATE;

    const disasterLoss = baseGrain * province.disasterLevel * GAME_CONFIG.TAX.DISASTER_FACTOR;
    const moraleFactor = Math.max(GAME_CONFIG.TAX.MIN_MORALE_FACTOR, nationStats.peopleMorale / 100);
    const agriculturalFactor = Math.max(0.1, nationStats.agriculturalOutput / 100);

    const actualGrain = Math.max(0, baseGrain - disasterLoss) * moraleFactor * agriculturalFactor;

    return {
      provinceId: province.id,
      provinceName: province.name,
      baseTax: Math.round(baseGrain * 100) / 100,
      actualTax: Math.round(actualGrain * 100) / 100,
      corruptionLoss: 0,
      disasterLoss: Math.round(disasterLoss * 100) / 100,
      settlementType: 'autumn',
      assetType: 'grain'
    };
  }

  calculateAllProvincesTax(provinces: Province[], nationStats: NationStats): TaxResult[] {
    return provinces.map(province => this.calculateProvinceTax(province, nationStats));
  }

  calculateAllProvincesGrain(provinces: Province[], nationStats: NationStats): TaxResult[] {
    return provinces.map(province => this.calculateProvinceGrain(province, nationStats));
  }

  calculateTax(provinces: Province[], nationStats: NationStats): TaxResult[] {
    const settlementType = this.getSettlementType(this.currentTurn);
    if (settlementType === 'summer') {
      return this.calculateAllProvincesTax(provinces, nationStats);
    }

    if (settlementType === 'autumn') {
      return this.calculateAllProvincesGrain(provinces, nationStats);
    }

    return [];
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

  getTaxEfficiency(_province: Province, taxResult: TaxResult): number {
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
