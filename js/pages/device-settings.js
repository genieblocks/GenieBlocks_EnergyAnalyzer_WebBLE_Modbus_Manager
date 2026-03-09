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

  function renderDeviceSettings(container) {
    var info = getDevice();

    if (!info) {
      container.innerHTML =
        '<div class="flex flex-col items-center justify-center py-12 text-gray-400 text-sm">' +
          '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-3 text-gray-300"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4"/></svg>' +
          '<p>Cihaz ayarları için lütfen Dashboard\'dan<br><strong>ayar destekli bir cihaz</strong> seçin.</p>' +
        '</div>';
      return;
    }

    var device = info.device;
    var html = '';

    html += '<div class="demo-banner flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-sm text-amber-700">';
    html += '<span class="text-lg">&#9888;</span>';
    html += '<span><strong>DEMO MOD</strong> — Ayar değerleri simülasyondur. Gerçek cihaza BLE ile bağlanınca okuma/yazma yapılabilir.</span>';
    html += '</div>';

    html += '<div class="text-sm text-gray-500 mb-3">' + device.name + ' — Cihaz Konfigürasyonu</div>';

    device.settings.forEach(function(group, gi) {
      html += '<div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm mb-3">';
      html += '<div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">' + group.title + '</div>';

      group.params.forEach(function(param) {
        var inputId = 'ds_' + param.reg.toString(16);
        html += '<div class="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-b-0 gap-2">';
        html += '<label class="text-xs text-gray-600 shrink-0" for="' + inputId + '">' + param.name + '</label>';

        if (param.options) {
          html += '<select id="' + inputId + '" class="px-2 py-1 border border-gray-300 rounded text-sm bg-white min-w-[120px] text-right">';
          var keys = Object.keys(param.options);
          keys.forEach(function(key) {
            var demoSelected = (keys.indexOf(key) === 0) ? ' selected' : '';
            html += '<option value="' + key + '"' + demoSelected + '>' + param.options[key] + '</option>';
          });
          html += '</select>';
        } else {
          var demoVal = param.min || 0;
          html += '<input type="number" id="' + inputId + '" value="' + demoVal + '"';
          if (param.min !== undefined) html += ' min="' + param.min + '"';
          if (param.max !== undefined) html += ' max="' + param.max + '"';
          html += ' class="px-2 py-1 border border-gray-300 rounded text-sm w-24 text-right">';
        }

        html += '</div>';
      });

      html += '<div class="flex gap-2 mt-3">';
      html += '<button class="ds-read flex-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-medium text-xs border-none cursor-pointer hover:bg-gray-200 transition-colors" data-group="' + gi + '">Oku</button>';
      html += '<button class="ds-write flex-1 px-3 py-1.5 rounded-full bg-brand text-white font-medium text-xs border-none cursor-pointer hover:bg-brand-dark transition-colors" data-group="' + gi + '">Yaz</button>';
      html += '</div>';

      html += '</div>';
    });

    container.innerHTML = html;

    container.querySelectorAll('.ds-read').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var gi = parseInt(this.dataset.group, 10);
        simulateRead(device.settings[gi]);
      });
    });

    container.querySelectorAll('.ds-write').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var gi = parseInt(this.dataset.group, 10);
        simulateWrite(device.settings[gi]);
      });
    });
  }

  function simulateRead(group) {
    group.params.forEach(function(param) {
      var inputId = 'ds_' + param.reg.toString(16);
      var el = document.getElementById(inputId);
      if (!el) return;

      if (param.options) {
        var keys = Object.keys(param.options);
        var randKey = keys[Math.floor(Math.random() * keys.length)];
        el.value = randKey;
      } else {
        var min = param.min || 0;
        var max = param.max || 100;
        el.value = Math.floor(min + Math.random() * (max - min));
      }

      el.style.transition = 'background-color 0.3s';
      el.style.backgroundColor = '#d1fae5';
      setTimeout(function() { el.style.backgroundColor = ''; }, 800);
    });
  }

  function simulateWrite(group) {
    group.params.forEach(function(param) {
      var inputId = 'ds_' + param.reg.toString(16);
      var el = document.getElementById(inputId);
      if (!el) return;

      el.style.transition = 'background-color 0.3s';
      el.style.backgroundColor = '#bfdbfe';
      setTimeout(function() { el.style.backgroundColor = ''; }, 800);
    });
  }

  window.initDeviceSettings = initDeviceSettings;
  window.refreshDeviceSettings = function() {
    var container = document.getElementById('device-settings-content');
    if (container) renderDeviceSettings(container);
  };

  document.addEventListener('DOMContentLoaded', function() {
    initDeviceSettings();
  });
})();
