"use client";

import { Box, Container, Flex, VStack, Text } from "@chakra-ui/react";

export function Footer() {
  return (
    <Box
      bg="black"
      py={{ base: 10, md: 14 }}
      borderTop="1px solid"
      borderColor="whiteAlpha.100"
    >
      <Container maxW="7xl">
        <VStack spacing={8}>
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "center", md: "flex-start" }}
            w="full"
            gap={6}
          >
            <VStack align={{ base: "center", md: "flex-start" }} spacing={2}>
              <Text
                color="white"
                fontWeight="600"
                fontSize="lg"
                fontFamily="var(--font-serif), Georgia, serif"
              >
                ClawBNB
              </Text>
              <Text
                color="gray.400"
                maxW="320px"
                fontSize="sm"
                textAlign={{ base: "center", md: "left" }}
                lineHeight="tall"
              >
                Build Claw agents with drag and drop. No code — design on the
                canvas.
              </Text>
            </VStack>
          </Flex>

          <Box w="full" h="1px" bg="whiteAlpha.100" />

          <Flex
            justify={{ base: "center", md: "space-between" }}
            align="center"
            w="full"
          >
            <Text color="gray.500" fontSize="sm">
              © {new Date().getFullYear()} ClawBNB
            </Text>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
}
