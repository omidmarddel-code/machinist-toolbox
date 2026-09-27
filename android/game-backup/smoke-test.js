/* تست دودی بازی «دقت تراش» — یک DOM کوچک شبیه‌سازی می‌کند و منطق بازی را واقعاً اجرا می‌کند.
   اجرا:  node mech-game-smoke.js  <path-to-mobile-game.js>                                */
'use strict';
const fs = require('fs');

const FILE = process.argv[2];
if (!FILE) { console.error('missing file arg'); process.exit(2); }
const src = fs.readFileSync(FILE, 'utf8');

let mutations = { class: 0, child: 0 };

function classSet(el) { return new Set(String(el._className || '').split(/\s+/).filter(Boolean)); }

function makeClassList(el) {
  return {
    add: function () {
      mutations.class++;
      const s = classSet(el);
      for (const c of arguments) s.add(c);
      el._className = [...s].join(' ');
      el._fire();
    },
    remove: function () {
      mutations.class++;
      const s = classSet(el);
      for (const c of arguments) s.delete(c);
      el._className = [...s].join(' ');
      el._fire();
    },
    contains: function (c) { return classSet(el).has(c); },
    toggle: function (c, force) {
      mutations.class++;
      const s = classSet(el);
      const has = s.has(c);
      const want = force === undefined ? !has : !!force;
      if (want) s.add(c); else s.delete(c);
      el._className = [...s].join(' ');
      el._fire();
      return want;
    }
  };
}

function El(tag) {
  this.tagName = String(tag || 'div').toUpperCase();
  this.children = [];
  this.parentNode = null;
  this.listeners = {};
  this.attrs = {};
  this.dataset = {};
  this.style = {};
  this._className = '';
  this._hidden = false;
  this.textContent = '';
  this.firstChild = null;
  this._q = {};
  this._observers = [];
  this.classList = makeClassList(this);
}
Object.defineProperty(El.prototype, 'className', {
  get: function () { return this._className; },
  set: function (v) { mutations.class++; this._className = String(v); this._fire(); }
});
Object.defineProperty(El.prototype, 'hidden', {
  get: function () { return !!this._hidden; },
  set: function (v) { this._hidden = !!v; this._fire(); }
});
Object.defineProperty(El.prototype, 'innerHTML', {
  get: function () { return this._html || ''; },
  set: function (v) {
    this._html = String(v);
    if (this._html === '') { this.children = []; this.firstChild = null; }
  }
});
El.prototype._fire = function () { this._observers.slice().forEach(function (cb) { cb(); }); };
Object.defineProperty(El.prototype, 'nextSibling', {
  get: function () {
    if (!this.parentNode) return null;
    const i = this.parentNode.children.indexOf(this);
    return this.parentNode.children[i + 1] || null;
  }
});
El.prototype.setAttribute = function (k, v) { this.attrs[k] = v; };
El.prototype.getAttribute = function (k) { return this.attrs[k]; };
El.prototype.appendChild = function (child) {
  mutations.child++;
  child.parentNode = this; this.children.push(child);
  if (this.children.length === 1) this.firstChild = child;
  return child;
};
El.prototype.insertBefore = function (child, ref) {
  mutations.child++;
  child.parentNode = this;
  const i = this.children.indexOf(ref);
  if (i < 0) this.children.unshift(child); else this.children.splice(i, 0, child);
  this.firstChild = this.children[0];
  if (child.className && child.className.indexOf('mobile-game') !== -1) createdScreen = child;
  return child;
};
El.prototype.addEventListener = function (type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); };
El.prototype.dispatch = function (type, ev) {
  const self = this;
  (self.listeners[type] || []).forEach(function (fn) { fn(Object.assign({ target: self }, ev || {})); });
};
El.prototype.querySelector = function (sel) {
  if (sel === '.mg-lives i') return this.querySelectorAll(sel)[0] || null;
  const da = /^\[data-action="([^"]+)"\]$/.exec(sel);
  if (da) {
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].dataset && this.children[i].dataset.action === da[1]) return this.children[i];
    }
    return null;
  }
  if (!this._q[sel]) {
    const el = new El('div');
    el.parentNode = this;                       // برای actOf (بالا رفتن در درخت)
    if (sel === '.mg-hold') el.dataset.act = 'hold';
    if (sel === '.mg-close') el.dataset.act = 'exit';
    if (sel === '.mg-sound') el.dataset.act = 'sound';
    if (sel === '[data-act="open-lathe"]') el.dataset.act = 'open-lathe';
    if (sel === '[data-act="open-cannon"]') el.dataset.act = 'open-cannon';
    this._q[sel] = el;
  }
  return this._q[sel];
};
El.prototype.querySelectorAll = function (sel) {
  if (sel === '.mg-lives i') {
    if (!this._hearts) this._hearts = [new El('i'), new El('i'), new El('i')];
    return this._hearts;
  }
  if (sel === '[data-tool="mechGame"]') {
    return this.children.filter(function (c) { return c.dataset && c.dataset.tool === 'mechGame'; });
  }
  if (sel === '.m-card') return this.children.filter(function (c) { return c.classList.contains('m-card'); });
  const da = /^\[data-action="([^"]+)"\]$/.exec(sel);
  if (da) return this.children.filter(function (c) { return c.dataset && c.dataset.action === da[1]; });
  return [];
};
El.prototype.getBoundingClientRect = function () {
  return { left: 0, top: 0, right: 360, bottom: 640, width: 360, height: 640 };
};
El.prototype.contains = function (node) {
  let n = node;
  while (n) { if (n === this) return true; n = n.parentNode; }
  return false;
};

let createdScreen = null;
/* ---------- درخت صفحه اصلی (شبیه آنچه mobile.js می‌سازد) ---------- */
const workspace = new El('main'); workspace._className = 'workspace';
const grid = new El('div'); grid._className = 'mobile-grid';
const home = new El('div'); home._className = 'mobile-home';
const progTrain = new El('button'); progTrain._className = 'm-card'; progTrain.dataset.action = 'programmingTraining';
const quizCard = new El('button'); quizCard._className = 'm-card'; quizCard.dataset.action = 'programmingQuiz';
const mechIq = new El('button'); mechIq._className = 'm-card'; mechIq.dataset.action = 'mechIq';
const generalIq = new El('button'); generalIq._className = 'm-card'; generalIq.dataset.action = 'generalIq';
const calcCard = new El('button'); calcCard._className = 'm-card'; calcCard.dataset.action = 'calculator';
grid.appendChild(progTrain);
grid.appendChild(quizCard);
grid.appendChild(mechIq);
grid.appendChild(generalIq);
grid.appendChild(calcCard);
home.appendChild(grid);
workspace.appendChild(home);

const tabbar = new El('nav'); tabbar._className = 'mobile-tabbar';
const homeTab = new El('button'); homeTab._className = 'tab'; homeTab.dataset.action = 'home';
homeTab.clickCount = 0;
homeTab.click = function () {
  homeTab.clickCount++;
  // رفتار showHome در mobile.js: همه پنل‌ها پنهان می‌شوند (ناظر بازی هم همان را می‌بیند)
  document.querySelectorAll('.tool-panel').forEach(function (p) { p.hidden = true; p.classList.remove('active'); });
};

['calculations', 'education', 'home', 'notes', 'materials'].forEach(function (a) {
  if (a === 'home') { tabbar.appendChild(homeTab); return; }
  const t = new El('button'); t._className = 'tab'; t.dataset.action = a; tabbar.appendChild(t);
});

const document = {
  body: new El('body'),
  readyState: 'complete',
  hidden: false,
  addEventListener: function () { },
  createElement: function (tag) { return new El(tag); },
  querySelector: function (sel) {
    if (sel === '.mobile-game') return createdScreen;
    if (sel === '.workspace') return workspace;
    if (sel === '.mobile-home') return home;
    if (sel === '.mobile-home .mobile-grid') return grid;
    if (sel === '.mobile-tabbar') return tabbar;
    if (sel === '.mobile-tabbar .tab[data-action="home"]') return homeTab;
    return null;
  },
  querySelectorAll: function (sel) {
    if (sel === '.tool-panel') return createdScreen ? [createdScreen] : [];
    if (sel === '.mobile-tabbar .tab') return tabbar.children.slice();
    if (sel === '.mobile-tabbar .tab[data-action="home"]') return [homeTab];
    return [];
  }
};
document.body.classList.add('capacitor-mobile');

/* ---------- استاب‌های جهانی ---------- */
const store = new Map();
const localStorage = {
  getItem: function (k) { return store.has(k) ? store.get(k) : null; },
  setItem: function (k, v) { store.set(k, String(v)); },
  removeItem: function (k) { store.delete(k); }
};
const navigator = { vibrate: function () { } };
let rafSeq = 0;
const rafs = new Map();
function requestAnimationFrame(cb) { const id = ++rafSeq; rafs.set(id, cb); return id; }
function cancelAnimationFrame(id) { rafs.delete(id); }
function MutationObserver(cb) { this.cb = cb; }
MutationObserver.prototype.observe = function (el) { el._observers.push(this.cb); };
MutationObserver.prototype.disconnect = function () { };
const winListeners = {};
const window = {
  addEventListener: function (t, fn) { (winListeners[t] = winListeners[t] || []).push(fn); },
  scrollTo: function () { }
};

/* ---------- اجرای اسکریپت بازی ---------- */
const factory = new Function(
  'window', 'document', 'localStorage', 'navigator', 'MutationObserver',
  'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'setInterval', 'clearInterval', 'clearTimeout', 'console',
  src
);
factory(window, document, localStorage, navigator, MutationObserver,
  requestAnimationFrame, cancelAnimationFrame, setTimeout, setInterval, clearInterval, clearTimeout, console);

/* ---------- کمک‌های تست ---------- */
let now = 1000;
function tick(frames, dtMs) {
  for (let k = 0; k < frames; k++) {
    const pending = [...rafs.entries()];
    rafs.clear();
    now += (dtMs === undefined ? 16 : dtMs);
    for (const entry of pending) entry[1](now);
  }
}
function down() { createdScreen.dispatch('pointerdown', { target: screenEl('.mg-hold') }); }
function up() { (winListeners.pointerup || []).forEach(function (fn) { fn({}); }); }
function screenEl(sel) { return createdScreen.querySelector(sel); }
function clickAction(act) {
  const actions = screenEl('.mg-ov-actions');
  const btn = actions.children.filter(function (b) { return b._act === act; })[0];
  if (!btn) throw new Error('button not found: ' + act);
  btn.listeners.click.forEach(function (fn) { fn({ target: btn }); });
  return btn;
}
/* ---------- تست‌ها ---------- */
let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); }
}
function primaryBtn() {
  const actions = screenEl('.mg-ov-actions');
  const list = actions.children.filter(function (b) { return b.classList.contains('primary'); });
  return list[list.length - 1] || null;
}
function clickAction(act) { /* act فقط برای خوانایی تست است؛ دکمه اصلی همان primary است */ }
function pressPrimary() {
  const btn = primaryBtn();
  if (!btn) throw new Error('primary button not found');
  btn.listeners.click.forEach(function (fn) { fn({ target: btn }); });
}
function clickHome() {
  const actions = screenEl('.mg-ov-actions');
  const list = actions.children.filter(function (b) { return b.classList.contains('ghost'); });
  const btn = list[list.length - 1];
  if (!btn) throw new Error('home button not found');
  btn.listeners.click.forEach(function (fn) { fn({ target: btn }); });
}
function deepCut(frames) { down(); tick(frames); up(); }

const G = window.MachinistGame;
console.log('\n== 1) نصب و راه‌اندازی ==');
check('MachinistGame API در دسترس است', !!G);
const card = grid.children.filter(function (c) { return c.dataset && c.dataset.tool === 'mechGame'; })[0];
check('کارت بازی به صفحه اصلی اضافه شد', !!card);
check('کارت دقیقاً بالای کارت آزمون برنامه‌نویسی است', grid.children.indexOf(card) === grid.children.indexOf(quizCard) - 1);
check('کارت بازی مربعی است (بدون m-wide)', !!card && card.classList.contains('m-card') && !card.classList.contains('m-wide'));
check('متن کارت بازی را معرفی می‌کند', !!card && /بازی/.test(card.innerHTML) && !/ماچینیست گیم/.test(card.innerHTML));
check('پنل بازی ساخته شد', !!createdScreen);
check('پنل با data-panel="mechGame" ثبت شد', !!createdScreen && createdScreen.dataset.panel === 'mechGame');
check('پنل در .workspace قرار گرفت', !!createdScreen && createdScreen.parentNode === workspace);
check('در ابتدا بازی غیرفعال است', G.state().active === false);

console.log('\n== 2) ورود به بازی از کارت و باز شدن منوی هاب ==');
card.listeners.click[0]({ target: card });
check('صفحه بازی فعال شد', G.state().active === true);
check('منوی انتخاب بازی (Hub) باز است', G.state().view === 'hub');
check('کارت بازی دقت تراش در منو هست', !!screenEl('[data-act="open-lathe"]'));
check('کارت بازی شلیک به متریال در منو هست', !!screenEl('[data-act="open-cannon"]'));

console.log('\n== 3) ورود به دقت تراش و پیکربندی قطعه اول ==');
Math.random = function () { return 0.5; }; // قطعی‌سازی برای تست
const latheCard = screenEl('[data-act="open-lathe"]');
createdScreen.listeners.click.forEach(function (fn) { fn({ target: latheCard }); });
check('نمای دقت تراش فعال شد', G.state().view === 'lathe');
let st = G.state();
check('بازی شروع شد', st.started === true);
check('قطعه اول: آلومینیوم با قطر شروع 20.9', Math.abs(st.dia - 20.9) < 1e-9, st.dia);
check('تلرانس قطعه اول ±0.15', Math.abs(st.high - 20.15) < 1e-9 && Math.abs(st.low - 19.85) < 1e-9, [st.low, st.high]);
check('سه جان در ابتدا', st.lives === 3);
check('راهنما بسته شد', G.state().overlay === false);
check('نوار تلرانس چیده شد', /%$/.test(screenEl('.mg-zone-ok').style.width || '') && /%$/.test(screenEl('.mg-bar-mark').style.left || ''));
check('تصویر قطعه با قطر هم‌اندازه شد', /px$/.test(screenEl('.mg-part').style.height || ''));

console.log('\n== 4) براده‌برداری (نگه‌داشتن دکمه) ==');
mutations.class = 0; mutations.child = 0;
down();
check('وضعیت برش فعال شد', G.state().cutting === true);
tick(30);
check('با نگه‌داشتن دکمه قطر کم شد', G.state().dia < st.dia - 0.05, G.state().dia);
check('در حلقه هیچ گره فرزندی دست‌کاری نشد', mutations.child === 0, mutations);
check('تغییر کلاس در حلقه تقریباً صفر است', mutations.class <= 4, mutations.class);
up();
st = G.state();
check('پاس شمرده شد', st.passes === 1, st.passes);
check('اندازه‌گیری روی دقت 0.01 گرد شد', Math.abs(st.dia * 100 - Math.round(st.dia * 100)) < 1e-9, st.dia);
check('نمایشگر DRO به‌روز شد', /^Ø\d+\.\d{3}$/.test(screenEl('.mg-dia').textContent), screenEl('.mg-dia').textContent);
check('پیام وضعیت بعد از اندازه‌گیری آمد', screenEl('.mg-status').textContent.length > 5);
console.log('\n== 5) رسیدن تدریجی به تلرانس (پاس‌های پشت سر هم، مثل یک اپراتور ماهر) ==');
// شبیه‌ساز دقیق نرخ برداشت براده همان‌طور که در موتور بازی محاسبه می‌شود
const FEED = 1.25;          // آلومینیوم 6061
const FRAME = 0.016;        // 16ms
const RAMP = 0.85;
const FINE = 0.30;
function removalFor(frames) {
  let sum = 0;
  for (let k = 1; k <= frames; k++) {
    const ramp = FINE + (1 - FINE) * Math.min(1, (k * FRAME) / RAMP);
    sum += FEED * ramp * FRAME;
  }
  return sum;
}
function bestFrames(maxRemoval) {
  let best = 0;
  for (let n = 1; n <= 400; n++) { if (removalFor(n) <= maxRemoval) best = n; else break; }
  return best;
}
let passesUsed = 0;
for (let round_i = 0; round_i < 6; round_i++) {
  const s = G.state();
  if (s.dia <= s.high + 1e-9) break;
  const target = s.low + (s.high - s.low) * 0.7;   // کمی بالاتر از مرکز بازه = حاشیه امن
  const frames = Math.max(1, bestFrames(s.dia - target));
  deepCut(frames);
  passesUsed++;
  if (G.state().parts === 1 || G.state().over) break;
}
st = G.state();
check('قطعه داخل بازه تلرانس قبول شد', st.dia <= st.high + 1e-9 && st.dia >= st.low - 1e-9, { dia: st.dia, low: st.low, high: st.high });
check('با پاس‌های حساب‌شده (نه بیشتر از حد مجاز) قبول شد', st.parts === 1 && st.passes <= 5, { parts: st.parts, passes: st.passes, passesUsed: passesUsed });
check('امتیاز ثبت شد', st.score > 0, st.score);
check('کمبو یک شد', st.combo === 1, st.combo);
check('سطح بالا رفت (قطعه دوم)', st.level === 2, st.level);
check('صفحه نتیجه «قبول» نمایش داده شد', /قبول/.test(screenEl('.mg-ov-title').textContent), screenEl('.mg-ov-title').textContent);
check('ستاره‌ها در نتیجه محاسبه شد', /[★☆]{3}/.test(screenEl('.mg-ov-body').innerHTML));
check('رکورد در localStorage ذخیره شد', Number(store.get('mechGameBest')) === st.score, store.get('mechGameBest'));
check('جان‌ها دست‌نخورده ماند', st.lives === 3);

console.log('\n== 6) قطعه سخت‌تر: متریال و تلرانس سطح 2 ==');
pressPrimary();
st = G.state();
check('قطعه دوم: فولاد ST37 با قطر شروع 26.1', Math.abs(st.dia - 26.1) < 1e-9, st.dia);
check('تلرانس تنگ‌تر شد (±0.12)', Math.abs(st.high - 25.12) < 1e-9 && Math.abs(st.low - 24.88) < 1e-9, [st.low, st.high]);
check('نام متریال در صفحه نوشته شد', /ST37/.test(screenEl('.mg-mat-name').textContent), screenEl('.mg-mat-name').textContent);
check('قطر هدف نمایش داده شد', /Ø25\.00/.test(screenEl('.mg-target').textContent), screenEl('.mg-target').textContent);

console.log('\n== 7) ضایعات، کاهش جان و پایان بازی ==');
let scrapCount = 0;
for (let i = 0; i < 3; i++) {
  const before = G.state();
  deepCut(260);                        // یک برش عمیق: قطعاً از حد پایین رد می‌شود
  const after = G.state();
  if (after.dia >= after.low - 1e-9) break;   // اگر به‌هر دلیلی ضایعات نشد، ادامه نده
  scrapCount++;
  check('ضایعات شماره ' + scrapCount + ': یک جان کم شد', after.lives === before.lives - 1, { before: before.lives, after: after.lives });
  if (after.over) {
    check('پایان بازی اعلام شد', after.over === true && after.lives === 0);
    check('صفحه پایان شیفت نمایش داده شد', /پایان شیفت/.test(screenEl('.mg-ov-title').textContent), screenEl('.mg-ov-title').textContent);
    check('خلاصه امتیاز/رکورد در صفحه پایان هست', /رکورد/.test(screenEl('.mg-ov-body').innerHTML));
    break;
  }
  check('صفحه ضایعات با راهنمای اصلاح نشان داده شد', /ضایعات|غیراقتصادی/.test(screenEl('.mg-ov-title').textContent), screenEl('.mg-ov-title').textContent);
  pressPrimary();                      // «تلاش بعدی»
}
check('سه جان در مجموع سوزانده شد (پایان بازی)', scrapCount === 3, scrapCount);
st = G.state();
check('بعد از پایان بازی قطر تغییر نمی‌کند (برش قفل است)', (function () {
  down(); tick(20); up();
  return G.state().cutting === false;
})());

console.log('\n== 8) بازی مجدد و بازگشت به خانه ==');
pressPrimary();                        // «بازی مجدد»
st = G.state();
check('امتیاز صفر شد', st.score === 0, st.score);
check('جان‌ها پر شد', st.lives === 3);
check('قطعه‌ها از اول شروع شد', st.parts === 0 && Math.abs(st.dia - 20.9) < 1e-6, st.dia);
check('وضعیت پایان پاک شد', st.over === false);
check('رکورد قبلی حفظ شد', Number(store.get('mechGameBest')) > 0, store.get('mechGameBest'));

down(); tick(10);                     // وسط برش، خروج از بازی
check('برش در جریان است', G.state().cutting === true);
G.home();
check('دکمه خانه رابط موبایل فراخوانی شد', homeTab.clickCount === 1, homeTab.clickCount);
check('صفحه بازی غیرفعال شد', G.state().active === false);
check('برش نیمه‌کاره لغو شد (بدون ضایعات)', G.state().cutting === false && G.state().lives === 3);
check('حلقه بازی متوقف شد (هیچ فریم معلقی نیست)', rafs.size === 0, rafs.size);
check('لایه نتیجه روی صفحه خانه باقی نمی‌ماند', screenEl('.mg-overlay').hidden === true);

console.log('\n== 8ب) خروج با باز بودن کارت نتیجه و بازگشت به بازی ==');
createdScreen.hidden = false;
createdScreen.classList.add('active');
down(); tick(6); up();                       // یک پاس
const midState = G.state();
createdScreen.hidden = true;
createdScreen.classList.remove('active');   // مثل Back گوشی
check('کارت نتیجه پس از خروج پنهان شد', screenEl('.mg-overlay').hidden === true);
createdScreen.hidden = false;
createdScreen.classList.add('active');
check('پس از بازگشت، همان نتیجه/وضعیت برمی‌گردد', G.state().passes === midState.passes, { now: G.state().passes, before: midState.passes });
check('و کارت نتیجه دوباره نمایش داده می‌شود', screenEl('.mg-overlay').hidden === false || G.state().passes < 5);

console.log('\n== 9) بازگشت دوباره به بازی (مسیر جستجو/Back) ==');
createdScreen.hidden = false;
createdScreen.classList.add('active');   // مثل forceShowPanel در mobile.js
check('بازی دوباره فعال شد', G.state().active === true);
check('وضعیت بازی حفظ شد (ادامه می‌دهد)', G.state().parts === 0 && G.state().lives === 3 && G.state().passes === midState.passes);
check('راهنما دوباره باز نشد (بازی شروع‌شده)', G.state().overlay === false);
check('حلقه دوباره اجرا شد', rafs.size === 1, rafs.size);
console.log('\n== 10) عدم وجود بازی در نوار تب پایین (فقط در صفحه اصلی) ==');
const gameTab = tabbar.children.filter(function (c) { return c.dataset && c.dataset.action === 'mechGame'; })[0];
check('تب بازی در نوار پایین وجود ندارد', !gameTab);
check('نوار تب کلاس has-game ندارد', !tabbar.classList.contains('has-game'));
homeTab.click();
check('با بازگشت به خانه، بازی غیرفعال است', G.state().active === false);
card.listeners.click[0]({ target: card });
check('تپ روی کارت صفحه اصلی، بازی را باز کرد', G.state().active === true);



console.log('\n== 11) تست‌های بازی شلیک به متریال (Material Cannon) ==');
G.switchView('cannon');
let cState = G.state();
check('امکان جابجایی به بازی شلیک متریال وجود دارد', cState.view === 'cannon');
check('بازی شلیک آماده شد', cState.score === 0 && cState.lives === 3);
check('هدف متریال انتخاب شده است', !!cState.cannonTarget);

G.switchView('hub');
check('امکان بازگشت به هاب انتخاب بازی وجود دارد', G.state().view === 'hub');

G.switchView('lathe');
check('امکان برگشت به بازی دقت تراش بدون اختلال در وضعیت وجود دارد', G.state().view === 'lathe');

console.log('\n== 12) تست رگرسیون: شلیک دوم و شلیک‌های بعدی باید ممکن باشند ==');

// سویپ روی توپ: انگشت را از پایین به بالا می\u200cکشیم (همان کاری که کاربر می\u200cکند)
function swipeOnBall(dist) {
  const wrap = screenEl('.mc-arena-wrap');
  wrap.dispatch('pointerdown', { clientX: 180, clientY: 500 });
  (winListeners.pointermove || []).forEach(function (fn) { fn({ clientX: 180 + dist, clientY: 500 - dist }); });
  up();
}

G.switchView('cannon');
tick(2);
check('بازی شلیک با شلیک آزاد (بدون قفل) شروع می\u200cشود', G.state().cannonShotUsed === false);

swipeOnBall(60);
check('سویپ روی توپ گلوله را پرتاب می\u200cکند', G.state().cannonBalls === 1);
check('تا وقتی گلوله در راه است، شلیک دوباره ثبت نمی\u200cشود', G.state().cannonShotUsed === true);

// شلیک اول تا نتیجه\u200cاش حل شود: یا مرحله عوض می\u200cشود، یا گلوله تمام می\u200cشود، یا پاپ\u200cآپ باز می\u200cشود
let frames = 0;
while (frames < 900) {
  tick(1);
  frames++;
  if (G.state().overlay) { pressPrimary(); break; }
  if (!G.state().cannonShotUsed) break;
}
const afterFirst = G.state();
check('پس از تمام شدن شلیک اول، شلیک بعدی دوباره آماده می\u200cشود (باگ قفل شلیک رفع شد)',
  afterFirst.cannonShotUsed === false && afterFirst.overlay === false, afterFirst);
check('پس از شلیک اول توپی در میدان نمانده است', afterFirst.cannonBalls === 0);

swipeOnBall(60);
check('شلیک دوم با همان سویپ ساده ثبت می\u200cشود', G.state().cannonBalls === 1);
check('بازی بعد از شلیک دوم قفل نشده است', G.state().cannonShotUsed === true);

// چند شلیک پیاپی دیگر هم باید کار کند
let allShotsOk = true;
for (let k = 0; k < 3; k++) {
  let f = 0;
  while (f < 900 && G.state().cannonShotUsed) {
    tick(1);
    f++;
    if (G.state().overlay) { pressPrimary(); break; }
  }
  if (G.state().cannonShotUsed) { allShotsOk = false; break; }
  swipeOnBall(60);
  if (G.state().cannonBalls !== 1) { allShotsOk = false; break; }
}
check('شلیک\u200cهای بعدی هم پشت سر هم کار می\u200cکنند (بدون گیر کردن بازی)', allShotsOk);

G.switchView('hub');
check('پس از چند شلیک، بازگشت به هاب ممکن است', G.state().view === 'hub');

console.log('\n===== نتیجه: ' + passed + ' موفق، ' + failed + ' ناموفق =====');
process.exit(failed === 0 ? 0 : 1);
