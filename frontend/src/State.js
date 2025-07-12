 /* eslint-disable require-jsdoc, camelcase, brace-style, block-spacing, arrow-parens */
import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
// Removed signInWithCustomToken as it was unused
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import {
  DollarSign, Briefcase, Copy, ClipboardList, PieChart, LogOut
} from 'lucide-react';
import ArchivedProjectsListView from './views new/ArchivedProjectsListView';
import * as apiService from './services/apiService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ProjectReport from './views/ProjectReport';
import { Download } from 'lucide-react'; // Impor ikon baru
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Impor AuthProvider dan useAuth
import { DataProvider, useData } from './contexts/DataContext';
// Import Constants
import {
  DEFAULT_WORK_ITEM_CATEGORIES_FALLBACK,
  DEFAULT_UNITS_FALLBACK,
  DEFAULT_CASH_FLOW_CATEGORIES_FALLBACK,
} from './utils/constants';

// Import Helpers
import { formatCurrency, generateId, slugify } from './utils/helpers';
import { CALCULATION_SCHEMAS } from './utils/calculationSchemas';

// Import Components
import Toast from './components/Toast';
import ConfirmModal from './components/modals/ConfirmModal';
import InsightsModal from './components/modals/InsightsModal';
import ManageWorkItemCategoriesModal from './components/modals/ManageWorkItemCategoriesModal';
import ManageUnitsModal from './components/modals/ManageUnitsModal';
import ManageCashFlowCategoriesModal from './components/modals/ManageCashFlowCategoriesModal';
import MaterialPricesView from './views new/MaterialPricesView';
import ProjectsView from './views new/ProjectsView';
import WorkItemDefinitionsView from './views new/WorkItemDefinitionsView';
import CashFlowSummaryView from './views/CashFlowSummaryView';
import LoginPage from './views/LoginPage';

// --- Firebase Configuration (Auth Only) ---
const firebaseConfig = typeof window.__firebase_config !== 'undefined' ? JSON.parse(window.__firebase_config) : {
  apiKey: "AIzaSyBHNm5cvd-pjcIA2s4X-tCzGymi5CEXDng", // Replace with your actual config
  authDomain: "sistem-rab.firebaseapp.com",
  projectId: "sistem-rab",
  storageBucket: "sistem-rab.firebasestorage.app",
  messagingSenderId: "673801722173",
  appId: "1:673801722173:web:af20b061336004dd818d54",
  measurementId: "G-FZG9Q25LMT"
};

// --- Initialize Firebase (Auth Only) ---
let app;
let auth;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error("Error initializing Firebase Auth:", error);
}

function App() {
      const { isLoadingData } = useData();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const reportContentRef = React.createRef(); 
  // --- State Hooks (useState) ---
  const [archivedProjects, setArchivedProjects] = useState([]);
  const { userId, userRole, isLoading: isAuthLoading } = useAuth();
  useEffect(() => {
    console.log('KONTEKS PENGGUNA SAAT INI:', { 
        userId: userId, 
        userRole: userRole 
    });
}, [userId, userRole]);
  const [isLoading, setIsLoading] = useState(true); // General loading for views
  const [currentView, setCurrentView] = useState('projects'); // projects, materialPrices, workItemDefinitions, cashFlowSummary
  const [currentProjectView, setCurrentProjectView] = useState('workItems'); // For tabs within a selected project
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [toastMessage, setToastMessage] = useState(null); // { type: 'success' | 'error' | 'info', message: string }

  // Global User-specific Dropdown Data
  const [userWorkItemCategories, setUserWorkItemCategories] = useState([]);
  const [userUnits, setUserUnits] = useState([]);
  const handleUnitAdded = useCallback((newlyAddedUnit) => {
    setUserUnits(prevUnits => 
        [...prevUnits, newlyAddedUnit].sort((a, b) => a.unit_name.localeCompare(b.unit_name))
    );
}, []);
  const [userCashFlowCategories, setUserCashFlowCategories] = useState([]);

  // Modals Visibility & Form Data
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showManageUnitsModal, setShowManageUnitsModal] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [showManageCashFlowCategoriesModal, setShowManageCashFlowCategoriesModal] = useState(false);
  const [newCashFlowCategoryName, setNewCashFlowCategoryName] = useState('');

  // Specific Loading States
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isSavingDefinition, setIsSavingDefinition] = useState(false);
  const [isAddingWorkItem, setIsAddingWorkItem] = useState(false);
  const [isSuggestingComponents, setIsSuggestingComponents] = useState(false);
  const [isFetchingProjectInsights, setIsFetchingProjectInsights] = useState(false);
  const [isSavingCashFlowEntry, setIsSavingCashFlowEntry] = useState(false);

  // Material Prices Data
  const [materialPrices, setMaterialPrices] = useState([]);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceFormData, setPriceFormData] = useState({ name: '', unitId: '', customUnitName: '', price: '' });
  const [unitSelectionMode, setUnitSelectionMode] = useState('select');

  // Projects Data
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectFormData, setProjectFormData] = useState({ 
      projectName: '', customerName: '', location: '', startDate: '', dueDate: '', projectPrice: ''
  });
  const [projectInsights, setProjectInsights] = useState('');
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  // Work Items Data (within a project)
  const [showWorkItemForm, setShowWorkItemForm] = useState(false);
  const [workItemFormData, setWorkItemFormData] = useState({
    templateKey: '',
    primaryInputValue: '',
    parameterValues: {},
  });
  const [calculatedWorkItemPreview, setCalculatedWorkItemPreview] = useState(null);

  // Work Item Definitions (Templates) Data
  const [userWorkItemTemplates, setUserWorkItemTemplates] = useState({});
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplateData, setEditingTemplateData] = useState(null);
  const [selectedTemplateKeyForEditing, setSelectedTemplateKeyForEditing] = useState(null);

  // Cash Flow Data (within a project)
  const [showCashFlowForm, setShowCashFlowForm] = useState(false);
  const [cashFlowFormData, setCashFlowFormData] = useState({ date: new Date().toISOString().split('T')[0], description: '', type: 'expense', amount: '', categoryId: '' });
  const [editingCashFlowEntry, setEditingCashFlowEntry] = useState(null);

  // Confirmation Modal Data
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null, onCancel: null });

  const [selectedCashFlowMonth, setSelectedCashFlowMonth] = useState('');
  const [cashFlowSummaryData, setCashFlowSummaryData] = useState(null); // For the fetched summary
  const [isLoadingCashFlowSummary, setIsLoadingCashFlowSummary] = useState(false);

  const firstCategory = userWorkItemCategories.length > 0 ? userWorkItemCategories[0] : { id: '', category_name: 'Uncategorized' };
  const firstUnit = userUnits.length > 0 ? userUnits[0] : { id: '', unit_name: '' };

  const allowedViews = {
        admin: ['projects', 'materialPrices', 'workItemDefinitions', 'cashFlowSummary', 'archivedProjects'],
        staff_operasional: ['projects', 'materialPrices', 'workItemDefinitions'],
    };

    const navigableViews = allowedViews[userRole] || [];

  const navigationMenuItems = {
    admin: ['projects', 'materialPrices', 'workItemDefinitions', 'cashFlowSummary'],
    staff_operasional: ['projects', 'materialPrices', 'workItemDefinitions'],
};
const mainNavItems = navigationMenuItems[userRole] || [];
  
  // --- Callback Hooks (useCallback) ---
  const showToast = useCallback((type, message) => {
    setToastMessage({ type, message });
  }, [setToastMessage]);


    console.log('--- Merender ProjectsView ---');
    console.log('Apakah Context sedang loading?', isLoadingData);
    console.log('Apakah Proyek sedang loading?', isLoadingProjects);

        useEffect(() => {
        console.log('ProjectsView: useEffect untuk mengambil proyek sedang berjalan...');
        if (!userId) {
            console.log('ProjectsView: Keluar dari useEffect karena tidak ada userId.');
            return;
        }

        setIsLoadingProjects(true);
        apiService.fetchProjects(userId)
            .then(data => {
                console.log('ProjectsView: Data proyek berhasil diterima.');
                setProjects(data || []);
            })
            .catch(err => {
                console.error('ProjectsView: Gagal mengambil proyek!', err);
                showToast('error', `Gagal memuat proyek: ${err.message}`);
            })
            .finally(() => {
                console.log('ProjectsView: Proses fetch proyek selesai, setIsLoadingProjects menjadi false.');
                setIsLoadingProjects(false);
            });
    }, [userId, showToast]);

        if (isLoadingData || isLoadingProjects) {
        console.log('Menampilkan LOKASI LOADING...');
        return <div>Loading Proyek... (Mengecek console...)</div>;
    }
  const window_confirm = useCallback((message) => new Promise((resolve) => {
    setConfirmModal({
      isOpen: true,
      message,
      onConfirm: () => { setConfirmModal({ isOpen: false }); resolve(true); },
      onCancel: () => { setConfirmModal({ isOpen: false }); resolve(false); }
    });
  }), [setConfirmModal]);

 const handleLogin = useCallback(async (email, password) => {
 if (!auth) {
 setLoginError("Authentication service is not available.");
showToast('error', "Authentication service is not available.");
 return;
 }
 setIsLoggingIn(true);
 setLoginError(null);
 try {
 await signInWithEmailAndPassword(auth, email, password);
 // AuthProvider akan menangani sisanya
 } catch (error) {
 const errorMessage = error.code === 'auth/invalid-credential' ? 'Email atau password salah.' : 'Gagal login. Silakan coba lagi.';
 setLoginError(errorMessage);
 showToast('error', errorMessage);
 } finally {
 setIsLoggingIn(false);
 }
 }, [auth, showToast]);

  const handleLogout = useCallback(async () => {
    if (!auth) {
      showToast('error', "Authentication service is not available.");
      return;
    }
    try {
      await signOut(auth);
      setCurrentProject(null);
      setCurrentProjectId(null);
      setProjects([]); // Clear projects list
      setUserWorkItemTemplates({}); // Clear templates
      setMaterialPrices([]); // Clear material prices
      // ... other state resets as needed ...
      setCurrentView('projects'); // Reset to a default view
      showToast('info', "You have been logged out.");
    } catch (error) {
      console.error("Logout error:", error);
      showToast('error', "Logout failed. Please try again.");
    }
  }, [auth, showToast, setCurrentProject, setCurrentProjectId, setCurrentView, setProjects, setUserWorkItemTemplates, setMaterialPrices]);

 
 const handleAddNewWorkItemCategory = useCallback(async () => {
    if (!newCategoryName.trim()) { showToast('error', 'Category name cannot be empty.'); return; }
    if (userWorkItemCategories.some(c => c.category_name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      showToast('error', `Category "${newCategoryName.trim()}" already exists.`); return;
    }
    try {
      const addedCategory = await apiService.addWorkItemCategoryApi(userId, newCategoryName.trim());
      setUserWorkItemCategories(prev => [...prev, addedCategory].sort((a, b) => a.category_name.localeCompare(b.category_name)));
      setNewCategoryName(''); showToast('success', `Category "${addedCategory.category_name}" added.`);
    } catch (error) { console.error("Error adding category:", error); showToast('error', `Failed to add category: ${error.message}`); }
  }, [newCategoryName, userWorkItemCategories, userId, apiService, setUserWorkItemCategories, setNewCategoryName, showToast]);

  const handleDeleteWorkItemCategory = useCallback(async (categoryObjectToDelete) => {
    const isUsed = Object.values(userWorkItemTemplates).some(template => template.category_id === categoryObjectToDelete.id);
    if (isUsed) { showToast('error', `Category "${categoryObjectToDelete.category_name}" is in use and cannot be deleted.`); return; }

    if (!await window_confirm(`Delete category "${categoryObjectToDelete.category_name}"?`)) return;
    try {
      await apiService.deleteWorkItemCategoryApi(userId, categoryObjectToDelete.id);
      setUserWorkItemCategories(prev => prev.filter(cat => cat.id !== categoryObjectToDelete.id));
      showToast('success', `Category "${categoryObjectToDelete.category_name}" deleted.`);
      if (editingTemplateData?.category_id === categoryObjectToDelete.id) {
        setEditingTemplateData(prev => ({ ...prev, category_id: (userWorkItemCategories.find(c => c.id !== categoryObjectToDelete.id) || { id: '' }).id }));
      }
    } catch (error) { console.error("Error deleting category:", error); showToast('error', `Failed to delete category: ${error.message}`); }
  }, [userWorkItemTemplates, window_confirm, userId, apiService, setUserWorkItemCategories, showToast, editingTemplateData, setEditingTemplateData, userWorkItemCategories]);

  const handleAddNewUnit = useCallback(async () => {
    if (!newUnitName.trim()) { showToast('error', 'Unit name cannot be empty.'); return; }
    if (userUnits.some(u => u.unit_name.toLowerCase() === newUnitName.trim().toLowerCase())) {
      showToast('error', `Unit "${newUnitName.trim()}" already exists.`); return;
    }
    try {
      const addedUnit = await apiService.addUnitApi(userId, newUnitName.trim());
      setUserUnits(prev => [...prev, addedUnit].sort((a, b) => a.unit_name.localeCompare(b.unit_name)));
      setNewUnitName(''); showToast('success', `Unit "${addedUnit.unit_name}" added.`);
    } catch (error) { console.error("Error adding unit:", error); showToast('error', `Failed to add unit: ${error.message}`); }
  }, [newUnitName, userUnits, userId, apiService, setUserUnits, setNewUnitName, showToast]);

  const handleDeleteUnit = useCallback(async (unitObjectToDelete) => {
    // Consider adding checks for unit usage in materialPrices, workItemDefinitions primary_input_unit_id
    const isUsedInPrices = materialPrices.some(price => price.unit_id === unitObjectToDelete.id);
    const isUsedInDefinitions = Object.values(userWorkItemTemplates).some(def => def.primary_input_unit_id === unitObjectToDelete.id);

    if (isUsedInPrices || isUsedInDefinitions) {
        showToast('error', `Unit "${unitObjectToDelete.unit_name}" is in use by prices or definitions and cannot be deleted.`);
        return;
    }

    if (!await window_confirm(`Delete unit "${unitObjectToDelete.unit_name}"?`)) return;
    try {
      await apiService.deleteUnitApi(userId, unitObjectToDelete.id);
      setUserUnits(prev => prev.filter(unit => unit.id !== unitObjectToDelete.id));
      showToast('success', `Unit "${unitObjectToDelete.unit_name}" deleted.`);
      const firstUnit = userUnits.find(u => u.id !== unitObjectToDelete.id) || { id: '', unit_name: '' };
      if (priceFormData?.unitId === unitObjectToDelete.id) { setPriceFormData(prev => ({ ...prev, unitId: firstUnit.id })); }
      if (editingTemplateData?.primary_input_unit_id === unitObjectToDelete.id) {
        setEditingTemplateData(prev => ({ ...prev, primary_input_unit_id: firstUnit.id }));
      }
    } catch (error) { console.error("Error deleting unit:", error); showToast('error', `Failed to delete unit: ${error.message}`); }
  }, [window_confirm, userId, apiService, setUserUnits, showToast, priceFormData, setPriceFormData, editingTemplateData, setEditingTemplateData, userUnits, materialPrices, userWorkItemTemplates]);


  const handleAddNewCashFlowCategory = useCallback(async () => {
    if (!newCashFlowCategoryName.trim()) { showToast('error', 'Category name cannot be empty.'); return; }
    if (userCashFlowCategories.some(c => c.category_name.toLowerCase() === newCashFlowCategoryName.trim().toLowerCase())) {
      showToast('error', `Category "${newCashFlowCategoryName.trim()}" already exists.`); return;
    }
    try {
      const addedCategory = await apiService.addCashFlowCategoryApi(userId, newCashFlowCategoryName.trim());
      setUserCashFlowCategories(prev => [...prev, addedCategory].sort((a, b) => a.category_name.localeCompare(b.category_name)));
      setNewCashFlowCategoryName(''); showToast('success', `Cash flow category "${addedCategory.category_name}" added.`);
    } catch (error) { console.error("Error adding cash flow category:", error); showToast('error', `Failed to add cash flow category: ${error.message}`); }
  }, [newCashFlowCategoryName, userCashFlowCategories, userId, apiService, setUserCashFlowCategories, setNewCashFlowCategoryName, showToast]);

  const handleDeleteCashFlowCategory = useCallback(async (categoryObjectToDelete) => {
     // Check if the category is used in any project's cash flow entries
    let isUsed = false;
    for (const proj of projects) {
        if (proj.cashFlowEntries && proj.cashFlowEntries.some(entry => entry.category_id === categoryObjectToDelete.id)) {
            isUsed = true;
            break;
        }
    }
    // Also check currentProject if it's loaded and has cash flow entries
    if (!isUsed && currentProject && currentProject.cashFlowEntries && currentProject.cashFlowEntries.some(entry => entry.category_id === categoryObjectToDelete.id)) {
        isUsed = true;
    }

    if (isUsed) {
        showToast('error', `Cash flow category "${categoryObjectToDelete.category_name}" is in use and cannot be deleted.`);
        return;
    }

    if (!await window_confirm(`Delete cash flow category "${categoryObjectToDelete.category_name}"?`)) return;
    try {
      await apiService.deleteCashFlowCategoryApi(userId, categoryObjectToDelete.id);
      setUserCashFlowCategories(prev => prev.filter(cat => cat.id !== categoryObjectToDelete.id));
      showToast('success', `Cash flow category "${categoryObjectToDelete.category_name}" deleted.`);
      if (cashFlowFormData?.categoryId === categoryObjectToDelete.id) {
        setCashFlowFormData(prev => ({ ...prev, categoryId: (userCashFlowCategories.find(c => c.id !== categoryObjectToDelete.id) || { id: '' }).id }));
      }
    } catch (error) { console.error("Error deleting cash flow category:", error); showToast('error', `Failed to delete cash flow category: ${error.message}`); }
  }, [window_confirm, userId, apiService, setUserCashFlowCategories, showToast, cashFlowFormData, setCashFlowFormData, userCashFlowCategories, projects, currentProject]);


  

  const copyUserIdToClipboard = useCallback(() => {
    if (userId) {
      const tempInput = document.createElement('input');
      tempInput.value = userId;
      document.body.appendChild(tempInput);
      tempInput.select();
      try {
        document.execCommand('copy');
        showToast('success', 'User ID copied!');
      } catch (err) {
        showToast('error', 'Failed to copy User ID.');
        console.error('Failed to copy User ID: ', err);
      }
      document.body.removeChild(tempInput);
    }
  }, [userId, showToast]);

    

    const handleUnarchiveProject = useCallback(async (projectIdToUnarchive) => {
        if (!await window_confirm('Apakah Anda yakin ingin membatalkan pengarsipan proyek ini?')) return;
        try {
            await apiService.unarchiveProjectApi(userId, projectIdToUnarchive);
            setArchivedProjects(prev => prev.filter(p => p.id !== projectIdToUnarchive));
            // If on active projects view, refetch or optimistically add
             if (currentView === 'projects' || currentView === 'cashFlowSummary') {
                apiService.fetchProjects(userId).then(data => setProjects(data || []));
            }
            showToast('success', 'Proyek berhasil dibatalkan pengarsipannya!');
        } catch (error) {
            console.error("Error unarchiving project:", error);
            showToast('error', `Gagal untuk membatalkan pengarsipan proyek: ${error.message}`);
        }
    }, [userId, window_confirm, showToast, currentView]);

const handleGenerateProjectReport = useCallback(async () => {
    if (!reportContentRef.current || !currentProject) {
        showToast('error', 'Konten laporan tidak ditemukan atau tidak ada proyek yang dipilih.');
        return;
    }

    setIsGeneratingReport(true);
    showToast('info', 'Membuat laporan PDF...');

    try {
        const canvas = await html2canvas(reportContentRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        
        // BENAR: Menggunakan 'new jsPDF' dengan 'P' kapital
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;

        const widthInPdf = pdfWidth - 20;
        const heightInPdf = widthInPdf / ratio;

        let position = 10;
        pdf.addImage(imgData, 'PNG', 10, position, widthInPdf, heightInPdf);
        let heightLeft = heightInPdf;

        heightLeft -= (pdfHeight - 20);
        while (heightLeft > 0) {
            position = -heightLeft - 10;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, widthInPdf, heightInPdf);
            heightLeft -= (pdfHeight - 20);
        }

        const fileName = `Laporan Proyek - ${currentProject.project_name.replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);

        showToast('success', 'Laporan PDF berhasil dibuat!');
    } catch (error) {
        console.error("Gagal membuat PDF:", error);
        showToast('error', `Gagal membuat PDF: ${error.message}`);
    } finally {
        setIsGeneratingReport(false);
    }
}, [currentProject, reportContentRef, showToast]);

const roleDisplayNames = {
    admin: 'Admin',
    staff_operasional: 'Staff Operasional'
};

 

  useEffect(() => {
      if (workItemFormData.templateKey) {
          const template = userWorkItemTemplates[workItemFormData.templateKey];
          if (template) {
              const schema = template.calculation_schema_type ? CALCULATION_SCHEMAS[template.calculation_schema_type] : null;
              const newParamValues = {};
              if (schema && !schema.isSimple) {
                  schema.inputs.forEach(inputDef => {
                      newParamValues[inputDef.key] = inputDef.defaultValue !== undefined ? String(inputDef.defaultValue) : '';
                  });
              }
              setWorkItemFormData(prev => ({
                  ...prev,
                  primaryInputValue: '', // Clear old simple input
                  parameterValues: newParamValues // Set defaults for new schema
              }));
          }
      } else {
           setWorkItemFormData(prev => ({
                ...prev,
                primaryInputValue: '',
                parameterValues: {}
           }));
      }
  }, [workItemFormData.templateKey, userWorkItemTemplates]);

  useEffect(() => {
        if (userRole && !navigableViews.includes(currentView)) {
            setCurrentView('projects'); // Halaman default
        }
    }, [currentView, userRole, navigableViews]);


    if (isAuthLoading) {
        // Tampilan loading awal dari AuthProvider
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-700 p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
              <p className="ml-3 text-lg">Memuat Sesi...</p>
            </div>
        );
    }

  // --- Effect Hooks (useEffect) ---
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (userRole && !navigableViews.includes(currentView)) {
     setCurrentView('projects');
     }
   }, [currentView, userRole, navigableViews]);


  useEffect(() => {
    if (!userId) { setUserWorkItemCategories([]); return; }
    apiService.fetchWorkItemCategories(userId)
      .then(data => setUserWorkItemCategories(data || []))
      .catch(err => {
        showToast('error', 'Failed to load work item categories.');
        console.error(err);
        setUserWorkItemCategories(DEFAULT_WORK_ITEM_CATEGORIES_FALLBACK.map(c => ({ id: c.id, category_name: c.name })));
      });
  }, [userId, showToast]);

  useEffect(() => {
    if (!userId) { setUserUnits([]); return; }
    apiService.fetchUserUnits(userId)
      .then(data => setUserUnits(data || []))
      .catch(err => {
        showToast('error', 'Failed to load units.');
        console.error(err);
        setUserUnits(DEFAULT_UNITS_FALLBACK.map(u => ({ id: u.id, unit_name: u.name })));
      });
  }, [userId, showToast]);

  useEffect(() => {
    if (!userId) { setUserCashFlowCategories([]); return; }
    apiService.fetchCashFlowCategories(userId)
      .then(data => setUserCashFlowCategories(data || []))
      .catch(err => {
        showToast('error', 'Failed to load cash flow categories.');
        console.error(err);
        setUserCashFlowCategories(DEFAULT_CASH_FLOW_CATEGORIES_FALLBACK.map(c => ({ id: c.id, category_name: c.name })));
      });
  }, [userId, showToast]);

  useEffect(() => {
    if (userUnits.length > 0 && !priceFormData.unitId) {
      setPriceFormData(prev => ({ ...prev, unitId: userUnits[0].id }));
      setUnitSelectionMode('select');
    }
  }, [userUnits, priceFormData.unitId, setPriceFormData, setUnitSelectionMode]);

  useEffect(() => {
    if (userCashFlowCategories.length > 0 && !cashFlowFormData.categoryId) {
      setCashFlowFormData(prev => ({ ...prev, categoryId: userCashFlowCategories[0].id }));
    }
  }, [userCashFlowCategories, cashFlowFormData.categoryId, setCashFlowFormData]);

  

  useEffect(() => {
    if (!userId) {
      setUserWorkItemTemplates({});
      if (currentView === 'workItemDefinitions') setIsLoading(false);
      return;
    }
    if (currentView === 'workItemDefinitions' || (currentView === 'projects' && currentProject)) {
      if (currentView === 'workItemDefinitions') setIsLoading(true); // Only set loading for this view
      apiService.fetchWorkItemDefinitions(userId)
        .then(data => {
          const loadedTemplates = {};
          (data || []).forEach(template => {
            loadedTemplates[template.id] = { ...template, key: template.id };
          });
          setUserWorkItemTemplates(loadedTemplates);
        })
        .catch(error => {
          console.error("Error fetching work item definitions:", error);
          showToast('error', `Error fetching definitions: ${error.message}`);
          setUserWorkItemTemplates({});
        })
        .finally(() => {
            if (currentView === 'workItemDefinitions') setIsLoading(false);
        });
    } else if (currentView === 'workItemDefinitions') { // If conditions not met but on this view
        setIsLoading(false);
    }
  }, [userId, currentView, showToast, currentProject, setIsLoading]); // Added setIsLoading

  useEffect(() => { // New effect for ARCHIVED projects
        if (!userId) {
            setArchivedProjects([]);
            if (currentView === 'archivedProjects') setIsLoading(false);
            return;
        }
        if (currentView === 'archivedProjects') {
            setIsLoading(true);
            apiService.fetchArchivedProjectsApi(userId)
                .then(data => {
                    setArchivedProjects(data || []);
                })
                .catch(error => {
                    console.error("Error fetching archived projects:", error);
                    showToast('error', `Error fetching archived projects: ${error.message}`);
                    setArchivedProjects([]);
                })
                .finally(() => setIsLoading(false));
        }
    }, [userId, currentView, showToast]);

      useEffect(() => {
    // Set the default selected month to the current month when the component mounts
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-indexed, +1 for human-readable month
    setSelectedCashFlowMonth(`${year}-${month}`);
  }, []);

    useEffect(() => {
    if (currentView === 'cashFlowSummary' && userId && selectedCashFlowMonth) {
      setIsLoadingCashFlowSummary(true);
      setCashFlowSummaryData(null); // Clear previous data while loading new
      apiService.fetchCashFlowSummaryByMonthApi(userId, selectedCashFlowMonth)
        .then(data => {
          setCashFlowSummaryData(data);
        })
        .catch(error => {
          console.error("App.js - Error fetching cash flow summary:", error);
          showToast('error', `Failed to load cash flow summary: ${error.message}`);
          setCashFlowSummaryData({ // Set a default structure on error to prevent crashes in view
              selectedMonth: selectedCashFlowMonth,
              overallSummary: { totalOverallIncome: 0, totalOverallExpenses: 0, totalOverallNetCashFlow: 0 },
              projectMonthlySummaries: [],
              availableMonths: cashFlowSummaryData?.availableMonths || [] // try to preserve old available months
          });
        })
        .finally(() => {
          setIsLoadingCashFlowSummary(false);
        });
    }
  }, [currentView, userId, selectedCashFlowMonth, showToast]);

  useEffect(() => { // New effect for ARCHIVED projects
    if (!userId) {
        setArchivedProjects([]);
        if (currentView === 'archivedProjects') setIsLoading(false);
        return;
    }
    if (currentView === 'archivedProjects') {
        // TAMBAHKAN LOG 1
        console.log('Mencoba mengambil proyek arsip...');
        setIsLoading(true);
        apiService.fetchArchivedProjectsApi(userId)
            .then(data => {
                // TAMBAHKAN LOG 2
                console.log('Data arsip yang diterima:', data);
                setArchivedProjects(data || []);
            })
            .catch(error => {
                console.error("Error fetching archived projects:", error);
                showToast('error', `Error fetching archived projects: ${error.message}`);
                setArchivedProjects([]);
            })
            .finally(() => setIsLoading(false));
    }
}, [userId, currentView, showToast]);

  if (!userId) {
    return (
      <LoginPage // Assuming LoginPage is themed separately or adapts
        onLogin={handleLogin}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
      />
    );
  }

  // --- Main App UI ---
  console.log('Menampilkan KONTEN HALAMAN PROYEK...');
  return (
    // Changed main background and text color
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans p-4 md:p-8">
      <Toast toastMessage={toastMessage} />
      <ConfirmModal confirmModal={confirmModal} />
      <InsightsModal
        showInsightsModal={showInsightsModal}
        setShowInsightsModal={setShowInsightsModal}
        currentProject={currentProject}
        isFetchingProjectInsights={isFetchingProjectInsights}
        projectInsights={projectInsights}
      />
      <ManageWorkItemCategoriesModal
        showManageCategoriesModal={showManageCategoriesModal}
        setShowManageCategoriesModal={setShowManageCategoriesModal}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        handleAddNewWorkItemCategory={handleAddNewWorkItemCategory}
        userWorkItemCategories={userWorkItemCategories}
        handleDeleteWorkItemCategory={handleDeleteWorkItemCategory}
      />
      <ManageUnitsModal
        showManageUnitsModal={showManageUnitsModal}
        setShowManageUnitsModal={setShowManageUnitsModal}
        newUnitName={newUnitName}
        setNewUnitName={setNewUnitName}
        handleAddNewUnit={handleAddNewUnit}
        userUnits={userUnits}
        handleDeleteUnit={handleDeleteUnit}
      />
      <ManageCashFlowCategoriesModal
        showManageCashFlowCategoriesModal={showManageCashFlowCategoriesModal}
        setShowManageCashFlowCategoriesModal={setShowManageCashFlowCategoriesModal}
        newCashFlowCategoryName={newCashFlowCategoryName}
        setNewCashFlowCategoryName={setNewCashFlowCategoryName}
        handleAddNewCashFlowCategory={handleAddNewCashFlowCategory}
        userCashFlowCategories={userCashFlowCategories}
        handleDeleteCashFlowCategory={handleDeleteCashFlowCategory}
      />

<header className="fixed top-0 left-0 w-full z-50 bg-gray-100 pt-6 pb-2 border-b border-gray-300 shadow-md">
    <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <h1 className="text-4xl font-bold text-sky-500 mb-4 md:mb-0">Rencana Anggaran Biaya Proyek Konstruksi</h1>
        <div className="flex items-center">
            <nav className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 bg-white p-1.5 rounded-lg shadow-md">
                {/* Tombol Navigasi Utama */}
                {mainNavItems.map(view => (
                    <button key={view} onClick={() => setCurrentView(view)}
                        className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors flex items-center ${
                            currentView === view ? 'bg-sky-500 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200 hover:text-sky-600'
                        }`}
                    >
                        {view === 'projects' ? <Briefcase size={16} className="mr-1.5"/> :
                            view === 'materialPrices' ? <DollarSign size={16} className="mr-1.5"/> :
                            view === 'workItemDefinitions' ? <ClipboardList size={16} className="mr-1.5"/> :
                            <PieChart size={16} className="mr-1.5"/>}
                        {view === 'projects' ? 'Proyek' :
                            view === 'materialPrices' ? 'Harga' :
                            view === 'workItemDefinitions' ? 'Item Pekerjaan' :
                            'Ringkasan Total RAB'}
                    </button>
                ))}
                <button
                    onClick={handleLogout}
                    title="Logout"
                    className="px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium bg-red-600 hover:bg-red-500 text-white shadow-md transition-colors flex items-center"
                >
                    <LogOut size={16} className="mr-0 sm:mr-1.5"/>
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </nav>
        </div>
    </div>
    {userRole && (
        <div className="container mx-auto flex justify-end mt-2 pr-4 md:pr-0">
            <div className="text-xs text-gray-500 flex items-center">
                <span className="font-normal mr-1.5">Peran:</span>
                <span className="font-semibold">{roleDisplayNames[userRole] || userRole}</span>
            </div>
        </div>
    )}
</header>

      <main className="container mx-auto pt-20">
          {isLoading && (
            (currentView === 'materialPrices' && materialPrices.length === 0) ||
            (currentView === 'projects' && projects.length === 0 && !showProjectForm && !currentProject) ||
            (currentView === 'workItemDefinitions' && Object.keys(userWorkItemTemplates).length === 0 && !showTemplateForm) ||
            (currentView === 'cashFlowSummary' && projects.length === 0)
         ) && (
          <div className="flex items-center justify-center mt-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
            {/* Changed loading text color */}
            <p className="ml-3 text-lg text-gray-600">Loading {
              currentView === 'cashFlowSummary' ? 'Cash Flow Summary' :
              currentView === 'materialPrices' ? 'Material Prices' :
              currentView === 'workItemDefinitions' ? 'Work Item Definitions' :
              'Projects'
            }...</p>
          </div>
        )}

        {/* The views below (MaterialPricesView, ProjectsView, etc.) will need their own internal theming */}
        {!isLoading || (currentView === 'materialPrices' && materialPrices.length > 0) || showPriceForm ? (
          currentView === 'materialPrices' && (
            <MaterialPricesView
            // Hanya ini props yang perlu diteruskan! Jauh lebih bersih.
            showToast={showToast}
            window_confirm={window_confirm}
            userUnits={userUnits}
            setShowManageUnitsModal={setShowManageUnitsModal}
            onUnitAdded={handleUnitAdded} 
        />
          )
        ) : null}

        {!isLoading || (currentView === 'projects' && (projects.length > 0 || showProjectForm || currentProject)) ? (
           currentView === 'projects' && (
            <ProjectsView
            showToast={showToast}
            window_confirm={window_confirm}
            setCurrentView={setCurrentView} // Untuk tombol 'Lihat Arsip'
            setShowInsightsModal={setShowInsightsModal} // Modal bersifat global
            userRole={userRole} // userRole bersifat global dari useAuth
            />
          )
        ) : null}


        {!isLoading || (currentView === 'workItemDefinitions' && (Object.keys(userWorkItemTemplates).length > 0 || showTemplateForm)) ? (
            currentView === 'workItemDefinitions' && (
                <WorkItemDefinitionsView
                showToast={showToast}
                window_confirm={window_confirm}
                setShowManageCategoriesModal={setShowManageCategoriesModal}
                setShowManageUnitsModal={setShowManageUnitsModal} 
                />
            )
        ) : null}


          {!isLoading || (currentView === 'cashFlowSummary' && projects.length > 0) ? (
          currentView === 'cashFlowSummary' && userRole === 'admin' && (
          <CashFlowSummaryView
            cashFlowSummaryData={cashFlowSummaryData}
            isLoadingSummary={isLoadingCashFlowSummary}
            selectedMonth={selectedCashFlowMonth} // This is still the App.js state for the filter
            setSelectedMonth={setSelectedCashFlowMonth} // To change the filter
          />
          )
        ) : null}

              {!isLoading || (currentView === 'archivedProjects' && archivedProjects.length > 0) ? (
        currentView === 'archivedProjects' && userRole === 'admin' && (
          <ArchivedProjectsListView // You might need to create this component
            archivedProjects={archivedProjects}
            isLoading={isLoading && archivedProjects.length === 0}
            handleUnarchiveProject={handleUnarchiveProject}
            // Potentially pass handleSelectProject if you want to view details of archived projects (read-only)
            // Potentially pass handleDeleteProject if permanent deletion from archive is a feature
          />
        )
      ) : null}

      </main>

    <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <ProjectReport ref={reportContentRef} project={currentProject} />
    </div>

      {/* Changed footer border and text color */}
      <footer className="mt-12 pt-6 border-t border-gray-300 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Sistem Informasi Rencana Anggaran Biaya  </p>
        <p className="mt-1"></p>
      </footer>
    </div>
  );
}

function AppWrapper() {
  return (
    <AuthProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </AuthProvider>
  );
}

export default AppWrapper;