import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../ui/Text';
import { Touch } from '../../ui/Pressable';
import { Button } from '../../ui/Button';
import { FieldDiagram } from '../../ui/FieldDiagram';
import { useColors, space, radius, font } from '../../theme';
import { scoreAnswer, type IqGame, type IqItem } from '../../gameiq';

/**
 * one scenario. the reasoning is revealed on every option, not just the picked
 * one — the "why" on the wrong answers is the actual teaching, and hiding three
 * quarters of it was the biggest thing wrong with the old card.
 */
export function ScenarioCard({
  game,
  item,
  onResolved,
  onNext,
}: {
  game: IqGame;
  item: IqItem;
  onResolved: (correct: boolean, pts: number) => void;
  onNext: () => void;
}) {
  const c = useColors();
  const [picked, setPicked] = useState<number | null>(null);
  const [awarded, setAwarded] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const remaining = useRef(game.timeLimit);
  const bar = useRef(new Animated.Value(1)).current;
  const [tick, setTick] = useState(game.timeLimit);

  const settled = picked !== null || timedOut;
  const isFieldPick = !!item.options[0].preset;

  useEffect(() => {
    Animated.timing(bar, {
      toValue: 0,
      duration: game.timeLimit * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    const id = setInterval(() => {
      remaining.current = Math.max(0, remaining.current - 0.1);
      setTick(remaining.current);
      if (remaining.current <= 0) {
        clearInterval(id);
        setTimedOut(true);
        onResolved(false, 0);
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (i: number) => {
    if (settled) return;
    bar.stopAnimation();
    const correct = item.options[i].correct;
    const pts = correct ? scoreAnswer(game.basePoints, remaining.current, game.timeLimit) : 0;
    setPicked(i);
    setAwarded(pts);
    onResolved(correct, pts);
  };

  const correct = picked !== null && item.options[picked].correct;
  const urgent = !settled && tick < game.timeLimit * 0.3;

  return (
    <View style={{ gap: space.xl }}>
      {/* timer runs full-bleed at the very top — it belongs to the screen, not
          to a card, so it can't be mistaken for part of the question */}
      <View style={{ paddingHorizontal: space.gutter, gap: space.sm }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: c.fill, overflow: 'hidden' }}>
          <Animated.View
            style={{
              height: '100%',
              borderRadius: 3,
              backgroundColor: settled ? c.textTertiary : urgent ? c.score.poor : c.brand,
              width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="tab" tone="tertiary" style={{ flex: 1 }}>
            {settled ? 'answer locked' : 'answer before the bar runs out'}
          </Text>
          <Text
            variant="caption"
            color={urgent ? c.score.poor : c.textTertiary}
            style={{ fontFamily: font.bold }}
          >
            {`${Math.ceil(tick)}s`}
          </Text>
        </View>
      </View>

      {/* the situation */}
      <View style={{ paddingHorizontal: space.gutter, gap: space.lg }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {item.ticker.map(([k, v]) => (
            <View
              key={k}
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: 5,
                paddingHorizontal: space.md,
                paddingVertical: 5,
                borderRadius: radius.sm,
                backgroundColor: c.fill,
              }}
            >
              <Text variant="tab" tone="tertiary">
                {k}
              </Text>
              <Text variant="caption" style={{ fontFamily: font.bold }}>
                {v}
              </Text>
            </View>
          ))}
        </View>

        {game.advisor && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="shield-checkmark" size={14} color={c.brand} />
            <Text variant="caption" tone="brand" preserveCase>
              {game.advisor}
            </Text>
          </View>
        )}

        <Text variant="body" style={{ lineHeight: 25 }}>
          {item.scenario}
        </Text>

        {item.contextField && (
          <View style={{ alignItems: 'center', gap: space.sm }}>
            <FieldDiagram preset={item.contextField} size={168} />
            <Text variant="caption" tone="tertiary">
              the field as it's set — pick the shot that beats it
            </Text>
          </View>
        )}
      </View>

      {/* the question, visually separated from the situation */}
      <View
        style={{
          marginHorizontal: space.gutter,
          padding: space.lg,
          borderRadius: radius.md,
          backgroundColor: c.surfaceAlt,
          borderLeftWidth: 3,
          borderLeftColor: c.brand,
        }}
      >
        <Text variant="bodyStrong">{item.question}</Text>
      </View>

      {/* answers */}
      <View style={{ paddingHorizontal: space.gutter, gap: space.sm }}>
        {isFieldPick ? (
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {item.options.map((o, i) => {
              const isPicked = picked === i;
              const show = settled;
              return (
                <Touch
                  key={i}
                  haptic={settled ? false : 'light'}
                  scale={!settled}
                  onPress={() => choose(i)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    gap: space.sm,
                    padding: space.md,
                    borderRadius: radius.md,
                    borderWidth: show && (o.correct || isPicked) ? 2 : StyleSheet.hairlineWidth,
                    borderColor: show ? (o.correct ? c.score.good : isPicked ? c.score.poor : c.hairline) : c.hairline,
                    backgroundColor: show && o.correct ? c.brandTint : c.surface,
                  }}
                >
                  <FieldDiagram preset={o.preset!} size={84} />
                  <Text variant="tab" align="center">
                    {o.text}
                  </Text>
                </Touch>
              );
            })}
          </View>
        ) : (
          item.options.map((o, i) => {
            const isPicked = picked === i;
            const show = settled;
            const edge = show ? (o.correct ? c.score.good : isPicked ? c.score.poor : c.hairline) : c.hairline;
            return (
              <Touch
                key={i}
                haptic={settled ? false : 'light'}
                scale={!settled}
                onPress={() => choose(i)}
                style={{
                  flexDirection: 'row',
                  gap: space.md,
                  borderRadius: radius.md,
                  borderWidth: show && (o.correct || isPicked) ? 1.5 : StyleSheet.hairlineWidth,
                  borderColor: edge,
                  backgroundColor: show && o.correct ? c.brandTint : c.surface,
                  padding: space.lg,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: show ? (o.correct ? c.score.good : isPicked ? c.score.poor : c.fill) : c.fill,
                  }}
                >
                  <Text
                    variant="tab"
                    preserveCase
                    color={show && (o.correct || isPicked) ? '#FFFFFF' : c.textSecondary}
                    style={{ fontFamily: font.black }}
                  >
                    {String.fromCharCode(65 + i)}
                  </Text>
                </View>

                <View style={{ flex: 1, gap: space.sm }}>
                  <Text variant="callout">{o.text}</Text>
                  {show && (
                    <Text variant="caption" tone="secondary" style={{ lineHeight: 19 }}>
                      {o.why}
                    </Text>
                  )}
                </View>
              </Touch>
            );
          })
        )}
      </View>

      {/* field answers keep their reasoning below, where there's room for it */}
      {settled && isFieldPick && (
        <View style={{ paddingHorizontal: space.gutter, gap: space.sm }}>
          {item.options.map((o, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: space.sm }}>
              <Ionicons
                name={o.correct ? 'checkmark-circle' : 'close-circle'}
                size={15}
                color={o.correct ? c.score.good : c.textTertiary}
                style={{ marginTop: 2 }}
              />
              <Text variant="caption" tone="secondary" style={{ flex: 1, lineHeight: 19 }}>
                {`${o.text} — ${o.why}`}
              </Text>
            </View>
          ))}
        </View>
      )}

      {settled && (
        <View
          style={{
            marginHorizontal: space.gutter,
            padding: space.lg,
            borderRadius: radius.md,
            backgroundColor: correct ? c.brandTint : c.fill,
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md,
          }}
        >
          <Ionicons
            name={timedOut ? 'time' : correct ? 'checkmark-circle' : 'information-circle'}
            size={20}
            color={correct ? c.brand : c.textSecondary}
          />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" tone={correct ? 'brand' : 'primary'}>
              {timedOut ? 'out of time' : correct ? 'correct' : 'not this one'}
            </Text>
            <Text variant="caption" tone="secondary">
              {`+${awarded} pts`}
            </Text>
          </View>
          <Button label="next" size="sm" icon="arrow-forward" onPress={onNext} />
        </View>
      )}
    </View>
  );
}
