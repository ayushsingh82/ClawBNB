import { NextRequest, NextResponse } from "next/server";
import { withX402, type RouteConfig } from "@x402/next";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import type { Network } from "@x402/core/types";
import {
  BSC_NETWORK as NETWORK,
  BSC_USDC_TESTNET,
  FACILITATOR_URL,
  FEATURE_PRICE_USDC,
} from "../../../402/x402-config";

const BSC_NETWORK_LOCAL: Network = NETWORK;

function getServer() {
  const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
  const server = new x402ResourceServer(facilitatorClient);
  const bscScheme = new ExactEvmScheme();
  bscScheme.registerMoneyParser(async (amount: number, network: string) => {
    if (network === BSC_NETWORK_LOCAL) {
      const tokenAmount = Math.floor(amount * 1_000_000).toString();
      return {
        amount: tokenAmount,
        asset: BSC_USDC_TESTNET,
        extra: { name: "USDC", version: "2" },
      };
    }
    return null;
  });
  server.register(BSC_NETWORK_LOCAL, bscScheme);
  return server;
}

async function handler(request: NextRequest) {
  const url = new URL(request.url);
  const blockType = url.searchParams.get("type") ?? "unknown";
  return NextResponse.json({
    unlocked: true,
    blockType,
    price: FEATURE_PRICE_USDC,
    paidAt: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  const PAY_TO = process.env.PAY_TO_ADDRESS;
  if (!PAY_TO) {
    return NextResponse.json({ error: "PAY_TO_ADDRESS not configured" }, { status: 500 });
  }

  const routeConfig: RouteConfig = {
    accepts: {
      scheme: "exact",
      network: BSC_NETWORK_LOCAL,
      payTo: PAY_TO,
      price: `$${FEATURE_PRICE_USDC}`,
    },
    resource: request.url,
  };

  const wrapped = withX402(handler, routeConfig, getServer());
  return wrapped(request);
}
