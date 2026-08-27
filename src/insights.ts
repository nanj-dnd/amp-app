import type { Match, Ball } from './match/types';
import { isLegal, ballTotal } from './match/engine';
import { NOT_BOWLERS_WICKET } from './match/types';
import type { Discipline } from './state/types';

/**
 * the join between the scorer and the rest of amp.
 *
 * a video report scores technique; a scored match scores outcomes. both land in
 * the same breakdown on the progress screen, tagged by where they came from,
 * because "your bat path is 60" and "you score 78% of your runs square of the
 * wicket" are answers to the same question from opposite ends.
 */

export type Insight = {
  name: string;
  /** 0–100, same scale as the amp score so the two can sit in one list */
  score: number;
  source: 'video' | 'match';
  detail: string;
};

export type RegionTally = { region: string; runs: number; balls: number; boundaries: number };

/** every ball this athlete faced, across every match they were marked in. */
export function ballsFaced(matches: Match[]): Ball[] {
  const out: Ball[] = [];
  for (const m of matches) {
    if (!m.athletePlayerId) continue;
    for (const inn of m.innings)
      for (const b of inn.balls) if (b.strikerId === m.athletePlayerId) out.push(b);
  }
  return out;
}

/** every ball this athlete bowled. */
export function ballsBowled(matches: Match[]): Ball[] {
  const out: Ball[] = [];
  for (const m of matches) {
    if (!m.athletePlayerId) continue;
    for (const inn of m.innings)
      for (const b of inn.balls) if (b.bowlerId === m.athletePlayerId) out.push(b);
  }
  return out;
}

/** canonical side of the wicket for a region, as a right-hander sees it. */
const OFF_SIDE = new Set(['third-man', 'point', 'cover', 'long-off']);
const REGION_IDS = ['third-man', 'point', 'cover', 'long-off', 'long-on', 'midwicket', 'square-leg', 'fine-leg'];

export function scoringAreas(matches: Match[]): RegionTally[] {
  const tally = new Map<string, RegionTally>(
    REGION_IDS.map((r) => [r, { region: r, runs: 0, balls: 0, boundaries: 0 }]),
  );
  for (const b of ballsFaced(matches)) {
    if (!b.region) continue;
    const t = tally.get(b.region);
    if (!t) continue;
    t.runs += b.runsOffBat;
    t.balls += 1;
    if (b.runsOffBat >= 4) t.boundaries += 1;
  }
  return [...tally.values()];
}

/** clamp a raw ratio onto 0–100 against a "this is good" and "this is bad" pair. */
function band(value: number, bad: number, good: number): number {
  const t = (value - bad) / (good - bad);
  return Math.round(Math.max(0, Math.min(1, t)) * 100);
}

/** below this there isn't enough evidence to put a number on screen. */
export const MIN_BALLS = 24;

export function battingInsights(matches: Match[]): Insight[] {
  const all = ballsFaced(matches);
  // a wide is not a ball faced, so it cannot count in any of these rates
  const faced = all.filter((b) => b.extra !== 'wd');
  if (faced.length < MIN_BALLS) return [];

  const n = faced.length;
  const runs = faced.reduce((s, b) => s + b.runsOffBat, 0);
  const dots = faced.filter((b) => b.runsOffBat === 0 && !b.extra).length;
  const rotated = faced.filter((b) => b.runsOffBat === 1 || b.runsOffBat === 2).length;
  const boundaries = faced.filter((b) => b.runsOffBat >= 4).length;

  const areas = scoringAreas(matches).filter((a) => a.balls > 0);
  const plotted = areas.reduce((s, a) => s + a.runs, 0);
  const off = areas.filter((a) => OFF_SIDE.has(a.region)).reduce((s, a) => s + a.runs, 0);
  const offShare = plotted > 0 ? off / plotted : 0.5;

  const out: Insight[] = [
    {
      name: 'strike rotation',
      score: band(rotated / n, 0.18, 0.5),
      source: 'match',
      detail: `${Math.round((rotated / n) * 100)}% of balls turned into 1s and 2s`,
    },
    {
      name: 'dot-ball pressure',
      // fewer dots is better, so the band runs downhill
      score: band(dots / n, 0.62, 0.28),
      source: 'match',
      detail: `${Math.round((dots / n) * 100)}% dots off ${n} balls`,
    },
    {
      name: 'boundary conversion',
      score: band(boundaries / n, 0.03, 0.18),
      source: 'match',
      detail: `${boundaries} boundaries, strike rate ${((runs / n) * 100).toFixed(0)}`,
    },
  ];

  // placement metrics need placement data, which is optional per ball
  if (plotted >= 20) {
    out.push(
      {
        name: 'scoring range',
        score: band(areas.filter((a) => a.runs > 0).length / 8, 0.25, 0.75),
        source: 'match',
        detail: `runs in ${areas.filter((a) => a.runs > 0).length} of 8 areas`,
      },
      {
        name: 'off/leg balance',
        // 50/50 is the ideal; the score falls away in either direction
        score: Math.round(100 - Math.abs(offShare - 0.5) * 200),
        source: 'match',
        detail: `${Math.round(offShare * 100)}% off side, ${Math.round((1 - offShare) * 100)}% leg side`,
      },
    );
  }

  return out;
}

export function bowlingInsights(matches: Match[]): Insight[] {
  const all = ballsBowled(matches);
  const legal = all.filter(isLegal);
  if (legal.length < MIN_BALLS) return [];

  const overs = legal.length / 6;
  // byes and leg-byes are not the bowler's runs
  const conceded = all.reduce(
    (s, b) => s + b.runsOffBat + (b.extra === 'b' || b.extra === 'lb' ? 0 : b.extraRuns),
    0,
  );
  const dots = legal.filter((b) => ballTotal(b) === 0).length;
  const wkts = all.filter((b) => b.wicket && !NOT_BOWLERS_WICKET.includes(b.wicket.kind)).length;
  const extras = all.filter((b) => b.extra === 'wd' || b.extra === 'nb').length;

  return [
    {
      name: 'economy',
      score: band(conceded / overs, 12, 4.5),
      source: 'match',
      detail: `${(conceded / overs).toFixed(2)} an over across ${overs.toFixed(1)}`,
    },
    {
      name: 'dot-ball rate',
      score: band(dots / legal.length, 0.15, 0.5),
      source: 'match',
      detail: `${Math.round((dots / legal.length) * 100)}% dots`,
    },
    {
      name: 'wicket threat',
      score: band(wkts / Math.max(1, overs), 0, 0.5),
      source: 'match',
      detail: `${wkts} wicket${wkts === 1 ? '' : 's'} in ${overs.toFixed(1)} overs`,
    },
    {
      name: 'extras control',
      score: band(extras / Math.max(1, overs), 1.6, 0.1),
      source: 'match',
      detail: `${extras} wides and no-balls`,
    },
  ];
}

export function matchInsights(matches: Match[], discipline: Discipline): Insight[] {
  const done = matches.filter((m) => m.athletePlayerId);
  if (discipline === 'batting') return battingInsights(done);
  if (discipline === 'bowling') return bowlingInsights(done);
  return [...battingInsights(done), ...bowlingInsights(done)];
}

/**
 * every match with a ball in it. deliberately not filtered by athletePlayerId —
 * a match you scored for your club is still a match you scored, and hiding it
 * because you didn't tag yourself made saved matches look lost.
 */
export function scoredMatches(matches: Match[]) {
  return matches.filter((m) => m.innings.some((i) => i.balls.length > 0));
}

/** the subset that can feed kpis, because the athlete is named in them. */
export function myMatches(matches: Match[]) {
  return scoredMatches(matches).filter((m) => m.athletePlayerId);
}
