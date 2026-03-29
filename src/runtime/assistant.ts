import type {
  GuidoraAssistantConfig,
  SdkAssistantDraftFlow,
  SdkAssistantResponse,
} from "../types";
import { injectGuidoraStyles } from "./style";

type AssistantRuntimeDependencies = {
  askQuestion: (question: string) => Promise<SdkAssistantResponse>;
  isSuppressed: () => boolean;
};

type AssistantMessage = {
  role: "assistant" | "user";
  text: string;
  tone?: "default" | "success" | "warning";
  draftFlow?: SdkAssistantDraftFlow | null;
};

const DEFAULT_SUGGESTIONS = [
  "Show me how to add a product",
  "Where do I publish this",
  "Guide me to the next step",
];

export class AssistantRuntime {
  private readonly zIndex: number;
  private readonly localConfig: GuidoraAssistantConfig;
  private readonly dependencies: AssistantRuntimeDependencies;
  private root: HTMLDivElement | null = null;
  private launcher: HTMLButtonElement | null = null;
  private panel: HTMLDivElement | null = null;
  private transcript: HTMLDivElement | null = null;
  private form: HTMLFormElement | null = null;
  private input: HTMLTextAreaElement | null = null;
  private submitButton: HTMLButtonElement | null = null;
  private status: HTMLDivElement | null = null;
  private headerEyebrow: HTMLDivElement | null = null;
  private headerTitle: HTMLHeadingElement | null = null;
  private headerSubtitle: HTMLParagraphElement | null = null;
  private suggestionsRoot: HTMLDivElement | null = null;
  private visible = false;
  private loading = false;
  private messages: AssistantMessage[] = [];
  private remoteConfig: GuidoraAssistantConfig | null = null;
  private reopenAfterGuidance = false;

  constructor(
    config: GuidoraAssistantConfig | undefined,
    zIndex: number,
    dependencies: AssistantRuntimeDependencies,
  ) {
    this.zIndex = zIndex;
    this.localConfig = config ?? {};
    this.dependencies = dependencies;
  }

  mount() {
    if (this.root) {
      this.render();
      return;
    }

    injectGuidoraStyles(this.zIndex);
    this.root = document.createElement("div");
    this.root.className = "guidora-sdk-assistant-shell";

    this.launcher = document.createElement("button");
    this.launcher.type = "button";
    this.launcher.className = "guidora-sdk-assistant-launcher";
    this.launcher.addEventListener("click", () => {
      this.visible = !this.visible;
      this.render();
      if (this.visible) {
        this.focusInput();
      }
    });

    this.panel = document.createElement("div");
    this.panel.className = "guidora-sdk-assistant-panel guidora-sdk-hidden";

    const header = document.createElement("div");
    header.className = "guidora-sdk-assistant-header";

    const titleWrap = document.createElement("div");
    titleWrap.className = "guidora-sdk-assistant-header-copy";

    const eyebrow = document.createElement("div");
    eyebrow.className = "guidora-sdk-assistant-eyebrow";

    const title = document.createElement("h3");
    title.className = "guidora-sdk-assistant-title";

    const subtitle = document.createElement("p");
    subtitle.className = "guidora-sdk-assistant-subtitle";

    titleWrap.append(eyebrow, title, subtitle);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "guidora-sdk-assistant-close";
    closeButton.textContent = "Close";
    closeButton.addEventListener("click", () => {
      this.visible = false;
      this.render();
    });

    header.append(titleWrap, closeButton);

    this.transcript = document.createElement("div");
    this.transcript.className = "guidora-sdk-assistant-transcript";

    const suggestions = document.createElement("div");
    suggestions.className = "guidora-sdk-assistant-suggestions";

    this.form = document.createElement("form");
    this.form.className = "guidora-sdk-assistant-form";
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      void this.submit();
    });

    this.input = document.createElement("textarea");
    this.input.className = "guidora-sdk-assistant-input";
    this.input.rows = 3;
    this.input.placeholder = this.resolvePlaceholder();

    this.submitButton = document.createElement("button");
    this.submitButton.type = "submit";
    this.submitButton.className =
      "guidora-sdk-button guidora-sdk-button-primary guidora-sdk-assistant-submit";
    this.submitButton.textContent =
      this.resolveConfig().submitLabel ?? "Guide me";

    this.status = document.createElement("div");
    this.status.className = "guidora-sdk-assistant-status";

    this.form.append(this.input, this.submitButton);
    this.panel.append(
      header,
      this.transcript,
      suggestions,
      this.form,
      this.status,
    );
    this.root.append(this.launcher, this.panel);
    document.body.append(this.root);

    this.messages = [
      {
        role: "assistant",
        text: this.resolveWelcomeMessage(),
      },
    ];
    this.headerEyebrow = eyebrow;
    this.headerTitle = title;
    this.headerSubtitle = subtitle;
    this.suggestionsRoot = suggestions;
    this.render();
  }

  applyAssistantConfig(config: GuidoraAssistantConfig | null) {
    this.remoteConfig = config;
    if (this.messages.length === 1 && this.messages[0]?.role === "assistant") {
      this.messages[0].text = this.resolveWelcomeMessage();
    }
    this.render();
  }

  destroy() {
    this.root?.remove();
    this.root = null;
    this.launcher = null;
    this.panel = null;
    this.transcript = null;
    this.form = null;
    this.input = null;
    this.submitButton = null;
    this.status = null;
  }

  setSuppressed(suppressed: boolean) {
    if (!this.root) {
      return;
    }

    this.root.classList.toggle("guidora-sdk-hidden", suppressed);
    if (suppressed) {
      this.visible = false;
    }
    this.render();
  }

  collapseForGuidance() {
    this.reopenAfterGuidance = this.visible;
    if (!this.visible) {
      return;
    }

    this.visible = false;
    this.render();
  }

  restoreAfterGuidance() {
    if (!this.reopenAfterGuidance) {
      return;
    }

    this.reopenAfterGuidance = false;
    this.visible = true;
    this.render();
  }

  cancelGuidanceCollapse() {
    this.reopenAfterGuidance = false;
  }

  private async submit() {
    if (!this.input || this.loading) {
      return;
    }

    const question = this.input.value.trim();
    if (!question) {
      this.setStatus("Write a task first.");
      return;
    }

    this.messages.push({ role: "user", text: question });
    this.input.value = "";
    this.setLoading(true);
    this.setStatus("Resolving the next action...");
    this.renderTranscript();

    try {
      const response = await this.dependencies.askQuestion(question);
      this.applyAssistantConfig(response.assistant);
      this.messages.push({
        role: "assistant",
        text: this.buildAssistantMessage(response),
        tone:
          response.action === "limit_reached"
            ? "warning"
            : response.action === "suggest_flow"
              ? "default"
              : "success",
        draftFlow: response.draft_flow,
      });
      this.setStatus(this.buildStatus(response));
      this.renderTranscript();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Assistant request failed.";
      this.messages.push({ role: "assistant", text: message, tone: "warning" });
      this.setStatus(message);
      this.renderTranscript();
    } finally {
      this.setLoading(false);
    }
  }

  private buildAssistantMessage(response: SdkAssistantResponse) {
    if (response.action === "highlight" && response.highlight_step?.selector) {
      return `${response.message} Target: ${response.highlight_step.selector}`;
    }
    if (response.action === "start_flow" && response.flow) {
      return `${response.message} Flow: ${response.flow.name}`;
    }
    if (response.action === "limit_reached") {
      return response.message;
    }
    if (response.draft_flow?.name) {
      return `${response.message} Draft: ${response.draft_flow.name}`;
    }
    return response.message;
  }

  private buildStatus(response: SdkAssistantResponse) {
    if (response.action === "start_flow" && response.flow) {
      return `Started ${response.flow.name}.`;
    }
    if (response.action === "highlight" && response.flow) {
      return `Highlighted ${response.flow.name}.`;
    }
    if (response.action === "suggest_flow" && response.draft_flow) {
      return `Suggested draft: ${response.draft_flow.name}.`;
    }
    if (response.action === "limit_reached") {
      return "Assistant quota reached.";
    }
    return response.message;
  }

  private setLoading(loading: boolean) {
    this.loading = loading;
    if (this.submitButton) {
      this.submitButton.disabled = loading;
      this.submitButton.textContent = loading
        ? (this.resolveConfig().loadingLabel ?? "Working...")
        : (this.resolveConfig().submitLabel ?? "Guide me");
    }
  }

  private setStatus(message: string) {
    if (this.status) {
      this.status.textContent = message;
    }
  }

  private render() {
    if (!this.root || !this.launcher || !this.panel) {
      return;
    }

    const suppressed =
      this.dependencies.isSuppressed() || !this.hasVisibleConfig();
    this.root.classList.toggle("guidora-sdk-hidden", suppressed);
    this.launcher.textContent =
      this.resolveConfig().launcherLabel ?? "Ask Guidora";
    this.panel.classList.toggle(
      "guidora-sdk-hidden",
      !this.visible || suppressed,
    );
    this.launcher.setAttribute(
      "aria-expanded",
      this.visible ? "true" : "false",
    );
    if (this.headerEyebrow) {
      this.headerEyebrow.textContent =
        this.resolveConfig().eyebrow ?? "AI guide";
    }
    if (this.headerTitle) {
      this.headerTitle.textContent =
        this.resolveConfig().title ?? "Ask for the next action";
    }
    if (this.headerSubtitle) {
      this.headerSubtitle.textContent = this.resolveSubtitle();
    }
    if (this.input) {
      this.input.placeholder = this.resolvePlaceholder();
    }
    this.renderSuggestions();
    this.renderTranscript();
  }

  private hasVisibleConfig() {
    if (this.remoteConfig) {
      return true;
    }

    if (this.localConfig.enabled === true) {
      return true;
    }

    return Object.keys(this.localConfig).some((key) => key !== "enabled");
  }

  private resolveConfig() {
    return {
      ...this.localConfig,
      ...(this.remoteConfig ?? {}),
    };
  }

  private renderSuggestions() {
    if (!this.suggestionsRoot) {
      return;
    }

    this.suggestionsRoot.replaceChildren();
    for (const suggestion of this.resolveSuggestions()) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "guidora-sdk-assistant-chip";
      chip.textContent = suggestion;
      chip.addEventListener("click", () => {
        if (this.input) {
          this.input.value = suggestion;
          this.focusInput();
        }
      });
      this.suggestionsRoot.append(chip);
    }
  }

  private resolveWelcomeMessage() {
    const config = this.resolveConfig();
    return (
      config.welcomeMessage ||
      "Ask for the next action. I will open a walkthrough or point to the exact control."
    );
  }

  private resolvePlaceholder() {
    const config = this.resolveConfig();
    return config.placeholder || "How do I complete this task?";
  }

  private resolveSuggestions() {
    const config = this.resolveConfig();
    const suggestions = config.suggestions ?? DEFAULT_SUGGESTIONS;
    return suggestions.slice(0, 6);
  }

  private resolveSubtitle() {
    const config = this.resolveConfig();
    return (
      config.subtitle ||
      "It starts a flow, highlights the right control, or drafts a missing walkthrough."
    );
  }

  private renderTranscript() {
    if (!this.transcript) {
      return;
    }

    this.transcript.replaceChildren();
    for (const message of this.messages) {
      const bubble = document.createElement("div");
      bubble.className = `guidora-sdk-assistant-message guidora-sdk-assistant-message-${message.role}`;
      if (message.tone) {
        bubble.dataset.tone = message.tone;
      }

      const content = document.createElement("div");
      content.className = "guidora-sdk-assistant-message-copy";
      content.textContent = message.text;
      bubble.append(content);

      if (message.draftFlow) {
        const draft = document.createElement("div");
        draft.className = "guidora-sdk-assistant-draft";
        const title = document.createElement("strong");
        title.textContent = message.draftFlow.name;
        const body = document.createElement("span");
        body.textContent = message.draftFlow.description;
        draft.append(title, body);
        bubble.append(draft);
      }

      this.transcript.append(bubble);
    }

    this.transcript.scrollTop = this.transcript.scrollHeight;
  }

  private focusInput() {
    window.setTimeout(() => {
      this.input?.focus();
    }, 0);
  }
}
