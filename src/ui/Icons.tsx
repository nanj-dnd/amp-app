import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '../theme';

type P = { size?: number; color?: string };

/**
 * cricket glyphs, from material community icons.
 *
 * these were hand-drawn svgs, and a hand-drawn bat has a ceiling at 17px — it
 * reads as a trowel. mdi ships a proper `cricket` glyph and is already bundled
 * with @expo/vector-icons, so this costs no dependency and no licence question
 * (apache 2.0). one professionally drawn family beats three of mine.
 *
 * the wrappers stay so call sites don't care where the shapes come from; swap
 * the `name` here to move the whole app to another set.
 */

/** bat and ball — the sport's own glyph. */
export function BatIcon({ size = 24, color }: P) {
  const c = useColors();
  return <MaterialCommunityIcons name="cricket" size={size} color={color ?? c.text} />;
}

/** the ball on its own. */
export function BallIcon({ size = 24, color }: P) {
  const c = useColors();
  return <MaterialCommunityIcons name="tennis-ball" size={size} color={color ?? c.text} />;
}

/** both disciplines — a swap rather than a third cricket object, which would
 *  just read as one of the other two at this size. */
export function AllRounderIcon({ size = 24, color }: P) {
  const c = useColors();
  return <MaterialCommunityIcons name="swap-horizontal" size={size} color={color ?? c.text} />;
}

export function StumpsIcon({ size = 24, color }: P) {
  const c = useColors();
  return <MaterialCommunityIcons name="cricket" size={size} color={color ?? c.text} />;
}

export function RoadIcon({ size = 24, color }: P) {
  const c = useColors();
  return <MaterialCommunityIcons name="road-variant" size={size} color={color ?? c.text} />;
}
