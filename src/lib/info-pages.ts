// Structured presentation for three WordPress information pages (que-es-lem, glossari-em,
// deteriorament-cognitiu-en-la-em). The builders only REORGANISE the sanitised WordPress HTML:
// every text fragment and image of the source must reappear, or the builder returns null and the
// route falls back to the generic ArticlePage. This keeps editorial changes in WordPress safe.
import { plainText, type WordPressPage } from './wordpress/index';

export interface InfoImage { src: string; alt: string; width?: number; height?: number }
export type InfoBlock =
  | { kind: 'p'; html: string }
  | { kind: 'figure'; image: InfoImage }
  | { kind: 'list'; ordered: boolean; items: { html: string; number?: number }[] };

export interface EmInfo {
  kind: 'em'; lede: string; intro: string[]; typesIntro?: string;
  types: { id: string; name: string; image?: InfoImage; paragraphs: string[] }[];
  source?: string;
}
export interface GlossaryTerm { id: string; term: string; letter: string; html: string; images: InfoImage[] }
export interface GlossaryInfo { kind: 'glossary'; terms: GlossaryTerm[]; credits?: { html: string; images: InfoImage[] } }
export interface CognitiveInfo {
  kind: 'cognitive'; kicker?: string; lede?: string; banner: InfoImage[];
  sections: { id: string; number?: number; heading: string; blocks: InfoBlock[]; figures: InfoImage[] }[];
  credits?: { html: string; images: InfoImage[] };
}
export interface InfoResource {
  href: string; label?: string; images: InfoImage[];
  type: 'PDF' | 'Google Drive' | 'Notícia' | 'Vídeo' | 'Web'; host: string; easyRead: boolean;
  /** The link already appears inside a text paragraph; its card is a shortcut, not the main resource. */
  inline: boolean;
}
/**
 * Editorial notices registered by hand after checking the published sources (not fetched at build time).
 * They never replace a link: the original destination stays visible next to the notice.
 */
export interface ResourceNotice { checked: string; text: string }
export const RESOURCE_NOTICES: Record<string, ResourceNotice> = {
  // Google Drive answers HTTP 404 to anonymous GET and HEAD (Codex content audit and Claude A, 15/11/2026).
  'https://drive.google.com/file/d/1S1HLnCXvcIBpcJsiU20cMeCEre1-wYug/view?usp=sharing': {
    checked: '2026-11-15',
    text: 'Ara mateix aquest enllaç de Google Drive no obre la presentació: el fitxer no existeix o ja no és públic.',
  },
};
export const PAGE_NOTICES: Record<string, string> = {
  // The source text promises a video, but the published WordPress page contains only the four PDF documents.
  'conveni-sobre-els-drets-de-les-persones-amb-discapacitat-cdpd': 'El text original esmenta un vídeo d’explicació, però la pàgina publicada no inclou cap enllaç al vídeo. Si el necessites, demana’l a TRANA.',
};
export interface ResourceInfo { kind: 'resources'; lede?: string; notes: string[]; resources: InfoResource[]; figures: InfoImage[] }
export type InfoPage = EmInfo | GlossaryInfo | CognitiveInfo | ResourceInfo;

const IMG = /<img\b[^>]*>/giu;
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'iu'))?.[1];
const num = (v?: string) => (v && /^\d+$/u.test(v) ? Number(v) : undefined);
const fileOf = (src: string) => src.split('/').pop() ?? src;

// Neutral descriptions of what the FEM Catalunya charts show (axis labels and line shape only).
const FEM_ALT: Record<string, string> = {
  'fem-grafiquesem-cat-01': 'Gràfic de FEM Catalunya amb la discapacitat creixent a l’eix vertical i el temps a l’horitzontal. La línia puja de manera contínua, sense pics.',
  'fem-grafiquesem-cat-02': 'Gràfic de FEM Catalunya amb la discapacitat creixent a l’eix vertical i el temps a l’horitzontal. La línia fa diversos pics i, al final, puja de manera contínua.',
  'fem-grafiquesem-cat-03': 'Gràfic de FEM Catalunya amb la discapacitat creixent a l’eix vertical i el temps a l’horitzontal. La línia fa pics separats i, després de cada pic, queda una mica més amunt.',
  'fem-grafiquesem-cat-04': 'Gràfic de FEM Catalunya amb la discapacitat creixent a l’eix vertical i el temps a l’horitzontal. La línia puja de manera contínua i té pics al llarg del recorregut.',
};
// Labelled medical illustrations: describe only the visible labels. Other images keep the source alt (empty).
const ILLUSTRATION_ALT: Record<string, string> = {
  'mielina': 'Il·lustració d’A.D.A.M., amb rètols en castellà, que assenyala la degeneració de la mielina del cervell i de la medul·la espinal.',
  'puncio-lumbar': 'Il·lustració d’A.D.A.M., amb rètols en castellà, d’una punció lumbar entre les vèrtebres L3 i L4, amb la medul·la espinal, les meninges i un recipient de líquid cefaloraquidi (LCR).',
};
function describe(src: string, alt: string): string {
  if (alt) return alt;
  const file = fileOf(src);
  for (const [key, value] of Object.entries({ ...FEM_ALT, ...ILLUSTRATION_ALT })) if (file.startsWith(key)) return value;
  return '';
}
export function imagesIn(html: string): InfoImage[] {
  return [...html.matchAll(IMG)].map(([tag]) => {
    const src = attr(tag, 'src') ?? '';
    return { src, alt: describe(src, attr(tag, 'alt') ?? ''), width: num(attr(tag, 'width')), height: num(attr(tag, 'height')) };
  }).filter((image) => image.src);
}
const withoutImages = (html: string) => html.replace(IMG, '');
/** Inline HTML without images and without leading/trailing line breaks or empty bold wrappers. */
function inline(html: string): string {
  return withoutImages(html)
    .replace(/<(b|strong)>\s*<\/\1>/giu, '')
    .replace(/^(\s|<br\s*\/?>|&nbsp;| )+/iu, '')
    .replace(/(\s|<br\s*\/?>|&nbsp;| )+$/iu, '')
    .trim();
}
const textOf = (html: string) => plainText(withoutImages(html)).replace(/ /gu, ' ').trim();
const fold = (html: string) => plainText(html).normalize('NFC').toLocaleLowerCase('ca').replace(/[^\p{L}\p{N}]+/gu, '');
export function slugify(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/·/gu, '').replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '') || 'seccio';
}

/** Top-level blocks of the flat WordPress block markup. */
function topBlocks(html: string) {
  return [...html.matchAll(/<(p|figure|h[1-6]|ol|ul|table)\b([^>]*)>([\s\S]*?)<\/\1>/giu)]
    .map(([, tag, attrs, inner]) => ({ tag: tag.toLowerCase(), attrs, inner }));
}

/** True when the reorganised pieces contain exactly the source text (letters and digits, in order) and images. */
function covers(source: string, pieces: string[], images: InfoImage[]): boolean {
  const sourceImages = imagesIn(source).map((i) => i.src).sort();
  const usedImages = images.map((i) => i.src).sort();
  return fold(source) === fold(pieces.join(' ')) && JSON.stringify(sourceImages) === JSON.stringify(usedImages);
}

function buildEm(page: WordPressPage): EmInfo | null {
  const info: EmInfo = { kind: 'em', lede: '', intro: [], types: [] };
  const pieces: string[] = []; const images: InfoImage[] = [];
  let current: EmInfo['types'][number] | undefined;
  for (const block of topBlocks(page.html)) {
    const pics = imagesIn(block.inner);
    if (block.tag === 'figure') {
      if (!pics.length) continue; // Embedded video placeholder: handled as a migration resource.
      // One chart per type. Several images, or a figure outside a type, would not all be rendered: fall back.
      if (pics.length !== 1 || !current || current.image) return null;
      current.image = pics[0]; images.push(pics[0]); continue;
    }
    if (block.tag !== 'p' || pics.length) return null;
    const html = inline(block.inner); const text = textOf(block.inner);
    if (!text) continue;
    pieces.push(html);
    const boldOnly = /^<(strong|b)>[\s\S]*<\/\1>$/iu.test(html) && !/<\/(strong|b)>[\s\S]*<(strong|b)>/iu.test(html);
    if (boldOnly) { current = { id: `tipus-${slugify(text)}`, name: text, paragraphs: [] }; info.types.push(current); continue; }
    if (/^font\s*:/iu.test(text)) { info.source = html; current = undefined; continue; }
    if (current) { current.paragraphs.push(html); continue; }
    if (!info.lede) info.lede = html; else info.intro.push(html);
  }
  // The paragraph right before the first type introduces the list of types.
  if (info.types.length && info.intro.length && /:\s*$/u.test(textOf(info.intro.at(-1)!))) info.typesIntro = info.intro.pop();
  if (!info.lede || info.types.length < 2 || info.types.some((t) => !t.paragraphs.length)) return null;
  return covers(page.html, pieces, images) ? info : null;
}

function buildGlossary(page: WordPressPage): GlossaryInfo | null {
  const terms: GlossaryTerm[] = []; const pieces: string[] = []; const images: InfoImage[] = [];
  let pending: InfoImage[] = []; let credits: GlossaryInfo['credits'];
  const ids = new Set<string>();
  for (const [, inner] of page.html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/giu)) {
    const pics = imagesIn(inner);
    const html = inline(inner); const text = textOf(inner);
    if (!text) { pending.push(...pics); continue; } // Image-only paragraph: shown with the next term.
    pieces.push(html);
    if (/^informació revisada/iu.test(text)) {
     if (credits) return null;
     credits = { html, images: pics }; images.push(...pics); continue;
    }
    // Term = leading bold text, or the text before the first full stop when the source did not bold it.
    let term: string; let definition: string;
    const bold = html.match(/^<(strong|b)>([\s\S]*?)<\/\1>([\s\S]*)$/iu);
    if (bold) { term = textOf(bold[2]); definition = bold[3]; }
    else {
      const plain = html.match(/^([^.<]{2,80})\.\s*([\s\S]+)$/u);
      if (!plain) return null;
      term = plain[1]; definition = plain[2];
    }
    term = term.replace(/\s*\.\s*$/u, '').trim();
    definition = definition.replace(/^\s*\.\s*/u, '').trim();
    if (!term || !textOf(definition)) return null;
    let id = `terme-${slugify(term)}`; while (ids.has(id)) id += '-2'; ids.add(id);
    const letter = term.normalize('NFD').replace(/\p{M}/gu, '').charAt(0).toLocaleUpperCase('ca');
    const termImages = [...pending, ...pics];
    terms.push({ id, term, letter, html: definition, images: termImages }); images.push(...termImages);
    pending = [];
  }
  // Trailing image-only paragraphs are shown with the last term.
  if (pending.length && terms.length) { terms.at(-1)!.images.push(...pending); images.push(...pending); }
  if (terms.length < 10) return null;
  return covers(page.html, pieces, images) ? { kind: 'glossary', terms, credits } : null;
}

function buildCognitive(page: WordPressPage): CognitiveInfo | null {
  const info: CognitiveInfo = { kind: 'cognitive', banner: [], sections: [] };
  const pieces: string[] = []; const images: InfoImage[] = []; const lede: string[] = [];
  let section: CognitiveInfo['sections'][number] | undefined;
  const push = (block: InfoBlock) => {
    if (!section) return false;
    const last = section.blocks.at(-1);
    if (block.kind === 'list' && last?.kind === 'list' && last.ordered === block.ordered) last.items.push(...block.items);
    else section.blocks.push(block);
    return true;
  };
  for (const block of topBlocks(page.html)) {
    const pics = imagesIn(block.inner); const html = inline(block.inner); const text = textOf(block.inner);
    if (block.tag === 'table') { if (text || section) return null; info.banner.push(...pics); images.push(...pics); continue; }
    if (/^h[1-5]$/u.test(block.tag) && !section) {
      if (!text) continue;
      pieces.push(html);
      if (!info.kicker && block.tag === 'h2') info.kicker = html; else lede.push(html);
      continue;
    }
    if (block.tag === 'ol') {
      const items = [...block.inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/giu)].map((m) => m[1]);
      if (items.length !== 1 || pics.length) return null;
      const heading = textOf(items[0]).replace(/\s*:\s*$/u, '');
      pieces.push(items[0]);
      const number = num(attr(block.attrs, 'start')) ?? (info.sections.length + 1);
      section = { id: `seccio-${number}`, number, heading, blocks: [], figures: [] };
      info.sections.push(section);
      continue;
    }
    if (block.tag === 'h6') {
      if (info.credits) return null; // A second credits block would replace the first one.
      info.credits = { html, images: pics }; images.push(...pics); if (text) pieces.push(html);
      continue;
    }
    if (block.tag !== 'p') return null;
    if (pics.length) { if (!section) return null; section.figures.push(...pics); images.push(...pics); }
    if (!text) continue;
    pieces.push(html);
    const dash = html.match(/^((?:<(?:b|strong)>\s*)?)-\s*([\s\S]*)$/u);
    const numbered = html.match(/^(\d+)\s*-\s*([\s\S]*)$/u);
    if (dash) { if (!push({ kind: 'list', ordered: false, items: [{ html: dash[1] + dash[2] }] })) return null; }
    else if (numbered) { if (!push({ kind: 'list', ordered: true, items: [{ html: numbered[2], number: Number(numbered[1]) }] })) return null; }
    else if (!push({ kind: 'p', html })) return null;
  }
  if (lede.length) info.lede = lede.join(' ');
  if (info.sections.length < 2) return null;
  return covers(page.html, pieces, images) ? info : null;
}

function resourceType(href: string): InfoResource['type'] {
  let url: URL; try { url = new URL(href); } catch { return 'Web'; }
  if (/\.pdf$/iu.test(decodeURIComponent(url.pathname))) return 'PDF';
  if (url.hostname === 'drive.google.com' || url.hostname === 'docs.google.com') return 'Google Drive';
  if (/(^|\.)youtube\.com$|^youtu\.be$/u.test(url.hostname)) return 'Vídeo';
  if (/(^|\.)tranandorra\.org$/u.test(url.hostname) && /^\/\d{4}\/\d{2}\//u.test(url.pathname)) return 'Notícia';
  return 'Web';
}
const LINK = /<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/giu;

/**
 * Resource pages: short text plus documents or links (PDF, Drive, news). Every link becomes a resource card;
 * text paragraphs keep their inline links verbatim; image-only paragraphs illustrate the next resource;
 * images inside text paragraphs become page figures. Cards never invent labels beyond a neutral fallback.
 */
function buildResources(page: WordPressPage): ResourceInfo | null {
  const info: ResourceInfo = { kind: 'resources', notes: [], resources: [], figures: [] };
  const pieces: string[] = []; const body: string[] = [];
  let pending: InfoImage[] = [];
  const add = (href: string, labelHtml: string, images: InfoImage[], inlineLink = false) => {
    const label = textOf(labelHtml) ? inline(labelHtml) : undefined;
    const found = info.resources.find((r) => r.href === href);
    if (found) {
      if (label && found.label && textOf(found.label) !== textOf(label)) return false; // Two different names: do not hide one.
      found.label ??= label; found.images.push(...images); found.inline &&= inlineLink; return true;
    }
    info.resources.push({ href, label, images: [...images], type: resourceType(href), host: (() => { try { return new URL(href).hostname.replace(/^www\./u, ''); } catch { return ''; } })(), easyRead: /lectura\s+f[àa]cil/iu.test(label ? textOf(label) : ''), inline: inlineLink });
    return true;
  };
  // A group of links with no surrounding text (a paragraph or a table cell).
  const linkGroup = (inner: string) => {
    const links = [...inner.matchAll(LINK)];
    const loose = imagesIn(inner.replace(LINK, ''));
    for (const [index, [, href, linkInner]] of links.entries()) {
      const extra = index === 0 ? [...pending, ...loose] : [];
      if (!add(href, linkInner, [...extra, ...imagesIn(linkInner)])) return false;
      if (textOf(linkInner)) pieces.push(inline(linkInner));
    }
    pending = [];
    return true;
  };
  for (const block of topBlocks(page.html)) {
    if (block.tag === 'table') {
      for (const [, cell] of block.inner.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/giu)) {
        if (textOf(cell.replace(LINK, ''))) return null; // Loose text in a layout cell is not represented here.
        if (![...cell.matchAll(LINK)].length) { pending.push(...imagesIn(cell)); continue; }
        if (!linkGroup(cell)) return null;
      }
      continue;
    }
    if (block.tag !== 'p') return null;
    const links = [...block.inner.matchAll(LINK)];
    const outside = textOf(block.inner.replace(LINK, ''));
    if (!links.length) {
      if (outside) { const html = inline(block.inner); body.push(html); pieces.push(html); info.figures.push(...imagesIn(block.inner)); }
      else pending.push(...imagesIn(block.inner));
      continue;
    }
    if (!outside) { if (!linkGroup(block.inner)) return null; continue; }
    // Text with inline links: the paragraph stays verbatim and each link also gets a card.
    const html = inline(block.inner); body.push(html); pieces.push(html);
    info.figures.push(...imagesIn(block.inner.replace(LINK, '')));
    for (const [, href, linkInner] of links) if (!add(href, linkInner, imagesIn(linkInner), true)) return null;
  }
  if (pending.length) info.figures.push(...pending);
  info.lede = body.shift(); info.notes = body;
  if (!info.resources.length) return null;
  const used = [...info.resources.flatMap((r) => r.images), ...info.figures];
  return covers(page.html, pieces, used) ? info : null;
}

const BUILDERS: Record<string, (page: WordPressPage) => InfoPage | null> = {
  'que-es-lem': buildEm,
  'glossari-em': buildGlossary,
  'deteriorament-cognitiu-en-la-em': buildCognitive,
  'afectacio-cognitiva-i-esclerosi-multiple': buildResources,
  'pla-integral-de-benestar-emocional-2': buildResources,
  'decaleg-exercici-fisic-em': buildResources,
  'conveni-sobre-els-drets-de-les-persones-amb-discapacitat-cdpd': buildResources,
};
/** Slugs that ever get a dedicated presentation; everything else keeps the generic template. */
export const INFO_PAGE_SLUGS = Object.keys(BUILDERS);
/** Further reading shared by the three pages, in this order. Only existing published pages are shown. */
export const INFO_RELATED_SLUGS = ['que-es-lem', 'glossari-em', 'deteriorament-cognitiu-en-la-em', 'afectacio-cognitiva-i-esclerosi-multiple', 'pla-integral-de-benestar-emocional-2', 'decaleg-exercici-fisic-em'];

export function buildInfoPage(page: WordPressPage): InfoPage | null {
  const builder = BUILDERS[page.slug];
  if (!builder || !page.html) return null;
  const result = builder(page);
  if (!result) console.warn(`[info-pages] ${page.slug} (${page.id}): source structure changed or content would be lost; using the generic page template.`);
  return result;
}

/** YouTube embed URLs (from the migration inventory) as normal watch links. */
export function watchUrl(url: string): string {
  const id = url.match(/youtube\.com\/embed\/([\w-]{6,})/u)?.[1];
  return id ? `https://www.youtube.com/watch?v=${id}` : url;
}
