# TRANA preview operations

Updated 15 November 2026. **Preview only; no production migration.**

## Deployment

- URL: <https://trana-website-preview.libreaccessibility.workers.dev/>
- Worker: `trana-website-preview`, LibreAccessibility account `32e5ce409bf8494ab7e611df6adaeaca`.
- Deployed version: `28211539-c8ed-4936-95f6-d8bcefbfa6fe`.
- Reviewed application source: `25d319f2268628f62f02a4c0ea473e16663c020f`.
- Static assets from `dist/`; no custom-domain routes, DNS changes, runtime WordPress requests or storage bindings.
- `workers_dev: true`; additional version preview URLs disabled.
- `robots.txt` disallows all crawlers. Every generated HTML page includes `noindex, nofollow, noarchive`, also sent in `X-Robots-Tag` on assets and 404 responses. This is a public preview, not access control.
- Deployed directly from the reviewed local build and implementation commits. GitHub pushes, Workers Builds, Deploy Hooks and WordPress plugin changes remain outside this task.

This deployment includes the approved v7 home/navigation, the interior design gallery, and the WordPress route/search/SEO integration. Builds include `/disseny/` for review; a future production build must exclude those demo routes while retaining their source and the style guide in the repository. Source covers 259 articles and 33 published pages, but 10 pages remain partial and 6 pending. Explicit notices link to the original content; URL coverage does not certify a completed migration.

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

1. Astro type checking: 62 files, no errors, warnings or hints. All 31 unit tests pass.
2. Live build: 259 published articles and 33 pages; 333 HTML documents including pagination, design review and 404. The static search index contains 259 articles and 28 informative pages.
3. Preview guard: every generated HTML document, robots, headers and dedicated Worker configuration pass.
4. The build inputs remained unchanged throughout generation and QA. The existing atomic build mechanism was previously tested with a deliberate API failure: it exits nonzero and preserves the last good `dist/`. The expanded adapter tests also cover page pagination failures and timeouts.
5. Browser coverage includes original page/article paths, pagination, local search, real navigation destinations, explicit migration fallbacks, demo forms with and without JavaScript, live error summaries, automated accessibility rules, skip links, forward/reverse keyboard navigation, pinned-menu focus, donation-button overlap, robots/noindex, custom 404 and reflow at 320/375/768/1280 pixels. Results for this deployment are recorded below.
6. Deployed desktop/mobile screenshots were reviewed against the approved v7 presentation. Automated rules and keyboard checks do not establish screen-reader usability or WCAG conformance.

All 26 browser cases have passed locally; the complete hosted run passes **26/26**. Hosted verification uses installed Chrome. If a raw HTTP client receives a Cloudflare edge 403, verify in Chrome before diagnosing the application.

Still required before launch: TRANA's content/brand review, legacy headings/alternative text/embeds review, screen-reader and user testing, publishing-event integration and failure monitoring. Production-domain migration needs its own approval and CMS/media continuity plan.

## Recovery and future publishing

The version and source commit above identify this deployment. The earlier pilot version was `e66e2e9d-022b-46c1-b6f3-7d88079de0fd`. A later failed build leaves both the last local output and the deployed Worker unchanged. To replace a bad preview, rebuild reviewed source and deploy only after checks pass; do not change production routes or DNS.

GitHub/Workers Builds and a private Deploy Hook remain deferred. Validate publication, correction, scheduled posts, withdrawal, media changes, retries and urgent removal with TRANA before enabling that workflow. Keep the hook URL private and out of this repository.

References: [Cloudflare static assets](https://developers.cloudflare.com/workers/static-assets/), [SSG routing](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/), [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/).
