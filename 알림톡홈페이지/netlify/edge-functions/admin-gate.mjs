/* ============================================================
   관제탑 잠금 — alimtalk.kr/admin 앞에서 서버가 비밀번호를 확인한다

   ★ 비밀번호는 Netlify 환경 변수 ADMIN_PASSWORD 에만 둔다.
   ★ 맞으면 12시간짜리 서명된 쿠키(al_admin)를 준다. 쿠키는 HttpOnly 라
     화면의 스크립트가 읽을 수 없고, 비밀번호를 바꾸면 모두 풀린다.
   ★ 앞으로 만들 발송 · 예약 함수도 같은 쿠키를 확인한다(admin-auth.mjs).
   ============================================================ */
const COOKIE = 'al_admin';
const HOURS = 12;
const enc = new TextEncoder();

const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function sign(pw, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode('alimtalk-admin:' + pw), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}
const same = (a, b) => { if (a.length !== b.length) return false; let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i); return x === 0; };
export async function makeToken(pw) { const exp = Date.now() + HOURS * 36e5; return `${exp}.${await sign(pw, 'admin|' + exp)}`; }
export async function validToken(pw, tok) {
  if (!tok || !pw) return false;
  const [exp, sig] = String(tok).split('.');
  if (!exp || !sig || +exp < Date.now()) return false;
  return same(sig, await sign(pw, 'admin|' + exp));
}

const page = (msg = '', tone = '') => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>관제탑 로그인</title><meta name="robots" content="noindex,nofollow">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{background:#1B1B21;color:#fff;font-family:'Pretendard Variable',Pretendard,-apple-system,system-ui,'Malgun Gothic',sans-serif;display:grid;place-items:center;padding:16px}
form{width:100%;max-width:340px;background:#fff;color:#18181D;border-radius:12px;padding:28px 24px;display:flex;flex-direction:column;gap:14px}
h1{margin:0;font-size:19px}p{margin:0;font-size:13px;color:#6B6B73}
label{font-size:13px;font-weight:600}
input{height:42px;border:1px solid transparent;border-radius:6px;background:#F1F1F4;padding:0 12px;font:inherit;font-size:15px}
input:focus{outline:none;border-color:#4F46E5;background:#fff}
button{height:44px;border:0;border-radius:6px;background:#4F46E5;color:#fff;font:inherit;font-size:15px;font-weight:700;cursor:pointer}
button:hover{background:#4338CA}
.m{border-radius:6px;padding:9px 11px;font-size:13px}.bad{background:#FCEBE9;color:#B3352A}.good{background:#E7F6EE;color:#1E6E43}
</style></head><body>
<form method="post" action="/admin">
  <h1>알림톡 관제탑</h1><p>운영사 전용입니다. 운영자 비밀번호를 넣어 주세요.</p>
  ${msg ? `<div class="m ${tone}">${msg}</div>` : ''}
  <label for="pw">비밀번호</label><input id="pw" name="password" type="password" autocomplete="current-password" autofocus required>
  <button type="submit">들어가기</button>
</form></body></html>`;

const html = (body, status = 401) => new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' } });

export default async (req, context) => {
  const pw = (globalThis.Netlify?.env?.get('ADMIN_PASSWORD') || '').trim();
  if (!pw) return html(page('Netlify 환경 변수에 <b>ADMIN_PASSWORD</b> 를 넣고 다시 배포해 주세요. 그 전에는 관제탑을 열 수 없습니다.', 'bad'), 503);
  const url = new URL(req.url);

  if (url.searchParams.has('logout')) {
    context.cookies.delete({ name: COOKIE, path: '/' });
    return html(page('로그아웃했습니다.', 'good'));
  }

  if (req.method === 'POST') {
    const form = await req.formData().catch(() => null);
    const given = String(form?.get('password') || '');
    if (given && same(given, pw)) {
      context.cookies.set({ name: COOKIE, value: await makeToken(pw), path: '/', httpOnly: true, secure: true, sameSite: 'Strict', maxAge: HOURS * 3600 });
      return new Response(null, { status: 303, headers: { location: '/admin', 'cache-control': 'no-store' } });
    }
    await new Promise((r) => setTimeout(r, 800)); // 마구 넣어 보기 늦추기
    return html(page('비밀번호가 맞지 않습니다.', 'bad'));
  }

  if (await validToken(pw, context.cookies.get(COOKIE))) return context.next();
  return html(page());
};

export const config = { path: ['/admin', '/admin.html', '/admin/*'] };
