/* eslint-disable require-jsdoc, camelcase, no-unused-vars, react/prop-types */
import React, { useState, useEffect, useCallback, useRef } from 'react'; // Impor useRef
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider, useUI } from './contexts/UIContext';
import {
    DollarSign, Briefcase, ClipboardList, PieChart, LogOut, Archive
} from 'lucide-react';

// Import Custom Hooks
import { useUserData } from './hooks/useUserData';
import { useMaterialPrices } from './hooks/useMaterialPrices';
import { useWorkItemDefinitions } from './hooks/useWorkItemDefinitions';
import { useProjects } from './hooks/useProjects';
import { useCashFlowSummary } from './hooks/useCashFlowSummary';

// Import Views and Components
import LoginPage from './views/LoginPage';
import MaterialPricesView from './views/MaterialPricesView';
import ProjectsView from './views/ProjectsView';
import WorkItemDefinitionsView from './views/WorkItemDefinitionsView';
import CashFlowSummaryView from './views/CashFlowSummaryView';
import ArchivedProjectsListView from './views/ArchivedProjectsListView';
import ManageWorkItemCategoriesModal from './components/modals/ManageWorkItemCategoriesModal';
import ManageUnitsModal from './components/modals/ManageUnitsModal';
import ManageCashFlowCategoriesModal from './components/modals/ManageCashFlowCategoriesModal';
import ProjectReport from './views/ProjectReport';
import ProjectFormModal from './components/modals/ProjectFormModal'; 
import PriceFormModal from './components/modals/PriceFormModal';
;

function App() {
    const { userId, userRole, isAuthLoading, logout } = useAuth();
    const { showToast } = useUI();

    // --- PERBAIKAN 1: Atur state awal dan siapkan ref untuk pelacakan ---
    const [currentView, setCurrentView] = useState('projects'); // Default awal
    const hasSetInitialView = useRef(false); // Untuk memastikan halaman default hanya diatur sekali

    // --- Instantiate Custom Hooks ---
    const userData = useUserData(); 
    const materialPricesManager = useMaterialPrices(userData.userUnits, userData.setUserUnits);
    const definitionsManager = useWorkItemDefinitions(materialPricesManager.materialPrices, userData.userWorkItemCategories, userData.userUnits);
    const projectsManager = useProjects(definitionsManager.userWorkItemTemplates, materialPricesManager.materialPrices, userData.userUnits, userData.userWorkItemCategories);
    const cashFlowSummaryManager = useCashFlowSummary(currentView);

    // --- Modal Visibility State ---
    const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
    const [showManageUnitsModal, setShowManageUnitsModal] = useState(false);
    const [showManageCashFlowCategoriesModal, setShowManageCashFlowCategoriesModal] = useState(false);


    // --- PERBAIKAN 2: Effect untuk mengatur halaman default berdasarkan peran pengguna ---
    useEffect(() => {
        // Jalankan hanya setelah data pengguna tersedia dan halaman default belum diatur
        if (userId && userRole && !hasSetInitialView.current) {
            if (userRole === 'staff_operasional') {
                setCurrentView('materialPrices'); // Atur ke Daftar Harga Satuan untuk staff
            }
            // Untuk 'admin', halaman default 'projects' sudah benar, jadi tidak perlu diubah.
            hasSetInitialView.current = true; // Tandai bahwa halaman default sudah diatur
        }
    }, [userId, userRole]); // Jalankan effect ini saat informasi pengguna tersedia

    // --- Data Fetching Effect ---
    const { fetchMaterialPrices } = materialPricesManager;
    const { fetchWorkItemDefinitions } = definitionsManager;
    const { fetchActiveProjects, fetchArchivedProjects } = projectsManager;

    useEffect(() => {
        if (!userId) return;
        
        switch (currentView) {
            case 'projects':
            case 'cashFlowSummary':
                if (typeof fetchActiveProjects === 'function') {
                    fetchActiveProjects();
                }
                break;
            case 'materialPrices':
                if (typeof fetchMaterialPrices === 'function') {
                    fetchMaterialPrices();
                }
                break;
            case 'workItemDefinitions':
                if (typeof fetchWorkItemDefinitions === 'function') {
                    fetchWorkItemDefinitions();
                } else {
                    console.warn("Peringatan: Fungsi 'fetchWorkItemDefinitions' tidak ditemukan pada 'definitionsManager'.");
                }
                break;
            case 'archivedProjects':
                if (typeof fetchArchivedProjects === 'function') {
                    fetchArchivedProjects();
                }
                break;
            default:
                break;
        }
    }, [currentView, userId, fetchActiveProjects, fetchArchivedProjects, fetchMaterialPrices, fetchWorkItemDefinitions]);

    // --- Logout Handler ---
    const handleLogout = useCallback(async () => {
        await logout();
        setCurrentView('projects'); // Reset ke default umum saat logout
        hasSetInitialView.current = false; // Reset pelacak untuk login berikutnya
        showToast('info', "Anda telah berhasil logout.");
    }, [logout, showToast]);

    // --- Render Logic ---
    if (isAuthLoading) {
        return <div className="flex items-center justify-center min-h-screen text-lg font-medium text-gray-600">Memuat Sesi Pengguna...</div>;
    }
    if (!userId) {
        return <LoginPage />;
    }

    const roleDisplayNames = { admin: 'Direktur', staff_operasional: 'Staff Operasional' };
    const mainNavItems = {
        admin: ['projects', 'materialPrices', 'workItemDefinitions'],
        staff_operasional: ['materialPrices', 'workItemDefinitions'],
    }[userRole] || [];

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
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
                handleDeleteCashFlowCategory={(categoryToDelete) => userData.handleDeleteCashFlowCategory(categoryToDelete, projectsManager.projects, projectsManager.currentProject)}
            />

            {/* --- Header & Navigation --- */}
            <header className="fixed top-0 left-0 w-full z-40 bg-gray-100/80 backdrop-blur-sm border-b border-gray-300 shadow-sm">
                <div className="container mx-auto px-4 md:px-8 py-3">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <h1 className="text-2xl lg:text-3xl font-bold text-sky-600 mb-3 md:mb-0">RAB Proyek Konstruksi</h1>
                        <nav className="flex items-center space-x-1 sm:space-x-2 bg-white p-1.5 rounded-lg shadow-md">
                            {mainNavItems.map(view => (
                                <button key={view} onClick={() => setCurrentView(view)}
                                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors flex items-center ${
                                        currentView === view ? 'bg-sky-500 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200 hover:text-sky-600'
                                    }`}>
                                    {view === 'projects' && <Briefcase size={16} className="mr-1.5"/>}
                                    {view === 'materialPrices' && <DollarSign size={16} className="mr-1.5"/>}
                                    {view === 'workItemDefinitions' && <ClipboardList size={16} className="mr-1.5"/>}
                                    {view === 'cashFlowSummary' && <PieChart size={16} className="mr-1.5"/>}
                                    {view === 'projects' ? 'Proyek' : view === 'materialPrices' ? 'Daftar Harga Satuan' : view === 'workItemDefinitions' ? 'Komponen Pekerjaan' : view === 'cashFlowSummary' ? 'Ringkasan' : 'Arsip'}
                                </button>
                            ))}
                            {userRole === 'admin' && (
                                <button onClick={() => setCurrentView('archivedProjects')}
                                    title="Arsip Proyek"
                                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors flex items-center ${
                                        currentView === 'archivedProjects' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200 hover:text-amber-600'
                                    }`}>
                                    <Archive size={16} className="mr-1.5"/> Arsip
                                </button>
                            )}
                            <button onClick={handleLogout} title="Logout" className="px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium bg-red-600 hover:bg-red-500 text-white shadow-md transition-colors flex items-center">
                                <LogOut size={16} className="mr-0 sm:mr-1.5"/>
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </nav>
                    </div>
                    <div className="container mx-auto flex justify-end mt-2">
                        <div className="text-xs text-gray-600 bg-white/70 px-2 py-1 rounded-md shadow-sm">
                            <span className="font-semibold">{roleDisplayNames[userRole] || userRole}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- Main Content Area --- */}
            <main className="container mx-auto px-4 md:px-8 pt-32 pb-8">
                {currentView === 'materialPrices' && (
                    <MaterialPricesView
                    pricesManager={materialPricesManager}
                    setShowManageUnitsModal={setShowManageUnitsModal}
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
                {currentView === 'cashFlowSummary' && userRole === 'admin' && (
                    <CashFlowSummaryView
                        summaryManager={cashFlowSummaryManager}
                    />
                )}
                {currentView === 'archivedProjects' && userRole === 'admin' && (
                    <ArchivedProjectsListView
                        archivedProjects={projectsManager.archivedProjects}
                        isLoading={projectsManager.isLoading}
                        handleUnarchiveProject={projectsManager.handleUnarchiveProject}
                    />
                )}
            </main>

            {/* Hidden component for PDF generation */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px' }}>
                <ProjectReport 
                ref={projectsManager.reportContentRef} 
                project={projectsManager.currentProject}
                allCategories={userData.userWorkItemCategories} 
                cashFlowCategories={userData.userCashFlowCategories}
                />
            </div>

            <footer className="mt-12 py-6 border-t border-gray-300 text-center text-sm text-gray-500">
                <p>&copy; {new Date().getFullYear()} Sistem Informasi Rencana Anggaran Biaya</p>
            </footer>

            <ProjectFormModal
                showModal={projectsManager.showProjectForm}
                handleClose={projectsManager.handleCancelEdit}
                formData={projectsManager.projectFormData}
                handleFormChange={projectsManager.handleProjectFormChange}
                handleSubmit={projectsManager.handleSaveOrUpdateProject}
                isSaving={projectsManager.isSavingProject}
                editingProjectId={projectsManager.editingProjectId}
                dateError={projectsManager.dateError}
            />
            {materialPricesManager.showPriceForm && (
                <PriceFormModal
                    isOpen={materialPricesManager.showPriceForm}
                    onClose={() => materialPricesManager.setShowPriceForm(false)}
                    editingPrice={materialPricesManager.editingPrice}
                    isSaving={materialPricesManager.isSavingPrice}
                    pricesManager={materialPricesManager}
                />
            )}
        </div>
    );
}

// The AppWrapper remains the entry point for providing contexts
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
