"use client";

import { Box, Heading, Text, VStack } from "@chakra-ui/react";

interface PageHeaderProps {
  title: string;
  description: string;
  variant?: "default" | "blue";
}

export function PageHeader({ title, description, variant = "default" }: PageHeaderProps) {
  const usePrimary = variant === "blue";
  return (
    <VStack align="flex-start" spacing={3} w="full">
      <Box position="relative" display="inline-block">
        <Heading size="lg" color={usePrimary ? "black" : "bauhaus.foreground"}>
          {title}
        </Heading>
        <Box
          position="absolute"
          left={0}
          bottom="-8px"
          w="120px"
          h="10px"
          overflow="visible"
        >
          <svg
            viewBox="0 0 200 20"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%", overflow: "visible" }}
          >
            <path
              d="M 0 18 Q 100 0 200 18"
              fill="none"
              stroke={usePrimary ? "bauhaus.blue" : "bauhaus.red"}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </Box>
      </Box>
      <Text color={usePrimary ? "black" : "bauhaus.foreground"} fontSize="sm" maxW="xl">
        {description}
      </Text>
    </VStack>
  );
}
