export interface JsonRecord {
  [key: string]: JsonValue;
}

export interface JsonArray extends Array<JsonValue> {}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonRecord
  | JsonArray;

export type GuideEventType =
  | "page_view"
  | "flow_started"
  | "step_viewed"
  | "step_completed"
  | "flow_completed"
  | "flow_dismissed"
  | "ai_query"
  | "flow_suggested";

export type TooltipPosition =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "center"
  | string;
export type AdvanceMode = "next_click" | "target_click" | "auto" | string;

export interface GuidoraConfig {
  apiKey: string;
  apiBaseUrl?: string;
  domain?: string;
  locale?: string;
  externalId?: string | null;
  traits?: JsonRecord;
  storagePrefix?: string;
  zIndex?: number;
  autoTrackNavigation?: boolean;
  assistant?: GuidoraAssistantConfig;
  onFlowStart?: (flow: SdkFlow) => void;
  onFlowComplete?: (flow: SdkFlow) => void;
  onFlowDismiss?: (flow: SdkFlow) => void;
  onError?: (error: Error) => void;
}

export interface BootstrapOptions {
  domain?: string;
  path?: string;
  anonymousId?: string;
  externalId?: string | null;
  traits?: JsonRecord;
  sessionKey?: string;
}

export interface ResolveIntentOptions {
  domain?: string;
  path?: string;
  anonymousId?: string;
  externalId?: string | null;
  traits?: JsonRecord;
  sessionKey?: string;
  locale?: string;
}

export interface AssistantQueryOptions {
  domain?: string;
  path?: string;
  anonymousId?: string;
  externalId?: string | null;
  traits?: JsonRecord;
  sessionKey?: string;
  locale?: string;
}

export interface GuidoraAssistantConfig {
  agent_id?: number;
  name?: string;
  enabled?: boolean;
  launcherLabel?: string;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  welcomeMessage?: string;
  placeholder?: string;
  submitLabel?: string;
  loadingLabel?: string;
  suggestions?: string[];
}

export interface TrackEventOptions {
  domain?: string;
  path?: string;
  anonymousId?: string;
  externalId?: string | null;
  traits?: JsonRecord;
  sessionKey?: string;
  flowSlug?: string;
  stepOrder?: number;
  metadata?: JsonRecord;
}

export interface SdkFlowStep {
  id: number;
  step_order: number;
  page_path: string;
  selector: string;
  tooltip_title: string;
  tooltip_body: string;
  position: TooltipPosition;
  wait_for_element: boolean;
  advance_mode: AdvanceMode;
}

export interface SdkFlow {
  id: number;
  slug: string;
  name: string;
  type: string;
  status: string;
  description: string;
  priority: number;
  trigger_once_per_visitor: boolean;
  ai_enabled: boolean;
  entry_path: string;
  page_auto_start: boolean;
  steps: SdkFlowStep[];
}

export interface SdkFlowProgress {
  state: string;
  trigger_source: string;
  current_step_order: number;
  started_time: string;
  completed_time: string | null;
  dismissed_time: string | null;
  last_triggered_time: string;
  seen_count: number;
}

export interface SdkBootstrapResponse {
  domain: {
    id: number;
    domain: string;
    display_name: string;
    verified: boolean;
    is_primary: boolean;
  };
  visitor: {
    id: number;
    anonymous_id: string;
    external_id: string | null;
    traits: JsonRecord;
    last_seen_path: string;
    created_time: string;
    modified_time: string;
  };
  flow: SdkFlow | null;
  progress: SdkFlowProgress | null;
  assistant: GuidoraAssistantConfig | null;
  triggered: boolean;
  started: boolean;
}

export interface SdkEventResponse {
  event_id: number;
  flow: SdkFlow | null;
  progress: SdkFlowProgress | null;
}

export interface SdkResolveIntentResponse {
  matched: boolean;
  matched_intent: string;
  score: number;
  flow: SdkFlow | null;
  progress: SdkFlowProgress | null;
}

export interface SdkAssistantDraftFlow {
  name: string;
  description: string;
  entry_path: string;
  suggested_intents: string[];
  suggested_copy?: string;
}

export interface SdkAssistantUsage {
  plan: string;
  queries_used: number;
  queries_limit: number | null;
  queries_remaining: number | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface SdkAssistantResponse {
  action:
    | "start_flow"
    | "highlight"
    | "suggest_flow"
    | "limit_reached"
    | string;
  message: string;
  matched: boolean;
  matched_intent: string;
  score: number;
  flow: SdkFlow | null;
  progress: SdkFlowProgress | null;
  highlight_step: SdkFlowStep | null;
  draft_flow: SdkAssistantDraftFlow | null;
  usage: SdkAssistantUsage;
  source: string;
  assistant: GuidoraAssistantConfig | null;
}

export interface SdkBuilderSession {
  id: number;
  session_token: string;
  domain: {
    id: number;
    domain: string;
    display_name: string;
    verified: boolean;
    is_primary: boolean;
  };
  flow_id: number;
  flow_name: string;
  flow_slug: string;
  page_url: string;
  builder_url: string;
  active: boolean;
  last_heartbeat_time: string;
  created_time: string;
  modified_time: string;
}

export interface SdkBuilderBootstrapResponse {
  session: SdkBuilderSession;
  flow: SdkFlow;
  next_step_order: number;
}

export interface SdkBuilderHeartbeatResponse {
  active: boolean;
  last_heartbeat_time: string;
}

export interface SdkBuilderSelectOptions {
  domain?: string;
  pagePath?: string;
  selector: string;
  tooltipTitle?: string;
  tooltipBody?: string;
  position?: TooltipPosition;
  waitForElement?: boolean;
  advanceMode?: AdvanceMode;
  stepOrder?: number;
}

export interface SdkBuilderSelectResponse {
  created: boolean;
  step: SdkFlowStep;
  next_step_order: number;
}

export interface SdkBuilderDeleteResponse {
  deleted: boolean;
  steps: SdkFlowStep[];
  next_step_order: number;
}

export interface SdkBuilderReorderResponse {
  reordered: boolean;
  steps: SdkFlowStep[];
  next_step_order: number;
}

export interface SdkBuilderFlowCollectionResponse {
  flows: SdkFlow[];
  active_flow_id: number;
}

export interface SdkBuilderFlowMutationResponse {
  session: SdkBuilderSession;
  flow: SdkFlow;
  flows: SdkFlow[];
  active_flow_id: number;
  next_step_order: number;
}

export interface SdkBuilderCloseResponse {
  active: boolean;
}

export interface GuidoraClient {
  bootstrap(options?: BootstrapOptions): Promise<SdkBootstrapResponse>;
  resolveIntent(
    question: string,
    options?: ResolveIntentOptions,
  ): Promise<SdkResolveIntentResponse>;
  askAssistant(
    question: string,
    options?: AssistantQueryOptions,
  ): Promise<SdkAssistantResponse>;
  track(
    eventType: GuideEventType,
    options?: TrackEventOptions,
  ): Promise<SdkEventResponse>;
  destroy(): void;
  getAnonymousId(): string;
  getSessionKey(): string;
}
