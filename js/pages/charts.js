'use strict';

(function() {
  var charts = {};
  var dataStore = {};
  var demoTimers = {};
  var TIME_WINDOWS = { '30s': 30000, '60s': 60000, '5m': 300000, '30m': 1800000 };
  var currentTimeWindow = 30000;
  var maxPoints = 300;

  function initCharts() {
    renderChartsPage();
  }

  function timeWindowBtnClass(active) {
    if (active) {
      return 'time-window-btn text-xs font-semibold px-2.5 py-1.5 rounded-full border border-brand bg-brand text-white cursor-pointer shadow-sm transition-colors';
    }
    return 'time-window-btn text-xs font-semibold px-2.5 py-1.5 rounded-full border border-gray-300 bg-white text-ink cursor-pointer hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-colors';
  }

  function renderChartsPage() {
    var container = document.getElementById('charts-content');
    if (!container) return;

    var html = '';

    html += '<div class="flex items-center gap-1.5 mb-3 min-w-0">';
    html += '<span class="text-xs text-gray-500 shrink-0">Zaman:</span>';
    html += '<div class="flex items-center gap-1.5 min-w-0 overflow-x-auto flex-1">';
    Object.keys(TIME_WINDOWS).forEach(function(label) {
      var active = TIME_WINDOWS[label] === currentTimeWindow;
      html += '<button type="button" class="' + timeWindowBtnClass(active) + ' shrink-0" data-ms="' + TIME_WINDOWS[label] + '">' + label + '</button>';
    });
    html += '</div>';
    var badge = (window.LiveModbus && window.LiveModbus.getModeBadge)
      ? window.LiveModbus.getModeBadge()
      : { label: '—', className: 'badge-off' };
    html += '<span id="charts-mode-badge" class="text-xs px-2 py-0.5 rounded-full shrink-0 ' + badge.className + '">' + badge.label + '</span>';
    html += '<button type="button" id="add-chart-btn" title="Veri Ekle" aria-label="Veri Ekle" class="inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-full border border-brand/30 bg-brand text-white cursor-pointer hover:bg-brand-dark shadow-sm transition-colors">';
    html += '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg>';
    html += '</button>';
    html += '</div>';

    html += '<div id="charts-list"></div>';

    html += '<div id="add-chart-modal" class="hidden fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center">';
    html += '<div class="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-sm p-4 max-h-[70vh] overflow-y-auto">';
    html += '<div class="flex items-center justify-between mb-3">';
    html += '<span class="font-semibold text-gray-700 text-sm">Parametre Seçin</span>';
    html += '<button id="close-modal" class="text-gray-400 hover:text-gray-600 text-lg border-none bg-transparent cursor-pointer">&times;</button>';
    html += '</div>';
    html += '<div id="param-list"></div>';
    html += '</div></div>';

    container.innerHTML = html;

    container.querySelectorAll('.time-window-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        currentTimeWindow = parseInt(this.dataset.ms, 10);
        container.querySelectorAll('.time-window-btn').forEach(function(b) {
          var isActive = parseInt(b.dataset.ms, 10) === currentTimeWindow;
          b.className = timeWindowBtnClass(isActive) + ' shrink-0';
        });
        trimAllCharts();
      });
    });

    document.getElementById('add-chart-btn').addEventListener('click', showAddChartModal);
    document.getElementById('close-modal').addEventListener('click', hideAddChartModal);
    document.getElementById('add-chart-modal').addEventListener('click', function(e) {
      if (e.target === this) hideAddChartModal();
    });

    restoreActiveCharts();
    updateChartsEmptyHint();
  }

  function updateChartsEmptyHint() {
    var list = document.getElementById('charts-list');
    if (!list) return;
    if (Object.keys(charts).length > 0) {
      var empty = list.querySelector('.empty-state');
      if (empty) empty.remove();
      return;
    }
    list.innerHTML = typeof emptyStateHtml === 'function'
      ? emptyStateHtml({
          icon: 'chart',
          title: 'Henüz grafik yok',
          desc: 'Analizör kartındaki grafik ikonuna dokunun veya sağ üstteki + ile parametre ekleyin.',
          actions: [
            { action: 'add-chart', label: 'Veri ekle (+)', primary: true },
            { action: 'dashboard', label: 'Analizör’e git' }
          ]
        })
      : '<p class="text-sm text-ink-muted text-center py-8">Grafik eklemek için + kullanın.</p>';
    if (typeof bindEmptyStateActions === 'function') bindEmptyStateActions(list);
  }

  function showAddChartModal() {
    var modal = document.getElementById('add-chart-modal');
    var paramList = document.getElementById('param-list');
    if (!modal || !paramList) return;

    var deviceId = typeof window.getCurrentDeviceId === 'function' ? window.getCurrentDeviceId() : null;
    if (!deviceId || deviceId === 'manual') {
      paramList.innerHTML = typeof emptyStateHtml === 'function'
        ? emptyStateHtml({
            icon: 'chart',
            title: 'Önce model seçin',
            desc: 'Grafik eklemek için header’dan bir enerji analizörü seçin.',
            actions: [{ action: 'focus-device', label: 'Model seç', primary: true }]
          })
        : '<p class="text-sm text-gray-500">Lütfen önce bir enerji analizör modeli seçin.</p>';
      if (typeof bindEmptyStateActions === 'function') bindEmptyStateActions(paramList);
      modal.classList.remove('hidden');
      return;
    }

    var device = getDeviceById(deviceId);
    if (!device) return;

    var html = '';
    device.groups.forEach(function(group, gi) {
      html += '<div class="mb-2">';
      html += '<div class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">' + group.title + ' (' + group.unit + ')</div>';
      group.params.forEach(function(param) {
        var paramKey = deviceId + ':' + param.reg;
        var isActive = !!charts[paramKey];
        html += '<button class="param-add-btn w-full text-left px-3 py-1.5 text-sm rounded-lg mb-0.5 border-none cursor-pointer transition-colors ';
        html += isActive ? 'bg-brand-light text-brand' : 'bg-gray-50 text-gray-700 hover:bg-gray-100';
        html += '" data-key="' + paramKey + '" data-name="' + param.name + '" data-unit="' + group.unit + '" data-device="' + deviceId + '" data-reg="' + param.reg + '"';
        html += ' data-demo-base="' + param.demoBase + '" data-demo-range="' + param.demoRange + '" data-precision="' + param.precision + '">';
        html += param.name;
        if (isActive) html += ' <span class="text-xs">(aktif)</span>';
        html += '</button>';
      });
      html += '</div>';
    });

    paramList.innerHTML = html;
    modal.classList.remove('hidden');

    paramList.querySelectorAll('.param-add-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var key = this.dataset.key;
        if (charts[key]) {
          removeChart(key);
        } else {
          addChart(key, this.dataset.name, this.dataset.unit, {
            deviceId: this.dataset.device,
            reg: parseInt(this.dataset.reg, 10),
            demoBase: parseFloat(this.dataset.demoBase),
            demoRange: parseFloat(this.dataset.demoRange),
            precision: parseInt(this.dataset.precision, 10)
          });
        }
        hideAddChartModal();
      });
    });
  }

  function hideAddChartModal() {
    var modal = document.getElementById('add-chart-modal');
    if (modal) modal.classList.add('hidden');
  }

  function addChart(paramKey, label, unit, meta) {
    if (charts[paramKey]) return;

    var chartsList = document.getElementById('charts-list');
    if (!chartsList) return;
    var priorEmpty = chartsList.querySelector('.empty-state');
    if (priorEmpty) priorEmpty.remove();

    var wrapper = document.createElement('div');
    wrapper.id = 'chart-wrap-' + paramKey.replace(/[:.]/g, '_');
    wrapper.className = 'surface-card p-3 mb-2.5';

    var headerHtml = '<div class="flex items-center justify-between mb-1">';
    headerHtml += '<span class="text-xs font-semibold text-gray-700">' + label;
    if (unit) headerHtml += ' <span class="text-gray-400 font-normal">(' + unit + ')</span>';
    headerHtml += '</span>';
    headerHtml += '<button class="remove-chart-btn text-gray-300 hover:text-red-500 text-base border-none bg-transparent cursor-pointer transition-colors" data-key="' + paramKey + '">&times;</button>';
    headerHtml += '</div>';
    headerHtml += '<div class="chart-container" style="width:100%;height:180px;"></div>';
    headerHtml += '<div class="flex justify-between mt-1 text-xs text-gray-400">';
    headerHtml += '<span>Min: <span class="stat-min font-mono">—</span></span>';
    headerHtml += '<span>Ort: <span class="stat-avg font-mono">—</span></span>';
    headerHtml += '<span>Max: <span class="stat-max font-mono">—</span></span>';
    headerHtml += '</div>';

    wrapper.innerHTML = headerHtml;
    chartsList.appendChild(wrapper);

    wrapper.querySelector('.remove-chart-btn').addEventListener('click', function() {
      removeChart(this.dataset.key);
    });

    var chartDiv = wrapper.querySelector('.chart-container');
    var chart = echarts.init(chartDiv);
    var option = {
      grid: { top: 10, right: 10, bottom: 24, left: 45 },
      tooltip: { trigger: 'axis', textStyle: { fontSize: 11 } },
      xAxis: { type: 'time', axisLabel: { fontSize: 10 }, splitLine: { show: false } },
      yAxis: { type: 'value', name: unit, nameTextStyle: { fontSize: 10 }, axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }, scale: true },
      series: [{ type: 'line', smooth: false, showSymbol: false, data: [], lineStyle: { width: 1.5, color: '#0096D6' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(0,150,214,0.12)' }, { offset: 1, color: 'rgba(0,150,214,0)' }] } } }],
      animation: false
    };
    chart.setOption(option);

    charts[paramKey] = { chart: chart, wrapper: wrapper, label: label, unit: unit, meta: meta };
    dataStore[paramKey] = [];

    var scheduleResize = function(attempt) {
      if (attempt > 5) return;
      setTimeout(function() {
        if (chartDiv.offsetWidth > 0) {
          chart.resize();
        } else {
          scheduleResize(attempt + 1);
        }
      }, attempt * 100 + 50);
    };
    scheduleResize(0);

    startDataFeedForChart(paramKey, meta);
    saveActiveCharts();
    updateChartsEmptyHint();
  }

  function removeChart(paramKey) {
    if (!charts[paramKey]) return;
    if (demoTimers[paramKey]) {
      clearInterval(demoTimers[paramKey]);
      delete demoTimers[paramKey];
    }
    charts[paramKey].chart.dispose();
    charts[paramKey].wrapper.remove();
    delete charts[paramKey];
    delete dataStore[paramKey];
    saveActiveCharts();
    updateChartsEmptyHint();
    if (isChartsPageActive() && window.LiveModbus && window.LiveModbus.shouldUseLive()) {
      startChartsLive();
    }
  }

  function pushData(paramKey, value) {
    if (!dataStore[paramKey]) return;
    var now = new Date().getTime();
    dataStore[paramKey].push([now, value]);

    var cutoff = now - currentTimeWindow;
    while (dataStore[paramKey].length > 0 && dataStore[paramKey][0][0] < cutoff) {
      dataStore[paramKey].shift();
    }
    if (dataStore[paramKey].length > maxPoints) {
      dataStore[paramKey] = dataStore[paramKey].slice(-maxPoints);
    }

    if (charts[paramKey]) {
      charts[paramKey].chart.setOption({ series: [{ data: dataStore[paramKey] }] });
      updateStats(paramKey);
    }
  }

  function updateStats(paramKey) {
    if (!charts[paramKey] || !dataStore[paramKey] || dataStore[paramKey].length === 0) return;
    var wrapper = charts[paramKey].wrapper;
    var values = dataStore[paramKey].map(function(d) { return d[1]; });
    var precision = charts[paramKey].meta ? charts[paramKey].meta.precision || 1 : 1;
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var avg = values.reduce(function(a, b) { return a + b; }, 0) / values.length;
    wrapper.querySelector('.stat-min').textContent = min.toFixed(precision);
    wrapper.querySelector('.stat-avg').textContent = avg.toFixed(precision);
    wrapper.querySelector('.stat-max').textContent = max.toFixed(precision);
  }

  function trimAllCharts() {
    var now = new Date().getTime();
    var cutoff = now - currentTimeWindow;
    Object.keys(dataStore).forEach(function(key) {
      while (dataStore[key].length > 0 && dataStore[key][0][0] < cutoff) {
        dataStore[key].shift();
      }
      if (charts[key]) {
        charts[key].chart.setOption({ series: [{ data: dataStore[key] }] });
      }
    });
  }

  var lastDemoValues = {};

  function isChartsPageActive() {
    var page = document.getElementById('page-charts');
    return page && page.classList.contains('active');
  }

  function startDataFeedForChart(paramKey, meta) {
    if (!meta) return;
    if (window.LiveModbus && window.LiveModbus.shouldUseLive()) {
      if (demoTimers[paramKey]) {
        clearInterval(demoTimers[paramKey]);
        delete demoTimers[paramKey];
      }
      if (isChartsPageActive()) startChartsLive();
      return;
    }
    if (window.LiveModbus && window.LiveModbus.shouldUseDemo()) {
      startDemoForChart(paramKey, meta);
    }
  }

  function startDemoForChart(paramKey, meta) {
    if (!meta) return;
    if (demoTimers[paramKey]) clearInterval(demoTimers[paramKey]);
    lastDemoValues[paramKey] = meta.demoBase;
    demoTimers[paramKey] = setInterval(function() {
      if (window.LiveModbus && window.LiveModbus.shouldUseLive()) return;
      if (!(window.LiveModbus && window.LiveModbus.shouldUseDemo())) return;
      var val;
      if (meta.demoRange === 0) {
        val = meta.demoBase;
      } else {
        var step = (Math.random() - 0.5) * meta.demoRange * 0.4;
        val = lastDemoValues[paramKey] + step;
        var lo = meta.demoBase - meta.demoRange;
        var hi = meta.demoBase + meta.demoRange;
        if (val < lo) val = lo + Math.random() * meta.demoRange * 0.1;
        if (val > hi) val = hi - Math.random() * meta.demoRange * 0.1;
      }
      lastDemoValues[paramKey] = val;
      pushData(paramKey, val);
    }, 1000);
  }

  function stopChartsLive() {
    if (window.LiveModbus) window.LiveModbus.stopLivePoll('charts');
  }

  function startChartsLive() {
    stopChartsLive();
    if (!window.LiveModbus || !window.LiveModbus.shouldUseLive()) return;
    var keys = Object.keys(charts);
    if (!keys.length) return;

    Object.keys(demoTimers).forEach(function(k) {
      clearInterval(demoTimers[k]);
      delete demoTimers[k];
    });

    window.LiveModbus.startLive({
      owner: 'charts',
      intervalMs: 750,
      getDeviceDef: function() {
        var deviceId = typeof window.getCurrentDeviceId === 'function' ? window.getCurrentDeviceId() : null;
        return deviceId ? getDeviceById(deviceId) : null;
      },
      getParams: function() {
        var params = [];
        Object.keys(charts).forEach(function(key) {
          var meta = charts[key].meta;
          if (!meta || meta.reg == null) return;
          var device = getDeviceById(meta.deviceId);
          var found = null;
          if (device && device.groups) {
            device.groups.forEach(function(g) {
              g.params.forEach(function(p) {
                if (p.reg === meta.reg) found = p;
              });
            });
          }
          params.push(found || { reg: meta.reg, len: 1, type: 'uint16', scale: 1 });
        });
        return params;
      },
      onValues: function(values) {
        var gotAny = false;
        Object.keys(charts).forEach(function(key) {
          var meta = charts[key].meta;
          if (!meta || values[meta.reg] === undefined) return;
          gotAny = true;
          pushData(key, values[meta.reg]);
        });
        if (gotAny && window.ConnectProgress && typeof window.ConnectProgress.signalFirstLiveData === 'function') {
          window.ConnectProgress.signalFirstLiveData();
        }
      },
      onError: function(e) {
        if (window.logMsg) window.logMsg('Grafik canlı okuma: ' + (e.message || e));
      }
    });
  }

  function saveActiveCharts() {
    var saved = [];
    Object.keys(charts).forEach(function(key) {
      var c = charts[key];
      saved.push({ key: key, label: c.label, unit: c.unit, meta: c.meta });
    });
    localStorage.setItem('gb_active_charts', JSON.stringify(saved));
  }

  function restoreActiveCharts() {
    try {
      var saved = JSON.parse(localStorage.getItem('gb_active_charts') || '[]');
      saved.forEach(function(item) {
        addChart(item.key, item.label, item.unit, item.meta);
      });
    } catch (e) {
      // ignore
    }
  }

  window.openChartForGroup = function(deviceId, groupIdx) {
    var device = getDeviceById(deviceId);
    if (!device || !device.groups[groupIdx]) return;
    var group = device.groups[groupIdx];
    group.params.forEach(function(param) {
      var paramKey = deviceId + ':' + param.reg;
      if (!charts[paramKey]) {
        addChart(paramKey, param.name, group.unit, {
          deviceId: deviceId,
          reg: param.reg,
          demoBase: param.demoBase,
          demoRange: param.demoRange,
          precision: param.precision
        });
      }
    });
  };

  window.pushDemoData = function(paramKey, value) {
    if (charts[paramKey]) {
      pushData(paramKey, value);
    }
  };

  function resizeAllCharts() {
    Object.keys(charts).forEach(function(key) {
      if (charts[key] && charts[key].chart) {
        charts[key].chart.resize();
      }
    });
  }

  window.initCharts = initCharts;
  window.resizeAllCharts = resizeAllCharts;
  window.startChartsLiveIfConnected = startChartsLive;
  window.stopChartsLive = stopChartsLive;

  document.addEventListener('DOMContentLoaded', function() {
    initCharts();
    window.addEventListener('resize', resizeAllCharts);
    function resyncChartsFeeds() {
      if (!isChartsPageActive()) return;
      stopChartsLive();
      Object.keys(demoTimers).forEach(function(k) {
        clearInterval(demoTimers[k]);
        delete demoTimers[k];
      });
      var badgeEl = document.getElementById('charts-mode-badge');
      if (badgeEl && window.LiveModbus && window.LiveModbus.getModeBadge) {
        var b = window.LiveModbus.getModeBadge();
        badgeEl.textContent = b.label;
        badgeEl.className = 'text-xs px-2 py-0.5 rounded-full ' + b.className;
      }
      if (window.LiveModbus && window.LiveModbus.shouldUseLive()) {
        startChartsLive();
      } else if (window.LiveModbus && window.LiveModbus.shouldUseDemo()) {
        Object.keys(charts).forEach(function(key) {
          startDemoForChart(key, charts[key].meta);
        });
      }
    }
    if (window.LiveModbus && window.LiveModbus.addConnectionListener) {
      window.LiveModbus.addConnectionListener(resyncChartsFeeds);
    }
    if (window.LiveModbus && window.LiveModbus.addDemoModeListener) {
      window.LiveModbus.addDemoModeListener(resyncChartsFeeds);
    }
  });
})();
