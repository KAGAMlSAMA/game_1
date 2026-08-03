import type { ElementType, SpiritualRoots } from '../game/types';

export const ELEMENT_NAMES: Record<ElementType, string> = {
  metal: '金灵根',
  wood: '木灵根',
  water: '水灵根',
  fire: '火灵根',
  earth: '土灵根',
};

export const ELEMENT_COLORS: Record<ElementType, string> = {
  metal: '#ffd97a', // 金光黄
  wood: '#7ae06a',  // 青木绿
  water: '#7adfff', // 碧水蓝
  fire: '#ff6a4a',  // 赤火红
  earth: '#d9a86a', // 戊土褐
};

export const ELEMENT_ICONS: Record<ElementType, string> = {
  metal: '⚔',
  wood: '🌿',
  water: '💧',
  fire: '🔥',
  earth: '⛰',
};

/** 五行在五边形雷达图中的几何排列顺序（顺时针：金 -> 水 -> 木 -> 火 -> 土） */
export const PENTAGON_ELEMENTS: ElementType[] = ['metal', 'water', 'wood', 'fire', 'earth'];

/**
 * 随机生成初始五行灵根点数：
 * 规则：五项灵根数值均 >= 0，总和严格固定为 50。
 * 算法：通过在 [0, 50] 之间随机生成 4 个切割点并排序，取相邻差值作为 5 项数值。
 */
export function generateSpiritualRoots(): SpiritualRoots {
  // 生成 4 个介于 0 到 50 之间的随机整数切分点
  const cuts = [
    Math.floor(Math.random() * 51),
    Math.floor(Math.random() * 51),
    Math.floor(Math.random() * 51),
    Math.floor(Math.random() * 51),
  ].sort((a, b) => a - b);

  const vals = [
    cuts[0],
    cuts[1] - cuts[0],
    cuts[2] - cuts[1],
    cuts[3] - cuts[2],
    50 - cuts[3],
  ];

  return {
    metal: vals[0],
    water: vals[1],
    wood: vals[2],
    fire: vals[3],
    earth: vals[4],
  };
}

/** 评定灵根资质类型（纯天灵根、双灵根、三灵根、五行杂灵根） */
export function evaluateRootQuality(roots: SpiritualRoots): { title: string; desc: string; color: string } {
  const entries: [ElementType, number][] = [
    ['metal', roots.metal],
    ['water', roots.water],
    ['wood', roots.wood],
    ['fire', roots.fire],
    ['earth', roots.earth],
  ];
  // 找出有明显资质的项（> 3 点）
  const active = entries.filter(([, v]) => v >= 4).sort((a, b) => b[1] - a[1]);
  const max = active[0] ? active[0][1] : 0;
  const maxElem = active[0] ? ELEMENT_NAMES[active[0][0]] : '无';

  if (max >= 38) {
    return {
      title: `极品${maxElem}天灵根`,
      desc: `独厚一系，万法易通（${maxElem.slice(0, 1)}法诀威力极大增幅）`,
      color: '#ffd97a',
    };
  }
  if (active.length <= 2 && max >= 22) {
    const names = active.map(([k]) => ELEMENT_NAMES[k].slice(0, 1)).join('');
    return {
      title: `${names}二系真灵根`,
      desc: '二气相生，根基扎实，修行顺畅',
      color: '#7adfff',
    };
  }
  if (active.length <= 3) {
    const names = active.map(([k]) => ELEMENT_NAMES[k].slice(0, 1)).join('');
    return {
      title: `${names}三系灵根`,
      desc: '气蕴三才，兼修数法，进境平稳',
      color: '#c9a4ff',
    };
  }
  return {
    title: '五行俱全杂灵根',
    desc: '五气兼备，虽无独厚之偏，却可兼修天下万法',
    color: '#8fd8b0',
  };
}
