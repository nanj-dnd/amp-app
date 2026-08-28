import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';
import { SheenBar } from './Metal';
import { GlossText } from './GlossText';
import { useColors, space, radius, font, bandFor } from '../theme';
import type { SectionResult } from '../kpis';

/**
 * the normalised view of a scored sheet.
 *
 * every section is rescaled to 0–100 over the kpis actually observed, so a
 * 20-point section with two of three rows scored is directly comparable to a
 * 10-point one with all of them. the weight is shown separately, because
 * "you're weak at the thing worth 20" is a different sentence to "you're weak".
 */
export function SectionChart({
  sections,
  benchmark,
  onPick,
  selected,
}: {
  sections: SectionResult[];
  benchmark?: number;
  onPick?: (id: string) => void;
  selected?: string;
}) {
  const c = useColors();
  const scored = sections.filter((s) => s.score !== null);

  return (
    <View style={{ gap: space.md }}>
      {sections.map((s) => {
        const on = selected === s.section.id;
        const value = s.score;
        const missing = value === null;

        return (
          <View key={s.section.id} style={{ gap: 6, opacity: missing ? 0.45 : 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
              <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
                {s.section.name}
              </Text>
              <Text variant="tab" tone="tertiary">
                {`${s.weight}pts`}
              </Text>
              <GlossText
                variant="bodyStrong"
                color={missing ? c.textTertiary : c.score[bandFor(value)]}
                style={{ width: 30, textAlign: 'right' }}
              >
                {missing ? '—' : String(value)}
              </GlossText>
            </View>

            <View style={{ height: 8, borderRadius: 4, backgroundColor: c.fill }}>
              {!missing && (
                <SheenBar
                  color={c.score[bandFor(value)]}
                  height={8}
                  radius={4}
                  style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
                />
              )}
              {benchmark !== undefined && (
                <View
                  style={{
                    position: 'absolute',
                    left: `${benchmark}%`,
                    top: -3,
                    bottom: -3,
                    width: 2,
                    borderRadius: 1,
                    backgroundColor: c.text,
                  }}
                />
              )}
            </View>

            {missing && (
              <Text variant="tab" tone="tertiary">
                not seen in this session
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
