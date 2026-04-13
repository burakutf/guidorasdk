const STYLE_ID = "guidora-sdk-styles";

export function injectGuidoraStyles(zIndex: number) {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    html.guidora-sdk-builder-active,
    body.guidora-sdk-builder-active {
      overflow-x: hidden;
    }

    body.guidora-sdk-builder-active {
      transition: padding 180ms ease;
    }

    .guidora-sdk-root {
      position: fixed;
      inset: 0;
      z-index: ${zIndex};
      pointer-events: none;
      font-family: "Manrope", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --guidora-accent-color: #2563EB;
      --guidora-launcher-bg: #FFFFFF;
      --guidora-launcher-text: #172033;
      --guidora-panel-bg: rgba(255, 255, 255, 0.98);
      --guidora-panel-text: #172033;
      --guidora-highlight-color: #0F766E;
      --guidora-highlight-overlay: #DCE6F4;
      --guidora-muted-text: #526079;
      --guidora-border-color: rgba(148, 163, 184, 0.58);
      --guidora-soft-surface: #F5F7FB;
      --guidora-sidebar-surface: rgba(248, 250, 252, 0.98);
      --guidora-shadow-soft: 0 14px 34px rgba(15, 23, 42, 0.08);
    }

    .guidora-sdk-hidden {
      opacity: 0;
      visibility: hidden;
    }

    .guidora-sdk-highlight {
      position: fixed;
      border-radius: 20px;
      border: 2px solid var(--guidora-highlight-color);
      box-shadow: 0 0 0 9999px color-mix(in srgb, var(--guidora-highlight-overlay) 28%, transparent);
      background: rgba(255, 255, 255, 0.22);
      transition: all 180ms ease;
      pointer-events: none;
    }

    .guidora-sdk-card {
      position: fixed;
      width: min(340px, calc(100vw - 32px));
      border-radius: 24px;
      border: 1px solid var(--guidora-border-color);
      background: var(--guidora-panel-bg);
      color: var(--guidora-panel-text);
      box-shadow: var(--guidora-shadow-soft);
      padding: 20px;
      pointer-events: auto;
      transition: transform 180ms ease, opacity 180ms ease;
    }

    .guidora-sdk-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      background: color-mix(in srgb, var(--guidora-accent-color) 10%, white);
      color: var(--guidora-accent-color);
      font-size: 12px;
      font-weight: 600;
      padding: 6px 10px;
      margin-bottom: 12px;
    }

    .guidora-sdk-title {
      margin: 0;
      font-size: 20px;
      line-height: 1.3;
      font-weight: 700;
      color: var(--guidora-panel-text);
    }

    .guidora-sdk-body {
      margin: 12px 0 0;
      font-size: 14px;
      line-height: 1.65;
      color: var(--guidora-muted-text);
    }

    .guidora-sdk-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 18px;
    }

    .guidora-sdk-step {
      font-size: 12px;
      color: var(--guidora-muted-text);
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .guidora-sdk-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .guidora-sdk-button {
      border: 0;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 600;
      line-height: 1;
      padding: 12px 16px;
      cursor: pointer;
      transition: transform 160ms ease, opacity 160ms ease, background 160ms ease;
    }

    .guidora-sdk-button:hover {
      transform: translateY(-1px);
    }

    .guidora-sdk-button-primary {
      background: var(--guidora-accent-color);
      color: #FFFFFF;
    }

    .guidora-sdk-button-secondary {
      background: var(--guidora-soft-surface);
      color: var(--guidora-panel-text);
      border: 1px solid var(--guidora-border-color);
    }

    .guidora-sdk-assistant-shell {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: ${zIndex + 1};
      width: max-content;
      pointer-events: none;
    }

    .guidora-sdk-assistant-launcher,
    .guidora-sdk-assistant-panel,
    .guidora-sdk-assistant-chip,
    .guidora-sdk-assistant-close,
    .guidora-sdk-assistant-submit {
      pointer-events: auto;
    }

    .guidora-sdk-assistant-launcher {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--guidora-border-color);
      border-radius: 999px;
      background: var(--guidora-launcher-bg);
      color: var(--guidora-launcher-text);
      font-size: 14px;
      font-weight: 700;
      line-height: 1;
      padding: 14px 18px;
      box-shadow: var(--guidora-shadow-soft);
      cursor: pointer;
    }

    .guidora-sdk-assistant-launcher-content {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      max-width: 100%;
    }

    .guidora-sdk-assistant-launcher-icon {
      width: 20px;
      height: 20px;
      border-radius: 999px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .guidora-sdk-assistant-launcher-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .guidora-sdk-assistant-launcher-textless {
      padding-inline: 14px;
    }

    .guidora-sdk-assistant-panel {
      position: absolute;
      right: 0;
      left: auto;
      bottom: calc(100% + 12px);
      width: min(380px, calc(100vw - 24px));
      border-radius: 28px;
      border: 1px solid var(--guidora-border-color);
      background: color-mix(in srgb, var(--guidora-panel-bg) 98%, transparent);
      backdrop-filter: blur(12px);
      box-shadow: 0 24px 64px rgba(23, 32, 51, 0.12);
      padding: 18px;
      display: grid;
      gap: 14px;
    }

    .guidora-sdk-assistant-panel.guidora-sdk-hidden {
      display: none;
    }

    .guidora-sdk-assistant-shell[data-position="bottom-left"] .guidora-sdk-assistant-panel,
    .guidora-sdk-assistant-shell[data-position="top-left"] .guidora-sdk-assistant-panel,
    .guidora-sdk-assistant-shell[data-position="custom-bottom-left"] .guidora-sdk-assistant-panel,
    .guidora-sdk-assistant-shell[data-position="custom-top-left"] .guidora-sdk-assistant-panel {
      left: 0;
      right: auto;
    }

    .guidora-sdk-assistant-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .guidora-sdk-assistant-header-copy {
      display: grid;
      gap: 6px;
    }

    .guidora-sdk-assistant-eyebrow {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--guidora-accent-color);
    }

    .guidora-sdk-assistant-title {
      margin: 0;
      font-size: 22px;
      line-height: 1.15;
      color: var(--guidora-panel-text);
    }

    .guidora-sdk-assistant-subtitle {
      margin: 0;
      font-size: 13px;
      line-height: 1.55;
      color: var(--guidora-muted-text);
    }

    .guidora-sdk-assistant-close {
      border: 1px solid var(--guidora-border-color);
      background: var(--guidora-soft-surface);
      color: var(--guidora-panel-text);
      border-radius: 999px;
      padding: 10px 12px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }

    .guidora-sdk-assistant-transcript {
      display: grid;
      gap: 10px;
      max-height: min(42vh, 380px);
      overflow-y: auto;
      padding-right: 4px;
    }

    .guidora-sdk-assistant-message {
      display: grid;
      gap: 8px;
      border-radius: 20px;
      padding: 12px 14px;
      font-size: 13px;
      line-height: 1.55;
    }

    .guidora-sdk-assistant-message-assistant {
      background: var(--guidora-soft-surface);
      color: var(--guidora-panel-text);
      border: 1px solid var(--guidora-border-color);
    }

    .guidora-sdk-assistant-message-user {
      background: color-mix(in srgb, var(--guidora-accent-color) 10%, white);
      color: var(--guidora-panel-text);
      border: 1px solid color-mix(in srgb, var(--guidora-accent-color) 18%, transparent);
    }

    .guidora-sdk-assistant-message[data-tone="success"] {
      background: color-mix(in srgb, var(--guidora-highlight-color) 10%, white);
      border-color: color-mix(in srgb, var(--guidora-highlight-color) 22%, transparent);
    }

    .guidora-sdk-assistant-message[data-tone="warning"] {
      background: rgba(245, 158, 11, 0.14);
      border-color: rgba(245, 158, 11, 0.24);
    }

    .guidora-sdk-assistant-draft {
      display: grid;
      gap: 4px;
      padding-top: 6px;
      border-top: 1px solid var(--guidora-border-color);
      color: #42506A;
    }

    .guidora-sdk-assistant-draft strong {
      font-size: 12px;
      color: var(--guidora-panel-text);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .guidora-sdk-assistant-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .guidora-sdk-assistant-chip {
      border: 1px solid var(--guidora-border-color);
      background: #FFFFFF;
      color: var(--guidora-panel-text);
      border-radius: 999px;
      padding: 9px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .guidora-sdk-assistant-form {
      display: grid;
      gap: 10px;
    }

    .guidora-sdk-assistant-input {
      width: 100%;
      resize: vertical;
      min-height: 86px;
      border-radius: 18px;
      border: 1px solid var(--guidora-border-color);
      background: var(--guidora-panel-bg);
      color: var(--guidora-panel-text);
      padding: 12px 14px;
      font: inherit;
    }

    .guidora-sdk-assistant-input:focus {
      outline: none;
      border-color: color-mix(in srgb, var(--guidora-accent-color) 30%, white);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--guidora-accent-color) 10%, white);
    }

    .guidora-sdk-assistant-submit {
      justify-self: end;
    }

    .guidora-sdk-assistant-submit-empty {
      min-width: 42px;
    }

    .guidora-sdk-assistant-status {
      font-size: 12px;
      font-weight: 600;
      color: var(--guidora-muted-text);
    }

    @media (max-width: 720px) {
      .guidora-sdk-assistant-shell {
        right: 12px;
        left: 12px;
        bottom: 12px;
        align-items: stretch;
      }

      .guidora-sdk-assistant-launcher {
        align-self: flex-end;
      }

      .guidora-sdk-assistant-panel {
        width: 100%;
      }
    }

    .guidora-sdk-builder-root {
      position: fixed;
      inset: 0;
      z-index: ${zIndex + 2};
      pointer-events: none;
      font-family: "Manrope", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .guidora-sdk-builder-hidden {
      opacity: 0;
      visibility: hidden;
    }

    .guidora-sdk-builder-highlight {
      position: fixed;
      border-radius: 18px;
      background: rgba(37, 99, 235, 0.06);
      border: 2px solid rgba(37, 99, 235, 0.28);
      box-shadow: 0 18px 42px rgba(23, 32, 51, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.56);
      pointer-events: none;
      transition: all 120ms ease;
    }

    .guidora-sdk-builder-highlight-hover {
      border-color: rgba(37, 99, 235, 0.64);
      background: rgba(37, 99, 235, 0.08);
      box-shadow: 0 18px 42px rgba(23, 32, 51, 0.14), inset 0 0 0 1px rgba(255, 255, 255, 0.62);
    }

    .guidora-sdk-builder-highlight-step {
      border-color: rgba(37, 99, 235, 0.88);
      background: rgba(37, 99, 235, 0.12);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14), 0 20px 44px rgba(15, 23, 42, 0.18);
    }

    .guidora-sdk-builder-highlight-pick {
      border-color: rgba(15, 118, 110, 0.92);
      background: rgba(15, 118, 110, 0.12);
      box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.16), 0 20px 44px rgba(15, 23, 42, 0.18);
    }

    .guidora-sdk-builder-highlight-edit {
      border-color: rgba(29, 78, 216, 0.96);
      background: rgba(29, 78, 216, 0.14);
      box-shadow: 0 0 0 4px rgba(29, 78, 216, 0.16), 0 24px 60px rgba(29, 78, 216, 0.2);
    }

    .guidora-sdk-builder-highlight-badge {
      position: fixed;
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      background: #FFFFFF;
      color: #172033;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 8px 10px;
      border: 1px solid var(--guidora-border-color);
      pointer-events: none;
      white-space: nowrap;
      box-shadow: var(--guidora-shadow-soft);
    }

    .guidora-sdk-builder-rail {
      position: fixed;
      top: 0;
      bottom: 0;
      width: 248px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 18px 16px 16px;
      background: var(--guidora-sidebar-surface);
      backdrop-filter: blur(10px);
      pointer-events: auto;
      overflow: hidden;
      min-height: 0;
    }

    .guidora-sdk-builder-rail-left {
      left: 0;
      border-right: 1px solid var(--guidora-border-color);
      box-shadow: 1px 0 0 rgba(255, 255, 255, 0.7), 10px 0 24px rgba(15, 23, 42, 0.04);
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .guidora-sdk-builder-rail-right {
      right: 0;
      width: 306px;
      border-left: 1px solid var(--guidora-border-color);
      box-shadow: -1px 0 0 rgba(255, 255, 255, 0.7), -10px 0 24px rgba(15, 23, 42, 0.04);
    }

    .guidora-sdk-builder-rail-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .guidora-sdk-builder-eyebrow {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #66758B;
    }

    .guidora-sdk-builder-rail-title {
      margin: 0;
      font-size: 18px;
      line-height: 1.2;
      font-weight: 700;
      color: #172033;
    }

    .guidora-sdk-builder-rail-copy {
      margin: 0;
      font-size: 12px;
      line-height: 1.45;
      color: var(--guidora-muted-text);
    }

    .guidora-sdk-builder-flow-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .guidora-sdk-builder-flow-editor {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 12px;
      border-radius: 16px;
      border: 1px solid var(--guidora-border-color);
      background: rgba(255, 255, 255, 0.9);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
    }

    .guidora-sdk-builder-flow-editor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .guidora-sdk-builder-flow-editor-title {
      font-size: 13px;
      font-weight: 700;
      line-height: 1.4;
      color: #172033;
    }

    .guidora-sdk-builder-flow-status {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: rgba(23, 32, 51, 0.08);
      color: #25324A;
      white-space: nowrap;
    }

    .guidora-sdk-builder-flow-status-live {
      background: rgba(32, 169, 100, 0.12);
      color: #14804A;
    }

    .guidora-sdk-builder-flow-status-draft {
      background: rgba(23, 32, 51, 0.08);
      color: #25324A;
    }

    .guidora-sdk-builder-flow-editor-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .guidora-sdk-builder-flow-summary {
      border-radius: 12px;
      background: #F8FAFC;
      border: 1px solid rgba(148, 163, 184, 0.38);
      color: #42506A;
      font-size: 11px;
      font-weight: 700;
      line-height: 1.4;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 10px 12px;
    }

    .guidora-sdk-builder-flow-editor-actions .guidora-sdk-builder-button {
      flex: 1;
    }

    .guidora-sdk-builder-checkbox-field {
      display: flex;
      flex-direction: column;
      border-radius: 12px;
      border: 1px solid var(--guidora-border-color);
      background: rgba(255, 255, 255, 0.88);
      padding: 8px 10px;
      min-height: 38px;
      justify-content: center;
      transition: opacity 160ms ease, background 160ms ease;
    }

    .guidora-sdk-builder-checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .guidora-sdk-builder-checkbox-input {
      width: 14px;
      height: 14px;
      margin: 0;
      accent-color: #2563EB;
      flex-shrink: 0;
    }

    .guidora-sdk-builder-checkbox-title {
      font-size: 11px;
      font-weight: 700;
      line-height: 1.3;
      color: #172033;
      flex: 1;
    }

    .guidora-sdk-builder-checkbox-field:has(.guidora-sdk-builder-checkbox-input:disabled) {
      opacity: 0.58;
      background: rgba(248, 250, 252, 0.96);
    }

    .guidora-sdk-builder-button {
      border: 0;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
      padding: 10px 12px;
      cursor: pointer;
      transition: transform 160ms ease, opacity 160ms ease, background 160ms ease, border-color 160ms ease;
    }

    .guidora-sdk-builder-button:hover {
      transform: translateY(-1px);
    }

    .guidora-sdk-builder-button:disabled,
    .guidora-sdk-builder-action-card:disabled,
    .guidora-sdk-builder-flow-card:disabled {
      opacity: 0.55;
      cursor: wait;
      transform: none;
    }

    .guidora-sdk-builder-button-primary {
      background: var(--guidora-accent-color);
      color: #FFFFFF;
    }

    .guidora-sdk-builder-button-secondary {
      background: rgba(255, 255, 255, 0.92);
      color: #25324A;
      border: 1px solid var(--guidora-border-color);
    }

    .guidora-sdk-builder-icon-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      height: 32px;
      padding: 0 10px;
      border-radius: 10px;
      border: 1px solid var(--guidora-border-color);
      background: rgba(255, 255, 255, 0.92);
      color: #42506A;
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
      cursor: pointer;
      transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
      white-space: nowrap;
    }

    .guidora-sdk-builder-icon-button:hover {
      background: #F8FAFC;
      border-color: rgba(37, 99, 235, 0.22);
      color: #1D4ED8;
    }

    .guidora-sdk-builder-button-danger {
      background: #FFF1F2;
      color: #B42318;
      border: 1px solid #FECACA;
    }

    .guidora-sdk-builder-flow-list,
    .guidora-sdk-builder-step-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 0;
      overflow-y: auto;
      padding-right: 4px;
    }

    .guidora-sdk-builder-flow-list {
      flex: 0 0 auto;
      overflow: visible;
    }

    .guidora-sdk-builder-flow-card,
    .guidora-sdk-builder-step-card {
      width: 100%;
      appearance: none;
      border: 1px solid var(--guidora-border-color);
      background: rgba(255, 255, 255, 0.92);
      color: #172033;
      text-align: left;
      cursor: pointer;
    }

    .guidora-sdk-builder-flow-card {
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
    }

    .guidora-sdk-builder-flow-card:hover,
    .guidora-sdk-builder-step-card:hover {
      border-color: rgba(23, 32, 51, 0.68);
      box-shadow: none;
      transform: none;
    }

    .guidora-sdk-builder-flow-card-active {
      background: #F8FAFC;
      border-color: rgba(37, 99, 235, 0.34);
      color: #0F172A;
      box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.08);
    }

    .guidora-sdk-builder-flow-card-title {
      font-size: 15px;
      font-weight: 700;
      line-height: 1.35;
    }

    .guidora-sdk-builder-flow-card-meta {
      font-size: 12px;
      line-height: 1.5;
      opacity: 0.78;
    }

    .guidora-sdk-builder-active-flow-name {
      font-size: 18px;
      line-height: 1.2;
      font-weight: 700;
      color: #172033;
    }

    .guidora-sdk-builder-active-flow-meta {
      font-size: 12px;
      line-height: 1.45;
      color: var(--guidora-muted-text);
    }

    .guidora-sdk-builder-action-deck {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 8px;
    }

    .guidora-sdk-builder-action-card {
      border: 1px solid var(--guidora-border-color);
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: rgba(255, 255, 255, 0.92);
      transition: border-color 160ms ease, background 160ms ease;
    }

    .guidora-sdk-builder-action-card-active {
      border-color: rgba(37, 99, 235, 0.34);
      background: #F8FAFC;
      box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.08);
    }

    .guidora-sdk-builder-action-card-active .guidora-sdk-builder-action-title,
    .guidora-sdk-builder-action-card-active .guidora-sdk-builder-action-copy {
      color: #172033;
    }

    .guidora-sdk-builder-action-title {
      font-size: 13px;
      font-weight: 700;
      line-height: 1.4;
      color: #172033;
    }

    .guidora-sdk-builder-action-copy {
      font-size: 12px;
      line-height: 1.55;
      color: var(--guidora-muted-text);
    }

    .guidora-sdk-builder-step-note {
      border-radius: 12px;
      border: 1px solid var(--guidora-border-color);
      background: #F8FAFC;
      font-size: 12px;
      font-weight: 700;
      line-height: 1.55;
      color: #25324A;
      padding: 10px 12px;
    }

    .guidora-sdk-builder-step-list {
      flex: 1;
    }

    .guidora-sdk-builder-step-card {
      position: relative;
      overflow: hidden;
      border-radius: 12px;
      padding: 11px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: border-color 160ms ease, background 160ms ease;
    }

    .guidora-sdk-builder-step-card-active {
      border-color: rgba(37, 99, 235, 0.34);
      background: #F8FAFC;
      box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.08);
    }

    .guidora-sdk-builder-step-card-hovered {
      border-color: rgba(37, 99, 235, 0.52);
      background: #F8FAFC;
      box-shadow: none;
    }

    .guidora-sdk-builder-step-card-offpage {
      background: #FBFCFE;
    }

    .guidora-sdk-builder-step-card-dragging {
      opacity: 0.5;
    }

    .guidora-sdk-builder-step-card-drop {
      border-color: rgba(32, 169, 100, 0.55);
      box-shadow: 0 0 0 2px rgba(32, 169, 100, 0.12);
    }

    .guidora-sdk-builder-step-row-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .guidora-sdk-builder-step-row-meta {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      flex-wrap: wrap;
    }

    .guidora-sdk-builder-step-order {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 999px;
      background: rgba(23, 32, 51, 0.08);
      color: #172033;
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
      flex-shrink: 0;
    }

    .guidora-sdk-builder-step-card-active .guidora-sdk-builder-step-order {
      background: #111827;
      color: #F8FAFC;
    }

    .guidora-sdk-builder-step-path {
      font-size: 11px;
      font-weight: 700;
      line-height: 1.4;
      color: #4B5563;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .guidora-sdk-builder-step-chip {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 4px 8px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .guidora-sdk-builder-step-chip-active {
      background: rgba(37, 99, 235, 0.12);
      color: #1D4ED8;
    }

    .guidora-sdk-builder-step-chip-hovered {
      background: rgba(17, 24, 39, 0.08);
      color: #111827;
    }

    .guidora-sdk-builder-step-row-title {
      font-size: 13px;
      font-weight: 700;
      line-height: 1.45;
      color: #172033;
    }

    .guidora-sdk-builder-step-card-active .guidora-sdk-builder-step-row-title {
      color: #0F172A;
    }

    .guidora-sdk-builder-empty-state {
      border-radius: 12px;
      border: 1px dashed var(--guidora-border-color);
      background: #FBFCFE;
      color: #6B7280;
      font-size: 13px;
      line-height: 1.55;
      padding: 16px;
    }

    .guidora-sdk-builder-status {
      border-radius: 12px;
      background: #F8FAFC;
      border: 1px solid rgba(148, 163, 184, 0.38);
      color: #25324A;
      font-size: 11px;
      font-weight: 700;
      line-height: 1.4;
      padding: 8px 10px;
      margin-top: auto;
    }

    .guidora-sdk-builder-status-error {
      background: #FFF1F2;
      color: #B42318;
    }

    .guidora-sdk-builder-editor {
      position: fixed;
      width: min(360px, calc(100vw - 32px));
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 18px;
      border-radius: 20px;
      border: 1px solid rgba(148, 163, 184, 0.62);
      background: rgba(255, 255, 255, 0.99);
      color: #172033;
      box-shadow: 0 24px 64px rgba(23, 32, 51, 0.14);
      backdrop-filter: blur(12px);
      pointer-events: auto;
    }

    .guidora-sdk-builder-preview {
      position: fixed;
      width: min(280px, calc(100vw - 32px));
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
      border-radius: 18px;
      border: 1px solid rgba(37, 99, 235, 0.28);
      background: rgba(255, 255, 255, 0.98);
      color: #172033;
      box-shadow: 0 20px 48px rgba(23, 32, 51, 0.12);
      pointer-events: none;
    }

    .guidora-sdk-builder-preview-chip {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      border-radius: 999px;
      background: rgba(37, 99, 235, 0.1);
      color: #1D4ED8;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 6px 9px;
    }

    .guidora-sdk-builder-preview-title {
      font-size: 16px;
      font-weight: 700;
      line-height: 1.35;
      color: #172033;
    }

    .guidora-sdk-builder-preview-body {
      font-size: 13px;
      line-height: 1.6;
      color: var(--guidora-muted-text);
    }

    .guidora-sdk-builder-editor-chip {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      border-radius: 999px;
      background: rgba(37, 99, 235, 0.1);
      color: #1D4ED8;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 7px 10px;
    }

    .guidora-sdk-builder-editor-heading {
      font-size: 20px;
      line-height: 1.2;
      font-weight: 700;
      color: #172033;
    }

    .guidora-sdk-builder-editor-meta {
      font-size: 12px;
      line-height: 1.55;
      color: var(--guidora-muted-text);
      word-break: break-word;
    }

    .guidora-sdk-builder-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .guidora-sdk-builder-field-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #66758B;
    }

    .guidora-sdk-builder-input,
    .guidora-sdk-builder-textarea,
    .guidora-sdk-builder-select {
      width: 100%;
      box-sizing: border-box;
      border-radius: 16px;
      border: 1px solid rgba(148, 163, 184, 0.7);
      background: #FFFFFF;
      color: #172033;
      font-size: 13px;
      line-height: 1.5;
      padding: 11px 12px;
      box-shadow: inset 0 1px 0 rgba(15, 23, 42, 0.03);
      outline: none;
    }

    .guidora-sdk-builder-input:focus,
    .guidora-sdk-builder-textarea:focus,
    .guidora-sdk-builder-select:focus {
      border-color: rgba(37, 99, 235, 0.7);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }

    .guidora-sdk-builder-textarea {
      min-height: 92px;
      resize: vertical;
    }

    .guidora-sdk-builder-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .guidora-sdk-builder-editor-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .guidora-sdk-builder-editor-footer-group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .guidora-sdk-builder-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.24);
      backdrop-filter: blur(6px);
      pointer-events: auto;
      z-index: ${zIndex + 4};
    }

    .guidora-sdk-builder-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(560px, calc(100vw - 32px));
      max-height: calc(100vh - 48px);
      overflow: auto;
      pointer-events: auto;
      z-index: ${zIndex + 5};
    }

    .guidora-sdk-builder-theme-modal {
      width: min(720px, calc(100vw - 32px));
    }

    .guidora-sdk-builder-modal-close {
      margin-left: auto;
    }

    @media (max-width: 1100px) {
      body.guidora-sdk-builder-active {
        padding-left: 0 !important;
        padding-right: 0 !important;
      }

      .guidora-sdk-builder-rail {
        width: auto;
        left: 0;
        right: 0;
        height: auto;
        max-height: 42vh;
      }

      .guidora-sdk-builder-rail-left {
        top: 0;
        bottom: auto;
        border-right: 0;
        border-bottom: 1px solid rgba(215, 220, 229, 0.92);
        box-shadow: none;
      }

      .guidora-sdk-builder-rail-right {
        top: auto;
        bottom: 0;
        border-left: 0;
        border-top: 1px solid rgba(215, 220, 229, 0.92);
        box-shadow: none;
      }

      .guidora-sdk-builder-flow-list,
      .guidora-sdk-builder-step-list {
        max-height: 18vh;
      }

      .guidora-sdk-builder-editor {
        width: min(360px, calc(100vw - 24px));
      }

      .guidora-sdk-builder-preview {
        width: min(280px, calc(100vw - 24px));
      }

      .guidora-sdk-builder-modal,
      .guidora-sdk-builder-theme-modal {
        width: min(680px, calc(100vw - 24px));
        max-height: calc(100vh - 24px);
      }
    }

    @media (max-width: 720px) {
      .guidora-sdk-builder-flow-actions,
      .guidora-sdk-builder-action-deck,
      .guidora-sdk-builder-grid {
        grid-template-columns: minmax(0, 1fr);
      }

      .guidora-sdk-builder-rail {
        padding: 16px 14px 14px;
      }

      .guidora-sdk-builder-rail-title,
      .guidora-sdk-builder-active-flow-name {
        font-size: 17px;
      }

      .guidora-sdk-builder-editor-footer {
        flex-direction: column;
        align-items: stretch;
      }

      .guidora-sdk-builder-editor-footer-group {
        width: 100%;
      }

      .guidora-sdk-builder-editor-footer-group .guidora-sdk-builder-button {
        flex: 1;
      }

      .guidora-sdk-builder-modal,
      .guidora-sdk-builder-theme-modal {
        top: auto;
        left: 12px;
        right: 12px;
        bottom: 12px;
        width: auto;
        max-height: min(82vh, calc(100vh - 24px));
        transform: none;
      }
    }

    .guidora-sdk-root,
    .guidora-sdk-assistant-shell,
    .guidora-sdk-builder-root {
      color-scheme: light;
      font-family: "Inter", "Manrope", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --guidora-accent-color: #3525CD;
      --guidora-accent-strong: #4F46E5;
      --guidora-surface-base: #FCF8FF;
      --guidora-surface-soft: rgba(245, 242, 255, 0.94);
      --guidora-surface-raised: rgba(255, 255, 255, 0.94);
      --guidora-surface-strong: rgba(240, 236, 249, 0.96);
      --guidora-border-color: rgba(199, 196, 216, 0.62);
      --guidora-border-soft: rgba(199, 196, 216, 0.28);
      --guidora-muted-text: #58579B;
      --guidora-panel-text: #1B1B24;
      --guidora-shadow-soft: 0 24px 72px rgba(53, 37, 205, 0.08);
      --guidora-shadow-strong: 0 28px 96px rgba(53, 37, 205, 0.14);
    }

    .guidora-sdk-highlight {
      border-radius: 24px;
      border: 2px solid rgba(79, 70, 229, 0.58);
      background: rgba(79, 70, 229, 0.08);
      box-shadow:
        0 0 0 9999px rgba(252, 248, 255, 0.54),
        0 22px 60px rgba(53, 37, 205, 0.12);
    }

    .guidora-sdk-card {
      position: fixed;
      width: min(320px, calc(100vw - 28px));
      border-radius: 22px;
      border: 1px solid rgba(255, 255, 255, 0.22);
      background: linear-gradient(135deg, var(--guidora-accent-color) 0%, var(--guidora-accent-strong) 100%);
      color: #F8F7FF;
      box-shadow: var(--guidora-shadow-strong);
      padding: 18px 18px 16px;
      overflow: visible;
    }

    .guidora-sdk-card::after {
      content: "";
      position: absolute;
      width: 18px;
      height: 18px;
      background: var(--guidora-accent-strong);
      border-left: 1px solid rgba(255, 255, 255, 0.18);
      border-top: 1px solid rgba(255, 255, 255, 0.18);
      transform: rotate(45deg);
      opacity: 0;
    }

    .guidora-sdk-card[data-position="bottom"]::after {
      top: -9px;
      left: 32px;
      opacity: 1;
    }

    .guidora-sdk-card[data-position="top"]::after {
      bottom: -9px;
      left: 32px;
      opacity: 1;
      transform: rotate(225deg);
    }

    .guidora-sdk-card[data-position="right"]::after {
      left: -9px;
      top: 28px;
      opacity: 1;
      transform: rotate(315deg);
    }

    .guidora-sdk-card[data-position="left"]::after {
      right: -9px;
      top: 28px;
      opacity: 1;
      transform: rotate(135deg);
    }

    .guidora-sdk-badge {
      background: rgba(255, 255, 255, 0.16);
      color: #FFFFFF;
      border: 1px solid rgba(255, 255, 255, 0.18);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 7px 10px;
      margin-bottom: 14px;
    }

    .guidora-sdk-title {
      font-size: 18px;
      line-height: 1.25;
      color: #FFFFFF;
      letter-spacing: -0.02em;
    }

    .guidora-sdk-body {
      margin-top: 10px;
      color: rgba(242, 239, 255, 0.84);
      font-size: 13px;
      line-height: 1.6;
    }

    .guidora-sdk-footer {
      margin-top: 18px;
      align-items: flex-end;
    }

    .guidora-sdk-step {
      color: rgba(255, 255, 255, 0.66);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .guidora-sdk-actions {
      gap: 8px;
    }

    .guidora-sdk-button {
      border-radius: 12px;
      padding: 11px 14px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.02em;
      box-shadow: none;
    }

    .guidora-sdk-button-primary {
      background: #FFFFFF;
      color: #3525CD;
    }

    .guidora-sdk-button-secondary {
      background: rgba(255, 255, 255, 0.14);
      color: #FFFFFF;
      border: 1px solid rgba(255, 255, 255, 0.18);
    }

    .guidora-sdk-assistant-shell {
      right: 18px;
      bottom: 18px;
      gap: 14px;
    }

    .guidora-sdk-assistant-launcher {
      border: 0;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--guidora-accent-color) 0%, var(--guidora-accent-strong) 100%);
      color: #FFFFFF;
      padding: 15px 18px;
      font-size: 13px;
      font-weight: 800;
      box-shadow: var(--guidora-shadow-strong);
    }

    .guidora-sdk-assistant-panel {
      width: min(390px, calc(100vw - 22px));
      border-radius: 28px;
      border: 1px solid rgba(199, 196, 216, 0.48);
      background: linear-gradient(180deg, rgba(252, 248, 255, 0.96), rgba(245, 242, 255, 0.94));
      box-shadow: 0 24px 80px rgba(53, 37, 205, 0.12);
      backdrop-filter: blur(20px);
      padding: 18px;
      gap: 16px;
    }

    .guidora-sdk-assistant-eyebrow {
      color: var(--guidora-muted-text);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.16em;
    }

    .guidora-sdk-assistant-title {
      font-size: 22px;
      line-height: 1.08;
      letter-spacing: -0.03em;
      color: var(--guidora-panel-text);
    }

    .guidora-sdk-assistant-subtitle {
      color: var(--guidora-muted-text);
      font-size: 13px;
      line-height: 1.6;
    }

    .guidora-sdk-assistant-close {
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.82);
      border: 1px solid rgba(199, 196, 216, 0.62);
      color: var(--guidora-panel-text);
      padding: 10px 12px;
    }

    .guidora-sdk-assistant-message {
      border-radius: 20px;
      border: 1px solid rgba(199, 196, 216, 0.42);
      background: rgba(255, 255, 255, 0.78);
      color: var(--guidora-panel-text);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.54);
    }

    .guidora-sdk-assistant-message-user {
      background: rgba(79, 70, 229, 0.1);
      border-color: rgba(79, 70, 229, 0.16);
    }

    .guidora-sdk-assistant-message[data-tone="success"] {
      background: rgba(79, 70, 229, 0.08);
      border-color: rgba(79, 70, 229, 0.14);
    }

    .guidora-sdk-assistant-message[data-tone="warning"] {
      background: rgba(255, 218, 214, 0.72);
      border-color: rgba(186, 26, 26, 0.16);
    }

    .guidora-sdk-assistant-draft {
      border-top: 1px solid rgba(199, 196, 216, 0.42);
      color: var(--guidora-muted-text);
    }

    .guidora-sdk-assistant-draft strong {
      color: var(--guidora-panel-text);
    }

    .guidora-sdk-assistant-chip {
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(199, 196, 216, 0.62);
      color: var(--guidora-panel-text);
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      padding: 9px 12px;
    }

    .guidora-sdk-assistant-input {
      min-height: 92px;
      border-radius: 20px;
      border: 1px solid rgba(199, 196, 216, 0.72);
      background: rgba(255, 255, 255, 0.88);
      color: var(--guidora-panel-text);
      padding: 13px 14px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
    }

    .guidora-sdk-assistant-input::placeholder {
      color: var(--guidora-muted-text);
    }

    .guidora-sdk-assistant-input:focus {
      border-color: rgba(79, 70, 229, 0.42);
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.12);
    }

    .guidora-sdk-assistant-status {
      border-radius: 16px;
      background: rgba(79, 70, 229, 0.08);
      border: 1px solid rgba(79, 70, 229, 0.12);
      color: var(--guidora-muted-text);
      font-size: 12px;
      line-height: 1.55;
      padding: 10px 12px;
    }

    .guidora-sdk-builder-highlight {
      border-radius: 24px;
      background: rgba(79, 70, 229, 0.08);
      border: 2px solid rgba(79, 70, 229, 0.38);
      box-shadow:
        0 0 0 9999px rgba(252, 248, 255, 0.48),
        0 22px 72px rgba(53, 37, 205, 0.1);
    }

    .guidora-sdk-builder-highlight-hover {
      border-color: rgba(79, 70, 229, 0.54);
      background: rgba(79, 70, 229, 0.1);
    }

    .guidora-sdk-builder-highlight-step,
    .guidora-sdk-builder-highlight-edit {
      border-color: rgba(53, 37, 205, 0.76);
      background: rgba(53, 37, 205, 0.12);
      box-shadow:
        0 0 0 4px rgba(79, 70, 229, 0.14),
        0 26px 80px rgba(53, 37, 205, 0.16);
    }

    .guidora-sdk-builder-highlight-pick {
      border-color: rgba(88, 87, 155, 0.92);
      background: rgba(88, 87, 155, 0.14);
      box-shadow:
        0 0 0 4px rgba(88, 87, 155, 0.14),
        0 26px 80px rgba(88, 87, 155, 0.14);
    }

    .guidora-sdk-builder-highlight-badge {
      background: rgba(255, 255, 255, 0.96);
      color: #3525CD;
      border: 1px solid rgba(199, 196, 216, 0.7);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      box-shadow: 0 16px 38px rgba(53, 37, 205, 0.12);
    }

    .guidora-sdk-builder-rail {
      gap: 16px;
      padding: 22px 16px 16px;
      background: linear-gradient(180deg, rgba(245, 242, 255, 0.96), rgba(252, 248, 255, 0.94));
      border-color: rgba(199, 196, 216, 0.52);
      backdrop-filter: blur(24px);
    }

    .guidora-sdk-builder-rail-left {
      box-shadow: 18px 0 60px rgba(53, 37, 205, 0.06);
    }

    .guidora-sdk-builder-rail-right {
      box-shadow: -18px 0 60px rgba(53, 37, 205, 0.06);
    }

    .guidora-sdk-builder-rail-header {
      gap: 6px;
    }

    .guidora-sdk-builder-eyebrow {
      color: #777587;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.16em;
    }

    .guidora-sdk-builder-rail-title,
    .guidora-sdk-builder-active-flow-name {
      font-size: 21px;
      line-height: 1.04;
      letter-spacing: -0.03em;
      color: #1B1B24;
    }

    .guidora-sdk-builder-rail-copy,
    .guidora-sdk-builder-active-flow-meta {
      color: #58579B;
      font-size: 12px;
      line-height: 1.6;
    }

    .guidora-sdk-builder-flow-actions {
      gap: 10px;
    }

    .guidora-sdk-builder-flow-editor,
    .guidora-sdk-builder-flow-card,
    .guidora-sdk-builder-action-card,
    .guidora-sdk-builder-step-note,
    .guidora-sdk-builder-status,
    .guidora-sdk-builder-empty-state {
      border-radius: 20px;
      border: 1px solid rgba(199, 196, 216, 0.52);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(245, 242, 255, 0.82));
      box-shadow: 0 18px 48px rgba(53, 37, 205, 0.06);
    }

    .guidora-sdk-builder-flow-editor {
      padding: 14px;
      gap: 12px;
    }

    .guidora-sdk-builder-flow-editor-title {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #4F46E5;
    }

    .guidora-sdk-builder-flow-status {
      background: rgba(79, 70, 229, 0.08);
      color: #4F46E5;
      border: 1px solid rgba(79, 70, 229, 0.12);
    }

    .guidora-sdk-builder-flow-status-live {
      background: rgba(79, 70, 229, 0.12);
      color: #3525CD;
    }

    .guidora-sdk-builder-flow-status-draft {
      background: rgba(88, 87, 155, 0.1);
      color: #58579B;
    }

    .guidora-sdk-builder-flow-summary {
      border-radius: 16px;
      background: rgba(79, 70, 229, 0.06);
      border: 1px solid rgba(79, 70, 229, 0.1);
      color: #58579B;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.1em;
    }

    .guidora-sdk-builder-checkbox-field {
      border-radius: 16px;
      border-color: rgba(199, 196, 216, 0.5);
      background: rgba(255, 255, 255, 0.78);
      padding: 10px 12px;
    }

    .guidora-sdk-builder-checkbox-title {
      font-size: 12px;
      font-weight: 700;
      color: #1B1B24;
    }

    .guidora-sdk-builder-checkbox-input {
      accent-color: #4F46E5;
    }

    .guidora-sdk-builder-button {
      border-radius: 14px;
      padding: 12px 14px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.02em;
    }

    .guidora-sdk-builder-button-primary {
      background: linear-gradient(135deg, var(--guidora-accent-color) 0%, var(--guidora-accent-strong) 100%);
      color: #FFFFFF;
      box-shadow: 0 14px 34px rgba(79, 70, 229, 0.22);
    }

    .guidora-sdk-builder-button-secondary {
      background: rgba(255, 255, 255, 0.88);
      color: #1B1B24;
      border: 1px solid rgba(199, 196, 216, 0.68);
    }

    .guidora-sdk-builder-button-danger {
      background: rgba(255, 218, 214, 0.92);
      color: #93000A;
      border: 1px solid rgba(186, 26, 26, 0.12);
    }

    .guidora-sdk-builder-flow-list,
    .guidora-sdk-builder-step-list {
      gap: 12px;
      padding-right: 2px;
    }

    .guidora-sdk-builder-flow-card {
      padding: 14px;
      gap: 8px;
      transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
    }

    .guidora-sdk-builder-flow-card:hover,
    .guidora-sdk-builder-action-card:hover,
    .guidora-sdk-builder-step-card:hover {
      transform: translateY(-1px);
      border-color: rgba(79, 70, 229, 0.34);
      box-shadow: 0 20px 52px rgba(53, 37, 205, 0.1);
    }

    .guidora-sdk-builder-flow-card-active,
    .guidora-sdk-builder-action-card-active,
    .guidora-sdk-builder-step-card-active {
      border-color: rgba(79, 70, 229, 0.34);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(233, 229, 255, 0.92));
      box-shadow:
        inset 0 0 0 1px rgba(79, 70, 229, 0.08),
        0 22px 56px rgba(53, 37, 205, 0.1);
    }

    .guidora-sdk-builder-flow-card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
    }

    .guidora-sdk-builder-flow-card-title {
      font-size: 14px;
      line-height: 1.35;
      color: #1B1B24;
    }

    .guidora-sdk-builder-flow-card-meta {
      color: #58579B;
      font-size: 11px;
      line-height: 1.55;
    }

    .guidora-sdk-builder-flow-card-path {
      color: #4F46E5;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .guidora-sdk-builder-flow-card-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      border-radius: 999px;
      padding: 5px 8px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: rgba(88, 87, 155, 0.1);
      color: #58579B;
    }

    .guidora-sdk-builder-flow-card-status::before {
      content: "";
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: currentColor;
      opacity: 0.72;
    }

    .guidora-sdk-builder-flow-card-status-published {
      background: rgba(79, 70, 229, 0.1);
      color: #3525CD;
    }

    .guidora-sdk-builder-flow-card-status-archived {
      background: rgba(70, 69, 85, 0.1);
      color: #464555;
    }

    .guidora-sdk-builder-action-deck {
      gap: 10px;
    }

    .guidora-sdk-builder-action-card {
      padding: 14px;
      gap: 8px;
      text-align: left;
    }

    .guidora-sdk-builder-action-title {
      font-size: 13px;
      font-weight: 800;
      color: #1B1B24;
    }

    .guidora-sdk-builder-action-copy,
    .guidora-sdk-builder-step-row-copy {
      color: #58579B;
      font-size: 12px;
      line-height: 1.55;
    }

    .guidora-sdk-builder-step-note,
    .guidora-sdk-builder-status,
    .guidora-sdk-builder-empty-state {
      padding: 12px 14px;
      margin-top: 0;
      font-size: 12px;
      line-height: 1.6;
      color: #58579B;
    }

    .guidora-sdk-builder-status {
      background: rgba(79, 70, 229, 0.08);
      border-color: rgba(79, 70, 229, 0.14);
    }

    .guidora-sdk-builder-status-error {
      background: rgba(255, 218, 214, 0.9);
      border-color: rgba(186, 26, 26, 0.12);
      color: #93000A;
    }

    .guidora-sdk-builder-step-list {
      position: relative;
      gap: 10px;
      padding-left: 14px;
    }

    .guidora-sdk-builder-step-list::before {
      content: "";
      position: absolute;
      left: 10px;
      top: 6px;
      bottom: 6px;
      width: 2px;
      border-radius: 999px;
      background: linear-gradient(180deg, rgba(79, 70, 229, 0.24), rgba(199, 196, 216, 0.2));
      pointer-events: none;
    }

    .guidora-sdk-builder-step-card {
      position: relative;
      overflow: visible;
      margin-left: 10px;
      padding: 8px 9px 8px 12px;
      gap: 4px;
      border-radius: 12px;
    }

    .guidora-sdk-builder-step-card-hovered {
      border-color: rgba(79, 70, 229, 0.28);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(245, 242, 255, 0.9));
    }

    .guidora-sdk-builder-step-card-offpage {
      opacity: 0.82;
    }

    .guidora-sdk-builder-step-row-top {
      align-items: flex-start;
      justify-content: space-between;
      min-height: 18px;
    }

    .guidora-sdk-builder-step-order {
      position: absolute;
      left: -18px;
      top: 8px;
      width: 18px;
      height: 18px;
      background: linear-gradient(135deg, var(--guidora-accent-color) 0%, var(--guidora-accent-strong) 100%);
      color: #FFFFFF;
      box-shadow: 0 8px 16px rgba(79, 70, 229, 0.14);
      font-size: 9px;
    }

    .guidora-sdk-builder-step-card-active .guidora-sdk-builder-step-order {
      background: linear-gradient(135deg, color-mix(in srgb, var(--guidora-accent-color) 88%, #000000) 0%, var(--guidora-accent-strong) 100%);
      color: #FFFFFF;
    }

    .guidora-sdk-builder-step-row-meta {
      justify-content: flex-end;
      gap: 3px;
    }

    .guidora-sdk-builder-step-path {
      color: #777587;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.08em;
    }

    .guidora-sdk-builder-step-chip {
      background: rgba(79, 70, 229, 0.08);
      color: #4F46E5;
      font-size: 8px;
      padding: 2px 6px;
    }

    .guidora-sdk-builder-step-chip-hovered {
      background: rgba(88, 87, 155, 0.12);
      color: #58579B;
    }

    .guidora-sdk-builder-step-row-title {
      font-size: 11px;
      line-height: 1.3;
      color: #1B1B24;
    }

    .guidora-sdk-builder-step-row-copy {
      font-size: 10px;
      line-height: 1.35;
    }

    .guidora-sdk-builder-editor,
    .guidora-sdk-builder-preview {
      border-radius: 24px;
      box-shadow: 0 28px 90px rgba(53, 37, 205, 0.14);
      overflow: visible;
    }

    .guidora-sdk-builder-modal-backdrop {
      background: rgba(27, 27, 36, 0.24);
      backdrop-filter: blur(10px);
    }

    .guidora-sdk-builder-modal,
    .guidora-sdk-builder-theme-modal {
      border-radius: 28px;
      border: 1px solid rgba(199, 196, 216, 0.56);
      background: linear-gradient(180deg, rgba(252, 248, 255, 0.98), rgba(245, 242, 255, 0.94));
      box-shadow: 0 32px 110px rgba(53, 37, 205, 0.18);
      padding: 18px;
      backdrop-filter: blur(22px);
    }

    .guidora-sdk-builder-theme-modal {
      width: min(840px, calc(100vw - 32px));
      max-height: min(920px, calc(100vh - 36px));
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 4px 20px rgba(43, 52, 55, 0.06);
    }

    .guidora-sdk-builder-theme-modal[data-builder-settings-mode="theme"] [data-builder-settings-section="widget"],
    .guidora-sdk-builder-theme-modal[data-builder-settings-mode="widget"] [data-builder-settings-section="theme"] {
      display: none;
    }

    .guidora-sdk-builder-theme-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 20px 24px;
      background: rgba(255, 255, 255, 0.45);
      border-bottom: 1px solid rgba(171, 179, 183, 0.12);
    }

    .guidora-sdk-builder-theme-header-copy {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .guidora-sdk-builder-theme-title {
      margin: 0;
      font-size: 22px;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #2B3437;
    }

    .guidora-sdk-builder-theme-subtitle {
      margin: 0;
      font-size: 12px;
      line-height: 1.5;
      color: #586064;
    }

    .guidora-sdk-builder-theme-close {
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: #586064;
      font-size: 12px;
      font-weight: 700;
      padding: 10px 14px;
      cursor: pointer;
      transition: background 160ms ease, color 160ms ease;
    }

    .guidora-sdk-builder-theme-close:hover {
      background: rgba(219, 228, 231, 0.7);
      color: #2B3437;
    }

    .guidora-sdk-builder-theme-body {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 24px;
      overflow-y: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }

    .guidora-sdk-builder-theme-section {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .guidora-sdk-builder-theme-section-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #586064;
    }

    .guidora-sdk-builder-theme-widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .guidora-sdk-builder-theme-enable-button {
      padding: 8px 12px;
    }

    .guidora-sdk-builder-theme-enable-button[hidden] {
      display: none;
    }

    .guidora-sdk-builder-theme-widget-shell {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      border-radius: 18px;
      border: 1px solid rgba(171, 179, 183, 0.14);
      background: rgba(241, 244, 246, 0.56);
    }

    .guidora-sdk-builder-theme-widget-launcher {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      align-self: flex-end;
      border: 0;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--guidora-accent-color) 0%, var(--guidora-accent-strong) 100%);
      color: var(--guidora-launcher-text);
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 12px 28px rgba(53, 37, 205, 0.16);
    }

    .guidora-sdk-builder-theme-widget-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      border-radius: 20px;
      border: 1px solid rgba(199, 196, 216, 0.44);
      background: color-mix(in srgb, var(--guidora-panel-bg) 96%, white 4%);
      color: var(--guidora-panel-text);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.48);
    }

    .guidora-sdk-builder-theme-widget-panel-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .guidora-sdk-builder-theme-widget-eyebrow {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--guidora-muted-text);
    }

    .guidora-sdk-builder-theme-widget-title {
      font-size: 19px;
      font-weight: 700;
      line-height: 1.2;
      color: var(--guidora-panel-text);
    }

    .guidora-sdk-builder-theme-widget-subtitle {
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
      color: var(--guidora-muted-text);
    }

    .guidora-sdk-builder-theme-widget-message {
      border-radius: 16px;
      border: 1px solid rgba(199, 196, 216, 0.42);
      background: rgba(255, 255, 255, 0.76);
      color: var(--guidora-panel-text);
      font-size: 13px;
      line-height: 1.55;
      padding: 12px 14px;
    }

    .guidora-sdk-builder-theme-widget-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .guidora-sdk-builder-theme-widget-chip {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      border: 1px solid rgba(199, 196, 216, 0.46);
      background: rgba(255, 255, 255, 0.88);
      color: var(--guidora-panel-text);
      font-size: 11px;
      font-weight: 600;
      padding: 8px 10px;
    }

    .guidora-sdk-builder-theme-widget-composer {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
    }

    .guidora-sdk-builder-theme-widget-input {
      width: 100%;
      min-height: 42px;
      border-radius: 14px;
      border: 1px solid rgba(199, 196, 216, 0.56);
      background: rgba(255, 255, 255, 0.9);
      color: var(--guidora-panel-text);
      padding: 10px 12px;
      box-sizing: border-box;
    }

    .guidora-sdk-builder-theme-widget-input::placeholder {
      color: var(--guidora-muted-text);
    }

    .guidora-sdk-builder-theme-widget-submit {
      border: 0;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--guidora-accent-color) 0%, var(--guidora-accent-strong) 100%);
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 700;
      padding: 0 14px;
    }

    .guidora-sdk-builder-theme-widget-submit.guidora-sdk-assistant-submit-empty {
      min-width: 42px;
    }

    .guidora-sdk-builder-theme-disabled .guidora-sdk-builder-theme-widget-panel {
      opacity: 0.72;
    }

    .guidora-sdk-builder-theme-layout-grid,
    .guidora-sdk-builder-theme-message-grid,
    .guidora-sdk-builder-theme-color-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .guidora-sdk-builder-theme-layout-grid {
      gap: 28px;
    }

    .guidora-sdk-builder-theme-message-grid {
      gap: 16px;
    }

    .guidora-sdk-builder-theme-field-stack {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .guidora-sdk-builder-theme-field-label {
      font-size: 12px;
      line-height: 1.4;
      color: #586064;
      padding-left: 4px;
    }

    .guidora-sdk-builder-theme-field-hint {
      font-size: 12px;
      line-height: 1.4;
      color: #737C7F;
      padding-left: 4px;
    }

    .guidora-sdk-builder-theme-preset-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .guidora-sdk-builder-theme-preset {
      display: flex;
      align-items: center;
      gap: 12px;
      border-radius: 12px;
      border: 1px solid rgba(171, 179, 183, 0.18);
      background: rgba(255, 255, 255, 0.56);
      color: #2B3437;
      font-size: 14px;
      font-weight: 500;
      padding: 12px;
      cursor: pointer;
      transition: border-color 160ms ease, background 160ms ease, color 160ms ease;
    }

    .guidora-sdk-builder-theme-preset:hover {
      background: rgba(241, 244, 246, 0.9);
      border-color: rgba(77, 68, 227, 0.18);
    }

    .guidora-sdk-builder-theme-preset-active {
      border-color: rgba(77, 68, 227, 0.42);
      background: rgba(226, 223, 255, 0.28);
      color: #4D44E3;
    }

    .guidora-sdk-builder-theme-preset-swatch {
      width: 16px;
      height: 16px;
      border-radius: 999px;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.24);
      flex-shrink: 0;
    }

    .guidora-sdk-builder-theme-preset-label {
      line-height: 1.35;
    }

    .guidora-sdk-builder-theme-color-grid {
      gap: 16px 32px;
      border-radius: 16px;
      border: 1px solid rgba(171, 179, 183, 0.12);
      background: rgba(241, 244, 246, 0.56);
      padding: 20px;
    }

    .guidora-sdk-builder-theme-color-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .guidora-sdk-builder-theme-color-label {
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
      color: #2B3437;
    }

    .guidora-sdk-builder-theme-color-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .guidora-sdk-builder-theme-color-value {
      font-size: 10px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #586064;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .guidora-sdk-builder-theme-color-input {
      width: 32px;
      height: 32px;
      border: 0;
      padding: 0;
      border-radius: 8px;
      cursor: pointer;
      background: transparent;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(43, 52, 55, 0.12);
    }

    .guidora-sdk-builder-theme-color-input::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    .guidora-sdk-builder-theme-color-input::-webkit-color-swatch {
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
    }

    .guidora-sdk-builder-theme-footer {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 14px 20px;
      flex-wrap: nowrap;
      background: rgba(255, 255, 255, 0.72);
      border-top: 1px solid rgba(171, 179, 183, 0.12);
    }

    .guidora-sdk-builder-theme-footer-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 0 0 auto;
    }

    .guidora-sdk-builder-theme-footer .guidora-sdk-builder-button {
      padding: 9px 14px;
    }

    .guidora-sdk-builder-preview {
      border: 1px solid rgba(255, 255, 255, 0.22);
      background: linear-gradient(135deg, var(--guidora-accent-color) 0%, var(--guidora-accent-strong) 100%);
      color: #F8F7FF;
      padding: 16px;
      pointer-events: auto;
      gap: 12px;
    }

    .guidora-sdk-builder-preview::after {
      content: "";
      position: absolute;
      width: 18px;
      height: 18px;
      background: var(--guidora-accent-strong);
      border-left: 1px solid rgba(255, 255, 255, 0.18);
      border-top: 1px solid rgba(255, 255, 255, 0.18);
      transform: rotate(45deg);
      opacity: 0;
    }

    .guidora-sdk-builder-preview[data-position="bottom"]::after {
      top: -9px;
      left: 28px;
      opacity: 1;
    }

    .guidora-sdk-builder-preview[data-position="top"]::after {
      bottom: -9px;
      left: 28px;
      opacity: 1;
      transform: rotate(225deg);
    }

    .guidora-sdk-builder-preview[data-position="right"]::after {
      left: -9px;
      top: 26px;
      opacity: 1;
      transform: rotate(315deg);
    }

    .guidora-sdk-builder-preview[data-position="left"]::after {
      right: -9px;
      top: 26px;
      opacity: 1;
      transform: rotate(135deg);
    }

    .guidora-sdk-builder-preview-chip {
      background: rgba(255, 255, 255, 0.16);
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      padding: 7px 10px;
    }

    .guidora-sdk-builder-preview-title {
      color: #FFFFFF;
      font-size: 17px;
      line-height: 1.3;
    }

    .guidora-sdk-builder-preview-body {
      color: rgba(242, 239, 255, 0.84);
      font-size: 13px;
      line-height: 1.6;
    }

    .guidora-sdk-builder-preview-edit {
      align-self: flex-start;
      min-width: 124px;
      border-color: rgba(255, 255, 255, 0.26);
      background: rgba(255, 255, 255, 0.14);
      color: #FFFFFF;
      box-shadow: none;
    }

    .guidora-sdk-builder-preview-edit:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .guidora-sdk-builder-editor {
      border: 1px solid rgba(199, 196, 216, 0.58);
      background: linear-gradient(180deg, rgba(252, 248, 255, 0.98), rgba(245, 242, 255, 0.94));
      color: #1B1B24;
      width: min(560px, calc(100vw - 48px));
      max-height: calc(100vh - 64px);
      overflow: auto;
      padding: 22px;
      gap: 14px;
      backdrop-filter: blur(20px);
      z-index: ${zIndex + 5};
    }

    .guidora-sdk-builder-editor-chip {
      background: rgba(79, 70, 229, 0.08);
      color: #4F46E5;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      padding: 7px 10px;
    }

    .guidora-sdk-builder-editor-heading {
      font-size: 22px;
      line-height: 1.08;
      color: #1B1B24;
      letter-spacing: -0.03em;
    }

    .guidora-sdk-builder-assistant-preview {
      position: fixed;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0;
      width: max-content;
      pointer-events: none;
      z-index: ${zIndex + 5};
    }

    .guidora-sdk-builder-assistant-preview > * {
      pointer-events: auto;
    }

    .guidora-sdk-builder-assistant-launcher {
      position: relative;
      z-index: 2;
      cursor: grab;
      touch-action: none;
      user-select: none;
    }

    .guidora-sdk-builder-assistant-launcher:active {
      cursor: grabbing;
    }

    .guidora-sdk-builder-assistant-preview .guidora-sdk-assistant-panel {
      position: absolute;
      right: 0;
      left: auto;
      bottom: calc(100% + 12px);
      min-width: min(360px, calc(100vw - 28px));
      max-width: min(380px, calc(100vw - 28px));
      z-index: 1;
    }

    .guidora-sdk-builder-assistant-preview[data-position="bottom-left"] .guidora-sdk-assistant-panel,
    .guidora-sdk-builder-assistant-preview[data-position="top-left"] .guidora-sdk-assistant-panel,
    .guidora-sdk-builder-assistant-preview[data-position="custom-bottom-left"] .guidora-sdk-assistant-panel,
    .guidora-sdk-builder-assistant-preview[data-position="custom-top-left"] .guidora-sdk-assistant-panel {
      left: 0;
      right: auto;
    }

    .guidora-sdk-builder-assistant-edit {
      flex-shrink: 0;
    }

    .guidora-sdk-builder-assistant-composer {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
    }

    .guidora-sdk-builder-assistant-input {
      width: 100%;
      min-height: 42px;
      border-radius: 14px;
      border: 1px solid var(--guidora-border-color);
      background: rgba(255, 255, 255, 0.88);
      color: var(--guidora-panel-text);
      padding: 10px 12px;
      box-sizing: border-box;
    }

    .guidora-sdk-builder-assistant-input::placeholder {
      color: var(--guidora-muted-text);
    }

    .guidora-sdk-builder-assistant-submit {
      height: 42px;
      border-radius: 14px;
      padding-inline: 14px;
      justify-self: stretch;
    }

    .guidora-sdk-builder-assistant-preview-disabled .guidora-sdk-assistant-launcher {
      opacity: 0.96;
    }

    .guidora-sdk-builder-assistant-preview-disabled .guidora-sdk-assistant-panel {
      opacity: 0.86;
    }

    .guidora-sdk-builder-modal-popover {
      width: min(480px, calc(100vw - 24px));
      max-height: calc(100vh - 24px);
      overflow: hidden;
      transform: none;
    }

    .guidora-sdk-builder-editor-meta,
    .guidora-sdk-builder-field-label {
      color: #777587;
    }

    .guidora-sdk-builder-field-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.14em;
    }

    .guidora-sdk-builder-input,
    .guidora-sdk-builder-textarea,
    .guidora-sdk-builder-select {
      border-radius: 18px;
      border: 1px solid rgba(199, 196, 216, 0.72);
      background: rgba(255, 255, 255, 0.96);
      color: #1B1B24;
      min-height: 44px;
      padding: 12px 14px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.54);
    }

    .guidora-sdk-builder-input:focus,
    .guidora-sdk-builder-textarea:focus,
    .guidora-sdk-builder-select:focus {
      border-color: rgba(79, 70, 229, 0.38);
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.12);
    }

    @media (max-width: 1100px) {
      .guidora-sdk-builder-rail {
        background: linear-gradient(180deg, rgba(245, 242, 255, 0.98), rgba(252, 248, 255, 0.96));
      }

      .guidora-sdk-builder-step-list {
        padding-left: 12px;
      }

      .guidora-sdk-builder-step-card {
        margin-left: 10px;
        padding: 10px 10px 10px 12px;
      }

      .guidora-sdk-builder-step-order {
        left: -18px;
      }

      .guidora-sdk-builder-theme-modal {
        width: min(720px, calc(100vw - 24px));
      }
    }

    @media (max-width: 720px) {
      .guidora-sdk-assistant-panel {
        width: min(390px, calc(100vw - 16px));
      }

      .guidora-sdk-builder-assistant-preview {
        left: 12px !important;
        right: 12px !important;
        top: auto !important;
        bottom: 12px !important;
        width: auto;
        align-items: stretch;
      }

      .guidora-sdk-builder-assistant-preview .guidora-sdk-assistant-launcher {
        align-self: flex-end;
      }

      .guidora-sdk-builder-assistant-preview .guidora-sdk-assistant-panel {
        left: 0;
        right: 0;
        bottom: calc(100% + 12px);
        min-width: auto;
        max-width: none;
        width: 100%;
      }

      .guidora-sdk-builder-modal-popover {
        left: 12px !important;
        right: 12px !important;
        top: auto !important;
        bottom: 12px !important;
        width: auto;
      }

      .guidora-sdk-builder-step-list {
        padding-left: 0;
      }

      .guidora-sdk-builder-step-list::before {
        display: none;
      }

      .guidora-sdk-builder-step-card {
        margin-left: 0;
        padding-left: 10px;
      }

      .guidora-sdk-builder-step-order {
        position: static;
        width: 28px;
        height: 28px;
      }

      .guidora-sdk-builder-step-row-top {
        align-items: center;
        justify-content: space-between;
      }

      .guidora-sdk-builder-theme-body,
      .guidora-sdk-builder-theme-footer,
      .guidora-sdk-builder-theme-header {
        padding-left: 16px;
        padding-right: 16px;
      }

      .guidora-sdk-builder-theme-layout-grid,
      .guidora-sdk-builder-theme-message-grid,
      .guidora-sdk-builder-theme-color-grid,
      .guidora-sdk-builder-theme-preset-grid {
        grid-template-columns: minmax(0, 1fr);
      }

      .guidora-sdk-builder-theme-color-row {
        gap: 16px;
      }

      .guidora-sdk-builder-theme-footer {
        flex-direction: column;
        align-items: stretch;
      }

      .guidora-sdk-builder-theme-footer-group {
        width: 100%;
      }

      .guidora-sdk-builder-theme-footer-group .guidora-sdk-builder-button {
        flex: 1;
      }
    }
  `;

  document.head.append(style);
}
