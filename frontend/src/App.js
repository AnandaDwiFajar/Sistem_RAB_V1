/* eslint-disable require-jsdoc, camelcase, brace-style, block-spacing, arrow-parens */
import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
// Removed signInWithCustomToken as it was unused
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import {
  DollarSign, Briefcase, Copy, ClipboardList, PieChart, LogOut
} from 'lucide-react';
import ArchivedProjectsListView from './components/ArchivedProjectsListView';
import * as apiService from './services/apiService';

// Import Constants
import {
  DEFAULT_WORK_ITEM_CATEGORIES_FALLBACK,
  DEFAULT_PRIMARY_INPUT_LABELS,
  DEFAULT_UNITS_FALLBACK,
  DEFAULT_CASH_FLOW_CATEGORIES_FALLBACK,
  OTHER_UNIT_MARKER
} from './utils/constants';

// Import Helpers
import { formatCurrency, generateId, slugify } from './utils/helpers';

// Import Components
import Toast from './components/Toast';
import ConfirmModal from './components/modals/ConfirmModal';
import InsightsModal from './components/modals/InsightsModal';
import ManageWorkItemCategoriesModal from './components/modals/ManageWorkItemCategoriesModal';
import ManageUnitsModal from './components/modals/ManageUnitsModal';
import ManageCashFlowCategoriesModal from './components/modals/ManageCashFlowCategoriesModal';
import MaterialPricesView from './components/MaterialPricesView';
import ProjectsView from './components/ProjectsView';
import WorkItemDefinitionsView from './components/WorkItemDefinitionsView';
import CashFlowSummaryView from './components/CashFlowSummaryView';
import LoginPage from './components/LoginPage';

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
  // --- State Hooks (useState) ---
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // General loading for views
  const [currentView, setCurrentView] = useState('projects'); // projects, materialPrices, workItemDefinitions, cashFlowSummary
  const [currentProjectView, setCurrentProjectView] = useState('workItems'); // For tabs within a selected project
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [toastMessage, setToastMessage] = useState(null); // { type: 'success' | 'error' | 'info', message: string }

  // Global User-specific Dropdown Data
  const [userWorkItemCategories, setUserWorkItemCategories] = useState([]);
  const [userUnits, setUserUnits] = useState([]);
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
  const [projectFormData, setProjectFormData] = useState({ projectName: '' });
  const [projectInsights, setProjectInsights] = useState('');
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  // Work Items Data (within a project)
  const [showWorkItemForm, setShowWorkItemForm] = useState(false);
  const [workItemFormData, setWorkItemFormData] = useState({ templateKey: '', primaryInputValue: '' });
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

  // --- Callback Hooks (useCallback) ---
  const showToast = useCallback((type, message) => {
    setToastMessage({ type, message });
  }, [setToastMessage]);

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
      // onAuthStateChanged will handle setting userId and navigating
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.message || "Failed to login. Please check your credentials.";
      setLoginError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  }, [auth, showToast, setIsLoggingIn, setLoginError]);

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

  const handlePriceFormChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === "unitSelector") {
      if (value === OTHER_UNIT_MARKER) {
        setUnitSelectionMode('custom');
        setPriceFormData(prev => ({ ...prev, unitId: '', customUnitName: '' }));
      } else {
        setUnitSelectionMode('select');
        setPriceFormData(prev => ({ ...prev, unitId: value, customUnitName: '' }));
      }
    } else if (name === "customUnitName") {
      setPriceFormData(prev => ({ ...prev, customUnitName: value }));
    } else {
      setPriceFormData(prev => ({ ...prev, [name]: value }));
    }
  }, [setUnitSelectionMode, setPriceFormData]);

  const handleSavePrice = useCallback(async () => {
    let unitToUseId = priceFormData.unitId;

    if (unitSelectionMode === 'custom') {
      if (!priceFormData.customUnitName?.trim()) {
        showToast('error', 'Custom unit name is required.'); return;
      }
      try {
        const addedUnit = await apiService.addUnitApi(userId, priceFormData.customUnitName.trim());
        unitToUseId = addedUnit.id;
        setUserUnits(prev => [...prev, { id: addedUnit.id, unit_name: addedUnit.unit_name }].sort((a, b) => a.unit_name.localeCompare(b.unit_name)));
        showToast('info', `Custom unit "${addedUnit.unit_name}" saved.`);
      } catch (e) {
        if (e.message && e.message.toLowerCase().includes('already exists')) {
          const existingUnit = userUnits.find(u => u.unit_name.toLowerCase() === priceFormData.customUnitName.trim().toLowerCase());
          if (existingUnit) {
            unitToUseId = existingUnit.id;
            showToast('info', `Using existing unit "${existingUnit.unit_name}".`);
          } else {
            showToast('error', `Failed to handle custom unit: ${e.message}.`);
            console.error("Error with custom unit:", e); return;
          }
        } else {
          showToast('error', `Failed to save custom unit: ${e.message}`);
          console.error("Error adding custom unit:", e); return;
        }
      }
    }

    if (!priceFormData.name?.trim() || !unitToUseId || priceFormData.price === undefined || priceFormData.price === null) {
      showToast('error', 'Name, unit, and price are required.'); return;
    }
    const priceValue = parseFloat(priceFormData.price);
    if (isNaN(priceValue) || priceValue < 0) { showToast('error', 'Invalid price amount.'); return; }

    const pricePayload = { item_name: priceFormData.name.trim(), unit_id: unitToUseId, price: priceValue };
    setIsSavingPrice(true);
    try {
      let apiResponseData;
      if (editingPrice) {
        apiResponseData = await apiService.updateMaterialPriceApi(editingPrice.id, pricePayload, userId);
        showToast('success', 'Price updated!');
      } else {
        apiResponseData = await apiService.addMaterialPriceApi(userId, pricePayload);
        showToast('success', 'Price added!');
      }

      const newPriceEntry = {
        id: apiResponseData.id,
        name: apiResponseData.name,
        unit: apiResponseData.unit,
        unit_id: unitToUseId,
        price: parseFloat(apiResponseData.price)
      };

      if (editingPrice) {
        setMaterialPrices(prev => prev.map(p => p.id === editingPrice.id ? newPriceEntry : p));
      } else {
        setMaterialPrices(prev => [...prev, newPriceEntry].sort((a, b) => (a.name || "").localeCompare(b.name || "")));
      }

      const firstUnitAvailable = userUnits.length > 0 ? userUnits[0] : { id: '', unit_name: '' };
      setPriceFormData({ name: '', unitId: firstUnitAvailable.id, customUnitName: '', price: '' });
      setUnitSelectionMode('select');
      setShowPriceForm(false);
      setEditingPrice(null);
    } catch (e) {
      console.error("Save price error:", e);
      showToast('error', `Save price error: ${e.message}`);
    }
    setIsSavingPrice(false);
  }, [priceFormData, unitSelectionMode, userId, editingPrice, showToast, apiService, setUserUnits, userUnits, setIsSavingPrice, setMaterialPrices, setPriceFormData, setShowPriceForm, setEditingPrice, setUnitSelectionMode]);

  const handleEditPrice = useCallback((price) => {
    setEditingPrice(price);
    const unitExistsInList = userUnits.some(u => u.id === price.unit_id);
    if (unitExistsInList) {
      setUnitSelectionMode('select');
      setPriceFormData({ name: price.name, unitId: price.unit_id, customUnitName: '', price: price.price.toString() });
    } else {
      setUnitSelectionMode('custom');
      setPriceFormData({ name: price.name, unitId: '', customUnitName: price.unit, price: price.price.toString() });
      showToast('info', `Unit "${price.unit}" for this item is not in your standard list. Edit as custom or add to list.`);
    }
    setShowPriceForm(true);
  }, [setEditingPrice, userUnits, setUnitSelectionMode, setPriceFormData, setShowPriceForm, showToast]);

  const handleDeletePrice = useCallback(async (priceIdToDelete) => {
    if (!await window_confirm(`Delete this price item?`)) return;
    try {
      await apiService.deleteMaterialPriceApi(priceIdToDelete, userId);
      setMaterialPrices(prevPrices => prevPrices.filter(price => price.id !== priceIdToDelete));
      showToast('success', 'Price deleted!');
    } catch (e) { console.error("Delete price error:", e); showToast('error', `Delete price error: ${e.message}`); }
  }, [window_confirm, userId, apiService, setMaterialPrices, showToast]);

  const handleProjectFormChange = useCallback((e) => setProjectFormData({ ...projectFormData, [e.target.name]: e.target.value }), [projectFormData]);

  const handleSaveProject = useCallback(async () => {
    if (!projectFormData.projectName.trim()) { showToast('error', 'Project name required.'); return; }
    setIsSavingProject(true);
    try {
      const newProject = await apiService.createProjectApi(userId, { projectName: projectFormData.projectName.trim() });
      setProjects(prev => [newProject, ...prev].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      showToast('success', 'Project created!');
      setProjectFormData({ projectName: '' }); setShowProjectForm(false);
      setCurrentProjectId(newProject.id);
      setCurrentProject(newProject);
    } catch (e) { console.error("Save project error:", e); showToast('error', `Save project error: ${e.message}`); }
    setIsSavingProject(false);
  }, [projectFormData, userId, apiService, setProjects, showToast, setProjectFormData, setShowProjectForm, setCurrentProjectId, setCurrentProject, setIsSavingProject]);

  const handleSelectProject = useCallback(async (projectId) => {
    setIsLoading(true);
    try {
      const selectedProjectFull = await apiService.fetchProjectByIdApi(userId, projectId);
      if (selectedProjectFull) {
        setCurrentProjectId(projectId);
        setCurrentProject(selectedProjectFull);
        setCalculatedWorkItemPreview(null);
        setWorkItemFormData({ templateKey: '', primaryInputValue: '' });
        setProjectInsights('');
        setCurrentProjectView('workItems');
      } else {
        showToast('error', 'Could not load project details.');
        setCurrentProjectId(null); setCurrentProject(null);
      }
    } catch (error) {
      showToast('error', `Error loading project: ${error.message}`);
      console.error("Error selecting project:", error);
      setCurrentProjectId(null); setCurrentProject(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId, apiService, setCurrentProjectId, setCurrentProject, setCalculatedWorkItemPreview, setWorkItemFormData, setProjectInsights, setCurrentProjectView, showToast, setIsLoading]);

  const handleDeleteProject = useCallback(async (projectIdToDelete) => {
    const projName = projects.find(p => p.id === projectIdToDelete)?.project_name;
    if (!await window_confirm(`Delete project "${projName || 'this project'}"? This is irreversible.`)) return;
    try {
      await apiService.deleteProjectApi(userId, projectIdToDelete);
      setProjects(prev => prev.filter(p => p.id !== projectIdToDelete));
      showToast('success', 'Project deleted!');
      if (currentProjectId === projectIdToDelete) { setCurrentProjectId(null); setCurrentProject(null); setProjectInsights(''); }
    } catch (e) { console.error("Delete project error:", e); showToast('error', `Delete project error: ${e.message}`); }
  }, [projects, window_confirm, userId, apiService, setProjects, showToast, currentProjectId, setCurrentProjectId, setCurrentProject, setProjectInsights]);

  const handleWorkItemFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setWorkItemFormData(prev => ({ ...prev, [name]: value }));
  }, [setWorkItemFormData]);

  const previewWorkItemCalculation = useCallback((templateKey, primaryInputValueStr) => {
    if (!isAuthReady || !userId) return;
    if (!templateKey || !primaryInputValueStr) {
      setCalculatedWorkItemPreview(null);
      return;
    }
    const template = userWorkItemTemplates[templateKey];
    const primaryInputValue = parseFloat(primaryInputValueStr);

    if (!template || isNaN(primaryInputValue) || primaryInputValue <= 0) {
      setCalculatedWorkItemPreview(null);
      if (primaryInputValueStr && (isNaN(primaryInputValue) || primaryInputValue <= 0) && template) {
        showToast('error', `Invalid input value for ${template.primary_input_label || 'item'}.`);
      }
      return;
    }

    let totalItemCost = 0;
    const calculatedComponents = (template.components || []).map(comp => {
      const priceInfo = materialPrices.find(p => p.id === comp.material_price_id);
      const pricePerUnit = priceInfo ? priceInfo.price : 0;
      if (!priceInfo && comp.component_type !== 'info' && comp.material_price_id) {
        console.warn(`Price not found for component "${comp.display_name}" (Price ID: ${comp.material_price_id}). Using Rp 0.`);
      }
      const quantity = primaryInputValue * comp.coefficient;
      const cost = quantity * pricePerUnit;
      totalItemCost += cost;
      return {
        ...comp,
        name: comp.display_name,
        unit: priceInfo?.unit || comp.unit_snapshot || 'N/A',
        quantity,
        pricePerUnit,
        cost
      };
    });

    setCalculatedWorkItemPreview({
      templateKey: template.id,
      definition_key: template.definition_key,
      name: template.name,
      userInput: { [template.primary_input_nature || 'value']: primaryInputValue },
      primaryInputDisplay: `${primaryInputValue} ${template.primary_input_unit_name || ''}`,
      components: calculatedComponents,
      totalItemCost
    });
  }, [isAuthReady, userId, userWorkItemTemplates, materialPrices, showToast, setCalculatedWorkItemPreview]);

  const handleAddWorkItemToProject = useCallback(async () => {
    if (!currentProject || !calculatedWorkItemPreview) { showToast('error', 'No project or item not calculated.'); return; }
    setIsAddingWorkItem(true);
    try {
      const updatedProject = await apiService.addWorkItemToProjectApi(userId, currentProject.id, calculatedWorkItemPreview);
      setCurrentProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      showToast('success', `Work item "${calculatedWorkItemPreview.name}" added!`);
      setWorkItemFormData({ templateKey: '', primaryInputValue: '' });
      setCalculatedWorkItemPreview(null); setShowWorkItemForm(false);
    } catch (e) { console.error("Add work item error:", e); showToast('error', `Add work item error: ${e.message}`); }
    setIsAddingWorkItem(false);
  }, [currentProject, calculatedWorkItemPreview, userId, apiService, setCurrentProject, setProjects, showToast, setWorkItemFormData, setCalculatedWorkItemPreview, setShowWorkItemForm, setIsAddingWorkItem]);

  const handleDeleteWorkItem = useCallback(async (workItemId) => {
    if (!currentProject || !await window_confirm(`Delete this work item? This might also affect linked cash flow entries.`)) return;
    try {
      const updatedProject = await apiService.deleteWorkItemFromProjectApi(userId, currentProject.id, workItemId);
      setCurrentProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      showToast('success', 'Work item deleted!');
    } catch (e) { console.error("Delete work item error:", e); showToast('error', `Delete work item error: ${e.message}`); }
  }, [currentProject, window_confirm, userId, apiService, setCurrentProject, setProjects, showToast]);

  const handleOpenTemplateForm = useCallback((templateIdToEdit = null) => {
    if (templateIdToEdit && userWorkItemTemplates[templateIdToEdit]) {
      const templateToEdit = JSON.parse(JSON.stringify(userWorkItemTemplates[templateIdToEdit]));
      templateToEdit.components = (templateToEdit.components || []).map(c => ({
        ...c,
        tempId: c.tempId || generateId(),
        selectedResourceId: c.material_price_id || ''
      }));
      setEditingTemplateData(templateToEdit);
      setSelectedTemplateKeyForEditing(templateIdToEdit);
    } else {
      const firstCategory = userWorkItemCategories.length > 0 ? userWorkItemCategories[0] : { id: '', category_name: 'Uncategorized' };
      const firstUnit = userUnits.length > 0 ? userUnits[0] : { id: '', unit_name: '' };
      setEditingTemplateData({
        name: '',
        definition_key: '',
        category_id: firstCategory.id,
        primary_input_label: DEFAULT_PRIMARY_INPUT_LABELS[0],
        primary_input_nature: 'volume',
        primary_input_unit_id: firstUnit.id,
        components: [{ tempId: generateId(), display_name: '', material_price_id: '', coefficient: 0, component_type: 'material', selectedResourceId: '' }],
      });
      setSelectedTemplateKeyForEditing(null);
    }
    setShowTemplateForm(true);
  }, [userWorkItemTemplates, userWorkItemCategories, userUnits, setEditingTemplateData, setSelectedTemplateKeyForEditing, setShowTemplateForm]);

  const handleTemplateFormChange = useCallback((field, value) => setEditingTemplateData(prev => ({ ...prev, [field]: value })), [setEditingTemplateData]);

  const handleTemplateComponentChange = useCallback((index, field, value) => {
    setEditingTemplateData(prev => {
      const updatedComponents = [...(prev.components || [])];
      if (field === 'selectedResourceId') {
        const selectedPriceItem = materialPrices.find(p => p.id === value);
        if (selectedPriceItem) {
          updatedComponents[index] = {
            ...updatedComponents[index],
            display_name: selectedPriceItem.name,
            material_price_id: value,
            selectedResourceId: value
          };
        } else {
          updatedComponents[index] = {
            ...updatedComponents[index],
            display_name: '',
            material_price_id: '',
            selectedResourceId: ''
          };
        }
      } else {
        updatedComponents[index] = { ...updatedComponents[index], [field]: field === 'coefficient' ? parseFloat(value) || 0 : value };
      }
      return { ...prev, components: updatedComponents };
    });
  }, [setEditingTemplateData, materialPrices]);

  const handleAddTemplateComponent = useCallback(() => setEditingTemplateData(prev => ({ ...prev, components: [...(prev.components || []), { tempId: generateId(), display_name: '', material_price_id: '', coefficient: 0, component_type: 'material', selectedResourceId: '' }] })), [setEditingTemplateData]);

  const handleRemoveTemplateComponent = useCallback((index) => setEditingTemplateData(prev => ({ ...prev, components: prev.components.filter((_, i) => i !== index) })), [setEditingTemplateData]);

  const handleSaveWorkItemTemplate = useCallback(async () => {
    if (!editingTemplateData || !editingTemplateData.name?.trim()) { showToast('error', 'Template name required.'); return; }
    if ((editingTemplateData.components || []).some(c => !c.display_name?.trim() || c.coefficient === undefined)) {
      showToast('error', 'Each component needs a display name and coefficient.'); return;
    }
    setIsSavingDefinition(true);
    const payload = {
      ...editingTemplateData,
      definition_key: editingTemplateData.definition_key || slugify(editingTemplateData.name) || generateId(),
      components: (editingTemplateData.components || []).map(({ tempId, selectedResourceId, ...comp }) => ({
        ...comp,
        material_price_id: comp.material_price_id || null
      }))
    };
    delete payload.key;

    try {
      let savedTemplate;
      if (selectedTemplateKeyForEditing) {
        savedTemplate = await apiService.updateWorkItemDefinitionApi(userId, selectedTemplateKeyForEditing, payload);
      } else {
        savedTemplate = await apiService.addWorkItemDefinitionApi(userId, payload);
      }
      setUserWorkItemTemplates(prev => ({ ...prev, [savedTemplate.id]: { ...savedTemplate, key: savedTemplate.id } }));
      showToast('success', `Definition "${savedTemplate.name}" saved!`);
      setShowTemplateForm(false); setEditingTemplateData(null); setSelectedTemplateKeyForEditing(null);
    } catch (e) { console.error("Save definition error:", e); showToast('error', `Save definition error: ${e.message}`); }
    setIsSavingDefinition(false);
  }, [editingTemplateData, showToast, userId, apiService, selectedTemplateKeyForEditing, setUserWorkItemTemplates, setShowTemplateForm, setEditingTemplateData, setSelectedTemplateKeyForEditing, setIsSavingDefinition]);

  const handleDeleteWorkItemDefinition = useCallback(async (definitionIdToDelete) => {
    const template = userWorkItemTemplates[definitionIdToDelete];
    if (!template) return;
    if (!await window_confirm(`Permanently delete definition "${template.name}"?`)) return;
    try {
      await apiService.deleteWorkItemDefinitionApi(userId, definitionIdToDelete);
      setUserWorkItemTemplates(prev => { const newTemplates = { ...prev }; delete newTemplates[definitionIdToDelete]; return newTemplates; });
      showToast('success', `Definition "${template.name}" deleted.`);
    } catch (e) { console.error("Delete definition error:", e); showToast('error', `Error deleting definition: ${e.message}`); }
  }, [userWorkItemTemplates, window_confirm, userId, apiService, setUserWorkItemTemplates, showToast]);

  const handleSuggestComponents = useCallback(async () => {
    if (!editingTemplateData || !editingTemplateData.name.trim()) { showToast('error', 'Please enter a template name first to get suggestions.'); return; }
    setIsSuggestingComponents(true); showToast('info', '✨ Getting component suggestions from AI...');
    const prompt = `Given the construction work item name "${editingTemplateData.name}", suggest a list of typical material and labor components. Provide the response as a JSON array where each object has "componentName" (string, e.g., "Semen Portland"), "unit" (string, e.g., "Zak"), and "type" (string, either "material" or "labor"). For example, for "Pekerjaan Plesteran Dinding", you might suggest [{"componentName": "Semen Portland (PC)", "unit": "kg", "type": "material"}, {"componentName": "Pasir Pasang", "unit": "m³", "type": "material"}, {"componentName": "Pekerja", "unit": "OH", "type": "labor"}]. Only provide the JSON array.`;
    try {
      const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = {
        contents: chatHistory,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: { /* ... schema as in original ... */ }
        }
      };
      const apiKey = "AIzaSyC83nvUw1uSU_VX1uLiUpjMDoy1bXwIojo"; // IMPORTANT: Secure this key
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) { const errorBody = await response.text(); throw new Error(`API error: ${response.status} ${errorBody}`); }
      const result = await response.json();

      if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
        const suggestedComponentsRaw = JSON.parse(result.candidates[0].content.parts[0].text);
        if (Array.isArray(suggestedComponentsRaw)) {
          const newComponentsFromAI = suggestedComponentsRaw.map(sugComp => {
            const matchingPriceItem = materialPrices.find(p =>
              p.name.toLowerCase() === sugComp.componentName.toLowerCase() &&
              p.unit.toLowerCase() === sugComp.unit.toLowerCase()
            );
            return {
              tempId: generateId(),
              display_name: sugComp.componentName,
              material_price_id: matchingPriceItem ? matchingPriceItem.id : '',
              coefficient: 0,
              component_type: sugComp.type || 'material',
              selectedResourceId: matchingPriceItem ? matchingPriceItem.id : ''
            };
          });
          setEditingTemplateData(prev => ({ ...prev, components: [...(prev.components || []), ...newComponentsFromAI] }));
          showToast('success', `${newComponentsFromAI.length} component suggestions added! Please review and set coefficients.`);
        } else { showToast('error', 'AI suggestions format was unexpected.'); }
      } else { showToast('error', 'Could not get suggestions from AI. Response was empty or malformed.'); console.error("Gemini response malformed:", result); }
    } catch (error) { console.error("Error suggesting components:", error); showToast('error', `AI suggestion error: ${error.message}`); }
    setIsSuggestingComponents(false);
  }, [editingTemplateData, showToast, setIsSuggestingComponents, materialPrices, setEditingTemplateData]);

  const handleFetchProjectInsights = useCallback(async () => {
    if (!currentProject) { showToast('error', 'No project selected.'); return; }
    setIsFetchingProjectInsights(true); setProjectInsights(''); setShowInsightsModal(true);
    const workItemsSummary = (currentProject.workItems || []).map(item =>
      `- ${item.definition_name_snapshot} (${item.primary_input_display_snapshot}): ${formatCurrency(parseFloat(item.total_item_cost_snapshot))}`
    ).join('\n');
    const prompt = `Analyze the following construction project budget for a project in Indonesia. Project Name: ${currentProject.project_name}. Total Estimated Budget: ${formatCurrency(currentProject.total_calculated_budget)}. Work Items:\n${workItemsSummary || "No work items detailed."}\nProvide a brief analysis covering: 1. Overall project scope impression. 2. Potential cost-saving suggestions or areas to watch. 3. Common risks or considerations. 4. One or two general recommendations. Keep the response concise and actionable. Format with markdown.`;
    try {
      const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = { contents: chatHistory };
      const apiKey = "AIzaSyC83nvUw1uSU_VX1uLiUpjMDoy1bXwIojo"; // IMPORTANT: Secure this key.
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) { const errorBody = await response.text(); throw new Error(`API error: ${response.status} ${errorBody}`); }
      const result = await response.json();

      if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
        setProjectInsights(result.candidates[0].content.parts[0].text);
      } else {
        setProjectInsights("Could not retrieve insights. AI response was empty/malformed.");
        console.error("Gemini insights response malformed:", result);
      }
    } catch (error) { console.error("Error fetching project insights:", error); setProjectInsights(`Error fetching insights: ${error.message}`); }
    setIsFetchingProjectInsights(false);
  }, [currentProject, showToast, setIsFetchingProjectInsights, setProjectInsights, setShowInsightsModal]);

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


  const handleCashFlowFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setCashFlowFormData(prev => ({ ...prev, [name]: value }));
  }, [setCashFlowFormData]);

  const handleSaveCashFlowEntry = useCallback(async () => {
    if (!cashFlowFormData.description?.trim() || !cashFlowFormData.amount || !cashFlowFormData.date || !cashFlowFormData.categoryId) {
      showToast('error', 'Date, Description, Amount, and Category are required.'); return;
    }
    const amountValue = parseFloat(cashFlowFormData.amount);
    if (isNaN(amountValue) || amountValue <= 0) { showToast('error', 'Invalid amount.'); return; }
    if (!currentProject) { showToast('error', 'No project selected.'); return; }

    setIsSavingCashFlowEntry(true);
    const entryPayload = {
      date: cashFlowFormData.date,
      description: cashFlowFormData.description.trim(),
      type: cashFlowFormData.type,
      amount: amountValue,
      category_id: cashFlowFormData.categoryId
    };

    try {
      let updatedProject;
      if (editingCashFlowEntry) {
        updatedProject = await apiService.updateCashFlowEntryApi(userId, currentProject.id, editingCashFlowEntry.id, entryPayload);
      } else {
        updatedProject = await apiService.addCashFlowEntryApi(userId, currentProject.id, entryPayload);
      }
      setCurrentProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      showToast('success', `Cash flow entry ${editingCashFlowEntry ? 'updated' : 'added'}!`);
      setShowCashFlowForm(false); setEditingCashFlowEntry(null);
      const firstCfCategory = userCashFlowCategories.length > 0 ? userCashFlowCategories[0] : { id: '' };
      setCashFlowFormData({ date: new Date().toISOString().split('T')[0], description: '', type: 'expense', amount: '', categoryId: firstCfCategory.id });
    } catch (e) { console.error("Error saving cash flow entry:", e); showToast('error', `Save cash flow entry error: ${e.message}`); }
    setIsSavingCashFlowEntry(false);
  }, [cashFlowFormData, currentProject, userId, apiService, editingCashFlowEntry, setCurrentProject, setProjects, showToast, setShowCashFlowForm, setEditingCashFlowEntry, userCashFlowCategories, setCashFlowFormData, setIsSavingCashFlowEntry]);

  const handleEditCashFlowEntry = useCallback((entry) => {
    setEditingCashFlowEntry(entry);
    setCashFlowFormData({
      date: entry.entry_date.split('T')[0],
      description: entry.description,
      type: entry.entry_type,
      amount: entry.amount.toString(),
      categoryId: entry.category_id
    });
    setShowCashFlowForm(true);
  }, [setEditingCashFlowEntry, setCashFlowFormData, setShowCashFlowForm]);

  const handleDeleteCashFlowEntry = useCallback(async (entryId) => {
    if (!currentProject || !await window_confirm('Delete this cash flow entry?')) return;
    try {
      const updatedProject = await apiService.deleteCashFlowEntryApi(userId, currentProject.id, entryId);
      setCurrentProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      showToast('success', 'Cash flow entry deleted!');
    } catch (e) { console.error("Error deleting cash flow entry:", e); showToast('error', `Delete cash flow entry error: ${e.message}`); }
  }, [currentProject, window_confirm, userId, apiService, setCurrentProject, setProjects, showToast]);

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

    const handleArchiveProject = useCallback(async (projectIdToArchive) => {
        if (!await window_confirm('Are you sure you want to archive this project?')) return;
        try {
            await apiService.archiveProjectApi(userId, projectIdToArchive);
            setProjects(prev => prev.filter(p => p.id !== projectIdToArchive));
            if (currentProjectId === projectIdToArchive) {
                setCurrentProject(null);
                setCurrentProjectId(null);
            }
            // If on archived view, could refetch or optimistically add to archivedProjects
            if (currentView === 'archivedProjects') {
                 apiService.fetchArchivedProjectsApi(userId).then(data => setArchivedProjects(data || []));
            }
            showToast('success', 'Project archived successfully!');
        } catch (error) {
            console.error("Error archiving project:", error);
            showToast('error', `Failed to archive project: ${error.message}`);
        }
    }, [userId, window_confirm, showToast, currentProjectId, currentView]);

    const handleUnarchiveProject = useCallback(async (projectIdToUnarchive) => {
        if (!await window_confirm('Are you sure you want to unarchive this project?')) return;
        try {
            await apiService.unarchiveProjectApi(userId, projectIdToUnarchive);
            setArchivedProjects(prev => prev.filter(p => p.id !== projectIdToUnarchive));
            // If on active projects view, refetch or optimistically add
             if (currentView === 'projects' || currentView === 'cashFlowSummary') {
                apiService.fetchProjects(userId).then(data => setProjects(data || []));
            }
            showToast('success', 'Project unarchived successfully!');
        } catch (error) {
            console.error("Error unarchiving project:", error);
            showToast('error', `Failed to unarchive project: ${error.message}`);
        }
    }, [userId, window_confirm, showToast, currentView]);


  // --- Effect Hooks (useEffect) ---
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth is not initialized.");
      setIsLoading(false); setIsAuthReady(false);
      showToast('error', 'Authentication service error.');
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsLoading(false);
      } else {
        setUserId(null);
        setIsLoading(false);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [showToast]); // auth is stable, setIsAuthReady, setIsLoading, setUserId are stable

  useEffect(() => {
    if (!isAuthReady || !userId) { setUserWorkItemCategories([]); return; }
    apiService.fetchWorkItemCategories(userId)
      .then(data => setUserWorkItemCategories(data || []))
      .catch(err => {
        showToast('error', 'Failed to load work item categories.');
        console.error(err);
        setUserWorkItemCategories(DEFAULT_WORK_ITEM_CATEGORIES_FALLBACK.map(c => ({ id: c.id, category_name: c.name })));
      });
  }, [isAuthReady, userId, showToast]);

  useEffect(() => {
    if (!isAuthReady || !userId) { setUserUnits([]); return; }
    apiService.fetchUserUnits(userId)
      .then(data => setUserUnits(data || []))
      .catch(err => {
        showToast('error', 'Failed to load units.');
        console.error(err);
        setUserUnits(DEFAULT_UNITS_FALLBACK.map(u => ({ id: u.id, unit_name: u.name })));
      });
  }, [isAuthReady, userId, showToast]);

  useEffect(() => {
    if (!isAuthReady || !userId) { setUserCashFlowCategories([]); return; }
    apiService.fetchCashFlowCategories(userId)
      .then(data => setUserCashFlowCategories(data || []))
      .catch(err => {
        showToast('error', 'Failed to load cash flow categories.');
        console.error(err);
        setUserCashFlowCategories(DEFAULT_CASH_FLOW_CATEGORIES_FALLBACK.map(c => ({ id: c.id, category_name: c.name })));
      });
  }, [isAuthReady, userId, showToast]);

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
    if (workItemFormData.templateKey && workItemFormData.primaryInputValue) {
        previewWorkItemCalculation(workItemFormData.templateKey, workItemFormData.primaryInputValue);
    } else if (workItemFormData.templateKey && !workItemFormData.primaryInputValue) {
        setCalculatedWorkItemPreview(null);
    } else if (!workItemFormData.templateKey) {
        setCalculatedWorkItemPreview(null);
    }
}, [
    workItemFormData.templateKey,
    workItemFormData.primaryInputValue,
    previewWorkItemCalculation, // This is now a stable useCallback
    setCalculatedWorkItemPreview // Stable setter
]);


  useEffect(() => {
    if (!isAuthReady || !userId) {
      setMaterialPrices([]);
      return;
    }
    if (currentView === 'materialPrices' || currentView === 'workItemDefinitions' || (currentView === 'projects' && currentProject)) {
      // setIsLoading(true); // Consider more granular loading specific to this fetch
      apiService.fetchMaterialPrices(userId)
        .then(data => {
          setMaterialPrices(data || []);
        })
        .catch(error => {
          console.error("Error fetching material prices:", error);
          showToast('error', `Error fetching prices: ${error.message}`);
          setMaterialPrices([]);
        })
        .finally(() => {
          if (currentView === 'materialPrices') { // Only set global loading if on this specific view
            setIsLoading(false);
          }
        });
    } else if (currentView === 'materialPrices') { // If view is materialPrices but other conditions not met, stop loading
        setIsLoading(false);
    }
  }, [isAuthReady, userId, currentView, currentProject, showToast, setIsLoading]); // Added setIsLoading

  useEffect(() => {
    if (!isAuthReady || !userId) {
      if (currentView === 'projects' || currentView === 'cashFlowSummary') setIsLoading(false);
      setProjects([]);
      return;
    }
    if (currentView === 'projects' || currentView === 'cashFlowSummary') {
      setIsLoading(true);
      apiService.fetchProjects(userId)
        .then(fetchedProjects => {
          setProjects(fetchedProjects || []);
          if (currentProjectId) {
            const updatedCurrentProjectSummary = (fetchedProjects || []).find(p => p.id === currentProjectId);
            if (updatedCurrentProjectSummary) {
              setCurrentProject(prevCurrentProject => ({
                ...prevCurrentProject,
                ...updatedCurrentProjectSummary
              }));
            }
          }
        })
        .catch(error => {
          console.error("Error fetching projects:", error);
          showToast('error', `Error fetching projects: ${error.message}`);
          setProjects([]);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isAuthReady, userId, currentProjectId, currentView, showToast, setIsLoading, setCurrentProject]); // Added setIsLoading and setCurrentProject

  useEffect(() => {
    if (!isAuthReady || !userId) {
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
  }, [isAuthReady, userId, currentView, showToast, currentProject, setIsLoading]); // Added setIsLoading

  useEffect(() => { // New effect for ARCHIVED projects
        if (!isAuthReady || !userId) {
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
    }, [isAuthReady, userId, currentView, showToast]);

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


  // --- CONDITIONAL RENDERING ---
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-800 text-white p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
        <p className="ml-3 text-lg">Initializing Budget Planner...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <LoginPage
        onLogin={handleLogin}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
      />
    );
  }

  // --- Main App UI ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-8">
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

        <header className="mb-8 pb-4 border-b border-slate-700">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
                <h1 className="text-4xl font-bold text-sky-500 mb-4 md:mb-0">Rencana Anggaran Biaya Proyek Konstruksi</h1>
                {/* Wrapper for navigation and logout */}
                <div className="flex items-center space-x-3 md:space-x-4">
                    <nav className="flex space-x-1 sm:space-x-2 md:space-x-3 bg-slate-800 p-1.5 rounded-lg shadow">
                        {['projects', 'materialPrices', 'workItemDefinitions', 'cashFlowSummary'].map(view => (
                            <button
                                key={view}
                                onClick={() => setCurrentView(view)}
                                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors flex items-center ${
                                    currentView === view ? 'bg-sky-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                }`}
                            >
                                {view === 'projects' ? <Briefcase size={16} className="mr-1.5"/> :
                                 view === 'materialPrices' ? <DollarSign size={16} className="mr-1.5"/> :
                                 view === 'workItemDefinitions' ? <ClipboardList size={16} className="mr-1.5"/> :
                                 <PieChart size={16} className="mr-1.5"/>}
                                {view === 'projects' ? 'Projects' :
                                 view === 'materialPrices' ? 'Prices' :
                                 view === 'workItemDefinitions' ? 'Definitions' :
                                 'CF Summary'}
                            </button>
                        ))}
                        {/* "CF Categories" button is REMOVED from here */}
                    </nav>
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        className="px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium bg-red-600 hover:bg-red-500 text-white shadow-md transition-colors flex items-center"
                    >
                        <LogOut size={16} className="mr-0 sm:mr-1.5"/>
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>
            {userId && (
                <div className="mt-3 text-xs text-slate-500 flex items-center justify-end">
                    User ID: {userId}
                    <button onClick={copyUserIdToClipboard} title="Copy User ID" className="ml-2 p-1 hover:text-sky-400 transition-colors">
                        <Copy size={12}/>
                    </button>
                </div>
            )}
        </header>

      <main className="container mx-auto">
        {isLoading && (
            (currentView === 'materialPrices' && materialPrices.length === 0) ||
            (currentView === 'projects' && projects.length === 0 && !showProjectForm && !currentProject) ||
            (currentView === 'workItemDefinitions' && Object.keys(userWorkItemTemplates).length === 0 && !showTemplateForm) ||
            (currentView === 'cashFlowSummary' && projects.length === 0)
         ) && (
          <div className="flex items-center justify-center mt-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
            <p className="ml-3 text-lg text-slate-300">Loading {
                currentView === 'cashFlowSummary' ? 'Cash Flow Summary' :
                currentView === 'materialPrices' ? 'Material Prices' :
                currentView === 'workItemDefinitions' ? 'Work Item Definitions' :
                'Projects'
            }...</p>
          </div>
        )}

        {!isLoading || (currentView === 'materialPrices' && materialPrices.length > 0) || showPriceForm ? (
          currentView === 'materialPrices' && (
            <MaterialPricesView
              showPriceForm={showPriceForm} setShowPriceForm={setShowPriceForm}
              editingPrice={editingPrice} setEditingPrice={setEditingPrice}
              priceFormData={priceFormData} setPriceFormData={setPriceFormData}
              handlePriceFormChange={handlePriceFormChange}
              handleSavePrice={handleSavePrice} isSavingPrice={isSavingPrice}
              materialPrices={materialPrices} isLoading={isLoading && materialPrices.length === 0 && !showPriceForm}
              handleEditPrice={handleEditPrice} handleDeletePrice={handleDeletePrice}
              userUnits={userUnits} unitSelectionMode={unitSelectionMode}
              setShowManageUnitsModal={setShowManageUnitsModal}
            />
          )
        ) : null}

        {!isLoading || (currentView === 'projects' && (projects.length > 0 || showProjectForm || currentProject)) ? (
           currentView === 'projects' && (
            <ProjectsView
              projects={projects}
              currentProjectId={currentProjectId} currentProject={currentProject}
              showProjectForm={showProjectForm} setShowProjectForm={setShowProjectForm}
              projectFormData={projectFormData} handleProjectFormChange={handleProjectFormChange}
              handleSaveProject={handleSaveProject} isSavingProject={isSavingProject}
              isLoading={isLoading && projects.length === 0 && !showProjectForm && !currentProject}
              handleSelectProject={handleSelectProject} handleDeleteProject={handleDeleteProject}
              handleFetchProjectInsights={handleFetchProjectInsights} isFetchingProjectInsights={isFetchingProjectInsights}
              setShowInsightsModal={setShowInsightsModal}
              currentProjectView={currentProjectView} setCurrentProjectView={setCurrentProjectView}
              showWorkItemForm={showWorkItemForm} setShowWorkItemForm={setShowWorkItemForm}
              workItemFormData={workItemFormData} handleWorkItemFormChange={handleWorkItemFormChange}
              userWorkItemTemplates={userWorkItemTemplates} userWorkItemCategories={userWorkItemCategories}
              materialPrices={materialPrices}
              calculatedWorkItemPreview={calculatedWorkItemPreview} setCalculatedWorkItemPreview={setCalculatedWorkItemPreview}
              handleAddWorkItemToProject={handleAddWorkItemToProject} isAddingWorkItem={isAddingWorkItem}
              handleDeleteWorkItem={handleDeleteWorkItem}
              showCashFlowForm={showCashFlowForm} setShowCashFlowForm={setShowCashFlowForm}
              cashFlowFormData={cashFlowFormData} setCashFlowFormData={setCashFlowFormData}
              handleCashFlowFormChange={handleCashFlowFormChange}
              userCashFlowCategories={userCashFlowCategories}
              editingCashFlowEntry={editingCashFlowEntry} setEditingCashFlowEntry={setEditingCashFlowEntry}
              handleSaveCashFlowEntry={handleSaveCashFlowEntry} isSavingCashFlowEntry={isSavingCashFlowEntry}
              handleEditCashFlowEntry={handleEditCashFlowEntry} handleDeleteCashFlowEntry={handleDeleteCashFlowEntry}
              setShowManageCashFlowCategoriesModal={setShowManageCashFlowCategoriesModal} // Ensure this is passed
              handleArchiveProject={handleArchiveProject}
              setCurrentView={setCurrentView}
            />
          )
        ) : null}


        {!isLoading || (currentView === 'workItemDefinitions' && (Object.keys(userWorkItemTemplates).length > 0 || showTemplateForm)) ? (
            currentView === 'workItemDefinitions' && (
                <WorkItemDefinitionsView
                userWorkItemTemplates={userWorkItemTemplates}
                userWorkItemCategories={userWorkItemCategories}
                materialPrices={materialPrices}
                showTemplateForm={showTemplateForm} setShowTemplateForm={setShowTemplateForm}
                editingTemplateData={editingTemplateData} setEditingTemplateData={setEditingTemplateData}
                selectedTemplateKeyForEditing={selectedTemplateKeyForEditing} setSelectedTemplateKeyForEditing={setSelectedTemplateKeyForEditing}
                handleOpenTemplateForm={handleOpenTemplateForm}
                handleTemplateFormChange={handleTemplateFormChange}
                handleTemplateComponentChange={handleTemplateComponentChange}
                handleAddTemplateComponent={handleAddTemplateComponent}
                handleRemoveTemplateComponent={handleRemoveTemplateComponent}
                handleSaveWorkItemTemplate={handleSaveWorkItemTemplate} isSavingDefinition={isSavingDefinition}
                handleDeleteWorkItemDefinition={handleDeleteWorkItemDefinition}
                handleSuggestComponents={handleSuggestComponents} isSuggestingComponents={isSuggestingComponents}
                isLoading={isLoading && Object.keys(userWorkItemTemplates).length === 0 && !showTemplateForm}
                setShowManageCategoriesModal={setShowManageCategoriesModal}
                userUnits={userUnits}
                />
            )
        ) : null}


          {!isLoading || (currentView === 'cashFlowSummary' && projects.length > 0) ? (
          currentView === 'cashFlowSummary' && (
          <CashFlowSummaryView
            cashFlowSummaryData={cashFlowSummaryData}
            isLoadingSummary={isLoadingCashFlowSummary}
            selectedMonth={selectedCashFlowMonth} // This is still the App.js state for the filter
            setSelectedMonth={setSelectedCashFlowMonth} // To change the filter
          />
          )
        ) : null}

              {!isLoading || (currentView === 'archivedProjects' && archivedProjects.length > 0) ? (
        currentView === 'archivedProjects' && (
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

      <footer className="mt-12 pt-6 border-t border-slate-700 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Sistem Informasi Rencana Anggaran Biaya  </p>
        <p className="mt-1"></p>
      </footer>
    </div>
  );
}

export default App;