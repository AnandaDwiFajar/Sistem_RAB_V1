import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, query, getDoc, updateDoc } from 'firebase/firestore';
import { ChevronDown, ChevronUp, PlusCircle, Trash2, Edit3, Save, XCircle, AlertTriangle, Info, DollarSign, Briefcase, Copy, ClipboardList, FilePlus, Sparkles, Loader2, Settings, CheckCircle, TrendingUp, TrendingDown, ListFilter, PieChart } from 'lucide-react';
import * as apiService from './services/apiService'; // Adjust path if needed

// --- Firebase Configuration ---
const firebaseConfig = typeof window.__firebase_config !== 'undefined' ? JSON.parse(window.__firebase_config) : {
  apiKey: "AIzaSyBHNm5cvd-pjcIA2s4X-tCzGymi5CEXDng", // Replace with your actual config OR ensure window.__firebase_config is set
  authDomain: "sistem-rab.firebaseapp.com",
  projectId: "sistem-rab",
  storageBucket: "sistem-rab.firebasestorage.app",
  messagingSenderId: "673801722173",
  appId: "1:673801722173:web:af20b061336004dd818d54",
  measurementId: "G-FZG9Q25LMT"
};


const appId = (typeof window.__app_id !== 'undefined' && window.__app_id)
    ? window.__app_id
    : (firebaseConfig.appId && firebaseConfig.appId !== "YOUR_APP_ID" // Check it's not the placeholder
        ? firebaseConfig.appId 
        : 'default-budget-app');
// --- Initialize Firebase ---
let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // import { setLogLevel } from "firebase/firestore"; // Import if you want to use it
    // setLogLevel('debug'); 
} catch (error) {
    console.error("Error initializing Firebase:", error);
}

// --- Default Dropdown Options (will be used to initialize Firestore for new users) ---
const DEFAULT_WORK_ITEM_CATEGORIES = [
  "Pekerjaan Persiapan", "Pekerjaan Tanah", "Pekerjaan Pondasi", "Pekerjaan Beton", 
  "Pekerjaan Dinding", "Pekerjaan Plesteran & Acian", "Pekerjaan Kusen, Pintu & Jendela",
  "Pekerjaan Atap", "Pekerjaan Plafond", "Pekerjaan Lantai", "Pekerjaan Sanitasi",
  "Pekerjaan Pengecatan", "Pekerjaan Listrik", "Pekerjaan Lain-lain", "Uncategorized"
];

const DEFAULT_PRIMARY_INPUT_LABELS = [ // These remain constants for now
  "Volume", "Luas", "Luas Datar", "Panjang", "Jumlah", "Set", "Titik", "Unit", "Durasi"
];

const DEFAULT_PRIMARY_INPUT_UNITS = [
  "m³", "m²", "m", "bh", "ls", "Zak", "kg", "Liter", "OH", "Set", "Titik", "Unit", "Hari", "Minggu", "Bulan"
];

const DEFAULT_CASH_FLOW_CATEGORIES = [
    "Pembayaran Klien (Termin)", "Pendapatan Lain-lain", 
    "Biaya Material Konstruksi", "Upah Tenaga Kerja Langsung", "Biaya Subkontraktor", 
    "Sewa Peralatan", "Biaya Perizinan & Legal", "Biaya Operasional Proyek", 
    "Biaya Overhead Kantor", "Pengeluaran Tak Terduga", "Lain-lain", "Budgeted Work Item Cost" // Added for auto-entries
];

const OTHER_UNIT_MARKER = '---OTHER_UNIT---'; 

// --- Helper Functions ---
const formatCurrency = (amount, withColor = false) => {
  if (typeof amount !== 'number') return 'Rp 0';
  const formatted = `Rp ${amount.toLocaleString('id-ID')}`;
  if (withColor) {
    if (amount > 0) return <span className="text-green-400">{formatted}</span>;
    if (amount < 0) return <span className="text-red-400">{formatted}</span>;
  }
  return formatted;
};
const generateId = () => crypto.randomUUID();
const slugify = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
};

// --- Main App Component ---
function App() {
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [currentView, setCurrentView] = useState('projects'); 
  const [currentProjectView, setCurrentProjectView] = useState('workItems'); // 'workItems' or 'cashFlow'

  // Meta Data State (Categories & Units)
  const [userCategories, setUserCategories] = useState([]);
  const [userUnits, setUserUnits] = useState([]);
  const [userCashFlowCategories, setUserCashFlowCategories] = useState([]);

  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showManageUnitsModal, setShowManageUnitsModal] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [showManageCashFlowCategoriesModal, setShowManageCashFlowCategoriesModal] = useState(false);
  const [newCashFlowCategoryName, setNewCashFlowCategoryName] = useState('');


  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isSavingDefinition, setIsSavingDefinition] = useState(false);
  const [isAddingWorkItem, setIsAddingWorkItem] = useState(false);
  const [isSuggestingComponents, setIsSuggestingComponents] = useState(false);
  const [isFetchingProjectInsights, setIsFetchingProjectInsights] = useState(false);
  const [isSavingCashFlowEntry, setIsSavingCashFlowEntry] = useState(false);


  const [materialPrices, setMaterialPrices] = useState([]);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null); 
  const [priceFormData, setPriceFormData] = useState({ name: '', unit: '', price: '' });
  const [unitSelectionMode, setUnitSelectionMode] = useState('select'); 

  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectFormData, setProjectFormData] = useState({ projectName: '' });
  const [projectInsights, setProjectInsights] = useState('');
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  const [showWorkItemForm, setShowWorkItemForm] = useState(false);
  const [workItemFormData, setWorkItemFormData] = useState({ templateKey: '', primaryInputValue: '' });
  const [calculatedWorkItemPreview, setCalculatedWorkItemPreview] = useState(null);
  
  const [userWorkItemTemplates, setUserWorkItemTemplates] = useState({}); 
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplateData, setEditingTemplateData] = useState(null); 
  const [selectedTemplateKeyForEditing, setSelectedTemplateKeyForEditing] = useState(null);

  // Cash Flow State
  const [showCashFlowForm, setShowCashFlowForm] = useState(false);
  const [cashFlowFormData, setCashFlowFormData] = useState({ date: new Date().toISOString().split('T')[0], description: '', type: 'expense', amount: '', category: ''});
  const [editingCashFlowEntry, setEditingCashFlowEntry] = useState(null);

  const [toastMessage, setToastMessage] = useState(null); 
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null, onCancel: null });

  // Firebase Path Helpers
  const getUserMetaDocRef = useCallback((metaType) => { // metaType: 'categories', 'units', or 'cashFlowCategories'
    if (!db || !userId) return null;
    return doc(db, `artifacts/${appId}/users/${userId}/meta`, `${metaType}Doc`);
  }, [userId, appId]);


  useEffect(() => {
    if (!auth) {
        console.error("Firebase Auth is not initialized. Check Firebase config.");
        setIsLoading(false); setIsAuthReady(false);
        setToastMessage({type: 'error', message: 'Firebase Auth Error. Config missing?'});
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) { setUserId(user.uid); } 
      else {
        try {
            if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
                await signInWithCustomToken(auth, window.__initial_auth_token);
            } else { await signInAnonymously(auth); }
        } catch (error) {
            console.error("Error signing in:", error);
            setToastMessage({type: 'error', message: `Sign-in error: ${error.message}`});
        }
      }
      setIsAuthReady(true); 
    });
    return () => unsubscribe();
  }, []);

  // Load User Categories (Work Item Categories)
  useEffect(() => {
    if (!isAuthReady || !userId) { setUserCategories([]); return; }
    const categoriesDocRef = getUserMetaDocRef('categories');
    if (!categoriesDocRef) return;

    const unsubscribe = onSnapshot(categoriesDocRef, async (docSnap) => {
        if (docSnap.exists()) {
            setUserCategories(docSnap.data().list || []);
        } else {
            await setDoc(categoriesDocRef, { list: DEFAULT_WORK_ITEM_CATEGORIES });
            setUserCategories(DEFAULT_WORK_ITEM_CATEGORIES);
        }
    }, (error) => {
        console.error("Error fetching user work item categories:", error);
        showToast('error', 'Failed to load work item categories.');
        setUserCategories(DEFAULT_WORK_ITEM_CATEGORIES); 
    });
    return () => unsubscribe();
  }, [isAuthReady, userId, getUserMetaDocRef]);

  

// New version using apiService
useEffect(() => {
    if (!isAuthReady || !userId) {
        setUserUnits([]); // Keep existing state structure for now: array of strings
        return;
    }
    // Assuming userId is available from Firebase Auth
    setIsLoading(true); // Or a more specific loading state
    apiService.fetchUserUnits(userId)
        .then(data => { // Backend now sends array of objects: [{id, unit_name}, ...]
            // To match current userUnits (array of strings) for minimal changes elsewhere:
            setUserUnits(data.map(u => u.unit_name) || []);
            // IDEALLY: setUserUnits(data || []); and update components to use objects with IDs
        })
        .catch(error => {
            console.error("Error fetching user units from backend:", error);
            showToast('error', `Failed to load units: ${error.message}`);
            setUserUnits(DEFAULT_PRIMARY_INPUT_UNITS); // Fallback
        })
        .finally(() => {
            // Make sure the correct isLoading flag is set
            if (currentView === 'materialPrices' || currentView === 'workItemDefinitions') { // Or any view that relies on units
               // This specific isLoading might need more granular control
            }
            // General loading for this fetch:
            // setIsLoading(false); // Handled by view-specific loading logic in your app
        });
}, [isAuthReady, userId, showToast]); // Removed getUserMetaDocRef, added showToast if it's a dependency

  // Load User Cash Flow Categories
  useEffect(() => {
    if (!isAuthReady || !userId) { setUserCashFlowCategories([]); return; }
    const cfCategoriesDocRef = getUserMetaDocRef('cashFlowCategories');
    if (!cfCategoriesDocRef) return;

    const unsubscribe = onSnapshot(cfCategoriesDocRef, async (docSnap) => {
        if (docSnap.exists()) {
            setUserCashFlowCategories(docSnap.data().list || []);
        } else {
            await setDoc(cfCategoriesDocRef, { list: DEFAULT_CASH_FLOW_CATEGORIES });
            setUserCashFlowCategories(DEFAULT_CASH_FLOW_CATEGORIES);
        }
    }, (error) => {
        console.error("Error fetching user cash flow categories:", error);
        showToast('error', 'Failed to load cash flow categories.');
        setUserCashFlowCategories(DEFAULT_CASH_FLOW_CATEGORIES); 
    });
    return () => unsubscribe();
  }, [isAuthReady, userId, getUserMetaDocRef]);

  // Initialize form defaults when categories/units are loaded
    useEffect(() => {
        if (userUnits.length > 0 && priceFormData.unit === '') {
            setPriceFormData(prev => ({ ...prev, unit: userUnits[0] || '' }));
            setUnitSelectionMode('select');
        }
    }, [userUnits, priceFormData.unit]); 

    useEffect(() => {
        if (userCashFlowCategories.length > 0 && cashFlowFormData.category === '') {
           setCashFlowFormData(prev => ({ ...prev, category: userCashFlowCategories[0] || '' }));
        }
    }, [userCashFlowCategories, cashFlowFormData.category]); 


  const getMaterialPricesCollection = useCallback(() => (db && userId ? collection(db, `artifacts/${appId}/users/${userId}/materialPrices`) : null), [userId, appId]);
  const getProjectsCollection = useCallback(() => (db && userId ? collection(db, `artifacts/${appId}/users/${userId}/projects`) : null), [userId, appId]);
  const getWorkItemDefinitionsCollection = useCallback(() => (db && userId ? collection(db, `artifacts/${appId}/users/${userId}/workItemDefinitions`) : null), [userId, appId]);

  useEffect(() => { if (toastMessage) { const timer = setTimeout(() => setToastMessage(null), 3000); return () => clearTimeout(timer);}}, [toastMessage]);
  const showToast = (type, message) => setToastMessage({ type, message });
  const window_confirm = (message) => new Promise((resolve) => setConfirmModal({ isOpen: true, message, onConfirm: () => { setConfirmModal({ isOpen: false }); resolve(true); }, onCancel: () => { setConfirmModal({ isOpen: false }); resolve(false); }}));

useEffect(() => {
    if (!isAuthReady || !userId) {
        if(currentView === 'materialPrices') setIsLoading(false);
        setMaterialPrices([]);
        return;
    }
    if (currentView === 'materialPrices') {
        setIsLoading(true);
        apiService.fetchMaterialPrices(userId)
            .then(data => {
                // Backend sends: { id, name, unit (string, from join), price }
                setMaterialPrices(data || []);
            })
            .catch(error => {
                console.error("Error fetching material prices:", error);
                showToast('error', `Error fetching prices: ${error.message}`);
                setMaterialPrices([]);
            })
            .finally(() => setIsLoading(false));
    }
}, [isAuthReady, userId, currentView, showToast]);

 useEffect(() => {
    if (!isAuthReady || !userId) { if(currentView === 'projects' || currentView === 'cashFlowSummary') setIsLoading(false); return; }
    const projsCollection = getProjectsCollection();
    if (!projsCollection) { if(currentView === 'projects' || currentView === 'cashFlowSummary') setIsLoading(false); return; }
    if (currentView === 'projects' || currentView === 'cashFlowSummary') setIsLoading(true);
    const unsubscribe = onSnapshot(query(projsCollection), (snapshot) => {
      const fetchedProjects = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          cashFlowEntries: doc.data().cashFlowEntries || [], 
          actualIncome: doc.data().actualIncome || 0,
          actualExpenses: doc.data().actualExpenses || 0,
          netCashFlow: (doc.data().actualIncome || 0) - (doc.data().actualExpenses || 0)
      }));
      setProjects(fetchedProjects);
      if (currentProjectId) {
          const updatedCurrentProject = fetchedProjects.find(p => p.id === currentProjectId);
          if (updatedCurrentProject) {
            setCurrentProject({
                ...updatedCurrentProject,
                netCashFlow: (updatedCurrentProject.actualIncome || 0) - (updatedCurrentProject.actualExpenses || 0)
            });
          } else {
            setCurrentProject(null); 
          }
      }
      if (currentView === 'projects' || currentView === 'cashFlowSummary') setIsLoading(false);
    }, (error) => { console.error("Error fetching projects:", error); showToast('error', `Error fetching projects: ${error.message}`); if (currentView === 'projects' || currentView === 'cashFlowSummary') setIsLoading(false);});
    return () => unsubscribe();
  }, [isAuthReady, userId, currentProjectId, getProjectsCollection, currentView]);

  useEffect(() => {
    if (!isAuthReady || !userId) { setUserWorkItemTemplates({}); setIsLoading(false); return; }
    const definitionsCollection = getWorkItemDefinitionsCollection();
    if (!definitionsCollection) { setUserWorkItemTemplates({}); setIsLoading(false); return; }
    if (currentView === 'workItemDefinitions' || Object.keys(userWorkItemTemplates).length === 0) {
      setIsLoading(true);
    }
    const unsubscribe = onSnapshot(query(definitionsCollection), (snapshot) => {
        const loadedTemplates = {};
        snapshot.docs.forEach(doc => {
            loadedTemplates[doc.id] = { ...doc.data(), key: doc.id };
        });
        setUserWorkItemTemplates(loadedTemplates);
        setIsLoading(false); 
    }, (error) => {
        console.error("Error fetching work item definitions:", error);
        showToast('error', `Error fetching definitions: ${error.message}`);
        setUserWorkItemTemplates({}); 
        setIsLoading(false); 
    });
    return () => unsubscribe();
  }, [isAuthReady, userId, getWorkItemDefinitionsCollection, currentView]);

  const handlePriceFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "unitSelector") { 
        if (value === OTHER_UNIT_MARKER) {
            setUnitSelectionMode('custom');
            if (userUnits.includes(priceFormData.unit)) {
                 setPriceFormData(prev => ({ ...prev, unit: '' }));
            }
        } else { 
            setUnitSelectionMode('select');
            setPriceFormData(prev => ({ ...prev, unit: value }));
        }
    } else { 
        setPriceFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSavePrice = async () => {
    if (!priceFormData.name || !priceFormData.unitId || !priceFormData.price) {
        showToast('error', 'All price fields (name, unit, price) are required.'); return;
    }
    if (!pricesCollection) { showToast('error', 'Database not ready.'); return; }
    const priceValue = parseFloat(priceFormData.price);
    if (isNaN(priceValue) || priceValue < 0) { showToast('error', 'Invalid price amount.'); return; }
    
    const newPriceData = { name: priceFormData.name.trim(), unit: priceFormData.unit.trim(), price: priceValue };
    const pricePayload = {
        item_name: priceFormData.name.trim(),
        unit_id: priceFormData.unitId, // This now needs to be the ID
        price: parseFloat(priceFormData.price)
    };
    
    setIsSavingPrice(true);
    try {
        let savedPriceData;
        if (editingPrice) { // editingPrice should also store its unit_id
            savedPriceData = await apiService.updateMaterialPriceApi(editingPrice.id, pricePayload, userId);
            showToast('success', 'Price updated!');
      } else {
        const existing = materialPrices.find(p => p.name.toLowerCase() === newPriceData.name.toLowerCase() && p.unit.toLowerCase() === newPriceData.unit.toLowerCase());
        if (existing) { showToast('error', `Price for '${newPriceData.name}' (${newPriceData.unit}) already exists.`); setIsSavingPrice(false); return; }
        await addDoc(pricesCollection, newPriceData);
        savedPriceData = await apiService.addMaterialPriceApi(userId, pricePayload);
        showToast('success', 'Price added!');
      }
        if (editingPrice) {
            setMaterialPrices(prev => prev.map(p => p.id === editingPrice.id ? { ...savedPriceData, name: savedPriceData.item_name, unit: savedPriceData.unit_name } : p));
        } else {
             // Backend now returns item_name, unit_name, etc.
            setMaterialPrices(prev => [...prev, { ...savedPriceData, name: savedPriceData.item_name, unit: savedPriceData.unit_name }]);
        }
        setPriceFormData({ name: '', unitId: (userUnits[0]?.id || ''), price: '' }); // Reset with first unit's ID
        setShowPriceForm(false);
        setEditingPrice(null);
    } catch (e) { console.error(e); showToast('error', `Save price error: ${e.message}`); }
    setIsSavingPrice(false);
  };

  const handleEditPrice = (price) => { 
    setEditingPrice(price);
    const isPredefinedUnit = userUnits.includes(price.unit);
    setUnitSelectionMode(isPredefinedUnit ? 'select' : 'custom');
    setPriceFormData({ name: price.name, unit: price.unit, price: price.price.toString() }); 
    setShowPriceForm(true); 
  };

  const handleDeletePrice = async (priceId) => {
    if (!await window_confirm(`Delete this price item?`)) return;
    const pricesCollection = getMaterialPricesCollection();
    if (!pricesCollection) { showToast('error', 'Database not ready.'); return; }
    try { await deleteDoc(doc(pricesCollection, priceId)); showToast('success', 'Price deleted!'); } 
    catch (e) { console.error(e); showToast('error', `Delete price error: ${e.message}`); }
  };

  const handleProjectFormChange = (e) => setProjectFormData({ ...projectFormData, [e.target.name]: e.target.value });
  const handleSaveProject = async () => {
    if (!projectFormData.projectName.trim()) { showToast('error', 'Project name required.'); return; }
    const projsCollection = getProjectsCollection();
    if (!projsCollection) { showToast('error', 'Database not ready.'); return; }
    const newProjectData = { 
        projectName: projectFormData.projectName.trim(), 
        workItems: [], 
        totalCalculatedBudget: 0, 
        createdAt: new Date().toISOString(), 
        userId,
        cashFlowEntries: [], 
        actualIncome: 0,
        actualExpenses: 0,
    };
    setIsSavingProject(true);
    try {
      const docRef = await addDoc(projsCollection, newProjectData);
      showToast('success', 'Project created!');
      setProjectFormData({ projectName: '' }); setShowProjectForm(false);
      setCurrentProjectId(docRef.id); setCurrentProject({ id: docRef.id, ...newProjectData, netCashFlow: 0 });
    } catch (e) { console.error(e); showToast('error', `Save project error: ${e.message}`); }
    setIsSavingProject(false);
  };
  const handleSelectProject = (projectId) => {
    const selected = projects.find(p => p.id === projectId);
    if (selected) { 
        setCurrentProjectId(projectId); 
        const projectWithInitializedCashFlow = {
            ...selected,
            cashFlowEntries: selected.cashFlowEntries || [],
            actualIncome: selected.actualIncome || 0,
            actualExpenses: selected.actualExpenses || 0,
        };
        projectWithInitializedCashFlow.netCashFlow = projectWithInitializedCashFlow.actualIncome - projectWithInitializedCashFlow.actualExpenses;
        setCurrentProject(projectWithInitializedCashFlow); 
        setCalculatedWorkItemPreview(null); 
        setWorkItemFormData({ templateKey: '', primaryInputValue: '' }); 
        setProjectInsights('');
        setCurrentProjectView('workItems'); 
    } else { 
        setCurrentProjectId(null); 
        setCurrentProject(null); 
        setProjectInsights('');
    }
  };
  const handleDeleteProject = async (projectIdToDelete) => {
    const projName = projects.find(p=>p.id === projectIdToDelete)?.projectName;
    if (!await window_confirm(`Delete project "${projName}"? This is irreversible.`)) return;
    const projsCollection = getProjectsCollection();
    if (!projsCollection) { showToast('error', 'Database not ready.'); return; }
    try {
      await deleteDoc(doc(projsCollection, projectIdToDelete));
      showToast('success', 'Project deleted!');
      if (currentProjectId === projectIdToDelete) { setCurrentProjectId(null); setCurrentProject(null); setProjectInsights('');}
    } catch (e) { console.error(e); showToast('error', `Delete project error: ${e.message}`); }
  };
  
  const handleWorkItemFormChange = (e) => {
    const { name, value } = e.target;
    setWorkItemFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'primaryInputValue' && workItemFormData.templateKey && value) previewWorkItemCalculation(workItemFormData.templateKey, value);
    else if (name === 'templateKey' && value && workItemFormData.primaryInputValue) previewWorkItemCalculation(value, workItemFormData.primaryInputValue);
    else if (!value && name === 'primaryInputValue') setCalculatedWorkItemPreview(null);
  };
  const previewWorkItemCalculation = (templateKey, primaryInputValueStr) => {
    if (!templateKey || !primaryInputValueStr) { setCalculatedWorkItemPreview(null); return; }
    const template = userWorkItemTemplates[templateKey]; 
    const primaryInputValue = parseFloat(primaryInputValueStr);
    if (!template || isNaN(primaryInputValue) || primaryInputValue <= 0) {
      setCalculatedWorkItemPreview(null);
      if (primaryInputValueStr && (isNaN(primaryInputValue) || primaryInputValue <= 0)) showToast('error', `Invalid input value for ${template?.primaryInput?.label || 'item'}.`);
      return;
    }
    let totalItemCost = 0;
    const calculatedComponents = template.components.map(comp => {
      const priceInfo = materialPrices.find(p => p.name === comp.priceListKey && p.unit === comp.unit);
      const pricePerUnit = priceInfo ? priceInfo.price : 0;
      if (!priceInfo && comp.type !== 'info') console.warn(`Price not found for ${comp.priceListKey} (${comp.unit}). Using Rp 0.`);
      const quantity = primaryInputValue * comp.coefficient;
      const cost = quantity * pricePerUnit;
      totalItemCost += cost;
      return { ...comp, quantity, pricePerUnit, cost };
    });
    setCalculatedWorkItemPreview({ templateKey, name: template.name, userInput: { [template.primaryInput.id]: primaryInputValue }, primaryInputDisplay: `${primaryInputValue} ${template.primaryInput.unit}`, components: calculatedComponents, totalItemCost });
  };

  const handleAddWorkItemToProject = async () => {
    if (!currentProject || !calculatedWorkItemPreview) { showToast('error', 'No project or item not calculated.'); return; }
    const projsCollection = getProjectsCollection();
    if (!projsCollection) { showToast('error', 'Database not ready.'); return; }
    
    const newWorkItem = { id: generateId(), ...calculatedWorkItemPreview, addedAt: new Date().toISOString() };
    const updatedWorkItems = [...(currentProject.workItems || []), newWorkItem];
    const newTotalBudget = updatedWorkItems.reduce((sum, item) => sum + item.totalItemCost, 0);

    const workItemTemplateDetails = userWorkItemTemplates[newWorkItem.templateKey];
    const cashFlowCategoryForWorkItem = workItemTemplateDetails?.category || 'Budgeted Work Item Cost';

    const autoCashFlowEntry = {
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        description: `Budgeted cost for: ${newWorkItem.name}`,
        type: 'expense',
        amount: newWorkItem.totalItemCost,
        category: cashFlowCategoryForWorkItem,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAutoGenerated: true,
        linkedWorkItemId: newWorkItem.id 
    };

    const updatedCashFlowEntries = [...(currentProject.cashFlowEntries || []), autoCashFlowEntry];
    
    let newActualIncome = currentProject.actualIncome || 0;
    let newActualExpenses = 0; 
    updatedCashFlowEntries.forEach(entry => {
        if (entry.type === 'expense') newActualExpenses += entry.amount;
        else if (entry.type === 'income') newActualIncome += entry.amount; // Ensure income is also recalculated if needed
    });


    setIsAddingWorkItem(true);
    try {
      await updateDoc(doc(projsCollection, currentProject.id), { 
          workItems: updatedWorkItems, 
          totalCalculatedBudget: newTotalBudget,
          cashFlowEntries: updatedCashFlowEntries,
          actualIncome: newActualIncome, 
          actualExpenses: newActualExpenses 
      });
      showToast('success', `Work item "${newWorkItem.name}" added & cash flow updated!`);
      setWorkItemFormData({ templateKey: '', primaryInputValue: '' }); setCalculatedWorkItemPreview(null); setShowWorkItemForm(false);
    } catch (e) { console.error(e); showToast('error', `Add work item error: ${e.message}`); }
    setIsAddingWorkItem(false);
  };

  const handleDeleteWorkItem = async (workItemId) => {
    if (!currentProject || !await window_confirm(`Delete this work item from project? This will also remove its auto-generated cash flow entry.`)) return;
    const projsCollection = getProjectsCollection();
    if (!projsCollection) { showToast('error', 'Database not ready.'); return; }

    const updatedWorkItems = currentProject.workItems.filter(item => item.id !== workItemId);
    const newTotalBudget = updatedWorkItems.reduce((sum, item) => sum + item.totalItemCost, 0);

    let updatedCashFlowEntries = [...(currentProject.cashFlowEntries || [])];
    updatedCashFlowEntries = updatedCashFlowEntries.filter(
        cfEntry => !(cfEntry.isAutoGenerated && cfEntry.linkedWorkItemId === workItemId)
    );

    let newActualIncome = 0;
    let newActualExpenses = 0;
    updatedCashFlowEntries.forEach(entry => {
        if (entry.type === 'income') newActualIncome += entry.amount;
        else newActualExpenses += entry.amount;
    });

    try {
      await updateDoc(doc(projsCollection, currentProject.id), { 
          workItems: updatedWorkItems, 
          totalCalculatedBudget: newTotalBudget,
          cashFlowEntries: updatedCashFlowEntries,
          actualIncome: newActualIncome, 
          actualExpenses: newActualExpenses 
      });
      showToast('success', 'Work item and linked cash flow entry deleted!');
    } catch (e) { console.error(e); showToast('error', `Delete work item error: ${e.message}`); }
  };

  const handleOpenTemplateForm = (templateKey = null) => {
    if (templateKey && userWorkItemTemplates[templateKey]) {
        const templateToEdit = JSON.parse(JSON.stringify(userWorkItemTemplates[templateKey])); 
        templateToEdit.components = templateToEdit.components.map(c => {
            const matchingPriceItem = materialPrices.find(p => p.name === c.priceListKey && p.unit === c.unit);
            return {...c, tempId: generateId(), selectedResourceId: matchingPriceItem ? matchingPriceItem.id : '' };
        });
        setEditingTemplateData(templateToEdit);
        setSelectedTemplateKeyForEditing(templateKey);
    } else { 
        setEditingTemplateData({
            key: '', name: '', category: userCategories[0] || 'Uncategorized', 
            primaryInput: { 
                id: 'volume', label: DEFAULT_PRIMARY_INPUT_LABELS[0], unit: userUnits[0] || '', type: 'number' 
            }, 
            components: [{ tempId: generateId(), name: '', priceListKey: '', unit: '', coefficient: 0, type: 'material', selectedResourceId: '' }],
        });
        setSelectedTemplateKeyForEditing(null);
    }
    setShowTemplateForm(true);
  };

  const handleTemplateFormChange = (field, value) => setEditingTemplateData(prev => ({ ...prev, [field]: value }));
  const handleTemplatePrimaryInputChange = (field, value) => setEditingTemplateData(prev => ({ ...prev, primaryInput: { ...prev.primaryInput, [field]: value }}));
  const handleTemplateComponentChange = (index, field, value) => {
    setEditingTemplateData(prev => {
        const updatedComponents = [...prev.components];
        if (field === 'selectedResourceId') {
            const selectedPriceItem = materialPrices.find(p => p.id === value);
            if (selectedPriceItem) {
                updatedComponents[index] = { ...updatedComponents[index], name: selectedPriceItem.name, priceListKey: selectedPriceItem.name, unit: selectedPriceItem.unit, selectedResourceId: value };
            } else { updatedComponents[index] = { ...updatedComponents[index], name: '', priceListKey: '', unit: '', selectedResourceId: '' }; }
        } else {
            updatedComponents[index] = { ...updatedComponents[index], [field]: field === 'coefficient' ? parseFloat(value) || 0 : value };
        }
        return { ...prev, components: updatedComponents };
    });
  };
  const handleAddTemplateComponent = () => setEditingTemplateData(prev => ({ ...prev, components: [...prev.components, { tempId: generateId(), name: '', priceListKey: '', unit: '', coefficient: 0, type: 'material', selectedResourceId: '' }]}));
  const handleRemoveTemplateComponent = (index) => setEditingTemplateData(prev => ({ ...prev, components: prev.components.filter((_, i) => i !== index)}));
  
  const handleSaveWorkItemTemplate = async () => {
    if (!editingTemplateData || !editingTemplateData.name.trim()) { showToast('error', 'Template name required.'); return; }
    if (editingTemplateData.components.some(c => !c.selectedResourceId && (!c.priceListKey || !c.unit) )) { showToast('error', 'Each component: select resource or fill Price Key & Unit.'); return; }
    if (editingTemplateData.components.some(c => !c.name.trim() )) { showToast('error', 'Each component needs a display name.'); return; }

    const definitionsCollection = getWorkItemDefinitionsCollection();
    if (!definitionsCollection) { showToast('error', 'Database not ready.'); return; }
    let templateToSave = { ...editingTemplateData };
    templateToSave.components = templateToSave.components.map(({ tempId, selectedResourceId, ...rest }) => rest);
    let proposedKey = slugify(templateToSave.name);
    if (!proposedKey) proposedKey = generateId(); 
    let finalTemplateKey = selectedTemplateKeyForEditing || proposedKey;
    if (!selectedTemplateKeyForEditing && userWorkItemTemplates[finalTemplateKey]) {
        if(!await window_confirm(`Template with key "${finalTemplateKey}" exists. Overwrite?`)){ showToast('info', 'Save cancelled.'); return; }
    }
    const { key, ...dataToSave } = templateToSave; 
    setIsSavingDefinition(true);
    try {
        await setDoc(doc(definitionsCollection, finalTemplateKey), dataToSave);
        showToast('success', `Definition "${templateToSave.name}" saved!`);
        setShowTemplateForm(false); setEditingTemplateData(null); setSelectedTemplateKeyForEditing(null);
    } catch (e) { console.error(e); showToast('error', `Save definition error: ${e.message}`); }
    setIsSavingDefinition(false);
  };

  const handleDeleteWorkItemDefinition = async (templateKey) => {
    const template = userWorkItemTemplates[templateKey];
    if (!template) return;
    if (!await window_confirm(`Permanently delete definition "${template.name}"?`)) return;
    const definitionsCollection = getWorkItemDefinitionsCollection();
    if (!definitionsCollection) { showToast('error', 'Database not ready.'); return; }
    try {
        await deleteDoc(doc(definitionsCollection, templateKey));
        showToast('success', `Definition "${template.name}" deleted.`);
    } catch (e) { console.error(e); showToast('error', `Error: ${e.message}`); }
  };

  const handleSuggestComponents = async () => {
    if (!editingTemplateData || !editingTemplateData.name.trim()) { showToast('error', 'Please enter a template name first to get suggestions.'); return; }
    setIsSuggestingComponents(true); showToast('info', '✨ Getting component suggestions from AI...');
    const prompt = `Given the construction work item name "${editingTemplateData.name}", suggest a list of typical material and labor components. Provide the response as a JSON array where each object has "componentName" (string, e.g., "Semen Portland"), "unit" (string, e.g., "Zak"), and "type" (string, either "material" or "labor"). For example, for "Pekerjaan Plesteran Dinding", you might suggest [{"componentName": "Semen Portland (PC)", "unit": "kg", "type": "material"}, {"componentName": "Pasir Pasang", "unit": "m³", "type": "material"}, {"componentName": "Pekerja", "unit": "OH", "type": "labor"}]. Only provide the JSON array.`;
    try {
        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { contents: chatHistory, generationConfig: { responseMimeType: "application/json", responseSchema: { type: "ARRAY", items: { type: "OBJECT", properties: { "componentName": { "type": "STRING" }, "unit": { "type": "STRING" }, "type": { "type": "STRING", "enum": ["material", "labor", "material_service", "info"] } }, required: ["componentName", "unit", "type"] }}}};
        const apiKey = "AIzaSyBKr2upPeJef15doYsQqYIbIkW8UvtaRPA"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) { const errorBody = await response.text(); throw new Error(`API error: ${response.status} ${errorBody}`); }
        const result = await response.json();
        if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
            const suggestedComponentsRaw = JSON.parse(result.candidates[0].content.parts[0].text);
            if (Array.isArray(suggestedComponentsRaw)) {
                const newComponentsFromAI = suggestedComponentsRaw.map(sugComp => {
                    const matchingPriceItem = materialPrices.find(p => p.name.toLowerCase() === sugComp.componentName.toLowerCase() && p.unit.toLowerCase() === sugComp.unit.toLowerCase());
                    return { tempId: generateId(), name: sugComp.componentName, priceListKey: sugComp.componentName, unit: sugComp.unit, coefficient: 0, type: sugComp.type || 'material', selectedResourceId: matchingPriceItem ? matchingPriceItem.id : '' };
                });
                setEditingTemplateData(prev => ({ ...prev, components: [...prev.components, ...newComponentsFromAI] }));
                showToast('success', `${newComponentsFromAI.length} component suggestions added! Please review and set coefficients.`);
            } else { showToast('error', 'AI suggestions format was unexpected.'); }
        } else { showToast('error', 'Could not get suggestions from AI. Response was empty or malformed.'); console.error("Gemini response malformed:", result); }
    } catch (error) { console.error("Error suggesting components:", error); showToast('error', `AI suggestion error: ${error.message}`); }
    setIsSuggestingComponents(false);
  };

  const handleFetchProjectInsights = async () => {
    if (!currentProject) { showToast('error', 'No project selected.'); return; }
    setIsFetchingProjectInsights(true); setProjectInsights(''); setShowInsightsModal(true); 
    const workItemsSummary = currentProject.workItems.map(item => `- ${item.name} (${item.primaryInputDisplay}): ${formatCurrency(item.totalItemCost)}`).join('\n');
    const prompt = `Analyze the following construction project budget for a project in Indonesia. Project Name: ${currentProject.projectName}. Total Estimated Budget: ${formatCurrency(currentProject.totalCalculatedBudget)}. Work Items:\n${workItemsSummary || "No work items detailed."}\nProvide a brief analysis covering: 1. Overall project scope impression. 2. Potential cost-saving suggestions or areas to watch. 3. Common risks or considerations. 4. One or two general recommendations. Keep the response concise and actionable. Format with markdown.`;
    try {
        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { contents: chatHistory }; const apiKey = "AIzaSyBKr2upPeJef15doYsQqYIbIkW8UvtaRPA"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) { const errorBody = await response.text(); throw new Error(`API error: ${response.status} ${errorBody}`); }
        const result = await response.json();
        if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) { setProjectInsights(result.candidates[0].content.parts[0].text); } 
        else { setProjectInsights("Could not retrieve insights. AI response was empty/malformed."); console.error("Gemini insights response malformed:", result); }
    } catch (error) { console.error("Error fetching project insights:", error); setProjectInsights(`Error fetching insights: ${error.message}`); }
    setIsFetchingProjectInsights(false);
  };

  // Category Management Functions (Work Item Categories)
  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) { showToast('error', 'Category name cannot be empty.'); return; }
    if (userCategories.map(c => c.toLowerCase()).includes(newCategoryName.trim().toLowerCase())) {
        showToast('error', `Category "${newCategoryName.trim()}" already exists.`); return;
    }
    const categoriesDocRef = getUserMetaDocRef('categories');
    if (!categoriesDocRef) { showToast('error', 'Database not ready for categories.'); return; }
    const updatedCategories = [...userCategories, newCategoryName.trim()];
    try {
        await setDoc(categoriesDocRef, { list: updatedCategories }, { merge: true });
        setNewCategoryName('');
        showToast('success', `Category "${newCategoryName.trim()}" added.`);
    } catch (error) {
        console.error("Error adding category:", error);
        showToast('error', `Failed to add category: ${error.message}`);
    }
  };

  const handleDeleteCategory = async (categoryToDelete) => {
    const isUsed = Object.values(userWorkItemTemplates).some(template => template.category === categoryToDelete);
    if (isUsed) {
        showToast('error', `Category "${categoryToDelete}" is in use by one or more definitions and cannot be deleted.`);
        return;
    }
    if (!await window_confirm(`Are you sure you want to delete the category "${categoryToDelete}"? This cannot be undone.`)) return;

    const categoriesDocRef = getUserMetaDocRef('categories');
    if (!categoriesDocRef) { showToast('error', 'Database not ready for categories.'); return; }
    
    const updatedCategories = userCategories.filter(cat => cat !== categoryToDelete);
    try {
        await setDoc(categoriesDocRef, { list: updatedCategories }, { merge: true });
        showToast('success', `Category "${categoryToDelete}" deleted.`);
        if (editingTemplateData && editingTemplateData.category === categoryToDelete) {
            setEditingTemplateData(prev => ({...prev, category: userCategories[0] || 'Uncategorized'}));
        }
    } catch (error) {
        console.error("Error deleting category:", error);
        showToast('error', `Failed to delete category: ${error.message}`);
    }
  };

const handleAddNewUnit = async () => {
    if (!newUnitName.trim()) { showToast('error', 'Unit name cannot be empty.'); return; }
    if (userUnits.some(u => u.unit_name.toLowerCase() === newUnitName.trim().toLowerCase())) {
        showToast('error', `Unit "${newUnitName.trim()}" already exists.`); return;
    }
    // No getUserMetaDocRef needed
    try {
        const addedUnit = await apiService.addUnitApi(userId, newUnitName.trim());
        // Add the new unit (which includes its ID from the backend) to the local state
        setUserUnits(prevUnits => [...prevUnits, { id: addedUnit.id, unit_name: addedUnit.unit_name }].sort((a,b) => a.unit_name.localeCompare(b.unit_name)));
        setNewUnitName('');
        showToast('success', `Unit "${newUnitName.trim()}" added.`);
    } catch (error) {
        console.error("Error adding unit:", error);
        showToast('error', `Failed to add unit: ${error.message}`);
    }
};


  const handleDeleteUnit = async (unitToDelete) => {
    const isUsedInPrices = materialPrices.some(price => price.unit === unitToDelete.unit_name);
    const isUsedInDefinitions = Object.values(userWorkItemTemplates).some(template => 
        (template.primaryInput && template.primaryInput.unit === unitToDelete) ||
        (template.components && template.components.some(comp => comp.unit === unitToDelete))
    );

    if (isUsedInPrices || isUsedInDefinitions) {
        showToast('error', `Unit "${unitToDelete}" is in use and cannot be deleted.`);
        return;
    }
    if (!await window_confirm(`Are you sure you want to delete the unit "${unitToDelete.unit_name}"? This cannot be undone.`)) return;

    const unitsDocRef = getUserMetaDocRef('units');
    if (!unitsDocRef) { showToast('error', 'Database not ready for units.'); return; }

    const updatedUnits = userUnits.filter(unit => unit !== unitToDelete);
    try {
        await apiService.deleteUnitApi(userId, unitToDelete.id);
        setUserUnits(prevUnits => prevUnits.filter(unit => unit.id !== unitToDelete.id));
        showToast('success', `Unit "${unitToDelete.unit_name}" deleted.`);
        if (priceFormData && priceFormData.unit === unitToDelete.unit_name) {
            setPriceFormData(prev => ({...prev, unit: (userUnits.find(u => u.id !== unitToDelete.id) || {unit_name: ''}).unit_name }));
            setUnitSelectionMode('select');
        }
        if (editingTemplateData && editingTemplateData.primaryInput.unit === unitToDelete) {
            setEditingTemplateData(prev => ({...prev, primaryInput: {...prev.primaryInput, unit: userUnits[0] || ''}}));
        }
    } catch (error) {
        console.error("Error deleting unit:", error);
        showToast('error', `Failed to delete unit: ${error.message}`);
    }
  };

  // Cash Flow Category Management
  const handleAddNewCashFlowCategory = async () => {
    if (!newCashFlowCategoryName.trim()) { showToast('error', 'Category name cannot be empty.'); return; }
    if (userCashFlowCategories.map(c => c.toLowerCase()).includes(newCashFlowCategoryName.trim().toLowerCase())) {
        showToast('error', `Category "${newCashFlowCategoryName.trim()}" already exists.`); return;
    }
    const cfCategoriesDocRef = getUserMetaDocRef('cashFlowCategories');
    if (!cfCategoriesDocRef) { showToast('error', 'Database not ready for cash flow categories.'); return; }
    const updatedCategories = [...userCashFlowCategories, newCashFlowCategoryName.trim()];
    try {
        await setDoc(cfCategoriesDocRef, { list: updatedCategories }, { merge: true });
        setNewCashFlowCategoryName('');
        showToast('success', `Cash flow category "${newCashFlowCategoryName.trim()}" added.`);
    } catch (error) {
        console.error("Error adding cash flow category:", error);
        showToast('error', `Failed to add cash flow category: ${error.message}`);
    }
  };

  const handleDeleteCashFlowCategory = async (categoryToDelete) => {
    let isUsedInAnyProject = false;
    for (const project of projects) { // Check across all loaded projects
        if (project.cashFlowEntries && project.cashFlowEntries.some(entry => entry.category === categoryToDelete)) {
            isUsedInAnyProject = true;
            break;
        }
    }

    if (isUsedInAnyProject) {
        showToast('error', `Cash flow category "${categoryToDelete}" is in use in one or more projects and cannot be deleted.`);
        return;
    }
    if (!await window_confirm(`Are you sure you want to delete the cash flow category "${categoryToDelete}"? This cannot be undone.`)) return;

    const cfCategoriesDocRef = getUserMetaDocRef('cashFlowCategories');
    if (!cfCategoriesDocRef) { showToast('error', 'Database not ready for cash flow categories.'); return; }
    
    const updatedCategories = userCashFlowCategories.filter(cat => cat !== categoryToDelete);
    try {
        await setDoc(cfCategoriesDocRef, { list: updatedCategories }, { merge: true });
        showToast('success', `Cash flow category "${categoryToDelete}" deleted.`);
        if (cashFlowFormData && cashFlowFormData.category === categoryToDelete) {
            setCashFlowFormData(prev => ({...prev, category: userCashFlowCategories[0] || ''}));
        }
    } catch (error) {
        console.error("Error deleting cash flow category:", error);
        showToast('error', `Failed to delete cash flow category: ${error.message}`);
    }
  };

  // Cash Flow Entry Management
  const handleCashFlowFormChange = (e) => {
    const { name, value } = e.target;
    setCashFlowFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCashFlowEntry = async () => {
    if (!cashFlowFormData.description.trim() || !cashFlowFormData.amount || !cashFlowFormData.date || !cashFlowFormData.category) {
        showToast('error', 'Date, Description, Amount, and Category are required for cash flow entry.');
        return;
    }
    const amountValue = parseFloat(cashFlowFormData.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
        showToast('error', 'Invalid amount for cash flow entry.');
        return;
    }
    if (!currentProject) {
        showToast('error', 'No project selected to add cash flow entry.');
        return;
    }

    const projsCollection = getProjectsCollection();
    if (!projsCollection) { showToast('error', 'Database not ready.'); return; }

    setIsSavingCashFlowEntry(true);
    const entryToSave = { 
        ...cashFlowFormData, 
        amount: amountValue, 
        id: editingCashFlowEntry ? editingCashFlowEntry.id : generateId(),
        createdAt: editingCashFlowEntry ? editingCashFlowEntry.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAutoGenerated: editingCashFlowEntry ? editingCashFlowEntry.isAutoGenerated || false : false // Preserve flag on edit
    };

    let updatedEntries = [...(currentProject.cashFlowEntries || [])];
    if (editingCashFlowEntry) {
        updatedEntries = updatedEntries.map(e => e.id === editingCashFlowEntry.id ? entryToSave : e);
    } else {
        updatedEntries.push(entryToSave);
    }

    let newActualIncome = 0;
    let newActualExpenses = 0;
    updatedEntries.forEach(entry => {
        if (entry.type === 'income') newActualIncome += entry.amount;
        else newActualExpenses += entry.amount;
    });
    
    try {
        await updateDoc(doc(projsCollection, currentProject.id), {
            cashFlowEntries: updatedEntries,
            actualIncome: newActualIncome,
            actualExpenses: newActualExpenses
        });
        showToast('success', `Cash flow entry ${editingCashFlowEntry ? 'updated' : 'added'}!`);
        setShowCashFlowForm(false);
        setEditingCashFlowEntry(null);
        setCashFlowFormData({ date: new Date().toISOString().split('T')[0], description: '', type: 'expense', amount: '', category: userCashFlowCategories[0] || '' });
    } catch (e) {
        console.error("Error saving cash flow entry:", e);
        showToast('error', `Save cash flow entry error: ${e.message}`);
    }
    setIsSavingCashFlowEntry(false);
  };

  const handleEditCashFlowEntry = (entry) => {
    setEditingCashFlowEntry(entry);
    setCashFlowFormData({
        date: entry.date,
        description: entry.description,
        type: entry.type,
        amount: entry.amount.toString(),
        category: entry.category
    });
    setShowCashFlowForm(true);
  };

  const handleDeleteCashFlowEntry = async (entryId) => {
    if (!currentProject || !await window_confirm('Delete this cash flow entry?')) return;
    
    const projsCollection = getProjectsCollection();
    if (!projsCollection) { showToast('error', 'Database not ready.'); return; }

    const updatedEntries = currentProject.cashFlowEntries.filter(e => e.id !== entryId);
    let newActualIncome = 0;
    let newActualExpenses = 0;
    updatedEntries.forEach(entry => {
        if (entry.type === 'income') newActualIncome += entry.amount;
        else newActualExpenses += entry.amount;
    });

    try {
        await updateDoc(doc(projsCollection, currentProject.id), {
            cashFlowEntries: updatedEntries,
            actualIncome: newActualIncome,
            actualExpenses: newActualExpenses
        });
        showToast('success', 'Cash flow entry deleted!');
    } catch (e) {
        console.error("Error deleting cash flow entry:", e);
        showToast('error', `Delete cash flow entry error: ${e.message}`);
    }
  };

  
  const renderToast = () => {
    if (!toastMessage) return null;
    return (
      <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white z-[100] ${toastMessage.type === 'success' ? 'bg-green-600' : toastMessage.type === 'info' ? 'bg-sky-600' : 'bg-red-600'}`}>
        <div className="flex items-center"> 
            {toastMessage.type === 'success' ? <CheckCircle size={20} className="mr-2"/> : toastMessage.type === 'info' ? <Info size={20} className="mr-2"/> : <AlertTriangle size={20} className="mr-2"/>} 
            {toastMessage.message} 
        </div>
      </div>);
  };

  const renderConfirmModal = () => {
    if (!confirmModal.isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
        <div className="bg-slate-700 p-6 rounded-lg shadow-xl max-w-sm w-full">
          <h3 className="text-lg font-semibold text-white mb-4">Confirm Action</h3> <p className="text-slate-300 mb-6">{confirmModal.message}</p>
          <div className="flex justify-end space-x-3">
            <button onClick={confirmModal.onCancel} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors">Cancel</button>
            <button onClick={confirmModal.onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors">Confirm</button>
          </div></div></div>);
  };

  const renderMaterialPricesView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-sky-400 flex items-center"><DollarSign size={30} className="mr-3"/>Material & Labor Prices</h2>
        <div className="flex space-x-3">
            <button 
                onClick={() => setShowManageUnitsModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shadow-md flex items-center transition-all duration-150 ease-in-out transform hover:scale-105">
                <Settings size={20} className="mr-2"/> Manage Units
            </button>
            <button onClick={() => { 
                setShowPriceForm(!showPriceForm); 
                setEditingPrice(null); 
                setPriceFormData({ name: '', unit: userUnits[0] || '', price: '' }); 
                setUnitSelectionMode('select'); 
            }}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md shadow-md flex items-center transition-all duration-150 ease-in-out transform hover:scale-105">
            <PlusCircle size={20} className="mr-2"/> {showPriceForm ? 'Cancel' : 'Add New Price'}
            </button>
        </div>
      </div>
      {showPriceForm && (
        <div className="p-6 bg-slate-700 rounded-lg shadow-lg space-y-4 animate-fadeIn">
          <h3 className="text-xl font-medium text-white">{editingPrice ? 'Edit Price' : 'Add New Price Item'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" name="name" value={priceFormData.name} onChange={handlePriceFormChange} placeholder="Item Name (e.g., Semen Portland)" className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none"/>
            <div>
                <select 
                    name="unitSelector" 
                    value={unitSelectionMode === 'custom' ? OTHER_UNIT_MARKER : priceFormData.unit} 
                    onChange={handlePriceFormChange}
                    className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none w-full"
                >
                    <option value="">-- Select Unit --</option>
                    {userUnits.sort((a,b) => a.localeCompare(b)).map(u => <option key={u} value={u}>{u}</option>)}
                    <option value={OTHER_UNIT_MARKER}>Other (Specify)</option>
                </select>
                {unitSelectionMode === 'custom' && (
                    <input 
                        type="text" 
                        name="unit" 
                        value={priceFormData.unit} 
                        onChange={handlePriceFormChange}
                        placeholder="Specify Unit" 
                        className="mt-2 p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none w-full"
                    />
                )}
            </div>
            <input type="number" name="price" value={priceFormData.price} onChange={handlePriceFormChange} placeholder="Price (Rp)" min="0" className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none"/>
          </div>
          <div className="flex justify-end space-x-3">
            <button onClick={() => { setShowPriceForm(false); setEditingPrice(null); }} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors">Cancel</button>
            <button onClick={handleSavePrice} disabled={isSavingPrice} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center transition-colors disabled:opacity-50">
              <Save size={18} className="mr-2"/> {isSavingPrice ? (editingPrice ? 'Saving...' : 'Adding...') : (editingPrice ? 'Save Changes' : 'Add Price')}
            </button>
          </div></div>)}
      {isLoading && currentView === 'materialPrices' && materialPrices.length === 0 && !showPriceForm && (<div className="text-center p-4 text-slate-400">Loading prices...</div>)}
      {!isLoading && materialPrices.length === 0 && !showPriceForm && (<div className="p-6 bg-slate-700 rounded-lg text-center text-slate-300"><Info size={24} className="mx-auto mb-2 text-sky-500"/> No material or labor prices found. Add some to get started!</div>)}
      {materialPrices.length > 0 && (<div className="overflow-x-auto bg-slate-700 rounded-lg shadow-lg">
        <table className="w-full min-w-max text-left text-slate-300">
          <thead className="bg-slate-800 text-slate-400"><tr><th className="p-4">Name</th><th className="p-4">Unit</th><th className="p-4">Price (Rp)</th><th className="p-4 text-right">Actions</th></tr></thead>
          <tbody>{materialPrices.sort((a,b) => a.name.localeCompare(b.name)).map(price => (
              <tr key={price.id} className="border-b border-slate-600 hover:bg-slate-600/50 transition-colors">
                <td className="p-4 text-white">{price.name}</td><td className="p-4">{price.unit}</td><td className="p-4 text-sky-400">{formatCurrency(price.price)}</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleEditPrice(price)} className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"><Edit3 size={18}/></button>
                  <button onClick={() => handleDeletePrice(price.id)} className="p-2 text-red-500 hover:text-red-400 transition-colors"><Trash2 size={18}/></button>
                </td></tr>))}</tbody></table></div>)}</div>);

  const renderCurrentProjectWorkItemsView = () => {
    if (!currentProject) return null;
    const templatesByCategory = Object.values(userWorkItemTemplates).reduce((acc, template) => {
        const category = template.category || 'Uncategorized'; if (!acc[category]) acc[category] = []; acc[category].push(template); return acc; }, {});
    
    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h4 className="text-xl font-medium text-white">Work Items in Project:</h4>
                <button 
                    onClick={() => { setShowWorkItemForm(!showWorkItemForm); setCalculatedWorkItemPreview(null); setWorkItemFormData({ templateKey: '', primaryInputValue: '' });}}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-md shadow-md flex items-center justify-center transition-all duration-150 ease-in-out transform hover:scale-105">
                    <PlusCircle size={20} className="mr-2"/> {showWorkItemForm ? 'Cancel Adding Item' : 'Add Work Item'}
                </button>
            </div>

            {showWorkItemForm && (
              <div className="p-6 bg-slate-700 rounded-lg shadow-lg space-y-4 animate-fadeIn">
                <h4 className="text-xl font-medium text-white">Add New Work Item</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select name="templateKey" value={workItemFormData.templateKey} onChange={handleWorkItemFormChange} className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none">
                    <option value="">-- Select Work Item Type --</option>
                    {Object.keys(userWorkItemTemplates).length === 0 && <option disabled>No definitions created yet</option>}
                    {Object.entries(templatesByCategory).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, templates]) => (
                        <optgroup label={category} key={category} className="bg-slate-800 text-sky-300 font-semibold">
                            {templates.sort((a,b) => a.name.localeCompare(b.name)).map(template => (<option key={template.key} value={template.key} className="text-white bg-slate-800">{template.name}</option>))}
                        </optgroup>))}
                  </select>
                  {workItemFormData.templateKey && userWorkItemTemplates[workItemFormData.templateKey] && (
                    <input type="number" name="primaryInputValue" value={workItemFormData.primaryInputValue} onChange={handleWorkItemFormChange} placeholder={`${userWorkItemTemplates[workItemFormData.templateKey].primaryInput.label} (${userWorkItemTemplates[workItemFormData.templateKey].primaryInput.unit})`} min="0.01" step="0.01" className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none"/>)}
                </div>
                {calculatedWorkItemPreview && (
                  <div className="mt-4 p-4 bg-slate-800/70 rounded-md space-y-3 border border-slate-600">
                    <h5 className="text-lg font-semibold text-sky-300">Calculation Preview: {calculatedWorkItemPreview.name}</h5>
                    <p className="text-sm text-slate-400">Input: {calculatedWorkItemPreview.primaryInputDisplay}</p>
                    <ul className="text-xs list-disc list-inside pl-2 text-slate-300 max-h-40 overflow-y-auto">
                      {calculatedWorkItemPreview.components.map((comp, idx) => (
                        <li key={idx} className={`${comp.pricePerUnit === 0 && comp.type !== 'info' ? 'text-yellow-400' : ''}`}>
                          {comp.name}: {comp.quantity.toFixed(3)} {comp.unit} @ {formatCurrency(comp.pricePerUnit)} = {formatCurrency(comp.cost)}
                          {comp.pricePerUnit === 0 && comp.type !== 'info' && <span className="ml-1 text-yellow-500">(Price not found or zero!)</span>}</li>))}</ul>
                    <p className="text-md font-semibold text-green-400">Total Item Cost: {formatCurrency(calculatedWorkItemPreview.totalItemCost)}</p></div>)}
                <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={() => { setShowWorkItemForm(false); setCalculatedWorkItemPreview(null); }} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors">Cancel</button>
                    <button onClick={handleAddWorkItemToProject} disabled={!calculatedWorkItemPreview || isAddingWorkItem} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center transition-colors disabled:opacity-50">
                      <Save size={18} className="mr-2"/> {isAddingWorkItem ? 'Adding...' : 'Add Item to Project'}</button></div></div>)}
            
            {currentProject.workItems?.length > 0 ? (
              <div className="space-y-4">{currentProject.workItems.sort((a,b) => new Date(b.addedAt) - new Date(a.addedAt)).map(item => (
                <details key={item.id} className="bg-slate-800 p-4 rounded-lg shadow-md group">
                  <summary className="flex justify-between items-center cursor-pointer text-lg font-semibold text-sky-400 group-hover:text-sky-300">
                    <span>{item.name} <span className="text-sm text-slate-400">({item.primaryInputDisplay})</span></span>
                    <div className="flex items-center"> <span className="text-green-400 mr-4">{formatCurrency(item.totalItemCost)}</span>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteWorkItem(item.id); }} className="p-1 text-red-500 hover:text-red-400 opacity-70 hover:opacity-100 transition-colors mr-2" title="Delete Work Item"><Trash2 size={18}/></button>
                      <ChevronDown size={24} className="group-open:hidden transition-transform"/><ChevronUp size={24} className="hidden group-open:block transition-transform"/></div></summary>
                  <div className="mt-3 pt-3 border-t border-slate-700 text-sm text-slate-300 space-y-1"><p className="font-semibold text-slate-200">Components:</p>
                    <ul className="list-disc list-inside pl-4 max-h-60 overflow-y-auto">{item.components.map((comp, idx) => (
                        <li key={idx} className={`${comp.pricePerUnit === 0 && comp.type !== 'info' ? 'text-yellow-400' : ''}`}>{comp.name}: {comp.quantity.toFixed(3)} {comp.unit} @ {formatCurrency(comp.pricePerUnit)} = {formatCurrency(comp.cost)}
                         {comp.pricePerUnit === 0 && comp.type !== 'info' && <span className="ml-1 text-yellow-500">(Price was Rp 0)</span>}</li>))}</ul></div></details>))}</div>
            ) : ( <p className="text-slate-400 text-center py-4">No work items added to this project yet.</p> )}
        </div>
    );
  };

  const renderProjectCashFlowView = () => {
    if (!currentProject) return null;
    const sortedCashFlowEntries = [...(currentProject.cashFlowEntries || [])].sort((a,b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-700/30 rounded-lg shadow">
                    <h5 className="text-sm text-green-300 font-medium">Total Income</h5>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(currentProject.actualIncome || 0)}</p>
                </div>
                <div className="p-4 bg-red-700/30 rounded-lg shadow">
                    <h5 className="text-sm text-red-300 font-medium">Total Expenses</h5>
                    <p className="text-2xl font-bold text-red-400">{formatCurrency(currentProject.actualExpenses || 0)}</p>
                </div>
                <div className="p-4 bg-sky-700/30 rounded-lg shadow">
                    <h5 className="text-sm text-sky-300 font-medium">Net Cash Flow</h5>
                    <p className="text-2xl font-bold text-sky-400">{formatCurrency((currentProject.actualIncome || 0) - (currentProject.actualExpenses || 0))}</p>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <h4 className="text-xl font-medium text-white">Cash Flow Entries:</h4>
                <button 
                    onClick={() => { 
                        setShowCashFlowForm(!showCashFlowForm); 
                        setEditingCashFlowEntry(null);
                        setCashFlowFormData({ date: new Date().toISOString().split('T')[0], description: '', type: 'expense', amount: '', category: userCashFlowCategories[0] || ''});
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md shadow-md flex items-center justify-center transition-all duration-150 ease-in-out transform hover:scale-105">
                    <PlusCircle size={20} className="mr-2"/> {showCashFlowForm ? 'Cancel Entry' : 'Add Cash Flow Entry'}
                </button>
            </div>

            {showCashFlowForm && (
                <div className="p-6 bg-slate-700 rounded-lg shadow-lg space-y-4 animate-fadeIn">
                    <h3 className="text-xl font-medium text-white">{editingCashFlowEntry ? 'Edit Cash Flow Entry' : 'Add New Cash Flow Entry'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="date" name="date" value={cashFlowFormData.date} onChange={handleCashFlowFormChange} className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none"/>
                        <select name="type" value={cashFlowFormData.type} onChange={handleCashFlowFormChange} className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none">
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                    </div>
                    <input type="text" name="description" value={cashFlowFormData.description} onChange={handleCashFlowFormChange} placeholder="Description (e.g., Pembelian Semen, Pembayaran Termin 1)" className="w-full p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none"/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="number" name="amount" value={cashFlowFormData.amount} onChange={handleCashFlowFormChange} placeholder="Amount (Rp)" min="0" className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none"/>
                        <select name="category" value={cashFlowFormData.category} onChange={handleCashFlowFormChange} className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none">
                            <option value="">-- Select Category --</option>
                            {userCashFlowCategories.sort((a,b) => a.localeCompare(b)).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button onClick={() => { setShowCashFlowForm(false); setEditingCashFlowEntry(null); }} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors">Cancel</button>
                        <button onClick={handleSaveCashFlowEntry} disabled={isSavingCashFlowEntry} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center transition-colors disabled:opacity-50">
                            <Save size={18} className="mr-2"/> {isSavingCashFlowEntry ? (editingCashFlowEntry ? 'Saving...' : 'Adding...') : (editingCashFlowEntry ? 'Save Changes' : 'Add Entry')}
                        </button>
                    </div>
                </div>
            )}

            {sortedCashFlowEntries.length > 0 ? (
                <div className="overflow-x-auto bg-slate-700/70 rounded-lg shadow-lg">
                    <table className="w-full min-w-max text-left text-slate-300">
                        <thead className="bg-slate-800 text-slate-400">
                            <tr>
                                <th className="p-4">Date</th><th className="p-4">Description</th><th className="p-4">Category</th>
                                <th className="p-4 text-right">Amount (Rp)</th><th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedCashFlowEntries.map(entry => (
                                <tr key={entry.id} className={`border-b border-slate-600 hover:bg-slate-600/50 transition-colors ${entry.isAutoGenerated ? 'opacity-70' : (entry.type === 'income' ? 'bg-green-900/30' : 'bg-red-900/30')}`}>
                                    <td className="p-4 text-white">{new Date(entry.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                    <td className="p-4 text-white">{entry.description} {entry.isAutoGenerated && <span className="text-xs text-sky-400 ml-1">(Auto)</span>}</td>
                                    <td className="p-4">{entry.category}</td>
                                    <td className={`p-4 text-right font-semibold ${entry.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                        {entry.type === 'income' ? '+' : '-'} {formatCurrency(entry.amount)}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        {!entry.isAutoGenerated && /* Prevent editing/deleting auto-generated entries directly here */
                                          <>
                                            <button onClick={() => handleEditCashFlowEntry(entry)} className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"><Edit3 size={18}/></button>
                                            <button onClick={() => handleDeleteCashFlowEntry(entry.id)} className="p-2 text-red-500 hover:text-red-400 transition-colors"><Trash2 size={18}/></button>
                                          </>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : ( <p className="text-slate-400 text-center py-4">No cash flow entries for this project yet.</p> )}
        </div>
    );
  };


  const renderCurrentProjectDetails = () => { 
    if (!currentProject) return null;
    return (
      <div className="mt-8 p-6 bg-slate-700/50 rounded-lg shadow-inner space-y-6 animate-fadeIn">
        <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-slate-600 pb-4 mb-4">
            <div>
                <h3 className="text-2xl font-semibold text-sky-300">Project: {currentProject.projectName}</h3>
                <p className="text-lg text-slate-400">Budgeted Total: {formatCurrency(currentProject.totalCalculatedBudget || 0)}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
                 <button onClick={handleFetchProjectInsights} disabled={isFetchingProjectInsights} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md shadow-md flex items-center justify-center transition-all duration-150 ease-in-out transform hover:scale-105 disabled:opacity-60">
                    {isFetchingProjectInsights ? <Loader2 size={20} className="mr-2 animate-spin"/> : <Sparkles size={20} className="mr-2"/>}
                    {isFetchingProjectInsights ? 'Getting Insights...' : '✨ Get Project Insights'}
                </button>
            </div>
        </div>
        {/* Tabs for Project View */}
        <div className="flex space-x-1 border-b border-slate-600 mb-6">
            <button 
                onClick={() => setCurrentProjectView('workItems')}
                className={`px-4 py-2 rounded-t-md text-sm font-medium ${currentProjectView === 'workItems' ? 'bg-slate-700 text-sky-400 border-slate-600 border-t border-x' : 'text-slate-400 hover:text-sky-300'}`}>
                Work Items & Budget
            </button>
            <button 
                onClick={() => setCurrentProjectView('cashFlow')}
                className={`px-4 py-2 rounded-t-md text-sm font-medium ${currentProjectView === 'cashFlow' ? 'bg-slate-700 text-sky-400 border-slate-600 border-t border-x' : 'text-slate-400 hover:text-sky-300'}`}>
                Cash Flow
            </button>
        </div>

        {currentProjectView === 'workItems' && renderCurrentProjectWorkItemsView()}
        {currentProjectView === 'cashFlow' && renderProjectCashFlowView()}

      </div>);};

  const renderProjectsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-sky-400 flex items-center"><Briefcase size={30} className="mr-3"/>My Projects</h2>
        <button onClick={() => { setShowProjectForm(!showProjectForm); setProjectFormData({ projectName: '' });}}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md shadow-md flex items-center transition-all duration-150 ease-in-out transform hover:scale-105">
          <PlusCircle size={20} className="mr-2"/> {showProjectForm ? 'Cancel Creation' : 'Create New Project'}
        </button>
      </div>
      {showProjectForm && (
        <div className="p-6 bg-slate-700 rounded-lg shadow-lg space-y-4 animate-fadeIn">
          <h3 className="text-xl font-medium text-white">Create New Project</h3>
          <input type="text" name="projectName" value={projectFormData.projectName} onChange={handleProjectFormChange} placeholder="Project Name (e.g., Rumah Tinggal Pak Budi)" className="w-full p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none"/>
          <div className="flex justify-end space-x-3">
               <button onClick={() => { setShowProjectForm(false); }} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors">Cancel</button>
            <button onClick={handleSaveProject} disabled={isSavingProject} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center transition-colors disabled:opacity-50">
              <Save size={18} className="mr-2"/> {isSavingProject ? 'Creating...' : 'Create Project'}</button></div></div>)}
      {isLoading && currentView === 'projects' && projects.length === 0 && !showProjectForm && (<div className="text-center p-4 text-slate-400">Loading projects...</div>)}
      {!isLoading && projects.length === 0 && !showProjectForm && ( <div className="p-6 bg-slate-700 rounded-lg text-center text-slate-300"> <Info size={24} className="mx-auto mb-2 text-sky-500"/> No projects found. Create one to start planning your budget! </div>)}
      {projects.length > 0 && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(proj => (
          <div key={proj.id} className={`p-6 rounded-lg shadow-xl cursor-pointer transition-all duration-200 ease-in-out relative ${currentProjectId === proj.id ? 'bg-sky-700 ring-2 ring-sky-400 scale-105' : 'bg-slate-700 hover:bg-slate-600/70'}`} onClick={() => handleSelectProject(proj.id)}>
            <div className="flex justify-between items-start"> <h3 className="text-xl font-semibold text-white mb-2">{proj.projectName}</h3>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj.id); }} className="p-1 text-red-400 hover:text-red-300 transition-colors opacity-70 hover:opacity-100" title="Delete Project"><XCircle size={20}/></button></div>
            <p className="text-sm text-slate-400 mb-1">Budget: {formatCurrency(proj.totalCalculatedBudget || 0)}</p>
            <p className={`text-sm font-medium mb-1 ${ (proj.actualIncome || 0) - (proj.actualExpenses || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                Net Cash Flow: {formatCurrency((proj.actualIncome || 0) - (proj.actualExpenses || 0))}
            </p>
            <p className="text-xs text-slate-500">Created: {new Date(proj.createdAt).toLocaleDateString('id-ID')}</p>
            {currentProjectId === proj.id && <div className="absolute top-2 right-2 h-3 w-3 bg-green-400 rounded-full animate-pulse" title="Selected"></div>}</div>))}</div>)}
      {currentProject && renderCurrentProjectDetails()}</div>);

  const renderWorkItemDefinitionsView = () => {
    const sortedTemplates = Object.values(userWorkItemTemplates).sort((a, b) => {
        const catA = userCategories.includes(a.category) ? a.category : "Uncategorized";
        const catB = userCategories.includes(b.category) ? b.category : "Uncategorized";
        if (catA < catB) return -1; if (catA > catB) return 1;
        return a.name.localeCompare(b.name);
    });
    const templatesByCategory = sortedTemplates.reduce((acc, template) => {
        const category = userCategories.includes(template.category) ? template.category : 'Uncategorized'; 
        if (!acc[category]) acc[category] = []; acc[category].push(template); return acc; }, {});
    const sortedMaterialPrices = [...materialPrices].sort((a, b) => a.name.localeCompare(b.name));

    if (showTemplateForm && editingTemplateData) {
        return ( 
            <div className="p-4 md:p-6 bg-slate-800 rounded-lg shadow-xl animate-fadeIn">
                <h2 className="text-2xl font-semibold text-sky-400 mb-6">{selectedTemplateKeyForEditing ? `Edit: ${editingTemplateData.name}` : 'Create New Work Item Definition'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div><label htmlFor="templateName" className="block text-sm font-medium text-slate-300 mb-1">Template Name</label><input type="text" id="templateName" value={editingTemplateData.name} onChange={(e) => handleTemplateFormChange('name', e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-sky-500 outline-none" placeholder="e.g., Pekerjaan Dinding Batako"/></div>
                    <div><label htmlFor="templateCategory" className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                        <select id="templateCategory" value={editingTemplateData.category} onChange={(e) => handleTemplateFormChange('category', e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-sky-500 outline-none">
                            {userCategories.sort((a,b) => a.localeCompare(b)).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            {!userCategories.includes("Uncategorized") && <option value="Uncategorized">Uncategorized</option>}
                        </select></div></div>
                <fieldset className="mb-6 border border-slate-600 p-4 rounded-md">
                    <legend className="text-sm font-medium text-sky-400 px-2">Primary Input</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div><label htmlFor="primaryInputType" className="block text-xs text-slate-400 mb-1">Input Nature</label>
                            <select id="primaryInputType" value={editingTemplateData.primaryInput.id || 'volume'} onChange={(e) => handleTemplatePrimaryInputChange('id', e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm focus:ring-sky-500 outline-none">
                                <option value="volume">Volume Based</option><option value="area">Area Based</option><option value="area_datar">Luas Datar Based</option><option value="item">Item/Count Based</option></select></div>
                        <div><label htmlFor="primaryInputLabel" className="block text-xs text-slate-400 mb-1">Display Label</label>
                            <select id="primaryInputLabel" value={editingTemplateData.primaryInput.label} onChange={(e) => handleTemplatePrimaryInputChange('label', e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm focus:ring-sky-500 outline-none">
                                {DEFAULT_PRIMARY_INPUT_LABELS.map(lbl => <option key={lbl} value={lbl}>{lbl}</option>)}</select></div>
                        <div><label htmlFor="primaryInputUnit" className="block text-xs text-slate-400 mb-1">Display Unit</label>
                             <select id="primaryInputUnit" value={editingTemplateData.primaryInput.unit} onChange={(e) => handleTemplatePrimaryInputChange('unit', e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm focus:ring-sky-500 outline-none">
                                {userUnits.sort((a,b) => a.localeCompare(b)).map(unt => <option key={unt} value={unt}>{unt}</option>)}</select></div></div></fieldset>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-sky-300">Components (Materials & Labor)</h3>
                    <button onClick={handleSuggestComponents} disabled={!editingTemplateData.name.trim() || isSuggestingComponents} className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-md flex items-center disabled:opacity-60">
                       {isSuggestingComponents ? <Loader2 size={16} className="mr-1.5 animate-spin"/> : <Sparkles size={16} className="mr-1.5"/>}
                       {isSuggestingComponents ? 'Suggesting...' : '✨ Suggest Components'}</button></div>
                <div className="space-y-3 mb-4 max-h-[50vh] overflow-y-auto pr-2"> 
                    {editingTemplateData.components.map((comp, index) => (
                        <div key={comp.tempId} className="p-3 bg-slate-700/70 rounded-md border border-slate-600 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-3 gap-y-2 items-end relative">
                            <button onClick={() => handleRemoveTemplateComponent(index)} className="absolute top-1 right-1 p-1 text-red-500 hover:text-red-400" title="Remove Component"><XCircle size={16}/></button>
                            <div className="lg:col-span-2"><label className="block text-xs text-slate-400 mb-0.5">Select Resource from Price List</label>
                                <select value={comp.selectedResourceId || ''} onChange={(e) => handleTemplateComponentChange(index, 'selectedResourceId', e.target.value)} className="w-full p-1.5 bg-slate-600 border border-slate-500 rounded-md text-white text-sm">
                                    <option value="">-- Select Resource --</option>
                                    {sortedMaterialPrices.map(priceItem => (<option key={priceItem.id} value={priceItem.id}>{priceItem.name} ({priceItem.unit})</option>))}
                                </select></div>
                            <div> <label className="block text-xs text-slate-400 mb-0.5">Component Display Name</label> <input type="text" value={comp.name} onChange={(e) => handleTemplateComponentChange(index, 'name', e.target.value)} placeholder="Display Name" className="w-full p-1.5 bg-slate-600 border border-slate-500 rounded-md text-white text-sm"/></div>
                            <div> <label className="block text-xs text-slate-400 mb-0.5">Coefficient</label> <input type="number" step="0.0001" value={comp.coefficient} onChange={(e) => handleTemplateComponentChange(index, 'coefficient', e.target.value)} className="w-full p-1.5 bg-slate-600 border border-slate-500 rounded-md text-white text-sm"/></div>
                            <div> <label className="block text-xs text-slate-400 mb-0.5">Type</label>
                                <select value={comp.type} onChange={(e) => handleTemplateComponentChange(index, 'type', e.target.value)} className="w-full p-1.5 bg-slate-600 border border-slate-500 rounded-md text-white text-sm">
                                    <option value="material">Material</option><option value="labor">Labor</option><option value="material_service">Material + Service</option><option value="info">Informational (No Cost)</option></select></div></div>))}</div>
                <button onClick={handleAddTemplateComponent} className="mb-6 px-3 py-1.5 text-sm bg-teal-600 hover:bg-teal-500 text-white rounded-md flex items-center"><PlusCircle size={16} className="mr-1.5"/> Add Component</button>
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-700">
                    <button onClick={() => { setShowTemplateForm(false); setEditingTemplateData(null); setSelectedTemplateKeyForEditing(null); }} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md">Cancel</button>
                    <button onClick={handleSaveWorkItemTemplate} disabled={isSavingDefinition} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center disabled:opacity-50">
                        <Save size={18} className="mr-2"/> {isSavingDefinition ? 'Saving...' : 'Save Definition'}</button></div></div>);
    }
    return ( 
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-semibold text-sky-400 flex items-center"><ClipboardList size={30} className="mr-3"/>Work Item Definitions</h2>
                <div className="flex space-x-3">
                    <button 
                        onClick={() => setShowManageCategoriesModal(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shadow-md flex items-center transition-transform hover:scale-105">
                        <Settings size={20} className="mr-2"/> Manage Categories
                    </button>
                    <button onClick={() => handleOpenTemplateForm(null)} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md shadow-md flex items-center transition-transform hover:scale-105">
                        <FilePlus size={20} className="mr-2"/> Create New Definition
                    </button>
                </div>
            </div>
            {isLoading && currentView === 'workItemDefinitions' && Object.keys(userWorkItemTemplates).length === 0 && (<div className="p-6 bg-slate-700 rounded-lg text-center text-slate-400">Loading definitions...</div>)}
            {!isLoading && Object.keys(userWorkItemTemplates).length === 0 && ( <div className="p-6 bg-slate-700 rounded-lg text-center text-slate-300"><Info size={24} className="mx-auto mb-2 text-sky-500"/> No work item definitions found. Click "Create New Definition" to get started.</div>)}
            {Object.entries(templatesByCategory).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, templates]) => (
                <div key={category} className="bg-slate-700/50 p-4 rounded-lg">
                    <h3 className="text-xl font-semibold text-sky-300 mb-3 border-b border-slate-600 pb-2">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.sort((a,b) => a.name.localeCompare(b.name)).map(template => (
                            <div key={template.key} className="bg-slate-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start mb-2"> <h4 className="text-lg font-medium text-white flex-grow break-words">{template.name}</h4>
                                    <div className="flex-shrink-0 space-x-1 ml-2">
                                        <button onClick={() => handleOpenTemplateForm(template.key)} title="Edit Definition" className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors"><Edit3 size={16}/></button>
                                        <button onClick={() => handleDeleteWorkItemDefinition(template.key)} title="Delete Definition" className="p-1 text-red-500 hover:text-red-400 transition-colors"><Trash2 size={16}/></button></div></div>
                                <p className="text-xs text-slate-400 mb-1">Key: <span className="font-mono">{template.key}</span></p>
                                <p className="text-xs text-slate-500 mt-1">Components: {template.components?.length || 0}</p></div>))}</div></div>))}</div>);};
  
  const renderManageCategoriesModal = () => { // For Work Item Categories
    if (!showManageCategoriesModal) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[95] p-4">
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[70vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-sky-400">Manage Work Item Categories</h3>
                    <button onClick={() => setShowManageCategoriesModal(false)} className="p-1 text-slate-400 hover:text-white"><XCircle size={24}/></button>
                </div>
                <div className="mb-4 flex space-x-2">
                    <input 
                        type="text" 
                        value={newCategoryName} 
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category name"
                        className="flex-grow p-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-sky-500 outline-none"
                    />
                    <button onClick={handleAddNewCategory} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center"><PlusCircle size={18} className="mr-2"/> Add</button>
                </div>
                <div className="overflow-y-auto flex-grow space-y-2 pr-1">
                    {userCategories.length === 0 && <p className="text-slate-400 text-center">No categories yet.</p>}
                    {userCategories.sort((a,b) => a.localeCompare(b)).map(category => (
                        <div key={category} className="flex justify-between items-center p-2 bg-slate-700 rounded-md">
                            <span className="text-white">{category}</span>
                            <button onClick={() => handleDeleteCategory(category)} className="p-1 text-red-500 hover:text-red-400" title="Delete Category"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-700 text-right">
                    <button onClick={() => setShowManageCategoriesModal(false)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md">Close</button>
                </div>
            </div>
        </div>
    );
  };

  const renderManageUnitsModal = () => {
    if (!showManageUnitsModal) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[95] p-4">
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[70vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-sky-400">Manage Units</h3>
                    <button onClick={() => setShowManageUnitsModal(false)} className="p-1 text-slate-400 hover:text-white"><XCircle size={24}/></button>
                </div>
                <div className="mb-4 flex space-x-2">
                    <input 
                        type="text" 
                        value={newUnitName} 
                        onChange={(e) => setNewUnitName(e.target.value)}
                        placeholder="New unit name (e.g., Roll, Pcs)"
                        className="flex-grow p-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-sky-500 outline-none"
                    />
                    <button onClick={handleAddNewUnit} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center"><PlusCircle size={18} className="mr-2"/> Add</button>
                </div>
                <div className="overflow-y-auto flex-grow space-y-2 pr-1">
                    {userUnits.length === 0 && <p className="text-slate-400 text-center">No units yet.</p>}
                    {userUnits.sort((a,b) => a.localeCompare(b)).map(unit => (
                        <div key={unit} className="flex justify-between items-center p-2 bg-slate-700 rounded-md">
                            <span className="text-white">{unit}</span>
                            <button onClick={() => handleDeleteUnit(unit)} className="p-1 text-red-500 hover:text-red-400" title="Delete Unit"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-700 text-right">
                    <button onClick={() => setShowManageUnitsModal(false)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md">Close</button>
                </div>
            </div>
        </div>
    );
  };
  
  const renderManageCashFlowCategoriesModal = () => {
    if (!showManageCashFlowCategoriesModal) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[95] p-4">
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[70vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-sky-400">Manage Cash Flow Categories</h3>
                    <button onClick={() => setShowManageCashFlowCategoriesModal(false)} className="p-1 text-slate-400 hover:text-white"><XCircle size={24}/></button>
                </div>
                <div className="mb-4 flex space-x-2">
                    <input 
                        type="text" 
                        value={newCashFlowCategoryName} 
                        onChange={(e) => setNewCashFlowCategoryName(e.target.value)}
                        placeholder="New cash flow category name"
                        className="flex-grow p-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-sky-500 outline-none"
                    />
                    <button onClick={handleAddNewCashFlowCategory} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center"><PlusCircle size={18} className="mr-2"/> Add</button>
                </div>
                <div className="overflow-y-auto flex-grow space-y-2 pr-1">
                    {userCashFlowCategories.length === 0 && <p className="text-slate-400 text-center">No cash flow categories yet.</p>}
                    {userCashFlowCategories.sort((a,b) => a.localeCompare(b)).map(category => (
                        <div key={category} className="flex justify-between items-center p-2 bg-slate-700 rounded-md">
                            <span className="text-white">{category}</span>
                            <button onClick={() => handleDeleteCashFlowCategory(category)} className="p-1 text-red-500 hover:text-red-400" title="Delete Category"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-700 text-right">
                    <button onClick={() => setShowManageCashFlowCategoriesModal(false)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md">Close</button>
                </div>
            </div>
        </div>
    );
  };

  const renderInsightsModal = () => {
    if (!showInsightsModal) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[90] p-4">
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-sky-400 flex items-center"><Sparkles size={22} className="mr-2 text-purple-400"/> Project Insights for: {currentProject?.projectName}</h3>
                    <button onClick={() => setShowInsightsModal(false)} className="p-1 text-slate-400 hover:text-white"><XCircle size={24}/></button></div>
                <div className="overflow-y-auto flex-grow pr-2 text-slate-300">
                    {isFetchingProjectInsights ? (
                        <div className="flex flex-col items-center justify-center h-full"><Loader2 size={48} className="text-purple-500 animate-spin mb-4"/><p>✨ Generating insights with AI...</p></div>
                    ) : ( <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: projectInsights.replace(/\n/g, '<br />') }}></div>)}
                </div>
                 <div className="mt-6 pt-4 border-t border-slate-700 text-right">
                    <button onClick={() => setShowInsightsModal(false)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md">Close</button></div></div></div>);};
  
  const renderCashFlowSummaryView = () => {
    let totalOverallIncome = 0;
    let totalOverallExpenses = 0;

    projects.forEach(proj => {
        totalOverallIncome += proj.actualIncome || 0;
        totalOverallExpenses += proj.actualExpenses || 0;
    });
    const totalOverallNetCashFlow = totalOverallIncome - totalOverallExpenses;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-semibold text-sky-400 mb-6 flex items-center"><PieChart size={30} className="mr-3"/>Overall Cash Flow Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-6 bg-green-800/50 rounded-xl shadow-lg text-center">
                        <h3 className="text-lg text-green-300 font-semibold mb-1">Total Overall Income</h3>
                        <p className="text-3xl font-bold text-green-400">{formatCurrency(totalOverallIncome)}</p>
                    </div>
                    <div className="p-6 bg-red-800/50 rounded-xl shadow-lg text-center">
                        <h3 className="text-lg text-red-300 font-semibold mb-1">Total Overall Expenses</h3>
                        <p className="text-3xl font-bold text-red-400">{formatCurrency(totalOverallExpenses)}</p>
                    </div>
                    <div className="p-6 bg-sky-800/50 rounded-xl shadow-lg text-center">
                        <h3 className="text-lg text-sky-300 font-semibold mb-1">Overall Net Cash Flow</h3>
                        <p className={`text-3xl font-bold ${totalOverallNetCashFlow >= 0 ? 'text-sky-400' : 'text-orange-400'}`}>{formatCurrency(totalOverallNetCashFlow)}</p>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-2xl font-semibold text-sky-300 mb-4">Cash Flow by Project</h3>
                {projects.length === 0 && <p className="text-slate-400 text-center">No projects available to summarize.</p>}
                {projects.length > 0 && (
                    <div className="overflow-x-auto bg-slate-700/50 rounded-lg shadow-lg">
                        <table className="w-full min-w-max text-left text-slate-300">
                            <thead className="bg-slate-800 text-slate-400">
                                <tr>
                                    <th className="p-4">Project Name</th>
                                    <th className="p-4 text-right">Total Income</th>
                                    <th className="p-4 text-right">Total Expenses</th>
                                    <th className="p-4 text-right">Net Cash Flow</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.sort((a,b) => a.projectName.localeCompare(b.projectName)).map(proj => {
                                    const netCashFlow = (proj.actualIncome || 0) - (proj.actualExpenses || 0);
                                    return (
                                        <tr key={proj.id} className="border-b border-slate-600 hover:bg-slate-600/50 transition-colors">
                                            <td className="p-4 text-white font-medium">{proj.projectName}</td>
                                            <td className="p-4 text-right text-green-400">{formatCurrency(proj.actualIncome || 0)}</td>
                                            <td className="p-4 text-right text-red-400">{formatCurrency(proj.actualExpenses || 0)}</td>
                                            <td className={`p-4 text-right font-semibold ${netCashFlow >= 0 ? 'text-sky-400' : 'text-orange-400'}`}>
                                                {formatCurrency(netCashFlow)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
  };


  if (!isAuthReady && isLoading) { 
    return ( <div className="flex items-center justify-center min-h-screen bg-slate-800 text-white p-4"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div><p className="ml-3 text-lg">Initializing Budget Planner...</p></div>);
  }
  if (!isAuthReady && !isLoading && !userId) { 
     return ( <div className="flex flex-col items-center justify-center min-h-screen bg-slate-800 text-white p-4 text-center"><AlertTriangle size={48} className="text-red-500 mb-4" /><h1 className="text-2xl font-semibold mb-2">Authentication Failed</h1><p className="text-slate-300">Could not sign in. Check Firebase setup or network.</p>{renderToast()}</div>);
  }

  const copyUserIdToClipboard = () => {
    if (userId) {
      const tempInput = document.createElement('input'); tempInput.value = userId; document.body.appendChild(tempInput); tempInput.select();
      try { document.execCommand('copy'); showToast('success', 'User ID copied!'); } 
      catch (err) { showToast('error', 'Failed to copy User ID.'); console.error('Failed to copy User ID: ', err); }
      document.body.removeChild(tempInput);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-8">
      {renderToast()}
      {renderConfirmModal()}
      {renderInsightsModal()}
      {renderManageCategoriesModal()}
      {renderManageUnitsModal()}
      {renderManageCashFlowCategoriesModal()}
      <header className="mb-8 pb-4 border-b border-slate-700">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
            <h1 className="text-4xl font-bold text-sky-500 mb-4 md:mb-0">Construction Budget Planner</h1>
            <nav className="flex space-x-2 md:space-x-3 bg-slate-800 p-1.5 rounded-lg shadow">
            {['projects', 'materialPrices', 'workItemDefinitions', 'cashFlowSummary'].map(view => (
                <button key={view} onClick={() => setCurrentView(view)}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors flex items-center ${currentView === view ? 'bg-sky-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                {view === 'projects' ? <Briefcase size={16} className="mr-1.5"/> : 
                 view === 'materialPrices' ? <DollarSign size={16} className="mr-1.5"/> : 
                 view === 'workItemDefinitions' ? <ClipboardList size={16} className="mr-1.5"/> :
                 <PieChart size={16} className="mr-1.5"/>}
                {view === 'projects' ? 'Projects' : 
                 view === 'materialPrices' ? 'Prices' : 
                 view === 'workItemDefinitions' ? 'Definitions' :
                 'CF Summary'}
                </button>))}
                 <button 
                    onClick={() => setShowManageCashFlowCategoriesModal(true)}
                    className="px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white flex items-center">
                    <Settings size={16} className="mr-1.5"/> CF Categories
                </button>
            </nav>
        </div>
        {userId && (<div className="mt-3 text-xs text-slate-500 flex items-center justify-end">User ID: {userId} <button onClick={copyUserIdToClipboard} title="Copy User ID" className="ml-2 p-1 hover:text-sky-400 transition-colors"><Copy size={12}/></button></div>)}
      </header>
      <main className="container mx-auto">
        {isLoading && (currentView !== 'projects' || (currentView === 'projects' && projects.length === 0 && !showProjectForm)) && ( <div className="flex items-center justify-center mt-10"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div><p className="ml-3 text-lg text-slate-300">Loading {currentView === 'cashFlowSummary' ? 'Cash Flow Summary' : currentView}...</p></div>)}
        {!isLoading && currentView === 'materialPrices' && renderMaterialPricesView()}
        {!isLoading && currentView === 'projects' && renderProjectsView()} 
        {!isLoading && currentView === 'workItemDefinitions' && renderWorkItemDefinitionsView()}
        {!isLoading && currentView === 'cashFlowSummary' && renderCashFlowSummaryView()}
      </main>
      <footer className="mt-12 pt-6 border-t border-slate-700 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Budget Planner Pro. For estimation purposes only.</p>
        <p className="mt-1">Ensure all material prices and definitions are up-to-date for accurate calculations.</p>
      </footer>
    </div>);
    
}

export default App;
