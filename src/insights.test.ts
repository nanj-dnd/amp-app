/**
 * the kpi maths turns raw balls into 0–100 scores; assert the edges so a
 * one-sided player never accidentally reads as balanced.
 *   npm run test:insights
 */
import { battingInsights, bowlingInsights, scoringAreas, ballsFaced, MIN_BALLS } from './insights';
import type { Match, Ball } from './match/types';

const fail: string[] = [];
const eq = (label: string, got: any, want: any) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) fail.push(`${label}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
};
const near = (label: string, got: number, want: number, tol = 1) => {
  if (Math.abs(got - want) > tol) fail.push(`${label}: got ${got} want ~${want}`);
};

let seq = 0;
const ball = (p: Partial<Ball>): Ball => ({
  id: `b${seq++}`, over: 0, bowlerId: 'opp', strikerId: 'me', nonStrikerId: 'other',
  runsOffBat: 0, extraRuns: 0, ...p,
});

const matchOf = (balls: Ball[]): Match => ({
  id: 'm', createdAt: 0,
  config: { format:'limited', overs:20, oversPerBowler:4, ground:'', city:'', ballType:'tennis', pitch:'turf', captureDetail:true },
  teams: [
    { id:'A', name:'A', players:[{id:'me',name:'me'},{id:'other',name:'other'}] },
    { id:'B', name:'B', players:[{id:'opp',name:'opp'}] },
  ],
  toss: null, status:'live', athletePlayerId: 'me',
  innings: [{ battingTeamId:'A', bowlingTeamId:'B', balls, strikerId:'me', nonStrikerId:'other', bowlerId:'opp', out:[], closed:false }],
});

/* a match the athlete isn't marked in contributes nothing */
const unmarked = { ...matchOf([ball({ runsOffBat: 4 })]), athletePlayerId: undefined };
eq('unmarked matches are ignored', ballsFaced([unmarked]).length, 0);

/* below the evidence floor there is no score at all */
eq('too few balls -> no insights', battingInsights([matchOf(Array.from({length:MIN_BALLS-1},()=>ball({runsOffBat:1})))]).length, 0);

/* wides are not balls faced, so they must not dilute the rates */
const withWides = matchOf([
  ...Array.from({ length: 30 }, () => ball({ runsOffBat: 1 })),
  ...Array.from({ length: 10 }, () => ball({ extra: 'wd', extraRuns: 1 })),
]);
const rot = battingInsights([withWides]).find((i) => i.name === 'strike rotation')!;
eq('every ball rotated -> full marks', rot.score, 100);
eq('wides excluded from the denominator', rot.detail, '100% of balls turned into 1s and 2s');

/* all dots is the floor, all boundaries the ceiling */
const allDots = matchOf(Array.from({ length: 30 }, () => ball({ runsOffBat: 0 })));
eq('all dots -> zero pressure', battingInsights([allDots]).find((i) => i.name === 'dot-ball pressure')!.score, 0);

const allFours = matchOf(Array.from({ length: 30 }, () => ball({ runsOffBat: 4 })));
eq('all boundaries -> full conversion', battingInsights([allFours]).find((i) => i.name === 'boundary conversion')!.score, 100);

/* placement: a purely leg-side player must not read as balanced */
const legOnly = matchOf(Array.from({ length: 30 }, () => ball({ runsOffBat: 4, region: 'midwicket' })));
const balance = battingInsights([legOnly]).find((i) => i.name === 'off/leg balance')!;
eq('one-sided scoring scores zero balance', balance.score, 0);
eq('and says which side', balance.detail, '0% off side, 100% leg side');

const even = matchOf([
  ...Array.from({ length: 15 }, () => ball({ runsOffBat: 4, region: 'cover' })),
  ...Array.from({ length: 15 }, () => ball({ runsOffBat: 4, region: 'midwicket' })),
]);
eq('an even split scores full balance', even.innings[0].balls.length && battingInsights([even]).find((i) => i.name === 'off/leg balance')!.score, 100);

/* areas tally runs, balls and boundaries per region */
const areas = scoringAreas([legOnly]);
const mw = areas.find((a) => a.region === 'midwicket')!;
eq('region tally', [mw.runs, mw.balls, mw.boundaries], [120, 30, 30]);
eq('untouched regions stay at zero', areas.find((a) => a.region === 'cover')!.runs, 0);

/* bowling: byes are not the bowler's runs */
const bowled = (balls: Ball[]) => {
  const m = matchOf(balls);
  m.athletePlayerId = 'me';
  m.innings[0].balls = balls.map((b) => ({ ...b, bowlerId: 'me', strikerId: 'them' }));
  return m;
};
const withByes = bowled([
  ...Array.from({ length: 30 }, () => ball({ runsOffBat: 0 })),
  ...Array.from({ length: 6 }, () => ball({ extra: 'b', extraRuns: 4 })),
]);
const econ = bowlingInsights([withByes]).find((i) => i.name === 'economy')!;
eq('byes are not charged to the bowler', econ.detail, '0.00 an over across 6.0');
eq('a wicketless maiden spell is a perfect economy', econ.score, 100);

const leaky = bowled(Array.from({ length: 30 }, () => ball({ runsOffBat: 2 })));
near('two an over off every ball is a poor economy', bowlingInsights([leaky]).find((i) => i.name === 'economy')!.score, 0, 0);

if (fail.length) { console.log('FAILURES:\n' + fail.join('\n')); process.exit(1); }
console.log('all insight assertions passed');
