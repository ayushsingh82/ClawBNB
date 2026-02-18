"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Select,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { useState, useCallback, useRef, useEffect, useMemo, Suspense } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "../AppShell";
import {
  Coins,
  Database,
  Mail,
  Wrench,
  X,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  Bot,
  Search,
  Star,
  Save,
  Rocket,
  GitBranch,
  Globe,
  DollarSign,
  User,
  BrainCircuit,
  Bell,
  HardDrive,
  Zap,
} from "lucide-react";
import {
  saveAgent,
  getAgent,
  deployAgent,
  type CanvasBlock,
  type CanvasEdge,
} from "../../lib/api-client";
import { getSkillLabel } from "../../lib/skill-labels";
import { FEATURE_PRICE_USDC, x402ClientConfig } from "../../lib/x402-config";

// ─── Bauhaus palette (matches theme/index.ts) ────────────────────────────────
const BG = "#F5F0E8";
const BLACK = "#121212";
const BLUE = "#180E67";
const PURPLE_LIGHT = "#2D1F8F";
const SMALL_BOX = "#E8E4F0";

const DOTTED_BG = `radial-gradient(circle, ${BLUE}18 1px, transparent 1px)`;
const DOTTED_BG_SIZE = "22px 22px";

const AGENT_NODE_ID = "agent-node";
const AGENT_SIZE = 90;
const NODE_WIDTH = 130;
const NODE_HEIGHT = 42;

interface SidebarOperation {
  type: string;
  label: string;
  description: string;
}

interface SidebarTool {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  operations: SidebarOperation[];
}

// ─── Sidebar categories ──────────────────────────────────────────────────────
export const SIDEBAR_TOOLS: SidebarTool[] = [
  {
    type: "agent_actions",
    label: "Agent Actions",
    description: "Onchain & productivity actions",
    icon: <Zap size={18} />,
    operations: [
      { type: "mint_token", label: "Mint Token", description: "Create and mint new ERC20 tokens" },
      { type: "mint_nft", label: "Mint NFT", description: "Create and mint new NFT tokens" },
      { type: "transfer_asset", label: "Transfer Asset", description: "Transfer tokens or assets" },
      { type: "create_dao", label: "Create DAO", description: "Deploy a new DAO" },
      { type: "send_email", label: "Send Email", description: "Send emails via SMTP" },
      { type: "set_reminder", label: "Set Reminder", description: "Create calendar reminders" },
      { type: "create_task", label: "Create Task", description: "Add tasks to management" },
      { type: "schedule_meeting", label: "Schedule Meeting", description: "Book calendar meetings" },
    ],
  },
  {
    type: "agent_data",
    label: "Agent Data",
    description: "Fetch prices, balances, states",
    icon: <Database size={18} />,
    operations: [
      { type: "fetch_price", label: "Fetch Price", description: "Get token prices from DEXs" },
      { type: "fetch_states", label: "Fetch States", description: "Retrieve contract states" },
      { type: "fetch_balance", label: "Fetch Balance", description: "Get wallet token balances" },
      { type: "fetch_transactions", label: "Fetch Transactions", description: "Query transaction history" },
    ],
  },
  {
    type: "agent_logic",
    label: "Agent Logic",
    description: "Branching & loop control",
    icon: <GitBranch size={18} />,
    operations: [
      { type: "conditional", label: "Conditional", description: "Branch on conditions (if/else)" },
      { type: "loop", label: "Loop", description: "Repeat actions on schedule" },
    ],
  },
  {
    type: "agent_integrations",
    label: "Integrations",
    description: "APIs, webhooks, sub-agents",
    icon: <Globe size={18} />,
    operations: [
      { type: "api_call", label: "API Call", description: "HTTP requests to external APIs" },
      { type: "webhook_notify", label: "Webhook Notify", description: "Send webhook notifications" },
      { type: "query_user", label: "Query User", description: "Prompt user for input" },
      { type: "run_sub_agent", label: "Run Sub-Agent", description: "Invoke another agent" },
      { type: "notify_user", label: "Notify User", description: "Send notification to owner" },
      { type: "store_result", label: "Store Result", description: "Persist result for later" },
    ],
  },
  {
    type: "agent_payments",
    label: "Payments",
    description: "x402 micropayments",
    icon: <DollarSign size={18} />,
    operations: [
      { type: "x402_pay", label: "x402 Pay", description: "Send micropayment via x402" },
    ],
  },
];

// Block config field definitions
interface BlockConfigField {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  placeholder: string;
  options?: string[];
}

const BLOCK_CONFIG_FIELDS: Record<string, BlockConfigField[]> = {
  mint_token: [
    { key: "tokenName", label: "Token Name", type: "text", placeholder: "e.g. MyToken" },
    { key: "symbol", label: "Symbol", type: "text", placeholder: "e.g. MTK" },
    { key: "amount", label: "Initial Supply", type: "number", placeholder: "e.g. 1000000" },
  ],
  mint_nft: [
    { key: "collectionName", label: "Collection Name", type: "text", placeholder: "e.g. CoolNFTs" },
    { key: "metadataUri", label: "Metadata URI", type: "text", placeholder: "ipfs://..." },
  ],
  transfer_asset: [
    { key: "recipient", label: "Recipient Address", type: "text", placeholder: "0x..." },
    { key: "amount", label: "Amount", type: "number", placeholder: "e.g. 100" },
    { key: "token", label: "Token", type: "text", placeholder: "e.g. BNB or token address" },
  ],
  create_dao: [
    { key: "daoName", label: "DAO Name", type: "text", placeholder: "e.g. MyDAO" },
    { key: "votingPeriod", label: "Voting Period (hours)", type: "number", placeholder: "e.g. 72" },
  ],
  fetch_price: [
    { key: "tokenAddress", label: "Token Address", type: "text", placeholder: "0x..." },
    { key: "dex", label: "DEX", type: "text", placeholder: "e.g. Uniswap" },
  ],
  fetch_balance: [
    { key: "walletAddress", label: "Wallet Address", type: "text", placeholder: "0x... or leave empty for self" },
    { key: "token", label: "Token", type: "text", placeholder: "e.g. BNB" },
  ],
  fetch_states: [
    { key: "contractAddress", label: "Contract Address", type: "text", placeholder: "0x..." },
    { key: "method", label: "Method Name", type: "text", placeholder: "e.g. balanceOf" },
  ],
  fetch_transactions: [
    { key: "walletAddress", label: "Wallet Address", type: "text", placeholder: "0x..." },
    { key: "limit", label: "Limit", type: "number", placeholder: "e.g. 10" },
  ],
  send_email: [
    { key: "to", label: "Recipient Email", type: "text", placeholder: "user@example.com" },
    { key: "subject", label: "Subject", type: "text", placeholder: "Alert: ..." },
    { key: "body", label: "Body Template", type: "text", placeholder: "Hello {{name}}..." },
  ],
  set_reminder: [
    { key: "message", label: "Reminder Message", type: "text", placeholder: "Check balance..." },
    { key: "delayMinutes", label: "Delay (minutes)", type: "number", placeholder: "e.g. 60" },
  ],
  create_task: [
    { key: "taskTitle", label: "Task Title", type: "text", placeholder: "Review transactions" },
    { key: "priority", label: "Priority", type: "select", placeholder: "Select", options: ["Low", "Medium", "High"] },
  ],
  schedule_meeting: [
    { key: "title", label: "Meeting Title", type: "text", placeholder: "Weekly sync" },
    { key: "duration", label: "Duration (minutes)", type: "number", placeholder: "e.g. 30" },
  ],
  conditional: [
    { key: "condition", label: "Condition Expression", type: "text", placeholder: "e.g. balance > 100" },
    { key: "trueBranch", label: "If True", type: "text", placeholder: "Action to take" },
    { key: "falseBranch", label: "If False", type: "text", placeholder: "Fallback action" },
  ],
  loop: [
    { key: "iterations", label: "Iterations", type: "number", placeholder: "e.g. 10" },
    { key: "interval", label: "Interval (seconds)", type: "number", placeholder: "e.g. 60" },
  ],
  api_call: [
    { key: "url", label: "URL", type: "text", placeholder: "https://api.example.com/data" },
    { key: "method", label: "HTTP Method", type: "select", placeholder: "Select", options: ["GET", "POST", "PUT", "DELETE"] },
    { key: "headers", label: "Headers (JSON)", type: "text", placeholder: '{"Authorization": "Bearer ..."}' },
  ],
  webhook_notify: [
    { key: "webhookUrl", label: "Webhook URL", type: "text", placeholder: "https://hooks.example.com/..." },
    { key: "payload", label: "Payload Template", type: "text", placeholder: '{"event": "..."}' },
  ],
  x402_pay: [
    { key: "recipientUrl", label: "Payment URL", type: "text", placeholder: "https://service.com/api/premium" },
    { key: "amount", label: "Amount (USDC)", type: "number", placeholder: "e.g. 0.001" },
  ],
  query_user: [
    { key: "prompt", label: "Prompt", type: "text", placeholder: "e.g. Enter your wallet address" },
    { key: "inputType", label: "Input Type", type: "select", placeholder: "Select", options: ["text", "number", "address"] },
  ],
  run_sub_agent: [
    { key: "agentId", label: "Sub-Agent ID", type: "text", placeholder: "Agent ID or name" },
    { key: "inputData", label: "Input Data (JSON)", type: "text", placeholder: '{"key": "value"}' },
  ],
  notify_user: [
    { key: "channel", label: "Channel", type: "select", placeholder: "Select", options: ["Push", "Email", "SMS"] },
    { key: "message", label: "Message", type: "text", placeholder: "Your agent completed..." },
  ],
  store_result: [
    { key: "key", label: "Storage Key", type: "text", placeholder: "e.g. latest_price" },
    { key: "ttl", label: "TTL (seconds)", type: "number", placeholder: "e.g. 3600" },
  ],
};

function getIconForType(type: string, size = 16): React.ReactNode {
  if (["mint_token", "mint_nft", "transfer_asset", "create_dao"].includes(type)) return <Coins size={size} />;
  if (["fetch_price", "fetch_states", "fetch_balance", "fetch_transactions"].includes(type)) return <Database size={size} />;
  if (["send_email", "set_reminder", "create_task", "schedule_meeting"].includes(type)) return <Mail size={size} />;
  if (["conditional", "loop"].includes(type)) return <GitBranch size={size} />;
  if (["api_call", "webhook_notify"].includes(type)) return <Globe size={size} />;
  if (["x402_pay"].includes(type)) return <DollarSign size={size} />;
  if (type === "query_user") return <User size={size} />;
  if (type === "run_sub_agent") return <BrainCircuit size={size} />;
  if (type === "notify_user") return <Bell size={size} />;
  if (type === "store_result") return <HardDrive size={size} />;
  return <Wrench size={size} />;
}

// ─── Draggable skill card ────────────────────────────────────────────────────
function DraggableOperationCard({
  type, label, description, isFavorite, onToggleFavorite,
}: {
  type: string; label: string; description: string;
  isFavorite: boolean; onToggleFavorite: () => void;
}) {
  const payload = JSON.stringify({ type, label });
  return (
    <Box
      as="div"
      draggable
      onDragStart={(e: React.DragEvent) => {
        e.dataTransfer.setData("application/json", payload);
        e.dataTransfer.setData("text/plain", payload);
        e.dataTransfer.effectAllowed = "copy";
      }}
      cursor="grab"
      _active={{ cursor: "grabbing", opacity: 0.7 }}
      bg="white"
      border="2px solid"
      borderColor={BLACK}
      borderRadius="md"
      px={2.5}
      py={1.5}
      boxShadow={`2px 2px 0 0 ${PURPLE_LIGHT}`}
      _hover={{ transform: "translateY(-1px)", boxShadow: `3px 3px 0 0 ${PURPLE_LIGHT}` }}
      transition="all 0.15s"
      userSelect="none"
    >
      <HStack justify="space-between" align="center">
        <HStack spacing={2} flex={1}>
          <Box color={BLUE} flexShrink={0}>{getIconForType(type, 14)}</Box>
          <Box flex={1}>
            <Text fontWeight="bold" fontSize="xs" color={BLACK} pointerEvents="none">
              {label}
            </Text>
            <Text fontSize="2xs" color="gray.500" noOfLines={1} pointerEvents="none">
              {description}
            </Text>
          </Box>
        </HStack>
        <HStack spacing={1.5} flexShrink={0}>
          <Box
            as="button"
            type="button"
            p={0.5}
            borderRadius="sm"
            _hover={{ bg: SMALL_BOX }}
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); onToggleFavorite(); }}
          >
            <Star size={11} fill={isFavorite ? BLUE : "none"} color={isFavorite ? BLUE : "#A0AEC0"} />
          </Box>
        </HStack>
      </HStack>
    </Box>
  );
}

// ─── Sidebar category ────────────────────────────────────────────────────────
function SidebarCategory({
  tool, expanded, onToggle, favorites, onToggleFavorite,
}: {
  tool: SidebarTool; expanded: boolean; onToggle: () => void;
  favorites: Set<string>; onToggleFavorite: (type: string) => void;
}) {
  return (
    <Box border="2px solid" borderColor={BLACK} borderRadius="lg" bg="white" boxShadow={expanded ? `3px 3px 0 0 ${PURPLE_LIGHT}` : "none"} transition="box-shadow 0.2s">
      <Box
        onClick={onToggle}
        px={3}
        py={2.5}
        cursor="pointer"
        _hover={{ bg: SMALL_BOX }}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        role="button"
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
      >
        <HStack spacing={2}>
          <Box color={BLUE}>{tool.icon}</Box>
          <Box>
            <Text fontWeight="bold" fontSize="sm" color={BLACK} fontFamily="serif">{tool.label}</Text>
            <Text fontSize="2xs" color="gray.500">{tool.operations.length} skill{tool.operations.length !== 1 ? "s" : ""}</Text>
          </Box>
        </HStack>
        <Box color={BLACK}>{expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</Box>
      </Box>
      {expanded && (
        <VStack spacing={1.5} align="stretch" p={2} pt={0} borderTop="1px solid" borderColor="gray.200">
          <Box h={1} />
          {tool.operations.map((op) => (
            <DraggableOperationCard
              key={op.type}
              type={op.type}
              label={op.label}
              description={op.description}
              isFavorite={favorites.has(op.type)}
              onToggleFavorite={() => onToggleFavorite(op.type)}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
}

// ─── Canvas node ─────────────────────────────────────────────────────────────
function CanvasNode({
  node, onRemove, onMove, onClick,
}: {
  node: CanvasBlock;
  onRemove: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onClick: (id: string) => void;
}) {
  const icon = getIconForType(node.type, 15);
  const dragRef = useRef({ startX: 0, startY: 0, nodeX: 0, nodeY: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, nodeX: node.x, nodeY: node.y };
  }, [node.x, node.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    onMove(node.id, dragRef.current.nodeX + (e.clientX - dragRef.current.startX), dragRef.current.nodeY + (e.clientY - dragRef.current.startY));
  }, [node.id, onMove]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (Math.abs(e.clientX - dragRef.current.startX) < 5 && Math.abs(e.clientY - dragRef.current.startY) < 5) onClick(node.id);
  }, [node.id, onClick]);

  const isConfigured = node.config && Object.keys(node.config).some((k) => node.config![k]);

  return (
    <Box
      position="absolute"
      left={node.x}
      top={node.y}
      bg="white"
      border="2px solid"
      borderColor={BLACK}
      borderRadius="lg"
      display="flex"
      alignItems="center"
      gap={2}
      px={3}
      py={2}
      minW={`${NODE_WIDTH}px`}
      zIndex={2}
      cursor="grab"
      _active={{ cursor: "grabbing" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      boxShadow={`3px 3px 0 0 ${PURPLE_LIGHT}`}
      _hover={{ transform: "translateY(-1px)", boxShadow: `4px 4px 0 0 ${PURPLE_LIGHT}` }}
      transition="all 0.15s"
    >
      <Box color={BLUE} flexShrink={0}>{icon}</Box>
      <Text fontWeight="bold" fontSize="xs" color={BLACK} noOfLines={1} flex={1}>{node.label}</Text>
      {isConfigured && <Box w="6px" h="6px" borderRadius="full" bg="bauhaus.green" flexShrink={0} title="Configured" />}
      <Box
        as="button"
        type="button"
        p={1}
        borderRadius="md"
        _hover={{ bg: "red.50" }}
        onClick={(e: React.MouseEvent) => { e.stopPropagation(); onRemove(node.id); }}
        aria-label="Remove"
        color="gray.400"
        flexShrink={0}
      >
        <X size={12} />
      </Box>
    </Box>
  );
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

// ─── x402 payment helper ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VWalletClient = { signTypedData: (args: any) => Promise<`0x${string}`> };
type DeployResult = "paid" | "server_error" | "rejected" | "insufficient_funds" | "error";

async function payForDeploy(skillCount: number, address: `0x${string}`, walletClient: VWalletClient): Promise<DeployResult> {
  try {
    const { wrapFetchWithPayment } = await import("@x402/fetch");
    const { ExactEvmScheme } = await import("@x402/evm");
    const { x402Client } = await import("@x402/core/client");

    const evmSigner = {
      address,
      signTypedData: async (msg: {
        domain: Record<string, unknown>;
        types: Record<string, unknown>;
        primaryType: string;
        message: Record<string, unknown>;
      }) => {
        return walletClient.signTypedData({
          domain: msg.domain as Parameters<typeof walletClient.signTypedData>[0]["domain"],
          types: msg.types as Parameters<typeof walletClient.signTypedData>[0]["types"],
          primaryType: msg.primaryType,
          message: msg.message,
        });
      },
    };

    const exactScheme = new ExactEvmScheme(evmSigner);
    const client = new x402Client().register(x402ClientConfig.chainId, exactScheme);
    const paymentFetch = wrapFetchWithPayment(fetch, client);

    const res = await paymentFetch(`/api/agents/deploy?skills=${skillCount}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) return "paid";

    // Parse x402 error details from the response
    if (res.status === 402) {
      const hdr = res.headers.get("payment-required") || res.headers.get("x-payment");
      if (hdr) {
        try {
          const parsed = JSON.parse(atob(hdr));
          const errStr = JSON.stringify(parsed).toLowerCase();
          if (errStr.includes("insufficient_funds") || errStr.includes("insufficient")) return "insufficient_funds";
        } catch { /* ignore parse errors */ }
      }
      // Try reading body for error details
      try {
        const body = await res.json();
        const errStr = JSON.stringify(body).toLowerCase();
        if (errStr.includes("insufficient")) return "insufficient_funds";
        console.error("[x402] Payment failed (402):", body);
      } catch { /* ignore */ }
      return "error";
    }

    // Server misconfigured (PAY_TO_ADDRESS missing, etc.)
    if (res.status === 500) return "server_error";

    console.error("[x402] Unexpected status:", res.status);
    return "error";
  } catch (err) {
    console.error("[x402] Payment error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("rejected") || msg.includes("denied") || msg.includes("User rejected")) return "rejected";
    if (msg.includes("insufficient") || msg.includes("INSUFFICIENT")) return "insufficient_funds";
    return "error";
  }
}

// ─── Main component ──────────────────────────────────────────────────────────
function AgentBuilderInner() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number } | null>(null);
  const [nodes, setNodes] = useState<CanvasBlock[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [nextId, setNextId] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set(["agent_actions"]));
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [agentName, setAgentName] = useState("Untitled Agent");
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [deployLoading, setDeployLoading] = useState(false);

  const { isOpen: isConfigOpen, onOpen: onConfigOpen, onClose: onConfigClose } = useDisclosure();
  const { isOpen: isDeployOpen, onOpen: onDeployOpen, onClose: onDeployClose } = useDisclosure();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();

  useEffect(() => { try { const raw = localStorage.getItem("agentclaw_favorites"); if (raw) setFavorites(new Set(JSON.parse(raw))); } catch { /* ignore */ } }, []);

  const toggleFavorite = useCallback((type: string) => {
    setFavorites((prev) => { const next = new Set(prev); if (next.has(type)) next.delete(type); else next.add(type); localStorage.setItem("agentclaw_favorites", JSON.stringify([...next])); return next; });
  }, []);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id && address) {
      getAgent(address, id).then((agent) => {
        if (agent) {
          const nodes = agent.canvasJson?.nodes ?? [];
          const edges = agent.canvasJson?.edges ?? [];
          setCurrentAgentId(agent.id);
          setAgentName(agent.name);
          setNodes(nodes);
          setEdges(edges);
          const maxNodeNum = nodes.reduce((max, n) => { const num = parseInt(n.id.replace("node-", ""), 10); return isNaN(num) ? max : Math.max(max, num); }, -1);
          setNextId(maxNodeNum + 1);
        }
      });
    }
  }, [searchParams, address]);

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return SIDEBAR_TOOLS;
    const q = searchQuery.toLowerCase();
    return SIDEBAR_TOOLS.map((t) => ({ ...t, operations: t.operations.filter((op) => op.label.toLowerCase().includes(q) || op.type.includes(q)) })).filter((t) => t.operations.length > 0);
  }, [searchQuery]);

  const favoriteOps = useMemo(() => favorites.size === 0 ? [] : SIDEBAR_TOOLS.flatMap((t) => t.operations).filter((op) => favorites.has(op.type)), [favorites]);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;
  const distinctSkillTypes = useMemo(() => [...new Set(nodes.map((n) => n.type))], [nodes]);
  const deployTotal = useMemo(() => (distinctSkillTypes.length * parseFloat(FEATURE_PRICE_USDC)).toFixed(1), [distinctSkillTypes]);

  useEffect(() => { const el = contentRef.current; if (!el) return; const update = () => setCanvasSize({ w: el.offsetWidth, h: el.offsetHeight }); update(); const ro = new ResizeObserver(update); ro.observe(el); return () => ro.disconnect(); }, []);

  const agentX = canvasSize ? (canvasSize.w - AGENT_SIZE) / 2 : 0;
  const agentY = canvasSize ? (canvasSize.h - AGENT_SIZE) / 2 : 0;
  const agentCx = canvasSize ? canvasSize.w / 2 : 0;
  const agentCy = canvasSize ? canvasSize.h / 2 : 0;

  const addNodeToCanvas = useCallback((type: string, label: string, x: number, y: number) => {
    const id = `node-${nextId}`; setNodes((p) => [...p, { id, type, label, x, y }]); setEdges((p) => [...p, { id: `edge-${AGENT_NODE_ID}-${id}`, source: AGENT_NODE_ID, target: id }]); setNextId((n) => n + 1);
  }, [nextId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); const raw = e.dataTransfer.getData("application/json"); if (!raw) return;
    try { const { type, label } = JSON.parse(raw); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); addNodeToCanvas(type, label, (e.clientX - rect.left) / zoom - NODE_WIDTH / 2, (e.clientY - rect.top) / zoom - NODE_HEIGHT / 2); } catch { /* ignore */ }
  }, [zoom, addNodeToCanvas]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }, []);
  const removeNode = useCallback((id: string) => { setNodes((p) => p.filter((n) => n.id !== id)); setEdges((p) => p.filter((e) => e.target !== id)); }, []);
  const moveNode = useCallback((id: string, x: number, y: number) => { setNodes((p) => p.map((n) => n.id === id ? { ...n, x, y } : n)); }, []);
  const updateNodeConfig = useCallback((nodeId: string, key: string, value: string) => { setNodes((p) => p.map((n) => n.id !== nodeId ? n : { ...n, config: { ...n.config, [key]: value } })); }, []);
  const zoomIn = useCallback(() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP)), []);
  const toggleCategory = useCallback((type: string) => { setExpandedTools((p) => { const n = new Set(p); if (n.has(type)) n.delete(type); else n.add(type); return n; }); }, []);
  const expandAll = useCallback(() => setExpandedTools(new Set(SIDEBAR_TOOLS.map((t) => t.type))), []);
  const collapseAll = useCallback(() => setExpandedTools(new Set()), []);

  const handleSave = useCallback(async () => {
    if (!isConnected || !address) { toast({ title: "Connect wallet to save", status: "warning", duration: 3000 }); return; }
    const result = await saveAgent(address, { id: currentAgentId || undefined, name: agentName, nodes, edges });
    if ("agent" in result) { setCurrentAgentId(result.agent.id); toast({ title: "Agent saved!", status: "success", duration: 2000 }); }
    else { toast({ title: "Failed to save agent", description: result.hint ?? result.error, status: "error", duration: 5000 }); }
  }, [isConnected, address, currentAgentId, agentName, nodes, edges, toast]);

  const handleDeployClick = useCallback(() => {
    if (!isConnected || !address) { toast({ title: "Connect wallet to deploy", status: "warning", duration: 3000 }); return; }
    if (nodes.length === 0) { toast({ title: "Add blocks first", status: "warning", duration: 3000 }); return; }
    onDeployOpen();
  }, [isConnected, address, nodes, toast, onDeployOpen]);

  const handleDeployConfirm = useCallback(async () => {
    if (!address) return;
    if (!walletClient) {
      toast({ title: "Wallet not ready", description: "Please make sure you are connected to BSC Testnet (chain 97).", status: "error", duration: 5000 });
      return;
    }
    setDeployLoading(true);
    try {
      // 1. x402 payment first — without payment we do not touch the backend
      const r = await payForDeploy(distinctSkillTypes.length, address as `0x${string}`, walletClient);
      if (r !== "paid") {
        if (r === "server_error") {
          toast({ title: "Payment server error", description: "Check that the dev server is running and see the terminal for details.", status: "error", duration: 5000 });
        } else if (r === "rejected") {
          toast({ title: "Payment cancelled", description: "You rejected the signature request.", status: "warning", duration: 3000 });
        } else if (r === "insufficient_funds") {
          toast({ title: "Insufficient BUSD on BSC testnet", description: "You need BUSD at 0xeD24...792 on chain 97. Get testnet BUSD from the BSC faucet.", status: "error", duration: 8000 });
        } else {
          toast({ title: "Deploy payment failed", description: "Check browser console for details. Make sure you are on BSC Testnet.", status: "error", duration: 6000 });
        }
        return;
      }

      // 2. Payment succeeded — now save agent to backend (create or update)
      let agentId = currentAgentId;
      if (!agentId) {
        const saveResult = await saveAgent(address, { name: agentName, nodes, edges });
        if (!("agent" in saveResult)) {
          toast({
            title: "Payment succeeded but save failed",
            description: saveResult.hint ?? saveResult.error,
            status: "error",
            duration: 7000,
          });
          return;
        }
        agentId = saveResult.agent.id;
        setCurrentAgentId(agentId);
      } else {
        const updateResult = await saveAgent(address, { id: agentId, name: agentName, nodes, edges });
        if (!("agent" in updateResult)) {
          toast({
            title: "Payment succeeded but update failed",
            description: updateResult.hint ?? updateResult.error,
            status: "error",
            duration: 7000,
          });
          return;
        }
      }

      // 3. Trigger deployment pipeline
      const deployResult = await deployAgent(address, agentId, distinctSkillTypes.length);
      if (deployResult.deployed) {
        toast({
          title: "Agent deployed!",
          description: deployResult.workerUrl ? `Live at ${deployResult.workerUrl}` : "Payment confirmed via x402.",
          status: "success",
          duration: 5000,
        });
        onDeployClose();
        router.push("/myagents");
      } else {
        toast({ title: "Deployment failed", description: deployResult.error, status: "error", duration: 5000 });
      }
    } catch (err) {
      console.error("[deploy] error:", err);
      toast({ title: "Deployment failed", description: err instanceof Error ? err.message : "Unknown error", status: "error", duration: 5000 });
    } finally {
      setDeployLoading(false);
    }
  }, [walletClient, address, distinctSkillTypes, currentAgentId, agentName, nodes, edges, toast, router, onDeployClose]);

  return (
    <AppShell>
      <Box h="calc(100vh - 65px)" minH="500px" display="flex" flexDirection={{ base: "column", lg: "row" }} overflow="hidden">
        {/* ─── Sidebar ──────────────────────────────────────────────────── */}
        <Box
          w={{ base: "full", lg: "290px" }}
          flexShrink={0}
          bg="white"
          borderRight={{ lg: "1px solid" }}
          borderBottom={{ base: "1px solid", lg: "none" }}
          borderColor="gray.200"
          p={4}
          overflowY="auto"
          boxShadow={{ base: "0 1px 3px 0 rgb(0 0 0 / 0.06)", lg: "1px 0 0 0 rgb(0 0 0 / 0.06)" }}
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          {/* Header */}
          <Box px={4} pt={4} pb={3}>
            <Heading size="sm" color={BLACK} fontFamily="serif" mb={1}>Agent Skills</Heading>
            <Text fontSize="xs" color="gray.500" mb={3}>Drag skills onto the canvas. Pay when you deploy.</Text>
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none"><Search size={14} color="#718096" /></InputLeftElement>
              <Input
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="white"
                color={BLACK}
                border="2px solid"
                borderColor={BLACK}
                _focus={{ borderColor: BLUE, boxShadow: `0 0 0 1px ${BLUE}` }}
                _placeholder={{ color: "gray.400" }}
                borderRadius="md"
                fontSize="xs"
              />
            </InputGroup>
          </Box>

          {/* Skill list */}
          <Box flex={1} overflowY="auto" px={3} pb={2}>
            <HStack justify="flex-end" mb={2}>
              <Button size="xs" variant="link" color="gray.500" onClick={expandAll} fontSize="2xs">Expand All</Button>
              <Text color="gray.300" fontSize="2xs">|</Text>
              <Button size="xs" variant="link" color="gray.500" onClick={collapseAll} fontSize="2xs">Collapse All</Button>
            </HStack>

            <VStack spacing={2.5} align="stretch">
              {/* Favorites */}
              {favoriteOps.length > 0 && !searchQuery && (
                <Box border="2px solid" borderColor={BLUE} borderRadius="lg" bg="white" boxShadow={expandedTools.has("__favorites__") ? `3px 3px 0 0 ${PURPLE_LIGHT}` : "none"}>
                  <Box px={3} py={2.5} cursor="pointer" _hover={{ bg: SMALL_BOX }} display="flex" alignItems="center" justifyContent="space-between" onClick={() => toggleCategory("__favorites__")} role="button" tabIndex={0}>
                    <HStack spacing={2}>
                      <Star size={16} fill={BLUE} color={BLUE} />
                      <Text fontWeight="bold" fontSize="sm" color={BLUE} fontFamily="serif">Favorites</Text>
                    </HStack>
                    <Box color={BLACK}>{expandedTools.has("__favorites__") ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</Box>
                  </Box>
                  {expandedTools.has("__favorites__") && (
                    <VStack spacing={1.5} align="stretch" p={2} pt={0} borderTop="1px solid" borderColor="gray.200">
                      <Box h={1} />
                      {favoriteOps.map((op) => (
                        <DraggableOperationCard key={`fav-${op.type}`} type={op.type} label={op.label} description={op.description} isFavorite onToggleFavorite={() => toggleFavorite(op.type)} />
                      ))}
                    </VStack>
                  )}
                </Box>
              )}

              {filteredTools.map((tool) => (
                <SidebarCategory key={tool.type} tool={tool} expanded={expandedTools.has(tool.type) || (!!searchQuery && tool.operations.length > 0)} onToggle={() => toggleCategory(tool.type)} favorites={favorites} onToggleFavorite={toggleFavorite} />
              ))}
            </VStack>
          </Box>

          {/* Bottom actions */}
          <Box px={3} py={3} borderTop="2px solid" borderColor={BLACK} bg="white">
            {nodes.length > 0 && (
              <HStack justify="space-between" mb={2}>
                <Text fontSize="xs" color="gray.500">{nodes.length} block{nodes.length !== 1 ? "s" : ""} &middot; {distinctSkillTypes.length} skill{distinctSkillTypes.length !== 1 ? "s" : ""}</Text>
              </HStack>
            )}
            <VStack spacing={2} mt={4} pt={4} borderTop="1px solid" borderColor="gray.200">
              <Button
                w="full"
                size="sm"
                bg={BLUE}
                color="white"
                borderRadius="lg"
                fontWeight="600"
                _hover={{ bg: "#241388" }}
                leftIcon={<Save size={16} />}
                onClick={handleSave}
                isDisabled={nodes.length === 0}
              >
                Save Agent
              </Button>
              <Button
                w="full"
                size="sm"
                bg="green.500"
                color="white"
                borderRadius="lg"
                fontWeight="600"
                _hover={{ bg: "green.600" }}
                leftIcon={<Rocket size={16} />}
                onClick={handleDeployClick}
                isDisabled={nodes.length === 0}
              >
                Deploy Claw
              </Button>
            </VStack>
          </Box>
        </Box>

        {/* ─── Canvas ───────────────────────────────────────────────────── */}
        <Flex
          flex={1}
          minW={0}
          minH={{ base: "400px", lg: "100%" }}
          bg="white"
          backgroundImage={DOTTED_BG}
          backgroundSize={DOTTED_BG_SIZE}
          position="relative"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          overflow="hidden"
        >
          {/* Agent name */}
          <HStack position="absolute" top={3} left={3} zIndex={10} bg="white" borderRadius="md" border="2px solid" borderColor={BLACK} boxShadow={`2px 2px 0 0 ${PURPLE_LIGHT}`} px={1} spacing={0}>
            <Box color={BLUE} pl={2}><Bot size={16} /></Box>
            <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} maxW="180px" size="sm" fontWeight="bold" fontFamily="serif" border="none" _focus={{ boxShadow: "none" }} color={BLACK} />
          </HStack>

          {/* Zoom */}
          <HStack position="absolute" top={3} right={3} zIndex={10} bg="white" border="2px solid" borderColor={BLACK} borderRadius="md" p={0.5} spacing={0} boxShadow={`2px 2px 0 0 ${PURPLE_LIGHT}`}>
            <IconButton aria-label="Zoom out" icon={<Minus size={16} />} size="xs" variant="ghost" color={BLUE} onClick={zoomOut} isDisabled={zoom <= MIN_ZOOM} _hover={{ bg: SMALL_BOX }} />
            <Text fontSize="xs" fontWeight="bold" color={BLACK} minW="2.5rem" textAlign="center">{Math.round(zoom * 100)}%</Text>
            <IconButton aria-label="Zoom in" icon={<Plus size={16} />} size="xs" variant="ghost" color={BLUE} onClick={zoomIn} isDisabled={zoom >= MAX_ZOOM} _hover={{ bg: SMALL_BOX }} />
          </HStack>

          {/* Scaled content */}
          <Box ref={contentRef} position="absolute" inset={0} transformOrigin="0 0" style={{ transform: `scale(${zoom})` }}>
            {/* SVG edges */}
            {canvasSize && (
              <Box position="absolute" inset={0} pointerEvents="none" zIndex={0}>
                <svg width="100%" height="100%" viewBox={`0 0 ${canvasSize.w} ${canvasSize.h}`} preserveAspectRatio="none" style={{ overflow: "visible" }}>
                  {edges.map((edge) => {
                    const tn = nodes.find((n) => n.id === edge.target); if (!tn) return null;
                    const tx = tn.x + NODE_WIDTH / 2, ty = tn.y + NODE_HEIGHT / 2;
                    const dx = tx - agentCx, dy = ty - agentCy, dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const off = Math.min(80, dist * 0.4);
                    return <path key={edge.id} d={`M ${agentCx} ${agentCy} C ${agentCx + (dx / dist) * off} ${agentCy + (dy / dist) * off} ${tx - (dx / dist) * off} ${ty - (dy / dist) * off} ${tx} ${ty}`} fill="none" stroke={BLUE} strokeWidth={2} strokeLinecap="round" opacity={0.4} />;
                  })}
                </svg>
              </Box>
            )}

            {/* Central Agent node */}
            {canvasSize && (
              <Flex position="absolute" left={agentX} top={agentY} w={`${AGENT_SIZE}px`} h={`${AGENT_SIZE}px`} borderRadius="xl" border="3px solid" borderColor={BLACK} bg="white" boxShadow={`4px 4px 0 0 ${PURPLE_LIGHT}`} flexDirection="column" alignItems="center" justifyContent="center" zIndex={1}>
                <Box color={BLUE} mb={1}><Bot size={28} /></Box>
                <Text fontWeight="bold" fontSize="xs" color={BLACK} fontFamily="serif" textTransform="uppercase" letterSpacing="wider">Agent</Text>
              </Flex>
            )}

            {/* Empty hint */}
            {nodes.length === 0 && canvasSize && (
              <Flex position="absolute" left={agentCx} top={agentCy + AGENT_SIZE / 2 + 20} transform="translateX(-50%)" zIndex={0}>
                <Text color="gray.400" fontSize="sm" bg="white" px={4} py={2} borderRadius="md" border="2px dashed" borderColor={PURPLE_LIGHT}>Drag skills here</Text>
              </Flex>
            )}

            {nodes.map((node) => (
              <CanvasNode key={node.id} node={node} onRemove={removeNode} onMove={moveNode} onClick={(id) => { setSelectedNodeId(id); onConfigOpen(); }} />
            ))}
          </Box>
        </Flex>
      </Box>

      {/* ─── Config Drawer ──────────────────────────────────────────────── */}
      <Drawer isOpen={isConfigOpen} placement="right" onClose={onConfigClose} size="sm">
        <DrawerOverlay />
        <DrawerContent borderLeft="1px solid" borderColor="gray.200">
          <DrawerCloseButton />
          <DrawerHeader fontWeight="600" borderBottom="1px solid" borderColor="gray.200">
            <HStack spacing={2}>
              {selectedNode && getIconForType(selectedNode.type)}
              <Text>{selectedNode?.label ?? "Block Config"}</Text>
            </HStack>
          </DrawerHeader>
          <DrawerBody pt={4}>
            {selectedNode && (
              <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="gray.500">{SIDEBAR_TOOLS.flatMap((t) => t.operations).find((op) => op.type === selectedNode.type)?.description}</Text>
                {(BLOCK_CONFIG_FIELDS[selectedNode.type] ?? []).map((field) => (
                  <Box key={field.key}>
                    <Text fontSize="xs" fontWeight="bold" mb={1} color={BLACK}>{field.label}</Text>
                    {field.type === "select" ? (
                      <Select size="sm" value={selectedNode.config?.[field.key] ?? ""} onChange={(e) => updateNodeConfig(selectedNode.id, field.key, e.target.value)} border="2px solid" borderColor={BLACK} _focus={{ borderColor: BLUE }} borderRadius="md" color={BLACK} bg="white">
                        <option value="" style={{ color: "#A0AEC0" }}>{field.placeholder}</option>
                        {field.options?.map((opt) => <option key={opt} value={opt} style={{ color: BLACK }}>{opt}</option>)}
                      </Select>
                    ) : (
                      <Input size="sm" type={field.type} placeholder={field.placeholder} value={selectedNode.config?.[field.key] ?? ""} onChange={(e) => updateNodeConfig(selectedNode.id, field.key, e.target.value)} border="2px solid" borderColor={BLACK} _focus={{ borderColor: BLUE }} borderRadius="md" color={BLACK} bg="white" _placeholder={{ color: "gray.400" }} />
                    )}
                  </Box>
                ))}
                {!BLOCK_CONFIG_FIELDS[selectedNode.type] && <Text fontSize="sm" color="gray.400" fontStyle="italic">No configuration for this block.</Text>}
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Modal isOpen={isDeployOpen} onClose={onDeployClose} isCentered>
        <ModalOverlay />
        <ModalContent border="1px solid" borderColor="gray.200" borderRadius="xl" boxShadow="xl">
          <ModalHeader fontWeight="600" borderBottom="1px solid" borderColor="gray.200">
            <HStack spacing={2}>
              <Rocket size={20} />
              <Text>Deploy Claw</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">Deploy <strong>{agentName}</strong> with <strong>{distinctSkillTypes.length} skill{distinctSkillTypes.length !== 1 ? "s" : ""}</strong>.</Text>
              {/* Skills */}
              <Flex flexWrap="wrap" gap={2}>
                {distinctSkillTypes.map((type) => (
                  <HStack key={type} bg={SMALL_BOX} border="1px solid" borderColor={`${BLUE}30`} borderRadius="full" px={3} py={1} spacing={1.5}>
                    <Box color={BLUE}>{getIconForType(type, 12)}</Box>
                    <Text fontSize="xs" fontWeight="600" color={BLUE}>{getSkillLabel(type)}</Text>
                  </HStack>
                ))}
              </Flex>
              {/* Cost */}
              <Box bg={SMALL_BOX} borderRadius="lg" p={4} border="2px solid" borderColor={`${BLUE}30`}>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm" color="gray.600">{distinctSkillTypes.length} &times; {FEATURE_PRICE_USDC} USDC</Text>
                  <Text fontSize="lg" fontWeight="bold" color={BLACK} fontFamily="serif">{deployTotal} USDC</Text>
                </HStack>
                <Text fontSize="2xs" color="gray.500">Paid via x402 (BUSD) on BSC testnet</Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="2px solid" borderColor={BLACK} gap={2}>
            <Button variant="ghost" onClick={onDeployClose} isDisabled={deployLoading} color="gray.500">Cancel</Button>
            <Button
              bg={BLUE}
              color="white"
              borderRadius="lg"
              fontWeight="600"
              _hover={{ bg: "green.600" }}
              leftIcon={deployLoading ? <Spinner size="sm" /> : <DollarSign size={16} />}
              onClick={handleDeployConfirm}
              isDisabled={deployLoading}
              transition="all 0.15s"
            >
              {deployLoading ? "Processing..." : `Pay ${deployTotal} USDC & Deploy`}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AppShell>
  );
}

export default function AgentBuilderPage() {
  return <Suspense><AgentBuilderInner /></Suspense>;
}
