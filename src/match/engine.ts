import {
  type Ball,
  type Innings,
  type Match,
  type Team,
  type Extra,
  type Wicket,
  NOT_BOWLERS_WICKET,
} from './types';

/* ------------------------------------------------------------------ rules */

/** wides and no-balls do not count toward the six. */
export const isLegal = (b: Ball) => b.extra !== 'wd' && b.extra !== 'nb';

/**
 * runs the batters physically ran, which is what decides who is on strike.
 * the automatic penalty run on a wide or no-ball is not run, so it doesn't
 * rotate the strike — a wide that goes for one is still a change of ends only
 * if they actually completed a run.
 */
export function runsRun(b: Ball): number {
  switch (b.extra) {
    case 'wd':
      return b.extraRuns - 1;
    case 'nb':
      return b.runsOffBat + Math.max(0, b.extraRuns - 1);
    case 'b':
    case 'lb':
      return b.extraRuns;
    default:
      return b.runsOffBat;
  }
}

export const ballTotal = (b: Ball) => b.runsOffBat + b.extraRuns;

/* --------------------------------------------------------------- derived */

export function legalBalls(inn: Innings) {
  return inn.balls.filter(isLegal).length;
}

export function oversText(inn: Innings) {
  const n = legalBalls(inn);
  return `${Math.floor(n / 6)}.${n % 6}`;
}

export function totalRuns(inn: Innings) {
  return inn.balls.reduce((s, b) => s + ballTotal(b), 0);
}

export function wickets(inn: Innings) {
  return inn.balls.filter((b) => b.wicket).length;
}

export function extrasBreakdown(inn: Innings) {
  const out = { wd: 0, nb: 0, b: 0, lb: 0, total: 0 };
  for (const ball of inn.balls) {
    if (!ball.extra) continue;
    out[ball.extra] += ball.extraRuns;
    out.total += ball.extraRuns;
  }
  return out;
}

export function runRate(inn: Innings) {
  const n = legalBalls(inn);
  return n === 0 ? 0 : (totalRuns(inn) / n) * 6;
}

/** balls left in the innings, given the match's over limit. */
export function ballsRemaining(inn: Innings, overs: number) {
  return Math.max(0, overs * 6 - legalBalls(inn));
}

export function requiredRate(inn: Innings, overs: number) {
  if (inn.target === undefined) return null;
  const left = ballsRemaining(inn, overs);
  if (left === 0) return null;
  return ((inn.target - totalRuns(inn)) / left) * 6;
}

/** the current over's balls, in order. */
export function currentOverBalls(inn: Innings) {
  const n = legalBalls(inn);
  const overIdx = Math.floor(n / 6) - (n % 6 === 0 && n > 0 ? 1 : 0);
  return inn.balls.filter((b) => b.over === overIdx);
}

export const overComplete = (inn: Innings) => {
  const n = legalBalls(inn);
  return n > 0 && n % 6 === 0;
};

export type BatterCard = {
  playerId: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  sr: number;
  out: Wicket | null;
  batted: boolean;
};

export function battingCard(inn: Innings, team: Team): BatterCard[] {
  const seen = new Map<string, BatterCard>();
  const ensure = (id: string) => {
    if (!seen.has(id))
      seen.set(id, { playerId: id, runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, out: null, batted: true });
    return seen.get(id)!;
  };

  for (const b of inn.balls) {
    const s = ensure(b.strikerId);
    s.runs += b.runsOffBat;
    // a wide is not a ball faced; a no-ball is
    if (b.extra !== 'wd') s.balls += 1;
    if (b.runsOffBat === 4) s.fours += 1;
    if (b.runsOffBat === 6) s.sixes += 1;
    if (b.wicket) ensure(b.wicket.outId).out = b.wicket;
  }

  // include the two currently in, even before they've faced a ball
  ensure(inn.strikerId);
  ensure(inn.nonStrikerId);

  const cards = [...seen.values()].map((c) => ({ ...c, sr: c.balls ? (c.runs / c.balls) * 100 : 0 }));
  // keep the team's batting order
  return cards.sort(
    (a, b) => team.players.findIndex((p) => p.id === a.playerId) - team.players.findIndex((p) => p.id === b.playerId),
  );
}

export type BowlerCard = {
  playerId: string;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
  economy: number;
};

export function bowlingCard(inn: Innings): BowlerCard[] {
  const map = new Map<string, BowlerCard>();
  const ensure = (id: string) => {
    if (!map.has(id)) map.set(id, { playerId: id, balls: 0, runs: 0, wickets: 0, maidens: 0, economy: 0 });
    return map.get(id)!;
  };

  for (const b of inn.balls) {
    const c = ensure(b.bowlerId);
    if (isLegal(b)) c.balls += 1;
    // byes and leg-byes are not charged to the bowler
    c.runs += b.runsOffBat + (b.extra === 'b' || b.extra === 'lb' ? 0 : b.extraRuns);
    if (b.wicket && !NOT_BOWLERS_WICKET.includes(b.wicket.kind)) c.wickets += 1;
  }

  // a maiden is a completed over conceding nothing chargeable
  const byOver = new Map<number, Ball[]>();
  for (const b of inn.balls) byOver.set(b.over, [...(byOver.get(b.over) ?? []), b]);
  for (const [, balls] of byOver) {
    if (balls.filter(isLegal).length < 6) continue;
    const conceded = balls.reduce(
      (s, b) => s + b.runsOffBat + (b.extra === 'b' || b.extra === 'lb' ? 0 : b.extraRuns),
      0,
    );
    if (conceded === 0) ensure(balls[0].bowlerId).maidens += 1;
  }

  return [...map.values()].map((c) => ({ ...c, economy: c.balls ? (c.runs / c.balls) * 6 : 0 }));
}

export const oversFor = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;

/* ---------------------------------------------------------------- apply */

export type BallInput = {
  /** runs off the bat. omitted for extras that never reach the bat. */
  runsOffBat?: number;
  extra?: Extra;
  /** additional runs beyond the automatic penalty on wd/nb, or the bye count */
  extraRuns?: number;
  wicket?: Wicket;
  shot?: string;
  region?: string;
};

/**
 * records one ball and advances the innings: credits the runs, rotates the
 * strike on odd runs run, and swaps ends when the over closes.
 */
export function applyBall(inn: Innings, input: BallInput): Innings {
  if (!inn.bowlerId) return inn;

  const before = legalBalls(inn);
  const over = Math.floor(before / 6);

  const penalty = input.extra === 'wd' || input.extra === 'nb' ? 1 : 0;
  const ball: Ball = {
    id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    over,
    bowlerId: inn.bowlerId,
    strikerId: inn.strikerId,
    nonStrikerId: inn.nonStrikerId,
    runsOffBat: input.runsOffBat ?? 0,
    extra: input.extra,
    extraRuns: input.extra ? penalty + (input.extraRuns ?? 0) : 0,
    wicket: input.wicket,
    shot: input.shot,
    region: input.region,
  };

  const balls = [...inn.balls, ball];
  let striker = inn.strikerId;
  let nonStriker = inn.nonStrikerId;

  if (runsRun(ball) % 2 === 1) [striker, nonStriker] = [nonStriker, striker];

  const after = balls.filter(isLegal).length;
  const closes = after > 0 && after % 6 === 0 && after !== before;
  if (closes) [striker, nonStriker] = [nonStriker, striker];

  return {
    ...inn,
    balls,
    strikerId: striker,
    nonStrikerId: nonStriker,
    out: ball.wicket ? [...inn.out, ball.wicket.outId] : inn.out,
    // the bowler must change at the end of an over
    bowlerId: closes ? null : inn.bowlerId,
  };
}

/** rebuilds the innings state from the ball log, minus the last ball. */
export function undoBall(inn: Innings, openers: [string, string]): Innings {
  if (inn.balls.length === 0) return inn;
  const balls = inn.balls.slice(0, -1);
  return replay(inn, balls, openers);
}

function replay(inn: Innings, balls: Ball[], openers: [string, string]): Innings {
  let striker = openers[0];
  let nonStriker = openers[1];
  const out: string[] = [];

  balls.forEach((b, i) => {
    striker = b.strikerId;
    nonStriker = b.nonStrikerId;
    if (b.wicket) out.push(b.wicket.outId);
    if (runsRun(b) % 2 === 1) [striker, nonStriker] = [nonStriker, striker];
    const legalSoFar = balls.slice(0, i + 1).filter(isLegal).length;
    if (legalSoFar > 0 && legalSoFar % 6 === 0 && isLegal(b)) [striker, nonStriker] = [nonStriker, striker];
  });

  const n = balls.filter(isLegal).length;
  const closed = n > 0 && n % 6 === 0;

  return {
    ...inn,
    balls,
    strikerId: striker,
    nonStrikerId: nonStriker,
    out,
    bowlerId: closed ? null : (balls[balls.length - 1]?.bowlerId ?? inn.bowlerId),
  };
}

/* --------------------------------------------------- innings + result */

/** an innings ends on overs, on wickets, or on the target being passed. */
export function inningsEnd(
  inn: Innings,
  overs: number,
  squadSize: number,
): 'overs' | 'all out' | 'chased' | null {
  if (inn.target !== undefined && totalRuns(inn) >= inn.target) return 'chased';
  // last man standing: you cannot bat with one batter left
  if (wickets(inn) >= squadSize - 1) return 'all out';
  if (legalBalls(inn) >= overs * 6) return 'overs';
  return null;
}

/** opens the chase off the back of a completed first innings. */
export function startSecondInnings(match: Match): Match {
  const first = match.innings[0];
  const bat = teamById(match, first.bowlingTeamId);
  const bowl = teamById(match, first.battingTeamId);

  return {
    ...match,
    innings: [
      { ...first, closed: true },
      {
        battingTeamId: bat.id,
        bowlingTeamId: bowl.id,
        balls: [],
        strikerId: bat.players[0].id,
        nonStrikerId: bat.players[1].id,
        bowlerId: null,
        out: [],
        target: totalRuns(first) + 1,
        closed: false,
      },
    ],
  };
}

/** the result line, once the second innings is done. */
export function resultText(match: Match): string | null {
  if (match.innings.length < 2) return null;
  const [first, second] = match.innings;
  const chasing = teamById(match, second.battingTeamId);
  const defending = teamById(match, first.battingTeamId);

  const target = second.target ?? totalRuns(first) + 1;
  const got = totalRuns(second);

  if (got >= target) {
    const left = chasing.players.length - 1 - wickets(second);
    return `${chasing.name} won by ${left} wicket${left === 1 ? '' : 's'}`;
  }
  if (got === target - 1) return 'match tied';
  return `${defending.name} won by ${target - 1 - got} run${target - 1 - got === 1 ? '' : 's'}`;
}

export function closeMatch(match: Match): Match {
  return { ...match, status: 'done', result: resultText(match) ?? undefined };
}

/** the batter who has to be replaced after a wicket, if any. */
export function pendingBatter(inn: Innings): string | null {
  const last = inn.balls[inn.balls.length - 1];
  if (!last?.wicket) return null;
  const outId = last.wicket.outId;
  return inn.strikerId === outId || inn.nonStrikerId === outId ? outId : null;
}

export function replaceBatter(inn: Innings, outId: string, inId: string): Innings {
  return {
    ...inn,
    strikerId: inn.strikerId === outId ? inId : inn.strikerId,
    nonStrikerId: inn.nonStrikerId === outId ? inId : inn.nonStrikerId,
  };
}

/** who is still available to bat. */
export function availableBatters(inn: Innings, team: Team) {
  return team.players.filter(
    (p) => !inn.out.includes(p.id) && p.id !== inn.strikerId && p.id !== inn.nonStrikerId,
  );
}

/** who may bowl the next over: not the previous over's bowler, quota respected. */
export function availableBowlers(inn: Innings, team: Team, oversPerBowler: number) {
  const cards = bowlingCard(inn);
  const lastOver = inn.balls[inn.balls.length - 1]?.bowlerId;
  return team.players.filter((p) => {
    if (p.id === lastOver) return false;
    const c = cards.find((x) => x.playerId === p.id);
    return !c || Math.floor(c.balls / 6) < oversPerBowler;
  });
}

/** commentary line for one ball, in the app's voice. */
export function describe(b: Ball, name: (id: string) => string): string {
  const bowler = name(b.bowlerId);
  const striker = name(b.strikerId);

  if (b.wicket) {
    const who = name(b.wicket.outId);
    if (b.wicket.kind === 'run out') return `${who} run out${b.wicket.fielderId ? ` (${name(b.wicket.fielderId)})` : ''}`;
    if (b.wicket.kind === 'retired') return `${who} retired`;
    return `${bowler} to ${striker}, ${who} ${b.wicket.kind}`;
  }
  if (b.extra === 'wd') return `${bowler} to ${striker}, wide${b.extraRuns > 1 ? ` + ${b.extraRuns - 1}` : ''}`;
  if (b.extra === 'nb') return `${bowler} to ${striker}, no ball, ${b.runsOffBat} off the bat`;
  if (b.extra === 'b') return `${bowler} to ${striker}, ${b.extraRuns} bye${b.extraRuns > 1 ? 's' : ''}`;
  if (b.extra === 'lb') return `${bowler} to ${striker}, ${b.extraRuns} leg bye${b.extraRuns > 1 ? 's' : ''}`;
  if (b.runsOffBat === 6) return `${bowler} to ${striker}, SIX${b.region ? ` over ${b.region}` : ''}`;
  if (b.runsOffBat === 4) return `${bowler} to ${striker}, FOUR${b.region ? ` through ${b.region}` : ''}`;
  if (b.runsOffBat === 0) return `${bowler} to ${striker}, no run`;
  return `${bowler} to ${striker}, ${b.runsOffBat} run${b.runsOffBat > 1 ? 's' : ''}`;
}

/** short label for the over strip: 1, 4, 6, W, wd, 2nb… */
export function ballChip(b: Ball): string {
  if (b.wicket) return 'W';
  if (b.extra === 'wd') return b.extraRuns > 1 ? `${b.extraRuns - 1}wd` : 'wd';
  if (b.extra === 'nb') return b.runsOffBat > 0 ? `${b.runsOffBat}nb` : 'nb';
  if (b.extra === 'b') return `${b.extraRuns}b`;
  if (b.extra === 'lb') return `${b.extraRuns}lb`;
  return String(b.runsOffBat);
}

/**
 * the over.ball label for each delivery. an illegal ball carries the number of
 * the legal delivery it will be re-bowled as, which is how scorecards read it.
 */
export function ballNumbers(inn: Innings): Record<string, string> {
  const out: Record<string, string> = {};
  const legalInOver = new Map<number, number>();
  for (const b of inn.balls) {
    const done = legalInOver.get(b.over) ?? 0;
    const next = isLegal(b) ? done + 1 : done + 1;
    out[b.id] = `${b.over}.${next}`;
    if (isLegal(b)) legalInOver.set(b.over, done + 1);
  }
  return out;
}

export function nameLookup(match: Match) {
  const all = new Map<string, string>();
  match.teams.forEach((t) => t.players.forEach((p) => all.set(p.id, p.name)));
  return (id: string) => all.get(id) ?? 'unknown';
}

export const teamById = (m: Match, id: string) => m.teams.find((t) => t.id === id)!;
