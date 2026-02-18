"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
} from "@chakra-ui/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Facehash } from "facehash";
import { FloatingFacehashes } from "./FloatingFacehashes";
import { ArrowRight } from "lucide-react";

const PRIMARY = "bauhaus.blue";

export function Hero() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <Box
      position="relative"
      overflow="hidden"
      py={{ base: 16, md: 24, lg: 28 }}
      px={{ base: 4, md: 6 }}
      bgGradient="linear(to-b, gray.50 0%, white 50%)"
      color="gray.900"
    >
      <FloatingFacehashes />
      <Container maxW="4xl" position="relative" zIndex={1}>
        <VStack align="center" spacing={8} textAlign="center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <HStack spacing={4} justify="center" mb={6}>
              <Box
                w="64px"
                h="64px"
                flexShrink={0}
                overflow="hidden"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                shadow="card"
              >
                <Facehash
                  name="claw-agent-builder"
                  size={64}
                  variant="solid"
                  colors={["#8b5cf6", "#a78bfa"]}
                />
              </Box>
            </HStack>
            <Heading
              as="h1"
              fontFamily="var(--font-serif), Georgia, serif"
              fontSize={{ base: "3xl", sm: "4xl", md: "5xl", lg: "6xl" }}
              fontWeight="600"
              lineHeight="1.15"
              letterSpacing="-0.02em"
              color="bauhaus.blue"
            >
              Claw Agent Builder
            </Heading>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Text
              fontSize={{ base: "md", md: "lg" }}
              color="gray.600"
              maxW="xl"
              lineHeight="tall"
            >
              Build Claw agents with drag and drop. No code — design triggers,
              actions, and tools on the canvas.
            </Text>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Button
              as={Link}
              href="/ab"
              bg={PRIMARY}
              color="white"
              size="lg"
              rightIcon={<ArrowRight size={18} />}
              _hover={{ bg: "#241388", color: "white" }}
              borderRadius="lg"
              fontWeight="600"
            >
              Open Agent Builder
            </Button>
          </motion.div>
        </VStack>
      </Container>
    </Box>
  );
}
