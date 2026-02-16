// Not deployed on Monad Testnet yet – use 0x until contract is live
export const NFT_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

// Full ABI from deployed contract (mint + read: getAllRecords, getRecord, totalSupply, etc.)
export const MOLTBOOK_IDENTITY_NFT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "name_", type: "string" },
      { internalType: "string", name: "symbol_", type: "string" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "string", name: "uri", type: "string" },
      { internalType: "string", name: "profileId", type: "string" },
      { internalType: "string", name: "profileType", type: "string" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "fromIndex", type: "uint256" },
      { internalType: "uint256", name: "limit", type: "uint256" },
    ],
    name: "getAllRecords",
    outputs: [
      { internalType: "uint256[]", name: "tokenIds", type: "uint256[]" },
      { internalType: "string[]", name: "profileIds", type: "string[]" },
      { internalType: "string[]", name: "profileTypes", type: "string[]" },
      { internalType: "string[]", name: "uris", type: "string[]" },
      { internalType: "address[]", name: "owners", type: "address[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getRecord",
    outputs: [
      { internalType: "string", name: "profileId", type: "string" },
      { internalType: "string", name: "profileType", type: "string" },
      { internalType: "string", name: "uri", type: "string" },
      { internalType: "address", name: "owner", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "profileId", type: "string" }],
    name: "getRecordByProfile",
    outputs: [
      { internalType: "string", name: "", type: "string" },
      { internalType: "string", name: "", type: "string" },
      { internalType: "string", name: "", type: "string" },
      { internalType: "address", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "profileId", type: "string" }],
    name: "getTokenByProfile",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "index", type: "uint256" }],
    name: "tokenByIndex",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function getNftContractAddress(): `0x${string}` {
  const env = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS : undefined;
  if (env && env.startsWith("0x")) return env as `0x${string}`;
  return NFT_CONTRACT_ADDRESS as `0x${string}`;
}
