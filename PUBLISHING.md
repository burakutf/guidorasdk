# Publishing Guidora SDK

This package is prepared for public publishing as `@guidora/sdk`.

## Before the first publish

1. Make sure the GitHub repository is public.
2. Make sure the npm scope or user has permission to publish `@guidora/sdk`.
3. If you want to keep the package name as `@guidora/sdk`, you must first own the `@guidora` scope on npm.
4. If `@guidora` does not exist under your npm account or organization, create it first or rename the package to a scope you control.
5. A scoped package publish can fail with `E404 Not Found - PUT https://registry.npmjs.org/@guidora%2fsdk` when the scope is missing or your token has no permission for that scope.
6. Run:

```bash
cd guidorasdk
npm ci
npm run check
npm run build
```

4. Log in locally if you want to publish by hand:

```bash
npm login
```

## Manual publish

```bash
cd guidorasdk
npm version patch
npm publish --access public
```

Use `patch`, `minor`, or `major` depending on the release.

## npm scope setup

If you want to publish as `@guidora/sdk`, do this first on npm:

1. Sign in to npm.
2. Create or use an npm organization named `guidora`, or use a user scope you already own.
3. Make sure the account behind `NPM_TOKEN` is a member with publish permission.

If that scope is not available, pick a package name you control, for example:

- `@burakutf/guidora-sdk`
- `guidora-sdk`

Then update `name` in `package.json` before publishing.

## GitHub Actions publish

The repository includes `.github/workflows/publish.yml`.

Set this secret in GitHub:

- `NPM_TOKEN`: npm automation token with publish permission

The token must belong to an npm account that can publish to the chosen package scope.

If npm returns this error during publish:

```text
403 Forbidden - Two-factor authentication or granular access token with bypass 2fa enabled is required to publish packages
```

then the token is not valid for publishing under the organization's 2FA policy.

Use one of these options:

1. Create a publish-capable npm token with 2FA bypass enabled for package publishing.
2. Or switch the package to npm trusted publishing from GitHub Actions and stop using `NPM_TOKEN` for publish.

For GitHub Actions, trusted publishing is the cleaner long-term option.

Then publish using one of these flows:

1. Push a version tag like `v0.1.0`
2. Or create a GitHub Release
3. Or run the workflow manually from the Actions tab

The workflow will:

1. install dependencies
2. run type checks
3. build the package
4. publish to npm with provenance

## Verify the published package

After publishing, verify all of these:

```bash
npm view @guidora/sdk
npm view @guidora/sdk version
```

Then test the published global build on the local example surface:

```text
http://localhost:3000/example.html?guidora_sdk_url=https%3A%2F%2Fcdn.jsdelivr.net%2Fnpm%2F%40guidora%2Fsdk%400.1.0%2Fdist%2Findex.global.js
```

You can do the same with:

- `/example-compose.html`
- `/example-review.html`

## Suggested release flow

1. update code
2. run `npm run check`
3. run `npm run build`
4. bump version
5. push commit
6. create and push a version tag like `v0.1.0`
7. publish via GitHub Actions or `npm publish`
8. validate jsDelivr/unpkg and local example pages

## Important note about push builds

A normal branch push does **not** mean npm publish happened.

- `ci.yml` runs on every push and pull request for typecheck/build.
- `publish.yml` publishes only when one of these happens:
  - a `v*` tag is pushed
  - a GitHub Release is published
  - the workflow is started manually

Example tag publish:

```bash
cd guidorasdk
npm version patch
git push origin main
git push origin --tags
```

## npm 2FA note

If the `guidora` npm organization requires 2FA for package publishing, a normal token is not enough.

You need either:

- a granular access token that can publish packages and bypass 2FA
- or npm trusted publishing configured for this GitHub repository

If you stay with token-based publishing, regenerate the token and make sure:

1. it belongs to an account that can publish to `@guidora`
2. it has package publish permission
3. it supports bypassing 2FA for package publish

Then replace the `NPM_TOKEN` GitHub secret with the new token.
