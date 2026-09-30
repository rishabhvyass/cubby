import { StyleSheet } from "react-native";

import { ColorLight } from "../../constant/colors/ColorLight";

export const styles = StyleSheet.create({

    container: {
        flex: 1,
        justifyContent: "space-between",
        // borderWidth: 2,
        // borderColor: "green",

    },
    meshContainer: {
        paddingHorizontal: 25,
        backgroundColor: ColorLight.bg
    },
    logo: {
        // borderWidth: 2,
        // borderColor: "green",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    logotext: {
        fontSize: 22,
        fontWeight: "700"
    },
    textcontainer: {
        // borderWidth: 2,
        // borderColor: "green",
    },
    welcometext: {
        fontSize: 46,
        fontWeight: "700",
        letterSpacing: -1.9,


    },
    welcometext2: {
        fontSize: 46,
        fontWeight: "700",
        letterSpacing: -1.9,
        transform: [{ rotate: "-1.5deg" }],
        backgroundColor: ColorLight.primary,
        width: 200,
        textAlign: "center",
        borderRadius: 10

    },
    welcomequeot: {
        // borderWidth: 2,
        // borderColor: "green",


    },
    queot: {
        fontSize: 22,
        fontWeight: "medium",
        color: ColorLight.textSecondary,

    },
    welcomecontainer: {
        gap: 20
    },
    welcomeBtn: {
        backgroundColor: ColorLight.primary,
        borderWidth: 2,
        // borderColor: "green",
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 30,
        boxShadow: "0 4px 0 #0A0A0A",
        boxSizing: "border-box",


    },
    btnText: {
        flexDirection: "row",
        // borderWidth: 2,
        // borderColor: "green",
        justifyContent: "space-between",
        alignItems: "center",


    },
    arrowIcon: {
        fontSize: 17,
        fontWeight: "700"
    },
    button: {

        borderRadius: 12,

    },

    btnContainer: {
        // borderWidth: 2,
        // borderColor: "green",
        gap: 25,

    },
    bottomTextContainer: {
        // borderWidth: 2,
        // borderColor: "green",
        gap: 25,
        alignItems: "center"
    },
    bottomTextOne: {
        fontSize: 15,
        fontWeight: "600"
    },
    bottomTextTwo: {
        fontSize: 13,
        color: ColorLight.textSecondary,
        // borderWidth: 2,
        // borderColor: "green",
    },
    lockicon: {
        alignItems: "center",
        justifyContent: "center",

        flexDirection: "row",
    },
    pixels: {
        // borderWidth: 2,
        // borderColor: "green",
        height: 330,

    },







});