import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useColors, space } from '../theme';
import { Text } from './Text';

/**
 * one chart primitive for the whole app. the old progress screen had a
 * 16-series spaghetti plot with a legend taller than the chart — this only
 * ever draws one line, and lets you switch which series that is.
 */
export function LineChart({
  data,
  height = 168,
  min: minProp,
  max: maxProp,
  labels,
  color,
}: {
  data: number[];
  height?: number;
  min?: number;
  max?: number;
  labels?: [string, string, string];
  color?: string;
}) {
  const c = useColors();
  const [w, setW] = useState(0);
  const stroke = color ?? c.brand;

  // fit the axis to the data (snapped to 5s) instead of always drawing 0-100 —
  // a 53-71 spread on a 0-100 axis is a flat line that says nothing.
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const min = minProp ?? Math.max(0, Math.floor((lo - 4) / 5) * 5);
  const max = maxProp ?? Math.min(100, Math.ceil((hi + 4) / 5) * 5);

  const padL = 26;
  const padR = 6;
  const padT = 10;
  const padB = 4;
  const innerW = Math.max(0, w - padL - padR);
  const innerH = height - padT - padB;

  const x = (i: number) => padL + (data.length <= 1 ? 0 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * innerH;

  // catmull-rom -> cubic bezier, so the line reads smooth without wobbling
  const line = data
    .map((v, i) => {
      if (i === 0) return `M ${x(0)} ${y(v)}`;
      const p0 = data[i - 2] ?? data[i - 1];
      const p1 = data[i - 1];
      const c1x = x(i - 1) + (x(i) - x(i - 2 < 0 ? 0 : i - 2)) / 6;
      const c1y = y(p1) + (y(v) - y(p0)) / 6;
      return `C ${c1x} ${c1y}, ${x(i) - (x(i) - x(i - 1)) / 3} ${y(v)}, ${x(i)} ${y(v)}`;
    })
    .join(' ');

  const area = `${line} L ${x(data.length - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`;
  const gridVals = [min, (min + max) / 2, max];

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={w} height={height}>
          <Defs>
            <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={stroke} stopOpacity={0.16} />
              <Stop offset="1" stopColor={stroke} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {gridVals.map((g) => (
            <Line
              key={g}
              x1={padL}
              x2={w - padR}
              y1={y(g)}
              y2={y(g)}
              stroke={c.hairline}
              strokeWidth={1}
            />
          ))}

          <Path d={area} fill="url(#fade)" />
          <Path d={line} stroke={stroke} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r={4.5} fill={stroke} />
          <Circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r={8} fill={stroke} fillOpacity={0.18} />
        </Svg>
      )}

      {/* axis text lives outside the svg so it inherits archivo */}
      <View style={{ position: 'absolute', left: 0, top: 0, height, justifyContent: 'space-between', paddingVertical: 4 }}>
        <Text variant="tab" tone="tertiary">{String(max)}</Text>
        <Text variant="tab" tone="tertiary">{String(min)}</Text>
      </View>
      {labels && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm, paddingLeft: padL }}>
          {labels.map((l) => (
            <Text key={l} variant="tab" tone="tertiary">
              {l}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
