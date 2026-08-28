import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { Text } from './Text';
import { Touch } from './Pressable';
import { useColors, space, radius, font } from '../theme';

export type Series = { id: string; label: string; colour: string; points: (number | null)[] };

/**
 * every section, plotted over the last n sessions.
 *
 * the version this replaces drew sixteen series at full strength with a legend
 * taller than the chart — you could see that something moved, never what. here
 * everything is drawn faint by default and the legend is a set of switches:
 * tap a section and it comes forward while the rest drop back to context.
 * nothing is hidden, but only what you asked for is legible.
 */
export function SeriesChart({
  series,
  labels,
  height = 190,
  min: minProp,
  max: maxProp,
  /** a long legend scrolls sideways instead of wrapping into a wall of chips */
  scrollLegend = false,
  /** when one series must always be highlighted, e.g. picking a single kpi */
  alwaysFocus = false,
  initialFocus = null,
  onFocus,
}: {
  series: Series[];
  labels: [string, string, string];
  height?: number;
  min?: number;
  max?: number;
  scrollLegend?: boolean;
  alwaysFocus?: boolean;
  initialFocus?: string | null;
  onFocus?: (id: string | null) => void;
}) {
  const c = useColors();
  const [w, setW] = useState(0);
  const [focus, setFocusState] = useState<string | null>(initialFocus);

  const setFocus = (id: string | null) => {
    const next = alwaysFocus && id === null ? focus : id;
    setFocusState(next);
    onFocus?.(next);
  };

  // when the caller swaps the series out from under us, the old focus is stale
  useEffect(() => {
    if (focus && !series.some((s) => s.id === focus)) setFocusState(initialFocus ?? series[0]?.id ?? null);
    else if (alwaysFocus && !focus) setFocusState(initialFocus ?? series[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, initialFocus]);

  // fit the axis to the data, snapped to 5s. every section lives between about
  // 45 and 70, and drawing that on a 0-100 axis turns seven trends into one
  // flat band.
  const values = series.flatMap((s) => s.points.filter((p): p is number => p !== null));
  const min = minProp ?? Math.max(0, Math.floor((Math.min(...values) - 5) / 5) * 5);
  const max = maxProp ?? Math.min(100, Math.ceil((Math.max(...values) + 5) / 5) * 5);

  const padL = 28;
  const padR = 6;
  const padT = 10;
  const padB = 6;
  const innerW = Math.max(0, w - padL - padR);
  const innerH = height - padT - padB;

  const len = Math.max(...series.map((s) => s.points.length), 2);
  const x = (i: number) => padL + (i / (len - 1)) * innerW;
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * innerH;

  const paths = useMemo(
    () =>
      series.map((s) => {
        let d = '';
        let open = false;
        s.points.forEach((p, i) => {
          if (p === null) {
            open = false;
            return;
          }
          d += `${open ? ' L' : ' M'} ${x(i)} ${y(p)}`;
          open = true;
        });
        return { id: s.id, colour: s.colour, d: d.trim() };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, w, height, min, max],
  );

  const gridAt = [min, (min + max) / 2, max];

  return (
    <View style={{ gap: space.lg }}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {w > 0 && (
          <Svg width={w} height={height}>
            {gridAt.map((g) => (
              <Line key={g} x1={padL} x2={w - padR} y1={y(g)} y2={y(g)} stroke={c.hairline} strokeWidth={1} />
            ))}

            {/* unfocused series first, so the focused one lands on top */}
            {paths
              .filter((p) => focus !== null && p.id !== focus)
              .map((p) => (
                <Path key={p.id} d={p.d} stroke={c.textTertiary} strokeWidth={1.2} fill="none" opacity={0.22} />
              ))}

            {paths
              .filter((p) => focus === null || p.id === focus)
              .map((p) => (
                <Path
                  key={p.id}
                  d={p.d}
                  stroke={p.colour}
                  strokeWidth={focus === p.id ? 2.6 : 1.6}
                  fill="none"
                  opacity={focus === null ? 0.75 : 1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

            {focus &&
              series
                .find((s) => s.id === focus)
                ?.points.map((p, i) =>
                  p === null ? null : (
                    <Circle key={i} cx={x(i)} cy={y(p)} r={3} fill={series.find((s) => s.id === focus)!.colour} />
                  ),
                )}
          </Svg>
        )}

        <View style={{ position: 'absolute', left: 0, top: 0, height, justifyContent: 'space-between', paddingVertical: 4 }}>
          <Text variant="tab" tone="tertiary">
            {String(max)}
          </Text>
          <Text variant="tab" tone="tertiary">
            {String(min)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingLeft: padL }}>
        {labels.map((l) => (
          <Text key={l} variant="tab" tone="tertiary">
            {l}
          </Text>
        ))}
      </View>

      {/* the legend is the control, not a key */}
      <Legend scroll={scrollLegend}>
        {series.map((s) => {
          const on = focus === s.id;
          return (
            <Touch
              key={s.id}
              haptic="selection"
              onPress={() => setFocus(on ? null : s.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: space.md,
                height: 30,
                borderRadius: radius.pill,
                backgroundColor: on ? c.brandTint : c.fill,
                borderWidth: on ? 1 : StyleSheet.hairlineWidth,
                borderColor: on ? c.brand : 'transparent',
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.colour }} />
              <Text variant="tab" tone={on ? 'brand' : 'secondary'} style={{ fontFamily: on ? font.bold : undefined }}>
                {s.label}
              </Text>
            </Touch>
          );
        })}
      </Legend>

      {!alwaysFocus && (
        <Text variant="caption" tone="tertiary">
          {focus ? 'tap again to show everything' : 'tap one to bring it forward'}
        </Text>
      )}
    </View>
  );
}

function Legend({ scroll, children }: { scroll: boolean; children: React.ReactNode }) {
  if (!scroll) return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>{children}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
      {children}
    </ScrollView>
  );
}
