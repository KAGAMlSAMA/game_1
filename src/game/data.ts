/**
 * 数据层 —— 技能 / 敌人 / 地图 / 道具 / 职业 的具体配置已全部迁移到
 * `src/config/` 目录（见 config/index.ts），方便后期扩展。
 * 这里只保留核心数值公式，并统一向外转发配置，旧导入路径不受影响。
 */
import { MAPS } from '../config/maps';
import { realmOf } from '../config/realms';

export * from '../config';

export const MAP_ORDER = MAPS.map((m) => m.id);

/**
 * 突破到下一境界所需修为
 * 基础曲线 × 大境界系数（练气 ×1、筑基 ×1.3、结丹 ×1.6 …）
 */
export function expNeed(level: number): number {
  const tier = realmOf(level).tier;
  return Math.floor(40 * Math.pow(level, 1.5) * (1 + tier * 0.3));
}

/** 掉落装备的目标等级（围绕怪物等级小幅浮动） */
export function pickItemLevel(mobLevel: number): number {
  return Math.max(1, Math.min(18, Math.round(mobLevel + Math.random() * 5 - 1.5)));
}
