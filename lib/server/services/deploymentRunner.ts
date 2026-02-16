import prisma from "../db";
import { logger } from "./logger";
import { AgentFactoryService } from "./agentFactory";
import type { AgentStatus } from "@prisma/client";

export interface DeployRequest {
  agentId: string;
  userId: string;
}

export interface DeployResult {
  success: boolean;
  workerUrl?: string;
  workerId?: string;
  error?: string;
}

export class DeploymentRunner {
  private factory: AgentFactoryService;

  constructor() {
    this.factory = new AgentFactoryService();
  }

  async runDeployment(req: DeployRequest): Promise<DeployResult> {
    const { agentId, userId } = req;

    // 1. Validate agent exists and belongs to user
    const agent = await this.validate(agentId, userId);
    if (!agent) {
      return { success: false, error: "Agent not found or unauthorized" };
    }

    // 2. Create deployment record + set agent to deploying
    const deployment = await this.createDeployment(agentId);
    logger.info(`Deployment ${deployment.id} created for agent ${agentId}`);

    try {
      // 3. Update status to deploying
      await this.updateAgentStatus(agentId, "deploying");
      await this.updateDeploymentStatus(deployment.id, "deploying");

      // 4. Call Agent Factory
      const factoryResult = await this.factory.deploy(agent);

      if (!factoryResult.success) {
        throw new Error(factoryResult.error || "Factory deployment failed");
      }

      // 5. Persist success
      await this.onDeploySuccess(
        agentId,
        deployment.id,
        factoryResult.workerUrl!,
        factoryResult.workerId!
      );

      logger.info(
        `Agent ${agentId} deployed → ${factoryResult.workerUrl}`
      );

      return {
        success: true,
        workerUrl: factoryResult.workerUrl,
        workerId: factoryResult.workerId,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Deployment failed for agent ${agentId}:`, message);

      await this.onDeployFailure(agentId, deployment.id, message);

      return { success: false, error: message };
    }
  }

  private async validate(agentId: string, userId: string) {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId },
      include: { user: true },
    });
    return agent;
  }

  private async createDeployment(agentId: string) {
    return prisma.deployment.create({
      data: {
        agentId,
        deploymentStatus: "pending",
        logs: [],
      },
    });
  }

  private async updateAgentStatus(agentId: string, status: AgentStatus) {
    await prisma.agent.update({
      where: { id: agentId },
      data: { status },
    });
  }

  private async updateDeploymentStatus(
    deploymentId: string,
    status: "pending" | "deploying" | "deployed" | "failed",
    extra?: { workerUrl?: string; workerId?: string; errorMessage?: string }
  ) {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        deploymentStatus: status,
        ...(extra?.workerUrl && { workerUrl: extra.workerUrl }),
        ...(extra?.workerId && { cloudflareWorkerId: extra.workerId }),
        ...(extra?.errorMessage && { errorMessage: extra.errorMessage }),
      },
    });
  }

  private async onDeploySuccess(
    agentId: string,
    deploymentId: string,
    workerUrl: string,
    workerId: string
  ) {
    await Promise.all([
      prisma.agent.update({
        where: { id: agentId },
        data: { status: "live", workerUrl },
      }),
      this.updateDeploymentStatus(deploymentId, "deployed", {
        workerUrl,
        workerId,
      }),
    ]);
  }

  private async onDeployFailure(
    agentId: string,
    deploymentId: string,
    errorMessage: string
  ) {
    await Promise.all([
      prisma.agent.update({
        where: { id: agentId },
        data: { status: "failed" },
      }),
      this.updateDeploymentStatus(deploymentId, "failed", { errorMessage }),
    ]);
  }
}
