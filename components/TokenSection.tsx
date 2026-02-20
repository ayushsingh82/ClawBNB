"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  HStack,
  VStack,
  Flex,
  Grid,
  GridItem,
  Button,
  useClipboard,
  Image,
  Skeleton,
} from "@chakra-ui/react";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Copy, Check, ExternalLink, TrendingUp } from "lucide-react";
import { FloatingFacehashes } from "./FloatingFacehashes";
import { TokenChart } from "./TokenChart";
import { useTokenData, type TimeframeData } from "../contexts/TokenDataContext";
import { TOKEN_ADDRESS, TOKEN_LAUNCH_URL } from "../constants";

const MotionBox = motion(Box);

const TF_LABELS = ["30M", "1H", "4H", "24H"] as const;

function MetricRow({
  label,
  left,
  center,
  right,
  leftColor,
  rightColor,
}: {
  label: string;
  left: string | number;
  center?: string | number;
  right: string | number;
  leftColor?: string;
  rightColor?: string;
}) {
  return (
    <HStack justify="space-between" w="full" py={1}>
      <Text
        fontSize="xs"
        fontWeight="700"
        color={leftColor || "green.400"}
        fontFamily="mono"
        minW="60px"
      >
        {left}
      </Text>
      {center !== undefined && (
        <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase">
          {label}
        </Text>
      )}
      <Text
        fontSize="xs"
        fontWeight="700"
        color={rightColor || "green.400"}
        fontFamily="mono"
        minW="60px"
        textAlign="right"
      >
        {right}
      </Text>
    </HStack>
  );
}

function BarIndicator({ buy, total }: { buy: number; total: number }) {
  const pct = total > 0 ? (buy / total) * 100 : 50;
  return (
    <Box w="full" h="4px" borderRadius="full" bg="red.500" overflow="hidden">
      <Box h="full" w={`${pct}%`} bg="green.400" borderRadius="full" />
    </Box>
  );
}

export function TokenSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const { hasCopied, onCopy } = useClipboard(TOKEN_ADDRESS);
  const { tokenData, isLoading } = useTokenData();
  const [selectedTf, setSelectedTf] = useState<string>("24H");

  const truncatedAddress = `${TOKEN_ADDRESS.slice(0, 6)}...${TOKEN_ADDRESS.slice(-4)}`;

  const tf: TimeframeData | undefined = tokenData?.timeframes?.[selectedTf];

  return (
    <Box
      id="token"
      bg="#0d0d1a"
      py={{ base: 14, md: 20 }}
      position="relative"
      overflow="hidden"
    >
      <FloatingFacehashes section="token" />
      <Container maxW="7xl" ref={ref} position="relative" zIndex={1}>
        <VStack spacing={{ base: 8, md: 10 }}>
          {/* ─── Header ─── */}
          <MotionBox
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
          >
            <VStack spacing={4}>
              <HStack spacing={3} justify="center">
                {tokenData?.image ? (
                  <Image
                    src={tokenData.image}
                    alt="NCLAW"
                    w="56px"
                    h="56px"
                    borderRadius="xl"
                    border="2px solid"
                    borderColor="#180E67"
                    shadow="0 0 20px rgba(139,92,246,0.3)"
                  />
                ) : (
                  <Box
                    w="56px"
                    h="56px"
                    borderRadius="xl"
                    bg="#180E67"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    border="2px solid"
                    borderColor="#180E67"
                    shadow="0 0 20px rgba(139,92,246,0.3)"
                  >
                    <Text fontSize="2xl" fontWeight="800" color="white">
                      C
                    </Text>
                  </Box>
                )}
                <VStack spacing={0} align="start">
                  <HStack spacing={2} align="baseline">
                    <Heading
                      as="h2"
                      fontSize={{ base: "2xl", md: "3xl" }}
                      fontWeight="700"
                      color="white"
                    >
                      $NCLAW
                    </Heading>
                    {isLoading ? (
                      <Skeleton
                        h="24px"
                        w="80px"
                        startColor="gray.700"
                        endColor="gray.600"
                      />
                    ) : (
                      <Text
                        fontSize="xl"
                        fontWeight="800"
                        color="white"
                        fontFamily="mono"
                      >
                        {tokenData?.price || "—"}
                      </Text>
                    )}
                  </HStack>
                  <Text fontSize="sm" color="gray.500">
                    ClawBNB on BSC
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </MotionBox>

          {/* ─── CA Bar ─── */}
          <MotionBox
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.06 }}
            w="full"
            maxW="xl"
            mx="auto"
          >
            <Flex
              bg="whiteAlpha.50"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.100"
              overflow="hidden"
              align="stretch"
              cursor="pointer"
              onClick={onCopy}
              _hover={{ borderColor: "#180E67" }}
              transition="all 0.2s"
            >
              <Flex
                px={3}
                py={2.5}
                align="center"
                borderRight="1px solid"
                borderColor="whiteAlpha.100"
              >
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  color="#241388"
                  letterSpacing="wider"
                >
                  CA
                </Text>
              </Flex>
              <Flex px={3} py={2.5} align="center" flex={1} fontFamily="mono">
                <Text
                  color="gray.400"
                  fontSize="xs"
                  display={{ base: "none", md: "block" }}
                >
                  {TOKEN_ADDRESS}
                </Text>
                <Text
                  color="gray.400"
                  fontSize="xs"
                  display={{ base: "block", md: "none" }}
                >
                  {truncatedAddress}
                </Text>
              </Flex>
              <Flex
                minW="40px"
                align="center"
                justify="center"
                bg={hasCopied ? "green.500" : "whiteAlpha.100"}
                color={hasCopied ? "white" : "gray.500"}
                transition="all 0.2s"
              >
                {hasCopied ? <Check size={16} /> : <Copy size={16} />}
              </Flex>
            </Flex>
          </MotionBox>

          {/* ─── Chart + Metrics Grid ─── */}
          <MotionBox
            w="full"
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Grid
              templateColumns={{ base: "1fr", lg: "3fr 1fr" }}
              gap={0}
              borderRadius="xl"
              overflow="hidden"
              border="1px solid"
              borderColor="whiteAlpha.100"
            >
              {/* ─── Chart ─── */}
              <GridItem bg="#1a1a2e">
                <Box h={{ base: "340px", md: "440px" }}>
                  <TokenChart />
                </Box>
              </GridItem>

              {/* ─── Metrics Panel ─── */}
              <GridItem bg="#12121f" borderLeft={{ lg: "1px solid" }} borderColor="whiteAlpha.100">
                <VStack spacing={0} h="full">
                  {/* Price Stats Row */}
                  <Grid templateColumns="1fr 1fr 1fr" w="full" borderBottom="1px solid" borderColor="whiteAlpha.100">
                    <VStack spacing={0} p={3} borderRight="1px solid" borderColor="whiteAlpha.100">
                      <Text fontSize="10px" color="gray.500" fontWeight="600" textTransform="uppercase">
                        PRICE USD
                      </Text>
                      {isLoading ? (
                        <Skeleton h="16px" w="50px" startColor="gray.700" endColor="gray.600" />
                      ) : (
                        <Text fontSize="xs" fontWeight="700" color="white" fontFamily="mono">
                          {tokenData?.price || "—"}
                        </Text>
                      )}
                    </VStack>
                    <VStack spacing={0} p={3} borderRight="1px solid" borderColor="whiteAlpha.100">
                      <Text fontSize="10px" color="gray.500" fontWeight="600" textTransform="uppercase">
                        PRICE BNB
                      </Text>
                      <Text fontSize="xs" fontWeight="700" color="white" fontFamily="mono">
                        {tokenData?.priceMon?.toFixed(6) || "—"}
                      </Text>
                    </VStack>
                    <VStack spacing={0} p={3}>
                      <Text fontSize="10px" color="gray.500" fontWeight="600" textTransform="uppercase">
                        FDV
                      </Text>
                      <Text fontSize="xs" fontWeight="700" color="white" fontFamily="mono">
                        {tokenData?.fdv || "—"}
                      </Text>
                    </VStack>
                  </Grid>

                  {/* Timeframe Selector */}
                  <HStack spacing={0} w="full" borderBottom="1px solid" borderColor="whiteAlpha.100">
                    {TF_LABELS.map((label) => {
                      const isActive = selectedTf === label;
                      const tfData = tokenData?.timeframes?.[label];
                      const pct = tfData?.percent ?? 0;
                      const color = pct >= 0 ? "green.400" : "red.400";
                      return (
                        <Box
                          key={label}
                          flex={1}
                          py={2}
                          textAlign="center"
                          cursor="pointer"
                          bg={isActive ? "whiteAlpha.100" : "transparent"}
                          borderBottom={isActive ? "2px solid" : "2px solid transparent"}
                          borderColor={isActive ? "#180E67" : "transparent"}
                          onClick={() => setSelectedTf(label)}
                          _hover={{ bg: "whiteAlpha.50" }}
                          transition="all 0.15s"
                        >
                          <Text fontSize="10px" color="gray.500" fontWeight="600">
                            {label}
                          </Text>
                          <Text fontSize="xs" fontWeight="700" color={color} fontFamily="mono">
                            {pct >= 0 ? "+" : ""}
                            {pct.toFixed(2)}%
                          </Text>
                        </Box>
                      );
                    })}
                  </HStack>

                  {/* Metrics for selected timeframe */}
                  <VStack spacing={0} w="full" p={3} flex={1}>
                    {tf ? (
                      <>
                        {/* TXNS */}
                        <HStack justify="space-between" w="full" mb={1}>
                          <Text fontSize="10px" color="gray.500" fontWeight="600">TXNS</Text>
                          <Text fontSize="10px" color="gray.500" fontWeight="600">BUYS</Text>
                          <Text fontSize="10px" color="gray.500" fontWeight="600">SELLS</Text>
                        </HStack>
                        <MetricRow
                          label="TXNS"
                          left={tf.buys}
                          right={tf.sells}
                          leftColor="green.400"
                          rightColor={tf.sells > 0 ? "red.400" : "green.400"}
                        />
                        <BarIndicator buy={tf.buys} total={tf.txns} />

                        <Box h={3} />

                        {/* VOLUME */}
                        <HStack justify="space-between" w="full" mb={1}>
                          <Text fontSize="10px" color="gray.500" fontWeight="600">VOLUME</Text>
                          <Text fontSize="10px" color="gray.500" fontWeight="600">BUY VOL</Text>
                          <Text fontSize="10px" color="gray.500" fontWeight="600">SELL VOL</Text>
                        </HStack>
                        <MetricRow
                          label="VOL"
                          left={tf.buyVol}
                          right={tf.sellVol}
                          leftColor="green.400"
                          rightColor={tf.sellers > 0 ? "red.400" : "green.400"}
                        />
                        <BarIndicator
                          buy={parseFloat(tf.buyVol.replace("$", ""))}
                          total={parseFloat(tf.buyVol.replace("$", "")) + parseFloat(tf.sellVol.replace("$", ""))}
                        />

                        <Box h={3} />

                        {/* MAKERS */}
                        <HStack justify="space-between" w="full" mb={1}>
                          <Text fontSize="10px" color="gray.500" fontWeight="600">MAKERS</Text>
                          <Text fontSize="10px" color="gray.500" fontWeight="600">BUYERS</Text>
                          <Text fontSize="10px" color="gray.500" fontWeight="600">SELLERS</Text>
                        </HStack>
                        <MetricRow
                          label="MAKERS"
                          left={tf.buyers}
                          right={tf.sellers}
                          leftColor="green.400"
                          rightColor={tf.sellers > 0 ? "red.400" : "green.400"}
                        />
                        <BarIndicator buy={tf.buyers} total={tf.makers} />
                      </>
                    ) : (
                      <Flex h="full" align="center" justify="center">
                        <Text fontSize="xs" color="gray.600">
                          No data
                        </Text>
                      </Flex>
                    )}
                  </VStack>

                  {/* ATH + Holders */}
                  <Box w="full" borderTop="1px solid" borderColor="whiteAlpha.100" p={3}>
                    <VStack spacing={2} align="stretch">
                      <HStack justify="space-between">
                        <HStack spacing={1.5}>
                          <TrendingUp size={12} color="#4ade80" />
                          <Text fontSize="10px" color="gray.500" fontWeight="600">
                            ATH
                          </Text>
                        </HStack>
                        <Text fontSize="xs" fontWeight="700" color="green.400" fontFamily="mono">
                          {tokenData?.athPriceUsd
                            ? `$${tokenData.athPriceUsd.toPrecision(4)}`
                            : "—"}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="10px" color="gray.500" fontWeight="600">
                          HOLDERS
                        </Text>
                        <Text fontSize="xs" fontWeight="700" color="white" fontFamily="mono">
                          {tokenData?.holderCount ?? "—"}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="10px" color="gray.500" fontWeight="600">
                          MARKET
                        </Text>
                        <Text fontSize="xs" fontWeight="700" color="#241388" fontFamily="mono">
                          {tokenData?.marketType || "—"}
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                </VStack>
              </GridItem>
            </Grid>
          </MotionBox>

          {/* ─── Buy Button ─── */}
          <MotionBox
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Button
              as="a"
              href={TOKEN_LAUNCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              bg="#180E67"
              color="white"
              fontWeight="700"
              borderRadius="xl"
              px={10}
              _hover={{
                bg: "#241388",
                transform: "translateY(-1px)",
                shadow: "0 4px 20px rgba(139,92,246,0.3)",
              }}
              _active={{ bg: "#180E67" }}
              transition="all 0.2s"
              rightIcon={<ExternalLink size={16} />}
            >
              Buy $BCLAW
            </Button>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
}
