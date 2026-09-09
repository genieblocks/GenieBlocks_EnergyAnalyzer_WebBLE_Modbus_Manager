'use strict';

(function() {
  var currentPageId = 'dashboard';

  function stopAllPagePollers() {
    if (typeof window.stopDashboardLive === 'function') window.stopDashboardLive();
    if (typeof window.stopHarmonicsLive === 'function') window.stopHarmonicsLive();
    if (typeof window.stopIoMonitorLive === 'function') window.stopIoMonitorLive();
    if (typeof window.stopChartsLive === 'function') window.stopChartsLive();
    if (window.LiveModbus) window.LiveModbus.stopLivePoll();
  }

  function showPage(pageId) {
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

  window.showPage = showPage;
  window.getCurrentPageId = function() { return currentPageId; };

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('#bottom-nav .nav-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        showPage(this.dataset.page);
      });
    });
    showPage('dashboard');
  });
})();
