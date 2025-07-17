import React from 'react';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Download, BrainCircuit, List, LineChart, User, MapPin, Calendar, Award, DollarSign, Target, Percent } from 'lucide-react';

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

            {userRole === 'admin' && (
                <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-industrial-gray-light">
                    {/* Tabs */}
                    <div className="flex space-x-2 mb-4 sm:mb-0">
                        <button
                            onClick={() => setCurrentProjectView('workItems')}
                            className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center transition-colors ${
                                currentProjectView === 'workItems' ? 'bg-industrial-accent text-white shadow-sm' : 'text-industrial-dark hover:bg-gray-100'
                            }`}
                        >
                            <List size={16} className="mr-2" />
                            Uraian Pekerjaan
                        </button>
                        <button
                            onClick={() => setCurrentProjectView('cashFlow')}
                            className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center transition-colors ${
                                currentProjectView === 'cashFlow' ? 'bg-industrial-accent text-white shadow-sm' : 'text-industrial-dark hover:bg-gray-100'
                            }`}
                        >
                            <LineChart size={16} className="mr-2" />
                            Biaya Lain-Lain
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3">
                        <button onClick={handleFetchProjectInsights} disabled={isFetchingProjectInsights} className="flex items-center px-4 py-2 text-sm font-medium text-industrial-accent border border-industrial-accent rounded-md hover:bg-industrial-accent hover:text-white disabled:bg-industrial-gray-light disabled:text-industrial-gray disabled:border-industrial-gray-light transition-colors">
                            <BrainCircuit size={16} className="mr-2"/>
                            {isFetchingProjectInsights ? 'Menganalisis...' : 'AI Insights'}
                        </button>
                        <button onClick={handleGenerateProjectReport} disabled={isGeneratingReport} className="flex items-center px-4 py-2 text-sm font-medium text-industrial-accent border border-industrial-accent rounded-md hover:bg-industrial-accent hover:text-white disabled:bg-industrial-gray-light disabled:text-industrial-gray disabled:border-industrial-gray-light transition-colors">
                            <Download size={16} className="mr-2"/>
                            {isGeneratingReport ? 'Membuat...' : 'Dokumen RAB'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

export default CurrentProjectDetailsHeader;