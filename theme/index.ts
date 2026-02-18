import { extendTheme } from "@chakra-ui/react";

const bauhaus = {
  background: "#FAFAFA",
  black: "#0F0F0F",
  red: "#5B4BB9",
  blue: "#180E67",
  yellow: "#6E54FE",
  green: "#208040",
  border: "#121212",
  foreground: "#171717",
  primaryLight: "#2D1F8F",
  smallBox: "#F3F1F8",
  smallBoxText: "#180E67",
};

export const theme = extendTheme({
  colors: {
    bauhaus,
  },
  fontSizes: {
    "2xs": "0.625rem",
  },
  shadows: {
    card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
    cardHover: "0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.04)",
    soft: "0 2px 8px -2px rgb(24 14 103 / 0.12)",
  },
  semanticTokens: {
    colors: {
      "text.secondary": { default: "#4A5568", _dark: "#A0AEC0" },
      "text.tertiary": { default: "#718096", _dark: "#718096" },
    },
  },
  components: {
    Button: {
      variants: {
        primary: {
          bg: "bauhaus.blue",
          color: "white",
          fontWeight: "600",
          borderRadius: "lg",
          boxShadow: "soft",
          _hover: {
            bg: "#241388",
            boxShadow: "cardHover",
            _disabled: { bg: "bauhaus.blue" },
          },
          _active: { bg: "#180E67" },
        },
        outline: {
          border: "1px solid",
          borderColor: "gray.300",
          bg: "white",
          color: "gray.800",
          fontWeight: "500",
          borderRadius: "lg",
          _hover: {
            bg: "gray.50",
            borderColor: "bauhaus.blue",
            color: "bauhaus.blue",
          },
        },
        yellow: {
          bg: "bauhaus.yellow",
          color: "white",
          fontWeight: "600",
          borderRadius: "lg",
          _hover: { opacity: 0.92 },
        },
        green: {
          bg: "bauhaus.green",
          color: "white",
          fontWeight: "600",
          borderRadius: "lg",
          _hover: { opacity: 0.92 },
        },
      },
    },
  },
});
