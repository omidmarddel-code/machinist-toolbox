// ===== Machinist Toolbox — Mobile UI (matches Figma mockup) =====
// Home: hero + 6 cards | header: search | bottom tab bar
(function () {
  'use strict';

  var isAndroid = false;
  try {
    isAndroid = window.Capacitor && window.Capacitor.getPlatform() === 'android';
  } catch (e) { /* noop */ }
  if (!isAndroid && /Android/i.test(navigator.userAgent)) isAndroid = true;

  var isPreview = false;
  try {
    isPreview = new URLSearchParams(window.location.search).get('mobile') === 'preview';
  } catch (e) { /* noop */ }
  // پیش‌نمایش داخل android-preview.html همیشه رابط موبایل را نشان بده
  var inFrame = false;
  try { inFrame = window.self !== window.top; } catch (e) { inFrame = true; }
  if (inFrame) isPreview = true;
  // فقط نسخه اندروید: Capacitor واقعی، WebView اندروید، یا حالت پیش‌نمایش.
  // مرورگر موبایل سایت شامل نمی‌شود تا ظاهر سایت دست‌نخورده بماند.
  if (!isAndroid && !isPreview) return;
  var bootedForMobile = false;
  try { bootedForMobile = document.documentElement.classList.contains('android-boot'); } catch (e) {}


  document.body.classList.add('capacitor-mobile');
  document.documentElement.setAttribute('data-theme', 'light');
  try { localStorage.setItem('theme', 'light'); } catch (e) {}

  var navHistory = [];
  var notesCard = document.querySelector('.notes-card');
  var contactCard = null; // پنل «تماس با ما» به‌صورت درون‌برنامه‌ای (بدون ترک صفحه/لود مجدد)
  var quizCard = null;    // صفحه «آزمون برنامه‌نویسی» (فقط نسخه اندروید)
  var quizState = null;   // وضعیت جاری آزمون: ترتیب سؤال‌ها، امتیاز و پاسخ‌های ثبت‌شده
  var capacitorApp = null;
  var lastBackAt = 0;

  // Six home destinations — same actions as the mockup cards
  var HOME_TOOLS = {
    calculations: 'calculations',
    materials: 'materials',
    booklets: 'booklets',
    standards: 'standards'
  };

  // ---------- آزمون برنامه‌نویسی: بانک سؤال (تراش Fanuc) ----------
  // letter + answer = پاسخ درست؛ در نمونه‌کد، هرجا همین کد آمده باشد با «جای خالی» نشان داده می‌شود
  // تا کاربر فقط عدد را وارد کند (مثلاً برای G76 عدد 76).
  var QUIZ_BANK = [
    {
      letter: 'G', answer: '71', tag: 'سیکل تراش',
      title: 'خشن‌تراشی طولی (Longitudinal Roughing)',
      desc: 'خشن‌تراشی طولی؛ پروفیل بین بلوک‌های P و Q را با چند پاس موازی محور Z برمی‌دارد.',
      code: ['G71 U2.0 R0.5;', 'G71 P0100 Q0200 U0.4 W0.1 F0.25;'],
      hint: 'خط اول: U عمق برش هر پاس و R مقدار برگشت ابزار. خط دوم: P/Q بلوک شروع و پایان پروفیل، U/W مقدار پرداخت در X و Z و F پیشروی.'
    },
    {
      letter: 'G', answer: '70', tag: 'سیکل تراش',
      title: 'سیکل پرداخت (Finishing Cycle)',
      desc: 'پس از خشن‌تراشی با G71/G72/G73، همین سیکل پروفیل بین P و Q را با پیشروی و دور پرداخت اجرا می‌کند.',
      code: ['G71 U2.0 R0.5;', 'G71 P0100 Q0200 U0.4 W0.1 F0.25;', 'G70 P0100 Q0200;'],
      hint: 'بلوک‌های P تا Q باید همهٔ مسیر پرداخت را داشته باشند؛ پیشروی پرداخت را با F در بلوک‌های پروفیل تعیین کن.'
    },
    {
      letter: 'G', answer: '72', tag: 'سیکل تراش',
      title: 'خشن‌تراشی پیشانی (Facing Cycle)',
      desc: 'خشن‌تراشی پیشانی برای قطعات کوتاه و کارهای قالبی؛ عمق هر پاس در راستای Z است.',
      code: ['G72 W1.5 R0.5;', 'G72 P0100 Q0200 U0.2 W0.05 F0.2;'],
      hint: 'تفاوت اصلی با G71 این است که در خط اول به‌جای U، آدرس W (عمق برش در محور Z) نوشته می‌شود؛ R مقدار برگشت است.'
    },
    {
      letter: 'G', answer: '73', tag: 'سیکل تراش',
      title: 'الگو تکرارشونده (Pattern Repeating)',
      desc: 'خشن‌تراشی به شکل کپیِ پروفیل؛ مناسب قطعات ریختگی و فورج که پروفیل آماده دارند و فقط لایهٔ سطحی برداشته می‌شود.',
      code: ['G73 U5.0 W0.0 R5;', 'G73 P0100 Q0200 U0.4 W0.1 F0.25;'],
      hint: 'خط اول: U و W کل مقدار اضافهٔ پروفیل در X و Z و R تعداد تقسیم پاس‌ها (تعداد پاس خشن‌تراشی) است.'
    },
    {
      letter: 'G', answer: '74', tag: 'سیکل تراش',
      title: 'سوراخ‌کاری پله‌پله (Peck Drilling)',
      desc: 'مته را پله‌پله در محور Z جلو می‌برد و براده را می‌شکند؛ روی محور (اسپیندل) و پیشانی کاربرد دارد.',
      code: ['T0707;', 'G97 S600 M03;', 'G00 X0.0 Z2.0;', 'G74 R0.5;', 'G74 X0.0 Z-40.0 P3000 Q5000 F0.12;'],
      hint: 'R مقدار برگشت (فاصلهٔ امن) ابزار در ابتدای هر پله است؛ برای سوراخکاری، Q عمق هر پله در راستای Z و P عمق برش در راستای X (کاربرد شیارزنی پیشانی) است. X/Z مختصات پایان مسیر هستند (X0 یعنی روی مرکز) و واحد P و Q معمولاً 0.001 mm است.'
    },
    {
      letter: 'G', answer: '75', tag: 'سیکل تراش',
      title: 'شیارزنی (Grooving Cycle)',
      desc: 'شیارزنی روی قطر خارجی یا داخلی؛ اگر عرض شیار از ابزار بیشتر باشد، سیکل با گام Q عرض شیار را پله‌پله باز می‌کند.',
      code: ['T0505;', 'G97 S700 M03;', 'G00 X62.0 Z-30.0;', 'G75 R0.5;', 'G75 X50.0 Z-30.0 P3000 Q4000 F0.1;'],
      hint: 'در خط اول R مقدار برگشت ابزار در هر پاس است. در خط دوم P عمق هر برش در محور X (شعاعی) و Q گام جابه‌جایی در راستای Z (پهن‌کردن شیار) است؛ با آدرس R دوم می‌توان ته شیار را آزاد (relief) کرد.'
    },
    {
      letter: 'G', answer: '76', tag: 'سیکل تراش',
      title: 'رزوه‌زنی چندپاس (Threading Cycle)',
      desc: 'رزوه‌زنی با چند پاس، کنترل عمق برش و زاویهٔ نوک ابزار؛ پرکاربردترین سیکل رزوه روی تراش فانوک.',
      code: ['T0303;', 'G97 S700 M03;', 'G00 X32.0 Z5.0;', 'G76 P010060 Q100 R0.05;', 'G76 X27.6 Z-40.0 P1200 Q300 F2.0;'],
      hint: 'P010060 یعنی 01 پاس پرداخت، 00 پخ خروجی و 60 درجه زاویهٔ نوک ابزار؛ Q حداقل عمق برش و R مقدار پرداخت است. در خط دوم X قطر ته رزوه (برای M30×2 حدود 27.5)، P ارتفاع رزوه (P1200 = 1.2 mm شعاعی)، Q عمق اولین برش و F گام رزوه است؛ نقطهٔ شروع باید کمی بالاتر از قطر خارجی باشد.'
    },
    {
      letter: 'G', answer: '90', tag: 'سیکل تراش',
      title: 'سیکل تراش ساده (Turning Cycle)',
      desc: 'تراش ساده با هندسهٔ مستطیلی (Box)؛ در یک بلوک، حرکت در X و Z را با پیشروی F انجام می‌دهد.',
      code: ['T0101;', 'G97 S900 M03;', 'G00 X62.0 Z2.0;', 'G90 X55.0 Z-30.0 F0.25;', 'G90 X50.0 Z-30.0 F0.25;'],
      hint: 'برای هر پاس جدید همان بلوک را با X کمتر تکرار کن؛ در سیکل‌های سادهٔ تراش می‌توانی با U و W هم مسیر نسبی بدهی.'
    },
    {
      letter: 'G', answer: '92', tag: 'سیکل تراش',
      title: 'سیکل رزوه‌زنی ساده (Threading Cycle)',
      desc: 'رزوه‌زنی سادهٔ تک‌پاس؛ با تکرار بلوک و کم‌کردن تدریجی X، عمق رزوه پله‌پله ساخته می‌شود.',
      code: ['T0303;', 'G97 S800 M03;', 'G00 X42.0 Z5.0;', 'G92 X39.6 Z-28.0 F1.5;', 'X39.1;', 'X38.7;', 'X38.2;'],
      hint: 'F گام رزوه است (1.5 mm برای M40×1.5) و دور اسپیندل باید پیش از ورود به بلوک برقرار باشد؛ هر بلوک بعدی قطر مرحلهٔ بعد را می‌سازد (ته رزوهٔ M40×1.5 حدود 38.16 است). ورود ابزار در این سیکل مستقیم (شعاعی) و بدون پخ/زاویه است؛ برای رزوه‌های بزرگ‌تر G76 بهتر است.'
    },
    {
      letter: 'G', answer: '94', tag: 'سیکل تراش',
      title: 'سیکل پیشانی ساده (Face Turning Cycle)',
      desc: 'سیکل پیشانی‌تراشی ساده؛ ابزار در عمق Z تعیین‌شده در محور X تا نزدیک مرکز پیشروی می‌کند و هر پاس بعدی با Z کمتر جلو می‌رود.',
      code: ['T0101;', 'G97 S900 M03;', 'G00 X62.0 Z3.0;', 'G94 X-1.6 Z0.0 F0.2;'],
      hint: 'این سیکل تقریباً برعکس G90 است: برش در محور X انجام می‌شود و مقدار Z عمق پاس را تعیین می‌کند. برای پاس‌های بعدی فقط بلوک را با Z کمتر تکرار کن (مثلاً Z-1.5) و در پایان سیکل را با یک حرکت سریع G00 لغو کن.'
    },
    {
      letter: 'G', answer: '04', tag: 'کد عمومی G',
      title: 'تأخیر (Dwell)',
      desc: 'توقف کوتاه برنامه؛ برای پاک‌کردن ته شیار، صافی سطح در انتهای برش یا واردشدن کامل اسپیندل به دور.',
      code: ['G01 X50.0 Z-20.0 F0.15;', 'G04 X1.0;', 'G01 X54.0;'],
      hint: 'با آدرس X واحد ثانیه و با آدرس P واحد میلی‌ثانیه است؛ مثلاً G04 P500 یعنی نیم ثانیه توقف.'
    },
    {
      letter: 'G', answer: '28', tag: 'کد عمومی G',
      title: 'بازگشت به نقطهٔ مرجع (Return to Reference)',
      desc: 'ابزار را به نقطهٔ صفر ماشین (خانه) برمی‌گرداند؛ نقطهٔ امن برای تعویض ابزار و شروع برنامه.',
      code: ['G00 X100.0 Z50.0;', 'G28 U0.0 W0.0;', 'T0202;'],
      hint: 'اگر U و W صفر باشند، ابزار از نقطهٔ فعلی همان‌جا به مرجع می‌رود؛ این برگشت را پیش از تعویض ابزار و در پایان کار انجام بده. روی کنترل‌های جدیدتر می‌توانی به‌جای G28 از یک موقعیت امن مطلق (مثل G00 X150. Z100.) استفاده کنی.'
    },
    {
      letter: 'G', answer: '96', tag: 'کد عمومی G',
      title: 'سرعت برش ثابت (Constant Surface Speed)',
      desc: 'با تغییر قطر کار، دور اسپیندل را خودکار کم و زیاد می‌کند تا سرعت برش (متر بر دقیقه) ثابت بماند.',
      code: ['G50 S2000;', 'G96 S180 M03;', 'G00 X60.0 Z2.0;', 'G01 X20.0 Z-5.0 F0.15;', 'G97 S900;'],
      hint: 'عدد S بر حسب متر بر دقیقه (در حالت اینچ، فوت بر دقیقه) است و پیش از آن باید با G50 سقف دور اسپیندل را تعیین کنی؛ با کوچک‌شدن قطر، دور بالا می‌رود. در پایان با G97 به دور ثابت برگرد.'
    },
    {
      letter: 'G', answer: '97', tag: 'کد عمومی G',
      title: 'دور ثابت اسپیندل (Constant Spindle Speed)',
      desc: 'دور اسپیندل را ثابت (RPM) نگه می‌دارد؛ حالت پیش‌فرض سوراخ‌کاری، قلاویززنی و رزوه‌زنی.',
      code: ['T0101;', 'G97 S900 M03;', 'G00 X20.0 Z0.0;', 'G01 X-1.6 F0.15;'],
      hint: 'در این حالت با تغییر قطر، دور عوض نمی‌شود؛ هر وقت خواستی به حالت سرعت برش ثابت برگردی از G96 استفاده کن.'
    },
    {
      letter: 'G', answer: '98', tag: 'کد عمومی G',
      title: 'پیشروی بر دقیقه (Feed per Minute)',
      desc: 'واحد پیشروی را میلی‌متر بر دقیقه (mm/min) تعریف می‌کند؛ تا وقتی فعال است عدد F یعنی mm در دقیقه.',
      code: ['G97 S800 M03;', 'G98 G01 Z-50.0 F120;'],
      hint: 'در این حالت سرعت پیشروی به دور اسپیندل وابسته نیست؛ اگر می‌خواهی سرعت برش با دور عوض نشود، با G99 به mm/rev برگرد.'
    },
    {
      letter: 'G', answer: '99', tag: 'کد عمومی G',
      title: 'پیشروی بر دور (Feed per Revolution)',
      desc: 'واحد پیشروی را میلی‌متر بر دور اسپیندل تعریف می‌کند؛ حالت رایج تراشکاری و شرط لازم برای رزوهٔ تمیز.',
      code: ['G97 S800 M03;', 'G99 G01 Z-50.0 F0.15;'],
      hint: 'F0.15 یعنی 0.15 میلی‌متر در هر دور؛ در این حالت کیفیت سطح مستقل از دور اسپیندل می‌ماند.'
    },
    {
      letter: 'G', answer: '42', tag: 'کد عمومی G',
      title: 'جبران شعاع نوک ابزار - سمت راست (Tool Nose R)',
      desc: 'مسیر را به‌اندازهٔ شعاع نوک ابزار جابه‌جا می‌کند؛ کدی که ابزار را در سمت راست مسیر جبران می‌کند.',
      code: ['T0303;', 'G00 X32.0 Z2.0;', 'G42 G01 X30.0 Z0.0 F0.15;', 'G01 X40.0;', 'G03 X50.0 Z-5.0 R5.0;', 'G40 G00 X55.0 Z5.0;'],
      hint: 'شعاع نوک ابزار باید در آفست ابزار (ستون R) و نوع نوک (ستون T) ثبت شده باشد. جبران را با حرکت بدون برش (G00/G01) فعال و با G40 لغو کن؛ برای تراشکاری خارجی معمولاً همین سمت راست و برای داخل‌تراشی سمت چپ (G41) به کار می‌رود.'
    },
    {
      letter: 'G', answer: '54', tag: 'کد عمومی G',
      title: 'دستگاه مختصات کاری (Work Coordinate System)',
      desc: 'یکی از دستگاه‌های مختصات کاری (صفر قطعه) را فعال می‌کند؛ رایج‌ترین انتخاب صفر قطعه روی تراش.',
      code: ['G54 G00 X100.0 Z50.0;', 'T0101;', 'M03 S900;'],
      hint: 'این کد اولین دستگاه مختصات کاری است و G55 تا G59 دستگاه‌های بعدی‌اند؛ مقدار صفر قطعه در آفست کاری ماشین ذخیره می‌شود. در برنامه‌های قدیمی‌تر تراش، G50 X.. Z.. این کار را انجام می‌داد.'
    },
    {
      letter: 'M', answer: '03', tag: 'کد M',
      title: 'چرخش اسپیندل در جهت راست (Spindle Forward)',
      desc: 'اسپیندل را راستگرد می‌چرخاند؛ برای ابزارگیری و بیشتر کارهای تراشکاری استفاده می‌شود.',
      code: ['T0101;', 'G97 S900 M03;', 'G00 X60.0 Z2.0;'],
      hint: 'این کد راستگرد، M04 چپگرد و M05 توقف اسپیندل است؛ دور را با S و G97/G96 تعیین کن.'
    },
    {
      letter: 'M', answer: '08', tag: 'کد M',
      title: 'روشن‌کردن خنک‌کننده (Coolant On)',
      desc: 'پمپ مایع خنک‌کننده (آب‌صابون) را روشن می‌کند؛ معمولاً پیش از شروع برش داخل برنامه قرار می‌گیرد.',
      code: ['T0101;', 'G97 S900 M03;', 'G00 X62.0 Z2.0;', 'M08;', 'G01 X55.0 Z-30.0 F0.25;'],
      hint: 'این کد خنک‌کننده را روشن و M09 آن را خاموش می‌کند؛ در بعضی ماشین‌ها M07 برای مه‌پاش (mist) به کار می‌رود.'
    }
  ];

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function buildChrome() {
    // 1) header: search
    var header = document.querySelector('.mobile-header-bar');
    if (!header) {
      header = el('header', 'mobile-header-bar');
      document.body.insertBefore(header, document.body.firstChild);
    }
    header.setAttribute('aria-label', 'منوی موبایل');
    header.innerHTML =
      '<h1 class="header-title">MACHINIST TOOL BOX</h1>' +
      '<span class="header-spacer"></span>' +
      '<button class="search-btn" type="button" aria-label="جستجو">⌕</button>';

    // 2) search row under header
    var searchbar = document.querySelector('.mobile-searchbar');
    if (!searchbar) {
      searchbar = el('div', 'mobile-searchbar');
      searchbar.innerHTML = '<input type="search" placeholder="جستجو ابزار، متریال، جزوه…" aria-label="جستجو" />';
      document.body.insertBefore(searchbar, header.nextSibling);
    }
    var searchResults = document.querySelector('.mobile-search-results');
    if (!searchResults) {
      searchResults = el('div', 'mobile-search-results');
      document.body.insertBefore(searchResults, searchbar.nextSibling);
    }

    // 3) bottom tab bar: both education sections are inside one button (RTL)
    var tabbar = document.querySelector('.mobile-tabbar');
    if (!tabbar) {
      tabbar = el('nav', 'mobile-tabbar');
      tabbar.setAttribute('aria-label', 'ناوبری اصلی');
      document.body.appendChild(tabbar);
    }
    tabbar.innerHTML =
      tab('calculations', '🛠️', 'ابزارها') +
      tab('education', '📖', 'آموزش') +
      tab('home', '⌂', 'خانه') +
      tab('notes', '📝', 'یادداشت‌ها') +
      tab('materials', '📚', 'متریال');

    function tab(action, icon, label) {
      return '<button class="tab" data-action="' + action + '" type="button">' +
        '<span class="t-icon">' + icon + '</span><span>' + label + '</span></button>';
    }

    wireEvents(header, searchbar, searchResults, tabbar);
  }

  function wireEvents(header, searchbar, searchResults, tabbar) {
    var sBtn = header.querySelector('.search-btn');
    var sInput = searchbar.querySelector('input');
    sBtn.addEventListener('click', function () {
      var open = searchbar.classList.toggle('open');
      if (open) sInput.focus();
      else {
        sInput.value = '';
        filterPanels('', searchResults);
      }
    });
    sInput.addEventListener('input', function () {
      filterPanels(sInput.value.trim(), searchResults);
    });

    tabbar.querySelectorAll('.tab').forEach(function (b) {
      b.addEventListener('click', function () { go(b.dataset.action); });
    });

    bindPdfButtons();
    bindDesktopCards();
  }

  function normalizeSearchText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[يى]/g, 'ی')
      .replace(/[ك]/g, 'ک')
      .replace(/[\u200c\u200f\u200e]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function filterPanels(q, results) {
    var query = normalizeSearchText(q);
    var cards = Array.prototype.slice.call(document.querySelectorAll('.m-card, .tool-card[data-tool]'));
    var matches = [];
    var seen = {};

    cards.forEach(function (card) {
      var text = normalizeSearchText(card.textContent + ' ' + card.dataset.tool);
      var matched = !query || text.indexOf(query) !== -1;
      if (card.classList.contains('m-card')) card.style.display = matched ? '' : 'none';
      if (query && matched && !seen[card.dataset.tool]) {
        seen[card.dataset.tool] = true;
        matches.push({ action: card.dataset.tool, label: card.textContent.replace(/\s+/g, ' ').trim() });
      }
    });

    results.innerHTML = '';
    results.classList.toggle('open', Boolean(query));
    if (!query) return;
    if (!matches.length) {
      results.innerHTML = '<p class="search-empty">نتیجه‌ای پیدا نشد</p>';
      return;
    }
    matches.forEach(function (match) {
      var result = el('button', 'search-result', '🔎 ' + match.label);
      result.type = 'button';
      result.addEventListener('click', function () {
        var input = document.querySelector('.mobile-searchbar input');
        if (input) input.value = '';
        var bar = document.querySelector('.mobile-searchbar');
        if (bar) bar.classList.remove('open');
        results.classList.remove('open');
        go(match.action);
      });
      results.appendChild(result);
    });
  }

  function bindPdfButtons() {
    document.querySelectorAll('.pdf-open-button').forEach(function (btn) {
      if (btn.dataset.bound === 'true') return;
      btn.dataset.bound = 'true';
      btn.addEventListener('click', function () {
        var f = btn.dataset.pdf;
        if (!f) return;
        if (window.AndroidPdf && typeof window.AndroidPdf.open === 'function') window.AndroidPdf.open(f);
        else window.open('pdf/' + f, '_blank');
      });
    });
  }

  function bindDesktopCards() {
    document.querySelectorAll('.tool-card[data-tool]').forEach(function (card) {
      if (card.dataset.mobileBound === 'true') return;
      card.dataset.mobileBound = 'true';
      card.addEventListener('click', function () {
        var tool = card.dataset.tool;
        if (!tool) return;
        // اگر همین صفحه الان باز است، کاری نکن (جلوگیری از push تکراری)
        if (visiblePanelKey() === tool) return;
        if (typeof switchTool === 'function') {
          // کارت‌های داخل ابزار (مثل جزوه‌ها، متریال‌ها): صفحه قبلی را در تاریخچه نگه دار
          pushNavState();
          openPanel(tool);
        }
      }, true);
    });
  }


  // ---------- home screen (hero + 6 cards, like the mockup) ----------
  function buildHome() {
    if (document.querySelector('.mobile-home')) return;
    var ws = document.querySelector('.workspace');
    if (!ws) return;
    var home = el('div', 'mobile-home');
    home.innerHTML =
      '<div class="mobile-hero">' +
        // لوگوی ایزی پایپ در نسخه اندروید نمایش داده نمی‌شود (نسخه وب دست‌نخورده است)
        '<p class="mobile-signature">omid marddel</p>' +
        '<h2>Machinist <span class="accent">Toolbox</span></h2>' +
        '<p>Tools <span>•</span> Knowledge <span>•</span> Machining</p>' +
      '</div>' +
      '<div class="mobile-grid">' +
        mCard('standards', 'c-green', '📏', 'Standards', 'استانداردها') +
        mCard('booklets', 'c-orange', '📖', 'CNC Books', 'کتاب‌های CNC') +
        mCard('materials', 'c-purple', '📚', 'Materials', 'متریال') +
        mCard('programmingTraining', 'c-yellow', '🧠', 'Programming', 'آموزش برنامه‌نویسی') +
        mCardWide('programmingQuiz', 'c-teal', '🎯', 'Programming Quiz', 'آزمون برنامه‌نویسی') +
        mCard('calculator', 'c-blue', '🧮', 'Calculator', 'ماشین‌حساب مهندسی') +
        mCard('contact', 'c-gray', '👨‍💻', 'Contact', 'تماس با ما') +
      '</div>';
    ws.insertBefore(home, ws.firstChild);
    home.querySelectorAll('.m-card').forEach(function (b) {
      b.addEventListener('click', function () { go(b.dataset.action); });
    });
  }

  function mCard(action, color, icon, en, fa) {
    return '<button class="m-card ' + color + '" data-action="' + action + '" type="button">' +
      '<span class="m-icon">' + icon + '</span>' +
      '<span class="m-en">' + en + '</span>' +
      '<span class="m-fa">' + fa + '</span></button>';
  }

  // کارت تمام‌عرض (مثل «آزمون برنامه‌نویسی»)
  function mCardWide(action, color, icon, en, fa) {
    return '<button class="m-card m-wide ' + color + '" data-action="' + action + '" type="button">' +
      '<span class="m-icon">' + icon + '</span>' +
      '<span class="m-texts"><span class="m-en">' + en + '</span>' +
      '<span class="m-fa">' + fa + '</span></span></button>';
  }

  // ---------- contact screen (in-app, full screen — no page reload, Android only) ----------
  // فقط نسخه اندروید: نسخه وب contact.html خودش دست‌نخورده است.
  function buildContact() {
    if (contactCard || document.querySelector('.mobile-contact')) {
      contactCard = contactCard || document.querySelector('.mobile-contact');
      return;
    }
    var ws = document.querySelector('.workspace');
    if (!ws) return;
    var card = el('div', 'mobile-contact');
    card.setAttribute('aria-label', 'تماس با ما');
    // بدون دکمه بازگشت، بدون دکمه تم، بدون دکمه دانلود اندروید (طبق درخواست)
    card.innerHTML =
      '<img class="mc-avatar" src="images/omid/omid.jpg" alt="عکس امید مرددل">' +
      '<h2 class="mc-name">Omid Marddel</h2>' +
      '<p class="mc-role">Developer &amp; Machinist Engineer</p>' +
      '<div class="mc-actions">' +
        '<a class="mc-btn call" href="tel:09197392944">' +
          '<span class="mc-ico">📞</span><span class="mc-txt">09197392944</span></a>' +
        '<a class="mc-btn mail" href="mailto:omidmarddel@gmail.com">' +
          '<span class="mc-ico">✉️</span><span class="mc-txt">omidmarddel@gmail.com</span></a>' +
      '</div>' +
      '<div class="mc-social">' +
        '<a class="mc-btn wa" href="https://wa.me/989197392944" target="_blank" rel="noopener">' +
          '<span class="mc-ico">💬</span><span class="mc-txt">WhatsApp</span></a>' +
        '<a class="mc-btn tg" href="https://t.me/omidmarddel" target="_blank" rel="noopener">' +
          '<span class="mc-ico">✈️</span><span class="mc-txt">Telegram</span></a>' +
      '</div>' +
      '<div class="mc-row"><span class="mc-ico">🛠️</span>' +
        '<span class="mc-txt">Project</span><span class="mc-val">Machinist Tool Box</span></div>' +
      '<div class="mc-row"><span class="mc-ico">📦</span>' +
        '<span class="mc-txt">Version</span><span class="mc-val">1.0.0</span></div>' +
      '<p class="mc-foot">© 2026 Omid Marddel</p>';
    ws.insertBefore(card, ws.firstChild);
    contactCard = card;
  }

  function closeContact() {
    if (!contactCard || !contactCard.classList.contains('active')) return;
    contactCard.classList.remove('active');
    // خروج از این صفحه «یک قدم» است، نه یک انتقال جدید → از ثبت اشتباه در تاریخچه جلوگیری کن
    // خروج از این صفحه توسط ناظر به‌عنوان «یک قدم» ثبت می‌شود — lastShown را دست نزن
  }

  function showContact() {
    trackPanelChange(); // وضعیت فعلی را ثبت کن تا Back دقیقاً یک قدم برگردد
    closeNotes();
    closeQuiz();
    document.querySelectorAll('.tool-panel').forEach(function (p) {
      p.hidden = true; p.classList.remove('active');
    });
    hideHomePanels();
    buildContact();
    if (contactCard) { contactCard.classList.add('active'); animateMobilePage(contactCard); }
    setActiveTab('contact');
    window.scrollTo(0, 0);
    trackPanelChange(); // ورود به صفحه تماس را در تاریخچه ثبت کن
  }


  // ---------- آزمون برنامه‌نویسی (in-app, full screen — Android only) ----------
  // تنها نسخه اندروید: نسخه وب این صفحه را ندارد.
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function shuffleList(list) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  // «76»، «077»، «G76» و «۷۶» همه یک جواب حساب می‌شوند
  function normalizeQuizAnswer(value) {
    var s = String(value == null ? '' : value);
    s = s.replace(/[\u06F0-\u06F9]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); })
      .replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); });
    s = s.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
    s = s.replace(/^[GM]/, '');
    return s.replace(/^0+/, '');
  }

  // هرجا کدِ پاسخ در نمونه‌برنامه آمده باشد با __ خالی می‌شود (جای شمارهٔ سیکل)
  function blankCodeLines(item) {
    var pattern = new RegExp('\\b' + item.letter + item.answer + '\\b', 'g');
    var blank = '<span class="mq-blank">' + item.letter + '__</span>';
    return item.code.map(function (line) {
      return escapeHtml(line).replace(pattern, blank);
    }).join('\n');
  }

  function buildQuiz() {
    if (quizCard || document.querySelector('.mobile-quiz')) {
      quizCard = quizCard || document.querySelector('.mobile-quiz');
      return;
    }
    var ws = document.querySelector('.workspace');
    if (!ws) return;
    var card = el('div', 'mobile-quiz');
    card.setAttribute('aria-label', 'آزمون برنامه‌نویسی');
    card.innerHTML =
      '<div class="mq-top">' +
        '<button class="mq-close" type="button" aria-label="بستن آزمون">✕</button>' +
        '<div class="mq-progress"><span class="mq-progress-fill"></span></div>' +
        '<span class="mq-counter">1 / ' + QUIZ_BANK.length + '</span>' +
      '</div>' +
      '<h2 class="mq-title">🎯 آزمون برنامه‌نویسی تراش فانوک</h2>' +
      '<p class="mq-lead">در هر سؤال یک تکه برنامهٔ تراش فانوک می‌بینی و جای یکی از کدها با ' +
        '<span class="mq-blank">G__</span> خالی شده است. فقط <b>عدد</b> آن را وارد کن و «بررسی» را بزن ' +
        '(مثلاً برای G76 عدد 76). پاسخ غلط خودش می‌رود سؤال بعد و در پایان لیست غلط‌ها را می‌بینی.</p>' +
      '<div class="mq-question"></div>' +
      '<div class="mq-feedback" aria-live="polite"></div>' +
      '<div class="mq-result" hidden></div>';
    ws.insertBefore(card, ws.firstChild);
    quizCard = card;
    card.querySelector('.mq-close').addEventListener('click', function () {
      closeQuiz();
      showHome();
    });
  }

  function closeQuiz() {
    if (quizState && quizState.timer) { clearTimeout(quizState.timer); }
    quizState = null;
    if (!quizCard || !quizCard.classList.contains('active')) return;
    quizCard.classList.remove('active');
  }

  function showQuiz() {
    trackPanelChange(); // مسیر فعلی را ثبت کن تا Back یک قدم درست برگردد
    closeMobileCalculator();
    closeContact();
    closeNotes();
    document.querySelectorAll('.tool-panel').forEach(function (p) {
      p.hidden = true; p.classList.remove('active');
    });
    hideHomePanels();
    buildQuiz();
    if (quizCard) { quizCard.classList.add('active'); animateMobilePage(quizCard); }
    setActiveTab('programmingQuiz');
    startQuiz();
    window.scrollTo(0, 0);
    trackPanelChange(); // ورود به آزمون را در تاریخچه ثبت کن
  }

  function startQuiz() {
    quizState = {
      order: shuffleList(QUIZ_BANK.map(function (item, index) { return index; })),
      index: 0,
      correct: 0,
      answers: [],   // { item, given, ok }
      locked: false,
      timer: null
    };
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    if (!quizCard || !quizState) return;
    var st = quizState;
    var total = st.order.length;
    var item = QUIZ_BANK[st.order[st.index]];
    var qBox = quizCard.querySelector('.mq-question');
    var feedback = quizCard.querySelector('.mq-feedback');
    var result = quizCard.querySelector('.mq-result');

    result.hidden = true;
    result.innerHTML = '';
    feedback.className = 'mq-feedback';
    feedback.innerHTML = '';
    quizCard.querySelector('.mq-title').hidden = false;
    quizCard.querySelector('.mq-lead').hidden = false;
    quizCard.querySelector('.mq-counter').textContent = (st.index + 1) + ' / ' + total;
    quizCard.querySelector('.mq-progress-fill').style.width = Math.round((st.index / total) * 100) + '%';

    qBox.innerHTML =
      '<span class="mq-tag">' + escapeHtml(item.tag) + '</span>' +
      '<h3 class="mq-q-title">' + escapeHtml(item.title) + '</h3>' +
      '<p class="mq-q-desc">' + escapeHtml(item.desc) + '</p>' +
      '<pre class="mq-code"><code>' + blankCodeLines(item) + '</code></pre>' +
      '<p class="mq-q-ask">عددِ جای خالی چند است؟ (فقط عدد؛ حرف ' + item.letter + ' را وارد نکن)</p>' +
      '<form class="mq-form">' +
        '<label class="mq-input-wrap">' +
          '<span class="mq-input-prefix">' + item.letter + '</span>' +
          '<input class="mq-input" type="text" inputmode="numeric" autocomplete="off" autocorrect="off" ' +
            'spellcheck="false" maxlength="3" placeholder="__" aria-label="پاسخ عددی">' +
        '</label>' +
        '<button class="mq-check" type="submit">بررسی</button>' +
      '</form>';

    var form = qBox.querySelector('.mq-form');
    var input = qBox.querySelector('.mq-input');
    form.addEventListener('submit', function (ev) {
      if (ev && ev.preventDefault) ev.preventDefault();
      submitQuizAnswer(input.value);
    });
    if (quizCard.scrollTop) quizCard.scrollTop = 0;
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 150);
  }

  function submitQuizAnswer(rawValue) {
    if (!quizCard || !quizState || quizState.locked) return;
    var st = quizState;
    var item = QUIZ_BANK[st.order[st.index]];
    var feedback = quizCard.querySelector('.mq-feedback');
    var given = normalizeQuizAnswer(rawValue);
    if (!given) {
      feedback.className = 'mq-feedback warn';
      feedback.innerHTML = '⚠️ یک عدد وارد کن (حرف ' + item.letter + ' لازم نیست؛ فقط عدد).';
      return;
    }
    st.locked = true;
    if (given === normalizeQuizAnswer(item.answer)) st.correct++;
    st.answers.push({
      item: item,
      given: String(rawValue).replace(/\s+/g, '').trim() || '—',
      ok: given === normalizeQuizAnswer(item.answer)
    });
    showQuizFeedback();
  }

  function showQuizFeedback() {
    if (!quizCard || !quizState) return;
    var st = quizState;
    var record = st.answers[st.answers.length - 1];
    if (!record) return;
    var item = record.item;
    var feedback = quizCard.querySelector('.mq-feedback');
    var input = quizCard.querySelector('.mq-input');
    var isLast = st.index >= st.order.length - 1;
    if (input) { input.disabled = true; try { input.blur(); } catch (e) {} }
    var checkBtn = quizCard.querySelector('.mq-check');
    if (checkBtn) checkBtn.disabled = true;
    feedback.className = 'mq-feedback ' + (record.ok ? 'ok' : 'bad');
    feedback.innerHTML =
      '<p class="mq-verdict">' + (record.ok ? '✓ صحیح' : '✗ غلط') + '</p>' +
      '<p class="mq-answer">پاسخ درست: <b>' + item.letter + item.answer + '</b>' +
        (record.ok ? '' : ' — پاسخ تو: <b>' + escapeHtml(record.given) + '</b>') + '</p>' +
      '<p class="mq-hint">' + escapeHtml(item.hint) + '</p>' +
      '<pre class="mq-code"><code>' + escapeHtml(item.code.join('\n')) + '</code></pre>' +
      '<button class="mq-next" type="button">' + (isLast ? 'دیدن نتیجه 🎯' : 'سؤال بعدی ←') + '</button>';
    var next = feedback.querySelector('.mq-next');
    if (next) next.addEventListener('click', nextQuizQuestion);
    if (st.timer) clearTimeout(st.timer);
    st.timer = setTimeout(nextQuizQuestion, record.ok ? 1500 : 3400);
  }

  function nextQuizQuestion() {
    if (!quizCard || !quizState) return;
    if (quizState.timer) { clearTimeout(quizState.timer); quizState.timer = null; }
    if (!quizState.locked) return; // همین حالا جلو رفته؛ دوباره جلو نرو
    quizState.locked = false;
    quizState.index++;
    if (quizState.index >= quizState.order.length) renderQuizResult();
    else renderQuizQuestion();
  }

  function renderQuizResult() {
    if (!quizCard || !quizState) return;
    var st = quizState;
    var total = st.order.length;
    var percent = Math.round((st.correct / total) * 100);
    var wrong = st.answers.filter(function (a) { return !a.ok; });
    var message = percent >= 90 ? '🏆 عالی! تسلطت روی کدهای تراش فانوک خوب است.' :
      percent >= 70 ? '👍 خوب بود؛ چند کد را دوباره مرور کن.' :
        percent >= 50 ? '🙂 بد نبود، ولی تمرین بیشتری لازم است.' :
          '📚 بهتر است بخش «آموزش برنامه‌نویسی» را یک بار مرور کنی.';

    quizCard.querySelector('.mq-question').innerHTML = '';
    quizCard.querySelector('.mq-title').hidden = true;
    quizCard.querySelector('.mq-lead').hidden = true;
    var feedback = quizCard.querySelector('.mq-feedback');
    feedback.className = 'mq-feedback';
    feedback.innerHTML = '';
    quizCard.querySelector('.mq-counter').textContent = total + ' / ' + total;
    quizCard.querySelector('.mq-progress-fill').style.width = '100%';

    var result = quizCard.querySelector('.mq-result');
    result.hidden = false;
    result.innerHTML =
      '<div class="mq-score">' +
        '<p class="mq-score-num">' + st.correct + ' / ' + total + '</p>' +
        '<p class="mq-score-label">از ' + total + ' سؤال، ' + st.correct + ' سؤال درست (' + percent + '٪)</p>' +
      '</div>' +
      '<p class="mq-msg">' + message + '</p>' +
      (wrong.length
        ? '<h3 class="mq-wrong-title">❌ سؤال‌هایی که غلط زدی (' + wrong.length + ' مورد)</h3>' +
          '<ul class="mq-wrong-list">' + wrong.map(function (a, i) {
            return '<li class="mq-wrong-item">' +
              '<p class="mq-wrong-q">' + (i + 1) + '. ' + escapeHtml(a.item.title) +
                ' <span class="mq-tag">' + escapeHtml(a.item.tag) + '</span></p>' +
              '<p class="mq-wrong-ans">پاسخ درست: <b>' + a.item.letter + a.item.answer + '</b>' +
                ' — پاسخ تو: <b class="mq-bad">' + escapeHtml(a.given) + '</b></p>' +
              '<pre class="mq-code"><code>' + escapeHtml(a.item.code.join('\n')) + '</code></pre>' +
              '</li>';
          }).join('') + '</ul>'
        : '<p class="mq-perfect">🎉 همهٔ سؤال‌ها را درست پاسخ دادی!</p>') +
      '<div class="mq-actions">' +
        '<button class="mq-again" type="button">🔄 آزمون مجدد</button>' +
        '<button class="mq-home" type="button">⌂ بازگشت به خانه</button>' +
      '</div>';

    result.querySelector('.mq-again').addEventListener('click', function () { startQuiz(); });
    result.querySelector('.mq-home').addEventListener('click', function () {
      closeQuiz();
      showHome();
    });
    if (quizCard.scrollTop) quizCard.scrollTop = 0;
  }


  // ---------- navigation: WebView-safe stack ----------
  // استراتژی جدید: به‌جای حدس زدن، خودمان «ناظر» پنل فعال هستیم.
  // هر تغییری در پنل فعال (از هر مسیری: کارت، تب، سایدبار، deep-link) خودکار push می‌شود.
  // Back فقط pop می‌کند و همان را نشان می‌دهد. هیچ hash ساخته نمی‌شود.
  var lastShown = 'home';
  var suppressPush = false;
  function visiblePanelKey() {
    var panels = document.querySelectorAll('.tool-panel');
    for (var i = 0; i < panels.length; i++) {
      if (!panels[i].hidden && panels[i].classList.contains('active')) {
        return panels[i].dataset.panel || 'home';
      }
    }
    return 'home';
  }
  function activePanelKey() {
    if (quizCard && quizCard.classList.contains('active')) return '__quiz__';
    if (contactCard && contactCard.classList.contains('active')) return '__contact__';
    if (notesCard && notesCard.classList.contains('active')) return '__notes__';
    return visiblePanelKey();
  }
  function trackPanelChange() {
    if (suppressPush) return;
    var key = activePanelKey();
    if (key === lastShown) return;
    var last = navHistory.length ? navHistory[navHistory.length - 1] : null;
    if (!last || last !== lastShown) navHistory.push(lastShown);
    lastShown = key;
  }
  function forceShowPanel(tool) {
    // مستقیم و بدون اتکا به switchTool: فقط همین پنل دیده شود
    var panels = document.querySelectorAll('.tool-panel');
    var found = false;
    for (var i = 0; i < panels.length; i++) {
      var on = panels[i].dataset.panel === tool;
      panels[i].hidden = !on;
      panels[i].classList.toggle('active', on);
      if (on) found = true;
    }
    if (found) animateMobilePage(document.querySelector('.tool-panel[data-panel="' + tool + '"]'));
    if (found && typeof switchTool === 'function') {
      try { switchTool(tool, false); } catch (e) {}
    }
    // گارد نهایی: اگر به هر دلیلی هیچ پنلی visible نشد، خانه را نشان بده (ضد صفحه سیاه)
    if (!found) { showHome(); return false; }
    if (visiblePanelKey() === 'home' && tool !== 'home') { showHome(); return false; }
    return true;
  }
  function hideHomePanels() {
    var h = document.querySelector('.mobile-home');
    if (h) h.style.display = 'none';
    document.querySelectorAll('.home-spacer-card, .seo-intro').forEach(function (x) { x.hidden = true; });
    var welcome = document.querySelector('#welcomeCard');
    if (welcome) welcome.style.display = 'none';
  }
  function setActiveTab(action) {
    document.querySelectorAll('.mobile-tabbar .tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.action === action);
    });
  }
  function animateMobilePage(element) {
    if (!element) return;
    element.classList.remove('mobile-page-enter');
    void element.offsetWidth;
    element.classList.add('mobile-page-enter');
    setTimeout(function () { element.classList.remove('mobile-page-enter'); }, 450);
  }
  function pushNavState() { trackPanelChange(); }


  function currentPanelKey() { return activePanelKey(); }
  function showPanelNoPush(key) {
    // نمایش بدون push (مخصوص Back) — lastShown را هم همگام کن
    suppressPush = true;
    try {
      if (key === '__notes__') {
        document.querySelectorAll('.tool-panel').forEach(function (p) {
          p.hidden = true; p.classList.remove('active');
        });
        hideHomePanels();
        if (notesCard) { notesCard.style.display = 'flex'; notesCard.classList.add('active'); animateMobilePage(notesCard); }
        setActiveTab('notes');
      } else if (key === '__quiz__') {
        // برگشت به آزمونِ نیمه‌کاره (بدون شروع مجدد)
        closeContact();
        closeNotes();
        document.querySelectorAll('.tool-panel').forEach(function (p) {
          p.hidden = true; p.classList.remove('active');
        });
        hideHomePanels();
        buildQuiz();
        if (quizCard) { quizCard.classList.add('active'); animateMobilePage(quizCard); }
        setActiveTab('programmingQuiz');
      } else if (key === '__contact__') {
        closeNotes();
        closeQuiz();
        document.querySelectorAll('.tool-panel').forEach(function (p) {
          p.hidden = true; p.classList.remove('active');
        });
        hideHomePanels();
        buildContact();
        if (contactCard) { contactCard.classList.add('active'); animateMobilePage(contactCard); }
        setActiveTab('contact');
      } else if (!key || key === 'home') {
        showHome();
      } else {
        closeNotes();
        closeQuiz();
        hideHomePanels();
        forceShowPanel(key);
        setActiveTab(key === 'materials' ? 'materials' : (key === 'calculations' ? 'calculations' : 'none'));
      }
      window.scrollTo(0, 0);
    } finally {
      suppressPush = false;
      lastShown = activePanelKey();
    }
  }
  function openPanel(tool) {
    closeContact();
    closeNotes();
    closeQuiz();
    hideHomePanels();
    if (!tool || tool === 'home') { showHome(); return; }
    // مقصد نامعتبر (بدون پنل) را قبول نکن — همان صفحه قبلی می‌ماند
    var target = document.querySelector('.tool-panel[data-panel="' + tool + '"]');
    if (!target) { showHome(); return; }
    forceShowPanel(tool);
    // ناظر خودش push می‌کند؛ اگر نکرد (رویداد DOM دیر رسید) دستی همگام کن
    trackPanelChange();
    window.scrollTo(0, 0);
    setActiveTab(tool === 'materials' ? 'materials' : (tool === 'calculations' ? 'calculations' : 'none'));
  }
  function handleBack() {
    if (document.querySelector('.scientific-calculator.mobile-open')) {
      closeMobileCalculator();
      showHome();
      return;
    }
    var now = Date.now();
    if (now - lastBackAt < 350) return;
    lastBackAt = now;
    var educationMenu = document.querySelector('.mobile-education-menu');
    if (educationMenu) { educationMenu.remove(); return; }
    var sb = document.querySelector('.mobile-searchbar.open');
    if (sb) { sb.classList.remove('open'); return; }
    // همگام‌سازی نهایی: هر تغییری که ثبت نشده، همین حالا ثبت شود
    trackPanelChange();
    // دقیقاً «یک قدم» عقب برو — ورودی‌های تکراری/بی‌اثر را رد کن تا Back هیچ‌وقت بی‌اثر نباشد
    var target = null;
    while (navHistory.length) {
      var prev = navHistory.pop();
      if (prev !== currentPanelKey()) { target = prev; break; }
    }
    if (target) { showPanelNoPush(target); return; }
    // چیزی برای برگشت نیست: اگر جای دیگری هستیم برو خانه، وگرنه فقط اسکرول به بالا
    if (currentPanelKey() !== 'home') { showPanelNoPush('home'); return; }
    if (capacitorApp && typeof capacitorApp.exitApp === 'function') {
      capacitorApp.exitApp();
      return;
    }
    window.scrollTo(0, 0);
  }
  function go(action) {
    if (action === 'calculator') { showCalculator(); return; }
    closeMobileCalculator();
    closeContact(); // خروج از صفحه «تماس با ما» = یک قدم (ناظر تاریخچه ثبتش می‌کند)
    closeQuiz();    // خروج از آزمون برنامه‌نویسی هم یک قدم است
    if (action === 'education') { showEducationMenu(); return; }
    if (action === 'notes') { showNotes(); return; }
    if (action === 'programmingQuiz') { showQuiz(); return; }
    closeNotes();
    if (action === 'home') {
      // دکمه خانه: همیشه برگرد خونه (بدون دست‌کاری اضافه تاریخچه)
      closeNotes();
      showHome(); return;
    }
    // صفحه «تماس با ما» درون‌برنامه‌ای باز می‌شود: نه ریلود، نه ترک اپ، نه دکمه بازگشت/تم/دانلود
    if (action === 'contact') { showContact(); return; }
    openPanel(HOME_TOOLS[action] || action);
  }
  function showHome() {
    var educationMenu = document.querySelector('.mobile-education-menu');
    if (educationMenu) educationMenu.remove();
    closeMobileCalculator();
    closeContact(); // برگشت به خانه از هر صفحه‌ای (از جمله تماس) یک قدم حساب می‌شود
    closeQuiz();    // آزمون با برگشت به خانه بسته می‌شود
    // نکته مهم: تاریخچه را پاک نکن! فقط وقتی واقعاً خونه‌ایم و چیزی در استک نیست
    try { history.replaceState({}, '', location.pathname); } catch (e) {}
    document.querySelectorAll('.tool-panel').forEach(function (p) {
      p.hidden = true; p.classList.remove('active');
    });
    if (notesCard) { notesCard.style.display = 'none'; notesCard.classList.remove('active'); }
    var welcome = document.querySelector('#welcomeCard');
    if (welcome) { welcome.hidden = false; welcome.style.display = 'flex'; welcome.classList.remove('hide'); }
    document.querySelectorAll('.home-spacer-card, .seo-intro').forEach(function (x) {
      x.hidden = true; x.style.display = 'none';
    });
    var h = document.querySelector('.mobile-home');
    if (h) { h.style.display = ''; animateMobilePage(h); }
    if (typeof updateSeoForHome === 'function') { try { updateSeoForHome(); } catch (e) {} }
    setActiveTab('home');
    window.scrollTo(0, 0);
  }
  function closeMobileCalculator() {
    var calculator = document.querySelector('.scientific-calculator');
    if (calculator) calculator.classList.remove('active', 'mobile-open');
  }
  function showCalculator() {
    var calculator = document.querySelector('.scientific-calculator');
    if (!calculator) return;
    closeContact();
    closeNotes();
    closeQuiz();
    hideHomePanels();
    var closeButton = document.getElementById('mobileCalculatorClose');
    if (!closeButton) {
      closeButton = el('button', 'calc-mobile-close', '✕');
      closeButton.id = 'mobileCalculatorClose';
      closeButton.type = 'button';
      closeButton.setAttribute('aria-label', 'بستن ماشین‌حساب');
      closeButton.addEventListener('click', function () {
        closeMobileCalculator();
        showHome();
      });
      calculator.insertBefore(closeButton, calculator.firstChild);
    }
    calculator.classList.add('active', 'mobile-open');
    animateMobilePage(calculator);
  }
  function showEducationMenu() {
    var existing = document.querySelector('.mobile-education-menu');
    if (existing) { existing.remove(); return; }
    var menu = el('div', 'mobile-education-menu');
    menu.innerHTML =
      '<button type="button" data-education-action="booklets">📁 جزوه‌های آموزشی</button>' +
      '<button type="button" data-education-action="programmingTraining">🧠 آموزش برنامه‌نویسی</button>' +
      '<button type="button" data-education-action="programmingQuiz">🎯 آزمون برنامه‌نویسی</button>';
    menu.addEventListener('click', function (event) {
      var button = event.target.closest('[data-education-action]');
      if (!button) return;
      menu.remove();
      go(button.dataset.educationAction);
    });
    document.body.appendChild(menu);
  }
  function closeNotes() {
    if (notesCard) { notesCard.style.display = 'none'; notesCard.classList.remove('active'); }
  }
  function showNotes() {
    pushNavState();
    closeQuiz();
    document.querySelectorAll('.tool-panel').forEach(function (p) {
      p.hidden = true; p.classList.remove('active');
    });
    hideHomePanels();
    if (notesCard) { notesCard.style.display = 'flex'; notesCard.classList.add('active'); animateMobilePage(notesCard); }
    setActiveTab('notes');
    window.scrollTo(0, 0);
    var ta = document.querySelector('#workshopNotes');
    if (ta) setTimeout(function () { ta.focus(); }, 300);
  }
  function bindNotes() {
    var ta = document.querySelector('#workshopNotes');
    var saveBtn = document.querySelector('#saveNotes');
    var clearBtn = document.querySelector('#clearNotes');
    var charCount = document.querySelector('#charCount');
    var saveStatus = document.querySelector('#saveStatus');
    if (ta) {
      try {
        var saved = localStorage.getItem('easyPipeNotes') || '';
        ta.value = saved;
        if (charCount) charCount.textContent = saved.length + ' / 5000';
      } catch (e) {}
      ta.addEventListener('input', function () {
        try { localStorage.setItem('easyPipeNotes', ta.value); } catch (e) {}
        if (charCount) charCount.textContent = ta.value.length + ' / 5000';
      });
    }
    if (saveBtn && ta) saveBtn.addEventListener('click', function () {
      try { localStorage.setItem('easyPipeNotes', ta.value); } catch (e) {}
      if (saveStatus) {
        saveStatus.textContent = 'Saved!';
        setTimeout(function () { saveStatus.textContent = 'Ready'; }, 2000);
      }
    });
    if (clearBtn && ta) clearBtn.addEventListener('click', function () {
      if (confirm('همه یادداشت‌ها پاک شوند؟')) {
        ta.value = '';
        try { localStorage.removeItem('easyPipeNotes'); } catch (e) {}
        if (charCount) charCount.textContent = '0 / 5000';
      }
    });
    var closeBtn = document.querySelector('#notesClose');
    if (closeBtn) closeBtn.style.display = 'none';
  }

  function setupBack() {
    // Back گوشی را فقط از یک مسیر دریافت کن تا یک فشار دوبار پردازش نشود.
    try {
      capacitorApp = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
      if (capacitorApp && typeof capacitorApp.addListener === 'function') {
        capacitorApp.addListener('backButton', handleBack);
      } else {
        document.addEventListener('backbutton', function (ev) {
          try { if (ev && ev.preventDefault) ev.preventDefault(); } catch (e) {}
          handleBack();
        });
      }
    } catch (e) {}
    // popstate وب (Back مرورگر داخل پیش‌نمایش): نگذار مرورگر صفحه را عوض کند
    window.addEventListener('popstate', function () {
      try { history.replaceState({}, '', location.pathname); } catch (e) {}
      // اگر مرورگر Back زد و پنلی گم شد، گارد ضد-سیاه را اجرا کن
      setTimeout(function () {
        if (visiblePanelKey() === 'home') {
          var hv = document.querySelector('.mobile-home');
          if (!hv || hv.style.display === 'none') showHome();
        }
      }, 50);
    });
    // هیچ‌وقت hash نساز تا Back مرورگر/گوشی به hash گیر نکند
    try { history.replaceState({}, '', location.pathname); } catch (e) {}
  }

  function finishMobileBoot() {
    if (!bootedForMobile) return;
    requestAnimationFrame(function () {
      document.documentElement.classList.remove('android-boot');
    });
  }

  function init() {
    buildChrome();
    buildHome();
    bindNotes();
    setupBack();
    var ws = document.querySelector('.workspace');
    if (ws) {
      // ناظر دوکاره: کارت‌های جدید را bind کن + تغییر پنل فعال را در تاریخچه ثبت کن
      var observer = new MutationObserver(function () {
        bindDesktopCards(); bindPdfButtons(); trackPanelChange();
      });
      observer.observe(ws, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
    }
    var hash = (location.hash || '').replace(/^#/, '');
    try { history.replaceState({}, '', location.pathname); } catch (e) {}
    if (hash && typeof PAGE_TITLES === 'object' && PAGE_TITLES[hash]) {
      var tgt = document.querySelector('.tool-panel[data-panel="' + hash + '"]');
      if (tgt) openPanel(hash);
      else showHome();
    }
    else showHome();
    finishMobileBoot();
    if (isPreview) {
      var st = document.createElement('style');
      st.id = 'mobile-preview-frame';
      st.textContent = 'body.capacitor-mobile{max-width:430px;margin:0 auto;position:relative;}' +
        '.mobile-header-bar,.mobile-tabbar{max-width:430px;margin:0 auto;}';
      document.head.appendChild(st);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

