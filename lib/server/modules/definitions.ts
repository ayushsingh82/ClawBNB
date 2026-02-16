/**
 * Module definitions for all sidebar block types.
 * Each block type used in the Agent Builder canvas has a corresponding module here (same pattern as Agent Canvas server/modules).
 * Used for deployment/runtime: selectedModules + workflowJSON drive what the deployed agent can do.
 */

import type { ModuleToolDefinition } from "../types/module";

function schemaFromFields(
  fields: Array<{ key: string; label: string; type: string; placeholder?: string; options?: string[] }>
): ModuleToolDefinition["inputSchema"] {
  const properties: Record<string, { type: string; description?: string; enum?: string[] }> = {};
  for (const f of fields) {
    const prop: { type: string; description?: string; enum?: string[] } = {
      type: f.type === "number" ? "number" : "string",
      description: f.label || f.placeholder,
    };
    if (f.options?.length) prop.enum = f.options;
    properties[f.key] = prop;
  }
  return { type: "object", properties };
}

const ACTION_MODULES: Record<string, () => ModuleToolDefinition> = {
  mint_token: () => ({
    name: "mint_token",
    description: "Create and mint new ERC20 tokens",
    inputSchema: schemaFromFields([
      { key: "tokenName", label: "Token Name", type: "text", placeholder: "e.g. MyToken" },
      { key: "symbol", label: "Symbol", type: "text", placeholder: "e.g. MTK" },
      { key: "amount", label: "Initial Supply", type: "number", placeholder: "e.g. 1000000" },
    ]),
    toolFunction: "mint_token",
  }),
  mint_nft: () => ({
    name: "mint_nft",
    description: "Create and mint new NFT tokens",
    inputSchema: schemaFromFields([
      { key: "collectionName", label: "Collection Name", type: "text", placeholder: "e.g. CoolNFTs" },
      { key: "metadataUri", label: "Metadata URI", type: "text", placeholder: "ipfs://..." },
    ]),
    toolFunction: "mint_nft",
  }),
  transfer_asset: () => ({
    name: "transfer_asset",
    description: "Transfer tokens or assets between addresses",
    inputSchema: schemaFromFields([
      { key: "recipient", label: "Recipient Address", type: "text", placeholder: "0x..." },
      { key: "amount", label: "Amount", type: "number", placeholder: "e.g. 100" },
      { key: "token", label: "Token", type: "text", placeholder: "e.g. BNB or token address" },
    ]),
    toolFunction: "transfer_asset",
  }),
  create_dao: () => ({
    name: "create_dao",
    description: "Deploy a new decentralized autonomous organization",
    inputSchema: schemaFromFields([
      { key: "daoName", label: "DAO Name", type: "text", placeholder: "e.g. MyDAO" },
      { key: "votingPeriod", label: "Voting Period (hours)", type: "number", placeholder: "e.g. 72" },
    ]),
    toolFunction: "create_dao",
  }),
  send_email: () => ({
    name: "send_email",
    description: "Send emails via SMTP",
    inputSchema: schemaFromFields([
      { key: "to", label: "Recipient Email", type: "text", placeholder: "user@example.com" },
      { key: "subject", label: "Subject", type: "text", placeholder: "Alert: ..." },
      { key: "body", label: "Body Template", type: "text", placeholder: "Hello {{name}}..." },
    ]),
    toolFunction: "send_email",
  }),
  set_reminder: () => ({
    name: "set_reminder",
    description: "Create calendar reminders",
    inputSchema: schemaFromFields([
      { key: "message", label: "Reminder Message", type: "text", placeholder: "Check balance..." },
      { key: "delayMinutes", label: "Delay (minutes)", type: "number", placeholder: "e.g. 60" },
    ]),
    toolFunction: "set_reminder",
  }),
  create_task: () => ({
    name: "create_task",
    description: "Add tasks to task management",
    inputSchema: schemaFromFields([
      { key: "taskTitle", label: "Task Title", type: "text", placeholder: "Review transactions" },
      { key: "priority", label: "Priority", type: "select", placeholder: "Select", options: ["Low", "Medium", "High"] },
    ]),
    toolFunction: "create_task",
  }),
  schedule_meeting: () => ({
    name: "schedule_meeting",
    description: "Book calendar meetings",
    inputSchema: schemaFromFields([
      { key: "title", label: "Meeting Title", type: "text", placeholder: "Weekly sync" },
      { key: "duration", label: "Duration (minutes)", type: "number", placeholder: "e.g. 30" },
    ]),
    toolFunction: "schedule_meeting",
  }),
};

const DATA_MODULES: Record<string, () => ModuleToolDefinition> = {
  fetch_price: () => ({
    name: "fetch_price",
    description: "Get token prices from DEXs",
    inputSchema: schemaFromFields([
      { key: "tokenAddress", label: "Token Address", type: "text", placeholder: "0x..." },
      { key: "dex", label: "DEX", type: "text", placeholder: "e.g. Uniswap" },
    ]),
    toolFunction: "fetch_price",
  }),
  fetch_states: () => ({
    name: "fetch_states",
    description: "Retrieve contract states and data",
    inputSchema: schemaFromFields([
      { key: "contractAddress", label: "Contract Address", type: "text", placeholder: "0x..." },
      { key: "method", label: "Method Name", type: "text", placeholder: "e.g. balanceOf" },
    ]),
    toolFunction: "fetch_states",
  }),
  fetch_balance: () => ({
    name: "fetch_balance",
    description: "Get wallet token balances",
    inputSchema: schemaFromFields([
      { key: "walletAddress", label: "Wallet Address", type: "text", placeholder: "0x... or leave empty for self" },
      { key: "token", label: "Token", type: "text", placeholder: "e.g. BNB" },
    ]),
    toolFunction: "fetch_balance",
  }),
  fetch_transactions: () => ({
    name: "fetch_transactions",
    description: "Query transaction history",
    inputSchema: schemaFromFields([
      { key: "walletAddress", label: "Wallet Address", type: "text", placeholder: "0x..." },
      { key: "limit", label: "Limit", type: "number", placeholder: "e.g. 10" },
    ]),
    toolFunction: "fetch_transactions",
  }),
};

const LOGIC_MODULES: Record<string, () => ModuleToolDefinition> = {
  conditional: () => ({
    name: "conditional",
    description: "Branch based on conditions (if/else)",
    inputSchema: schemaFromFields([
      { key: "condition", label: "Condition Expression", type: "text", placeholder: "e.g. balance > 100" },
      { key: "trueBranch", label: "If True", type: "text", placeholder: "Action to take" },
      { key: "falseBranch", label: "If False", type: "text", placeholder: "Fallback action" },
    ]),
    toolFunction: "conditional",
  }),
  loop: () => ({
    name: "loop",
    description: "Repeat actions on a schedule or count",
    inputSchema: schemaFromFields([
      { key: "iterations", label: "Iterations", type: "number", placeholder: "e.g. 10" },
      { key: "interval", label: "Interval (seconds)", type: "number", placeholder: "e.g. 60" },
    ]),
    toolFunction: "loop",
  }),
};

const INTEGRATION_MODULES: Record<string, () => ModuleToolDefinition> = {
  api_call: () => ({
    name: "api_call",
    description: "Make HTTP requests to external APIs",
    inputSchema: schemaFromFields([
      { key: "url", label: "URL", type: "text", placeholder: "https://api.example.com/data" },
      { key: "method", label: "HTTP Method", type: "select", placeholder: "Select", options: ["GET", "POST", "PUT", "DELETE"] },
      { key: "headers", label: "Headers (JSON)", type: "text", placeholder: '{"Authorization": "Bearer ..."}' },
    ]),
    toolFunction: "api_call",
  }),
  webhook_notify: () => ({
    name: "webhook_notify",
    description: "Send webhook notifications to URLs",
    inputSchema: schemaFromFields([
      { key: "webhookUrl", label: "Webhook URL", type: "text", placeholder: "https://hooks.example.com/..." },
      { key: "payload", label: "Payload Template", type: "text", placeholder: '{"event": "..."}' },
    ]),
    toolFunction: "webhook_notify",
  }),
  query_user: () => ({
    name: "query_user",
    description: "Prompt user for input during agent execution",
    inputSchema: schemaFromFields([
      { key: "prompt", label: "Prompt", type: "text", placeholder: "e.g. Enter your wallet address" },
      { key: "inputType", label: "Input Type", type: "select", placeholder: "Select", options: ["text", "number", "address"] },
    ]),
    toolFunction: "query_user",
  }),
  run_sub_agent: () => ({
    name: "run_sub_agent",
    description: "Invoke another agent as a sub-task",
    inputSchema: schemaFromFields([
      { key: "agentId", label: "Sub-Agent ID", type: "text", placeholder: "Agent ID or name" },
      { key: "inputData", label: "Input Data (JSON)", type: "text", placeholder: '{"key": "value"}' },
    ]),
    toolFunction: "run_sub_agent",
  }),
  notify_user: () => ({
    name: "notify_user",
    description: "Send a notification to the agent owner",
    inputSchema: schemaFromFields([
      { key: "channel", label: "Channel", type: "select", placeholder: "Select", options: ["Push", "Email", "SMS"] },
      { key: "message", label: "Message", type: "text", placeholder: "Your agent completed..." },
    ]),
    toolFunction: "notify_user",
  }),
  store_result: () => ({
    name: "store_result",
    description: "Persist a result for later retrieval",
    inputSchema: schemaFromFields([
      { key: "key", label: "Storage Key", type: "text", placeholder: "e.g. latest_price" },
      { key: "ttl", label: "TTL (seconds)", type: "number", placeholder: "e.g. 3600" },
    ]),
    toolFunction: "store_result",
  }),
};

const PAYMENT_MODULES: Record<string, () => ModuleToolDefinition> = {
  x402_pay: () => ({
    name: "x402_pay",
    description: "Send micropayment via x402 facilitator",
    inputSchema: schemaFromFields([
      { key: "recipientUrl", label: "Payment URL", type: "text", placeholder: "https://service.com/api/premium" },
      { key: "amount", label: "Amount (USDC)", type: "number", placeholder: "e.g. 0.001" },
    ]),
    toolFunction: "x402_pay",
  }),
};

const moduleRegistry: Record<string, () => ModuleToolDefinition> = {
  ...ACTION_MODULES,
  ...DATA_MODULES,
  ...LOGIC_MODULES,
  ...INTEGRATION_MODULES,
  ...PAYMENT_MODULES,
};

export { moduleRegistry };
