import type { Progression } from './state/types';

/**
 * the amp score is a composite, and the card is where that gets explained.
 *
 * the same blank-vs-zero rule as the kpi sheet applies: a component nobody has
 * rated yet (a coach who hasn't reviewed you) is excluded from both sides of
 * the weighted mean rather than counted as nought. so an unrated athlete isn't
 * punished for the part of the product they haven't used.
 */

export type Component = {
  id: 'report' | 'gameiq' | 'coaching';
  label: string;
  weight: number;
  score: number | null;
  /** shown when the component has no score yet */
  empty: string;
};

export function components(p: Progression, coachScore: number | null = null): Component[] {
  const iq = p.iqAnswered >= 10 ? Math.round((p.iqCorrect / p.iqAnswered) * 100) : null;

  return [
    { id: 'report', label: 'report', weight: 55, score: p.ampScore || null, empty: 'film a session' },
    { id: 'gameiq', label: 'game iq', weight: 25, score: iq, empty: '10 questions to unlock' },
    { id: 'coaching', label: 'coaching', weight: 20, score: coachScore, empty: 'not rated yet' },
  ];
}

/** the weighted mean over the components that actually have a score. */
export function composite(list: Component[]): number | null {
  const rated = list.filter((c) => c.score !== null);
  if (rated.length === 0) return null;
  const num = rated.reduce((s, c) => s + c.score! * c.weight, 0);
  const den = rated.reduce((s, c) => s + c.weight, 0);
  return Math.round(num / den);
}

/** how much of the score each component is actually carrying, for the bar. */
export function shares(list: Component[]) {
  const rated = list.filter((c) => c.score !== null);
  const den = rated.reduce((s, c) => s + c.weight, 0) || 1;
  return list.map((c) => ({ ...c, share: c.score === null ? 0 : c.weight / den }));
}
