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
  var iqCard = null;      // صفحه «تست هوش مهندسی مکانیک» (فقط نسخه اندروید، زیر آزمون برنامه‌نویسی)
  var iqState = null;     // وضعیت جاری تست هوش: ترتیب سؤال‌ها، تایمر، امتیاز و تحلیل خرده‌مقیاس
  var giqCard = null;     // صفحه «تست هوش عمومی استاندارد» (زیر تست مهندسی، برای همه افراد)
  var giqState = null;    // وضعیت جاری تست هوش عمومی
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
      hint: 'این کد خنک‌کننده را روشن و M09 آن را خاموش می‌کند.'
    }
  ];

  // ---------- تست هوش مهندسی مکانیک (فقط اندروید، زیر آزمون برنامه‌نویسی) ----------
  // 20 سؤال چهارگزینه‌ای، 4 خرده‌مقیاس + وزن دشواری؛ نمره وزنی به IQ نگاشت می‌شود.
  // domain: mech=مکانیکی | num=عددی | logic=منطقی | applied=کاربردی | weight: 1 آسان، 2 متوسط، 3 دشوار
  var IQ_BANK = [
    { domain: 'mech', weight: 2, tag: 'استدلال مکانیکی',
      q: 'چرخ‌دنده A با 20 دندانه ساعت‌گرد می‌چرخد و با چرخ‌دنده B با 40 دندانه درگیر است. چرخ‌دنده B چگونه می‌چرخد؟',
      options: ['ساعت‌گرد با همان سرعت A', 'پادساعت‌گرد با نصف سرعت A', 'پادساعت‌گرد با دو برابر سرعت A', 'ساعت‌گرد با نصف سرعت A'],
      correct: 1,
      why: 'چرخ‌دنده‌های درگیر خلاف جهت هم می‌چرخند و نسبت سرعت عکس نسبت دندانه‌هاست: 20/40 یعنی B با نصف سرعت A.' },
    { domain: 'mech', weight: 1, tag: 'استدلال مکانیکی',
      q: 'یک پیچ راست‌گرد را از روبه‌رو ساعت‌گرد می‌چرخانیم تا وارد مهره ثابتی شود. پیچ به کدام سمت می‌رود؟',
      options: ['به سمت بیننده (بیرون می‌آید)', 'از بیننده دور می‌شود (داخل مهره فرو می‌رود)', 'فقط می‌چرخد و جابه‌جا نمی‌شود', 'خلاف جهت چرخش حرکت می‌کند'],
      correct: 1,
      why: 'قانون پیچ راست‌گرد: چرخش ساعت‌گرد از روبه‌رو یعنی پیشروی به جلو (دور شدن از بیننده).' },
    { domain: 'mech', weight: 2, tag: 'استدلال مکانیکی',
      q: 'در یک سیستم قرقره مرکب، طناب بار را با 4 رشته موازی نگه داشته است. برای بالا بردن بار 400 نیوتونی (بدون اصطکاک) چه نیرویی لازم است؟',
      options: ['400 نیوتن', '200 نیوتن', '100 نیوتن', '50 نیوتن'],
      correct: 2,
      why: 'مزیت مکانیکی برابر تعداد رشته‌هاست: 400 تقسیم بر 4 = 100 نیوتن (در عوض 4 برابر طناب کشیده می‌شود).' },
    { domain: 'mech', weight: 2, tag: 'استدلال مکانیکی',
      q: 'دو پولی با تسمه «باز» (نه ضربدری) به هم وصل‌اند. اگر پولی محرک ساعت‌گرد بچرخد، پولی متحرک چه جهتی دارد؟',
      options: ['پادساعت‌گرد', 'ساعت‌گرد', 'بسته به قطر پولی فرق می‌کند', 'اول ساعت‌گرد بعد برعکس می‌شود'],
      correct: 1,
      why: 'تسمه باز جهت چرخش را حفظ می‌کند (هر دو هم‌جهت)؛ تسمه ضربدری جهت را برعکس می‌کند.' },
    { domain: 'mech', weight: 3, tag: 'استدلال مکانیکی',
      q: 'با آچار 30 سانتی‌متری و نیروی 100 نیوتن عمود بر دسته پیچی را سفت می‌کنیم. اگر طول دسته نصف شود، برای همان گشتاور چه نیرویی لازم است؟',
      options: ['50 نیوتن', '100 نیوتن', '200 نیوتن', '300 نیوتن'],
      correct: 2,
      why: 'گشتاور = نیرو × بازو (30 نیوتن‌متر). با نصف شدن بازو (0.15 متر) نیرو باید دو برابر شود: 200 نیوتن.' },
    { domain: 'num', weight: 1, tag: 'هوش عددی مهندسی',
      q: 'دنباله 2، 6، 12، 20، 30، … عدد بعدی چیست؟',
      options: ['36', '40', '42', '44'],
      correct: 2,
      why: 'اختلاف‌ها 4، 6، 8، 10 است (هر بار 2 واحد بیشتر)؛ اختلاف بعدی 12 است: 30 + 12 = 42.' },
    { domain: 'num', weight: 2, tag: 'هوش عددی مهندسی',
      q: 'می‌خواهیم با سرعت برش 120 متر بر دقیقه روی قطعه‌ای به قطر 60 میلی‌متر تراشکاری کنیم. دور اسپیندل حدودا چند است؟',
      options: ['318', '477', '637', '1274'],
      correct: 2,
      why: 'n = 1000×Vc ÷ (π×D) = 120000 ÷ 188.4 ≈ 637 دور بر دقیقه.' },
    { domain: 'num', weight: 2, tag: 'هوش عددی مهندسی',
      q: 'سوراخی به قطر 25.10 با رواداری ±0.03 و میله‌ای به قطر 25 با رواداری ±0.05 داریم. بیشترین لقی چقدر است؟',
      options: ['0.08 میلی‌متر', '0.13 میلی‌متر', '0.18 میلی‌متر', '0.23 میلی‌متر'],
      correct: 2,
      why: 'بیشترین لقی = بزرگ‌ترین سوراخ − کوچک‌ترین میله = 25.13 − 24.95 = 0.18 میلی‌متر.' },
    { domain: 'num', weight: 2, tag: 'هوش عددی مهندسی',
      q: 'موتوری با 1440 دور بر دقیقه با چرخ‌دنده 20 (روی موتور) و 60 دندانه به اسپیندل وصل است. دور اسپیندل؟',
      options: ['480 دور بر دقیقه', '720 دور بر دقیقه', '1440 دور بر دقیقه', '4320 دور بر دقیقه'],
      correct: 0,
      why: 'نسبت کاهش 60/20 = 3 است؛ پس 1440 ÷ 3 = 480 دور بر دقیقه.' },
    { domain: 'num', weight: 3, tag: 'هوش عددی مهندسی',
      q: 'پیچ M12×1.75 یعنی گام 1.75 میلی‌متر. اگر مهره روی 5 گام کامل درگیر باشد، طول درگیری چقدر است؟',
      options: ['6 میلی‌متر', '8.75 میلی‌متر', '12 میلی‌متر', '17.5 میلی‌متر'],
      correct: 1,
      why: 'طول درگیری = تعداد گام × گام = 5 × 1.75 = 8.75 میلی‌متر.' },
    { domain: 'logic', weight: 1, tag: 'استدلال منطقی',
      q: 'فرض کنید: «همه ابزارهای HSS قابل تیزکاری مجددند» و «تیغچه X از جنس HSS است». کدام نتیجه قطعی است؟',
      options: ['تیغچه X قابل تیزکاری مجدد است', 'هر ابزار قابل تیزکاری HSS است', 'تیغچه X سرامیکی است', 'هیچ نتیجه قطعی نمی‌توان گرفت'],
      correct: 0,
      why: 'قیاس کلاسیک: عضو مجموعه، خاصیت مجموعه را دارد. (گزینه دوم مغالطه عکس است.)' },
    { domain: 'logic', weight: 2, tag: 'استدلال منطقی',
      q: 'روی اهرم تعادل، وزنه 20 کیلوگرمی در فاصله 3 متری از تکیه‌گاه است. چه وزنه‌ای در فاصله 2 متری سمت دیگر آن را متعادل می‌کند؟',
      options: ['13.3 کیلوگرم', '20 کیلوگرم', '30 کیلوگرم', '60 کیلوگرم'],
      correct: 2,
      why: 'تعادل گشتاور: 20 × 3 = W × 2 پس W = 30 کیلوگرم.' },
    { domain: 'logic', weight: 2, tag: 'استدلال منطقی',
      q: 'قاعده کارگاه: «اگر خنک‌کاری قطع شود، سطح قطعه خراب می‌شود». سطح قطعه سالم مانده است. چه نتیجه‌ای قطعی است؟',
      options: ['خنک‌کاری قطع شده بود', 'خنک‌کاری قطع نشده بود', 'ابزار حتما نو بوده است', 'هیچ نتیجه‌ای نمی‌توان گرفت'],
      correct: 1,
      why: 'نفی تالی یعنی نفی مقدم: سالم بودن سطح یعنی شرط خرابی (قطع خنک‌کاری) رخ نداده است.' },
    { domain: 'logic', weight: 3, tag: 'استدلال منطقی',
      q: 'در برنامه CNC آمده: G90 G01 X50 Z-20 F0.2 و بعد X40. کدام جمله درست است؟',
      options: ['دستگاه در مختصات نسبی است', 'هر دو حرکت مطلق‌اند و X دوم به قطر 40 می‌رود', 'پیشروی فقط برای بلوک اول است', 'برنامه خطا دارد و اجرا نمی‌شود'],
      correct: 1,
      why: 'G90 و F مدال‌اند و تا لغو شدن می‌مانند؛ پس بلوک X40 همان پیشروی را با مختصات مطلق X=40 اجرا می‌کند.' },
    { domain: 'logic', weight: 3, tag: 'استدلال منطقی',
      q: 'سه چرخ‌دنده A و B و C پشت سر هم درگیرند (A با B و B با C). اگر A ساعت‌گرد بچرخد، C چه جهتی دارد؟',
      options: ['ساعت‌گرد', 'پادساعت‌گرد', 'ثابت می‌ماند', 'بسته به تعداد دندانه‌هاست'],
      correct: 0,
      why: 'چرخ‌دنده میانی جهت را دو بار برعکس می‌کند؛ پس اولی و سومی هم‌جهت‌اند: ساعت‌گرد.' },
    { domain: 'applied', weight: 1, tag: 'دانش کاربردی مکانیک',
      q: 'برای قالب دایکست آلومینیوم (کار گرم با شوک حرارتی) کدام فولاد ابزار مناسب‌تر است؟',
      options: ['H13 (فولاد گرم‌کار)', 'D2 (فولاد سردکار پرکروم)', 'St37 (فولاد ساختمانی)', 'برنج'],
      correct: 0,
      why: 'H13 فولاد گرم‌کار با مقاومت به شوک حرارتی و خستگی گرم است؛ انتخاب استاندارد قالب دایکست.' },
    { domain: 'applied', weight: 1, tag: 'دانش کاربردی مکانیک',
      q: 'میکرومتری با دقت 0.01 میلی‌متر عدد 12.34 را نشان می‌دهد. کدام خوانش درست است؟',
      options: ['12.340', 'حدود 12.34 با خطای ±0.01', 'دقیقا 12.3400', '12.4'],
      correct: 1,
      why: 'دقت وسیله 0.01 است؛ رقم بعدی معنا ندارد و نتیجه همیشه با همان عدم‌قطعیت گزارش می‌شود.' },
    { domain: 'applied', weight: 2, tag: 'دانش کاربردی مکانیک',
      q: 'در فرزکاری، شایع‌ترین علت «چتر» (لرزش و خط موجی روی سطح) کدام است؟',
      options: ['زیاد بودن خنک‌کاری', 'لقی و عدم صلبیت نگهدارنده/فیکسچر یا پارامتر نامناسب', 'نو بودن ابزار', 'پایین بودن دور به‌تنهایی'],
      correct: 1,
      why: 'چتر معمولا از صلبیت کم سیستم (ابزار بلند، فیکسچر شل، لقی اسپیندل) یا پارامتر نامناسب برش می‌آید.' },
    { domain: 'applied', weight: 2, tag: 'دانش کاربردی مکانیک',
      q: 'قطعه‌ای فولادی هم‌زمان به سطح سخت و مغز نرم نیاز دارد. کدام عملیات مناسب است؟',
      options: ['آنیل کامل', 'سمانتاسیون (کربوره + کوئنچ)', 'نرماله کردن تنها', 'تمپر بدون کوئنچ'],
      correct: 1,
      why: 'سمانتاسیون سطح را سخت و مغز را چقرمه نگه می‌دارد؛ مخصوص چرخ‌دنده و میل‌لنگ.' },
    { domain: 'applied', weight: 3, tag: 'دانش کاربردی مکانیک',
      q: 'پیستون هیدرولیکی به قطر 100 میلی‌متر با فشار 6 بار نیرو وارد می‌کند. نیرو حدودا چقدر است؟',
      options: ['حدود 470 نیوتن', 'حدود 4710 نیوتن', 'حدود 47100 نیوتن', 'حدود 471000 نیوتن'],
      correct: 1,
      why: 'مساحت ≈ 7854 میلی‌متر مربع؛ فشار 6 بار = 0.6 نیوتن/میلی‌متر مربع؛ نیرو ≈ 4710 نیوتن.' }
  ];
  var IQ_TOTAL_SECONDS = 20 * 60;
  var IQ_DOMAIN_NAMES = { mech: 'تجسم فضایی و مکانیکی', num: 'هوش عددی مهندسی', logic: 'استدلال منطقی', applied: 'دانش کاربردی مکانیک' };

  // ---------- تست هوش عمومی استاندارد (زیر تست مهندسی؛ برای همه افراد) ----------
  // الگو: مقیاس‌های استاندارد (کلامی، عددی، فضایی/ماتریسی، منطقی، حافظه کاری).
  // 40 سؤال چهارگزینه‌ای، وزن 1 تا 3، تایمر 40 دقیقه، نمره به IQ با میانگین 100 و انحراف 15.
  var GIQ_BANK = [
    // --- هوش کلامی (8 سؤال) ---
    { domain: 'verb', weight: 1, tag: 'هوش کلامی',
      q: 'کدام کلمه با بقیه فرق دارد؟',
      options: ['کتاب', 'دفتر', 'خودکار', 'میز'],
      correct: 3,
      why: 'کتاب، دفتر و خودکار ابزار نوشتن و مطالعه‌اند؛ میز وسیله‌ای از جنس مبلمان و دسته دیگری است.' },
    { domain: 'verb', weight: 1, tag: 'هوش کلامی',
      q: 'مترادف «دقیق» کدام است؟',
      options: ['سریع', 'صحیح و موشکافانه', 'بلند', 'تاریک'],
      correct: 1,
      why: 'دقیق یعنی بدون خطا و موشکافانه؛ نزدیک‌ترین مترادف همین گزینه است.' },
    { domain: 'verb', weight: 2, tag: 'هوش کلامی',
      q: 'متضاد «آشکار» کدام است؟',
      options: ['روشن', 'پنهان', 'بزرگ', 'نزدیک'],
      correct: 1,
      why: 'آشکار یعنی واضح و نمایان؛ متضاد آن پنهان است.' },
    { domain: 'verb', weight: 2, tag: 'هوش کلامی',
      q: 'کتاب به خواندن است، مانند قلم به …؟',
      options: ['نوشتن', 'کشیدن', 'خواندن', 'شکستن'],
      correct: 0,
      why: 'رابطه کاربرد است: کاربرد کتاب خواندن و کاربرد قلم نوشتن است.' },
    { domain: 'verb', weight: 2, tag: 'هوش کلامی',
      q: 'پرنده به آشیانه است، مانند زنبور به …؟',
      options: ['گل', 'کندو', 'عسل', 'بال'],
      correct: 1,
      why: 'رابطه محل زندگی است: آشیانه خانه پرنده و کندو خانه زنبور است.' },
    { domain: 'verb', weight: 3, tag: 'هوش کلامی',
      q: 'کدام جمله از نظر منطقی درست است؟',
      options: ['همه پزشکان مهندس‌اند', 'بعضی پرندگان پرواز نمی‌کنند', 'هیچ آبی مایع نیست', 'همه سنگ‌ها زنده‌اند'],
      correct: 1,
      why: 'شترمرغ و پنگوئن پرندگانی‌اند که پرواز نمی‌کنند؛ پس این جمله واقعا درست است و بقیه نادرست‌اند.' },
    { domain: 'verb', weight: 3, tag: 'هوش کلامی',
      q: 'اگر «همه گل‌ها گیاه‌اند» و «رز یک گل است»، کدام نتیجه قطعی است؟',
      options: ['رز یک گیاه است', 'همه گیاهان رز هستند', 'رز گل نیست', 'هیچ نتیجه‌ای نمی‌توان گرفت'],
      correct: 0,
      why: 'قیاس منطقی معتبر: عضو مجموعه، ویژگی مجموعه را دارد.' },
    { domain: 'verb', weight: 1, tag: 'هوش کلامی',
      q: 'کدام کلمه جمع است؟',
      options: ['درخت', 'کتاب‌ها', 'مدرسه', 'میز'],
      correct: 1,
      why: 'پسوند «ها» نشانه جمع در فارسی است.' },
    // --- هوش عددی (8 سؤال) ---
    { domain: 'num', weight: 1, tag: 'هوش عددی',
      q: 'دنباله 3، 6، 9، 12، … عدد بعدی چیست؟',
      options: ['13', '14', '15', '18'],
      correct: 2,
      why: 'الگو جمع 3 است: 12 + 3 = 15.' },
    { domain: 'num', weight: 1, tag: 'هوش عددی',
      q: 'نصف 50 به‌علاوه 10 چقدر است؟',
      options: ['30', '35', '45', '60'],
      correct: 1,
      why: 'نصف 50 برابر 25 است؛ 25 + 10 = 35.' },
    { domain: 'num', weight: 2, tag: 'هوش عددی',
      q: 'دنباله 2، 4، 8، 16، … عدد بعدی چیست؟',
      options: ['20', '24', '32', '64'],
      correct: 2,
      why: 'الگو دو برابر شدن است: 16 × 2 = 32.' },
    { domain: 'num', weight: 2, tag: 'هوش عددی',
      q: 'اگر 3 مداد 12 هزار تومان باشد، 5 مداد چقدر است؟',
      options: ['15 هزار', '18 هزار', '20 هزار', '25 هزار'],
      correct: 2,
      why: 'هر مداد 4 هزار تومان است؛ 5 × 4 = 20 هزار تومان.' },
    { domain: 'num', weight: 2, tag: 'هوش عددی',
      q: 'دنباله 5، 9، 13، 17، … عدد بعدی چیست؟',
      options: ['20', '21', '22', '25'],
      correct: 1,
      why: 'الگو جمع 4 است: 17 + 4 = 21.' },
    { domain: 'num', weight: 3, tag: 'هوش عددی',
      q: 'دنباله 1، 1، 2، 3، 5، 8، … عدد بعدی چیست؟',
      options: ['11', '12', '13', '15'],
      correct: 2,
      why: 'دنباله فیبوناچی است: هر عدد جمع دو عدد قبلی است؛ 5 + 8 = 13.' },
    { domain: 'num', weight: 3, tag: 'هوش عددی',
      q: '20 درصد 200 چقدر است؟',
      options: ['20', '30', '40', '50'],
      correct: 2,
      why: '20 درصد یعنی یک‌پنجم؛ 200 ÷ 5 = 40.' },
    { domain: 'num', weight: 3, tag: 'هوش عددی',
      q: 'دنباله 81، 27، 9، 3، … عدد بعدی چیست؟',
      options: ['1', '0', '2', '4'],
      correct: 0,
      why: 'الگو تقسیم بر 3 است: 3 ÷ 3 = 1.' },
    // --- هوش فضایی و تصویری (8 سؤال) ---
    { domain: 'spat', weight: 1, tag: 'هوش فضایی و تصویری',
      q: 'کدام شکل با بقیه فرق دارد؟ (سه مربع و یک مثلث)',
      options: ['مربع اول', 'مربع دوم', 'مربع سوم', 'مثلث'],
      correct: 3,
      why: 'سه شکل چهارضلعی‌اند و فقط مثلث سه‌ضلعی است؛ پس مثلث متفاوت است.' },
    { domain: 'spat', weight: 1, tag: 'هوش فضایی و تصویری',
      q: 'مکعب را از روبه‌رو می‌بینیم؛ کدام نما دیده می‌شود؟',
      options: ['مربع', 'مثلث', 'دایره', 'ذوزنقه'],
      correct: 0,
      why: 'نمای روبه‌روی مکعب یک مربع است.' },
    { domain: 'spat', weight: 2, tag: 'هوش فضایی و تصویری',
      q: 'الگو: دایره، مربع، مثلث، دایره، مربع، … شکل بعدی چیست؟',
      options: ['دایره', 'مربع', 'مثلث', 'ستاره'],
      correct: 2,
      why: 'الگو سه‌تایی تکرار می‌شود؛ بعد از دایره و مربع، مثلث می‌آید.' },
    { domain: 'spat', weight: 2, tag: 'هوش فضایی و تصویری',
      q: 'کدام گزینه ادامه الگوی ○ ◇ ○ ◇ ○ … است؟',
      options: ['○', '◇', '□', '△'],
      correct: 1,
      why: 'الگو یکی‌درمیان است؛ بعد از دایره، لوزی می‌آید.' },
    { domain: 'spat', weight: 2, tag: 'هوش فضایی و تصویری',
      q: 'اگر یک کاغذ را از وسط تا کنیم و یک گوشه آن را ببریم، بعد از باز کردن چند سوراخ دیده می‌شود؟',
      options: ['1', '2', '3', '4'],
      correct: 1,
      why: 'برش روی دولایه تا خورده می‌افتد؛ پس بعد از باز شدن دو سوراخ متقارن دیده می‌شود.' },
    { domain: 'spat', weight: 3, tag: 'هوش فضایی و تصویری',
      q: 'الگوی تعداد خط‌ها: 3، 4، 5، 6، … شکل بعدی با چند خط کشیده می‌شود؟ (مثلث، مربع، پنج‌ضلعی، …)',
      options: ['6', '7', '8', '9'],
      correct: 1,
      why: 'هر بار یک ضلع اضافه می‌شود؛ بعد از شش‌ضلعی، هفت‌ضلعی با 7 خط می‌آید.' },
    { domain: 'spat', weight: 3, tag: 'هوش فضایی و تصویری',
      q: 'در ماتریس 2×2 داریم: بالا-چپ دایره، بالا-راست مربع، پایین-چپ مربع. خانه پایین-راست چیست تا هر سطر و ستون هر دو شکل را داشته باشد؟',
      options: ['دایره', 'مربع', 'مثلث', 'ستاره'],
      correct: 0,
      why: 'قاعده لاتین است: هر سطر و ستون باید هر دو شکل را داشته باشد؛ پس خانه خالی دایره است.' },
    { domain: 'spat', weight: 3, tag: 'هوش فضایی و تصویری',
      q: 'عقربه ساعت‌شمار روی 3 و دقیقه‌شمار روی 12 است. زاویه کوچک‌تر بین آن‌ها چند درجه است؟',
      options: ['60 درجه', '75 درجه', '90 درجه', '120 درجه'],
      correct: 2,
      why: 'هر ساعت 30 درجه است؛ فاصله 3 تا 12 برابر سه ساعت یعنی 90 درجه.' },
    // --- استدلال منطقی (8 سؤال) ---
    { domain: 'logic', weight: 1, tag: 'استدلال منطقی',
      q: 'اگر امروز دوشنبه باشد، دو روز بعد چه روزی است؟',
      options: ['سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'],
      correct: 1,
      why: 'دوشنبه + 2 روز = چهارشنبه.' },
    { domain: 'logic', weight: 1, tag: 'استدلال منطقی',
      q: 'علی از رضا بلندتر و رضا از سارا بلندتر است. چه کسی بلندترین است؟',
      options: ['رضا', 'سارا', 'علی', 'مشخص نیست'],
      correct: 2,
      why: 'رابطه ترتیبی است: علی > رضا > سارا؛ پس علی بلندترین است.' },
    { domain: 'logic', weight: 2, tag: 'استدلال منطقی',
      q: 'همه Aها B هستند و همه Bها C هستند. کدام نتیجه قطعی است؟',
      options: ['همه Aها C هستند', 'همه Cها A هستند', 'هیچ Aای C نیست', 'بعضی Cها B نیستند'],
      correct: 0,
      why: 'خاصیت تعدی مجموعه‌هاست: اگر A زیرمجموعه B و B زیرمجموعه C باشد، A زیرمجموعه C است.' },
    { domain: 'logic', weight: 2, tag: 'استدلال منطقی',
      q: 'اگر باران ببارد زمین خیس می‌شود. زمین خیس نیست. چه نتیجه‌ای قطعی است؟',
      options: ['باران باریده است', 'باران نباریده است', 'حتما برف باریده است', 'هیچ نتیجه‌ای نمی‌توان گرفت'],
      correct: 1,
      why: 'نفی تالی یعنی نفی مقدم (Modus Tollens).' },
    { domain: 'logic', weight: 2, tag: 'استدلال منطقی',
      q: 'در یک مسابقه، مریم بعد از سارا و قبل از لیلا تمام کرد. چه کسی اول شد؟',
      options: ['مریم', 'سارا', 'لیلا', 'مشخص نیست'],
      correct: 1,
      why: 'ترتیب: سارا، مریم، لیلا؛ پس سارا اول است.' },
    { domain: 'logic', weight: 3, tag: 'استدلال منطقی',
      q: 'بعضی Aها B نیستند و همه Bها C هستند. کدام نتیجه قطعی است؟',
      options: ['همه Aها C هستند', 'بعضی Aها C نیستند', 'هیچ Aای C نیست', 'همه Cها A هستند'],
      correct: 1,
      why: 'عضوی از A که B نیست، چون Bها C هستند، آن عضو C هم نیست؛ پس بعضی Aها C نیستند.' },
    { domain: 'logic', weight: 3, tag: 'استدلال منطقی',
      q: 'جعبه‌ای 3 توپ قرمز و 2 توپ آبی دارد. بدون نگاه کردن، حداقل چند توپ برداریم تا حتما 2 توپ هم‌رنگ داشته باشیم؟',
      options: ['2', '3', '4', '5'],
      correct: 1,
      why: 'اصل لانه کبوتری: با 3 برداشت، حتما دو توپ هم‌رنگ خواهیم داشت (بدترین حالت: قرمز، آبی، سپس سومی یکی را جفت می‌کند).' },
    { domain: 'logic', weight: 3, tag: 'استدلال منطقی',
      q: 'پنج نفر در صف‌اند. نفر سوم کیست اگر نفر اول و آخر مشخص باشند؟ (سؤال کنترل دقت)',
      options: ['نفر وسط', 'نفر اول', 'نفر آخر', 'قابل تعیین نیست'],
      correct: 0,
      why: 'در صف پنج‌نفره، نفر سوم همان نفر وسط است.' },
    // --- حافظه کاری (8 سؤال) ---
    { domain: 'mem', weight: 1, tag: 'حافظه کاری',
      q: 'این رشته را به خاطر بسپار: 7 - 2 - 9. کدام گزینه همان رشته است؟',
      options: ['7 - 2 - 9', '7 - 9 - 2', '2 - 7 - 9', '9 - 2 - 7'],
      correct: 0,
      why: 'حافظه کوتاه‌مدت: ترتیب دقیق اعداد همان گزینه اول است.' },
    { domain: 'mem', weight: 1, tag: 'حافظه کاری',
      q: 'کلمات «سیب، مداد، آسمان» را به خاطر بسپار. کدام کلمه در لیست نبود؟',
      options: ['سیب', 'مداد', 'آسمان', 'کتاب'],
      correct: 3,
      why: 'کتاب در لیست سه‌تایی نبود.' },
    { domain: 'mem', weight: 2, tag: 'حافظه کاری',
      q: 'رشته 4 - 8 - 1 - 6 را به خاطر بسپار. معکوس آن کدام است؟',
      options: ['4 - 8 - 1 - 6', '6 - 1 - 8 - 4', '1 - 6 - 4 - 8', '8 - 4 - 6 - 1'],
      correct: 1,
      why: 'معکوس رشته یعنی خواندن از آخر به اول: 6 - 1 - 8 - 4.' },
    { domain: 'mem', weight: 2, tag: 'حافظه کاری',
      q: 'اعداد 3، 9، 4، 7 را به خاطر بسپار. مجموع بزرگ‌ترین و کوچک‌ترین کدام است؟',
      options: ['10', '11', '12', '16'],
      correct: 2,
      why: 'بزرگ‌ترین 9 و کوچک‌ترین 3 است؛ 9 + 3 = 12.' },
    { domain: 'mem', weight: 2, tag: 'حافظه کاری',
      q: 'حروف «د، ا، ر، م» را به خاطر بسپار. با مرتب کردن آن‌ها کدام کلمه معنادار ساخته می‌شود؟',
      options: ['مادر', 'مارد', 'دامر', 'رامد'],
      correct: 0,
      why: 'با مرتب‌سازی این چهار حرف، کلمه «مادر» ساخته می‌شود.' },
    { domain: 'mem', weight: 3, tag: 'حافظه کاری',
      q: 'رشته 5 - 2 - 8 - 1 - 9 را به خاطر بسپار. عدد وسطی کدام است؟',
      options: ['2', '8', '1', '5'],
      correct: 1,
      why: 'عدد وسطی در رشته پنج‌تایی، سومی است: 8.' },
    { domain: 'mem', weight: 3, tag: 'حافظه کاری',
      q: 'سه رنگ «قرمز، آبی، سبز» را به خاطر بسپار. دومین رنگ کدام بود؟',
      options: ['قرمز', 'آبی', 'سبز', 'زرد'],
      correct: 1,
      why: 'ترتیب: اول قرمز، دوم آبی، سوم سبز.' },
    { domain: 'mem', weight: 3, tag: 'حافظه کاری',
      q: 'اعداد 6 - 3 - 9 - 2 را به خاطر بسپار. اگر عدد 3 را حذف کنیم، مجموع بقیه چقدر است؟',
      options: ['15', '17', '18', '20'],
      correct: 1,
      why: '6 + 9 + 2 = 17.' }
  ];
  var GIQ_TOTAL_SECONDS = 40 * 60;
  var GIQ_DOMAIN_NAMES = { verb: 'هوش کلامی', num: 'هوش عددی', spat: 'هوش فضایی و تصویری', logic: 'استدلال منطقی', mem: 'حافظه کاری' };

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
      tabbar.setAttribute('aria-label', 'Main navigation');
      tabbar.setAttribute('dir', 'ltr');            // برچسب‌های انگلیسی از چپ به راست خوانده شوند
      document.body.appendChild(tabbar);
    }
    tabbar.innerHTML =
      tab('calculations', '🛠️', 'Tools') +
      tab('education', '📖', 'Learn') +
      tab('home', '⌂', 'Home') +
      tab('notes', '📝', 'Notes') +
      tab('materials', '📚', 'Material');

    function tab(action, icon, label) {
      return '<button class="tab" data-action="' + action + '" type="button" dir="ltr" aria-label="' + label + '">' +
        '<span class="t-icon">' + icon + '</span><span>' + label + '</span></button>';
    }

    wireEvents(header, searchbar, searchResults, tabbar);
  }

  function wireEvents(header, searchbar, searchResults, tabbar) {
    var sBtn = header.querySelector('.search-btn');
    var sInput = searchbar.querySelector('input');
    sBtn.addEventListener('click', function () {
      // ذره‌بین فقط در صفحهٔ خانه کار می‌کند. در بقیهٔ صفحه‌ها (مثل دستیار هوش مصنوعی)
      // دکمه پنهان است و اگر به هر دلیلی لمس شد، هیچ کاری نمی‌کند تا اپ قفل/گیر نکند.
      if (!homeIsShowing()) { closeSearchBar(); return; }
      var open = searchbar.classList.toggle('open');
      if (open) {
        // با باز شدن جستجو، فیلتر کارت‌ها از نو اجرا می‌شود
        filterPanels('', searchResults);
        try { sInput.focus(); } catch (e) { }
      } else {
        closeSearchBar();
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

    // وضعیت اولیهٔ ذره‌بین + پیگیری تغییر صفحه (بدون polling و بدون حلقهٔ بی‌پایان)
    syncSearchAvailability();
    observeSearchAvailability();
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

  // ---------- ذره‌بین: فقط در صفحهٔ خانه فعال است ----------
  // در هر صفحهٔ دیگری (دستیار هوش مصنوعی، ابزارها، جزوه‌ها، یادداشت‌ها، بازی و…) دکمه پنهان می‌شود
  // و اگر لمس شود هیچ کاری نمی‌کند؛ همین دو مورد باعث می‌شد قبلاً اپ در فضای دستیار گیر کند.
  var searchObserved = false;
  var searchOffState = null;

  function homeIsShowing() {
    // هر صفحه‌ای که باز باشد (پنل‌ها، دستیار، بازی، یادداشت‌ها، تماس، آزمون‌ها، ماشین‌حساب) یعنی خانه نیستیم
    if (document.querySelector('.tool-panel.active:not([hidden])')) return false;
    if (notesCard && notesCard.classList.contains('active')) return false;
    if (contactCard && contactCard.classList.contains('active')) return false;
    if (quizCard && quizCard.classList.contains('active')) return false;
    if (iqCard && iqCard.classList.contains('active')) return false;
    if (giqCard && giqCard.classList.contains('active')) return false;
    if (document.querySelector('.mobile-education-menu')) return false;
    if (document.querySelector('.scientific-calculator.mobile-open')) return false;
    var home = document.querySelector('.mobile-home');
    if (!home) return false;
    return home.style.display !== 'none';
  }

  function closeSearchBar() {
    var bar = document.querySelector('.mobile-searchbar');
    var input = bar ? bar.querySelector('input') : null;
    if (input) input.value = '';
    var results = document.querySelector('.mobile-search-results');
    if (bar) bar.classList.remove('open');
    if (results) {
      filterPanels('', results);        // کارت‌های مخفی‌شده برمی‌گردند
      results.classList.remove('open'); // بستن قطعی نتیجه‌ها
    }
  }

  function syncSearchAvailability() {
    var header = document.querySelector('.mobile-header-bar');
    if (!header) return;
    var off = !homeIsShowing();
    if (searchOffState === off) return;    // بدون تغییر → هیچ دست‌کاری روی DOM (ضد حلقه)
    searchOffState = off;
    header.classList.toggle('search-off', off);
    if (off) closeSearchBar();
  }

  function observeSearchAvailability() {
    if (searchObserved) return;
    searchObserved = true;
    if (typeof MutationObserver !== 'function') return;   // پشتیبانی نشد: فقط با رویداد کلیک همگام می‌شود
    try {
      var body = document.body;
      if (!body) return;
      var queued = false;
      var observer = new MutationObserver(function () {
        if (queued) return;                 // چند تغییر در یک فریم، یک‌بار بررسی می‌شود
        queued = true;
        setTimeout(function () {
          queued = false;
          try { syncSearchAvailability(); } catch (e) { }
        }, 0);
      });
      // فقط تغییرهای صفحه (class / hidden / style) رصد می‌شود — نه کل درخت DOM
      observer.observe(body, { attributes: true, attributeFilter: ['class', 'hidden', 'style'], subtree: true });
    } catch (e) { }
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
        mCard('programmingQuiz', 'c-teal', '🎯', 'Programming Quiz', 'آزمون برنامه‌نویسی') +
        mCard('mechIq', 'c-violet', '🧩', 'Mech IQ Test', 'تست هوش مهندسی مکانیک') +
        mCard('generalIq', 'c-sky', '🌍', 'General IQ Test', 'تست هوش عمومی استاندارد') +
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

  // ---------- موتور تست هوش مهندسی مکانیک ----------
  function iqMaxScore() {
    var s = 0;
    for (var i = 0; i < IQ_BANK.length; i++) s += IQ_BANK[i].weight;
    return s;
  }
  function iqLevel(iq) {
    if (iq >= 130) return 'استثنایی — ذهن تحلیلی در سطح نخبگان مهندسی';
    if (iq >= 115) return 'بالاتر از میانگین — مناسب طراحی و حل مسئله پیچیده';
    if (iq >= 100) return 'میانگین مهندسی — پایه محکم، با تمرین قوی‌تر می‌شوی';
    if (iq >= 85) return 'کمی پایین‌تر از میانگین — مرور مفاهیم پایه توصیه می‌شود';
    return 'نیاز به تمرین پایه — از سؤال‌های آسان شروع کن';
  }
  function buildQuiz() {
    // نکته مهم: کلاس اختصاصی «mobile-qz» برای همین پنل است. هر سه آزمون کلاس
    // «mobile-quiz» را دارند؛ اگر اینجا '.mobile-quiz' گرفته شود، وقتی کاربر
    // اول تست هوش را باز کرده باشد این پنل ساخته نمی‌شود و سؤال‌های آزمون
    // برنامه‌نویسی داخل پنل تست هوش رندر می‌شوند.
    if (quizCard || document.querySelector('.mobile-qz')) {
      quizCard = quizCard || document.querySelector('.mobile-qz');
      return;
    }
    var ws = document.querySelector('.workspace');
    if (!ws) return;
    var card = el('div', 'mobile-quiz mobile-qz');
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

  // ----- تست هوش مهندسی مکانیک: ساخت صفحه و تایمر -----
  function buildIq() {
    // کلاس اختصاصی «mobile-miq» هم مثل آزمون برنامه‌نویسی لازم است: پنل تست هوش
    // عمومی هم کلاس 'mobile-iq' دارد؛ بدون این کلاس، اگر کاربر اول تست هوش عمومی
    // را باز کند، این پنل ساخته نمی‌شود و سؤال‌های این تست داخل پنل عمومی رندر می‌شوند.
    if (iqCard || document.querySelector('.mobile-miq')) {
      iqCard = iqCard || document.querySelector('.mobile-miq');
      return;
    }
    var ws = document.querySelector('.workspace');
    if (!ws) return;
    var card = el('div', 'mobile-quiz mobile-iq mobile-miq');
    card.setAttribute('aria-label', 'تست هوش مهندسی مکانیک');
    card.innerHTML =
      '<div class="mq-top">' +
        '<button class="mq-close" type="button" aria-label="بستن تست هوش">✕</button>' +
        '<div class="mq-progress"><span class="mq-progress-fill"></span></div>' +
        '<span class="mq-counter">1 / ' + IQ_BANK.length + '</span>' +
      '</div>' +
      '<h2 class="mq-title">تست هوش مهندسی مکانیک</h2>' +
      '<p class="mq-lead">۲۰ سؤال چهارگزینه‌ای در ۴ حوزه (مکانیکی، عددی، منطقی، کاربردی) و ۲۰ دقیقه وقت. ' +
        'در پایان <b>ضریب هوشی (IQ)</b>، سطح، تحلیل هر حوزه و پاسخ تشریحی غلط‌ها را می‌بینی.</p>' +
      '<div class="mq-timer" aria-live="polite"></div>' +
      '<div class="mq-question"></div>' +
      '<div class="mq-feedback" aria-live="polite"></div>' +
      '<div class="mq-result" hidden></div>';
    ws.insertBefore(card, ws.firstChild);
    iqCard = card;
    card.querySelector('.mq-close').addEventListener('click', function () {
      closeIq();
      showHome();
    });
  }

  function closeIq() {
    if (iqState && iqState.tick) { clearInterval(iqState.tick); }
    if (iqState && iqState.timer) { clearTimeout(iqState.timer); } // تایمر «سؤال بعدی خودکار» هم بسته شود
    iqState = null;
    if (!iqCard || !iqCard.classList.contains('active')) return;
    iqCard.classList.remove('active');
  }

  function giqMaxScore() {
    var s = 0;
    for (var i = 0; i < GIQ_BANK.length; i++) s += GIQ_BANK[i].weight;
    return s;
  }

  function showIq() {
    trackPanelChange();
    closeMobileCalculator();
    closeContact();
    closeNotes();
    closeQuiz();
    document.querySelectorAll('.tool-panel').forEach(function (p) {
      p.hidden = true; p.classList.remove('active');
    });
    hideHomePanels();
    buildIq();
    if (iqCard) { iqCard.classList.add('active'); animateMobilePage(iqCard); }
    setActiveTab('mechIq');
    startIq();
    window.scrollTo(0, 0);
    trackPanelChange();
  }

  function startIq() {
    iqState = {
      order: shuffleList(IQ_BANK.map(function (item, index) { return index; })),
      index: 0,
      answers: [],
      endsAt: Date.now() + IQ_TOTAL_SECONDS * 1000,
      tick: null,
      locked: false, // پاسخ این سؤال ثبت شده و بازخورد روی صفحه است
      timer: null    // تایمر رفتن خودکار به سؤال بعد
    };
    iqState.tick = setInterval(iqTick, 1000);
    renderIqQuestion();
    iqTick();
  }

  function iqTick() {
    if (!iqState || !iqCard) return;
    var left = iqState.endsAt - Date.now();
    if (left <= 0) { finishIq(true); return; }
    var bar = iqCard.querySelector('.mq-timer');
    if (bar) {
      var m = Math.floor(left / 60000);
      var s = Math.floor((left % 60000) / 1000);
      bar.textContent = 'زمان باقی‌مانده: ' + m + ':' + (s < 10 ? '0' + s : s);
      bar.classList.toggle('late', left < 3 * 60000);
    }
  }

  function renderIqQuestion() {
    if (!iqCard || !iqState) return;
    var st = iqState;
    if (st.index >= st.order.length) { finishIq(false); return; }
    st.locked = false;                                        // سؤال تازه: دوباره می‌شود پاسخ داد
    if (st.timer) { clearTimeout(st.timer); st.timer = null; } // تایمر سؤال قبلی دیگر کاری نکند
    var item = IQ_BANK[st.order[st.index]];
    var box = iqCard.querySelector('.mq-question');
    var fb = iqCard.querySelector('.mq-feedback');
    var res = iqCard.querySelector('.mq-result');
    if (res) { res.hidden = true; res.innerHTML = ''; }
    if (fb) { fb.className = 'mq-feedback'; fb.innerHTML = ''; }
    var opts = shuffleList(item.options.map(function (t, i) { return i; }));
    var labels = ['الف', 'ب', 'ج', 'د'];
    var html = '<span class="mq-tag">' + escapeHtml(item.tag) + ' • وزن ' + item.weight + '</span>' +
      '<p class="mq-q-title">سؤال ' + (st.index + 1) + ' از ' + st.order.length + '</p>' +
      '<p class="mq-q-desc">' + escapeHtml(item.q) + '</p><div class="mq-opts">';
    for (var k = 0; k < opts.length; k++) {
      html += '<button class="mq-opt" type="button" data-pick="' + opts[k] + '">' +
        '<span class="mq-opt-key">' + labels[k] + '</span>' +
        '<span class="mq-opt-txt">' + escapeHtml(item.options[opts[k]]) + '</span></button>';
    }
    html += '</div>';
    box.innerHTML = html;
    var counter = iqCard.querySelector('.mq-counter');
    if (counter) counter.textContent = (st.index + 1) + ' / ' + st.order.length;
    var fill = iqCard.querySelector('.mq-progress-fill');
    if (fill) fill.style.width = Math.round((st.index / st.order.length) * 100) + '%';
    var btns = box.querySelectorAll('.mq-opt');
    for (var b = 0; b < btns.length; b++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          answerIq(parseInt(btn.getAttribute('data-pick'), 10));
        });
      })(btns[b]);
    }
  }

  function answerIq(picked) {
    if (!iqCard || !iqState) return;
    var st = iqState;
    if (st.locked) return; // پاسخ این سؤال ثبت شده؛ دوباره ثبت نکن
    if (st.index >= st.order.length) return;
    var item = IQ_BANK[st.order[st.index]];
    var ok = picked === item.correct;
    st.locked = true;
    st.answers.push({ item: item, picked: picked, ok: ok });
    var box = iqCard.querySelector('.mq-question');
    if (box) {
      // گزینه‌ها قفل می‌شوند تا تا رفتن خودکار، پاسخ دوم ثبت نشود
      var opts = box.querySelectorAll('.mq-opt');
      for (var i = 0; i < opts.length; i++) opts[i].disabled = true;
    }
    var fb = iqCard.querySelector('.mq-feedback');
    if (fb) {
      var isLast = st.index >= st.order.length - 1;
      fb.className = 'mq-feedback show ' + (ok ? 'ok' : 'bad');
      fb.innerHTML = '<p class="mq-verdict">' + (ok ? 'درست! +' + item.weight + ' امتیاز' : 'غلط — پاسخ درست: ' + escapeHtml(item.options[item.correct])) + '</p>' +
        '<p class="mq-hint">' + escapeHtml(item.why) + '</p>' +
        '<button class="mq-next" type="button">' + (isLast ? 'دیدن نتیجه 🎯' : 'سؤال بعدی ←') + '</button>';
      var next = fb.querySelector('.mq-next');
      if (next) next.addEventListener('click', nextIqQuestion);
    }
    var fill = iqCard.querySelector('.mq-progress-fill');
    if (fill) fill.style.width = Math.round(((st.index + 1) / st.order.length) * 100) + '%';
    // مثل «آزمون برنامه‌نویسی»: بعد از پاسخ، خودکار به سؤال بعد می‌رود.
    // پاسخ درست ۱٫۵ ثانیه و پاسخ غلط ۳٫۴ ثانیه (برای خواندن توضیح). دکمهٔ «سؤال بعدی» هم هست.
    if (st.timer) clearTimeout(st.timer);
    st.timer = setTimeout(nextIqQuestion, ok ? 1500 : 3400);
  }

  function nextIqQuestion() {
    if (!iqCard || !iqState) return;
    if (iqState.timer) { clearTimeout(iqState.timer); iqState.timer = null; }
    if (!iqState.locked) return; // همین حالا جلو رفته؛ دوباره جلو نرو
    iqState.locked = false;
    iqState.index += 1;
    renderIqQuestion();
    window.scrollTo(0, 0);
  }

  function finishIq(timeUp) {
    if (!iqCard || !iqState) return;
    var st = iqState;
    if (st.tick) { clearInterval(st.tick); st.tick = null; }
    if (st.timer) { clearTimeout(st.timer); st.timer = null; } // تایمر خودکار بعد از پایان آزمون کاری نکند
    var max = iqMaxScore();
    var got = 0;
    var domGot = { mech: 0, num: 0, logic: 0, applied: 0 };
    var domMax = { mech: 0, num: 0, logic: 0, applied: 0 };
    for (var i = 0; i < IQ_BANK.length; i++) domMax[IQ_BANK[i].domain] += IQ_BANK[i].weight;
    for (var j = 0; j < st.answers.length; j++) {
      if (st.answers[j].ok) { got += st.answers[j].item.weight; domGot[st.answers[j].item.domain] += st.answers[j].item.weight; }
    }
    var ratio = max ? got / max : 0;
    var iq = Math.round(70 + ratio * 75);
    var msg = timeUp ? 'وقت تمام شد! نتیجه بر اساس پاسخ‌های ثبت‌شده محاسبه شد.' : 'آزمون تمام شد!';
    try { localStorage.setItem('mechIqLast', JSON.stringify({ iq: iq, got: got, max: max, at: Date.now() })); } catch (e) {}
    var box = iqCard.querySelector('.mq-question');
    var fb = iqCard.querySelector('.mq-feedback');
    if (box) box.innerHTML = '';
    if (fb) { fb.className = 'mq-feedback'; fb.innerHTML = ''; }
    var res = iqCard.querySelector('.mq-result');
    if (!res) return;
    res.hidden = false;
    var keys = ['mech', 'num', 'logic', 'applied'];
    var bars = '';
    for (var d = 0; d < keys.length; d++) {
      var k = keys[d];
      var p = domMax[k] ? Math.round((domGot[k] / domMax[k]) * 100) : 0;
      bars += '<div class="mq-dom"><div class="mq-dom-head"><span>' + escapeHtml(IQ_DOMAIN_NAMES[k]) + '</span><span>' + domGot[k] + ' / ' + domMax[k] + '</span></div>' +
        '<div class="mq-dom-bar"><span style="width:' + p + '%"></span></div></div>';
    }
    var wrongHtml = '';
    var wrongCount = 0;
    for (var w = 0; w < st.answers.length; w++) if (!st.answers[w].ok) wrongCount++;
    if (wrongCount) {
      wrongHtml = '<h3 class="mq-wrong-title">سؤال‌هایی که غلط زدی (' + wrongCount + '):</h3><ul class="mq-wrong-list">';
      for (var v = 0; v < st.answers.length; v++) {
        var a = st.answers[v];
        if (a.ok) continue;
        wrongHtml += '<li class="mq-wrong-item"><p class="mq-wrong-q">' + escapeHtml(a.item.q) + '</p>' +
          '<p class="mq-wrong-ans">پاسخ تو: <b class="mq-bad">' + escapeHtml(a.item.options[a.picked]) + '</b><br>پاسخ درست: <b>' + escapeHtml(a.item.options[a.item.correct]) + '</b><br>' + escapeHtml(a.item.why) + '</p></li>';
      }
      wrongHtml += '</ul>';
    } else {
      wrongHtml = '<p class="mq-perfect">بدون غلط! همه را درست زدی — ذهن مهندسی‌ات عالیه.</p>';
    }
    res.innerHTML =
      '<p class="mq-msg">' + escapeHtml(msg) + '</p>' +
      '<div class="mq-score"><p class="mq-score-num">IQ ' + iq + '</p>' +
      '<p class="mq-score-label">نمره خام: ' + got + ' از ' + max + ' • ' + escapeHtml(iqLevel(iq)) + '</p></div>' +
      '<div class="mq-doms">' + bars + '</div>' + wrongHtml +
      '<div class="mq-actions"><button class="mq-again" type="button">تلاش دوباره</button>' +
      '<button class="mq-home" type="button">خانه</button></div>';
    var again = res.querySelector('.mq-again');
    if (again) again.addEventListener('click', function () { startIq(); window.scrollTo(0, 0); });
    var home = res.querySelector('.mq-home');
    if (home) home.addEventListener('click', function () { closeIq(); showHome(); });
    var counter = iqCard.querySelector('.mq-counter');
    if (counter) counter.textContent = st.answers.length + ' / ' + st.order.length;
    var fill = iqCard.querySelector('.mq-progress-fill');
    if (fill) fill.style.width = '100%';
    window.scrollTo(0, 0);
  }

  function buildGiq() {
    if (giqCard || document.querySelector('.mobile-giq')) {
      giqCard = giqCard || document.querySelector('.mobile-giq');
      return;
    }
    var ws = document.querySelector('.workspace');
    if (!ws) return;
    var card = el('div', 'mobile-quiz mobile-iq mobile-giq');
    card.setAttribute('aria-label', 'تست هوش عمومی استاندارد');
    card.innerHTML =
      '<div class="mq-top">' +
        '<button class="mq-close" type="button" aria-label="بستن تست هوش عمومی">✕</button>' +
        '<div class="mq-progress"><span class="mq-progress-fill"></span></div>' +
        '<span class="mq-counter">1 / ' + GIQ_BANK.length + '</span>' +
      '</div>' +
      '<h2 class="mq-title">تست هوش عمومی استاندارد</h2>' +
      '<p class="mq-lead">۴۰ سؤال استاندارد در ۵ مقیاس (کلامی، عددی، فضایی، منطقی، حافظه) و ۴۰ دقیقه وقت. برای همه افراد، بدون نیاز به دانش مهندسی.</p>' +
      '<div class="mq-timer" aria-live="polite"></div>' +
      '<div class="mq-question"></div>' +
      '<div class="mq-feedback" aria-live="polite"></div>' +
      '<div class="mq-result" hidden></div>';
    ws.insertBefore(card, ws.firstChild);
    giqCard = card;
    card.querySelector('.mq-close').addEventListener('click', function () {
      closeGiq();
      showHome();
    });
  }

  function closeGiq() {
    if (giqState && giqState.tick) { clearInterval(giqState.tick); }
    if (giqState && giqState.timer) { clearTimeout(giqState.timer); } // تایمر «سؤال بعدی خودکار» هم بسته شود
    giqState = null;
    if (!giqCard || !giqCard.classList.contains('active')) return;
    giqCard.classList.remove('active');
  }

  function showGiq() {
    trackPanelChange();
    closeMobileCalculator();
    closeContact();
    closeNotes();
    closeQuiz();
    closeIq();
    document.querySelectorAll('.tool-panel').forEach(function (p) {
      p.hidden = true; p.classList.remove('active');
    });
    hideHomePanels();
    buildGiq();
    if (giqCard) { giqCard.classList.add('active'); animateMobilePage(giqCard); }
    setActiveTab('generalIq');
    startGiq();
    window.scrollTo(0, 0);
    trackPanelChange();
  }

  function startGiq() {
    giqState = {
      order: shuffleList(GIQ_BANK.map(function (item, index) { return index; })),
      index: 0,
      answers: [],
      endsAt: Date.now() + GIQ_TOTAL_SECONDS * 1000,
      tick: null,
      locked: false, // پاسخ این سؤال ثبت شده و بازخورد روی صفحه است
      timer: null    // تایمر رفتن خودکار به سؤال بعد
    };
    giqState.tick = setInterval(giqTick, 1000);
    renderGiqQuestion();
    giqTick();
  }

  function giqTick() {
    if (!giqState || !giqCard) return;
    var left = giqState.endsAt - Date.now();
    if (left <= 0) { finishGiq(true); return; }
    var bar = giqCard.querySelector('.mq-timer');
    if (bar) {
      var m = Math.floor(left / 60000);
      var s = Math.floor((left % 60000) / 1000);
      bar.textContent = 'زمان باقی‌مانده: ' + m + ':' + (s < 10 ? '0' + s : s);
      bar.classList.toggle('late', left < 3 * 60000);
    }
  }

  function renderGiqQuestion() {
    if (!giqCard || !giqState) return;
    var st = giqState;
    if (st.index >= st.order.length) { finishGiq(false); return; }
    st.locked = false;                                        // سؤال تازه: دوباره می‌شود پاسخ داد
    if (st.timer) { clearTimeout(st.timer); st.timer = null; } // تایمر سؤال قبلی دیگر کاری نکند
    var item = GIQ_BANK[st.order[st.index]];
    var box = giqCard.querySelector('.mq-question');
    var fb = giqCard.querySelector('.mq-feedback');
    var res = giqCard.querySelector('.mq-result');
    if (res) { res.hidden = true; res.innerHTML = ''; }
    if (fb) { fb.className = 'mq-feedback'; fb.innerHTML = ''; }
    var opts = shuffleList(item.options.map(function (t, i) { return i; }));
    var labels = ['الف', 'ب', 'ج', 'د'];
    var html = '<span class="mq-tag">' + escapeHtml(item.tag) + ' • وزن ' + item.weight + '</span>' +
      '<p class="mq-q-title">سؤال ' + (st.index + 1) + ' از ' + st.order.length + '</p>' +
      '<p class="mq-q-desc">' + escapeHtml(item.q) + '</p><div class="mq-opts">';
    for (var k = 0; k < opts.length; k++) {
      html += '<button class="mq-opt" type="button" data-pick="' + opts[k] + '">' +
        '<span class="mq-opt-key">' + labels[k] + '</span>' +
        '<span class="mq-opt-txt">' + escapeHtml(item.options[opts[k]]) + '</span></button>';
    }
    html += '</div>';
    box.innerHTML = html;
    var counter = giqCard.querySelector('.mq-counter');
    if (counter) counter.textContent = (st.index + 1) + ' / ' + st.order.length;
    var fill = giqCard.querySelector('.mq-progress-fill');
    if (fill) fill.style.width = Math.round((st.index / st.order.length) * 100) + '%';
    var btns = box.querySelectorAll('.mq-opt');
    for (var b = 0; b < btns.length; b++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          answerGiq(parseInt(btn.getAttribute('data-pick'), 10));
        });
      })(btns[b]);
    }
  }

  function answerGiq(picked) {
    if (!giqCard || !giqState) return;
    var st = giqState;
    if (st.locked) return; // پاسخ این سؤال ثبت شده؛ دوباره ثبت نکن
    if (st.index >= st.order.length) return;
    var item = GIQ_BANK[st.order[st.index]];
    var ok = picked === item.correct;
    st.locked = true;
    st.answers.push({ item: item, picked: picked, ok: ok });
    var box = giqCard.querySelector('.mq-question');
    if (box) {
      // گزینه‌ها قفل می‌شوند تا تا رفتن خودکار، پاسخ دوم ثبت نشود
      var opts = box.querySelectorAll('.mq-opt');
      for (var i = 0; i < opts.length; i++) opts[i].disabled = true;
    }
    var fb = giqCard.querySelector('.mq-feedback');
    if (fb) {
      var isLast = st.index >= st.order.length - 1;
      fb.className = 'mq-feedback show ' + (ok ? 'ok' : 'bad');
      fb.innerHTML = '<p class="mq-verdict">' + (ok ? 'درست! +' + item.weight + ' امتیاز' : 'غلط — پاسخ درست: ' + escapeHtml(item.options[item.correct])) + '</p>' +
        '<p class="mq-hint">' + escapeHtml(item.why) + '</p>' +
        '<button class="mq-next" type="button">' + (isLast ? 'دیدن نتیجه 🎯' : 'سؤال بعدی ←') + '</button>';
      var next = fb.querySelector('.mq-next');
      if (next) next.addEventListener('click', nextGiqQuestion);
    }
    var fill = giqCard.querySelector('.mq-progress-fill');
    if (fill) fill.style.width = Math.round(((st.index + 1) / st.order.length) * 100) + '%';
    // مثل «آزمون برنامه‌نویسی»: بعد از پاسخ، خودکار به سؤال بعد می‌رود.
    // پاسخ درست ۱٫۵ ثانیه و پاسخ غلط ۳٫۴ ثانیه (برای خواندن توضیح). دکمهٔ «سؤال بعدی» هم هست.
    if (st.timer) clearTimeout(st.timer);
    st.timer = setTimeout(nextGiqQuestion, ok ? 1500 : 3400);
  }

  function nextGiqQuestion() {
    if (!giqCard || !giqState) return;
    if (giqState.timer) { clearTimeout(giqState.timer); giqState.timer = null; }
    if (!giqState.locked) return; // همین حالا جلو رفته؛ دوباره جلو نرو
    giqState.locked = false;
    giqState.index += 1;
    renderGiqQuestion();
    window.scrollTo(0, 0);
  }

  function finishGiq(timeUp) {
    if (!giqCard || !giqState) return;
    var st = giqState;
    if (st.tick) { clearInterval(st.tick); st.tick = null; }
    if (st.timer) { clearTimeout(st.timer); st.timer = null; } // تایمر خودکار بعد از پایان آزمون کاری نکند
    var max = giqMaxScore();
    var got = 0;
    var keys = ['verb', 'num', 'spat', 'logic', 'mem'];
    var domGot = { verb: 0, num: 0, spat: 0, logic: 0, mem: 0 };
    var domMax = { verb: 0, num: 0, spat: 0, logic: 0, mem: 0 };
    for (var i = 0; i < GIQ_BANK.length; i++) domMax[GIQ_BANK[i].domain] += GIQ_BANK[i].weight;
    for (var j = 0; j < st.answers.length; j++) {
      if (st.answers[j].ok) { got += st.answers[j].item.weight; domGot[st.answers[j].item.domain] += st.answers[j].item.weight; }
    }
    var ratio = max ? got / max : 0;
    finishGiqRender(st, got, max, domGot, domMax, keys, ratio, timeUp);
  }

  function finishGiqRender(st, got, max, domGot, domMax, keys, ratio, timeUp) {
    var iq = Math.round(70 + ratio * 75);
    var msg = timeUp ? 'وقت تمام شد! نتیجه بر اساس پاسخ‌های ثبت‌شده محاسبه شد.' : 'آزمون تمام شد!';
    try { localStorage.setItem('generalIqLast', JSON.stringify({ iq: iq, got: got, max: max, at: Date.now() })); } catch (e) {}
    var box = giqCard.querySelector('.mq-question');
    var fb = giqCard.querySelector('.mq-feedback');
    if (box) box.innerHTML = '';
    if (fb) { fb.className = 'mq-feedback'; fb.innerHTML = ''; }
    var res = giqCard.querySelector('.mq-result');
    if (!res) return;
    res.hidden = false;
    var bars = '';
    for (var d = 0; d < keys.length; d++) {
      var k = keys[d];
      var p = domMax[k] ? Math.round((domGot[k] / domMax[k]) * 100) : 0;
      bars += '<div class="mq-dom"><div class="mq-dom-head"><span>' + escapeHtml(GIQ_DOMAIN_NAMES[k]) + '</span><span>' + domGot[k] + ' / ' + domMax[k] + '</span></div>' +
        '<div class="mq-dom-bar"><span style="width:' + p + '%"></span></div></div>';
    }
    var wrongCount = 0;
    for (var w = 0; w < st.answers.length; w++) if (!st.answers[w].ok) wrongCount++;
    var wrongHtml;
    if (wrongCount) {
      wrongHtml = '<h3 class="mq-wrong-title">سؤال‌هایی که غلط زدی (' + wrongCount + '):</h3><ul class="mq-wrong-list">';
      for (var v = 0; v < st.answers.length; v++) {
        var a = st.answers[v];
        if (a.ok) continue;
        wrongHtml += '<li class="mq-wrong-item"><p class="mq-wrong-q">' + escapeHtml(a.item.q) + '</p>' +
          '<p class="mq-wrong-ans">پاسخ تو: <b class="mq-bad">' + escapeHtml(a.item.options[a.picked]) + '</b><br>پاسخ درست: <b>' + escapeHtml(a.item.options[a.item.correct]) + '</b><br>' + escapeHtml(a.item.why) + '</p></li>';
      }
      wrongHtml += '</ul>';
    } else {
      wrongHtml = '<p class="mq-perfect">بدون غلط! همه را درست زدی — عالیه.</p>';
    }
    res.innerHTML =
      '<p class="mq-msg">' + escapeHtml(msg) + '</p>' +
      '<div class="mq-score"><p class="mq-score-num">IQ ' + iq + '</p>' +
      '<p class="mq-score-label">نمره خام: ' + got + ' از ' + max + ' • ' + escapeHtml(iqLevel(iq)) + '</p></div>' +
      '<div class="mq-doms">' + bars + '</div>' + wrongHtml +
      '<div class="mq-actions"><button class="mq-again" type="button">تلاش دوباره</button>' +
      '<button class="mq-home" type="button">خانه</button></div>';
    var again = res.querySelector('.mq-again');
    if (again) again.addEventListener('click', function () { startGiq(); window.scrollTo(0, 0); });
    var home = res.querySelector('.mq-home');
    if (home) home.addEventListener('click', function () { closeGiq(); showHome(); });
    var counter = giqCard.querySelector('.mq-counter');
    if (counter) counter.textContent = st.answers.length + ' / ' + st.order.length;
    var fill2 = giqCard.querySelector('.mq-progress-fill');
    if (fill2) fill2.style.width = '100%';
    window.scrollTo(0, 0);
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
    if (giqCard && giqCard.classList.contains('active')) return '__giq__';
    if (iqCard && iqCard.classList.contains('active')) return '__iq__';
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
    syncSearchAvailability();   // ذره‌بین فقط در خانه فعال بماند (بدون انتظار برای ناظر)
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
        closeIq();
        closeGiq();
        document.querySelectorAll('.tool-panel').forEach(function (p) {
          p.hidden = true; p.classList.remove('active');
        });
        hideHomePanels();
        buildQuiz();
        if (quizCard) { quizCard.classList.add('active'); animateMobilePage(quizCard); }
        setActiveTab('programmingQuiz');
      } else if (key === '__iq__') {
        closeContact();
        closeNotes();
        closeQuiz();
        closeGiq();
        document.querySelectorAll('.tool-panel').forEach(function (p) {
          p.hidden = true; p.classList.remove('active');
        });
        hideHomePanels();
        buildIq();
        if (iqCard) { iqCard.classList.add('active'); animateMobilePage(iqCard); }
        setActiveTab('mechIq');
      } else if (key === '__contact__') {
        closeNotes();
        closeQuiz();
        closeIq();
        closeGiq();
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
        closeIq();
        closeGiq();
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
    closeIq();
    closeGiq();
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
    if (sb) { closeSearchBar(); return; }
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
    closeIq();      // خروج از تست هوش هم یک قدم است
    closeGiq();     // خروج از تست هوش عمومی هم یک قدم است
    if (action === 'education') { showEducationMenu(); return; }
    if (action === 'notes') { showNotes(); return; }
    if (action === 'programmingQuiz') { showQuiz(); return; }
    if (action === 'mechIq') { showIq(); return; }
    if (action === 'generalIq') { showGiq(); return; }
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
    closeIq();      // تست هوش هم با برگشت به خانه بسته می‌شود
    closeGiq();     // تست هوش عمومی هم با برگشت به خانه بسته می‌شود
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
    closeIq();
    closeGiq();
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
      '<button type="button" data-education-action="programmingTraining">🧠 آموزش برنامه‌نویسی</button>';
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
    closeIq();
    closeGiq();
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

