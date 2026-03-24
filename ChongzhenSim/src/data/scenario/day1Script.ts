import type { GameEffect } from '../../core/types'

// 单个选项的类型
export interface MemorialChoice {
  id: string
  text: string                    // 选项正文（皇帝的决策语）
  hint: string                    // 鼠标悬停时显示的暗示
  effects: GameEffect[]           // 选择后立即生效的效果列表
  ministerId?: string             // 影响的大臣 id（可选）
  nextMemorialId?: string         // 此选项会解锁的下一条奏报 id（可选，用于链式剧情）
  locksEventIds?: string[]        // 此选项会永久锁死的 scriptedEvents id
  unlocksEventIds?: string[]      // 此选项会激活的 scriptedEvents id
}

// 单个奏报（大臣上奏）的类型
export interface CourtMemorial {
  id: string
  ministerId: string              // 奏报的大臣 id（对应 historicalCharacters.ts）
  ministerName: string            // 显示名称
  ministerTitle: string           // 官职
  ministerFaction: string         // 派系
  urgencyLevel: 'urgent' | 'important' | 'normal'  // 紧急程度（影响展示顺序）
  subject: string                 // 奏报主题（一行标题）
  content: string                 // 奏报正文（200字以内，文言文风格）
  choices: MemorialChoice[]       // 2-3个选项
  immediateEffects?: GameEffect[] // 不论玩家选什么都立即触发的效果（可选）
  backgroundContext?: string      // 历史背景小字（展示在奏报底部）
}

// 第一天剧本：崇祯元年正月·早朝
// 共3条奏报，按触发顺序排列
export const DAY1_SCRIPT: CourtMemorial[] = [

  // ── 第一奏：魏忠贤去留 ──────────────────────────
  {
    id: 'memorial_001_wei_zhongxian',
    ministerId: 'wang_chengen',
    ministerName: '王承恩',
    ministerTitle: '司礼监秉笔太监',
    ministerFaction: '帝党',
    urgencyLevel: 'urgent',
    subject: '魏忠贤去留，请陛下圣裁',
    content:
      '启禀陛下，魏忠贤把持朝政多年，党羽遍布内外，如今先帝驾崩，新皇即位，朝野皆观陛下如何处置此人。若留之，则阉党气焰难压；若除之，则须防其党羽狗急跳墙。奴婢不敢擅专，唯请陛下圣裁。',
    choices: [
      {
        id: 'choice_execute_wei',
        text: '即刻赐死，传首九边',
        hint: '阉党立刻土崩瓦解，但朝局将剧烈震荡',
        effects: [
          { type: 'nation', target: 'emperor', field: 'prestige', delta: 15, description: '威望+15（雷厉风行）' },
          { type: 'minister', target: 'eunuch_party', field: 'support', delta: -60, description: '阉党支持度-60' },
          { type: 'minister', target: 'donglin', field: 'support', delta: 25, description: '东林党好感+25' },
          { type: 'nation', target: 'all', field: 'factionConflict', delta: 20, description: '党争短期激化+20' },
        ],
        ministerId: 'wei_zhongxian',
        unlocksEventIds: ['purge_eunuch_party'],
        locksEventIds: ['eunuch_party_comeback'],
      },
      {
        id: 'choice_exile_wei',
        text: '流放凤阳，令其守陵',
        hint: '温和处置，阉党失势但未灭，东林党略感失望',
        effects: [
          { type: 'nation', target: 'emperor', field: 'prestige', delta: 8, description: '威望+8' },
          { type: 'minister', target: 'eunuch_party', field: 'support', delta: -30, description: '阉党支持度-30' },
          { type: 'minister', target: 'donglin', field: 'support', delta: 10, description: '东林党好感+10' },
        ],
        ministerId: 'wei_zhongxian',
      },
      {
        id: 'choice_keep_wei',
        text: '暂且留用，以作制衡',
        hint: '借阉党压制文官，但党争将持续激化',
        effects: [
          { type: 'nation', target: 'all', field: 'factionConflict', delta: 15, description: '党争值+15' },
          { type: 'minister', target: 'donglin', field: 'support', delta: -20, description: '东林党强烈不满' },
          { type: 'minister', target: 'eunuch_party', field: 'support', delta: 10, description: '阉党士气+10' },
        ],
        ministerId: 'wei_zhongxian',
        unlocksEventIds: ['eunuch_party_rebellion'],
      },
    ],
    backgroundContext: '魏忠贤，北直隶肃宁人，天启年间权倾朝野，人称"九千岁"。东林党人对其恨之入骨，各地为其建生祠者无数。',
  },

  // ── 第二奏：陕西旱灾赈济 ────────────────────────
  {
    id: 'memorial_002_shaanxi_drought',
    ministerId: 'bi_ziyan',
    ministerName: '毕自严',
    ministerTitle: '户部尚书',
    ministerFaction: '东林党',
    urgencyLevel: 'urgent',
    subject: '陕西旱情告急，请拨帑银赈济',
    content:
      '臣户部尚书毕自严叩禀陛下，陕西延安、庆阳等府，连岁大旱，赤地千里，饿殍载道。地方官员奏报，流民已逾十万，若不速行赈济，恐生民变。然国库现存帑银仅余八百余万两，臣请陛下圣断：是拨银赈灾，抑或令地方自筹？',
    choices: [
      {
        id: 'choice_relief_full',
        text: '拨银五十万两，立即赈济',
        hint: '大幅安抚民心，但国库吃紧，且能遏制流寇萌芽',
        effects: [
          { type: 'treasury', target: 'treasury', field: 'gold', delta: -50, description: '国库-50万两' },
          { type: 'nation', target: 'all', field: 'peopleMorale', delta: 12, description: '民心+12' },
          { type: 'province', target: 'shaanxi', field: 'civilUnrest', delta: -25, description: '陕西民乱-25' },
          { type: 'minister', target: 'donglin', field: 'support', delta: 10, description: '东林党好感+10' },
        ],
        locksEventIds: ['shaanxi_uprising_early'],
      },
      {
        id: 'choice_relief_partial',
        text: '拨银二十万两，令地方配合',
        hint: '折中方案，效果有限但保住国库',
        effects: [
          { type: 'treasury', target: 'treasury', field: 'gold', delta: -20, description: '国库-20万两' },
          { type: 'nation', target: 'all', field: 'peopleMorale', delta: 5, description: '民心+5' },
          { type: 'province', target: 'shaanxi', field: 'civilUnrest', delta: -10, description: '陕西民乱-10' },
        ],
      },
      {
        id: 'choice_no_relief',
        text: '国库空虚，令地方自筹',
        hint: '节省国库，但陕西局势将迅速恶化，流寇或由此而起',
        effects: [
          { type: 'nation', target: 'all', field: 'peopleMorale', delta: -12, description: '民心-12' },
          { type: 'province', target: 'shaanxi', field: 'civilUnrest', delta: 25, description: '陕西民乱+25' },
          { type: 'minister', target: 'donglin', field: 'support', delta: -8, description: '东林党失望' },
        ],
        unlocksEventIds: ['shaanxi_uprising_early', 'bandits_gao_joins'],
      },
    ],
    immediateEffects: [
      { type: 'province', target: 'shaanxi', field: 'disasterLevel', delta: 1, description: '陕西天灾等级+1（旱情确认）' },
    ],
    backgroundContext: '陕西自天启年间便旱蝗频仍，至崇祯元年已是数年连旱。毕自严为户部尚书，以廉洁著称，是东林党中少有的实务派。',
  },

  // ── 第三奏：辽东军饷 ────────────────────────────
  {
    id: 'memorial_003_liaodong_salary',
    ministerId: 'liang_tingdong',
    ministerName: '梁廷栋',
    ministerTitle: '兵部右侍郎',
    ministerFaction: '中立',
    urgencyLevel: 'important',
    subject: '辽东关宁军军饷告急，请速拨补发',
    content:
      '臣兵部右侍郎梁廷栋叩禀陛下，辽东关宁军已三月未足额发饷，袁崇焕等将领屡次催促，士卒怨声渐起，恐生兵变。后金努尔哈赤虽已薨，其子皇太极继位，并未放弃攻明之志，辽东防线万不可有失。臣请陛下即行拨付欠饷，以安军心。',
    choices: [
      {
        id: 'choice_pay_full_salary',
        text: '足额补发，犒赏三军',
        hint: '关宁军士气大振，袁崇焕信任度提升，但国库再度吃紧',
        effects: [
          { type: 'treasury', target: 'treasury', field: 'gold', delta: -80, description: '国库-80万两（军饷）' },
          { type: 'nation', target: 'all', field: 'militaryPower', delta: 10, description: '军力+10' },
          { type: 'nation', target: 'all', field: 'borderThreat', delta: -8, description: '边患-8（军心稳固）' },
          { type: 'minister', target: 'guanning_army', field: 'support', delta: 20, description: '关宁军忠诚+20' },
        ],
      },
      {
        id: 'choice_pay_partial_salary',
        text: '先拨半数，余款下季补足',
        hint: '暂时安抚，但将领们心存芥蒂',
        effects: [
          { type: 'treasury', target: 'treasury', field: 'gold', delta: -40, description: '国库-40万两' },
          { type: 'nation', target: 'all', field: 'militaryPower', delta: 4, description: '军力+4' },
          { type: 'minister', target: 'guanning_army', field: 'support', delta: 5, description: '关宁军勉强接受' },
        ],
      },
      {
        id: 'choice_delay_salary',
        text: '国库告急，令其宽限两月',
        hint: '节省开支，但关宁军忠诚度下降，边患风险增加',
        effects: [
          { type: 'nation', target: 'all', field: 'borderThreat', delta: 10, description: '边患+10（军心浮动）' },
          { type: 'nation', target: 'all', field: 'militaryPower', delta: -8, description: '军力-8' },
          { type: 'minister', target: 'guanning_army', field: 'support', delta: -15, description: '关宁军强烈不满' },
        ],
        unlocksEventIds: ['guanning_army_unrest'],
      },
    ],
    backgroundContext: '关宁锦防线是大明对抗后金的核心防御体系，由袁崇焕督建。军饷充足与否直接决定这道防线的牢固程度。皇太极于天启六年继位，野心不减。',
  },
]

// 第一天剧本元数据
export const DAY1_META = {
  turn: 1,
  date: '崇祯元年正月',
  phase: 'morning' as const,
  sessionTitle: '崇祯元年正月·早朝',
  openingNarration: '崇祯元年正月，天启皇帝驾崩未久，新皇朱由检于皇极殿首次临朝。朝野人心惶惶，内有阉党余孽，外有后金虎视。诸臣肃立，大殿寂然，等待这位年轻皇帝的第一道圣裁。',
  closingNarration: '诸臣叩首，山呼万岁。早朝已毕，各项旨意即将传达六部。天下万机，皆系于此一朝之决。',
  maxMemorials: 3,       // 本场最多奏报数量
  mode: 'local' as 'local' | 'llm',  // 当前模式
}
