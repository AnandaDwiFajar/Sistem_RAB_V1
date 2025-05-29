// utils/constants.js

export const DEFAULT_WORK_ITEM_CATEGORIES_FALLBACK = [
  { id: 'default-prep', name: "Pekerjaan Persiapan" },
  { id: 'default-uncat', name: "Uncategorized" }
];

export const DEFAULT_PRIMARY_INPUT_LABELS = [
  "Volume", "Luas", "Luas Datar", "Panjang", "Jumlah", "Set", "Titik", "Unit", "Durasi"
];

export const DEFAULT_UNITS_FALLBACK = [
  { id: 'default-m3', name: "m³" },
  { id: 'default-m2', name: "m²" },
  { id: 'default-pcs', name: "Pcs" }
];

export const DEFAULT_CASH_FLOW_CATEGORIES_FALLBACK = [
  { id: 'default-cf-payment', name: "Pembayaran Klien (Termin)" },
  { id: 'default-cf-other-exp', name: "Lain-lain" }
];

export const OTHER_UNIT_MARKER = '---OTHER_UNIT---';
