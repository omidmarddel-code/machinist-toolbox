/* Push messages for all Machinist Toolbox Android installations. */
(function () {
  'use strict';

  var TOPIC = 'machinist_toolbox_all';
  var initialized = false;
  var bannerTimer = null;

  function plugins() {
    return window.Capacitor && window.Capacitor.Plugins;
  }

  function showBanner(title, body) {
    if (!body && !title) return;
    var banner = document.getElementById('remoteAnnouncement');
    if (!banner) {
      banner = document.createElement('aside');
      banner.id = 'remoteAnnouncement';
      banner.className = 'remote-announcement';
      banner.setAttribute('role', 'status');
      banner.setAttribute('aria-live', 'polite');
      banner.innerHTML = '<span class="remote-announcement-icon" aria-hidden="true">📣</span>' +
        '<span class="remote-announcement-copy"><strong></strong><span></span></span>' +
        '<button type="button" class="remote-announcement-close" aria-label="بستن پیام">×</button>';
      banner.querySelector('button').addEventListener('click', function () {
        banner.classList.remove('is-visible');
      });
      document.body.appendChild(banner);
    }
    banner.querySelector('strong').textContent = title || 'پیام جدید';
    banner.querySelector('.remote-announcement-copy span').textContent = body || '';
    banner.classList.remove('is-visible');
    window.requestAnimationFrame(function () { banner.classList.add('is-visible'); });
    if (bannerTimer) window.clearTimeout(bannerTimer);
    bannerTimer = window.setTimeout(function () { banner.classList.remove('is-visible'); }, 9000);
  }

  function initializePush() {
    if (initialized) return;
    var cap = window.Capacitor;
    var nativeAndroid = cap && cap.isNativePlatform && cap.isNativePlatform() &&
      cap.getPlatform && cap.getPlatform() === 'android';
    var pluginSet = plugins();
    var push = pluginSet && pluginSet.PushNotifications;
    var fcm = pluginSet && pluginSet.FCM;
    if (!nativeAndroid || !push || !fcm) return;

    initialized = true;
    push.addListener('pushNotificationReceived', function (notification) {
      showBanner(notification.title, notification.body);
    });
    push.addListener('pushNotificationActionPerformed', function (action) {
      var notification = action && action.notification;
      var data = notification && notification.data;
      if (data && data.title) showBanner(data.title, data.body);
    });

    push.checkPermissions().then(function (permission) {
      if (permission.receive === 'granted') return permission;
      if (permission.receive === 'denied') return null;
      return push.requestPermissions();
    }).then(function (permission) {
      if (!permission || permission.receive !== 'granted') return;
      return push.register().then(function () {
        return fcm.subscribeTo({ topic: TOPIC });
      });
    }).catch(function (error) {
      console.warn('[Announcements] Push setup failed:', error);
      initialized = false;
    });
  }

  document.addEventListener('DOMContentLoaded', initializePush, { once: true });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') initializePush();
  });
})();
