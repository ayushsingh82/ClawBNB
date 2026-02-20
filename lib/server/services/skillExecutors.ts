import type { SkillExecutor } from "../types/skillExecutor";
import { fetchBalance } from "../../../features/apis/fetchbalance";
import { mintToken, mintNft } from "./agentWallet";
import type { Hex } from "viem";

// ─── Phase 1: Fully Implemented Executors ───

const apiCall: SkillExecutor = async (config, context) => {
  const url = config.url || (context.input?.url as string);
  if (!url) return { error: "No URL provided" };

  const method = config.method || "GET";
  let headers: Record<string, string> = {};
  try {
    headers = JSON.parse(config.headers || "{}");
  } catch {
    // ignore parse errors
  }

  const resp = await fetch(url, { method, headers });
  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("json")) {
    return { status: resp.status, data: await resp.json() };
  }
  return { status: resp.status, data: await resp.text() };
};

const webhookNotify: SkillExecutor = async (config, context) => {
  const url = config.webhookUrl;
  if (!url) return { error: "No webhook URL provided" };

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(config.payload || "{}");
  } catch {
    // ignore
  }
  payload = {
    ...payload,
    agentId: context.agentId,
    timestamp: Date.now(),
    context: context.input,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { status: resp.status, sent: true };
};

const fetchPrice: SkillExecutor = async (config, context) => {
  const token =
    config.tokenAddress || (context.input?.tokenAddress as string) || "0x0";
  const dex = config.dex || "coingecko";

  try {
    const resp = await fetch(
      `https://api.coingecko.com/api/v3/simple/token_price/binance-smart-chain?contract_addresses=${token}&vs_currencies=usd`
    );
    const data = await resp.json();
    const key = token.toLowerCase();
    return {
      token,
      dex,
      price: (data as Record<string, { usd?: number }>)[key]?.usd ?? null,
      raw: data,
    };
  } catch (err) {
    return { token, dex, price: null, error: String(err) };
  }
};

const notifyUser: SkillExecutor = async (config, context) => {
  return {
    channel: config.channel || "Push",
    message: config.message || "Agent notification",
    agentId: context.agentId,
    timestamp: Date.now(),
  };
};

const conditional: SkillExecutor = async (config, context) => {
  const condition = config.condition || "true";
  const input = context.input || {};
  let result: boolean;
  try {
    const fn = new Function("input", "context", `return (${condition})`);
    result = fn(input, context);
  } catch {
    result = false;
  }
  return {
    evaluated: result,
    branch: result ? "true" : "false",
    trueBranch: config.trueBranch,
    falseBranch: config.falseBranch,
  };
};

const loop: SkillExecutor = async (config, context) => {
  const iterations = parseInt(config.iterations || "1");
  const interval = parseInt(config.interval || "0");
  const results: Array<{ iteration: number; timestamp: number; input: unknown }> = [];

  for (let i = 0; i < Math.min(iterations, 100); i++) {
    results.push({ iteration: i, timestamp: Date.now(), input: context.input });
    if (interval > 0 && i < iterations - 1) {
      await new Promise((r) =>
        setTimeout(r, Math.min(interval * 1000, 5000))
      );
    }
  }
  return { iterations: results.length, results };
};

// ─── Phase 2 Stubs ───

function stubExecutor(action: string): SkillExecutor {
  return async (config) => ({
    stub: true,
    action,
    config,
    message: `${action} is a Phase 2 skill — execution logic not yet implemented`,
  });
}

// ─── Registry ───

export const skillExecutors: Record<string, SkillExecutor> = {
  // Phase 1: Real execution
  api_call: apiCall,
  webhook_notify: webhookNotify,
  fetch_price: fetchPrice,
  notify_user: notifyUser,
  conditional,
  loop,

  // Phase 2: Real on-chain signing via agent wallet
  mint_token: async (config, context) => {
    const agentPrivateKey = context.input?.agentPrivateKey as Hex | undefined;
    if (!agentPrivateKey) {
      return { error: "Agent wallet not configured. Re-create the agent to generate a wallet.", action: "mint_token" };
    }

    const recipient = config.recipient || (context.input?.recipient as string) || (context.input?.walletAddress as string) || "";
    const amount = config.amount || (context.input?.amount as string) || "1000";
    const decimals = 18;

    if (!recipient || !recipient.startsWith("0x")) {
      return { error: "No valid recipient address", action: "mint_token" };
    }

    try {
      const amountWei = BigInt(amount) * BigInt(10 ** decimals);
      const result = await mintToken(agentPrivateKey, recipient, amountWei);
      return {
        action: "mint_token",
        txHash: result.txHash,
        status: result.status,
        recipient,
        amount,
        tokenName: config.tokenName || "ClawBNB Token",
        symbol: config.symbol || "NCLAW",
        explorerUrl: `https://testnet.bscscan.com/tx/${result.txHash}`,
      };
    } catch (err) {
      return { error: `mint_token failed: ${err instanceof Error ? err.message : String(err)}`, action: "mint_token" };
    }
  },
  fetch_balance: async (config, context) => {
    return fetchBalance({
      walletAddress: config.walletAddress || (context.input?.walletAddress as string) || "",
      token: config.token || (context.input?.token as string),
    });
  },

  mint_nft: async (config, context) => {
    const agentPrivateKey = context.input?.agentPrivateKey as Hex | undefined;
    if (!agentPrivateKey) {
      return { error: "Agent wallet not configured. Re-create the agent to generate a wallet.", action: "mint_nft" };
    }

    const recipient = config.recipient || (context.input?.recipient as string) || (context.input?.walletAddress as string) || "";
    const metadataUri = config.metadataUri || config.uri || "ipfs://nadclaw-nft-placeholder";

    if (!recipient || !recipient.startsWith("0x")) {
      return { error: "No valid recipient address", action: "mint_nft" };
    }

    try {
      const result = await mintNft(agentPrivateKey, recipient, metadataUri);
      return {
        action: "mint_nft",
        txHash: result.txHash,
        tokenId: result.tokenId,
        status: result.status,
        recipient,
        metadataUri,
        explorerUrl: `https://testnet.bscscan.com/tx/${result.txHash}`,
      };
    } catch (err) {
      return { error: `mint_nft failed: ${err instanceof Error ? err.message : String(err)}`, action: "mint_nft" };
    }
  },
  transfer_asset: stubExecutor("transfer_asset"),
  create_dao: stubExecutor("create_dao"),
  send_email: stubExecutor("send_email"),
  set_reminder: stubExecutor("set_reminder"),
  create_task: stubExecutor("create_task"),
  schedule_meeting: stubExecutor("schedule_meeting"),
  fetch_states: stubExecutor("fetch_states"),
  fetch_transactions: stubExecutor("fetch_transactions"),
  query_user: stubExecutor("query_user"),
  run_sub_agent: stubExecutor("run_sub_agent"),
  store_result: async (config, context) => ({
    stored: true,
    key: config.key,
    ttl: config.ttl,
    value: context.input,
  }),
};

export function getExecutor(skillType: string): SkillExecutor | undefined {
  return skillExecutors[skillType];
}

export function listImplementedSkills(): string[] {
  return [
    "api_call",
    "webhook_notify",
    "fetch_price",
    "notify_user",
    "conditional",
    "loop",
    "store_result",
    "fetch_balance",
    "mint_token",
    "mint_nft",
  ];
}
