import { GuidoraApiClient } from "../http";
import type {
  AdvanceMode,
  SdkBuilderBootstrapResponse,
  SdkBuilderDeleteResponse,
  SdkBuilderSelectResponse,
  TooltipPosition,
} from "../types";
import { escapeCssIdentifier, normalizePath, removeQueryParam } from "../utils";
import { injectGuidoraStyles } from "./style";

const BUILDER_QUERY_PARAM = "guidora_builder";
const HEARTBEAT_INTERVAL = 15000;
const BUILDER_ROOT_SELECTOR = "[data-guidora-builder-root='true']";
const PANEL_MARGIN = 12;

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

  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
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
  chrome: HTMLDivElement;
  panelBody: HTMLDivElement;
  flowValue: HTMLDivElement;
  stepValue: HTMLDivElement;
  pathValue: HTMLDivElement;
  selectorValue: HTMLDivElement;
  stepList: HTMLDivElement;
  listNote: HTMLSpanElement;
  statusValue: HTMLDivElement;
  pagePathInput: HTMLInputElement;
  titleInput: HTMLInputElement;
  bodyInput: HTMLTextAreaElement;
  positionSelect: HTMLSelectElement;
  advanceSelect: HTMLSelectElement;
  dockButton: HTMLButtonElement;
  collapseButton: HTMLButtonElement;
  captureButton: HTMLButtonElement;
  newStepButton: HTMLButtonElement;
  saveButton: HTMLButtonElement;
  deleteButton: HTMLButtonElement;
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
  private editingStepId: number | null = null;
  private isPicking = false;
  private isSaving = false;
  private isDeleting = false;
  private panelDock: "left" | "right" = "left";
  private isPanelCollapsed = false;
  private panelPosition: { left: number; top: number } | null = null;
  private isDraggingPanel = false;
  private isManualPanelPosition = false;
  private dragOffset = { x: 0, y: 0 };
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
    this.refreshPreview();
  };
  private boundViewportChange = () => {
    this.refreshPreview();
    this.ensurePanelWithinViewport();
    if (!this.isManualPanelPosition) {
      this.positionPanelForTarget(this.selectedElement);
    }
  };
  private boundPanelPointerMove = (event: PointerEvent) => {
    if (!this.isDraggingPanel) {
      return;
    }

    event.preventDefault();
    this.setPanelPosition(
      event.clientX - this.dragOffset.x,
      event.clientY - this.dragOffset.y,
      true,
    );
  };
  private boundPanelPointerUp = () => {
    if (!this.isDraggingPanel) {
      return;
    }

    this.isDraggingPanel = false;
    document.removeEventListener(
      "pointermove",
      this.boundPanelPointerMove,
      true,
    );
    document.removeEventListener("pointerup", this.boundPanelPointerUp, true);
  };

  constructor(
    api: GuidoraApiClient,
    zIndex = 2147483000,
    handleError: (error: Error) => void,
  ) {
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
    this.editingStepId = null;
    this.isPanelCollapsed = false;
    this.syncPanelChrome();

    const steps = this.getSortedSteps();
    if (steps.length) {
      const currentPath = normalizePath(window.location.pathname);
      const preferredStep =
        steps.find((step) => step.page_path === currentPath) ?? steps[0];
      this.editStep(preferredStep.id);

      if (preferredStep.page_path === currentPath) {
        this.setStatus(
          `Loaded ${steps.length} saved ${steps.length === 1 ? "step" : "steps"}. You can refine this step or capture a new one.`,
        );
      } else {
        this.setStatus(
          `Loaded ${steps.length} saved ${steps.length === 1 ? "step" : "steps"}. You are viewing step ${preferredStep.step_order} from ${preferredStep.page_path}.`,
        );
      }
    } else {
      this.startNewStep({ autoCapture: true, announce: false });
      this.setStatus(
        "Click any product element to capture a selector, or choose an existing step to edit.",
      );
    }

    this.startHeartbeat();

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
    if (!this.session || !this.dom) {
      return;
    }

    this.dom.pagePathInput.value = normalizePath(window.location.pathname);
    this.updateSessionMeta();
    this.refreshPreview();
    this.renderStepList();
    this.setStatus(
      "Builder mode is still active. You can capture a new step here or keep editing an existing one.",
    );
  }

  destroy() {
    this.stopHeartbeat();
    this.stopPicking();
    this.boundPanelPointerUp();
    window.removeEventListener("resize", this.boundViewportChange);
    this.dom?.root.remove();
    this.dom = null;
    this.session = null;
    this.selectedElement = null;
    this.selectedSelector = "";
    this.editingStepId = null;
  }

  private ensureDom() {
    if (this.dom) {
      return;
    }

    const root = document.createElement("div");
    root.className = "guidora-sdk-builder-root guidora-sdk-builder-hidden";
    root.setAttribute("data-guidora-builder-root", "true");

    const highlight = document.createElement("div");
    highlight.className =
      "guidora-sdk-builder-highlight guidora-sdk-builder-hidden";

    const panel = document.createElement("div");
    panel.className =
      "guidora-sdk-builder-panel guidora-sdk-builder-panel-left";

    const chrome = document.createElement("div");
    chrome.className = "guidora-sdk-builder-chrome";
    chrome.addEventListener("pointerdown", (event) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (!target || target.closest("button")) {
        return;
      }
      this.startPanelDrag(event);
    });

    const chip = document.createElement("div");
    chip.className = "guidora-sdk-builder-chip";
    chip.textContent = "Guidora Builder";

    const utilityActions = document.createElement("div");
    utilityActions.className = "guidora-sdk-builder-utility-actions";

    const dockButton = document.createElement("button");
    dockButton.type = "button";
    dockButton.className = "guidora-sdk-builder-utility-button";
    dockButton.textContent = "Dock right";
    dockButton.addEventListener("click", () => {
      this.togglePanelDock();
    });

    const collapseButton = document.createElement("button");
    collapseButton.type = "button";
    collapseButton.className = "guidora-sdk-builder-utility-button";
    collapseButton.textContent = "Minimize";
    collapseButton.addEventListener("click", () => {
      this.togglePanelCollapsed();
    });

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className =
      "guidora-sdk-builder-utility-button guidora-sdk-builder-utility-button-close";
    closeButton.textContent = "Finish";
    closeButton.addEventListener("click", () => {
      void this.close();
    });

    utilityActions.append(dockButton, collapseButton, closeButton);
    chrome.append(chip, utilityActions);

    const panelBody = document.createElement("div");
    panelBody.className = "guidora-sdk-builder-panel-body";

    const heading = document.createElement("h3");
    heading.className = "guidora-sdk-builder-heading";
    heading.textContent = "Build and refine the whole flow";

    const copy = document.createElement("p");
    copy.className = "guidora-sdk-builder-copy";
    copy.textContent =
      "See existing steps, edit their copy, recapture selectors, or add a new step from the live product page.";

    const meta = document.createElement("div");
    meta.className = "guidora-sdk-builder-meta";

    const flowMeta = this.createMetaCard("Flow");
    const stepMeta = this.createMetaCard("Builder mode");
    const pathMeta = this.createMetaCard("Current path");
    const selectorMeta = this.createMetaCard("Selected selector");
    meta.append(flowMeta.card, stepMeta.card, pathMeta.card, selectorMeta.card);

    const listSection = document.createElement("section");
    listSection.className = "guidora-sdk-builder-section";

    const listHeader = document.createElement("div");
    listHeader.className = "guidora-sdk-builder-section-header";

    const listTitle = document.createElement("h4");
    listTitle.className = "guidora-sdk-builder-section-title";
    listTitle.textContent = "Existing steps";

    const listNote = document.createElement("span");
    listNote.className = "guidora-sdk-builder-section-note";
    listNote.textContent = "Saved steps will appear here.";

    listHeader.append(listTitle, listNote);

    const stepList = document.createElement("div");
    stepList.className = "guidora-sdk-builder-step-list";
    listSection.append(listHeader, stepList);

    const formSection = document.createElement("section");
    formSection.className = "guidora-sdk-builder-section";

    const formHeader = document.createElement("div");
    formHeader.className = "guidora-sdk-builder-section-header";

    const formTitle = document.createElement("h4");
    formTitle.className = "guidora-sdk-builder-section-title";
    formTitle.textContent = "Step editor";

    const formNote = document.createElement("span");
    formNote.className = "guidora-sdk-builder-section-note";
    formNote.textContent = "Use capture to replace the selector when needed.";

    formHeader.append(formTitle, formNote);

    const pagePathField = this.createField("Page path");
    const pagePathInput = document.createElement("input");
    pagePathInput.className = "guidora-sdk-builder-input";
    pagePathInput.type = "text";
    pagePathInput.placeholder = "/settings/billing";
    pagePathField.field.append(pagePathInput);

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
    formSection.append(
      formHeader,
      pagePathField.field,
      titleField.field,
      bodyField.field,
      grid,
    );

    const statusValue = document.createElement("div");
    statusValue.className = "guidora-sdk-builder-status";
    statusValue.textContent = "Builder mode is ready.";

    const actions = document.createElement("div");
    actions.className = "guidora-sdk-builder-actions";

    const captureButton = document.createElement("button");
    captureButton.type = "button";
    captureButton.className =
      "guidora-sdk-builder-button guidora-sdk-builder-button-secondary";
    captureButton.textContent = "Capture element";
    captureButton.addEventListener("click", () => {
      this.startPicking();
    });

    const newStepButton = document.createElement("button");
    newStepButton.type = "button";
    newStepButton.className =
      "guidora-sdk-builder-button guidora-sdk-builder-button-ghost";
    newStepButton.textContent = "New step";
    newStepButton.addEventListener("click", () => {
      this.startNewStep({ autoCapture: false, announce: true });
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className =
      "guidora-sdk-builder-button guidora-sdk-builder-button-danger";
    deleteButton.textContent = "Delete step";
    deleteButton.addEventListener("click", () => {
      void this.deleteCurrentStep();
    });

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className =
      "guidora-sdk-builder-button guidora-sdk-builder-button-primary";
    saveButton.textContent = "Save step";
    saveButton.addEventListener("click", () => {
      void this.saveStep();
    });

    actions.append(captureButton, newStepButton, deleteButton, saveButton);
    panelBody.append(
      heading,
      copy,
      meta,
      listSection,
      formSection,
      statusValue,
      actions,
    );
    panel.append(chrome, panelBody);
    root.append(highlight, panel);
    document.body.append(root);
    window.addEventListener("resize", this.boundViewportChange);

    this.dom = {
      root,
      highlight,
      panel,
      chrome,
      panelBody,
      flowValue: flowMeta.value,
      stepValue: stepMeta.value,
      pathValue: pathMeta.value,
      selectorValue: selectorMeta.value,
      stepList,
      listNote,
      statusValue,
      pagePathInput,
      titleInput,
      bodyInput,
      positionSelect,
      advanceSelect,
      dockButton,
      collapseButton,
      captureButton,
      newStepButton,
      saveButton,
      deleteButton,
      closeButton,
    };

    this.syncPanelChrome();
  }

  private createMetaCard(label: string) {
    const card = document.createElement("div");
    card.className = "guidora-sdk-builder-meta-card";

    const labelElement = document.createElement("span");
    labelElement.className = "guidora-sdk-builder-label";
    labelElement.textContent = label;

    const value = document.createElement("div");
    value.className =
      label === "Selected selector"
        ? "guidora-sdk-builder-code"
        : "guidora-sdk-builder-value";
    value.textContent =
      label === "Selected selector"
        ? "Capture an element to see its selector."
        : "-";

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

  private appendOption(
    select: HTMLSelectElement,
    value: string,
    label: string,
  ) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  }

  private getSortedSteps() {
    return [...(this.session?.flow.steps ?? [])].sort(
      (left, right) => left.step_order - right.step_order,
    );
  }

  private getEditingStep() {
    return (
      this.session?.flow.steps.find((step) => step.id === this.editingStepId) ??
      null
    );
  }

  private renderStepList() {
    if (!this.dom) {
      return;
    }

    this.dom.stepList.replaceChildren();
    const steps = this.getSortedSteps();
    const currentPath = normalizePath(window.location.pathname);
    const currentPageCount = steps.filter(
      (step) => step.page_path === currentPath,
    ).length;
    this.dom.listNote.textContent = steps.length
      ? `${steps.length} saved ${steps.length === 1 ? "step" : "steps"} • ${currentPageCount} on this page`
      : "Start by capturing the first element.";

    if (!steps.length) {
      const empty = document.createElement("div");
      empty.className = "guidora-sdk-builder-step-empty";
      empty.textContent =
        "No steps yet. Capture the first product element to start the flow.";
      this.dom.stepList.append(empty);
      return;
    }

    for (const step of steps) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = [
        "guidora-sdk-builder-step-card",
        step.id === this.editingStepId
          ? "guidora-sdk-builder-step-card-active"
          : "",
        step.page_path === currentPath
          ? ""
          : "guidora-sdk-builder-step-card-offpage",
      ]
        .filter(Boolean)
        .join(" ");
      card.dataset.stepId = String(step.id);
      card.addEventListener("click", () => {
        this.editStep(step.id);
      });

      const topLine = document.createElement("div");
      topLine.className = "guidora-sdk-builder-step-topline";

      const badge = document.createElement("span");
      badge.className = "guidora-sdk-builder-step-badge";
      badge.textContent = `Step ${step.step_order}`;

      const position = document.createElement("span");
      position.className = "guidora-sdk-builder-section-note";
      position.textContent = `${step.position} • ${step.advance_mode}`;

      const meta = document.createElement("div");
      meta.className = "guidora-sdk-builder-step-meta";

      const scope = document.createElement("span");
      scope.className = [
        "guidora-sdk-builder-step-scope",
        step.page_path === currentPath
          ? "guidora-sdk-builder-step-scope-active"
          : "",
      ]
        .filter(Boolean)
        .join(" ");
      scope.textContent =
        step.page_path === currentPath ? "This page" : step.page_path || "/";

      const title = document.createElement("div");
      title.className = "guidora-sdk-builder-step-title";
      title.textContent = step.tooltip_title || "Untitled step";

      const copy = document.createElement("div");
      copy.className = "guidora-sdk-builder-step-copy";
      copy.textContent = step.tooltip_body || "No tooltip copy yet.";

      const path = document.createElement("div");
      path.className = "guidora-sdk-builder-step-code";
      path.textContent = `${step.page_path || "/"} • ${step.selector}`;

      meta.append(scope, position);
      topLine.append(badge, meta);
      card.append(topLine, title, copy, path);
      this.dom.stepList.append(card);
    }

    if (this.editingStepId !== null) {
      this.dom.stepList
        .querySelector<HTMLElement>(`[data-step-id="${this.editingStepId}"]`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }

  private updateSessionMeta() {
    if (!this.dom || !this.session) {
      return;
    }

    const editingStep = this.getEditingStep();

    this.dom.flowValue.textContent = this.session.flow.name;
    this.dom.stepValue.textContent = editingStep
      ? `Editing step ${editingStep.step_order}`
      : `Next step ${this.session.next_step_order}`;
    this.dom.pathValue.textContent =
      this.dom.pagePathInput.value.trim() ||
      normalizePath(window.location.pathname);
    this.dom.selectorValue.textContent =
      this.selectedSelector || "Capture an element to see its selector.";
    this.dom.deleteButton.disabled =
      !editingStep || this.isDeleting || this.isSaving;
    this.dom.saveButton.textContent = editingStep ? "Update step" : "Save step";
  }

  private setStatus(message: string, tone: "default" | "error" = "default") {
    if (!this.dom) {
      return;
    }

    this.dom.statusValue.textContent = message;
    this.dom.statusValue.classList.toggle(
      "guidora-sdk-builder-status-error",
      tone === "error",
    );
  }

  private togglePanelDock() {
    this.panelDock = this.panelDock === "left" ? "right" : "left";
    this.panelPosition = null;
    this.isManualPanelPosition = false;
    this.syncPanelChrome();
  }

  private togglePanelCollapsed() {
    this.isPanelCollapsed = !this.isPanelCollapsed;
    this.syncPanelChrome();
  }

  private syncPanelChrome() {
    if (!this.dom) {
      return;
    }

    this.dom.panel.classList.toggle(
      "guidora-sdk-builder-panel-left",
      this.panelDock === "left",
    );
    this.dom.panel.classList.toggle(
      "guidora-sdk-builder-panel-right",
      this.panelDock === "right",
    );
    this.dom.panel.classList.toggle(
      "guidora-sdk-builder-panel-collapsed",
      this.isPanelCollapsed,
    );
    this.dom.panel.classList.toggle(
      "guidora-sdk-builder-panel-floating",
      Boolean(this.panelPosition),
    );
    this.dom.dockButton.textContent =
      this.panelDock === "left" ? "Dock right" : "Dock left";
    this.dom.collapseButton.textContent = this.isPanelCollapsed
      ? "Expand"
      : "Minimize";
    this.dom.collapseButton.setAttribute(
      "aria-expanded",
      String(!this.isPanelCollapsed),
    );
    this.applyPanelPosition();
  }

  private startPanelDrag(event: PointerEvent) {
    if (!this.dom) {
      return;
    }

    const rect = this.dom.panel.getBoundingClientRect();
    this.isDraggingPanel = true;
    this.panelPosition = { left: rect.left, top: rect.top };
    this.isManualPanelPosition = true;
    this.dragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    this.syncPanelChrome();
    document.addEventListener("pointermove", this.boundPanelPointerMove, true);
    document.addEventListener("pointerup", this.boundPanelPointerUp, true);
  }

  private setPanelPosition(left: number, top: number, manual: boolean) {
    if (!this.dom) {
      return;
    }

    const panelWidth = this.dom.panel.offsetWidth || 340;
    const panelHeight = this.dom.panel.offsetHeight || 640;
    const maxLeft = Math.max(
      PANEL_MARGIN,
      window.innerWidth - panelWidth - PANEL_MARGIN,
    );
    const maxTop = Math.max(
      PANEL_MARGIN,
      window.innerHeight - panelHeight - PANEL_MARGIN,
    );

    this.panelPosition = {
      left: Math.min(Math.max(PANEL_MARGIN, left), maxLeft),
      top: Math.min(Math.max(PANEL_MARGIN, top), maxTop),
    };
    this.isManualPanelPosition = manual;
    this.applyPanelPosition();
  }

  private applyPanelPosition() {
    if (!this.dom) {
      return;
    }

    if (!this.panelPosition) {
      this.dom.panel.style.left = "";
      this.dom.panel.style.top = "12px";
      this.dom.panel.style.right = "";
      return;
    }

    this.dom.panel.style.left = `${this.panelPosition.left}px`;
    this.dom.panel.style.top = `${this.panelPosition.top}px`;
    this.dom.panel.style.right = "auto";
  }

  private ensurePanelWithinViewport() {
    if (!this.panelPosition) {
      return;
    }

    this.setPanelPosition(
      this.panelPosition.left,
      this.panelPosition.top,
      this.isManualPanelPosition,
    );
  }

  private positionPanelForTarget(target: HTMLElement | null) {
    if (!this.dom || this.isManualPanelPosition || window.innerWidth <= 900) {
      return;
    }

    const targetRect = target?.getBoundingClientRect();
    if (!targetRect) {
      if (this.panelDock !== "left") {
        this.panelDock = "left";
        this.syncPanelChrome();
      }
      return;
    }

    const nextDock =
      targetRect.left + targetRect.width / 2 >= window.innerWidth / 2
        ? "left"
        : "right";
    if (this.panelDock !== nextDock) {
      this.panelDock = nextDock;
      this.syncPanelChrome();
    }
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
    this.setStatus(
      "Click any product element to capture or replace the current selector.",
    );
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

    if (this.dom) {
      this.dom.pagePathInput.value = normalizePath(window.location.pathname);
      if (!this.dom.titleInput.value.trim()) {
        this.dom.titleInput.value = textFromElement(element);
      }
    }

    this.updateSessionMeta();
    this.setStatus("Selector captured. Review the copy and save the step.");
  }

  private updatePreview(target: HTMLElement | null) {
    if (!this.dom) {
      return;
    }

    if (!target) {
      this.selectedElement = null;
      this.positionPanelForTarget(null);
      this.dom.highlight.classList.add("guidora-sdk-builder-hidden");
      return;
    }

    this.selectedElement = target;
    this.positionPanelForTarget(target);
    const rect = target.getBoundingClientRect();
    this.dom.highlight.classList.remove("guidora-sdk-builder-hidden");
    this.dom.highlight.style.top = `${rect.top - 6}px`;
    this.dom.highlight.style.left = `${rect.left - 6}px`;
    this.dom.highlight.style.width = `${rect.width + 12}px`;
    this.dom.highlight.style.height = `${rect.height + 12}px`;
  }

  private refreshPreview() {
    const currentPath = normalizePath(window.location.pathname);
    const editingStep = this.getEditingStep();

    if (editingStep && editingStep.page_path === currentPath) {
      this.updatePreview(
        document.querySelector<HTMLElement>(editingStep.selector),
      );
      return;
    }

    if (this.selectedSelector && !this.editingStepId) {
      this.updatePreview(
        document.querySelector<HTMLElement>(this.selectedSelector),
      );
      return;
    }

    this.updatePreview(null);
  }

  private editStep(stepId: number) {
    if (!this.dom || !this.session) {
      return;
    }

    const step = this.session.flow.steps.find(
      (candidate) => candidate.id === stepId,
    );
    if (!step) {
      return;
    }

    this.stopPicking();
    this.editingStepId = step.id;
    this.selectedSelector = step.selector;
    this.dom.pagePathInput.value =
      step.page_path || normalizePath(window.location.pathname);
    this.dom.titleInput.value = step.tooltip_title || "";
    this.dom.bodyInput.value = step.tooltip_body || "";
    this.dom.positionSelect.value = step.position || "bottom";
    this.dom.advanceSelect.value = step.advance_mode || "next_click";
    this.renderStepList();
    this.updateSessionMeta();
    this.refreshPreview();

    if (step.page_path !== normalizePath(window.location.pathname)) {
      this.setStatus(
        `Editing step ${step.step_order}. Navigate to ${step.page_path} if you want to recapture its selector.`,
      );
      return;
    }

    this.setStatus(
      `Editing step ${step.step_order}. You can update the copy or capture a new selector.`,
    );
  }

  private startNewStep(options: { autoCapture: boolean; announce: boolean }) {
    if (!this.dom) {
      return;
    }

    this.stopPicking();
    this.editingStepId = null;
    this.selectedSelector = "";
    this.selectedElement = null;
    this.dom.pagePathInput.value = normalizePath(window.location.pathname);
    this.dom.titleInput.value = "";
    this.dom.bodyInput.value = "";
    this.dom.positionSelect.value = "bottom";
    this.dom.advanceSelect.value = "next_click";
    this.renderStepList();
    this.updatePreview(null);
    this.updateSessionMeta();

    if (options.autoCapture) {
      this.startPicking();
    }

    if (options.announce) {
      this.setStatus(
        "Switched to new step mode. Capture a new element or fill the form manually.",
      );
    }
  }

  private async saveStep() {
    if (!this.dom || !this.session) {
      return;
    }

    if (!this.selectedSelector) {
      this.setStatus(
        "Capture an element or choose an existing step before saving.",
        "error",
      );
      return;
    }

    if (this.isSaving || this.isDeleting) {
      return;
    }

    const editingStep = this.getEditingStep();

    this.isSaving = true;
    this.dom.saveButton.disabled = true;
    this.dom.captureButton.disabled = true;
    this.dom.newStepButton.disabled = true;
    this.dom.deleteButton.disabled = true;
    this.dom.closeButton.disabled = true;
    this.dom.saveButton.textContent = editingStep ? "Updating..." : "Saving...";

    try {
      const response = await this.api.builderSelect(
        this.session.session.session_token,
        {
          domain: window.location.host,
          pagePath:
            this.dom.pagePathInput.value.trim() ||
            normalizePath(window.location.pathname),
          selector: this.selectedSelector,
          tooltipTitle: this.dom.titleInput.value.trim(),
          tooltipBody: this.dom.bodyInput.value.trim(),
          position: this.dom.positionSelect.value as TooltipPosition,
          advanceMode: this.dom.advanceSelect.value as AdvanceMode,
          waitForElement: true,
          stepOrder: editingStep?.step_order ?? this.session.next_step_order,
        },
      );

      this.mergeSavedStep(response);
      if (editingStep) {
        this.editStep(response.step.id);
        this.setStatus(
          `Step ${response.step.step_order} updated. You can keep refining it or pick another step.`,
        );
      } else {
        this.startNewStep({ autoCapture: false, announce: false });
        this.setStatus(
          `Step ${response.step.step_order} created. Capture the next selector or edit an existing step.`,
        );
        this.startPicking();
      }
    } catch (error) {
      this.handleError(error as Error);
      this.setStatus(
        "The step could not be saved. Check the selector and try again.",
        "error",
      );
    } finally {
      this.isSaving = false;
      if (this.dom) {
        this.dom.saveButton.disabled = false;
        this.dom.captureButton.disabled = false;
        this.dom.newStepButton.disabled = false;
        this.dom.closeButton.disabled = false;
      }
      this.updateSessionMeta();
    }
  }

  private mergeSavedStep(response: SdkBuilderSelectResponse) {
    if (!this.session) {
      return;
    }

    const nextSteps = this.session.flow.steps.filter(
      (existingStep) => existingStep.id !== response.step.id,
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

    this.renderStepList();
    this.updateSessionMeta();
  }

  private async deleteCurrentStep() {
    if (
      !this.dom ||
      !this.session ||
      !this.editingStepId ||
      this.isDeleting ||
      this.isSaving
    ) {
      return;
    }

    this.isDeleting = true;
    this.dom.saveButton.disabled = true;
    this.dom.captureButton.disabled = true;
    this.dom.newStepButton.disabled = true;
    this.dom.deleteButton.disabled = true;
    this.dom.closeButton.disabled = true;
    this.dom.deleteButton.textContent = "Deleting...";

    try {
      const response = await this.api.builderDeleteStep({
        sessionToken: this.session.session.session_token,
        domain: window.location.host,
        stepId: this.editingStepId,
      });
      this.applyDeletedSteps(response);
      this.startNewStep({ autoCapture: false, announce: false });
      this.setStatus(
        "Step deleted. Remaining steps were reindexed automatically.",
      );
    } catch (error) {
      this.handleError(error as Error);
      this.setStatus("The step could not be deleted.", "error");
    } finally {
      this.isDeleting = false;
      if (this.dom) {
        this.dom.saveButton.disabled = false;
        this.dom.captureButton.disabled = false;
        this.dom.newStepButton.disabled = false;
        this.dom.closeButton.disabled = false;
        this.dom.deleteButton.textContent = "Delete step";
      }
      this.updateSessionMeta();
    }
  }

  private applyDeletedSteps(response: SdkBuilderDeleteResponse) {
    if (!this.session) {
      return;
    }

    this.session = {
      ...this.session,
      flow: {
        ...this.session.flow,
        steps: response.steps,
      },
      next_step_order: response.next_step_order,
    };
    this.renderStepList();
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
      this.boundPanelPointerUp();
      this.updatePreview(null);
      this.dom.root.classList.add("guidora-sdk-builder-hidden");
      this.session = null;
      this.selectedElement = null;
      this.selectedSelector = "";
      this.editingStepId = null;
      this.panelPosition = null;
      this.isManualPanelPosition = false;
      removeQueryParam(BUILDER_QUERY_PARAM);
    }
  }
}
