'use strict';

(function() {
  function initDeviceSettings() {
    var container = document.getElementById('device-settings-content');
    if (!container) return;
    renderDeviceSettings(container);
  }

  function getDevice() {
    var deviceId = typeof window.getCurrentDeviceId === 'function' ? window.getCurrentDeviceId() : null;
    if (!deviceId || deviceId === 'manual') return null;
    var device = getDeviceById(deviceId);
    if (!device || !device.settings) return null;
    return { device: device, id: deviceId };
  }

  /** Adım: scale / precision / tip. */
  function getParamStep(param) {
    if (param.scale != null && param.scale > 0 && param.scale < 1) return param.scale;
    if (param.precision != null && param.precision > 0) return Math.pow(10, -param.precision);
    return 1;
  }

  function formatParamRangeHint(param) {
    if (param.options) return 'Listeden seçin';
    var parts = [];
    if (param.min !== undefined && param.max !== undefined) parts.push(param.min + '–' + param.max);
    else if (param.min !== undefined) parts.push('≥ ' + param.min);
    else if (param.max !== undefined) parts.push('≤ ' + param.max);
    var step = getParamStep(param);
    if (step < 1) parts.push('adım ' + step);
    return parts.join(' · ');
  }

  /**
   * Registry min/max/options’a göre görünen değeri doğrula.
   * @returns {{ ok:boolean, message?:string, value?:number }}
   */
  function validateParamValue(param, rawStr) {
    var label = param.name || 'Değer';
    if (param.options) {
      if (rawStr === '' || rawStr == null) {
        return { ok: false, message: label + ': değer seçin' };
      }
      var key = String(rawStr);
      if (param.options[key] === undefined) {
        return { ok: false, message: label + ': geçersiz seçim' };
      }
      return { ok: true, value: parseInt(key, 10) };
    }

    var s = String(rawStr == null ? '' : rawStr).trim().replace(',', '.');
    if (s === '' || s === '—') {
      return { ok: false, message: label + ': değer girin' };
    }
    var num = Number(s);
    if (!isFinite(num)) {
      return { ok: false, message: label + ': sayısal değer gerekli' };
    }

    var step = getParamStep(param);
    if (step >= 1 && Math.abs(num - Math.round(num)) > 1e-9) {
      return { ok: false, message: label + ': tam sayı olmalı' };
    }
    if (param.min !== undefined && num < param.min) {
      return { ok: false, message: label + ': en az ' + param.min };
    }
    if (param.max !== undefined && num > param.max) {
      return { ok: false, message: label + ': en fazla ' + param.max };
    }
    return { ok: true, value: num };
  }

  function setFieldValidity(el, ok) {
    if (!el) return;
    if (ok) {
      el.classList.remove('ds-invalid');
      el.removeAttribute('aria-invalid');
    } else {
      el.classList.add('ds-invalid');
      el.setAttribute('aria-invalid', 'true');
    }
  }

  function bindParamValidation(param) {
    var el = document.getElementById('ds_' + param.reg.toString(16));
    if (!el) return;
    if (param.options) {
      el.addEventListener('change', function() {
        var r = validateParamValue(param, el.value);
        setFieldValidity(el, r.ok || el.value === '');
      });
      return;
    }
    function check(strictEmpty) {
      var v = el.value.trim();
      if (!strictEmpty && v === '') {
        setFieldValidity(el, true);
        return;
      }
      var r = validateParamValue(param, el.value);
      setFieldValidity(el, r.ok);
    }
    el.addEventListener('input', function() { check(false); });
    el.addEventListener('change', function() { check(true); });
    el.addEventListener('blur', function() { check(true); });
  }

  function renderDeviceSettings(container) {
    var info = getDevice();

    if (!info) {
      container.innerHTML = typeof emptyStateHtml === 'function'
        ? emptyStateHtml({
            icon: 'config',
            title: 'Konfig destekli cihaz seçin',
            desc: 'Cihaz ayarları yalnızca settings tanımlı modellerde kullanılabilir.',
            actions: [
              { action: 'focus-device', label: 'Model seç', primary: true },
              { action: 'dashboard', label: 'Analizör’e dön' }
            ]
          })
        : '<p class="text-sm text-gray-400 text-center py-12">Ayar destekli cihaz seçin.</p>';
      if (typeof bindEmptyStateActions === 'function') bindEmptyStateActions(container);
      return;
    }

    var device = info.device;
    var html = '';
    var useDemo = window.LiveModbus && window.LiveModbus.shouldUseDemo();
    var badge = (window.LiveModbus && window.LiveModbus.getModeBadge)
      ? window.LiveModbus.getModeBadge()
      : { label: '—', className: 'bg-gray-100 text-gray-500' };

    html += '<div class="flex items-center justify-between mb-3 gap-2 min-w-0">';
    html += '<div class="text-sm text-gray-500 min-w-0 truncate">' + device.name + ' — Cihaz Konfigürasyonu</div>';
    html += '<div class="flex items-center gap-1.5 shrink-0">';
    html += '<button type="button" id="ds-read-all" title="Tümünü Oku" aria-label="Tümünü Oku" class="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 bg-white text-ink cursor-pointer hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-colors">';
    html += '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10a6 6 0 0110.4-4.1M16 4v4h-4"/><path d="M16 10a6 6 0 01-10.4 4.1M4 16v-4h4"/></svg>';
    html += '</button>';
    html += '<span class="text-xs px-2 py-0.5 rounded-full ' + badge.className + '">' + badge.label + '</span>';
    html += '</div></div>';

    device.settings.forEach(function(group, gi) {
      html += '<div class="surface-card p-3 mb-3">';
      html += '<div class="section-label mb-3">' + group.title + '</div>';

      group.params.forEach(function(param) {
        var inputId = 'ds_' + param.reg.toString(16);
        var rangeHint = formatParamRangeHint(param);
        var writable = param.writable !== false;
        html += '<div class="ds-field-row">';
        html += '<label class="ds-field-label" for="' + inputId + '">';
        html += '<span class="block truncate">' + param.name + '</span>';
        if (rangeHint) html += '<span class="block text-[10px] text-ink-faint font-normal mt-0.5">' + rangeHint + '</span>';
        html += '</label>';

        if (param.options) {
          html += '<select id="' + inputId + '" class="ds-field"';
          html += ' title="' + (rangeHint || '').replace(/"/g, '&quot;') + '"';
          if (!writable) html += ' disabled';
          html += '>';
          var keys = Object.keys(param.options);
          keys.forEach(function(key, ki) {
            var selected = (useDemo && ki === 0) ? ' selected' : '';
            html += '<option value="' + key + '"' + selected + '>' + param.options[key] + '</option>';
          });
          if (!useDemo) {
            html += '<option value="" selected disabled>— Oku —</option>';
          }
          html += '</select>';
        } else {
          var demoVal = useDemo ? (param.min != null ? param.min : 0) : '';
          var step = getParamStep(param);
          html += '<input type="number" id="' + inputId + '" class="ds-field" value="' + demoVal + '" placeholder="—"';
          html += ' inputmode="decimal"';
          if (param.min !== undefined) html += ' min="' + param.min + '"';
          if (param.max !== undefined) html += ' max="' + param.max + '"';
          html += ' step="' + step + '"';
          html += ' title="' + (rangeHint || '').replace(/"/g, '&quot;') + '"';
          if (!writable) html += ' readonly disabled';
          html += '>';
        }

        html += '</div>';
      });

      html += '<div class="flex gap-2 mt-3">';
      html += '<button type="button" class="ds-read flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full border border-gray-300 bg-white text-ink font-semibold text-xs cursor-pointer hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-colors" data-group="' + gi + '">Oku</button>';
      html += '<button type="button" class="ds-write flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full border border-brand/30 bg-brand text-white font-semibold text-xs cursor-pointer hover:bg-brand-dark shadow-sm transition-colors" data-group="' + gi + '">Yaz</button>';
      html += '</div>';

      html += '</div>';
    });

    if (device.commands && device.commands.length) {
      html += '<div class="surface-card p-3 mb-3">';
      html += '<div class="section-label mb-3">Komutlar</div>';
      html += '<p class="text-xs text-gray-500 mb-3">Sıfırlama ve tek seferlik yazma komutları. Onay gerektiren işlemlerde önce onay istenir.</p>';
      html += '<div class="flex flex-wrap gap-2">';
      device.commands.forEach(function(cmd, ci) {
        html += '<button type="button" class="ds-cmd px-3 py-1.5 rounded-full text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors" ' +
          'data-idx="' + ci + '" data-name="' + (cmd.name || '').replace(/"/g, '&quot;') + '" data-confirm="' + (cmd.confirm ? '1' : '0') + '">' + (cmd.name || 'Komut') + '</button>';
      });
      html += '</div></div>';
    }

    container.innerHTML = html;

    device.settings.forEach(function(group) {
      group.params.forEach(function(param) {
        bindParamValidation(param);
      });
    });

    if (device.commands && device.commands.length) {
      container.querySelectorAll('.ds-cmd').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(this.dataset.idx, 10);
          var cmd = device.commands[idx];
          var name = (this.dataset.name || '').replace(/&quot;/g, '"');
          var needConfirm = this.dataset.confirm === '1';
          var self = this;
          function runCommand() {
            runLiveCommand(device, cmd, self);
          }
          if (needConfirm && typeof window.confirm === 'function') {
            if (window.confirm(name + ' komutunu göndermek istediğinize emin misiniz?')) runCommand();
          } else {
            runCommand();
          }
        });
      });
    }

    container.querySelectorAll('.ds-read').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var gi = parseInt(this.dataset.group, 10);
        liveReadGroup(device, device.settings[gi], this);
      });
    });

    container.querySelectorAll('.ds-write').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var gi = parseInt(this.dataset.group, 10);
        liveWriteGroup(device, device.settings[gi], this);
      });
    });

    var readAllBtn = document.getElementById('ds-read-all');
    if (readAllBtn) {
      readAllBtn.addEventListener('click', function() {
        liveReadAllSettings(device, this);
      });
    }
  }

  function flashEl(el, color) {
    if (!el) return;
    el.classList.remove('field-busy');
    el.style.transition = 'background-color 0.3s';
    el.style.backgroundColor = color;
    setTimeout(function() { el.style.backgroundColor = ''; }, 800);
  }

  function setSettingsFieldsBusy(params, busy) {
    (params || []).forEach(function(param) {
      var el = document.getElementById('ds_' + param.reg.toString(16));
      if (!el) return;
      if (busy) el.classList.add('field-busy');
      else {
        el.classList.remove('field-busy');
        el.style.backgroundColor = '';
      }
    });
  }

  function applySettingsValues(params, values) {
    (params || []).forEach(function(param) {
      var inputId = 'ds_' + param.reg.toString(16);
      var el = document.getElementById(inputId);
      if (!el || values[param.reg] === undefined) return;
      var val = values[param.reg];
      if (param.options) {
        el.value = String(Math.round(val / (param.scale || 1)));
      } else if (param.scale && param.scale !== 1) {
        el.value = Number(val).toFixed(param.precision != null ? param.precision : 2);
      } else {
        el.value = Math.round(val);
      }
      setFieldValidity(el, true);
      flashEl(el, '#d1fae5');
    });
  }

  function collectAllSettingsParams(device) {
    var params = [];
    (device.settings || []).forEach(function(group) {
      (group.params || []).forEach(function(p) { params.push(p); });
    });
    return params;
  }

  async function liveReadGroup(device, group, btn) {
    if (!window.LiveModbus || !window.LiveModbus.isBleConnected()) {
      showToast('Canlı okuma için BLE bağlantısı gerekli');
      return;
    }
    if (btn) btn.disabled = true;
    setSettingsFieldsBusy(group.params, true);
    try {
      var reader = window.LiveModbus.readParamsOneShot || window.LiveModbus.readParams;
      var values = await reader.call(window.LiveModbus, device, group.params);
      setSettingsFieldsBusy(group.params, false);
      applySettingsValues(group.params, values);
      showToast('Okuma başarılı');
    } catch (e) {
      setSettingsFieldsBusy(group.params, false);
      showToast('Okuma hatası: ' + (e.message || e));
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function liveReadAllSettings(device, btn) {
    if (!window.LiveModbus || !window.LiveModbus.isBleConnected()) {
      showToast('Canlı okuma için BLE bağlantısı gerekli');
      return;
    }
    if (btn) btn.disabled = true;
    var params = collectAllSettingsParams(device);
    setSettingsFieldsBusy(params, true);
    try {
      if (!params.length) throw new Error('Okunacak ayar yok');
      var reader = window.LiveModbus.readParamsOneShot || window.LiveModbus.readParams;
      var values = await reader.call(window.LiveModbus, device, params);
      setSettingsFieldsBusy(params, false);
      applySettingsValues(params, values);
      showToast('Tüm ayarlar okundu');
    } catch (e) {
      setSettingsFieldsBusy(params, false);
      showToast('Okuma hatası: ' + (e.message || e));
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function liveWriteGroup(device, group, btn) {
    if (!window.LiveModbus || !window.LiveModbus.isBleConnected()) {
      showToast('Canlı yazma için BLE bağlantısı gerekli');
      return;
    }
    if (btn) btn.disabled = true;
    try {
      var items = [];
      var flashEls = [];
      for (var i = 0; i < group.params.length; i++) {
        var param = group.params[i];
        if (!param.writable && param.writable !== undefined) continue;
        var inputId = 'ds_' + param.reg.toString(16);
        var el = document.getElementById(inputId);
        if (!el) continue;
        var check = validateParamValue(param, el.value);
        if (!check.ok) {
          setFieldValidity(el, false);
          try { el.focus(); } catch (fe) { /* ignore */ }
          throw new Error(check.message);
        }
        setFieldValidity(el, true);
        var raw = window.LiveModbus.encodeParamRaw(param, el.value);
        if (raw === null) throw new Error('Geçersiz değer: ' + param.name);
        items.push({ reg: param.reg, value: raw });
        flashEls.push(el);
      }
      if (!items.length) throw new Error('Yazılacak parametre yok');
      setSettingsFieldsBusy(group.params, true);
      await window.LiveModbus.writeParamsBulk(device, items);
      setSettingsFieldsBusy(group.params, false);
      flashEls.forEach(function(el) { flashEl(el, '#bfdbfe'); });
      showToast('Yazma başarılı');
    } catch (e) {
      setSettingsFieldsBusy(group.params, false);
      showToast('Yazma hatası: ' + (e.message || e));
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function runLiveCommand(device, cmd, btn) {
    if (!window.LiveModbus || !window.LiveModbus.isBleConnected()) {
      showToast('Komut için BLE bağlantısı gerekli');
      return;
    }
    try {
      var val = cmd.writeValue != null ? cmd.writeValue : 1;
      await window.LiveModbus.writeRegisters(device, cmd.reg, [val & 0xffff]);
      showToast((cmd.name || 'Komut') + ' gönderildi');
      if (btn) {
        btn.style.backgroundColor = '#d1fae5';
        setTimeout(function() { btn.style.backgroundColor = ''; }, 600);
      }
    } catch (e) {
      showToast('Komut hatası: ' + (e.message || e));
    }
  }

  function showToast(message) {
    var existing = document.getElementById('ds-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'ds-toast';
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm shadow-lg z-[100] animate-fade';
    toast.textContent = message;
    toast.style.animation = 'none';
    document.body.appendChild(toast);
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2500);
  }

  window.initDeviceSettings = initDeviceSettings;
  window.refreshDeviceSettings = function() {
    var container = document.getElementById('device-settings-content');
    if (container) renderDeviceSettings(container);
  };

  document.addEventListener('DOMContentLoaded', function() {
    initDeviceSettings();
    if (window.LiveModbus && window.LiveModbus.addDemoModeListener) {
      window.LiveModbus.addDemoModeListener(function() {
        if (typeof window.getCurrentPageId === 'function' && window.getCurrentPageId() === 'device-settings') {
          window.refreshDeviceSettings();
        }
      });
    }
    if (window.LiveModbus && window.LiveModbus.addConnectionListener) {
      window.LiveModbus.addConnectionListener(function() {
        if (typeof window.getCurrentPageId === 'function' && window.getCurrentPageId() === 'device-settings') {
          window.refreshDeviceSettings();
        }
      });
    }
  });
})();
