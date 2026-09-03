import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { Wordmark } from '../ui/Logo';
import { Text } from '../ui/Text';
import { useColors, space, font, useReduceMotion } from '../theme';

/**
 * held for a beat while the store hydrates. the mark draws itself in rather
 * than just appearing, so the wait reads as the app waking up.
 */
export function SplashScreen({ onDone, minMs = 1400 }: { onDone: () => void; minMs?: number }) {
  const c = useColors();
  const reduce = useReduceMotion();
  const rise = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;

  // the parent re-renders the moment the store finishes hydrating. keeping the
  // callback in a ref means that re-render can't restart the sequence — which
  // would interrupt the first run, leave `finished` false on both, and strand
  // the app on the splash exactly when hydration was slow enough to matter.
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    let fired = false;
    const finish = () => {
      if (fired) return;
      fired = true;
      done.current();
    };

    const seq = Animated.sequence([
      // the one scripted overshoot left in the app. a splash is a brand moment
      // rather than a control, and nothing here is waiting on the athlete.
      Animated.timing(rise, { toValue: 1, duration: 620, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      Animated.timing(word, { toValue: 1, duration: 340, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.delay(Math.max(0, minMs - 960)),
      Animated.timing(out, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]);
    seq.start(({ finished }) => finished && finish());

    // a splash must never be able to trap the app, whatever the animation does
    const guard = setTimeout(finish, minMs + 2500);
    return () => {
      clearTimeout(guard);
      seq.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: c.bg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.lg,
        opacity: out,
      }}
    >
      {/* the lockup already contains the mark — showing both was the mark twice */}
      <Animated.View
        style={{
          opacity: rise,
          // reduced motion keeps the fade and drops the travel. the setting
          // resolves a frame or two after mount, which is why this is read at
          // render time and not baked into the sequence above.
          transform: reduce
            ? []
            : [
                { scale: rise.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) },
                { translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
              ],
        }}
      >
        <Wordmark width={168} />
      </Animated.View>
    </Animated.View>
  );
}
