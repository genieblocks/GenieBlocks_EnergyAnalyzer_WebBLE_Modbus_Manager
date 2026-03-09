'use strict';

(function() {
  var harmonicChart = null;
  var currentCategory = 'current';
  var currentPhaseIdx = 0;

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

  function renderHarmonicsUI(container) {
    var device = getDevice();

    if (!device) {
      container.innerHTML =
        '<div class="flex flex-col items-center justify-center py-12 text-gray-400 text-sm">' +
          '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-3 text-gray-300"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="8" width="4" height="13"/><rect x="17" y="4" width="4" height="17"/></svg>' +
          '<p>Harmonik analizi için lütfen Dashboard\'dan<br><strong>harmonik destekli bir cihaz</strong> seçin.</p>' +
        '</div>';
      return;
    }

    var html = '';

    html += '<div class="demo-banner flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-sm text-amber-700">';
    html += '<span class="text-lg">&#9888;</span>';
    html += '<span><strong>DEMO MOD</strong> — Harmonik verileri simülasyondur.</span>';
    html += '</div>';

    html += '<div class="flex items-center gap-2 mb-3 flex-wrap">';
    html += '<select id="harm-category" class="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white">';
    html += '<option value="current">Akım Harmonikleri</option>';
    html += '<option value="voltagePN">Gerilim (Faz-Nötr) Harmonikleri</option>';
    html += '<option value="voltageLL">Gerilim (Faz-Faz) Harmonikleri</option>';
    html += '</select>';
    html += '<select id="harm-phase" class="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"></select>';
    html += '<button id="harm-refresh" class="px-3 py-1.5 rounded-full bg-brand text-white font-medium text-sm border-none cursor-pointer hover:bg-brand-dark transition-colors">Yenile</button>';
    html += '</div>';

    html += '<div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">';
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
      renderChart();
    });

    phaseSelect.addEventListener('change', function() {
      currentPhaseIdx = parseInt(this.value, 10);
      renderChart();
    });

    document.getElementById('harm-refresh').addEventListener('click', function() {
      renderChart();
    });

    updatePhaseOptions();
    initChart();
    renderChart();
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
    harmonicChart = echarts.init(chartDom);

    window.addEventListener('resize', function() {
      if (harmonicChart) harmonicChart.resize();
    });
  }

  function generateDemoHarmonics(maxOrder) {
    var data = [];
    for (var i = 2; i <= maxOrder; i++) {
      var base;
      if (i <= 5) base = 15 - i * 2;
      else if (i <= 11) base = 5 - (i - 5) * 0.5;
      else if (i <= 25) base = 2 - (i - 11) * 0.05;
      else base = 0.5;
      var val = Math.max(0.1, base + (Math.random() - 0.5) * base * 0.4);
      data.push(parseFloat(val.toFixed(1)));
    }
    return data;
  }

  function renderChart() {
    if (!harmonicChart) return;
    var device = getDevice();
    if (!device) return;
    var harm = device.harmonics[currentCategory];
    if (!harm) return;

    var phaseName = harm.phases[currentPhaseIdx] || 'L1';
    var data = generateDemoHarmonics(harm.maxOrder);
    var categories = [];
    for (var i = 2; i <= harm.maxOrder; i++) {
      categories.push(i + '.');
    }

    var catLabel = currentCategory === 'current' ? 'Akım' :
                   currentCategory === 'voltagePN' ? 'Gerilim (F-N)' : 'Gerilim (F-F)';

    harmonicChart.setOption({
      title: {
        text: phaseName + ' ' + catLabel + ' Harmonik Spektrumu',
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
            if (params.value > 5) return '#ef4444';
            if (params.value > 3) return '#f59e0b';
            return '#00a7e9';
          },
          borderRadius: [2, 2, 0, 0]
        },
        barMaxWidth: 12
      }]
    }, true);

    var thd = data.reduce(function(sum, v) { return sum + v * v; }, 0);
    thd = Math.sqrt(thd);
    var maxVal = Math.max.apply(null, data);
    var maxIdx = data.indexOf(maxVal) + 2;

    var statsHtml = '';
    statsHtml += '<div class="bg-white border border-gray-200 rounded-lg p-2 shadow-sm">';
    statsHtml += '<div class="text-xs text-gray-400 uppercase">THD</div>';
    statsHtml += '<div class="text-lg font-bold text-gray-800">' + thd.toFixed(1) + '%</div>';
    statsHtml += '</div>';
    statsHtml += '<div class="bg-white border border-gray-200 rounded-lg p-2 shadow-sm">';
    statsHtml += '<div class="text-xs text-gray-400 uppercase">En Yüksek</div>';
    statsHtml += '<div class="text-lg font-bold text-red-600">' + maxVal.toFixed(1) + '%</div>';
    statsHtml += '<div class="text-xs text-gray-400">' + maxIdx + '. harmonik</div>';
    statsHtml += '</div>';
    statsHtml += '<div class="bg-white border border-gray-200 rounded-lg p-2 shadow-sm">';
    statsHtml += '<div class="text-xs text-gray-400 uppercase">Toplam</div>';
    statsHtml += '<div class="text-lg font-bold text-gray-800">' + (harm.maxOrder - 1) + '</div>';
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

  document.addEventListener('DOMContentLoaded', function() {
    initHarmonics();
  });
})();
