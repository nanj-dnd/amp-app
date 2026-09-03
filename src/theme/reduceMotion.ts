import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * the athlete has asked the os to calm things down.
 *
 * this never means *no* feedback — it means the gentle equivalent: cross-fade
 * instead of slide, no overshoot, no travel. components read this and choose a
 * different motion, they do not switch motion off.
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setReduce(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub?.remove();
    };
  }, []);

  return reduce;
}
