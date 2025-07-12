/**
 * @file src/utils/calculationSchemas.js
 * Mendefinisikan semua skema kalkulasi yang tersedia dalam aplikasi.
 * Setiap skema berisi metadata, parameter input, output, dan fungsi kalkulasi.
 * Skema dikelompokkan berdasarkan kategori pekerjaan konstruksi untuk kemudahan navigasi di UI.
 */

export const CALCULATION_SCHEMAS = {
  // =================================================================================
  // Kategori: Dasar
  // =================================================================================
  SIMPLE_PRIMARY_INPUT: {
      id: 'SIMPLE_PRIMARY_INPUT',
      group: 'Dasar',
      name: 'Input Sederhana (berdasarkan kuantitas)',
      description: 'Kalkulasi paling dasar. Biaya dihitung langsung dari kuantitas utama (misalnya, per m², m³, atau unit lainnya).',
      isSimple: true,
      inputs: [],
      output: { label: 'Kuantitas Primer', unitSymbol: 'unit' },
  },

  // =================================================================================
  // Kategori: Pekerjaan Persiapan
  // =================================================================================
  SITE_CLEARING: {
      id: 'SITE_CLEARING',
      group: 'Pekerjaan Persiapan',
      name: 'Pembersihan dan Perataan Lahan',
      description: 'Menghitung luas area untuk pekerjaan pembersihan dan perataan lahan awal.',
      inputs: [
          { key: 'panjang_lahan', label: 'Panjang Lahan', unitSymbol: 'm', type: 'number', defaultValue: 20.00 },
          { key: 'lebar_lahan', label: 'Lebar Lahan', unitSymbol: 'm', type: 'number', defaultValue: 10.00 },
      ],
      output: { key: 'luas_lahan', label: 'Luas Lahan', unitSymbol: 'm²' },
      calculate: (inputs) => {
          const [p, l] = [inputs.panjang_lahan, inputs.lebar_lahan].map(parseFloat);
          if ([p, l].some(isNaN) || p <= 0 || l <= 0) return null;
          return p * l;
      },
  },
  BOWPLANK_INSTALLATION: {
      id: 'BOWPLANK_INSTALLATION',
      group: 'Pekerjaan Persiapan',
      name: 'Pengukuran dan Pemasangan Bouwplank',
      description: 'Menghitung total panjang bouwplank yang dibutuhkan di sekeliling area bangunan.',
      inputs: [
          { key: 'panjang_bangunan', label: 'Panjang Area Bangunan', unitSymbol: 'm', type: 'number', defaultValue: 15.00 },
          { key: 'lebar_bangunan', label: 'Lebar Area Bangunan', unitSymbol: 'm', type: 'number', defaultValue: 8.00 },
          { key: 'jarak_dari_bangunan', label: 'Jarak Bouwplank dari As Bangunan', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
      ],
      output: { key: 'panjang_bouwplank', label: 'Total Panjang Bouwplank', unitSymbol: 'm' },
      calculate: (inputs) => {
          const [p, l, j] = [inputs.panjang_bangunan, inputs.lebar_bangunan, inputs.jarak_dari_bangunan].map(parseFloat);
          if ([p, l, j].some(isNaN) || p <= 0 || l <= 0 || j <= 0) return null;
          return (p + 2 * j) * 2 + (l + 2 * j) * 2;
      },
  },

  // =================================================================================
  // Kategori: Pekerjaan Pondasi
  // =================================================================================
  TRAPEZOID_FOUNDATION_EXCAVATION: {
      id: 'TRAPEZOID_FOUNDATION_EXCAVATION',
      group: 'Pekerjaan Pondasi',
      name: 'Galian Tanah Pondasi',
      description: 'Menghitung volume galian tanah untuk pondasi menerus berbentuk trapesium.',
      inputs: [
          { key: 'a', label: 'Lebar Atas', unitSymbol: 'm', type: 'number', defaultValue: 0.70 },
          { key: 'b', label: 'Lebar Bawah', unitSymbol: 'm', type: 'number', defaultValue: 0.50 },
          { key: 'c', label: 'Dalam Galian', unitSymbol: 'm', type: 'number', defaultValue: 0.60 },
          { key: 'p', label: 'Panjang Galian', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
      ],
      output: { key: 'volume_galian', label: 'Volume Galian', unitSymbol: 'm³' },
      calculate: (inputs) => {
          const [a, b, c, p] = [inputs.a, inputs.b, inputs.c, inputs.p].map(parseFloat);
          if ([a, b, c, p].some(isNaN) || a <= 0 || b <= 0 || c <= 0 || p <= 0 || a < b) return null;
          return ((a + b) / 2) * c * p;
      },
  },
  TRAPEZOID_STONE_FOUNDATION: {
      id: 'TRAPEZOID_STONE_FOUNDATION',
      group: 'Pekerjaan Pondasi',
      name: 'Pasangan Pondasi Batu Kali',
      description: 'Menghitung volume pasangan pondasi batu kali berbentuk trapesium.',
      inputs: [
          { key: 'a_pondasi', label: 'Lebar Atas', unitSymbol: 'm', type: 'number', defaultValue: 0.40 },
          { key: 'b_pondasi', label: 'Lebar Bawah', unitSymbol: 'm', type: 'number', defaultValue: 0.50 },
          { key: 't_pondasi', label: 'Tinggi Pondasi', unitSymbol: 'm', type: 'number', defaultValue: 0.70 },
          { key: 'p_pondasi', label: 'Panjang Pondasi', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
      ],
      output: { key: 'volume_pondasi', label: 'Volume Pondasi', unitSymbol: 'm³' },
      calculate: (inputs) => {
          const [a, b, t, p] = [inputs.a_pondasi, inputs.b_pondasi, inputs.t_pondasi, inputs.p_pondasi].map(parseFloat);
          if ([a, b, t, p].some(isNaN) || a <= 0 || b <= 0 || t <= 0 || p <= 0) return null;
          return ((a + b) / 2) * t * p;
      },
  },
  FOOTING_CONCRETE_VOLUME: {
      id: 'FOOTING_CONCRETE_VOLUME',
      group: 'Pekerjaan Pondasi',
      name: 'Volume Beton Pondasi Tapak (Footing)',
      description: 'Menghitung volume beton untuk satu unit pondasi tapak (cakar ayam).',
      inputs: [
          { key: 'panjang_tapak', label: 'Panjang Tapak', unitSymbol: 'm', type: 'number', defaultValue: 1.0 },
          { key: 'lebar_tapak', label: 'Lebar Tapak', unitSymbol: 'm', type: 'number', defaultValue: 1.0 },
          { key: 'tebal_tapak', label: 'Tebal Tapak', unitSymbol: 'm', type: 'number', defaultValue: 0.25 },
      ],
      output: { key: 'volume_beton_tapak', label: 'Volume Beton per Tapak', unitSymbol: 'm³' },
      calculate: (inputs) => {
          const [p, l, t] = [inputs.panjang_tapak, inputs.lebar_tapak, inputs.tebal_tapak].map(parseFloat);
          if ([p, l, t].some(isNaN) || p <= 0 || l <= 0 || t <= 0) return null;
          return p * l * t;
      }
  },

  // =================================================================================
  // Kategori: Pekerjaan Beton & Pembesian
  // =================================================================================
  CONCRETE_SLOOF_VOLUME: {
      id: 'CONCRETE_SLOOF_VOLUME',
      group: 'Pekerjaan Beton & Pembesian',
      name: 'Volume Beton Sloof',
      description: 'Menghitung volume beton untuk pekerjaan sloof.',
      inputs: [
          { key: 'lebar_sloof', label: 'Lebar Sloof', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
          { key: 'tinggi_sloof', label: 'Tinggi Sloof', unitSymbol: 'm', type: 'number', defaultValue: 0.20 },
          { key: 'panjang_sloof', label: 'Panjang Sloof', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
      ],
      output: { key: 'volume_beton_sloof', label: 'Volume Beton Sloof', unitSymbol: 'm³' },
      calculate: (inputs) => {
          const [l, t, p] = [inputs.lebar_sloof, inputs.tinggi_sloof, inputs.panjang_sloof].map(parseFloat);
          if ([l, t, p].some(isNaN) || l <= 0 || t <= 0 || p <= 0) return null;
          return l * t * p;
      },
  },
  REBAR_SLOOF: {
      id: 'REBAR_SLOOF',
      group: 'Pekerjaan Beton & Pembesian',
      name: 'Pembesian Sloof',
      description: 'Menghitung kebutuhan besi tulangan utama dan sengkang untuk sloof.',
      inputs: [
          { key: 'jumlah_utama', label: 'Besi Utama per Sloof', unitSymbol: 'bh', type: 'number', defaultValue: 4 },
          { key: 'panjang_sloof', label: 'Panjang Sloof', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
          { key: 'panjang_sengkang', label: '1 Besi Sengkang', unitSymbol: 'm', type: 'number', defaultValue: 0.98 },
          { key: 'jarak_sengkang', label: 'Jarak Sengkang', unitSymbol: 'm', type: 'number', defaultValue: 0.25 },
          { key: 'panjang_besi_standar', label: 'Panjang Besi Standar', unitSymbol: 'm', type: 'number', defaultValue: 12 },
      ],
      output: { key: 'total_besi', label: 'Total Kebutuhan Besi', unitSymbol: '' },
      calculate: (inputs) => {
          const [utama, p, lenS, spc, std] = [inputs.jumlah_utama, inputs.panjang_sloof, inputs.panjang_sengkang, inputs.jarak_sengkang, inputs.panjang_besi_standar].map(parseFloat);
          if ([utama, p, lenS, spc, std].some(isNaN) || [utama, p, lenS, spc, std].some(v => v <= 0)) return null;
          const totalUtama = (utama * p) / std;
          const totalSengkang = (Math.ceil(p / spc) * lenS) / std;
          return `Utama: ${totalUtama.toFixed(2)} btg, Sengkang: ${totalSengkang.toFixed(2)} btg`;
      },
  },
  CONCRETE_COLUMN_VOLUME: {
      id: 'CONCRETE_COLUMN_VOLUME',
      group: 'Pekerjaan Beton & Pembesian',
      name: 'Volume Beton Kolom',
      description: 'Menghitung volume beton untuk kolom struktur.',
      inputs: [
          { key: 'lebar_kolom', label: 'Lebar Kolom', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
          { key: 'tinggi_kolom', label: 'Tinggi Kolom', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
          { key: 'panjang_kolom', label: 'Panjang Kolom', unitSymbol: 'm', type: 'number', defaultValue: 4.00 },
      ],
      output: { key: 'volume_beton_kolom', label: 'Volume Beton Kolom', unitSymbol: 'm³' },
      calculate: (inputs) => {
          const [w, d, h] = [inputs.lebar_kolom, inputs.tinggi_kolom, inputs.panjang_kolom].map(parseFloat);
          if ([w, d, h].some(isNaN) || w <= 0 || d <= 0 || h <= 0) return null;
          return w * d * h;
      },
  },
  REBAR_COLUMN: {
      id: 'REBAR_COLUMN',
      group: 'Pekerjaan Beton & Pembesian',
      name: 'Pembesian Kolom',
      description: 'Menghitung kebutuhan besi tulangan utama dan sengkang untuk kolom.',
      inputs: [
          { key: 'jumlah_utama', label: 'Besi Utama per Kolom', unitSymbol: 'bh', type: 'number', defaultValue: 4 },
          { key: 'panjang_kolom', label: 'Panjang Kolom', unitSymbol: 'm', type: 'number', defaultValue: 4.00 },
          { key: 'panjang_sengkang', label: '1 Besi Sengkang', unitSymbol: 'm', type: 'number', defaultValue: 0.98 },
          { key: 'jarak_sengkang', label: 'Jarak Sengkang', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
          { key: 'panjang_besi_standar', label: 'Panjang Besi Standar', unitSymbol: 'm', type: 'number', defaultValue: 12 },
      ],
      output: { key: 'total_besi_kolom', label: 'Total Kebutuhan Besi', unitSymbol: '' },
      calculate: (inputs) => {
          const [utama, p, lenS, spc, std] = [inputs.jumlah_utama, inputs.panjang_kolom, inputs.panjang_sengkang, inputs.jarak_sengkang, inputs.panjang_besi_standar].map(parseFloat);
          if ([utama, p, lenS, spc, std].some(isNaN) || [utama, p, lenS, spc, std].some(v => v <= 0)) return null;
          const totalUtama = (utama * p) / std;
          const totalSengkang = (Math.ceil(p / spc) * lenS) / std;
          return `Utama: ${totalUtama.toFixed(2)} btg, Sengkang: ${totalSengkang.toFixed(2)} btg`;
      },
  },
  CONCRETE_RINGBEAM_VOLUME: {
      id: 'CONCRETE_RINGBEAM_VOLUME',
      group: 'Pekerjaan Beton & Pembesian',
      name: 'Volume Beton Ringbalk',
      description: 'Menghitung volume beton untuk balok lingkar (ringbalk).',
      inputs: [
          { key: 'lebar_ringbalk', label: 'Lebar Ringbalk', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
          { key: 'tinggi_ringbalk', label: 'Tinggi Ringbalk', unitSymbol: 'm', type: 'number', defaultValue: 0.25 },
          { key: 'panjang_ringbalk', label: 'Panjang Ringbalk', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
      ],
      output: { key: 'volume_beton_ringbalk', label: 'Volume Beton Ringbalk', unitSymbol: 'm³' },
      calculate: (inputs) => {
          const [w, h, p] = [inputs.lebar_ringbalk, inputs.tinggi_ringbalk, inputs.panjang_ringbalk].map(parseFloat);
          if ([w, h, p].some(isNaN) || w <= 0 || h <= 0 || p <= 0) return null;
          return w * h * p;
      },
  },
  REBAR_RINGBEAM: {
      id: 'REBAR_RINGBEAM',
      group: 'Pekerjaan Beton & Pembesian',
      name: 'Pembesian Ringbalk',
      description: 'Menghitung kebutuhan besi tulangan utama dan sengkang untuk ringbalk.',
      inputs: [
          { key: 'jumlah_utama', label: 'Besi Utama per Ringbalk', unitSymbol: 'bh', type: 'number', defaultValue: 4 },
          { key: 'panjang_ringbalk', label: 'Panjang Ringbalk', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
          { key: 'panjang_sengkang', label: '1 Besi Sengkang', unitSymbol: 'm', type: 'number', defaultValue: 0.98 },
          { key: 'jarak_sengkang', label: 'Jarak Sengkang', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
          { key: 'panjang_besi_standar', label: 'Panjang Besi Standar', unitSymbol: 'm', type: 'number', defaultValue: 12 },
      ],
      output: { key: 'total_besi_ringbalk', label: 'Total Kebutuhan Besi', unitSymbol: '' },
      calculate: (inputs) => {
          const [utama, p, lenS, spc, std] = [inputs.jumlah_utama, inputs.panjang_ringbalk, inputs.panjang_sengkang, inputs.jarak_sengkang, inputs.panjang_besi_standar].map(parseFloat);
          if ([utama, p, lenS, spc, std].some(isNaN) || [utama, p, lenS, spc, std].some(v => v <= 0)) return null;
          const totalUtama = (utama * p) / std;
          const totalSengkang = (Math.ceil(p / spc) * lenS) / std;
          return `Utama: ${totalUtama.toFixed(2)} btg, Sengkang: ${totalSengkang.toFixed(2)} btg`;
      },
  },
  CONCRETE_FLOOR_SLAB_VOLUME: {
      id: 'CONCRETE_FLOOR_SLAB_VOLUME',
      group: 'Pekerjaan Beton & Pembesian',
      name: 'Volume Beton Cor Dak Lantai',
      description: 'Menghitung volume beton untuk pekerjaan cor dak lantai.',
      inputs: [
          { key: 'panjang_lantai', label: 'Panjang Lantai', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
          { key: 'lebar_lantai', label: 'Lebar Lantai', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
          { key: 'tebal_lantai', label: 'Tebal Lantai', unitSymbol: 'm', type: 'number', defaultValue: 0.12 },
      ],
      output: { key: 'volume_beton_lantai', label: 'Total Volume Beton', unitSymbol: 'm³' },
      calculate: (inputs) => {
          const [p, l, t] = [inputs.panjang_lantai, inputs.lebar_lantai, inputs.tebal_lantai].map(parseFloat);
          if ([p, l, t].some(isNaN) || p <= 0 || l <= 0 || t <= 0) return null;
          return p * l * t;
      },
  },
  REBAR_FLOOR_SLAB: {
      id: 'REBAR_FLOOR_SLAB',
      group: 'Pekerjaan Beton & Pembesian',
      name: 'Pembesian Cor Dak Lantai',
      description: 'Menghitung kebutuhan besi untuk tulangan cor dak lantai.',
      inputs: [
          { key: 'panjang_lantai', label: 'Panjang Lantai', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
          { key: 'lebar_lantai', label: 'Lebar Lantai', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
          { key: 'jarak_besi', label: 'Jarak Besi', unitSymbol: 'm', type: 'number', defaultValue: 0.200 },
          { key: 'panjang_besi_standar', label: 'Panjang Besi Standar', unitSymbol: 'm', type: 'number', defaultValue: 12 },

      ],
      output: { key: 'total_kebutuhan', label: 'Total Kebutuhan', unitSymbol: 'btg' },
      calculate: (inputs) => {
          const [p, l, j, s] = [inputs.panjang_lantai, inputs.lebar_lantai, inputs.jarak_besi, inputs.panjang_besi_standar].map(parseFloat);
          if ([p, l, j, s].some(isNaN) || p <= 0 || l <= 0 || j <= 0 || s <= 0) return null;
          const jumlahBesiArahP = Math.ceil(l / j) + 1;
          const jumlahBesiArahL = Math.ceil(p / j) + 1;
          const totalPanjangBesi = (jumlahBesiArahP * p) + (jumlahBesiArahL * l);
          return totalPanjangBesi / s;
      },
  },
  STEEL_REBAR_WEIGHT_FROM_LENGTH: {
      id: 'STEEL_REBAR_WEIGHT_FROM_LENGTH',
      group: 'Pekerjaan Beton & Pembesian',
      name: 'Berat Besi Beton (dari Panjang & Diameter)',
      description: 'Menghitung berat total besi beton berdasarkan panjang total, diameter, dan berat jenis besi.',
      inputs: [
          { key: 'diameter_besi_mm', label: 'Diameter Besi', unitSymbol: 'mm', type: 'number', defaultValue: 10 },
          { key: 'panjang_total_besi_m', label: 'Panjang Total Besi', unitSymbol: 'm', type: 'number', defaultValue: 12.00 },
      ],
      output: { key: 'berat_total_besi', label: 'Berat Total Besi', unitSymbol: 'kg' },
      calculate: (inputs) => {
          const [diameterMm, totalLengthM] = [inputs.diameter_besi_mm, inputs.panjang_total_besi_m].map(parseFloat);
          if ([diameterMm, totalLengthM].some(isNaN) || diameterMm <= 0 || totalLengthM <= 0) return null;
          const weightPerMeter = 0.006165 * Math.pow(diameterMm, 2);
          return weightPerMeter * totalLengthM;
      },
  },

  // =================================================================================
  // Kategori: Pekerjaan Dinding & Plesteran
  // =================================================================================
  WALL_AREA: {
      id: 'WALL_AREA',
      group: 'Pekerjaan Dinding & Plesteran',
      name: 'Luas Pasangan Dinding',
      description: 'Menghitung luas permukaan dinding untuk berbagai keperluan (pasangan bata, plester, aci, cat).',
      inputs: [
          { key: 'tinggi_pasangan', label: 'Tinggi Pasangan', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
          { key: 'panjang_pasangan', label: 'Panjang Pasangan', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
          { key: 'luas_bukaan', label: 'Luas Bukaan (Pintu/Jendela)', unitSymbol: 'm²', type: 'number', defaultValue: 0 },
      ],
      output: { key: 'luas_pasangan', label: 'Luas Pasangan', unitSymbol: 'm²' },
      calculate: (inputs) => {
          const [t, p, o] = [inputs.tinggi_pasangan, inputs.panjang_pasangan, inputs.luas_bukaan].map(v => parseFloat(v || 0));
          if ([t, p].some(isNaN) || t <= 0 || p <= 0 || o < 0) return null;
          const grossArea = t * p;
          if (o >= grossArea) return 0;
          return grossArea - o;
      },
  },
  PLASTERING_AREA: {
      id: 'PLASTERING_AREA',
      group: 'Pekerjaan Dinding & Plesteran',
      name: 'Luas Plesteran',
      description: 'Menghitung luas permukaan untuk pekerjaan plesteran.',
      inputs: [
          { key: 'tinggi_plesteran', label: 'Tinggi Plesteran', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
          { key: 'panjang_plesteran', label: 'Panjang Plesteran', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
      ],
      output: { key: 'luas_plesteran', label: 'Luas Plesteran', unitSymbol: 'm²' },
      calculate: (inputs) => {
          const [t, p] = [inputs.tinggi_plesteran, inputs.panjang_plesteran].map(parseFloat);
          if ([t, p].some(isNaN) || t <= 0 || p <= 0) return null;
          return t * p;
      },
  },
  SKIM_COAT_AREA: {
      id: 'SKIM_COAT_AREA',
      group: 'Pekerjaan Dinding & Plesteran',
      name: 'Luas Acian',
      description: 'Menghitung luas permukaan untuk pekerjaan acian.',
      inputs: [
          { key: 'tinggi_acian', label: 'Tinggi Acian', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
          { key: 'panjang_acian', label: 'Panjang Acian', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
      ],
      output: { key: 'luas_acian', label: 'Luas Acian', unitSymbol: 'm²' },
      calculate: (inputs) => {
          const [t, p] = [inputs.tinggi_acian, inputs.panjang_acian].map(parseFloat);
          if ([t, p].some(isNaN) || t <= 0 || p <= 0) return null;
          return t * p;
      },
  },
  BRICKWORK_QUANTITY: {
      id: 'BRICKWORK_QUANTITY',
      group: 'Pekerjaan Dinding & Plesteran',
      name: 'Kebutuhan Bata Dinding',
      description: 'Menghitung jumlah bata (merah/ringan/batako) untuk dinding, berdasarkan luas dan ukuran bata + siar.',
      inputs: [
          { key: 'luas_dinding_bata', label: 'Luas Dinding (Netto)', unitSymbol: 'm²', type: 'number', defaultValue: 10.00 },
          { key: 'panjang_bata_pasang', label: 'Panjang Bata + Siar', unitSymbol: 'cm', type: 'number', defaultValue: 24 },
          { key: 'tinggi_bata_pasang', label: 'Tinggi Bata + Siar', unitSymbol: 'cm', type: 'number', defaultValue: 11 },
      ],
      output: { key: 'jumlah_bata', label: 'Jumlah Bata', unitSymbol: 'bh' },
      calculate: (inputs) => {
          const [area, lenBrickCm, hgtBrickCm] = [inputs.luas_dinding_bata, inputs.panjang_bata_pasang, inputs.tinggi_bata_pasang].map(parseFloat);
          if ([area, lenBrickCm, hgtBrickCm].some(isNaN) || area <= 0 || lenBrickCm <= 0 || hgtBrickCm <= 0) return null;
          const lenBrickM = lenBrickCm / 100;
          const hgtBrickM = hgtBrickCm / 100;
          return Math.ceil(area / (lenBrickM * hgtBrickM));
      },
  },
  MORTAR_PLASTERING: {
      id: 'MORTAR_PLASTERING',
      group: 'Pekerjaan Dinding & Plesteran',
      name: 'Kebutuhan Semen & Pasir Plesteran',
      description: 'Menghitung estimasi kebutuhan semen dan pasir untuk pekerjaan plesteran dinding.',
      inputs: [
          { key: 'luas_plesteran', label: 'Luas Total Plesteran', unitSymbol: 'm²', type: 'number', defaultValue: 50.00 },
          { key: 'tebal_plesteran_mm', label: 'Tebal Plesteran', unitSymbol: 'mm', type: 'number', defaultValue: 15 },
          { key: 'koefisien_semen_kg', label: 'Koefisien Semen per m³ Mortar', unitSymbol: 'kg/m³', type: 'number', defaultValue: 326 },
          { key: 'koefisien_pasir', label: 'Koefisien Pasir per m³ Mortar', unitSymbol: 'm³/m³', type: 'number', defaultValue: 1.02 },
      ],
      output: { key: 'material_plesteran', label: 'Estimasi Material', unitSymbol: '' },
      calculate: (inputs) => {
          const [area, thickness, cementCoeff, sandCoeff] = [inputs.luas_plesteran, inputs.tebal_plesteran_mm, inputs.koefisien_semen_kg, inputs.koefisien_pasir].map(parseFloat);
          if ([area, thickness].some(isNaN) || area <= 0 || thickness <= 0) return null;
          const mortarVolume = area * (thickness / 1000);
          const totalCementKg = mortarVolume * cementCoeff;
          const totalSandM3 = mortarVolume * sandCoeff;
          const totalCementBags = Math.ceil(totalCementKg / 50);
          return `Semen: ${totalCementBags} sak, Pasir: ${totalSandM3.toFixed(2)} m³`;
      },
  },
  MORTAR_SKIM_COAT: {
      id: 'MORTAR_SKIM_COAT',
      group: 'Pekerjaan Dinding & Plesteran',
      name: 'Kebutuhan Semen Acian',
      description: 'Menghitung kebutuhan semen untuk pekerjaan acian dinding.',
      inputs: [
          { key: 'luas_acian', label: 'Luas Total Acian', unitSymbol: 'm²', type: 'number', defaultValue: 50.00 },
          { key: 'koefisien_semen_acian', label: 'Koefisien Kebutuhan Semen', unitSymbol: 'kg/m²', type: 'number', defaultValue: 3.25 },
      ],
      output: { key: 'semen_acian_sak', label: 'Total Semen Acian', unitSymbol: 'sak' },
      calculate: (inputs) => {
          const [area, cementCoeff] = [inputs.luas_acian, inputs.koefisien_semen_acian].map(parseFloat);
          if ([area, cementCoeff].some(isNaN) || area <= 0 || cementCoeff <= 0) return null;
          const totalCementKg = area * cementCoeff;
          return Math.ceil(totalCementKg / 40);
      },
  },

  // =================================================================================
  // Kategori: Pekerjaan Bekisting
  // =================================================================================
  FORMWORK_BEAM_SLOOF: {
      id: 'FORMWORK_BEAM_SLOOF',
      group: 'Pekerjaan Bekisting',
      name: 'Luas Bekisting Balok/Sloof',
      description: 'Menghitung luas bekisting untuk sisi samping dan bagian bawah balok atau sloof.',
      inputs: [
          { key: 'lebar_penampang', label: 'Lebar Penampang', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
          { key: 'tinggi_penampang', label: 'Tinggi Penampang', unitSymbol: 'm', type: 'number', defaultValue: 0.20 },
          { key: 'panjang_total', label: 'Panjang Total', unitSymbol: 'm', type: 'number', defaultValue: 10.00 },
      ],
      output: { key: 'luas_bekisting', label: 'Luas Bekisting', unitSymbol: 'm²' },
      calculate: (inputs) => {
          const [w, h, l] = [inputs.lebar_penampang, inputs.tinggi_penampang, inputs.panjang_total].map(parseFloat);
          if ([w, h, l].some(isNaN) || w <= 0 || h <= 0 || l <= 0) return null;
          return ((2 * h) + w) * l;
      },
  },
  FORMWORK_COLUMN: {
      id: 'FORMWORK_COLUMN',
      group: 'Pekerjaan Bekisting',
      name: 'Luas Bekisting Kolom',
      description: 'Menghitung luas bekisting untuk keempat sisi kolom.',
      inputs: [
          { key: 'lebar_kolom_form', label: 'Lebar Kolom', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
          { key: 'tebal_kolom_form', label: 'Tebal Kolom', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
          { key: 'tinggi_kolom_form', label: 'Tinggi Total Kolom', unitSymbol: 'm', type: 'number', defaultValue: 3.00 },
      ],
      output: { key: 'luas_bekisting_kolom', label: 'Luas Bekisting Kolom', unitSymbol: 'm²' },
      calculate: (inputs) => {
          const [w, d, h] = [inputs.lebar_kolom_form, inputs.tebal_kolom_form, inputs.tinggi_kolom_form].map(parseFloat);
          if ([w, d, h].some(isNaN) || w <= 0 || d <= 0 || h <= 0) return null;
          return (2 * w + 2 * d) * h;
      }
  },

  // =================================================================================
  // Kategori: Pekerjaan Lantai & Keramik
  // =================================================================================
  FLOOR_AREA: {
      id: 'FLOOR_AREA',
      group: 'Pekerjaan Lantai & Keramik',
      name: 'Luas Lantai Keramik',
      description: 'Menghitung luas area lantai untuk pemasangan keramik.',
      inputs: [
          { key: 'lebar_lantai', label: 'Lebar Lantai', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
          { key: 'panjang_lantai', label: 'Panjang Lantai', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
      ],
      output: { key: 'luas_lantai', label: 'Luas Lantai', unitSymbol: 'm²' },
      calculate: (inputs) => {
          const [l, p] = [inputs.lebar_lantai, inputs.panjang_lantai].map(parseFloat);
          if ([l, p].some(isNaN) || l <= 0 || p <= 0) return null;
          return l * p;
      },
  },
  FLOOR_TILE_QUANTITY: {
      id: 'FLOOR_TILE_QUANTITY',
      group: 'Pekerjaan Lantai & Keramik',
      name: 'Kebutuhan Keramik Lantai',
      description: 'Menghitung jumlah keramik lantai yang dibutuhkan (belum termasuk waste).',
      inputs: [
          { key: 'panjang_ruang', label: 'Panjang Ruang', unitSymbol: 'm', type: 'number', defaultValue: 3.00 },
          { key: 'lebar_ruang', label: 'Lebar Ruang', unitSymbol: 'm', type: 'number', defaultValue: 3.00 },
          { key: 'panjang_keramik', label: 'Panjang Keramik', unitSymbol: 'cm', type: 'number', defaultValue: 40 },
          { key: 'lebar_keramik', label: 'Lebar Keramik', unitSymbol: 'cm', type: 'number', defaultValue: 40 },
      ],
      output: { key: 'jumlah_keramik', label: 'Jumlah Keramik', unitSymbol: 'bh' },
      calculate: (inputs) => {
          const [roomL, roomW, tileLcm, tileWcm] = [inputs.panjang_ruang, inputs.lebar_ruang, inputs.panjang_keramik, inputs.lebar_keramik].map(parseFloat);
          if ([roomL, roomW, tileLcm, tileWcm].some(isNaN) || roomL <= 0 || roomW <= 0 || tileLcm <= 0 || tileWcm <= 0) return null;
          const roomArea = roomL * roomW;
          const tileArea = (tileLcm / 100) * (tileWcm / 100);
          if (tileArea <= 0) return null;
          return Math.ceil(roomArea / tileArea);
      },
  },
  TILE_ADHESIVE_MORTAR: {
      id: 'TILE_ADHESIVE_MORTAR',
      group: 'Pekerjaan Lantai & Keramik',
      name: 'Kebutuhan Perekat Keramik (Mortar)',
      description: 'Estimasi kebutuhan semen instan (mortar) untuk pemasangan keramik.',
      inputs: [
          { key: 'luas_area_keramik', label: 'Total Luas Area Pasang Keramik', unitSymbol: 'm²', type: 'number', defaultValue: 20.00 },
          { key: 'konsumsi_mortar', label: 'Konsumsi Mortar per m²', unitSymbol: 'kg/m²', type: 'number', defaultValue: 5 },
          { key: 'berat_sak_mortar', label: 'Berat per Sak Mortar', unitSymbol: 'kg', type: 'number', defaultValue: 25 },
      ],
      output: { key: 'jumlah_sak_mortar', label: 'Jumlah Sak Mortar', unitSymbol: 'sak' },
      calculate: (inputs) => {
          const [area, consumption, weight] = [inputs.luas_area_keramik, inputs.konsumsi_mortar, inputs.berat_sak_mortar].map(parseFloat);
          if ([area, consumption, weight].some(isNaN) || area <= 0 || consumption <= 0 || weight <= 0) return null;
          const totalKg = area * consumption;
          return Math.ceil(totalKg / weight);
      }
  },

  // =================================================================================
  // Kategori: Pekerjaan Plafond
  // =================================================================================
  CEILING_FRAME_HOLLOW: {
      id: 'CEILING_FRAME_HOLLOW',
      group: 'Pekerjaan Plafond',
      name: 'Kebutuhan Rangka Plafon (Hollow)',
      description: 'Menghitung kebutuhan besi hollow untuk rangka plafon.',
      inputs: [
          { key: 'luas_plafon', label: 'Luas Area Plafon', unitSymbol: 'm²', type: 'number', defaultValue: 20.00 },
          { key: 'koefisien_hollow', label: 'Koefisien Kebutuhan Hollow', unitSymbol: 'm/m²', type: 'number', defaultValue: 4.5 },
      ],
      output: { key: 'batang_hollow', label: 'Jumlah Batang Hollow', unitSymbol: 'btg' },
      calculate: (inputs) => {
          const [area, coeff] = [inputs.luas_plafon, inputs.koefisien_hollow].map(parseFloat);
          if ([area, coeff].some(isNaN) || area <= 0 || coeff <= 0) return null;
          const totalLength = area * coeff;
          return Math.ceil(totalLength / 4); // Asumsi 1 batang hollow = 4m
      }
  },
  CEILING_BOARD_QUANTITY: {
      id: 'CEILING_BOARD_QUANTITY',
      group: 'Pekerjaan Plafond',
      name: 'Kebutuhan Papan Plafon (Gypsum/GRC)',
      description: 'Menghitung jumlah lembar papan gypsum atau GRC untuk penutup plafon.',
      inputs: [
          { key: 'luas_area_plafon_board', label: 'Luas Area Plafon', unitSymbol: 'm²', type: 'number', defaultValue: 20.00 },
          { key: 'panjang_papan', label: 'Panjang Papan', unitSymbol: 'm', type: 'number', defaultValue: 2.4 },
          { key: 'lebar_papan', label: 'Lebar Papan', unitSymbol: 'm', type: 'number', defaultValue: 1.2 },
      ],
      output: { key: 'jumlah_papan', label: 'Jumlah Lembar Papan', unitSymbol: 'lbr' },
      calculate: (inputs) => {
          const [area, p, l] = [inputs.luas_area_plafon_board, inputs.panjang_papan, inputs.lebar_papan].map(parseFloat);
          if ([area, p, l].some(isNaN) || area <= 0 || p <= 0 || l <= 0) return null;
          const boardArea = p * l;
          return Math.ceil(area / boardArea);
      }
  },

  // =================================================================================
  // Kategori: Pekerjaan Atap
  // =================================================================================
  PITCHED_ROOF_AREA: {
      id: 'PITCHED_ROOF_AREA',
      group: 'Pekerjaan Atap',
      name: 'Luas Kuda-Kuda Baja Ringan',
      description: 'Menghitung luas permukaan atap miring berdasarkan denah dan kemiringan.',
      inputs: [
          { key: 'panjang_atap', label: 'Panjang Atap', unitSymbol: 'm', type: 'number', defaultValue: 10.00 },
          { key: 'lebar_atap', label: 'Lebar Atap', unitSymbol: 'm', type: 'number', defaultValue: 10.00 },
          { key: 'kemiringan_derajat', label: 'Kemiringan Atap', unitSymbol: '°', type: 'number', defaultValue: 35 },
      ],
      output: { key: 'luas_atap', label: 'Luas Atap', unitSymbol: 'm²' },
      calculate: (inputs) => {
          const [planL, planW, pitchDeg] = [inputs.panjang_atap, inputs.lebar_atap, inputs.kemiringan_derajat].map(parseFloat);
          if ([planL, planW, pitchDeg].some(isNaN) || planL <= 0 || planW <= 0 || pitchDeg <= 0 || pitchDeg >= 90) return null;
          const pitchRad = pitchDeg * (Math.PI / 180);
          const planArea = planL * planW;
          return planArea / Math.cos(pitchRad);
      },
  },
  ROOF_COVERING_QUANTITY: {
      id: 'ROOF_COVERING_QUANTITY',
      group: 'Pekerjaan Atap',
      name: 'Kebutuhan Penutup Atap (Genteng/Spandex)',
      description: 'Menghitung jumlah unit penutup atap berdasarkan luas atap miring dan ukuran efektif per unit.',
      inputs: [
          { key: 'luas_atap_miring_total', label: 'Luas Atap Miring Total', unitSymbol: 'm²', type: 'number', defaultValue: 100.00 },
          { key: 'panjang_efektif_penutup', label: 'Panjang Efektif 1 Unit Penutup', unitSymbol: 'm', type: 'number', defaultValue: 0.80 },
          { key: 'lebar_efektif_penutup', label: 'Lebar Efektif 1 Unit Penutup', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
      ],
      output: { key: 'jumlah_penutup_atap', label: 'Jumlah Unit Penutup Atap', unitSymbol: 'lbr/bh' },
      calculate: (inputs) => {
          const [roofArea, effectiveL, effectiveW] = [inputs.luas_atap_miring_total, inputs.panjang_efektif_penutup, inputs.lebar_efektif_penutup].map(parseFloat);
          if ([roofArea, effectiveL, effectiveW].some(isNaN) || roofArea <= 0 || effectiveL <= 0 || effectiveW <= 0) return null;
          const areaPerUnit = effectiveL * effectiveW;
          if (areaPerUnit <= 0) return null;
          return Math.ceil(roofArea / areaPerUnit);
      },
  },
  LIGHT_STEEL_ROOF_FRAME: {
      id: 'LIGHT_STEEL_ROOF_FRAME',
      group: 'Pekerjaan Atap',
      name: 'Kebutuhan Rangka Atap Baja Ringan',
      description: 'Estimasi kasar jumlah batang Kanal C dan Reng untuk rangka atap baja ringan.',
      inputs: [
          { key: 'luas_atap_miring', label: 'Luas Total Atap Miring', unitSymbol: 'm²', type: 'number', defaultValue: 100.00 },
          { key: 'koefisien_kanal_c', label: 'Koefisien Kanal C', unitSymbol: 'm/m²', type: 'number', defaultValue: 1.3 },
          { key: 'koefisien_reng', label: 'Koefisien Reng', unitSymbol: 'm/m²', type: 'number', defaultValue: 2.2 },
      ],
      output: { key: 'material_baja_ringan', label: 'Estimasi Material', unitSymbol: '' },
      calculate: (inputs) => {
          const [area, cCoeff, rengCoeff] = Object.values(inputs).map(parseFloat);
          if ([area].some(isNaN) || area <= 0) return null;
          const stdLength = 6; // Panjang standar baja ringan adalah 6m
          const totalKanalCLength = area * cCoeff;
          const totalRengLength = area * rengCoeff;
          const kanalCBars = Math.ceil(totalKanalCLength / stdLength);
          const rengBars = Math.ceil(totalRengLength / stdLength);
          return `Kanal C: ${kanalCBars} btg, Reng: ${rengBars} btg`;
      },
  },

  // =================================================================================
  // Kategori: Pekerjaan Pengecatan
  // =================================================================================
  PAINT_QUANTITY_WALL: {
      id: 'PAINT_QUANTITY_WALL',
      group: 'Pekerjaan Pengecatan',
      name: 'Kebutuhan Cat Dinding',
      description: 'Menghitung jumlah cat (liter) untuk dinding berdasarkan luas, daya sebar, dan jumlah lapisan.',
      inputs: [
          { key: 'luas_dinding_cat', label: 'Luas Total Dinding (Netto)', unitSymbol: 'm²', type: 'number', defaultValue: 30.00 },
          { key: 'daya_sebar_cat', label: 'Daya Sebar Cat per Liter', unitSymbol: 'm²/L', type: 'number', defaultValue: 10 },
          { key: 'jumlah_lapisan', label: 'Jumlah Lapisan Cat', unitSymbol: 'lapis', type: 'number', defaultValue: 2 },
      ],
      output: { key: 'liter_cat', label: 'Total Liter Cat', unitSymbol: 'L' },
      calculate: (inputs) => {
          const [area, coverage, coats] = [inputs.luas_dinding_cat, inputs.daya_sebar_cat, inputs.jumlah_lapisan].map(parseFloat);
          if ([area, coverage, coats].some(isNaN) || area <= 0 || coverage <= 0 || coats <= 0) return null;
          return (area * coats) / coverage;
      },
  },
  PRIMER_PAINT_QUANTITY: {
      id: 'PRIMER_PAINT_QUANTITY',
      group: 'Pekerjaan Pengecatan',
      name: 'Kebutuhan Cat Dasar (Primer)',
      description: 'Menghitung jumlah cat dasar (liter) untuk dinding sebelum cat utama.',
      inputs: [
          { key: 'luas_dinding_primer', label: 'Luas Total Dinding (Netto)', unitSymbol: 'm²', type: 'number', defaultValue: 30.00 },
          { key: 'daya_sebar_primer', label: 'Daya Sebar Cat Dasar per Liter', unitSymbol: 'm²/L', type: 'number', defaultValue: 8 },
      ],
      output: { key: 'liter_primer', label: 'Total Liter Cat Dasar', unitSymbol: 'L' },
      calculate: (inputs) => {
          const [area, coverage] = [inputs.luas_dinding_primer, inputs.daya_sebar_primer].map(parseFloat);
          if ([area, coverage].some(isNaN) || area <= 0 || coverage <= 0) return null;
          return area / coverage;
      },
  },

  // =================================================================================
  // Kategori: MEP (Mekanikal, Elektrikal, Plumbing)
  // =================================================================================
  PLUMBING_PIPING_ESTIMATE: {
      id: 'PLUMBING_PIPING_ESTIMATE',
      group: 'MEP (Mekanikal, Elektrikal, Plumbing)',
      name: 'Estimasi Kebutuhan Pipa Air',
      description: 'Estimasi kasar kebutuhan panjang pipa air bersih dan air kotor berdasarkan luas bangunan.',
      inputs: [
          { key: 'luas_bangunan_total', label: 'Total Luas Lantai Bangunan', unitSymbol: 'm²', type: 'number', defaultValue: 100 },
          { key: 'jumlah_titik_air', label: 'Jumlah Titik Air (Kran, WC, dll)', unitSymbol: 'bh', type: 'number', defaultValue: 8 },
      ],
      output: { key: 'estimasi_pipa', label: 'Estimasi Panjang Pipa', unitSymbol: '' },
      calculate: (inputs) => {
          const [area, points] = Object.values(inputs).map(parseFloat);
          if ([area, points].some(isNaN) || area <= 0 || points <= 0) return null;
          const cleanWaterPipe = (area * 0.4) + (points * 3);
          const wasteWaterPipe = (area * 0.3) + (points * 2);
          return `Pipa Air Bersih: ~${Math.ceil(cleanWaterPipe)} m, Pipa Air Kotor: ~${Math.ceil(wasteWaterPipe)} m`;
      },
  },
  ELECTRICAL_WIRING_ESTIMATE: {
      id: 'ELECTRICAL_WIRING_ESTIMATE',
      group: 'MEP (Mekanikal, Elektrikal, Plumbing)',
      name: 'Estimasi Kebutuhan Kabel Listrik',
      description: 'Estimasi kasar kebutuhan panjang kabel listrik (NYM) berdasarkan jumlah titik listrik.',
      inputs: [
          { key: 'jumlah_titik_listrik', label: 'Jumlah Titik Listrik', unitSymbol: 'titik', type: 'number', defaultValue: 40 },
          { key: 'koefisien_kabel', label: 'Rata-rata Kabel per Titik', unitSymbol: 'm/titik', type: 'number', defaultValue: 5 },
      ],
      output: { key: 'panjang_kabel_rol', label: 'Estimasi Kabel', unitSymbol: 'rol' },
      calculate: (inputs) => {
          const [points, coeff] = Object.values(inputs).map(parseFloat);
          if ([points, coeff].some(isNaN) || points <= 0 || coeff <= 0) return null;
          const totalLength = points * coeff;
          const totalRolls = Math.ceil(totalLength / 50); // Asumsi 1 rol kabel = 50m
          return `${totalRolls} rol (${totalLength} m)`;
      },
  },
};

/**
* Mengembalikan array objek yang disederhanakan dari skema kalkulasi,
* cocok untuk digunakan dalam dropdown atau daftar pilihan di UI.
* Setiap objek berisi id, nama, deskripsi, grup, dan status isSimple.
* @return {Array<{id: string, name: string, description: string, group: string, isSimple: boolean}>}
*/
export const getCalculationSchemaTypes = () => {
  return Object.values(CALCULATION_SCHEMAS)
      .map(schema => ({
          id: schema.id,
          name: schema.name,
          description: schema.description,
          group: schema.group || 'Lainnya', // Fallback jika grup tidak didefinisikan
          isSimple: !!schema.isSimple,
      }));
};
