/**
 * Module Registry
 * Central registry for all available modules (same workflow as Agent Canvas server/modules).
 * Sidebar block types in the Agent Builder map to these modules; selectedModules + workflowJSON drive deployment.
 */

import type { ModuleToolDefinition } from "../types/module";
import { moduleRegistry } from "./definitions";

export function getAllModules(): ModuleToolDefinition[] {
  return Object.values(moduleRegistry).map((getter) => getter());
}

export function getModule(name: string): ModuleToolDefinition | undefined {
  const getter = moduleRegistry[name];
  return getter ? getter() : undefined;
}

export function getModuleNames(): string[] {
  return Object.keys(moduleRegistry);
}

export default moduleRegistry;
