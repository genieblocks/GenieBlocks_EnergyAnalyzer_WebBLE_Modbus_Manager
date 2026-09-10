'use strict';

(function() {
  var harmonicChart = null;
  var currentCategory = 'voltage';
  var currentPhaseIdx = 0;
  var harmLiveActive = false;

  function initHarmonics() {
    var container = document.getElementById('harmonics-content');
    if (!container) return;
    renderHarmonicsUI(container);
  }

  function getDevice() {
    var deviceId = typeof window.getCurrentDeviceId === 'function' ? window.getCurrentDeviceId() : null;
    if (!deviceId || deviceId === 'manual') return null;
    var device = getDeviceById(deviceId);
    if (!device || !device.harmonics) return null;
    return device;
  }

  function stopHarmLive() {
    harmLiveActive = false;
    if (window.LiveModbus) window.LiveModbus.stopLivePoll('harmonics');
  }

  function getHarmonicStart(harm, phaseIdx) {
    if (harm.phaseStartRegs && harm.phaseStartRegs[phaseIdx] != null) {
      return harm.phaseStartRegs[phaseIdx];
    }
    var orders = getHarmonicOrders(harm);
    var start = harm.startReg != null ? harm.startReg : 0;
    return start + phaseIdx * orders.length;
  }

  function startHarmLive(device) {
    if (!window.LiveModbus || !window.LiveModbus.shouldUseLive()) return;
    harmLiveActive = true;
    window.LiveModbus.startLivePoll({
      owner: 'harmonics',
      intervalMs: 2500,
      getDeviceDef: function() { return getDevice(); },
      getParams: function() {
        var d = getDevice();
        if (!d) return [];
        var harm = d.harmonics[currentCategory];
        if (!harm) return [];
        var orders = getHarmonicOrders(harm);
        var start = getHarmonicStart(harm, currentPhaseIdx);
        var params = [];
        for (var i = 0; i < orders.length; i++) {
          params.push({
            reg: start + i,
            len: 1,
            type: harm.type || 'uint16',
            scale: harm.scale != null ? harm.scale : 0.1
          });
        }
        return params;
      },
      onValues: function(values, params) {
        var d = getDevice();
        if (!d) return;
        var harm = d.harmonics[currentCategory];
        if (!harm) return;
        var orders = getHarmonicOrders(harm);
        var start = getHarmonicStart(harm, currentPhaseIdx);
        var data = orders.map(function(_, i) {
          var v = values[start + i];
          return v != null ? parseFloat(Number(v).toFixed(1)) : 0;
        });
        paintChart(harm, orders, data, true);
      },
      onError: function(e) {
        if (window.logMsg) window.logMsg('Harmonik canlı okuma: ' + (e.message || e));
      },
      onDisconnected: function() {
        harmLiveActive = false;
        if (window.LiveModbus && window.LiveModbus.shouldUseDemo()) renderChart();
        else renderChartEmpty();
      }
    });
  }

  function renderHarmonicsUI(container) {
    stopHarmLive();
    var device = getDevice();

    if (!device) {
      container.innerHTML =
        '<div class="flex flex-col items-center justify-center py-12 text-gray-400 text-sm">' +
          '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-3 text-gray-300"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="8" width="4" height="13"/><rect x="17" y="4" width="4" height="17"/></svg>' +
          '<p>Harmonik analizi için lütfen Dashboard\'dan<br><strong>harmonik destekli bir cihaz</strong> seçin.</p>' +
        '</div>';
      return;
    }

    var useLive = window.LiveModbus && window.LiveModbus.shouldUseLive();
    var useDemo = window.LiveModbus && window.LiveModbus.shouldUseDemo();
    var badge = (window.LiveModbus && window.LiveModbus.getModeBadge)
      ? window.LiveModbus.getModeBadge()
      : { label: useLive ? 'Canlı' : (useDemo ? 'Demo' : 'Kapalı'), className: useLive ? 'badge-live' : (useDemo ? 'badge-demo' : 'badge-off') };
    var html = '';

    html += '<div class="flex items-center gap-2 mb-3 flex-wrap">';
    var categoryLabels = {
      current: 'Akım Harmonikleri',
      voltage: 'Gerilim Harmonikleri',
      voltagePN: 'Gerilim (Faz-Nötr) Harmonikleri',
      voltageLL: 'Gerilim (Faz-Faz) Harmonikleri'
    };
    var harmKeys = Object.keys(device.harmonics);
    if (harmKeys.indexOf(currentCategory) === -1) {
      var voltageKey = null;
      for (var i = 0; i < harmKeys.length; i++) {
        if (harmKeys[i].indexOf('voltage') === 0) { voltageKey = harmKeys[i]; break; }
      }
      currentCategory = voltageKey || harmKeys[0];
    }

    html += '<select id="harm-category" class="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white">';
    harmKeys.forEach(function(key) {
      html += '<option value="' + key + '"' + (key === currentCategory ? ' selected' : '') + '>' +
              (categoryLabels[key] || key) + '</option>';
    });
    html += '</select>';
    html += '<select id="harm-phase" class="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"></select>';
    html += '<span class="text-xs px-2 py-0.5 rounded-full ' + badge.className + '">' + badge.label + '</span>';
    html += '</div>';

    html += '<div class="surface-card p-3">';
    html += '<div id="harm-chart" style="width:100%;height:320px;"></div>';
    html += '</div>';

    html += '<div id="harm-stats" class="mt-3 grid grid-cols-3 gap-2 text-center"></div>';

    container.innerHTML = html;

    var catSelect = document.getElementById('harm-category');
    var phaseSelect = document.getElementById('harm-phase');

    catSelect.addEventListener('change', function() {
      currentCategory = this.value;
      currentPhaseIdx = 0;
      updatePhaseOptions();
      restartHarmData();
    });

    phaseSelect.addEventListener('change', function() {
      currentPhaseIdx = parseInt(this.value, 10);
      restartHarmData();
    });

    updatePhaseOptions();
    initChart();
    restartHarmData();
  }

  function restartHarmData() {
    stopHarmLive();
    var device = getDevice();
    if (!device) return;
    if (window.LiveModbus && window.LiveModbus.shouldUseLive()) {
      startHarmLive(device);
    } else if (window.LiveModbus && window.LiveModbus.shouldUseDemo()) {
      renderChart();
    } else {
      renderChartEmpty();
    }
  }

  function renderChartEmpty() {
    if (!harmonicChart) return;
    harmonicChart.setOption({
      series: [{ type: 'bar', data: [] }],
      xAxis: { data: [] },
      graphic: {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: { text: 'Demo kapalı — BLE bağlanın', fill: '#9ca3af', fontSize: 13 }
      }
    }, true);
  }

  function updatePhaseOptions() {
    var device = getDevice();
    if (!device) return;
    var harm = device.harmonics[currentCategory];
    if (!harm) return;

    var phaseSelect = document.getElementById('harm-phase');
    phaseSelect.innerHTML = '';
    harm.phases.forEach(function(phase, idx) {
      var opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = phase;
      phaseSelect.appendChild(opt);
    });
    phaseSelect.value = currentPhaseIdx;
  }

  function initChart() {
    var chartDom = document.getElementById('harm-chart');
    if (!chartDom) return;
    if (harmonicChart) {
      try { harmonicChart.dispose(); } catch (e) { /* ignore */ }
    }
    harmonicChart = echarts.init(chartDom);

    window.addEventListener('resize', function() {
      if (harmonicChart) harmonicChart.resize();
    });
  }

  function generateDemoHarmonicsForOrders(orders) {
    return orders.map(function(order) {
      var base;
      if (order <= 1) base = 100;
      else if (order <= 5) base = 15 - order * 2;
      else if (order <= 11) base = 5 - (order - 5) * 0.5;
      else if (order <= 25) base = 2 - (order - 11) * 0.05;
      else base = 0.5;
      var val = Math.max(0.1, base + (Math.random() - 0.5) * Math.abs(base) * 0.4);
      return parseFloat(val.toFixed(1));
    });
  }

  function getHarmonicOrders(harm) {
    if (harm.orders) return harm.orders;
    var list = [];
    for (var i = 2; i <= (harm.maxOrder || 51); i++) list.push(i);
    return list;
  }

  function renderChart() {
    var device = getDevice();
    if (!device) return;
    var harm = device.harmonics[currentCategory];
    if (!harm) return;
    var orders = getHarmonicOrders(harm);
    var data = generateDemoHarmonicsForOrders(orders);
    paintChart(harm, orders, data, false);
  }

  function paintChart(harm, orders, data, modeTag) {
    if (!harmonicChart) return;
    var phaseName = harm.phases[currentPhaseIdx] || 'L1';
    var categories = orders.map(function(o) { return o + '.'; });

    var catLabelsShort = {
      current: 'Akım', voltage: 'Gerilim',
      voltagePN: 'Gerilim (F-N)', voltageLL: 'Gerilim (F-F)'
    };
    var catLabel = catLabelsShort[currentCategory] || currentCategory;
    var suffix = modeTag === true ? ' (Canlı)' : (modeTag === false ? ' (Demo)' : (modeTag ? ' (' + modeTag + ')' : ''));

    harmonicChart.setOption({
      graphic: [],
      title: {
        text: phaseName + ' ' + catLabel + ' Harmonik Spektrumu' + suffix,
        left: 'center',
        textStyle: { fontSize: 13, fontWeight: 600, color: '#374151' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          var p = params[0];
          return p.name + ' harmonik<br/><strong>' + p.value + ' %</strong>';
        }
      },
      grid: { top: 40, right: 10, bottom: 30, left: 45 },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { fontSize: 9, interval: 4 },
        axisLine: { lineStyle: { color: '#e5e7eb' } }
      },
      yAxis: {
        type: 'value',
        name: '%',
        nameTextStyle: { fontSize: 11, color: '#9ca3af' },
        axisLabel: { fontSize: 10 },
        splitLine: { lineStyle: { color: '#f3f4f6' } }
      },
      series: [{
        type: 'bar',
        data: data,
        itemStyle: {
          color: function(params) {
            if (params.value > 5) return '#DC2626';
            if (params.value > 3) return '#D97706';
            return '#0096D6';
          },
          borderRadius: [2, 2, 0, 0]
        },
        barMaxWidth: 12
      }]
    }, true);

    var nonFundamental = [];
    orders.forEach(function(o, idx) {
      if (o !== 1) nonFundamental.push({ order: o, value: data[idx] });
    });
    var thd = Math.sqrt(nonFundamental.reduce(function(sum, item) { return sum + item.value * item.value; }, 0));
    var maxItem = nonFundamental.reduce(function(best, item) { return item.value > best.value ? item : best; }, { order: 0, value: -Infinity });

    var statsHtml = '';
    statsHtml += '<div class="surface-card rounded-lg p-2">';
    statsHtml += '<div class="text-xs text-gray-400 uppercase">THD</div>';
    statsHtml += '<div class="text-lg font-bold text-gray-800">' + thd.toFixed(1) + '%</div>';
    statsHtml += '</div>';
    statsHtml += '<div class="surface-card rounded-lg p-2">';
    statsHtml += '<div class="text-xs text-gray-400 uppercase">En Yüksek</div>';
    statsHtml += '<div class="text-lg font-bold text-red-600">' + (maxItem.value > -Infinity ? maxItem.value.toFixed(1) : '—') + '%</div>';
    statsHtml += '<div class="text-xs text-gray-400">' + (maxItem.order || '—') + '. harmonik</div>';
    statsHtml += '</div>';
    statsHtml += '<div class="surface-card rounded-lg p-2">';
    statsHtml += '<div class="text-xs text-gray-400 uppercase">Toplam</div>';
    statsHtml += '<div class="text-lg font-bold text-gray-800">' + nonFundamental.length + '</div>';
    statsHtml += '<div class="text-xs text-gray-400">harmonik bileşen</div>';
    statsHtml += '</div>';

    var statsDiv = document.getElementById('harm-stats');
    if (statsDiv) statsDiv.innerHTML = statsHtml;
  }

  window.initHarmonics = initHarmonics;
  window.refreshHarmonics = function() {
    var container = document.getElementById('harmonics-content');
    if (container) renderHarmonicsUI(container);
  };
  window.stopHarmonicsLive = stopHarmLive;

  document.addEventListener('DOMContentLoaded', function() {
    initHarmonics();
    function refreshIfActive() {
      if (typeof window.getCurrentPageId === 'function' && window.getCurrentPageId() === 'harmonics') {
        if (typeof window.refreshHarmonics === 'function') window.refreshHarmonics();
      }
    }
    if (window.LiveModbus && window.LiveModbus.addDemoModeListener) {
      window.LiveModbus.addDemoModeListener(refreshIfActive);
    }
    if (window.LiveModbus && window.LiveModbus.addConnectionListener) {
      window.LiveModbus.addConnectionListener(refreshIfActive);
    }
  });
})();
