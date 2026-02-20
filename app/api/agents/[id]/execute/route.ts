import { NextRequest, NextResponse } from "next/server";
import { skillExecutors } from "@/lib/server/services/skillExecutors";
import type { ExecutionContext } from "@/lib/server/types/skillExecutor";

interface CanvasNode {
  id: string;
  type: string;
  label: string;
  config?: Record<string, string>;
}

/**
 * POST /api/agents/[id]/execute
 * Server-side execution using the agent's own wallet for signing.
 * Body: { walletAddress, agentName, canvasJson, agentWalletAddress, agentPrivateKey, input? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { walletAddress, agentName, canvasJson, agentWalletAddress, agentPrivateKey, input } = body;

  if (!walletAddress) {
    return NextResponse.json({ error: "walletAddress required" }, { status: 400 });
  }

  const nodes: CanvasNode[] = (canvasJson?.nodes ?? []).filter(
    (n: CanvasNode) => n.type !== "agent_center"
  );

  if (nodes.length === 0) {
    return NextResponse.json({ error: "Agent has no skill nodes" }, { status: 400 });
  }

  const context: ExecutionContext = {
    input: {
      walletAddress,
      agentWalletAddress: agentWalletAddress || undefined,
      agentPrivateKey: agentPrivateKey || undefined,
      ...(input || {}),
    },
    results: {},
    agentId: id,
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
    agentId: id,
    agentName: agentName || "Agent",
    executedAt: new Date().toISOString(),
    nodeCount: nodes.length,
    results,
  });
}
