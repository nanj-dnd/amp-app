import type { AthleteProfile, Discipline, Goal, Progression } from './state/types';

/* ---------------------------------------------------------------- goals */

/**
 * the funnel says prompts must produce a specific, quantifiable answer, so a
 * goal is picked from a template that already knows its metric and unit — the
 * athlete only supplies the two numbers and a date.
 */
export type GoalTemplate = {
  metric: string;
  label: string;
  unit: string;
  higherIsBetter: boolean;
  for: Discipline[];
  /** sensible starting pair so the first screen is never two empty boxes */
  from: number;
  to: number;
  step: number;
};

export const GOAL_TEMPLATES: GoalTemplate[] = [
  { metric: 'pace', label: 'bowl faster', unit: 'kmph', higherIsBetter: true, for: ['bowling', 'both'], from: 118, to: 128, step: 1 },
  { metric: 'economy', label: 'tighten my economy', unit: 'runs/over', higherIsBetter: false, for: ['bowling', 'both'], from: 7.5, to: 5.5, step: 0.5 },
  { metric: 'dots', label: 'bowl more dots', unit: 'dots/over', higherIsBetter: true, for: ['bowling', 'both'], from: 2, to: 4, step: 1 },
  { metric: 'sixes', label: 'hit more sixes', unit: 'per innings', higherIsBetter: true, for: ['batting', 'both'], from: 1, to: 4, step: 1 },
  { metric: 'average', label: 'score more runs', unit: 'runs/innings', higherIsBetter: true, for: ['batting', 'both'], from: 24, to: 40, step: 2 },
  { metric: 'strike-rate', label: 'raise my strike rate', unit: 'sr', higherIsBetter: true, for: ['batting', 'both'], from: 105, to: 135, step: 5 },
  { metric: 'ampScore', label: 'raise my amp score', unit: 'pts', higherIsBetter: true, for: ['batting', 'bowling', 'both'], from: 60, to: 75, step: 1 },
];

export const templatesFor = (d: Discipline) => GOAL_TEMPLATES.filter((g) => g.for.includes(d));

/** offered target dates, phrased as the athlete would say them. */
export const HORIZONS = [
  { weeks: 6, label: '6 weeks', sub: 'a trial or camp coming up' },
  { weeks: 12, label: '3 months', sub: 'one season block' },
  { weeks: 24, label: '6 months', sub: 'a proper rebuild' },
  { weeks: 52, label: 'a year', sub: 'the long project' },
] as const;

export function dateInWeeks(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export function goalHeadline(g: Goal): string {
  const dir = g.higherIsBetter ? 'to' : 'down to';
  return `${g.label} — ${fmt(g.from)} ${dir} ${fmt(g.to)} ${g.unit}`;
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
export { fmt as formatMetric };

/* ------------------------------------------------------------ week keys */

/** iso-ish week key. monday-anchored so a week rolls over on monday morning. */
export function weekKey(d: Date = new Date()): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // back to monday
  return x.toISOString().slice(0, 10);
}

export function weeksBetween(fromIso: string, toIso: string): number {
  const ms = Date.parse(toIso) - Date.parse(fromIso);
  return Math.max(1, Math.round(ms / (7 * 86_400_000)));
}

/* ----------------------------------------------------------- the road */

export type ActionKind = 'record' | 'iq' | 'gym' | 'nutrition';

export type WeekAction = {
  id: ActionKind;
  label: string;
  detail: string;
  /** how many times this week; 1 for one-shot actions */
  target: number;
  required: boolean;
};

export type PlanWeek = {
  key: string;
  index: number;
  label: string;
  /** the kpi this week is pointed at, taken from the last report */
  focus: string;
  /** the amp-score checkpoint this week should land on */
  checkpoint: number;
  isMilestone: boolean;
  actions: WeekAction[];
};

/**
 * the four pillars, expressed as one week of work. sessions are weekly because
 * that is the cadence the product actually runs on — one recording a week is
 * the assumption everything else hangs off. game iq is the only daily pillar.
 */
function weekActions(index: number, discipline: Discipline): WeekAction[] {
  return [
    {
      id: 'record',
      label: 'film one session',
      detail: discipline === 'bowling' ? 'a full spell, side-on' : 'a full net, side-on',
      target: 1,
      required: true,
    },
    { id: 'iq', label: 'game iq', detail: 'five days this week', target: 5, required: true },
    { id: 'gym', label: 'gym', detail: 'two s&c sessions', target: 2, required: false },
    { id: 'nutrition', label: 'nutrition check-in', detail: 'with your advisor', target: 1, required: false },
  ];
}

/** rotating technical focus so consecutive weeks don't read identically. */
const FOCUS: Record<'batting' | 'bowling', string[]> = {
  batting: ['stance & setup', 'backlift & trigger', 'front foot play', 'bat path & contact', 'back foot play', 'shot selection'],
  bowling: ['run-up & rhythm', 'load-up & alignment', 'release & wrist', 'line & length', 'follow-through', 'variations'],
};

/**
 * builds the road: one node per week from this monday to the goal date.
 * the last node is the goal itself, which is the point of the whole screen.
 */
export function buildPlan(profile: AthleteProfile, progression: Progression): PlanWeek[] {
  const goal = profile.goal;
  const start = weekKey();
  const total = goal ? Math.min(52, weeksBetween(start, goal.targetDate)) : 12;

  const startScore = progression.ampScore || 60;
  const endScore = goal?.metric === 'ampScore' ? goal.to : Math.min(92, startScore + Math.round(total * 0.6));

  const pool =
    profile.discipline === 'bowling'
      ? FOCUS.bowling
      : profile.discipline === 'batting'
        ? FOCUS.batting
        : [...FOCUS.batting, ...FOCUS.bowling];

  return Array.from({ length: total }, (_, i) => {
    const monday = new Date(start);
    monday.setDate(monday.getDate() + i * 7);
    const t = total === 1 ? 1 : i / (total - 1);
    return {
      key: monday.toISOString().slice(0, 10),
      index: i + 1,
      label: `week ${i + 1}`,
      focus: pool[i % pool.length],
      checkpoint: Math.round(startScore + (endScore - startScore) * t),
      // a review every fourth week, plus the last — but never two in a row
      isMilestone: i === total - 1 || ((i + 1) % 4 === 0 && i < total - 2),
      actions: weekActions(i + 1, profile.discipline),
    };
  });
}

export type WeekProgress = { done: number; total: number; complete: boolean };

/** how far through a given week the athlete is. required actions only. */
export function weekProgress(week: PlanWeek, progression: Progression): WeekProgress {
  const logged = progression.weekActions[week.key] ?? [];
  const required = week.actions.filter((a) => a.required);
  const done = required.filter((a) => countOf(logged, a.id) >= a.target).length;
  return { done, total: required.length, complete: done === required.length };
}

export const countOf = (logged: string[], id: string) => logged.filter((x) => x === id).length;

export function currentWeekIndex(plan: PlanWeek[]): number {
  const now = weekKey();
  const i = plan.findIndex((w) => w.key === now);
  return i === -1 ? 0 : i;
}
