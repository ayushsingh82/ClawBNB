"use client";

import { Box, HStack } from "@chakra-ui/react";

type Shape = "circle" | "square" | "triangle";
type Color = "red" | "blue" | "yellow";

interface GeometricShapeProps {
  shape: Shape;
  color: Color;
  size?: string | number;
  filled?: boolean;
}

export function GeometricShape({
  shape,
  color,
  size = "24px",
  filled = true,
}: GeometricShapeProps) {
  const bg = filled ? `bauhaus.${color}` : "transparent";
  const borderColor = "bauhaus.black";

  if (shape === "circle") {
    return (
      <Box
        w={size}
        h={size}
        borderRadius="full"
        bg={bg}
        border="2px solid"
        borderColor={borderColor}
      />
    );
  }

  if (shape === "square") {
    return (
      <Box
        w={size}
        h={size}
        bg={bg}
        border="2px solid"
        borderColor={borderColor}
        transform="rotate(45deg)"
      />
    );
  }

  // triangle
  return (
    <Box
      w={0}
      h={0}
      borderLeft={`${typeof size === "number" ? size / 2 : "12px"} solid transparent`}
      borderRight={`${typeof size === "number" ? size / 2 : "12px"} solid transparent`}
      borderBottom={`${size} solid`}
      borderBottomColor={filled ? `bauhaus.${color}` : borderColor}
    />
  );
}

export function LogoShapes({ size = "12px" }: { size?: string }) {
  return (
    <HStack spacing={1}>
      <Box w={size} h={size} borderRadius="full" bg="bauhaus.red" />
      <Box
        w={size}
        h={size}
        bg="bauhaus.blue"
        transform="rotate(45deg)"
      />
      <Box
        w={0}
        h={0}
        borderLeft="4px solid transparent"
        borderRight="4px solid transparent"
        borderBottom="7px solid"
        borderBottomColor="bauhaus.yellow"
      />
    </HStack>
  );
}
