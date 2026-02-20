import { NextRequest, NextResponse } from "next/server";
import { getAgentBalance } from "@/lib/server/services/agentWallet";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  const agentWallet = request.nextUrl.searchParams.get("agentWallet");
  if (!agentWallet) {
    return NextResponse.json({ error: "agentWallet query param required" }, { status: 400 });
  }

  try {
    const balance = await getAgentBalance(agentWallet);
    return NextResponse.json({
      agentWallet,
      ...balance,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Balance fetch failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }
}
