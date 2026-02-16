import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/server/db";
import { generateAgentWallet } from "@/lib/server/services/agentWallet";

// POST /api/agents/[id]/duplicate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { walletAddress } = body;

  if (!walletAddress) {
    return NextResponse.json(
      { error: "walletAddress required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { walletAddress: walletAddress.toLowerCase() },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const original = await prisma.agent.findFirst({
    where: { id, userId: user.id },
  });
  if (!original) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const canvasJson = original.canvasJson as {
    nodes?: Array<{ x: number; y: number; [key: string]: unknown }>;
    [key: string]: unknown;
  };

  // Offset node positions in the clone
  const clonedCanvas = {
    ...canvasJson,
    nodes: (canvasJson.nodes || []).map(
      (n: { x: number; y: number; [key: string]: unknown }) => ({
        ...n,
        x: n.x + 20,
        y: n.y + 20,
      })
    ),
  };

  const wallet = generateAgentWallet();
  const duplicate = await prisma.agent.create({
    data: {
      userId: user.id,
      name: `Copy of ${original.name}`,
      description: original.description,
      canvasJson: clonedCanvas,
      status: "draft",
      walletAddress: wallet.address,
      walletPrivateKey: wallet.privateKey,
    },
  });

  const { walletPrivateKey: _, ...safeDuplicate } = duplicate;
  return NextResponse.json({ agent: safeDuplicate }, { status: 201 });
}
