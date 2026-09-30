/**
 * Cubby art components. Everything is an SVG string from ./svgs (auto-generated from assets/svg),
 * rendered with react-native-svg's <SvgXml>.
 *
 * Usage:
 *   <Cubby level={3} height={80} />
 *   <CubbyForScore score={82} height={80} />
 *   <Sticker name="clean_sweep" height={64} />
 *   <Icon name="home" size={22} color={palette.text} />
 *
 * PIXEL-ART RULE: stickers are drawn on a pixel grid. Never blur, smooth or rotate them by non-design amounts.
 * Prefer heights that are an integer multiple of the natural height (see `naturalSize`) so pixels stay crisp.
 */
import React from 'react';
import { SvgXml } from 'react-native-svg';
import { mascot, stickers, icons, brand, chart, misc, type StickerName, type IconName, type ChartRange } from './svgs';
import { levelForScore } from '../theme/tokens';

export function naturalSize(xml: string): { w: number; h: number } {
  const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(xml);
  return m ? { w: parseFloat(m[1]), h: parseFloat(m[2]) } : { w: 24, h: 24 };
}

type SizeProps = { height?: number; width?: number };

function Sized({ xml, height, width, color }: SizeProps & { xml: string; color?: string }) {
  const n = naturalSize(xml);
  const h = height ?? (width ? (width * n.h) / n.w : n.h);
  const w = width ?? (h * n.w) / n.h;
  return <SvgXml xml={xml} width={w} height={h} color={color} />;
}

/** The mascot: a voxel vault. Level 1 <60, 2: 60-79, 3: 80-89, 4: 90+ (level 4 wears a gold crown). */
export function Cubby({ level, ...size }: SizeProps & { level: 1 | 2 | 3 | 4 }) {
  return <Sized xml={mascot[level]} {...size} />;
}

export function CubbyForScore({ score, ...size }: SizeProps & { score: number }) {
  return <Cubby level={levelForScore(score)} {...size} />;
}

/** Earned stickers. Names: hello, clean_sweep, backed_up, steady, one_year, explorer, first_yield. */
export function Sticker({ name, ...size }: SizeProps & { name: StickerName }) {
  return <Sized xml={stickers[name]} {...size} />;
}

/** 24px stroke icons; colour comes from `color` (currentColor). `play` is a filled glyph. */
export function Icon({ name, size = 24, color }: { name: IconName; size?: number; color?: string }) {
  return <SvgXml xml={icons[name]} width={size} height={size} color={color} />;
}

/** The cube logo. `mono` uses currentColor for the lime top face. */
export function CubbyMark({ size = 26, mono = false, color }: { size?: number; mono?: boolean; color?: string }) {
  return <SvgXml xml={mono ? brand.cubby_mark_currentcolor : brand.cubby_mark} width={size} height={size} color={color} />;
}

/** Static reference shape of the Home net-worth chart. In the real app build the path from price data (see docs/ANIMATIONS.md). */
export function ChartShape({ range = '1W', ...size }: SizeProps & { range?: ChartRange }) {
  return <Sized xml={chart[range]} {...size} />;
}

export function UniverseCardArt(size: SizeProps) {
  return <Sized xml={misc.universe_card_art} {...size} />;
}

export const stickerMeta: Record<StickerName, { title: string; how: string }> = {
  hello: { title: 'Hello', how: 'Connect a first wallet' },
  clean_sweep: { title: 'Clean sweep', how: 'Revoke a risky approval' },
  backed_up: { title: 'Backed up', how: 'Confirm a seed backup' },
  steady: { title: 'Steady', how: '12 weekly check-ins' },
  one_year: { title: 'One year', how: 'A year on-chain' },
  explorer: { title: 'Explorer', how: 'Assets on 5 chains' },
  first_yield: { title: 'First yield', how: 'First DeFi position' },
};
