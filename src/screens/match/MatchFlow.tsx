import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { MatchSetup } from './Setup';
import { Squads, Toss } from './Squads';
import { Scoring } from './Scoring';
import { Scorecard } from './Scorecard';
import { InningsBreak, MatchResult } from './InningsBreak';
import { startSecondInnings, closeMatch } from '../../match/engine';
import { useStore } from '../../state/store';
import type { Match } from '../../match/types';

type Stage = 'setup' | 'squads' | 'toss' | 'scoring' | 'card' | 'break' | 'result';

/**
 * owns the match lifecycle: setup -> squads -> toss -> scoring. resuming a live
 * match jumps straight to scoring, because the only reason to open this screen
 * mid-game is to score the next ball.
 */
export function MatchFlow({ matchId, onExit }: { matchId?: string; onExit: () => void }) {
  const { match: slice, saveMatch } = useStore();
  const existing = matchId ? slice.matches.find((m) => m.id === matchId) : undefined;

  const [stage, setStage] = useState<Stage>(
    existing ? (existing.status === 'done' ? 'result' : existing.status === 'live' ? 'scoring' : 'squads') : 'setup',
  );
  const [draft, setDraft] = useState<Match | null>(existing ?? null);

  const persist = (m: Match) => {
    setDraft(m);
    saveMatch(m);
  };

  if (stage === 'setup')
    return (
      <MatchSetup
        onStart={(m) => {
          setDraft(m);
          setStage('squads');
        }}
        onClose={onExit}
      />
    );

  if (!draft) return <View />;

  if (stage === 'squads')
    return (
      <Squads
        match={draft}
        onDone={(m) => {
          setDraft(m);
          setStage('toss');
        }}
        onClose={() => setStage('setup')}
      />
    );

  if (stage === 'toss')
    return (
      <Toss
        match={draft}
        onDone={(m) => {
          const started = openInnings(m);
          persist(started);
          setStage('scoring');
        }}
        onClose={() => setStage('squads')}
      />
    );

  if (stage === 'card')
    return <Scorecard match={draft} onClose={() => setStage(draft.status === 'done' ? 'result' : 'scoring')} />;

  if (stage === 'break')
    return (
      <InningsBreak
        match={draft}
        onExit={onExit}
        onStart={() => {
          persist(startSecondInnings(draft));
          setStage('scoring');
        }}
      />
    );

  if (stage === 'result') return <MatchResult match={draft} onDone={onExit} />;

  return (
    <Scoring
      match={draft}
      onChange={persist}
      onOpenCard={() => setStage('card')}
      onInningsEnd={(_reason, updated) => {
        // first innings closes into the break; the second closes the match
        setDraft(updated);
        if (updated.innings.length === 1) return setStage('break');
        persist(closeMatch(updated));
        setStage('result');
      }}
      onClose={() =>
        Alert.alert('leave the match?', 'it stays live and you can pick it up from the road.', [
          { text: 'keep scoring', style: 'cancel' },
          { text: 'leave', onPress: onExit },
        ])
      }
    />
  );
}

/** opens the first innings from the toss decision. */
function openInnings(m: Match): Match {
  const [a, b] = m.teams;
  const wonBy = m.toss!.wonBy;
  const elected = m.toss!.elected;
  const battingFirst = elected === 'bat' ? wonBy : wonBy === a.id ? b.id : a.id;
  const bat = battingFirst === a.id ? a : b;
  const bowl = battingFirst === a.id ? b : a;

  return {
    ...m,
    status: 'live',
    innings: [
      {
        battingTeamId: bat.id,
        bowlingTeamId: bowl.id,
        balls: [],
        strikerId: bat.players[0].id,
        nonStrikerId: bat.players[1].id,
        bowlerId: null,
        out: [],
        closed: false,
      },
    ],
  };
}
