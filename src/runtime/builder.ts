import { GuidoraApiClient } from "../http";
import type {
  AdvanceMode,
  GuidoraAssistantConfig,
  GuidoraAssistantPosition,
  SdkBuilderBootstrapResponse,
  SdkBuilderDeleteResponse,
  SdkBuilderFlowMutationResponse,
  SdkBuilderReorderResponse,
  SdkBuilderSelectResponse,
  SdkFlow,
  SdkFlowStep,
  TooltipPosition,
} from "../types";
import {
  escapeCssIdentifier,
  ensureElementInViewport,
  normalizePath,
  readQueryParam,
  removeQueryParam,
  shiftHexColor,
} from "../utils";
import { injectGuidoraStyles } from "./style";

const BUILDER_QUERY_PARAM = "guidora_builder";
const BUILDER_STEP_QUERY_PARAM = "guidora_builder_step";
const HEARTBEAT_INTERVAL = 15000;
const BUILDER_ROOT_SELECTOR = "[data-guidora-builder-root='true']";
const LEFT_RAIL_WIDTH = 248;
const RIGHT_RAIL_WIDTH = 306;
const MOBILE_BREAKPOINT = 1100;
const BUILDER_PERSISTED_QUERY_PARAMS = ["guidora_v", "guidora_sdk_url"];

type HighlightTone = "hover" | "pick" | "edit" | "step";
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
  description: string;
  entryPath: string;
  autoStart: boolean;
  triggerOncePerVisitor: boolean;
  aiEnabled: boolean;
};

type BuilderAssistantForm = {
  enabled: boolean;
  eyebrow: string;
  launcherLabel: string;
  launcherIconUrl: string;
  launcherWidth: number | null;
  title: string;
  subtitle: string;
  welcomeMessage: string;
  placeholder: string;
  submitLabel: string;
  loadingLabel: string;
  suggestions: string[];
  position: GuidoraAssistantPosition;
  offsetX: number | null;
  offsetY: number | null;
  accentColor: string;
  launcherBackgroundColor: string;
  launcherTextColor: string;
  panelBackgroundColor: string;
  panelTextColor: string;
  highlightColor: string;
  highlightOverlayColor: string;
};

type BuilderRuntimeDom = {
  root: HTMLDivElement;
  highlight: HTMLDivElement;
  highlightBadge: HTMLDivElement;
  flowList: HTMLDivElement;
  flowStatusBadge: HTMLSpanElement;
  flowModal: HTMLElement;
  flowModalBackdrop: HTMLDivElement;
  flowModalCloseButton: HTMLButtonElement;
  flowNameInput: HTMLInputElement;
  flowDescriptionInput: HTMLTextAreaElement;
  flowPathInput: HTMLInputElement;
  flowAutoStartInput: HTMLInputElement;
  flowOnceInput: HTMLInputElement;
  flowAiInput: HTMLInputElement;
  flowTriggerSummary: HTMLDivElement;
  flowSaveButton: HTMLButtonElement;
  flowDeleteButton: HTMLButtonElement;
  activeFlowName: HTMLDivElement;
  activeFlowMeta: HTMLDivElement;
  newFlowButton: HTMLButtonElement;
  themeTriggerButton: HTMLButtonElement;
  addStepButton: HTMLButtonElement;
  addStepTitle: HTMLSpanElement;
  addStepCopy: HTMLSpanElement;
  addPopupButton: HTMLButtonElement;
  addPopupTitle: HTMLSpanElement;
  addPopupCopy: HTMLSpanElement;
  stepList: HTMLDivElement;
  stepNote: HTMLDivElement;
  statusValue: HTMLDivElement;
  preview: HTMLDivElement;
  previewChip: HTMLSpanElement;
  previewTitle: HTMLDivElement;
  previewBody: HTMLDivElement;
  previewEditButton: HTMLButtonElement;
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
  assistantPreview: HTMLDivElement;
  assistantPreviewLauncher: HTMLButtonElement;
  assistantPreviewPanel: HTMLDivElement;
  assistantPreviewEyebrow: HTMLDivElement;
  assistantPreviewTitle: HTMLDivElement;
  assistantPreviewSubtitle: HTMLDivElement;
  assistantPreviewWelcome: HTMLDivElement;
  assistantPreviewSuggestions: HTMLDivElement;
  assistantPreviewInput: HTMLInputElement;
  assistantPreviewSubmit: HTMLButtonElement;
  assistantPreviewEditButton: HTMLButtonElement;
  themeModal: HTMLElement;
  themeModalBackdrop: HTMLDivElement;
  themeModalCloseButton: HTMLButtonElement;
  themeModalTitle: HTMLHeadingElement;
  themeModalSubtitle: HTMLParagraphElement;
  themeEnabledButton: HTMLButtonElement;
  themeLauncherLabelInput: HTMLInputElement;
  themeLauncherIconInput: HTMLInputElement;
  themeLauncherWidthInput: HTMLInputElement;
  themeEyebrowInput: HTMLInputElement;
  themeTitleInput: HTMLInputElement;
  themeSubtitleInput: HTMLInputElement;
  themeWelcomeMessageInput: HTMLTextAreaElement;
  themePlaceholderInput: HTMLInputElement;
  themeSubmitLabelInput: HTMLInputElement;
  themeLoadingLabelInput: HTMLInputElement;
  themeSuggestionsInput: HTMLTextAreaElement;
  themePositionSelect: HTMLSelectElement;
  themeAccentInput: HTMLInputElement;
  themeLauncherBackgroundInput: HTMLInputElement;
  themeLauncherTextInput: HTMLInputElement;
  themePanelBackgroundInput: HTMLInputElement;
  themePanelTextInput: HTMLInputElement;
  themeHighlightInput: HTMLInputElement;
  themeHighlightOverlayInput: HTMLInputElement;
  themePreviewLauncherButton: HTMLButtonElement;
  themePreviewPanel: HTMLDivElement;
  themePreviewEyebrow: HTMLDivElement;
  themePreviewTitle: HTMLDivElement;
  themePreviewSubtitle: HTMLParagraphElement;
  themePreviewWelcome: HTMLDivElement;
  themePreviewSuggestions: HTMLDivElement;
  themePreviewInput: HTMLInputElement;
  themePreviewSubmit: HTMLButtonElement;
  themeSaveButton: HTMLButtonElement;
};

type PositionedBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type CanvasBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

type BuilderSettingsMode = "theme" | "widget";

const LEGACY_CUSTOM_ASSISTANT_POSITION = "custom";
const CUSTOM_ASSISTANT_LEFT_POSITIONS = new Set<GuidoraAssistantPosition>([
  "custom-bottom-left",
  "custom-top-left",
]);
const CUSTOM_ASSISTANT_RIGHT_POSITIONS = new Set<GuidoraAssistantPosition>([
  "custom-bottom-right",
  "custom-top-right",
]);

function isLegacyCustomAssistantPosition(
  position: GuidoraAssistantPosition | null | undefined,
) {
  return (position ?? "").trim() === LEGACY_CUSTOM_ASSISTANT_POSITION;
}

function isAnchoredCustomAssistantPosition(
  position: GuidoraAssistantPosition | null | undefined,
) {
  const trimmed = (position ?? "").trim() as GuidoraAssistantPosition;
  return (
    CUSTOM_ASSISTANT_LEFT_POSITIONS.has(trimmed) ||
    CUSTOM_ASSISTANT_RIGHT_POSITIONS.has(trimmed)
  );
}

function getAssistantPositionSelectionValue(
  position: GuidoraAssistantPosition | null | undefined,
) {
  if (
    isLegacyCustomAssistantPosition(position) ||
    isAnchoredCustomAssistantPosition(position)
  ) {
    return LEGACY_CUSTOM_ASSISTANT_POSITION;
  }

  return (position ?? "").trim() || "bottom-right";
}

function createAnchoredAssistantPosition(
  bounds: CanvasBounds,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  const clampedLeft = clamp(
    Math.round(left),
    bounds.left,
    Math.max(bounds.left, bounds.right - width),
  );
  const clampedTop = clamp(
    Math.round(top),
    bounds.top,
    Math.max(bounds.top, bounds.bottom - height),
  );
  const anchorRight =
    clampedLeft + width / 2 >= bounds.left + (bounds.right - bounds.left) / 2;
  const anchorBottom =
    clampedTop + height / 2 >= bounds.top + (bounds.bottom - bounds.top) / 2;

  return {
    position:
      `custom-${anchorBottom ? "bottom" : "top"}-${anchorRight ? "right" : "left"}` as GuidoraAssistantPosition,
    offsetX: anchorRight
      ? Math.max(0, Math.round(bounds.right - (clampedLeft + width)))
      : Math.max(0, Math.round(clampedLeft - bounds.left)),
    offsetY: anchorBottom
      ? Math.max(0, Math.round(bounds.bottom - (clampedTop + height)))
      : Math.max(0, Math.round(clampedTop - bounds.top)),
  };
}

function resolveAssistantPreviewPlacement(options: {
  bounds: CanvasBounds;
  position: GuidoraAssistantPosition | null | undefined;
  offsetX: number | null | undefined;
  offsetY: number | null | undefined;
  width: number;
  height: number;
  margin: number;
}) {
  const { bounds, position, offsetX, offsetY, width, height, margin } = options;
  const trimmedPosition = (position ?? "").trim() as GuidoraAssistantPosition;
  const maxLeft = Math.max(bounds.left, bounds.right - width);
  const maxTop = Math.max(bounds.top, bounds.bottom - height);

  if (
    isLegacyCustomAssistantPosition(trimmedPosition) &&
    Number.isFinite(offsetX) &&
    Number.isFinite(offsetY)
  ) {
    return {
      left: clamp(Math.round(offsetX ?? 0), bounds.left, maxLeft),
      top: clamp(Math.round(offsetY ?? 0), bounds.top, maxTop),
    };
  }

  if (isAnchoredCustomAssistantPosition(trimmedPosition)) {
    const horizontalOffset = Math.max(0, Math.round(offsetX ?? margin));
    const verticalOffset = Math.max(0, Math.round(offsetY ?? margin));

    switch (trimmedPosition) {
      case "custom-bottom-left":
        return {
          left: clamp(bounds.left + horizontalOffset, bounds.left, maxLeft),
          top: clamp(
            bounds.bottom - height - verticalOffset,
            bounds.top,
            maxTop,
          ),
        };
      case "custom-top-right":
        return {
          left: clamp(
            bounds.right - width - horizontalOffset,
            bounds.left,
            maxLeft,
          ),
          top: clamp(bounds.top + verticalOffset, bounds.top, maxTop),
        };
      case "custom-top-left":
        return {
          left: clamp(bounds.left + horizontalOffset, bounds.left, maxLeft),
          top: clamp(bounds.top + verticalOffset, bounds.top, maxTop),
        };
      default:
        return {
          left: clamp(
            bounds.right - width - horizontalOffset,
            bounds.left,
            maxLeft,
          ),
          top: clamp(
            bounds.bottom - height - verticalOffset,
            bounds.top,
            maxTop,
          ),
        };
    }
  }

  switch (trimmedPosition) {
    case "bottom-left":
      return {
        left: clamp(bounds.left + margin, bounds.left, maxLeft),
        top: clamp(bounds.bottom - height - margin, bounds.top, maxTop),
      };
    case "top-right":
      return {
        left: clamp(bounds.right - width - margin, bounds.left, maxLeft),
        top: clamp(bounds.top + margin, bounds.top, maxTop),
      };
    case "top-left":
      return {
        left: clamp(bounds.left + margin, bounds.left, maxLeft),
        top: clamp(bounds.top + margin, bounds.top, maxTop),
      };
    default:
      return {
        left: clamp(bounds.right - width - margin, bounds.left, maxLeft),
        top: clamp(bounds.bottom - height - margin, bounds.top, maxTop),
      };
  }
}

const BUILDER_THEME_PRESETS: Array<{
  id: string;
  label: string;
  colors: Pick<
    BuilderAssistantForm,
    | "accentColor"
    | "launcherBackgroundColor"
    | "launcherTextColor"
    | "panelBackgroundColor"
    | "panelTextColor"
    | "highlightColor"
    | "highlightOverlayColor"
  >;
}> = [
  {
    id: "indigo",
    label: "Indigo",
    colors: {
      accentColor: "#3525CD",
      launcherBackgroundColor: "#3525CD",
      launcherTextColor: "#F8F7FF",
      panelBackgroundColor: "#FCF8FF",
      panelTextColor: "#1B1B24",
      highlightColor: "#4F46E5",
      highlightOverlayColor: "#C7C4D8",
    },
  },
  {
    id: "emerald",
    label: "Emerald",
    colors: {
      accentColor: "#0F766E",
      launcherBackgroundColor: "#0F766E",
      launcherTextColor: "#F4FFFD",
      panelBackgroundColor: "#F4FFFD",
      panelTextColor: "#10211E",
      highlightColor: "#14B8A6",
      highlightOverlayColor: "#BEE7E2",
    },
  },
  {
    id: "sunset",
    label: "Sunset",
    colors: {
      accentColor: "#C2410C",
      launcherBackgroundColor: "#9A3412",
      launcherTextColor: "#FFF7ED",
      panelBackgroundColor: "#FFF7ED",
      panelTextColor: "#431407",
      highlightColor: "#EA580C",
      highlightOverlayColor: "#FED7AA",
    },
  },
];

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

function formatPlacementLabel(position: TooltipPosition) {
  switch (position) {
    case "top":
      return "Top";
    case "right":
      return "Right";
    case "left":
      return "Left";
    case "center":
      return "Centered";
    default:
      return "Bottom";
  }
}

function formatAdvanceModeLabel(mode: AdvanceMode) {
  switch (mode) {
    case "target_click":
      return "Target click";
    case "auto":
      return "Auto advance";
    default:
      return "Next click";
  }
}

function describeStepBehavior(step: SdkFlowStep) {
  const stepTone = isPopupStep(step) ? "Page popup" : "Tooltip";
  return `${stepTone} • ${formatPlacementLabel(step.position || "bottom")} • ${formatAdvanceModeLabel(step.advance_mode || "next_click")}`;
}

function createDefaultAssistantForm(
  assistant: GuidoraAssistantConfig | null,
): BuilderAssistantForm {
  const theme = assistant?.theme ?? {};
  const accentColor = theme.accentColor ?? "#3525CD";

  return {
    enabled: assistant?.enabled ?? true,
    eyebrow: assistant?.eyebrow ?? "AI guide",
    launcherLabel: assistant?.launcherLabel ?? "Ask Guidora",
    launcherIconUrl: assistant?.launcherIconUrl ?? "",
    launcherWidth: assistant?.launcherWidth ?? null,
    title: assistant?.title ?? "Ask for the next action",
    subtitle:
      assistant?.subtitle ??
      "It starts a flow, highlights the right control, or drafts the next missing walkthrough.",
    welcomeMessage:
      assistant?.welcomeMessage ??
      "Ask for the next action. I will open a walkthrough or point to the exact control.",
    placeholder: assistant?.placeholder ?? "How do I complete this task?",
    submitLabel: assistant?.submitLabel ?? "Guide me",
    loadingLabel: assistant?.loadingLabel ?? "Working...",
    suggestions: (
      assistant?.suggestions ?? [
        "How do I publish this?",
        "Show me the next step",
        "Where do I edit billing?",
      ]
    )
      .filter((value) => value.trim())
      .slice(0, 6),
    position: assistant?.position ?? "bottom-right",
    offsetX: assistant?.offsetX ?? null,
    offsetY: assistant?.offsetY ?? null,
    accentColor,
    launcherBackgroundColor: theme.launcherBackgroundColor ?? accentColor,
    launcherTextColor: theme.launcherTextColor ?? "#F8F7FF",
    panelBackgroundColor: theme.panelBackgroundColor ?? "#FCF8FF",
    panelTextColor: theme.panelTextColor ?? "#1B1B24",
    highlightColor: theme.highlightColor ?? shiftHexColor(accentColor, 24),
    highlightOverlayColor: theme.highlightOverlayColor ?? "#C7C4D8",
  };
}

function hasVisibleAssistantText(value: string | null | undefined) {
  return Boolean(String(value ?? "").trim());
}

function normalizeAssistantSuggestions(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 6);
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
  private assistantConfig: GuidoraAssistantConfig | null = null;
  private assistantForm: BuilderAssistantForm | null = null;
  private settingsMode: BuilderSettingsMode = "theme";
  private isThemePreviewOpen = false;
  private isAssistantPreviewOpen = false;
  private isEditorOpen = false;
  private isPicking = false;
  private isSaving = false;
  private isDeleting = false;
  private isCreatingFlow = false;
  private isSwitchingFlow = false;
  private isUpdatingFlow = false;
  private isDeletingFlow = false;
  private isUpdatingAssistant = false;
  private previousBodyPaddingLeft = "";
  private previousBodyPaddingRight = "";
  private hasStoredBodyPadding = false;
  private assistantDragPointerId: number | null = null;
  private assistantDragOffsetX = 0;
  private assistantDragOffsetY = 0;
  private assistantDragStartX = 0;
  private assistantDragStartY = 0;
  private assistantDragMoved = false;
  private assistantSuppressClickUntil = 0;
  private boundPointerMove = (event: MouseEvent) => {
    if (!this.session) {
      return;
    }

    if (this.assistantDragPointerId !== null) {
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
    this.focusStep(matchingStep.step.id);
  };
  private boundViewportChange = () => {
    if (!this.session) {
      return;
    }

    this.applySiteInsets();
    this.refreshCanvas();
    this.positionAssistantPreview();
    this.positionThemePopover();
  };
  private boundAssistantPointerMove = (event: PointerEvent) => {
    if (!this.session || this.assistantDragPointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    this.moveAssistantPreview(event.clientX, event.clientY);
  };
  private boundAssistantPointerUp = (event: PointerEvent) => {
    if (this.assistantDragPointerId !== event.pointerId) {
      return;
    }

    const shouldPersist = this.assistantDragMoved;
    this.stopAssistantDrag();
    if (shouldPersist) {
      this.assistantSuppressClickUntil = Date.now() + 200;
      void this.saveAssistantSettings({
        closeSettings: false,
        statusMessage: false,
      });
    }
  };
  private boundKeyDown = (event: KeyboardEvent) => {
    if (!this.session || event.key !== "Escape") {
      return;
    }

    if (this.isPicking) {
      event.preventDefault();
      this.stopPicking();
      this.refreshCanvas();
      this.setStatus("Capture paused. Resume when you are ready.");
      return;
    }

    if (this.draft) {
      event.preventDefault();
      if (this.isEditorOpen) {
        this.closeEditor();
        this.setStatus("Step editor closed.");
      } else {
        this.clearStepSelection();
        this.setStatus("Step preview closed.");
      }
    }
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

    this.prepareShell();

    const [response, flowCollection] = await Promise.all([
      this.api.builderBootstrap({
        sessionToken,
        domain: window.location.host,
      }),
      this.api.builderListFlows({
        sessionToken,
        domain: window.location.host,
      }),
    ]);

    this.session = response;
    this.assistantConfig = response.assistant;
    this.assistantForm = createDefaultAssistantForm(response.assistant);
    this.flows = flowCollection.flows;
    this.syncSessionToken(response.session.session_token);
    this.attachRuntimeListeners();
    this.clearCanvasState();
    this.refreshUi();

    if (this.dom) {
      this.dom.root.classList.remove("guidora-sdk-builder-hidden");
    }

    this.startHeartbeat();
    if (this.consumeRequestedStepSelection()) {
      return response;
    }

    return response;
  }

  prepareShell() {
    injectGuidoraStyles(this.zIndex);
    this.ensureDom();
    this.applySiteInsets();

    if (!this.dom) {
      return;
    }

    this.dom.root.classList.remove("guidora-sdk-builder-hidden");
    this.dom.statusValue.classList.remove("guidora-sdk-builder-hidden");
    this.dom.statusValue.classList.remove("guidora-sdk-builder-status-error");
    this.dom.statusValue.textContent = "Loading builder...";
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
    if (this.consumeRequestedStepSelection()) {
      return;
    }
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
    this.assistantConfig = null;
    this.assistantForm = null;
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
    leftEyebrow.textContent = "Guidora SDK";

    const leftTitle = document.createElement("h2");
    leftTitle.className = "guidora-sdk-builder-rail-title";
    leftTitle.textContent = "Flow Architect";

    const leftCopy = document.createElement("p");
    leftCopy.className = "guidora-sdk-builder-rail-copy";
    leftCopy.textContent =
      "Create, switch, and tune onboarding flows directly on the live page.";

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
    newPopupFlowButton.textContent = "New flow";
    newPopupFlowButton.hidden = true;
    newPopupFlowButton.disabled = true;

    flowActions.append(newFlowButton);

    const flowList = document.createElement("div");
    flowList.className = "guidora-sdk-builder-flow-list";

    const flowModalBackdrop = document.createElement("div");
    flowModalBackdrop.className =
      "guidora-sdk-builder-modal-backdrop guidora-sdk-builder-hidden";
    flowModalBackdrop.addEventListener("click", () => {
      this.closeFlowSettings();
    });

    const flowEditor = document.createElement("section");
    flowEditor.className =
      "guidora-sdk-builder-flow-editor guidora-sdk-builder-modal guidora-sdk-builder-hidden";

    const flowEditorHeader = document.createElement("div");
    flowEditorHeader.className = "guidora-sdk-builder-flow-editor-header";

    const flowEditorTitle = document.createElement("div");
    flowEditorTitle.className = "guidora-sdk-builder-flow-editor-title";
    flowEditorTitle.textContent = "Flow settings";

    const flowStatusBadge = document.createElement("span");
    flowStatusBadge.className = "guidora-sdk-builder-flow-status";
    flowStatusBadge.textContent = "Draft";

    const flowModalCloseButton = document.createElement("button");
    flowModalCloseButton.type = "button";
    flowModalCloseButton.className =
      "guidora-sdk-builder-icon-button guidora-sdk-builder-modal-close";
    flowModalCloseButton.textContent = "Close";
    flowModalCloseButton.setAttribute("aria-label", "Close flow settings");
    flowModalCloseButton.addEventListener("click", () => {
      this.closeFlowSettings();
    });

    flowEditorHeader.append(
      flowEditorTitle,
      flowStatusBadge,
      flowModalCloseButton,
    );

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

    const flowDescriptionField = this.createField("Description / AI knowledge");
    const flowDescriptionInput = document.createElement("textarea");
    flowDescriptionInput.className = "guidora-sdk-builder-textarea";
    flowDescriptionInput.rows = 4;
    flowDescriptionInput.placeholder =
      "Describe the task, edge cases, and the steps the AI should use while matching this flow.";
    flowDescriptionInput.addEventListener("input", () => {
      const flowForm = this.getFlowForm();
      if (!flowForm) {
        return;
      }
      flowForm.description = flowDescriptionInput.value;
      this.syncFlowMeta();
    });
    flowDescriptionField.field.append(flowDescriptionInput);

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

    const flowBehaviorGrid = document.createElement("div");
    flowBehaviorGrid.className = "guidora-sdk-builder-grid";

    const flowAutoStartField = this.createCheckboxField(
      "Page visit",
      "Start automatically when a visitor lands on the entry path.",
    );
    const flowAutoStartInput = flowAutoStartField.input;
    flowAutoStartInput.addEventListener("change", () => {
      const flowForm = this.getFlowForm();
      if (!flowForm) {
        return;
      }
      flowForm.autoStart = flowAutoStartInput.checked;
      if (flowAutoStartInput.checked) {
        flowForm.triggerOncePerVisitor = true;
      } else {
        flowForm.triggerOncePerVisitor = false;
      }
      this.syncFlowMeta();
    });

    const flowOnceField = this.createCheckboxField(
      "First visit only",
      "Keep this flow from reopening after completion or dismissal.",
    );
    const flowOnceInput = flowOnceField.input;
    flowOnceInput.addEventListener("change", () => {
      const flowForm = this.getFlowForm();
      if (!flowForm) {
        return;
      }
      if (!flowForm.autoStart) {
        flowOnceInput.checked = false;
        flowForm.triggerOncePerVisitor = false;
        this.syncFlowMeta();
        return;
      }
      flowForm.triggerOncePerVisitor = flowOnceInput.checked;
      this.syncFlowMeta();
    });

    const flowAiField = this.createCheckboxField(
      "AI match",
      "Also let resolve-intent start this flow from product questions.",
    );
    const flowAiInput = flowAiField.input;
    flowAiInput.addEventListener("change", () => {
      const flowForm = this.getFlowForm();
      if (!flowForm) {
        return;
      }
      flowForm.aiEnabled = flowAiInput.checked;
      this.syncFlowMeta();
    });

    flowBehaviorGrid.append(
      flowAutoStartField.field,
      flowOnceField.field,
      flowAiField.field,
    );

    const flowTriggerSummary = document.createElement("div");
    flowTriggerSummary.className = "guidora-sdk-builder-flow-summary";
    flowTriggerSummary.textContent = "Trigger rules";

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
      flowDescriptionField.field,
      flowPathField.field,
      flowBehaviorGrid,
      flowTriggerSummary,
      flowEditorActions,
    );

    leftRail.append(leftHeader, flowActions, flowList);

    const rightRail = document.createElement("aside");
    rightRail.className =
      "guidora-sdk-builder-rail guidora-sdk-builder-rail-right";

    const rightHeader = document.createElement("div");
    rightHeader.className = "guidora-sdk-builder-rail-header";

    const rightEyebrow = document.createElement("span");
    rightEyebrow.className = "guidora-sdk-builder-eyebrow";
    rightEyebrow.textContent = "Flow Sequence";

    const activeFlowName = document.createElement("div");
    activeFlowName.className = "guidora-sdk-builder-active-flow-name";
    activeFlowName.textContent = "Flow";

    const activeFlowMeta = document.createElement("div");
    activeFlowMeta.className = "guidora-sdk-builder-active-flow-meta";
    activeFlowMeta.textContent = "Select a flow to edit.";

    const themeTriggerButton = document.createElement("button");
    themeTriggerButton.type = "button";
    themeTriggerButton.className = "guidora-sdk-builder-icon-button";
    themeTriggerButton.textContent = "Theme";
    themeTriggerButton.hidden = true;
    themeTriggerButton.setAttribute("aria-label", "Edit widget theme");
    themeTriggerButton.addEventListener("click", () => {
      this.openThemeSettings();
    });

    rightHeader.append(
      rightEyebrow,
      activeFlowName,
      activeFlowMeta,
      themeTriggerButton,
    );

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
        this.clearStepSelection();
        return;
      }
      this.startNewHighlightStep({ autoPick: true });
    });

    const addStepTitle = document.createElement("span");
    addStepTitle.className = "guidora-sdk-builder-action-title";
    addStepTitle.textContent = "Pick element";
    const addStepCopy = document.createElement("span");
    addStepCopy.className = "guidora-sdk-builder-action-copy";
    addStepCopy.textContent = "Capture directly from the page.";
    addStepButton.append(addStepTitle, addStepCopy);

    const addPopupButton = document.createElement("button");
    addPopupButton.type = "button";
    addPopupButton.className = "guidora-sdk-builder-action-card";
    addPopupButton.addEventListener("click", () => {
      this.startNewPopupStep();
    });

    const addPopupTitle = document.createElement("span");
    addPopupTitle.className = "guidora-sdk-builder-action-title";
    addPopupTitle.textContent = "Page popup";
    const addPopupCopy = document.createElement("span");
    addPopupCopy.className = "guidora-sdk-builder-action-copy";
    addPopupCopy.textContent = "Open guidance without a target.";
    addPopupButton.append(addPopupTitle, addPopupCopy);

    actionDeck.append(addStepButton, addPopupButton);

    const stepNote = document.createElement("div");
    stepNote.className = "guidora-sdk-builder-step-note";
    stepNote.textContent = "No steps yet.";

    const stepList = document.createElement("div");
    stepList.className = "guidora-sdk-builder-step-list";

    const statusValue = document.createElement("div");
    statusValue.className =
      "guidora-sdk-builder-status guidora-sdk-builder-hidden";
    statusValue.textContent = "";

    rightRail.append(rightHeader, actionDeck, stepList, stepNote, statusValue);

    const preview = document.createElement("div");
    preview.className =
      "guidora-sdk-builder-preview guidora-sdk-builder-hidden";

    const previewChip = document.createElement("span");
    previewChip.className = "guidora-sdk-builder-preview-chip";
    previewChip.textContent = "Live preview";

    const previewTitle = document.createElement("div");
    previewTitle.className = "guidora-sdk-builder-preview-title";
    previewTitle.textContent = "Tooltip title";

    const previewBody = document.createElement("div");
    previewBody.className = "guidora-sdk-builder-preview-body";
    previewBody.textContent = "Tooltip body preview appears here.";

    const previewEditButton = document.createElement("button");
    previewEditButton.type = "button";
    previewEditButton.className =
      "guidora-sdk-builder-button guidora-sdk-builder-button-secondary guidora-sdk-builder-preview-edit";
    previewEditButton.textContent = "Edit step";
    previewEditButton.setAttribute("aria-label", "Edit selected step");
    previewEditButton.addEventListener("click", () => {
      this.openEditorForCurrentDraft();
    });

    preview.append(previewChip, previewTitle, previewBody, previewEditButton);

    const assistantPreview = document.createElement("div");
    assistantPreview.className =
      "guidora-sdk-builder-assistant-preview guidora-sdk-builder-hidden";

    const assistantPreviewLauncher = document.createElement("button");
    assistantPreviewLauncher.type = "button";
    assistantPreviewLauncher.className =
      "guidora-sdk-assistant-launcher guidora-sdk-builder-assistant-launcher";
    assistantPreviewLauncher.textContent = "Ask Guidora";
    assistantPreviewLauncher.addEventListener("pointerdown", (event) => {
      this.startAssistantDrag(event);
    });
    assistantPreviewLauncher.addEventListener("click", (event) => {
      if (Date.now() < this.assistantSuppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      this.toggleAssistantPreview();
    });

    const assistantPreviewPanel = document.createElement("div");
    assistantPreviewPanel.className =
      "guidora-sdk-assistant-panel guidora-sdk-builder-hidden";

    const assistantPreviewHeader = document.createElement("div");
    assistantPreviewHeader.className = "guidora-sdk-assistant-header";

    const assistantPreviewHeaderCopy = document.createElement("div");
    assistantPreviewHeaderCopy.className = "guidora-sdk-assistant-header-copy";

    const assistantPreviewEditButton = document.createElement("button");
    assistantPreviewEditButton.type = "button";
    assistantPreviewEditButton.className =
      "guidora-sdk-builder-icon-button guidora-sdk-builder-assistant-edit";
    assistantPreviewEditButton.textContent = "Customize";
    assistantPreviewEditButton.setAttribute("aria-label", "Edit AI widget");
    assistantPreviewEditButton.addEventListener("click", () => {
      this.openAssistantSettings();
    });

    const assistantPreviewEyebrow = document.createElement("div");
    assistantPreviewEyebrow.className = "guidora-sdk-assistant-eyebrow";
    assistantPreviewEyebrow.textContent = "AI guide";

    const assistantPreviewTitle = document.createElement("div");
    assistantPreviewTitle.className = "guidora-sdk-assistant-title";
    assistantPreviewTitle.textContent = "Ask for the next action";

    const assistantPreviewSubtitle = document.createElement("div");
    assistantPreviewSubtitle.className = "guidora-sdk-assistant-subtitle";
    assistantPreviewSubtitle.textContent =
      "It starts a flow, highlights the right control, or drafts the next missing walkthrough.";

    assistantPreviewHeaderCopy.append(
      assistantPreviewEyebrow,
      assistantPreviewTitle,
      assistantPreviewSubtitle,
    );
    assistantPreviewHeader.append(
      assistantPreviewHeaderCopy,
      assistantPreviewEditButton,
    );

    const assistantPreviewWelcome = document.createElement("div");
    assistantPreviewWelcome.className =
      "guidora-sdk-assistant-message guidora-sdk-assistant-message-assistant";

    const assistantPreviewSuggestions = document.createElement("div");
    assistantPreviewSuggestions.className = "guidora-sdk-assistant-suggestions";

    const assistantPreviewComposer = document.createElement("div");
    assistantPreviewComposer.className =
      "guidora-sdk-builder-assistant-composer";

    const assistantPreviewInput = document.createElement("input");
    assistantPreviewInput.type = "text";
    assistantPreviewInput.className = "guidora-sdk-builder-assistant-input";
    assistantPreviewInput.disabled = true;

    const assistantPreviewSubmit = document.createElement("button");
    assistantPreviewSubmit.type = "button";
    assistantPreviewSubmit.className =
      "guidora-sdk-button guidora-sdk-button-primary guidora-sdk-builder-assistant-submit";
    assistantPreviewSubmit.disabled = true;

    assistantPreviewPanel.append(
      assistantPreviewHeader,
      assistantPreviewWelcome,
      assistantPreviewSuggestions,
      assistantPreviewComposer,
    );
    assistantPreviewComposer.append(
      assistantPreviewInput,
      assistantPreviewSubmit,
    );
    assistantPreview.append(assistantPreviewLauncher, assistantPreviewPanel);

    const editor = document.createElement("div");
    editor.className = "guidora-sdk-builder-editor guidora-sdk-builder-hidden";

    const editorChip = document.createElement("span");
    editorChip.className = "guidora-sdk-builder-editor-chip";
    editorChip.textContent = "Guidance editor";

    const editorHeading = document.createElement("div");
    editorHeading.className = "guidora-sdk-builder-editor-heading";
    editorHeading.textContent = "Step copy";

    const editorMeta = document.createElement("div");
    editorMeta.className = "guidora-sdk-builder-editor-meta";
    editorMeta.textContent =
      "Select one place on the page, then keep the message short and specific.";

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
      this.syncPreview();
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
      this.syncPreview();
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
      this.positionPreview();
    });
    positionField.field.append(positionSelect);

    const advanceField = this.createField("Advance step");
    const advanceSelect = document.createElement("select");
    advanceSelect.className = "guidora-sdk-builder-select";
    this.appendOption(advanceSelect, "next_click", "Next button click");
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

    const themeModalBackdrop = document.createElement("div");
    themeModalBackdrop.className =
      "guidora-sdk-builder-modal-backdrop guidora-sdk-builder-hidden";
    themeModalBackdrop.addEventListener("click", () => {
      this.closeThemeSettings();
    });

    const themeModal = document.createElement("section");
    themeModal.className =
      "guidora-sdk-builder-theme-modal guidora-sdk-builder-modal guidora-sdk-builder-hidden";

    const themeModalHeader = document.createElement("header");
    themeModalHeader.className = "guidora-sdk-builder-theme-header";

    const themeModalHeaderCopy = document.createElement("div");
    themeModalHeaderCopy.className = "guidora-sdk-builder-theme-header-copy";

    const themeModalTitle = document.createElement("h2");
    themeModalTitle.className = "guidora-sdk-builder-theme-title";
    themeModalTitle.textContent = "Theme";

    const themeModalSubtitle = document.createElement("p");
    themeModalSubtitle.className = "guidora-sdk-builder-theme-subtitle";
    themeModalSubtitle.textContent =
      "Configure shared palette and surface styling for the widget.";

    const themeModalCloseButton = document.createElement("button");
    themeModalCloseButton.type = "button";
    themeModalCloseButton.className = "guidora-sdk-builder-theme-close";
    themeModalCloseButton.textContent = "Close";
    themeModalCloseButton.addEventListener("click", () => {
      this.closeThemeSettings();
    });

    themeModalHeaderCopy.append(themeModalTitle, themeModalSubtitle);
    themeModalHeader.append(themeModalHeaderCopy, themeModalCloseButton);

    const themeBody = document.createElement("div");
    themeBody.className = "guidora-sdk-builder-theme-body";

    const createThemeSectionLabel = (label: string) => {
      const labelElement = document.createElement("label");
      labelElement.className = "guidora-sdk-builder-theme-section-label";
      labelElement.textContent = label;
      return labelElement;
    };

    const createThemeFieldStack = (label: string, hint?: string) => {
      const stack = document.createElement("div");
      stack.className = "guidora-sdk-builder-theme-field-stack";

      const labelElement = document.createElement("label");
      labelElement.className = "guidora-sdk-builder-theme-field-label";
      labelElement.textContent = label;
      stack.append(labelElement);

      if (hint) {
        const hintElement = document.createElement("span");
        hintElement.className = "guidora-sdk-builder-theme-field-hint";
        hintElement.textContent = hint;
        stack.append(hintElement);
      }

      return { stack, labelElement };
    };

    const themeWidgetPreviewSection = document.createElement("section");
    themeWidgetPreviewSection.className = "guidora-sdk-builder-theme-section";

    const themeWidgetPreviewHeader = document.createElement("div");
    themeWidgetPreviewHeader.className =
      "guidora-sdk-builder-theme-widget-header";

    const themeWidgetPreviewLabel = createThemeSectionLabel("AI Chat Widget");

    const themeEnabledButton = document.createElement("button");
    themeEnabledButton.type = "button";
    themeEnabledButton.className =
      "guidora-sdk-builder-button guidora-sdk-builder-button-secondary guidora-sdk-builder-theme-enable-button";
    themeEnabledButton.addEventListener("click", () => {
      const assistantForm = this.getAssistantForm();
      if (!assistantForm) {
        return;
      }
      assistantForm.enabled = !assistantForm.enabled;
      this.isThemePreviewOpen = assistantForm.enabled;
      this.syncAssistantPreview();
    });

    themeWidgetPreviewHeader.append(
      themeWidgetPreviewLabel,
      themeEnabledButton,
    );

    const themePreviewShell = document.createElement("div");
    themePreviewShell.className = "guidora-sdk-builder-theme-widget-shell";

    const themePreviewLauncherButton = document.createElement("button");
    themePreviewLauncherButton.type = "button";
    themePreviewLauncherButton.className =
      "guidora-sdk-builder-theme-widget-launcher";
    themePreviewLauncherButton.addEventListener("click", () => {
      const assistantForm = this.getAssistantForm();
      if (!assistantForm) {
        return;
      }
      if (!assistantForm.enabled) {
        assistantForm.enabled = true;
        this.isThemePreviewOpen = true;
      } else {
        this.isThemePreviewOpen = !this.isThemePreviewOpen;
      }
      this.syncAssistantPreview();
    });

    const themePreviewPanel = document.createElement("div");
    themePreviewPanel.className = "guidora-sdk-builder-theme-widget-panel";

    const themePreviewPanelHeader = document.createElement("div");
    themePreviewPanelHeader.className =
      "guidora-sdk-builder-theme-widget-panel-header";

    const themePreviewEyebrow = document.createElement("div");
    themePreviewEyebrow.className = "guidora-sdk-builder-theme-widget-eyebrow";

    const themePreviewTitle = document.createElement("div");
    themePreviewTitle.className = "guidora-sdk-builder-theme-widget-title";

    const themePreviewSubtitle = document.createElement("p");
    themePreviewSubtitle.className =
      "guidora-sdk-builder-theme-widget-subtitle";

    themePreviewPanelHeader.append(
      themePreviewEyebrow,
      themePreviewTitle,
      themePreviewSubtitle,
    );

    const themePreviewWelcome = document.createElement("div");
    themePreviewWelcome.className = "guidora-sdk-builder-theme-widget-message";

    const themePreviewSuggestions = document.createElement("div");
    themePreviewSuggestions.className =
      "guidora-sdk-builder-theme-widget-suggestions";

    const themePreviewComposer = document.createElement("div");
    themePreviewComposer.className =
      "guidora-sdk-builder-theme-widget-composer";

    const themePreviewInput = document.createElement("input");
    themePreviewInput.type = "text";
    themePreviewInput.className = "guidora-sdk-builder-theme-widget-input";
    themePreviewInput.disabled = true;

    const themePreviewSubmit = document.createElement("button");
    themePreviewSubmit.type = "button";
    themePreviewSubmit.className = "guidora-sdk-builder-theme-widget-submit";
    themePreviewSubmit.disabled = true;

    themePreviewComposer.append(themePreviewInput, themePreviewSubmit);
    themePreviewPanel.append(
      themePreviewPanelHeader,
      themePreviewWelcome,
      themePreviewSuggestions,
      themePreviewComposer,
    );
    themePreviewShell.append(themePreviewLauncherButton, themePreviewPanel);
    themeWidgetPreviewSection.append(
      themeWidgetPreviewHeader,
      themePreviewShell,
    );

    const themePresetSection = document.createElement("section");
    themePresetSection.className = "guidora-sdk-builder-theme-section";
    themePresetSection.dataset.builderSettingsSection = "theme";
    themePresetSection.append(createThemeSectionLabel("Quick Presets"));

    const themePresetGrid = document.createElement("div");
    themePresetGrid.className = "guidora-sdk-builder-theme-preset-grid";
    for (const preset of BUILDER_THEME_PRESETS) {
      const presetButton = document.createElement("button");
      presetButton.type = "button";
      presetButton.className = "guidora-sdk-builder-theme-preset";
      presetButton.dataset.presetId = preset.id;
      presetButton.addEventListener("click", () => {
        this.applyThemePreset(preset.id);
      });

      const presetSwatch = document.createElement("span");
      presetSwatch.className = "guidora-sdk-builder-theme-preset-swatch";
      presetSwatch.style.background = preset.colors.accentColor;

      const presetLabel = document.createElement("span");
      presetLabel.className = "guidora-sdk-builder-theme-preset-label";
      presetLabel.textContent = preset.label;

      presetButton.append(presetSwatch, presetLabel);
      themePresetGrid.append(presetButton);
    }
    themePresetSection.append(themePresetGrid);

    const themeLayoutSection = document.createElement("section");
    themeLayoutSection.className = "guidora-sdk-builder-theme-section";
    themeLayoutSection.dataset.builderSettingsSection = "widget";
    themeLayoutSection.append(createThemeSectionLabel("Launcher & Placement"));

    const themeLayoutGrid = document.createElement("div");
    themeLayoutGrid.className = "guidora-sdk-builder-theme-layout-grid";

    const themePositionField = createThemeFieldStack("Widget Position");
    const themePositionSelect = document.createElement("select");
    themePositionSelect.className = "guidora-sdk-builder-select";
    this.appendOption(themePositionSelect, "bottom-right", "Bottom right");
    this.appendOption(themePositionSelect, "bottom-left", "Bottom left");
    this.appendOption(themePositionSelect, "top-right", "Top right");
    this.appendOption(themePositionSelect, "top-left", "Top left");
    this.appendOption(
      themePositionSelect,
      LEGACY_CUSTOM_ASSISTANT_POSITION,
      "Custom (drag on page)",
    );
    themePositionSelect.addEventListener("change", () => {
      const assistantForm = this.getAssistantForm();
      if (!assistantForm) {
        return;
      }
      if (themePositionSelect.value === LEGACY_CUSTOM_ASSISTANT_POSITION) {
        const assistantRect =
          this.dom?.assistantPreviewLauncher.getBoundingClientRect();
        const bounds = this.getCanvasBounds();
        const customPlacement = createAnchoredAssistantPosition(
          bounds,
          assistantRect?.left ?? bounds.right - 220,
          assistantRect?.top ?? bounds.bottom - 52,
          Math.round(
            assistantRect?.width ??
              this.dom?.assistantPreviewLauncher.offsetWidth ??
              220,
          ),
          Math.round(
            assistantRect?.height ??
              this.dom?.assistantPreviewLauncher.offsetHeight ??
              52,
          ),
        );
        assistantForm.position = customPlacement.position;
        assistantForm.offsetX = customPlacement.offsetX;
        assistantForm.offsetY = customPlacement.offsetY;
      } else {
        assistantForm.position =
          themePositionSelect.value as GuidoraAssistantPosition;
        assistantForm.offsetX = null;
        assistantForm.offsetY = null;
      }
      this.syncAssistantPreview();
    });
    themePositionField.stack.append(themePositionSelect);

    const themeLauncherLabelField = createThemeFieldStack("Launcher Label");
    const themeLauncherLabelInput = document.createElement("input");
    themeLauncherLabelInput.type = "text";
    themeLauncherLabelInput.className = "guidora-sdk-builder-input";
    themeLauncherLabelInput.addEventListener("input", () => {
      const assistantForm = this.getAssistantForm();
      if (!assistantForm) {
        return;
      }
      assistantForm.launcherLabel = themeLauncherLabelInput.value;
      this.syncAssistantPreview();
    });
    themeLauncherLabelField.stack.append(themeLauncherLabelInput);

    const themeLauncherIconField = createThemeFieldStack(
      "Launcher Icon URL",
      "Optional logo or icon image URL",
    );
    const themeLauncherIconInput = document.createElement("input");
    themeLauncherIconInput.type = "url";
    themeLauncherIconInput.className = "guidora-sdk-builder-input";
    themeLauncherIconInput.placeholder = "https://.../icon.svg";
    themeLauncherIconInput.addEventListener("input", () => {
      const assistantForm = this.getAssistantForm();
      if (!assistantForm) {
        return;
      }
      assistantForm.launcherIconUrl = themeLauncherIconInput.value;
      this.syncAssistantPreview();
    });
    themeLauncherIconField.stack.append(themeLauncherIconInput);

    const themeLauncherWidthField = createThemeFieldStack(
      "Launcher Width",
      "Empty keeps natural width",
    );
    const themeLauncherWidthInput = document.createElement("input");
    themeLauncherWidthInput.type = "number";
    themeLauncherWidthInput.min = "40";
    themeLauncherWidthInput.max = "320";
    themeLauncherWidthInput.step = "1";
    themeLauncherWidthInput.className = "guidora-sdk-builder-input";
    themeLauncherWidthInput.addEventListener("input", () => {
      const assistantForm = this.getAssistantForm();
      if (!assistantForm) {
        return;
      }
      const nextValue = Number.parseInt(themeLauncherWidthInput.value, 10);
      assistantForm.launcherWidth = Number.isFinite(nextValue)
        ? clamp(nextValue, 40, 320)
        : null;
      this.syncAssistantPreview();
    });
    themeLauncherWidthField.stack.append(themeLauncherWidthInput);

    themeLayoutGrid.append(
      themePositionField.stack,
      themeLauncherLabelField.stack,
      themeLauncherIconField.stack,
      themeLauncherWidthField.stack,
    );
    themeLayoutSection.append(themeLayoutGrid);

    const themeMessageSection = document.createElement("section");
    themeMessageSection.className = "guidora-sdk-builder-theme-section";
    themeMessageSection.dataset.builderSettingsSection = "widget";
    themeMessageSection.append(createThemeSectionLabel("Widget Messaging"));

    const themeMessageGrid = document.createElement("div");
    themeMessageGrid.className = "guidora-sdk-builder-theme-message-grid";

    const themeTitleField = createThemeFieldStack("Main Title");
    const themeTitleInput = document.createElement("input");
    themeTitleInput.type = "text";
    themeTitleInput.className = "guidora-sdk-builder-input";
    themeTitleInput.addEventListener("input", () => {
      const assistantForm = this.getAssistantForm();
      if (!assistantForm) {
        return;
      }
      assistantForm.title = themeTitleInput.value;
      this.syncAssistantPreview();
    });
    themeTitleField.stack.append(themeTitleInput);

    const themeSubtitleField = createThemeFieldStack("Subtitle");
    const themeSubtitleInput = document.createElement("input");
    themeSubtitleInput.type = "text";
    themeSubtitleInput.className = "guidora-sdk-builder-input";
    themeSubtitleInput.addEventListener("input", () => {
      const assistantForm = this.getAssistantForm();
      if (!assistantForm) {
        return;
      }
      assistantForm.subtitle = themeSubtitleInput.value;
      this.syncAssistantPreview();
    });
    themeSubtitleField.stack.append(themeSubtitleInput);
    themeMessageGrid.append(themeTitleField.stack, themeSubtitleField.stack);
    themeMessageSection.append(themeMessageGrid);

    const themeChatFlowSection = document.createElement("section");
    themeChatFlowSection.className = "guidora-sdk-builder-theme-section";
    themeChatFlowSection.dataset.builderSettingsSection = "widget";
    themeChatFlowSection.append(createThemeSectionLabel("AI Chat Flow"));

    const themeChatFlowGrid = document.createElement("div");
    themeChatFlowGrid.className = "guidora-sdk-builder-theme-layout-grid";

    const themeEyebrowField = createThemeFieldStack("Eyebrow");
    const themeEyebrowInput = document.createElement("input");
    themeEyebrowInput.type = "text";
    themeEyebrowInput.className = "guidora-sdk-builder-input";
    themeEyebrowInput.addEventListener("input", () => {
      const assistantForm = this.getAssistantForm();
      if (!assistantForm) {
        return;
      }
      assistantForm.eyebrow = themeEyebrowInput.value;
      this.syncAssistantPreview();
    });
    themeEyebrowField.stack.append(themeEyebrowInput);

    const themePlaceholderField = createThemeFieldStack("Placeholder");
    const themePlaceholderInput = document.createElement("input");
    themePlaceholderInput.type = "text";
    themePlaceholderInput.className = "guidora-sdk-builder-input";
    themePlaceholderInput.addEventListener("input", () => {
      const assistantForm = this.getAssistantForm();
      if (!assistantForm) {
        return;
      }
      assistantForm.placeholder = themePlaceholderInput.value;
      this.syncAssistantPreview();
    });
    themePlaceholderField.stack.append(themePlaceholderInput);
    themeChatFlowGrid.append(
      themeEyebrowField.stack,
      themePlaceholderField.stack,
    );

    const themeActionGrid = document.createElement("div");
    themeActionGrid.className = "guidora-sdk-builder-theme-message-grid";

    const themeSubmitLabelField = createThemeFieldStack("Submit Label");
    const themeSubmitLabelInput = document.createElement("input");
    themeSubmitLabelInput.type = "text";
    themeSubmitLabelInput.className = "guidora-sdk-builder-input";
    themeSubmitLabelInput.addEventListener("input", () => {
      const assistantForm = this.getAssistantForm();
      if (!assistantForm) {
        return;
      }
      assistantForm.submitLabel = themeSubmitLabelInput.value;
      this.syncAssistantPreview();
    });
    themeSubmitLabelField.stack.append(themeSubmitLabelInput);

    const themeLoadingLabelField = createThemeFieldStack("Loading Label");
    const themeLoadingLabelInput = document.createElement("input");
    themeLoadingLabelInput.type = "text";
    themeLoadingLabelInput.className = "guidora-sdk-builder-input";
    themeLoadingLabelInput.addEventListener("input", () => {
      const assistantForm = this.getAssistantForm();
      if (!assistantForm) {
        return;
      }
      assistantForm.loadingLabel = themeLoadingLabelInput.value;
      this.syncAssistantPreview();
    });
    themeLoadingLabelField.stack.append(themeLoadingLabelInput);
    themeActionGrid.append(
      themeSubmitLabelField.stack,
      themeLoadingLabelField.stack,
    );

    const themeWelcomeField = createThemeFieldStack("Welcome Message");
    const themeWelcomeMessageInput = document.createElement("textarea");
    themeWelcomeMessageInput.className = "guidora-sdk-builder-textarea";
    themeWelcomeMessageInput.addEventListener("input", () => {
      const assistantForm = this.getAssistantForm();
      if (!assistantForm) {
        return;
      }
      assistantForm.welcomeMessage = themeWelcomeMessageInput.value;
      this.syncAssistantPreview();
    });
    themeWelcomeField.stack.append(themeWelcomeMessageInput);

    const themeSuggestionsField = createThemeFieldStack(
      "Suggestions",
      "One prompt per line",
    );
    const themeSuggestionsInput = document.createElement("textarea");
    themeSuggestionsInput.className = "guidora-sdk-builder-textarea";
    themeSuggestionsInput.addEventListener("input", () => {
      const assistantForm = this.getAssistantForm();
      if (!assistantForm) {
        return;
      }
      assistantForm.suggestions = themeSuggestionsInput.value
        .split(/\n+/)
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 6);
      this.syncAssistantPreview();
    });
    themeSuggestionsField.stack.append(themeSuggestionsInput);
    themeChatFlowSection.append(
      themeChatFlowGrid,
      themeActionGrid,
      themeWelcomeField.stack,
      themeSuggestionsField.stack,
    );

    const createColorField = (
      key: string,
      label: string,
      onInput: (input: HTMLInputElement) => void,
    ) => {
      const row = document.createElement("div");
      row.className = "guidora-sdk-builder-theme-color-row";

      const labelElement = document.createElement("span");
      labelElement.className = "guidora-sdk-builder-theme-color-label";
      labelElement.textContent = label;

      const controls = document.createElement("div");
      controls.className = "guidora-sdk-builder-theme-color-controls";

      const value = document.createElement("span");
      value.className = "guidora-sdk-builder-theme-color-value";
      value.dataset.themeColorValue = key;

      const input = document.createElement("input");
      input.type = "color";
      input.className = "guidora-sdk-builder-theme-color-input";
      input.addEventListener("input", () => {
        onInput(input);
      });

      controls.append(value, input);
      row.append(labelElement, controls);
      return { field: row, input };
    };

    const themeAccentField = createColorField(
      "accent",
      "Primary Action",
      (input) => {
        const assistantForm = this.getAssistantForm();
        if (!assistantForm) {
          return;
        }
        assistantForm.accentColor = input.value.toUpperCase();
        if (!assistantForm.launcherBackgroundColor) {
          assistantForm.launcherBackgroundColor = input.value.toUpperCase();
        }
        this.syncAssistantPreview();
      },
    );
    const themeLauncherBackgroundField = createColorField(
      "launcherBackground",
      "Bot Bubble",
      (input) => {
        const assistantForm = this.getAssistantForm();
        if (!assistantForm) {
          return;
        }
        assistantForm.launcherBackgroundColor = input.value.toUpperCase();
        this.syncAssistantPreview();
      },
    );
    const themeLauncherTextField = createColorField(
      "launcherText",
      "Launcher Icon",
      (input) => {
        const assistantForm = this.getAssistantForm();
        if (!assistantForm) {
          return;
        }
        assistantForm.launcherTextColor = input.value.toUpperCase();
        this.syncAssistantPreview();
      },
    );
    const themePanelBackgroundField = createColorField(
      "panelBackground",
      "Background",
      (input) => {
        const assistantForm = this.getAssistantForm();
        if (!assistantForm) {
          return;
        }
        assistantForm.panelBackgroundColor = input.value.toUpperCase();
        this.syncAssistantPreview();
      },
    );
    const themePanelTextField = createColorField(
      "panelText",
      "Text Color",
      (input) => {
        const assistantForm = this.getAssistantForm();
        if (!assistantForm) {
          return;
        }
        assistantForm.panelTextColor = input.value.toUpperCase();
        this.syncAssistantPreview();
      },
    );
    const themeHighlightField = createColorField(
      "highlight",
      "User Bubble",
      (input) => {
        const assistantForm = this.getAssistantForm();
        if (!assistantForm) {
          return;
        }
        assistantForm.highlightColor = input.value.toUpperCase();
        this.syncAssistantPreview();
      },
    );
    const themeHighlightOverlayField = createColorField(
      "overlay",
      "Overlay",
      (input) => {
        const assistantForm = this.getAssistantForm();
        if (!assistantForm) {
          return;
        }
        assistantForm.highlightOverlayColor = input.value.toUpperCase();
        this.syncAssistantPreview();
      },
    );

    const themePaletteSection = document.createElement("section");
    themePaletteSection.className = "guidora-sdk-builder-theme-section";
    themePaletteSection.dataset.builderSettingsSection = "theme";
    themePaletteSection.append(createThemeSectionLabel("Visual Palette"));

    const themeColorGrid = document.createElement("div");
    themeColorGrid.className = "guidora-sdk-builder-theme-color-grid";
    themeColorGrid.append(
      themeAccentField.field,
      themePanelBackgroundField.field,
      themeLauncherBackgroundField.field,
      themeHighlightOverlayField.field,
      themePanelTextField.field,
      themeLauncherTextField.field,
      themeHighlightField.field,
    );
    themePaletteSection.append(themeColorGrid);

    const themeFooter = document.createElement("footer");
    themeFooter.className = "guidora-sdk-builder-theme-footer";

    const themeFooterSecondary = document.createElement("div");
    themeFooterSecondary.className = "guidora-sdk-builder-theme-footer-group";

    const themeCancelButton = document.createElement("button");
    themeCancelButton.type = "button";
    themeCancelButton.className =
      "guidora-sdk-builder-button guidora-sdk-builder-button-secondary";
    themeCancelButton.textContent = "Cancel";
    themeCancelButton.addEventListener("click", () => {
      this.closeThemeSettings();
    });
    themeFooterSecondary.append(themeCancelButton);

    const themeFooterPrimary = document.createElement("div");
    themeFooterPrimary.className = "guidora-sdk-builder-theme-footer-group";

    const themeSaveButton = document.createElement("button");
    themeSaveButton.type = "button";
    themeSaveButton.className =
      "guidora-sdk-builder-button guidora-sdk-builder-button-primary";
    themeSaveButton.textContent = "Save theme";
    themeSaveButton.addEventListener("click", () => {
      void this.saveAssistantSettings();
    });
    themeFooterPrimary.append(themeSaveButton);
    themeFooter.append(themeFooterSecondary, themeFooterPrimary);

    themeBody.append(
      themeWidgetPreviewSection,
      themePresetSection,
      themeLayoutSection,
      themeMessageSection,
      themeChatFlowSection,
      themePaletteSection,
    );

    themeModal.append(themeModalHeader, themeBody, themeFooter);

    root.append(
      highlight,
      highlightBadge,
      leftRail,
      rightRail,
      flowModalBackdrop,
      flowEditor,
      themeModalBackdrop,
      themeModal,
      preview,
      assistantPreview,
      editor,
    );
    document.body.append(root);

    this.dom = {
      root,
      highlight,
      highlightBadge,
      flowList,
      flowStatusBadge,
      flowModal: flowEditor,
      flowModalBackdrop,
      flowModalCloseButton,
      flowNameInput,
      flowDescriptionInput,
      flowPathInput,
      flowAutoStartInput,
      flowOnceInput,
      flowAiInput,
      flowTriggerSummary,
      flowSaveButton,
      flowDeleteButton,
      activeFlowName,
      activeFlowMeta,
      newFlowButton,
      themeTriggerButton,
      addStepButton,
      addStepTitle,
      addStepCopy,
      addPopupButton,
      addPopupTitle,
      addPopupCopy,
      stepList,
      stepNote,
      statusValue,
      preview,
      previewChip,
      previewTitle,
      previewBody,
      previewEditButton,
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
      assistantPreview,
      assistantPreviewLauncher,
      assistantPreviewPanel,
      assistantPreviewEyebrow,
      assistantPreviewTitle,
      assistantPreviewSubtitle,
      assistantPreviewWelcome,
      assistantPreviewSuggestions,
      assistantPreviewInput,
      assistantPreviewSubmit,
      assistantPreviewEditButton,
      themeModal,
      themeModalBackdrop,
      themeModalCloseButton,
      themeModalTitle,
      themeModalSubtitle,
      themeEnabledButton,
      themeLauncherLabelInput,
      themeLauncherIconInput,
      themeLauncherWidthInput,
      themeEyebrowInput,
      themeTitleInput,
      themeSubtitleInput,
      themeWelcomeMessageInput,
      themePlaceholderInput,
      themeSubmitLabelInput,
      themeLoadingLabelInput,
      themeSuggestionsInput,
      themePositionSelect,
      themeAccentInput: themeAccentField.input,
      themeLauncherBackgroundInput: themeLauncherBackgroundField.input,
      themeLauncherTextInput: themeLauncherTextField.input,
      themePanelBackgroundInput: themePanelBackgroundField.input,
      themePanelTextInput: themePanelTextField.input,
      themeHighlightInput: themeHighlightField.input,
      themeHighlightOverlayInput: themeHighlightOverlayField.input,
      themePreviewLauncherButton,
      themePreviewPanel,
      themePreviewEyebrow,
      themePreviewTitle,
      themePreviewSubtitle,
      themePreviewWelcome,
      themePreviewSuggestions,
      themePreviewInput,
      themePreviewSubmit,
      themeSaveButton,
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

  private createCheckboxField(label: string, description: string) {
    const field = document.createElement("label");
    field.className = "guidora-sdk-builder-checkbox-field";
    field.title = description;

    const row = document.createElement("span");
    row.className = "guidora-sdk-builder-checkbox-row";

    const input = document.createElement("input");
    input.className = "guidora-sdk-builder-checkbox-input";
    input.type = "checkbox";

    const title = document.createElement("span");
    title.className = "guidora-sdk-builder-checkbox-title";
    title.textContent = label;

    row.append(input, title);

    field.append(row);
    return { field, input };
  }

  private getAssistantForm(force = false) {
    if (!this.assistantForm || force) {
      this.assistantForm = createDefaultAssistantForm(this.assistantConfig);
    }

    return this.assistantForm;
  }

  private isFlowSettingsOpen() {
    return (
      !!this.dom &&
      !this.dom.flowModal.classList.contains("guidora-sdk-builder-hidden")
    );
  }

  private isThemeSettingsOpen() {
    return (
      !!this.dom &&
      !this.dom.themeModal.classList.contains("guidora-sdk-builder-hidden")
    );
  }

  private applySettingsMode(mode: BuilderSettingsMode) {
    if (!this.dom) {
      return;
    }

    this.settingsMode = mode;
    this.dom.themeModal.dataset.builderSettingsMode = mode;
    this.dom.themeModalTitle.textContent =
      mode === "theme" ? "Theme" : "AI Widget";
    this.dom.themeModalSubtitle.textContent =
      mode === "theme"
        ? "Configure shared palette and surface styling for the widget."
        : "Configure launcher, copy, placement, and minimal AI-widget behavior.";
    this.dom.themeEnabledButton.hidden = mode === "theme";
  }

  private openSettingsPopover(mode: BuilderSettingsMode) {
    if (!this.dom) {
      return;
    }

    this.closeFlowSettings();
    this.getAssistantForm();
    this.applySettingsMode(mode);
    this.isAssistantPreviewOpen = true;
    this.isThemePreviewOpen = Boolean(this.assistantForm?.enabled);
    this.syncAssistantPreview();
    this.dom.themeModalBackdrop.classList.add("guidora-sdk-builder-hidden");
    this.dom.themeModal.classList.add("guidora-sdk-builder-modal-popover");
    this.dom.themeModal.classList.remove("guidora-sdk-builder-hidden");
    this.positionThemePopover();
  }

  private async openFlowSettings(flowId?: number) {
    const targetFlowId = flowId ?? this.getActiveFlow()?.id;
    if (!targetFlowId || !this.dom) {
      return;
    }

    this.closeThemeSettings();

    if (this.getActiveFlow()?.id !== targetFlowId) {
      await this.switchFlow(targetFlowId, { suppressStatus: true });
    }

    this.syncFlowForm(true);
    this.syncFlowMeta();
    this.dom.flowModalBackdrop.classList.remove("guidora-sdk-builder-hidden");
    this.dom.flowModal.classList.remove("guidora-sdk-builder-hidden");
  }

  private closeFlowSettings() {
    if (!this.dom) {
      return;
    }

    this.dom.flowModalBackdrop.classList.add("guidora-sdk-builder-hidden");
    this.dom.flowModal.classList.add("guidora-sdk-builder-hidden");
  }

  private openThemeSettings() {
    this.openSettingsPopover("theme");
  }

  private openAssistantSettings() {
    this.openSettingsPopover("widget");
  }

  private closeThemeSettings() {
    if (!this.dom) {
      return;
    }

    this.isThemePreviewOpen = false;
    this.dom.themeModal.classList.remove("guidora-sdk-builder-modal-popover");
    this.dom.themeModalBackdrop.classList.add("guidora-sdk-builder-hidden");
    this.dom.themeModal.classList.add("guidora-sdk-builder-hidden");
  }

  private applyThemePreset(presetId: string) {
    const preset = BUILDER_THEME_PRESETS.find((entry) => entry.id === presetId);
    const assistantForm = this.getAssistantForm();
    if (!preset || !assistantForm) {
      return;
    }

    assistantForm.accentColor = preset.colors.accentColor;
    assistantForm.launcherBackgroundColor =
      preset.colors.launcherBackgroundColor;
    assistantForm.launcherTextColor = preset.colors.launcherTextColor;
    assistantForm.panelBackgroundColor = preset.colors.panelBackgroundColor;
    assistantForm.panelTextColor = preset.colors.panelTextColor;
    assistantForm.highlightColor = preset.colors.highlightColor;
    assistantForm.highlightOverlayColor = preset.colors.highlightOverlayColor;
    this.syncAssistantPreview();
  }

  private applyAssistantThemeVariables(form: BuilderAssistantForm | null) {
    if (!this.dom || !form) {
      return;
    }

    this.dom.root.style.setProperty("--guidora-accent-color", form.accentColor);
    this.dom.root.style.setProperty(
      "--guidora-accent-strong",
      shiftHexColor(form.accentColor, 24),
    );
    this.dom.root.style.setProperty(
      "--guidora-launcher-bg",
      form.launcherBackgroundColor,
    );
    this.dom.root.style.setProperty(
      "--guidora-launcher-text",
      form.launcherTextColor,
    );
    this.dom.root.style.setProperty(
      "--guidora-panel-bg",
      form.panelBackgroundColor,
    );
    this.dom.root.style.setProperty(
      "--guidora-panel-text",
      form.panelTextColor,
    );
    this.dom.root.style.setProperty(
      "--guidora-muted-text",
      `color-mix(in srgb, ${form.panelTextColor} 72%, ${form.panelBackgroundColor} 28%)`,
    );
    this.dom.root.style.setProperty(
      "--guidora-highlight-color",
      form.highlightColor,
    );
    this.dom.root.style.setProperty(
      "--guidora-highlight-overlay",
      form.highlightOverlayColor,
    );
  }

  private renderLauncherButton(
    button: HTMLButtonElement,
    options: {
      label: string;
      iconUrl: string;
      width: number | null;
      ariaLabel: string;
    },
  ) {
    const iconUrl = options.iconUrl.trim();
    const label = options.label;
    const hasLabel = hasVisibleAssistantText(label);
    const hasIcon = Boolean(iconUrl);

    button.replaceChildren();
    button.classList.toggle(
      "guidora-sdk-assistant-launcher-textless",
      !hasLabel,
    );
    if (options.width && Number.isFinite(options.width)) {
      button.style.width = `${clamp(options.width, 40, 320)}px`;
    } else {
      button.style.removeProperty("width");
    }
    button.style.minWidth = !hasLabel && !hasIcon ? "48px" : "";
    button.setAttribute("aria-label", options.ariaLabel);

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
    button.append(content);
  }

  private getCanvasBounds() {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      return {
        left: 12,
        top: 12,
        right: Math.max(12, window.innerWidth - 12),
        bottom: Math.max(12, window.innerHeight - 12),
      };
    }

    return {
      left: LEFT_RAIL_WIDTH + 12,
      top: 12,
      right: Math.max(
        LEFT_RAIL_WIDTH + 12,
        window.innerWidth - RIGHT_RAIL_WIDTH - 12,
      ),
      bottom: Math.max(12, window.innerHeight - 12),
    };
  }

  private syncAssistantPreview() {
    if (!this.dom) {
      return;
    }

    const assistantForm = this.getAssistantForm();
    if (!assistantForm) {
      return;
    }

    this.applyAssistantThemeVariables(assistantForm);
    this.applySettingsMode(this.settingsMode);
    this.dom.assistantPreview.dataset.position =
      assistantForm.position || "bottom-right";
    this.dom.assistantPreview.classList.remove("guidora-sdk-builder-hidden");
    this.dom.themeTriggerButton.hidden = false;
    this.renderLauncherButton(this.dom.assistantPreviewLauncher, {
      label: assistantForm.enabled ? assistantForm.launcherLabel : "",
      iconUrl: assistantForm.launcherIconUrl,
      width: assistantForm.launcherWidth,
      ariaLabel:
        assistantForm.launcherLabel || assistantForm.title || "Open AI widget",
    });
    this.dom.assistantPreviewEyebrow.textContent = assistantForm.eyebrow;
    this.dom.assistantPreviewEyebrow.hidden = !hasVisibleAssistantText(
      assistantForm.eyebrow,
    );
    this.dom.assistantPreviewTitle.textContent = assistantForm.title;
    this.dom.assistantPreviewTitle.hidden = !hasVisibleAssistantText(
      assistantForm.title,
    );
    this.dom.assistantPreviewSubtitle.textContent = assistantForm.subtitle;
    this.dom.assistantPreviewSubtitle.hidden = !hasVisibleAssistantText(
      assistantForm.subtitle,
    );
    this.dom.assistantPreviewWelcome.textContent = assistantForm.welcomeMessage;
    this.dom.assistantPreviewWelcome.hidden = !hasVisibleAssistantText(
      assistantForm.welcomeMessage,
    );
    this.dom.assistantPreviewInput.placeholder = assistantForm.placeholder;
    this.dom.assistantPreviewSubmit.textContent = assistantForm.submitLabel;
    this.dom.assistantPreviewSubmit.classList.toggle(
      "guidora-sdk-assistant-submit-empty",
      !hasVisibleAssistantText(assistantForm.submitLabel),
    );
    this.dom.assistantPreviewPanel.classList.toggle(
      "guidora-sdk-builder-hidden",
      !assistantForm.enabled || !this.isAssistantPreviewOpen,
    );
    this.dom.assistantPreview.classList.toggle(
      "guidora-sdk-builder-assistant-preview-disabled",
      !assistantForm.enabled,
    );
    this.dom.assistantPreviewSuggestions.replaceChildren();
    const previewSuggestions = normalizeAssistantSuggestions(
      assistantForm.suggestions,
    ).slice(0, 4);
    this.dom.assistantPreviewSuggestions.hidden =
      previewSuggestions.length === 0;
    for (const suggestion of previewSuggestions) {
      const chip = document.createElement("span");
      chip.className = "guidora-sdk-assistant-chip";
      chip.textContent = suggestion;
      this.dom.assistantPreviewSuggestions.append(chip);
    }
    this.positionAssistantPreview();

    this.dom.themeEnabledButton.textContent = assistantForm.enabled
      ? "Disable AI chat"
      : "Activate AI chat";
    this.dom.themeLauncherLabelInput.value = assistantForm.launcherLabel;
    this.dom.themeLauncherIconInput.value = assistantForm.launcherIconUrl;
    this.dom.themeLauncherWidthInput.value = assistantForm.launcherWidth
      ? String(assistantForm.launcherWidth)
      : "";
    this.dom.themeEyebrowInput.value = assistantForm.eyebrow;
    this.dom.themeTitleInput.value = assistantForm.title;
    this.dom.themeSubtitleInput.value = assistantForm.subtitle;
    this.dom.themeWelcomeMessageInput.value = assistantForm.welcomeMessage;
    this.dom.themePlaceholderInput.value = assistantForm.placeholder;
    this.dom.themeSubmitLabelInput.value = assistantForm.submitLabel;
    this.dom.themeLoadingLabelInput.value = assistantForm.loadingLabel;
    this.dom.themeSuggestionsInput.value = assistantForm.suggestions.join("\n");
    this.dom.themePositionSelect.value = getAssistantPositionSelectionValue(
      assistantForm.position,
    );
    this.dom.themeAccentInput.value = assistantForm.accentColor;
    this.dom.themeLauncherBackgroundInput.value =
      assistantForm.launcherBackgroundColor;
    this.dom.themeLauncherTextInput.value = assistantForm.launcherTextColor;
    this.dom.themePanelBackgroundInput.value =
      assistantForm.panelBackgroundColor;
    this.dom.themePanelTextInput.value = assistantForm.panelTextColor;
    this.dom.themeHighlightInput.value = assistantForm.highlightColor;
    this.dom.themeHighlightOverlayInput.value =
      assistantForm.highlightOverlayColor;

    const setThemeColorValue = (key: string, value: string) => {
      const valueElement = this.dom?.themeModal.querySelector<HTMLElement>(
        `[data-theme-color-value="${key}"]`,
      );
      if (valueElement) {
        valueElement.textContent = value.toUpperCase();
      }
    };

    setThemeColorValue("accent", assistantForm.accentColor);
    setThemeColorValue("panelBackground", assistantForm.panelBackgroundColor);
    setThemeColorValue(
      "launcherBackground",
      assistantForm.launcherBackgroundColor,
    );
    setThemeColorValue("overlay", assistantForm.highlightOverlayColor);
    setThemeColorValue("panelText", assistantForm.panelTextColor);
    setThemeColorValue("launcherText", assistantForm.launcherTextColor);
    setThemeColorValue("highlight", assistantForm.highlightColor);

    const widgetInputs: Array<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    > = [
      this.dom.themeLauncherLabelInput,
      this.dom.themeLauncherIconInput,
      this.dom.themeLauncherWidthInput,
      this.dom.themeEyebrowInput,
      this.dom.themeTitleInput,
      this.dom.themeSubtitleInput,
      this.dom.themeWelcomeMessageInput,
      this.dom.themePlaceholderInput,
      this.dom.themeSubmitLabelInput,
      this.dom.themeLoadingLabelInput,
      this.dom.themeSuggestionsInput,
      this.dom.themePositionSelect,
    ];
    for (const input of widgetInputs) {
      input.disabled = this.settingsMode === "theme";
    }

    this.renderLauncherButton(this.dom.themePreviewLauncherButton, {
      label: assistantForm.enabled ? assistantForm.launcherLabel : "",
      iconUrl: assistantForm.launcherIconUrl,
      width: assistantForm.launcherWidth,
      ariaLabel:
        assistantForm.launcherLabel || assistantForm.title || "Open AI widget",
    });
    this.dom.themePreviewEyebrow.textContent = assistantForm.eyebrow;
    this.dom.themePreviewEyebrow.hidden = !hasVisibleAssistantText(
      assistantForm.eyebrow,
    );
    this.dom.themePreviewTitle.textContent = assistantForm.title;
    this.dom.themePreviewTitle.hidden = !hasVisibleAssistantText(
      assistantForm.title,
    );
    this.dom.themePreviewSubtitle.textContent = assistantForm.subtitle;
    this.dom.themePreviewSubtitle.hidden = !hasVisibleAssistantText(
      assistantForm.subtitle,
    );
    this.dom.themePreviewWelcome.textContent = assistantForm.welcomeMessage;
    this.dom.themePreviewWelcome.hidden = !hasVisibleAssistantText(
      assistantForm.welcomeMessage,
    );
    this.dom.themePreviewInput.placeholder = assistantForm.placeholder;
    this.dom.themePreviewSubmit.textContent = assistantForm.submitLabel;
    this.dom.themePreviewSubmit.classList.toggle(
      "guidora-sdk-assistant-submit-empty",
      !hasVisibleAssistantText(assistantForm.submitLabel),
    );
    this.dom.themePreviewLauncherButton.disabled = false;
    this.dom.themePreviewPanel.classList.toggle(
      "guidora-sdk-builder-theme-widget-panel-open",
      assistantForm.enabled && this.isThemePreviewOpen,
    );
    this.dom.themePreviewPanel.classList.toggle(
      "guidora-sdk-builder-hidden",
      !assistantForm.enabled || !this.isThemePreviewOpen,
    );
    this.dom.themeModal.classList.toggle(
      "guidora-sdk-builder-theme-disabled",
      !assistantForm.enabled,
    );
    this.dom.themePreviewSuggestions.replaceChildren();
    this.dom.themePreviewSuggestions.hidden = previewSuggestions.length === 0;
    for (const suggestion of previewSuggestions) {
      const chip = document.createElement("span");
      chip.className = "guidora-sdk-builder-theme-widget-chip";
      chip.textContent = suggestion;
      this.dom.themePreviewSuggestions.append(chip);
    }

    const activePresetId = BUILDER_THEME_PRESETS.find((preset) => {
      return (
        preset.colors.accentColor.toUpperCase() ===
          assistantForm.accentColor.toUpperCase() &&
        preset.colors.launcherBackgroundColor.toUpperCase() ===
          assistantForm.launcherBackgroundColor.toUpperCase() &&
        preset.colors.launcherTextColor.toUpperCase() ===
          assistantForm.launcherTextColor.toUpperCase() &&
        preset.colors.panelBackgroundColor.toUpperCase() ===
          assistantForm.panelBackgroundColor.toUpperCase() &&
        preset.colors.panelTextColor.toUpperCase() ===
          assistantForm.panelTextColor.toUpperCase() &&
        preset.colors.highlightColor.toUpperCase() ===
          assistantForm.highlightColor.toUpperCase() &&
        preset.colors.highlightOverlayColor.toUpperCase() ===
          assistantForm.highlightOverlayColor.toUpperCase()
      );
    })?.id;

    this.dom.themeModal
      .querySelectorAll<HTMLButtonElement>(".guidora-sdk-builder-theme-preset")
      .forEach((button) => {
        button.classList.toggle(
          "guidora-sdk-builder-theme-preset-active",
          button.dataset.presetId === activePresetId,
        );
      });

    this.dom.themeSaveButton.disabled = this.isUpdatingAssistant;
    this.dom.themeSaveButton.textContent = this.isUpdatingAssistant
      ? "Saving..."
      : this.settingsMode === "theme"
        ? "Save theme"
        : "Save AI widget";
    this.positionThemePopover();
  }

  private toggleAssistantPreview() {
    const assistantForm = this.getAssistantForm();
    if (!assistantForm) {
      return;
    }

    if (!assistantForm.enabled) {
      assistantForm.enabled = true;
      this.isAssistantPreviewOpen = true;
      this.syncAssistantPreview();
      return;
    }

    this.isAssistantPreviewOpen = !this.isAssistantPreviewOpen;
    this.syncAssistantPreview();
  }

  private startAssistantDrag(event: PointerEvent) {
    if (!this.dom || !this.session || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const launcherRect =
      this.dom.assistantPreviewLauncher.getBoundingClientRect();
    this.assistantDragPointerId = event.pointerId;
    this.assistantDragOffsetX = event.clientX - launcherRect.left;
    this.assistantDragOffsetY = event.clientY - launcherRect.top;
    this.assistantDragStartX = event.clientX;
    this.assistantDragStartY = event.clientY;
    this.assistantDragMoved = false;
  }

  private moveAssistantPreview(clientX: number, clientY: number) {
    if (!this.dom) {
      return;
    }

    const assistantForm = this.getAssistantForm();
    if (!assistantForm) {
      return;
    }

    const bounds = this.getCanvasBounds();
    const width = this.dom.assistantPreviewLauncher.offsetWidth || 220;
    const height = this.dom.assistantPreviewLauncher.offsetHeight || 52;
    const nextLeft = clamp(
      Math.round(clientX - this.assistantDragOffsetX),
      bounds.left,
      Math.max(bounds.left, bounds.right - width),
    );
    const nextTop = clamp(
      Math.round(clientY - this.assistantDragOffsetY),
      bounds.top,
      Math.max(bounds.top, bounds.bottom - height),
    );

    if (
      Math.abs(clientX - this.assistantDragStartX) > 4 ||
      Math.abs(clientY - this.assistantDragStartY) > 4
    ) {
      this.assistantDragMoved = true;
    }

    const customPlacement = createAnchoredAssistantPosition(
      bounds,
      nextLeft,
      nextTop,
      width,
      height,
    );
    assistantForm.position = customPlacement.position;
    assistantForm.offsetX = customPlacement.offsetX;
    assistantForm.offsetY = customPlacement.offsetY;
    this.positionAssistantPreview();
    this.positionThemePopover();
  }

  private stopAssistantDrag() {
    this.assistantDragPointerId = null;
    this.assistantDragOffsetX = 0;
    this.assistantDragOffsetY = 0;
    this.assistantDragStartX = 0;
    this.assistantDragStartY = 0;
    this.assistantDragMoved = false;
  }

  private positionAssistantPreview() {
    if (!this.dom) {
      return;
    }

    const assistantForm = this.getAssistantForm();
    if (!assistantForm) {
      return;
    }

    const preview = this.dom.assistantPreview;
    const bounds = this.getCanvasBounds();
    const width = this.dom.assistantPreviewLauncher.offsetWidth || 220;
    const height = this.dom.assistantPreviewLauncher.offsetHeight || 52;
    const margin = 20;
    const placement = resolveAssistantPreviewPlacement({
      bounds,
      position: assistantForm.position,
      offsetX: assistantForm.offsetX,
      offsetY: assistantForm.offsetY,
      width,
      height,
      margin,
    });

    preview.style.left = `${placement.left}px`;
    preview.style.top = `${placement.top}px`;
  }

  private positionThemePopover() {
    if (
      !this.dom ||
      this.dom.themeModal.classList.contains("guidora-sdk-builder-hidden") ||
      !this.dom.themeModal.classList.contains(
        "guidora-sdk-builder-modal-popover",
      )
    ) {
      return;
    }

    const anchorElement = this.dom.assistantPreviewPanel.classList.contains(
      "guidora-sdk-builder-hidden",
    )
      ? this.dom.assistantPreviewLauncher
      : this.dom.assistantPreviewPanel;
    const anchorRect = anchorElement.getBoundingClientRect();
    const modal = this.dom.themeModal;
    const bounds = this.getCanvasBounds();
    const width = modal.offsetWidth || 460;
    const height = modal.offsetHeight || 720;

    let left = anchorRect.right + 16;
    if (left + width > bounds.right) {
      left = anchorRect.left - width - 16;
    }
    left = clamp(
      left,
      bounds.left,
      Math.max(bounds.left, bounds.right - width),
    );

    const top = clamp(
      anchorRect.top,
      bounds.top,
      Math.max(bounds.top, bounds.bottom - height),
    );

    modal.style.left = `${left}px`;
    modal.style.top = `${top}px`;
    modal.style.transform = "none";
    modal.style.maxHeight = `${Math.max(320, window.innerHeight - 24)}px`;
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
    document.addEventListener("keydown", this.boundKeyDown, true);
    document.addEventListener(
      "pointermove",
      this.boundAssistantPointerMove,
      true,
    );
    document.addEventListener("pointerup", this.boundAssistantPointerUp, true);
    document.addEventListener(
      "pointercancel",
      this.boundAssistantPointerUp,
      true,
    );
    window.addEventListener("resize", this.boundViewportChange);
    window.addEventListener("scroll", this.boundViewportChange, true);
  }

  private detachRuntimeListeners() {
    document.removeEventListener("mousemove", this.boundPointerMove, true);
    document.removeEventListener("click", this.boundDocumentClick, true);
    document.removeEventListener("keydown", this.boundKeyDown, true);
    document.removeEventListener(
      "pointermove",
      this.boundAssistantPointerMove,
      true,
    );
    document.removeEventListener(
      "pointerup",
      this.boundAssistantPointerUp,
      true,
    );
    document.removeEventListener(
      "pointercancel",
      this.boundAssistantPointerUp,
      true,
    );
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
      description: activeFlow.description,
      entryPath: this.getActiveFlowEntryPath(activeFlow),
      autoStart: activeFlow.page_auto_start,
      triggerOncePerVisitor: activeFlow.trigger_once_per_visitor,
      aiEnabled: activeFlow.ai_enabled,
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
      flowForm.description.trim() !== activeFlow.description ||
      normalizePath(flowForm.entryPath || "/") !==
        this.getActiveFlowEntryPath(activeFlow) ||
      flowForm.autoStart !== activeFlow.page_auto_start ||
      flowForm.triggerOncePerVisitor !== activeFlow.trigger_once_per_visitor ||
      flowForm.aiEnabled !== activeFlow.ai_enabled
    );
  }

  private describeFlowTriggers(
    flow: SdkFlow,
    flowForm: BuilderFlowForm | null,
  ) {
    const entryPath = normalizePath(
      flowForm?.entryPath ?? this.getActiveFlowEntryPath(flow),
    );
    const autoStart = flowForm?.autoStart ?? flow.page_auto_start;
    const triggerOnce =
      flowForm?.triggerOncePerVisitor ?? flow.trigger_once_per_visitor;
    const aiEnabled = flowForm?.aiEnabled ?? flow.ai_enabled;

    return [
      autoStart
        ? `Page visit on ${entryPath}`
        : `No page auto-start on ${entryPath}`,
      triggerOnce ? "first visit only" : "repeat visits allowed",
      aiEnabled ? "AI match on" : "AI match off",
    ].join(" • ");
  }

  private getVisibleEditorRect() {
    if (!this.dom) {
      return null;
    }

    if (this.dom.editor.classList.contains("guidora-sdk-builder-hidden")) {
      return null;
    }

    const rect = this.dom.editor.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }

    return rect;
  }

  private makePositionedBox(
    left: number,
    top: number,
    width: number,
    height: number,
  ): PositionedBox {
    return { left, top, width, height };
  }

  private overlapsRect(
    candidate: PositionedBox,
    rect: DOMRect | null,
    gap = 16,
  ) {
    if (!rect) {
      return false;
    }

    return !(
      candidate.left + candidate.width + gap <= rect.left ||
      candidate.left >= rect.right + gap ||
      candidate.top + candidate.height + gap <= rect.top ||
      candidate.top >= rect.bottom + gap
    );
  }

  private resolvePreviewPlacement(
    width: number,
    height: number,
    minLeft: number,
    maxLeft: number,
    minTop: number,
    maxTop: number,
  ) {
    const anchor = this.getDraftAnchorElement();
    const editorRect = this.getVisibleEditorRect();
    const placements: TooltipPosition[] = [
      "bottom",
      "top",
      "right",
      "left",
      "center",
    ];
    const clampLeft = (value: number) =>
      clamp(value, minLeft, Math.max(minLeft, maxLeft));
    const clampTop = (value: number) =>
      clamp(value, minTop, Math.max(minTop, maxTop));

    const buildCandidate = (placement: TooltipPosition) => {
      if (!anchor || this.draft?.mode === "popup") {
        return this.makePositionedBox(
          clampLeft((window.innerWidth - width) / 2),
          clampTop(72),
          width,
          height,
        );
      }

      const rect = anchor.getBoundingClientRect();
      let left = rect.left + rect.width / 2 - width / 2;
      let top = rect.bottom + 18;

      switch (placement) {
        case "top":
          top = rect.top - height - 18;
          break;
        case "right":
          left = rect.right + 18;
          top = rect.top + rect.height / 2 - height / 2;
          break;
        case "left":
          left = rect.left - width - 18;
          top = rect.top + rect.height / 2 - height / 2;
          break;
        case "center":
          top = rect.top + rect.height / 2 - height / 2;
          break;
        default:
          break;
      }

      return this.makePositionedBox(
        clampLeft(left),
        clampTop(top),
        width,
        height,
      );
    };

    for (const placement of placements) {
      const candidate = buildCandidate(placement);
      const anchorRect = anchor?.getBoundingClientRect() ?? null;
      if (
        !this.overlapsRect(candidate, anchorRect, 12) &&
        !this.overlapsRect(candidate, editorRect, 18)
      ) {
        return candidate;
      }
    }

    return buildCandidate(this.draft?.position ?? "bottom");
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
      "guidora-sdk-builder-hidden",
      !message.trim(),
    );
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
    this.syncPreview();
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
      empty.textContent = "No flows yet. Create one to begin.";
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

      const top = document.createElement("div");
      top.className = "guidora-sdk-builder-flow-card-top";

      const title = document.createElement("div");
      title.className = "guidora-sdk-builder-flow-card-title";
      title.textContent = flow.name;

      const status = document.createElement("span");
      status.className = [
        "guidora-sdk-builder-flow-card-status",
        `guidora-sdk-builder-flow-card-status-${flow.status}`,
      ].join(" ");
      status.textContent = formatFlowStatusLabel(flow.status);

      const settingsButton = document.createElement("button");
      settingsButton.type = "button";
      settingsButton.className = "guidora-sdk-builder-icon-button";
      settingsButton.textContent = "Edit";
      settingsButton.setAttribute("aria-label", `Edit ${flow.name}`);
      settingsButton.disabled = button.disabled;
      settingsButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void this.openFlowSettings(flow.id);
      });

      const meta = document.createElement("div");
      meta.className = "guidora-sdk-builder-flow-card-meta";
      meta.textContent = `${formatFlowTypeLabel(flow.type)} • ${formatStepCount(flow.steps.length)}`;

      const path = document.createElement("div");
      path.className = "guidora-sdk-builder-flow-card-path";
      path.textContent = this.getActiveFlowEntryPath(flow);

      top.append(title, status, settingsButton);
      button.append(top, meta, path);
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
      : "No steps yet.";

    if (!steps.length) {
      const empty = document.createElement("div");
      empty.className = "guidora-sdk-builder-empty-state";
      empty.textContent =
        "Use Pick element to capture the first target, or Open page popup when guidance should start without a target.";
      this.dom.stepList.append(empty);
      return;
    }

    for (const step of steps) {
      const isActiveStep = step.id === this.draft?.stepId;
      const isHoveredStep = step.id === this.hoveredStepId;
      const card = document.createElement("button");
      card.type = "button";
      card.draggable = true;
      card.className = [
        "guidora-sdk-builder-step-card",
        isActiveStep ? "guidora-sdk-builder-step-card-active" : "",
        isHoveredStep ? "guidora-sdk-builder-step-card-hovered" : "",
        normalizePath(step.page_path || "/") === currentPage
          ? ""
          : "guidora-sdk-builder-step-card-offpage",
      ]
        .filter(Boolean)
        .join(" ");
      card.dataset.stepId = String(step.id);
      card.addEventListener("click", () => {
        this.focusStep(step.id, { navigateToPage: true });
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

      const meta = document.createElement("div");
      meta.className = "guidora-sdk-builder-step-row-meta";
      meta.append(path);

      if (isActiveStep) {
        const activeChip = document.createElement("span");
        activeChip.className =
          "guidora-sdk-builder-step-chip guidora-sdk-builder-step-chip-active";
        activeChip.textContent = "Active";
        meta.append(activeChip);
      } else if (isHoveredStep) {
        const hoveredChip = document.createElement("span");
        hoveredChip.className =
          "guidora-sdk-builder-step-chip guidora-sdk-builder-step-chip-hovered";
        hoveredChip.textContent = "Hover";
        meta.append(hoveredChip);
      }

      const title = document.createElement("div");
      title.className = "guidora-sdk-builder-step-row-title";
      title.textContent = getStepTitle(step);

      const copy = document.createElement("div");
      copy.className = "guidora-sdk-builder-step-row-copy";
      copy.textContent = describeStepBehavior(step);

      top.append(order, meta);
      card.append(top, title, copy);
      this.dom.stepList.append(card);
    }
  }

  private syncFlowMeta() {
    if (!this.dom) {
      return;
    }

    const activeFlow = this.getActiveFlow();
    const draft = this.draft;
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
    this.dom.themeTriggerButton.disabled = this.isUpdatingAssistant;
    this.dom.addStepButton.disabled = !activeFlow || isBusy;
    this.dom.addPopupButton.disabled = !activeFlow || isBusy;
    this.dom.flowNameInput.disabled = !activeFlow || isBusy;
    this.dom.flowDescriptionInput.disabled = !activeFlow || isBusy;
    this.dom.flowPathInput.disabled = !activeFlow || isBusy;
    this.dom.flowAutoStartInput.disabled = !activeFlow || isBusy;
    this.dom.flowOnceInput.disabled =
      !activeFlow ||
      isBusy ||
      !(flowForm?.autoStart ?? activeFlow.page_auto_start);
    this.dom.flowAiInput.disabled = !activeFlow || isBusy;
    this.dom.flowSaveButton.disabled =
      !activeFlow || isBusy || !this.hasPendingFlowChanges();
    this.dom.flowDeleteButton.disabled =
      !activeFlow || isBusy || !this.canDeleteActiveFlow();

    this.dom.newFlowButton.textContent = this.isCreatingFlow
      ? "Creating..."
      : "New flow";
    this.dom.flowSaveButton.textContent = this.isUpdatingFlow
      ? "Saving..."
      : "Save flow";
    this.dom.flowDeleteButton.textContent = this.isDeletingFlow
      ? "Deleting..."
      : "Delete flow";

    const isCreatingHighlightStep =
      this.isPicking && draft?.stepId === null && draft?.mode === "highlight";
    const isRecapturingStep =
      this.isPicking && draft?.stepId !== null && draft?.mode === "highlight";
    const isCreatingPopupStep =
      draft?.stepId === null && draft?.mode === "popup";

    this.dom.addStepButton.classList.toggle(
      "guidora-sdk-builder-action-card-active",
      isCreatingHighlightStep || isRecapturingStep,
    );
    this.dom.addPopupButton.classList.toggle(
      "guidora-sdk-builder-action-card-active",
      isCreatingPopupStep,
    );
    this.dom.addStepTitle.textContent = isCreatingHighlightStep
      ? "Click element on page"
      : isRecapturingStep
        ? "Pick a new element"
        : "Pick element";
    this.dom.addStepCopy.textContent = isCreatingHighlightStep
      ? "Capture is active. Click any page element to attach this step."
      : isRecapturingStep
        ? "Capture is active. Click the replacement element on the page."
        : "Capture directly from the page.";
    this.dom.addPopupTitle.textContent = isCreatingPopupStep
      ? "Popup editor open"
      : "Page popup";
    this.dom.addPopupCopy.textContent = isCreatingPopupStep
      ? "Refine the opening message, then save it to the flow."
      : "Open guidance without a target.";

    if (!activeFlow) {
      this.dom.activeFlowName.textContent = "No flow selected";
      this.dom.activeFlowMeta.textContent = "Choose a flow from the left rail.";
      this.dom.flowStatusBadge.textContent = "No flow";
      this.dom.flowStatusBadge.className = "guidora-sdk-builder-flow-status";
      this.dom.flowNameInput.value = "";
      this.dom.flowDescriptionInput.value = "";
      this.dom.flowPathInput.value = "";
      this.dom.flowAutoStartInput.checked = false;
      this.dom.flowOnceInput.checked = false;
      this.dom.flowAiInput.checked = false;
      this.dom.flowTriggerSummary.textContent =
        "Select a flow to configure when it should start.";
      this.dom.stepNote.textContent =
        "Choose a flow, then capture targets directly on the page.";
      this.closeFlowSettings();
      this.syncAssistantPreview();
      return;
    }

    this.dom.activeFlowName.textContent = activeFlow.name;
    this.dom.activeFlowMeta.textContent = `${formatFlowTypeLabel(activeFlow.type)} • ${formatFlowStatusLabel(activeFlow.status)} • ${this.describeFlowTriggers(activeFlow, flowForm)}`;
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
    this.dom.flowDescriptionInput.value =
      flowForm?.description ?? activeFlow.description;
    this.dom.flowPathInput.value =
      flowForm?.entryPath ?? this.getActiveFlowEntryPath(activeFlow);
    this.dom.flowAutoStartInput.checked =
      flowForm?.autoStart ?? activeFlow.page_auto_start;
    this.dom.flowOnceInput.checked =
      flowForm?.triggerOncePerVisitor ?? activeFlow.trigger_once_per_visitor;
    this.dom.flowAiInput.checked = flowForm?.aiEnabled ?? activeFlow.ai_enabled;
    if (!this.dom.flowAutoStartInput.checked) {
      this.dom.flowOnceInput.checked = false;
    }
    this.dom.flowTriggerSummary.textContent = this.describeFlowTriggers(
      activeFlow,
      flowForm,
    );

    if (isCreatingHighlightStep) {
      this.dom.stepNote.textContent =
        "Capture active. Click the target on the page.";
    } else if (isRecapturingStep) {
      this.dom.stepNote.textContent =
        "Capture active. Click the replacement target on the page.";
    }

    this.syncAssistantPreview();
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

    this.showHighlight(target, "Click to capture", "pick");
  }

  private updateHoverFromTarget(target: HTMLElement | null) {
    const previousHoveredStepId = this.hoveredStepId;
    if (!target) {
      this.hoveredStepId = null;
      this.hoveredElement = null;
      this.hideHighlight();
      if (previousHoveredStepId !== null) {
        this.renderStepList();
      }
      return;
    }

    const match = this.findMatchingStepForElement(target);
    if (!match) {
      this.hoveredStepId = null;
      this.hoveredElement = target;
      this.showHighlight(target, "Selectable element", "hover");
      if (previousHoveredStepId !== null) {
        this.renderStepList();
      }
      return;
    }

    this.hoveredStepId = match.step.id;
    this.hoveredElement = match.element;
    this.showHighlight(match.element, `Step ${match.step.step_order}`, "step");
    if (previousHoveredStepId !== match.step.id) {
      this.renderStepList();
    }
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
      "guidora-sdk-builder-highlight-step",
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
    this.positionAssistantPreview();
    this.positionThemePopover();

    if (this.isPicking) {
      this.previewCandidate(this.lastPointerTarget);
      this.positionEditor();
      this.syncPreview();
      return;
    }

    if (this.draft) {
      const anchor = this.getDraftAnchorElement();
      this.editingElement = anchor;
      if (anchor) {
        const editingStep = this.getDraftStep();
        const label = this.draft.stepId
          ? `Editing step ${editingStep?.step_order ?? ""}`.trim()
          : this.draft.selector
            ? "Element selected"
            : "Pick a target";
        this.showHighlight(anchor, label, "edit");
      } else {
        this.hideHighlight();
      }
      this.positionEditor();
      this.positionPreview();
      return;
    }

    this.updateHoverFromTarget(this.lastPointerTarget);
  }

  private consumeRequestedStepSelection() {
    const requestedStepId = Number.parseInt(
      readQueryParam(BUILDER_STEP_QUERY_PARAM),
      10,
    );

    if (!Number.isFinite(requestedStepId)) {
      return false;
    }

    removeQueryParam(BUILDER_STEP_QUERY_PARAM);
    this.focusStep(requestedStepId);
    return true;
  }

  private navigateToStepPage(step: SdkFlowStep) {
    const targetPath = normalizePath(step.page_path || "/");
    if (targetPath === this.currentPath()) {
      return false;
    }

    const targetUrl = new URL(targetPath, window.location.origin);
    const currentUrl = new URL(window.location.href);
    const builderSessionToken = readQueryParam(BUILDER_QUERY_PARAM).trim();
    if (builderSessionToken) {
      targetUrl.searchParams.set(BUILDER_QUERY_PARAM, builderSessionToken);
    }
    for (const queryParam of BUILDER_PERSISTED_QUERY_PARAMS) {
      const currentValue = currentUrl.searchParams.get(queryParam);
      if (currentValue) {
        targetUrl.searchParams.set(queryParam, currentValue);
      }
    }
    targetUrl.searchParams.set(BUILDER_STEP_QUERY_PARAM, String(step.id));
    window.location.assign(targetUrl.toString());
    return true;
  }

  private focusStep(
    stepId: number,
    options: { navigateToPage?: boolean } = {},
  ) {
    const step = this.getStepById(stepId);
    if (!step) {
      return;
    }

    if (options.navigateToPage && this.navigateToStepPage(step)) {
      return;
    }

    this.selectStep(step);
  }

  private selectStep(stepOrStepId: SdkFlowStep | number) {
    const step =
      typeof stepOrStepId === "number"
        ? this.getStepById(stepOrStepId)
        : stepOrStepId;
    if (!step) {
      return;
    }

    this.stopPicking();
    this.isEditorOpen = false;
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
    this.syncPreview();
    this.refreshCanvas();
    window.requestAnimationFrame(() => {
      this.refreshCanvas();
    });

    if (this.editingElement) {
      void this.ensureBuilderElementVisible(this.editingElement);
      return;
    }
  }

  private async ensureBuilderElementVisible(element: HTMLElement) {
    const didScroll = await ensureElementInViewport(element, {
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });

    if (!didScroll || !this.session) {
      return;
    }

    this.editingElement = this.getDraftAnchorElement();
    this.refreshCanvas();
  }

  private startNewHighlightStep(options: { autoPick: boolean }) {
    if (!this.getActiveFlow()) {
      return;
    }

    this.stopPicking();
    this.isEditorOpen = false;
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
    this.syncPreview();
    this.refreshCanvas();
  }

  private startNewPopupStep() {
    if (!this.getActiveFlow()) {
      return;
    }

    this.stopPicking();
    this.isEditorOpen = true;
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
    this.syncPreview();
    this.refreshCanvas();
    this.setStatus("Popup editor is open. Adjust the copy and save it.");
  }

  private syncEditor() {
    if (!this.dom) {
      return;
    }

    if (
      !this.draft ||
      !this.isEditorOpen ||
      this.shouldHideEditorWhilePicking()
    ) {
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

  private syncPreview() {
    if (!this.dom) {
      return;
    }

    if (
      !this.draft ||
      this.isEditorOpen ||
      this.shouldHideEditorWhilePicking() ||
      (this.draft.mode === "highlight" && !this.draft.selector)
    ) {
      this.dom.preview.classList.add("guidora-sdk-builder-hidden");
      return;
    }

    this.dom.preview.classList.remove("guidora-sdk-builder-hidden");
    this.dom.previewChip.textContent =
      this.draft.mode === "popup" ? "Popup preview" : "Tooltip preview";
    this.dom.previewTitle.textContent =
      this.draft.title.trim() ||
      (this.draft.mode === "popup" ? "Popup title" : "Tooltip title");
    this.dom.previewBody.textContent =
      this.draft.body.trim() ||
      (this.draft.mode === "popup"
        ? "Popup body preview appears here."
        : "Tooltip body preview appears here.");
    this.dom.previewEditButton.disabled = this.isSaving || this.isDeleting;
    this.dom.previewEditButton.textContent =
      this.draft.mode === "popup" ? "Edit popup" : "Edit step";
    this.dom.previewEditButton.setAttribute(
      "aria-label",
      this.draft.mode === "popup" ? "Edit popup" : "Edit selected step",
    );
    this.positionPreview();
  }

  private positionPreview() {
    if (!this.dom || !this.draft) {
      return;
    }

    const card = this.dom.preview;
    if (card.classList.contains("guidora-sdk-builder-hidden")) {
      return;
    }

    const width = card.offsetWidth || 280;
    const height = card.offsetHeight || 160;
    const minLeft =
      window.innerWidth <= MOBILE_BREAKPOINT ? 16 : LEFT_RAIL_WIDTH + 20;
    const maxLeft =
      window.innerWidth <= MOBILE_BREAKPOINT
        ? window.innerWidth - width - 16
        : window.innerWidth - RIGHT_RAIL_WIDTH - width - 20;
    const minTop = 16;
    const maxTop = window.innerHeight - height - 16;

    const placement = this.resolvePreviewPlacement(
      width,
      height,
      minLeft,
      maxLeft,
      minTop,
      maxTop,
    );
    card.dataset.position =
      !this.getDraftAnchorElement() || this.draft.mode === "popup"
        ? "center"
        : this.draft.position;
    card.style.left = `${placement.left}px`;
    card.style.top = `${placement.top}px`;
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
    const width = card.offsetWidth || 520;
    const height = card.offsetHeight || 420;
    const centeredLeft = clamp(
      (window.innerWidth - width) / 2,
      16,
      Math.max(16, window.innerWidth - width - 16),
    );
    const centeredTop = clamp(
      (window.innerHeight - height) / 2,
      16,
      Math.max(16, window.innerHeight - height - 16),
    );

    card.style.left = `${centeredLeft}px`;
    card.style.top = `${centeredTop}px`;
  }

  private startPicking() {
    if (!this.draft || this.draft.mode === "popup") {
      return;
    }

    this.isPicking = true;
    this.syncFlowMeta();
    this.refreshCanvas();
    this.syncEditor();
    this.syncPreview();
    this.setStatus(
      this.draft.stepId
        ? "Select a new place on the site to reposition this step."
        : "Click any element on the page to create the next step.",
    );
  }

  private stopPicking() {
    this.isPicking = false;
    this.syncFlowMeta();
    this.syncEditor();
    this.syncPreview();
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
    this.isEditorOpen = false;
    this.syncFlowMeta();
    this.syncEditor();
    this.syncPreview();
    this.refreshCanvas();
    this.setStatus(
      "Element captured. Review the preview, then open edit when you need copy changes.",
    );
  }

  private closeEditor() {
    this.stopPicking();
    this.isEditorOpen = false;
    this.syncEditor();
    this.syncPreview();
    this.refreshCanvas();
  }

  private clearStepSelection() {
    this.stopPicking();
    this.isEditorOpen = false;
    this.draft = null;
    this.editingElement = null;
    this.syncEditor();
    this.syncPreview();
    this.refreshCanvas();
  }

  private clearCanvasState() {
    this.stopPicking();
    this.stopAssistantDrag();
    this.clearStepDragState();
    this.isAssistantPreviewOpen = false;
    this.isEditorOpen = false;
    this.draft = null;
    this.editingElement = null;
    this.hoveredElement = null;
    this.hoveredStepId = null;
    this.lastPointerTarget = null;
    this.hideHighlight();
    if (this.dom) {
      this.dom.preview.classList.add("guidora-sdk-builder-hidden");
      this.dom.editor.classList.add("guidora-sdk-builder-hidden");
    }
    this.closeFlowSettings();
    this.closeThemeSettings();
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
    const activeFlow =
      response.flows.find((flow) => flow.id === response.active_flow_id) ??
      response.flow;

    this.flows = [...response.flows].sort(
      (left, right) => left.priority - right.priority || left.id - right.id,
    );
    this.flowForm = null;

    if (this.session) {
      this.session = {
        ...this.session,
        session: response.session,
        flow: activeFlow,
        next_step_order: response.next_step_order,
      };
    } else {
      this.session = {
        session: response.session,
        flow: activeFlow,
        next_step_order: response.next_step_order,
        assistant: this.assistantConfig,
      };
    }

    this.syncSessionToken(response.session.session_token);
    this.refreshUi();
  }

  private openEditorForCurrentDraft() {
    if (!this.draft) {
      return;
    }

    this.stopPicking();
    this.isEditorOpen = true;
    this.syncEditor();
    this.syncPreview();
    this.refreshCanvas();
    window.requestAnimationFrame(() => {
      this.refreshCanvas();
    });

    const editingStep = this.getDraftStep();
    if (this.editingElement && editingStep) {
      void this.ensureBuilderElementVisible(this.editingElement);
      return;
    }
  }

  private openEditorForStep(stepId: number) {
    const step = this.getStepById(stepId);
    if (!step) {
      return;
    }

    this.selectStep(step);
    this.openEditorForCurrentDraft();
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
        type: flowType,
        autoStart: true,
        triggerOncePerVisitor: true,
        aiEnabled: true,
      });
      this.applyFlowMutation(response);
      this.startNewHighlightStep({ autoPick: true });
      this.setStatus(
        `Created ${response.flow.name}. Click the first element directly on the page.`,
      );
    } catch (error) {
      this.handleError(error as Error);
      this.setStatus("The new flow could not be created.", "error");
    } finally {
      this.isCreatingFlow = false;
      this.refreshUi();
    }
  }

  private async switchFlow(
    flowId: number,
    options: { suppressStatus?: boolean } = {},
  ) {
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
      this.clearStepSelection();
      if (!options.suppressStatus) {
        this.setStatus(`Switched to ${response.flow.name}.`);
      }
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
        description: flowForm.description.trim(),
        pagePath: nextPath,
        autoStart: flowForm.autoStart,
        triggerOncePerVisitor: flowForm.triggerOncePerVisitor,
        aiEnabled: flowForm.aiEnabled,
      });
      this.applyFlowMutation(response);
      this.closeFlowSettings();
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
      this.clearStepSelection();
      this.closeFlowSettings();
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

  private async saveAssistantSettings(
    options: {
      closeSettings?: boolean;
      statusMessage?: boolean;
    } = {},
  ) {
    if (!this.session || !this.dom) {
      return;
    }

    const assistantForm = this.getAssistantForm();
    if (!assistantForm || this.isUpdatingAssistant) {
      return;
    }

    this.isUpdatingAssistant = true;
    this.syncAssistantPreview();
    try {
      const response = await this.api.builderUpdateAssistant({
        sessionToken: this.session.session.session_token,
        domain: window.location.host,
        enabled: assistantForm.enabled,
        eyebrow: assistantForm.eyebrow.trim(),
        launcherLabel: assistantForm.launcherLabel.trim(),
        launcherIconUrl: assistantForm.launcherIconUrl.trim(),
        launcherWidth: assistantForm.launcherWidth,
        title: assistantForm.title.trim(),
        subtitle: assistantForm.subtitle.trim(),
        welcomeMessage: assistantForm.welcomeMessage.trim(),
        placeholder: assistantForm.placeholder.trim(),
        submitLabel: assistantForm.submitLabel.trim(),
        loadingLabel: assistantForm.loadingLabel.trim(),
        suggestions: assistantForm.suggestions,
        position: assistantForm.position,
        offsetX: assistantForm.offsetX,
        offsetY: assistantForm.offsetY,
        accentColor: assistantForm.accentColor,
        launcherBackgroundColor: assistantForm.launcherBackgroundColor,
        launcherTextColor: assistantForm.launcherTextColor,
        panelBackgroundColor: assistantForm.panelBackgroundColor,
        panelTextColor: assistantForm.panelTextColor,
        highlightColor: assistantForm.highlightColor,
        highlightOverlayColor: assistantForm.highlightOverlayColor,
      });
      this.assistantConfig = response.assistant;
      this.assistantForm = createDefaultAssistantForm(response.assistant);
      this.syncAssistantPreview();
      if (options.closeSettings !== false) {
        this.closeThemeSettings();
      }
      if (options.statusMessage !== false) {
        this.setStatus(
          this.settingsMode === "theme"
            ? "Theme updated."
            : "AI widget updated.",
        );
      }
    } catch (error) {
      this.handleError(error as Error);
      if (options.statusMessage !== false) {
        this.setStatus(
          this.settingsMode === "theme"
            ? "The theme could not be saved."
            : "The AI widget could not be saved.",
          "error",
        );
      }
    } finally {
      this.isUpdatingAssistant = false;
      this.syncAssistantPreview();
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
      this.selectStep(response.step.id);
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
      this.clearStepSelection();
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
      removeQueryParam(BUILDER_STEP_QUERY_PARAM);
    }
  }
}
