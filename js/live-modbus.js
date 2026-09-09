'use strict';

(function() {
  var MAX_QTY = 32;
  var DEMO_MODE_KEY = 'gb_demo_mode';
  var pollTimer = null;
  var pollBusy = false;
  var pollToken = 0;
  var activeOwner = null;
  var demoModeListeners = [];
  var connectionListeners = [];
  /** UI hold: yazılan reg’leri stale poll ezmesin. BLE awaitingByTransId ile karıştırma. */
  var heldRegs = Object.create(null);
  var DEFAULT_HOLD_MS = 2500;
  var WRITE_GRACE_MS = 2000;

  /**
   * Register’ı poll onValues’tan tut.
   * @param {number} reg
   * @param {*=} value
   * @param {number=} ms
   */
  function holdRegister(reg, value, ms) {
    var holdMs = ms != null ? ms : DEFAULT_HOLD_MS;
    heldRegs[reg] = { value: value, until: Date.now() + holdMs };
  }

  function holdRegisters(startAddr, values, ms) {
    var arr = Array.isArray(values) ? values : [values];
    for (var i = 0; i < arr.length; i++) {
      holdRegister(startAddr + i, arr[i], ms);
    }
  }

  function clearHeldRegister(reg) {
    delete heldRegs[reg];
  }

  function clearHeldRange(startAddr, qty) {
    for (var i = 0; i < qty; i++) clearHeldRegister(startAddr + i);
  }

  function clearAllHeldRegs() {
    heldRegs = Object.create(null);
  }

  /** Pending / süresi dolmamış reg’leri values map’inden çıkar. */
  function filterValuesAgainstHeld(values) {
    if (!values) return values;
    var now = Date.now();
    var out = {};
    for (var key in values) {
      if (!Object.prototype.hasOwnProperty.call(values, key)) continue;
      var reg = Number(key);
      var hold = heldRegs[reg];
      if (hold) {
        if (hold.until > now) continue;
        delete heldRegs[reg];
      }
      out[reg] = values[key];
    }
    return out;
  }

  function isWritePending(reg) {
    var hold = heldRegs[reg];
    return !!(hold && hold.until > Date.now());
  }

  function isBleConnected() {
    if (typeof window.isBleConnected === 'function') return window.isBleConnected();
    return false;
  }

  /** @returns {'auto'|'force'|'off'} */
  function getDemoMode() {
    var m = localStorage.getItem(DEMO_MODE_KEY);
    if (m === 'force' || m === 'off') return m;
    return 'auto';
  }

  function setDemoMode(mode) {
    if (mode !== 'auto' && mode !== 'force' && mode !== 'off') mode = 'auto';
    localStorage.setItem(DEMO_MODE_KEY, mode);
    updateHeaderModeBadge();
    demoModeListeners.forEach(function(fn) {
      try { fn(mode); } catch (e) { /* ignore */ }
    });
  }

  /** BLE bağlı ve demo zorlanmıyorsa canlı okuma. */
  function shouldUseLive() {
    if (!isBleConnected()) return false;
    return getDemoMode() !== 'force';
  }

  /** Simülasyon verisi kullanılacak mı. */
  function shouldUseDemo() {
    var mode = getDemoMode();
    if (mode === 'force') return true;
    if (mode === 'off') return false;
    return !isBleConnected();
  }

  function updateHeaderModeBadge() {
    var badge = document.getElementById('header-demo-badge');
    if (!badge) return;
    if (shouldUseLive()) {
      badge.textContent = 'CANLI';
      badge.className = 'live-badge shrink-0';
      badge.title = 'Veriler BLE üzerinden canlı okunuyor.';
      badge.classList.remove('hidden');
    } else if (shouldUseDemo()) {
      badge.textContent = 'DEMO';
      badge.className = 'demo-badge shrink-0';
      badge.title = 'Veriler simülasyondur. Gerçek veri için BLE bağlanın veya Ayarlar’dan Demo’yu kapatın.';
      badge.classList.remove('hidden');
    } else {
      badge.textContent = '';
      badge.className = 'hidden shrink-0';
      badge.title = '';
      badge.classList.add('hidden');
    }
  }

  function addDemoModeListener(fn) {
    if (typeof fn === 'function') demoModeListeners.push(fn);
  }

  /** Sayfa badge’leri için ortak etiket. */
  function getModeBadge() {
    if (shouldUseLive()) {
      return { label: 'Canlı', className: 'bg-green-100 text-green-700' };
    }
    if (shouldUseDemo()) {
      return { label: 'Demo', className: 'bg-amber-100 text-amber-700' };
    }
    return { label: 'Kapalı', className: 'bg-gray-100 text-gray-500' };
  }

  /** Cihaza yazma: sadece canlı modda (demo zorla = yerel). */
  function canWriteDevice() {
    return shouldUseLive();
  }

  function getSlaveAndFunc(deviceDef) {
    var slave = deviceDef && deviceDef.defaultSlaveAddr != null ? deviceDef.defaultSlaveAddr : 1;
    var mbAddr = document.getElementById('mb_addr');
    if (mbAddr && mbAddr.value !== '' && !isNaN(parseInt(mbAddr.value, 10))) {
      slave = parseInt(mbAddr.value, 10);
    }
    var func = deviceDef && deviceDef.modbusFunction != null ? deviceDef.modbusFunction : 0x03;
    return { slave: slave, func: func };
  }

  /**
   * @param {Array<{reg:number,len?:number}|number>} paramsOrRegs
   * @returns {{start:number,qty:number}[]}
   */
  function coalesceRanges(paramsOrRegs) {
    var spans = [];
    paramsOrRegs.forEach(function(p) {
      var start = typeof p === 'number' ? p : p.reg;
      var len = typeof p === 'number' ? 1 : (p.len || 1);
      for (var i = 0; i < len; i++) spans.push(start + i);
    });
    spans = spans.filter(function(v, i, a) { return a.indexOf(v) === i; }).sort(function(a, b) { return a - b; });
    if (!spans.length) return [];

    var ranges = [];
    var start = spans[0];
    var prev = spans[0];
    for (var i = 1; i < spans.length; i++) {
      var cur = spans[i];
      if (cur === prev + 1 && (cur - start + 1) <= MAX_QTY) {
        prev = cur;
      } else {
        ranges.push({ start: start, qty: prev - start + 1 });
        start = cur;
        prev = cur;
      }
    }
    ranges.push({ start: start, qty: prev - start + 1 });
    return ranges;
  }

  /**
   * @param {{slave:number,func:number}} cfg
   * @param {{start:number,qty:number}[]} ranges
   * @returns {Promise<Object<number,number>>} map pdu -> uint16
   */
  async function readRegisterMap(cfg, ranges) {
    var map = {};
    if (!isBleConnected()) throw new Error('Bluetooth bağlantısı yok');
    if (typeof window.buildModbusQueryPacket !== 'function' || typeof window.sendModbusRequest !== 'function') {
      throw new Error('Modbus API hazır değil');
    }
    for (var i = 0; i < ranges.length; i++) {
      var r = ranges[i];
      var packet = window.buildModbusQueryPacket(cfg.slave, cfg.func, r.start, r.qty);
      if (!packet) throw new Error('Paket oluşturulamadı (' + r.start + '/' + r.qty + ')');
      var res = await window.sendModbusRequest(packet);
      if (res.status !== 0) {
        var msg = typeof window.statusCodeToText === 'function' ? window.statusCodeToText(res.status) : ('status ' + res.status);
        throw new Error(msg);
      }
      var regs = res.registers || [];
      for (var j = 0; j < regs.length; j++) {
        map[r.start + j] = regs[j];
      }
    }
    return map;
  }

  /**
   * @param {object} deviceDef
   * @param {Array<{reg:number,len?:number,type?:string,scale?:number}>} params
   * @returns {Promise<Object<number,number>>} map reg -> decoded value
   */
  async function readParams(deviceDef, params) {
    var cfg = getSlaveAndFunc(deviceDef);
    var ranges = coalesceRanges(params);
    var rawMap = await readRegisterMap(cfg, ranges);
    var decoded = {};
    params.forEach(function(param) {
      var len = param.len || 1;
      var slice = [];
      for (var i = 0; i < len; i++) {
        var v = rawMap[param.reg + i];
        if (v === undefined) return;
        slice.push(v);
      }
      if (typeof decodeRegisterValue === 'function' && param.type) {
        decoded[param.reg] = decodeRegisterValue(slice, param);
      } else {
        decoded[param.reg] = slice[0] * (param.scale || 1);
      }
    });
    return decoded;
  }

  /**
   * Ham uint16 map döner (decode etmeden). Harmonik vb. için.
   */
  async function readRawRegs(deviceDef, start, qty) {
    var cfg = getSlaveAndFunc(deviceDef);
    var ranges = [];
    var remaining = qty;
    var addr = start;
    while (remaining > 0) {
      var chunk = Math.min(MAX_QTY, remaining);
      ranges.push({ start: addr, qty: chunk });
      addr += chunk;
      remaining -= chunk;
    }
    return readRegisterMap(cfg, ranges);
  }

  /**
   * Register yazma. Tekil yazmada önce 0x10, başarısızsa 0x06 dener
   * (bazı gateway/analizör kombinasyonları yalnızca birini kabul eder).
   */
  async function writeRegisters(deviceDef, startAddr, values) {
    if (!isBleConnected()) throw new Error('Bluetooth bağlantısı yok');
    var cfg = getSlaveAndFunc(deviceDef);
    var valuesArr = Array.isArray(values) ? values : [values];
    var qty = valuesArr.length;
    if (qty < 1 || qty > 64) throw new Error('Geçersiz yazma adedi');

    var committed = false;
    holdRegisters(startAddr, valuesArr, DEFAULT_HOLD_MS);

    async function tryWrite(func) {
      var packet = window.buildModbusQueryPacket(cfg.slave, func, startAddr, qty, valuesArr);
      if (!packet) throw new Error('Yazma paketi oluşturulamadı');
      return window.sendModbusRequest(packet);
    }

    try {
      var res;
      if (qty === 1) {
        res = await tryWrite(0x10);
        if (res.status === 0x01) {
          res = await tryWrite(0x06);
        }
      } else {
        res = await tryWrite(0x10);
      }
      if (res.status !== 0) {
        var msg = typeof window.statusCodeToText === 'function' ? window.statusCodeToText(res.status) : ('status ' + res.status);
        throw new Error(msg);
      }
      holdRegisters(startAddr, valuesArr, WRITE_GRACE_MS);
      committed = true;
      return res;
    } catch (e) {
      if (!committed) clearHeldRange(startAddr, qty);
      throw e;
    }
  }

  function encodeParamRaw(param, displayValue) {
    var scale = param.scale || 1;
    if (param.options) {
      return parseInt(displayValue, 10) & 0xffff;
    }
    var num = parseFloat(displayValue);
    if (isNaN(num)) return null;
    if (scale !== 1) return Math.round(num / scale) & 0xffff;
    return Math.round(num) & 0xffff;
  }

  function stopLivePoll(owner) {
    if (owner && activeOwner && owner !== activeOwner) return;
    pollToken++;
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    pollBusy = false;
    activeOwner = null;
    clearAllHeldRegs();
  }

  /**
   * Tek aktif poller. Sayfa değişince stopLivePoll sonra yeniden start.
   * @param {{ owner:string, getParams:Function, onValues:Function, getDeviceDef:Function, intervalMs?:number, onError?:Function }} opts
   */
  function startLivePoll(opts) {
    stopLivePoll();
    if (!opts || typeof opts.getParams !== 'function' || typeof opts.onValues !== 'function') return;
    activeOwner = opts.owner || 'default';
    var intervalMs = opts.intervalMs != null ? opts.intervalMs : 2000;
    var myToken = pollToken;

    async function tick() {
      if (myToken !== pollToken) return;
      if (!isBleConnected()) {
        if (typeof opts.onDisconnected === 'function') opts.onDisconnected();
        stopLivePoll(activeOwner);
        return;
      }
      if (pollBusy) {
        schedule();
        return;
      }
      pollBusy = true;
      try {
        var deviceDef = typeof opts.getDeviceDef === 'function' ? opts.getDeviceDef() : null;
        var params = opts.getParams() || [];
        if (deviceDef && params.length) {
          var values = await readParams(deviceDef, params);
          if (myToken === pollToken) {
            opts.onValues(filterValuesAgainstHeld(values), params);
          }
        }
      } catch (e) {
        if (typeof opts.onError === 'function') opts.onError(e);
      } finally {
        pollBusy = false;
        schedule();
      }
    }

    function schedule() {
      if (myToken !== pollToken) return;
      pollTimer = setTimeout(tick, intervalMs);
    }

    tick();
  }

  function addConnectionListener(fn) {
    if (typeof fn === 'function') connectionListeners.push(fn);
  }

  window.LiveModbus = {
    isBleConnected: isBleConnected,
    getDemoMode: getDemoMode,
    setDemoMode: setDemoMode,
    shouldUseLive: shouldUseLive,
    shouldUseDemo: shouldUseDemo,
    getModeBadge: getModeBadge,
    canWriteDevice: canWriteDevice,
    updateHeaderModeBadge: updateHeaderModeBadge,
    addDemoModeListener: addDemoModeListener,
    getSlaveAndFunc: getSlaveAndFunc,
    coalesceRanges: coalesceRanges,
    readParams: readParams,
    readRawRegs: readRawRegs,
    writeRegisters: writeRegisters,
    encodeParamRaw: encodeParamRaw,
    holdRegister: holdRegister,
    isWritePending: isWritePending,
    clearAllHeldRegs: clearAllHeldRegs,
    startLivePoll: startLivePoll,
    stopLivePoll: stopLivePoll,
    addConnectionListener: addConnectionListener
  };

  window.onBleConnectionChange = function(connected) {
    if (!connected) clearAllHeldRegs();
    updateHeaderModeBadge();
    connectionListeners.forEach(function(fn) {
      try { fn(!!connected); } catch (e) { /* ignore */ }
    });
  };

  document.addEventListener('DOMContentLoaded', function() {
    updateHeaderModeBadge();
    var sel = document.getElementById('app_demo_mode');
    if (sel) {
      sel.value = getDemoMode();
      sel.addEventListener('change', function() {
        setDemoMode(this.value);
      });
    }
  });
})();
