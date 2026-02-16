"use client";

import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../theme";
import { TokenDataProvider } from "../contexts/TokenDataContext";
import { MoltbookAuthProvider } from "../contexts/MoltbookAuthContext";
import { Web3Provider } from "../contexts/Web3Provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <CacheProvider>
        <ChakraProvider theme={theme}>
          <TokenDataProvider>
            <MoltbookAuthProvider>{children}</MoltbookAuthProvider>
          </TokenDataProvider>
        </ChakraProvider>
      </CacheProvider>
    </Web3Provider>
  );
}
