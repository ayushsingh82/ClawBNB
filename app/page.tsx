"use client";

import { Box } from "@chakra-ui/react";
import { Navigation, Hero, Features, Footer } from "../components";

export default function Home() {
  return (
    <Box as="main" minH="100vh" bg="gray.50">
      <Navigation />
      <Hero />
      <Features />
      <Footer />
    </Box>
  );
}
