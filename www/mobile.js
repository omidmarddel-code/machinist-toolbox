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

  document.body.classList.add('capacitor-mobile');
  document.documentElement.setAttribute('data-theme', 'light');
  try { localStorage.setItem('theme', 'light'); } catch (e) {}

  var navHistory = [];
  var notesCard = document.querySelector('.notes-card');
  var contactCard = null; // پنل «تماس با ما» به‌صورت درون‌برنامه‌ای (بدون ترک صفحه/لود مجدد)
  var capacitorApp = null;
  var lastBackAt = 0;

  // Six home destinations — same actions as the mockup cards
  var HOME_TOOLS = {
    calculations: 'calculations',
    materials: 'materials',
    booklets: 'booklets',
    standards: 'standards'
  };

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
      } else if (!key || key === 'home') {
        showHome();
      } else {
        closeNotes();
        hideHomePanels();
        forceShowPanel(key);
        setActiveTab(key === 'materials' ? 'materials' : (key === 'calculations' ? 'calculations' : 'none'));
      }
      window.scrollTo(0, 0);
    } finally {
      suppressPush = false;
      lastShown = (notesCard && notesCard.classList.contains('active')) ? '__notes__' : visiblePanelKey();
    }
  }
  function openPanel(tool) {
    closeContact();
    closeNotes();
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
    if (action === 'education') { showEducationMenu(); return; }
    if (action === 'notes') { showNotes(); return; }
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

