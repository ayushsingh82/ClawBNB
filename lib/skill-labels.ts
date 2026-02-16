/**
 * Shared skill label mapping for Agent Builder blocks.
 * Used by the sidebar (app/ab/page.tsx) and My Agents (app/myagents/page.tsx).
 */

export const SKILL_LABEL_MAP: Record<string, string> = {
  // Agent Actions (onchain)
  mint_token: "Mint Token",
  mint_nft: "Mint NFT",
  transfer_asset: "Transfer Asset",
  create_dao: "Create DAO",
  // Agent Actions (productivity)
  send_email: "Send Email",
  set_reminder: "Set Reminder",
  create_task: "Create Task",
  schedule_meeting: "Schedule Meeting",
  // Agent Data
  fetch_price: "Fetch Price",
  fetch_states: "Fetch States",
  fetch_balance: "Fetch Balance",
  fetch_transactions: "Fetch Transactions",
  // Agent Logic
  conditional: "Conditional",
  loop: "Loop",
  // Agent Integrations
  api_call: "API Call",
  webhook_notify: "Webhook Notify",
  // Agent Payments
  x402_pay: "x402 Pay",
  // Agent-centric extras
  query_user: "Query User",
  run_sub_agent: "Run Sub-Agent",
  notify_user: "Notify User",
  store_result: "Store Result",
};

/** Get the display label for a block type. Falls back to title-cased type. */
export function getSkillLabel(type: string): string {
  return (
    SKILL_LABEL_MAP[type] ??
    type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
