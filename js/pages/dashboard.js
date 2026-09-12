'use strict';

(function() {
  var STORAGE_KEY = 'gb_selected_device';
  var demoInterval = null;
  var demoRunning = false;
  var liveActive = false;
  var currentDeviceId = null;
  var paused = false;

  function initDashboard() {
    renderDeviceSelector();
    var saved = localStorage.getItem(STORAGE_KEY);
    var select = document.getElementById('header-device-select');
    if (saved && (getDeviceById(saved) || saved === 'manual') && select) {
      select.value = saved;
      onDeviceSelected(saved);
    }
    syncHeaderDeviceUi();
    if (window.LiveModbus && window.LiveModbus.addConnectionListener) {
      window.LiveModbus.addConnectionListener(function() {
        syncHeaderDeviceUi();
        if (!currentDeviceId) {
          var container = document.getElementById('dashboard-content');
          if (container) renderDashboardGuide(container);
        } else if (currentDeviceId && currentDeviceId !== 'manual') {
          syncLiveOrDemo();
        }
        updateLiveBadge();
      });
    }
    if (window.LiveModbus && window.LiveModbus.addDemoModeListener) {
      window.LiveModbus.addDemoModeListener(function() {
        if (currentDeviceId && currentDeviceId !== 'manual' && !paused) {
          syncLiveOrDemo();
        }
        updateLiveBadge();
      });
    }
    if (window.LiveModbus && window.LiveModbus.addHealthListener) {
      window.LiveModbus.addHealthListener(function() {
        updateDashHealth();
      });
    }
  }

  function isBleLinked() {
    return !!(window.LiveModbus && typeof window.LiveModbus.isBleConnected === 'function' && window.LiveModbus.isBleConnected());
  }

  function syncHeaderDeviceUi() {
    var select = document.getElementById('header-device-select');
    var label = document.getElementById('header-device-name');
    if (!select || !label) return;
    if (isBleLinked()) {
      select.classList.add('hidden');
      label.classList.remove('hidden');
      updateHeaderDeviceName(currentDeviceId || select.value);
    } else {
      label.classList.add('hidden');
      select.classList.remove('hidden');
      if (currentDeviceId) select.value = currentDeviceId;
    }
  }

  function renderDeviceSelector() {
    var select = document.getElementById('header-device-select');
    if (!select) return;
    select.innerHTML = '<option value="">-- Cihaz Seçin --</option>';
    var devices = getDeviceList();
    devices.forEach(function(d) {
      var opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.name + ' (' + d.phases + ' faz, ' + d.manufacturer + ')';
      select.appendChild(opt);
    });
    var sep = document.createElement('option');
    sep.disabled = true;
    sep.textContent = '───────────────';
    select.appendChild(sep);
    var manual = document.createElement('option');
    manual.value = 'manual';
    manual.textContent = 'Tanımsız Cihaz (Manuel Modbus)';
    select.appendChild(manual);

    select.addEventListener('change', function() {
      localStorage.setItem(STORAGE_KEY, this.value);
      onDeviceSelected(this.value);
      syncHeaderDeviceUi();
    });
  }

  function onDeviceSelected(deviceId) {
    stopAllData();
    paused = false;
    currentDeviceId = deviceId || null;
    var container = document.getElementById('dashboard-content');
    if (!container) return;

    if (!deviceId) {
      renderDashboardGuide(container);
      updateHeaderDeviceName(null);
      updateLiveBadge();
      if (typeof window.syncNavForDevice === 'function') window.syncNavForDevice(null);
      return;
    }

    updateHeaderDeviceName(deviceId);

    if (deviceId === 'manual') {
      renderManualDashboard(container);
      updateLiveBadge();
      if (typeof window.syncNavForDevice === 'function') window.syncNavForDevice('manual');
      return;
    }

    var device = getDeviceById(deviceId);
    if (!device) {
      container.innerHTML = (typeof emptyStateHtml === 'function'
        ? emptyStateHtml({
            icon: 'device',
            title: 'Cihaz bulunamadı',
            desc: 'Kayıtlı model geçersiz. Lütfen listeden bir analizör seçin.',
            actions: [{ action: 'focus-device', label: 'Model seç', primary: true }]
          })
        : '<p class="text-red-400 text-center mt-4">Cihaz bulunamadı.</p>');
      if (typeof bindEmptyStateActions === 'function') bindEmptyStateActions(container);
      if (typeof window.syncNavForDevice === 'function') window.syncNavForDevice(null);
      return;
    }

    renderDeviceDashboard(container, device, deviceId);
    syncLiveOrDemo();
    updateLiveBadge();
    if (typeof window.syncNavForDevice === 'function') window.syncNavForDevice(deviceId);
  }

  function isDashboardPageActive() {
    var page = document.getElementById('page-dashboard');
    return page && page.classList.contains('active');
  }

  function setDashboardAwaitingLive(on) {
    var el = document.getElementById('dashboard-content');
    if (!el) return;
    el.classList.toggle('is-awaiting-live', !!on);
  }

  function syncLiveOrDemo() {
    if (!currentDeviceId || currentDeviceId === 'manual') return;
    if (paused) return;
    if (!isDashboardPageActive()) return;

    stopAllData();
    var useLive = window.LiveModbus && window.LiveModbus.shouldUseLive();
    var useDemo = window.LiveModbus && window.LiveModbus.shouldUseDemo();
    if (useLive) {
      setDashboardAwaitingLive(true);
      startLive(currentDeviceId);
    } else if (useDemo) {
      setDashboardAwaitingLive(false);
      startDemo(currentDeviceId);
    } else {
      setDashboardAwaitingLive(false);
      clearParamValues(currentDeviceId);
    }
    updateLiveBadge();
  }

  function clearParamValues(deviceId) {
    var device = getDeviceById(deviceId);
    if (!device) return;
    device.groups.forEach(function(group) {
      group.params.forEach(function(param) {
        setParamValueText(param.reg, '—');
      });
    });
  }

  function stopAllData() {
    stopDemo();
    stopLive();
    setDashboardAwaitingLive(false);
  }

  function pauseIconSvg() {
    return '<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="4" y="3" width="4" height="14" rx="1"/><rect x="12" y="3" width="4" height="14" rx="1"/></svg>';
  }

  function playIconSvg() {
    return '<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M6 3.5v13l11-6.5L6 3.5z"/></svg>';
  }

  function demoToggleClass(isPaused) {
    if (isPaused) {
      return 'inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-full border border-brand/30 bg-brand text-white cursor-pointer hover:bg-brand-dark shadow-sm transition-colors';
    }
    return 'inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-full border border-gray-300 bg-white text-ink cursor-pointer hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-colors';
  }

  function setDemoToggleUi(btn, isPaused) {
    if (!btn) return;
    btn.className = demoToggleClass(isPaused);
    btn.setAttribute('aria-pressed', isPaused ? 'true' : 'false');
    btn.setAttribute('aria-label', isPaused ? 'Başlat' : 'Duraklat');
    btn.title = isPaused ? 'Canlı veriyi başlat' : 'Canlı veriyi duraklat';
    btn.innerHTML = isPaused ? playIconSvg() : pauseIconSvg();
  }

  function setParamValueText(reg, text) {
    var el = document.getElementById('p_' + reg);
    if (el) el.textContent = text;
    var hi = document.getElementById('ph_' + reg);
    if (hi) hi.textContent = text;
  }

  /** Glanceable üst metrikler — V / A / P / PF / Hz / Enerji tercihi (cihazdan bağımsız heuristic). */
  function pickHighlightMetrics(device) {
    var flat = [];
    (device.groups || []).forEach(function(g) {
      (g.params || []).forEach(function(p) {
        flat.push({ group: g, param: p });
      });
    });

    function find(pred) {
      for (var i = 0; i < flat.length; i++) {
        if (pred(flat[i].group, flat[i].param)) return flat[i];
      }
      return null;
    }

    var picks = [];
    var used = {};
    function add(item, label) {
      if (!item || used[item.param.reg] != null) return;
      used[item.param.reg] = true;
      picks.push({
        reg: item.param.reg,
        label: label,
        unit: item.group.unit || '',
        precision: item.param.precision != null ? item.param.precision : 2
      });
    }

    add(find(function(g, p) {
      return /gerilim/i.test(g.title) && (/^L1\b/i.test(p.name) || /^Gerilim$/i.test(p.name));
    }), 'Gerilim');
    add(find(function(g, p) {
      return /akım/i.test(g.title) && (/^L1\b/i.test(p.name) || /^Akım$/i.test(p.name));
    }), 'Akım');
    add(find(function(g, p) {
      return /aktif\s*güç/i.test(g.title) && /toplam/i.test(p.name);
    }) || find(function(g, p) {
      return (/aktif\s*güç/i.test(g.title) || (/^Güç$/i.test(g.title) && /aktif/i.test(p.name))) &&
        !/reaktif|görünür/i.test(p.name);
    }), 'Güç');
    add(find(function(g, p) {
      return /güç\s*faktörü/i.test(g.title) && /toplam/i.test(p.name);
    }) || find(function(g, p) {
      return /güç\s*faktörü/i.test(g.title) || /güç\s*faktörü/i.test(p.name);
    }), 'PF');
    add(find(function(g, p) {
      return /frekans/i.test(g.title) || /frekans/i.test(p.name);
    }), 'Frekans');
    add(find(function(g, p) {
      return /enerji/i.test(g.title) && /aktif|toplam|^Enerji$/i.test(p.name) && !/reaktif|export/i.test(p.name);
    }), 'Enerji');

    for (var j = 0; j < flat.length && picks.length < 6; j++) {
      add(flat[j], flat[j].param.name);
    }
    return picks.slice(0, 6);
  }

  function renderDeviceDashboard(container, device, deviceId) {
    var html = '';
    var highlights = pickHighlightMetrics(device);

    html += '<div class="flex items-center justify-between mb-3 gap-2 min-w-0">';
    html += '<div class="text-sm text-gray-500 min-w-0 truncate">' + device.name + ' <span class="text-gray-400">|</span> ' + device.phases + ' Faz <span class="text-gray-400">|</span> Fn: 0x' + device.modbusFunction.toString(16).padStart(2, '0').toUpperCase();
    html += ' <span id="dash-mode-badge" class="ml-1 text-xs px-2 py-0.5 rounded-full badge-off align-middle">—</span></div>';
    html += '<button type="button" id="demo-toggle"></button>';
    html += '</div>';
    html += '<div id="dash-health" class="dash-health" hidden role="status" aria-live="polite">' +
      '<span class="dash-health-dot" aria-hidden="true"></span>' +
      '<span id="dash-health-text"></span></div>';
    html += '<div class="dash-await-banner" role="status">' +
      '<span class="connect-progress-spinner" aria-hidden="true"></span>' +
      '<span>İlk ölçümler yükleniyor…</span></div>';

    if (highlights.length) {
      html += '<div id="dash-highlights" aria-label="Öncelikli ölçümler">';
      highlights.forEach(function(h) {
        html += '<div class="dash-hi-card">';
        html += '<div class="dash-hi-label">' + h.label + '</div>';
        html += '<div class="dash-hi-row">';
        html += '<span class="dash-hi-value param-value" id="ph_' + h.reg + '">—</span>';
        if (h.unit) html += '<span class="dash-hi-unit">' + h.unit + '</span>';
        html += '</div></div>';
      });
      html += '</div>';
    }

    html += '<div class="gap-2.5" id="cards-grid">';
    device.groups.forEach(function(group, gi) {
      html += '<div class="value-card surface-card p-3">';
      html += '<div class="flex items-center justify-between mb-2">';
      html += '<span class="section-label">' + group.title;
      if (group.unit) html += ' <span class="text-ink-faint normal-case font-normal">(' + group.unit + ')</span>';
      html += '</span>';
      html += '<button type="button" class="chart-btn inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-full border border-gray-300 bg-white text-ink cursor-pointer hover:bg-gray-50 hover:border-brand hover:text-brand shadow-sm transition-colors" data-device="' + deviceId + '" data-group="' + gi + '" title="Canlı grafik" aria-label="Canlı grafik">';
      html += '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 10 14 10 12 16 8 4 6 10 2 10"/></svg>';
      html += '</button>';
      html += '</div>';

      group.params.forEach(function(param) {
        var paramKey = 'p_' + param.reg;
        html += '<div class="flex justify-between items-baseline py-0.5">';
        html += '<span class="text-xs text-ink-muted truncate mr-1">' + param.name + '</span>';
        html += '<span class="param-value" id="' + paramKey + '">—</span>';
        html += '</div>';
      });

      html += '</div>';
    });
    html += '</div>';

    container.innerHTML = html;

    var toggleBtn = document.getElementById('demo-toggle');
    if (toggleBtn) {
      setDemoToggleUi(toggleBtn, paused);
      toggleBtn.addEventListener('click', function() {
        if (!paused && (demoRunning || liveActive)) {
          paused = true;
          stopAllData();
        } else {
          paused = false;
          syncLiveOrDemo();
        }
        setDemoToggleUi(this, paused);
        updateModeBadge();
        updateDashHealth();
      });
    }

    container.querySelectorAll('.chart-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var devId = this.dataset.device;
        var groupIdx = parseInt(this.dataset.group, 10);
        if (typeof window.openChartForGroup === 'function') {
          window.openChartForGroup(devId, groupIdx);
        }
        if (typeof window.showPage === 'function') {
          window.showPage('charts');
        }
      });
    });

    updateModeBadge();
    updateDashHealth();
  }

  function healthLabel(h) {
    if (!h) return '';
    if (h.message) return h.message;
    if (h.code === 'ok') return 'Sistem normal';
    if (h.code === 'demo') return 'Demo veri';
    if (h.code === 'timeout') return 'Modbus zaman aşımı';
    if (h.code === 'no_stream') return 'Veri akışı yok';
    if (h.code === 'offline') return 'Bağlantı yok';
    if (h.code === 'error') return 'Canlı okuma hatası';
    return '';
  }

  function updateDashHealth() {
    var el = document.getElementById('dash-health');
    var text = document.getElementById('dash-health-text');
    if (!el || !text) return;
    if (paused) {
      el.hidden = false;
      el.className = 'dash-health is-warn';
      text.textContent = 'Okuma duraklatıldı';
      return;
    }
    var h = window.LiveModbus && typeof window.LiveModbus.getHealth === 'function'
      ? window.LiveModbus.getHealth()
      : null;
    if (!h || h.code === 'idle') {
      el.hidden = true;
      return;
    }
    // ISA-101: sorunları göster; ok iken kısa yeşil veya gizle
    if (h.code === 'ok') {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.className = 'dash-health is-' + (h.level === 'danger' ? 'danger' : (h.level === 'warn' ? 'warn' : 'ok'));
    text.textContent = healthLabel(h);
  }

  function updateModeBadge() {
    var badge = document.getElementById('dash-mode-badge');
    if (!badge) return;
    if (paused) {
      badge.textContent = 'Duraklatıldı';
      badge.className = 'ml-1 text-xs px-2 py-0.5 rounded-full badge-off';
    } else if (liveActive) {
      badge.textContent = 'Canlı';
      badge.className = 'ml-1 text-xs px-2 py-0.5 rounded-full badge-live';
    } else if (demoRunning) {
      badge.textContent = 'Demo';
      badge.className = 'ml-1 text-xs px-2 py-0.5 rounded-full badge-demo';
    } else {
      badge.textContent = '—';
      badge.className = 'ml-1 text-xs px-2 py-0.5 rounded-full badge-off';
    }
  }

  function updateLiveBadge() {
    updateModeBadge();
    updateDashHealth();
  }

  function renderDashboardGuide(container) {
    var ble = !!(window.LiveModbus && typeof window.LiveModbus.isBleConnected === 'function' &&
      window.LiveModbus.isBleConnected());
    var html = '<div class="empty-state" role="status">';
    html += '<div class="empty-state-icon" aria-hidden="true">' +
      (typeof EMPTY_STATE_ICONS !== 'undefined' ? EMPTY_STATE_ICONS.meter :
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>') +
      '</div>';
    html += '<p class="empty-state-title">Ölçüme başlayın</p>';
    html += '<p class="empty-state-desc">Önce gateway’e bağlanın, ardından analizör modelini seçin.</p>';
    html += '<ol class="empty-state-steps">';
    html += '<li class="' + (ble ? 'is-done' : '') + '">';
    html += '<span class="step-num">' + (ble ? '✓' : '1') + '</span>';
    html += '<div class="min-w-0 flex-1">';
    html += '<strong>Cihaza bağlanın</strong>';
    html += '<p class="step-body">Üstteki Bluetooth bağlantısı ile gateway’e bağlanın.</p>';
    if (!ble) {
      html += '<button type="button" class="empty-state-btn is-primary mt-2" data-empty-action="connect">Cihaza Bağlan</button>';
    } else {
      html += '<p class="step-body text-ok-text mt-1 font-medium">Bağlı</p>';
    }
    html += '</div></li>';
    html += '<li>';
    html += '<span class="step-num">2</span>';
    html += '<div class="min-w-0 flex-1">';
    html += '<strong>Analizör modeli seçin</strong>';
    html += '<p class="step-body">Header’daki listeden cihaz modelini seçin; kartlar burada görünür.</p>';
    html += '<button type="button" class="empty-state-btn mt-2" data-empty-action="focus-device">Model seç</button>';
    html += '</div></li>';
    html += '</ol>';
    if (!ble) {
      html += '<div class="empty-state-actions mt-4">';
      html += '<button type="button" class="empty-state-btn" data-empty-action="try-demo">Demo ile dene</button>';
      html += '</div>';
      html += '<p class="empty-state-desc mt-2">Cihaz olmadan arayüzü örnek veriyle gezebilirsiniz.</p>';
    }
    html += '</div>';
    container.innerHTML = html;
    if (typeof bindEmptyStateActions === 'function') bindEmptyStateActions(container);
  }

  function renderManualDashboard(container) {
    var html = typeof emptyStateHtml === 'function'
      ? emptyStateHtml({
          icon: 'config',
          title: 'Manuel Modbus',
          desc: 'Tanımsız cihaz için Ayarlar → Manuel Modbus sekmesinden okuma/yazma yapın.',
          actions: [{ action: 'settings', label: 'Ayarlar’a git', primary: true }]
        })
      : '<p class="text-sm text-gray-500 text-center mt-8">Ayarlar → Manuel Modbus sekmesini kullanın.</p>';
    container.innerHTML = html;
    if (typeof bindEmptyStateActions === 'function') bindEmptyStateActions(container);
  }

  function collectGroupParams(device) {
    var params = [];
    device.groups.forEach(function(group) {
      group.params.forEach(function(param) {
        params.push(param);
      });
    });
    return params;
  }

  function applyValuesToUi(deviceId, device, values) {
    var gotAny = false;
    device.groups.forEach(function(group) {
      group.params.forEach(function(param) {
        var val = values[param.reg];
        if (val === undefined || val === null || isNaN(val)) return;
        gotAny = true;
        var prec = param.precision != null ? param.precision : 2;
        var text = Number(val).toFixed(prec);
        setParamValueText(param.reg, text);
        if (typeof window.pushDemoData === 'function') {
          window.pushDemoData(deviceId + ':' + param.reg, val);
        }
      });
    });
    if (gotAny) {
      setDashboardAwaitingLive(false);
      if (window.ConnectProgress && typeof window.ConnectProgress.signalFirstLiveData === 'function') {
        window.ConnectProgress.signalFirstLiveData();
      }
    }
  }

  function startLive(deviceId) {
    var device = getDeviceById(deviceId);
    if (!device || !window.LiveModbus) return;
    liveActive = true;
    updateModeBadge();
    window.LiveModbus.startLive({
      owner: 'dashboard',
      intervalMs: 750,
      getDeviceDef: function() { return getDeviceById(currentDeviceId); },
      getParams: function() {
        var d = getDeviceById(currentDeviceId);
        return d ? collectGroupParams(d) : [];
      },
      onValues: function(values) {
        var d = getDeviceById(currentDeviceId);
        if (d) applyValuesToUi(currentDeviceId, d, values);
      },
      onError: function(e) {
        if (typeof logMsg === 'function') logMsg('Dashboard canlı okuma: ' + (e.message || e));
        else if (window.logMsg) window.logMsg('Dashboard canlı okuma: ' + (e.message || e));
      },
      onDisconnected: function() {
        liveActive = false;
        if (!paused && currentDeviceId && currentDeviceId !== 'manual' &&
            window.LiveModbus && window.LiveModbus.shouldUseDemo()) {
          startDemo(currentDeviceId);
        }
        updateLiveBadge();
      }
    });
  }

  function stopLive() {
    liveActive = false;
    if (window.LiveModbus) window.LiveModbus.stopLivePoll('dashboard');
  }

  function startDemo(deviceId) {
    if (demoInterval) clearInterval(demoInterval);
    demoRunning = true;
    liveActive = false;
    var device = getDeviceById(deviceId);
    if (!device) return;

    if (window.LiveModbus && typeof window.LiveModbus.setHealth === 'function') {
      window.LiveModbus.setHealth('demo', 'Demo veri');
    }
    updateDemoValues(device);
    demoInterval = setInterval(function() {
      updateDemoValues(device);
    }, 1000);
    updateModeBadge();
    updateDashHealth();
  }

  function stopDemo() {
    if (demoInterval) {
      clearInterval(demoInterval);
      demoInterval = null;
    }
    demoRunning = false;
  }

  function updateDemoValues(device) {
    device.groups.forEach(function(group) {
      group.params.forEach(function(param) {
        var val;
        if (param.demoRange === 0) {
          val = param.demoBase;
        } else {
          val = param.demoBase + (Math.random() - 0.5) * 2 * param.demoRange;
        }
        var prec = param.precision != null ? param.precision : 2;
        setParamValueText(param.reg, Number(val).toFixed(prec));

        if (typeof window.pushDemoData === 'function') {
          window.pushDemoData(currentDeviceId + ':' + param.reg, val);
        }
      });
    });
  }

  function updateHeaderDeviceName(deviceId) {
    var el = document.getElementById('header-device-name');
    if (!el) return;
    if (!deviceId) {
      el.textContent = 'Cihaz seçilmedi';
    } else if (deviceId === 'manual') {
      el.textContent = 'Tanımsız Cihaz (Manuel)';
    } else {
      var device = getDeviceById(deviceId);
      el.textContent = device ? device.name : 'Cihaz seçilmedi';
    }
  }

  window.initDashboard = initDashboard;
  window.getCurrentDeviceId = function() { return currentDeviceId; };
  window.syncHeaderDeviceUi = syncHeaderDeviceUi;
  /** Analizör rehberinden: demo zorla + ilk model (veya mevcut). */
  window.tryDemoDevice = function() {
    if (window.LiveModbus && typeof window.LiveModbus.setDemoMode === 'function') {
      window.LiveModbus.setDemoMode('force');
    }
    var demoSel = document.getElementById('app_demo_mode');
    if (demoSel) demoSel.value = 'force';
    var select = document.getElementById('header-device-select');
    var id = currentDeviceId;
    if (!id || id === 'manual') {
      var list = typeof getDeviceList === 'function' ? getDeviceList() : [];
      id = list.length ? list[0].id : null;
    }
    if (!id) return;
    if (select) select.value = id;
    localStorage.setItem(STORAGE_KEY, id);
    onDeviceSelected(id);
    syncHeaderDeviceUi();
  };
  window.startDashboardLiveIfConnected = function() {
    if (paused) return;
    if (!currentDeviceId || currentDeviceId === 'manual') return;
    syncLiveOrDemo();
  };
  window.stopDashboardLive = function() {
    stopAllData();
  };

  document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
  });
})();
