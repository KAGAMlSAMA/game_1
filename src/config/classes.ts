import type { ClassId } from '../game/types';

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  职业配置表 · CLASS_INFO                                   ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  展示用信息 + 初始属性（见 engine.ts makePlayer）。         ║
 * ║  hp/atk/range/diff 仅为开始界面的评级条（1~5 格）。        ║
 * ╚══════════════════════════════════════════════════════════╝
 */
export const CLASS_INFO: Record<
  ClassId,
  { name: string; title: string; desc: string; hp: number; atk: number; range: number; diff: number }
> = {
  warrior: {
    name: '散修',
    title: '万法可修 · 持剑入道',
    desc: '无门无派的散修。初入修真界只得一柄凡剑与近身劈砍之技，日后剑法、符术、身法、御空皆可凭技能书参悟，全无门户之限。',
    hp: 4,
    atk: 4,
    range: 3,
    diff: 2,
  },
  // 保留字段以兼容旧类型，实际不再作为可选职业
  mage: {
    name: '散修',
    title: '万法可修 · 持剑入道',
    desc: '无门无派的散修。',
    hp: 4,
    atk: 4,
    range: 3,
    diff: 2,
  },
};
