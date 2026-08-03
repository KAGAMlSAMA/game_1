import type { ArtifactDef, ArtifactId } from '../game/types';

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  法宝配置 · ARTIFACTS                                      ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  法宝装备在专属的「法宝」栏，不提供任何属性加成，          ║
 * ║  只提供独特的战斗机制。仅由地图 BOSS 随机掉落。            ║
 * ║                                                          ║
 * ║  · 乾坤珠 qiankun_bead                                    ║
 * ║      可在 K 面板中绑定一个已装备的攻击法诀，              ║
 * ║      每 5 秒自动施放一次：不耗灵力、不占用手动冷却。       ║
 * ║  · 青竹剑 green_bamboo_sword                              ║
 * ║      常态召唤四柄飞剑环绕自身，持续切割周围敌人。          ║
 * ╚══════════════════════════════════════════════════════════╝
 */

/** 乾坤珠自动施放间隔（秒） */
export const QIANKUN_INTERVAL = 5;

/** 青竹剑：环绕剑数量 / 半径 / 转速 / 单次伤害倍率 / 同一目标的再命中间隔 */
export const BAMBOO_SWORD_COUNT = 4;
export const BAMBOO_RADIUS = 78;
export const BAMBOO_SPIN = 2.4;        // 弧度/秒
export const BAMBOO_MULT = 0.42;       // 每次切割伤害倍率
export const BAMBOO_HIT_CD = 0.6;      // 同一敌人再次被切割的间隔

export const ARTIFACTS: Record<ArtifactId, ArtifactDef> = {
  qiankun_bead: {
    id: 'qiankun_bead',
    name: '乾坤珠',
    rarity: 2,
    color: '#c06bff',
    desc: '内蕴乾坤，可存一道法诀自行运转',
    detail: [
      `可寄存一道已装备的攻击法诀（K 面板中设置）`,
      `每 ${QIANKUN_INTERVAL} 秒自动施放一次寄存的法诀`,
      '自动施放不消耗灵力',
      '自动施放不占用该法诀的手动冷却',
    ],
  },
  green_bamboo_sword: {
    id: 'green_bamboo_sword',
    name: '青竹剑',
    rarity: 2,
    color: '#7ae06a',
    desc: '四柄青竹飞剑绕身而行，斩尽近敌',
    detail: [
      `常态召唤 ${BAMBOO_SWORD_COUNT} 柄飞剑环绕自身`,
      `环绕半径约 ${BAMBOO_RADIUS}，持续切割范围内的敌人`,
      `每次切割造成 ${Math.round(BAMBOO_MULT * 100)}% 威力伤害`,
      `同一敌人每 ${BAMBOO_HIT_CD} 秒可被再次切中`,
    ],
  },
};

export const artifactById = (id: ArtifactId): ArtifactDef => ARTIFACTS[id];
export const ALL_ARTIFACTS: ArtifactDef[] = Object.values(ARTIFACTS);
