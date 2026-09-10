'use strict';

(function() {
  var ioDemoState = {};
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

  function getAiRange(ai) {
    var min = ai.min != null ? Number(ai.min) : 0;
    var max = ai.max != null ? Number(ai.max) : 5;
    if (!(max > min)) { min = 0; max = 5; }
    return { min: min, max: max };
  }

  function updateAiBar(idx, value, ai) {
    var bar = document.getElementById('io-ai-bar-' + idx);
    if (!bar) return;
    var range = getAiRange(ai || {});
    var pct = ((Number(value) - range.min) / (range.max - range.min)) * 100;
    if (!isFinite(pct)) pct = 0;
    pct = Math.max(0, Math.min(100, pct));
    bar.style.width = pct.toFixed(1) + '%';
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
        el.className = 'inline-block w-4 h-4 rounded-full border border-gray-300 ' + (on ? 'bg-ok' : 'bg-gray-300');
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
        updateAiBar(idx, v, ai);
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
    var label = state === 1 ? 'Açık' : 'Kapalı';
    var name = btn.getAttribute('data-name') || '';
    btn.setAttribute('aria-checked', state === 1 ? 'true' : 'false');
    btn.setAttribute('aria-label', name ? (name + ': ' + label) : label);
    btn.title = label;
    btn.disabled = enabled === false;
  }

  function renderSwitchHtml(reg, name, state, interactive) {
    var label = state === 1 ? 'Açık' : 'Kapalı';
    return '<button type="button" role="switch" aria-checked="' + (state === 1 ? 'true' : 'false') + '"' +
      ' aria-label="' + name + ': ' + label + '" title="' + label + '"' +
      ' class="io-toggle shrink-0" data-reg="' + reg + '" data-name="' + name + '"' +
      (interactive ? '' : ' disabled') + '>' +
      '<span class="io-toggle-thumb" aria-hidden="true"></span></button>';
  }

  function renderToggleRow(reg, name, state, interactive) {
    return '<div class="flex items-center justify-between gap-2 min-w-0">' +
      '<span class="text-sm text-gray-600 truncate">' + name + '</span>' +
      renderSwitchHtml(reg, name, state, interactive) +
      '</div>';
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
      html += '<div class="surface-card p-3 mb-3">';
      html += '<div class="section-label mb-3">Dijital Girişler</div>';
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
          (on ? 'bg-ok' : 'bg-gray-300') + '" title="' + title + '"></span>';
        html += '</div>';
      });
      html += '</div></div>';
    }

    if (ios.relays && ios.relays.length) {
      html += '<div class="surface-card p-3 mb-3">';
      html += '<div class="section-label mb-3">Röleler</div>';
      html += '<div class="grid grid-cols-2 gap-3">';
      ios.relays.forEach(function(r) {
        var key = 'reg_' + r.reg;
        var state = 0;
        if (flags.useDemo && ioDemoState[key] !== undefined) state = ioDemoState[key];
        else if (flags.useDemo) { ioDemoState[key] = 0; state = 0; }
        html += renderToggleRow(r.reg, r.name, state, interactive);
      });
      html += '</div></div>';
    }

    if (ios.digitalOutputs && ios.digitalOutputs.length) {
      html += '<div class="surface-card p-3 mb-3">';
      html += '<div class="section-label mb-3">Dijital Çıkışlar</div>';
      html += '<div class="grid grid-cols-2 gap-3">';
      ios.digitalOutputs.forEach(function(do_) {
        var key = 'reg_' + do_.reg;
        var state = 0;
        if (flags.useDemo && ioDemoState[key] !== undefined) state = ioDemoState[key];
        else if (flags.useDemo) { ioDemoState[key] = 0; state = 0; }
        html += renderToggleRow(do_.reg, do_.name, state, interactive);
      });
      html += '</div></div>';
    }

    if (ios.analogInputs && ios.analogInputs.length) {
      html += '<div class="surface-card p-3 mb-3">';
      html += '<div class="section-label mb-3">Analog Girişler</div>';
      html += '<div class="grid gap-3">';
      ios.analogInputs.forEach(function(ai, idx) {
        var unit = ai.unit || '';
        var range = getAiRange(ai);
        var display = '—';
        var v = null;
        if (flags.useDemo) {
          v = Math.random() * 2.5 + 0.5;
          display = v.toFixed(2) + ' ' + unit;
        }
        var pct = v != null
          ? Math.max(0, Math.min(100, ((v - range.min) / (range.max - range.min)) * 100))
          : 0;
        html += '<div class="border-b border-gray-100 pb-3 last:border-0 last:pb-0">';
        html += '<div class="flex items-center justify-between mb-1.5">';
        html += '<span class="text-sm text-gray-600">' + ai.name + '</span>';
        html += '<span class="param-value text-lg" id="io-ai-val-' + idx + '">' + display + '</span>';
        html += '</div>';
        html += '<div class="h-2 rounded-full bg-gray-200 overflow-hidden">';
        html += '<div id="io-ai-bar-' + idx + '" class="h-full rounded-full bg-brand transition-all duration-300" style="width:' + pct.toFixed(1) + '%"></div>';
        html += '</div>';
        html += '<div class="flex justify-between mt-0.5 text-[10px] text-gray-400">';
        html += '<span>' + range.min + (unit ? ' ' + unit : '') + '</span>';
        html += '<span>' + range.max + (unit ? ' ' + unit : '') + '</span>';
        html += '</div>';
        html += '</div>';
      });
      html += '</div></div>';
    }

    if (ios.analogOutputs && ios.analogOutputs.length) {
      html += '<div class="surface-card p-3 mb-3">';
      html += '<div class="section-label mb-3">Analog Çıkış (DAC)</div>';
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
        var prev = ioDemoState[key] === 1 ? 1 : 0;
        var next = prev === 1 ? 0 : 1;
        var canWrite = window.LiveModbus && window.LiveModbus.canWriteDevice();
        updateToggleBtn(reg, next, true);
        if (canWrite) {
          this.disabled = true;
          try {
            await window.LiveModbus.writeRegisters(device, reg, [next]);
            ioDemoState[key] = next;
          } catch (e) {
            updateToggleBtn(reg, prev, true);
            if (window.logMsg) window.logMsg('I/O yazma hatası: ' + (e.message || e));
          } finally {
            this.disabled = false;
          }
        } else if (window.LiveModbus && window.LiveModbus.shouldUseDemo()) {
          ioDemoState[key] = next;
        } else {
          updateToggleBtn(reg, prev, true);
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
        ioDemoState['reg_' + reg] = raw;
        if (window.LiveModbus && window.LiveModbus.holdRegister) {
          window.LiveModbus.holdRegister(reg, raw, 3000);
        }
        var ao = (ios.analogOutputs || []).find(function(a) { return a.reg === reg; });
        if (ao) updateDacLabel(ao, raw);
      });
    });

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
