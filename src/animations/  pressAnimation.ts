// src/animations/buttonAnimation.ts

import {
  Easing,
  SharedValue,
  withTiming,
} from 'react-native-reanimated';

const timing = {
  duration: 120,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
};

export const buttonPressIn = (
  scale: SharedValue<number>,
  translateY: SharedValue<number>,
) => {
  'worklet';

  scale.value = withTiming(0.98, timing);
  translateY.value = withTiming(4, timing);
};

export const buttonPressOut = (
  scale: SharedValue<number>,
  translateY: SharedValue<number>,
) => {
  'worklet';

  scale.value = withTiming(1, timing);
  translateY.value = withTiming(0, timing);
};