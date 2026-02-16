"use client";

import { Container, VStack, Button, Text, useToast } from "@chakra-ui/react";
import { AppShell } from "../AppShell";
import { Copy, Share2, List } from "lucide-react";
import { useCallback } from "react";

export default function ProfilePage() {
  const toast = useToast();

  const copyLink = useCallback(() => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    navigator.clipboard.writeText(url).then(
      () => toast({ title: "Link copied", status: "success", duration: 2000 }),
      () => toast({ title: "Copy failed", status: "error", duration: 2000 })
    );
  }, [toast]);

  const shareOnX = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const text = "Check out my profile";
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <AppShell>
      <Container maxW="md" py={8}>
        <Text fontSize="sm" color="gray.600" mb={4}>
          Profile
        </Text>
        <VStack spacing={3} align="stretch">
          <Button
            leftIcon={<Copy size={18} />}
            variant="outline"
            colorScheme="gray"
            size="md"
            w="full"
            onClick={copyLink}
          >
            Copy link
          </Button>
          <Button
            leftIcon={<Share2 size={18} />}
            variant="outline"
            colorScheme="gray"
            size="md"
            w="full"
            onClick={shareOnX}
          >
            Share on X
          </Button>
          <Button
            leftIcon={<List size={18} />}
            variant="outline"
            colorScheme="gray"
            size="md"
            w="full"
            as="a"
            href="/myagents"
          >
            All
          </Button>
        </VStack>
      </Container>
    </AppShell>
  );
}
