# ClawBNB — No-Code AI Agent Builder on BNB Chain

**Build, deploy, and monetize autonomous AI agents on BNB Chain — zero code required.**

ClawBNB lets anyone create on-chain AI agents through a visual drag-and-drop interface. Each agent gets its own wallet, executes transactions autonomously, and deploys to the edge in seconds. Deployment is gated by native tBNB micropayments — pay only for what you use.

---

## Demo

<video src="assets/ClawBNB.mov" controls width="100%"></video>

---

## The Problem

Building on-chain automation today requires deep Solidity knowledge, backend infrastructure, and DevOps expertise. There's no easy way for non-developers to create agents that interact with DeFi protocols, mint tokens, or monitor on-chain state autonomously.

## Our Solution

ClawBNB abstracts the entire stack into a visual builder:

1. **Drag** skill blocks onto a canvas (mint tokens, fetch prices, call APIs, conditional logic...)
2. **Connect** them to create agent workflows
3. **Pay & Deploy** with a single tBNB transaction — agent goes live on Cloudflare's edge network
4. **Execute** — each agent has its own wallet and signs transactions without user interaction

---

## Key Features

### Visual Agent Builder
- 20+ skill blocks across 5 categories: Actions, Data, Logic, Integrations, Payments
- Drag-and-drop canvas with zoom, search, favorites, and per-block configuration
- Real-time cost preview before deployment

### Autonomous Agent Wallets
- Every agent gets a dedicated wallet with server-side key management
- Agents sign and broadcast transactions independently — no manual approval needed
- Fund once, run forever: mint ERC-20s, mint NFTs, fetch balances, call external APIs

### Pay-Per-Deploy with tBNB
- Deployment cost = `number of skills x 0.001 tBNB`
- Native BNB Chain micropayments — no wrapped tokens, no approvals
- Payment verified on-chain before deployment proceeds

### Edge Deployment (Cloudflare Workers)
- Agents compile to self-contained ES module Workers
- Full pipeline: validate graph -> generate code -> deploy to edge -> live URL
- Each agent gets a unique endpoint: `https://agent-{id}.workers.dev`
- Health check, execution, and graph introspection endpoints out of the box

### Animated Execution Dashboard
- **Fund phase** — view agent wallet, check balance, send gas
- **Execute phase** — watch skills light up sequentially with staggered animations
- **Results phase** — transaction hashes with direct BscScan links

---

## Architecture

```
Frontend (Next.js 16 + Chakra UI)
  ├── Agent Builder (/ab)         — Visual canvas, drag-and-drop skills
  ├── My Agents (/myagents)       — Manage, fund, execute, view results
  ├── Mint (/premium)             — Claim ERC-20 & ERC-721 tokens
  └── Landing (/)                 — Hero, features, live token dashboard

API Layer (Next.js Route Handlers)
  ├── /api/agents                 — CRUD + deploy pipeline
  ├── /api/agents/[id]/execute    — Server-side agent execution
  └── /api/token                  — Live price & chart data

Services
  ├── Agent Factory               — Generates Cloudflare Worker code from graph
  ├── Deployment Runner           — End-to-end deploy pipeline
  ├── Agent Wallet Service        — Key generation + tx signing (viem)
  └── Skill Executors             — Runtime implementations per skill type

Infrastructure
  ├── JSON File DB (local dev) / PostgreSQL + Prisma (production)
  ├── Cloudflare Workers          — Agent runtime at the edge
  └── BSC Testnet (chain 97)     — All on-chain transactions
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | Chakra UI + Framer Motion |
| Blockchain | BNB Smart Chain Testnet (chain 97) |
| Wallet | RainbowKit + wagmi v2 + viem v2 |
| Payments | Native tBNB micropayments |
| Agent Runtime | Cloudflare Workers (ES modules) |
| Agent Signing | viem server-side walletClient |
| Charts | lightweight-charts (TradingView) |
| Database | JSON file DB (dev) / PostgreSQL + Prisma 7 (prod) |

---

## Smart Contracts (BSC Testnet)

| Contract | Address |
|----------|---------|
| MintToken (ERC-20) | `0xe936e65D9F598059579E3Dc74E98514124538398` |
| MintNFT (ERC-721) | `0x1451A67F6527B6B37CFCA506dab9E5Fdcd6b9bd2` |

---

## Skills

| Skill | Status | Description |
|-------|--------|-------------|
| `fetch_price` | Live | Token prices via CoinGecko API |
| `fetch_balance` | Live | Wallet balance via BSC RPC |
| `mint_token` | Live | Mint ERC-20 (agent wallet signs tx) |
| `mint_nft` | Live | Mint ERC-721 (agent wallet signs tx) |
| `api_call` | Live | HTTP requests with custom headers |
| `webhook_notify` | Live | POST to webhook with agent context |
| `conditional` | Live | If/else branching with JS expressions |
| `loop` | Live | Repeat N times with configurable interval |
| `store_result` | Live | Persist results with TTL |
| `notify_user` | Live | Push notifications to agent owner |
| `transfer_asset` | Live | Transfer tokens between wallets |
| `create_dao` | Live | Deploy governance contracts |
| `run_sub_agent` | Planned | Chain agents together |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
CLOUDFLARE_API_TOKEN=              # Cloudflare Workers API token
CLOUDFLARE_ACCOUNT_ID=             # Cloudflare account ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=  # WalletConnect project ID
NEXT_PUBLIC_DEPLOY_FEE_ADDRESS=    # Wallet receiving deploy fees
```

---

## How It Works

```
User connects wallet
       │
       ▼
Drags skills onto canvas ──► Configures each block
       │
       ▼
Clicks "Pay & Deploy"
       │
       ├── Saves agent to DB
       ├── Sends tBNB payment (0.001 × skills)
       ├── Generates Cloudflare Worker code
       └── Deploys to edge ──► Agent is LIVE
                                    │
                                    ▼
                          Agent executes autonomously
                          (own wallet, signs txs, calls APIs)
```

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing — hero, features, token dashboard |
| `/ab` | Agent Builder — visual drag-and-drop canvas |
| `/myagents` | My Agents — manage, fund, execute agents |
| `/premium` | Mint ERC-20 and ERC-721 tokens |

---

## What's Next

- Multi-agent orchestration (agents calling agents)
- On-chain event triggers (react to transfers, swaps, governance votes)
- Agent marketplace — publish and monetize agent templates
- Mainnet deployment with real BNB payments
- AI-powered skill suggestions based on agent goals

---

Built for BNB Chain hackathon. Powered by BSC Testnet, Cloudflare Workers, and native tBNB micropayments.
