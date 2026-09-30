import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

type CubbyVaultGraphicProps = {
    style?: StyleProp<ViewStyle>;
    width?: number;
};

const ORIGINAL_WIDTH = 162.0;
const ORIGINAL_HEIGHT = 212.0;
const POP_DELAY = 200;
const FLOAT_DURATION = 6000;

export default function CubbyVaultGraphic({
    style,
    width = 148,
}: CubbyVaultGraphicProps) {
    const scaleRatio = width / ORIGINAL_WIDTH;
    const height = ORIGINAL_HEIGHT * scaleRatio;

    const opacity = useSharedValue(0);
    const popScale = useSharedValue(0.78);
    const riseY = useSharedValue(14);
    const floatY = useSharedValue(0);

    useEffect(() => {
        const popConfig = {
            duration: 700,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
        };

        opacity.value = withDelay(POP_DELAY, withTiming(1, popConfig));
        popScale.value = withDelay(POP_DELAY, withTiming(1, popConfig));
        riseY.value = withDelay(POP_DELAY, withTiming(0, popConfig));

        floatY.value = withDelay(
            POP_DELAY + 700,
            withRepeat(
                withSequence(
                    withTiming(-6, {
                        duration: FLOAT_DURATION / 2,
                        easing: Easing.inOut(Easing.ease),
                    }),
                    withTiming(6, {
                        duration: FLOAT_DURATION / 2,
                        easing: Easing.inOut(Easing.ease),
                    }),
                ),
                -1,
                true,
            ),
        );
    }, [floatY, opacity, popScale, riseY]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { translateY: riseY.value + floatY.value },
            { scale: popScale.value },
        ],
    }));

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.container,
                { width, height },
                animatedStyle,
                style,
            ]}
        >
            <Svg
                width={width}
                height={height}
                viewBox="0 0 161.9 212.5"
            >
                <Polygon key="el-0" points="88.3,127.5 73.6,136.0 73.6,119.0 88.3,110.5" fill="#313131" stroke="#313131" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-1" points="58.9,127.5 73.6,136.0 73.6,119.0 58.9,110.5" fill="#272727" stroke="#272727" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-2" points="29.4,161.5 14.7,170.0 14.7,153.0 29.4,144.5" fill="#313131" stroke="#313131" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-3" points="0.0,161.5 14.7,170.0 14.7,153.0 0.0,144.5" fill="#272727" stroke="#272727" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-4" points="161.9,170.0 147.2,178.5 147.2,161.5 161.9,153.0" fill="#313131" stroke="#313131" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-5" points="132.5,170.0 147.2,178.5 147.2,161.5 132.5,153.0" fill="#272727" stroke="#272727" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-6" points="0.0,144.5 14.7,153.0 14.7,136.0 0.0,127.5" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-7" points="14.7,153.0 29.4,161.5 29.4,144.5 14.7,136.0" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-8" points="161.9,153.0 147.2,161.5 147.2,144.5 161.9,136.0" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-9" points="0.0,127.5 14.7,136.0 14.7,119.0 0.0,110.5" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-10" points="73.6,0.0 88.3,8.5 73.6,17.0 58.9,8.5" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-11" points="29.4,161.5 44.2,170.0 44.2,153.0 29.4,144.5" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-12" points="147.2,161.5 132.5,170.0 132.5,153.0 147.2,144.5" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-13" points="14.7,136.0 29.4,144.5 29.4,127.5 14.7,119.0" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-14" points="161.9,136.0 147.2,144.5 147.2,127.5 161.9,119.0" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-15" points="0.0,110.5 14.7,119.0 14.7,102.0 0.0,93.5" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-16" points="58.9,8.5 73.6,17.0 58.9,25.5 44.2,17.0" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-17" points="88.3,8.5 103.1,17.0 88.3,25.5 73.6,17.0" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-18" points="44.2,170.0 58.9,178.5 58.9,161.5 44.2,153.0" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-19" points="132.5,170.0 117.8,178.5 117.8,161.5 132.5,153.0" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-20" points="29.4,144.5 44.2,153.0 44.2,136.0 29.4,127.5" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-21" points="147.2,144.5 132.5,153.0 132.5,136.0 147.2,127.5" fill="#9BD63E" stroke="#9BD63E" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-22" points="14.7,119.0 29.4,127.5 29.4,110.5 14.7,102.0" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-23" points="161.9,119.0 147.2,127.5 147.2,110.5 161.9,102.0" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-24" points="0.0,93.5 14.7,102.0 14.7,85.0 0.0,76.5" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-25" points="44.2,17.0 58.9,25.5 44.2,34.0 29.4,25.5" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-26" points="73.6,17.0 88.3,25.5 73.6,34.0 58.9,25.5" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-27" points="103.1,17.0 117.8,25.5 103.1,34.0 88.3,25.5" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-28" points="103.1,204.0 88.3,212.5 88.3,195.5 103.1,187.0" fill="#313131" stroke="#313131" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-29" points="73.6,204.0 88.3,212.5 88.3,195.5 73.6,187.0" fill="#272727" stroke="#272727" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-30" points="58.9,178.5 73.6,187.0 73.6,170.0 58.9,161.5" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-31" points="117.8,178.5 103.1,187.0 103.1,170.0 117.8,161.5" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-32" points="44.2,153.0 58.9,161.5 58.9,144.5 44.2,136.0" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-33" points="132.5,153.0 117.8,161.5 117.8,144.5 132.5,136.0" fill="#9BD63E" stroke="#9BD63E" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-34" points="29.4,127.5 44.2,136.0 44.2,119.0 29.4,110.5" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-35" points="147.2,127.5 132.5,136.0 132.5,119.0 147.2,110.5" fill="#9BD63E" stroke="#9BD63E" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-36" points="14.7,102.0 29.4,110.5 29.4,93.5 14.7,85.0" fill="#131313" stroke="#131313" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-37" points="161.9,102.0 147.2,110.5 147.2,93.5 161.9,85.0" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-38" points="0.0,76.5 14.7,85.0 14.7,68.0 0.0,59.5" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-39" points="29.4,25.5 44.2,34.0 29.4,42.5 14.7,34.0" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-40" points="58.9,25.5 73.6,34.0 58.9,42.5 44.2,34.0" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-41" points="88.3,25.5 103.1,34.0 88.3,42.5 73.6,34.0" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-42" points="117.8,25.5 132.5,34.0 117.8,42.5 103.1,34.0" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-43" points="103.1,187.0 88.3,195.5 88.3,178.5 103.1,170.0" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-44" points="73.6,187.0 88.3,195.5 88.3,178.5 73.6,170.0" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-45" points="58.9,161.5 73.6,170.0 73.6,153.0 58.9,144.5" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-46" points="117.8,161.5 103.1,170.0 103.1,153.0 117.8,144.5" fill="#9BD63E" stroke="#9BD63E" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-47" points="44.2,136.0 58.9,144.5 58.9,127.5 44.2,119.0" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-48" points="132.5,136.0 117.8,144.5 117.8,127.5 132.5,119.0" fill="#181818" stroke="#181818" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-49" points="29.4,110.5 44.2,119.0 44.2,102.0 29.4,93.5" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-50" points="147.2,110.5 132.5,119.0 132.5,102.0 147.2,93.5" fill="#9BD63E" stroke="#9BD63E" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-51" points="14.7,85.0 29.4,93.5 29.4,76.5 14.7,68.0" fill="#131313" stroke="#131313" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-52" points="161.9,85.0 147.2,93.5 147.2,76.5 161.9,68.0" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-53" points="14.7,34.0 29.4,42.5 14.7,51.0 0.0,42.5" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-54" points="0.0,59.5 14.7,68.0 14.7,51.0 0.0,42.5" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-55" points="44.2,34.0 58.9,42.5 44.2,51.0 29.4,42.5" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-56" points="73.6,34.0 88.3,42.5 73.6,51.0 58.9,42.5" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-57" points="103.1,34.0 117.8,42.5 103.1,51.0 88.3,42.5" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-58" points="132.5,34.0 147.2,42.5 132.5,51.0 117.8,42.5" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-59" points="103.1,170.0 88.3,178.5 88.3,161.5 103.1,153.0" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-60" points="73.6,170.0 88.3,178.5 88.3,161.5 73.6,153.0" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-61" points="58.9,144.5 73.6,153.0 73.6,136.0 58.9,127.5" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-62" points="117.8,144.5 103.1,153.0 103.1,136.0 117.8,127.5" fill="#9BD63E" stroke="#9BD63E" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-63" points="44.2,119.0 58.9,127.5 58.9,110.5 44.2,102.0" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-64" points="29.4,93.5 44.2,102.0 44.2,85.0 29.4,76.5" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-65" points="147.2,93.5 132.5,102.0 132.5,85.0 147.2,76.5" fill="#9BD63E" stroke="#9BD63E" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-66" points="29.4,42.5 44.2,51.0 29.4,59.5 14.7,51.0" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-67" points="14.7,68.0 29.4,76.5 29.4,59.5 14.7,51.0" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-68" points="58.9,42.5 73.6,51.0 58.9,59.5 44.2,51.0" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-69" points="88.3,42.5 103.1,51.0 88.3,59.5 73.6,51.0" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-70" points="117.8,42.5 132.5,51.0 117.8,59.5 103.1,51.0" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-71" points="147.2,42.5 161.9,51.0 147.2,59.5 132.5,51.0" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-72" points="161.9,68.0 147.2,76.5 147.2,59.5 161.9,51.0" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-73" points="103.1,153.0 88.3,161.5 88.3,144.5 103.1,136.0" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-74" points="73.6,153.0 88.3,161.5 88.3,144.5 73.6,136.0" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-75" points="58.9,127.5 73.6,136.0 73.6,119.0 58.9,110.5" fill="#131313" stroke="#131313" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-76" points="117.8,127.5 103.1,136.0 103.1,119.0 117.8,110.5" fill="#9BD63E" stroke="#9BD63E" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-77" points="132.5,102.0 147.2,110.5 132.5,119.0 117.8,110.5" fill="#1C1C1C" stroke="#1C1C1C" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-78" points="147.2,127.5 132.5,136.0 132.5,119.0 147.2,110.5" fill="#181818" stroke="#181818" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-79" points="117.8,127.5 132.5,136.0 132.5,119.0 117.8,110.5" fill="#131313" stroke="#131313" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-80" points="44.2,102.0 58.9,110.5 58.9,93.5 44.2,85.0" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-81" points="132.5,102.0 117.8,110.5 117.8,93.5 132.5,85.0" fill="#9BD63E" stroke="#9BD63E" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-82" points="44.2,51.0 58.9,59.5 44.2,68.0 29.4,59.5" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-83" points="29.4,76.5 44.2,85.0 44.2,68.0 29.4,59.5" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-84" points="73.6,51.0 88.3,59.5 73.6,68.0 58.9,59.5" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-85" points="103.1,51.0 117.8,59.5 103.1,68.0 88.3,59.5" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-86" points="132.5,51.0 147.2,59.5 132.5,68.0 117.8,59.5" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-87" points="147.2,76.5 132.5,85.0 132.5,68.0 147.2,59.5" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-88" points="103.1,136.0 88.3,144.5 88.3,127.5 103.1,119.0" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-89" points="73.6,136.0 88.3,144.5 88.3,127.5 73.6,119.0" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-90" points="58.9,110.5 73.6,119.0 73.6,102.0 58.9,93.5" fill="#131313" stroke="#131313" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-91" points="117.8,110.5 103.1,119.0 103.1,102.0 117.8,93.5" fill="#9BD63E" stroke="#9BD63E" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-92" points="58.9,59.5 73.6,68.0 58.9,76.5 44.2,68.0" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-93" points="44.2,85.0 58.9,93.5 58.9,76.5 44.2,68.0" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-94" points="88.3,59.5 103.1,68.0 88.3,76.5 73.6,68.0" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-95" points="117.8,59.5 132.5,68.0 117.8,76.5 103.1,68.0" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-96" points="132.5,85.0 117.8,93.5 117.8,76.5 132.5,68.0" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-97" points="103.1,119.0 88.3,127.5 88.3,110.5 103.1,102.0" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-98" points="73.6,119.0 88.3,127.5 88.3,110.5 73.6,102.0" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-99" points="73.6,68.0 88.3,76.5 73.6,85.0 58.9,76.5" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-100" points="58.9,93.5 73.6,102.0 73.6,85.0 58.9,76.5" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-101" points="103.1,68.0 117.8,76.5 103.1,85.0 88.3,76.5" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-102" points="117.8,93.5 103.1,102.0 103.1,85.0 117.8,76.5" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-103" points="88.3,76.5 103.1,85.0 88.3,93.5 73.6,85.0" fill="#EDE9DC" stroke="#EDE9DC" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-104" points="103.1,102.0 88.3,110.5 88.3,93.5 103.1,85.0" fill="#C7C4B9" stroke="#C7C4B9" strokeWidth={0.6} strokeLinejoin="round" />
                <Polygon key="el-105" points="73.6,102.0 88.3,110.5 88.3,93.5 73.6,85.0" fill="#A19E96" stroke="#A19E96" strokeWidth={0.6} strokeLinejoin="round" />
            </Svg>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        top: 110,
        left: 95,
      
    },
});
