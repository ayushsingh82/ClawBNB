"use client";

import { Box } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Facehash } from "facehash";

const MotionBox = motion(Box);

type FaceDef = { name: string; colors: [string, string]; top: string; left?: string; right?: string; size: number; duration: number; delay: number };

// 6 colors for floating facehash: blue, red, orange, yellow, pink, purple
const FACE_COLORS = {
  blue: "#3b82f6",
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  pink: "#ec4899",
  purple: "#8b5cf6",
} as const;

const HERO_FACES: FaceDef[] = [
  { name: "agent-1", colors: [FACE_COLORS.blue, FACE_COLORS.purple], top: "12%", left: "8%", size: 64, duration: 4, delay: 0 },
  { name: "agent-2", colors: [FACE_COLORS.red, FACE_COLORS.pink], top: "18%", right: "10%", size: 56, duration: 5, delay: 0.5 },
  { name: "agent-3", colors: [FACE_COLORS.orange, FACE_COLORS.yellow], top: "72%", left: "5%", size: 70, duration: 4.5, delay: 1 },
  { name: "agent-4", colors: [FACE_COLORS.yellow, FACE_COLORS.orange], top: "78%", right: "12%", size: 52, duration: 3.5, delay: 0.2 },
  { name: "agent-5", colors: [FACE_COLORS.pink, FACE_COLORS.purple], top: "42%", left: "3%", size: 48, duration: 5.2, delay: 1.2 },
  { name: "agent-6", colors: [FACE_COLORS.purple, FACE_COLORS.blue], top: "48%", right: "6%", size: 60, duration: 4.2, delay: 0.8 },
  { name: "agent-7", colors: [FACE_COLORS.blue, FACE_COLORS.pink], top: "28%", left: "15%", size: 50, duration: 3.8, delay: 0.3 },
  { name: "agent-8", colors: [FACE_COLORS.red, FACE_COLORS.orange], top: "58%", right: "18%", size: 56, duration: 4.8, delay: 0.6 },
];

const FEATURES_FACES: FaceDef[] = [
  { name: "feat-1", colors: [FACE_COLORS.blue, FACE_COLORS.purple], top: "10%", left: "6%", size: 52, duration: 4.2, delay: 0 },
  { name: "feat-2", colors: [FACE_COLORS.red, FACE_COLORS.yellow], top: "85%", right: "8%", size: 46, duration: 3.8, delay: 0.4 },
  { name: "feat-3", colors: [FACE_COLORS.orange, FACE_COLORS.pink], top: "45%", left: "2%", size: 58, duration: 5, delay: 0.7 },
  { name: "feat-4", colors: [FACE_COLORS.yellow, FACE_COLORS.orange], top: "50%", right: "4%", size: 50, duration: 4.5, delay: 0.2 },
  { name: "feat-5", colors: [FACE_COLORS.pink, FACE_COLORS.purple], top: "22%", right: "14%", size: 44, duration: 3.5, delay: 0.5 },
  { name: "feat-6", colors: [FACE_COLORS.purple, FACE_COLORS.blue], top: "70%", left: "12%", size: 54, duration: 4.8, delay: 0.3 },
];

const TOKEN_FACES: FaceDef[] = [
  { name: "token-1", colors: [FACE_COLORS.blue, FACE_COLORS.purple], top: "15%", left: "7%", size: 58, duration: 4, delay: 0 },
  { name: "token-2", colors: [FACE_COLORS.orange, FACE_COLORS.yellow], top: "80%", right: "9%", size: 50, duration: 4.5, delay: 0.6 },
  { name: "token-3", colors: [FACE_COLORS.pink, FACE_COLORS.purple], top: "35%", right: "5%", size: 52, duration: 3.8, delay: 0.2 },
  { name: "token-4", colors: [FACE_COLORS.red, FACE_COLORS.pink], top: "60%", left: "4%", size: 48, duration: 5, delay: 0.4 },
  { name: "token-5", colors: [FACE_COLORS.yellow, FACE_COLORS.orange], top: "48%", left: "14%", size: 46, duration: 4.2, delay: 0.8 },
];

const MYAGENTS_FACES: FaceDef[] = [
  { name: "myagent-1", colors: [FACE_COLORS.blue, FACE_COLORS.purple], top: "8%", left: "5%", size: 48, duration: 4, delay: 0 },
  { name: "myagent-2", colors: [FACE_COLORS.red, FACE_COLORS.pink], top: "85%", right: "8%", size: 44, duration: 4.5, delay: 0.3 },
  { name: "myagent-3", colors: [FACE_COLORS.orange, FACE_COLORS.yellow], top: "35%", left: "2%", size: 52, duration: 5, delay: 0.6 },
  { name: "myagent-4", colors: [FACE_COLORS.yellow, FACE_COLORS.pink], top: "55%", right: "6%", size: 46, duration: 3.8, delay: 0.2 },
  { name: "myagent-5", colors: [FACE_COLORS.purple, FACE_COLORS.blue], top: "72%", left: "12%", size: 40, duration: 4.2, delay: 0.5 },
  { name: "myagent-6", colors: [FACE_COLORS.pink, FACE_COLORS.orange], top: "22%", right: "10%", size: 50, duration: 4.8, delay: 0.4 },
];

function FloatingFace({ face }: { face: FaceDef }) {
  return (
    <MotionBox
      position="absolute"
      top={face.top}
      left={face.left}
      right={face.right}
      w={`${face.size}px`}
      h={`${face.size}px`}
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      borderRadius="xl"
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      boxShadow="0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)"
      animate={{ y: [0, -10, 0] }}
      transition={{
        duration: face.duration,
        repeat: Infinity,
        repeatType: "reverse",
        delay: face.delay,
      }}
      pointerEvents="none"
    >
      <Box color="#121212" display="flex" alignItems="center" justifyContent="center">
        <Facehash
          name={face.name}
          size={face.size}
          variant="solid"
          colors={face.colors}
        />
      </Box>
    </MotionBox>
  );
}

type Section = "hero" | "features" | "token" | "myagents";

export function FloatingFacehashes({ section = "hero" }: { section?: Section }) {
  const faces =
    section === "hero"
      ? HERO_FACES
      : section === "features"
        ? FEATURES_FACES
        : section === "token"
          ? TOKEN_FACES
          : MYAGENTS_FACES;
  return (
    <Box
      position="absolute"
      inset={0}
      overflow="hidden"
      pointerEvents="none"
      zIndex={0}
    >
      {faces.map((face, i) => (
        <FloatingFace key={`${section}-${i}`} face={face} />
      ))}
    </Box>
  );
}
