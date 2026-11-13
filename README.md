# TRANA website

Planning an accessible frontend for TRANA EM Andorra, with WordPress as the content editor and Astro generating the public website.

**Status: Markdown documentation only.** No application, plugin installation, deploy hook or hosting configuration has been created. The existing TRANA website remains the live service.

## Working direction

1. TRANA editors continue publishing through WordPress.
2. WP Webhooks requests a Cloudflare build when relevant published content changes.
3. Workers Builds checks out the frontend's `main` branch. Astro fetches published content from the WordPress REST API and generates static pages.
4. Cloudflare serves the successful build. A failed build must leave the previous deployment available.

The proposed host is **Cloudflare Workers with Static Assets and Workers Builds**. Pages is an alternative, not a second deployment target. WordPress draft previews are a later feature.

## First pilot

| Template | Content to review first |
| --- | --- |
| Association page | “Qui som?” / Trana EM Andorra, WordPress page `8` |
| News list | Published posts, including the selected EM-LINE article |
| News article | EM-LINE, WordPress post `3589` |

The public API was reachable on **13 November 2026**. The sampled article needs heading and table review; image alternatives also need an editorial decision. This is a sample, not an audit of the whole archive.

## Project documents

1. [Architecture and publishing](docs/architecture.md): content flow, events, failures and the CMS origin.
2. [WordPress audit](docs/wordpress-audit.md): verified endpoints, pilot records and observed HTML.
3. [Delivery plan](docs/plan.md): phases, acceptance checks and decisions for TRANA.

Repository documentation is in English. The existing TRANA content is predominantly Catalan; the frontend's language requirements still need agreement with TRANA.

## Licensing

Documentation: [CC BY-SA 4.0](LICENSE.md). The planned code license is AGPL-3.0 under LibreAccessibility's repository policy; add it when implementation begins. TRANA's articles, photographs and third-party material retain their own rights.
