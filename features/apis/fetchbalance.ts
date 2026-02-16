/**
 * Fetch wallet balance using free public RPC (BSC Testnet).
 * Input matches sidebar: walletAddress, token (e.g. "BNB" for native or token contract address).
 */

const BSC_RPC = "https://data-seed-prebsc-1-s1.bnbchain.org:8545";

// ERC20 balanceOf selector (first 4 bytes of keccak256("balanceOf(address)"))
const BALANCE_OF_SELECTOR = "0x70a08231";

export interface FetchBalanceInput {
  walletAddress: string;
  token?: string;
}

export interface FetchBalanceResult {
  wallet: string;
  token: string;
  balance: string;
  decimals: number;
  raw?: string;
  error?: string;
}

function rpc(method: string, params: unknown[]): Promise<unknown> {
  return fetch(BSC_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  }).then((r) => r.json()).then((body: { result?: unknown; error?: { message?: string } }) => {
    if (body.error) throw new Error(body.error?.message || "RPC error");
    return body.result;
  });
}

/**
 * Get native BNB balance or ERC20 balance. Uses public BSC testnet RPC (no key).
 */
export async function fetchBalance(input: FetchBalanceInput): Promise<FetchBalanceResult> {
  const wallet = (input.walletAddress || "").trim();
  const token = (input.token || "").trim().toLowerCase();

  if (!wallet || !wallet.startsWith("0x")) {
    return {
      wallet: input.walletAddress || "",
      token: token || "BNB",
      balance: "0",
      decimals: 18,
      error: "Invalid wallet address",
    };
  }

  try {
    // Native BNB balance
    if (!token || token === "bnb" || token === "0x" || token === "0x0") {
      const hex = (await rpc("eth_getBalance", [wallet, "latest"])) as string;
      const balance = hex && hex.startsWith("0x") ? BigInt(hex).toString() : "0";
      return {
        wallet,
        token: "BNB",
        balance,
        decimals: 18,
        raw: hex,
      };
    }

    // ERC20 balance: assume token is contract address
    const addressParam = wallet.slice(2).padStart(64, "0");
    const data = BALANCE_OF_SELECTOR + addressParam;
    const result = (await rpc("eth_call", [
      { to: token, data },
      "latest",
    ])) as string;
    const balance = result && result.startsWith("0x") ? BigInt(result).toString() : "0";

    return {
      wallet,
      token: input.token!,
      balance,
      decimals: 18,
      raw: result,
    };
  } catch (err) {
    return {
      wallet,
      token: token || "BNB",
      balance: "0",
      decimals: 18,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
