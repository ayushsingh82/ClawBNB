// API client — localStorage-backed agent storage, server API only for deploy/execute

export interface CanvasBlock {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  config?: Record<string, string>;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
}

export type AgentStatus = "draft" | "deploying" | "live" | "failed";

export interface AgentFromAPI {
  id: string;
  name: string;
  description: string | null;
  canvasJson: {
    nodes: CanvasBlock[];
    edges: CanvasEdge[];
  };
  status: AgentStatus;
  workerUrl: string | null;
  walletAddress: string | null;
  createdAt: string;
  updatedAt: string;
  deployments?: Array<{
    id: string;
    deploymentStatus: string;
    workerUrl: string | null;
    createdAt: string;
  }>;
}

// ─── localStorage helpers ───

const STORAGE_KEY = "clawbnb_agents";

function uuid(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readAgents(): AgentFromAPI[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAgents(agents: AgentFromAPI[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
}

// ─── List agents for a wallet ───

export async function listAgents(_walletAddress: string): Promise<AgentFromAPI[]> {
  return readAgents().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

// ─── Get single agent ───

export async function getAgent(_walletAddress: string, id: string): Promise<AgentFromAPI | null> {
  return readAgents().find((a) => a.id === id) ?? null;
}

// ─── Save (create or update) agent ───

export type SaveAgentResult =
  | { agent: AgentFromAPI }
  | { error: string; hint?: string };

export async function saveAgent(
  _walletAddress: string,
  agent: {
    id?: string;
    name: string;
    description?: string;
    nodes: CanvasBlock[];
    edges: CanvasEdge[];
  }
): Promise<SaveAgentResult> {
  const agents = readAgents();
  const now = new Date().toISOString();

  if (agent.id) {
    const idx = agents.findIndex((a) => a.id === agent.id);
    if (idx !== -1) {
      agents[idx] = {
        ...agents[idx],
        name: agent.name,
        description: agent.description ?? null,
        canvasJson: { nodes: agent.nodes, edges: agent.edges },
        updatedAt: now,
      };
      writeAgents(agents);
      return { agent: agents[idx] };
    }
  }

  const newAgent: AgentFromAPI = {
    id: uuid(),
    name: agent.name,
    description: agent.description ?? null,
    canvasJson: { nodes: agent.nodes, edges: agent.edges },
    status: "draft",
    workerUrl: null,
    walletAddress: null,
    createdAt: now,
    updatedAt: now,
  };
  agents.push(newAgent);
  writeAgents(agents);
  return { agent: newAgent };
}

// ─── Delete agent ───

export async function deleteAgent(_walletAddress: string, id: string): Promise<boolean> {
  const agents = readAgents();
  const filtered = agents.filter((a) => a.id !== id);
  if (filtered.length === agents.length) return false;
  writeAgents(filtered);
  return true;
}

// ─── Duplicate agent ───

export async function duplicateAgent(_walletAddress: string, id: string): Promise<AgentFromAPI | null> {
  const agents = readAgents();
  const original = agents.find((a) => a.id === id);
  if (!original) return null;

  const now = new Date().toISOString();
  const clone: AgentFromAPI = {
    ...original,
    id: uuid(),
    name: `Copy of ${original.name}`,
    status: "draft",
    workerUrl: null,
    createdAt: now,
    updatedAt: now,
    canvasJson: {
      ...original.canvasJson,
      nodes: original.canvasJson.nodes.map((n) => ({ ...n, x: n.x + 20, y: n.y + 20 })),
    },
  };
  agents.push(clone);
  writeAgents(agents);
  return clone;
}

// ─── Deploy agent (server-side Cloudflare deployment) ───

export async function deployAgent(
  walletAddress: string,
  agentId: string,
  skills: number,
  txHash: string
): Promise<{ deployed: boolean; workerUrl?: string; error?: string }> {
  // Send canvas data from localStorage so the server can deploy without a DB
  const agent = readAgents().find((a) => a.id === agentId);
  const res = await fetch("/api/agents/deploy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress,
      agentId,
      agentName: agent?.name || "Untitled Agent",
      skills,
      txHash,
      canvasJson: agent?.canvasJson,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { deployed: false, error: data.error || "Deployment failed" };
  }

  // Update local status
  const agents = readAgents();
  const idx = agents.findIndex((a) => a.id === agentId);
  if (idx !== -1) {
    agents[idx].status = "live";
    agents[idx].workerUrl = data.workerUrl ?? null;
    agents[idx].updatedAt = new Date().toISOString();
    writeAgents(agents);
  }

  return { deployed: true, workerUrl: data.workerUrl };
}

// ─── Get agent wallet balance ───

export async function getAgentBalance(
  walletAddress: string,
  agentId: string
): Promise<{ agentWallet: string; balanceWei: string; balanceFormatted: string }> {
  const res = await fetch(
    `/api/agents/${agentId}/balance?wallet=${encodeURIComponent(walletAddress)}`
  );
  if (!res.ok) throw new Error("Failed to fetch agent balance");
  return res.json();
}

// ─── Execute agent (server-side with agent wallet) ───

export interface ExecuteAgentResult {
  agentId: string;
  agentName: string;
  executedAt: string;
  nodeCount: number;
  results: Record<string, Record<string, unknown>>;
  error?: string;
}

export async function executeAgent(
  walletAddress: string,
  agentId: string,
  input?: Record<string, unknown>
): Promise<ExecuteAgentResult> {
  const res = await fetch(`/api/agents/${agentId}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, input: input || {} }),
  });
  return res.json();
}
