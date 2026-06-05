import type { EligibleToken } from "@/types/strategy";

export const eligibleTokens: EligibleToken[] = [
  { id: 1, symbol: "BTC", name: "Bitcoin", category: "Layer 1" },
  { id: 1027, symbol: "ETH", name: "Ethereum", category: "Layer 1" },
  { id: 1839, symbol: "BNB", name: "BNB", category: "Exchange" },
  { id: 5426, symbol: "SOL", name: "Solana", category: "Layer 1" },
  { id: 11841, symbol: "ARB", name: "Arbitrum", category: "Layer 2" },
  { id: 3890, symbol: "MATIC", name: "Polygon", category: "Layer 2" },
  { id: 1975, symbol: "LINK", name: "Chainlink", category: "DeFi" },
  { id: 5805, symbol: "AVAX", name: "Avalanche", category: "Layer 1" },
  { id: 7083, symbol: "UNI", name: "Uniswap", category: "DeFi" },
  { id: 74, symbol: "DOGE", name: "Dogecoin", category: "Meme" },
  { id: 5994, symbol: "SHIB", name: "Shiba Inu", category: "Meme" },
  { id: 6535, symbol: "NEAR", name: "NEAR Protocol", category: "AI" },
];
