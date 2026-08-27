import React from 'react';
import Svg, { Path, Circle, G, Rect } from 'react-native-svg';
import { useColors } from '../theme';

type P = { size?: number; color?: string };

/**
 * cricket glyphs.
 *
 * drawn as solid silhouettes with deliberately fat strokes, because these are
 * used at 17–22px next to text where a thin outline reads as a pen. ionicons
 * only ships a baseball and a tennis ball, which are the same round object.
 *
 * TO SWAP IN A LICENSED PACK: this file is the only place these are defined.
 * add `react-native-svg-transformer`, drop the pack's svgs in assets/icons, and
 * re-export them from here — nothing else in the app imports the shapes.
 */

/** cricket bat: fat blade, clear shoulder, stubby handle. */
export function BatIcon({ size = 24, color }: P) {
  const c = useColors();
  const f = color ?? c.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill={f}>
        {/* handle — thick enough to survive at 16px */}
        <Rect x={14.6} y={0.9} width={3.8} height={7.4} rx={1.9} transform="rotate(45 16.5 4.6)" />
        {/* blade — broad, with a flat toe so the silhouette reads as a bat */}
        <Path d="M14.2 6.4 L17.9 10.1 L10.6 19.4 a3 3 0 0 1 -4.4 .3 l-1 -1 a3 3 0 0 1 .3 -4.4 Z" />
      </G>
    </Svg>
  );
}

/** cricket ball: solid sphere, seam cut through it with stitch ticks. */
export function BallIcon({ size = 24, color }: P) {
  const c = useColors();
  const f = color ?? c.text;
  const cut = c.surface;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9.4} fill={f} />
      <Path d="M7.6 3.6 C 11.2 7.9, 11.2 16.1, 7.6 20.4" stroke={cut} strokeWidth={2} fill="none" strokeLinecap="round" />
      <G stroke={cut} strokeWidth={1.5} strokeLinecap="round">
        <Path d="M10.2 6.1 L12.1 5.2" />
        <Path d="M11 9.4 L13 8.8" />
        <Path d="M11.2 13.1 L13.2 13.6" />
        <Path d="M10.4 16.6 L12.3 17.6" />
      </G>
    </Svg>
  );
}

/** both disciplines — bat with a ball at the toe. */
export function AllRounderIcon({ size = 24, color }: P) {
  const c = useColors();
  const f = color ?? c.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill={f}>
        <Rect x={16.1} y={0.7} width={3.2} height={6} rx={1.6} transform="rotate(45 17.7 3.7)" />
        <Path d="M15.3 5 L18.4 8.1 L12.4 16 a2.5 2.5 0 0 1 -3.7 .3 l-.7 -.7 a2.5 2.5 0 0 1 .3 -3.7 Z" />
        <Circle cx={6} cy={18} r={4.6} />
      </G>
      <Path d="M3.7 14.4 C 5.9 16.4, 5.9 19.6, 3.7 21.6" stroke={c.surface} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/** stumps — used for anything to do with a dismissal or a match. */
export function StumpsIcon({ size = 24, color }: P) {
  const c = useColors();
  const f = color ?? c.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill={f}>
        <Rect x={4.4} y={6.4} width={2.9} height={15.2} rx={1.45} />
        <Rect x={10.55} y={6.4} width={2.9} height={15.2} rx={1.45} />
        <Rect x={16.7} y={6.4} width={2.9} height={15.2} rx={1.45} />
        {/* bails */}
        <Rect x={4} y={3.6} width={7.6} height={2.2} rx={1.1} />
        <Rect x={12.4} y={3.6} width={7.6} height={2.2} rx={1.1} />
      </G>
    </Svg>
  );
}

/** the road glyph — the mark reduced to a tab-bar icon. */
export function RoadIcon({ size = 24, color }: P) {
  const c = useColors();
  const f = color ?? c.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill={f}>
        <Path d="M11 2.6 L3 19.4 a.8 .8 0 0 0 1.1 1.1 L11 17.6 Z" />
        <Path d="M13 2.6 L21 19.4 a.8 .8 0 0 1 -1.1 1.1 L13 17.6 Z" />
      </G>
    </Svg>
  );
}
