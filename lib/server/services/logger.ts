/**
 * Simple logger for server-side services (deployment, etc.).
 * Mirrors Agent Canvas server/services/logger usage.
 */

type Level = "debug" | "info" | "warn" | "error";

function log(level: Level, ...args: unknown[]): void {
  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
  if (typeof window !== "undefined") {
    console[level === "debug" ? "log" : level](prefix, ...args);
  } else {
    console[level === "debug" ? "log" : level](prefix, ...args);
  }
}

export const logger = {
  debug: (...args: unknown[]) => log("debug", ...args),
  info: (...args: unknown[]) => log("info", ...args),
  warn: (...args: unknown[]) => log("warn", ...args),
  error: (...args: unknown[]) => log("error", ...args),
};
