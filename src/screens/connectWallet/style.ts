import { StyleSheet } from "react-native";
import { ColorLight } from "../../constant/colors/ColorLight";

const INK = "#0A0A0A";

export const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.35)",
    },
    sheet: {
        backgroundColor: ColorLight.bg,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    handle: {
        alignSelf: "center",
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#CFCFC6",
        marginBottom: 16,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        letterSpacing: -0.8,
        color: INK,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: ColorLight.surface2,
        alignItems: "center",
        justifyContent: "center",
    },
    closeText: {
        fontSize: 16,
        fontWeight: "600",
        color: INK,
    },
    subtitle: {
        fontSize: 15,
        color: ColorLight.textSecondary,
        marginTop: 6,
        marginBottom: 18,
    },
    list: {
        gap: 10,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: "#E4E4DC",
        backgroundColor: ColorLight.surface,
    },
    rowSelected: {
        borderColor: INK,
        borderWidth: 2,
        backgroundColor: ColorLight.surface2,
    },
    logo: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    logoText: {
        fontSize: 16,
        fontWeight: "700",
        color: INK,
    },
    rowInfo: {
        flex: 1,
    },
    walletName: {
        fontSize: 16,
        fontWeight: "700",
        color: INK,
    },
    walletDesc: {
        fontSize: 13,
        color: ColorLight.textSecondary,
        marginTop: 2,
    },
    radio: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 1.5,
        borderColor: "#CFCFC6",
        alignItems: "center",
        justifyContent: "center",
    },
    radioSelected: {
        borderColor: INK,
        backgroundColor: ColorLight.primary,
    },
    check: {
        fontSize: 14,
        fontWeight: "700",
        color: INK,
    },
    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginVertical: 18,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E4E4DC",
    },
    dividerText: {
        fontSize: 13,
        color: ColorLight.textSecondary,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: ColorLight.surface2,
        borderRadius: 16,
        paddingLeft: 16,
        paddingRight: 8,
        height: 56,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: INK,
    },
    pasteBtn: {
        backgroundColor: ColorLight.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    pasteText: {
        fontSize: 14,
        fontWeight: "700",
        color: INK,
    },
    continueBtn: {
        marginTop: 20,
        backgroundColor: ColorLight.primary,
        borderWidth: 2,
        borderColor: INK,
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: "center",
        boxShadow: "0 4px 0 #0A0A0A",
    },
    continueBtnDisabled: {
        opacity: 0.5,
    },
    continueText: {
        fontSize: 17,
        fontWeight: "700",
        color: INK,
    },
});
