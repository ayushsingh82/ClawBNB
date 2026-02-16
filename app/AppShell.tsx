"use client";
import React from "react";
import { Box } from "@chakra-ui/react";
import { Navigation } from "../components";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Box as="main" minH="100vh" bg="gray.50">
      <Navigation />
      <Box as="section">{children}</Box>
    </Box>
  );
}
