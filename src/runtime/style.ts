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
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --guidora-accent-color: #3B6EE8;
      --guidora-launcher-bg: #172033;
      --guidora-launcher-text: #FFFFFF;
      --guidora-panel-bg: #FFFFFF;
      --guidora-panel-text: #172033;
      --guidora-highlight-color: #20A964;
      --guidora-highlight-overlay: #2E3A59;
    }

    .guidora-sdk-hidden {
      opacity: 0;
      visibility: hidden;
    }

    .guidora-sdk-highlight {
      position: fixed;
      border-radius: 16px;
      border: 2px solid var(--guidora-highlight-color);
      box-shadow: 0 0 0 9999px color-mix(in srgb, var(--guidora-highlight-overlay) 18%, transparent);
      background: rgba(255, 255, 255, 0.06);
      transition: all 180ms ease;
      pointer-events: none;
    }

    .guidora-sdk-card {
      position: fixed;
      width: min(340px, calc(100vw - 32px));
      border-radius: 24px;
      border: 1px solid #E5E7EB;
      background: var(--guidora-panel-bg);
      color: var(--guidora-panel-text);
      box-shadow: 0 24px 72px rgba(46, 58, 89, 0.16);
      padding: 20px;
      pointer-events: auto;
      transition: transform 180ms ease, opacity 180ms ease;
    }

    .guidora-sdk-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      background: color-mix(in srgb, var(--guidora-accent-color) 12%, transparent);
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
      color: color-mix(in srgb, var(--guidora-panel-text) 72%, #FFFFFF 28%);
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
      color: #6B7280;
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
      background: #F3F4F6;
      color: #2E3A59;
    }

    .guidora-sdk-assistant-shell {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: ${zIndex + 1};
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
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
      border: 0;
      border-radius: 999px;
      background: var(--guidora-launcher-bg);
      color: var(--guidora-launcher-text);
      font-size: 14px;
      font-weight: 700;
      line-height: 1;
      padding: 14px 18px;
      box-shadow: 0 20px 40px rgba(23, 32, 51, 0.24);
      cursor: pointer;
    }

    .guidora-sdk-assistant-panel {
      width: min(380px, calc(100vw - 24px));
      border-radius: 28px;
      border: 1px solid rgba(15, 23, 42, 0.08);
      background: color-mix(in srgb, var(--guidora-panel-bg) 98%, transparent);
      backdrop-filter: blur(12px);
      box-shadow: 0 28px 80px rgba(15, 23, 42, 0.18);
      padding: 18px;
      display: grid;
      gap: 14px;
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
      color: color-mix(in srgb, var(--guidora-panel-text) 72%, #FFFFFF 28%);
    }

    .guidora-sdk-assistant-close {
      border: 0;
      background: #F3F4F6;
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
      background: #F8FAFC;
      color: var(--guidora-panel-text);
      border: 1px solid rgba(191, 199, 214, 0.52);
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
      border-top: 1px solid rgba(191, 199, 214, 0.48);
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
      border: 1px solid rgba(191, 199, 214, 0.72);
      background: var(--guidora-panel-bg);
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
      border: 1px solid rgba(191, 199, 214, 0.78);
      background: var(--guidora-panel-bg);
      color: var(--guidora-panel-text);
      padding: 12px 14px;
      font: inherit;
    }

    .guidora-sdk-assistant-submit {
      justify-self: end;
    }

    .guidora-sdk-assistant-status {
      font-size: 12px;
      font-weight: 600;
      color: color-mix(in srgb, var(--guidora-panel-text) 72%, #FFFFFF 28%);
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
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .guidora-sdk-builder-hidden {
      opacity: 0;
      visibility: hidden;
    }

    .guidora-sdk-builder-highlight {
      position: fixed;
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.04);
      border: 2px solid rgba(23, 32, 51, 0.28);
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14), inset 0 0 0 1px rgba(255, 255, 255, 0.48);
      pointer-events: none;
      transition: all 120ms ease;
    }

    .guidora-sdk-builder-highlight-hover {
      border-color: rgba(23, 32, 51, 0.7);
      background: rgba(255, 255, 255, 0.04);
      box-shadow: 0 18px 42px rgba(15, 23, 42, 0.16), inset 0 0 0 1px rgba(255, 255, 255, 0.62);
    }

    .guidora-sdk-builder-highlight-step {
      border-color: rgba(59, 110, 232, 0.88);
      background: rgba(59, 110, 232, 0.1);
      box-shadow: 0 0 0 3px rgba(59, 110, 232, 0.14), 0 20px 44px rgba(15, 23, 42, 0.18);
    }

    .guidora-sdk-builder-highlight-pick {
      border-color: rgba(32, 169, 100, 0.92);
      background: rgba(32, 169, 100, 0.12);
      box-shadow: 0 0 0 4px rgba(32, 169, 100, 0.16), 0 20px 44px rgba(15, 23, 42, 0.18);
    }

    .guidora-sdk-builder-highlight-edit {
      border-color: rgba(26, 78, 216, 0.96);
      background: rgba(26, 78, 216, 0.16);
      box-shadow: 0 0 0 4px rgba(26, 78, 216, 0.18), 0 24px 60px rgba(26, 78, 216, 0.24);
    }

    .guidora-sdk-builder-highlight-badge {
      position: fixed;
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.92);
      color: #F8FAFC;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 8px 10px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      pointer-events: none;
      white-space: nowrap;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2);
    }

    .guidora-sdk-builder-rail {
      position: fixed;
      top: 0;
      bottom: 0;
      width: 268px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding: 22px 18px 18px;
      background: rgba(249, 250, 252, 0.98);
      backdrop-filter: blur(12px);
      pointer-events: auto;
      overflow: hidden;
      min-height: 0;
    }

    .guidora-sdk-builder-rail-left {
      left: 0;
      border-right: 1px solid rgba(191, 199, 214, 0.98);
      box-shadow: 18px 0 48px rgba(15, 23, 42, 0.08);
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .guidora-sdk-builder-rail-right {
      right: 0;
      width: 324px;
      border-left: 1px solid rgba(191, 199, 214, 0.98);
      box-shadow: -18px 0 48px rgba(15, 23, 42, 0.08);
    }

    .guidora-sdk-builder-rail-header {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .guidora-sdk-builder-eyebrow {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #7A8398;
    }

    .guidora-sdk-builder-rail-title {
      margin: 0;
      font-size: 26px;
      line-height: 1.1;
      font-weight: 700;
      color: #172033;
    }

    .guidora-sdk-builder-rail-copy {
      margin: 0;
      font-size: 13px;
      line-height: 1.55;
      color: #5B6478;
    }

    .guidora-sdk-builder-flow-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .guidora-sdk-builder-flow-editor {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 14px;
      border-radius: 22px;
      border: 1px solid rgba(183, 193, 208, 0.96);
      background: #FFFFFF;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
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
      border-radius: 16px;
      background: #F5F8FD;
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
      border-radius: 16px;
      border: 1px solid rgba(215, 220, 229, 0.92);
      background: #FBFCFE;
      padding: 10px 12px;
      min-height: 44px;
      justify-content: center;
    }

    .guidora-sdk-builder-checkbox-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .guidora-sdk-builder-checkbox-input {
      width: 16px;
      height: 16px;
      margin: 0;
      accent-color: #2563EB;
      flex-shrink: 0;
    }

    .guidora-sdk-builder-checkbox-title {
      font-size: 12px;
      font-weight: 700;
      line-height: 1.4;
      color: #172033;
      flex: 1;
    }

    .guidora-sdk-builder-checkbox-hint {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border: 1px solid rgba(148, 163, 184, 0.7);
      border-radius: 999px;
      background: #FFFFFF;
      color: #64748B;
      font-size: 11px;
      font-weight: 800;
      line-height: 1;
      padding: 0;
      cursor: help;
      flex-shrink: 0;
    }

    .guidora-sdk-builder-button {
      border: 0;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      line-height: 1;
      padding: 12px 14px;
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
      background: #111827;
      color: #FFFFFF;
    }

    .guidora-sdk-builder-button-secondary {
      background: #E7ECF5;
      color: #25324A;
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
      border: 1px solid rgba(191, 199, 214, 0.96);
      background: #FFFFFF;
      color: #172033;
      text-align: left;
      cursor: pointer;
    }

    .guidora-sdk-builder-flow-card {
      border-radius: 16px;
      padding: 14px 14px 13px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease, transform 160ms ease;
    }

    .guidora-sdk-builder-flow-card:hover,
    .guidora-sdk-builder-step-card:hover {
      border-color: rgba(23, 32, 51, 0.68);
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
      transform: translateY(-1px);
    }

    .guidora-sdk-builder-flow-card-active {
      background: #111827;
      border-color: #111827;
      color: #F8FAFC;
      box-shadow: 0 22px 46px rgba(15, 23, 42, 0.22);
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
      font-size: 24px;
      line-height: 1.12;
      font-weight: 700;
      color: #172033;
    }

    .guidora-sdk-builder-active-flow-meta {
      font-size: 13px;
      line-height: 1.55;
      color: #5B6478;
    }

    .guidora-sdk-builder-action-deck {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .guidora-sdk-builder-action-card {
      border: 1px solid rgba(191, 199, 214, 0.96);
      border-radius: 16px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: #FFFFFF;
      transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease, transform 160ms ease;
    }

    .guidora-sdk-builder-action-card-active {
      border-color: #111827;
      background: #111827;
      box-shadow: 0 20px 42px rgba(15, 23, 42, 0.22);
    }

    .guidora-sdk-builder-action-card-active .guidora-sdk-builder-action-title,
    .guidora-sdk-builder-action-card-active .guidora-sdk-builder-action-copy {
      color: #F8FAFC;
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
      color: #5B6478;
    }

    .guidora-sdk-builder-step-note {
      border-radius: 16px;
      border: 1px solid rgba(191, 199, 214, 0.96);
      background: #F3F6FC;
      font-size: 12px;
      font-weight: 700;
      line-height: 1.55;
      color: #25324A;
      padding: 12px 14px;
    }

    .guidora-sdk-builder-step-list {
      flex: 1;
    }

    .guidora-sdk-builder-step-card {
      position: relative;
      overflow: hidden;
      border-radius: 16px;
      padding: 12px 12px 11px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease, transform 160ms ease;
    }

    .guidora-sdk-builder-step-card-active {
      border-color: #111827;
      background: linear-gradient(180deg, #FFFFFF 0%, #EDF4FF 100%);
      box-shadow: 0 0 0 2px rgba(59, 110, 232, 0.14), 0 20px 42px rgba(15, 23, 42, 0.16);
    }

    .guidora-sdk-builder-step-card-hovered {
      border-color: rgba(59, 110, 232, 0.76);
      background: #F7FAFF;
      box-shadow: 0 16px 32px rgba(59, 110, 232, 0.08);
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
      background: rgba(59, 110, 232, 0.14);
      color: #1A4ED8;
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
      border-radius: 18px;
      border: 1px dashed rgba(215, 220, 229, 0.92);
      background: #FBFCFE;
      color: #6B7280;
      font-size: 13px;
      line-height: 1.55;
      padding: 16px;
    }

    .guidora-sdk-builder-status {
      border-radius: 18px;
      background: #EAF0FA;
      color: #25324A;
      font-size: 12px;
      font-weight: 700;
      line-height: 1.55;
      padding: 12px 14px;
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
      border: 1px solid rgba(183, 193, 208, 0.98);
      background: rgba(255, 255, 255, 0.99);
      color: #172033;
      box-shadow: 0 30px 76px rgba(15, 23, 42, 0.22);
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
      border: 1px solid rgba(17, 24, 39, 0.94);
      background: rgba(17, 24, 39, 0.98);
      color: #F8FAFC;
      box-shadow: 0 28px 64px rgba(15, 23, 42, 0.28);
      pointer-events: none;
    }

    .guidora-sdk-builder-preview-chip {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      border-radius: 999px;
      background: rgba(59, 110, 232, 0.16);
      color: #BFDBFE;
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
      color: #FFFFFF;
    }

    .guidora-sdk-builder-preview-body {
      font-size: 13px;
      line-height: 1.6;
      color: rgba(248, 250, 252, 0.82);
    }

    .guidora-sdk-builder-editor-chip {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      border-radius: 999px;
      background: rgba(23, 32, 51, 0.08);
      color: #25324A;
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
      color: #5B6478;
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
      color: #7A8398;
    }

    .guidora-sdk-builder-input,
    .guidora-sdk-builder-textarea,
    .guidora-sdk-builder-select {
      width: 100%;
      box-sizing: border-box;
      border-radius: 16px;
      border: 1px solid rgba(215, 220, 229, 0.92);
      background: #FFFFFF;
      color: #172033;
      font-size: 13px;
      line-height: 1.5;
      padding: 11px 12px;
      outline: none;
    }

    .guidora-sdk-builder-input:focus,
    .guidora-sdk-builder-textarea:focus,
    .guidora-sdk-builder-select:focus {
      border-color: rgba(23, 32, 51, 0.32);
      box-shadow: 0 0 0 4px rgba(23, 32, 51, 0.08);
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
        box-shadow: 0 18px 48px rgba(15, 23, 42, 0.06);
      }

      .guidora-sdk-builder-rail-right {
        top: auto;
        bottom: 0;
        border-left: 0;
        border-top: 1px solid rgba(215, 220, 229, 0.92);
        box-shadow: 0 -18px 48px rgba(15, 23, 42, 0.06);
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
        font-size: 21px;
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
    }
  `;

  document.head.append(style);
}
