// src/components/ArchivedProjectsView.js
import React from 'react';
import { Briefcase, Info, Loader2, RotateCcw } from 'lucide-react'; // RotateCcw for Unarchive
import { formatCurrency } from '../utils/helpers';

const ArchivedProjectsView = React.memo(({
    archivedProjects,
    isLoading, // Pass this from App.js if specific to this view loading
    handleUnarchiveProject,
    handleSelectProject, // Optional: if you allow viewing details of archived projects
    currentProjectId      // Optional: for highlighting
}) => {
    if (isLoading) {
        return <div className="text-center p-4 text-slate-400"><Loader2 className="animate-spin inline-block mr-2" />Loading archived projects...</div>;
    }

    if (!archivedProjects || archivedProjects.length === 0) {
        return (
            <div className="p-6 bg-slate-700 rounded-lg text-center text-slate-300">
                <Info size={24} className="mx-auto mb-2 text-sky-500"/>
                No archived projects found.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-semibold text-sky-400 flex items-center">
                    <Briefcase size={30} className="mr-3"/>Archived Projects
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {archivedProjects.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at)).map(proj => ( // Sort by last updated
                    <div
                        key={proj.id}
                        className={`p-6 rounded-lg shadow-xl transition-all duration-200 ease-in-out relative bg-slate-800/70 border border-slate-700
                                    ${currentProjectId === proj.id ? 'ring-2 ring-amber-400' : 'hover:bg-slate-700/70'}`}
                        // onClick={() => handleSelectProject && handleSelectProject(proj.id)} // Only if viewing is enabled
                    >
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-semibold text-slate-300 mb-2">{proj.project_name}</h3>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleUnarchiveProject(proj.id); }}
                                className="p-2 text-green-400 hover:text-green-300 transition-colors flex items-center text-sm bg-slate-700 hover:bg-slate-600 rounded"
                                title="Unarchive Project"
                            >
                                <RotateCcw size={16} className="mr-1"/> Unarchive
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">Budget: {formatCurrency(proj.total_calculated_budget || 0)}</p>
                        <p className={`text-sm font-medium mb-1 ${ (proj.actual_income || 0) - (proj.actual_expenses || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            Net Cash Flow: {formatCurrency((proj.actual_income || 0) - (proj.actual_expenses || 0))}
                        </p>
                        <p className="text-xs text-slate-600">Archived (Last activity: {new Date(proj.updated_at).toLocaleDateString('id-ID')})</p>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default ArchivedProjectsView;