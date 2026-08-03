import { render } from './render';
import { sfx } from './audio';
import {
  ENEMIES, MAPS, RARITY_COLOR, RARITY_NAME, RARITY_MULT, RARITY_PREFIX,
  ITEM_POOL, SLOT_NAME, expNeed, rollRarity, pickItemLevel,
  realmOf, realmColor, gateAt, npcsOfMap, REALM_GATES, MAX_REALM_LEVEL,
  defaultAppearance, SKILLS, skillById, bookById, bookOfSkill,
  artifactById, ALL_ARTIFACTS, QIANKUN_INTERVAL,
  BAMBOO_SWORD_COUNT, BAMBOO_RADIUS, BAMBOO_SPIN, BAMBOO_MULT, BAMBOO_HIT_CD,
  generateSpiritualRoots,
} from './data';
import type { ItemBase, NpcDef } from '../config';
import type { Appearance, AdvStats, SpiritualRoots, ElementType } from './types';
import type {
  ArtifactId, BaseStats, Buff, ClassId, DerivedStats, Drop, EquipmentItem, Floater, InvItem,
  LogMsg, MapDef, Mob, Particle, Projectile, Rarity, RopeDef, Slot, Snapshot, SlashFx, SkillSnap,
} from './types';

export interface PortalInfo {
  x: number;
  groundY: number;
  toId: string;
  toName: string;
  near: boolean;
}

export interface PlayerState {
  classId: ClassId;
  name: string;
  appearance: Appearance;
  /** 五行灵根点数 */
  roots: SpiritualRoots;
  x: number; y: number; vx: number; vy: number; w: number; h: number;
  facing: 1 | -1;
  onGround: boolean;
  dropT: number;
  coyoteT: number;
  jumpBufT: number;
  jumpHeld: boolean;
  level: number; exp: number; ap: number; sp: number; gold: number;
  /** 基础属性 */
  base: BaseStats;
  /** 进阶属性 */
  adv: AdvStats;
  hp: number; mp: number;
  derived: DerivedStats;
  skills: Record<string, number>;
  cds: Record<string, number>;
  equipment: Record<Slot, EquipmentItem | null>;
  inventory: InvItem[];
  potions: { hp: number; mp: number };
  potionCd: number;
  attackT: number; attackMax: number; attackCd: number;
  castT: number; castMax: number;
  hurtT: number; invulnT: number; dead: boolean;
  buffs: Buff[];
  lastCombatT: number;
  weaponGlowColor: string | null;
  onRope: boolean;
  rope: RopeDef | null;
  /** 御剑飞行状态 */
  flying: boolean;
  /** 飞行来源：skill = 御剑飞行技能；light = 遁光被动 */
  flightMode: 'skill' | 'light' | null;
  flyT: number;
  /** 技能栏槽位：'attack' = 普通攻击，其余为技能 id；键盘 1~9 选择槽位 */
  loadout: string[];
  activeSlot: number;
  /* ---- 法宝运行时状态 ---- */
  /** 乾坤珠绑定的法诀 id */
  beadSkillId: string | null;
  /** 乾坤珠自动施放计时 */
  beadT: number;
  /** 青竹剑环绕相位 */
  bambooPhase: number;
  /** 青竹剑对各敌人的再命中冷却 */
  bambooHitCd: Map<number, number>;
}

let UID = 1;
const GRAV = 2050;
const MAX_FALL = 980;
const JUMP_V = 660;
const STEP = 1 / 60;

export class Engine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dpr = 1;
  viewScale = 1;
  viewW = 960;
  cssW = 960;
  cssH = 720;

  time = 0;
  camX = 0;
  camY = 0;
  shakeT = 0;
  shakePow = 0;
  transition = 0;
  private pendingMap: { id: string; fromId: string | null } | null = null;

  map: MapDef = MAPS[0];
  portals: PortalInfo[] = [];
  ropes: RopeDef[] = [];
  /** 当前地图的 NPC */
  npcs: (NpcDef & { near: boolean })[] = [];
  /** 正在交互的 NPC */
  private activeNpc: NpcDef | null = null;
  private npcLineIdx = 0;
  private npcShopOpen = false;
  /** 商店货物缓存：保证预览与购买一致 */
  private shopCache = new Map<string, EquipmentItem>();

  /** 鼠标瞄准（世界坐标）与屏幕坐标 */
  aimX = 640;
  aimY = 320;
  mouseVX = 640;
  mouseVY = 320;
  mouseInside = false;
  private lmbHeld = false;
  private rmbHeld = false;

  // 蓄力状态（如天雷决）
  chargingSkillId: string | null = null;
  chargeT = 0;
  private chargeSfxT = 0;

  player: PlayerState;
  mobs: Mob[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  floaters: Floater[] = [];
  drops: Drop[] = [];
  slashes: SlashFx[] = [];

  visited = new Set<string>(['m0']);
  /** 已完成的试炼标记，如 'slay:wolfking' */
  questFlags = new Set<string>();
  private bottleneckWarned = false;
  victory = false;
  uiPaused = false;
  private hiddenPaused = false;
  private log: LogMsg[] = [];
  private logId = 1;

  private keys = new Set<string>();

  private raf = 0;
  private last = 0;
  private acc = 0;
  private notifT = 0;
  private bagFullLogT = 0;
  private listeners = new Set<(s: Snapshot) => void>();
  private destroyed = false;

  constructor(
    canvas: HTMLCanvasElement,
    classId: ClassId,
    name: string,
    appearance?: Appearance,
    roots?: SpiritualRoots,
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no ctx');
    this.ctx = ctx;
    this.player = this.makePlayer(classId, name, appearance, roots);
    this.resize();
    canvas.style.cursor = 'none';
    window.addEventListener('resize', this.resize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('visibilitychange', this.onVis);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mouseleave', this.onMouseLeave);
    canvas.addEventListener('contextmenu', this.onCtxMenu);
    this.loadMap('m0', null, true);
    this.pushLog('欢迎踏入云海修仙界！', '#aef1ff');
    this.pushLog('左键释放技能 · 右键普攻 · 1~9 装载技能', '#ffe9b8');
    this.pushLog('走到地图边缘的传送阵，按 ↑ 前往新区域', '#aef1ff');
    sfx.startMusic();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    this.notify();
  }

  /* ---------------- 初始化 ---------------- */

  private makePlayer(
    classId: ClassId,
    name: string,
    appearance?: Appearance,
    roots?: SpiritualRoots,
  ): PlayerState {
    const base: BaseStats = {
      power: 18,
      def: 6,
      maxHp: 180,
      maxMp: 90,
    };
    const adv: AdvStats = {
      sense: 10,
      agility: 10,
      critRate: 10,
      critDmg: 150,
    };
    const p: PlayerState = {
      classId, name,
      appearance: appearance ?? defaultAppearance(classId),
      roots: roots ?? generateSpiritualRoots(),
      x: 200, y: 300, vx: 0, vy: 0, w: 34, h: 58,
      facing: 1, onGround: false, dropT: 0, coyoteT: 0, jumpBufT: 0, jumpHeld: false,
      level: 1, exp: 0, ap: 0, sp: 0, gold: 120,
      base, adv, hp: 180, mp: 90,
      derived: {
        power: 18, def: 6, maxHp: 180, maxMp: 90,
        sense: 10, agility: 10, dodgeRate: 3, critRate: 12, critDmg: 150,
        roots: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
      },
      skills: {}, cds: {},
      equipment: { weapon: null, helmet: null, armor: null, gloves: null, shoes: null, artifact: null },
      inventory: [],
      potions: { hp: 5, mp: 3 },
      potionCd: 0,
      attackT: 0, attackMax: 0, attackCd: 0,
      castT: 0, castMax: 0,
      hurtT: 0, invulnT: 0, dead: false,
      buffs: [], lastCombatT: -99,
      weaponGlowColor: null,
      onRope: false, rope: null,
      flying: false, flightMode: null, flyT: 0,
      // 初始只有普通攻击，技能需要技能书学习后手动装备
      loadout: ['attack', '', '', '', '', '', '', '', ''],
      activeSlot: 0,
      beadSkillId: null,
      beadT: 0,
      bambooPhase: 0,
      bambooHitCd: new Map(),
    };
    this.calcDerived(p);
    p.hp = p.derived.maxHp;
    p.mp = p.derived.maxMp;
    return p;
  }

  /**
   * 汇总当前已学会的全部被动心法效果。
   * 被动技能学会（skills[id] > 0）即永久生效，无需装备到快捷槽。
   */
  private passiveFx(p: PlayerState = this.player) {
    const fx = {
      hpPct: 0, mpPct: 0, speedPct: 0, jumpPct: 0,
      flightSpeedPct: 0, lightFlight: false,
      mpRegenMult: 1, mpShieldPct: 0, mpShieldCost: 1,
    };
    for (const s of SKILLS) {
      if (!s.passive || !s.passiveFx) continue;
      if ((p.skills[s.id] || 0) <= 0) continue;
      const e = s.passiveFx;
      fx.hpPct += e.hpPct ?? 0;
      fx.mpPct += e.mpPct ?? 0;
      fx.speedPct += e.speedPct ?? 0;
      fx.jumpPct += e.jumpPct ?? 0;
      fx.flightSpeedPct += e.flightSpeedPct ?? 0;
      if (e.lightFlight) fx.lightFlight = true;
      if (e.mpRegenMult) fx.mpRegenMult *= e.mpRegenMult;
      if (e.mpShieldPct) fx.mpShieldPct = Math.max(fx.mpShieldPct, e.mpShieldPct);
      if (e.mpShieldCost) fx.mpShieldCost = e.mpShieldCost;
    }
    return fx;
  }

  private calcDerived(p: PlayerState) {
    // 基础属性累加
    let power = p.base.power;
    let def = p.base.def;
    let hp = p.base.maxHp;
    let mp = p.base.maxMp;

    // 进阶属性累加
    let sense = p.adv.sense;
    let agility = p.adv.agility;
    let critRate = p.adv.critRate;
    let critDmg = p.adv.critDmg;

    // 五行灵根累加
    const roots: SpiritualRoots = { ...p.roots };

    // 装备词条累加
    for (const k of Object.keys(p.equipment) as Slot[]) {
      const it = p.equipment[k];
      if (!it) continue;
      power += it.power || 0;
      def += it.def || 0;
      hp += it.hp || 0;
      mp += it.mp || 0;
      sense += it.sense || 0;
      agility += it.agility || 0;
      critRate += it.critRate || 0;
      critDmg += it.critDmg || 0;
      roots.metal += it.metal || 0;
      roots.wood += it.wood || 0;
      roots.water += it.water || 0;
      roots.fire += it.fire || 0;
      roots.earth += it.earth || 0;
    }

    const px = this.passiveFx(p); // 被动心法加成

    // 闪避概率：基于身法计算（每点身法约 +0.35% 闪避，最高 50%）
    const dodgeRate = Math.min(50, Math.max(0, Math.round(agility * 0.35)));

    // 会心率：基础会心 + 神识灵觉感知加成（每点神识 +0.2% 会心率）
    const totalCritRate = Math.min(80, Math.max(5, Math.round(critRate + sense * 0.2)));

    // 会心伤害：基础会伤 + 神识感知加成
    const totalCritDmg = Math.max(120, Math.round(critDmg + sense * 0.3));

    const finalMaxHp = Math.round(hp * (1 + px.hpPct));
    const finalMaxMp = Math.round(mp * (1 + px.mpPct));

    const d: DerivedStats = {
      power: Math.round(power),
      def: Math.round(def),
      maxHp: finalMaxHp,
      maxMp: finalMaxMp,
      sense: Math.round(sense),
      agility: Math.round(agility),
      dodgeRate,
      critRate: totalCritRate,
      critDmg: totalCritDmg,
      roots,
    };
    p.derived = d;
    p.hp = Math.min(p.hp, d.maxHp);
    p.mp = Math.min(p.mp, d.maxMp);
    const w = p.equipment.weapon;
    p.weaponGlowColor = w && w.rarity >= 2 ? RARITY_COLOR[w.rarity] : null;
  }

  /* ---------------- 地图 ---------------- */

  private floorYAt(x: number): number {
    let y = 720;
    for (const s of this.map.ground) if (x >= s.x && x <= s.x + s.w) y = Math.min(y, s.y);
    return y;
  }

  private loadMap(id: string, fromId: string | null = null, snap = false) {
    const def = MAPS.find((m) => m.id === id);
    if (!def) return;
    this.map = def;
    this.visited.add(id);
    this.mobs = def.spawns.map((s) => this.makeMob(s.e, s.x, s.y));
    this.projectiles = [];
    this.drops = [];
    this.slashes = [];
    // 绳索：配置优先 + 为跳不上去的平台自动补绳（noRope 的平台除外）
    this.ropes = [...(def.ropes ?? [])];
    for (const pl of def.platforms) {
      if (pl.noRope) continue; // 禁飞之地：只能御剑 / 瞬移抵达
      const rx = pl.x + pl.w - 16;
      const floor = this.floorYAt(rx);
      if (floor - pl.y < 100) continue; // 跳跃可及，不需要绳索
      const covered = this.ropes.some((r) => r.x >= pl.x - 8 && r.x <= pl.x + pl.w + 8);
      if (!covered) this.ropes.push({ x: rx, top: pl.y, bottom: floor });
    }
    // NPC
    this.npcs = npcsOfMap(id).map((n) => ({ ...n, near: false }));
    this.activeNpc = null;
    this.npcLineIdx = 0;
    this.npcShopOpen = false;
    this.player.onRope = false;
    this.player.rope = null;
    if (this.player.flying) {
      this.player.flying = false;
      this.player.vy = 0;
    }
    this.portals = def.portals.map((pt) => ({
      x: pt.x, groundY: pt.y, toId: pt.toMap,
      toName: MAPS.find((m) => m.id === pt.toMap)?.name || '', near: false,
    }));

    const p = this.player;
    p.vx = 0; p.vy = 0;
    // 定位初始坐标：如果有来源地图，找对应传送阵；否则默认点
    let startX = 200;
    let startY = this.floorYAt(200) - 10;
    if (fromId) {
      const retPort = def.portals.find((pt) => pt.toMap === fromId);
      if (retPort) { startX = retPort.x; startY = retPort.y - 10; }
    }
    p.x = startX; p.y = startY;

    if (snap) {
      const vw = this.viewW, vh = 720;
      this.camX = Math.max(0, Math.min(def.width - vw, p.x - vw / 2));
      if (def.width < vw) this.camX = (def.width - vw) / 2;
      const mapTop = def.top ?? 0;
      const mapBottom = def.bottom ?? 720;
      this.camY = Math.max(mapTop, Math.min(mapBottom - vh, p.y - vh / 2));
    }
    // 妖王登场提示（任意配置了 boss 的地图）
    const bossDef = def.spawns.map((s) => ENEMIES[s.e]).find((e) => e?.boss);
    if (bossDef) {
      sfx.boss();
      const g = gateAt(this.player.level);
      const isTrialTarget = !!g?.quest && g.quest.id === 'slay:' + bossDef.id && !this.questFlags.has(g.quest.id);
      this.pushLog(
        isTrialTarget
          ? `⚠ 突破试炼目标【${bossDef.name}】就镇守此地！`
          : `⚠ ${bossDef.name}镇守此地！小心它的裂地妖术`,
        '#ff8a8a',
      );
    }
    if (id === 'm_author') {
      this.pushLog('⚙ 欢迎来到【作者测试场】！点击右上角 [⚡ 控制台] 可随意测试技能、妖物与法宝！', '#ffcf6b');
    }
    this.notify();
  }

  private makeMob(eid: string, x: number, y?: number): Mob {
    const def = ENEMIES[eid];
    return {
      id: UID++, def,
      x, y: y ?? 150, vx: 0, vy: 0,
      hp: def.hp, maxHp: def.hp,
      facing: Math.random() > 0.5 ? 1 : -1,
      spawnX: x,
      state: 'idle', stateT: 0, wanderT: Math.random() * 2,
      hitFlash: 0, frozenT: 0, slowT: 0, contactCd: 0,
      slamCd: 3, summonCd: 6,
      dead: false, respawnT: 0,
      onGround: false, walkPhase: Math.random() * 6,
    };
  }

  private startTravel(toId: string, fromId: string | null) {
    if (this.pendingMap || this.transition > 0) return;
    this.pendingMap = { id: toId, fromId };
    sfx.portal();
  }

  /* ---------------- 输入 ---------------- */

  private onKeyDown = (e: KeyboardEvent) => {
    const c = e.code;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(c)) e.preventDefault();
    this.keys.add(c);
    sfx.ensure();
    if (e.repeat) return;
    const p = this.player;
    // 对话 / 商店进行中：F / 空格 / 回车用于翻页，其余按键屏蔽
    if (this.activeNpc) {
      if (c === 'KeyF' || c === 'Space' || c === 'Enter') this.npcNext();
      return;
    }
    // F 键：与附近 NPC 交谈（飞行中也可交互）
    if (c === 'KeyF' && !p.dead) {
      const npc = this.npcs.find((n) => n.near);
      if (npc) {
        if (p.flying) this.endFlight();
        this.openNpc(npc.id);
        return;
      }
    }
    const jumpKeys = ['Space', 'KeyW', 'AltLeft', 'ArrowUp'];
    if (jumpKeys.includes(c)) {
      // 被动心法【遁光】：空格切换起飞 / 落地
      if (c === 'Space' && !p.dead && !p.onRope && this.passiveFx(p).lightFlight) {
        if (p.flying) this.endFlight('收起遁光');
        else this.startFlight('light');
        return;
      }
      // 绳索上：空格/Alt 跳离绳索
      if (p.onRope) {
        p.onRope = false;
        p.rope = null;
        p.vy = -JUMP_V * 0.82;
        p.jumpBufT = 0;
        p.jumpHeld = true;
        sfx.jump();
        return;
      }
      // 传送门优先
      if (c === 'ArrowUp' || c === 'KeyW') {
        const near = this.portals.find((pt) => Math.abs(pt.x - p.x) < 52 && Math.abs(pt.groundY - p.y) < 50 && !p.dead);
        if (near) {
          this.startTravel(near.toId, this.map.id);
          return;
        }
        // 绳索抓取：在绳索旁按 ↑/W 抓住绳索向上爬（御剑飞行中不触发）
        const r = this.ropeAt(p.x, p.y);
        if (r && !p.dead && !p.flying) {
          this.grabRope(r);
          return;
        }
      }
      if (!p.dead) {
        p.jumpBufT = 0.13;
        p.jumpHeld = true;
      }
    }
    if (c === 'ArrowDown' || c === 'KeyS') {
      if (p.onRope) return; // 绳索上 ↓ 为下滑
      // 空中按 ↓ 也可抓取头顶上方的绳索（御剑飞行中改为下降）
      if (!p.onGround && !p.dead && !p.flying) {
        const r = this.ropeAt(p.x, p.y);
        if (r) { this.grabRope(r); return; }
      }
      if (p.onGround && this.onThinPlatform(p) && !p.dead) {
        p.dropT = 0.24;
        p.onGround = false;
        p.y += 3;
      }
    }
    // 1~9：把对应槽位技能装载到鼠标左键
    const slotKeys = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9'];
    const slotIdx = slotKeys.indexOf(c);
    if (slotIdx >= 0) this.selectSlot(slotIdx);
    if ((c === 'Numpad1') || (c === 'Numpad2') || (c === 'Numpad3') || (c === 'Numpad4') || (c === 'Numpad5') || (c === 'Numpad6') || (c === 'Numpad7') || (c === 'Numpad8') || (c === 'Numpad9')) {
      this.selectSlot(parseInt(c.slice(-1), 10) - 1);
    }
    if (c === 'KeyQ' && !p.dead) this.drinkPotion('hp');
    if (c === 'KeyE' && !p.dead) this.drinkPotion('mp');
    if (c === 'Enter' && p.dead) this.respawn();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
    if (['Space', 'KeyW', 'AltLeft', 'ArrowUp'].includes(e.code)) {
      const p = this.player;
      if (p.vy < -240) p.vy = -240;
      p.jumpHeld = false;
    }
  };

  private onVis = () => {
    this.hiddenPaused = document.hidden;
  };

  /* ---------------- 鼠标输入 ---------------- */

  private onMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseVX = (e.clientX - rect.left) / this.viewScale;
    this.mouseVY = (e.clientY - rect.top) / this.viewScale;
    this.aimX = this.camX + this.mouseVX;
    this.aimY = this.mouseVY;
    this.mouseInside = true;
  };

  private onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    sfx.ensure();
    const p = this.player;
    if (p.dead || this.uiPaused || this.hiddenPaused) return;
    // 每次点击都按最新鼠标位置瞄准
    const rect = this.canvas.getBoundingClientRect();
    this.aimX = this.camX + (e.clientX - rect.left) / this.viewScale;
    this.aimY = (e.clientY - rect.top) / this.viewScale;
    if (e.button === 0) {
      this.lmbHeld = true;
      const loaded = p.loadout[p.activeSlot];
      if (loaded === 'thunder') {
        this.startCharge('thunder');
      } else {
        this.fireLoadout();
      }
    } else if (e.button === 2) {
      this.rmbHeld = true;
      this.tryAttack();
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.lmbHeld = false;
      if (this.chargingSkillId) {
        this.releaseCharge();
      }
    }
    if (e.button === 2) this.rmbHeld = false;
  };

  private onMouseLeave = () => {
    this.mouseInside = false;
  };

  private onCtxMenu = (e: Event) => e.preventDefault();

  /** 选择技能槽位（装载到鼠标左键） */
  private selectSlot(idx: number) {
    const p = this.player;
    const id = p.loadout[idx];
    if (!id) return; // 空槽不可选
    if (id !== 'attack') {
      if ((p.skills[id] || 0) <= 0) return; // 未学
    }
    if (p.activeSlot !== idx) {
      p.activeSlot = idx;
      sfx.ui();
      this.notify();
    }
  }

  /** 释放左键当前装载的技能 */
  private fireLoadout() {
    const p = this.player;
    const id = p.loadout[p.activeSlot];
    if (!id) return;
    if (id === 'attack') this.tryAttack();
    else this.useSkillById(id);
  }

  /* ---------------- 绳索 ---------------- */

  ropeAt(x: number, y: number): RopeDef | null {
    for (const r of this.ropes) {
      if (Math.abs(x - r.x) < 18 && y > r.top - 8 && y < r.bottom + 6) return r;
    }
    return null;
  }

  private grabRope(r: RopeDef) {
    const p = this.player;
    p.onRope = true;
    p.rope = r;
    p.x = r.x;
    p.vx = 0;
    p.vy = 0;
    p.jumpBufT = 0;
    sfx.grab();
  }

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect();
    this.cssW = rect.width || window.innerWidth;
    this.cssH = rect.height || window.innerHeight;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.cssW * this.dpr);
    this.canvas.height = Math.round(this.cssH * this.dpr);
    this.viewScale = this.cssH / 720;
    this.viewW = this.cssW / this.viewScale;
  };

  private onThinPlatform(p: PlayerState): boolean {
    for (const pl of this.map.platforms) {
      if (Math.abs(p.y - pl.y) < 4 && p.x > pl.x && p.x < pl.x + pl.w) return true;
    }
    return false;
  }

  /* ---------------- 主循环 ---------------- */

  private frame = (now: number) => {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.frame);
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.1) dt = 0.1;
    const paused = this.uiPaused || this.hiddenPaused;
    if (!paused) {
      this.acc += dt;
      while (this.acc >= STEP) {
        this.update(STEP);
        this.acc -= STEP;
      }
    }
    render(this);
  };

  private update(dt: number) {
    this.time += dt;
    const p = this.player;

    // 传送淡入淡出
    if (this.pendingMap) {
      this.transition = Math.min(1, this.transition + dt * 3.4);
      if (this.transition >= 1) {
        this.loadMap(this.pendingMap.id, this.pendingMap.fromId);
        this.pendingMap = null;
      }
    } else if (this.transition > 0) {
      this.transition = Math.max(0, this.transition - dt * 2.6);
    }

    this.shakeT = Math.max(0, this.shakeT - dt * 2.2);
    if (p.potionCd > 0) p.potionCd -= dt;

    if (!p.dead) this.updatePlayer(dt);
    this.updateArtifacts(dt);
    this.updateMobs(dt);
    this.updateProjectiles(dt);
    this.updateDrops(dt);

    // 粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) { this.particles.splice(i, 1); continue; }
      pt.vy += pt.grav * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.life -= dt;
      f.y += f.vy * dt;
      f.vy *= 1 - 3.2 * dt;
      if (f.life <= 0) this.floaters.splice(i, 1);
    }
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.t -= dt;
      if (s.t <= 0) this.slashes.splice(i, 1);
    }

    // 相机
    const vw = this.viewW, vh = 720;
    let targetX = p.x - vw / 2;
    targetX = this.map.width > vw ? Math.max(0, Math.min(this.map.width - vw, targetX)) : (this.map.width - vw) / 2;
    this.camX += (targetX - this.camX) * Math.min(1, dt * 7);

    let targetY = p.y - vh / 2 - 50; // 微下移使主角偏上一点
    const mapTop = this.map.top ?? 0;
    const mapBottom = this.map.bottom ?? 720;
    targetY = Math.max(mapTop, Math.min(mapBottom - vh, targetY));
    this.camY += (targetY - this.camY) * Math.min(1, dt * 7);

    // 通知 UI
    this.notifT += dt;
    if (this.notifT >= 0.15) {
      this.notifT = 0;
      this.notify();
    }
  }

  /* ---------------- 玩家 ---------------- */

  private updatePlayer(dt: number) {
    const p = this.player;
    const left = this.keys.has('ArrowLeft') || this.keys.has('KeyA');
    const right = this.keys.has('ArrowRight') || this.keys.has('KeyD');
    const upK = this.keys.has('ArrowUp') || this.keys.has('KeyW');
    const downK = this.keys.has('ArrowDown') || this.keys.has('KeyS');
    const px = this.passiveFx(p); // 被动心法：移速 / 跳跃 / 灵力回复
    const maxSpd = 235 * (1 + px.speedPct);

    /* ---- 御剑飞行 ---- */
    if (p.flying) {
      this.updateFlight(dt, left, right, upK, downK);
    } else if (p.onRope && p.rope) {
      const r = p.rope;
      p.vx = 0;
      p.vy = 0;
      p.x = r.x;
      p.coyoteT = 0;
      p.jumpBufT = 0;
      if (upK) { p.y -= 165 * dt; p.facing = this.mouseVX + this.camX >= p.x ? 1 : -1; }
      else if (downK) p.y += 165 * dt;
      if (Math.random() < dt * 6) {
        this.burst(p.x + (Math.random() - 0.5) * 10, p.y - 20, 1, '#c9975f', 1.6, 20, 'smoke');
      }
      if (left || right) {
        // 横向移动 → 脱离绳索
        p.onRope = false;
        p.rope = null;
        p.vx = (right ? 1 : -1) * 150;
        p.facing = right ? 1 : -1;
      } else if (p.y <= r.top + 1) {
        // 爬到顶端 → 站到平台上
        p.y = r.top;
        p.onRope = false;
        p.rope = null;
        p.vy = 26;
        p.jumpBufT = 0;
      } else if (p.y >= r.bottom) {
        // 滑到底部 → 落地
        p.y = r.bottom;
        p.onRope = false;
        p.rope = null;
      } else if (!this.ropeAt(p.x, p.y)) {
        p.onRope = false;
        p.rope = null;
      }
    } else {
      if (left && !right) { p.vx = Math.max(-maxSpd, p.vx - 2400 * dt); p.facing = -1; }
      else if (right && !left) { p.vx = Math.min(maxSpd, p.vx + 2400 * dt); p.facing = 1; }
      else {
        const fr = (p.onGround ? 2200 : 900) * dt;
        if (p.vx > 0) p.vx = Math.max(0, p.vx - fr);
        else p.vx = Math.min(0, p.vx + fr);
      }

      // 跳跃
      p.coyoteT = p.onGround ? 0.1 : Math.max(0, p.coyoteT - dt);
      p.jumpBufT = Math.max(0, p.jumpBufT - dt);
      if (p.jumpBufT > 0 && p.coyoteT > 0 && p.dropT <= 0) {
        p.vy = -JUMP_V * (1 + px.jumpPct);
        p.onGround = false;
        p.coyoteT = 0;
        p.jumpBufT = 0;
        sfx.jump();
        this.burst(p.x, p.y, 6, '#e8e0c8', 2.5, 60, 'smoke');
      }

      // 物理
      const prevY = p.y;
      p.vy = Math.min(MAX_FALL, p.vy + GRAV * dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.x = Math.max(22, Math.min(this.map.width - 22, p.x));
      if (p.dropT > 0) p.dropT -= dt;

      const wasGround = p.onGround;
      const fallSpd = p.vy;
      p.onGround = false;
      if (p.vy >= 0) {
        for (const s of this.map.ground) {
          if (p.x > s.x - 6 && p.x < s.x + s.w + 6 && prevY <= s.y + 2 && p.y >= s.y) {
            p.y = s.y; p.vy = 0; p.onGround = true;
          }
        }
        if (p.dropT <= 0) {
          for (const pl of this.map.platforms) {
            if (p.x > pl.x && p.x < pl.x + pl.w && prevY <= pl.y + 2 && p.y >= pl.y) {
              p.y = pl.y; p.vy = 0; p.onGround = true;
            }
          }
        }
      }
      if (!wasGround && p.onGround && fallSpd > 400) {
        this.burst(p.x, p.y, 8, '#d8d0b8', 3, 90, 'smoke');
      }
      // 跑步尘土
      if (p.onGround && Math.abs(p.vx) > 150 && Math.random() < dt * 8) {
        this.burst(p.x - p.facing * 10, p.y, 1, '#d8d0b8', 2, 30, 'smoke');
      }
    }

    // 计时器
    p.attackT = Math.max(0, p.attackT - dt);
    p.attackCd = Math.max(0, p.attackCd - dt);
    p.castT = Math.max(0, p.castT - dt);
    p.hurtT = Math.max(0, p.hurtT - dt);
    p.invulnT = Math.max(0, p.invulnT - dt);
    for (const k of Object.keys(p.cds)) p.cds[k] = Math.max(0, p.cds[k] - dt);
    for (let i = p.buffs.length - 1; i >= 0; i--) {
      if (p.buffs[i].until <= this.time) p.buffs.splice(i, 1);
    }

    // 蓄力处理
    if (this.chargingSkillId && !p.dead) {
      this.chargeT += dt;
      this.chargeSfxT += dt;
      if (this.chargeSfxT >= 0.2) {
        this.chargeSfxT = 0;
        sfx.chargeLoop(Math.min(1, this.chargeT / 2));
      }
      // 蓄力电火花粒子
      const ratio = Math.min(1, this.chargeT / 2);
      if (Math.random() < dt * 40) {
        const rad = 35 * (1 - ratio * 0.5);
        const ang = Math.random() * Math.PI * 2;
        this.particles.push({
          x: p.x + Math.cos(ang) * rad,
          y: p.y - 35 + Math.sin(ang) * rad,
          vx: -Math.cos(ang) * 90,
          vy: -Math.sin(ang) * 90,
          life: 0.22,
          maxLife: 0.22,
          size: 3 + ratio * 3,
          color: ratio >= 1 ? '#ffffff' : '#ffe97a',
          grav: 0,
          kind: 'spark',
        });
      }
      p.facing = this.faceAim();
      // 满2秒自动发射
      if (this.chargeT >= 2) {
        this.releaseCharge();
      }
    }

    // 鼠标按住连发：
    // 1. 普攻（右键 / 左键装载普攻）
    // 2. 玄冰箭（左键装载玄冰箭 icebolt，类似冲锋枪手感）
    const loaded = p.loadout[p.activeSlot];
    if ((this.rmbHeld || (this.lmbHeld && loaded === 'attack')) && p.attackCd <= 0) {
      this.tryAttack();
    } else if (this.lmbHeld && loaded === 'icebolt' && !this.chargingSkillId && (p.cds['icebolt'] || 0) <= 0) {
      this.useSkillById('icebolt');
    }

    // 传送门接近检测
    for (const pt of this.portals) pt.near = Math.abs(pt.x - p.x) < 52;
    // NPC 接近检测（只高亮最近的一个）
    let bestNpc = -1, bestNpcD = 78;
    this.npcs.forEach((n, i) => {
      n.near = false;
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < bestNpcD) { bestNpcD = d; bestNpc = i; }
    });
    if (bestNpc >= 0) this.npcs[bestNpc].near = true;

    // 回复
    const inCombat = this.time - p.lastCombatT < 5;
    const d = p.derived;
    p.mp = Math.min(d.maxMp, p.mp + (inCombat ? d.maxMp * 0.018 : d.maxMp * 0.05) * px.mpRegenMult * dt);
    p.hp = Math.min(d.maxHp, p.hp + (inCombat ? d.maxHp * 0.004 : d.maxHp * 0.02) * dt);
  }

  /* ---------------- 攻击与技能 ---------------- */

  private buffMult(): number {
    let m = 1;
    for (const b of this.player.buffs) m *= b.mult;
    return m;
  }

  /**
   * 基础输出威力：由统一的「威力」属性控制。
   * 若法诀带有五行归属，则按角色的五行灵根数值进行百分比加成（每点灵根 +0.5% 对应法诀威力）。
   */
  private baseDamage(element?: ElementType): number {
    const p = this.player;
    let pow = p.derived.power;
    if (element && p.derived.roots[element]) {
      const rootBonus = p.derived.roots[element] * 0.005; // 100 灵根 -> +50% 伤害
      pow *= (1 + rootBonus);
    }
    return pow;
  }

  /** 面向鼠标方向 */
  private faceAim(): 1 | -1 {
    const p = this.player;
    if (this.mouseInside) p.facing = this.aimX >= p.x ? 1 : -1;
    return p.facing;
  }

  /** 从 (ox,oy) 指向鼠标位置的单位速度向量 */
  private aimVec(ox: number, oy: number, speed: number): { vx: number; vy: number } {
    let dx = this.aimX - ox;
    let dy = this.aimY - oy;
    const d = Math.hypot(dx, dy);
    if (d < 10) {
      dx = this.player.facing;
      dy = -0.12;
      const n = Math.hypot(dx, dy);
      dx /= n; dy /= n;
    } else {
      dx /= d; dy /= d;
    }
    return { vx: dx * speed, vy: dy * speed };
  }

  private tryAttack() {
    const p = this.player;
    if (p.attackCd > 0) return;
    p.attackCd = 0.38;
    p.facing = this.faceAim();
    p.attackT = 0.24;
    p.attackMax = 0.24;
    sfx.attack();
    this.slashes.push({ x: p.x, y: p.y - 26, facing: p.facing, t: 0.22, max: 0.22, kind: 'slash' });
    this.hitArea(p.x + p.facing * 58, p.y - 28, 96, 84, 1.0);
  }

  /* ---------------- 蓄力系统（天雷决） ---------------- */

  private startCharge(skillId: string) {
    const p = this.player;
    const def = skillById(skillId);
    if (!def) return;
    if ((p.skills[skillId] || 0) <= 0) return;
    if ((p.cds[skillId] || 0) > 0) return;
    if (p.mp < def.mpCost) {
      this.floatAt(p.x, p.y - 90, '灵力不足!', '#7ab8ff', 16);
      sfx.err();
      return;
    }
    this.chargingSkillId = skillId;
    this.chargeT = 0;
    this.chargeSfxT = 0;
    sfx.chargeLoop(0);
    this.notify();
  }

  private releaseCharge() {
    const p = this.player;
    const skillId = this.chargingSkillId;
    this.chargingSkillId = null;
    if (!skillId || p.dead) return;
    const def = skillById(skillId);
    if (!def) return;
    const ratio = Math.max(0.2, Math.min(1, this.chargeT / 2)); // 0.2 ~ 1.0
    this.chargeT = 0;

    if (p.mp < def.mpCost) {
      this.floatAt(p.x, p.y - 90, '灵力不足!', '#7ab8ff', 16);
      sfx.err();
      return;
    }
    p.mp -= def.mpCost;
    p.cds[def.id] = def.cooldown;
    p.facing = this.faceAim();

    if (def.kind === 'thunder') {
      // 天雷决：狙击枪式超远极光贯穿！
      p.castT = 0.35;
      p.castMax = 0.35;
      sfx.sniperLaser();
      this.shake(0.8 + ratio * 0.4, 7 + ratio * 4);

      // 计算狙击光束速度向量
      const spd = 1600; // 超高速
      const v = this.aimVec(p.x, p.y - 36, spd);
      const mult = (2.5 + ratio * 5.0) * this.buffMult(); // 满蓄力 750% 伤害！

      this.projectiles.push({
        x: p.x + p.facing * 16,
        y: p.y - 36,
        vx: v.vx,
        vy: v.vy,
        kind: 'sniper_beam',
        mult,
        life: 0.9,
        maxLife: 0.9,
        r: 18 + ratio * 12,
        hitIds: new Set(),
        pierce: true, // 贯穿全线敌人
      });

      // 枪口雷光爆发特效
      this.burst(p.x + p.facing * 24, p.y - 36, 18, '#ffffff', 4, 300, 'spark');
      this.burst(p.x + p.facing * 24, p.y - 36, 12, '#ffe97a', 5, 200, 'glow');
      this.floatAt(p.x, p.y - 100, ratio >= 0.95 ? '⚡ 满蓄天雷!' : '天雷狙击', '#ffe97a', 22, true);
    }
    this.notify();
  }

  /** 释放指定技能（由鼠标左键触发） */
  private useSkillById(id: string) {
    const p = this.player;
    const def = skillById(id);
    if (!def) return;
    const lv = p.skills[def.id] || 0;
    if (lv <= 0) return;
    // 御剑飞行为切换式：飞行中再次施放立即收剑（不受冷却限制）
    if (def.kind === 'fly' && p.flying) { this.endFlight('收剑落地'); return; }
    if ((p.cds[def.id] || 0) > 0) return;
    if (p.mp < def.mpCost) {
      this.floatAt(p.x, p.y - 90, '灵力不足!', '#7ab8ff', 16);
      sfx.err();
      return;
    }
    p.mp -= def.mpCost;
    p.cds[def.id] = def.cooldown;
    p.facing = this.faceAim();
    const mult = def.mult(lv) * this.buffMult();

    switch (def.kind) {
      case 'melee': {
        // 破岳剑诀
        p.attackT = 0.3; p.attackMax = 0.3;
        sfx.attack(); sfx.hit();
        this.slashes.push({ x: p.x, y: p.y - 26, facing: p.facing, t: 0.28, max: 0.28, kind: 'big' });
        this.shake(0.5, 4);
        this.hitArea(p.x + p.facing * 66, p.y - 28, 120, 100, mult);
        break;
      }
      case 'spin': {
        // 游龙剑阵
        p.attackT = 0.4; p.attackMax = 0.4;
        sfx.spin();
        this.slashes.push({ x: p.x, y: p.y, facing: p.facing, t: 0.42, max: 0.42, kind: 'spin' });
        this.shake(0.55, 5);
        this.hitCircle(p.x, p.y - 24, 138, mult);
        break;
      }
      case 'buff': {
        // 剑心通明
        sfx.buff();
        p.buffs.push({ name: def.name, until: this.time + 15, mult: def.mult(lv) });
        this.floatAt(p.x, p.y - 100, '剑心通明!', '#ffb347', 20);
        for (let i = 0; i < 16; i++) {
          this.particles.push({
            x: p.x + (Math.random() - 0.5) * 40, y: p.y - Math.random() * 60,
            vx: (Math.random() - 0.5) * 60, vy: -80 - Math.random() * 120,
            life: 0.7, maxLife: 0.7, size: 4 + Math.random() * 4,
            color: '#ffb347', grav: -60, kind: 'glow',
          });
        }
        break;
      }
      case 'fire': {
        // 离火：5发扇形火球散射！
        p.castT = 0.32; p.castMax = 0.32;
        sfx.fire();
        this.shake(0.4, 4);
        this.slashes.push({ x: p.x + p.facing * 12, y: p.y - 48, facing: p.facing, t: 0.24, max: 0.24, kind: 'cast' });

        // 计算朝向鼠标的基准角度
        const baseAngle = Math.atan2(this.aimY - (p.y - 44), this.aimX - p.x);
        const spreadDegs = [-22, -11, 0, 11, 22]; // 5个方向扇形
        for (const deg of spreadDegs) {
          const ang = baseAngle + (deg * Math.PI) / 180;
          const spd = 620;
          this.projectiles.push({
            x: p.x + p.facing * 16,
            y: p.y - 44,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            kind: 'fire',
            mult: 1.5 * this.buffMult(),
            life: 0.85,
            maxLife: 0.85,
            r: 12,
            hitIds: new Set(),
          });
        }
        break;
      }
      case 'ice': {
        // 玄冰箭：CD 0.1s，冲锋枪式高速冰刺，微量散布
        p.castT = 0.1; p.castMax = 0.1;
        sfx.ice();
        const baseAngle = Math.atan2(this.aimY - (p.y - 44), this.aimX - p.x);
        const spread = (Math.random() - 0.5) * 0.14; // 稍微散布体现射击质感
        const ang = baseAngle + spread;
        const spd = 780; // 极速
        this.projectiles.push({
          x: p.x + p.facing * 16,
          y: p.y - 44,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          kind: 'ice',
          mult: 0.65 * this.buffMult(),
          life: 0.75,
          maxLife: 0.75,
          r: 10,
          hitIds: new Set(),
        });
        break;
      }
      case 'giant_sword': {
        // 巨剑术：召唤巨大飞剑向前慢速贯穿多目标推进
        p.attackT = 0.35; p.attackMax = 0.35;
        sfx.giantSword();
        this.shake(0.6, 5);
        const v = this.aimVec(p.x, p.y - 30, 240); // 慢速推进
        const ang = Math.atan2(v.vy, v.vx);
        this.projectiles.push({
          x: p.x + p.facing * 20,
          y: p.y - 30,
          vx: v.vx,
          vy: v.vy,
          kind: 'giant_sword',
          mult: 3.2 * this.buffMult(),
          life: 2.8,
          maxLife: 2.8,
          r: 45, // 极大碰撞盒
          hitIds: new Set(),
          pierce: true, // 贯穿
          hitCooldowns: new Map(), // 允许对同一个怪多段伤害（每 0.4s 一次）
          angle: ang,
        });
        break;
      }
      case 'flying_swords': {
        // 万剑决：召唤 8 柄灵剑自动追踪附近敌人
        p.castT = 0.35; p.castMax = 0.35;
        sfx.swordHoming();
        this.shake(0.5, 4);
        for (let i = 0; i < 8; i++) {
          const spawnAng = (i / 8) * Math.PI * 2;
          const sx = p.x + Math.cos(spawnAng) * 45;
          const sy = p.y - 45 + Math.sin(spawnAng) * 30;
          this.projectiles.push({
            x: sx,
            y: sy,
            vx: Math.cos(spawnAng) * 180 + p.facing * 120,
            vy: Math.sin(spawnAng) * 180,
            kind: 'flying_sword',
            mult: 0.85 * this.buffMult(),
            life: 2.2,
            maxLife: 2.2,
            r: 12,
            hitIds: new Set(),
            homingTimer: 0.15 + i * 0.04, // 略微延时后激活自动追踪
          });
        }
        break;
      }
      case 'fly': {
        this.startFlight();
        break;
      }
      case 'blink': {
        const maxD = 300;
        const fromX = p.x, fromY = p.y;
        let dx = this.aimX - p.x;
        let dy = this.aimY - (p.y - 30);
        const dist = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, maxD / dist);
        let nx = p.x + dx * k;
        let ny = p.y + dy * k;
        nx = Math.max(22, Math.min(this.map.width - 22, nx));
        const blinkCeiling = (this.map.top ?? 0) + 40;
        ny = Math.max(blinkCeiling, Math.min(this.floorYAt(nx), ny));
        p.x = nx; p.y = ny;
        p.vx = 0; p.vy = 0;
        p.onRope = false; p.rope = null;
        p.invulnT = Math.max(p.invulnT, 0.4);
        p.facing = nx >= fromX ? 1 : -1;
        // 被动心法【遁光】：缩地成寸后也可以悬停空中，不再坠落
        if (this.passiveFx(p).lightFlight) {
          p.flying = true;
          p.flightMode = 'light';
          p.onGround = false;
          p.vx = 0;
          p.vy = 0;
        }
        sfx.blink();
        // 残影
        for (let i = 0; i <= 12; i++) {
          const q = i / 12;
          this.particles.push({
            x: fromX + (nx - fromX) * q, y: fromY - 30 + (ny - fromY) * q,
            vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40,
            life: 0.32 + Math.random() * 0.2, maxLife: 0.52,
            size: 5 + Math.random() * 4,
            color: i % 2 ? '#bfe9ff' : '#e9d7ff', grav: 0, kind: 'glow',
          });
        }
        this.slashes.push({ x: fromX, y: fromY - 30, facing: p.facing, t: 0.24, max: 0.24, kind: 'cast' });
        this.slashes.push({ x: nx, y: ny - 30, facing: p.facing, t: 0.28, max: 0.28, kind: 'cast' });
        if (dist > maxD) this.floatAt(nx, ny - 96, '已达极限距离', '#a8b8d8', 14);
        break;
      }
      case 'dash': {
        // 无影斩：朝鼠标方向沿地面疾掠一段距离，斩击沿途所有敌人
        const dashDist = 320;
        const fromX = p.x, fromY = p.y;
        const dir: 1 | -1 = this.aimX >= p.x ? 1 : -1;
        p.facing = dir;
        let nx = p.x + dir * dashDist;
        nx = Math.max(22, Math.min(this.map.width - 22, nx));
        const ny = this.floorYAt(nx);
        const lo = Math.min(fromX, nx), hi = Math.max(fromX, nx);
        // 沿途矩形范围命中（以斩击高度覆盖一人高）
        const cy = fromY - 30;
        for (const m of this.mobs) {
          if (m.dead) continue;
          const mmid = m.y - m.def.h / 2;
          if (m.x + m.def.w / 2 >= lo - 20 && m.x - m.def.w / 2 <= hi + 20 &&
              Math.abs(mmid - cy) < (m.def.h + 120) / 2) {
            this.hitMob(m, mult, {});
          }
        }
        // 位移
        p.x = nx;
        p.y = ny;
        p.vx = 0; p.vy = 0;
        p.onRope = false; p.rope = null;
        p.invulnT = Math.max(p.invulnT, 0.25);
        // 无影斩是沿地面疾掠，落地后不触发遁光飞行
        p.attackT = 0.22; p.attackMax = 0.22;
        sfx.attack(); sfx.spin();
        this.shake(0.4, 4);
        // 疾掠残影 + 斩击轨迹
        this.slashes.push({ x: (fromX + nx) / 2, y: cy, facing: dir, t: 0.3, max: 0.3, kind: 'dash', w: hi - lo });
        for (let i = 0; i <= 14; i++) {
          const q = i / 14;
          this.particles.push({
            x: fromX + (nx - fromX) * q, y: cy + (Math.random() - 0.5) * 26,
            vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40,
            life: 0.3 + Math.random() * 0.18, maxLife: 0.48,
            size: 4 + Math.random() * 4,
            color: i % 2 ? '#d8f0ff' : '#ffffff', grav: 0, kind: 'glow',
          });
        }
        break;
      }
    }
    this.notify();
  }

  /* ---------------- 御剑飞行 ---------------- */

  private flySkill() {
    return SKILLS.find((s) => s.kind === 'fly') ?? null;
  }

  private startFlight(mode: 'skill' | 'light' = 'skill') {
    const p = this.player;
    p.flying = true;
    p.flightMode = mode;
    p.flyT = 0;
    p.onRope = false;
    p.rope = null;
    p.onGround = false;
    p.dropT = 0;
    p.vy = -170;
    sfx.fly();
    this.floatAt(p.x, p.y - 104, mode === 'light' ? '遁光腾空!' : '御剑凌空!', mode === 'light' ? '#fff1a8' : '#bfe9ff', 20);
    this.burst(p.x, p.y, 16, '#bfe9ff', 3, 170, 'glow');
    this.notify();
  }

  private endFlight(reason?: string) {
    const p = this.player;
    if (!p.flying) return;
    const wasSkillFlight = p.flightMode === 'skill';
    p.flying = false;
    p.flightMode = null;
    const def = this.flySkill();
    if (wasSkillFlight && def) p.cds[def.id] = Math.max(p.cds[def.id] || 0, def.cooldown);
    if (p.vy < 0) p.vy = 0;
    sfx.flyEnd();
    this.burst(p.x, p.y - 16, 10, '#bfe9ff', 2.6, 120, 'smoke');
    if (reason) this.floatAt(p.x, p.y - 92, reason, '#a8b8d8', 15);
    this.notify();
  }

  private updateFlight(dt: number, left: boolean, right: boolean, up: boolean, down: boolean) {
    const p = this.player;
    const def = this.flySkill();
    const lv = def ? p.skills[def.id] || 1 : 1;
    const px = this.passiveFx(p);
    const lightFlight = p.flightMode === 'light' || px.lightFlight;
    const drain = lightFlight ? 0 : (def?.drain ? def.drain(lv) : 8);
    if (drain > 0) {
      p.mp -= drain * dt;
      if (p.mp <= 0) {
        p.mp = 0;
        this.endFlight('灵力枯竭');
        return;
      }
    }
    const flightMul = 1 + (lightFlight ? Math.max(1, px.flightSpeedPct) : px.flightSpeedPct);
    const hSpd = 300 * flightMul, vSpd = 250 * flightMul;
    if (left && !right) { p.vx = Math.max(-hSpd, p.vx - 1900 * dt); p.facing = -1; }
    else if (right && !left) { p.vx = Math.min(hSpd, p.vx + 1900 * dt); p.facing = 1; }
    else p.vx *= Math.max(0, 1 - 4.5 * dt);
    if (up && !down) p.vy = Math.max(-vSpd, p.vy - 1700 * dt);
    else if (down && !up) p.vy = Math.min(vSpd, p.vy + 1700 * dt);
    else p.vy *= Math.max(0, 1 - 5 * dt);

    p.x = Math.max(22, Math.min(this.map.width - 22, p.x + p.vx * dt));
    p.y += p.vy * dt;
    const floor = this.floorYAt(p.x);
    if (p.y > floor) { p.y = floor; p.vy = 0; }
    const ceiling = (this.map.top ?? 0) + 40; // 允许飞到地图顶部附近
    if (p.y < ceiling) { p.y = ceiling; p.vy = 0; }
    p.onGround = false;
    p.coyoteT = 0;
    p.jumpBufT = 0;
    p.flyT += dt;
    // 剑气尾迹
    if (Math.random() < dt * 30) {
      this.particles.push({
        x: p.x - p.facing * 14 + (Math.random() - 0.5) * 14,
        y: p.y - 2 + (Math.random() - 0.5) * 10,
        vx: -p.facing * (60 + Math.random() * 60), vy: 20 + Math.random() * 40,
        life: 0.42, maxLife: 0.42, size: 3 + Math.random() * 3,
        color: Math.random() < 0.5 ? '#bfe9ff' : '#ffe9a8', grav: 60, kind: 'glow',
      });
    }
  }

  /* ---------------- 伤害判定 ---------------- */

  private hitArea(cx: number, cy: number, w: number, h: number, mult: number) {
    for (const m of this.mobs) {
      if (m.dead) continue;
      if (Math.abs(m.x - cx) < (w + m.def.w) / 2 && Math.abs(m.y - m.def.h / 2 - cy) < (h + m.def.h) / 2) {
        this.hitMob(m, mult, {});
      }
    }
  }

  private hitCircle(cx: number, cy: number, r: number, mult: number) {
    for (const m of this.mobs) {
      if (m.dead) continue;
      const dx = m.x - cx;
      const dy = m.y - m.def.h / 2 - cy;
      if (dx * dx + dy * dy < (r + m.def.w * 0.4) * (r + m.def.w * 0.4)) {
        this.hitMob(m, mult, {});
      }
    }
  }

  private hitMob(
    m: Mob,
    mult: number,
    opts: { noKnock?: boolean; freeze?: number; splash?: boolean; element?: ElementType },
  ) {
    const p = this.player;
    const variance = 0.9 + Math.random() * 0.2;
    const crit = Math.random() * 100 < p.derived.critRate;
    const critMultiplier = crit ? (p.derived.critDmg / 100) : 1;
    let dmg = this.baseDamage(opts.element) * mult * variance * critMultiplier;
    dmg = Math.max(1, dmg - m.def.def * 0.5);
    const final = Math.round(dmg);
    m.hp -= final;
    m.hitFlash = 0.13;
    p.lastCombatT = this.time;
    // 木桩：受击立刻回满 HP，不击退不冻结
    if (m.def.dummy) {
      m.hp = m.maxHp;
      this.floatAt(
        m.x + (Math.random() - 0.5) * 20, m.y - m.def.h - 8,
        String(final), crit ? '#ffb347' : '#ffffff', crit ? 27 : 19, crit,
      );
      this.burst(m.x, m.y - m.def.h / 2, crit ? 8 : 4, crit ? '#ffd97a' : '#ffffff', 2.4, crit ? 180 : 100, 'spark');
      if (crit) sfx.crit(); else sfx.hit();
      return;
    }
    if (opts.freeze) {
      m.frozenT = Math.max(m.frozenT, opts.freeze);
      this.burst(m.x, m.y - m.def.h / 2, 8, '#aee2ff', 3, 100, 'shard');
    }
    if (!opts.noKnock && !m.def.boss) {
      m.vx = (m.x >= p.x ? 1 : -1) * 170;
    }
    this.floatAt(
      m.x + (Math.random() - 0.5) * 20, m.y - m.def.h - 8,
      String(final), crit ? '#ffb347' : '#ffffff', crit ? 27 : 19, crit,
    );
    this.burst(m.x, m.y - m.def.h / 2, crit ? 12 : 6, crit ? '#ffd97a' : '#ffffff', 2.6, crit ? 220 : 130, 'spark');
    if (crit) sfx.crit(); else sfx.hit();
    if (m.hp <= 0) this.killMob(m);
    else if (opts.splash) {
      for (const o of this.mobs) {
        if (o === m || o.dead) continue;
        const dx = o.x - m.x;
        const dy = o.y - m.y;
        if (dx * dx + dy * dy < 80 * 80) {
          o.hp -= Math.round(final * 0.4);
          o.hitFlash = 0.13;
          this.floatAt(o.x, o.y - o.def.h - 6, String(Math.round(final * 0.4)), '#ffc07a', 15);
          if (o.hp <= 0) this.killMob(o);
        }
      }
    }
  }

  private killMob(m: Mob) {
    if (m.dead) return;
    m.dead = true;
    m.hp = 0;
    const p = this.player;
    sfx.mobDie();
    this.shake(0.4, m.def.boss ? 8 : 3);
    this.burst(m.x, m.y - m.def.h / 2, m.def.boss ? 40 : 14, m.def.c[0], 4, 240, 'spark');
    this.burst(m.x, m.y - m.def.h / 2, 8, '#ffffff', 3, 120, 'smoke');

    // 修为
    const expGain = m.def.exp;
    p.exp += expGain;
    this.floatAt(m.x, m.y - m.def.h - 26, '+' + expGain + ' 修为', '#ffe97a', 15);
    this.settleLevels();

    // 金币
    const gold = Math.round(m.def.level * 4 * (0.8 + Math.random() * 0.5)) + 2;
    this.drops.push({ x: m.x + (Math.random() - 0.5) * 24, y: m.y - 20, vy: -160, kind: 'gold', gold, life: 40, phase: Math.random() * 6 });

    // 掉落
    const senseBoost = p.derived.sense * 0.12; // 神识灵觉提升掉落品质
    if (m.def.boss) {
      this.dropEquip(m, 3);
      this.dropEquip(m, 2);
      // 地图 BOSS 有较高概率掉落法宝
      if (Math.random() < 0.65) this.dropArtifact(m);
      for (let i = 0; i < 5; i++) {
        this.drops.push({ x: m.x + (Math.random() - 0.5) * 160, y: m.y - 30 - Math.random() * 40, vy: -200 - Math.random() * 140, kind: 'gold', gold: 220 + Math.round(Math.random() * 120), life: 60, phase: Math.random() * 6 });
      }
    } else {
      const roll = Math.random() * 100;
      if (roll < 20) this.dropEquip(m, rollRarity(senseBoost));
      else if (roll < 42) {
        const kind = Math.random() < 0.62 ? 'hp' : 'mp';
        this.drops.push({ x: m.x, y: m.y - 16, vy: -150, kind, gold: 0, life: 40, phase: Math.random() * 6 });
      }
    }

    // 重生
    m.respawnT = m.def.boss ? 999999 : 6 + Math.random() * 4;
    if (m.def.boss) {
      const questId = 'slay:' + m.def.id;
      const isTrial = !this.questFlags.has(questId);
      this.questFlags.add(questId);
      sfx.levelup();
      if (m.def.final) {
        this.victory = true;
        this.pushLog('🏆 镇压赤魇妖王！云海诸峰重归清宁', '#ffd94a');
      } else {
        this.pushLog(`🏆 击败了 ${m.def.name}！`, '#ffd94a');
      }
      // 若该妖王正是当前瓶颈的试炼目标，立即提示并结算突破
      const gate = gateAt(p.level);
      if (isTrial && gate?.quest?.id === questId) {
        this.pushLog(`✨ ${gate.quest.title} 已达成，可以突破了！`, '#aef1ff');
      }
      this.bottleneckWarned = false;
      this.settleLevels();
      this.notify();
    }
  }

  /* ---------------- NPC 交互与商店 ---------------- */

  /**
   * 商店条目 → 可购买的实际装备（固定底材与品质）
   * 结果会缓存，保证「货架预览」与「实际买到的东西」完全一致，
   * 且不会因每帧刷新快照而不断重掷随机词条。
   */
  private shopEquip(baseName: string, rarity: Rarity): EquipmentItem | null {
    const key = `${this.player.classId}|${baseName}|${rarity}`;
    const cached = this.shopCache.get(key);
    if (cached) return cached;
    const base = ITEM_POOL.find((it) => it.name === baseName);
    if (!base) return null;
    const item = this.genEquipment(base.tier, rarity, base);
    this.shopCache.set(key, item);
    return item;
  }

  openNpc(id: string) {
    const npc = this.npcs.find((n) => n.id === id);
    if (!npc) return;
    this.activeNpc = npc;
    this.npcLineIdx = 0;
    this.npcShopOpen = false;
    sfx.ui();
    this.notify();
  }

  /** 对话翻页；读完后商人自动展开货架 */
  npcNext() {
    const npc = this.activeNpc;
    if (!npc) return;
    if (this.npcLineIdx < npc.lines.length - 1) {
      this.npcLineIdx++;
      sfx.ui();
    } else if (npc.kind === 'merchant' && !this.npcShopOpen) {
      this.npcShopOpen = true;
      sfx.equip();
    } else {
      this.closeNpc();
      return;
    }
    this.notify();
  }

  closeNpc() {
    if (!this.activeNpc) return;
    this.activeNpc = null;
    this.npcShopOpen = false;
    this.npcLineIdx = 0;
    sfx.ui();
    this.notify();
  }

  /** 购买商品：丹药直接入袋，法器进乾坤袋 */
  buyShopItem(entryId: string) {
    const npc = this.activeNpc;
    const p = this.player;
    if (!npc || !npc.shop) return;
    const entry = npc.shop.find((s) => s.id === entryId);
    if (!entry) return;
    if (p.gold < entry.price) {
      sfx.err();
      this.pushLog('灵石不足，无法购买 ' + entry.name, '#ff8a8a');
      this.notify();
      return;
    }
    if (entry.kind === 'hp' || entry.kind === 'mp') {
      p.gold -= entry.price;
      p.potions[entry.kind]++;
      sfx.potion();
      this.pushLog(`购入 ${entry.name} ×1（余 ${p.gold} 灵石）`, '#7ae06a');
    } else if (entry.kind === 'book') {
      // 购买技能书
      if (p.inventory.length >= 24) {
        sfx.err(); this.pushLog('乾坤袋已满，无法购买技能书', '#ff8a8a'); this.notify(); return;
      }
      this.addBookToInventory(p, entry.bookId ?? '', entry.price);
      return;
    } else {
      if (p.inventory.length >= 24) {
        sfx.err();
        this.pushLog('乾坤袋已满，无法购买法器', '#ff8a8a');
        this.notify();
        return;
      }
      const preview = this.shopEquip(entry.base ?? '', entry.rarity ?? 0);
      if (!preview) return;
      p.gold -= entry.price;
      const item: EquipmentItem = { ...preview, uid: UID++ };
      this.shopCache.delete(`${p.classId}|${entry.base}|${entry.rarity ?? 0}`);
      p.inventory.push({ t: 'eq', item });
      sfx.equip();
      this.pushLog(`购入 [${RARITY_NAME[item.rarity]}] ${item.name}（余 ${p.gold} 灵石）`, RARITY_COLOR[item.rarity]);
    }
    this.notify();
  }

  private addBookToInventory(p: PlayerState, bookId: string, price: number) {
    const book = bookById(bookId);
    if (!book) { sfx.err(); return; }
    p.gold -= price;
    p.inventory.push({
      t: 'book', bookId: book.id, skillId: book.skillId,
      name: book.name, rarity: book.rarity, reqLevel: book.reqLevel,
    });
    sfx.pickup();
    this.pushLog(`购入 ${book.name}，进入乾坤袋（按 I 点击参悟）`, RARITY_COLOR[book.rarity]);
    this.notify();
  }

  /* ---------------- 境界与突破 ---------------- */

  /** 当前等级的试炼是否尚未完成（修为满时会卡在瓶颈） */
  private gateBlocked(level: number): boolean {
    const gate = gateAt(level);
    if (!gate || !gate.quest) return false;
    return !this.questFlags.has(gate.quest.id);
  }

  /** 结算修为：能突破就突破，被试炼卡住则停在圆满状态 */
  private settleLevels() {
    const p = this.player;
    let guard = 0;
    while (p.exp >= expNeed(p.level) && guard++ < 60) {
      if (this.gateBlocked(p.level)) {
        p.exp = expNeed(p.level);
        if (!this.bottleneckWarned) {
          this.bottleneckWarned = true;
          const q = gateAt(p.level)!.quest!;
          sfx.bottleneck();
          this.floatAt(p.x, p.y - 100, '修为圆满 · 遇到瓶颈', '#ffd94a', 19);
          this.pushLog(`⚑ 修为圆满，需完成【${q.title}】方可突破`, '#ffd94a');
          this.pushLog(q.detail, '#aef1ff');
        }
        break;
      }
      p.exp -= expNeed(p.level);
      this.levelUp();
    }
  }

  private dropEquip(m: Mob, rarity: Rarity) {
    const item = this.genEquipment(pickItemLevel(m.def.level), rarity);
    this.drops.push({ x: m.x + (Math.random() - 0.5) * 30, y: m.y - 24, vy: -180, kind: 'equip', gold: 0, item, life: 60, phase: Math.random() * 6 });
  }

  /** 生成一件法宝（不带任何属性，仅带 artifactId 机制） */
  private makeArtifact(id: ArtifactId): EquipmentItem {
    const def = artifactById(id);
    return {
      uid: UID++,
      name: def.name,
      slot: 'artifact',
      rarity: def.rarity,
      level: 1,
      power: 0, def: 0, hp: 0, mp: 0,
      sense: 0, agility: 0, critRate: 0, critDmg: 0,
      metal: 0, wood: 0, water: 0, fire: 0, earth: 0,
      artifactId: id,
    };
  }

  /** BOSS 掉落法宝：随机一件，玩家已拥有的不再重复掉落 */
  private dropArtifact(m: Mob) {
    const p = this.player;
    const owned = new Set<string>();
    if (p.equipment.artifact?.artifactId) owned.add(p.equipment.artifact.artifactId);
    for (const it of p.inventory) {
      if (it.t === 'eq' && it.item.artifactId) owned.add(it.item.artifactId);
    }
    const pool = ALL_ARTIFACTS.filter((a) => !owned.has(a.id));
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const item = this.makeArtifact(pick.id);
    this.drops.push({
      x: m.x + (Math.random() - 0.5) * 40, y: m.y - 40,
      vy: -240, kind: 'equip', gold: 0, item, life: 90, phase: Math.random() * 6,
    });
    this.pushLog(`✦ 妖王陨落，天降法宝【${pick.name}】！`, pick.color);
    this.burst(m.x, m.y - m.def.h / 2, 30, pick.color, 4.5, 260, 'glow');
  }

  private genEquipment(targetLevel: number, rarity: Rarity, forceBase?: ItemBase): EquipmentItem {
    const eligible = ITEM_POOL.filter((it) => it.tier <= Math.max(1, targetLevel + 3));
    const pick = forceBase ?? eligible[Math.floor(Math.random() * eligible.length)] ?? ITEM_POOL[0];
    const mult = RARITY_MULT[rarity];
    const tier = pick.tier;
    const item: EquipmentItem = {
      uid: UID++,
      name: RARITY_PREFIX[rarity] + pick.name,
      slot: pick.slot,
      rarity,
      level: tier,
      power: 0, def: 0, hp: 0, mp: 0,
      sense: 0, agility: 0, critRate: 0, critDmg: 0,
      metal: 0, wood: 0, water: 0, fire: 0, earth: 0,
    };
    const r = (v: number) => Math.max(1, Math.round(v));
    switch (pick.slot) {
      case 'weapon':
        item.power = r((6 + tier * 3.2) * mult);
        if (rarity >= 2) item.critDmg = r(tier * 1.5 * mult);
        break;
      case 'helmet':
        item.def = r((2 + tier * 1.2) * mult);
        item.mp = r((10 + tier * 4.0) * mult);
        if (rarity >= 1) item.sense = r((2 + tier * 0.8) * mult);
        break;
      case 'armor':
        item.def = r((4 + tier * 2.0) * mult);
        item.hp = r((20 + tier * 8.0) * mult);
        break;
      case 'gloves':
        item.power = r((2 + tier * 1.4) * mult);
        item.critRate = r((2 + tier * 0.6) * mult);
        if (rarity >= 1) item.agility = r((1 + tier * 0.5) * mult);
        break;
      case 'shoes':
        item.agility = r((3 + tier * 1.2) * mult);
        if (rarity >= 1) item.def = r((1 + tier * 0.8) * mult);
        break;
      case 'artifact':
        break;
    }
    // 附加随机词条
    const bonusCount = rarity;
    const opts: (keyof Pick<EquipmentItem, 'power' | 'def' | 'hp' | 'mp' | 'sense' | 'agility' | 'critRate' | 'metal' | 'wood' | 'water' | 'fire' | 'earth'>)[] = [
      'power', 'def', 'hp', 'mp', 'sense', 'agility', 'critRate',
      'metal', 'wood', 'water', 'fire', 'earth',
    ];
    for (let i = 0; i < bonusCount; i++) {
      const k = opts[Math.floor(Math.random() * opts.length)];
      if (k === 'hp') item.hp += r(tier * 6 * mult);
      else if (k === 'mp') item.mp += r(tier * 4 * mult);
      else if (k === 'power') item.power += r((1 + tier * 1.2) * mult);
      else if (k === 'def') item.def += r((1 + tier * 0.8) * mult);
      else if (k === 'critRate') item.critRate += r((1 + tier * 0.4) * mult);
      else if (k === 'sense') item.sense += r((1 + tier * 0.6) * mult);
      else if (k === 'agility') item.agility += r((1 + tier * 0.6) * mult);
      else {
        // 五行灵根词条
        item[k] += r((3 + tier * 2.0) * mult);
      }
    }
    return item;
  }

  private damagePlayer(rawAtk: number, srcX: number) {
    const p = this.player;
    if (p.invulnT > 0 || p.dead) return;

    // 身法闪避判定
    if (Math.random() * 100 < p.derived.dodgeRate) {
      this.floatAt(p.x, p.y - 84, '闪避!', '#7ae06a', 20, true);
      // 身法轻灵残影
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x: p.x + (Math.random() - 0.5) * 20, y: p.y - 20 - Math.random() * 20,
          vx: (Math.random() - 0.5) * 50, vy: -30 - Math.random() * 40,
          life: 0.28, maxLife: 0.28, size: 3,
          color: '#7ae06a', grav: 0, kind: 'glow',
        });
      }
      p.invulnT = 0.35;
      sfx.jump();
      return;
    }

    const variance = 0.9 + Math.random() * 0.2;
    let dmg = Math.max(1, Math.round(rawAtk * variance - p.derived.def * 0.7));

    // 被动心法【灵力护体】：部分伤害由灵力承担
    const px = this.passiveFx(p);
    if (px.mpShieldPct > 0 && p.mp > 0) {
      const wanted = dmg * px.mpShieldPct;           // 期望由灵力挡下的伤害
      const affordable = p.mp / px.mpShieldCost;     // 当前灵力最多能挡多少伤害
      const absorbed = Math.floor(Math.min(wanted, affordable));
      if (absorbed > 0) {
        p.mp = Math.max(0, p.mp - absorbed * px.mpShieldCost);
        dmg -= absorbed;
        this.floatAt(p.x - 18, p.y - 66, '护体 -' + absorbed, '#7ab8ff', 15);
        // 护体灵光
        for (let i = 0; i < 8; i++) {
          const a = Math.random() * Math.PI * 2;
          this.particles.push({
            x: p.x + Math.cos(a) * 26, y: p.y - 30 + Math.sin(a) * 32,
            vx: Math.cos(a) * 70, vy: Math.sin(a) * 70,
            life: 0.3, maxLife: 0.3, size: 3.5,
            color: '#7ab8ff', grav: 0, kind: 'glow',
          });
        }
        sfx.ice();
      }
    }
    dmg = Math.max(0, dmg);
    p.hp -= dmg;
    p.lastCombatT = this.time;
    p.hurtT = 0.4;
    p.invulnT = 0.85;
    p.vx = (p.x >= srcX ? 1 : -1) * 190;
    p.vy = -190;
    p.onGround = false;
    this.shake(0.6, 5);
    sfx.hurt();
    this.floatAt(p.x, p.y - 80, '-' + dmg, '#ff6a6a', 20);
    this.burst(p.x, p.y - 30, 8, '#ff6a6a', 2.6, 160, 'spark');
    if (p.hp <= 0) {
      p.hp = 0;
      p.dead = true;
      p.flying = false;
      sfx.die();
      this.pushLog('你被击败了…按 Enter 重新出发', '#ff8a8a');
    }
    this.notify();
  }

  cheatMode() {
    const p = this.player;
    p.gold += 999999; // 给予巨额灵石供自由购买技能书与法器
    // 境界直接拉满
    const prevLevel = p.level;
    p.level = MAX_REALM_LEVEL;
    p.exp = 0;
    if (p.level > prevLevel) {
      const lvGains = p.level - prevLevel;
      // 补发小升级基础属性
      p.base.power += lvGains * 3;
      p.base.def += lvGains * 1;
      p.base.maxHp += lvGains * 28;
      p.base.maxMp += lvGains * 14;
      // 补发大境界突破属性（按经历的境界层阶）
      const tierGains = realmOf(p.level).tier - realmOf(prevLevel).tier;
      if (tierGains > 0) {
        p.base.power += tierGains * 35;
        p.base.def += tierGains * 18;
        p.base.maxHp += tierGains * 300;
        p.base.maxMp += tierGains * 180;
        p.adv.sense += tierGains * 6;
        p.adv.agility += tierGains * 6;
        p.adv.critRate += tierGains * 2;
        p.adv.critDmg += tierGains * 10;
      }
    }
    // 解锁全部地图（山海图可直接传送到任意区域）
    for (const m of MAPS) this.visited.add(m.id);
    // 视作已完成所有已开放的突破试炼（方便后续测试突破）
    for (const g of REALM_GATES) if (g.quest) this.questFlags.add(g.quest.id);
    this.bottleneckWarned = false;
    this.checkAutoLearn(); // 补发境界自动领悟的心法（如筑基的灵力护体、元婴的遁光）
    this.calcDerived(p);
    p.hp = p.derived.maxHp;
    p.mp = p.derived.maxMp;
    this.pushLog(`✨ 【作者模式】已激活：境界直升【${realmOf(p.level).name}】，灵石 +999999`, '#ffcf6b');
    this.pushLog('🗺 全地图与作者测试场已解锁！可在右上角或测试场打开 [⚡ 控制台]', '#aef1ff');
    sfx.breakthrough();
    this.notify();
  }

  /* ---------------- 测试控制台指令 ---------------- */

  learnSkillDirectly(skillId: string) {
    const p = this.player;
    const def = skillById(skillId);
    if (!def) return;
    const first = (p.skills[skillId] || 0) === 0;
    p.skills[skillId] = 1;
    sfx.skillUp();
    this.pushLog(`✨ 【控制台】参悟法诀【${def.name}】！`, '#ffcf6b');
    if (def.passive) {
      const oldHp = p.derived.maxHp, oldMp = p.derived.maxMp;
      this.calcDerived(p);
      p.hp += Math.max(0, p.derived.maxHp - oldHp);
      p.mp += Math.max(0, p.derived.maxMp - oldMp);
    } else if (first) {
      // 如果快捷栏有空位，自动装载
      const emptyIdx = p.loadout.findIndex((slot, idx) => idx > 0 && !slot);
      if (emptyIdx > 0 && !p.loadout.includes(skillId)) {
        p.loadout[emptyIdx] = skillId;
      }
    }
    this.floatAt(p.x, p.y - 100, `学会【${def.name}】`, def.color, 20, true);
    this.notify();
  }

  learnAllSkillsDirectly() {
    const p = this.player;
    for (const s of SKILLS) {
      p.skills[s.id] = 1;
    }
    const oldHp = p.derived.maxHp, oldMp = p.derived.maxMp;
    this.calcDerived(p);
    p.hp += Math.max(0, p.derived.maxHp - oldHp);
    p.mp += Math.max(0, p.derived.maxMp - oldMp);
    const activeIds = SKILLS.filter((s) => !s.passive).map((s) => s.id);
    p.loadout = ['attack', ...activeIds.slice(0, 8)];
    p.activeSlot = 0;
    sfx.levelup();
    this.pushLog('✨ 【控制台】一键学会全部法诀，并装载至快捷栏！', '#ffcf6b');
    this.floatAt(p.x, p.y - 100, '万法精通!', '#ffcf6b', 24, true);
    this.notify();
  }

  spawnEnemyDirectly(enemyId: string) {
    const p = this.player;
    const def = ENEMIES[enemyId];
    if (!def) return;
    const spawnX = Math.max(50, Math.min(this.map.width - 50, p.x + p.facing * 180));
    const spawnY = this.floorYAt(spawnX);
    const mob = this.makeMob(enemyId, spawnX, spawnY);
    this.mobs.push(mob);
    sfx.mobDie();
    this.burst(spawnX, spawnY - def.h / 2, 14, def.c[0], 3, 160, 'spark');
    this.pushLog(`👹 【控制台】召唤妖物【${def.name}】！`, '#ff8a8a');
    this.floatAt(spawnX, spawnY - def.h - 20, `现形: ${def.name}`, '#ff8a8a', 16);
    this.notify();
  }

  clearEnemiesDirectly() {
    this.mobs = this.mobs.filter((m) => m.def.dummy);
    sfx.die();
    this.pushLog('🧹 【控制台】已清空周围全部非木桩妖物', '#aef1ff');
    this.notify();
  }

  grantArtifactDirectly(artifactId: ArtifactId) {
    const p = this.player;
    const item = this.makeArtifact(artifactId);
    if (p.inventory.length >= 24) {
      this.pushLog('乾坤袋已满，无法放入法宝', '#ff8a8a');
      sfx.err();
      return;
    }
    p.inventory.push({ t: 'eq', item });
    sfx.equip();
    this.pushLog(`🔮 【控制台】获得法宝【${item.name}】，已存入乾坤袋（按 I 查看）！`, '#c06bff');
    this.floatAt(p.x, p.y - 100, `获得法宝【${item.name}】`, '#c06bff', 18, true);
    this.notify();
  }

  private levelUp() {
    const p = this.player;
    const prevStage = realmOf(p.level).stage;
    p.level++;
    const realm = realmOf(p.level);
    const rc = realmColor(p.level);
    const majorBreak = realm.stage !== prevStage;

    if (majorBreak) {
      // 大境界突破：基础属性大幅飞跃，进阶属性小幅提升
      p.base.power += 35;
      p.base.def += 18;
      p.base.maxHp += 300;
      p.base.maxMp += 180;
      p.adv.sense += 6;
      p.adv.agility += 6;
      p.adv.critRate += 2;
      p.adv.critDmg += 10;
    } else {
      // 普通小升级：基础属性均匀小幅提升，进阶属性与五行灵根不提升
      p.base.power += 3;
      p.base.def += 1;
      p.base.maxHp += 28;
      p.base.maxMp += 14;
    }

    this.bottleneckWarned = false;
    this.calcDerived(p);
    p.hp = p.derived.maxHp;
    p.mp = p.derived.maxMp;

    if (majorBreak) sfx.breakthrough(); else sfx.levelup();
    this.shake(majorBreak ? 0.9 : 0.6, majorBreak ? 7 : 4);
    this.floatAt(p.x, p.y - 112, majorBreak ? '境界突破!' : '修为精进!', '#ffd94a', majorBreak ? 32 : 27, true);
    this.floatAt(p.x, p.y - 84, realm.name, rc, 20);

    const n = majorBreak ? 46 : 26;
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x: p.x + (Math.random() - 0.5) * 50, y: p.y - Math.random() * 30,
        vx: (Math.random() - 0.5) * (majorBreak ? 190 : 120), vy: -140 - Math.random() * (majorBreak ? 300 : 200),
        life: 1.1, maxLife: 1.1, size: 3.5 + Math.random() * 4,
        color: Math.random() < 0.5 ? rc : '#ffd94a', grav: 60, kind: 'glow',
      });
    }

    if (majorBreak) {
      this.pushLog(
        `⚡ 破境飞跃！晋升【${realm.name}】(Lv.${p.level})：威力+35 · 护体+18 · 气血+300 · 灵力+180 · 神识+6 · 身法+6 · 会心+2% · 会伤+10%`,
        rc,
      );
      this.floatAt(p.x, p.y - 60, '境界飞跃 · 诸元大增', rc, 17);
    } else {
      this.pushLog(
        `修为精进，晋升【${realm.name}】(Lv.${p.level})：威力+3 · 护体+1 · 气血+28 · 灵力+14`,
        '#ffd94a',
      );
      this.floatAt(p.x, p.y - 60, '真元精进', '#7ae06a', 15);
    }

    // 达到境界自动领悟的心法（如筑基期的【灵力护体】、元婴期的【遁光】）
    this.checkAutoLearn();
    this.notify();
  }

  /* ---------------- 怪物 ---------------- */

  private updateMobs(dt: number) {
    const p = this.player;
    for (const m of this.mobs) {
      if (m.dead) {
        if (m.def.boss) continue;
        m.respawnT -= dt;
        if (m.respawnT <= 0) {
          const nm = this.makeMob(m.def.id, m.spawnX);
          Object.assign(m, nm);
        }
        continue;
      }
      m.hitFlash = Math.max(0, m.hitFlash - dt);
      m.contactCd = Math.max(0, m.contactCd - dt);
      // 木桩：完全静止，不追击、不接触伤害
      if (m.def.dummy) {
        m.vx = 0;
        m.state = 'idle';
        continue;
      }
      const frozen = m.frozenT > 0;
      if (frozen) m.frozenT -= dt;
      const slowed = m.slowT > 0;
      if (slowed) m.slowT -= dt;

      const dx = p.x - m.x;
      const dy = p.y - m.y;
      const dist = Math.abs(dx);
      const distY = Math.abs(dy);

      // 飞行敌人：空中巡逻，不受地面限制
      if (m.def.flying) {
        if (!p.dead && dist < m.def.aggro && distY < 280) {
          m.state = 'chase';
          // 保留横向巡航偏移，避免 x 对齐时速度归零导致贴图抽动。
          const cruiseX = p.x + Math.sin(this.time * 0.9 + m.id * 1.7) * 130;
          const cruiseY = p.y - 80 + Math.sin(this.time * 1.35 + m.id) * 70;
          const cruiseDx = cruiseX - m.x;
          if (Math.abs(cruiseDx) < 24) {
            const passDir = Math.sin(this.time * 0.9 + m.id * 1.7) >= 0 ? 1 : -1;
            m.vx = passDir * m.def.speed * 0.45;
          } else {
            m.vx = Math.sign(cruiseDx) * m.def.speed;
          }
          if (Math.abs(m.vx) > 5) m.facing = m.vx >= 0 ? 1 : -1;
          const targetY = cruiseY;
          if (m.y < targetY - 20) m.vy = 45;
          else if (m.y > targetY + 20) m.vy = -45;
          else m.vy = 0;
        } else if (Math.abs(m.x - m.spawnX) > 60) {
          m.state = 'return';
          m.vx = Math.sign(m.spawnX - m.x) * m.def.speed * 0.7;
          m.facing = m.vx >= 0 ? 1 : -1;
          m.vy = 0;
        } else {
          m.wanderT -= dt;
          if (m.wanderT <= 0) {
            m.wanderT = 2 + Math.random() * 2;
            m.vx = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1) * m.def.speed * 0.4;
            if (m.vx !== 0) m.facing = m.vx > 0 ? 1 : -1;
          }
          if (m.state !== 'idle') m.state = 'idle';
          m.vy = 0;
        }
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.x = Math.max(30, Math.min(this.map.width - 30, m.x));
        m.y = Math.max(80, Math.min((this.map.bottom ?? 720) - 80, m.y));
        m.walkPhase += Math.abs(m.vx) * dt * 0.09 + dt * 2;
      }
      // 远程敌人：会发射投射物攻击玩家
      else if (m.def.ranged) {
        m.attackCd = (m.attackCd ?? 0) - dt;
        if (!p.dead && dist < m.def.aggro && distY < 400 && m.attackCd <= 0) {
          const speed = m.def.projectileSpeed ?? 420;
          const angle = Math.atan2((p.y - 30) - m.y, p.x - m.x);
          this.projectiles.push({
            x: m.x, y: m.y - m.def.h / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            kind: 'enemy_arrow',
            mult: m.def.atk * 0.8,
            life: 3, maxLife: 3, r: 6, hitIds: new Set(),
          });
          m.attackCd = m.def.attackInterval ?? 2.5;
        }
        if (!p.dead && dist < m.def.aggro && distY < 400) {
          m.state = 'chase';
          if (dist > 280) {
            m.vx = Math.sign(dx) * m.def.speed * 0.6;
          } else if (dist < 180) {
            m.vx = Math.sign(dx) * -m.def.speed * 0.5;
          } else {
            m.vx = 0;
          }
          m.facing = dx >= 0 ? 1 : -1;
        } else if (Math.abs(m.x - m.spawnX) > 40) {
          m.state = 'return';
          m.vx = Math.sign(m.spawnX - m.x) * m.def.speed * 0.7;
          m.facing = m.vx >= 0 ? 1 : -1;
        } else {
          m.wanderT -= dt;
          if (m.wanderT <= 0) {
            m.wanderT = 1.6 + Math.random() * 2.4;
            m.vx = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1) * m.def.speed * 0.38;
            if (m.vx !== 0) m.facing = m.vx > 0 ? 1 : -1;
          }
          if (m.state !== 'idle') m.state = 'idle';
        }
        if (frozen) m.vx *= 0.22;
        else if (slowed) m.vx *= 0.45;
        const prevY = m.y;
        m.vy = Math.min(MAX_FALL, m.vy + GRAV * dt);
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.x = Math.max(30, Math.min(this.map.width - 30, m.x));
        m.onGround = false;
        if (m.vy >= 0) {
          for (const s of this.map.ground) {
            if (m.x > s.x - 6 && m.x < s.x + s.w + 6 && prevY <= s.y + 2 && m.y >= s.y) {
              m.y = s.y; m.vy = 0; m.onGround = true;
            }
          }
          for (const pl of this.map.platforms) {
            if (m.x > pl.x && m.x < pl.x + pl.w && prevY <= pl.y + 2 && m.y >= pl.y) {
              m.y = pl.y; m.vy = 0; m.onGround = true;
            }
          }
        }
        m.walkPhase += Math.abs(m.vx) * dt * 0.09 + dt * 2;
      }
      // 普通地面敌人
      else if (m.def.boss) {
        // BOSS 状态机
        m.slamCd -= dt;
        m.summonCd -= dt;
        if (m.state === 'tele') {
          m.stateT -= dt;
          m.vx = 0;
          if (m.stateT <= 0) {
            m.state = 'slam';
            m.stateT = 0.25;
            sfx.thunder();
            this.shake(0.9, 9);
            this.burst(m.x, m.y, 26, '#c96f4a', 5, 320, 'spark');
            if (!p.dead && Math.abs(p.x - m.x) < 185 && Math.abs(p.y - m.y) < 90) {
              this.damagePlayer(m.def.atk * 1.6, m.x);
            }
          }
        } else if (m.state === 'slam') {
          m.stateT -= dt;
          m.vx = 0;
          if (m.stateT <= 0) m.state = 'chase';
        } else if (!p.dead && dist < m.def.aggro) {
          m.state = 'chase';
          if (m.slamCd <= 0 && dist < 210 && m.onGround) {
            m.state = 'tele';
            m.stateT = 0.55;
            m.slamCd = 4.2;
            sfx.boss();
          } else {
            m.vx = Math.sign(dx) * m.def.speed;
            m.facing = dx >= 0 ? 1 : -1;
          }
          if (m.summonCd <= 0) {
            m.summonCd = 9;
            const minions = this.mobs.filter((x) => !x.dead && !x.def.boss).length;
            if (minions < 2) {
              const summonId = m.def.summon ?? 'gshroom';
              for (let i = 0; i < 2; i++) {
                const nm = this.makeMob(summonId, m.x + (i === 0 ? -90 : 90));
                nm.y = m.y - 40;
                this.mobs.push(nm);
              }
              this.pushLog(`${m.def.name}召来了${ENEMIES[summonId]?.name ?? '妖侍'}！`, '#ff8a8a');
            }
          }
        } else {
          m.vx = 0;
          m.state = 'idle';
        }
      } else {
        // 普通怪
        if (!p.dead && dist < m.def.aggro && Math.abs(dy) < 110) {
          m.state = 'chase';
          m.vx = Math.sign(dx) * m.def.speed;
          m.facing = dx >= 0 ? 1 : -1;
        } else if (Math.abs(m.x - m.spawnX) > 40) {
          m.state = 'return';
          m.vx = Math.sign(m.spawnX - m.x) * m.def.speed * 0.7;
          m.facing = m.vx >= 0 ? 1 : -1;
        } else {
          m.wanderT -= dt;
          if (m.wanderT <= 0) {
            m.wanderT = 1.6 + Math.random() * 2.4;
            m.vx = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1) * m.def.speed * 0.38;
            if (m.vx !== 0) m.facing = m.vx > 0 ? 1 : -1;
          }
          if (m.state !== 'idle') m.state = 'idle';
        }
      }
      if (!m.def.flying && !m.def.ranged) {
        if (frozen) m.vx *= 0.22;
        else if (slowed) m.vx *= 0.45; // 玄冰箭减速55%

        // 地面单位物理
        const prevY = m.y;
        m.vy = Math.min(MAX_FALL, m.vy + GRAV * dt);
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.x = Math.max(30, Math.min(this.map.width - 30, m.x));
        m.onGround = false;
        if (m.vy >= 0) {
          for (const s of this.map.ground) {
            if (m.x > s.x - 6 && m.x < s.x + s.w + 6 && prevY <= s.y + 2 && m.y >= s.y) {
              m.y = s.y; m.vy = 0; m.onGround = true;
            }
          }
          for (const pl of this.map.platforms) {
            if (m.x > pl.x && m.x < pl.x + pl.w && prevY <= pl.y + 2 && m.y >= pl.y) {
              m.y = pl.y; m.vy = 0; m.onGround = true;
            }
          }
        }
        m.walkPhase += Math.abs(m.vx) * dt * 0.09 + dt * 2;

        // 地面单位接触伤害
        if (!p.dead && m.contactCd <= 0 && Math.abs(p.x - m.x) < (p.w + m.def.w) / 2 - 6 && Math.abs(p.y - p.h / 2 - (m.y - m.def.h / 2)) < (p.h + m.def.h) / 2 - 8) {
          m.contactCd = 0.9;
          this.damagePlayer(m.def.atk, m.x);
        }
      }
      // 飞行单位保留接触伤害，但不受地面碰撞影响；远程单位也可被贴脸惩罚。
      if ((m.def.flying || m.def.ranged) && !p.dead && m.contactCd <= 0
        && Math.abs(p.x - m.x) < (p.w + m.def.w) / 2 - 6
        && Math.abs(p.y - p.h / 2 - (m.y - m.def.h / 2)) < (p.h + m.def.h) / 2 - 8) {
        m.contactCd = 0.9;
        this.damagePlayer(m.def.atk, m.x);
      }
    }
    // 清理被召唤怪尸体
    if (this.mobs.length > 40) this.mobs = this.mobs.filter((m) => !m.dead || !m.def.boss === false || m.respawnT < 90000);
  }

  /* ---------------- 投射物 ---------------- */

  private updateProjectiles(dt: number) {
    const player = this.player;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= dt;

      // 万剑决自动追踪逻辑
      if (pr.kind === 'flying_sword') {
        if (pr.homingTimer && pr.homingTimer > 0) {
          pr.homingTimer -= dt;
        } else {
          // 寻找最近的存活敌人
          let target: Mob | null = null;
          let minD = 580;
          for (const m of this.mobs) {
            if (m.dead || m.def.dummy) continue;
            const d = Math.hypot(m.x - pr.x, m.y - m.def.h / 2 - pr.y);
            if (d < minD) { minD = d; target = m; }
          }
          if (!target) {
            // 没有活怪时，木桩也可作为测试目标
            const dummy = this.mobs.find((m) => m.def.dummy);
            if (dummy) target = dummy;
          }
          if (target) {
            const tx = target.x;
            const ty = target.y - target.def.h / 2;
            const angle = Math.atan2(ty - pr.y, tx - pr.x);
            const curSpd = 720;
            // 平滑转向目标
            pr.vx += (Math.cos(angle) * curSpd - pr.vx) * Math.min(1, dt * 14);
            pr.vy += (Math.sin(angle) * curSpd - pr.vy) * Math.min(1, dt * 14);
          }
        }
      }

      // 巨剑术多段CD冷却更新
      if (pr.hitCooldowns) {
        for (const [mobId, cd] of pr.hitCooldowns.entries()) {
          const next = cd - dt;
          if (next <= 0) pr.hitCooldowns.delete(mobId);
          else pr.hitCooldowns.set(mobId, next);
        }
      }

      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;

      // 尾迹粒子
      if (pr.kind === 'fire' && Math.random() < dt * 40) {
        this.particles.push({
          x: pr.x - Math.sign(pr.vx) * 8, y: pr.y + (Math.random() - 0.5) * 10,
          vx: -Math.sign(pr.vx) * 40, vy: -30 - Math.random() * 30,
          life: 0.3, maxLife: 0.3, size: 4 + Math.random() * 3,
          color: Math.random() < 0.5 ? '#ff9d2e' : '#ffd97a', grav: -40, kind: 'glow',
        });
      }
      if (pr.kind === 'ice' && Math.random() < dt * 45) {
        this.particles.push({
          x: pr.x, y: pr.y + (Math.random() - 0.5) * 8, vx: 0, vy: 10,
          life: 0.25, maxLife: 0.25, size: 2.5, color: '#aee2ff', grav: 0, kind: 'shard',
        });
      }
      if (pr.kind === 'giant_sword' && Math.random() < dt * 60) {
        this.particles.push({
          x: pr.x + (Math.random() - 0.5) * 30, y: pr.y + (Math.random() - 0.5) * 20,
          vx: -pr.vx * 0.3, vy: -pr.vy * 0.3 + (Math.random() - 0.5) * 40,
          life: 0.4, maxLife: 0.4, size: 4 + Math.random() * 4,
          color: '#ffd97a', grav: 0, kind: 'glow',
        });
      }
      if (pr.kind === 'flying_sword' && Math.random() < dt * 35) {
        this.particles.push({
          x: pr.x, y: pr.y, vx: -pr.vx * 0.2, vy: -pr.vy * 0.2,
          life: 0.2, maxLife: 0.2, size: 2.5, color: '#bfe9ff', grav: 0, kind: 'glow',
        });
      }
      if (pr.kind === 'sniper_beam' && Math.random() < dt * 60) {
        this.particles.push({
          x: pr.x + (Math.random() - 0.5) * 16, y: pr.y + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80,
          life: 0.25, maxLife: 0.25, size: 3.5, color: '#ffffff', grav: 0, kind: 'spark',
        });
      }

      let destroy = false;

      // 敌方投射物只检测主角，绝不进入敌人碰撞循环，避免误伤发射者或其他敌人。
      if (pr.kind === 'enemy_arrow') {
        const playerHit = !player.dead
          && Math.abs(pr.x - player.x) < player.w / 2 + pr.r
          && Math.abs(pr.y - (player.y - player.h / 2)) < player.h / 2 + pr.r;
        if (playerHit) {
          this.damagePlayer(pr.mult, pr.x);
          this.burst(pr.x, pr.y, 7, '#ff8a8a', 2.5, 120, 'spark');
          destroy = true;
        }
      } else for (const m of this.mobs) {
        if (m.dead) continue;
        if (!pr.pierce && pr.hitIds.has(m.id)) continue;
        if (pr.hitCooldowns && (pr.hitCooldowns.get(m.id) ?? 0) > 0) continue;

        const hw = m.def.w / 2 + pr.r;
        const top = m.y - m.def.h;
        if (pr.x > m.x - hw && pr.x < m.x + hw && pr.y > top - pr.r && pr.y < m.y + pr.r) {
          pr.hitIds.add(m.id);

          if (pr.kind === 'fire') {
            this.hitMob(m, pr.mult, { splash: true });
            this.burst(pr.x, pr.y, 16, '#ff7a3a', 4, 240, 'spark');
            destroy = true;
          } else if (pr.kind === 'ice') {
            // 玄冰箭：造成伤害并减速敌人 1.8 秒
            m.slowT = Math.max(m.slowT, 1.8);
            this.hitMob(m, pr.mult, {});
            this.burst(pr.x, pr.y, 6, '#8fe6ff', 2.4, 120, 'shard');
            destroy = true;
          } else if (pr.kind === 'giant_sword') {
            // 巨剑术：贯穿多目标，每个怪物每 0.35s 受到一次重击
            this.hitMob(m, pr.mult, { noKnock: true });
            this.shake(0.3, 3);
            this.burst(pr.x, pr.y, 10, '#ffd97a', 3.5, 180, 'spark');
            if (pr.hitCooldowns) pr.hitCooldowns.set(m.id, 0.35);
          } else if (pr.kind === 'flying_sword') {
            // 万剑决：命中单体后爆炸破灭
            this.hitMob(m, pr.mult, {});
            this.burst(pr.x, pr.y, 10, '#aee6ff', 3, 160, 'spark');
            destroy = true;
          } else if (pr.kind === 'sniper_beam') {
            // 天雷决：贯穿式狙击，对路径上每个目标造成一次毁灭伤害
            this.hitMob(m, pr.mult, { noKnock: true });
            this.shake(0.45, 5);
            this.burst(m.x, m.y - m.def.h / 2, 14, '#ffffff', 4, 260, 'spark');
          } else {
            this.hitMob(m, pr.mult, {});
            destroy = true;
          }
          if (destroy) break;
        }
      }

      if (destroy || pr.life <= 0 || pr.x < this.camX - 300 || pr.x > this.camX + this.viewW + 300 || pr.y < this.camY - 200 || pr.y > this.camY + 900) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  /* ---------------- 掉落物 ---------------- */

  private updateDrops(dt: number) {
    const p = this.player;
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.life -= dt;
      if (d.life <= 0) { this.drops.splice(i, 1); continue; }
      const floor = this.floorYAt(d.x);
      if (d.y < floor) {
        d.vy = Math.min(700, d.vy + 1400 * dt);
        d.y = Math.min(floor, d.y + d.vy * dt);
        if (d.y >= floor) d.vy = -d.vy * 0.35;
        if (Math.abs(d.vy) < 40) d.vy = 0;
      }
      if (p.dead) continue;
      const dx = p.x - d.x;
      const dy = p.y - 24 - d.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 110) {
        d.x += dx * dt * 9;
        d.y += dy * dt * 9;
      }
      if (dist < 30) {
        this.collect(d);
        this.drops.splice(i, 1);
      }
    }
  }

  private collect(d: Drop) {
    const p = this.player;
    if (d.kind === 'gold') {
      p.gold += d.gold;
      sfx.gold();
      this.floatAt(p.x, p.y - 84, '+' + d.gold + ' 灵石', '#ffd94a', 14);
    } else if (d.kind === 'hp' || d.kind === 'mp') {
      p.potions[d.kind]++;
      sfx.pickup();
      this.floatAt(p.x, p.y - 84, d.kind === 'hp' ? '+1 回春丹' : '+1 聚灵丹', d.kind === 'hp' ? '#ff8a9a' : '#7ab8ff', 14);
    } else if (d.item) {
      if (p.inventory.length >= 24) {
        if (this.time - this.bagFullLogT > 4) {
          this.pushLog('乾坤袋已满，无法拾取 ' + d.item.name, '#ff8a8a');
          sfx.err();
          this.bagFullLogT = this.time;
        }
        this.drops.push({ ...d, life: 15, x: d.x + (Math.random() > 0.5 ? 120 : -120), y: d.y - 40, vy: -120 });
        return;
      }
      p.inventory.push({ t: 'eq', item: d.item });
      sfx.pickup();
      const rc = RARITY_COLOR[d.item.rarity];
      this.floatAt(p.x, p.y - 84, d.item.name, rc, 16);
      this.pushLog(`获得 [${RARITY_NAME[d.item.rarity]}] ${d.item.name}（${SLOT_NAME[d.item.slot]}·Lv.${d.item.level}）`, rc);
      this.burst(p.x, p.y - 40, 10, rc, 3, 140, 'spark');
    }
    this.notify();
  }

  /* ---------------- 特效工具 ---------------- */

  private burst(x: number, y: number, n: number, color: string, size: number, spd: number, kind: Particle['kind']) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = spd * (0.4 + Math.random() * 0.6);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - spd * 0.25,
        life: 0.4 + Math.random() * 0.4, maxLife: 0.8,
        size: size * (0.6 + Math.random() * 0.8), color,
        grav: kind === 'smoke' ? -60 : 320, kind,
      });
    }
    if (this.particles.length > 380) this.particles.splice(0, this.particles.length - 380);
  }

  private floatAt(x: number, y: number, text: string, color: string, size: number, crit = false) {
    this.floaters.push({ x, y, text, color, size, life: 0.95, maxLife: 0.95, vy: -70, crit });
    if (this.floaters.length > 60) this.floaters.shift();
  }

  private shake(t: number, pow: number) {
    this.shakeT = Math.max(this.shakeT, t);
    this.shakePow = Math.max(this.shakePow, pow);
  }

  private pushLog(text: string, color: string) {
    this.log.unshift({ id: this.logId++, text, color, at: this.time });
    if (this.log.length > 6) this.log.pop();
  }

  /* ---------------- UI 指令 ---------------- */

  drinkPotion(kind: 'hp' | 'mp') {
    const p = this.player;
    if (p.potionCd > 0 || p.dead) return;
    if (p.potions[kind] <= 0) { this.floatAt(p.x, p.y - 90, '没有丹药了', '#a8b8d8', 14); return; }
    const d = p.derived;
    if (kind === 'hp' && p.hp >= d.maxHp) return;
    if (kind === 'mp' && p.mp >= d.maxMp) return;
    p.potions[kind]--;
    p.potionCd = 0.8;
    sfx.potion();
    if (kind === 'hp') {
      const heal = Math.round(d.maxHp * 0.45);
      p.hp = Math.min(d.maxHp, p.hp + heal);
      this.floatAt(p.x, p.y - 90, '+' + heal, '#7ae06a', 19);
      this.burst(p.x, p.y - 40, 8, '#7ae06a', 3, 90, 'glow');
    } else {
      const heal = Math.round(d.maxMp * 0.45);
      p.mp = Math.min(d.maxMp, p.mp + heal);
      this.floatAt(p.x, p.y - 90, '+' + heal + ' 灵力', '#7ab8ff', 17);
      this.burst(p.x, p.y - 40, 8, '#7ab8ff', 3, 90, 'glow');
    }
    this.notify();
  }


  /**
   * 参悟技能书：消耗背包中的技能书学会对应技能。
   * 规则：① 未学过该技能；② 角色境界 ≥ 技能书的 reqLevel。
   */
  learnSkillBook(invIdx: number) {
    const p = this.player;
    const entry = p.inventory[invIdx];
    if (!entry || entry.t !== 'book') return;
    const def = skillById(entry.skillId);
    if (!def) return;
    if ((p.skills[entry.skillId] || 0) > 0) {
      sfx.err();
      this.pushLog(`已参悟过【${def.name}】，此书无用`, '#ff8a8a');
      this.notify();
      return;
    }
    if (p.level < entry.reqLevel) {
      sfx.err();
      this.pushLog(
        `境界不足，【${def.name}】需 ${realmOf(entry.reqLevel).name} 方可参悟（当前 ${realmOf(p.level).name}）`,
        '#ff8a8a',
      );
      this.floatAt(p.x, p.y - 100, `需 ${realmOf(entry.reqLevel).name}`, '#ff8a8a', 17);
      this.notify();
      return;
    }
    p.inventory.splice(invIdx, 1);
    p.skills[entry.skillId] = 1;
    sfx.skillUp();
    this.shake(0.4, 3);
    this.pushLog(`✨ 参悟《${def.name}》成功！`, RARITY_COLOR[entry.rarity]);
    if (def.passive) {
      // 被动心法：立刻重算属性并把新增的气血/灵力补满
      const oldHp = p.derived.maxHp, oldMp = p.derived.maxMp;
      this.calcDerived(p);
      p.hp += Math.max(0, p.derived.maxHp - oldHp);
      p.mp += Math.max(0, p.derived.maxMp - oldMp);
      this.pushLog('心法已融入周身，被动生效（无需装备）', '#7ae06a');
    } else {
      this.pushLog('按 K 打开法诀栏，装备到 1~9 快捷槽后即可施展', '#ffe9b8');
    }
    this.floatAt(p.x, p.y - 104, '参悟成功!', def.color, 21, true);
    this.burst(p.x, p.y - 60, 20, def.color, 3.4, 150, 'glow');
    this.notify();
  }

  /* ---------------- 法宝 ---------------- */

  /** 当前装备的法宝 id（未装备返回 null） */
  private equippedArtifact(): ArtifactId | null {
    return this.player.equipment.artifact?.artifactId ?? null;
  }

  /** 乾坤珠：绑定一个已装备的攻击法诀（K 面板调用） */
  setBeadSkill(skillId: string) {
    const p = this.player;
    if (this.equippedArtifact() !== 'qiankun_bead') return;
    if (skillId === '') {
      p.beadSkillId = null;
      sfx.ui();
      this.notify();
      return;
    }
    const def = skillById(skillId);
    if (!def || def.passive) return;
    if ((p.skills[skillId] || 0) <= 0) return;
    // 只能寄存有攻击性的法诀
    if (def.kind === 'fly' || def.kind === 'blink' || def.kind === 'buff') {
      this.pushLog('乾坤珠只能寄存具备攻击性的法诀', '#ff8a8a');
      sfx.err();
      this.notify();
      return;
    }
    p.beadSkillId = skillId;
    p.beadT = 0;
    sfx.equip();
    this.pushLog(`乾坤珠已寄存法诀【${def.name}】，每 ${QIANKUN_INTERVAL} 秒自行运转一次`, '#c06bff');
    this.notify();
  }

  /** 每帧更新法宝效果 */
  private updateArtifacts(dt: number) {
    const p = this.player;
    if (p.dead) return;
    const art = this.equippedArtifact();

    /* 乾坤珠：定时自动施放寄存法诀（免灵力、不占手动 CD） */
    if (art === 'qiankun_bead' && p.beadSkillId) {
      const def = skillById(p.beadSkillId);
      if (def) {
        p.beadT += dt;
        if (p.beadT >= QIANKUN_INTERVAL) {
          p.beadT = 0;
          this.castFree(p.beadSkillId);
        }
      }
    } else {
      p.beadT = 0;
    }

    /* 青竹剑：四柄飞剑环绕自身持续切割 */
    if (art === 'green_bamboo_sword') {
      p.bambooPhase += BAMBOO_SPIN * dt;
      for (const [id, cd] of p.bambooHitCd) {
        const n = cd - dt;
        if (n <= 0) p.bambooHitCd.delete(id);
        else p.bambooHitCd.set(id, n);
      }
      const cx = p.x, cy = p.y - 30;
      for (let i = 0; i < BAMBOO_SWORD_COUNT; i++) {
        const a = p.bambooPhase + (i / BAMBOO_SWORD_COUNT) * Math.PI * 2;
        const sx = cx + Math.cos(a) * BAMBOO_RADIUS;
        const sy = cy + Math.sin(a) * BAMBOO_RADIUS * 0.62;
        for (const m of this.mobs) {
          if (m.dead) continue;
          if ((p.bambooHitCd.get(m.id) ?? 0) > 0) continue;
          const hw = m.def.w / 2 + 16;
          const top = m.y - m.def.h;
          if (sx > m.x - hw && sx < m.x + hw && sy > top - 16 && sy < m.y + 16) {
            p.bambooHitCd.set(m.id, BAMBOO_HIT_CD);
            this.hitMob(m, BAMBOO_MULT * this.buffMult(), { noKnock: true });
            this.burst(sx, sy, 5, '#7ae06a', 2.2, 90, 'spark');
          }
        }
      }
    } else if (p.bambooHitCd.size > 0) {
      p.bambooHitCd.clear();
    }
  }

  /**
   * 免费施放一个法诀（乾坤珠专用）：
   * 不消耗灵力、不写入手动冷却，独立于玩家操作。
   */
  private castFree(skillId: string) {
    const p = this.player;
    const def = skillById(skillId);
    if (!def) return;
    // 备份并在施放后还原冷却与灵力，实现「不计入手动冷却、不耗灵力」
    const savedCd = p.cds[skillId] || 0;
    const savedMp = p.mp;
    p.cds[skillId] = 0;
    p.mp = Math.max(p.mp, def.mpCost);
    this.useSkillById(skillId);
    p.cds[skillId] = savedCd;
    p.mp = savedMp;
    // 施放提示
    this.floatAt(p.x, p.y - 118, `乾坤 · ${def.name}`, '#c06bff', 15);
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      this.particles.push({
        x: p.x + Math.cos(a) * 20, y: p.y - 34 + Math.sin(a) * 20,
        vx: Math.cos(a) * 90, vy: Math.sin(a) * 90,
        life: 0.32, maxLife: 0.32, size: 3.4,
        color: '#c06bff', grav: 0, kind: 'glow',
      });
    }
  }

  /** 检查并自动领悟满足境界要求的心法（无需技能书） */
  private checkAutoLearn() {
    const p = this.player;
    for (const s of SKILLS) {
      if (!s.autoLearnLevel) continue;
      if ((p.skills[s.id] || 0) > 0) continue;
      if (p.level < s.autoLearnLevel) continue;
      p.skills[s.id] = 1;
      this.calcDerived(p);
      p.hp = Math.min(p.derived.maxHp, p.hp);
      p.mp = Math.min(p.derived.maxMp, p.mp);
      sfx.breakthrough();
      this.pushLog(`✨ 水到渠成，自动领悟心法【${s.name}】！`, s.color);
      this.pushLog(s.desc(1), '#aef1ff');
      this.floatAt(p.x, p.y - 128, '领悟心法!', s.color, 22, true);
      this.burst(p.x, p.y - 40, 24, s.color, 3.5, 170, 'glow');
    }
  }

  /**
   * 将技能装备到快捷槽（K 面板里拖放 / 点击操作）。
   * slot 0 = 普通攻击，固定不可更改；slot 1~8 对应数字键 2~9。
   * skillId = 'attack' 特殊值，skillId = '' 清空该槽。
   */
  equipSkillToSlot(slot: number, skillId: string) {
    const p = this.player;
    if (slot <= 0 || slot > 8) return; // 槽 0 固定普通攻击
    if (skillId !== '' && skillId !== 'attack' && (p.skills[skillId] || 0) <= 0) return;
    // 被动心法学会即生效，不可（也无需）装备到快捷槽
    if (skillId && skillId !== 'attack' && skillById(skillId)?.passive) {
      this.pushLog('心法为被动法门，学会即生效，无需装备', '#a8b8d8');
      sfx.err();
      this.notify();
      return;
    }
    // 如果该技能已在其他槽，先清掉
    if (skillId && skillId !== 'attack') {
      for (let i = 1; i < p.loadout.length; i++) {
        if (p.loadout[i] === skillId && i !== slot) p.loadout[i] = '';
      }
    }
    while (p.loadout.length <= slot) p.loadout.push('');
    p.loadout[slot] = skillId;
    if (skillId) sfx.equip(); else sfx.ui();
    // 若当前激活槽被清空，切回槽 0
    if (p.activeSlot === slot && !skillId) p.activeSlot = 0;
    this.notify();
  }

  /** 已废弃旧接口，保持编译通过 */
  allocateSkill(_id: string) { /* 技能树已删除，请使用技能书 */ }

  equipAt(invIdx: number) {
    const p = this.player;
    const entry = p.inventory[invIdx];
    if (!entry || entry.t !== 'eq') return;
    const item = entry.item;
    // 法宝无境界限制；换下乾坤珠时清空寄存的法诀
    if (item.slot === 'artifact' && p.equipment.artifact?.artifactId === 'qiankun_bead') {
      p.beadSkillId = null;
      p.beadT = 0;
    }
    if (item.slot !== 'artifact' && item.level > p.level) {
      sfx.err();
      this.floatAt(p.x, p.y - 90, `需要 Lv.${item.level}`, '#ff8a8a', 16);
      this.notify();
      return;
    }
    const prev = p.equipment[item.slot];
    p.equipment[item.slot] = item;
    p.inventory.splice(invIdx, 1);
    if (prev) p.inventory.push({ t: 'eq', item: prev });
    this.calcDerived(p);
    sfx.equip();
    this.pushLog(`祭炼了 ${item.name}`, RARITY_COLOR[item.rarity]);
    this.notify();
  }

  unequipSlot(slot: Slot) {
    const p = this.player;
    const item = p.equipment[slot];
    if (!item) return;
    if (p.inventory.length >= 24) { this.pushLog('乾坤袋已满', '#ff8a8a'); return; }
    if (slot === 'artifact') { p.beadSkillId = null; p.beadT = 0; p.bambooHitCd.clear(); }
    p.equipment[slot] = null;
    p.inventory.push({ t: 'eq', item });
    this.calcDerived(p);
    sfx.ui();
    this.notify();
  }

  travelTo(mapId: string) {
    if (!this.visited.has(mapId) || this.map.id === mapId) return;
    this.startTravel(mapId, 'left');
  }

  respawn() {
    const p = this.player;
    p.dead = false;
    p.exp = Math.max(0, p.exp - Math.round(expNeed(p.level) * 0.05));
    this.calcDerived(p);
    p.hp = p.derived.maxHp;
    p.mp = p.derived.maxMp;
    p.invulnT = 2.5;
    p.x = 150;
    p.y = 200;
    p.vx = 0; p.vy = 0;
    p.buffs = [];
    this.projectiles = [];
    this.notify();
  }

  ackVictory() {
    this.victory = false;
    this.notify();
  }

  setUiPaused(v: boolean) {
    this.uiPaused = v;
    if (v) {
      this.lmbHeld = false;
      this.rmbHeld = false;
    }
  }

  toggleMute(): boolean {
    sfx.setMuted(!sfx.muted);
    this.notify();
    return sfx.muted;
  }

  /* ---------------- 快照 ---------------- */

  subscribe(fn: (s: Snapshot) => void): () => void {
    this.listeners.add(fn);
    fn(this.getSnapshot());
    return () => this.listeners.delete(fn);
  }

  private notify() {
    const s = this.getSnapshot();
    for (const fn of this.listeners) fn(s);
  }

  getSnapshot(): Snapshot {
    const p = this.player;
    const baseDmg = this.baseDamage();
    const buffM = this.buffMult();
    const skills: SkillSnap[] = SKILLS.map((s) => {
      const learned = (p.skills[s.id] || 0) > 0;
      const slotIdx = p.loadout.indexOf(s.id);
      const bk = bookOfSkill(s.id);
      // ---- 详细伤害估算 ----
      let mult = s.mult(1);
      let hits = 1;
      let dmgNote = '';
      switch (s.kind) {
        case 'fire':
          hits = 5;
          dmgNote = '扇形散射 5 发，命中各自小范围溅射';
          break;
        case 'ice':
          dmgNote = '命中使敌人减速 55%，持续 1.8 秒';
          break;
        case 'thunder':
          mult = 7.5; // 满蓄力
          dmgNote = '蓄力 0→2 秒：250% → 750%；直线贯穿路径上全部敌人';
          break;
        case 'giant_sword':
          dmgNote = '贯穿飞行 2.8 秒，同一敌人每 0.35 秒可再次命中（可多段）';
          break;
        case 'flying_swords':
          hits = 8;
          dmgNote = '8 柄飞剑自动索敌追踪，单剑命中后炸裂';
          break;
        case 'spin':
          dmgNote = '以自身为中心 138 半径内全体命中';
          break;
        case 'dash':
          dmgNote = '朝鼠标方向疾掠 320 距离，斩击沿途全部敌人';
          break;
        case 'buff':
          dmgNote = `增益类法诀：15 秒内全部伤害 ×${s.mult(1).toFixed(2)}`;
          break;
        case 'blink':
          dmgNote = '位移类法诀，落点无敌 0.4 秒';
          break;
        case 'fly':
          dmgNote = '状态类法诀，再次施放收剑落地';
          break;
      }
      const isDmg = !s.passive && s.kind !== 'buff' && s.kind !== 'blink' && s.kind !== 'fly';
      const estDmg = isDmg ? Math.round(baseDmg * mult * buffM) : 0;
      // 被动心法的效果条目
      const passiveLines: string[] = [];
      if (s.passive && s.passiveFx) {
        const e = s.passiveFx;
        if (e.hpPct) passiveLines.push(`气血上限 +${Math.round(e.hpPct * 100)}%`);
        if (e.mpPct) passiveLines.push(`灵力上限 +${Math.round(e.mpPct * 100)}%`);
        if (e.speedPct) passiveLines.push(`移动速度 +${Math.round(e.speedPct * 100)}%`);
        if (e.jumpPct) passiveLines.push(`跳跃高度 +${Math.round(e.jumpPct * 100)}%`);
        if (e.lightFlight) passiveLines.push('按住空格可平地起飞，并可悬停空中');
        if (e.flightSpeedPct) passiveLines.push(`飞行速度 +${Math.round(e.flightSpeedPct * 100)}%`);
        if (e.mpRegenMult) passiveLines.push(`灵力回复 ×${e.mpRegenMult}`);
        if (e.mpShieldPct) passiveLines.push(`${Math.round(e.mpShieldPct * 100)}% 伤害转由灵力承担`);
      }
      if (s.passive) {
        dmgNote = s.autoLearnLevel
          ? `被动心法 · 达到${realmOf(s.autoLearnLevel).name}自动领悟，无需装备`
          : '被动心法 · 参悟后永久生效，无需装备到快捷槽';
      }
      return {
        mult,
        hits: isDmg ? hits : 0,
        estDmg,
        estTotal: estDmg * (isDmg ? hits : 0),
        dmgNote,
        passive: !!s.passive,
        passiveLines,
        id: s.id, name: s.name,
        learned,
        kind: s.kind,
        cd: p.cds[s.id] || 0,
        cdMax: s.cooldown,
        mpCost: s.mpCost,
        desc: s.desc(1),
        active: s.kind === 'fly' ? p.flying : false,
        extra:
          s.kind === 'fly' && s.drain ? `持续 ${s.drain(1).toFixed(0)} 灵力/秒`
            : s.kind === 'blink' && s.range ? `最远 ${s.range(1)} 距离`
              : '',
        tag: s.tag,
        color: s.color,
        equipped: slotIdx >= 0,
        slotIdx,
        reqLevel: bk?.reqLevel ?? 1,
        bookName: bk?.name ?? '',
      };
    });
    const realm = realmOf(p.level);
    const gateDef = gateAt(p.level);
    const bossMob = this.mobs.find((m) => m.def.boss && !m.dead);
    // NPC 界面快照
    const an = this.activeNpc;
    const npcView = an
      ? {
        id: an.id, name: an.name, title: an.title, kind: an.kind,
        lines: [...an.lines],
        lineIdx: this.npcLineIdx,
        shopHint: an.shopHint ?? '',
        shopOpen: this.npcShopOpen,
        shop: (an.shop ?? []).map((s) => {
            const preview = s.kind === 'equip' ? this.shopEquip(s.base ?? '', s.rarity ?? 0) : null;
            const stats: [string, string][] = [];
            if (preview) {
              if (preview.power) stats.push(['威力', '+' + preview.power]);
              if (preview.def) stats.push(['护体真元', '+' + preview.def]);
              if (preview.hp) stats.push(['气血', '+' + preview.hp]);
              if (preview.mp) stats.push(['灵力', '+' + preview.mp]);
              if (preview.sense) stats.push(['神识', '+' + preview.sense]);
              if (preview.agility) stats.push(['身法', '+' + preview.agility]);
              if (preview.critRate) stats.push(['会心率', '+' + preview.critRate + '%']);
              if (preview.critDmg) stats.push(['会心伤害', '+' + preview.critDmg + '%']);
              if (preview.metal) stats.push(['金灵根', '+' + preview.metal]);
              if (preview.wood) stats.push(['木灵根', '+' + preview.wood]);
              if (preview.water) stats.push(['水灵根', '+' + preview.water]);
              if (preview.fire) stats.push(['火灵根', '+' + preview.fire]);
              if (preview.earth) stats.push(['土灵根', '+' + preview.earth]);
            }
            const bId = s.kind === 'book' ? (s.bookId ?? '') : undefined;
            const bkDef = bId ? bookById(bId) : undefined;
            return {
              id: s.id, kind: s.kind as 'hp' | 'mp' | 'equip' | 'book', name: s.name, desc: s.desc, price: s.price,
              rarity: (s.rarity ?? 0) as Rarity,
              slot: preview ? preview.slot : null,
              stats,
              level: preview ? preview.level : 1,
              affordable: p.gold >= s.price,
              bookId: bId,
              bookLearned: bkDef ? (p.skills[bkDef.skillId] || 0) > 0 : undefined,
              bookReqLevel: bkDef?.reqLevel,
            };
          }),
      }
      : null;
    const nearNpcDef = this.npcs.find((n) => n.near);
    return {
      classId: p.classId, name: p.name,
      appearance: { ...p.appearance },
      roots: { ...p.roots },
      level: p.level, exp: p.exp, expNeed: expNeed(p.level),
      hp: Math.round(p.hp), maxHp: p.derived.maxHp,
      mp: Math.round(p.mp), maxMp: p.derived.maxMp,
      gold: p.gold, ap: p.ap, sp: p.sp,
      realm: {
        name: realm.name,
        stage: realm.stage,
        tier: realm.tier,
        color: realmColor(p.level),
        next: realmOf(p.level + 1).name,
      },
      expFull: p.exp >= expNeed(p.level),
      gate: gateDef
        ? {
          title: gateDef.quest?.title ?? '试炼尚未开启',
          detail: gateDef.quest?.detail ?? '此境界的突破试炼将于后续开放，修为圆满即可直接突破',
          done: gateDef.quest ? this.questFlags.has(gateDef.quest.id) : true,
          open: !!gateDef.quest,
        }
        : null,
      flying: p.flying,
      artifact: (() => {
        const aid = p.equipment.artifact?.artifactId;
        if (!aid) return null;
        const ad = artifactById(aid);
        const bound = p.beadSkillId ? skillById(p.beadSkillId) : null;
        return {
          id: ad.id,
          name: ad.name,
          color: ad.color,
          detail: ad.detail,
          boundSkillId: bound ? bound.id : null,
          boundSkillName: bound ? bound.name : null,
          autoCd: aid === 'qiankun_bead' && bound ? Math.max(0, QIANKUN_INTERVAL - p.beadT) : 0,
          autoCdMax: QIANKUN_INTERVAL,
        };
      })(),
      charging: !!this.chargingSkillId,
      chargeRatio: Math.min(1, this.chargeT / 2),
      nearNpc: nearNpcDef ? nearNpcDef.name : null,
      npcView,
      base: { ...p.base },
      adv: { ...p.adv },
      derived: { ...p.derived, roots: { ...p.derived.roots } },
      skills,
      loadout: [...p.loadout],
      activeSlot: p.activeSlot,
      inventory: p.inventory.map((it) => (it.t === 'eq' ? { t: 'eq' as const, item: { ...it.item } } : { ...it })),
      equipment: { ...p.equipment },
      potions: { ...p.potions },
      buffs: p.buffs.map((b) => ({ name: b.name, remain: Math.max(0, b.until - this.time), mult: b.mult })),
      mapId: this.map.id, mapName: this.map.name, mapSub: this.map.sub,
      visited: [...this.visited],
      boss: bossMob ? { name: bossMob.def.name, hp: Math.max(0, bossMob.hp), maxHp: bossMob.maxHp, level: bossMob.def.level } : null,
      dead: p.dead,
      victory: this.victory,
      paused: this.uiPaused || this.hiddenPaused,
      muted: sfx.muted,
      log: this.log.filter((l) => this.time - l.at < 6).map((l) => ({ ...l })),
    };
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('visibilitychange', this.onVis);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mouseleave', this.onMouseLeave);
    this.canvas.removeEventListener('contextmenu', this.onCtxMenu);
    sfx.stopMusic();
    this.listeners.clear();
  }
}
