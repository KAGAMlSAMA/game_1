/**
 * 配置中心 —— 想加新技能 / 新怪物 / 新地图 / 新装备，只需要改这个目录下的文件：
 *
 *   skills.ts    技能（倍率、冷却、解锁等级）
 *   enemies.ts   敌人（数值、外观 kind、配色）
 *   maps.ts      地图（地形、平台、绳索、出怪点、传送门连接）
 *   items.ts     装备底材与品质表
 *   classes.ts   职业展示信息
 *   realms.ts    境界表与突破试炼（练气→筑基→结丹→元婴…）
 *   npcs.ts      NPC 与商店商品（商人、引导长老）
 */
export * from './skills';
export * from './enemies';
export * from './maps';
export * from './items';
export * from './classes';
export * from './realms';
export * from './npcs';
export * from './appearance';
export * from './artifacts';
export * from './roots';
