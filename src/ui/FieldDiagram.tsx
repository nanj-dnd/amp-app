import React from 'react';
import Svg, { Circle, Rect, G } from 'react-native-svg';
import { useColors } from '../theme';
import { FIELD_PRESETS, FIELD_ANGLES } from '../gameiq';

/** the cricket field used by the field-setting and read-the-field games. */
export function FieldDiagram({ preset, size = 132 }: { preset: string; size?: number }) {
  const c = useColors();
  const cfg = FIELD_PRESETS[preset] ?? FIELD_PRESETS.balanced;
  const cx = 75;
  const cy = 75;
  const R = 64;

  return (
    <Svg width={size} height={size} viewBox="0 0 150 150">
      <Circle cx={cx} cy={cy} r={R} fill={c.brandTint} stroke={c.brandBorder} strokeWidth={1.5} />
      <Circle cx={cx} cy={cy} r={R * 0.55} fill="none" stroke={c.hairline} strokeWidth={1} />
      <Rect x={70} y={46} width={10} height={58} rx={1} fill={c.surface} opacity={0.85} />
      {/* striker, then keeper */}
      <Circle cx={75} cy={96} r={3.2} fill={c.brand} />
      <Circle cx={75} cy={52} r={2.4} fill={c.textTertiary} />
      <G>
        {FIELD_ANGLES.map((a, i) => {
          const rad = (a * Math.PI) / 180;
          const rr = R * cfg[i];
          return (
            <Circle
              key={a}
              cx={cx + rr * Math.cos(rad)}
              cy={cy + rr * Math.sin(rad)}
              r={3.6}
              fill={c.text}
            />
          );
        })}
      </G>
    </Svg>
  );
}
