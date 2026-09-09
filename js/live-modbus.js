'use strict';

(function() {
  var MAX_QTY = 64;
  var pollTimer = null;
  var pollBusy = false;
  var pollToken = 0;
  var activeOwner = null;

  function isBleConnected() {
    if (typeof window.isBleConnected === 'function') return window.isBleConnected();
    return false;
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
   * Tek veya çoklu register yazma. qty===1 ise 0x06, değilse 0x10.
   */
  async function writeRegisters(deviceDef, startAddr, values) {
    if (!isBleConnected()) throw new Error('Bluetooth bağlantısı yok');
    var cfg = getSlaveAndFunc(deviceDef);
    var valuesArr = Array.isArray(values) ? values : [values];
    var qty = valuesArr.length;
    var func = qty === 1 ? 0x06 : 0x10;
    var packet = window.buildModbusQueryPacket(cfg.slave, func, startAddr, qty, valuesArr);
    if (!packet) throw new Error('Yazma paketi oluşturulamadı');
    var res = await window.sendModbusRequest(packet);
    if (res.status !== 0) {
      var msg = typeof window.statusCodeToText === 'function' ? window.statusCodeToText(res.status) : ('status ' + res.status);
      throw new Error(msg);
    }
    return res;
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
          if (myToken === pollToken) opts.onValues(values, params);
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

  window.LiveModbus = {
    isBleConnected: isBleConnected,
    getSlaveAndFunc: getSlaveAndFunc,
    coalesceRanges: coalesceRanges,
    readParams: readParams,
    readRawRegs: readRawRegs,
    writeRegisters: writeRegisters,
    encodeParamRaw: encodeParamRaw,
    startLivePoll: startLivePoll,
    stopLivePoll: stopLivePoll,
    addConnectionListener: addConnectionListener
  };

  var connectionListeners = [];
  function addConnectionListener(fn) {
    if (typeof fn === 'function') connectionListeners.push(fn);
  }

  window.onBleConnectionChange = function(connected) {
    connectionListeners.forEach(function(fn) {
      try { fn(!!connected); } catch (e) { /* ignore */ }
    });
  };
})();
