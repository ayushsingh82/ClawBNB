import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const blockType = url.searchParams.get("type") ?? "unknown";

  return NextResponse.json({
    unlocked: true,
    blockType,
    paidAt: new Date().toISOString(),
  });
}
