// src/components/CurrentProjectDetailsHeader.js (SUDAH DIREVISI)

import React from 'react';
import { formatCurrency } from '../utils/helpers';
// DIUBAH: Menambahkan ikon-ikon baru untuk detail proyek
import { 
    Download, BrainCircuit, List, LineChart, User, MapPin, Calendar, Award 
} from 'lucide-react';

// BARU: Helper kecil untuk memformat tanggal agar lebih mudah dibaca
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Mengonversi tanggal dari format YYYY-MM-DD ke format lokal Indonesia
    const date = new Date(dateString.split('T')[0].replace(/-/g, '/'));
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};


const CurrentProjectDetailsHeader = React.memo(({
 userRole,
currentProject,
 isFetchingProjectInsights,
handleFetchProjectInsights,
setShowInsightsModal,
 currentProjectView,
 setCurrentProjectView,
 handleGenerateProjectReport,
 isGeneratingReport, 
}) => {
    const parsedProjectPrice = parseFloat(currentProject.project_price);
    const parsedTotalBudget = parseFloat(currentProject.direct_cost_estimate);
    const total_budget_plan_cost = parseFloat(currentProject.total_budget_plan_cost);
    const projectPrice = isNaN(parsedProjectPrice) ? 0 : parsedProjectPrice;
    const estimatedProfit = projectPrice - total_budget_plan_cost;   
 if (!currentProject) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4">
        <div className="mb-4 md:mb-0">
          <h2 className="text-3xl font-bold text-gray-800" title={currentProject.project_name}>
{currentProject.project_name}
          </h2>
        </div>
                {(userRole === 'admin') && (
                    <div className="flex items-center space-x-3">
                        <button onClick={handleFetchProjectInsights} disabled={isFetchingProjectInsights} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 transition-colors">
                            <BrainCircuit size={16} className="mr-2"/>
                            {isFetchingProjectInsights ? 'Menganalisis...' : 'Get AI Insights'}
                        </button>
                        <button onClick={handleGenerateProjectReport} disabled={isGeneratingReport} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                            <Download size={16} className="mr-2"/>
                            {isGeneratingReport ? 'Membuat...' : 'Buat Dokumen RAB'}
                        </button>
                    </div>
                )}
      </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-start">
                    <Award size={20} className="mr-3 mt-1 text-green-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-gray-500">Nilai Proyek</p>
                        <p className="text-lg font-semibold text-gray-800">
                            {formatCurrency(currentProject.project_price || 0)}
                        </p>
                    </div>
                </div>
                <div className="flex items-start">
                    <User size={20} className="mr-3 mt-1 text-blue-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-gray-500">Pelanggan</p>
                        <p className="text-lg font-semibold text-gray-800">
                            {currentProject.customer_name || '-'}
                        </p>
                    </div>
                </div>
                <div className="flex items-start">
                    <MapPin size={20} className="mr-3 mt-1 text-red-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-gray-500">Lokasi</p>
                        <p className="text-lg font-semibold text-gray-800">
                            {currentProject.location || '-'}
                        </p>
                    </div>
                </div>
                
                {/* Periode Proyek */}
                <div className="flex items-start">
                    <Calendar size={20} className="mr-3 mt-1 text-amber-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-gray-500">Periode</p>
                        <p className="text-lg font-semibold text-gray-800">
                            {formatDate(currentProject.start_date)} → {formatDate(currentProject.due_date)}
                        </p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-red-100 rounded-lg shadow">
                                <h5 className="text-sm text-red-700 font-medium">Estimasi Biaya Langsung</h5>
                                <p className="text-2xl font-bold text-red-800">{formatCurrency(parsedTotalBudget)}</p>
                            </div>
                            <div className="p-4 bg-red-100 rounded-lg shadow">
                                <h5 className="text-sm text-red-700 font-medium">Total Rencana Anggaran Biaya (Total RAB)</h5>
                                <p className="text-2xl font-bold text-red-800">{formatCurrency(total_budget_plan_cost)}</p>
                            </div>
                            <div className="p-4 bg-sky-100 rounded-lg shadow">
                                <h5 className="text-sm text-sky-700 font-medium">Estimasi Keuntungan</h5>
                                <p className={`text-2xl font-bold ${estimatedProfit >= 0 ? 'text-sky-800' : 'text-red-700'}`}>
                                    {formatCurrency(estimatedProfit)}
                                </p>
                            </div>
                </div>

      {/* --- DIUBAH: Bagian Tab sekarang hanya muncul untuk admin --- */}
            {(userRole === 'admin') && (
                <div className="flex space-x-2 border-b border-gray-200">
                    <button
                        onClick={() => setCurrentProjectView('workItems')}
                        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors flex items-center ${
                            currentProjectView === 'workItems' ? 'border-b-2 border-sky-500 text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-sky-600 hover:bg-gray-100'
                        }`}
                    >
                        <List size={16} className="inline-block mr-2" />
                        Uraian Pekerjaan
                    </button>
                    <button
                        onClick={() => setCurrentProjectView('cashFlow')}
                        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors flex items-center ${
                            currentProjectView === 'cashFlow' ? 'border-b-2 border-sky-500 text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-sky-600 hover:bg-gray-100'
                        }`}
                    >
                        <LineChart size={16} className="inline-block mr-2" />
                        Biaya Lain-Lain
                    </button>
                </div>
            )}
    </div>
  );
});

export default CurrentProjectDetailsHeader;