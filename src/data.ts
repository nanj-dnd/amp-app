/** stand-in data so the ui runs on its own. swap for your api layer. */

export const me = {
  name: 'Anshul Yemul',
  email: 'anshul.yemul18@gmail.com',
  role: 'coach' as 'coach' | 'player',
  sessions: 31,
  score: 66,
  avatar: undefined as string | undefined,
};

export type Session = {
  id: string;
  player: string;
  score: number;
  when: string;
  kind: 'batting' | 'bowling';
};

export const sessions: Session[] = [
  { id: '1', player: 'Anshul Yemul', score: 66, when: '10h ago', kind: 'batting' },
  { id: '2', player: 'Anshul Yemul', score: 64, when: '10h ago', kind: 'batting' },
  { id: '3', player: 'Anshul Yemul', score: 61, when: '6 days ago', kind: 'bowling' },
  { id: '4', player: 'Anshul Yemul', score: 71, when: '11 days ago', kind: 'batting' },
  { id: '5', player: 'Anshul Yemul', score: 58, when: '14 days ago', kind: 'bowling' },
];

export const scoreHistory = [
  58, 60, 57, 62, 63, 61, 64, 63, 62, 65, 60, 58, 63, 66, 61, 59, 68, 55, 62,
  64, 60, 53, 66, 67, 65, 63, 61, 64, 71, 63, 66,
];

/**
 * what a typical athlete at each level scores on each kpi. raw numbers say
 * "your backlift is 60"; normalising against the band says whether 60 is a
 * problem, which is the question actually being asked.
 */
export const benchmarks: Record<string, Record<string, number>> = {
  recreational: { 'backlift': 45, 'stance & setup': 48, 'bat path & contact': 44, 'front foot movement': 43, 'follow through': 47, 'shot intelligence': 41, 'repeatability': 40 },
  school: { 'backlift': 52, 'stance & setup': 55, 'bat path & contact': 51, 'front foot movement': 50, 'follow through': 54, 'shot intelligence': 48, 'repeatability': 47 },
  club: { 'backlift': 58, 'stance & setup': 60, 'bat path & contact': 57, 'front foot movement': 56, 'follow through': 59, 'shot intelligence': 55, 'repeatability': 54 },
  district: { 'backlift': 64, 'stance & setup': 66, 'bat path & contact': 63, 'front foot movement': 62, 'follow through': 65, 'shot intelligence': 62, 'repeatability': 61 },
  state: { 'backlift': 71, 'stance & setup': 73, 'bat path & contact': 70, 'front foot movement': 69, 'follow through': 72, 'shot intelligence': 70, 'repeatability': 69 },
  academy: { 'backlift': 75, 'stance & setup': 77, 'bat path & contact': 74, 'front foot movement': 73, 'follow through': 76, 'shot intelligence': 74, 'repeatability': 73 },
};

/** per-delivery scores within the most recent session. */
export const deliveries = [
  { id: 1, score: 64, note: 'good length, off stump' },
  { id: 2, score: 44, note: 'short, pulled in the air' },
  { id: 3, score: 71, note: 'full, driven straight' },
  { id: 4, score: 58, note: 'wide, chased it' },
  { id: 5, score: 66, note: 'good length, defended' },
  { id: 6, score: 52, note: 'short of a length, edged' },
];

export const kpis = [
  { name: 'backlift', score: 60, delta: -5 },
  { name: 'stance & setup', score: 68, delta: 5 },
  { name: 'bat path & contact', score: 60, delta: 0 },
  { name: 'front foot movement', score: 57, delta: 2 },
  { name: 'follow through', score: 71, delta: null },
  { name: 'shot intelligence', score: 64, delta: null },
  { name: 'repeatability', score: 62, delta: null },
];

export const chats = [
  { id: 'c1', title: 'Batting session — Aug 9', preview: 'why head & weight over the front knee matters', date: 'aug 11', video: true },
  { id: 'c2', title: 'Build me a 3-day gym plan', preview: 'i have everything i need to build the plan', date: 'aug 11', video: false },
  { id: 'c3', title: 'Batting session — Jul 22', preview: 'fix: head over the ball at contact', date: 'jul 23', video: true },
  { id: 'c4', title: 'Batting session — Jul 8', preview: 'building on your backlift height', date: 'jul 8', video: true },
];

export const suggestions = [
  "what's been my biggest improvement this month?",
  'which section of my batting needs the most work?',
  'give me a drill plan for this week',
];

export const iqCase = {
  streak: 1,
  points: 10,
  tier: 'bronze',
  prompt:
    "You're facing a full delivery on off-stump and you feel the urge to go after it hard. As you move into your shot, you sense the ball is slightly further from your body than ideal — your arms are stretching toward it rather than driving through comfortably. You have a split second to adjust how you meet the ball.",
};

export const players = [
  { id: 'p1', name: 'Anshul Yemul', email: 'anshul.yemul18@gmail.com', sessions: 31, last: 'aug 26' },
];


/**
 * a scored session against the pace sheet. blank means the kpi wasn't
 * observable in the clip — not zero. back-foot rows are blank here because this
 * session had no short deliveries, which is exactly the case rescale() exists
 * to handle.
 */
export const sessionScores: Record<string, number | null> = {
  'balanced-stance-weight-distribution': 7,
  'head-position-stillness-at-guard': 8,
  'bat-position-at-guard': 6,

  'backlift-height-timing-vs-pace': 6,
  'backlift-direction': 5,

  'front-foot-initiation-decisiveness-vs-pace': 7,
  'front-foot-landing-direction': 6,
  'head-weight-over-the-front-knee-at-contact': 4,

  'back-foot-initiation-decisiveness-vs-pace': null,
  'depth-balance-of-back-foot-movement': null,
  'weight-transfer-into-the-shot-vs-pace': null,

  'bat-face-control-at-contact': 7,
  'contact-point-under-the-eyes': 5,
  'top-hand-control-vs-bottom-hand-dominance': 6,
  'response-to-short-pitched-bowling': null,

  'follow-through-extension-balance': 8,
  'head-stability-through-shot': 6,

  'length-line-judgement-under-pace': 6,
  'consistency-across-session': 7,
};

/** the same sheet, one session earlier, so deltas mean something. */
export const previousScores: Record<string, number | null> = {
  ...sessionScores,
  'head-weight-over-the-front-knee-at-contact': 3,
  'contact-point-under-the-eyes': 6,
  'backlift-direction': 6,
  'follow-through-extension-balance': 7,
  'consistency-across-session': 6,
};

/** what a typical athlete at each level scores per section, 0-100. */
export const sectionBenchmarks: Record<string, number> = {
  recreational: 44,
  school: 52,
  club: 58,
  district: 65,
  state: 72,
  academy: 77,
};


/**
 * each section of the pace sheet, scored over the last twelve sessions.
 * nulls are sessions where that section wasn't observable — the series chart
 * breaks the line rather than joining across the gap and implying a reading.
 */
export const sectionHistory: Record<string, (number | null)[]> = {
  'stance-setup':                          [58, 61, 60, 63, 62, 66, 64, 67, 68, 66, 69, 70],
  'backlift':                              [52, 55, 51, 57, 54, 58, 56, 60, 57, 61, 60, 55],
  'footwork-front-foot-deliveries-only':   [49, 52, 54, 51, 56, 55, 58, 57, 60, 58, 54, 57],
  'footwork-back-foot-deliveries-only':    [null, 48, 50, null, 53, 51, null, 55, 54, null, 52, null],
  'bat-path-contact-pace-specific':        [55, 54, 58, 57, 60, 59, 62, 60, 64, 63, 64, 60],
  'follow-through':                        [61, 63, 62, 66, 65, 68, 67, 69, 68, 70, 69, 70],
  'shot-intelligence-pace-specific':       [50, 53, 55, 54, 58, 57, 60, 59, 62, 61, 60, 65],
};

/** stable colours per section, so a series means the same thing every time. */
export const sectionColours: Record<string, string> = {
  'stance-setup': '#186D4C',
  'backlift': '#D18A1E',
  'footwork-front-foot-deliveries-only': '#3B82C4',
  'footwork-back-foot-deliveries-only': '#8B5CF6',
  'bat-path-contact-pace-specific': '#C2452F',
  'follow-through': '#2E9E63',
  'shot-intelligence-pace-specific': '#B07A45',
};


/**
 * every pace-sheet kpi, scored over the last twelve sessions. nulls are
 * sessions where the kpi wasn't observable — the chart breaks the line there
 * rather than joining across it and implying a reading that never happened.
 */
export const kpiHistory: Record<string, (number | null)[]> = {
  'balanced-stance-weight-distribution': [66, 68, 75, 81, 82, 83, 85, 92, 95, 92, 88, 94],
  'head-position-stillness-at-guard': [62, 66, 69, 75, 71, 66, 67, 65, 61, 56, 58, 64],
  'bat-position-at-guard': [49, 49, 50, 54, 59, 62, 66, 62, 65, 59, 66, 68],
  'backlift-height-timing-vs-pace': [41, 35, 32, 29, 32, 26, 32, 33, 32, 33, 36, 43],
  'backlift-direction': [53, 50, 54, 52, 53, 47, 51, 46, 47, 51, 49, 49],
  'front-foot-initiation-decisiveness-vs-pace': [69, 64, 69, 67, 66, 72, 69, 71, 69, 63, 58, 61],
  'front-foot-landing-direction': [48, 43, 50, 48, 48, 43, 37, 44, 48, 42, 39, 36],
  'head-weight-over-the-front-knee-at-contact': [47, 47, 52, 52, 52, 47, 50, 54, 51, 57, 61, 59],
  'back-foot-initiation-decisiveness-vs-pace': [null, null, null, null, null, null, null, null, null, null, null, null],
  'depth-balance-of-back-foot-movement': [null, null, null, null, null, null, null, null, null, null, null, null],
  'weight-transfer-into-the-shot-vs-pace': [null, null, null, null, null, null, null, null, null, null, null, null],
  'bat-face-control-at-contact': [50, 48, 47, 41, 41, 47, 42, 38, 35, 40, 35, 29],
  'contact-point-under-the-eyes': [47, 53, 54, 50, 54, 56, 53, 54, 56, 53, 58, 64],
  'top-hand-control-vs-bottom-hand-dominance': [49, 53, 53, 48, 48, 48, 45, 39, 37, 44, 50, 53],
  'response-to-short-pitched-bowling': [48, null, null, 41, null, null, 55, null, null, 47, null, null],
  'follow-through-extension-balance': [57, 51, 57, 60, 59, 66, 64, 64, 59, 54, 49, 46],
  'head-stability-through-shot': [46, 49, 48, 47, 50, 51, 47, 50, 51, 58, 61, 57],
  'length-line-judgement-under-pace': [53, 57, 53, 51, 48, 55, 58, 55, 60, 57, 53, 58],
  'consistency-across-session': [59, 63, 63, 64, 67, 62, 62, 56, 51, 46, 40, 42],
};

/** which section each kpi belongs to, for grouping the picker. */
export const kpiSection: Record<string, string> = {
  'balanced-stance-weight-distribution': 'stance-setup',
  'head-position-stillness-at-guard': 'stance-setup',
  'bat-position-at-guard': 'stance-setup',
  'backlift-height-timing-vs-pace': 'backlift',
  'backlift-direction': 'backlift',
  'front-foot-initiation-decisiveness-vs-pace': 'footwork-front-foot-deliveries-only',
  'front-foot-landing-direction': 'footwork-front-foot-deliveries-only',
  'head-weight-over-the-front-knee-at-contact': 'footwork-front-foot-deliveries-only',
  'back-foot-initiation-decisiveness-vs-pace': 'footwork-back-foot-deliveries-only',
  'depth-balance-of-back-foot-movement': 'footwork-back-foot-deliveries-only',
  'weight-transfer-into-the-shot-vs-pace': 'footwork-back-foot-deliveries-only',
  'bat-face-control-at-contact': 'bat-path-contact-pace-specific',
  'contact-point-under-the-eyes': 'bat-path-contact-pace-specific',
  'top-hand-control-vs-bottom-hand-dominance': 'bat-path-contact-pace-specific',
  'response-to-short-pitched-bowling': 'bat-path-contact-pace-specific',
  'follow-through-extension-balance': 'follow-through',
  'head-stability-through-shot': 'follow-through',
  'length-line-judgement-under-pace': 'shot-intelligence-pace-specific',
  'consistency-across-session': 'shot-intelligence-pace-specific',
};
