/**
 * gym is one of the four pillars: track sessions, build a routine, s&c plus
 * mobility, escalating to physio. the catalogue is cricket-weighted — rotational
 * power, posterior chain and shoulder health, not a generic bodybuilding split.
 */

export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  /** why a cricketer is doing it — shown under the name when picking */
  note?: string;
};

export const MUSCLES = ['legs', 'posterior', 'push', 'pull', 'core', 'rotational', 'shoulder', 'mobility'] as const;

export const EXERCISES: Exercise[] = [
  { id: 'squat', name: 'back squat', muscle: 'legs', note: 'base for the front-foot brace' },
  { id: 'split-squat', name: 'bulgarian split squat', muscle: 'legs', note: 'single-leg stability at the crease' },
  { id: 'trapbar', name: 'trap bar deadlift', muscle: 'posterior', note: 'safe loading for a growing back' },
  { id: 'rdl', name: 'romanian deadlift', muscle: 'posterior', note: 'hamstring length for fast bowlers' },
  { id: 'hipthrust', name: 'hip thrust', muscle: 'posterior' },
  { id: 'bench', name: 'bench press', muscle: 'push' },
  { id: 'incline-db', name: 'incline dumbbell press', muscle: 'push' },
  { id: 'ohp', name: 'overhead press', muscle: 'shoulder', note: 'watch volume in season' },
  { id: 'row', name: 'barbell row', muscle: 'pull' },
  { id: 'pullup', name: 'pull-up', muscle: 'pull' },
  { id: 'facepull', name: 'face pull', muscle: 'shoulder', note: 'rear-delt and cuff health' },
  { id: 'ytw', name: 'y-t-w raise', muscle: 'shoulder', note: 'bowling shoulder prehab' },
  { id: 'palloff', name: 'pallof press', muscle: 'core', note: 'anti-rotation — holds the trunk at delivery' },
  { id: 'deadbug', name: 'dead bug', muscle: 'core' },
  { id: 'sidplank', name: 'side plank', muscle: 'core' },
  { id: 'medball', name: 'med ball rotational throw', muscle: 'rotational', note: 'the closest thing to a bat swing' },
  { id: 'cablechop', name: 'cable chop', muscle: 'rotational' },
  { id: 'landmine', name: 'landmine rotation', muscle: 'rotational' },
  { id: 'nordic', name: 'nordic curl', muscle: 'posterior', note: 'hamstring injury insurance' },
  { id: 'calf', name: 'calf raise', muscle: 'legs' },
  { id: 'hipflexor', name: '90/90 hip switch', muscle: 'mobility' },
  { id: 'tspine', name: 't-spine opener', muscle: 'mobility', note: 'rotation for the trunk' },
  { id: 'ankle', name: 'ankle rock', muscle: 'mobility' },
];

export const byId = (id: string) => EXERCISES.find((e) => e.id === id);

/** starter routines the athlete can load in one tap. */
export const ROUTINES: { id: string; name: string; sub: string; exercises: string[] }[] = [
  {
    id: 'power',
    name: 'lower power',
    sub: 'legs + posterior chain',
    exercises: ['trapbar', 'split-squat', 'nordic', 'calf', 'palloff'],
  },
  {
    id: 'rotational',
    name: 'rotational day',
    sub: 'bat and ball speed',
    exercises: ['medball', 'cablechop', 'landmine', 'deadbug', 'tspine'],
  },
  {
    id: 'shoulder',
    name: 'bowling shoulder',
    sub: 'prehab + pull volume',
    exercises: ['facepull', 'ytw', 'row', 'pullup', 'sidplank'],
  },
  {
    id: 'upper',
    name: 'upper strength',
    sub: 'push + pull',
    exercises: ['bench', 'row', 'ohp', 'pullup', 'facepull'],
  },
];

export const fmtDuration = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
};
