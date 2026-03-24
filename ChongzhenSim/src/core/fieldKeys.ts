/**
 * 統一架構：字段鍵枚舉
 * 
 * 目的：統一所有數據字段的命名，避免字符串動態索引導致的數據「消失」問題
 * 使用方式：使用這些枚舉值而不是硬編碼字符串
 */

// Province 表字段（對應數據庫 provinces 表）
export enum ProvinceField {
  ID = 'id',
  NAME = 'name',
  POPULATION = 'population',
  TAX_RATE = 'taxRate',           // 駝峰命名（TypeScript）
  TAX_RATE_DB = 'tax_rate',       // 下劃線命名（數據庫）
  TAX_REVENUE = 'taxRevenue',
  TAX_REVENUE_DB = 'tax_revenue',
  GRANARY_STOCK = 'granaryStock',
  GRANARY_STOCK_DB = 'granary_stock',
  CIVIL_UNREST = 'civilUnrest',
  CIVIL_UNREST_DB = 'civil_unrest',
  MILITARY_FORCE = 'militaryForce',
  MILITARY_FORCE_DB = 'military_force',
  DISASTER_LEVEL = 'disasterLevel',
  DISASTER_LEVEL_DB = 'disaster_level',
  CORRUPTION_LEVEL = 'corruptionLevel',
  CORRUPTION_LEVEL_DB = 'corruption_level',
  LAT = 'lat',
  LNG = 'lng',
  REGION = 'region'
}

// NationStats 字段
export enum NationField {
  MILITARY_POWER = 'militaryPower',
  PEOPLE_MORALE = 'peopleMorale',
  BORDER_THREAT = 'borderThreat',
  OVERALL_CORRUPTION = 'overallCorruption',
  AGRICULTURAL_OUTPUT = 'agriculturalOutput'
}

// Treasury 字段
export enum TreasuryField {
  GOLD = 'gold',
  GRAIN = 'grain',
  TRANSACTIONS = 'transactions'
}

// Minister 字段
export enum MinisterField {
  ID = 'id',
  NAME = 'name',
  LOYALTY = 'loyalty',
  COMPETENCE = 'competence',
  CORRUPTION = 'corruption',
  FACTION = 'faction',
  TITLE = 'title',
  DEPARTMENT = 'department',
  IS_ALIVE = 'isAlive'
}

// ChangeType 類型
export enum ChangeType {
  TREASURY = 'treasury',
  PROVINCE = 'province',
  FACTION = 'faction',
  NATION = 'nation',
  OFFICIAL = 'official',
  EVENT = 'event'
}

// 字段映射：TypeScript 駝峰命名 -> 數據庫下劃線命名
export const ProvinceFieldMapping: Record<string, string> = {
  [ProvinceField.TAX_RATE]: ProvinceField.TAX_RATE_DB,
  [ProvinceField.TAX_REVENUE]: ProvinceField.TAX_REVENUE_DB,
  [ProvinceField.GRANARY_STOCK]: ProvinceField.GRANARY_STOCK_DB,
  [ProvinceField.CIVIL_UNREST]: ProvinceField.CIVIL_UNREST_DB,
  [ProvinceField.MILITARY_FORCE]: ProvinceField.MILITARY_FORCE_DB,
  [ProvinceField.DISASTER_LEVEL]: ProvinceField.DISASTER_LEVEL_DB,
  [ProvinceField.CORRUPTION_LEVEL]: ProvinceField.CORRUPTION_LEVEL_DB
};

// 反向映射：數據庫下劃線命名 -> TypeScript 駝峰命名
export const ProvinceFieldReverseMapping: Record<string, string> = {
  [ProvinceField.TAX_RATE_DB]: ProvinceField.TAX_RATE,
  [ProvinceField.TAX_REVENUE_DB]: ProvinceField.TAX_REVENUE,
  [ProvinceField.GRANARY_STOCK_DB]: ProvinceField.GRANARY_STOCK,
  [ProvinceField.CIVIL_UNREST_DB]: ProvinceField.CIVIL_UNREST,
  [ProvinceField.MILITARY_FORCE_DB]: ProvinceField.MILITARY_FORCE,
  [ProvinceField.DISASTER_LEVEL_DB]: ProvinceField.DISASTER_LEVEL,
  [ProvinceField.CORRUPTION_LEVEL_DB]: ProvinceField.CORRUPTION_LEVEL
};

/**
 * 將 TypeScript 字段名轉換為數據庫字段名
 */
export function toDbField(tsField: string): string {
  return ProvinceFieldMapping[tsField] || tsField;
}

/**
 * 將數據庫字段名轉換為 TypeScript 字段名
 */
export function toTsField(dbField: string): string {
  return ProvinceFieldReverseMapping[dbField] || dbField;
}
