# WordPress audit

Read-only checks on **13 November 2026**; the initial API probes started at 22:25 UTC. Anonymous HTTPS requests from the preparation Mac; no WordPress administration or writes. REST base: `https://www.tranandorra.org/wp-json`.

## Verified API responses

| Request | Result |
| --- | --- |
| [`/wp-json/`](https://www.tranandorra.org/wp-json/) | HTTP 200; native `wp/v2` and a `divi/v1` namespace advertised |
| [`/wp/v2/posts?per_page=3&_embed`](https://www.tranandorra.org/wp-json/wp/v2/posts?per_page=3&_embed) | HTTP 200; three published posts; headers reported 259 posts and 87 pages for this page size |
| [`/wp/v2/pages?slug=acerca-de&_embed`](https://www.tranandorra.org/wp-json/wp/v2/pages?slug=acerca-de&_embed) | HTTP 200; page `8`, “Trana EM Andorra” |
| [`/wp/v2/media/3576`](https://www.tranandorra.org/wp-json/wp/v2/media/3576?_fields=id,source_url,alt_text,media_details,mime_type) | HTTP 200; JPEG metadata, dimensions and image sizes available; `alt_text` empty |

Counts are a snapshot. The archive must be paginated deliberately; the three-post request does not export all news. [WordPress pagination contract](https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/).

## Pilot records

| Record | Existing public URL | Observed body HTML |
| --- | --- | --- |
| Page `8`, slug `acerca-de` | [Trana EM Andorra](https://www.tranandorra.org/acerca-de/) | Four paragraphs, one `h4`, one image and a list; image `alt` empty |
| Post `3589`, slug `em-line-ajudeu-nos-a-la-seva-implantancio` | [EM-LINE article](https://www.tranandorra.org/2026/06/em-line-ajudeu-nos-a-la-seva-implantancio/) | Two `h1` elements, two images with empty `alt`, and a one-row/two-cell table |

1. Review the page's heading hierarchy under the frontend title. The article body must not acquire extra top-level headings simply by being inserted into a template.
2. Inspect the article's table before deciding how to replace it. Its markup has inline layout styles and no table headers; the pilot must preserve the meaning, not assume tabular data.
3. Decide whether each image is informative or decorative. Empty alternatives were also observed on all three sampled featured-image records; this alone does not establish each image's intended purpose. Do not generate alternatives from filenames. [WordPress media fields](https://developer.wordpress.org/rest-api/reference/media/).
4. The API exposes a Divi namespace, but the sampled bodies did not show raw Divi shortcodes. This does not establish that the other pages or the full archive are independent of the theme.

The existing routes use both a page slug and dated article paths. Preserve these by default for the pilot; any new Catalan URL scheme needs an explicit migration map. `/noticies/` is a proposed list route, not a verified existing destination.

## Still unverified

1. WordPress admin access, versions, installed webhook plugins and outbound delivery.
2. Scheduled publishing, edits, withdrawal and media-change events.
3. Full archive, menus, forms, documents, embeds and multilingual configuration.
4. Editorial ownership of alternatives, permissions for reused media and acceptable publication delay.

No deploy hook was called, no article was created and no full article HTML or media files are committed here. A separate web-reader request to the article timed out; the successful evidence above is from the REST API, not an end-to-end frontend check.
