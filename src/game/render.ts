import type { Engine } from './engine';
import type { Appearance, Drop, Mob, Slot, ThemeId } from './types';
import { RARITY_COLOR, FACES, HAIRS, OUTFITS, defaultAppearance } from './data';

/* ---------------- 工具 ---------------- */

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/* ---------------- 远景 ---------------- */

const THEME_SKY: Record<ThemeId, [string, string]> = {
  village: ['#7fd0ff', '#eafaff'],
  grass: ['#6fc4ff', '#e2f5ff'],
  forest: ['#9fe0b8', '#e4f8ea'],
  desert: ['#ff9e5e', '#ffe7ad'],
  dark: ['#241a45', '#563a75'],
  canyon: ['#ff8f6b', '#ffd9a3'],
  castle: ['#1d1430', '#41305a'],
  mountainFoot: ['#9fc8dc', '#f1ead2'],
  cliff: ['#a9c9dc', '#e9edf0'],
  summit: ['#7fb7dc', '#f8f1d8'],
};

function hills(
  ctx: CanvasRenderingContext2D, W: number, H: number, baseY: number,
  color: string, amp: number, freq: number, seed: number, camX: number,
) {
  const rnd = mulberry32(seed);
  const off = camX * 0.25;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 14) {
    const wx = x + off;
    const y = baseY - (Math.sin(wx * freq) * 0.6 + Math.sin(wx * freq * 2.7 + rnd() * 0 + 1.7) * 0.4) * amp - amp * 0.4;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
}

function clouds(ctx: CanvasRenderingContext2D, W: number, cam: number, camY: number, t: number, color: string, n: number) {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const span = W + 600;
    const x = ((i * 517 + 120 - cam * 0.15 - t * 9) % span + span) % span - 300;
    const y = 60 - camY * 0.1 + ((i * 97) % 150);
    const s = 0.7 + ((i * 31) % 10) / 12;
    ctx.beginPath();
    ctx.ellipse(x, y, 54 * s, 19 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 34 * s, y - 10 * s, 34 * s, 15 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 36 * s, y - 6 * s, 30 * s, 13 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBackdrop(ctx: CanvasRenderingContext2D, g: Engine, W: number, H: number) {
  const camY = g.camY;
  const th = g.map.theme;
  const [c1, c2] = THEME_SKY[th];
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, c1);
  sky.addColorStop(1, c2);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const cam = g.camX;
  const t = g.time;

  if (th === 'village' || th === 'grass' || th === 'forest' || th === 'desert' || th === 'canyon') {
    // 太阳
    const sunX = W * 0.82, sunY = 92 - camY * 0.05;
    const sunC = th === 'desert' || th === 'canyon' ? '#ffdf7a' : '#fff3b8';
    ctx.fillStyle = sunC;
    ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(sunX, sunY, th === 'desert' ? 52 : 40, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.25;
    ctx.beginPath(); ctx.arc(sunX, sunY, 78, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (th === 'dark' || th === 'castle') {
    ctx.fillStyle = '#f4ecff';
    ctx.beginPath(); ctx.arc(W * 0.8, 90, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = th === 'dark' ? '#563a75' : '#41305a';
    ctx.beginPath(); ctx.arc(W * 0.8 + 14, 82, 30, 0, Math.PI * 2); ctx.fill();
    // 星星
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 30; i++) {
      const x = (i * 173 + 40) % W;
      const y = (i * 89) % 240;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i));
      ctx.globalAlpha = tw * 0.7;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  if (th !== 'castle') clouds(ctx, W, cam, camY, t, th === 'dark' ? 'rgba(120,90,170,0.4)' : 'rgba(255,255,255,0.85)', 7);

  switch (th) {
    case 'village':
      hills(ctx, W, H, 500 - camY * 0.15, 'rgba(104,139,124,0.55)', 92, 0.0032, 7, cam);
      hills(ctx, W, H, 565 - camY * 0.2, 'rgba(75,115,93,0.58)', 70, 0.005, 13, cam * 1.4);
      villageCluster(ctx, W, cam, camY, t); // 远景村舍簇 + 炊烟
      houses(ctx, W, cam, camY, t);
      break;
    case 'grass':
      hills(ctx, W, H, 488 - camY * 0.15, 'rgba(118,154,114,0.58)', 88, 0.0035, 21, cam);
      hills(ctx, W, H, 562 - camY * 0.2, 'rgba(80,132,92,0.62)', 62, 0.006, 33, cam * 1.4);
      bgTrees(ctx, W, H, cam, camY, '#4f8f6b', '#5a4631', 6);
      break;
    case 'forest':
      hills(ctx, W, H, 480 - camY * 0.15, 'rgba(74,126,97,0.65)', 94, 0.003, 41, cam);
      bgTrees(ctx, W, H, cam, camY, '#3f8f6f', '#4e3f2b', 10);
      // 光斑
      ctx.fillStyle = 'rgba(255,255,210,0.10)';
      for (let i = 0; i < 5; i++) {
        const x = ((i * 420 + 100 - cam * 0.4) % (W + 400) + W + 400) % (W + 400) - 200;
        ctx.save();
        ctx.translate(x, -camY * 0.1);
        ctx.rotate(0.35);
        ctx.fillRect(0, -60, 46, 700);
        ctx.restore();
      }
      break;
    case 'desert':
      hills(ctx, W, H, 500 - camY * 0.15, '#c9975f', 72, 0.004, 51, cam);
      hills(ctx, W, H, 565 - camY * 0.2, '#a77448', 58, 0.006, 63, cam * 1.4);
      bgCacti(ctx, W, H, cam, camY);
      break;
    case 'dark':
      hills(ctx, W, H, 490 - camY * 0.15, '#26364e', 90, 0.0035, 71, cam);
      bgTrees(ctx, W, H, cam, camY, '#1f4d48', '#1c1c2b', 9);
      // 妖萤与灵芝光
      for (let i = 0; i < 9; i++) {
        const span = W + 300;
        const x = ((i * 331 + 60 - cam * 0.55) % span + span) % span - 150;
        const y = 560 + ((i * 53) % 50);
        const glow = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 2);
        ctx.fillStyle = i % 2 ? 'rgba(96,240,220,' + (0.35 + glow * 0.3) + ')' : 'rgba(255,120,200,' + (0.3 + glow * 0.3) + ')';
        ctx.beginPath(); ctx.arc(x, y, 9 + glow * 3, Math.PI, 0); ctx.fill();
        ctx.fillStyle = 'rgba(230,240,255,0.7)';
        ctx.fillRect(x - 2, y, 4, 12);
      }
      for (let i = 0; i < 16; i++) {
        const x = ((i * 211 + t * 22) % W + W) % W;
        const y = 300 + Math.sin(t * 1.4 + i * 3) * 90 + ((i * 67) % 120);
        ctx.fillStyle = 'rgba(255,230,120,' + (0.4 + 0.4 * Math.sin(t * 3 + i)) + ')';
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case 'canyon':
      hills(ctx, W, H, 500 - camY * 0.15, '#d2a56f', 72, 0.004, 51, cam);
      hills(ctx, W, H, 565 - camY * 0.2, '#b8875c', 58, 0.006, 63, cam * 1.4);
      mesas(ctx, W, H, cam, camY);
      break;
    case 'castle':
      castleWalls(ctx, W, H, cam, camY, t);
      break;
    case 'mountainFoot':
      mountainFootBackdrop(ctx, W, H, cam, camY, t);
      break;
    case 'cliff':
      cliffBackdrop(ctx, W, H, cam, camY, t);
      break;
    case 'summit':
      summitBackdrop(ctx, W, H, cam, camY, t);
      break;
  }
}

/** 一缕上升飘散的炊烟 */
function chimneySmoke(ctx: CanvasRenderingContext2D, bx: number, by: number, t: number, seed: number) {
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const life = ((t * 0.5 + seed + i * 0.7) % 1); // 0→1 循环
    const puffY = by - life * 66;
    const drift = Math.sin(t * 1.3 + seed + i) * 10 * life;
    const r = 3 + life * 11;
    ctx.globalAlpha = (1 - life) * 0.32;
    ctx.fillStyle = '#e8ecf2';
    ctx.beginPath();
    ctx.arc(bx + drift, puffY, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

/** 远景村舍群：低矮民居剪影 + 屋顶炊烟，营造村庄纵深 */
function villageCluster(ctx: CanvasRenderingContext2D, W: number, cam: number, camY: number, t: number) {
  const baseY = 545 - camY * 0.22;
  for (let i = 0; i < 6; i++) {
    const span = W + 620;
    const x = ((i * 300 + 40 - cam * 0.42) % span + span) % span - 310;
    const w = 70 + ((i * 37) % 40);
    const h = 42 + ((i * 53) % 26);
    // 墙体
    ctx.fillStyle = 'rgba(228,214,182,0.85)';
    ctx.fillRect(x, baseY - h, w, h);
    // 双坡屋顶
    ctx.fillStyle = 'rgba(90,74,60,0.9)';
    ctx.beginPath();
    ctx.moveTo(x - 8, baseY - h);
    ctx.lineTo(x + w / 2, baseY - h - 22);
    ctx.lineTo(x + w + 8, baseY - h);
    ctx.closePath();
    ctx.fill();
    // 小窗
    ctx.fillStyle = 'rgba(120,90,60,0.7)';
    ctx.fillRect(x + w * 0.3, baseY - h * 0.6, 10, 12);
    // 炊烟（隔栋才冒烟）
    if (i % 2 === 0) chimneySmoke(ctx, x + w * 0.66, baseY - h - 18, t, i * 1.7);
  }
}

function houses(ctx: CanvasRenderingContext2D, W: number, cam: number, camY: number, tGlobal: number) {
  for (let i = 0; i < 3; i++) {
    const span = W + 500;
    const x = ((i * 560 + 80 - cam * 0.5) % span + span) % span - 250;
    const y = 470 - camY * 0.25;
    // 道观主体
    ctx.fillStyle = '#d8c39a';
    ctx.fillRect(x + 8, y + 8, 114, 82);
    // 飞檐屋顶
    ctx.fillStyle = '#31453d';
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 10); ctx.quadraticCurveTo(x + 22, y - 8, x + 65, y - 48); ctx.quadraticCurveTo(x + 108, y - 8, x + 142, y + 10); ctx.lineTo(x + 128, y + 18); ctx.quadraticCurveTo(x + 65, y + 2, x + 2, y + 18); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7d382d';
    ctx.fillRect(x + 49, y + 38, 32, 52);
    ctx.fillStyle = '#f6df9c';
    ctx.fillRect(x + 17, y + 24, 24, 22);
    ctx.fillRect(x + 91, y + 24, 24, 22);
    ctx.strokeStyle = '#5c3328';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 17, y + 24, 24, 22);
    ctx.strokeRect(x + 91, y + 24, 24, 22);
    // 悬挂灯笼
    ctx.fillStyle = '#b53b32';
    ctx.beginPath(); ctx.ellipse(x + 65, y + 21, 8, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f4c96a';
    ctx.beginPath(); ctx.moveTo(x + 65, y + 10); ctx.lineTo(x + 65, y + 32); ctx.stroke();
    // 烟囱 + 炊烟
    ctx.fillStyle = '#7d382d';
    ctx.fillRect(x + 100, y - 44, 12, 22);
    chimneySmoke(ctx, x + 106, y - 46, tGlobal, i * 2.3 + 0.4);
  }
}

function bgTrees(ctx: CanvasRenderingContext2D, W: number, H: number, cam: number, camY: number, leaf: string, trunk: string, n: number) {
  for (let i = 0; i < n; i++) {
    const span = W + 400;
    const x = ((i * (span / n) + 40 - cam * 0.55) % span + span) % span - 200;
    const h = 120 + ((i * 47) % 70);
    const y = H - 130 - camY * 0.3;
    ctx.fillStyle = trunk;
    ctx.fillRect(x - 5, y - h + 25, 10, h - 25);
    ctx.strokeStyle = leaf;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    for (let j = 0; j < 5; j++) {
      const yy = y - h + 28 + j * 25;
      ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x - 42 + j * 4, yy + 18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + 42 - j * 4, yy + 18); ctx.stroke();
    }
    // 竹影
    if (i % 2 === 0) {
      ctx.strokeStyle = 'rgba(47,111,76,0.65)';
      ctx.lineWidth = 4;
      for (let b = 0; b < 4; b++) {
        const bx = x + 58 + b * 8;
        ctx.beginPath(); ctx.moveTo(bx, y); ctx.quadraticCurveTo(bx - 12, y - h * 0.45, bx + 4, y - h); ctx.stroke();
      }
    }
  }
}

function bgCacti(ctx: CanvasRenderingContext2D, W: number, H: number, cam: number, camY: number) {
  for (let i = 0; i < 7; i++) {
    const span = W + 400;
    const x = ((i * 380 + 90 - cam * 0.55) % span + span) % span - 200;
    const y = H - 120 - camY * 0.3;
    const h = 60 + ((i * 37) % 50);
    ctx.fillStyle = '#5f8b5f';
    rr(ctx, x - 6, y - h, 12, h, 6); ctx.fill();
    ctx.fillStyle = '#b94a4f';
    for (let p = 0; p < 7; p++) {
      const a = (p / 7) * Math.PI * 2;
      ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 10, y - h - 4 + Math.sin(a) * 5, 8, 4, a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#f1cf78';
    ctx.beginPath(); ctx.arc(x, y - h - 4, 5, 0, Math.PI * 2); ctx.fill();
  }
}

function mesas(ctx: CanvasRenderingContext2D, W: number, H: number, cam: number, camY: number) {
  ctx.fillStyle = '#c96f4a';
  for (let i = 0; i < 5; i++) {
    const span = W + 500;
    const x = ((i * 460 - cam * 0.3) % span + span) % span - 250;
    const w = 200 + ((i * 71) % 140);
    const h = 130 + ((i * 53) % 90);
    const by = H - 120 - camY * 0.15;
    ctx.beginPath();
    ctx.moveTo(x, by);
    ctx.lineTo(x + 26, by - h);
    ctx.lineTo(x + w - 26, by - h);
    ctx.lineTo(x + w, by);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#a85638';
  for (let i = 0; i < 6; i++) {
    const span = W + 400;
    const x = ((i * 380 + 120 - cam * 0.5) % span + span) % span - 200;
    const w = 150 + ((i * 43) % 90);
    const h = 80 + ((i * 61) % 60);
    const by = H - 110 - camY * 0.25;
    ctx.beginPath();
    ctx.moveTo(x, by);
    ctx.lineTo(x + 20, by - h);
    ctx.lineTo(x + w - 20, by - h);
    ctx.lineTo(x + w, by);
    ctx.closePath();
    ctx.fill();
  }
}

function castleWalls(ctx: CanvasRenderingContext2D, W: number, H: number, cam: number, camY: number, t: number) {
  ctx.fillStyle = '#332448';
  ctx.fillRect(0, 0, W, H);
  // 石块
  ctx.strokeStyle = 'rgba(20,12,35,0.5)';
  ctx.lineWidth = 3;
  const off = (cam * 0.4) % 90;
  const offY = (camY * 0.4) % 56;
  for (let y = -offY; y < H + 56; y += 56) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  for (let x = -off; x < W + 90; x += 90) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  // 柱子与火把
  for (let i = 0; i < 5; i++) {
    const span = W + 500;
    const x = ((i * 430 + 140 - cam * 0.7) % span + span) % span - 250;
    const yTop = 120 - camY * 0.6;
    const yBot = H - 110 - camY * 0.6;
    ctx.fillStyle = '#4a3b5c';
    ctx.fillRect(x - 26, yTop, 52, yBot - yTop);
    ctx.fillStyle = '#5a4a6e';
    ctx.fillRect(x - 34, yTop - 12, 68, 26);
    ctx.fillRect(x - 34, yBot, 68, 30);
    // 火把
    const fy = yTop + 110;
    const flick = Math.sin(t * 11 + i * 3) * 3;
    ctx.fillStyle = '#6e4526';
    ctx.fillRect(x - 4, fy, 8, 26);
    const fg = ctx.createRadialGradient(x, fy - 8, 2, x, fy - 8, 46 + flick);
    fg.addColorStop(0, 'rgba(255,220,120,0.95)');
    fg.addColorStop(0.4, 'rgba(255,150,60,0.55)');
    fg.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(x, fy - 8, 46 + flick, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd97a';
    ctx.beginPath();
    ctx.ellipse(x, fy - 10, 7, 13 + flick * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // 旗帜
  for (let i = 0; i < 3; i++) {
    const span = W + 500;
    const x = ((i * 620 + 320 - cam * 0.7) % span + span) % span - 250;
    const yBase = 130 - camY * 0.6;
    const sway = Math.sin(t * 2 + i) * 5;
    ctx.fillStyle = '#a33232';
    ctx.beginPath();
    ctx.moveTo(x, yBase);
    ctx.lineTo(x + 54 + sway, yBase + 18);
    ctx.lineTo(x, yBase + 60);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd97a';
    ctx.beginPath(); ctx.arc(x + 16, yBase + 26, 7, 0, Math.PI * 2); ctx.fill();
  }
}

function mountainFootBackdrop(ctx: CanvasRenderingContext2D, W: number, H: number, cam: number, camY: number, t: number) {
  // 崇山峻岭压在山脚之后
  hills(ctx, W, H, 455 - camY * 0.12, 'rgba(82,104,96,0.62)', 150, 0.0025, 202, cam * 0.55);
  hills(ctx, W, H, 530 - camY * 0.18, 'rgba(63,88,78,0.72)', 115, 0.0038, 203, cam * 0.8);
  hills(ctx, W, H, 610 - camY * 0.25, 'rgba(48,72,62,0.78)', 70, 0.006, 204, cam);

  // 山门牌楼
  const gateX = W * 0.52 - cam * 0.25;
  const gateY = 520 - camY * 0.35;
  ctx.save();
  ctx.translate(gateX, gateY);
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#5c4022';
  ctx.fillRect(-86, -72, 13, 82);
  ctx.fillRect(73, -72, 13, 82);
  ctx.fillStyle = '#7d382d';
  ctx.fillRect(-98, -82, 196, 18);
  ctx.fillStyle = '#31453d';
  ctx.beginPath();
  ctx.moveTo(-112, -82); ctx.quadraticCurveTo(-50, -115, 0, -96); ctx.quadraticCurveTo(50, -115, 112, -82);
  ctx.lineTo(96, -72); ctx.quadraticCurveTo(0, -90, -96, -72); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f1cf78';
  rr(ctx, -58, -72, 116, 28, 4); ctx.fill();
  ctx.fillStyle = '#5c4022';
  ctx.font = '18px "ZCOOL KuaiLe", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('凌 云 宗', 0, -51);
  // 盘山石阶
  ctx.strokeStyle = 'rgba(210,205,180,0.5)';
  ctx.lineWidth = 4;
  for (let i = 0; i < 7; i++) {
    const yy = 22 + i * 14;
    ctx.beginPath();
    ctx.moveTo(-54 + i * 5, yy);
    ctx.lineTo(54 - i * 5, yy);
    ctx.stroke();
  }
  // 山门炊烟/香火
  chimneySmoke(ctx, -58, -88, t, 9.1);
  chimneySmoke(ctx, 58, -88, t, 13.1);
  ctx.restore();
}

function cliffBackdrop(ctx: CanvasRenderingContext2D, W: number, H: number, cam: number, camY: number, _t: number) {
  // 近景大崖壁
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(180,190,190,0.42)');
  grad.addColorStop(1, 'rgba(70,80,82,0.8)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 160 - camY * 0.18, W, H);

  // 峭壁裂纹
  ctx.strokeStyle = 'rgba(55,65,70,0.35)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 16; i++) {
    const x = ((i * 173 - cam * 0.12) % (W + 120) + W + 120) % (W + 120) - 60;
    const y0 = 110 + ((i * 67) % 260) - camY * 0.28;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    for (let k = 0; k < 5; k++) ctx.lineTo(x + Math.sin(i * 9 + k) * 18, y0 + k * 44);
    ctx.stroke();
  }

  // 远处云与瀑布
  for (let i = 0; i < 4; i++) {
    const x = ((i * 380 + 140 - cam * 0.2) % (W + 300) + W + 300) % (W + 300) - 150;
    const y = 250 + i * 38 - camY * 0.18;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.ellipse(x, y, 120, 18, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(190,230,255,0.32)';
  for (let i = 0; i < 3; i++) {
    const x = ((i * 310 + 230 - cam * 0.15) % (W + 400) + W + 400) % (W + 400) - 200;
    ctx.fillRect(x, 70 - camY * 0.15, 18, H);
  }
}

function summitBackdrop(ctx: CanvasRenderingContext2D, W: number, H: number, cam: number, camY: number, t: number) {
  // 云海在脚下
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 8; i++) {
    const x = ((i * 260 - cam * 0.18 + t * 14) % (W + 360) + W + 360) % (W + 360) - 180;
    const y = 480 + ((i * 37) % 120) - camY * 0.2;
    ctx.beginPath();
    ctx.ellipse(x, y, 130, 28, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 60, y - 18, 90, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // 山顶主峰
  ctx.fillStyle = 'rgba(100,112,110,0.68)';
  ctx.beginPath();
  ctx.moveTo(W * 0.12, H);
  ctx.lineTo(W * 0.5 - cam * 0.08, 240 - camY * 0.1);
  ctx.lineTo(W * 0.9, H);
  ctx.closePath();
  ctx.fill();
  // 宗门殿影
  const x = W * 0.58 - cam * 0.18;
  const y = 380 - camY * 0.22;
  ctx.fillStyle = 'rgba(64,74,72,0.82)';
  ctx.fillRect(x - 70, y - 34, 140, 54);
  ctx.fillStyle = 'rgba(49,69,61,0.9)';
  ctx.beginPath();
  ctx.moveTo(x - 95, y - 34); ctx.lineTo(x, y - 78); ctx.lineTo(x + 95, y - 34); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(241,207,120,0.85)';
  ctx.fillRect(x - 26, y - 18, 52, 20);
}

/* ---------------- 地面与平台 ---------------- */

const GROUND_STYLE: Record<ThemeId, { top: string; dirt: string; accent: string }> = {
  village: { top: '#7fa36e', dirt: '#8a6b48', accent: '#5d4933' },
  grass: { top: '#76a667', dirt: '#8f7045', accent: '#5d4a32' },
  forest: { top: '#5f9b6b', dirt: '#655741', accent: '#3f382e' },
  desert: { top: '#d7b36f', dirt: '#b88955', accent: '#785438' },
  dark: { top: '#4f806e', dirt: '#2d3447', accent: '#1f2434' },
  canyon: { top: '#b8875c', dirt: '#845e4b', accent: '#4f3a31' },
  castle: { top: '#746574', dirt: '#3f3044', accent: '#251c2b' },
  mountainFoot: { top: '#6f8f6f', dirt: '#7f6f58', accent: '#4d4438' },
  cliff: { top: '#8f8d83', dirt: '#666b6d', accent: '#3f4649' },
  summit: { top: '#d3d0b5', dirt: '#8f8a78', accent: '#5c594c' },
};

function drawGroundAndPlatforms(ctx: CanvasRenderingContext2D, g: Engine) {
  const th = g.map.theme;
  const st = GROUND_STYLE[th];
  for (const seg of g.map.ground) {
    const grad = ctx.createLinearGradient(0, seg.y, 0, seg.y + 130);
    grad.addColorStop(0, st.dirt);
    grad.addColorStop(1, st.accent);
    ctx.fillStyle = grad;
    ctx.fillRect(seg.x, seg.y, seg.w, 720 - seg.y + 40);
    ctx.fillStyle = st.top;
    rr(ctx, seg.x - 4, seg.y - 8, seg.w + 8, 22, 10);
    ctx.fill();
    // 草丛/纹理
    const rnd = mulberry32(seg.x * 7 + seg.w);
    for (let i = 0; i < seg.w / 46; i++) {
      const x = seg.x + 14 + rnd() * (seg.w - 28);
      ctx.fillStyle = st.top;
      ctx.beginPath();
      ctx.moveTo(x, seg.y - 6);
      ctx.lineTo(x + 4, seg.y - 18 - rnd() * 8);
      ctx.lineTo(x + 8, seg.y - 6);
      ctx.closePath();
      ctx.fill();
      if (rnd() > 0.5) {
        ctx.fillStyle = th === 'dark' ? '#8fe4d7' : th === 'desert' ? '#b94a4f' : '#f1cf78';
        ctx.beginPath();
        ctx.arc(x + 20 + rnd() * 10, seg.y - 8, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // 平台
  for (const p of g.map.platforms) {
    if (g.map.platformStyle === 'rock') {
      // 岩石平台：不规则灰岩边缘 + 石纹裂隙
      const grad = ctx.createLinearGradient(0, p.y - 6, 0, p.y + 24);
      grad.addColorStop(0, '#b9b5a6');
      grad.addColorStop(0.45, '#898b84');
      grad.addColorStop(1, '#565c5e');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(p.x - 10, p.y + 8);
      for (let x = p.x; x <= p.x + p.w; x += 22) {
        const jag = Math.sin(x * 0.17 + p.y * 0.03) * 6;
        ctx.lineTo(x, p.y - 6 + jag * 0.25);
      }
      ctx.lineTo(p.x + p.w + 12, p.y + 10);
      for (let x = p.x + p.w; x >= p.x; x -= 22) {
        const jag = Math.sin(x * 0.23 + p.y * 0.02) * 7;
        ctx.lineTo(x, p.y + 22 + jag * 0.5);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(45,50,52,0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // 顶部苔藓/草色
      ctx.fillStyle = th === 'summit' ? '#d8d1a8' : '#708b70';
      rr(ctx, p.x - 5, p.y - 10, p.w + 10, 8, 4);
      ctx.fill();
      // 石纹裂缝
      ctx.strokeStyle = 'rgba(50,55,58,0.45)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < Math.max(2, p.w / 80); i++) {
        const x = p.x + 24 + i * 72;
        ctx.beginPath();
        ctx.moveTo(x, p.y + 2);
        ctx.lineTo(x + 18, p.y + 9 + Math.sin(x) * 5);
        ctx.lineTo(x + 6, p.y + 18);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#5d4129';
      rr(ctx, p.x, p.y, p.w, 20, 7);
      ctx.fill();
      ctx.fillStyle = '#8a6a43';
      rr(ctx, p.x, p.y, p.w, 12, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(35,25,18,0.55)';
      ctx.lineWidth = 2;
      for (let i = 1; i < 4; i++) {
        const x = p.x + (p.w / 4) * i;
        ctx.beginPath(); ctx.moveTo(x, p.y + 2); ctx.lineTo(x, p.y + 11); ctx.stroke();
      }
      ctx.fillStyle = st.top;
      rr(ctx, p.x - 3, p.y - 4, p.w + 6, 7, 4);
      ctx.fill();
      // 平台边缘的灵纹
      ctx.strokeStyle = th === 'castle' ? 'rgba(207,83,100,0.45)' : 'rgba(241,207,120,0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x + 12, p.y + 7);
      for (let x = p.x + 12; x < p.x + p.w - 12; x += 24) ctx.lineTo(x + 12, p.y + 7 + Math.sin(x * 0.2) * 3);
      ctx.stroke();
    }
  }
}

/* ---------------- 绳索 ---------------- */

function drawRopes(ctx: CanvasRenderingContext2D, g: Engine) {
  for (const r of g.ropes) {
    const sway = Math.sin(g.time * 1.6 + r.x * 0.05) * 2.5;
    const playerOn = g.player.onRope && g.player.rope === r;
    const sx = playerOn ? 0 : sway;
    // 顶端固定横梁
    ctx.fillStyle = '#6e4526';
    rr(ctx, r.x - 14, r.top - 16, 28, 7, 3);
    ctx.fill();
    ctx.fillStyle = '#4a2f18';
    ctx.fillRect(r.x - 3, r.top - 10, 6, 6);
    // 主绳
    ctx.strokeStyle = '#8a5a30';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(r.x, r.top - 6);
    ctx.quadraticCurveTo(r.x + sx * 0.6, (r.top + r.bottom) / 2, r.x + sx, r.bottom);
    ctx.stroke();
    ctx.strokeStyle = '#c9975f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(r.x, r.top - 6);
    ctx.quadraticCurveTo(r.x + sx * 0.6, (r.top + r.bottom) / 2, r.x + sx, r.bottom);
    ctx.stroke();
    // 绳结
    const segs = Math.max(3, Math.floor((r.bottom - r.top) / 26));
    ctx.strokeStyle = '#6e4526';
    ctx.lineWidth = 3.4;
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      const ky = r.top + (r.bottom - r.top) * t;
      const kx = r.x + sx * (t * t) * 0.9;
      ctx.beginPath();
      ctx.moveTo(kx - 5, ky - 3);
      ctx.lineTo(kx + 5, ky + 3);
      ctx.stroke();
    }
    // 底端穗子
    ctx.strokeStyle = '#c9975f';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(r.x + sx, r.bottom);
      ctx.lineTo(r.x + sx + i * 4, r.bottom + 9 + Math.sin(g.time * 3 + i) * 1.5);
      ctx.stroke();
    }
    // 提示
    if (!playerOn) {
      ctx.font = '13px "ZCOOL KuaiLe", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,233,184,0.75)';
      ctx.strokeStyle = 'rgba(20,15,5,0.7)';
      ctx.lineWidth = 3;
      const label = '↑↓ 攀爬';
      ctx.strokeText(label, r.x, (r.top + r.bottom) / 2);
      ctx.fillText(label, r.x, (r.top + r.bottom) / 2);
    }
  }
}

/* ---------------- NPC ---------------- */

function drawNpcs(ctx: CanvasRenderingContext2D, g: Engine) {
  for (const n of g.npcs) {
    const t = g.time;
    const bob = Math.sin(t * 2 + n.x * 0.01) * 2.2;
    ctx.save();
    ctx.translate(n.x, n.y);
    const [robe, robeDark, trim] = n.look;

    // 地面阴影
    ctx.fillStyle = 'rgba(10,20,40,0.22)';
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 7, 0, 0, Math.PI * 2); ctx.fill();

    if (n.kind === 'merchant') {
      // 货摊：木架 + 顶棚 + 货物
      ctx.fillStyle = '#6e4526';
      ctx.fillRect(30, -46, 6, 46);
      ctx.fillRect(96, -46, 6, 46);
      ctx.fillStyle = '#8a5a30';
      rr(ctx, 24, -52, 84, 10, 3); ctx.fill();
      // 顶棚
      ctx.fillStyle = '#b53b32';
      ctx.beginPath();
      ctx.moveTo(18, -54); ctx.lineTo(114, -54); ctx.lineTo(104, -74); ctx.lineTo(28, -74);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8d9b0';
      for (let i = 0; i < 4; i++) ctx.fillRect(28 + i * 22, -74, 10, 20);
      // 摊上的丹瓶
      ctx.fillStyle = '#c85a68';
      rr(ctx, 36, -66, 11, 14, 4); ctx.fill();
      ctx.fillStyle = '#4f86c8';
      rr(ctx, 54, -66, 11, 14, 4); ctx.fill();
      ctx.fillStyle = '#f1cf78';
      ctx.beginPath(); ctx.arc(80, -59, 7, 0, Math.PI * 2); ctx.fill();
      // 幌子
      ctx.fillStyle = '#f6df9c';
      rr(ctx, 108, -74, 16, 34, 3); ctx.fill();
      ctx.fillStyle = '#7d382d';
      ctx.font = '11px "ZCOOL KuaiLe", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('丹', 116, -60);
      ctx.fillText('器', 116, -48);
    }

    // 身体（道袍）
    ctx.translate(0, bob);
    ctx.fillStyle = robe;
    ctx.beginPath();
    ctx.moveTo(-15, 0); ctx.lineTo(-11, -38); ctx.lineTo(11, -38); ctx.lineTo(15, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = robeDark;
    ctx.beginPath();
    ctx.moveTo(-13, -14); ctx.lineTo(13, -14); ctx.lineTo(15, 0); ctx.lineTo(-15, 0);
    ctx.closePath(); ctx.fill();
    // 腰带
    ctx.fillStyle = trim;
    ctx.fillRect(-12, -22, 24, 5);
    // 交领
    ctx.strokeStyle = trim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, -38); ctx.lineTo(0, -28); ctx.lineTo(7, -38);
    ctx.stroke();
    // 袖手
    ctx.fillStyle = robe;
    ctx.beginPath(); ctx.ellipse(-14, -26, 6, 9, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(14, -26, 6, 9, -0.3, 0, Math.PI * 2); ctx.fill();
    // 头
    ctx.fillStyle = '#ffe0bd';
    ctx.beginPath(); ctx.arc(0, -50, 12, 0, Math.PI * 2); ctx.fill();
    // 发髻与冠
    ctx.fillStyle = n.kind === 'guide' ? '#d8dbe6' : '#3a2b1c';
    ctx.beginPath(); ctx.arc(0, -53, 12, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -63, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = trim;
    ctx.fillRect(-12, -58, 24, 3.5);
    // 眼
    ctx.fillStyle = '#1c1c28';
    const blink = (t + n.x) % 4 < 0.14;
    if (blink) {
      ctx.fillRect(-6, -50, 4, 1.6); ctx.fillRect(2, -50, 4, 1.6);
    } else {
      ctx.beginPath(); ctx.arc(-4, -50, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(4, -50, 1.8, 0, Math.PI * 2); ctx.fill();
    }
    // 长老白须
    if (n.kind === 'guide') {
      ctx.fillStyle = '#eef2f8';
      ctx.beginPath();
      ctx.moveTo(-7, -44); ctx.quadraticCurveTo(0, -20 + Math.sin(t * 1.5) * 1.5, 7, -44);
      ctx.quadraticCurveTo(0, -38, -7, -44);
      ctx.closePath(); ctx.fill();
      // 拂尘
      ctx.strokeStyle = '#6e4526';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(16, -34); ctx.lineTo(24, -58); ctx.stroke();
      ctx.strokeStyle = '#eef2f8';
      ctx.lineWidth = 1.6;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(24, -58);
        ctx.quadraticCurveTo(27 + i * 2, -48, 26 + i * 3.4, -38 + Math.sin(t * 2 + i) * 1.5);
        ctx.stroke();
      }
    } else {
      // 商人小胡子与算盘
      ctx.fillStyle = '#3a2b1c';
      ctx.fillRect(-4, -45, 8, 2);
    }

    ctx.restore();

    // 名牌
    ctx.save();
    ctx.translate(n.x, n.y);
    ctx.font = '14px "ZCOOL KuaiLe", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(10,15,34,0.85)';
    const label = n.name;
    ctx.strokeText(label, 0, -80);
    ctx.fillStyle = n.kind === 'merchant' ? '#ffd97a' : n.kind === 'villager' ? '#b9ffcf' : '#aef1ff';
    ctx.fillText(label, 0, -80);
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.strokeText(n.title, 0, -66);
    ctx.fillStyle = '#c8d4ec';
    ctx.fillText(n.title, 0, -66);

    // 交互提示
    if (n.near) {
      const py = -98 + Math.sin(g.time * 5) * 3;
      ctx.font = '13px "ZCOOL KuaiLe", sans-serif';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(10,15,34,0.85)';
      const hint = n.kind === 'merchant' ? '按 F 交易' : n.kind === 'villager' ? '按 F 交谈' : '按 F 请教';
      ctx.strokeText(hint, 0, py);
      ctx.fillStyle = '#ffe9b8';
      ctx.fillText(hint, 0, py);
      // 光圈
      ctx.strokeStyle = 'rgba(255,231,158,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 30 + Math.sin(g.time * 4) * 3, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/* ---------------- 传送门 ---------------- */

function drawPortal(ctx: CanvasRenderingContext2D, x: number, groundY: number, t: number, label: string | null) {
  const y = groundY - 46;
  ctx.save();
  ctx.translate(x, y);
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 62);
  glow.addColorStop(0, 'rgba(255,231,158,0.9)');
  glow.addColorStop(0.5, 'rgba(126,218,210,0.36)');
  glow.addColorStop(1, 'rgba(80,140,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.ellipse(0, 0, 62, 74, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(25,22,44,0.84)';
  ctx.beginPath(); ctx.ellipse(0, 0, 26, 40, 0, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = i % 2 ? 'rgba(255,231,158,0.95)' : 'rgba(126,218,210,0.75)';
    ctx.lineWidth = 4 - i;
    ctx.setLineDash([14, 10]);
    ctx.lineDashOffset = -t * 60 * (i % 2 ? 1 : -1) - i * 9;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20 + i * 9, 33 + i * 12, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // 上升粒子
  for (let i = 0; i < 5; i++) {
    const py = ((t * 40 + i * 23) % 90) - 45;
    const px = Math.sin(t * 3 + i * 2) * 18;
    ctx.fillStyle = 'rgba(255,231,158,' + (0.7 - Math.abs(py) / 70) + ')';
    ctx.beginPath(); ctx.arc(px, py, 2.4, 0, Math.PI * 2); ctx.fill();
  }
  if (label) {
    ctx.font = '17px "ZCOOL KuaiLe", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(10,20,45,0.9)';
    ctx.strokeText(label, 0, -86);
    ctx.fillStyle = '#aef1ff';
    ctx.fillText(label, 0, -86);
    ctx.font = '14px "ZCOOL KuaiLe", sans-serif';
    ctx.strokeText('按 ↑ 传送', 0, -66);
    ctx.fillStyle = '#ffe9b8';
    ctx.fillText('按 ↑ 传送', 0, -66);
  }
  // 地面阵纹
  ctx.strokeStyle = 'rgba(255,231,158,0.75)';
  ctx.lineWidth = 2;
  ctx.rotate(t * 0.6);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(0, 48, 24 + i * 9, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/* ---------------- 掉落物 ---------------- */

function slotGlyph(ctx: CanvasRenderingContext2D, slot: Slot, s: number) {
  ctx.lineWidth = 2.4;
  ctx.lineJoin = 'round';
  switch (slot) {
    case 'weapon':
      ctx.beginPath();
      ctx.moveTo(-s * 0.7, s * 0.7); ctx.lineTo(s * 0.55, -s * 0.55);
      ctx.moveTo(s * 0.2, -s * 0.2); ctx.lineTo(s * 0.62, -s * 0.62); ctx.lineTo(s * 0.75, -s * 0.18);
      ctx.stroke();
      break;
    case 'helmet':
      ctx.beginPath(); ctx.arc(0, s * 0.1, s * 0.62, Math.PI, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.62, s * 0.1); ctx.lineTo(s * 0.62, s * 0.1); ctx.stroke();
      break;
    case 'armor':
      rr(ctx, -s * 0.55, -s * 0.5, s * 1.1, s * 1.05, s * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.5); ctx.lineTo(0, -s * 0.16); ctx.lineTo(s * 0.2, -s * 0.5); ctx.stroke();
      break;
    case 'gloves':
      rr(ctx, -s * 0.45, -s * 0.5, s * 0.8, s * 1.0, s * 0.3); ctx.stroke();
      break;
    case 'shoes':
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, -s * 0.45); ctx.lineTo(-s * 0.5, s * 0.3); ctx.lineTo(s * 0.55, s * 0.3);
      ctx.lineTo(s * 0.55, s * 0.02); ctx.lineTo(-s * 0.12, -s * 0.05); ctx.lineTo(-s * 0.12, -s * 0.45);
      ctx.closePath(); ctx.stroke();
      break;
  }
}

function drawDrop(ctx: CanvasRenderingContext2D, d: Drop, t: number) {
  const bob = Math.sin(t * 3 + d.phase) * 4;
  const y = d.y + bob;
  ctx.save();
  ctx.translate(d.x, y);
  const blink = d.life < 6 && Math.sin(t * 10) > 0;
  if (blink) ctx.globalAlpha = 0.35;
  if (d.kind === 'gold') {
    const sq = Math.abs(Math.sin(t * 5 + d.phase));
    ctx.fillStyle = '#8a5a12';
    ctx.beginPath(); ctx.ellipse(1.5, 1.5, 9 * Math.max(0.3, sq), 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath(); ctx.ellipse(0, 0, 9 * Math.max(0.3, sq), 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff0b0';
    ctx.beginPath(); ctx.ellipse(-2, -2, 4 * Math.max(0.3, sq), 4, 0, 0, Math.PI * 2); ctx.fill();
  } else if (d.kind === 'hp' || d.kind === 'mp') {
    const c = d.kind === 'hp' ? '#ff5b6a' : '#4aa3ff';
    ctx.fillStyle = '#e8ecf5';
    rr(ctx, -4, -14, 8, 6, 2); ctx.fill();
    ctx.fillStyle = c;
    rr(ctx, -7, -9, 14, 15, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    rr(ctx, -5, -7, 4, 7, 2); ctx.fill();
  } else if (d.item) {
    const rc = RARITY_COLOR[d.item.rarity];
    // 光柱
    const beam = ctx.createLinearGradient(0, -90, 0, 0);
    beam.addColorStop(0, 'rgba(255,255,255,0)');
    beam.addColorStop(1, rc + '55');
    ctx.fillStyle = beam;
    ctx.fillRect(-9, -90, 18, 90);
    ctx.fillStyle = '#101a38';
    rr(ctx, -13, -22, 26, 26, 6); ctx.fill();
    ctx.strokeStyle = rc;
    ctx.lineWidth = 2;
    rr(ctx, -13, -22, 26, 26, 6); ctx.stroke();
    ctx.strokeStyle = rc;
    slotGlyph(ctx, d.item.slot, 9);
    const pulse = 0.5 + 0.5 * Math.sin(t * 4 + d.phase);
    ctx.globalAlpha = 0.25 + pulse * 0.2;
    ctx.fillStyle = rc;
    rr(ctx, -13, -22, 26, 26, 6); ctx.fill();
  }
  ctx.restore();
}

/* ---------------- 怪物 ---------------- */

function mobFace(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, angry: boolean) {
  ctx.fillStyle = '#1c1c28';
  const eye = s * 0.55;
  ctx.beginPath(); ctx.arc(x - eye, y, s * 0.42, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + eye, y, s * 0.42, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(x - eye + 1, y - 1, s * 0.16, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + eye + 1, y - 1, s * 0.16, 0, Math.PI * 2); ctx.fill();
  if (angry) {
    ctx.strokeStyle = '#1c1c28';
    ctx.lineWidth = s * 0.28;
    ctx.beginPath();
    ctx.moveTo(x - eye - s * 0.6, y - s * 1.05); ctx.lineTo(x - eye + s * 0.4, y - s * 0.6);
    ctx.moveTo(x + eye + s * 0.6, y - s * 1.05); ctx.lineTo(x + eye - s * 0.4, y - s * 0.6);
    ctx.stroke();
  }
}

function drawMob(ctx: CanvasRenderingContext2D, m: Mob, t: number) {
  const d = m.def;
  const squish = m.onGround ? Math.abs(Math.sin(m.walkPhase)) * 0.08 : 0;
  const flash = m.hitFlash > 0;
  ctx.save();
  ctx.translate(m.x, m.y);
  if (m.dead) { ctx.restore(); return; }
  ctx.scale(m.facing, 1);
  ctx.scale(1 + squish, 1 - squish);
  const w = d.w, h = d.h;
  const [c0, c1, c2] = d.c;
  const boss = !!d.boss;

  // BOSS 震地攻击预警圈
  if (boss && (m.state === 'tele' || m.state === 'slam')) {
    const k = m.state === 'tele' ? 1 - Math.max(0, m.stateT) / 0.55 : 1;
    ctx.fillStyle = 'rgba(255,60,40,0.26)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 180 * (0.35 + 0.65 * k), 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,90,60,' + (0.45 + 0.45 * Math.sin(t * 28)) + ')';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 4, 190 * (0.35 + 0.65 * k), 23, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  switch (d.kind) {
    case 'snail': {
      // 灵龟四足与头
      ctx.fillStyle = c1;
      rr(ctx, -w * 0.35, -h * 0.18, w * 0.18, h * 0.18, 5); ctx.fill();
      rr(ctx, -w * 0.08, -h * 0.18, w * 0.18, h * 0.18, 5); ctx.fill();
      rr(ctx, w * 0.22, -h * 0.2, w * 0.18, h * 0.18, 5); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w * 0.34, -h * 0.45, w * 0.18, h * 0.17, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1c1c28';
      ctx.beginPath(); ctx.arc(w * 0.39, -h * 0.5, 2.2, 0, Math.PI * 2); ctx.fill();
      // 龟甲
      ctx.fillStyle = c0;
      ctx.beginPath(); ctx.ellipse(-w * 0.12, -h * 0.46, w * 0.43, h * 0.38, 0, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-w * 0.12, -h * 0.46, w * 0.43, h * 0.12, 0, 0, Math.PI); ctx.fill();
      ctx.strokeStyle = c2;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(-w * 0.12, -h * 0.45, w * 0.32, h * 0.22, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-w * 0.12, -h * 0.68); ctx.lineTo(-w * 0.12, -h * 0.26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-w * 0.34, -h * 0.45); ctx.lineTo(w * 0.1, -h * 0.45); ctx.stroke();
      // 灵纹
      ctx.strokeStyle = 'rgba(255,231,158,0.8)';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(-w * 0.12, -h * 0.48, w * 0.12, 0.2, Math.PI * 1.8); ctx.stroke();
      break;
    }
    case 'mushroom': {
      const capR = w * (boss ? 0.58 : 0.55);
      // 脚
      ctx.fillStyle = '#e8d5a8';
      rr(ctx, -w * 0.2, -8, w * 0.16, 9, 3); ctx.fill();
      rr(ctx, w * 0.05, -8, w * 0.16, 9, 3); ctx.fill();
      // 身体
      ctx.fillStyle = c1;
      rr(ctx, -w * 0.28, -h * 0.52, w * 0.56, h * 0.52, w * 0.16); ctx.fill();
      mobFace(ctx, 0, -h * 0.3, w * 0.11, boss);
      // 嘴
      ctx.strokeStyle = '#1c1c28';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, -h * 0.2, w * 0.07, 0.2, Math.PI - 0.2); ctx.stroke();
      // 灵伞伞盖
      ctx.fillStyle = c0;
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.55, capR, capR * 0.72, 0, Math.PI, 0);
      ctx.ellipse(0, -h * 0.55, capR, capR * 0.24, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath(); ctx.ellipse(0, -h * 0.55, capR, capR * 0.2, 0, 0, Math.PI * 2); ctx.fill();
      // 伞骨与符纸
      ctx.strokeStyle = 'rgba(255,231,158,0.85)';
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(0, -h * 0.55); ctx.lineTo(i * capR * 0.25, -h * 0.68 + Math.abs(i) * 4); ctx.stroke();
      }
      ctx.fillStyle = '#f1cf78';
      rr(ctx, -5, -h * 0.76, 10, 18, 2); ctx.fill();
      ctx.strokeStyle = '#9b3a2c';
      ctx.beginPath(); ctx.moveTo(-2, -h * 0.72); ctx.lineTo(2, -h * 0.72); ctx.moveTo(0, -h * 0.76); ctx.lineTo(0, -h * 0.64); ctx.stroke();
      if (boss) {
        // 妖王角冠
        ctx.fillStyle = '#1d1420';
        ctx.beginPath();
        const cy = -h * 0.55 - capR * 0.66;
        ctx.moveTo(-capR * 0.42, cy + 4);
        ctx.quadraticCurveTo(-capR * 0.52, cy - capR * 0.36, -capR * 0.16, cy - capR * 0.08);
        ctx.lineTo(0, cy - capR * 0.32);
        ctx.lineTo(capR * 0.16, cy - capR * 0.08);
        ctx.quadraticCurveTo(capR * 0.52, cy - capR * 0.36, capR * 0.42, cy + 4);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ff405e';
        ctx.beginPath(); ctx.arc(0, cy - capR * 0.12, capR * 0.07, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'slime': {
      const wob = Math.sin(t * 6 + m.id) * 0.06;
      ctx.fillStyle = c0;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(-w * 0.5, 0);
      ctx.bezierCurveTo(-w * 0.55, -h * (0.9 + wob), w * 0.55, -h * (0.9 - wob), w * 0.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = c1;
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.ellipse(-w * 0.16, -h * 0.55, w * 0.13, h * 0.18, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      mobFace(ctx, 0, -h * 0.38, w * 0.1, false);
      break;
    }
    case 'stump': {
      ctx.fillStyle = c2;
      rr(ctx, -w * 0.42, -h * 0.85, w * 0.84, h * 0.85, 10); ctx.fill();
      ctx.fillStyle = c0;
      rr(ctx, -w * 0.36, -h * 0.8, w * 0.72, h * 0.76, 8); ctx.fill();
      // 年轮
      ctx.strokeStyle = c1;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(0, -h * 0.82, w * 0.3, 8, 0, 0, Math.PI * 2); ctx.stroke();
      // 树枝手臂
      const swing = Math.sin(m.walkPhase * 2) * 0.3;
      ctx.strokeStyle = c2;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(-w * 0.4, -h * 0.5); ctx.lineTo(-w * 0.68, -h * (0.42 + swing * 0.1)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * 0.4, -h * 0.5); ctx.lineTo(w * 0.68, -h * (0.42 - swing * 0.1)); ctx.stroke();
      // 顶叶
      ctx.fillStyle = '#5cb85c';
      ctx.beginPath();
      ctx.arc(-w * 0.16, -h * 0.92, 11, 0, Math.PI * 2);
      ctx.arc(w * 0.05, -h * 0.98, 12, 0, Math.PI * 2);
      ctx.arc(w * 0.24, -h * 0.9, 9, 0, Math.PI * 2);
      ctx.fill();
      mobFace(ctx, 0, -h * 0.45, w * 0.11, true);
      break;
    }
    case 'cactus': {
      ctx.fillStyle = c0;
      rr(ctx, -w * 0.26, -h * 0.92, w * 0.52, h * 0.92, w * 0.26); ctx.fill();
      rr(ctx, -w * 0.62, -h * 0.6, w * 0.22, h * 0.34, 8); ctx.fill();
      rr(ctx, -w * 0.62, -h * 0.6, w * 0.3, h * 0.14, 7); ctx.fill();
      rr(ctx, w * 0.4, -h * 0.72, w * 0.22, h * 0.4, 8); ctx.fill();
      rr(ctx, w * 0.32, -h * 0.42, w * 0.3, h * 0.14, 7); ctx.fill();
      // 刺
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 6; i++) {
        const sx = -w * 0.18 + (i % 3) * w * 0.18;
        const sy = -h * 0.8 + Math.floor(i / 3) * h * 0.3;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 5, sy - 4); ctx.stroke();
      }
      // 花
      ctx.fillStyle = c1;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + t;
        ctx.beginPath(); ctx.arc(Math.cos(a) * 7, -h * 0.95 + Math.sin(a) * 7, 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ffd94a';
      ctx.beginPath(); ctx.arc(0, -h * 0.95, 4.5, 0, Math.PI * 2); ctx.fill();
      mobFace(ctx, 0, -h * 0.5, w * 0.1, true);
      break;
    }
    case 'boar': {
      const run = Math.sin(m.walkPhase * 2.4);
      // 腿
      ctx.fillStyle = c2;
      rr(ctx, -w * 0.36, -h * 0.3 + run * 3, 9, h * 0.3 - run * 3, 4); ctx.fill();
      rr(ctx, w * 0.14, -h * 0.3 - run * 3, 9, h * 0.3 + run * 3, 4); ctx.fill();
      rr(ctx, -w * 0.12, -h * 0.3 - run * 2, 9, h * 0.3 + run * 2, 4); ctx.fill();
      // 身体
      ctx.fillStyle = c0;
      ctx.beginPath(); ctx.ellipse(-w * 0.06, -h * 0.5, w * 0.44, h * 0.36, 0, 0, Math.PI * 2); ctx.fill();
      // 妖狼鬃毛
      ctx.fillStyle = c2;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const bx = -w * 0.3 + i * w * 0.12;
        ctx.moveTo(bx, -h * 0.82);
        ctx.lineTo(bx + w * 0.06, -h * 1.0);
        ctx.lineTo(bx + w * 0.12, -h * 0.82);
      }
      ctx.fill();
      // 狼首
      ctx.fillStyle = c0;
      ctx.beginPath(); ctx.ellipse(w * 0.3, -h * 0.55, w * 0.2, h * 0.26, 0, 0, Math.PI * 2); ctx.fill();
      // 长吻
      ctx.fillStyle = c1;
      ctx.beginPath(); ctx.ellipse(w * 0.47, -h * 0.5, w * 0.09, h * 0.12, 0, 0, Math.PI * 2); ctx.fill();
      // 尖耳与尾
      ctx.fillStyle = c2;
      ctx.beginPath(); ctx.moveTo(w * 0.2, -h * 0.77); ctx.lineTo(w * 0.28, -h * 1.02); ctx.lineTo(w * 0.36, -h * 0.76); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-w * 0.45, -h * 0.55); ctx.quadraticCurveTo(-w * 0.78, -h * 0.8, -w * 0.72, -h * 0.32); ctx.lineTo(-w * 0.55, -h * 0.42); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5e3a22';
      ctx.beginPath(); ctx.arc(w * 0.46, -h * 0.53, 2, 0, Math.PI * 2); ctx.arc(w * 0.5, -h * 0.53, 2, 0, Math.PI * 2); ctx.fill();
      // 獠牙
      ctx.fillStyle = '#f6f0e0';
      ctx.beginPath();
      ctx.moveTo(w * 0.4, -h * 0.42); ctx.lineTo(w * 0.47, -h * 0.28); ctx.lineTo(w * 0.34, -h * 0.36);
      ctx.closePath(); ctx.fill();
      // 眼
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(w * 0.26, -h * 0.66, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1c1c28';
      ctx.beginPath(); ctx.arc(w * 0.28, -h * 0.66, 2.4, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'golem': {
      const sway = Math.sin(m.walkPhase) * 2;
      // 腿
      ctx.fillStyle = c2;
      rr(ctx, -w * 0.32, -h * 0.28 + sway, w * 0.24, h * 0.28 - sway, 6); ctx.fill();
      rr(ctx, w * 0.08, -h * 0.28 - sway, w * 0.24, h * 0.28 + sway, 6); ctx.fill();
      // 身体
      ctx.fillStyle = c0;
      rr(ctx, -w * 0.42, -h * 0.82, w * 0.84, h * 0.58, 14); ctx.fill();
      // 手臂
      rr(ctx, -w * 0.6, -h * 0.75 + sway * 2, w * 0.2, h * 0.5, 9); ctx.fill();
      rr(ctx, w * 0.4, -h * 0.75 - sway * 2, w * 0.2, h * 0.5, 9); ctx.fill();
      // 头
      ctx.fillStyle = c1;
      rr(ctx, -w * 0.26, -h * 1.0, w * 0.52, h * 0.24, 8); ctx.fill();
      // 裂纹
      ctx.strokeStyle = c2;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-w * 0.2, -h * 0.7); ctx.lineTo(-w * 0.05, -h * 0.55); ctx.lineTo(-w * 0.18, -h * 0.4);
      ctx.moveTo(w * 0.15, -h * 0.75); ctx.lineTo(w * 0.28, -h * 0.6);
      ctx.stroke();
      // 苔藓
      ctx.fillStyle = '#5cb85c';
      ctx.beginPath(); ctx.ellipse(-w * 0.28, -h * 0.82, w * 0.14, 6, -0.3, 0, Math.PI * 2); ctx.fill();
      // 发光眼
      const glow = 0.6 + 0.4 * Math.sin(t * 4 + m.id);
      ctx.fillStyle = 'rgba(255,180,60,' + glow + ')';
      ctx.beginPath();
      ctx.arc(-w * 0.12, -h * 0.9, 5, 0, Math.PI * 2);
      ctx.arc(w * 0.12, -h * 0.9, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'dummy': {
      const shk = flash ? (Math.random() - 0.5) * 3 : 0;
      // 底座
      ctx.fillStyle = '#5c4022';
      rr(ctx, -w * 0.55, -10, w * 1.1, 10, 4); ctx.fill();
      // 立桩主体
      ctx.fillStyle = c0;
      rr(ctx, -w * 0.28, -h * 0.92 + shk, w * 0.56, h * 0.92, 6); ctx.fill();
      // 木纹
      ctx.strokeStyle = c2;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-w * 0.12, -h * 0.86 + shk); ctx.lineTo(-w * 0.12, -6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * 0.08, -h * 0.78 + shk); ctx.lineTo(w * 0.08, -6); ctx.stroke();
      // 年轮顶面
      ctx.fillStyle = c1;
      ctx.beginPath(); ctx.ellipse(0, -h * 0.92 + shk, w * 0.26, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c2;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(0, -h * 0.92 + shk, w * 0.14, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -h * 0.92 + shk, w * 0.06, 0, Math.PI * 2); ctx.stroke();
      // 捆绳
      ctx.strokeStyle = '#a89060';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(-w * 0.3, -h * 0.35); ctx.lineTo(w * 0.3, -h * 0.35); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-w * 0.3, -h * 0.6); ctx.lineTo(w * 0.3, -h * 0.6); ctx.stroke();
      ctx.setLineDash([]);
      // 靶心
      ctx.strokeStyle = '#b54040';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, -h * 0.48 + shk, w * 0.18, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#b54040';
      ctx.beginPath(); ctx.arc(0, -h * 0.48 + shk, w * 0.06, 0, Math.PI * 2); ctx.fill();
      // 名牌
      ctx.fillStyle = '#f1cf78';
      ctx.font = '11px "ZCOOL KuaiLe", sans-serif';
      ctx.textAlign = 'center';
      rr(ctx, -26, -h * 0.22, 52, 16, 4); ctx.fill();
      ctx.fillStyle = '#5c4022';
      ctx.fillText('演武', 0, -h * 0.22 + 12);
      break;
    }
    case 'flying': {
      // 飞行敌人：蝙蝠/鹰妖
      const wingPhase = Math.sin(m.walkPhase * 2.4) * 0.4;
      ctx.save();
      ctx.translate(0, 0);
      ctx.scale(m.facing, 1);
      // 翅膀
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.moveTo(-w * 0.2, 0);
      ctx.lineTo(-w * 0.5, -h * 0.3 + wingPhase * h * 0.3);
      ctx.lineTo(-w * 0.3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w * 0.2, 0);
      ctx.lineTo(w * 0.5, -h * 0.3 - wingPhase * h * 0.3);
      ctx.lineTo(w * 0.3, 0);
      ctx.closePath();
      ctx.fill();
      // 身体
      ctx.fillStyle = c0;
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.2, w * 0.35, h * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      // 头
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.arc(w * 0.15, -h * 0.4, w * 0.18, 0, Math.PI * 2);
      ctx.fill();
      // 眼睛
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(w * 0.2, -h * 0.45, w * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.arc(w * 0.22, -h * 0.45, w * 0.03, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'ranged': {
      // 远程敌人：萨满/弓手
      ctx.save();
      ctx.scale(m.facing, 1);
      // 身体
      ctx.fillStyle = c0;
      rr(ctx, -w * 0.28, -h * 0.55, w * 0.56, h * 0.55, 6);
      ctx.fill();
      // 头
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.arc(0, -h * 0.72, w * 0.22, 0, Math.PI * 2);
      ctx.fill();
      // 武器（弓或法杖）
      ctx.strokeStyle = c2;
      ctx.lineWidth = 3;
      if (d.id === 'archer') {
        // 弓
        ctx.beginPath();
        ctx.arc(-w * 0.1, -h * 0.35, w * 0.18, 1.2, 5.1);
        ctx.stroke();
      } else {
        // 法杖
        ctx.beginPath();
        ctx.moveTo(w * 0.2, -h * 0.8);
        ctx.lineTo(w * 0.35, -h * 0.2);
        ctx.stroke();
        ctx.fillStyle = c1;
        ctx.beginPath();
        ctx.arc(w * 0.35, -h * 0.8, w * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
      // 眼睛
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(w * 0.12, -h * 0.75, w * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.arc(w * 0.14, -h * 0.75, w * 0.03, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
  }

  // 受击白闪
  if (flash) {
    ctx.globalAlpha = Math.min(1, m.hitFlash * 6) * 0.65;
    ctx.fillStyle = '#ffffff';
    rr(ctx, -w * 0.55, -h * 1.05, w * 1.1, h * 1.1, 10);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // 冻结
  if (m.frozenT > 0 && !m.dead) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.fillStyle = 'rgba(120,200,255,0.32)';
    rr(ctx, -d.w * 0.62, -d.h * 1.12, d.w * 1.24, d.h * 1.18, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(220,245,255,0.85)';
    ctx.lineWidth = 2;
    rr(ctx, -d.w * 0.62, -d.h * 1.12, d.w * 1.24, d.h * 1.18, 8);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const a = t * 2 + i * 2.1;
      ctx.beginPath();
      const cx = Math.cos(a) * d.w * 0.5;
      const cy = -d.h * 0.6 + Math.sin(a * 1.3) * d.h * 0.3;
      ctx.moveTo(cx - 5, cy); ctx.lineTo(cx + 5, cy);
      ctx.moveTo(cx, cy - 5); ctx.lineTo(cx, cy + 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 血条
  // 木桩名牌（常驻显示）
  if (d.dummy && !m.dead) {
    ctx.font = '14px "ZCOOL KuaiLe", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(10,15,34,0.85)';
    ctx.strokeText(d.name, m.x, m.y - d.h - 12);
    ctx.fillStyle = '#f1cf78';
    ctx.fillText(d.name, m.x, m.y - d.h - 12);
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.strokeText('技能测试 · 不可击杀', m.x, m.y - d.h + 4);
    ctx.fillStyle = '#c8d4ec';
    ctx.fillText('技能测试 · 不可击杀', m.x, m.y - d.h + 4);
  }

  if (!m.dead && m.hp < m.maxHp && !d.dummy) {
    const bw = Math.max(44, d.w * 1.1);
    const pct = Math.max(0, m.hp / m.maxHp);
    const bx = m.x - bw / 2;
    const by = m.y - d.h - 22 - (boss ? 30 : 0);
    ctx.fillStyle = 'rgba(10,15,34,0.75)';
    rr(ctx, bx - 2, by - 2, bw + 4, 10, 5); ctx.fill();
    const hg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    hg.addColorStop(0, pct > 0.4 ? '#7ae06a' : '#ff8a4a');
    hg.addColorStop(1, pct > 0.4 ? '#3fae4c' : '#e04a2c');
    ctx.fillStyle = hg;
    rr(ctx, bx, by, bw * pct, 6, 3); ctx.fill();
    if (boss) {
      ctx.font = '15px "ZCOOL KuaiLe", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd9de';
      ctx.strokeStyle = 'rgba(20,5,10,0.8)';
      ctx.lineWidth = 3;
      ctx.strokeText(d.name + ' Lv.' + d.level, m.x, by - 8);
      ctx.fillText(d.name + ' Lv.' + d.level, m.x, by - 8);
    }
  }
}

/* ---------------- 玩家角色（Q版大头） ---------------- */

/** 发型绘制：style 0~4，female 决定是否加刘海/发饰 */
function drawHair(ctx: CanvasRenderingContext2D, color: string, style: number, female: boolean, trim: string, t: number) {
  ctx.fillStyle = color;
  // 后发底盘（所有发型通用）
  ctx.beginPath();
  ctx.arc(0, -51, 16.5, Math.PI * 0.86, Math.PI * 2.14);
  ctx.fill();

  switch (style) {
    case 0: { // 道髻
      ctx.beginPath(); ctx.arc(0, -64, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = trim;
      rr(ctx, -7, -66, 14, 4, 2); ctx.fill();
      ctx.fillStyle = '#3a2b1c';
      rr(ctx, -1.5, -70, 3, 8, 1.5); ctx.fill(); // 发簪
      break;
    }
    case 1: { // 高束发（尖束）
      for (let i = 0; i < 4; i++) {
        const sx = -12 + i * 7;
        ctx.beginPath();
        ctx.moveTo(sx, -62); ctx.lineTo(sx + 4, -71 - (i % 2) * 4); ctx.lineTo(sx + 8, -62);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = trim;
      rr(ctx, -16, -58, 32, 4, 2); ctx.fill(); // 抹额
      break;
    }
    case 2: { // 披肩长发
      ctx.beginPath();
      ctx.moveTo(-16, -50); ctx.quadraticCurveTo(-22, -20, -14, -6);
      ctx.lineTo(-9, -8); ctx.quadraticCurveTo(-14, -28, -12, -50); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(16, -50); ctx.quadraticCurveTo(22, -20, 14, -6);
      ctx.lineTo(9, -8); ctx.quadraticCurveTo(14, -28, 12, -50); ctx.closePath(); ctx.fill();
      break;
    }
    case 3: { // 霜白飘发（随风）
      const sway = Math.sin(t * 2) * 3;
      ctx.beginPath();
      ctx.moveTo(-15, -52); ctx.quadraticCurveTo(-30 - sway, -34, -20 - sway, -10);
      ctx.lineTo(-10, -14); ctx.quadraticCurveTo(-16, -34, -11, -52); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -63, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = trim;
      rr(ctx, -2, -70, 3.5, 9, 1.5); ctx.fill();
      break;
    }
    case 4: { // 朱砂马尾
      ctx.beginPath();
      ctx.moveTo(12, -56); ctx.quadraticCurveTo(30, -46, 24, -16);
      ctx.quadraticCurveTo(20, -30, 10, -46); ctx.closePath(); ctx.fill();
      ctx.fillStyle = trim;
      ctx.beginPath(); ctx.arc(13, -56, 3, 0, Math.PI * 2); ctx.fill(); // 发带
      break;
    }
  }

  // 女性：刘海 + 发钗
  if (female) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-15, -52); ctx.quadraticCurveTo(-8, -60, 0, -58);
    ctx.quadraticCurveTo(8, -60, 15, -52);
    ctx.quadraticCurveTo(9, -50, 4, -52); ctx.quadraticCurveTo(0, -49, -4, -52);
    ctx.quadraticCurveTo(-9, -50, -15, -52); ctx.closePath(); ctx.fill();
    // 发钗珠花
    ctx.fillStyle = '#ff7aa8';
    ctx.beginPath(); ctx.arc(-11, -58, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = trim;
    ctx.beginPath(); ctx.arc(-11, -58, 1.1, 0, Math.PI * 2); ctx.fill();
  }
}

export interface ChibiOpts {
  moving?: boolean;
  onGround?: boolean;
  attackT?: number; // 0..1 剩余
  castT?: number;
  hurt?: boolean;
  blinkInv?: boolean;
  buffed?: boolean;
  weaponGlow?: string | null;
  dead?: boolean;
  onRope?: boolean;
  flying?: boolean;
  appearance?: Appearance;
}

export function drawChibi(
  ctx: CanvasRenderingContext2D,
  classId: 'warrior' | 'mage',
  x: number,
  y: number,
  facing: 1 | -1,
  t: number,
  o: ChibiOpts = {},
) {
  const moving = !!o.moving;
  const phase = t * 11;
  const bob = moving && o.onGround !== false ? Math.abs(Math.sin(phase)) * 3 : Math.sin(t * 2.4) * 1.5;
  ctx.save();
  ctx.translate(x, y - bob);
  if (o.dead) { ctx.rotate(Math.PI / 2 * facing); ctx.globalAlpha = 0.85; }
  ctx.scale(facing, 1);
  if (o.blinkInv && Math.sin(t * 26) > 0) ctx.globalAlpha = 0.35;

  const warrior = classId === 'warrior';
  const ap = o.appearance ?? defaultAppearance(classId);
  const face = FACES[ap.face] ?? FACES[0];
  const hair = HAIRS[ap.hair] ?? HAIRS[0];
  const outfit = OUTFITS[ap.outfit] ?? OUTFITS[0];
  const female = ap.gender === 'female';
  const robe = outfit.robe;
  const robeDark = outfit.robeDark;
  const trim = outfit.trim;
  const skin = face.skin;
  const cape = o.weaponGlow ?? outfit.robeDark;
  const legColor = outfit.robeDark;

  // 脚踏飞剑（御剑飞行）
  if (o.flying) {
    const fb = Math.sin(t * 7) * 1.8;
    ctx.save();
    ctx.translate(0, 8 + fb);
    const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, 52);
    halo.addColorStop(0, 'rgba(180,235,255,0.5)');
    halo.addColorStop(1, 'rgba(150,210,255,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.ellipse(0, 2, 52, 13, 0, 0, Math.PI * 2); ctx.fill();
    const blade = ctx.createLinearGradient(-38, 0, 46, 0);
    blade.addColorStop(0, '#7fc9ff');
    blade.addColorStop(0.45, '#f2fbff');
    blade.addColorStop(1, '#a9e6ff');
    ctx.fillStyle = blade;
    ctx.beginPath();
    ctx.moveTo(-32, -1.2); ctx.lineTo(30, -3.6); ctx.lineTo(46, 0); ctx.lineTo(30, 3.6); ctx.lineTo(-32, 1.2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd97a';
    rr(ctx, -40, -3.6, 9, 7.2, 2.5); ctx.fill();
    ctx.strokeStyle = 'rgba(190,240,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-44, -6); ctx.lineTo(-64 - Math.abs(fb) * 3, -10);
    ctx.moveTo(-44, 4); ctx.lineTo(-68 - Math.abs(fb) * 4, 6);
    ctx.stroke();
    ctx.restore();
  }

  // 披风
  const flap = Math.sin(t * 9) * (moving ? 5 : 2);
  ctx.fillStyle = cape;
  ctx.beginPath();
  ctx.moveTo(-8, -32);
  ctx.quadraticCurveTo(-20 - flap, -18, -15 - flap, -2);
  ctx.lineTo(-6, -6);
  ctx.closePath();
  ctx.fill();

  // 腿
  const legSwing = moving && o.onGround !== false ? Math.sin(phase) * 5 : 0;
  ctx.fillStyle = legColor;
  if (o.onRope) {
    const lp = Math.sin(phase * 0.9) * 3;
    rr(ctx, -8, -13 - lp, 7, 12, 3); ctx.fill();
    rr(ctx, 1, -13 + lp, 7, 12, 3); ctx.fill();
    ctx.fillStyle = '#3c2a18';
    rr(ctx, -9, -4 - lp, 9, 5, 2); ctx.fill();
    rr(ctx, 0, -4 + lp, 9, 5, 2); ctx.fill();
  } else {
    rr(ctx, -8 + legSwing * 0.4, -14, 7, 14, 3); ctx.fill();
    rr(ctx, 1 - legSwing * 0.4, -14, 7, 14, 3); ctx.fill();
    ctx.fillStyle = '#3c2a18';
    rr(ctx, -9 + legSwing * 0.4, -4, 9, 5, 2); ctx.fill();
    rr(ctx, 0 - legSwing * 0.4, -4, 9, 5, 2); ctx.fill();
  }

  // 身体
  ctx.fillStyle = robe;
  rr(ctx, -11, -34, 22, 22, 6); ctx.fill();
  ctx.fillStyle = robeDark;
  rr(ctx, -11, -20, 22, 6, 3); ctx.fill();
  ctx.fillStyle = trim;
  ctx.fillRect(-2, -32, 4, 18);

  // 武器与手臂
  const handX = 10, handY = -26;
  if (o.onRope) {
    // 双手抓绳
    ctx.strokeStyle = robe;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-5, -30); ctx.lineTo(-2, -44); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -30); ctx.lineTo(2, -48); ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(-2, -45, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2, -49, 3.2, 0, Math.PI * 2); ctx.fill();
  } else if (warrior) {
    let angle = 0.9; // 持剑
    if (o.attackT && o.attackT > 0) {
      const p = 1 - o.attackT; // 0→1
      angle = -2.3 + p * 3.1;
    }
    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(angle);
    // 剑
    ctx.fillStyle = '#8a5a2b';
    rr(ctx, -2, -2, 9, 5, 2); ctx.fill();
    ctx.fillStyle = '#ffd97a';
    rr(ctx, 6, -5, 4, 11, 2); ctx.fill();
    const blade = ctx.createLinearGradient(10, 0, 42, 0);
    blade.addColorStop(0, '#e8eef8');
    blade.addColorStop(1, '#9fb4d8');
    ctx.fillStyle = blade;
    ctx.beginPath();
    ctx.moveTo(10, -3.5); ctx.lineTo(40, -2); ctx.lineTo(46, 0); ctx.lineTo(40, 2); ctx.lineTo(10, 3.5);
    ctx.closePath(); ctx.fill();
    if (o.weaponGlow) {
      ctx.strokeStyle = o.weaponGlow;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    ctx.restore();
  } else {
    const castP = o.castT && o.castT > 0 ? o.castT : 0;
    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(0.15);
    ctx.fillStyle = '#6e4526';
    rr(ctx, -2, -26, 4.5, 40, 2); ctx.fill();
    const orbPulse = 0.7 + 0.3 * Math.sin(t * 5);
    const orbR = 6 + castP * 5 + orbPulse;
    const og = ctx.createRadialGradient(0, -29, 1, 0, -29, orbR + 4);
    og.addColorStop(0, '#e8fbff');
    og.addColorStop(0.5, 'rgba(110,220,255,0.9)');
    og.addColorStop(1, 'rgba(90,140,255,0)');
    ctx.fillStyle = og;
    ctx.beginPath(); ctx.arc(0, -29, orbR + 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7de8ff';
    ctx.beginPath(); ctx.arc(0, -29, orbR * 0.62, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // 手臂
  if (!o.onRope) {
    ctx.fillStyle = robe;
    rr(ctx, 4, -31, 8, 12, 4); ctx.fill();
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(handX, handY, 3.4, 0, Math.PI * 2); ctx.fill();
  }

  // 头（大头）
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, -49, 16, 0, Math.PI * 2); ctx.fill();
  // 发型（按 hair.style 绘制，配色取 hair.color）
  drawHair(ctx, hair.color, hair.style, female, trim, t);
  // 脸
  const blink = (t % 3.4) < 0.12;
  ctx.fillStyle = '#1c1c28';
  if (blink || o.dead) {
    ctx.fillRect(3, -50, 5, 2);
    ctx.fillRect(10, -50, 5, 2);
  } else {
    ctx.beginPath(); ctx.arc(5, -49, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12, -49, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(5.8, -49.8, 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12.8, -49.8, 0.9, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#e88a6a';
  ctx.beginPath(); ctx.arc(0, -44, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = female ? '#c85878' : '#b06a4a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (o.dead) { ctx.arc(8, -41, 3, Math.PI, 0); }
  else if (o.attackT || o.castT) { ctx.ellipse(8, -42, 3, 4, 0, 0, Math.PI * 2); ctx.fillStyle = female ? '#c85878' : '#7a3a2a'; ctx.fill(); }
  else ctx.arc(8, -44, 3, 0.3, Math.PI - 0.3);
  ctx.stroke();
  // 女性花钿
  if (female && !o.dead) {
    ctx.fillStyle = '#e0507a';
    ctx.beginPath(); ctx.arc(8.5, -55, 1.5, 0, Math.PI * 2); ctx.fill();
  }
  // 腮红
  ctx.fillStyle = female ? 'rgba(255,120,150,0.5)' : 'rgba(255,140,140,0.4)';
  ctx.beginPath(); ctx.arc(-1, -44, 2.6, 0, Math.PI * 2); ctx.arc(14, -44, 2.6, 0, Math.PI * 2); ctx.fill();

  // 受击红染
  if (o.hurt) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ff3a3a';
    ctx.beginPath(); ctx.arc(0, -35, 30, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // buff 光环
  if (o.buffed) {
    ctx.strokeStyle = 'rgba(255,150,50,' + (0.5 + 0.3 * Math.sin(t * 8)) + ')';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, -28, 24 + Math.sin(t * 8) * 3, 34 + Math.sin(t * 8) * 3, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

/* ---------------- 投射物与特效 ---------------- */

function drawProjectilesAndFx(ctx: CanvasRenderingContext2D, g: Engine) {
  for (const p of g.projectiles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.kind === 'bolt') {
      const gr = ctx.createRadialGradient(0, 0, 1, 0, 0, p.r + 6);
      gr.addColorStop(0, '#ffffff');
      gr.addColorStop(0.5, 'rgba(160,220,255,0.9)');
      gr.addColorStop(1, 'rgba(120,160,255,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(0, 0, p.r + 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#cdeaff';
      ctx.beginPath(); ctx.arc(0, 0, p.r * 0.7, 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === 'fire') {
      const gr = ctx.createRadialGradient(0, 0, 2, 0, 0, p.r + 10);
      gr.addColorStop(0, '#fff3b0');
      gr.addColorStop(0.4, '#ff7a3a');
      gr.addColorStop(1, 'rgba(230,60,20,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(0, 0, p.r + 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd97a';
      ctx.beginPath(); ctx.arc(0, 0, p.r * 0.6, 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === 'ice') {
      // 玄冰箭：高速细长冰棱
      ctx.rotate(Math.atan2(p.vy, p.vx));
      const ig = ctx.createLinearGradient(-18, 0, 20, 0);
      ig.addColorStop(0, 'rgba(120,210,255,0.3)');
      ig.addColorStop(0.6, 'rgba(160,235,255,0.95)');
      ig.addColorStop(1, '#ffffff');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.moveTo(22, 0); ctx.lineTo(0, -4); ctx.lineTo(-18, 0); ctx.lineTo(0, 4);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else if (p.kind === 'enemy_arrow') {
      // 敌人投射物：箭矢/法球
      ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.fillStyle = '#8a5a5a';
      ctx.beginPath();
      ctx.moveTo(10, 0); ctx.lineTo(-6, -4); ctx.lineTo(-6, 4);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c08080';
      ctx.beginPath();
      ctx.arc(-6, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'giant_sword') {
      // 巨剑术：金色巨灵大剑缓慢破空推进
      ctx.rotate(p.angle ?? Math.atan2(p.vy, p.vx));
      const rotL = g.time * 6;
      // 环绕灵气光环
      const gg = ctx.createRadialGradient(0, 0, 6, 0, 0, 75);
      gg.addColorStop(0, 'rgba(255,233,158,0.5)');
      gg.addColorStop(0.5, 'rgba(255,180,60,0.25)');
      gg.addColorStop(1, 'rgba(255,180,60,0)');
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.ellipse(0, 0, 75, 36, 0, 0, Math.PI * 2); ctx.fill();

      // 巨剑剑身（长 110，宽 32）
      const swordGrad = ctx.createLinearGradient(-50, 0, 65, 0);
      swordGrad.addColorStop(0, '#ffd97a');
      swordGrad.addColorStop(0.6, '#ffffff');
      swordGrad.addColorStop(1, '#fff5c2');
      ctx.fillStyle = swordGrad;
      ctx.beginPath();
      ctx.moveTo(65, 0); // 剑尖
      ctx.lineTo(35, -16);
      ctx.lineTo(-45, -12);
      ctx.lineTo(-50, 0);
      ctx.lineTo(-45, 12);
      ctx.lineTo(35, 16);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffd97a';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 剑格与剑柄
      ctx.fillStyle = '#b53b32';
      rr(ctx, -55, -20, 10, 40, 3); ctx.fill();
      ctx.fillStyle = '#6e4526';
      rr(ctx, -75, -5, 20, 10, 2); ctx.fill();

      // 旋转符文光环
      ctx.strokeStyle = 'rgba(255,235,170,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(10, 0, 45, 20, rotL, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === 'flying_sword') {
      // 万剑决：流线型青蓝飞剑
      ctx.rotate(Math.atan2(p.vy, p.vx));
      const fg = ctx.createLinearGradient(-16, 0, 20, 0);
      fg.addColorStop(0, '#7fc9ff');
      fg.addColorStop(0.7, '#ffffff');
      fg.addColorStop(1, '#d8f4ff');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(20, 0); ctx.lineTo(8, -4); ctx.lineTo(-16, -2.5); ctx.lineTo(-18, 0); ctx.lineTo(-16, 2.5); ctx.lineTo(8, 4);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#aee6ff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      // 剑柄
      ctx.fillStyle = '#ffd97a';
      rr(ctx, -24, -2, 6, 4, 1); ctx.fill();
    } else if (p.kind === 'sniper_beam') {
      // 天雷决：贯穿雷光狙击！
      ctx.rotate(Math.atan2(p.vy, p.vx));
      const beamL = 80;
      const bRad = ctx.createRadialGradient(0, 0, 2, 0, 0, p.r + 14);
      bRad.addColorStop(0, '#ffffff');
      bRad.addColorStop(0.3, 'rgba(255,240,160,0.9)');
      bRad.addColorStop(0.8, 'rgba(180,230,255,0.4)');
      bRad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = bRad;
      ctx.beginPath(); ctx.ellipse(0, 0, beamL, p.r + 10, 0, 0, Math.PI * 2); ctx.fill();

      // 核心高能光束
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(0, 0, beamL * 0.9, p.r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffe97a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-beamL * 0.8, 0); ctx.lineTo(beamL * 0.8, 0);
      ctx.stroke();
    } else {
      ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.fillStyle = 'rgba(150,225,255,0.95)';
      ctx.beginPath();
      ctx.moveTo(p.r + 8, 0); ctx.lineTo(0, -p.r * 0.6); ctx.lineTo(-p.r, 0); ctx.lineTo(0, p.r * 0.6);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(p.r * 0.5, 0); ctx.lineTo(0, -p.r * 0.3); ctx.lineTo(-p.r * 0.5, 0); ctx.lineTo(0, p.r * 0.3);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  for (const f of g.slashes) {
    const p = f.t / f.max; // 1 → 0
    const a = Math.min(1, (1 - p) * 4) * Math.min(1, p * 3);
    ctx.save();
    ctx.translate(f.x, f.y);
    if (f.kind === 'slash' || f.kind === 'big') {
      const R = f.kind === 'big' ? 86 : 62;
      const sweep = (1 - p) * 2.6 - 1.9;
      ctx.scale(f.facing, 1);
      ctx.rotate(sweep * 0.4);
      ctx.globalAlpha = a;
      const grad = ctx.createLinearGradient(0, -R, 0, R);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.5, f.kind === 'big' ? 'rgba(255,180,70,0.95)' : 'rgba(240,250,255,0.95)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(18, -10, R, -1.25, -0.15);
      ctx.arc(18, -10, R * 0.45, -0.15, -1.25, true);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = f.kind === 'big' ? '#ffe0a0' : '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(18, -10, R * 0.98, -1.2, -0.2);
      ctx.stroke();
    } else if (f.kind === 'spin') {
      ctx.globalAlpha = a;
      const R = 120;
      const rot = (1 - p) * Math.PI * 3;
      ctx.rotate(rot);
      ctx.strokeStyle = 'rgba(255,210,120,0.95)';
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(0, -20, R * 0.8, 0.3, 2.1); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -20, R * 0.8, Math.PI + 0.3, Math.PI + 2.1); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, -20, R * 0.95, 0.4, 2.0); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -20, R * 0.95, Math.PI + 0.4, Math.PI + 2.0); ctx.stroke();
    } else if (f.kind === 'cast') {
      ctx.globalAlpha = a;
      const R = 26 * (1.6 - p * 0.6);
      const gr = ctx.createRadialGradient(0, 0, 2, 0, 0, R);
      gr.addColorStop(0, 'rgba(255,255,255,0.95)');
      gr.addColorStop(0.5, 'rgba(130,220,255,0.8)');
      gr.addColorStop(1, 'rgba(90,140,255,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    } else if (f.kind === 'thunder') {
      ctx.globalAlpha = a;
      const topY = -(f.h ?? 380);
      ctx.strokeStyle = '#fff6c8';
      ctx.lineWidth = 9;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(6, topY);
      const segs = 6;
      for (let i = 1; i <= segs; i++) {
        const yy = topY + ((-topY) / segs) * i;
        const xx = i === segs ? 0 : Math.sin(i * 12.9898 + f.t * 40) * 16;
        ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      ctx.strokeStyle = '#ffe97a';
      ctx.lineWidth = 4;
      ctx.stroke();
      const gr = ctx.createRadialGradient(0, 0, 2, 0, 0, 60 * a + 10);
      gr.addColorStop(0, 'rgba(255,255,220,0.9)');
      gr.addColorStop(1, 'rgba(255,220,90,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(0, 0, 60 * a + 10, 0, Math.PI * 2); ctx.fill();
    } else if (f.kind === 'dash') {
      // 无影斩：一道横贯的高速剑光带 + 数道斩痕
      const w = f.w ?? 300;
      ctx.scale(f.facing, 1);
      ctx.globalAlpha = a;
      // 主残影光带
      const grad = ctx.createLinearGradient(-w / 2 - 30, 0, w / 2 + 30, 0);
      grad.addColorStop(0, 'rgba(216,240,255,0)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.85)');
      grad.addColorStop(1, 'rgba(216,240,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2 + 30, 10 + 8 * (1 - p), 0, 0, Math.PI * 2);
      ctx.fill();
      // 前端锋刃聚光
      const tipG = ctx.createRadialGradient(w / 2 + 6, 0, 1, w / 2 + 6, 0, 26);
      tipG.addColorStop(0, 'rgba(255,255,255,0.95)');
      tipG.addColorStop(1, 'rgba(180,230,255,0)');
      ctx.fillStyle = tipG;
      ctx.beginPath(); ctx.arc(w / 2 + 6, 0, 26, 0, Math.PI * 2); ctx.fill();
      // 多道斜向斩痕
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2.4;
      for (let i = 0; i < 5; i++) {
        const sx = -w / 2 + (w / 4) * i + (1 - p) * 40;
        ctx.beginPath();
        ctx.moveTo(sx - 16, -24);
        ctx.lineTo(sx + 16, 24);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, g: Engine) {
  for (const p of g.particles) {
    const a = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = a;
    if (p.kind === 'shard') {
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life * 7);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
      ctx.restore();
    } else if (p.kind === 'leaf') {
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life * 5);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === 'glow') {
      const gr = ctx.createRadialGradient(p.x, p.y, 0.5, p.x, p.y, p.size);
      gr.addColorStop(0, p.color);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * a + 0.4, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawFloaters(ctx: CanvasRenderingContext2D, g: Engine) {
  for (const f of g.floaters) {
    const a = Math.max(0, f.life / f.maxLife);
    const scaleIn = f.crit ? 1 + Math.max(0, f.life / f.maxLife - 0.75) * 2.4 : 1;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(scaleIn, scaleIn);
    ctx.globalAlpha = Math.min(1, a * 2);
    ctx.font = (f.crit ? '900 ' : '700 ') + f.size + 'px "ZCOOL KuaiLe", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = f.crit ? 6 : 4.5;
    ctx.strokeStyle = 'rgba(15,10,30,0.85)';
    ctx.strokeText(f.text, 0, 0);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/**
 * 法宝【乾坤珠】：紫金光珠缓慢绕主角飞行，
 * 装备后即在世界中显示；未寄存技能时珠体较暗，寄存后随自动施放接近而愈发明亮。
 */
function drawQiankunBead(ctx: CanvasRenderingContext2D, g: Engine) {
  const pl = g.player;
  if (pl.dead) return;
  if (pl.equipment.artifact?.artifactId !== 'qiankun_bead') return;

  const cx = pl.x, cy = pl.y - 40;
  // 缓慢公转（每 4 秒一圈），叠加轻微上下漂浮
  const orbit = g.time * (Math.PI * 2) / 4;
  const rx = 60, ry = 22;
  const bx = cx + Math.cos(orbit) * rx;
  const by = cy + Math.sin(orbit) * ry + Math.sin(g.time * 1.6) * 3;
  const front = Math.sin(orbit) > 0;

  // 与主角之间的能量残影
  const seg = 8;
  for (let i = 0; i < seg; i++) {
    const t = i / seg;
    const ex = cx + Math.cos(orbit - t * 0.55) * rx;
    const ey = cy + Math.sin(orbit - t * 0.55) * ry;
    ctx.globalAlpha = (1 - t) * 0.35;
    ctx.fillStyle = '#c06bff';
    ctx.beginPath(); ctx.arc(ex, ey, 3 * (1 - t) + 1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 主体：紫金光珠
  const R = 9;
  const glowR = R + 12;
  const pulse = 0.6 + 0.4 * Math.sin(g.time * 5);
  const ready = pl.beadSkillId ? Math.min(1, pl.beadT / 5) : 0;

  ctx.save();
  ctx.globalAlpha = front ? 1 : 0.7;

  // 外层柔光
  const outer = ctx.createRadialGradient(bx, by, 2, bx, by, glowR);
  outer.addColorStop(0, `rgba(224,182,255,${0.55 + 0.25 * pulse})`);
  outer.addColorStop(0.55, 'rgba(143,79,216,0.28)');
  outer.addColorStop(1, 'rgba(58,26,92,0)');
  ctx.fillStyle = outer;
  ctx.beginPath(); ctx.arc(bx, by, glowR, 0, Math.PI * 2); ctx.fill();

  // 珠体
  const core = ctx.createRadialGradient(bx - 3, by - 3, 1, bx, by, R);
  core.addColorStop(0, '#ffffff');
  core.addColorStop(0.35, '#e0b6ff');
  core.addColorStop(0.75, '#8f4fd8');
  core.addColorStop(1, '#3a1a5c');
  ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(bx, by, R, 0, Math.PI * 2); ctx.fill();

  // 边框
  ctx.strokeStyle = `rgba(220,180,255,${0.8 + 0.2 * pulse})`;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.ellipse(bx - 3, by - 3.5, 2.6, 1.4, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,246,200,0.75)';
  ctx.beginPath(); ctx.arc(bx + 2.6, by + 2.4, 0.9, 0, Math.PI * 2); ctx.fill();

  // 内嵌灵纹（一道旋转光带）
  ctx.strokeStyle = `rgba(255,255,255,${0.35 + 0.4 * pulse})`;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(bx, by, R * 0.75, R * 0.28, orbit * 2, 0, Math.PI * 2);
  ctx.stroke();

  // 蓄能环：越接近自动施放越亮
  if (ready > 0.01) {
    ctx.strokeStyle = `rgba(255,236,180,${0.5 + 0.5 * ready})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(bx, by, R + 3, -Math.PI / 2, -Math.PI / 2 + ready * Math.PI * 2);
    ctx.stroke();
    if (ready > 0.9) {
      const spark = 0.5 + 0.5 * Math.sin(g.time * 20);
      ctx.strokeStyle = `rgba(255,255,255,${spark})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(bx, by, R + 5, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

/** 法宝【青竹剑】：四柄飞剑环绕自身 */
function drawBambooSwords(ctx: CanvasRenderingContext2D, g: Engine) {
  const pl = g.player;
  if (pl.dead) return;
  if (pl.equipment.artifact?.artifactId !== 'green_bamboo_sword') return;

  const cx = pl.x, cy = pl.y - 30;
  const N = 4, R = 78, RY = 78 * 0.62;
  // 剑阵灵光圈
  ctx.save();
  ctx.strokeStyle = 'rgba(122,224,106,0.22)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 12]);
  ctx.lineDashOffset = -g.time * 40;
  ctx.beginPath();
  ctx.ellipse(cx, cy, R, RY, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  for (let i = 0; i < N; i++) {
    const a = pl.bambooPhase + (i / N) * Math.PI * 2;
    const sx = cx + Math.cos(a) * R;
    const sy = cy + Math.sin(a) * RY;
    const front = Math.sin(a) > 0; // 前景剑更亮
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(a + Math.PI / 2);
    ctx.globalAlpha = front ? 1 : 0.55;

    // 光晕
    const gr = ctx.createRadialGradient(0, 0, 1, 0, 0, 16);
    gr.addColorStop(0, 'rgba(190,255,170,0.55)');
    gr.addColorStop(1, 'rgba(122,224,106,0)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();

    // 竹剑剑身
    const blade = ctx.createLinearGradient(0, -18, 0, 14);
    blade.addColorStop(0, '#eaffdf');
    blade.addColorStop(0.5, '#7ae06a');
    blade.addColorStop(1, '#3f8f4f');
    ctx.fillStyle = blade;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(3.4, -8);
    ctx.lineTo(2.4, 12);
    ctx.lineTo(-2.4, 12);
    ctx.lineTo(-3.4, -8);
    ctx.closePath();
    ctx.fill();
    // 竹节
    ctx.strokeStyle = 'rgba(40,90,45,0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2.6, -2); ctx.lineTo(2.6, -2);
    ctx.moveTo(-2.4, 5); ctx.lineTo(2.4, 5);
    ctx.stroke();
    // 剑柄
    ctx.fillStyle = '#5c4022';
    rr(ctx, -2, 12, 4, 7, 1.5); ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/* ---------------- 主渲染 ---------------- */

export function render(g: Engine) {
  const ctx = g.ctx;
  const dpr = g.dpr;
  const s = g.viewScale;
  const W = g.viewW;
  const H = 720;

  ctx.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
  drawBackdrop(ctx, g, W, H);

  const shakeX = g.shakeT > 0 ? (Math.random() - 0.5) * g.shakePow * g.shakeT * 14 : 0;
  const shakeY = g.shakeT > 0 ? (Math.random() - 0.5) * g.shakePow * g.shakeT * 10 : 0;

  ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * s * (-g.camX + shakeX), dpr * s * (-g.camY + shakeY));

  drawGroundAndPlatforms(ctx, g);
  drawRopes(ctx, g);
  drawNpcs(ctx, g);

  // 传送门
  for (const p of g.portals) {
    drawPortal(ctx, p.x, p.groundY, g.time, p.near ? '→ ' + p.toName : null);
  }

  for (const d of g.drops) drawDrop(ctx, d, g.time);
  for (const m of g.mobs) if (!m.dead) drawMob(ctx, m, g.time);

  // 玩家
  const pl = g.player;
  const atkP = pl.attackMax > 0 ? pl.attackT / pl.attackMax : 0;
  const castP = pl.castMax > 0 ? pl.castT / pl.castMax : 0;
  const wGlow = pl.weaponGlowColor;
  drawChibi(ctx, pl.classId, pl.x, pl.y, pl.facing, g.time, {
    moving: !pl.flying && Math.abs(pl.vx) > 30,
    onGround: pl.onGround,
    flying: pl.flying,
    attackT: atkP > 0 ? atkP : 0,
    castT: castP > 0 ? castP : 0,
    hurt: pl.hurtT > 0,
    blinkInv: pl.invulnT > 0,
    buffed: pl.buffs.length > 0,
    weaponGlow: wGlow,
    dead: pl.dead,
    onRope: pl.onRope,
    appearance: pl.appearance,
  });

  drawBambooSwords(ctx, g);
  drawQiankunBead(ctx, g);
  drawProjectilesAndFx(ctx, g);
  drawParticles(ctx, g);
  drawFloaters(ctx, g);

  // 屏幕空间覆盖层
  ctx.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
  const hpPct = pl.derived.maxHp > 0 ? pl.hp / pl.derived.maxHp : 1;
  if (hpPct < 0.28 && !pl.dead) {
    const pulse = 0.5 + 0.5 * Math.sin(g.time * 6);
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, 'rgba(200,20,30,0)');
    vg.addColorStop(1, 'rgba(200,20,30,' + (0.22 + pulse * 0.16) + ')');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }
  if (pl.hurtT > 0) {
    ctx.fillStyle = 'rgba(255,50,50,' + Math.min(0.22, pl.hurtT * 0.5) + ')';
    ctx.fillRect(0, 0, W, H);
  }
  if (g.transition > 0) {
    ctx.fillStyle = 'rgba(8,10,28,' + Math.min(1, g.transition * 2.2) + ')';
    ctx.fillRect(0, 0, W, H);
  }

  // 鼠标准星（屏幕空间）
  if (g.mouseInside && !pl.dead) {
    const cx = g.mouseVX, cy = g.mouseVY;
    const rot = g.time * 2.2;
    const pc = pl.classId === 'mage' ? '#7adfff' : '#ffd97a';
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = 'rgba(10,15,34,0.9)';
    ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = pc;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.stroke();
    ctx.rotate(rot);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(14, 0); ctx.lineTo(20, 0);
      ctx.stroke();
    }
    ctx.rotate(-rot);
    ctx.fillStyle = pc;
    ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, Math.PI * 2); ctx.fill();

    // 蓄力环（天雷决等蓄力技能）
    if (g.chargingSkillId) {
      const ratio = Math.min(1, g.chargeT / 2);
      ctx.strokeStyle = 'rgba(10,15,34,0.85)';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.stroke();

      ctx.strokeStyle = ratio >= 1 ? '#ffffff' : '#ffe97a';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, 24, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
      ctx.stroke();

      ctx.font = '11px "ZCOOL KuaiLe", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000000';
      const pctText = Math.floor(ratio * 100) + '%';
      ctx.strokeText(pctText, 0, 38);
      ctx.fillStyle = ratio >= 1 ? '#ffffff' : '#ffe97a';
      ctx.fillText(pctText, 0, 38);
    }
    ctx.restore();
  }
}
