'use strict';

(function() {
  var currentPageId = 'dashboard';

  function stopAllPagePollers() {
    if (typeof window.stopDashboardLive === 'function') window.stopDashboardLive();
    if (typeof window.stopHarmonicsLive === 'function') window.stopHarmonicsLive();
    if (typeof window.stopIoMonitorLive === 'function') window.stopIoMonitorLive();
    if (typeof window.stopChartsLive === 'function') window.stopChartsLive();
    if (window.LiveModbus) {
      if (typeof window.LiveModbus.stopLiveStream === 'function') window.LiveModbus.stopLiveStream();
      else window.LiveModbus.stopLivePoll();
    }
  }

  function activateSettingsTab(tabName) {
    var btn = document.querySelector('#page-settings .tab-modern[data-tab="' + tabName + '"]');
    var panel = document.getElementById('tab-' + tabName);
    if (!btn || !panel) return;
    document.querySelectorAll('#page-settings .tab-modern').forEach(function(b) {
      b.classList.remove('active');
    });
    document.querySelectorAll('#page-settings .tab-content').forEach(function(tc) {
      tc.style.display = 'none';
    });
    btn.classList.add('active');
    panel.style.display = '';
    if (typeof window.updateSettingsDeviceActionsVisibility === 'function') {
      window.updateSettingsDeviceActionsVisibility(tabName);
    }
  }

  function updateNavVisibility(deviceId) {
    var caps = typeof getDeviceCapabilities === 'function'
      ? getDeviceCapabilities(deviceId)
      : null;
    document.querySelectorAll('#bottom-nav .nav-btn').forEach(function(btn) {
      var page = btn.dataset.page;
      var visible = caps ? !!caps[page] : true;
      btn.classList.toggle('is-capability-hidden', !visible);
      btn.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (visible) btn.removeAttribute('tabindex');
      else btn.setAttribute('tabindex', '-1');
    });
  }

  function showPage(pageId) {
    var deviceId = typeof window.getCurrentDeviceId === 'function' ? window.getCurrentDeviceId() : null;
    if (typeof isPageAvailableForDevice === 'function' && !isPageAvailableForDevice(pageId, deviceId)) {
      pageId = typeof getFallbackPageForDevice === 'function'
        ? getFallbackPageForDevice(deviceId)
        : 'dashboard';
    }

    document.querySelectorAll('.page').forEach(function(p) {
      p.classList.remove('active');
    });
    document.querySelectorAll('#bottom-nav .nav-btn').forEach(function(b) {
      b.classList.remove('active');
    });

    var page = document.getElementById('page-' + pageId);
    if (page) page.classList.add('active');

    var btn = document.querySelector('#bottom-nav .nav-btn[data-page="' + pageId + '"]');
    if (btn) btn.classList.add('active');

    window.scrollTo(0, 0);

    stopAllPagePollers();
    currentPageId = pageId;

    if (pageId === 'dashboard') {
      if (typeof window.startDashboardLiveIfConnected === 'function') {
        requestAnimationFrame(function() {
          window.startDashboardLiveIfConnected();
        });
      }
    }

    if (pageId === 'charts') {
      if (typeof window.resizeAllCharts === 'function') {
        requestAnimationFrame(function() {
          window.resizeAllCharts();
          setTimeout(window.resizeAllCharts, 200);
        });
      }
      if (typeof window.startChartsLiveIfConnected === 'function') {
        requestAnimationFrame(function() {
          window.startChartsLiveIfConnected();
        });
      }
    }

    if (pageId === 'harmonics' && typeof window.refreshHarmonics === 'function') {
      requestAnimationFrame(function() {
        window.refreshHarmonics();
      });
    }

    if (pageId === 'device-settings' && typeof window.refreshDeviceSettings === 'function') {
      requestAnimationFrame(function() {
        window.refreshDeviceSettings();
      });
    }

    if (pageId === 'io-monitor' && typeof window.refreshIoMonitor === 'function') {
      requestAnimationFrame(function() {
        window.refreshIoMonitor();
      });
    }
  }

  /**
   * Cihaz yeteneklerine göre nav’ı günceller; açık sayfa artık yoksa fallback’e alır.
   * SSOT: getDeviceCapabilities (device-registry.js)
   */
  function syncNavForDevice(deviceId) {
    updateNavVisibility(deviceId);

    var available = typeof isPageAvailableForDevice === 'function'
      ? isPageAvailableForDevice(currentPageId, deviceId)
      : true;

    if (!available) {
      var fallback = typeof getFallbackPageForDevice === 'function'
        ? getFallbackPageForDevice(deviceId)
        : 'dashboard';
      showPage(fallback);
    }

    if (deviceId === 'manual' && currentPageId === 'settings') {
      activateSettingsTab('manual-modbus');
    }
  }

  window.showPage = showPage;
  window.getCurrentPageId = function() { return currentPageId; };
  window.syncNavForDevice = syncNavForDevice;
  window.activateSettingsTab = activateSettingsTab;

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('#bottom-nav .nav-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (this.classList.contains('is-capability-hidden')) return;
        showPage(this.dataset.page);
      });
    });

    var deviceId = typeof window.getCurrentDeviceId === 'function' ? window.getCurrentDeviceId() : null;
    syncNavForDevice(deviceId);
    if (!document.querySelector('.page.active')) {
      showPage(typeof getFallbackPageForDevice === 'function'
        ? getFallbackPageForDevice(deviceId)
        : 'dashboard');
    }
  });
})();
