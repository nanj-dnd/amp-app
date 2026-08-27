/** cricket scoring model. one Ball is the atomic record; everything else derives. */

export type Format = 'limited' | 'box' | 'pair' | 'hundred' | 'test';
export type BallType = 'tennis' | 'leather' | 'other';
export type PitchType = 'turf' | 'matting' | 'cement' | 'astroturf' | 'rough';

export type Player = {
  id: string;
  name: string;
  /** drives which way round the wagon wheel is drawn for this batter */
  battingHand?: 'right' | 'left';
  /** shown against the bowler, and the matchup half of any bowling read */
  bowlingArm?: 'right' | 'left';
};

export type Team = {
  id: string;
  name: string;
  players: Player[];
  captainId?: string;
  keeperId?: string;
};

export type MatchConfig = {
  format: Format;
  overs: number;
  oversPerBowler: number;
  ground: string;
  city: string;
  ballType: BallType;
  pitch: PitchType;
  /** capture shot type + wagon wheel per scoring ball. this is the data that
   *  feeds an athlete's kpis, so it's on by default and skippable per ball. */
  captureDetail: boolean;
};

export type Extra = 'wd' | 'nb' | 'b' | 'lb';

export type WicketKind =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'run out'
  | 'stumped'
  | 'hit wicket'
  | 'caught & bowled'
  | 'retired';

/** dismissals the bowler is not credited with. */
export const NOT_BOWLERS_WICKET: WicketKind[] = ['run out', 'retired'];

export type Wicket = {
  kind: WicketKind;
  /** which batter is out — may be the non-striker on a run out */
  outId: string;
  fielderId?: string;
};

export type Ball = {
  id: string;
  /** 0-based over index this ball belongs to */
  over: number;
  bowlerId: string;
  strikerId: string;
  nonStrikerId: string;
  /** runs credited to the batter */
  runsOffBat: number;
  extra?: Extra;
  /** every run credited as an extra, including the automatic 1 for wd/nb */
  extraRuns: number;
  wicket?: Wicket;
  shot?: string;
  /** wagon wheel region, see REGIONS */
  region?: string;
};

export type Innings = {
  battingTeamId: string;
  bowlingTeamId: string;
  balls: Ball[];
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string | null;
  /** batters dismissed, in order of dismissal */
  out: string[];
  target?: number;
  closed: boolean;
};

export type Match = {
  id: string;
  createdAt: number;
  config: MatchConfig;
  teams: [Team, Team];
  toss: { wonBy: string; elected: 'bat' | 'bowl' } | null;
  innings: Innings[];
  status: 'setup' | 'live' | 'done';
  result?: string;
  /**
   * which player in this match is the amp athlete. set it and every ball they
   * face or bowl feeds their kpis — this is the whole reason the scorer lives
   * in this app rather than beside it.
   */
  athletePlayerId?: string;
};

/* -------------------------------------------------------------- catalogue */

export const FORMATS: { value: Format; label: string; overs: number }[] = [
  { value: 'limited', label: 'limited overs', overs: 20 },
  { value: 'box', label: 'box cricket', overs: 8 },
  { value: 'pair', label: 'pair cricket', overs: 10 },
  { value: 'hundred', label: 'the hundred', overs: 20 },
  { value: 'test', label: 'test', overs: 90 },
];

export const BALL_TYPES: { value: BallType; label: string }[] = [
  { value: 'tennis', label: 'tennis' },
  { value: 'leather', label: 'leather' },
  { value: 'other', label: 'other' },
];

export const PITCH_TYPES: { value: PitchType; label: string }[] = [
  { value: 'turf', label: 'turf' },
  { value: 'matting', label: 'matting' },
  { value: 'cement', label: 'cement' },
  { value: 'astroturf', label: 'astroturf' },
  { value: 'rough', label: 'rough' },
];

export const WICKET_KINDS: WicketKind[] = [
  'bowled',
  'caught',
  'lbw',
  'run out',
  'stumped',
  'hit wicket',
  'caught & bowled',
  'retired',
];

/**
 * wagon wheel regions for a right-hander, drawn with the bowler running in from
 * the top: off side left, leg side right, straight hitting toward the bottom.
 * angles are standard maths convention — 0° right, 90° up.
 */
export const REGIONS = [
  { id: 'third-man', label: 'third man', angle: 135 },
  { id: 'point', label: 'point', angle: 180 },
  { id: 'cover', label: 'cover', angle: 215 },
  { id: 'long-off', label: 'long off', angle: 250 },
  { id: 'long-on', label: 'long on', angle: 290 },
  { id: 'midwicket', label: 'midwicket', angle: 325 },
  { id: 'square-leg', label: 'square leg', angle: 0 },
  { id: 'fine-leg', label: 'fine leg', angle: 45 },
] as const;

/** mirrored for a left-hander — off and leg swap sides. */
export const mirrorAngle = (a: number) => (180 - a + 360) % 360;

export const SHOTS = [
  'defence',
  'punch',
  'straight drive',
  'on drive',
  'cover drive',
  'cut',
  'pull',
  'sweep',
  'flick',
  'lofted',
  'step out',
] as const;

export const emptyTeam = (name: string): Team => ({
  id: `t-${Math.random().toString(36).slice(2, 8)}`,
  name,
  players: [],
});

export const DEFAULT_CONFIG: MatchConfig = {
  format: 'limited',
  overs: 20,
  oversPerBowler: 4,
  ground: '',
  city: '',
  ballType: 'tennis',
  pitch: 'turf',
  captureDetail: true,
};
