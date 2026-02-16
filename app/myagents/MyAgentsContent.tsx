"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  SimpleGrid,
  Badge,
  HStack,
  IconButton,
  Skeleton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  Code,
  Spinner,
  Divider,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { parseEther } from "viem";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "../AppShell";
import { FloatingFacehashes } from "../../components/FloatingFacehashes";
import { Plus, Bot, Edit, Copy, Trash2, Wallet, ExternalLink, Play, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import {
  listAgents,
  deleteAgent,
  duplicateAgent,
  executeAgent,
  getAgentBalance,
  type AgentFromAPI,
  type ExecuteAgentResult,
} from "../../lib/api-client";
import { getSkillLabel } from "../../lib/skill-labels";
import { BSC_TESTNET_EXPLORER_URL } from "../../lib/chains";

const PRIMARY = "bauhaus.blue";
const MAX_VISIBLE_SKILLS = 5;

// ─── Helpers ───

function SkillBubbles({ nodes }: { nodes: AgentFromAPI["canvasJson"]["nodes"] }) {
  const skills = useMemo(() => {
    const unique = [...new Set(nodes.filter((n) => n.type !== "agent_center").map((n) => n.type))];
    return unique.map((type) => getSkillLabel(type));
  }, [nodes]);

  if (skills.length === 0) {
    return (
      <Text fontSize="xs" color="gray.400" fontStyle="italic">
        No skills
      </Text>
    );
  }

  const visible = skills.slice(0, MAX_VISIBLE_SKILLS);
  const remaining = skills.length - MAX_VISIBLE_SKILLS;

  return (
    <Flex flexWrap="wrap" gap={1.5}>
      {visible.map((label) => (
        <Box
          key={label}
          bg="#3F2BA410"
          border="1px solid"
          borderColor="#3F2BA430"
          borderRadius="full"
          px={2.5}
          py={0.5}
          fontSize="2xs"
          fontWeight="semibold"
          color={PRIMARY}
          whiteSpace="nowrap"
        >
          {label}
        </Box>
      ))}
      {remaining > 0 && (
        <Box bg="gray.100" borderRadius="full" px={2.5} py={0.5} fontSize="2xs" fontWeight="semibold" color="gray.500" whiteSpace="nowrap">
          +{remaining} more
        </Box>
      )}
    </Flex>
  );
}

function statusColor(status: AgentFromAPI["status"]) {
  switch (status) {
    case "live": return "green";
    case "deploying": return "yellow";
    case "failed": return "red";
    default: return "purple";
  }
}

function formatBalance(raw: string, decimals: number): string {
  if (!raw || raw === "0") return "0";
  try {
    const num = BigInt(raw);
    const div = BigInt(10 ** decimals);
    const whole = num / div;
    const frac = num % div;
    const fracStr = frac.toString().padStart(decimals, "0").slice(0, 4);
    return `${whole}.${fracStr}`;
  } catch {
    return raw;
  }
}

// ─── Agent Card ───

function AgentCard({
  agent,
  onEdit,
  onDuplicate,
  onDelete,
  onExecute,
}: {
  agent: AgentFromAPI;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onExecute: () => void;
}) {
  const nodes = agent.canvasJson?.nodes ?? [];
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="xl"
      p={5}
      boxShadow="card"
      _hover={{ boxShadow: "cardHover", borderColor: "gray.300" }}
      transition="all 0.2s"
    >
      <HStack justify="space-between" mb={3}>
        <Heading size="sm" fontWeight="600" color="gray.900" noOfLines={1}>
          {agent.name}
        </Heading>
        <Badge
          colorScheme={statusColor(agent.status)}
          variant="subtle"
          fontSize="2xs"
          textTransform="uppercase"
          fontWeight="600"
        >
          {agent.status}
        </Badge>
      </HStack>

      <Box mb={3}>
        <SkillBubbles nodes={nodes} />
      </Box>

      <Text fontSize="xs" color="gray.500" mb={1}>
        {nodes.filter((n) => n.type !== "agent_center").length} skill{nodes.length !== 1 ? "s" : ""}
      </Text>
      <Text fontSize="xs" color="gray.400" mb={1}>
        Updated {new Date(agent.updatedAt).toLocaleDateString()}
      </Text>
      {agent.walletAddress && (
        <HStack spacing={1} mb={1}>
          <Wallet size={10} style={{ color: "#3F2BA4" }} />
          <Text fontSize="2xs" color="purple.500" noOfLines={1} fontFamily="mono">
            {agent.walletAddress.slice(0, 6)}...{agent.walletAddress.slice(-4)}
          </Text>
        </HStack>
      )}
      {agent.workerUrl && (
        <HStack spacing={1} mb={1}>
          <ExternalLink size={10} style={{ color: "#38A169" }} />
          <Text fontSize="2xs" color="green.500" noOfLines={1}>
            {agent.workerUrl}
          </Text>
        </HStack>
      )}
      <Box mt={3}>
        <HStack spacing={2}>
          {agent.status === "live" && (
            <IconButton
              aria-label="Execute"
              icon={<Play size={16} />}
              size="sm"
              variant="solid"
              bg="green.500"
              color="white"
              _hover={{ bg: "green.600" }}
              onClick={onExecute}
            />
          )}
          <IconButton
            aria-label="Edit"
            icon={<Edit size={16} />}
            size="sm"
            variant="outline"
            borderColor="gray.300"
            color="gray.700"
            _hover={{ bg: "gray.50", borderColor: PRIMARY, color: PRIMARY }}
            onClick={onEdit}
          />
          <IconButton
            aria-label="Duplicate"
            icon={<Copy size={16} />}
            size="sm"
            variant="outline"
            borderColor="gray.300"
            color="gray.700"
            _hover={{ bg: "gray.50", borderColor: PRIMARY, color: PRIMARY }}
            onClick={onDuplicate}
          />
          <IconButton
            aria-label="Delete"
            icon={<Trash2 size={16} />}
            size="sm"
            variant="outline"
            borderColor="gray.300"
            color="red.500"
            _hover={{ bg: "red.50", borderColor: "red.300" }}
            onClick={onDelete}
          />
        </HStack>
      </Box>
    </Box>
  );
}

// ─── Animated Node Result ───

type NodeStatus = "idle" | "executing" | "done" | "error";

function AnimatedNodeResult({
  node,
  status,
  result,
  index,
}: {
  node: { id: string; type: string; label: string };
  status: NodeStatus;
  result?: Record<string, unknown>;
  index: number;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = result as any;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <Box
        bg={
          status === "executing" ? "purple.50" :
          status === "done" ? "green.50" :
          status === "error" ? "red.50" : "gray.50"
        }
        borderRadius="lg"
        p={4}
        border="2px solid"
        borderColor={
          status === "executing" ? "purple.300" :
          status === "done" ? "green.300" :
          status === "error" ? "red.300" : "gray.200"
        }
        transition="all 0.3s"
      >
        <HStack justify="space-between" mb={2}>
          <HStack>
            {status === "executing" && (
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Spinner size="xs" color="purple.500" />
              </motion.div>
            )}
            {status === "done" && <CheckCircle size={16} style={{ color: "#38A169" }} />}
            {status === "error" && <AlertCircle size={16} style={{ color: "#E53E3E" }} />}
            {status === "idle" && <Bot size={16} style={{ color: "#A0AEC0" }} />}
            <Text fontSize="sm" fontWeight="600">
              {getSkillLabel(node.type)}
            </Text>
          </HStack>
          <Badge
            colorScheme={
              status === "executing" ? "purple" :
              status === "done" ? "green" :
              status === "error" ? "red" : "gray"
            }
            fontSize="2xs"
          >
            {status === "executing" ? "Running..." :
             status === "done" ? "Complete" :
             status === "error" ? "Failed" : "Pending"}
          </Badge>
        </HStack>

        {/* Transaction result with explorer link */}
        {r?.txHash && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <Box bg="white" borderRadius="md" p={2} mt={1}>
              <HStack mb={1}>
                <CheckCircle size={12} style={{ color: "#38A169" }} />
                <Text fontSize="2xs" fontWeight="600" color="green.600">
                  {r.status === "confirmed" ? "Confirmed" : "Sent"}
                </Text>
              </HStack>
              <Text fontSize="2xs" color="gray.500">Tx Hash</Text>
              <Code fontSize="2xs" wordBreak="break-all" display="block" p={1}>
                {r.txHash}
              </Code>
              {r.tokenId && (
                <Text fontSize="xs" mt={1} color="purple.600" fontWeight="600">
                  Token ID: #{r.tokenId}
                </Text>
              )}
              <Button
                as="a"
                href={r.explorerUrl || `${BSC_TESTNET_EXPLORER_URL}/tx/${r.txHash}`}
                target="_blank"
                size="xs"
                mt={1}
                variant="link"
                color="green.600"
                rightIcon={<ExternalLink size={12} />}
              >
                View on Explorer
              </Button>
            </Box>
          </motion.div>
        )}

        {/* Balance result */}
        {r?.balance !== undefined && !r?.txHash && (
          <HStack mt={1}>
            <Text fontSize="sm" fontWeight="600">
              {formatBalance(r.balance, r.decimals || 18)}
            </Text>
            <Text fontSize="sm" color="gray.500">{r.token || "BNB"}</Text>
          </HStack>
        )}

        {/* Price result */}
        {r?.price !== undefined && (
          <Text fontSize="sm" fontWeight="600" mt={1}>
            {r.price !== null ? `$${r.price}` : "Price not available"}
            <Text as="span" color="gray.500" ml={1}>{r.token || ""}</Text>
          </Text>
        )}

        {/* Raw JSON fallback */}
        {r && !r.txHash && r.balance === undefined && r.price === undefined && status === "done" && (
          <Code fontSize="2xs" display="block" whiteSpace="pre-wrap" p={2} borderRadius="md" maxH="80px" overflow="auto" mt={1}>
            {JSON.stringify(r, null, 2)}
          </Code>
        )}

        {/* Error message */}
        {r?.error && (
          <Text fontSize="2xs" color="red.500" mt={1}>{r.error}</Text>
        )}
      </Box>
    </motion.div>
  );
}

// ─── Main Component ───

type ExecutionPhase = "fund" | "executing" | "results";

export function MyAgentsContent() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();
  const toast = useToast();
  const [agents, setAgents] = useState<AgentFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Execute state
  const [executeTarget, setExecuteTarget] = useState<AgentFromAPI | null>(null);
  const [executeInputs, setExecuteInputs] = useState<Record<string, string>>({});
  const [executionPhase, setExecutionPhase] = useState<ExecutionPhase>("fund");
  const [agentBalance, setAgentBalance] = useState<string>("0");
  const [agentBalanceLoading, setAgentBalanceLoading] = useState(false);
  const [fundingTx, setFundingTx] = useState(false);

  // Per-node animation state
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeStatus>>({});
  const [nodeResults, setNodeResults] = useState<Record<string, Record<string, unknown>>>({});
  const [executeResults, setExecuteResults] = useState<ExecuteAgentResult | null>(null);

  const { isOpen: isExecuteOpen, onOpen: onExecuteOpen, onClose: onExecuteClose } = useDisclosure();

  const fetchAgents = useCallback(async () => {
    if (!address) { setAgents([]); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const data = await listAgents(address);
      setAgents(data);
    } catch {
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchAgents();
    } else {
      setAgents([]);
      setIsLoading(false);
    }
  }, [isConnected, address, fetchAgents]);

  const handleEdit = useCallback(
    (id: string) => router.push(`/ab?id=${id}`),
    [router]
  );

  const handleDuplicate = useCallback(
    async (id: string) => {
      if (!address) return;
      const dup = await duplicateAgent(address, id);
      if (dup) {
        await fetchAgents();
        toast({ title: "Agent duplicated", status: "success", duration: 2000 });
      }
    },
    [address, toast, fetchAgents]
  );

  const handleDeleteClick = useCallback(
    (id: string) => {
      setDeleteTarget(id);
      onDeleteOpen();
    },
    [onDeleteOpen]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!address || !deleteTarget) return;
    const ok = await deleteAgent(address, deleteTarget);
    if (ok) {
      await fetchAgents();
      toast({ title: "Agent deleted", status: "info", duration: 2000 });
    }
    setDeleteTarget(null);
    onDeleteClose();
  }, [address, deleteTarget, onDeleteClose, toast, fetchAgents]);

  // ─── Balance refresh ───
  const refreshBalance = useCallback(async () => {
    if (!address || !executeTarget) return;
    setAgentBalanceLoading(true);
    try {
      const bal = await getAgentBalance(address, executeTarget.id);
      setAgentBalance(bal.balanceFormatted);
    } catch {
      setAgentBalance("0");
    } finally {
      setAgentBalanceLoading(false);
    }
  }, [address, executeTarget]);

  // ─── Fund agent wallet ───
  const handleFundAgent = useCallback(async () => {
    if (!walletClient || !executeTarget?.walletAddress) {
      toast({ title: "Wallet not ready", status: "error", duration: 3000 });
      return;
    }
    setFundingTx(true);
    try {
      const hash = await walletClient.sendTransaction({
        to: executeTarget.walletAddress as `0x${string}`,
        value: parseEther("0.1"),
        chain: undefined,
      });
      toast({ title: "Funded!", description: `Sent 0.1 BNB — tx: ${hash.slice(0, 16)}...`, status: "success", duration: 4000 });
      // Wait a moment then refresh balance
      setTimeout(() => refreshBalance(), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Funding failed", description: msg.slice(0, 200), status: "error", duration: 5000 });
    } finally {
      setFundingTx(false);
    }
  }, [walletClient, executeTarget, toast, refreshBalance]);

  // ─── Execute click (open modal) ───
  const handleExecuteClick = useCallback(async (agent: AgentFromAPI) => {
    setExecuteTarget(agent);
    setExecutionPhase("fund");
    setExecuteResults(null);
    setNodeStatuses({});
    setNodeResults({});
    setAgentBalance("0");

    // Pre-fill inputs from canvas config
    const inputs: Record<string, string> = {};
    for (const node of agent.canvasJson?.nodes ?? []) {
      if (node.config) {
        for (const [k, v] of Object.entries(node.config)) {
          if (v) inputs[k] = v;
        }
      }
    }
    setExecuteInputs(inputs);
    onExecuteOpen();

    // Fetch agent balance
    if (agent.walletAddress && address) {
      setAgentBalanceLoading(true);
      try {
        const bal = await getAgentBalance(address, agent.id);
        setAgentBalance(bal.balanceFormatted);
      } catch {
        setAgentBalance("0");
      } finally {
        setAgentBalanceLoading(false);
      }
    }
  }, [address, onExecuteOpen]);

  // ─── Execute run (animated) ───
  const handleExecuteRun = useCallback(async () => {
    if (!address || !executeTarget) return;
    setExecutionPhase("executing");

    const nodes = executeTarget.canvasJson?.nodes?.filter((n) => n.type !== "agent_center") ?? [];

    // Set all nodes to idle
    const initialStatuses: Record<string, NodeStatus> = {};
    nodes.forEach((n) => { initialStatuses[n.id] = "idle"; });
    setNodeStatuses(initialStatuses);
    setNodeResults({});

    // Execute on server
    try {
      const result = await executeAgent(address, executeTarget.id, executeInputs);
      setExecuteResults(result);

      // Animate results one by one with delays
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        setNodeStatuses((prev) => ({ ...prev, [node.id]: "executing" }));
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));

        const nodeResult = result.results[node.id] as Record<string, unknown> | undefined;
        const hasError = !!nodeResult?.error;
        setNodeStatuses((prev) => ({ ...prev, [node.id]: hasError ? "error" : "done" }));
        if (nodeResult) {
          setNodeResults((prev) => ({ ...prev, [node.id]: nodeResult }));
        }
        await new Promise((r) => setTimeout(r, 300));
      }

      setExecutionPhase("results");
    } catch (err) {
      toast({ title: "Execution failed", description: String(err), status: "error", duration: 5000 });
      setExecutionPhase("fund");
    }
  }, [address, executeTarget, executeInputs, toast]);

  const handleExecuteClose = useCallback(() => {
    setExecuteTarget(null);
    setExecuteResults(null);
    setNodeStatuses({});
    setNodeResults({});
    setExecuteInputs({});
    setExecutionPhase("fund");
    onExecuteClose();
  }, [onExecuteClose]);

  // ─── Render states ───

  if (isLoading) {
    return (
      <AppShell>
        <Box py={{ base: 10, md: 16 }} px={{ base: 4, md: 6 }} minH="calc(100vh - 65px)" position="relative">
          <FloatingFacehashes section="myagents" />
          <Container maxW="5xl" position="relative" zIndex={1}>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} h="180px" borderRadius="lg" />
              ))}
            </SimpleGrid>
          </Container>
        </Box>
      </AppShell>
    );
  }

  if (!isConnected) {
    return (
      <AppShell>
        <Box py={{ base: 10, md: 16 }} px={{ base: 4, md: 6 }} minH="calc(100vh - 65px)" position="relative">
          <FloatingFacehashes section="myagents" />
          <Container maxW="lg" position="relative" zIndex={1}>
            <VStack spacing={8} align="stretch" textAlign="center" bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={{ base: 8, md: 12 }} boxShadow="card">
              <Box w="14" h="14" borderRadius="xl" bg="gray.100" display="flex" alignItems="center" justifyContent="center" mx="auto">
                <Wallet size={28} style={{ color: "#3F2BA4" }} />
              </Box>
              <Heading size="lg" fontWeight="600" color="gray.900">Connect Wallet</Heading>
              <Text color="gray.600" fontSize="md" maxW="md" mx="auto" lineHeight="tall">
                Connect your wallet to see agents you&apos;ve built.
              </Text>
            </VStack>
          </Container>
        </Box>
      </AppShell>
    );
  }

  if (agents.length === 0) {
    return (
      <AppShell>
        <Box py={{ base: 10, md: 16 }} px={{ base: 4, md: 6 }} minH="calc(100vh - 65px)" position="relative">
          <FloatingFacehashes section="myagents" />
          <Container maxW="lg" position="relative" zIndex={1}>
            <VStack spacing={8} align="stretch" textAlign="center" bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={{ base: 8, md: 12 }} boxShadow="card">
              <Box w="14" h="14" borderRadius="xl" bg="gray.100" display="flex" alignItems="center" justifyContent="center" mx="auto">
                <Bot size={28} style={{ color: "#3F2BA4" }} />
              </Box>
              <Heading size="lg" fontWeight="600" color="gray.900">My Agents</Heading>
              <Text color="gray.600" fontSize="md" maxW="md" mx="auto" lineHeight="tall">
                Agents you&apos;ve built will appear here.
              </Text>
              <Button as={Link} href="/ab" leftIcon={<Plus size={18} />} bg={PRIMARY} color="white" size="lg" _hover={{ bg: "#352396", color: "white" }} borderRadius="lg" fontWeight="600">
                Open Agent Builder
              </Button>
            </VStack>
          </Container>
        </Box>
      </AppShell>
    );
  }

  const execNodes = executeTarget?.canvasJson?.nodes?.filter((n) => n.type !== "agent_center") ?? [];

  return (
    <AppShell>
      <Box py={{ base: 10, md: 16 }} px={{ base: 4, md: 6 }} minH="calc(100vh - 65px)" position="relative">
        <FloatingFacehashes section="myagents" />
        <Container maxW="5xl" position="relative" zIndex={1}>
          <HStack justify="space-between" align="center" mb={8}>
            <Heading size="lg" fontWeight="600" color="gray.900">My Agents</Heading>
            <Button as={Link} href="/ab" leftIcon={<Plus size={16} />} bg={PRIMARY} color="white" size="sm" _hover={{ bg: "#352396" }} borderRadius="lg" fontWeight="600">
              New Agent
            </Button>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={() => handleEdit(agent.id)}
                onDuplicate={() => handleDuplicate(agent.id)}
                onDelete={() => handleDeleteClick(agent.id)}
                onExecute={() => handleExecuteClick(agent)}
              />
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Delete dialog */}
      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">Delete Agent</AlertDialogHeader>
            <AlertDialogBody>Are you sure? This cannot be undone.</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>Cancel</Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Execute modal — 3 phases */}
      <Modal isOpen={isExecuteOpen} onClose={handleExecuteClose} size="lg" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <motion.div animate={{ rotate: executionPhase === "executing" ? [0, 360] : 0 }} transition={{ repeat: executionPhase === "executing" ? Infinity : 0, duration: 2, ease: "linear" }}>
                <Bot size={20} style={{ color: "#3F2BA4" }} />
              </motion.div>
              <Text>{executeTarget?.name}</Text>
              {executionPhase === "executing" && (
                <Badge colorScheme="purple" fontSize="2xs" ml={2}>Executing</Badge>
              )}
              {executionPhase === "results" && (
                <Badge colorScheme="green" fontSize="2xs" ml={2}>Complete</Badge>
              )}
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <AnimatePresence mode="wait">
              {/* ─── PHASE 1: Fund ─── */}
              {executionPhase === "fund" && executeTarget && (
                <motion.div key="fund" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <VStack spacing={4} align="stretch">
                    {/* Agent Wallet */}
                    {executeTarget.walletAddress ? (
                      <Box bg="purple.50" borderRadius="lg" p={4} border="1px solid" borderColor="purple.200">
                        <Text fontSize="xs" fontWeight="700" color="purple.700" mb={2} textTransform="uppercase" letterSpacing="wide">
                          Agent Wallet
                        </Text>
                        <HStack>
                          <Bot size={18} style={{ color: "#3F2BA4" }} />
                          <Code fontSize="xs" p={1.5} borderRadius="md" bg="white" flex={1} wordBreak="break-all">
                            {executeTarget.walletAddress}
                          </Code>
                        </HStack>
                        <HStack mt={3} justify="space-between">
                          <HStack>
                            <Text fontSize="sm" color="gray.600">Balance:</Text>
                            {agentBalanceLoading ? (
                              <Spinner size="xs" />
                            ) : (
                              <Text fontSize="sm" fontWeight="700">
                                {parseFloat(agentBalance).toFixed(4)} BNB
                              </Text>
                            )}
                          </HStack>
                          <HStack>
                            <IconButton
                              aria-label="Refresh"
                              icon={<RefreshCw size={14} />}
                              size="xs"
                              variant="ghost"
                              onClick={refreshBalance}
                              isLoading={agentBalanceLoading}
                            />
                            <Button
                              size="xs"
                              bg="purple.500"
                              color="white"
                              _hover={{ bg: "purple.600" }}
                              onClick={handleFundAgent}
                              isLoading={fundingTx}
                              loadingText="Sending..."
                            >
                              Fund 0.1 BNB
                            </Button>
                          </HStack>
                        </HStack>
                      </Box>
                    ) : (
                      <Box bg="yellow.50" borderRadius="lg" p={4} border="1px solid" borderColor="yellow.200">
                        <Text fontSize="sm" color="yellow.800" fontWeight="600">
                          No agent wallet. Re-create this agent to generate one.
                        </Text>
                      </Box>
                    )}

                    {/* Skills */}
                    <Box>
                      <Text fontSize="xs" fontWeight="600" color="gray.500" mb={2} textTransform="uppercase">
                        Skills ({execNodes.length})
                      </Text>
                      <Flex flexWrap="wrap" gap={1.5}>
                        {execNodes.map((n) => (
                          <Badge key={n.id} colorScheme="purple" variant="subtle" fontSize="2xs">
                            {getSkillLabel(n.type)}
                          </Badge>
                        ))}
                      </Flex>
                    </Box>

                    <Divider />

                    {/* Input fields */}
                    <Box>
                      <Text fontSize="xs" fontWeight="600" color="gray.500" mb={2} textTransform="uppercase">
                        Execution Inputs
                      </Text>
                      <VStack spacing={2} align="stretch">
                        <Box>
                          <Text fontSize="2xs" color="gray.500" mb={1}>Wallet Address (recipient)</Text>
                          <Input
                            size="sm"
                            value={executeInputs.walletAddress ?? address ?? ""}
                            onChange={(e) => setExecuteInputs((p) => ({ ...p, walletAddress: e.target.value }))}
                            placeholder="0x..."
                          />
                        </Box>
                        {execNodes.some((n) => n.type === "fetch_balance") && (
                          <Box>
                            <Text fontSize="2xs" color="gray.500" mb={1}>Token (empty = BNB)</Text>
                            <Input
                              size="sm"
                              value={executeInputs.token ?? ""}
                              onChange={(e) => setExecuteInputs((p) => ({ ...p, token: e.target.value }))}
                              placeholder="BNB or token contract address"
                            />
                          </Box>
                        )}
                        {execNodes.some((n) => n.type === "fetch_price") && (
                          <Box>
                            <Text fontSize="2xs" color="gray.500" mb={1}>Token Address for Price (empty = BNB)</Text>
                            <Input
                              size="sm"
                              value={executeInputs.tokenAddress ?? ""}
                              onChange={(e) => setExecuteInputs((p) => ({ ...p, tokenAddress: e.target.value }))}
                              placeholder="0x... or leave empty for BNB"
                            />
                          </Box>
                        )}
                        {execNodes.some((n) => n.type === "mint_token" || n.type === "mint_nft") && (
                          <>
                            <Box>
                              <Text fontSize="2xs" color="gray.500" mb={1}>Recipient (defaults to your wallet)</Text>
                              <Input
                                size="sm"
                                value={executeInputs.recipient ?? ""}
                                onChange={(e) => setExecuteInputs((p) => ({ ...p, recipient: e.target.value }))}
                                placeholder={address ?? "0x..."}
                              />
                            </Box>
                            {execNodes.some((n) => n.type === "mint_token") && (
                              <Box>
                                <Text fontSize="2xs" color="gray.500" mb={1}>Mint Amount (tokens)</Text>
                                <Input
                                  size="sm"
                                  value={executeInputs.amount ?? "1000"}
                                  onChange={(e) => setExecuteInputs((p) => ({ ...p, amount: e.target.value }))}
                                  placeholder="1000"
                                />
                              </Box>
                            )}
                          </>
                        )}
                      </VStack>
                    </Box>

                    <Button
                      bg="green.500"
                      color="white"
                      _hover={{ bg: "green.600" }}
                      leftIcon={<Play size={16} />}
                      onClick={handleExecuteRun}
                      size="lg"
                      isDisabled={!executeTarget.walletAddress || parseFloat(agentBalance) < 0.001}
                    >
                      Execute Agent
                    </Button>
                    {executeTarget.walletAddress && parseFloat(agentBalance) < 0.001 && (
                      <Text fontSize="2xs" color="orange.500" textAlign="center">
                        Fund the agent with at least 0.001 BNB for gas fees
                      </Text>
                    )}
                  </VStack>
                </motion.div>
              )}

              {/* ─── PHASE 2: Executing (animated) ─── */}
              {executionPhase === "executing" && (
                <motion.div key="executing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="center" mb={2}>
                      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <Bot size={24} style={{ color: "#3F2BA4" }} />
                      </motion.div>
                      <Text fontSize="sm" color="purple.600" fontWeight="600">
                        Agent is executing skills...
                      </Text>
                    </HStack>
                    {execNodes.map((node, i) => (
                      <AnimatedNodeResult
                        key={node.id}
                        node={node}
                        status={nodeStatuses[node.id] || "idle"}
                        result={nodeResults[node.id]}
                        index={i}
                      />
                    ))}
                  </VStack>
                </motion.div>
              )}

              {/* ─── PHASE 3: Results ─── */}
              {executionPhase === "results" && (
                <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <VStack spacing={3} align="stretch">
                    <Box bg="green.50" borderRadius="lg" p={4} border="1px solid" borderColor="green.200" textAlign="center">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10 }}>
                        <CheckCircle size={32} style={{ color: "#38A169", margin: "0 auto 8px" }} />
                      </motion.div>
                      <Text fontSize="md" fontWeight="700" color="green.700">
                        Execution Complete
                      </Text>
                      <Text fontSize="xs" color="green.600">
                        {executeResults?.nodeCount} skill{(executeResults?.nodeCount ?? 0) > 1 ? "s" : ""} executed
                      </Text>
                    </Box>

                    {execNodes.map((node, i) => (
                      <AnimatedNodeResult
                        key={node.id}
                        node={node}
                        status={nodeStatuses[node.id] || "done"}
                        result={nodeResults[node.id]}
                        index={i}
                      />
                    ))}

                    <Button variant="ghost" onClick={handleExecuteClose} color="gray.500" mt={2}>
                      Close
                    </Button>
                  </VStack>
                </motion.div>
              )}
            </AnimatePresence>
          </ModalBody>
        </ModalContent>
      </Modal>
    </AppShell>
  );
}
