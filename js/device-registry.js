'use strict';

var DeviceRegistry = {

  "eastron-sdm630": {
    name: "Eastron SDM630",
    manufacturer: "Eastron",
    phases: 3,
    modbusFunction: 0x04,
    defaultSlaveAddr: 1,
    defaultBaud: 9600,
    groups: [
      {
        title: "Gerilim",
        unit: "V",
        icon: "zap",
        params: [
          { name: "L1 Gerilim", reg: 0x0000, len: 2, type: "float32", precision: 1, demoBase: 230, demoRange: 5 },
          { name: "L2 Gerilim", reg: 0x0002, len: 2, type: "float32", precision: 1, demoBase: 231, demoRange: 5 },
          { name: "L3 Gerilim", reg: 0x0004, len: 2, type: "float32", precision: 1, demoBase: 229, demoRange: 5 }
        ]
      },
      {
        title: "Akım",
        unit: "A",
        icon: "activity",
        params: [
          { name: "L1 Akım", reg: 0x0006, len: 2, type: "float32", precision: 2, demoBase: 5.3, demoRange: 1.5 },
          { name: "L2 Akım", reg: 0x0008, len: 2, type: "float32", precision: 2, demoBase: 4.8, demoRange: 1.5 },
          { name: "L3 Akım", reg: 0x000A, len: 2, type: "float32", precision: 2, demoBase: 5.0, demoRange: 1.5 }
        ]
      },
      {
        title: "Aktif Güç",
        unit: "W",
        icon: "power",
        params: [
          { name: "L1 Aktif Güç", reg: 0x000C, len: 2, type: "float32", precision: 0, demoBase: 1220, demoRange: 200 },
          { name: "L2 Aktif Güç", reg: 0x000E, len: 2, type: "float32", precision: 0, demoBase: 1115, demoRange: 200 },
          { name: "L3 Aktif Güç", reg: 0x0010, len: 2, type: "float32", precision: 0, demoBase: 1150, demoRange: 200 },
          { name: "Toplam Aktif Güç", reg: 0x0034, len: 2, type: "float32", precision: 0, demoBase: 3485, demoRange: 400 }
        ]
      },
      {
        title: "Reaktif Güç",
        unit: "VAr",
        icon: "power",
        params: [
          { name: "L1 Reaktif Güç", reg: 0x0018, len: 2, type: "float32", precision: 0, demoBase: 120, demoRange: 50 },
          { name: "L2 Reaktif Güç", reg: 0x001A, len: 2, type: "float32", precision: 0, demoBase: 105, demoRange: 50 },
          { name: "L3 Reaktif Güç", reg: 0x001C, len: 2, type: "float32", precision: 0, demoBase: 110, demoRange: 50 },
          { name: "Toplam Reaktif Güç", reg: 0x003C, len: 2, type: "float32", precision: 0, demoBase: 335, demoRange: 100 }
        ]
      },
      {
        title: "Güç Faktörü",
        unit: "",
        icon: "percent",
        params: [
          { name: "L1 Güç Faktörü", reg: 0x001E, len: 2, type: "float32", precision: 3, demoBase: 0.99, demoRange: 0.05 },
          { name: "L2 Güç Faktörü", reg: 0x0020, len: 2, type: "float32", precision: 3, demoBase: 0.98, demoRange: 0.05 },
          { name: "L3 Güç Faktörü", reg: 0x0022, len: 2, type: "float32", precision: 3, demoBase: 0.97, demoRange: 0.05 },
          { name: "Toplam Güç Faktörü", reg: 0x003E, len: 2, type: "float32", precision: 3, demoBase: 0.98, demoRange: 0.04 }
        ]
      },
      {
        title: "Frekans",
        unit: "Hz",
        icon: "radio",
        params: [
          { name: "Frekans", reg: 0x0046, len: 2, type: "float32", precision: 2, demoBase: 50.0, demoRange: 0.1 }
        ]
      },
      {
        title: "Enerji",
        unit: "kWh",
        icon: "battery",
        params: [
          { name: "Toplam Aktif Enerji", reg: 0x0156, len: 2, type: "float32", precision: 1, demoBase: 12543.7, demoRange: 0 },
          { name: "Toplam Reaktif Enerji", reg: 0x0158, len: 2, type: "float32", precision: 1, demoBase: 3421.2, demoRange: 0 }
        ]
      }
    ]
  },

  "eastron-sdm120": {
    name: "Eastron SDM120",
    manufacturer: "Eastron",
    phases: 1,
    modbusFunction: 0x04,
    defaultSlaveAddr: 1,
    defaultBaud: 2400,
    groups: [
      {
        title: "Gerilim",
        unit: "V",
        icon: "zap",
        params: [
          { name: "Gerilim", reg: 0x0000, len: 2, type: "float32", precision: 1, demoBase: 230, demoRange: 5 }
        ]
      },
      {
        title: "Akım",
        unit: "A",
        icon: "activity",
        params: [
          { name: "Akım", reg: 0x0006, len: 2, type: "float32", precision: 2, demoBase: 5.3, demoRange: 1.5 }
        ]
      },
      {
        title: "Aktif Güç",
        unit: "W",
        icon: "power",
        params: [
          { name: "Aktif Güç", reg: 0x000C, len: 2, type: "float32", precision: 0, demoBase: 1220, demoRange: 200 }
        ]
      },
      {
        title: "Görünür Güç",
        unit: "VA",
        icon: "power",
        params: [
          { name: "Görünür Güç", reg: 0x0012, len: 2, type: "float32", precision: 0, demoBase: 1240, demoRange: 200 }
        ]
      },
      {
        title: "Reaktif Güç",
        unit: "VAr",
        icon: "power",
        params: [
          { name: "Reaktif Güç", reg: 0x0018, len: 2, type: "float32", precision: 0, demoBase: 120, demoRange: 50 }
        ]
      },
      {
        title: "Güç Faktörü",
        unit: "",
        icon: "percent",
        params: [
          { name: "Güç Faktörü", reg: 0x001E, len: 2, type: "float32", precision: 3, demoBase: 0.99, demoRange: 0.05 }
        ]
      },
      {
        title: "Frekans",
        unit: "Hz",
        icon: "radio",
        params: [
          { name: "Frekans", reg: 0x0046, len: 2, type: "float32", precision: 2, demoBase: 50.0, demoRange: 0.1 }
        ]
      },
      {
        title: "Enerji",
        unit: "kWh",
        icon: "battery",
        params: [
          { name: "Aktif Enerji (Import)", reg: 0x0048, len: 2, type: "float32", precision: 1, demoBase: 4521.3, demoRange: 0 },
          { name: "Aktif Enerji (Export)", reg: 0x004A, len: 2, type: "float32", precision: 1, demoBase: 120.5, demoRange: 0 }
        ]
      }
    ]
  },

  "pzem-004t": {
    name: "PZEM-004T v3",
    manufacturer: "Peacefair",
    phases: 1,
    modbusFunction: 0x04,
    defaultSlaveAddr: 1,
    defaultBaud: 9600,
    groups: [
      {
        title: "Gerilim",
        unit: "V",
        icon: "zap",
        params: [
          { name: "Gerilim", reg: 0x0000, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 230, demoRange: 5 }
        ]
      },
      {
        title: "Akım",
        unit: "A",
        icon: "activity",
        params: [
          { name: "Akım", reg: 0x0001, len: 2, type: "uint32", scale: 0.001, precision: 3, demoBase: 5.3, demoRange: 1.5 }
        ]
      },
      {
        title: "Güç",
        unit: "W",
        icon: "power",
        params: [
          { name: "Aktif Güç", reg: 0x0003, len: 2, type: "uint32", scale: 0.1, precision: 1, demoBase: 1220, demoRange: 200 }
        ]
      },
      {
        title: "Enerji",
        unit: "Wh",
        icon: "battery",
        params: [
          { name: "Enerji", reg: 0x0005, len: 2, type: "uint32", scale: 1, precision: 0, demoBase: 24500, demoRange: 0 }
        ]
      },
      {
        title: "Frekans",
        unit: "Hz",
        icon: "radio",
        params: [
          { name: "Frekans", reg: 0x0007, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 50.0, demoRange: 0.1 }
        ]
      },
      {
        title: "Güç Faktörü",
        unit: "",
        icon: "percent",
        params: [
          { name: "Güç Faktörü", reg: 0x0008, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 0.99, demoRange: 0.05 }
        ]
      }
    ]
  },

  "ddm18sd": {
    name: "DDM18SD",
    manufacturer: "HIKING / DDS",
    phases: 1,
    modbusFunction: 0x03,
    defaultSlaveAddr: 1,
    defaultBaud: 9600,
    groups: [
      {
        title: "Gerilim",
        unit: "V",
        icon: "zap",
        params: [
          { name: "Gerilim", reg: 0x0000, len: 2, type: "float32", precision: 1, demoBase: 230, demoRange: 5 }
        ]
      },
      {
        title: "Akım",
        unit: "A",
        icon: "activity",
        params: [
          { name: "Akım", reg: 0x0008, len: 2, type: "float32", precision: 2, demoBase: 5.3, demoRange: 1.5 }
        ]
      },
      {
        title: "Güç",
        unit: "W",
        icon: "power",
        params: [
          { name: "Aktif Güç", reg: 0x0012, len: 2, type: "float32", precision: 0, demoBase: 1220, demoRange: 200 }
        ]
      },
      {
        title: "Reaktif Güç",
        unit: "VAr",
        icon: "power",
        params: [
          { name: "Reaktif Güç", reg: 0x001A, len: 2, type: "float32", precision: 0, demoBase: 120, demoRange: 50 }
        ]
      },
      {
        title: "Güç Faktörü",
        unit: "",
        icon: "percent",
        params: [
          { name: "Güç Faktörü", reg: 0x002A, len: 2, type: "float32", precision: 3, demoBase: 0.99, demoRange: 0.05 }
        ]
      },
      {
        title: "Frekans",
        unit: "Hz",
        icon: "radio",
        params: [
          { name: "Frekans", reg: 0x0032, len: 2, type: "float32", precision: 2, demoBase: 50.0, demoRange: 0.1 }
        ]
      },
      {
        title: "Enerji",
        unit: "kWh",
        icon: "battery",
        params: [
          { name: "Toplam Enerji", reg: 0x0100, len: 2, type: "float32", precision: 1, demoBase: 8723.4, demoRange: 0 }
        ]
      }
    ]
  }
};

function getDeviceList() {
  var list = [];
  for (var id in DeviceRegistry) {
    if (DeviceRegistry.hasOwnProperty(id)) {
      list.push({ id: id, name: DeviceRegistry[id].name, manufacturer: DeviceRegistry[id].manufacturer, phases: DeviceRegistry[id].phases });
    }
  }
  return list;
}

function getDeviceById(id) {
  return DeviceRegistry[id] || null;
}

function getAllParamsFlat(deviceId) {
  var device = getDeviceById(deviceId);
  if (!device) return [];
  var result = [];
  device.groups.forEach(function(group) {
    group.params.forEach(function(param) {
      result.push({
        id: deviceId + ':' + param.reg,
        name: param.name,
        unit: group.unit,
        group: group.title,
        reg: param.reg,
        len: param.len,
        type: param.type,
        scale: param.scale,
        precision: param.precision,
        demoBase: param.demoBase,
        demoRange: param.demoRange
      });
    });
  });
  return result;
}
