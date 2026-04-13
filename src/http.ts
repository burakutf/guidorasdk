import type {
  AssistantQueryOptions,
  BootstrapOptions,
  GuidoraConfig,
  GuideEventType,
  ResolveIntentOptions,
  SdkAssistantResponse,
  SdkBuilderAssistantUpdateResponse,
  SdkBuilderBootstrapResponse,
  SdkBuilderCloseResponse,
  SdkBuilderDeleteResponse,
  SdkBuilderFlowCollectionResponse,
  SdkBuilderFlowMutationResponse,
  SdkBuilderHeartbeatResponse,
  SdkBuilderReorderResponse,
  SdkBuilderSelectOptions,
  SdkBuilderSelectResponse,
  SdkBootstrapResponse,
  SdkEventResponse,
  SdkResolveIntentResponse,
  SdkTokenResponse,
  TrackEventOptions,
} from "./types";
import { normalizeDomain, normalizePath, resolveApiUrl } from "./utils";

type CachedSdkToken = {
  domain: string;
  value: string;
  expiresAt: number;
};

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
  private cachedSdkToken: CachedSdkToken | null = null;
  private pendingSdkTokenRequest: {
    domain: string;
    promise: Promise<string>;
  } | null = null;

  constructor(config: GuidoraConfig) {
    this.config = config;
  }

  async bootstrap(
    payload: Required<
      Pick<BootstrapOptions, "anonymousId" | "sessionKey" | "path">
    > &
      BootstrapOptions,
  ) {
    const domain = normalizeDomain(payload.domain ?? this.config.domain);
    return this.postWithSdkToken<SdkBootstrapResponse>(
      "sdk/bootstrap/",
      domain,
      {
        domain,
        path: normalizePath(payload.path),
        anonymous_id: payload.anonymousId,
        external_id: payload.externalId ?? this.config.externalId ?? null,
        traits: payload.traits ?? this.config.traits ?? {},
        session_key: payload.sessionKey,
      },
    );
  }

  async track(
    eventType: GuideEventType,
    payload: Required<
      Pick<TrackEventOptions, "anonymousId" | "sessionKey" | "path">
    > &
      TrackEventOptions,
  ) {
    const domain = normalizeDomain(payload.domain ?? this.config.domain);
    return this.postWithSdkToken<SdkEventResponse>("sdk/events/", domain, {
      domain,
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
    payload: Required<
      Pick<ResolveIntentOptions, "anonymousId" | "sessionKey" | "path">
    > &
      ResolveIntentOptions,
  ) {
    const domain = normalizeDomain(payload.domain ?? this.config.domain);
    return this.postWithSdkToken<SdkResolveIntentResponse>(
      "sdk/resolve-intent/",
      domain,
      {
        domain,
        anonymous_id: payload.anonymousId,
        question,
        current_path: normalizePath(payload.path),
        session_key: payload.sessionKey,
        external_id: payload.externalId ?? this.config.externalId ?? null,
        traits: payload.traits ?? this.config.traits ?? {},
        locale: payload.locale ?? this.config.locale ?? "tr",
      },
    );
  }

  async assistantQuery(
    question: string,
    payload: Required<
      Pick<AssistantQueryOptions, "anonymousId" | "sessionKey" | "path">
    > &
      AssistantQueryOptions,
  ) {
    const domain = normalizeDomain(payload.domain ?? this.config.domain);
    return this.postWithSdkToken<SdkAssistantResponse>(
      "sdk/assistant/query/",
      domain,
      {
        domain,
        anonymous_id: payload.anonymousId,
        question,
        flow_slug: payload.flowSlug ?? "",
        current_path: normalizePath(payload.path),
        session_key: payload.sessionKey,
        external_id: payload.externalId ?? this.config.externalId ?? null,
        traits: payload.traits ?? this.config.traits ?? {},
        locale: payload.locale ?? this.config.locale ?? "tr",
      },
    );
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

  async builderListFlows(payload: { sessionToken: string; domain?: string }) {
    return this.post<SdkBuilderFlowCollectionResponse>("sdk/builder/flows/", {
      session_token: payload.sessionToken,
      domain: normalizeDomain(payload.domain ?? this.config.domain),
    });
  }

  async builderCreateFlow(payload: {
    sessionToken: string;
    domain?: string;
    pagePath?: string;
    name?: string;
    description?: string;
    type?: string;
    autoStart?: boolean;
    triggerOncePerVisitor?: boolean;
    aiEnabled?: boolean;
  }) {
    return this.post<SdkBuilderFlowMutationResponse>(
      "sdk/builder/create-flow/",
      {
        session_token: payload.sessionToken,
        domain: normalizeDomain(payload.domain ?? this.config.domain),
        page_path: normalizePath(payload.pagePath ?? "/"),
        name: payload.name ?? "",
        description: payload.description ?? "",
        type: payload.type ?? "onboarding_tooltip",
        auto_start: payload.autoStart ?? true,
        trigger_once_per_visitor: payload.triggerOncePerVisitor ?? true,
        ai_enabled: payload.aiEnabled ?? true,
      },
    );
  }

  async builderSwitchFlow(payload: {
    sessionToken: string;
    domain?: string;
    flowId: number;
    pagePath?: string;
  }) {
    return this.post<SdkBuilderFlowMutationResponse>(
      "sdk/builder/switch-flow/",
      {
        session_token: payload.sessionToken,
        domain: normalizeDomain(payload.domain ?? this.config.domain),
        flow_id: payload.flowId,
        page_path: normalizePath(payload.pagePath ?? "/"),
      },
    );
  }

  async builderUpdateFlow(payload: {
    sessionToken: string;
    domain?: string;
    flowId: number;
    name?: string;
    description?: string;
    pagePath?: string;
    autoStart?: boolean;
    triggerOncePerVisitor?: boolean;
    aiEnabled?: boolean;
  }) {
    return this.post<SdkBuilderFlowMutationResponse>(
      "sdk/builder/update-flow/",
      {
        session_token: payload.sessionToken,
        domain: normalizeDomain(payload.domain ?? this.config.domain),
        flow_id: payload.flowId,
        name: payload.name,
        description: payload.description,
        page_path:
          payload.pagePath === undefined
            ? undefined
            : normalizePath(payload.pagePath || "/"),
        auto_start: payload.autoStart,
        trigger_once_per_visitor: payload.triggerOncePerVisitor,
        ai_enabled: payload.aiEnabled,
      },
    );
  }

  async builderDeleteFlow(payload: {
    sessionToken: string;
    domain?: string;
    flowId: number;
    pagePath?: string;
  }) {
    return this.post<SdkBuilderFlowMutationResponse>(
      "sdk/builder/delete-flow/",
      {
        session_token: payload.sessionToken,
        domain: normalizeDomain(payload.domain ?? this.config.domain),
        flow_id: payload.flowId,
        page_path: normalizePath(payload.pagePath ?? "/"),
      },
    );
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

  async builderDeleteStep(payload: {
    sessionToken: string;
    domain?: string;
    stepId: number;
  }) {
    return this.post<SdkBuilderDeleteResponse>("sdk/builder/delete-step/", {
      session_token: payload.sessionToken,
      domain: normalizeDomain(payload.domain ?? this.config.domain),
      step_id: payload.stepId,
    });
  }

  async builderReorderSteps(payload: {
    sessionToken: string;
    domain?: string;
    stepIds: number[];
  }) {
    return this.post<SdkBuilderReorderResponse>("sdk/builder/reorder-steps/", {
      session_token: payload.sessionToken,
      domain: normalizeDomain(payload.domain ?? this.config.domain),
      step_ids: payload.stepIds,
    });
  }

  async builderUpdateAssistant(payload: {
    sessionToken: string;
    domain?: string;
    enabled?: boolean;
    eyebrow?: string;
    launcherLabel?: string;
    launcherIconUrl?: string;
    launcherWidth?: number | null;
    title?: string;
    subtitle?: string;
    welcomeMessage?: string;
    placeholder?: string;
    submitLabel?: string;
    loadingLabel?: string;
    suggestions?: string[];
    position?: string;
    offsetX?: number | null;
    offsetY?: number | null;
    accentColor?: string;
    launcherBackgroundColor?: string;
    launcherTextColor?: string;
    panelBackgroundColor?: string;
    panelTextColor?: string;
    highlightColor?: string;
    highlightOverlayColor?: string;
  }) {
    return this.post<SdkBuilderAssistantUpdateResponse>(
      "sdk/builder/update-assistant/",
      {
        session_token: payload.sessionToken,
        domain: normalizeDomain(payload.domain ?? this.config.domain),
        widget_active: payload.enabled,
        widget_eyebrow: payload.eyebrow,
        widget_launcher_label: payload.launcherLabel,
        widget_launcher_icon_url: payload.launcherIconUrl,
        widget_launcher_width: payload.launcherWidth,
        widget_title: payload.title,
        widget_subtitle: payload.subtitle,
        widget_welcome_message: payload.welcomeMessage,
        widget_placeholder: payload.placeholder,
        widget_submit_label: payload.submitLabel,
        widget_loading_label: payload.loadingLabel,
        widget_suggestions: payload.suggestions,
        widget_position: payload.position,
        widget_offset_x: payload.offsetX,
        widget_offset_y: payload.offsetY,
        theme_accent_color: payload.accentColor,
        theme_launcher_background_color: payload.launcherBackgroundColor,
        theme_launcher_text_color: payload.launcherTextColor,
        theme_panel_background_color: payload.panelBackgroundColor,
        theme_panel_text_color: payload.panelTextColor,
        theme_highlight_color: payload.highlightColor,
        theme_highlight_overlay_color: payload.highlightOverlayColor,
      },
    );
  }

  private async postWithSdkToken<T>(
    endpoint: string,
    domain: string,
    payload: Record<string, unknown>,
  ) {
    let sdkToken = await this.getSdkToken(domain);

    try {
      return await this.post<T>(endpoint, {
        ...payload,
        sdk_token: sdkToken,
      });
    } catch (error) {
      if (!this.shouldRefreshSdkToken(error)) {
        throw error;
      }

      this.clearSdkToken(domain);
      sdkToken = await this.getSdkToken(domain);
      return this.post<T>(endpoint, {
        ...payload,
        sdk_token: sdkToken,
      });
    }
  }

  private async post<T>(endpoint: string, payload: Record<string, unknown>) {
    const response = await fetch(
      resolveApiUrl(this.config.apiBaseUrl, endpoint),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "omit",
      },
    );

    const contentType = response.headers.get("content-type") ?? "";
    const responsePayload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        extractApiMessage(responsePayload) ??
        `Guidora request failed with status ${response.status}.`;
      throw new GuidoraApiError(message, response.status, responsePayload);
    }

    return responsePayload as T;
  }

  private async getSdkToken(domain: string) {
    const now = Date.now();
    if (
      this.cachedSdkToken &&
      this.cachedSdkToken.domain === domain &&
      this.cachedSdkToken.expiresAt > now
    ) {
      return this.cachedSdkToken.value;
    }

    if (
      this.pendingSdkTokenRequest &&
      this.pendingSdkTokenRequest.domain === domain
    ) {
      return this.pendingSdkTokenRequest.promise;
    }

    const promise = this.requestSdkToken(domain).finally(() => {
      if (this.pendingSdkTokenRequest?.promise === promise) {
        this.pendingSdkTokenRequest = null;
      }
    });
    this.pendingSdkTokenRequest = { domain, promise };
    return promise;
  }

  private async requestSdkToken(domain: string) {
    const response = await this.post<SdkTokenResponse>("sdk/token/", {
      api_key: this.config.apiKey,
      domain,
    });
    const expiresInMs = Math.max((response.expires_in || 180) * 1000, 30_000);
    const refreshBufferMs = Math.min(30_000, Math.floor(expiresInMs / 5));

    this.cachedSdkToken = {
      domain,
      value: response.sdk_token,
      expiresAt: Date.now() + expiresInMs - refreshBufferMs,
    };

    return response.sdk_token;
  }

  private clearSdkToken(domain: string) {
    if (this.cachedSdkToken?.domain === domain) {
      this.cachedSdkToken = null;
    }
    if (this.pendingSdkTokenRequest?.domain === domain) {
      this.pendingSdkTokenRequest = null;
    }
  }

  private shouldRefreshSdkToken(error: unknown) {
    if (!(error instanceof GuidoraApiError)) {
      return false;
    }

    if (error.status !== 400 && error.status !== 401) {
      return false;
    }

    const message = extractApiMessage(error.payload)?.toLowerCase() ?? "";
    return message.includes("sdk token");
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
