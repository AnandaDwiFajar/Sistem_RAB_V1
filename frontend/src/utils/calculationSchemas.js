/**
 * @file src/utils/calculationSchemas.js
 */

export const CALCULATION_SCHEMAS = {
    DEFAULT: {
        id: 'DEFAULT',
        name: 'Default',
    },

    SITE_CLEARING: {
        id: 'SITE_CLEARING',
        group: '1. Pekerjaan Persiapan & Tanah',
        name: 'Pembersihan Lahan (Site Clearing)',
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
        group: '1. Pekerjaan Persiapan & Tanah',
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
            if ([p, l, j].some(isNaN) || p <= 0 || l <= 0 || j < 0) return null;
            return (p + 2 * j) * 2 + (l + 2 * j) * 2;
        },
    },
    TRAPEZOID_EXCAVATION: {
        id: 'TRAPEZOID_EXCAVATION',
        group: '1. Pekerjaan Persiapan & Tanah',
        name: 'Volume Galian Tanah Pondasi Menerus',
        description: 'Menghitung volume galian tanah untuk pondasi menerus (batu kali) berbentuk trapesium.',
        inputs: [
            { key: 'lebar_atas', label: 'Lebar Atas Galian (a)', unitSymbol: 'm', type: 'number', defaultValue: 0.80 },
            { key: 'lebar_bawah', label: 'Lebar Bawah Galian (b)', unitSymbol: 'm', type: 'number', defaultValue: 0.60 },
            { key: 'dalam_galian', label: 'Dalam Galian (t)', unitSymbol: 'm', type: 'number', defaultValue: 0.70 },
            { key: 'panjang_galian', label: 'Total Panjang Galian', unitSymbol: 'm', type: 'number', defaultValue: 50.00 },
        ],
        output: { key: 'volume_galian', label: 'Volume Galian', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [a, b, t, p] = [inputs.lebar_atas, inputs.lebar_bawah, inputs.dalam_galian, inputs.panjang_galian].map(parseFloat);
            if ([a, b, t, p].some(isNaN) || a <= 0 || b <= 0 || t <= 0 || p <= 0 || a < b) return null;
            return ((a + b) / 2) * t * p;
        },
    },
    FOOTING_EXCAVATION: {
        id: 'FOOTING_EXCAVATION',
        group: '1. Pekerjaan Persiapan & Tanah',
        name: 'Volume Galian Tanah Pondasi Tapak',
        description: 'Menghitung volume galian tanah untuk pondasi tapak (footing/cakar ayam).',
        inputs: [
            { key: 'panjang_galian', label: 'Panjang Galian per Titik', unitSymbol: 'm', type: 'number', defaultValue: 1.20 },
            { key: 'lebar_galian', label: 'Lebar Galian per Titik', unitSymbol: 'm', type: 'number', defaultValue: 1.20 },
            { key: 'dalam_galian', label: 'Dalam Galian per Titik', unitSymbol: 'm', type: 'number', defaultValue: 1.20 },
            { key: 'jumlah_titik', label: 'Jumlah Titik Galian', unitSymbol: 'bh', type: 'number', defaultValue: 12 },
        ],
        output: { key: 'volume_galian_total', label: 'Total Volume Galian', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [p, l, t, n] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            return p * l * t * n;
        },
    },
    SOIL_BACKFILL: {
        id: 'SOIL_BACKFILL',
        group: '1. Pekerjaan Persiapan & Tanah',
        name: 'Volume Urugan Tanah Kembali',
        description: 'Menghitung volume tanah untuk diurug kembali ke sisi pondasi.',
        inputs: [
            { key: 'volume_galian', label: 'Total Volume Galian', unitSymbol: 'm³', type: 'number', defaultValue: 24.50 },
            { key: 'volume_struktur_bawah', label: 'Total Volume Pondasi + Beton', unitSymbol: 'm³', type: 'number', defaultValue: 15.00 },
        ],
        output: { key: 'volume_urugan', label: 'Volume Urugan Kembali', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [volGali, volStruktur] = [inputs.volume_galian, inputs.volume_struktur_bawah].map(parseFloat);
            if ([volGali, volStruktur].some(isNaN) || volGali <= 0 || volStruktur <= 0 || volGali < volStruktur) return null;
            // Asumsi umum, hanya 1/3 tanah galian yang digunakan untuk urugan kembali
            return (volGali - volStruktur) / 3;
        },
    },
    FLOOR_FILL: {
        id: 'FLOOR_FILL',
        group: '1. Pekerjaan Persiapan & Tanah',
        name: 'Volume Urugan Peninggian Lantai',
        description: 'Menghitung volume material urugan (tanah, pasir, sirtu) untuk peninggian lantai.',
        inputs: [
            { key: 'luas_area', label: 'Luas Area Urugan', unitSymbol: 'm²', type: 'number', defaultValue: 100.00 },
            { key: 'tebal_urugan', label: 'Tebal Urugan Padat', unitSymbol: 'm', type: 'number', defaultValue: 0.30 },
            { key: 'faktor_kepadatan', label: 'Faktor Kepadatan Material', unitSymbol: '', type: 'number', defaultValue: 1.20 },
        ],
        output: { key: 'volume_material', label: 'Volume Material Gembur', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [area, tebal, faktor] = [inputs.luas_area, inputs.tebal_urugan, inputs.faktor_kepadatan].map(parseFloat);
            if ([area, tebal, faktor].some(isNaN) || area <= 0 || tebal <= 0 || faktor <= 0) return null;
            return area * tebal * faktor;
        },
    },
    CUT_AND_FILL_VOLUME: {
        id: 'CUT_AND_FILL_VOLUME',
        group: '1. Pekerjaan Persiapan & Tanah',
        name: 'Volume Galian & Timbunan (Cut & Fill)',
        description: 'Estimasi volume galian (cut) dan timbunan (fill) untuk perataan kontur lahan.',
        inputs: [
            { key: 'luas_area', label: 'Luas Area Perataan', unitSymbol: 'm²', type: 'number', defaultValue: 200.00 },
            { key: 'kedalaman_galian_rata2', label: 'Rata-rata Kedalaman Galian', unitSymbol: 'm', type: 'number', defaultValue: 0.50 },
            { key: 'ketinggian_timbunan_rata2', label: 'Rata-rata Ketinggian Timbunan', unitSymbol: 'm', type: 'number', defaultValue: 0.30 },
        ],
        output: { key: 'volume_cut_fill', label: 'Volume Galian & Timbunan', unitSymbol: '' },
        calculate: (inputs) => {
            const [area, cut, fill] = Object.values(inputs).map(v => parseFloat(v || 0));
            if ([area].some(isNaN) || area <= 0 || cut < 0 || fill < 0) return null;
            const volCut = area * cut;
            const volFill = area * fill;
            return `Volume Galian: ${volCut.toFixed(2)} m³, Volume Timbunan: ${volFill.toFixed(2)} m³`;
        },
    },
    // --- BARU ---
    SAND_BEDDING_VOLUME: {
        id: 'SAND_BEDDING_VOLUME',
        group: '1. Pekerjaan Persiapan & Tanah',
        name: 'Volume Urugan Pasir Bawah Pondasi/Lantai',
        description: 'Menghitung volume pasir urug sebagai lapisan dasar di bawah pondasi atau lantai.',
        inputs: [
            { key: 'luas_area', label: 'Luas Area Urugan', unitSymbol: 'm²', type: 'number', defaultValue: 50.00 },
            { key: 'tebal_urugan', label: 'Tebal Urugan Pasir', unitSymbol: 'cm', type: 'number', defaultValue: 5 },
        ],
        output: { key: 'volume_pasir', label: 'Volume Pasir Urug', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [area, tebalCm] = [inputs.luas_area, inputs.tebal_urugan].map(parseFloat);
            if ([area, tebalCm].some(isNaN) || area <= 0 || tebalCm <= 0) return null;
            return area * (tebalCm / 100);
        },
    },

    STONE_FOUNDATION_VOLUME: {
        id: 'STONE_FOUNDATION_VOLUME',
        group: '2. Pekerjaan Pondasi',
        name: 'Volume Pasangan Pondasi Batu Kali',
        description: 'Menghitung volume pasangan pondasi batu kali berbentuk trapesium.',
        inputs: [
            { key: 'lebar_atas', label: 'Lebar Atas Pondasi (a)', unitSymbol: 'm', type: 'number', defaultValue: 0.30 },
            { key: 'lebar_bawah', label: 'Lebar Bawah Pondasi (b)', unitSymbol: 'm', type: 'number', defaultValue: 0.60 },
            { key: 'tinggi_pondasi', label: 'Tinggi Pondasi (t)', unitSymbol: 'm', type: 'number', defaultValue: 0.70 },
            { key: 'panjang_pondasi', label: 'Total Panjang Pondasi', unitSymbol: 'm', type: 'number', defaultValue: 50.00 },
        ],
        output: { key: 'volume_pondasi', label: 'Volume Pondasi', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [a, b, t, p] = [inputs.lebar_atas, inputs.lebar_bawah, inputs.tinggi_pondasi, inputs.panjang_pondasi].map(parseFloat);
            if ([a, b, t, p].some(isNaN) || a <= 0 || b <= 0 || t <= 0 || p <= 0) return null;
            return ((a + b) / 2) * t * p;
        },
    },
    STONE_FOUNDATION_MATERIAL: {
        id: 'STONE_FOUNDATION_MATERIAL',
        group: '2. Pekerjaan Pondasi',
        name: 'Material Pondasi Batu Kali',
        description: 'Menghitung kebutuhan material untuk pondasi batu kali.',
        inputs: [
            { key: 'volume_pondasi', label: 'Volume Pasangan Pondasi', unitSymbol: 'm³', type: 'number', defaultValue: 15.75 },
            { key: 'koef_batu', label: 'Koefisien Batu Kali', unitSymbol: 'm³/m³', type: 'number', defaultValue: 1.20 },
            { key: 'koef_semen', label: 'Koefisien Semen (PC)', unitSymbol: 'kg/m³', type: 'number', defaultValue: 163 }, // Campuran 1:4
            { key: 'koef_pasir', label: 'Koefisien Pasir (PP)', unitSymbol: 'm³/m³', type: 'number', defaultValue: 0.52 }, // Campuran 1:4
        ],
        output: { key: 'material_pondasi', label: 'Kebutuhan Material', unitSymbol: '' },
        calculate: (inputs) => {
            const { volume_pondasi, koef_batu, koef_semen, koef_pasir } = inputs;
            const [vol, kb, ks, kp] = [volume_pondasi, koef_batu, koef_semen, koef_pasir].map(parseFloat);
            if ([vol, kb, ks, kp].some(isNaN) || [vol, kb, ks, kp].some(v => v <= 0)) return null;
            const totalBatu = vol * kb;
            const totalSemenKg = vol * ks;
            const totalSemenSak = Math.ceil(totalSemenKg / 50);
            const totalPasir = vol * kp;
            return `Batu: ${totalBatu.toFixed(2)} m³, Semen: ${totalSemenSak} sak, Pasir: ${totalPasir.toFixed(2)} m³`;
        },
    },
    FOOTING_CONCRETE_VOLUME: {
        id: 'FOOTING_CONCRETE_VOLUME',
        group: '2. Pekerjaan Pondasi',
        name: 'Volume Beton Pondasi Tapak (Footing)',
        description: 'Menghitung volume beton untuk pondasi tapak (cakar ayam).',
        inputs: [
            { key: 'panjang_tapak', label: 'Panjang Tapak', unitSymbol: 'm', type: 'number', defaultValue: 1.0 },
            { key: 'lebar_tapak', label: 'Lebar Tapak', unitSymbol: 'm', type: 'number', defaultValue: 1.0 },
            { key: 'tebal_tapak', label: 'Tebal Tapak', unitSymbol: 'm', type: 'number', defaultValue: 0.30 },
            { key: 'jumlah_titik', label: 'Jumlah Titik Pondasi', unitSymbol: 'bh', type: 'number', defaultValue: 12 },
        ],
        output: { key: 'volume_total', label: 'Total Volume Beton', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [p, l, t, n] = [inputs.panjang_tapak, inputs.lebar_tapak, inputs.tebal_tapak, inputs.jumlah_titik].map(parseFloat);
            if ([p, l, t, n].some(isNaN) || p <= 0 || l <= 0 || t <= 0 || n <= 0) return null;
            return p * l * t * n;
        }
    },
    LEAN_CONCRETE: {
        id: 'LEAN_CONCRETE',
        group: '2. Pekerjaan Pondasi',
        name: 'Volume Lantai Kerja (Beton Rabat)',
        description: 'Menghitung volume beton rabat (lantai kerja) di bawah pondasi atau plat lantai.',
        inputs: [
            { key: 'luas_area', label: 'Luas Area Lantai Kerja', unitSymbol: 'm²', type: 'number', defaultValue: 12.00 },
            { key: 'tebal', label: 'Tebal Lantai Kerja', unitSymbol: 'cm', type: 'number', defaultValue: 5 },
        ],
        output: { key: 'volume_beton', label: 'Volume Beton Rabat', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [area, tebalCm] = [inputs.luas_area, inputs.tebal].map(parseFloat);
            if ([area, tebalCm].some(isNaN) || area <= 0 || tebalCm <= 0) return null;
            return area * (tebalCm / 100);
        },
    },

    CONCRETE_MATERIAL: {
        id: 'CONCRETE_MATERIAL',
        group: '3. Pekerjaan Beton & Pembesian',
        name: 'Kebutuhan Material Beton',
        description: 'Menghitung kebutuhan Semen, Pasir (P), dan Kerikil (K) untuk volume beton tertentu.',
        inputs: [
            { key: 'volume_beton', label: 'Total Volume Beton', unitSymbol: 'm³', type: 'number', defaultValue: 10.00 },
            { key: 'koef_semen', label: 'Koefisien Semen (PC)', unitSymbol: 'kg/m³', type: 'number', defaultValue: 371 }, // Mutu K-225
            { key: 'koef_pasir', label: 'Koefisien Pasir (P)', unitSymbol: 'kg/m³', type: 'number', defaultValue: 698 }, // Mutu K-225
            { key: 'koef_kerikil', label: 'Koefisien Kerikil (K)', unitSymbol: 'kg/m³', type: 'number', defaultValue: 1047 }, // Mutu K-225
            { key: 'koef_air', label: 'Koefisien Air (W)', unitSymbol: 'L/m³', type: 'number', defaultValue: 215 }, // Mutu K-225
        ],
        output: { key: 'material_beton', label: 'Kebutuhan Material', unitSymbol: '' },
        calculate: (inputs) => {
            const { volume_beton, koef_semen, koef_pasir, koef_kerikil, koef_air } = inputs;
            const [vol, ks, kp, kk, ka] = [volume_beton, koef_semen, koef_pasir, koef_kerikil, koef_air].map(parseFloat);
            if ([vol, ks, kp, kk, ka].some(isNaN) || [vol, ks, kp, kk, ka].some(v => v <= 0)) return null;
            const totalSemenKg = vol * ks;
            const totalSemenSak = Math.ceil(totalSemenKg / 50);
            const totalPasirKg = vol * kp;
            const totalKerikilKg = vol * kk;
            const totalAir = vol * ka;
            return `Semen: ${totalSemenSak} sak, Pasir: ${totalPasirKg.toFixed(0)} kg, Kerikil: ${totalKerikilKg.toFixed(0)} kg, Air: ${totalAir.toFixed(0)} L`;
        },
    },
    CONCRETE_BEAM_VOLUME: {
        id: 'CONCRETE_BEAM_VOLUME',
        group: '3. Pekerjaan Beton & Pembesian',
        name: 'Volume Beton Balok (Sloof/Ringbalk)',
        description: 'Menghitung volume beton untuk elemen balok seperti sloof, balok, atau ringbalk.',
        inputs: [
            { key: 'lebar_balok', label: 'Lebar Balok', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
            { key: 'tinggi_balok', label: 'Tinggi Balok', unitSymbol: 'm', type: 'number', defaultValue: 0.20 },
            { key: 'panjang_total', label: 'Panjang Total Balok', unitSymbol: 'm', type: 'number', defaultValue: 50.00 },
        ],
        output: { key: 'volume_beton', label: 'Volume Beton', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [l, t, p] = [inputs.lebar_balok, inputs.tinggi_balok, inputs.panjang_total].map(parseFloat);
            if ([l, t, p].some(isNaN) || l <= 0 || t <= 0 || p <= 0) return null;
            return l * t * p;
        },
    },
    CONCRETE_LINTEL_VOLUME: {
        id: 'CONCRETE_LINTEL_VOLUME',
        group: '3. Pekerjaan Beton & Pembesian',
        name: 'Volume Beton Balok Lintel',
        description: 'Menghitung volume beton untuk balok lintel di atas bukaan pintu atau jendela.',
        inputs: [
            { key: 'lebar_lintel', label: 'Lebar Lintel', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
            { key: 'tinggi_lintel', label: 'Tinggi Lintel', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
            { key: 'panjang_total', label: 'Panjang Total Lintel', unitSymbol: 'm', type: 'number', defaultValue: 20.00 },
        ],
        output: { key: 'volume_beton', label: 'Volume Beton Lintel', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [l, t, p] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            return l * t * p;
        },
    },
    CONCRETE_COLUMN_VOLUME: {
        id: 'CONCRETE_COLUMN_VOLUME',
        group: '3. Pekerjaan Beton & Pembesian',
        name: 'Volume Beton Kolom',
        description: 'Menghitung volume beton untuk kolom struktur atau praktis.',
        inputs: [
            { key: 'lebar_kolom', label: 'Sisi 1 Kolom', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
            { key: 'tebal_kolom', label: 'Sisi 2 Kolom', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
            { key: 'tinggi_kolom', label: 'Tinggi Total Kolom', unitSymbol: 'm', type: 'number', defaultValue: 48.00 },
        ],
        output: { key: 'volume_beton', label: 'Volume Beton Kolom', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [w, d, h] = [inputs.lebar_kolom, inputs.tebal_kolom, inputs.tinggi_kolom].map(parseFloat);
            if ([w, d, h].some(isNaN) || w <= 0 || d <= 0 || h <= 0) return null;
            return w * d * h;
        },
    },
    CONCRETE_SLAB_VOLUME: {
        id: 'CONCRETE_SLAB_VOLUME',
        group: '3. Pekerjaan Beton & Pembesian',
        name: 'Volume Beton Plat Lantai (Dak)',
        description: 'Menghitung volume beton untuk pekerjaan cor plat lantai (dak).',
        inputs: [
            { key: 'panjang_lantai', label: 'Panjang Area Plat', unitSymbol: 'm', type: 'number', defaultValue: 10.00 },
            { key: 'lebar_lantai', label: 'Lebar Area Plat', unitSymbol: 'm', type: 'number', defaultValue: 10.00 },
            { key: 'tebal_plat', label: 'Tebal Plat', unitSymbol: 'cm', type: 'number', defaultValue: 12 },
        ],
        output: { key: 'volume_beton', label: 'Total Volume Beton', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [p, l, t_cm] = [inputs.panjang_lantai, inputs.lebar_lantai, inputs.tebal_plat].map(parseFloat);
            if ([p, l, t_cm].some(isNaN) || p <= 0 || l <= 0 || t_cm <= 0) return null;
            return p * l * (t_cm / 100);
        },
    },
    CONCRETE_STAIRS_VOLUME: {
        id: 'CONCRETE_STAIRS_VOLUME',
        group: '3. Pekerjaan Beton & Pembesian',
        name: 'Volume Beton Tangga',
        description: 'Menghitung volume beton untuk anak tangga dan plat tangga.',
        inputs: [
            { key: 'panjang_datar', label: 'Panjang Datar Tangga (A)', unitSymbol: 'm', type: 'number', defaultValue: 3.0 },
            { key: 'tinggi_tangga', label: 'Tinggi Total Tangga (B)', unitSymbol: 'm', type: 'number', defaultValue: 3.5 },
            { key: 'lebar_tangga', label: 'Lebar Tangga', unitSymbol: 'm', type: 'number', defaultValue: 1.0 },
            { key: 'tebal_plat', label: 'Tebal Plat Tangga', unitSymbol: 'cm', type: 'number', defaultValue: 12 },
        ],
        output: { key: 'volume_beton', label: 'Estimasi Volume Beton', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [p_datar, t_tangga, l_tangga, tebal_cm] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            const p_miring = Math.sqrt(Math.pow(p_datar, 2) + Math.pow(t_tangga, 2));
            const vol_plat = p_miring * l_tangga * (tebal_cm / 100);
            const vol_anak_tangga = 0.5 * p_datar * t_tangga * l_tangga;
            return vol_plat + vol_anak_tangga;
        },
    },
    REBAR_BEAM_COLUMN: {
        id: 'REBAR_BEAM_COLUMN',
        group: '3. Pekerjaan Beton & Pembesian',
        name: 'Kebutuhan Besi Balok & Kolom',
        description: 'Menghitung kebutuhan besi tulangan utama dan sengkang (begel).',
        inputs: [
            { key: 'panjang_elemen', label: 'Panjang Total Elemen', unitSymbol: 'm', type: 'number', defaultValue: 50.00 },
            { key: 'jumlah_utama', label: 'Jumlah Tulangan Utama', unitSymbol: 'bh', type: 'number', defaultValue: 4 },
            { key: 'lebar_beton', label: 'Lebar Beton', unitSymbol: 'cm', type: 'number', defaultValue: 15 },
            { key: 'tinggi_beton', label: 'Tinggi Beton', unitSymbol: 'cm', type: 'number', defaultValue: 20 },
            { key: 'selimut_beton', label: 'Tebal Selimut Beton', unitSymbol: 'cm', type: 'number', defaultValue: 2.5 },
            { key: 'jarak_sengkang', label: 'Jarak Sengkang', unitSymbol: 'cm', type: 'number', defaultValue: 15 },
            { key: 'panjang_besi_standar', label: 'Panjang Besi per Batang', unitSymbol: 'm', type: 'number', defaultValue: 12 },
        ],
        output: { key: 'total_besi', label: 'Total Kebutuhan Besi', unitSymbol: '' },
        calculate: (inputs) => {
            const [p_elemen, jml_utama, l_beton, t_beton, selimut, jarak_sengkang_cm, p_std] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            const total_p_utama = p_elemen * jml_utama;
            const btg_utama = total_p_utama / p_std;
            const l_sengkang = (l_beton / 100) - (2 * (selimut / 100));
            const t_sengkang = (t_beton / 100) - (2 * (selimut / 100));
            const p_satu_sengkang = (2 * l_sengkang) + (2 * t_sengkang) + 0.10; // 10cm untuk hak tekuk
            const jml_sengkang = Math.ceil(p_elemen / (jarak_sengkang_cm / 100));
            const total_p_sengkang = jml_sengkang * p_satu_sengkang;
            const btg_sengkang = total_p_sengkang / p_std;
            return `Utama: ${btg_utama.toFixed(2)} btg, Sengkang: ${btg_sengkang.toFixed(2)} btg`;
        },
    },
    REBAR_SLAB: {
        id: 'REBAR_SLAB',
        group: '3. Pekerjaan Beton & Pembesian',
        name: 'Kebutuhan Besi Plat Lantai (Dak)',
        description: 'Menghitung kebutuhan besi untuk tulangan plat lantai (1 atau 2 lapis).',
        inputs: [
            { key: 'panjang_plat', label: 'Panjang Area Plat', unitSymbol: 'm', type: 'number', defaultValue: 10.00 },
            { key: 'lebar_plat', label: 'Lebar Area Plat', unitSymbol: 'm', type: 'number', defaultValue: 10.00 },
            { key: 'jarak_besi', label: 'Jarak Antar Besi', unitSymbol: 'cm', type: 'number', defaultValue: 20 },
            { key: 'jumlah_lapis', label: 'Jumlah Lapis Tulangan', unitSymbol: 'lapis', type: 'number', defaultValue: 2 },
            { key: 'panjang_besi_standar', label: 'Panjang Besi per Batang', unitSymbol: 'm', type: 'number', defaultValue: 12 },
        ],
        output: { key: 'total_kebutuhan', label: 'Total Kebutuhan Besi', unitSymbol: 'btg' },
        calculate: (inputs) => {
            const [p, l, jarak_cm, lapis, p_std] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            const jarak_m = jarak_cm / 100;
            const jml_besi_p = Math.ceil(l / jarak_m) + 1;
            const jml_besi_l = Math.ceil(p / jarak_m) + 1;
            const total_panjang_besi = (jml_besi_p * p) + (jml_besi_l * l);
            return (total_panjang_besi * lapis) / p_std;
        },
    },
    STEEL_REBAR_WEIGHT: {
        id: 'STEEL_REBAR_WEIGHT',
        group: '3. Pekerjaan Beton & Pembesian',
        name: 'Konversi Besi (Panjang ke Berat)',
        description: 'Menghitung berat total besi beton berdasarkan panjang total dan diameter.',
        inputs: [
            { key: 'diameter_besi_mm', label: 'Diameter Besi', unitSymbol: 'mm', type: 'number', defaultValue: 10 },
            { key: 'panjang_total_besi_m', label: 'Panjang Total Besi', unitSymbol: 'm', type: 'number', defaultValue: 120.00 },
        ],
        output: { key: 'berat_total_besi', label: 'Berat Total Besi', unitSymbol: 'kg' },
        calculate: (inputs) => {
            const [d, p] = [inputs.diameter_besi_mm, inputs.panjang_total_besi_m].map(parseFloat);
            if ([d, p].some(isNaN) || d <= 0 || p <= 0) return null;
            // Rumus berat besi per meter: 0.006165 * D^2
            const berat_per_meter = 0.006165 * Math.pow(d, 2);
            return berat_per_meter * p;
        },
    },
    // --- BARU ---
    WIRE_MESH_QUANTITY: {
        id: 'WIRE_MESH_QUANTITY',
        group: '3. Pekerjaan Beton & Pembesian',
        name: 'Kebutuhan Besi Wiremesh',
        description: 'Menghitung kebutuhan wiremesh dalam satuan lembar untuk plat lantai.',
        inputs: [
            { key: 'luas_area_plat', label: 'Luas Area Plat', unitSymbol: 'm²', type: 'number', defaultValue: 100.00 },
            { key: 'luas_wiremesh_lembar', label: 'Luas Wiremesh per Lembar', unitSymbol: 'm²', type: 'number', defaultValue: 11.34 }, // 2.1m x 5.4m
            { key: 'overlap_percentage', label: 'Persentase Overlap', unitSymbol: '%', type: 'number', defaultValue: 10 },
        ],
        output: { key: 'jumlah_lembar', label: 'Jumlah Lembar Wiremesh', unitSymbol: 'lbr' },
        calculate: (inputs) => {
            const [area, area_per_sheet, overlap] = Object.values(inputs).map(parseFloat);
            if ([area, area_per_sheet].some(isNaN) || area <= 0 || area_per_sheet <= 0 || overlap < 0) return null;
            const required_area = area * (1 + (overlap / 100));
            return Math.ceil(required_area / area_per_sheet);
        },
    },

    FORMWORK_BEAM: {
        id: 'FORMWORK_BEAM',
        group: '4. Pekerjaan Bekisting',
        name: 'Luas Bekisting Balok/Sloof',
        description: 'Menghitung luas bekisting untuk sisi samping dan bawah balok atau sloof.',
        inputs: [
            { key: 'tinggi_balok', label: 'Tinggi Balok', unitSymbol: 'm', type: 'number', defaultValue: 0.20 },
            { key: 'lebar_balok', label: 'Lebar Balok', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
            { key: 'panjang_total', label: 'Panjang Total Balok', unitSymbol: 'm', type: 'number', defaultValue: 50.00 },
        ],
        output: { key: 'luas_bekisting', label: 'Luas Bekisting', unitSymbol: 'm²' },
        calculate: (inputs) => {
            const [h, w, l] = Object.values(inputs).map(parseFloat);
            if ([h, w, l].some(isNaN) || [h, w, l].some(v => v <= 0)) return null;
            // Dihitung 2 sisi samping + 1 sisi bawah
            return ((2 * h) + w) * l;
        },
    },
    FORMWORK_COLUMN: {
        id: 'FORMWORK_COLUMN',
        group: '4. Pekerjaan Bekisting',
        name: 'Luas Bekisting Kolom',
        description: 'Menghitung luas bekisting untuk keempat sisi kolom.',
        inputs: [
            { key: 'sisi_a_kolom', label: 'Sisi A Kolom', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
            { key: 'sisi_b_kolom', label: 'Sisi B Kolom', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
            { key: 'tinggi_total', label: 'Tinggi Total Kolom', unitSymbol: 'm', type: 'number', defaultValue: 48.00 },
        ],
        output: { key: 'luas_bekisting_kolom', label: 'Luas Bekisting Kolom', unitSymbol: 'm²' },
        calculate: (inputs) => {
            const [a, b, h] = Object.values(inputs).map(parseFloat);
            if ([a, b, h].some(isNaN) || [a, b, h].some(v => v <= 0)) return null;
            // Keliling kolom x tinggi
            return (2 * a + 2 * b) * h;
        }
    },
    FORMWORK_SLAB: {
        id: 'FORMWORK_SLAB',
        group: '4. Pekerjaan Bekisting',
        name: 'Luas Bekisting Plat Lantai',
        description: 'Menghitung luas bekisting untuk bagian bawah plat lantai (dak).',
        inputs: [
            { key: 'panjang_plat', label: 'Panjang Area Plat', unitSymbol: 'm', type: 'number', defaultValue: 10.00 },
            { key: 'lebar_plat', label: 'Lebar Area Plat', unitSymbol: 'm', type: 'number', defaultValue: 10.00 },
        ],
        output: { key: 'luas_bekisting_plat', label: 'Luas Bekisting Plat', unitSymbol: 'm²' },
        calculate: (inputs) => {
            const [p, l] = Object.values(inputs).map(parseFloat);
            if ([p, l].some(isNaN) || [p, l].some(v => v <= 0)) return null;
            return p * l;
        }
    },
    // --- BARU ---
    FORMWORK_FOUNDATION: {
        id: 'FORMWORK_FOUNDATION',
        group: '4. Pekerjaan Bekisting',
        name: 'Luas Bekisting Pondasi Tapak',
        description: 'Menghitung luas bekisting untuk sisi-sisi pondasi tapak (footing).',
        inputs: [
            { key: 'panjang_tapak', label: 'Panjang Tapak', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
            { key: 'lebar_tapak', label: 'Lebar Tapak', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
            { key: 'tinggi_tapak', label: 'Tinggi Tapak', unitSymbol: 'm', type: 'number', defaultValue: 0.30 },
            { key: 'jumlah_titik', label: 'Jumlah Titik Pondasi', unitSymbol: 'bh', type: 'number', defaultValue: 12 },
        ],
        output: { key: 'luas_bekisting', label: 'Total Luas Bekisting', unitSymbol: 'm²' },
        calculate: (inputs) => {
            const [p, l, h, n] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            const perimeter = (p * 2) + (l * 2);
            return perimeter * h * n;
        },
    },

    WALL_AREA_NET: {
        id: 'WALL_AREA_NET',
        group: '5. Pekerjaan Dinding & Plesteran',
        name: 'Luas Bersih Dinding',
        description: 'Menghitung luas bersih (netto) dinding dengan mengurangi luas bukaan.',
        inputs: [
            { key: 'panjang_dinding', label: 'Total Panjang Dinding', unitSymbol: 'm', type: 'number', defaultValue: 50.00 },
            { key: 'tinggi_dinding', label: 'Tinggi Dinding', unitSymbol: 'm', type: 'number', defaultValue: 3.50 },
            { key: 'luas_bukaan', label: 'Total Luas Bukaan (Pintu/Jendela)', unitSymbol: 'm²', type: 'number', defaultValue: 15.00 },
        ],
        output: { key: 'luas_bersih', label: 'Luas Dinding Bersih', unitSymbol: 'm²' },
        calculate: (inputs) => {
            const [p, t, o] = [inputs.panjang_dinding, inputs.tinggi_dinding, inputs.luas_bukaan].map(v => parseFloat(v || 0));
            if ([p, t].some(isNaN) || p <= 0 || t <= 0 || o < 0) return null;
            const grossArea = p * t;
            if (o >= grossArea) return 0;
            return grossArea - o;
        },
    },
    BRICKWORK_QUANTITY: {
        id: 'BRICKWORK_QUANTITY',
        group: '5. Pekerjaan Dinding & Plesteran',
        name: 'Kebutuhan Bata',
        description: 'Menghitung jumlah bata (merah/ringan/batako) untuk dinding.',
        inputs: [
            { key: 'luas_dinding', label: 'Luas Dinding (Netto)', unitSymbol: 'm²', type: 'number', defaultValue: 160.00 },
            { key: 'kebutuhan_per_m2', label: 'Kebutuhan Bata per m²', unitSymbol: 'bh/m²', type: 'number', defaultValue: 70 },
        ],
        output: { key: 'jumlah_bata', label: 'Total Kebutuhan Bata', unitSymbol: 'bh' },
        calculate: (inputs) => {
            const [area, per_m2] = [inputs.luas_dinding, inputs.kebutuhan_per_m2].map(parseFloat);
            if ([area, per_m2].some(isNaN) || area <= 0 || per_m2 <= 0) return null;
            return Math.ceil(area * per_m2);
        },
    },
    BRICKWORK_MORTAR: {
        id: 'BRICKWORK_MORTAR',
        group: '5. Pekerjaan Dinding & Plesteran',
        name: 'Material Pasangan Bata Merah',
        description: 'Menghitung kebutuhan semen dan pasir untuk pasangan bata merah.',
        inputs: [
            { key: 'luas_dinding', label: 'Luas Dinding (Netto)', unitSymbol: 'm²', type: 'number', defaultValue: 160.00 },
            { key: 'koef_semen', label: 'Koefisien Semen (PC)', unitSymbol: 'kg/m²', type: 'number', defaultValue: 11.5 }, // 1/2 Bata, 1:4
            { key: 'koef_pasir', label: 'Koefisien Pasir (PP)', unitSymbol: 'm³/m²', type: 'number', defaultValue: 0.043 }, // 1/2 Bata, 1:4
        ],
        output: { key: 'material_pasangan', label: 'Estimasi Material', unitSymbol: '' },
        calculate: (inputs) => {
            const [area, ks, kp] = Object.values(inputs).map(parseFloat);
            if ([area, ks, kp].some(isNaN) || [area, ks, kp].some(v => v <= 0)) return null;
            const totalSemenKg = area * ks;
            const totalSemenSak = Math.ceil(totalSemenKg / 50);
            const totalPasirM3 = area * kp;
            return `Semen: ${totalSemenSak} sak, Pasir: ${totalPasirM3.toFixed(2)} m³`;
        },
    },
    PLASTERING_MORTAR: {
        id: 'PLASTERING_MORTAR',
        group: '5. Pekerjaan Dinding & Plesteran',
        name: 'Kebutuhan Material Plesteran',
        description: 'Menghitung kebutuhan semen dan pasir untuk plesteran.',
        inputs: [
            { key: 'luas_plesteran', label: 'Luas Total Plesteran', unitSymbol: 'm²', type: 'number', defaultValue: 320.00 },
            { key: 'tebal_plesteran', label: 'Tebal Plesteran', unitSymbol: 'mm', type: 'number', defaultValue: 15 },
            { key: 'koef_semen', label: 'Koefisien Semen (PC)', unitSymbol: 'kg/m³', type: 'number', defaultValue: 247 },
            { key: 'koef_pasir', label: 'Koefisien Pasir (PP)', unitSymbol: 'm³/m³', type: 'number', defaultValue: 0.024 * 22 },
        ],
        output: { key: 'material_plesteran', label: 'Estimasi Material', unitSymbol: '' },
        calculate: (inputs) => {
            const [area, tebal_mm, koef_pc, koef_pp] = Object.values(inputs).map(parseFloat);
            if ([area, tebal_mm].some(isNaN) || area <= 0 || tebal_mm <= 0) return null;
            const volume = area * (tebal_mm / 1000);
            const totalSemenKg = volume * koef_pc;
            const totalSemenBags = Math.ceil(totalSemenKg / 50);
            const totalPasirM3 = volume * koef_pp;
            return `Semen: ${totalSemenBags} sak, Pasir: ${totalPasirM3.toFixed(2)} m³`;
        },
    },
    SKIM_COAT_MORTAR: {
        id: 'SKIM_COAT_MORTAR',
        group: '5. Pekerjaan Dinding & Plesteran',
        name: 'Kebutuhan Material Acian',
        description: 'Menghitung kebutuhan semen untuk acian dinding.',
        inputs: [
            { key: 'luas_acian', label: 'Luas Total Acian', unitSymbol: 'm²', type: 'number', defaultValue: 320.00 },
            { key: 'koef_semen_acian', label: 'Kebutuhan Semen per m²', unitSymbol: 'kg/m²', type: 'number', defaultValue: 3.25 },
            { key: 'berat_sak', label: 'Berat Semen per Sak', unitSymbol: 'kg', type: 'number', defaultValue: 40 },
        ],
        output: { key: 'semen_acian_sak', label: 'Total Semen Acian', unitSymbol: 'sak' },
        calculate: (inputs) => {
            const [area, koef, berat_sak] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            const totalCementKg = area * koef;
            return Math.ceil(totalCementKg / berat_sak);
        },
    },
    // --- BARU ---
    LIGHTWEIGHT_BRICK_ADHESIVE: {
        id: 'LIGHTWEIGHT_BRICK_ADHESIVE',
        group: '5. Pekerjaan Dinding & Plesteran',
        name: 'Kebutuhan Perekat Bata Ringan',
        description: 'Menghitung kebutuhan semen instan (perekat) untuk pasangan bata ringan (hebel).',
        inputs: [
            { key: 'luas_dinding', label: 'Luas Dinding (Netto)', unitSymbol: 'm²', type: 'number', defaultValue: 160.00 },
            { key: 'kebutuhan_per_m2', label: 'Kebutuhan Perekat per m²', unitSymbol: 'kg/m²', type: 'number', defaultValue: 10 }, // Tergantung merk & tebal bata
            { key: 'berat_sak', label: 'Berat Perekat per Sak', unitSymbol: 'kg', type: 'number', defaultValue: 40 },
        ],
        output: { key: 'kebutuhan_perekat', label: 'Jumlah Sak Perekat', unitSymbol: 'sak' },
        calculate: (inputs) => {
            const [area, consumption, weight] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            const totalKg = area * consumption;
            return Math.ceil(totalKg / weight);
        },
    },

    PITCHED_ROOF_AREA: {
        id: 'PITCHED_ROOF_AREA',
        group: '6. Pekerjaan Atap & Plafon',
        name: 'Luas Atap Miring',
        description: 'Menghitung luas permukaan atap miring berdasarkan denah dan kemiringan.',
        inputs: [
            { key: 'panjang_denah', label: 'Panjang Denah Bangunan', unitSymbol: 'm', type: 'number', defaultValue: 15.00 },
            { key: 'lebar_denah', label: 'Lebar Denah Bangunan', unitSymbol: 'm', type: 'number', defaultValue: 8.00 },
            { key: 'overstek', label: 'Panjang Overstek', unitSymbol: 'm', type: 'number', defaultValue: 1.00 },
            { key: 'kemiringan_derajat', label: 'Kemiringan Atap', unitSymbol: '°', type: 'number', defaultValue: 35 },
        ],
        output: { key: 'luas_atap', label: 'Luas Atap Miring', unitSymbol: 'm²' },
        calculate: (inputs) => {
            const [p_denah, l_denah, overstek, pitchDeg] = Object.values(inputs).map(parseFloat);
            if ([p_denah, l_denah, pitchDeg].some(isNaN) || p_denah <= 0 || l_denah <= 0 || pitchDeg <= 0 || pitchDeg >= 90 || overstek < 0) return null;
            const p_atap = p_denah + (2 * overstek);
            const l_atap = l_denah + (2 * overstek);
            const planArea = p_atap * l_atap;
            return planArea / Math.cos(pitchDeg * (Math.PI / 180));
        },
    },
    LIGHT_STEEL_ROOF_FRAME: {
        id: 'LIGHT_STEEL_ROOF_FRAME',
        group: '6. Pekerjaan Atap & Plafon',
        name: 'Kebutuhan Rangka Baja Ringan',
        description: 'Estimasi jumlah batang Kanal C dan Reng untuk rangka atap.',
        inputs: [
            { key: 'luas_atap_miring', label: 'Luas Total Atap Miring', unitSymbol: 'm²', type: 'number', defaultValue: 150.00 },
            { key: 'koef_kanal_c', label: 'Koefisien Kanal C', unitSymbol: 'm/m²', type: 'number', defaultValue: 4.5 },
            { key: 'koef_reng', label: 'Koefisien Reng', unitSymbol: 'm/m²', type: 'number', defaultValue: 5.5 },
            { key: 'panjang_standar', label: 'Panjang Standar per Batang', unitSymbol: 'm', type: 'number', defaultValue: 6 },
        ],
        output: { key: 'material_baja_ringan', label: 'Estimasi Material', unitSymbol: '' },
        calculate: (inputs) => {
            const [area, cCoeff, rengCoeff, stdLength] = Object.values(inputs).map(parseFloat);
            if ([area, stdLength].some(isNaN) || area <= 0 || stdLength <= 0) return null;
            const kanalCBars = Math.ceil((area * cCoeff) / stdLength);
            const rengBars = Math.ceil((area * rengCoeff) / stdLength);
            return `Kanal C: ${kanalCBars} btg, Reng: ${rengBars} btg`;
        },
    },
    ROOF_COVERING_QUANTITY: {
        id: 'ROOF_COVERING_QUANTITY',
        group: '6. Pekerjaan Atap & Plafon',
        name: 'Kebutuhan Penutup Atap',
        description: 'Menghitung jumlah unit penutup atap (genteng, spandex, dll).',
        inputs: [
            { key: 'luas_atap_miring', label: 'Luas Atap Miring Total', unitSymbol: 'm²', type: 'number', defaultValue: 150.00 },
            { key: 'kebutuhan_per_m2', label: 'Kebutuhan per m²', unitSymbol: 'bh/m²', type: 'number', defaultValue: 10 },
        ],
        output: { key: 'jumlah_penutup_atap', label: 'Jumlah Penutup Atap', unitSymbol: 'bh' },
        calculate: (inputs) => {
            const [roofArea, per_m2] = Object.values(inputs).map(parseFloat);
            if ([roofArea, per_m2].some(isNaN) || roofArea <= 0 || per_m2 <= 0) return null;
            return Math.ceil(roofArea * per_m2);
        },
    },
    GUTTER_QUANTITY: {
        id: 'GUTTER_QUANTITY',
        group: '6. Pekerjaan Atap & Plafon',
        name: 'Kebutuhan Talang Air',
        description: 'Menghitung panjang talang air yang dibutuhkan.',
        inputs: [
            { key: 'panjang_sisi_atap', label: 'Panjang Sisi Atap (yang dipasang talang)', unitSymbol: 'm', type: 'number', defaultValue: 17.00 },
            { key: 'jumlah_sisi', label: 'Jumlah Sisi Atap', unitSymbol: 'sisi', type: 'number', defaultValue: 2 },
            { key: 'panjang_talang_satuan', label: 'Panjang Talang per Satuan', unitSymbol: 'm', type: 'number', defaultValue: 4 },
        ],
        output: { key: 'jumlah_talang', label: 'Jumlah Talang', unitSymbol: 'btg' },
        calculate: (inputs) => {
            const [p_sisi, jml_sisi, p_satuan] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            return Math.ceil((p_sisi * jml_sisi) / p_satuan);
        },
    },
    CEILING_MATERIAL: {
        id: 'CEILING_MATERIAL',
        group: '6. Pekerjaan Atap & Plafon',
        name: 'Kebutuhan Material Plafon',
        description: 'Menghitung kebutuhan rangka hollow dan papan penutup (gypsum/GRC).',
        inputs: [
            { key: 'luas_plafon', label: 'Luas Area Plafon', unitSymbol: 'm²', type: 'number', defaultValue: 120.00 },
            { key: 'koef_hollow', label: 'Koefisien Hollow per m²', unitSymbol: 'm/m²', type: 'number', defaultValue: 4.5 },
            { key: 'panjang_hollow', label: 'Panjang Hollow per Batang', unitSymbol: 'm', type: 'number', defaultValue: 4 },
            { key: 'luas_papan', label: 'Luas Papan per Lembar', unitSymbol: 'm²/lbr', type: 'number', defaultValue: 2.88 },
        ],
        output: { key: 'material_plafon', label: 'Estimasi Material', unitSymbol: '' },
        calculate: (inputs) => {
            const [area, koef_h, p_hollow, area_papan] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            const btg_hollow = Math.ceil((area * koef_h) / p_hollow);
            const lbr_papan = Math.ceil(area / area_papan);
            return `Hollow: ${btg_hollow} btg, Papan: ${lbr_papan} lbr`;
        }
    },
    // --- BARU ---
    ROOF_INSULATION_AREA: {
        id: 'ROOF_INSULATION_AREA',
        group: '6. Pekerjaan Atap & Plafon',
        name: 'Kebutuhan Insulasi Atap',
        description: 'Menghitung kebutuhan material insulasi (e.g., aluminium foil) dalam satuan rol.',
        inputs: [
            { key: 'luas_atap_miring', label: 'Luas Atap Miring', unitSymbol: 'm²', type: 'number', defaultValue: 150.00 },
            { key: 'luas_insulasi_rol', label: 'Luas Insulasi per Rol', unitSymbol: 'm²/rol', type: 'number', defaultValue: 30 }, // 1.2m x 25m
            { key: 'overlap_percentage', label: 'Persentase Overlap', unitSymbol: '%', type: 'number', defaultValue: 10 },
        ],
        output: { key: 'jumlah_rol', label: 'Jumlah Rol Insulasi', unitSymbol: 'rol' },
        calculate: (inputs) => {
            const [area, area_per_roll, overlap] = Object.values(inputs).map(parseFloat);
            if ([area, area_per_roll].some(isNaN) || area <= 0 || area_per_roll <= 0 || overlap < 0) return null;
            const required_area = area * (1 + (overlap / 100));
            return Math.ceil(required_area / area_per_roll);
        },
    },

    FLOOR_SCREED: {
        id: 'FLOOR_SCREED',
        group: '7. Pekerjaan Lantai & Finishing',
        name: 'Volume Screed Lantai',
        description: 'Menghitung volume adukan untuk screed lantai sebelum pemasangan keramik.',
        inputs: [
            { key: 'luas_lantai', label: 'Luas Area Lantai', unitSymbol: 'm²', type: 'number', defaultValue: 120.00 },
            { key: 'tebal_screed', label: 'Tebal Screed', unitSymbol: 'cm', type: 'number', defaultValue: 3 },
        ],
        output: { key: 'volume_screed', label: 'Volume Adukan Screed', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [area, tebal_cm] = [inputs.luas_lantai, inputs.tebal_screed].map(parseFloat);
            if ([area, tebal_cm].some(isNaN) || area <= 0 || tebal_cm <= 0) return null;
            return area * (tebal_cm / 100);
        },
    },
    FLOOR_TILE_QUANTITY: {
        id: 'FLOOR_TILE_QUANTITY',
        group: '7. Pekerjaan Lantai & Finishing',
        name: 'Kebutuhan Keramik Lantai/Dinding',
        description: 'Menghitung jumlah dus keramik yang dibutuhkan, termasuk waste.',
        inputs: [
            { key: 'luas_area', label: 'Luas Area Pasang', unitSymbol: 'm²', type: 'number', defaultValue: 120.00 },
            { key: 'isi_per_dus', label: 'Luas Pasang per Dus', unitSymbol: 'm²/dus', type: 'number', defaultValue: 1.44 },
            { key: 'waste_percentage', label: 'Persentase Waste', unitSymbol: '%', type: 'number', defaultValue: 5 },
        ],
        output: { key: 'jumlah_dus', label: 'Jumlah Dus Keramik', unitSymbol: 'dus' },
        calculate: (inputs) => {
            const [area, isi_dus, waste] = Object.values(inputs).map(parseFloat);
            if ([area, isi_dus].some(isNaN) || area <= 0 || isi_dus <= 0 || waste < 0) return null;
            const area_total = area * (1 + (waste / 100));
            return Math.ceil(area_total / isi_dus);
        },
    },
    TILE_GROUT_QUANTITY: {
        id: 'TILE_GROUT_QUANTITY',
        group: '7. Pekerjaan Lantai & Finishing',
        name: 'Kebutuhan Nat Keramik',
        description: 'Menghitung kebutuhan nat (tile grout) untuk pemasangan keramik.',
        inputs: [
            { key: 'luas_area', label: 'Luas Area Pasang', unitSymbol: 'm²', type: 'number', defaultValue: 120.00 },
            { key: 'lebar_nat', label: 'Lebar Nat', unitSymbol: 'mm', type: 'number', defaultValue: 3 },
            { key: 'konsumsi_nat', label: 'Konsumsi Nat per m²', unitSymbol: 'kg/m²', type: 'number', defaultValue: 0.5 },
        ],
        output: { key: 'berat_nat', label: 'Total Kebutuhan Nat', unitSymbol: 'kg' },
        calculate: (inputs) => {
            const [area, lebar_nat, konsumsi] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            // Formula sederhana, bisa lebih kompleks tergantung ukuran keramik
            return area * konsumsi * (lebar_nat / 3);
        },
    },
    WATERPROOFING_QUANTITY: {
        id: 'WATERPROOFING_QUANTITY',
        group: '7. Pekerjaan Lantai & Finishing',
        name: 'Kebutuhan Waterproofing',
        description: 'Menghitung kebutuhan material waterproofing untuk area basah.',
        inputs: [
            { key: 'luas_area', label: 'Luas Area Waterproofing', unitSymbol: 'm²', type: 'number', defaultValue: 25.00 },
            { key: 'daya_sebar', label: 'Daya Sebar per kg', unitSymbol: 'm²/kg', type: 'number', defaultValue: 1 },
            { key: 'jumlah_lapisan', label: 'Jumlah Lapisan', unitSymbol: 'lapis', type: 'number', defaultValue: 2 },
        ],
        output: { key: 'berat_waterproofing', label: 'Total Kebutuhan Material', unitSymbol: 'kg' },
        calculate: (inputs) => {
            const [area, sebar, lapis] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            return (area * lapis) / sebar;
        },
    },
    PAINT_QUANTITY: {
        id: 'PAINT_QUANTITY',
        group: '7. Pekerjaan Lantai & Finishing',
        name: 'Kebutuhan Cat Tembok',
        description: 'Menghitung jumlah cat (liter) untuk dinding atau plafon.',
        inputs: [
            { key: 'luas_pengecatan', label: 'Luas Total Area Pengecatan', unitSymbol: 'm²', type: 'number', defaultValue: 320.00 },
            { key: 'daya_sebar', label: 'Daya Sebar Cat per Liter', unitSymbol: 'm²/L', type: 'number', defaultValue: 10 },
            { key: 'jumlah_lapisan', label: 'Jumlah Lapisan Cat', unitSymbol: 'lapis', type: 'number', defaultValue: 2 },
        ],
        output: { key: 'liter_cat', label: 'Total Kebutuhan Cat', unitSymbol: 'Liter' },
        calculate: (inputs) => {
            const [area, sebar, lapis] = Object.values(inputs).map(parseFloat);
            if ([area, sebar, lapis].some(isNaN) || area <= 0 || sebar <= 0 || lapis <= 0) return null;
            return (area * lapis) / sebar;
        },
    },
    PRIMER_PAINT_QUANTITY: {
        id: 'PRIMER_PAINT_QUANTITY',
        group: '7. Pekerjaan Lantai & Finishing',
        name: 'Kebutuhan Cat Dasar (Primer)',
        description: 'Menghitung jumlah cat dasar (liter) sebelum cat utama.',
        inputs: [
            { key: 'luas_area', label: 'Luas Total Dinding (Netto)', unitSymbol: 'm²', type: 'number', defaultValue: 320.00 },
            { key: 'daya_sebar_primer', label: 'Daya Sebar Cat Dasar per Liter', unitSymbol: 'm²/L', type: 'number', defaultValue: 8 },
        ],
        output: { key: 'liter_primer', label: 'Total Liter Cat Dasar', unitSymbol: 'L' },
        calculate: (inputs) => {
            const [area, coverage] = [inputs.luas_area, inputs.daya_sebar_primer].map(parseFloat);
            if ([area, coverage].some(isNaN) || area <= 0 || coverage <= 0) return null;
            return area / coverage;
        },
    },
    // --- BARU ---
    WALL_SKIRTING_LENGTH: {
        id: 'WALL_SKIRTING_LENGTH',
        group: '7. Pekerjaan Lantai & Finishing',
        name: 'Kebutuhan Plint Lantai',
        description: 'Menghitung total panjang dan jumlah batang plint lantai yang dibutuhkan.',
        inputs: [
            { key: 'panjang_dinding_pasang', label: 'Total Panjang Dinding', unitSymbol: 'm', type: 'number', defaultValue: 100.00 },
            { key: 'lebar_bukaan_pintu', label: 'Rata-rata Lebar Pintu', unitSymbol: 'm', type: 'number', defaultValue: 0.9 },
            { key: 'jumlah_bukaan_pintu', label: 'Jumlah Pintu', unitSymbol: 'bh', type: 'number', defaultValue: 5 },
            { key: 'panjang_plint_batang', label: 'Panjang Plint per Batang', unitSymbol: 'm', type: 'number', defaultValue: 2.4 },
        ],
        output: { key: 'jumlah_batang', label: 'Jumlah Batang Plint', unitSymbol: 'btg' },
        calculate: (inputs) => {
            const [panjang_total, lebar_pintu, jumlah_pintu, panjang_batang] = Object.values(inputs).map(v => parseFloat(v || 0));
            if ([panjang_total, panjang_batang].some(isNaN) || panjang_total <= 0 || panjang_batang <= 0 || lebar_pintu < 0 || jumlah_pintu < 0) return null;
            const panjang_bersih = panjang_total - (lebar_pintu * jumlah_pintu);
            if (panjang_bersih <= 0) return 0;
            return Math.ceil(panjang_bersih / panjang_batang);
        },
    },

    DOOR_WINDOW_FRAME_WOOD: {
        id: 'DOOR_WINDOW_FRAME_WOOD',
        group: '8. Pekerjaan Kusen, Pintu & Jendela',
        name: 'Kebutuhan Kayu Kusen',
        description: 'Menghitung volume kayu yang dibutuhkan untuk membuat kusen pintu dan jendela.',
        inputs: [
            { key: 'panjang_total_kusen', label: 'Panjang Total Bahan Kusen', unitSymbol: 'm', type: 'number', defaultValue: 50.00 },
            { key: 'lebar_kayu', label: 'Lebar Kayu', unitSymbol: 'cm', type: 'number', defaultValue: 6 },
            { key: 'tebal_kayu', label: 'Tebal Kayu', unitSymbol: 'cm', type: 'number', defaultValue: 12 },
        ],
        output: { key: 'volume_kayu', label: 'Volume Kayu', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [p, l_cm, t_cm] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            return p * (l_cm / 100) * (t_cm / 100);
        },
    },

    SEPTIC_TANK_VOLUME: {
        id: 'SEPTIC_TANK_VOLUME',
        group: '9. Pekerjaan MEP & Sanitasi',
        name: 'Volume Septic Tank',
        description: 'Menghitung estimasi volume septic tank berdasarkan jumlah penghuni.',
        inputs: [
            { key: 'jumlah_penghuni', label: 'Jumlah Penghuni Rumah', unitSymbol: 'orang', type: 'number', defaultValue: 4 },
            { key: 'pemakaian_air', label: 'Pemakaian Air per Orang per Hari', unitSymbol: 'L/hari', type: 'number', defaultValue: 150 },
            { key: 'periode_kuras', label: 'Periode Pengurasan', unitSymbol: 'tahun', type: 'number', defaultValue: 3 },
        ],
        output: { key: 'volume_septictank', label: 'Estimasi Volume', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [penghuni, pakai_air, periode] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            // Rumus SNI dengan penambahan faktor keamanan
            const volume_liter = penghuni * pakai_air * periode * 1.5;
            return volume_liter / 1000;
        },
    },
    ELECTRICAL_WIRING_ESTIMATE: {
        id: 'ELECTRICAL_WIRING_ESTIMATE',
        group: '9. Pekerjaan MEP & Sanitasi',
        name: 'Estimasi Kebutuhan Kabel Listrik',
        description: 'Estimasi kasar kebutuhan panjang kabel listrik (NYM) berdasarkan jumlah titik.',
        inputs: [
            { key: 'jumlah_titik_lampu', label: 'Jumlah Titik Lampu', unitSymbol: 'titik', type: 'number', defaultValue: 15 },
            { key: 'jumlah_titik_stopkontak', label: 'Jumlah Titik Stop Kontak', unitSymbol: 'titik', type: 'number', defaultValue: 20 },
            { key: 'rata_kabel_per_titik', label: 'Rata-rata Kabel per Titik', unitSymbol: 'm/titik', type: 'number', defaultValue: 8 },
        ],
        output: { key: 'panjang_kabel_rol', label: 'Estimasi Kabel', unitSymbol: 'rol' },
        calculate: (inputs) => {
            const [lampu, kontak, rata] = Object.values(inputs).map(v => parseFloat(v || 0));
            if ([rata].some(isNaN) || rata <= 0 || lampu < 0 || kontak < 0) return null;
            const total_titik = lampu + kontak;
            if (total_titik <= 0) return 0;
            const totalLength = total_titik * rata;
            const totalRolls = Math.ceil(totalLength / 50); // Asumsi 1 rol = 50m
            return `${totalRolls} rol (~${totalLength} m)`;
        },
    },
    PLUMBING_PIPING_ESTIMATE: {
        id: 'PLUMBING_PIPING_ESTIMATE',
        group: '9. Pekerjaan MEP & Sanitasi',
        name: 'Estimasi Kebutuhan Pipa Air',
        description: 'Estimasi kasar kebutuhan panjang pipa air bersih dan air kotor.',
        inputs: [
            { key: 'luas_bangunan_total', label: 'Total Luas Lantai Bangunan', unitSymbol: 'm²', type: 'number', defaultValue: 100 },
            { key: 'jumlah_titik_air', label: 'Jumlah Titik Air (Kran, WC, dll)', unitSymbol: 'bh', type: 'number', defaultValue: 8 },
        ],
        output: { key: 'estimasi_pipa', label: 'Estimasi Panjang Pipa', unitSymbol: '' },
        calculate: (inputs) => {
            const [area, points] = Object.values(inputs).map(parseFloat);
            if ([area, points].some(isNaN) || area <= 0 || points <= 0) return null;
            // Formula kasar berdasarkan pengalaman
            const cleanWaterPipe = (area * 0.4) + (points * 3);
            const wasteWaterPipe = (area * 0.3) + (points * 2);
            return `Pipa Air Bersih: ~${Math.ceil(cleanWaterPipe)} m, Pipa Air Kotor: ~${Math.ceil(wasteWaterPipe)} m`;
        },
    },

    CONCRETE_CARPORT_SLAB_VOLUME: {
        id: 'CONCRETE_CARPORT_SLAB_VOLUME',
        group: '10. Pekerjaan Eksterior & Halaman',
        name: 'Volume Beton Plat Lantai Carport',
        description: 'Menghitung volume beton untuk plat lantai carport.',
        inputs: [
            { key: 'panjang_carport', label: 'Panjang Carport', unitSymbol: 'm', type: 'number', defaultValue: 5.00 },
            { key: 'lebar_carport', label: 'Lebar Carport', unitSymbol: 'm', type: 'number', defaultValue: 3.00 },
            { key: 'tebal_plat', label: 'Tebal Plat', unitSymbol: 'cm', type: 'number', defaultValue: 10 },
        ],
        output: { key: 'volume_beton', label: 'Volume Beton Carport', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [p, l, t_cm] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            return p * l * (t_cm / 100);
        },
    },
    CONCRETE_FENCE_FOUNDATION_VOLUME: {
        id: 'CONCRETE_FENCE_FOUNDATION_VOLUME',
        group: '10. Pekerjaan Eksterior & Halaman',
        name: 'Volume Beton Pondasi Pagar',
        description: 'Menghitung volume beton untuk pondasi menerus pagar.',
        inputs: [
            { key: 'lebar_pondasi', label: 'Lebar Pondasi', unitSymbol: 'm', type: 'number', defaultValue: 0.25 },
            { key: 'tinggi_pondasi', label: 'Tinggi Pondasi', unitSymbol: 'm', type: 'number', defaultValue: 0.40 },
            { key: 'panjang_pagar', label: 'Panjang Total Pagar', unitSymbol: 'm', type: 'number', defaultValue: 30.00 },
        ],
        output: { key: 'volume_beton', label: 'Volume Beton Pondasi', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [w, h, p] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            return w * h * p;
        },
    },
    FENCE_WALL_AREA: {
        id: 'FENCE_WALL_AREA',
        group: '10. Pekerjaan Eksterior & Halaman',
        name: 'Luas Dinding Pagar',
        description: 'Menghitung luas pasangan bata untuk dinding pagar.',
        inputs: [
            { key: 'panjang_pagar', label: 'Panjang Total Pagar', unitSymbol: 'm', type: 'number', defaultValue: 30.00 },
            { key: 'tinggi_pagar', label: 'Tinggi Pagar dari Sloof', unitSymbol: 'm', type: 'number', defaultValue: 1.80 },
        ],
        output: { key: 'luas_dinding_pagar', label: 'Luas Dinding Pagar', unitSymbol: 'm²' },
        calculate: (inputs) => {
            const [p, t] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            return p * t;
        },
    },
    CONCRETE_RETAINING_WALL_VOLUME: {
        id: 'CONCRETE_RETAINING_WALL_VOLUME',
        group: '10. Pekerjaan Eksterior & Halaman',
        name: 'Volume Beton Dinding Penahan Tanah',
        description: 'Menghitung volume beton untuk dinding penahan tanah (retaining wall).',
        inputs: [
            { key: 'lebar_atas', label: 'Lebar Atas Dinding', unitSymbol: 'm', type: 'number', defaultValue: 0.15 },
            { key: 'lebar_bawah', label: 'Lebar Bawah Dinding', unitSymbol: 'm', type: 'number', defaultValue: 0.30 },
            { key: 'tinggi_dinding', label: 'Tinggi Dinding', unitSymbol: 'm', type: 'number', defaultValue: 2.00 },
            { key: 'panjang_dinding', label: 'Panjang Dinding', unitSymbol: 'm', type: 'number', defaultValue: 10.00 },
        ],
        output: { key: 'volume_beton', label: 'Volume Beton Dinding', unitSymbol: 'm³' },
        calculate: (inputs) => {
            const [a, b, t, p] = Object.values(inputs).map(parseFloat);
            if (Object.values(inputs).map(parseFloat).some(isNaN) || Object.values(inputs).map(parseFloat).some(v => v <= 0)) return null;
            return ((a + b) / 2) * t * p;
        },
    },
    // --- BARU ---
    PAVING_BLOCK_QUANTITY: {
        id: 'PAVING_BLOCK_QUANTITY',
        group: '10. Pekerjaan Eksterior & Halaman',
        name: 'Kebutuhan Paving Block',
        description: 'Menghitung jumlah paving block (konblok) yang dibutuhkan untuk halaman atau carport.',
        inputs: [
            { key: 'luas_area_pasang', label: 'Luas Area Pasang', unitSymbol: 'm²', type: 'number', defaultValue: 20.00 },
            { key: 'kebutuhan_per_m2', label: 'Jumlah Paving per m²', unitSymbol: 'bh/m²', type: 'number', defaultValue: 44 }, // Contoh untuk model bata
        ],
        output: { key: 'jumlah_paving', label: 'Total Kebutuhan Paving', unitSymbol: 'bh' },
        calculate: (inputs) => {
            const [area, per_m2] = Object.values(inputs).map(parseFloat);
            if ([area, per_m2].some(isNaN) || area <= 0 || per_m2 <= 0) return null;
            return Math.ceil(area * per_m2);
        },
    },
};

/**
 * Mengembalikan daftar semua tipe skema kalkulasi yang tersedia.
 * @return {Array<{id: string, name: string, description: string, group: string}>}
 */
export const getCalculationSchemaTypes = () => {
    return Object.values(CALCULATION_SCHEMAS)
        .filter(schema => schema.id !== 'DEFAULT') // Menyaring item default
        .map(schema => ({
            id: schema.id,
            name: schema.name,
            description: schema.description,
            group: schema.group || 'Lainnya',
        }));
};
