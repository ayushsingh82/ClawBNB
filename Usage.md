# 402-NadClaw — Usage Guide

## Prerequisites

- Node.js 18+
- PostgreSQL (via Prisma local server)
- Cloudflare account with Workers API token
- Wallet with USDC on Monad Testnet (chain 10143)

---

## Environment Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

**`.env`** — Server-side secrets:

```env
# Database (run `npx prisma dev --detach` first, then copy the URL)
DATABASE_URL="prisma+postgres://localhost:51213/?api_key=..."

# Cloudflare Workers deployment
# Get from: https://dash.cloudflare.com → Workers & Pages → API Tokens
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

**`.env.local`** — App config:

```env
# x402 payment recipient (Monad Testnet wallet)
PAY_TO_ADDRESS=0xYourWalletAddress

# WalletConnect (optional, get at https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

### 3. Start the database

```bash
npx prisma dev --detach
```

This starts a local PostgreSQL instance managed by Prisma.

### 4. Run migrations

```bash
npx prisma migrate dev
```

### 5. Generate Prisma client

```bash
npx prisma generate
```

### 6. Start the dev server

```bash
npm run dev
```

App runs at `http://localhost:3000`.

---

## System Architecture

```
[ Next.js Frontend ]
        |
[ API Routes (Node/TS Server) ]
        |
[ PostgreSQL (Prisma) ]
        |
[ AgentFactoryService ]
        |
[ Cloudflare Worker Deployment ]
        |
[ Deployed Agent Runtime (Edge) ]
```

### Data Flow

1. **User** connects wallet via RainbowKit
2. **Agent Builder** (`/ab`) — Drag skills onto canvas, configure each block
3. **Save** — `POST /api/agents` stores agent graph in PostgreSQL
4. **Deploy** — x402 micropayment + `POST /api/agents/deploy` triggers:
   - DeploymentRunner validates agent
   - AgentFactory generates Cloudflare Worker code
   - Worker uploaded to Cloudflare via API
   - Agent status set to `live`, worker URL persisted
5. **My Agents** (`/myagents`) — Fetches all agents for connected wallet from DB

---

## API Endpoints

### Agents CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/agents?wallet=0x...` | List all agents for a wallet |
| `POST` | `/api/agents` | Create or update an agent |
| `GET` | `/api/agents/[id]?wallet=0x...` | Get single agent with deployments |
| `PATCH` | `/api/agents/[id]` | Partial update (name, canvas) |
| `DELETE` | `/api/agents/[id]` | Delete an agent |
| `POST` | `/api/agents/[id]/duplicate` | Clone an agent |

### Deployment

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/agents/deploy` | Deploy agent to Cloudflare (body: `{agentId, walletAddress, skills}`) |
| `GET` | `/api/agents/deploy?skills=N` | Legacy x402 payment endpoint |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/premium` | x402 premium content demo |
| `GET` | `/api/agent-block-pay?type=X` | Per-block unlock payment |
| `GET` | `/api/avatar` | Random facehash avatar |

---

## Deployed Worker Endpoints

Each deployed agent runs as a Cloudflare Worker at:
`https://agent-{id}.monadclaw.workers.dev`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` or `/health` | Agent status, skills, node count |
| `POST` | `/execute` | Execute the agent graph (body: `{input: {...}}`) |
| `GET` | `/graph` | Agent graph metadata |

### Example: Execute an agent

```bash
curl -X POST https://agent-abc123.monadclaw.workers.dev/execute \
  -H "Content-Type: application/json" \
  -d '{"input": {"tokenAddress": "0x123"}}'
```

---

## Database Schema

### Tables

- **users** — `id` (UUID), `wallet_address` (unique), `created_at`
- **agents** — `id` (UUID), `user_id` (FK), `name`, `canvas_json` (JSONB), `status` (draft/deploying/live/failed), `worker_url`
- **deployments** — `id` (UUID), `agent_id` (FK), `cloudflare_worker_id`, `deployment_status`, `logs`, `worker_url`, `error_message`

### Wallet Mapping

```
wallet_address → user → [agent_1, agent_2, ... agent_n]
                          ↓
                   [deployment_1, deployment_2, ...]
```

---

## Agent Skills

### Phase 1 — Fully Implemented (execute in Workers)

| Skill | Description |
|-------|-------------|
| `api_call` | HTTP requests to external APIs (GET/POST/PUT/DELETE) |
| `webhook_notify` | Send webhook notifications with payload |
| `fetch_price` | Get token prices from CoinGecko |
| `notify_user` | Send notification to agent owner |
| `x402_pay` | Micropayment via x402 facilitator |
| `conditional` | If/else branching on expressions |
| `loop` | Repeat actions N times with interval |
| `store_result` | Persist a result with TTL |

### Phase 2 — Stubbed (schema defined, execution pending)

| Skill | Description |
|-------|-------------|
| `mint_token` | Create ERC20 tokens |
| `mint_nft` | Create NFT collections |
| `transfer_asset` | Transfer tokens between addresses |
| `create_dao` | Deploy a DAO |
| `send_email` | Send emails via SMTP |
| `set_reminder` | Create calendar reminders |
| `create_task` | Add tasks to task management |
| `schedule_meeting` | Book calendar meetings |
| `fetch_states` | Read contract states |
| `fetch_balance` | Get wallet balances |
| `fetch_transactions` | Query transaction history |
| `query_user` | Prompt user for input |
| `run_sub_agent` | Invoke another agent |

---

## x402 Payment

- **Network:** Monad Testnet (`eip155:10143`)
- **Token:** USDC at `0x534b2f3A21130d7a60830c2Df862319e593943A3`
- **Facilitator:** `https://x402-facilitator.molandak.org`
- **Price:** `0.1 USDC` per unique skill type
- **Recipient:** Configured via `PAY_TO_ADDRESS` env var

---

## Key File Paths

```
lib/
  api-client.ts              # Frontend API client (replaces localStorage)
  agent-storage.ts           # Legacy localStorage (deprecated)
  server/
    db.ts                    # Prisma singleton (pg adapter)
    services/
      agentFactory.ts        # Worker code generation + Cloudflare deploy
      deploymentRunner.ts    # Deployment pipeline orchestrator
      skillExecutors.ts      # Skill execution functions
      logger.ts              # Server logging
    modules/
      definitions.ts         # 21 skill module schemas
      index.ts               # Module registry
    types/
      skillExecutor.ts       # Executor type definitions
      module.ts              # Module tool definition type
      deploymentJob.ts       # Legacy job types

app/
  ab/page.tsx                # Agent Builder (drag-and-drop canvas)
  myagents/
    MyAgentsContent.tsx      # Agent listing (reads from DB)
  api/
    agents/
      route.ts               # CRUD: list + create/update
      [id]/route.ts           # CRUD: get + delete + patch
      [id]/duplicate/route.ts # Clone agent
      deploy/route.ts         # Deploy pipeline + x402 payment

prisma/
  schema.prisma              # Database schema
  migrations/                # SQL migrations

402/
  x402-config.ts             # Payment configuration
```
