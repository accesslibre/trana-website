# Public WordPress adapter

Import `getAllPosts`, `getPageBySlug` and the `WordPressPost`, `WordPressPage`,
`WordPressImage` types from `index.ts`. The default client caches promises within
one build process, including rejections. Restart a failed build to retry.

`WORDPRESS_API_URL` defaults to `https://www.tranandorra.org/wp-json/wp/v2`.
`WORDPRESS_ORIGIN` defaults to the API origin; set it explicitly if an API proxy
is used. Public links must match this origin and have a clean permalink pathname.

Requests are GET only, explicitly `status=publish`, `context=view`, without
credentials. Posts are fetched sequentially in batches of 100 using the real
`X-WP-Total` and `X-WP-TotalPages` headers, then ordered by date descending.
Missing headers, incomplete/duplicate results, changed totals, non-public records,
malformed responses and HTTP errors fail the build. Requests time out after 60s by default (`WORDPRESS_TIMEOUT_MS` overrides this).
There is no snapshot or silent empty-list fallback. An explicitly zero published
total is the only successful empty collection.

Titles and excerpts are plain text with entities decoded (`he`). Body HTML uses
an explicit `sanitize-html` allowlist, removes executable content, event handlers,
inline styles, forms and frames, and changes body h1 to h2. Featured images use
WordPress's supplied alt text (including empty alt); no alternatives are invented.
Dates preserve the WordPress local timestamp without inventing timezone offsets.

Tests use injected fetch via `createWordPressClient` with no live requests:
`node --import tsx --test tests/unit/wordpress.test.ts`.
