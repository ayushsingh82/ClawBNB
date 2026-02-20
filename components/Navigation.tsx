"use client";

import {
  Box,
  Container,
  Flex,
  HStack,
  Link,
  Text,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Menu } from "lucide-react";

const PRIMARY = "bauhaus.blue";

const navLinks = [
  { label: "Agents", href: "/myagents" },
  { label: "Build", href: "/ab" },
  // { label: "Mint", href: "/premium" },
];

export function Navigation() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const pathname = usePathname();

  return (
    <Box
      as="nav"
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.200"
      shadow="sm"
    >
      <Container maxW="7xl" py={3}>
        <Flex justify="space-between" align="center">
          <Link href="/" _hover={{ textDecoration: "none" }}>
            <HStack align="center" spacing={2}>
              <Text
                fontFamily="var(--font-serif), Georgia, serif"
                fontWeight="600"
                fontSize={{ base: "sm", md: "md" }}
                color={PRIMARY}
                letterSpacing="0.02em"
              >
                ClawBNB
              </Text>
            </HStack>
          </Link>

          <HStack spacing={8} display={{ base: "none", md: "flex" }}>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  fontWeight="500"
                  fontSize="sm"
                  color={isActive ? PRIMARY : "gray.700"}
                  _hover={{ color: PRIMARY }}
                  position="relative"
                >
                  {link.label}
                  {isActive && (
                    <Box
                      position="absolute"
                      bottom="-6px"
                      left={0}
                      right={0}
                      h="2px"
                      bg={PRIMARY}
                      borderRadius="full"
                    />
                  )}
                </Link>
              );
            })}
          </HStack>

          <HStack spacing={4}>
            <Box display={{ base: "none", md: "block" }}>
              <ConnectButton />
            </Box>
            <IconButton
              aria-label="Open menu"
              icon={<Menu size={22} />}
              variant="ghost"
              display={{ base: "flex", md: "none" }}
              onClick={onOpen}
              colorScheme="gray"
            />
          </HStack>
        </Flex>
      </Container>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent bg="white">
          <DrawerCloseButton color="gray.600" size="md" top={4} />
          <DrawerHeader pt={10} borderBottomWidth="1px" borderColor="gray.100">
            <Text
              fontFamily="var(--font-serif), Georgia, serif"
              fontWeight="600"
              fontSize="md"
              color={PRIMARY}
            >
              BNB-vibe
            </Text>
          </DrawerHeader>
          <DrawerBody pt={8}>
            <VStack spacing={1} align="stretch">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    py={3}
                    px={2}
                    color={isActive ? PRIMARY : "gray.700"}
                    fontWeight={isActive ? "600" : "500"}
                    borderRadius="md"
                    _hover={{ bg: "gray.50", color: PRIMARY }}
                    onClick={onClose}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Box pt={4} onClick={onClose}>
                <ConnectButton />
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
