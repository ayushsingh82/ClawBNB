"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
} from "@chakra-ui/react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { PanelRight, Layers, Puzzle, Zap } from "lucide-react";
import { Card } from "./ui/Card";
import { FloatingFacehashes } from "./FloatingFacehashes";

const MotionBox = motion(Box);

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  decoratorColor: "red" | "blue" | "yellow";
  decoratorShape: "circle" | "square" | "triangle";
  delay?: number;
}

function FeatureCard({
  icon,
  title,
  description,
  decoratorColor,
  decoratorShape,
  delay = 0,
}: FeatureCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <MotionBox
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      h="full"
    >
      <Card
        decoratorColor={decoratorColor}
        decoratorShape={decoratorShape}
        h="full"
        bg="white"
      >
        <VStack align="flex-start" spacing={4} h="full">
          <Box
            p={3}
            borderRadius="lg"
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
            color="bauhaus.blue"
          >
            {icon}
          </Box>
          <Heading
            as="h3"
            size="sm"
            fontWeight="600"
            color="gray.900"
            letterSpacing="-0.01em"
          >
            {title}
          </Heading>
          <Text color="gray.600" fontSize="sm" lineHeight="tall">
            {description}
          </Text>
        </VStack>
      </Card>
    </MotionBox>
  );
}

const features = [
  {
    icon: <PanelRight size={24} />,
    title: "Drag & Drop Canvas",
    description:
      "Build agents visually. Drag triggers, actions, and tools onto the canvas — no code required.",
    decoratorColor: "blue" as const,
    decoratorShape: "square" as const,
  },
  {
    icon: <Zap size={24} />,
    title: "Triggers & Actions",
    description:
      "Define when your agent runs and what it does. Connect blocks to design flows.",
    decoratorColor: "red" as const,
    decoratorShape: "circle" as const,
  },
  {
    icon: <Puzzle size={24} />,
    title: "Tools & Integrations",
    description:
      "Add tools your Claw agent can use. Extend with APIs and external services.",
    decoratorColor: "yellow" as const,
    decoratorShape: "triangle" as const,
  },
  {
    icon: <Layers size={24} />,
    title: "My Agents",
    description:
      "Save and manage all your agents in one place. Edit, duplicate, or deploy.",
    decoratorColor: "blue" as const,
    decoratorShape: "square" as const,
  },
];

export function Features() {
  const headingRef = useRef(null);
  const isHeadingInView = useInView(headingRef, { once: true });

  return (
    <Box
      id="features"
      bg="white"
      pt={{ base: 12, md: 16 }}
      pb={{ base: 16, md: 24 }}
      position="relative"
    >
      <FloatingFacehashes section="features" />
      <Container maxW="7xl" position="relative" zIndex={1}>
        <VStack spacing={{ base: 10, md: 14 }}>
          <VStack spacing={3} ref={headingRef}>
            <MotionBox
              initial={{ opacity: 0, y: 16 }}
              animate={isHeadingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4 }}
            >
              <Heading
                as="h2"
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="600"
                color="gray.900"
                textAlign="center"
                letterSpacing="-0.02em"
              >
                Features
              </Heading>
            </MotionBox>
            <Box w="12" h="1" bg="bauhaus.blue" borderRadius="full" />
          </VStack>

          <SimpleGrid
            columns={{ base: 1, md: 2 }}
            spacing={6}
            w="full"
            maxW="4xl"
            mx="auto"
          >
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                {...feature}
                delay={index * 0.06}
              />
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
}
