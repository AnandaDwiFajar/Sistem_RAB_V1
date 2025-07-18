import React from 'react';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Briefcase, Download, BrainCircuit, List, LineChart, User, MapPin, Calendar, Award, DollarSign, Target, Percent, FileText, Loader2 } from 'lucide-react';

const StatCard = ({ icon, label, value, colorClass = 'text-industrial-accent' }) => {
    const IconComponent = icon;
    return (
        <div className="bg-white p-4 rounded-lg border border-industrial-gray-light shadow-sm flex items-start">
            <div className={`mr-4 mt-1 ${colorClass}`}>
                <IconComponent size={24} />
            </div>
            <div>
                <p className="text-sm text-industrial-gray-dark font-medium">{label}</p>
                <p className="text-xl font-bold text-industrial-dark">{value}</p>
            </div>
        </div>
    );
};

const CurrentProjectDetailsHeader = React.memo(({
    userRole,
    currentProject,
    isFetchingProjectInsights,
    handleFetchProjectInsights,
    currentProjectView,
    setCurrentProjectView,
    handleGenerateProjectReport,
    isGeneratingReport,
}) => {
    if (!currentProject) return null;

    const projectPrice = parseFloat(currentProject.project_price) || 0;
    const totalBudgetPlanCost = parseFloat(currentProject.total_budget_plan_cost) || 0;
    const estimatedProfit = projectPrice - totalBudgetPlanCost;
    const profitMargin = projectPrice > 0 ? (estimatedProfit / projectPrice) * 100 : 0;
    
    const navButtonStyle = (view) =>
    `px-4 py-2 text-sm font-semibold rounded-md flex items-center transition-colors ${
      currentProjectView === view ? 'bg-industrial-accent text-white shadow-md' : 'bg-white text-industrial-dark hover:bg-gray-100 border border-industrial-gray-light'
    }`;


    return (
        <div className="space-y-6">
            {/* Project Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-industrial-gray-light">
                    <User size={20} className="mr-3 text-industrial-gray-dark" />
                    <div>
                        <p className="text-xs text-industrial-gray">Pelanggan</p>
                        <p className="font-semibold text-industrial-dark">{currentProject.customer_name || '-'}</p>
                    </div>
                </div>
                <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-industrial-gray-light">
                    <MapPin size={20} className="mr-3 text-industrial-gray-dark" />
                    <div>
                        <p className="text-xs text-industrial-gray">Lokasi</p>
                        <p className="font-semibold text-industrial-dark">{currentProject.location || '-'}</p>
                    </div>
                </div>
                <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-industrial-gray-light col-span-1 lg:col-span-2">
                    <Calendar size={20} className="mr-3 text-industrial-gray-dark" />
                    <div>
                        <p className="text-xs text-industrial-gray">Periode Proyek</p>
                        <p className="font-semibold text-industrial-dark">
                            {formatDate(currentProject.start_date)} → {formatDate(currentProject.due_date)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Financial Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard icon={Award} label="Nilai Proyek" value={formatCurrency(projectPrice)} colorClass="text-green-600" />
                <StatCard icon={Target} label="Total RAB" value={formatCurrency(totalBudgetPlanCost)} colorClass="text-red-600" />
                <StatCard icon={DollarSign} label="Estimasi Keuntungan" value={formatCurrency(estimatedProfit)} colorClass={estimatedProfit >= 0 ? "text-blue-600" : "text-red-600"} />
                <StatCard icon={Percent} label="Margin Keuntungan" value={`${profitMargin.toFixed(1)}%`} colorClass={profitMargin >= 0 ? "text-blue-600" : "text-red-600"} />
            </div>

            {/* Navigation Tabs */}
            <div className="border-t border-industrial-gray-light pt-4 flex justify-between items-center">
                <div className="flex space-x-2">
                    <button onClick={() => setCurrentProjectView('workItems')} className={navButtonStyle('workItems')}>
                        <Briefcase size={16} className="mr-2"/> Daftar Pekerjaan
                    </button>
                    <button onClick={() => setCurrentProjectView('cashFlow')} className={navButtonStyle('cashFlow')}>
                        <DollarSign size={16} className="mr-2"/> Biaya Lain-Lain
                    </button>
                </div>
                <button
                    onClick={() => handleGenerateProjectReport(currentProject.id)}
                    className="bg-industrial-accent text-white hover:bg-industrial-accent/90 font-bold py-2 px-4 rounded-md flex items-center transition-all duration-300 disabled:bg-gray-400"
                    disabled={isGeneratingReport}
                >
                    {isGeneratingReport ? (
                        <>
                            <Loader2 className="animate-spin mr-2" size={16} />
                            Membuat PDF...
                        </>
                    ) : (
                        <>
                            <FileText size={16} className="mr-2" />
                            Buat Dokumen RAB
                        </>
                    )}
                </button>
            </div>
        </div>
    );
});

export default CurrentProjectDetailsHeader;