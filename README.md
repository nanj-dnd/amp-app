# amp — ui

**yes, this is a react native app** — expo sdk 57 + typescript, not a web page.
`App.tsx` plus `src/` is the whole thing; it builds to a real ios and android
binary. `npm run web` exists only because it is the fastest way to look at a
change; the same code runs on device through expo go or a dev build.

archivo everywhere, lowercase everywhere, one green taken from the mark.

```bash
npm start        # then i for simulator, or scan with expo go
npm run web      # fastest way to look at it
```

## the spec this is built against

`amp_d2c_funnel.pdf`. two things in it drive the whole shape of the app:

**the funnel is six stages** — identity, cricket profile, goal + date, free first
report, the ask, weekly loop. the first four are free and the player reaches a
report without being asked for money. that is why onboarding collects every
analysis parameter up front and the record screen asks only for clips, and why
₹299 appears on the report screen and nowhere before it.

**the four pillars run on two cadences** — sessions weekly, gym and nutrition
around them, game iq *daily*. game iq is the only daily pillar, so it is the one
that carries the open rate. that is why it owns the streak, the league and the
points, and nothing else in the app has a currency.

## where things live

```
src/theme/tokens.ts    colour, type, spacing, radii, motion — the only file with hex in it
src/state/types.ts     Identity + CricketProfile + Goal + Progression + GymState
src/state/store.tsx    asyncstorage persistence, streak rule, weekly action log
src/plan.ts            goal templates + buildPlan(profile) -> one node per week
src/gameiq.ts          scenario content, ported from the gamification mockup
src/kpis.ts            the batting sheets, generated from amp_batting_male_all_tiers.xlsx
src/report.ts          a scored session: ratings, strengths, notes, drills, movers
src/reportData.ts      one worked report against the pace sheet
src/screens/report/    the report — player card / ratings / video / chat
src/gym.ts             cricket-weighted exercise catalogue + starter routines
src/match/types.ts     Ball is the atomic record; everything else derives from the log
src/match/engine.ts    the scoring rules — extras, strike, maidens, cards, commentary
src/match/engine.test.ts  assertions for the above
src/insights.ts        match balls -> kpis on the same 0–100 scale as the amp score
src/insights.test.ts   assertions for the kpi maths
src/ui/*               the component library — nothing outside ui/ styles from scratch
src/screens/*          road · game iq · record · gym · you, plus report and onboarding
App.tsx                fonts, providers, splash -> onboarding -> tabs
```

## the road

the first version was a full-screen perspective ramp. it looked like the mark,
but it pushed **this week** — the only thing you can act on — below the fold, and
twelve weeks of empty tarmac is a lot of screen to say "not yet".

the metaphor survives as a **strip**: a ribbon that narrows toward a flag, one
chip per week, auto-scrolled to today. it costs about 70px, and the screen goes
back to the work — what's live, what you're chasing, where you are, then this
week's four actions.

`buildPlan()` makes one node per week between this monday and the goal date —
**the cadence is one recording a week**, which is the assumption the product
actually runs on. each week carries the four pillars as its checklist: film one
session (required), game iq five days (required), two gym sessions, a nutrition
check-in. a review lands every fourth week and on the last.

the previous roadmap was a duolingo curriculum — eight abstract steps per "unit",
locked behind each other, with no relationship to the goal or to a weekly upload.
it is gone.

## gamification, and what it's for

every mechanic here is attached to a behaviour the funnel says has to happen.

| mechanic | attached to |
|---|---|
| **amp score** | the report. first and biggest in the hud, colour-coded by band. |
| **streak** | daily opens, credited once a day by game iq. |
| **iq points + league** | answering scenarios; speed-weighted, exactly as the mockup scores them. |
| **week ring** | how much of *this week's* required work is in. |
| **review weeks** | the block checkpoint, every fourth week. |

there is no energy and no gem currency. energy gated the one action the business
needs to happen as often as possible, and gems bought nothing.

## game iq

**four suites**, renamed from the mockup's places to what they actually measure —
a lobby item has to say what it tests in two words:

| mockup | here | what it is |
|---|---|---|
| Game IQ | **decisions** | read the situation, make the call |
| The Nets | **reactions** | slip reflex, timing bar, catching drill |
| The War Room | **selector** | one purse, five picks, one xi |
| The Pavilion | **takes** | emoji puzzle, the split |

**decisions** carries all ten scenario games from the mockup: boss case,
powerplay / death call, bowling change, set the field, chase call, send-in call,
read the field, legend case, spot the weakness, and iq replay. field-setting
questions answer with a diagram rather than a sentence, using the mockup's own
fielder presets.

**reactions** is the part a multiple-choice question can't test — how fast you
pick a ball up (with a false-start penalty), whether your timing holds as the
bar speeds up, and whether your hands keep up when there's more than one ball.

**selector** gives you ₹100cr and five rounds. spend the marquee money early and
the last rounds are unaffordable — you pass, the slot stays empty, and the
verdict tells you that's what cost you. every suite banks into the same points
and league, so there is one economy rather than four.

**it is two screens, not one.** the first version stacked five horizontal
pickers above a live scenario, so the timer started while you were still reading
the menu. now there is a lobby you browse — three stats, today's two headline
cards, then the rest grouped — and a game plays full-screen with nothing else on
it.

the reasoning is revealed **on every option**, not just the one picked: the "why"
on the wrong answers is the actual teaching. scoring matches the mockup,
`base × (0.5 + 0.5 × timeLeft/limit)`.

**iq replay** is generated rather than authored: it re-poses the athlete's own
priority fix from their last report in a fresh scenario, which is the bridge from
the weekly report back into the daily loop.

## scoring a match

a full ball-by-ball scorer, in the app. the research target was cricheroes; the
brief was the same detail with a tenth of the friction.

**setup is one screen.** two team names, format, overs. everything cricheroes
asks up front — ground, city, date, ball, pitch, wagon-wheel toggle, four kinds
of official — is behind "match details" with defaults already filled. squads,
captain and keeper are one screen too: `c` and `wk` are chips on the player row,
because they are properties of a player, not three separate pushes.

**extras are modifiers, not modes.** tap `wd` and you've logged a wide for one.
tap `wd` then `2` and you've logged a wide that went for three. cricheroes makes
each of those its own dialog. the same pad handles `nb`, `b`, `lb`, `out` and
`undo` without ever changing screens.

**shot detail is one sheet, not two screens.** placement and shot type on a
single wagon wheel with a `skip`. this is the data amp actually wants out of a
match, so it has to be fast enough that nobody turns it off — which is exactly
why most scorers turn cricheroes' version off.

**both innings.** an innings closes on overs, on wickets, or on the target being
passed. the first closes into a break screen that states the target as one
number, because that number is the whole of the second innings; the second
closes the match with a result. `inningsEnd()` decides, `startSecondInnings()`
swaps the sides and sets the target, `resultText()` writes the line.

**handedness.** a batter carries a `battingHand`, toggled with an `rh`/`lh` chip
in the squad. a left-hander's wagon wheel is mirrored on screen, but the region
*id* stays canonical — cover is cover for either hand — so the analysis below
never has to know which way round anyone stands.

the rules live in `src/match/engine.ts` and are asserted, because they are easy
to get subtly wrong:

```bash
npm test
```

covered: wides and no-balls don't count as legal balls; a wide isn't a ball
faced but a no-ball is; only runs actually *run* rotate the strike, so the
penalty run on a wide doesn't; byes and leg-byes are legal balls but aren't
charged to the bowler; an over of leg-byes is still a maiden; run outs aren't
credited to the bowler; strike swaps at the end of an over; undo replays the
log rather than trying to invert it; a small squad goes all out sooner; the
target is one more than the first innings; a tie is a tie; mirroring twice is
the identity.

## the kpi sheets

`src/kpis.ts` is generated from `amp_batting_male_all_tiers.xlsx` — four tiers,
scored the way the workbook scores them:

| tier | ages | kpis |
|---|---|---|
| foundation | ~5-9 | 7, no pace/spin split, no foot detection |
| development | ~9-13 | 12, light front/back-foot split |
| pace | 15+ | 19, scored against pace |
| spin | 15+ | 20, scored against spin |

three rules from the sheet drive the whole progress screen:

**kpis are weighted, and so are the sections they sit in** — both sum to 100.
so the breakdown shows a section's normalised 0–100 score *and* what it's worth,
because "you're weak at the thing worth 20 points" is a different sentence from
"you're weak".

**blank is not zero.** a back-foot kpi in a session with no short deliveries is
left blank, and `rescale()` drops it from both the numerator and the denominator.
the screen says so out loud — *"rescaled over what was visible — 25 points of the
sheet weren't in this session"* — because a rating out of 75 observed points
means something different from one out of 100.

**pace and spin are different sheets, not different rows.** from 15 the athlete
picks the mode, and progress lets you switch between the two readings.

## the report

three tabs, in the order the questions actually get asked:

| | |
|---|---|
| **summary** | what's the number, what's the risk, what do i do about it |
| **ratings** | every kpi, collapsed until you ask for one |
| **video** | the clip, and the frames the reads came from |

chat moved to the header, where it is on every other screen.

**summary is four cards, not six.** the score, its trend and its coverage are
one card — a 270° gauge rather than a ring, because a full ring has no start and
no end, so 66 and 6 both just look round. then screening, then the actionable
unit, then sections. the priority fix and the drills that address it are the
*same* card, because they are one thought.

**the ratings are the kpis.** the first build printed the observation under all
nineteen rows at once — four screens of prose to scroll past to compare two
numbers. now the sections are an accordion: seven rows on one screen with their
score, weight and coverage, expanding one at a time. the prose is one tap away,
in a sheet that gives you the score out of ten, the camera angle it was judged
from, what it's worth, and the frame as evidence. a score nobody can check is a
score nobody trusts.

**injury screening sits apart from the ratings.** a low score means "this will
cost you runs"; a flag here means "this will cost you a season". they are read
differently, so they don't share a scale — screening is areas at clear / watch /
flag, one line each, and it only appears on the card when something is flagged.
it says plainly that a flag is not a diagnosis.

**text got cut, everywhere.** coaching notes went from five sentences to two.
drills carry a cue on the card (*"brush the cone, arms stay bent"*) and the full
method in a sheet. the strength is a line, not a card of prose — it isn't the
thing you act on.

**a kpi that wasn't observed reads "—", never 0.** the reference build showed
`Moving Back 0` on a session with no back-foot deliveries, which reads as "you
were terrible at this" when it means "this didn't come up". that distinction is
in the workbook and it survives all the way to the card.

## the score card

`src/ui/ScoreCard.tsx` renders it; `src/screens/ShareCard.tsx` previews and
exports it. `design/amp-score-card.svg` is the same design as a standalone file.

**it is deliberately not themed.** a card that lands in someone's whatsapp is an
artefact, not a screen, so it holds one look wherever it was made. the ground is
brand green with the road receding into it, because the first job of the image
is to say "amp" before anyone reads a number. the previous version was a
gold-to-brown gradient — the gold fought the brand, and gold is already the
"fair" band colour, so a good score and a mediocre one looked the same.

**one bar, not three.** three separate bars implied three scores. there is one
score made of three parts, so the composition is one bar segmented by weight,
with each part's number under it.

**the amp score is a weighted mean that skips what it can't see.** report 55,
game iq 25, coaching 20 — and a component nobody has rated yet is dropped from
both sides of the average rather than counted as zero. an athlete with no coach
isn't punished for the part of the product they haven't used. same rule as the
kpi sheet, for the same reason.

**export** captures a copy rendered at a fixed 1080px, parked off-screen —
capturing the on-screen card would bake in whatever width the device happened to
be, so the same card would come out different on every phone. ios gets a `UTI`
as well as a `mimeType`, per the sdk 57 sharing api. web has no capture path and
the button says so.

## what a match tells you about your game

this is why the scorer is in this app rather than beside it.

mark yourself in the squad — one tap, in the footer of the squads screen — and
every ball you face or bowl feeds your kpis. `src/insights.ts` turns the ball log
into scores on the **same 0–100 scale as the amp score**, so they sit in the same
breakdown as the video ones, tagged `video` or `match`:

| from a video report | from a scored match |
|---|---|
| bat path & contact | strike rotation |
| stance & setup | dot-ball pressure |
| front foot movement | boundary conversion |
| follow through | scoring range, off/leg balance |

technique and outcomes are the same question from opposite ends, so they belong
in one list. **sections over time** plots every section of the sheet across the last twelve
sessions. the version this replaces drew sixteen series at full strength under a
legend taller than the chart — you could see that something moved, never what.
here the legend is the control: tap a section and it comes forward while the
rest drop back to context. the axis fits the data rather than running 0–100,
and a series breaks where a section wasn't observed instead of joining across
the gap and implying a reading.

**progress → matches** also draws where the runs actually go: a wagon wheel
scaled by runs per region, which is how a leg-side-dependent player finds out
they are one. every scored match is listed — tagged `you` when it can feed kpis,
`live` when it's still going. a match with nobody marked as you used to be
filtered out of the only list it appeared in, which made saved matches look
lost.

nothing appears until there are `MIN_BALLS` (24) of evidence — a 90 strike rate
off four balls is not a number worth showing anyone.

## gym

hevy's working model: a **previous** column so you know what to beat, inline
weight/reps, and a tick that commits the set. ticking an untouched set adopts
last week's numbers, so repeating a session is one tap. live duration, volume and
set count in the header; personal bests per exercise. the catalogue is
cricket-weighted — rotational power, posterior chain, shoulder health — not a
generic bodybuilding split.

## design notes

**lowercase.** `<Text>` lowercases by default. `preserveCase` is for proper
nouns (the advisor's name) and option letters (A/B/C/D) only.

**the logo is the supplied artwork.** `assets/logo-mark.png` and
`assets/logo-lockup.png` are cut straight out of `amp logo.svg` with the white
keyed to transparent, and used wherever the logo appears at size. `LogoMark`
falls back to a traced vector below 32px and anywhere it has to take a colour
(a raster can't go white on a green card, and the lane dashes stop resolving at
small sizes anyway). brand green is `#186D4C`, sampled off that artwork.

**light by default.** the app followed the os, which is why it kept opening
dark. `settings.theme` is `light` unless you change it in **you → appearance**,
where `system` is still an option.

**wheels go up when you drag down.** `ScrollPicker` lays its values out
high-to-low for that reason.

**the gold was the problem.** the old ramp used a brown-gold as "fair", which
went muddy anywhere it touched text. score colours now only ever fill shapes —
rings, bars, dots — and band *text* is neutral, so no ramp colour has to clear a
contrast bar. `c.gold` exists separately for streak and star icons.

**no labels in the tab bar.** five words at 10px that nobody read; the active
tint and a dot say where you are, and the label survives for screen readers.

**one logo at a time.** the lockup already contains the mark, so the splash
shows the lockup alone rather than the mark twice.

**ask is in the road header, not floating.** a bubble hovering over every screen
was in the way of the thing underneath it; a chat glyph next to the score is
where you'd look for it.

**one layer of text, not three.** most cards were an eyebrow, a heading and a
body saying the same thing in three sizes — the chat list showed a thread title
*and* its first reply. if a title and a subtitle say the same thing, only the
title ships.

**back is always in the same place.** `<Screen onBack>` puts it top-left on
every pushed screen, and the report and match screens carry their own in the
same spot. nothing is reachable without a way out of it.

**ball by ball is a bowling read.** it describes what the bowler did with each
delivery, so it's its own view in progress and only exists for someone who
bowls — it isn't a strip inside the batting sheet.

**every sheet is a real Modal.** bottom sheets used to be absolutely-positioned
views inside whichever screen opened them, which put them *under* the tab bar —
a later sibling in the tree paints on top, and there are no portals in react
native. `src/ui/Sheet.tsx` is the one primitive; every sheet in the app uses it.

**batting and bowling get their own marks.** `src/ui/Icons.tsx` — bat, ball,
all-rounder, stumps, road — drawn as solid silhouettes because a thin outline
reads as a pen at 17px. ionicons only ships a baseball and a tennis ball, which
are the same round object.

*swapping in a licensed icon pack:* that file is the only place the shapes are
defined. add `react-native-svg-transformer`, drop the pack's svgs into
`assets/icons`, and re-export them from `Icons.tsx` — nothing else imports the
shapes.

## still to wire

- `src/data.ts` is mock for the kpi list and score history. `progression.ampScore`
  is live from the store; the trend chart is not.
- `RecordScreen.run()` fakes the analysis round trip on a timer.
- `App.tsx` uses a `useState` router. `TabBar` takes `active`/`onChange`, so it
  drops into expo-router or react-navigation as a custom `tabBar`.
- nutrition and physio are rows in **you** that don't go anywhere yet — the pillar
  is a handoff to a real person, so it needs a destination, not a screen.
- the ask button on the report doesn't take payment.
- **super overs and ties** end the match on the result screen rather than going
  to a decider.
- **the sheets are batting only.** bowling has no equivalent workbook yet, so a
  bowler's technique tab falls back to the same batting sections.
- **kpi scores are mock.** `sessionScores` in `data.ts` is a hand-written pass
  against the pace sheet; the shape is real, the numbers aren't from a video.
- **reactions scores aren't kept.** best times show within a session but don't
  persist or feed the league beyond the points banked.
- **takes uses mocked community percentages** — the split has no real backend.
- **bowling insights need a bowling match.** the maths is there and asserted, but
  nothing yet nudges an all-rounder to mark themselves in a match they bowled in.
- the athlete's match kpis don't feed back into the *weekly plan* — a leg-side
  dependence found in a match should be able to set the next week's focus the
  way a video report's priority fix does.
