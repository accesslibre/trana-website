# Contributing

This repository implements the TRANA Astro pilot. WordPress remains the editor and content source. Work is local/staging only; production migration is pending.

## Design and responsibilities

- Use the approved v7 home and desktop/mobile navigation with the supplied official TRANA logo. Interior page designs are available at `/disseny/` in the local Astro preview; their sample content is not a completed WordPress migration.
- Claude handles visual design, page components and responsive presentation. Codex handles WordPress integration, URL mapping, SEO, infrastructure, verification and repository documentation.
- Coordinate changes to shared files, dependencies and interfaces through the orchestrator. The public adapter contract is documented in [src/lib/wordpress/README.md](src/lib/wordpress/README.md); session-specific agent notes remain outside the repository.
- Keep repository documentation and commit messages in English; the public UI is in Catalan. Add language controls only when translated content is available.

## Local work and verification

Use Node **24.16.0** and `npm ci`. See the [README](README.md#build-and-verify) for the available checks and local previews.

- Keep changes focused and preserve other contributors' uncommitted work.
- Run checks appropriate to the change. For documentation-only edits, review the diff, examples and local links. For code, run the relevant type, unit and build checks; for UI changes, also review desktop/mobile layouts, keyboard interaction and the affected browser tests.
- Check headings, accessible names, focus, contrast and reflow. Automated axe-core/Playwright checks support evaluation; they do not establish screen-reader usability or WCAG conformance. Record manual testing separately.
- Fetch published WordPress content only. Never run publication, editing or deletion tests against the live CMS.
- Keep preview indexing disabled in HTML metadata, response headers and `robots.txt`. Builds and ordinary checks must not change DNS, production routes, WordPress plugins or trigger live deploy hooks.
- Cite sources and distinguish observations from proposed work. Keep credentials, deploy-hook URLs, private correspondence and personal health information out of public issues and commits.

## Commits and handoff

**Current stage: local commits and deployment to the dedicated preview Worker are authorized.** Keep ongoing work separate from reviewed changes. Preview deployment must retain robots/HTML/HTTP noindex and pass the checks in [ops/preview.md](ops/preview.md). GitHub pushes, production-domain migration and CMS changes require their own task authorization.

Use [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):

```text
<type>[optional scope][!]: <summary>
```

| Type | Purpose |
| --- | --- |
| `feat` | Add functionality or a page |
| `fix` | Correct a defect, including accessibility or visual bugs |
| `docs` | Change documentation |
| `refactor` | Restructure code without changing behavior |
| `perf` | Improve performance |
| `test` | Add or improve tests |
| `build` | Change dependencies or build tooling |
| `ci` | Change CI or deployment automation |
| `chore` | Other maintenance |
| `style` | Formatting only; use `feat` or `fix` for visual UI changes |
| `revert` | Revert an earlier change |

- Write an English summary in the imperative, without a final period; aim for at most 72 characters for the full subject.
- Use a short, optional scope such as `pages`, `nav`, `wordpress`, `seo`, `a11y` or `infra`.
- Keep each commit to one coherent change. Stage specific paths in the shared checkout and review the staged diff before committing.
- Before staging, check new files for credentials, local configuration, generated reports and temporary notes. Keep `.env.example`, dependency lockfiles, source assets and their licences under version control; keep real secrets and build output out.
- Separate an optional body from the subject with a blank line. Explain the reason and relevant validation; reference an issue when applicable.
- Mark an incompatible change with `!` or a `BREAKING CHANGE:` footer and explain the required migration.

```text
feat(pages): add association page
fix(nav): restore focus when closing menu
test(wordpress): cover incomplete pagination
docs: update contribution guidelines
```

These conventions are reviewed manually; no commit-message hook or automated release process is configured. In a handoff or pull request, describe the resulting behavior, relevant checks and any remaining limitations.

## Licensing

Documentation uses [CC BY-SA 4.0](LICENSE.md); original code uses [AGPL-3.0-only](LICENSE). TRANA content and third-party assets retain their existing rights and licences.
