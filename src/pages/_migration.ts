// Server-only route planning. Astro ignores files whose names begin with an underscore.
import type { WordPressPage, WordPressPost } from '../lib/wordpress/index';
import { plainText } from '../lib/wordpress/index';
import { postRouteEntries } from '../lib/routes';

export interface PageMigration {
  status: 'completa' | 'parcial' | 'pendent';
  reason?: string;
  resources?: { label: string; url: string }[];
}

// Public source inventory reviewed on 15 November 2026. Pending routes are explicit
// preview fallbacks, never substitutes for the missing WordPress functionality.
const reviewed: Record<number, PageMigration> = {
  61: { status: 'pendent', reason: 'El contingut d’aquesta pàgina antiga encara està pendent de recuperar.' },
  148: { status: 'parcial', reason: 'Aquest índex d’activitats és d’arxiu i està pendent de revisió.' },
  213: {
    status: 'parcial', reason: 'El text està disponible; el vídeo encara no s’ha integrat en aquesta versió del web.',
    resources: [{ label: 'Vídeo: Què és l’esclerosi múltiple?', url: 'https://www.youtube.com/embed/0NmpWj-dsY0?feature=oembed' }],
  },
  251: { status: 'parcial', reason: 'Els horaris publicats es conserven com a font original i estan pendents de confirmar amb TRANA.' },
  255: { status: 'parcial', reason: 'Aquesta pàgina conserva el programa històric de 2021 i està pendent de revisió.' },
  587: { status: 'parcial', reason: 'Aquest anunci d’activitat és d’arxiu i està pendent de revisió.' },
  622: { status: 'pendent', reason: 'La galeria original encara no està disponible en aquesta versió del web.' },
  639: { status: 'pendent', reason: 'Aquest component de la portada antiga encara està pendent de revisió.' },
  759: {
    status: 'parcial', reason: 'Els vídeos encara no s’han integrat en aquesta versió del web. Els pots obrir als enllaços següents.',
    resources: [
      { label: 'Vídeo: TRANA EM al MOU-TE', url: 'https://www.youtube.com/embed/5bAe8XdBZR8' },
      { label: 'Vídeo: promoció SMS 601', url: 'https://www.youtube.com/embed/KsT_0N-r8EY' },
    ],
  },
  957: { status: 'pendent', reason: 'El contingut d’aquesta pàgina de contacte encara està pendent de recuperar.' },
  1091: { status: 'pendent', reason: 'El formulari d’alta encara no està disponible en aquesta versió del web. Aquí no es recullen ni s’envien dades.' },
  1206: { status: 'pendent', reason: 'La subscripció al butlletí encara no està disponible en aquesta versió del web. Aquí no es recullen ni s’envien dades.' },
  1234: {
    status: 'parcial', reason: 'El vídeo encara no s’ha integrat i la vigència de la campanya està pendent de confirmar amb TRANA.',
    resources: [{ label: 'Vídeo original de la campanya SMS 601', url: 'https://www.tranandorra.org/wp-content/uploads/2021/09/Video-promocional-601-Final-Version.mp4' }],
  },
  1719: { status: 'parcial', reason: 'Els documents es conserven amb els enllaços originals. L’any d’una de les memòries està pendent de revisió.' },
  2178: { status: 'parcial', reason: 'La introducció està disponible; l’índex complet de vivències encara està pendent de recuperar.' },
};

export function pageMigration(page: WordPressPage): PageMigration {
  if (reviewed[page.id]?.status === 'pendent') return reviewed[page.id];
  if (/\[\/?(?:et_pb_\w+|wpforms\w*)\b/iu.test(page.html)) {
    return { status: 'pendent', reason: 'Aquesta pàgina conté elements del web original que encara estan pendents de recuperar.' };
  }
  if (!plainText(page.html) && !/<(?:img|a)\b/iu.test(page.html)) {
    return { status: 'pendent', reason: 'El contingut d’aquesta pàgina encara està pendent de recuperar.' };
  }
  return reviewed[page.id] ?? { status: 'completa' };
}

function routeKey(path: string): string {
  let decoded: string;
  try { decoded = decodeURIComponent(path); } catch { throw new Error(`Malformed content route: ${path}`); }
  if (!decoded.startsWith('/') || !decoded.endsWith('/') || /[?#\\\u0000-\u001f\u007f]/u.test(decoded)
    || (decoded !== '/' && decoded.slice(1, -1).split('/').some((part) => !part || part === '.' || part === '..'))) {
    throw new Error(`Invalid content route: ${path}`);
  }
  return decoded;
}

export function assertContentRoutes(posts: WordPressPost[], pages: WordPressPage[]) {
  const seen = new Map<string, number>();
  for (const item of [...posts, ...pages]) {
    const key = routeKey(item.path);
    const collisionKey = key.normalize('NFC').toLowerCase();
    if (/^\/(?:noticies|cerca|404|disseny)(?:\/|$)/u.test(collisionKey)
      || /^\/(?:robots\.txt|_headers|_redirects|brand|images|fonts|_astro)(?:\/|$)/u.test(collisionKey)) {
      throw new Error(`Content route collides with frontend route: ${item.id} ${item.path}`);
    }
    if (seen.has(collisionKey)) throw new Error(`Duplicate content route: ${key} (IDs ${seen.get(collisionKey)}, ${item.id})`);
    seen.set(collisionKey, item.id);
  }
  // Existing explicit wrappers own these paths. Do not silently replace a changed source.
  for (const [path, slug] of [['/', 'trana-esclerosis-multiple-andorra'], ['/acerca-de/', 'acerca-de']]) {
    if (!pages.some((page) => page.path === path && page.slug === slug)) {
      throw new Error(`Expected published page for explicit route ${path} (${slug})`);
    }
  }
}

export function contentRoutes(posts: WordPressPost[], pages: WordPressPage[]) {
  assertContentRoutes(posts, pages);
  const postRoutes = postRouteEntries(posts).map((entry) => ({
    ...entry,
    props: {
      post: entry.props.post, kind: 'article' as const,
      related: posts.filter((post) => post.id !== entry.props.post.id).slice(0, 3),
      migration: undefined as PageMigration | undefined,
    },
  }));
  const pageRoutes = pages.filter((page) => !['/', '/acerca-de/'].includes(page.path)).map((page) => {
    const migration = pageMigration(page);
    return {
      params: { slug: routeKey(page.path).slice(1, -1) },
      props: {
        // Forms, empty Divi shells and galleries are kept as explicit original-link fallbacks.
        post: migration.status === 'pendent' ? { ...page, html: '', excerpt: '', image: undefined } : page,
        kind: 'page' as const, related: [] as WordPressPost[], migration,
      },
    };
  });
  return [...postRoutes, ...pageRoutes];
}
