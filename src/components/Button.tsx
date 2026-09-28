import { Animated, Pressable, Text, View } from "react-native"
import { buttonPressIn, buttonPressOut } from "../animations/  pressAnimation";
import { styles } from "../screens/Welcome/style";
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import Arrow from "../../assets/icons/Arrow.svg";
export const Button = () => {

    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);


    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    scale: scale.value,
                },
            ],
        };
    });
    return (
        <View>
            <Pressable
                onPressIn={() => {
                    buttonPressIn(scale, translateY);
                }}
                onPressOut={() => {
                    buttonPressOut(scale, translateY);
                }}
                onPress={() => {
                    console.log('Pressed');
                }}
                // style={styles.wrapper}
            >

                <Animated.View style={[styles.welcomeBtn, animatedStyle]}>

                    <View style={styles.btnText}>

                        <Text style={styles.arrowIcon}>
                            Connect wallet
                        </Text>
                        <Text style={styles.arrowIcon}>
                            <Arrow
                                width={25}
                                height={25} />
                        </Text>

                    </View>
                </Animated.View>

            </Pressable>
        </View>
    )
}