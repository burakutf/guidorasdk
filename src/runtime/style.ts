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
      top: 20px;
      right: 20px;
      width: min(420px, calc(100vw - 24px));
      border-radius: 28px;
      border: 1px solid #D9E3FB;
      background: rgba(255, 255, 255, 0.98);
      color: #2E3A59;
      box-shadow: 0 24px 80px rgba(46, 58, 89, 0.18);
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: auto;
      backdrop-filter: blur(18px);
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

    @media (max-width: 640px) {
      .guidora-sdk-builder-panel {
        top: auto;
        right: 12px;
        bottom: 12px;
        width: calc(100vw - 24px);
        max-height: min(82vh, 720px);
        overflow-y: auto;
      }

      .guidora-sdk-builder-meta,
      .guidora-sdk-builder-grid {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `;

  document.head.append(style);
}