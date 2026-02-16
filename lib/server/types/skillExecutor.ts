export interface ExecutionContext {
  input: Record<string, unknown>;
  results: Record<string, unknown>;
  agentId: string;
  env?: Record<string, unknown>;
}

export type SkillExecutor = (
  config: Record<string, string>,
  context: ExecutionContext
) => Promise<unknown>;

export interface AgentGraph {
  agentId: string;
  agentName: string;
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    config: Record<string, string>;
  }>;
  edges: Array<{
    source: string;
    target: string;
  }>;
}

export interface ExecutionResult {
  agentId: string;
  agentName: string;
  executedAt: string;
  nodeCount: number;
  results: Record<string, unknown>;
}
