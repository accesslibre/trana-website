# Delivery plan

Planning baseline · 13 November 2026. Updated 15 November: native Astro is in the checkout with WordPress data, routes/search and noindex preview configuration. The current visual reference is the approved v7 home/navigation with the official TRANA logo; completed interior designs and the living style guide are reviewed at `/disseny/`. Claude leads visual design; Codex handles data/URL/SEO integration, infrastructure and verification. Local commits are authorized, with presentation work versioned separately from foundation/data. Production migration and publishing hooks are not activated.

## 1. Preparation — current stage

- [x] Establish the frontend repository with Markdown documentation.
- [x] Verify anonymous REST access and select page `8` and post `3589` for the first content review.
- [x] Record observed HTML issues and the proposed publishing flow.
- [x] Jordi selected the v7 home and desktop/mobile navigation, superseding the initial v5 pilot reference. Use the supplied official TRANA logo and Catalan UI. Earlier palettes and the fibre logo remain historical design references.
- [ ] Obtain TRANA’s final content, brand and usability review.
- [ ] Confirm who administers WordPress, Cloudflare, DNS and the GitHub integration.

## 2. Read-only frontend pilot

1. **Implemented locally:** Astro static output, TypeScript, pinned Node 24.16.0 and a dependency lockfile. The foundation/data and completed presentation work are versioned separately. Next, integrate the reviewed components into content-backed routes, complete page coverage and connect the forms. Pushes and deployment are outside this step.
2. **Implemented and tested:** public WordPress adapter with explicit pagination, home, association page, 259 published articles at their original dated paths, a paginated news list, local search and 404. A failed build preserves the previous output.
3. **Pending TRANA review:** agree heading changes, image alternatives, treatment of the article table and content rights.
4. **Initial checks passed:** type checking, 13 unit tests and 13 browser checks covering keyboard focus, mobile menu, reflow, search and automated accessibility rules. Continue with screen-reader and user review against [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/); this is not a conformance claim.
5. **Preview scope:** a separate Cloudflare Worker with no custom-domain routes, robots disallow and HTTP/HTML noindex. Keep the current public website, WordPress editing and media unchanged during review.

**Pilot acceptance:** the association page and EM-LINE article retain their agreed content; the news list links to the article; images and links work; unsupported content or API failures cannot silently produce an apparently successful empty site.

## 3. Publishing integration on staging

1. Connect Workers Builds to `main`; create and privately store its Deploy Hook.
2. Confirm WP Webhooks compatibility and event coverage before installing/configuring it. Send only the data needed to request a build; do not forward complete post metadata unnecessarily.
3. Publish a test story, correct it, change its slug, withdraw it, and publish a scheduled story. Verify the list, article URL, redirects and build status after each successful deployment. Remove the agreed test material afterwards.
4. Test an API outage, an invalid content response, duplicate delivery and a further edit during a build. Verify last-good deployment behavior, retry and the urgent-removal procedure.
5. Record observed publication delay, then agree an operational target with TRANA. A hook acknowledgement alone is not acceptance.

## 4. Full migration and launch

1. Inventory the remaining pages and news archive, documents, contact forms and external embeds. The initial API sample is not this inventory.
2. Agree the permanent WordPress origin and media strategy before changing the public hostname. Verify admin access, API reads and existing image URLs from the production build environment.
3. Prepare redirects and canonical URLs; verify that every migrated route has a destination. Decide which withdrawn URLs should return 404 or 410 instead of redirecting.
4. Obtain TRANA's content and usability review. Assign maintenance, failed-build monitoring and recovery responsibilities.
5. Release only after these checks and the separate launch authorization. Keep a documented rollback path.

No UI framework, launch date, paid plugin purchase or draft-preview system is fixed by this plan. The separate exercise-video project is outside this frontend's scope.
