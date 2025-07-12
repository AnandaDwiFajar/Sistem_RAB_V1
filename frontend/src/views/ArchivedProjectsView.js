// src/components/ArchivedProjectsView.js
import React from 'react';
import { Briefcase, Info, Loader2, RotateCcw } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const ArchivedProjectsView = React.memo(({
    archivedProjects,
    isLoading,
    handleUnarchiveProject,
    handleSelectProject,
    currentProjectId
}) => {
    if (isLoading) {
        return <div className="text-center p-4 text-gray-500"><Loader2 className="animate-spin inline-block mr-2" />Memuat proyek yang diarsip...</div>;
    }

    if (!archivedProjects || archivedProjects.length === 0) {
        return (
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
                <Info size={24} className="mx-auto mb-2 text-sky-500"/>
                Tidak ada proyek yang diarsip ditemukan.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-semibold text-sky-600 flex items-center">
                    <Briefcase size={30} className="mr-3"/>Proyek yang Diarsipkan
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {archivedProjects.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at)).map(proj => (
                    <div
                        key={proj.id}
                        className={`p-6 rounded-lg shadow-lg transition-all duration-200 ease-in-out relative bg-white border border-gray-200
                                    ${currentProjectId === proj.id ? 'ring-2 ring-amber-500' : 'hover:shadow-xl hover:border-gray-300'}`}
                    >
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">{proj.project_name}</h3>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleUnarchiveProject(proj.id); }}
                                className="p-2 text-green-600 hover:text-green-700 transition-colors flex items-center text-sm bg-green-100 hover:bg-green-200 rounded-md shadow-sm"
                                title="Keluarkan dari Arsip"
                            >
                                <RotateCcw size={16} className="mr-1.5"/> Keluarkan dari Arsip
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">Anggaran: {formatCurrency(proj.direct_cost_estimate || 0)}</p>
                        <p className={`text-sm font-medium mb-1 ${ (proj.actual_income || 0) - (proj.actual_expenses || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Arus Kas Bersih: {formatCurrency((proj.actual_income || 0) - (proj.actual_expenses || 0))}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Diarsip (Aktivitas terakhir: {new Date(proj.updated_at).toLocaleDateString('id-ID')})</p>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default ArchivedProjectsView;