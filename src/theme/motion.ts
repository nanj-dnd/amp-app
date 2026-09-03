/**
 * amp motion
 *
 * one source of truth for how things move, the way tokens.ts is the one source
 * of truth for how things look. every animation in the app is described here in
 * apple's two parameters and nowhere in stiffness/damping/mass, because those
 * three are physics and nobody can look at `{ damping: 18, stiffness: 240 }`
 * and tell you whether it bounces.
 *
 *   damping ratio  1.0 settles with no overshoot. below 1.0 it bounces.
 *   response       seconds to reach the target. not a duration — a spring has
 *                  no duration; it is the speed of the approach.
 *
 * the rule the presets encode: **critically damped by default, bounce only
 * when the gesture itself carried momentum.** overshoot on a menu that just
 * appeared is noise; overshoot on a sheet you threw is physics.
 */
export type SpringSpec = {
  /** 1 = critically damped, no overshoot. lower bounces more. */
  damping: number;
  /** seconds to the target. lower is snappier. */
  response: number;
};

type RNSpring = { stiffness: number; damping: number; mass: number };

/**
 * apple's (dampingRatio, response) -> react native's (stiffness, damping, mass).
 *
 * a spring's natural frequency is w = 2pi / response, so for unit mass
 * k = w^2 and c = 2 * zeta * w. this is the same conversion swiftui does
 * behind `Spring(response:dampingRatio:)`, which is why the numbers in the
 * presets below are the numbers from apple's talks, not translations of them.
 */
export function spring({ damping, response }: SpringSpec): RNSpring {
  const mass = 1;
  const w = (2 * Math.PI) / response;
  return {
    mass,
    stiffness: mass * w * w,
    damping: 2 * damping * mass * w,
  };
}

/**
 * the vocabulary. reach for a name, not a number.
 *
 * `move`, `rotate` and `sheet` are the values apple ships for those exact
 * interactions (designing fluid interfaces, wwdc18).
 */
export const SPRING = {
  /** the default for anything that isn't a physical, momentum-carrying gesture. */
  ui: { damping: 1, response: 0.35 },
  /** a press. faster than ui because a finger is already on the thing. */
  press: { damping: 1, response: 0.28 },
  /** repositioning something on screen — pip, a thumb, a card. */
  move: { damping: 1, response: 0.4 },
  /** rotation reads as physical, so it earns a little overshoot. */
  rotate: { damping: 0.8, response: 0.4 },
  /** drawers and sheets: thrown by a finger, so they bounce. */
  sheet: { damping: 0.8, response: 0.3 },
  /** anything released from a flick. */
  flick: { damping: 0.8, response: 0.35 },
} as const satisfies Record<string, SpringSpec>;

type SpringName = keyof typeof SPRING;

/**
 * ready-made configs for Animated.spring. pass a name, get physics.
 *
 * `velocity` is the one thing you must not forget on a gesture release: react
 * native measures it in units per *second*, while PanResponder reports vx/vy in
 * units per *millisecond*. hand it a raw gestureState.vy and the spring barely
 * moves. use `handoff()` below rather than doing it by hand.
 */
export function springConfig(name: SpringName, extra?: { velocity?: number }) {
  return { ...spring(SPRING[name]), useNativeDriver: true, ...extra };
}

/** PanResponder velocity (units/ms) -> Animated.spring velocity (units/s). */
export function handoff(gestureVelocity: number): number {
  return gestureVelocity * 1000;
}

/**
 * where a flick would come to rest if you just let it decelerate.
 *
 * the point of this is that a gesture should land where it was *going*, not at
 * whatever boundary happened to be nearest when the finger left the glass. a
 * short fast flick and a long slow drag ending in the same place mean two
 * different things, and only this function can tell them apart.
 *
 * this is apple's exponential-decay form from the fluid interfaces sample code,
 * not the textbook v^2/(2a) — they do not give the same answer and this is the
 * one that feels like ios.
 *
 * @param velocity px per second
 */
export function project(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * where a released gesture should land: the nearest resting point to where the
 * flick was *going*, not to where the finger happened to leave the glass.
 *
 * this is the whole reverse-or-commit decision in one line, and it needs to be
 * one line because position and velocity disagree constantly — a sheet dragged
 * most of the way down but thrown back up should return, and a sheet barely
 * moved but flicked hard should go. projecting first lets both cases fall out
 * of the same rule instead of a pile of thresholds.
 *
 * @param position  where it is now
 * @param velocity  px per second at release
 * @param points    the resting places it is allowed to land on
 */
export function snapTo(
  position: number,
  velocity: number,
  points: readonly number[],
  decelerationRate = 0.998,
): number {
  const projected = position + project(velocity, decelerationRate);
  return points.reduce(
    (best, p) => (Math.abs(p - projected) < Math.abs(best - projected) ? p : best),
    points[0],
  );
}

/**
 * how far something follows your finger once it is already past its limit.
 *
 * a hard stop reads as broken. progressive resistance reads as "still with you,
 * but there is nothing more here". the further you pull, the less it gives.
 *
 * @param overshoot  how far past the bound the finger has travelled
 * @param dimension  the size of the thing being dragged
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** legacy shape, kept so nothing has to change at once. prefer SPRING. */
export const motion = {
  /** critically damped. was under-damped (zeta 0.69), which bounced every tap. */
  spring: { ...spring(SPRING.ui), mass: 1 },
  fast: 140,
  base: 220,
  pressScale: 0.97,
} as const;
