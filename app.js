import { db, uid, auth } from './store.js';

/* ───────────── Utilidades ───────────── */
const app = document.getElementById('app');
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => iso(new Date());
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const addMonths = (s, n) => { const d = parse(s); const day = d.getDate(); d.setMonth(d.getMonth() + n); if (d.getDate() !== day) d.setDate(0); return iso(d); };
const mondayOf = (s) => { const d = parse(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
const isoDow = (s) => ((parse(s).getDay() + 6) % 7) + 1; // 1 = lunes … 7 = domingo
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
const DOW = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DOWL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fmtShort = (s) => { const d = parse(s); return `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`; };
const fmtLong = (s) => { const d = parse(s); return `${DOWL[d.getDay()]} ${d.getDate()} de ${MONL[d.getMonth()]}`; };
const relDay = (s) => { const n = daysBetween(today(), s); if (n === 0) return 'hoy'; if (n === 1) return 'mañana'; if (n === -1) return 'ayer'; return fmtShort(s); };
const toMin = (t) => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
const fromMin = (m) => `${pad(Math.floor(((m % 1440) + 1440) % 1440 / 60))}:${pad(((m % 60) + 60) % 60)}`;
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => (n || n === 0) && n !== '' ? Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : '';
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

const ICON = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  shuffle: '<path d="M4 7h3c5 0 5 10 10 10h3M4 17h3c2 0 3-1.5 4-3M17 4l3 3-3 3M17 14l3 3-3 3M13 9c1-1 2-2 4-2h3"/>',
  cart: '<path d="M4.8 9h14.4l-1.3 9.2c-.1.9-.9 1.6-1.8 1.6H7.9c-.9 0-1.7-.7-1.8-1.6z"/><path d="M8.5 9c0-2.2 1.6-4.2 3.5-4.2s3.5 2 3.5 4.2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>'
};
const svg = (k, size = 20, sw = 2) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

const TILE_ICON = {
  tareas: ['M6.5 4.5h11c1 0 1.8.8 1.8 1.8v11.4c0 1-.8 1.8-1.8 1.8h-11c-1 0-1.8-.8-1.8-1.8V6.3c0-1 .8-1.8 1.8-1.8z', 'M8.5 12.2l2.4 2.4 4.6-5'],
  menu: ['M4 13h16a8 8 0 0 1-16 0z', 'M9 4c-1 1.5 1 2.5 0 4M13 4c-1 1.5 1 2.5 0 4M3 13h18'],
  compra: ['M4.8 9h14.4l-1.3 9.2c-.1.9-.9 1.6-1.8 1.6H7.9c-.9 0-1.7-.7-1.8-1.6z', 'M8.5 9c0-2.2 1.6-4.2 3.5-4.2s3.5 2 3.5 4.2M10 13v3M14 13v3'],
  cole: ['M4.5 6.5c2.5-1 5-1 7.5.5v12c-2.5-1.5-5-1.5-7.5-.5z', 'M12 7c2.5-1.5 5-1.5 7.5-.5v12c-2.5-1-5-1-7.5.5'],
  salud: ['M9.2 19.6a4.4 4.4 0 0 1-6.2-6.2l7.2-7.2a4.4 4.4 0 0 1 6.2 6.2z', 'M7.6 9.2l6.2 6.2'],
  casa: ['M4.5 10.6 12 4.5l7.5 6.1v7.6c0 1-.8 1.8-1.8 1.8H6.3c-1 0-1.8-.8-1.8-1.8z', 'M10 20v-4.5c0-.6.4-1 1-1h2c.6 0 1 .4 1 1V20']
};
const tileSvg = (k) => `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="position:relative"><path d="${TILE_ICON[k][0]}" fill="currentColor" fill-opacity="0.14"/><path d="${TILE_ICON[k][1]}"/></svg>`;

/* ───────────── Personas ───────────── */
const FAM = { id: 'f', name: 'Familia', tone: '#E9E4DC', ink: '#3F3A33' };
const people = () => db.all('people');
const person = (id) => people().find((p) => p.id === id) || FAM;
const kids = () => people().filter((p) => p.kid);
const me = () => person(db.settings().user);
const isAdmin = () => !!auth.me().admin;
const whoDot = (id) => { const p = person(id); return `<span class="who" style="background:${p.tone};color:${p.ink}" title="${esc(p.name)}">${esc(p.name[0])}</span>`; };
const colorOf = (ids) => (ids.length === 1 ? person(ids[0]) : FAM);

/* ───────────── Estado de pantalla ───────────── */
const ui = {
  who: 'all', week: 0, view: 'semana', month: 0, filter: {},
  compraMode: 'lista', shop: null, q: '', menuWeek: 0, coleKid: 'todos', addType: 'evento',
  editFicha: null, editRecipe: null, showDone: false,
  login: { step: 'email', email: '', msg: '', busy: false }
};
let phase = 'loading'; // loading | login | ok | offline | nofamily | error

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2800);
}

/* ───────────── Saludo según la hora ───────────── */
const saludo = () => { const h = new Date().getHours(); return h >= 6 && h < 13 ? 'Buenos días' : h >= 13 && h < 21 ? 'Buenas tardes' : 'Buenas noches'; };

/* ───────────── Tiempo (Open-Meteo, sin claves) ───────────── */
const WX_KEY = 'casa-wx';
const PLACE = { name: 'Sanse', full: 'San Sebastián de los Reyes', lat: 40.5474, lon: -3.6261 };
let wx = null;
try { wx = JSON.parse(localStorage.getItem(WX_KEY) || 'null'); } catch (e) { wx = null; }
const WX_TXT = (c) => (c === 0 ? 'Despejado' : c <= 2 ? 'Intervalos' : c === 3 ? 'Nublado' : c <= 48 ? 'Niebla' : c <= 57 ? 'Llovizna' : c <= 67 ? 'Lluvia' : c <= 77 ? 'Nieve' : c <= 82 ? 'Chubascos' : 'Tormenta');
const WX_ICO = (c) => (c === 0 ? '☀︎' : c <= 2 ? '⛅︎' : c === 3 ? '☁︎' : c <= 48 ? '🌫︎' : c <= 67 || (c >= 80 && c <= 82) ? '☂︎' : c <= 77 ? '❄︎' : '⚡︎');
async function loadWeather() {
  if (wx && !wx.snapshot && Date.now() - wx.ts < 30 * 60 * 1000) return;
  const use = (j, snapshot) => {
    wx = { ts: snapshot ? j.fetchedAt : Date.now(), snapshot, now: Math.round(j.current.temperature_2m), code: j.current.weather_code, daily: j.daily };
    if (!snapshot) try { localStorage.setItem(WX_KEY, JSON.stringify(wx)); } catch (e) { /* ignorado */ }
    const route = parts()[0] || '';
    if (route === '' || route === 'tiempo') render();
  };
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${PLACE.lat}&longitude=${PLACE.lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FMadrid&forecast_days=7`;
    const r = await fetch(u);
    if (r.ok) { use(await r.json(), false); return; }
  } catch (e) { /* sin acceso a internet desde esta vista: se prueba la copia */ }
  // En la vista previa de claude.ai no se puede consultar el servicio del tiempo:
  // se usa la previsión que se guarda junto a la app cada vez que se publica.
  try {
    const r = await fetch('wx.json', { cache: 'no-store' });
    if (r.ok) use(await r.json(), true);
  } catch (e) { /* sin previsión */ }
}
const wxStamp = () => { if (!wx || !wx.snapshot) return ''; const d = new Date(wx.ts); return `Previsión del ${d.getDate()} ${MON[d.getMonth()]} a las ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/* ───────────── Agenda: qué pasa cada día ───────────── */
const WORK = new Set(['vuelo', 'curso', 'oficina']);
const shiftTitle = (sh) => (sh.kind === 'vuelo' ? `Silvia vuela${sh.place ? ' · ' + sh.place : ''}` : sh.kind === 'curso' ? 'Silvia: curso' : sh.kind === 'oficina' ? `Silvia: oficina${sh.place ? ' en ' + sh.place : ' (online)'}` : sh.kind === 'libre' ? 'Silvia libre' : 'Silvia: reducción');
const shiftSub = (sh) => (sh.kind === 'vuelo' ? `Firma ${sh.start} · vuelve ${sh.end}` : sh.start ? `${sh.start}–${sh.end}` : '');

function occursOn(ev, d) {
  if (d < ev.date) return false;
  if (ev.until && d > ev.until) return false;
  const rep = ev.repeat || 'no';
  if (rep === 'no') return d === ev.date;
  if (rep === 'semanal') { const days = ev.days && ev.days.length ? ev.days : [isoDow(ev.date)]; return days.includes(isoDow(d)); }
  if (rep === 'mensual') return parse(d).getDate() === parse(ev.date).getDate();
  if (rep === 'anual') return d.slice(5) === ev.date.slice(5);
  return false;
}

function itemsOn(date) {
  const out = [];
  for (const sh of db.all('shifts')) {
    if (sh.date !== date || !WORK.has(sh.kind)) continue;
    out.push({ who: ['s'], kind: 'shift', title: shiftTitle(sh), short: sh.kind === 'vuelo' ? `✈︎${sh.start}` : sh.kind === 'curso' ? 'Curso' : 'Oficina', sub: shiftSub(sh), time: sh.start, end: sh.end, away: sh.away, href: `#turno-${sh.id}` });
  }
  for (const ev of db.all('events')) {
    if (!occursOn(ev, date)) continue;
    out.push({ who: ev.who && ev.who.length ? ev.who : ['f'], kind: 'event', title: ev.title, short: `${ev.time ? ev.time + ' ' : ''}${ev.title}`, sub: [ev.endTime ? `hasta ${ev.endTime}` : '', ev.place].filter(Boolean).join(' · '), time: ev.time, end: ev.endTime, href: `#anadir-evento-${ev.id}` });
  }
  for (const t of db.all('school')) {
    if (t.date !== date || t.done) continue;
    out.push({ who: [t.kid], kind: 'school', title: coleTitle(t), short: t.title, sub: person(t.kid).name, href: '#cole' });
  }
  for (const t of db.all('tasks')) {
    if (t.date !== date || t.done) continue;
    out.push({ who: [t.who || 'f'], kind: 'task', title: t.title, sub: 'Tarea', time: t.time, href: '#tareas' });
  }
  for (const b of db.all('bills')) {
    if (b.date !== date || b.done) continue;
    out.push({ who: ['f'], kind: 'bill', title: b.title, sub: [b.kind === 'recibo' ? 'Recibo' : 'Vence', money(b.amount)].filter(Boolean).join(' · '), href: '#casa' });
  }
  for (const p of people()) {
    if (p.cumple && p.cumple.slice(5) === date.slice(5)) out.push({ who: [p.id], kind: 'bday', title: `Cumple de ${p.name}`, sub: '' });
  }
  return out.sort((a, b) => (toMin(a.time) ?? -1) - (toMin(b.time) ?? -1));
}

const AFT = [toMin('16:30'), toMin('20:30')];
const overlapsAft = (start, end) => { const s = toMin(start); if (s == null) return false; const e = toMin(end) ?? s + 120; const e2 = e < s ? e + 1440 : e; return s < AFT[1] && e2 > AFT[0]; };
const isSchoolDay = (d) => isoDow(d) <= 5;
const silviaOut = (d) => db.all('shifts').some((sh) => sh.date === d && WORK.has(sh.kind) && overlapsAft(sh.start, sh.end));
const marioOut = (d) => db.all('events').some((ev) => (ev.who || []).includes('m') && occursOn(ev, d) && overlapsAft(ev.time, ev.endTime));
function pickup(d) {
  if (!isSchoolDay(d)) return null;
  const cover = db.raw().cover[d];
  const s = silviaOut(d), m = marioOut(d);
  if (cover) return { who: cover, set: true };
  if (s && m) return { clash: true };
  if (s) return { who: 'Mario', auto: true };
  if (m) return { who: 'Silvia', auto: true };
  return null;
}
const PICKERS = ['Mario', 'Silvia', 'Abuelos', 'Canguro'];

/* ───────────── Rutas ───────────── */
const parts = () => (location.hash.replace(/^#\/?/, '') || '').split(/[\/-]/).filter(Boolean).map(decodeURIComponent);
// Pedir confirmación dentro de la propia app (los avisos del navegador no funcionan en todos los sitios):
// el primer toque arma el botón y cambia su texto; el segundo, en 4 segundos, confirma.
function armed(el, label = '¿Seguro? Toca otra vez') {
  if (el.dataset.armed === '1') return true;
  el.dataset.armed = '1';
  const prev = el.innerHTML;
  el.innerHTML = esc(label);
  el.style.width = 'auto'; el.style.padding = '0 10px'; el.style.background = 'var(--bad-bg)'; el.style.color = 'var(--bad-ink)';
  setTimeout(() => { if (el.isConnected) { el.dataset.armed = ''; el.innerHTML = prev; el.removeAttribute('style'); } }, 4000);
  return false;
}
const SANDBOXED = /claude/.test(location.hostname) || window.top !== window;
const ROUTES = {
  '': home, agenda, tareas, compra, menu, recetario, cole, salud, casa, tiempo, ajustes, anadir, turno
};

function render() {
  if (phase !== 'ok' && phase !== 'offline') { app.innerHTML = login(); const f = document.getElementById(ui.login.email ? 'l-pass' : 'l-email'); if (f && phase === 'login' && !ui.login.busy) f.focus(); return; }
  const [r, ...args] = parts();
  const fn = ROUTES[r || ''] || home;
  const active = document.activeElement;
  const focusId = active && active.id;
  const sel = focusId && active.selectionStart != null ? [active.selectionStart, active.selectionEnd] : null;
  app.innerHTML = fn(...args);
  if (focusId) {
    const el = document.getElementById(focusId);
    if (el) { el.focus(); if (sel && el.setSelectionRange) try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { /* ignorado */ } }
  }
}

const bar = (title, back = '#') => `<div class="bar"><a class="back" href="${back}">${svg('back', 18)}Inicio</a><h1>${esc(title)}</h1></div>`;
const pressed = (b) => `aria-pressed="${b ? 'true' : 'false'}"`;

/* ───────────── ENTRAR (solo correos de la familia, con código por correo) ───────────── */
function login() {
  const L = ui.login;
  const body = phase === 'loading'
    ? '<p class="small" style="text-align:center">Abriendo…</p>'
    : `<form class="card" data-f="login">
          <label class="field"><span>Tu correo</span><input id="l-email" type="email" name="email" autocomplete="username" inputmode="email" value="${esc(L.email)}" required></label>
          <label class="field"><span>Contraseña</span><input id="l-pass" type="password" name="password" autocomplete="current-password" required></label>
          <button class="btn block" ${L.busy ? 'disabled' : ''}>${L.busy ? 'Entrando…' : 'Entrar'}</button>
          <p class="small">Solo puede entrar la familia. El iPhone puede guardar la contraseña para no tener que escribirla más.</p></form>`;
  return `<div class="login-wrap"><img src="icon.svg" alt="" width="72" height="72" style="border-radius:18px">
    <h1 style="font-family:var(--serif);font-size:30px">Casa y familia</h1>
    ${body}
    ${L.msg ? `<p class="small" role="alert" style="color:var(--bad-ink);text-align:center">${esc(L.msg)}</p>` : ''}</div>`;
}
const loginError = (e) => {
  const m = String(e && (e.message || e.code) || '');
  if (/not allowed|signups|not found|Signup/i.test(m)) return 'Ese correo no está dado de alta en la app.';
  if (/rate|too many|seconds/i.test(m)) return 'Demasiados intentos. Espera un poco y vuelve a probar.';
  if (/invalid login|credentials|invalid/i.test(m)) return 'Correo o contraseña incorrectos.';
  if (/no es de la familia/i.test(m)) return 'Ese correo no es de la familia.';
  return 'No se ha podido. Comprueba la conexión e inténtalo otra vez.';
};

/* ───────────── INICIO ───────────── */
const TILES = [
  { k: 'tareas', label: 'Tareas', bg: '#F3E6C4', fg: '#6E5113', href: '#tareas' },
  { k: 'menu', label: 'Menú', bg: '#F7D9D2', fg: '#8E3A2C', href: '#menu' },
  { k: 'compra', label: 'Compra', bg: '#DCEBDC', fg: '#2F5D3A', href: '#compra' },
  { k: 'cole', label: 'Cole', bg: '#F6DFD0', fg: '#8A3E1E', href: '#cole' },
  { k: 'salud', label: 'Salud', bg: '#D4ECEE', fg: '#1F5A60', href: '#salud' },
  { k: 'casa', label: 'Casa', bg: '#ECE3D6', fg: '#5E4A35', href: '#casa' }
];

function tileInfo(k) {
  const t = today();
  if (k === 'tareas') { const n = db.all('tasks').filter((x) => !x.done).length; return { sub: n ? `${n} pendiente${n > 1 ? 's' : ''}` : 'Todo hecho', badge: n }; }
  if (k === 'menu') { const d = menuDay(t); return { sub: d && d.dishes.length ? `Hoy: ${dishName(d.dishes[0])}` : 'Sin menú', badge: 0 }; }
  if (k === 'compra') { const n = db.all('shopping').filter((x) => !x.done).length; return { sub: n ? `${n} en la lista` : 'Lista vacía', badge: n }; }
  if (k === 'cole') { const n = db.all('school').filter((x) => !x.done && x.date && daysBetween(t, x.date) <= 7).length; const ok = eduOk(); return { sub: ok ? 'Educamos al día' : 'Educamos sin leer', badge: n }; }
  if (k === 'salud') { const p = pendingDoses(); return { sub: p.length ? `Toma ${p[0].time}: ${p[0].who}` : activeMeds().length ? 'Tomas al día' : 'Sin tratamientos', badge: p.length }; }
  if (k === 'casa') { const n = db.all('bills').filter((b) => !b.done && daysBetween(t, b.date) <= (b.notice ?? 15)).length; return { sub: n ? 'Vencimientos cerca' : 'Recibos y vencimientos', badge: n }; }
  return { sub: '', badge: 0 };
}

function homeAlerts() {
  const out = [];
  const st = auth.status();
  if (st.error) out.push(`<div class="alert warn"><span><b>Cambios sin guardar</b>${esc(st.error)}</span></div>`);
  else if (!st.online) out.push(`<div class="alert info"><span><b>Sin conexión</b>Lo que apuntes se guarda en cuanto vuelva.</span></div>`);
  const t = today();
  const edu = db.raw().educamos;
  if (!eduOk()) {
    out.push(edu.status === 'sin-conectar'
      ? `<a class="alert info" href="#cole"><span><b>Educamos aún no está conectado</b>Lo del cole hay que apuntarlo a mano de momento.</span></a>`
      : `<a class="alert warn" href="#cole"><span><b>Hoy no se ha podido leer Educamos</b>Última lectura: ${edu.lastRead ? relDay(edu.lastRead.slice(0, 10)) : 'nunca'}. Revisadlo en su app.</span></a>`);
  }
  for (let k = 0; k < 7; k++) {
    const d = addDays(t, k); const p = pickup(d);
    if (p && p.clash) {
      out.push(`<div class="alert bad"><span><b>${esc(cap(relDay(d)))}: nadie recoge a los niños</b>Silvia trabaja por la tarde y Mario tiene un compromiso. ¿Quién va?
      <span class="actions">${PICKERS.map((w) => `<button class="btn sm ghost" data-a="cover" data-d="${d}" data-w="${w}">${w}</button>`).join('')}</span></span></div>`);
    }
  }
  const away = db.all('shifts').find((sh) => sh.date === t && sh.away);
  if (away) out.push(`<div class="alert info"><span><b>Silvia duerme hoy en ${esc(away.away)}</b>Mario se encarga de la cena, el baño y el desayuno.</span></div>`);
  if (new Date().getHours() >= 17) {
    const tm = addDays(t, 1);
    const items = itemsOn(tm);
    const meds = activeMeds(tm).length;
    if (items.length || meds) {
      out.push(`<a class="card" href="#agenda" style="background:#E6E1F7;color:#2E2560"><span class="label" style="color:#4C3F8F">Para mañana · ${esc(fmtShort(tm))}</span>
      ${items.slice(0, 5).map((it) => `<span class="row"><span>${esc(it.title)}</span><span class="end">${esc(it.time || '')}</span></span>`).join('')}
      ${meds ? `<span class="row"><span>Medicinas: ${meds} tratamiento${meds > 1 ? 's' : ''}</span><span class="end"></span></span>` : ''}</a>`);
    }
  }
  const soon = db.all('bills').filter((b) => !b.done && daysBetween(t, b.date) <= Math.min(b.notice ?? 15, 15)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2);
  for (const b of soon) {
    const n = daysBetween(t, b.date);
    out.push(`<a class="alert ${n < 0 ? 'bad' : 'warn'}" href="#casa"><span><b>${esc(b.title)}</b>${n < 0 ? 'Vencido el ' : 'Vence '}${esc(relDay(b.date))}${b.amount ? ' · ' + money(b.amount) : ''}</span></a>`);
  }
  for (const p of people()) {
    if (!p.cumple) continue;
    let next = `${t.slice(0, 4)}-${p.cumple.slice(5)}`; if (next < t) next = `${+t.slice(0, 4) + 1}-${p.cumple.slice(5)}`;
    const n = daysBetween(t, next);
    if (n <= 14) out.push(`<div class="alert info"><span><b>Cumple de ${esc(p.name)} ${n === 0 ? '¡hoy!' : esc(relDay(next))}</b>${p.id !== db.settings().user ? 'Mira sus ideas de regalo en su ficha.' : ''}</span></div>`);
  }
  return out.join('');
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function home() {
  const p = people();
  const u = me();
  const d = new Date();
  const wxTxt = wxHeader();
  const chips = [{ id: 'all', name: 'Todos', tone: '#E9E4DC', ink: '#3F3A33', initial: '✦' }, ...p].map((x) => `
    <button class="person" data-a="who" data-id="${x.id}" ${pressed(ui.who === x.id)} style="--ring:${x.ink}">
      <span class="dot" style="background:${x.tone};color:${x.ink}">${esc(x.initial || x.name[0])}</span>${esc(x.name)}</button>`).join('');
  let body;
  if (ui.who === 'all') {
    const t = today();
    const days = [0, 1, 2, 3].map((k) => addDays(t, k));
    const clashes = days.filter((x) => pickup(x)?.clash).length;
    const visible = TILES.filter((x) => !db.settings().hiddenTiles.includes(x.k));
    body = `<div class="tiles">
      <a class="agenda-mini" href="#agenda">
        <span class="card-head"><span style="display:flex;gap:8px;align-items:center;font-family:var(--serif);font-size:20px;font-weight:600">Agenda</span>
        ${clashes ? `<span class="badge" style="position:static;background:var(--bad-ink)">${clashes} choque${clashes > 1 ? 's' : ''}</span>` : ''}</span>
        <span class="days4">${days.map((x) => {
          const its = itemsOn(x); const c = pickup(x)?.clash;
          return `<span class="day4 ${c ? 'clash' : ''}"><span class="d">${x === t ? 'HOY' : DOW[parse(x).getDay()].toUpperCase()} <b style="color:var(--ink)">${parse(x).getDate()}</b></span>
            ${its.slice(0, 3).map((it) => { const col = colorOf(it.who); return `<span class="chip-ev" style="background:${col.tone};color:${col.ink}">${esc(it.time ? it.time + ' ' : '')}${esc(it.title)}</span>`; }).join('')}
            ${its.length > 3 ? `<span class="small">+${its.length - 3} más</span>` : ''}${!its.length ? '<span class="small">Libre</span>' : ''}</span>`;
        }).join('')}</span></a>
      ${visible.map((x) => { const inf = tileInfo(x.k); return `<a class="tile" href="${x.href}" style="background:${x.bg};color:${x.fg}">${tileSvg(x.k)}
        <span><strong>${x.label}</strong><small>${esc(inf.sub)}</small></span>${inf.badge ? `<span class="badge" style="background:${x.fg}">${inf.badge}</span>` : ''}</a>`; }).join('')}
    </div>`;
  } else {
    body = personView(ui.who);
  }
  return `
  <header class="top">
    <div class="brand">
      <div class="logo" aria-hidden="true">${p.map((x) => `<span style="background:${x.tone};color:${x.ink}">${x.name[0]}</span>`).join('')}</div>
      <div><p class="phrase">${esc(saludo())}</p>
      <a class="meta" href="#tiempo">${DOWL[d.getDay()].slice(0, 3).replace(/^./, (c) => c.toUpperCase())} ${d.getDate()} ${MON[d.getMonth()]} · ${wxTxt}</a></div>
    </div>
    <a class="me" href="#ajustes" style="background:${u.tone};color:${u.ink}" aria-label="Ajustes (entras como ${esc(u.name)})">${esc(u.name[0])}</a>
  </header>
  <div class="people">${chips}</div>
  ${ui.who === 'all' ? homeAlerts() : ''}
  ${body}
  <a class="fab" href="#anadir">${svg('plus', 20, 2.4)}Añadir</a>`;
}

function personView(id) {
  const p = person(id);
  const t = today();
  const until = addDays(t, 7);
  const blocks = [];
  // Próximos días
  const next = [];
  for (let k = 0; k <= 7; k++) { const d = addDays(t, k); for (const it of itemsOn(d)) if (it.who.includes(id)) next.push({ d, it }); }
  const headline = id === 's' ? silviaHeadline() : next.length ? `${cap(relDay(next[0].d))}: ${next[0].it.title}` : 'Semana tranquila';
  blocks.push(`<div class="card" style="background:${p.tone};color:${p.ink}"><h2 style="font-size:22px">Lo de ${esc(p.name)}</h2><p style="font-size:14px">${esc(headline)}</p></div>`);
  blocks.push(`<div class="card"><div class="card-head"><span class="label" style="color:${p.ink}">${id === 's' ? 'Trabajo y agenda' : 'Agenda'} · 7 días</span><a class="small" href="#agenda">Ver agenda</a></div>
    ${next.length ? next.slice(0, 8).map(({ d, it }) => `<div class="row"><span>${esc(it.title)}${it.away ? ` <span class="away">Duerme en ${esc(it.away)}</span>` : ''}</span><span class="end" style="color:${p.ink}">${esc(relDay(d))}${it.time ? ' ' + esc(it.time) : ''}</span></div>`).join('') : '<p class="empty">Nada apuntado.</p>'}</div>`);
  const tasks = db.all('tasks').filter((x) => !x.done && x.who === id);
  if (!p.kid || tasks.length) blocks.push(`<div class="card"><div class="card-head"><span class="label" style="color:${p.ink}">Tareas</span><a class="small" href="#tareas">Ver todas</a></div>
    ${tasks.length ? tasks.map((x) => `<div class="row"><span>${esc(x.title)}</span><span class="end" style="color:${p.ink}">${x.date ? esc(relDay(x.date)) : ''}</span></div>`).join('') : '<p class="empty">Sin tareas.</p>'}</div>`);
  if (p.kid) {
    const sc = db.all('school').filter((x) => x.kid === id && !x.done).sort(byDate);
    blocks.push(`<div class="card"><div class="card-head"><span class="label" style="color:${p.ink}">Cole</span><a class="small" href="#cole">Abrir</a></div>
      ${sc.length ? sc.slice(0, 6).map((x) => `<div class="row"><span>${esc(TYPE_COLE[x.type] || '')}: ${esc(x.title)}</span><span class="end" style="color:${p.ink}">${x.date ? esc(relDay(x.date)) : ''}</span></div>`).join('') : '<p class="empty">Nada pendiente.</p>'}</div>`);
  }
  const meds = activeMeds().filter((m) => m.who === id);
  if (meds.length) blocks.push(`<div class="card"><div class="card-head"><span class="label" style="color:${p.ink}">Salud</span><a class="small" href="#salud">Abrir</a></div>
    ${meds.map((m) => `<div class="row"><span>${esc(m.name)}</span><span class="end" style="color:${p.ink}">cada ${m.every} h</span></div>`).join('')}</div>`);
  // Regalos (ocultos para la propia persona)
  if (db.settings().user !== id) {
    const g = db.all('gifts').filter((x) => x.who === id && !x.done);
    blocks.push(`<div class="card"><div class="card-head"><span class="label" style="color:${p.ink}">Ideas de regalo</span><span class="small">${esc(p.name)} no las ve</span></div>
      ${g.map((x) => `<div class="item"><span class="grow"><span class="t">${esc(x.text)}</span><span class="s">${esc(x.occasion || '')}</span></span>
        <button class="icon-btn" data-a="gift-done" data-id="${x.id}" aria-label="Ya comprado">${svg('check', 18)}</button>
        <button class="icon-btn" data-a="del" data-col="gifts" data-id="${x.id}" aria-label="Borrar">${svg('x', 18)}</button></div>`).join('')}
      <form class="inline-add" data-f="gift" data-who="${id}"><input type="text" name="text" placeholder="Nueva idea" aria-label="Nueva idea de regalo" required>
        <select name="occasion" aria-label="Ocasión" style="width:110px"><option>Cumple</option><option>Reyes</option><option>Santo</option><option>Otro</option></select>
        <button class="btn sm" aria-label="Añadir idea">${svg('plus', 18)}</button></form></div>`);
  }
  // Datos
  if (ui.editFicha === id) {
    blocks.push(`<form class="card" data-f="ficha" data-id="${id}"><span class="label" style="color:${p.ink}">Datos de ${esc(p.name)}</span>
      <label class="field"><span>Cumpleaños</span><input type="date" name="cumple" value="${esc(p.cumple)}"></label>
      <div class="two"><label class="field"><span>Talla</span><input type="text" name="talla" value="${esc(p.talla)}"></label>
      <label class="field"><span>Pie</span><input type="text" name="pie" value="${esc(p.pie)}"></label></div>
      <div class="two"><button type="button" class="btn soft" data-a="ficha-cancel">Cancelar</button><button class="btn">Guardar</button></div></form>`);
  } else {
    const age = p.cumple ? Math.floor(daysBetween(p.cumple, today()) / 365.25) : null;
    blocks.push(`<div class="card"><div class="card-head"><span class="label" style="color:${p.ink}">Datos</span><button class="btn sm soft" data-a="ficha-edit" data-id="${id}">${svg('edit', 16)}Editar</button></div>
      <div class="row"><span>Cumpleaños</span><span class="end">${p.cumple ? `${parse(p.cumple).getDate()} de ${MONL[parse(p.cumple).getMonth()]}${p.kid && age != null ? ` · ${age} años` : ''}` : '—'}</span></div>
      <div class="row"><span>Talla</span><span class="end">${esc(p.talla) || '—'}</span></div>
      <div class="row"><span>Pie</span><span class="end">${esc(p.pie) || '—'}</span></div></div>`);
  }
  return blocks.join('');
}

function silviaHeadline() {
  const t = today();
  for (let k = 0; k < 14; k++) {
    const d = addDays(t, k);
    const sh = db.all('shifts').filter((x) => x.date === d && WORK.has(x.kind));
    if (sh.length) return `${cap(relDay(d))}: ${shiftTitle(sh[0])}${sh[0].start ? ', firma ' + sh[0].start : ''}`;
  }
  return 'Sin trabajo apuntado en dos semanas';
}

/* ───────────── AGENDA ───────────── */
function agenda() {
  const t = today();
  const start = addDays(mondayOf(t), ui.week * 7);
  const days = Array.from({ length: 7 }, (_, k) => addDays(start, k));
  const F = ui.filter;
  const show = (it) => it.who.some((w) => F[w] !== false);
  const fchip = (k, label) => `<button class="chip" data-a="filter" data-k="${k}" ${pressed(F[k] !== false)}>${label}</button>`;
  const viewSeg = `<div class="seg" role="group" aria-label="Vista"><button data-a="aview" data-v="semana" ${pressed(ui.view === 'semana')}>Semana</button><button data-a="aview" data-v="mes" ${pressed(ui.view === 'mes')}>Mes</button></div>`;
  const chipsRow = `<div class="chips">${people().map((p) => fchip(p.id, esc(p.name))).join('')}${fchip('f', 'Familia')}</div>`;
  if (ui.view === 'mes') return agendaMonth(show, viewSeg, chipsRow);
  return `${bar('Agenda')}${viewSeg}
  <div class="card-head"><button class="icon-btn" data-a="week" data-n="-1" aria-label="Semana anterior">${svg('back', 18)}</button>
    <button class="btn sm soft" data-a="week" data-n="0">${parse(start).getDate()} ${MON[parse(start).getMonth()]} – ${parse(days[6]).getDate()} ${MON[parse(days[6]).getMonth()]}${ui.week ? ' · volver a hoy' : ''}</button>
    <button class="icon-btn" data-a="week" data-n="1" aria-label="Semana siguiente" style="transform:scaleX(-1)">${svg('back', 18)}</button></div>
  ${chipsRow}
  ${days.map((d) => {
    const its = itemsOn(d).filter(show);
    const p = pickup(d);
    return `<section class="day ${d === t ? 'today' : ''} ${p?.clash ? 'clash' : ''}">
      <div class="day-head"><h3>${esc(cap(DOWL[parse(d).getDay()]))} ${parse(d).getDate()}</h3><span class="small">${d === t ? 'Hoy' : ''}</span></div>
      ${its.map((it) => { const c = colorOf(it.who); const tag = it.href ? 'a' : 'div';
        return `<${tag} class="ev" ${it.href ? `href="${it.href}"` : ''} style="background:${c.tone};color:${c.ink}"><span class="time">${esc(it.time || '·')}</span>
          <span class="tx">${esc(it.title)}${it.sub ? `<small>${esc(it.sub)}</small>` : ''}${it.away ? `<span class="away">Duerme en ${esc(it.away)}</span>` : ''}</span></${tag}>`; }).join('')}
      ${!its.length ? '<p class="empty">Nada apuntado</p>' : ''}
      ${p ? `<div class="pickup">${p.clash ? '<b style="color:var(--bad-ink)">Nadie recoge a los niños.</b>' : `Recoge a los niños: <b style="color:var(--ink)">${esc(p.who)}</b>`}
        ${PICKERS.map((w) => `<button class="chip" data-a="cover" data-d="${d}" data-w="${w}" ${pressed(p.who === w && p.set)}>${w}</button>`).join('')}</div>` : ''}
    </section>`;
  }).join('')}
  <a class="fab" href="#anadir-evento">${svg('plus', 20, 2.4)}Añadir</a>`;
}

// Vista de mes: calendario de siempre. Al tocar un día se abre su semana.
function agendaMonth(show, viewSeg, chipsRow) {
  const t = today();
  const first = addMonths(t.slice(0, 8) + '01', ui.month);
  const fd = parse(first);
  const start = mondayOf(first);
  const last = iso(new Date(fd.getFullYear(), fd.getMonth() + 1, 0));
  const weeks = Math.ceil((daysBetween(start, last) + 1) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, k) => addDays(start, k));
  return `${bar('Agenda')}${viewSeg}
  <div class="card-head"><button class="icon-btn" data-a="month" data-n="-1" aria-label="Mes anterior">${svg('back', 18)}</button>
    <button class="btn sm soft" data-a="month" data-n="0">${cap(MONL[fd.getMonth()])} ${fd.getFullYear()}${ui.month ? ' · volver a hoy' : ''}</button>
    <button class="icon-btn" data-a="month" data-n="1" aria-label="Mes siguiente" style="transform:scaleX(-1)">${svg('back', 18)}</button></div>
  ${chipsRow}
  <div class="month">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((l) => `<span class="mh">${l}</span>`).join('')}
  ${cells.map((d) => {
    const its = itemsOn(d).filter(show);
    const out = d.slice(0, 7) !== first.slice(0, 7);
    const clash = pickup(d)?.clash;
    const away = its.some((it) => it.away);
    return `<button class="mday ${out ? 'out' : ''} ${d === t ? 'today' : ''} ${clash ? 'clash' : ''}" data-a="goday" data-d="${d}" aria-label="${esc(fmtLong(d))}: ${its.length} cosa${its.length === 1 ? '' : 's'}">
      <span class="n">${parse(d).getDate()}${away ? ' 🌙' : ''}</span>
      ${its.slice(0, 3).map((it) => { const c = colorOf(it.who); return `<span class="mev" style="background:${c.tone};color:${c.ink}">${esc(it.short || it.title)}</span>`; }).join('')}
      ${its.length > 3 ? `<span class="more">+${its.length - 3}</span>` : ''}</button>`;
  }).join('')}</div>
  <p class="small">Toca un día para ver su semana. 🌙 = Silvia duerme fuera; borde rojo = nadie recoge a los niños.</p>
  <a class="fab" href="#anadir-evento">${svg('plus', 20, 2.4)}Añadir</a>`;
}

/* ───────────── Turno de Silvia (cambios de última hora) ───────────── */
function turno(id) {
  const sh = id ? db.get('shifts', id) : null;
  const v = sh || { date: today(), kind: 'vuelo', start: '', end: '', place: '', away: '' };
  return `${bar(sh ? 'Trabajo de Silvia' : 'Nuevo trabajo de Silvia', '#agenda')}
  <form class="card" data-f="turno" data-id="${sh ? sh.id : ''}">
    <label class="field"><span>Día</span><input type="date" name="date" value="${esc(v.date)}" required></label>
    <label class="field"><span>Qué es</span><select name="kind">${[['vuelo', 'Vuelo'], ['curso', 'Curso'], ['oficina', 'Oficina'], ['libre', 'Libre'], ['reduccion', 'Reducción']].map(([k, l]) => `<option value="${k}" ${v.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <div class="two"><label class="field"><span>Firma / empieza</span><input type="time" name="start" value="${esc(v.start)}"></label>
    <label class="field"><span>Vuelve / acaba</span><input type="time" name="end" value="${esc(v.end)}"></label></div>
    <label class="field"><span>Destinos (opcional)</span><input type="text" name="place" value="${esc(v.place)}" placeholder="Ej.: Oporto y Santiago"></label>
    <label class="field"><span>¿Duerme fuera? Escribe dónde</span><input type="text" name="away" value="${esc(v.away)}" placeholder="Vacío si duerme en casa"></label>
    <button class="btn block">Guardar</button>
    ${sh ? `<button type="button" class="btn danger block" data-a="del" data-col="shifts" data-id="${sh.id}" data-back="#agenda">Borrar este día</button>` : ''}
  </form>`;
}

/* ───────────── TAREAS ───────────── */
const byDate = (a, b) => (a.date || '9999').localeCompare(b.date || '9999');
function tareas() {
  const all = db.all('tasks');
  const pend = all.filter((x) => !x.done).sort(byDate);
  const done = all.filter((x) => x.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0)).slice(0, 15);
  const row = (x) => `<div class="item ${x.done ? 'done' : ''}">
    <button class="check" data-a="task" data-id="${x.id}" ${pressed(x.done)} aria-label="Hecha">${x.done ? svg('check', 16, 3) : ''}</button>
    <span class="grow"><span class="t">${esc(x.title)}</span><span class="s">${x.date ? esc(relDay(x.date)) : 'Sin fecha'}${x.doneBy ? ' · hizo ' + esc(person(x.doneBy).name) : ''}</span></span>
    ${whoDot(x.who || 'f')}
    <button class="icon-btn" data-a="del" data-col="tasks" data-id="${x.id}" aria-label="Borrar">${svg('x', 18)}</button></div>`;
  return `${bar('Tareas')}
  <form class="card" data-f="task">
    <div class="inline-add"><input id="task-title" type="text" name="title" placeholder="¿Qué hay que hacer?" aria-label="Nueva tarea" required><button class="btn" aria-label="Añadir tarea">${svg('plus', 18)}</button></div>
    <div class="two"><select name="who" aria-label="Quién se encarga"><option value="f">Familia (cualquiera)</option>${people().map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
    <input type="date" name="date" aria-label="Para cuándo (opcional)"></div>
  </form>
  <div class="card"><span class="label">Pendientes · ${pend.length}</span><div class="list">${pend.length ? pend.map(row).join('') : '<p class="empty">No hay nada pendiente.</p>'}</div></div>
  ${done.length ? `<details class="card"><summary>Hechas (${done.length})</summary><div class="list">${done.map(row).join('')}</div></details>` : ''}`;
}

/* ───────────── COMPRA ───────────── */
const UNITS = ['ud', 'g', 'kg', 'l', 'paq', 'lata'];
const STEP = { ud: 1, g: 100, kg: 0.5, l: 1, paq: 1, lata: 1 };
function addShopping(name, qty = 1, unit = 'ud', store) {
  const list = db.all('shopping');
  const ex = list.find((x) => !x.done && norm(x.name) === norm(name) && x.unit === unit);
  if (ex) { db.update('shopping', ex.id, { qty: +(ex.qty + qty).toFixed(2) }); return false; }
  const prev = db.all('shoppingHistory').find((h) => norm(h.name) === norm(name));
  db.add('shopping', { name, qty, unit, store: store || prev?.store || db.all('stores')[0] || 'Mercadona', done: false });
  return true;
}
function compra() {
  const stores = db.all('stores');
  const list = db.all('shopping');
  const shop = ui.shop && stores.includes(ui.shop) ? ui.shop : stores[0];
  const mode = `<div class="seg" role="group" aria-label="Modo"><button data-a="cmode" data-m="lista" ${pressed(ui.compraMode === 'lista')}>Preparar lista</button><button data-a="cmode" data-m="super" ${pressed(ui.compraMode === 'super')}>En el súper</button></div>`;
  if (ui.compraMode === 'super') {
    const items = list.filter((x) => x.store === shop);
    const done = items.filter((x) => x.done).length;
    return `${bar('Compra')}${mode}
    <div class="seg" role="group" aria-label="Supermercado">${stores.map((s) => `<button data-a="shop" data-s="${esc(s)}" ${pressed(s === shop)}>${esc(s)} (${list.filter((x) => x.store === s && !x.done).length})</button>`).join('')}</div>
    <div class="card"><div class="list">${items.length ? items.sort((a, b) => a.done - b.done).map((x) => `<button class="item ${x.done ? 'done' : ''}" data-a="buy" data-id="${x.id}" style="border-left:none;border-right:none;border-bottom:none;background:none;text-align:left;width:100%">
      <span class="check" ${pressed(x.done)}>${x.done ? svg('check', 16, 3) : ''}</span><span class="grow"><span class="t">${esc(x.name)}</span></span><span class="s">${fmtQty(x)}</span></button>`).join('') : '<p class="empty">Nada para este súper.</p>'}</div></div>
    ${done ? `<button class="btn block" data-a="finish" data-s="${esc(shop)}">Terminar compra (${done} cogido${done > 1 ? 's' : ''})</button>` : ''}
    <p class="small">Lo tachado sale de la lista al terminar y se guarda en el historial.</p>`;
  }
  const q = norm(ui.q);
  let sugg = [];
  if (q) {
    const pool = [...new Set([...db.all('catalog'), ...db.all('shoppingHistory').map((h) => h.name), ...db.all('recipes').flatMap((r) => r.ingredients.map((i) => i.name))])];
    sugg = pool.filter((n) => norm(n).includes(q)).slice(0, 5);
    if (!pool.some((n) => norm(n) === q)) sugg.push(ui.q.trim());
  }
  const pend = list.filter((x) => !x.done);
  return `${bar('Compra')}${mode}
  <div class="card">
    <label class="sr" for="cq">Buscar o añadir producto</label>
    <input id="cq" type="search" data-i="q" value="${esc(ui.q)}" placeholder="Buscar o añadir producto" autocomplete="off">
    ${sugg.length ? `<div class="chips">${sugg.map((n) => `<button class="chip" data-a="cadd" data-n="${esc(n)}">+ ${esc(n)}</button>`).join('')}</div>` : ''}
  </div>
  <div class="card"><span class="label">En la lista · ${pend.length}</span><div class="list">
  ${pend.length ? pend.map((x) => `<div class="item"><span class="grow"><span class="t">${esc(x.name)}</span>
      <button class="tag" data-a="cstore" data-id="${x.id}" style="border:none;margin-top:4px">${esc(x.store)} · cambiar</button></span>
      <span class="qty"><button data-a="cqty" data-id="${x.id}" data-n="-1" aria-label="Menos">−</button><button data-a="cunit" data-id="${x.id}" style="width:auto;padding:0 6px;background:none;font-size:14px" aria-label="Cambiar unidad"><span>${fmtQty(x)}</span></button><button data-a="cqty" data-id="${x.id}" data-n="1" aria-label="Más">+</button></span>
      <button class="icon-btn" data-a="del" data-col="shopping" data-id="${x.id}" aria-label="Quitar">${svg('x', 18)}</button></div>`).join('') : '<p class="empty">La lista está vacía. Busca arriba o pasa el menú de la semana.</p>'}
  </div></div>
  <details class="card"><summary>Supermercados</summary>
    <div class="chips">${stores.map((s) => `<span class="chip">${esc(s)}${stores.length > 1 ? `<button data-a="store-del" data-s="${esc(s)}" aria-label="Quitar ${esc(s)}" style="border:none;background:none;padding:0">${svg('x', 14)}</button>` : ''}</span>`).join('')}</div>
    <form class="inline-add" data-f="store"><input type="text" name="name" placeholder="Nuevo supermercado" aria-label="Nuevo supermercado" required><button class="btn sm">Añadir</button></form>
  </details>`;
}
const fmtQty = (x) => `${String(x.qty).replace('.', ',')} ${x.unit}`;

/* ───────────── MENÚ ───────────── */
const recipe = (id) => db.get('recipes', id);
const dishName = (d) => (d.recipe ? recipe(d.recipe)?.name || '(plato borrado)' : d.text);
const weekKey = (offset) => addDays(mondayOf(today()), offset * 7);
function menuDay(date) { const w = db.raw().menu[mondayOf(date)]; return w ? w.find((x) => x.date === date) : null; }
function randomRecipe(exclude) {
  const all = db.all('recipes');
  const pool = all.filter((r) => !exclude.includes(r.id));
  const src = pool.length ? pool : all;
  return src.length ? src[Math.floor(Math.random() * src.length)].id : null;
}
function proposeWeek(key) {
  const used = [];
  const week = Array.from({ length: 7 }, (_, k) => {
    const date = addDays(key, k);
    const rid = randomRecipe(used); if (rid) used.push(rid);
    return { date, meal: k < 5 ? 'cena' : 'comida', dishes: rid ? [{ id: uid(), recipe: rid }] : [] };
  });
  const m = { ...db.raw().menu, [key]: week };
  db.set('menu', m);
}
function saveWeek(key, week) { db.set('menu', { ...db.raw().menu, [key]: week }); }
function dishesToShopping(dishes) {
  let n = 0;
  for (const d of dishes) { const r = d.recipe && recipe(d.recipe); if (!r) continue; for (const i of r.ingredients) { addShopping(i.name, i.qty, i.unit); n++; } }
  return n;
}
function menu() {
  const key = weekKey(ui.menuWeek);
  const week = db.raw().menu[key];
  const recipes = db.all('recipes').slice().sort((a, b) => a.name.localeCompare(b.name));
  const tabs = `<div class="seg" role="group" aria-label="Semana"><button data-a="mweek" data-n="0" ${pressed(ui.menuWeek === 0)}>Esta semana</button><button data-a="mweek" data-n="1" ${pressed(ui.menuWeek === 1)}>La que viene</button></div>`;
  if (!week) {
    return `${bar('Menú')}${tabs}<div class="card"><p>Aún no hay menú para la semana del ${parse(key).getDate()} de ${MONL[parse(key).getMonth()]}.</p>
      <button class="btn block" data-a="propose" data-k="${key}">${svg('shuffle', 18)}Proponer menú de la semana</button>
      <p class="small">Se hace con vuestro recetario (${recipes.length} platos). Cenas de lunes a viernes y comidas el fin de semana.</p></div>
      <a class="btn soft block" href="#recetario">Ver y cambiar el recetario</a>`;
  }
  return `${bar('Menú')}${tabs}
  ${week.map((day, di) => {
    const sv = silviaOut(day.date) ? 'Silvia trabaja' : '';
    return `<section class="day ${day.date === today() ? 'today' : ''}">
      <div class="day-head"><h3>${esc(cap(DOWL[parse(day.date).getDay()]))} ${parse(day.date).getDate()} · ${day.meal}</h3><span class="small">${sv}</span></div>
      ${day.dishes.map((d) => `<div class="dish"><span class="grow">${esc(dishName(d))}</span>
        <button class="icon-btn" data-a="dish-other" data-k="${key}" data-di="${di}" data-id="${d.id}" aria-label="Otro plato">${svg('shuffle', 18)}</button>
        <button class="icon-btn" data-a="dish-shop" data-k="${key}" data-di="${di}" data-id="${d.id}" aria-label="Ingredientes a la compra">${svg('cart', 18)}</button>
        <button class="icon-btn" data-a="dish-del" data-k="${key}" data-di="${di}" data-id="${d.id}" aria-label="Quitar">${svg('x', 18)}</button></div>`).join('')}
      <label class="sr" for="add-${di}">Añadir plato</label>
      <select id="add-${di}" data-c="dish-add" data-k="${key}" data-di="${di}"><option value="">+ Añadir plato…</option>${recipes.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}<option value="__azar">Uno al azar</option></select>
    </section>`;
  }).join('')}
  <button class="btn block" data-a="week-shop" data-k="${key}">${svg('cart', 18)}Pasar toda la semana a la compra</button>
  <div class="two"><button class="btn soft" data-a="propose" data-k="${key}">${svg('shuffle', 18)}Proponer otra</button><a class="btn soft" href="#recetario">Recetario</a></div>`;
}

function recetario() {
  const recipes = db.all('recipes').slice().sort((a, b) => a.name.localeCompare(b.name));
  const ed = ui.editRecipe;
  const r = ed && ed !== 'new' ? recipe(ed) : null;
  const form = ed ? `<form class="card" data-f="recipe" data-id="${r ? r.id : ''}">
      <span class="label">${r ? 'Editar plato' : 'Nuevo plato'}</span>
      <label class="field"><span>Nombre</span><input type="text" name="name" value="${esc(r?.name)}" required></label>
      <label class="field"><span>Ingredientes para 4 (uno por línea, ej.: «500 g pasta»)</span><textarea name="ing">${esc((r?.ingredients || []).map((i) => `${String(i.qty).replace('.', ',')} ${i.unit} ${i.name}`).join('\n'))}</textarea></label>
      <div class="two"><button type="button" class="btn soft" data-a="recipe-cancel">Cancelar</button><button class="btn">Guardar</button></div>
      ${r ? `<button type="button" class="btn danger block" data-a="del" data-col="recipes" data-id="${r.id}">Borrar plato</button>` : ''}</form>` : '';
  return `${bar('Recetario', '#menu')}
  <p class="small">Vuestros platos de siempre. El menú de la semana se propone a partir de aquí y sus ingredientes van a la compra.</p>
  ${form || `<button class="btn block" data-a="recipe-edit" data-id="new">${svg('plus', 18)}Nuevo plato</button>`}
  <div class="card"><div class="list">${recipes.map((x) => `<button class="item" data-a="recipe-edit" data-id="${x.id}" style="border-left:none;border-right:none;border-bottom:none;background:none;text-align:left;width:100%">
    <span class="grow"><span class="t">${esc(x.name)}</span><span class="s">${esc(x.ingredients.map((i) => i.name).join(', '))}</span></span>${svg('edit', 18)}</button>`).join('')}</div></div>`;
}
function parseIngredients(text) {
  return text.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^(\d+(?:[.,]\d+)?)\s*(ud|uds|g|gr|kg|l|ml|paq|lata|latas)?\.?\s+(?:de\s+)?(.+)$/i);
    if (!m) return { qty: 1, unit: 'ud', name: cap(l) };
    let unit = (m[2] || 'ud').toLowerCase(); if (unit === 'uds') unit = 'ud'; if (unit === 'gr') unit = 'g'; if (unit === 'latas') unit = 'lata';
    return { qty: parseFloat(m[1].replace(',', '.')), unit, name: cap(m[3]) };
  });
}

/* ───────────── COLE ───────────── */
const TYPE_COLE = { deberes: 'Deberes', examen: 'Examen', aviso: 'Aviso', circular: 'Circular', excursion: 'Excursión', traer: 'Traer', otro: 'Otro' };
const coleTitle = (t) => { const l = TYPE_COLE[t.type] || 'Cole'; return norm(t.title).startsWith(norm(l)) ? t.title : `${l}: ${t.title}`; };
function eduOk() { const e = db.raw().educamos; return e.status === "ok" && e.lastRead && (Date.now() - new Date(e.lastRead)) < 36 * 3600 * 1000; }
async function loadFeed() { try { const r = await fetch("feed.json", { cache: "no-store" }); if (r.ok) db.applyFeed(await r.json()); } catch (e) { /* sin conexión: se queda lo último */ } }
function cole() {
  const e = db.raw().educamos;
  const kidList = kids();
  const k = ui.coleKid;
  const items = db.all('school').filter((x) => k === 'todos' || x.kid === k);
  const pend = items.filter((x) => !x.done).sort(byDate);
  const done = items.filter((x) => x.done).slice(-15).reverse();
  const status = eduOk()
    ? `<p class="small" style="color:#2F5D3A">✓ Educamos leído ${esc(relDay(e.lastRead.slice(0, 10)))} a las ${esc(e.lastRead.slice(11, 16))}</p>`
    : e.status === 'sin-conectar'
      ? `<div class="alert info"><span><b>Educamos aún no está conectado</b>Cuando esté, cada mañana se leerán solos los avisos, circulares, tareas y fechas. Mientras, apuntadlo aquí.</span></div>`
      : `<div class="alert warn"><span><b>Hoy no se ha podido leer Educamos</b>${esc(e.message || '')} Última lectura: ${e.lastRead ? esc(relDay(e.lastRead.slice(0, 10))) : 'nunca'}.</span></div>`;
  const row = (x) => { const p = person(x.kid); return `<div class="item ${x.done ? 'done' : ''}">
    <button class="check" data-a="school" data-id="${x.id}" ${pressed(x.done)} aria-label="Hecho">${x.done ? svg('check', 16, 3) : ''}</button>
    <span class="grow"><span class="t">${esc(x.title)}</span><span class="s"><span class="tag" style="background:${p.tone};color:${p.ink}">${esc(TYPE_COLE[x.type] || 'Otro')}</span> ${x.date ? esc(relDay(x.date)) : ''}${x.source === 'educamos' ? ' · Educamos' : ''}</span></span>
    ${whoDot(x.kid)}<button class="icon-btn" data-a="del" data-col="school" data-id="${x.id}" aria-label="Borrar">${svg('x', 18)}</button></div>`; };
  return `${bar('Cole')}${status}
  <div class="seg" role="group" aria-label="Niño"><button data-a="kid" data-k="todos" ${pressed(k === 'todos')}>Los dos</button>${kidList.map((p) => `<button data-a="kid" data-k="${p.id}" ${pressed(k === p.id)}>${esc(p.name)}</button>`).join('')}</div>
  <div class="card"><span class="label">Pendiente · ${pend.length}</span><div class="list">${pend.length ? pend.map(row).join('') : '<p class="empty">Nada pendiente.</p>'}</div></div>
  <form class="card" data-f="school">
    <span class="label">Apuntar algo del cole</span>
    <input type="text" name="title" placeholder="Ej.: autorización de la excursión" aria-label="Qué pide el cole" required>
    <div class="two"><select name="kid" aria-label="Para quién">${kidList.map((p) => `<option value="${p.id}" ${k === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
    <select name="type" aria-label="Tipo">${Object.entries(TYPE_COLE).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
    <label class="field"><span>Para cuándo</span><input type="date" name="date"></label>
    <button class="btn block">Guardar</button>
  </form>
  ${done.length ? `<details class="card"><summary>Hecho (${done.length})</summary><div class="list">${done.map(row).join('')}</div></details>` : ''}`;
}

/* ───────────── SALUD ───────────── */
function activeMeds(date = today()) { return db.all('meds').filter((m) => (!m.start || m.start <= date) && (!m.until || m.until >= date)); }
function doseTimes(m) { const out = []; const f = toMin(m.first || '08:00'); for (let k = 0; k < Math.max(1, Math.round(24 / m.every)); k++) out.push(fromMin(f + k * m.every * 60)); return out.sort(); }
function doseGiven(m, date, time) { return db.all('doses').find((d) => d.medId === m.id && d.date === date && d.time === time); }
function pendingDoses() {
  const t = today(); const now = toMin(nowHM()); const out = [];
  for (const m of activeMeds()) for (const tm of doseTimes(m)) if (toMin(tm) <= now + 30 && !doseGiven(m, t, tm)) out.push({ time: tm, who: person(m.who).name, med: m });
  return out;
}
function salud() {
  const t = today();
  const meds = activeMeds();
  const ended = db.all('meds').filter((m) => m.until && m.until < t);
  return `${bar('Salud')}
  ${meds.length ? meds.map((m) => { const p = person(m.who); const total = m.until && m.start ? daysBetween(m.start, m.until) + 1 : null; const n = m.start ? daysBetween(m.start, t) + 1 : null;
    return `<div class="card"><div class="card-head"><span class="label" style="color:${p.ink}">${esc(p.name)}${total ? ` · día ${n} de ${total}` : ''}</span>
      <button class="icon-btn" data-a="del" data-col="meds" data-id="${m.id}" aria-label="Borrar tratamiento">${svg('x', 18)}</button></div>
      <h2 style="font-size:20px">${esc(m.name)}</h2><p class="small">Cada ${m.every} h${m.until ? ' hasta el ' + esc(fmtLong(m.until)) : ''}</p>
      <div class="list">${doseTimes(m).map((tm) => { const g = doseGiven(m, t, tm);
        return `<div class="item ${g ? 'done' : ''}"><span class="grow"><span class="t">${tm}</span><span class="s">${g ? `dio ${esc(person(g.by).name)} a las ${esc(g.at)}` : 'Pendiente'}</span></span>
          <button class="btn sm ${g ? 'soft' : ''}" data-a="dose" data-id="${m.id}" data-t="${tm}">${g ? 'Deshacer' : 'Dada'}</button></div>`; }).join('')}</div>
      <p class="small">Cada toma queda apuntada con quién la dio, para no darla dos veces.</p></div>`; }).join('') : '<div class="card"><p class="empty">Nadie está tomando nada ahora mismo.</p></div>'}
  ${medForm()}
  ${ended.length ? `<details class="card"><summary>Tratamientos terminados (${ended.length})</summary>${ended.map((m) => `<div class="row"><span>${esc(person(m.who).name)}: ${esc(m.name)}</span><span class="end">${esc(fmtShort(m.until))}</span></div>`).join('')}</details>` : ''}`;
}
function medForm() {
  return `<form class="card" data-f="med"><span class="label">Nueva medicina</span>
    <div class="chips">${people().map((p, k) => `<label class="chip"><input type="radio" name="who" value="${p.id}" ${k === 3 ? 'checked' : ''}> ${esc(p.name)}</label>`).join('')}</div>
    <label class="field"><span>Medicina y dosis (como dice la receta)</span><input type="text" name="name" placeholder="Ej.: jarabe 5 ml" required></label>
    <label class="field"><span>Cada cuánto</span><select name="every"><option value="6">Cada 6 horas</option><option value="8" selected>Cada 8 horas</option><option value="12">Cada 12 horas</option><option value="24">Una vez al día</option></select></label>
    <div class="two"><label class="field"><span>Primera toma</span><input type="time" name="first" value="08:00" required></label>
    <label class="field"><span>Hasta el</span><input type="date" name="until" value="${addDays(today(), 6)}"></label></div>
    <button class="btn block">Crear tomas</button></form>`;
}

/* ───────────── CASA: recibos y vencimientos ───────────── */
const PRESETS = ['ITV del coche', 'Seguro del coche', 'Seguro de hogar', 'Revisión de la caldera', 'IBI', 'Recibo de la luz', 'Recibo del gas', 'Agua', 'Internet y móvil', 'Comunidad', 'Seguro médico', 'Impuesto de circulación'];
const REPEAT = { no: 'Una vez', mensual: 'Cada mes', bimestral: 'Cada 2 meses', trimestral: 'Cada 3 meses', anual: 'Cada año' };
const REP_M = { mensual: 1, bimestral: 2, trimestral: 3, anual: 12 };
function casa() {
  const t = today();
  const bills = db.all('bills');
  const pend = bills.filter((b) => !b.done).sort(byDate);
  const done = bills.filter((b) => b.done);
  return `${bar('Casa')}
  <div class="card"><span class="label">Recibos y vencimientos</span><div class="list">
  ${pend.length ? pend.map((b) => { const n = daysBetween(t, b.date); const st = n < 0 ? 'bad' : n <= (b.notice ?? 15) ? 'warn' : '';
    return `<div class="item"><span class="grow"><span class="t">${esc(b.title)}</span>
      <span class="s">${st ? `<span class="tag" style="background:var(--${st}-bg);color:var(--${st}-ink)">${n < 0 ? 'Vencido' : 'Pronto'}</span> ` : ''}${esc(fmtShort(b.date))}${b.amount ? ' · ' + money(b.amount) : ''} · ${REPEAT[b.repeat || 'no']}</span></span>
      <button class="btn sm" data-a="bill-done" data-id="${b.id}">${b.kind === 'recibo' ? 'Pagado' : 'Hecho'}</button>
      <button class="icon-btn" data-a="del" data-col="bills" data-id="${b.id}" aria-label="Borrar">${svg('x', 18)}</button></div>`; }).join('') : '<p class="empty">Nada apuntado. Añade abajo los recibos y fechas que no se os pueden pasar.</p>'}
  </div></div>
  ${billForm()}
  ${done.length ? `<details class="card"><summary>Hechos (${done.length})</summary>${done.map((b) => `<div class="row"><span>${esc(b.title)}</span><span class="end">${esc(fmtShort(b.date))}</span></div>`).join('')}</details>` : ''}
  <p class="small">Electrodomésticos, placas y luz llegarán más adelante.</p>`;
}
function billForm() {
  return `<form class="card" data-f="bill"><span class="label">Añadir recibo o vencimiento</span>
    <div class="chips">${PRESETS.map((p) => `<button type="button" class="chip" data-a="preset" data-v="${esc(p)}">${esc(p)}</button>`).join('')}</div>
    <input id="bill-title" type="text" name="title" placeholder="Qué es" aria-label="Qué es" required>
    <div class="two"><label class="field"><span>Tipo</span><select name="kind"><option value="vence">Vencimiento</option><option value="recibo">Recibo</option></select></label>
    <label class="field"><span>Fecha</span><input type="date" name="date" required></label></div>
    <div class="two"><label class="field"><span>Importe (opcional)</span><input type="number" name="amount" step="0.01" inputmode="decimal"></label>
    <label class="field"><span>Se repite</span><select name="repeat">${Object.entries(REPEAT).map(([k, l]) => `<option value="${k}" ${k === 'anual' ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <label class="field"><span>Avisar con antelación</span><select name="notice"><option value="3">3 días antes</option><option value="7">Una semana antes</option><option value="15" selected>15 días antes</option><option value="30">Un mes antes</option></select></label>
    <button class="btn block">Guardar</button></form>`;
}

/* ───────────── TIEMPO ───────────── */
// En la copia guardada, la temperatura «de ahora» solo vale unas horas; después se enseña la de hoy (mín./máx.).
const wxFresh = () => wx && (!wx.snapshot || Date.now() - wx.ts < 3 * 3600 * 1000);
const wxTodayIdx = () => (wx && wx.daily ? wx.daily.time.indexOf(today()) : -1);
function wxHeader() {
  if (!wx) return PLACE.name;
  if (wxFresh()) return `${WX_ICO(wx.code)} <b>${wx.now}°</b> ${PLACE.name}`;
  const k = wxTodayIdx();
  if (k < 0) return PLACE.name;
  const dl = wx.daily;
  return `${WX_ICO(dl.weather_code[k])} <b>${Math.round(dl.temperature_2m_min[k])}°/${Math.round(dl.temperature_2m_max[k])}°</b> ${PLACE.name}`;
}
function tiempo() {
  const idx = wx && wx.daily ? wx.daily.time.map((d, k) => k).filter((k) => wx.daily.time[k] >= today()) : [];
  if (!idx.length) return `${bar('Tiempo')}<div class="card"><p class="empty">No se ha podido cargar la previsión. Comprueba la conexión.</p></div>`;
  const dl = wx.daily;
  const lo = Math.min(...idx.map((k) => dl.temperature_2m_min[k])), hi = Math.max(...idx.map((k) => dl.temperature_2m_max[k]));
  const span = Math.max(1, hi - lo);
  const t0 = wxTodayIdx();
  const head = wxFresh()
    ? `<span class="label" style="color:#1E5878">Ahora · ${esc(PLACE.full)}</span><p style="font-family:var(--serif);font-size:44px;font-weight:600">${WX_ICO(wx.code)} ${wx.now}°</p><p>${WX_TXT(wx.code)}</p>`
    : t0 >= 0 ? `<span class="label" style="color:#1E5878">Hoy · ${esc(PLACE.full)}</span><p style="font-family:var(--serif);font-size:44px;font-weight:600">${WX_ICO(dl.weather_code[t0])} ${Math.round(dl.temperature_2m_max[t0])}°</p><p>${WX_TXT(dl.weather_code[t0])} · mínima ${Math.round(dl.temperature_2m_min[t0])}°</p>`
    : `<span class="label" style="color:#1E5878">${esc(PLACE.full)}</span>`;
  return `${bar('Tiempo')}
  <div class="card" style="background:#DCE8F2;color:#1E3F5C">${head}</div>
  <div class="card">${idx.map((k) => dl.time[k]).map((d) => { const k = dl.time.indexOf(d); return `<div class="wx-row"><span style="font-weight:600">${d === today() ? 'Hoy' : cap(DOW[parse(d).getDay()])}</span><span>${WX_ICO(dl.weather_code[k])}</span>
    <span class="bar-t" title="${WX_TXT(dl.weather_code[k])}"><i style="left:${((dl.temperature_2m_min[k] - lo) / span) * 100}%;right:${100 - ((dl.temperature_2m_max[k] - lo) / span) * 100}%"></i></span>
    <span style="text-align:right">${Math.round(dl.temperature_2m_min[k])}° / <b>${Math.round(dl.temperature_2m_max[k])}°</b>${dl.precipitation_probability_max?.[k] >= 40 ? ` · ☂︎${dl.precipitation_probability_max[k]}%` : ''}</span></div>`; }).join('')}</div>
  <p class="small">${wx.snapshot ? esc(wxStamp()) + '. En la app instalada se actualiza sola.' : 'Previsión de Open-Meteo.'}</p>`;
}

/* ───────────── AJUSTES ───────────── */
function ajustes() {
  const s = db.settings();
  return `${bar('Ajustes')}
  <div class="card"><span class="label">Tu cuenta</span>
    <p>Entras como <b>${esc(me().name)}</b></p><p class="small">${esc(auth.me().email || '')}</p>
    <p class="small">Las tomas y tareas quedan firmadas con tu nombre, y no ves tus propias ideas de regalo.</p>
    <details><summary class="small">Cambiar mi contraseña</summary><form class="inline-add" data-f="pass" style="margin-top:8px"><input type="password" name="password" autocomplete="new-password" minlength="10" placeholder="Nueva (10 o más caracteres)" aria-label="Nueva contraseña" required><button class="btn sm">Cambiar</button></form></details>
    <button class="btn soft block" data-a="logout">Cerrar sesión en este móvil</button></div>
  ${isAdmin() ? `<div class="card"><span class="label">Secciones de inicio</span>
    ${TILES.map((x) => `<label class="row"><span>${x.label}</span><input type="checkbox" data-c="tile" data-k="${x.k}" ${s.hiddenTiles.includes(x.k) ? '' : 'checked'} style="width:22px;height:22px"></label>`).join('')}
    <p class="small">Solo Mario puede cambiar las secciones.</p></div>` : ''}
  <div class="card"><span class="label">Copia de seguridad</span>
    <p class="small">Los datos se guardan en la nube (Supabase, en la UE) y solo los veis vosotros dos. Aquí puedes descargar una copia.</p>
    ${SANDBOXED ? '<p class="small">En esta vista previa no se pueden descargar copias.</p>' : ''}
    <div class="two"><button class="btn soft" data-a="export" ${SANDBOXED ? 'hidden' : ''}>Descargar copia</button>
    <label class="btn soft" style="position:relative">Recuperar copia<input type="file" accept="application/json" data-c="import" style="position:absolute;inset:0;opacity:0"></label></div></div>
  ${isAdmin() ? `<div class="card"><span class="label">Empezar de cero</span><button class="btn danger block" data-a="reset">Borrar todos los datos</button></div>` : ''}`;
}

/* ───────────── AÑADIR (cualquier cosa) ───────────── */
const ADD_TYPES = [['evento', 'Evento'], ['tarea', 'Tarea'], ['compra', 'Compra'], ['cole', 'Cole'], ['medicina', 'Medicina'], ['casa', 'Casa'], ['regalo', 'Regalo'], ['trabajo', 'Trabajo Silvia']];
function anadir(type, id) {
  if (type) ui.addType = type;
  const tp = ui.addType;
  const ev = tp === 'evento' && id ? db.get('events', id) : null;
  const head = `<div class="bar"><a class="back" href="${ev ? '#agenda' : '#'}">${svg('back', 18)}${ev ? 'Agenda' : 'Inicio'}</a><h1>${ev ? 'Editar' : 'Añadir'}</h1></div>`;
  const types = ev ? '' : `<div class="chips" role="group" aria-label="Qué es">${ADD_TYPES.map(([k, l]) => `<button class="chip" data-a="atype" data-k="${k}" ${pressed(tp === k)}>${l}</button>`).join('')}</div>`;
  const whoChecks = (name, selected, multi = true) => `<div class="chips">${[...people(), FAM].map((p) => `<label class="chip"><input type="${multi ? 'checkbox' : 'radio'}" name="${name}" value="${p.id}" ${selected.includes(p.id) ? 'checked' : ''}> ${esc(p.name)}</label>`).join('')}</div>`;
  let form = '';
  if (tp === 'evento') {
    const v = ev || { title: '', who: [db.settings().user], date: today(), time: '', endTime: '', place: '', repeat: 'no', days: [], until: '' };
    form = `<form class="card" data-f="event" data-id="${ev ? ev.id : ''}">
      <label class="field"><span>Qué y dónde</span><input id="ev-title" type="text" name="title" value="${esc(v.title)}" placeholder="Ej.: pádel, cena con amigos…" required></label>
      <div class="field"><span>Para quién</span>${whoChecks('who', v.who)}</div>
      <label class="field"><span>Día</span><input type="date" name="date" value="${esc(v.date)}" required></label>
      <div class="two"><label class="field"><span>Hora</span><input type="time" name="time" value="${esc(v.time)}"></label><label class="field"><span>Hasta</span><input type="time" name="endTime" value="${esc(v.endTime)}"></label></div>
      <label class="field"><span>Lugar (opcional)</span><input type="text" name="place" value="${esc(v.place)}"></label>
      <label class="field"><span>¿Se repite?</span><select name="repeat">${[['no', 'No'], ['semanal', 'Cada semana'], ['mensual', 'Cada mes'], ['anual', 'Cada año']].map(([k, l]) => `<option value="${k}" ${v.repeat === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <div class="field"><span>Días (si es semanal)</span><div class="chips">${'LMXJVSD'.split('').map((l, k) => `<label class="chip"><input type="checkbox" name="days" value="${k + 1}" ${(v.days || []).includes(k + 1) ? 'checked' : ''}> ${l}</label>`).join('')}</div></div>
      <label class="field"><span>Hasta el (si se repite)</span><input type="date" name="until" value="${esc(v.until)}"></label>
      <p class="small">Si Mario apunta algo por la tarde y Silvia trabaja, la app avisa de que nadie recoge a los niños.</p>
      <button class="btn block">Guardar</button>
      ${ev ? `<button type="button" class="btn danger block" data-a="del" data-col="events" data-id="${ev.id}" data-back="#agenda">Borrar</button>` : ''}</form>`;
  } else if (tp === 'tarea') {
    form = `<form class="card" data-f="task" data-go="#tareas"><label class="field"><span>Qué hay que hacer</span><input type="text" name="title" placeholder="Ej.: pedir cita de la ITV" required></label>
      <div class="field"><span>Quién se encarga</span>${whoChecks('who', ['f'], false)}</div>
      <label class="field"><span>Para cuándo (opcional)</span><input type="date" name="date"></label><button class="btn block">Guardar</button></form>`;
  } else if (tp === 'compra') {
    form = `<form class="card" data-f="shop1"><label class="field"><span>Qué falta</span><input type="text" name="name" placeholder="Ej.: huevos" required></label>
      <div class="two"><label class="field"><span>Cantidad</span><input type="number" name="qty" value="1" step="0.5" min="0"></label><label class="field"><span>Unidad</span><select name="unit">${UNITS.map((u) => `<option>${u}</option>`).join('')}</select></label></div>
      <label class="field"><span>Súper</span><select name="store">${db.all('stores').map((s) => `<option>${esc(s)}</option>`).join('')}</select></label><button class="btn block">Añadir a la lista</button></form>`;
  } else if (tp === 'cole') {
    form = `<form class="card" data-f="school" data-go="#cole"><label class="field"><span>Qué pide el cole</span><input type="text" name="title" placeholder="Ej.: traer disfraz" required></label>
      <div class="two"><select name="kid" aria-label="Para quién">${kids().map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select><select name="type" aria-label="Tipo">${Object.entries(TYPE_COLE).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
      <label class="field"><span>Para cuándo</span><input type="date" name="date"></label><button class="btn block">Guardar</button></form>`;
  } else if (tp === 'medicina') {
    form = medForm();
  } else if (tp === 'casa') {
    form = billForm();
  } else if (tp === 'regalo') {
    const others = people().filter((p) => p.id !== db.settings().user);
    form = `<form class="card" data-f="gift" data-go="#"><label class="field"><span>Idea de regalo</span><input type="text" name="text" placeholder="Ej.: puzle de 500 piezas" required></label>
      <div class="field"><span>Para quién</span><div class="chips">${others.map((p, k) => `<label class="chip"><input type="radio" name="who" value="${p.id}" ${k === 0 ? 'checked' : ''}> ${esc(p.name)}</label>`).join('')}</div></div>
      <label class="field"><span>Ocasión</span><select name="occasion"><option>Cumple</option><option>Reyes</option><option>Santo</option><option>Otro</option></select></label><button class="btn block">Guardar</button></form>`;
  } else if (tp === 'trabajo') {
    return head + types + turno().replace(/^[\s\S]*?<form/, '<form');
  }
  return head + types + form;
}

/* ───────────── Acciones (toques) ───────────── */
const A = {
  who: (el) => { ui.who = el.dataset.id; ui.editFicha = null; render(); },
  cover: (el) => { const c = { ...db.raw().cover }; const d = el.dataset.d, w = el.dataset.w; if (c[d] === w) delete c[d]; else c[d] = w; db.set('cover', c); toast(c[d] ? `${w} recoge a los niños` : 'Quitado'); },
  filter: (el) => { const k = el.dataset.k; ui.filter[k] = ui.filter[k] === false; render(); },
  week: (el) => { const n = +el.dataset.n; ui.week = n === 0 ? 0 : ui.week + n; render(); },
  aview: (el) => { ui.view = el.dataset.v; render(); },
  month: (el) => { const n = +el.dataset.n; ui.month = n === 0 ? 0 : ui.month + n; render(); },
  goday: (el) => { ui.view = 'semana'; ui.week = Math.round(daysBetween(mondayOf(today()), mondayOf(el.dataset.d)) / 7); render(); window.scrollTo(0, 0); },
  del: (el) => {
    if (!armed(el, '¿Borrar?')) return;
    db.remove(el.dataset.col, el.dataset.id);
    if (el.dataset.col === 'recipes') ui.editRecipe = null;
    if (el.dataset.back) location.hash = el.dataset.back; else render();
    toast('Borrado');
  },
  task: (el) => { const t = db.get('tasks', el.dataset.id); db.update('tasks', t.id, { done: !t.done, doneAt: Date.now(), doneBy: !t.done ? db.settings().user : null }); },
  school: (el) => { const t = db.get('school', el.dataset.id); db.update('school', t.id, { done: !t.done }); },
  'gift-done': (el) => { db.update('gifts', el.dataset.id, { done: true }); toast('Marcado como comprado'); },
  'ficha-edit': (el) => { ui.editFicha = el.dataset.id; render(); },
  'ficha-cancel': () => { ui.editFicha = null; render(); },
  cmode: (el) => { ui.compraMode = el.dataset.m; render(); },
  shop: (el) => { ui.shop = el.dataset.s; render(); },
  buy: (el) => { const x = db.get('shopping', el.dataset.id); db.update('shopping', x.id, { done: !x.done }); },
  finish: (el) => {
    const s = el.dataset.s; const got = db.all('shopping').filter((x) => x.store === s && x.done);
    const hist = db.all('shoppingHistory').filter((h) => !got.some((g) => norm(g.name) === norm(h.name)));
    const t = today();
    db.set('shoppingHistory', [...got.map((g) => ({ name: g.name, store: g.store, unit: g.unit, last: t, count: (db.all('shoppingHistory').find((h) => norm(h.name) === norm(g.name))?.count || 0) + 1 })), ...hist].slice(0, 300));
    db.set('shopping', db.all('shopping').filter((x) => !(x.store === s && x.done)));
    toast(`Compra terminada: ${got.length} producto${got.length > 1 ? 's' : ''}`);
  },
  cadd: (el) => { const n = el.dataset.n; const isNew = addShopping(cap(n)); ui.q = ''; render(); toast(isNew ? `${cap(n)} añadido` : `${cap(n)}: una más`); const i = document.getElementById('cq'); if (i) i.focus(); },
  cqty: (el) => { const x = db.get('shopping', el.dataset.id); const st = STEP[x.unit] || 1; db.update('shopping', x.id, { qty: Math.max(st, +(x.qty + st * +el.dataset.n).toFixed(2)) }); },
  cunit: (el) => { const x = db.get('shopping', el.dataset.id); const u = UNITS[(UNITS.indexOf(x.unit) + 1) % UNITS.length]; db.update('shopping', x.id, { unit: u, qty: STEP[u] }); },
  cstore: (el) => { const x = db.get('shopping', el.dataset.id); const s = db.all('stores'); db.update('shopping', x.id, { store: s[(s.indexOf(x.store) + 1) % s.length] }); },
  'store-del': (el) => { const s = el.dataset.s; db.set('stores', db.all('stores').filter((x) => x !== s)); const first = db.all('stores')[0]; for (const x of db.all('shopping')) if (x.store === s) db.update('shopping', x.id, { store: first }); },
  mweek: (el) => { ui.menuWeek = +el.dataset.n; render(); },
  propose: (el) => { const k = el.dataset.k; if (db.raw().menu[k] && !armed(el, '¿Cambiar todo el menú? Toca otra vez')) return; proposeWeek(k); toast('Menú propuesto'); },
  'dish-other': (el) => {
    const k = el.dataset.k; const week = db.clone(db.raw().menu[k]); const day = week[+el.dataset.di];
    const used = week.flatMap((d) => d.dishes.map((x) => x.recipe)).filter(Boolean);
    const d = day.dishes.find((x) => x.id === el.dataset.id); d.recipe = randomRecipe(used); delete d.text; saveWeek(k, week);
  },
  'dish-del': (el) => { const k = el.dataset.k; const week = db.clone(db.raw().menu[k]); const day = week[+el.dataset.di]; day.dishes = day.dishes.filter((x) => x.id !== el.dataset.id); saveWeek(k, week); },
  'dish-shop': (el) => { const week = db.raw().menu[el.dataset.k]; const d = week[+el.dataset.di].dishes.find((x) => x.id === el.dataset.id); const n = dishesToShopping([d]); toast(n ? `${dishName(d)}: ingredientes a la compra` : 'Ese plato no tiene ingredientes apuntados'); },
  'week-shop': (el) => { const week = db.raw().menu[el.dataset.k]; const n = dishesToShopping(week.flatMap((d) => d.dishes)); toast(`${n} ingredientes pasados a la compra`); },
  'recipe-edit': (el) => { ui.editRecipe = el.dataset.id; render(); window.scrollTo(0, 0); },
  'recipe-cancel': () => { ui.editRecipe = null; render(); },
  kid: (el) => { ui.coleKid = el.dataset.k; render(); },
  dose: (el) => {
    const m = db.get('meds', el.dataset.id); const t = today(); const g = doseGiven(m, t, el.dataset.t);
    if (g) db.set('doses', db.all('doses').filter((d) => d !== g));
    else { db.set('doses', [...db.all('doses'), { medId: m.id, date: t, time: el.dataset.t, by: db.settings().user, at: nowHM() }]); toast('Toma apuntada'); }
  },
  'bill-done': (el) => {
    const b = db.get('bills', el.dataset.id);
    if (REP_M[b.repeat]) { db.update('bills', b.id, { date: addMonths(b.date, REP_M[b.repeat]), lastDone: today() }); toast(`Hecho. Próximo: ${fmtShort(db.get('bills', b.id).date)}`); }
    else { db.update('bills', b.id, { done: true, lastDone: today() }); toast('Hecho'); }
  },
  preset: (el) => { const i = document.getElementById('bill-title'); if (i) { i.value = el.dataset.v; i.focus(); } },
  logout: async (el) => { if (!armed(el, '¿Cerrar sesión? Toca otra vez')) return; await auth.signOut(); phase = 'login'; ui.login = { step: 'email', email: '', msg: '', busy: false }; location.hash = '#'; render(); },
  export: () => {
    const blob = new Blob([db.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `casa-familia-copia-${today()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  reset: (el) => { if (armed(el, 'Se borra todo lo de este móvil. Toca otra vez')) { db.reset(); toast('Datos borrados'); } },
  atype: (el) => { ui.addType = el.dataset.k; location.hash = '#anadir-' + el.dataset.k; }
};

/* ───────────── Formularios ───────────── */
const F = {
  pass: async (fd, f) => { try { await auth.changePassword(fd.get('password')); f.reset(); toast('Contraseña cambiada'); } catch (e) { toast('No se ha podido cambiar: prueba con otra más larga'); } },
  login: async (fd) => {
    const L = ui.login; L.email = fd.get('email').trim(); L.busy = true; L.msg = ''; render();
    try { await auth.signIn(L.email, fd.get('password')); phase = 'ok'; ui.who = 'all'; location.hash = '#'; } catch (e) { L.msg = loginError(e); }
    L.busy = false; render();
  },
  event: (fd, f) => {
    const who = fd.getAll('who'); const o = { title: fd.get('title').trim(), who: who.length ? who : ['f'], date: fd.get('date'), time: fd.get('time'), endTime: fd.get('endTime'), place: fd.get('place').trim(), repeat: fd.get('repeat'), days: fd.getAll('days').map(Number), until: fd.get('until') };
    if (f.dataset.id) db.update('events', f.dataset.id, o); else db.add('events', o);
    location.hash = '#agenda'; toast('Guardado en la agenda');
  },
  task: (fd, f) => { db.add('tasks', { title: fd.get('title').trim(), who: fd.get('who') || 'f', date: fd.get('date') || '', done: false }); if (f.dataset.go) location.hash = f.dataset.go; else render(); toast('Tarea apuntada'); },
  shop1: (fd) => { addShopping(cap(fd.get('name').trim()), parseFloat(fd.get('qty')) || 1, fd.get('unit'), fd.get('store')); location.hash = '#compra'; toast('Añadido a la compra'); },
  school: (fd, f) => { db.add('school', { kid: fd.get('kid'), type: fd.get('type'), title: fd.get('title').trim(), date: fd.get('date') || '', done: false, source: 'manual' }); if (f.dataset.go) location.hash = f.dataset.go; else render(); toast('Apuntado en Cole'); },
  med: (fd) => { db.add('meds', { who: fd.get('who'), name: fd.get('name').trim(), every: +fd.get('every'), first: fd.get('first'), start: today(), until: fd.get('until') || '' }); location.hash = '#salud'; toast('Tomas creadas'); },
  bill: (fd) => { db.add('bills', { title: fd.get('title').trim(), kind: fd.get('kind'), date: fd.get('date'), amount: fd.get('amount') ? parseFloat(fd.get('amount')) : '', repeat: fd.get('repeat'), notice: +fd.get('notice'), done: false }); location.hash = '#casa'; toast('Guardado en Casa'); },
  gift: (fd, f) => { db.add('gifts', { who: f.dataset.who || fd.get('who'), text: fd.get('text').trim(), occasion: fd.get('occasion'), done: false }); if (f.dataset.go) { ui.who = f.dataset.who || fd.get('who'); location.hash = '#'; } else render(); toast('Idea guardada'); },
  ficha: (fd, f) => { const ps = db.clone(people()); const p = ps.find((x) => x.id === f.dataset.id); p.cumple = fd.get('cumple'); p.talla = fd.get('talla').trim(); p.pie = fd.get('pie').trim(); ui.editFicha = null; db.set('people', ps); toast('Datos guardados'); },
  store: (fd) => { const n = fd.get('name').trim(); if (n && !db.all('stores').includes(n)) db.set('stores', [...db.all('stores'), n]); },
  recipe: (fd, f) => { const o = { name: fd.get('name').trim(), ingredients: parseIngredients(fd.get('ing') || '') }; if (f.dataset.id) db.update('recipes', f.dataset.id, o); else db.add('recipes', o); ui.editRecipe = null; render(); toast('Plato guardado'); },
  turno: (fd, f) => {
    const o = { date: fd.get('date'), kind: fd.get('kind'), start: fd.get('start'), end: fd.get('end'), place: fd.get('place').trim(), away: fd.get('away').trim() };
    if (f.dataset.id) db.update('shifts', f.dataset.id, o); else db.add('shifts', o);
    location.hash = '#agenda'; toast('Trabajo de Silvia guardado');
  }
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]');
  if (!el || !A[el.dataset.a]) return;
  e.preventDefault();
  A[el.dataset.a](el, e);
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-f]');
  if (!f || !F[f.dataset.f]) return;
  e.preventDefault();
  F[f.dataset.f](new FormData(f), f);
});
document.addEventListener('input', (e) => {
  const el = e.target.closest('[data-i]');
  if (!el) return;
  ui[el.dataset.i] = el.value;
  render();
});
document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-c]');
  if (!el) return;
  const c = el.dataset.c;
  if (c === 'dish-add' && el.value) {
    const k = el.dataset.k; const week = db.clone(db.raw().menu[k]); const day = week[+el.dataset.di];
    const used = week.flatMap((d) => d.dishes.map((x) => x.recipe)).filter(Boolean);
    day.dishes.push({ id: uid(), recipe: el.value === '__azar' ? randomRecipe(used) : el.value });
    saveWeek(k, week);
  } else if (c === 'tile') {
    const h = new Set(db.settings().hiddenTiles); if (el.checked) h.delete(el.dataset.k); else h.add(el.dataset.k);
    db.setSettings({ hiddenTiles: [...h] });
  } else if (c === 'import' && el.files[0]) {
    const r = new FileReader();
    r.onload = () => { try { db.importJSON(r.result); toast('Copia recuperada'); } catch (err) { toast('Ese archivo no es una copia válida'); } };
    r.readAsText(el.files[0]);
  }
});

db.onChange(render);
window.addEventListener('hashchange', () => { if (!parts().length) { /* vuelve a inicio */ } render(); window.scrollTo(0, 0); });
render();
loadWeather();
(async () => { phase = await auth.init(); if (phase === 'nofamily') ui.login.msg = 'Ese correo no es de la familia.'; if (phase === 'error') { ui.login.msg = 'No se ha podido conectar. Comprueba la conexión y vuelve a abrir la app.'; } render(); })();
if (location.hostname === 'localhost') window.__casa = { db, auth };
setInterval(() => { if (!document.activeElement || document.activeElement === document.body) render(); }, 60 * 1000);
if ('serviceWorker' in navigator && location.protocol === 'https:' && !SANDBOXED) navigator.serviceWorker.register('sw.js').catch(() => {});
