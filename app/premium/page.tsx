"use client";

import { useState, useCallback } from "react";
import { useAccount, useWalletClient } from "wagmi";
import {
  Box,
  Container,
  VStack,
  HStack,
  Button,
  Text,
  Heading,
  Input,
  Link,
} from "@chakra-ui/react";
import { AppShell } from "../AppShell";
import { encodeFunctionData } from "viem";
import { MINT_TOKEN_ADDRESS, MINT_NFT_ADDRESS } from "../../lib/x402-config";

const PRIMARY = "bauhaus.blue";

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

type MintStatus = "idle" | "loading" | "success" | "error";

export default function MintPage() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Token mint state
  const [tokenAmount, setTokenAmount] = useState("1000");
  const [tokenStatus, setTokenStatus] = useState<MintStatus>("idle");
  const [tokenMessage, setTokenMessage] = useState("");
  const [tokenTxHash, setTokenTxHash] = useState("");

  // NFT mint state
  const [metadataUri, setMetadataUri] = useState("ipfs://clawbnb-nft");
  const [nftStatus, setNftStatus] = useState<MintStatus>("idle");
  const [nftMessage, setNftMessage] = useState("");
  const [nftTxHash, setNftTxHash] = useState("");

  const handleMintToken = useCallback(async () => {
    if (!walletClient || !address) {
      setTokenMessage("Please connect your wallet first");
      setTokenStatus("error");
      return;
    }
    setTokenStatus("loading");
    setTokenMessage("Sending transaction...");
    setTokenTxHash("");

    try {
      const amount = BigInt(tokenAmount) * BigInt(10 ** 18);
      const data = encodeFunctionData({
        abi: mintTokenAbi,
        functionName: "mint",
        args: [address, amount],
      });

      const hash = await walletClient.sendTransaction({
        to: MINT_TOKEN_ADDRESS,
        data,
        chain: walletClient.chain,
      });

      setTokenTxHash(hash);
      setTokenMessage(`Tokens minted! Tx: ${hash.slice(0, 10)}...${hash.slice(-8)}`);
      setTokenStatus("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Mint failed";
      if (msg.includes("rejected") || msg.includes("denied")) {
        setTokenMessage("Transaction cancelled");
      } else {
        setTokenMessage(msg.length > 120 ? msg.slice(0, 120) + "..." : msg);
      }
      setTokenStatus("error");
    }
  }, [walletClient, address, tokenAmount]);

  const handleMintNft = useCallback(async () => {
    if (!walletClient || !address) {
      setNftMessage("Please connect your wallet first");
      setNftStatus("error");
      return;
    }
    setNftStatus("loading");
    setNftMessage("Sending transaction...");
    setNftTxHash("");

    try {
      const data = encodeFunctionData({
        abi: mintNftAbi,
        functionName: "mint",
        args: [address, metadataUri],
      });

      const hash = await walletClient.sendTransaction({
        to: MINT_NFT_ADDRESS,
        data,
        chain: walletClient.chain,
      });

      setNftTxHash(hash);
      setNftMessage(`NFT minted! Tx: ${hash.slice(0, 10)}...${hash.slice(-8)}`);
      setNftStatus("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Mint failed";
      if (msg.includes("rejected") || msg.includes("denied")) {
        setNftMessage("Transaction cancelled");
      } else {
        setNftMessage(msg.length > 120 ? msg.slice(0, 120) + "..." : msg);
      }
      setNftStatus("error");
    }
  }, [walletClient, address, metadataUri]);

  return (
    <AppShell>
      <Box py={{ base: 10, md: 16 }} px={{ base: 4, md: 6 }} minH="calc(100vh - 65px)">
        <Container maxW="lg">
          <VStack spacing={6} align="stretch">
            <Heading size="lg" color="black" fontFamily="serif" textAlign="center">
              Mint on BSC Testnet
            </Heading>
            <Text color="gray.600" fontSize="sm" textAlign="center">
              Claim tokens and NFTs directly to your wallet.
            </Text>

            {/* ─── Mint Token Card ─── */}
            <Box
              bg="white"
              borderRadius="xl"
              border="2px solid"
              borderColor={PRIMARY}
              p={{ base: 6, md: 8 }}
              boxShadow="6px 6px 0 0 #180E67"
            >
              <VStack spacing={4} align="stretch">
                <Heading size="md" color="black" fontFamily="serif">
                  Mint Token (ERC20)
                </Heading>
                <Text fontSize="xs" color="gray.500">
                  Contract:{" "}
                  <Link
                    href={`https://testnet.bscscan.com/address/${MINT_TOKEN_ADDRESS}`}
                    isExternal
                    color="bauhaus.blue"
                    textDecoration="underline"
                  >
                    {MINT_TOKEN_ADDRESS.slice(0, 6)}...{MINT_TOKEN_ADDRESS.slice(-4)}
                  </Link>
                </Text>

                <Box>
                  <Text fontSize="xs" fontWeight="bold" mb={1}>
                    Amount (tokens)
                  </Text>
                  <Input
                    size="sm"
                    type="number"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                    placeholder="e.g. 1000"
                    border="2px solid"
                    borderColor="black"
                    borderRadius="md"
                  />
                </Box>

                <Button
                  onClick={handleMintToken}
                  disabled={tokenStatus === "loading" || !isConnected}
                  bg={PRIMARY}
                  color="white"
                  size="lg"
                  _hover={{ bg: "bauhaus.red", color: "white" }}
                  border="2px solid"
                  borderColor="black"
                  boxShadow="3px 3px 0 0 #180E67"
                >
                  {tokenStatus === "loading" ? "Minting..." : "Mint Token"}
                </Button>

                {tokenMessage && (
                  <Box
                    p={3}
                    borderRadius="lg"
                    fontSize="sm"
                    bg={tokenStatus === "error" ? "red.50" : tokenStatus === "success" ? "green.50" : "gray.50"}
                    color={tokenStatus === "error" ? "red.800" : tokenStatus === "success" ? "green.800" : "gray.700"}
                  >
                    {tokenMessage}
                    {tokenTxHash && (
                      <Box mt={1}>
                        <Link
                          href={`https://testnet.bscscan.com/tx/${tokenTxHash}`}
                          isExternal
                          color="bauhaus.blue"
                          textDecoration="underline"
                          fontSize="xs"
                        >
                          View on BscScan
                        </Link>
                      </Box>
                    )}
                  </Box>
                )}
              </VStack>
            </Box>

            {/* ─── Mint NFT Card ─── */}
            <Box
              bg="white"
              borderRadius="xl"
              border="2px solid"
              borderColor={PRIMARY}
              p={{ base: 6, md: 8 }}
              boxShadow="6px 6px 0 0 #180E67"
            >
              <VStack spacing={4} align="stretch">
                <Heading size="md" color="black" fontFamily="serif">
                  Mint NFT (ERC721)
                </Heading>
                <Text fontSize="xs" color="gray.500">
                  Contract:{" "}
                  <Link
                    href={`https://testnet.bscscan.com/address/${MINT_NFT_ADDRESS}`}
                    isExternal
                    color="bauhaus.blue"
                    textDecoration="underline"
                  >
                    {MINT_NFT_ADDRESS.slice(0, 6)}...{MINT_NFT_ADDRESS.slice(-4)}
                  </Link>
                </Text>

                <Box>
                  <Text fontSize="xs" fontWeight="bold" mb={1}>
                    Metadata URI
                  </Text>
                  <Input
                    size="sm"
                    value={metadataUri}
                    onChange={(e) => setMetadataUri(e.target.value)}
                    placeholder="ipfs://..."
                    border="2px solid"
                    borderColor="black"
                    borderRadius="md"
                  />
                </Box>

                <Button
                  onClick={handleMintNft}
                  disabled={nftStatus === "loading" || !isConnected}
                  bg={PRIMARY}
                  color="white"
                  size="lg"
                  _hover={{ bg: "bauhaus.red", color: "white" }}
                  border="2px solid"
                  borderColor="black"
                  boxShadow="3px 3px 0 0 #180E67"
                >
                  {nftStatus === "loading" ? "Minting..." : "Mint NFT"}
                </Button>

                {nftMessage && (
                  <Box
                    p={3}
                    borderRadius="lg"
                    fontSize="sm"
                    bg={nftStatus === "error" ? "red.50" : nftStatus === "success" ? "green.50" : "gray.50"}
                    color={nftStatus === "error" ? "red.800" : nftStatus === "success" ? "green.800" : "gray.700"}
                  >
                    {nftMessage}
                    {nftTxHash && (
                      <Box mt={1}>
                        <Link
                          href={`https://testnet.bscscan.com/tx/${nftTxHash}`}
                          isExternal
                          color="bauhaus.blue"
                          textDecoration="underline"
                          fontSize="xs"
                        >
                          View on BscScan
                        </Link>
                      </Box>
                    )}
                  </Box>
                )}
              </VStack>
            </Box>

            {!isConnected && (
              <Text color="gray.500" fontSize="sm" textAlign="center">
                Connect your wallet to start minting.
              </Text>
            )}
          </VStack>
        </Container>
      </Box>
    </AppShell>
  );
}
