import { GuidoraApiClient } from "../http";
import type {
  AdvanceMode,
  SdkBuilderBootstrapResponse,
  SdkBuilderDeleteResponse,
  SdkBuilderFlowMutationResponse,
  SdkBuilderReorderResponse,
  SdkBuilderSelectResponse,
  SdkFlow,
  SdkFlowStep,
  TooltipPosition,
} from "../types";
import { escapeCssIdentifier, normalizePath, removeQueryParam } from "../utils";
import { injectGuidoraStyles } from "./style";

const BUILDER_QUERY_PARAM = "guidora_builder";
const HEARTBEAT_INTERVAL = 15000;
const BUILDER_ROOT_SELECTOR = "[data-guidora-builder-root='true']";
const LEFT_RAIL_WIDTH = 268;
const RIGHT_RAIL_WIDTH = 324;
const MOBILE_BREAKPOINT = 1100;

type HighlightTone = "hover" | "pick" | "edit";
type BuilderDraftMode = "highlight" | "popup";

type BuilderDraft = {
  stepId: number | null;
  mode: BuilderDraftMode;
  pagePath: string;
  selector: string;
  title: string;
  body: string;
  position: TooltipPosition;
  advanceMode: AdvanceMode;
};

type BuilderFlowForm = {
  flowId: number;
  name: string;
  entryPath: string;
};

type BuilderRuntimeDom = {
  root: HTMLDivElement;
  highlight: HTMLDivElement;
  highlightBadge: HTMLDivElement;
  flowList: HTMLDivElement;
  flowStatusBadge: HTMLSpanElement;
  flowNameInput: HTMLInputElement;
  flowPathInput: HTMLInputElement;
  flowSaveButton: HTMLButtonElement;
  flowDeleteButton: HTMLButtonElement;
  activeFlowName: HTMLDivElement;
  activeFlowMeta: HTMLDivElement;
  newFlowButton: HTMLButtonElement;
  newPopupFlowButton: HTMLButtonElement;
  addStepButton: HTMLButtonElement;
  addPopupButton: HTMLButtonElement;
  stepList: HTMLDivElement;
  stepNote: HTMLDivElement;
  statusValue: HTMLDivElement;
  editor: HTMLDivElement;
  editorChip: HTMLSpanElement;
  editorHeading: HTMLDivElement;
  editorMeta: HTMLDivElement;
  titleInput: HTMLInputElement;
  bodyInput: HTMLTextAreaElement;
  positionSelect: HTMLSelectElement;
  advanceSelect: HTMLSelectElement;
  reselectButton: HTMLButtonElement;
  deleteButton: HTMLButtonElement;
  cancelButton: HTMLButtonElement;
  saveButton: HTMLButtonElement;
};

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

function querySelectorSafe(selector: string) {
  if (selector === "body") {
    return document.body;
  }

  try {
    return document.querySelector<HTMLElement>(selector);
  } catch {
    return null;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatFlowTypeLabel(type: string) {
  return type === "page_popup" ? "Page popup" : "Product flow";
}

function formatFlowStatusLabel(status: string) {
  if (status === "published") {
    return "Live";
  }
  if (status === "archived") {
    return "Archived";
  }
  return "Draft";
}

function formatStepCount(count: number) {
  return `${count} ${count === 1 ? "step" : "steps"}`;
}

function getStepTitle(step: SdkFlowStep) {
  if (step.tooltip_title.trim()) {
    return step.tooltip_title.trim();
  }
  if (step.selector === "body") {
    return "Open popup";
  }
  return `Step ${step.step_order}`;
}

function isPopupStep(step: SdkFlowStep) {
  return step.selector === "body";
}

function moveStepId(stepIds: number[], draggedId: number, targetId: number) {
  const nextIds = [...stepIds];
  const fromIndex = nextIds.indexOf(draggedId);
  const targetIndex = nextIds.indexOf(targetId);

  if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) {
    return nextIds;
  }

  nextIds.splice(fromIndex, 1);
  nextIds.splice(targetIndex, 0, draggedId);
  return nextIds;
}

export class BuilderRuntime {
  private readonly api: GuidoraApiClient;
  private readonly zIndex: number;
  private readonly handleError: (error: Error) => void;
  private readonly syncSessionToken: (sessionToken: string | null) => void;
  private dom: BuilderRuntimeDom | null = null;
  private session: SdkBuilderBootstrapResponse | null = null;
  private flows: SdkFlow[] = [];
  private heartbeatId: number | null = null;
  private hoveredStepId: number | null = null;
  private hoveredElement: HTMLElement | null = null;
  private editingElement: HTMLElement | null = null;
  private lastPointerTarget: HTMLElement | null = null;
  private draggingStepId: number | null = null;
  private draft: BuilderDraft | null = null;
  private flowForm: BuilderFlowForm | null = null;
  private isPicking = false;
  private isSaving = false;
  private isDeleting = false;
  private isCreatingFlow = false;
  private isSwitchingFlow = false;
  private isUpdatingFlow = false;
  private isDeletingFlow = false;
  private previousBodyPaddingLeft = "";
  private previousBodyPaddingRight = "";
  private hasStoredBodyPadding = false;
  private boundPointerMove = (event: MouseEvent) => {
    if (!this.session) {
      return;
    }

    const candidate = this.resolveCandidate(event.target);
    this.lastPointerTarget = candidate;

    if (this.isPicking) {
      this.previewCandidate(candidate);
      return;
    }

    if (this.draft) {
      return;
    }

    this.updateHoverFromTarget(candidate);
  };
  private boundDocumentClick = (event: MouseEvent) => {
    if (!this.session) {
      return;
    }

    const candidate = this.resolveCandidate(event.target);

    if (this.isPicking) {
      if (!candidate) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      this.captureElement(candidate);
      return;
    }

    if (!candidate) {
      return;
    }

    const matchingStep = this.findMatchingStepForElement(candidate);
    if (!matchingStep) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.openEditorForStep(matchingStep.step.id);
  };
  private boundViewportChange = () => {
    if (!this.session) {
      return;
    }

    this.applySiteInsets();
    this.refreshCanvas();
  };

  constructor(
    api: GuidoraApiClient,
    zIndex = 2147483000,
    handleError: (error: Error) => void,
    syncSessionToken: (sessionToken: string | null) => void,
  ) {
    this.api = api;
    this.zIndex = zIndex;
    this.handleError = handleError;
    this.syncSessionToken = syncSessionToken;
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
    const flowCollection = await this.api.builderListFlows({
      sessionToken,
      domain: window.location.host,
    });

    this.session = response;
    this.flows = flowCollection.flows;
    this.syncSessionToken(response.session.session_token);
    this.applySiteInsets();
    this.attachRuntimeListeners();
    this.clearCanvasState();
    this.refreshUi();

    if (this.dom) {
      this.dom.root.classList.remove("guidora-sdk-builder-hidden");
    }

    this.startHeartbeat();
    const stepCount = this.getSortedSteps().length;
    this.setStatus(
      stepCount
        ? "Canvas ready. Click a highlighted frame or a step in the viewer to edit it."
        : "Canvas ready. Create the first step from the right rail or create a new flow from the left rail.",
    );

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

    this.refreshUi();
    this.refreshCanvas();
    this.setStatus(
      "Page updated. Continue building on this screen or switch to another saved step.",
    );
  }

  destroy() {
    this.stopHeartbeat();
    this.detachRuntimeListeners();
    this.clearCanvasState();
    this.dom?.root.remove();
    this.dom = null;
    this.session = null;
    this.flows = [];
    this.clearSiteInsets();
    this.syncSessionToken(null);
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

    const highlightBadge = document.createElement("div");
    highlightBadge.className =
      "guidora-sdk-builder-highlight-badge guidora-sdk-builder-hidden";

    const leftRail = document.createElement("aside");
    leftRail.className =
      "guidora-sdk-builder-rail guidora-sdk-builder-rail-left";

    const leftHeader = document.createElement("div");
    leftHeader.className = "guidora-sdk-builder-rail-header";

    const leftEyebrow = document.createElement("span");
    leftEyebrow.className = "guidora-sdk-builder-eyebrow";
    leftEyebrow.textContent = "Canvas";

    const leftTitle = document.createElement("h2");
    leftTitle.className = "guidora-sdk-builder-rail-title";
    leftTitle.textContent = "Flows";

    const leftCopy = document.createElement("p");
    leftCopy.className = "guidora-sdk-builder-rail-copy";
    leftCopy.textContent =
      "Keep flows on the left. Pick the active one, then build directly on the site.";

    leftHeader.append(leftEyebrow, leftTitle, leftCopy);

    const flowActions = document.createElement("div");
    flowActions.className = "guidora-sdk-builder-flow-actions";

    const newFlowButton = document.createElement("button");
    newFlowButton.type = "button";
    newFlowButton.className =
      "guidora-sdk-builder-button guidora-sdk-builder-button-primary";
    newFlowButton.textContent = "New flow";
    newFlowButton.addEventListener("click", () => {
      void this.createFlow("onboarding_tooltip");
    });

    const newPopupFlowButton = document.createElement("button");
    newPopupFlowButton.type = "button";
    newPopupFlowButton.className =
      "guidora-sdk-builder-button guidora-sdk-builder-button-secondary";
    newPopupFlowButton.textContent = "New popup flow";
    newPopupFlowButton.addEventListener("click", () => {
      void this.createFlow("page_popup");
    });

    flowActions.append(newFlowButton, newPopupFlowButton);

    const flowList = document.createElement("div");
    flowList.className = "guidora-sdk-builder-flow-list";

    const flowEditor = document.createElement("section");
    flowEditor.className = "guidora-sdk-builder-flow-editor";

    const flowEditorHeader = document.createElement("div");
    flowEditorHeader.className = "guidora-sdk-builder-flow-editor-header";

    const flowEditorTitle = document.createElement("div");
    flowEditorTitle.className = "guidora-sdk-builder-flow-editor-title";
    flowEditorTitle.textContent = "Flow settings";

    const flowStatusBadge = document.createElement("span");
    flowStatusBadge.className = "guidora-sdk-builder-flow-status";
    flowStatusBadge.textContent = "Draft";

    flowEditorHeader.append(flowEditorTitle, flowStatusBadge);

    const flowNameField = this.createField("Flow name");
    const flowNameInput = document.createElement("input");
    flowNameInput.className = "guidora-sdk-builder-input";
    flowNameInput.type = "text";
    flowNameInput.placeholder = "Product flow";
    flowNameInput.addEventListener("input", () => {
      const flowForm = this.getFlowForm();
      if (!flowForm) {
        return;
      }
      flowForm.name = flowNameInput.value;
      this.syncFlowMeta();
    });
    flowNameField.field.append(flowNameInput);

    const flowPathField = this.createField("Starts on");
    const flowPathInput = document.createElement("input");
    flowPathInput.className = "guidora-sdk-builder-input";
    flowPathInput.type = "text";
    flowPathInput.placeholder = "/example.html";
    flowPathInput.addEventListener("input", () => {
      const flowForm = this.getFlowForm();
      if (!flowForm) {
        return;
      }
      flowForm.entryPath = flowPathInput.value;
      this.syncFlowMeta();
    });
    flowPathField.field.append(flowPathInput);

    const flowEditorActions = document.createElement("div");
    flowEditorActions.className = "guidora-sdk-builder-flow-editor-actions";

    const flowDeleteButton = document.createElement("button");
    flowDeleteButton.type = "button";
    flowDeleteButton.className =
      "guidora-sdk-builder-button guidora-sdk-builder-button-danger";
    flowDeleteButton.textContent = "Delete flow";
    flowDeleteButton.addEventListener("click", () => {
      void this.deleteActiveFlow();
    });

    const flowSaveButton = document.createElement("button");
    flowSaveButton.type = "button";
    flowSaveButton.className =
      "guidora-sdk-builder-button guidora-sdk-builder-button-primary";
    flowSaveButton.textContent = "Save flow";
    flowSaveButton.addEventListener("click", () => {
      void this.saveActiveFlow();
    });

    flowEditorActions.append(flowDeleteButton, flowSaveButton);
    flowEditor.append(
      flowEditorHeader,
      flowNameField.field,
      flowPathField.field,
      flowEditorActions,
    );

    leftRail.append(leftHeader, flowActions, flowEditor, flowList);

    const rightRail = document.createElement("aside");
    rightRail.className =
      "guidora-sdk-builder-rail guidora-sdk-builder-rail-right";

    const rightHeader = document.createElement("div");
    rightHeader.className = "guidora-sdk-builder-rail-header";

    const rightEyebrow = document.createElement("span");
    rightEyebrow.className = "guidora-sdk-builder-eyebrow";
    rightEyebrow.textContent = "Viewer";

    const activeFlowName = document.createElement("div");
    activeFlowName.className = "guidora-sdk-builder-active-flow-name";
    activeFlowName.textContent = "Flow";

    const activeFlowMeta = document.createElement("div");
    activeFlowMeta.className = "guidora-sdk-builder-active-flow-meta";
    activeFlowMeta.textContent = "No active flow";

    rightHeader.append(rightEyebrow, activeFlowName, activeFlowMeta);

    const actionDeck = document.createElement("div");
    actionDeck.className = "guidora-sdk-builder-action-deck";

    const addStepButton = document.createElement("button");
    addStepButton.type = "button";
    addStepButton.className = "guidora-sdk-builder-action-card";
    addStepButton.addEventListener("click", () => {
      if (
        this.isPicking &&
        this.draft?.stepId === null &&
        this.draft.mode === "highlight"
      ) {
        this.closeEditor();
        return;
      }
      this.startNewHighlightStep({ autoPick: true });
    });

    const addStepTitle = document.createElement("span");
    addStepTitle.className = "guidora-sdk-builder-action-title";
    addStepTitle.textContent = "Add highlight";
    const addStepCopy = document.createElement("span");
    addStepCopy.className = "guidora-sdk-builder-action-copy";
    addStepCopy.textContent =
      "Pick a place on the site and attach a tooltip there.";
    addStepButton.append(addStepTitle, addStepCopy);

    const addPopupButton = document.createElement("button");
    addPopupButton.type = "button";
    addPopupButton.className = "guidora-sdk-builder-action-card";
    addPopupButton.addEventListener("click", () => {
      this.startNewPopupStep();
    });

    const addPopupTitle = document.createElement("span");
    addPopupTitle.className = "guidora-sdk-builder-action-title";
    addPopupTitle.textContent = "Open trigger popup";
    const addPopupCopy = document.createElement("span");
    addPopupCopy.className = "guidora-sdk-builder-action-copy";
    addPopupCopy.textContent =
      "Show a page-open popup without selecting a specific element.";
    addPopupButton.append(addPopupTitle, addPopupCopy);

    actionDeck.append(addStepButton, addPopupButton);

    const stepNote = document.createElement("div");
    stepNote.className = "guidora-sdk-builder-step-note";
    stepNote.textContent = "No steps in this flow yet.";

    const stepList = document.createElement("div");
    stepList.className = "guidora-sdk-builder-step-list";

    const statusValue = document.createElement("div");
    statusValue.className = "guidora-sdk-builder-status";
    statusValue.textContent = "Canvas ready.";

    rightRail.append(rightHeader, actionDeck, stepNote, stepList, statusValue);

    const editor = document.createElement("div");
    editor.className = "guidora-sdk-builder-editor guidora-sdk-builder-hidden";

    const editorChip = document.createElement("span");
    editorChip.className = "guidora-sdk-builder-editor-chip";
    editorChip.textContent = "Step editor";

    const editorHeading = document.createElement("div");
    editorHeading.className = "guidora-sdk-builder-editor-heading";
    editorHeading.textContent = "Tooltip copy";

    const editorMeta = document.createElement("div");
    editorMeta.className = "guidora-sdk-builder-editor-meta";
    editorMeta.textContent = "Select a place on the page to begin.";

    const titleField = this.createField("Name");
    const titleInput = document.createElement("input");
    titleInput.className = "guidora-sdk-builder-input";
    titleInput.type = "text";
    titleInput.placeholder = "Step name";
    titleInput.addEventListener("input", () => {
      if (!this.draft) {
        return;
      }
      this.draft.title = titleInput.value;
      this.syncEditor();
    });
    titleField.field.append(titleInput);

    const bodyField = this.createField("Tooltip");
    const bodyInput = document.createElement("textarea");
    bodyInput.className = "guidora-sdk-builder-textarea";
    bodyInput.placeholder = "Explain what should happen here";
    bodyInput.addEventListener("input", () => {
      if (!this.draft) {
        return;
      }
      this.draft.body = bodyInput.value;
    });
    bodyField.field.append(bodyInput);

    const grid = document.createElement("div");
    grid.className = "guidora-sdk-builder-grid";

    const positionField = this.createField("Placement");
    const positionSelect = document.createElement("select");
    positionSelect.className = "guidora-sdk-builder-select";
    this.appendOption(positionSelect, "bottom", "Bottom");
    this.appendOption(positionSelect, "top", "Top");
    this.appendOption(positionSelect, "right", "Right");
    this.appendOption(positionSelect, "left", "Left");
    this.appendOption(positionSelect, "center", "Center");
    positionSelect.addEventListener("change", () => {
      if (!this.draft) {
        return;
      }
      this.draft.position = positionSelect.value as TooltipPosition;
      this.positionEditor();
    });
    positionField.field.append(positionSelect);

    const advanceField = this.createField("Trigger");
    const advanceSelect = document.createElement("select");
    advanceSelect.className = "guidora-sdk-builder-select";
    this.appendOption(advanceSelect, "next_click", "Next button");
    this.appendOption(advanceSelect, "target_click", "Target click");
    this.appendOption(advanceSelect, "auto", "Auto advance");
    advanceSelect.addEventListener("change", () => {
      if (!this.draft) {
        return;
      }
      this.draft.advanceMode = advanceSelect.value as AdvanceMode;
    });
    advanceField.field.append(advanceSelect);

    grid.append(positionField.field, advanceField.field);

    const footer = document.createElement("div");
    footer.className = "guidora-sdk-builder-editor-footer";

    const footerSecondary = document.createElement("div");
    footerSecondary.className = "guidora-sdk-builder-editor-footer-group";

    const reselectButton = document.createElement("button");
    reselectButton.type = "button";
    reselectButton.className =
      "guidora-sdk-builder-button guidora-sdk-builder-button-secondary";
    reselectButton.textContent = "Reselect";
    reselectButton.addEventListener("click", () => {
      if (this.isPicking) {
        this.stopPicking();
        this.refreshCanvas();
        this.setStatus("Selection cancelled.");
        return;
      }

      this.startPicking();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className =
      "guidora-sdk-builder-button guidora-sdk-builder-button-danger";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      void this.deleteCurrentStep();
    });

    footerSecondary.append(reselectButton, deleteButton);

    const footerPrimary = document.createElement("div");
    footerPrimary.className = "guidora-sdk-builder-editor-footer-group";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className =
      "guidora-sdk-builder-button guidora-sdk-builder-button-secondary";
    cancelButton.textContent = "Close";
    cancelButton.addEventListener("click", () => {
      this.closeEditor();
    });

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className =
      "guidora-sdk-builder-button guidora-sdk-builder-button-primary";
    saveButton.textContent = "Save step";
    saveButton.addEventListener("click", () => {
      void this.saveStep();
    });

    footerPrimary.append(cancelButton, saveButton);
    footer.append(footerSecondary, footerPrimary);

    editor.append(
      editorChip,
      editorHeading,
      editorMeta,
      titleField.field,
      bodyField.field,
      grid,
      footer,
    );

    root.append(highlight, highlightBadge, leftRail, rightRail, editor);
    document.body.append(root);

    this.dom = {
      root,
      highlight,
      highlightBadge,
      flowList,
      flowStatusBadge,
      flowNameInput,
      flowPathInput,
      flowSaveButton,
      flowDeleteButton,
      activeFlowName,
      activeFlowMeta,
      newFlowButton,
      newPopupFlowButton,
      addStepButton,
      addPopupButton,
      stepList,
      stepNote,
      statusValue,
      editor,
      editorChip,
      editorHeading,
      editorMeta,
      titleInput,
      bodyInput,
      positionSelect,
      advanceSelect,
      reselectButton,
      deleteButton,
      cancelButton,
      saveButton,
    };
  }

  private createField(label: string) {
    const field = document.createElement("label");
    field.className = "guidora-sdk-builder-field";

    const labelElement = document.createElement("span");
    labelElement.className = "guidora-sdk-builder-field-label";
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

  private attachRuntimeListeners() {
    document.addEventListener("mousemove", this.boundPointerMove, true);
    document.addEventListener("click", this.boundDocumentClick, true);
    window.addEventListener("resize", this.boundViewportChange);
    window.addEventListener("scroll", this.boundViewportChange, true);
  }

  private detachRuntimeListeners() {
    document.removeEventListener("mousemove", this.boundPointerMove, true);
    document.removeEventListener("click", this.boundDocumentClick, true);
    window.removeEventListener("resize", this.boundViewportChange);
    window.removeEventListener("scroll", this.boundViewportChange, true);
  }

  private currentPath() {
    return normalizePath(window.location.pathname);
  }

  private getActiveFlow() {
    return this.session?.flow ?? null;
  }

  private getStepById(stepId: number) {
    return (
      this.getActiveFlow()?.steps.find((step) => step.id === stepId) ?? null
    );
  }

  private getSortedSteps(flow: SdkFlow | null = this.getActiveFlow()) {
    return [...(flow?.steps ?? [])].sort(
      (left, right) => left.step_order - right.step_order,
    );
  }

  private getActiveFlowEntryPath(flow: SdkFlow | null = this.getActiveFlow()) {
    return normalizePath(flow?.entry_path || "/");
  }

  private syncFlowForm(force = false) {
    const activeFlow = this.getActiveFlow();
    if (!activeFlow) {
      this.flowForm = null;
      return;
    }

    if (!force && this.flowForm?.flowId === activeFlow.id) {
      return;
    }

    this.flowForm = {
      flowId: activeFlow.id,
      name: activeFlow.name,
      entryPath: this.getActiveFlowEntryPath(activeFlow),
    };
  }

  private getFlowForm() {
    this.syncFlowForm();
    return this.flowForm;
  }

  private hasPendingFlowChanges() {
    const activeFlow = this.getActiveFlow();
    const flowForm = this.getFlowForm();
    if (!activeFlow || !flowForm) {
      return false;
    }

    return (
      flowForm.name.trim() !== activeFlow.name ||
      normalizePath(flowForm.entryPath || "/") !==
        this.getActiveFlowEntryPath(activeFlow)
    );
  }

  private canDeleteActiveFlow() {
    return this.flows.length > 1;
  }

  private getDraftStep() {
    if (!this.draft?.stepId) {
      return null;
    }

    return this.getStepById(this.draft.stepId);
  }

  private applySiteInsets() {
    if (typeof document === "undefined") {
      return;
    }

    if (!this.hasStoredBodyPadding) {
      this.previousBodyPaddingLeft = document.body.style.paddingLeft;
      this.previousBodyPaddingRight = document.body.style.paddingRight;
      this.hasStoredBodyPadding = true;
    }

    document.documentElement.classList.add("guidora-sdk-builder-active");
    document.body.classList.add("guidora-sdk-builder-active");

    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      document.body.style.paddingLeft = "0px";
      document.body.style.paddingRight = "0px";
      return;
    }

    document.body.style.paddingLeft = `${LEFT_RAIL_WIDTH}px`;
    document.body.style.paddingRight = `${RIGHT_RAIL_WIDTH}px`;
  }

  private clearSiteInsets() {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.classList.remove("guidora-sdk-builder-active");
    document.body.classList.remove("guidora-sdk-builder-active");

    if (this.hasStoredBodyPadding) {
      document.body.style.paddingLeft = this.previousBodyPaddingLeft;
      document.body.style.paddingRight = this.previousBodyPaddingRight;
      this.hasStoredBodyPadding = false;
    }
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

  private refreshUi() {
    this.renderFlowList();
    this.renderStepList();
    this.syncFlowMeta();
    this.syncEditor();
    this.refreshCanvas();
  }

  private renderFlowList() {
    if (!this.dom) {
      return;
    }

    this.dom.flowList.replaceChildren();

    if (!this.flows.length) {
      const empty = document.createElement("div");
      empty.className = "guidora-sdk-builder-empty-state";
      empty.textContent = "No flows yet. Create one from the left rail.";
      this.dom.flowList.append(empty);
      return;
    }

    for (const flow of this.flows) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = [
        "guidora-sdk-builder-flow-card",
        flow.id === this.getActiveFlow()?.id
          ? "guidora-sdk-builder-flow-card-active"
          : "",
      ]
        .filter(Boolean)
        .join(" ");
      button.disabled =
        this.isCreatingFlow ||
        this.isSwitchingFlow ||
        this.isSaving ||
        this.isUpdatingFlow ||
        this.isDeletingFlow;
      button.addEventListener("click", () => {
        if (flow.id === this.getActiveFlow()?.id) {
          return;
        }
        void this.switchFlow(flow.id);
      });

      const title = document.createElement("div");
      title.className = "guidora-sdk-builder-flow-card-title";
      title.textContent = flow.name;

      const meta = document.createElement("div");
      meta.className = "guidora-sdk-builder-flow-card-meta";
      meta.textContent = `${formatFlowStatusLabel(flow.status)} • ${formatStepCount(flow.steps.length)} • ${this.getActiveFlowEntryPath(flow)}`;

      button.append(title, meta);
      this.dom.flowList.append(button);
    }
  }

  private renderStepList() {
    if (!this.dom) {
      return;
    }

    this.dom.stepList.replaceChildren();
    const steps = this.getSortedSteps();
    const currentPage = this.currentPath();
    const currentPageCount = steps.filter(
      (step) => normalizePath(step.page_path || "/") === currentPage,
    ).length;

    this.dom.stepNote.textContent = steps.length
      ? `${steps.length} ${steps.length === 1 ? "step" : "steps"} • ${currentPageCount} on this page`
      : "No steps in this flow yet.";

    if (!steps.length) {
      const empty = document.createElement("div");
      empty.className = "guidora-sdk-builder-empty-state";
      empty.textContent =
        "Use Add highlight or Open trigger popup to start this flow.";
      this.dom.stepList.append(empty);
      return;
    }

    for (const step of steps) {
      const card = document.createElement("button");
      card.type = "button";
      card.draggable = true;
      card.className = [
        "guidora-sdk-builder-step-card",
        step.id === this.draft?.stepId
          ? "guidora-sdk-builder-step-card-active"
          : "",
        normalizePath(step.page_path || "/") === currentPage
          ? ""
          : "guidora-sdk-builder-step-card-offpage",
      ]
        .filter(Boolean)
        .join(" ");
      card.dataset.stepId = String(step.id);
      card.addEventListener("click", () => {
        this.openEditorForStep(step.id);
      });
      card.addEventListener("dragstart", (event) => {
        this.draggingStepId = step.id;
        card.classList.add("guidora-sdk-builder-step-card-dragging");
        event.dataTransfer?.setData("text/plain", String(step.id));
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
        }
      });
      card.addEventListener("dragover", (event) => {
        if (!this.draggingStepId || this.draggingStepId === step.id) {
          return;
        }

        event.preventDefault();
        card.classList.add("guidora-sdk-builder-step-card-drop");
      });
      card.addEventListener("dragleave", () => {
        card.classList.remove("guidora-sdk-builder-step-card-drop");
      });
      card.addEventListener("drop", (event) => {
        event.preventDefault();
        void this.handleStepDrop(step.id);
      });
      card.addEventListener("dragend", () => {
        this.clearStepDragState();
      });

      const top = document.createElement("div");
      top.className = "guidora-sdk-builder-step-row-top";

      const order = document.createElement("span");
      order.className = "guidora-sdk-builder-step-order";
      order.textContent = String(step.step_order);

      const path = document.createElement("span");
      path.className = "guidora-sdk-builder-step-path";
      path.textContent = isPopupStep(step)
        ? "Page open"
        : normalizePath(step.page_path || "/");

      const title = document.createElement("div");
      title.className = "guidora-sdk-builder-step-row-title";
      title.textContent = getStepTitle(step);

      top.append(order, path);
      card.append(top, title);
      this.dom.stepList.append(card);
    }
  }

  private syncFlowMeta() {
    if (!this.dom) {
      return;
    }

    const activeFlow = this.getActiveFlow();
    this.syncFlowForm();
    const flowForm = this.flowForm;
    const isBusy =
      this.isSaving ||
      this.isDeleting ||
      this.isCreatingFlow ||
      this.isSwitchingFlow ||
      this.isUpdatingFlow ||
      this.isDeletingFlow;

    this.dom.newFlowButton.disabled = isBusy;
    this.dom.newPopupFlowButton.disabled = isBusy;
    this.dom.addStepButton.disabled = !activeFlow || isBusy;
    this.dom.addPopupButton.disabled = !activeFlow || isBusy;
    this.dom.flowNameInput.disabled = !activeFlow || isBusy;
    this.dom.flowPathInput.disabled = !activeFlow || isBusy;
    this.dom.flowSaveButton.disabled =
      !activeFlow || isBusy || !this.hasPendingFlowChanges();
    this.dom.flowDeleteButton.disabled =
      !activeFlow || isBusy || !this.canDeleteActiveFlow();

    this.dom.newFlowButton.textContent = this.isCreatingFlow
      ? "Creating..."
      : "New flow";
    this.dom.newPopupFlowButton.textContent = this.isCreatingFlow
      ? "Creating..."
      : "New popup flow";
    this.dom.flowSaveButton.textContent = this.isUpdatingFlow
      ? "Saving..."
      : "Save flow";
    this.dom.flowDeleteButton.textContent = this.isDeletingFlow
      ? "Deleting..."
      : "Delete flow";

    const addStepTitle = this.dom.addStepButton.querySelector(
      ".guidora-sdk-builder-action-title",
    );
    if (addStepTitle) {
      addStepTitle.textContent =
        this.isPicking &&
        this.draft?.stepId === null &&
        this.draft.mode === "highlight"
          ? "Cancel selection"
          : "Add highlight";
    }

    if (!activeFlow) {
      this.dom.activeFlowName.textContent = "No flow selected";
      this.dom.activeFlowMeta.textContent = "Choose a flow from the left rail.";
      this.dom.flowStatusBadge.textContent = "No flow";
      this.dom.flowStatusBadge.className = "guidora-sdk-builder-flow-status";
      this.dom.flowNameInput.value = "";
      this.dom.flowPathInput.value = "";
      return;
    }

    this.dom.activeFlowName.textContent = activeFlow.name;
    this.dom.activeFlowMeta.textContent = `${formatFlowTypeLabel(activeFlow.type)} • ${formatFlowStatusLabel(activeFlow.status)} • ${this.getActiveFlowEntryPath(activeFlow)}`;
    this.dom.flowStatusBadge.textContent = formatFlowStatusLabel(
      activeFlow.status,
    );
    this.dom.flowStatusBadge.className = [
      "guidora-sdk-builder-flow-status",
      activeFlow.status === "published"
        ? "guidora-sdk-builder-flow-status-live"
        : "guidora-sdk-builder-flow-status-draft",
    ].join(" ");
    this.dom.flowNameInput.value = flowForm?.name ?? activeFlow.name;
    this.dom.flowPathInput.value =
      flowForm?.entryPath ?? this.getActiveFlowEntryPath(activeFlow);
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

  private matchesElementToStep(element: HTMLElement, step: SdkFlowStep) {
    const selector = step.selector.trim();
    if (!selector || selector === "body") {
      return null;
    }

    try {
      if (element.matches(selector)) {
        return element;
      }
      return element.closest(selector) as HTMLElement | null;
    } catch {
      return null;
    }
  }

  private findMatchingStepForElement(element: HTMLElement | null) {
    if (!element) {
      return null;
    }

    const currentPath = this.currentPath();
    for (const step of this.getSortedSteps()) {
      if (normalizePath(step.page_path || "/") !== currentPath) {
        continue;
      }

      const matchedElement = this.matchesElementToStep(element, step);
      if (matchedElement) {
        return { step, element: matchedElement };
      }
    }

    return null;
  }

  private getDraftAnchorElement() {
    if (!this.draft) {
      return null;
    }

    if (this.draft.mode === "popup" || this.draft.selector === "body") {
      return null;
    }

    if (normalizePath(this.draft.pagePath || "/") !== this.currentPath()) {
      return null;
    }

    return querySelectorSafe(this.draft.selector);
  }

  private previewCandidate(target: HTMLElement | null) {
    if (!target) {
      this.hideHighlight();
      return;
    }

    this.showHighlight(target, "Click to place", "pick");
  }

  private updateHoverFromTarget(target: HTMLElement | null) {
    const match = this.findMatchingStepForElement(target);
    if (!match) {
      this.hoveredStepId = null;
      this.hoveredElement = null;
      this.hideHighlight();
      return;
    }

    this.hoveredStepId = match.step.id;
    this.hoveredElement = match.element;
    this.showHighlight(match.element, `Step ${match.step.step_order}`, "hover");
  }

  private showHighlight(
    element: HTMLElement,
    label: string,
    tone: HighlightTone,
  ) {
    if (!this.dom) {
      return;
    }

    const rect = element.getBoundingClientRect();
    this.dom.highlight.classList.remove("guidora-sdk-builder-hidden");
    this.dom.highlight.classList.remove(
      "guidora-sdk-builder-highlight-hover",
      "guidora-sdk-builder-highlight-pick",
      "guidora-sdk-builder-highlight-edit",
    );
    this.dom.highlight.classList.add(`guidora-sdk-builder-highlight-${tone}`);
    this.dom.highlight.style.top = `${rect.top - 6}px`;
    this.dom.highlight.style.left = `${rect.left - 6}px`;
    this.dom.highlight.style.width = `${rect.width + 12}px`;
    this.dom.highlight.style.height = `${rect.height + 12}px`;

    this.dom.highlightBadge.textContent = label;
    this.dom.highlightBadge.classList.remove("guidora-sdk-builder-hidden");
    this.dom.highlightBadge.style.top = `${clamp(rect.top - 32, 12, window.innerHeight - 36)}px`;
    this.dom.highlightBadge.style.left = `${clamp(rect.left, 12, window.innerWidth - 180)}px`;
  }

  private hideHighlight() {
    if (!this.dom) {
      return;
    }

    this.dom.highlight.classList.add("guidora-sdk-builder-hidden");
    this.dom.highlightBadge.classList.add("guidora-sdk-builder-hidden");
  }

  private refreshCanvas() {
    if (this.isPicking) {
      this.previewCandidate(this.lastPointerTarget);
      this.positionEditor();
      return;
    }

    if (this.draft) {
      const anchor = this.getDraftAnchorElement();
      this.editingElement = anchor;
      if (anchor) {
        const label = this.draft.stepId ? "Editing step" : "New step";
        this.showHighlight(anchor, label, "edit");
      } else {
        this.hideHighlight();
      }
      this.positionEditor();
      return;
    }

    this.updateHoverFromTarget(this.lastPointerTarget);
  }

  private openEditorForStep(stepId: number) {
    const step = this.getStepById(stepId);
    if (!step) {
      return;
    }

    this.stopPicking();
    this.draft = {
      stepId: step.id,
      mode: isPopupStep(step) ? "popup" : "highlight",
      pagePath: normalizePath(step.page_path || "/"),
      selector: step.selector,
      title: step.tooltip_title || "",
      body: step.tooltip_body || "",
      position: step.position || "bottom",
      advanceMode: step.advance_mode || "next_click",
    };
    this.editingElement = this.getDraftAnchorElement();
    this.syncEditor();
    this.refreshCanvas();

    if (this.editingElement) {
      this.setStatus(`Editing ${getStepTitle(step)} directly on the canvas.`);
      return;
    }

    this.setStatus(
      normalizePath(step.page_path || "/") === this.currentPath()
        ? "Editing step copy. The target element is not available on the current frame."
        : `Editing ${getStepTitle(step)}. Navigate to ${normalizePath(step.page_path || "/")} to reposition it on the page.`,
    );
  }

  private startNewHighlightStep(options: { autoPick: boolean }) {
    if (!this.getActiveFlow()) {
      return;
    }

    this.stopPicking();
    this.draft = {
      stepId: null,
      mode: "highlight",
      pagePath: this.currentPath(),
      selector: "",
      title: "",
      body: "",
      position: "bottom",
      advanceMode: "target_click",
    };
    this.editingElement = null;

    if (options.autoPick) {
      this.startPicking();
      return;
    }

    this.syncEditor();
    this.refreshCanvas();
  }

  private startNewPopupStep() {
    if (!this.getActiveFlow()) {
      return;
    }

    this.stopPicking();
    this.draft = {
      stepId: null,
      mode: "popup",
      pagePath: this.currentPath(),
      selector: "body",
      title: this.getActiveFlow()?.name ?? "Popup",
      body: "",
      position: "center",
      advanceMode: "auto",
    };
    this.editingElement = null;
    this.syncEditor();
    this.refreshCanvas();
    this.setStatus("Popup editor is open. Adjust the copy and save it.");
  }

  private syncEditor() {
    if (!this.dom) {
      return;
    }

    if (!this.draft || this.shouldHideEditorWhilePicking()) {
      this.dom.editor.classList.add("guidora-sdk-builder-hidden");
      return;
    }

    const editingStep = this.getDraftStep();
    this.dom.editor.classList.remove("guidora-sdk-builder-hidden");
    this.dom.editorChip.textContent = editingStep
      ? `Editing step ${editingStep.step_order}`
      : this.draft.mode === "popup"
        ? "New popup"
        : "New highlight";
    this.dom.editorHeading.textContent =
      this.draft.title.trim() ||
      (this.draft.mode === "popup" ? "Popup copy" : "Tooltip copy");
    this.dom.editorMeta.textContent =
      this.draft.mode === "popup"
        ? `${normalizePath(this.draft.pagePath)} • page-open popup`
        : this.draft.selector
          ? `${normalizePath(this.draft.pagePath)} • ${this.draft.selector}`
          : `${normalizePath(this.draft.pagePath)} • select a place on the canvas`;

    this.dom.titleInput.value = this.draft.title;
    this.dom.bodyInput.value = this.draft.body;
    this.dom.positionSelect.value = this.draft.position;
    this.dom.advanceSelect.value = this.draft.advanceMode;

    this.dom.reselectButton.hidden =
      this.draft.mode === "popup" ||
      normalizePath(this.draft.pagePath) !== this.currentPath();
    this.dom.reselectButton.disabled = this.isSaving || this.isDeleting;
    this.dom.reselectButton.textContent = this.isPicking
      ? "Cancel picking"
      : "Reselect";
    this.dom.deleteButton.hidden = this.draft.stepId === null;
    this.dom.deleteButton.disabled = this.isSaving || this.isDeleting;
    this.dom.cancelButton.disabled = this.isSaving || this.isDeleting;
    this.dom.saveButton.disabled = this.isSaving || this.isDeleting;
    this.dom.saveButton.textContent = this.isSaving
      ? this.draft.stepId
        ? "Updating..."
        : "Saving..."
      : this.draft.stepId
        ? "Update step"
        : "Save step";

    this.positionEditor();
  }

  private shouldHideEditorWhilePicking() {
    return Boolean(
      this.draft && this.isPicking && this.draft.mode === "highlight",
    );
  }

  private positionEditor() {
    if (!this.dom || !this.draft) {
      return;
    }

    const card = this.dom.editor;
    const width = card.offsetWidth || 340;
    const height = card.offsetHeight || 320;
    const minLeft =
      window.innerWidth <= MOBILE_BREAKPOINT ? 16 : LEFT_RAIL_WIDTH + 20;
    const maxLeft =
      window.innerWidth <= MOBILE_BREAKPOINT
        ? window.innerWidth - width - 16
        : window.innerWidth - RIGHT_RAIL_WIDTH - width - 20;

    const anchor = this.getDraftAnchorElement();
    if (!anchor) {
      const centeredLeft = clamp(
        (window.innerWidth - width) / 2,
        16,
        Math.max(16, maxLeft),
      );
      const centeredTop = clamp(
        (window.innerHeight - height) / 2,
        16,
        window.innerHeight - height - 16,
      );
      card.style.left = `${centeredLeft}px`;
      card.style.top = `${centeredTop}px`;
      return;
    }

    const rect = anchor.getBoundingClientRect();
    let left = rect.right + 18;
    if (left + width > maxLeft) {
      left = rect.left - width - 18;
    }
    left = clamp(left, minLeft, Math.max(minLeft, maxLeft));
    const top = clamp(rect.top, 16, window.innerHeight - height - 16);

    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }

  private startPicking() {
    if (!this.draft || this.draft.mode === "popup") {
      return;
    }

    this.isPicking = true;
    this.syncFlowMeta();
    this.refreshCanvas();
    this.syncEditor();
    this.setStatus(
      this.draft.stepId
        ? "Select a new place on the site to reposition this step."
        : "Select a place on the site to create the next highlight step.",
    );
  }

  private stopPicking() {
    this.isPicking = false;
    this.syncFlowMeta();
    this.syncEditor();
  }

  private captureElement(element: HTMLElement) {
    if (!this.draft) {
      return;
    }

    this.isPicking = false;
    this.draft.selector = buildSelector(element);
    this.draft.pagePath = this.currentPath();
    if (!this.draft.title.trim()) {
      this.draft.title = textFromElement(element);
    }
    this.editingElement = element;
    this.syncFlowMeta();
    this.syncEditor();
    this.refreshCanvas();
    this.setStatus("Selection saved. Adjust the step copy and save it.");
  }

  private closeEditor() {
    this.stopPicking();
    this.draft = null;
    this.editingElement = null;
    this.syncEditor();
    this.refreshCanvas();
  }

  private clearCanvasState() {
    this.stopPicking();
    this.clearStepDragState();
    this.draft = null;
    this.editingElement = null;
    this.hoveredElement = null;
    this.hoveredStepId = null;
    this.lastPointerTarget = null;
    this.hideHighlight();
    if (this.dom) {
      this.dom.editor.classList.add("guidora-sdk-builder-hidden");
    }
  }

  private setActiveFlow(flow: SdkFlow, nextStepOrder: number) {
    const nextFlows = this.flows.filter(
      (candidate) => candidate.id !== flow.id,
    );
    nextFlows.push(flow);
    nextFlows.sort(
      (left, right) => left.priority - right.priority || left.id - right.id,
    );
    this.flows = nextFlows;
    this.flowForm = null;

    if (!this.session) {
      return;
    }

    this.session = {
      ...this.session,
      flow,
      next_step_order: nextStepOrder,
    };
  }

  private applyFlowMutation(response: SdkBuilderFlowMutationResponse) {
    this.session = {
      session: response.session,
      flow: response.flow,
      next_step_order: response.next_step_order,
    };
    this.flows = response.flows;
    this.flowForm = null;
    this.clearStepDragState();
  }

  private async createFlow(flowType: string) {
    if (!this.session || this.isCreatingFlow || this.isSaving) {
      return;
    }

    this.isCreatingFlow = true;
    this.refreshUi();
    try {
      const response = await this.api.builderCreateFlow({
        sessionToken: this.session.session.session_token,
        domain: window.location.host,
        pagePath: this.currentPath(),
        name: flowType === "page_popup" ? "Page popup" : "Product flow",
        type: flowType,
      });
      this.applyFlowMutation(response);
      if (flowType === "page_popup") {
        this.startNewPopupStep();
      } else {
        this.startNewHighlightStep({ autoPick: true });
      }
      this.setStatus(
        `Created ${response.flow.name}. Continue building directly on the canvas.`,
      );
    } catch (error) {
      this.handleError(error as Error);
      this.setStatus("The new flow could not be created.", "error");
    } finally {
      this.isCreatingFlow = false;
      this.refreshUi();
    }
  }

  private async switchFlow(flowId: number) {
    if (!this.session || this.isSwitchingFlow || this.isSaving) {
      return;
    }

    this.isSwitchingFlow = true;
    this.refreshUi();
    try {
      const response = await this.api.builderSwitchFlow({
        sessionToken: this.session.session.session_token,
        domain: window.location.host,
        flowId,
        pagePath: this.currentPath(),
      });
      this.applyFlowMutation(response);
      this.closeEditor();
      this.setStatus(`Switched to ${response.flow.name}.`);
    } catch (error) {
      this.handleError(error as Error);
      this.setStatus("The selected flow could not be loaded.", "error");
    } finally {
      this.isSwitchingFlow = false;
      this.refreshUi();
    }
  }

  private async saveActiveFlow() {
    const activeFlow = this.getActiveFlow();
    const flowForm = this.getFlowForm();
    if (
      !this.session ||
      !activeFlow ||
      !flowForm ||
      this.isUpdatingFlow ||
      this.isDeletingFlow ||
      this.isSaving
    ) {
      return;
    }

    const nextName = flowForm.name.trim();
    if (!nextName) {
      this.setStatus("Flow name cannot be empty.", "error");
      return;
    }

    const nextPath = normalizePath(flowForm.entryPath || "/");
    this.isUpdatingFlow = true;
    this.refreshUi();
    try {
      const response = await this.api.builderUpdateFlow({
        sessionToken: this.session.session.session_token,
        domain: window.location.host,
        flowId: activeFlow.id,
        name: nextName,
        pagePath: nextPath,
      });
      this.applyFlowMutation(response);
      this.setStatus(
        `${response.flow.name} updated. It will start on ${normalizePath(response.flow.entry_path || "/")}.`,
      );
    } catch (error) {
      this.handleError(error as Error);
      this.setStatus("The flow could not be updated.", "error");
    } finally {
      this.isUpdatingFlow = false;
      this.refreshUi();
    }
  }

  private async deleteActiveFlow() {
    const activeFlow = this.getActiveFlow();
    if (
      !this.session ||
      !activeFlow ||
      this.isDeletingFlow ||
      this.isUpdatingFlow ||
      this.isSaving
    ) {
      return;
    }

    if (!this.canDeleteActiveFlow()) {
      this.setStatus("At least one flow must remain in the builder.", "error");
      return;
    }

    if (!window.confirm(`Delete ${activeFlow.name}?`)) {
      return;
    }

    const deletedName = activeFlow.name;
    this.isDeletingFlow = true;
    this.refreshUi();
    try {
      const response = await this.api.builderDeleteFlow({
        sessionToken: this.session.session.session_token,
        domain: window.location.host,
        flowId: activeFlow.id,
        pagePath: this.currentPath(),
      });
      this.applyFlowMutation(response);
      this.closeEditor();
      this.setStatus(
        `${deletedName} deleted. Switched to ${response.flow.name}.`,
      );
    } catch (error) {
      this.handleError(error as Error);
      this.setStatus("The flow could not be deleted.", "error");
    } finally {
      this.isDeletingFlow = false;
      this.refreshUi();
    }
  }

  private async saveStep() {
    if (!this.draft || !this.session) {
      return;
    }

    const selector = this.draft.selector.trim();
    if (!selector) {
      this.setStatus(
        "Choose a place on the site before saving the step.",
        "error",
      );
      return;
    }

    if (this.isSaving || this.isDeleting) {
      return;
    }

    const currentDraft = this.draft;
    const editingStep = this.getDraftStep();

    this.isSaving = true;
    this.syncEditor();
    this.syncFlowMeta();

    try {
      const response = await this.api.builderSelect(
        this.session.session.session_token,
        {
          domain: window.location.host,
          pagePath: currentDraft.pagePath,
          selector,
          tooltipTitle: currentDraft.title.trim(),
          tooltipBody: currentDraft.body.trim(),
          position: currentDraft.position,
          advanceMode: currentDraft.advanceMode,
          waitForElement: currentDraft.mode !== "popup",
          stepOrder: editingStep?.step_order ?? this.session.next_step_order,
        },
      );

      this.mergeSavedStep(response);
      this.openEditorForStep(response.step.id);
      this.setStatus(
        editingStep
          ? "Step updated on the canvas."
          : "New step added to the flow.",
      );
    } catch (error) {
      this.handleError(error as Error);
      this.setStatus("The step could not be saved.", "error");
    } finally {
      this.isSaving = false;
      this.syncEditor();
      this.syncFlowMeta();
    }
  }

  private mergeSavedStep(response: SdkBuilderSelectResponse) {
    const activeFlow = this.getActiveFlow();
    if (!activeFlow) {
      return;
    }

    const nextSteps = activeFlow.steps.filter(
      (existingStep) => existingStep.id !== response.step.id,
    );
    nextSteps.push(response.step);
    nextSteps.sort((left, right) => left.step_order - right.step_order);

    this.setActiveFlow(
      {
        ...activeFlow,
        status: "published",
        steps: nextSteps,
      },
      response.next_step_order,
    );
    this.refreshUi();
  }

  private async deleteCurrentStep() {
    if (
      !this.session ||
      !this.draft?.stepId ||
      this.isDeleting ||
      this.isSaving
    ) {
      return;
    }

    this.isDeleting = true;
    this.syncEditor();
    this.syncFlowMeta();

    try {
      const response = await this.api.builderDeleteStep({
        sessionToken: this.session.session.session_token,
        domain: window.location.host,
        stepId: this.draft.stepId,
      });
      this.applyDeletedSteps(response);
      this.closeEditor();
      this.setStatus("Step removed from the active flow.");
    } catch (error) {
      this.handleError(error as Error);
      this.setStatus("The step could not be deleted.", "error");
    } finally {
      this.isDeleting = false;
      this.syncFlowMeta();
      this.syncEditor();
    }
  }

  private applyDeletedSteps(response: SdkBuilderDeleteResponse) {
    const activeFlow = this.getActiveFlow();
    if (!activeFlow) {
      return;
    }

    this.setActiveFlow(
      {
        ...activeFlow,
        steps: response.steps,
      },
      response.next_step_order,
    );
    this.refreshUi();
  }

  private clearStepDragState() {
    this.draggingStepId = null;
    this.dom?.stepList
      .querySelectorAll(
        ".guidora-sdk-builder-step-card-drop, .guidora-sdk-builder-step-card-dragging",
      )
      .forEach((element) => {
        element.classList.remove("guidora-sdk-builder-step-card-drop");
        element.classList.remove("guidora-sdk-builder-step-card-dragging");
      });
  }

  private applyReorderedSteps(response: SdkBuilderReorderResponse) {
    const activeFlow = this.getActiveFlow();
    if (!activeFlow) {
      return;
    }

    this.setActiveFlow(
      {
        ...activeFlow,
        steps: response.steps,
      },
      response.next_step_order,
    );
    this.refreshUi();
  }

  private async handleStepDrop(targetStepId: number) {
    if (
      !this.session ||
      !this.draggingStepId ||
      this.draggingStepId === targetStepId
    ) {
      this.clearStepDragState();
      return;
    }

    const reorderedIds = moveStepId(
      this.getSortedSteps().map((step) => step.id),
      this.draggingStepId,
      targetStepId,
    );

    this.clearStepDragState();
    try {
      const response = await this.api.builderReorderSteps({
        sessionToken: this.session.session.session_token,
        domain: window.location.host,
        stepIds: reorderedIds,
      });
      this.applyReorderedSteps(response);
      this.setStatus("Step order updated.");
    } catch (error) {
      this.handleError(error as Error);
      this.setStatus("The step order could not be updated.", "error");
    }
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
      this.detachRuntimeListeners();
      this.clearCanvasState();
      this.dom.root.classList.add("guidora-sdk-builder-hidden");
      this.session = null;
      this.flows = [];
      this.clearSiteInsets();
      this.syncSessionToken(null);
      removeQueryParam(BUILDER_QUERY_PARAM);
    }
  }
}
