# Delivery plan

Planning baseline · 13 November 2026.

## 1. Preparation — current stage

- [x] Establish the frontend repository with Markdown documentation.
- [x] Verify anonymous REST access and select page `8` and post `3589` for the first content review.
- [x] Record observed HTML issues and the proposed publishing flow.
- [ ] Agree the content, language, visual direction and pilot reviewer with TRANA.
- [ ] Confirm who administers WordPress, Cloudflare, DNS and the GitHub integration.

## 2. Read-only frontend pilot

1. Add Astro after this planning stage; choose supported versions and commit a lockfile then.
2. Build a small content adapter and the association, news-list and article templates. Handle WordPress pagination explicitly; record which content is included in the pilot rather than relying on an API default limit.
3. Review the two selected records with TRANA. Agree heading changes, image alternatives, treatment of the article table and content rights.
4. Use [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/) as the working accessibility target. Test keyboard navigation, focus, zoom/reflow and screen-reader reading order alongside automated checks and review with people who will use the site. A target is not a conformance claim.
5. Use a separate preview hostname. Keep the current public website, WordPress editing and media available during review.

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
