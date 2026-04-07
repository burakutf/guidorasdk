# Publishing Guidora SDK

This package is prepared for public publishing as `@guidora/sdk`.

## Before the first publish

1. Make sure the GitHub repository is public.
2. Make sure the npm scope or user has permission to publish `@guidora/sdk`.
3. Run:

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

## GitHub Actions publish

The repository includes `.github/workflows/publish.yml`.

Set this secret in GitHub:

- `NPM_TOKEN`: npm automation token with publish permission

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
