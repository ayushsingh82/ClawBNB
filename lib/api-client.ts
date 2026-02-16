// API client — replaces localStorage agent-storage with server-backed persistence

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

// ─── List agents for a wallet ───

export async function listAgents(walletAddress: string): Promise<AgentFromAPI[]> {
  const res = await fetch(`/api/agents?wallet=${encodeURIComponent(walletAddress)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.agents ?? [];
}

// ─── Get single agent ───

export async function getAgent(walletAddress: string, id: string): Promise<AgentFromAPI | null> {
  const res = await fetch(`/api/agents/${id}?wallet=${encodeURIComponent(walletAddress)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.agent ?? null;
}

// ─── Save (create or update) agent ───

export type SaveAgentResult =
  | { agent: AgentFromAPI }
  | { error: string; hint?: string };

export async function saveAgent(
  walletAddress: string,
  agent: {
    id?: string;
    name: string;
    description?: string;
    nodes: CanvasBlock[];
    edges: CanvasEdge[];
  }
): Promise<SaveAgentResult> {
  const res = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress,
      agentId: agent.id,
      name: agent.name,
      description: agent.description ?? null,
      canvasJson: { nodes: agent.nodes, edges: agent.edges },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      error: data.error ?? "Failed to save agent",
      hint: data.hint,
    };
  }
  const saved = data.agent ?? null;
  if (!saved) return { error: "No agent returned", hint: "Check server logs." };
  return { agent: saved };
}

// ─── Delete agent ───

export async function deleteAgent(walletAddress: string, id: string): Promise<boolean> {
  const res = await fetch(`/api/agents/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.deleted === true;
}

// ─── Duplicate agent ───

export async function duplicateAgent(walletAddress: string, id: string): Promise<AgentFromAPI | null> {
  const res = await fetch(`/api/agents/${id}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.agent ?? null;
}

// ─── Deploy agent (triggers real deployment pipeline) ───

export async function deployAgent(
  walletAddress: string,
  agentId: string,
  skills: number
): Promise<{ deployed: boolean; workerUrl?: string; error?: string }> {
  const res = await fetch("/api/agents/deploy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, agentId, skills }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { deployed: false, error: data.error || "Deployment failed" };
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
