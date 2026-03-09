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
  },

  "entes-mpr45s": {
    name: "Entes MPR45S",
    manufacturer: "ENTES",
    phases: 3,
    modbusFunction: 0x03,
    defaultSlaveAddr: 1,
    defaultBaud: 9600,
    groups: [
      {
        title: "Faz-Nötr Gerilim",
        unit: "V",
        icon: "zap",
        params: [
          { name: "L1-N Gerilim", reg: 0x0000, len: 2, type: "uint32", scale: 0.1, precision: 1, demoBase: 230, demoRange: 5 },
          { name: "L2-N Gerilim", reg: 0x0002, len: 2, type: "uint32", scale: 0.1, precision: 1, demoBase: 231, demoRange: 5 },
          { name: "L3-N Gerilim", reg: 0x0004, len: 2, type: "uint32", scale: 0.1, precision: 1, demoBase: 229, demoRange: 5 }
        ]
      },
      {
        title: "Faz-Faz Gerilim",
        unit: "V",
        icon: "zap",
        params: [
          { name: "L1-L2 Gerilim", reg: 0x0008, len: 2, type: "uint32", scale: 0.1, precision: 1, demoBase: 400, demoRange: 5 },
          { name: "L2-L3 Gerilim", reg: 0x000A, len: 2, type: "uint32", scale: 0.1, precision: 1, demoBase: 401, demoRange: 5 },
          { name: "L3-L1 Gerilim", reg: 0x000C, len: 2, type: "uint32", scale: 0.1, precision: 1, demoBase: 399, demoRange: 5 }
        ]
      },
      {
        title: "Akım",
        unit: "A",
        icon: "activity",
        params: [
          { name: "L1 Akım", reg: 0x000E, len: 2, type: "uint32", scale: 0.001, precision: 2, demoBase: 5.3, demoRange: 1.5 },
          { name: "L2 Akım", reg: 0x0010, len: 2, type: "uint32", scale: 0.001, precision: 2, demoBase: 4.8, demoRange: 1.5 },
          { name: "L3 Akım", reg: 0x0012, len: 2, type: "uint32", scale: 0.001, precision: 2, demoBase: 5.0, demoRange: 1.5 },
          { name: "Nötr Akım", reg: 0x0016, len: 2, type: "uint32", scale: 0.001, precision: 2, demoBase: 0.5, demoRange: 0.3 }
        ]
      },
      {
        title: "Frekans",
        unit: "Hz",
        icon: "radio",
        params: [
          { name: "Frekans", reg: 0x0018, len: 2, type: "uint32", scale: 0.01, precision: 2, demoBase: 50.0, demoRange: 0.1 }
        ]
      },
      {
        title: "Aktif Güç",
        unit: "W",
        icon: "power",
        params: [
          { name: "L1 Aktif Güç", reg: 0x001A, len: 2, type: "float32", precision: 0, demoBase: 1220, demoRange: 200 },
          { name: "L2 Aktif Güç", reg: 0x001C, len: 2, type: "float32", precision: 0, demoBase: 1115, demoRange: 200 },
          { name: "L3 Aktif Güç", reg: 0x001E, len: 2, type: "float32", precision: 0, demoBase: 1150, demoRange: 200 },
          { name: "Toplam İthal Aktif Güç", reg: 0x0022, len: 2, type: "float32", precision: 0, demoBase: 3485, demoRange: 400 },
          { name: "Toplam İhraç Aktif Güç", reg: 0x0024, len: 2, type: "float32", precision: 0, demoBase: 0, demoRange: 0 },
          { name: "Toplam Aktif Güç (±)", reg: 0x0026, len: 2, type: "float32", precision: 0, demoBase: 3485, demoRange: 400 }
        ]
      },
      {
        title: "Reaktif Güç",
        unit: "VAr",
        icon: "power",
        params: [
          { name: "L1 Reaktif Güç", reg: 0x0028, len: 2, type: "float32", precision: 0, demoBase: 120, demoRange: 50 },
          { name: "L2 Reaktif Güç", reg: 0x002A, len: 2, type: "float32", precision: 0, demoBase: 105, demoRange: 50 },
          { name: "L3 Reaktif Güç", reg: 0x002C, len: 2, type: "float32", precision: 0, demoBase: 110, demoRange: 50 },
          { name: "Toplam Reaktif Güç (±)", reg: 0x0038, len: 2, type: "float32", precision: 0, demoBase: 335, demoRange: 100 }
        ]
      },
      {
        title: "Görünür Güç",
        unit: "VA",
        icon: "power",
        params: [
          { name: "L1 Görünür Güç", reg: 0x003A, len: 2, type: "float32", precision: 0, demoBase: 1240, demoRange: 200 },
          { name: "L2 Görünür Güç", reg: 0x003C, len: 2, type: "float32", precision: 0, demoBase: 1130, demoRange: 200 },
          { name: "L3 Görünür Güç", reg: 0x003E, len: 2, type: "float32", precision: 0, demoBase: 1170, demoRange: 200 },
          { name: "Toplam Görünür Güç (±)", reg: 0x0046, len: 2, type: "float32", precision: 0, demoBase: 3540, demoRange: 400 }
        ]
      },
      {
        title: "Güç Faktörü",
        unit: "",
        icon: "percent",
        params: [
          { name: "L1 Güç Faktörü", reg: 0x0048, len: 2, type: "int32", scale: 0.001, precision: 3, demoBase: 0.99, demoRange: 0.05 },
          { name: "L2 Güç Faktörü", reg: 0x004A, len: 2, type: "int32", scale: 0.001, precision: 3, demoBase: 0.98, demoRange: 0.05 },
          { name: "L3 Güç Faktörü", reg: 0x004C, len: 2, type: "int32", scale: 0.001, precision: 3, demoBase: 0.97, demoRange: 0.05 },
          { name: "Toplam Güç Faktörü", reg: 0x0050, len: 2, type: "int32", scale: 0.001, precision: 3, demoBase: 0.98, demoRange: 0.04 }
        ]
      },
      {
        title: "Cos Phi",
        unit: "",
        icon: "percent",
        params: [
          { name: "L1 Cos Phi", reg: 0x0052, len: 2, type: "int32", scale: 0.001, precision: 3, demoBase: 0.99, demoRange: 0.03 },
          { name: "L2 Cos Phi", reg: 0x0054, len: 2, type: "int32", scale: 0.001, precision: 3, demoBase: 0.98, demoRange: 0.03 },
          { name: "L3 Cos Phi", reg: 0x0056, len: 2, type: "int32", scale: 0.001, precision: 3, demoBase: 0.97, demoRange: 0.03 },
          { name: "Toplam Cos Phi", reg: 0x005A, len: 2, type: "int32", scale: 0.001, precision: 3, demoBase: 0.98, demoRange: 0.03 }
        ]
      },
      {
        title: "Enerji",
        unit: "Wh",
        icon: "battery",
        params: [
          { name: "Toplam Tüketilen Aktif Enerji", reg: 0x00D8, len: 4, type: "uint64", scale: 1, precision: 0, demoBase: 12543700, demoRange: 0 },
          { name: "Toplam Üretilen Aktif Enerji", reg: 0x00EC, len: 4, type: "uint64", scale: 1, precision: 0, demoBase: 1205000, demoRange: 0 },
          { name: "Toplam Tüketilen Görünür Enerji", reg: 0x0100, len: 4, type: "uint64", scale: 1, precision: 0, demoBase: 13100000, demoRange: 0 },
          { name: "Q1 Toplam Reaktif Enerji", reg: 0x0128, len: 4, type: "uint64", scale: 1, precision: 0, demoBase: 3421200, demoRange: 0 }
        ]
      },
      {
        title: "THD Gerilim",
        unit: "%",
        icon: "bar-chart-2",
        params: [
          { name: "L1 Gerilim THD", reg: 0x07D6, len: 2, type: "uint32", scale: 0.1, precision: 1, demoBase: 2.5, demoRange: 1.0 },
          { name: "L2 Gerilim THD", reg: 0x07D8, len: 2, type: "uint32", scale: 0.1, precision: 1, demoBase: 2.3, demoRange: 1.0 },
          { name: "L3 Gerilim THD", reg: 0x07DA, len: 2, type: "uint32", scale: 0.1, precision: 1, demoBase: 2.4, demoRange: 1.0 }
        ]
      },
      {
        title: "THD Akım",
        unit: "%",
        icon: "bar-chart-2",
        params: [
          { name: "L1 Akım THD", reg: 0x07DE, len: 2, type: "uint32", scale: 0.1, precision: 1, demoBase: 8.5, demoRange: 3.0 },
          { name: "L2 Akım THD", reg: 0x07E0, len: 2, type: "uint32", scale: 0.1, precision: 1, demoBase: 7.8, demoRange: 3.0 },
          { name: "L3 Akım THD", reg: 0x07E2, len: 2, type: "uint32", scale: 0.1, precision: 1, demoBase: 8.0, demoRange: 3.0 }
        ]
      }
    ],

    harmonics: {
      current: {
        startReg: 0x0BB8,
        phases: ["L1", "L2", "L3", "N"],
        maxOrder: 51,
        type: "ushort",
        scale: 0.1,
        unit: "%"
      },
      voltagePN: {
        startReg: 0x0FA0,
        phases: ["L1", "L2", "L3"],
        maxOrder: 51,
        type: "ushort",
        scale: 0.1,
        unit: "%"
      },
      voltageLL: {
        startReg: 0x1388,
        phases: ["L1-L2", "L2-L3", "L3-L1"],
        maxOrder: 51,
        type: "ushort",
        scale: 0.1,
        unit: "%"
      }
    },

    settings: [
      {
        title: "Şebeke Ayarları",
        params: [
          { name: "Şebeke Tipi", reg: 0x4268, len: 1, type: "ushort", writable: true,
            options: { 0: "3P4W", 1: "3P3W", 2: "ARON", 3: "3P4W Dengeli", 4: "3P3W Dengeli" } },
          { name: "CT Sekonder", reg: 0x4269, len: 1, type: "ushort", writable: true,
            options: { 0: "1A", 1: "5A" } },
          { name: "CT Primer", reg: 0x426A, len: 1, type: "ushort", writable: true, min: 5, max: 9999 },
          { name: "VT Mevcut", reg: 0x426B, len: 1, type: "ushort", writable: true,
            options: { 0: "Yok", 1: "Var" } },
          { name: "VT Sekonder", reg: 0x426C, len: 1, type: "ushort", writable: true, min: 50, max: 300 },
          { name: "VT Primer", reg: 0x426D, len: 2, type: "uint32", writable: true, min: 50, max: 999999 },
          { name: "P Demand Süresi", reg: 0x426F, len: 1, type: "ushort", writable: true,
            options: { 1: "1 dk", 5: "5 dk", 10: "10 dk", 15: "15 dk", 20: "20 dk", 30: "30 dk", 60: "60 dk" } },
          { name: "I Demand Süresi", reg: 0x4270, len: 1, type: "ushort", writable: true,
            options: { 1: "1 dk", 5: "5 dk", 10: "10 dk", 15: "15 dk", 20: "20 dk", 30: "30 dk", 60: "60 dk" } },
          { name: "Sistem Frekansı", reg: 0x4272, len: 1, type: "ushort", writable: true,
            options: { 0: "50 Hz", 1: "60 Hz" } }
        ]
      },
      {
        title: "Modbus Ayarları",
        params: [
          { name: "Protokol", reg: 0x42E3, len: 1, type: "ushort", writable: true,
            options: { 0: "MODBUS", 1: "ENTBUS" } },
          { name: "Slave Adresi", reg: 0x42E4, len: 1, type: "ushort", writable: true, min: 1, max: 247 },
          { name: "Baud Rate", reg: 0x42E5, len: 1, type: "ushort", writable: true,
            options: { 0: "2400", 1: "4800", 2: "9600", 3: "19200", 4: "38400", 5: "57600", 6: "115200" } },
          { name: "Parity", reg: 0x42E6, len: 1, type: "ushort", writable: true,
            options: { 0: "None", 1: "Odd", 2: "Even" } }
        ]
      },
      {
        title: "Cihaz Ayarları",
        params: [
          { name: "Şifre Aktif", reg: 0x42E7, len: 1, type: "ushort", writable: true,
            options: { 0: "Pasif", 1: "Aktif" } },
          { name: "Şifre", reg: 0x42E8, len: 1, type: "ushort", writable: true, min: 0, max: 9999 },
          { name: "LCD Kontrast", reg: 0x42E9, len: 1, type: "ushort", writable: true, min: 0, max: 15 },
          { name: "LCD Arka Işık", reg: 0x42EA, len: 1, type: "ushort", writable: true,
            options: { 0: "Kapalı", 1: "Açık", 2: "Otomatik" } },
          { name: "Dil", reg: 0x42EB, len: 1, type: "ushort", writable: true,
            options: { 0: "English", 1: "Türkçe", 2: "Deutsch", 3: "Français" } }
        ]
      }
    ]
  },

  "devinno-enan01": {
    name: "Devinno ENAN-01",
    manufacturer: "Devinno",
    phases: 3,
    modbusFunction: 0x03,
    defaultSlaveAddr: 1,
    defaultBaud: 9600,
    groups: [
      {
        title: "Gerilim",
        unit: "V",
        icon: "zap",
        params: [
          { name: "Gerilim A", reg: 0, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 230, demoRange: 5 },
          { name: "Gerilim B", reg: 1, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 231, demoRange: 5 },
          { name: "Gerilim C", reg: 2, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 229, demoRange: 5 }
        ]
      },
      {
        title: "Akım",
        unit: "A",
        icon: "activity",
        params: [
          { name: "Akım A", reg: 3, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 5.3, demoRange: 1.5 },
          { name: "Akım B", reg: 4, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 4.8, demoRange: 1.5 },
          { name: "Akım C", reg: 5, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 5.0, demoRange: 1.5 }
        ]
      },
      {
        title: "Frekans",
        unit: "Hz",
        icon: "radio",
        params: [
          { name: "Frekans A", reg: 6, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 50.0, demoRange: 0.1 },
          { name: "Frekans B", reg: 7, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 50.0, demoRange: 0.1 },
          { name: "Frekans C", reg: 8, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 50.0, demoRange: 0.1 }
        ]
      },
      {
        title: "Cos φ",
        unit: "",
        icon: "percent",
        params: [
          { name: "Cos φ A", reg: 9, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.99, demoRange: 0.03 },
          { name: "Cos φ B", reg: 10, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.98, demoRange: 0.03 },
          { name: "Cos φ C", reg: 11, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.97, demoRange: 0.03 }
        ]
      },
      {
        title: "Güç Faktörü",
        unit: "",
        icon: "percent",
        params: [
          { name: "PF A", reg: 12, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.99, demoRange: 0.05 },
          { name: "PF B", reg: 13, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.98, demoRange: 0.05 },
          { name: "PF C", reg: 14, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.97, demoRange: 0.05 }
        ]
      },
      {
        title: "Aktif Güç",
        unit: "W",
        icon: "power",
        params: [
          { name: "Aktif Güç A", reg: 15, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1220, demoRange: 200 },
          { name: "Aktif Güç B", reg: 16, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1115, demoRange: 200 },
          { name: "Aktif Güç C", reg: 17, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1150, demoRange: 200 }
        ]
      },
      {
        title: "Reaktif Güç",
        unit: "VAr",
        icon: "power",
        params: [
          { name: "Reaktif Güç A", reg: 18, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 120, demoRange: 50 },
          { name: "Reaktif Güç B", reg: 19, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 105, demoRange: 50 },
          { name: "Reaktif Güç C", reg: 20, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 110, demoRange: 50 }
        ]
      },
      {
        title: "Görünür Güç",
        unit: "VA",
        icon: "power",
        params: [
          { name: "Görünür Güç A", reg: 21, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1240, demoRange: 200 },
          { name: "Görünür Güç B", reg: 22, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1130, demoRange: 200 },
          { name: "Görünür Güç C", reg: 23, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1170, demoRange: 200 }
        ]
      },
      {
        title: "THD Gerilim",
        unit: "%",
        icon: "bar-chart-2",
        params: [
          { name: "THDV A", reg: 24, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 2.5, demoRange: 1.0 },
          { name: "THDV B", reg: 25, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 2.3, demoRange: 1.0 },
          { name: "THDV C", reg: 26, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 2.4, demoRange: 1.0 }
        ]
      },
      {
        title: "THD Akım",
        unit: "%",
        icon: "bar-chart-2",
        params: [
          { name: "THDI A", reg: 27, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 8.5, demoRange: 3.0 },
          { name: "THDI B", reg: 28, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 7.8, demoRange: 3.0 },
          { name: "THDI C", reg: 29, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 8.0, demoRange: 3.0 }
        ]
      },
      {
        title: "Enerji",
        unit: "kWh",
        icon: "battery",
        params: [
          { name: "Import Aktif Enerji", reg: 194, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 12543, demoRange: 0 },
          { name: "Export Aktif Enerji", reg: 195, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1205, demoRange: 0 },
          { name: "Import Reaktif Enerji", reg: 196, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 3421, demoRange: 0 },
          { name: "Export Reaktif Enerji", reg: 197, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 520, demoRange: 0 }
        ]
      },
      {
        title: "Sayaçlar",
        unit: "",
        icon: "clock",
        params: [
          { name: "Run Hour", reg: 191, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 8760, demoRange: 0 },
          { name: "On Hour", reg: 192, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 6500, demoRange: 0 },
          { name: "Güç Kesilme Sayacı", reg: 193, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 23, demoRange: 0 }
        ]
      },
      {
        title: "Demand",
        unit: "",
        icon: "trending-up",
        params: [
          { name: "Akım Demand", reg: 187, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 4.5, demoRange: 1.0 },
          { name: "Aktif Güç Demand", reg: 188, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 3200, demoRange: 300 },
          { name: "Reaktif Güç Demand", reg: 189, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 300, demoRange: 100 },
          { name: "Görünür Güç Demand", reg: 190, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 3400, demoRange: 300 }
        ]
      },
      {
        title: "Maks. Gerilim",
        unit: "V",
        icon: "chevrons-up",
        params: [
          { name: "Maks. Gerilim A", reg: 126, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 242, demoRange: 3 },
          { name: "Maks. Gerilim B", reg: 127, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 243, demoRange: 3 },
          { name: "Maks. Gerilim C", reg: 128, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 241, demoRange: 3 }
        ]
      },
      {
        title: "Min. Gerilim",
        unit: "V",
        icon: "chevrons-down",
        params: [
          { name: "Min. Gerilim A", reg: 129, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 218, demoRange: 3 },
          { name: "Min. Gerilim B", reg: 130, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 219, demoRange: 3 },
          { name: "Min. Gerilim C", reg: 131, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 217, demoRange: 3 }
        ]
      },
      {
        title: "Maks. Akım",
        unit: "A",
        icon: "chevrons-up",
        params: [
          { name: "Maks. Akım A", reg: 132, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 7.5, demoRange: 1.0 },
          { name: "Maks. Akım B", reg: 133, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 7.2, demoRange: 1.0 },
          { name: "Maks. Akım C", reg: 134, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 7.3, demoRange: 1.0 }
        ]
      },
      {
        title: "Min. Akım",
        unit: "A",
        icon: "chevrons-down",
        params: [
          { name: "Min. Akım A", reg: 135, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 2.1, demoRange: 0.5 },
          { name: "Min. Akım B", reg: 136, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 1.9, demoRange: 0.5 },
          { name: "Min. Akım C", reg: 137, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 2.0, demoRange: 0.5 }
        ]
      },
      {
        title: "Maks. Frekans",
        unit: "Hz",
        icon: "chevrons-up",
        params: [
          { name: "Maks. Frekans A", reg: 138, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 50.12, demoRange: 0.05 },
          { name: "Maks. Frekans B", reg: 139, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 50.11, demoRange: 0.05 },
          { name: "Maks. Frekans C", reg: 140, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 50.13, demoRange: 0.05 }
        ]
      },
      {
        title: "Min. Frekans",
        unit: "Hz",
        icon: "chevrons-down",
        params: [
          { name: "Min. Frekans A", reg: 141, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 49.88, demoRange: 0.05 },
          { name: "Min. Frekans B", reg: 142, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 49.89, demoRange: 0.05 },
          { name: "Min. Frekans C", reg: 143, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 49.87, demoRange: 0.05 }
        ]
      },
      {
        title: "Maks. Aktif Güç",
        unit: "W",
        icon: "chevrons-up",
        params: [
          { name: "Maks. Aktif Güç A", reg: 156, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1500, demoRange: 100 },
          { name: "Maks. Aktif Güç B", reg: 157, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1450, demoRange: 100 },
          { name: "Maks. Aktif Güç C", reg: 158, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1480, demoRange: 100 }
        ]
      },
      {
        title: "Min. Aktif Güç",
        unit: "W",
        icon: "chevrons-down",
        params: [
          { name: "Min. Aktif Güç A", reg: 159, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 800, demoRange: 100 },
          { name: "Min. Aktif Güç B", reg: 160, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 780, demoRange: 100 },
          { name: "Min. Aktif Güç C", reg: 161, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 790, demoRange: 100 }
        ]
      },
      {
        title: "Cihaz Bilgisi",
        unit: "",
        icon: "info",
        params: [
          { name: "FW Versiyon", reg: 278, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 1.05, demoRange: 0 },
          { name: "Model Kodu", reg: 279, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1, demoRange: 0 }
        ]
      }
    ],

    harmonics: {
      voltage: {
        orders: [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31],
        phases: ["A", "B", "C"],
        startReg: 30,
        type: "uint16",
        scale: 0.1,
        unit: "%"
      },
      current: {
        orders: [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31],
        phases: ["A", "B", "C"],
        startReg: 78,
        type: "uint16",
        scale: 0.1,
        unit: "%"
      }
    },

    settings: [
      {
        title: "Ölçüm Ayarları",
        params: [
          { name: "CT Oranı (CTR)", reg: 199, len: 1, type: "uint16", writable: true, min: 1, max: 5000 }
        ]
      },
      {
        title: "Modbus Ayarları",
        params: [
          { name: "Baud Rate", reg: 200, len: 1, type: "uint16", writable: true,
            options: { 0: "2400", 1: "4800", 2: "9600", 3: "19200", 4: "38400", 5: "57600", 6: "115200" } },
          { name: "Slave Adresi", reg: 201, len: 1, type: "uint16", writable: true, min: 1, max: 247 },
          { name: "Parity", reg: 202, len: 1, type: "uint16", writable: true,
            options: { 0: "None", 1: "Odd", 2: "Even" } }
        ]
      },
      {
        title: "Güvenlik",
        params: [
          { name: "Şifre", reg: 203, len: 1, type: "uint16", writable: true, min: 0, max: 9999 }
        ]
      },
      {
        title: "Alarm Limitleri - Gerilim",
        params: [
          { name: "Gerilim A Üst Limit", reg: 218, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 500 },
          { name: "Gerilim A Alt Limit", reg: 219, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 500 },
          { name: "Gerilim A Histerezis", reg: 220, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 50 },
          { name: "Gerilim A Gecikme (s)", reg: 221, len: 1, type: "uint16", writable: true, min: 0, max: 600 },
          { name: "Gerilim B Üst Limit", reg: 222, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 500 },
          { name: "Gerilim B Alt Limit", reg: 223, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 500 },
          { name: "Gerilim B Histerezis", reg: 224, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 50 },
          { name: "Gerilim B Gecikme (s)", reg: 225, len: 1, type: "uint16", writable: true, min: 0, max: 600 },
          { name: "Gerilim C Üst Limit", reg: 226, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 500 },
          { name: "Gerilim C Alt Limit", reg: 227, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 500 },
          { name: "Gerilim C Histerezis", reg: 228, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 50 },
          { name: "Gerilim C Gecikme (s)", reg: 229, len: 1, type: "uint16", writable: true, min: 0, max: 600 }
        ]
      },
      {
        title: "Alarm Limitleri - Akım",
        params: [
          { name: "Akım A Üst Limit", reg: 230, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 5000 },
          { name: "Akım A Alt Limit", reg: 231, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 5000 },
          { name: "Akım A Histerezis", reg: 232, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 500 },
          { name: "Akım A Gecikme (s)", reg: 233, len: 1, type: "uint16", writable: true, min: 0, max: 600 },
          { name: "Akım B Üst Limit", reg: 234, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 5000 },
          { name: "Akım B Alt Limit", reg: 235, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 5000 },
          { name: "Akım B Histerezis", reg: 236, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 500 },
          { name: "Akım B Gecikme (s)", reg: 237, len: 1, type: "uint16", writable: true, min: 0, max: 600 },
          { name: "Akım C Üst Limit", reg: 238, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 5000 },
          { name: "Akım C Alt Limit", reg: 239, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 5000 },
          { name: "Akım C Histerezis", reg: 240, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 500 },
          { name: "Akım C Gecikme (s)", reg: 241, len: 1, type: "uint16", writable: true, min: 0, max: 600 }
        ]
      },
      {
        title: "Alarm Limitleri - Cos φ",
        params: [
          { name: "Cos φ A Üst Limit", reg: 242, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "Cos φ A Alt Limit", reg: 243, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "Cos φ A Histerezis", reg: 244, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 0.5 },
          { name: "Cos φ A Gecikme (s)", reg: 245, len: 1, type: "uint16", writable: true, min: 0, max: 600 },
          { name: "Cos φ B Üst Limit", reg: 246, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "Cos φ B Alt Limit", reg: 247, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "Cos φ B Histerezis", reg: 248, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 0.5 },
          { name: "Cos φ B Gecikme (s)", reg: 249, len: 1, type: "uint16", writable: true, min: 0, max: 600 },
          { name: "Cos φ C Üst Limit", reg: 250, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "Cos φ C Alt Limit", reg: 251, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "Cos φ C Histerezis", reg: 252, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 0.5 },
          { name: "Cos φ C Gecikme (s)", reg: 253, len: 1, type: "uint16", writable: true, min: 0, max: 600 }
        ]
      },
      {
        title: "Alarm Limitleri - Frekans",
        params: [
          { name: "Frekans Üst Limit", reg: 266, len: 1, type: "uint16", writable: true, scale: 0.01, min: 45, max: 65 },
          { name: "Frekans Alt Limit", reg: 267, len: 1, type: "uint16", writable: true, scale: 0.01, min: 45, max: 65 },
          { name: "Frekans Histerezis", reg: 268, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 5 },
          { name: "Frekans Gecikme (s)", reg: 269, len: 1, type: "uint16", writable: true, min: 0, max: 600 }
        ]
      }
    ],

    commands: [
      { name: "Enerji Sayaçlarını Sıfırla", reg: 285, writeValue: 1, confirm: true },
      { name: "Maksimum Değerleri Sıfırla", reg: 286, writeValue: 1, confirm: true },
      { name: "Minimum Değerleri Sıfırla", reg: 287, writeValue: 1, confirm: true },
      { name: "Demand Değerlerini Sıfırla", reg: 288, writeValue: 1, confirm: true },
      { name: "Ayarları Sıfırla", reg: 289, writeValue: 1, confirm: true },
      { name: "Alarm Ayarlarını Sıfırla", reg: 290, writeValue: 1, confirm: true },
      { name: "Fabrika Ayarlarına Dön", reg: 291, writeValue: 1, confirm: true }
    ],

    ios: {
      relays: [
        { name: "Röle 1", reg: 205, len: 1, type: "uint16", writable: true,
          options: { 0: "OFF", 1: "ON" } },
        { name: "Röle 2", reg: 206, len: 1, type: "uint16", writable: true,
          options: { 0: "OFF", 1: "ON" } }
      ],
      digitalOutputs: [
        { name: "DO1", reg: 207, len: 1, type: "uint16", writable: true,
          options: { 0: "OFF", 1: "ON" } },
        { name: "DO2", reg: 208, len: 1, type: "uint16", writable: true,
          options: { 0: "OFF", 1: "ON" } },
        { name: "DO3", reg: 209, len: 1, type: "uint16", writable: true,
          options: { 0: "OFF", 1: "ON" } },
        { name: "DO4", reg: 210, len: 1, type: "uint16", writable: true,
          options: { 0: "OFF", 1: "ON" } }
      ],
      digitalInputs: [
        { name: "DI1", reg: 211, len: 1, type: "uint16" },
        { name: "DI2", reg: 212, len: 1, type: "uint16" },
        { name: "DI3", reg: 213, len: 1, type: "uint16" },
        { name: "DI4", reg: 214, len: 1, type: "uint16" }
      ],
      analogInputs: [
        { name: "AI1", reg: 215, len: 1, type: "uint16", unit: "V", scale: 0.01 },
        { name: "AI2", reg: 216, len: 1, type: "uint16", unit: "V", scale: 0.01 }
      ],
      analogOutputs: [
        { name: "DAC", reg: 217, len: 1, type: "uint16", writable: true,
          min: 0, max: 255, unit: "V", formula: "4.6 * value / 256" }
      ]
    }
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

/**
 * Ham Modbus uint16 register dizisini, parametre tipine göre gerçek değere çevirir.
 * @param {number[]} registers - Big-endian uint16 register dizisi
 * @param {{ type: string, scale?: number, len: number }} param - Parametre tanımı
 * @returns {number}
 */
function decodeRegisterValue(registers, param) {
  var buf, view;
  switch (param.type) {
    case 'float32':
      buf = new ArrayBuffer(4);
      view = new DataView(buf);
      view.setUint16(0, registers[0], false);
      view.setUint16(2, registers[1], false);
      return view.getFloat32(0, false);
    case 'uint16':
      return registers[0] * (param.scale || 1);
    case 'uint32':
      buf = new ArrayBuffer(4);
      view = new DataView(buf);
      view.setUint16(0, registers[0], false);
      view.setUint16(2, registers[1], false);
      return view.getUint32(0, false) * (param.scale || 1);
    case 'int32':
      buf = new ArrayBuffer(4);
      view = new DataView(buf);
      view.setUint16(0, registers[0], false);
      view.setUint16(2, registers[1], false);
      return view.getInt32(0, false) * (param.scale || 1);
    case 'uint64':
      buf = new ArrayBuffer(8);
      view = new DataView(buf);
      view.setUint16(0, registers[0], false);
      view.setUint16(2, registers[1], false);
      view.setUint16(4, registers[2], false);
      view.setUint16(6, registers[3], false);
      var high = view.getUint32(0, false);
      var low  = view.getUint32(4, false);
      return (high * 0x100000000 + low) * (param.scale || 1);
    default:
      return registers[0];
  }
}
