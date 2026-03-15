import { GuidoraBrowserClient } from "./client";
import type { GuidoraClient, GuidoraConfig } from "./types";

export * from "./types";

export function initGuidora(config: GuidoraConfig): GuidoraClient {
  return new GuidoraBrowserClient(config);
}