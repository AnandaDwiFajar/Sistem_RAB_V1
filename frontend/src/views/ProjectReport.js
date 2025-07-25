import React from 'react';

// --- Helper Functions (Tidak ada perubahan) ---
const formatNumber = (number) => {
    if (isNaN(number) || number === null) return '0,00';
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(number);
};

const formatCurrency = (number) => {
    if (isNaN(number) || number === null) return 'Rp 0,00';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(number);
};

const toRoman = (num) => {
    if (isNaN(num) || num === null || num === 0) return '';
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
        if (n < 200 && n !== 100) return "seratus" + (n % 100 > 0 ? " " + terbilang(n % 100) : "");
        if (n === 100) return "seratus";
        return satuan[Math.floor(n / 100)] + " ratus" + (n % 100 > 0 ? " " + terbilang(n % 100) : "");
    }
    if (n < 2000) return "seribu" + (n % 1000 > 0 ? " " + terbilang(n % 1000) : "");

    let i = 0;
    let result = "";
    while (n > 0) {
        const temp = n % 1000;
        if (temp > 0) {
            result = terbilang(temp) + " " + ribuan[i] + " " + result;
        }
        n = Math.floor(n / 1000);
        i++;
    }
    return result.trim().replace(/\s\s+/g, ' ');
};


// --- Main Component ---
const ProjectReport = React.forwardRef(({ project, allCategories = [] }, ref) => {
    if (!project) return null;

    // --- ✅ PERBAIKAN LOGIKA PENGURUTAN ---

    // 1. Kelompokkan semua item pekerjaan berdasarkan category_id untuk pencarian cepat.
    const workItemsByCategoryId = (project.workItems || []).reduce((acc, item) => {
        const categoryId = item.category_id || 'unassigned';
        if (!acc[categoryId]) {
            acc[categoryId] = [];
        }
        acc[categoryId].push(item);
        return acc;
    }, {});

    // 2. Buat data laporan dengan mengiterasi `allCategories` yang SUDAH TERURUT dari backend.
    const sortedGroupedWorkItems = allCategories
        .map(category => {
            const items = workItemsByCategoryId[category.id] || [];
            if (items.length === 0) {
                return null; // Jangan tampilkan kategori jika tidak ada item pekerjaan di dalamnya.
            }
            const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total_item_cost_snapshot || 0), 0);
            
            // Hapus item yang sudah diproses dari kelompok utama agar tidak duplikat.
            delete workItemsByCategoryId[category.id];

            return {
                categoryName: category.category_name,
                items: items,
                subtotal: subtotal,
            };
        })
        .filter(Boolean); // Hapus entri null dari array.

    // 3. Tambahkan item yang tidak memiliki kategori (jika ada) ke bagian akhir.
    const unassignedItems = workItemsByCategoryId['unassigned'];
    if (unassignedItems && unassignedItems.length > 0) {
        const subtotal = unassignedItems.reduce((sum, item) => sum + parseFloat(item.total_item_cost_snapshot || 0), 0);
        sortedGroupedWorkItems.push({
            categoryName: 'Pekerjaan Lain-lain',
            items: unassignedItems,
            subtotal: subtotal,
        });
    }

    // Kalkulasi Total
    const jumlahTotalPekerjaan = sortedGroupedWorkItems.reduce((sum, group) => sum + group.subtotal, 0);
    const biayaLainLainEntries = (project.cashFlowEntries || []).filter(entry => !entry.is_auto_generated);
    const totalBiayaLainLain = biayaLainLainEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);
    const jumlahTotalAkhir = jumlahTotalPekerjaan + totalBiayaLainLain;
    const dibulatkan = Math.round(jumlahTotalAkhir);
    const terbilangStr = terbilang(dibulatkan) + " rupiah";
    const terbilangFormatted = terbilangStr.charAt(0).toUpperCase() + terbilangStr.slice(1);
    const projectYear = project.start_date ? new Date(project.start_date).getFullYear() : new Date().getFullYear();

    // Style untuk print
    const printStyles = `
        @media print {
            html, body { height: initial !important; overflow: initial !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            tbody { break-inside: avoid; page-break-inside: avoid; }
            tr { break-inside: avoid; page-break-inside: avoid; }
        }
    `;

    return (
        <>
            <style>{printStyles}</style>
            <div ref={ref} className="p-8 bg-white text-black font-sans text-xs printable-area">
                {/* Header */}
                <h1 className="text-base font-bold text-center uppercase mb-2">RENCANA ANGGARAN BIAYA (RAB)</h1>
                <div className="mb-6 w-full max-w-lg mx-auto border-b-2 border-black pb-2"></div>
                <div className="mb-6 w-full max-w-lg">
                    <table className="text-xs">
                        <tbody>
                            <tr><td className="pr-4 py-0.5 font-semibold uppercase">PROYEK</td><td className="pr-2">:</td><td className="font-semibold">{project.project_name}</td></tr>
                            <tr><td className="pr-4 py-0.5 font-semibold uppercase">LOKASI</td><td className="pr-2">:</td><td>{project.location}</td></tr>
                            <tr><td className="pr-4 py-0.5 font-semibold uppercase">PEMILIK</td><td className="pr-2">:</td><td>{project.customer_name}</td></tr>
                            <tr><td className="pr-4 py-0.5 font-semibold uppercase">TAHUN</td><td className="pr-2">:</td><td>{projectYear}</td></tr>
                        </tbody>
                    </table>
                </div>

                <table className="w-full text-xs border-collapse border border-black table-fixed">
                    <thead className="bg-gray-200 text-black font-bold">
                        <tr>
                            <th className="p-2 border border-black w-12 text-center">NO.</th>
                            <th className="p-2 border border-black text-left">URAIAN PEKERJAAN</th>
                            <th className="p-2 border border-black w-20 text-center">VOL.</th>
                            <th className="p-2 border border-black w-16 text-center">SAT.</th>
                            <th className="p-2 border border-black w-32 text-center">HARGA SATUAN (Rp)</th>
                            <th className="p-2 border border-black w-32 text-center">JUMLAH HARGA (Rp)</th>
                        </tr>
                    </thead>
                    
                    {/* Loop menggunakan data yang sudah diurutkan dengan benar */}
                    {sortedGroupedWorkItems.map(({ categoryName, items, subtotal }, index) => (
                        <tbody key={categoryName}>
                            {/* Baris Header Kategori */}
                            <tr className="font-bold bg-gray-100">
                                <td className="p-2 border border-black text-center">{toRoman(index + 1)}</td>
                                <td className="p-2 border border-black uppercase" colSpan="4">{categoryName}</td>
                                <td className="p-2 border border-black text-right">{formatNumber(subtotal)}</td>
                            </tr>

                            {/* Loop untuk Item Pekerjaan */}
                            {items.map((item, subIndex) => {
                                let outputDetails = {};
                                try { outputDetails = JSON.parse(item.output_details_json || '{}'); } catch (e) { console.error("Gagal parse JSON", e); }
                                const volume = parseFloat(item.calculation_value || 0);
                                const totalCost = parseFloat(item.total_item_cost_snapshot || 0);
                                const unitPrice = volume !== 0 ? totalCost / volume : 0;

                                return (
                                    <React.Fragment key={item.id}>
                                        {/* Baris Utama Item Pekerjaan */}
                                        <tr>
                                            <td className="p-2 border border-black text-center">{subIndex + 1}</td>
                                            <td className="p-2 border border-black pl-8 font-semibold">{item.definition_name_snapshot}</td>
                                            <td className="p-2 border border-black text-right font-semibold">{formatNumber(volume)}</td>
                                            <td className="p-2 border border-black text-center font-semibold">{outputDetails.unit || 'ls'}</td>
                                            <td className="p-2 border border-black text-right font-semibold">{formatNumber(unitPrice)}</td>
                                            <td className="p-2 border border-black text-right font-semibold">{formatNumber(totalCost)}</td>
                                        </tr>
                                        
                                        {/* Loop untuk Komponen di dalam Item Pekerjaan */}
                                        {(item.components_snapshot || []).map(comp => (
                                            <tr key={comp.material_price_id_snapshot || comp.component_name_snapshot}>
                                                <td className="p-1 border-l border-r border-black"></td>
                                                <td className="p-1 border-l border-r border-black pl-12 italic text-gray-600">- {comp.component_name_snapshot}</td>
                                                <td className="p-1 border-l border-r border-black text-right italic text-gray-600">{formatNumber(comp.quantity_calculated)}</td>
                                                <td className="p-1 border-l border-r border-black text-center italic text-gray-600">{comp.unit_snapshot}</td>
                                                <td className="p-1 border-l border-r border-black text-right italic text-gray-600">{formatNumber(comp.price_per_unit_snapshot)}</td>
                                                <td className="p-1 border-l border-r border-black text-right italic text-gray-600">{formatNumber(comp.cost_calculated)}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    ))}
                    
                    {/* Biaya Lain-lain */}
                    {biayaLainLainEntries.length > 0 && (
                        <tbody>
                            <tr className="font-bold bg-gray-100">
                                <td className="p-2 border border-black text-center">{toRoman(sortedGroupedWorkItems.length + 1)}</td>
                                <td className="p-2 border border-black uppercase" colSpan="4">BIAYA LAIN-LAIN</td>
                                <td className="p-2 border border-black text-right">{formatNumber(totalBiayaLainLain)}</td>
                            </tr>
                            {biayaLainLainEntries.map((item, subIndex) => (
                                <tr key={item.id}>
                                    <td className="p-2 border border-black text-center">{subIndex + 1}</td>
                                    <td className="p-2 border border-black pl-8">{item.description}</td>
                                    <td className="p-2 border border-black text-right">1,00</td>
                                    <td className="p-2 border border-black text-center">ls</td>
                                    <td className="p-2 border border-black text-right">{formatNumber(item.amount)}</td>
                                    <td className="p-2 border border-black text-right">{formatNumber(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    )}

                    {/* Footer Tabel */}
                    <tfoot className="font-bold">
                        <tr className="bg-gray-100">
                            <td colSpan="5" className="p-2 border border-black text-left">JUMLAH</td>
                            <td className="p-2 border border-black text-right">{formatNumber(jumlahTotalPekerjaan)}</td>
                        </tr>
                        {biayaLainLainEntries.length > 0 && (
                            <tr className="bg-gray-100">
                                <td colSpan="5" className="p-2 border border-black text-left">BIAYA LAIN-LAIN</td>
                                <td className="p-2 border border-black text-right">{formatNumber(totalBiayaLainLain)}</td>
                            </tr>
                        )}
                        <tr className="bg-gray-200">
                            <td colSpan="5" className="p-2 border border-black text-left">JUMLAH TOTAL</td>
                            <td className="p-2 border border-black text-right">{formatNumber(jumlahTotalAkhir)}</td>
                        </tr>
                        <tr className="bg-gray-200">
                            <td colSpan="5" className="p-2 border border-black text-left">DIBULATKAN</td>
                            <td className="p-2 border border-black text-right">{formatCurrency(dibulatkan)}</td>
                        </tr>
                    </tfoot>
                </table>

                {/* Terbilang */}
                <div className="mt-4 p-2 border border-black bg-gray-200">
                    <span className="font-bold">Terbilang : </span>
                    <span className="italic">{terbilangFormatted}</span>
                </div>
            </div>
        </>
    );
});

ProjectReport.displayName = 'ProjectReport';
export default ProjectReport;
