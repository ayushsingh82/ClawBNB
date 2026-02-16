# BNB-vibe

**Autonomous AI agent builder on BSC Testnet — drag, drop, pay, deploy.**

Build on-chain agents visually with a drag-and-drop canvas. Each agent gets its own wallet, signs transactions autonomously, and deploys to Cloudflare Workers — all powered by [x402](https://x402.org/) micropayments on BSC.

---

## Demo Video

> [Watch the 4-minute demo](<!-- VIDEO_LINK_HERE -->)

---

## Features

### Drag-and-Drop Agent Builder
- Visual canvas with 20+ skill blocks across 5 categories
- Curved SVG connections between agent node and skills
- Zoom (50%-200%), search, favorites, and skill configuration drawer
- Real-time cost calculation: 0.1 BUSD per skill via x402

### Autonomous Agent Wallets
- Every agent gets its own wallet (private key generated server-side)
- Agents sign and broadcast transactions **without user interaction**
- Fund agent wallets with BNB for gas, then let them operate independently
- Real on-chain transactions: mint ERC-20 tokens, mint NFTs, fetch balances

### Animated Execution UI
- **Phase 1: Fund** — View agent wallet address, check BNB balance, send gas funds
- **Phase 2: Execute** — Watch skills light up one-by-one with staggered animations
- **Phase 3: Results** — Transaction hashes with direct links to BSC explorer

### Cloudflare Workers Deployment
- Agents compile to ES module Cloudflare Workers with embedded skill logic
- Full deployment pipeline: validate → generate code → deploy to edge → go live
- Each agent gets a unique URL: `https://agent-{id}.workers.dev`

### x402 Micropayments
- Pay-per-deploy: cost = number of skills x 0.1 BUSD
- Premium content gating: unlock exclusive content for 0.001 BUSD
- Real payments via x402 facilitator on BSC Testnet (chain ID 97)

### Live Token Dashboard
- Real-time price chart (lightweight-charts) with 1-minute candles from nad.fun API
- Chart polls every 10s, token data polls every 8s
- Metrics panel: price USD/BNB, FDV, holder count, ATH
- Timeframe selector (30M / 1H / 4H / 24H) with txns, volume, and maker stats
- Buy/sell bar indicators and direct "Buy on nad.fun" CTA

---

## Skills

### Fully Implemented (Phase 1)
| Skill | Description |
|-------|-------------|
| `fetch_price` | Live token prices via CoinGecko |
| `fetch_balance` | Wallet balance on BSC via RPC |
| `mint_token` | Mint ERC-20 tokens (agent wallet signs tx) |
| `mint_nft` | Mint NFTs (agent wallet signs tx) |
| `api_call` | HTTP GET/POST/PUT/DELETE with custom headers |
| `webhook_notify` | POST to webhook URL with agent context |
| `x402_pay` | Micropayment via x402 protocol |
| `conditional` | If/else logic with JS condition evaluation |
| `loop` | Repeat actions N times with interval |
| `store_result` | Persist execution results with TTL |
| `notify_user` | Send notification to user |

### Stubbed (Phase 2)
`transfer_asset` | `create_dao` | `send_email` | `set_reminder` | `create_task` | `schedule_meeting` | `fetch_states` | `fetch_transactions` | `query_user` | `run_sub_agent`

---

## Architecture

```
User → Landing Page (Next.js 16)
         ├── Token Dashboard (nad.fun API → live chart + metrics)
         ├── Agent Builder (/ab) → Drag & drop skills → Configure
         │     └── Deploy Claw → x402 payment → Cloudflare Workers
         ├── My Agents (/myagents) → Fund wallet → Execute → Animated results
         └── Premium (/premium) → x402 micropayment → Unlock content

Backend:
  ├── PostgreSQL (Prisma 7) → Users, Agents, Deployments
  ├── Agent Wallet Service (viem) → Key generation, tx signing
  ├── Skill Executors → fetch_price, mint_token, api_call, etc.
  ├── Agent Factory → Generate Cloudflare Worker code
  └── Deployment Runner → Full deploy pipeline to CF edge
```

---


## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | PostgreSQL + Prisma 7 |
| Blockchain | BSC Testnet (chain 97) |
| Payments | x402 protocol (BUSD micropayments) |
| Wallet | RainbowKit + wagmi + viem |
| Agent Deploy | Cloudflare Workers (ES modules) |
| Agent Signing | viem (server-side walletClient) |
| Charts | lightweight-charts (TradingView) |
| UI | Chakra UI + Framer Motion |
| Token Data | nad.fun API (api.nadapp.net) |

---

## Smart Contracts (BSC Testnet)

| Contract | Address |
|----------|---------|
| MintToken (ERC-20) | Deploy on BSC testnet |
| MintNFT (ERC-721) | Deploy on BSC testnet |
| BUSD (Test) | `0xeD24FC36d5Ee211Ea25A802eFb36D4e25A3c0792` |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start Prisma dev server (embedded PostgreSQL)
npx prisma dev --detach

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
DATABASE_URL="prisma+postgres://..."    # From prisma dev
CLOUDFLARE_API_TOKEN=your_cf_token      # Cloudflare Workers API
CLOUDFLARE_ACCOUNT_ID=your_cf_account   # Cloudflare account
PAY_TO_ADDRESS=0x...                    # x402 payment recipient
```

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page — Hero, features, live token dashboard |
| `/ab` | Agent Builder — drag-and-drop canvas |
| `/myagents` | My Agents — manage, fund, execute, view results |
| `/premium` | x402 premium content unlock |
| `/profile` | Share profile and agents |

### API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET/POST | List and create agents |
| `/api/agents/[id]` | GET/PATCH/DELETE | Agent CRUD |
| `/api/agents/[id]/balance` | GET | Agent wallet BNB balance |
| `/api/agents/[id]/execute` | POST | Execute agent (server-side signing) |
| `/api/agents/[id]/duplicate` | POST | Clone an agent |
| `/api/agents/deploy` | GET/POST | x402 payment + deploy to Cloudflare |
| `/api/token` | GET | Live token price, metrics, holders |
| `/api/token/chart` | GET | Live OHLCV chart data from nad.fun |
| `/api/premium` | GET | x402 micropayment content gate |

---

## Deploy

Deploy frontend to [Vercel](https://vercel.com). Set environment variables in Vercel dashboard. Ensure `prisma dev` is running locally with port forwarded via VS Code tunnels or use a hosted PostgreSQL (Neon, Supabase).

---

Built with x402 on BSC Testnet.
