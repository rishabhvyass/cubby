import { Pressable, PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from "react-native-reanimated";
import { springs } from "../motion/springs";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable that responds on touch-down (scales in instantly) and springs back on release. */
export const PressableScale = ({ scale = 0.97, onPressIn, onPressOut, style, ...rest }: PressableProps & { scale?: number }) => {
    const reduced = useReducedMotion();
    const s = useSharedValue(1);
    const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
    return (
        <AnimatedPressable
            {...rest}
            onPressIn={e => { if (!reduced) s.value = withSpring(scale, springs.press); onPressIn?.(e); }}
            onPressOut={e => { if (!reduced) s.value = withSpring(1, springs.press); onPressOut?.(e); }}
            style={[style as any, anim]}
        />
    );
};
