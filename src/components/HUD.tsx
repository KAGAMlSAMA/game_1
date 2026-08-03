import type { Snapshot } from '../game/types';
import { CLASS_INFO } from '../game/data';
import {
  AttackIcon, BagIcon, BookIcon, CoinIcon, ConsoleIcon, CrownIcon, FlyIcon, HpPotionIcon, LeafIcon,
  MagePortrait, MapIcon, MouseLeftIcon, MouseRightIcon, MpPotionIcon, PauseIcon,
  SkillIcon, SoundOffIcon, SoundOnIcon, StatsIcon, WarriorPortrait,
} from './Icons';

export type PanelId = 'stats' | 'inventory' | 'skills' | 'map' | 'console' | null;

interface Props {
  snap: Snapshot;
  panel: PanelId;
  onPanel: (p: PanelId) => void;
  onMute: () => void;
  onPause: () => void;
}

function Bar({ cur, max, color, label, h = 16 }: { cur: number; max: number; color: string; label?: string; h?: number }) {
  const pct = Math.max(0, Math.min(100, (cur / Math.max(1, max)) * 100));
  return (
    <div className="relative w-full overflow-hidden rounded-md border border-[#0a0f22] bg-[#0c1228]" style={{ height: h }}>
      <div className="h-full rounded-sm transition-[width] duration-150 ease-linear" style={{ width: pct + '%', background: color }} />
      <div className="absolute inset-0 flex items-center justify-center font-display text-[11px] leading-none text-white"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
        {label ?? `${cur} / ${max}`}
      </div>
    </div>
  );
}

function TopButton({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title}
      className={`ms-chip flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition ${active ? 'border-[#ffcf6b] text-[#ffcf6b]' : 'text-[#c8d4ec] hover:text-white'}`}>
      {children}
    </button>
  );
}

export default function HUD({ snap, panel, onPanel, onMute, onPause }: Props) {
  const expPct = Math.floor((snap.exp / snap.expNeed) * 100);
  const bottleneck = snap.expFull && !!snap.gate && !snap.gate.done;

  return (
    <>
      {/* 左上：角色面板 */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 w-64">
        <div className="ms-window pointer-events-auto p-2.5">
          <div className="flex items-center gap-2.5">
            <div className="ms-chip relative h-12 w-12 shrink-0 overflow-hidden rounded-xl p-1">
              {snap.classId === 'warrior' ? <WarriorPortrait /> : <MagePortrait />}
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-t bg-[#0c1228] px-1.5 font-display text-[11px] leading-tight text-[#ffd94a]">
                Lv.{snap.level}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-base leading-tight text-white">{snap.name}</div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#a8b8d8]">
                <span>{CLASS_INFO[snap.classId].name}</span>
                <span className="rounded px-1 font-display" style={{ color: snap.realm.color, background: snap.realm.color + '22', border: `1px solid ${snap.realm.color}55` }}>
                  {snap.realm.name}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[12px] font-bold text-[#ffd94a]">
                <CoinIcon className="h-3.5 w-3.5" /> {snap.gold}
              </div>
            </div>

          </div>
          <div className="mt-2 space-y-1">
            <Bar cur={snap.hp} max={snap.maxHp} color="linear-gradient(180deg,#ff8a8a,#e03a4a)" />
            <Bar cur={snap.mp} max={snap.maxMp} color="linear-gradient(180deg,#7ab8ff,#2a6fd0)" />
            <Bar cur={snap.exp} max={snap.expNeed} color="linear-gradient(180deg,#ffe97a,#e8b32a)" h={12}
              label={bottleneck ? '修为圆满 · 待突破' : `修为 ${expPct}%`} />
          </div>
          {bottleneck && snap.gate && (
            <button onClick={() => onPanel('stats')}
              className="bar-flash mt-1.5 w-full cursor-pointer rounded-md border border-[#ffd94a] bg-[#3a2f10] px-2 py-1 text-left">
              <div className="font-display text-[12px] leading-tight text-[#ffd94a]">⚑ 瓶颈 · {snap.gate.title}</div>
              <div className="truncate text-[10px] font-bold text-[#c8a84a]">{snap.gate.detail}</div>
            </button>
          )}
          {snap.flying && (
            <div className="mt-1.5 flex items-center gap-1 rounded-md border border-[#7adfff] bg-[#0f2b3a] px-2 py-1 font-display text-[12px] text-[#bfe9ff]">
              <FlyIcon className="h-4 w-4" /> 御剑飞行中
            </div>
          )}
          {snap.buffs.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {snap.buffs.map((b, i) => (
                <span key={i} className="rounded border border-[#ffb347] bg-[#3a2410] px-1.5 py-0.5 font-display text-[11px] text-[#ffb347]">
                  {b.name} {Math.ceil(b.remain)}s
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 顶部中间：BOSS 血条 */}
      {snap.boss && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-20 w-[46%] -translate-x-1/2">
          <div className="ms-window p-2">
            <div className="mb-1 flex items-center justify-center gap-2 font-display text-base text-[#ff8a8a]">
              <CrownIcon className="h-5 w-5 text-[#ffd94a]" />
              {snap.boss.name} · Lv.{snap.boss.level}
            </div>
            <Bar cur={snap.boss.hp} max={snap.boss.maxHp} color="linear-gradient(180deg,#ff6a8a,#a8183a)" h={14} />
          </div>
        </div>
      )}

      {/* 右上：地图 + 按钮 */}
      <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-2">
        <div className="ms-window px-3 py-1.5 text-right">
          <div className="font-display text-lg leading-tight text-white">{snap.mapName}</div>
          <div className="text-[11px] font-bold text-[#a8b8d8]">{snap.mapSub}</div>
        </div>
        <div className="flex gap-1.5">
          <TopButton active={panel === 'stats'} onClick={() => onPanel(panel === 'stats' ? null : 'stats')} title="属性 (C)">
            <StatsIcon className="h-5 w-5" />
          </TopButton>
          <TopButton active={panel === 'inventory'} onClick={() => onPanel(panel === 'inventory' ? null : 'inventory')} title="乾坤袋 (I)">
            <BagIcon className="h-5 w-5" />
          </TopButton>
          <TopButton active={panel === 'skills'} onClick={() => onPanel(panel === 'skills' ? null : 'skills')} title="法诀管理 (K)">
            <BookIcon className="h-5 w-5" />
          </TopButton>
          <TopButton active={panel === 'map'} onClick={() => onPanel(panel === 'map' ? null : 'map')} title="山海图 (M)">
            <MapIcon className="h-5 w-5" />
          </TopButton>
          {(snap.mapId === 'm_author' || snap.visited.includes('m_author')) && (
            <TopButton active={panel === 'console'} onClick={() => onPanel(panel === 'console' ? null : 'console')} title="测试控制台">
              <ConsoleIcon className="h-5 w-5 text-[#ffd94a]" />
            </TopButton>
          )}
          <TopButton onClick={onMute} title="声音">
            {snap.muted ? <SoundOffIcon className="h-5 w-5" /> : <SoundOnIcon className="h-5 w-5" />}
          </TopButton>
          <TopButton onClick={onPause} title="暂停 (Esc)">
            <PauseIcon className="h-5 w-5" />
          </TopButton>
        </div>
      </div>

      {/* 底部中间：技能快捷槽（9格，0=普攻固定，1~8=技能或空） */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1">
        <div className="ms-window pointer-events-auto flex items-end gap-1 p-2 pt-3">
          {snap.loadout.map((id, i) => {
            const isAtk = i === 0;
            const isEmpty = !id;
            const s = (!isAtk && !isEmpty) ? snap.skills.find((x) => x.id === id) ?? null : null;
            const active = i === snap.activeSlot;
            const cdPct = s && s.cdMax > 0 ? Math.min(1, s.cd / s.cdMax) : 0;
            const noMp = !!s && snap.mp < s.mpCost;
            const iconColor = isAtk ? 'text-[#e8eef8]'
              : isEmpty ? 'text-[#3d5590]'
                : noMp ? 'text-[#5a709e]'
                  : s?.kind === 'fire' ? 'text-[#ff9d5a]' : s?.kind === 'ice' ? 'text-[#7adfff]' : s?.kind === 'thunder' ? 'text-[#ffe97a]' : s?.color ?? '#ffd97a';
            return (
              <div key={i}
                className="ms-slot relative flex flex-col items-center justify-center overflow-visible rounded-lg p-1"
                style={{
                  width: active ? 56 : 50, height: active ? 56 : 50,
                  borderColor: s?.active ? '#7adfff' : active ? '#ffcf6b' : isEmpty && !isAtk ? '#2a3550' : undefined,
                  boxShadow: s?.active
                    ? '0 0 14px rgba(122,223,255,0.7), 0 0 0 1.5px #7adfff inset'
                    : active ? '0 0 12px rgba(255,207,107,0.55), 0 0 0 1.5px #ffcf6b inset' : undefined,
                  transform: active ? 'translateY(-3px)' : undefined,
                  opacity: isEmpty && !isAtk ? 0.45 : 1,
                }}
                title={isAtk ? '普通攻击\n鼠标右键释放（装载时左键亦可）'
                  : isEmpty ? `空槽 ${i + 1}（按 K 打开法诀管理装备技能）`
                    : `${s!.name}\n${s!.desc}\n灵力 ${s!.mpCost} · 冷却 ${s!.cdMax}s${s!.extra ? '\n' + s!.extra : ''}`}>

                {isAtk
                  ? <AttackIcon className="h-5 w-5 text-[#e8eef8]" />
                  : isEmpty
                    ? <span className="text-[18px] leading-none text-[#3d5590]">+</span>
                    : <SkillIcon kind={s!.kind} className={`h-5 w-5 ${iconColor}`} />}

                {isAtk ? (
                  <span className="font-display text-[8px] leading-none text-[#a8b8d8]">普攻</span>
                ) : isEmpty ? (
                  <span className="font-display text-[8px] leading-none text-[#3d5590]">空</span>
                ) : (
                  <span className="font-display text-[9px] leading-none" style={{ color: noMp ? '#5a709e' : '#7ab8ff' }}>{s!.mpCost}</span>
                )}

                {cdPct > 0 && s && (
                  <div className="absolute inset-x-0 bottom-0 overflow-hidden rounded-b-md bg-[rgba(8,12,30,0.85)]" style={{ height: cdPct * 100 + '%' }}>
                    <span className="absolute inset-x-0 top-1 flex items-center justify-center font-display text-sm text-white">{s.cd.toFixed(1)}</span>
                  </div>
                )}
                <span className="keycap absolute -top-2.5 left-1/2 h-4 -translate-x-1/2 text-[10px]">{i + 1}</span>

                {active && (
                  <span className="absolute -top-2.5 right-0 flex h-4 items-center rounded-sm bg-gradient-to-b from-[#ffd97a] to-[#ffa733] px-1 font-display text-[9px] leading-none text-[#5a3305]">
                    左键
                  </span>
                )}
                {s?.active && (
                  <span className="absolute -bottom-2 left-1/2 flex h-4 -translate-x-1/2 items-center rounded-sm bg-[#0f2b3a] px-1 font-display text-[9px] leading-none text-[#7adfff] ring-1 ring-[#7adfff]">
                    飞行
                  </span>
                )}
              </div>
            );
          })}
          <div className="mx-0.5 h-10 w-px bg-[#3d5590]" />
          {([['hp', 'Q'], ['mp', 'E']] as const).map(([k, key]) => (
            <div key={k} className="ms-slot relative flex flex-col items-center justify-center rounded-lg p-1" style={{ width: 50, height: 50 }}>
              {k === 'hp' ? <HpPotionIcon className="h-7 w-7" /> : <MpPotionIcon className="h-7 w-7" />}
              <span className="absolute bottom-0.5 right-1 font-display text-[11px] leading-none text-white" style={{ textShadow: '0 1px 2px #000' }}>
                ×{snap.potions[k]}
              </span>
              <span className="keycap absolute -top-2 left-1/2 h-4 -translate-x-1/2 text-[10px]">{key}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 rounded-md bg-[rgba(10,15,34,0.66)] px-3 py-1 text-[11px] font-bold text-[#c8d4ec]">
          <span className="flex items-center gap-1 text-[#ffcf6b]">
            <MouseLeftIcon className="h-4 w-4" />
            {snap.loadout[snap.activeSlot]
              ? (snap.loadout[snap.activeSlot] === 'attack' || snap.activeSlot === 0
                ? '普通攻击'
                : snap.skills.find((s) => s.id === snap.loadout[snap.activeSlot])?.name ?? '—')
              : '空槽 · 按 K 装备技能'}
          </span>
          <span className="flex items-center gap-1 text-[#a8b8d8]"><MouseRightIcon className="h-4 w-4" /> 普通攻击</span>
          <span className="text-[#8a9ac0]">K 管理法诀</span>
        </div>
      </div>

      {/* 靠近 NPC 提示 */}
      {snap.nearNpc && !snap.npcView && (
        <div className="pointer-events-none absolute bottom-28 left-1/2 z-20 -translate-x-1/2">
          <div className="pop-in flex items-center gap-2 rounded-lg border border-[#ffcf6b] bg-[rgba(20,16,8,0.82)] px-3 py-1.5">
            <span className="keycap">F</span>
            <span className="font-display text-[13px] text-[#ffe9b8]">与「{snap.nearNpc}」交谈</span>
          </div>
        </div>
      )}

      {/* 左下：日志 */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex w-80 flex-col-reverse gap-1">
        {snap.log.map((l) => (
          <div key={l.id} className="log-in flex items-center gap-1.5 rounded bg-[rgba(10,15,34,0.66)] px-2 py-1 text-[12px] font-bold"
            style={{ color: l.color }}>
            <LeafIcon className="h-3 w-3 shrink-0 text-[#7ac74f]" />
            <span className="truncate">{l.text}</span>
          </div>
        ))}
      </div>

      {/* 右下：提示 */}
      <div className="pointer-events-none absolute bottom-3 right-3 z-20 rounded bg-[rgba(10,15,34,0.55)] px-2 py-1 text-[11px] font-bold text-[#8a9ac0]">
        C 属性 · I 背包 · K 法诀 · M 地图 · Esc 暂停
      </div>
    </>
  );
}
