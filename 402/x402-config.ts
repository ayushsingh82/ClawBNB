/**
 * x402 config for BSC Testnet.
 * Used by the premium API route and the client unlock flow.
 */

export const BSC_NETWORK = "eip155:97" as const;
export const BSC_USDC_TESTNET = "0xeD24FC36d5Ee211Ea25A802eFb36D4e25A3c0792" as const; // BUSD on BSC testnet
export const FACILITATOR_URL = "https://x402-facilitator.molandak.org";
export const PREMIUM_PRICE_USDC = "0.001";
/** Price per agent feature / block type (0.1 BUSD) */
export const FEATURE_PRICE_USDC = "0.1";

/** x402 merchant address — receives deployment payments on BSC testnet. Override with PAY_TO_ADDRESS in .env */
export const MERCHANT_ADDRESS = "0xB822B51A88E8a03fCe0220B15Cb2C662E42Adec1" as const;

export const x402ClientConfig = {
  chainId: BSC_NETWORK,
  usdcAddress: BSC_USDC_TESTNET,
  facilitator: FACILITATOR_URL,
  price: PREMIUM_PRICE_USDC,
} as const;
