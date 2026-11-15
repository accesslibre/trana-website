import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSeoModel, DEFAULT_DESCRIPTION, isGenericSeoTitle, PREVIEW_ROBOTS, serializeJsonLd } from '../../src/lib/seo';

const genericTitle = 'Trana Esclerosi Múltiple Andorra - La web de la Esclerosis Múltiple a Andorra';
const fallback = { title: 'Una notícia concreta · TRANA', description: 'Resum concret de la notícia.' };
const meta = (model: ReturnType<typeof buildSeoModel>, key: string) => model.meta.find((entry) => entry.property === key || entry.name === key)?.content;

test('Yoast fields take precedence with one fixed preview robots policy and original data retained', () => {
  const seo = { title: 'Títol SEO &amp; TRANA', description: 'Descripció SEO.', canonical: 'https://www.tranandorra.org/2026/noticia/', robots: { index: 'index', follow: 'follow' }, og_type: 'article', og_locale: 'ca_ES' };
  const model = buildSeoModel({ ...fallback, seo });
  assert.equal(model.title, 'Títol SEO & TRANA');
  assert.equal(model.description, seo.description);
  assert.equal(model.canonical, seo.canonical);
  assert.equal(model.robots, PREVIEW_ROBOTS);
  assert.deepEqual(model.source, seo);
  assert.equal(meta(model, 'og:type'), 'article');
  assert.equal(meta(model, 'og:locale'), 'ca_ES');
  assert.ok(model.decisions.includes('source-index-policy-recorded'));
  assert.equal(model.meta.filter((entry) => ['robots', 'description'].includes(entry.name ?? '')).length, 0);
});

test('source noindex pages keep their original policy and absent canonical in the audit model', () => {
  const robots = { index: 'noindex', follow: 'follow' };
  const model = buildSeoModel({ ...fallback, seo: { title: 'Pàgina informativa', robots } });
  assert.deepEqual(model.source.robots, robots);
  assert.equal(model.robots, 'noindex, nofollow, noarchive');
  assert.equal(model.canonical, undefined);
  assert.equal(model.description, fallback.description);
  assert.ok(model.decisions.includes('source-noindex-recorded'));
  assert.ok(model.decisions.includes('source-canonical-absent'));
});

test('known generic SEO titles and broken template suffixes cannot replace specific article titles', () => {
  for (const title of [genericTitle, `${genericTitle} % %`, '%%title%% - TRANA']) {
    assert.equal(isGenericSeoTitle(title), true);
    const model = buildSeoModel({ ...fallback, seo: { title, og_title: title, twitter_title: title } });
    assert.equal(model.title, fallback.title);
    assert.equal(meta(model, 'og:title'), fallback.title);
    assert.equal(meta(model, 'twitter:title'), fallback.title);
    assert.equal(model.source.title, title);
    assert.ok(model.decisions.includes('generic-source-title-fallback'));
  }
  assert.equal(isGenericSeoTitle('Què és l’EM? - TRANA'), false);
});

test('fallbacks remain explicit and malformed Yoast fields do not become HTML attributes', () => {
  const model = buildSeoModel({ title: 'Cerca · TRANA', seo: { title: {}, description: [], canonical: 'javascript:alert(1)', og_url: 'https://user:password@example.org/', og_type: 'script', og_image: [{ url: 'data:text/html,bad' }] } });
  assert.equal(model.title, 'Cerca · TRANA');
  assert.equal(model.description, DEFAULT_DESCRIPTION);
  assert.equal(model.canonical, undefined);
  assert.equal(meta(model, 'og:url'), undefined);
  assert.equal(meta(model, 'og:image'), undefined);
  assert.equal(meta(model, 'og:type'), 'website');
  assert.ok(model.decisions.includes('invalid-source-canonical-omitted'));
});

test('social images, UTC article dates and Twitter metadata survive without duplicate image URLs', () => {
  const seo = {
    og_image: [{ url: 'https://example.org/photo.jpg', width: 1200, height: 630, type: 'image/jpeg', alt: 'Una imatge' }, { url: 'https://example.org/photo.jpg' }],
    article_published_time: '2026-11-12T06:19:45+00:00', article_modified_time: '2026-11-12T08:00:00Z',
    article_publisher: 'https://www.facebook.com/public-page', author: 'Autoria pública',
    twitter_card: 'summary_large_image', twitter_site: '@em_trana', twitter_creator: '@em_trana',
    twitter_misc: { 'Escrit per': 'Autoria pública' },
  };
  const model = buildSeoModel({ ...fallback, seo });
  assert.equal(model.meta.filter((entry) => entry.property === 'og:image').length, 1);
  assert.equal(meta(model, 'og:image:width'), '1200');
  assert.equal(meta(model, 'og:image:height'), '630');
  assert.equal(meta(model, 'og:image:alt'), 'Una imatge');
  assert.equal(meta(model, 'article:published_time'), seo.article_published_time);
  assert.equal(meta(model, 'article:modified_time'), seo.article_modified_time);
  assert.equal(meta(model, 'twitter:card'), 'summary_large_image');
  assert.equal(meta(model, 'twitter:data1'), 'Autoria pública');
  assert.equal(meta(buildSeoModel({ ...fallback, seo: { article_published_time: '2026-11-12T06:19:45' } }), 'article:published_time'), undefined);
});

test('JSON-LD cannot close its script element or introduce executable markup', () => {
  const schema = { '@context': 'https://schema.org', '@type': 'WebPage', name: '</script><script>alert("x")</script>&\u2028\u2029' };
  const json = serializeJsonLd(schema)!;
  assert.equal(/[<>&\u2028\u2029]/u.test(json), false);
  assert.deepEqual(JSON.parse(json), schema);
  assert.equal(serializeJsonLd('<script>bad</script>'), undefined);
  const cyclic: Record<string, unknown> = {}; cyclic.self = cyclic;
  assert.equal(serializeJsonLd(cyclic), undefined);
});

test('generic schema WebPage names use the specific title without mutating original Yoast JSON', () => {
  const seo = { title: genericTitle, schema: { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', name: genericTitle }, { '@type': 'Article', headline: 'Títol editorial' }] } };
  const original = structuredClone(seo);
  const model = buildSeoModel({ ...fallback, seo });
  assert.deepEqual(seo, original);
  assert.deepEqual(JSON.parse(model.jsonLd!)['@graph'], [{ '@type': 'WebPage', name: fallback.title }, { '@type': 'Article', headline: 'Títol editorial' }]);
  assert.ok(model.decisions.includes('generic-schema-page-name-fallback'));
});

test('untrusted Yoast HTML and unknown head fields are never included in the model output', () => {
  const seo = { yoast_head: '<script>bad()</script>', unknown: '<meta name="robots" content="index">', schema: 'not structured data' };
  const model = buildSeoModel({ ...fallback, seo });
  assert.equal(model.jsonLd, undefined);
  assert.ok(model.decisions.includes('invalid-source-schema-omitted'));
  assert.equal(JSON.stringify(model.meta).includes('bad()'), false);
  assert.equal(model.robots, PREVIEW_ROBOTS);
});
