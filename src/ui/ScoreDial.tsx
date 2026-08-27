import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Text } from './Text';
import { useColors, font, bandFor, bandLabel, space } from '../theme';

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
 */
export function ScoreDial({
  value,
  caption,
  size = 210,
  stroke = 16,
}: {
  value: number;
  caption?: string;
  size?: number;
  stroke?: number;
}) {
  const c = useColors();
  const band = bandFor(value);
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const START = -135;
  const SWEEP = 270;
  const end = START + SWEEP * (Math.max(0, Math.min(100, value)) / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Path
          d={arc(cx, cy, r, START, START + SWEEP)}
          stroke={c.fill}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
        {value > 0 && (
          <Path
            d={arc(cx, cy, r, START, end)}
            stroke={c.score[band]}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
        )}
      </Svg>

      <View style={{ alignItems: 'center' }}>
        {/* the numeral's line box is taller than its glyphs, so the band label
            needs an explicit line height rather than sitting in the overhang */}
        <Text
          style={{
            fontFamily: font.black,
            fontSize: size * 0.28,
            lineHeight: size * 0.3,
            letterSpacing: -2,
            color: c.text,
          }}
        >
          {String(value)}
        </Text>
        <Text variant="eyebrow" color={c.score[band]} style={{ marginTop: 2 }}>
          {bandLabel[band]}
        </Text>
      </View>

      {caption && (
        <Text variant="caption" tone="tertiary" style={{ position: 'absolute', bottom: 0 }}>
          {caption}
        </Text>
      )}
    </View>
  );
}
