import { NextResponse } from "next/server";
import { TOKEN_ADDRESS, NADFUN_API_URL } from "@/constants";

const HEADERS = {
  Origin: "https://nad.fun",
  Referer: "https://nad.fun/",
  Accept: "application/json",
  "Content-Type": "application/json",
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = Math.floor(Date.now() / 1000);
    const from = now - 86400; // 24h

    const res = await fetch(
      `${NADFUN_API_URL}/trade/chart/${TOKEN_ADDRESS}?resolution=1&from=${from}&to=${now}&countback=500&chart_type=price_usd`,
      { headers: HEADERS, cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Chart fetch failed" }, { status: 502 });
    }

    const data = await res.json();

    if (data.s !== "ok" || !data.t?.length) {
      return NextResponse.json({ chart: [] });
    }

    // price_usd values are already in USD (e.g. 0.0000040868) — no conversion needed
    const chart = data.t.map((t: number, i: number) => ({
      time: t,
      open: parseFloat(data.o[i]),
      high: parseFloat(data.h[i]),
      low: parseFloat(data.l[i]),
      close: parseFloat(data.c[i]),
    }));

    return NextResponse.json({ chart });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
