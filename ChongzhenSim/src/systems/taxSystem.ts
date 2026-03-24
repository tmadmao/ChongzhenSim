import type { Province, TaxResult, TaxReport, NationStats } from '../core/types';
import { GAME_CONFIG } from '../config/gameConfig';
import { accountingSystem } from '../engine/AccountingSystem';

/**
 * 税收系统
 * 
 * 注意：此系统只负责计算税收，不直接修改数据库
 * 所有修改都在 GameLoop.tick 的结算阶段统一执行
 */

export class TaxSystem {
  private currentTurn: number = 1;

  setTurnInfo(turn: number, _date: string): void {
    this.currentTurn = turn;
  }

  /**
   * 计算单个省份的税收
   * 只计算，不修改任何数据
   */
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

  /**
   * 计算所有省份的税收
   * 只计算，不修改任何数据
   */
  calculateAllProvincesTax(provinces: Province[], nationStats: NationStats): TaxResult[] {
    return provinces.map(province => this.calculateProvinceTax(province, nationStats));
  }

  /**
   * 计算税收并记录到 AccountingSystem
   * 在 GameLoop.tick 的 Step B 中调用
   */
  calculateTax(provinces: Province[]): TaxResult[] {
    // 这里简化处理，使用默认的 nationStats
    const nationStats: NationStats = {
      peopleMorale: 50,
      militaryPower: 50,
      borderThreat: 30,
      overallCorruption: 40,
      agriculturalOutput: 60
    };
    const results = this.calculateAllProvincesTax(provinces, nationStats);
    
    // 记录到 AccountingSystem（不直接修改数据库）
    results.forEach(result => {
      if (result.actualTax > 0) {
        accountingSystem.addIncome(
          `${result.provinceName}税收`,
          result.actualTax,
          `${result.provinceName}税收收入`
        );
      }
    });
    
    return results;
  }

  /**
   * 获取税收报告
   */
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

  /**
   * 获取总税收收入
   */
  getTotalTaxRevenue(taxResults: TaxResult[]): number {
    return taxResults.reduce((sum, r) => sum + r.actualTax, 0);
  }

  /**
   * 获取税收效率
   */
  getTaxEfficiency(_province: Province, taxResult: TaxResult): number {
    if (taxResult.baseTax === 0) return 0;
    return Math.round((taxResult.actualTax / taxResult.baseTax) * 100);
  }

  /**
   * 获取税收负担等级
   */
  getTaxBurden(province: Province): 'light' | 'moderate' | 'heavy' | 'extreme' {
    if (province.taxRate <= GAME_CONFIG.TAX.TAX_BURDEN.LIGHT_THRESHOLD) return 'light';
    if (province.taxRate <= GAME_CONFIG.TAX.TAX_BURDEN.MODERATE_THRESHOLD) return 'moderate';
    if (province.taxRate <= GAME_CONFIG.TAX.TAX_BURDEN.HEAVY_THRESHOLD) return 'heavy';
    return 'extreme';
  }

  /**
   * 估算税收收入
   */
  estimateTaxRevenue(provinces: Province[], nationStats: NationStats): number {
    return provinces.reduce((sum, province) => {
      const result = this.calculateProvinceTax(province, nationStats);
      return sum + result.actualTax;
    }, 0);
  }
}

export const taxSystem = new TaxSystem();
