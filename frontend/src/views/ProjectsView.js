import React from 'react';
import { Briefcase, PlusCircle, Save, XCircle, Info, Archive, Download, Edit3 } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

// Import the child components
import ProjectWorkItemsView from './ProjectWorkItemsView';
import ProjectCashFlowView from './ProjectCashFlowView';
import CurrentProjectDetailsHeader from './CurrentProjectDetailsHeader';

const ProjectsView = ({
    projectsManager,
    definitionsManager = {}, // Default value is good practice
    userRole,
    userWorkItemCategories,
    cashFlowCategories,
    setCurrentView,
    setShowManageCashFlowCategoriesModal
}) => {
    // Destrukturisasi semua state dan handler dari projectsManager
    const {
        projects,
        currentProjectId,
        currentProject,
        isLoading,
        isDetailLoading,
        showProjectForm,
        setShowProjectForm,
        isSavingProject,
        showWorkItemForm,
        setShowWorkItemForm,
        workItemFormData,
        calculatedWorkItemPreview,
        setCalculatedWorkItemPreview,
        isAddingWorkItem,
        showCashFlowForm,
        setShowCashFlowForm,
        cashFlowFormData,
        setCashFlowFormData,
        editingCashFlowEntry,
        setEditingCashFlowEntry,
        isSavingCashFlowEntry,
        handleSelectProject,
        handleDeleteProject,
        handleArchiveProject,
        handleFetchProjectInsights,
        isFetchingProjectInsights,
        setShowInsightsModal,
        currentProjectView,
        setCurrentProjectView,
        handleGenerateProjectReport,
        isGeneratingReport,
        handleDeleteWorkItem,
        handleSaveCashFlowEntry,
        handleEditCashFlowEntry,
        handleDeleteCashFlowEntry,
        handleWorkItemFormChange,
        handleCashFlowFormChange,
        handleDeleteCashFlowCategory,
        handleStartEditProject,
        // --- TAMBAHKAN FUNGSI DAN STATE BARU DARI MANAGER ---
        handleSaveWorkItem, // Ini menggantikan handleAddWorkItemToProject
        handleStartEditWorkItem,
        handleCancelEditWorkItem,
        editingWorkItemId,
        isUpdatingWorkItem,
    } = projectsManager;

    const { userWorkItemTemplates } = definitionsManager;
    return (
        <div className="space-y-6">
            {/* --- Header dan Tombol Aksi Utama --- */}
            <div className="flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-3xl font-semibold text-sky-600 flex items-center">
                    <Briefcase size={30} className="mr-3"/>Proyek Saya
                </h2>
                <div className="flex space-x-3">
                    {userRole === 'admin' && (
                        <button
                            onClick={() => setCurrentView('archivedProjects')}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md shadow-md flex items-center"
                        >
                            <Archive size={20} className="mr-2"/> Lihat Arsip
                        </button>
                    )}
                    <button
                        onClick={() => handleStartEditProject(null)}
                        className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md shadow-md flex items-center"
                    >
                        <PlusCircle size={20} className="mr-2"/> Buat Proyek Baru
                    </button>
                </div>
            </div>

            {/* --- Daftar Kartu Proyek --- */}
            {isLoading && projects.length === 0 && (
                <div className="text-center p-4 text-gray-500">Memuat Proyek...</div>
            )}
            {!isLoading && projects.length === 0 && (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
                    <Info size={24} className="mx-auto mb-2 text-sky-500"/>
                    Tidak ada proyek aktif. Buat proyek baru atau periksa arsip.
                </div>
            )}
            {projects.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(proj => (
                    <div
                        key={proj.id}
                        className={`p-6 rounded-lg shadow-lg cursor-pointer transition-all duration-200 relative ${currentProjectId === proj.id ? 'bg-sky-50 border-2 border-sky-400 scale-105' : 'bg-white border border-gray-200 hover:shadow-xl'}`}
                        onClick={() => handleSelectProject(proj.id)}
                    >
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2 truncate" title={proj.project_name}>{proj.project_name}</h3>
                            {userRole === 'admin' && (
                                <div className="flex space-x-1 flex-shrink-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleStartEditProject(proj.id); }}
                                        className="p-1 text-sky-500 hover:text-sky-600"
                                        title="Edit Proyek"
                                    >
                                        <Edit3 size={18}/>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleArchiveProject(proj.id); }} className="p-1 text-amber-500 hover:text-amber-600" title="Arsipkan Proyek">
                                        <Archive size={18}/>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj.id); }} className="p-1 text-red-500 hover:text-red-600" title="Hapus Proyek">
                                        <XCircle size={20}/>
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-400">Dibuat: {new Date(proj.created_at).toLocaleDateString('id-ID')}</p>
                        {currentProjectId === proj.id && <div className="absolute top-2 right-2 h-3 w-3 bg-sky-500 rounded-full animate-pulse" title="Selected"></div>}
                    </div>
                ))}
                </div>
            )}

            {/* --- Detail Proyek yang Dipilih --- */}
            {currentProject && (
                <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow-inner space-y-6 animate-fadeIn">
                    <CurrentProjectDetailsHeader
                        userRole={userRole}
                        currentProject={currentProject}
                        isFetchingProjectInsights={isFetchingProjectInsights}
                        handleFetchProjectInsights={handleFetchProjectInsights}
                        setShowInsightsModal={setShowInsightsModal}
                        currentProjectView={currentProjectView}
                        setCurrentProjectView={setCurrentProjectView}
                        handleGenerateProjectReport={handleGenerateProjectReport}
                        isGeneratingReport={isGeneratingReport}
                        />
                {currentProject.is_archived ? (
                    <div className="p-6 bg-amber-50 border border-amber-300 rounded-lg text-center text-amber-700">
                         <Info size={32} className="mx-auto mb-3 text-amber-600"/>
                         <h4 className="text-xl font-semibold mb-2">Proyek diarsip</h4>
                         <p className="text-amber-600">Proyek ini telah diarsip.</p>
                         <p className="text-amber-500 text-sm mt-1">Anda bisa memulihkannya dari halaman Arsip.</p>
                     </div>
                ) : (
                    <>
                        {(userRole === 'admin') ? (
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
                                        isAddingWorkItem={isAddingWorkItem}
                                        handleDeleteWorkItem={handleDeleteWorkItem}
                                        // --- PERUBAHAN DI SINI: TERUSKAN SEMUA PROPS YANG BENAR ---
                                        handleSaveWorkItem={handleSaveWorkItem}
                                        handleStartEditWorkItem={handleStartEditWorkItem}
                                        handleCancelEditWorkItem={handleCancelEditWorkItem}
                                        editingWorkItemId={editingWorkItemId}
                                        isUpdatingWorkItem={isUpdatingWorkItem}
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
                                        userCashFlowCategories={cashFlowCategories}
                                        editingCashFlowEntry={editingCashFlowEntry}
                                        setEditingCashFlowEntry={setEditingCashFlowEntry}
                                        handleSaveCashFlowEntry={handleSaveCashFlowEntry}
                                        isSavingCashFlowEntry={isSavingCashFlowEntry}
                                        handleEditCashFlowEntry={handleEditCashFlowEntry}
                                        handleDeleteCashFlowEntry={handleDeleteCashFlowEntry}
                                        handleDeleteCashFlowCategory={handleDeleteCashFlowCategory}
                                        setShowManageCashFlowCategoriesModal={setShowManageCashFlowCategoriesModal}
                                    />
                                }
                            </>
                        ) : (
                            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center text-blue-700">
                                <Info size={24} className="mx-auto mb-2"/>
                                Anda hanya dapat membuat proyek baru. Detail dan pengeditan item pekerjaan hanya dapat diakses oleh Direktur.
                            </div>
                        )}
                    </>
                )}
                </div>
            )}
        </div>
    );
};
export default React.memo(ProjectsView);
