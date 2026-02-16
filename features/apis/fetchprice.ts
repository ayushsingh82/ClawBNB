/**
 * Fetch token price using free CoinGecko API.
 * Input matches sidebar: tokenAddress (optional), dex/source (e.g. "coingecko").
 * - If tokenAddress provided: token price on BSC via contract_addresses.
 * - If empty: native BNB price via coin id "binancecoin".
 */

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export interface FetchPriceInput {
  tokenAddress?: string;
  dex?: string;
}

export interface FetchPriceResult {
  token: string;
  dex: string;
  price: number | null;
  raw?: Record<string, unknown>;
  error?: string;
}

/**
 * Get token or native price in USD. Uses CoinGecko public API (no key required).
 */
export async function fetchPrice(input: FetchPriceInput): Promise<FetchPriceResult> {
  const token = (input.tokenAddress || "").trim().toLowerCase();
  const dex = input.dex || "coingecko";

  try {
    if (token && token !== "0x" && token !== "0x0") {
      // Token by contract address on BSC
      const url = `${COINGECKO_BASE}/simple/token_price/binance-smart-chain?contract_addresses=${encodeURIComponent(token)}&vs_currencies=usd`;
      const resp = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await resp.json()) as Record<string, { usd?: number }>;
      const price = data[token]?.usd ?? null;
      return { token: input.tokenAddress!, dex, price, raw: data };
    }

    // Native BNB price by coin id (free, no key)
    const url = `${COINGECKO_BASE}/simple/price?ids=binancecoin&vs_currencies=usd`;
    const resp = await fetch(url, { headers: { Accept: "application/json" } });
    const data = (await resp.json()) as Record<string, { usd?: number }>;
    const price = data.binancecoin?.usd ?? null;
    return {
      token: "BNB",
      dex,
      price,
      raw: data,
    };
  } catch (err) {
    return {
      token: input.tokenAddress || "BNB",
      dex,
      price: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
