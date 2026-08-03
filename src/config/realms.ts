/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  境界配置表 · REALMS + 突破试炼 · REALM_GATES              ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  等级与境界 1:1 对应：Lv.1 = 练气一层，每升一级进阶一境。  ║
 * ║                                                          ║
 * ║  RealmDef 字段：                                          ║
 * ║   level  对应角色等级                                     ║
 * ║   name   境界全称（练气三层 / 筑基初期 …）                 ║
 * ║   stage  所属大境界（练气期 / 筑基期 / 结丹期 …）          ║
 * ║   tier   大境界序号，用于配色与修为倍率（见 expNeed）      ║
 * ║                                                          ║
 * ║  REALM_GATES 突破试炼：                                   ║
 * ║   fromLevel  处于该等级且修为圆满时进入「瓶颈」            ║
 * ║   quest      完成后方可突破；填 null = 试炼尚未开放，      ║
 * ║              修为满即自动突破（后续版本再补内容）          ║
 * ║   quest.id   引擎的任务标记，'slay:<敌人id>' = 击败该敌人  ║
 * ║                                                          ║
 * ║  想新增境界：往 REALMS 里按 level 顺序追加即可；           ║
 * ║  想新增试炼：往 REALM_GATES 里追加 { fromLevel, quest }。  ║
 * ╚══════════════════════════════════════════════════════════╝
 */

export interface RealmDef {
  level: number;
  name: string;
  stage: string;
  tier: number;
}

export interface BreakthroughQuest {
  /** 任务标记；'slay:xxx' 会在击杀对应敌人时自动完成 */
  id: string;
  title: string;
  detail: string;
}

export interface RealmGate {
  fromLevel: number;
  quest: BreakthroughQuest | null;
}

/** 各大境界配色（tier 索引） */
export const STAGE_COLOR = [
  '#8fd8b0', // 练气
  '#7ad8ff', // 筑基
  '#c9a4ff', // 结丹
  '#ffcf6b', // 元婴
  '#ff9d5a', // 化神
  '#ff6f91', // 炼虚
  '#e8e2ff', // 合体
  '#fff1a8', // 大乘
  '#ffffff', // 渡劫
] as const;

export const REALMS: RealmDef[] = [
  /* ---- 练气期：一层 ~ 九层 ---- */
  { level: 1, name: '练气一层', stage: '练气期', tier: 0 },
  { level: 2, name: '练气二层', stage: '练气期', tier: 0 },
  { level: 3, name: '练气三层', stage: '练气期', tier: 0 },
  { level: 4, name: '练气四层', stage: '练气期', tier: 0 },
  { level: 5, name: '练气五层', stage: '练气期', tier: 0 },
  { level: 6, name: '练气六层', stage: '练气期', tier: 0 },
  { level: 7, name: '练气七层', stage: '练气期', tier: 0 },
  { level: 8, name: '练气八层', stage: '练气期', tier: 0 },
  { level: 9, name: '练气九层', stage: '练气期', tier: 0 },

  /* ---- 筑基期 ---- */
  { level: 10, name: '筑基初期', stage: '筑基期', tier: 1 },
  { level: 11, name: '筑基中期', stage: '筑基期', tier: 1 },
  { level: 12, name: '筑基后期', stage: '筑基期', tier: 1 },

  /* ---- 结丹期 ---- */
  { level: 13, name: '结丹初期', stage: '结丹期', tier: 2 },
  { level: 14, name: '结丹中期', stage: '结丹期', tier: 2 },
  { level: 15, name: '结丹后期', stage: '结丹期', tier: 2 },

  /* ---- 元婴期 ---- */
  { level: 16, name: '元婴初期', stage: '元婴期', tier: 3 },
  { level: 17, name: '元婴中期', stage: '元婴期', tier: 3 },
  { level: 18, name: '元婴后期', stage: '元婴期', tier: 3 },

  /* ---- 以下为预留的高阶境界 ---- */
  { level: 19, name: '化神初期', stage: '化神期', tier: 4 },
  { level: 20, name: '化神中期', stage: '化神期', tier: 4 },
  { level: 21, name: '化神后期', stage: '化神期', tier: 4 },
  { level: 22, name: '炼虚初期', stage: '炼虚期', tier: 5 },
  { level: 23, name: '炼虚中期', stage: '炼虚期', tier: 5 },
  { level: 24, name: '炼虚后期', stage: '炼虚期', tier: 5 },
  { level: 25, name: '合体初期', stage: '合体期', tier: 6 },
  { level: 26, name: '合体中期', stage: '合体期', tier: 6 },
  { level: 27, name: '合体后期', stage: '合体期', tier: 6 },
  { level: 28, name: '大乘初期', stage: '大乘期', tier: 7 },
  { level: 29, name: '大乘中期', stage: '大乘期', tier: 7 },
  { level: 30, name: '大乘后期', stage: '大乘期', tier: 7 },
];

/** 超出配置表时的兜底境界 */
const TRANSCEND: RealmDef = { level: 31, name: '渡劫期', stage: '渡劫期', tier: 8 };

export const MAX_REALM_LEVEL = REALMS[REALMS.length - 1].level;

export function realmOf(level: number): RealmDef {
  if (level >= TRANSCEND.level) return { ...TRANSCEND, level };
  return REALMS[Math.max(0, Math.min(REALMS.length - 1, level - 1))];
}

export function realmColor(level: number): string {
  return STAGE_COLOR[Math.min(STAGE_COLOR.length - 1, realmOf(level).tier)];
}

/**
 * 突破试炼表
 * 目前开放：练气九层 → 筑基初期、筑基后期 → 结丹初期
 * 其余大境界之间的试炼留空（quest: null），修为满即可直接突破
 */
export const REALM_GATES: RealmGate[] = [
  {
    fromLevel: 9,
    quest: {
      id: 'slay:wolfking',
      title: '筑基试炼 · 斩妖狼王',
      detail: '前往【断云剑峡】击败妖王「幽篁妖狼王」，以其妖丹淬炼道基',
    },
  },
  {
    fromLevel: 12,
    quest: {
      id: 'slay:mushking',
      title: '结丹试炼 · 镇压妖王',
      detail: '前往【血月妖宫】击败「赤魇妖王」，凝聚金丹',
    },
  },
  { fromLevel: 15, quest: null }, // 结丹后期 → 元婴初期（试炼待开放）
  { fromLevel: 18, quest: null }, // 元婴后期 → 化神初期（试炼待开放）
  { fromLevel: 21, quest: null },
  { fromLevel: 24, quest: null },
  { fromLevel: 27, quest: null },
];

export function gateAt(level: number): RealmGate | null {
  return REALM_GATES.find((g) => g.fromLevel === level) ?? null;
}
