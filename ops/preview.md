# TRANA preview operations

Updated 15 November 2026. **Preview only; no production migration.**

## Deployment

- URL: <https://trana-website-preview.libreaccessibility.workers.dev/>
- Worker: `trana-website-preview`, LibreAccessibility account `32e5ce409bf8494ab7e611df6adaeaca`.
- Deployed version: `e66e2e9d-022b-46c1-b6f3-7d88079de0fd`.
- Static assets from `dist/`; no custom-domain routes, DNS changes, runtime WordPress requests or storage bindings.
- `workers_dev: true`; additional version preview URLs disabled.
- `robots.txt` disallows all crawlers. Every generated HTML page includes `noindex, nofollow, noarchive`, also sent in `X-Robots-Tag` on assets and 404 responses. This is a public preview, not access control.
- Deployed directly from the local build. No implementation commits, pushes, GitHub integration, Workers Builds, Deploy Hooks or WordPress plugin changes.

That deployment predates the local implementation commits. Versioning the foundation/data layer does not update the hosted preview or enable publishing automation; the presentation work remains separate while it is being edited.

The current TRANA website, WordPress editing and media remain unchanged. Content in this preview updates only after another successful build and deployment.

## Build

Use Node **24.16.0**, npm and the pinned dependency lockfile. No WordPress credentials are required.

```sh
npm ci
npm run check
npm test
SITE_URL=https://trana-website-preview.libreaccessibility.workers.dev npm run build
node scripts/qa/check-preview.mjs
```

The live build must fail if the public WordPress API is unavailable, invalid or inconsistently paginated. It builds in `.cache/next-build` and promotes the result to `dist/` only after success. A failed build preserves the last good output. The default request timeout is 60 seconds (`WORDPRESS_TIMEOUT_MS` overrides it). No snapshot fallback silently substitutes stale content.

After checks pass, `npx wrangler deploy` updates only this preview Worker. Always inspect `wrangler.jsonc`: keep its account, Worker name, `routes: []` and static asset configuration. Never deploy failed or unverified output. A failed build must not be followed by deployment of the old output as if it were new.

## Local review and QA

- Design comparison: <http://127.0.0.1:4187/> (`local-explorations/`, excluded from Git and the build).
- Astro: <http://127.0.0.1:4188/> (`npm run dev`, or `npm run preview` for the built output).
- Current interior page design review: <http://127.0.0.1:4188/disseny/>. The approved local visual baseline is v7 with the official TRANA logo; local changes are not automatically deployed.
- Cloudflare local runtime: <http://127.0.0.1:4189/> (`npm run preview:cloudflare -- --local --ip 127.0.0.1`).

Astro does not apply `public/_headers`; use Wrangler or the hosted preview to check Cloudflare response headers.

```sh
npm run test:browser
QA_BASE_URL=https://trana-website-preview.libreaccessibility.workers.dev npm run test:browser
```

Browser tests use installed Chrome and two workers. Failure traces and screenshots go to `.cache/playwright-results`.

## Verified on 15 November

1. Astro type checking: no errors, warnings or hints. Thirteen unit tests pass.
2. Live build: 259 published articles and the association page; 285 HTML documents including pagination and 404.
3. Preview guard: every generated HTML document, robots, headers and dedicated Worker configuration pass.
4. Deliberate API failure: build exits nonzero and the previous `dist/` remains byte-for-byte unchanged.
5. Thirteen browser tests pass locally and on the deployed Cloudflare URL: home/news/association/search, `lang`, headings, automated accessibility rules, skip-link focus, keyboard mobile menu, article links, EM-LINE, local search, robots, noindex, custom 404 and reflow at 320/375/768/1280 pixels.
6. The initial deployment's desktop and mobile layouts were compared with the then-approved v5 reference. Later local v7/interior designs require their own verification; these historical results do not cover them. Automated checks do not establish WCAG conformance.

Still required before launch: TRANA's content/brand review, legacy headings/alternative text/embeds review, screen-reader and user testing, publishing-event integration and failure monitoring. Production-domain migration needs its own approval and CMS/media continuity plan.

## Recovery and future publishing

The initial preview version above provides the deployment reference. A later failed build leaves both the last local output and the deployed Worker unchanged. To replace a bad preview, rebuild the reviewed source and deploy only after checks pass; do not change production routes or DNS.

GitHub/Workers Builds and a private Deploy Hook remain deferred until implementation may be committed and pushed. Validate publication, correction, scheduled posts, withdrawal, media changes, retries and urgent removal with TRANA before enabling that workflow. Keep the hook URL private and out of this repository.

References: [Cloudflare static assets](https://developers.cloudflare.com/workers/static-assets/), [SSG routing](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/), [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/).
