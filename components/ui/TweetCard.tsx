"use client";

import { Box } from "@chakra-ui/react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { GeometricShape } from "./GeometricShape";

type DecoratorColor = "red" | "blue" | "yellow";
type DecoratorShape = "circle" | "square" | "triangle";

interface TweetCardProps {
  tweetId: string;
  decoratorColor: DecoratorColor;
  decoratorShape: DecoratorShape;
  delay?: number;
}

const MotionBox = motion(Box);

export function TweetCard({
  tweetId,
  decoratorColor,
  decoratorShape,
  delay = 0,
}: TweetCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });

  return (
    <MotionBox
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      <Box
        display="block"
        bg="white"
        border="3px solid"
        borderColor="bauhaus.black"
        boxShadow="4px 4px 0px 0px #180E67"
        p={4}
        _hover={{
          transform: "translateY(-2px)",
          boxShadow: "6px 6px 0px 0px #180E67",
        }}
        transition="all 0.2s ease-out"
      >
        <Box mb={3}>
          <GeometricShape
            shape={decoratorShape}
            color={decoratorColor}
            size="14px"
          />
        </Box>
        <Box
          as="blockquote"
          className="twitter-tweet"
          data-dnt="true"
          sx={{
            "& iframe": { maxWidth: "100% !important" },
          }}
        >
          <iframe
            title={`Tweet ${tweetId}`}
            src={`https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=light`}
            width="100%"
            height="200"
            frameBorder="0"
            style={{ minHeight: "200px" }}
          />
        </Box>
      </Box>
    </MotionBox>
  );
}
