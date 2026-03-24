// 游戏配置文件 - 存储所有影响数值平衡的常量

export const GAME_CONFIG = {
  // 初始值配置
  INITIAL: {
    TREASURY: 800,
    GRAIN: 500,
  },

  // ============================================
  // 事件相关常量 - 所有事件数值必须从这里引用
  // ============================================
  EVENT_CONSTANTS: {
    // 赈灾相关
    RELIEF_COST_BASE: 50000,           // 基础赈灾费用
    RELIEF_COST_PER_LEVEL: 10000,      // 每级灾害额外费用

    // 军事相关
    MILITARY_PAYMENT_BASE: 80000,      // 基础军费拨款
    MILITARY_PAYMENT_PER_FORCE: 5000,  // 每单位军力额外费用

    // 官员相关
    BRIBE_COST_BASE: 30000,            // 基础贿赂费用
    BRIBE_COST_PER_RANK: 10000,        // 每级官阶额外费用

    // 国家建设
    INFRASTRUCTURE_COST: 100000,       // 基础设施建设费用
    RESEARCH_COST: 50000,              // 研究费用

    // 外交相关
    DIPLOMACY_GIFT_BASE: 40000,        // 基础外交礼物
    TRADE_AGREEMENT_BONUS: 20000,      // 贸易协议奖励

    // 灾害应对
    DISASTER_RELIEF_IMMEDIATE: 30000,  // 立即赈灾费用
    DISASTER_RELIEF_FULL: 80000,       // 全面赈灾费用

    // 叛乱镇压
    SUPPRESS_REBELLION_COST: 60000,    // 镇压叛乱费用

    // 其他事件
    CELEBRATION_COST: 20000,           // 庆典费用
    EMERGENCY_FUND: 40000,             // 应急基金
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

  // 省份系统配置
  PROVINCE: {
    UNREST_REDUCTION_PER_TURN: 5,       // 每回合民乱减少值
    DISASTER_UNREST_INCREASE: 10,       // 灾害导致的民乱增加
    HIGH_TAX_UNREST_THRESHOLD: 0.3,     // 高税率民乱阈值
    UNREST_PER_TAX_ABOVE_THRESHOLD: 15, // 超过阈值的民乱增加系数
    DISASTER_REDUCTION_CHANCE: 0.2,     // 灾害减少的概率
    CORRUPTION_CHANGE_RANGE: 5,          // 贪腐变化范围
  },

  // 官员系统配置
  MINISTER: {
    LOYALTY_REDUCTION_FROM_CORRUPTION: 1, // 贪腐导致的忠诚减少
    CORRUPTION_INCREASE_FROM_NATION: 1,   // 国家贪腐导致的官员贪腐增加
    LOYALTY_CHANGE_RANGE: 3,              // 忠诚变化范围
    CORRUPTION_THRESHOLD: 50,             // 贪腐阈值
    NATION_CORRUPTION_THRESHOLD: 60,      // 国家贪腐阈值
  },

  // 国家系统配置
  NATION: {
    MILITARY_POWER_DIVISOR: 10,          // 军力计算除数
    MORALE_UNREST_FACTOR: 100,           // 民心与民乱的关系因子
    BORDER_THREAT_FLUCTUATION: 10,        // 边患波动范围
    BORDER_THREAT_INCREASE: 5,            // 低军力导致的边患增加
    DISASTER_AGRICULTURAL_FACTOR: 10,     // 灾害对农业产出的影响因子
  },
};

// ============================================
// 配置值获取函数 - 支持从 configKey 获取数值
// ============================================

/**
 * 从 GAME_CONFIG 中获取事件常量值
 * @param key - 配置键名，如 'RELIEF_COST_BASE'
 * @returns 配置值
 */
export function getEventConstant(key: keyof typeof GAME_CONFIG.EVENT_CONSTANTS): number {
  const value = GAME_CONFIG.EVENT_CONSTANTS[key];
  if (value === undefined) {
    console.error(`[gameConfig] 未找到事件常量: ${key}`);
    return 0;
  }
  return value;
}

/**
 * 解析 OptionEffect 的数值
 * 优先使用 configKey 从配置中获取，否则使用 value
 * @param configKey - 配置键名（可选）
 * @param value - 硬编码数值（可选）
 * @returns 最终数值
 */
export function resolveEffectValue(
  configKey: keyof typeof GAME_CONFIG.EVENT_CONSTANTS | undefined,
  value: number | undefined
): number {
  if (configKey !== undefined) {
    const configValue = getEventConstant(configKey);
    if (configValue !== 0) {
      return configValue;
    }
    console.warn(`[gameConfig] configKey ${configKey} 未找到，回退到 value`);
  }

  if (value !== undefined) {
    return value;
  }

  console.error('[gameConfig] 既没有 configKey 也没有 value，返回 0');
  return 0;
}
