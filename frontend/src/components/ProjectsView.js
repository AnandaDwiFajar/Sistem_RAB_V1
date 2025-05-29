// src/components/ProjectsView.js
import React from 'react';
import { Briefcase, PlusCircle, Save, XCircle, Info, Archive } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

// Import the child components
import ProjectWorkItemsView from './ProjectWorkItemsView';
import ProjectCashFlowView from './ProjectCashFlowView';
import CurrentProjectDetailsHeader from './CurrentProjectDetailsHeader';

const ProjectsView = ({
    projects,
    currentProjectId,
    currentProject,
    showProjectForm,
    setShowProjectForm,
    projectFormData,
    handleProjectFormChange,
    handleSaveProject,
    isSavingProject,
    isLoading,
    handleSelectProject,
    handleDeleteProject,
    setShowManageCashFlowCategoriesModal,
    handleArchiveProject,
    setCurrentView, // For navigating to Archived Projects view
    // Props for CurrentProjectDetailsHeader
    handleFetchProjectInsights,
    isFetchingProjectInsights,
    setShowInsightsModal,
    currentProjectView,       // For tabs within a selected project (Work Items / Cash Flow)
    setCurrentProjectView,    // Setter for tabs within a selected project
    // Props for ProjectWorkItemsView
    showWorkItemForm,
    setShowWorkItemForm,
    workItemFormData,
    handleWorkItemFormChange,
    handleCashFlowFormChange,
    // handleWorkItemFormChange is passed to ProjectWorkItemsView
    userWorkItemTemplates,
    userWorkItemCategories,
    calculatedWorkItemPreview,
    setCalculatedWorkItemPreview,
    handleAddWorkItemToProject,
    isAddingWorkItem,
    handleDeleteWorkItem,
    // Props for ProjectCashFlowView
    showCashFlowForm,
    setShowCashFlowForm,
    cashFlowFormData,
    setCashFlowFormData,
    // handleCashFlowFormChange is passed to ProjectCashFlowView
    userCashFlowCategories,
    editingCashFlowEntry,
    setEditingCashFlowEntry,
    handleSaveCashFlowEntry,
    isSavingCashFlowEntry,
    handleEditCashFlowEntry,
    handleDeleteCashFlowEntry,
}) => {

    return (
        <div className="space-y-6">
            {/* Section for Creating a New Project & Viewing Archived */}
            <div className="flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-3xl font-semibold text-sky-400 flex items-center">
                    <Briefcase size={30} className="mr-3"/>My Projects
                </h2>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setCurrentView('archivedProjects')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-md shadow-md flex items-center transition-all duration-150 ease-in-out transform hover:scale-105"
                    >
                        <Archive size={20} className="mr-2"/> View Archived
                    </button>
                    <button
                        onClick={() => { setShowProjectForm(!showProjectForm); if(projectFormData.projectName && handleProjectFormChange) handleProjectFormChange({target: {name: 'projectName', value: ''}});}}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md shadow-md flex items-center transition-all duration-150 ease-in-out transform hover:scale-105"
                    >
                        <PlusCircle size={20} className="mr-2"/> {showProjectForm ? 'Cancel Creation' : 'Create New Project'}
                    </button>
                </div>
            </div>

            {/* Create New Project Form */}
            {showProjectForm && (
                <div className="p-6 bg-slate-700 rounded-lg shadow-lg space-y-4 animate-fadeIn">
                    <h3 className="text-xl font-medium text-white">Create New Project</h3>
                    <input
                        type="text"
                        name="projectName"
                        value={projectFormData.projectName}
                        onChange={handleProjectFormChange}
                        placeholder="Project Name (e.g., Rumah Tinggal Pak Budi)"
                        className="w-full p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                    <div className="flex justify-end space-x-3">
                        <button onClick={() => { setShowProjectForm(false); }} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors">Cancel</button>
                        <button onClick={handleSaveProject} disabled={isSavingProject} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center transition-colors disabled:opacity-50">
                            <Save size={18} className="mr-2"/> {isSavingProject ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </div>
            )}

            {/* Section for Listing Active Projects */}
            {isLoading && projects.length === 0 && !showProjectForm && (
                <div className="text-center p-4 text-slate-400">Loading projects...</div>
            )}
            {!isLoading && projects.length === 0 && !showProjectForm && (
                <div className="p-6 bg-slate-700 rounded-lg text-center text-slate-300">
                    <Info size={24} className="mx-auto mb-2 text-sky-500"/>
                    No active projects found. Create one or check the archive.
                </div>
            )}

            {projects.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(proj => (
                        // The 'projects' prop should ideally only contain active projects from App.js
                        // The check !proj.is_archived is a safeguard if it might contain mixed data.
                        !proj.is_archived && (
                            <div
                                key={proj.id}
                                className={`p-6 rounded-lg shadow-xl cursor-pointer transition-all duration-200 ease-in-out relative ${currentProjectId === proj.id ? 'bg-sky-700 ring-2 ring-sky-400 scale-105' : 'bg-slate-700 hover:bg-slate-600/70'}`}
                                onClick={() => handleSelectProject(proj.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-semibold text-white mb-2 truncate" title={proj.project_name}>{proj.project_name}</h3>
                                    <div className="flex space-x-1 flex-shrink-0">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleArchiveProject(proj.id); }}
                                            className="p-1 text-amber-400 hover:text-amber-300 transition-colors opacity-70 hover:opacity-100"
                                            title="Archive Project"
                                        >
                                            <Archive size={18}/>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj.id); }}
                                            className="p-1 text-red-400 hover:text-red-300 transition-colors opacity-70 hover:opacity-100"
                                            title="Delete Project"
                                        >
                                            <XCircle size={20}/>
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-400 mb-1">Budget: {formatCurrency(proj.total_calculated_budget || 0)}</p>
                                <p className={`text-sm font-medium mb-1 ${ (proj.actual_income || 0) - (proj.actual_expenses || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    Net Cash Flow: {formatCurrency((proj.actual_income || 0) - (proj.actual_expenses || 0))}
                                </p>
                                <p className="text-xs text-slate-500">Created: {new Date(proj.created_at).toLocaleDateString('id-ID')}</p>
                                {currentProjectId === proj.id && <div className="absolute top-2 right-2 h-3 w-3 bg-green-400 rounded-full animate-pulse" title="Selected"></div>}
                            </div>
                        )
                    ))}
                </div>
            )}

            {/* Section for Displaying Selected Project Details */}
            {currentProject && (
                <div className="mt-8 p-6 bg-slate-700/50 rounded-lg shadow-inner space-y-6 animate-fadeIn">
                    <CurrentProjectDetailsHeader
                        currentProject={currentProject}
                        isFetchingProjectInsights={isFetchingProjectInsights}
                        handleFetchProjectInsights={handleFetchProjectInsights}
                        setShowInsightsModal={setShowInsightsModal}
                        currentProjectView={currentProjectView}
                        setCurrentProjectView={setCurrentProjectView} // This is for tabs WITHIN the project
                    />
                    {currentProject.is_archived ? (
                        <div className="p-6 bg-slate-800/60 border border-amber-600 rounded-lg text-center text-amber-400">
                            <Info size={32} className="mx-auto mb-3 text-amber-500"/>
                            <h4 className="text-xl font-semibold mb-2">Project Archived</h4>
                            <p className="text-slate-300">This project is currently archived.</p>
                            <p className="text-slate-400 text-sm mt-1">Unarchive it from the "Archived Projects" page to make further changes or view details.</p>
                        </div>
                    ) : (
                        <>
                            {currentProjectView === 'workItems' &&
                                <ProjectWorkItemsView
                                    currentProject={currentProject}
                                    showWorkItemForm={showWorkItemForm}
                                    setShowWorkItemForm={setShowWorkItemForm}
                                    workItemFormData={workItemFormData}
                                    handleWorkItemFormChange={handleWorkItemFormChange}
                                    userWorkItemTemplates={userWorkItemTemplates}
                                    userWorkItemCategories={userWorkItemCategories}
                                    calculatedWorkItemPreview={calculatedWorkItemPreview}
                                    setCalculatedWorkItemPreview={setCalculatedWorkItemPreview}
                                    handleAddWorkItemToProject={handleAddWorkItemToProject}
                                    isAddingWorkItem={isAddingWorkItem}
                                    handleDeleteWorkItem={handleDeleteWorkItem}
                                />
                            }
                            {currentProjectView === 'cashFlow' &&
                                <ProjectCashFlowView
                                    currentProject={currentProject}
                                    showCashFlowForm={showCashFlowForm}
                                    setShowCashFlowForm={setShowCashFlowForm}
                                    cashFlowFormData={cashFlowFormData}
                                    setCashFlowFormData={setCashFlowFormData}
                                    handleCashFlowFormChange={handleCashFlowFormChange}
                                    userCashFlowCategories={userCashFlowCategories}
                                    editingCashFlowEntry={editingCashFlowEntry}
                                    setEditingCashFlowEntry={setEditingCashFlowEntry}
                                    handleSaveCashFlowEntry={handleSaveCashFlowEntry}
                                    isSavingCashFlowEntry={isSavingCashFlowEntry}
                                    handleEditCashFlowEntry={handleEditCashFlowEntry}
                                    handleDeleteCashFlowEntry={handleDeleteCashFlowEntry}
                                    setShowManageCashFlowCategoriesModal={setShowManageCashFlowCategoriesModal}
                                />
                            }
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// Wrapping with React.memo for performance, assuming props from App.js are stable (e.g., functions wrapped in useCallback)
export default React.memo(ProjectsView);
