const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Pastikan path ini benar
const PDFDocument = require('pdfkit');
const { getFullProjectDetails } = require('../controllers/projectController'); // Pastikan path ini benar

// --- Helper Functions (Tidak ada perubahan) ---

const formatNumber = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return '0,00';
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
};

const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return 'Rp 0,00';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
};

const toRoman = (num) => {
    if (isNaN(num) || num <= 0) return '';
    const roman = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let str = '';
    for (const i of Object.keys(roman)) {
        const q = Math.floor(num / roman[i]);
        num -= q * roman[i];
        str += i.repeat(q);
    }
    return str;
};

const terbilang = (n) => {
    if (n === null || isNaN(n)) return "Nol";
    if (n < 0) return "minus " + terbilang(Math.abs(n));
    
    const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
    const belasan = ["sepuluh", "sebelas", "dua belas", "tiga belas", "empat belas", "lima belas", "enam belas", "tujuh belas", "delapan belas", "sembilan belas"];
    const puluhan = ["", "", "dua puluh", "tiga puluh", "empat puluh", "lima puluh", "enam puluh", "tujuh puluh", "delapan puluh", "sembilan puluh"];
    const ribuan = ["", "ribu", "juta", "miliar", "triliun"];

    if (n === 0) return "nol";
    if (n < 10) return satuan[n];
    if (n < 20) return belasan[n - 10];
    if (n < 100) return puluhan[Math.floor(n / 10)] + (n % 10 > 0 ? " " + satuan[n % 10] : "");
     if (n < 1000) {
        if (n >= 100 && n < 200) return "seratus" + (n % 100 > 0 ? " " + terbilang(n % 100) : "");
        return satuan[Math.floor(n / 100)] + " ratus" + (n % 100 > 0 ? " " + terbilang(n % 100) : "");
    }
    if (n < 2000) return "seribu" + (n % 1000 > 0 ? " " + terbilang(n % 1000) : "");

    let i = 0;
    let result = "";
    while (n > 0) {
        const temp = n % 1000;
        if (temp > 0) {
            let part = terbilang(temp);
            if (i > 0) {
                if (part === "satu" && i === 1) {
                    part = "se"; // Koreksi untuk "satu ribu" menjadi "seribu"
                }
                result = part + (i > 0 ? " " + ribuan[i] : "") + " " + result;
            } else {
                 result = part + " " + result;
            }
        }
        n = Math.floor(n / 1000);
        i++;
    }
    return result.trim().replace(/\s\s+/g, ' ');
};


// --- Route Utama untuk Generate PDF ---
router.get('/:projectId/report', async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id; // Asumsi dari middleware otentikasi

    if (!userId) {
        return res.status(401).send("Akses ditolak: Diperlukan otentikasi pengguna.");
    }

    try {
        const project = await getFullProjectDetails(projectId, userId, pool);

        if (!project) {
            return res.status(404).send("Laporan tidak dapat dibuat: Proyek tidak ditemukan atau Anda tidak memiliki akses.");
        }

        // --- Persiapan Data (Tidak ada perubahan) ---
        const groupedWorkItems = [];
        const categoryMap = new Map();
        
        (project.workItems || []).forEach(item => {
            const categoryName = item.category_name || "Pekerjaan Lain-lain";
            
            if (!categoryMap.has(categoryName)) {
                // Jika kategori baru, buat entri baru dan tambahkan ke array
                const newCategory = {
                    category_name: categoryName,
                    items: [],
                    subtotal: 0
                };
                categoryMap.set(categoryName, newCategory);
                groupedWorkItems.push(newCategory);
            }
            
            // Tambahkan item dan subtotal ke kategori yang sudah ada
            const category = categoryMap.get(categoryName);
            category.items.push(item);
            category.subtotal += parseFloat(item.total_item_cost_snapshot || 0);
        });
        
        const jumlahTotalPekerjaan = Object.values(groupedWorkItems).reduce((sum, group) => sum + group.subtotal, 0);
        const biayaLainLainEntries = project.cashFlowEntries.filter(entry => !entry.is_auto_generated);
        const totalBiayaLainLain = biayaLainLainEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);
        const jumlahTotalAkhir = jumlahTotalPekerjaan + totalBiayaLainLain;
        const dibulatkan = Math.round(jumlahTotalAkhir);
        const terbilangStr = terbilang(dibulatkan) + " rupiah";
        const terbilangFormatted = terbilangStr.charAt(0).toUpperCase() + terbilangStr.slice(1);

        // --- Setup Dokumen PDF ---
        const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        const pdfPromise = new Promise((resolve, reject) => {
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);
        });

        // --- Header Dokumen ---
        doc.font('Helvetica-Bold').fontSize(14).text('RENCANA ANGGARAN BIAYA (RAB)', { align: 'center' });
        doc.moveDown(0.5);
        doc.lineWidth(1.5).moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.x, doc.y).stroke();
        doc.moveDown();

        // --- Detail Proyek ---
        doc.font('Helvetica').fontSize(9);
        const detailsX = 30;
        let currentY = doc.y;
        const detailLineHeight = 15;
        doc.font('Helvetica-Bold').text('PROYEK', detailsX, currentY, {width: 80}).font('Helvetica').text(`: ${project.project_name || ''}`, detailsX + 80, currentY);
        currentY += detailLineHeight;
        doc.font('Helvetica-Bold').text('LOKASI', detailsX, currentY, {width: 80}).font('Helvetica').text(`: ${project.location || ''}`, detailsX + 80, currentY);
        currentY += detailLineHeight;
        doc.font('Helvetica-Bold').text('PEMILIK', detailsX, currentY, {width: 80}).font('Helvetica').text(`: ${project.customer_name || ''}`, detailsX + 80, currentY);
        currentY += detailLineHeight;
        doc.font('Helvetica-Bold').text('TAHUN', detailsX, currentY, {width: 80}).font('Helvetica').text(`: ${project.start_date ? new Date(project.start_date).getFullYear() : ''}`, detailsX + 80, currentY);
        
        doc.y = currentY;
        doc.moveDown(2);
        
        // ======================================================================
        // ✅ PERBAIKAN UTAMA: LOGIKA PENGGAMBARAN TABEL DENGAN PAGE BREAK
        // ======================================================================

        const tableLeft = 30;
        const pageBottom = doc.page.height - doc.page.margins.bottom;
        const minRowHeight = 16;
        const headerHeight = 25;

        const columns = [
            { id: 'no', header: 'NO.', width: 35, align: 'center' },
            { id: 'uraian', header: 'URAIAN PEKERJAAN', width: 220, align: 'left' },
            { id: 'vol', header: 'VOL.', width: 45, align: 'right' },
            { id: 'sat', header: 'SAT.', width: 40, align: 'center' },
            { id: 'harga_satuan', header: 'HARGA SATUAN (Rp)', width: 95, align: 'right' },
            { id: 'jumlah', header: 'JUMLAH HARGA (Rp)', width: 95, align: 'right' }
        ];
        const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);

        const drawHeader = () => {
            let x = tableLeft;
            doc.rect(x, doc.y, tableWidth, headerHeight).fillAndStroke('#E8E8E8', '#000');
            doc.font('Helvetica-Bold').fontSize(8).fillColor('black');
            
            const textY = doc.y + (headerHeight - doc.currentLineHeight()) / 2;
            columns.forEach(col => {
                doc.text(col.header, x, textY, { width: col.width, align: 'center' });
                x += col.width;
            });
            doc.y += headerHeight;
        };
        
        // Menggambar header untuk halaman pertama
        drawHeader();

        // ✨ PERUBAHAN: Mengumpulkan SEMUA baris, termasuk ringkasan, ke dalam satu array
        const allRows = [];
        Object.entries(groupedWorkItems).forEach(([category, data], index) => {
            allRows.push({ type: 'category', no: toRoman(index + 1), uraian: category.toUpperCase(), jumlah: formatNumber(data.subtotal) });
            data.items.forEach((item, subIndex) => {
                let outputDetails = {};
                try {
                    if (item.output_details_snapshot) outputDetails = JSON.parse(item.output_details_snapshot);
                } catch (e) {
                    console.error("Gagal parse JSON output_details_snapshot:", e);
                }
                const volume = parseFloat(item.calculation_value || 0);
                const totalCost = parseFloat(item.total_item_cost_snapshot || 0);
                const unitPrice = volume > 0 ? totalCost / volume : 0;
                allRows.push({ type: 'item', no: subIndex + 1, uraian: item.definition_name_snapshot, vol: formatNumber(volume), sat: outputDetails.unit || 'ls', harga_satuan: formatNumber(unitPrice), jumlah: formatNumber(totalCost) });
                (item.components_snapshot || []).forEach(comp => {
                    allRows.push({ type: 'component', uraian: `- ${comp.component_name_snapshot}`, vol: formatNumber(comp.quantity_calculated), sat: comp.unit_snapshot, harga_satuan: formatNumber(comp.price_per_unit_snapshot), jumlah: formatNumber(comp.cost_calculated) });
                });
            });
        });
        if (biayaLainLainEntries.length > 0) {
            allRows.push({ type: 'category', no: toRoman(Object.keys(groupedWorkItems).length + 1), uraian: "BIAYA LAIN-LAIN", jumlah: formatNumber(totalBiayaLainLain) });
            biayaLainLainEntries.forEach((item, subIndex) => {
                allRows.push({ type: 'item', no: subIndex + 1, uraian: item.description, vol: '1,00', sat: 'ls', harga_satuan: formatNumber(item.amount), jumlah: formatNumber(item.amount) });
            });
        }
        
        // Menambahkan baris ringkasan ke dalam array utama
        allRows.push({ type: 'summary', label: 'JUMLAH', value: formatNumber(jumlahTotalPekerjaan) });
        if (totalBiayaLainLain > 0) {
            allRows.push({ type: 'summary', label: 'BIAYA LAIN-LAIN', value: formatNumber(totalBiayaLainLain) });
        }
        allRows.push({ type: 'summary_total', label: 'JUMLAH TOTAL', value: formatNumber(jumlahTotalAkhir) });
        allRows.push({ type: 'summary_total', label: 'DIBULATKAN', value: formatCurrency(dibulatkan) });
        allRows.push({ type: 'terbilang', text: `Terbilang : ${terbilangFormatted}` });


        // ✨ LOGIKA LOOP TUNGGAL UNTUK SEMUA JENIS BARIS
        allRows.forEach((row, index) => {
            // Hitung tinggi berdasarkan tipe baris
            let rowHeight = minRowHeight;
            let fontName = 'Helvetica';
            let fontSize = 8;
            let uraianText = '';

            if (row.type === 'category' || row.type === 'item') {
                fontName = 'Helvetica-Bold';
                uraianText = row.uraian || '';
            } else if (row.type === 'component') {
                fontName = 'Helvetica-Oblique';
                uraianText = row.uraian || '';
            } else if (row.type === 'summary' || row.type === 'summary_total') {
                fontName = 'Helvetica-Bold';
                fontSize = 9;
                uraianText = row.label || '';
            } else if (row.type === 'terbilang') {
                fontName = 'Helvetica-Oblique';
                fontSize = 9;
                uraianText = row.text || '';
                rowHeight = minRowHeight * 2; // Beri ruang lebih untuk terbilang
            }
            
            if (row.type !== 'summary' && row.type !== 'summary_total' && row.type !== 'terbilang') {
                const uraianColWidth = columns.find(c => c.id === 'uraian').width;
                const textHeight = doc.font(fontName).fontSize(fontSize).heightOfString(uraianText, { width: uraianColWidth - 8 });
                rowHeight = Math.max(minRowHeight, textHeight + 8);
            }

            // Cek dan lakukan page break
            if (doc.y + rowHeight >= pageBottom) {
                // Jangan gambar garis bawah pada tabel sebelum pindah halaman
                doc.addPage();
                drawHeader();
            }

            const yBefore = doc.y;
            let x = tableLeft;

            // Gambar baris berdasarkan tipenya
            if (row.type === 'category' || row.type === 'summary_total' || row.type === 'terbilang') {
                doc.rect(x, yBefore, tableWidth, rowHeight).fill('#F3F4F6');
            }

            const textY = yBefore + (rowHeight - doc.font(fontName).fontSize(fontSize).currentLineHeight()) / 2 + 1;

            if (row.type === 'summary' || row.type === 'summary_total') {
                const labelWidth = columns.slice(0, 5).reduce((sum, col) => sum + col.width, 0);
                doc.font(fontName).fontSize(fontSize).fillColor('black')
                   .text(row.label, tableLeft, textY, { width: labelWidth - 5, align: 'right' })
                   .text(row.value, tableLeft + labelWidth, textY, { width: columns[5].width - 4, align: 'right' });
            } else if (row.type === 'terbilang') {
                doc.font('Helvetica-Bold').fontSize(9).text('Terbilang :', tableLeft + 4, textY, { continued: true })
                   .font('Helvetica-Oblique').text(` ${terbilangFormatted.replace('Terbilang : ', '')}`);
            } else {
                // Gambar teks untuk kolom tabel biasa
                columns.forEach(col => {
                    let val = row[col.id] || '';
                    let textX = x;
                    let currentFont = fontName;
                    let textOptions = { width: col.width, align: col.align };

                    if (row.type === 'item' && col.id !== 'no') currentFont = 'Helvetica';
                    if (row.type === 'category' || (row.type === 'item' && col.id === 'no')) currentFont = 'Helvetica-Bold';
                    
                    if (col.align === 'left') {
                        textX += 4;
                        textOptions.width -= 8;
                        if (row.type === 'component' && col.id === 'uraian') {
                            textX += 10;
                            textOptions.width -= 10;
                        }
                    } else if (col.align === 'right') {
                        textX -= 4;
                        textOptions.width -= 8;
                    }
                    
                    if (row.type === 'category' && ['vol', 'sat', 'harga_satuan'].includes(col.id)) val = '';
                    if (row.type === 'component' && col.id === 'no') val = '';
                    
                    doc.font(currentFont).fontSize(8).fillColor('black').text(val, textX, textY, textOptions);
                    x += col.width;
                });
            }
            
            doc.rect(tableLeft, yBefore, tableWidth, rowHeight).stroke();
            doc.y = yBefore + rowHeight;
        });
        
        // --- Finalisasi Dokumen ---
        doc.end();
        const finalPdfBuffer = await pdfPromise;

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="RAB-${project.project_name.replace(/\s+/g, '_')}.pdf"`,
        });
        res.send(finalPdfBuffer);

    } catch (error) {
        console.error("Gagal saat membuat laporan PDF:", error);
        if (!res.headersSent) {
            res.status(500).send("Gagal membuat laporan PDF: " + error.message);
        }
    }
});

module.exports = router;
