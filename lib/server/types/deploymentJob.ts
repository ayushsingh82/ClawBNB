/**
 * Deployment Job Type Definitions
 * Aligned with Agent Canvas server workflow: jobs are created, polled, and processed by deployment services.
 */

export type DeploymentJobStatus = "pending" | "deploying" | "deployed" | "failed";

export interface DeploymentJob {
  jobId: string;
  userId: string;
  agentId?: string;
  selectedModules: Array<{
    moduleName: string;
    input?: Record<string, unknown>;
    order?: number;
  }>;
  workflowJSON: unknown;
  apiKeys?: Record<string, string | undefined>;
  status: DeploymentJobStatus;
  createdAt: Date;
  updatedAt: Date;
  agentChatURL?: string;
  agentInstanceId?: string;
  workflowVersion?: string;
  deployedAt?: Date;
  errorMessage?: string;
}

export interface CreateDeploymentJobRequest {
  userId: string;
  agentId?: string;
  selectedModules: Array<{
    moduleName: string;
    input?: Record<string, unknown>;
    order?: number;
  }>;
  workflowJSON: unknown;
}

export interface UpdateJobStatusRequest {
  status: DeploymentJobStatus;
  agentChatURL?: string;
  agentInstanceId?: string;
  workflowVersion?: string;
  deployedAt?: Date;
  errorMessage?: string;
}
