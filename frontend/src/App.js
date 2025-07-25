import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider, useUI } from './contexts/UIContext';
import { useUserData } from './hooks/useUserData';
import { useProjects } from './hooks/useProjects';
import { useMaterialPrices } from './hooks/useMaterialPrices';
import { useWorkItemDefinitions } from './hooks/useWorkItemDefinitions';
import { calculateWorkItem } from './services/calculationService';

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
import WelcomeDashboard from './views/WelcomeDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import StaffDashboard from './views/StaffDashboard';

// Komponen Layout untuk Halaman yang Membutuhkan Sidebar
// TERIMA SEMUA MANAGER SEBAGAI PROPS
const AppLayout = ({ handleLogout, outletContext }) => {
    const { userRole } = useAuth();
    return (
        <div className="flex h-screen bg-industrial-background">
            <Sidebar handleLogout={handleLogout} userRole={userRole} />
            <main className="flex-1 p-6 overflow-auto">
                {/* TERUSKAN CONTEXT KE OUTLET */}
                <Outlet context={outletContext} />
            </main>
        </div>
    );
};


function App() {
    // Pindahkan hook useNavigate ke atas agar bisa digunakan di mana saja
    const navigate = useNavigate();
    const { userId, userRole, isLoading, logout } = useAuth();
    const { showToast } = useUI();

    // Semua manager didefinisikan di sini
    const userData = useUserData();
    const materialPricesManager = useMaterialPrices(userData.userUnits, userData.setUserUnits);
    const definitionsManager = useWorkItemDefinitions(materialPricesManager.materialPrices, userData.userWorkItemCategories, userData.userUnits);
    const projectsManager = useProjects(definitionsManager.userWorkItemTemplates, materialPricesManager.materialPrices, userData.userUnits, userData.userWorkItemCategories);
    
    const [simulatedWorkItem, setSimulatedWorkItem] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [workItemFormData, setWorkItemFormData] = useState({
        templateKey: '',
        primaryInputValue: '',
        parameterValues: {}
    });

    // Gabungkan semua manager ke dalam satu objek untuk diteruskan sebagai context
    const outletContextValue = {
        projectsManager,
        definitionsManager,
        materialPricesManager,
        userData // Anda mungkin juga butuh ini di beberapa view
    };

    const handleWorkItemFormChange = useCallback((e, paramKey) => {
        const { name, value, type } = e.target;
        const processedValue = type === 'number' ? parseFloat(value) || 0 : value;
    
        if (paramKey) {
            setWorkItemFormData(prev => ({
                ...prev,
                parameterValues: { ...prev.parameterValues, [paramKey]: processedValue }
            }));
        } else {
            setWorkItemFormData(prev => ({ ...prev, [name]: processedValue }));
        }
    }, []);

    const handleCalculate = useCallback(async (formData, isSilent = false) => {
        if (!isSilent) setIsCalculating(true);
        if (!isSilent) setSimulatedWorkItem(null);
        try {
            const template = definitionsManager.userWorkItemTemplates[formData.templateKey];
            if (!template) {
                if (!isSilent) showToast('error', 'Silakan pilih item pekerjaan terlebih dahulu.');
                return null;
            }
            
            const calculatedData = calculateWorkItem(
                template,
                formData.primaryInputValue,
                materialPricesManager.materialPrices,
                formData.parameterValues
            );

            if (!isSilent) setSimulatedWorkItem(calculatedData);
            return calculatedData;
        } catch (error) {
            console.error("Calculation failed:", error);
            if (!isSilent) showToast('error', `Gagal melakukan perhitungan: ${error.message}`);
            return null;
        } finally {
            if (!isSilent) setIsCalculating(false);
        }
    }, [
        definitionsManager.userWorkItemTemplates, 
        materialPricesManager.materialPrices, 
        showToast
    ]);


    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
            showToast('success', 'Anda telah berhasil logout.');
        } catch (error) {
            showToast('error', 'Gagal logout. Silakan coba lagi.');
        }
    };

    // Menggunakan useCallback untuk fetchActiveProjects dan clearProjects
    const fetchProjects = projectsManager.fetchActiveProjects;
    const clearProjects = projectsManager.clearProjects;

    useEffect(() => {
        if (userId) {
            fetchProjects();
        } else {
            clearProjects();
        }
    }, [userId, fetchProjects, clearProjects]);


    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return (
        <>
            <Routes>
                <Route path="/login" element={!userId ? <LoginPage /> : <Navigate to="/" />} />
                {/* KIRIMKAN CONTEXT KE APPLAYOUT */}
                <Route 
                    path="/" 
                    element={
                        userId ? <AppLayout handleLogout={handleLogout} outletContext={outletContextValue} /> : <Navigate to="/login" />
                    }
                >
                    <Route index element={
                        userRole === 'admin' ? <WelcomeDashboard /> : <StaffDashboard 
                                definitionsManager={definitionsManager} 
                                materialPricesManager={materialPricesManager} 
                                userData={userData} 
                              />
                    } />
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        {/* Semua route di sini sekarang menerima manager yang benar */}
                        <Route path="projects" element={<ProjectsView projectsManager={projectsManager} />} />
                        <Route path="archived" element={<ArchivedProjectsView projectsManager={projectsManager} />} />
                        <Route path="project/:projectId" element={<ProjectDetailsView />} />
                        <Route path="report/:projectId" element={<ProjectReport />} />
                    </Route>
                    
                    <Route 
                        path="calculation-simulator" 
                        element={
                            <CalculationSimulatorView
                                definitionsManager={definitionsManager}
                                userWorkItemCategories={userData.userWorkItemCategories}
                                workItemFormData={workItemFormData}
                                handleWorkItemFormChange={handleWorkItemFormChange}
                                calculatedWorkItemPreview={simulatedWorkItem}
                                handleCalculate={handleCalculate}
                                isCalculating={isCalculating}
                            />
                        } 
                    />
                    <Route
                        path="material-prices"
                        element={
                            <MaterialPricesView 
                                materialPricesManager={materialPricesManager}
                                onAddNew={() => materialPricesManager.setShowPriceForm(true)}
                                onEdit={materialPricesManager.handleEditPrice}
                            />
                        }
                    />
                    <Route path="work-item-definitions" element={
                        <WorkItemDefinitionsView 
                            {...definitionsManager}
                            userWorkItemCategories={userData.userWorkItemCategories}
                            materialPrices={materialPricesManager.materialPrices}
                        />} 
                    />
                    <Route path="settings/units" element={<ManageUnitsView units={userData.userUnits} setUnits={userData.setUserUnits} />} />
                    <Route path="settings/work-item-categories" element={<ManageWorkItemCategoriesView categories={userData.userWorkItemCategories} setCategories={userData.setUserCategories} />} />

                    <Route path="*" element={<Navigate to="/" />} />
                </Route>
            </Routes>

            {/* Modals tetap di sini */}
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
