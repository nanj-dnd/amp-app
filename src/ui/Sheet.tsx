import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  Modal,
  Animated,
  Easing,
  Pressable,
  PanResponder,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useColors,
  space,
  radius,
  springConfig,
  handoff,
  rubberband,
  snapTo,
  useReduceMotion,
} from '../theme';

/**
 * every bottom sheet in the app.
 *
 * these used to be absolutely-positioned views inside whichever screen opened
 * them, which put them *under* the tab bar — the tab bar is a later sibling in
 * the tree, so it painted on top and clipped the bottom of every sheet.
 * a real Modal renders above the whole app, which is the only reliable way to
 * do this in react native; there are no portals.
 *
 * it is also draggable, and that is not decoration. a sheet that can only be
 * dismissed by a button is a dialog wearing a sheet's clothes: the shape
 * promises you can push it away, and every ios sheet keeps that promise. the
 * three things that make the promise feel real:
 *
 *   1:1        while your finger is down the sheet is exactly where you put it.
 *   momentum   on release it goes where the flick was *heading*, not to the
 *              nearest edge — so a short fast flick dismisses and a long slow
 *              drag back does not.
 *   grabbable  you can catch it mid-animation and reverse it. the animation
 *              always restarts from where the sheet actually is on screen.
 *
 * it also enters and leaves along the same path. the old one slid up 40px and
 * then vanished with the modal's cross-fade, which is the one thing a sheet
 * must not do — if it arrived from below it has to leave downwards or the
 * gesture and the animation stop describing the same object.
 */

const GRAB_THRESHOLD = 10; // px of travel before we commit to a drag (§ hysteresis)

/**
 * lets anything inside a sheet close it *with the animation* rather than by
 * yanking the modal out of the tree. without this, a row that closes the sheet
 * on tap gets a hard cut while a drag on the same sheet gets physics.
 */
/** one finger, travelling further down than across, past the slop. */
const wants = (e: GestureResponderEvent, g: PanResponderGestureState) =>
  e.nativeEvent.touches.length === 1 &&
  Math.abs(g.dy) > GRAB_THRESHOLD &&
  Math.abs(g.dy) > Math.abs(g.dx);

const DismissCtx = createContext<(then?: () => void) => void>(() => {});

export function useSheetDismiss() {
  return useContext(DismissCtx);
}

export function Sheet({
  onClose,
  children,
  /** sheets whose content can outgrow the screen get their own scroll view */
  scroll = false,
  maxHeightRatio = 0.86,
}: {
  onClose: () => void;
  children: React.ReactNode;
  scroll?: boolean;
  maxHeightRatio?: number;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const screen = useWindowDimensions();
  const reduce = useReduceMotion();

  /** distance below its resting place, in px. 0 is open, `height` is gone. */
  const y = useRef(new Animated.Value(screen.height)).current;
  const fade = useRef(new Animated.Value(0)).current;
  /** the on-screen value, mirrored into js so a grab can start from it. */
  const pos = useRef(screen.height);
  const height = useRef(0);
  const [measured, setMeasured] = useState(0);
  const closing = useRef(false);

  useEffect(() => {
    const id = y.addListener(({ value }) => (pos.current = value));
    return () => y.removeListener(id);
  }, [y]);

  const settle = useCallback(
    (velocity = 0) => {
      Animated.spring(y, {
        toValue: 0,
        ...springConfig(reduce ? 'ui' : 'sheet', { velocity }),
      }).start();
    },
    [y, reduce],
  );

  /** leave the way we arrived: downwards, carrying whatever speed we had. */
  const dismiss = useCallback(
    (then?: () => void, velocity = 0) => {
      if (closing.current) return;
      closing.current = true;
      const done = () => (then ?? onClose)();

      if (reduce) {
        Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }).start(done);
        return;
      }
      Animated.parallel([
        Animated.spring(y, {
          toValue: height.current || screen.height,
          ...springConfig('sheet', { velocity }),
        }),
        Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(done);
    },
    [y, fade, onClose, reduce, screen.height],
  );

  /** first layout is the only moment we know how tall the sheet is. */
  const onPanelLayout = (h: number) => {
    if (height.current) return;
    height.current = h;
    setMeasured(h);
    y.setValue(h); // still offscreen — this jump is invisible
    Animated.timing(fade, {
      toValue: 1,
      duration: reduce ? 180 : 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    if (reduce) y.setValue(0);
    else settle();
  };

  const startY = useRef(0);
  const pan = useRef(
    PanResponder.create({
      // never steal the first touch — a tap on a row inside the sheet is a tap.
      onStartShouldSetPanResponder: () => false,

      // but a *drag* that started on a row is still a drag on the sheet. this
      // has to be the capture phase: the row's own pressable would otherwise
      // hold the touch for the whole gesture and the sheet would only be
      // draggable by its margins. both are watched from the first move and the
      // loser is dropped once the intent is clear — under the threshold it
      // stays a tap and the row keeps it, over the threshold the sheet takes
      // it and the row's press is cancelled for us.
      onMoveShouldSetPanResponderCapture: (e, g) => wants(e, g),
      onMoveShouldSetPanResponder: (e, g) => wants(e, g),

      // catch it wherever it currently is, mid-flight included.
      onPanResponderGrant: () => {
        y.stopAnimation();
        startY.current = pos.current;
      },

      onPanResponderMove: (e, g) => {
        // a second finger landing mid-drag rewrites gestureState to the
        // centroid of both, which teleports the sheet. the drag belongs to the
        // finger that started it.
        if (e.nativeEvent.touches.length > 1) return;
        const raw = startY.current + g.dy;
        // above its resting place there is nothing to reveal, so resist instead
        // of following — the sheet stays with you, the travel just stops paying.
        y.setValue(raw < 0 ? -rubberband(-raw, height.current || 400) : raw);
      },

      onPanResponderRelease: (_e, g) => {
        const v = handoff(g.vy); // PanResponder is px/ms, springs are px/s
        const h = height.current || 400;
        // land where the flick was going, then snap to whichever end is nearer
        // *that* point. this is the whole difference between "it moved" and
        // "i threw it".
        if (snapTo(pos.current, v, [0, h]) === h) dismiss(undefined, v);
        else settle(v);
      },

      onPanResponderTerminate: () => settle(),
    }),
  ).current;

  const scrim = fade.interpolate({ inputRange: [0, 1], outputRange: [0, 0.42] });
  // the scrim thins out as you push the sheet away, so the drag reads as one
  // continuous gesture rather than a panel sliding over a fixed grey pane.
  const scrimDrag = measured
    ? y.interpolate({ inputRange: [0, measured], outputRange: [1, 0], extrapolate: 'clamp' })
    : 1;

  const grabber = (
    <View style={{ paddingTop: space.xs, paddingBottom: space.sm, alignItems: 'center' }}>
      <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.fillStrong }} />
    </View>
  );

  const panel = (
    <Animated.View
      onLayout={(e) => onPanelLayout(e.nativeEvent.layout.height)}
      {...(scroll ? {} : pan.panHandlers)}
      style={{
        backgroundColor: c.surface,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        paddingTop: space.sm,
        paddingBottom: Math.max(insets.bottom, space.lg),
        maxHeight: `${maxHeightRatio * 100}%`,
        opacity: fade,
        transform: reduce ? [] : [{ translateY: y }],
      }}
    >
      {/* on a scrolling sheet the list owns vertical drags, so the handle is
          the part you grab. it is a 20pt-tall target for a 4pt bar. */}
      {scroll ? <View {...pan.panHandlers}>{grabber}</View> : grabber}
      {scroll ? (
        <ScrollView
          // the fixed variant gets its rhythm from `gap`; the scrolling one was
          // missing it, so every scrolling sheet came out cramped
          contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: space.lg, gap: space.lg }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ paddingHorizontal: space.gutter, gap: space.lg }}>{children}</View>
      )}
    </Animated.View>
  );

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={() => dismiss()}>
      <DismissCtx.Provider value={dismiss}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: '#000', opacity: Animated.multiply(scrim, scrimDrag) },
            ]}
          />
          <Pressable style={{ flex: 1 }} onPress={() => dismiss()} />
          {panel}
        </View>
      </DismissCtx.Provider>
    </Modal>
  );
}

/** full-screen cover, for the exercise picker and anything else list-shaped. */
export function FullSheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const c = useColors();
  const reduce = useReduceMotion();
  return (
    <Modal
      transparent={false}
      visible
      // a full-screen cover that fades has no direction, so there is nothing to
      // reverse it along. it slides — unless the athlete asked us not to.
      animationType={reduce ? 'fade' : 'slide'}
      onRequestClose={onClose}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg }]}>{children}</View>
    </Modal>
  );
}
