// src/components/CurrentProjectDetailsHeader.js
import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const CurrentProjectDetailsHeader = React.memo(({
    currentProject,
    isFetchingProjectInsights,
    handleFetchProjectInsights,
    setShowInsightsModal,
    currentProjectView,
    setCurrentProjectView
}) => {
    if (!currentProject) return null; // Should be wrapped in a conditional in parent anyway

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-slate-600 pb-4 mb-4">
                <div>
                    <h3 className="text-2xl font-semibold text-sky-300">Project: {currentProject.project_name}</h3>
                    <p className="text-lg text-slate-400">Budgeted Total: {formatCurrency(currentProject.total_calculated_budget || 0)}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
                    <button
                        onClick={() => { handleFetchProjectInsights(); setShowInsightsModal(true); }}
                        disabled={isFetchingProjectInsights}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md shadow-md flex items-center justify-center transition-all duration-150 ease-in-out transform hover:scale-105 disabled:opacity-60"
                    >
                        {isFetchingProjectInsights ? <Loader2 size={20} className="mr-2 animate-spin"/> : <Sparkles size={20} className="mr-2"/>}
                        {isFetchingProjectInsights ? 'Getting Insights...' : '✨ Get Project Insights'}
                    </button>
                </div>
            </div>
            <div className="flex space-x-1 border-b border-slate-600 mb-6">
                <button onClick={() => setCurrentProjectView('workItems')} className={`px-4 py-2 rounded-t-md text-sm font-medium ${currentProjectView === 'workItems' ? 'bg-slate-700 text-sky-400 border-slate-600 border-t border-x' : 'text-slate-400 hover:text-sky-300'}`}>Work Items & Budget</button>
                <button onClick={() => setCurrentProjectView('cashFlow')} className={`px-4 py-2 rounded-t-md text-sm font-medium ${currentProjectView === 'cashFlow' ? 'bg-slate-700 text-sky-400 border-slate-600 border-t border-x' : 'text-slate-400 hover:text-sky-300'}`}>Cash Flow</button>
            </div>
        </>
    );
});

export default CurrentProjectDetailsHeader;