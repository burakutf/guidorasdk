const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000/api/guide";

export function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function invariantBrowser() {
  if (!isBrowser()) {
    throw new Error("Guidora SDK can only run in a browser environment.");
  }
}

export function normalizeDomain(value?: string) {
  const raw = (value ?? (isBrowser() ? window.location.host : ""))
    .trim()
    .toLowerCase();
  if (!raw) {
    return "";
  }

  const withoutProtocol = raw.replace(/^https?:\/\//, "");
  const normalized = withoutProtocol.split("/")[0] ?? "";
  if (normalized.startsWith("127.0.0.1")) {
    return `localhost${normalized.slice("127.0.0.1".length)}`;
  }

  return normalized;
}

export function normalizePath(value?: string) {
  const path = (value ?? (isBrowser() ? window.location.pathname : "/")).trim();
  if (!path) {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

export function resolveApiUrl(baseUrl: string | undefined, endpoint: string) {
  const trimmedBase = (baseUrl ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
  const trimmedEndpoint = endpoint.replace(/^\/+/, "");
  return `${trimmedBase}/${trimmedEndpoint}`;
}

export function readQueryParam(name: string) {
  if (!isBrowser()) {
    return "";
  }

  return new URL(window.location.href).searchParams.get(name) ?? "";
}

export function removeQueryParam(name: string) {
  if (!isBrowser()) {
    return;
  }

  const url = new URL(window.location.href);
  if (!url.searchParams.has(name)) {
    return;
  }

  url.searchParams.delete(name);
  window.history.replaceState(
    window.history.state,
    document.title,
    url.toString(),
  );
}

export function escapeCssIdentifier(value: string) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`);
}

export function generateId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `guidora_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampChannel(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

export function isHexColor(value: string | undefined | null) {
  return /^#(?:[0-9a-fA-F]{6})$/.test(String(value ?? "").trim());
}

export function shiftHexColor(
  value: string | undefined | null,
  amount: number,
) {
  const normalized = String(value ?? "").trim();
  if (!isHexColor(normalized)) {
    return "#4F46E5";
  }

  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);

  const nextRed = clampChannel(red + amount);
  const nextGreen = clampChannel(green + amount);
  const nextBlue = clampChannel(blue + amount);

  return `#${nextRed.toString(16).padStart(2, "0")}${nextGreen
    .toString(16)
    .padStart(2, "0")}${nextBlue.toString(16).padStart(2, "0")}`.toUpperCase();
}

export function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function ensureElementInViewport(
  element: HTMLElement,
  options: ScrollIntoViewOptions = {
    block: "center",
    inline: "center",
    behavior: "smooth",
  },
) {
  const rect = element.getBoundingClientRect();
  const viewportPadding = 24;
  const isVisibleVertically =
    rect.top >= viewportPadding &&
    rect.bottom <= window.innerHeight - viewportPadding;
  const isVisibleHorizontally =
    rect.left >= viewportPadding &&
    rect.right <= window.innerWidth - viewportPadding;

  if (isVisibleVertically && isVisibleHorizontally) {
    return false;
  }

  element.scrollIntoView(options);
  await wait(options.behavior === "smooth" ? 260 : 32);
  return true;
}

export function noop() {}

export function observeNavigation(onNavigate: () => void) {
  if (!isBrowser()) {
    return noop;
  }

  const { history } = window;
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);
  const notify = () => window.setTimeout(onNavigate, 0);

  history.pushState = ((...args: Parameters<History["pushState"]>) => {
    const result = originalPushState(...args);
    notify();
    return result;
  }) as History["pushState"];

  history.replaceState = ((...args: Parameters<History["replaceState"]>) => {
    const result = originalReplaceState(...args);
    notify();
    return result;
  }) as History["replaceState"];

  window.addEventListener("popstate", onNavigate);
  window.addEventListener("hashchange", onNavigate);

  return () => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    window.removeEventListener("popstate", onNavigate);
    window.removeEventListener("hashchange", onNavigate);
  };
}
