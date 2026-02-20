/**
 * local-db.ts — Simple JSON file-based database replacing Prisma/PostgreSQL.
 * Stores all data in data/db.json. API shape mirrors Prisma client so routes
 * require zero changes.
 */
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type AgentStatus = "draft" | "deploying" | "live" | "failed";
export type DeploymentStatus = "pending" | "deploying" | "deployed" | "failed";

export interface User {
  id: string;
  walletAddress: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  canvasJson: unknown;
  metadataUri: string | null;
  status: AgentStatus;
  workerUrl: string | null;
  walletAddress: string | null;
  walletPrivateKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Deployment {
  id: string;
  agentId: string;
  cloudflareWorkerId: string | null;
  deploymentStatus: DeploymentStatus;
  logs: unknown[];
  workerUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface DB {
  users: User[];
  agents: Agent[];
  deployments: Deployment[];
}

// On Vercel the project dir is read-only; use /tmp for persistence within a lambda.
const IS_VERCEL = !!process.env.VERCEL;
const DATA_DIR = IS_VERCEL ? "/tmp" : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function readDB(): DB {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
      const empty: DB = { users: [], agents: [], deployments: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(empty, null, 2));
      return empty;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as DB;
  } catch {
    return { users: [], agents: [], deployments: [] };
  }
}

function writeDB(data: DB): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const now = () => new Date().toISOString();

type OrderBy = Record<string, "asc" | "desc">;

function sortBy<T>(arr: T[], orderBy?: OrderBy): T[] {
  if (!orderBy) return arr;
  const [key, dir] = Object.entries(orderBy)[0];
  return [...arr].sort((a, b) => {
    const av = (a as Record<string, string>)[key] ?? "";
    const bv = (b as Record<string, string>)[key] ?? "";
    return dir === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
  });
}

// ── user ──────────────────────────────────────────────────────────────────────

type DeploymentsInclude =
  | boolean
  | { orderBy?: OrderBy; take?: number };

type AgentsInclude =
  | boolean
  | {
      orderBy?: OrderBy;
      include?: { deployments?: DeploymentsInclude };
    };

interface UserFindUniqueArgs {
  where: { walletAddress?: string; id?: string };
  include?: { agents?: AgentsInclude };
}

const userOps = {
  findUnique(args: UserFindUniqueArgs) {
    const db = readDB();
    const u = args.where.walletAddress
      ? db.users.find((x) => x.walletAddress === args.where.walletAddress)
      : args.where.id
        ? db.users.find((x) => x.id === args.where.id)
        : undefined;
    if (!u) return null;
    if (!args.include?.agents) return u;

    const agentsOpts = args.include.agents;
    const agentOb =
      typeof agentsOpts === "object" && !Array.isArray(agentsOpts)
        ? agentsOpts.orderBy
        : undefined;
    const deploymentsOpts =
      typeof agentsOpts === "object" && !Array.isArray(agentsOpts)
        ? agentsOpts.include?.deployments
        : undefined;

    let agents = db.agents.filter((a) => a.userId === u.id);
    agents = sortBy(agents, agentOb) as Agent[];

    const agentsWithDeploys = agents.map((a) => {
      if (!deploymentsOpts) return a;
      const depOb =
        typeof deploymentsOpts === "object" ? deploymentsOpts.orderBy : undefined;
      const take =
        typeof deploymentsOpts === "object"
          ? (deploymentsOpts.take ?? Infinity)
          : Infinity;
      let deps = db.deployments.filter((d) => d.agentId === a.id);
      deps = sortBy(deps, depOb) as Deployment[];
      return { ...a, deployments: deps.slice(0, take) };
    });

    return { ...u, agents: agentsWithDeploys };
  },

  upsert(args: {
    where: { walletAddress: string };
    update: object;
    create: { walletAddress: string };
  }): User {
    const db = readDB();
    let u = db.users.find((x) => x.walletAddress === args.where.walletAddress);
    if (!u) {
      u = {
        id: randomUUID(),
        walletAddress: args.create.walletAddress,
        createdAt: now(),
      };
      db.users.push(u);
      writeDB(db);
    }
    return u;
  },
};

// ── agent ─────────────────────────────────────────────────────────────────────

interface AgentFindFirstArgs {
  where: { id: string; userId?: string };
  include?: {
    deployments?: DeploymentsInclude;
    user?: boolean;
  };
}

const agentOps = {
  findFirst(args: AgentFindFirstArgs) {
    const db = readDB();
    const a = db.agents.find((x) => {
      if (x.id !== args.where.id) return false;
      if (args.where.userId && x.userId !== args.where.userId) return false;
      return true;
    });
    if (!a) return null;

    const result: Agent & { deployments?: Deployment[]; user?: User } = { ...a };

    if (args.include?.deployments) {
      const depOpts = args.include.deployments;
      const depOb =
        typeof depOpts === "object" ? depOpts.orderBy : undefined;
      const take =
        typeof depOpts === "object" ? (depOpts.take ?? Infinity) : Infinity;
      let deps = db.deployments.filter((d) => d.agentId === a.id);
      deps = sortBy(deps, depOb) as Deployment[];
      result.deployments = deps.slice(0, take);
    }

    if (args.include?.user) {
      result.user = db.users.find((u) => u.id === a.userId);
    }

    return result;
  },

  create(args: {
    data: Omit<Agent, "id" | "createdAt" | "updatedAt">;
  }): Agent {
    const db = readDB();
    const a: Agent = {
      ...args.data,
      id: randomUUID(),
      createdAt: now(),
      updatedAt: now(),
    };
    db.agents.push(a);
    writeDB(db);
    return a;
  },

  update(args: {
    where: { id: string };
    data: Partial<Omit<Agent, "id" | "createdAt">>;
  }): Agent {
    const db = readDB();
    const idx = db.agents.findIndex((a) => a.id === args.where.id);
    if (idx === -1) throw new Error(`Agent ${args.where.id} not found`);
    db.agents[idx] = { ...db.agents[idx], ...args.data, updatedAt: now() };
    writeDB(db);
    return db.agents[idx];
  },

  delete(args: { where: { id: string } }): Agent {
    const db = readDB();
    const idx = db.agents.findIndex((a) => a.id === args.where.id);
    if (idx === -1) throw new Error(`Agent ${args.where.id} not found`);
    const [deleted] = db.agents.splice(idx, 1);
    db.deployments = db.deployments.filter((d) => d.agentId !== args.where.id);
    writeDB(db);
    return deleted;
  },
};

// ── deployment ────────────────────────────────────────────────────────────────

const deploymentOps = {
  create(args: {
    data: {
      agentId: string;
      deploymentStatus: DeploymentStatus;
      logs: unknown[];
    };
  }): Deployment {
    const db = readDB();
    const d: Deployment = {
      id: randomUUID(),
      agentId: args.data.agentId,
      cloudflareWorkerId: null,
      deploymentStatus: args.data.deploymentStatus,
      logs: args.data.logs,
      workerUrl: null,
      errorMessage: null,
      createdAt: now(),
    };
    db.deployments.push(d);
    writeDB(db);
    return d;
  },

  update(args: {
    where: { id: string };
    data: Partial<Omit<Deployment, "id" | "agentId" | "createdAt">>;
  }): Deployment {
    const db = readDB();
    const idx = db.deployments.findIndex((d) => d.id === args.where.id);
    if (idx === -1) throw new Error(`Deployment ${args.where.id} not found`);
    db.deployments[idx] = { ...db.deployments[idx], ...args.data };
    writeDB(db);
    return db.deployments[idx];
  },
};

// ── export ────────────────────────────────────────────────────────────────────

const localDb = {
  user: userOps,
  agent: agentOps,
  deployment: deploymentOps,
};

export default localDb;
