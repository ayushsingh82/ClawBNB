"use client";

import dynamic from "next/dynamic";
import { Spinner, Center } from "@chakra-ui/react";
import { AppShell } from "../AppShell";

const MyAgentsContent = dynamic(
  () => import("./MyAgentsContent").then((m) => m.MyAgentsContent),
  {
    ssr: false,
    loading: () => (
      <AppShell>
        <Center py={20}>
          <Spinner size="lg" color="bauhaus.blue" />
        </Center>
      </AppShell>
    ),
  }
);

export default function MyAgentsPage() {
  return <MyAgentsContent />;
}
