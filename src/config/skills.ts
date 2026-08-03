import type { SkillBook, SkillDef } from '../game/types';

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  技能 & 技能书配置                                         ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  · 所有技能全修士共通，无职业限制。                        ║
 * ║  · 技能不会随升级自动习得，必须使用「技能书」学习。        ║
 * ║  · 每个技能对应且仅对应一本技能书（固定品质、只有一级）。  ║
 * ║  · 每本技能书都有最低境界要求 reqLevel，未达境界不可参悟。 ║
 * ║  · 学会后须在 K 面板装备到 1~9 快捷槽方可使用。            ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const FLY_DRAIN = 8;     // 御剑飞行每秒灵力消耗
const BLINK_RANGE = 300; // 缩地成寸最大瞬移距离

export const SKILLS: SkillDef[] = [
  /* ── 剑法系 ── */
  {
    id: 'power_slash', name: '破岳剑诀',
    maxLevel: 1, kind: 'melee', mpCost: 8, cooldown: 2.2,
    element: 'metal',
    mult: () => 2.4,
    desc: () => '凝真元于剑锋，斩出破岳一击，造成 240% 威力伤害（受金灵根加成）',
    tag: '剑法', color: '#ffd97a',
  },
  {
    id: 'whirlwind', name: '游龙剑阵',
    maxLevel: 1, kind: 'spin', mpCost: 16, cooldown: 5,
    element: 'metal',
    mult: () => 1.7,
    desc: () => '剑气化龙绕身游走，对周围所有敌人造成 170% 威力伤害（受金灵根加成）',
    tag: '剑法', color: '#ffd97a',
  },
  {
    id: 'sword_heart', name: '剑心通明',
    maxLevel: 1, kind: 'buff', mpCost: 22, cooldown: 24,
    element: 'metal',
    mult: () => 1.45,
    desc: () => '明悟剑心，15 秒内所有伤害提升 45%',
    tag: '剑法', color: '#ffd97a',
  },
  {
    id: 'giant_sword', name: '巨剑术',
    maxLevel: 1, kind: 'giant_sword', mpCost: 28, cooldown: 8,
    element: 'metal',
    mult: () => 3.2,
    desc: () => '召唤一柄金色巨灵大剑向前方缓慢推进，持续穿透沿途所有敌人并造成高额贯穿伤害（受金灵根加成）',
    tag: '剑法', color: '#ffb347',
  },
  {
    id: 'flying_swords', name: '万剑决',
    maxLevel: 1, kind: 'flying_swords', mpCost: 36, cooldown: 12,
    element: 'metal',
    mult: () => 0.85, // 每柄剑伤害
    desc: () => '召唤 8 柄灵光飞剑盘旋飞出，自动锁定追踪附近敌人并疾射攻击（受金灵根加成）',
    tag: '剑法', color: '#aee6ff',
  },
  {
    id: 'shadow_slash', name: '无影斩',
    maxLevel: 1, kind: 'dash', mpCost: 14, cooldown: 4,
    element: 'metal',
    mult: () => 2.6,
    desc: () => '身化残影朝鼠标方向疾掠而过，剑锋所至斩击沿途全部敌人，每个造成 260% 威力伤害（受金灵根加成）',
    tag: '剑法', color: '#d8f0ff',
  },

  /* ── 术法系 ── */
  {
    id: 'icebolt', name: '玄冰箭',
    maxLevel: 1, kind: 'ice', mpCost: 3, cooldown: 0.1, // 0.1s CD 类似冲锋枪
    element: 'water',
    mult: () => 0.65,
    desc: () => '极速连发玄冰寒刺（CD 0.1s，按住左键如冲锋枪般倾泻），命中对敌人造成减速（受水灵根加成）',
    tag: '术法', color: '#8fe6ff',
  },
  {
    id: 'fireball', name: '离火',
    maxLevel: 1, kind: 'fire', mpCost: 22, cooldown: 5,
    element: 'fire',
    mult: () => 1.5, // 5颗火球各150%伤害
    desc: () => '祭出南离真火，以扇形朝前散射出 5 颗狂暴火球，产生大范围高额轰炸（受火灵根加成）',
    tag: '术法', color: '#ff7a3a',
  },
  {
    id: 'thunder', name: '天雷决',
    maxLevel: 1, kind: 'thunder', mpCost: 35, cooldown: 10,
    element: 'metal',
    mult: (lv) => 4.5 + lv * 1.5, // 蓄力狙击伤害高
    desc: () => '长按左键聚气蓄力（最高 2 秒），松开后如狙击枪般贯穿射出超远距离极光天雷，造成毁天灭地的爆发伤害（受金灵根加成）',
    tag: '术法', color: '#ffe97a',
  },

  /* ── 心法（被动，学会即生效，无需装备） ── */
  {
    id: 'body_temper', name: '强身健体',
    maxLevel: 1, kind: 'buff', mpCost: 0, cooldown: 0,
    element: 'wood',
    passive: true,
    passiveFx: { hpPct: 0.30, speedPct: 0.18, jumpPct: 0.15 },
    mult: () => 0,
    desc: () => '淬炼肉身根基：气血上限 +30%，移动速度 +18%，跳跃高度 +15%（受木灵根滋养）',
    tag: '心法', color: '#7ae06a',
  },
  {
    id: 'spirit_shield', name: '灵力护体',
    maxLevel: 1, kind: 'buff', mpCost: 0, cooldown: 0,
    element: 'earth',
    passive: true,
    autoLearnLevel: 10, // 筑基初期自动领悟
    passiveFx: { mpShieldPct: 0.40, mpShieldCost: 0.8 },
    mult: () => 0,
    desc: () => '真元自动护体：受创时 40% 伤害转由灵力承担（每点伤害耗 0.8 灵力），灵力枯竭则失效',
    tag: '心法', color: '#7ab8ff',
  },
  {
    id: 'spirit_spring', name: '灵力泉涌',
    maxLevel: 1, kind: 'buff', mpCost: 0, cooldown: 0,
    element: 'water',
    passive: true,
    passiveFx: { mpPct: 0.50, mpRegenMult: 2.2 },
    mult: () => 0,
    desc: () => '灵台化作灵泉：灵力上限 +50%，灵力回复速度提升至 2.2 倍（受水灵根滋养）',
    tag: '心法', color: '#bfe9ff',
  },
  {
    id: 'light_escape', name: '遁光',
    maxLevel: 1, kind: 'buff', mpCost: 0, cooldown: 0,
    element: 'wood',
    passive: true,
    autoLearnLevel: 18, // 元婴后期自动领悟
    passiveFx: { lightFlight: true, flightSpeedPct: 1.0 },
    mult: () => 0,
    desc: () => '元婴后期自生遁光：按住空格即可平地起飞，常态可悬停空中；飞行速度 +100%，缩地成寸后亦可停在空中',
    tag: '心法', color: '#fff1a8',
  },

  /* ── 身法 & 御空 ── */
  {
    id: 'blink', name: '缩地成寸',
    maxLevel: 1, kind: 'blink', mpCost: 18, cooldown: 6,
    element: 'wood',
    range: () => BLINK_RANGE, mult: () => 0,
    desc: () => `踏罡步斗，瞬移到鼠标位置（最远 ${BLINK_RANGE} 距，超出则取极限处），落点短暂免伤 0.4 秒`,
    tag: '身法', color: '#b9ffcf',
  },
  {
    id: 'sword_flight', name: '御剑飞行',
    maxLevel: 1, kind: 'fly', mpCost: 12, cooldown: 10,
    element: 'metal',
    drain: () => FLY_DRAIN, mult: () => 0,
    desc: () => `踏剑凌空自在飞行，↑↓←→ 操控；持续消耗 ${FLY_DRAIN} 灵力/秒，再次施放收剑落地`,
    tag: '御空', color: '#bfe9ff',
  },
];

export const SKILL_MAP = new Map(SKILLS.map((s) => [s.id, s]));
export const skillById = (id: string): SkillDef | undefined => SKILL_MAP.get(id);

/* ════════════════════ 技能书配置 ════════════════════ */

export const SKILL_BOOKS: SkillBook[] = [
  {
    id: 'book_power_slash', skillId: 'power_slash', name: '《破岳剑诀》',
    rarity: 0, reqLevel: 1,
    desc: '入门剑诀，凡有剑者皆可参悟',
  },
  {
    id: 'book_icebolt', skillId: 'icebolt', name: '《玄冰箭秘籍》',
    rarity: 0, reqLevel: 2,
    desc: '记载玄冰疾射之术，灵力激荡如疾风骤雨',
  },
  {
    id: 'book_fireball', skillId: 'fireball', name: '《离火真经》',
    rarity: 1, reqLevel: 4,
    desc: '南离离火扇形散射法门，威势绝伦',
  },
  {
    id: 'book_whirlwind', skillId: 'whirlwind', name: '《游龙剑阵》',
    rarity: 1, reqLevel: 6,
    desc: '剑气化龙的群攻剑阵，须有练气中期的真元底子',
  },
  {
    id: 'book_giant_sword', skillId: 'giant_sword', name: '《巨剑术》',
    rarity: 1, reqLevel: 8,
    desc: '聚天地金气凝化巨大飞剑，开山破敌，威不可挡',
  },
  {
    id: 'book_shadow_slash', skillId: 'shadow_slash', name: '《无影斩》',
    rarity: 1, reqLevel: 5,
    desc: '身法与剑意合一的疾掠斩击，来去无影',
  },
  {
    id: 'book_sword_heart', skillId: 'sword_heart', name: '《剑心通明》',
    rarity: 2, reqLevel: 9,
    desc: '明悟剑心之法，非练气圆满者不可窥',
  },
  {
    id: 'book_blink', skillId: 'blink', name: '《缩地成寸》',
    rarity: 2, reqLevel: 10,
    desc: '踏罡步斗的上乘身法，须筑基之后方可修习',
  },
  {
    id: 'book_sword_flight', skillId: 'sword_flight', name: '《御剑飞行》',
    rarity: 2, reqLevel: 10,
    desc: '御剑凌空之术，唯筑基修士的道基能承其消耗',
  },
  {
    id: 'book_flying_swords', skillId: 'flying_swords', name: '《万剑决》',
    rarity: 2, reqLevel: 11,
    desc: '引万剑破空自动追敌的至上御剑秘录',
  },
  {
    id: 'book_thunder', skillId: 'thunder', name: '《天雷决》',
    rarity: 3, reqLevel: 12,
    desc: '凝聚九天玄雷并精准狙杀妖物的无上雷法',
  },
  /* ---- 心法秘籍（被动） ---- */
  {
    id: 'book_body_temper', skillId: 'body_temper', name: '《强身健体诀》',
    rarity: 0, reqLevel: 1,
    desc: '外门弟子必修的淬体心法，参悟后气血、身法俱增',
  },
  {
    id: 'book_spirit_spring', skillId: 'spirit_spring', name: '《灵力泉涌诀》',
    rarity: 2, reqLevel: 7,
    desc: '拓宽灵台经脉的上乘心法，灵力大增且生生不息',
  },
  // 注：《灵力护体》为筑基自动领悟，不对外售卖
];

export const BOOK_MAP = new Map(SKILL_BOOKS.map((b) => [b.id, b]));
export const bookById = (id: string): SkillBook | undefined => BOOK_MAP.get(id);
export const bookOfSkill = (skillId: string): SkillBook | undefined =>
  SKILL_BOOKS.find((b) => b.skillId === skillId);
