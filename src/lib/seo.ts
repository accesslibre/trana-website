import he from 'he';

export const PREVIEW_ROBOTS = 'noindex, nofollow, noarchive';
export const DEFAULT_DESCRIPTION = 'TRANA acompanya les persones amb esclerosi múltiple i les seves famílies a Andorra. Informació, tallers neurocognitius i defensa de drets.';
const genericTitle = 'Trana Esclerosi Múltiple Andorra - La web de la Esclerosis Múltiple a Andorra';

type JsonRecord = Record<string, unknown>;
export interface SeoMeta { name?: string; property?: string; content: string }
export interface SeoModel {
  title: string;
  description: string;
  robots: typeof PREVIEW_ROBOTS;
  canonical?: string;
  meta: SeoMeta[];
  jsonLd?: string;
  // Audit data stays in the server-side model; SeoHead never renders these fields.
  source: JsonRecord;
  decisions: string[];
}
export interface SeoInput { title: string; description?: string; seo?: JsonRecord }

function record(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function text(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const result = he.decode(value).replace(/[\u0000-\u001f\u007f]/gu, ' ').replace(/\s+/gu, ' ').trim();
  return result || undefined;
}
function publicUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || /[\u0000-\u0020\u007f]/u.test(value)) return undefined;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return undefined;
    return url.href;
  } catch { return undefined; }
}
function isoTime(value: unknown): string | undefined {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
    && !Number.isNaN(Date.parse(value)) ? value : undefined;
}
function dimension(value: unknown): string | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? String(value) : undefined;
}
export function isGenericSeoTitle(value: unknown): boolean {
  const title = text(value);
  return !!title && (title.replace(/\s*%\s*/gu, '').trim() === genericTitle || /%%[^%]+%%/u.test(title));
}

/** JSON-LD is inert data, but HTML parsers still recognise </script> inside its text. */
export function serializeJsonLd(value: unknown): string | undefined {
  if (!record(value) && !Array.isArray(value)) return undefined;
  try {
    return JSON.stringify(value).replace(/[<>&\u2028\u2029]/gu, (character) => ({
      '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029',
    })[character]!);
  } catch { return undefined; }
}

/** Yoast JSON only. Never import yoast_head HTML or enable production indexing here. */
export function buildSeoModel({ title: fallbackTitle, description: fallbackDescription, seo }: SeoInput): SeoModel {
  const source = record(seo) ? seo : {};
  const decisions: string[] = [];
  const specificTitle = text(fallbackTitle) ?? 'TRANA';
  const originalTitle = text(source.title);
  const title = originalTitle && !isGenericSeoTitle(originalTitle) ? originalTitle : specificTitle;
  if (originalTitle && isGenericSeoTitle(originalTitle)) decisions.push('generic-source-title-fallback');
  if (!originalTitle) decisions.push('missing-source-title-fallback');
  const description = text(source.description) ?? text(fallbackDescription) ?? DEFAULT_DESCRIPTION;
  if (!text(source.description)) decisions.push('missing-source-description-fallback');
  const canonical = publicUrl(source.canonical);
  // In particular, do not invent canonicals for the 32 source pages which have none.
  if (!canonical) decisions.push(source.canonical ? 'invalid-source-canonical-omitted' : 'source-canonical-absent');
  if (record(source.robots)) {
    decisions.push(source.robots.index === 'noindex' ? 'source-noindex-recorded' : 'source-index-policy-recorded');
  }
  decisions.push('preview-robots-override');

  const meta: SeoMeta[] = [];
  const property = (key: string, value?: string) => { if (value) meta.push({ property: key, content: value }); };
  const name = (key: string, value?: string) => { if (value) meta.push({ name: key, content: value }); };
  const socialTitle = (value: unknown) => text(value) && !isGenericSeoTitle(value) ? text(value) : title;
  property('og:title', socialTitle(source.og_title));
  property('og:description', text(source.og_description) ?? description);
  property('og:type', source.og_type === 'article' ? 'article' : 'website');
  property('og:locale', text(source.og_locale) ?? 'ca_AD');
  property('og:url', publicUrl(source.og_url) ?? canonical);
  property('og:site_name', text(source.og_site_name));
  property('article:publisher', publicUrl(source.article_publisher));
  property('article:published_time', isoTime(source.article_published_time));
  property('article:modified_time', isoTime(source.article_modified_time));
  name('author', text(source.author));

  const images = Array.isArray(source.og_image) ? source.og_image : [];
  const imageUrls = new Set<string>();
  for (const image of images) {
    if (!record(image)) continue;
    const url = publicUrl(image.url);
    if (!url || imageUrls.has(url)) continue;
    imageUrls.add(url);
    property('og:image', url);
    property('og:image:width', dimension(image.width));
    property('og:image:height', dimension(image.height));
    property('og:image:type', text(image.type));
    property('og:image:alt', text(image.alt));
  }
  const card = text(source.twitter_card);
  if (card && ['summary', 'summary_large_image', 'app', 'player'].includes(card)) name('twitter:card', card);
  name('twitter:site', text(source.twitter_site));
  name('twitter:creator', text(source.twitter_creator));
  // Yoast normally relies on OG fallbacks; emit overrides only when supplied.
  if (text(source.twitter_title)) name('twitter:title', socialTitle(source.twitter_title));
  name('twitter:description', text(source.twitter_description));
  name('twitter:image', publicUrl(source.twitter_image));
  if (record(source.twitter_misc)) {
    Object.entries(source.twitter_misc).forEach(([label, value], index) => {
      if (!text(value)) return;
      name(`twitter:label${index + 1}`, text(label));
      name(`twitter:data${index + 1}`, text(value));
    });
  }

  let jsonLd = serializeJsonLd(source.schema);
  if (jsonLd) {
    const schema: unknown = JSON.parse(jsonLd);
    const nodes = record(schema) && Array.isArray(schema['@graph']) ? schema['@graph'] : Array.isArray(schema) ? schema : [schema];
    for (const node of nodes) {
      if (!record(node)) continue;
      const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
      if (types.includes('WebPage') && isGenericSeoTitle(node.name)) {
        node.name = title;
        decisions.push('generic-schema-page-name-fallback');
      }
    }
    jsonLd = serializeJsonLd(schema);
  } else if (source.schema !== undefined) decisions.push('invalid-source-schema-omitted');

  return { title, description, robots: PREVIEW_ROBOTS, canonical, meta, jsonLd, source, decisions };
}
