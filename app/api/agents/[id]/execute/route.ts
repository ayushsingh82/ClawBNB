import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/server/db";
import { skillExecutors } from "@/lib/server/services/skillExecutors";
import type { ExecutionContext } from "@/lib/server/types/skillExecutor";

interface CanvasNode {
  id: string;
  type: string;
  label: string;
  config?: Record<string, string>;
}

interface CanvasJson {
  nodes: CanvasNode[];
  edges: Array<{ source: string; target: string }>;
}

/**
 * POST /api/agents/[id]/execute
 * Server-side execution using the agent's own wallet for signing.
 * Body: { walletAddress: string, input?: Record<string, unknown> }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { walletAddress, input } = body;

  if (!walletAddress) {
    return NextResponse.json({ error: "walletAddress required" }, { status: 400 });
  }

  const normalizedWallet = walletAddress.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { walletAddress: normalizedWallet },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const agent = await prisma.agent.findFirst({
    where: { id, userId: user.id },
  });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const canvas = agent.canvasJson as unknown as CanvasJson;
  const nodes = canvas?.nodes?.filter((n) => n.type !== "agent_center") ?? [];

  if (nodes.length === 0) {
    return NextResponse.json({ error: "Agent has no skill nodes" }, { status: 400 });
  }

  // Build execution context — private key stays server-side only
  const context: ExecutionContext = {
    input: {
      walletAddress,
      agentWalletAddress: agent.walletAddress || undefined,
      agentPrivateKey: agent.walletPrivateKey || undefined,
      ...(input || {}),
    },
    results: {},
    agentId: agent.id,
  };

  const results: Record<string, unknown> = {};

  for (const node of nodes) {
    const executor = skillExecutors[node.type];
    if (!executor) {
      results[node.id] = { error: `No executor for skill type: ${node.type}` };
      continue;
    }
    try {
      results[node.id] = await executor(node.config || {}, {
        ...context,
        results,
      });
    } catch (err) {
      results[node.id] = { error: String(err) };
    }
  }

  return NextResponse.json({
    agentId: agent.id,
    agentName: agent.name,
    executedAt: new Date().toISOString(),
    nodeCount: nodes.length,
    results,
  });
}
