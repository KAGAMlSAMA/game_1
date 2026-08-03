import type { Appearance, Gender } from '../game/types';

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  外貌配置 · APPEARANCE                                     ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  外貌由「性别 + 脸型 + 发型 + 服装」组合而成，渲染实现见   ║
 * ║  render.ts 的 drawChibi。数组顺序即选择器里的顺序。        ║
 * ║  · FACES  肤色/脸型（含面部气质）                          ║
 * ║  · HAIRS  发型（发色 + 造型 id）                           ║
 * ║  · OUTFITS 服装（道袍配色）                                ║
 * ║  想加新样式：往对应数组追加一项，并在 render.ts 里补画法。  ║
 * ╚══════════════════════════════════════════════════════════╝
 */

export interface FaceOpt { name: string; skin: string; }
export interface HairOpt { name: string; color: string; style: number; }
export interface OutfitOpt { name: string; robe: string; robeDark: string; trim: string; }

export const FACES: FaceOpt[] = [
  { name: '白皙', skin: '#ffe3c4' },
  { name: '红润', skin: '#f6cea2' },
  { name: '古铜', skin: '#e3b183' },
  { name: '冷玉', skin: '#f3e6da' },
];

export const HAIRS: HairOpt[] = [
  { name: '道髻', color: '#2b2b33', style: 0 },
  { name: '高束发', color: '#3a2b1c', style: 1 },
  { name: '披肩长发', color: '#26242e', style: 2 },
  { name: '霜白飘发', color: '#e6ecf5', style: 3 },
  { name: '朱砂马尾', color: '#7d2b2b', style: 4 },
];

export const OUTFITS: OutfitOpt[] = [
  { name: '青竹道袍', robe: '#3f8f6f', robeDark: '#2c6650', trim: '#ffe6a8' },
  { name: '玄墨法衣', robe: '#3a3f5c', robeDark: '#262a40', trim: '#a7b6ff' },
  { name: '朱霞仙裳', robe: '#c0503e', robeDark: '#8f382b', trim: '#ffd97a' },
  { name: '素白鹤氅', robe: '#dfe6ee', robeDark: '#b4c0cf', trim: '#8fd0ff' },
  { name: '紫电罡衣', robe: '#6b4fae', robeDark: '#4a3480', trim: '#ffd0ff' },
];

export const GENDERS: { id: Gender; name: string }[] = [
  { id: 'male', name: '男' },
  { id: 'female', name: '女' },
];

export function defaultAppearance(classId: 'warrior' | 'mage'): Appearance {
  return {
    gender: 'male',
    face: 0,
    hair: classId === 'warrior' ? 1 : 0,
    outfit: classId === 'warrior' ? 2 : 1,
  };
}

export function randomAppearance(): Appearance {
  const ri = (n: number) => Math.floor(Math.random() * n);
  return {
    gender: Math.random() < 0.5 ? 'male' : 'female',
    face: ri(FACES.length),
    hair: ri(HAIRS.length),
    outfit: ri(OUTFITS.length),
  };
}
