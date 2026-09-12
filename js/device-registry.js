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

  // ENAN Modbus Tablosu REV4 (PDU = PLC 40xxx - 40001)
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
          { name: "Import Aktif Enerji", reg: 476, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 12543, demoRange: 0 },
          { name: "Export Aktif Enerji", reg: 477, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1205, demoRange: 0 },
          { name: "Import Reaktif Enerji", reg: 478, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 3421, demoRange: 0 },
          { name: "Export Reaktif Enerji", reg: 479, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 520, demoRange: 0 }
        ]
      },
      {
        title: "Sayaçlar",
        unit: "",
        icon: "clock",
        params: [
          { name: "Run Hour", reg: 473, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 8760, demoRange: 0 },
          { name: "On Hour", reg: 474, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 6500, demoRange: 0 },
          { name: "Güç Kesilme Sayacı", reg: 475, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 23, demoRange: 0 }
        ]
      },
      {
        title: "Demand",
        unit: "",
        icon: "trending-up",
        params: [
          { name: "Akım Demand", reg: 469, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 4.5, demoRange: 1.0 },
          { name: "Aktif Güç Demand", reg: 470, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 3200, demoRange: 300 },
          { name: "Reaktif Güç Demand", reg: 471, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 300, demoRange: 100 },
          { name: "Görünür Güç Demand", reg: 472, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 3400, demoRange: 300 }
        ]
      },
      {
        title: "Status",
        unit: "",
        icon: "info",
        params: [
          { name: "Status Bayrağı", reg: 468, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 0, demoRange: 0 }
        ]
      },
      {
        title: "Maks. Gerilim",
        unit: "V",
        icon: "chevrons-up",
        params: [
          { name: "Maks. Gerilim A", reg: 408, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 242, demoRange: 3 },
          { name: "Maks. Gerilim B", reg: 409, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 243, demoRange: 3 },
          { name: "Maks. Gerilim C", reg: 410, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 241, demoRange: 3 }
        ]
      },
      {
        title: "Maks. Akım",
        unit: "A",
        icon: "chevrons-up",
        params: [
          { name: "Maks. Akım A", reg: 411, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 7.5, demoRange: 1.0 },
          { name: "Maks. Akım B", reg: 412, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 7.2, demoRange: 1.0 },
          { name: "Maks. Akım C", reg: 413, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 7.3, demoRange: 1.0 }
        ]
      },
      {
        title: "Maks. Frekans",
        unit: "Hz",
        icon: "chevrons-up",
        params: [
          { name: "Maks. Frekans A", reg: 414, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 50.12, demoRange: 0.05 },
          { name: "Maks. Frekans B", reg: 415, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 50.11, demoRange: 0.05 },
          { name: "Maks. Frekans C", reg: 416, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 50.13, demoRange: 0.05 }
        ]
      },
      {
        title: "Maks. Cos φ",
        unit: "",
        icon: "chevrons-up",
        params: [
          { name: "Maks. Cos φ A", reg: 417, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.99, demoRange: 0.02 },
          { name: "Maks. Cos φ B", reg: 418, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.98, demoRange: 0.02 },
          { name: "Maks. Cos φ C", reg: 419, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.97, demoRange: 0.02 }
        ]
      },
      {
        title: "Maks. Güç Faktörü",
        unit: "",
        icon: "chevrons-up",
        params: [
          { name: "Maks. PF A", reg: 420, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.99, demoRange: 0.02 },
          { name: "Maks. PF B", reg: 421, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.98, demoRange: 0.02 },
          { name: "Maks. PF C", reg: 422, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.97, demoRange: 0.02 }
        ]
      },
      {
        title: "Maks. Aktif Güç",
        unit: "W",
        icon: "chevrons-up",
        params: [
          { name: "Maks. Aktif Güç A", reg: 423, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1500, demoRange: 100 },
          { name: "Maks. Aktif Güç B", reg: 424, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1450, demoRange: 100 },
          { name: "Maks. Aktif Güç C", reg: 425, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1480, demoRange: 100 }
        ]
      },
      {
        title: "Maks. Reaktif Güç",
        unit: "VAr",
        icon: "chevrons-up",
        params: [
          { name: "Maks. Reaktif Güç A", reg: 426, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 200, demoRange: 40 },
          { name: "Maks. Reaktif Güç B", reg: 427, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 180, demoRange: 40 },
          { name: "Maks. Reaktif Güç C", reg: 428, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 190, demoRange: 40 }
        ]
      },
      {
        title: "Maks. Görünür Güç",
        unit: "VA",
        icon: "chevrons-up",
        params: [
          { name: "Maks. Görünür Güç A", reg: 429, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1550, demoRange: 100 },
          { name: "Maks. Görünür Güç B", reg: 430, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1500, demoRange: 100 },
          { name: "Maks. Görünür Güç C", reg: 431, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1520, demoRange: 100 }
        ]
      },
      {
        title: "Maks. THD",
        unit: "%",
        icon: "chevrons-up",
        params: [
          { name: "Maks. THDV A", reg: 432, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 3.5, demoRange: 0.5 },
          { name: "Maks. THDV B", reg: 433, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 3.2, demoRange: 0.5 },
          { name: "Maks. THDV C", reg: 434, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 3.4, demoRange: 0.5 },
          { name: "Maks. THDI A", reg: 435, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 12.0, demoRange: 2.0 },
          { name: "Maks. THDI B", reg: 436, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 11.0, demoRange: 2.0 },
          { name: "Maks. THDI C", reg: 437, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 11.5, demoRange: 2.0 }
        ]
      },
      {
        title: "Min. Gerilim",
        unit: "V",
        icon: "chevrons-down",
        params: [
          { name: "Min. Gerilim A", reg: 438, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 218, demoRange: 3 },
          { name: "Min. Gerilim B", reg: 439, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 219, demoRange: 3 },
          { name: "Min. Gerilim C", reg: 440, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 217, demoRange: 3 }
        ]
      },
      {
        title: "Min. Akım",
        unit: "A",
        icon: "chevrons-down",
        params: [
          { name: "Min. Akım A", reg: 441, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 2.1, demoRange: 0.5 },
          { name: "Min. Akım B", reg: 442, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 1.9, demoRange: 0.5 },
          { name: "Min. Akım C", reg: 443, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 2.0, demoRange: 0.5 }
        ]
      },
      {
        title: "Min. Frekans",
        unit: "Hz",
        icon: "chevrons-down",
        params: [
          { name: "Min. Frekans A", reg: 444, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 49.88, demoRange: 0.05 },
          { name: "Min. Frekans B", reg: 445, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 49.89, demoRange: 0.05 },
          { name: "Min. Frekans C", reg: 446, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 49.87, demoRange: 0.05 }
        ]
      },
      {
        title: "Min. Cos φ",
        unit: "",
        icon: "chevrons-down",
        params: [
          { name: "Min. Cos φ A", reg: 447, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.90, demoRange: 0.02 },
          { name: "Min. Cos φ B", reg: 448, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.89, demoRange: 0.02 },
          { name: "Min. Cos φ C", reg: 449, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.88, demoRange: 0.02 }
        ]
      },
      {
        title: "Min. Güç Faktörü",
        unit: "",
        icon: "chevrons-down",
        params: [
          { name: "Min. PF A", reg: 450, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.90, demoRange: 0.02 },
          { name: "Min. PF B", reg: 451, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.89, demoRange: 0.02 },
          { name: "Min. PF C", reg: 452, len: 1, type: "uint16", scale: 0.001, precision: 3, demoBase: 0.88, demoRange: 0.02 }
        ]
      },
      {
        title: "Min. Aktif Güç",
        unit: "W",
        icon: "chevrons-down",
        params: [
          { name: "Min. Aktif Güç A", reg: 453, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 800, demoRange: 100 },
          { name: "Min. Aktif Güç B", reg: 454, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 780, demoRange: 100 },
          { name: "Min. Aktif Güç C", reg: 455, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 790, demoRange: 100 }
        ]
      },
      {
        title: "Min. Reaktif Güç",
        unit: "VAr",
        icon: "chevrons-down",
        params: [
          { name: "Min. Reaktif Güç A", reg: 456, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 50, demoRange: 20 },
          { name: "Min. Reaktif Güç B", reg: 457, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 45, demoRange: 20 },
          { name: "Min. Reaktif Güç C", reg: 458, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 48, demoRange: 20 }
        ]
      },
      {
        title: "Min. Görünür Güç",
        unit: "VA",
        icon: "chevrons-down",
        params: [
          { name: "Min. Görünür Güç A", reg: 459, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 820, demoRange: 100 },
          { name: "Min. Görünür Güç B", reg: 460, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 800, demoRange: 100 },
          { name: "Min. Görünür Güç C", reg: 461, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 810, demoRange: 100 }
        ]
      },
      {
        title: "Min. THD",
        unit: "%",
        icon: "chevrons-down",
        params: [
          { name: "Min. THDV A", reg: 462, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 1.2, demoRange: 0.3 },
          { name: "Min. THDV B", reg: 463, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 1.1, demoRange: 0.3 },
          { name: "Min. THDV C", reg: 464, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 1.15, demoRange: 0.3 },
          { name: "Min. THDI A", reg: 465, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 4.0, demoRange: 1.0 },
          { name: "Min. THDI B", reg: 466, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 3.8, demoRange: 1.0 },
          { name: "Min. THDI C", reg: 467, len: 1, type: "uint16", scale: 0.1, precision: 1, demoBase: 3.9, demoRange: 1.0 }
        ]
      },
      {
        title: "Cihaz Bilgisi",
        unit: "",
        icon: "info",
        params: [
          { name: "FW Versiyon", reg: 560, len: 1, type: "uint16", scale: 0.01, precision: 2, demoBase: 1.05, demoRange: 0 },
          { name: "Model Kodu", reg: 561, len: 1, type: "uint16", scale: 1, precision: 0, demoBase: 1, demoRange: 0 }
        ]
      }
    ],

    // REV4: V-A(30) I-A(93) V-B(156) I-B(219) V-C(282) I-C(345); her blok 1..63
    harmonics: {
      voltage: {
        orders: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63],
        phases: ["A", "B", "C"],
        startReg: 30,
        phaseStartRegs: [30, 156, 282],
        type: "uint16",
        scale: 0.1,
        unit: "%"
      },
      current: {
        orders: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63],
        phases: ["A", "B", "C"],
        startReg: 93,
        phaseStartRegs: [93, 219, 345],
        type: "uint16",
        scale: 0.1,
        unit: "%"
      }
    },

    settings: [
      {
        title: "Ölçüm Ayarları",
        params: [
          { name: "CT Oranı (CTR)", reg: 481, len: 1, type: "uint16", writable: true, min: 1, max: 5000 }
        ]
      },
      {
        title: "Modbus Ayarları",
        params: [
          { name: "Baud Rate", reg: 482, len: 1, type: "uint16", writable: true,
            options: { 1: "2400", 2: "4800", 3: "9600", 4: "19200", 5: "115200" } },
          { name: "Slave Adresi", reg: 483, len: 1, type: "uint16", writable: true, min: 1, max: 247 },
          { name: "Parity", reg: 484, len: 1, type: "uint16", writable: true,
            options: { 0: "None", 1: "Even", 2: "Odd" } }
        ]
      },
      {
        title: "Güvenlik",
        params: [
          { name: "Şifre Aktivasyonu", reg: 485, len: 1, type: "uint16", writable: true,
            options: { 0: "OFF", 1: "ON" } },
          { name: "Şifre Aktivasyon Süresi", reg: 486, len: 1, type: "uint16", writable: true, min: 0, max: 9999 }
        ]
      },
      {
        title: "Alarm Limitleri - Gerilim",
        params: [
          { name: "Gerilim Üst Limit A", reg: 500, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 500 },
          { name: "Gerilim Üst Limit B", reg: 501, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 500 },
          { name: "Gerilim Üst Limit C", reg: 502, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 500 },
          { name: "Gerilim Alt Limit A", reg: 503, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 500 },
          { name: "Gerilim Alt Limit B", reg: 504, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 500 },
          { name: "Gerilim Alt Limit C", reg: 505, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 500 },
          { name: "Gerilim Histerezis A", reg: 506, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 50 },
          { name: "Gerilim Histerezis B", reg: 507, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 50 },
          { name: "Gerilim Histerezis C", reg: 508, len: 1, type: "uint16", writable: true, scale: 0.1, min: 0, max: 50 },
          { name: "Gerilim Gecikme A (s)", reg: 509, len: 1, type: "uint16", writable: true, min: 0, max: 600 },
          { name: "Gerilim Gecikme B (s)", reg: 510, len: 1, type: "uint16", writable: true, min: 0, max: 600 },
          { name: "Gerilim Gecikme C (s)", reg: 511, len: 1, type: "uint16", writable: true, min: 0, max: 600 }
        ]
      },
      {
        title: "Alarm Limitleri - Akım",
        params: [
          { name: "Akım Üst Limit A", reg: 512, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 5000 },
          { name: "Akım Üst Limit B", reg: 513, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 5000 },
          { name: "Akım Üst Limit C", reg: 514, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 5000 },
          { name: "Akım Alt Limit A", reg: 515, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 5000 },
          { name: "Akım Alt Limit B", reg: 516, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 5000 },
          { name: "Akım Alt Limit C", reg: 517, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 5000 },
          { name: "Akım Histerezis A", reg: 518, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 500 },
          { name: "Akım Histerezis B", reg: 519, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 500 },
          { name: "Akım Histerezis C", reg: 520, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 500 },
          { name: "Akım Gecikme A (s)", reg: 521, len: 1, type: "uint16", writable: true, min: 0, max: 600 },
          { name: "Akım Gecikme B (s)", reg: 522, len: 1, type: "uint16", writable: true, min: 0, max: 600 },
          { name: "Akım Gecikme C (s)", reg: 523, len: 1, type: "uint16", writable: true, min: 0, max: 600 }
        ]
      },
      {
        title: "Alarm Limitleri - Cos φ",
        params: [
          { name: "Cos φ Üst Limit A", reg: 524, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "Cos φ Üst Limit B", reg: 525, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "Cos φ Üst Limit C", reg: 526, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "Cos φ Alt Limit A", reg: 527, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "Cos φ Alt Limit B", reg: 528, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "Cos φ Alt Limit C", reg: 529, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "Cos φ Histerezis A", reg: 530, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 0.5 },
          { name: "Cos φ Histerezis B", reg: 531, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 0.5 },
          { name: "Cos φ Histerezis C", reg: 532, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 0.5 },
          { name: "Cos φ Gecikme A (s)", reg: 533, len: 1, type: "uint16", writable: true, min: 0, max: 600 },
          { name: "Cos φ Gecikme B (s)", reg: 534, len: 1, type: "uint16", writable: true, min: 0, max: 600 },
          { name: "Cos φ Gecikme C (s)", reg: 535, len: 1, type: "uint16", writable: true, min: 0, max: 600 }
        ]
      },
      {
        title: "Alarm Limitleri - Güç Faktörü",
        params: [
          { name: "PF Üst Limit A", reg: 536, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "PF Üst Limit B", reg: 537, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "PF Üst Limit C", reg: 538, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "PF Alt Limit A", reg: 539, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "PF Alt Limit B", reg: 540, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "PF Alt Limit C", reg: 541, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 1 },
          { name: "PF Histerezis A", reg: 542, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 0.5 },
          { name: "PF Histerezis B", reg: 543, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 0.5 },
          { name: "PF Histerezis C", reg: 544, len: 1, type: "uint16", writable: true, scale: 0.001, min: 0, max: 0.5 },
          { name: "PF Gecikme A (s)", reg: 545, len: 1, type: "uint16", writable: true, min: 0, max: 600 },
          { name: "PF Gecikme B (s)", reg: 546, len: 1, type: "uint16", writable: true, min: 0, max: 600 },
          { name: "PF Gecikme C (s)", reg: 547, len: 1, type: "uint16", writable: true, min: 0, max: 600 }
        ]
      },
      {
        title: "Alarm Limitleri - Frekans",
        params: [
          { name: "Frekans Üst Limit A", reg: 548, len: 1, type: "uint16", writable: true, scale: 0.01, min: 45, max: 65 },
          { name: "Frekans Üst Limit B", reg: 549, len: 1, type: "uint16", writable: true, scale: 0.01, min: 45, max: 65 },
          { name: "Frekans Üst Limit C", reg: 550, len: 1, type: "uint16", writable: true, scale: 0.01, min: 45, max: 65 },
          { name: "Frekans Alt Limit A", reg: 551, len: 1, type: "uint16", writable: true, scale: 0.01, min: 45, max: 65 },
          { name: "Frekans Alt Limit B", reg: 552, len: 1, type: "uint16", writable: true, scale: 0.01, min: 45, max: 65 },
          { name: "Frekans Alt Limit C", reg: 553, len: 1, type: "uint16", writable: true, scale: 0.01, min: 45, max: 65 },
          { name: "Frekans Histerezis A", reg: 554, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 5 },
          { name: "Frekans Histerezis B", reg: 555, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 5 },
          { name: "Frekans Histerezis C", reg: 556, len: 1, type: "uint16", writable: true, scale: 0.01, min: 0, max: 5 },
          { name: "Frekans Gecikme A (s)", reg: 557, len: 1, type: "uint16", writable: true, min: 0, max: 600 },
          { name: "Frekans Gecikme B (s)", reg: 558, len: 1, type: "uint16", writable: true, min: 0, max: 600 },
          { name: "Frekans Gecikme C (s)", reg: 559, len: 1, type: "uint16", writable: true, min: 0, max: 600 }
        ]
      }
    ],

    commands: [
      { name: "Enerji Değerlerini Sıfırla", reg: 567, writeValue: 1, confirm: true },
      { name: "Maksimum Değerleri Sıfırla", reg: 568, writeValue: 1, confirm: true },
      { name: "Minimum Değerleri Sıfırla", reg: 569, writeValue: 1, confirm: true },
      { name: "Demand Değerlerini Sıfırla", reg: 570, writeValue: 1, confirm: true },
      { name: "Ayarları Sıfırla", reg: 571, writeValue: 1, confirm: true },
      { name: "Alarm Limitlerini Sıfırla", reg: 572, writeValue: 1, confirm: true },
      { name: "Fabrika Ayarlarına Dön", reg: 573, writeValue: 1, confirm: true }
    ],

    ios: {
      relays: [
        { name: "Röle 1", reg: 487, len: 1, type: "uint16", writable: true,
          options: { 0: "OFF", 1: "ON" } },
        { name: "Röle 2", reg: 488, len: 1, type: "uint16", writable: true,
          options: { 0: "OFF", 1: "ON" } }
      ],
      digitalOutputs: [
        { name: "DO1", reg: 489, len: 1, type: "uint16", writable: true,
          options: { 0: "OFF", 1: "ON" } },
        { name: "DO2", reg: 490, len: 1, type: "uint16", writable: true,
          options: { 0: "OFF", 1: "ON" } },
        { name: "DO3", reg: 491, len: 1, type: "uint16", writable: true,
          options: { 0: "OFF", 1: "ON" } },
        { name: "DO4", reg: 492, len: 1, type: "uint16", writable: true,
          options: { 0: "OFF", 1: "ON" } }
      ],
      digitalInputs: [
        { name: "DI1", reg: 493, len: 1, type: "uint16" },
        { name: "DI2", reg: 494, len: 1, type: "uint16" },
        { name: "DI3", reg: 495, len: 1, type: "uint16" },
        { name: "DI4", reg: 496, len: 1, type: "uint16" }
      ],
      analogInputs: [
        { name: "AI1", reg: 497, len: 1, type: "uint16", unit: "V", scale: 0.01 },
        { name: "AI2", reg: 498, len: 1, type: "uint16", unit: "V", scale: 0.01 }
      ],
      analogOutputs: [
        { name: "DAC", reg: 499, len: 1, type: "uint16", writable: true,
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

/**
 * Sayfa görünürlüğü SSOT — bottom-nav ve redirect buradan okunur.
 * Kaynak: DeviceRegistry alanları (groups / harmonics / settings / ios) + 'manual' modu.
 *
 * @param {string|null|undefined} deviceId registry id | 'manual' | '' | null
 * @returns {{
 *   dashboard: boolean,
 *   charts: boolean,
 *   harmonics: boolean,
 *   'device-settings': boolean,
 *   'io-monitor': boolean,
 *   settings: boolean
 * }}
 */
function getDeviceCapabilities(deviceId) {
  var gatewaySettings = true;

  if (!deviceId) {
    return {
      dashboard: true,
      charts: false,
      harmonics: false,
      'device-settings': false,
      'io-monitor': false,
      settings: gatewaySettings
    };
  }

  if (deviceId === 'manual') {
    return {
      dashboard: false,
      charts: false,
      harmonics: false,
      'device-settings': false,
      'io-monitor': false,
      settings: gatewaySettings
    };
  }

  var device = getDeviceById(deviceId);
  if (!device) {
    return {
      dashboard: true,
      charts: false,
      harmonics: false,
      'device-settings': false,
      'io-monitor': false,
      settings: gatewaySettings
    };
  }

  var hasGroups = !!(device.groups && device.groups.length);
  var hasHarmonics = !!(device.harmonics && Object.keys(device.harmonics).length);
  var hasDeviceSettings = !!(device.settings && device.settings.length);
  var ios = device.ios;
  var hasIo = !!(ios && (
    (ios.digitalInputs && ios.digitalInputs.length) ||
    (ios.digitalOutputs && ios.digitalOutputs.length) ||
    (ios.relays && ios.relays.length) ||
    (ios.analogInputs && ios.analogInputs.length) ||
    (ios.analogOutputs && ios.analogOutputs.length)
  ));

  return {
    dashboard: hasGroups,
    charts: hasGroups,
    harmonics: hasHarmonics,
    'device-settings': hasDeviceSettings,
    'io-monitor': hasIo,
    settings: gatewaySettings
  };
}

function isPageAvailableForDevice(pageId, deviceId) {
  var caps = getDeviceCapabilities(deviceId);
  return !!caps[pageId];
}

/** Cihaz için ilk uygun sayfa (nav sırasına yakın öncelik). */
function getFallbackPageForDevice(deviceId) {
  var order = ['dashboard', 'settings', 'charts', 'harmonics', 'device-settings', 'io-monitor'];
  var caps = getDeviceCapabilities(deviceId);
  for (var i = 0; i < order.length; i++) {
    if (caps[order[i]]) return order[i];
  }
  return 'settings';
}

window.getDeviceCapabilities = getDeviceCapabilities;
window.isPageAvailableForDevice = isPageAvailableForDevice;
window.getFallbackPageForDevice = getFallbackPageForDevice;

/** Ortak empty-state ikonları (24 viewBox). */
var EMPTY_STATE_ICONS = {
  meter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  harmonics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="8" width="4" height="13" rx="1"/><rect x="17" y="4" width="4" height="17" rx="1"/></svg>',
  config: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>',
  io: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  device: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>'
};

/**
 * Ortak boş durum HTML’i.
 * @param {{ icon?: string, title: string, desc?: string, actions?: Array<{action:string,label:string,primary?:boolean}> }} opts
 */
function emptyStateHtml(opts) {
  opts = opts || {};
  var icon = EMPTY_STATE_ICONS[opts.icon || 'device'] || EMPTY_STATE_ICONS.device;
  var html = '<div class="empty-state" role="status">';
  html += '<div class="empty-state-icon" aria-hidden="true">' + icon + '</div>';
  html += '<p class="empty-state-title">' + (opts.title || '') + '</p>';
  if (opts.desc) html += '<p class="empty-state-desc">' + opts.desc + '</p>';
  if (opts.actions && opts.actions.length) {
    html += '<div class="empty-state-actions">';
    opts.actions.forEach(function(a) {
      html += '<button type="button" class="empty-state-btn' + (a.primary ? ' is-primary' : '') +
        '" data-empty-action="' + a.action + '">' + a.label + '</button>';
    });
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function bindEmptyStateActions(root) {
  var scope = root || document;
  scope.querySelectorAll('[data-empty-action]').forEach(function(btn) {
    if (btn.dataset.emptyBound === '1') return;
    btn.dataset.emptyBound = '1';
    btn.addEventListener('click', function() {
      var action = this.dataset.emptyAction;
      if (action === 'connect') {
        var connectBtn = document.getElementById('butConnect');
        if (connectBtn) connectBtn.click();
      } else if (action === 'focus-device') {
        var sel = document.getElementById('header-device-select');
        var label = document.getElementById('header-device-name');
        if (label) label.classList.add('hidden');
        if (sel) {
          sel.classList.remove('hidden');
          sel.focus();
          try { sel.showPicker(); } catch (e) { /* ignore */ }
        }
      } else if (action === 'settings') {
        if (typeof window.showPage === 'function') window.showPage('settings');
      } else if (action === 'add-chart') {
        var addBtn = document.getElementById('add-chart-btn');
        if (addBtn) addBtn.click();
      } else if (action === 'dashboard') {
        if (typeof window.showPage === 'function') window.showPage('dashboard');
      } else if (action === 'try-demo') {
        if (typeof window.tryDemoDevice === 'function') window.tryDemoDevice();
      }
    });
  });
}

window.emptyStateHtml = emptyStateHtml;
window.bindEmptyStateActions = bindEmptyStateActions;

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
