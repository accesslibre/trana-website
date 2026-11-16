// Structured presentation data for the activities, experiences and multimedia pages (group C).
// Builders only REORGANISE the sanitised WordPress HTML. When the source structure no longer matches
// what a builder expects, the builder returns null and the router falls back to the generic ArticlePage,
// so editorial changes in WordPress never silently lose text, links or images.
import { plainText, type WordPressImage, type WordPressPage, type WordPressPost } from './wordpress/index';
import { formatDate } from './routes';

export const SITE_ORIGIN = 'https://www.tranandorra.org';

export const COMMUNITY_SLUGS = [
  'actualidats', 'activitats-2', 'dia-internacional-2021', 'borrador-automatico', 'envia-un-sms-al-601',
  'opinio', 'nor-raguig', 'jacint-risco', 'el-nen-del-sola-dandorra', 'sonia-araujo',
  'youtube', 'imatges', 'trana-home', 'slide-portada',
] as const;
export type CommunitySlug = (typeof COMMUNITY_SLUGS)[number];
export function isCommunitySlug(slug: string): slug is CommunitySlug {
  return (COMMUNITY_SLUGS as readonly string[]).includes(slug);
}

/** Same public contact details as the Contact page. */
export const contact = {
  phone: '+376 821 345', phoneHref: 'tel:+376821345', email: 'info@tranandorra.org',
};

export interface CommunityImage { src: string; alt: string; width?: number; height?: number }

// ---------------------------------------------------------------- small helpers

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'iu'))?.[1];
const num = (value?: string) => (value && /^\d+$/u.test(value) ? Number(value) : undefined);
const decodeAttr = (value: string) => value.replace(/&amp;/gu, '&').replace(/&quot;/gu, '"').replace(/&#39;/gu, "'");

/** Fixes only whitespace after a typographic apostrophe (d’ acompanyament -> d’acompanyament). */
const tidy = (text: string) => text.replace(/(\p{L}[’'])\s+(?=\p{L})/gu, '$1').replace(/\s+/gu, ' ').trim();
const text = (html: string) => tidy(plainText(html));

// Neutral descriptions of the images recovered from these WordPress pages (checked by eye on 15 November 2026).
// The sources carry no alt text; keys are the file name without size suffix and extension.
const ALT: Record<string, string> = {
  'trana': 'Cartell «SMS social x T.R.A.N.A.»: «Dona 1 € i suma’t al canvi! Envia un SMS al 601 escrivint: trana», amb un mòbil, línies d’enviament i un cor amb 1 €.',
  'imatge_andorra_telecom': 'Logotip d’Andorra Telecom, blanc sobre fons magenta.',
  'aiguagym': 'Dues persones en una piscina: una flota estesa a l’aigua i l’altra, amb samarreta blava, l’acompanya des de la vora.',
  'descarga': 'Il·lustració d’un globus terraqüi i les lletres «WWW» amb un ratolí d’ordinador.',
  'typeh__araiaqui': 'Logotip del programa «Ara i Aquí», de RNA, de dilluns a divendres de 7 a 13 h, amb una dona i un home.',
  'logo-blue-rgb_SPA': 'Logotip del Dia Mundial de l’Esclerosi Múltiple.',
  '142317118_842598683249214_8869765571581503341_n': 'Persones assegudes al voltant d’una taula en una sala, amb mascareta.',
  '142414257_840266220149127_3058481069235819753_n': 'Un grup de persones en una sala, algunes en cadira de rodes, fent un exercici amb les mans.',
  'music-therapy-icon-2': 'Clau de sol i notes musicals sobre taques de color.',
  'Screenshot-2021-05-02-at-12.20.47': 'Una dona amb una carpeta parla amb un home que s’aguanta el cap amb la mà, asseguts en un sofà.',
  'boto-youtube': 'Logotip de YouTube.',
};
function altFor(src: string, alt: string): string {
  if (alt) return alt;
  const file = (src.split('/').pop() ?? '').replace(/\.[a-z0-9]+$/iu, '').replace(/-\d+x\d+$/u, '');
  return ALT[file] ?? '';
}
export function imagesIn(html: string): CommunityImage[] {
  return [...html.matchAll(/<img\b[^>]*>/giu)].map(([tag]) => {
    const src = decodeAttr(attr(tag, 'src') ?? '');
    return { src, alt: altFor(src, attr(tag, 'alt') ?? ''), width: num(attr(tag, 'width')), height: num(attr(tag, 'height')) };
  }).filter((image) => image.src);
}
const withoutImages = (html: string) => html.replace(/<img\b[^>]*>/giu, '');
interface Link { href: string; html: string }
function linksIn(html: string): Link[] {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/giu)].map((m) => ({ href: decodeAttr(m[1]), html: m[2] }));
}
function tableRows(html: string): string[][] {
  return [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/giu)].map((row) =>
    [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/giu)].map((cell) => cell[1]));
}
/** Inline HTML limited to emphasis; everything else is dropped. The input is already sanitised. */
function inlineEmphasis(html: string): string {
  return tidy(html.replace(/&nbsp;/gu, ' ').replace(/<(?!\/?(?:strong|em)\b)[^>]+>/giu, ' ').replace(/\s+/gu, ' '));
}

// ---------------------------------------------------------------- fidelity guard
// A builder may only reorganise. If the source holds any word, image or link that the model does not
// represent (for instance a paragraph added later in WordPress), the builder must return null.
const tokensOf = (value: string) => text(value.replace(/<[^>]+>/gu, ' ')).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t && !/^\d+$/u.test(t));
function fullyCovers(html: string, rendered: (string | undefined)[], allow: string[] = []): boolean {
  const have = new Set(tokensOf([...rendered, ...allow].filter(Boolean).join(' ')));
  return tokensOf(html).every((token) => have.has(token));
}
function usesAllMedia(html: string, images: CommunityImage[], hrefs: string[] = []): boolean {
  const srcs = new Set(images.map((i) => i.src));
  const links = new Set(hrefs);
  return imagesIn(html).every((i) => srcs.has(i.src)) && linksIn(html).every((l) => links.has(l.href));
}

const MONTHS: Record<string, number> = {
  gener: 1, febrer: 2, març: 3, abril: 4, maig: 5, juny: 6, juliol: 7, agost: 8, setembre: 9, octubre: 10, novembre: 11, desembre: 12,
};
function isoFromCatalan(value: string): string | undefined {
  const m = value.toLowerCase().match(/^(\d{1,2})\s+de\s+(\p{L}+)\s+(?:de|del)\s+(\d{4})$/u);
  const month = m && MONTHS[m[2]];
  return m && month ? `${m[3]}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}` : undefined;
}
export function monthYear(value: string): string {
  const date = new Date(value.slice(0, 10) + 'T12:00:00Z');
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('ca-AD', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}
export { formatDate };

/** Link to a route only when that WordPress page exists, so the preview never offers dead ends. */
export function routeLinks(pages: WordPressPage[], items: { slug: string; label: string; text: string }[]) {
  return items.flatMap((item) => {
    const page = pages.find((p) => p.slug === item.slug);
    return page ? [{ href: page.path, label: item.label, text: item.text }] : [];
  });
}

// ---------------------------------------------------------------- voices (experiences)

export type StoryKind = 'article' | 'page' | 'external';
export interface VoiceStory {
  n: number; title: string; href: string; kind: StoryKind;
  date?: string; excerpt?: string; image?: WordPressImage; minutes?: number; chapter?: string;
}
export interface Voice {
  slug: string; name: string; path: string; initials: string; colour: string;
  series?: string; stories: VoiceStory[]; first?: string; last?: string;
}

const COLOURS = ['orange', 'green', 'blue', 'red'];
const STOP = new Set(['el', 'la', 'les', 'els', 'de', 'del', 'dels', 'i', 'd', 'l']);
export function initialsOf(name: string): string {
  const words = name.split(/[\s’'-]+/u).filter((w) => w && !STOP.has(w.toLowerCase()));
  return (words[0]?.[0] ?? '?').toUpperCase() + (words[1]?.[0] ?? '').toUpperCase();
}
/** Short, complete excerpt without the WordPress read-more marker. */
export function shortExcerpt(value: string, max = 170): string {
  const clean = tidy(value.replace(/\[(?:…|&hellip;|\.\.\.)\]\s*$/u, '').replace(/\s*(?:Read more|Llegeix més)\s*$/iu, ''));
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max).replace(/\s+\S*$/u, '');
  return `${cut.replace(/[\s.,;:–-]+$/u, '')}…`;
}
function minutesOf(post: WordPressPost): number {
  const words = plainText(post.html).split(/\s+/u).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function resolveItem(href: string, pages: WordPressPage[], posts: WordPressPost[]):
  { kind: 'article' | 'page'; item: WordPressPost } | undefined {
  let url: URL;
  try { url = new URL(href, SITE_ORIGIN); } catch { return undefined; }
  if (url.origin !== SITE_ORIGIN) return undefined;
  const pageId = Number(url.searchParams.get('page_id'));
  if (pageId) { const page = pages.find((p) => p.id === pageId); if (page) return { kind: 'page', item: page }; }
  const path = url.pathname.replace(/\/?$/u, '/');
  const post = posts.find((p) => p.path === path);
  if (post) return { kind: 'article', item: post };
  const page = pages.find((p) => p.path === path);
  if (page) return { kind: 'page', item: page };
  // A permalink with an outdated year/month still resolves in WordPress by its final slug.
  const slug = path.split('/').filter(Boolean).pop();
  const bySlug = slug ? posts.filter((p) => p.slug === slug) : [];
  return bySlug.length === 1 ? { kind: 'article', item: bySlug[0] } : undefined;
}

export function buildVoice(page: WordPressPage, pages: WordPressPage[], posts: WordPressPost[], index = 0): Voice | null {
  const links = linksIn(page.html);
  if (!links.length) return null;
  const seen = new Set<string>();
  const stories: VoiceStory[] = [];
  for (const link of links) {
    const hit = resolveItem(link.href, pages, posts);
    const linkText = text(link.html);
    if (!hit && !linkText) return null;
    const key = hit ? `${hit.kind}:${hit.item.id}` : link.href;
    if (seen.has(key)) continue;
    seen.add(key);
    stories.push(hit ? {
      n: stories.length + 1, title: hit.item.title || linkText, href: hit.item.path, kind: hit.kind,
      date: hit.kind === 'article' ? hit.item.date : undefined,
      excerpt: hit.kind === 'article' ? shortExcerpt(hit.item.excerpt) || undefined : undefined,
      image: hit.item.image, minutes: hit.kind === 'article' ? minutesOf(hit.item) : undefined,
    } : { n: stories.length + 1, title: linkText, href: link.href, kind: 'external' });
  }
  const INSTRUCTION = ['Prèmer sobre el títol de l’article per accedir', 'Prèmer en el títol de l’article per accedir-hi'];
  if (!fullyCovers(page.html, links.map((l) => text(l.html)), INSTRUCTION)) return null;
  const chapters = stories.map((s) => s.title.match(/^(.+?)\s*\.\s*(Cap[ií]tol\s+.+)$/iu));
  const seriesNames = new Set(chapters.map((m) => m?.[1].trim()));
  const series = chapters.every(Boolean) && seriesNames.size === 1 && stories.length >= 3 ? chapters[0]![1].trim() : undefined;
  if (series) stories.forEach((s, i) => { s.chapter = chapters[i]![2].trim(); });
  const dates = stories.flatMap((s) => (s.date ? [s.date] : [])).sort();
  return {
    slug: page.slug, name: page.title, path: page.path, initials: initialsOf(page.title),
    colour: COLOURS[index % COLOURS.length], series, stories, first: dates[0], last: dates[dates.length - 1],
  };
}

export const VOICE_SLUGS = ['el-nen-del-sola-dandorra', 'nor-raguig', 'sonia-araujo', 'jacint-risco'] as const;
/** All author pages, most texts first. A page whose structure is unrecognised is left out. */
export function buildVoices(pages: WordPressPage[], posts: WordPressPost[]): Voice[] {
  const voices = VOICE_SLUGS.flatMap((slug) => {
    const page = pages.find((p) => p.slug === slug);
    return page ? [buildVoice(page, pages, posts)] : [];
  }).filter((v): v is Voice => v !== null);
  voices.sort((a, b) => b.stories.length - a.stories.length || a.name.localeCompare(b.name, 'ca'));
  voices.forEach((v, i) => { v.colour = COLOURS[i % COLOURS.length]; });
  return voices;
}
/** Newest dated text across all voices. */
export function latestStory(voices: Voice[]): { voice: Voice; story: VoiceStory } | undefined {
  const all = voices.flatMap((voice) => voice.stories.filter((s) => s.date).map((story) => ({ voice, story })));
  return all.sort((a, b) => b.story.date!.localeCompare(a.story.date!))[0];
}
export function voiceSpan(voice: Voice): string {
  if (!voice.first || !voice.last) return '';
  const a = monthYear(voice.first), b = monthYear(voice.last);
  return a === b ? a : `${a} – ${b}`;
}

// ---------------------------------------------------------------- weekly programme (activitats-2)

export interface ProgrammeItem { day?: string; hours?: string; note?: string; title: string; image?: CommunityImage }
export function buildProgramme(html: string): ProgrammeItem[] | null {
  const rows = tableRows(html).filter((cells) => !/^dies$/iu.test(text(cells[0] ?? '')));
  if (!rows.length) return null;
  const items: ProgrammeItem[] = [];
  for (const cells of rows) {
    const title = text(cells[2] ?? '');
    if (!title) return null;
    const hoursText = text(cells[1] ?? '');
    const range = hoursText.match(/^(\d{1,2}(?::\d{2})?)\s+a\s+(\d{1,2}(?::\d{2})?)\s*(.*)$/u);
    items.push({
      day: text(cells[0] ?? '') || undefined,
      hours: range ? `${range[1]} a ${range[2]} h` : hoursText || undefined,
      note: range?.[3] || undefined, title, image: imagesIn(cells[3] ?? '')[0],
    });
  }
  const covered = fullyCovers(html, items.flatMap((i) => [i.day, i.hours, i.note, i.title]), ['dies', 'horaris', 'descripció'])
    && usesAllMedia(html, items.flatMap((i) => (i.image ? [i.image] : [])));
  return covered ? items : null;
}

// ---------------------------------------------------------------- archive agenda (actualidats)

export interface AgendaEntry { dateLabel: string; iso?: string; title: string; href: string; internal: boolean; image?: CommunityImage }
export function buildAgenda(html: string, pages: WordPressPage[]): AgendaEntry[] | null {
  const entries: AgendaEntry[] = [];
  const used: string[] = [];
  for (const cells of tableRows(html)) {
    const dateLabel = text(cells[0] ?? '');
    if (!dateLabel || /^data$/iu.test(dateLabel)) continue;
    const link = linksIn(cells[1] ?? '')[0];
    if (!link) return null;
    used.push(link.href);
    const hit = resolveItem(link.href, pages, []);
    entries.push({
      dateLabel, iso: isoFromCatalan(dateLabel), title: text(withoutImages(link.html)),
      href: hit?.item.path ?? link.href, internal: Boolean(hit), image: imagesIn(link.html)[0],
    });
  }
  const covered = fullyCovers(html, entries.flatMap((e) => [e.dateLabel, e.title]), ['data', 'descripció'])
    && usesAllMedia(html, entries.flatMap((e) => (e.image ? [e.image] : [])), used);
  return entries.length && entries.every((e) => e.title) && covered ? entries : null;
}

// ---------------------------------------------------------------- one-day programme (dia-internacional-2021)

export interface DayEvent { time?: string; title: string; images: CommunityImage[] }
export function buildDay(html: string): DayEvent[] | null {
  const events: DayEvent[] = [];
  for (const p of html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/giu)) {
    const body = text(withoutImages(p[1]));
    const images = imagesIn(p[1]);
    if (!body && !images.length) continue;
    const m = body.match(/^(\d{1,2}h(?:\d{2})?)\s*(?:[–-]\s*)?>?\s*(.+)$/u);
    if (!m && !body) return null;
    events.push({ time: m?.[1], title: m ? m[2] : body, images });
  }
  const covered = fullyCovers(html, events.flatMap((e) => [e.time, e.title])) && usesAllMedia(html, events.flatMap((e) => e.images));
  return events.length && events.some((e) => e.time) && covered ? events : null;
}

// ---------------------------------------------------------------- archive announcement (borrador-automatico)

export function buildAnnouncement(html: string): { text: string; image?: CommunityImage } | null {
  const body = text(withoutImages(html));
  const image = imagesIn(html)[0];
  return body && usesAllMedia(html, image ? [image] : []) ? { text: body, image } : null;
}

// ---------------------------------------------------------------- campaign (envia-un-sms-al-601)

export interface Campaign { lead: string; detail?: string; images: CommunityImage[]; video?: { label: string; url: string } }
export function buildCampaign(html: string, resources?: { label: string; url: string }[]): Campaign | null {
  const lead = html.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/iu)?.[1];
  if (!lead) return null;
  const detail = html.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/iu)?.[1];
  const video = resources?.find((r) => /\.mp4(?:$|\?)/iu.test(r.url));
  const model = { lead: inlineEmphasis(lead), detail: detail ? inlineEmphasis(detail) : undefined, images: imagesIn(html), video };
  return fullyCovers(html, [model.lead, model.detail].map((v) => v?.replace(/<[^>]+>/gu, ' '))) && usesAllMedia(html, model.images) ? model : null;
}

// ---------------------------------------------------------------- videos (youtube)

export interface VideoCard { title: string; id: string; href: string }
export interface Videos { videos: VideoCard[]; channel?: { href: string; image?: CommunityImage } }
export function buildVideos(html: string, resources?: { label: string; url: string }[]): Videos | null {
  const captions = [...html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/giu)].map((m) => text(m[1]));
  const found = (resources ?? []).flatMap((r) => {
    const id = r.url.match(/youtube\.com\/embed\/([\w-]{11})(?:[?#]|$)/u)?.[1];
    return id ? [{ id, label: r.label.replace(/^V[ií]deo:\s*/iu, '') }] : [];
  });
  if (!found.length) return null;
  const videos = found.map((v, i) => ({
    id: v.id, title: (found.length === captions.length ? captions[i] : '') || v.label,
    href: `https://www.youtube.com/watch?v=${v.id}`,
  }));
  const channel = linksIn(html).find((l) => /^https:\/\/www\.youtube\.com\/channel\/[\w-]+\/?$/u.test(l.href));
  const model = { videos, channel: channel ? { href: channel.href, image: imagesIn(channel.html)[0] } : undefined };
  const covered = fullyCovers(html, [...videos.map((v) => v.title), ...captions], ['Darrers videos', 'Més contingut al nostre canal'])
    && usesAllMedia(html, model.channel?.image ? [model.channel.image] : [], channel ? [channel.href] : []);
  return covered ? model : null;
}

// ---------------------------------------------------------------- technical records (no recoverable content)

export interface TechnicalCopy {
  eyebrow: string; lead: string; what: string; why: string;
  exits: { slug: string; label: string; text: string }[];
}
export const TECHNICAL: Record<'imatges' | 'trana-home' | 'slide-portada', TechnicalCopy> = {
  imatges: {
    eyebrow: 'Galeria no disponible',
    lead: 'Aquesta pàgina era la galeria multimèdia del web antic de TRANA. Encara no tenim cap galeria recuperada per mostrar-hi.',
    what: 'Galeria d’imatges del web antic',
    why: 'No en simulem una: en aquesta versió només mostrem imatges que acompanyen un text real. Si busques una fotografia concreta, pots consultar-ho amb TRANA per telèfon o correu.',
    exits: [
      { slug: 'youtube', label: 'Vídeos', text: 'Els vídeos recuperats i el canal de TRANA a YouTube.' },
      { slug: 'activitats-2', label: 'Activitats', text: 'El programa d’activitats, amb les imatges que conserva.' },
      { slug: 'opinio', label: 'Vivències', text: 'Textos en primera persona de persones amb EM i del seu entorn.' },
    ],
  },
  'trana-home': {
    eyebrow: 'Pàgina tècnica del web antic',
    lead: 'Aquest registre és una portada antiga del web de TRANA. No és una segona pàgina d’inici ni conté res per llegir.',
    what: 'Portada antiga, sense contingut recuperable',
    why: 'El registre només guarda l’estructura buida del maquetador del web antic: no hi ha text, imatges ni enllaços per recuperar. La portada vigent és la pàgina d’inici.',
    exits: [
      { slug: 'trana-esclerosis-multiple-andorra', label: 'Pàgina d’inici', text: 'La portada actual de TRANA.' },
      { slug: 'que-es-lem', label: 'Què és l’EM?', text: 'Informació sobre l’esclerosi múltiple.' },
      { slug: 'acerca-de', label: 'Qui som', text: 'L’associació, la història i la junta.' },
    ],
  },
  'slide-portada': {
    eyebrow: 'Component tècnic del web antic',
    lead: 'Aquest registre és un component de la portada antiga de TRANA, un carrusel d’imatges. No és una pàgina per llegir i la seva revisió continua pendent.',
    what: 'Carrusel de la portada antiga',
    why: 'No el reproduïm en aquesta versió: un carrusel sense context no explica res. La portada vigent és la pàgina d’inici.',
    exits: [
      { slug: 'trana-esclerosis-multiple-andorra', label: 'Pàgina d’inici', text: 'La portada actual de TRANA.' },
      { slug: 'acerca-de', label: 'Qui som', text: 'L’associació, la història i la junta.' },
      { slug: 'contactans', label: 'Contacte', text: 'Telèfon, correu i adreça.' },
    ],
  },
};
