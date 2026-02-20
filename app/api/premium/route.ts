import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    mintToken: "0xe936e65D9F598059579E3Dc74E98514124538398",
    mintNft: "0x1451A67F6527B6B37CFCA506dab9E5Fdcd6b9bd2",
    network: "BSC Testnet (chain 97)",
    message: "Use the Mint page to claim tokens and NFTs directly.",
  });
}
