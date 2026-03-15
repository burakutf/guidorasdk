import type {
  BootstrapOptions,
  GuidoraConfig,
  GuideEventType,
  ResolveIntentOptions,
  SdkBuilderBootstrapResponse,
  SdkBuilderCloseResponse,
  SdkBuilderHeartbeatResponse,
  SdkBuilderSelectOptions,
  SdkBuilderSelectResponse,
  SdkBootstrapResponse,
  SdkEventResponse,
  SdkResolveIntentResponse,
  TrackEventOptions,
} from "./types";
import { normalizeDomain, normalizePath, resolveApiUrl } from "./utils";

export class GuidoraApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "GuidoraApiError";
    this.status = status;
    this.payload = payload;
  }
}

export class GuidoraApiClient {
  private readonly config: GuidoraConfig;

  constructor(config: GuidoraConfig) {
    this.config = config;
  }

  async bootstrap(payload: Required<Pick<BootstrapOptions, "anonymousId" | "sessionKey" | "path">> & BootstrapOptions) {
    return this.post<SdkBootstrapResponse>("sdk/bootstrap/", {
      api_key: this.config.apiKey,
      domain: normalizeDomain(payload.domain ?? this.config.domain),
      path: normalizePath(payload.path),
      anonymous_id: payload.anonymousId,
      external_id: payload.externalId ?? this.config.externalId ?? null,
      traits: payload.traits ?? this.config.traits ?? {},
      session_key: payload.sessionKey,
    });
  }

  async track(eventType: GuideEventType, payload: Required<Pick<TrackEventOptions, "anonymousId" | "sessionKey" | "path">> & TrackEventOptions) {
    return this.post<SdkEventResponse>("sdk/events/", {
      api_key: this.config.apiKey,
      domain: normalizeDomain(payload.domain ?? this.config.domain),
      anonymous_id: payload.anonymousId,
      event_type: eventType,
      flow_slug: payload.flowSlug ?? "",
      step_order: payload.stepOrder,
      current_path: normalizePath(payload.path),
      session_key: payload.sessionKey,
      metadata: payload.metadata ?? {},
      external_id: payload.externalId ?? this.config.externalId ?? null,
      traits: payload.traits ?? this.config.traits ?? {},
    });
  }

  async resolveIntent(
    question: string,
    payload: Required<Pick<ResolveIntentOptions, "anonymousId" | "sessionKey" | "path">> & ResolveIntentOptions,
  ) {
    return this.post<SdkResolveIntentResponse>("sdk/resolve-intent/", {
      api_key: this.config.apiKey,
      domain: normalizeDomain(payload.domain ?? this.config.domain),
      anonymous_id: payload.anonymousId,
      question,
      current_path: normalizePath(payload.path),
      session_key: payload.sessionKey,
      external_id: payload.externalId ?? this.config.externalId ?? null,
      traits: payload.traits ?? this.config.traits ?? {},
      locale: payload.locale ?? this.config.locale ?? "tr",
    });
  }

  async builderBootstrap(payload: { sessionToken: string; domain?: string }) {
    return this.post<SdkBuilderBootstrapResponse>("sdk/builder/bootstrap/", {
      session_token: payload.sessionToken,
      domain: normalizeDomain(payload.domain ?? this.config.domain),
    });
  }

  async builderHeartbeat(payload: { sessionToken: string; domain?: string }) {
    return this.post<SdkBuilderHeartbeatResponse>("sdk/builder/heartbeat/", {
      session_token: payload.sessionToken,
      domain: normalizeDomain(payload.domain ?? this.config.domain),
    });
  }

  async builderSelect(sessionToken: string, payload: SdkBuilderSelectOptions) {
    return this.post<SdkBuilderSelectResponse>("sdk/builder/select/", {
      session_token: sessionToken,
      domain: normalizeDomain(payload.domain ?? this.config.domain),
      page_path: normalizePath(payload.pagePath),
      selector: payload.selector,
      tooltip_title: payload.tooltipTitle ?? "",
      tooltip_body: payload.tooltipBody ?? "",
      position: payload.position ?? "bottom",
      wait_for_element: payload.waitForElement ?? true,
      advance_mode: payload.advanceMode ?? "next_click",
      step_order: payload.stepOrder,
    });
  }

  async builderClose(payload: { sessionToken: string; domain?: string }) {
    return this.post<SdkBuilderCloseResponse>("sdk/builder/close/", {
      session_token: payload.sessionToken,
      domain: normalizeDomain(payload.domain ?? this.config.domain),
    });
  }

  private async post<T>(endpoint: string, payload: Record<string, unknown>) {
    const response = await fetch(resolveApiUrl(this.config.apiBaseUrl, endpoint), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "omit",
    });

    const contentType = response.headers.get("content-type") ?? "";
    const responsePayload = contentType.includes("application/json") ? await response.json() : await response.text();

    if (!response.ok) {
      const message = extractApiMessage(responsePayload) ?? `Guidora request failed with status ${response.status}.`;
      throw new GuidoraApiError(message, response.status, responsePayload);
    }

    return responsePayload as T;
  }
}

function extractApiMessage(payload: unknown): string | null {
  if (!payload) {
    return null;
  }
  if (typeof payload === "string") {
    return payload;
  }
  if (Array.isArray(payload)) {
    for (const value of payload) {
      const message = extractApiMessage(value);
      if (message) {
        return message;
      }
    }
    return null;
  }
  if (typeof payload === "object") {
    for (const value of Object.values(payload)) {
      const message = extractApiMessage(value);
      if (message) {
        return message;
      }
    }
  }
  return null;
}