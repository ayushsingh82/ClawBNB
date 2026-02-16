"use client";

import { Box } from "@chakra-ui/react";
import { Navigation, TokenBanner, Hero, Features, TokenSection, Footer } from "../components";

export default function Home() {
  return (
    <Box as="main" minH="100vh" bg="gray.50">
      <Navigation />
      <TokenBanner />
      <Hero />
      <Features />
      <TokenSection />
      <Footer />
    </Box>
  );
}
