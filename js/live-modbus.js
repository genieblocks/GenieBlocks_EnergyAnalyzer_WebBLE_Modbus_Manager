'use strict';

(function() {
  var MAX_QTY = 32;
  var SUBSCRIBE_MAX_QTY_SUM = 128;
  var SUBSCRIBE_MAX_RANGES = 16;
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

  /** Stream session state */
  var streamActive = false;
  var streamSubEpoch = 0;
  var streamRanges = [];
  var streamParams = [];
  var streamListener = null;
  var streamOpts = null;
  var coldTimer = null;
  var coldBusy = false;
  var resubTimer = null;
  var lastParamsKey = '';

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

  function addDemoModeListener(fn) {
    if (typeof fn === 'function') demoModeListeners.push(fn);
  }

  /** Sayfa badge’leri için ortak etiket. */
  function getModeBadge() {
    if (shouldUseLive()) {
      return { label: 'Canlı', className: 'badge-live' };
    }
    if (shouldUseDemo()) {
      return { label: 'Demo', className: 'badge-demo' };
    }
    return { label: 'Kapalı', className: 'badge-off' };
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
   * Subscribe bütçesine göre range listesi: bitişik birleştir, sum(qty)<=128, rangeCount<=16.
   * Fazlası kesilir (log).
   * @param {Array<{reg:number,len?:number}|number>} paramsOrRegs
   * @returns {{start:number,qty:number}[]}
   */
  function paramsToSubscribeRanges(paramsOrRegs) {
    var spans = [];
    (paramsOrRegs || []).forEach(function(p) {
      var start = typeof p === 'number' ? p : p.reg;
      var len = typeof p === 'number' ? 1 : (p.len || 1);
      for (var i = 0; i < len; i++) spans.push(start + i);
    });
    spans = spans.filter(function(v, i, a) { return a.indexOf(v) === i; }).sort(function(a, b) { return a - b; });
    if (!spans.length) return [];

    var full = [];
    var start = spans[0];
    var prev = spans[0];
    for (var i = 1; i < spans.length; i++) {
      var cur = spans[i];
      if (cur === prev + 1) {
        prev = cur;
      } else {
        full.push({ start: start, qty: prev - start + 1 });
        start = cur;
        prev = cur;
      }
    }
    full.push({ start: start, qty: prev - start + 1 });

    var out = [];
    var sum = 0;
    var truncated = false;
    for (var r = 0; r < full.length; r++) {
      if (out.length >= SUBSCRIBE_MAX_RANGES) {
        truncated = true;
        break;
      }
      var qty = full[r].qty;
      if (sum + qty > SUBSCRIBE_MAX_QTY_SUM) {
        var room = SUBSCRIBE_MAX_QTY_SUM - sum;
        if (room > 0) {
          out.push({ start: full[r].start, qty: room });
          sum += room;
        }
        truncated = true;
        break;
      }
      out.push({ start: full[r].start, qty: qty });
      sum += qty;
    }
    if (truncated && typeof window.logMsg === 'function') {
      window.logMsg('Subscribe: sum(qty) veya rangeCount limiti aşıldı; ilk ' + sum + ' register alındı.');
    }
    return out;
  }

  function paramsKey(params) {
    if (!params || !params.length) return '';
    return params.map(function(p) {
      return (typeof p === 'number' ? p : p.reg) + ':' + (typeof p === 'number' ? 1 : (p.len || 1));
    }).join(',');
  }

  function decodeParamsFromRawMap(params, rawMap) {
    var decoded = {};
    (params || []).forEach(function(param) {
      if (typeof param === 'number') {
        if (rawMap[param] !== undefined) decoded[param] = rawMap[param];
        return;
      }
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

  function rawMapFromSubscribePayload(ranges, registers) {
    var map = {};
    var idx = 0;
    for (var i = 0; i < ranges.length; i++) {
      var r = ranges[i];
      for (var j = 0; j < r.qty; j++) {
        if (idx >= registers.length) return map;
        map[r.start + j] = registers[idx++];
      }
    }
    return map;
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
    return decodeParamsFromRawMap(params, rawMap);
  }

  /**
   * Bitişik range’ler (limit yok — batch paketlemek için).
   */
  function contiguousRangesNoLimit(paramsOrRegs) {
    var spans = [];
    (paramsOrRegs || []).forEach(function(p) {
      var start = typeof p === 'number' ? p : p.reg;
      var len = typeof p === 'number' ? 1 : (p.len || 1);
      for (var i = 0; i < len; i++) spans.push(start + i);
    });
    spans = spans.filter(function(v, i, a) { return a.indexOf(v) === i; }).sort(function(a, b) { return a - b; });
    if (!spans.length) return [];
    var full = [];
    var start = spans[0];
    var prev = spans[0];
    for (var i = 1; i < spans.length; i++) {
      var cur = spans[i];
      if (cur === prev + 1) {
        prev = cur;
      } else {
        full.push({ start: start, qty: prev - start + 1 });
        start = cur;
        prev = cur;
      }
    }
    full.push({ start: start, qty: prev - start + 1 });
    return full;
  }

  /**
   * Param listesini sum(qty)<=128 / rangeCount<=16 batch’lerine böl (one-shot için).
   * @returns {{params:object[], ranges:{start:number,qty:number}[]}[]}
   */
  function splitParamsIntoSubscribeBatches(params) {
    var all = contiguousRangesNoLimit(params);
    var batches = [];
    var ri = 0;
    while (ri < all.length) {
      var batchRanges = [];
      var sum = 0;
      while (ri < all.length && batchRanges.length < SUBSCRIBE_MAX_RANGES) {
        var r = all[ri];
        if (sum + r.qty > SUBSCRIBE_MAX_QTY_SUM) {
          if (batchRanges.length === 0) {
            var room = SUBSCRIBE_MAX_QTY_SUM;
            batchRanges.push({ start: r.start, qty: room });
            all[ri] = { start: r.start + room, qty: r.qty - room };
            sum = room;
          }
          break;
        }
        batchRanges.push({ start: r.start, qty: r.qty });
        sum += r.qty;
        ri++;
      }
      if (!batchRanges.length) break;

      var batchParams = (params || []).filter(function(p) {
        var reg = typeof p === 'number' ? p : p.reg;
        var len = typeof p === 'number' ? 1 : (p.len || 1);
        for (var k = 0; k < batchRanges.length; k++) {
          var br = batchRanges[k];
          var end = br.start + br.qty;
          if (reg >= br.start && (reg + len - 1) < end) return true;
          if (reg >= br.start && reg < end) return true;
        }
        return false;
      });
      batches.push({ params: batchParams.length ? batchParams : params, ranges: batchRanges });
    }
    return batches;
  }

  /**
   * Subscribe opcode 0x02 one-shot: tek Stream turu. Destek yoksa Query readParams.
   * @param {object} deviceDef
   * @param {Array} params
   * @returns {Promise<Object<number,number>>}
   */
  async function readParamsOneShot(deviceDef, params) {
    if (!isBleConnected()) throw new Error('Bluetooth bağlantısı yok');
    if (!params || !params.length) return {};

    var supported = false;
    try {
      if (typeof window.probeModbusStreamSupport === 'function') {
        supported = await window.probeModbusStreamSupport();
      } else if (typeof window.isModbusStreamSupported === 'function') {
        supported = window.isModbusStreamSupported();
      }
    } catch (e) {
      supported = false;
    }

    if (!supported || typeof window.buildModbusSubscribePacket !== 'function' ||
        typeof window.writeModbusSubscribe !== 'function' ||
        typeof window.addModbusStreamListener !== 'function') {
      return readParams(deviceDef, params);
    }

    try {
      if (typeof window.setupModbusStreamNotify === 'function') {
        await window.setupModbusStreamNotify();
      }
    } catch (e) {
      return readParams(deviceDef, params);
    }

    var cfg = getSlaveAndFunc(deviceDef);
    var batches = splitParamsIntoSubscribeBatches(params);
    var decodedAll = {};

    for (var b = 0; b < batches.length; b++) {
      var batch = batches[b];
      if (!batch.ranges.length) continue;

      streamSubEpoch = (streamSubEpoch + 1) & 0xff;
      if (streamSubEpoch === 0) streamSubEpoch = 1;
      var epoch = streamSubEpoch;
      var ranges = batch.ranges;
      var qtySum = ranges.reduce(function(s, r) { return s + r.qty; }, 0);
      var timeoutMs = Math.min(8000, Math.max(1500, 600 + qtySum * 30));

      if (typeof window.setModbusActiveSubEpoch === 'function') {
        window.setModbusActiveSubEpoch(epoch);
      }

      var snapshotPromise = new Promise(function(resolve, reject) {
        var settled = false;
        var timer = setTimeout(function() {
          if (settled) return;
          settled = true;
          window.removeModbusStreamListener(onEvt);
          reject(new Error('One-shot Stream timeout'));
        }, timeoutMs);

        function onEvt(evt) {
          if (settled || !evt) return;
          if (evt.subEpoch !== (epoch & 0xff)) return;
          if (evt.type === 'error') {
            settled = true;
            clearTimeout(timer);
            window.removeModbusStreamListener(onEvt);
            reject(new Error(evt.message || ('Stream status 0x' + (evt.status & 0xff).toString(16))));
            return;
          }
          if (evt.type !== 'snapshot') return;
          settled = true;
          clearTimeout(timer);
          window.removeModbusStreamListener(onEvt);
          resolve(evt);
        }

        window.addModbusStreamListener(onEvt);
      });

      var packet = window.buildModbusSubscribePacket({
        opcode: 0x02,
        subEpoch: epoch,
        slaveId: cfg.slave,
        func: cfg.func,
        intervalMs: 0,
        ranges: ranges
      });
      if (!packet) {
        var qMap = await readRegisterMap(cfg, coalesceRanges(batch.params));
        Object.assign(decodedAll, decodeParamsFromRawMap(batch.params, qMap));
        continue;
      }

      if (typeof window.logMsg === 'function') {
        window.logMsg('Modbus Subscribe 0x02 one-shot epoch=' + epoch +
          ' ranges=' + ranges.length + ' qtySum=' + qtySum);
      }

      await window.writeModbusSubscribe(packet);
      var evt = await snapshotPromise;
      var rawMap = rawMapFromSubscribePayload(ranges, evt.registers || []);
      Object.assign(decodedAll, decodeParamsFromRawMap(batch.params, rawMap));
    }

    return decodedAll;
  }
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

  /**
   * Yazılacak {reg,value} listesini bitişik BulkWrite range’lerine çevir.
   * sum(qty) <= 64, rangeCount <= 16.
   * @param {{reg:number, value:number}[]} items
   * @returns {{start:number, values:number[]}[]}
   */
  function itemsToBulkWriteRanges(items) {
    var sorted = (items || []).slice().sort(function(a, b) { return a.reg - b.reg; });
    var ranges = [];
    var sum = 0;
    for (var i = 0; i < sorted.length; i++) {
      var reg = sorted[i].reg | 0;
      var val = sorted[i].value & 0xffff;
      var last = ranges.length ? ranges[ranges.length - 1] : null;
      var nextAddr = last ? last.start + last.values.length : -1;
      if (last && reg === nextAddr && last.values.length < 64 && sum < 64 && ranges.length <= 16) {
        last.values.push(val);
        sum++;
      } else {
        if (ranges.length >= 16 || sum >= 64) {
          throw new Error('BulkWrite limiti aşıldı (max 64 reg / 16 range)');
        }
        ranges.push({ start: reg, values: [val] });
        sum++;
      }
    }
    return ranges;
  }

  /**
   * Toplu yazma: BulkWrite varsa tek BLE isteği; yoksa Query ile sırayla.
   * @param {object} deviceDef
   * @param {{reg:number, value:number}[]} items
   */
  async function writeParamsBulk(deviceDef, items) {
    if (!isBleConnected()) throw new Error('Bluetooth bağlantısı yok');
    if (!items || !items.length) return { status: 0 };

    var ranges = itemsToBulkWriteRanges(items);
    var held = [];
    for (var i = 0; i < ranges.length; i++) {
      holdRegisters(ranges[i].start, ranges[i].values, DEFAULT_HOLD_MS);
      held.push(ranges[i]);
    }

    var useBulk = false;
    try {
      if (typeof window.probeModbusBulkWriteSupport === 'function') {
        useBulk = await window.probeModbusBulkWriteSupport();
      } else if (typeof window.isModbusBulkWriteSupported === 'function') {
        useBulk = window.isModbusBulkWriteSupported();
      }
    } catch (e) {
      useBulk = false;
    }

    try {
      if (useBulk && typeof window.buildModbusBulkWritePacket === 'function' &&
          typeof window.sendModbusBulkWrite === 'function') {
        var cfg = getSlaveAndFunc(deviceDef);
        var packet = window.buildModbusBulkWritePacket(cfg.slave, ranges);
        if (!packet) throw new Error('BulkWrite paketi oluşturulamadı');
        var res = await window.sendModbusBulkWrite(packet);
        if (res.status !== 0) {
          var msg = typeof window.statusCodeToText === 'function' ? window.statusCodeToText(res.status) : ('status ' + res.status);
          if (res.failRangeIndex != null) msg += ' (range #' + res.failRangeIndex + ')';
          throw new Error(msg);
        }
        for (var h = 0; h < held.length; h++) {
          holdRegisters(held[h].start, held[h].values, WRITE_GRACE_MS);
        }
        if (typeof window.logMsg === 'function') {
          window.logMsg('BulkWrite OK ranges=' + ranges.length + ' qtySum=' +
            ranges.reduce(function(s, r) { return s + r.values.length; }, 0));
        }
        return res;
      }

      // Fallback: her range için Query yazma
      var lastRes = null;
      for (var r = 0; r < ranges.length; r++) {
        lastRes = await writeRegisters(deviceDef, ranges[r].start, ranges[r].values);
      }
      return lastRes || { status: 0 };
    } catch (e) {
      for (var c = 0; c < held.length; c++) {
        clearHeldRange(held[c].start, held[c].values.length);
      }
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

  function clearColdTimer() {
    if (coldTimer) {
      clearTimeout(coldTimer);
      coldTimer = null;
    }
    coldBusy = false;
  }

  function clearResubTimer() {
    if (resubTimer) {
      clearTimeout(resubTimer);
      resubTimer = null;
    }
  }

  async function writeUnsubscribe() {
    if (typeof window.buildModbusSubscribePacket !== 'function' || typeof window.writeModbusSubscribe !== 'function') {
      return;
    }
    if (typeof window.isModbusStreamSupported === 'function' && !window.isModbusStreamSupported()) {
      return;
    }
    try {
      var packet = window.buildModbusSubscribePacket({
        opcode: 0x01,
        subEpoch: streamSubEpoch & 0xff,
        slaveId: 1,
        func: 0x03,
        intervalMs: 0,
        ranges: []
      });
      if (packet) await window.writeModbusSubscribe(packet);
    } catch (e) {
      /* disconnect sırasında beklenen */
    }
  }

  function detachStreamListener() {
    if (streamListener && typeof window.removeModbusStreamListener === 'function') {
      window.removeModbusStreamListener(streamListener);
    }
    streamListener = null;
  }

  function stopLivePoll(owner) {
    if (owner && activeOwner && owner !== activeOwner) return;
    pollToken++;
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    pollBusy = false;
    clearColdTimer();
    clearResubTimer();
    if (streamActive) {
      detachStreamListener();
      writeUnsubscribe();
      streamActive = false;
    }
    streamOpts = null;
    streamRanges = [];
    streamParams = [];
    lastParamsKey = '';
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

  function scheduleColdPoll(opts, myToken) {
    clearColdTimer();
    var coldInterval = opts.coldIntervalMs != null ? opts.coldIntervalMs : 15000;
    if (!opts.getColdParams || coldInterval <= 0) return;

    function coldTick() {
      if (myToken !== pollToken || !streamActive) return;
      if (!isBleConnected()) return;
      if (coldBusy) {
        coldTimer = setTimeout(coldTick, coldInterval);
        return;
      }
      coldBusy = true;
      Promise.resolve().then(async function() {
        try {
          var deviceDef = typeof opts.getDeviceDef === 'function' ? opts.getDeviceDef() : null;
          var coldParams = opts.getColdParams() || [];
          if (deviceDef && coldParams.length) {
            var values = await readParams(deviceDef, coldParams);
            if (myToken === pollToken && streamActive) {
              opts.onValues(filterValuesAgainstHeld(values), coldParams);
            }
          }
        } catch (e) {
          if (typeof opts.onError === 'function') opts.onError(e);
        } finally {
          coldBusy = false;
          if (myToken === pollToken && streamActive) {
            coldTimer = setTimeout(coldTick, coldInterval);
          }
        }
      });
    }

    coldTimer = setTimeout(coldTick, coldInterval);
  }

  async function applySubscribe(opts, myToken) {
    var deviceDef = typeof opts.getDeviceDef === 'function' ? opts.getDeviceDef() : null;
    var params = opts.getParams() || [];
    if (!deviceDef || !params.length) return false;

    var cfg = getSlaveAndFunc(deviceDef);
    var ranges = paramsToSubscribeRanges(params);
    if (!ranges.length) return false;

    streamSubEpoch = (streamSubEpoch + 1) & 0xff;
    if (streamSubEpoch === 0) streamSubEpoch = 1;
    streamRanges = ranges;
    streamParams = params;
    lastParamsKey = paramsKey(params);

    var intervalMs = opts.intervalMs != null ? opts.intervalMs : 1000;
    var packet = window.buildModbusSubscribePacket({
      opcode: 0x01,
      subEpoch: streamSubEpoch,
      slaveId: cfg.slave,
      func: cfg.func,
      intervalMs: intervalMs,
      ranges: ranges
    });
    if (!packet) throw new Error('Subscribe paketi oluşturulamadı');
    if (typeof window.setModbusActiveSubEpoch === 'function') {
      window.setModbusActiveSubEpoch(streamSubEpoch);
    }
    await window.writeModbusSubscribe(packet);
    if (typeof window.logMsg === 'function') {
      window.logMsg('Modbus Subscribe 0x01 epoch=' + streamSubEpoch + ' ranges=' + ranges.length +
        ' qtySum=' + ranges.reduce(function(s, r) { return s + r.qty; }, 0) +
        ' interval=' + intervalMs + 'ms');
    }
    return true;
  }

  function scheduleParamsWatch(opts, myToken) {
    clearResubTimer();
    function watch() {
      if (myToken !== pollToken || !streamActive) return;
      try {
        var params = opts.getParams() || [];
        var key = paramsKey(params);
        if (key !== lastParamsKey) {
          applySubscribe(opts, myToken).catch(function(e) {
            if (typeof opts.onError === 'function') opts.onError(e);
          });
        }
      } catch (e) {
        if (typeof opts.onError === 'function') opts.onError(e);
      }
      if (myToken === pollToken && streamActive) {
        resubTimer = setTimeout(watch, 400);
      }
    }
    resubTimer = setTimeout(watch, 400);
  }

  /**
   * Subscribe/Stream canlı okuma. Destek yoksa Query poll’a düşer.
   * @param {{ owner:string, getParams:Function, onValues:Function, getDeviceDef:Function, intervalMs?:number, onError?:Function, onDisconnected?:Function, getColdParams?:Function, coldIntervalMs?:number }} opts
   */
  function startLiveStream(opts) {
    stopLivePoll();
    if (!opts || typeof opts.getParams !== 'function' || typeof opts.onValues !== 'function') return;

    var myToken = pollToken;
    activeOwner = opts.owner || 'default';
    streamOpts = opts;

    async function begin() {
      if (myToken !== pollToken) return;
      if (!isBleConnected()) {
        if (typeof opts.onDisconnected === 'function') opts.onDisconnected();
        stopLivePoll(activeOwner);
        return;
      }

      var supported = false;
      try {
        if (typeof window.probeModbusStreamSupport === 'function') {
          supported = await window.probeModbusStreamSupport();
        } else if (typeof window.isModbusStreamSupported === 'function') {
          supported = window.isModbusStreamSupported();
        }
      } catch (e) {
        supported = false;
      }

      if (myToken !== pollToken) return;

      if (!supported) {
        if (typeof window.logMsg === 'function') {
          window.logMsg('Modbus Stream yok — Query poll kullanılıyor.');
        }
        startLivePoll(opts);
        return;
      }

      try {
        if (typeof window.setupModbusStreamNotify === 'function') {
          await window.setupModbusStreamNotify();
        }
      } catch (e) {
        startLivePoll(opts);
        return;
      }

      if (myToken !== pollToken) return;

      streamListener = function(evt) {
        if (myToken !== pollToken || !streamActive) return;
        if (!evt) return;
        if (evt.subEpoch !== (streamSubEpoch & 0xff)) return;

        if (evt.type === 'error') {
          if (typeof opts.onError === 'function') {
            opts.onError(new Error(evt.message || ('Stream status 0x' + (evt.status & 0xff).toString(16))));
          }
          return;
        }
        if (evt.type !== 'snapshot') return;

        var rawMap = rawMapFromSubscribePayload(streamRanges, evt.registers || []);
        var decoded = decodeParamsFromRawMap(streamParams, rawMap);
        opts.onValues(filterValuesAgainstHeld(decoded), streamParams);
      };

      if (typeof window.addModbusStreamListener === 'function') {
        window.addModbusStreamListener(streamListener);
      }

      streamActive = true;
      try {
        var ok = await applySubscribe(opts, myToken);
        if (!ok) {
          streamActive = false;
          detachStreamListener();
          startLivePoll(opts);
          return;
        }
      } catch (e) {
        streamActive = false;
        detachStreamListener();
        if (typeof opts.onError === 'function') opts.onError(e);
        startLivePoll(opts);
        return;
      }

      scheduleColdPoll(opts, myToken);
      scheduleParamsWatch(opts, myToken);
    }

    begin();
  }

  /** Stream dene; yoksa poll. Sayfalar bunu kullanır. */
  function startLive(opts) {
    startLiveStream(opts);
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
    addDemoModeListener: addDemoModeListener,
    getSlaveAndFunc: getSlaveAndFunc,
    coalesceRanges: coalesceRanges,
    paramsToSubscribeRanges: paramsToSubscribeRanges,
    readParams: readParams,
    readParamsOneShot: readParamsOneShot,
    readRawRegs: readRawRegs,
    writeRegisters: writeRegisters,
    writeParamsBulk: writeParamsBulk,
    itemsToBulkWriteRanges: itemsToBulkWriteRanges,
    encodeParamRaw: encodeParamRaw,
    holdRegister: holdRegister,
    isWritePending: isWritePending,
    clearAllHeldRegs: clearAllHeldRegs,
    startLivePoll: startLivePoll,
    startLiveStream: startLiveStream,
    startLive: startLive,
    stopLivePoll: stopLivePoll,
    stopLiveStream: stopLivePoll,
    addConnectionListener: addConnectionListener
  };

  window.onBleConnectionChange = function(connected) {
    if (!connected) {
      stopLivePoll();
      clearAllHeldRegs();
    }
    connectionListeners.forEach(function(fn) {
      try { fn(!!connected); } catch (e) { /* ignore */ }
    });
  };

  document.addEventListener('DOMContentLoaded', function() {
    var sel = document.getElementById('app_demo_mode');
    if (sel) {
      sel.value = getDemoMode();
      sel.addEventListener('change', function() {
        setDemoMode(this.value);
      });
    }
  });
})();
