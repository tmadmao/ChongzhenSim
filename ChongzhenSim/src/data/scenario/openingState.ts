// 1627年冬·崇祯即位·开局全局状态

export const OPENING_STATE = {
  date: '崇祯元年正月',
  year: 1627,
  season: 'winter',
  emperor: {
    prestige: 50,         // 皇帝威望
    managementLevel: 1,   // 管理能力等级
    militaryLevel: 1,     // 军事能力等级
    scholarLevel: 1,      // 学识能力等级
    politicsLevel: 1,     // 政治能力等级
  },
  nationStats: {
    factionConflict: 65,  // 党争值（偏高，即将失控）
    fiscalDeficit: 45,    // 财政赤字%
    peopleMorale: 40,     // 民心
    militaryPower: 50,    // 军力
    shaanxiUnrest: 40,    // 陕西民变强度
    borderThreat: 60,     // 后金威胁
  },
  treasury: {
    gold: 800,            // 初始国库 万两
    grain: 500,           // 初始粮仓 万石
  },
}
