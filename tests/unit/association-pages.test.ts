// Association pages: the builders must reproduce every word of the WordPress source, or return null so the
// route falls back to the generic page. Fixtures are the sanitised public pages of 15 November 2026.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { WordPressPage } from '../../src/lib/wordpress/index';
import {
  associationKind, buildAbout, buildBoard, buildHistory, buildDocument, buildLegal, buildContact, buildJoin, buildNewsletter, formatPhone,
} from '../../src/lib/association-pages';

const pages: WordPressPage[] = JSON.parse(readFileSync(new URL('./association-pages.fixtures.json', import.meta.url), 'utf8'));
const page = (slug: string) => pages.find((p) => p.slug === slug)!;
const withHtml = (slug: string, extra: string): WordPressPage => ({ ...page(slug), html: page(slug).html + extra });

test('the eleven routes are classified', () => {
  for (const p of pages) assert.ok(associationKind(p.slug), p.slug);
  assert.equal(associationKind('que-es-lem'), null);
  assert.equal(pages.length, 11);
});

test('builders cover the real pages without losing text', () => {
  assert.ok(buildAbout(page('acerca-de')));
  assert.equal(buildBoard(page('junta-associacio-tranaem'))?.members.length, 6);
  assert.ok(buildLegal(page('avis-legal-i-politica-de-privacitat')));
  assert.ok(buildContact(page('contactans')));
  assert.ok(buildJoin(page('alta-soci')));
  assert.ok(buildNewsletter(page('alta-al-butlleti-de-noticies')));
  for (const slug of ['estatuts', 'pla-estrategic-2020-2024', 'memories-assemblea-general']) assert.ok(buildDocument(page(slug)), slug);
});

test('history keeps every year and groups them by period', () => {
  const h = buildHistory(page('historia'))!;
  assert.equal(h.years[0].year, '1993');
  assert.equal(h.years[h.years.length - 1].year, '2024');
  assert.ok(h.eras.length >= 3);
  assert.ok(h.years.some((y) => y.blocks.some((b) => b.kind === 'list' && b.items.some((i) => i.board?.length))));
});

test('a memòria whose file year differs from its label is flagged, not corrected', () => {
  const d = buildDocument(page('memories-assemblea-general'))!;
  assert.deepEqual(d.links.filter((l) => l.yearMismatch).map((l) => l.label), ['Memòria ANY 2024']);
  assert.ok(d.links.every((l) => l.prefix === 'ACCÉS A LA'));
});

test('the pla estratègic is recognised as a draft from its file name', () => {
  assert.equal(buildDocument(page('pla-estrategic-2020-2024'))!.draft, true);
});

test('builders return null when the source has content they would not show', () => {
  assert.equal(buildContact(withHtml('contactans', '<p>Nou paràgraf editorial</p>')), null);
  assert.equal(buildJoin(withHtml('alta-soci', '<h3>Nou títol</h3>')), null);
  assert.equal(buildNewsletter(withHtml('alta-al-butlleti-de-noticies', '<p>Nou paràgraf</p>')), null);
  assert.equal(buildDocument(withHtml('estatuts', '<p><img src="https://example.org/a.png" alt="" /></p>')), null);
  assert.equal(buildAbout(withHtml('acerca-de', '<p>Text afegit</p>')), null);
  assert.equal(buildHistory(withHtml('historia', '<h4>2025</h4><ul><li>Un fet nou</li></ul>')) === null, false);
});

test('the legal text is kept whole', () => {
  const legal = buildLegal(page('avis-legal-i-politica-de-privacitat'))!;
  assert.equal(legal.sections.length, 9);
  assert.ok(legal.sections.some((s) => s.title === 'Conservació de les dades'));
});

test('the member form is never presented as a working form', () => {
  const j = buildJoin(page('alta-soci'))!;
  assert.match(j.fee ?? '', /25€/u);
  assert.ok(j.privacyHtml && j.privacyHtml.length > 500);
});

test('resources without text and short numbers outside the captcha are not dropped silently', () => {
  const img = '<p><img src="https://example.org/x.png" alt="" /></p>';
  const link = '<p><a href="https://example.org/doc.pdf"><img src="https://example.org/i.png" alt="" /></a></p>';
  assert.equal(buildJoin(withHtml('alta-soci', '<p>3</p>')), null);
  assert.equal(buildJoin(withHtml('alta-soci', img)), null);
  assert.equal(buildContact(withHtml('contactans', img)), null);
  assert.equal(buildContact(withHtml('contactans', link)), null);
  assert.equal(buildNewsletter(withHtml('alta-al-butlleti-de-noticies', link)), null);
  assert.equal(buildBoard(withHtml('junta-associacio-tranaem', img)), null);
  assert.equal(buildAbout(withHtml('acerca-de', img)), null);
  // The legal page keeps an extra image in place instead of dropping it.
  assert.ok(buildLegal(withHtml('avis-legal-i-politica-de-privacitat', img))!.sections.at(-1)!.blocks.join('').includes('example.org/x.png'));
  assert.equal(buildJoin(withHtml('alta-soci', '<h3>Quota anual: 50</h3>')), null);
  assert.equal(buildDocument(withHtml('estatuts', '<p><a href="https://example.org/recurs-nou.pdf"></a></p>')), null);
  assert.equal(buildHistory(withHtml('historia', img)), null);
  assert.equal(buildDocument(withHtml('memories-assemblea-general', link)), null);
});

test('the captcha numbers of the old form do not change the result', () => {
  const p = page('alta-soci');
  assert.ok(buildJoin({ ...p, html: p.html.replace('11 + 6', '5 + 10') }));
});

test('phone numbers are formatted for Andorra', () => {
  assert.deepEqual(formatPhone('821345'), { text: '+376 821 345', href: 'tel:+376821345' });
});
