import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInfoPage, slugify, watchUrl, type CognitiveInfo, type EmInfo, type GlossaryInfo, type ResourceInfo } from '../../src/lib/info-pages.ts';
import type { WordPressPage } from '../../src/lib/wordpress/index.ts';

const page = (slug: string, html: string): WordPressPage => ({
 id: 1, slug, title: 'Títol', excerpt: '', html, date: '2024-05-25T18:03:09', modified: '2024-05-25T18:03:09',
 url: `https://www.tranandorra.org/${slug}/`, path: `/${slug}/`,
});
const img = (name: string) => `<img loading="lazy" src="https://www.tranandorra.org/wp-content/uploads/${name}" alt="" width="300" height="200" />`;
// Builders warn when they fall back; keep test output readable.
test.beforeEach(() => { test.mock.method(console, 'warn', () => {}); });

const em = (figure = `<figure>${img('fem-grafiquesem-cat-03-x.jpg')}</figure>`) => page('que-es-lem', `
<figure><div></div></figure>
<p>L’esclerosi múltiple (EM) és una malaltia crònica.</p>
<p>També és coneguda com la malaltia de les 1.000 cares.</p>
<p>Existeixen diferents tipus d’esclerosi múltiple:</p>
<p><br /><strong>Esclerosi Múltiple Remitent-Recurrent</strong></p>
${figure}
<p><br />Text del primer tipus.</p>
<p><strong>Esclerosi Múltiple Primària Progressiva</strong></p>
<figure>${img('fem-grafiquesem-cat-01-x.jpg')}</figure>
<p>Text del segon tipus.</p>
<p></p>
<p>Font: FEM CATALUNYA MAIG 2021</p>`);

test('EM page keeps lede, intro, types with one chart each and source', () => {
 const info = buildInfoPage(em()) as EmInfo;
 assert.equal(info.kind, 'em');
 assert.match(info.lede, /malaltia crònica/);
 assert.deepEqual(info.intro, ['També és coneguda com la malaltia de les 1.000 cares.']);
 assert.equal(info.typesIntro, 'Existeixen diferents tipus d’esclerosi múltiple:');
 assert.deepEqual(info.types.map((t) => t.name), ['Esclerosi Múltiple Remitent-Recurrent', 'Esclerosi Múltiple Primària Progressiva']);
 assert.equal(info.types[0].id, 'tipus-esclerosi-multiple-remitent-recurrent');
 assert.match(info.types[0].image!.alt, /^Gràfic de FEM Catalunya/);
 assert.equal(info.source, 'Font: FEM CATALUNYA MAIG 2021');
});

test('EM page falls back when a figure holds more than one image or content is not representable', () => {
 assert.equal(buildInfoPage(em(`<figure>${img('a.jpg')}${img('b.jpg')}</figure>`)), null);
 assert.equal(buildInfoPage(page('que-es-lem', em().html + '<ul><li>Llista nova</li></ul>')), null);
 assert.equal(buildInfoPage(page('que-es-lem', em().html.replace('<p>Text del segon tipus.</p>', `<p>${img('c.jpg')}Text del segon tipus.</p>`))), null);
});

const terms = ['Anticossos', 'Antigen', 'Atàxia', 'Brot', 'Citocines', 'Desmielinització', 'Fatiga', 'Gadolini', 'Lesió', 'Mielina'];
const glossary = (credits = '<p>Informació revisada i validada per:<br />Dr. Exemple</p>') => page('glossari-em', `<p></p><div><div>
<p><strong>${img('anticossos.png')}${terms[0]}.</strong> Definició zero.</p>
${terms.slice(1, 4).map((t, i) => `<p><strong>${t}</strong>. Definició ${i + 1}.</p>`).join('\n')}
<p>Cèl·lules presentadores d’antigen. Definició sense negreta.</p>
<p><strong>${img('entre.jpg')}</strong></p>
${terms.slice(4).map((t, i) => `<p><strong>${t}</strong>. Definició ${i + 4}.</p>`).join('\n')}
<p> </p>
${credits}</div></div><p></p>`);

test('glossary keeps every term, unbolded terms and image-only paragraphs, grouped by letter', () => {
 const info = buildInfoPage(glossary()) as GlossaryInfo;
 assert.equal(info.kind, 'glossary');
 assert.equal(info.terms.length, 11);
 assert.equal(info.terms[0].term, 'Anticossos');
 assert.equal(info.terms[0].images.length, 1);
 assert.ok(info.terms.some((t) => t.term === 'Cèl·lules presentadores d’antigen' && t.letter === 'C'));
 assert.equal(info.terms.find((t) => t.term === 'Citocines')!.images[0].src.endsWith('entre.jpg'), true);
 assert.equal(info.terms.find((t) => t.term === 'Atàxia')!.letter, 'A');
 assert.equal(info.credits?.html, 'Informació revisada i validada per:<br />Dr. Exemple');
 assert.deepEqual(info.credits?.images, []);
});

test('glossary renders images inside the credits instead of only counting them', () => {
 const info = buildInfoPage(glossary(`<p>${img('logo.png')}Informació revisada i validada per:<br />Dr. Exemple</p>`)) as GlossaryInfo;
 assert.equal(info.credits?.images.length, 1);
 assert.ok(info.credits?.images[0].src.endsWith('logo.png'));
 assert.doesNotMatch(info.credits!.html, /<img/);
});

test('glossary falls back on duplicate credits, a term without definition or too few terms', () => {
 assert.equal(buildInfoPage(glossary('<p>Informació revisada per: A</p><p>Informació revisada per: B</p>')), null);
 assert.equal(buildInfoPage(page('glossari-em', glossary().html.replace('<p><strong>Brot</strong>. Definició 3.</p>', '<p><strong>Brot</strong></p>'))), null);
 assert.equal(buildInfoPage(page('glossari-em', '<p><strong>Un</strong>. Dos.</p>')), null);
});

const cognitive = (extra = '') => page('deteriorament-cognitiu-en-la-em', `
<table><tbody><tr><td>${img('logo-30.png')}</td><td>${img('creand.png')}</td></tr></tbody></table>
<h2></h2>
<h2><strong>DETERIORAMENT COGNITIU</strong></h2>
<p> </p>
<h3>El <b>deteriorament cognitiu</b> és un fenomen comú</h3>
<h3>que afecta moltes persones.</h3>
<ol><li><b> Què és?</b></li></ol>
<p>${img('arbres.png')}Primer paràgraf.</p>
<ol start="2"><li><b> Símptomes habituals:</b></li></ol>
<p><b>${img('cansament.png')}-Disminució de l’atenció</b>: Dificultat.</p>
<p><b>-Fatiga mental.</b></p>
<ol start="4"><li><b> Què es pot fer?</b></li></ol>
<p>1- <b>Primer</b>: un</p>
<p>2- <b>Segon</b></p>
<p>${img('consulta.png')}3- <b>Tercer</b>: tres</p>
${extra}
<h6>Text Autor. Supervisió Persona.<br />Fonts:<br />${img('msif.jpg')}</h6>`);

test('cognitive page keeps kicker, lede, numbered sections, merged lists, figures and credits', () => {
 const info = buildInfoPage(cognitive()) as CognitiveInfo;
 assert.equal(info.kind, 'cognitive');
 assert.equal(info.banner.length, 2);
 assert.match(info.kicker!, /DETERIORAMENT COGNITIU/);
 assert.equal(info.lede, 'El <b>deteriorament cognitiu</b> és un fenomen comú que afecta moltes persones.');
 assert.deepEqual(info.sections.map((s) => [s.number, s.heading]), [[1, 'Què és?'], [2, 'Símptomes habituals'], [4, 'Què es pot fer?']]);
 assert.deepEqual(info.sections[1].blocks, [{ kind: 'list', ordered: false, items: [{ html: '<b>Disminució de l’atenció</b>: Dificultat.' }, { html: '<b>Fatiga mental.</b>' }] }]);
 const steps = info.sections[2].blocks[0];
 assert.equal(steps.kind === 'list' && steps.ordered && steps.items.map((i) => i.number).join(','), '1,2,3');
 assert.equal(info.sections[2].figures.length, 1);
 assert.equal(info.credits?.images.length, 1);
});

test('cognitive page falls back on unrepresented images, a second credits block or headings inside a section', () => {
 assert.equal(buildInfoPage(page('deteriorament-cognitiu-en-la-em', cognitive().html.replace('<h2></h2>', `<h2>${img('x.png')}</h2>`))), null);
 assert.equal(buildInfoPage(cognitive('<h6>Una altra font</h6>')), null);
 assert.equal(buildInfoPage(cognitive('<h3>Subtítol nou</h3>')), null);
});

test('only the three information slugs get a dedicated builder', () => {
 assert.equal(buildInfoPage(page('acerca-de', '<p>Text</p>')), null);
 assert.equal(buildInfoPage(page('que-es-lem', '')), null);
 assert.equal(slugify('Cèl·lules T'), 'cellules-t');
 assert.equal(watchUrl('https://www.youtube.com/embed/0NmpWj-dsY0?feature=oembed'), 'https://www.youtube.com/watch?v=0NmpWj-dsY0');
});

const resources = (slug: string, html: string) => buildInfoPage(page(slug, html));
test('resource pages: text stays verbatim, every link becomes a card, image-only paragraphs illustrate the next card', () => {
 const info = resources('afectacio-cognitiva-i-esclerosi-multiple', `<p>Presentació del dia de l’EM.</p>
<p>${img('portada.png')}</p>
<p><a href="https://drive.google.com/file/d/x/view">Accès a la presentació</a></p><p> </p>`) as ResourceInfo;
 assert.equal(info.kind, 'resources');
 assert.equal(info.lede, 'Presentació del dia de l’EM.');
 assert.equal(info.resources.length, 1);
 assert.equal(info.resources[0].type, 'Google Drive');
 assert.equal(info.resources[0].label, 'Accès a la presentació');
 assert.ok(info.resources[0].images[0].src.endsWith('portada.png'));
});

test('resource pages keep inline links in text, merge image and text links to the same PDF and flag easy-read', () => {
 const info = resources('conveni-sobre-els-drets-de-les-persones-amb-discapacitat-cdpd', `<p>Texts oficials. Vegeu la <a href="https://www.tranandorra.org/2022/03/noticia/">notícia</a>.</p>
<table><tbody><tr><td><p></p><div><a href="https://www.tranandorra.org/a.pdf">${img('logo.png')}</a><p><a href="https://www.tranandorra.org/a.pdf">Text complet</a></p></div></td>
<td><p>${img('govern.jpg')}</p><p><a href="https://www.tranandorra.org/b.pdf">Accés al text en LECTURA FÀCIL</a></p></td></tr></tbody></table>
<p><a href="https://www.tranandorra.org/c.pdf">${img('doc.jpg')}</a></p>
<p>Premeu la imatge.</p>`) as ResourceInfo;
 assert.equal(info.lede, 'Texts oficials. Vegeu la <a href="https://www.tranandorra.org/2022/03/noticia/">notícia</a>.');
 assert.deepEqual(info.notes, ['Premeu la imatge.']);
 assert.deepEqual(info.resources.map((r) => [r.type, r.label ?? null, r.images.length, r.easyRead]), [
  ['Notícia', 'notícia', 0, false], ['PDF', 'Text complet', 1, false], ['PDF', 'Accés al text en LECTURA FÀCIL', 1, true], ['PDF', null, 1, false],
 ]);
 assert.deepEqual(info.resources.map((r) => r.inline), [true, false, false, false]);
});

test('resource pages fall back on loose text in layout cells, two different names for one link or no links', () => {
 assert.equal(resources('decaleg-exercici-fisic-em', '<table><tbody><tr><td>Text solt <a href="https://x.test/a.pdf">A</a></td></tr></tbody></table>'), null);
 assert.equal(resources('decaleg-exercici-fisic-em', '<p><a href="https://x.test/a.pdf">Un</a></p><p><a href="https://x.test/a.pdf">Dos</a></p>'), null);
 assert.equal(resources('decaleg-exercici-fisic-em', '<p>Només text.</p>'), null);
});
