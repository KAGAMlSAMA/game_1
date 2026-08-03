import type { MapDef } from '../game/types';

export const MAPS: MapDef[] = [
  /* ---- 作者测试场 · 控制台专用地图 ---- */
  {
    id: 'm_author', name: '作者测试场', sub: '测试控制台 · 技能妖物法宝', theme: 'summit', width: 2000,
    grid: [-1, -1], top: 0, bottom: 720,
    platformStyle: 'rock',
    ground: [{ x: 0, w: 2000, y: 620 }],
    platforms: [
      { x: 300, y: 480, w: 220 },
      { x: 800, y: 380, w: 400 },
      { x: 1400, y: 480, w: 220 },
    ],
    ropes: [],
    portals: [
      { x: 100, y: 620, toMap: 'm_test' },
      { x: 1900, y: 620, toMap: 'm0' },
    ],
    spawns: [{ e: 'dummy', x: 1000, y: 620 }, { e: 'dummy', x: 1200, y: 620 }],
    levelRange: [1, 99],
  },
  /* ---- 演武场 · 测试地图（新手村左侧） ---- */
  {
    id: 'm_test', name: '演武场', sub: '技能测试 · 木桩无限', theme: 'village', width: 1200,
    grid: [-1, 0], top: 0, bottom: 720,
    ground: [{ x: 0, w: 1200, y: 620 }],
    platforms: [],
    portals: [
      { x: 1100, y: 620, toMap: 'm0' },
      { x: 100, y: 620, toMap: 'm_author' }, // 左侧传送通往作者测试场
    ],
    spawns: [{ e: 'dummy', x: 600, y: 620 }],
    levelRange: [1, 99],
  },
  {
    id: 'm0', name: '云隐村', sub: '外门起点 · 炼气一层', theme: 'village', width: 1500,
    grid: [0, 0], top: -600, bottom: 720,
    ground: [{ x: 0, w: 1500, y: 620 }],
    platforms: [
      // 一层：屋顶矮台
      { x: 300, y: 500, w: 190 }, { x: 860, y: 480, w: 200 },
      // 二层：半山木栈
      { x: 560, y: 360, w: 220 }, { x: 1080, y: 330, w: 200 },
      // 三层：崖顶亭台
      { x: 360, y: 220, w: 210 }, { x: 820, y: 170, w: 220 },
      // 极高的浮石：禁止自动补绳，唯有御剑飞行 / 缩地成寸可达
      { x: 560, y: 20, w: 220, noRope: true },
    ],
    ropes: [
      { x: 474, top: 500, bottom: 620 },
      { x: 1044, top: 480, bottom: 620 },
      { x: 760, top: 360, bottom: 500 },
      { x: 1260, top: 330, bottom: 480 },
      { x: 546, top: 220, bottom: 360 },
      { x: 1020, top: 170, bottom: 330 },
    ],
    portals: [
      { x: 100, y: 620, toMap: 'm_test' }, // 左侧通往演武场
      { x: 1400, y: 620, toMap: 'm1' },
      { x: 670, y: 20, toMap: 'm_hidden' } // 崖巅浮石上的隐藏传送阵
    ],
    spawns: [], levelRange: [1, 1],
  },
  {
    id: 'm_hidden', name: '须弥仙境', sub: '世外桃源 · 隐藏区域', theme: 'castle', width: 1200,
    grid: [0, -1], top: 0, bottom: 720,
    ground: [{ x: 0, w: 1200, y: 620 }],
    platforms: [{ x: 200, y: 460, w: 800 }],
    portals: [{ x: 100, y: 620, toMap: 'm0' }],
    spawns: [{ e: 'golem', x: 600, y: 620 }, { e: 'golem', x: 800, y: 620 }],
    levelRange: [20, 30],
  },
  {
    id: 'm1', name: '青岚灵田', sub: '灵龟游荡 · 炼气初期', theme: 'grass', width: 2400,
    grid: [1, 0], top: 0, bottom: 720,
    ground: [{ x: 0, w: 900, y: 620 }, { x: 900, w: 900, y: 575 }, { x: 1800, w: 600, y: 620 }],
    platforms: [{ x: 380, y: 470, w: 200 }, { x: 1150, y: 430, w: 220 }, { x: 1980, y: 460, w: 190 }],
    ropes: [{ x: 564, top: 470, bottom: 620 }, { x: 1354, top: 430, bottom: 575 }, { x: 2154, top: 460, bottom: 620 }],
    portals: [{ x: 100, y: 620, toMap: 'm0' }, { x: 2300, y: 620, toMap: 'm2' }],
    spawns: [
      { e: 'snail', x: 350 }, { e: 'snail', x: 700 }, { e: 'snail', x: 1150 }, { e: 'snail', x: 1550 },
      { e: 'snail', x: 2150 }, { e: 'bsnail', x: 1000 }, { e: 'bsnail', x: 1900 }, { e: 'bsnail', x: 2280 },
    ],
    levelRange: [1, 3],
  },
  {
    id: 'm2', name: '碧竹药林', sub: '凌云宗山门 · 山脚药林', theme: 'mountainFoot', width: 2200,
    grid: [2, 0], top: 0, bottom: 720,
    platformStyle: 'rock',
    ground: [{ x: 0, w: 2200, y: 620 }],
    platforms: [
      { x: 280, y: 500, w: 190 }, { x: 620, y: 455, w: 180 }, { x: 980, y: 410, w: 200 },
      { x: 1320, y: 355, w: 190 }, { x: 1650, y: 305, w: 210 },
      { x: 1850, y: 255, w: 180 },
    ],
    ropes: [
      { x: 445, top: 500, bottom: 620 }, { x: 775, top: 455, bottom: 620 },
      { x: 1160, top: 410, bottom: 620 }, { x: 1485, top: 355, bottom: 620 },
      { x: 1835, top: 305, bottom: 620 }, { x: 2015, top: 255, bottom: 620 },
    ],
    portals: [
      { x: 100, y: 620, toMap: 'm1' },
      { x: 2100, y: 620, toMap: 'm3' },
      // 山门后的登山道，不在左下角
      { x: 1940, y: 255, toMap: 'm2_cliff1' },
    ],
    spawns: [
      { e: 'rsnail', x: 380 }, { e: 'gshroom', x: 760 }, { e: 'slime', x: 1120 },
      { e: 'gshroom', x: 1420, y: 355 }, { e: 'bshroom', x: 1750, y: 305 },
    ],
    levelRange: [3, 8],
  },
  {
    // 层差设计：80~100 px，单跳可达；只在地面→第一级保留一根绳，其余全删。
    id: 'm2_cliff1', name: '凌云绝壁·下段', sub: '山门之上 · 碎石栈道', theme: 'cliff', width: 900,
    grid: [2, -1], top: -760, bottom: 720,
    platformStyle: 'rock',
    ground: [{ x: 0, w: 900, y: 620 }],
    platforms: [
      // 第1级：地面 y=620，台面 y=520（差 100）—— 跳跃刚好够，稍高故留一根绳辅助
      { x: 160, y: 520, w: 200 }, { x: 540, y: 520, w: 200 },
      // 第2级：差 90
      { x: 300, y: 430, w: 180 }, { x: 620, y: 430, w: 180 },
      // 第3级：差 90
      { x: 100, y: 340, w: 190 }, { x: 480, y: 340, w: 190 },
      // 第4级：差 90
      { x: 280, y: 250, w: 180 }, { x: 640, y: 250, w: 180 },
      // 第5级：差 90
      { x: 130, y: 160, w: 190 }, { x: 490, y: 160, w: 190 },
      // 第6级：差 90
      { x: 310, y: 70, w: 180 }, { x: 650, y: 70, w: 180 },
      // 第7级：差 90
      { x: 150, y: -20, w: 190 }, { x: 510, y: -20, w: 190 },
      // 第8级：差 90
      { x: 320, y: -110, w: 190 }, { x: 660, y: -110, w: 180 },
      // 第9级：差 90
      { x: 140, y: -200, w: 200 }, { x: 490, y: -200, w: 200 },
      // 第10级（出口台）：差 80
      { x: 310, y: -280, w: 220 },
    ],
    // 只保留地面→第1级（差100px，跳不上建议有绳）两根辅助绳
    ropes: [
      { x: 330, top: 520, bottom: 620 },
      { x: 710, top: 520, bottom: 620 },
    ],
    portals: [
      { x: 120, y: 620, toMap: 'm2' },
      { x: 405, y: -280, toMap: 'm2_cliff2' },
    ],
    spawns: [
      { e: 'gshroom', x: 240, y: 520 }, { e: 'slime', x: 630, y: 340 },
      { e: 'bshroom', x: 380, y: 70 }, { e: 'slime', x: 600, y: -110 },
    ],
    levelRange: [3, 8],
  },
  {
    // 层差 85~95 px，全程跳跃可达，移除全部绳索
    id: 'm2_cliff2', name: '凌云绝壁·中段', sub: '云瀑石径 · 雾锁山腰', theme: 'cliff', width: 860,
    grid: [2, -2], top: -760, bottom: 720,
    platformStyle: 'rock',
    ground: [{ x: 0, w: 860, y: 620 }],
    platforms: [
      // 第1级：y=530（差 90）
      { x: 100, y: 530, w: 190 }, { x: 520, y: 530, w: 190 },
      // 第2级：y=440（差 90）
      { x: 290, y: 440, w: 185 }, { x: 645, y: 440, w: 185 },
      // 第3级：y=350（差 90）
      { x: 110, y: 350, w: 190 }, { x: 480, y: 350, w: 190 },
      // 第4级：y=260（差 90）
      { x: 300, y: 260, w: 185 }, { x: 640, y: 260, w: 185 },
      // 第5级：y=170（差 90）
      { x: 120, y: 170, w: 190 }, { x: 475, y: 170, w: 190 },
      // 第6级：y=80（差 90）
      { x: 290, y: 80, w: 185 }, { x: 640, y: 80, w: 185 },
      // 第7级：y=-10（差 90）
      { x: 110, y: -10, w: 190 }, { x: 480, y: -10, w: 190 },
      // 第8级：y=-100（差 90）
      { x: 295, y: -100, w: 185 }, { x: 640, y: -100, w: 185 },
      // 第9级：y=-185（差 85）
      { x: 130, y: -185, w: 195 }, { x: 480, y: -185, w: 195 },
      // 出口台 y=-275（差 90）
      { x: 300, y: -275, w: 230 },
    ],
    ropes: [], // 全程跳跃可达，不需绳索
    portals: [
      { x: 160, y: 530, toMap: 'm2_cliff1' },
      { x: 400, y: -275, toMap: 'm2_peak' },
    ],
    spawns: [
      { e: 'slime', x: 620, y: 530 }, { e: 'gshroom', x: 330, y: 260 },
      { e: 'bshroom', x: 160, y: -10 }, { e: 'slime', x: 530, y: -185 },
    ],
    levelRange: [5, 10],
  },
  {
    // 层差 85~95 px，无怪物，宗门圣地
    id: 'm2_peak', name: '凌云绝壁·山顶', sub: '凌云峰顶 · 宗门云台', theme: 'summit', width: 900,
    grid: [2, -3], top: -760, bottom: 720,
    platformStyle: 'rock',
    ground: [{ x: 0, w: 900, y: 620 }],
    platforms: [
      // 第1级：y=530（差 90）
      { x: 140, y: 530, w: 190 }, { x: 560, y: 530, w: 190 },
      // 第2级：y=440（差 90）
      { x: 320, y: 440, w: 185 }, { x: 660, y: 440, w: 185 },
      // 第3级：y=350（差 90）
      { x: 120, y: 350, w: 190 }, { x: 480, y: 350, w: 190 },
      // 第4级：y=260（差 90）
      { x: 300, y: 260, w: 185 }, { x: 650, y: 260, w: 185 },
      // 第5级：y=170（差 90）
      { x: 130, y: 170, w: 190 }, { x: 490, y: 170, w: 190 },
      // 第6级：y=80（差 90）
      { x: 310, y: 80, w: 185 }, { x: 660, y: 80, w: 185 },
      // 第7级：y=-10（差 90）
      { x: 130, y: -10, w: 190 }, { x: 490, y: -10, w: 190 },
      // 第8级：y=-100（差 90）
      { x: 305, y: -100, w: 185 }, { x: 650, y: -100, w: 185 },
      // 第9级：y=-185（差 85）
      { x: 140, y: -185, w: 195 }, { x: 490, y: -185, w: 195 },
      // 山顶宗门台（传送到此，NPC 在此）
      { x: 300, y: -285, w: 280 },
    ],
    ropes: [], // 宗门圣地，无绳索
    portals: [{ x: 360, y: 530, toMap: 'm2_cliff2' }],
    spawns: [], // 宗门圣地，无怪物
    levelRange: [8, 14],
  },
  {
    id: 'm3', name: '赤砂古道', sub: '枯木树魈与赤莲 · 炼气后期', theme: 'desert', width: 2600,
    grid: [3, 0], top: 0, bottom: 720,
    ground: [{ x: 0, w: 1100, y: 620 }, { x: 1100, w: 800, y: 570 }, { x: 1900, w: 700, y: 620 }],
    platforms: [{ x: 420, y: 470, w: 200 }, { x: 1200, y: 420, w: 230 }, { x: 2000, y: 460, w: 210 }],
    ropes: [{ x: 604, top: 470, bottom: 620 }, { x: 1414, top: 420, bottom: 570 }, { x: 2194, top: 460, bottom: 620 }],
    portals: [{ x: 100, y: 620, toMap: 'm2' }, { x: 2500, y: 620, toMap: 'm5' }],
    spawns: [
      { e: 'bshroom', x: 480 }, { e: 'bshroom', x: 900 },
      { e: 'stump', x: 700 }, { e: 'stump', x: 1250 }, { e: 'stump', x: 1700 }, { e: 'stump', x: 2200 },
      { e: 'cactus', x: 1500 }, { e: 'cactus', x: 2050 }, { e: 'cactus', x: 2420 },
    ],
    levelRange: [6, 12],
  },
  {
    id: 'm5', name: '断云剑峡', sub: '妖狼王盘踞 · 筑基试炼', theme: 'canyon', width: 2800,
    grid: [4, 0], top: 0, bottom: 720,
    ground: [{ x: 0, w: 1000, y: 620 }, { x: 1000, w: 900, y: 565 }, { x: 1900, w: 900, y: 620 }],
    platforms: [{ x: 400, y: 470, w: 210 }, { x: 1100, y: 415, w: 230 }, { x: 1750, y: 450, w: 210 }, { x: 2350, y: 465, w: 200 }],
    ropes: [{ x: 594, top: 470, bottom: 620 }, { x: 1314, top: 415, bottom: 565 }, { x: 1944, top: 450, bottom: 620 }, { x: 2534, top: 465, bottom: 620 }],
    portals: [{ x: 100, y: 620, toMap: 'm3' }, { x: 2700, y: 620, toMap: 'm6' }],
    spawns: [
      { e: 'boar', x: 480 }, { e: 'boar', x: 1000 },
      { e: 'golem', x: 850 }, { e: 'golem', x: 1600 }, { e: 'golem', x: 2200 },
      { e: 'stump', x: 2400 },
      { e: 'wolfking', x: 2560 }, // 筑基试炼妖王
      // 飞行敌人
      { e: 'bat', x: 1200, y: 400 }, { e: 'bat', x: 1800, y: 350 },
      { e: 'harpy', x: 800, y: 300 }, { e: 'harpy', x: 2100, y: 380 },
      // 远程敌人
      { e: 'shaman', x: 600, y: 450 }, { e: 'shaman', x: 1500, y: 400 },
      { e: 'archer', x: 2000, y: 430 },
    ],
    levelRange: [12, 18],
  },
  {
    id: 'm6', name: '血月妖宫', sub: '妖王禁地 · 筑基圆满', theme: 'castle', width: 1900,
    grid: [5, 0], top: 0, bottom: 720,
    ground: [{ x: 0, w: 1900, y: 620 }],
    platforms: [{ x: 380, y: 470, w: 200 }, { x: 1320, y: 470, w: 200 }],
    ropes: [{ x: 564, top: 470, bottom: 620 }, { x: 1504, top: 470, bottom: 620 }],
    portals: [{ x: 100, y: 620, toMap: 'm5' }],
    spawns: [
      { e: 'mushking', x: 1250 },
      { e: 'gshroom', x: 620 }, { e: 'gshroom', x: 950 },
      // 飞行护卫
      { e: 'harpy', x: 500, y: 350 }, { e: 'harpy', x: 1700, y: 380 },
      // 远程护卫
      { e: 'archer', x: 400, y: 420 }, { e: 'archer', x: 1600, y: 400 },
      { e: 'shaman', x: 800, y: 380 },
    ],
    levelRange: [20, 25],
  },
];
