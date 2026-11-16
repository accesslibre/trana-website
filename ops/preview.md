# TRANA preview operations

Updated 16 November 2026. **Preview only; no production migration.**

## Deployment

- URL: <https://trana-website-preview.libreaccessibility.workers.dev/>
- Worker: `trana-website-preview`, LibreAccessibility account `32e5ce409bf8494ab7e611df6adaeaca`.
- Deployed version: `ed99b5a1-8750-4a0d-b96a-cb5d3020e277`.
- Reviewed application source: `951e77eeff86ecf19a2d75a98efc78e0f24cee08`.
- Static assets from `dist/`; no custom-domain routes, DNS changes, runtime WordPress requests or storage bindings.
- `workers_dev: true`; additional version preview URLs disabled.
- `robots.txt` disallows all crawlers. Every generated HTML page includes `noindex, nofollow, noarchive`, also sent in `X-Robots-Tag` on assets and 404 responses. This is a public preview, not access control.
- Implementation commits were pushed to `origin/main` with explicit authorization. The reviewed local build was then deployed manually, tagged `pages32-951e77e`; the version message records the complete application source SHA. Workers Builds, Deploy Hooks and WordPress plugin changes remain deferred.

This deployment includes the approved v7 home/navigation, dedicated Claude designs for all 32 non-home WordPress pages, the interior design gallery, and the WordPress route/search/SEO integration. Builds include `/disseny/` for review; a future production build must exclude those demo routes while retaining their source and the style guide in the repository. Source covers 259 articles and 33 published pages. Some pages retain partial or pending migration status: dedicated layouts do not activate missing services or recover missing source content. Explicit notices and contact alternatives preserve these distinctions; URL and design coverage do not certify a completed migration.

The current TRANA website, WordPress editing and media remain unchanged. Content in this preview updates only after another successful build and deployment. The page-family registry is `src/lib/page-presentations.ts`; each family owns its components, scoped styles and content guards. Unsupported source changes fall back to the generic presentation, while pending fallbacks continue to hide unavailable form/shortcode bodies.

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

## Verified on 16 November

1. Astro type checking: 97 files, no errors, warnings or hints. All **63 unit tests pass**.
2. Reviewed live build: 259 published articles and 33 pages; **333 HTML documents**, including pagination, design review and 404. The static search index contains 259 articles and 28 informative pages.
3. Preview guard: all generated HTML documents, robots, headers and the dedicated Worker configuration pass. Hosted browser checks confirm HTML/HTTP indexing protection, robots and custom 404 behavior, including a missing asset.
4. The 145 source, public asset, script, test and configuration inputs remained unchanged between the source freeze, successful build, local QA and implementation commits. No source was edited during the Claude commits or the deployment. The earlier deliberate API-failure check proved that a failed build preserves the last good `dist/`; adapter unit tests also cover failures and timeouts.
5. The complete browser suite passes **60/60 locally and 60/60 on the hosted preview** using installed Chrome and two workers. It includes all 32 original page URLs with dedicated families, reflow, original article routes, pagination, local search, navigation destinations, honest pending services, demo forms with and without JavaScript, error summaries, automated accessibility rules, skip links, sticky-control focus, donation overlap and 404/indexing protections.
6. Claude's page-family review and the independent content/keyboard audits identified and corrected History overflow, a decorative monogram contrast error, pending fallback exposure and source-coverage gaps. Rechecks confirm that the reported injected cases are rejected while current content and the 26 author-index links remain available. These are bounded checks, not proof for arbitrary future source changes.

The design commits were made by the three Claude sessions; Codex committed route integration, regression checks and the focused header correction. All retain the human Git author and verified model/effort co-author metadata under CONTRIBUTING.

Automated rules and keyboard checks do not establish screen-reader usability or WCAG conformance. Manual contrast checks cover the documented pseudo-element cases; no real screen-reader or user study has been completed. The shared menu/search still relies on JavaScript, with working content and footer navigation when JavaScript is unavailable.

Still required before launch: TRANA's editorial/brand review, unavailable external resources and legacy dates/privacy details, real membership/newsletter delivery, screen-reader and user testing, media/permalink/Yoast/sitemap review, publishing-event integration and failure monitoring. Production-domain migration and opening indexing need their own authorization; preview must remain blocked.

## Recovery and future publishing

The version and source commit above identify this deployment. The previous preview was `28211539-c8ed-4936-95f6-d8bcefbfa6fe`; the earlier pilot was `e66e2e9d-022b-46c1-b6f3-7d88079de0fd`. A later failed build leaves both the last local output and the deployed Worker unchanged. To replace a bad preview, rebuild reviewed source and deploy only after checks pass; do not change production routes or DNS.

Automatic GitHub/Workers Builds and a private Deploy Hook remain deferred; the reviewed source push and this manual preview deployment are complete. Validate publication, correction, scheduled posts, withdrawal, media changes, retries and urgent removal with TRANA before enabling that workflow. Keep the hook URL private and out of this repository.

References: [Cloudflare static assets](https://developers.cloudflare.com/workers/static-assets/), [SSG routing](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/), [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/).
