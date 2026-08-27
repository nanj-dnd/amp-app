/**
 * shaped around the d2c funnel: identity -> cricket profile -> goal + date ->
 * free first report -> weekly loop. everything the analyzer needs is collected
 * before the first upload, so the record screen only ever asks for a clip.
 */

export type Discipline = 'batting' | 'bowling' | 'both';
export type Hand = 'right' | 'left';
export type BowlingSpeciality = 'pace' | 'medium' | 'off-spin' | 'leg-spin' | 'left-arm-orthodox';
export type BattingOrder = 'opener' | 'top-order' | 'middle-order' | 'finisher' | 'tail';
export type Level = 'recreational' | 'school' | 'club' | 'district' | 'state' | 'academy';
export type Sex = 'male' | 'female';

/* --------------------------------------------------------------- identity */

export type Identity = {
  name: string;
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
};

/* --------------------------------------------------------- cricket profile */

export type CricketProfile = {
  discipline: Discipline;
  level: Level;
  battingHand: Hand;
  battingOrder: BattingOrder;
  bowlingHand: Hand;
  speciality: BowlingSpeciality;
};

/* ------------------------------------------------------------------- goal */

/**
 * the funnel is explicit that the answer has to come out quantifiable, so a
 * goal is never free text — it is a metric, a from, a to and a date.
 */
export type Goal = {
  metric: string;
  label: string;
  unit: string;
  from: number;
  to: number;
  /** economy and similar metrics improve downwards */
  higherIsBetter: boolean;
  targetDate: string; // iso yyyy-mm-dd
};

export type AthleteProfile = Identity & CricketProfile & { goal: Goal | null };

/* ------------------------------------------------------------ progression */

export type ScorePoint = { date: string; score: number };

export type Progression = {
  ampScore: number;
  history: ScorePoint[];
  /** daily streak — game iq is the only daily pillar, so it drives this */
  streak: number;
  lastActive: string | null;
  iqPoints: number;
  iqAnswered: number;
  iqCorrect: number;
  /** iso week key -> ids of that week's completed actions */
  weekActions: Record<string, string[]>;
  /** true once the free first report has been run */
  hasFirstReport: boolean;
  subscribed: boolean;
};

/* -------------------------------------------------------------------- gym */

export type LoggedSet = { kg: number; reps: number; done: boolean };

export type LoggedExercise = {
  id: string;
  exerciseId: string;
  name: string;
  muscle: string;
  sets: LoggedSet[];
  note?: string;
};

export type Workout = {
  id: string;
  name: string;
  startedAt: number;
  endedAt?: number;
  exercises: LoggedExercise[];
};

export type GymState = {
  active: Workout | null;
  history: Workout[];
};

export type MatchState = {
  activeId: string | null;
  /** newest first */
  matches: import('../match/types').Match[];
};

export type ThemeChoice = 'light' | 'dark' | 'system';

export type Settings = {
  /** defaults to light: amp is a daylight product and most athletes leave the
   *  os on dark, which was silently deciding the look of the whole app */
  theme: ThemeChoice;
};

export const DEFAULT_SETTINGS: Settings = { theme: 'light' };

export type AppState = {
  onboarded: boolean;
  settings: Settings;
  profile: AthleteProfile;
  progression: Progression;
  gym: GymState;
  match: MatchState;
};

/* --------------------------------------------------------------- defaults */

export const DEFAULT_PROFILE: AthleteProfile = {
  name: '',
  sex: 'male',
  ageYears: 17,
  heightCm: 172,
  weightKg: 64,
  discipline: 'batting',
  level: 'club',
  battingHand: 'right',
  battingOrder: 'top-order',
  bowlingHand: 'right',
  speciality: 'pace',
  goal: null,
};

export const DEFAULT_PROGRESSION: Progression = {
  ampScore: 0,
  history: [],
  streak: 0,
  lastActive: null,
  iqPoints: 0,
  iqAnswered: 0,
  iqCorrect: 0,
  weekActions: {},
  hasFirstReport: false,
  subscribed: false,
};

export const DEFAULT_GYM: GymState = { active: null, history: [] };

export const DEFAULT_MATCH: MatchState = { activeId: null, matches: [] };

/* ---------------------------------------------------------------- helpers */

/** what the record screen shows instead of re-asking five questions. */
export function profileSummary(p: AthleteProfile): string {
  const bits: string[] = [`${p.ageYears}y`, p.level];
  if (p.discipline !== 'bowling') bits.push(`${p.battingHand}-hand ${p.battingOrder}`);
  if (p.discipline !== 'batting') bits.push(`${p.bowlingHand}-arm ${p.speciality}`);
  return bits.join(' · ');
}

export const LEAGUES = [
  { key: 'bronze', label: 'bronze', at: 0, colour: '#B07A45' },
  { key: 'silver', label: 'silver', at: 400, colour: '#9AA0A6' },
  { key: 'gold', label: 'gold', at: 1200, colour: '#DFA82B' },
  { key: 'sapphire', label: 'sapphire', at: 2600, colour: '#3B82C4' },
] as const;

export function leagueFor(points: number) {
  return [...LEAGUES].reverse().find((l) => points >= l.at) ?? LEAGUES[0];
}
