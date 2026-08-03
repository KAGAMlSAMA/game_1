import { useState } from 'react';
import type { ArtifactId, EquipmentItem, InvItem, Slot, Snapshot } from '../game/types';
import {
  MAPS, RARITY_COLOR, RARITY_NAME, SLOT_NAME, realmOf, skillById, ARTIFACTS, SKILLS, ENEMIES, ALL_ARTIFACTS,
  ELEMENT_NAMES, ELEMENT_COLORS, ELEMENT_ICONS,
} from '../game/data';

/** 等级 → 境界名（用于展示技能书的最低要求） */
const REALM_AT = (level: number) => realmOf(level).name;
import {
  ArtifactIcon, BagIcon, BookIcon, CloseIcon, CoinIcon, ConsoleIcon, CrownIcon, HpPotionIcon, LeafIcon, LockIcon,
  MagePortrait, MapIcon, MpPotionIcon, RealmIcon, SkillIcon, SkullIcon, SlotIcon, StatsIcon, WarriorPortrait,
} from './Icons';
import RootsRadarChart from './RootsRadarChart';
import type { PanelId } from './HUD';

interface PanelProps {
  snap: Snapshot;
  onClose: () => void;
}

function Window({ title, icon, onClose, children, w = 480 }: { title: string; icon?: React.ReactNode; onClose: () => void; children: React.ReactNode; w?: number }) {
  return (
    <div className="ms-window pop-in absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2" style={{ width: `min(${w}px, 94vw)` }}>
      <div className="ms-titlebar flex items-center gap-2 px-3 py-2">
        <span className="text-[#ffcf6b]">{icon}</span>
        <span className="font-display text-lg text-white">{title}</span>
        <button onClick={onClose} className="ml-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#5a78bd] bg-[#1c2a52] text-[#a8b8d8] hover:bg-[#e05a4a] hover:text-white">
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

/* ---------------- 属性面板 ---------------- */

export function StatsPanel({ snap, onClose }: PanelProps) {
  const d = snap.derived;
  return (
    <Window title="修士属性" icon={<StatsIcon className="h-5 w-5" />} onClose={onClose} w={560}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="ms-chip h-12 w-12 overflow-hidden rounded-lg p-1">
            {snap.classId === 'warrior' ? <WarriorPortrait /> : <MagePortrait />}
          </div>
          <div>
            <div className="font-display text-lg leading-tight text-white">
              {snap.name} <span style={{ color: snap.realm.color }}>{snap.realm.name}</span>
              <span className="ml-1 text-[11px] text-[#8a9ac0]">Lv.{snap.level}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-[#ffd94a]"><CoinIcon className="h-3.5 w-3.5" />{snap.gold} 灵石</div>
          </div>
        </div>
        <div className="rounded-lg border border-[#3d5590] bg-[#0c1228] px-3 py-1.5 text-right">
          <div className="text-[10px] font-bold text-[#8a9ac0]">升级成长</div>
          <div className="font-display text-[12px] text-[#7ae06a]">基础自然增长 · 破境大跃升</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* 基础属性 */}
        <div className="ms-chip space-y-1.5 p-2.5">
          <div className="flex items-center justify-between border-b border-[#24365f] pb-1">
            <span className="font-display text-[13px] text-[#ffd97a]">基础属性</span>
            <span className="text-[10px] text-[#8a9ac0]">每级提升 · 破境飞跃</span>
          </div>
          {([
            ['威力', d.power, '#ffb347', '统领所有剑法与术法基础伤害'],
            ['护体真元', d.def, '#7adfff', '抵扣所受伤害'],
            ['气血上限', d.maxHp, '#ff6a6a', '当前生命最大值'],
            ['灵力上限', d.maxMp, '#bfe9ff', '施展法诀所需灵力'],
          ] as const).map(([label, val, color, tip]) => (
            <div key={label} className="flex items-center justify-between text-xs font-bold" title={tip}>
              <span className="text-[#c8d4ec]">{label}</span>
              <span className="font-display text-sm" style={{ color }}>{val}</span>
            </div>
          ))}
        </div>

        {/* 进阶属性 */}
        <div className="ms-chip space-y-1.5 p-2.5">
          <div className="flex items-center justify-between border-b border-[#24365f] pb-1">
            <span className="font-display text-[13px] text-[#c06bff]">进阶属性</span>
            <span className="text-[10px] text-[#8a9ac0]">破境提升 · 装备加成</span>
          </div>
          {([
            ['神识', d.sense, '#c06bff', '灵觉感知，加成会心率与掉落机缘'],
            ['身法', d.agility, '#7ae06a', '决定移速、跳跃高度与闪避'],
            ['闪避率', `${d.dodgeRate}%`, '#7ae06a', '身法免除受创伤害概率'],
            ['会心率', `${d.critRate}%`, '#ffd97a', '触发暴击会心的几率'],
            ['会心伤害', `${d.critDmg}%`, '#ff6a4a', '会心暴击时的伤害倍率'],
          ] as const).map(([label, val, color, tip]) => (
            <div key={label} className="flex items-center justify-between text-xs font-bold" title={tip}>
              <span className="text-[#c8d4ec]">{label}</span>
              <span className="font-display text-sm" style={{ color }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 五行灵根展示（五边形雷达图与五行点数） */}
      <div className="ms-chip mt-2.5 p-2.5">
        <div className="mb-1.5 flex items-center justify-between border-b border-[#24365f] pb-1">
          <span className="font-display text-[13px] text-[#ffd94a]">五行灵根资质（五边形阵盘）</span>
          <span className="text-[10px] text-[#8a9ac0]">每点灵根加成对应属性法诀 +0.5% 伤害</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[230px_1fr] items-center gap-2">
          {/* 左侧五边形雷达图 */}
          <div className="flex items-center justify-center p-1 bg-[#0c1228] rounded-lg border border-[#24365f]">
            <RootsRadarChart roots={d.roots} size={210} showEvaluation={false} />
          </div>

          {/* 右侧明细条目 */}
          <div className="space-y-1">
            {(['metal', 'wood', 'water', 'fire', 'earth'] as const).map((elem) => {
              const rootVal = d.roots[elem];
              const bonusPct = (rootVal * 0.5).toFixed(1);
              const color = ELEMENT_COLORS[elem];
              const name = ELEMENT_NAMES[elem];
              const icon = ELEMENT_ICONS[elem];
              return (
                <div
                  key={elem}
                  className="flex items-center justify-between rounded px-2 py-1 text-xs font-bold"
                  style={{ background: color + '12', border: `1px solid ${color}44` }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{icon}</span>
                    <span className="font-display text-[12px]" style={{ color }}>{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm text-white">{rootVal} 点</span>
                    <span className="text-[10px] text-[#7ae06a]">+{bonusPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 境界与突破试炼 */}
      <div className="ms-chip mt-3 px-3 py-2">
        <div className="flex items-center gap-2">
          <span style={{ color: snap.realm.color }}><RealmIcon className="h-5 w-5" /></span>
          <span className="font-display text-base" style={{ color: snap.realm.color }}>{snap.realm.name}</span>
          <span className="text-[11px] font-bold text-[#8a9ac0]">{snap.realm.stage}</span>
          <span className="ml-auto text-[11px] font-bold text-[#a8b8d8]">
            下一境界：<span className="text-white">{snap.realm.next}</span>
          </span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded border border-[#0a0f22] bg-[#0c1228]">
          <div className="h-full" style={{
            width: Math.min(100, (snap.exp / Math.max(1, snap.expNeed)) * 100) + '%',
            background: 'linear-gradient(180deg,#ffe97a,#e8b32a)',
          }} />
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] font-bold">
          <span className="text-[#a8b8d8]">修为 {snap.exp} / {snap.expNeed}</span>
          {snap.expFull && <span className="text-[#ffd94a]">修为圆满</span>}
        </div>
        {snap.gate ? (
          <div className={`mt-2 rounded-md border px-2.5 py-1.5 ${snap.gate.done ? 'border-[#7ae06a] bg-[#122c16]' : 'border-[#ffd94a] bg-[#3a2f10]'}`}>
            <div className="flex items-center gap-1.5 font-display text-[13px]" style={{ color: snap.gate.done ? '#7ae06a' : '#ffd94a' }}>
              {snap.gate.done ? '✔' : '⚑'} {snap.gate.title}
              <span className="ml-auto text-[11px] font-bold">
                {!snap.gate.open ? '尚未开放 · 可直接突破' : snap.gate.done ? '试炼已达成' : '进行中'}
              </span>
            </div>
            <div className="mt-0.5 text-[11px] font-bold text-[#c8d4ec]">{snap.gate.detail}</div>
            {!snap.gate.done && snap.expFull && (
              <div className="mt-1 text-[11px] font-bold text-[#ff9d5a]">修为已达瓶颈，完成试炼后将立即突破</div>
            )}
          </div>
        ) : (
          <div className="mt-2 text-[11px] font-bold text-[#8a9ac0]">本境界无需试炼，修为圆满即可自行突破</div>
        )}
      </div>
    </Window>
  );
}

/* ---------------- 技能面板 ---------------- */

/** 技能详细说明浮层：伤害数值 / 冷却 / 灵力 / 特性 */
function SkillTooltip({ s, snap, x, y }: { s: Snapshot['skills'][number]; snap: Snapshot; x: number; y: number }) {
  const realmOk = snap.level >= s.reqLevel;
  const KIND_LABEL: Record<string, string> = {
    melee: '近战斩击', spin: '范围剑阵', buff: '自身增益',
    fire: '火系术法', ice: '冰系术法', thunder: '雷系蓄力',
    giant_sword: '贯穿飞剑', flying_swords: '追踪飞剑',
    blink: '瞬移身法', fly: '御空状态',
  };
  // 紧贴鼠标：默认右下方 10px，空间不足时翻转到左侧 / 上方
  const W = 280, H = 290, PAD = 8;
  const flipX = x + 10 + W > window.innerWidth - PAD;
  const flipY = y + 10 + H > window.innerHeight - PAD;
  const left = flipX ? Math.max(PAD, x - W - 10) : x + 10;
  const top = flipY ? Math.max(PAD, y - H - 6) : y + 10;
  return (
    <div
      className="pointer-events-none fixed z-[60]"
      style={{ left, top, width: W }}
    >
      <div className="ms-window pop-in p-0" style={{ borderColor: s.color }}>
        {/* 标题 */}
        <div className="flex items-center gap-2 border-b-2 px-2.5 py-2" style={{ borderColor: s.color + '55' }}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border"
            style={{ borderColor: s.color, color: s.color }}>
            <SkillIcon kind={s.kind} className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[15px]" style={{ color: s.color }}>{s.name}</div>
            <div className="text-[10px] font-bold text-[#8a9ac0]">
              {s.tag} · {KIND_LABEL[s.kind] ?? s.kind}
            </div>
          </div>
          {s.learned
            ? <span className="shrink-0 rounded bg-[#12301a] px-1.5 py-0.5 text-[10px] font-bold text-[#7ae06a]">已参悟</span>
            : <span className="shrink-0 rounded bg-[#301218] px-1.5 py-0.5 text-[10px] font-bold text-[#ff8a8a]">未参悟</span>}
        </div>

        <div className="space-y-1.5 px-2.5 py-2">
          {/* 说明 */}
          <div className="text-[11px] leading-relaxed text-[#c8d4ec]">{s.desc}</div>

          {/* 被动效果清单 */}
          {s.passive && s.passiveLines.length > 0 && (
            <div className="space-y-0.5 rounded-md bg-[#0c1228] px-2 py-1.5">
              {s.passiveLines.map((line) => (
                <div key={line} className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: s.color }}>
                  <span className="text-[9px]">◆</span>{line}
                </div>
              ))}
            </div>
          )}

          {/* 核心数值 */}
          <div className={`grid grid-cols-2 gap-x-2 gap-y-1 rounded-md bg-[#0c1228] px-2 py-1.5 text-[11px] font-bold ${s.passive ? 'hidden' : ''}`}>
            <div className="flex justify-between">
              <span className="text-[#8a9ac0]">冷却</span>
              <span className="text-[#7adfff]">{s.cdMax}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a9ac0]">灵力</span>
              <span className="text-[#7ab8ff]">{s.mpCost}</span>
            </div>
            {s.estDmg > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-[#8a9ac0]">倍率</span>
                  <span className="text-[#ffd94a]">{Math.round(s.mult * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a9ac0]">段数</span>
                  <span className="text-[#ffd94a]">×{s.hits}</span>
                </div>
                <div className="col-span-2 flex justify-between border-t border-[#24365f] pt-1">
                  <span className="text-[#8a9ac0]">单段伤害</span>
                  <span className="text-[#ff9d5a]">约 {s.estDmg}</span>
                </div>
                {s.hits > 1 && (
                  <div className="col-span-2 flex justify-between">
                    <span className="text-[#8a9ac0]">满命中总伤</span>
                    <span className="text-[#ff6a6a]">约 {s.estTotal}</span>
                  </div>
                )}
                {s.cdMax > 0 && (
                  <div className="col-span-2 flex justify-between">
                    <span className="text-[#8a9ac0]">理论 DPS</span>
                    <span className="text-[#ffb347]">约 {Math.round(s.estTotal / Math.max(0.1, s.cdMax))}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 特性说明 */}
          {s.dmgNote && (
            <div className="rounded-md border-l-2 px-2 py-1 text-[10px] font-bold leading-relaxed"
              style={{ borderColor: s.color, background: s.color + '14', color: '#c8d4ec' }}>
              {s.dmgNote}
            </div>
          )}
          {s.extra && (
            <div className="text-[10px] font-bold text-[#8fd0ff]">◈ {s.extra}</div>
          )}

          {/* 状态行 */}
          <div className="border-t border-[#24365f] pt-1.5 text-[10px] font-bold">
            {s.passive ? (
              <span className="text-[#7ae06a]">✔ 被动心法已融入周身，永久生效（不占快捷槽）</span>
            ) : s.learned ? (
              s.equipped
                ? <span className="text-[#7ae06a]">✔ 已装备在快捷槽 {s.slotIdx + 1}（按 {s.slotIdx + 1} 切换后左键释放）</span>
                : <span className="text-[#ffd94a]">⚑ 尚未装备 · 选中右侧空槽后点击此法诀即可装入</span>
            ) : (
              <span style={{ color: realmOk ? '#ffd94a' : '#ff8a8a' }}>
                需 {REALM_AT(s.reqLevel)} · 参悟 {s.bookName}
                {realmOk ? '（境界已足，购书即可参悟）' : '（境界不足）'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 法诀管理面板：展示已学/未学技能 + 快捷槽装备管理 */
export function SkillsPanel({
  snap, onClose, onEquipSkill, onSetBeadSkill,
}: PanelProps & {
  onEquipSkill: (slot: number, skillId: string) => void;
  onSetBeadSkill: (skillId: string) => void;
}) {
  const [selSlot, setSelSlot] = useState<number | null>(null);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const slots = snap.loadout; // 9 个槽位，索引 0~8
  // 只展示已参悟的法诀，避免剧透未习得的内容
  const learned = snap.skills.filter((s) => s.learned);
  const actives = learned.filter((s) => !s.passive);
  const passives = learned.filter((s) => s.passive);
  const learnedCount = learned.length;
  const TAGS = Array.from(new Set(actives.map((s) => s.tag)));
  const hoverSkill = hover ? snap.skills.find((s) => s.id === hover.id) ?? null : null;
  // 乾坤珠可寄存的法诀：已装备到快捷槽且具备攻击性
  const beadCandidates = actives.filter(
    (s) => s.equipped && s.kind !== 'buff' && s.kind !== 'blink' && s.kind !== 'fly',
  );

  return (
    <Window title="法诀管理" icon={<BookIcon className="h-5 w-5" />} onClose={onClose} w={700}>
      <div className="grid gap-3 md:grid-cols-[1fr_240px]">

        {/* 左：所有法诀（按分类展示） */}
        <div>
          <div className="mb-2 flex items-center justify-between text-[12px] font-bold text-[#a8b8d8]">
            <span>点击已学法诀 → 装备到右侧选中的快捷槽</span>
            <span className="text-[#ffcf6b]">已参悟 {learnedCount} / {snap.skills.length}</span>
          </div>
          <div className="ms-scroll max-h-[320px] space-y-2.5 overflow-y-auto pr-1">
            {/* 被动心法（学会即生效，不占快捷槽） */}
            {passives.length > 0 && (
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="font-display text-[12px] text-[#7ae06a]">心法 · 被动</span>
                  <span className="text-[10px] font-bold text-[#5fa84a]">学会即生效，无需装备</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {passives.map((s) => (
                    <div
                      key={s.id}
                      onMouseEnter={(e) => setHover({ id: s.id, x: e.clientX, y: e.clientY })}
                      onMouseMove={(e) => setHover({ id: s.id, x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHover(null)}
                      className="ms-chip flex items-center gap-2 rounded-lg px-2 py-2"
                      style={{ borderColor: s.color + '88', background: s.color + '10' }}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border"
                        style={{ borderColor: s.color, color: s.color }}>
                        <RealmIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-[13px]" style={{ color: s.color }}>{s.name}</div>
                        <div className="truncate text-[10px] font-bold text-[#a8b8d8]">
                          {s.passiveLines.join(' · ')}
                        </div>
                      </div>
                      <span className="shrink-0 rounded bg-[#12301a] px-1 font-display text-[10px] text-[#7ae06a]">生效中</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 主动法诀（可装备到快捷槽） */}
            {TAGS.map((tag) => {
              const group = actives.filter((s) => s.tag === tag);
              return (
                <div key={tag}>
                  <div className="mb-1 font-display text-[12px] text-[#ffcf6b]">{tag}</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {group.map((s) => {
                      const isEq = s.equipped;
                      const canPick = s.learned && selSlot !== null && selSlot >= 1;
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            if (canPick) { onEquipSkill(selSlot!, s.id); setSelSlot(null); }
                          }}
                          onMouseEnter={(e) => setHover({ id: s.id, x: e.clientX, y: e.clientY })}
                          onMouseMove={(e) => setHover({ id: s.id, x: e.clientX, y: e.clientY })}
                          onMouseLeave={() => setHover(null)}
                          className="ms-chip flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:border-[#7ab8ff]"
                          style={{ borderColor: isEq ? s.color : undefined }}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border"
                            style={{ borderColor: s.color, color: s.color }}>
                            <SkillIcon kind={s.kind} className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 truncate">
                              <span className="font-display text-[13px] text-white">{s.name}</span>
                              {isEq && <span className="shrink-0 rounded bg-[#1a2840] px-1 text-[10px] font-bold" style={{ color: s.color }}>槽{s.slotIdx + 1}</span>}
                            </div>
                            <div className="truncate text-[10px] font-bold"
                              style={{ color: isEq ? '#7ae06a' : '#c8a84a' }}>
                              {isEq ? `已装备 · 按 ${s.slotIdx + 1} 切换` : '未装备 · 选中右侧空槽后点此装入'}
                            </div>
                          </div>
                          {s.active && <span className="shrink-0 rounded bg-[#0f2b3a] px-1 font-display text-[10px] text-[#7adfff] ring-1 ring-[#7adfff]">生效</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {learnedCount === 0 && (
              <div className="mt-1 rounded-md border border-[#3d5590] bg-[#0e1730] px-3 py-2 text-[11px] font-bold text-[#8a9ac0]">
                尚无已参悟的法诀。前往云隐村找「云货郎」购买技能书，在乾坤袋(I)中点击书本参悟。
              </div>
            )}
          </div>
        </div>

        {/* 右：9 个快捷槽 */}
        <div>
          <div className="mb-2 text-[12px] font-bold text-[#a8b8d8]">
            快捷槽（1~9 键切换，左键释放）
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 9 }).map((_, i) => {
              const skillId = slots[i] ?? '';
              const skill = skillId && skillId !== 'attack' ? snap.skills.find((s) => s.id === skillId) : null;
              const isAtk = i === 0;
              const isActive = snap.activeSlot === i;
              const isSel = selSlot === i;
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (isAtk) return;
                    if (isSel) { setSelSlot(null); return; }
                    setSelSlot(i);
                  }}
                  onMouseEnter={(e) => { if (skill) setHover({ id: skill.id, x: e.clientX, y: e.clientY }); }}
                  onMouseMove={(e) => { if (skill) setHover({ id: skill.id, x: e.clientX, y: e.clientY }); }}
                  onMouseLeave={() => setHover(null)}
                  className="ms-slot flex flex-col items-center gap-1 rounded-xl px-1 py-2 transition"
                  style={{
                    borderColor: isAtk ? '#5a78bd' : isSel ? '#ffe97a' : isActive ? '#ffcf6b' : skill ? skill.color : '#3d5590',
                    boxShadow: isSel ? '0 0 10px rgba(255,233,74,0.5)' : undefined,
                  }}
                  title={isAtk ? '固定：普通攻击（不可更改）' : skill ? undefined : isSel ? '点击已学技能装入此槽；再次点击此槽取消选择' : '点击此槽选中，然后点击左侧法诀装入'}
                >
                  <span className="font-display text-[10px] text-[#8a9ac0]">{i + 1}</span>
                  {isAtk ? (
                    <>
                      <BookIcon className="h-6 w-6 text-[#c8d4ec]" />
                      <span className="font-display text-[10px] text-[#a8b8d8]">普攻</span>
                    </>
                  ) : skill ? (
                    <>
                      <span style={{ color: skill.color }}><SkillIcon kind={skill.kind} className="h-6 w-6" /></span>
                      <span className="max-w-14 truncate font-display text-[10px]" style={{ color: skill.color }}>{skill.name}</span>
                    </>
                  ) : (
                    <>
                      <span className="h-6 w-6 text-[#3d5590] text-xl leading-6">+</span>
                      <span className="font-display text-[10px] text-[#3d5590]">空槽</span>
                    </>
                  )}
                  {skill && !isAtk && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEquipSkill(i, ''); }}
                      className="mt-0.5 cursor-pointer rounded bg-[#1c1c28] px-1.5 font-display text-[9px] text-[#ff6a6a] hover:bg-[#3c1c1c]"
                    >
                      卸下
                    </button>
                  )}
                </button>
              );
            })}
          </div>
          {selSlot !== null && selSlot >= 1 && (
            <div className="mt-2 rounded-md border border-[#ffe97a] bg-[#3a2f10] p-2 text-center font-display text-[12px] text-[#ffe97a]">
              槽 {selSlot + 1} 已选中 · 点击左侧已学法诀装入
            </div>
          )}
          {/* 法宝 · 乾坤珠寄存 */}
          {snap.artifact && (
            <div className="mt-2 rounded-lg border-2 px-2 py-2"
              style={{ borderColor: snap.artifact.color, background: snap.artifact.color + '12' }}>
              <div className="flex items-center gap-1.5">
                <span style={{ color: snap.artifact.color }}><ArtifactIcon id={snap.artifact.id} className="h-5 w-5" /></span>
                <span className="font-display text-[13px]" style={{ color: snap.artifact.color }}>
                  {snap.artifact.name}
                </span>
                <span className="ml-auto text-[10px] font-bold text-[#8a9ac0]">法宝</span>
              </div>

              {snap.artifact.id === 'qiankun_bead' ? (
                <>
                  <div className="mt-1 text-[10px] font-bold text-[#a8b8d8]">
                    寄存一道攻击法诀，每 {snap.artifact.autoCdMax} 秒自动施放（免灵力 · 不占冷却）
                  </div>
                  <div className="mt-1.5 space-y-1">
                    <div className="text-[10px] font-bold text-[#8a9ac0]">当前寄存</div>
                    <div className="flex items-center gap-1.5 rounded-md bg-[#0c1228] px-2 py-1.5">
                      {snap.artifact.boundSkillName ? (
                        <>
                          <span className="font-display text-[12px] text-[#e8eef8]">
                            {snap.artifact.boundSkillName}
                          </span>
                          <span className="ml-auto font-display text-[11px]" style={{ color: snap.artifact.color }}>
                            {snap.artifact.autoCd.toFixed(1)}s
                          </span>
                          <button
                            onClick={() => onSetBeadSkill('')}
                            className="cursor-pointer rounded bg-[#1c1c28] px-1.5 font-display text-[9px] text-[#ff6a6a] hover:bg-[#3c1c1c]"
                          >
                            取出
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] font-bold text-[#5a709e]">尚未寄存法诀</span>
                      )}
                    </div>
                    {/* 可寄存的已装备攻击法诀 */}
                    <div className="grid grid-cols-2 gap-1">
                      {beadCandidates.length > 0 ? beadCandidates.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => onSetBeadSkill(s.id)}
                          className="ms-chip cursor-pointer rounded-md px-1.5 py-1 text-left transition hover:border-[#c06bff]"
                          style={{ borderColor: snap.artifact!.boundSkillId === s.id ? snap.artifact!.color : undefined }}
                        >
                          <div className="flex items-center gap-1">
                            <span style={{ color: s.color }}><SkillIcon kind={s.kind} className="h-3.5 w-3.5" /></span>
                            <span className="truncate font-display text-[10px] text-[#c8d4ec]">{s.name}</span>
                          </div>
                        </button>
                      )) : (
                        <div className="col-span-2 text-[10px] font-bold text-[#6a7a9e]">
                          先把攻击法诀装到快捷槽，才能寄存进乾坤珠
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-1 space-y-0.5">
                  {snap.artifact.detail.map((d) => (
                    <div key={d} className="flex items-start gap-1 text-[10px] font-bold text-[#c8d4ec]">
                      <span className="text-[8px]" style={{ color: snap.artifact!.color }}>◆</span>{d}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-2 text-[11px] font-bold text-[#8a9ac0]">
            新技能：背包(I)中找到技能书 → 点击「参悟」 → 回到此处装备
          </div>
          <div className="mt-1 text-[11px] font-bold text-[#6a7a9e]">
            💡 鼠标悬停任意法诀可查看详细伤害数值
          </div>
        </div>
      </div>

      {/* 悬浮详细说明 */}
      {hoverSkill && hover && (
        <SkillTooltip s={hoverSkill} snap={snap} x={hover.x} y={hover.y} />
      )}
    </Window>
  );
}

/* ---------------- 背包面板 ---------------- */

function itemStats(it: EquipmentItem): [string, string][] {
  const out: [string, string][] = [];
  if (it.power) out.push(['威力', '+' + it.power]);
  if (it.def) out.push(['护体真元', '+' + it.def]);
  if (it.hp) out.push(['气血', '+' + it.hp]);
  if (it.mp) out.push(['灵力', '+' + it.mp]);
  if (it.sense) out.push(['神识', '+' + it.sense]);
  if (it.agility) out.push(['身法', '+' + it.agility]);
  if (it.critRate) out.push(['会心率', '+' + it.critRate + '%']);
  if (it.critDmg) out.push(['会心伤害', '+' + it.critDmg + '%']);
  if (it.metal) out.push(['金灵根', '+' + it.metal]);
  if (it.wood) out.push(['木灵根', '+' + it.wood]);
  if (it.water) out.push(['水灵根', '+' + it.water]);
  if (it.fire) out.push(['火灵根', '+' + it.fire]);
  if (it.earth) out.push(['土灵根', '+' + it.earth]);
  return out;
}

type Sel = { t: 'inv'; idx: number } | { t: 'eq'; slot: Slot } | null;

const SLOT_LAYOUT: { slot: Slot; cls: string }[] = [
  { slot: 'helmet', cls: 'left-1/2 top-0 -translate-x-1/2' },
  { slot: 'weapon', cls: 'left-0 top-12' },
  { slot: 'armor', cls: 'left-1/2 top-14 -translate-x-1/2' },
  { slot: 'gloves', cls: 'right-0 top-12' },
  { slot: 'shoes', cls: 'left-1/2 bottom-16 -translate-x-1/2' },
  { slot: 'artifact', cls: 'left-1/2 bottom-0 -translate-x-1/2' },
];

function ItemBox({ it, onClick, selected }: { it: EquipmentItem; onClick: () => void; selected: boolean }) {
  return (
    <button onClick={onClick}
      className={`ms-slot rarity-border-${it.rarity} relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border-2`}
      style={{ color: RARITY_COLOR[it.rarity] }}
      title={it.name}>
      <SlotIcon slot={it.slot} artifactId={it.artifactId} className="h-7 w-7" />
      {selected && <span className="absolute inset-0 rounded-md bg-[rgba(255,207,107,0.18)] ring-2 ring-[#ffcf6b]" />}
    </button>
  );
}

export function InventoryPanel({ snap, onClose, onEquip, onUnequip, onLearnBook }: PanelProps & { onEquip: (i: number) => void; onUnequip: (s: Slot) => void; onLearnBook: (i: number) => void }) {
  const [sel, setSel] = useState<Sel>(null);
  const selItem: EquipmentItem | null = sel ? (sel.t === 'inv' ? (snap.inventory[sel.idx]?.t === 'eq' ? (snap.inventory[sel.idx] as { t: 'eq'; item: EquipmentItem }).item : null) : snap.equipment[sel.slot]) : null;

  return (
    <Window title="乾坤袋与法器" icon={<BagIcon className="h-5 w-5" />} onClose={onClose} w={620}>
      <div className="flex gap-3">
        {/* 纸娃娃 */}
        <div className="ms-chip relative h-72 w-44 shrink-0 rounded-lg p-2">
          <div className="pointer-events-none absolute left-1/2 top-[42%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 opacity-25">
            {snap.classId === 'warrior' ? <WarriorPortrait /> : <MagePortrait />}
          </div>
          {SLOT_LAYOUT.map(({ slot, cls }) => {
            const it = snap.equipment[slot];
            const isArtifact = slot === 'artifact';
            return (
              <div key={slot} className={`absolute ${cls}`}>
                {it ? (
                  <ItemBox it={it} selected={sel?.t === 'eq' && sel.slot === slot} onClick={() => setSel({ t: 'eq', slot })} />
                ) : (
                  <button onClick={() => setSel(null)}
                    className="ms-slot flex h-12 w-12 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed"
                    style={isArtifact ? { borderColor: '#c06bff', color: '#c06bff' } : { color: '#5a709e' }}>
                    <SlotIcon slot={slot} className="h-5 w-5 opacity-60" />
                    <span className="text-[9px] font-bold">{SLOT_NAME[slot]}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="min-w-0 flex-1">
          {/* 详情 */}
          <div className="ms-chip mb-2 min-h-24 rounded-lg px-3 py-2">
            {selItem ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-display text-base" style={{ color: RARITY_COLOR[selItem.rarity] }}>{selItem.name}</span>
                  <span className="rounded px-1.5 text-[11px] font-bold" style={{ background: RARITY_COLOR[selItem.rarity] + '26', color: RARITY_COLOR[selItem.rarity] }}>
                    {RARITY_NAME[selItem.rarity]}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-[#a8b8d8]">
                  {SLOT_NAME[selItem.slot]}
                  {selItem.artifactId ? ' · 无属性加成，仅具特殊神通' : ` · 需要等级 Lv.${selItem.level}`}
                  {!selItem.artifactId && selItem.level > snap.level && <span className="ml-1 text-[#ff8a8a]">（等级不足）</span>}
                </div>
                {selItem.artifactId ? (
                  <div className="mt-1 space-y-0.5">
                    {(ARTIFACTS[selItem.artifactId]?.detail ?? []).map((d) => (
                      <div key={d} className="flex items-start gap-1 text-[11px] font-bold text-[#c8d4ec]">
                        <span className="text-[8px]" style={{ color: RARITY_COLOR[selItem.rarity] }}>◆</span>{d}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 grid grid-cols-3 gap-x-3 text-[12px] font-bold text-[#7ae06a]">
                    {itemStats(selItem).map(([k, v]) => (
                      <span key={k}>{k} <span className="text-white">{v}</span></span>
                    ))}
                  </div>
                )}
                <div className="mt-2">
                  {sel?.t === 'inv' ? (
                    <button className="ms-btn cursor-pointer rounded-md px-4 py-1 text-sm" onClick={() => { onEquip(sel.idx); setSel(null); }}>
                      祭炼
                    </button>
                  ) : sel?.t === 'eq' ? (
                    <button className="ms-btn cursor-pointer rounded-md px-4 py-1 text-sm" onClick={() => { onUnequip(sel.slot); setSel(null); }}>
                      卸下
                    </button>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-20 items-center justify-center text-sm text-[#8a9ac0]">
                选择一件法器查看属性 · 妖物掉落法器，品质由机缘决定
              </div>
            )}
          </div>
          {/* 背包格子 */}
          <div className="grid grid-cols-8 gap-1.5">
            {Array.from({ length: 24 }).map((_, i) => {
              const it: InvItem | undefined = snap.inventory[i];
              if (!it) return <div key={i} className="ms-slot h-12 w-12 rounded-lg" />;
              if (it.t === 'eq') {
                return <ItemBox key={i} it={it.item} selected={sel?.t === 'inv' && sel.idx === i} onClick={() => setSel({ t: 'inv', idx: i })} />;
              }
              if (it.t === 'book') {
                const rc = RARITY_COLOR[it.rarity];
                const sd = skillById(it.skillId);
                const learned = snap.skills.find((s) => s.id === it.skillId)?.learned ?? false;
                const realmOk = snap.level >= it.reqLevel;
                const usable = !learned && realmOk;
                return (
                  <button key={i}
                    className={`ms-slot relative flex h-12 w-12 flex-col items-center justify-center rounded-lg border-2 transition ${usable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}`}
                    style={{ borderColor: rc, color: rc, opacity: usable ? 1 : 0.55 }}
                    onClick={() => onLearnBook(i)}
                    title={`${it.name}【${RARITY_NAME[it.rarity]}】\n参悟可习得【${sd?.name ?? it.skillId}】\n最低境界：${REALM_AT(it.reqLevel)}\n${learned ? '⚠ 已参悟过此法诀' : realmOk ? '✔ 点击参悟' : '⚠ 境界不足'}`}>
                    <BookIcon className="h-6 w-6" />
                    {learned ? (
                      <span className="absolute -top-1 -right-1 rounded bg-[#0c1228] px-0.5 font-display text-[9px] text-[#7ae06a]">已悟</span>
                    ) : !realmOk ? (
                      <span className="absolute -top-1 -right-1 rounded bg-[#0c1228] px-0.5 font-display text-[9px] text-[#ff8a8a]">锁</span>
                    ) : (
                      <span className="bar-flash absolute -top-1 -right-1 rounded bg-[#0c1228] px-0.5 font-display text-[9px] text-[#ffd94a]">悟</span>
                    )}
                  </button>
                );
              }
              return (
                <div key={i} className="ms-slot relative flex h-12 w-12 items-center justify-center rounded-lg"
                  title={it.t === 'hp' ? '回春丹：按 Q 恢复 45% 气血' : '聚灵丹：按 E 恢复 45% 灵力'}>
                  {it.t === 'hp' ? <HpPotionIcon className="h-8 w-8" /> : <MpPotionIcon className="h-8 w-8" />}
                  {'n' in it && <span className="absolute bottom-0.5 right-1 font-display text-[11px] leading-none text-white" style={{ textShadow: '0 1px 2px #000' }}>×{it.n}</span>}
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 text-right text-[11px] font-bold text-[#8a9ac0]">
            乾坤袋 {snap.inventory.filter((i) => i.t === 'eq').length}/24 件法器
          </div>
        </div>
      </div>
    </Window>
  );
}

/* ---------------- 山海图 ---------------- */

export function WorldMapPanel({ snap, onClose, onTravel }: PanelProps & { onTravel: (id: string) => void }) {
  return (
    <Window title="云海诸峰 · 山海图" icon={<MapIcon className="h-5 w-5" />} onClose={onClose} w={680}>
      <p className="mb-2 text-[12px] font-bold text-[#8a9ac0]">到达过传送阵即可解锁区域，点击已解锁区域御风传送（当前区域内仍会暂停战斗）</p>
      <div className="relative h-[320px] w-full overflow-hidden rounded-lg border border-[#3d5590] bg-[#0a0f22]">
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {MAPS.map((m) =>
            m.portals.map((p) => {
              const target = MAPS.find((x) => x.id === p.toMap);
              if (!target) return null;
              // gridX: 0~6 -> center is around 3. offsetX = 320 - 3*80 = 80
              const x1 = 100 + m.grid[0] * 76;
              const y1 = 160 + m.grid[1] * 76;
              const x2 = 100 + target.grid[0] * 76;
              const y2 = 160 + target.grid[1] * 76;
              return <line key={`${m.id}-${p.toMap}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3d5590" strokeWidth="2" />;
            })
          )}
        </svg>
        {MAPS.map((m, i) => {
          const unlocked = snap.visited.includes(m.id);
          const current = snap.mapId === m.id;
          const x = 100 + m.grid[0] * 76;
          const y = 160 + m.grid[1] * 76;
          return (
            <div key={m.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}>
              <button
                disabled={!unlocked || current}
                onClick={() => onTravel(m.id)}
                className={`relative z-10 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-4 transition ${current ? 'border-[#ffd94a] shadow-[0_0_16px_rgba(255,217,74,0.6)]' : unlocked ? 'border-[#7ac74f] hover:scale-110 hover:border-[#aef1ff]' : 'cursor-not-allowed border-[#3d5590]'}`}
                style={{ background: current ? 'radial-gradient(circle,#5a4a10,#2a2408)' : unlocked ? 'radial-gradient(circle,#1e4a24,#0c2410)' : 'radial-gradient(circle,#1c2a52,#0e1730)' }}
                title={unlocked ? `${m.name}\n${m.sub}` : '未探索'}
              >
                {current ? <LeafIcon className="h-6 w-6 text-[#ffd94a]" /> : unlocked ? <MapIcon className="h-6 w-6 text-[#7ae06a]" /> : <LockIcon className="h-6 w-6 text-[#5a709e]" />}
                {m.id === 'm6' && unlocked && <CrownIcon className="absolute -top-3 h-5 w-5 text-[#ffd94a]" />}
                <span className="absolute -bottom-1 left-1/2 h-3 -translate-x-1/2 rounded bg-[#0c1228] px-1 font-display text-[10px] leading-3 text-[#8a9ac0]">{i + 1}</span>
              </button>
              <div className="pointer-events-none absolute -bottom-5 left-1/2 w-24 -translate-x-1/2 text-center text-[10px] font-bold"
                style={{ color: current ? '#ffd94a' : unlocked ? '#c8d4ec' : '#5a709e', textShadow: '0 1px 2px #000' }}>
                {unlocked ? m.name : '？？？'}
              </div>
            </div>
          );
        })}
      </div>
    </Window>
  );
}

/* ---------------- NPC 对话 / 商店 ---------------- */

export function NpcPanel({
  snap, onNext, onClose, onBuy,
}: {
  snap: Snapshot;
  onNext: () => void;
  onClose: () => void;
  onBuy: (id: string) => void;
}) {
  const v = snap.npcView;
  if (!v) return null;
  const isMerchant = v.kind === 'merchant';
  const line = v.lines[Math.min(v.lineIdx, v.lines.length - 1)];
  const lastLine = v.lineIdx >= v.lines.length - 1;

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center pb-8">
      <div className="ms-window pop-in w-[min(760px,94vw)]">
        {/* 标题栏 */}
        <div className="ms-titlebar flex items-center gap-2 px-3 py-2">
          <span style={{ color: isMerchant ? '#ffd97a' : '#aef1ff' }}>
            {isMerchant ? <CoinIcon className="h-5 w-5" /> : <BookIcon className="h-5 w-5" />}
          </span>
          <span className="font-display text-lg text-white">{v.name}</span>
          <span className="text-[11px] font-bold text-[#a8b8d8]">{v.title}</span>
          <span className="ml-auto flex items-center gap-1 font-display text-sm text-[#ffd94a]">
            <CoinIcon className="h-4 w-4" />{snap.gold}
          </span>
          <button onClick={onClose} className="ml-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#5a78bd] bg-[#1c2a52] text-[#a8b8d8] hover:bg-[#e05a4a] hover:text-white">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* 对话区 */}
        <div className="px-4 py-3">
          <div className="ms-chip min-h-16 px-3 py-2.5 text-[14px] leading-relaxed text-[#e8eef8]">
            {line}
          </div>
          {!v.shopOpen && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8a9ac0]">
                {v.lineIdx + 1} / {v.lines.length}
              </span>
              <button className="ms-btn cursor-pointer rounded-md px-6 py-1.5 text-base" onClick={onNext}>
                {lastLine ? (isMerchant ? '看看货架' : '受教了') : '继续'}
              </button>
            </div>
          )}

          {/* 商店货架 */}
          {v.shopOpen && (
            <>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-display text-base text-[#ffcf6b]">货架</span>
                <span className="text-[11px] font-bold text-[#8a9ac0]">{v.shopHint}</span>
              </div>
              <div className="ms-scroll mt-1.5 grid max-h-[280px] grid-cols-2 gap-2 overflow-y-auto pr-1">
                {v.shop.map((s) => (
                  <div key={s.id} className="ms-chip flex items-center gap-2.5 px-2.5 py-2">
                    <div className={`ms-slot rarity-border-${s.rarity} flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2`}
                      style={{ color: RARITY_COLOR[s.rarity] }}>
                      {s.kind === 'hp' ? <HpPotionIcon className="h-7 w-7" />
                        : s.kind === 'mp' ? <MpPotionIcon className="h-7 w-7" />
                          : s.kind === 'book' ? <BookIcon className="h-6 w-6" />
                            : s.slot ? <SlotIcon slot={s.slot} className="h-6 w-6" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-display text-[14px]" style={{ color: s.kind === 'equip' || s.kind === 'book' ? RARITY_COLOR[s.rarity] : '#e8eef8' }}>
                          {s.name}
                        </span>
                        {(s.kind === 'equip' || s.kind === 'book') && (
                          <span className="shrink-0 rounded px-1 text-[10px] font-bold"
                            style={{ background: RARITY_COLOR[s.rarity] + '26', color: RARITY_COLOR[s.rarity] }}>
                            {RARITY_NAME[s.rarity]}
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[10px] font-bold text-[#8a9ac0]">{s.desc}</div>
                      {s.kind === 'book' && s.bookReqLevel !== undefined && (
                        <div className="truncate text-[10px] font-bold"
                          style={{ color: s.bookLearned ? '#7ae06a' : snap.level >= s.bookReqLevel ? '#ffd94a' : '#ff8a8a' }}>
                          {s.bookLearned ? '✔ 已参悟' : `需 ${REALM_AT(s.bookReqLevel)}${snap.level >= s.bookReqLevel ? '（可参悟）' : '（境界不足）'}`}
                        </div>
                      )}
                      {s.stats.length > 0 && (
                        <div className="truncate text-[10px] font-bold text-[#7ae06a]">
                          {s.stats.map(([k, val]) => `${k} ${val}`).join(' · ')}
                        </div>
                      )}
                    </div>
                    <button
                      disabled={!s.affordable}
                      onClick={() => onBuy(s.id)}
                      className="ms-btn shrink-0 cursor-pointer rounded-md px-2.5 py-1 text-[12px] disabled:cursor-not-allowed">
                      <span className="flex items-center gap-1"><CoinIcon className="h-3 w-3" />{s.price}</span>
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#8a9ac0]">丹药自动入袋，法器存入乾坤袋（按 I 查看穿戴）</span>
                <button className="ms-chip cursor-pointer rounded-md px-5 py-1.5 font-display text-[14px] text-[#c8d4ec] hover:text-white" onClick={onClose}>
                  告辞 (Esc)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- 暂停 / 死亡 / 胜利 ---------------- */

export function PauseMenu({ onResume, onQuit }: { onResume: () => void; onQuit: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[rgba(6,10,26,0.72)] backdrop-blur-[2px]">
      <div className="ms-window pop-in w-80 p-5 text-center">
        <LeafIcon className="mx-auto h-10 w-10 text-[#ff9d2e]" />
        <div className="mt-1 font-display text-3xl text-white">游戏暂停</div>
        <div className="mt-3 space-y-2">
          <button className="ms-btn w-full cursor-pointer py-2.5 text-xl" onClick={onResume}>继续修行 (Esc)</button>
          <button
            className="w-full cursor-pointer rounded-lg border-2 border-[#ffd97a] bg-gradient-to-b from-[#3a2f10] to-[#1e1708] py-2 font-display text-lg text-[#ffd94a] shadow transition hover:brightness-110"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('author-cheat'));
              onResume();
            }}
          >
            ⚡ 开启作者模式（+99W灵石/全地图）
          </button>
          <button className="ms-chip w-full cursor-pointer py-2.5 font-display text-lg text-[#c8d4ec] hover:text-white" onClick={onQuit}>返回标题</button>
        </div>
        <div className="mt-4 border-t border-[#3d5590] pt-3 text-left text-[12px] text-[#a8b8d8]">
          <div className="mb-1 font-display text-sm text-[#ffcf6b]">
            <span>按键速查</span>
          </div>
          <div className="grid grid-cols-2 gap-y-1">
            <span>← → / A D 移动</span><span>空格 跳跃</span>
            <span>鼠标左键 释放法诀</span><span>鼠标右键 普通攻击</span>
            <span>1~9 装载法诀到左键</span><span>↑↓ 攀爬藤索</span>
            <span>Q / E 丹药</span><span>↓ 跳下平台</span>
            <span>C 属性 · I 乾坤袋</span><span>K 法诀 · M 山海图</span>
            <span>↑ 进传送阵</span><span>Esc 暂停</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeathOverlay({ onRespawn }: { onRespawn: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(90,10,20,0.55), rgba(10,5,15,0.88))' }}>
      <div className="pop-in text-center">
        <SkullIcon className="mx-auto h-20 w-20 text-[#ff6a6a]" />
        <div className="mt-2 font-display text-5xl text-[#ff6a6a]" style={{ textShadow: '0 3px 0 #4a0a12, 0 8px 20px rgba(0,0,0,0.6)' }}>
          你被击败了
        </div>
        <p className="mt-2 text-sm font-bold text-[#e8a8a8]">损失了 5% 当前修为，法器与丹药完好无损</p>
        <button className="ms-btn mt-5 cursor-pointer px-10 py-3 text-2xl" onClick={onRespawn}>
          重新出发 (Enter)
        </button>
      </div>
    </div>
  );
}

/* ---------------- 测试控制台 ---------------- */

export function ConsolePanel({
  snap, onClose, onLearnSkillDirectly, onLearnAllSkillsDirectly, onSpawnEnemyDirectly, onClearEnemiesDirectly, onGrantArtifactDirectly,
}: PanelProps & {
  onLearnSkillDirectly: (skillId: string) => void;
  onLearnAllSkillsDirectly: () => void;
  onSpawnEnemyDirectly: (enemyId: string) => void;
  onClearEnemiesDirectly: () => void;
  onGrantArtifactDirectly: (artifactId: ArtifactId) => void;
}) {
  const [tab, setTab] = useState<'skills' | 'enemies' | 'artifacts'>('skills');

  return (
    <Window title="测试控制台 · 作者模式" icon={<ConsoleIcon className="h-5 w-5" />} onClose={onClose} w={720}>
      {/* 选项卡 */}
      <div className="mb-3 flex items-center gap-2 border-b border-[#3d5590] pb-2">
        <button
          onClick={() => setTab('skills')}
          className={`ms-btn cursor-pointer rounded-md px-3.5 py-1 text-sm ${tab === 'skills' ? 'brightness-125' : 'grayscale opacity-75'}`}
        >
          ✨ 法诀领悟 ({SKILLS.length})
        </button>
        <button
          onClick={() => setTab('enemies')}
          className={`ms-btn cursor-pointer rounded-md px-3.5 py-1 text-sm ${tab === 'enemies' ? 'brightness-125' : 'grayscale opacity-75'}`}
        >
          👹 妖物召唤 ({Object.keys(ENEMIES).length})
        </button>
        <button
          onClick={() => setTab('artifacts')}
          className={`ms-btn cursor-pointer rounded-md px-3.5 py-1 text-sm ${tab === 'artifacts' ? 'brightness-125' : 'grayscale opacity-75'}`}
        >
          🔮 法宝获取 ({ALL_ARTIFACTS.length})
        </button>
      </div>

      {/* 内容区域 */}
      <div className="ms-scroll max-h-[380px] overflow-y-auto pr-1">
        {tab === 'skills' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-[#0e1730] p-2.5">
              <span className="text-xs font-bold text-[#c8d4ec]">一键学会所有法诀，并自动填满快捷槽：</span>
              <button
                onClick={onLearnAllSkillsDirectly}
                className="ms-btn cursor-pointer rounded-md px-4 py-1 text-sm"
              >
                ✨ 领悟全套法诀
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SKILLS.map((s) => {
                const learned = snap.skills.find((x) => x.id === s.id)?.learned;
                return (
                  <div key={s.id} className="ms-chip flex items-center justify-between p-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border" style={{ borderColor: s.color, color: s.color }}>
                        <SkillIcon kind={s.kind} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-sm truncate" style={{ color: s.color }}>{s.name}</div>
                        <div className="text-[10px] text-[#8a9ac0] truncate">{s.tag} · {s.desc(1)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onLearnSkillDirectly(s.id)}
                      className={`ms-btn shrink-0 cursor-pointer rounded-md px-2.5 py-1 text-xs ${learned ? 'opacity-80' : ''}`}
                    >
                      {learned ? '重新领悟' : '学会法诀'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'enemies' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-[#0e1730] p-2.5">
              <span className="text-xs font-bold text-[#c8d4ec]">清理周围非木桩妖物：</span>
              <button
                onClick={onClearEnemiesDirectly}
                className="ms-chip cursor-pointer rounded-md px-4 py-1 text-xs text-[#ff8a8a] border-[#ff8a8a] hover:bg-[#3c1c1c]"
              >
                🧹 清空周围妖物
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(ENEMIES).map((e) => (
                <div key={e.id} className="ms-chip flex items-center justify-between p-2.5">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display text-sm text-white">{e.name}</span>
                      <span className="rounded bg-[#24365f] px-1 text-[10px] text-[#ffd94a]">Lv.{e.level}</span>
                      {e.flying && <span className="rounded bg-[#3a4f86] px-1 text-[10px] text-[#8fe6ff]">飞行</span>}
                      {e.ranged && <span className="rounded bg-[#3a4f86] px-1 text-[10px] text-[#ff9d5a]">远程</span>}
                      {e.boss && <span className="rounded bg-[#5c2a38] px-1 text-[10px] text-[#ff6a6a]">BOSS</span>}
                      {e.dummy && <span className="rounded bg-[#3a3020] px-1 text-[10px] text-[#c9975f]">演武</span>}
                    </div>
                    <div className="text-[10px] text-[#8a9ac0] mt-0.5">
                      血量 {e.hp} · 攻击 {e.atk} · 移速 {e.speed}
                    </div>
                  </div>
                  <button
                    onClick={() => onSpawnEnemyDirectly(e.id)}
                    className="ms-btn shrink-0 cursor-pointer rounded-md px-2.5 py-1 text-xs"
                  >
                    召唤眼前
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'artifacts' && (
          <div className="space-y-2">
            {ALL_ARTIFACTS.map((a) => {
              const owned = snap.inventory.some((it) => it.t === 'eq' && it.item.artifactId === a.id) || snap.equipment.artifact?.artifactId === a.id;
              return (
                <div key={a.id} className="ms-chip flex items-center justify-between p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2" style={{ borderColor: a.color, color: a.color }}>
                      <ArtifactIcon id={a.id} className="h-7 w-7" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base" style={{ color: a.color }}>{a.name}</span>
                        <span className="rounded px-1.5 text-[10px] font-bold" style={{ background: a.color + '26', color: a.color }}>
                          {RARITY_NAME[a.rarity]}
                        </span>
                        {owned && <span className="text-[11px] font-bold text-[#7ae06a]">✔ 已拥有</span>}
                      </div>
                      <div className="text-xs text-[#c8d4ec] mt-0.5">{a.desc}</div>
                      <div className="text-[10px] text-[#8a9ac0] mt-0.5 truncate">
                        {a.detail.join(' · ')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onGrantArtifactDirectly(a.id)}
                    className="ms-btn shrink-0 cursor-pointer rounded-md px-3 py-1 text-xs"
                  >
                    获取法宝
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Window>
  );
}

export function VictoryOverlay({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(120,90,10,0.4), rgba(10,8,20,0.85))' }}>
      <div className="pop-in text-center">
        <CrownIcon className="bob-y mx-auto h-20 w-20 text-[#ffd94a]" />
        <div className="gold-shine mt-2 font-display text-6xl">镇压赤魇妖王！</div>
        <p className="mt-3 font-display text-xl text-[#ffe9b8]">云海诸峰重归清宁，你的道名传遍修真界</p>
        <p className="mt-1 text-sm font-bold text-[#c8a84a]">仙品机缘已掉落，快去拾取！仍可继续斩妖修炼</p>
        <button className="ms-btn mt-5 cursor-pointer px-10 py-3 text-2xl" onClick={onContinue}>
          继续修行
        </button>
      </div>
    </div>
  );
}

export function PanelRoot(props: {
  panel: PanelId;
  snap: Snapshot;
  onClose: () => void;
  onEquipSkill: (slot: number, skillId: string) => void;
  onSetBeadSkill: (skillId: string) => void;
  onLearnBook: (invIdx: number) => void;
  onEquip: (i: number) => void;
  onUnequip: (s: Slot) => void;
  onTravel: (id: string) => void;
  onLearnSkillDirectly: (skillId: string) => void;
  onLearnAllSkillsDirectly: () => void;
  onSpawnEnemyDirectly: (enemyId: string) => void;
  onClearEnemiesDirectly: () => void;
  onGrantArtifactDirectly: (artifactId: ArtifactId) => void;
}) {
  const { panel, snap } = props;
  if (panel === 'stats') return <StatsPanel snap={snap} onClose={props.onClose} />;
  if (panel === 'skills') return <SkillsPanel snap={snap} onClose={props.onClose} onEquipSkill={props.onEquipSkill} onSetBeadSkill={props.onSetBeadSkill} />;
  if (panel === 'inventory') return <InventoryPanel snap={snap} onClose={props.onClose} onEquip={props.onEquip} onUnequip={props.onUnequip} onLearnBook={props.onLearnBook} />;
  if (panel === 'map') return <WorldMapPanel snap={snap} onClose={props.onClose} onTravel={props.onTravel} />;
  if (panel === 'console') return (
    <ConsolePanel
      snap={snap}
      onClose={props.onClose}
      onLearnSkillDirectly={props.onLearnSkillDirectly}
      onLearnAllSkillsDirectly={props.onLearnAllSkillsDirectly}
      onSpawnEnemyDirectly={props.onSpawnEnemyDirectly}
      onClearEnemiesDirectly={props.onClearEnemiesDirectly}
      onGrantArtifactDirectly={props.onGrantArtifactDirectly}
    />
  );
  return null;
}
