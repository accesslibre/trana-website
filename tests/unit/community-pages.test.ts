import assert from 'node:assert/strict';
import test from 'node:test';
import type { WordPressPage, WordPressPost } from '../../src/lib/wordpress/index';
import {
  buildAgenda, buildAnnouncement, buildCampaign, buildDay, buildProgramme, buildVideos, buildVoice,
  initialsOf, shortExcerpt, COMMUNITY_SLUGS,
} from '../../src/lib/community-pages';

const item = (id: number, slug: string, path: string, over: Partial<WordPressPost> = {}): WordPressPost => ({
  id, slug, title: slug, excerpt: '', html: '<p>text</p>', date: '2024-06-03T07:30:26', modified: '2024-06-03T07:30:26',
  url: `https://www.tranandorra.org${path}`, path, ...over,
});

test('covers exactly the 14 community slugs', () => {
  assert.equal(new Set(COMMUNITY_SLUGS).size, 14);
});

test('voice links resolve to real posts, including an outdated month in the permalink', () => {
  const posts = [item(1, 'cap-1', '/2024/03/cap-1/', { title: 'La meva vida amb EM . Capítol I' }), item(2, 'cap-2', '/2024/06/cap-2/', { title: 'La meva vida amb EM . Capítol II' }),
    item(3, 'cap-3', '/2024/06/cap-3/', { title: 'La meva vida amb EM . Capítol III' })];
  const page = item(9, 'sonia', '/sonia/', { title: 'Sònia Araujo', html:
    '<table><tbody><tr><td>1</td><td><a href="https://www.tranandorra.org/2024/03/cap-1/">C1</a></td></tr>'
    + '<tr><td>2</td><td><a href="https://www.tranandorra.org/2024/04/cap-2/">C2</a></td></tr>'
    + '<tr><td>3</td><td><a href="https://www.tranandorra.org/2024/05/cap-3/">C3</a></td></tr></tbody></table>' }) as WordPressPage;
  const voice = buildVoice(page, [page], posts)!;
  assert.equal(voice.stories.length, 3);
  assert.deepEqual(voice.stories.map((s) => s.href), ['/2024/03/cap-1/', '/2024/06/cap-2/', '/2024/06/cap-3/']);
  assert.equal(voice.series, 'La meva vida amb EM');
  assert.equal(voice.stories[2].chapter, 'Capítol III');
});

test('unresolved links stay external instead of being dropped', () => {
  const page = item(9, 'a', '/a/', { html: '<p><a href="https://example.org/x">Text</a></p>' }) as WordPressPage;
  const voice = buildVoice(page, [page], [])!;
  assert.equal(voice.stories[0].kind, 'external');
  assert.equal(buildVoice(item(10, 'b', '/b/', { html: '<p>sense enllaços</p>' }) as WordPressPage, [], []), null);
});

test('programme keeps every row and image, and groups rows without a day', () => {
  const html = '<table><tbody><tr><td>DIES</td><td>HORARIS</td><td>DESCRIPCIÓ</td><td></td></tr>'
    + '<tr><td>Dimecres</td><td>17 a 18<br />alternatius</td><td>Musicoteràpia</td><td><img src="https://x/a.jpg" alt="" /></td></tr>'
    + '<tr><td></td><td></td><td>Atenció</td><td><img src="https://x/b.jpg" alt="" /></td></tr></tbody></table>';
  const items = buildProgramme(html)!;
  assert.equal(items.length, 2);
  assert.deepEqual([items[0].hours, items[0].note, items[1].day], ['17 a 18 h', 'alternatius', undefined]);
  assert.equal(buildProgramme('<p>sense taula</p>'), null);
});

test('agenda links a page_id to its internal path and parses the date', () => {
  const target = item(255, 'dia', '/dia/') as WordPressPage;
  const html = '<table><tbody><tr><td>DATA</td><td>DESCRIPCIÓ</td></tr><tr><td>27 de maig del 2021</td><td><a href="https://www.tranandorra.org/?page_id=255">Diada <img src="https://x/l.jpg" alt="" /></a></td></tr></tbody></table>';
  const [entry] = buildAgenda(html, [target])!;
  assert.deepEqual([entry.href, entry.iso, entry.title, entry.internal], ['/dia/', '2021-05-27', 'Diada', true]);
});

test('day events and announcement', () => {
  const events = buildDay('<p><img src="https://x/a.png" alt="" />9h30 –&gt; Entrevista</p><p>11h30 –&gt; Roda</p><p></p>')!;
  assert.deepEqual(events.map((e) => [e.time, e.title, e.images.length]), [['9h30', 'Entrevista', 1], ['11h30', 'Roda', 0]]);
  assert.equal(buildAnnouncement('<p></p>'), null);
  assert.equal(buildAnnouncement('<p>Molt aviat <img src="https://x/a.jpg" alt="" /></p>')!.image?.src, 'https://x/a.jpg');
});

test('campaign requires its lead and only links the mp4 resource', () => {
  const html = '<h2>Envia un SMS al <strong>601 </strong>i d&#8217; acompanyament</h2><h3>Detall</h3>';
  const campaign = buildCampaign(html, [{ label: 'v', url: 'https://x/v.mp4' }, { label: 'y', url: 'https://www.youtube.com/embed/abcdefghijk' }])!;
  assert.match(campaign.lead, /<strong>601 <\/strong>/u);
  assert.ok(!campaign.lead.includes('d’ a'));
  assert.equal(campaign.video?.url, 'https://x/v.mp4');
  assert.equal(buildCampaign('<p>res</p>'), null);
});

test('videos come from validated YouTube resources, never from page markup', () => {
  const html = '<pre>Primer</pre><pre>Segon</pre><a href="https://www.youtube.com/channel/UCabc-1">canal</a>';
  const data = buildVideos(html, [{ label: 'Vídeo: A', url: 'https://www.youtube.com/embed/5bAe8XdBZR8' }, { label: 'Vídeo: B', url: 'https://www.youtube.com/embed/KsT_0N-r8EY' }])!;
  assert.deepEqual(data.videos.map((v) => v.title), ['Primer', 'Segon']);
  assert.equal(data.videos[0].href, 'https://www.youtube.com/watch?v=5bAe8XdBZR8');
  assert.equal(data.channel?.href, 'https://www.youtube.com/channel/UCabc-1');
  assert.equal(buildVideos(html, [{ label: 'x', url: 'https://evil.example/embed/5bAe8XdBZR8' }]), null);
});

test('initials and excerpts', () => {
  assert.equal(initialsOf('El nen del Solà d’Andorra'), 'NS');
  assert.equal(initialsOf('Nor Raguig'), 'NR');
  assert.equal(shortExcerpt('Text curt […]'), 'Text curt');
  assert.ok(shortExcerpt('paraula '.repeat(60), 100).endsWith('…'));
});

test('builders refuse sources with content they would not represent', () => {
  const extra = '<p>Paràgraf nou afegit a WordPress</p>';
  const table = '<table><tbody><tr><td>Dimecres</td><td>17 a 18</td><td>Ioga</td><td></td></tr></tbody></table>';
  assert.ok(buildProgramme(table));
  assert.equal(buildProgramme(table + extra), null);
  assert.equal(buildDay('<p>9h30 –&gt; Entrevista</p>' + extra)?.length, 2); // represented, not dropped
  assert.equal(buildCampaign('<h2>Lead</h2><h3>Detall</h3>' + extra), null);
  assert.equal(buildAnnouncement('<p>Text <img src="https://x/a.jpg" alt="" /><img src="https://x/b.jpg" alt="" /></p>'), null);
  assert.equal(buildVideos('<pre>Primer</pre>' + extra, [{ label: 'A', url: 'https://www.youtube.com/embed/5bAe8XdBZR8' }]), null);
  const author = item(9, 'a', '/a/', { html: '<p><a href="https://example.org/x">Text</a></p>' + extra }) as WordPressPage;
  assert.equal(buildVoice(author, [author], []), null);
});
