import { createHmac, randomBytes, timingSafeEqual, scryptSync } from 'node:crypto';

const COOKIE = '__Host-siriai_bi';
const TTL = 12 * 60 * 60;
const failures = new Map();
function equal(a, b) { const x=Buffer.from(a), y=Buffer.from(b); return x.length===y.length && timingSafeEqual(x,y); }
function signature(value, secret) { return createHmac('sha256',secret).update(value).digest('base64url'); }
function validSession(req, secret) {
  const cookie = (req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  if (!cookie || cookie.length>256) return false;
  const [expires, nonce, signed, ...extra] = cookie.split('.');
  return !extra.length && /^\d+$/.test(expires||'') && Number(expires)>Date.now()/1000 && Number(expires)<=Date.now()/1000+TTL+5 && /^[a-f0-9]{32}$/.test(nonce||'') && equal(signed||'',signature(expires+'.'+nonce,secret));
}
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500&family=Noto+Sans+KR:wght@400;500&display=swap" rel="stylesheet">';
function login(error='') { return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>팀 브랜드 레퍼런스 | SIRIAI</title>${fonts}<style>
*{box-sizing:border-box}body{margin:0;min-height:100svh;display:flex;flex-direction:column;background:#000;color:#f4f4f3;font-family:"Inter Tight","Noto Sans KR",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}header{padding:28px 40px;display:flex;align-items:center;justify-content:space-between;gap:24px}header img{display:block;width:96px;height:auto}header span{font-size:12px;color:#999}main{width:100%;max-width:440px;margin:auto;padding:64px 24px 80px}h1{font-family:"Noto Sans KR",sans-serif;font-size:30px;font-weight:400;line-height:1.3;letter-spacing:-.04em;margin:0 0 18px}p{font-family:"Noto Sans KR",sans-serif;font-size:13px;line-height:1.8;color:#999;word-break:keep-all;margin:0}form{margin-top:40px}label{display:block;font-family:"Noto Sans KR",sans-serif;font-size:12px;margin-bottom:10px;color:#c7c7c5}input{width:100%;height:50px;border:1px solid #444;border-radius:4px;background:#080808;color:#f4f4f3;padding:0 14px;font:16px "Inter Tight","Noto Sans KR",sans-serif;transition:border-color .2s}input:focus{border-color:#aaa}button{width:100%;height:48px;margin-top:20px;border:0;border-radius:999px;background:#f4f4f3;color:#000;font:500 13px "Noto Sans KR",sans-serif;cursor:pointer}button:hover{background:#ddd}a:focus-visible,input:focus-visible,button:focus-visible{outline:2px solid #ffb236;outline-offset:4px}.error{min-height:25px;margin-top:14px;font-size:12px;color:#ffb236}footer{padding:24px 40px;font-size:11px;color:#777}footer a{color:inherit;text-decoration:none}@media(max-width:640px){header{padding:24px}header img{width:84px}main{padding-top:50px;padding-bottom:64px}h1{font-size:28px}footer{padding:24px}}
</style></head><body><header><a href="/" aria-label="SIRIAI 홈페이지"><img src="/assets/bi-v1/siriai-wordmark-white-652.webp" alt="SIRIAI" width="96" height="33"></a><span>팀 브랜드 레퍼런스</span></header><main><h1>브랜드 레퍼런스</h1><p>시리아이의 로고, 서체, 색상과 그래픽을 살펴봅니다.<br>팀에 공유된 비밀번호로 들어오세요.</p><form action="/bi-member" method="post"><label for="password">비밀번호</label><input id="password" name="password" type="password" inputmode="numeric" autocomplete="current-password" required maxlength="64" aria-describedby="error"><button type="submit">들어가기</button><p class="error" id="error" role="alert">${error}</p></form></main><footer><a href="/">© 2026 SIRIAI. All rights reserved.</a></footer></body></html>`; }
export default async function handler(req,res) {
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('Vercel-CDN-Cache-Control','no-store');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  res.setHeader('Vary','Cookie');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','same-origin');
  const send=(status,body,type='text/html; charset=utf-8')=>{res.statusCode=status;res.setHeader('Content-Type',type);res.end(req.method==='HEAD'?'':body)};
  const secret=process.env.BI_SESSION_SECRET;
  const passwordExpected=process.env.BI_MEMBER_PASSWORD;
  if (!secret || secret.length<32 || !passwordExpected) return send(503,'현재 자료를 준비하고 있습니다. 잠시 후 다시 방문해 주세요.');
  if (!['GET','HEAD','POST'].includes(req.method)) {res.setHeader('Allow','GET, HEAD, POST');return send(405,'Method not allowed');}
  const url=new URL(req.url,'https://'+req.headers.host);
  if (req.method==='POST') {
    const origin=req.headers.origin;
    if (!origin || origin !== 'https://'+req.headers.host && !(process.env.BI_LOCAL_TEST==='1' && origin==='http://'+req.headers.host)) return send(403,'요청을 확인할 수 없습니다. 페이지를 새로고침해 주세요.');
    if (!String(req.headers['content-type']||'').startsWith('application/x-www-form-urlencoded')) return send(415,'Unsupported media type');
    if(Number(req.headers['content-length']||0)>1024) return send(413,'Request too large');
    let raw='';
    if(req.body!==undefined) raw=typeof req.body==='string'?req.body:new URLSearchParams(req.body).toString();
    else {for await(const part of req){raw+=part;if(Buffer.byteLength(raw)>1024)return send(413,'Request too large');}}
    if(Buffer.byteLength(raw)>1024)return send(413,'Request too large');
    const form=new URLSearchParams(raw);
    const redirect=()=>{res.statusCode=303;res.setHeader('Location','/bi-member');res.end()};
    if(form.get('action')==='logout'){res.setHeader('Set-Cookie',`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);return redirect()}
    // Per-instance backoff; the platform firewall remains available for global rate limits.
    const now=Date.now(), ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown');
    for(const [key,value] of failures)if(value.until<now)failures.delete(key);
    const previous=failures.get(ip);
    if(previous?.count>=8){res.setHeader('Retry-After',String(Math.ceil((previous.until-now)/1000)));return send(429,login('입력이 여러 번 일치하지 않았습니다. 잠시 후 다시 시도해 주세요.'))}
    const password=form.get('password')||'';
    if(password.length>64 || !equal(scryptSync(password,'siriai-bi-member-v1',32),scryptSync(passwordExpected,'siriai-bi-member-v1',32))){
      if(failures.size>10000)failures.delete(failures.keys().next().value);
      failures.set(ip,{count:(previous?.count||0)+1,until:previous?.until||now+15*60*1000});
      return send(401,login('비밀번호가 일치하지 않습니다. 다시 확인해 주세요.'));
    }
    failures.delete(ip);
    const value=Math.floor(Date.now()/1000+TTL)+'.'+randomBytes(16).toString('hex');
    res.setHeader('Set-Cookie',`${COOKIE}=${value}.${signature(value,secret)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${TTL}`);
    return redirect();
  }
  const assetMatch=url.pathname.match(/^\/bi-member\/asset\/([^/]+)$/);
  if (!validSession(req,secret)) return assetMatch?send(401,'Authentication required','text/plain; charset=utf-8'):send(200,login());
  if(assetMatch){const item=Object.hasOwn(memberAssets,assetMatch[1])?memberAssets[assetMatch[1]]:null;return item?send(200,Buffer.from(item[1],'base64'),item[0]):send(404,'Not found','text/plain; charset=utf-8')}
  if(!['/bi-member','/bi-member/','/api/bi-member'].includes(url.pathname))return send(404,'Not found','text/plain; charset=utf-8');
  return send(200,memberHtml);
}
