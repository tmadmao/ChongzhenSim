// 游戏配置文件 - 存储所有影响数值平衡的常量

export const GAME_CONFIG = {
  // 初始值配置
  INITIAL: {
    TREASURY: 800,
    GRAIN: 500,
  },
  
  // 财政系统配置
  FINANCE: {
    MILITARY_COST_PER_FORCE: 0.5,      // 每单位军力的军费
    MINISTER_SALARY: 2,                // 每个官员的俸禄
    DISASTER_RELIEF_PER_LEVEL: 3,      // 每级灾害的赈灾费用
    BORDER_THREAT_COST: 0.5,           // 边患等级的边防费用系数
    CORRUPTION_LOSS_RATE: 0.3,         // 贪腐损耗系数
    
    // 财务健康评估阈值
    FINANCIAL_HEALTH: {
      DEFICIT_THRESHOLD: 200,          // 赤字阈值
      BALANCED_THRESHOLD: 500,         // 平衡阈值
      SURPLUS_THRESHOLD: 1500,         // 盈余阈值
    },
  },
  
  // 税收系统配置
  TAX: {
    BASE_TAX_RATE: 0.1,                // 基础税收系数
    CORRUPTION_FACTOR_DENOMINATOR: 200, // 腐败因子分母
    DISASTER_FACTOR: 0.1,              // 灾害因子
    MIN_MORALE_FACTOR: 0.3,            // 最低士气因子
    
    // 税率与民乱关系
    TAX_UNREST: {
      HIGH_TAX_THRESHOLD: 0.3,         // 高税率阈值
      UNREST_PER_TAX_ABOVE_THRESHOLD: 20, // 超过阈值的民乱增加系数
      RATE_CHANGE_THRESHOLD: 0.1,      // 税率调整阈值
      UNREST_PER_RATE_INCREASE: 30,     // 税率增加的民乱系数
      UNREST_PER_RATE_DECREASE: 15,     // 税率减少的民乱减少系数
    },
    
    // 税收负担评估阈值
    TAX_BURDEN: {
      LIGHT_THRESHOLD: 0.2,             // 轻税负阈值
      MODERATE_THRESHOLD: 0.35,         // 中等税负阈值
      HEAVY_THRESHOLD: 0.5,             // 重税负阈值
    },
  },
  
  // 税收效率计算
  TAX_EFFICIENCY: {
    POTENTIAL_TAX_FACTOR: 0.1,         // 潜在税收计算系数
  },
};
