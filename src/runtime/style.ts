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
    }

    .guidora-sdk-hidden {
      opacity: 0;
      visibility: hidden;
    }

    .guidora-sdk-highlight {
      position: fixed;
      border-radius: 16px;
      border: 2px solid #20A964;
      box-shadow: 0 0 0 9999px rgba(46, 58, 89, 0.18);
      background: rgba(255, 255, 255, 0.06);
      transition: all 180ms ease;
      pointer-events: none;
    }

    .guidora-sdk-card {
      position: fixed;
      width: min(340px, calc(100vw - 32px));
      border-radius: 24px;
      border: 1px solid #E5E7EB;
      background: #FFFFFF;
      color: #2E3A59;
      box-shadow: 0 24px 72px rgba(46, 58, 89, 0.16);
      padding: 20px;
      pointer-events: auto;
      transition: transform 180ms ease, opacity 180ms ease;
    }

    .guidora-sdk-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      background: rgba(59, 110, 232, 0.12);
      color: #3B6EE8;
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
      color: #2E3A59;
    }

    .guidora-sdk-body {
      margin: 12px 0 0;
      font-size: 14px;
      line-height: 1.65;
      color: #5B6478;
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
      background: #3B6EE8;
      color: #FFFFFF;
    }

    .guidora-sdk-button-secondary {
      background: #F3F4F6;
      color: #2E3A59;
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
      border-radius: 18px;
      background: rgba(59, 110, 232, 0.06);
      border: 2px solid rgba(59, 110, 232, 0.42);
      box-shadow: 0 18px 52px rgba(15, 23, 42, 0.12);
      pointer-events: none;
      transition: all 120ms ease;
    }

    .guidora-sdk-builder-highlight-hover {
      border-color: rgba(59, 110, 232, 0.42);
      background: rgba(59, 110, 232, 0.06);
    }

    .guidora-sdk-builder-highlight-pick {
      border-color: rgba(32, 169, 100, 0.58);
      background: rgba(32, 169, 100, 0.08);
    }

    .guidora-sdk-builder-highlight-edit {
      border-color: rgba(26, 78, 216, 0.65);
      background: rgba(26, 78, 216, 0.08);
      box-shadow: 0 24px 60px rgba(26, 78, 216, 0.16);
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
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(18px);
      pointer-events: auto;
      overflow: hidden;
    }

    .guidora-sdk-builder-rail-left {
      left: 0;
      border-right: 1px solid rgba(215, 220, 229, 0.92);
      box-shadow: 18px 0 48px rgba(15, 23, 42, 0.06);
    }

    .guidora-sdk-builder-rail-right {
      right: 0;
      width: 324px;
      border-left: 1px solid rgba(215, 220, 229, 0.92);
      box-shadow: -18px 0 48px rgba(15, 23, 42, 0.06);
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
      border: 1px solid rgba(215, 220, 229, 0.92);
      background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%);
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

    .guidora-sdk-builder-flow-editor-actions .guidora-sdk-builder-button {
      flex: 1;
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
      background: #172033;
      color: #FFFFFF;
    }

    .guidora-sdk-builder-button-secondary {
      background: #EEF2F8;
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
      flex: 1;
    }

    .guidora-sdk-builder-flow-card,
    .guidora-sdk-builder-step-card {
      width: 100%;
      appearance: none;
      border: 1px solid rgba(215, 220, 229, 0.92);
      background: #FFFFFF;
      color: #172033;
      text-align: left;
      cursor: pointer;
    }

    .guidora-sdk-builder-flow-card {
      border-radius: 20px;
      padding: 14px 14px 13px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
    }

    .guidora-sdk-builder-flow-card:hover,
    .guidora-sdk-builder-step-card:hover {
      border-color: rgba(23, 32, 51, 0.22);
      box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
      transform: translateY(-1px);
    }

    .guidora-sdk-builder-flow-card-active {
      background: #172033;
      border-color: #172033;
      color: #F8FAFC;
      box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
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
      border-radius: 20px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%);
      transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
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
      font-size: 12px;
      line-height: 1.55;
      color: #6B7280;
    }

    .guidora-sdk-builder-step-list {
      flex: 1;
    }

    .guidora-sdk-builder-step-card {
      border-radius: 18px;
      padding: 12px 12px 11px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease, transform 160ms ease;
    }

    .guidora-sdk-builder-step-card-active {
      border-color: rgba(23, 32, 51, 0.25);
      background: #F8FAFF;
      box-shadow: 0 18px 42px rgba(15, 23, 42, 0.1);
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

    .guidora-sdk-builder-step-path {
      font-size: 11px;
      font-weight: 700;
      line-height: 1.4;
      color: #6B7280;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .guidora-sdk-builder-step-row-title {
      font-size: 13px;
      font-weight: 700;
      line-height: 1.45;
      color: #172033;
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
      background: #F3F6FC;
      color: #44506A;
      font-size: 12px;
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
      border-radius: 26px;
      border: 1px solid rgba(215, 220, 229, 0.92);
      background: rgba(255, 255, 255, 0.98);
      color: #172033;
      box-shadow: 0 28px 72px rgba(15, 23, 42, 0.18);
      backdrop-filter: blur(18px);
      pointer-events: auto;
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