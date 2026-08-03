import { useEffect, useRef, useState } from 'react';
import type { Appearance, ClassId, SpiritualRoots } from '../game/types';
import {
  CLASS_INFO, FACES, HAIRS, OUTFITS, defaultAppearance, randomAppearance,
  generateSpiritualRoots,
} from '../game/data';
import { drawChibi } from '../game/render';
import { LeafIcon, SwordIcon, StaffIcon, WarriorPortrait, ThunderIcon } from './Icons';
import { sfx } from '../game/audio';
import RootsRadarChart from './RootsRadarChart';

function ChibiCanvas({ classId, appearance, moving, big }: { classId: ClassId; appearance?: Appearance; moving?: boolean; big?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const apRef = useRef(appearance);
  apRef.current = appearance;
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const t0 = performance.now();
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const t = (now - t0) / 1000;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(10,20,50,0.25)';
      ctx.beginPath();
      ctx.ellipse(w / 2, h - 16, big ? 40 : 34, big ? 10 : 8, 0, 0, Math.PI * 2);
      ctx.fill();
      const scale = big ? 1.5 : 1;
      ctx.save();
      ctx.translate(w / 2, h - 18);
      ctx.scale(scale, scale);
      drawChibi(ctx, classId, 0, 0, 1, t, {
        moving: !!moving,
        onGround: true,
        weaponGlow: '#ffd97a',
        appearance: apRef.current,
      });
      ctx.restore();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [classId, moving, big]);
  return <canvas ref={ref} className={big ? 'w-full h-56' : 'w-full h-44'} />;
}



function Key({ k }: { k: string }) {
  return <span className="keycap">{k}</span>;
}

function MouseIcon({ side }: { side: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#ffcf6b]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="7" y="3" width="10" height="18" rx="5" fill="currentColor" fillOpacity="0.15" />
      {side === 'left'
        ? <path d="M12 3 V10 H7 V8 a5 5 0 0 1 5 -5 Z" fill="currentColor" />
        : <path d="M12 3 V10 H17 V8 a5 5 0 0 0 -5 -5 Z" fill="currentColor" />}
      <path d="M7 10 H17" />
    </svg>
  );
}

const LEAVES = Array.from({ length: 14 }).map((_, i) => ({
  left: (i * 7.3 + 3) % 100,
  delay: (i * 0.9) % 8,
  dur: 7 + (i % 5) * 1.6,
  size: 14 + (i % 4) * 7,
}));

function Picker({ label, value, onPrev, onNext }: { label: string; value: string; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="ms-chip flex items-center gap-2 px-2 py-1.5">
      <span className="w-10 shrink-0 text-[11px] font-bold text-[#a8b8d8]">{label}</span>
      <button onClick={onPrev} className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#5a78bd] bg-[#1c2a52] font-display text-[#ffcf6b] hover:bg-[#28407a]">‹</button>
      <span className="flex-1 text-center font-display text-[14px] text-white">{value}</span>
      <button onClick={onNext} className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#5a78bd] bg-[#1c2a52] font-display text-[#ffcf6b] hover:bg-[#28407a]">›</button>
    </div>
  );
}

export default function StartScreen({
  onStart,
}: {
  onStart: (c: ClassId, name: string, a: Appearance, roots: SpiritualRoots) => void;
}) {
  // 已移除职业分支：所有修士统一以「散修」持剑起修
  const cls: ClassId = 'warrior';
  const [name, setName] = useState('无名散修');
  const [look, setLook] = useState<Appearance>(defaultAppearance('warrior'));
  const [roots, setRoots] = useState<SpiritualRoots>(() => generateSpiritualRoots());

  const cyc = (v: number, n: number, d: number) => (v + d + n) % n;
  const upd = (patch: Partial<Appearance>) => { setLook((l) => ({ ...l, ...patch })); sfx.ui(); };
  const genderName = look.gender === 'male' ? '男' : '女';

  return (
    <div className="relative h-full w-full overflow-y-auto ms-scroll"
      style={{ background: 'linear-gradient(180deg,#b8d7ec 0%,#e8f4f0 34%,#f7f0dc 58%,#8fbf8a 59%,#5f8f68 100%)' }}>
      {/* 飘落灵符 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {LEAVES.map((l, i) => (
          <div key={i} className="leaf-fall absolute" style={{ left: l.left + '%', animationDelay: l.delay + 's', animationDuration: l.dur + 's', width: l.size, height: l.size, color: i % 3 === 0 ? '#ff8a3a' : i % 3 === 1 ? '#e05a2a' : '#ffb347' }}>
            <LeafIcon />
          </div>
        ))}
        {/* 远山 */}
        <svg className="absolute bottom-[41%] left-0 w-full opacity-70" viewBox="0 0 1200 160" preserveAspectRatio="none" style={{ height: 160 }}>
          <path d="M0 160 L0 98 Q120 34 250 82 Q395 124 520 62 Q670 -5 815 68 Q980 128 1200 74 L1200 160 Z" fill="#719d88" />
          <path d="M120 160 L120 118 Q250 68 360 116 Q480 150 590 92 Q725 28 875 102 Q1015 154 1130 108 L1130 160 Z" fill="#4f7f68" opacity="0.55" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto flex min-h-full max-w-5xl flex-col items-center px-4 py-8">
        {/* 标题 */}
        <div className="text-center pop-in">
          <div className="mb-1 flex items-center justify-center gap-3 font-display text-lg tracking-[0.3em] text-[#3a6b2a]">
            <LeafIcon className="h-5 w-5 text-[#e05a2a]" />
            IMMORTAL CLOUD REALM
            <LeafIcon className="h-5 w-5 text-[#e05a2a]" />
          </div>
          <h1 className="font-display text-6xl leading-tight text-white md:text-7xl"
            style={{ textShadow: '0 2px 0 #d88a2a, 0 5px 0 #8a4a12, 0 8px 0 rgba(60,30,5,0.55), 0 14px 24px rgba(0,0,0,0.35)' }}>
            云海修仙录
          </h1>
          <p className="mt-2 font-display text-xl text-[#2a5a1e]">
            横版动作 · 万法可修 · 斩妖悟道 · 秘籍机缘
          </p>
          <p className="mt-1 text-sm font-bold text-[#3a6b2a]">
            自【练气一层】起修，历练气九层 → 筑基 → 结丹 → 元婴，逐境突破
          </p>
        </div>

        {/* 起始设定：散修（无职业分支） */}
        <div className="ms-window mt-7 w-full max-w-3xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="ms-chip flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl p-1.5 text-[#ff9d5a]">
              <WarriorPortrait />
            </div>
            <div className="min-w-0">
              <div className="font-display text-3xl text-[#ffb347]">{CLASS_INFO.warrior.name}</div>
              <div className="text-sm font-bold text-[#a8b8d8]">{CLASS_INFO.warrior.title}</div>
            </div>
            <div className="ml-auto h-9 w-9 text-[#ffb347]"><SwordIcon /></div>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[#c8d4ec]">{CLASS_INFO.warrior.desc}</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <div className="ms-chip flex items-center gap-2 px-2.5 py-2">
              <SwordIcon className="h-5 w-5 shrink-0 text-[#ffd97a]" />
              <span className="text-[11px] font-bold text-[#c8d4ec]">初始持凡剑，仅会近身劈砍</span>
            </div>
            <div className="ms-chip flex items-center gap-2 px-2.5 py-2">
              <ThunderIcon className="h-5 w-5 shrink-0 text-[#8fe6ff]" />
              <span className="text-[11px] font-bold text-[#c8d4ec]">剑法 / 符术 / 身法 / 御空 皆可学</span>
            </div>
            <div className="ms-chip flex items-center gap-2 px-2.5 py-2">
              <StaffIcon className="h-5 w-5 shrink-0 text-[#c06bff]" />
              <span className="text-[11px] font-bold text-[#c8d4ec]">法诀全靠技能书参悟，无门户之别</span>
            </div>
          </div>
        </div>

        {/* 外貌捏人 */}
        <div className="ms-window mt-5 w-full max-w-3xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-display text-xl text-[#ffcf6b]">
              <LeafIcon className="h-5 w-5 text-[#7ac74f]" /> 塑形 · 外貌
            </div>
            <button
              className="ms-btn cursor-pointer rounded-md px-4 py-1.5 text-sm"
              onClick={() => { setLook(randomAppearance()); sfx.equip(); }}
            >
              🎲 随机容貌
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
            {/* 预览 */}
            <div className="ms-chip flex items-center justify-center rounded-lg" style={{ background: 'radial-gradient(circle at 50% 40%, #1b2a52, #0e1730)' }}>
              <ChibiCanvas classId={cls} appearance={look} moving big />
            </div>
            {/* 选项 */}
            <div className="grid grid-cols-2 gap-2 self-center">
              <Picker label="性别" value={genderName}
                onPrev={() => upd({ gender: look.gender === 'male' ? 'female' : 'male' })}
                onNext={() => upd({ gender: look.gender === 'male' ? 'female' : 'male' })} />
              <Picker label="脸型" value={FACES[look.face].name}
                onPrev={() => upd({ face: cyc(look.face, FACES.length, -1) })}
                onNext={() => upd({ face: cyc(look.face, FACES.length, 1) })} />
              <Picker label="发型" value={HAIRS[look.hair].name}
                onPrev={() => upd({ hair: cyc(look.hair, HAIRS.length, -1) })}
                onNext={() => upd({ hair: cyc(look.hair, HAIRS.length, 1) })} />
              <Picker label="服饰" value={OUTFITS[look.outfit].name}
                onPrev={() => upd({ outfit: cyc(look.outfit, OUTFITS.length, -1) })}
                onNext={() => upd({ outfit: cyc(look.outfit, OUTFITS.length, 1) })} />
              <p className="col-span-2 text-[11px] font-bold text-[#8a9ac0]">
                外貌仅影响角色形象，不影响属性与战力。选好后点「入山修行」。
              </p>
            </div>
          </div>
        </div>

        {/* 天生五行灵根（五边形雷达图显示） */}
        <div className="ms-window mt-5 w-full max-w-3xl p-4">
          <div className="mb-2 flex items-center justify-between border-b border-[#3d5590] pb-2">
            <div className="flex items-center gap-2 font-display text-xl text-[#ffd97a]">
              <span>☯</span> 天生五行灵根资质
            </div>
            <button
              className="ms-btn cursor-pointer rounded-md px-4 py-1 text-sm flex items-center gap-1.5"
              onClick={() => { setRoots(generateSpiritualRoots()); sfx.ui(); }}
              title="初始灵根总和固定为 50，随机分布在金木水火土五行之上"
            >
              <span>🎲</span>
              <span>重新洗髓</span>
            </button>
          </div>

          <div className="my-1 flex flex-col items-center justify-center">
            <RootsRadarChart roots={roots} size={290} showEvaluation={true} />
          </div>

          <p className="mt-1 text-center text-xs text-[#8a9ac0]">
            初始灵根总和固定为 <span className="text-[#ffd94a] font-bold">50</span>，各灵根点数 $\ge 0$。每点灵根提升对应五行法诀 <span className="text-[#7ae06a] font-bold">0.5%</span> 威力。
          </p>
        </div>

        {/* 名字 + 开始 */}
        <div className="mt-6 flex w-full max-w-xl flex-col items-center gap-3">
          <div className="ms-window flex w-full items-center gap-3 px-4 py-3">
            <span className="font-display text-lg text-[#ffcf6b]">道号</span>
            <input
              value={name}
              maxLength={8}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent text-center font-display text-xl text-white outline-none placeholder:text-[#5a709e]"
              placeholder="输入道号"
            />
          </div>
          <button
            className="ms-btn w-full max-w-xl cursor-pointer px-10 py-3.5 text-3xl tracking-widest"
            onClick={() => onStart(cls, name.trim() || '无名散修', look, roots)}
          >
            入山修行
          </button>
        </div>

        {/* 操作说明 */}
        <div className="ms-window mt-6 mb-4 w-full max-w-3xl p-4">
          <div className="mb-3 flex items-center gap-2 font-display text-xl text-[#ffcf6b]">
            <ThunderIcon className="h-5 w-5" /> 操作指南
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-[#c8d4ec] md:grid-cols-3">
            <div className="flex items-center gap-2"><Key k="←" /><Key k="→" /> 左右移动</div>
            <div className="flex items-center gap-2"><Key k="空格" /> 跳跃</div>
            <div className="flex items-center gap-2"><MouseIcon side="left" /> 释放装载技能</div>
            <div className="flex items-center gap-2"><MouseIcon side="right" /> 普通攻击</div>
            <div className="flex items-center gap-2"><Key k="1" />~<Key k="9" /> 装载技能到左键</div>
            <div className="flex items-center gap-2"><Key k="↑" /><Key k="↓" /> 攀爬绳索</div>
            <div className="flex items-center gap-2"><Key k="↓" /> 跳下平台</div>
            <div className="flex items-center gap-2"><Key k="Q" /><Key k="E" /> 喝红药 / 蓝药</div>
            <div className="flex items-center gap-2"><Key k="C" /> 属性加点</div>
            <div className="flex items-center gap-2"><Key k="I" /> 乾坤袋法器</div>
            <div className="flex items-center gap-2"><Key k="K" /> 法诀加点</div>
            <div className="flex items-center gap-2"><Key k="M" /> 山海图</div>
            <div className="flex items-center gap-2"><Key k="↑" /> 进入传送阵</div>
            <div className="flex items-center gap-2"><Key k="Esc" /> 暂停</div>
          </div>
          <p className="mt-3 border-t border-[#3d5590] pt-2 text-xs text-[#8a9ac0]">
            提示：所有攻击朝鼠标位置瞄准；高台上的藤索按 ↑ 抓住攀爬；斩妖获得修为、灵石与法器，突破后可分配属性点与法诀点。
            出生的<span className="text-[#ffcf6b]">云隐村</span>中有「云货郎」可用灵石采买丹药法器，「青玄长老」会指点修行之路。
          </p>
          <p className="mt-1 text-xs text-[#8a9ac0]">
            境界：练气一层起步，练气九层修为圆满会遇到<span className="text-[#ffcf6b]">瓶颈</span>，须完成
            <span className="text-[#ffcf6b]">筑基试炼（击败幽篁妖狼王）</span>方可踏入筑基期；
            筑基后剑修习得<span className="text-[#bfe9ff]">御剑飞行</span>，符修习得
            <span className="text-[#bfe9ff]">缩地成寸（瞬移）</span>。
          </p>
        </div>
      </div>
    </div>
  );
}
