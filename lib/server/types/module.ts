/**
 * Module tool definition (server-side).
 * Mirrors Agent Canvas: each sidebar block type is backed by a module with name, description, inputSchema, toolFunction.
 */

export interface ModuleToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description?: string; [key: string]: unknown }>;
    required?: string[];
  };
  toolFunction: string;
}
