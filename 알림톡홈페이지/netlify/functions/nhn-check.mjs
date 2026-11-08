/* ============================================================
   NHN Cloud 알림톡 연결 시험 — /api/nhn-check

   ★ 아무것도 보내지 않는다. 지난 한 시간의 발송 결과를 "조회"만 해서
     AppKey · Secret Key 가 맞는지 확인한다.
   ★ 키 값은 절대 돌려주지 않는다 — 어느 이름표로 찾았는지만 알려 준다.
   ★ 키는 Netlify 환경 변수에만 둔다:
       NHN_APPKEY      (AppKey)
       NHN_SECRET_KEY  (Secret Key)
     다른 이름으로 넣었어도 아래 후보 중 하나면 찾는다.
   ============================================================ */
const BASE = 'https://api-alimtalk.cloud.toast.com/alimtalk/v2.3';

const 찾기 = (names) => {
  for (const n of names) if (process.env[n]) return { name: n, value: process.env[n].trim() };
  return null;
};

/** 서울 시각으로 "yyyy-MM-dd HH:mm" */
const 서울시각 = (d) => {
  const k = new Date(d.getTime() + 9 * 36e5);
  const p = (x) => String(x).padStart(2, '0');
  return `${k.getUTCFullYear()}-${p(k.getUTCMonth() + 1)}-${p(k.getUTCDate())} ${p(k.getUTCHours())}:${p(k.getUTCMinutes())}`;
};

export default async () => {
  const appkey = 찾기(['NHN_APPKEY', 'NHN_APP_KEY', 'NHN_API_KEY', 'NHN_ALIMTALK_APPKEY', 'APPKEY', 'APP_KEY']);
  const secret = 찾기(['NHN_SECRET_KEY', 'NHN_SECRETKEY', 'NHN_SECRET', 'NHN_ALIMTALK_SECRET_KEY', 'SECRET_KEY', 'X_SECRET_KEY']);

  if (!appkey || !secret) {
    return Response.json({
      ok: false,
      단계: '키 찾기',
      알림: `Netlify 환경 변수에서 ${!appkey ? 'AppKey' : ''}${!appkey && !secret ? '와 ' : ''}${!secret ? 'Secret Key' : ''}를 찾지 못했습니다. 이름을 NHN_APPKEY / NHN_SECRET_KEY 로 넣고, 넣은 뒤에는 다시 배포해야 반영됩니다.`,
    }, { status: 200 });
  }

  const now = new Date();
  const url = `${BASE}/appkeys/${encodeURIComponent(appkey.value)}/message-results`
    + `?startUpdateDate=${encodeURIComponent(서울시각(new Date(now - 36e5)))}`
    + `&endUpdateDate=${encodeURIComponent(서울시각(now))}`;

  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(url, { headers: { 'X-Secret-Key': secret.value, 'Content-Type': 'application/json;charset=UTF-8' }, signal: ctl.signal });
    const body = await r.json().catch(() => ({}));
    const h = body.header || {};
    return Response.json({
      ok: !!h.isSuccessful,
      단계: 'NHN 조회',
      찾은이름표: { appkey: appkey.name, secret: secret.name },
      http: r.status,
      결과코드: h.resultCode ?? null,
      결과문구: h.resultMessage ?? null,
      알림: h.isSuccessful
        ? 'NHN Cloud 알림톡에 연결되었습니다.'
        : 'NHN Cloud 가 요청을 거절했습니다. 결과코드와 문구를 확인해 주세요 (AppKey · Secret Key 가 서로 다른 프로젝트 것이거나, 알림톡 서비스가 꺼져 있을 수 있습니다).',
    });
  } catch (e) {
    return Response.json({ ok: false, 단계: 'NHN 조회', 알림: e.name === 'AbortError' ? 'NHN Cloud 가 8초 안에 답하지 않았습니다.' : 'NHN Cloud 에 닿지 못했습니다.' });
  } finally {
    clearTimeout(t);
  }
};

export const config = { path: '/api/nhn-check' };
