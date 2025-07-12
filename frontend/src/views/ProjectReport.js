import React from 'react';

// Helper untuk format mata uang
const formatCurrency = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
};

// Fungsi terbilang (tidak ada perubahan)
const terbilang = (n) => {
    if (n < 0) return "minus " + terbilang(-n);
    const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
    const belasan = ["sepuluh", "sebelas", "dua belas", "tiga belas", "empat belas", "lima belas", "enam belas", "tujuh belas", "delapan belas", "sembilan belas"];
    const puluhan = ["", "", "dua puluh", "tiga puluh", "empat puluh", "lima puluh", "enam puluh", "tujuh puluh", "delapan puluh", "sembilan puluh"];
    const ribuan = ["", "ribu", "juta", "miliar", "triliun"];

    if (n < 10) return satuan[n];
    if (n < 20) return belasan[n - 10];
    if (n < 100) return puluhan[Math.floor(n/10)] + (n % 10 > 0 ? " " + satuan[n % 10] : "");
    if (n < 1000) return satuan[Math.floor(n/100)] + " ratus" + (n % 100 > 0 ? " " + terbilang(n % 100) : "");
    
    let i = 0;
    let result = "";
    while (n > 0) {
        const temp = n % 1000;
        if (temp > 0) {
            let tempStr = terbilang(temp);
            if (i === 1 && temp === 1) {
                tempStr = "se";
            }
            result = tempStr + (i > 0 ? (tempStr === "se" ? ribuan[i] : " " + ribuan[i]) : "") + " " + result;
        }
        n = Math.floor(n / 1000);
        i++;
    }
    return result.trim().replace(/\s\s+/g, ' ');
};

// Fungsi toRoman (tidak ada perubahan)
const toRoman = (num) => {
    const roman = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let str = '';
    for (const i of Object.keys(roman)) {
        const q = Math.floor(num / roman[i]);
        num -= q * roman[i];
        str += i.repeat(q);
    }
    return str;
};


const ProjectReport = React.forwardRef(({ project, allCategories = [] }, ref) => {
  if (!project) return null;

  // 1. Mengelompokkan item pekerjaan
  const groupedWorkItems = (project.workItems || []).reduce((acc, item) => {
    const categoryObject = allCategories.find(cat => cat.id === item.category_id);
    const category = categoryObject ? categoryObject.category_name : "Tanpa Kategori";
    if (!acc[category]) {
      acc[category] = { items: [], subtotal: 0 };
    }
    acc[category].items.push(item);
    acc[category].subtotal += parseFloat(item.total_item_cost_snapshot);
    return acc;
  }, {});
  
  // 2. Kalkulasi biaya (tidak ada perubahan)
  const jumlahTotalPekerjaan = Object.values(groupedWorkItems).reduce((sum, group) => sum + group.subtotal, 0);
  const biayaLainLainEntries = (project.cashFlowEntries || []).filter(entry => !entry.is_auto_generated);
  const totalBiayaLainLain = biayaLainLainEntries.reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
  const jumlahTotalAkhir = jumlahTotalPekerjaan + totalBiayaLainLain;
  const dibulatkan = Math.round(jumlahTotalAkhir);
  const terbilangStr = terbilang(dibulatkan) + " rupiah";
  const terbilangFormatted = terbilangStr.charAt(0).toUpperCase() + terbilangStr.slice(1);
  const projectYear = project.start_date ? new Date(project.start_date).getFullYear() : new Date().getFullYear();

  return (
    <div ref={ref} className="p-10 bg-white text-black font-sans text-xs">
      <h1 className="text-base font-bold text-center uppercase mb-6">Rekapitulasi Rencana Anggaran Biaya (RAB)</h1>

      {/* Detail Proyek */}
      <div className="mb-6 w-full max-w-lg">
        <table className="text-xs">
          <tbody>
            <tr><td className="pr-4 py-0.5 font-semibold">Proyek</td><td className="pr-2">:</td><td>{project.project_name}</td></tr>
            <tr><td className="pr-4 py-0.5 font-semibold">Lokasi</td><td className="pr-2">:</td><td>{project.location}</td></tr>
            <tr><td className="pr-4 py-0.5 font-semibold">Pemilik</td><td className="pr-2">:</td><td>{project.customer_name}</td></tr>
            <tr><td className="pr-4 py-0.5 font-semibold">Tahun</td><td className="pr-2">:</td><td>{projectYear}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Tabel Utama RAB */}
      <table className="w-full text-xs border-collapse border border-black">
        <thead className="bg-gray-200 text-black">
          <tr className="font-bold">
            <th className="p-2 border border-black w-12 text-center">NO.</th>
            <th className="p-2 border border-black text-left">URAIAN PEKERJAAN</th>
            <th className="p-2 border border-black w-36 text-center">JUMLAH HARGA (Rp)</th>
            <th className="p-2 border border-black w-36 text-center">SUB TOTAL (Rp)</th>
          </tr>
        </thead>
        <tbody>
          {/* Uraian Pekerjaan */}
          {Object.entries(groupedWorkItems).map(([category, data], index) => (
            <React.Fragment key={category}>
              <tr className="font-bold bg-gray-100">
                <td className="p-2 border border-black text-center">{toRoman(index + 1)}</td>
                <td className="p-2 border border-black">{category}</td>
                <td className="p-2 border border-black"></td>
                <td className="p-2 border border-black text-right">{formatCurrency(data.subtotal)}</td>
              </tr>
              {data.items.map((item, subIndex) => (
                <tr key={item.id}>
                  <td className="p-2 border border-black"></td>
                  <td className="p-2 border border-black pl-8">{`${subIndex + 1}. ${item.definition_name_snapshot}`}</td>
                  <td className="p-2 border border-black text-right">{formatCurrency(parseFloat(item.total_item_cost_snapshot))}</td>
                  <td className="p-2 border border-black"></td>
                </tr>
              ))}
            </React.Fragment>
          ))}
          
          {/* Biaya Lain-lain (jika ada) */}
          {biayaLainLainEntries.length > 0 && (
            <React.Fragment>
                <tr className="font-bold bg-gray-100">
                    <td className="p-2 border border-black text-center">{toRoman(Object.keys(groupedWorkItems).length + 1)}</td>
                    <td className="p-2 border border-black">BIAYA LAIN-LAIN</td>
                    <td className="p-2 border border-black"></td>
                    <td className="p-2 border border-black text-right">{formatCurrency(totalBiayaLainLain)}</td>
                </tr>
                {/* BARU: Loop untuk merinci setiap item biaya lain-lain */}
                {biayaLainLainEntries.map((item, subIndex) => (
                    <tr key={item.id}>
                        <td className="p-2 border border-black"></td>
                        <td className="p-2 border border-black pl-8">{`${subIndex + 1}. ${item.description}`}</td>
                        <td className="p-2 border border-black text-right">{formatCurrency(parseFloat(item.amount))}</td>
                        <td className="p-2 border border-black"></td>
                    </tr>
                ))}
            </React.Fragment>
          )}
        </tbody>
        <tfoot className="font-bold">
            <tr className="bg-gray-100">
                <td colSpan="3" className="p-2 border border-black text-left">Jumlah (A) Uraian Pekerjaan</td>
                <td className="p-2 border border-black text-right">{formatCurrency(jumlahTotalPekerjaan)}</td>
            </tr>
            {biayaLainLainEntries.length > 0 && (
              <tr className="bg-gray-100">
                  <td colSpan="3" className="p-2 border border-black text-left">Jumlah (B) Biaya Lain-lain</td>
                  <td className="p-2 border border-black text-right">{formatCurrency(totalBiayaLainLain)}</td>
              </tr>
            )}
            <tr className="bg-gray-200">
                <td colSpan="3" className="p-2 border border-black text-left">Jumlah Total</td>
                <td className="p-2 border border-black text-right">{formatCurrency(jumlahTotalAkhir)}</td>
            </tr>
             <tr className="bg-gray-200">
                <td colSpan="3" className="p-2 border border-black text-left">Dibulatkan</td>
                <td className="p-2 border border-black text-right">{formatCurrency(dibulatkan)}</td>
            </tr>
        </tfoot>
      </table>
      
      {/* Bagian Terbilang */}
      <div className="mt-4 p-2 border border-black bg-gray-200">
        <span className="font-bold">Terbilang : </span>
        <span className="italic">{terbilangFormatted}</span>
      </div>

    </div>
  );
});

ProjectReport.displayName = 'ProjectReport';
export default ProjectReport;