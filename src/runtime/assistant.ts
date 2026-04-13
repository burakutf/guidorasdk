import type {
  GuidoraAssistantConfig,
  GuidoraAssistantTheme,
  SdkAssistantDraftFlow,
  SdkAssistantResponse,
} from "../types";
import { shiftHexColor } from "../utils";
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
  "How do I add a product?",
  "Where do I publish this?",
  "Show me the next step",
];

const LEGACY_CUSTOM_POSITION = "custom";

function isAnchoredCustomPosition(position: string | null | undefined) {
  return [
    "custom-bottom-right",
    "custom-bottom-left",
    "custom-top-right",
    "custom-top-left",
  ].includes(String(position ?? "").trim());
}

function hasVisibleAssistantText(value: string | null | undefined) {
  return Boolean(String(value ?? "").trim());
}

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
  private theme: GuidoraAssistantTheme | undefined;

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
    this.applyTheme(this.resolveConfig().theme);
    this.render();
  }

  private applyTheme(theme: GuidoraAssistantTheme | undefined) {
    if (!this.root) {
      return;
    }

    this.setThemeVar("--guidora-accent-color", theme?.accentColor, "#3525CD");
    this.setThemeVar(
      "--guidora-accent-strong",
      shiftHexColor(theme?.accentColor, 24),
      "#4F46E5",
    );
    this.setThemeVar(
      "--guidora-launcher-bg",
      theme?.launcherBackgroundColor,
      "#3525CD",
    );
    this.setThemeVar(
      "--guidora-launcher-text",
      theme?.launcherTextColor,
      "#F8F7FF",
    );
    this.setThemeVar(
      "--guidora-panel-bg",
      theme?.panelBackgroundColor,
      "#FCF8FF",
    );
    this.setThemeVar("--guidora-panel-text", theme?.panelTextColor, "#1B1B24");
    this.setThemeVar(
      "--guidora-muted-text",
      theme?.panelTextColor && theme?.panelBackgroundColor
        ? `color-mix(in srgb, ${theme.panelTextColor} 72%, ${theme.panelBackgroundColor} 28%)`
        : undefined,
      "#58579B",
    );
    this.setThemeVar(
      "--guidora-highlight-color",
      theme?.highlightColor,
      "#4F46E5",
    );
    this.setThemeVar(
      "--guidora-highlight-overlay",
      theme?.highlightOverlayColor,
      "#C7C4D8",
    );
  }

  private setThemeVar(
    name: string,
    value: string | undefined,
    fallback: string,
  ) {
    this.root?.style.setProperty(name, value || fallback);
  }

  private renderLauncher(config: GuidoraAssistantConfig) {
    if (!this.launcher) {
      return;
    }

    const label = config.launcherLabel ?? "Ask Guidora";
    const iconUrl = (config.launcherIconUrl ?? "").trim();
    const hasLabel = hasVisibleAssistantText(label);
    const hasIcon = Boolean(iconUrl);

    this.launcher.replaceChildren();
    this.launcher.classList.toggle(
      "guidora-sdk-assistant-launcher-textless",
      !hasLabel,
    );
    this.launcher.style.minWidth = !hasLabel && !hasIcon ? "48px" : "";
    if (config.launcherWidth && Number.isFinite(config.launcherWidth)) {
      this.launcher.style.width = `${Math.max(40, Math.min(320, Math.round(config.launcherWidth)))}px`;
    } else {
      this.launcher.style.removeProperty("width");
    }
    this.launcher.setAttribute(
      "aria-label",
      label || config.title || "Open AI widget",
    );

    const content = document.createElement("span");
    content.className = "guidora-sdk-assistant-launcher-content";
    if (hasIcon) {
      const icon = document.createElement("img");
      icon.className = "guidora-sdk-assistant-launcher-icon";
      icon.src = iconUrl;
      icon.alt = "";
      icon.decoding = "async";
      content.append(icon);
    }
    if (hasLabel) {
      const text = document.createElement("span");
      text.className = "guidora-sdk-assistant-launcher-label";
      text.textContent = label;
      content.append(text);
    }
    this.launcher.append(content);
  }

  applyAssistantConfig(config: GuidoraAssistantConfig | null) {
    this.remoteConfig = config;
    this.theme = this.resolveConfig().theme;
    if (this.messages.length === 1 && this.messages[0]?.role === "assistant") {
      this.messages[0].text = this.resolveWelcomeMessage();
    }
    this.applyTheme(this.theme);
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
      this.submitButton.classList.toggle(
        "guidora-sdk-assistant-submit-empty",
        !hasVisibleAssistantText(this.submitButton.textContent),
      );
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
    const config = this.resolveConfig();
    this.root.classList.toggle("guidora-sdk-hidden", suppressed);
    this.root.dataset.position = config.position?.trim() || "bottom-right";
    this.applyPosition(config);
    this.renderLauncher(config);
    this.panel.classList.toggle(
      "guidora-sdk-hidden",
      !this.visible || suppressed,
    );
    this.launcher.setAttribute(
      "aria-expanded",
      this.visible ? "true" : "false",
    );
    if (this.headerEyebrow) {
      this.headerEyebrow.textContent = config.eyebrow ?? "AI guide";
      this.headerEyebrow.hidden = !hasVisibleAssistantText(
        this.headerEyebrow.textContent,
      );
    }
    if (this.headerTitle) {
      this.headerTitle.textContent = config.title ?? "Ask for the next action";
      this.headerTitle.hidden = !hasVisibleAssistantText(
        this.headerTitle.textContent,
      );
    }
    if (this.headerSubtitle) {
      this.headerSubtitle.textContent = this.resolveSubtitle();
      this.headerSubtitle.hidden = !hasVisibleAssistantText(
        this.headerSubtitle.textContent,
      );
    }
    if (this.input) {
      this.input.placeholder = this.resolvePlaceholder();
    }
    if (this.submitButton) {
      this.submitButton.classList.toggle(
        "guidora-sdk-assistant-submit-empty",
        !hasVisibleAssistantText(this.submitButton.textContent),
      );
    }
    this.renderSuggestions();
    this.renderTranscript();
  }

  private applyPosition(config: GuidoraAssistantConfig) {
    if (!this.root) {
      return;
    }

    const margin = 20;
    const position = config.position?.trim() || "bottom-right";
    const reset = () => {
      this.root?.style.removeProperty("left");
      this.root?.style.removeProperty("right");
      this.root?.style.removeProperty("top");
      this.root?.style.removeProperty("bottom");
    };

    const setPosition = (
      left: string,
      top: string,
      right: string,
      bottom: string,
    ) => {
      if (!this.root) {
        return;
      }

      this.root.style.left = left;
      this.root.style.top = top;
      this.root.style.right = right;
      this.root.style.bottom = bottom;
    };

    if (
      position === LEGACY_CUSTOM_POSITION &&
      Number.isFinite(config.offsetX) &&
      Number.isFinite(config.offsetY)
    ) {
      setPosition(
        `${Math.max(0, Math.round(config.offsetX ?? 0))}px`,
        `${Math.max(0, Math.round(config.offsetY ?? 0))}px`,
        "auto",
        "auto",
      );
      return;
    }

    if (isAnchoredCustomPosition(position)) {
      const offsetX = `${Math.max(0, Math.round(config.offsetX ?? margin))}px`;
      const offsetY = `${Math.max(0, Math.round(config.offsetY ?? margin))}px`;

      switch (position) {
        case "custom-bottom-left":
          setPosition(offsetX, "auto", "auto", offsetY);
          return;
        case "custom-top-right":
          setPosition("auto", offsetY, offsetX, "auto");
          return;
        case "custom-top-left":
          setPosition(offsetX, offsetY, "auto", "auto");
          return;
        default:
          setPosition("auto", "auto", offsetX, offsetY);
          return;
      }
    }

    reset();
    switch (position) {
      case "bottom-left":
        setPosition(`${margin}px`, "auto", "auto", `${margin}px`);
        return;
      case "top-right":
        setPosition("auto", `${margin}px`, `${margin}px`, "auto");
        return;
      case "top-left":
        setPosition(`${margin}px`, `${margin}px`, "auto", "auto");
        return;
      default:
        setPosition("auto", "auto", `${margin}px`, `${margin}px`);
    }
  }

  private hasVisibleConfig() {
    const config = this.resolveConfig();
    if (config.enabled === false) {
      return false;
    }

    if (config.enabled === true) {
      return true;
    }

    return Object.keys(config).some((key) => key !== "enabled");
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
    const suggestions = this.resolveSuggestions();
    this.suggestionsRoot.hidden = suggestions.length === 0;
    for (const suggestion of suggestions) {
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
      config.welcomeMessage ??
      "Ask for the next task. I can open a walkthrough, point to the right control, or suggest a missing guide."
    );
  }

  private resolvePlaceholder() {
    const config = this.resolveConfig();
    return config.placeholder ?? "What are you trying to do?";
  }

  private resolveSuggestions() {
    const config = this.resolveConfig();
    const suggestions = config.suggestions ?? DEFAULT_SUGGESTIONS;
    return suggestions
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 6);
  }

  private resolveSubtitle() {
    const config = this.resolveConfig();
    return (
      config.subtitle ??
      "It starts a flow, highlights the right control, or drafts the next missing walkthrough."
    );
  }

  private renderTranscript() {
    if (!this.transcript) {
      return;
    }

    this.transcript.replaceChildren();
    for (const message of this.messages) {
      if (!hasVisibleAssistantText(message.text) && !message.draftFlow) {
        continue;
      }

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
