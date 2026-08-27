/**
 * cricket rules are easy to get subtly wrong, so the engine has assertions.
 *   npm run test:engine
 */
import { applyBall, legalBalls, totalRuns, runsRun, bowlingCard, battingCard, extrasBreakdown, undoBall, inningsEnd, startSecondInnings, resultText, ballNumbers } from './engine';
import { mirrorAngle, REGIONS } from './types';
import type { Innings, Match, Team } from './types';

const team: Team = { id: 'A', name: 'A', players: [{id:'p1',name:'one'},{id:'p2',name:'two'},{id:'p3',name:'three'}] };
let inn: Innings = { battingTeamId:'A', bowlingTeamId:'B', balls:[], strikerId:'p1', nonStrikerId:'p2', bowlerId:'b1', out:[], closed:false };

const fail: string[] = [];
const eq = (label: string, got: any, want: any) => { if (JSON.stringify(got)!==JSON.stringify(want)) fail.push(`${label}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); };

// 1. single rotates strike
inn = applyBall(inn, { runsOffBat: 1 });
eq('single rotates', inn.strikerId, 'p2');
eq('1 legal ball', legalBalls(inn), 1);

// 2. four does not rotate
inn = applyBall(inn, { runsOffBat: 4 });
eq('four keeps strike', inn.strikerId, 'p2');
eq('score 5', totalRuns(inn), 5);

// 3. wide: +1, no legal ball, no rotation
inn = applyBall(inn, { extra: 'wd' });
eq('wide not legal', legalBalls(inn), 2);
eq('wide adds 1', totalRuns(inn), 6);
eq('wide keeps strike', inn.strikerId, 'p2');

// 4. wide + 1 run run -> rotates
inn = applyBall(inn, { extra: 'wd', extraRuns: 1 });
eq('wide+1 = 2 runs', totalRuns(inn), 8);
eq('wide+1 rotates', inn.strikerId, 'p1');

// 5. no-ball with 2 off the bat: batter credited, not a legal ball
inn = applyBall(inn, { extra: 'nb', runsOffBat: 2 });
eq('nb still 2 legal', legalBalls(inn), 2);
eq('nb total +3', totalRuns(inn), 11);
eq('nb 2 runs = even, keeps strike', inn.strikerId, 'p1');

// 6. leg byes count as a legal ball, runs not to batter
inn = applyBall(inn, { extra: 'lb', extraRuns: 2 });
eq('lb legal', legalBalls(inn), 3);
eq('lb +2', totalRuns(inn), 13);

// finish the over: 3 more legal balls
inn = applyBall(inn, { runsOffBat: 0 });
inn = applyBall(inn, { runsOffBat: 0 });
eq('5 legal', legalBalls(inn), 5);
const strikerBeforeOverEnd = inn.strikerId;
inn = applyBall(inn, { runsOffBat: 0 });
eq('6 legal', legalBalls(inn), 6);
eq('over end swaps strike', inn.strikerId, strikerBeforeOverEnd === 'p1' ? 'p2' : 'p1');
eq('bowler cleared at over end', inn.bowlerId, null);

// bowler figures: byes/leg-byes not charged
const bc = bowlingCard(inn)[0];
eq('bowler balls', bc.balls, 6);
eq('bowler runs excludes lb', bc.runs, 11);

const ex = extrasBreakdown(inn);
eq('extras', [ex.wd, ex.nb, ex.lb, ex.total], [3, 1, 2, 6]);

// batter faced counts: wide is not a ball faced, no-ball is
const cards = battingCard(inn, team);
const p1 = cards.find(c=>c.playerId==='p1')!;
const p2 = cards.find(c=>c.playerId==='p2')!;
eq('p1+p2 balls faced = 6 legal + 1 nb', p1.balls + p2.balls, 7);

// wicket credit
inn = { ...inn, bowlerId: 'b2' };
inn = applyBall(inn, { runsOffBat: 0, wicket: { kind: 'bowled', outId: inn.strikerId } });
eq('wicket recorded', inn.out.length, 1);
eq('bowler credited', bowlingCard(inn).find(c=>c.playerId==='b2')!.wickets, 1);

// run out is not the bowler's wicket
inn = applyBall(inn, { runsOffBat: 1, wicket: { kind: 'run out', outId: 'p3' } });
eq('run out not credited', bowlingCard(inn).find(c=>c.playerId==='b2')!.wickets, 1);

// undo restores
const before = totalRuns(inn);
const undone = undoBall(inn, ['p1','p2']);
eq('undo removes the run', totalRuns(undone), before - 1);
eq('undo removes the wicket', undone.out.length, 1);

// maiden detection
let m: Innings = { battingTeamId:'A', bowlingTeamId:'B', balls:[], strikerId:'p1', nonStrikerId:'p2', bowlerId:'m1', out:[], closed:false };
for (let i=0;i<6;i++) m = applyBall(m, { runsOffBat: 0 });
eq('maiden', bowlingCard(m)[0].maidens, 1);

let m2: Innings = { battingTeamId:'A', bowlingTeamId:'B', balls:[], strikerId:'p1', nonStrikerId:'p2', bowlerId:'m1', out:[], closed:false };
for (let i=0;i<5;i++) m2 = applyBall(m2, { runsOffBat: 0 });
m2 = applyBall(m2, { extra:'lb', extraRuns: 1 });
eq('leg byes still a maiden', bowlingCard(m2)[0].maidens, 1);

/* ---------------------------------------------- innings end + result */

const squad = (n: number, p: string) => Array.from({length:n},(_,i)=>({id:`${p}${i}`,name:`${p}${i}`}));
const mkInn = (over: string[], target?: number): Innings =>
  ({ battingTeamId:'A', bowlingTeamId:'B', balls:[], strikerId:over[0], nonStrikerId:over[1], bowlerId:'x', out:[], target, closed:false });

// overs exhausted
let e1 = mkInn(['a0','a1']);
for (let i=0;i<12;i++) e1 = applyBall({...e1, bowlerId:'x'}, { runsOffBat: 0 });
eq('2 overs bowled ends a 2-over innings', inningsEnd(e1, 2, 11), 'overs');
eq('not over at 3 overs allowed', inningsEnd(e1, 3, 11), null);

// all out — 11 a side means 10 wickets
let e2 = mkInn(['a0','a1']);
for (let i=0;i<10;i++) e2 = applyBall({...e2, bowlerId:'x'}, { runsOffBat: 0, wicket:{ kind:'bowled', outId:`a${i}` } });
eq('all out at 10 down', inningsEnd(e2, 20, 11), 'all out');

// a 4-a-side game is all out at 3
let e3 = mkInn(['a0','a1']);
for (let i=0;i<3;i++) e3 = applyBall({...e3, bowlerId:'x'}, { runsOffBat: 0, wicket:{ kind:'bowled', outId:`a${i}` } });
eq('small squads go all out sooner', inningsEnd(e3, 20, 4), 'all out');

// chase completed
let e4 = mkInn(['a0','a1'], 10);
for (let i=0;i<3;i++) e4 = applyBall({...e4, bowlerId:'x'}, { runsOffBat: 4 });
eq('target passed ends it', inningsEnd(e4, 20, 11), 'chased');

// second innings inherits the right target and swaps the sides
const teamA: Team = { id:'A', name:'Alpha', players: squad(11,'a') };
const teamB: Team = { id:'B', name:'Beta', players: squad(11,'b') };
let first: Innings = { battingTeamId:'A', bowlingTeamId:'B', balls:[], strikerId:'a0', nonStrikerId:'a1', bowlerId:'b0', out:[], closed:false };
for (let i=0;i<6;i++) first = applyBall({...first, bowlerId:'b0'}, { runsOffBat: 4 });
let match: Match = { id:'m', createdAt:0, config:{format:'limited',overs:1,oversPerBowler:1,ground:'',city:'',ballType:'tennis',pitch:'turf',captureDetail:false}, teams:[teamA,teamB], toss:{wonBy:'A',elected:'bat'}, innings:[first], status:'live' };
match = startSecondInnings(match);
eq('target is one more than the first innings', match.innings[1].target, 25);
eq('sides swap', [match.innings[1].battingTeamId, match.innings[1].bowlingTeamId], ['B','A']);
eq('first innings closed', match.innings[0].closed, true);

// results
const chase = (runs: number, wkts: number) => {
  let inn = { ...match.innings[1] };
  for (let i=0;i<Math.floor(runs/1);i++) inn = applyBall({...inn, bowlerId:'a0'}, { runsOffBat: 1 });
  for (let i=0;i<wkts;i++) inn = applyBall({...inn, bowlerId:'a0'}, { runsOffBat: 0, wicket:{kind:'bowled', outId:`b${i}`} });
  return { ...match, innings: [match.innings[0], inn] };
};
eq('defending side wins by runs', resultText(chase(20,0)), 'Alpha won by 4 runs');
eq('tie', resultText(chase(24,0)), 'match tied');
eq('chasing side wins by wickets', resultText(chase(25,2)), 'Beta won by 8 wickets');

/* ---------------------------------------------------- ball numbering */
let bn: Innings = { battingTeamId:'A', bowlingTeamId:'B', balls:[], strikerId:'a0', nonStrikerId:'a1', bowlerId:'b0', out:[], closed:false };
bn = applyBall(bn, { runsOffBat: 1 });
bn = applyBall({...bn, bowlerId:'b0'}, { extra: 'wd' });
bn = applyBall({...bn, bowlerId:'b0'}, { runsOffBat: 2 });
const nums = Object.values(ballNumbers(bn));
eq('an illegal ball carries the number it will be re-bowled as', nums, ['0.1','0.2','0.2']);

/* ------------------------------------------------ left-hand mirroring */
const byId = (id: string) => REGIONS.find(r => r.id === id)!.angle;
eq('square leg mirrors to the far side', mirrorAngle(byId('square-leg')), 180);
eq('point mirrors to where square leg was', mirrorAngle(byId('point')), 0);
eq('cover mirrors onto midwicket', mirrorAngle(byId('cover')), mirrorAngle(215));
eq('mirroring twice is the identity', REGIONS.map(r => mirrorAngle(mirrorAngle(r.angle))), REGIONS.map(r => r.angle));
eq('every mirrored angle stays in range', REGIONS.every(r => mirrorAngle(r.angle) >= 0 && mirrorAngle(r.angle) < 360), true);

if (fail.length) { console.log('FAILURES:\n' + fail.join('\n')); process.exit(1); }
console.log('all engine assertions passed');
