// ===== Machinist Toolbox — هاب بازی‌های کارگاهی (Machinist Games) =====
// فقط نسخه اندروید: شامل دو بازی هیجان‌انگیز و کاربردی:
//  ۱) شلیک به متریال (Material Cannon) — پرتاب توپ به اهداف متحرک متریال مکانیک با موانع چرخشی
//  ۲) دقت تراش (Tolerance Master) — براده‌برداری با دقت صدم میلی‌متر
(function () {
  'use strict';

  if (!document.body || !document.body.classList.contains('capacitor-mobile')) return;

  // ---------- پایگاه متریال‌های مکانیکی برای بازی پرتاب ----------
  var CANNON_MATERIALS = [
    { id: 'CK45', name: 'CK45', full: 'فولاد کربنی متوسط', desc: 'شفت‌ها، میل‌لنگ و پیچ و مهره با چقرمگی عالی', color: '#38bdf8' },
    { id: 'SPK', name: 'SPK', full: 'فولاد سردکار پرکروم', desc: 'تیغه‌های برش، ماتریس و قالب‌های سنبه', color: '#f43f5e' },
    { id: 'MO40', name: 'MO40', full: 'فولاد آلیاژی کروم-مولیبدن', desc: 'چرخ‌دنده‌ها، شفت اکسل و قطعات تنش بالا', color: '#a855f7' },
    { id: 'H13', name: 'H13', full: 'فولاد ابزار گرم‌کار مقاوم شوک', desc: 'قالب‌های ریخته‌گری تحت فشار و دایکست', color: '#f97316' },
    { id: 'VCN200', name: 'VCN200', full: 'فولاد سخت‌شونده نیکل-کروم', desc: 'محورهای سنگین توربین و قطعات فوق مستحکم', color: '#eab308' },
    { id: 'SS304', name: 'SS304', full: 'استیل زنگ‌نزن آستنیتی ۱۸/۸', desc: 'صنایع غذایی، دارویی و مقاومت به خوردگی', color: '#10b981' },
    { id: 'AL6061', name: 'AL6061', full: 'آلیاژ آلومینیوم سازه‌ای', desc: 'سبک‌سازی، سازه‌های هوایی و قابلیت تراش بالا', color: '#06b6d4' },
    { id: 'BRASS', name: 'CUZN', full: 'آلیاژ مس و روی', desc: 'بوش‌ها، اصطکاک پایین و رسانایی الکتریکی', color: '#fbbf24' },
    { id: 'GG25', name: 'GG25', full: 'چدن خاکستری دانه ریز', desc: 'بدنه ماشین‌افزار و میراکننده عالی ارتعاشات', color: '#94a3b8' },
    { id: 'D2', name: 'D2', full: 'فولاد ابزار مقاوم به سایش شدید', desc: 'قالب‌های کشش عمیق و برش ورق‌های سخت', color: '#ec4899' }
  ];

  // ---------- داده‌های بازی دقت تراش ----------
  var LATHE_MATERIALS = [
    { fa: 'آلومینیوم 6061', en: 'AL 6061', feed: 1.25, noise: 0.05 },
    { fa: 'فولاد ST37', en: 'ST37', feed: 1.05, noise: 0.09 },
    { fa: 'فولاد CK45', en: 'CK45', feed: 0.92, noise: 0.12 },
    { fa: 'چدن خاکستری GG25', en: 'GG25', feed: 0.84, noise: 0.16 },
    { fa: 'فولاد ابزاری H13', en: 'H13', feed: 0.74, noise: 0.20 },
    { fa: 'استنلس استیل 304', en: 'SS304', feed: 0.64, noise: 0.24 },
    { fa: 'تیتانیوم Ti-6Al-4V', en: 'Ti64', feed: 0.54, noise: 0.30 }
  ];
  var TOLS = [0.15, 0.12, 0.10, 0.08, 0.07, 0.06, 0.05];
  var NOMINALS = [20, 25, 16, 30, 22, 18, 28];
  var MAX_PASSES = 5;
  var MAX_LIVES = 3;
  var RES = 0.01;
  var FINE = 0.30;
  var HOLD_RAMP = 0.85;
  var PPM = 3.4;
  var CHIP_POOL = 12;
  var CHIP_LIFE = 0.55;

  var BEST_KEY_LATHE = 'mechGameBest';
  var BEST_KEY_CANNON = 'mechCannonBest';
  var MUTE_KEY = 'mechGameMuted';

  // ---------- متغیرهای مشترک ----------
  var screen = null;
  var currentView = 'hub'; // 'hub' | 'lathe' | 'cannon'
  var muted = false;
  var audio = null;
  var screenWired = false;
  var globalRaf = 0;
  var lastTs = 0;

  var lathe = {
    session: null,
    round: null,
    chips: [],
    refs: {}
  };

  var cannon = {
    session: null,
    target: null,
    options: [],
    obstacles: [],
    balls: [],
    sparks: [],
    aim: { active: false, startX: 0, startY: 0, currX: 0, currY: 0, power: 0, angle: 0 },
    cannonPos: { x: 0, y: 0 },
    width: 320,
    height: 400,
    timer: 15,
    maxTimer: 15,
    shotUsed: false,
    canvas: null,
    ctx: null,
    refs: {}
  };

  var refs = {};

  // ---------- ابزارهای کمکی ----------
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function roundTo(v, step) { return Math.round(v / step) * step; }
  function setText(node, value) {
    if (!node) return;
    var first = node.firstChild;
    if (first && first.nodeType === 3) { first.nodeValue = String(value); return; }
    node.textContent = String(value);
  }
  function makeEl(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function fmtDia(v) { return 'Ø' + Number(v).toFixed(3); }
  function fmtTarget(c) { return 'Ø' + c.nominal.toFixed(2) + ' ± ' + c.tol.toFixed(2); }
  function storageGet(k, def) {
    try { var v = localStorage.getItem(k); return v == null ? def : v; } catch (e) { return def; }
  }
  function storageSet(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) { } }
  function vibrate(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { }
  }

  // ---------- قالب HTML کلی ----------
  var SCREEN_HTML =
    '<div class="mg-top">' +
      '<button class="mg-close" type="button" data-act="exit" aria-label="بستن بازی">✕</button>' +
      '<div class="mg-head"><strong>🎮 بازی‌های کارگاهی</strong><small>MACHINIST ARCADE</small></div>' +
      '<button class="mg-sound" type="button" data-act="sound" aria-label="صدا">🔊</button>' +
    '</div>' +

    // --- ۱) هاب انتخاب بازی ---
    '<div class="mg-hub-view">' +
      '<div class="mg-hub-intro">' +
        '<h3>چالش مهارت و دانش متریال</h3>' +
        '<p>یک بازی را انتخاب کنید و رکورد بزنید!</p>' +
      '</div>' +

      '<button class="mg-hub-card game-cannon" type="button" data-act="open-cannon">' +
        '<div class="mg-hub-icon">🚀</div>' +
        '<div class="mg-hub-info">' +
          '<div class="mg-hub-title">پرتاب به متریال <span class="mg-hub-badge">جدید و سرعتی 🔥</span></div>' +
          '<div class="mg-hub-desc">نشانه بگیر و متریال صحیح را از لابلای موانع متحرک شکار کن!</div>' +
          '<div class="mg-hub-best mc-hub-best">رکورد: ۰</div>' +
        '</div>' +
        '<div class="mg-hub-arrow">‹</div>' +
      '</button>' +

      '<button class="mg-hub-card game-lathe" type="button" data-act="open-lathe">' +
        '<div class="mg-hub-icon">🎯</div>' +
        '<div class="mg-hub-info">' +
          '<div class="mg-hub-title">دقت تراش <span class="mg-hub-badge blue">دقت صدم</span></div>' +
          '<div class="mg-hub-desc">با نگه‌داشتن و تپ‌های میلی‌متری قطعه را داخل تلرانس ببر.</div>' +
          '<div class="mg-hub-best ml-hub-best">رکورد: ۰</div>' +
        '</div>' +
        '<div class="mg-hub-arrow">‹</div>' +
      '</button>' +
    '</div>' +

    // --- ۲) نمای بازی شلیک به متریال (CANNON) ---
    '<div class="mg-game-view mg-cannon-view">' +
      '<div class="mg-subtop">' +
        '<button class="mg-back-hub" type="button" data-act="back-hub">« منوی بازی‌ها</button>' +
        '<span style="font-size:.76rem;color:#f43f5e;font-weight:800;">🚀 پرتاب به متریال</span>' +
      '</div>' +
      '<div class="mc-hud">' +
        '<div class="mc-chip"><span>امتیاز</span><b class="mc-score">0</b></div>' +
        '<div class="mc-chip"><span>مرحله</span><b class="mc-stage">1</b></div>' +
        '<div class="mc-chip"><span>کمبو</span><b class="mc-combo">×1.0</b></div>' +
        '<div class="mg-lives mc-lives" aria-label="جان"><i>❤️</i><i>❤️</i><i>❤️</i></div>' +
      '</div>' +
      '<div class="mc-timer-bar"><div class="mc-timer-fill"></div></div>' +
      '<div class="mc-target-banner">' +
        '<div class="mc-target-hint">🎯 هدف شلیک:</div>' +
        '<div class="mc-target-name">...</div>' +
        '<div class="mc-target-desc">...</div>' +
      '</div>' +
      '<div class="mc-arena-wrap">' +
        '<canvas class="mc-canvas"></canvas>' +
        '<div class="mc-aim-guide">هر مرحله فقط یک شلیک — انگشت را بکشید و رها کنید</div>' +
      '</div>' +
    '</div>' +

    // --- ۳) نمای بازی دقت تراش (LATHE) ---
    '<div class="mg-game-view mg-lathe-view">' +
      '<div class="mg-subtop">' +
        '<button class="mg-back-hub" type="button" data-act="back-hub">« منوی بازی‌ها</button>' +
        '<span style="font-size:.76rem;color:#38bdf8;font-weight:800;">🎯 دقت تراش</span>' +
      '</div>' +
      '<div class="mg-hud">' +
        '<div class="mg-chip"><span>امتیاز</span><b class="mg-score">0</b></div>' +
        '<div class="mg-chip"><span>قطعه</span><b class="mg-part-no">1</b></div>' +
        '<div class="mg-chip"><span>ضریب کمبو</span><b class="mg-combo">×1.0</b></div>' +
        '<div class="mg-lives ml-lives" aria-label="جان"><i>❤️</i><i>❤️</i><i>❤️</i></div>' +
      '</div>' +
      '<div class="mg-job">' +
        '<div class="mg-job-row"><span>متریال</span><b class="mg-mat-name">—</b></div>' +
        '<div class="mg-job-row"><span>قطر هدف</span><b class="mg-target">—</b></div>' +
        '<div class="mg-job-row"><span>براده باقی‌مانده</span><b class="mg-rest">—</b></div>' +
      '</div>' +
      '<div class="mg-machine">' +
        '<div class="mg-bed"></div>' +
        '<div class="mg-chuck"><span></span><span></span><span></span></div>' +
        '<div class="mg-part"></div>' +
        '<div class="mg-tool"></div>' +
        '<div class="mg-chips"></div>' +
      '</div>' +
      '<div class="mg-dro"><span class="mg-dro-label">قطر جاری (mm)</span>' +
        '<b class="mg-dia">Ø0.000</b><span class="mg-dev">—</span></div>' +
      '<div class="mg-bar">' +
        '<div class="mg-zone mg-zone-scrap"></div>' +
        '<div class="mg-zone mg-zone-ok"></div>' +
        '<div class="mg-zone mg-zone-cut"></div>' +
        '<div class="mg-bar-mark"></div>' +
      '</div>' +
      '<div class="mg-legend">' +
        '<span><i class="l-scrap"></i>ضایعات</span>' +
        '<span><i class="l-ok"></i>بازه قبولی</span>' +
        '<span><i class="l-cut"></i>براده</span>' +
      '</div>' +
      '<div class="mg-status">دکمهٔ براده‌برداری را نگه دار یا تپ کوتاه بزن.</div>' +
      '<button class="mg-hold" type="button" data-act="hold">براده‌برداری' +
        '<small>نگه‌داشتن = پیشروی سریع • تپ کوتاه = برداشت ۰٫۰۱ mm</small></button>' +
    '</div>' +

    // لایه پیام‌ها و پاپ‌آپ
    '<div class="mg-overlay" hidden>' +
      '<div class="mg-sheet">' +
        '<h2 class="mg-ov-title"></h2>' +
        '<div class="mg-ov-body"></div>' +
        '<div class="mg-ov-actions mg-sheet-actions"></div>' +
      '</div>' +
    '</div>';

  function isActive() { return !!screen && !screen.hidden && screen.classList.contains('active'); }
  function overlayVisible() { return !!(refs.overlay && !refs.overlay.hidden); }

  function ensureScreen() {
    if (screen) return screen;
    var existing = document.querySelector('.mobile-game');
    if (existing) {
      screen = existing;
    } else {
      var ws = document.querySelector('.workspace');
      if (!ws) return null;
      screen = makeEl('div', 'tool-panel mobile-game');
      screen.dataset.panel = 'mechGame';
      screen.setAttribute('aria-label', 'بازی‌های کارگاهی');
      screen.innerHTML = SCREEN_HTML;
      ws.insertBefore(screen, ws.firstChild);
    }
    collectRefs();
    wireScreen();
    return screen;
  }

  function collectRefs() {
    refs.hubView = screen.querySelector('.mg-hub-view');
    refs.cannonView = screen.querySelector('.mg-cannon-view');
    refs.latheView = screen.querySelector('.mg-lathe-view');
    refs.overlay = screen.querySelector('.mg-overlay');
    refs.ovTitle = screen.querySelector('.mg-ov-title');
    refs.ovBody = screen.querySelector('.mg-ov-body');
    refs.ovActions = screen.querySelector('.mg-ov-actions');
    refs.sound = screen.querySelector('.mg-sound');
    refs.mcHubBest = screen.querySelector('.mc-hub-best');
    refs.mlHubBest = screen.querySelector('.ml-hub-best');

    // مراجع بازی تراش
    lathe.refs.score = screen.querySelector('.mg-score');
    lathe.refs.partNo = screen.querySelector('.mg-part-no');
    lathe.refs.combo = screen.querySelector('.mg-combo');
    lathe.refs.matName = screen.querySelector('.mg-mat-name');
    lathe.refs.target = screen.querySelector('.mg-target');
    lathe.refs.rest = screen.querySelector('.mg-rest');
    lathe.refs.machine = screen.querySelector('.mg-machine');
    lathe.refs.part = screen.querySelector('.mg-part');
    lathe.refs.tool = screen.querySelector('.mg-tool');
    lathe.refs.chipsBox = screen.querySelector('.mg-chips');
    lathe.refs.dro = screen.querySelector('.mg-dro');
    lathe.refs.dia = screen.querySelector('.mg-dia');
    lathe.refs.dev = screen.querySelector('.mg-dev');
    lathe.refs.zScrap = screen.querySelector('.mg-zone-scrap');
    lathe.refs.zOk = screen.querySelector('.mg-zone-ok');
    lathe.refs.zCut = screen.querySelector('.mg-zone-cut');
    lathe.refs.mark = screen.querySelector('.mg-bar-mark');
    lathe.refs.status = screen.querySelector('.mg-status');
    lathe.refs.hold = screen.querySelector('.mg-hold');
    lathe.refs.hearts = Array.prototype.slice.call(screen.querySelectorAll('.ml-lives i'));
    lathe.refs.droClass = 'mg-dro';
    lathe.refs.statusClass = 'mg-status';
    lathe.refs.lastDia = '';

    // مراجع بازی پرتاب متریال
    cannon.refs.score = screen.querySelector('.mc-score');
    cannon.refs.stage = screen.querySelector('.mc-stage');
    cannon.refs.combo = screen.querySelector('.mc-combo');
    cannon.refs.timerFill = screen.querySelector('.mc-timer-fill');
    cannon.refs.targetName = screen.querySelector('.mc-target-name');
    cannon.refs.targetDesc = screen.querySelector('.mc-target-desc');
    cannon.refs.hearts = Array.prototype.slice.call(screen.querySelectorAll('.mc-lives i'));
    cannon.refs.livesHint = screen.querySelector('.mc-aim-guide');
    cannon.refs.arenaWrap = screen.querySelector('.mc-arena-wrap');
    cannon.canvas = screen.querySelector('.mc-canvas');
    if (cannon.canvas && cannon.canvas.getContext) {
      cannon.ctx = cannon.canvas.getContext('2d');
    }

    buildLatheChipPool();
    updateBestLabels();
  }

  function updateBestLabels() {
    var bLathe = storageGet(BEST_KEY_LATHE, '0');
    var bCannon = storageGet(BEST_KEY_CANNON, '0');
    if (refs.mlHubBest) setText(refs.mlHubBest, 'رکورد: ' + bLathe);
    if (refs.mcHubBest) setText(refs.mcHubBest, 'رکورد: ' + bCannon);
  }

  function buildLatheChipPool() {
    if (lathe.chips.length || !lathe.refs.chipsBox) return;
    for (var i = 0; i < CHIP_POOL; i++) {
      var el = makeEl('i', 'mg-chip-p');
      el.style.opacity = '0';
      lathe.refs.chipsBox.appendChild(el);
      lathe.chips.push({ el: el, life: 0, x: 0, y: 0, vx: 0, vy: 0, rot: 0 });
    }
  }

  // ساخت کارت در صفحه اصلی
  function buildHomeCard() {
    var grid = document.querySelector('.mobile-home .mobile-grid');
    if (!grid) return false;
    var old = grid.querySelectorAll('[data-tool="mechGame"]');
    if (old && old.length) return true;
    var quizCard = grid.querySelector('[data-action="programmingQuiz"]');
    var card = makeEl('button', 'm-card c-game');
    card.type = 'button';
    card.dataset.action = 'mechGame';
    card.dataset.tool = 'mechGame';
    card.setAttribute('aria-label', 'بازی‌های کارگاهی');
    card.innerHTML =
      '<span class="m-icon">🎮</span>' +
      '<span class="m-en">Machinist Games</span>' +
      '<span class="m-fa">بازی</span>';
    card.addEventListener('click', function () { openGame(); });
    if (quizCard) grid.insertBefore(card, quizCard);
    else grid.appendChild(card);
    return true;
  }

  function switchView(view) {
    currentView = view;
    if (refs.hubView) refs.hubView.style.display = view === 'hub' ? 'flex' : 'none';
    if (refs.cannonView) {
      if (view === 'cannon') refs.cannonView.classList.add('active');
      else refs.cannonView.classList.remove('active');
    }
    if (refs.latheView) {
      if (view === 'lathe') refs.latheView.classList.add('active');
      else refs.latheView.classList.remove('active');
    }
    updateBestLabels();
    if (view === 'cannon') {
      resizeCannon();
      if (!cannon.session || cannon.session.over) startCannonSession();
    } else if (view === 'lathe') {
      if (!lathe.session || lathe.session.over) startLatheSession();
    }
  }

  function resizeCannon() {
    if (!cannon.canvas || !cannon.refs.arenaWrap) return;
    var rect = cannon.refs.arenaWrap.getBoundingClientRect();
    var w = Math.floor(rect.width) || 320;
    var h = Math.floor(rect.height) || 360;
    var dpr = window.devicePixelRatio || 1;
    cannon.canvas.width = w * dpr;
    cannon.canvas.height = h * dpr;
    if (cannon.ctx) {
      cannon.ctx.setTransform(1, 0, 0, 1, 0, 0);
      cannon.ctx.scale(dpr, dpr);
    }
    cannon.width = w;
    cannon.height = h;
    cannon.cannonPos = { x: w / 2, y: h - 35 };
  }

  // ---------- رویدادهای لمسی و دکمه‌ها ----------
  function wireScreen() {
    if (screenWired) return;
    screenWired = true;

    screen.addEventListener('pointerdown', function (ev) {
      var act = actOf(ev.target);
      if (act === 'hold' || (act === '' && currentView === 'lathe' && lathe.refs.machine && lathe.refs.machine.contains(ev.target))) {
        beginLatheCut();
      }
    });

    if (cannon.refs.arenaWrap) {
      cannon.refs.arenaWrap.addEventListener('pointerdown', function (ev) {
        if (currentView !== 'cannon' || !cannon.session || cannon.session.over || overlayVisible()) return;
        var r = cannon.refs.arenaWrap.getBoundingClientRect();
        var px = ev.clientX - r.left;
        var py = ev.clientY - r.top;
        cannon.aim.active = true;
        cannon.aim.startX = px;
        cannon.aim.startY = py;
        cannon.aim.currX = px;
        cannon.aim.currY = py;
        updateAimMath();
      });
      window.addEventListener('pointermove', function (ev) {
        if (!cannon.aim.active || currentView !== 'cannon') return;
        var r = cannon.refs.arenaWrap.getBoundingClientRect();
        cannon.aim.currX = ev.clientX - r.left;
        cannon.aim.currY = ev.clientY - r.top;
        updateAimMath();
      });
    }

    window.addEventListener('pointerup', function () {
      if (lathe.round && lathe.round.cutting) endLatheCut();
      if (cannon.aim.active) fireCannon();
    });

    window.addEventListener('pointercancel', onGlobalCancel);
    window.addEventListener('blur', onGlobalCancel);
    document.addEventListener('visibilitychange', function () { if (document.hidden) onGlobalCancel(); });
    window.addEventListener('resize', function () { if (currentView === 'cannon') resizeCannon(); });

    screen.addEventListener('click', function (ev) {
      var act = actOf(ev.target);
      if (act === 'open-cannon') { switchView('cannon'); return; }
      if (act === 'open-lathe') { switchView('lathe'); return; }
      if (act === 'back-hub') { switchView('hub'); closeOverlay(); return; }
      if (act === 'sound') { toggleSound(); return; }
      if (act === 'exit') { requestHome(); }
    });

    var observer = new MutationObserver(function () { syncActivation(); });
    observer.observe(screen, { attributes: true, attributeFilter: ['class', 'hidden'] });
  }

  function onGlobalCancel() {
    if (lathe.round && lathe.round.cutting) cancelLatheCut();
    cannon.aim.active = false;
  }

  function actOf(node) {
    var n = node;
    while (n && n !== screen) {
      if (n.dataset && n.dataset.act) return n.dataset.act;
      n = n.parentNode;
    }
    return '';
  }

  // جاذبهٔ ثابت بازی — هم در پرتاب و هم در حرکت توپ استفاده می‌شود
  var CANNON_GRAV = 400;

  // سرعت پرتاب: یک سرعت پایه محاسبه می‌شود تا حتی یک سویپ کوتاه روی توپ
  // هم به ردیف هدف برسد؛ پس همهٔ شلیک‌ها با یک حرکت ساده انجام می‌شود.
  function cannonLaunchSpeed(dist) {
    var launchY = cannon.cannonPos.y || (cannon.height - 35);
    var rise = Math.max(140, launchY - 60);
    var minSpeed = Math.sqrt(2 * CANNON_GRAV * rise) * 1.08;
    return clamp(minSpeed + dist * 1.7, minSpeed, 980);
  }

  function updateAimMath() {
    var dx = cannon.aim.startX - cannon.aim.currX;
    var dy = cannon.aim.startY - cannon.aim.currY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    cannon.aim.power = cannonLaunchSpeed(dist);
    var ang = Math.atan2(-dy, dx);
    cannon.aim.angle = ang;
  }

  function canFireCannon() {
    return !!cannon.session && !cannon.session.over && !overlayVisible() &&
      !cannon.shotUsed && cannon.balls.length === 0;
  }

  function updateCannonAimHint() {
    if (!cannon.refs.livesHint) return;
    setText(cannon.refs.livesHint, cannon.shotUsed
      ? 'شلیک این مرحله انجام شد — توپ در راه است'
      : 'انگشت را روی توپ بکشید و رها کنید');
  }

  function fireCannon() {
    cannon.aim.active = false;
    if (!canFireCannon()) return;
    var dx = cannon.aim.startX - cannon.aim.currX;
    var dy = cannon.aim.startY - cannon.aim.currY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 6) return;

    var speed = cannonLaunchSpeed(dist);
    var angle = Math.atan2(cannon.aim.startY - cannon.aim.currY, cannon.aim.startX - cannon.aim.currX);
    var vx = -Math.cos(angle) * speed;
    var vy = -Math.sin(angle) * speed;
    if (vy > -80) vy = -260;

    cannon.shotUsed = true;
    updateCannonAimHint();
    cannon.balls.push({
      x: cannon.cannonPos.x,
      y: cannon.cannonPos.y,
      vx: vx,
      vy: vy,
      r: 12,
      life: 5,
      trail: []
    });

    beep(420, 0.08, 'square', 0.09);
    vibrate(20);
  }

  // ============================================================
  //   منطق بازی ۲: شلیک به متریال (MATERIAL CANNON)
  // ============================================================
  function startCannonSession() {
    cannon.session = {
      score: 0,
      stage: 1,
      lives: 3,
      combo: 0,
      over: false,
      started: true,
      best: parseInt(storageGet(BEST_KEY_CANNON, '0'), 10) || 0
    };
    initAudio();
    updateCannonHud();
    startNextCannonStage();
    startGlobalLoop();
  }

  function startNextCannonStage() {
    if (!cannon.session) return;
    var st = cannon.session.stage;
    cannon.balls = [];
    cannon.sparks = [];
    // مرحلهٔ تازه = یک شلیک تازه؛ بدون این ریست، شلیک‌های بعدی ثبت نمی‌شدند
    cannon.shotUsed = false;
    updateCannonAimHint();
    cannon.maxTimer = Math.max(7, 16 - st * 0.8);
    cannon.timer = cannon.maxTimer;

    var pool = CANNON_MATERIALS.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    var count = Math.min(pool.length, 3 + Math.floor(st / 3));
    var chosen = pool.slice(0, count);
    var targetMat = chosen[Math.floor(Math.random() * chosen.length)];
    cannon.target = targetMat;

    setText(cannon.refs.targetName, targetMat.name);
    setText(cannon.refs.targetDesc, targetMat.full + ' — ' + targetMat.desc);

    cannon.options = [];
    var w = cannon.width || 320;
    var spacing = w / (chosen.length + 1);
    for (var k = 0; k < chosen.length; k++) {
      var speedX = (k % 2 === 0 ? 1 : -1) * (22 + st * 6 + Math.random() * 12);
      cannon.options.push({
        mat: chosen[k],
        x: spacing * (k + 1),
        y: 45 + (k % 2) * 44,
        vx: speedX,
        r: 32,
        pulse: 0
      });
    }

    cannon.obstacles = [];
    if (st >= 2) {
      var obsCount = Math.min(3, Math.floor(st / 2));
      for (var o = 0; o < obsCount; o++) {
        cannon.obstacles.push({
          x: w * 0.25 + (o * w * 0.35) % (w * 0.7),
          y: 140 + o * 40,
          vx: (o % 2 === 0 ? -1 : 1) * (40 + st * 15),
          w: 48,
          h: 14,
          rot: 0,
          vrot: (o % 2 === 0 ? 2 : -2)
        });
      }
    }

    closeOverlay();
    updateCannonHud();
  }

  function updateCannonHud() {
    if (!cannon.session) return;
    setText(cannon.refs.score, cannon.session.score);
    setText(cannon.refs.stage, cannon.session.stage);
    setText(cannon.refs.combo, '×' + (1 + Math.min(cannon.session.combo, 5) * 0.25).toFixed(1));
    for (var i = 0; i < cannon.refs.hearts.length; i++) {
      cannon.refs.hearts[i].classList.toggle('dead', i >= cannon.session.lives);
    }
  }

  function stepCannon(dt) {
    if (!cannon.session || cannon.session.over || currentView !== 'cannon' || overlayVisible()) return;

    cannon.timer -= dt;
    var pct = clamp(cannon.timer / cannon.maxTimer, 0, 1) * 100;
    if (cannon.refs.timerFill) cannon.refs.timerFill.style.width = pct.toFixed(1) + '%';
    if (cannon.timer <= 0) {
      cannonMiss('time');
      return;
    }

    var w = cannon.width;
    var h = cannon.height;

    for (var i = 0; i < cannon.options.length; i++) {
      var opt = cannon.options[i];
      opt.x += opt.vx * dt;
      if (opt.x - opt.r < 8) { opt.x = 8 + opt.r; opt.vx = Math.abs(opt.vx); }
      if (opt.x + opt.r > w - 8) { opt.x = w - 8 - opt.r; opt.vx = -Math.abs(opt.vx); }
      opt.pulse += dt * 4;
    }

    for (var j = 0; j < cannon.obstacles.length; j++) {
      var obs = cannon.obstacles[j];
      obs.x += obs.vx * dt;
      obs.rot += obs.vrot * dt;
      if (obs.x < 30) { obs.x = 30; obs.vx = Math.abs(obs.vx); }
      if (obs.x > w - 30) { obs.x = w - 30; obs.vx = -Math.abs(obs.vx); }
    }

    for (var b = cannon.balls.length - 1; b >= 0; b--) {
      var ball = cannon.balls[b];
      ball.life -= dt;
      ball.vy += CANNON_GRAV * dt;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 8) ball.trail.shift();

      if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx = -ball.vx * 0.75; }
      if (ball.x + ball.r > w) { ball.x = w - ball.r; ball.vx = -ball.vx * 0.75; }

      for (var ob = 0; ob < cannon.obstacles.length; ob++) {
        var obstacle = cannon.obstacles[ob];
        var ddx = ball.x - obstacle.x;
        var ddy = ball.y - obstacle.y;
        if (Math.abs(ddx) < obstacle.w / 2 + ball.r && Math.abs(ddy) < obstacle.h / 2 + ball.r) {
          ball.vy = -ball.vy * 0.85;
          ball.vx += (Math.random() - 0.5) * 45;
          beep(280, 0.05, 'triangle', 0.06);
          spawnCannonSparks(ball.x, ball.y, '#f59e0b', 5);
        }
      }

      var hit = false;
      for (var op = 0; op < cannon.options.length; op++) {
        var targetOpt = cannon.options[op];
        var dist = Math.hypot(ball.x - targetOpt.x, ball.y - targetOpt.y);
        if (dist < ball.r + targetOpt.r + 8) {
          hit = true;
          onCannonHit(targetOpt);
          break;
        }
      }

      if (hit || ball.life <= 0 || ball.y > h + 20) {
        cannon.balls.splice(b, 1);
        // گلوله بدون اصابت تمم شد → شلیک دوباره آماده می‌شود (قفل نشدن)
        if (!hit) { cannon.shotUsed = false; updateCannonAimHint(); }
      }
    }

    for (var s = cannon.sparks.length - 1; s >= 0; s--) {
      var sp = cannon.sparks[s];
      sp.life -= dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      if (sp.life <= 0) cannon.sparks.splice(s, 1);
    }

    renderCannonCanvas();
  }

  function spawnCannonSparks(x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var a = Math.random() * Math.PI * 2;
      var spd = 60 + Math.random() * 160;
      cannon.sparks.push({
        x: x, y: y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        color: color,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6
      });
    }
  }

  function onCannonHit(opt) {
    if (opt.mat.id === cannon.target.id) {
      cannon.session.combo += 1;
      var mult = 1 + Math.min(cannon.session.combo - 1, 5) * 0.25;
      var pts = Math.round((100 + Math.floor(cannon.timer * 15)) * mult);
      cannon.session.score += pts;
      if (cannon.session.score > cannon.session.best) {
        cannon.session.best = cannon.session.score;
        storageSet(BEST_KEY_CANNON, cannon.session.best);
      }
      spawnCannonSparks(opt.x, opt.y, opt.mat.color, 24);
      sfxOk();
      vibrate([20, 50, 20]);
      cannon.session.stage += 1;
      updateCannonHud();
      updateBestLabels();
      startNextCannonStage();
    } else {
      spawnCannonSparks(opt.x, opt.y, '#ef4444', 16);
      cannonMiss('wrong', opt.mat);
    }
  }

  function cannonMiss(reason, hitMat) {
    cannon.session.combo = 0;
    cannon.session.lives -= 1;
    updateCannonHud();
    sfxFail();
    vibrate([40, 80, 40]);

    if (cannon.session.lives <= 0) {
      cannon.session.over = true;
      var best = cannon.session.best;
      var body =
        '<p class="mg-pts">' + cannon.session.score + '</p>' +
        '<div class="mg-summary">' +
          cell('مرحله رسیده', cannon.session.stage) +
          cell('رکورد شما', best) +
          cell('علت', reason === 'time' ? 'پایان زمان' : 'خطای متریال') +
        '</div>' +
        '<p>' + (cannon.session.score >= best && cannon.session.score > 0
          ? '🎉 رکورد جدید در شلیک به متریال!'
          : 'برای شلیک موفق، مسیر گلوله را دقیق‌تر تنظیم و متریال صحیح را نشانه بگیرید.') + '</p>';
      openSheet('🏁 پایان چالش شلیک', body, [
        { label: 'شروع دوباره', act: 'restart-cannon', style: 'primary' },
        { label: 'منوی بازی‌ها', act: 'back-hub', style: 'ghost' }
      ]);
      return;
    }

    var tip = reason === 'time'
      ? 'زمان شلیک تمام شد! سرعت واکنش مهم است.'
      : 'اشتباه زدی! به متریال ' + (hitMat ? hitMat.name : '') + ' شلیک کردی؛ هدف «' + cannon.target.name + '» بود.';
    openSheet('❌ هدف از دست رفت', '<p class="mg-recieve">' + tip + '<br>یک جان کم شد (جان باقی: ' + cannon.session.lives + ')</p>', [
      { label: 'ادامه چالش', act: 'continue-cannon', style: 'primary' },
      { label: 'منوی بازی‌ها', act: 'back-hub', style: 'ghost' }
    ]);
  }

  function renderCannonCanvas() {
    var ctx = cannon.ctx;
    if (!ctx) return;
    var w = cannon.width;
    var h = cannon.height;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(100, 116, 139, 0.14)';
    ctx.lineWidth = 1;
    for (var x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (var y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    for (var i = 0; i < cannon.options.length; i++) {
      var opt = cannon.options[i];
      var isTarget = opt.mat.id === cannon.target.id;
      ctx.save();
      ctx.translate(opt.x, opt.y);

      ctx.beginPath();
      ctx.arc(0, 0, opt.r + 4 + Math.sin(opt.pulse) * 2, 0, Math.PI * 2);
      ctx.fillStyle = isTarget ? 'rgba(14, 165, 233, 0.22)' : 'rgba(148, 163, 184, 0.16)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, opt.r, 0, Math.PI * 2);
      ctx.fillStyle = opt.mat.color;
      ctx.shadowColor = opt.mat.color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold ' + (opt.mat.name.length > 4 ? 10 : 12) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opt.mat.name, 0, 0);

      ctx.restore();
    }

    for (var j = 0; j < cannon.obstacles.length; j++) {
      var obs = cannon.obstacles[j];
      ctx.save();
      ctx.translate(obs.x, obs.y);
      ctx.rotate(obs.rot);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-obs.w / 2, -obs.h / 2, obs.w, obs.h);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-obs.w / 2, -obs.h / 2, obs.w, obs.h);
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#334155';
      ctx.fill();
      ctx.restore();
    }

    if (cannon.aim.active) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cannon.cannonPos.x, cannon.cannonPos.y);
      var aimLen = clamp(cannon.aim.power * 0.12, 30, 130);
      var endX = cannon.cannonPos.x - Math.cos(cannon.aim.angle) * aimLen;
      var endY = cannon.cannonPos.y - Math.sin(cannon.aim.angle) * aimLen;
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.stroke();

      ctx.fillStyle = 'rgba(244, 63, 94, 0.7)';
      for (var p = 1; p <= 4; p++) {
        var frac = p / 4;
        ctx.beginPath();
        ctx.arc(cannon.cannonPos.x + (endX - cannon.cannonPos.x) * frac,
                cannon.cannonPos.y + (endY - cannon.cannonPos.y) * frac,
                3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(cannon.cannonPos.x, cannon.cannonPos.y);
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#0284c7';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    ctx.restore();

    for (var b = 0; b < cannon.balls.length; b++) {
      var ball = cannon.balls[b];
      for (var t = 0; t < ball.trail.length; t++) {
        var tr = ball.trail[t];
        var alpha = (t + 1) / ball.trail.length * 0.45;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, ball.r * (0.4 + 0.5 * (t / ball.trail.length)), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(244, 63, 94, ' + alpha.toFixed(2) + ')';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }

    for (var s = 0; s < cannon.sparks.length; s++) {
      var sp = cannon.sparks[s];
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = sp.color;
      ctx.fill();
    }
  }

  // ============================================================
  //   منطق بازی ۱: دقت تراش (TOLERANCE MASTER)
  // ============================================================
  function levelConfig(lvl) {
    var m = LATHE_MATERIALS[Math.min(lvl, LATHE_MATERIALS.length - 1)];
    var tol = TOLS[Math.min(lvl, TOLS.length - 1)];
    var nominal = NOMINALS[lvl % NOMINALS.length];
    var allowance = Math.min(0.9 + 0.22 * lvl, 2.4);
    return {
      level: lvl + 1,
      material: m,
      nominal: nominal,
      tol: tol,
      start: roundTo(nominal + allowance, 0.1)
    };
  }

  function newLatheRound(cfg) {
    return {
      cfg: cfg,
      low: roundTo(cfg.nominal - cfg.tol, 0.001),
      high: roundTo(cfg.nominal + cfg.tol, 0.001),
      dia: cfg.start,
      passes: 0,
      held: 0,
      jitter: 0,
      chipAcc: 0,
      cutStart: cfg.start,
      cutting: false,
      startedAt: Date.now(),
      barLo: cfg.start,
      barSpan: 1
    };
  }

  
  function showLatheIntroSheet() {
    var best = storageGet(BEST_KEY_LATHE, '0');
    var body =
      '<p>در نقش یک تراشکار حرفه‌ای، قطر خام قطعه را با براده‌برداری دقیق داخل <b>محدوده مجاز تلرانس</b> برسان.</p>' +
      '<ul class="mg-rules">' +
        '<li><b>نگه‌داشتن دکمه:</b> پیشروی مداوم و سریع برای باربرداری خشن.</li>' +
        '<li><b>تپ‌های کوتاه:</b> باربرداری دقیق به اندازهٔ ۰٫۰۱ mm در پاس آخر.</li>' +
        '<li><b>ضایعات:</b> اگر قطر کمتر از حد پایین شود، قطعه ضایعات شده و یک جان می‌سوزد!</li>' +
        '<li><b>محدودیت پاس:</b> هر قطعه حداکثر ' + MAX_PASSES + ' پاس مجاز دارد.</li>' +
      '</ul>' +
      (best > 0 ? '<p style="text-align:center;color:#0ea5e9;font-weight:700;">رکورد ثبت‌شده شما: ' + best + '</p>' : '');
    openSheet('🎯 دقت تراش', body, [
      { label: 'شروع بازی', act: 'start-lathe', style: 'primary' },
      { label: 'خانه', act: 'home', style: 'ghost' }
    ]);
  }

  function startLatheSession() {
    lathe.session = {
      score: 0,
      level: 0,
      combo: 0,
      bestCombo: 0,
      stars: 0,
      parts: 0,
      lives: MAX_LIVES,
      over: false,
      started: true,
      pending: null,
      best: parseInt(storageGet(BEST_KEY_LATHE, '0'), 10) || 0
    };
    initAudio();
    updateLatheHud();
    startNextLathePart();
    startGlobalLoop();
  }

  function startNextLathePart() {
    if (!lathe.session) return;
    lathe.session.pending = null;
    lathe.round = newLatheRound(levelConfig(lathe.session.level));
    layoutLatheBar();
    updateLatheHud();
    updateLatheJobTexts();
    paintLatheMachine();
    updateLatheDroTexts();
    updateLatheLive();
    setLatheStatus('قطعه ' + (lathe.session.parts + 1) + ': ' + lathe.round.cfg.material.fa + ' — ' +
      fmtTarget(lathe.round.cfg) + '. دکمه را نگه دار و نزدیک بازه، تپ کوتاه بزن.', '');
    closeOverlay();
  }

  function beginLatheCut() {
    var r = lathe.round;
    if (!lathe.session || lathe.session.over || !r || r.cutting) return;
    if (!isActive() || overlayVisible() || currentView !== 'lathe') return;
    initAudio();
    r.cutting = true;
    r.held = 0;
    r.jitter = 0;
    r.cutStart = r.dia;
    lathe.refs.machine.classList.add('cutting');
    lathe.refs.hold.classList.add('running');
    setText(lathe.refs.hold, 'در حال براده‌برداری…');
    setLatheStatus('ابزار در کار است؛ رها کن تا اندازه بگیری.', 'warn');
    sfxBuzz(true);
    vibrate(15);
    startGlobalLoop();
  }

  function endLatheCut() {
    var r = lathe.round;
    if (!r || !r.cutting) return;
    r.cutting = false;
    lathe.refs.machine.classList.remove('cutting');
    lathe.refs.hold.classList.remove('running');
    lathe.refs.tool.style.transform = 'none';
    setText(lathe.refs.hold, 'براده‌برداری');
    sfxBuzz(false);
    r.dia = roundTo(r.dia, RES);
    r.passes += 1;
    paintLatheMachine();
    updateLatheLive();
    evaluateLathe();
  }

  function cancelLatheCut() {
    var r = lathe.round;
    if (!r || !r.cutting) return;
    r.cutting = false;
    if (r.cutStart != null) r.dia = r.cutStart;
    lathe.refs.machine.classList.remove('cutting');
    lathe.refs.hold.classList.remove('running');
    lathe.refs.tool.style.transform = 'none';
    setText(lathe.refs.hold, 'براده‌برداری');
    sfxBuzz(false);
    paintLatheMachine();
    updateLatheLive();
  }

  function evaluateLathe() {
    var r = lathe.round, c = r.cfg;
    if (r.dia < r.low - 1e-9) { loseLatheLife('scrap'); return; }
    if (r.dia <= r.high + 1e-9) { succeedLathe(); return; }
    if (r.passes >= MAX_PASSES) { loseLatheLife('passes'); return; }
    lathe.session.pending = null;
    closeOverlay();
    var rest = r.dia - c.nominal;
    setLatheStatus('اندازه‌گیری: ' + fmtDia(r.dia) + ' — ' + rest.toFixed(2) + ' mm باقی مانده (پاس ' +
      r.passes + ' از ' + MAX_PASSES + '). ' +
      (rest <= c.tol * 2.4 ? 'نزدیک شدی؛ فقط تپ کوتاه بزن.' : 'پاس بعد را با احتیاط بردار.'),
      rest <= c.tol * 2.4 ? 'warn' : '');
  }

  function succeedLathe() {
    var r = lathe.round, c = r.cfg;
    var err = Math.abs(r.dia - c.nominal);
    var ratio = err / c.tol;
    var stars = ratio <= 0.3 ? 3 : (ratio <= 0.65 ? 2 : 1);
    var base = stars === 3 ? 120 : (stars === 2 ? 80 : 50);
    var secs = Math.max(0.5, (Date.now() - r.startedAt) / 1000);
    var speedBonus = Math.max(0, Math.round(45 - secs * 3));
    var effBonus = Math.max(0, 40 - (r.passes - 1) * 12);
    lathe.session.combo += 1;
    if (lathe.session.combo > lathe.session.bestCombo) lathe.session.bestCombo = lathe.session.combo;
    var mult = 1 + Math.min(lathe.session.combo - 1, 5) * 0.2;
    var pts = Math.round((base + speedBonus + effBonus) * mult);
    lathe.session.score += pts;
    lathe.session.parts += 1;
    lathe.session.stars += stars;
    lathe.session.level += 1;
    if (lathe.session.score > lathe.session.best) {
      lathe.session.best = lathe.session.score;
      storageSet(BEST_KEY_LATHE, lathe.session.best);
    }
    updateLatheHud();
    updateBestLabels();
    sfxOk();
    vibrate([12, 45, 12]);
    lathe.session.pending = { type: 'part', a: [stars, pts, err, secs] };
    renderLathePending();
  }

  function loseLatheLife(kind) {
    lathe.session.combo = 0;
    lathe.session.lives -= 1;
    updateLatheHud();
    sfxFail();
    vibrate([28, 60, 28]);
    if (lathe.session.lives <= 0) {
      lathe.session.over = true;
      lathe.session.pending = { type: 'over', a: [kind] };
      renderLathePending();
      return;
    }
    lathe.session.pending = { type: 'miss', a: [kind] };
    renderLathePending();
  }

  function setLatheStatus(text, kind) {
    var cls = 'mg-status' + (kind ? ' ' + kind : '');
    if (lathe.refs.statusClass !== cls) {
      lathe.refs.statusClass = cls;
      lathe.refs.status.className = cls;
    }
    setText(lathe.refs.status, text);
  }

  function updateLatheHud() {
    if (!lathe.session) return;
    setText(lathe.refs.score, lathe.session.score);
    setText(lathe.refs.partNo, lathe.session.parts + 1);
    setText(lathe.refs.combo, '×' + (1 + Math.min(lathe.session.combo, 5) * 0.2).toFixed(1));
    for (var i = 0; i < lathe.refs.hearts.length; i++) {
      lathe.refs.hearts[i].classList.toggle('dead', i >= lathe.session.lives);
    }
  }

  function updateLatheJobTexts() {
    if (!lathe.round) return;
    setText(lathe.refs.matName, lathe.round.cfg.material.fa + ' (' + lathe.round.cfg.material.en + ')');
    setText(lathe.refs.target, fmtTarget(lathe.round.cfg));
  }

  function updateLatheDroTexts() {
    if (!lathe.round) return;
    var rest = lathe.round.dia - lathe.round.cfg.nominal;
    setText(lathe.refs.rest, rest <= 0 ? '۰ (داخل بازه)' : rest.toFixed(2) + ' mm');
  }

  function layoutLatheBar() {
    if (!lathe.round) return;
    var c = lathe.round.cfg;
    var lo = lathe.round.low - c.tol;
    var span = Math.max(0.001, c.start - lo);
    lathe.round.barLo = lo;
    lathe.round.barSpan = span;
    var wScrap = (c.tol / span) * 100;
    var wOk = (2 * c.tol / span) * 100;
    var wCut = Math.max(0, 100 - wScrap - wOk);
    lathe.refs.zScrap.style.width = wScrap.toFixed(2) + '%';
    lathe.refs.zOk.style.left = wScrap.toFixed(2) + '%';
    lathe.refs.zOk.style.width = wOk.toFixed(2) + '%';
    lathe.refs.zCut.style.left = (wScrap + wOk).toFixed(2) + '%';
    lathe.refs.zCut.style.width = wCut.toFixed(2) + '%';
  }

  function paintLatheMachine() {
    if (!lathe.round) return;
    var h = clamp(lathe.round.dia * PPM, 12, 100);
    lathe.refs.part.style.height = h.toFixed(1) + 'px';
    lathe.refs.part.style.marginTop = (-h / 2).toFixed(1) + 'px';
    lathe.refs.tool.style.top = 'calc(50% + ' + (h / 2 - 2).toFixed(1) + 'px)';
  }

  function updateLatheLive() {
    if (!lathe.round) return;
    var s = fmtDia(lathe.round.dia);
    if (s !== lathe.refs.lastDia) {
      lathe.refs.lastDia = s;
      setText(lathe.refs.dia, s);
    }
    var pos = clamp((lathe.round.dia - lathe.round.barLo) / lathe.round.barSpan, 0, 1);
    lathe.refs.mark.style.left = (pos * 100).toFixed(2) + '%';
    var inBand = lathe.round.dia <= lathe.round.high + 1e-9 && lathe.round.dia >= lathe.round.low - 1e-9;
    var cls = 'mg-dro' + (inBand ? ' inband' : (lathe.round.dia - lathe.round.cfg.nominal <= lathe.round.cfg.tol * 2.4 ? ' near' : ''));
    if (lathe.refs.droClass !== cls) {
      lathe.refs.droClass = cls;
      lathe.refs.dro.className = cls;
    }
    setText(lathe.refs.dev, inBand ? 'داخل بازه ✅' : (lathe.round.dia > lathe.round.high ? '+' + (lathe.round.dia - lathe.round.cfg.nominal).toFixed(3) + ' باقی' : 'زیر بازه ⚠'));
    updateLatheDroTexts();
  }

  function stepLathe(dt) {
    if (!lathe.session || lathe.session.over || currentView !== 'lathe' || overlayVisible()) return;
    var r = lathe.round;
    if (r && r.cutting) {
      r.held += dt;
      r.jitter = clamp(r.jitter + (Math.random() - 0.5) * 1.8 * dt, -1, 1);
      var ramp = FINE + (1 - FINE) * Math.min(1, r.held / HOLD_RAMP);
      var rate = r.cfg.material.feed * ramp * (1 + r.cfg.material.noise * r.jitter * 2);
      if (rate < 0.02) rate = 0.02;
      r.dia = Math.max(0, r.dia - rate * dt);
      paintLatheMachine();
      r.chipAcc += dt;
      while (r.chipAcc >= 0.075) {
        r.chipAcc -= 0.075;
        spawnLatheChip();
      }
      lathe.refs.tool.style.transform = 'translateX(' + (Math.random() * 2.2 - 1.1).toFixed(1) + 'px)';
    }
    updateLatheChips(dt);
    updateLatheLive();
  }

  function spawnLatheChip() {
    var c = null;
    for (var i = 0; i < lathe.chips.length; i++) {
      if (lathe.chips[i].life <= 0) { c = lathe.chips[i]; break; }
    }
    if (!c) return;
    c.life = CHIP_LIFE;
    c.x = 6 + Math.random() * 14;
    c.y = (Math.random() - 0.5) * 4;
    c.vx = (Math.random() < 0.55 ? -1 : 1) * (28 + Math.random() * 70);
    c.vy = -(38 + Math.random() * 85);
    c.rot = (Math.random() - 0.5) * 200;
  }

  function updateLatheChips(dt) {
    for (var i = 0; i < lathe.chips.length; i++) {
      var c = lathe.chips[i];
      if (c.life <= 0) continue;
      c.life -= dt;
      c.vy += 250 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.life <= 0) { c.el.style.opacity = '0'; }
      else {
        var k = clamp(c.life / CHIP_LIFE, 0, 1);
        c.el.style.opacity = k.toFixed(2);
        c.el.style.transform = 'translate(' + c.x.toFixed(1) + 'px,' + c.y.toFixed(1) + 'px) rotate(' +
          (c.rot + c.x * 1.6).toFixed(0) + 'deg)';
      }
    }
  }

  function renderLathePending() {
    var p = lathe.session && lathe.session.pending;
    if (!p) return;
    if (p.type === 'intro') showLatheIntroSheet(); else if (p.type === 'part') showLathePartSheet(p.a[0], p.a[1], p.a[2], p.a[3]);
    else if (p.type === 'miss') showLatheMissSheet(p.a[0]);
    else if (p.type === 'over') showLatheOverSheet(p.a[0]);
  }

  function showLathePartSheet(stars, pts, err, secs) {
    var starStr = (stars === 3 ? '★★★' : (stars === 2 ? '★★☆' : '★☆☆'));
    var body = '<div class="mg-stars">' + starStr + '</div>' +
      '<p class="mg-pts">+' + pts + '</p>' +
      '<div class="mg-summary">' +
        cell('قطر نهایی', fmtDia(lathe.round.dia)) +
        cell('خطا از اسمی', err.toFixed(3) + ' mm') +
        cell('زمان', secs.toFixed(1) + ' s') +
      '</div>' +
      '<p>قطعه داخل تلرانس <b>' + fmtTarget(lathe.round.cfg) + '</b> قبول شد. قطعهٔ بعد: متریال سخت‌تر.</p>';
    openSheet('✅ قطعه قبول شد', body, [
      { label: 'قطعهٔ بعدی', act: 'next-lathe', style: 'primary' },
      { label: 'منوی بازی‌ها', act: 'back-hub', style: 'ghost' }
    ]);
  }

  function showLatheMissSheet(kind) {
    var isScrap = kind === 'scrap';
    var body = '<p class="mg-recieve">' + (isScrap
      ? 'قطر به <b>' + fmtDia(lathe.round.dia) + '</b> رسید ولی حد مجاز <b>' + fmtDia(lathe.round.low) + '</b> بود؛ قطعه ضایعات شد.'
      : 'با ' + MAX_PASSES + ' پاس به اندازه نرسیدی (قطر <b>' + fmtDia(lathe.round.dia) + '</b>)؛ یک جان کم شد.') +
      '</p>' +
      '<div class="mg-summary">' +
        cell('قطر فعلی', fmtDia(lathe.round.dia)) +
        cell('بازه مجاز', lathe.round.low.toFixed(2) + ' … ' + lathe.round.high.toFixed(2)) +
        cell('جان باقی', lathe.session.lives) +
      '</div>';
    openSheet(isScrap ? '❌ ضایعات!' : '⏱ پاس اضافه', body, [
      { label: 'تلاش بعدی', act: 'next-lathe', style: 'primary' },
      { label: 'منوی بازی‌ها', act: 'back-hub', style: 'ghost' }
    ]);
  }

  function showLatheOverSheet(kind) {
    var body =
      '<p class="mg-pts">' + lathe.session.score + '</p>' +
      '<div class="mg-summary">' +
        cell('قطعه قبول', lathe.session.parts) +
        cell('ستاره‌ها', lathe.session.stars) +
        cell('رکورد', lathe.session.best) +
      '</div>' +
      '<p>' + (lathe.session.score >= lathe.session.best && lathe.session.score > 0
        ? '🎉 رکورد جدید در دقت تراش!'
        : 'برای زدن رکورد ' + lathe.session.best + '، پاس‌های کمتر بردار و به مرکز تلرانس بزن.') + '</p>';
    openSheet('🏁 پایان شیفت', body, [
      { label: 'بازی مجدد', act: 'restart-lathe', style: 'primary' },
      { label: 'منوی بازی‌ها', act: 'back-hub', style: 'ghost' }
    ]);
  }

  // ============================================================
  //   سیستم پنجره‌ها و مشترکات
  // ============================================================
  function cell(lbl, val) { return '<div><span>' + lbl + '</span><b>' + val + '</b></div>'; }

  function openSheet(title, bodyHtml, buttons) {
    if (!refs.overlay) return;
    setText(refs.ovTitle, title);
    refs.ovBody.innerHTML = bodyHtml;
    refs.ovActions.className = 'mg-ov-actions mg-sheet-actions' + (buttons.length === 1 ? ' single' : '');
    refs.ovActions.innerHTML = '';
    for (var i = 0; i < buttons.length; i++) {
      (function (b) {
        var btn = makeEl('button', 'mg-btn ' + (b.style || 'primary'), b.label);
        btn.type = 'button';
        btn.addEventListener('click', function () { onSheetAction(b.act); });
        refs.ovActions.appendChild(btn);
      })(buttons[i]);
    }
    refs.overlay.hidden = false;
  }

  function closeOverlay() { if (refs.overlay) refs.overlay.hidden = true; }

  function onSheetAction(act) {
    if (act === 'restart-cannon') { startCannonSession(); return; }
    if (act === 'continue-cannon') { closeOverlay(); cannon.shotUsed = false; updateCannonAimHint(); return; }
    if (act === 'start-lathe' || act === 'restart-lathe') { startLatheSession(); return; }
    if (act === 'next-lathe') { startNextLathePart(); return; }
    if (act === 'back-hub') { switchView('hub'); closeOverlay(); return; }
    if (act === 'home') { requestHome(); }
  }

  // ---------- صداگذاری (WebAudio) ----------
  function initAudio() {
    if (muted) return;
    if (audio) {
      try { if (audio.state === 'suspended' && audio.resume) audio.resume(); } catch (e) { }
      return;
    }
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      audio = new Ctx();
      var osc = audio.createOscillator();
      var gain = audio.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 58;
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start();
      lathe.refs.buzzOsc = osc;
      lathe.refs.buzzGain = gain;
    } catch (e) { audio = null; }
  }

  function sfxBuzz(on) {
    if (!audio || !lathe.refs.buzzGain) return;
    try {
      var nowTime = audio.currentTime;
      var g = lathe.refs.buzzGain.gain;
      if (g.cancelScheduledValues) g.cancelScheduledValues(nowTime);
      if (g.linearRampToValueAtTime) g.linearRampToValueAtTime(on ? 0.045 : 0, nowTime + 0.06);
      else g.value = on ? 0.045 : 0;
    } catch (e) { }
  }

  function beep(freq, dur, type, vol) {
    if (!audio || muted) return;
    try {
      var osc = audio.createOscillator();
      var g = audio.createGain();
      var t = audio.currentTime;
      osc.type = type || 'triangle';
      osc.frequency.value = freq;
      g.gain.value = 0;
      osc.connect(g);
      g.connect(audio.destination);
      g.gain.linearRampToValueAtTime(vol || 0.07, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    } catch (e) { }
  }

  function sfxOk() { beep(880, 0.10); setTimeout(function () { beep(1320, 0.18); }, 80); }
  function sfxFail() { beep(170, 0.20, 'sawtooth', 0.09); setTimeout(function () { beep(110, 0.26, 'sawtooth', 0.09); }, 130); }

  function updateSoundBtn() { setText(refs.sound, muted ? '🔇' : '🔊'); }

  function toggleSound() {
    muted = !muted;
    storageSet(MUTE_KEY, muted ? '1' : '0');
    if (!muted) { initAudio(); beep(660, 0.08); } else { sfxBuzz(false); }
    updateSoundBtn();
  }

  // ---------- حلقه ۶۰ فریم بر ثانیه ----------
  function startGlobalLoop() {
    if (globalRaf) return;
    lastTs = 0;
    globalRaf = requestAnimationFrame(globalStep);
  }

  function stopGlobalLoop() {
    if (globalRaf) { cancelAnimationFrame(globalRaf); globalRaf = 0; }
    lastTs = 0;
  }

  function globalStep(ts) {
    globalRaf = 0;
    if (!isActive()) return;
    var dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0;
    lastTs = ts;

    if (dt > 0) {
      if (currentView === 'cannon') stepCannon(dt);
      else if (currentView === 'lathe') stepLathe(dt);
    }

    globalRaf = requestAnimationFrame(globalStep);
  }

  // ---------- باز و بسته کردن صفحه بازی ----------
  function openGame() {
    ensureScreen();
    if (!screen) return;
    var panels = document.querySelectorAll('.tool-panel');
    for (var i = 0; i < panels.length; i++) { panels[i].hidden = true; panels[i].classList.remove('active'); }
    var home = document.querySelector('.mobile-home');
    if (home) home.style.display = 'none';
    var extras = document.querySelectorAll('.home-spacer-card, .seo-intro');
    for (var j = 0; j < extras.length; j++) extras[j].hidden = true;
    var welcome = document.querySelector('#welcomeCard');
    if (welcome) welcome.style.display = 'none';
    var notes = document.querySelectorAll('.notes-card');
    for (var n = 0; n < notes.length; n++) { notes[n].style.display = 'none'; notes[n].classList.remove('active'); }
    var tabs = document.querySelectorAll('.mobile-tabbar .tab');
    for (var t = 0; t < tabs.length; t++) tabs[t].classList.remove('active');

    screen.hidden = false;
    screen.classList.add('active');
    screen.classList.remove('mobile-page-enter');
    void screen.offsetWidth;
    screen.classList.add('mobile-page-enter');
    setTimeout(function () { if (screen) screen.classList.remove('mobile-page-enter'); }, 450);
    window.scrollTo(0, 0);

    closeOverlay();
    switchView('hub');
    syncActivation();
  }

  function requestHome() {
    var tab = document.querySelector('.mobile-tabbar .tab[data-action="home"]');
    if (tab && typeof tab.click === 'function') { tab.click(); return; }
    if (screen) { screen.classList.remove('active'); screen.hidden = true; closeOverlay(); }
    syncActivation();
  }

  function syncActivation() {
    if (!screen) return;
    if (isActive()) {
      muted = storageGet(MUTE_KEY, '0') === '1';
      updateSoundBtn();
      updateBestLabels();
      startGlobalLoop();
    } else {
      stopGlobalLoop();
      cancelLatheCut();
      closeOverlay();
    }
  }

  // ---------- راه‌اندازی ----------
  function init() {
    if (!document.body.classList.contains('capacitor-mobile')) return;
    ensureScreen();
    var cardOk = buildHomeCard();
    if (!cardOk) {
      var tries = 0;
      var waiter = setInterval(function () {
        tries += 1;
        cardOk = cardOk || buildHomeCard();
        if (cardOk || tries >= 40) clearInterval(waiter);
      }, 250);
    }
    syncActivation();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.MachinistGame = {
    open: function () { openGame(); },
    home: function () { requestHome(); },
    switchView: function (v) { switchView(v); },
    state: function () {
      var lRound = lathe.round;
      var lSess = lathe.session;
      var cSess = cannon.session;
      return {
        active: isActive(),
        view: currentView,
        started: currentView === 'cannon' ? !!(cSess && cSess.started) : !!(lSess && lSess.started),
        over: currentView === 'cannon' ? !!(cSess && cSess.over) : !!(lSess && lSess.over),
        score: currentView === 'cannon' ? (cSess ? cSess.score : 0) : (lSess ? lSess.score : 0),
        lives: currentView === 'cannon' ? (cSess ? cSess.lives : 3) : (lSess ? lSess.lives : MAX_LIVES),
        level: lSess ? lSess.level + 1 : 1,
        combo: currentView === 'cannon' ? (cSess ? cSess.combo : 0) : (lSess ? lSess.combo : 0),
        parts: lSess ? lSess.parts : 0,
        best: lSess ? lSess.best : (parseInt(storageGet(BEST_KEY_LATHE, '0'), 10) || 0),
        dia: lRound ? lRound.dia : null,
        low: lRound ? lRound.low : null,
        high: lRound ? lRound.high : null,
        passes: lRound ? lRound.passes : 0,
        cutting: !!(lRound && lRound.cutting),
        overlay: overlayVisible(),
        cannonTarget: cannon.target ? cannon.target.name : null,
        cannonBalls: cannon.balls.length,
        cannonShotUsed: !!cannon.shotUsed
      };
    }
  };
})();
