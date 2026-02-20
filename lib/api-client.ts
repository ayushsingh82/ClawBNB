// API client — localStorage-backed agent storage, server API only for deploy/execute

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

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
  walletPrivateKey?: string | null;
  createdAt: string;
  updatedAt: string;
  deployments?: Array<{
    id: string;
    deploymentStatus: string;
    workerUrl: string | null;
    createdAt: string;
  }>;
}

function createAgentWallet(): { address: string; privateKey: string } {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return { address: account.address, privateKey };
}

// ─── AES-GCM encryption (keyed per agent ID) ───

async function deriveKey(agentId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(agentId), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("clawbnb-agent-salt"), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptPK(agentId: string, plaintext: string): Promise<string> {
  const key = await deriveKey(agentId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  // Store as iv:ciphertext in base64
  const combined = new Uint8Array(iv.length + new Uint8Array(ct).length);
  combined.set(iv);
  combined.set(new Uint8Array(ct), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptPK(agentId: string, encrypted: string): Promise<string> {
  const key = await deriveKey(agentId);
  const data = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
  const iv = data.slice(0, 12);
  const ct = data.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(plain);
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

  const wallet = createAgentWallet();
  const agentId = uuid();
  const encryptedKey = await encryptPK(agentId, wallet.privateKey);
  const newAgent: AgentFromAPI = {
    id: agentId,
    name: agent.name,
    description: agent.description ?? null,
    canvasJson: { nodes: agent.nodes, edges: agent.edges },
    status: "draft",
    workerUrl: null,
    walletAddress: wallet.address,
    walletPrivateKey: encryptedKey,
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
  const cloneWallet = createAgentWallet();
  const cloneId = uuid();
  const encryptedCloneKey = await encryptPK(cloneId, cloneWallet.privateKey);
  const clone: AgentFromAPI = {
    ...original,
    id: cloneId,
    name: `Copy of ${original.name}`,
    status: "draft",
    workerUrl: null,
    walletAddress: cloneWallet.address,
    walletPrivateKey: encryptedCloneKey,
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
  agentName: string,
  skills: number,
  txHash: string,
  canvasJson: { nodes: CanvasBlock[]; edges: CanvasEdge[] }
): Promise<{ deployed: boolean; workerUrl?: string; error?: string }> {
const res = await fetch("/api/agents/deploy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress,
      agentId,
      agentName,
      skills,
      txHash,
      canvasJson,
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
  _walletAddress: string,
  agentId: string
): Promise<{ agentWallet: string; balanceWei: string; balanceFormatted: string }> {
  const agent = readAgents().find((a) => a.id === agentId);
  if (!agent?.walletAddress) throw new Error("Agent wallet not found");
  const res = await fetch(
    `/api/agents/${agentId}/balance?agentWallet=${encodeURIComponent(agent.walletAddress)}`
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
  const agent = readAgents().find((a) => a.id === agentId);

  // Decrypt the private key before sending to server
  let decryptedKey: string | undefined;
  if (agent?.walletPrivateKey && agent.id) {
    try {
      decryptedKey = await decryptPK(agent.id, agent.walletPrivateKey);
    } catch {
      decryptedKey = undefined;
    }
  }

const res = await fetch(`/api/agents/${agentId}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress,
      agentName: agent?.name,
      canvasJson: agent?.canvasJson,
      agentWalletAddress: agent?.walletAddress,
      agentPrivateKey: decryptedKey,
      input: input || {},
    }),
  });
  return res.json();
}
