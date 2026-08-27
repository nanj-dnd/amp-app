import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../../ui/Text';
import { Card, Divider } from '../../ui/Card';
import { Segmented } from '../../ui/Segmented';
import { useColors, space, font } from '../../theme';
import { Header } from './Setup';
import {
  battingCard,
  bowlingCard,
  extrasBreakdown,
  totalRuns,
  wickets,
  oversText,
  oversFor,
  runRate,
  describe,
  ballNumbers,
  nameLookup,
  teamById,
} from '../../match/engine';
import type { Match } from '../../match/types';

export function Scorecard({ match, onClose }: { match: Match; onClose: () => void }) {
  const c = useColors();
  const [view, setView] = useState<'card' | 'commentary'>('card');
  const [which, setWhich] = useState(match.innings.length - 1);
  const name = useMemo(() => nameLookup(match), [match]);
  const inn = match.innings[Math.min(which, match.innings.length - 1)];
  if (!inn) return null;

  const batTeam = teamById(match, inn.battingTeamId);
  const extras = extrasBreakdown(inn);
  const bat = battingCard(inn, batTeam);
  const numbers = ballNumbers(inn);
  const bowl = bowlingCard(inn).filter((b) => b.balls > 0);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Header title={batTeam.name} onClose={onClose} />

      <View style={{ padding: space.gutter, paddingBottom: space.md, gap: space.sm }}>
        {/* only worth a switcher once there are two innings to switch between */}
        {match.innings.length > 1 && (
          <Segmented
            size="sm"
            value={String(which)}
            onChange={(v) => setWhich(Number(v))}
            options={match.innings.map((x, i) => ({
              value: String(i),
              label: teamById(match, x.battingTeamId).name,
            }))}
          />
        )}
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'card', label: 'scorecard' },
            { value: 'commentary', label: 'commentary' },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: space.xxxl, gap: space.lg }}>
        <Card style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
            <Text style={{ fontFamily: font.black, fontSize: 30, letterSpacing: -1.4, color: c.text }}>
              {`${totalRuns(inn)}/${wickets(inn)}`}
            </Text>
            <Text variant="callout" tone="secondary">{`(${oversText(inn)})`}</Text>
            <View style={{ flex: 1 }} />
            <Text variant="caption" tone="tertiary">
              {`crr ${runRate(inn).toFixed(2)}`}
            </Text>
          </View>
          {inn.target !== undefined && (
            <Text variant="caption" tone="secondary">
              {`chasing ${inn.target}`}
            </Text>
          )}
          {match.result && (
            <Text variant="callout" tone="brand">
              {match.result}
            </Text>
          )}
        </Card>

        {view === 'card' ? (
          <>
            <Card padded={false}>
              <Row head cols={['batter', 'r', 'b', '4s', '6s', 'sr']} />
              {bat
                .filter((b) => b.balls > 0 || b.playerId === inn.strikerId || b.playerId === inn.nonStrikerId)
                .map((b, i) => (
                  <View key={b.playerId}>
                    {i > 0 && <Divider inset={space.lg} />}
                    <View style={{ paddingHorizontal: space.lg, paddingVertical: space.md, gap: 2 }}>
                      <Row
                        cols={[
                          name(b.playerId) + (b.playerId === inn.strikerId ? '*' : ''),
                          String(b.runs),
                          String(b.balls),
                          String(b.fours),
                          String(b.sixes),
                          b.sr.toFixed(1),
                        ]}
                        bare
                      />
                      <Text variant="tab" tone="tertiary">
                        {b.out
                          ? `${b.out.kind}${b.out.fielderId ? ` (${name(b.out.fielderId)})` : ''}`
                          : 'not out'}
                      </Text>
                    </View>
                  </View>
                ))}
              <Divider />
              <View style={{ paddingHorizontal: space.lg, paddingVertical: space.md, flexDirection: 'row' }}>
                <Text variant="callout" tone="secondary" style={{ flex: 1 }}>
                  extras
                </Text>
                <Text variant="callout" style={{ fontFamily: font.bold }}>
                  {String(extras.total)}
                </Text>
                <Text variant="caption" tone="tertiary" style={{ marginLeft: space.sm }}>
                  {`(wd ${extras.wd}, nb ${extras.nb}, b ${extras.b}, lb ${extras.lb})`}
                </Text>
              </View>
            </Card>

            <Card padded={false}>
              <Row head cols={['bowler', 'o', 'm', 'r', 'w', 'econ']} />
              {bowl.map((b, i) => (
                <View key={b.playerId}>
                  {i > 0 && <Divider inset={space.lg} />}
                  <View style={{ paddingHorizontal: space.lg, paddingVertical: space.md }}>
                    <Row
                      bare
                      cols={[
                        name(b.playerId),
                        oversFor(b.balls),
                        String(b.maidens),
                        String(b.runs),
                        String(b.wickets),
                        b.economy.toFixed(2),
                      ]}
                    />
                  </View>
                </View>
              ))}
            </Card>
          </>
        ) : (
          <Card padded={false}>
            {[...inn.balls].reverse().map((b, i) => (
              <View key={b.id}>
                {i > 0 && <Divider inset={space.lg} />}
                <View style={{ flexDirection: 'row', gap: space.md, padding: space.lg }}>
                  <Text variant="tab" tone="tertiary" style={{ width: 30 }}>
                    {numbers[b.id]}
                  </Text>
                  {/* describe() already names the region on boundaries */}
                  <Text variant="callout" style={{ flex: 1 }}>
                    {describe(b, name)}
                  </Text>
                </View>
              </View>
            ))}
            {inn.balls.length === 0 && (
              <Text variant="callout" tone="tertiary" align="center" style={{ padding: space.xxl }}>
                no balls bowled yet
              </Text>
            )}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ cols, head, bare }: { cols: string[]; head?: boolean; bare?: boolean }) {
  const c = useColors();
  const widths = [null, 28, 28, 26, 26, 44] as const;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: bare ? 0 : space.lg,
        paddingVertical: bare ? 0 : space.md,
        backgroundColor: head ? c.fill : 'transparent',
      }}
    >
      {cols.map((v, i) => (
        <Text
          key={i}
          variant={head ? 'tab' : 'callout'}
          tone={head ? 'tertiary' : i === 0 ? 'primary' : 'secondary'}
          numberOfLines={1}
          style={{
            flex: widths[i] === null ? 1 : undefined,
            width: widths[i] ?? undefined,
            textAlign: i === 0 ? 'left' : 'right',
            fontFamily: head ? undefined : i === 0 || i === 1 ? font.bold : font.regular,
          }}
        >
          {v}
        </Text>
      ))}
    </View>
  );
}
