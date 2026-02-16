import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/server/db";

function stripPK<T extends Record<string, unknown>>(agent: T) {
  const { walletPrivateKey: _, ...safe } = agent;
  return safe;
}

// GET /api/agents/[id]?wallet=0x...
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const wallet = request.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json(
      { error: "wallet query parameter required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet.toLowerCase() },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const agent = await prisma.agent.findFirst({
    where: { id, userId: user.id },
    include: {
      deployments: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json({ agent: stripPK(agent) });
}

// DELETE /api/agents/[id]
export async function DELETE(
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

  const agent = await prisma.agent.findFirst({
    where: { id, userId: user.id },
  });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  await prisma.agent.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}

// PATCH /api/agents/[id]
// Partial update (name, description, canvasJson, status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { walletAddress, ...updates } = body;

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

  const agent = await prisma.agent.findFirst({
    where: { id, userId: user.id },
  });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Only allow safe fields to be updated
  const allowed: Record<string, unknown> = {};
  if (updates.name !== undefined) allowed.name = updates.name;
  if (updates.description !== undefined)
    allowed.description = updates.description;
  if (updates.canvasJson !== undefined) allowed.canvasJson = updates.canvasJson;

  const updated = await prisma.agent.update({
    where: { id },
    data: allowed,
  });

  return NextResponse.json({ agent: stripPK(updated) });
}
