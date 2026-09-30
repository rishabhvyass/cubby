import React, { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Clipboard from "@react-native-clipboard/clipboard";
import { styles } from "./style";
import { isAddress, resolveInput } from "../../services/ens";

const WALLETS = [
    { id: "metamask", name: "MetaMask", desc: "Browser & mobile", letter: "M", color: "#F6C85F" },
    { id: "walletconnect", name: "WalletConnect", desc: "600+ wallets", letter: "W", color: "#9EC5FF" },
    { id: "coinbase", name: "Coinbase Wallet", desc: "Smart wallet ready", letter: "C", color: "#E6E1FF" },
    { id: "phantom", name: "Phantom", desc: "Solana & EVM", letter: "P", color: "#B8FF4A" },
];

export const ConnectWallet = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canContinue = address.trim().length > 0 && !loading;

    // View-only: wallet rows just jump to the address field; we never hold keys.
    const onContinue = async () => {
        if (!canContinue) return;
        setLoading(true);
        setError(null);
        try {
            const input = address.trim();
            const resolved = await resolveInput(input);
            navigation.reset({
                index: 0,
                routes: [{ name: "Home", params: { address: resolved, label: isAddress(input) ? undefined : input } }],
            });
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
        }
    };

    return (
        <View style={styles.overlay}>
            {/* tap outside the sheet to dismiss */}
            <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} />

            <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
                <View style={styles.handle} />

                <View style={styles.header}>
                    <Text style={styles.title}>Connect a wallet</Text>
                    <Pressable
                        style={styles.closeBtn}
                        onPress={() => navigation.goBack()}
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                    >
                        <Text style={styles.closeText}>✕</Text>
                    </Pressable>
                </View>
                <Text style={styles.subtitle}>View-only. Disconnect whenever you like.</Text>

                <View style={styles.list}>
                    {WALLETS.map(w => {
                        const active = false;
                        return (
                            <Pressable
                                key={w.id}
                                style={[styles.row, active && styles.rowSelected]}
                                onPress={() => inputRef.current?.focus()}
                            >
                                <View style={[styles.logo, { backgroundColor: w.color }]}>
                                    <Text style={styles.logoText}>{w.letter}</Text>
                                </View>
                                <View style={styles.rowInfo}>
                                    <Text style={styles.walletName}>{w.name}</Text>
                                    <Text style={styles.walletDesc}>{w.desc}</Text>
                                </View>
                                <View style={[styles.radio, active && styles.radioSelected]}>
                                    {active && <Text style={styles.check}>✓</Text>}
                                </View>
                            </Pressable>
                        );
                    })}
                </View>

                <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or just watch an address</Text>
                    <View style={styles.dividerLine} />
                </View>

                <View style={styles.inputRow}>
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        value={address}
                        onChangeText={setAddress}
                        placeholder="vitalik.eth, name.sol or 0x…"
                        placeholderTextColor="#8A8A82"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <Pressable
                        style={styles.pasteBtn}
                        onPress={async () => {
                            const text = await Clipboard.getString();
                            if (text) { setAddress(text.trim()); setError(null); }
                        }}
                    >
                        <Text style={styles.pasteText}>Paste</Text>
                    </Pressable>
                </View>

                {error && <Text style={{ color: "#C22A2A", marginTop: 10 }}>{error}</Text>}

                <Pressable
                    style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
                    disabled={!canContinue}
                    onPress={onContinue}
                >
                    <Text style={styles.continueText}>{loading ? "Looking up…" : "Watch this address"}</Text>
                </Pressable>
            </View>
        </View>
    );
};

export default ConnectWallet;
