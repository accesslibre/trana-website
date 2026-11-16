// Structured presentation for the eleven association, documents and contact pages. The builders only
// REORGANISE the sanitised WordPress HTML: every text fragment of the source must reappear in the data
// (checked with sameText), or the builder returns null and the route falls back to the generic ArticlePage.
// Nothing here invents content. Where the page has no recoverable content the components say so.
import { plainText, type WordPressPage } from './wordpress/index';

export const ASSOCIATION_SLUGS = [
  'acerca-de', 'junta-associacio-tranaem', 'historia', 'estatuts', 'pla-estrategic-2020-2024',
  'memories-assemblea-general', 'avis-legal-i-politica-de-privacitat', 'contactans', 'borrador-automatico-2',
  'alta-soci', 'alta-al-butlleti-de-noticies',
] as const;
export type AssociationSlug = (typeof ASSOCIATION_SLUGS)[number];
export type AssociationKind = 'about' | 'board' | 'history' | 'document' | 'legal' | 'contact' | 'contact-archive' | 'join' | 'newsletter';

const KIND: Record<AssociationSlug, AssociationKind> = {
  'acerca-de': 'about', 'junta-associacio-tranaem': 'board', historia: 'history', estatuts: 'document',
  'pla-estrategic-2020-2024': 'document', 'memories-assemblea-general': 'document',
  'avis-legal-i-politica-de-privacitat': 'legal', contactans: 'contact', 'borrador-automatico-2': 'contact-archive',
  'alta-soci': 'join', 'alta-al-butlleti-de-noticies': 'newsletter',
};
export function associationKind(slug: string): AssociationKind | null {
  return (ASSOCIATION_SLUGS as readonly string[]).includes(slug) ? KIND[slug as AssociationSlug] : null;
}

/** Public contact data. Each item says where it is published so the page can show its source. */
export const CONTACT = {
  phone: '+376 821 345', phoneHref: 'tel:+376821345',
  phone2: '+376 348 468',
  email: 'info@tranandorra.org',
  address: ['Carrer Prada Casadet, 2, locals C-D', 'AD500 Andorra la Vella'],
  mapHref: 'https://www.openstreetmap.org/search?query=Prada%20Casadet%2C%20Andorra%20la%20Vella',
  hours: [{ days: 'Dilluns a divendres, excepte festius', time: '9–13 h i 15–18 h' }],
} as const;
export const mailto = (subject: string) => `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}`;

// ---------------------------------------------------------------------------------------------
// Minimal tree for sanitised WordPress HTML (no new dependency).
// ---------------------------------------------------------------------------------------------
export interface HNode { tag: string; attrs: Record<string, string>; children: HNode[]; text?: string }
const VOID = new Set(['br', 'img', 'hr', 'input', 'meta', 'link']);
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>|<!--[\s\S]*?-->|([^<]+|<)/gu;
function attrsOf(source: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of source.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/gu)) out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return out;
}
export function parseHtml(html: string): HNode {
  const root: HNode = { tag: '#root', attrs: {}, children: [] };
  const stack: HNode[] = [root];
  for (const m of html.matchAll(TAG)) {
    const top = stack[stack.length - 1];
    if (m[5] !== undefined) { top.children.push({ tag: '#text', attrs: {}, children: [], text: m[5] }); continue; }
    if (m[2] === undefined) continue; // comment
    const tag = m[2].toLowerCase();
    if (m[1]) {
      const i = stack.map((n) => n.tag).lastIndexOf(tag);
      if (i > 0) stack.length = i;
    } else {
      const node: HNode = { tag, attrs: attrsOf(m[3] ?? ''), children: [] };
      top.children.push(node);
      if (!VOID.has(tag) && !m[4]) stack.push(node);
    }
  }
  return root;
}
const elements = (n: HNode) => n.children.filter((c) => c.tag !== '#text');
export function serialize(n: HNode): string {
  if (n.tag === '#text') return n.text ?? '';
  const attrs = Object.entries(n.attrs).map(([k, v]) => ` ${k}="${v}"`).join('');
  if (VOID.has(n.tag)) return `<${n.tag}${attrs} />`;
  return `<${n.tag}${attrs}>${n.children.map(serialize).join('')}</${n.tag}>`;
}
const inner = (n: HNode) => n.children.map(serialize).join('');
const textOf = (n: HNode) => plainText(inner(n));
function find(n: HNode, pred: (x: HNode) => boolean): HNode | undefined {
  for (const c of n.children) { if (pred(c)) return c; const d = find(c, pred); if (d) return d; }
  return undefined;
}
function findAll(n: HNode, pred: (x: HNode) => boolean, out: HNode[] = []): HNode[] {
  for (const c of n.children) { if (pred(c)) out.push(c); findAll(c, pred, out); }
  return out;
}
const tagIs = (tag: string) => (x: HNode) => x.tag === tag;

export interface Img { src: string; alt: string; width?: number; height?: number }
const num = (v?: string) => (v && /^\d+$/u.test(v) ? Number(v) : undefined);
function imgOf(n: HNode, alt: string): Img | undefined {
  const i = n.tag === 'img' ? n : find(n, tagIs('img'));
  return i?.attrs.src ? { src: i.attrs.src, alt, width: num(i.attrs.width), height: num(i.attrs.height) } : undefined;
}

// Fidelity: the visible words of the source must equal the words of the parts we render.
const words = (s: string) => plainText(s).toLowerCase().replace(/[^\p{L}\p{N}€%@]+/gu, ' ').trim().split(' ').filter(Boolean);
export function sameText(sourceHtml: string, parts: string[]): boolean {
  const a = words(sourceHtml), b = words(parts.join(' '));
  return a.length === b.length && a.every((w, i) => w === b[i]);
}
const clean = (s: string) => s.replace(/\u00a0/gu, ' ').replace(/\s+/gu, ' ').trim();
/** Images and links the source carries must all be shown: a resource without text would otherwise be dropped silently. */
function resourcesMatch(root: HNode, expected: { img: number; a: number }): boolean {
  return findAll(root, tagIs('img')).length === expected.img && findAll(root, (n) => n.tag === 'a' && !!n.attrs.href).length === expected.a;
}

// ---------------------------------------------------------------------------------------------
// Qui som (acerca-de): full name and purposes.
// ---------------------------------------------------------------------------------------------
export interface AboutData {
  logo?: Img; fullName: string; label: string; intro: string;
  purposes: { html: string; sub: { marker: string; html: string }[] }[];
}
export function buildAbout(post: WordPressPage): AboutData | null {
  const root = parseHtml(post.html);
  const h = find(root, tagIs('h4')); const ol = find(root, tagIs('ol'));
  const paras = elements(root).filter(tagIs('p'));
  const label = paras.find((p) => /^finalitats\b/iu.test(textOf(p)));
  const intro = paras.find((p) => /^les finalitats/iu.test(textOf(p)));
  if (!h || !ol || !label || !intro) return null;
  const purposes = elements(ol).filter(tagIs('li')).map((li) => {
    const segs: HNode[][] = [[]];
    for (const c of li.children) { if (c.tag === 'br') segs.push([]); else segs[segs.length - 1].push(c); }
    const html = (s: HNode[]) => clean(s.map(serialize).join(''));
    const sub = segs.slice(1).map((s) => {
      const t = html(s); const m = t.match(/^([a-z])\s*\.\s*-\s*/iu);
      return { marker: m ? `${m[1].toLowerCase()}.` : '', html: m ? t.slice(m[0].length) : t };
    });
    return { html: html(segs[0]), sub };
  });
  if (!purposes.length) return null;
  const data: AboutData = { logo: imgOf(root, 'Logotip de l’Associació TRANA Esclerosi Múltiple Andorra'), fullName: textOf(h), label: textOf(label).replace(/\s*:\s*$/u, ''), intro: inner(intro), purposes };
  const parts = [data.fullName, data.label, textOf(intro), ...purposes.flatMap((p) => [p.html, ...p.sub.map((s) => `${s.marker} ${s.html}`)])];
  return sameText(post.html, parts) && resourcesMatch(root, { img: data.logo ? 1 : 0, a: 0 }) ? data : null;
}

// ---------------------------------------------------------------------------------------------
// Junta (junta-associacio-tranaem).
// ---------------------------------------------------------------------------------------------
export interface BoardData { label: string; image?: Img; members: { role: string; name: string }[]; note: string }
export function buildBoard(post: WordPressPage): BoardData | null {
  const root = parseHtml(post.html);
  const rows = findAll(root, tagIs('tr')).map((tr) => elements(tr).filter(tagIs('td')).map(textOf)).filter((c) => c.length === 2);
  const caption = find(root, tagIs('figcaption'));
  const strong = find(root, tagIs('strong'));
  if (!rows.length || !caption || !strong) return null;
  const noteNodes: HNode[] = []; let afterTable = false;
  for (const c of caption.children) { if (c.tag === 'table') { afterTable = true; continue; } if (afterTable && c.tag !== 'br') noteNodes.push(c); }
  const note = clean(plainText(noteNodes.map(serialize).join('')));
  const data: BoardData = { label: textOf(strong).replace(/:\s*$/u, ''), image: imgOf(root, 'Il·lustració de nou personatges de colors asseguts en cercle amb el text «Junta Directiva»'), members: rows.map(([role, name]) => ({ role: clean(role), name: clean(name) })), note };
  const parts = [textOf(strong), ...data.members.flatMap((m) => [m.role, m.name]), note];
  return sameText(post.html, parts) && resourcesMatch(root, { img: data.image ? 1 : 0, a: 0 }) ? data : null;
}

// ---------------------------------------------------------------------------------------------
// Història.
// ---------------------------------------------------------------------------------------------
export interface HistoryItem { html: string; board?: { role: string; name: string }[]; children?: HistoryItem[] }
export type HistoryBlock = { kind: 'date'; text: string } | { kind: 'p'; html: string } | { kind: 'list'; items: HistoryItem[] };
export interface HistoryYear { year: string; blocks: HistoryBlock[] }
export interface HistoryEra { id: string; label: string; years: HistoryYear[] }
export interface HistoryData { years: HistoryYear[]; eras: HistoryEra[] }
const ROLE = /^(Presidenta?|Vicepresidenta?(?:\s*\d\s*[ªa]\.?)?|Secretàri[ao]|Secretari|Secretària|Tresorer[a]?|Vocals?|CEO)\b[\s:]*/iu;
const isYear = (t: string) => /^(?:19|20)\d{2}$/u.test(t);
function listItems(ul: HNode): HistoryItem[] {
  const out: HistoryItem[] = [];
  for (const li of elements(ul).filter(tagIs('li'))) {
    const own = li.children.filter((c) => c.tag !== 'ul' && c.tag !== 'ol');
    const html = clean(own.map(serialize).join('').replace(/^(?:\s*<br\s*\/>)+|(?:<br\s*\/>\s*)+$/gu, ''));
    const lists = li.children.filter((c) => c.tag === 'ul' || c.tag === 'ol');
    const flat = lists.flatMap((u) => elements(u).filter(tagIs('li')));
    const flatText = flat.map((x) => clean(textOf(x)));
    const simple = flat.every((x) => !find(x, (y) => y.tag === 'ul'));
    let item: HistoryItem = { html };
    if (flat.length && simple && flatText.every((t) => ROLE.test(t))) {
      item.board = flatText.map((t) => { const m = t.match(ROLE)!; return { role: m[1], name: t.slice(m[0].length).replace(/^:\s*/u, '') }; });
    } else if (lists.length) {
      item.children = lists.flatMap(listItems).filter((c) => c.html || c.board || c.children);
    }
    out.push(item);
  }
  return out;
}
export function buildHistory(post: WordPressPage): HistoryData | null {
  const root = parseHtml(post.html);
  const years: HistoryYear[] = []; let current: HistoryYear | undefined;
  for (const n of elements(root)) {
    const t = clean(textOf(n));
    if (!t) continue;
    if ((n.tag === 'h4' || n.tag === 'h3' || n.tag === 'p') && isYear(t) && (n.tag !== 'p' || (elements(n).length === 1 && elements(n)[0].tag === 'strong'))) { current = { year: t, blocks: [] }; years.push(current); continue; }
    if (!current) return null;
    if (n.tag === 'ul' || n.tag === 'ol') current.blocks.push({ kind: 'list', items: listItems(n) });
    else if (n.tag === 'p') {
      const strongOnly = elements(n).length === 1 && elements(n)[0].tag === 'strong' && clean(textOf(elements(n)[0])) === t;
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/u.test(t)) current.blocks.push({ kind: 'date', text: t });
      else if (strongOnly && /^\d{1,2}\/\d{1,2}\/\d{4}$/u.test(t)) current.blocks.push({ kind: 'date', text: t });
      else current.blocks.push({ kind: 'p', html: clean(inner(n).replace(/^\s*\.\s*(?:<br\s*\/>)*/u, '').replace(/^(?:\s*<br\s*\/>)+/u, '')) });
    } else return null;
  }
  if (!years.length) return null;
  const parts: string[] = [];
  const addItem = (i: HistoryItem) => { parts.push(i.html); i.board?.forEach((b) => parts.push(b.role, b.name)); i.children?.forEach(addItem); };
  for (const y of years) { parts.push(y.year); for (const b of y.blocks) { if (b.kind === 'date') parts.push(b.text); else if (b.kind === 'p') parts.push(b.html); else b.items.forEach(addItem); } }
  if (!sameText(post.html, parts) || !resourcesMatch(root, { img: 0, a: 0 })) return null;
  const decade = (y: string) => Math.floor(Number(y) / 10) * 10;
  const eras: HistoryEra[] = [];
  for (const y of years) {
    const d = decade(y.year.slice(0, 4));
    let era = eras.find((e) => e.id === `anys-${d}`);
    if (!era) { era = { id: `anys-${d}`, label: '', years: [] }; eras.push(era); }
    era.years.push(y);
  }
  for (const e of eras) { const f = e.years[0].year, l = e.years[e.years.length - 1].year; e.label = f === l ? f : `${f}–${l}`; }
  return { years, eras };
}

// ---------------------------------------------------------------------------------------------
// Documents (estatuts, pla estratègic, memòries).
// ---------------------------------------------------------------------------------------------
export interface DocLink { label: string; href: string; prefix?: string; year?: string; fileYear?: string; yearMismatch?: boolean }
export interface DocumentData { kind: 'single' | 'reports'; lead?: string; image?: Img; links: DocLink[]; draft?: boolean }
const IMG_ALT: Record<string, string> = {
  'ESTATUTS.jpg': 'Coberta magenta amb el rètol «Estatuts» i una il·lustració de llibres i un martell de jutge',
  'logo-pla-estrategic': 'Il·lustració d’un arbre fet d’engranatges, amb icones de música, reciclatge, cadira de rodes, creu, bombeta, teatre, edifici i esport',
  'memories-anuals.png': 'Logotip de TRANA, Associació T.R.A.N.A. Andorra Esclerosi Múltiple, amb el text «Memòries anuals»',
};
export function buildDocument(post: WordPressPage): DocumentData | null {
  const root = parseHtml(post.html);
  const links = findAll(root, tagIs('a')).filter((a) => a.attrs.href);
  if (!links.length || findAll(root, tagIs('img')).length > 1) return null;
  const alt = (src: string) => Object.entries(IMG_ALT).find(([k]) => src.includes(k))?.[1] ?? '';
  const firstImg = find(root, tagIs('img'));
  const image = firstImg ? imgOf(firstImg, alt(firstImg.attrs.src ?? '')) : undefined;
  const mk = (a: HNode): DocLink => {
    const label = clean(textOf(a));
    const href = a.attrs.href;
    const year = label.match(/\b(20\d{2})\b/u)?.[1];
    const fileYear = decodeURIComponent(href.split('/').pop() ?? '').match(/(20\d{2})/u)?.[1];
    // The link text of a memòria links to a PDF whose file name carries a different year: flag it for review.
    return { label, href, year, fileYear, yearMismatch: !!(year && fileYear && year !== fileYear) };
  };
  const reports = post.slug === 'memories-assemblea-general';
  const out: DocLink[] = []; const parts: string[] = [];
  if (reports) {
    for (const p of findAll(root, tagIs('p'))) {
      const a = find(p, tagIs('a'));
      if (!a || !a.attrs.href) continue;
      const prefix = clean(plainText(p.children.filter((c) => c !== a).map(serialize).join('')));
      const l = mk(a); l.prefix = prefix; out.push(l); parts.push(prefix, l.label);
    }
    if (!out.length || !sameText(post.html, parts) || !resourcesMatch(root, { img: image ? 1 : 0, a: out.length })) return null;
    return { kind: 'reports', image, links: out };
  }
  const a = links[0]; const para = findAll(root, tagIs('p')).find((p) => find(p, (x) => x === a));
  const lead = para ? clean(plainText(para.children.filter((c) => c !== a && !(c.tag === 'a')).map(serialize).join(''))) : '';
  const l = mk(a);
  if (!sameText(post.html, [lead, l.label]) || !resourcesMatch(root, { img: image ? 1 : 0, a: 1 })) return null;
  return { kind: 'single', lead: lead || undefined, image, links: [l], draft: /esborrany/iu.test(decodeURIComponent(l.href)) };
}

// ---------------------------------------------------------------------------------------------
// Avís legal i política de privacitat.
// ---------------------------------------------------------------------------------------------
export interface LegalSection { id: string; title: string; blocks: string[] }
export interface LegalData { logo?: Img; intro: LegalSection; sections: LegalSection[] }
const slugify = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/gu, '').toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '');
export function buildLegal(post: WordPressPage): LegalData | null {
  const root = parseHtml(post.html);
  let logo: Img | undefined;
  const sections: LegalSection[] = []; let cur: LegalSection | undefined; const used = new Set<string>();
  for (const n of elements(root)) {
    const t = clean(textOf(n));
    if (!t) {
      // A paragraph with only an image: the first one is the header logo, any other stays in place so no resource is dropped.
      const img = n.tag === 'p' ? find(n, tagIs('img')) : undefined;
      if (img && !logo) logo = imgOf(img, 'Logotip de l’Associació TRANA Esclerosi Múltiple Andorra');
      else if (img) { if (!cur) { cur = { id: 'intro', title: '', blocks: [] }; sections.push(cur); } cur.blocks.push(`<figure class="ap-legal-fig">${serialize(img)}</figure>`); }
      continue;
    }
    if (n.tag !== 'p') { if (n.tag === 'ul' || n.tag === 'ol') { if (!cur) return null; cur.blocks.push(serialize(n)); } continue; }
    if (find(n, tagIs('img')) && !t) continue;
    const kids = elements(n);
    const strongOnly = kids.length > 0 && kids.every((k) => k.tag === 'strong') && clean(kids.map(textOf).join('')) === t;
    if (strongOnly && !/:$/u.test(t)) {
      let id = slugify(t) || 'seccio'; for (let i = 2; used.has(id); i++) id = `${slugify(t)}-${i}`; used.add(id);
      cur = { id, title: t, blocks: [] }; sections.push(cur);
    } else {
      if (!cur) { cur = { id: 'intro', title: '', blocks: [] }; sections.push(cur); }
      cur.blocks.push(serialize(n).replace(/<p>/u, '').replace(/<\/p>$/u, '').replace(/^(?:\s*<br\s*\/>)+/u, ''));
    }
  }
  if (!sections.length) return null;
  const intro = sections[0].id === 'intro' ? sections.shift()! : { id: 'intro', title: '', blocks: [] };
  const parts = [...intro.blocks, ...sections.flatMap((s) => [s.title, ...s.blocks])];
  const shownHtml = [...intro.blocks, ...sections.flatMap((x) => x.blocks)].join('');
  const shownLinks = shownHtml.match(/<a\b/giu)?.length ?? 0;
  const shownImages = (shownHtml.match(/<img\b/giu)?.length ?? 0) + (logo ? 1 : 0);
  if (!sameText(post.html, parts) || !resourcesMatch(root, { img: shownImages, a: shownLinks })) return null;
  return { logo, intro, sections };
}

// ---------------------------------------------------------------------------------------------
// Contacta'ns (the maintained route), the old empty contact route, the member form and the newsletter.
// ---------------------------------------------------------------------------------------------
export interface ContactData { addressLines: string[]; phone: string }
export function buildContact(post: WordPressPage): ContactData | null {
  const root = parseHtml(post.html);
  const paras = elements(root).filter(tagIs('p'));
  const addr = paras.find((p) => find(p, tagIs('br')) && /^adreça:/iu.test(textOf(p)));
  const phone = paras.map((p) => clean(textOf(p))).find((t) => /^[\d\s+]{6,}$/u.test(t));
  if (!addr || !phone) return null;
  const lines: string[] = []; let line: string[] = [];
  for (const c of addr.children) { if (c.tag === 'br') { lines.push(clean(line.join(''))); line = []; } else line.push(plainText(serialize(c))); }
  lines.push(clean(line.join('')));
  const addressLines = lines.map((l) => l.replace(/^adreça:\s*/iu, '')).filter(Boolean);
  // Labels of the original ("Adreça:" twice, "Telèfon:") plus the values: anything else in the page means a new paragraph we do not show.
  if (!sameText(post.html, ['Adreça', 'Adreça', ...addressLines, 'Telèfon', phone]) || !resourcesMatch(root, { img: 0, a: 0 })) return null;
  return { addressLines, phone };
}

export interface JoinData { title: string; fee?: string; feeNote?: string; privacyHtml?: string; memberTypes: string[]; formFields: string[]; consent?: string }
export function buildJoin(post: WordPressPage): JoinData | null {
  const root = parseHtml(post.html);
  const h2s = findAll(root, tagIs('h2')).map((h) => clean(textOf(h)));
  const title = h2s.find((t) => /fes-te soci/iu.test(t));
  if (!title) return null;
  const fee = h2s.find((t) => /quota anual/iu.test(t));
  const feeNote = findAll(root, tagIs('p')).map((p) => clean(textOf(p))).find((t) => /^o aquella quantitat/iu.test(t));
  const h6 = find(root, tagIs('h6'));
  const fields = findAll(root, tagIs('p')).map((p) => clean(p.children.filter((c) => c.tag === '#text').map((c) => c.text).join(''))).filter(Boolean);
  const memberTypes = ['Afectat/ada', 'Familiar', 'Col·laborador/a'].filter((t) => plainText(post.html).includes(t));
  const formFields = fields.filter((f) => /\p{L}/u.test(f));
  // Consent line of the old form ("He llegit i accepto les polítiques de privacitat  Veure document"): shown as information.
  const consent = findAll(root, (n) => n.tag === 'span' && /^he llegit i accepto/iu.test(clean(textOf(n)))).map((n) => clean(textOf(n))).sort((a, b) => a.length - b.length)[0];
  const shown = new Set(words([title, fee ?? '', feeNote ?? '', h6 ? inner(h6) : '', 'Dades Personals', ...formFields, ...memberTypes, consent ?? ''].join(' ')));
  // Only the widget noise of the old form (send button, the arithmetic captcha) may be missing from what we show.
  // The arithmetic captcha ("11 + 6 =") changes on every fetch: it is removed by its exact shape. No other number is tolerated.
  const source = post.html.replace(/<span>\s*\d{1,2}\s*\+\s*\d{1,2}\s*<\/span>\s*=/gu, '');
  if (words(source).some((w) => !shown.has(w) && w !== 'enviar')) return null;
  // The old form had no images and one link (the consent line); anything else would be a resource we do not show.
  if (findAll(root, tagIs('img')).length > 0 || findAll(root, (n) => n.tag === 'a' && !!n.attrs.href).length > 1) return null;
  return { title, fee, feeNote, privacyHtml: h6 ? inner(h6) : undefined, memberTypes, formFields, consent };
}

export interface NewsletterData { image?: Img }
export function buildNewsletter(post: WordPressPage): NewsletterData | null {
  const root = parseHtml(post.html);
  // The only text of the original is the WPForms shortcode, which we do not render. Any other text means new content.
  const rest = post.html.replace(/\[wpforms[^\]]*\]/giu, '');
  if (words(rest).length > 0 || !resourcesMatch(root, { img: findAll(root, tagIs('img')).length === 1 ? 1 : 0, a: 0 })) return null;
  return { image: imgOf(root, 'Il·lustració d’un sobre obert amb un full que mostra el símbol de l’arrova') };
}

export const DOC_LINKS = [
  { slug: 'estatuts', label: 'Estatuts' },
  { slug: 'memories-assemblea-general', label: 'Memòries anuals' },
  { slug: 'pla-estrategic-2020-2024', label: 'Pla estratègic 2020-2024' },
  { slug: 'avis-legal-i-politica-de-privacitat', label: 'Avís legal i política de privacitat' },
] as const;

/** 821345 -> +376 821 345 (the page prints the national number only). */
export function formatPhone(raw: string): { text: string; href: string } {
  const d = raw.replace(/\D/gu, '');
  return d.length === 6 ? { text: `+376 ${d.slice(0, 3)} ${d.slice(3)}`, href: `tel:+376${d}` } : { text: raw, href: `tel:${d}` };
}
export function longDate(iso: string): string {
  const months = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const de = /^[aeiou]/u.test(months[m - 1]) ? 'd’' : 'de ';
  return `${d} ${de}${months[m - 1]} de ${y}`;
}
