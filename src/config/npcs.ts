import type { Rarity } from '../game/types';

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  NPC 配置表 · NPCS                                         ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  新增 NPC：追加一个条目，写明所在地图与坐标即可。          ║
 * ║                                                          ║
 * ║  字段说明：                                               ║
 * ║   id       唯一标识                                       ║
 * ║   mapId    所在地图（见 maps.ts）                          ║
 * ║   x / y    站立坐标（y 为脚底所在的地面高度）              ║
 * ║   name     显示名称     title 头顶称号                     ║
 * ║   kind     merchant 商人（开商店） / guide 引导（纯对话）  ║
 * ║   look     外观配色 [袍主色, 袍暗色, 配饰色]               ║
 * ║   lines    对话文本（逐句显示，可翻页）                    ║
 * ║   shop     商品列表（仅 merchant 需要）                    ║
 * ║                                                          ║
 * ║  ShopEntry 字段：                                         ║
 * ║   kind      hp/mp = 丹药，equip = 法器                     ║
 * ║   base      equip 专用：ITEM_POOL 中的底材名（见 items.ts）║
 * ║   rarity    equip 专用：品质 0 凡品 / 1 灵品 …             ║
 * ║   classId   可选：仅该职业可见（法器区分剑修 / 符修）      ║
 * ║   price     单价（灵石）                                   ║
 * ╚══════════════════════════════════════════════════════════╝
 */

export type NpcKind = 'merchant' | 'guide' | 'villager';

export interface ShopEntry {
  id: string;
  kind: 'hp' | 'mp' | 'equip' | 'book';
  name: string;
  desc: string;
  price: number;
  base?: string;     // equip 底材名
  rarity?: Rarity;   // equip/book 品质
  bookId?: string;   // book 的技能书 id
}

export interface NpcDef {
  id: string;
  mapId: string;
  x: number;
  y: number;
  name: string;
  title: string;
  kind: NpcKind;
  look: [string, string, string];
  lines: string[];
  shopHint?: string;
  shop?: ShopEntry[];
}

export const NPCS: NpcDef[] = [
  {
    id: 'merchant_yun',
    mapId: 'm0',
    x: 420,
    y: 620,
    name: '云货郎',
    title: '坊市散商',
    kind: 'merchant',
    look: ['#8a5a2b', '#5d3c1c', '#f1cf78'],
    lines: [
      '道友留步！小老儿在云隐村摆摊三十载，什么灵丹法器都寻得着。',
      '灵石换货，童叟无欺——斩妖所得的灵石，可别舍不得花呀。',
    ],
    shopHint: '丹药随身带，保命第一；法诀秘籍一书一诀，需够境界才参悟得了。',
    shop: [
      // 丹药
      { id: 's_hp', kind: 'hp', name: '回春丹', desc: '服下立刻恢复 45% 气血', price: 30 },
      { id: 's_mp', kind: 'mp', name: '聚灵丹', desc: '服下立刻恢复 45% 灵力', price: 26 },
      // 技能书
      { id: 'sb_slash', kind: 'book', name: '《破岳剑诀》', bookId: 'book_power_slash', rarity: 0, desc: '入门强力斩击剑诀', price: 100 },
      { id: 'sb_ice', kind: 'book', name: '《玄冰箭秘籍》', bookId: 'book_icebolt', rarity: 0, desc: 'CD0.1s极速冰箭，冲锋枪手感附带减速', price: 150 },
      { id: 'sb_fire', kind: 'book', name: '《离火真经》', bookId: 'book_fireball', rarity: 1, desc: '扇形散射5连发爆裂火球', price: 350 },
      { id: 'sb_wind', kind: 'book', name: '《游龙剑阵》', bookId: 'book_whirlwind', rarity: 1, desc: '剑气化龙的360°旋转大剑阵', price: 400 },
      { id: 'sb_giant', kind: 'book', name: '《巨剑术》', bookId: 'book_giant_sword', rarity: 1, desc: '召唤贯穿推进的金色巨灵大剑', price: 550 },
      { id: 'sb_shadow', kind: 'book', name: '《无影斩》', bookId: 'book_shadow_slash', rarity: 1, desc: '疾掠瞬斩，斩击沿途所有敌人', price: 380 },
      { id: 'sb_heart', kind: 'book', name: '《剑心通明》', bookId: 'book_sword_heart', rarity: 2, desc: '明悟剑心，暴涨战力增益', price: 700 },
      { id: 'sb_blink', kind: 'book', name: '《缩地成寸》', bookId: 'book_blink', rarity: 2, desc: '踏罡步斗瞬移身法', price: 800 },
      { id: 'sb_fly', kind: 'book', name: '《御剑飞行》', bookId: 'book_sword_flight', rarity: 2, desc: '御剑凌空，天地任遨游', price: 1000 },
      { id: 'sb_flying_swords', kind: 'book', name: '《万剑决》', bookId: 'book_flying_swords', rarity: 2, desc: '召唤8柄灵剑自动寻敌追踪破空', price: 1200 },
      { id: 'sb_thun', kind: 'book', name: '《天雷决》', bookId: 'book_thunder', rarity: 3, desc: '长按蓄力狙击，极光天雷超远贯穿', price: 1800 },
      // 心法秘籍（被动，学会即生效）
      { id: 'sb_body', kind: 'book', name: '《强身健体诀》', bookId: 'book_body_temper', rarity: 0, desc: '被动心法：气血+30%、移速+18%、跳跃+15%', price: 260 },
      { id: 'sb_spring', kind: 'book', name: '《灵力泉涌诀》', bookId: 'book_spirit_spring', rarity: 2, desc: '被动心法：灵力上限+50%，回复速度×2.2', price: 880 },
      // 基础护具
      { id: 's_robe', kind: 'equip', base: '麻布道袍', rarity: 0, name: '麻布道袍', desc: '粗麻织就，可挡些许妖爪', price: 90 },
      { id: 's_cap', kind: 'equip', base: '粗布道巾', rarity: 0, name: '粗布道巾', desc: '束发之物，略增护体', price: 70 },
      { id: 's_shoe', kind: 'equip', base: '草编云履', rarity: 0, name: '草编云履', desc: '轻便草履，身法稍快', price: 80 },
      { id: 's_sword', kind: 'equip', base: '寒铁飞剑', rarity: 1, name: '寒铁飞剑', desc: '蕴灵品质，比新手桃木剑锋利得多', price: 460 },
    ],
  },
  {
    id: 'guide_qing',
    mapId: 'm0',
    x: 900,
    y: 620,
    name: '青玄长老',
    title: '云隐村执事',
    kind: 'guide',
    look: ['#4f7f9c', '#2f5266', '#e8e2ff'],
    lines: [
      '小友根骨尚可，既入我云海修真界，便从练气一层稳扎稳打吧。',
      '练气共分九层。每斩一妖，修为渐长；修为满则境界自进。',
      '不过——练气九层圆满时，会撞上「瓶颈」，此时修为再多也无用。',
      '欲破此关，须完成【筑基试炼】：往东行至断云剑峡，斩了那头「幽篁妖狼王」，取其妖丹淬炼道基。',
      '试炼一成，即可踏入筑基期。届时方能参悟《御剑飞行》《缩地成寸》这等上乘法诀。',
      '对了——我辈修士并无门户之分。法诀尽在秘籍之中，买来技能书、境界够了便可参悟，剑法符术皆可兼修。',
      '学会之后，记得按 K 打开法诀栏，把它装到 1~9 的快捷槽上，否则临敌可使不出来。',
      '村中高处那座浮石阵法，唯有筑基之后御空而行方能抵达，其中另有洞天……去吧，小友。',
      '哦对了——村子左边有座演武场，场中立着木桩，可供你试炼法诀。打不坏，随便练。',
    ],
  },

  /* ───── 云隐村村民（纵向平台上，纯对话，留作后续任务钩子） ───── */
  {
    id: 'villager_farmer', mapId: 'm0', x: 360, y: 500,
    name: '田伯', title: '灵田老农',
    kind: 'villager', look: ['#6b8f4a', '#4a6630', '#e7d6aa'],
    lines: [
      '后生仔，看你身手矫健，不像寻常人。',
      '这半山的灵稻近来总被山鼠精啃食，唉，收成怕是要减半咯。',
      '（他望了望远处）若哪天你得空，替老汉除除害就好喽……',
    ],
  },
  {
    id: 'villager_girl', mapId: 'm0', x: 960, y: 480,
    name: '阿禾', title: '采药少女',
    kind: 'villager', look: ['#c0503e', '#8f382b', '#ffd0e0'],
    lines: [
      '呀，是位修士大哥！',
      '我上山采药时，在崖顶见过一株会发光的灵芝，可惜够不着。',
      '听说要会御空之术才上得去呢，大哥你以后行吗？',
    ],
  },
  {
    id: 'villager_scholar', mapId: 'm0', x: 640, y: 360,
    name: '柳先生', title: '教书先生',
    kind: 'villager', look: ['#4f6f9c', '#2f4566', '#e8e2ff'],
    lines: [
      '云海茫茫，修真之路，逆水行舟啊。',
      '老朽虽无灵根，却也读过些残卷。听闻断云剑峡深处，封着一头上古妖狼。',
      '后生若有朝一日路过，记得多加小心。',
    ],
  },
  {
    id: 'villager_hunter', mapId: 'm0', x: 1140, y: 330,
    name: '石猎户', title: '山道猎人',
    kind: 'villager', look: ['#8a5a3a', '#5e3a22', '#c9a06b'],
    lines: [
      '这半山腰风大，站稳喽。',
      '我常在山里转悠，东边草原、药林里的妖物近来愈发不安分。',
      '你要往东历练，趁早备些回春丹，莫要逞强。',
    ],
  },
  {
    id: 'villager_elder', mapId: 'm0', x: 420, y: 220,
    name: '云婆婆', title: '崖顶隐者',
    kind: 'villager', look: ['#7b6ea0', '#4a3f6e', '#ffe9b8'],
    lines: [
      '呵，能爬到这崖台的年轻人可不多见。',
      '再往上那座浮石，寻常人是上不去的——除非你御剑凌空。',
      '石上有座古阵，通往一处世外洞天。缘分到了，你自会知晓。',
    ],
  },
  {
    id: 'master_lingyun', mapId: 'm2_peak', x: 440, y: -285,
    name: '玄岳真人', title: '凌云宗传功师',
    kind: 'guide', look: ['#dfe6ee', '#8f9fb0', '#ffd97a'],
    lines: [
      '能一步步攀上凌云峰顶，说明你脚下功夫已经不差。',
      '山下药林、绝壁石径，原是给外门新弟子练胆练身的地方。',
      '往后若宗门开设任务，你可来此寻我领取入门考校。',
      '现在嘛，先记住：绳索、平台、耐心，三者缺一不可。',
    ],
  },
];

export const npcsOfMap = (mapId: string) => NPCS.filter((n) => n.mapId === mapId);
