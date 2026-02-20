import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/server/db";
import { generateAgentWallet } from "@/lib/server/services/agentWallet";

// Strip walletPrivateKey from agent objects before sending to client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripPK(agent: any) {
  const { walletPrivateKey: _, ...safe } = agent;
  return safe;
}

// GET /api/agents?wallet=0x...
// List all agents for a wallet address
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json(
      { error: "wallet query parameter required" },
      { status: 400 }
    );
  }

  const normalizedWallet = wallet.toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedWallet },
      include: {
        agents: {
          orderBy: { updatedAt: "desc" },
          include: {
            deployments: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ agents: [] });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ agents: (user as any).agents.map(stripPK) });
  } catch (err) {
    console.error("[GET /api/agents]", err);
    return NextResponse.json(
      { error: "Failed to load agents. Check DATABASE_URL and run: npx prisma generate && npx prisma migrate deploy" },
      { status: 500 }
    );
  }
}

// POST /api/agents
// Create or update an agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, name, description, canvasJson, agentId } = body;

    if (!walletAddress || !name || !canvasJson) {
      return NextResponse.json(
        { error: "walletAddress, name, and canvasJson are required" },
        { status: 400 }
      );
    }

    const normalizedWallet = walletAddress.toLowerCase();

    // Upsert user
    const user = await prisma.user.upsert({
      where: { walletAddress: normalizedWallet },
      update: {},
      create: { walletAddress: normalizedWallet },
    });

    // Update existing agent
    if (agentId) {
      const existing = await prisma.agent.findFirst({
        where: { id: agentId, userId: user.id },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "Agent not found" },
          { status: 404 }
        );
      }

      const updated = await prisma.agent.update({
        where: { id: agentId },
        data: {
          name,
          description: description || null,
          canvasJson,
        },
      });

      return NextResponse.json({ agent: stripPK(updated) });
    }

    // Create new agent with its own wallet
    const wallet = generateAgentWallet();
    const agent = await prisma.agent.create({
      data: {
        userId: user.id,
        name,
        description: description || null,
        canvasJson,
        status: "draft",
        walletAddress: wallet.address,
        walletPrivateKey: wallet.privateKey,
        metadataUri: null,
        workerUrl: null,
      },
    });

    return NextResponse.json({ agent: stripPK(agent) }, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/agents]", err);
    const message =
      err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
        ? (err as { message: string }).message
        : "Failed to save agent.";
    const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
    const hint =
      message.includes("reach") || message.includes("connect") || code === "P1001"
        ? "Start your database (e.g. run: npx prisma dev) then try again."
        : "Ensure DATABASE_URL is set and run: npx prisma generate && npx prisma migrate deploy";
    return NextResponse.json(
      { error: message, hint, code },
      { status: 500 }
    );
  }
}
