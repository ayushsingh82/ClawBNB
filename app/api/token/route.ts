import { NextResponse } from "next/server";
import { TOKEN_ADDRESS, NADFUN_API_URL } from "@/constants";

const HEADERS = {
  Origin: "https://nad.fun",
  Referer: "https://nad.fun/",
  Accept: "application/json",
  "Content-Type": "application/json",
};

// ─── Types ───

interface MarketInfo {
  market_type: string;
  token_price: string;
  price_usd: string;
  price_native: string;
  native_price: string;
  reserve_native: string;
  reserve_token: string;
  total_supply: string;
  volume: string;
  ath_price_usd: string;
  holder_count: number;
}

interface MetricTimeframe {
  timeframe: string;
  percent: number;
  transactions: { buy: number; sell: number; total: number };
  volume: { buy: string; sell: string; total: string };
  makers: { buy: number; sell: number; total: number };
}

// ─── Handler ───

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Fetch token info, market, and metrics in parallel (chart has its own route)
    const [tokenInfoRes, marketRes, metricsRes] = await Promise.all([
      fetch(`${NADFUN_API_URL}/token/${TOKEN_ADDRESS}`, {
        headers: HEADERS,
        cache: "no-store",
      }),
      fetch(`${NADFUN_API_URL}/trade/market/${TOKEN_ADDRESS}`, {
        headers: HEADERS,
        cache: "no-store",
      }),
      fetch(
        `${NADFUN_API_URL}/trade/metrics/${TOKEN_ADDRESS}?timeframes=30,60,240,1D`,
        { headers: HEADERS, cache: "no-store" }
      ),
    ]);

    if (!marketRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch market data" },
        { status: 502 }
      );
    }

    // Parse token info
    let image: string | null = null;
    let name: string | null = null;
    let creator: string | null = null;
    if (tokenInfoRes.ok) {
      const tokenInfoData = await tokenInfoRes.json();
      const ti = tokenInfoData.token_info;
      if (ti) {
        image = ti.image_uri || null;
        name = ti.name || null;
        creator = ti.creator?.account_id || null;
      }
    }

    // Parse market data
    const marketData = await marketRes.json();
    const mi: MarketInfo = marketData.market_info;

    const priceUsd = parseFloat(mi.price_usd || "0");
    const priceMon = parseFloat(mi.price_native || "0");
    const nativePrice = parseFloat(mi.native_price || "0");
    const athPriceUsd = parseFloat(mi.ath_price_usd || "0");
    const totalSupply = Number(BigInt(mi.total_supply || "0") / BigInt(10 ** 18));
    const volumeMon = Number(BigInt(mi.volume || "0")) / 1e18;
    const volumeUsd = volumeMon * nativePrice;
    const fdv = priceUsd * totalSupply;

    // Parse metrics
    let metrics: MetricTimeframe[] = [];
    if (metricsRes.ok) {
      const metricsData = await metricsRes.json();
      metrics = metricsData.metrics || [];
    }

    // Format metrics for frontend
    const timeframes: Record<
      string,
      {
        percent: number;
        txns: number;
        buys: number;
        sells: number;
        volume: string;
        buyVol: string;
        sellVol: string;
        makers: number;
        buyers: number;
        sellers: number;
      }
    > = {};

    for (const m of metrics) {
      const label =
        m.timeframe === "30"
          ? "30M"
          : m.timeframe === "60"
            ? "1H"
            : m.timeframe === "240"
              ? "4H"
              : "24H";
      const totalVol = parseFloat(m.volume.total) * nativePrice;
      const buyVol = parseFloat(m.volume.buy) * nativePrice;
      const sellVol = parseFloat(m.volume.sell) * nativePrice;

      timeframes[label] = {
        percent: m.percent,
        txns: m.transactions.total,
        buys: m.transactions.buy,
        sells: m.transactions.sell,
        volume: `$${totalVol.toFixed(2)}`,
        buyVol: `$${buyVol.toFixed(2)}`,
        sellVol: `$${sellVol.toFixed(2)}`,
        makers: m.makers.total,
        buyers: m.makers.buy,
        sellers: m.makers.sell,
      };
    }

    return NextResponse.json({
      found: true,
      name,
      image,
      creator,
      priceUsd,
      priceMon,
      nativePrice,
      fdv,
      volumeMon,
      volumeUsd,
      holderCount: mi.holder_count,
      athPriceUsd,
      marketType: mi.market_type,
      timeframes,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
