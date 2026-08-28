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

the metaphor survives as a **strip**: one chip per week on a single line,
auto-scrolled to today. the first strip drew a tapering ribbon with a dashed
centre line, which was a lot of drawing to say "these happen in order" — a rule
through the middle says the same thing and lets the chips do the work. the goal
flag is the last chip, the same size as the rest, because it is the last week
rather than a separate object. review weeks carry a dot instead of a caption, so
the row stays one height.

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

## the six indicators

`src/indicators.ts`, generated from `amp_card_indicators.xlsx`, with the
workbook's own worked example asserted in `src/indicators.test.ts` — if those
drift, the app and the workbook disagree and one of them is lying.

**nobody reads nineteen numbers off a card.** the kpi sheets score technique row
by row; each row's points are split across six indicators by a share summing to
1.00, and the card prints the six. no indicator is a single section renamed —
every one draws on kpis from three or more sections, because "balance" is a
property of the whole action, not of the setup rows.

**blank versus zero survives intact, and is the reason this is honest.** a kpi
that couldn't be assessed — wrong camera angle, no back-foot ball in the
session — leaves *both* sides of the fraction rather than counting as nought.
that is also why every indicator carries its own coverage.

**only pace and spin have share tables.** foundation and development are
deliberately absent rather than guessed at: an invented share would print a
confident indicator on evidence nobody assigned. `rollUp` returns null for a
tier it has no shares for and the card falls back to the rating alone.

## metal

`src/theme/tokens.ts` holds the five metals; `src/ui/Metal.tsx` draws all of
them. colour on this platform is metal — vivid, but lit rather than loud.

**one light source.** every metal is a diagonal body gradient lit from the top
left plus a specular in the same corner, and it all comes from `Metal.tsx` so
the product has exactly one lamp. draw a gradient per-component and a screen of
badges looks like a screen of stickers.

**restraint is the whole trick.** the first pass ran the speculars at 0.4–0.5
alpha and derived the sheen stops a third of the way to white, which read as wet
plastic rather than metal. everything is now around two thirds of that: enough
to say the surface is lit, not enough to look at on its own. a highlight that
competes with the number printed on it is a bevel from 2008.

**the gloss scales down as the surface grows,** because a fixed ratio does not.
a real specular is roughly a fixed angular size, so the bigger the object the
less of it the highlight covers — but the sheen was a flat 46% of the height,
which is a 14px band on a chip and a 70px wash on a card. the fills measure
themselves now: the band is capped in points and its alpha drops on anything
over ~90pt tall.

the body gradient does the same, and that turned out to matter more. hi → base →
deep is a lit edge on a chip and a bright corner plus a dark one on a full-width
card — at that size the surface stops reading as one piece of metal and starts
reading as a gradient someone applied to a box. large plates pull both ends
toward their base and keep the fall gentle. the goal card on the road was the
case that made this obvious.

**`ink`, never white.** the only colour allowed on top of a metal is a deep
tint of the metal itself. white on a light metal — gold, and everything above
it — is where premium turns into cheap.

**the score bands are not metals.** poor/fair/good/elite are semantic and can't
be swapped for bronze/silver/gold: a "poor" band is not bronze. they keep their
own hue and borrow the same light through `SheenBar`.

**a coloured number is struck too.** every other glossy thing is a surface with
a gradient behind it, but a score is type, and react native cannot pour a
gradient into a glyph. `src/ui/GlossText.tsx` draws the number twice: once as a
real `<Text>` at zero opacity, purely to hold its place in the layout and report
its measured size, and once as svg text laid over that hole with the gradient as
its fill. measuring rather than estimating matters — these numbers change width
with their value and with the platform's font metrics, and a guessed box clips
the last digit. it resolves the `variant` itself as well as the inline style,
in that order: `<Text>` applies its variant's size and family internally, so
reading the style prop alone left svg drawing a 16px system-font number over a
34px archivo hole.

**dots stay flat.** the league dot, the chart legend dots, the on-strike marker
and `BandDot` are 6–9px. a three-stop gradient across eight pixels is one pixel
per stop: it reads as a smudge, not as metal. below about 16px a colour is a
marker, not a surface.

**only tinted numbers are struck.** a black number has no colour to catch light
and a gradient on it just looks grubby, so `GlossText` is for the band colours,
the league and the streak — not for body text.

**every gradient id is per-instance.** on web, react-native-svg renders into the
one document, where `url(#body)` resolves against the whole page rather than the
`<svg>` it was written in. a shared id silently paints every metal on screen in
whichever one mounted first — a wall of bronze, silver and gold badges came out
uniformly green exactly once.

## badges

`src/badges.ts` derives them, `src/ui/Badges.tsx` draws them, and they live on
the profile screen under identity — they are the part of the profile the
athlete didn't type in.

**nothing is stored.** every badge is a question asked of the progression on
render, so they cannot drift out of sync with what they claim to describe and a
reset clears them for free.

**earned on the best, never the latest.** a rating that dips the week after does
not take a badge back. earning something and watching it disappear is the
fastest way to stop trying.

**a badge carries its own metal.** the four tier badges wear the metal they are
named after; everything else wears amp's own. a locked badge wears none at all
— an absence of metal is a much better signal than a greyed-out copy of one,
and the locked progress bar is already filling in the metal it is working
toward, so the bar is a preview of the badge rather than a generic meter.

**the tier names follow the workbook** (bronze/silver/gold/elite), not the
reference mockup's silver/gold/platinum/elite — two ladders for one idea is how
a player ends up "platinum" on a card that has never heard of platinum.

## the score card

`src/ui/ScoreCard.tsx` renders it; `src/screens/ShareCard.tsx` previews and
exports it. `design/amp-score-card.svg` is the same design as a standalone file,
rendered by `design/render.mjs`.

**it is deliberately not themed.** a card that lands in someone's whatsapp is an
artefact, not a screen, so it holds one look wherever it was made.

**the whole plate is the rating.** it was brand green with the tier struck into
a chip in one corner, which made the loudest thing on the card the brand and the
earned thing a detail. the card is now the metal itself: a bronze player and an
elite player hold visibly different objects, and the tier needs no chip to
announce itself. everything printed on it is that metal's ink — never white,
which on a light metal is where premium turns cheap — and the meters are struck
in its own polish so they read as inlay rather than paint.

**no age band.** it was a filing category: useful to a coach reading a roster,
meaningless on an image whose job is one number, and it cost the header its
symmetry.

**one rhythm, and everything on the axis.** every gap on the plate is one value
or a clean fraction of it — including the gap between the indicator rows and the
gap between their columns, so the six read as a grid rather than two rows that
happen to be near each other. each cell is centred on its own column too: the
numbers were left-aligned, which left a ragged right edge under a card whose
every other element is centred on the plate's axis.

**the number takes the slack.** the plate carries a fixed amount of furniture —
name, six indicators, coverage, footer — and the layout used `space-between`,
which divides whatever is left between all of them, so adding the indicator grid
quietly crushed every gap at once and overran the plate. the rating now sits in
a `flex: 1` block and centres in whatever room the rest doesn't want, which is
also where the air belongs on a card like this.

**the ground lost its road.** the mark's receding road used to run up it. at
card scale the triangle apexed directly behind the name and the bar, so its
edges cut diagonals through the numbers — texture that cost more than it gave.
the mark says amp on its own.

**two zones, and a rule between them.** the first two layouts hung six meters
under a name and let `space-between` sort the gaps out, which read as a
dashboard someone had screenshotted. a card that gets posted has to survive
being a thumbnail: one number readable at 200px, one name, and the detail
arranged so the eye can skip it. so the plate is a hero — all anyone sees in a
feed — over a ruled stat sheet, which is what they get if they stop.

**the meters are gone.** six bars under six numbers said the same thing twice
and were the noisiest thing on the card. the ruled grid separates the six on its
own. the tier rule under the rating went with them, for the same reason the tier
chip went before it: the plate is the tier.

**the hero is sized to leave air.** at a larger numeral the hero block filled
its space exactly, which put the eyebrow under the wordmark and the top rule
against the subtitle. a number that big was buying nothing a thumbnail could
use.

**the card prints six indicators, not three components.** it used to print the
funnel composite — report 55, game iq 25, coaching 20. that described how much
of the product an athlete had used, which is amp's business and not theirs. the
card now prints the six-indicator model from `amp_card_indicators.xlsx`:
balance, power, timing, control, footwork and cricket iq, three across and
twice down. six in a single row is a row of digits nobody reads.

**an n/a keeps its slot.** the meter track is drawn under every indicator
whether or not it has a score, so an indicator this session couldn't see reads
as an empty slot rather than vanishing off the card and leaving the athlete to
count which one is missing.

**no "strongest" block.** it was a second thing to read on an image whose job is
one number, and it pushed the card to a 1.4 ratio to fit. the card is back to
4:5 and the room went to the score.

**archivo, or it isn't an amp card.** archivo is not a system font, so the svg
mirror falls back to helvetica in any renderer that doesn't have it — which is
how the committed png was once an amp card set in someone else's typeface.
`node design/render.mjs` inlines the four faces expo loads (500/600/700/800),
each under its own family name so nothing is synthesised, and writes the png.
regenerate it after any change to the card; that render is the reference, not
the svg.

**coverage rides with the rating, always.** an 84 built on 40% coverage is not
an 84, and the card is the one place that has to say so — a confident number on
thin evidence is the failure mode that costs credibility. under 60% the card
prints "provisional" on its face instead of a coverage figure.

**the rating is not the mean of the six.** it is the whole achieved/possible
fraction taken across every kpi at once, which is why it matches the card
rating on the kpi sheet exactly. averaging the six would silently reweight them
by nothing more than how much of each happened to be visible.

**export** captures a copy rendered at a fixed 1080px, parked off-screen —
capturing the on-screen card would bake in whatever width the device happened to
be, so the same card would come out different on every phone. ios gets a `UTI`
as well as a `mimeType`, per the sdk 57 sharing api. web has no capture path and
the button says so.

## growth

**progress → overview leads with the normalised chart**, because the score
itself is a number you already saw on the road; what you come here for is which
parts of your game are moving.

everything is rescaled to 0–100, so a 20-point section and a 3-point kpi sit on
the same axis and can be compared directly. two modes:

- **sections** — all seven at once, tap one to bring it forward
- **single kpi** — pick any kpi from the sheet and see just that trend, with the
  other eighteen dropped to faint context and the growth called out above the
  chart (`94  +28  across 12 sessions`)

that second mode is the one you want after a report has told you what to work
on: *is this specific thing actually getting better*.

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

**your own name doesn't appear on your own screens.** it was the same word on
every row of the session list and on a report only you can see. it survives in
one place — the share card, which is the only thing that leaves the phone.

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

**the cricket icons come from material community icons**, which ships an actual
`cricket` glyph and is already bundled with `@expo/vector-icons` — no extra
dependency, apache 2.0, no licensing question. these were hand-drawn svgs, and
a hand-drawn bat has a ceiling at 17px: it reads as a trowel. one professionally
drawn family beats three of mine.

`src/ui/Icons.tsx` still wraps them, so call sites don't know where the shapes
come from — change the `name` in that one file to move the whole app to another
set.

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
