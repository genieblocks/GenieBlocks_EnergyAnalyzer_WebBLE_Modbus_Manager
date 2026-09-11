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
    if (saved && (getDeviceById(saved) || saved === 'manual')) {
      document.getElementById('device-select').value = saved;
      onDeviceSelected(saved);
    }
    if (window.LiveModbus && window.LiveModbus.addConnectionListener) {
      window.LiveModbus.addConnectionListener(function() {
        if (currentDeviceId && currentDeviceId !== 'manual') {
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
  }

  function renderDeviceSelector() {
    var select = document.getElementById('device-select');
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
    });
  }

  function onDeviceSelected(deviceId) {
    stopAllData();
    paused = false;
    currentDeviceId = deviceId;
    var container = document.getElementById('dashboard-content');
    if (!container) return;

    if (!deviceId) {
      container.innerHTML = '<p class="text-gray-400 text-center mt-8 text-sm">Lütfen bir enerji analizör modeli seçin.</p>';
      updateLiveBadge();
      return;
    }

    updateHeaderDeviceName(deviceId);

    if (deviceId === 'manual') {
      renderManualDashboard(container);
      updateLiveBadge();
      return;
    }

    var device = getDeviceById(deviceId);
    if (!device) {
      container.innerHTML = '<p class="text-red-400 text-center mt-4">Cihaz bulunamadı.</p>';
      return;
    }

    renderDeviceDashboard(container, device, deviceId);
    syncLiveOrDemo();
    updateLiveBadge();
  }

  function isDashboardPageActive() {
    var page = document.getElementById('page-dashboard');
    return page && page.classList.contains('active');
  }

  function syncLiveOrDemo() {
    if (!currentDeviceId || currentDeviceId === 'manual') return;
    if (paused) return;
    if (!isDashboardPageActive()) return;

    stopAllData();
    var useLive = window.LiveModbus && window.LiveModbus.shouldUseLive();
    var useDemo = window.LiveModbus && window.LiveModbus.shouldUseDemo();
    if (useLive) {
      startLive(currentDeviceId);
    } else if (useDemo) {
      startDemo(currentDeviceId);
    } else {
      clearParamValues(currentDeviceId);
    }
    updateLiveBadge();
  }

  function clearParamValues(deviceId) {
    var device = getDeviceById(deviceId);
    if (!device) return;
    device.groups.forEach(function(group) {
      group.params.forEach(function(param) {
        var el = document.getElementById('p_' + param.reg);
        if (el) el.textContent = '—';
      });
    });
  }

  function stopAllData() {
    stopDemo();
    stopLive();
  }

  function renderDeviceDashboard(container, device, deviceId) {
    var html = '';

    html += '<div class="flex items-center justify-between mb-3">';
    html += '<div class="text-sm text-gray-500">' + device.name + ' <span class="text-gray-400">|</span> ' + device.phases + ' Faz <span class="text-gray-400">|</span> Fn: 0x' + device.modbusFunction.toString(16).padStart(2, '0').toUpperCase();
    html += ' <span id="dash-mode-badge" class="ml-1 text-xs px-2 py-0.5 rounded-full badge-off">—</span></div>';
    html += '<button id="demo-toggle" class="text-xs px-3 py-1 rounded-full badge-live border-none cursor-pointer hover:bg-emerald-100 transition-colors">Duraklat</button>';
    html += '</div>';

    html += '<div class="grid grid-cols-2 gap-2.5" id="cards-grid">';
    device.groups.forEach(function(group, gi) {
      html += '<div class="value-card surface-card p-3">';
      html += '<div class="flex items-center justify-between mb-2">';
      html += '<span class="section-label">' + group.title;
      if (group.unit) html += ' <span class="text-ink-faint normal-case font-normal">(' + group.unit + ')</span>';
      html += '</span>';
      html += '<button class="chart-btn w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-brand-light text-ink-faint hover:text-brand border-none cursor-pointer transition-colors" data-device="' + deviceId + '" data-group="' + gi + '" title="Canlı grafik">';
      html += '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 10 14 10 12 16 8 4 6 10 2 10"/></svg>';
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
      toggleBtn.addEventListener('click', function() {
        if (!paused && (demoRunning || liveActive)) {
          paused = true;
          stopAllData();
          this.textContent = 'Başlat';
          this.className = 'text-xs px-3 py-1 rounded-full bg-brand-light text-brand-dark border-none cursor-pointer hover:bg-brand-light transition-colors';
        } else {
          paused = false;
          syncLiveOrDemo();
          this.textContent = 'Duraklat';
          this.className = 'text-xs px-3 py-1 rounded-full badge-live border-none cursor-pointer hover:bg-emerald-100 transition-colors';
        }
        updateModeBadge();
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
  }

  function renderManualDashboard(container) {
    var html = '';
    html += '<div class="surface-card p-4">';
    html += '<h3 class="text-sm font-semibold text-gray-700 mb-3">Manuel Modbus Okuyucu</h3>';
    html += '<p class="text-xs text-gray-500 mb-3">Canlı okuma için üstteki <strong>Manuel Modbus</strong> sekmesini kullanın (BLE bağlantısı gerekir).</p>';
    html += '<div class="flex flex-col gap-2.5">';

    html += '<div class="flex items-center gap-2"><label class="text-xs text-gray-500 w-20">Slave</label>';
    html += '<input type="number" id="dash-mm-slave" min="1" max="247" value="1" class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"></div>';

    html += '<div class="flex items-center gap-2"><label class="text-xs text-gray-500 w-20">Fonksiyon</label>';
    html += '<select id="dash-mm-func" class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm">';
    html += '<option value="3">0x03 Read Holding</option><option value="4">0x04 Read Input</option>';
    html += '</select></div>';

    html += '<div class="flex items-center gap-2"><label class="text-xs text-gray-500 w-20">Başlangıç</label>';
    html += '<input type="number" id="dash-mm-start" min="0" max="65535" value="0" class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"></div>';

    html += '<div class="flex items-center gap-2"><label class="text-xs text-gray-500 w-20">Adet</label>';
    html += '<input type="number" id="dash-mm-qty" min="1" max="64" value="10" class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"></div>';

    html += '<button id="dash-mm-read" class="mt-1 px-4 py-1.5 rounded-full bg-brand text-white font-medium text-sm border-none cursor-pointer hover:bg-brand-dark transition-colors">Demo Oku</button>';
    html += '</div>';
    html += '</div>';

    html += '<div id="dash-mm-result" class="mt-3"></div>';

    container.innerHTML = html;

    document.getElementById('dash-mm-read').addEventListener('click', function() {
      var qty = parseInt(document.getElementById('dash-mm-qty').value, 10) || 10;
      var start = parseInt(document.getElementById('dash-mm-start').value, 10) || 0;
      var resultDiv = document.getElementById('dash-mm-result');
      var rows = '';
      for (var i = 0; i < qty; i++) {
        var val = Math.floor(Math.random() * 65536);
        rows += '<div class="flex justify-between items-baseline py-0.5 px-2 ' + (i % 2 === 0 ? 'bg-gray-50' : '') + '">';
        rows += '<span class="text-xs font-mono text-gray-500">Reg[' + (start + i) + ']</span>';
        rows += '<span class="text-sm font-mono font-semibold text-gray-800">' + val + ' <span class="text-gray-400">(0x' + val.toString(16).toUpperCase().padStart(4, '0') + ')</span></span>';
        rows += '</div>';
      }
      resultDiv.innerHTML = '<div class="surface-card p-3">' +
        '<div class="section-label mb-2">Demo Sonuç</div>' + rows + '</div>';
    });
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
    device.groups.forEach(function(group) {
      group.params.forEach(function(param) {
        var el = document.getElementById('p_' + param.reg);
        if (!el) return;
        var val = values[param.reg];
        if (val === undefined || val === null || isNaN(val)) return;
        var prec = param.precision != null ? param.precision : 2;
        el.textContent = Number(val).toFixed(prec);
        if (typeof window.pushDemoData === 'function') {
          window.pushDemoData(deviceId + ':' + param.reg, val);
        }
      });
    });
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

    updateDemoValues(device);
    demoInterval = setInterval(function() {
      updateDemoValues(device);
    }, 1000);
    updateModeBadge();
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
        var el = document.getElementById('p_' + param.reg);
        if (!el) return;
        var val;
        if (param.demoRange === 0) {
          val = param.demoBase;
        } else {
          val = param.demoBase + (Math.random() - 0.5) * 2 * param.demoRange;
        }
        el.textContent = val.toFixed(param.precision);

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
