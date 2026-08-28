import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColors, bandFor, radius, space, type } from '../theme';
import { Text } from './Text';

/**
 * the score reads as one object: number in ink, band as a tinted pill.
 * the old design coloured the number itself, which made every screen look
 * like it was permanently mid-warning.
 */
/**
 * the score, coloured by band. there is no word for the band any more —
 * "fair" under a 66 was the number said twice, and the colour already carries
 * it everywhere else on the screen.
 */
export function ScoreBadge({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const c = useColors();
  return (
    <Text variant={size === 'sm' ? 'scoreSm' : 'score'} color={c.score[bandFor(value)]}>
      {String(value)}
    </Text>
  );
}

/** a bare dot in the band colour, where a marker is needed without a number. */
export function BandDot({ band, size = 8 }: { band: ReturnType<typeof bandFor>; size?: number }) {
  const c = useColors();
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.score[band] }} />;
}

/** hero ring for progress + profile. stroke colour follows the band. */
export function ScoreRing({
  value,
  size = 132,
  stroke = 10,
  caption,
}: {
  value: number;
  size?: number;
  stroke?: number;
  caption?: string;
}) {
  const c = useColors();
  const band = bandFor(value);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.fill} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={c.score[band]}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circ * pct} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={{ ...type.score, fontSize: size * 0.34, lineHeight: size * 0.36, color: c.score[band] }}>
        {String(value)}
      </Text>
      {caption && (
        <Text variant="caption" tone="secondary" style={{ marginTop: 2 }}>
          {caption}
        </Text>
      )}
    </View>
  );
}

/** kpi row bar. track + fill + optional delta. */
export function Bar({ value, band }: { value: number; band?: ReturnType<typeof bandFor> }) {
  const c = useColors();
  const b = band ?? bandFor(value);
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: c.fill, overflow: 'hidden' }}>
      <View
        style={{
          height: '100%',
          width: `${Math.max(0, Math.min(100, value))}%`,
          borderRadius: 3,
          backgroundColor: c.score[b],
        }}
      />
    </View>
  );
}

export function Delta({ value }: { value: number | null }) {
  const c = useColors();
  if (value === null) return <Text variant="caption" tone="tertiary">—</Text>;
  const up = value > 0;
  const flat = value === 0;
  return (
    <Text variant="caption" color={flat ? c.textTertiary : up ? c.score.good : c.danger}>
      {`${up ? '+' : ''}${value.toFixed(1)}`}
    </Text>
  );
}
