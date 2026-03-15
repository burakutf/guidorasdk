# Guidora SDK

Framework-agnostic browser SDK for Guidora onboarding flows and AI-guided product help.

## Why this shape

- Runtime stays vanilla browser JavaScript, so any SaaS frontend can embed it.
- Source is written in TypeScript, so the SDK contract stays explicit and safer to evolve.
- It talks directly to the public guide endpoints under `/api/guide/sdk/`.

## Usage

```ts
import { initGuidora } from "@guidora/sdk";

const guidora = initGuidora({
  apiKey: "public_key_here",
  apiBaseUrl: "http://127.0.0.1:8000/api/guide",
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

## Current scope

- Persistent anonymous and session identifiers
- Bootstrap flow lookup
- Resolve-intent API integration
- Flow event tracking
- Tooltip/highlight runtime in the host page DOM

## Next likely additions

- Better SPA route awareness for complex routers
- More resilient target discovery and repositioning
- Public script-tag snippet guidance
- Builder mode hooks for selecting elements in the opened product tab