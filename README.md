# Guidora SDK

Framework-agnostic browser SDK for Guidora onboarding flows and AI-guided product help.

## What it is

- Lightweight browser client for Guidora public SDK endpoints
- TypeScript-authored, framework-agnostic runtime
- Suitable for npm installs and direct script-tag usage through a CDN

## What stays private

This package is meant to be public.

The SDK is the integration layer, not the product's private control plane. Core flow resolution rules, tenant logic, AI orchestration, quotas, billing, and privileged builder/dashboard behavior should stay server-side.

## Install

```bash
npm install @guidora/sdk
```

## npm usage

```ts
import { initGuidora } from "@guidora/sdk";

const guidora = initGuidora({
  apiKey: "public_key_here",
  apiBaseUrl: "https://your-api.example.com/api/guide",
});

await guidora.bootstrap({
  anonymousId: "visitor_42",
  traits: {
    plan: "trial",
    role: "admin",
  },
});

await guidora.resolveIntent("How do I add a product?");
```

## Script tag usage

Use the published global build from jsDelivr or unpkg:

```html
<script src="https://cdn.jsdelivr.net/npm/@guidora/sdk@0.1.0/dist/index.global.js"></script>
<script>
  const guidora = window.GuidoraSDK.initGuidora({
    apiKey: "public_key_here",
    apiBaseUrl: "https://your-api.example.com/api/guide",
  });
</script>
```

## Local example surfaces

The example HTML pages in `guidorafe/` and `guidorafe/public/` can now load the SDK from either:

- the local build: `/sdk/index.global.js`
- a published CDN URL through the `guidora_sdk_url` query param

Example:

```text
/example.html?guidora_sdk_url=https%3A%2F%2Fcdn.jsdelivr.net%2Fnpm%2F%40guidora%2Fsdk%400.1.0%2Fdist%2Findex.global.js
```

This makes it easy to validate the real npm/CDN package on the same demo surfaces after publishing.

## Current scope

- Persistent anonymous and session identifiers
- Bootstrap flow lookup
- Resolve-intent API integration
- Flow event tracking
- Tooltip/highlight runtime in the host page DOM
- Browser assistant launcher integration

## Publish checklist

1. Ensure the GitHub repository is public.
2. Create an npm access token with publish rights.
3. Add `NPM_TOKEN` to the GitHub repository secrets.
4. Update the version in `package.json`.
5. Run `npm run check` and `npm run build`.
6. Publish manually with `npm publish --access public` or via GitHub Actions.

See [PUBLISHING.md](./PUBLISHING.md) for the exact release flow.

## License

Apache-2.0. Using Apache-2.0 does not require paying a fee.
