import { NextRequest, NextResponse } from "next/server";
import { AgentFactoryService } from "@/lib/server/services/agentFactory";

const factory = new AgentFactoryService();

/**
 * POST /api/agents/deploy
 * Body: { agentId, agentName, walletAddress, skills, txHash, canvasJson }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { agentId, agentName, walletAddress, skills, txHash, canvasJson } = body;

  if (!agentId || !walletAddress) {
    return NextResponse.json(
      { error: "agentId and walletAddress are required" },
      { status: 400 }
    );
  }

  if (!txHash) {
    return NextResponse.json(
      { error: "Payment required. txHash is missing." },
      { status: 402 }
    );
  }

  if (!canvasJson?.nodes?.length) {
    return NextResponse.json(
      { error: "Agent has no skill nodes." },
      { status: 400 }
    );
  }

  try {
    const result = await factory.deploy({
      id: agentId,
      name: agentName || "Untitled Agent",
      canvasJson,
    } as any);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      deployed: true,
      agentId,
      workerUrl: result.workerUrl,
      workerId: result.workerId,
      skillCount: skills || 0,
      txHash,
      deployedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Deployment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
