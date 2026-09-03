import React, { useEffect, useRef, useState } from 'react';
import { View, Animated } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Text } from './Text';
import { GlossText } from './GlossText';
import { useColors, font, bandFor, space, springConfig, useReduceMotion } from '../theme';

/** polar point on the dial's arc. */
function pt(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const a = pt(cx, cy, r, from);
  const b = pt(cx, cy, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
}

/**
 * the score, as a 270° gauge rather than a full ring.
 *
 * a full ring has no start and no end, so 66 and 6 look equally "round". a
 * gauge has a floor and a ceiling in the shape itself, which is what a rating
 * out of 100 needs.
 *
 * the arc is a stroke, not a fill, so it takes its gloss as a gradient along
 * its own length — light at the start where it leaves the floor, deeper at the
 * head. the id is per-instance: on web react-native-svg renders into the one
 * document, and a shared id would paint every dial on screen the same band.
 *
 * `animate` sweeps it up from zero with the numeral counting alongside. this is
 * the app's one earned reveal: the score *is* the product, the first one is the
 * whole pitch, and a rating that is simply already drawn when the screen
 * arrives is a number handed over rather than a result arriving.
 *
 * it is off by default and it should stay off almost everywhere. the dial also
 * appears on progress and the share card, where it is a fact you came to check
 * rather than a result you are waiting for — a fact that re-animates every time
 * you glance at it is a toy. the caller decides, and the caller is responsible
 * for making sure a remount (a tab switch, a re-render) does not sweep it
 * again.
 */
export function ScoreDial({
  value,
  caption,
  size = 210,
  stroke = 16,
  animate = false,
}: {
  value: number;
  caption?: string;
  size?: number;
  stroke?: number;
  /** sweep up from zero on mount. see the note above before turning this on. */
  animate?: boolean;
}) {
  const c = useColors();
  const reduce = useReduceMotion();
  const band = bandFor(value);
  const gid = `dial-${React.useId().replace(/:/g, '')}`;
  const lit = shift(c.score[band], 0.18);
  const deep = shift(c.score[band], -0.13);
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const START = -135;
  const SWEEP = 270;

  // an svg arc's path data is a string, so there is nothing for the native
  // driver to interpolate — the sweep has to come back through js and redraw.
  // that is affordable here only because it is one dial, once, for 0.4s.
  const sweep = useRef(new Animated.Value(animate && !reduce ? 0 : 1)).current;
  const [shown, setShown] = useState(animate && !reduce ? 0 : value);

  useEffect(() => {
    if (!animate || reduce) {
      setShown(value);
      sweep.setValue(1);
      return;
    }
    const id = sweep.addListener(({ value: t }) => setShown(Math.round(t * value)));
    // the score is being revealed, not thrown: it must not overshoot past the
    // number and come back, because for a moment that is a different score.
    const a = Animated.spring(sweep, { ...springConfig('move'), toValue: 1, useNativeDriver: false });
    a.start();
    return () => {
      a.stop();
      sweep.removeListener(id);
    };
  }, [animate, reduce, value, sweep]);

  const end = START + SWEEP * (Math.max(0, Math.min(100, shown)) / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="0.7" y2="1">
            <Stop offset="0" stopColor={lit} />
            <Stop offset="0.5" stopColor={c.score[band]} />
            <Stop offset="1" stopColor={deep} />
          </LinearGradient>
        </Defs>
        <Path
          d={arc(cx, cy, r, START, START + SWEEP)}
          stroke={c.fill}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
        {shown > 0 && (
          <Path
            d={arc(cx, cy, r, START, end)}
            stroke={`url(#${gid})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
        )}
      </Svg>

      {/* the arc and the numeral are both the band colour; there is no word */}
      <GlossText
        color={c.score[band]}
        style={{ fontFamily: font.black, fontSize: size * 0.3, lineHeight: size * 0.32, letterSpacing: -2 }}
      >
        {String(shown)}
      </GlossText>

      {caption && (
        <Text variant="caption" tone="tertiary" style={{ position: 'absolute', bottom: 0 }}>
          {caption}
        </Text>
      )}
    </View>
  );
}

/** mix a hex toward white (t > 0) or black (t < 0). */
function shift(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const to = t > 0 ? 255 : 0;
  const a = Math.abs(t);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.min(255, Math.round(v + (to - v) * a))),
  );
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
