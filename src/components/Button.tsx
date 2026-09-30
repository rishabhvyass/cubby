import { Pressable, Text, View } from "react-native"
import { styles } from "../screens/Welcome/style";
import Arrow from "../../assets/icons/Arrow.svg";

type ButtonProps = {
    title: string;
    onPress: () => void;
};

export const Button = ({ title, onPress }: ButtonProps) => {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={title}
            style={({ pressed }) => [
                styles.welcomeBtn,
                pressed && { transform: [{ translateY: 4 }], boxShadow: "0 0 0 #0A0A0A" },
            ]}
        >
            <View style={styles.btnText}>
                <Text style={styles.arrowIcon}>{title}</Text>
                <Arrow width={25} height={25} />
            </View>
        </Pressable>
    )
}
