# AgentClaw – Teammate Task Brief

This doc is for implementing and improving **AgentClaw** (the Agent Builder and My Agents experience), including **deploy-and-test** steps, **agent-aligned sidebar** features, **x402 pay-per-feature** (0.1 Mon per feature), **Deploy Claw with x402 total payment**, and **My Agents with skill bubbles** in the UI.

---

## 0. Deploy and Test the Claw Deployment (Required)

**Before implementing new features, deploy the app and validate the full Claw flow.**

1. **Deploy the app**
   - Deploy the Next.js app (e.g. Vercel): set root to the app folder, add env vars (`PAY_TO_ADDRESS`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`). See section 1 below for details.
   - Run `npm run build` and `npm start` (or use your host’s build command).
   - Confirm the app loads and wallet connect works on the deployed URL.

2. **Test the Claw deployment flow end-to-end**
   - Open the **Agent Builder** (`/ab`), connect wallet.
   - Drag a few blocks from the sidebar onto the canvas (e.g. Onchain Action + Onchain Data).
   - Give the agent a name, optionally configure a block via the config panel.
   - Click **Save Agent** — confirm it persists (e.g. refresh and reload via `/ab?id=...` or My Agents).
   - Click **Deploy Agent** — confirm it marks as deployed and appears on **My Agents** (`/myagents`).
   - On **My Agents**, confirm the deployed agent shows with correct name and actions (Edit, Duplicate, Delete).
   - Document any bugs or missing steps so the rest of the team can fix them before layering x402 and UI changes.

---

## 1. How to Deploy AgentClaw (App + Agent Flow)

**App deployment (hosting the Next.js app)**

- **Vercel (recommended):** Connect the repo, set root to the app folder, add env vars (`PAY_TO_ADDRESS`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`). See [Next.js deployment](https://nextjs.org/docs/app/building-your-application/deploying) and [Vercel](https://vercel.com).
- **Other hosts:** Build with `npm run build`, run `npm start`. Set production env vars from `.env.local`.

**Agent deployment (publishing a built agent)**

- Current flow: Connect wallet → Build agent on canvas → Save (draft) → Deploy (marks deployed, shows on My Agents). Storage is in `lib/agent-storage.ts` (localStorage).  
- **New requirement (see section below):** When user clicks **Deploy Claw**, show the **total cost** and collect payment via **x402** before completing deployment.

---

## 2. Sidebar – Agent-Aligned Features (Claw Agents)

The sidebar should feel **oriented around agent capabilities** (what a “Claw agent” can do), not generic blocks. Align naming and groupings so it’s clear these are **agent skills**.

**Suggested direction**

- **Rename / regroup for “agent skills”:**
  - e.g. **Agent Actions** (onchain: mint, transfer, create DAO; productivity: email, reminder, task, meeting).
  - **Agent Data** (fetch price, states, balance, transactions).
  - **Agent Logic** (conditional, loop).
  - **Agent Integrations** (API call, webhook).
  - **Agent Payments** (x402 Pay — micropayments).
- **Add or emphasize agent-centric blocks** if useful: e.g. “Query User”, “Run Sub-Agent”, “Notify User”, “Store Result”, so the palette reads as “what my agent can do” rather than generic ops.
- **Single source of truth:** Keep block definitions in one place (e.g. `SIDEBAR_TOOLS` in `app/ab/page.tsx`) so adding a new “skill” is one entry; ensure each block type has a clear **skill label** for use in My Agents skill bubbles (see section 4).

**x402 per feature (0.1 Mon)**

- **Every sidebar feature (block type) is paid:** Unlocking or using a block in the builder costs **0.1 Mon** (0.1 tBNB or project-defined unit) via **x402**.
- **Implementation options:**
  - **Option A:** When user **drags a block** onto the canvas, prompt for x402 payment (0.1 Mon) for that block type; only add the node after successful payment.
  - **Option B:** When user **first uses** a block type in a session, charge 0.1 Mon via x402 and then allow unlimited use of that type in that session or agent.
- Use the existing x402 stack: `402/x402-config.ts`, `app/api/premium/route.ts` (or a dedicated `/api/agent-block-pay` endpoint), and the client payment flow from `app/premium/page.tsx` (wrap fetch with x402, ExactEvmScheme, etc.). Add a **price of 0.1** (in your chosen unit) for “per block type” or “per feature” and document it in `402/README.md`.

---

## 3. Deploy Claw – Show Total and Pay via x402

When the user clicks **Deploy Claw** (Deploy Agent), do **not** deploy immediately. Instead:

1. **Compute total cost**
   - Sum the cost for every **distinct block type** used on the canvas (e.g. if each feature is 0.1 Mon, and the user used “Mint NFT”, “Fetch Price”, “x402 Pay”, total = 0.3 Mon).
   - If you already charged per-drag (0.1 Mon per block type when added), the total can be shown as a **summary** of what was paid; otherwise, treat this as the **one-time deploy fee** (sum of 0.1 Mon per distinct skill in the agent).

2. **Show total and payment step**
   - Show a modal or inline step: e.g. “Deploy cost: **0.3 Mon** (3 skills × 0.1 Mon). Pay with x402 to deploy.”
   - Use the same x402 client flow as elsewhere: `wrapFetchWithPayment`, ExactEvmScheme, Monad facilitator. Call a **payable endpoint** (e.g. `POST /api/agents/deploy` or reuse a generic pay endpoint) with the **total amount**; only after successful payment should the backend (or client) mark the agent as deployed and persist.

3. **Complete deployment after payment**
   - On success: mark agent as deployed, redirect to My Agents or show success and refresh the list.
   - On failure (rejected, insufficient funds): show a clear error and keep the user on the deploy step so they can retry or cancel.

**Reference:** `app/premium/page.tsx` (x402 client), `402/x402-config.ts`, `app/api/premium/route.ts`. Add a deploy-payment endpoint or extend an existing one to accept a variable amount (e.g. total in tBNB/Mon).

---

## 4. My Agents Page – Show Agents Deployed by User with Skill Bubbles

**Goal:** On My Agents, show each **deployed agent** with a **bubble-of-skills** UI so users can see at a glance what capabilities each agent has.

**Data**

- Each agent already has `nodes` (and thus block types) in storage. From `nodes` derive the list of **skill labels** (e.g. “Mint NFT”, “Fetch Price”, “x402 Pay”).

**UI**

- **Agent cards:** Keep or refine the current card layout (name, status, dates, actions: Edit, Duplicate, Delete).
- **Skill bubbles:** For each agent, show the set of block types used as **bubbles** (pills/chips):
  - Small, rounded “bubbles” (e.g. `borderRadius="full"` or `"lg"`, padding, subtle background or border).
  - Each bubble shows the **skill name** (e.g. “Mint NFT”, “Fetch Price”) — use the same label as in the sidebar for consistency.
  - Layout: wrap in a flex/grid so bubbles sit in a row and wrap to the next line; limit to one line with “+N more” if you have many skills, or show all.
- **Only deployed agents** (or agents with at least one node) should show non-empty skill bubbles; drafts can show “No skills” or the same bubble list from their current graph.

**Implementation**

- In `app/myagents/page.tsx`, for each agent:
  - From `agent.nodes` collect unique `node.type` (and optionally map to display label via the same mapping used in the sidebar, e.g. from `SIDEBAR_TOOLS` or a shared `getLabelForType(type)`).
  - Render a row of Chakra `Badge` or custom `Box` components with the skill names. Use a compact, “bubble” style (rounded, small text, neutral or primary color) so the page stays scannable.

**Quick reference:** Block types and labels live in `app/ab/page.tsx` (`SIDEBAR_TOOLS`). You can export a helper like `getSkillLabel(type: string): string` from there or from a shared constants file and use it in both the sidebar and My Agents.

---

## 5. Basic / Default Features in AgentClaw (Current)

**Agent Builder (`/ab`)**

- Canvas: dotted background, central Agent node, zoom, drag-and-drop.
- Sidebar: categories (Onchain Action, Onchain Data, Productivity, Logic, Integration, x402), search, favorites, collapse/expand all.
- Nodes: remove, move, config panel on click.
- Save (draft) and Deploy; load from `/ab?id=...`.

**My Agents (`/myagents`)**

- Not connected → connect prompt; no agents → empty state + CTA; has agents → grid of cards with Edit, Duplicate, Delete.
- **To add:** Skill bubbles on each card (see section 4).

**x402**

- Premium example: `app/api/premium/route.ts`, `app/premium/page.tsx`, `402/x402-config.ts`. Use the same pattern for per-feature (0.1 Mon) and deploy total payment.

---

## Quick Reference

| Topic | Location |
|-------|----------|
| Agent Builder UI | `app/ab/page.tsx` |
| Sidebar block definitions | `app/ab/page.tsx` → `SIDEBAR_TOOLS` |
| Block config | `app/ab/page.tsx` → `BLOCK_CONFIG_FIELDS` |
| Agent storage | `lib/agent-storage.ts` |
| My Agents page | `app/myagents/page.tsx` |
| x402 config | `402/x402-config.ts` |
| x402 premium API | `app/api/premium/route.ts` |
| x402 client example | `app/premium/page.tsx` |
| Wallet | `contexts/Web3Provider.tsx`, RainbowKit |

---

## Checklist for Teammate

- [ ] Deploy the app and test the full Claw flow (section 0).
- [ ] Align sidebar with agent skills and add x402 at 0.1 Mon per feature (section 2).
- [ ] On Deploy Claw: show total, collect payment via x402, then complete deployment (section 3).
- [ ] On My Agents: show deployed agents with skill bubbles in the UI (section 4).
