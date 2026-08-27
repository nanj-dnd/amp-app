import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColors, bandFor, bandLabel, radius, space, type } from '../theme';
import { Text } from './Text';

/**
 * the score reads as one object: number in ink, band as a tinted pill.
 * the old design coloured the number itself, which made every screen look
 * like it was permanently mid-warning.
 */
export function ScoreBadge({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const c = useColors();
  const band = bandFor(value);
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <Text variant={size === 'sm' ? 'scoreSm' : 'score'}>{String(value)}</Text>
      <BandPill band={band} />
    </View>
  );
}

export function BandPill({ band }: { band: ReturnType<typeof bandFor> }) {
  const c = useColors();
  const tone = c.score[band];
  return (
    <View
      style={{
        marginTop: 2,
        paddingHorizontal: space.sm,
        paddingVertical: 3,
        borderRadius: radius.pill,
        backgroundColor: tone + '1A',
      }}
    >
      <Text variant="eyebrow" color={tone}>
        {bandLabel[band]}
      </Text>
    </View>
  );
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
      <Text style={{ ...type.score, fontSize: size * 0.34, lineHeight: size * 0.36 }}>{String(value)}</Text>
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
