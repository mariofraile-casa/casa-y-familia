// Capa de datos. Todo se guarda en Supabase (compartido entre Mario y Silvia, en directo).
// En el móvil queda una copia para abrir la app al instante y sin conexión; los cambios
// hechos sin conexión se suben en cuanto vuelve.
// El resto de la app solo usa db.* y auth.*: no sabe dónde se guardan las cosas.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { seed } from './seed.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'casa-auth' }
});

const CACHE = 'casa-familia-cache-v2';
// Colecciones con un id por elemento: cada elemento es una fila (así dos personas pueden tocar cosas distintas a la vez).
const ITEM = ['shifts', 'events', 'tasks', 'shopping', 'recipes', 'school', 'meds', 'bills', 'gifts'];
const ITEMS = new Set(ITEM);
const listeners = [];

let me = { email: null, person: null, admin: false };
let rows = new Map(); // «col|id» → JSON tal como está en el servidor
let data = fromRows(new Map());
let dirty = false, flushing = false, timer = null;
let status = { online: navigator.onLine, error: '' };

function clone(o) { return JSON.parse(JSON.stringify(o)); }
// JSON con las claves ordenadas: así lo que vuelve del servidor se compara bien con lo local.
function canon(v) {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(v ?? null);
}

function toRows(d) {
  const m = new Map();
  for (const [k, v] of Object.entries(d)) {
    if (k === 'settings') continue;
    if (ITEMS.has(k)) { for (const it of v || []) if (it && it.id) m.set(`${k}|${it.id}`, canon(it)); }
    else m.set(`kv|${k}`, canon(v));
  }
  m.set('config|hiddenTiles', canon(d.settings?.hiddenTiles || []));
  return m;
}

function fromRows(m) {
  const d = seed();
  for (const k of ITEM) d[k] = [];
  for (const [key, json] of m) {
    const i = key.indexOf('|');
    const col = key.slice(0, i), id = key.slice(i + 1);
    const v = JSON.parse(json);
    if (col === 'kv') d[id] = v;
    else if (col === 'config') { if (id === 'hiddenTiles') d.settings.hiddenTiles = v; }
    else if (ITEMS.has(col)) d[col].push(v);
  }
  for (const k of ITEM) d[k].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0) || String(a.id).localeCompare(String(b.id)));
  d.settings.user = me.person || 'm';
  return d;
}

function notify() { listeners.forEach((f) => f()); }
function cache() {
  try { localStorage.setItem(CACHE, JSON.stringify({ me, rows: [...rows], local: dirty ? canonAll() : null })); } catch (e) { /* sin espacio: no pasa nada */ }
}
const canonAll = () => [...toRows(data)];

// Se llama tras cada cambio: avisa a la pantalla al momento y sube los cambios poco después.
function save() {
  dirty = true;
  cache();
  notify();
  clearTimeout(timer);
  timer = setTimeout(flush, 400);
}

async function flush() {
  if (flushing || !me.email) return;
  flushing = true;
  try {
    while (dirty) {
      dirty = false;
      const cur = toRows(data);
      const up = [], del = [];
      for (const [k, v] of cur) {
        if (rows.get(k) === v) continue;
        const [col, id] = [k.slice(0, k.indexOf('|')), k.slice(k.indexOf('|') + 1)];
        if (col === 'config' && !me.admin) continue; // las secciones solo las cambia Mario
        up.push({ col, id, data: JSON.parse(v) });
      }
      for (const k of rows.keys()) if (!cur.has(k)) { const col = k.slice(0, k.indexOf('|')); if (col !== 'config') del.push(k); }
      for (let i = 0; i < up.length; i += 200) {
        const { error } = await sb.from('docs').upsert(up.slice(i, i + 200));
        if (error) throw error;
      }
      for (const col of new Set(del.map((k) => k.slice(0, k.indexOf('|'))))) {
        const ids = del.filter((k) => k.startsWith(col + '|')).map((k) => k.slice(col.length + 1));
        const { error } = await sb.from('docs').delete().eq('col', col).in('id', ids);
        if (error) throw error;
      }
      for (const u of up) rows.set(`${u.col}|${u.id}`, canon(u.data));
      for (const k of del) rows.delete(k);
    }
    status.error = '';
  } catch (e) {
    dirty = true; // se reintenta luego
    status.error = navigator.onLine ? 'No se han podido guardar los últimos cambios. Se reintentará.' : '';
    clearTimeout(timer); timer = setTimeout(flush, 15000);
  } finally {
    flushing = false;
    cache();
  }
}

async function loadAll() {
  const out = new Map();
  for (let from = 0; ; from += 1000) {
    const { data: page, error } = await sb.from('docs').select('col,id,data').range(from, from + 999);
    if (error) throw error;
    for (const r of page) out.set(`${r.col}|${r.id}`, canon(r.data));
    if (page.length < 1000) break;
  }
  return out;
}

let channel = null;
let started = false;
function listen() {
  if (channel) return;
  channel = sb.channel('docs-cambios')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'docs' }, (p) => {
      const r = p.eventType === 'DELETE' ? p.old : p.new;
      if (!r || !r.col) return;
      const key = `${r.col}|${r.id}`;
      if (p.eventType === 'DELETE') rows.delete(key); else rows.set(key, canon(r.data));
      if (dirty || flushing) return; // lo nuestro manda; al terminar de subir se vuelve a leer
      data = fromRows(rows); cache(); notify();
    })
    .subscribe();
}

async function start(session) {
  const email = (session.user.email || '').toLowerCase();
  const { data: fam, error } = await sb.from('family').select('person,is_admin').eq('email', email).maybeSingle();
  if (error) throw error;
  if (!fam) { await sb.auth.signOut(); throw new Error('Este correo no es de la familia.'); }
  me = { email, person: fam.person, admin: !!fam.is_admin };
  rows = await loadAll();
  // Cambios hechos sin conexión que no llegaron a subirse: se recuperan.
  let pendingLocal = null;
  try { pendingLocal = JSON.parse(localStorage.getItem(CACHE) || 'null')?.local; } catch (e) { /* nada */ }
  if (pendingLocal) { data = fromRows(new Map(pendingLocal)); data.settings.user = me.person; dirty = true; }
  else data = fromRows(rows);
  if (!rows.size) dirty = true; // base vacía: se sube lo inicial (recetario, súper…)
  cache(); notify();
  listen();
  if (dirty) flush();
  if (started) return; started = true;
  window.addEventListener('online', () => { status.online = true; if (dirty) flush(); else refresh(); });
  window.addEventListener('offline', () => { status.online = false; notify(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });
}

async function refresh() {
  if (!me.email || dirty || flushing) return;
  try { rows = await loadAll(); data = fromRows(rows); cache(); notify(); } catch (e) { /* sin conexión */ }
}

export const auth = {
  me: () => me,
  status: () => status,
  // Arranque: si ya hay sesión en este móvil, entra directamente.
  async init() {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE) || 'null');
      if (c && c.me && c.me.email) { me = c.me; rows = new Map(c.rows || []); data = c.local ? fromRows(new Map(c.local)) : fromRows(rows); if (c.local) dirty = true; }
    } catch (e) { /* sin copia */ }
    const { data: s } = await sb.auth.getSession();
    if (!s.session) { if (!navigator.onLine && me.email) return 'offline'; me = { email: null, person: null, admin: false }; return 'login'; }
    // Ya había entrado antes en este móvil: se abre al momento con la copia y se pone al día por detrás.
    if (me.email && me.email === (s.session.user.email || '').toLowerCase()) {
      start(s.session).catch((e) => { status.error = e.message === 'Este correo no es de la familia.' ? e.message : ''; notify(); });
      return 'ok';
    }
    try { await start(s.session); return 'ok'; } catch (e) { if (me.email && !navigator.onLine) return 'offline'; return e.message === 'Este correo no es de la familia.' ? 'nofamily' : 'error'; }
  },
  // Entrar con correo y contraseña (los usuarios los da de alta Mario; no hay altas públicas).
  async signIn(email, password) {
    const { data: r, error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw error;
    await start(r.session);
  },
  async changePassword(password) {
    const { error } = await sb.auth.updateUser({ password });
    if (error) throw error;
  },
  async signOut() {
    await flush();
    await sb.auth.signOut();
    try { localStorage.removeItem(CACHE); } catch (e) { /* nada */ }
    me = { email: null, person: null, admin: false }; rows = new Map(); data = fromRows(rows);
  }
};

export function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export const db = {
  raw: () => data,
  all: (col) => data[col] || [],
  get: (col, id) => (data[col] || []).find((x) => x.id === id),
  add(col, obj) {
    const o = { id: uid(), createdBy: me.person, createdAt: Date.now(), ...obj };
    (data[col] = data[col] || []).push(o);
    save();
    return o;
  },
  update(col, id, patch) {
    const o = this.get(col, id);
    if (o) { Object.assign(o, patch, { updatedBy: me.person, updatedAt: Date.now() }); save(); }
    return o;
  },
  remove(col, id) { data[col] = (data[col] || []).filter((x) => x.id !== id); save(); },
  set(key, value) { data[key] = value; save(); },
  settings: () => data.settings,
  setSettings(p) { if (p.hiddenTiles && me.admin) data.settings.hiddenTiles = p.hiddenTiles; save(); },
  exportJSON: () => JSON.stringify(data, null, 2),
  importJSON(json) { const d = JSON.parse(json); const base = seed(); for (const k of Object.keys(base)) if (d[k] === undefined) d[k] = base[k]; d.settings = { ...base.settings, ...d.settings, user: me.person }; data = d; save(); },
  reset() { if (!me.admin) return; data = fromRows(new Map()); save(); },
  // Lo que llega de fuera (Educamos, trabajo de Silvia): se mezcla por id, sin duplicar
  // y sin perder lo que ya se ha marcado como hecho.
  applyFeed(feed) {
    if (!feed) return false;
    for (const col of ['school', 'shifts']) {
      for (const it of feed[col] || []) {
        const ex = (data[col] = data[col] || []).find((x) => x.id === it.id);
        if (ex) Object.assign(ex, it, { done: ex.done });
        else data[col].push({ done: false, source: col === 'school' ? 'educamos' : 'programacion', ...it });
      }
    }
    if (feed.educamos) data.educamos = { ...data.educamos, ...feed.educamos };
    save();
    return true;
  },
  onChange(f) { listeners.push(f); },
  clone
};
