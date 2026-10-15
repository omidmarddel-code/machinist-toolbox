// ===== Machinist Toolbox — اصطلاحات ماشین‌کاری (Machining Terms) =====
// فقط نسخه اندروید:
//   صفحهٔ اصلی → دو دکمه: «🎓 آموزش اصطلاحات» (کارت‌های یک‌به‌یک با تلفظ انگلیسی)
//                و «🎯 آزمون اصطلاحات» (چهارگزینه‌ای)
(function () {
  'use strict';

  // فقط داخل اپ اندروید فعال شود (نسخه وب دست‌نخورده می‌ماند).
  // توجه: تشخیص واقعی در init() انجام می‌شود؛ اینجا فقط اگر مطمئنیم وب است
  // (نه اندروید، نه preview) زودتر خارج می‌شویم. mobile.js ممکن است با defer
  // هنوز کلاس capacitor-mobile را نگذاشته باشد، پس اینجا return قطعی نمی‌کنیم.
  function detectMobile() {
    try {
      if (document.body && document.body.classList.contains('capacitor-mobile')) return true;
      if (document.documentElement.classList.contains('android-boot')) return true;
      if (new URLSearchParams(window.location.search).get('mobile') === 'preview') return true;
      if (window.self !== window.top) return true;
      if (window.Capacitor && typeof window.Capacitor.getPlatform === 'function' &&
          window.Capacitor.getPlatform() === 'android') return true;
      if (/Android/i.test(navigator.userAgent || '')) return true;
    } catch (e) { /* noop */ }
    return false;
  }
  if (!document.body) return;

  // ---------- فرهنگ اصطلاحات ماشین‌کاری ----------
  // fa = معنی فارسی (در آزمون نمایش داده می‌شود) | en = معادل انگلیسی (پاسخ کاربر)
  // alt = پاسخ‌های جایگزین قابل قبول | cat = گروه (برای دسته‌بندی و نمایش)
  var TERMS = [
    // ================= عملیات ماشینکاری (Processes) =================
    { fa: 'ماشین‌کاری، براده‌برداری', en: 'Machining', cat: 'عملیات ماشینکاری' },
    { fa: 'تراشکاری', en: 'Turning', alt: ['Lathe Turning'], cat: 'عملیات ماشینکاری' },
    { fa: 'فرزکاری', en: 'Milling', alt: ['Milling Operation'], cat: 'عملیات ماشینکاری' },
    { fa: 'خشن‌تراشی', en: 'Roughing', alt: ['Rough Turning', 'Rough Milling'], cat: 'عملیات ماشینکاری' },
    { fa: 'پرداخت‌کاری، پرداخت نهایی', en: 'Finishing', alt: ['Finish Turning', 'Finishing Pass'], cat: 'عملیات ماشینکاری' },
    { fa: 'پیشانی‌تراشی', en: 'Facing', alt: ['Face Turning'], cat: 'عملیات ماشینکاری' },
    { fa: 'سوراخ‌کاری', en: 'Drilling', alt: ['Drill'], cat: 'عملیات ماشینکاری' },
    { fa: 'بورینگ، داخل‌تراشی و راستکاری سوراخ', en: 'Boring', alt: ['Bore'], cat: 'عملیات ماشینکاری' },
    { fa: 'ریمرزنی، راسته‌زنی', en: 'Reaming', alt: ['Ream'], cat: 'عملیات ماشینکاری' },
    { fa: 'شیارزنی', en: 'Grooving', alt: ['Groove'], cat: 'عملیات ماشینکاری' },
    { fa: 'جدا کردن قطعه (بریدن)', en: 'Parting', alt: ['Cutting Off', 'Part Off'], cat: 'عملیات ماشینکاری' },
    { fa: 'رزوه‌زنی، پیچ‌زنی', en: 'Threading', alt: ['Thread Cutting'], cat: 'عملیات ماشینکاری' },
    { fa: 'آج‌زنی (ایجاد سطح زبر)', en: 'Knurling', alt: ['Knurl'], cat: 'عملیات ماشینکاری' },
    { fa: 'قلاویززنی (رزوه با قلاویز)', en: 'Tapping', alt: ['Tap'], cat: 'عملیات ماشینکاری' },
    { fa: 'سنبه‌کاری، سنباده‌زنی', en: 'Broaching', alt: ['Broach'], cat: 'عملیات ماشینکاری' },
    { fa: 'سنگ‌زنی، سنگ‌کاری', en: 'Grinding', alt: ['Grind'], cat: 'عملیات ماشینکاری' },
    { fa: 'لایه‌برداری تخت و صاف', en: 'Planing', alt: ['Planer'], cat: 'عملیات ماشینکاری' },
    { fa: 'راشکاری', en: 'Shaping', alt: ['Shaper'], cat: 'عملیات ماشینکاری' },
    { fa: 'شخم‌زنی دندانه', en: 'Hobbing', alt: ['Gear Hobbing'], cat: 'عملیات ماشینکاری' },
    { fa: 'پرزگیری، لبه‌گیری', en: 'Deburring', alt: ['Deburr', 'Burr Removal'], cat: 'عملیات ماشینکاری' },
    { fa: 'گردکردن لبه، گوشه‌گیری', en: 'Chamfering', alt: ['Chamfer'], cat: 'عملیات ماشینکاری' },
    { fa: 'راندن لبه، فیلترساز', en: 'Filleting', alt: ['Fillet'], cat: 'عملیات ماشینکاری' },
    { fa: 'پولیش، آبکاری', en: 'Polishing', alt: ['Buffing'], cat: 'عملیات ماشینکاری' },
    { fa: 'شیار کلیدزنی', en: 'Keyway Milling', alt: ['Keyseating', 'Keyway'], cat: 'عملیات ماشینکاری' },
    { fa: 'مرکزکاری، سوراخ مرکز', en: 'Centering', alt: ['Center Drilling'], cat: 'عملیات ماشینکاری' },
    { fa: 'تراش مقنی (مخروطی)', en: 'Taper Turning', alt: ['Tapering'], cat: 'عملیات ماشینکاری' },
    { fa: 'براده‌برداری مرطوب', en: 'Wet Machining', cat: 'عملیات ماشینکاری' },
    { fa: 'براده‌برداری خشک', en: 'Dry Machining', cat: 'عملیات ماشینکاری' },
    { fa: 'ماشین‌کاری تخلیهٔ الکتریکی', en: 'Electrical Discharge Machining', alt: ['EDM'], cat: 'عملیات ماشینکاری' },
    { fa: 'برش با آب تحت فشار', en: 'Waterjet Cutting', alt: ['Water Jet'], cat: 'عملیات ماشینکاری' },
    // ================= دستگاه و اجزای ماشین =================
    { fa: 'دستگاه تراش', en: 'Lathe', alt: ['Lathe Machine'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'دستگاه فرز', en: 'Milling Machine', alt: ['Mill'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'دستگاه دریل، ستون سوراخ‌کار', en: 'Drill Press', cat: 'دستگاه و اجزای ماشین' },
    { fa: 'ماشین سنگ‌زن', en: 'Grinding Machine', alt: ['Grinder'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'ماشین سیم برشی', en: 'Wire Cut Machine', alt: ['Wire EDM'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'اسپیندل', en: 'Spindle', alt: ['Main Spindle'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'سه‌نظام، چاک', en: 'Chuck', alt: ['Three Jaw Chuck'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'چاک چهارفک', en: 'Four Jaw Chuck', cat: 'دستگاه و اجزای ماشین' },
    { fa: 'فک (انبر چاک)', en: 'Jaw', alt: ['Jaws'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'مرغک', en: 'Tailstock', alt: ['Tail Stock'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'هد، هداستوک', en: 'Headstock', alt: ['Head Stock'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'سوپرت (سوارهٔ ابزار)', en: 'Carriage', alt: ['Saddle'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'سوارهٔ عرضی', en: 'Cross Slide', alt: ['Compound Slide'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'ابزارگیر', en: 'Tool Post', alt: ['Tool Holder', 'Turret'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'ریل یا بستر دستگاه', en: 'Bed', alt: ['Machine Bed'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'میز دستگاه (تختهٔ کار)', en: 'Table', alt: ['Machine Table'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'گیره رومیزی، وایس', en: 'Vise', alt: ['Machine Vice'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'فیکسچر، قالب ابزار', en: 'Fixture', alt: ['Jig'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'میندل (میلهٔ نگه‌دارنده)', en: 'Mandrel', alt: ['Arbor'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'قطبک (مرکز ثابت تراش)', en: 'Lathe Center', alt: ['Center'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'پیچ مهره‌ای هدایت', en: 'Lead Screw', alt: ['Leadscrew'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'پیچ گلوله‌ای (بال‌اسکرو)', en: 'Ball Screw', alt: ['Ballscrew'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'واحد کنترل CNC', en: 'Control Unit', alt: ['CNC Controller', 'Controller'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'چرخ دستی (حالت Jog)', en: 'Handwheel', alt: ['Jog Wheel', 'MPG'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'موتور سروو', en: 'Servo Motor', alt: ['Servo'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'موتور پله‌ای', en: 'Stepper Motor', alt: ['Stepper'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'انکودر (رمزگذار موقعیت)', en: 'Encoder', cat: 'دستگاه و اجزای ماشین' },
    { fa: 'مخزنگاه ابزار خودکار', en: 'Tool Changer', alt: ['ATC', 'Tool Magazine'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'دستگاه پنج‌محوره', en: 'Five Axis Machine', alt: ['5 Axis Machine'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'قرص فشنگی (متصل به اسپیندل)', en: 'Faceplate', alt: ['Face Plate'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'مینگِر حرکت‌کننده', en: 'Live Center', cat: 'دستگاه و اجزای ماشین' },
    { fa: 'طاقه (نگه‌دارندهٔ قطعهٔ بلند)', en: 'Steady Rest', alt: ['Follow Rest'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'چیلر (خنک‌کننده)', en: 'Chiller', alt: ['Coolant Chiller'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'چراغ راهنما، لامپ نشانگر', en: 'Indicator Light', cat: 'دستگاه و اجزای ماشین' },
    { fa: 'قطعه‌کار، شیء کار', en: 'Workpiece', alt: ['Work Piece', 'Part'], cat: 'دستگاه و اجزای ماشین' },
    { fa: 'میل راهنما', en: 'Guide Pillar', cat: 'دستگاه و اجزای ماشین' },
    { fa: 'بوش راهنما', en: 'Guide Bushing', alt: ['Guide Bush'], cat: 'دستگاه و اجزای ماشین' },
    // ================= ابزار برش (Cutting tools) =================
    { fa: 'اینسرت (الماس تراش)', en: 'Insert', alt: ['Cutting Insert'], cat: 'ابزار برش' },
    { fa: 'نوک برندهٔ ابزار', en: 'Cutting Edge', alt: ['Edge'], cat: 'ابزار برش' },
    { fa: 'ابزار تک‌نوک (تراش)', en: 'Single Point Tool', alt: ['Turning Tool'], cat: 'ابزار برش' },
    { fa: 'تیغهٔ HSS (فولاد تندرو)', en: 'HSS Tool', alt: ['High Speed Steel Tool'], cat: 'ابزار برش' },
    { fa: 'ابزار کارباید تنگستن', en: 'Carbide Tool', alt: ['Tungsten Carbide'], cat: 'ابزار برش' },
    { fa: 'روکش‌دار (ابزار پوشش‌داده‌شده)', en: 'Coated', alt: ['Coated Insert'], cat: 'ابزار برش' },
    { fa: 'فرز ته‌گرد (انڈ‌میل)', en: 'End Mill', alt: ['Endmill'], cat: 'ابزار برش' },
    { fa: 'فرز ته‌کره', en: 'Ball Nose End Mill', alt: ['Ball Mill', 'Ball Nose'], cat: 'ابزار برش' },
    { fa: 'فرز گوشه‌گرد', en: 'Corner Radius End Mill', alt: ['Bull Nose'], cat: 'ابزار برش' },
    { fa: 'فرز کف (پیشانی)', en: 'Face Mill', alt: ['Facing Mill'], cat: 'ابزار برش' },
    { fa: 'فرز حلقه‌ای، فرز پوسته‌ای', en: 'Shell Mill', cat: 'ابزار برش' },
    { fa: 'مته', en: 'Drill', alt: ['Drill Bit'], cat: 'ابزار برش' },
    { fa: 'مته ته‌گرد مارپیچی', en: 'Twist Drill', cat: 'ابزار برش' },
    { fa: 'مته مرغک (تیزکاری)', en: 'Spot Drill', alt: ['Center Drill'], cat: 'ابزار برش' },
    { fa: 'ریمر، راسته', en: 'Reamer', alt: ['Ream'], cat: 'ابزار برش' },
    { fa: 'قلاویز', en: 'Tap', cat: 'ابزار برش' },
    { fa: 'ابزار شیارزن', en: 'Grooving Tool', alt: ['Grooving Insert'], cat: 'ابزار برش' },
    { fa: 'ابزار جداکننده', en: 'Parting Tool', alt: ['Cut Off Tool'], cat: 'ابزار برش' },
    { fa: 'ابزار رزوه‌زن', en: 'Threading Tool', alt: ['Threading Insert'], cat: 'ابزار برش' },
    { fa: 'هَدرِ داخل‌کاری (بورینگ بار)', en: 'Boring Bar', alt: ['Boring Head'], cat: 'ابزار برش' },
    { fa: 'پولی (ابزار سنباده‌کاری)', en: 'Broach', cat: 'ابزار برش' },
    { fa: 'فرز فرم (فرز قالب)', en: 'Form Cutter', alt: ['Form Mill'], cat: 'ابزار برش' },
    { fa: 'تیشو (ابزار پرداخت سوراخ)', en: 'Hone', alt: ['Honing Tool'], cat: 'ابزار برش' },
    { fa: 'ارهٔ نواری (برش)', en: 'Bandsaw', alt: ['Band Saw'], cat: 'ابزار برش' },
    { fa: 'تیزکاری ابزار', en: 'Tool Sharpening', alt: ['Regrinding'], cat: 'ابزار برش' },
    { fa: 'هلدر ابزار (نگاه‌دارنده)', en: 'Tool Holder', alt: ['Holder'], cat: 'ابزار برش' },
    { fa: 'کنیسیون (سازش ابزار)', en: 'Collet', cat: 'ابزار برش' },
    { fa: 'سنگ تیزکن', en: 'Grinding Stone', cat: 'ابزار برش' },
    { fa: 'چرخ سنباده', en: 'Grinding Wheel', alt: ['Abrasive Wheel'], cat: 'ابزار برش' },
    { fa: 'تیغهٔ فرز U-دریل', en: 'U Drill', alt: ['Indexable Drill'], cat: 'ابزار برش' },
    { fa: 'زاویهٔ نوک ابزار', en: 'Tool Angle', alt: ['Nose Angle'], cat: 'ابزار برش' },
    { fa: 'زاویهٔ برگشت (کلیرنس)', en: 'Clearance Angle', cat: 'ابزار برش' },
    { fa: 'زاویهٔ پشت برش', en: 'Rake Angle', cat: 'ابزار برش' },
    { fa: 'شعاع نوک ابزار', en: 'Nose Radius', alt: ['Tool Nose Radius'], cat: 'ابزار برش' },
    // ================= پارامترهای برش (Cutting parameters) =================
    { fa: 'سرعت برش', en: 'Cutting Speed', alt: ['Vc'], cat: 'پارامترهای برش' },
    { fa: 'دور اسپیندل', en: 'Spindle Speed', alt: ['RPM', 'Revolutions Per Minute'], cat: 'پارامترهای برش' },
    { fa: 'پیشروی', en: 'Feed Rate', alt: ['Feed'], cat: 'پارامترهای برش' },
    { fa: 'پیشروی هر دور', en: 'Feed Per Revolution', alt: ['Feed Rate Per Rev'], cat: 'پارامترهای برش' },
    { fa: 'پیشروی هر دندان', en: 'Feed Per Tooth', alt: ['Chip Load'], cat: 'پارامترهای برش' },
    { fa: 'عمق برش', en: 'Depth Of Cut', alt: ['DOC', 'Depth'], cat: 'پارامترهای برش' },
    { fa: 'عرض برش', en: 'Width Of Cut', alt: ['Radial Depth'], cat: 'پارامترهای برش' },
    { fa: 'نرخ براده‌برداری', en: 'Material Removal Rate', alt: ['MRR'], cat: 'پارامترهای برش' },
    { fa: 'براده', en: 'Chip', alt: ['Swarf'], cat: 'پارامترهای برش' },
    { fa: 'زمان سیکل', en: 'Cycle Time', cat: 'پارامترهای برش' },
    { fa: 'پاس (گذر ابزار)', en: 'Pass', alt: ['Cutting Pass'], cat: 'پارامترهای برش' },
    { fa: 'مایع برش، روغن برش', en: 'Cutting Fluid', alt: ['Coolant', 'Lubricant'], cat: 'پارامترهای برش' },
    { fa: 'سایش ابزار', en: 'Tool Wear', alt: ['Worn Tool'], cat: 'پارامترهای برش' },
    { fa: 'طول عمر ابزار', en: 'Tool Life', cat: 'پارامترهای برش' },
    { fa: 'لرزش (چتِر)', en: 'Chatter', alt: ['Vibration'], cat: 'پارامترهای برش' },
    { fa: 'برادهٔ پرت (خطر)', en: 'Flying Chip', cat: 'پارامترهای برش' },
    { fa: 'ضخامت براده', en: 'Chip Thickness', cat: 'پارامترهای برش' },
    { fa: 'سایش لبه (پرزی)', en: 'Flank Wear', alt: ['Crater Wear'], cat: 'پارامترهای برش' },
    { fa: 'خط مرکز', en: 'Centerline', cat: 'پارامترهای برش' },
    { fa: 'دور لو (دور خالی)', en: 'Idle Speed', cat: 'پارامترهای برش' },
    { fa: 'حرکت سریع (رپید)', en: 'Rapid Traverse', alt: ['Rapid'], cat: 'پارامترهای برش' },
    { fa: 'حذف بار اضافی (پرداخت)', en: 'Stock Removal', alt: ['Allowance'], cat: 'پارامترهای برش' },
    { fa: 'کارایی براده‌برداری', en: 'Cutting Efficiency', cat: 'پارامترهای برش' },
    { fa: 'انبساط حرارتی', en: 'Thermal Expansion', cat: 'پارامترهای برش' },

    // ================= اندازه‌گیری و تلرانس =================
    { fa: 'کولیس', en: 'Vernier Caliper', alt: ['Caliper'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'میکرومتر (ریزسنج)', en: 'Micrometer', cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'ساعت اندیکاتور', en: 'Dial Indicator', alt: ['Indicator Gauge'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'گیج قطر داخلی، گیج سیلندر', en: 'Bore Gauge', alt: ['Cylinder Gauge'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'گیج قالب (برو-نرو)', en: 'Snap Gauge', alt: ['Go No Go Gauge'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'گیج رزوه', en: 'Thread Gauge', alt: ['Thread Plug Gauge'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'شعاع‌سنج', en: 'Radius Gauge', alt: ['Radius Template'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'عمق‌سنج', en: 'Depth Gauge', alt: ['Depth Micrometer'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'گونیا (نقاله)', en: 'Protractor', alt: ['Angle Gauge'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'پایهٔ مغناطیسی ساعت', en: 'Magnetic Base', alt: ['Magnetic Stand'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'بلوک گیج', en: 'Gauge Block', alt: ['Slip Gauge'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'سختی‌سنج', en: 'Hardness Tester', alt: ['Durometer'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'دستگاه اندازه‌گیری سه‌بعدی', en: 'CMM', alt: ['Coordinate Measuring Machine'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'تلرانس (رواداری)', en: 'Tolerance', cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'اندازهٔ اسمی', en: 'Nominal Dimension', alt: ['Nominal Size'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'رواداری هندسی (GD&T)', en: 'Geometrical Tolerance', alt: ['GD&T'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'مرجع اصلی (دیتوم)', en: 'Datum', cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'جفت‌کاری (فیت)', en: 'Fit', alt: ['Fitting'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'فرجه (فیت روان)', en: 'Clearance Fit', cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'فشار (فیت تنگ)', en: 'Interference Fit', alt: ['Press Fit'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'هم‌مرکزی و بیرون‌زن', en: 'Concentricity', alt: ['Runout'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'صاف‌بودن سطح', en: 'Flatness', cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'راست‌بودن خط', en: 'Straightness', cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'راندگی سطح', en: 'Surface Finish', alt: ['Surface Roughness'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'میانگین راندگی (Ra)', en: 'Roughness Average', alt: ['Ra'], cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'کالیبراسیون', en: 'Calibration', cat: 'اندازه‌گیری و تلرانس' },
    { fa: 'دقت اندازه', en: 'Precision', alt: ['Accuracy'], cat: 'اندازه‌گیری و تلرانس' },
    // ================= CNC و برنامه‌نویسی =================
    { fa: 'کنترل عددی کامپیوتری', en: 'CNC', alt: ['Computer Numerical Control'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'کد G', en: 'G Code', alt: ['G-Code'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'کد M', en: 'M Code', alt: ['M-Code'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'برنامه‌نویسی CNC', en: 'CNC Programming', cat: 'CNC و برنامه‌نویسی' },
    { fa: 'تولید کمک‌شده با کامپیوتر', en: 'CAM', alt: ['Computer Aided Manufacturing'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'طراحی کمک‌شده با کامپیوتر', en: 'CAD', alt: ['Computer Aided Design'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'موقعیت‌یابی سریع (G00)', en: 'Rapid Positioning', alt: ['Rapid'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'درون‌یابی خطی', en: 'Linear Interpolation', alt: ['G01'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'درون‌یابی دایره‌ای', en: 'Circular Interpolation', alt: ['G02 G03'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'چرخش ساعت‌گرد', en: 'Clockwise', alt: ['CW'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'چرخش پادساعت‌گرد', en: 'Counter Clockwise', alt: ['CCW'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'تأخیر (توقف موقت)', en: 'Dwell', alt: ['G04'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'تغییر ابزار', en: 'Tool Change', alt: ['M06'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'آفست طول ابزار', en: 'Tool Length Offset', alt: ['H Offset'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'جبران شعاع ابزار', en: 'Cutter Compensation', alt: ['Cutter Comp'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'آفست قطعه‌کار (صفر کار)', en: 'Work Offset', alt: ['Work Coordinate'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'صفر ماشین', en: 'Machine Zero', alt: ['Machine Home'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'صفر قطعه', en: 'Work Zero', alt: ['Part Zero'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'سیکل ثابت (دستور آماده)', en: 'Canned Cycle', cat: 'CNC و برنامه‌نویسی' },
    { fa: 'زیربرنامه', en: 'Subprogram', alt: ['Subroutine'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'بلوک برنامه', en: 'Program Block', alt: ['Block'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'شمارهٔ خط برنامه', en: 'Sequence Number', alt: ['N Number'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'ویرایشگر برنامه', en: 'Program Editor', cat: 'CNC و برنامه‌نویسی' },
    { fa: 'شبیه‌سازی مسیر ابزار', en: 'Tool Path Simulation', alt: ['Backplot'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'اجرای خشک (تست برنامه)', en: 'Dry Run', cat: 'CNC و برنامه‌نویسی' },
    { fa: 'اجرای تک‌بلوک', en: 'Single Block', cat: 'CNC و برنامه‌نویسی' },
    { fa: 'توقف اختیاری', en: 'Optional Stop', alt: ['M01'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'پایان برنامه', en: 'Program End', alt: ['M30'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'بازنشانی (ریست)', en: 'Reset', cat: 'CNC و برنامه‌نویسی' },
    { fa: 'حالت خودکار', en: 'Auto Mode', alt: ['Memory Mode'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'ورود دستی داده', en: 'Manual Data Input', alt: ['MDI'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'چرخش اسپیندل راست‌گرد', en: 'Spindle Forward', alt: ['M03'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'توقف اسپیندل', en: 'Spindle Stop', alt: ['M05'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'روشن کردن مایع برش', en: 'Coolant On', alt: ['M08'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'توقف اضطراری', en: 'Emergency Stop', alt: ['E Stop'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'محدودیت نرم', en: 'Soft Limit', cat: 'CNC و برنامه‌نویسی' },
    { fa: 'محدودیت سخت (سوئیچ حد)', en: 'Hard Limit', alt: ['Limit Switch'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'محور طول کار', en: 'Z Axis', alt: ['Z'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'محور افقی اول', en: 'X Axis', alt: ['X'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'محور عرضی عمودی', en: 'Y Axis', alt: ['Y'], cat: 'CNC و برنامه‌نویسی' },
    { fa: 'محور چرخشی', en: 'Rotary Axis', alt: ['A B C Axis'], cat: 'CNC و برنامه‌نویسی' },
    // ================= رزوه و اتصال =================
    { fa: 'رزوه، پیچ', en: 'Thread', alt: ['Screw Thread'], cat: 'رزوه و اتصال' },
    { fa: 'رزوه متریک', en: 'Metric Thread', cat: 'رزوه و اتصال' },
    { fa: 'رزوه اینچی', en: 'Imperial Thread', alt: ['Inch Thread'], cat: 'رزوه و اتصال' },
    { fa: 'رزوه راست', en: 'Right Hand Thread', cat: 'رزوه و اتصال' },
    { fa: 'رزوه چپ', en: 'Left Hand Thread', cat: 'رزوه و اتصال' },
    { fa: 'گام رزوه', en: 'Pitch', alt: ['Thread Pitch'], cat: 'رزوه و اتصال' },
    { fa: 'گام بر اینچ', en: 'Threads Per Inch', alt: ['TPI'], cat: 'رزوه و اتصال' },
    { fa: 'قطر عمده', en: 'Major Diameter', cat: 'رزوه و اتصال' },
    { fa: 'قطر کمینه', en: 'Minor Diameter', cat: 'رزوه و اتصال' },
    { fa: 'قطر میانه', en: 'Pitch Diameter', cat: 'رزوه و اتصال' },
    { fa: 'عمق رزوه', en: 'Thread Depth', cat: 'رزوه و اتصال' },
    { fa: 'زاویهٔ رزوه', en: 'Thread Angle', cat: 'رزوه و اتصال' },
    { fa: 'رزوه استوانه‌ای', en: 'Straight Thread', cat: 'رزوه و اتصال' },
    { fa: 'رزوه مخروطی', en: 'Taper Thread', cat: 'رزوه و اتصال' },
    { fa: 'مهره', en: 'Nut', cat: 'رزوه و اتصال' },
    { fa: 'پیچ و مهره', en: 'Bolt And Nut', cat: 'رزوه و اتصال' },
    { fa: 'واشر', en: 'Washer', cat: 'رزوه و اتصال' },
    { fa: 'پین (میخ)', en: 'Pin', alt: ['Dowel Pin'], cat: 'رزوه و اتصال' },
    { fa: 'بوش (بوشینگ)', en: 'Bushing', cat: 'رزوه و اتصال' },
    { fa: 'چسب صنعتی نگه‌دارنده', en: 'Thread Locker', alt: ['Retaining Compound'], cat: 'رزوه و اتصال' },

    // ================= متریال و عملیات حرارتی =================
    { fa: 'فولاد کربنی', en: 'Carbon Steel', cat: 'متریال و حرارتی' },
    { fa: 'فولاد آلیاژی', en: 'Alloy Steel', cat: 'متریال و حرارتی' },
    { fa: 'فولاد ابزار', en: 'Tool Steel', cat: 'متریال و حرارتی' },
    { fa: 'فولاد زنگ‌نزن (استنلس استیل)', en: 'Stainless Steel', alt: ['SS'], cat: 'متریال و حرارتی' },
    { fa: 'چدن خاکستری', en: 'Cast Iron', alt: ['Gray Cast Iron'], cat: 'متریال و حرارتی' },
    { fa: 'چدن کره‌ای', en: 'Ductile Iron', alt: ['Nodular Cast Iron'], cat: 'متریال و حرارتی' },
    { fa: 'آلیاژ آلومینیوم', en: 'Aluminium Alloy', alt: ['Aluminum'], cat: 'متریال و حرارتی' },
    { fa: 'برنج (مس و روی)', en: 'Brass', cat: 'متریال و حرارتی' },
    { fa: 'برنز', en: 'Bronze', cat: 'متریال و حرارتی' },
    { fa: 'مس خالص', en: 'Copper', cat: 'متریال و حرارتی' },
    { fa: 'تیتانیوم', en: 'Titanium', cat: 'متریال و حرارتی' },
    { fa: 'پلاستیک مهندسی', en: 'Engineering Plastic', cat: 'متریال و حرارتی' },
    { fa: 'کامپوزیت', en: 'Composite', cat: 'متریال و حرارتی' },
    { fa: 'سختی', en: 'Hardness', cat: 'متریال و حرارتی' },
    { fa: 'مقاومت کششی', en: 'Tensile Strength', cat: 'متریال و حرارتی' },
    { fa: 'چقرمگی', en: 'Toughness', cat: 'متریال و حرارتی' },
    { fa: 'آب‌کاری (سختی‌دهی)', en: 'Quenching', alt: ['Hardening'], cat: 'متریال و حرارتی' },
    { fa: 'نرم‌کردن (آنیلینگ)', en: 'Annealing', cat: 'متریال و حرارتی' },
    { fa: 'پس‌کوپن (میانه‌سازی)', en: 'Tempering', cat: 'متریال و حرارتی' },
    { fa: 'نرمال‌سازی', en: 'Normalizing', alt: ['Normalising'], cat: 'متریال و حرارتی' },
    { fa: 'سطحی‌سازی (کیس هاردنینگ)', en: 'Case Hardening', alt: ['Carburizing'], cat: 'متریال و حرارتی' },
    { fa: 'نیتروژن‌دهی', en: 'Nitriding', cat: 'متریال و حرارتی' },
    { fa: 'سردکاری', en: 'Cold Working', cat: 'متریال و حرارتی' },
    { fa: 'عملیات حرارتی', en: 'Heat Treatment', cat: 'متریال و حرارتی' },
    { fa: 'رقاق‌کاری (فورج)', en: 'Forging', cat: 'متریال و حرارتی' },
    { fa: 'ریخته‌گری', en: 'Casting', cat: 'متریال و حرارتی' },
    // ================= نقشه‌خوانی و کنترل کیفیت =================
    { fa: 'نقشهٔ فنی', en: 'Technical Drawing', alt: ['Blueprint'], cat: 'نقشه‌خوانی و کیفیت' },
    { fa: 'نقشه‌خوانی', en: 'Blueprint Reading', alt: ['Drawing Reading'], cat: 'نقشه‌خوانی و کیفیت' },
    { fa: 'نمای مقطع', en: 'Section View', alt: ['Cross Section'], cat: 'نقشه‌خوانی و کیفیت' },
    { fa: 'نما (رویا)', en: 'View', alt: ['Front View', 'Side View'], cat: 'نقشه‌خوانی و کیفیت' },
    { fa: 'بُعد (اندازه‌گیری)', en: 'Dimension', cat: 'نقشه‌خوانی و کیفیت' },
    { fa: 'مقیاس', en: 'Scale', cat: 'نقشه‌خوانی و کیفیت' },
    { fa: 'کنترل کیفیت', en: 'Quality Control', alt: ['QC'], cat: 'نقشه‌خوانی و کیفیت' },
    { fa: 'بازرسی قطعه', en: 'Inspection', cat: 'نقشه‌خوانی و کیفیت' },
    { fa: 'نمونهٔ مرجع', en: 'Master Sample', cat: 'نقشه‌خوانی و کیفیت' },
    { fa: 'قطعهٔ ضایعاتی', en: 'Scrap', alt: ['Reject'], cat: 'نقشه‌خوانی و کیفیت' },
    { fa: 'اصلاح و تعمیر مجدد', en: 'Rework', cat: 'نقشه‌خوانی و کیفیت' },
    { fa: 'پرز (لبهٔ زائد)', en: 'Burr', alt: ['Sharp Edge'], cat: 'نقشه‌خوانی و کیفیت' },
    { fa: 'خط‌کشی روی قطعه', en: 'Marking Out', alt: ['Layout'], cat: 'نقشه‌خوانی و کیفیت' },

    // ================= ایمنی و نگهداری =================
    { fa: 'عینک ایمنی', en: 'Safety Glasses', alt: ['Safety Goggles'], cat: 'ایمنی و نگهداری' },
    { fa: 'دستکش ایمنی', en: 'Safety Gloves', cat: 'ایمنی و نگهداری' },
    { fa: 'گوشی ایمنی', en: 'Ear Protection', alt: ['Ear Muffs'], cat: 'ایمنی و نگهداری' },
    { fa: 'ماسک تنفسی', en: 'Respirator', alt: ['Dust Mask'], cat: 'ایمنی و نگهداری' },
    { fa: 'کفش ایمنی', en: 'Safety Shoes', alt: ['Safety Boots'], cat: 'ایمنی و نگهداری' },
    { fa: 'نگهداری پیشگیرانه', en: 'Preventive Maintenance', alt: ['PM'], cat: 'ایمنی و نگهداری' },
    { fa: 'روغن‌کاری دستگاه', en: 'Lubrication', alt: ['Oiling'], cat: 'ایمنی و نگهداری' },
    { fa: 'گریس (روغن غلیظ)', en: 'Grease', cat: 'ایمنی و نگهداری' },
    { fa: 'قطعهٔ یدکی', en: 'Spare Part', cat: 'ایمنی و نگهداری' },
    { fa: 'آچار بکس', en: 'Wrench', alt: ['Spanner'], cat: 'ایمنی و نگهداری' },
    { fa: 'کلید آلن', en: 'Allen Key', alt: ['Hex Key'], cat: 'ایمنی و نگهداری' },
    { fa: 'پیچ‌گوشتی دستی', en: 'Hand Screw', cat: 'ایمنی و نگهداری' },
    { fa: 'قفل و برچسب ایمنی', en: 'Lockout Tagout', alt: ['LOTO'], cat: 'ایمنی و نگهداری' },
    { fa: 'کپسول آتش‌نشانی', en: 'Fire Extinguisher', cat: 'ایمنی و نگهداری' },
    { fa: 'جمع‌آوری براده', en: 'Chip Cleanup', alt: ['Chip Removal'], cat: 'ایمنی و نگهداری' },
    { fa: 'محافظ دستگاه (گارد)', en: 'Machine Guard', alt: ['Safety Guard'], cat: 'ایمنی و نگهداری' }
  ];
  // ---------- تنظیمات ----------
  var PANEL_KEY = 'machiningTerms';
  var BEST_KEY = 'mechTermsBest';
  var MUTE_KEY = 'mechTermsMuted';
  var LEARN_PROGRESS_KEY = 'mechTermsLearnProgress';
  var ROUND_LENGTH = 10;        // تعداد سؤال در هر دور آزمون

  // ---------- وضعیت ----------
  var screen = null;
  var state = null;             // وضعیت جاری آزمون
  var cardState = null;         // وضعیت کارت‌های آموزش
  var muted = false;
  var audio = null;
  var wired = false;
  var activeCat = 'all';
  var query = '';
  var lastQuizIds = [];

  // ---------- ابزارهای کمکی ----------
  function makeEl(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function storageGet(k, def) {
    try { var v = localStorage.getItem(k); return v == null ? def : v; } catch (e) { return def; }
  }
  function storageSet(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) { } }
  function toEnglishDigits(s) {
    return String(s == null ? '' : s)
      .replace(/[\u06F0-\u06F9]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); })
      .replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); });
  }
  function toPersianDigits(v) {
    return toEnglishDigits(v).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[Number(d)]; });
  }
  // نرمال‌سازی پاسخ انگلیسی: حروف کوچک، بدون فاصله/خط تیره/نقطه
  function normalizeAnswer(value) {
    var s = toEnglishDigits(value).toLowerCase();
    s = s.replace(/[\u064A\u0649]/g, 'y');
    return s.replace(/[^a-z0-9]/g, '');
  }
  function isCorrect(given, item) {
    var g = normalizeAnswer(given);
    if (!g) return false;
    if (g === normalizeAnswer(item.en)) return true;
    var alts = item.alt || [];
    for (var i = 0; i < alts.length; i++) {
      if (g === normalizeAnswer(alts[i])) return true;
    }
    return false;
  }
  function shuffleList(list) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }
  function normalizeSearchText(value) {
    return toEnglishDigits(String(value || ''))
      .toLowerCase()
      .replace(/[\u064A\u0649]/g, 'ی')
      .replace(/[\u0643]/g, 'ک')
      .replace(/[\u200c\u200f\u200e]/g, '')
      .replace(/[^0-9a-z\u0600-\u06FF]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ---------- صدا (بازخورد کوتاه، بدون فایل صوتی) ----------
  function initAudio() {
    if (audio) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audio = new Ctx();
    } catch (e) { audio = null; }
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
      osc.connect(g); g.connect(audio.destination);
      g.gain.linearRampToValueAtTime(vol || 0.06, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    } catch (e) { }
  }
  function sfxOk() { beep(880, 0.10); setTimeout(function () { beep(1320, 0.18); }, 80); }
  function sfxFail() { beep(170, 0.20, 'sawtooth', 0.08); }
  function updateSoundBtn() {
    var b = screen ? screen.querySelector('.mt-sound') : null;
    if (b) b.textContent = muted ? '🔇' : '🔊';
  }
  function toggleSound() {
    muted = !muted;
    storageSet(MUTE_KEY, muted ? '1' : '0');
    if (!muted) { initAudio(); beep(660, 0.08); }
    updateSoundBtn();
  }
  // ---------- تلفظ انگلیسی (Web Speech API) ----------
  function speakEnglish(text) {
    if (!text) return;
    try {
      // Android WebView often has no usable Web Speech voice. Prefer Android's
      // installed system TTS engine when the native bridge is available.
      if (window.AndroidTTS && typeof window.AndroidTTS.speak === 'function') {
        if (window.AndroidTTS.speak(String(text))) return;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(String(text));
        u.lang = 'en-US'; u.rate = 0.82;
        window.speechSynthesis.speak(u);
      }
    } catch (e) { }
    initAudio(); beep(760, 0.07, 'sine', 0.04);
  }

  // ---------- قالب صفحه ----------
  var SCREEN_HTML =
    '<div class="mt-top">' +
      '<button class="mt-close" type="button" data-act="exit" aria-label="بستن">✕</button>' +
      '<div class="mt-head"><strong>📚 اصطلاحات ماشین‌کاری</strong><small>MACHINING TERMS</small></div>' +
      '<button class="mt-sound" type="button" data-act="sound" aria-label="صدا">🔊</button>' +
    '</div>' +
    '<div class="mt-scroll">' +

      // --- صفحهٔ اصلی با دو دکمه ---
      '<div class="mt-view mt-menu-view">' +
        '<div class="mt-hero">' +
          '<div class="mt-hero-icon">🛠️</div>' +
          '<h2>اصطلاحات ماشین‌کاری</h2>' +
          '<p><b>' + TERMS.length + '</b> اصطلاح تخصصی انگلیسی ماشین‌کاری همراه معادل فارسی — ' +
            'برای نقشه‌خوانی، کار با خارجی‌ها و کاتالوگ ابزار.</p>' +
        '</div>' +

        '<div class="mt-menu-btns">' +
          '<button class="mt-menu-btn learn" type="button" data-act="open-learn">' +
            '<span class="mt-menu-icon">🎓</span>' +
            '<b>آموزش اصطلاحات</b>' +
          '</button>' +
          '<button class="mt-menu-btn quiz" type="button" data-act="start-quiz">' +
            '<span class="mt-menu-icon">🎯</span>' +
            '<b>آزمون اصطلاحات</b>' +
          '</button>' +
        '</div>' +
        '<p class="mt-best">رکورد آزمون: <b class="mt-best-val">۰</b> از ' + ROUND_LENGTH + '</p>' +
      '</div>' +

      // --- نمای آموزش کارتی ---
      '<div class="mt-view mt-learn-view" hidden>' +
        '<button class="mt-back-menu" type="button" data-act="back-menu">« بازگشت</button>' +
        '<div class="mt-learn-tools">' +
          '<label class="mt-learn-search"><span>جست‌وجو در اصطلاحات</span>' +
            '<input class="mt-search-input" type="search" placeholder="مثلاً Turning یا تراشکاری" autocomplete="off"></label>' +
          '<label class="mt-learn-category"><span>دسته‌بندی</span>' +
            '<select class="mt-category-select"><option value="all">همهٔ دسته‌ها</option></select></label>' +
        '</div>' +
        '<div class="mt-learn-progress">' +
          '<div class="mt-learn-bar"><span class="mt-learn-fill"></span></div>' +
          '<span class="mt-learn-counter">۰ / ' + toPersianDigits(TERMS.length) + '</span>' +
        '</div>' +
        '<div class="mt-flashcard" id="mtFlashcard"></div>' +
        '<div class="mt-flash-nav">' +
          '<button class="mt-flip" type="button" data-act="flip-card">🔄 نمایش معنی</button>' +
        '</div>' +
        '<p class="mt-flash-hint">اول معنی را حدس بزن، بعد «نمایش معنی» را بزن؛ با «بعدی» ادامه بده.</p>' +
      '</div>' +

      // --- نمای آزمون چهارگزینه‌ای ---
      '<div class="mt-view mt-quiz-view" hidden>' +
        '<button class="mt-back-menu" type="button" data-act="back-menu">« بازگشت</button>' +
        '<div class="mt-quiz-progress">' +
          '<div class="mt-quiz-bar"><span class="mt-quiz-fill"></span></div>' +
          '<span class="mt-quiz-counter">۰ / ' + toPersianDigits(ROUND_LENGTH) + '</span>' +
        '</div>' +
        '<div class="mt-card"></div>' +
        '<div class="mt-feedback" aria-live="polite"></div>' +
        '<div class="mt-result" hidden></div>' +
      '</div>' +
    '</div>';

  // ---------- ساخت صفحه ----------
  function ensureScreen() {
    if (screen) return screen;
    var existing = document.querySelector('.mobile-terms');
    if (existing) {
      screen = existing;
    } else {
      var ws = document.querySelector('.workspace');
      if (!ws) return null;
      screen = makeEl('div', 'tool-panel mobile-terms');
      screen.dataset.panel = PANEL_KEY;
      screen.setAttribute('aria-label', 'اصطلاحات ماشین‌کاری');
      screen.hidden = true;
      screen.innerHTML = SCREEN_HTML;
      ws.insertBefore(screen, ws.firstChild);
    }
    wireScreen();
    populateCategoryFilter();
    updateSoundBtn();
    updateBestLabel();
    return screen;
  }

  // ---------- موتور کارت‌های آموزش (فلش‌کارت) ----------
  function shuffleCards() {
    var needle = normalizeSearch(query);
    var deck = shuffleList(TERMS.map(function (t, i) { return i; }).filter(function (i) {
      var term = TERMS[i];
      if (activeCat !== 'all' && term.cat !== activeCat) return false;
      return !needle || normalizeSearch(term.fa + ' ' + term.en + ' ' + term.cat).indexOf(needle) !== -1;
    }));
    cardState = { deck: deck, index: 0, flipped: false };
  }

  function normalizeSearch(value) {
    return String(value || '').toLowerCase().replace(/[\u064a\u0649]/g, 'ی')
      .replace(/[\u0643]/g, 'ک').replace(/[\u200c\u200f\u200e]/g, '')
      .replace(/\s+/g, ' ').trim();
  }

  function populateCategoryFilter() {
    if (!screen) return;
    var select = screen.querySelector('.mt-category-select');
    if (!select || select.options.length > 1) return;
    var categories = [];
    TERMS.forEach(function (term) { if (categories.indexOf(term.cat) === -1) categories.push(term.cat); });
    categories.sort();
    categories.forEach(function (cat) {
      var option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      select.appendChild(option);
    });
  }

  function startLearn() {
    var saved = null;
    try { saved = JSON.parse(storageGet(LEARN_PROGRESS_KEY, 'null')); } catch (e) { saved = null; }
    var restored = !!(saved && saved.version === TERMS.length && Array.isArray(saved.deck) &&
      saved.deck.length && saved.deck.every(function (index) {
        return Number.isInteger(index) && index >= 0 && index < TERMS.length;
      }) && Number.isInteger(saved.index) && saved.index >= 0 && saved.index < saved.deck.length);
    if (restored) {
      activeCat = saved.category || 'all';
      query = saved.query || '';
      var search = screen.querySelector('.mt-search-input');
      var category = screen.querySelector('.mt-category-select');
      if (search) search.value = query;
      if (category) category.value = activeCat;
      cardState = { deck: saved.deck, index: saved.index, flipped: !!saved.flipped };
    } else {
      shuffleCards();
    }
    showView('learn');
    renderFlashcard();
  }

  function saveLearnProgress() {
    if (!cardState || !cardState.deck || !cardState.deck.length) return;
    storageSet(LEARN_PROGRESS_KEY, JSON.stringify({
      version: TERMS.length,
      deck: cardState.deck,
      index: cardState.index,
      flipped: cardState.flipped,
      category: activeCat,
      query: query
    }));
  }

  function renderFlashcard() {
    if (!cardState) return;
    if (cardState.deck.length && cardState.index >= cardState.deck.length) cardState.index = 0;
    saveLearnProgress();
    var item = cardState.deck.length ? TERMS[cardState.deck[cardState.index]] : null;
    var counter = screen.querySelector('.mt-learn-counter');
    var fill = screen.querySelector('.mt-learn-fill');
    var card = screen.querySelector('.mt-flashcard');
    var flipBtn = screen.querySelector('.mt-flip');
    if (counter) counter.textContent = cardState.deck.length
      ? toPersianDigits(cardState.index + 1) + ' / ' + toPersianDigits(cardState.deck.length) : '۰ / ۰';
    if (fill) fill.style.width = cardState.deck.length
      ? Math.round((cardState.index / cardState.deck.length) * 100) + '%' : '0%';
    if (flipBtn) flipBtn.textContent = cardState.flipped ? '🔄 نمایش انگلیسی' : '🔄 نمایش معنی';
    if (!card) return;
    if (!item) {
      card.className = 'mt-flashcard mt-empty-card';
      card.innerHTML = '<div class="mt-flash-face"><span class="mt-flash-label">نتیجه‌ای پیدا نشد</span>' +
        '<p class="mt-flash-fa">عبارت دیگری جست‌وجو کن یا دسته‌بندی را تغییر بده.</p></div>';
      return;
    }
    card.className = 'mt-flashcard' + (cardState.flipped ? ' flipped' : '');
    if (cardState.flipped) {
      card.innerHTML =
        '<span class="mt-tag">' + escapeHtml(item.cat) + '</span>' +
        '<div class="mt-flash-face fa-face">' +
          '<span class="mt-flash-label">معنی فارسی</span>' +
          '<p class="mt-flash-fa">' + escapeHtml(item.fa) + '</p>' +
        '</div>' +
        '<button class="mt-flash-next" type="button" data-act="next-card">بعدی ←</button>';
    } else {
      card.innerHTML =
        '<span class="mt-tag">' + escapeHtml(item.cat) + '</span>' +
        '<div class="mt-flash-face en-face">' +
          '<span class="mt-flash-label">English Term</span>' +
          '<p class="mt-flash-en">' + escapeHtml(item.en) + '</p>' +
          '<button class="mt-flash-speak" type="button" data-act="speak-card">🔊 تلفظ انگلیسی</button>' +
        '</div>';
    }
  }

  function flipCard() {
    if (!cardState) return;
    cardState.flipped = !cardState.flipped;
    renderFlashcard();
  }

  function nextCard() {
    if (!cardState) return;
    cardState.index = (cardState.index + 1) % cardState.deck.length;
    cardState.flipped = false;
    renderFlashcard();
  }

  // ---------- موتور آزمون چهارگزینه‌ای ----------
  function startQuiz() {
    var pool = TERMS.map(function (t, i) { return i; }).filter(function (i) {
      return lastQuizIds.indexOf(i) === -1;
    });
    if (pool.length < Math.min(ROUND_LENGTH, TERMS.length)) {
      pool = TERMS.map(function (t, i) { return i; });
    }
    var order = shuffleList(pool).slice(0, Math.min(ROUND_LENGTH, TERMS.length));
    lastQuizIds = order.slice();
    state = {
      order: order,
      index: 0,
      correct: 0,
      answers: [],   // { item, given, ok }
      locked: false
    };
    showView('quiz');
    renderQuestion();
  }

  function showView(name) {
    var menu = screen.querySelector('.mt-menu-view');
    var learn = screen.querySelector('.mt-learn-view');
    var quiz = screen.querySelector('.mt-quiz-view');
    if (menu) menu.hidden = name !== 'menu';
    if (learn) learn.hidden = name !== 'learn';
    if (quiz) quiz.hidden = name !== 'quiz';
    var scroll = screen.querySelector('.mt-scroll');
    if (scroll) scroll.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  // --- آزمون چهارگزینه‌ای: نمایش سؤال ---
  function renderQuestion() {
    if (!state) return;
    var card = screen.querySelector('.mt-card');
    var feedback = screen.querySelector('.mt-feedback');
    var result = screen.querySelector('.mt-result');
    if (result) { result.hidden = true; result.innerHTML = ''; }
    if (feedback) { feedback.className = 'mt-feedback'; feedback.innerHTML = ''; }

    if (state.index >= state.order.length) { finishQuiz(); return; }

    var item = TERMS[state.order[state.index]];
    var counter = screen.querySelector('.mt-quiz-counter');
    var fill = screen.querySelector('.mt-quiz-fill');
    if (counter) counter.textContent = toPersianDigits(state.index + 1) + ' / ' + toPersianDigits(state.order.length);
    if (fill) fill.style.width = Math.round((state.index / state.order.length) * 100) + '%';

    // ساخت ۴ گزینه: ۱ درست + ۳ غلط تصادفی از اصطلاحات دیگر (هم‌گروه اولویت دارند)
    var others = [];
    for (var i = 0; i < TERMS.length; i++) {
      if (i === state.order[state.index]) continue;
      others.push(i);
    }
    others.sort(function (a, b) {
      var sa = TERMS[a].cat === item.cat ? 0 : 1;
      var sb = TERMS[b].cat === item.cat ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return Math.random() - 0.5;
    });
    var distractors = others.slice(0, 3);
    var options = shuffleList(distractors.concat([state.order[state.index]]).map(function (idx) {
      return { idx: idx, en: TERMS[idx].en };
    }));
    state.options = options;

    card.innerHTML =
      '<span class="mt-tag">' + escapeHtml(item.cat) + '</span>' +
      '<p class="mt-ask">معادل انگلیسی کدام است؟</p>' +
      '<p class="mt-fa">' + escapeHtml(item.fa) + '</p>' +
      '<div class="mt-opts">' +
        options.map(function (o, oi) {
          return '<button class="mt-opt" type="button" data-oi="' + oi + '">' +
            '<span class="mt-opt-num">' + 'ABCD'.charAt(oi) + '</span>' +
            '<span class="mt-opt-txt">' + escapeHtml(o.en) + '</span>' +
            '</button>';
        }).join('') +
      '</div>';

    state.locked = false;
    var optBtns = card.querySelectorAll('.mt-opt');
    for (var k = 0; k < optBtns.length; k++) {
      (function (btn, oi) {
        btn.addEventListener('click', function () { answerChoice(oi); });
      })(optBtns[k], k);
    }
  }

  function answerChoice(oi) {
    if (!state || state.locked) return;
    var item = TERMS[state.order[state.index]];
    var chosen = state.options[oi];
    var ok = chosen.idx === state.order[state.index];
    state.locked = true;
    if (ok) state.correct++;
    state.answers.push({ item: item, given: chosen.en, ok: ok });

    var card = screen.querySelector('.mt-card');
    var feedback = screen.querySelector('.mt-feedback');
    var optBtns = card.querySelectorAll('.mt-opt');
    for (var k = 0; k < optBtns.length; k++) {
      var btn = optBtns[k];
      btn.disabled = true;
      if (k === oi) btn.classList.add(ok ? 'right' : 'wrong');
      else if (state.options[k].idx === state.order[state.index]) btn.classList.add('right');
    }

    var isLast = state.index >= state.order.length - 1;
    feedback.className = 'mt-feedback ' + (ok ? 'ok' : 'bad');
    feedback.innerHTML =
      '<p class="mt-verdict">' + (ok ? '✅ درست! +۱ امتیاز' : '❌ غلط') + '</p>' +
      (ok ? '' : '<p class="mt-answer">پاسخ درست: <b>' + escapeHtml(item.en) + '</b></p>') +
      '<button class="mt-next" type="button">' + (isLast ? 'دیدن نمره 🎯' : 'سؤال بعدی ←') + '</button>';
    var next = feedback.querySelector('.mt-next');
    if (next) next.addEventListener('click', nextQuestion);

    if (ok) sfxOk(); else sfxFail();

    var fill = screen.querySelector('.mt-quiz-fill');
    if (fill) fill.style.width = Math.round(((state.index + 1) / state.order.length) * 100) + '%';
  }

  function nextQuestion() {
    if (!state || !state.locked) return;
    state.locked = false;
    state.index += 1;
    renderQuestion();
  }

  function scoreMessage(pct) {
    if (pct === 100) return 'عالی بود! تسلط کامل روی اصطلاحات ماشین‌کاری داری. 🏆';
    if (pct >= 80) return 'خیلی خوب! با کمی مرور، حرفه‌ای می‌شوی. 💪';
    if (pct >= 60) return 'بد نیست — بخش آموزش را یک بار دیگر مرور کن. 👍';
    if (pct >= 40) return 'قابل بهبود است؛ روی فرهنگ اصطلاحات بیشتر کار کن. 📖';
    return 'از پایه شروع کن: فرهنگ اصطلاحات را بخوان و دوباره آزمون بده. 📚';
  }

  function finishQuiz() {
    if (!state) return;
    var total = state.order.length;
    var correct = state.correct;
    var pct = Math.round((correct / Math.max(total, 1)) * 100);
    var best = Number(storageGet(BEST_KEY, '0')) || 0;
    var isRecord = correct > best;
    if (isRecord) { storageSet(BEST_KEY, correct); best = correct; updateBestLabel(); }

    var counter = screen.querySelector('.mt-quiz-counter');
    if (counter) counter.textContent = total + ' / ' + total;
    var fill = screen.querySelector('.mt-quiz-fill');
    if (fill) fill.style.width = '100%';
    var card = screen.querySelector('.mt-card');
    if (card) card.innerHTML = '';
    var feedback = screen.querySelector('.mt-feedback');
    if (feedback) { feedback.className = 'mt-feedback'; feedback.innerHTML = ''; }

    var wrong = state.answers.filter(function (a) { return !a.ok; });
    var result = screen.querySelector('.mt-result');
    result.hidden = false;
    result.innerHTML =
      '<div class="mt-score">' +
        '<p class="mt-score-num">' + correct + ' / ' + total + '</p>' +
        '<p class="mt-score-label">درصد: ' + toPersianDigits(pct) + '٪' +
          (isRecord ? ' — رکورد جدید! 🎉' : '') + '</p>' +
        '<p class="mt-score-best">رکورد فعلی: ' + toPersianDigits(best) + ' از ' +
          toPersianDigits(ROUND_LENGTH) + '</p>' +
      '</div>' +
      '<p class="mt-msg">' + escapeHtml(scoreMessage(pct)) + '</p>' +
      (wrong.length
        ? '<h3 class="mt-wrong-title">❌ اصطلاحاتی که غلط زدی (' + wrong.length + ' مورد)</h3>' +
          '<ul class="mt-wrong-list">' + wrong.map(function (a, i) {
            return '<li class="mt-wrong-item">' +
              '<p class="mt-wrong-q">' + (i + 1) + '. ' + escapeHtml(a.item.fa) +
                ' <span class="mt-tag">' + escapeHtml(a.item.cat) + '</span></p>' +
              '<p class="mt-wrong-ans">پاسخ درست: <b>' + escapeHtml(a.item.en) + '</b> — ' +
                'پاسخ تو: <b class="mt-bad">' + escapeHtml(a.given) + '</b></p>' +
              '</li>';
          }).join('') + '</ul>'
        : '<p class="mt-perfect">🎉 همهٔ اصطلاحات را درست نوشتی!</p>') +
      '<div class="mt-actions">' +
        '<button class="mt-again" type="button">🔄 آزمون مجدد</button>' +
        '<button class="mt-tolearn" type="button">📖 بازگشت به آموزش</button>' +
      '</div>';

    result.querySelector('.mt-again').addEventListener('click', function () { startQuiz(); });
    result.querySelector('.mt-tolearn').addEventListener('click', function () { showView('menu'); });
    var scroll = screen.querySelector('.mt-scroll');
    if (scroll) scroll.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  // ---------- رویدادها ----------
  function attrUp(node, key, maxDepth) {
    var n = node, depth = 0, limit = maxDepth || 8;
    while (n && n !== screen && depth < limit) {
      if (n.dataset && n.dataset[key]) return n.dataset[key];
      n = n.parentNode; depth++;
    }
    return '';
  }

  function wireScreen() {
    if (wired) return;
    wired = true;

    screen.addEventListener('click', function (ev) {
      var act = attrUp(ev.target, 'act', 8);
      if (act === 'exit') { requestHome(); return; }
      if (act === 'sound') { toggleSound(); return; }
      if (act === 'open-learn') { initAudio(); startLearn(); return; }
      if (act === 'start-quiz') { initAudio(); startQuiz(); return; }
      if (act === 'back-menu') { showView('menu'); return; }
      if (act === 'flip-card') { flipCard(); return; }
      if (act === 'next-card') { nextCard(); return; }
      if (act === 'speak-card') {
        var idx = cardState ? cardState.deck[cardState.index] : -1;
        if (idx >= 0) speakEnglish(TERMS[idx].en);
        return;
      }
    });
    screen.addEventListener('input', function (ev) {
      if (!ev.target || !ev.target.classList.contains('mt-search-input')) return;
      query = ev.target.value;
      var learnView = screen.querySelector('.mt-learn-view');
      if (learnView && !learnView.hidden) { shuffleCards(); renderFlashcard(); }
    });
    screen.addEventListener('change', function (ev) {
      if (!ev.target || !ev.target.classList.contains('mt-category-select')) return;
      activeCat = ev.target.value || 'all';
      var learnView = screen.querySelector('.mt-learn-view');
      if (learnView && !learnView.hidden) { shuffleCards(); renderFlashcard(); }
    });

    // باز/بسته شدن پنل از مسیرهای دیگر (تب، دکمهٔ Back) اینجا مدیریت می‌شود
    if (typeof MutationObserver === 'function') {
      var observer = new MutationObserver(function () { syncActivation(); });
      observer.observe(screen, { attributes: true, attributeFilter: ['class', 'hidden'] });
    }
  }

  function isActive() {
    return !!screen && !screen.hidden && screen.classList.contains('active');
  }

  function syncActivation() {
    if (!screen) return;
    if (isActive()) {
      muted = storageGet(MUTE_KEY, '0') === '1';
      updateSoundBtn();
      updateBestLabel();
    }
  }

  // ---------- کارت صفحهٔ اصلی ----------
  function buildHomeCard() {
    var grid = document.querySelector('.mobile-home .mobile-grid');
    if (!grid) return false;
    var card = grid.querySelector('[data-tool="' + PANEL_KEY + '"]');
    if (!card) {
      var quizCard = grid.querySelector('[data-action="programmingQuiz"]');
      card = makeEl('button', 'm-card c-terms');
      card.type = 'button';
      card.dataset.action = PANEL_KEY;
      card.dataset.tool = PANEL_KEY;
      card.setAttribute('aria-label', 'اصطلاحات ماشین‌کاری');
      card.innerHTML =
        '<span class="m-icon">📚</span>' +
        '<span class="m-en">Machining Terms</span>' +
        '<span class="m-fa">اصطلاحات ماشین‌کاری</span>';
      if (quizCard) grid.insertBefore(card, quizCard);
      else grid.appendChild(card);
    }
    // mobile.js may create the home card first and bind its general router.
    // Bind here too, and stop that router so opening terms is deterministic.
    if (!card._machiningTermsBound) {
      card._machiningTermsBound = true;
      card.addEventListener('click', function (ev) {
        ev.stopImmediatePropagation();
        openTerms();
      });
    }
    return true;
  }

  // ---------- باز و بسته کردن ----------
  function openTerms() {
    ensureScreen();
    if (!screen) return;
    var panels = document.querySelectorAll('.tool-panel');
    for (var i = 0; i < panels.length; i++) {
      if (panels[i] === screen) continue;
      panels[i].hidden = true;
      panels[i].classList.remove('active');
    }
    var home = document.querySelector('.mobile-home');
    if (home) home.style.display = 'none';
    var extras = document.querySelectorAll('.home-spacer-card, .seo-intro');
    for (var j = 0; j < extras.length; j++) extras[j].hidden = true;
    var welcome = document.querySelector('#welcomeCard');
    if (welcome) welcome.style.display = 'none';
    var notes = document.querySelectorAll('.notes-card');
    for (var n = 0; n < notes.length; n++) { notes[n].style.display = 'none'; notes[n].classList.remove('active'); }
    var contact = document.querySelector('.mobile-contact');
    if (contact) contact.classList.remove('active');
    var tabs = document.querySelectorAll('.mobile-tabbar .tab');
    for (var t = 0; t < tabs.length; t++) tabs[t].classList.remove('active');

    screen.hidden = false;
    screen.classList.add('active');
    screen.classList.remove('mobile-page-enter');
    void screen.offsetWidth;
    screen.classList.add('mobile-page-enter');
    setTimeout(function () { if (screen) screen.classList.remove('mobile-page-enter'); }, 450);
    window.scrollTo(0, 0);
    syncActivation();
  }

  function requestHome() {
    var tab = document.querySelector('.mobile-tabbar .tab[data-action="home"]');
    if (tab && typeof tab.click === 'function') { tab.click(); return; }
    if (screen) { screen.classList.remove('active'); screen.hidden = true; }
    syncActivation();
  }

  function closeTerms() {
    if (!screen || !screen.classList.contains('active')) return;
    screen.classList.remove('active');
    screen.hidden = true;
  }

  // ---------- راه‌اندازی ----------
  function init() {
    if (!detectMobile()) return;
    ensureScreen();
    if (!buildHomeCard()) {
      var tries = 0;
      var waiter = setInterval(function () {
        tries += 1;
        if (buildHomeCard() || tries >= 40) clearInterval(waiter);
      }, 250);
    }
    syncActivation();
  }

  // رابط عمومی: موبایل (Back / خانه) و کنسول دیباگ از همین استفاده می‌کنند
  window.MachinistTerms = {
    open: function () { openTerms(); },
    home: function () { requestHome(); },
    close: function () { closeTerms(); },
    quiz: function () { ensureScreen(); if (screen) startQuiz(); },
    learn: function () { ensureScreen(); if (screen) startLearn(); },
    count: function () { return TERMS.length; },
    state: function () {
      var quizView = screen ? screen.querySelector('.mt-quiz-view') : null;
      return {
        active: isActive(),
        total: TERMS.length,
        inQuiz: !!(state && quizView && !quizView.hidden),
        index: state ? state.index : -1,
        correct: state ? state.correct : 0,
        round: state ? state.order.length : 0
      };
    }
  };

  // Publish the API before initialization: init() can run synchronously in
  // deferred script execution, and must not prevent the home button from opening.
  function safeInit() {
    try { init(); }
    catch (e) { if (window.console && console.error) console.error('MachinistTerms init failed:', e); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safeInit);
  else safeInit();
  window.addEventListener('load', function () { setTimeout(function () {
    if (!window.MachinistTerms) safeInit();
  }, 300); });
})();
