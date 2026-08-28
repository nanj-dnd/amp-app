import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Circle, Ellipse } from 'react-native-svg';
import { METALS, type MetalId } from '../theme';

/**
 * metal surfaces.
 *
 * every metal on the platform is drawn here, so there is exactly one light
 * source in the product: a diagonal body gradient lit from the top left, and a
 * specular ellipse sitting in the same corner. get that wrong per-component
 * and a screen of badges looks like a screen of stickers.
 *
 * these are svg rather than css gradients because react native has no gradient
 * of its own, and svg is already a dependency for the mark and the score card.
 *
 * every gradient id is per-instance. on web react-native-svg renders into the
 * one document, where `url(#body)` resolves against the *whole page* rather
 * than the <svg> it was written in — so a shared id silently paints every
 * metal on screen in whichever one mounted first. a wall of bronze, silver and
 * gold badges came out uniformly green exactly once.
 *
 * the shine is deliberately restrained. the first pass ran the speculars at
 * 0.4–0.5 alpha and derived the sheen stops a third of the way to white, which
 * read as wet plastic rather than metal — a highlight that competes with the
 * number printed on it is a bevel from 2008.
 *
 * and the sheen is a fixed *depth*, not a percentage of the surface. a real
 * specular is roughly a fixed angular size, so the bigger the object the less
 * of it the highlight covers. running it at 46% of the height made a chip look
 * lit and a full-width card look like it had been dipped in varnish: the same
 * ratio is a 14px band on a button and a 70px wash on a card. so the fills
 * measure themselves and cap the band in points, fading it further as the
 * surface grows.
 */

/** the specular band: a fixed depth, capped, and weaker on large surfaces. */
function sheenFor(height: number | null) {
  if (height === null) return { depth: '46%' as const, alpha: 0.2 };
  const depth = Math.min(height * 0.46, 22);
  // a big plate catches less of the light per unit area, not more
  const alpha = height > 90 ? 0.11 : height > 52 ? 0.15 : 0.2;
  return { depth, alpha };
}

/** blend two hexes; t = 0 is `a`, t = 1 is `b`. */
function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = [16, 8, 0].map((sh) => {
    const va = (pa >> sh) & 255;
    const vb = (pb >> sh) & 255;
    return Math.round(va + (vb - va) * t);
  });
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * the body's range, compressed as the surface grows.
 *
 * the sheen was only half the problem. the body runs hi → base → deep, and on
 * a chip that spread is a lit edge, while on a full-width card the same spread
 * is a bright corner and a dark one — the surface stops reading as one piece of
 * metal and starts reading as a gradient someone applied to a box. so a big
 * plate pulls both ends toward its base and keeps the fall gentle.
 */
function bodyFor(m: { hi: string; base: string; deep: string }, height: number | null) {
  if (height === null || height <= 52) return { top: m.hi, bottom: m.deep };
  if (height <= 90) return { top: mix(m.hi, m.base, 0.28), bottom: m.deep };
  return { top: mix(m.hi, m.base, 0.52), bottom: mix(m.deep, m.base, 0.26) };
}

type Props = { metal: MetalId; children?: React.ReactNode; style?: ViewStyle };

/** react's useId returns ':r1:', which is not a legal svg fragment id. */
const useGradientIds = () => {
  const raw = React.useId().replace(/:/g, '');
  return { body: `body-${raw}`, spec: `spec-${raw}`, sheen: `sheen-${raw}` };
};

/** the disc a badge sits on. */
export function MetalCircle({ size, metal, children, style }: Props & { size: number }) {
  const m = METALS[metal];
  const id = useGradientIds();
  const r = size / 2;
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id.body} x1="0.18" y1="0" x2="0.82" y2="1">
            <Stop offset="0" stopColor={m.hi} />
            <Stop offset="0.52" stopColor={m.base} />
            <Stop offset="1" stopColor={m.deep} />
          </LinearGradient>
          <RadialGradient id={id.spec} cx="0.5" cy="0" r="0.72">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.3} />
            <Stop offset="0.72" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r} fill={`url(#${id.body})`} />
        {/* the specular: an ellipse in the lit corner, clipped by the disc */}
        <Ellipse cx={r * 0.94} cy={r * 0.46} rx={r * 0.66} ry={r * 0.42} fill={`url(#${id.spec})`} />
      </Svg>
      {children}
    </View>
  );
}

/** the meters, rules and progress fills. */
export function MetalBar({
  metal,
  height,
  radius,
  style,
}: {
  metal: MetalId;
  height: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const m = METALS[metal];
  const id = useGradientIds();
  const rr = radius ?? height / 2;
  return (
    <View style={[{ height, borderRadius: rr, overflow: 'hidden' }, style]}>
      <Svg width="100%" height={height}>
        <Defs>
          <LinearGradient id={id.body} x1="0" y1="0" x2="0.35" y2="1">
            <Stop offset="0" stopColor={m.hi} />
            <Stop offset="0.5" stopColor={m.base} />
            <Stop offset="1" stopColor={m.deep} />
          </LinearGradient>
          <LinearGradient id={id.sheen} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.24} />
            <Stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height={height} rx={rr} fill={`url(#${id.body})`} />
        {/* a thin lit lip along the top edge — what makes a bar read as rolled
            metal rather than a coloured rectangle */}
        <Rect x={0} y={0} width="100%" height={height * 0.55} rx={rr} fill={`url(#${id.sheen})`} />
      </Svg>
    </View>
  );
}

/** the tier and age chips on the score card, and anything else pill-shaped. */
export function MetalPill({ metal, children, style }: Props) {
  const m = METALS[metal];
  const id = useGradientIds();
  return (
    <View style={[{ borderRadius: 999, overflow: 'hidden' }, style]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id.body} x1="0.15" y1="0" x2="0.85" y2="1">
            <Stop offset="0" stopColor={m.hi} />
            <Stop offset="0.52" stopColor={m.base} />
            <Stop offset="1" stopColor={m.deep} />
          </LinearGradient>
          <LinearGradient id={id.sheen} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
            <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" rx={999} fill={`url(#${id.body})`} />
        <Rect x={0} y={0} width="100%" height="52%" rx={999} fill={`url(#${id.sheen})`} />
      </Svg>
      {children}
    </View>
  );
}

/* ------------------------------------------------------------- sheen */

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

/** mix a hex toward white (t > 0) or black (t < 0). */
function shift(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const to = t > 0 ? 255 : 0;
  const a = Math.abs(t);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => clamp(v + (to - v) * a));
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * a metal struck from an arbitrary colour.
 *
 * the score bands (poor/fair/good/elite) are semantic and can't be swapped for
 * one of the five metals without lying about what they mean — a "poor" band is
 * not bronze. so they keep their own hue and get the same light: a lighter
 * stop, the colour, a darker stop, and the lit lip along the top.
 */
export function SheenBar({
  color,
  height,
  radius,
  style,
}: {
  color: string;
  height: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const id = useGradientIds();
  const rr = radius ?? height / 2;
  return (
    <View style={[{ height, borderRadius: rr, overflow: 'hidden' }, style]}>
      <Svg width="100%" height={height}>
        <Defs>
          <LinearGradient id={id.body} x1="0" y1="0" x2="0.3" y2="1">
            <Stop offset="0" stopColor={shift(color, 0.2)} />
            <Stop offset="0.5" stopColor={color} />
            <Stop offset="1" stopColor={shift(color, -0.15)} />
          </LinearGradient>
          <LinearGradient id={id.sheen} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
            <Stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height={height} rx={rr} fill={`url(#${id.body})`} />
        <Rect x={0} y={0} width="100%" height={height * 0.55} rx={rr} fill={`url(#${id.sheen})`} />
      </Svg>
    </View>
  );
}

/** rgba from a hex, for laying ink over a metal at partial strength. */
export function withAlpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/**
 * a whole surface struck in metal — the score card's plate.
 *
 * it carries a scrim as well as a specular: the lit corner is bright enough
 * that type sitting in it would float, and the bottom of a plate this size
 * needs seating or the footer looks like it is falling off. both are part of
 * the metal, not decoration on top of it.
 */
export function MetalGround({
  metal,
  width,
  height,
  radius,
}: {
  metal: MetalId;
  width: number;
  height: number;
  radius: number;
}) {
  const m = METALS[metal];
  const id = useGradientIds();
  const scrim = `scrim-${id.body}`;
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={id.body} x1="0.1" y1="0" x2="0.9" y2="1">
          <Stop offset="0" stopColor={m.hi} />
          <Stop offset="0.46" stopColor={m.base} />
          <Stop offset="1" stopColor={m.deep} />
        </LinearGradient>
        <RadialGradient id={id.spec} cx="0.28" cy="0.06" r="0.8">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
          <Stop offset="0.7" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={scrim} x1="0" y1="0.45" x2="0" y2="1">
          <Stop offset="0" stopColor={m.deep} stopOpacity={0} />
          <Stop offset="1" stopColor={m.deep} stopOpacity={0.3} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} rx={radius} fill={`url(#${id.body})`} />
      <Rect x={0} y={0} width={width} height={height} rx={radius} fill={`url(#${scrim})`} />
      <Ellipse cx={width * 0.3} cy={height * 0.04} rx={width * 0.62} ry={height * 0.3} fill={`url(#${id.spec})`} />
    </Svg>
  );
}

/**
 * fills whatever box it is dropped into with a metal. the parent owns the
 * shape — set its borderRadius and overflow:'hidden' and this takes the rest.
 *
 * this is how a flat coloured box becomes a lit one without every caller
 * re-deriving a gradient: a primary button, the tab bar's record disc, the
 * goal card on the road. put it first in the parent and let the content sit
 * on top of it.
 */
export function MetalFill({ metal }: { metal: MetalId }) {
  const m = METALS[metal];
  const id = useGradientIds();
  const [h, setH] = React.useState<number | null>(null);
  const sheen = sheenFor(h);
  const body = bodyFor(m, h);
  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setH(e.nativeEvent.layout.height)} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id.body} x1="0.12" y1="0" x2="0.88" y2="1">
            <Stop offset="0" stopColor={body.top} />
            <Stop offset="0.5" stopColor={m.base} />
            <Stop offset="1" stopColor={body.bottom} />
          </LinearGradient>
          <LinearGradient id={id.sheen} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={sheen.alpha} />
            <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id.body})`} />
        <Rect x={0} y={0} width="100%" height={sheen.depth} fill={`url(#${id.sheen})`} />
      </Svg>
    </View>
  );
}

/**
 * the same, struck from an arbitrary colour rather than one of the five.
 *
 * for the boxes whose colour carries a meaning a metal can't stand in for —
 * a score band, a league, a risk level. they keep their hue and borrow the
 * light.
 */
export function SheenFill({ color }: { color: string }) {
  const id = useGradientIds();
  const [h, setH] = React.useState<number | null>(null);
  const sheen = sheenFor(h);
  // same compression as the metals, derived from the one colour
  const wide = h !== null && h > 90;
  const near = h !== null && h > 52;
  const top = shift(color, wide ? 0.09 : near ? 0.13 : 0.18);
  const bottom = shift(color, wide ? -0.07 : -0.14);
  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setH(e.nativeEvent.layout.height)} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id.body} x1="0.12" y1="0" x2="0.88" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="0.5" stopColor={color} />
            <Stop offset="1" stopColor={bottom} />
          </LinearGradient>
          <LinearGradient id={id.sheen} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={sheen.alpha} />
            <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id.body})`} />
        <Rect x={0} y={0} width="100%" height={sheen.depth} fill={`url(#${id.sheen})`} />
      </Svg>
    </View>
  );
}
