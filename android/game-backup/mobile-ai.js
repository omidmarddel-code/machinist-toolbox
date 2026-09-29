// ===== Machinist Toolbox — دستیار هوش مصنوعی (AI Assistant) =====
// فقط نسخه اندروید: پرسش متنی → پاسخ متنی، بدون ریلود و بدون ترک اپ.
// سرویس: Pollinations — رایگان، بدون کلید API، سازگار با OpenAI و دارای CORS باز.
(function () {
  'use strict';

  // فقط داخل اپ اندروید فعال شود (نسخه وب دست‌نخورده می‌ماند)
  if (!document.body || !document.body.classList.contains('capacitor-mobile')) return;

  // ---------- تنظیمات ----------
  var API_POST_URL = 'https://text.pollinations.ai/openai';
  var API_GET_URL = 'https://text.pollinations.ai/';
  var REFERRER = 'machinist-toolbox';
  var MODEL_FAST = 'openai-fast';   // مسیر اصلی (مدل رایگان و سریع)
  var MODEL_MAIN = 'openai';        // مسیر دوم (مدل کامل‌تر)
  var TIMEOUT_MS = 75000;           // سقف انتظار برای کل زنجیره
  var MAX_INPUT = 800;
  var MAX_CONTEXT = 12;             // پیام‌هایی که به مدل فرستاده می‌شود
  var MAX_STORED = 60;              // پیام‌های نگه‌داری‌شده در حافظه
  var STORE_KEY = 'machinistAiChat';
  var PANEL_KEY = 'aiChat';

  // ---------- تنظیمات تصویر (عکس نقشه/قطعه) ----------
  // نکتهٔ مهم: تنها مدل رایگان این سرویس (gpt-oss-20b) فقط «متن» می‌گیرد و
  // تصویر را بی‌صدا نادیده می‌گیرد. پس عکس هرگز مستقیم به مدل فرستاده نمی‌شود؛
  // فقط متنی که OCR روی خود گوشی از عکس خوانده به او داده می‌شود.
  var VISION_ENABLED = false;       // ارسال مستقیم تصویر به مدل (عمداً خاموش)
  var OCR_MIN_CONFIDENCE = 45;      // زیر این درصد، متن OCR قابل اعتماد نیست
  var OCR_MAX_CHARS = 2400;         // سقف متن OCR که به مدل داده می‌شود

  var IMG_MAX_SIDE = 1600;          // بزرگ‌ترین ضلع بعد از فشرده‌سازی (خوانایی بهتر نقشه)
  var IMG_MAX_CHARS = 900 * 1024;   // سقف حجم رشتهٔ base64 که به سرور می‌رود
  var IMG_THUMB_SIDE = 240;         // اندازهٔ تصویر بندانگشتی که در تاریخچهٔ گفتگو ذخیره می‌شود
  var IMG_MAX_FULL = 2;             // چند تصویر با کیفیت کامل در حافظهٔ همان نشست نگه داشته شود
  var MAX_STORED_IMAGES = 6;        // چند تصویر بندانگشتی در تاریخچهٔ گفتگو ذخیره شود

  // پیام‌های آماده وقتی OCR چیزی درنیاورد (به‌جای اینکه مدل توهم بزند)
  var IMG_OCR_EMPTY =
    'متنی از این عکس خوانده نشد؛ بنابراین نمی‌توانم چیزی دربارهٔ آن بگویم و عددی هم از خودم نمی‌سازم.\n\n' +
    'برای اینکه بتوانم کمک کنم، یکی از این کارها را بکن:\n' +
    '• عکس را از روبه‌رو، با نور کافی و بدون سایه بگیر.\n' +
    '• اگر نقشهٔ کاغذی است، یک اسکرین‌شات تمیز یا عکس صاف از آن بفرست (بدون زاویه و بدون چروک).\n' +
    '• یا اندازه‌های اصلی را دستی بنویس؛ مثلاً «قطر ۴۰، تلرانس h7، جنس CK45».\n' +
    'اگر سؤال دیگری هم داری، بپرس.';
  var IMG_OCR_WEAK =
    'متن این عکس خیلی ناخوانا بود و فقط چند عدد از آن تشخیص داده شد؛ بنابراین نمی‌توانم نقشه را دقیق بخوانم و عددی از خودم نمی‌سازم.\n\n' +
    'بهتر است عکس را صاف‌تر و پرنورتر بگیری، یا اندازه‌های اصلی را دستی بنویس تا برایت محاسبه کنم.';

  // ---------- شخصیت و قواعد دستیار ----------
  var SYSTEM_PROMPT = [
    'تو «دستیار هوشمند ماشین‌کاری» اپلیکیشن Machinist Toolbox هستی؛ متخصص تراشکاری و فرزکاری CNC،',
    'ابزارشناسی، کدهای G و M فانوک، متریال‌شناسی، نقشه‌خوانی، محاسبات کارگاهی (سرعت برش، پیشروی، تلرانس، رزوه) و جوشکاری.',
    'قواعد پاسخ:',
    '۱) همیشه و فقط فارسی پاسخ بده و اصطلاحات فنی لاتین را در پرانتز نگه دار (مثال: G96، SS304، Ø).',
    '۲) پاسخ کوتاه، دقیق و مرحله‌به‌مرحله باشد؛ حداکثر ۸ خط مگر اینکه کاربر جزئیات بیشتری بخواهد.',
    '۳) هر عدد را با واحد بنویس (mm، rpm، m/min، mm/rev) و فرمول را واضح بنویس.',
    '۴) کد G-code را در بلوک کد بگذار.',
    '۵) اگر پرسش دربارهٔ مقادیر ایمنی، گشتاور یا تلرانس بحرانی بود، یادآوری کن مرجع نهایی دفترچهٔ سازندهٔ ماشین و استاندارد کارگاهی است.',
    '۶) اگر مطمئن نیستی صریح بگو «مطمئن نیستم» و حدس خطرناک نزن.',
    '۷) مفاهیم شبیه به هم را با هم قاطی نکن؛ تعریف هر کدام را جدا و درست بنویس.',
    'دانش پایهٔ تضمین‌شده (این‌ها را دقیق به کار ببر):',
    '- G96 = سرعت برش ثابت (CSS)؛ S در حالت متریک بر حسب m/min است و کنترل، دور (rpm) را با تغییر قطر طوری تنظیم می‌کند که سرعت سطحی ثابت بماند.',
    '- G97 = دور ثابت اسپیندل؛ S بر حسب rpm است و سرعت سطحی با تغییر قطر تغییر می‌کند (حالت پیش‌فرض سوراخ‌کاری، قلاویززنی و رزوه‌زنی).',
    '- G50 سقف دور اسپیندل را تعیین می‌کند و باید پیش از G96 نوشته شود؛ نزدیک مرکز قطعه (X0) دور بالا می‌رود و باید به G97 برگشت.',
    '- G98 = پیشروی بر حسب mm/min و G99 = پیشروی بر حسب mm/rev (شرط لازم رزوهٔ تمیز).',
    '- G70 پرداخت‌کاری، G71 براده‌برداری و G76 رزوه‌زنی (سیکل‌های تراش فانوک)؛ G20 اینچ و G21 میلی‌متر.',
    '- M03 گردش راستگرد، M04 چپگرد، M05 توقف اسپیندل، M08 روشن و M09 خاموش‌کردن خنک‌کار.'
  ].join('\n');
  // قواعد تصویر — نکتهٔ کلیدی: مدل متنی است و عکس را نمی‌بیند؛ فقط متنِ
  // خوانده‌شده از عکس را می‌گیرد. نباید وانمود کند چیزی می‌بیند.
  SYSTEM_PROMPT += '\n' + [
    'قواعد تصویر (وقتی کاربر عکس می‌فرستد):',
    'تو تصویر را نمی‌بینی. فقط متنی که از روی عکس با OCR خوانده شده به تو داده می‌شود. پس:',
    '۸) هرگز نگو «در تصویر می‌بینم» یا «تصویر را می‌بینم». تو فقط متن داری.',
    '۹) اگر متن خوانده‌شده خالی بود، صریح بگو متنی از عکس خوانده نشد و راهنمایی کن عکس را صاف‌تر و پرنورتر بگیرد.',
    '۱۰) اگر متن کم یا ناخوانا بود، همان چیزی را که واقعاً خوانده شده بگو و باقی را نامشخص اعلام کن.',
    '۱۱) فقط اعدادی را به‌عنوان واقعیت بگو که در متن آمده‌اند. هیچ عددی از خودت نساز و حدس نزن.',
    '۱۲) اگر متن شامل اندازه‌ها بود، آن‌ها را جدا فهرست کن: اندازه‌های کلی، تلرانس (مثل Ø40 -0.02/+0.01)، رزوه (M10×1.5)، شعاع (R)، پخ (C)، جنس، زبری (Ra).',
    '۱۳) اگر متن کافی نبود برای پاسخ، باز هم سؤال کاربر را با دانش عمومی ماشین‌کاری تا حد ممکن راهنمایی کن و بگو کدام بخش را از عکس نتوانستی بخوانی.'
  ].join('\n');



  // ---------- پرسش‌های پیشنهادی (وقتی گفتگو خالی است) ----------
  var SUGGESTIONS = [
    'فرق G96 با G97 در تراش CNC چیه؟',
    'برای تراش فولاد CK45 سرعت برش و پیشروی پیشنهادی چنده؟',
    'فرمول محاسبهٔ عمق رزوهٔ M10×1.5 چیست؟',
    'برای فرزکاری آلومینیوم 6061 چه ابزار و پارامترهایی مناسب است؟'
  ];
  // ---------- دانش داخلی اپ: پاسخ تضمینی حتی بدون اینترنت ----------
  // (کاربر خواست هوش مصنوعی «همیشه در دسترس» باشد؛ این بخش آفلاین کار می‌کند)
  var LOCAL_KB = [
    {
      k: ['g96', 'g97', 'css', 'سرعت سطح', 'سرعت برش ثابت', 'دور ثابت'],
      q: 'فرق G96 با G97 چیست؟',
      a: 'G96 = سرعت برش ثابت (CSS):\n• S بر حسب m/min است و کنترل، دور را با تغییر قطر طوری تنظیم می‌کند که سرعت سطحی ثابت بماند.\n• دور (rpm) = (1000 × Vc) ÷ (π × D)\n• پیش از آن سقف دور بگذار: G50 S...\n• نزدیک مرکز قطعه (X0) دور خیلی بالا می‌رود؛ قبل از رسیدن به آن به G97 برگرد.\n\nG97 = دور ثابت اسپیندل:\n• S بر حسب rpm و مستقل از قطر.\n• حالت پیش‌فرض سوراخ‌کاری، قلاویززنی و رزوه‌زنی.\n\n```\nG50 S2000;\nG96 S180 M03;   (سرعت سطح 180 m/min)\n...\nG97 S900 M03;   (برگشت به دور ثابت)\n```'
    },
    {
      k: ['g50', 'سقف دور', 'محدودیت دور'],
      q: 'G50 چه کاری می‌کند؟',
      a: 'G50 سقف دور اسپیندل را تعیین می‌کند (فقط در حالت G96 معنا دارد):\n• باید پیش از دستور G96 نوشته شود.\n• اگر سقف نگذاری، نزدیک مرکز قطعه دور تا بی‌نهایت بالا می‌رود و خطرناک است.\n\n```\nG50 S2000;\nG96 S180 M03;\n```\nنکته: در بعضی کنترل‌ها این دستور G92 یا «Max Spindle Speed» در تنظیمات است.'
    },
    {
      k: ['g98', 'g99', 'پیشروی', 'mm/rev', 'رزوه تمیز'],
      q: 'فرق G98 و G99 چیست؟',
      a: 'G98 = پیشروی بر حسب mm/min (زمان‌بندی مستقل از دور).\nG99 = پیشروی بر حسب mm/rev (پیشروی به ازای هر دور).\n\n• رزوه‌زنی و قلاویززنی باید با G99 باشد، وگرنه گام رزوه به‌هم می‌ریزد.\n• پیشروی (mm/min) = f × n  (f بر حسب mm/rev و n دور اسپیندل)\n\n```\nG99;          (پیشروی بر حسب mm/rev)\nG01 X55.0 Z-30.0 F0.25;\n```'
    },
    {
      k: ['g70', 'g71', 'g76', 'سیکل تراش', 'براده‌برداری', 'پرداخت‌کاری'],
      q: 'سیکل‌های G70، G71 و G76 چه کاری می‌کنند؟',
      a: 'G71 = براده‌برداری (خشن‌کاری) پروفیل — با تعیین عمق براده (U) و مقدار برداشت (W).\nG70 = پرداخت‌کاری نهایی همان پروفیل (با پیشروی ریزتر).\nG76 = سیکل رزوه‌زنی چند پاسه.\n\nترتیب کار: G71 → (اختیاری G70) → G76\n\n```\nG71 U1.5 R0.5;\nG71 P10 Q20 U0.4 W0.1 F0.25;\nG70 P10 Q20 F0.12;\n```\nنکته: شماره‌های N (اینجا N10 و N20) شروع و پایان پروفیل را تعیین می‌کنند.'
    },
    {
      k: ['m03', 'm04', 'm05', 'm08', 'm09', 'خنک‌کار', 'اسپیندل'],
      q: 'کدهای M پرکاربرد چه هستند؟',
      a: 'M03 = گردش اسپیندل راست‌گرد (پیش‌فرض اکثر کارها)\nM04 = گردش چپ‌گرد\nM05 = توقف اسپیندل\nM08 = روشن‌کردن خنک‌کار (آب‌صابون)\nM09 = خاموش‌کردن خنک‌کار\nM30 = پایان برنامه و برگشت به ابتدا\nM00 = توقف برنامه\n\n```\nT0101;\nG97 S900 M03;\nM08;\nG01 X55.0 Z-30.0 F0.25;\nM09;\nM05;\nM30;\n```'
    },
    {
      k: ['سرعت برش', 'vc', 'rpm', 'دور اسپیندل', 'ck45', 'st37', 'آلومینیوم', '6061'],
      q: 'سرعت برش و دور اسپیندل چگونه حساب می‌شود؟',
      a: 'فرمول‌ها:\n• Vc (سرعت برش) = (π × D × n) ÷ 1000   → m/min\n• n (دور اسپیندل) = (1000 × Vc) ÷ (π × D)   → rpm\n• پیشروی ماشین (mm/min) = f × n\n\nمقادیر راهنمای متهٔ HSS / تیغهٔ کارباید (خشک و با خنک‌کار مناسب):\n• آلومینیوم: Vc ≈ 200–400 m/min\n• ST37 (فولاد نرم): Vc ≈ 120–180 m/min\n• CK45 (فولاد کربنی): Vc ≈ 90–150 m/min\n• SS304 (ضدزنگ): Vc ≈ 40–80 m/min\n\nمثال: CK45 با قطر 50 mm و Vc = 120 → n = (1000×120)÷(π×50) ≈ 764 rpm\n\nاین اعداد راهنما هستند؛ مرجع نهایی دفترچهٔ سازندهٔ تیغه/ماشین است.'
    },
    {
      k: ['رزوه', 'm10', 'عمق رزوه', 'گام رزوه', 'قلاویز', 'مته'],
      q: 'عمق رزوه و متهٔ قلاویز چگونه حساب می‌شود؟',
      a: 'برای رزوهٔ متریک ۶۰ درجه (نمونه M10×1.5):\n• عمق نظری رزوه h = 0.6134 × P → 0.6134 × 1.5 ≈ 0.92 mm\n• قطر متهٔ قلاویز (سوراخ اولیه) = قطر اسمی − گام = 10 − 1.5 = 8.5 mm\n• عمق سوراخ ≈ طول رزوه + 2 تا 3 گام برای خروج قلاویز\n\n```\nG76 P010060 Q100 R0.05;\nG76 X8.376 Z-20.0 P920 Q250 F1.5;\n```\n(P920 یعنی عمق ۰.۹۲ mm و F1.5 گام رزوه است.)'
    }
  ];


  // ---------- ابزارهای کمکی ----------
  function makeEl(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;';
    });
  }
  function storageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function storageDel(k) { try { localStorage.removeItem(k); } catch (e) { } }
  function vibrate(pattern) { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { } }

  // ---------- توابع کمکی «دانش داخلی» (پاسخ تضمینی بدون اینترنت) ----------
  function normFa(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .replace(/[\u064A]/g, 'ی').replace(/[\u0643]/g, 'ک')   // ي→ی و ك→ک
      .replace(/[\u200c\u200f\u200e]/g, ' ')
      .replace(/[؟?!.,،;:()"\u00ab\u00bb]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function matchLocal(text) {
    var t = normFa(text);
    if (!t) return null;
    var best = null, bestScore = 0;
    for (var i = 0; i < LOCAL_KB.length; i++) {
      var e = LOCAL_KB[i], score = 0;
      for (var j = 0; j < e.k.length; j++) {
        if (t.indexOf(normFa(e.k[j])) !== -1) score += 1;
      }
      if (score > bestScore) { bestScore = score; best = e; }
    }
    return bestScore >= 1 ? best : null;
  }

  // ---------- قالب صفحه ----------
  // نوار بالا (RTL: از راست به چپ):  [New chat]  [عنوان]  [🗑 پاک‌کردن متن]  [✕]
  var SCREEN_HTML =
    '<div class="ai-top">' +
      '<button class="ai-new" type="button" data-act="clear" aria-label="New chat" title="New chat">' +
        '<span class="ai-new-ic">+</span><span class="ai-new-tx">New chat</span>' +
      '</button>' +
      '<div class="ai-head"><strong>Smart Assistant</strong></div>' +
      // کلید پاک‌کردن متن‌های قبلی: فقط آیکون، کم‌جا، بالای صفحه سمت چپ
      '<button class="ai-clear" type="button" data-act="clear" aria-label="پاک کردن متن‌های قبلی" title="پاک کردن متن‌های قبلی">' +
        '<span class="ai-clear-ic">🗑️</span>' +
      '</button>' +
      '<button class="ai-close" type="button" data-act="exit" aria-label="Close assistant">✕</button>' +
    '</div>' +
    '<div class="ai-msgs" role="log" aria-live="polite"></div>' +
    '<div class="ai-suggest"></div>' +
    '<div class="ai-attach" hidden></div>' +
    '<div class="ai-composer">' +
      '<button class="ai-clip" type="button" data-act="pick" aria-label="Add drawing or part photo">📎</button>' +
      '<textarea class="ai-input" rows="1" maxlength="800" placeholder="Message Smart Assistant…"></textarea>' +
      '<button class="ai-send" type="button" data-act="send" aria-label="Send message">➤</button>' +
    '</div>' +
    '<input class="ai-file" type="file" accept="image/*" hidden>' +
    '<div class="ai-status" hidden></div>';


  // ---------- وضعیت داخلی ----------
  var screen = null;
  var refs = {};
  var wired = false;
  var chat = [];            // [{ role:'user'|'bot', text:String, error:Boolean }]
  var pending = false;
  var inflight = null;      // { ctrl, timer }
  var lastSent = '';        // آخرین پرسش کاربر (برای «تلاش دوباره»)
  var lastError = '';
  var tabRef = null;        // تب پایین که جای «متریال» را گرفته است
  var attachment = null;    // تصویر آمادهٔ ارسال: { full, thumb, w, h, bytes }
  var lastImage = null;     // تصویر آخرین پرسش (برای «تلاش دوباره»)
  var imgsInSession = 0;    // چند تصویر با کیفیت کامل در همین نشست فرستاده شده

  function isActive() { return !!screen && !screen.hidden && screen.classList.contains('active'); }

  // ---------- همان الگوی بازی: بالاترین گره با data-act / data-q ----------
  function attrUp(node, key, maxDepth) {
    var n = node, depth = 0, limit = maxDepth || 8;
    while (n && depth < limit) {
      if (n.dataset && n.dataset[key]) return n.dataset[key];
      n = n.parentNode; depth++;
    }
    return '';
  }
  function actOf(node) { return attrUp(node, 'act', 8); }

  function ensureScreen() {
    if (screen) return screen;
    var existing = document.querySelector('.mobile-ai');
    if (existing) {
      screen = existing;
    } else {
      var ws = document.querySelector('.workspace');
      if (!ws) return null;
      screen = makeEl('div', 'tool-panel mobile-ai');
      screen.dataset.panel = PANEL_KEY;
      screen.setAttribute('aria-label', 'دستیار هوش مصنوعی');
      screen.innerHTML = SCREEN_HTML;
      screen.hidden = true;   // در ابتدا هیچ صفحه‌ای باز نیست
      ws.insertBefore(screen, ws.firstChild);
    }
    collectRefs();
    wireScreen();
    return screen;
  }

  function collectRefs() {
    refs.msgs = screen.querySelector('.ai-msgs');
    refs.suggest = screen.querySelector('.ai-suggest');
    refs.input = screen.querySelector('.ai-input');
    refs.send = screen.querySelector('.ai-send');
    refs.status = screen.querySelector('.ai-status');
    refs.newChat = screen.querySelector('.ai-new');
    refs.close = screen.querySelector('.ai-close');
    refs.attach = screen.querySelector('.ai-attach');
    refs.clip = screen.querySelector('.ai-clip');
    refs.file = screen.querySelector('.ai-file');
    refs.clear = screen.querySelector('.ai-clear');
  }

  // کارت صفحهٔ اصلی: دیگر ساخته نمی‌شود — دستیار فقط از تب پایین در دسترس است.
  // اگر از نسخه‌های قبلی کارتی روی صفحه مانده باشد، پاک می‌شود.
  function removeHomeCard() {
    var cards = document.querySelectorAll('.mobile-grid [data-tool="' + PANEL_KEY + '"]');
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].parentNode) cards[i].parentNode.removeChild(cards[i]);
    }
    var grid = document.querySelector('.mobile-home .mobile-grid');
    return !grid || !grid.querySelector('[data-tool="' + PANEL_KEY + '"]');
  }

  // تب پایین: جای «متریال» را می‌گیرد (خودِ متریال از کارت صفحهٔ اصلی در دسترس می‌ماند)
  function buildBottomTab() {
    var tabbar = document.querySelector('.mobile-tabbar');
    if (!tabbar) return false;                                    // تببار هنوز ساخته نشده → دوباره تلاش کن
    if (tabbar.querySelector('[data-action="' + PANEL_KEY + '"]')) return true;
    var old = tabbar.querySelector('[data-action="materials"]');
    if (!old || !old.parentNode) return true;                      // چیدمان متفاوت: دست نزن
    var btn = makeEl('button', 'tab');
    btn.type = 'button';
    btn.dataset.action = PANEL_KEY;
    btn.setAttribute('dir', 'ltr');
    btn.setAttribute('aria-label', 'AI Assistant');
    btn.innerHTML = '<span class="t-icon">🤖</span><span>AI Assistant</span>';
    btn.addEventListener('click', function () {
      if (isActive()) return;                                      // همین صفحه باز است
      openAi();
    });
    old.parentNode.replaceChild(btn, old);                         // همان جایگاه تب متریال
    tabRef = btn;
    return true;
  }

  function markTabActive() {
    if (!tabRef) return;
    var tabs = document.querySelectorAll('.mobile-tabbar .tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('active', tabs[i] === tabRef);
    }
    tabRef.classList.add('active');
  }

  // ---------- باز و بسته کردن ----------
  function hideEveryOtherScreen() {
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
  }

  function openAi() {
    ensureScreen();
    if (!screen) return;
    hideEveryOtherScreen();
    markTabActive();
    screen.hidden = false;
    screen.classList.add('active');
    screen.classList.remove('mobile-page-enter');
    void screen.offsetWidth;
    screen.classList.add('mobile-page-enter');
    setTimeout(function () { if (screen) screen.classList.remove('mobile-page-enter'); }, 450);
    window.scrollTo(0, 0);
    renderChat();
    syncActivation();
  }

  function requestHome() {
    var tab = document.querySelector('.mobile-tabbar .tab[data-action="home"]');
    if (tab && typeof tab.click === 'function') { tab.click(); return; }
    if (screen) { screen.classList.remove('active'); screen.hidden = true; }
    syncActivation();
  }

  function syncActivation() {
    if (!screen) return;
    if (isActive()) {
      setBusy(pending);
      updateSendBtn();
      // اگر پنل از مسیر دیگر (جستجو یا دکمهٔ Back) باز شد، محتوا هم آماده شود
      renderChat();
      markTabActive();
    } else {
      // خروج از صفحه: درخواست نیمه‌کاره لغو می‌شود (بدون پیام خطای اضافه)
      abortInflight();
      if (refs.input) { try { refs.input.blur(); } catch (e) { } }
    }
  }

  function wireScreen() {
    if (wired) return;
    wired = true;

    screen.addEventListener('click', function (ev) {
      var act = actOf(ev.target);
      if (act === 'exit') { requestHome(); return; }
      if (act === 'clear') { clearChat(); return; }
      if (act === 'send') { sendFromInput(); return; }
      if (act === 'retry') { retryLast(); return; }
      if (act === 'chip') { useSuggestion(attrUp(ev.target, 'q', 4)); return; }
      if (act === 'pick') { pickImage(); return; }
      if (act === 'unattach') { clearAttachment(); return; }
    });

    if (refs.file) {
      refs.file.addEventListener('change', function () {
        var f = refs.file.files && refs.file.files[0];
        if (f) attachFile(f).catch(noop);
      });
    }

    if (refs.input) {
      refs.input.addEventListener('input', autoGrow);
      refs.input.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) sendFromInput();
      });
    }

    // هر تغییر فعال/غیرفعال شدن پنل (خانه، تب پایین، دکمهٔ Back اندروید) اینجا مدیریت می‌شود
    var observer = new MutationObserver(function () { syncActivation(); });
    observer.observe(screen, { attributes: true, attributeFilter: ['class', 'hidden'] });
  }

  // ---------- قالب‌بندی متن پاسخ (ایمن: اول escape، بعد تگ‌های خودمان) ----------
  function inlineRich(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code class="ai-code">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/(^|[\s(«])\*([^*\n]+)\*(?=[\s)».,؛:]|$)/g, '$1<i>$2</i>');
  }

  function renderRich(text) {
    var raw = String(text == null ? '' : text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var parts = raw.split('```');
    var html = '';
    for (var p = 0; p < parts.length; p++) {
      if (p % 2 === 1) {
        // بلوک کد
        var code = parts[p].replace(/^[a-zA-Z0-9#+\-]*\n/, '').replace(/\n+$/, '');
        html += '<pre class="ai-pre"><code>' + esc(code) + '</code></pre>';
        continue;
      }
      var lines = parts[p].split('\n');
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].replace(/\s+$/, '');
        if (!line.trim()) { html += '<div class="ai-gap"></div>'; continue; }
        var h = /^\s*#{1,6}\s+(.+)$/.exec(line);
        if (h) { html += '<div class="ai-h">' + inlineRich(h[1]) + '</div>'; continue; }
        var b = /^\s*[-*•]\s+(.+)$/.exec(line);
        if (b) { html += '<div class="ai-li">• ' + inlineRich(b[1]) + '</div>'; continue; }
        var n = /^\s*(\d+)[.)]\s+(.+)$/.exec(line);
        if (n) { html += '<div class="ai-li">' + n[1] + '. ' + inlineRich(n[2]) + '</div>'; continue; }
        html += '<div class="ai-p">' + inlineRich(line) + '</div>';
      }
    }
    return html;
  }

  function bubbleHtml(m) {
    if (m.error) {
      var body = m.local ? renderRich(m.text) : esc(m.text);
      return '<div class="ai-msg bot err' + (m.local ? ' ai-local' : '') + '">' +
        '<div class="ai-bubble">' + body +
        '<br><button class="ai-retry" type="button" data-act="retry">🔄 Try again</button></div></div>';
    }
    if (m.role === 'user') {
      var shot = (m.img && /^data:image\//i.test(String(m.img.thumb || '')))
        ? '<img class="ai-shot" src="' + m.img.thumb + '" alt="Sent photo">'
        : '';
      var note = m.img
        ? '<div class="ai-shot-note">' + (m.ocr ? '📄 Text read from image' : '🖼️ Image (no text read)') + '</div>'
        : '';
      return '<div class="ai-msg user"><div class="ai-bubble">' + shot + renderRich(m.text) + note + '</div></div>';
    }
    return '<div class="ai-msg bot"><div class="ai-bubble">' + renderRich(m.text) + '</div></div>';
  }

  function renderChat() {
    if (!refs.msgs) return;
    var html = '';
    for (var i = 0; i < chat.length; i++) html += bubbleHtml(chat[i]);
    if (pending) {
      html += '<div class="ai-msg bot ai-typing"><div class="ai-bubble"><i></i><i></i><i></i></div></div>';
    }
    refs.msgs.innerHTML = html;
    renderSuggest();
    updateClearBtn();
    scrollToEnd();
  }

  // کلید پاک‌سازی: همیشه دیده می‌شود؛ فقط وقتی چتی نیست کمرنگ می‌ماند
  function updateClearBtn() {
    if (!refs.clear) return;
    var empty = !chat.length;
    refs.clear.classList.toggle('is-empty', empty);
    if (empty) refs.clear.setAttribute('aria-disabled', 'true');
    else refs.clear.removeAttribute('aria-disabled');
  }

  function renderSuggest() {
    if (!refs.suggest) return;
    var hasUser = false;
    for (var i = 0; i < chat.length; i++) { if (chat[i].role === 'user') { hasUser = true; break; } }
    if (hasUser || pending) { refs.suggest.innerHTML = ''; refs.suggest.hidden = true; return; }
    var html = '<button class="ai-chip ai-chip-img" type="button" data-act="pick" aria-label="Send a photo">📷 Photo</button>';
    for (var j = 0; j < SUGGESTIONS.length; j++) {
      html += '<button class="ai-chip" type="button" data-act="chip" data-q="' + esc(SUGGESTIONS[j]) + '">' +
        esc(SUGGESTIONS[j]) + '</button>';
    }
    refs.suggest.innerHTML = html;
    refs.suggest.hidden = false;
  }

  function scrollToEnd() {
    if (!refs.msgs) return;
    try { refs.msgs.scrollTop = refs.msgs.scrollHeight || 0; } catch (e) { }
  }

  function showStatus(text) {
    if (!refs.status) return;
    refs.status.textContent = text || '';
    refs.status.hidden = !text;
  }
  function hideStatus() { showStatus(''); }

  function setBusy(on) {
    pending = !!on;
    if (refs.send) {
      try { refs.send.disabled = !!on; } catch (e) { }
      if (on) refs.send.classList.add('busy'); else refs.send.classList.remove('busy');
    }
  }

  function updateSendBtn() {
    if (!refs.send) return;
    var empty = !refs.input || !String(refs.input.value || '').trim();
    if (empty && attachment) empty = false;    // تصویر تنها هم قابل ارسال است
    try { refs.send.disabled = pending || empty; } catch (e) { }
  }

  function autoGrow() {
    if (!refs.input) return;
    var v = String(refs.input.value || '');
    try { refs.input.rows = Math.max(1, Math.min(5, v.split('\n').length)); } catch (e) { }
    updateSendBtn();
  }


  // ---------- تصویر: انتخاب، فشرده‌سازی و خواندن متن روی خود گوشی (OCR) ----------
  // تصویر به هیچ سرویس بیرونی فرستاده نمی‌شود؛ فقط متنِ خوانده‌شده برای هوش مصنوعی می‌رود.
  function pickImage() {
    if (refs.file && typeof refs.file.click === 'function') { try { refs.file.click(); } catch (e) { } }
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('no-file'));
      if (!/^image\//i.test(file.type || '')) return reject(new Error('not-image'));
      if ((file.size || 0) > 25 * 1024 * 1024) return reject(new Error('too-big'));
      if (typeof FileReader !== 'function') return reject(new Error('no-reader'));
      var fr = new FileReader();
      fr.onload = function () { resolve(String(fr.result || '')); };
      fr.onerror = function () { reject(new Error('read-fail')); };
      try { fr.readAsDataURL(file); } catch (e) { reject(e); }
    });
  }

  function loadImage(dataUrl) {
    return new Promise(function (resolve, reject) {
      if (typeof Image !== 'function') return reject(new Error('no-image'));
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('decode-fail')); };
      img.src = dataUrl;
    });
  }

  // بزرگ‌ترین ضلع را به maxSide محدود می‌کند و نسبت را حفظ می‌کند
  function calcFit(w, h, maxSide) {
    w = Math.max(1, Math.round(Number(w) || 1));
    h = Math.max(1, Math.round(Number(h) || 1));
    var m = Math.max(w, h);
    if (m <= maxSide) return { w: w, h: h, scale: 1 };
    var s = maxSide / m;
    return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)), scale: s };
  }

  function drawToJpeg(img, maxSide, quality) {
    var fit = calcFit(img.naturalWidth || img.width, img.naturalHeight || img.height, maxSide);
    var c = document.createElement('canvas');
    c.width = fit.w; c.height = fit.h;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';                        // پس‌زمینهٔ سفید: متن نقشه خواناتر می‌شود
    ctx.fillRect(0, 0, fit.w, fit.h);
    ctx.drawImage(img, 0, 0, fit.w, fit.h);
    return c.toDataURL('image/jpeg', quality);
  }

  // ---------- پیش‌پردازش تصویر برای OCR ----------
  // نقشه‌های فنی با نور نامنظم، سایه و زاویه گرفته می‌شوند و OCR روی آن‌ها ضعیف عمل می‌کند.
  // این تابع تصویر را سیاه‌وسفید و با کنتراست بالا می‌کند تا خطوط و نوشته‌ها واضح شوند.
  // اگر مرورگر پشتیبانی نکند، همان تصویر اصلی برگردانده می‌شود.
  function preprocessForOcr(dataUrl) {
    return loadImage(dataUrl).then(function (img) {
      try {
        var maxSide = 2000;                       // برای OCR بزرگ‌تر بهتر است (متن ریز نقشه)
        var fit = calcFit(img.naturalWidth || img.width, img.naturalHeight || img.height, maxSide);
        var c = document.createElement('canvas');
        c.width = fit.w; c.height = fit.h;
        var ctx = c.getContext('2d', { willReadFrequently: true });
        if (!ctx) return dataUrl;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, fit.w, fit.h);
        ctx.drawImage(img, 0, 0, fit.w, fit.h);

        var data = ctx.getImageData(0, 0, fit.w, fit.h);
        var px = data.data;

        // ۱) تبدیل به خاکستری + محاسبهٔ کمینه/بیشینه برای کشش کنتراست
        var mn = 255, mx = 0;
        for (var i = 0; i < px.length; i += 4) {
          var g = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) | 0;
          px[i] = g; px[i + 1] = g; px[i + 2] = g;
          if (g < mn) mn = g;
          if (g > mx) mx = g;
        }

        // ۲) کشش کنتراست: کف روشن، سقف تیره (برای متن مشکی روی کاغذ سفید عالی است)
        var range = mx - mn;
        if (range < 25) return dataUrl;             // عکس یک‌دست/تار → پیش‌پردازش بی‌فایده است
        var k = 255 / range;
        var lo = mn - range * 0.06;
        for (var j = 0; j < px.length; j += 4) {
          var v = (px[j] - lo) * k;
          if (v < 0) v = 0; else if (v > 255) v = 255;
          px[j] = px[j + 1] = px[j + 2] = v;
        }
        ctx.putImageData(data, 0, 0);

        // ۳) خروجی PNG (بدون افت کیفیت) چون OCR به لبه‌های تیز نوشته حساس است
        return c.toDataURL('image/png');
      } catch (e) {
        return dataUrl;
      }
    }).catch(function () { return dataUrl; });
  }

  function bytesOfDataUrl(u) { return Math.round(String(u || '').length * 3 / 4); }

  // تصویر آمادهٔ استفاده: نسخهٔ فشردهٔ خوانا + بندانگشتی برای تاریخچهٔ گفتگو
  function prepareImage(dataUrl) {
    return loadImage(dataUrl).then(function (img) {
      var out = {
        full: dataUrl,
        thumb: '',
        w: img.naturalWidth || img.width,
        h: img.naturalHeight || img.height,
        bytes: bytesOfDataUrl(dataUrl)
      };
      try {
        var q = 0.85;
        var big = drawToJpeg(img, IMG_MAX_SIDE, q);
        while (big.length > IMG_MAX_CHARS && q > 0.45) { q -= 0.12; big = drawToJpeg(img, IMG_MAX_SIDE, q); }
        out.full = big;
        out.bytes = bytesOfDataUrl(big);
        out.thumb = drawToJpeg(img, IMG_THUMB_SIDE, 0.6);
      } catch (e) {
        // اگر canvas در دسترس نبود: تصویر اصلی (اگر کوچک باشد) استفاده می‌شود
        out.thumb = dataUrl.length <= IMG_MAX_CHARS ? dataUrl : '';
      }
      return out;
    });
  }

  function setAttachment(a) {
    attachment = a || null;
    renderAttach();
    updateSendBtn();
  }

  function clearAttachment() {
    attachment = null;
    if (refs.file) { try { refs.file.value = ''; } catch (e) { } }
    renderAttach();
    updateSendBtn();
  }

  function renderAttach() {
    if (!refs.attach) return;
    if (!attachment) { refs.attach.innerHTML = ''; refs.attach.hidden = true; return; }
    var a = attachment;
    var size = Math.round((a.bytes || 0) / 1024);
    refs.attach.innerHTML =
      '<div class="ai-att-box">' +
        (a.thumb ? '<img class="ai-att-img" src="' + a.thumb + '" alt="Image preview">' : '<span class="ai-att-img ai-att-noimg">🖼️</span>') +
        '<div class="ai-att-meta">' +
          '<strong>عکس آماده است</strong>' +
          '<small>' + esc(a.w + '×' + a.h + ' px • ' + size + ' KB') + '</small>' +
          '<small class="ai-att-hint">متن و اندازه‌های روی خود گوشی خوانده می‌شود (بدون فرستادن عکس).</small>' +
        '</div>' +
        '<button class="ai-att-x" type="button" data-act="unattach" aria-label="Remove image">✕</button>' +
      '</div>';
    refs.attach.hidden = false;
  }

  function attachFile(file) {
    showStatus('آماده‌سازی عکس…');
    return readFileAsDataUrl(file)
      .then(prepareImage)
      .then(function (a) {
        setAttachment(a);
        hideStatus();
        showStatus('عکس اضافه شد. حالا سوالت را بنویس.');
        setTimeout(hideStatus, 2600);
        vibrate(8);
        return a;
      })
      .catch(function (err) {
        hideStatus();
        var code = err && err.message;
        var msg = code === 'not-image' ? 'فقط فایل تصویری (عکس یا اسکرین‌شات) پشتیبانی می‌شود.'
          : code === 'too-big' ? 'حجم تصویر بیشتر از ۲۵ مگابایت است. عکس کوچک‌تری انتخاب کن.'
            : 'این تصویر باز نشد. یک عکس دیگر امتحان کن.';
        pushMessage('bot', msg, true);
        throw err;
      });
  }


  // ---------- خواندن متن تصویر روی گوشی (OCR محلی، بدون اینترنت) ----------
  var OCR_PATH = 'vendor/tesseract/';   // کتابخانهٔ محلی داخل اپ (بدون نیاز به CDN)
  var OCR_LANG = 'eng';
  var OCR_CACHE = 'machinistAiOcr';
  var OCR_LIB_TIMEOUT = 15000;
  var ocrLibPromise = null;

  function loadOcrLib() {
    if (ocrLibPromise) return ocrLibPromise;
    ocrLibPromise = new Promise(function (resolve, reject) {
      if (typeof window !== 'undefined' && window.Tesseract) return resolve(window.Tesseract);
      if (typeof document === 'undefined') return reject(new Error('no-dom'));
      var s = document.createElement('script');
      s.src = OCR_PATH + 'tesseract.min.js';
      s.async = true;
      var settled = false;
      s.onload = function () {
        settled = true;
        if (window.Tesseract) resolve(window.Tesseract);
        else reject(new Error('no-lib'));
      };
      s.onerror = function () { settled = true; reject(new Error('lib-load')); };
      try { document.head.appendChild(s); } catch (e) { return reject(e); }
      setTimeout(function () { if (!settled) reject(new Error('lib-timeout')); }, OCR_LIB_TIMEOUT);
    });
    return ocrLibPromise;
  }

  // Worker یک‌بار ساخته و تا پایان نشست نگه داشته می‌شود؛ ساختن دوبارهٔ آن
  // برای هر عکس چند ثانیه طول می‌کشید. اگر خراب شد، یک‌بار دیگر ساخته می‌شود.
  var ocrWorkerPromise = null;
  function getOcrWorker() {
    if (ocrWorkerPromise) return ocrWorkerPromise;
    ocrWorkerPromise = loadOcrLib().then(function (T) {
      if (!T || typeof T.createWorker !== 'function') throw new Error('no-lib');
      return T.createWorker(OCR_LANG, 1, {
        workerPath: OCR_PATH + 'worker.min.js',
        corePath: OCR_PATH,
        langPath: OCR_PATH,
        gzip: false,
        cachePath: OCR_CACHE,
        workerBlobURL: false,
        logger: function (m) {
          if (!m || !m.status) return;
          if (m.status === 'recognizing text') {
            var p = Math.round((m.progress || 0) * 100);
            showStatus('در حال خواندن متن عکس… ' + p + '٪');
          } else if (m.status === 'loading language traineddata' || m.status === 'initializing tesseract') {
            showStatus('آماده‌سازی موتور خواندن متن…');
          }
        }
      });
    }).catch(function (err) { ocrWorkerPromise = null; throw err; });
    return ocrWorkerPromise;
  }

  function normalizeOcrText(t) {
    return String(t == null ? '' : t)
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/ ?\n ?/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  // آیا متن استخراج‌شده واقعاً «چیزی» است یا فقط نویز بی‌معنی OCR؟
  function ocrLooksUseful(text) {
    var t = String(text || '');
    if (t.replace(/[^0-9A-Za-zØø⌀±°µ×.,;:/-]/g, '').length < 4) return false;
    if (/\d/.test(t)) return true;                                  // حداقل یک عدد دارد
    return /[A-Za-z]{3,}/.test(t);                                 // یا یک واژهٔ واقعی
  }

  // خروجی: { text, confidence, useful }
  // تصویر اول پیش‌پردازش می‌شود (سیاه‌وسفید + کنتراست) تا OCR دقیق‌تر شود.
  function runOcr(dataUrl) {
    return preprocessForOcr(dataUrl).then(function (prepared) {
      return getOcrWorker().then(function (worker) {
        return worker.recognize(prepared).then(function (r) {
          var data = (r && r.data) || {};
          var text = normalizeOcrText(data.text);
          var conf = Math.round(data.confidence || 0);
          return { text: text, confidence: conf, useful: ocrLooksUseful(text) };
        }).catch(function (err) {
          // اگر Worker خراب شده باشد، یک‌بار دیگر می‌سازیم و تکرار می‌کنیم
          ocrWorkerPromise = null;
          try { worker.terminate(); } catch (e) { }
          return getOcrWorker().then(function (w2) {
            return w2.recognize(prepared).then(function (r) {
              var data = (r && r.data) || {};
              var text = normalizeOcrText(data.text);
              var conf = Math.round(data.confidence || 0);
              return { text: text, confidence: conf, useful: ocrLooksUseful(text) };
            });
          });
        });
      });
    });
  }

  // استخراج چیزهای به‌کارآمده برای نقشه: اعداد، رزوه‌ها، تلرانس‌ها و علائم
  function drawingHints(ocrText) {
    var t = String(ocrText || '').replace(/[ØøΦ]/g, 'Ø');
    if (!t) return [];
    var pats = [
      [/M\s?\d+(?:[.,]\d+)?(?:\s?[x×]\s?\d+(?:[.,]\d+)?)?/gi, 'رزوه'],
      [/(?:Ø|D)\s?\d+(?:[.,]\d+)?/gi, 'قطر'],
      [/R\s?\d+(?:[.,]\d+)?/gi, 'شعاع'],
      [/Ra\s?\d+(?:[.,]\d+)?/gi, 'زبری سطح'],
      [/[+±]\s?\d+(?:[.,]\d+)?\s?\/?\s?[-−]\s?\d+(?:[.,]\d+)?/g, 'تلرانس'],
      [/\b\d+(?:[.,]\d+)?\b/g, 'عدد']
    ];
    var out = [], seen = {};
    for (var p = 0; p < pats.length; p++) {
      var m = t.match(pats[p][0]);
      if (!m) continue;
      for (var i = 0; i < m.length && i < 25; i++) {
        var v = String(m[i]).replace(/\s+/g, ' ').trim();
        if (!v || seen[v]) continue;
        seen[v] = 1;
        out.push(v + ' (' + pats[p][1] + ')');
      }
    }
    return out;
  }


  function useSuggestion(question) {
    if (!question) return;
    if (refs.input) { refs.input.value = ''; autoGrow(); }
    send(question).catch(noop);
  }

  function sendFromInput() {
    if (!refs.input) return;
    var text = String(refs.input.value || '').trim();
    if (!text) return;
    refs.input.value = '';
    autoGrow();
    send(text).catch(noop);
  }

  function retryLast() {
    if (pending || !lastSent) return;
    // پیام خطا از گفتگو حذف می‌شود تا پاسخ درست سر جای خودش بنشیند
    for (var i = chat.length - 1; i >= 0; i--) {
      if (chat[i].error) { chat.splice(i, 1); break; }
    }
    saveChat();
    renderChat();
    send(lastSent, true).catch(noop);
  }

  // ---------- چرخهٔ پرسش و پاسخ ----------
  function isOffline() {
    return typeof navigator !== 'undefined' && !!navigator && navigator.onLine === false;
  }

  function send(text, isRetry) {
    var question = String(text == null ? '' : text).trim();
    var img = isRetry ? lastImage : attachment;
    if (!question && !img) return Promise.reject(makeErr('empty-input', 0));
    if (pending) return Promise.reject(makeErr('busy', 0));
    if (question.length > MAX_INPUT) question = question.slice(0, MAX_INPUT);
    var msgText = question || 'این تصویر را برایم بررسی و توضیح بده.';
    if (!isRetry) {
      if (img) clearAttachment();
      pushMessage('user', msgText, false, img ? { img: { thumb: img.thumb, w: img.w, h: img.h }, full: img.full } : null);
    }
    lastSent = msgText;
    if (img) lastImage = img;
    setBusy(true);
    renderChat();
    // برای پرسش متنی هیچ متن وضعیتی نشان داده نمی‌شود؛ نقطه‌های «در حال نوشتن» کافی است.
    // فقط وقتی تصویر هست، پیشرفت خواندن متن (که چند ثانیه طول می‌کشد) نمایش داده می‌شود.
    showStatus(img ? 'در حال خواندن متن عکس…' : '');
    vibrate(10);

    // گام ۱: اگر تصویر هست، متن و اندازه‌هایش روی خود گوشی خوانده می‌شود (بدون نیاز به سرویس بیرونی)
    var pre = img
      ? runOcr(img.full).catch(function () { return { text: '', confidence: 0, useful: false, failed: true }; })
      : Promise.resolve(null);

    return pre.then(function (ocr) {
      var lastMsg = chat.length ? chat[chat.length - 1] : null;
      if (ocr && lastMsg && lastMsg.role === 'user' && lastMsg.img) {
        lastMsg.ocr = String(ocr.text || '').slice(0, OCR_MAX_CHARS);
        lastMsg.ocrConf = Math.round(ocr.confidence || 0);
        lastMsg.ocrUseful = !!(ocr.useful && ocr.confidence >= OCR_MIN_CONFIDENCE);
        lastMsg.ocrFailed = !!ocr.failed;
        saveChat();
      }
      // اگر مدل متنی است و چیزی از عکس خوانده نشده، اصلاً سرور را صدا نمی‌زنیم؛
      // وگرنه مدل چیزی می‌سازد و وانمود می‌کند «نقطه می‌بینم» یا «قطعه می‌بینم».
      if (lastMsg && lastMsg.role === 'user' && lastMsg.img && !lastMsg.ocrUseful) {
        var weak = !!lastMsg.ocr && lastMsg.ocrConf < OCR_MIN_CONFIDENCE;
        finishRequest();
        pushMessage('bot', weak ? IMG_OCR_WEAK : IMG_OCR_EMPTY, false);
        return { text: '', model: 'local-image', ocrOnly: true };
      }
      if (isOffline()) throw makeErr('offline', 0);
      return requestModel();
    }).then(function (res) {
      // پاسخ محلیِ «عکس خوانده نشد» خودش پیامش را اضافه کرده؛ نباید دوباره اضافه شود
      if (res && res.ocrOnly) return res;
      finishRequest();
      pushMessage('bot', res.text, false);
      return res;
    }).catch(function (err) {
      var cancelled = (err && err.kind === 'cancel') || (isAbort(err) && !isActive());
      finishRequest();
      if (cancelled) {
        // کاربر صفحه را بست یا به خانه رفت: هیچ پیام خطایی نشان نده
        var c = makeErr('cancel', 0);
        c.message = 'cancelled';
        throw c;
      }
      // پاسخ جایگزین از دانش داخلی اپ (همیشه در دسترس، بدون اینترنت)
      var loc = matchLocal(lastSent);
      if (loc) {
        var note = isOffline()
          ? '\n\n— اینترنت وصل نیست؛ این پاسخ از دانش داخلی خود اپ آمد. وقتی اینترنت وصل شد «تلاش دوباره» را بزن.'
          : '\n\n— ارتباط با سرور برقرار نشد؛ این پاسخ از دانش داخلی خود اپ آمد. برای پاسخ کامل‌تر «تلاش دوباره» را بزن.';
        lastError = 'local-fallback';
        pushMessage('bot', loc.a + note, true, { local: true });
        var le = makeErr('local', 0);
        le.message = lastError;
        throw le;
      }
      var msg = classifyError(err);
      lastError = msg;
      pushMessage('bot', msg, true);
      var e = makeErr((err && err.kind) || 'net', (err && err.status) || 0);
      e.message = msg;
      throw e;
    });
  }

  function finishRequest() {
    if (inflight && inflight.timer) clearTimeout(inflight.timer);
    inflight = null;
    setBusy(false);
    hideStatus();
    renderChat();
    updateSendBtn();
  }

  function abortInflight() {
    if (!inflight) return;
    if (inflight.timer) clearTimeout(inflight.timer);
    if (inflight.ctrl) { try { inflight.ctrl.abort(); } catch (e) { } }
    inflight = null;
    setBusy(false);
    hideStatus();
  }

  function pushMessage(role, text, isError, extra) {
    var m = { role: role === 'user' ? 'user' : 'bot', text: String(text || ''), error: !!isError };
    if (extra) {
      if (extra.img) m.img = { thumb: String(extra.img.thumb || ''), w: extra.img.w || 0, h: extra.img.h || 0 };
      if (extra.full) m.full = String(extra.full);       // فقط در حافظهٔ همین نشست (ذخیره نمی‌شود)
      if (extra.local) m.local = true;
    }
    chat.push(m);
    if (chat.length > MAX_STORED) chat = chat.slice(chat.length - MAX_STORED);
    saveChat();
    renderChat();
  }

  function clearChat() {
    chat = [];
    lastSent = '';
    lastError = '';
    lastImage = null;
    clearAttachment();
    storageDel(STORE_KEY);
    if (refs.input) { refs.input.value = ''; autoGrow(); }
    renderChat();
    showStatus('');
    vibrate(12);
  }

  function saveChat() {
    try {
      var slim = chat.map(function (m) {
        var o = { r: m.role === 'user' ? 'u' : 'b', t: m.text, e: m.error ? 1 : 0 };
        if (m.local) o.l = 1;
        if (m.img) { o.w = m.img.w || 0; o.h = m.img.h || 0; if (m.img.thumb) o.p = m.img.thumb; }
        if (m.ocr) { o.x = String(m.ocr).slice(0, 1200); o.c = m.ocrConf || 0; o.u = m.ocrUseful ? 1 : 0; }
        return o;
      });
      // سقف تعداد تصویرهای ذخیره‌شده (حجم localStorage محدود است)
      var kept = 0;
      for (var i = slim.length - 1; i >= 0; i--) {
        if (!slim[i].p) continue;
        kept += 1;
        if (kept > MAX_STORED_IMAGES) delete slim[i].p;
      }
      storageSet(STORE_KEY, JSON.stringify(slim));
    } catch (e) { }
  }

  function loadChat() {
    var raw = storageGet(STORE_KEY);
    if (!raw) return;
    try {
      var arr = JSON.parse(raw);
      if (!arr || !arr.length) return;
      var list = [];
      for (var i = 0; i < arr.length; i++) {
        var m = arr[i];
        var t = String((m && m.t) || '');
        if (!t) continue;
        var item = { role: m.r === 'u' ? 'user' : 'bot', text: t, error: !!m.e };
        if (m.l) item.local = true;
        if (m.p || m.w) item.img = { thumb: String(m.p || ''), w: m.w || 0, h: m.h || 0 };
        if (m.x) { item.ocr = String(m.x); item.ocrConf = m.c || 0; item.ocrUseful = !!m.u; }
        list.push(item);
      }
      chat = list;
    } catch (e) { chat = []; }
  }

  // ---------- لایهٔ شبکه: Pollinations (رایگان، بدون کلید API) ----------
  // زنجیرهٔ تلاش: POST openai-fast → POST openai → GET متنی
  // نکته: سرویس رایگان محدودیت نرخ دارد (~۱ درخواست در ۱۵ ثانیه) و در صورت
  // زودهنگام بودن، خطای 402/429 می‌دهد. برای همین قبل از هر درخواست، تا آزاد شدن
  // سهمیه صبر می‌کنیم و بعد از خطای محدودیت، با فاصلهٔ کوتاه دوباره تلاش می‌کنیم.
  function makeErr(kind, status) { return { name: 'AiError', kind: kind, status: status || 0 }; }

  var RATE_GAP_MS = 16000;      // حداقل فاصلهٔ بین دو درخواست به سرویس
  var RATE_WAIT_MAX_MS = 26000; // سقف انتظار برای آزاد شدن سهمیه
  var lastRequestAt = 0;
  var rateWaiters = [];

  function isRateLimit(err) {
    var s = err && err.status;
    return s === 402 || s === 429 || s === 503 || s === 500;
  }

  // اگر کمتر از RATE_GAP_MS از آخرین درخواست گذشته، تا آزاد شدن سهمیه صبر می‌کند.
  function respectRateLimit() {
    var wait = lastRequestAt ? (lastRequestAt + RATE_GAP_MS - Date.now()) : 0;
    if (wait <= 0) return Promise.resolve();
    if (wait > RATE_WAIT_MAX_MS) return Promise.resolve();     // خیلی دیر شده؛ بی‌خیال
    if (wait > 400) showStatus('چند لحظه صبر کن تا نوبت سرویس برسد…');
    return new Promise(function (resolve) {
      var t = setTimeout(function () {
        rateWaiters = rateWaiters.filter(function (w) { return w !== t; });
        resolve();
      }, wait);
      rateWaiters.push(t);
    });
  }

  function isAbort(err) {
    if (!err) return false;
    if (err.kind === 'abort') return true;
    return err.name === 'AbortError' || err.code === 20 || err.code === 'ABORT_ERR';
  }

  function extractText(data) {
    try {
      var msg = data && data.choices && data.choices[0] && data.choices[0].message;
      var c = msg ? msg.content : null;
      if (typeof c === 'string') return c.trim();
      if (c && typeof c.length === 'number') {
        var out = '';
        for (var i = 0; i < c.length; i++) {
          var part = c[i];
          out += typeof part === 'string' ? part : String((part && part.text) || '');
        }
        return out.trim();
      }
    } catch (e) { }
    return '';
  }

  // متن پیام کاربر برای مدل (اگر تصویر داشته باشد، متن خوانده‌شده از تصویر هم اضافه می‌شود)
  function textForSend(m) {
    if (!m) return '';
    if (!m.img) return m.text;
    var out = m.text + '\n\n[متن و اندازه‌هایی که با خواندن خودکار از تصویر استخراج شد]';
    if (m.ocrUseful && m.ocr) {
      out += '\n' + m.ocr;
    } else if (m.ocrConf && m.ocrConf < OCR_MIN_CONFIDENCE) {
      out += '\n(متن عکس خیلی ناخوانا بود و قابل استفاده نیست. عددی از خودت نساز.)';
    } else {
      out += '\n(هیچ متنی از عکس خوانده نشد. عددی از خودت نساز و وانمود نکن چیزی می‌بینی.)';
    }
    var hints = drawingHints(m.ocr);
    if (hints.length) out += '\n\n[موارد فنی شناسایی‌شده]\n' + hints.join(' | ');
    return out;
  }

  // متن گفتگو برای مدل: پرامپت سیستمی + آخرین پیام‌ها (پیام‌های خطا حذف می‌شوند)
  function buildContext() {
    var msgs = [{ role: 'system', content: SYSTEM_PROMPT }];
    var recent = [];
    for (var i = 0; i < chat.length; i++) {
      var m = chat[i];
      if (m.error) continue;
      // تصویر هرگز به مدل فرستاده نمی‌شود: مدل رایگان متنی است و ورودی
      // تصویر را بی‌صدا دور می‌ریزد و توهم می‌سازد. فقط متن OCR می‌رود.
      var content = textForSend(m);
      recent.push({ role: m.role === 'user' ? 'user' : 'assistant', content: content });
    }
    return msgs.concat(recent.slice(-MAX_CONTEXT));
  }

  function lastUserText() {
    for (var i = chat.length - 1; i >= 0; i--) {
      if (chat[i].role === 'user' && !chat[i].error) return textForSend(chat[i]);
    }
    return lastSent;
  }

  function postChat(model, messages, signal) {
    return respectRateLimit().then(function () {
      lastRequestAt = Date.now();
      return fetch(API_POST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model, private: true, referrer: REFERRER, messages: messages }),
        signal: signal
      });
    }).then(function (res) {
      if (!res || !res.ok) throw makeErr('http', res ? res.status : 0);
      return res.json();
    }).then(function (data) {
      var text = extractText(data);
      if (!text) throw makeErr('empty', 0);
      return { text: text, model: (data && data.model) || model };
    });
  }

  function getChat(signal) {
    var url = API_GET_URL + encodeURIComponent(lastUserText()) +
      '?model=' + MODEL_FAST +
      '&private=true&referrer=' + REFERRER +
      '&system=' + encodeURIComponent(SYSTEM_PROMPT);
    return respectRateLimit().then(function () {
      lastRequestAt = Date.now();
      return fetch(url, { method: 'GET', signal: signal });
    }).then(function (res) {
      if (!res || !res.ok) throw makeErr('http', res ? res.status : 0);
      return res.text();
    }).then(function (t) {
      var text = String(t == null ? '' : t).trim();
      if (!text) throw makeErr('empty', 0);
      return { text: text, model: MODEL_FAST };
    });
  }

  function requestModel() {
    var ctrl = null;
    try { if (typeof AbortController === 'function') ctrl = new AbortController(); } catch (e) { ctrl = null; }
    var signal = ctrl ? ctrl.signal : undefined;
    var timedOut = false;
    var timer = setTimeout(function () {
      timedOut = true;
      if (ctrl) { try { ctrl.abort(); } catch (e) { } }
    }, TIMEOUT_MS);
    inflight = { ctrl: ctrl, timer: timer };

    var step = 0;
    var rateRetries = 0;

    function attempt() {
      step++;
      if (step === 1) return postChat(MODEL_FAST, buildContext(), signal);
      if (step === 2) return postChat(MODEL_MAIN, buildContext(), signal);
      if (step === 3) return getChat(signal);
      return Promise.reject(makeErr('all', 0));
    }

    function run() {
      return attempt().catch(function (err) {
        if (isAbort(err)) throw timedOut ? makeErr('timeout', 0) : makeErr('cancel', 0);

        // خطای سهمیه/شلوغی سرویس: به‌جای پیام خطا، کمی صبر و دوباره تلاش می‌کنیم.
        if (isRateLimit(err) && rateRetries < 3) {
          rateRetries++;
          // آخرین درخواست را عقب می‌اندازیم تا فاصلهٔ لازم رعایت شود
          lastRequestAt = Date.now() + RATE_GAP_MS - (8000 + rateRetries * 5000);
          showStatus('سرویس شلوغ است؛ چند لحظه صبر می‌کنم…');
          return respectRateLimit().then(function () { return run(); });
        }

        if (step >= 3) throw err;
        return run();
      });
    }
    return run();
  }

  function classifyError(err) {
    if (err && err.kind === 'timeout') return 'زمان انتظار تمام شد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.';
    if (err && err.kind === 'offline') return 'اینترنت وصل نیست و پاسخ این پرسش در دانش داخلی اپ نبود. اینترنت را وصل کن و «تلاش دوباره» را بزن.';
    if (err && err.kind === 'cancel') return 'درخواست لغو شد.';
    if (isRateLimit(err)) return 'سرویس هوش مصنوعی الان شلوغ است. چند ثانیه صبر کن و «تلاش دوباره» را بزن.';
    if (isAbort(err)) return 'زمان انتظار تمام شد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.';
    if (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
      return 'اینترنت وصل نیست. اتصال را روشن کن و دوباره تلاش کن.';
    }
    var st = err && err.status;
    if (st === 429) return 'سرور رایگان هوش مصنوعی لحظهٔ شلوغی دارد. چند ثانیه صبر کن و «تلاش دوباره» را بزن.';
    if (st === 402) return 'سهمیهٔ سرویس رایگان برای این لحظه پر شده است. حدود ۱۵ ثانیه صبر کن و دوباره بزن.';
    if (st >= 500) return 'سرور هوش مصنوعی موقتاً پاسخ نمی‌دهد (کد ' + st + '). چند لحظه بعد دوباره تلاش کن.';
    if (st) return 'ارتباط با سرور هوش مصنوعی برقرار نشد (کد ' + st + '). دوباره تلاش کن.';
    if (err && err.kind === 'empty') return 'پاسخ خالی از سرور رسید. دوباره تلاش کن.';
    if (err && err.kind === 'all') return 'هر سه مسیر ارتباط با سرور هوش مصنوعی ناموفق بود. اتصال اینترنت را بررسی کن.';
    return 'ارتباط با سرور هوش مصنوعی برقرار نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.';
  }

  function noop() { }

  // ---------- راه‌اندازی ----------
  function init() {
    if (!document.body.classList.contains('capacitor-mobile')) return;
    loadChat();
    ensureScreen();
    removeHomeCard();
    var tabOk = buildBottomTab();
    if (!tabOk) {
      var tries = 0;
      var waiter = setInterval(function () {
        tries += 1;
        tabOk = buildBottomTab();
        if (tabOk || tries >= 40) clearInterval(waiter);
      }, 250);
    }
    syncActivation();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // ---------- API عمومی (برای پیش‌نمایش اندروید و تست دودی) ----------
  window.MachinistAi = {
    open: openAi,
    home: requestHome,
    send: function (text) { return send(text); },
    retry: retryLast,
    clear: clearChat,
    render: renderRich,
    // --- تصویر و OCR (برای تست دودی و پیش‌نمایش) ---
    attach: function (dataUrl) { return prepareImage(String(dataUrl || '')).then(setAttachment); },
    unattach: clearAttachment,
    attachment: function () {
      return attachment ? { w: attachment.w, h: attachment.h, bytes: attachment.bytes, hasThumb: !!attachment.thumb } : null;
    },
    ocr: function (dataUrl) { return runOcr(String(dataUrl || '')); },
    hints: drawingHints,
    localAnswer: function (t) { var h = matchLocal(t); return h ? h.a : null; },
    offline: isOffline,
    fit: calcFit,
    config: function (patch) {
      if (patch) {
        if (typeof patch.timeoutMs === 'number') TIMEOUT_MS = patch.timeoutMs;
        if (typeof patch.modelFast === 'string') MODEL_FAST = patch.modelFast;
        if (typeof patch.modelMain === 'string') MODEL_MAIN = patch.modelMain;
        if (typeof patch.rateGapMs === 'number') RATE_GAP_MS = patch.rateGapMs;
        if (typeof patch.ocrMinConfidence === 'number') OCR_MIN_CONFIDENCE = patch.ocrMinConfidence;
      }
      return {
        apiUrl: API_POST_URL, modelFast: MODEL_FAST, modelMain: MODEL_MAIN,
        timeoutMs: TIMEOUT_MS, ocrPath: OCR_PATH,
        // مدل رایگان فعلی متنی است؛ تصویر مستقیم فرستاده نمی‌شود
        vision: false, modelIsTextOnly: true,
        rateGapMs: RATE_GAP_MS, ocrMinConfidence: OCR_MIN_CONFIDENCE
      };
    },
    state: function () {
      return {
        active: isActive(),
        panel: PANEL_KEY,
        pending: pending,
        messages: chat.map(function (m) {
          return {
            role: m.role, text: m.text, error: !!m.error, local: !!m.local,
            img: m.img ? { w: m.img.w, h: m.img.h, thumb: m.img.thumb } : null,
            ocr: m.ocr || '', ocrConf: m.ocrConf || 0, ocrUseful: !!m.ocrUseful
          };
        }),
        suggestions: SUGGESTIONS.slice(),
        lastSent: lastSent,
        error: lastError,
        statusText: refs.status ? String(refs.status.textContent || '') : '',
        inputValue: refs.input ? String(refs.input.value || '') : '',
        sendDisabled: !!(refs.send && refs.send.disabled),
        hasImage: !!attachment,
        image: attachment ? { w: attachment.w, h: attachment.h, bytes: attachment.bytes, hasThumb: !!attachment.thumb } : null,
        imageInMessages: chat.filter(function (m) { return !!m.img; }).length,
        localEntries: LOCAL_KB.length,
        vision: VISION_ENABLED,
        cardInHome: !!document.querySelector('.mobile-grid [data-tool="' + PANEL_KEY + '"]'),
        tabInBar: !!document.querySelector('.mobile-tabbar .tab[data-action="' + PANEL_KEY + '"]'),
        panelInDom: !!document.querySelector('.mobile-ai')
      };
    }
  };
})();


