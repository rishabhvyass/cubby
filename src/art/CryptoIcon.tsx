/**
 * Real token / chain / wallet / protocol logos.
 * Source: @web3icons/core (MIT). The logos themselves are trademarks of their owners; using them to identify
 * the asset is standard for portfolio apps. See assets/svg/crypto/README.md.
 *
 * Usage:
 *   <TokenIcon symbol="ETH" size={40} />        // also WETH, WBTC, stETH, USDC.e … (see TOKEN_ALIASES)
 *   <ChainIcon chain="Base" size={20} />        // 'Ethereum' | 'Base' | 'Arbitrum' | 'Solana' | 'Polygon' | 'Optimism'
 *   <WalletIcon id="metamask" size={44} />      // metamask | walletconnect | coinbase | phantom
 *   <ProtocolIcon name="Uniswap" size={36} />   // Uniswap, Aave, Lido, 1inch, Camelot
 *
 * Unknown symbol (or NFT / "+3 Other")? -> falls back to the original design: a monogram on an asset-palette tile.
 * Never tint or recolour a logo. Never put text over it.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { tokensSvg, chainsSvg, walletsSvg, type TokenKey, type ChainKey, type WalletKey } from './cryptoSvgs';
import { assetPalette, fonts } from '../theme/tokens';

/** Logos whose file is a full-bleed tile (already has its own background) -> fill the whole circle. */
const FULL_BLEED = new Set<string>(['wbtc', 'arb', 'base']);

/** Symbol (upper-case) -> file key. Wrapped/derived tokens reuse their parent's logo. */
export const TOKEN_ALIASES: Record<string, TokenKey> = {
  ETH: 'eth', WETH: 'eth', USDC: 'usdc', 'USDC.E': 'usdc', USDT: 'usdt',
  BTC: 'btc', WBTC: 'wbtc', CBBTC: 'btc', SOL: 'sol', WSOL: 'sol', POL: 'pol', MATIC: 'pol',
  ARB: 'arb', OP: 'op', UNI: 'uni', AAVE: 'aave', LDO: 'ldo', STETH: 'ldo', WSTETH: 'ldo',
  '1INCH': '1inch', DAI: 'dai', LINK: 'link', GRAIL: 'grail',
};
const CHAIN_ALIASES: Record<string, ChainKey> = {
  ETHEREUM: 'ethereum', ETH: 'ethereum', BASE: 'base', BA: 'base', ARBITRUM: 'arbitrum', AR: 'arbitrum',
  SOLANA: 'solana', SO: 'solana', POLYGON: 'polygon', PO: 'polygon', OPTIMISM: 'optimism', OP: 'optimism',
};
const PROTOCOL_ALIASES: Record<string, TokenKey> = {
  UNISWAP: 'uni', AAVE: 'aave', LIDO: 'ldo', '1INCH': '1inch', CAMELOT: 'grail',
};

type Scheme = { surface: string; border: string };
const LIGHT: Scheme = { surface: '#FFFFFF', border: 'rgba(10,10,10,0.09)' };
const DARK: Scheme = { surface: '#1A1A1A', border: 'rgba(255,255,255,0.09)' };

function Badge({ xml, size, fullBleed, scheme = LIGHT, round = true, fill = 0.62 }: { xml: string; size: number; fullBleed: boolean; scheme?: Scheme; round?: boolean; fill?: number }) {
  const inner = fullBleed ? size : Math.round(size * fill);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: round ? size / 2 : size * 0.28, backgroundColor: fullBleed ? 'transparent' : scheme.surface, borderColor: scheme.border },
      ]}
    >
      <SvgXml xml={xml} width={inner} height={inner} />
    </View>
  );
}

function Monogram({ label, size, color = assetPalette.defi, round = true }: { label: string; size: number; color?: string; round?: boolean }) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: round ? size / 2 : size * 0.28, backgroundColor: color, borderWidth: 0 }]}>
      <Text style={{ fontFamily: fonts.mono, fontSize: size * 0.34, color: '#0A0A0A', fontWeight: '600' }}>{label.slice(0, 4)}</Text>
    </View>
  );
}

export function TokenIcon({ symbol, size = 40, dark = false, fallbackColor }: { symbol: string; size?: number; dark?: boolean; fallbackColor?: string }) {
  const key = TOKEN_ALIASES[symbol.toUpperCase()];
  if (!key) return <Monogram label={symbol} size={size} color={fallbackColor} />;
  return <Badge xml={tokensSvg[key]} size={size} fullBleed={FULL_BLEED.has(key)} scheme={dark ? DARK : LIGHT} />;
}

export function ChainIcon({ chain, size = 20, dark = false }: { chain: string; size?: number; dark?: boolean }) {
  const key = CHAIN_ALIASES[chain.toUpperCase()];
  if (!key) return <Monogram label={chain} size={size} />;
  // small chain badges sit on top of a token icon, so the mark fills more of the circle (0.8)
  return <Badge xml={chainsSvg[key]} size={size} fullBleed={FULL_BLEED.has(key)} scheme={dark ? DARK : LIGHT} fill={0.8} />;
}

export function ProtocolIcon({ name, size = 36, dark = false }: { name: string; size?: number; dark?: boolean }) {
  const key = PROTOCOL_ALIASES[name.toUpperCase()];
  if (!key) return <Monogram label={name} size={size} />;
  return <Badge xml={tokensSvg[key]} size={size} fullBleed={false} scheme={dark ? DARK : LIGHT} />;
}

/** Wallet tiles are rounded squares in the design (not circles). */
export function WalletIcon({ id, size = 44, dark = false }: { id: WalletKey; size?: number; dark?: boolean }) {
  return <Badge xml={walletsSvg[id]} size={size} fullBleed={false} scheme={dark ? DARK : LIGHT} round={false} />;
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
});
