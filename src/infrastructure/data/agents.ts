import type { Agent } from "@/domain/types";

/**
 * No real `/agents` API exists yet — listings only carry an `agentId` foreign
 * key with nothing to resolve it against today (every real listing currently
 * has `agentId: null`). Callers must treat a missing agent as "no agent" (no
 * contact card) rather than falling back to placeholder/fake agent data.
 */
export function getAgent(_id: number): Agent | undefined {
  return undefined;
}
