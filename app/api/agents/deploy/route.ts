import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/server/db";
import { DeploymentRunner } from "@/lib/server/services/deploymentRunner";

const deploymentRunner = new DeploymentRunner();

/**
 * POST /api/agents/deploy
 * Body: { agentId, walletAddress, skills }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { agentId, walletAddress, skills, txHash } = body;

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

  const normalizedWallet = walletAddress.toLowerCase();

  // Look up user
  const user = await prisma.user.findUnique({
    where: { walletAddress: normalizedWallet },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify agent belongs to user
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId: user.id },
  });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Run deployment pipeline
  const result = await deploymentRunner.runDeployment({
    agentId,
    userId: user.id,
  });

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
}
