#!/usr/bin/env node
/**
 * Compile & deploy ClawToken + ClawNFT to BSC Testnet.
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... node scripts/deploy-contracts.mjs
 *
 * Or add DEPLOYER_PRIVATE_KEY to .env first, then:
 *   node -e "require('dotenv').config()" scripts/deploy-contracts.mjs
 */

import { createRequire } from "module";
import { readFileSync } from "fs";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";

const require = createRequire(import.meta.url);

// ─── Load .env ───
try {
  const dotenv = require("dotenv");
  dotenv.config();
} catch {
  // dotenv not installed, rely on env vars
}

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error("ERROR: Set DEPLOYER_PRIVATE_KEY in .env or env vars");
  console.error("  DEPLOYER_PRIVATE_KEY=0x... node scripts/deploy-contracts.mjs");
  process.exit(1);
}

// ─── Compile ───
function compile(fileName) {
  const solc = require("solc");
  const source = readFileSync(
    new URL(`../contracts/${fileName}`, import.meta.url),
    "utf8"
  );

  const input = {
    language: "Solidity",
    sources: { [fileName]: { content: source } },
    settings: {
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
      optimizer: { enabled: true, runs: 200 },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const fatal = output.errors.filter((e) => e.severity === "error");
    if (fatal.length) {
      console.error("Compilation errors:");
      fatal.forEach((e) => console.error(e.formattedMessage));
      process.exit(1);
    }
  }

  const contractName = Object.keys(output.contracts[fileName])[0];
  const contract = output.contracts[fileName][contractName];
  return {
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
  };
}

// ─── Deploy ───
async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log(`Deployer: ${account.address}`);

  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(
    `Balance: ${(Number(balance) / 1e18).toFixed(4)} tBNB`
  );
  if (balance === 0n) {
    console.error("ERROR: Deployer has 0 tBNB. Fund it first via faucet.");
    process.exit(1);
  }

  // Compile contracts
  console.log("\nCompiling ClawToken.sol ...");
  const token = compile("ClawToken.sol");
  console.log("Compiling ClawNFT.sol ...");
  const nft = compile("ClawNFT.sol");

  // Deploy ClawToken
  console.log("\nDeploying ClawToken ...");
  const tokenHash = await walletClient.deployContract({
    abi: token.abi,
    bytecode: token.bytecode,
  });
  console.log(`  tx: ${tokenHash}`);
  const tokenReceipt = await publicClient.waitForTransactionReceipt({
    hash: tokenHash,
  });
  console.log(`  ClawToken deployed at: ${tokenReceipt.contractAddress}`);

  // Deploy ClawNFT
  console.log("\nDeploying ClawNFT ...");
  const nftHash = await walletClient.deployContract({
    abi: nft.abi,
    bytecode: nft.bytecode,
  });
  console.log(`  tx: ${nftHash}`);
  const nftReceipt = await publicClient.waitForTransactionReceipt({
    hash: nftHash,
  });
  console.log(`  ClawNFT deployed at: ${nftReceipt.contractAddress}`);

  // Summary
  console.log("\n════════════════════════════════════════════");
  console.log("UPDATE these addresses in lib/server/services/agentWallet.ts:");
  console.log(`  MINT_TOKEN_ADDRESS = "${tokenReceipt.contractAddress}"`);
  console.log(`  MINT_NFT_ADDRESS   = "${nftReceipt.contractAddress}"`);
  console.log("════════════════════════════════════════════\n");

  // Also update agentFactory.ts worker template
  console.log("Also update in lib/server/services/agentFactory.ts:");
  console.log(`  MINT_TOKEN_ADDRESS = "${tokenReceipt.contractAddress}"`);
  console.log(`  MINT_NFT_ADDRESS   = "${nftReceipt.contractAddress}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
