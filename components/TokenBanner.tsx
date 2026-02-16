"use client";

import { Box, HStack, Text } from "@chakra-ui/react";
import { useTokenData } from "../contexts/TokenDataContext";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

function LoadingDots() {
  return (
    <HStack spacing={1}>
      {[0, 1, 2].map((i) => (
        <MotionBox
          key={i}
          w="4px"
          h="4px"
          borderRadius="full"
          bg="gray.400"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </HStack>
  );
}

export function TokenBanner() {
  const { tokenData, isLoading } = useTokenData();
  const [displayValue, setDisplayValue] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevDisplayRef = useRef<string | null>(null);
  const prevRawRef = useRef<number | null>(null);

  useEffect(() => {
    if (tokenData?.marketCap !== undefined) {
      const newDisplay = tokenData.marketCap;
      const newRaw = tokenData.marketCapRaw;
      const prevDisplay = prevDisplayRef.current;
      const prevRaw = prevRawRef.current;

      if (
        prevDisplay !== null &&
        prevDisplay !== newDisplay &&
        prevRaw !== null
      ) {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 600);
        prevDisplayRef.current = newDisplay;
        prevRawRef.current = newRaw ?? null;
        setDisplayValue(newDisplay);
        return () => clearTimeout(timer);
      }

      prevDisplayRef.current = newDisplay;
      prevRawRef.current = newRaw ?? null;
      setDisplayValue(newDisplay);
    }
  }, [tokenData?.marketCap, tokenData?.marketCapRaw]);

  return (
    <Box
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.200"
      py={2.5}
      px={4}
    >
      <HStack
        justify="center"
        spacing={{ base: 2, md: 4 }}
        flexWrap="wrap"
        rowGap={2}
      >
        <Text fontSize="xs" fontWeight="500" color="gray.500">
          Powered by
        </Text>
        <Box
          px={2.5}
          py={1}
          borderRadius="md"
          bg="gray.100"
          fontWeight="600"
          fontSize="xs"
          color="bauhaus.blue"
        >
          $NCLAW
        </Box>
        <Text fontSize="xs" color="gray.300">
          ·
        </Text>
        <HStack
          spacing={1.5}
          bg="gray.50"
          borderRadius="md"
          px={3}
          py={1.5}
          border="1px solid"
          borderColor={isAnimating ? "green.200" : "gray.200"}
        >
          <Text
            fontSize="xs"
            fontWeight="600"
            color="gray.600"
          >
            MCap:
          </Text>
          {isLoading || !displayValue ? (
            <LoadingDots />
          ) : (
            <Text
              fontSize="sm"
              fontWeight="600"
              color={isAnimating ? "green.600" : "gray.800"}
              transition="color 0.2s"
            >
              {displayValue}
            </Text>
          )}
        </HStack>
      </HStack>
    </Box>
  );
}
