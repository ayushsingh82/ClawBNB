import { logger } from "./logger";
import type { Agent } from "../local-db";

interface CanvasNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  config?: Record<string, string>;
}

interface CanvasEdge {
  id: string;
  source: string;
  target: string;
}

interface CanvasJson {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface FactoryResult {
  success: boolean;
  workerUrl?: string;
  workerId?: string;
  error?: string;
}

interface CloudflareDeployResult {
  id: string;
  url: string;
}

export class AgentFactoryService {
  private apiToken: string | null;
  private accountId: string | null;
  private useMock: boolean;

  constructor() {
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN || null;
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID || null;
    this.useMock = !this.apiToken || !this.accountId;

    if (this.useMock) {
      logger.warn(
        "AgentFactory: CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID not set. Using mock adapter."
      );
    }
  }

  async deploy(agent: Agent): Promise<FactoryResult> {
    const canvas = agent.canvasJson as unknown as CanvasJson;
    if (!canvas?.nodes?.length) {
      return { success: false, error: "Agent has no skill nodes" };
    }

    // 1. Generate worker code from agent graph
    const workerCode = this.generateWorkerCode(agent.id, agent.name, canvas);

    // 2. Deploy to Cloudflare (or mock)
    const workerName = `agent-${agent.id.replace(/-/g, "").slice(0, 16)}`;

    let result: CloudflareDeployResult;
    if (this.useMock) {
      result = await this.mockDeploy(workerName, workerCode);
    } else {
      result = await this.cloudflareDeployWorker(workerName, workerCode);
    }

    return {
      success: true,
      workerUrl: result.url,
      workerId: result.id,
    };
  }

  generateWorkerCode(
    agentId: string,
    agentName: string,
    canvas: CanvasJson
  ): string {
    const skillNodes = canvas.nodes.filter((n) => n.type !== "agent_center");

    const graphJson = JSON.stringify({
      agentId,
      agentName,
      nodes: skillNodes.map((n) => ({
        id: n.id,
        type: n.type,
        label: n.label,
        config: n.config || {},
      })),
      edges: canvas.edges.map((e) => ({
        source: e.source,
        target: e.target,
      })),
    });

    return `
// Auto-generated Cloudflare Worker for Agent: ${agentName}
// Agent ID: ${agentId}
// Generated at: ${new Date().toISOString()}

const AGENT_GRAPH = ${graphJson};

// ─── Skill Executors ───

const executors = {
  // Phase 1: Fully implemented
  async api_call(config, context) {
    const url = config.url || context.input?.url;
    const method = config.method || "GET";
    let headers = {};
    try { headers = JSON.parse(config.headers || "{}"); } catch {}
    const resp = await fetch(url, { method, headers });
    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("json")) {
      return { status: resp.status, data: await resp.json() };
    }
    return { status: resp.status, data: await resp.text() };
  },

  async webhook_notify(config, context) {
    const url = config.webhookUrl;
    let payload = {};
    try { payload = JSON.parse(config.payload || "{}"); } catch {}
    payload = { ...payload, agentId: AGENT_GRAPH.agentId, timestamp: Date.now(), context: context.input };
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { status: resp.status, sent: true };
  },

  async fetch_price(config, context) {
    const token = (config.tokenAddress || context.input?.tokenAddress || "").trim().toLowerCase();
    const dex = config.dex || "coingecko";
    try {
      if (token && token !== "0x" && token !== "0x0") {
        const resp = await fetch(
          \`https://api.coingecko.com/api/v3/simple/token_price/binance-smart-chain?contract_addresses=\${encodeURIComponent(token)}&vs_currencies=usd\`
        );
        const data = await resp.json();
        return { token: config.tokenAddress || token, dex, price: data[token]?.usd ?? null, raw: data };
      }
      const resp = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd");
      const data = await resp.json();
      return { token: "BNB", dex, price: data.binancecoin?.usd ?? null, raw: data };
    } catch (err) {
      return { token: config.tokenAddress || "BNB", dex, price: null, error: String(err) };
    }
  },

  async notify_user(config, context) {
    // Store notification in execution result — frontend polls for these
    return {
      channel: config.channel || "Push",
      message: config.message || "Agent notification",
      agentId: AGENT_GRAPH.agentId,
      timestamp: Date.now(),
    };
  },

  async conditional(config, context) {
    const condition = config.condition || "true";
    const input = context.input || {};
    // Simple expression evaluator for conditions
    let result;
    try {
      const fn = new Function("input", "context", \`return (\${condition})\`);
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
  },

  async loop(config, context) {
    const iterations = parseInt(config.iterations || "1");
    const interval = parseInt(config.interval || "0");
    const results = [];
    for (let i = 0; i < Math.min(iterations, 100); i++) {
      results.push({ iteration: i, timestamp: Date.now(), input: context.input });
      if (interval > 0 && i < iterations - 1) {
        await new Promise(r => setTimeout(r, Math.min(interval * 1000, 5000)));
      }
    }
    return { iterations: results.length, results };
  },

  // Phase 2 stubs: return schema-valid placeholder responses
  async mint_token(config, context) {
    const MINT_TOKEN_ADDRESS = "0xe936e65D9F598059579E3Dc74E98514124538398";
    const MINT_SELECTOR = "0x40c10f19";
    const to = config.recipient || context.input?.recipient || context.input?.walletAddress || "";
    const amount = config.amount || context.input?.amount || "1000";
    const decimals = 18;
    if (!to || !to.startsWith("0x")) {
      return { error: "No valid recipient address. Pass walletAddress or recipient in input.", requiresSignature: true, action: "mint_token" };
    }
    const toParam = to.slice(2).toLowerCase().padStart(64, "0");
    let amountWei;
    try { amountWei = (BigInt(amount) * BigInt(10 ** decimals)).toString(16).padStart(64, "0"); } catch { return { error: "Invalid amount", requiresSignature: true, action: "mint_token" }; }
    const calldata = MINT_SELECTOR + toParam + amountWei;
    return {
      requiresSignature: true,
      action: "mint_token",
      contractAddress: MINT_TOKEN_ADDRESS,
      chainId: 97,
      calldata,
      to,
      amount,
      decimals,
      tokenName: config.tokenName || "MintToken",
      symbol: config.symbol || "MTK",
      description: "Sign this transaction to mint tokens on BSC testnet",
    };
  },
  async mint_nft(config, context) {
    const MINT_NFT_ADDRESS = "0x1451A67F6527B6B37CFCA506dab9E5Fdcd6b9bd2";
    const to = config.recipient || context.input?.recipient || context.input?.walletAddress || "";
    const metadataUri = config.metadataUri || config.uri || "ipfs://nadclaw-nft-placeholder";
    if (!to || !to.startsWith("0x")) {
      return { error: "No valid recipient address. Pass walletAddress or recipient in input.", requiresSignature: true, action: "mint_nft" };
    }
    return {
      requiresSignature: true,
      action: "mint_nft",
      contractAddress: MINT_NFT_ADDRESS,
      chainId: 97,
      to,
      metadataUri,
      description: "Sign this transaction to mint an NFT on BSC testnet",
    };
  },
  async transfer_asset(config) {
    return { stub: true, action: "transfer_asset", config, message: "Asset transfer requires on-chain transaction signing" };
  },
  async create_dao(config) {
    return { stub: true, action: "create_dao", config, message: "DAO creation requires on-chain deployment" };
  },
  async send_email(config) {
    return { stub: true, action: "send_email", config, message: "Email sending requires SMTP configuration" };
  },
  async set_reminder(config) {
    return { stub: true, action: "set_reminder", config, message: "Reminder set", delayMinutes: config.delayMinutes };
  },
  async create_task(config) {
    return { stub: true, action: "create_task", config, title: config.taskTitle, priority: config.priority };
  },
  async schedule_meeting(config) {
    return { stub: true, action: "schedule_meeting", config, title: config.title, duration: config.duration };
  },
  async fetch_states(config) {
    return { stub: true, action: "fetch_states", contract: config.contractAddress, method: config.method };
  },
  async fetch_balance(config, context) {
    const BSC_RPC = "https://data-seed-prebsc-1-s1.bnbchain.org:8545";
    const BALANCE_OF_SELECTOR = "0x70a08231";
    async function rpc(method, params) {
      const resp = await fetch(BSC_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });
      const body = await resp.json();
      if (body.error) throw new Error(body.error.message || "RPC error");
      return body.result;
    }
    const wallet = (config.walletAddress || context.input?.walletAddress || "").trim();
    const token = (config.token || context.input?.token || "").trim().toLowerCase();
    if (!wallet || !wallet.startsWith("0x")) {
      return { wallet, token: token || "BNB", balance: "0", decimals: 18, error: "Invalid wallet address" };
    }
    try {
      if (!token || token === "bnb" || token === "0x" || token === "0x0") {
        const hex = await rpc("eth_getBalance", [wallet, "latest"]);
        const raw = hex && hex.startsWith("0x") ? hex : "0x0";
        const balance = BigInt(raw).toString();
        return { wallet, token: "BNB", balance, decimals: 18, raw };
      }
      const addressParam = wallet.slice(2).padStart(64, "0");
      const data = BALANCE_OF_SELECTOR + addressParam;
      const result = await rpc("eth_call", [{ to: token, data }, "latest"]);
      const balance = result && result.startsWith("0x") ? BigInt(result).toString() : "0";
      return { wallet, token: config.token, balance, decimals: 18, raw: result };
    } catch (err) {
      return { wallet, token: token || "BNB", balance: "0", decimals: 18, error: String(err) };
    }
  },
  async fetch_transactions(config) {
    return { stub: true, action: "fetch_transactions", wallet: config.walletAddress, limit: config.limit };
  },
  async query_user(config) {
    return { stub: true, action: "query_user", prompt: config.prompt, inputType: config.inputType };
  },
  async run_sub_agent(config) {
    return { stub: true, action: "run_sub_agent", agentId: config.agentId };
  },
  async store_result(config, context) {
    return { stored: true, key: config.key, ttl: config.ttl, value: context.input };
  },
};

// ─── Execution Engine ───

async function executeGraph(input, env) {
  const context = { input, results: {}, agentId: AGENT_GRAPH.agentId, env };
  const nodes = AGENT_GRAPH.nodes;
  const results = {};

  for (const node of nodes) {
    const executor = executors[node.type];
    if (!executor) {
      results[node.id] = { error: \`No executor for skill type: \${node.type}\` };
      continue;
    }
    try {
      results[node.id] = await executor(node.config, { ...context, results });
    } catch (err) {
      results[node.id] = { error: String(err) };
    }
  }

  return {
    agentId: AGENT_GRAPH.agentId,
    agentName: AGENT_GRAPH.agentName,
    executedAt: new Date().toISOString(),
    nodeCount: nodes.length,
    results,
  };
}

// ─── Worker Entry Point ───

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/" || url.pathname === "/health") {
      return Response.json({
        agent: AGENT_GRAPH.agentName,
        agentId: AGENT_GRAPH.agentId,
        status: "live",
        skills: AGENT_GRAPH.nodes.map(n => n.type),
        nodeCount: AGENT_GRAPH.nodes.length,
      });
    }

    // Execute agent graph
    if (url.pathname === "/execute" && request.method === "POST") {
      try {
        const body = await request.json();
        const result = await executeGraph(body.input || {}, env);
        return Response.json(result);
      } catch (err) {
        return Response.json({ error: String(err) }, { status: 500 });
      }
    }

    // Get agent graph metadata
    if (url.pathname === "/graph") {
      return Response.json(AGENT_GRAPH);
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
};
`.trim();
  }

  private async cloudflareDeployWorker(
    workerName: string,
    workerCode: string
  ): Promise<CloudflareDeployResult> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/workers/scripts/${workerName}`;

    // Upload worker script as ES module using FormData
    const formData = new FormData();
    formData.append(
      "metadata",
      new Blob(
        [JSON.stringify({ main_module: "index.js", compatibility_date: "2024-01-01" })],
        { type: "application/json" }
      )
    );
    formData.append(
      "index.js",
      new Blob([workerCode], { type: "application/javascript+module" }),
      "index.js"
    );

    const uploadResp = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: formData,
    });

    if (!uploadResp.ok) {
      const err = await uploadResp.text();
      throw new Error(`Cloudflare upload failed: ${uploadResp.status} ${err}`);
    }

    // Enable workers.dev subdomain route
    const subdomainUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/workers/scripts/${workerName}/subdomain`;
    await fetch(subdomainUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ enabled: true }),
    });

    // Get account subdomain
    const subdomainInfoUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/workers/subdomain`;
    const subdomainResp = await fetch(subdomainInfoUrl, {
      headers: { Authorization: `Bearer ${this.apiToken}` },
    });
    let subdomain = "workers";
    if (subdomainResp.ok) {
      const subdomainData = (await subdomainResp.json()) as {
        result?: { subdomain?: string };
      };
      subdomain = subdomainData.result?.subdomain || subdomain;
    }

    const workerUrl = `https://${workerName}.${subdomain}.workers.dev`;

    logger.info(`Cloudflare Worker deployed: ${workerUrl}`);

    return { id: workerName, url: workerUrl };
  }

  private async mockDeploy(
    workerName: string,
    _workerCode: string
  ): Promise<CloudflareDeployResult> {
    logger.info(`Mock deploy: ${workerName} (Cloudflare credentials not configured)`);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 500));

    return {
      id: workerName,
      url: `https://${workerName}.mock-workers.dev`,
    };
  }
}
