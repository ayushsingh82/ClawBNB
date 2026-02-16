// Agent storage layer — localStorage persistence keyed by wallet address

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

export type AgentStatus = "draft" | "deployed";

export interface SavedAgent {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  ownerAddress: string;
  nodes: CanvasBlock[];
  edges: CanvasEdge[];
  status: AgentStatus;
}

function getStorageKey(ownerAddress: string): string {
  return `agentclaw_agents_${ownerAddress.toLowerCase()}`;
}

function getAllAgentsRaw(ownerAddress: string): SavedAgent[] {
  try {
    const raw = localStorage.getItem(getStorageKey(ownerAddress));
    if (!raw) return [];
    return JSON.parse(raw) as SavedAgent[];
  } catch {
    return [];
  }
}

function writeAgents(ownerAddress: string, agents: SavedAgent[]): void {
  localStorage.setItem(getStorageKey(ownerAddress), JSON.stringify(agents));
}

export function listAgents(ownerAddress: string): SavedAgent[] {
  return getAllAgentsRaw(ownerAddress).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getAgent(ownerAddress: string, id: string): SavedAgent | null {
  return getAllAgentsRaw(ownerAddress).find((a) => a.id === id) ?? null;
}

export function saveAgent(
  ownerAddress: string,
  agent: Omit<SavedAgent, "id" | "createdAt" | "updatedAt" | "ownerAddress"> & {
    id?: string;
  }
): SavedAgent {
  const agents = getAllAgentsRaw(ownerAddress);
  const now = new Date().toISOString();
  const normalizedOwner = ownerAddress.toLowerCase();

  if (agent.id) {
    const idx = agents.findIndex((a) => a.id === agent.id);
    if (idx !== -1) {
      const updated: SavedAgent = {
        ...agents[idx],
        name: agent.name,
        nodes: agent.nodes,
        edges: agent.edges,
        status: agent.status,
        updatedAt: now,
      };
      agents[idx] = updated;
      writeAgents(ownerAddress, agents);
      return updated;
    }
  }

  const newAgent: SavedAgent = {
    id: crypto.randomUUID(),
    name: agent.name,
    createdAt: now,
    updatedAt: now,
    ownerAddress: normalizedOwner,
    nodes: agent.nodes,
    edges: agent.edges,
    status: agent.status,
  };
  agents.push(newAgent);
  writeAgents(ownerAddress, agents);
  return newAgent;
}

export function deleteAgent(ownerAddress: string, id: string): boolean {
  const agents = getAllAgentsRaw(ownerAddress);
  const filtered = agents.filter((a) => a.id !== id);
  if (filtered.length === agents.length) return false;
  writeAgents(ownerAddress, filtered);
  return true;
}

export function duplicateAgent(
  ownerAddress: string,
  id: string
): SavedAgent | null {
  const original = getAgent(ownerAddress, id);
  if (!original) return null;
  const now = new Date().toISOString();
  const dup: SavedAgent = {
    id: crypto.randomUUID(),
    name: `Copy of ${original.name}`,
    createdAt: now,
    updatedAt: now,
    ownerAddress: original.ownerAddress,
    nodes: original.nodes.map((n) => ({ ...n, x: n.x + 20, y: n.y + 20 })),
    edges: original.edges.map((e) => ({ ...e })),
    status: "draft",
  };
  const agents = getAllAgentsRaw(ownerAddress);
  agents.push(dup);
  writeAgents(ownerAddress, agents);
  return dup;
}
