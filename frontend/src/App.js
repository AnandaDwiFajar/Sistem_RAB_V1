/* eslint-disable require-jsdoc, camelcase, no-unused-vars, react/prop-types */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider, useUI } from './contexts/UIContext';

// Import New Sidebar
import Sidebar from './components/Sidebar';

// Import Custom Hooks & Components like before
import { useUserData } from './hooks/useUserData';
import { useMaterialPrices } from './hooks/useMaterialPrices';
import { useWorkItemDefinitions } from './hooks/useWorkItemDefinitions';
import { useProjects } from './hooks/useProjects';
import LoginPage from './views/LoginPage';
import MaterialPricesView from './views/MaterialPricesView';
import ProjectsView from './views/ProjectsView';
import WorkItemDefinitionsView from './views/WorkItemDefinitionsView';
import ArchivedProjectsListView from './views/ArchivedProjectsListView';
import ManageUnitsView from './views/ManageUnitsView'; // Import the new view
import ManageWorkItemCategoriesModal from './components/modals/ManageWorkItemCategoriesModal';
import ManageUnitsModal from './components/modals/ManageUnitsModal';
import ManageCashFlowCategoriesModal from './components/modals/ManageCashFlowCategoriesModal';
import ProjectReport from './views/ProjectReport';
import ProjectFormModal from './components/modals/ProjectFormModal';
import PriceFormModal from './components/modals/PriceFormModal';

function App() {
    const { userId, userRole, isAuthLoading, logout } = useAuth();
    const { showToast } = useUI();

    const [currentView, setCurrentView] = useState('projects');
    const hasSetInitialView = useRef(false);

    useEffect(() => {
      const clearSession = async () => {
          if (logout) {
              await logout();
          }
      };
      clearSession();
  }, []);

    // --- Hooks Instantiation (same as before) ---
    const userData = useUserData();
    const materialPricesManager = useMaterialPrices(userData.userUnits, userData.setUserUnits);
    const definitionsManager = useWorkItemDefinitions(materialPricesManager.materialPrices, userData.userWorkItemCategories, userData.userUnits);
    const projectsManager = useProjects(definitionsManager.userWorkItemTemplates, materialPricesManager.materialPrices, userData.userUnits, userData.userWorkItemCategories);

    
    // --- Modal State (same as before) ---
    const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
    const [showManageUnitsModal, setShowManageUnitsModal] = useState(false);
    const [showManageCashFlowCategoriesModal, setShowManageCashFlowCategoriesModal] = useState(false);
    
    // --- Initial View Logic (same as before) ---
    useEffect(() => {
        if (userId && userRole && !hasSetInitialView.current) {
            if (userRole === 'staff_operasional') {
                setCurrentView('materialPrices');
            } else {
                setCurrentView('projects');
            }
            hasSetInitialView.current = true;
        }
    }, [userId, userRole]);

    // --- Data Fetching (same as before) ---
    const { fetchMaterialPrices } = materialPricesManager;
    const { fetchWorkItemDefinitions } = definitionsManager;
    const { fetchActiveProjects, fetchArchivedProjects } = projectsManager;

    useEffect(() => {
        if (!userId) return;
        const fetchMap = {
            projects: fetchActiveProjects,
            cashFlowSummary: fetchActiveProjects,
            materialPrices: fetchMaterialPrices,
            workItemDefinitions: fetchWorkItemDefinitions,
            archivedProjects: fetchArchivedProjects,
            manageUnits: () => {}, // No initial data fetch needed for manageUnits view
        };
        fetchMap[currentView]?.();
    }, [currentView, userId, fetchActiveProjects, fetchArchivedProjects, fetchMaterialPrices, fetchWorkItemDefinitions]);

    const handleLogout = useCallback(async () => {
        await logout();
        setCurrentView('projects');
        hasSetInitialView.current = false;
        showToast('info', "Anda telah berhasil logout.");
    }, [logout, showToast]);

    if (isAuthLoading) {
        return <div className="flex items-center justify-center min-h-screen text-lg font-medium text-industrial-dark industrial-background">Memuat Sesi Pengguna...</div>;
    }

    if (!userId) {
        return <LoginPage />;
    }

    const viewTitles = {
        projects: "Manajemen Proyek",
        materialPrices: "Daftar Harga Satuan Bahan",
        workItemDefinitions: "Definisi Komponen Pekerjaan",
        archivedProjects: "Arsip Proyek",
        cashFlowSummary: "Ringkasan Cash Flow",
        manageUnits: "Kelola Unit"
    };

    return (
        <div className="flex min-h-screen bg-industrial-light">
            <Sidebar 
                userRole={userRole} 
                currentView={currentView} 
                setCurrentView={setCurrentView} 
                handleLogout={handleLogout} 
            />
            
            <div className="flex-grow ml-64">
                {/* --- Modals --- */}
            <ManageWorkItemCategoriesModal
                showManageCategoriesModal={showManageCategoriesModal}
                setShowManageCategoriesModal={setShowManageCategoriesModal}
                newCategoryName={userData.newCategoryName}
                setNewCategoryName={userData.setNewCategoryName}
                handleAddNewWorkItemCategory={userData.handleAddNewWorkItemCategory}
                userWorkItemCategories={userData.userWorkItemCategories}
                handleUpdateWorkItemCategory={userData.handleUpdateWorkItemCategory}
                handleDeleteWorkItemCategory={(cat) => userData.handleDeleteWorkItemCategory(cat, definitionsManager.userWorkItemTemplates)}
            />
            <ManageUnitsModal
                showManageUnitsModal={showManageUnitsModal}
                setShowManageUnitsModal={setShowManageUnitsModal}
                newUnitName={userData.newUnitName}
                setNewUnitName={userData.setNewUnitName}
                handleAddNewUnit={userData.handleAddNewUnit}
                userUnits={userData.userUnits}
                handleDeleteUnit={(unit) => userData.handleDeleteUnit(unit, materialPricesManager.materialPrices, definitionsManager.userWorkItemTemplates)}
                handleUpdateUnit={userData.handleUpdateUnit}
            />
            <ManageCashFlowCategoriesModal
                showManageCashFlowCategoriesModal={showManageCashFlowCategoriesModal}
                setShowManageCashFlowCategoriesModal={setShowManageCashFlowCategoriesModal}
                newCashFlowCategoryName={userData.newCashFlowCategoryName}
                setNewCashFlowCategoryName={userData.setNewCashFlowCategoryName}
                handleAddNewCashFlowCategory={userData.handleAddNewCashFlowCategory}
                userCashFlowCategories={userData.userCashFlowCategories}
                handleUpdateCashFlowCategory={userData.handleUpdateCashFlowCategory}
                handleDeleteCashFlowCategory={(categoryToDelete) => userData.handleDeleteCashFlowCategory(categoryToDelete, projectsManager.projects, projectsManager.currentProject)}
            />

                <main className="p-8">
                    {/* Page Header */}
                    <div className="mb-6 pb-4 border-b border-industrial-gray-light">
                        <h2 className="text-3xl font-bold text-industrial-dark">{viewTitles[currentView]}</h2>
                        <p className="text-industrial-gray">Selamat datang, kelola data Anda di sini.</p>
                    </div>

                    {/* --- Main Content Area --- */}
                    <div className="bg-industrial-white p-6 rounded-lg shadow-md">
                        {currentView === 'materialPrices' && (
                            <MaterialPricesView
                                pricesManager={materialPricesManager}
                                onEdit={materialPricesManager.handleEditPrice} 
                                onAddNew={() => {
                                    materialPricesManager.setEditingPrice(null); 
                                    materialPricesManager.setPriceFormData({ name: '', unitId: userData.userUnits[0]?.id || '', customUnitName: '', price: '' });
                                    materialPricesManager.setShowPriceForm(true);
                                }}
                            />
                        )}
                        {currentView === 'projects' && (
                            <ProjectsView
                                projectsManager={projectsManager}
                                definitionsManager={definitionsManager}
                                userRole={userRole}
                                setCurrentView={setCurrentView}
                                userWorkItemCategories={userData.userWorkItemCategories}                                           
                                cashFlowCategories={userData.userCashFlowCategories}
                                setShowManageCashFlowCategoriesModal={setShowManageCashFlowCategoriesModal}
                            />
                        )}
                        {currentView === 'workItemDefinitions' && (
                            <WorkItemDefinitionsView
                                {...definitionsManager}
                                materialPrices={materialPricesManager.materialPrices}
                                userUnits={userData.userUnits}
                                userWorkItemCategories={userData.userWorkItemCategories}
                                setShowManageCategoriesModal={setShowManageCategoriesModal}
                            />
                        )}
                        {currentView === 'archivedProjects' && userRole === 'admin' && (
                            <ArchivedProjectsListView
                                archivedProjects={projectsManager.archivedProjects}
                                isLoading={projectsManager.isLoading}
                                handleUnarchiveProject={projectsManager.handleUnarchiveProject}
                            />
                        )}
                        {currentView === 'manageUnits' && (
                           <ManageUnitsView />
                        )}
                    </div>
                </main>

                <footer className="px-8 py-4 text-center text-sm text-industrial-gray">
                    <p>&copy; {new Date().getFullYear()} Sistem Informasi Rencana Anggaran Biaya</p>
                </footer>
            </div>
            
            {/* Hidden component & Modals (same as before) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px' }}><ProjectReport ref={projectsManager.reportContentRef} project={projectsManager.currentProject} allCategories={userData.userWorkItemCategories} cashFlowCategories={userData.userCashFlowCategories} /></div>
            <ProjectFormModal showModal={projectsManager.showProjectForm} handleClose={projectsManager.handleCancelEdit} formData={projectsManager.projectFormData} handleFormChange={projectsManager.handleProjectFormChange} handleSubmit={projectsManager.handleSaveOrUpdateProject} isSaving={projectsManager.isSavingProject} editingProjectId={projectsManager.editingProjectId} dateError={projectsManager.dateError} />
            {materialPricesManager.showPriceForm && <PriceFormModal isOpen={materialPricesManager.showPriceForm} onClose={() => materialPricesManager.setShowPriceForm(false)} editingPrice={materialPricesManager.editingPrice} isSaving={materialPricesManager.isSavingPrice} pricesManager={materialPricesManager} />}
        </div>
    );
}

function AppWrapper() {
    return (
        <AuthProvider>
            <UIProvider>
                <App />
            </UIProvider>
        </AuthProvider>
    );
}

export default AppWrapper;