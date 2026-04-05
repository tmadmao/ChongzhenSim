// 游戏配置文件 - 存储所有影响数值平衡的常量
// 所有数值必须从这里引用，禁止在剧本和业务逻辑中硬编码

export const GAME_CONFIG = {
  // ============================================
  // 初始值配置
  // ============================================
  INITIAL: {
    TREASURY: 800,           // 初始国库（万两）
    GRAIN: 500,              // 初始粮食（万石）
    TURN: 1,                 // 初始回合
    DATE: '崇祯元年正月',     // 初始日期
  },

  // ============================================
  // NPC（官员）数值配置
  // ============================================
  NPC: {
    // 属性范围
    LOYALTY: {
      MIN: 0,                // 忠诚度最小值
      MAX: 100,              // 忠诚度最大值
      DEFAULT: 50,           // 默认忠诚度
      HIGH: 80,              // 高忠诚度阈值
      LOW: 30,               // 低忠诚度阈值
      CRITICAL: 10,          // 危险忠诚度阈值
    },
    CORRUPTION: {
      MIN: 0,                // 贪腐最小值
      MAX: 100,              // 贪腐最大值
      DEFAULT: 30,           // 默认贪腐值
      HIGH: 70,              // 高贪腐阈值
      LOW: 20,               // 低贪腐阈值
      CRITICAL: 90,          // 极度贪腐阈值
    },
    COMPETENCE: {
      MIN: 0,                // 能力最小值
      MAX: 100,              // 能力最大值
      DEFAULT: 50,           // 默认能力值
      HIGH: 80,              // 高能力阈值
      LOW: 30,               // 低能力阈值
    },
    RELATIONSHIP: {
      MIN: -100,             // 关系最小值
      MAX: 100,              // 关系最大值
      DEFAULT: 0,            // 默认关系值
    },
    AMBITION: {
      MIN: 0,                // 野心最小值
      MAX: 100,              // 野心最大值
      DEFAULT: 50,           // 默认野心值
    },
    // 变动系数
    CHANGE: {
      LOYALTY_PER_CORRUPTION: -0.5,  // 每点贪腐导致的忠诚减少
      LOYALTY_PER_EVENT: 5,          // 事件影响的忠诚变动基数
      CORRUPTION_PER_TURN: 1,        // 每回合贪腐自然增长
      CORRUPTION_REDUCTION_PER_ACTION: 10, // 每次反腐行动减少的贪腐
    },
  },

  // ============================================
  // 省份数值配置
  // ============================================
  PROVINCE: {
    // 人口配置（万人）
    POPULATION: {
      MIN: 100,              // 最小人口
      MAX: 2000,             // 最大人口
      CAPITAL_BONUS: 1.2,    // 首都人口加成
    },
    // 税率配置
    TAX_RATE: {
      MIN: 0.05,             // 最低税率
      MAX: 0.60,             // 最高税率
      DEFAULT: 0.25,         // 默认税率
      STEP: 0.05,            // 税率调整步长
      // 税率等级
      LEVELS: {
        VERY_LOW: { min: 0, max: 0.10, label: '极低' },
        LOW: { min: 0.10, max: 0.20, label: '低' },
        NORMAL: { min: 0.20, max: 0.30, label: '正常' },
        HIGH: { min: 0.30, max: 0.40, label: '高' },
        VERY_HIGH: { min: 0.40, max: 0.60, label: '极高' },
      },
    },
    // 民乱配置
    UNREST: {
      MIN: 0,                // 最小民乱
      MAX: 100,              // 最大民乱
      CRITICAL: 80,          // 危险民乱阈值
      HIGH: 60,              // 高民乱阈值
      REDUCTION_PER_TURN: 5, // 每回合自然减少
      INCREASE_PER_DISASTER: 10, // 灾害导致的民乱增加
      INCREASE_PER_HIGH_TAX: 15, // 高税率导致的民乱增加
    },
    // 灾害等级
    DISASTER: {
      NONE: 0,               // 无灾害
      LIGHT: 1,              // 轻度灾害
      MODERATE: 2,           // 中度灾害
      SEVERE: 3,             // 重度灾害
      CATASTROPHIC: 4,       // 毁灭性灾害
    },
    // 贪腐等级
    CORRUPTION: {
      MIN: 0,
      MAX: 100,
      LOW: 30,
      MODERATE: 50,
      HIGH: 70,
      CHANGE_RANGE: 5,       // 每回合变化范围
    },
    // 民心配置
    MORALE: {
      MIN: 0,
      MAX: 100,
      DEFAULT: 50,
      HIGH: 70,
      LOW: 30,
    },
    // 军力配置
    MILITARY: {
      MIN: 10,
      MAX: 100,
      DEFAULT: 30,
      BORDER_PROVINCE_BONUS: 20, // 边境省份军力加成
    },
    // 粮仓配置（万石）
    GRANARY: {
      MIN: 20,
      MAX: 500,
      DEFAULT: 100,
    },
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
    GRAIN_BASE_RATE: 0.05,             // 基础秋粮结算系数
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

  // 官员系统配置（旧版，向后兼容）
  MINISTER: {
    LOYALTY_REDUCTION_FROM_CORRUPTION: 1, // 贪腐导致的忠诚减少
    CORRUPTION_INCREASE_FROM_NATION: 1,   // 国家贪腐导致的官员贪腐增加
    LOYALTY_CHANGE_RANGE: 3,              // 忠诚变化范围
    CORRUPTION_THRESHOLD: 50,             // 贪腐阈值
    NATION_CORRUPTION_THRESHOLD: 60,      // 国家贪腐阈值
  },

  // ============================================
  // 国家属性配置
  // ============================================
  NATION: {
    // 民心配置
    PEOPLE_MORALE: {
      MIN: 0,
      MAX: 100,
      DEFAULT: 50,
      HIGH: 70,
      LOW: 30,
      CRITICAL: 20,
    },
    // 军力配置
    MILITARY_POWER: {
      MIN: 0,
      MAX: 100,
      DEFAULT: 50,
      HIGH: 70,
      LOW: 30,
      DIVISOR: 10,              // 军力计算除数
    },
    // 边患配置
    BORDER_THREAT: {
      MIN: 0,
      MAX: 100,
      DEFAULT: 30,
      HIGH: 60,
      CRITICAL: 80,
      FLUCTUATION: 10,          // 边患波动范围
      INCREASE_ON_LOW_MILITARY: 5, // 低军力导致的边患增加
    },
    // 整体贪腐
    OVERALL_CORRUPTION: {
      MIN: 0,
      MAX: 100,
      DEFAULT: 40,
      HIGH: 60,
      CRITICAL: 80,
    },
    // 农业产出
    AGRICULTURAL_OUTPUT: {
      MIN: 0,
      MAX: 100,
      DEFAULT: 60,
      DISASTER_IMPACT_FACTOR: 10, // 灾害对农业产出的影响因子
    },
    // 民心与民乱关系
    MORALE_UNREST_FACTOR: 100,   // 民心与民乱的关系因子
  },

  // ============================================
  // 游戏结束条件
  // ============================================
  GAME_OVER: {
    // 国库破产
    BANKRUPTCY: {
      GOLD_THRESHOLD: 0,         // 国库低于此值触发
      GRAIN_THRESHOLD: 0,        // 粮食低于此值触发
      CONSECUTIVE_TURNS: 3,      // 连续回合数
    },
    // 民变四起
    REBELLION: {
      PROVINCES_WITH_CRITICAL_UNREST: 5,  // 危险民乱省份数量
      TOTAL_UNREST_AVERAGE: 70,            // 平均民乱阈值
    },
    // 外敌入侵
    INVASION: {
      BORDER_THREAT: 90,         // 边患阈值
      MILITARY_POWER: 20,        // 军力阈值（低于此值）
    },
    // 被废黜
    DEPOSITION: {
      LOYALTY_AVERAGE: 20,       // 平均忠诚度阈值
      CRITICAL_PROVINCES: 10,    // 危险省份数量
    },
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

// ============================================
// NPC 属性验证函数
// ============================================

/**
 * 验证并修正 NPC 忠诚度值
 * @param loyalty 原始忠诚度值
 * @returns 修正后的忠诚度值
 */
export function validateNPCLoyalty(loyalty: number): number {
  return Math.max(GAME_CONFIG.NPC.LOYALTY.MIN, Math.min(GAME_CONFIG.NPC.LOYALTY.MAX, loyalty));
}

/**
 * 验证并修正 NPC 贪腐值
 * @param corruption 原始贪腐值
 * @returns 修正后的贪腐值
 */
export function validateNPCCorruption(corruption: number): number {
  return Math.max(GAME_CONFIG.NPC.CORRUPTION.MIN, Math.min(GAME_CONFIG.NPC.CORRUPTION.MAX, corruption));
}

/**
 * 验证并修正 NPC 能力值
 * @param competence 原始能力值
 * @returns 修正后的能力值
 */
export function validateNPCCompetence(competence: number): number {
  return Math.max(GAME_CONFIG.NPC.COMPETENCE.MIN, Math.min(GAME_CONFIG.NPC.COMPETENCE.MAX, competence));
}

// ============================================
// 省份属性验证函数
// ============================================

/**
 * 验证并修正税率
 * @param taxRate 原始税率
 * @returns 修正后的税率
 */
export function validateTaxRate(taxRate: number): number {
  return Math.max(GAME_CONFIG.PROVINCE.TAX_RATE.MIN, Math.min(GAME_CONFIG.PROVINCE.TAX_RATE.MAX, taxRate));
}

/**
 * 验证并修正民乱值
 * @param unrest 原始民乱值
 * @returns 修正后的民乱值
 */
export function validateUnrest(unrest: number): number {
  return Math.max(GAME_CONFIG.PROVINCE.UNREST.MIN, Math.min(GAME_CONFIG.PROVINCE.UNREST.MAX, unrest));
}

/**
 * 验证并修正民心值
 * @param morale 原始民心值
 * @returns 修正后的民心值
 */
export function validateMorale(morale: number): number {
  return Math.max(GAME_CONFIG.PROVINCE.MORALE.MIN, Math.min(GAME_CONFIG.PROVINCE.MORALE.MAX, morale));
}

/**
 * 获取税率等级标签
 * @param taxRate 税率
 * @returns 税率等级标签
 */
export function getTaxRateLevelLabel(taxRate: number): string {
  const levels = GAME_CONFIG.PROVINCE.TAX_RATE.LEVELS;
  for (const [, level] of Object.entries(levels)) {
    if (taxRate >= level.min && taxRate < level.max) {
      return level.label;
    }
  }
  return '未知';
}

// ============================================
// 国家属性验证函数
// ============================================

/**
 * 验证并修正国家军力值
 * @param power 原始军力值
 * @returns 修正后的军力值
 */
export function validateMilitaryPower(power: number): number {
  return Math.max(GAME_CONFIG.NATION.MILITARY_POWER.MIN, Math.min(GAME_CONFIG.NATION.MILITARY_POWER.MAX, power));
}

/**
 * 验证并修正国家边患值
 * @param threat 原始边患值
 * @returns 修正后的边患值
 */
export function validateBorderThreat(threat: number): number {
  return Math.max(GAME_CONFIG.NATION.BORDER_THREAT.MIN, Math.min(GAME_CONFIG.NATION.BORDER_THREAT.MAX, threat));
}

/**
 * 验证并修正国家整体贪腐值
 * @param corruption 原始贪腐值
 * @returns 修正后的贪腐值
 */
export function validateOverallCorruption(corruption: number): number {
  return Math.max(GAME_CONFIG.NATION.OVERALL_CORRUPTION.MIN, Math.min(GAME_CONFIG.NATION.OVERALL_CORRUPTION.MAX, corruption));
}
