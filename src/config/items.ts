import type { Rarity, Slot } from '../game/types';

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  道具配置表 · ITEM_POOL + 品质表 · RARITY                  ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  新增装备底材：在 ITEM_POOL 追加 { name, slot, tier }。    ║
 * ║   slot  武器 weapon / 头盔 helmet / 铠甲 armor             ║
 * ║         手套 gloves / 鞋子 shoes                           ║
 * ║   tier  等级需求档位（1~18），决定基础数值与适用等级段。    ║
 * ║  名称含「剑」的底材只掉给战士，其余法杖类掉给法师；        ║
 * ║  护具两类职业通用。实际数值 = 底材公式 × 品质倍率 + 随机词条 ║
 * ║  （生成逻辑见 engine.ts 的 genEquipment）。                ║
 * ╚══════════════════════════════════════════════════════════╝
 */

export const SLOT_NAME: Record<Slot, string> = {
  weapon: '法器', helmet: '冠饰', armor: '道袍', gloves: '护腕', shoes: '步履', artifact: '法宝',
};

export interface ItemBase {
  name: string;
  slot: Slot;
  tier: number;
}

export const ITEM_POOL: ItemBase[] = [
  /* ---- 法器（剑 → 剑修，其余 → 符修） ---- */
  { name: '桃木剑', slot: 'weapon', tier: 1 },
  { name: '黄纸符箓', slot: 'weapon', tier: 1 },
  { name: '寒铁飞剑', slot: 'weapon', tier: 6 },
  { name: '紫晶符笔', slot: 'weapon', tier: 6 },
  { name: '青罡灵剑', slot: 'weapon', tier: 12 },
  { name: '五行玉简', slot: 'weapon', tier: 12 },
  { name: '流云仙剑', slot: 'weapon', tier: 16 },
  { name: '太虚符典', slot: 'weapon', tier: 16 },

  /* ---- 头盔 ---- */
  { name: '粗布道巾', slot: 'helmet', tier: 1 },
  { name: '青玉发冠', slot: 'helmet', tier: 5 },
  { name: '鎏金莲冠', slot: 'helmet', tier: 10 },
  { name: '龙角玄冠', slot: 'helmet', tier: 15 },

  /* ---- 铠甲 ---- */
  { name: '麻布道袍', slot: 'armor', tier: 1 },
  { name: '青纹法衣', slot: 'armor', tier: 5 },
  { name: '秘银护心袍', slot: 'armor', tier: 10 },
  { name: '玄天云纹袍', slot: 'armor', tier: 15 },

  /* ---- 手套 ---- */
  { name: '布纹护腕', slot: 'gloves', tier: 3 },
  { name: '寒铁护腕', slot: 'gloves', tier: 8 },
  { name: '蛟皮护腕', slot: 'gloves', tier: 14 },

  /* ---- 鞋子 ---- */
  { name: '草编云履', slot: 'shoes', tier: 2 },
  { name: '踏岩短靴', slot: 'shoes', tier: 7 },
  { name: '疾风灵履', slot: 'shoes', tier: 14 },
];

/**
 * 品质表：颜色 / 名称 / 数值倍率 / 前缀 / 额外词条数（= rarity 索引）
 * 索引 0 普通 / 1 稀有 / 2 史诗 / 3 传说
 */
export const RARITY_NAME = ['凡品', '灵品', '玄品', '仙品'] as const;
export const RARITY_COLOR = ['#cfd8e3', '#58a8ff', '#c06bff', '#ff9d2e'] as const;
export const RARITY_MULT = [1, 1.4, 1.8, 2.4] as const;
export const RARITY_PREFIX = ['', '蕴灵的 ', '玄纹的 ', '仙篆的 '] as const;

/** 掉落品质掷骰：boost 由玩家神识/机缘提供 */
export function rollRarity(boost = 0): Rarity {
  const r = Math.random() * 100 - boost;
  if (r < 4) return 3;
  if (r < 17) return 2;
  if (r < 45) return 1;
  return 0;
}
