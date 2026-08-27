/**
 * game iq content, ported from the gamification mockup.
 *
 * the four pillars doc puts game iq on a daily cadence — it is the only daily
 * pillar and therefore the one that carries the open rate. so it gets the
 * streak, the league and the points economy; nothing else in the app does.
 */

/** fielder radii as a fraction of the boundary, at FIELD_ANGLES. */
export const FIELD_PRESETS: Record<string, number[]> = {
  attacking: [0.28, 0.32, 0.3, 0.35, 0.28, 0.33, 0.3],
  balanced: [0.45, 0.55, 0.5, 0.6, 0.48, 0.58, 0.52],
  defensive_square: [0.55, 0.9, 0.9, 0.55, 0.6, 0.9, 0.9],
  defensive_straight: [0.9, 0.55, 0.55, 0.9, 0.9, 0.55, 0.55],
};
export const FIELD_ANGLES = [20, 80, 140, 180, 220, 280, 340];

export type IqOption = {
  text: string;
  correct: boolean;
  why: string;
  /** field-setting questions answer with a diagram instead of a sentence */
  preset?: string;
};

export type IqItem = {
  /** the scoreboard strip above the scenario: [label, value] pairs */
  ticker: [string, string][];
  scenario: string;
  question: string;
  options: IqOption[];
  /** a field drawn above the question, for "read the field" */
  contextField?: string;
};

export type IqGame = {
  key: string;
  label: string;
  tag: string;
  group: 'daily' | 'captain' | 'bowling' | 'batting' | 'read';
  /** one-line pitch shown on the game card */
  blurb: string;
  timeLimit: number;
  basePoints: number;
  /** shown under the ticker on the boss case */
  advisor?: string;
  items: IqItem[];
};

export const IQ_GAMES: IqGame[] = [
  {
    key: 'boss',
    label: "this week's boss case",
    tag: 'boss case',
    group: 'daily',
    blurb: 'one hard call a week, validated by a coach',
    timeLimit: 25,
    basePoints: 30,
    advisor: "this week's case validated by Sangy Theivendra",
    items: [
      {
        ticker: [
          ['over', '40.4'],
          ['score', '220/5'],
          ['target', '301'],
          ['rrr', '9.4'],
        ],
        scenario:
          "ODI, 2nd innings. Set batter 78* (64) is timing it well but hasn't faced this bowler's variation ball yet today. Non-striker is a tailender promoted early to protect the middle order — 4 (9), clearly uncomfortable against pace. The death-overs specialist you saved has 2 overs left; everyone else has gone at 9+ today.",
        question:
          'Does the set batter farm the strike now, even at the cost of a risky extra run — or let the tailender face it out while the rate is still just about manageable?',
        options: [
          {
            text: 'Farm the strike aggressively — accept a tight second run to stay on strike',
            correct: true,
            why: "The tougher but correct call. Required-rate pressure compounds fast, and the tailender's discomfort against pace won't improve by waiting — better to accept the running risk while the rate is still below double digits.",
          },
          {
            text: 'Let the tailender face it out, farm strike in the last 5 overs instead',
            correct: false,
            why: "A defensible school of thought — not a silly option. But delaying lets the rate climb against the same attack, and 'later' assumes overs you may not get back at a better rate.",
          },
          {
            text: "Rotate strike normally, take singles as they come, don't force anything",
            correct: false,
            why: 'Too passive for a climbing required rate against a tailender already showing discomfort. This over needs deliberate management, not default cricket.',
          },
          {
            text: 'Deliberately get the tailender back on strike to protect the set batter',
            correct: false,
            why: 'Backwards — it exposes the weaker player to more balls against an attack already troubling him, for no scoring benefit.',
          },
        ],
      },
    ],
  },

  {
    key: 'powerplay',
    label: 'powerplay / death call',
    tag: "captain's call",
    group: 'captain',
    blurb: 'who bowls the over that decides it',
    timeLimit: 12,
    basePoints: 10,
    items: [
      {
        ticker: [
          ['over', '17.4'],
          ['score', '142/4'],
          ['target', '187'],
          ['rrr', '11.2'],
        ],
        scenario:
          "T20, 2nd innings. You're bowling, 2 overs left. Your death-overs specialist has one over in the bank. Your part-time spinner leaked 14 off his last over. New batter is 2 off 3, set batter is 38 off 22.",
        question: 'Who gets the 18th over?',
        options: [
          {
            text: 'Death-overs specialist now, save the spinner for the 20th',
            correct: true,
            why: 'Right call. You want your best death bowler against the set batter with the rate climbing — not held back for an over that may not matter if this one goes badly.',
          },
          {
            text: 'Part-time spinner, hoping for a wicket against the new batter',
            correct: false,
            why: "Tempting against a new batter, but he's already shown he's expensive today. Wrong over to gamble.",
          },
          {
            text: 'Save your specialist for the 20th over no matter what',
            correct: false,
            why: "There's no guarantee the game reaches a clean 20th-over shootout — a big 18th can end the contest before that over matters.",
          },
          {
            text: 'Bowl your strike pace option who has 2 overs left',
            correct: false,
            why: 'Viable, but not as strong a matchup as your recognised death-overs specialist against this pair.',
          },
        ],
      },
      {
        ticker: [
          ['over', '5.2'],
          ['score', '31/0'],
          ['phase', 'powerplay'],
          ['field', '4 out max'],
        ],
        scenario:
          'T20 powerplay, 4 overs left in it. Openers are set and scoring freely. A referral is available — the umpire has just given the striker not out to a close lbw shout that replays suggest was tight.',
        question: 'Do you review it?',
        options: [
          {
            text: 'Review — the shout looked close enough to be worth it',
            correct: true,
            why: 'With fielding restrictions still on and a set opener scoring freely, removing them now is worth more than saving the review.',
          },
          {
            text: 'Don’t review, save it for later in the innings',
            correct: false,
            why: "Reviews saved 'for later' often go unused. A close shout on a set opener in the powerplay is exactly when a review earns its value.",
          },
          {
            text: "Ask the bowler if they're confident before deciding",
            correct: false,
            why: 'Reasonable in practice, but not a strong enough standalone rule — you still need to weigh match state.',
          },
        ],
      },
    ],
  },

  {
    key: 'bowling',
    label: 'bowling change',
    tag: 'bowling change',
    group: 'bowling',
    blurb: 'break a partnership with the right matchup',
    timeLimit: 12,
    basePoints: 10,
    items: [
      {
        ticker: [
          ['over', '11.0'],
          ['score', '88/2'],
          ['last 3', '9, 11, 7'],
        ],
        scenario:
          'ODI, middle overs. Set batter (61 off 58) is strong through the leg side and has taken 18 off his last 6 balls against pace.',
        question: 'What is the change?',
        options: [
          {
            text: 'Off-spin turning the ball away from his strength, with a packed off side',
            correct: true,
            why: 'Takes the ball away from where he scores and makes him hit against the turn into the protected side.',
          },
          {
            text: 'Bang in your quickest bowler and try to blast him out',
            correct: false,
            why: "Pace is exactly what he's just taken 18 off. Feeding a strength harder rarely fixes it.",
          },
          {
            text: 'Leg-spin, hoping the change of pace deceives him',
            correct: false,
            why: 'Turns the ball into his strongest arc. The right idea — change of pace — pointed the wrong way.',
          },
        ],
      },
    ],
  },

  {
    key: 'chase',
    label: 'chase call',
    tag: 'chase call',
    group: 'batting',
    blurb: 'which over to attack, and which to survive',
    timeLimit: 12,
    basePoints: 10,
    items: [
      {
        ticker: [
          ['over', '14.0'],
          ['score', '96/3'],
          ['target', '164'],
          ['rrr', '11.3'],
        ],
        scenario:
          "T20 chase. You're 22 off 19 and just in. The bowler is the opposition's fifth option with one over left in his spell, and there's a short boundary square on the leg side.",
        question: 'How do you play this over?',
        options: [
          {
            text: 'Target him now — this is the cheapest over left in the innings',
            correct: true,
            why: "The rate only goes up from here and the better bowlers still have overs. Attacking the weakest link while it's available is the whole plan.",
          },
          {
            text: 'See out this over and accelerate against the specialists later',
            correct: false,
            why: 'Backwards. Deferring runs to the hardest overs is how chases get lost at 11 an over.',
          },
          {
            text: 'Rotate strike and get the set batter on strike',
            correct: false,
            why: "Not wrong in principle, but you're set enough at 22 off 19, and this is the matchup you want.",
          },
        ],
      },
    ],
  },

  {
    key: 'weakness',
    label: 'spot the weakness',
    tag: 'technique read',
    group: 'read',
    blurb: 'name the fault from the description',
    timeLimit: 10,
    basePoints: 10,
    items: [
      {
        ticker: [
          ['discipline', 'batting'],
          ['angle', 'side-on'],
          ['stage', 'bat path & contact'],
        ],
        scenario:
          'Watch the setup: at contact, the head pulls back and falls to the leg side, away from the line of the ball. Everything before contact — stance, backlift, stride — looks fine.',
        question: "What's the main weakness here?",
        options: [
          {
            text: 'Head falling away at contact',
            correct: true,
            why: 'Right — this is the payoff moment for a still setup. A head that falls away here undoes good work everywhere else in the shot.',
          },
          {
            text: 'No backlift',
            correct: false,
            why: "The clip shows a normal backlift — this isn't the fault present in this delivery.",
          },
          {
            text: 'Overstriding',
            correct: false,
            why: "Stride length isn't the issue — the fault is isolated to head position at the point of contact.",
          },
          {
            text: 'Front elbow tucked in',
            correct: false,
            why: 'Not what’s shown — the described fault is about head position, not elbow height.',
          },
        ],
      },
    ],
  },
  {
    key: 'field',
    label: 'set the field',
    tag: 'field setting',
    group: 'bowling',
    timeLimit: 15,
    basePoints: 12,
    blurb: 'pick the field that shuts a batter down',
    items: [
      {
        ticker: [
          ['bowler', 'pace'],
          ['phase', 'death'],
          ['batter', 'strong square'],
        ],
        scenario:
          'Your fast bowler is up, death overs, against a right-hander who scores heavily square of the wicket on both sides.',
        question: 'Which field fits this situation?',
        options: [
          {
            text: 'attacking',
            preset: 'attacking',
            correct: false,
            why: 'Too many fielders in close for the death overs — a batter this strong square of the wicket finds the ring gaps immediately.',
          },
          {
            text: 'boundary-square',
            preset: 'defensive_square',
            correct: true,
            why: 'Protects both square boundaries where this batter scores, accepts the single, defends the big shot.',
          },
          {
            text: 'straight defensive',
            preset: 'defensive_straight',
            correct: false,
            why: "Protects straight boundaries the batter isn't targeting, leaving the square boundaries — exactly where they score — more open.",
          },
        ],
      },
    ],
  },

  {
    key: 'readfield',
    label: 'read the field',
    tag: 'read the field',
    group: 'read',
    timeLimit: 15,
    basePoints: 12,
    blurb: 'find the gap the captain just conceded',
    items: [
      {
        ticker: [
          ['bowler', 'pace'],
          ['length', 'back of a length'],
          ['batter', 'right-hand'],
        ],
        contextField: 'defensive_square',
        scenario:
          'The field is set boundary-square on both sides, with the straight boundaries left shorter and less protected.',
        question: 'Which shot beats this field?',
        options: [
          {
            text: 'Loft it straight down the ground',
            correct: true,
            why: 'The straight boundary is the gap this field concedes — a clean shot down the ground beats it, where a square shot runs into the protection.',
          },
          {
            text: 'Cut it square of the wicket',
            correct: false,
            why: 'This is exactly where the field is stacked — a square cut runs straight into a fielder.',
          },
          {
            text: 'Work it fine to leg',
            correct: false,
            why: 'Also protected in this setup — the square boundaries are covered on both sides.',
          },
          {
            text: 'Defend it, no run intended',
            correct: false,
            why: 'Leaves a free run of the gap unused when the field clearly concedes the straight boundary.',
          },
        ],
      },
    ],
  },

  {
    key: 'sendin',
    label: 'send-in call',
    tag: 'batting order',
    group: 'batting',
    timeLimit: 12,
    basePoints: 10,
    blurb: 'a wicket falls — who walks out',
    items: [
      {
        ticker: [
          ['over', '15.2'],
          ['score', '92/3'],
          ['phase', 'middle'],
        ],
        scenario:
          "T20, a wicket's just fallen. Required rate is climbing and the incoming recognised batter (an anchor) is next in the order. You also have a pinch-hitter lower down who hits hard early but is streaky.",
        question: 'Who comes in?',
        options: [
          {
            text: 'Promote the pinch-hitter — the situation calls for tempo now',
            correct: true,
            why: "Right read. The anchor's game doesn't match what this required rate needs — better to gamble on tempo while there's still time for it to pay off.",
          },
          {
            text: 'Stick to the order — the anchor comes in as planned',
            correct: false,
            why: "Protects the batting order's structure but not the match situation — this is exactly the scenario batting orders are supposed to flex for.",
          },
          {
            text: 'Send in the tailender to protect both recognised batters',
            correct: false,
            why: "Solves a problem that doesn't exist here — the issue is tempo, not batting depth.",
          },
        ],
      },
    ],
  },

  {
    key: 'legend',
    label: 'legend case',
    tag: 'legend case',
    group: 'read',
    timeLimit: 15,
    basePoints: 12,
    blurb: 'a famous moment — what actually happened',
    items: [
      {
        ticker: [
          ['match', '2011 wc final'],
          ['teams', 'ind v sl'],
          ['situation', 'final over'],
        ],
        scenario:
          'India chasing 275 in the 2011 World Cup Final at Wankhede. In the final over, MS Dhoni is on strike, needing a handful of runs to finish it, facing a part-time bowling option.',
        question: 'What actually happened?',
        options: [
          {
            text: 'Dhoni hit a six down the ground to finish the match',
            correct: true,
            why: 'Correct — one of the most replayed finishes in ODI cricket. India won the World Cup on the spot.',
          },
          {
            text: 'Dhoni ran two to close it out with a run to spare',
            correct: false,
            why: 'Not how it ended — the finish was a boundary, not a scampered single or two.',
          },
          {
            text: 'Dhoni was dismissed attempting the winning shot',
            correct: false,
            why: 'No — he stayed not out and finished the game himself.',
          },
          {
            text: 'The match went to a Super Over',
            correct: false,
            why: "It didn't need to — the chase was completed inside the 50 overs.",
          },
        ],
      },
    ],
  },
];

/**
 * the replay game is generated, not authored: it re-poses the athlete's own
 * priority fix from their last report in a fresh scenario. this is the bridge
 * from the weekly report back into the daily loop.
 */
export function replayGame(priorityFix: string, discipline: string): IqGame {
  return {
    key: 'replay',
    label: 'iq replay',
    tag: 'from your last report',
    group: 'daily',
    timeLimit: 10,
    basePoints: 15,
    blurb: 'your own priority fix, in a clip you haven\'t seen',
    items: [
      {
        ticker: [
          ['discipline', discipline],
          ['source', 'your last report'],
          ['priority fix', priorityFix],
        ],
        scenario: `Your last report flagged this as your priority fix: ${priorityFix}. Here it is again in a clip you haven't seen.`,
        question: 'Same weak point, new scenario — what’s the flaw here?',
        options: [
          {
            text: priorityFix,
            correct: true,
            why: 'This is the exact pattern from your report. Recognising it in a new clip is the point of this replay.',
          },
          { text: 'No backlift', correct: false, why: 'Not the flagged issue in your report or in this scenario.' },
          { text: 'Overstriding', correct: false, why: "Your report's priority fix was about a different phase of the shot." },
          { text: 'Front elbow tucked in', correct: false, why: 'A different fault to the one your last report flagged.' },
        ],
      },
    ],
  };
}

/**
 * speed-weighted scoring, matching the mockup: a correct answer is always
 * worth at least half the base, and answering instantly doubles that.
 */
export function scoreAnswer(base: number, timeLeft: number, timeLimit: number): number {
  return Math.round(base * (0.5 + 0.5 * (timeLeft / timeLimit)));
}

export const GROUP_LABELS: Record<IqGame['group'], string> = {
  daily: 'today',
  captain: 'captaincy',
  bowling: 'with ball',
  batting: 'with bat',
  read: 'reading the game',
};

export const GROUP_ORDER: IqGame['group'][] = ['daily', 'captain', 'bowling', 'batting', 'read'];
