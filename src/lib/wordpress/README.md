# Public WordPress adapter

Import `getAllPosts`, `getAllPages`, `getPageBySlug` and the `WordPressPost`, `WordPressPage`,
`WordPressImage` types from `index.ts`. The default client caches promises within
one build process, including rejections. Restart a failed build to retry.

`WORDPRESS_API_URL` defaults to `https://www.tranandorra.org/wp-json/wp/v2`.
`WORDPRESS_ORIGIN` defaults to the API origin; set it explicitly if an API proxy
is used. Public links must match this origin and have a clean permalink pathname.

Requests are GET only, explicitly `status=publish`, `context=view`, without
credentials. Both posts and pages are fetched sequentially in batches of 100 using the real
`X-WP-Total` and `X-WP-TotalPages` headers, then ordered by date descending.
Missing headers, incomplete/duplicate results, changed totals, non-public records,
malformed responses and HTTP errors fail the build. Requests time out after 60s by default (`WORDPRESS_TIMEOUT_MS` overrides this).
There is no snapshot or silent empty-list fallback. An explicitly zero published
total is the only successful empty collection.

`getAllPages(): Promise<WordPressPage[]>` is available on both the factory client
and the module's shared client. Its collection cache is independent of posts and
slug lookups, with the same rejection caching and pagination checks. A published
page may use `/` as its original path (the WordPress homepage); posts may not.
`getPageBySlug(slug)` keeps its existing lookup/cache behaviour and also accepts
the homepage path. This adapter returns all published pages without deciding
which pages the frontend can render; route coverage and collisions belong to the
route layer.

Titles and excerpts are plain text with entities decoded (`he`). Body HTML uses
an explicit `sanitize-html` allowlist, removes executable content, event handlers,
inline styles, forms and frames, and changes body h1 to h2. Featured images use
WordPress's supplied alt text (including empty alt); no alternatives are invented.
Dates preserve the WordPress local timestamp without inventing timezone offsets.

Posts and pages optionally expose `seo?: Record<string, unknown>`, copied from
WordPress's object-valued `yoast_head_json` when present. Missing or non-object
values are omitted; Yoast is not required. This is source JSON data, not a promise
that every Yoast property is valid for the frontend. In particular, original
robots directives and titles are preserved for the SEO layer to assess without
changing the preview's noindex policy. Nested strings can contain markup: consumers
must escape rendered text and safely serialize structured data. The separate
`yoast_head` HTML field is never returned or inserted into sanitized body content.

Tests use injected fetch via `createWordPressClient` with no live requests:
`node --import tsx --test tests/unit/wordpress.test.ts`.
