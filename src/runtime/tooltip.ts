import type { SdkFlow, SdkFlowStep } from "../types";
import { clamp, ensureElementInViewport, normalizePath, wait } from "../utils";
import { injectGuidoraStyles } from "./style";

type TooltipRuntimeHandlers = {
  onStepViewed: (step: SdkFlowStep) => Promise<void> | void;
  onStepCompleted: (step: SdkFlowStep) => Promise<void> | void;
  onFlowCompleted: (flow: SdkFlow, step: SdkFlowStep) => Promise<void> | void;
  onFlowDismissed: (flow: SdkFlow, step: SdkFlowStep) => Promise<void> | void;
  onRouteToStep: (flow: SdkFlow, step: SdkFlowStep) => boolean;
};

type ActiveFlowSession = {
  flow: SdkFlow;
  currentStepIndex: number;
  viewedSteps: Set<number>;
  handlers: TooltipRuntimeHandlers;
};

export class TooltipRuntime {
  private readonly zIndex: number;
  private root: HTMLDivElement | null = null;
  private highlight: HTMLDivElement | null = null;
  private card: HTMLDivElement | null = null;
  private badge: HTMLDivElement | null = null;
  private title: HTMLHeadingElement | null = null;
  private body: HTMLParagraphElement | null = null;
  private stepLabel: HTMLSpanElement | null = null;
  private dismissButton: HTMLButtonElement | null = null;
  private nextButton: HTMLButtonElement | null = null;
  private activeSession: ActiveFlowSession | null = null;
  private currentTarget: HTMLElement | null = null;
  private cleanupCallbacks: Array<() => void> = [];
  private renderToken = 0;

  constructor(zIndex = 2147483000) {
    this.zIndex = zIndex;
  }

  async start(
    flow: SdkFlow,
    currentStepOrder: number,
    handlers: TooltipRuntimeHandlers,
  ) {
    injectGuidoraStyles(this.zIndex);
    this.ensureDom();

    const sortedFlow = {
      ...flow,
      steps: [...flow.steps].sort(
        (left, right) => left.step_order - right.step_order,
      ),
    };

    const nextIndex = Math.max(
      0,
      sortedFlow.steps.findIndex(
        (step) => step.step_order === currentStepOrder,
      ),
    );

    this.activeSession = {
      flow: sortedFlow,
      currentStepIndex: nextIndex >= 0 ? nextIndex : 0,
      viewedSteps: new Set<number>(),
      handlers,
    };

    if (this.root) {
      this.root.classList.remove("guidora-sdk-hidden");
    }

    await this.renderCurrentStep();
  }

  hide() {
    this.teardownPerStepEffects();
    this.activeSession = null;
    this.currentTarget = null;
    if (this.root) {
      this.root.classList.add("guidora-sdk-hidden");
    }
  }

  destroy() {
    this.hide();
    this.root?.remove();
    this.root = null;
    this.highlight = null;
    this.card = null;
    this.badge = null;
    this.title = null;
    this.body = null;
    this.stepLabel = null;
    this.dismissButton = null;
    this.nextButton = null;
  }

  private ensureDom() {
    if (this.root) {
      return;
    }

    this.root = document.createElement("div");
    this.root.className = "guidora-sdk-root guidora-sdk-hidden";

    this.highlight = document.createElement("div");
    this.highlight.className = "guidora-sdk-highlight guidora-sdk-hidden";

    this.card = document.createElement("div");
    this.card.className = "guidora-sdk-card";

    this.badge = document.createElement("div");
    this.badge.className = "guidora-sdk-badge";
    this.badge.textContent = "Guidora walkthrough";

    this.title = document.createElement("h3");
    this.title.className = "guidora-sdk-title";

    this.body = document.createElement("p");
    this.body.className = "guidora-sdk-body";

    const footer = document.createElement("div");
    footer.className = "guidora-sdk-footer";

    this.stepLabel = document.createElement("span");
    this.stepLabel.className = "guidora-sdk-step";

    const actions = document.createElement("div");
    actions.className = "guidora-sdk-actions";

    this.dismissButton = document.createElement("button");
    this.dismissButton.type = "button";
    this.dismissButton.className =
      "guidora-sdk-button guidora-sdk-button-secondary";
    this.dismissButton.textContent = "Dismiss";
    this.dismissButton.addEventListener("click", () => {
      void this.handleDismiss();
    });

    this.nextButton = document.createElement("button");
    this.nextButton.type = "button";
    this.nextButton.className = "guidora-sdk-button guidora-sdk-button-primary";
    this.nextButton.addEventListener("click", () => {
      void this.handleAdvance();
    });

    actions.append(this.dismissButton, this.nextButton);
    footer.append(this.stepLabel, actions);
    this.card.append(this.badge, this.title, this.body, footer);
    this.root.append(this.highlight, this.card);
    document.body.append(this.root);
  }

  private async renderCurrentStep() {
    const session = this.activeSession;
    const card = this.card;
    const highlight = this.highlight;
    const title = this.title;
    const body = this.body;
    const stepLabel = this.stepLabel;
    const nextButton = this.nextButton;

    if (
      !session ||
      !card ||
      !highlight ||
      !title ||
      !body ||
      !stepLabel ||
      !nextButton
    ) {
      return;
    }

    const step = session.flow.steps[session.currentStepIndex];
    if (!step) {
      this.hide();
      return;
    }

    this.teardownPerStepEffects();
    const token = ++this.renderToken;

    title.textContent = step.tooltip_title || session.flow.name;
    body.textContent =
      step.tooltip_body ||
      session.flow.description ||
      "Continue through the highlighted product step.";
    stepLabel.textContent = `Step ${session.currentStepIndex + 1} of ${session.flow.steps.length}`;
    nextButton.textContent = this.buildNextLabel(
      step,
      session.currentStepIndex === session.flow.steps.length - 1,
    );

    const target = await this.resolveTarget(step, token);
    if (token !== this.renderToken || !this.activeSession) {
      return;
    }

    this.currentTarget = target;
    this.updateHighlight(target);
    this.positionCard(target, step.position);
    this.registerViewportListeners(step);
    this.registerAdvanceTriggers(step);

    if (!session.viewedSteps.has(step.id)) {
      session.viewedSteps.add(step.id);
      await session.handlers.onStepViewed(step);
    }
  }

  private async resolveTarget(step: SdkFlowStep, token: number) {
    if (!step.selector) {
      return null;
    }

    const timeoutAt = Date.now() + (step.wait_for_element ? 8000 : 0);

    while (token === this.renderToken) {
      const element = document.querySelector<HTMLElement>(step.selector);
      if (element) {
        await ensureElementInViewport(element, {
          block: "center",
          inline: "center",
          behavior: "smooth",
        });
        return element;
      }

      if (!step.wait_for_element || Date.now() >= timeoutAt) {
        return null;
      }

      await wait(250);
    }

    return null;
  }

  private updateHighlight(target: HTMLElement | null) {
    if (!this.highlight) {
      return;
    }

    if (!target) {
      this.highlight.classList.add("guidora-sdk-hidden");
      return;
    }

    const rect = target.getBoundingClientRect();
    this.highlight.classList.remove("guidora-sdk-hidden");
    this.highlight.style.top = `${rect.top - 8}px`;
    this.highlight.style.left = `${rect.left - 8}px`;
    this.highlight.style.width = `${rect.width + 16}px`;
    this.highlight.style.height = `${rect.height + 16}px`;
  }

  private positionCard(target: HTMLElement | null, position: string) {
    if (!this.card) {
      return;
    }

    const viewportPadding = 16;
    const gap = 18;
    const cardWidth = this.card.offsetWidth || 340;
    const cardHeight = this.card.offsetHeight || 220;

    if (!target || position === "center") {
      this.card.style.top = `calc(50% - ${Math.round(cardHeight / 2)}px)`;
      this.card.style.left = `calc(50% - ${Math.round(cardWidth / 2)}px)`;
      return;
    }

    const rect = target.getBoundingClientRect();
    let top = rect.bottom + gap;
    let left = rect.left + rect.width / 2 - cardWidth / 2;

    if (position === "top") {
      top = rect.top - cardHeight - gap;
    } else if (position === "right") {
      top = rect.top + rect.height / 2 - cardHeight / 2;
      left = rect.right + gap;
    } else if (position === "left") {
      top = rect.top + rect.height / 2 - cardHeight / 2;
      left = rect.left - cardWidth - gap;
    }

    top = clamp(
      top,
      viewportPadding,
      window.innerHeight - cardHeight - viewportPadding,
    );
    left = clamp(
      left,
      viewportPadding,
      window.innerWidth - cardWidth - viewportPadding,
    );

    this.card.style.top = `${top}px`;
    this.card.style.left = `${left}px`;
  }

  private registerViewportListeners(step: SdkFlowStep) {
    const reposition = () => {
      this.updateHighlight(this.currentTarget);
      this.positionCard(this.currentTarget, step.position);
    };

    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    this.cleanupCallbacks.push(() => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    });
  }

  private registerAdvanceTriggers(step: SdkFlowStep) {
    if (step.advance_mode === "target_click" && this.currentTarget) {
      const handleTargetClick = () => {
        void this.handleAdvance();
      };

      this.currentTarget.addEventListener("click", handleTargetClick, {
        once: true,
        capture: true,
      });
      this.cleanupCallbacks.push(() => {
        this.currentTarget?.removeEventListener(
          "click",
          handleTargetClick,
          true,
        );
      });
      return;
    }

    if (step.advance_mode === "auto") {
      const timeoutId = window.setTimeout(() => {
        void this.handleAdvance();
      }, 1800);

      this.cleanupCallbacks.push(() => {
        window.clearTimeout(timeoutId);
      });
    }
  }

  private buildNextLabel(step: SdkFlowStep, isLast: boolean) {
    if (isLast) {
      return "Finish";
    }
    if (step.advance_mode === "target_click") {
      return "I clicked it";
    }
    if (step.advance_mode === "auto") {
      return "Continue now";
    }
    return "Next step";
  }

  private routeToStep(flow: SdkFlow, step: SdkFlowStep) {
    const targetPath = normalizePath(
      step.page_path || window.location.pathname,
    );
    if (targetPath === normalizePath(window.location.pathname)) {
      return false;
    }

    return flow ? this.activeSession?.handlers.onRouteToStep(flow, step) ?? false : false;
  }

  private async handleAdvance() {
    const session = this.activeSession;
    if (!session) {
      return;
    }

    const step = session.flow.steps[session.currentStepIndex];
    if (!step) {
      return;
    }

    await session.handlers.onStepCompleted(step);
    const isLast = session.currentStepIndex === session.flow.steps.length - 1;
    if (isLast) {
      await session.handlers.onFlowCompleted(session.flow, step);
      this.hide();
      return;
    }

    const nextStep = session.flow.steps[session.currentStepIndex + 1];
    session.currentStepIndex += 1;

    if (nextStep && this.routeToStep(session.flow, nextStep)) {
      return;
    }

    await this.renderCurrentStep();
  }

  private async handleDismiss() {
    const session = this.activeSession;
    if (!session) {
      return;
    }

    const step = session.flow.steps[session.currentStepIndex];
    if (step) {
      await session.handlers.onFlowDismissed(session.flow, step);
    }
    this.hide();
  }

  private teardownPerStepEffects() {
    for (const cleanup of this.cleanupCallbacks) {
      cleanup();
    }
    this.cleanupCallbacks = [];
  }
}
