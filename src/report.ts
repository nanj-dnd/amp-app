import { rescale, tierFor, SHEETS, type Tier, type Scores } from './kpis';

/**
 * a scored session, as the athlete sees it.
 *
 * the ratings *are* the kpis — every row carries the 0-10 the model gave it and
 * the frame it read that off, because a score nobody can check is a score
 * nobody trusts. a kpi that wasn't visible carries null, never 0.
 */

export type View = 'side' | 'front' | 'behind';

export type Rating = {
  kpiId: string;
  /** 0–10, null when the kpi wasn't observable in this session */
  score: number | null;
  observation: string;
  /** the frame the observation was read from */
  evidence?: string;
  view?: View;
};

export type Drill = { name: string; cue: string; how: string };

/**
 * injury screening. separate from the technique ratings on purpose: a low
 * score means "this will cost you runs", a flag here means "this will cost you
 * a season". they are read differently, so they don't share a scale.
 */
export type RiskLevel = 'clear' | 'watch' | 'flag';

export type ScreenFinding = {
  id: string;
  area: string;
  level: RiskLevel;
  /** one line. anything longer belongs in the sheet, not the card. */
  note: string;
  evidence?: string;
};

export type Report = {
  id: string;
  date: string;
  discipline: 'batting' | 'bowling';
  mode: 'pace' | 'spin';
  ageYears: number;
  ratings: Rating[];
  strengthId: string;
  priorityId: string;
  notes: string;
  drills: Drill[];
  screening: ScreenFinding[];
  /** amp score per session, oldest first, this one last */
  history: number[];
};

export const tierOf = (r: Report): Tier => tierFor(r.ageYears, r.mode);

export const scoresOf = (r: Report): Scores =>
  Object.fromEntries(r.ratings.map((x) => [x.kpiId, x.score]));

export const resultOf = (r: Report) => rescale(scoresOf(r), tierOf(r));

/** kpi metadata by id, so a rating can render its own name and weight. */
export function kpiIndex(tier: Tier) {
  const out = new Map<string, { name: string; pts: number; section: string; sectionId: string }>();
  for (const s of SHEETS[tier].sections)
    for (const k of s.kpis) out.set(k.id, { name: k.name, pts: k.pts, section: s.name, sectionId: s.id });
  return out;
}

export const ratingOf = (r: Report, id: string) => r.ratings.find((x) => x.kpiId === id);

/** biggest movers against the previous report, for the progression strip. */
export function movers(current: Report, previous: Report | null, limit = 3) {
  if (!previous) return [];
  const now = resultOf(current);
  const before = resultOf(previous);
  return now.sections
    .map((s) => {
      const was = before.sections.find((x) => x.section.id === s.section.id);
      if (s.score === null || was?.score == null) return null;
      return { name: s.section.name, delta: s.score - was.score };
    })
    .filter((x): x is { name: string; delta: number } => x !== null && x.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit);
}

/** how many kpis actually got a number, which is what the dial's caption says. */
export const scoredCount = (r: Report) => r.ratings.filter((x) => x.score !== null).length;

/** the worst screening level present, which decides whether the card shows at all. */
export function riskOf(r: Report): RiskLevel {
  if (r.screening.some((f) => f.level === 'flag')) return 'flag';
  if (r.screening.some((f) => f.level === 'watch')) return 'watch';
  return 'clear';
}
