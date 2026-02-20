import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  createWalletClient,
  createPublicClient,
  http,
  encodeFunctionData,
  formatEther,
  type Hex,
} from "viem";
import { bscTestnet } from "@/lib/chains";

// ─── Contract Addresses ───
const MINT_TOKEN_ADDRESS = "0xc4f63b829d293ee58c5428824b3f648796364ec2" as `0x${string}`;
const MINT_NFT_ADDRESS = "0x79882f10a1d44bfe011969dba54ab288050b269d" as `0x${string}`;

// ─── Inline ABIs (just the mint functions we need) ───
const mintTokenAbi = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const mintNftAbi = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "metadataUri", type: "string" },
    ],
    name: "mint",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ─── Wallet Generation ───

export interface AgentWallet {
  address: string;
  privateKey: Hex;
}

export function generateAgentWallet(): AgentWallet {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return {
    address: account.address,
    privateKey,
  };
}

// ─── Balance ───

function getPublicClient() {
  return createPublicClient({
    chain: bscTestnet,
    transport: http(),
  });
}

export async function getAgentBalance(address: string): Promise<{
  balanceWei: string;
  balanceFormatted: string;
}> {
  const client = getPublicClient();
  const balance = await client.getBalance({
    address: address as `0x${string}`,
  });
  return {
    balanceWei: balance.toString(),
    balanceFormatted: formatEther(balance),
  };
}

// ─── Transaction Helpers ───

function getWalletClient(privateKey: Hex) {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(),
  });
}

// ─── Mint Token ───

export async function mintToken(
  privateKey: Hex,
  recipient: string,
  amount: bigint
): Promise<{ txHash: string; status: string }> {
  const walletClient = getWalletClient(privateKey);
  const publicClient = getPublicClient();

  const data = encodeFunctionData({
    abi: mintTokenAbi,
    functionName: "mint",
    args: [recipient as `0x${string}`, amount],
  });

  const hash = await walletClient.sendTransaction({
    to: MINT_TOKEN_ADDRESS,
    data,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return {
    txHash: hash,
    status: receipt.status === "success" ? "confirmed" : "reverted",
  };
}

// ─── Mint NFT ───

export async function mintNft(
  privateKey: Hex,
  recipient: string,
  metadataUri: string
): Promise<{ txHash: string; tokenId?: string; status: string }> {
  const walletClient = getWalletClient(privateKey);
  const publicClient = getPublicClient();

  const data = encodeFunctionData({
    abi: mintNftAbi,
    functionName: "mint",
    args: [recipient as `0x${string}`, metadataUri],
  });

  const hash = await walletClient.sendTransaction({
    to: MINT_NFT_ADDRESS,
    data,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Parse tokenId from Transfer event (topic[3] for ERC721 Transfer)
  let tokenId: string | undefined;
  for (const log of receipt.logs) {
    if (log.topics.length >= 4 && log.topics[3]) {
      tokenId = BigInt(log.topics[3]).toString();
      break;
    }
  }

  return {
    txHash: hash,
    tokenId,
    status: receipt.status === "success" ? "confirmed" : "reverted",
  };
}
