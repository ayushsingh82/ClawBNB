import { defineChain } from "viem";

// BSC Testnet – used by wallet config and server (e.g. profile metadata)
export const bscTestnet = defineChain({
  id: 97,
  name: "BSC Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "BNB",
    symbol: "tBNB",
  },
  rpcUrls: {
    default: {
      http: ["https://data-seed-prebsc-1-s1.bnbchain.org:8545"],
    },
  },
  blockExplorers: {
    default: {
      name: "BSC Testnet Explorer",
      url: "https://testnet.bscscan.com",
    },
  },
});

export const BSC_TESTNET_EXPLORER_URL = "https://testnet.bscscan.com";
