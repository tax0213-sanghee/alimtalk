/* ============================================================
   세무사 알림톡 — 로그인 상태 관리 (지금은 데모)

   ★ 지금은 이 브라우저 안(localStorage)에만 회원 정보를 적어 둔다.
     실제 서비스로 열기 전에 서버 로그인(예: Supabase Auth)으로 바꿔야 한다.
     바꿀 곳은 이 파일의 세 함수(signUp · signIn · signOut)뿐이고,
     로그인 · 회원가입 · 관리센터 화면은 그대로 쓴다.
   ★ 비밀번호를 그대로 적지 않도록 SHA-256 으로 바꿔 담지만, 데모용이다.
   ============================================================ */
(function () {
  var USERS = 'alimtalk_users', SESSION = 'alimtalk_session';
  function read(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  async function hash(s) {
    var b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('alimtalk:' + s));
    return Array.from(new Uint8Array(b)).map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
  }
  window.AlimAuth = {
    current: function () { return read(SESSION, null) || (function () { try { return JSON.parse(sessionStorage.getItem(SESSION)); } catch (e) { return null; } })(); },
    signUp: async function (u) {
      var users = read(USERS, []);
      if (users.some(function (x) { return x.email === u.email; })) throw new Error('이미 가입한 이메일입니다. 로그인해 주세요.');
      var rec = { email: u.email, pw: await hash(u.password), name: u.name, office: u.office, bizNo: u.bizNo, phone: u.phone, channel: u.channel || '', marketing: !!u.marketing, joined: new Date().toISOString() };
      users.push(rec);
      if (!write(USERS, users)) throw new Error('이 브라우저에 저장할 수 없습니다. 사생활 보호 모드를 끄고 다시 시도해 주세요.');
      return rec;
    },
    signIn: async function (email, password, keep) {
      var users = read(USERS, []), pw = await hash(password);
      var u = users.find(function (x) { return x.email === email; });
      if (!u || u.pw !== pw) throw new Error('이메일 또는 비밀번호가 맞지 않습니다.');
      var s = { email: u.email, name: u.name, office: u.office, channel: u.channel, phone: u.phone, at: Date.now() };
      try { if (keep) localStorage.setItem(SESSION, JSON.stringify(s)); else sessionStorage.setItem(SESSION, JSON.stringify(s)); } catch (e) {}
      return s;
    },
    signOut: function () { try { localStorage.removeItem(SESSION); sessionStorage.removeItem(SESSION); } catch (e) {} },
    /** 관리센터처럼 로그인해야 들어오는 화면 맨 앞에서 부른다 */
    require: function () { var s = this.current(); if (!s) { location.replace('/login?next=' + encodeURIComponent(location.pathname.split('/').pop() || 'app')); } return s; }
  };
})();
