const STYLE_ID = "guidora-sdk-styles";

export function injectGuidoraStyles(zIndex: number) {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
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

    .guidora-sdk-builder-highlight {
      position: fixed;
      border-radius: 16px;
      border: 2px solid #3B6EE8;
      background: rgba(59, 110, 232, 0.08);
      box-shadow: 0 0 0 9999px rgba(46, 58, 89, 0.12);
      pointer-events: none;
      transition: all 120ms ease;
    }

    .guidora-sdk-builder-hidden {
      opacity: 0;
      visibility: hidden;
    }

    .guidora-sdk-builder-panel {
      position: fixed;
      top: 12px;
      width: min(340px, calc(100vw - 24px));
      max-height: calc(100vh - 24px);
      border-radius: 28px;
      border: 1px solid #D9E3FB;
      background: rgba(255, 255, 255, 0.98);
      color: #2E3A59;
      box-shadow: 0 24px 80px rgba(46, 58, 89, 0.18);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: auto;
      backdrop-filter: blur(18px);
      overflow: hidden;
      scrollbar-gutter: stable;
    }

    .guidora-sdk-builder-panel-left {
      left: 12px;
    }

    .guidora-sdk-builder-panel-right {
      right: 12px;
    }

    .guidora-sdk-builder-panel-collapsed {
      width: auto;
      max-width: calc(100vw - 24px);
      padding: 12px;
    }

    .guidora-sdk-builder-panel-floating {
      right: auto;
    }

    .guidora-sdk-builder-panel-collapsed .guidora-sdk-builder-panel-body {
      display: none;
    }

    .guidora-sdk-builder-chrome {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      cursor: move;
      user-select: none;
      touch-action: none;
    }

    .guidora-sdk-builder-chrome button {
      cursor: pointer;
    }

    .guidora-sdk-builder-panel-body {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 0;
      overflow-y: auto;
      padding-right: 2px;
    }

    .guidora-sdk-builder-chip {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      border-radius: 999px;
      background: rgba(32, 169, 100, 0.12);
      color: #20A964;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 10px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .guidora-sdk-builder-utility-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 8px;
    }

    .guidora-sdk-builder-utility-button {
      border: 1px solid #D7DCE5;
      border-radius: 999px;
      background: #FFFFFF;
      color: #44506A;
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
      padding: 9px 12px;
      cursor: pointer;
      transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
    }

    .guidora-sdk-builder-utility-button:hover {
      background: #F8FAFF;
      border-color: rgba(59, 110, 232, 0.25);
      transform: translateY(-1px);
    }

    .guidora-sdk-builder-utility-button-close {
      color: #B42318;
      background: #FFF1F2;
      border-color: #FECACA;
    }

    .guidora-sdk-builder-heading {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      line-height: 1.25;
      color: #2E3A59;
    }

    .guidora-sdk-builder-copy {
      margin: 0;
      font-size: 13px;
      line-height: 1.6;
      color: #5B6478;
    }

    .guidora-sdk-builder-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .guidora-sdk-builder-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .guidora-sdk-builder-section-title {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.4;
      color: #2E3A59;
    }

    .guidora-sdk-builder-section-note {
      font-size: 12px;
      color: #6B7280;
    }

    .guidora-sdk-builder-meta {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .guidora-sdk-builder-meta-card {
      border-radius: 18px;
      background: #F8FAFF;
      border: 1px solid #E5E7EB;
      padding: 12px;
    }

    .guidora-sdk-builder-label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #7A8398;
      margin-bottom: 6px;
    }

    .guidora-sdk-builder-value {
      font-size: 13px;
      line-height: 1.5;
      color: #2E3A59;
      word-break: break-word;
    }

    .guidora-sdk-builder-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .guidora-sdk-builder-step-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: min(34vh, 320px);
      overflow-y: auto;
      padding-right: 4px;
    }

    .guidora-sdk-builder-step-empty {
      border-radius: 16px;
      border: 1px dashed #D7DCE5;
      padding: 14px;
      font-size: 13px;
      line-height: 1.6;
      color: #6B7280;
      background: #FBFCFF;
    }

    .guidora-sdk-builder-step-card {
      border: 1px solid #E5E7EB;
      background: #FFFFFF;
      border-radius: 18px;
      padding: 12px;
      width: 100%;
      text-align: left;
      appearance: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
      cursor: pointer;
      transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
    }

    .guidora-sdk-builder-step-card:hover {
      border-color: rgba(59, 110, 232, 0.35);
      box-shadow: 0 12px 28px rgba(46, 58, 89, 0.08);
    }

    .guidora-sdk-builder-step-card-active {
      border-color: rgba(59, 110, 232, 0.55);
      background: #F8FBFF;
      box-shadow: 0 16px 36px rgba(59, 110, 232, 0.12);
    }

    .guidora-sdk-builder-step-topline {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
    }

    .guidora-sdk-builder-step-meta {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 6px;
    }

    .guidora-sdk-builder-step-scope {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      background: #F3F6FC;
      color: #44506A;
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
      padding: 5px 8px;
    }

    .guidora-sdk-builder-step-scope-active {
      background: rgba(32, 169, 100, 0.12);
      color: #14804A;
    }

    .guidora-sdk-builder-step-card-offpage {
      background: #FCFCFD;
    }

    .guidora-sdk-builder-step-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      background: rgba(59, 110, 232, 0.1);
      color: #3B6EE8;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 5px 9px;
    }

    .guidora-sdk-builder-step-title {
      font-size: 14px;
      font-weight: 700;
      color: #2E3A59;
      line-height: 1.45;
    }

    .guidora-sdk-builder-step-copy {
      font-size: 12px;
      color: #5B6478;
      line-height: 1.55;
    }

    .guidora-sdk-builder-step-code {
      font-size: 11px;
      line-height: 1.55;
      color: #4B5563;
      background: #F8FAFF;
      border-radius: 12px;
      padding: 8px 10px;
      word-break: break-word;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .guidora-sdk-builder-inline-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .guidora-sdk-builder-input,
    .guidora-sdk-builder-textarea,
    .guidora-sdk-builder-select {
      width: 100%;
      border-radius: 16px;
      border: 1px solid #D7DCE5;
      background: #FFFFFF;
      color: #2E3A59;
      font-size: 14px;
      line-height: 1.5;
      padding: 11px 13px;
      outline: none;
      box-sizing: border-box;
    }

    .guidora-sdk-builder-input:focus,
    .guidora-sdk-builder-textarea:focus,
    .guidora-sdk-builder-select:focus {
      border-color: rgba(59, 110, 232, 0.5);
      box-shadow: 0 0 0 4px rgba(59, 110, 232, 0.12);
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

    .guidora-sdk-builder-code {
      border-radius: 16px;
      background: #172033;
      color: #EAF0FF;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      line-height: 1.6;
      padding: 12px;
      word-break: break-word;
      min-height: 44px;
    }

    .guidora-sdk-builder-status {
      border-radius: 16px;
      background: #F3F6FC;
      color: #44506A;
      font-size: 13px;
      line-height: 1.55;
      padding: 12px;
    }

    .guidora-sdk-builder-status-error {
      background: #FFF1F2;
      color: #B42318;
    }

    .guidora-sdk-builder-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .guidora-sdk-builder-button {
      border: 0;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 700;
      line-height: 1;
      padding: 12px 16px;
      cursor: pointer;
      transition: transform 160ms ease, opacity 160ms ease, background 160ms ease;
    }

    .guidora-sdk-builder-button:hover {
      transform: translateY(-1px);
    }

    .guidora-sdk-builder-button:disabled {
      opacity: 0.55;
      cursor: wait;
      transform: none;
    }

    .guidora-sdk-builder-button-primary {
      background: #3B6EE8;
      color: #FFFFFF;
    }

    .guidora-sdk-builder-button-secondary {
      background: #EFF3FC;
      color: #2E3A59;
    }

    .guidora-sdk-builder-button-ghost {
      background: transparent;
      color: #6B7280;
      border: 1px solid #E5E7EB;
    }

    .guidora-sdk-builder-button-danger {
      background: #FFF1F2;
      color: #B42318;
      border: 1px solid #FECACA;
    }

    @media (max-width: 640px) {
      .guidora-sdk-builder-panel {
        left: 12px;
        right: 12px;
        width: auto;
        max-height: calc(100vh - 24px);
      }

      .guidora-sdk-builder-meta,
      .guidora-sdk-builder-grid {
        grid-template-columns: minmax(0, 1fr);
      }

      .guidora-sdk-builder-chrome {
        align-items: flex-start;
        flex-direction: column;
      }

      .guidora-sdk-builder-utility-actions {
        justify-content: flex-start;
      }

      .guidora-sdk-builder-step-topline {
        flex-direction: column;
      }

      .guidora-sdk-builder-step-meta {
        justify-content: flex-start;
      }
    }
  `;

  document.head.append(style);
}
