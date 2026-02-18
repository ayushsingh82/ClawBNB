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
} from "../../../../lib/x402-config";
import prisma from "@/lib/server/db";
import { DeploymentRunner } from "@/lib/server/services/deploymentRunner";

const BSC_NETWORK_LOCAL: Network = NETWORK;

/** Fallback so payment always has a pay-to address even if env/config fails to load */
const DEPLOY_PAY_TO_DEFAULT = "0xB822B51A88E8a03fCe0220B15Cb2C662E42Adec1";

function getPayToAddress(): string {
  const fromEnv = (typeof process.env.PAY_TO_ADDRESS === "string" && process.env.PAY_TO_ADDRESS.trim()) || "";
  return fromEnv || DEPLOY_PAY_TO_DEFAULT;
}

/** Wraps HTTPFacilitatorClient to log verify/settle for debugging */
function createLoggingFacilitator() {
  const inner = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
  return new Proxy(inner, {
    get(target, prop, receiver) {
      const val = Reflect.get(target, prop, receiver);
      if (prop === "verify" && typeof val === "function") {
        return async (...args: Parameters<typeof inner.verify>) => {
          console.log("[x402] → facilitator.verify()", FACILITATOR_URL);
          const result = await val.apply(target, args);
          console.log("[x402] ← verify result:", JSON.stringify(result, null, 2));
          return result;
        };
      }
      if (prop === "settle" && typeof val === "function") {
        return async (...args: Parameters<typeof inner.settle>) => {
          console.log("[x402] → facilitator.settle()", FACILITATOR_URL);
          const result = await val.apply(target, args);
          console.log("[x402] ← settle result:", JSON.stringify(result, null, 2));
          if (result.success && result.transaction) {
            console.log("[x402] ✓ Settlement tx:", result.transaction);
          } else if (result.success) {
            console.warn("[x402] ⚠ Settlement success=true but NO transaction hash — USDC may not have been transferred");
          }
          return result;
        };
      }
      return val;
    },
  });
}

function getServer() {
  const facilitatorClient = createLoggingFacilitator();
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

const deploymentRunner = new DeploymentRunner();

/**
 * POST /api/agents/deploy
 * Body: { agentId, walletAddress, skills }
 *
 * GET /api/agents/deploy?skills=N  (x402 payment — pay before save/deploy)
 */
export async function POST(request: NextRequest) {
  const PAY_TO = getPayToAddress();

  const body = await request.json();
  const { agentId, walletAddress, skills } = body;

  if (!agentId || !walletAddress) {
    return NextResponse.json(
      { error: "agentId and walletAddress are required" },
      { status: 400 }
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
    deployedAt: new Date().toISOString(),
  });
}

/**
 * GET /api/agents/deploy?skills=N
 * x402 payment endpoint — pay here before save/deploy
 */
export async function GET(request: NextRequest) {
  const PAY_TO = getPayToAddress();

  const url = new URL(request.url);
  const skillCount = Math.max(
    1,
    parseInt(url.searchParams.get("skills") ?? "1", 10)
  );
  const totalPrice = (skillCount * parseFloat(FEATURE_PRICE_USDC)).toFixed(3);

  const routeConfig: RouteConfig = {
    accepts: {
      scheme: "exact",
      network: BSC_NETWORK_LOCAL,
      payTo: PAY_TO,
      price: `$${totalPrice}`,
    },
    resource: request.url,
  };

  const handler = async () =>
    NextResponse.json({
      deployed: true,
      skillCount,
      totalPaid: totalPrice,
      deployedAt: new Date().toISOString(),
    });

  try {
    const wrapped = withX402(handler, routeConfig, getServer());
    return await wrapped(request);
  } catch (err) {
    console.error("[GET /api/agents/deploy] x402 error:", err);
    return NextResponse.json(
      { error: "Payment endpoint error. Check server logs." },
      { status: 500 }
    );
  }
}
