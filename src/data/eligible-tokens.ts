import type { EligibleToken, TokenCategory } from "@/types/strategy";

/**
 * Eligible token symbols for BNB Hack: AI Trading Agent Edition.
 *
 * This list is based on the eligible BEP-20 token list shown in the
 * DoraHacks / CoinMarketCap hackathon requirements.
 *
 * Important:
 * - Trades outside this list do not count.
 * - Some symbols may be ambiguous, so future versions should map symbols
 *   to CoinMarketCap IDs when possible.
 * - BNB and BTCB are intentionally omitted from the app token universe until
 *   they are verified against the official hackathon list for this track.
 */
export const eligibleTokenSymbols = [
  "ETH",
  "USDT",
  "USDC",
  "XRP",
  "TRX",
  "DOGE",
  "ZEC",
  "ADA",
  "LINK",
  "BCH",
  "DAI",
  "TON",
  "USD1",
  "USDe",
  "M",
  "LTC",
  "AVAX",
  "SHIB",
  "XAUt",
  "WLFI",
  "H",
  "DOT",
  "UNI",
  "ASTER",
  "DEXE",
  "USDD",
  "ETC",
  "AAVE",
  "ATOM",
  "U",
  "STABLE",
  "FIL",
  "INJ",
  "NIGHT",
  "FET",
  "TUSD",
  "BONK",
  "PENGU",
  "CAKE",
  "SIREN",
  "LUNC",
  "ZRO",
  "KITE",
  "FDUSD",
  "BEAT",
  "PIEVERSE",
  "BTT",
  "NFT",
  "EDGE",
  "FLOKI",
  "LDO",
  "B",
  "FF",
  "PENDLE",
  "NEX",
  "STG",
  "AXS",
  "TWT",
  "HOME",
  "RAY",
  "COMP",
  "GWEI",
  "XCN",
  "GENIUS",
  "XPL",
  "BAT",
  "SKYAI",
  "APE",
  "IP",
  "SFP",
  "TAG",
  "NXPC",
  "AB",
  "SAHARA",
  "1INCH",
  "CHEEMS",
  "BANANAS31",
  "RIVER",
  "MYX",
  "RAVE",
  "SNX",
  "FORM",
  "LAB",
  "HTX",
  "USDf",
  "CTM",
  "BDX",
  "SLX",
  "UB",
  "DUCKY",
  "FRAX",
  "BILL",
  "WFI",
  "KOGE",
  "ALE",
  "FRXUSD",
  "USDF",
  "GOMINING",
  "VCNT",
  "GUA",
  "DUSD",
  "SMILEK",
  "OG",
  "BEAM",
  "MY",
  "SOON",
  "REAL",
  "Q",
  "AIOZ",
  "ZIG",
  "YFI",
  "TAC",
  "lisUSD",
  "CYS",
  "ZAMA",
  "TRIA",
  "HUMA",
  "PLUME",
  "ZIL",
  "XPR",
  "ZETA",
  "BabyDoge",
  "NILA",
  "ROSE",
  "VELO",
  "UAI",
  "BRETT",
  "OPEN",
  "BSB",
  "TOSHI",
  "BAS",
  "ACH",
  "AXL",
  "LUR",
  "ELF",
  "KAVA",
  "APR",
  "IRYS",
  "EURI",
  "XUSD",
  "BARD",
  "DUSK",
  "SUSHI",
  "PEAQ",
  "COAI",
  "BDCA",
  "XAUM",
] as const;

export type EligibleTokenSymbol = (typeof eligibleTokenSymbols)[number];

const beginnerSymbols = new Set(["ETH", "AVAX", "LINK", "AAVE", "UNI", "ATOM", "CAKE", "TWT", "FET", "DOGE", "SHIB"]);

function token(id: number, symbol: string, name: string, category: TokenCategory, cmcId = id < 900000 ? id : undefined): EligibleToken {
  return {
    id,
    cmcId,
    symbol,
    name,
    category,
    beginner: beginnerSymbols.has(symbol),
  };
}

// Placeholder IDs use the 900000+ range until a verified CoinMarketCap ID is mapped.
export const eligibleTokenUniverse: EligibleToken[] = [
  token(1027, "ETH", "Ethereum", "Main Assets"),
  token(52, "XRP", "XRP", "Main Assets"),
  token(1958, "TRX", "TRON", "Main Assets"),
  token(2010, "ADA", "Cardano", "Main Assets"),
  token(74, "DOGE", "Dogecoin", "Main Assets"),
  token(1975, "LINK", "Chainlink", "Main Assets"),
  token(1831, "BCH", "Bitcoin Cash", "Main Assets"),
  token(2, "LTC", "Litecoin", "Main Assets"),
  token(5805, "AVAX", "Avalanche", "Main Assets"),
  token(6636, "DOT", "Polkadot", "Main Assets"),
  token(3794, "ATOM", "Cosmos", "Main Assets"),
  token(1321, "ETC", "Ethereum Classic", "Main Assets"),
  token(11419, "TON", "Toncoin", "Main Assets"),

  token(825, "USDT", "Tether USDt", "Stablecoins / Collateral"),
  token(3408, "USDC", "USDC", "Stablecoins / Collateral"),
  token(4943, "DAI", "Dai", "Stablecoins / Collateral"),
  token(2563, "TUSD", "TrueUSD", "Stablecoins / Collateral"),
  token(26081, "FDUSD", "First Digital USD", "Stablecoins / Collateral"),
  token(19891, "USDD", "USDD", "Stablecoins / Collateral"),
  token(900001, "USD1", "USD1", "Stablecoins / Collateral"),
  token(29470, "USDe", "Ethena USDe", "Stablecoins / Collateral"),
  token(900002, "STABLE", "STABLE", "Stablecoins / Collateral"),
  token(5176, "XAUt", "Tether Gold", "Stablecoins / Collateral"),

  token(7186, "CAKE", "PancakeSwap", "DeFi / Infrastructure / AI"),
  token(7083, "UNI", "Uniswap", "DeFi / Infrastructure / AI"),
  token(7278, "AAVE", "Aave", "DeFi / Infrastructure / AI"),
  token(7226, "INJ", "Injective", "DeFi / Infrastructure / AI"),
  token(8000, "LDO", "Lido DAO", "DeFi / Infrastructure / AI"),
  token(9481, "PENDLE", "Pendle", "DeFi / Infrastructure / AI"),
  token(18934, "STG", "Stargate Finance", "DeFi / Infrastructure / AI"),
  token(2280, "FIL", "Filecoin", "DeFi / Infrastructure / AI"),
  token(26997, "ZRO", "LayerZero", "DeFi / Infrastructure / AI"),
  token(3773, "FET", "Artificial Superintelligence Alliance", "DeFi / Infrastructure / AI"),
  token(7326, "DEXE", "DeXe", "DeFi / Infrastructure / AI"),
  token(1437, "ZEC", "Zcash", "DeFi / Infrastructure / AI"),
  token(16086, "BTT", "BitTorrent", "DeFi / Infrastructure / AI"),
  token(9816, "NFT", "APENFT", "DeFi / Infrastructure / AI"),
  token(900003, "M", "M", "DeFi / Infrastructure / AI"),
  token(900004, "WLFI", "WLFI", "DeFi / Infrastructure / AI"),
  token(5964, "TWT", "Trust Wallet Token", "DeFi / Infrastructure / AI"),

  token(5994, "SHIB", "Shiba Inu", "Memecoins / Web3 Culture"),
  token(23095, "BONK", "Bonk", "Memecoins / Web3 Culture"),
  token(10804, "FLOKI", "FLOKI", "Memecoins / Web3 Culture"),
  token(34466, "PENGU", "Pudgy Penguins", "Memecoins / Web3 Culture"),
  token(4172, "LUNC", "Terra Classic", "Memecoins / Web3 Culture"),
];

export const beginnerTokenSet = eligibleTokenUniverse.filter((item) => item.beginner);

// Backward-compatible export for existing UI imports.
export const eligibleTokens = beginnerTokenSet;

export const eligibleTokensByCategory = eligibleTokenUniverse.reduce<Record<TokenCategory, EligibleToken[]>>(
  (groups, item) => {
    groups[item.category].push(item);
    return groups;
  },
  {
    "Main Assets": [],
    "Stablecoins / Collateral": [],
    "DeFi / Infrastructure / AI": [],
    "Memecoins / Web3 Culture": [],
  },
);

export function isEligibleToken(symbol: string): symbol is EligibleTokenSymbol {
  return eligibleTokenSymbols.includes(symbol.trim() as EligibleTokenSymbol);
}

export function normalizeTokenSymbol(symbol: string): string {
  return symbol.trim();
}
