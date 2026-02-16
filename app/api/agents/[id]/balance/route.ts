import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/server/db";
import { getAgentBalance } from "@/lib/server/services/agentWallet";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const wallet = request.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet.toLowerCase() },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const agent = await prisma.agent.findFirst({
    where: { id, userId: user.id },
  });
  if (!agent || !agent.walletAddress) {
    return NextResponse.json(
      { error: "Agent wallet not found" },
      { status: 404 }
    );
  }

  try {
    const balance = await getAgentBalance(agent.walletAddress);
    return NextResponse.json({
      agentWallet: agent.walletAddress,
      ...balance,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Balance fetch failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }
}
