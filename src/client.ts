import { GuidoraApiClient } from "./http";
import { BuilderRuntime } from "./runtime/builder";
import { TooltipRuntime } from "./runtime/tooltip";
import { GuidoraStorage } from "./storage";
import type {
  BootstrapOptions,
  JsonRecord,
  SdkBuilderBootstrapResponse,
  GuidoraClient,
  GuidoraConfig,
  GuideEventType,
  ResolveIntentOptions,
  SdkFlow,
  SdkFlowProgress,
  TrackEventOptions,
} from "./types";
import {
  invariantBrowser,
  normalizePath,
  observeNavigation,
  readQueryParam,
} from "./utils";

const BUILDER_QUERY_PARAM = "guidora_builder";

export class GuidoraBrowserClient implements GuidoraClient {
  private readonly config: GuidoraConfig;
  private readonly storage: GuidoraStorage;
  private readonly api: GuidoraApiClient;
  private readonly builderRuntime: BuilderRuntime;
  private readonly tooltipRuntime: TooltipRuntime;
  private removeNavigationObserver: (() => void) | null = null;
  private lastBootstrapPath = "";
  private builderBootstrapPromise: Promise<SdkBuilderBootstrapResponse> | null =
    null;

  constructor(config: GuidoraConfig) {
    invariantBrowser();
    this.config = config;
    this.storage = new GuidoraStorage(config.storagePrefix);
    this.api = new GuidoraApiClient(config);
    this.builderRuntime = new BuilderRuntime(
      this.api,
      config.zIndex,
      (error) => {
        this.handleError(error);
      },
      (sessionToken) => {
        if (sessionToken) {
          this.storage.setBuilderSessionToken(sessionToken);
          return;
        }

        this.storage.clearBuilderSessionToken();
      },
    );
    this.tooltipRuntime = new TooltipRuntime(config.zIndex);

    if (config.autoTrackNavigation !== false) {
      this.removeNavigationObserver = observeNavigation(() => {
        const nextPath = normalizePath(window.location.pathname);
        if (this.builderRuntime.isActive()) {
          this.lastBootstrapPath = nextPath;
          void this.builderRuntime
            .handleLocationChange()
            .catch((error: Error) => {
              this.handleError(error);
            });
          return;
        }
        if (nextPath === this.lastBootstrapPath) {
          return;
        }

        void this.bootstrap({ path: nextPath }).catch((error: Error) => {
          this.handleError(error);
        });
      });
    }
  }

  getAnonymousId() {
    return this.storage.getAnonymousId();
  }

  getSessionKey() {
    return this.storage.getSessionKey();
  }

  async bootstrap(options: BootstrapOptions = {}) {
    try {
      const path = normalizePath(options.path ?? window.location.pathname);
      this.lastBootstrapPath = path;

      const builderSession = await this.maybeStartBuilderMode();
      if (builderSession) {
        this.tooltipRuntime.hide();
        return this.createBuilderBootstrapResponse(
          builderSession,
          path,
          options,
        );
      }

      const response = await this.api.bootstrap({
        ...options,
        path,
        anonymousId: options.anonymousId ?? this.getAnonymousId(),
        sessionKey: options.sessionKey ?? this.getSessionKey(),
      });

      if (response.flow && response.progress) {
        await this.startFlow(response.flow, response.progress, {
          emitFlowStarted: false,
        });
      } else {
        this.tooltipRuntime.hide();
      }

      return response;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  async resolveIntent(question: string, options: ResolveIntentOptions = {}) {
    try {
      const response = await this.api.resolveIntent(question, {
        ...options,
        path: normalizePath(options.path ?? window.location.pathname),
        anonymousId: options.anonymousId ?? this.getAnonymousId(),
        sessionKey: options.sessionKey ?? this.getSessionKey(),
      });

      if (response.flow && response.progress) {
        await this.startFlow(response.flow, response.progress, {
          emitFlowStarted: true,
        });
      }

      return response;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  async track(eventType: GuideEventType, options: TrackEventOptions = {}) {
    try {
      return await this.api.track(eventType, {
        ...options,
        path: normalizePath(options.path ?? window.location.pathname),
        anonymousId: options.anonymousId ?? this.getAnonymousId(),
        sessionKey: options.sessionKey ?? this.getSessionKey(),
      });
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  destroy() {
    this.removeNavigationObserver?.();
    this.removeNavigationObserver = null;
    this.builderRuntime.destroy();
    this.tooltipRuntime.destroy();
  }

  private async maybeStartBuilderMode() {
    if (this.builderRuntime.isActive()) {
      return this.builderRuntime.getSession();
    }

    const querySessionToken = readQueryParam(BUILDER_QUERY_PARAM).trim();
    const storedSessionToken = this.storage.getBuilderSessionToken();
    const sessionToken = querySessionToken || storedSessionToken;

    if (!sessionToken) {
      return null;
    }

    if (querySessionToken && querySessionToken !== storedSessionToken) {
      this.storage.setBuilderSessionToken(querySessionToken);
    }

    if (!this.builderBootstrapPromise) {
      this.builderBootstrapPromise = this.builderRuntime.start(sessionToken);
    }

    try {
      return await this.builderBootstrapPromise;
    } catch (error) {
      this.builderBootstrapPromise = null;
      this.storage.clearBuilderSessionToken();
      this.handleError(error as Error);
      return null;
    }
  }

  private getOrderedSteps(flow: SdkFlow) {
    return [...flow.steps].sort(
      (left, right) => left.step_order - right.step_order,
    );
  }

  private resolveActiveStep(flow: SdkFlow, currentStepOrder: number) {
    const orderedSteps = this.getOrderedSteps(flow);
    if (!orderedSteps.length) {
      return null;
    }

    return (
      orderedSteps.find((step) => step.step_order >= currentStepOrder) ??
      orderedSteps[orderedSteps.length - 1] ??
      null
    );
  }

  private routeToStepIfNeeded(step: SdkFlowStep) {
    const targetPath = normalizePath(
      step.page_path || window.location.pathname,
    );
    if (targetPath === normalizePath(window.location.pathname)) {
      return false;
    }

    this.tooltipRuntime.hide();
    window.location.assign(targetPath);
    return true;
  }

  private createBuilderBootstrapResponse(
    builderSession: SdkBuilderBootstrapResponse,
    path: string,
    options: BootstrapOptions,
  ) {
    const timestamp = new Date().toISOString();
    const traits = (options.traits ?? this.config.traits ?? {}) as JsonRecord;

    return {
      domain: builderSession.session.domain,
      visitor: {
        id: 0,
        anonymous_id: options.anonymousId ?? this.getAnonymousId(),
        external_id: options.externalId ?? this.config.externalId ?? null,
        traits,
        last_seen_path: path,
        created_time: timestamp,
        modified_time: timestamp,
      },
      flow: builderSession.flow,
      progress: null,
      triggered: false,
      started: false,
    };
  }

  private async startFlow(
    flow: SdkFlow,
    progress: SdkFlowProgress,
    options: { emitFlowStarted: boolean },
  ) {
    const currentStepOrder =
      progress.current_step_order || flow.steps[0]?.step_order || 1;
    const activeStep = this.resolveActiveStep(flow, currentStepOrder);

    if (!activeStep) {
      this.tooltipRuntime.hide();
      return;
    }

    if (options.emitFlowStarted) {
      await this.safeTrack("flow_started", {
        flowSlug: flow.slug,
        stepOrder: activeStep.step_order,
      });
    }

    if (this.routeToStepIfNeeded(activeStep)) {
      return;
    }

    this.config.onFlowStart?.(flow);

    await this.tooltipRuntime.start(flow, activeStep.step_order, {
      onStepViewed: async (step) => {
        await this.safeTrack("step_viewed", {
          flowSlug: flow.slug,
          stepOrder: step.step_order,
        });
      },
      onStepCompleted: async (step) => {
        await this.safeTrack("step_completed", {
          flowSlug: flow.slug,
          stepOrder: step.step_order,
        });
      },
      onFlowCompleted: async (_completedFlow, completedStep) => {
        await this.safeTrack("flow_completed", {
          flowSlug: flow.slug,
          stepOrder: completedStep.step_order,
        });
        this.config.onFlowComplete?.(flow);
      },
      onFlowDismissed: async (_dismissedFlow, activeStep) => {
        await this.safeTrack("flow_dismissed", {
          flowSlug: flow.slug,
          stepOrder: activeStep.step_order,
        });
        this.config.onFlowDismiss?.(flow);
      },
    });
  }

  private async safeTrack(
    eventType: GuideEventType,
    options: TrackEventOptions,
  ) {
    try {
      await this.track(eventType, options);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private handleError(error: Error) {
    if (this.config.onError) {
      this.config.onError(error);
      return;
    }

    console.error("[Guidora SDK]", error);
  }
}
