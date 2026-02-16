"use client";

import { Box } from "@chakra-ui/react";
import { GeometricShape } from "./GeometricShape";

type DecoratorColor = "red" | "blue" | "yellow";
type DecoratorShape = "circle" | "square" | "triangle";

interface CardProps {
  children: React.ReactNode;
  decoratorColor: DecoratorColor;
  decoratorShape: DecoratorShape;
  h?: string;
  bg?: string;
}

export function Card({
  children,
  decoratorColor,
  decoratorShape,
  h,
  bg = "white",
}: CardProps) {
  return (
    <Box
      h={h}
      bg={bg}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="xl"
      boxShadow="card"
      p={6}
      position="relative"
      _hover={{
        boxShadow: "cardHover",
        borderColor: "gray.300",
      }}
      transition="all 0.2s ease-out"
    >
      <Box mb={4} opacity={0.9}>
        <GeometricShape
          shape={decoratorShape}
          color={decoratorColor}
          size="12px"
        />
      </Box>
      {children}
    </Box>
  );
}
