import test from 'node:test';
import assert from 'node:assert/strict';
import { createWordPressClient, getAllPages, plainText, sanitizeContent } from '../../src/lib/wordpress/index.ts';
const item = (id = 1, extra = {}) => ({ id, slug: `post-${id}`, status: 'publish', link: `https://www.tranandorra.org/2026/11/post-${id}/`, date: '2026-11-12T08:19:45', modified: '2026-11-11T08:56:40', title: {rendered: 'Més &amp; <b>millor</b>'}, excerpt: {rendered: '<p>Hola&nbsp;món &#8217;</p>'}, content: {rendered: '<h1>Títol</h1><p>Text</p>'}, ...extra });
function response(data: unknown, total = 1, pageCount = Math.ceil(total / 100)) {
 return new Response(JSON.stringify(data), {headers: {'X-WP-Total':String(total),'X-WP-TotalPages':String(pageCount)}});
}
function client(fetcher: (url: URL, init?: RequestInit) => Promise<Response>) {
 return createWordPressClient({fetch:fetcher as typeof fetch});
}
test('plain text decodes entities; sanitizer removes executable markup and changes h1 to h2', () => {
 assert.equal(plainText('<p>Un &amp; dos</p><p>tres&nbsp;quatre</p>'), 'Un & dos tres quatre');
 const html=sanitizeContent('<h1 onclick="alert(1)">Hola</h1><script>alert(1)</script><style>bad</style><iframe src="https://evil.test">secret</iframe><form><input name=x></form><img src="javascript:alert(1)" onerror="alert(1)"><a href="jav&#97;script:alert(1)">click</a><p style="color:red">Text</p>');
 assert.ok(html.includes('<h2>Hola</h2>'));
 assert.doesNotMatch(html,/script|onclick|onerror|iframe|<form|<input|style|secret|javascript/i);
});
test('all post collection pages fetched with GET published context and cached promise; sorted newest first', async () => {
 const calls:URL[]=[];
 const api=client(async(url,init)=>{
  calls.push(url);assert.equal(init?.method,'GET');assert.equal(init?.redirect,'error');
  assert.equal(url.searchParams.get('status'),'publish');assert.equal(url.searchParams.get('context'),'view');
  assert.equal(url.searchParams.get('per_page'),'100');
  return response(url.searchParams.get('page')==='1'?Array.from({length:100},(_,i)=>item(i+1)):[item(101)],101);
 });
 const first=api.getAllPosts();assert.equal(first,api.getAllPosts());const posts=await first;
 assert.equal(posts.length,101);assert.equal(posts[0].id,101);assert.equal(calls.length,2);
 assert.equal(posts[0].title,'Més & millor');assert.equal(posts[0].path,'/2026/11/post-101/');
 assert.equal(posts[0].html,'<h2>Títol</h2><p>Text</p>');
});
test('published pages paginate independently from posts, cache promises and preserve the homepage', async () => {
 const calls:URL[]=[];
 const api=client(async(url,init)=>{
  calls.push(url);assert.equal(init?.method,'GET');assert.equal(init?.redirect,'error');
  assert.equal(url.searchParams.get('status'),'publish');assert.equal(url.searchParams.get('context'),'view');
  assert.equal(url.searchParams.get('per_page'),'100');assert.equal(url.searchParams.get('orderby'),'id');assert.equal(url.searchParams.get('order'),'asc');
  if(url.pathname.endsWith('/posts')) return response([item(999)]);
  const data=url.searchParams.get('page')==='1'
   ? Array.from({length:100},(_,i)=>item(i+1,i===0?{slug:'inici',link:'https://www.tranandorra.org/'}:{}))
   : [item(101,{date:'2026-11-13T08:19:45'})];
  return response(data,101);
 });
 assert.equal(typeof getAllPages,'function');
 const pending=api.getAllPages();assert.equal(pending,api.getAllPages());
 const [pages,posts]=await Promise.all([pending,api.getAllPosts()]);
 assert.equal(pages.length,101);assert.equal(pages[0].id,101);assert.equal(pages.find(p=>p.id===1)?.path,'/');
 assert.deepEqual(posts.map(p=>p.id),[999]);assert.equal(calls.length,3);
 assert.equal(calls.filter(url=>url.pathname.endsWith('/pages')).length,2);
 const homepage=await client(async()=>response([item(1,{slug:'inici',link:'https://www.tranandorra.org/'})])).getPageBySlug('inici');
 assert.equal(homepage.path,'/');
 await assert.rejects(client(async()=>response([item(1,{link:'https://www.tranandorra.org/'})])).getAllPosts(),/invalid original path/);
});
test('page collections reject invalid totals, partial responses and duplicate IDs or paths', async () => {
 assert.deepEqual(await client(async()=>response([],0)).getAllPages(),[]);
 for(const res of [new Response('[]'),new Response('{}'),new Response('broken'),new Response('error',{status:503}),response([],1),response([item()],1,2),response([item(),item()],2),response([item(),item(2,{link:item().link})],2),response([item(),item(1,{link:'https://www.tranandorra.org/another/'})],2)]) {
  await assert.rejects(client(async()=>res).getAllPages(),/WordPress/);
 }
});
test('page collections fail on a later HTTP error or changing totals and retain the cached rejection', async () => {
 for(const next of [new Response('error',{status:500}),response([item(101)],102),response([item(101)],101,3)]) {
  let calls=0;
  const api=client(async url=>{calls++;return url.searchParams.get('page')==='1'?response(Array.from({length:100},(_,i)=>item(i+1)),101):next;});
  const pending=api.getAllPages();await assert.rejects(pending,/WordPress/);
  assert.equal(api.getAllPages(),pending);assert.equal(calls,2);
 }
});
test('page collections reject non-public content and unsafe original links, including at the root', async () => {
 for(const extra of [{status:'draft'},{status:'private'},{content:{protected:true,rendered:'secret'}},{excerpt:{protected:true,rendered:'secret'}},{link:'https://evil.test/'},{link:'https://www.tranandorra.org/?page_id=1'},{link:'https://www.tranandorra.org/#private'},{link:'https://www.tranandorra.org/foo/%5Cevil/'},{link:'https://www.tranandorra.org/foo/%3Fsecret/'}]) {
  await assert.rejects(client(async()=>response([item(1,extra)])).getAllPages(),/WordPress/);
 }
});
test('Yoast JSON is optional data on posts, page collections and slug pages; head HTML is never content', async () => {
 const seo={title:'Títol SEO',robots:{index:'noindex',follow:'follow'},schema:{'@graph':[{'@type':'WebPage',name:'</script><script>alert(1)</script>'}]}};
 const data=item(1,{yoast_head_json:seo,yoast_head:'<script>alert(1)</script><meta name="robots" content="index">'});
 const api=client(async()=>response([data]));
 for(const result of [await api.getAllPosts(),await api.getAllPages(),[await api.getPageBySlug('post-1')]]) {
  assert.deepEqual(result[0].seo,seo);
  assert.equal(result[0].html,'<h2>Títol</h2><p>Text</p>');
  assert.equal('yoast_head' in result[0],false);
 }
 for(const yoast_head_json of [undefined,null,[],false,'<script>alert(1)</script>']) {
  const [post]=await client(async()=>response([item(1,{yoast_head_json})])).getAllPosts();
  assert.equal(post.seo,undefined);
 }
});
test('page timeout fails and retains rejection without another fetch', async () => {
 let calls=0;
 const api=createWordPressClient({timeoutMs:5,fetch:((_url:any,init:any)=>{calls++;return new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new Error('aborted'))));}) as typeof fetch});
 const pending=api.getAllPages();await assert.rejects(pending,/timeout/);
 assert.equal(api.getAllPages(),pending);assert.equal(calls,1);
});
test('page slug query is encoded; published page cached; absent page throws', async () => {
 let count=0;const api=client(async url=>{count++;assert.equal(url.searchParams.get('slug'),'acerca-de');return response([item(5,{slug:'acerca-de',link:'https://www.tranandorra.org/acerca-de/'})]);});
 const a=api.getPageBySlug('acerca-de');assert.equal(a,api.getPageBySlug('acerca-de'));assert.equal((await a).path,'/acerca-de/');assert.equal(count,1);
 await assert.rejects(client(async()=>response([])).getPageBySlug('missing'),/expected one/);
 await assert.rejects(api.getPageBySlug('../private'),/invalid page slug/);
});
test('explicit zero total is allowed; missing headers, HTTP errors, malformed JSON and mismatched totals fail', async () => {
 assert.deepEqual(await client(async()=>response([],0)).getAllPosts(),[]);
 for(const res of [new Response('[]'),new Response('{}'),new Response('broken'),new Response('error',{status:503}),response([],1),response([item()],1,2)]) {
  await assert.rejects(client(async()=>res).getAllPosts(),/WordPress/);
 }
});
test('page two failure and changing totals never return a partial result', async () => {
 for(const changed of [false,true]) {
  const api=client(async url=>url.searchParams.get('page')==='1'?response(Array.from({length:100},(_,i)=>item(i+1)),101):changed?response([item(101)],102):new Response('error',{status:500}));
  await assert.rejects(api.getAllPosts(),/WordPress/);
 }
});
test('foreign origins, protected/draft posts and duplicate paths/IDs are rejected', async () => {
 for(const bad of [item(1,{link:'https://evil.test/article/'}),item(1,{status:'draft'}),item(1,{content:{protected:true,rendered:'secret'}}),item(1,{link:'https://www.tranandorra.org/?p=1'}),item(1,{link:'https://www.tranandorra.org/foo/%5Cevil/'})]) {
  await assert.rejects(client(async()=>response([bad])).getAllPosts(),/WordPress/);
 }
 await assert.rejects(client(async()=>response([item(),item()],2)).getAllPosts(),/duplicate/);
});
test('featured image retains explicit alt and dimensions; no invented image/alt', async () => {
 const api=client(async()=>response([item(1,{featured_media:3,_embedded:{'wp:featuredmedia':[{id:3,source_url:'https://www.tranandorra.org/image.jpg',alt_text:'',media_details:{width:640,height:480}}]}})]));
 assert.deepEqual((await api.getAllPosts())[0].image,{src:'https://www.tranandorra.org/image.jpg',alt:'',width:640,height:480});
 assert.equal((await client(async()=>response([item()])).getAllPosts())[0].image,undefined);
});
test('timeout fails the build and retains rejection in the build cache', async () => {
 const api=createWordPressClient({timeoutMs:5,fetch:((_url:any,init:any)=>new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new Error('aborted'))))) as typeof fetch});
 const pending=api.getAllPosts();await assert.rejects(pending,/timeout/);assert.equal(api.getAllPosts(),pending);
});
