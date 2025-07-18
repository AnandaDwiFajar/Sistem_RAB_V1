import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider, useUI } from './contexts/UIContext';
import { useUserData } from './hooks/useUserData';
import { useProjects } from './hooks/useProjects';
import { useMaterialPrices } from './hooks/useMaterialPrices';
import { useWorkItemDefinitions } from './hooks/useWorkItemDefinitions';

import Sidebar from './components/Sidebar';
import LoginPage from './views/LoginPage';
import ProjectsView from './views/ProjectsView';
import MaterialPricesView from './views/MaterialPricesView';
import WorkItemDefinitionsView from './views/WorkItemDefinitionsView';
import ArchivedProjectsView from './views/ArchivedProjectsView';
import ManageUnitsView from './views/ManageUnitsView';
import ManageWorkItemCategoriesView from './views/ManageWorkItemCategoriesView';
import ProjectDetailsView from './views/ProjectDetailsView';
import ProjectReport from './views/ProjectReport';
import ProjectFormModal from './components/modals/ProjectFormModal';
import PriceFormModal from './components/modals/PriceFormModal';
import CalculationSimulatorView from './views/CalculationSimulatorView';

// Komponen Layout untuk Halaman yang Membutuhkan Sidebar
const AppLayout = ({ projectsManager, materialPricesManager, definitionsManager, userData, handleLogout, userRole }) => (
    <div className="flex h-screen bg-industrial-background">
        <Sidebar handleLogout={handleLogout} userRole={userRole} />
        <main className="flex-1 p-6 overflow-auto">
            {/* Outlet akan merender komponen anak sesuai URL */}
            <Outlet context={{ projectsManager, materialPricesManager, definitionsManager, userData }} />
        </main>
    </div>
);

function App() {
    const { userId, userRole, isAuthLoading, logout } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useUI();

    // Inisialisasi semua hook tetap di sini agar state terpusat
    const userData = useUserData();
    const materialPricesManager = useMaterialPrices(userData.userUnits, userData.setUserUnits);
    const definitionsManager = useWorkItemDefinitions(materialPricesManager.materialPrices, userData.userWorkItemCategories, userData.userUnits);
    const projectsManager = useProjects(definitionsManager.userWorkItemTemplates, materialPricesManager.materialPrices, userData.userUnits, userData.userWorkItemCategories);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
            showToast('success', 'Anda telah berhasil logout.');
        } catch (error) {
            showToast('error', 'Gagal logout. Silakan coba lagi.');
        }
    };

    useEffect(() => {
        if (userId) {
            projectsManager.fetchActiveProjects();
        } else {
            projectsManager.clearProjects();
        }
    }, [userId, projectsManager.fetchActiveProjects, projectsManager.clearProjects]);


    if (isAuthLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return (
        <>
            <Routes>
                {/* Rute untuk pengguna yang sudah login */}
                <Route 
                    path="/*" 
                    element={
                        userId ? 
                        <AppLayout 
                            handleLogout={handleLogout}
                            userRole={userRole}
                            projectsManager={projectsManager}
                            materialPricesManager={materialPricesManager}
                            definitionsManager={definitionsManager}
                            userData={userData}
                        /> : 
                        <Navigate to="/login" />
                    }
                >
                    {/* Halaman default setelah login */}
                    <Route index element={<ProjectsView projectsManager={projectsManager} />} />
                    <Route path="calculation-simulator" element={<CalculationSimulatorView />} />
                    <Route
                        path="materials"
                        element={
                            <MaterialPricesView
                                materialPricesManager={materialPricesManager}
                                onAddNew={() => {
                                    materialPricesManager.setEditingPrice(null);
                                    const firstUnitId = materialPricesManager.userUnits.length > 0 ? materialPricesManager.userUnits[0].id : '';
                                    materialPricesManager.setPriceFormData({ name: '', unitId: firstUnitId, customUnitName: '', price: '' });
                                    materialPricesManager.setShowPriceForm(true);
                                }}
                                onEdit={materialPricesManager.handleEditPrice}
                            />
                        }
                    />
                    <Route path="definitions" element={
                        <WorkItemDefinitionsView 
                            {...definitionsManager}
                            userWorkItemCategories={userData.userWorkItemCategories}
                            materialPrices={materialPricesManager.materialPrices}
                        />} 
                    />
                    <Route path="archived" element={<ArchivedProjectsView projectsManager={projectsManager} />} />
                    <Route path="settings/units" element={<ManageUnitsView units={userData.userUnits} setUnits={userData.setUserUnits} />} />
                    <Route path="settings/work-item-categories" element={<ManageWorkItemCategoriesView categories={userData.userWorkItemCategories} setCategories={userData.setUserWorkItemCategories} />} />
                    
                    {/* Rute dengan parameter */}
                    <Route path="project/:projectId" element={<ProjectDetailsView />} />
                    <Route path="report/:projectId" element={<ProjectReport />} />

                    {/* Rute fallback jika halaman tidak ditemukan setelah login */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Route>

                {/* Rute untuk pengguna yang belum login */}
                <Route path="/login" element={!userId ? <LoginPage /> : <Navigate to="/" />} />
            </Routes>

            {/* Modal bisa tetap di sini karena mereka dipicu oleh state, bukan URL */}
            <ProjectFormModal showModal={projectsManager.showProjectForm} handleClose={projectsManager.handleCancelEdit} formData={projectsManager.projectFormData} handleFormChange={projectsManager.handleProjectFormChange} handleSubmit={projectsManager.handleSaveOrUpdateProject} isSaving={projectsManager.isSavingProject} editingProjectId={projectsManager.editingProjectId} dateError={projectsManager.dateError} />
            <PriceFormModal
                isOpen={materialPricesManager.showPriceForm}
                onClose={() => materialPricesManager.setShowPriceForm(false)}
                editingPrice={materialPricesManager.editingPrice}
                isSaving={materialPricesManager.isSavingPrice}
                pricesManager={materialPricesManager}
            />
        </>
    );
}

const AppWrapper = () => (
    <Router>
        <UIProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
        </UIProvider>
    </Router>
);

export default AppWrapper;