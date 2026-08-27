import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, G } from 'react-native-svg';
import { useColors, space, font, radius } from '../theme';
import { Text } from './Text';
import { REGIONS } from '../match/types';
import type { RegionTally } from '../insights';

/**
 * where the athlete's runs actually go. each wedge is scaled by the runs scored
 * there, so a one-sided player looks one-sided — which is the point.
 */
export function ScoringAreas({ areas, size = 240 }: { areas: RegionTally[]; size?: number }) {
  const c = useColors();
  const R = size / 2;
  const inner = R * 0.16;
  const max = Math.max(1, ...areas.map((a) => a.runs));
  const total = areas.reduce((s, a) => s + a.runs, 0);

  return (
    <View style={{ alignItems: 'center', gap: space.md }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={R} cy={R} r={R - 1} fill={c.fill} />
          <Circle cx={R} cy={R} r={(R - 1) * 0.55} fill="none" stroke={c.hairline} strokeWidth={1} />

          <G>
            {REGIONS.map((r) => {
              const tally = areas.find((a) => a.region === r.id);
              const runs = tally?.runs ?? 0;
              if (runs === 0) return null;

              // each region owns a 45° wedge centred on its angle
              const half = 22.5;
              const reach = inner + (R - inner - 2) * (runs / max);
              const a0 = ((r.angle - half) * Math.PI) / 180;
              const a1 = ((r.angle + half) * Math.PI) / 180;
              const p = (ang: number, rad: number) => `${R + rad * Math.cos(ang)} ${R - rad * Math.sin(ang)}`;

              return (
                <Path
                  key={r.id}
                  d={`M ${p(a0, inner)} L ${p(a0, reach)} A ${reach} ${reach} 0 0 0 ${p(a1, reach)} L ${p(a1, inner)} Z`}
                  fill={c.brand}
                  fillOpacity={0.28 + 0.6 * (runs / max)}
                  stroke={c.brand}
                  strokeWidth={1}
                />
              );
            })}
          </G>

          {[0, 45, 90, 135].map((a) => {
            const rad = (a * Math.PI) / 180;
            return (
              <Line
                key={a}
                x1={R - (R - 1) * Math.cos(rad)}
                y1={R + (R - 1) * Math.sin(rad)}
                x2={R + (R - 1) * Math.cos(rad)}
                y2={R - (R - 1) * Math.sin(rad)}
                stroke={c.hairline}
                strokeWidth={1}
              />
            );
          })}
          <Circle cx={R} cy={R} r={inner} fill={c.surface} stroke={c.hairline} strokeWidth={1} />
        </Svg>

        {/* labels only where there are runs, so a sparse wheel stays readable */}
        {REGIONS.map((r) => {
          const runs = areas.find((a) => a.region === r.id)?.runs ?? 0;
          if (runs === 0) return null;
          const rad = (r.angle * Math.PI) / 180;
          const dist = R * 0.78;
          return (
            <View
              key={r.id}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: R + dist * Math.cos(rad) - 24,
                top: R - dist * Math.sin(rad) - 9,
                width: 48,
                alignItems: 'center',
              }}
            >
              <Text variant="tab" style={{ fontFamily: font.black }}>
                {String(runs)}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm }}>
        {[...areas]
          .filter((a) => a.runs > 0)
          .sort((a, b) => b.runs - a.runs)
          .slice(0, 4)
          .map((a) => (
            <View
              key={a.region}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: space.md,
                paddingVertical: 4,
                borderRadius: radius.pill,
                backgroundColor: c.fill,
              }}
            >
              <Text variant="tab" tone="secondary">
                {REGIONS.find((r) => r.id === a.region)?.label ?? a.region}
              </Text>
              <Text variant="tab" style={{ fontFamily: font.bold }}>
                {total ? `${Math.round((a.runs / total) * 100)}%` : '0%'}
              </Text>
            </View>
          ))}
      </View>
    </View>
  );
}
