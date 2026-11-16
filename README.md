# TRANA website

Accessible Astro frontend for TRANA EM Andorra. WordPress remains the editor and content source; Astro generates the public pages at build time.

**Stage: local/staging pilot, no production migration.** The current design reference is the approved v7 home and desktop/mobile navigation with the official TRANA logo. Claude handles visual design; Codex handles WordPress integration, URL mapping, SEO, infrastructure and verification. The foundation, data layer and completed presentation work are versioned separately. The existing TRANA website/admin/DNS remain unchanged.

The checkout includes the application and interior page designs at `/disseny/`. These review routes and the living style guide are maintained as project source. The current preview build includes them; excluding them from a future production build remains a launch task. Some pages use sample content and forms simulate confirmation without sending data. They are not the completed public website.

## Run locally

Use Node **24.16.0** (`.nvmrc` / `.node-version`).

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:4188/> or the [interior page review](http://127.0.0.1:4188/disseny/). Earlier design explorations remain available through `local-explorations/server.mjs` on port 4187; those local references are ignored by Git and excluded from the Astro output.

## Build and verify

```sh
npm run check
npm test
npm run build
node scripts/qa/check-preview.mjs
npm run preview:cloudflare -- --local --ip 127.0.0.1
# In another terminal:
npm run test:browser -- --workers=2
```

The Cloudflare runtime preview is on <http://127.0.0.1:4189/>. Browser tests use installed Chrome. `QA_BASE_URL` overrides the test target.

`npm run build` fetches all published posts and pages through the public WordPress REST API. It fails on network, validation or inconsistent-pagination errors. A build runs in a temporary output directory and replaces `dist/` only after success; an API failure preserves the last good build. Requests time out after 60 seconds by default (`WORDPRESS_TIMEOUT_MS` overrides this). Unit tests inject responses without calling the live CMS. No tests publish, edit or delete WordPress content.

The pilot provides the approved home, paginated `/noticies/`, original article and page URLs, `/cerca/` with a static search index, and a custom 404. The 15 November source contains 259 articles and 33 pages. Search includes informative published pages as well as news; it excludes empty forms, galleries and technical scaffolding. Yoast JSON supplies validated head metadata while the preview robots policy always takes precedence.

URL coverage is not a completed migration: 10 pages remain partial and 6 pending, including forms, galleries and unsupported embeds. Pending routes show an explicit notice and link to the original website. Recoverable HTML also needs editorial, media and accessibility review before launch. The newsletter on real routes offers contact rather than simulating a subscription; design forms clearly identify their confirmations as demonstrations that send nothing.

## Preview configuration

Hosted preview: <https://trana-website-preview.libreaccessibility.workers.dev/>. The 15 November 2026 update includes v7 and the integrated page/news/search templates. See [preview operations](ops/preview.md) for the deployed version, exact application source and verification record.

The approved v7 navigation and the interior page designs are available on the hosted preview, including `/disseny/`. Further local changes are not automatically deployed to Cloudflare. Design routes can use sample content and do not establish complete content or SEO parity with WordPress.

- `wrangler.jsonc`: dedicated **trana-website-preview** Worker in LibreAccessibility, static `dist/`, no custom-domain routes.
- `public/robots.txt`: all crawlers disallowed.
- `BaseLayout.astro`: `noindex, nofollow, noarchive` on every page.
- `public/_headers`: the same directives in `X-Robots-Tag` on served responses.
- `WORDPRESS_API_URL` / `WORDPRESS_ORIGIN`: public source configuration, defaulting to the current TRANA origin. No WordPress credentials are required.
- `SITE_URL`: set to the dedicated preview origin for a hosted preview. Keep the current WordPress origin separate from this value.

Workers Builds / GitHub integration, Deploy Hooks and WordPress event delivery are not activated while code remains unpushed. Preview deployment can use the local build. No public-domain cutover, CMS-origin change or WordPress plugin installation is part of this pilot.

## Documents

1. [Architecture](docs/architecture.md): publishing flow and CMS origin.
2. [WordPress audit](docs/wordpress-audit.md): sample content and HTML findings.
3. [Delivery plan](docs/plan.md): phases and acceptance checks.
4. [WordPress adapter](src/lib/wordpress/README.md): data interfaces, validation and public reads.
5. [Preview operations](ops/preview.md): Cloudflare setup, checks and rollback scope.
6. [Logo asset notes](docs/brand-assets.md): supplied official identity and local derivatives.
7. [Contributing](CONTRIBUTING.md): responsibilities, validation and commit-message conventions. Local commits are authorized; ongoing design work is kept separate.

Repository documentation is in English; the pilot UI is Catalan. Other language controls are deferred until translated content is available.

## Licensing

Original code: [AGPL-3.0-only](LICENSE). Documentation: [CC BY-SA 4.0](LICENSE.md). TRANA content, photos, logos and bundled fonts retain their respective rights and licences.
