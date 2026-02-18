"use client";

import { useState, useCallback } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { x402Client } from "@x402/core/client";
import { Box, Container, VStack, Button, Text, Heading, Link } from "@chakra-ui/react";
import { AppShell } from "../AppShell";
import { x402ClientConfig } from "../../lib/x402-config";

const PRIMARY = "bauhaus.blue";

export default function PremiumPage() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [message, setMessage] = useState("Pay $0.001 USDC to unlock premium content");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleUnlock = useCallback(async () => {
    if (!walletClient || !address) {
      setMessage("Please connect your wallet first");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage("Processing...");

    try {
      const evmSigner = {
        address: address as `0x${string}`,
        signTypedData: async (msg: {
          domain: Record<string, unknown>;
          types: Record<string, unknown>;
          primaryType: string;
          message: Record<string, unknown>;
        }) => {
          return walletClient.signTypedData({
            domain: msg.domain as Parameters<typeof walletClient.signTypedData>[0]["domain"],
            types: msg.types as Parameters<typeof walletClient.signTypedData>[0]["types"],
            primaryType: msg.primaryType,
            message: msg.message,
          });
        },
      };

      const exactScheme = new ExactEvmScheme(evmSigner);
      const client = new x402Client().register(x402ClientConfig.chainId, exactScheme);
      const paymentFetch = wrapFetchWithPayment(fetch, client);

      const response = await paymentFetch("/api/premium", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const paymentHeader =
          response.headers.get("payment-required") || response.headers.get("x-payment");
        if (paymentHeader && response.status === 402) {
          try {
            const paymentData = JSON.parse(atob(paymentHeader));
            if (paymentData.error?.includes("insufficient_funds")) {
              setMessage("Insufficient USDC balance");
              setStatus("error");
              return;
            }
            if (paymentData.error?.includes("unexpected_error")) {
              setMessage("Payment failed. Please try again.");
              setStatus("error");
              return;
            }
          } catch {
            // ignore parse errors
          }
        }
        const errorText = await response.text().catch(() => "");
        let errMsg = `Request failed: ${response.status}`;
        try {
          const data = JSON.parse(errorText);
          errMsg = (data.error ?? data.details ?? errMsg) as string;
        } catch {
          // not JSON
        }
        setMessage(errMsg);
        setStatus("error");
        return;
      }

      const data = await response.json();
      localStorage.setItem(
        "premium_content_unlocked",
        JSON.stringify({ content: data.content, timestamp: Date.now() })
      );
      setMessage(data.content ?? "Content unlocked!");
      setStatus("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to unlock";
      if (
        msg.includes("User rejected") ||
        msg.includes("User denied") ||
        msg.includes("user rejected")
      ) {
        setMessage("Transaction cancelled");
      } else if (msg.includes("insufficient_funds") || msg.includes("INSUFFICIENT")) {
        setMessage("Insufficient USDC balance");
      } else {
        setMessage(msg);
      }
      setStatus("error");
    }
  }, [walletClient, address]);

  return (
    <AppShell>
      <Box py={{ base: 10, md: 16 }} px={{ base: 4, md: 6 }} minH="calc(100vh - 65px)">
        <Container maxW="md">
          <VStack
            spacing={6}
            align="stretch"
            textAlign="center"
            bg="white"
            borderRadius="xl"
            border="2px solid"
            borderColor={PRIMARY}
            p={{ base: 8, md: 10 }}
            boxShadow="6px 6px 0 0 #180E67"
          >
            <Heading size="lg" color="black" fontFamily="serif">
              x402 on BSC
            </Heading>
            <Text color="gray.600" fontSize="sm">
              Micropayments via facilitator.{" "}
              <Link
                href="https://x402.org"
                isExternal
                color="bauhaus.blue"
                textDecoration="underline"
              >
                Docs
              </Link>
            </Text>

            <Button
              onClick={handleUnlock}
              disabled={status === "loading" || !isConnected}
              bg={PRIMARY}
              color="white"
              size="lg"
              _hover={{ bg: "bauhaus.red", color: "white" }}
              border="2px solid"
              borderColor="black"
              boxShadow="3px 3px 0 0 #180E67"
            >
              {status === "loading" ? "Processing..." : "Pay & Unlock Content"}
            </Button>

            <Box
              p={4}
              borderRadius="lg"
              textAlign="left"
              fontSize="sm"
              bg={
                status === "error"
                  ? "red.50"
                  : status === "success"
                    ? "green.50"
                    : "gray.50"
              }
              color={
                status === "error"
                  ? "red.800"
                  : status === "success"
                    ? "green.800"
                    : "gray.700"
              }
            >
              {message}
            </Box>
          </VStack>
        </Container>
      </Box>
    </AppShell>
  );
}
