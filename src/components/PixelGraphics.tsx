import React, {useEffect} from 'react';
import {StyleSheet, ViewStyle} from 'react-native';
import Svg, {Rect} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type PixelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
};

type PixelItemData = {
  left: number;
  top: number;
  popDelay: number;
  floatDelay: number;
  rotation: number;
  width: number;
  height: number;
  viewBox: string;
  rects: PixelRect[];
};

type PixelItemProps = PixelItemData;

const POP_CONFIG = {
  duration: 700,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
};

const FLOAT_DURATION = 1800;

function PixelItem({
  left,
  top,
  popDelay,
  floatDelay,
  rotation,
  width,
  height,
  viewBox,
  rects,
}: PixelItemProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.72);
  const translateY = useSharedValue(10);
  const floatY = useSharedValue(0);
  const floatRotate = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      popDelay,
      withTiming(1, POP_CONFIG),
    );

    scale.value = withDelay(
      popDelay,
      withTiming(1, POP_CONFIG),
    );

    translateY.value = withDelay(
      popDelay,
      withTiming(0, POP_CONFIG),
    );

    floatY.value = withDelay(
      floatDelay,
      withRepeat(
        withSequence(
          withTiming(-5, {
            duration: FLOAT_DURATION,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(5, {
            duration: FLOAT_DURATION,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        true,
      ),
    );

    floatRotate.value = withDelay(
      floatDelay,
      withRepeat(
        withSequence(
          withTiming(-2, {
            duration: FLOAT_DURATION,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(2, {
            duration: FLOAT_DURATION,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        true,
      ),
    );
  }, [
    floatDelay,
    floatRotate,
    floatY,
    opacity,
    popDelay,
    scale,
    translateY,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        {translateY: translateY.value + floatY.value},
        {scale: scale.value},
        {rotate: `${rotation + floatRotate.value}deg`},
      ],
    };
  });

  const positionStyle: ViewStyle = {
    position: 'absolute',
    left,
    top,
    width,
    height,
  };

  return (
    <Animated.View style={[positionStyle, animatedStyle]}>
      <Svg
        width={width}
        height={height}
        viewBox={viewBox}
      >
        {rects.map((rect, index) => (
          <Rect
            key={`${index}-${rect.x}-${rect.y}`}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill={rect.fill}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

const PIXELS: PixelItemData[] = [{"left":26.0,"top":108.0,"popDelay":500,"floatDelay":0,"rotation":-10.0,"width":71.4,"height":75.60000000000001,"viewBox":"0 0 71.4 75.60000000000001","rects":[{"x":0.0,"y":33.6,"width":71.4,"height":4.2,"fill":"rgba(10,10,10,0.16)"},{"x":4.2,"y":16.8,"width":63.0,"height":4.2,"fill":"rgba(10,10,10,0.16)"},{"x":4.2,"y":54.6,"width":63.0,"height":4.2,"fill":"rgba(10,10,10,0.16)"},{"x":4.2,"y":21.0,"width":63.0,"height":4.2,"fill":"rgba(10,10,10,0.16)"},{"x":21.0,"y":71.4,"width":29.400000000000002,"height":4.2,"fill":"rgba(10,10,10,0.16)"},{"x":4.2,"y":58.800000000000004,"width":63.0,"height":4.2,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":42.0,"width":71.4,"height":4.2,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":50.400000000000006,"width":71.4,"height":4.2,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":37.800000000000004,"width":71.4,"height":4.2,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":25.200000000000003,"width":71.4,"height":4.2,"fill":"rgba(10,10,10,0.16)"},{"x":8.4,"y":63.0,"width":54.6,"height":4.2,"fill":"rgba(10,10,10,0.16)"},{"x":8.4,"y":12.600000000000001,"width":54.6,"height":4.2,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":46.2,"width":71.4,"height":4.2,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":29.400000000000002,"width":71.4,"height":4.2,"fill":"rgba(10,10,10,0.16)"},{"x":12.600000000000001,"y":8.4,"width":46.2,"height":4.2,"fill":"rgba(10,10,10,0.16)"},{"x":12.600000000000001,"y":67.2,"width":46.2,"height":4.2,"fill":"rgba(10,10,10,0.16)"},{"x":21.0,"y":4.2,"width":29.400000000000002,"height":4.2,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":29.400000000000002,"width":71.4,"height":4.2,"fill":"#D9D9D1"},{"x":4.2,"y":12.600000000000001,"width":63.0,"height":4.2,"fill":"#D9D9D1"},{"x":4.2,"y":50.400000000000006,"width":63.0,"height":4.2,"fill":"#D9D9D1"},{"x":4.2,"y":16.8,"width":63.0,"height":4.2,"fill":"#D9D9D1"},{"x":21.0,"y":67.2,"width":29.400000000000002,"height":4.2,"fill":"#D9D9D1"},{"x":4.2,"y":54.6,"width":63.0,"height":4.2,"fill":"#D9D9D1"},{"x":0.0,"y":37.800000000000004,"width":71.4,"height":4.2,"fill":"#D9D9D1"},{"x":0.0,"y":46.2,"width":71.4,"height":4.2,"fill":"#D9D9D1"},{"x":0.0,"y":33.6,"width":71.4,"height":4.2,"fill":"#D9D9D1"},{"x":0.0,"y":21.0,"width":71.4,"height":4.2,"fill":"#D9D9D1"},{"x":8.4,"y":58.800000000000004,"width":54.6,"height":4.2,"fill":"#D9D9D1"},{"x":8.4,"y":8.4,"width":54.6,"height":4.2,"fill":"#D9D9D1"},{"x":0.0,"y":42.0,"width":71.4,"height":4.2,"fill":"#D9D9D1"},{"x":0.0,"y":25.200000000000003,"width":71.4,"height":4.2,"fill":"#D9D9D1"},{"x":12.600000000000001,"y":4.2,"width":46.2,"height":4.2,"fill":"#D9D9D1"},{"x":12.600000000000001,"y":63.0,"width":46.2,"height":4.2,"fill":"#D9D9D1"},{"x":21.0,"y":0.0,"width":29.400000000000002,"height":4.2,"fill":"#D9D9D1"},{"x":4.2,"y":29.400000000000002,"width":63.0,"height":4.2,"fill":"#FFFFFF"},{"x":8.4,"y":12.600000000000001,"width":54.6,"height":4.2,"fill":"#FFFFFF"},{"x":8.4,"y":50.400000000000006,"width":54.6,"height":4.2,"fill":"#FFFFFF"},{"x":8.4,"y":16.8,"width":54.6,"height":4.2,"fill":"#FFFFFF"},{"x":8.4,"y":54.6,"width":54.6,"height":4.2,"fill":"#FFFFFF"},{"x":4.2,"y":37.800000000000004,"width":63.0,"height":4.2,"fill":"#FFFFFF"},{"x":4.2,"y":46.2,"width":63.0,"height":4.2,"fill":"#FFFFFF"},{"x":4.2,"y":33.6,"width":63.0,"height":4.2,"fill":"#FFFFFF"},{"x":4.2,"y":21.0,"width":63.0,"height":4.2,"fill":"#FFFFFF"},{"x":12.600000000000001,"y":58.800000000000004,"width":46.2,"height":4.2,"fill":"#FFFFFF"},{"x":4.2,"y":42.0,"width":63.0,"height":4.2,"fill":"#FFFFFF"},{"x":4.2,"y":25.200000000000003,"width":63.0,"height":4.2,"fill":"#FFFFFF"},{"x":12.600000000000001,"y":8.4,"width":46.2,"height":4.2,"fill":"#FFFFFF"},{"x":21.0,"y":63.0,"width":29.400000000000002,"height":4.2,"fill":"#FFFFFF"},{"x":21.0,"y":4.2,"width":29.400000000000002,"height":4.2,"fill":"#FFFFFF"},{"x":25.200000000000003,"y":12.600000000000001,"width":21.0,"height":4.2,"fill":"#0A0A0A"},{"x":16.8,"y":16.8,"width":8.4,"height":4.2,"fill":"#0A0A0A"},{"x":46.2,"y":16.8,"width":8.4,"height":4.2,"fill":"#0A0A0A"},{"x":16.8,"y":21.0,"width":4.2,"height":4.2,"fill":"#0A0A0A"},{"x":50.400000000000006,"y":21.0,"width":4.2,"height":4.2,"fill":"#0A0A0A"},{"x":12.600000000000001,"y":25.200000000000003,"width":4.2,"height":4.2,"fill":"#0A0A0A"},{"x":54.6,"y":25.200000000000003,"width":4.2,"height":4.2,"fill":"#0A0A0A"},{"x":12.600000000000001,"y":29.400000000000002,"width":4.2,"height":4.2,"fill":"#0A0A0A"},{"x":54.6,"y":29.400000000000002,"width":4.2,"height":4.2,"fill":"#0A0A0A"},{"x":12.600000000000001,"y":33.6,"width":4.2,"height":4.2,"fill":"#0A0A0A"},{"x":54.6,"y":33.6,"width":4.2,"height":4.2,"fill":"#0A0A0A"},{"x":12.600000000000001,"y":37.800000000000004,"width":4.2,"height":4.2,"fill":"#0A0A0A"},{"x":54.6,"y":37.800000000000004,"width":4.2,"height":4.2,"fill":"#0A0A0A"},{"x":12.600000000000001,"y":42.0,"width":4.2,"height":4.2,"fill":"#0A0A0A"},{"x":54.6,"y":42.0,"width":4.2,"height":4.2,"fill":"#0A0A0A"},{"x":16.8,"y":46.2,"width":4.2,"height":4.2,"fill":"#0A0A0A"},{"x":50.400000000000006,"y":46.2,"width":4.2,"height":4.2,"fill":"#0A0A0A"},{"x":16.8,"y":50.400000000000006,"width":8.4,"height":4.2,"fill":"#0A0A0A"},{"x":46.2,"y":50.400000000000006,"width":8.4,"height":4.2,"fill":"#0A0A0A"},{"x":25.200000000000003,"y":54.6,"width":21.0,"height":4.2,"fill":"#0A0A0A"},{"x":25.200000000000003,"y":16.8,"width":21.0,"height":4.2,"fill":"#B8FF4A"},{"x":21.0,"y":21.0,"width":4.2,"height":4.2,"fill":"#B8FF4A"},{"x":33.6,"y":21.0,"width":16.8,"height":4.2,"fill":"#B8FF4A"},{"x":16.8,"y":25.200000000000003,"width":4.2,"height":4.2,"fill":"#B8FF4A"},{"x":25.200000000000003,"y":25.200000000000003,"width":4.2,"height":4.2,"fill":"#B8FF4A"},{"x":42.0,"y":25.200000000000003,"width":12.600000000000001,"height":4.2,"fill":"#B8FF4A"},{"x":16.8,"y":29.400000000000002,"width":8.4,"height":4.2,"fill":"#B8FF4A"},{"x":29.400000000000002,"y":29.400000000000002,"width":12.600000000000001,"height":4.2,"fill":"#B8FF4A"},{"x":46.2,"y":29.400000000000002,"width":8.4,"height":4.2,"fill":"#B8FF4A"},{"x":16.8,"y":33.6,"width":8.4,"height":4.2,"fill":"#B8FF4A"},{"x":29.400000000000002,"y":33.6,"width":12.600000000000001,"height":4.2,"fill":"#B8FF4A"},{"x":46.2,"y":33.6,"width":8.4,"height":4.2,"fill":"#B8FF4A"},{"x":16.8,"y":37.800000000000004,"width":8.4,"height":4.2,"fill":"#B8FF4A"},{"x":29.400000000000002,"y":37.800000000000004,"width":12.600000000000001,"height":4.2,"fill":"#B8FF4A"},{"x":46.2,"y":37.800000000000004,"width":8.4,"height":4.2,"fill":"#B8FF4A"},{"x":16.8,"y":42.0,"width":12.600000000000001,"height":4.2,"fill":"#B8FF4A"},{"x":42.0,"y":42.0,"width":12.600000000000001,"height":4.2,"fill":"#B8FF4A"},{"x":21.0,"y":46.2,"width":29.400000000000002,"height":4.2,"fill":"#B8FF4A"},{"x":25.200000000000003,"y":21.0,"width":8.4,"height":4.2,"fill":"#FFFFFF"},{"x":21.0,"y":25.200000000000003,"width":4.2,"height":4.2,"fill":"#FFFFFF"},{"x":29.400000000000002,"y":25.200000000000003,"width":12.600000000000001,"height":4.2,"fill":"#86C22A"},{"x":25.200000000000003,"y":29.400000000000002,"width":4.2,"height":4.2,"fill":"#86C22A"},{"x":42.0,"y":29.400000000000002,"width":4.2,"height":4.2,"fill":"#86C22A"},{"x":25.200000000000003,"y":33.6,"width":4.2,"height":4.2,"fill":"#86C22A"},{"x":42.0,"y":33.6,"width":4.2,"height":4.2,"fill":"#86C22A"},{"x":25.200000000000003,"y":37.800000000000004,"width":4.2,"height":4.2,"fill":"#86C22A"},{"x":42.0,"y":37.800000000000004,"width":4.2,"height":4.2,"fill":"#86C22A"},{"x":29.400000000000002,"y":42.0,"width":12.600000000000001,"height":4.2,"fill":"#86C22A"},{"x":25.200000000000003,"y":50.400000000000006,"width":21.0,"height":4.2,"fill":"#86C22A"}]},{"left":292.0,"top":92.0,"popDelay":650,"floatDelay":1200,"rotation":8.0,"width":68.0,"height":68.0,"viewBox":"0 0 68.0 68.0","rects":[{"x":0.0,"y":32.0,"width":68.0,"height":4.0,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":16.0,"width":68.0,"height":4.0,"fill":"rgba(10,10,10,0.16)"},{"x":16.0,"y":52.0,"width":36.0,"height":4.0,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":20.0,"width":68.0,"height":4.0,"fill":"rgba(10,10,10,0.16)"},{"x":12.0,"y":4.0,"width":20.0,"height":4.0,"fill":"rgba(10,10,10,0.16)"},{"x":36.0,"y":4.0,"width":20.0,"height":4.0,"fill":"rgba(10,10,10,0.16)"},{"x":20.0,"y":56.0,"width":28.0,"height":4.0,"fill":"rgba(10,10,10,0.16)"},{"x":4.0,"y":40.0,"width":60.0,"height":4.0,"fill":"rgba(10,10,10,0.16)"},{"x":12.0,"y":48.0,"width":44.0,"height":4.0,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":36.0,"width":68.0,"height":4.0,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":24.0,"width":68.0,"height":4.0,"fill":"rgba(10,10,10,0.16)"},{"x":4.0,"y":12.0,"width":60.0,"height":4.0,"fill":"rgba(10,10,10,0.16)"},{"x":8.0,"y":8.0,"width":52.0,"height":4.0,"fill":"rgba(10,10,10,0.16)"},{"x":24.0,"y":60.0,"width":20.0,"height":4.0,"fill":"rgba(10,10,10,0.16)"},{"x":8.0,"y":44.0,"width":52.0,"height":4.0,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":28.0,"width":68.0,"height":4.0,"fill":"rgba(10,10,10,0.16)"},{"x":28.0,"y":64.0,"width":12.0,"height":4.0,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":28.0,"width":68.0,"height":4.0,"fill":"#D9D9D1"},{"x":0.0,"y":12.0,"width":68.0,"height":4.0,"fill":"#D9D9D1"},{"x":16.0,"y":48.0,"width":36.0,"height":4.0,"fill":"#D9D9D1"},{"x":0.0,"y":16.0,"width":68.0,"height":4.0,"fill":"#D9D9D1"},{"x":12.0,"y":0.0,"width":20.0,"height":4.0,"fill":"#D9D9D1"},{"x":36.0,"y":0.0,"width":20.0,"height":4.0,"fill":"#D9D9D1"},{"x":20.0,"y":52.0,"width":28.0,"height":4.0,"fill":"#D9D9D1"},{"x":4.0,"y":36.0,"width":60.0,"height":4.0,"fill":"#D9D9D1"},{"x":12.0,"y":44.0,"width":44.0,"height":4.0,"fill":"#D9D9D1"},{"x":0.0,"y":32.0,"width":68.0,"height":4.0,"fill":"#D9D9D1"},{"x":0.0,"y":20.0,"width":68.0,"height":4.0,"fill":"#D9D9D1"},{"x":4.0,"y":8.0,"width":60.0,"height":4.0,"fill":"#D9D9D1"},{"x":8.0,"y":4.0,"width":52.0,"height":4.0,"fill":"#D9D9D1"},{"x":24.0,"y":56.0,"width":20.0,"height":4.0,"fill":"#D9D9D1"},{"x":8.0,"y":40.0,"width":52.0,"height":4.0,"fill":"#D9D9D1"},{"x":0.0,"y":24.0,"width":68.0,"height":4.0,"fill":"#D9D9D1"},{"x":28.0,"y":60.0,"width":12.0,"height":4.0,"fill":"#D9D9D1"},{"x":4.0,"y":28.0,"width":60.0,"height":4.0,"fill":"#FFFFFF"},{"x":4.0,"y":12.0,"width":60.0,"height":4.0,"fill":"#FFFFFF"},{"x":20.0,"y":48.0,"width":28.0,"height":4.0,"fill":"#FFFFFF"},{"x":4.0,"y":16.0,"width":60.0,"height":4.0,"fill":"#FFFFFF"},{"x":24.0,"y":52.0,"width":20.0,"height":4.0,"fill":"#FFFFFF"},{"x":8.0,"y":36.0,"width":52.0,"height":4.0,"fill":"#FFFFFF"},{"x":16.0,"y":44.0,"width":36.0,"height":4.0,"fill":"#FFFFFF"},{"x":4.0,"y":32.0,"width":60.0,"height":4.0,"fill":"#FFFFFF"},{"x":4.0,"y":20.0,"width":60.0,"height":4.0,"fill":"#FFFFFF"},{"x":8.0,"y":8.0,"width":52.0,"height":4.0,"fill":"#FFFFFF"},{"x":28.0,"y":56.0,"width":12.0,"height":4.0,"fill":"#FFFFFF"},{"x":4.0,"y":24.0,"width":60.0,"height":4.0,"fill":"#FFFFFF"},{"x":12.0,"y":4.0,"width":20.0,"height":4.0,"fill":"#FFFFFF"},{"x":36.0,"y":4.0,"width":20.0,"height":4.0,"fill":"#FFFFFF"},{"x":12.0,"y":40.0,"width":44.0,"height":4.0,"fill":"#FFFFFF"},{"x":16.0,"y":12.0,"width":12.0,"height":4.0,"fill":"#0A0A0A"},{"x":40.0,"y":12.0,"width":12.0,"height":4.0,"fill":"#0A0A0A"},{"x":12.0,"y":16.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":28.0,"y":16.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":36.0,"y":16.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":52.0,"y":16.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":12.0,"y":20.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":32.0,"y":20.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":52.0,"y":20.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":12.0,"y":24.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":52.0,"y":24.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":12.0,"y":28.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":52.0,"y":28.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":16.0,"y":32.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":48.0,"y":32.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":20.0,"y":36.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":44.0,"y":36.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":24.0,"y":40.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":40.0,"y":40.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":28.0,"y":44.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":36.0,"y":44.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":32.0,"y":48.0,"width":4.0,"height":4.0,"fill":"#0A0A0A"},{"x":16.0,"y":16.0,"width":12.0,"height":4.0,"fill":"#FF6B6B"},{"x":40.0,"y":16.0,"width":12.0,"height":4.0,"fill":"#FF6B6B"},{"x":16.0,"y":20.0,"width":4.0,"height":4.0,"fill":"#FF6B6B"},{"x":24.0,"y":20.0,"width":8.0,"height":4.0,"fill":"#FF6B6B"},{"x":36.0,"y":20.0,"width":16.0,"height":4.0,"fill":"#FF6B6B"},{"x":16.0,"y":24.0,"width":36.0,"height":4.0,"fill":"#FF6B6B"},{"x":16.0,"y":28.0,"width":36.0,"height":4.0,"fill":"#FF6B6B"},{"x":20.0,"y":32.0,"width":28.0,"height":4.0,"fill":"#FF6B6B"},{"x":24.0,"y":36.0,"width":20.0,"height":4.0,"fill":"#FF6B6B"},{"x":28.0,"y":40.0,"width":12.0,"height":4.0,"fill":"#FF6B6B"},{"x":32.0,"y":44.0,"width":4.0,"height":4.0,"fill":"#FF6B6B"},{"x":20.0,"y":20.0,"width":4.0,"height":4.0,"fill":"#FFFFFF"}]},{"left":20.0,"top":318.0,"popDelay":800,"floatDelay":600,"rotation":6.0,"width":68.4,"height":68.4,"viewBox":"0 0 68.4 68.4","rects":[{"x":0.0,"y":28.8,"width":68.4,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":7.2,"y":14.4,"width":54.0,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":7.2,"y":64.8,"width":18.0,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":43.2,"y":64.8,"width":18.0,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":46.800000000000004,"width":68.4,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":3.6,"y":18.0,"width":61.2,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":3.6,"y":61.2,"width":28.8,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":36.0,"y":61.2,"width":28.8,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":50.4,"width":68.4,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":3.6,"y":43.2,"width":61.2,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":32.4,"width":68.4,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":3.6,"y":36.0,"width":61.2,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":21.6,"width":68.4,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":54.0,"width":68.4,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":3.6,"y":39.6,"width":61.2,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":25.2,"width":68.4,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":57.6,"width":68.4,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":28.8,"y":3.6,"width":10.8,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":21.6,"y":10.8,"width":25.2,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":25.2,"y":7.2,"width":18.0,"height":3.6,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":25.2,"width":68.4,"height":3.6,"fill":"#D9D9D1"},{"x":7.2,"y":10.8,"width":54.0,"height":3.6,"fill":"#D9D9D1"},{"x":7.2,"y":61.2,"width":18.0,"height":3.6,"fill":"#D9D9D1"},{"x":43.2,"y":61.2,"width":18.0,"height":3.6,"fill":"#D9D9D1"},{"x":0.0,"y":43.2,"width":68.4,"height":3.6,"fill":"#D9D9D1"},{"x":3.6,"y":14.4,"width":61.2,"height":3.6,"fill":"#D9D9D1"},{"x":3.6,"y":57.6,"width":28.8,"height":3.6,"fill":"#D9D9D1"},{"x":36.0,"y":57.6,"width":28.8,"height":3.6,"fill":"#D9D9D1"},{"x":0.0,"y":46.800000000000004,"width":68.4,"height":3.6,"fill":"#D9D9D1"},{"x":3.6,"y":39.6,"width":61.2,"height":3.6,"fill":"#D9D9D1"},{"x":0.0,"y":28.8,"width":68.4,"height":3.6,"fill":"#D9D9D1"},{"x":3.6,"y":32.4,"width":61.2,"height":3.6,"fill":"#D9D9D1"},{"x":0.0,"y":18.0,"width":68.4,"height":3.6,"fill":"#D9D9D1"},{"x":0.0,"y":50.4,"width":68.4,"height":3.6,"fill":"#D9D9D1"},{"x":3.6,"y":36.0,"width":61.2,"height":3.6,"fill":"#D9D9D1"},{"x":0.0,"y":21.6,"width":68.4,"height":3.6,"fill":"#D9D9D1"},{"x":0.0,"y":54.0,"width":68.4,"height":3.6,"fill":"#D9D9D1"},{"x":28.8,"y":0.0,"width":10.8,"height":3.6,"fill":"#D9D9D1"},{"x":21.6,"y":7.2,"width":25.2,"height":3.6,"fill":"#D9D9D1"},{"x":25.2,"y":3.6,"width":18.0,"height":3.6,"fill":"#D9D9D1"},{"x":3.6,"y":25.2,"width":61.2,"height":3.6,"fill":"#FFFFFF"},{"x":21.6,"y":10.8,"width":25.2,"height":3.6,"fill":"#FFFFFF"},{"x":3.6,"y":43.2,"width":61.2,"height":3.6,"fill":"#FFFFFF"},{"x":7.2,"y":14.4,"width":54.0,"height":3.6,"fill":"#FFFFFF"},{"x":7.2,"y":57.6,"width":18.0,"height":3.6,"fill":"#FFFFFF"},{"x":43.2,"y":57.6,"width":18.0,"height":3.6,"fill":"#FFFFFF"},{"x":3.6,"y":46.800000000000004,"width":61.2,"height":3.6,"fill":"#FFFFFF"},{"x":7.2,"y":32.4,"width":54.0,"height":3.6,"fill":"#FFFFFF"},{"x":7.2,"y":39.6,"width":54.0,"height":3.6,"fill":"#FFFFFF"},{"x":3.6,"y":28.8,"width":61.2,"height":3.6,"fill":"#FFFFFF"},{"x":3.6,"y":18.0,"width":61.2,"height":3.6,"fill":"#FFFFFF"},{"x":3.6,"y":50.4,"width":61.2,"height":3.6,"fill":"#FFFFFF"},{"x":7.2,"y":36.0,"width":54.0,"height":3.6,"fill":"#FFFFFF"},{"x":3.6,"y":21.6,"width":61.2,"height":3.6,"fill":"#FFFFFF"},{"x":3.6,"y":54.0,"width":28.8,"height":3.6,"fill":"#FFFFFF"},{"x":36.0,"y":54.0,"width":28.8,"height":3.6,"fill":"#FFFFFF"},{"x":28.8,"y":3.6,"width":10.8,"height":3.6,"fill":"#FFFFFF"},{"x":25.2,"y":7.2,"width":18.0,"height":3.6,"fill":"#FFFFFF"},{"x":32.4,"y":10.8,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":28.8,"y":14.4,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":36.0,"y":14.4,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":28.8,"y":18.0,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":36.0,"y":18.0,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":10.8,"y":21.6,"width":18.0,"height":3.6,"fill":"#0A0A0A"},{"x":39.6,"y":21.6,"width":18.0,"height":3.6,"fill":"#0A0A0A"},{"x":10.8,"y":25.2,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":54.0,"y":25.2,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":14.4,"y":28.8,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":25.2,"y":28.8,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":39.6,"y":28.8,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":50.4,"y":28.8,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":18.0,"y":32.4,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":25.2,"y":32.4,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":39.6,"y":32.4,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":46.800000000000004,"y":32.4,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":18.0,"y":36.0,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":46.800000000000004,"y":36.0,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":14.4,"y":39.6,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":50.4,"y":39.6,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":14.4,"y":43.2,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":28.8,"y":43.2,"width":10.8,"height":3.6,"fill":"#0A0A0A"},{"x":50.4,"y":43.2,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":10.8,"y":46.800000000000004,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":21.6,"y":46.800000000000004,"width":7.2,"height":3.6,"fill":"#0A0A0A"},{"x":39.6,"y":46.800000000000004,"width":7.2,"height":3.6,"fill":"#0A0A0A"},{"x":54.0,"y":46.800000000000004,"width":3.6,"height":3.6,"fill":"#0A0A0A"},{"x":10.8,"y":50.4,"width":10.8,"height":3.6,"fill":"#0A0A0A"},{"x":46.800000000000004,"y":50.4,"width":10.8,"height":3.6,"fill":"#0A0A0A"},{"x":32.4,"y":14.4,"width":3.6,"height":3.6,"fill":"#FFC94A"},{"x":32.4,"y":18.0,"width":3.6,"height":3.6,"fill":"#FFC94A"},{"x":28.8,"y":21.6,"width":10.8,"height":3.6,"fill":"#FFC94A"},{"x":14.4,"y":25.2,"width":39.6,"height":3.6,"fill":"#FFC94A"},{"x":18.0,"y":28.8,"width":7.2,"height":3.6,"fill":"#FFC94A"},{"x":28.8,"y":28.8,"width":10.8,"height":3.6,"fill":"#FFC94A"},{"x":43.2,"y":28.8,"width":7.2,"height":3.6,"fill":"#FFC94A"},{"x":21.6,"y":32.4,"width":3.6,"height":3.6,"fill":"#FFC94A"},{"x":28.8,"y":32.4,"width":10.8,"height":3.6,"fill":"#FFC94A"},{"x":43.2,"y":32.4,"width":3.6,"height":3.6,"fill":"#FFC94A"},{"x":21.6,"y":36.0,"width":25.2,"height":3.6,"fill":"#FFC94A"},{"x":18.0,"y":39.6,"width":32.4,"height":3.6,"fill":"#FFC94A"},{"x":18.0,"y":43.2,"width":10.8,"height":3.6,"fill":"#FFC94A"},{"x":39.6,"y":43.2,"width":10.8,"height":3.6,"fill":"#FFC94A"},{"x":14.4,"y":46.800000000000004,"width":7.2,"height":3.6,"fill":"#FFC94A"},{"x":46.800000000000004,"y":46.800000000000004,"width":7.2,"height":3.6,"fill":"#FFC94A"}]},{"left":306.0,"top":300.0,"popDelay":950,"floatDelay":1800,"rotation":-6.0,"width":53.199999999999996,"height":72.2,"viewBox":"0 0 53.199999999999996 72.2","rects":[{"x":11.399999999999999,"y":15.2,"width":41.8,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":7.6,"y":68.39999999999999,"width":15.2,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":49.4,"width":41.8,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":7.6,"y":19.0,"width":45.599999999999994,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":3.8,"y":64.6,"width":22.799999999999997,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":53.199999999999996,"width":38.0,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":38.0,"width":53.199999999999996,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":34.199999999999996,"width":53.199999999999996,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":3.8,"y":22.799999999999997,"width":49.4,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":57.0,"width":34.199999999999996,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":3.8,"y":41.8,"width":45.599999999999994,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":26.599999999999998,"width":53.199999999999996,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":45.599999999999994,"width":45.599999999999994,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":30.4,"width":53.199999999999996,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":22.799999999999997,"y":3.8,"width":22.799999999999997,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":15.2,"y":11.399999999999999,"width":38.0,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":19.0,"y":7.6,"width":30.4,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":60.8,"width":30.4,"height":3.8,"fill":"rgba(10,10,10,0.16)"},{"x":11.399999999999999,"y":11.399999999999999,"width":41.8,"height":3.8,"fill":"#D9D9D1"},{"x":7.6,"y":64.6,"width":15.2,"height":3.8,"fill":"#D9D9D1"},{"x":0.0,"y":45.599999999999994,"width":41.8,"height":3.8,"fill":"#D9D9D1"},{"x":7.6,"y":15.2,"width":45.599999999999994,"height":3.8,"fill":"#D9D9D1"},{"x":3.8,"y":60.8,"width":22.799999999999997,"height":3.8,"fill":"#D9D9D1"},{"x":0.0,"y":49.4,"width":38.0,"height":3.8,"fill":"#D9D9D1"},{"x":0.0,"y":34.199999999999996,"width":53.199999999999996,"height":3.8,"fill":"#D9D9D1"},{"x":0.0,"y":30.4,"width":53.199999999999996,"height":3.8,"fill":"#D9D9D1"},{"x":3.8,"y":19.0,"width":49.4,"height":3.8,"fill":"#D9D9D1"},{"x":0.0,"y":53.199999999999996,"width":34.199999999999996,"height":3.8,"fill":"#D9D9D1"},{"x":3.8,"y":38.0,"width":45.599999999999994,"height":3.8,"fill":"#D9D9D1"},{"x":0.0,"y":22.799999999999997,"width":53.199999999999996,"height":3.8,"fill":"#D9D9D1"},{"x":0.0,"y":41.8,"width":45.599999999999994,"height":3.8,"fill":"#D9D9D1"},{"x":0.0,"y":26.599999999999998,"width":53.199999999999996,"height":3.8,"fill":"#D9D9D1"},{"x":22.799999999999997,"y":0.0,"width":22.799999999999997,"height":3.8,"fill":"#D9D9D1"},{"x":15.2,"y":7.6,"width":38.0,"height":3.8,"fill":"#D9D9D1"},{"x":19.0,"y":3.8,"width":30.4,"height":3.8,"fill":"#D9D9D1"},{"x":0.0,"y":57.0,"width":30.4,"height":3.8,"fill":"#D9D9D1"},{"x":15.2,"y":11.399999999999999,"width":34.199999999999996,"height":3.8,"fill":"#FFFFFF"},{"x":3.8,"y":45.599999999999994,"width":34.199999999999996,"height":3.8,"fill":"#FFFFFF"},{"x":11.399999999999999,"y":15.2,"width":38.0,"height":3.8,"fill":"#FFFFFF"},{"x":3.8,"y":49.4,"width":30.4,"height":3.8,"fill":"#FFFFFF"},{"x":3.8,"y":30.4,"width":45.599999999999994,"height":3.8,"fill":"#FFFFFF"},{"x":7.6,"y":19.0,"width":41.8,"height":3.8,"fill":"#FFFFFF"},{"x":3.8,"y":53.199999999999996,"width":26.599999999999998,"height":3.8,"fill":"#FFFFFF"},{"x":7.6,"y":38.0,"width":38.0,"height":3.8,"fill":"#FFFFFF"},{"x":3.8,"y":34.199999999999996,"width":45.599999999999994,"height":3.8,"fill":"#FFFFFF"},{"x":3.8,"y":22.799999999999997,"width":45.599999999999994,"height":3.8,"fill":"#FFFFFF"},{"x":3.8,"y":26.599999999999998,"width":45.599999999999994,"height":3.8,"fill":"#FFFFFF"},{"x":3.8,"y":41.8,"width":38.0,"height":3.8,"fill":"#FFFFFF"},{"x":22.799999999999997,"y":3.8,"width":22.799999999999997,"height":3.8,"fill":"#FFFFFF"},{"x":19.0,"y":7.6,"width":30.4,"height":3.8,"fill":"#FFFFFF"},{"x":3.8,"y":57.0,"width":22.799999999999997,"height":3.8,"fill":"#FFFFFF"},{"x":7.6,"y":60.8,"width":15.2,"height":3.8,"fill":"#FFFFFF"},{"x":26.599999999999998,"y":11.399999999999999,"width":15.2,"height":3.8,"fill":"#0A0A0A"},{"x":22.799999999999997,"y":15.2,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":38.0,"y":15.2,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":19.0,"y":19.0,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":34.199999999999996,"y":19.0,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":15.2,"y":22.799999999999997,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":30.4,"y":22.799999999999997,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":11.399999999999999,"y":26.599999999999998,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":30.4,"y":26.599999999999998,"width":11.399999999999999,"height":3.8,"fill":"#0A0A0A"},{"x":11.399999999999999,"y":30.4,"width":11.399999999999999,"height":3.8,"fill":"#0A0A0A"},{"x":38.0,"y":30.4,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":19.0,"y":34.199999999999996,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":34.199999999999996,"y":34.199999999999996,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":15.2,"y":38.0,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":30.4,"y":38.0,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":15.2,"y":41.8,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":26.599999999999998,"y":41.8,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":11.399999999999999,"y":45.599999999999994,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":22.799999999999997,"y":45.599999999999994,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":11.399999999999999,"y":49.4,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":19.0,"y":49.4,"width":3.8,"height":3.8,"fill":"#0A0A0A"},{"x":11.399999999999999,"y":53.199999999999996,"width":7.6,"height":3.8,"fill":"#0A0A0A"},{"x":26.599999999999998,"y":15.2,"width":11.399999999999999,"height":3.8,"fill":"#FFC94A"},{"x":22.799999999999997,"y":19.0,"width":11.399999999999999,"height":3.8,"fill":"#FFC94A"},{"x":19.0,"y":22.799999999999997,"width":11.399999999999999,"height":3.8,"fill":"#FFC94A"},{"x":15.2,"y":26.599999999999998,"width":15.2,"height":3.8,"fill":"#FFC94A"},{"x":22.799999999999997,"y":30.4,"width":15.2,"height":3.8,"fill":"#FFC94A"},{"x":22.799999999999997,"y":34.199999999999996,"width":11.399999999999999,"height":3.8,"fill":"#FFC94A"},{"x":19.0,"y":38.0,"width":11.399999999999999,"height":3.8,"fill":"#FFC94A"},{"x":19.0,"y":41.8,"width":7.6,"height":3.8,"fill":"#FFC94A"},{"x":15.2,"y":45.599999999999994,"width":7.6,"height":3.8,"fill":"#FFC94A"},{"x":15.2,"y":49.4,"width":3.8,"height":3.8,"fill":"#FFC94A"}]},{"left":150.0,"top":76.0,"popDelay":1100,"floatDelay":2400,"rotation":-4.0,"width":60.0,"height":51.0,"viewBox":"0 0 60.0 51.0","rects":[{"x":0.0,"y":24.0,"width":60.0,"height":3.0,"fill":"rgba(10,10,10,0.16)"},{"x":6.0,"y":12.0,"width":48.0,"height":3.0,"fill":"rgba(10,10,10,0.16)"},{"x":9.0,"y":39.0,"width":42.0,"height":3.0,"fill":"rgba(10,10,10,0.16)"},{"x":3.0,"y":15.0,"width":54.0,"height":3.0,"fill":"rgba(10,10,10,0.16)"},{"x":12.0,"y":42.0,"width":36.0,"height":3.0,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":30.0,"width":60.0,"height":3.0,"fill":"rgba(10,10,10,0.16)"},{"x":6.0,"y":36.0,"width":48.0,"height":3.0,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":27.0,"width":60.0,"height":3.0,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":18.0,"width":60.0,"height":3.0,"fill":"rgba(10,10,10,0.16)"},{"x":15.0,"y":45.0,"width":30.0,"height":3.0,"fill":"rgba(10,10,10,0.16)"},{"x":3.0,"y":33.0,"width":54.0,"height":3.0,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":21.0,"width":60.0,"height":3.0,"fill":"rgba(10,10,10,0.16)"},{"x":15.0,"y":6.0,"width":30.0,"height":3.0,"fill":"rgba(10,10,10,0.16)"},{"x":12.0,"y":9.0,"width":36.0,"height":3.0,"fill":"rgba(10,10,10,0.16)"},{"x":21.0,"y":48.0,"width":18.0,"height":3.0,"fill":"rgba(10,10,10,0.16)"},{"x":21.0,"y":3.0,"width":18.0,"height":3.0,"fill":"rgba(10,10,10,0.16)"},{"x":0.0,"y":21.0,"width":60.0,"height":3.0,"fill":"#D9D9D1"},{"x":6.0,"y":9.0,"width":48.0,"height":3.0,"fill":"#D9D9D1"},{"x":9.0,"y":36.0,"width":42.0,"height":3.0,"fill":"#D9D9D1"},{"x":3.0,"y":12.0,"width":54.0,"height":3.0,"fill":"#D9D9D1"},{"x":12.0,"y":39.0,"width":36.0,"height":3.0,"fill":"#D9D9D1"},{"x":0.0,"y":27.0,"width":60.0,"height":3.0,"fill":"#D9D9D1"},{"x":6.0,"y":33.0,"width":48.0,"height":3.0,"fill":"#D9D9D1"},{"x":0.0,"y":24.0,"width":60.0,"height":3.0,"fill":"#D9D9D1"},{"x":0.0,"y":15.0,"width":60.0,"height":3.0,"fill":"#D9D9D1"},{"x":15.0,"y":42.0,"width":30.0,"height":3.0,"fill":"#D9D9D1"},{"x":3.0,"y":30.0,"width":54.0,"height":3.0,"fill":"#D9D9D1"},{"x":0.0,"y":18.0,"width":60.0,"height":3.0,"fill":"#D9D9D1"},{"x":15.0,"y":3.0,"width":30.0,"height":3.0,"fill":"#D9D9D1"},{"x":12.0,"y":6.0,"width":36.0,"height":3.0,"fill":"#D9D9D1"},{"x":21.0,"y":45.0,"width":18.0,"height":3.0,"fill":"#D9D9D1"},{"x":21.0,"y":0.0,"width":18.0,"height":3.0,"fill":"#D9D9D1"},{"x":3.0,"y":21.0,"width":54.0,"height":3.0,"fill":"#FFFFFF"},{"x":12.0,"y":9.0,"width":36.0,"height":3.0,"fill":"#FFFFFF"},{"x":12.0,"y":36.0,"width":36.0,"height":3.0,"fill":"#FFFFFF"},{"x":6.0,"y":12.0,"width":48.0,"height":3.0,"fill":"#FFFFFF"},{"x":15.0,"y":39.0,"width":30.0,"height":3.0,"fill":"#FFFFFF"},{"x":3.0,"y":27.0,"width":54.0,"height":3.0,"fill":"#FFFFFF"},{"x":9.0,"y":33.0,"width":42.0,"height":3.0,"fill":"#FFFFFF"},{"x":3.0,"y":24.0,"width":54.0,"height":3.0,"fill":"#FFFFFF"},{"x":3.0,"y":15.0,"width":54.0,"height":3.0,"fill":"#FFFFFF"},{"x":21.0,"y":42.0,"width":18.0,"height":3.0,"fill":"#FFFFFF"},{"x":6.0,"y":30.0,"width":48.0,"height":3.0,"fill":"#FFFFFF"},{"x":3.0,"y":18.0,"width":54.0,"height":3.0,"fill":"#FFFFFF"},{"x":15.0,"y":6.0,"width":30.0,"height":3.0,"fill":"#FFFFFF"},{"x":21.0,"y":3.0,"width":18.0,"height":3.0,"fill":"#FFFFFF"},{"x":24.0,"y":9.0,"width":12.0,"height":3.0,"fill":"#0A0A0A"},{"x":18.0,"y":12.0,"width":6.0,"height":3.0,"fill":"#0A0A0A"},{"x":36.0,"y":12.0,"width":6.0,"height":3.0,"fill":"#0A0A0A"},{"x":15.0,"y":15.0,"width":3.0,"height":3.0,"fill":"#0A0A0A"},{"x":42.0,"y":15.0,"width":3.0,"height":3.0,"fill":"#0A0A0A"},{"x":9.0,"y":18.0,"width":42.0,"height":3.0,"fill":"#0A0A0A"},{"x":9.0,"y":21.0,"width":3.0,"height":3.0,"fill":"#0A0A0A"},{"x":48.0,"y":21.0,"width":3.0,"height":3.0,"fill":"#0A0A0A"},{"x":9.0,"y":24.0,"width":42.0,"height":3.0,"fill":"#0A0A0A"},{"x":12.0,"y":27.0,"width":3.0,"height":3.0,"fill":"#0A0A0A"},{"x":45.0,"y":27.0,"width":3.0,"height":3.0,"fill":"#0A0A0A"},{"x":15.0,"y":30.0,"width":3.0,"height":3.0,"fill":"#0A0A0A"},{"x":42.0,"y":30.0,"width":3.0,"height":3.0,"fill":"#0A0A0A"},{"x":18.0,"y":33.0,"width":6.0,"height":3.0,"fill":"#0A0A0A"},{"x":36.0,"y":33.0,"width":6.0,"height":3.0,"fill":"#0A0A0A"},{"x":24.0,"y":36.0,"width":12.0,"height":3.0,"fill":"#0A0A0A"},{"x":24.0,"y":12.0,"width":12.0,"height":3.0,"fill":"#8FC4FF"},{"x":18.0,"y":15.0,"width":6.0,"height":3.0,"fill":"#8FC4FF"},{"x":27.0,"y":15.0,"width":15.0,"height":3.0,"fill":"#8FC4FF"},{"x":15.0,"y":27.0,"width":30.0,"height":3.0,"fill":"#8FC4FF"},{"x":21.0,"y":30.0,"width":18.0,"height":3.0,"fill":"#8FC4FF"},{"x":24.0,"y":15.0,"width":3.0,"height":3.0,"fill":"#FFFFFF"},{"x":12.0,"y":21.0,"width":36.0,"height":3.0,"fill":"#E8E4FF"},{"x":18.0,"y":30.0,"width":3.0,"height":3.0,"fill":"#4A7FD0"},{"x":39.0,"y":30.0,"width":3.0,"height":3.0,"fill":"#4A7FD0"},{"x":24.0,"y":33.0,"width":12.0,"height":3.0,"fill":"#4A7FD0"}]}];

type PixelGraphicsProps = {
  style?: ViewStyle;
};

export default function PixelGraphics({style}: PixelGraphicsProps) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, style]}
    >
      {PIXELS.map((item, index) => (
        <PixelItem key={index} {...item} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: -20,
    top: -100,
    width: 390,
    height: 600,
  },
});
