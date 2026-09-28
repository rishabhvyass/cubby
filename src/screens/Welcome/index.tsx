import { Text, View, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from './style'
import Cubby from "../../../assets/icons/cubby.svg";
import Lock from "../../../assets/icons/lock.svg";
import { Button } from "../../components/Button";
import PixelGraphics from "../../components/PixelGraphics";
import CubbyVaultGraphic from "../../components/CubbyVaultGraphic";





const Welcome = () => {

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.logo}>
                <Cubby
                    width={30}
                    height={30}
                />
                <Text style={styles.logotext}>

                    cubby
                </Text>
            </View>
            <View>
                <PixelGraphics />
                <CubbyVaultGraphic width={162} />
                {/* <View style={styles.cubbyBottom}>
                  
                </View> */}
            </View>


            <View style={styles.welcomecontainer}>

                <View style={styles.textcontainer}>
                    <Text style={styles.welcometext}>
                        Your wealth,
                    </Text>
                    <Text style={styles.welcometext2}>
                        on-chain.
                    </Text>

                </View>
                <View style={styles.welcomequeot}>
                    <Text style={styles.queot}>
                        Every asset, every chain. One calm place to see it all.
                    </Text>
                </View>
                <View style={styles.btnContainer}>
                    <Button />
                    <View style={styles.bottomTextContainer}>

                        <Text style={styles.bottomTextOne}>
                            Look around with a demo wallet
                        </Text>
                        <View style={styles.lockicon}>
                            <Lock />
                            <Text style={styles.bottomTextTwo}>

                                View-only. We never ask for your seed phrase.
                            </Text>
                        </View>
                    </View>
                </View>

            </View>

        </SafeAreaView>


    );
}
export default Welcome;