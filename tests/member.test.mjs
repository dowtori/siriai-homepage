import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomBytes} from 'node:crypto';
import handler from '../api/bi-member.mjs';
process.env.BI_SESSION_SECRET=randomBytes(48).toString('hex');
const testPassword='test-reference-pin';
process.env.BI_MEMBER_PASSWORD=testPassword;
process.env.BI_LOCAL_TEST='1';
test('member authentication and asset protection',async()=>{
 const server=createServer(handler); await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const post=(password,origin=base)=>fetch(base+'/bi-member',{method:'POST',headers:{origin,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password}),redirect:'manual'});
 try {
  let r=await fetch(base+'/bi-member');assert.equal(r.status,200);assert.match(await r.text(),/name="password"/);assert.match(r.headers.get('cache-control'),/no-store/);assert.match(r.headers.get('x-robots-tag'),/noindex/);
  r=await fetch(base+'/bi-member/asset/siriai-mark-white.webp');assert.equal(r.status,401);
  r=await post('0000');assert.equal(r.status,401);
  r=await post(testPassword,'https://elsewhere.example');assert.equal(r.status,403);
  r=await post(testPassword);assert.equal(r.status,303);const cookie=r.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Lax/);
  const headers={cookie:cookie.split(';')[0]};
  r=await fetch(base+'/bi-member',{headers});const html=await r.text();assert.match(html,/로그아웃/);assert.doesNotMatch(html,/<a[^>]+download|모든 파일 보기|PNG 내보내기/);
  const assets=[...html.matchAll(/src="(\/bi-member\/asset\/[^\"]+)"/g)].map(x=>x[1]);assert.ok(assets.length>5);
  for(const path of new Set(assets)){r=await fetch(base+path,{headers});assert.equal(r.status,200,path);assert.ok((await r.arrayBuffer()).byteLength>0)}
  r=await fetch(base+'/bi-member',{headers:{cookie:headers.cookie+'x'}});assert.match(await r.text(),/name="password"/);
  r=await fetch(base+'/bi-member/asset/missing',{headers});assert.equal(r.status,404);
  r=await fetch(base+'/api/bi-member');assert.match(await r.text(),/name="password"/);
  r=await fetch(base+'/bi-member',{method:'POST',headers:{...headers,origin:base,'content-type':'application/x-www-form-urlencoded'},body:'action=logout',redirect:'manual'});assert.equal(r.status,303);assert.match(r.headers.get('set-cookie'),/Max-Age=0/);
  const secret=process.env.BI_SESSION_SECRET;delete process.env.BI_SESSION_SECRET;r=await fetch(base+'/bi-member');assert.equal(r.status,503);process.env.BI_SESSION_SECRET=secret;
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
});
