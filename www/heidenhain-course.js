// Beginner-friendly HEIDENHAIN Klartext course for TNC 620/640.
(function () {
  'use strict';
  var panel = document.querySelector('[data-panel="heidenhainProgramming"]');
  if (!panel) return;
  panel.innerHTML = `
    <div class="panel-header"><div><p class="eyebrow">دورهٔ گام‌به‌گام · HEIDENHAIN Klartext</p>
      <h2 id="heidenhainProgrammingTitle">برنامه‌نویسی فرز HEIDENHAIN؛ از صفر تا ساخت برنامه</h2>
      <p>درس‌ها را به ترتیب باز کن، مثال را خط‌به‌خط بخوان و تمرین هر درس را در شبیه‌ساز حل کن.</p></div></div>
    <div class="lesson-card hh-scope"><h4>محدودهٔ دوره و ایمنی</h4>
      <p>مثال‌ها بر اساس زبان گفتگویی <b>Klartext</b> و ساختار کنترل‌های فرز <b>TNC 620 / TNC 640</b> هستند. شمارهٔ نرم‌افزار، گزینه‌ها، پارامتر سیکل‌ها و M‑کدهای سازنده ممکن است فرق کند؛ دفترچهٔ همان دستگاه مرجع نهایی است.</p>
      <p><b>هیچ کدی را مستقیم روی دستگاه اجرا نکن.</b> اول کنترلر و واحدها را بررسی کن، ابزار و آفست و گیره‌بندی را تأیید کن، برنامه را در شبیه‌ساز/TEST RUN ببین و اجرای نخست را با Single Block و Feed Override پایین انجام بده. این درس جای آموزش اپراتوری دستگاه نیست.</p>
    </div>
    <div class="hh-lessons">
      <details class="lesson-card hh-lesson" open><summary><span class="lesson-number">01</span><span><b>محورها، مختصات و صفر قطعه</b><small>پایهٔ تمام برنامه‌ها</small></span></summary><div class="hh-lesson-body">
        <p>در فرز سه‌محوره، X و Y روی سطح میز و Z در راستای اسپیندل است. جهت مثبت و منفی را از علامت‌های روی همان ماشین بخوان؛ جهت حرکت فیزیکی میز ممکن است با تصور حرکت ابزار فرق کند.</p>
        <p>«صفر ماشین» مرجع دستگاه است؛ «صفر قطعه/Datum» مبدأ نقشه است که اپراتور با ابزار اندازه‌گیری یا پراب تعیین می‌کند. مختصات نقشه باید با Datum فعال تطبیق داشته باشد.</p>
        <p>در چیدمان رایج، Z مثبت ابزار را از قطعه دور می‌کند، اما پیش از برنامه‌نویسی جهت را روی کنترل خودت بررسی کن.</p>
        <p><b>تمرین:</b> یک گوشه را مبدأ نقشه بگیر، مختصات سه گوشهٔ دیگر را با علامت مثبت/منفی بنویس و با جهت‌نمای کنترل مقایسه کن.</p>
      </div></details>
      <details class="lesson-card hh-lesson"><summary><span class="lesson-number">02</span><span><b>ساختار برنامه و BLK FORM</b><small>BEGIN PGM، خام قطعه و پایان</small></span></summary><div class="hh-lesson-body">
        <p>BEGIN PGM نام و واحد را مشخص می‌کند. BLK FORM محدودهٔ خام را برای نمایش/شبیه‌سازی تعریف می‌کند؛ قطعه را اندازه‌گیری یا گیره‌بندی نمی‌کند. MM یعنی میلی‌متر و INCH یعنی اینچ.</p>
        <pre class="hh-code"><code>BEGIN PGM FIRST MM
; نمونهٔ آموزشی
BLK FORM 0.1 Z X+0 Y+0 Z-20
BLK FORM 0.2 X+100 Y+80 Z+0
; دستورهای ابزار و حرکت
END PGM FIRST MM</code></pre>
        <p>در این نمونه، جعبهٔ خام از X0 تا X100، از Y0 تا Y80 و از Z−20 تا Z0 است. نام و واحد ابتدا و انتهای برنامه باید یکی باشند.</p>
        <p><b>تمرین:</b> خامی با X از −40 تا +40، Y از −25 تا +25 و Z از −15 تا 0 را به دو خط BLK FORM تبدیل کن.</p>
      </div></details>
      <details class="lesson-card hh-lesson"><summary><span class="lesson-number">03</span><span><b>ابزار، پیشروی و حرکت خطی L</b><small>TOOL CALL، FMAX، F</small></span></summary><div class="hh-lesson-body">
        <p>TOOL CALL ابزار و محور ابزار را فراخوانی می‌کند و S دور درخواستی اسپیندل است؛ طول و شعاع واقعی از جدول ابزار می‌آید. FMAX حرکت سریع است؛ F پیشروی برنامه‌ریزی‌شده است. M‑کدها به سازنده و پیکربندی ماشین وابسته‌اند.</p>
        <pre class="hh-code"><code>TOOL CALL 1 Z S4000
L Z+250 R0 FMAX
L X+30 Y+30 R0 FMAX
L Z+5 R0 FMAX M3
L Z-5 R0 F100
L Z+250 R0 FMAX M5</code></pre>
        <p>L حرکت خطی است. R0 یعنی جبران شعاع در این خط خاموش است. این مثال برای شناخت دستورهاست، نه برنامهٔ آمادهٔ تولید: ابزار، ارتفاع امن، عمق، سرعت، گیره و M‑کد را برای ماشین خودت بررسی کن.</p>
        <p><b>تمرین:</b> برای هر خط بگو کدام محور حرکت می‌کند و حرکت سریع است یا با پیشروی.</p>
      </div></details>
      <details class="lesson-card hh-lesson"><summary><span class="lesson-number">04</span><span><b>مختصات مطلق و افزایشی</b><small>X/Y/Z در برابر IX/IY/IZ</small></span></summary><div class="hh-lesson-body">
        <p>مختصات X/Y/Z نقطه را نسبت به Datum فعال می‌دهند (مطلق). حرف I یعنی جابه‌جایی از نقطهٔ فعلی (افزایشی/نسبی).</p>
        <pre class="hh-code"><code>L X+20 Y+10 R0 FMAX
L IX+15 R0 FMAX
L IY-5 R0 FMAX</code></pre>
        <p>پس از خط اول، X20 و Y10 است؛ خط دوم X را 15 زیاد می‌کند؛ خط سوم Y را 5 کم می‌کند. علامت منفی را با دقت بررسی کن چون می‌تواند مسیر را به سمت گیره ببرد.</p>
        <p><b>تمرین:</b> از X10 Y20 به X30 Y20 برو؛ یک بار مطلق و یک بار افزایشی بنویس.</p>
      </div></details>
      <details class="lesson-card hh-lesson"><summary><span class="lesson-number">05</span><span><b>قوس دایره‌ای: CC و C</b><small>مرکز، نقطهٔ پایان و جهت DR</small></span></summary><div class="hh-lesson-body">
        <p>نقطهٔ شروع قوس، انتهای حرکت قبلی است. CC مرکز دایره را تعریف می‌کند؛ سپس C نقطهٔ پایان و DR+ یا DR− جهت گردش را می‌دهد. نقاط باید با شعاع و صفحهٔ فعال سازگار باشند.</p>
        <pre class="hh-code"><code>; ساختار نمونه در صفحهٔ XY
CC X+25 Y+25
L X+45 Y+25 R0 FMAX
C X+45 Y+25 DR+</code></pre>
        <p>قطعهٔ کد فقط ساختار نوشتن را نشان می‌دهد؛ مرکز، شروع، پایان، شعاع و جهت واقعی را از نقشه بردار. کنترل TNC 640 قوس را در صفحهٔ کاری فعال اجرا می‌کند.</p>
        <p><b>تمرین:</b> روی یک دایره نقطهٔ شروع، مرکز و پایان را مشخص کن و جهت رسیدن از شروع به پایان را تعیین کن.</p>
      </div></details>
      <details class="lesson-card hh-lesson"><summary><span class="lesson-number">06</span><span><b>جبران شعاع و ورود به کانتور</b><small>RL، RR، R0، APPR و DEP</small></span></summary><div class="hh-lesson-body">
        <p>تیغه شعاع دارد؛ اگر مرکز ابزار را بدون جبران روی اندازهٔ نقشه ببری، قطعه به اندازهٔ شعاع خطا می‌کند. RL جبران در سمت چپ مسیر و RR در سمت راست مسیر است؛ چپ/راست را در جهت حرکت ابزار روی کانتور ببین. R0 جبران را خاموش می‌کند.</p>
        <p>برای روشن/خاموش کردن جبران، مسیر ورود و خروج باید معتبر و فضا کافی باشد. APPR و DEP حرکت نزدیک‌شدن و دورشدن از کانتور را تعریف می‌کنند. دستور و قالب دقیق را با نسخهٔ کنترل و شکل قطعه تطبیق بده.</p>
        <p><b>تمرین:</b> دور یک مستطیل جهت حرکت را فلش بزن و سمت چپ مسیر را مشخص کن؛ توضیح بده چرا با عوض‌شدن جهت، RL/RR هم ممکن است عوض شود.</p>
      </div></details>
      <details class="lesson-card hh-lesson"><summary><span class="lesson-number">07</span><span><b>سیکل سوراخ‌کاری 200</b><small>پارامترهای Q و فراخوانی سیکل</small></span></summary><div class="hh-lesson-body">
        <p>پیش از سیکل، ابزار درست را با TOOL CALL و اطلاعات جدول ابزار انتخاب کن. سیکل ابتدا پارامترهای عملیات را تعریف می‌کند و سپس در نقطهٔ موردنظر فراخوانی می‌شود. مثال زیر از راهنمای رسمی TNC 640، نسخهٔ 34059x-17 است. مقادیر را از نقشه و ابزار واقعی بگیر.</p>
        <pre class="hh-code"><code>CYCL DEF 200 DRILLING
Q200=+2   ; SET-UP CLEARANCE
Q201=-20  ; DEPTH
Q206=+150 ; FEED RATE FOR PLNGNG
Q202=+5   ; PLUNGING DEPTH
Q210=+0   ; DWELL TIME AT TOP
Q203=+0   ; SURFACE COORDINATE
Q204=+50  ; 2ND SET-UP CLEARANCE
Q211=+0   ; DWELL TIME AT DEPTH
Q395=+0   ; DEPTH REFERENCE
L X+30 Y+20 R0 FMAX M3
CYCL CALL</code></pre>
        <p>Q200 فاصلهٔ امن، Q201 عمق، Q206 پیشروی، Q202 عمق پله، Q203 سطح قطعه و Q204 فاصلهٔ امن دوم است. پارامترهای سیکل و نام آن را در TNC خودت بخوان؛ نسخه‌ها و گزینه‌ها ممکن است فرق کنند.</p>
        <p><b>تمرین:</b> در شبیه‌ساز، نقطهٔ سوراخ و فاصلهٔ امن را نسبت به خام و گیره بررسی کن؛ هنوز روی ماشین واقعی اجرا نکن.</p>
      </div></details>
      <details class="lesson-card hh-lesson"><summary><span class="lesson-number">08</span><span><b>الگوهای تکراری: LBL و CALL LBL</b><small>زیر‌برنامه و گروه سوراخ</small></span></summary><div class="hh-lesson-body">
        <p>وقتی یک مسیر چندبار تکرار می‌شود، زیر‌برنامه جلوی کپی‌کردن خطوط را می‌گیرد. برچسب LBL 1 شروع و LBL 0 پایان زیر‌برنامه است؛ CALL LBL 1 آن را اجرا می‌کند.</p>
        <pre class="hh-code"><code>; تعریف سیکل و TOOL CALL باید پیش از این بخش باشند
L X+15 Y+10 R0 FMAX M3
CALL LBL 1
L X+45 Y+60 R0 FMAX
CALL LBL 1
L Z+250 R0 FMAX M2
LBL 1
CYCL CALL
L IX+20 R0 FMAX M99
L IY+20 R0 FMAX M99
L IX-20 R0 FMAX M99
LBL 0</code></pre>
        <p>در نمونهٔ رسمی گروه سوراخ‌ها، M99 همراه حرکت سیکل فعال را در نقطه اجرا می‌کند؛ از این معنا فقط با تطبیق دفترچهٔ کنترل خودت استفاده کن. بعد از اجرای زیر‌برنامه، کنترل به محل فراخوانی برمی‌گردد.</p>
        <p><b>تمرین:</b> چهار نقطه را با فاصلهٔ 20 mm رسم کن و بررسی کن جابه‌جایی‌های افزایشی به نقاط موردنظر می‌رسند.</p>
      </div></details>
      <details class="lesson-card hh-lesson"><summary><span class="lesson-number">09</span><span><b>تغییر Datum و تکرار الگو</b><small>تبدیل مختصات</small></span></summary><div class="hh-lesson-body">
        <p>برای ساخت یک شکل در چند جای قطعه، کنترل‌های TNC دستورهای جابه‌جایی Datum، چرخش، آینه‌کردن و مقیاس را دارند. نام و شمارهٔ سیکل یا دستور را از راهنمای دقیق کنترلر پیدا کن؛ بین نسل‌ها یکسان فرض نمی‌شوند.</p>
        <p>تبدیل فعال روی مختصات بعدی اثر می‌گذارد. ترتیب فعال‌کردن و لغوشدن را در شبیه‌سازی کنترل کن؛ تبدیل Datum جای تنظیم صفر فیزیکی قطعه را نمی‌گیرد.</p>
        <p><b>تمرین:</b> نقطهٔ X10 Y10 را روی کاغذ 30 mm در X جابه‌جا کن و مختصات تازه را با Datum جدید محاسبه کن.</p>
      </div></details>
      <details class="lesson-card hh-lesson"><summary><span class="lesson-number">10</span><span><b>روال کامل: از نقشه تا اجرای کنترل‌شده</b><small>چک‌لیست پایانی</small></span></summary><div class="hh-lesson-body">
        <ol><li>مدل کنترلر/نسخهٔ نرم‌افزار، واحد، صفحهٔ کاری و Datum را مشخص کن.</li><li>خام، گیره‌بندی، ابزار، طول/شعاع، دور مجاز و خنک‌کار را بررسی کن.</li><li>مسیر را از روی نقشه بنویس و حرکت سریع را از مسیر برش جدا کن.</li><li>ورود/خروج و جبران شعاع را فقط وقتی هندسه اجازه می‌دهد فعال کن.</li><li>شبیه‌سازی را از نظر مسیر، عمق، ابزار و برخورد با فیکسچر بررسی کن.</li><li>در دستگاه برنامه و جدول ابزار درست را انتخاب کن و طبق روال کارگاه Single Block و Feed Override پایین را به‌کار ببر.</li><li>در اولین برش از فاصلهٔ امن نظارت کن و آمادهٔ توقف اضطراری باش.</li></ol>
        <p><b>پروژهٔ پایانی:</b> برای قطعه‌ای فرضی با دو سوراخ و یک پله، Datum، ابزارها، محدودهٔ خام و ترتیب حرکت‌ها را روی کاغذ طراحی کن؛ بعد فقط در شبیه‌ساز آن را بررسی و خط‌به‌خط توضیح بده.</p>
      </div></details>
    </div>
    <div class="lesson-card hh-sources"><h4>مراجع رسمی HEIDENHAIN</h4>
      <p>این دوره مقدمهٔ آموزشی است. برای اجرای واقعی، شمارهٔ نرم‌افزار دستگاه را پیدا و دستورها را با راهنمای همان نسخه تطبیق بده.</p>
      <ul>
        <li><a href="https://content.heidenhain.de/doku/tnc_guide/pdf_files/TNC620/81760x-18/klartext/1096883-2B.pdf" target="_blank" rel="noopener">راهنمای رسمی Klartext Programming برای TNC 620، نرم‌افزار 81760x-18 (PDF انگلیسی)</a></li>
        <li><a href="https://content.heidenhain.de/doku/tnc_guide/pdf_files/TNC640/34059x-17/bhb/892903-2B.pdf" target="_blank" rel="noopener">راهنمای رسمی Klartext Programming برای TNC 640، نرم‌افزار 34059x-17 (PDF انگلیسی)</a></li>
        <li><a href="https://content.heidenhain.de/doku/tnc_guide/pdf_files/TNC640/34059x-17/zyklen_bearbeitung/1303406-22.pdf" target="_blank" rel="noopener">راهنمای رسمی Programming of Machining Cycles برای همان نسخه</a></li>
        <li><a href="https://content.heidenhain.de/doku/tnc_guide/html/en/index/1242135142456/1242135142489/1697195092713/1697195092713.html" target="_blank" rel="noopener">فهرست مستندات TNC 640 در TNCguide</a></li>
      </ul>
    </div>`;
})();
