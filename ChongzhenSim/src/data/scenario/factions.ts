// 势力配置：开局存在势力 + 后期加入势力 + 加入/退出规则

export type FactionStatus = 'active' | 'inactive' | 'destroyed'

export interface Faction {
  id: string
  name: string
  support: number          // 支持度 0-100
  isPowerful: boolean      // 是否当前掌权
  status: FactionStatus
  // 加入触发条件（inactive → active）
  joinConditions?: {
    minPeopleMorale?: number      // 民心低于此值触发
    shaanxiDisasterTurns?: number // 陕西连续灾荒回合数
    requireFaction?: string       // 需要某势力存在
    requireCharacterDead?: string // 需要某人物死亡
    fiscalDeficitMin?: number     // 财政赤字超过此值
    borderThreatMin?: number      // 边患超过此值
    tradeOpen?: boolean           // 需要开放海禁
  }
  // 退出/灭亡条件（active → destroyed）
  destroyConditions: {
    coreCharactersAllDead?: boolean // 核心人物全部死亡
    supportBelow?: number           // 支持度低于此值持续N季度
    supportBelowTurns?: number
    militaryWiped?: boolean         // 军事势力被全歼
    playerForceDestroy?: boolean    // 玩家强制清洗
  }
  canRevive: boolean       // 灭亡后是否可复活
  destroyConsequences: string[] // 灭亡后果描述
}

export const FACTIONS: Faction[] = [
  // ── 开局已存在势力 ──
  {
    id: 'eunuch_party',
    name: '阉党',
    support: 60,
    isPowerful: true,
    status: 'active',
    destroyConditions: {
      coreCharactersAllDead: true,
      supportBelow: 0,
      playerForceDestroy: true,
    },
    canRevive: false,
    destroyConsequences: [
      '阉党支持度归零',
      '相关大臣集体隐退',
      '东林党趁机上台',
    ],
  },
  {
    id: 'donglin',
    name: '东林党',
    support: 35,
    isPowerful: false,
    status: 'active',
    destroyConditions: {
      supportBelow: 10,
      supportBelowTurns: 2,
    },
    canRevive: false,
    destroyConsequences: [
      '清廉派官员集体离场',
      '税制改革路线关闭',
    ],
  },
  {
    id: 'civil_officials',
    name: '文官集团',
    support: 40,
    isPowerful: true,
    status: 'active',
    destroyConditions: {},  // 永不灭亡，只失势
    canRevive: true,
    destroyConsequences: [],
  },
  {
    id: 'guanning_army',
    name: '关宁军',
    support: 45,
    isPowerful: true,
    status: 'active',
    destroyConditions: {
      militaryWiped: true,
    },
    canRevive: false,
    destroyConsequences: [
      '辽东防线崩溃',
      '边患值立即+30',
    ],
  },
  {
    id: 'royal_clan',
    name: '宗室',
    support: 30,
    isPowerful: false,
    status: 'active',
    destroyConditions: {
      playerForceDestroy: true,
      supportBelow: 0,
    },
    canRevive: false,
    destroyConsequences: ['宗室离心，地方动乱+10'],
  },
  // ── 后期加入势力 ──
  {
    id: 'shanxi_merchants',
    name: '晋商集团',
    support: 0,
    isPowerful: false,
    status: 'inactive',
    joinConditions: {
      fiscalDeficitMin: 60,
      tradeOpen: true,
    },
    destroyConditions: { playerForceDestroy: true },
    canRevive: false,
    destroyConsequences: ['边境贸易断绝', '财政-10/季度'],
  },
  {
    id: 'bandits_gao',
    name: '流寇（高迎祥）',
    support: 0,
    isPowerful: false,
    status: 'inactive',
    joinConditions: {
      minPeopleMorale: 35,
      shaanxiDisasterTurns: 2,
    },
    destroyConditions: { militaryWiped: true },
    canRevive: false,
    destroyConsequences: ['高迎祥战死后李自成接替'],
  },
  {
    id: 'li_zicheng',
    name: '李自成',
    support: 0,
    isPowerful: false,
    status: 'inactive',
    joinConditions: {
      requireFaction: 'bandits_gao',
      requireCharacterDead: 'gao_yingxiang',
    },
    destroyConditions: { militaryWiped: true },
    canRevive: false,
    destroyConsequences: ['农民军彻底瓦解'],
  },
  {
    id: 'zhang_xianzhong',
    name: '张献忠',
    support: 0,
    isPowerful: false,
    status: 'inactive',
    joinConditions: {
      requireFaction: 'bandits_gao',
      minPeopleMorale: 40,
    },
    destroyConditions: { militaryWiped: true },
    canRevive: false,
    destroyConsequences: ['西南流寇瓦解'],
  },
  {
    id: 'houjin',
    name: '后金',
    support: 0,
    isPowerful: false,
    status: 'active',  // 初始就在，永不自动退出
    destroyConditions: { militaryWiped: true },
    canRevive: false,
    destroyConsequences: ['边患彻底解除，北方安定'],
  },
]
