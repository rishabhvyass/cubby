import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../../art/Art";
import { TokenIcon } from "../../art/CryptoIcon";
import { PressableScale } from "../../components/PressableScale";
import { SlidingChips } from "../../components/SlidingSelector";
import { TactileButton } from "../../components/TactileButton";
import { TokenSheet } from "../../components/TokenSheet";
import { CHAINS } from "../../config/chains";
import { useRise } from "../../motion/motion";
import { springs } from "../../motion/springs";
import { fmtAmount, usd } from "../../services/format";
import {
    approveData, getQuote, hex, maxSpendable, NoRouteError, readAllowance, SwapQuote, SwapToken, toRaw, tokensFor, waitForReceipt,
} from "../../services/swap";
import { useAccounts } from "../../state/accounts";
import { useActivity } from "../../state/activity";
import type { ActivityRecord } from "../../services/activity";
import { usePortfolio } from "../../state/portfolio";
import { useWallet } from "../../state/wallet";
import { SwapSuccess } from "./SwapSuccess";
import { Palette } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

type Phase = "idle" | "quoting" | "ready" | "approving" | "swapping" | "confirming" | "done" | "failed";

const TokenChip = ({ token, onPress, p, dark }: { token: SwapToken; onPress: () => void; p: Palette; dark: boolean }) => (
    <PressableScale onPress={onPress} scale={0.95} style={[styles.chip, { backgroundColor: p.surface2 }]} accessibilityRole="button" accessibilityLabel={`${token.symbol}. Change token`}>
        <TokenIcon symbol={token.symbol} size={30} dark={dark} />
        <Text style={[styles.chipText, { color: p.text }]}>{token.symbol}</Text>
        <Icon name="chevron_down" size={14} color={p.textSecondary} />
    </PressableScale>
);

const Swap = ({ onBack, onViewActivity, initial }: { onBack: () => void; onViewActivity?: () => void; initial?: { chainId: string; symbol: string; address: string | null } }) => {
    const insets = useSafeAreaInsets();
    const { scheme, palette: p } = useTheme();
    const { portfolio, refresh } = usePortfolio();
    const { active, addAccount } = useAccounts();
    const wallet = useWallet();
    const activity = useActivity();
    const dark = scheme === "dark";

    // start on the chain where you hold the most
    const startChain = useMemo(() => {
        const best = [...(portfolio?.byChain ?? [])].sort((a, b) => b.value - a.value)[0];
        return best?.chain ?? CHAINS[0];
    }, [portfolio]);
    const [chain, setChain] = useState(() => (initial ? CHAINS.find(c => c.id === initial.chainId) ?? startChain : startChain));
    const initialRef = useRef(initial);
    const tokens = useMemo(() => tokensFor(chain, portfolio?.holdings ?? []), [chain, portfolio]);

    const [pay, setPay] = useState<SwapToken>(tokens[0]);
    const [receive, setReceive] = useState<SwapToken>(tokens.find(t => t.symbol === "USDC") ?? tokens[1]);
    const [amount, setAmount] = useState("");
    const [picker, setPicker] = useState<"pay" | "receive" | null>(null);
    const [quote, setQuote] = useState<SwapQuote | null>(null);
    const [phase, setPhase] = useState<Phase>("idle");
    const [error, setError] = useState<string | null>(null);
    const [hash, setHash] = useState<string | null>(null);

    // switching chain resets the pair to ETH → USDC (or your chosen token → USDC/ETH the first time)
    useEffect(() => {
        const t = tokensFor(chain, portfolio?.holdings ?? []);
        const init = initialRef.current;
        initialRef.current = undefined;
        const norm = (x: string | null | undefined) => (x ? x.toLowerCase() : null);
        const chosen = init ? t.find(x => x.symbol === init.symbol && norm(x.address) === norm(init.address)) : undefined;
        setPay(chosen ?? t[0]);
        setReceive((chosen?.symbol === "USDC" ? t.find(x => x.symbol === "ETH") : t.find(x => x.symbol === "USDC")) ?? t[1]);
        setAmount(""); setQuote(null); setPhase("idle"); setError(null);
    }, [chain]); // eslint-disable-line react-hooks/exhaustive-deps

    // refresh balances if holdings change underneath us
    const livePay = tokens.find(t => t.symbol === pay.symbol && t.address === pay.address) ?? pay;
    const liveReceive = tokens.find(t => t.symbol === receive.symbol && t.address === receive.address) ?? receive;

    const ready = wallet.connected && wallet.address?.toLowerCase() === active?.address.toLowerCase();
    const short = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");
    // A connected wallet that isn't the account being viewed: offer to switch to it (adds it as an account).
    const mismatch = wallet.connected && !ready;
    const raw = toRaw(amount, livePay.decimals);
    const insufficient = Number(amount) > livePay.balance + 1e-12;

    // debounced, abortable quote
    useEffect(() => {
        setQuote(null); setError(null);
        if (!ready || raw <= 0n || insufficient || phase === "approving" || phase === "swapping" || phase === "confirming" || phase === "done") {
            if (phase === "quoting" || phase === "ready" || phase === "failed") setPhase("idle");
            return;
        }
        setPhase("quoting");
        const ctrl = new AbortController();
        const id = setTimeout(async () => {
            try {
                const q = await getQuote(livePay, liveReceive, raw, active!.address, 0.005, ctrl.signal);
                setQuote(q); setPhase("ready");
            } catch (e: any) {
                if (e?.name === "AbortError") return;
                setError(e instanceof NoRouteError ? e.message : "Couldn't get a price right now. Try again.");
                setPhase("idle");
            }
        }, 600);
        return () => { clearTimeout(id); ctrl.abort(); };
    }, [amount, livePay.symbol, livePay.address, liveReceive.symbol, liveReceive.address, ready]); // eslint-disable-line react-hooks/exhaustive-deps

    // ---- flip animation ----
    const rot = useSharedValue(0);
    const flipStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value * 180}deg` }] }));
    const flip = () => {
        rot.value = withSpring(rot.value + 1, springs.snappy);
        const out = quote ? String(Number(quote.toAmount.toFixed(6))) : "";
        setPay(liveReceive); setReceive(livePay); setAmount(out);
    };

    // ---- execute: approve (if needed) → swap, all signed in the user's wallet ----
    const base = (hash: string, over: Partial<ActivityRecord>): ActivityRecord => ({
        hash, chain: chain.id, ts: Date.now(), day: "Today", time: "now", category: "Swaps", kind: "swap", title: "Swapping", meta: "",
        amount: "—", amountTone: "ink", tile: "#8FC4FF", protocol: quote?.tool ?? null, feeUsd: quote?.gasUsd ?? null, usd: quote?.toUsd ?? null, ...over,
    });
    const run = async () => {
        if (!quote || !active) return;
        Keyboard.dismiss(); setError(null);
        try {
            await wallet.request("wallet_switchEthereumChain", [{ chainId: hex(chain.chainId) }]);
            if (livePay.address && quote.approvalAddress) {
                const allowance = await readAllowance(chain, livePay.address, active.address, quote.approvalAddress);
                if (allowance < raw) {
                    setPhase("approving");
                    const ah = await wallet.request("eth_sendTransaction", [{ from: active.address, to: livePay.address, data: approveData(quote.approvalAddress, raw) }]);
                    activity.addLocal(base(ah, { category: "Transfers", kind: "approve", title: "Approving", tile: "#EDEDE6", status: "pending", amount: quote.gasUsd != null ? `${usd(quote.gasUsd, 2)} fee` : "—", amountTone: "secondary", meta: `Spending access for ${quote.tool} · ${chain.name}` }));
                    const approved = await waitForReceipt(chain, ah);
                    activity.updateLocal(ah, { title: approved ? "Approved" : "Approval", status: approved ? undefined : "failed" });
                    if (!approved) throw new Error("The approval didn't go through.");
                }
            }
            setPhase("swapping");
            const tx = quote.tx;
            const h: string = await wallet.request("eth_sendTransaction", [{
                from: active.address, to: tx.to, data: tx.data, value: tx.value, ...(tx.gasLimit ? { gas: tx.gasLimit } : {}),
            }]);
            setHash(h); setPhase("confirming");
            // show it in Activity right away; the indexer may take a while (or not cover this chain yet)
            activity.addLocal(base(h, {
                meta: `${fmtAmount(Number(amount))} ${livePay.symbol} → ${fmtAmount(quote.toAmount)} ${liveReceive.symbol} · ${quote.tool}`,
                amount: quote.toUsd != null ? usd(quote.toUsd) : "—", status: "pending",
            }));
            const ok = await waitForReceipt(chain, h);
            activity.updateLocal(h, ok
                ? { title: "Swapped", status: undefined }
                : { title: "Swap", status: "failed", meta: "Didn't go through. Your tokens are safe.", amount: quote.gasUsd != null ? `${usd(quote.gasUsd, 2)} fee` : "—", amountTone: "secondary", tile: "#EDEDE6" });
            setPhase(ok ? "done" : "failed");
            if (ok) { refresh(); setTimeout(() => activity.refresh(), 20000); }
            else setError("The swap reverted. Your tokens are safe.");
        } catch (e: any) {
            const msg = String(e?.message ?? e);
            setPhase(quote ? "ready" : "idle");
            setError(/reject|denied|cancel/i.test(msg) ? "You cancelled it in your wallet." : msg.slice(0, 140));
        }
    };

    const busy = phase === "approving" || phase === "swapping" || phase === "confirming";
    const label =
        mismatch ? `Use ${wallet.walletName ?? "connected wallet"} (${short(wallet.address)})`
        : !ready ? "Connect wallet"
        : phase === "approving" ? `Approve ${livePay.symbol} in your wallet…`
        : phase === "swapping" ? "Confirm in your wallet…"
        : phase === "confirming" ? "Confirming…"
        : raw <= 0n ? "Enter an amount"
        : insufficient ? `Not enough ${livePay.symbol}`
        : phase === "quoting" ? "Finding the best price…"
        : quote ? (livePay.address && quote.approvalAddress ? `Approve & swap` : "Swap")
        : "Swap";
    const disabled = ready && (busy || raw <= 0n || insufficient || phase === "quoting" || !quote);

    const connect = () => {
        if (mismatch && wallet.address) {
            addAccount({ address: wallet.address, kind: "wallet", connector: wallet.walletName });
            return;
        }
        if (!wallet.available) { setError("Add your Reown project ID in src/config/env.ts to connect wallet apps."); return; }
        wallet.connect((address, name) => addAccount({ address, kind: "wallet", connector: name }));
    };

    const rise = useRise(0);
    const rate = quote && Number(amount) > 0 ? quote.toAmount / Number(amount) : null;
    const hint = mismatch ? `You're viewing a different account than the connected wallet. Tap the button to switch to ${short(wallet.address)}.` : null;

    return (
        <View style={[styles.root, { backgroundColor: p.bg }]}>
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <Pressable style={[styles.back, { backgroundColor: p.surface, borderColor: p.border }]} onPress={onBack} accessibilityRole="button" accessibilityLabel="Back">
                    <Icon name="back" size={22} color={p.text} />
                </Pressable>
                <View style={[styles.titlePill, { backgroundColor: p.surface, borderColor: p.border }]}>
                    <Text style={[styles.titleText, { color: p.text }]}>Swap</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
                keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
            >
                {phase === "done" ? (
                    <SwapSuccess pay={livePay} receive={liveReceive} payAmount={amount} quote={quote} hash={hash} p={p} dark={dark} onDone={onBack} onViewActivity={onViewActivity} />
                ) : (
                    <>
                        <SlidingChips options={CHAINS.map(c => ({ id: c.id, label: c.name }))} value={chain.id} onChange={id => setChain(CHAINS.find(c => c.id === id)!)} p={p} />

                        <Animated.View style={rise}>
                            <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }]}>
                                <Text style={[styles.cardLabel, { color: p.textSecondary }]}>You pay</Text>
                                <View style={styles.row}>
                                    <TextInput
                                        style={[styles.amount, { color: p.text }]}
                                        value={amount}
                                        onChangeText={t => setAmount(t.replace(",", ".").replace(/[^0-9.]/g, ""))}
                                        placeholder="0"
                                        placeholderTextColor={p.textSecondary}
                                        keyboardType="decimal-pad"
                                        editable={!busy}
                                        accessibilityLabel="Amount to pay"
                                    />
                                    <TokenChip token={livePay} onPress={() => setPicker("pay")} p={p} dark={dark} />
                                </View>
                                <View style={styles.row}>
                                    <Text style={[styles.sub, { color: p.textSecondary }]}>
                                        {quote?.fromUsd != null ? usd(quote.fromUsd, 2) : livePay.price != null && Number(amount) > 0 ? usd(Number(amount) * livePay.price, 2) : " "}
                                    </Text>
                                    <Pressable onPress={() => setAmount(String(maxSpendable(livePay)))} hitSlop={10} accessibilityRole="button" accessibilityLabel="Use maximum">
                                        <Text style={[styles.sub, { color: p.textSecondary }]}>Balance {fmtAmount(livePay.balance)} <Text style={{ color: p.text, fontWeight: "700" }}>Max</Text></Text>
                                    </Pressable>
                                </View>
                            </View>

                            <View style={styles.flipWrap}>
                                <PressableScale onPress={flip} scale={0.9} style={[styles.flip, { backgroundColor: p.accent, borderColor: p.buttonEdge }]} accessibilityRole="button" accessibilityLabel="Flip tokens">
                                    <Animated.View style={flipStyle}><Icon name="swap" size={20} color={p.onAccent} /></Animated.View>
                                </PressableScale>
                            </View>

                            <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }]}>
                                <Text style={[styles.cardLabel, { color: p.textSecondary }]}>You receive</Text>
                                <View style={styles.row}>
                                    <View style={{ flex: 1, minHeight: 48, justifyContent: "center" }}>
                                        {phase === "quoting" ? <ActivityIndicator style={{ alignSelf: "flex-start" }} />
                                            : quote ? <Animated.Text key={quote.toAmount} entering={FadeIn.duration(250)} style={[styles.amount, { color: p.text }]} numberOfLines={1} adjustsFontSizeToFit>{fmtAmount(quote.toAmount)}</Animated.Text>
                                            : <Text style={[styles.amount, { color: p.textSecondary }]}>0</Text>}
                                    </View>
                                    <TokenChip token={liveReceive} onPress={() => setPicker("receive")} p={p} dark={dark} />
                                </View>
                                <Text style={[styles.sub, { color: p.textSecondary }]}>{quote?.toUsd != null ? usd(quote.toUsd, 2) : " "}</Text>
                            </View>
                        </Animated.View>

                        {quote && (
                            <Animated.View entering={FadeInDown.springify().damping(24).stiffness(220)} exiting={FadeOut.duration(150)} layout={LinearTransition.springify().damping(24).stiffness(220)} style={[styles.details, { backgroundColor: p.surface, borderColor: p.border }]}>
                                <Detail label="Rate" value={rate ? `1 ${livePay.symbol} ≈ ${fmtAmount(rate)} ${liveReceive.symbol}` : "—"} p={p} />
                                <Detail label="Minimum received" value={`${fmtAmount(quote.toAmountMin)} ${liveReceive.symbol}`} p={p} />
                                <Detail label="Network fee" value={quote.gasUsd != null ? `~${usd(quote.gasUsd, 2)}` : "—"} p={p} />
                                <Detail label="Route" value={`via ${quote.tool}`} p={p} last />
                            </Animated.View>
                        )}

                        {(error || hint) && (
                            <Animated.Text entering={FadeIn.duration(200)} style={[styles.error, { color: p.negative }]}>{error ?? hint}</Animated.Text>
                        )}

                        <Animated.View layout={LinearTransition.springify().damping(24).stiffness(220)} style={{ marginTop: 20 }}>
                            <TactileButton title={label} onPress={ready ? run : connect} disabled={disabled} />
                            <Text style={[styles.note, { color: p.textSecondary }]}>
                                {ready ? `Your ${wallet.walletName ?? "wallet"} asks you to approve each step. Cubby never holds your keys.` : "Connect the wallet app that holds this account to swap. Cubby never holds your keys."}
                            </Text>
                        </Animated.View>
                    </>
                )}
            </ScrollView>

            <TokenSheet
                visible={picker !== null}
                tokens={tokens}
                exclude={picker === "pay" ? liveReceive : livePay}
                onPick={t => { if (picker === "pay") setPay(t); else setReceive(t); }}
                onClose={() => setPicker(null)}
            />
        </View>
    );
};

const Detail = ({ label, value, p, last }: { label: string; value: string; p: Palette; last?: boolean }) => (
    <View style={[styles.detailRow, !last && { borderBottomWidth: 1, borderBottomColor: p.border }]}>
        <Text style={[styles.detailLabel, { color: p.textSecondary }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: p.text }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 6 },
    back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    titlePill: { borderWidth: 1, borderRadius: 22, paddingHorizontal: 26, height: 44, justifyContent: "center" },
    titleText: { fontSize: 18, fontWeight: "700" },
    card: { borderWidth: 1, borderRadius: 28, padding: 18 },
    cardLabel: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    amount: { flex: 1, fontSize: 40, fontWeight: "700", letterSpacing: -1.5, paddingVertical: 4, fontVariant: ["tabular-nums"] },
    sub: { fontSize: 14, marginTop: 4, fontVariant: ["tabular-nums"] },
    chip: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 26, paddingVertical: 8, paddingLeft: 8, paddingRight: 14 },
    chipText: { fontSize: 17, fontWeight: "700" },
    flipWrap: { alignItems: "center", height: 12, zIndex: 2 },
    flip: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: -22 },
    details: { borderWidth: 1, borderRadius: 24, paddingHorizontal: 18, marginTop: 14 },
    detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 13 },
    detailLabel: { fontSize: 15 },
    detailValue: { fontSize: 15, fontWeight: "600", fontVariant: ["tabular-nums"] },
    error: { fontSize: 14, marginTop: 14, lineHeight: 20 },
    note: { fontSize: 13, textAlign: "center", marginTop: 14, lineHeight: 19 },
    done: { alignItems: "center", paddingTop: 48 },
    doneIcon: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, alignItems: "center", justifyContent: "center", boxShadow: "0 4px 0 #0A0A0A" },
    doneTitle: { fontSize: 38, fontWeight: "700", letterSpacing: -1.4, marginTop: 24 },
    doneBody: { fontSize: 17, marginTop: 8, textAlign: "center" },
    link: { fontSize: 16, fontWeight: "600", marginTop: 18 },
});

export default Swap;
