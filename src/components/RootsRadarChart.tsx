import type { SpiritualRoots } from '../game/types';
import { ELEMENT_NAMES, ELEMENT_COLORS, ELEMENT_ICONS, PENTAGON_ELEMENTS, evaluateRootQuality } from '../config/roots';

interface Props {
  roots: SpiritualRoots;
  /** 尺寸宽度（px），默认 260 */
  size?: number;
  /** 是否展示资质评语 */
  showEvaluation?: boolean;
  /** 自定义外层样式 */
  className?: string;
}

export default function RootsRadarChart({
  roots,
  size = 280,
  showEvaluation = true,
  className = '',
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  // 最大半径（留出外围文字标签的区域）
  const maxR = size * 0.34;

  // 五边形顶点角度：从正上方 (-π/2) 开始，顺时针每隔 72° (2π/5) 一个顶点
  const angles = PENTAGON_ELEMENTS.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5);

  // 计算多层正五边形背景网格的顶点路径
  const makePentagonPath = (scale: number) => {
    const r = maxR * scale;
    return angles
      .map((a, i) => {
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ') + ' Z';
  };

  // 基准最大刻度（初始总和 50，单项最高 50；若装备加成使得单项超出 50，则动态扩展基准）
  const maxVal = Math.max(50, ...PENTAGON_ELEMENTS.map((e) => roots[e]));

  // 计算数据多边形的各顶点坐标
  const dataPoints = PENTAGON_ELEMENTS.map((elem, i) => {
    const val = roots[elem] ?? 0;
    const ratio = Math.max(0, Math.min(1.2, val / maxVal));
    const r = maxR * ratio;
    const a = angles[i];
    return {
      elem,
      val,
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r,
      angle: a,
    };
  });

  const dataPolygonPath = dataPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ') + ' Z';

  // 评价
  const evalInfo = evaluateRootQuality(roots);
  const total = Object.values(roots).reduce((a, b) => a + b, 0);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {showEvaluation && (
        <div className="mb-1 flex items-center gap-2">
          <span
            className="font-display text-sm tracking-wide"
            style={{ color: evalInfo.color }}
          >
            {evalInfo.title}
          </span>
          <span className="rounded bg-[#0c1228] px-1.5 py-0.5 font-display text-[10px] text-[#ffd94a] border border-[#3d5590]">
            灵根总和: {total}
          </span>
        </div>
      )}

      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          <defs>
            {/* 中心聚灵柔光 */}
            <radialGradient id="radarCenterGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd97a" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#7adfff" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#0a0f22" stopOpacity="0" />
            </radialGradient>
            {/* 五行灵根填充渐变 */}
            <radialGradient id="rootsFillGrad" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
              <stop offset="40%" stopColor="#ffd97a" stopOpacity="0.45" />
              <stop offset="80%" stopColor="#7adfff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#7ae06a" stopOpacity="0.15" />
            </radialGradient>
          </defs>

          {/* 中心发光底色 */}
          <circle cx={cx} cy={cy} r={maxR * 1.05} fill="url(#radarCenterGlow)" />

          {/* 四层背景正五边形刻度线 (25%, 50%, 75%, 100%) */}
          {[0.25, 0.5, 0.75, 1.0].map((scale, i) => (
            <path
              key={scale}
              d={makePentagonPath(scale)}
              fill={i === 3 ? 'rgba(19,28,56,0.5)' : 'none'}
              stroke={scale === 1.0 ? 'rgba(90,120,180,0.55)' : 'rgba(61,85,144,0.3)'}
              strokeWidth={scale === 1.0 ? 1.5 : 1}
              strokeDasharray={scale === 1.0 ? undefined : '2 3'}
            />
          ))}

          {/* 从中心向 5 个顶点的轴线 */}
          {angles.map((a, i) => {
            const elem = PENTAGON_ELEMENTS[i];
            const endX = cx + Math.cos(a) * maxR;
            const endY = cy + Math.sin(a) * maxR;
            return (
              <line
                key={elem}
                x1={cx}
                y1={cy}
                x2={endX}
                y2={endY}
                stroke="rgba(90,120,180,0.4)"
                strokeWidth={1.2}
              />
            );
          })}

          {/* 数据多边形填充面 */}
          <path
            d={dataPolygonPath}
            fill="url(#rootsFillGrad)"
            stroke="#ffd97a"
            strokeWidth={2.4}
            strokeLinejoin="round"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(255,217,122,0.65))',
            }}
          />

          {/* 各灵根数据点高光圆点 */}
          {dataPoints.map((p) => {
            const color = ELEMENT_COLORS[p.elem];
            return (
              <g key={p.elem}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={4.5}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth={1.6}
                  style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                />
                <circle cx={p.x} cy={p.y} r={1.8} fill="#ffffff" />
              </g>
            );
          })}
        </svg>

        {/* 外围五角文字标签 */}
        {angles.map((a, i) => {
          const elem = PENTAGON_ELEMENTS[i];
          const val = roots[elem] ?? 0;
          const color = ELEMENT_COLORS[elem];
          const name = ELEMENT_NAMES[elem];
          const icon = ELEMENT_ICONS[elem];
          const bonusPct = (val * 0.5).toFixed(1);

          // 标签位置在五边形外围一圈
          const labelDist = maxR + 32;
          const lx = cx + Math.cos(a) * labelDist;
          const ly = cy + Math.sin(a) * labelDist;

          return (
            <div
              key={elem}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
              style={{ left: lx, top: ly }}
            >
              <div
                className="flex items-center gap-0.5 rounded px-1.5 py-0.5 font-display text-xs shadow"
                style={{
                  color,
                  background: 'rgba(12,18,40,0.92)',
                  border: `1px solid ${color}66`,
                  boxShadow: `0 0 8px ${color}33`,
                }}
              >
                <span>{icon}</span>
                <span>{name}</span>
                <span className="text-white ml-0.5 font-bold">{val}</span>
              </div>
              <span className="text-[9px] font-bold text-[#7ae06a] mt-0.5 leading-none" style={{ textShadow: '0 1px 2px #000' }}>
                +{bonusPct}%
              </span>
            </div>
          );
        })}
      </div>

      {showEvaluation && (
        <p className="mt-1 text-center text-[11px] font-bold text-[#a8b8d8]">
          {evalInfo.desc}
        </p>
      )}
    </div>
  );
}
