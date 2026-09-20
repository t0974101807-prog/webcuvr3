import { config } from "../../config/env";
import db from "../../db/database";

export type AiRuntimeState = "READY" | "NOT_CONFIGURED" | "DISABLED" | "DEGRADED";

let consecutiveFailures = 0;
let circuitOpenedUntil = 0;

const CIRCUIT_FAILURE_LIMIT = 3;
const CIRCUIT_COOLDOWN_MS = 60_000;

export function getAiRuntimeStatus(): { state: AiRuntimeState; enabled: boolean; consecutiveFailures: number; retryAt?: string } {
  const enabled = config.AI_ENABLED;
  if (!enabled) return { state: "DISABLED", enabled, consecutiveFailures };

  if (circuitOpenedUntil > Date.now()) {
    return {
      state: "DEGRADED",
      enabled,
      consecutiveFailures,
      retryAt: new Date(circuitOpenedUntil).toISOString(),
    };
  }

  const configured = Boolean(config.GEMINI_API_KEY) || hasConfiguredDatabaseProvider();
  return { state: configured ? "READY" : "NOT_CONFIGURED", enabled, consecutiveFailures };
}

export function assertAiAvailable() {
  const status = getAiRuntimeStatus();
  if (status.state === "DISABLED") {
    const error = new Error("AI runtime is disabled. Core Legal OS functions remain available.");
    (error as any).code = "AI_DISABLED";
    throw error;
  }
  if (status.state === "DEGRADED") {
    const error = new Error("AI runtime is temporarily unavailable. Core Legal OS functions remain available.");
    (error as any).code = "AI_DEGRADED";
    throw error;
  }
}

export function recordAiSuccess() {
  consecutiveFailures = 0;
  circuitOpenedUntil = 0;
}

export function recordAiFailure() {
  consecutiveFailures += 1;
  if (consecutiveFailures >= CIRCUIT_FAILURE_LIMIT) {
    circuitOpenedUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
  }
}

function hasConfiguredDatabaseProvider() {
  try {
    const row = db.prepare("SELECT 1 FROM ai_providers WHERE is_active = 1 AND api_key != '' LIMIT 1").get();
    return Boolean(row);
  } catch {
    return false;
  }
}
