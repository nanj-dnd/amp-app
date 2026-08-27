import React from 'react';
import { View, Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useColors } from '../theme';

/**
 * the amp mark: a road in perspective, converging on a vanishing point.
 *
 * two renderings, on purpose:
 *   • the master artwork (assets/logo-mark.png, cut transparent from the
 *     supplied svg) wherever the logo is the logo — splash, greeting, wordmark.
 *   • a traced vector below ~32px and anywhere it needs to take a colour, because
 *     the artwork's lane dashes turn to mush at small sizes and a raster can't
 *     be recoloured for a green card.
 */

const MARK = require('../../assets/logo-mark.png');
const LOCKUP = require('../../assets/logo-lockup.png');

/** below this the artwork's dashes stop resolving, so the vector takes over. */
const RASTER_MIN = 32;

export function LogoMark({ size = 28, color }: { size?: number; color?: string }) {
  if (!color && size >= RASTER_MIN) {
    return <Image source={MARK} style={{ width: size, height: size * (268 / 296) }} resizeMode="contain" />;
  }
  return <VectorMark size={size} color={color} />;
}

/** the full lockup — mark plus wordmark, as supplied. */
export function Wordmark({ width = 132 }: { width?: number }) {
  return <Image source={LOCKUP} style={{ width, height: width * (292 / 948) }} resizeMode="contain" />;
}

/* ------------------------------------------------------------- fallback */

const APEX_Y = 3;
const BASE_Y = 88;
const NOTCH_Y = 71.5;
const GAP_TOP = 1.5;
const GAP_BOT = 2.2;

/** traced from the artwork; solid, so it reads at any size and takes a tint. */
export function VectorMark({ size = 24, color }: { size?: number; color?: string }) {
  const c = useColors();
  const fill = color ?? c.brand;

  const left = [
    `M ${50 - GAP_TOP} ${APEX_Y}`,
    `L 2.4 ${BASE_Y - 2}`,
    `Q 1.2 ${BASE_Y + 1.6} 4.6 ${BASE_Y - 0.2}`,
    `L ${50 - GAP_BOT} ${NOTCH_Y}`,
    'Z',
  ].join(' ');
  const right = [
    `M ${50 + GAP_TOP} ${APEX_Y}`,
    `L 97.6 ${BASE_Y - 2}`,
    `Q 98.8 ${BASE_Y + 1.6} 95.4 ${BASE_Y - 0.2}`,
    `L ${50 + GAP_BOT} ${NOTCH_Y}`,
    'Z',
  ].join(' ');

  return (
    <Svg width={size} height={size * 0.9} viewBox="0 0 100 90">
      <Path d={left} fill={fill} />
      <Path d={right} fill={fill} />
    </Svg>
  );
}
