import type { EnemyDef } from '../game/types';

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  敌人配置表 · ENEMIES                                      ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  新增敌人：追加一个条目（key 为唯一 id），再到地图配置的    ║
 * ║  spawns 里引用它即可。                                     ║
 * ║                                                          ║
 * ║  字段说明：                                               ║
 * ║   id      唯一标识（与 key 一致）                          ║
 * ║   name    显示名称（头顶血条、掉落日志）                   ║
 * ║   level   等级（影响掉落装备的等级）                       ║
 * ║   hp/atk/def  基础战斗数值                                ║
 * ║   exp     击杀经验                                        ║
 * ║   speed   移动速度（像素/秒）                              ║
 * ║   aggro   仇恨范围（像素），玩家进入后开始追击             ║
 * ║   w/h     碰撞盒宽高                                      ║
 * ║   boss    可选，true = BOSS（大血条/震地/召唤/传说掉落）   ║
 * ║   kind    外观类型 → 对应 render.ts 中的程序化绘制          ║
 * ║           现有：snail 蜗牛 / mushroom 蘑菇 / slime 水灵    ║
 * ║           / stump 树桩 / cactus 仙人掌 / boar 野猪         ║
 * ║           / golem 石巨人 / flying 飞行 / ranged 远程       ║
 * ║   c       三色配色 [主色，亮色，深色]                      ║
 * ╚══════════════════════════════════════════════════════════╝
 */
export const ENEMIES: Record<string, EnemyDef> = {
  /* ---- 测试木桩（不可击杀，受击显示伤害但自动回满） ---- */
  dummy: {
    id: 'dummy', name: '演武木桩', level: 1, hp: 999999, exp: 0, atk: 0, def: 0, speed: 0, aggro: 0,
    w: 48, h: 70, dummy: true, kind: 'dummy', c: ['#8a6b3e', '#c9975f', '#5c4022'],
  },
  snail: {
    id: 'snail', name: '青苔灵龟', level: 1, hp: 35, exp: 12, atk: 6, def: 0, speed: 36, aggro: 170,
    w: 44, h: 34, kind: 'snail', c: ['#3f9b6b', '#e7d6aa', '#245b45'],
  },
  bsnail: {
    id: 'bsnail', name: '碧水灵龟', level: 3, hp: 62, exp: 22, atk: 10, def: 2, speed: 42, aggro: 190,
    w: 46, h: 36, kind: 'snail', c: ['#38a4b8', '#e9dfbf', '#1e6776'],
  },
  rsnail: {
    id: 'rsnail', name: '赤砂灵龟', level: 5, hp: 98, exp: 36, atk: 15, def: 3, speed: 48, aggro: 200,
    w: 48, h: 38, kind: 'snail', c: ['#c7613c', '#f0ddba', '#873c2a'],
  },
  gshroom: {
    id: 'gshroom', name: '青伞药灵', level: 7, hp: 145, exp: 55, atk: 20, def: 5, speed: 60, aggro: 230,
    w: 46, h: 42, kind: 'mushroom', c: ['#3f9f72', '#f1e1bc', '#255f43'],
  },
  slime: {
    id: 'slime', name: '玉露精怪', level: 9, hp: 185, exp: 75, atk: 25, def: 6, speed: 55, aggro: 240,
    w: 44, h: 36, kind: 'slime', c: ['#7ad7b1', '#d4fff0', '#309474'],
  },
  bshroom: {
    id: 'bshroom', name: '幽蓝伞妖', level: 11, hp: 245, exp: 100, atk: 31, def: 9, speed: 66, aggro: 260,
    w: 48, h: 44, kind: 'mushroom', c: ['#4f77c7', '#efe1c4', '#2f4b94'],
  },
  stump: {
    id: 'stump', name: '枯木树魈', level: 13, hp: 330, exp: 135, atk: 38, def: 13, speed: 58, aggro: 260,
    w: 54, h: 50, kind: 'stump', c: ['#7b5831', '#b38a56', '#46331f'],
  },
  cactus: {
    id: 'cactus', name: '赤莲花妖', level: 15, hp: 430, exp: 175, atk: 46, def: 16, speed: 52, aggro: 250,
    w: 46, h: 56, kind: 'cactus', c: ['#4f9c69', '#d85b6d', '#2f6945'],
  },
  boar: {
    id: 'boar', name: '山魈妖狼', level: 17, hp: 575, exp: 230, atk: 55, def: 20, speed: 105, aggro: 320,
    w: 62, h: 46, kind: 'boar', c: ['#6a5b50', '#c2a078', '#3b3028'],
  },
  golem: {
    id: 'golem', name: '山门石傀', level: 20, hp: 830, exp: 320, atk: 68, def: 28, speed: 40, aggro: 280,
    w: 66, h: 72, kind: 'golem', c: ['#7f8790', '#c4c7bd', '#4f555b'],
  },
  wolfking: {
    id: 'wolfking', name: '幽篁妖狼王', level: 14, hp: 1900, exp: 900, atk: 46, def: 16, speed: 96, aggro: 460,
    w: 92, h: 70, boss: true, summon: 'boar', kind: 'boar', c: ['#4f4a63', '#cbb187', '#241f2f'],
  },
  mushking: {
    id: 'mushking', name: '赤魇妖王', level: 25, hp: 6200, exp: 2600, atk: 82, def: 30, speed: 78, aggro: 520,
    w: 110, h: 105, boss: true, final: true, summon: 'gshroom', kind: 'mushroom', c: ['#a72f3b', '#ead2a3', '#5e1724'],
  },

  /* ───── 飞行敌人（空中巡逻，不受地面限制） ───── */
  bat: {
    id: 'bat', name: '幽冥蝠', level: 16, hp: 380, exp: 145, atk: 38, def: 8, speed: 145, aggro: 380,
    w: 52, h: 38, flying: true, kind: 'flying', c: ['#6b5a7a', '#9a8ab0', '#4a3a5a'],
  },
  harpy: {
    id: 'harpy', name: '风语鹰妖', level: 19, hp: 520, exp: 195, atk: 48, def: 12, speed: 165, aggro: 420,
    w: 58, h: 42, flying: true, kind: 'flying', c: ['#5a7a8a', '#8aaab0', '#3a5a6a'],
  },

  /* ───── 远程攻击敌人（会发射投射物） ───── */
  shaman: {
    id: 'shaman', name: '巫毒萨满', level: 18, hp: 450, exp: 175, atk: 52, def: 10, speed: 55, aggro: 400,
    w: 50, h: 62, ranged: true, projectileSpeed: 380, attackInterval: 2.2, kind: 'ranged', c: ['#7a5a8a', '#aa8ab0', '#5a3a6a'],
  },
  archer: {
    id: 'archer', name: '妖弓手', level: 21, hp: 480, exp: 205, atk: 58, def: 14, speed: 65, aggro: 450,
    w: 48, h: 64, ranged: true, projectileSpeed: 520, attackInterval: 1.8, kind: 'ranged', c: ['#6a7a5a', '#9aaa8a', '#4a5a3a'],
  },
};
