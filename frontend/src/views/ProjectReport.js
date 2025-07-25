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
    if (n < 1000) return (n < 200 ? "seratus" : satuan[Math.floor(n / 100)] + " ratus") + (n % 100 > 0 ? " " + terbilang(n % 100) : "");
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

  // --- Kalkulasi Data (Tidak ada perubahan) ---
  const groupedWorkItems = (project.workItems || []).reduce((acc, item) => {
    const categoryObject = allCategories.find(cat => cat.id === item.category_id);
    const category = categoryObject ? categoryObject.category_name : "Pekerjaan Lain-lain";
    if (!acc[category]) {
        acc[category] = { items: [], subtotal: 0 };
    }
    acc[category].items.push(item);
    acc[category].subtotal += parseFloat(item.total_item_cost_snapshot || 0);
    return acc;
    }, {});

  const jumlahTotalPekerjaan = Object.values(groupedWorkItems).reduce((sum, group) => sum + group.subtotal, 0);
  const biayaLainLainEntries = (project.cashFlowEntries || []).filter(entry => !entry.is_auto_generated);
  const totalBiayaLainLain = biayaLainLainEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);
  const jumlahTotalAkhir = jumlahTotalPekerjaan + totalBiayaLainLain;
  const dibulatkan = Math.round(jumlahTotalAkhir);
  const terbilangStr = terbilang(dibulatkan) + " rupiah";
  const terbilangFormatted = terbilangStr.charAt(0).toUpperCase() + terbilangStr.slice(1);
  
  const projectYear = project.start_date ? new Date(project.start_date).getFullYear() : new Date().getFullYear();

  // --- Style untuk Print (✅ DIPERBAIKI) ---
  // Gaya ini lebih efektif untuk mengontrol page break.
  const printStyles = `
    @media print {
      html, body {
        height: initial !important;
        overflow: initial !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      /* Memastikan header dan footer tabel berulang di setiap halaman */
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }

      /* ✅ PERBAIKAN UTAMA: Mencegah pemisahan halaman di dalam grup kategori (tbody) */
      /* Ini adalah aturan terpenting untuk mencegah konten terpotong. */
      tbody {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      /* Mencegah baris tabel terpotong jika memungkinkan */
      tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      
      /* Mencegah judul kategori menjadi baris terakhir di sebuah halaman */
      .category-header {
        break-after: avoid;
        page-break-after: avoid;
      }
    }
  `;

  return (
    <>
      <style>{printStyles}</style>
      <div ref={ref} className="bg-white text-black font-sans text-xs printable-area">
        {/* --- Header Proyek (Tidak ada perubahan) --- */}
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

        {/* --- Tabel Utama Tunggal --- */}
        <table className="w-full text-xs table-fixed border-collapse">
            <thead>
              <tr className="bg-gray-200 text-black font-bold">
                <th className="p-2 border border-black w-12 text-center">NO.</th>
                <th className="p-2 border border-black text-left">URAIAN PEKERJAAN</th>
                <th className="p-2 border border-black w-20 text-center">VOL.</th>
                <th className="p-2 border border-black w-16 text-center">SAT.</th>
                <th className="p-2 border border-black w-32 text-center">HARGA SATUAN (Rp)</th>
                <th className="p-2 border border-black w-32 text-center">JUMLAH HARGA (Rp)</th>
              </tr>
            </thead>
            
            {/* ✅ PERBAIKAN UTAMA: Loop untuk membuat tbody per kategori */}
            {/* Daripada React.Fragment, kita gunakan <tbody> untuk setiap grup. */}
            {Object.entries(groupedWorkItems).map(([category, data], index) => (
              <tbody key={category}>
                {/* Baris Header Kategori */}
                <tr className="font-bold bg-gray-100 category-header">
                    <td className="p-2 border border-black text-center">{toRoman(index + 1)}</td>
                    <td className="p-2 border-t border-b border-black uppercase" colSpan="4">{category}</td>
                    <td className="p-2 border border-black text-right">{formatNumber(data.subtotal)}</td>
                </tr>
                {/* Loop untuk Item Pekerjaan */}
                {data.items.map((item, subIndex) => {
                    const outputDetails = JSON.parse(item.output_details_json || '{}');
                    const volume = parseFloat(item.calculation_value || 0);
                    const totalCost = parseFloat(item.total_item_cost_snapshot || 0);
                    const unitPrice = volume !== 0 ? totalCost / volume : 0;
                    return (
                      // Menggunakan React.Fragment di sini sudah benar
                      <React.Fragment key={item.id}>
                          <tr>
                              <td className="p-2 border-x border-black text-center">{subIndex + 1}</td>
                              <td className="p-2 border-x border-black pl-8 font-semibold">{item.definition_name_snapshot}</td>
                              <td className="p-2 border-x border-black text-right font-semibold">{formatNumber(volume)}</td>
                              <td className="p-2 border-x border-black text-center font-semibold">{outputDetails.unit || 'ls'}</td>
                              <td className="p-2 border-x border-black text-right font-semibold">{formatNumber(unitPrice)}</td>
                              <td className="p-2 border-x border-black text-right font-semibold">{formatNumber(totalCost)}</td>
                          </tr>
                          {(item.components_snapshot || []).map(comp => (
                              <tr key={comp.material_price_id_snapshot || comp.component_name_snapshot}>
                                  <td className="p-1 border-x border-black"></td>
                                  <td className="p-1 border-x border-black pl-12 italic text-gray-600">- {comp.component_name_snapshot}</td>
                                  <td className="p-1 border-x border-black text-right italic text-gray-600">{formatNumber(comp.quantity_calculated)}</td>
                                  <td className="p-1 border-x border-black text-center italic text-gray-600">{comp.unit_snapshot}</td>
                                  <td className="p-1 border-x border-black text-right italic text-gray-600">{formatNumber(comp.price_per_unit_snapshot)}</td>
                                  <td className="p-1 border-x border-black text-right italic text-gray-600">{formatNumber(comp.cost_calculated)}</td>
                              </tr>
                          ))}
                      </React.Fragment>
                    );
                })}
              </tbody>
            ))}
            
            {/* --- Bagian Biaya Lain-Lain (juga dibungkus tbody) --- */}
            {biayaLainLainEntries.length > 0 && (
                <tbody>
                    <tr className="font-bold bg-gray-100 category-header">
                        <td className="p-2 border border-black text-center">{toRoman(Object.keys(groupedWorkItems).length + 1)}</td>
                        <td className="p-2 border-t border-b border-black uppercase" colSpan="4">BIAYA LAIN-LAIN</td>
                        <td className="p-2 border border-black text-right">{formatNumber(totalBiayaLainLain)}</td>
                    </tr>
                    {biayaLainLainEntries.map((item, subIndex) => (
                        <tr key={item.id}>
                            <td className="p-2 border-x border-black text-center">{subIndex + 1}</td>
                            <td className="p-2 border-x border-black pl-8">{item.description}</td>
                            <td className="p-2 border-x border-black text-right">1,00</td>
                            <td className="p-2 border-x border-black text-center">ls</td>
                            <td className="p-2 border-x border-black text-right">{formatNumber(item.amount)}</td>
                            <td className="p-2 border-x border-black text-right">{formatNumber(item.amount)}</td>
                        </tr>
                    ))}
                </tbody>
            )}

            <tfoot>
                <tr>
                    <td colSpan="5" className="p-2 border border-black text-left font-bold">JUMLAH</td>
                    <td className="p-2 border border-black text-right font-bold">{formatNumber(jumlahTotalPekerjaan)}</td>
                </tr>
                {biayaLainLainEntries.length > 0 && (
                    <tr>
                        <td colSpan="5" className="p-2 border border-black text-left font-bold">BIAYA LAIN-LAIN</td>
                        <td className="p-2 border border-black text-right font-bold">{formatNumber(totalBiayaLainLain)}</td>
                    </tr>
                )}
                <tr className="font-bold bg-gray-100">
                    <td colSpan="5" className="p-2 border border-black text-left">JUMLAH TOTAL</td>
                    <td className="p-2 border border-black text-right">{formatNumber(jumlahTotalAkhir)}</td>
                </tr>
                <tr className="font-bold bg-gray-100">
                    <td colSpan="5" className="p-2 border border-black text-left">DIBULATKAN</td>
                    <td className="p-2 border border-black text-right">{formatCurrency(dibulatkan)}</td>
                </tr>
            </tfoot>
        </table>

        {/* --- Terbilang (Tidak ada perubahan) --- */}
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
