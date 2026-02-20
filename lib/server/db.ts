/**
 * db.ts — Re-exports local JSON file DB as drop-in replacement for Prisma.
 * All API routes import `prisma from "@/lib/server/db"` and work unchanged.
 */
import localDb from "./local-db";

export const prisma = localDb;
export default localDb;
