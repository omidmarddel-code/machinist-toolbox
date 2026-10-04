/* Machinist Toolbox — تست هوش (نسخه وب)
   بانک سؤال‌ها در iq-data.js (window.MT_IQ) قرار دارد و از اپ اندروید پورت شده است.
   این فایل یک موتور خودکفای وب می‌سازد که داخل پنل‌های data-panel="mechIq" و
   data-panel="generalIq" تست را رندر و مدیریت می‌کند. */
(function () {
  'use strict';

  var DATA = window.MT_IQ;
  if (!DATA) return;

  var LBL = ['الف', 'ب', 'ج', 'د'];

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
      var t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function iqLevel(iq) {
    if (iq >= 130) return 'استثنایی — ذهن تحلیلی در سطح نخبگان مهندسی';
    if (iq >= 115) return 'بالاتر از میانگین — مناسب طراحی و حل مسئله پیچیده';
    if (iq >= 100) return 'میانگین — پایه محکم، با تمرین قوی‌تر می‌شوی';
    if (iq >= 85) return 'کمی پایین‌تر از میانگین — مرور مفاهیم پایه توصیه می‌شود';
    return 'نیاز به تمرین پایه — از سؤال‌های آسان شروع کن';
  }

  function sumWeight(bank) {
    var s = 0;
    for (var i = 0; i < bank.length; i++) s += bank[i].weight;
    return s;
  }

  function goBackToIqMenu() {
    if (typeof window.switchTool === 'function') window.switchTool('iqMenu');
  }

  function createTest(root, opts) {
    var bank = opts.bank;
    var domainNames = opts.domainNames;
    var keys = opts.keys;
    var seconds = opts.seconds;
    var storageKey = opts.storageKey;
    var state = null;

    root.classList.add('iq-test');
    root.innerHTML =
      '<div class="iq-top">' +
        '<button class="iq-back" type="button">← منوی تست</button>' +
        '<div class="iq-progress"><span class="iq-progress-fill"></span></div>' +
        '<span class="iq-counter">1 / ' + bank.length + '</span>' +
      '</div>' +
      '<div class="iq-timer" aria-live="polite"></div>' +
      '<div class="iq-question"></div>' +
      '<div class="iq-feedback" aria-live="polite"></div>' +
      '<div class="iq-result" hidden></div>';

    var dom = {
      back: root.querySelector('.iq-back'),
      counter: root.querySelector('.iq-counter'),
      fill: root.querySelector('.iq-progress-fill'),
      timer: root.querySelector('.iq-timer'),
      question: root.querySelector('.iq-question'),
      feedback: root.querySelector('.iq-feedback'),
      result: root.querySelector('.iq-result')
    };

    if (dom.back) dom.back.addEventListener('click', goBackToIqMenu);

    function start() {
      stop();
      state = {
        order: shuffleList(bank.map(function (item, i) { return i; })),
        index: 0,
        answers: [],
        endsAt: Date.now() + seconds * 1000,
        tick: null,
        locked: false,
        next: null
      };
      state.tick = setInterval(tick, 1000);
      renderQuestion();
      tick();
    }

    function stop() {
      if (state) {
        if (state.tick) clearInterval(state.tick);
        if (state.next) clearTimeout(state.next);
      }
      state = null;
    }

    function tick() {
      if (!state) return;
      var left = state.endsAt - Date.now();
      if (left <= 0) { finish(true); return; }
      var m = Math.floor(left / 60000);
      var s = Math.floor((left % 60000) / 1000);
      dom.timer.textContent = 'زمان باقی‌مانده: ' + m + ':' + (s < 10 ? '0' + s : s);
      dom.timer.classList.toggle('late', left < 3 * 60000);
    }

    function renderQuestion() {
      if (!state) return;
      if (state.index >= state.order.length) { finish(false); return; }
      state.locked = false;
      if (state.next) { clearTimeout(state.next); state.next = null; }
      var item = bank[state.order[state.index]];
      dom.result.hidden = true;
      dom.result.innerHTML = '';
      dom.feedback.className = 'iq-feedback';
      dom.feedback.innerHTML = '';
      var order = shuffleList(item.options.map(function (t, i) { return i; }));
      var html = '<span class="iq-tag">' + escapeHtml(item.tag) + ' • وزن ' + item.weight + '</span>' +
        '<p class="iq-q-title">سؤال ' + (state.index + 1) + ' از ' + state.order.length + '</p>' +
        '<p class="iq-q-desc">' + escapeHtml(item.q) + '</p><div class="iq-opts">';
      for (var k = 0; k < order.length; k++) {
        html += '<button class="iq-opt" type="button" data-pick="' + order[k] + '">' +
          '<span class="iq-opt-key">' + LBL[k] + '</span>' +
          '<span class="iq-opt-txt">' + escapeHtml(item.options[order[k]]) + '</span></button>';
      }
      html += '</div>';
      dom.question.innerHTML = html;
      dom.counter.textContent = (state.index + 1) + ' / ' + state.order.length;
      dom.fill.style.width = Math.round((state.index / state.order.length) * 100) + '%';
      var btns = dom.question.querySelectorAll('.iq-opt');
      for (var b = 0; b < btns.length; b++) {
        (function (btn) {
          btn.addEventListener('click', function () {
            answer(parseInt(btn.getAttribute('data-pick'), 10));
          });
        })(btns[b]);
      }
    }

    function answer(picked) {
      if (!state || state.locked) return;
      if (state.index >= state.order.length) return;
      var item = bank[state.order[state.index]];
      var ok = picked === item.correct;
      state.locked = true;
      state.answers.push({ item: item, picked: picked, ok: ok });
      var opts = dom.question.querySelectorAll('.iq-opt');
      for (var i = 0; i < opts.length; i++) opts[i].disabled = true;
      var isLast = state.index >= state.order.length - 1;
      dom.feedback.className = 'iq-feedback show ' + (ok ? 'ok' : 'bad');
      dom.feedback.innerHTML =
        '<p class="iq-verdict">' + (ok ? 'درست! +' + item.weight + ' امتیاز' : 'غلط — پاسخ درست: ' + escapeHtml(item.options[item.correct])) + '</p>' +
        '<p class="iq-hint">' + escapeHtml(item.why) + '</p>' +
        '<button class="iq-next" type="button">' + (isLast ? 'دیدن نتیجه 🎯' : 'سؤال بعدی ←') + '</button>';
      dom.feedback.querySelector('.iq-next').addEventListener('click', nextQuestion);
      dom.fill.style.width = Math.round(((state.index + 1) / state.order.length) * 100) + '%';
      if (state.next) clearTimeout(state.next);
      state.next = setTimeout(nextQuestion, ok ? 1500 : 3400);
    }

    function nextQuestion() {
      if (!state) return;
      if (state.next) { clearTimeout(state.next); state.next = null; }
      if (!state.locked) return;
      state.locked = false;
      state.index += 1;
      renderQuestion();
      window.scrollTo(0, 0);
    }

    function finish(timeUp) {
      if (!state) return;
      var st = state;
      if (st.tick) { clearInterval(st.tick); st.tick = null; }
      if (st.next) { clearTimeout(st.next); st.next = null; }
      var max = sumWeight(bank);
      var got = 0;
      var domGot = {}, domMax = {};
      for (var i = 0; i < keys.length; i++) { domGot[keys[i]] = 0; domMax[keys[i]] = 0; }
      for (var j = 0; j < bank.length; j++) domMax[bank[j].domain] += bank[j].weight;
      for (var a = 0; a < st.answers.length; a++) {
        if (st.answers[a].ok) {
          got += st.answers[a].item.weight;
          domGot[st.answers[a].item.domain] += st.answers[a].item.weight;
        }
      }
      var ratio = max ? got / max : 0;
      var iq = Math.round(70 + ratio * 75);
      try { localStorage.setItem(storageKey, JSON.stringify({ iq: iq, got: got, max: max, at: Date.now() })); } catch (e) {}
      var msg = timeUp ? 'وقت تمام شد! نتیجه بر اساس پاسخ‌های ثبت‌شده محاسبه شد.' : 'آزمون تمام شد!';
      dom.question.innerHTML = '';
      dom.feedback.className = 'iq-feedback';
      dom.feedback.innerHTML = '';
      dom.result.hidden = false;
      var bars = '';
      for (var d = 0; d < keys.length; d++) {
        var k = keys[d];
        var p = domMax[k] ? Math.round((domGot[k] / domMax[k]) * 100) : 0;
        bars += '<div class="iq-dom"><div class="iq-dom-head"><span>' + escapeHtml(domainNames[k]) +
          '</span><span>' + domGot[k] + ' / ' + domMax[k] + '</span></div>' +
          '<div class="iq-dom-bar"><span style="width:' + p + '%"></span></div></div>';
      }
      var wrongCount = 0;
      for (var w = 0; w < st.answers.length; w++) if (!st.answers[w].ok) wrongCount++;
      var wrongHtml;
      if (wrongCount) {
        wrongHtml = '<h3 class="iq-wrong-title">سؤال‌هایی که غلط زدی (' + wrongCount + '):</h3><ul class="iq-wrong-list">';
        for (var v = 0; v < st.answers.length; v++) {
          var an = st.answers[v];
          if (an.ok) continue;
          wrongHtml += '<li class="iq-wrong-item"><p class="iq-wrong-q">' + escapeHtml(an.item.q) + '</p>' +
            '<p class="iq-wrong-ans">پاسخ تو: <b class="iq-bad">' + escapeHtml(an.item.options[an.picked]) +
            '</b><br>پاسخ درست: <b>' + escapeHtml(an.item.options[an.item.correct]) + '</b><br>' +
            escapeHtml(an.item.why) + '</p></li>';
        }
        wrongHtml += '</ul>';
      } else {
        wrongHtml = '<p class="iq-perfect">بدون غلط! همه را درست زدی.</p>';
      }
      dom.result.innerHTML =
        '<p class="iq-msg">' + escapeHtml(msg) + '</p>' +
        '<div class="iq-score"><p class="iq-score-num">IQ ' + iq + '</p>' +
        '<p class="iq-score-label">نمره خام: ' + got + ' از ' + max + ' • ' + escapeHtml(iqLevel(iq)) + '</p></div>' +
        '<div class="iq-doms">' + bars + '</div>' + wrongHtml +
        '<div class="iq-actions"><button class="iq-again" type="button">تلاش دوباره</button>' +
        '<button class="iq-home" type="button">بازگشت به منوی تست</button></div>';
      dom.result.querySelector('.iq-again').addEventListener('click', function () { start(); window.scrollTo(0, 0); });
      dom.result.querySelector('.iq-home').addEventListener('click', goBackToIqMenu);
      dom.counter.textContent = st.answers.length + ' / ' + st.order.length;
      dom.fill.style.width = '100%';
      window.scrollTo(0, 0);
    }

    return { start: start, stop: stop };
  }

  // پنل را زیر نظر می‌گیرد و به‌محض باز/بسته شدن، تست را شروع/متوقف می‌کند.
  function watchPanel(panel, onShow, onHide) {
    if (!panel) return;
    var shown = false;
    function sync() {
      var active = !panel.hidden && panel.classList.contains('active');
      if (active && !shown) { shown = true; onShow(); }
      else if (!active && shown) { shown = false; onHide(); }
    }
    if (window.MutationObserver) {
      new MutationObserver(sync).observe(panel, { attributes: true, attributeFilter: ['class', 'hidden'] });
    }
    sync();
  }

  function init() {
    var mechRoot = document.getElementById('mechIqTest');
    var genRoot = document.getElementById('generalIqTest');

    if (mechRoot) {
      var mech = createTest(mechRoot, {
        bank: DATA.IQ_BANK,
        domainNames: DATA.IQ_DOMAIN_NAMES,
        keys: ['mech', 'num', 'logic', 'applied'],
        seconds: DATA.IQ_TOTAL_SECONDS,
        storageKey: 'mechIqLast'
      });
      watchPanel(document.querySelector('.tool-panel[data-panel="mechIq"]'), mech.start, mech.stop);
    }

    if (genRoot) {
      var gen = createTest(genRoot, {
        bank: DATA.GIQ_BANK,
        domainNames: DATA.GIQ_DOMAIN_NAMES,
        keys: ['verb', 'num', 'spat', 'logic', 'mem'],
        seconds: DATA.GIQ_TOTAL_SECONDS,
        storageKey: 'generalIqLast'
      });
      watchPanel(document.querySelector('.tool-panel[data-panel="generalIq"]'), gen.start, gen.stop);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
