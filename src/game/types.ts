export type ClassId = 'warrior' | 'mage';
export type Slot = 'weapon' | 'helmet' | 'armor' | 'gloves' | 'shoes' | 'artifact';
export type Rarity = 0 | 1 | 2 | 3;

/* ---------------- 外貌系统 ---------------- */
export type Gender = 'male' | 'female';

export interface Appearance {
  gender: Gender;
  face: number;   // 脸型索引
  hair: number;   // 发型索引
  outfit: number; // 服装索引
}

/** 五行属性 */
export type ElementType = 'metal' | 'wood' | 'water' | 'fire' | 'earth';

/** 五行灵根数值 (金/木/水/火/土) */
export interface SpiritualRoots {
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
}

/** 基础属性：每次升级小幅提升，大境界突破大幅提升 */
export interface BaseStats {
  /** 基础威力（整合物理与术法） */
  power: number;
  /** 护体真元（防御减伤） */
  def: number;
  /** 基础气血上限 */
  maxHp: number;
  /** 基础灵力上限 */
  maxMp: number;
}

/** 进阶属性：升级不增加，大境界突破小幅增加，或由装备/丹药加成 */
export interface AdvStats {
  /** 神识：灵觉洞察，感知天地 */
  sense: number;
  /** 身法：决定移动速度、跳跃高度、闪避概率 */
  agility: number;
  /** 会心率（百分比，如 15 = 15%） */
  critRate: number;
  /** 会心伤害（百分比，如 150 = 150% 暴击伤害） */
  critDmg: number;
}

export interface EquipmentItem {
  uid: number;
  name: string;
  slot: Slot;
  rarity: Rarity;
  level: number;
  // 基础属性
  power: number;
  def: number;
  hp: number;
  mp: number;
  // 进阶属性
  sense: number;
  agility: number;
  critRate: number;
  critDmg: number;
  // 附加五行灵根点数
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
  /** 法宝专属能力标识（仅 slot === 'artifact' 时存在） */
  artifactId?: ArtifactId;
}

/** 法宝种类：不提供属性加成，仅提供特殊机制 */
export type ArtifactId = 'qiankun_bead' | 'green_bamboo_sword';

export interface ArtifactDef {
  id: ArtifactId;
  name: string;
  rarity: Rarity;
  color: string;
  /** 简述 */
  desc: string;
  /** 详细机制说明（逐条） */
  detail: string[];
}

export type InvItem =
  | { t: 'eq'; item: EquipmentItem }
  | { t: 'hp' | 'mp'; n: number }
  | { t: 'book'; bookId: string; skillId: string; name: string; rarity: Rarity; reqLevel: number };

export type SkillKind = 'melee' | 'spin' | 'buff' | 'fire' | 'ice' | 'thunder' | 'fly' | 'blink' | 'giant_sword' | 'flying_swords' | 'dash';

/**
 * 技能定义 —— 现为全职业共通，无 classId/branch 限制。
 * 学习方式：消耗对应技能书（SkillBook），升级同理。
 */
export interface SkillDef {
  id: string;
  name: string;
  /** 最大学习等级 */
  maxLevel: number;
  kind: SkillKind;
  mpCost: number;
  cooldown: number;
  mult: (lv: number) => number;
  desc: (lv: number) => string;
  /** 五行属性归属（受角色对应灵根点数百分比加成） */
  element?: ElementType;
  /** kind: 'fly' 专用 —— 每秒持续消耗的灵力 */
  drain?: (lv: number) => number;
  /** kind: 'blink' 专用 —— 最大瞬移距离（像素） */
  range?: (lv: number) => number;
  /** 技能分类标签（用于 UI 分组展示，不限制学习） */
  tag: string;
  /** 外观配色 */
  color: string;
  /** true = 被动心法：学会即永久生效，无需装备到快捷槽 */
  passive?: boolean;
  /** 被动效果数值（仅 passive 使用） */
  passiveFx?: {
    /** 气血上限加成（百分比，0.25 = +25%） */
    hpPct?: number;
    /** 灵力上限加成（百分比） */
    mpPct?: number;
    /** 移动速度加成（百分比） */
    speedPct?: number;
    /** 跳跃高度加成（百分比） */
    jumpPct?: number;
    /** 飞行速度加成（百分比，遁光专用；1 = +100%） */
    flightSpeedPct?: number;
    /** true = 可按住空格平地起飞并在空中悬停（遁光专用） */
    lightFlight?: boolean;
    /** 灵力回复速度倍率（2 = 两倍） */
    mpRegenMult?: number;
    /** 以灵力抵挡伤害的比例（0.4 = 40% 伤害转由灵力承担） */
    mpShieldPct?: number;
    /** 灵力抵伤的换算率（1 点伤害消耗多少灵力） */
    mpShieldCost?: number;
  };
  /** 达到该等级自动习得（无需技能书），用于剧情性被动 */
  autoLearnLevel?: number;
}

/**
 * 技能书定义（一技能一本，固定品质、只有一级）
 * 背包中的 InvItem { t: 'book', ... } 点击即可参悟学习。
 */
export interface SkillBook {
  id: string;
  name: string;
  skillId: string;
  /** 固定品质 */
  rarity: Rarity;
  /** 最低境界要求（角色等级），未达到不可学习 */
  reqLevel: number;
  desc: string;
}

export type MobKind = 'snail' | 'mushroom' | 'slime' | 'stump' | 'cactus' | 'boar' | 'golem' | 'dummy' | 'flying' | 'ranged';

export interface EnemyDef {
  id: string;
  name: string;
  level: number;
  hp: number;
  exp: number;
  atk: number;
  def: number;
  speed: number;
  aggro: number;
  w: number;
  h: number;
  boss?: boolean;
  /** true = 最终妖王，击败后触发通关结算 */
  final?: boolean;
  /** BOSS 召唤的小怪 id（默认 gshroom） */
  summon?: string;
  /** true = 测试木桩（不死、不掉落、不给修为、受击自动回满、不移动） */
  dummy?: boolean;
  /** true = 飞行单位（不受地面限制，空中巡逻） */
  flying?: boolean;
  /** true = 远程攻击单位（会发射投射物攻击玩家） */
  ranged?: boolean;
  /** 远程攻击的投射物速度（默认 420） */
  projectileSpeed?: number;
  /** 远程攻击间隔（秒，默认 2.5） */
  attackInterval?: number;
  kind: MobKind;
  c: [string, string, string];
}

export interface SpawnDef {
  e: string;
  x: number;
  y?: number;
}

export interface PortalDef {
  x: number;
  y: number;
  toMap: string;
}

export interface PlatformDef {
  x: number;
  y: number;
  w: number;
  /** true = 禁止引擎自动补绳索（只能靠御剑飞行 / 缩地成寸抵达） */
  noRope?: boolean;
}

export interface RopeDef {
  /** 绳索水平位置 */
  x: number;
  /** 顶端高度（通常为平台表面 y） */
  top: number;
  /** 底端高度（通常为地面 y） */
  bottom: number;
}

export type ThemeId = 'village' | 'grass' | 'forest' | 'desert' | 'dark' | 'canyon' | 'castle' | 'mountainFoot' | 'cliff' | 'summit';

export interface MapDef {
  id: string;
  name: string;
  sub: string;
  theme: ThemeId;
  width: number;
  top?: number;
  bottom?: number;
  grid: [number, number];
  ground: { x: number; w: number; y: number }[];
  platforms: PlatformDef[];
  /** 平台渲染风格：默认 wood；山崖类地图使用 rock */
  platformStyle?: 'wood' | 'rock';
  /** 攀爬绳索（顶端接平台、底端接地面）。省略时引擎会为跳跃够不到的平台自动生成 */
  ropes?: RopeDef[];
  portals: PortalDef[];
  spawns: SpawnDef[];
  levelRange: [number, number];
}

/* ---------------- 引擎运行时 ---------------- */

export interface Mob {
  id: number;
  def: EnemyDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  facing: 1 | -1;
  spawnX: number;
  state: 'idle' | 'chase' | 'return' | 'tele' | 'slam';
  stateT: number;
  wanderT: number;
  hitFlash: number;
  frozenT: number;
  slowT: number; // 减速持续时间
  contactCd: number;
  slamCd: number;
  summonCd: number;
  /** 远程攻击冷却（仅 ranged 使用） */
  attackCd?: number;
  dead: boolean;
  respawnT: number;
  onGround: boolean;
  walkPhase: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: 'bolt' | 'fire' | 'ice' | 'giant_sword' | 'flying_sword' | 'sniper_beam' | 'enemy_arrow';
  mult: number;
  life: number;
  maxLife: number;
  r: number;
  hitIds: Set<number>;
  pierce?: boolean; // 贯穿敌人（不因命中消散）
  hitCooldowns?: Map<number, number>; // 多段命中同一个怪的内置CD
  targetId?: number; // 追踪目标的怪物 id
  homingTimer?: number;
  angle?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  grav: number;
  kind: 'spark' | 'smoke' | 'glow' | 'leaf' | 'shard';
}

export interface Floater {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  vy: number;
  crit?: boolean;
}

export interface Drop {
  x: number;
  y: number;
  vy: number;
  kind: 'gold' | 'equip' | 'hp' | 'mp';
  gold: number;
  item?: EquipmentItem;
  life: number;
  phase: number;
}

export interface SlashFx {
  x: number;
  y: number;
  facing: 1 | -1;
  t: number;
  max: number;
  kind: 'slash' | 'big' | 'spin' | 'cast' | 'thunder' | 'dash';
  w?: number;
  h?: number;
}

export interface Buff {
  name: string;
  until: number;
  mult: number;
}

export interface LogMsg {
  id: number;
  text: string;
  color: string;
  at: number;
}

/* ---------------- UI 快照 ---------------- */

export interface SkillSnap {
  id: string;
  name: string;
  /** 是否已通过技能书学会 */
  learned: boolean;
  kind: SkillKind;
  cd: number;
  cdMax: number;
  mpCost: number;
  desc: string;
  /** 切换类法诀（御剑飞行）当前是否生效中 */
  active: boolean;
  /** 附加说明：持续灵力消耗 / 最大瞬移距离 */
  extra: string;
  /** 技能分类标签 */
  tag: string;
  /** 外观配色 */
  color: string;
  /** 是否已装备到快捷槽（装备了才能使用） */
  equipped: boolean;
  /** 装备在哪个槽位（0~8），-1 = 未装备 */
  slotIdx: number;
  /** 学习该技能所需的最低境界等级 */
  reqLevel: number;
  /** 对应技能书名（未学会时提示去哪找） */
  bookName: string;
  /* ---- 详细数值（用于悬浮说明） ---- */
  /** 伤害倍率（1 = 100% 面板威力） */
  mult: number;
  /** 单次施放的攻击段数（如离火 5 发、万剑决 8 柄） */
  hits: number;
  /** 按当前面板估算的单段伤害 */
  estDmg: number;
  /** 单次施放的估算总伤害 */
  estTotal: number;
  /** 特殊说明（蓄力区间、减速、贯穿等） */
  dmgNote: string;
  /** 是否为被动心法（学会即生效，不占快捷槽） */
  passive: boolean;
  /** 被动效果的文字化说明列表 */
  passiveLines: string[];
}



export interface RealmSnap {
  name: string;
  stage: string;
  tier: number;
  color: string;
  next: string;
}

export interface GateSnap {
  title: string;
  detail: string;
  /** 试炼是否已完成（未开放的试炼视为已完成） */
  done: boolean;
  /** 是否已开放具体试炼内容 */
  open: boolean;
}

export interface ShopItemSnap {
  id: string;
  kind: 'hp' | 'mp' | 'equip' | 'book';
  name: string;
  desc: string;
  price: number;
  rarity: Rarity;
  slot: Slot | null;
  /** 装备的属性预览 */
  stats: [string, string][];
  level: number;
  affordable: boolean;
  /** book 专用：对应技能书 id */
  bookId?: string;
  /** book 专用：是否已学会该技能 */
  bookLearned?: boolean;
  /** book 专用：最低境界要求 */
  bookReqLevel?: number;
}

/** 当前正在交互的 NPC 界面 */
export interface NpcViewSnap {
  id: string;
  name: string;
  title: string;
  kind: 'merchant' | 'guide' | 'villager';
  lines: string[];
  lineIdx: number;
  shopHint: string;
  shop: ShopItemSnap[];
  /** 商店是否已展开（商人对话完毕后展开） */
  shopOpen: boolean;
}

export interface DerivedStats {
  /** 综合威力（伤害核心） */
  power: number;
  /** 护体真元（防御） */
  def: number;
  /** 气血上限 */
  maxHp: number;
  /** 灵力上限 */
  maxMp: number;
  /** 神识（灵觉感知） */
  sense: number;
  /** 身法（影响移速、跳跃、闪避） */
  agility: number;
  /** 闪避概率（百分比，如 18%） */
  dodgeRate: number;
  /** 会心率（百分比） */
  critRate: number;
  /** 会心伤害（百分比，如 170%） */
  critDmg: number;
  /** 五行灵根数值（含装备加成） */
  roots: SpiritualRoots;
}

export interface Snapshot {
  classId: ClassId;
  name: string;
  appearance: Appearance;
  /** 角色天生五行灵根点数 */
  roots: SpiritualRoots;
  level: number;
  exp: number;
  expNeed: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
  ap: number;
  sp: number;
  /** 当前境界（练气一层 / 筑基初期 …） */
  realm: RealmSnap;
  /** 修为是否已圆满（达到本级上限） */
  expFull: boolean;
  /** 当前等级的突破试炼；null = 本级无需试炼 */
  gate: GateSnap | null;
  /** 是否处于御剑飞行状态 */
  flying: boolean;
  /** 已装备的法宝信息（无则为 null） */
  artifact: {
    id: ArtifactId;
    name: string;
    color: string;
    detail: string[];
    /** 乾坤珠：已绑定的技能 id 与名称 */
    boundSkillId: string | null;
    boundSkillName: string | null;
    /** 乾坤珠：距下次自动施放的剩余秒数 */
    autoCd: number;
    autoCdMax: number;
  } | null;
  /** 蓄力状态（如天雷决） */
  charging: boolean;
  chargeRatio: number;
  /** 附近可交互的 NPC 名称（未打开界面时的提示） */
  nearNpc: string | null;
  /** 打开中的 NPC 对话 / 商店界面 */
  npcView: NpcViewSnap | null;
  base: BaseStats;
  adv: AdvStats;
  derived: DerivedStats;
  skills: SkillSnap[];
  /** 技能栏槽位（'attack' = 普通攻击），键盘 1~9 选择槽位装载到鼠标左键 */
  loadout: string[];
  activeSlot: number;
  inventory: InvItem[];
  equipment: Record<Slot, EquipmentItem | null>;
  potions: { hp: number; mp: number };
  buffs: { name: string; remain: number; mult: number }[];
  mapId: string;
  mapName: string;
  mapSub: string;
  visited: string[];
  boss: { name: string; hp: number; maxHp: number; level: number } | null;
  dead: boolean;
  victory: boolean;
  paused: boolean;
  muted: boolean;
  log: LogMsg[];
}
