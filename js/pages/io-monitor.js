'use strict';

(function() {
  var ioDemoState = {};
  var aiCharts = {};
  var livePolling = false;

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

  function collectIoParams(ios) {
    var params = [];
    function addList(list) {
      if (!list) return;
      list.forEach(function(item) {
        params.push({
          reg: item.reg,
          len: item.len || 1,
          type: item.type || 'uint16',
          scale: item.scale || 1
        });
      });
    }
    addList(ios.digitalInputs);
    addList(ios.relays);
    addList(ios.digitalOutputs);
    addList(ios.analogInputs);
    addList(ios.analogOutputs);
    return params;
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

  function modeFlags() {
    return {
      useLive: !!(window.LiveModbus && window.LiveModbus.shouldUseLive()),
      useDemo: !!(window.LiveModbus && window.LiveModbus.shouldUseDemo()),
      canWrite: !!(window.LiveModbus && window.LiveModbus.canWriteDevice())
    };
  }

  function modeBadge() {
    if (window.LiveModbus && window.LiveModbus.getModeBadge) {
      return window.LiveModbus.getModeBadge();
    }
    return { label: '—', className: 'bg-gray-100 text-gray-500' };
  }

  function stopIoLive() {
    livePolling = false;
    if (window.LiveModbus) window.LiveModbus.stopLivePoll('io-monitor');
  }

  function startIoLive(device, ios) {
    if (!window.LiveModbus || !window.LiveModbus.shouldUseLive()) return;
    livePolling = true;
    window.LiveModbus.startLivePoll({
      owner: 'io-monitor',
      intervalMs: 1500,
      getDeviceDef: function() { return device; },
      getParams: function() { return collectIoParams(ios); },
      onValues: function(values) {
        applyIoValues(ios, values);
      },
      onError: function(e) {
        if (window.logMsg) window.logMsg('I/O canlı okuma: ' + (e.message || e));
      },
      onDisconnected: function() {
        livePolling = false;
      }
    });
  }

  function applyIoValues(ios, values) {
    if (ios.digitalInputs) {
      ios.digitalInputs.forEach(function(di) {
        var el = document.getElementById('io-di-' + di.reg);
        if (!el || values[di.reg] === undefined) return;
        var on = Number(values[di.reg]) === 1;
        el.className = 'inline-block w-4 h-4 rounded-full border border-gray-300 ' + (on ? 'bg-green-500' : 'bg-gray-300');
        el.title = on ? 'ON' : 'OFF';
      });
    }
    if (ios.relays) {
      ios.relays.forEach(function(r) {
        updateToggleBtn(r.reg, values[r.reg], true);
      });
    }
    if (ios.digitalOutputs) {
      ios.digitalOutputs.forEach(function(do_) {
        updateToggleBtn(do_.reg, values[do_.reg], true);
      });
    }
    if (ios.analogInputs) {
      ios.analogInputs.forEach(function(ai, idx) {
        if (values[ai.reg] === undefined) return;
        var v = values[ai.reg];
        var valEl = document.getElementById('io-ai-val-' + idx);
        if (valEl) valEl.textContent = Number(v).toFixed(2) + ' ' + (ai.unit || '');
        var ch = aiCharts['ai' + idx];
        if (ch) ch.setOption({ series: [{ data: [{ value: Number(v) }] }] });
      });
    }
    if (ios.analogOutputs) {
      ios.analogOutputs.forEach(function(ao) {
        if (values[ao.reg] === undefined) return;
        var raw = Math.round(values[ao.reg] / (ao.scale || 1));
        ioDemoState['reg_' + ao.reg] = raw;
        var slider = document.querySelector('.io-dac-slider[data-reg="' + ao.reg + '"]');
        if (slider) {
          slider.value = raw;
          slider.disabled = false;
        }
        updateDacLabel(ao, raw);
      });
    }
  }

  function updateToggleBtn(reg, value, enabled) {
    if (value === undefined) return;
    var state = Number(value) === 1 ? 1 : 0;
    ioDemoState['reg_' + reg] = state;
    var btn = document.querySelector('.io-toggle[data-reg="' + reg + '"]');
    if (!btn) return;
    btn.textContent = state === 1 ? 'ON' : 'OFF';
    btn.disabled = enabled === false;
    btn.classList.toggle('opacity-50', enabled === false);
    btn.classList.toggle('cursor-not-allowed', enabled === false);
    btn.classList.toggle('bg-brand', state === 1);
    btn.classList.toggle('text-white', state === 1);
    btn.classList.toggle('border-brand', state === 1);
    btn.classList.toggle('bg-gray-100', state !== 1);
    btn.classList.toggle('text-gray-600', state !== 1);
    btn.classList.toggle('border-gray-300', state !== 1);
  }

  function updateDacLabel(ao, raw) {
    var volt = 0;
    if (ao.formula) {
      try { volt = eval(ao.formula.replace('value', raw)); } catch (e) { volt = 0; }
    } else {
      volt = raw / 255 * 5;
    }
    var span = document.querySelector('.io-dac-value[data-reg="' + ao.reg + '"]');
    if (span) span.textContent = Number(volt).toFixed(2) + ' ' + (ao.unit || 'V');
  }

  function renderIoMonitor(container) {
    stopIoLive();
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
    var flags = modeFlags();
    var badge = modeBadge();
    var interactive = flags.useLive || flags.useDemo;
    var html = '';

    html += '<div class="flex justify-end mb-2"><span class="text-xs px-2 py-0.5 rounded-full ' +
      badge.className + '">' + badge.label + '</span></div>';

    if (ios.digitalInputs && ios.digitalInputs.length) {
      html += '<div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm mb-3">';
      html += '<div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Dijital Girişler</div>';
      html += '<div class="flex flex-wrap gap-3">';
      ios.digitalInputs.forEach(function(di) {
        var on = false;
        var title = '—';
        if (flags.useDemo) {
          var val = getDemoValue(di, true);
          on = val === 1 || val === '1';
          title = on ? 'ON' : 'OFF';
        } else if (flags.useLive) {
          title = 'Bekleniyor…';
        }
        html += '<div class="flex items-center gap-2">';
        html += '<span class="text-sm text-gray-600">' + di.name + '</span>';
        html += '<span id="io-di-' + di.reg + '" class="inline-block w-4 h-4 rounded-full border border-gray-300 ' +
          (on ? 'bg-green-500' : 'bg-gray-300') + '" title="' + title + '"></span>';
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
        var state = 0;
        if (flags.useDemo && ioDemoState[key] !== undefined) state = ioDemoState[key];
        else if (flags.useDemo) { ioDemoState[key] = 0; state = 0; }
        html += '<div class="flex items-center gap-2">';
        html += '<span class="text-sm text-gray-600">' + r.name + '</span>';
        html += '<button type="button" class="io-toggle px-3 py-1 rounded-full text-xs font-medium border ' +
          (state === 1 ? 'bg-brand text-white border-brand' : 'bg-gray-100 text-gray-600 border-gray-300') +
          (interactive ? '' : ' opacity-50 cursor-not-allowed') +
          '" data-reg="' + r.reg + '" data-name="' + r.name + '"' +
          (interactive ? '' : ' disabled') + '>' + (state === 1 ? 'ON' : 'OFF') + '</button>';
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
        var state = 0;
        if (flags.useDemo && ioDemoState[key] !== undefined) state = ioDemoState[key];
        else if (flags.useDemo) { ioDemoState[key] = 0; state = 0; }
        html += '<div class="flex items-center gap-2">';
        html += '<span class="text-sm text-gray-600">' + do_.name + '</span>';
        html += '<button type="button" class="io-toggle px-3 py-1 rounded-full text-xs font-medium border ' +
          (state === 1 ? 'bg-brand text-white border-brand' : 'bg-gray-100 text-gray-600 border-gray-300') +
          (interactive ? '' : ' opacity-50 cursor-not-allowed') +
          '" data-reg="' + do_.reg + '" data-name="' + do_.name + '"' +
          (interactive ? '' : ' disabled') + '>' + (state === 1 ? 'ON' : 'OFF') + '</button>';
        html += '</div>';
      });
      html += '</div></div>';
    }

    if (ios.analogInputs && ios.analogInputs.length) {
      html += '<div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm mb-3">';
      html += '<div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Analog Girişler</div>';
      html += '<div class="grid gap-3">';
      ios.analogInputs.forEach(function(ai, idx) {
        var unit = ai.unit || '';
        var display = '—';
        if (flags.useDemo) display = (Math.random() * 2.5 + 0.5).toFixed(2) + ' ' + unit;
        html += '<div class="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">';
        html += '<span class="text-sm text-gray-600">' + ai.name + '</span>';
        html += '<span class="text-lg font-mono font-semibold text-gray-800" id="io-ai-val-' + idx + '">' + display + '</span>';
        html += '</div>';
        html += '<div id="io-ai-gauge-' + idx + '" style="width:100%;height:60px;"></div>';
      });
      html += '</div></div>';
    }

    if (ios.analogOutputs && ios.analogOutputs.length) {
      html += '<div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm mb-3">';
      html += '<div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Analog Çıkış (DAC)</div>';
      ios.analogOutputs.forEach(function(ao) {
        var key = 'reg_' + ao.reg;
        var raw = 0;
        if (flags.useDemo) {
          raw = ioDemoState[key] !== undefined ? ioDemoState[key] : 0;
          ioDemoState[key] = raw;
        }
        var min = ao.min !== undefined ? ao.min : 0;
        var max = ao.max !== undefined ? ao.max : 255;
        var volt = 0;
        if (ao.formula) {
          try { volt = eval(ao.formula.replace('value', raw)); } catch (e) { volt = 0; }
        } else {
          volt = (raw / 255 * 5).toFixed(2);
        }
        html += '<div class="flex items-center gap-3">';
        html += '<span class="text-sm text-gray-600 shrink-0">' + ao.name + '</span>';
        html += '<input type="range" min="' + min + '" max="' + max + '" value="' + raw + '" class="io-dac-slider flex-1 h-2 rounded-full appearance-none bg-gray-200" data-reg="' + ao.reg + '" data-formula="' + (ao.formula || '').replace(/"/g, '&quot;') + '" data-unit="' + (ao.unit || 'V') + '"' +
          (interactive ? '' : ' disabled') + '>';
        html += '<span class="io-dac-value text-sm font-mono font-semibold w-16 text-right" data-reg="' + ao.reg + '">' +
          (flags.useDemo || flags.useLive ? (Number(volt).toFixed(2) + ' ' + (ao.unit || 'V')) : '—') + '</span>';
        html += '</div>';
      });
      html += '</div></div>';
    }

    if (!interactive) {
      html += '<p class="text-xs text-gray-400 text-center mt-2">Demo kapalı — BLE bağlanın veya Ayarlar’dan Demo Modu’nu açın.</p>';
    }

    container.innerHTML = html;

    container.querySelectorAll('.io-toggle').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        if (this.disabled) return;
        var reg = parseInt(this.dataset.reg, 10);
        var key = 'reg_' + reg;
        var next = ioDemoState[key] === 1 ? 0 : 1;
        var canWrite = window.LiveModbus && window.LiveModbus.canWriteDevice();
        if (canWrite) {
          try {
            await window.LiveModbus.writeRegisters(device, reg, [next]);
            ioDemoState[key] = next;
            updateToggleBtn(reg, next, true);
          } catch (e) {
            if (window.logMsg) window.logMsg('I/O yazma hatası: ' + (e.message || e));
          }
        } else if (window.LiveModbus && window.LiveModbus.shouldUseDemo()) {
          ioDemoState[key] = next;
          updateToggleBtn(reg, next, true);
        }
      });
    });

    container.querySelectorAll('.io-dac-slider').forEach(function(slider) {
      slider.addEventListener('change', async function() {
        if (this.disabled) return;
        var reg = parseInt(this.dataset.reg, 10);
        var raw = parseInt(this.value, 10);
        ioDemoState['reg_' + reg] = raw;
        var ao = (ios.analogOutputs || []).find(function(a) { return a.reg === reg; });
        if (ao) updateDacLabel(ao, raw);
        if (window.LiveModbus && window.LiveModbus.canWriteDevice()) {
          try {
            await window.LiveModbus.writeRegisters(device, reg, [raw & 0xffff]);
          } catch (e) {
            if (window.logMsg) window.logMsg('DAC yazma hatası: ' + (e.message || e));
          }
        }
      });
      slider.addEventListener('input', function() {
        if (this.disabled) return;
        var reg = parseInt(this.dataset.reg, 10);
        var raw = parseInt(this.value, 10);
        var ao = (ios.analogOutputs || []).find(function(a) { return a.reg === reg; });
        if (ao) updateDacLabel(ao, raw);
      });
    });

    if (ios.analogInputs && ios.analogInputs.length && typeof echarts !== 'undefined') {
      ios.analogInputs.forEach(function(ai, idx) {
        var dom = document.getElementById('io-ai-gauge-' + idx);
        if (!dom) return;
        if (aiCharts['ai' + idx]) aiCharts['ai' + idx].dispose();
        var ch = echarts.init(dom);
        aiCharts['ai' + idx] = ch;
        var v = flags.useDemo ? (Math.random() * 2.5 + 0.5) : 0;
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
        if (valEl && flags.useDemo) {
          valEl.textContent = v.toFixed(2) + ' ' + (ai.unit || '');
        }
      });
    }

    if (flags.useLive) startIoLive(device, ios);
  }

  window.initIoMonitor = initIoMonitor;
  window.refreshIoMonitor = function() {
    var container = document.getElementById('io-monitor-content');
    if (container) renderIoMonitor(container);
  };
  window.stopIoMonitorLive = stopIoLive;

  document.addEventListener('DOMContentLoaded', function() {
    initIoMonitor();
    if (window.LiveModbus && window.LiveModbus.addDemoModeListener) {
      window.LiveModbus.addDemoModeListener(function() {
        if (typeof window.refreshIoMonitor === 'function') window.refreshIoMonitor();
      });
    }
    if (window.LiveModbus && window.LiveModbus.addConnectionListener) {
      window.LiveModbus.addConnectionListener(function() {
        if (typeof window.getCurrentPageId === 'function' && window.getCurrentPageId() === 'io-monitor') {
          if (typeof window.refreshIoMonitor === 'function') window.refreshIoMonitor();
        }
      });
    }
  });
})();
