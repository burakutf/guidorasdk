import { GuidoraApiClient } from "../http";
import type {
  SdkBuilderBootstrapResponse,
  SdkBuilderSelectResponse,
  TooltipPosition,
  AdvanceMode,
} from "../types";
import { escapeCssIdentifier, normalizePath, removeQueryParam } from "../utils";
import { injectGuidoraStyles } from "./style";

const BUILDER_QUERY_PARAM = "guidora_builder";
const HEARTBEAT_INTERVAL = 15000;
const BUILDER_ROOT_SELECTOR = "[data-guidora-builder-root='true']";

function isUniqueSelector(selector: string) {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

function textFromElement(element: HTMLElement) {
  return (
    element.getAttribute("aria-label") ||
    element.getAttribute("placeholder") ||
    element.getAttribute("title") ||
    element.textContent ||
    element.getAttribute("name") ||
    element.tagName.toLowerCase()
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function escapeAttributeValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function attributeSelector(element: HTMLElement, attributeName: string) {
  const value = element.getAttribute(attributeName)?.trim();
  if (!value) {
    return "";
  }

  const selector = `[${attributeName}="${escapeAttributeValue(value)}"]`;
  return isUniqueSelector(selector) ? selector : "";
}

function nthOfTypeSelector(element: HTMLElement) {
  const parent = element.parentElement;
  if (!parent) {
    return element.tagName.toLowerCase();
  }

  const siblings = Array.from(parent.children).filter(
    (child) => child.tagName === element.tagName,
  );
  const index = siblings.indexOf(element) + 1;
  const tagName = element.tagName.toLowerCase();

  if (siblings.length <= 1) {
    return tagName;
  }

  return `${tagName}:nth-of-type(${index})`;
}

function hierarchicalSelector(element: HTMLElement) {
  const parts: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body && current !== document.documentElement) {
    const uniqueAttributeSelector =
      attributeSelector(current, "data-guidora") ||
      attributeSelector(current, "data-testid") ||
      attributeSelector(current, "data-test") ||
      attributeSelector(current, "data-qa") ||
      attributeSelector(current, "name");

    if (uniqueAttributeSelector) {
      parts.unshift(uniqueAttributeSelector);
      break;
    }

    if (current.id) {
      parts.unshift(`#${escapeCssIdentifier(current.id)}`);
      break;
    }

    parts.unshift(nthOfTypeSelector(current));
    const selector = parts.join(" > ");
    if (isUniqueSelector(selector)) {
      return selector;
    }

    current = current.parentElement;
  }

  return parts.join(" > ");
}

function buildSelector(element: HTMLElement) {
  const directSelector =
    attributeSelector(element, "data-guidora") ||
    attributeSelector(element, "data-testid") ||
    attributeSelector(element, "data-test") ||
    attributeSelector(element, "data-qa") ||
    attributeSelector(element, "aria-label") ||
    attributeSelector(element, "name");

  if (directSelector) {
    return directSelector;
  }

  if (element.id) {
    return `#${escapeCssIdentifier(element.id)}`;
  }

  return hierarchicalSelector(element);
}

type BuilderRuntimeDom = {
  root: HTMLDivElement;
  highlight: HTMLDivElement;
  panel: HTMLDivElement;
  flowValue: HTMLDivElement;
  stepValue: HTMLDivElement;
  pathValue: HTMLDivElement;
  selectorValue: HTMLDivElement;
  statusValue: HTMLDivElement;
  titleInput: HTMLInputElement;
  bodyInput: HTMLTextAreaElement;
  positionSelect: HTMLSelectElement;
  advanceSelect: HTMLSelectElement;
  captureButton: HTMLButtonElement;
  saveButton: HTMLButtonElement;
  closeButton: HTMLButtonElement;
};

export class BuilderRuntime {
  private readonly api: GuidoraApiClient;
  private readonly zIndex: number;
  private readonly handleError: (error: Error) => void;
  private dom: BuilderRuntimeDom | null = null;
  private session: SdkBuilderBootstrapResponse | null = null;
  private heartbeatId: number | null = null;
  private selectedElement: HTMLElement | null = null;
  private selectedSelector = "";
  private isPicking = false;
  private isSaving = false;
  private boundPointerMove = (event: MouseEvent) => {
    if (!this.isPicking) {
      return;
    }

    const candidate = this.resolveCandidate(event.target);
    this.updatePreview(candidate);
  };
  private boundDocumentClick = (event: MouseEvent) => {
    if (!this.isPicking) {
      return;
    }

    const candidate = this.resolveCandidate(event.target);
    if (!candidate) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.captureElement(candidate);
  };
  private boundReposition = () => {
    this.updatePreview(this.selectedElement);
  };

  constructor(api: GuidoraApiClient, zIndex = 2147483000, handleError: (error: Error) => void) {
    this.api = api;
    this.zIndex = zIndex;
    this.handleError = handleError;
  }

  async start(sessionToken: string) {
    if (this.session?.session.session_token === sessionToken) {
      return this.session;
    }

    injectGuidoraStyles(this.zIndex);
    this.ensureDom();

    const response = await this.api.builderBootstrap({
      sessionToken,
      domain: window.location.host,
    });

    this.session = response;
    this.selectedElement = null;
    this.selectedSelector = "";
    this.updateSessionMeta();
    this.updatePreview(null);
    this.startHeartbeat();
    this.startPicking();
    this.setStatus("Click any product element to capture its selector.");

    if (this.dom) {
      this.dom.root.classList.remove("guidora-sdk-builder-hidden");
    }

    return response;
  }

  isActive() {
    return Boolean(this.session);
  }

  getSession() {
    return this.session;
  }

  async handleLocationChange() {
    if (!this.session) {
      return;
    }

    this.updateSessionMeta();
    this.updatePreview(null);
    this.setStatus("Builder mode is still active on this page. Capture the next element when ready.");
  }

  destroy() {
    this.stopHeartbeat();
    this.stopPicking();
    this.dom?.root.remove();
    this.dom = null;
    this.session = null;
    this.selectedElement = null;
    this.selectedSelector = "";
  }

  private ensureDom() {
    if (this.dom) {
      return;
    }

    const root = document.createElement("div");
    root.className = "guidora-sdk-builder-root guidora-sdk-builder-hidden";
    root.setAttribute("data-guidora-builder-root", "true");

    const highlight = document.createElement("div");
    highlight.className = "guidora-sdk-builder-highlight guidora-sdk-builder-hidden";

    const panel = document.createElement("div");
    panel.className = "guidora-sdk-builder-panel";

    const chip = document.createElement("div");
    chip.className = "guidora-sdk-builder-chip";
    chip.textContent = "Guidora Builder";

    const heading = document.createElement("h3");
    heading.className = "guidora-sdk-builder-heading";
    heading.textContent = "Capture the next walkthrough step";

    const copy = document.createElement("p");
    copy.className = "guidora-sdk-builder-copy";
    copy.textContent = "Pick a live element, write the tooltip copy, and save it directly into the selected flow.";

    const meta = document.createElement("div");
    meta.className = "guidora-sdk-builder-meta";

    const flowMeta = this.createMetaCard("Flow");
    const stepMeta = this.createMetaCard("Next step");
    const pathMeta = this.createMetaCard("Current path");
    const selectorMeta = this.createMetaCard("Selected selector");

    meta.append(flowMeta.card, stepMeta.card, pathMeta.card, selectorMeta.card);

    const titleField = this.createField("Tooltip title");
    const titleInput = document.createElement("input");
    titleInput.className = "guidora-sdk-builder-input";
    titleInput.type = "text";
    titleInput.placeholder = "Explain what this step is for";
    titleField.field.append(titleInput);

    const bodyField = this.createField("Tooltip body");
    const bodyInput = document.createElement("textarea");
    bodyInput.className = "guidora-sdk-builder-textarea";
    bodyInput.placeholder = "Describe what the user should do here";
    bodyField.field.append(bodyInput);

    const grid = document.createElement("div");
    grid.className = "guidora-sdk-builder-grid";

    const positionField = this.createField("Tooltip position");
    const positionSelect = document.createElement("select");
    positionSelect.className = "guidora-sdk-builder-select";
    this.appendOption(positionSelect, "bottom", "Bottom");
    this.appendOption(positionSelect, "top", "Top");
    this.appendOption(positionSelect, "right", "Right");
    this.appendOption(positionSelect, "left", "Left");
    this.appendOption(positionSelect, "center", "Center");
    positionField.field.append(positionSelect);

    const advanceField = this.createField("Advance mode");
    const advanceSelect = document.createElement("select");
    advanceSelect.className = "guidora-sdk-builder-select";
    this.appendOption(advanceSelect, "next_click", "Next button");
    this.appendOption(advanceSelect, "target_click", "Target click");
    this.appendOption(advanceSelect, "auto", "Auto");
    advanceField.field.append(advanceSelect);

    grid.append(positionField.field, advanceField.field);

    const statusValue = document.createElement("div");
    statusValue.className = "guidora-sdk-builder-status";
    statusValue.textContent = "Builder mode is ready.";

    const actions = document.createElement("div");
    actions.className = "guidora-sdk-builder-actions";

    const captureButton = document.createElement("button");
    captureButton.type = "button";
    captureButton.className = "guidora-sdk-builder-button guidora-sdk-builder-button-secondary";
    captureButton.textContent = "Capture element";
    captureButton.addEventListener("click", () => {
      this.startPicking();
    });

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "guidora-sdk-builder-button guidora-sdk-builder-button-primary";
    saveButton.textContent = "Save step";
    saveButton.addEventListener("click", () => {
      void this.saveStep();
    });

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "guidora-sdk-builder-button guidora-sdk-builder-button-ghost";
    closeButton.textContent = "Finish builder";
    closeButton.addEventListener("click", () => {
      void this.close();
    });

    actions.append(captureButton, saveButton, closeButton);
    panel.append(
      chip,
      heading,
      copy,
      meta,
      titleField.field,
      bodyField.field,
      grid,
      statusValue,
      actions,
    );
    root.append(highlight, panel);
    document.body.append(root);

    this.dom = {
      root,
      highlight,
      panel,
      flowValue: flowMeta.value,
      stepValue: stepMeta.value,
      pathValue: pathMeta.value,
      selectorValue: selectorMeta.value,
      statusValue,
      titleInput,
      bodyInput,
      positionSelect,
      advanceSelect,
      captureButton,
      saveButton,
      closeButton,
    };
  }

  private createMetaCard(label: string) {
    const card = document.createElement("div");
    card.className = "guidora-sdk-builder-meta-card";

    const labelElement = document.createElement("span");
    labelElement.className = "guidora-sdk-builder-label";
    labelElement.textContent = label;

    const value = document.createElement("div");
    value.className = label === "Selected selector" ? "guidora-sdk-builder-code" : "guidora-sdk-builder-value";
    value.textContent = label === "Selected selector" ? "Capture an element to see its selector." : "-";

    card.append(labelElement, value);
    return { card, value };
  }

  private createField(label: string) {
    const field = document.createElement("label");
    field.className = "guidora-sdk-builder-field";

    const labelElement = document.createElement("span");
    labelElement.className = "guidora-sdk-builder-label";
    labelElement.textContent = label;
    field.append(labelElement);

    return { field, labelElement };
  }

  private appendOption(select: HTMLSelectElement, value: string, label: string) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  }

  private updateSessionMeta() {
    if (!this.dom || !this.session) {
      return;
    }

    this.dom.flowValue.textContent = this.session.flow.name;
    this.dom.stepValue.textContent = String(this.session.next_step_order);
    this.dom.pathValue.textContent = normalizePath(window.location.pathname);
    this.dom.selectorValue.textContent = this.selectedSelector || "Capture an element to see its selector.";
  }

  private setStatus(message: string, tone: "default" | "error" = "default") {
    if (!this.dom) {
      return;
    }

    this.dom.statusValue.textContent = message;
    this.dom.statusValue.classList.toggle("guidora-sdk-builder-status-error", tone === "error");
  }

  private startHeartbeat() {
    this.stopHeartbeat();

    if (!this.session) {
      return;
    }

    const sessionToken = this.session.session.session_token;
    this.heartbeatId = window.setInterval(() => {
      void this.api
        .builderHeartbeat({ sessionToken, domain: window.location.host })
        .catch((error: Error) => this.handleError(error));
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat() {
    if (this.heartbeatId !== null) {
      window.clearInterval(this.heartbeatId);
      this.heartbeatId = null;
    }
  }

  private startPicking() {
    if (!this.dom || this.isPicking) {
      return;
    }

    this.isPicking = true;
    this.dom.captureButton.textContent = "Capturing...";
    document.addEventListener("mousemove", this.boundPointerMove, true);
    document.addEventListener("click", this.boundDocumentClick, true);
    window.addEventListener("resize", this.boundReposition);
    window.addEventListener("scroll", this.boundReposition, true);
    this.setStatus("Click any product element to capture its selector.");
  }

  private stopPicking() {
    this.isPicking = false;
    if (this.dom) {
      this.dom.captureButton.textContent = "Capture element";
    }

    document.removeEventListener("mousemove", this.boundPointerMove, true);
    document.removeEventListener("click", this.boundDocumentClick, true);
    window.removeEventListener("resize", this.boundReposition);
    window.removeEventListener("scroll", this.boundReposition, true);
  }

  private resolveCandidate(target: EventTarget | null) {
    const element = target instanceof HTMLElement ? target : null;
    if (!element) {
      return null;
    }
    if (element.closest(BUILDER_ROOT_SELECTOR)) {
      return null;
    }
    if (element === document.body || element === document.documentElement) {
      return null;
    }
    return element;
  }

  private captureElement(element: HTMLElement) {
    this.stopPicking();
    this.selectedElement = element;
    this.selectedSelector = buildSelector(element);
    this.updatePreview(element);
    this.updateSessionMeta();

    if (this.dom && !this.dom.titleInput.value.trim()) {
      this.dom.titleInput.value = textFromElement(element);
    }

    this.setStatus("Element captured. Review the tooltip copy, then save the step.");
  }

  private updatePreview(target: HTMLElement | null) {
    if (!this.dom) {
      return;
    }

    const candidate = target ?? null;
    if (!candidate) {
      this.dom.highlight.classList.add("guidora-sdk-builder-hidden");
      return;
    }

    this.selectedElement = candidate;
    const rect = candidate.getBoundingClientRect();
    this.dom.highlight.classList.remove("guidora-sdk-builder-hidden");
    this.dom.highlight.style.top = `${rect.top - 6}px`;
    this.dom.highlight.style.left = `${rect.left - 6}px`;
    this.dom.highlight.style.width = `${rect.width + 12}px`;
    this.dom.highlight.style.height = `${rect.height + 12}px`;
  }

  private async saveStep() {
    if (!this.dom || !this.session) {
      return;
    }

    if (!this.selectedSelector) {
      this.setStatus("Capture an element before saving the step.", "error");
      return;
    }

    if (this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.dom.saveButton.disabled = true;
    this.dom.captureButton.disabled = true;
    this.dom.closeButton.disabled = true;
    this.dom.saveButton.textContent = "Saving...";

    try {
      const response = await this.api.builderSelect(this.session.session.session_token, {
        domain: window.location.host,
        pagePath: normalizePath(window.location.pathname),
        selector: this.selectedSelector,
        tooltipTitle: this.dom.titleInput.value.trim(),
        tooltipBody: this.dom.bodyInput.value.trim(),
        position: this.dom.positionSelect.value as TooltipPosition,
        advanceMode: this.dom.advanceSelect.value as AdvanceMode,
        waitForElement: true,
        stepOrder: this.session.next_step_order,
      });

      this.mergeSavedStep(response);
      this.resetForm();
      this.setStatus(`Step ${response.step.step_order} saved. Capture the next element when ready.`);
      this.startPicking();
    } catch (error) {
      this.handleError(error as Error);
      this.setStatus("The step could not be saved. Check the selector and try again.", "error");
    } finally {
      this.isSaving = false;
      if (this.dom) {
        this.dom.saveButton.disabled = false;
        this.dom.captureButton.disabled = false;
        this.dom.closeButton.disabled = false;
        this.dom.saveButton.textContent = "Save step";
      }
    }
  }

  private mergeSavedStep(response: SdkBuilderSelectResponse) {
    if (!this.session) {
      return;
    }

    const nextSteps = this.session.flow.steps.filter(
      (existingStep) => existingStep.step_order !== response.step.step_order,
    );
    nextSteps.push(response.step);
    nextSteps.sort((left, right) => left.step_order - right.step_order);

    this.session = {
      ...this.session,
      flow: {
        ...this.session.flow,
        steps: nextSteps,
      },
      next_step_order: response.next_step_order,
    };

    this.updateSessionMeta();
  }

  private resetForm() {
    this.selectedElement = null;
    this.selectedSelector = "";
    this.updatePreview(null);

    if (!this.dom) {
      return;
    }

    this.dom.titleInput.value = "";
    this.dom.bodyInput.value = "";
    this.dom.positionSelect.value = "bottom";
    this.dom.advanceSelect.value = "next_click";
    this.updateSessionMeta();
  }

  private async close() {
    if (!this.session || !this.dom) {
      return;
    }

    try {
      await this.api.builderClose({
        sessionToken: this.session.session.session_token,
        domain: window.location.host,
      });
    } catch (error) {
      this.handleError(error as Error);
    } finally {
      this.stopHeartbeat();
      this.stopPicking();
      this.updatePreview(null);
      this.dom.root.classList.add("guidora-sdk-builder-hidden");
      this.session = null;
      this.selectedElement = null;
      this.selectedSelector = "";
      removeQueryParam(BUILDER_QUERY_PARAM);
    }
  }
}