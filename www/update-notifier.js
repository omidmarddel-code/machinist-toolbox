/* ============================================================================
 *  Machinist Toolbox — Update Notifier (Android)
 * ----------------------------------------------------------------------------
 *  تشخیص آپدیت بر اساس انتشار فایل APK جدید در GitHub Releases، نه شماره نسخه.
 *
 *  منطق:
 *   - آخرین Release منتشرشده (غیر Draft و غیر Prerelease) از GitHub API خوانده می‌شود.
 *   - فقط Assetهای با پسوند .apk ملاک هستند؛ Release بدون APK اعلان نمی‌دهد.
 *   - شناسهٔ یکتای هر APK = "releaseId:assetId" (پایدار و اثبات‌پذیر).
 *   - شناسه‌های اطلاع‌رسانی‌شده در localStorage ذخیره می‌شوند تا اعلان تکراری نباشد.
 *   - لمس اعلان → باز شدن صفحهٔ Release برای دانلود APK.
 *   - قطع اینترنت یا در دسترس نبودن GitHub → سکوت، بدون خطا.
 *
 *  زمان بررسی: شروع برنامه + بازگشت به حالت فعال (resume).
 *  بررسی در حالت بستهٔ کامل برنامه: پیاده‌سازی نشده (طبق درخواست).
 * ========================================================================== */

(function () {
  'use strict';

  // --- پیکربندی -----------------------------------------------------------------
  var OWNER = 'omidmarddel-code';
  var REPO = 'machinist-toolbox';
  var API_URL = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/releases/latest';
  var RELEASE_URL = 'https://github.com/' + OWNER + '/' + REPO + '/releases';

  var LS_SEEN = 'mtb_update_seen_assets';      // ["releaseId:assetId", ...]
  var LS_LAST_CHECK = 'mtb_update_last_check'; // timestamp آخرین بررسی (cooldown)
  var CHECK_COOLDOWN_MS = 60 * 60 * 1000;      // حداکثر یک بررسی در ساعت (API rate limit)

  // --- ابزارها --------------------------------------------------------------------
  function isAndroidApp() {
    try {
      var C = window.Capacitor;
      return !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform() &&
        C.getPlatform && C.getPlatform() === 'android');
    } catch (e) {
      return false;
    }
  }

  function lsGet(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function lsSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* حافظه غیرفعال → نادیده */ }
  }

  // --- دریافت آخرین Release --------------------------------------------------------
  function fetchLatestRelease() {
    return fetch(API_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/vnd.github+json' },
      cache: 'no-store'
    }).then(function (res) {
      if (!res.ok) {
        // 404 = هنوز هیچ Releases منتشر نشده؛ طبیعی است، اعلان نمی‌دهیم.
        throw new Error('HTTP ' + res.status);
      }
      return res.json();
    });
  }

  // جدیدترین APK داخل Release (در صورت چند فایل، بزرگ‌ترین asset_id)
  function pickApkAsset(release) {
    if (!release || release.draft || release.prerelease) return null;
    if (!Array.isArray(release.assets)) return null;
    var apks = release.assets.filter(function (a) {
      return a && typeof a.name === 'string' && /\.apk$/i.test(a.name);
    });
    if (!apks.length) return null;
    apks.sort(function (x, y) { return (y.id || 0) - (x.id || 0); });
    return apks[0];
  }

  function assetKey(release, asset) {
    // ترکیب مطمئن: شناسهٔ Release + شناسهٔ Asset (شماره نسخهٔ برنامه ملاک نیست)
    return release.id + ':' + asset.id;
  }

  // --- شناسه‌های اطلاع‌رسانی‌شده -------------------------------------------------------
  function getSeen() {
    var arr = lsGet(LS_SEEN, []);
    return Array.isArray(arr) ? arr : [];
  }

  function markSeen(key) {
    var seen = getSeen();
    if (seen.indexOf(key) === -1) {
      seen.push(key);
      if (seen.length > 50) seen = seen.slice(seen.length - 50); // جلوگیری از رشد بی‌حد
      lsSet(LS_SEEN, seen);
    }
  }

  // --- مجوز اعلان (اندروید ۱۳ به بالا نیاز به مجوز runtime دارد) ----------------------
  var permissionAsked = false;   // جلوگیری از درخواست مکرر مجوز در یک نشست

  function hasDisplayPermission(status) {
    return !!(status && status.display === 'granted');
  }

  function ensureNotificationPermission(notif) {
    if (typeof notif.checkPermissions !== 'function') {
      // نسخهٔ قدیمی افزونه یا محیط بدون مجوز runtime: بدون دروازهٔ مجوز ادامه بده.
      console.log('[MTB Update] checkPermissions در دسترس نیست؛ بدون بررسی مجوز ادامه می‌دهیم.');
      return Promise.resolve(true);
    }
    return notif.checkPermissions().then(function (status) {
      console.log('[MTB Update][DIAG] checkPermissions() → display=' +
        (status && status.display));
      if (hasDisplayPermission(status)) return true;

      // اگر کاربر قبلاً رد کرده یا یک‌بار پرسیده‌ایم، دوباره پنجرهٔ مجوز نشان نده.
      if (permissionAsked || (status && status.display === 'denied')) {
        console.warn('[MTB Update] مجوز اعلان در وضعیت "' + (status && status.display) +
          '" است؛ بدون درخواست مجدد ادامه می‌دهیم.');
        return false;
      }
      if (typeof notif.requestPermissions !== 'function') {
        console.warn('[MTB Update] requestPermissions در دسترس نیست؛ اعلان آپدیت ثبت نمی‌شود.');
        return false;
      }
      permissionAsked = true;
      console.log('[MTB Update][DIAG] در حال نمایش پنجرهٔ درخواست مجوز اعلان (requestPermissions)...');
      return notif.requestPermissions().then(function (res) {
        console.log('[MTB Update][DIAG] requestPermissions() → display=' +
          (res && res.display));
        if (hasDisplayPermission(res)) return true;
        console.warn('[MTB Update] مجوز اعلان داده نشد (display=' + (res && res.display) +
          ')؛ اعلان آپدیت ثبت نشد ولی برنامه بدون خطا ادامه دارد.');
        return false;
      }).catch(function (e) {
        console.warn('[MTB Update] خطا در requestPermissions:', e);
        return false;
      });
    }).catch(function (e) {
      console.warn('[MTB Update] خطا در checkPermissions:', e);
      return false;
    });
  }

  // --- اعلان اندرویدی -----------------------------------------------------------------
  function showUpdateNotification(release, asset) {
    var key = assetKey(release, asset);
    var notif = window.Capacitor && window.Capacitor.Plugins &&
      window.Capacitor.Plugins.LocalNotifications;

    if (!notif || typeof notif.schedule !== 'function') {
      return Promise.resolve(false);  // افزونه نیست → در اجرای بعدی دوباره تلاش
    }

    // فقط در صورت اعطای مجوز runtime اعلان را ثبت کن (اندروید ۱۳ به بالا).
    return ensureNotificationPermission(notif).then(function (granted) {
      if (!granted) {
        // شناسه ثبت نمی‌شود تا اگر مجوز بعداً گرفته شد، دوباره تلاش شود.
        console.warn('[MTB Update][DIAG] مجوز اعلان داده نشد؛ schedule اجرا نشد. (کلید در seen ثبت نشد)');
        return false;
      }
      console.log('[MTB Update][DIAG] مجوز اعلان داده شد؛ در حال فراخوانی schedule()...');

      var title = 'آپدیت جدید منتشر شد';
      var body = (asset.name || 'APK جدید') + ' در GitHub منتشر شده است. برای دانلود ضربه بزنید.';

      return notif.schedule({
        notifications: [{
          id: 4242,
          title: title,
          body: body,
          schedule: { at: new Date(Date.now() + 500) },
          extra: { url: RELEASE_URL }
        }]
      }).then(function (res) {
        console.log('[MTB Update][DIAG] schedule() موفق بود →', res && JSON.stringify(res));
        markSeen(key);
        return true;
      }).catch(function (e) {
        console.warn('[MTB Update][DIAG] schedule() رد شد:', e && (e.message || e),
          ' (کلید در seen ثبت نشد)');
        return false;
      });
    });
  }

  // لمس اعلان → صفحهٔ Release
  function setupNotificationTap() {
    try {
      var notif = window.Capacitor && window.Capacitor.Plugins &&
        window.Capacitor.Plugins.LocalNotifications;
      if (!notif || typeof notif.addListener !== 'function') return;

      notif.addListener('localNotificationActionPerformed', function (action) {
        try {
          var extra = action && action.notification && action.notification.extra;
          openReleasePage((extra && extra.url) || RELEASE_URL);
        } catch (e) { /* بی‌خطا */ }
      });
    } catch (e) { /* بی‌خطا */ }
  }

  function openReleasePage(url) {
    var Browser = window.Capacitor && window.Capacitor.Plugins &&
      window.Capacitor.Plugins.Browser;
    if (Browser && typeof Browser.open === 'function') {
      Browser.open({ url: url, windowName: '_blank' }).catch(function () {
        try { window.open(url, '_blank'); } catch (e2) { /* بی‌خطا */ }
      });
      return;
    }
    try { window.open(url, '_blank'); } catch (e) { /* بی‌خطا */ }
  }

  // --- چرخهٔ بررسی ---------------------------------------------------------------------
  var checking = false;

  function checkForUpdate(force) {
    if (!isAndroidApp()) return Promise.resolve(false);   // فقط نسخهٔ اندروید
    if (checking) return Promise.resolve(false);

    // cooldown: بدون force، حداکثر یک بررسی در ساعت
    if (!force) {
      var last = Number(lsGet(LS_LAST_CHECK, 0)) || 0;
      if (Date.now() - last < CHECK_COOLDOWN_MS) {
        console.log('[MTB Update][DIAG] cooldown فعال است؛ بررسی رد شد. ' +
          'باقی‌مانده تا بررسی بعدی ≈ ' +
          Math.round((CHECK_COOLDOWN_MS - (Date.now() - last)) / 60000) + ' دقیقه');
        return Promise.resolve(false);
      }
    }

    checking = true;
    lsSet(LS_LAST_CHECK, Date.now());
    console.log('[MTB Update][DIAG] بررسی شروع شد (force=' + !!force + ')؛ در حال دریافت آخرین Release...');

    return fetchLatestRelease()
      .then(function (release) {
        var asset = pickApkAsset(release);
        if (!asset) {                                    // Release بدون APK → هیچ
          console.warn('[MTB Update][DIAG] Release معتبر پیدا نشد یا فایل APK ندارد. ' +
            'release.id=' + (release && release.id) +
            ' draft=' + (release && release.draft) +
            ' prerelease=' + (release && release.prerelease) +
            ' assets=' + (release && Array.isArray(release.assets) ? release.assets.length : 'n/a'));
          return false;
        }

        var key = assetKey(release, asset);
        if (getSeen().indexOf(key) !== -1) {             // قبلاً اطلاع داده شده
          console.warn('[MTB Update][DIAG] این کلید قبلاً در seen ثبت شده؛ اعلان تکراری نمایش داده نمی‌شود. key=' + key);
          return false;
        }
        console.log('[MTB Update][DIAG] APK جدید شناسایی شد؛ تلاش برای نمایش اعلان. key=' + key +
          ' asset=' + (asset && asset.name));

        return showUpdateNotification(release, asset);
      })
      .catch(function (e) {
        // اینترنت قطع، GitHub در دسترس نیست، 403 rate limit → سکوت
        console.warn('[MTB Update][DIAG] خطا در دریافت/پردازش Release:', e && (e.message || e));
        return false;
      })
      .finally(function () {
        checking = false;
      });
  }

  // --- راه‌اندازی: شروع برنامه + resume -------------------------------------------------
  function setupTriggers() {
    if (isAndroidApp()) {
      checkForUpdate(false);   // (۱) شروع برنامه
    }

    try {
      var App = window.Capacitor && window.Capacitor.Plugins &&
        window.Capacitor.Plugins.App;
      if (App && typeof App.addListener === 'function') {
        App.addListener('appStateChange', function (state) {
          if (state && state.isActive) {
            checkForUpdate(false);   // (۲) بازگشت به حالت فعال
          }
        });
      }
    } catch (e) { /* بی‌خطا */ }
  }

  // --- شروع -----------------------------------------------------------------------------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setupTriggers();
      setupNotificationTap();
    });
  } else {
    setupTriggers();
    setupNotificationTap();
  }

  // برای تست دستی از کنسول WebView:
  window.MTB_UpdateNotifier = {
    checkNow: function () { return checkForUpdate(true); },
    clearSeen: function () { lsSet(LS_SEEN, []); lsSet(LS_LAST_CHECK, 0); },
    status: function () {
      return {
        seen: getSeen(),
        lastCheck: lsGet(LS_LAST_CHECK, 0),
        isAndroidApp: isAndroidApp()
      };
    }
  };
})();
