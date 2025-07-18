const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Diperlukan untuk diteruskan ke getFullProjectDetails
const PDFDocument = require('pdfkit-table');
const { getFullProjectDetails } = require('../controllers/projectController'); // <-- Mengimpor fungsi terpusat

// --- Helper Functions ---
// Fungsi ini bisa Anda pindahkan ke file terpisah seperti 'utils/helpers.js' jika diinginkan

/**
 * Memformat angka menjadi format mata uang Rupiah (Rp).
 * @param {number | string} value - Angka yang akan diformat.
 * @returns {string} - String dalam format mata uang.
 */
const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(number);
};

/**
 * Mengubah angka menjadi representasi Romawi.
 * @param {number} num - Angka yang akan diubah.
 * @returns {string} - String angka Romawi.
 */
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


// --- Route Utama untuk Generate PDF ---
router.get('/:projectId/report', async (req, res) => {
    const { projectId } = req.params;
    // Asumsi middleware otentikasi Anda mengisi req.user.id
    const userId = req.user.id; 

    if (!userId) {
        return res.status(401).send("Akses ditolak: Diperlukan otentikasi pengguna.");
    }

    try {
        // 1. PANGGIL FUNGSI TERPUSAT
        // Semua data proyek, item pekerjaan, dan cash flow diambil di sini dengan aman dan efisien.
        const project = await getFullProjectDetails(projectId, userId, pool);

        // Jika proyek tidak ada atau bukan milik user, fungsi akan mengembalikan null.
        if (!project) {
            return res.status(404).send("Laporan tidak dapat dibuat: Proyek tidak ditemukan atau Anda tidak memiliki akses.");
        }

        // 2. KELOMPOKKAN DATA (SEKARANG LEBIH SEDERHANA)
        // Kita bisa langsung menggunakan `item.category_name` yang sudah disediakan oleh `getFullProjectDetails`.
        const groupedWorkItems = (project.workItems || []).reduce((acc, item) => {
            const category = item.category_name || "Tanpa Kategori";
            if (!acc[category]) {
                acc[category] = { items: [], subtotal: 0 };
            }
            acc[category].items.push(item);
            acc[category].subtotal += parseFloat(item.total_item_cost_snapshot || 0);
            return acc;
        }, {});
        
        // --- STRATEGI BUFFERING PDF (Tetap sama, ini adalah best practice) ---
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        
        const pdfPromise = new Promise((resolve, reject) => {
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);
        });

        // --- MULAI MEMBUAT KONTEN PDF ---
        doc.font('Helvetica-Bold').fontSize(14).text('RENCANA ANGGARAN BIAYA (RAB)', { align: 'center' });
        doc.moveDown();

        // Detail Proyek dari data yang sudah didapat
        doc.font('Helvetica').fontSize(9);
        const detailsX = 30;
        let detailsY = doc.y;
        doc.font('Helvetica-Bold').text('Proyek', detailsX, detailsY).font('Helvetica').text(`: ${project.project_name || ''}`, detailsX + 50, detailsY);
        detailsY += 15;
        doc.font('Helvetica-Bold').text('Lokasi', detailsX, detailsY).font('Helvetica').text(`: ${project.location || ''}`, detailsX + 50, detailsY);
        detailsY += 15;
        doc.font('Helvetica-Bold').text('Pemilik', detailsX, detailsY).font('Helvetica').text(`: ${project.customer_name || ''}`, detailsX + 50, detailsY);
        detailsY += 15;
        doc.font('Helvetica-Bold').text('Tahun', detailsX, detailsY).font('Helvetica').text(`: ${new Date(project.start_date).getFullYear() || ''}`, detailsX + 50, detailsY);
        doc.moveDown(2);

        // Menyiapkan data untuk tabel
        const table = {
            headers: [
                { label: "NO.", property: 'no', width: 30, renderer: null },
                { label: "URAIAN PEKERJAAN", property: 'uraian', width: 225, renderer: null },
                { label: "VOL.", property: 'vol', width: 40, align: 'center' },
                { label: "SAT.", property: 'sat', width: 35, align: 'center' },
                { label: "HARGA SATUAN", property: 'harga_satuan', width: 90, align: 'right', renderer: (value) => formatCurrency(value) },
                { label: "JUMLAH HARGA", property: 'jumlah', width: 90, align: 'right', renderer: (value) => formatCurrency(value) }
            ],
            datas: [],
        };

        // Mengisi data tabel dari item pekerjaan yang sudah dikelompokkan
        Object.entries(groupedWorkItems).forEach(([category, data], index) => {
            table.datas.push({ isCategory: true, no: toRoman(index + 1), uraian: category.toUpperCase(), jumlah: data.subtotal });

            data.items.forEach((item, subIndex) => {
                // Data JSON sudah di-parse di `getFullProjectDetails`
                const outputDetails = item.output_details_snapshot || {};
                const volume = parseFloat(outputDetails.value) || 0;
                const totalCost = parseFloat(item.total_item_cost_snapshot) || 0;
                const unitPrice = volume > 0 ? totalCost / volume : 0;
                
                table.datas.push({
                    no: subIndex + 1,
                    uraian: item.definition_name_snapshot,
                    vol: volume.toFixed(2),
                    sat: outputDetails.unit || '-',
                    harga_satuan: unitPrice,
                    jumlah: totalCost,
                });
            });
        });

        // Menambahkan Biaya Lain-lain (manual) dari `project.cashFlowEntries`
        const biayaLainLainEntries = project.cashFlowEntries.filter(entry => !entry.is_auto_generated);
        if(biayaLainLainEntries.length > 0) {
            const totalBiayaLainLain = biayaLainLainEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);
            table.datas.push({
                isCategory: true,
                no: toRoman(Object.keys(groupedWorkItems).length + 1),
                uraian: "BIAYA LAIN-LAIN",
                jumlah: totalBiayaLainLain
            });
            biayaLainLainEntries.forEach((item, subIndex) => {
                const amount = parseFloat(item.amount) || 0;
                table.datas.push({
                    no: subIndex + 1,
                    uraian: item.description,
                    vol: '1.00',
                    sat: 'ls', // lumpsum
                    harga_satuan: amount,
                    jumlah: amount,
                });
            });
        }
        
        // Menggambar tabel ke dokumen PDF
        await doc.table(table, {
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
            prepareRow: (row, i) => {
                doc.font(row.isCategory ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
            },
        });
        
        // Menyelesaikan pembuatan dokumen PDF
        doc.end();

        // Menunggu hingga buffer PDF selesai dibuat
        const finalPdfBuffer = await pdfPromise;
        
        // 3. Setelah PDF berhasil dibuat, kirim response ke client
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="RAB-${project.project_name.replace(/\s+/g, '_')}.pdf"`,
        });
        res.send(finalPdfBuffer);


    } catch (error) {
        console.error("Gagal saat membuat laporan PDF:", error);
        // Jika header belum terkirim, kita aman mengirim status error
        if (!res.headersSent) {
            res.status(500).send("Gagal membuat laporan PDF: " + error.message);
        }
    }
});

module.exports = router;
