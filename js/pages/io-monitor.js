'use strict';

(function() {
  var ioDemoState = {};
  var aiCharts = {};

  function initIoMonitor() {
    var container = document.getElementById('io-monitor-content');
    if (!container) return;
    renderIoMonitor(container);
  }

  function getDevice() {
    var deviceId = typeof window.getCurrentDeviceId === 'function' ? window.getCurrentDeviceId() : null;
    if (!deviceId || deviceId === 'manual') return null;
    var device = getDeviceById(deviceId);
    if (!device || !device.ios) return null;
    return { device: device, id: deviceId };
  }

  function getDemoValue(item, isInput) {
    var key = 'reg_' + item.reg;
    if (isInput) {
      if (item.unit === 'V' && item.scale) return (Math.random() * 2.5 + 0.5).toFixed(2);
      return Math.random() > 0.6 ? 1 : 0;
    }
    if (ioDemoState[key] !== undefined) return ioDemoState[key];
    ioDemoState[key] = 0;
    return 0;
  }

  function renderIoMonitor(container) {
    var info = getDevice();

    if (!info) {
      var deviceId = typeof window.getCurrentDeviceId === 'function' ? window.getCurrentDeviceId() : null;
      if (!deviceId || deviceId === 'manual') {
        container.innerHTML =
          '<div class="flex flex-col items-center justify-center py-12 text-gray-400 text-sm">' +
            '<p>I/O izleme için lütfen Dashboard\'dan bir cihaz seçin.</p>' +
          '</div>';
      } else {
        container.innerHTML =
          '<div class="flex flex-col items-center justify-center py-12 text-gray-400 text-sm">' +
            '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-3 text-gray-300">' +
              '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>' +
            '</svg>' +
            '<p><strong>I/O destekli cihaz seçin.</strong></p>' +
            '<p class="mt-1 text-xs">Seçili cihazda dijital/analog giriş-çıkış tanımlı değil.</p>' +
          '</div>';
      }
      return;
    }

    var device = info.device;
    var ios = device.ios;
    var html = '';


    if (ios.digitalInputs && ios.digitalInputs.length) {
      html += '<div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm mb-3">';
      html += '<div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Dijital Girişler</div>';
      html += '<div class="flex flex-wrap gap-3">';
      ios.digitalInputs.forEach(function(di) {
        var val = getDemoValue(di, true);
        var on = val === 1 || val === '1';
        html += '<div class="flex items-center gap-2">';
        html += '<span class="text-sm text-gray-600">' + di.name + '</span>';
        html += '<span class="inline-block w-4 h-4 rounded-full border border-gray-300 ' + (on ? 'bg-green-500' : 'bg-gray-300') + '" title="' + (on ? 'ON' : 'OFF') + '"></span>';
        html += '</div>';
      });
      html += '</div></div>';
    }

    if (ios.relays && ios.relays.length) {
      html += '<div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm mb-3">';
      html += '<div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Röleler</div>';
      html += '<div class="flex flex-wrap gap-4">';
      ios.relays.forEach(function(r) {
        var key = 'reg_' + r.reg;
        var state = ioDemoState[key] !== undefined ? ioDemoState[key] : 0;
        html += '<div class="flex items-center gap-2">';
        html += '<span class="text-sm text-gray-600">' + r.name + '</span>';
        html += '<button type="button" class="io-toggle px-3 py-1 rounded-full text-xs font-medium border ' +
          (state === 1 ? 'bg-brand text-white border-brand' : 'bg-gray-100 text-gray-600 border-gray-300') +
          '" data-reg="' + r.reg + '" data-name="' + r.name + '">' + (state === 1 ? 'ON' : 'OFF') + '</button>';
        html += '</div>';
      });
      html += '</div></div>';
    }

    if (ios.digitalOutputs && ios.digitalOutputs.length) {
      html += '<div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm mb-3">';
      html += '<div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Dijital Çıkışlar</div>';
      html += '<div class="flex flex-wrap gap-4">';
      ios.digitalOutputs.forEach(function(do_) {
        var key = 'reg_' + do_.reg;
        var state = ioDemoState[key] !== undefined ? ioDemoState[key] : 0;
        html += '<div class="flex items-center gap-2">';
        html += '<span class="text-sm text-gray-600">' + do_.name + '</span>';
        html += '<button type="button" class="io-toggle px-3 py-1 rounded-full text-xs font-medium border ' +
          (state === 1 ? 'bg-brand text-white border-brand' : 'bg-gray-100 text-gray-600 border-gray-300') +
          '" data-reg="' + do_.reg + '" data-name="' + do_.name + '">' + (state === 1 ? 'ON' : 'OFF') + '</button>';
        html += '</div>';
      });
      html += '</div></div>';
    }

    if (ios.analogInputs && ios.analogInputs.length) {
      html += '<div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm mb-3">';
      html += '<div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Analog Girişler</div>';
      html += '<div class="grid gap-3">';
      ios.analogInputs.forEach(function(ai, idx) {
        var demoVal = (Math.random() * 2.5 + 0.5).toFixed(2);
        var scale = ai.scale || 1;
        var unit = ai.unit || '';
        html += '<div class="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">';
        html += '<span class="text-sm text-gray-600">' + ai.name + '</span>';
        html += '<span class="text-lg font-mono font-semibold text-gray-800" id="io-ai-val-' + idx + '">' + demoVal + ' ' + unit + '</span>';
        html += '</div>';
        html += '<div id="io-ai-gauge-' + idx + '" style="width:100%;height:60px;"></div>';
      });
      html += '</div></div>';
    }

    if (ios.analogOutputs && ios.analogOutputs.length) {
      html += '<div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm mb-3">';
      html += '<div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Analog Çıkış (DAC)</div>';
      ios.analogOutputs.forEach(function(ao, idx) {
        var key = 'reg_' + ao.reg;
        var raw = ioDemoState[key] !== undefined ? ioDemoState[key] : 0;
        var min = ao.min !== undefined ? ao.min : 0;
        var max = ao.max !== undefined ? ao.max : 255;
        var volt = 0;
        if (ao.formula) {
          try {
            volt = eval(ao.formula.replace('value', raw));
          } catch (e) { volt = 0; }
        } else {
          volt = (raw / 255 * 5).toFixed(2);
        }
        html += '<div class="flex items-center gap-3">';
        html += '<span class="text-sm text-gray-600 shrink-0">' + ao.name + '</span>';
        html += '<input type="range" min="' + min + '" max="' + max + '" value="' + raw + '" class="io-dac-slider flex-1 h-2 rounded-full appearance-none bg-gray-200" data-reg="' + ao.reg + '" data-formula="' + (ao.formula || '').replace(/"/g, '&quot;') + '" data-unit="' + (ao.unit || 'V') + '">';
        html += '<span class="io-dac-value text-sm font-mono font-semibold w-16 text-right" data-reg="' + ao.reg + '">' + Number(volt).toFixed(2) + ' ' + (ao.unit || 'V') + '</span>';
        html += '</div>';
      });
      html += '</div></div>';
    }

    container.innerHTML = html;

    container.querySelectorAll('.io-toggle').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var reg = parseInt(this.dataset.reg, 10);
        var key = 'reg_' + reg;
        ioDemoState[key] = ioDemoState[key] === 1 ? 0 : 1;
        this.textContent = ioDemoState[key] === 1 ? 'ON' : 'OFF';
        this.classList.toggle('bg-brand', ioDemoState[key] === 1);
        this.classList.toggle('text-white', ioDemoState[key] === 1);
        this.classList.toggle('border-brand', ioDemoState[key] === 1);
        this.classList.toggle('bg-gray-100', ioDemoState[key] !== 1);
        this.classList.toggle('text-gray-600', ioDemoState[key] !== 1);
        this.classList.toggle('border-gray-300', ioDemoState[key] !== 1);
      });
    });

    container.querySelectorAll('.io-dac-slider').forEach(function(slider) {
      slider.addEventListener('input', function() {
        var reg = parseInt(this.dataset.reg, 10);
        var raw = parseInt(this.value, 10);
        ioDemoState['reg_' + reg] = raw;
        var formula = (this.dataset.formula || '').replace(/&quot;/g, '"');
        var unit = this.dataset.unit || 'V';
        var volt = 0;
        if (formula) {
          try { volt = eval(formula.replace('value', raw)); } catch (e) { volt = raw / 255 * 5; }
        } else {
          volt = raw / 255 * 5;
        }
        var span = container.querySelector('.io-dac-value[data-reg="' + reg + '"]');
        if (span) span.textContent = Number(volt).toFixed(2) + ' ' + unit;
      });
    });

    if (ios.analogInputs && ios.analogInputs.length && typeof echarts !== 'undefined') {
      ios.analogInputs.forEach(function(ai, idx) {
        var dom = document.getElementById('io-ai-gauge-' + idx);
        if (!dom) return;
        if (aiCharts['ai' + idx]) aiCharts['ai' + idx].dispose();
        var ch = echarts.init(dom);
        aiCharts['ai' + idx] = ch;
        var v = (Math.random() * 2.5 + 0.5);
        ch.setOption({
          series: [{
            type: 'gauge',
            startAngle: 200,
            endAngle: -20,
            min: 0,
            max: 5,
            splitNumber: 5,
            itemStyle: { color: '#00a7e9' },
            progress: { show: true, width: 8 },
            axisLine: { lineStyle: { width: 8 } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            anchor: { show: false },
            title: { show: false },
            detail: { show: false },
            data: [{ value: v }]
          }]
        });
        var valEl = document.getElementById('io-ai-val-' + idx);
        if (valEl) valEl.textContent = v.toFixed(2) + ' ' + (ai.unit || '');
      });
    }
  }

  window.initIoMonitor = initIoMonitor;
  window.refreshIoMonitor = function() {
    var container = document.getElementById('io-monitor-content');
    if (container) renderIoMonitor(container);
  };

  document.addEventListener('DOMContentLoaded', function() {
    initIoMonitor();
  });
})();
