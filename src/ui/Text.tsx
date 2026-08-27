import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useColors, type } from '../theme';

type Variant = keyof typeof type;
type Tone = 'primary' | 'secondary' | 'tertiary' | 'brand' | 'danger' | 'onBrand';

export type TextProps = RNTextProps & {
  variant?: Variant;
  tone?: Tone;
  /** amp is a lowercase product. opt out only for proper nouns you want to keep. */
  preserveCase?: boolean;
  color?: string;
  align?: TextStyle['textAlign'];
};

/**
 * every string in the app goes through here. the lowercasing lives in one
 * place so copy can be written normally and still render as amp.
 */
export function Text({
  variant = 'body',
  tone = 'primary',
  preserveCase = false,
  color,
  align,
  style,
  children,
  ...rest
}: TextProps) {
  const c = useColors();

  const toneColor =
    color ??
    {
      primary: c.text,
      secondary: c.textSecondary,
      tertiary: c.textTertiary,
      brand: c.brand,
      danger: c.danger,
      onBrand: c.textOnBrand,
    }[tone];

  return (
    <RNText
      {...rest}
      // ios accessibility text-sizing is respected but capped so cards don't explode
      maxFontSizeMultiplier={1.4}
      style={[type[variant], { color: toneColor, textAlign: align }, style]}
    >
      {preserveCase ? children : lower(children)}
    </RNText>
  );
}

function lower(node: React.ReactNode): React.ReactNode {
  if (typeof node === 'string') return node.toLowerCase();
  if (typeof node === 'number') return node;
  if (Array.isArray(node)) return node.map((n, i) => <React.Fragment key={i}>{lower(n)}</React.Fragment>);
  return node;
}
