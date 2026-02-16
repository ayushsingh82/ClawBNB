# x402 on Monad

Paywalled API and client setup using the x402 protocol and the Monad facilitator.

## Setup

1. **Environment**
   - Ensure `.env.local` exists and set:
   - `PAY_TO_ADDRESS=0xYourWallet` — address that receives payments (used by `app/api/premium/route.ts`).

2. **Server**
   - Payable endpoint: `GET /api/premium` (see `app/api/premium/route.ts`).
   - Network: Monad Testnet (`eip155:10143`).
   - USDC testnet: `0x534b2f3A21130d7a60830c2Df862319e593943A3`.
   - Facilitator: `https://x402-facilitator.molandak.org`.
   - Price: $0.001 USDC.

3. **Client**
   - Premium unlock page: `/premium` (see `app/premium/page.tsx`).
   - Uses wagmi + `@x402/fetch` / `@x402/evm` to pay and call `GET /api/premium`.
   - Unlocked content is cached in `localStorage` under `premium_content_unlocked`.

## Facilitator API

Base URL: `https://x402-facilitator.molandak.org` (Mainnet and Testnet).

- **GET /supported** — Supported networks, schemes, and signer addresses.
- **POST /verify** — Verify a payment signature (EIP-712 / ERC-3009 TransferWithAuthorization).
- **POST /settle** — Execute the payment on-chain (facilitator pays gas).

Request/response shapes depend on the x402 protocol; see [Monad x402 guide](https://docs.monad.xyz/guides/x402-guide) for details.

## Run

```bash
npm run dev
```

Open `http://localhost:3000/premium`, connect wallet, then “Pay & Unlock Content”.
