// let the editor know that `Chart` is defined by some code
// included in another file (in this case, `index.html`)
// Note: the code will still work without this line, but without it you
// will see an error in the editor
/* global Chart */
/* global Graph */
/* global numeral */
/* global colorjoe */

'use strict';

let device;

const bufferSize = 64;
const colors = ['#0096D6', '#f89521', '#be1e2d'];
const measurementPeriodId = '0001';

const maxLogLength = 500;
const log = document.getElementById('log');
const butConnect = document.getElementById('butConnect');
const butClear = document.getElementById('butClear');
const autoscroll = document.getElementById('autoscroll');
const showTimestamp = document.getElementById('showTimestamp');
const lightSS = document.getElementById('light');
const darkSS = document.getElementById('dark');
const dashboard = document.getElementById('dashboard');
const fpsCounter = document.getElementById("fpsCounter");
const knownOnly = document.getElementById("knownonly");

let colorIndex = 0;
let activePanels = [];
let bytesReceived = 0;
let currentBoard;
let buttonState = 0;

const boards = {
  GB_LoRa: {
    colorOrder: 'GRB',
    neopixels: 0,
    hasSwitch: false,
    buttons: 1,
  }
}

let panels = {
  device_eui: {
    title: 'Device EUI',
    serviceId: 'lora_service',
    characteristicId: 'device_eui',
    panelType: 'custom',
    properties: ['read', 'write'],
  },
  app_eui: {
    title: 'APP EUI',
    serviceId: 'lora_service',
    characteristicId: 'app_eui',
    panelType: 'custom',
    properties: ['read', 'write'],
  },
  app_key: {
    title: 'APP Key',
    serviceId: 'lora_service',
    characteristicId: 'app_key',
    panelType: 'custom',
    properties: ['read', 'write'],
  }
};

function playSound(frequency, duration, callback) {
  if (callback === undefined) {
    callback = function() {};
  }

  let value = encodePacket('tone', [frequency, duration]);
  panels.tone.characteristic.writeValue(value)
    .catch(error => {console.log(error);})
    .then(callback);
}

function encodePacket(panelId, values) {
  const typeMap = {
    "Uint8":    {fn: DataView.prototype.setUint8,    bytes: 1},
    "Uint16":   {fn: DataView.prototype.setUint16,   bytes: 2},
    "Uint32":   {fn: DataView.prototype.setUint32,   bytes: 4},
    "Int32":    {fn: DataView.prototype.setInt32,    bytes: 4},
    "Float32":  {fn: DataView.prototype.setFloat32,  bytes: 4},
  };

  if (values.length != panels[panelId].packetSequence.length) {
    logMsg("Error in encodePacket(): Number of arguments must match structure");
    return false;
  }

  let bufferSize = 0, packetPointer = 0;
  panels[panelId].packetSequence.forEach(function(dataType) {
    bufferSize += typeMap[dataType].bytes;
  });

  let view = new DataView(new ArrayBuffer(bufferSize));

  for (var i = 0; i < values.length; i++) {
    let dataType = panels[panelId].packetSequence[i];
    let dataViewFn = typeMap[dataType].fn.bind(view);
    dataViewFn(packetPointer, values[i], true);
    packetPointer += typeMap[dataType].bytes;
  }

  return view.buffer;
}

// LoRaWAN yeni UUID'ler
const LORAWAN_SERVICE_UUID = '0000a100-0000-1000-8000-00805f9b34fb';
const DEVEUI_CHAR_UUID = '0000a201-0000-1000-8000-00805f9b34fb';
const APPEUI_CHAR_UUID = '0000a202-0000-1000-8000-00805f9b34fb';
const APPKEY_CHAR_UUID = '0000a203-0000-1000-8000-00805f9b34fb';

// Commit (System) yeni UUID'ler
const SYSTEM_SERVICE_UUID = '0000a200-0000-1000-8000-00805f9b34fb';
const COMMIT_CHAR_UUID = '0000a210-0000-1000-8000-00805f9b34fb';

// Device Info (GATT 0x180A) — include/ble_services_characteristics_table.csv
const DEVICE_INFO_SERVICE_UUID = '0000180a-0000-1000-8000-00805f9b34fb';
const DI_MODEL_UUID = '0000a102-0000-1000-8000-00805f9b34fb';
const DI_EUI_UUID = '0000a109-0000-1000-8000-00805f9b34fb';
const DI_SW_UUID = '0000a10a-0000-1000-8000-00805f9b34fb';
const DI_HW_UUID = '0000a10b-0000-1000-8000-00805f9b34fb';
const DI_LORAWAN_UUID = '0000a10c-0000-1000-8000-00805f9b34fb';
const DI_WORKMODE_UUID = '0000a10d-0000-1000-8000-00805f9b34fb';
const DI_GEOLOC_UUID = '0000a10e-0000-1000-8000-00805f9b34fb';
const DI_CLASS_UUID = '0000a10f-0000-1000-8000-00805f9b34fb';
const DI_BATTERY_UUID = '0000a110-0000-1000-8000-00805f9b34fb';

// Yeni read-only karakteristik UUID'ler
const PLATFORM_CHAR_UUID = '0000a204-0000-1000-8000-00805f9b34fb';
const FREQ_CHAR_UUID = '0000a205-0000-1000-8000-00805f9b34fb';
const PCKPO_CHAR_UUID = '0000a206-0000-1000-8000-00805f9b34fb';
const ADR_CHAR_UUID = '0000a207-0000-1000-8000-00805f9b34fb';

/** LoRaWAN Ayarlar sekmesi UI SSOT — default kapalı; localStorage. */
const LORAWAN_UI_STORAGE_KEY = 'gb_lorawan_ui_enabled';
/** Bu BLE oturumunda optionalServices’e LoRaWAN eklendi mi (GATT erişimi için). */
let lorawanGattSessionActive = false;

function isLorawanUiEnabled() {
  try {
    return localStorage.getItem(LORAWAN_UI_STORAGE_KEY) === '1';
  } catch (e) {
    return false;
  }
}

function setLorawanUiEnabled(on) {
  try {
    localStorage.setItem(LORAWAN_UI_STORAGE_KEY, on ? '1' : '0');
  } catch (e) { /* ignore */ }
}

function setLorawanUiHintVisible(show) {
  const hint = document.getElementById('lorawan-ui-hint');
  if (hint) hint.classList.toggle('hidden', !show);
}

function applyLorawanUiVisibility() {
  const enabled = isLorawanUiEnabled();
  const tabBtn = document.querySelector('#page-settings .tab-modern[data-tab="lorawan"]');
  if (tabBtn) {
    tabBtn.style.display = enabled ? '' : 'none';
  }
  const toggle = document.getElementById('lorawan-ui-toggle');
  if (toggle) {
    toggle.setAttribute('aria-checked', enabled ? 'true' : 'false');
  }
  if (!enabled) {
    setLorawanUiHintVisible(false);
    const active = getActiveSettingsTab();
    if (active === 'lorawan') {
      const modbusBtn = document.querySelector('#page-settings .tab-modern[data-tab="modbus"]');
      if (modbusBtn) modbusBtn.click();
      else {
        document.querySelectorAll('#page-settings .tab-modern').forEach(function(b) { b.classList.remove('active'); });
        document.querySelectorAll('#page-settings .tab-content').forEach(function(tc) { tc.style.display = 'none'; });
        const modbusTab = document.getElementById('tab-modbus');
        const modbusNav = document.querySelector('#page-settings .tab-modern[data-tab="modbus"]');
        if (modbusNav) modbusNav.classList.add('active');
        if (modbusTab) modbusTab.style.display = '';
        if (typeof updateSettingsDeviceActionsVisibility === 'function') {
          updateSettingsDeviceActionsVisibility('modbus');
        }
      }
    }
  } else if (isBleConnected() && !lorawanGattSessionActive) {
    setLorawanUiHintVisible(true);
  } else {
    setLorawanUiHintVisible(false);
  }
}

function initLorawanUiToggle() {
  const toggle = document.getElementById('lorawan-ui-toggle');
  applyLorawanUiVisibility();
  if (!toggle || toggle.dataset.bound === '1') return;
  toggle.dataset.bound = '1';
  toggle.addEventListener('click', async function() {
    const next = !isLorawanUiEnabled();
    setLorawanUiEnabled(next);
    applyLorawanUiVisibility();
    if (next) {
      logMsg('LoRaWAN yapılandırması açıldı.');
      if (isBleConnected() && !lorawanGattSessionActive) {
        setLorawanUiHintVisible(true);
        logMsg('LoRaWAN GATT için bağlantıyı kesip yeniden bağlanın.');
      } else if (isBleConnected() && lorawanGattSessionActive && typeof readLoRaWANAll === 'function') {
        try { await readLoRaWANAll(); } catch (e) { logFail('LoRaWAN okuma', e); }
      }
    } else {
      logMsg('LoRaWAN yapılandırması kapatıldı.');
    }
  });
}

window.isLorawanUiEnabled = isLorawanUiEnabled;
window.applyLorawanUiVisibility = applyLorawanUiVisibility;

/**
 * Bağlantı süreci UI SSOT — header altı bant + durum noktası + buton metni.
 * Aşamalar: picking → gatt → notify → gateway → live → ready | error | clear
 */
const ConnectProgress = (function() {
  let liveWaitResolve = null;
  let hideTimer = null;

  function els() {
    return {
      bar: document.getElementById('connect-progress'),
      text: document.getElementById('connect-progress-text'),
      status: document.getElementById('connection-status'),
      btn: document.getElementById('butConnect')
    };
  }

  function setStatusDot(mode) {
    const status = els().status;
    const statusText = document.getElementById('connection-status-text');
    if (!status) return;
    status.classList.remove('connected', 'disconnected', 'connecting');
    if (statusText) statusText.classList.remove('is-ok', 'is-warn', 'is-off');
    let label = 'Bağlı değil';
    let textClass = 'is-off';
    if (mode === 'connected') {
      status.classList.add('connected');
      label = 'Bağlı';
      textClass = 'is-ok';
    } else if (mode === 'connecting') {
      status.classList.add('connecting');
      label = 'Bağlanıyor';
      textClass = 'is-warn';
    } else {
      status.classList.add('disconnected');
    }
    status.title = label;
    status.setAttribute('aria-label', label);
    if (statusText) {
      statusText.textContent = label;
      statusText.classList.add(textClass);
    }
  }

  function show(phase, message, btnLabel) {
    const ui = els();
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (ui.bar) {
      ui.bar.hidden = false;
      ui.bar.classList.toggle('is-ready', phase === 'ready');
    }
    if (ui.text) ui.text.textContent = message;
    if (ui.btn && btnLabel) ui.btn.textContent = btnLabel;
    if (phase === 'ready') setStatusDot('connected');
    else if (phase === 'error' || phase === 'clear') { /* leave to caller */ }
    else setStatusDot('connecting');
  }

  function hide() {
    const ui = els();
    if (ui.bar) {
      ui.bar.hidden = true;
      ui.bar.classList.remove('is-ready');
    }
    if (liveWaitResolve) {
      const r = liveWaitResolve;
      liveWaitResolve = null;
      r();
    }
  }

  function clear() {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    hide();
  }

  function signalFirstLiveData() {
    if (liveWaitResolve) {
      const r = liveWaitResolve;
      liveWaitResolve = null;
      r();
    }
  }

  function waitForFirstLiveData(timeoutMs) {
    return new Promise(function(resolve) {
      if (liveWaitResolve) {
        liveWaitResolve();
        liveWaitResolve = null;
      }
      liveWaitResolve = resolve;
      setTimeout(function() {
        if (liveWaitResolve === resolve) {
          liveWaitResolve = null;
          resolve();
        }
      }, timeoutMs || 10000);
    });
  }

  function finishReady(message) {
    show('ready', message || 'Hazır', 'Bağlantıyı Kes');
    hideTimer = setTimeout(function() {
      hideTimer = null;
      const ui = els();
      if (ui.bar) {
        ui.bar.hidden = true;
        ui.bar.classList.remove('is-ready');
      }
    }, 900);
  }

  return {
    show: show,
    hide: hide,
    clear: clear,
    setStatusDot: setStatusDot,
    signalFirstLiveData: signalFirstLiveData,
    waitForFirstLiveData: waitForFirstLiveData,
    finishReady: finishReady
  };
})();
window.ConnectProgress = ConnectProgress;

/** Beklenmeyen kopmada sticky banner + Yeniden bağlan. */
const ReconnectBanner = (function() {
  let intentional = false;

  function els() {
    return {
      bar: document.getElementById('reconnect-banner'),
      text: document.getElementById('reconnect-banner-text'),
      btn: document.getElementById('reconnect-btn'),
      dismiss: document.getElementById('reconnect-dismiss')
    };
  }

  function show(message) {
    const ui = els();
    if (ui.text) ui.text.textContent = message || 'Bluetooth bağlantısı koptu.';
    if (ui.bar) ui.bar.hidden = false;
  }

  function hide() {
    const ui = els();
    if (ui.bar) ui.bar.hidden = true;
  }

  function markIntentional() {
    intentional = true;
  }

  function consumeIntentional() {
    const was = intentional;
    intentional = false;
    return was;
  }

  function bind() {
    const ui = els();
    if (ui.btn && !ui.btn.dataset.bound) {
      ui.btn.dataset.bound = '1';
      ui.btn.addEventListener('click', function() {
        hide();
        if (typeof clickConnect === 'function') clickConnect();
      });
    }
    if (ui.dismiss && !ui.dismiss.dataset.bound) {
      ui.dismiss.dataset.bound = '1';
      ui.dismiss.addEventListener('click', hide);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  return {
    show: show,
    hide: hide,
    markIntentional: markIntentional,
    consumeIntentional: consumeIntentional
  };
})();
window.ReconnectBanner = ReconnectBanner;

/**
 * @name connect
 * Opens a Web Serial connection to a micro:bit and sets up the input and
 * output stream.
 */
async function connect() {
  ConnectProgress.show('picking', 'Bluetooth cihazı seçin…', 'Cihaz seçiliyor…');
  logMsg('Bluetooth cihazları aranıyor...');
  const optionalServices = [
    '0000a005-0000-1000-8000-00805f9b34fb', // Commit karakteristiği (eski)
    SYSTEM_SERVICE_UUID,
    DEVICE_INFO_SERVICE_UUID,
    window.MODBUS_SERVICE_UUID // Modbus servisi
    // '00008018-0000-1000-8000-00805f9b34fb' // OTA servisi eklendi
  ];
  const wantLorawan = isLorawanUiEnabled();
  if (wantLorawan) optionalServices.push(LORAWAN_SERVICE_UUID);
  device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: optionalServices
  });
  lorawanGattSessionActive = wantLorawan;
  logMsg('Cihaz seçildi: ' + device.name);
  ConnectProgress.show('gatt', 'Bluetooth bağlanıyor…', 'Bağlanıyor…');
  const server = await device.gatt.connect();
  logMsg('Bluetooth bağlantısı kuruldu.');
  // Bağlantı kopunca arayüzü güncelle
  if (device && typeof onDisconnected === 'function') {
    device.removeEventListener('gattserverdisconnected', onDisconnected); // Çift eklenmesin diye önce kaldır
    device.addEventListener('gattserverdisconnected', onDisconnected);
  }
  return server;
}

async function readActiveSensors() {
  for (let panelId of activePanels) {
    let panel = panels[panelId];
    if (panels[panelId].properties.includes("read") || panels[panelId].properties.includes("notify")) {
      await panels[panelId].characteristic.readValue().then(function(data){handleIncoming(panelId, data);});
    }
  }
}

function handleIncoming(panelId, value) {
  const columns = Object.keys(panels[panelId].data);
  const typeMap = {
    "Uint8":    {fn: DataView.prototype.getUint8,    bytes: 1},
    "Uint16":   {fn: DataView.prototype.getUint16,   bytes: 2},
    "Uint32":   {fn: DataView.prototype.getUint32,   bytes: 4},
    "Float32":  {fn: DataView.prototype.getFloat32,  bytes: 4}
  };

  let packetPointer = 0, i = 0;
  panels[panelId].structure.forEach(function(dataType) {
    let dataViewFn = typeMap[dataType].fn.bind(value);
    let unpackedValue = dataViewFn(packetPointer, true);
    panels[panelId].data[columns[i]].push(unpackedValue);
    if (panels[panelId].data[columns[i]].length > bufferSize) {
      panels[panelId].data[columns[i]].shift();
    }
    packetPointer += typeMap[dataType].bytes;
    bytesReceived += typeMap[dataType].bytes;
    i++;
  });

  panels[panelId].rendered = false;
}

/**
 * @name disconnect
 * Closes the Web Bluetooth connection.
 */
async function disconnect() {
  if (device && device.gatt.connected) {
    device.gatt.disconnect();
  }
}

function getFullId(shortId) {
  if (shortId.length == 9) {
    return '9b489064-' + shortId + '-a1eb-0242ac120002';
  }
  return shortId;
}

function logMsg(text) {
  // Update the Log
  if (!log) return;
  if (typeof showTimestamp !== 'undefined' && showTimestamp && showTimestamp.checked) {
    let d = new Date();
    let timestamp = d.getHours() + ":" + `${d.getMinutes()}`.padStart(2, 0) + ":" +
        `${d.getSeconds()}`.padStart(2, 0) + "." + `${d.getMilliseconds()}`.padStart(3, 0);
    log.innerHTML += '<span class="timestamp">' + timestamp + ' -> </span>';
    d = null;
  }
  log.innerHTML += text+ "<br>";

  // Remove old log content
  if (log.textContent.split("\n").length > maxLogLength + 1) {
    let logLines = log.innerHTML.replace(/(\n)/gm, "").split("<br>");
    log.innerHTML = logLines.splice(-maxLogLength).join("<br>\n");
  }

  const auto = typeof autoscroll === 'undefined' || !autoscroll || autoscroll.checked !== false;
  if (auto) log.scrollTop = log.scrollHeight;
}

/** Süre metni: 850 ms / 1.2 s */
function formatElapsed(ms) {
  const n = Math.max(0, Number(ms) || 0);
  if (n < 1000) return Math.round(n) + ' ms';
  return (n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, '') + ' s';
}

/** Kullanıcıya sade hata metni. */
function simpleLogError(e) {
  const raw = e && e.message != null ? String(e.message) : String(e);
  const msg = raw.replace(/\s+/g, ' ').trim();
  if (!msg) return 'Bilinmeyen hata.';
  if (/Bluetooth bağlantısı yok|cihaz bağlı değil/i.test(msg)) return 'Cihaz bağlı değil.';
  if (/NetworkError|GATT Server disconnected|disconnected/i.test(msg)) return 'Bağlantı koptu veya yanıt alınamadı.';
  if (/NotFoundError|no services|getPrimaryService/i.test(msg)) return 'Cihaz servisi bulunamadı.';
  if (/NotSupportedError/i.test(msg)) return 'Bu işlem desteklenmiyor.';
  if (/Timeout|zaman aşımı|timed out/i.test(msg)) return 'Yanıt zaman aşımına uğradı.';
  if (/User cancelled|canceled/i.test(msg)) return 'İşlem iptal edildi.';
  return msg.length > 140 ? msg.slice(0, 137) + '…' : msg;
}

function logOk(summary, t0) {
  const elapsed = t0 != null ? ' · ' + formatElapsed(performance.now() - t0) : '';
  logMsg('✓ ' + summary + elapsed);
}

function logFail(summary, e, t0) {
  const elapsed = t0 != null ? ' · ' + formatElapsed(performance.now() - t0) : '';
  logMsg('✗ ' + summary + ': ' + simpleLogError(e) + elapsed);
}

function isLogDrawerOpen() {
  const drawer = document.getElementById('log-drawer');
  return !!(drawer && drawer.classList.contains('open'));
}

function setLogDrawerOpen(open) {
  const drawer = document.getElementById('log-drawer');
  const overlay = document.getElementById('log-drawer-overlay');
  const toggleLog = document.getElementById('toggleLog');
  if (!drawer) return;
  drawer.classList.toggle('open', !!open);
  drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (overlay) {
    overlay.classList.toggle('open', !!open);
    overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  if (toggleLog) toggleLog.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open && log) log.scrollTop = log.scrollHeight;
}

function toggleLogDrawer() {
  setLogDrawerOpen(!isLogDrawerOpen());
}

/**
 * @name updateTheme
 * Sets the theme to  Adafruit (dark) mode. Can be refactored later for more themes
 */
function updateTheme() {
  // Disable all themes
  const alternates = document.querySelectorAll('link[rel=stylesheet].alternate');
  if (alternates && alternates.length > 0) {
    alternates.forEach((styleSheet) => {
      enableStyleSheet(styleSheet, false);
    });
  }
  enableStyleSheet(typeof lightSS !== 'undefined' && lightSS ? lightSS : document.getElementById('light'), true);
}

function enableStyleSheet(node, enabled) {
  if (!node) return;
  node.disabled = !enabled;
}

/**
 * @name reset
 * Reset the Panels, Log, and associated data
 */
async function reset() {
  // Clear the data
  clearGraphData();

  // Clear all Panel Data
  for (let panelId of activePanels) {
    let panel = panels[panelId];
    if (panels[panelId].data !== undefined) {
      Object.entries(panels[panelId].data).forEach(([field, item], index) => {
        panels[panelId].data[field] = [];
      });
    }
    panels[panelId].rendered = false;
  }

  bytesReceived = 0;
  colorIndex = 0;

  // Clear the log
  log.innerHTML = "";
}

/**
 * @name clickConnect
 * Click handler for the connect/disconnect button.
 */
async function clickConnect() {
  if (device && device.gatt && device.gatt.connected) {
    ReconnectBanner.markIntentional();
    ReconnectBanner.hide();
    ConnectProgress.clear();
    clearDeviceInfoUi();
    lorawanGattSessionActive = false;
    await teardownAllModbusBle();
    await disconnect();
    toggleUIConnected(false);
    setLorawanUiHintVisible(false);
    [document.getElementById('device_eui'), document.getElementById('app_eui'), document.getElementById('app_key')].forEach(input => {
      if (input) {
        input.value = '';
        input.disabled = true;
      }
    });
    document.getElementById('write_all').disabled = true;
    const editBtn = document.getElementById('edit_gateway_modbus');
    if (editBtn) {
      editBtn.disabled = true;
      editBtn.textContent = 'Düzenle';
    }
    return;
  }
  butConnect.disabled = true;
  ReconnectBanner.hide();
  ConnectProgress.show('picking', 'Bluetooth cihazı seçin…', 'Cihaz seçiliyor…');
  const t0 = performance.now();
  try {
    await connect();
    clearModbusGattCache();
    ConnectProgress.show('notify', 'Kanallar hazırlanıyor…', 'Hazırlanıyor…');
    await setupModbusResponseNotify();
    await setupModbusStreamNotify();
    ConnectProgress.show('gateway', 'Gateway bilgileri okunuyor…', 'Ayarlar okunuyor…');
    try {
      // Canlı okumadan önce hat ayarlarını doldur (mb_addr slave için SSOT)
      await readGatewayModbusSettings();
    } catch (e) {
      logFail('Bağlantı kuruldu, ayarlar okunamadı', e);
    }
    try {
      await readDeviceInfo();
    } catch (e) {
      logFail('Device Info okunamadı', e);
    }
    if (isLorawanUiEnabled() && lorawanGattSessionActive) {
      try {
        await readLoRaWANAll();
        setLorawanUiHintVisible(false);
      } catch (e) {
        logFail('LoRaWAN okunamadı', e);
      }
    }
    toggleUIConnected(true);
    ReconnectBanner.hide();
    logOk('Cihaza bağlandı' + (device && device.name ? ' (' + device.name + ')' : ''), t0);

    const deviceId = typeof window.getCurrentDeviceId === 'function' ? window.getCurrentDeviceId() : null;
    const pageId = typeof window.getCurrentPageId === 'function' ? window.getCurrentPageId() : null;
    const livePage = pageId === 'dashboard' || pageId === 'charts' ||
      pageId === 'harmonics' || pageId === 'io-monitor';
    const wantLive = !!(deviceId && deviceId !== 'manual' && livePage &&
      window.LiveModbus && window.LiveModbus.shouldUseLive());
    if (wantLive) {
      ConnectProgress.show('live', 'Canlı veri bekleniyor…', 'Veri bekleniyor…');
      await ConnectProgress.waitForFirstLiveData(10000);
    }
    ConnectProgress.finishReady('Bağlantı hazır');
  } catch (e) {
    await teardownAllModbusBle();
    ConnectProgress.clear();
    ConnectProgress.setStatusDot('disconnected');
    clearDeviceInfoUi();
    logFail('Bağlantı kurulamadı', e, t0);
    [document.getElementById('device_eui'), document.getElementById('app_eui'), document.getElementById('app_key')].forEach(input => {
      if (input) {
        input.value = '';
        input.disabled = true;
      }
    });
    document.getElementById('write_all').disabled = true;
    const editBtnFail = document.getElementById('edit_gateway_modbus');
    if (editBtnFail) {
      editBtnFail.disabled = true;
      editBtnFail.textContent = 'Düzenle';
    }
  }
  butConnect.disabled = false;
  butConnect.textContent = device && device.gatt && device.gatt.connected ? 'Bağlantıyı Kes' : 'Cihaza Bağlan';
}

async function onDisconnected(event) {
  let disconnectedDevice = event.target;

  for (let panelId of activePanels) {
    if (typeof panels[panelId].polling !== 'undefined') {
      clearInterval(panels[panelId].polling);
    }
  }

  destroyPanels();

  await teardownAllModbusBle();
  ConnectProgress.clear();
  clearDeviceInfoUi();
  lorawanGattSessionActive = false;
  setLorawanUiHintVisible(false);
  toggleUIConnected(false);
  const intentional = ReconnectBanner.consumeIntentional();
  if (intentional) {
    ReconnectBanner.hide();
    logMsg('Bağlantı kesildi.');
  } else {
    ReconnectBanner.show('Bluetooth bağlantısı koptu. Tekrar bağlanın.');
    logMsg('Cihaz ile bağlantı KOPTU! Lütfen tekrar bağlanın.');
  }

  device = undefined;
  currentBoard = undefined;
  // Bağlantı kesilince inputları disable ve temizle
  [
    document.getElementById('device_eui'),
    document.getElementById('app_eui'),
    document.getElementById('app_key'),
    document.getElementById('platform'),
    document.getElementById('freq'),
    document.getElementById('pckpo'),
    document.getElementById('adr')
  ].forEach(input => {
    if (input) {
      input.value = '';
      input.disabled = true;
    }
  });
  const writeBtn = document.getElementById('write_all');
  if (writeBtn) writeBtn.disabled = true;
}

/**
 * @name clickAutoscroll
 * Change handler for the Autoscroll checkbox.
 */
async function clickAutoscroll() {
  saveSetting('autoscroll', autoscroll.checked);
}

/**
 * @name clickTimestamp
 * Change handler for the Show Timestamp checkbox.
 */
async function clickTimestamp() {
  saveSetting('timestamp', showTimestamp.checked);
}

/**
 * @name clickKnownOnly
 * Change handler for the Show Only Known Devices checkbox.
 */
async function clickKnownOnly() {
  saveSetting('knownonly', knownOnly.checked);
}

/**
 * @name clickClear
 * Click handler for the clear button.
 */
async function clickClear() {
  reset();
}

function convertJSON(chunk) {
  try {
    let jsonObj = JSON.parse(chunk);
    return jsonObj;
  } catch (e) {
    return chunk;
  }
}

function isBleConnected() {
  return !!(typeof device !== 'undefined' && device && device.gatt && device.gatt.connected);
}

/** Gateway Modbus hat ayarları: varsayılan salt okunur; Düzenle ile açılır. */
let gatewayModbusEditMode = false;

function setGatewayModbusEditMode(editing) {
  gatewayModbusEditMode = !!editing && isBleConnected();
  document.querySelectorAll('#tab-modbus input, #tab-modbus select').forEach(el => {
    el.disabled = !gatewayModbusEditMode;
  });
  const writeBtn = document.getElementById('write_all');
  const editBtn = document.getElementById('edit_gateway_modbus');
  if (editBtn) {
    editBtn.disabled = !isBleConnected();
    editBtn.textContent = gatewayModbusEditMode ? 'İptal' : 'Düzenle';
  }
  // Yaz butonu sekme bağlamına göre (Modbus: edit mode; LoRaWAN: bağlıysa açık)
  if (typeof updateSettingsDeviceActionsVisibility === 'function') {
    updateSettingsDeviceActionsVisibility();
  } else if (writeBtn) {
    writeBtn.disabled = !gatewayModbusEditMode;
  }
}

function toggleUIConnected(connected) {
  const status = document.getElementById('connection-status');
  const statusText = document.getElementById('connection-status-text');
  const commitBtn = document.getElementById('commit_and_restart');
  let lbl = 'Cihaza Bağlan';
  if (connected) {
    lbl = 'Bağlantıyı Kes';
    if (status) {
      status.textContent = '';
      status.title = 'Bağlı';
      status.setAttribute('aria-label', 'Bağlı');
      status.classList.remove('disconnected', 'connecting');
      status.classList.add('connected');
    }
    if (statusText) {
      statusText.textContent = 'Bağlı';
      statusText.classList.remove('is-warn', 'is-off');
      statusText.classList.add('is-ok');
    }
    [document.getElementById('device_eui'), document.getElementById('app_eui'), document.getElementById('app_key')].forEach(input => {
      if (input) input.disabled = false;
    });
    setGatewayModbusEditMode(false);
    if (commitBtn) commitBtn.disabled = false;
    const mmRead = document.getElementById('mm_btn_read');
    const mmWrite = document.getElementById('mm_btn_write');
    if (mmRead) mmRead.disabled = false;
    if (mmWrite) mmWrite.disabled = false;
  } else {
    if (status) {
      status.textContent = '';
      status.title = 'Bağlı değil';
      status.setAttribute('aria-label', 'Bağlı değil');
      status.classList.remove('connected', 'connecting');
      status.classList.add('disconnected');
    }
    if (statusText) {
      statusText.textContent = 'Bağlı değil';
      statusText.classList.remove('is-ok', 'is-warn');
      statusText.classList.add('is-off');
    }
    [document.getElementById('device_eui'), document.getElementById('app_eui'), document.getElementById('app_key')].forEach(input => {
      if (input) {
        input.value = '';
        input.disabled = true;
      }
    });
    const modbusFields = document.querySelectorAll('#tab-modbus input, #tab-modbus select');
    modbusFields.forEach(el => {
      if (el.tagName === 'SELECT') {
        el.querySelectorAll('option[data-custom]').forEach(o => o.remove());
        const def = el.querySelector('option[selected]') || el.options[0];
        if (def) el.value = def.value;
      } else {
        el.value = '';
      }
      el.disabled = true;
    });
    gatewayModbusEditMode = false;
    const writeBtn = document.getElementById('write_all');
    const editBtn = document.getElementById('edit_gateway_modbus');
    if (writeBtn) writeBtn.disabled = true;
    if (editBtn) {
      editBtn.disabled = true;
      editBtn.textContent = 'Düzenle';
    }
    if (commitBtn) commitBtn.disabled = true;
    const mmRead = document.getElementById('mm_btn_read');
    const mmWrite = document.getElementById('mm_btn_write');
    if (mmRead) mmRead.disabled = true;
    if (mmWrite) mmWrite.disabled = true;
    setCommitPending(false);
  }
  const butConnect = document.getElementById('butConnect');
  if (butConnect) butConnect.textContent = lbl;
  updateSettingsDeviceActionsVisibility();
  try {
    if (typeof window.onBleConnectionChange === 'function') {
      window.onBleConnectionChange(!!connected);
    }
  } catch (e) { /* ignore page handler errors */ }
}

function loadAllSettings() {
  // Load all saved settings or defaults
  var _autoscroll = typeof autoscroll !== 'undefined' && autoscroll ? autoscroll : document.getElementById('autoscroll');
  var _showTimestamp = typeof showTimestamp !== 'undefined' && showTimestamp ? showTimestamp : document.getElementById('showTimestamp');
  var _knownOnly = typeof knownOnly !== 'undefined' && knownOnly ? knownOnly : document.getElementById('knownonly');
  if (_autoscroll) _autoscroll.checked = loadSetting('autoscroll', true);
  if (_showTimestamp) _showTimestamp.checked = loadSetting('timestamp', false);
  if (_knownOnly) _knownOnly.checked = loadSetting('knownonly', true);
}

function loadSetting(setting, defaultValue) {
  let value = JSON.parse(window.localStorage.getItem(setting));
  if (value == null) {
    return defaultValue;
  }

  return value;
}

function saveSetting(setting, value) {
  window.localStorage.setItem(setting, JSON.stringify(value));
}

async function finishDrawing() {
  return new Promise(requestAnimationFrame);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function updatePanel(panelId) {
  if (!panels[panelId].rendered) {
    if (panels[panelId].panelType == "text") {
      updateTextPanel(panelId);
    } else if (panels[panelId].panelType == "graph") {
      updateGraphPanel(panelId);
    } else if (panels[panelId].panelType == "model3d") {
      update3dPanel(panelId);
    } else if (panels[panelId].panelType == "custom") {
      updateCustomPanel(panelId);
    }
    panels[panelId].rendered = true;
  }
}

function createPanel(panelId) {
  if (panels.hasOwnProperty(panelId)) {
    if (panels[panelId].panelType == "text") {
      createTextPanel(panelId);
    } else if (panels[panelId].panelType == "graph") {
      createGraphPanel(panelId);
    } else if (panels[panelId].panelType == "color") {
      createColorPanel(panelId);
    } else if (panels[panelId].panelType == "model3d") {
      create3dPanel(panelId);
    } else if (panels[panelId].panelType == "custom") {
      createCustomPanel(panelId);
    }
    panels[panelId].rendered = true;
    activePanels.push(panelId);
  }
}

function destroyPanels() {
  let activePanelCount = activePanels.length;
  for (let i = 0; i < activePanelCount; i++) {
    let itemToRemove = activePanels.pop();
    document.querySelector("#dashboard > #" + itemToRemove).remove();
  }
}

function clearGraphData() {
  for (let panelId of activePanels) {
    let panel = panels[panelId];
    if (panel.panelType == "graph") {
      panel.graph.clear();
    }
  }
}

function ucWords(text) {
  return text.replace('_', ' ').toLowerCase().replace(/(?<= )[^\s]|^./g, a=>a.toUpperCase())
}

function loadPanelTemplate(panelId, templateId) {
  if (templateId == undefined) {
    templateId = panels[panelId].panelType;
  }
    // Create Panel from Template
  let panelTemplate = document.querySelector("#templates > ." + templateId).cloneNode(true);
  panelTemplate.id = panelId;
  if (panels[panelId].title !== undefined) {
    panelTemplate.querySelector(".title").innerHTML = panels[panelId].title;
  } else {
    panelTemplate.querySelector(".title").innerHTML = ucWords(panelId);
  }

  dashboard.appendChild(panelTemplate)

  return panelTemplate;
}

/* Text Panel */
function createTextPanel(panelId) {
  // Create Panel from Template
  let panelTemplate = loadPanelTemplate(panelId);
  panelTemplate.querySelector(".content p").innerHTML = "-";
  if (panels[panelId].style !== undefined) {
    panelTemplate.querySelector(".content").style = panels[panelId].style;
  }
}

function updateTextPanel(panelId) {
  let panelElement = document.querySelector("#dashboard > #" + panelId);
  let panelContent = [];
  Object.entries(panels[panelId].data).forEach(([field, item], index) => {
    let value = "";
    if (panels[panelId].data[field].length > 0) {
      value = panels[panelId].data[field].pop(); // Show only the last piece of data
      panels[panelId].data[field] = [];
      if (panels[panelId].textFormat !== undefined) {
        value = panels[panelId].textFormat(value);
      }
    }
    if (value !== "") {
      panelContent.push(value);
    }
  });
  if (panelContent.length == 0) {
    panelContent = "-";
  } else {
    panelContent = panelContent.join("<br>");
  }
  panelElement.querySelector(".content p").innerHTML = panelContent;
}

/* Graph Panel */
function createGraphPanel(panelId) {
  // Create Panel from Template
  let panelTemplate = loadPanelTemplate(panelId);
  let canvas = panelTemplate.querySelector(".content canvas");

  // Create a canvas
  panels[panelId].graph = new Graph(canvas);
  panels[panelId].graph.create(false);

  // Setup graph
  Object.entries(panels[panelId].data).forEach(([field, item], index) => {
    panels[panelId].graph.addDataSet(field, colors[(colorIndex + index) % colors.length]);
    // Create text spans for each dataset and set the color here
    let textField = document.createElement('div');
    textField.style.color = colors[(colorIndex + index) % colors.length];
    textField.id = field;
    panelTemplate.querySelector(".content .text p").appendChild(textField);
  });
  colorIndex += Object.entries(panels[panelId].data).length;

  panels[panelId].graph.update();
}

function updateGraphPanel(panelId) {
  let panelElement = document.querySelector("#dashboard > #" + panelId);
  let panelContent = [];
  let multipleEntries = Object.entries(panels[panelId].data).length > 1;

  // Set Graph Data to match
  Object.entries(panels[panelId].data).forEach(([field, item], index) => {
    if (panels[panelId].data[field].length > 0) {
      let value = null;
      while(panels[panelId].data[field].length > 0) {
        value = panels[panelId].data[field].shift();
        panels[panelId].graph.addValue(index, value, false);
      }
      if (panels[panelId].textFormat !== undefined) {
        value = panels[panelId].textFormat(value);
      }
      if (value !== null) {
        if (multipleEntries) {
          value = ucWords(field) + ": " + value;
        }
        panelElement.querySelector(".content .text p #" + field).innerHTML = value;
      }
    } else {
      panels[panelId].graph.clearValues(index);
      if (multipleEntries) {
        panelElement.querySelector(".content .text p #" + field).innerHTML = ucWords(field) + ': -';
      } else {
        panelElement.querySelector(".content .text p #" + field).innerHTML = '-';
      }
    }

  });

  panels[panelId].graph.flushBuffer();
}

/* Color Panel */
function createColorPanel(panelId) {
  // Create Panel from Template
  let panelTemplate = loadPanelTemplate(panelId);

  let container = panelTemplate.querySelector('.content div');
  panels[panelId].colorPicker = colorjoe.rgb(container, 'red');

  // Update the panel packet sequence to match the number of LEDs on board
  panels[panelId].packetSequence = panels[panelId].structure.slice(0, 2);
  let dataType = panels[panelId].structure[2].replace(/\[\]/, '');
  for (let i = 0; i < currentBoard.neopixels * 3; i++) {
    panels[panelId].packetSequence.push(dataType);
  }

  // RGB Color Picker
  function updateModelLed(color) {
    logMsg("Changing neopixel to " + color.hex());
    let orderedColors = adjustColorOrder(Math.round(color.r() * 255),
                                         Math.round(color.g() * 255),
                                         Math.round(color.b() * 255));
    let values = [0, 1].concat(new Array(currentBoard.neopixels).fill(orderedColors).flat());
    let packet = encodePacket(panelId, values);
    panels[panelId].characteristic.writeValue(packet)
    .catch(error => {console.log(error);})
    .then(_ => {});
  }

  function adjustColorOrder(red, green, blue) {
    // Add more as needed
    switch(currentBoard.colorOrder) {
      case 'GRB':
        return [green, red, blue];
      default:
        return [red, green, blue];
    }
  }

  panels[panelId].colorPicker.on('done', updateModelLed);
}

/* 3D Panel */
function create3dPanel(panelId) {
  let panelTemplate = loadPanelTemplate(panelId);
  let canvas = panelTemplate.querySelector(".content canvas");

  // Make it visually fill the positioned parent
  canvas.style.width ='100%';
  canvas.style.height='100%';
  // ...then set the internal size to match
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  // Create a 3D renderer and camera
  panels[panelId].renderer = new THREE.WebGLRenderer({canvas});

  panels[panelId].camera = new THREE.PerspectiveCamera(45, canvas.width/canvas.height, 0.1, 100);
  panels[panelId].camera.position.set(0, -5, 30);

  // Set up the Scene
  panels[panelId].scene = new THREE.Scene();
  panels[panelId].scene.background = new THREE.Color('black');
  {
    const skyColor = 0xB1E1FF;  // light blue
    const groundColor = 0x999999;  // gray
    const intensity = 1;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    panels[panelId].scene.add(light);
  }

  {
    const color = 0xFFFFFF;
    const intensity = 3;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 10, 0);
    light.target.position.set(-5, 0, 0);
    panels[panelId].scene.add(light);
    panels[panelId].scene.add(light.target);
  }

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, -10, 0);
    light.target.position.set(5, 0, 0);
    panels[panelId].scene.add(light);
    panels[panelId].scene.add(light.target);
  }

  function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
    const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5);
    const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
    // compute a unit vector that points in the direction the camera is now
    // in the xz plane from the center of the box
    const direction = (new THREE.Vector3())
        .subVectors(camera.position, boxCenter)
        .multiply(new THREE.Vector3(1, 0, 1))
        .normalize();

    // move the camera to a position distance units way from the center
    // in whatever direction the camera was from the center already
    camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));

    // pick some near and far values for the frustum that
    // will contain the box.
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    camera.updateProjectionMatrix();

    // point the camera to look at the center of the box
    camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
  }

  {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('https://cdn.glitch.com/eeed3166-9759-4ba5-ba6b-aed272d6db80%2Fbunny.glb', (gltf) => {
      const root = gltf.scene;
      panels[panelId].model = root;
      panels[panelId].scene.add(root);

      const box = new THREE.Box3().setFromObject(root);

      const boxSize = box.getSize(new THREE.Vector3()).length();
      const boxCenter = box.getCenter(new THREE.Vector3());

      frameArea(boxSize * 1.25, boxSize, boxCenter, panels[panelId].camera);
    });
  }
}

function update3dPanel(panelId) {
  let panelElement = document.querySelector("#dashboard > #" + panelId);

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }
  // Set Graph Data to match
  if (resizeRendererToDisplaySize(panels[panelId].renderer)) {
    const canvas = panels[panelId].renderer.domElement;
    panels[panelId].camera.aspect = canvas.clientWidth / canvas.clientHeight;
    panels[panelId].camera.updateProjectionMatrix();
  }

  let quaternion = {w: 1, x: 0, y: 0, z:0};
  Object.entries(panels[panelId].data).forEach(([field, item], index) => {
    if (panels[panelId].data[field].length > 0) {
      let value = panels[panelId].data[field].pop(); // Show only the last piece of data
      quaternion[field] = value;
      panels[panelId].data[field] = [];
    }
  });

  if (panels[panelId].model != undefined) {
    let rotObjectMatrix = new THREE.Matrix4();
    let rotationQuaternion = new THREE.Quaternion(quaternion.y, quaternion.z, quaternion.x, quaternion.w);
    rotObjectMatrix.makeRotationFromQuaternion(rotationQuaternion);
    panels[panelId].model.quaternion.setFromRotationMatrix(rotObjectMatrix);
  }

  panels[panelId].renderer.render(panels[panelId].scene, panels[panelId].camera);
}

function createCustomPanel(panelId) {
  if (panels[panelId].condition === undefined || panels[panelId].condition()) {
    if (panels[panelId].create != undefined) {
      panels[panelId].create(panelId);
    }
  }
}

function updateCustomPanel(panelId) {
  if (panels[panelId].condition === undefined || panels[panelId].condition()) {
    if (panels[panelId].update != undefined) {
      panels[panelId].update(panelId);
    }
  }
}

function createMockPanels() {
  currentBoard = boards.CLUE;
  for (let panelId of Object.keys(panels)) {
    if (panels[panelId].condition == undefined || panels[panelId].condition()) {
      // Non-custom ones such as battery are always active
      createPanel(panelId);
    }
  }
}

async function readValue(type) {
  try {
    if (!device || !device.gatt || !device.gatt.connected) throw 'Bluetooth bağlantısı yok.';
    let CHAR_UUID = '';
    let inputId = '';
    let isString = false;
    if (type === 'device_eui') {
      CHAR_UUID = DEVEUI_CHAR_UUID;
      inputId = 'device_eui';
    } else if (type === 'app_eui') {
      CHAR_UUID = APPEUI_CHAR_UUID;
      inputId = 'app_eui';
    } else if (type === 'app_key') {
      CHAR_UUID = APPKEY_CHAR_UUID;
      inputId = 'app_key';
    } else if (type === 'platform') {
      CHAR_UUID = PLATFORM_CHAR_UUID;
      inputId = 'platform';
      isString = true;
    } else if (type === 'freq') {
      CHAR_UUID = FREQ_CHAR_UUID;
      inputId = 'freq';
      isString = true;
    } else if (type === 'pckpo') {
      CHAR_UUID = PCKPO_CHAR_UUID;
      inputId = 'pckpo';
    } else if (type === 'adr') {
      CHAR_UUID = ADR_CHAR_UUID;
      inputId = 'adr';
    } else {
      throw 'Bilinmeyen karakteristik tipi';
    }
    const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
    const service = await server.getPrimaryService(LORAWAN_SERVICE_UUID);
    const characteristic = await service.getCharacteristic(CHAR_UUID);
    const value = await characteristic.readValue();
    let result = '';
    if (isString) {
      // String olarak oku
      for (let i = 0; i < value.byteLength; i++) {
        const char = value.getUint8(i);
        if (char === 0) break;
        result += String.fromCharCode(char);
      }
    } else if (type === 'adr') {
      result = value.getUint8(0) ? 'Evet' : 'Hayır';
    } else if (type === 'pckpo') {
      result = value.getUint8(0).toString();
    } else {
      // Hex string (eski alanlar)
      for (let i = 0; i < value.byteLength; i++) {
        result += value.getUint8(i).toString(16).padStart(2, '0').toUpperCase();
      }
    }
    document.getElementById(inputId).value = result;
    logMsg(inputId + ' okundu: ' + result);
  } catch (e) {
    logMsg(type + ' okunamadı: ' + e);
    throw e;
  }
}

function uint16BeBytes(n) {
  const buf = new Uint8Array(2);
  new DataView(buf.buffer).setUint16(0, n & 0xffff, false);
  return buf;
}

function uint32BeBytes(n) {
  const buf = new Uint8Array(4);
  new DataView(buf.buffer).setUint32(0, n >>> 0, false);
  return buf;
}

/** GATT okuma: uint32 BE; eski string firmware için rakam çıkarımı. */
function parseGattUint32Be(view) {
  if (view.byteLength >= 4) return view.getUint32(0, false);
  const s = bufferToString(view).replace(/[^\d].*$/, '');
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
}

function parseGattUint16Be(view) {
  if (view.byteLength >= 2) return view.getUint16(0, false);
  return view.byteLength === 1 ? view.getUint8(0) : 0;
}

function hexToBytes(hex, expectedLen, label) {
  if (hex.length !== expectedLen * 2) {
    throw label + ' ' + expectedLen + ' byte (' + (expectedLen * 2) + ' hex karakter) olmalı.';
  }
  const buffer = new Uint8Array(expectedLen);
  for (let i = 0; i < expectedLen; i++) {
    buffer[i] = parseInt(hex.substr(i * 2, 2), 16);
    if (Number.isNaN(buffer[i])) throw label + ' geçersiz hex.';
  }
  return buffer;
}

/**
 * Gateway’in RS-485 hat ayarlarını BLE GATT’a yazar (a401–a407).
 * Çok baytlı alanlar big-endian. Slave’e Modbus RTU göndermez.
 */
async function writeGatewayModbusSettings() {
  if (!device || !device.gatt || !device.gatt.connected) throw 'Bluetooth bağlantısı yok.';
  const fields = getGatewayModbusFieldEls();
  const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
  const service = await server.getPrimaryService(MODBUS_SERVICE_UUID);

  const requireSelectOption = (id, label) => {
    const el = document.getElementById(id);
    if (!el || el.tagName !== 'SELECT') throw label + ' seçimi geçersiz.';
    const v = String(el.value);
    if (!v) throw label + ' seçilmeli.';
    // data-custom = cihazdan gelen standart dışı; yazmadan önce listeden standart seçilmeli
    const opt = el.selectedOptions && el.selectedOptions[0];
    if (opt && opt.dataset.custom === '1') {
      throw label + ': standart bir değer seçin (cihaz değeri yazılamaz).';
    }
    return v;
  };

  const addr = parseInt(requireSelectOption('mb_addr', 'Slave adresi'), 10);
  if (!(addr >= 1 && addr <= 247)) throw 'Slave adresi 1–247 olmalı.';
  const baud = parseInt(requireSelectOption('mb_baud', 'Baud hızı'), 10);
  const parity = parseInt(requireSelectOption('mb_parity', 'Parite'), 10);
  const stopbits = parseInt(requireSelectOption('mb_stopbits', 'Stop biti'), 10);
  const databits = parseInt(requireSelectOption('mb_databits', 'Veri biti'), 10);
  const timeout = parseInt(requireSelectOption('mb_timeout', 'Zaman aşımı'), 10);
  const polling = parseInt(requireSelectOption('mb_polling', 'Polling'), 10);

  const writes = [
    { uuid: MB_ADDR_UUID, data: Uint8Array.of(addr & 0xff) },
    { uuid: MB_BAUD_UUID, data: uint32BeBytes(baud) },
    { uuid: MB_PARITY_UUID, data: Uint8Array.of(parity & 0xff) },
    { uuid: MB_STOPBITS_UUID, data: Uint8Array.of(stopbits & 0xff) },
    { uuid: MB_DATABITS_UUID, data: Uint8Array.of(databits & 0xff) },
    { uuid: MB_TIMEOUT_UUID, data: uint32BeBytes(timeout) },
    { uuid: MB_POLLING_UUID, data: uint32BeBytes(polling) }
  ];

  setFieldsBusy(fields, true);
  const t0 = performance.now();
  try {
    for (const w of writes) {
      const ch = await service.getCharacteristic(w.uuid);
      await ch.writeValue(w.data);
    }
    setFieldsBusy(fields, false);
    flashFields(fields, '#bfdbfe');
    logOk('Hat ayarları yazıldı (slave ' + addr + ', ' + baud + ' baud, zaman aşımı ' + timeout + ' ms)', t0);
  } catch (e) {
    setFieldsBusy(fields, false);
    throw e;
  }
}

async function writeLoRaWANKeysIfFilled() {
  if (!isLorawanUiEnabled()) return false;

  const deveui = document.getElementById('device_eui')?.value.trim() || '';
  const appeui = document.getElementById('app_eui')?.value.trim() || '';
  const appkey = document.getElementById('app_key')?.value.trim() || '';
  if (!deveui && !appeui && !appkey) return false;
  if (!(deveui.length === 16 && appeui.length === 16 && appkey.length === 32)) {
    throw 'LoRaWAN alanları doluysa Device EUI 16, APP EUI 16, APP Key 32 hex karakter olmalı.';
  }
  if (!lorawanGattSessionActive) {
    throw 'LoRaWAN GATT erişimi yok. Bağlantıyı kesip LoRaWAN açıkken yeniden bağlanın.';
  }

  const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
  const service = await server.getPrimaryService(LORAWAN_SERVICE_UUID);
  const t0 = performance.now();
  await (await service.getCharacteristic(DEVEUI_CHAR_UUID)).writeValue(hexToBytes(deveui, 8, 'Device EUI'));
  await (await service.getCharacteristic(APPEUI_CHAR_UUID)).writeValue(hexToBytes(appeui, 8, 'APP EUI'));
  await (await service.getCharacteristic(APPKEY_CHAR_UUID)).writeValue(hexToBytes(appkey, 16, 'APP Key'));
  logOk('LoRaWAN anahtarları yazıldı', t0);
  return true;
}

function getActiveSettingsTab() {
  const active = document.querySelector('#page-settings .tab-modern.active');
  return active ? active.dataset.tab : null;
}

/** Yaz / Düzenle / Kaydet ve Yeniden Başlat: yalnızca cihaz ayarı sekmelerinde.
 *  İşlem Logu: Gelişmiş (app) sekmesinde; teşhis aracı. */
window.updateSettingsDeviceActionsVisibility = updateSettingsDeviceActionsVisibility;
function updateSettingsDeviceActionsVisibility(tab) {
  const tabName = tab || getActiveSettingsTab();
  const bar = document.getElementById('settings-device-actions');
  const editBtn = document.getElementById('edit_gateway_modbus');
  const writeBtn = document.getElementById('write_all');
  const guide = document.getElementById('settings-commit-guide');

  const showBar = tabName === 'modbus' || tabName === 'lorawan';

  if (bar) bar.style.display = showBar ? '' : 'none';
  if (guide) {
    guide.hidden = !(showBar && window._commitPending);
  }

  if (editBtn) {
    // Düzenle yalnızca gateway Modbus formunu açar
    editBtn.style.display = tabName === 'modbus' ? '' : 'none';
  }

  if (writeBtn && showBar && isBleConnected()) {
    if (tabName === 'modbus') {
      writeBtn.disabled = !gatewayModbusEditMode;
    } else if (tabName === 'lorawan') {
      writeBtn.disabled = false;
    }
  }
}

/** Yaz sonrası «Kaydet ve Yeniden Başlat» sticky rehberi. */
function setCommitPending(pending) {
  window._commitPending = !!pending;
  const guide = document.getElementById('settings-commit-guide');
  const commitBtn = document.getElementById('commit_and_restart');
  const tabName = getActiveSettingsTab();
  const showBar = tabName === 'modbus' || tabName === 'lorawan';
  if (guide) guide.hidden = !(pending && showBar);
  if (commitBtn) {
    if (pending) commitBtn.classList.add('btn-emphasis');
    else commitBtn.classList.remove('btn-emphasis');
  }
}

async function writeAll() {
  const writeBtn = document.getElementById('write_all');
  const editBtn = document.getElementById('edit_gateway_modbus');
  const commitBtn = document.getElementById('commit_and_restart');
  const setActionBusy = (busy) => {
    if (writeBtn) writeBtn.disabled = busy || (getActiveSettingsTab() === 'modbus' && !gatewayModbusEditMode) || !isBleConnected();
    if (editBtn) editBtn.disabled = busy || !isBleConnected();
    if (commitBtn) commitBtn.disabled = busy || !isBleConnected();
  };
  const t0 = performance.now();
  try {
    if (!device || !device.gatt || !device.gatt.connected) throw 'Bluetooth bağlantısı yok.';
    const tab = getActiveSettingsTab();
    setActionBusy(true);

    if (tab === 'lorawan') {
      const lorawanFields = Array.from(document.querySelectorAll('#tab-lorawan input'));
      setFieldsBusy(lorawanFields, true);
      try {
        const wrote = await writeLoRaWANKeysIfFilled();
        setFieldsBusy(lorawanFields, false);
        if (!wrote) throw 'Device EUI, APP EUI ve APP Key alanlarını doldurun.';
        flashFields(lorawanFields, '#bfdbfe');
        setCommitPending(true);
        logMsg('Kalıcı kayıt için «Kaydet ve Yeniden Başlat» kullanın.');
      } catch (e) {
        setFieldsBusy(lorawanFields, false);
        throw e;
      }
      return;
    }

    if (tab !== 'modbus') throw 'Bu sekmede yazılacak cihaz ayarı yok.';
    if (!gatewayModbusEditMode) throw 'Önce «Düzenle» ile ayarları açın.';
    await writeGatewayModbusSettings();
    await writeLoRaWANKeysIfFilled();
    setGatewayModbusEditMode(false);
    setCommitPending(true);
    logMsg('Kalıcı kayıt için «Kaydet ve Yeniden Başlat» kullanın. · toplam ' + formatElapsed(performance.now() - t0));
  } catch (e) {
    logFail('Yazma başarısız', e, t0);
  } finally {
    setActionBusy(false);
    updateSettingsDeviceActionsVisibility();
  }
}

// TAB arayüzü için sekme geçişi
document.addEventListener('DOMContentLoaded', () => {
  const mbAddr = document.getElementById('mb_addr');
  if (mbAddr && mbAddr.tagName === 'SELECT' && mbAddr.options.length === 0) {
    for (let i = 1; i <= 247; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = String(i);
      if (i === 1) opt.selected = true;
      mbAddr.appendChild(opt);
    }
  }
  document.querySelectorAll('.tab-modern').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-modern').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
      this.classList.add('active');
      document.getElementById('tab-' + this.dataset.tab).style.display = '';
      updateSettingsDeviceActionsVisibility(this.dataset.tab);
    });
  });
  updateSettingsDeviceActionsVisibility();
  initLorawanUiToggle();
});

// Modbus servis ve karakteristik UUID'leri
defineModbusUUIDs();
function defineModbusUUIDs() {
  window.MODBUS_SERVICE_UUID = '0000a400-0000-1000-8000-00805f9b34fb';
  window.MB_ADDR_UUID     = '0000a401-0000-1000-8000-00805f9b34fb';
  window.MB_BAUD_UUID     = '0000a402-0000-1000-8000-00805f9b34fb';
  window.MB_PARITY_UUID   = '0000a403-0000-1000-8000-00805f9b34fb';
  window.MB_STOPBITS_UUID = '0000a404-0000-1000-8000-00805f9b34fb';
  window.MB_DATABITS_UUID = '0000a405-0000-1000-8000-00805f9b34fb';
  window.MB_TIMEOUT_UUID  = '0000a406-0000-1000-8000-00805f9b34fb';
  window.MB_POLLING_UUID  = '0000a407-0000-1000-8000-00805f9b34fb';
  window.MODBUS_QUERY_CHAR_UUID  = '0000a40b-0000-1000-8000-00805f9b34fb';
  window.MODBUS_RESPONSE_CHAR_UUID = '0000a40c-0000-1000-8000-00805f9b34fb';
  window.MODBUS_SUBSCRIBE_CHAR_UUID = '0000a40d-0000-1000-8000-00805f9b34fb';
  window.MODBUS_STREAM_CHAR_UUID    = '0000a40e-0000-1000-8000-00805f9b34fb';
  window.MODBUS_BULKWRITE_CHAR_UUID = '0000a40f-0000-1000-8000-00805f9b34fb';
}
// type=module: window.* otomatik lexical binding oluşturmaz
const MODBUS_SERVICE_UUID = window.MODBUS_SERVICE_UUID;
const MB_ADDR_UUID = window.MB_ADDR_UUID;
const MB_BAUD_UUID = window.MB_BAUD_UUID;
const MB_PARITY_UUID = window.MB_PARITY_UUID;
const MB_STOPBITS_UUID = window.MB_STOPBITS_UUID;
const MB_DATABITS_UUID = window.MB_DATABITS_UUID;
const MB_TIMEOUT_UUID = window.MB_TIMEOUT_UUID;
const MB_POLLING_UUID = window.MB_POLLING_UUID;
const MODBUS_QUERY_CHAR_UUID = window.MODBUS_QUERY_CHAR_UUID;
const MODBUS_RESPONSE_CHAR_UUID = window.MODBUS_RESPONSE_CHAR_UUID;
const MODBUS_SUBSCRIBE_CHAR_UUID = window.MODBUS_SUBSCRIBE_CHAR_UUID;
const MODBUS_STREAM_CHAR_UUID = window.MODBUS_STREAM_CHAR_UUID;
const MODBUS_BULKWRITE_CHAR_UUID = window.MODBUS_BULKWRITE_CHAR_UUID;

/** Select veya input’a değer yaz; listede yoksa geçici (cihaz) seçeneği ekle. */
function setGatewayModbusFieldValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const v = String(value);
  if (el.tagName !== 'SELECT') {
    el.value = v;
    return;
  }
  el.querySelectorAll('option[data-custom]').forEach(o => o.remove());
  let found = false;
  for (let i = 0; i < el.options.length; i++) {
    if (el.options[i].value === v) {
      found = true;
      break;
    }
  }
  if (!found) {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v + ' (cihaz)';
    opt.dataset.custom = '1';
    el.insertBefore(opt, el.firstChild);
  }
  el.value = v;
}

/** Konfig sayfasıyla aynı: okuma/yazma sonrası input flash. */
function flashFieldEl(el, color) {
  if (!el) return;
  el.classList.remove('field-busy');
  el.style.transition = 'background-color 0.3s';
  el.style.backgroundColor = color;
  setTimeout(function() { el.style.backgroundColor = ''; }, 800);
}

function getGatewayModbusFieldEls() {
  return Array.from(document.querySelectorAll('#tab-modbus input, #tab-modbus select'));
}

function getManualModbusFieldEls() {
  return Array.from(document.querySelectorAll('#tab-manual-modbus input, #tab-manual-modbus select'));
}

function setFieldsBusy(els, busy) {
  (els || []).forEach(function(el) {
    if (!el) return;
    if (busy) {
      el.classList.add('field-busy');
    } else {
      el.classList.remove('field-busy');
      el.style.backgroundColor = '';
    }
  });
}

function flashFields(els, color) {
  (els || []).forEach(function(el) { flashFieldEl(el, color); });
}

/**
 * Gateway’in RS-485 hat ayarlarını BLE GATT’tan okur (a401–a407, big-endian).
 * Query/Subscribe/Stream değildir; slave register okumaz.
 */
async function readGatewayModbusSettings() {
  const fields = getGatewayModbusFieldEls();
  setFieldsBusy(fields, true);
  const t0 = performance.now();
  try {
    const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
    const service = await server.getPrimaryService(MODBUS_SERVICE_UUID);

    const specs = [
      { id: 'mb_addr', uuid: MB_ADDR_UUID, parse: (v) => String(v.getUint8(0)) },
      { id: 'mb_baud', uuid: MB_BAUD_UUID, parse: (v) => String(parseGattUint32Be(v)) },
      { id: 'mb_parity', uuid: MB_PARITY_UUID, parse: (v) => String(v.getUint8(0)) },
      { id: 'mb_stopbits', uuid: MB_STOPBITS_UUID, parse: (v) => String(v.getUint8(0)) },
      { id: 'mb_databits', uuid: MB_DATABITS_UUID, parse: (v) => String(v.getUint8(0)) },
      { id: 'mb_timeout', uuid: MB_TIMEOUT_UUID, parse: (v) => String(parseGattUint32Be(v)) },
      { id: 'mb_polling', uuid: MB_POLLING_UUID, parse: (v) => String(parseGattUint32Be(v)) }
    ];

    const results = await Promise.all(specs.map(async (spec) => {
      const ch = await service.getCharacteristic(spec.uuid);
      const view = await ch.readValue();
      return { id: spec.id, value: spec.parse(view) };
    }));

    setFieldsBusy(fields, false);
    const byId = {};
    results.forEach(function(r) {
      byId[r.id] = r.value;
      setGatewayModbusFieldValue(r.id, r.value);
      flashFieldEl(document.getElementById(r.id), '#d1fae5');
    });
    logOk('Hat ayarları okundu (slave ' + (byId.mb_addr || '—') + ', ' + (byId.mb_baud || '—') + ' baud)', t0);
  } catch (e) {
    setFieldsBusy(fields, false);
    logFail('Hat ayarları okunamadı', e, t0);
  }
}

function setDeviceInfoField(id, value) {
  const el = document.getElementById(id);
  const text = (value != null && value !== '') ? String(value) : '—';
  if (el) {
    el.textContent = text;
    el.title = text === '—' ? '' : text;
  }
  if (id === 'di-sw') {
    const fwSw = document.getElementById('firmware-current-sw');
    if (fwSw) fwSw.textContent = text;
  }
}

function clearDeviceInfoUi(message) {
  ['di-model', 'di-sw', 'di-hw', 'di-eui', 'di-lorawan', 'di-workmode', 'di-geoloc', 'di-class', 'di-battery']
    .forEach(function(id) { setDeviceInfoField(id, '—'); });
  const status = document.getElementById('di-status');
  if (status) status.textContent = message || 'Cihaza bağlanınca okunur.';
}

/**
 * Device Info (0x180A) — SSOT: include/ble_services_characteristics_table.csv
 * Gelişmiş sekmesindeki gateway kartına yazar. Eksik karakteristikler — kalır.
 */
async function readDeviceInfo() {
  const status = document.getElementById('di-status');
  if (status) status.textContent = 'Okunuyor…';
  const t0 = performance.now();
  try {
    if (!device || !device.gatt || !device.gatt.connected) throw 'Bluetooth bağlantısı yok.';
    const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
    const service = await server.getPrimaryService(DEVICE_INFO_SERVICE_UUID);

    async function readOne(uuid, parseFn) {
      try {
        const ch = await service.getCharacteristic(uuid);
        const view = await ch.readValue();
        return parseFn(view);
      } catch (e) {
        return null;
      }
    }

    const model = await readOne(DI_MODEL_UUID, bufferToString);
    const sw = await readOne(DI_SW_UUID, bufferToString);
    const hw = await readOne(DI_HW_UUID, bufferToString);
    const eui = await readOne(DI_EUI_UUID, hexStringFromBuffer);
    const lorawan = await readOne(DI_LORAWAN_UUID, bufferToString);
    const workmode = await readOne(DI_WORKMODE_UUID, bufferToString);
    const geoloc = await readOne(DI_GEOLOC_UUID, bufferToString);
    const classType = await readOne(DI_CLASS_UUID, bufferToString);
    const battery = await readOne(DI_BATTERY_UUID, function(v) {
      return v.byteLength ? (v.getUint8(0) + ' %') : null;
    });

    setDeviceInfoField('di-model', model);
    setDeviceInfoField('di-sw', sw);
    setDeviceInfoField('di-hw', hw);
    setDeviceInfoField('di-eui', eui);
    setDeviceInfoField('di-lorawan', lorawan);
    setDeviceInfoField('di-workmode', workmode);
    setDeviceInfoField('di-geoloc', geoloc);
    setDeviceInfoField('di-class', classType);
    setDeviceInfoField('di-battery', battery);

    const any = model || sw || hw || eui;
    if (status) {
      status.textContent = any
        ? ('Okundu' + (model ? ' · ' + model : '') + (sw ? ' · v' + sw : ''))
        : 'Device Info karakteristikleri bulunamadı.';
    }
    if (any) logOk('Device Info okundu' + (model ? ' (' + model + ')' : ''), t0);
    else logMsg('Device Info servisi erişildi ama alanlar boş/eksik.');
  } catch (e) {
    clearDeviceInfoUi('Device Info okunamadı.');
    logFail('Device Info okunamadı', e, t0);
  }
}

// ——— Manuel Modbus (Query/Response) ———
let manualModbusTransId = 0;

/**
 * Manuel Modbus istek paketi oluşturur. Tüm sayısal alanlar big-endian.
 * Format: [transId, slaveId, func, startAddr_be16, qty_be16, ...payload]
 * 0x06: qty=1 + value_be16 (toplam 9 byte). 0x10: qty + values.
 * @param {number} slaveId 1–247
 * @param {number} func 3, 4, 6 veya 16
 * @param {number} startAddr 0–65535
 * @param {number} qty 1–64 (okuma veya 0x10 yazma)
 * @param {number[]} [values] 0x06 için [value], 0x10 için [v1, v2, ...]
 * @returns {Uint8Array} Paket (max 150 byte)
 */
function buildModbusQueryPacket(slaveId, func, startAddr, qty, values) {
  if (slaveId < 1 || slaveId > 247) return null;
  const f = parseInt(func, 10);
  let length = 7;
  if (f === 0x06) length = 9;
  else if (f === 0x10) length = 7 + (qty * 2);
  if (length > 150) return null;
  if ((f === 0x03 || f === 0x04 || f === 0x10) && (qty < 1 || qty > 64)) return null;
  const buf = new ArrayBuffer(length);
  const view = new DataView(buf);
  const tId = (manualModbusTransId++) & 0xff;
  view.setUint8(0, tId);
  view.setUint8(1, slaveId);
  view.setUint8(2, f);
  view.setUint16(3, startAddr, false);
  if (f === 0x06) {
    view.setUint16(5, 1, false);
    if (values && values.length >= 1) {
      view.setUint16(7, values[0] & 0xffff, false);
    } else {
      return null;
    }
  } else {
    view.setUint16(5, qty, false);
    if (f === 0x10 && values && values.length >= qty) {
      for (let i = 0; i < qty; i++) {
        view.setUint16(7 + i * 2, values[i] & 0xffff, false);
      }
    } else if (f === 0x10) {
      return null;
    }
  }
  return new Uint8Array(buf);
}

/**
 * Response buffer'ını parse eder: transId, status, (okuma ise) register dizisi.
 * BulkWrite hata: [transId, status, failRangeIndex]
 * @param {DataView} view
 * @returns {{ transId: number, status: number, registers?: number[], failRangeIndex?: number }}
 */
function parseModbusResponse(view) {
  if (view.byteLength < 2) return { transId: 0, status: 0xff };
  const transId = view.getUint8(0);
  const status = view.getUint8(1);
  const result = { transId, status };
  if (status !== 0) {
    if (view.byteLength >= 3) result.failRangeIndex = view.getUint8(2);
    return result;
  }
  if (view.byteLength >= 4) {
    const dataLen = view.byteLength - 2;
    const regCount = dataLen >> 1;
    result.registers = [];
    for (let i = 0; i < regCount; i++) {
      result.registers.push(view.getUint16(2 + i * 2, false));
    }
  }
  return result;
}

function statusCodeToText(code) {
  const map = {
    0: 'Başarı',
    0x01: 'Illegal function (desteklenmeyen FC)',
    0x02: 'Illegal data address',
    0x03: 'Illegal data value',
    0xE1: 'Bad format (Subscribe/BulkWrite)',
    0xE2: 'Timeout / cevap yok (RS-485)',
    0xE4: 'Invalid slave'
  };
  return map[code] != null ? map[code] : 'Hata kodu: 0x' + (code & 0xff).toString(16).toUpperCase();
}

function estimateModbusWaitMs(packet) {
  let ms = 400;
  if (packet && packet.length >= 7) {
    const func = packet[2];
    const qty = (packet[5] << 8) | packet[6];
    if (func === 0x03 || func === 0x04) {
      ms = 350 + Math.min(qty, 64) * 12;
    } else if (func === 0x06 || func === 0x10) {
      ms = 450;
    }
  }
  const timeoutEl = document.getElementById('mb_timeout');
  if (timeoutEl && timeoutEl.value !== '') {
    const t = parseInt(timeoutEl.value, 10);
    if (!Number.isNaN(t) && t > 0) ms = Math.max(ms, t);
  }
  return Math.min(Math.max(ms, 250), 2500);
}

function estimateBulkWriteWaitMs(packet) {
  let sumQty = 1;
  if (packet && packet.length >= 4) {
    const rangeCount = packet[3] & 0xff;
    let pos = 4;
    sumQty = 0;
    for (let r = 0; r < rangeCount && pos + 4 <= packet.length; r++) {
      const qty = (packet[pos + 2] << 8) | packet[pos + 3];
      sumQty += qty;
      pos += 4 + qty * 2;
    }
    if (sumQty < 1) sumQty = 1;
  }
  let ms = 450 + Math.min(sumQty, 64) * 20;
  const timeoutEl = document.getElementById('mb_timeout');
  if (timeoutEl && timeoutEl.value !== '') {
    const t = parseInt(timeoutEl.value, 10);
    if (!Number.isNaN(t) && t > 0) ms = Math.max(ms, t);
  }
  return Math.min(Math.max(ms, 400), 5000);
}

/** BLE Query/Response tek kanallı — istekleri sıraya al. */
let modbusRequestChain = Promise.resolve();

/** Response notify state (BLE cevap bekleyicileri; LiveModbus heldRegs ile karıştırma). */
let modbusResponseChar = null;
let modbusNotifyReady = false;
let awaitingByTransId = Object.create(null);
let modbusNotifyHandler = null;

/** GATT handle cache — her istekte getPrimaryService/getCharacteristic tekrarını azalt. */
let modbusGattCache = {
  service: null,
  queryChar: null,
  responseChar: null,
  subscribeChar: null,
  streamChar: null,
  bulkWriteChar: null
};

/** Subscribe / Stream state */
let modbusStreamSupport = null; // null=unknown, true/false
let modbusBulkWriteSupport = null; // null=unknown, true/false
let modbusStreamChar = null;
let modbusStreamNotifyReady = false;
let modbusStreamHandler = null;
let modbusStreamListeners = [];
let modbusActiveSubEpoch = -1;
let modbusStreamChunkBuf = null; // { epoch, seq, chunkCount, chunks: (Uint8Array|null)[], received }

function clearModbusGattCache() {
  modbusGattCache = {
    service: null,
    queryChar: null,
    responseChar: null,
    subscribeChar: null,
    streamChar: null,
    bulkWriteChar: null
  };
  modbusStreamSupport = null;
  modbusBulkWriteSupport = null;
}

async function getModbusServiceCached() {
  if (!device || !device.gatt) throw new Error('Bluetooth cihazı yok');
  const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
  if (modbusGattCache.service) return modbusGattCache.service;
  const service = await server.getPrimaryService(MODBUS_SERVICE_UUID);
  modbusGattCache.service = service;
  return service;
}

async function getModbusCharCached(key, uuid) {
  if (modbusGattCache[key]) return modbusGattCache[key];
  const service = await getModbusServiceCached();
  const ch = await service.getCharacteristic(uuid);
  modbusGattCache[key] = ch;
  return ch;
}

function copyModbusDataView(value) {
  const data = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  const copy = new Uint8Array(data);
  return new DataView(copy.buffer);
}

function onModbusResponseNotify(event) {
  try {
    const view = copyModbusDataView(event.target.value);
    const parsed = parseModbusResponse(view);
    const waiter = awaitingByTransId[parsed.transId];
    if (waiter && typeof waiter.resolve === 'function') {
      waiter.resolve(parsed);
    }
  } catch (e) {
    /* ignore malformed notify */
  }
}

/**
 * Response (a40c) üzerinde Notify kur. Başarısızsa sleep+read fallback kullanılır.
 */
async function setupModbusResponseNotify() {
  await teardownModbusResponseNotify();
  if (!device || !device.gatt || !device.gatt.connected) return false;
  try {
    const responseChar = await getModbusCharCached('responseChar', MODBUS_RESPONSE_CHAR_UUID);
    modbusNotifyHandler = onModbusResponseNotify;
    responseChar.addEventListener('characteristicvaluechanged', modbusNotifyHandler);
    await responseChar.startNotifications();
    modbusResponseChar = responseChar;
    modbusNotifyReady = true;
    logMsg('Modbus Response notify aktif.');
    return true;
  } catch (e) {
    modbusResponseChar = null;
    modbusNotifyReady = false;
    modbusNotifyHandler = null;
    logMsg('Modbus Response notify açılamadı (sleep+read): ' + e);
    return false;
  }
}

/**
 * Notify dinleyicisini kapat; bekleyen istekleri timeout ile çöz.
 */
async function teardownModbusResponseNotify() {
  const pending = awaitingByTransId;
  awaitingByTransId = Object.create(null);
  Object.keys(pending).forEach(function(tid) {
    const w = pending[tid];
    if (w && typeof w.resolve === 'function') {
      w.resolve({ transId: parseInt(tid, 10) & 0xff, status: 0xE2 });
    }
  });

  if (modbusResponseChar && modbusNotifyHandler) {
    try {
      modbusResponseChar.removeEventListener('characteristicvaluechanged', modbusNotifyHandler);
    } catch (e) { /* ignore */ }
    try {
      if (device && device.gatt && device.gatt.connected) {
        await modbusResponseChar.stopNotifications();
      }
    } catch (e) { /* ignore */ }
  }
  modbusResponseChar = null;
  modbusNotifyReady = false;
  modbusNotifyHandler = null;
}

function emitModbusStreamEvent(evt) {
  modbusStreamListeners.forEach(function(fn) {
    try { fn(evt); } catch (e) { /* ignore listener errors */ }
  });
}

function resetModbusStreamChunkBuf() {
  modbusStreamChunkBuf = null;
}

function onModbusStreamNotify(event) {
  try {
    const view = copyModbusDataView(event.target.value);
    if (view.byteLength < 5) return;
    const subEpoch = view.getUint8(0);
    const seq = view.getUint8(1);
    const chunkIndex = view.getUint8(2);
    const chunkCount = view.getUint8(3);
    const status = view.getUint8(4);

    if (modbusActiveSubEpoch >= 0 && subEpoch !== (modbusActiveSubEpoch & 0xff)) {
      return; // stale epoch
    }

    if (status !== 0) {
      resetModbusStreamChunkBuf();
      emitModbusStreamEvent({
        type: 'error',
        subEpoch: subEpoch,
        seq: seq,
        status: status,
        message: typeof statusCodeToText === 'function' ? statusCodeToText(status) : ('status 0x' + status.toString(16))
      });
      return;
    }

    if (chunkCount < 1 || chunkIndex >= chunkCount) return;

    const payload = new Uint8Array(view.buffer, view.byteOffset + 5, view.byteLength - 5);

    if (!modbusStreamChunkBuf ||
        modbusStreamChunkBuf.epoch !== subEpoch ||
        modbusStreamChunkBuf.seq !== seq ||
        modbusStreamChunkBuf.chunkCount !== chunkCount) {
      modbusStreamChunkBuf = {
        epoch: subEpoch,
        seq: seq,
        chunkCount: chunkCount,
        chunks: new Array(chunkCount),
        received: 0
      };
    }

    if (!modbusStreamChunkBuf.chunks[chunkIndex]) {
      modbusStreamChunkBuf.chunks[chunkIndex] = payload;
      modbusStreamChunkBuf.received++;
    }

    if (modbusStreamChunkBuf.received < chunkCount) return;

    let totalLen = 0;
    for (let i = 0; i < chunkCount; i++) {
      if (!modbusStreamChunkBuf.chunks[i]) {
        resetModbusStreamChunkBuf();
        return;
      }
      totalLen += modbusStreamChunkBuf.chunks[i].length;
    }
    const merged = new Uint8Array(totalLen);
    let off = 0;
    for (let i = 0; i < chunkCount; i++) {
      merged.set(modbusStreamChunkBuf.chunks[i], off);
      off += modbusStreamChunkBuf.chunks[i].length;
    }
    resetModbusStreamChunkBuf();

    const registers = [];
    const dv = new DataView(merged.buffer, merged.byteOffset, merged.byteLength);
    for (let i = 0; i + 1 < merged.byteLength; i += 2) {
      registers.push(dv.getUint16(i, false)); // big-endian
    }

    emitModbusStreamEvent({
      type: 'snapshot',
      subEpoch: subEpoch,
      seq: seq,
      status: 0,
      registers: registers
    });
  } catch (e) {
    /* ignore malformed stream notify */
  }
}

/**
 * Stream (a40e) üzerinde Notify kur.
 */
async function setupModbusStreamNotify() {
  await teardownModbusStreamNotify();
  if (!device || !device.gatt || !device.gatt.connected) return false;
  try {
    const streamChar = await getModbusCharCached('streamChar', MODBUS_STREAM_CHAR_UUID);
    modbusStreamHandler = onModbusStreamNotify;
    streamChar.addEventListener('characteristicvaluechanged', modbusStreamHandler);
    await streamChar.startNotifications();
    modbusStreamChar = streamChar;
    modbusStreamNotifyReady = true;
    modbusStreamSupport = true;
    logMsg('Modbus Stream notify aktif.');
    return true;
  } catch (e) {
    modbusStreamChar = null;
    modbusStreamNotifyReady = false;
    modbusStreamHandler = null;
    if (modbusStreamSupport !== true) modbusStreamSupport = false;
    logMsg('Modbus Stream notify açılamadı (Query fallback): ' + e);
    return false;
  }
}

async function teardownModbusStreamNotify() {
  resetModbusStreamChunkBuf();
  modbusActiveSubEpoch = -1;
  if (modbusStreamChar && modbusStreamHandler) {
    try {
      modbusStreamChar.removeEventListener('characteristicvaluechanged', modbusStreamHandler);
    } catch (e) { /* ignore */ }
    try {
      if (device && device.gatt && device.gatt.connected) {
        await modbusStreamChar.stopNotifications();
      }
    } catch (e) { /* ignore */ }
  }
  modbusStreamChar = null;
  modbusStreamNotifyReady = false;
  modbusStreamHandler = null;
}

/**
 * Subscribe/Stream destekleniyor mu? Sonucu cache’ler.
 */
async function probeModbusStreamSupport() {
  if (modbusStreamSupport === true || modbusStreamSupport === false) return modbusStreamSupport;
  if (!device || !device.gatt || !device.gatt.connected) return false;
  try {
    await getModbusCharCached('streamChar', MODBUS_STREAM_CHAR_UUID);
    await getModbusCharCached('subscribeChar', MODBUS_SUBSCRIBE_CHAR_UUID);
    modbusStreamSupport = true;
  } catch (e) {
    modbusStreamSupport = false;
  }
  return modbusStreamSupport;
}

function isModbusStreamSupported() {
  return modbusStreamSupport === true;
}

/**
 * Subscribe WRITE paketi.
 * opcode 0x01 = continuous (intervalMs: 0 = unsubscribe)
 * opcode 0x02 = one-shot (tek Stream turu; intervalMs yok sayılır)
 * Format: [opcode, subEpoch, slave, func, intervalMs_be16, rangeCount, ...ranges]
 * @param {{opcode?:number, subEpoch:number, slaveId:number, func:number, intervalMs?:number, ranges:{start:number,qty:number}[]}} opts
 */
function buildModbusSubscribePacket(opts) {
  if (!opts) return null;
  const opcode = (opts.opcode != null ? opts.opcode : 0x01) & 0xff;
  const subEpoch = (opts.subEpoch != null ? opts.subEpoch : 0) & 0xff;
  const slaveId = opts.slaveId | 0;
  const func = opts.func | 0;
  let intervalMs = opts.intervalMs != null ? (opts.intervalMs | 0) : 0;
  const ranges = Array.isArray(opts.ranges) ? opts.ranges : [];

  if (opcode !== 0x01 && opcode !== 0x02) return null;
  if (slaveId < 1 || slaveId > 247) return null;
  if (ranges.length > 16) return null;

  let sumQty = 0;
  for (let i = 0; i < ranges.length; i++) {
    const q = ranges[i].qty | 0;
    if (q < 1 || q > 128) return null;
    sumQty += q;
  }

  let rangeCount;
  if (opcode === 0x02) {
    // one-shot: interval yok sayılır; en az bir range şart
    intervalMs = 0;
    if (ranges.length < 1 || sumQty < 1 || sumQty > 128) return null;
    if (func !== 0x03 && func !== 0x04) return null;
    rangeCount = ranges.length;
  } else {
    // continuous
    if (intervalMs !== 0) {
      intervalMs = Math.min(5000, Math.max(200, intervalMs));
    }
    if (func !== 0x03 && func !== 0x04 && intervalMs !== 0) return null;
    if (intervalMs !== 0 && (ranges.length < 1 || sumQty < 1 || sumQty > 128)) return null;
    rangeCount = intervalMs === 0 ? 0 : ranges.length;
  }

  const packet = new Uint8Array(7 + rangeCount * 4);
  packet[0] = opcode;
  packet[1] = subEpoch;
  packet[2] = slaveId & 0xff;
  packet[3] = func & 0xff;
  packet[4] = (intervalMs >> 8) & 0xff;
  packet[5] = intervalMs & 0xff;
  packet[6] = rangeCount & 0xff;
  for (let i = 0; i < rangeCount; i++) {
    const start = ranges[i].start & 0xffff;
    const qty = ranges[i].qty & 0xffff;
    const off = 7 + i * 4;
    packet[off] = (start >> 8) & 0xff;
    packet[off + 1] = start & 0xff;
    packet[off + 2] = (qty >> 8) & 0xff;
    packet[off + 3] = qty & 0xff;
  }
  return packet;
}

async function writeModbusSubscribe(packet) {
  if (!packet || !(packet instanceof Uint8Array)) throw new Error('Geçersiz Subscribe paketi');
  const run = async () => {
    const subscribeChar = await getModbusCharCached('subscribeChar', MODBUS_SUBSCRIBE_CHAR_UUID);
    if (packet.length >= 2) {
      modbusActiveSubEpoch = packet[1] & 0xff;
    }
    resetModbusStreamChunkBuf();
    if (typeof subscribeChar.writeValueWithoutResponse === 'function') {
      try {
        await subscribeChar.writeValueWithoutResponse(packet);
        return;
      } catch (e) { /* fall through to writeValue */ }
    }
    await subscribeChar.writeValue(packet);
  };
  const resultPromise = modbusRequestChain.then(run, run);
  modbusRequestChain = resultPromise.then(function() {}, function() {});
  return resultPromise;
}

function setModbusActiveSubEpoch(epoch) {
  modbusActiveSubEpoch = epoch & 0xff;
  resetModbusStreamChunkBuf();
}

function addModbusStreamListener(fn) {
  if (typeof fn === 'function' && modbusStreamListeners.indexOf(fn) === -1) {
    modbusStreamListeners.push(fn);
  }
}

function removeModbusStreamListener(fn) {
  const idx = modbusStreamListeners.indexOf(fn);
  if (idx >= 0) modbusStreamListeners.splice(idx, 1);
}

/**
 * BulkWrite paketi: [0x20, transId, slave, rangeCount, ...ranges]
 * Her range: start_be16, qty_be16, qty × value_be16
 * @param {number} slaveId
 * @param {{start:number, values:number[]}[]} ranges
 * @returns {Uint8Array|null}
 */
function buildModbusBulkWritePacket(slaveId, ranges) {
  if (slaveId < 1 || slaveId > 247) return null;
  if (!Array.isArray(ranges) || ranges.length < 1 || ranges.length > 16) return null;

  let sumQty = 0;
  let payloadBytes = 0;
  for (let i = 0; i < ranges.length; i++) {
    const vals = ranges[i].values;
    if (!vals || !vals.length) return null;
    const qty = vals.length;
    if (qty < 1 || qty > 64) return null;
    sumQty += qty;
    payloadBytes += 4 + qty * 2;
  }
  if (sumQty < 1 || sumQty > 64) return null;

  const totalLen = 4 + payloadBytes;
  if (totalLen > 400) return null;

  const packet = new Uint8Array(totalLen);
  const tId = (manualModbusTransId++) & 0xff;
  packet[0] = 0x20;
  packet[1] = tId;
  packet[2] = slaveId & 0xff;
  packet[3] = ranges.length & 0xff;
  let pos = 4;
  for (let i = 0; i < ranges.length; i++) {
    const start = ranges[i].start & 0xffff;
    const vals = ranges[i].values;
    const qty = vals.length;
    packet[pos] = (start >> 8) & 0xff;
    packet[pos + 1] = start & 0xff;
    packet[pos + 2] = (qty >> 8) & 0xff;
    packet[pos + 3] = qty & 0xff;
    pos += 4;
    for (let j = 0; j < qty; j++) {
      const v = vals[j] & 0xffff;
      packet[pos] = (v >> 8) & 0xff;
      packet[pos + 1] = v & 0xff;
      pos += 2;
    }
  }
  return packet;
}

async function probeModbusBulkWriteSupport() {
  if (modbusBulkWriteSupport === true || modbusBulkWriteSupport === false) return modbusBulkWriteSupport;
  if (!device || !device.gatt || !device.gatt.connected) return false;
  try {
    await getModbusCharCached('bulkWriteChar', MODBUS_BULKWRITE_CHAR_UUID);
    modbusBulkWriteSupport = true;
  } catch (e) {
    modbusBulkWriteSupport = false;
  }
  return modbusBulkWriteSupport;
}

function isModbusBulkWriteSupported() {
  return modbusBulkWriteSupport === true;
}

/**
 * BulkWrite yazar; Response notify/read ile [transId, status, ...] bekler.
 */
async function sendModbusBulkWrite(packet) {
  if (!packet || !(packet instanceof Uint8Array) || packet.length < 4 || packet[0] !== 0x20) {
    throw new Error('Geçersiz BulkWrite paketi');
  }
  const run = async () => {
    const bulkChar = await getModbusCharCached('bulkWriteChar', MODBUS_BULKWRITE_CHAR_UUID);
    let responseChar = modbusResponseChar || modbusGattCache.responseChar;
    if (!responseChar) {
      responseChar = await getModbusCharCached('responseChar', MODBUS_RESPONSE_CHAR_UUID);
    }

    if (!modbusNotifyReady) {
      try {
        if (!modbusResponseChar) await setupModbusResponseNotify();
      } catch (e) { /* fallback */ }
      responseChar = modbusResponseChar || responseChar;
    }

    const transId = packet[1] & 0xff;
    const timeoutMs = estimateBulkWriteWaitMs(packet);

    if (modbusNotifyReady && modbusResponseChar) {
      let settled = false;
      const responsePromise = new Promise(function(resolve) {
        const timer = setTimeout(async function() {
          if (settled) return;
          try {
            const value = await modbusResponseChar.readValue();
            const parsed = parseModbusResponse(copyModbusDataView(value));
            if (!settled && parsed.transId === transId) {
              settled = true;
              delete awaitingByTransId[transId];
              clearTimeout(timer);
              resolve(parsed);
              return;
            }
          } catch (e) { /* ignore */ }
          if (!settled) {
            settled = true;
            delete awaitingByTransId[transId];
            resolve({ transId: transId, status: 0xE2 });
          }
        }, timeoutMs);

        awaitingByTransId[transId] = {
          resolve: function(parsed) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            delete awaitingByTransId[transId];
            resolve(parsed);
          }
        };
      });

      if (typeof bulkChar.writeValueWithoutResponse === 'function') {
        try {
          await bulkChar.writeValueWithoutResponse(packet);
        } catch (e) {
          await bulkChar.writeValue(packet);
        }
      } else {
        await bulkChar.writeValue(packet);
      }
      return responsePromise;
    }

    if (typeof bulkChar.writeValueWithoutResponse === 'function') {
      try {
        await bulkChar.writeValueWithoutResponse(packet);
      } catch (e) {
        await bulkChar.writeValue(packet);
      }
    } else {
      await bulkChar.writeValue(packet);
    }
    await sleep(timeoutMs);
    const value = await responseChar.readValue();
    return parseModbusResponse(copyModbusDataView(value));
  };
  const resultPromise = modbusRequestChain.then(run, run);
  modbusRequestChain = resultPromise.then(function() {}, function() {});
  return resultPromise;
}

/**
 * Query yazar; Notify varsa cevap gelince resolve, yoksa sleep+read.
 */
async function sendModbusRequest(packet) {
  const run = async () => {
    const queryChar = await getModbusCharCached('queryChar', MODBUS_QUERY_CHAR_UUID);
    let responseChar = modbusResponseChar || modbusGattCache.responseChar;
    if (!responseChar) {
      responseChar = await getModbusCharCached('responseChar', MODBUS_RESPONSE_CHAR_UUID);
    }

    if (!modbusNotifyReady) {
      try {
        if (!modbusResponseChar) {
          await setupModbusResponseNotify();
        }
      } catch (e) { /* fallback below */ }
      responseChar = modbusResponseChar || responseChar;
    }

    if (modbusNotifyReady && modbusResponseChar) {
      const transId = packet[0] & 0xff;
      const timeoutMs = estimateModbusWaitMs(packet);
      let settled = false;

      const responsePromise = new Promise(function(resolve) {
        const timer = setTimeout(async function() {
          if (settled) return;
          try {
            const value = await modbusResponseChar.readValue();
            const parsed = parseModbusResponse(copyModbusDataView(value));
            if (!settled && parsed.transId === transId) {
              settled = true;
              delete awaitingByTransId[transId];
              clearTimeout(timer);
              resolve(parsed);
              return;
            }
          } catch (e) { /* ignore read fallback errors */ }
          if (!settled) {
            settled = true;
            delete awaitingByTransId[transId];
            resolve({ transId: transId, status: 0xE2 });
          }
        }, timeoutMs);

        awaitingByTransId[transId] = {
          resolve: function(parsed) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            delete awaitingByTransId[transId];
            resolve(parsed);
          }
        };
      });

      await queryChar.writeValue(packet);
      return responsePromise;
    }

    await queryChar.writeValue(packet);
    await sleep(estimateModbusWaitMs(packet));
    const value = await responseChar.readValue();
    return parseModbusResponse(copyModbusDataView(value));
  };
  const resultPromise = modbusRequestChain.then(run, run);
  modbusRequestChain = resultPromise.then(function() {}, function() {});
  return resultPromise;
}

async function teardownAllModbusBle() {
  await teardownModbusStreamNotify();
  await teardownModbusResponseNotify();
  clearModbusGattCache();
}

// Live Modbus / sayfa poller API
window.isBleConnected = isBleConnected;
window.buildModbusQueryPacket = buildModbusQueryPacket;
window.sendModbusRequest = sendModbusRequest;
window.buildModbusSubscribePacket = buildModbusSubscribePacket;
window.writeModbusSubscribe = writeModbusSubscribe;
window.buildModbusBulkWritePacket = buildModbusBulkWritePacket;
window.sendModbusBulkWrite = sendModbusBulkWrite;
window.probeModbusBulkWriteSupport = probeModbusBulkWriteSupport;
window.isModbusBulkWriteSupported = isModbusBulkWriteSupported;
window.probeModbusStreamSupport = probeModbusStreamSupport;
window.isModbusStreamSupported = isModbusStreamSupported;
window.setupModbusStreamNotify = setupModbusStreamNotify;
window.teardownModbusStreamNotify = teardownModbusStreamNotify;
window.addModbusStreamListener = addModbusStreamListener;
window.removeModbusStreamListener = removeModbusStreamListener;
window.setModbusActiveSubEpoch = setModbusActiveSubEpoch;
window.statusCodeToText = statusCodeToText;
window.parseModbusResponse = parseModbusResponse;
window.logMsg = logMsg;
window.logOk = logOk;
window.logFail = logFail;
window.simpleLogError = simpleLogError;

function bufferToString(dataView) {
  let str = '';
  for (let i = 0; i < dataView.byteLength; i++) {
    const char = dataView.getUint8(i);
    if (char === 0) break;
    str += String.fromCharCode(char);
  }
  return str;
}

function hexStringFromBuffer(dataView) {
  let hex = '';
  for (let i = 0; i < dataView.byteLength; i++) {
    const v = dataView.getUint8(i);
    hex += v.toString(16).padStart(2, '0').toUpperCase();
  }
  return hex;
}

// LoRaWAN karakteristiklerini toplu okuma fonksiyonu
async function readLoRaWANAll() {
  const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
  // Device EUI
  try {
    const deveuiChar = await server.getPrimaryService(LORAWAN_SERVICE_UUID).then(s => s.getCharacteristic(DEVEUI_CHAR_UUID));
    const dataView = await deveuiChar.readValue();
    logMsg('Device EUI DataView.byteLength: ' + dataView.byteLength);
    let rawArr = [];
    for (let i = 0; i < dataView.byteLength; i++) rawArr.push(dataView.getUint8(i).toString(16).padStart(2, '0'));
    logMsg('Device EUI raw bytes: ' + rawArr.join(' '));
    const value = hexStringFromBuffer(dataView);
    document.getElementById('device_eui').value = value;
    logMsg('Device EUI okundu: ' + value);
  } catch (e) {
    logMsg('Device EUI okunamadı: ' + e);
  }
  // APP EUI
  try {
    const appeuiChar = await server.getPrimaryService(LORAWAN_SERVICE_UUID).then(s => s.getCharacteristic(APPEUI_CHAR_UUID));
    const value = hexStringFromBuffer(await appeuiChar.readValue());
    document.getElementById('app_eui').value = value;
    logMsg('APP EUI okundu: ' + value);
  } catch (e) {
    logMsg('APP EUI okunamadı: ' + e);
  }
  // APP Key
  try {
    const appkeyChar = await server.getPrimaryService(LORAWAN_SERVICE_UUID).then(s => s.getCharacteristic(APPKEY_CHAR_UUID));
    const value = hexStringFromBuffer(await appkeyChar.readValue());
    document.getElementById('app_key').value = value;
    logMsg('APP Key okundu: ' + value);
  } catch (e) {
    logMsg('APP Key okunamadı: ' + e);
  }
  // Platform
  try {
    const platformChar = await server.getPrimaryService(LORAWAN_SERVICE_UUID).then(s => s.getCharacteristic(PLATFORM_CHAR_UUID));
    const value = bufferToString(await platformChar.readValue());
    document.getElementById('platform').value = value;
    logMsg('Platform okundu: ' + value);
  } catch (e) {
    logMsg('Platform okunamadı: ' + e);
  }
  // Freq
  try {
    const freqChar = await server.getPrimaryService(LORAWAN_SERVICE_UUID).then(s => s.getCharacteristic(FREQ_CHAR_UUID));
    const value = bufferToString(await freqChar.readValue());
    document.getElementById('freq').value = value;
    logMsg('Freq okundu: ' + value);
  } catch (e) {
    logMsg('Freq okunamadı: ' + e);
  }
  // PckPo
  try {
    const pckpoChar = await server.getPrimaryService(LORAWAN_SERVICE_UUID).then(s => s.getCharacteristic(PCKPO_CHAR_UUID));
    const pckpoVal = await pckpoChar.readValue();
    const value = pckpoVal.getUint8(0).toString();
    document.getElementById('pckpo').value = value;
    logMsg('Paket politikası okundu: ' + value);
  } catch (e) {
    logMsg('Paket politikası okunamadı: ' + e);
  }
  // ADR
  try {
    const adrChar = await server.getPrimaryService(LORAWAN_SERVICE_UUID).then(s => s.getCharacteristic(ADR_CHAR_UUID));
    const adrVal = await adrChar.readValue();
    const value = adrVal.getUint8(0).toString();
    document.getElementById('adr').value = value;
    logMsg('ADR okundu: ' + value);
  } catch (e) {
    logMsg('ADR okunamadı: ' + e);
  }
}

// clickConnect fonksiyonunda LoRaWAN okuma işlemlerinden sonra:
// await readGatewayModbusSettings();

document.addEventListener('DOMContentLoaded', () => {
  const deviceEui = document.getElementById('device_eui');
  const appEui = document.getElementById('app_eui');
  const appKey = document.getElementById('app_key');
  [
    {el: deviceEui, max: 16, label: 'Device EUI'},
    {el: appEui, max: 16, label: 'APP EUI'},
    {el: appKey, max: 32, label: 'APP KEY'}
  ].forEach(({el, max, label}) => {
    if (!el) return;
    el.addEventListener('keyup', (event) => {
      let regEx = /^[0-9a-fA-F]+$/;
      let isHex = regEx.test(event.target.value.toString());
      if ((!isHex && event.target.value.length > 0) || event.target.value.length > max) {
        event.target.value = event.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, max);
      }
      console.log(label + ' input:', event.target.value);
    });
  });
  const butConnect = document.getElementById('butConnect');
  if (butConnect && typeof clickConnect === 'function') {
    butConnect.addEventListener('click', clickConnect);
  }
  // İşlem logu: sağ sidecar
  const toggleLog = document.getElementById('toggleLog');
  const logDrawerClose = document.getElementById('log-drawer-close');
  const logDrawerOverlay = document.getElementById('log-drawer-overlay');
  if (toggleLog) toggleLog.addEventListener('click', toggleLogDrawer);
  if (logDrawerClose) logDrawerClose.addEventListener('click', () => setLogDrawerOpen(false));
  if (logDrawerOverlay) logDrawerOverlay.addEventListener('click', () => setLogDrawerOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isLogDrawerOpen()) setLogDrawerOpen(false);
  });
  console.log('Sadece hex karakter ve max uzunluk için keyup event ile kontrol aktif.');
  const commitBtn = document.getElementById('commit_and_restart');
  if (commitBtn) {
    commitBtn.addEventListener('click', async () => {
      let yazildi = false;
      const t0 = performance.now();
      try {
        if (!device || !device.gatt.connected) {
          logFail('Yeniden başlatılamadı', 'Cihaz bağlı değil.');
          return;
        }
        const server = device.gatt;
        let service = await server.getPrimaryService(SYSTEM_SERVICE_UUID);
        let characteristic = await service.getCharacteristic(COMMIT_CHAR_UUID);
        await characteristic.writeValue(Uint8Array.of(0x01));
        yazildi = true;
        setCommitPending(false);
        logOk('Ayarlar kaydedildi, cihaz yeniden başlatılıyor', t0);
      } catch (err) {
        console.warn('Commit işlemi sırasında hata:', err);
        logFail('Yeniden başlatma başarısız', err, t0);
      } finally {
        if (device && device.gatt.connected) {
          if (window.ReconnectBanner) ReconnectBanner.markIntentional();
          device.gatt.disconnect();
          logMsg('BLE bağlantısı kapatıldı.');
        } else if (!yazildi) {
          logMsg('BLE bağlantısı cihaz tarafından kesildi.');
        }
      }
    });
  }
  const editGatewayBtn = document.getElementById('edit_gateway_modbus');
  if (editGatewayBtn) {
    editGatewayBtn.addEventListener('click', async () => {
      if (!isBleConnected()) return;
      if (gatewayModbusEditMode) {
        setGatewayModbusEditMode(false);
        logMsg('Düzenleme iptal edildi.');
        try {
          await readGatewayModbusSettings();
        } catch (e) {
          logFail('İptal sonrası okuma', e);
        }
        return;
      }
      setGatewayModbusEditMode(true);
      logMsg('Düzenleme açık — değiştirip «Yaz»a basın.');
    });
  }

  // ——— Manuel Modbus sekmesi ———
  const mmFunc = document.getElementById('mm_func');
  const mmQtyRow = document.getElementById('mm_qty_row');
  const mmWriteSingleRow = document.getElementById('mm_write_single_row');
  const mmWriteMultiRow = document.getElementById('mm_write_multi_row');
  const mmResultStatus = document.getElementById('mm_result_status');
  const mmResultData = document.getElementById('mm_result_data');

  function updateManualModbusFields() {
    const v = mmFunc ? parseInt(mmFunc.value, 10) : 3;
    if (mmQtyRow) mmQtyRow.style.display = (v === 3 || v === 4 || v === 16) ? '' : 'none';
    if (mmWriteSingleRow) mmWriteSingleRow.style.display = (v === 6) ? '' : 'none';
    if (mmWriteMultiRow) mmWriteMultiRow.style.display = (v === 16) ? '' : 'none';
  }
  if (mmFunc) {
    mmFunc.addEventListener('change', updateManualModbusFields);
    updateManualModbusFields();
  }

  function parseRegisterValue(str) {
    const s = String(str).trim();
    if (/^0x[0-9a-fA-F]+$/.test(s)) return parseInt(s, 16) & 0xffff;
    const n = parseInt(s, 10);
    if (!Number.isNaN(n) && n >= 0 && n <= 65535) return n;
    return null;
  }

  function setManualModbusResult(statusText, dataHtml) {
    if (mmResultStatus) mmResultStatus.textContent = statusText;
    if (mmResultData) {
      mmResultData.innerHTML = dataHtml != null ? dataHtml : '';
      mmResultData.style.display = dataHtml ? 'block' : 'none';
    }
  }

  document.getElementById('mm_btn_read')?.addEventListener('click', async () => {
    const slave = parseInt(document.getElementById('mm_slave').value, 10);
    const func = parseInt(document.getElementById('mm_func').value, 10);
    const start = parseInt(document.getElementById('mm_start').value, 10) || 0;
    const qty = parseInt(document.getElementById('mm_qty').value, 10) || 1;
    if (func !== 3 && func !== 4) return;
    if (qty < 1 || qty > 64) {
      setManualModbusResult('Hata', 'Register sayısı 1–64 olmalı.');
      return;
    }
    const packet = buildModbusQueryPacket(slave, func, start, qty);
    if (!packet) {
      setManualModbusResult('Hata', 'Paket oluşturulamadı.');
      return;
    }
    const fields = getManualModbusFieldEls();
    const btnRead = document.getElementById('mm_btn_read');
    const btnWrite = document.getElementById('mm_btn_write');
    setManualModbusResult('Gönderiliyor…', '');
    setFieldsBusy(fields, true);
    if (btnRead) btnRead.disabled = true;
    if (btnWrite) btnWrite.disabled = true;
    const t0 = performance.now();
    try {
      const res = await sendModbusRequest(packet);
      const statusStr = statusCodeToText(res.status);
      setManualModbusResult(statusStr, res.registers && res.registers.length
        ? '<div class="mm-regs">' + res.registers.map((r, i) => 'Reg[' + i + '] = ' + r + ' (0x' + r.toString(16).toUpperCase() + ')').join('<br>') + '</div>'
        : (res.status !== 0 ? '' : '—'));
      setFieldsBusy(fields, false);
      if (res.status === 0) {
        flashFields(fields, '#d1fae5');
        const n = (res.registers && res.registers.length) || qty;
        logOk('Modbus okuma: slave ' + slave + ', reg ' + start + ', ' + n + ' register', t0);
      } else {
        logFail('Modbus okuma', statusStr, t0);
      }
    } catch (e) {
      setFieldsBusy(fields, false);
      setManualModbusResult('Hata', simpleLogError(e));
      logFail('Modbus okuma', e, t0);
    } finally {
      if (btnRead) btnRead.disabled = !isBleConnected();
      if (btnWrite) btnWrite.disabled = !isBleConnected();
    }
  });

  document.getElementById('mm_btn_write')?.addEventListener('click', async () => {
    const slave = parseInt(document.getElementById('mm_slave').value, 10);
    const func = parseInt(document.getElementById('mm_func').value, 10);
    const start = parseInt(document.getElementById('mm_start').value, 10) || 0;
    const qty = parseInt(document.getElementById('mm_qty').value, 10) || 1;
    if (func !== 6 && func !== 16) return;
    let values = [];
    if (func === 6) {
      const v = parseRegisterValue(document.getElementById('mm_value_single').value);
      if (v === null) {
        setManualModbusResult('Hata', 'Tek register değeri 0–65535 veya 0xXXXX olmalı.');
        return;
      }
      values = [v];
    } else {
      const raw = document.getElementById('mm_value_multi').value;
      const parts = raw.split(/[\s,]+/).filter(Boolean);
      if (parts.length < 1 || parts.length > 64) {
        setManualModbusResult('Hata', '1–64 adet değer girin (virgül veya boşlukla).');
        return;
      }
      for (let i = 0; i < parts.length; i++) {
        const v = parseRegisterValue(parts[i]);
        if (v === null) {
          setManualModbusResult('Hata', 'Geçersiz değer: ' + parts[i]);
          return;
        }
        values.push(v);
      }
      if (values.length !== qty) {
        setManualModbusResult('Hata', 'Değer sayısı (' + values.length + ') register sayısıyla (' + qty + ') eşleşmiyor.');
        return;
      }
    }
    const packet = buildModbusQueryPacket(slave, func, start, func === 6 ? 1 : qty, values);
    if (!packet) {
      setManualModbusResult('Hata', 'Paket oluşturulamadı.');
      return;
    }
    const fields = getManualModbusFieldEls();
    const btnRead = document.getElementById('mm_btn_read');
    const btnWrite = document.getElementById('mm_btn_write');
    setManualModbusResult('Gönderiliyor…', '');
    setFieldsBusy(fields, true);
    if (btnRead) btnRead.disabled = true;
    if (btnWrite) btnWrite.disabled = true;
    const t0 = performance.now();
    try {
      const res = await sendModbusRequest(packet);
      const statusStr = statusCodeToText(res.status);
      setManualModbusResult(statusStr, res.status === 0 ? 'Yazma başarılı.' : '');
      setFieldsBusy(fields, false);
      if (res.status === 0) {
        flashFields(fields, '#bfdbfe');
        logOk('Modbus yazma: slave ' + slave + ', reg ' + start + ', ' + values.length + ' register', t0);
      } else {
        logFail('Modbus yazma', statusStr, t0);
      }
    } catch (e) {
      setFieldsBusy(fields, false);
      setManualModbusResult('Hata', simpleLogError(e));
      logFail('Modbus yazma', e, t0);
    } finally {
      if (btnRead) btnRead.disabled = !isBleConnected();
      if (btnWrite) btnWrite.disabled = !isBleConnected();
    }
  });
});

// Yaz: öncelik Modbus gateway GATT; LoRaWAN sekmesi açıksa ve alanlar doluysa anahtarlar da yazılır
const writeAllBtn = document.getElementById('write_all');
if (writeAllBtn) {
  writeAllBtn.addEventListener('click', (e) => {
    e.preventDefault();
    writeAll();
  });
}

// Firmware dosyası seçme butonunu tetikle
const firmwareFileInput = document.getElementById('firmware-file');
const firmwareFileLabel = document.querySelector('.file-input-label');
const firmwareDetails = document.querySelector('.firmware-details');
const firmwareFilename = document.getElementById('firmware-filename');
const firmwareSize = document.getElementById('firmware-size');

if (firmwareFileLabel && firmwareFileInput) {
    firmwareFileLabel.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Firmware dosyası seç butonuna tıklandı');
        firmwareFileInput.click();
    });
}

if (firmwareFileInput) {
    firmwareFileInput.addEventListener('change', function(e) {
        console.log('Firmware dosyası seçildi, event:', e);
        const file = e.target.files[0];
        if (!file) {
            console.log('Dosya seçilmedi.');
            return;
        }
        if (!file.name.endsWith('.bin')) {
            alert('Lütfen .bin uzantılı bir dosya seçin!');
            firmwareFileInput.value = '';
            firmwareDetails.style.display = 'none';
            console.log('Yanlış dosya uzantısı:', file.name);
            return;
        }
        firmwareFilename.textContent = file.name;
        firmwareSize.textContent = formatFileSize(file.size);
        firmwareDetails.style.display = 'block';
        
        // Dosya seçildikten sonra "Yüklemeyi Başlat" butonunu aktif et
        const startUploadBtn = document.getElementById('start-upload');
        if (startUploadBtn) {
            startUploadBtn.disabled = false;
        }
        
        console.log('Seçilen dosya:', file.name, file.size);
    });
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

// --- Otomatik Sürüm Kontrolü ---
const CURRENT_VERSION = document.querySelector('.app-version')?.textContent?.trim();
const GITHUB_IO_URL = "https://genieblocks.github.io/GenieBlocks_EnergyAnalyzer_WebBLE_Modbus_Manager/";

function parseVersion(vStr) {
  return (vStr || '').replace(/^v/, '').split('.').map(Number);
}

function isRemoteNewer(remote, local) {
  const r = parseVersion(remote);
  const l = parseVersion(local);
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const rv = r[i] || 0, lv = l[i] || 0;
    if (rv > lv) return true;
    if (rv < lv) return false;
  }
  return false;
}

function checkForNewVersion() {
  fetch(GITHUB_IO_URL, { cache: "no-store" })
    .then(response => response.text())
    .then(html => {
      const match = html.match(/<div class="app-version">v([0-9.]+)<\/div>/);
      if (match && match[1] && isRemoteNewer("v" + match[1], CURRENT_VERSION)) {
        showUpdateModal("Yeni sürüm yayınlandı! Sayfayı yenilemek için Tamam'a tıklayın.");
      }
    })
    .catch(() => { /* Sessizce geç */ });
}

// Basit bir modal/popup fonksiyonu
function showUpdateModal(msg) {
  if (document.getElementById('update-modal')) return; // Tekrarlı gösterme
  const modal = document.createElement('div');
  modal.id = 'update-modal';
  modal.style = `
    position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;
    background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;`;
  modal.innerHTML = `
    <div style="background:#fff;padding:32px 24px;border-radius:12px;box-shadow:0 2px 12px #0002;text-align:center;">
      <div style="font-size:1.2em;margin-bottom:18px;">${msg}</div>
      <button id="update-ok" style="padding:8px 24px;font-size:1em;border-radius:8px;background:#0096D6;color:#fff;border:none;cursor:pointer;">Tamam</button>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('update-ok').onclick = () => {
    location.reload();
  };
}

// 10 saniyede bir kontrol et
setInterval(checkForNewVersion, 10000);

// Tab değişimi + firmware accordion (Gelişmiş altında)
document.addEventListener('DOMContentLoaded', () => {
    function syncFirmwareFileInputEnabled() {
        if (!firmwareFileInput) return;
        const panel = document.getElementById('firmware-accordion-panel');
        const open = panel && !panel.classList.contains('hidden');
        const onAppTab = getActiveSettingsTab() === 'app';
        if (open && onAppTab) firmwareFileInput.removeAttribute('disabled');
        else firmwareFileInput.setAttribute('disabled', 'disabled');
    }

    document.querySelectorAll('.tab-modern').forEach(btn => {
        btn.addEventListener('click', function() {
            syncFirmwareFileInputEnabled();
            updateSettingsDeviceActionsVisibility(this.dataset.tab);
        });
    });

    const fwToggle = document.getElementById('firmware-accordion-toggle');
    const fwPanel = document.getElementById('firmware-accordion-panel');
    const fwChevron = document.getElementById('firmware-accordion-chevron');
    if (fwToggle && fwPanel) {
        fwToggle.addEventListener('click', function() {
            const open = fwPanel.classList.toggle('hidden') === false;
            fwToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (fwChevron) fwChevron.style.transform = open ? 'rotate(180deg)' : '';
            syncFirmwareFileInputEnabled();
        });
    }

    syncFirmwareFileInputEnabled();
    updateSettingsDeviceActionsVisibility();
});

// Firmware güncelleme için BLE bağlantı kontrolü
function checkFirmwareConnection() {
    if (!device) {
        addFirmwareLog('Hata: Cihaza bağlı değil! Önce cihaza bağlanın.', 'error');
        return false;
    }
    
    if (!device.gatt || !device.gatt.connected) {
        addFirmwareLog('Hata: Bluetooth bağlantısı kopuk! Lütfen tekrar bağlanın.', 'error');
        return false;
    }
    
    addFirmwareLog('Bağlantı kontrolü başarılı.', 'success');
    return true;
}

// Firmware yükleme sırasında input ve butonları yönet
function setFirmwareUiBusy(isBusy) {
    // Dosya inputu ve label
    firmwareFileInput.disabled = isBusy;
    document.querySelector('.file-input-label').classList.toggle('disabled', isBusy);

    // Butonlar
    document.getElementById('start-upload').disabled = isBusy;
    document.getElementById('cancel-upload').disabled = !isBusy;
}

// Log ve progress bar'ı otomatik en alta kaydır
function scrollFirmwareLogToBottom() {
    const logContent = document.getElementById('firmware-log-content');
    if (logContent) logContent.scrollTop = logContent.scrollHeight;
}

// Kısa süreli görsel bildirim (arka plan animasyonu)
function flashFirmwareLogBg(type) {
    const logContent = document.getElementById('firmware-log-content');
    if (!logContent) return;
    let color = type === 'success' ? '#d2f8e5' : type === 'error' ? '#ffeaea' : '#f8f9fa';
    logContent.style.transition = 'background 0.4s';
    logContent.style.background = color;
    setTimeout(() => {
        logContent.style.background = '#f8f9fa';
    }, 700);
}

// Firmware log sistemi
function addFirmwareLog(message, type = 'info') {
    const logContent = document.getElementById('firmware-log-content');
    if (!logContent) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const typeClass = type === 'error' ? 'error' : type === 'success' ? 'success' : 'info';
    const logEntry = `<div class="log-entry ${typeClass}">[${timestamp}] ${message}</div>`;
    
    logContent.innerHTML += logEntry;
    scrollFirmwareLogToBottom();
    if (type === 'success' || type === 'error') flashFirmwareLogBg(type);
}

// Firmware progress bar güncelleme
function updateFirmwareProgress(percentage) {
    const progressBar = document.querySelector('.progress');
    const progressText = document.querySelector('.progress-text');
    const progressContainer = document.querySelector('.progress-container');
    
    if (progressBar && progressText && progressContainer) {
        progressBar.style.width = percentage + '%';
        progressText.textContent = '%' + percentage;
        
        if (percentage > 0 && progressContainer.style.display === 'none') {
            progressContainer.style.display = 'block';
        }
    }
}

// Firmware butonları için event listener'lar
document.addEventListener('DOMContentLoaded', () => {
    const startUploadBtn = document.getElementById('start-upload');
    const cancelUploadBtn = document.getElementById('cancel-upload');
    const clearLogBtn = document.getElementById('clear-firmware-log');
    
    if (startUploadBtn) {
        startUploadBtn.addEventListener('click', startFirmwareUpload);
    }
    
    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', cancelFirmwareUpload);
    }
    
    if (clearLogBtn) {
        clearLogBtn.addEventListener('click', clearFirmwareLog);
    }
});



// Firmware upload işlemi sırasında iptal kontrolü için global değişken
let firmwareUploadCancelled = false;

// Firmware upload iptal etme
function cancelFirmwareUpload() {
    firmwareUploadCancelled = true;
    addFirmwareLog('Firmware güncelleme iptal edildi. Cihaza CANCEL komutu gönderiliyor...', 'info');
    // Eğer commandChar erişimi varsa CANCEL komutu gönder
    if (window._otaCommandChar) {
        sendOtaCommandNimbleOta('CANCEL', window._otaCommandChar)
            .then(() => addFirmwareLog('CANCEL komutu gönderildi.', 'info'))
            .catch(() => addFirmwareLog('CANCEL komutu gönderilemedi.', 'error'));
    }
    // Cihaza restart komutu gönder
    sendDeviceRestartCommand();
    updateFirmwareProgress(0);
    setFirmwareUiBusy(false);
    stopFirmwareTimer();
}

// Cihaza restart komutu gönderen fonksiyon
async function sendDeviceRestartCommand() {
    try {
        if (!device || !device.gatt.connected) {
            addFirmwareLog('Cihaz bağlı değil, restart komutu gönderilemedi.', 'error');
            return;
        }
        const server = device.gatt;
        let service = await server.getPrimaryService(SYSTEM_SERVICE_UUID);
        let characteristic = await service.getCharacteristic(COMMIT_CHAR_UUID);
        await characteristic.writeValue(Uint8Array.of(0x01));
        addFirmwareLog('Cihaza restart komutu gönderildi.', 'info');
    } catch (err) {
        addFirmwareLog('Cihaza restart komutu gönderilemedi: ' + err.message, 'error');
    }
}

// NimBLEOta protokolüne uygun firmware upload fonksiyonu
async function startFirmwareUpload() {
    addFirmwareLog('Firmware güncelleme başlatılıyor...', 'info');
    firmwareUploadCancelled = false;
    setFirmwareUiBusy(true);
    startFirmwareTimer();

    if (!checkFirmwareConnection()) {
        setFirmwareUiBusy(false);
        return;
    }

    const file = firmwareFileInput.files[0];
    if (!file) {
        addFirmwareLog('Hata: Lütfen önce bir firmware dosyası seçin!', 'error');
        setFirmwareUiBusy(false);
        return;
    }

    addFirmwareLog(`Seçilen dosya: ${file.name} (${formatFileSize(file.size)})`, 'info');
    updateFirmwareProgress(0);

    try {
        const server = device.gatt;
        addFirmwareLog('GATT server bağlantısı kuruldu.', 'info');
        
        // Tüm servisleri listele (debug için)
        const services = await server.getPrimaryServices();
        addFirmwareLog(`Bulunan servis sayısı: ${services.length}`, 'info');
        for (let i = 0; i < services.length; i++) {
            const service = services[i];
            addFirmwareLog(`Servis ${i + 1}: ${service.uuid}`, 'info');
        }
        
        // OTA servisini al
        addFirmwareLog(`OTA servisi aranıyor: ${OTA_SERVICE_UUID}`, 'info');
        const otaService = await server.getPrimaryService(OTA_SERVICE_UUID);
        addFirmwareLog('OTA servisi bulundu.', 'success');
        
        // OTA servisindeki tüm karakteristikleri listele (debug için)
        const characteristics = await otaService.getCharacteristics();
        addFirmwareLog(`OTA servisindeki karakteristik sayısı: ${characteristics.length}`, 'info');
        
        // Karakteristikleri UUID'lerine göre grupla
        const charMap = {};
        for (let i = 0; i < characteristics.length; i++) {
            const char = characteristics[i];
            const uuid = char.uuid;
            charMap[uuid] = char;
            
            // properties bir object, array değil
            const properties = [];
            if (char.properties.read) properties.push('read');
            if (char.properties.write) properties.push('write');
            if (char.properties.writeWithoutResponse) properties.push('writeWithoutResponse');
            if (char.properties.notify) properties.push('notify');
            if (char.properties.indicate) properties.push('indicate');
            
            addFirmwareLog(`Karakteristik ${i + 1}: ${uuid} (${properties.join(', ')})`, 'info');
        }
        
        // Beklenen UUID'leri kontrol et (Python ile aynı)
        const expectedUuids = {
            'firmware': OTA_RECV_CHARACTERISTIC_UUID,
            'command': OTA_COMMAND_CHARACTERISTIC_UUID
        };
        
        addFirmwareLog('Beklenen UUID\'ler:', 'info');
        for (const [name, uuid] of Object.entries(expectedUuids)) {
            addFirmwareLog(`  ${name}: ${uuid}`, 'info');
        }
        
        // Karakteristikleri al (hata yönetimi ile)
        let firmwareChar, progressChar, commandChar;
        
        try {
            addFirmwareLog(`Firmware karakteristiği aranıyor: ${OTA_RECV_CHARACTERISTIC_UUID}`, 'info');
            firmwareChar = await otaService.getCharacteristic(OTA_RECV_CHARACTERISTIC_UUID);
            addFirmwareLog('Firmware karakteristiği bulundu.', 'success');
        } catch (error) {
            addFirmwareLog(`Firmware karakteristiği bulunamadı: ${error.message}`, 'error');
            throw error;
        }
        

        
        try {
            addFirmwareLog(`Command karakteristiği aranıyor: ${OTA_COMMAND_CHARACTERISTIC_UUID}`, 'info');
            commandChar = await otaService.getCharacteristic(OTA_COMMAND_CHARACTERISTIC_UUID);
            addFirmwareLog('Command karakteristiği bulundu.', 'success');
        } catch (error) {
            addFirmwareLog(`Command karakteristiği bulunamadı: ${error.message}`, 'error');
            throw error;
        }

        window._otaCommandChar = commandChar;

        addFirmwareLog('Tüm OTA karakteristikleri başarıyla bulundu.', 'success');

        // Notification queue'ları oluştur
        let cmdQueue = [];
        let fwQueue = [];

        // Command characteristic notification listener
        commandChar.addEventListener('characteristicvaluechanged', (event) => {
            const value = event.target.value;
            // DÜZELTME: DataView'ın offset ve length'ini kullan!
            const data = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
            // addFirmwareLog('Command notification geldi: ' + Array.from(data).map(x=>x.toString(16).padStart(2,'0')).join(' '), 'info');
            cmdQueue.push(data);
        });

        // Firmware characteristic notification listener (Python ile aynı - progress karakteristiği yok)
        firmwareChar.addEventListener('characteristicvaluechanged', (event) => {
            const value = event.target.value;
            // DÜZELTME: DataView'ın offset ve length'ini kullan!
            const data = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
            // addFirmwareLog('Firmware notification geldi: ' + Array.from(data).map(x=>x.toString(16).padStart(2,'0')).join(' '), 'info');
            // const parsed = parseFirmwareNotification(data);
            // addFirmwareLog('Firmware notification parse: ' + JSON.stringify(parsed), 'info');
            fwQueue.push(data);
        });

        // ÖNCE notification'ları başlat (Python ile aynı sıra)
        addFirmwareLog('Command notification başlatılıyor...', 'info');
        await commandChar.startNotifications();
        // addFirmwareLog('Command notification başlatıldı.', 'info');
        
        addFirmwareLog('Firmware notification başlatılıyor...', 'info');
        await firmwareChar.startNotifications();
        // addFirmwareLog('Firmware notification başlatıldı.', 'info');

        // SONRA START komutu gönder ve ACK bekle (Python ile aynı mantık)
        await sendOtaCommandNimbleOta('START', commandChar, file.size);
        
        let startAck;
        for (let i = 0; i < 10; i++) {
            if (cmdQueue.length > 0) {
                const raw = cmdQueue.shift();
                const parsed = parseCommandNotification(raw);
                addFirmwareLog('ACK parse: ' + JSON.stringify(parsed), 'info');
                startAck = parsed;
                break;
            }
            await new Promise(r => setTimeout(r, 200));
        }
        if (!startAck || !startAck.valid) throw new Error("START komutu için geçerli ACK alınamadı!");
        if (startAck.rsp !== 0x0000) throw new Error("START komutu reddedildi: " + otaStatusText(startAck.rsp));
        
        addFirmwareLog('START komutu onaylandı.', 'success');

        // Firmware dosyasını oku ve sektörlere böl
        const arrayBuffer = await file.arrayBuffer();
        const sectors = splitFirmwareToSectors(arrayBuffer, 4096);
        addFirmwareLog(`Toplam sektör sayısı: ${sectors.length}`, 'info');

        // Her sektör için CRC hesapla ve sektörün sonuna ekle (Python ile aynı)
        for (let i = 0; i < sectors.length; i++) {
            const sector = sectors[i];
            const sectorArray = new Uint8Array(sector);
            const crc = crc16ccitt(0, sectorArray, sectorArray.length);
            addFirmwareLog(`Sektör #${i + 1} CRC: 0x${crc.toString(16).toUpperCase()} (uzunluk: ${sectorArray.length})`, 'info');
            // CRC'yi sektörün sonuna ekle (2 byte - Python ile aynı)
            const sectorWithCrc = new Uint8Array(sectorArray.length + 2);
            sectorWithCrc.set(sectorArray);
            sectorWithCrc[sectorArray.length] = crc & 0xFF;
            sectorWithCrc[sectorArray.length + 1] = (crc >> 8) & 0xFF;
            sectors[i] = sectorWithCrc.buffer;
        }

        // Sektörleri gönder
        for (let secIdx = 0; secIdx < sectors.length; secIdx++) {
            if (firmwareUploadCancelled) {
                addFirmwareLog('Kullanıcı tarafından iptal edildi. İşlem durduruldu.', 'error');
                updateFirmwareProgress(0);
                setFirmwareUiBusy(false);
                stopFirmwareTimer();
                return;
            }

            const sector = sectors[secIdx];
            const sectorArray = new Uint8Array(sector);
            
            addFirmwareLog(`Sektör #${secIdx + 1} gönderiliyor... (${sectorArray.length} byte)`, 'info');

            // Sektörü chunk'lara böl (Python ile aynı mantık)
            const MAX_CHUNK_SIZE = 507; // React ile aynı
            const numChunks = Math.ceil(sectorArray.length / MAX_CHUNK_SIZE);
            
            for (let chunkIdx = 0; chunkIdx < numChunks; chunkIdx++) {
                const start = chunkIdx * MAX_CHUNK_SIZE;
                const end = Math.min(start + MAX_CHUNK_SIZE, sectorArray.length);
                const chunk = sectorArray.slice(start, end);
                
                // Son sektör için 0xFFFF, diğerleri için secIdx kullan
                const sectorIndex = (secIdx === sectors.length - 1) ? 0xFFFF : secIdx;
                // 3-byte header ekle: [sector_index_low, sector_index_high, chunk_sequence] (little-endian)
                const header = new Uint8Array(3);
                header[0] = sectorIndex & 0xFF; // low byte
                header[1] = (sectorIndex >> 8) & 0xFF; // high byte
                header[2] = (chunkIdx === numChunks - 1) ? 0xFF : chunkIdx;
                
                // Header + chunk'ı birleştir
                const packet = new Uint8Array(3 + chunk.length);
                packet.set(header);
                packet.set(chunk, 3);
                
                // addFirmwareLog(`Chunk ${chunkIdx + 1}/${numChunks} gönderiliyor... (${packet.length} byte)`, 'info');
                // addFirmwareLog(`Chunk veri (ilk 16 byte): ${Array.from(packet.slice(0, 16)).map(x=>x.toString(16).padStart(2,'0')).join(' ')}...`, 'info');
                await firmwareChar.writeValue(packet);
            }

            // ACK bekle (Python ile aynı mantık)
            let ack, rspSector;
            for (let i = 0; i < 20; i++) {
                if (fwQueue.length > 0) {
                    const fwAck = parseFirmwareNotification(fwQueue.shift());
                    ack = fwAck.status;
                    rspSector = fwAck.curSector;
                    break;
                }
                await new Promise(r => setTimeout(r, 200));
            }
            
            if (ack === 0x0000) { // FW_ACK_SUCCESS
                addFirmwareLog(`Sektör #${secIdx + 1} başarıyla gönderildi.`, 'success');
                updateFirmwareProgress(Math.round(((secIdx + 1) / sectors.length) * 100));
                
                if (secIdx === sectors.length - 1) {
                    addFirmwareLog('Tüm sektörler gönderildi.', 'success');
                }
            } else if (ack === 0x0001 || ack === 0x0003 || ack === 0xFFFF) { // FW_ACK_CRC_ERROR, FW_ACK_LEN_ERROR, RSP_CRC_ERROR
                const errorMsg = ack === 0x0003 ? 'Length Error' : 'CRC Error';
                addFirmwareLog(`${errorMsg} - Sektör #${secIdx + 1} tekrar deneniyor...`, 'error');
                secIdx--; // Aynı sektörü tekrar gönder
                continue;
            } else if (ack === 0x0002) { // FW_ACK_SECTOR_ERROR
                addFirmwareLog(`Sektör Hatası, sektör #${rspSector + 1} gönderiliyor...`, 'error');
                secIdx = rspSector - 1; // rspSector 1-based ise, secIdx 0-based yap
                continue;
            } else {
                addFirmwareLog(`Bilinmeyen hata: 0x${ack.toString(16).toUpperCase()}`, 'error');
                throw new Error(`Bilinmeyen hata: 0x${ack.toString(16).toUpperCase()}`);
            }
        }

        // END komutu gönder
        await sendOtaCommandNimbleOta('END', commandChar);
        addFirmwareLog('Firmware güncelleme tamamlandı!', 'success');
        updateFirmwareProgress(100);
        flashFirmwareLogBg('success');
        setFirmwareUiBusy(false);
        stopFirmwareTimer();
        
    } catch (err) {
        addFirmwareLog('Hata: ' + err.message, 'error');
        updateFirmwareProgress(0);
        flashFirmwareLogBg('error');
        setFirmwareUiBusy(false);
        stopFirmwareTimer();
    } finally {
        window._otaCommandChar = null;
    }
}

// Firmware log temizleme
function clearFirmwareLog() {
    const logContent = document.getElementById('firmware-log-content');
    if (logContent) {
        logContent.innerHTML = '';
        addFirmwareLog('Log temizlendi.', 'info');
    }
}

// 1. OTA servis ve karakteristik UUID'leri
const OTA_SERVICE_UUID = 0x8018;
const OTA_RECV_CHARACTERISTIC_UUID = 0x8020;
const OTA_PROGRESS_CHARACTERISTIC_UUID = 0x8021;
const OTA_COMMAND_CHARACTERISTIC_UUID = 0x8022;

// 2. NimBLEOta komut gönderme fonksiyonu (Python ile birebir aynı)
async function sendOtaCommandNimbleOta(type, commandChar, fileSize = 0) {
    let cmd = 0x0001; // START
    if (type === "END") cmd = 0x0002;
    if (type === "CANCEL") cmd = 0x0003;

    let buf = new Uint8Array(20);
    // Python: command[0:2] = START_COMMAND.to_bytes(2, byteorder='little')
    buf[0] = cmd & 0xFF;        // little endian - low byte first
    buf[1] = (cmd >> 8) & 0xFF; // little endian - high byte second
    
    if (type === "START") {
        // Python: command[2:6] = file_size.to_bytes(4, byteorder='little')
        buf[2] = fileSize & 0xFF;           // little endian - byte 0
        buf[3] = (fileSize >> 8) & 0xFF;    // little endian - byte 1
        buf[4] = (fileSize >> 16) & 0xFF;   // little endian - byte 2
        buf[5] = (fileSize >> 24) & 0xFF;   // little endian - byte 3
    }
    
    // Python: crc16 = crc16_ccitt(command[0:18])
    let crc = crc16ccitt(0, buf, 18);
    
    // Python: command[18:20] = crc16.to_bytes(2, byteorder='little')
    buf[18] = crc & 0xFF;        // little endian - low byte first
    buf[19] = (crc >> 8) & 0xFF; // little endian - high byte second

    await commandChar.writeValue(buf);
    addFirmwareLog(`Komut gönderildi: ${type} (CRC16-CCITT: 0x${crc.toString(16).toUpperCase()})`, 'info');
    
    // Debug: Komut buffer'ının içeriğini logla
    const debugHex = Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join(' ');
    addFirmwareLog(`Debug - Komut buffer: ${debugHex}`, 'info');
}

// 3. Firmware dosyasını 4KB sektörlere böl
function splitFirmwareToSectors(arrayBuffer, sectorSize = 4096) {
    const sectors = [];
    const total = arrayBuffer.byteLength;
    for (let i = 0; i < total; i += sectorSize) {
        sectors.push(arrayBuffer.slice(i, i + sectorSize));
    }
    return sectors;
}

// 4. NimBLEOta ile uyumlu CRC16-CCITT hesaplama fonksiyonu (BLEOTA ile birebir aynı)
function crc16ccitt(init, data, len) {
    let crc = init;
    for (let i = 0; i < len; i++) {
        crc ^= data[i] << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
            } else {
                crc = (crc << 1) & 0xFFFF;
            }
        }
    }
    return crc & 0xFFFF;
}

// Python ile aynı notification handler'ları
function parseFirmwareNotification(data) {
    // Python: fw_notification_handler
    if (data.length !== 20) return { valid: false };
    
    const sectorSent = (data[1] << 8) | data[0]; // little endian
    const status = (data[3] << 8) | data[2];
    const curSector = (data[5] << 8) | data[4];
    const crc = (data[19] << 8) | data[18];
    
    const calcCrc = crc16ccitt(0, data, 18);
    const isValid = crc === calcCrc;
    
    return {
        valid: isValid,
        sectorSent,
        status: isValid ? status : 0xFFFF, // RSP_CRC_ERROR
        curSector,
        crc,
        calcCrc
    };
}

function parseCommandNotification(data) {
    // Python: cmd_notification_handler
    if (data.length !== 20) return { valid: false };
    
    const ack = (data[1] << 8) | data[0];
    const cmd = (data[3] << 8) | data[2];
    const rsp = (data[5] << 8) | data[4];
    const crc = (data[19] << 8) | data[18];
    
    const calcCrc = crc16ccitt(0, data, 18);
    const isValid = crc === calcCrc;
    
    return {
        valid: isValid,
        ack,
        cmd,
        rsp: isValid ? rsp : 0xFFFF, // RSP_CRC_ERROR
        crc,
        calcCrc
    };
}

// Hata kodu açıklamaları
function otaStatusText(status) {
    switch (status) {
        case 0x0000: return 'Başarılı';
        case 0x0001: return 'CRC Hatası';
        case 0x0002: return 'Sektör Hatası';
        case 0x0003: return 'Uzunluk Hatası';
        case 0xFFFF: return 'CRC Kontrol Hatası (Notification)';
        default: return 'Bilinmeyen Hata';
    }
}

let firmwareUploadTimer = null;
let firmwareUploadStartTime = null;

function startFirmwareTimer() {
    firmwareUploadStartTime = Date.now();
    const timerValue = document.getElementById('firmware-timer-value');
    if (firmwareUploadTimer) clearInterval(firmwareUploadTimer);
    timerValue.textContent = '00:00';
    firmwareUploadTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - firmwareUploadStartTime) / 1000);
        const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const sec = String(elapsed % 60).padStart(2, '0');
        timerValue.textContent = `${min}:${sec}`;
    }, 1000);
}

function stopFirmwareTimer() {
    if (firmwareUploadTimer) {
        clearInterval(firmwareUploadTimer);
        firmwareUploadTimer = null;
    }
}
