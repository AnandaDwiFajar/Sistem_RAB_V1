import { useState, useEffect, useCallback, useRef } from 'react';
import * as apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import React from 'react';
import { CALCULATION_SCHEMAS } from '../utils/calculationSchemas';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ... other necessary imports like constants, schemas ...
const initialWorkItemFormData = {
  templateKey: '',
  primaryInputValue: '',
  parameterValues: {},
};

const initialProjectFormData = {
  projectName: '', customerName: '', location: '', startDate: '', dueDate: '', projectPrice: ''
};
export const useProjects = (userWorkItemTemplates, materialPrices, userUnits, userWorkItemCategories) => {
      const [isGeneratingReport, setIsGeneratingReport] = useState(false);
      const reportContentRef = useRef(null);
      const { showToast, showConfirm } = useUI();
      const [archivedProjects, setArchivedProjects] = useState([]);
      const { userId, userRole, isLoading: isAuthLoading, login, logout } = useAuth();
      const [isLoading, setIsLoading] = useState(true); // General loading for views
      const [currentView, setCurrentView] = useState('projects'); // projects, materialPrices, workItemDefinitions, cashFlowSummary
      const [currentProjectView, setCurrentProjectView] = useState('workItems'); // For tabs within a selected project
      const [isDetailLoading, setIsDetailLoading] = useState(false);
      const [dateError, setDateError] = useState(null);

      // Global User-specific Dropdown Data
      const [userCashFlowCategories, setUserCashFlowCategories] = useState([]);
    
      // Modals Visibility & Form Data

    
      // Specific Loading States
      const [isSavingProject, setIsSavingProject] = useState(false);
      const [isAddingWorkItem, setIsAddingWorkItem] = useState(false);
      const [editingWorkItemId, setEditingWorkItemId] = useState(null);
      const [isUpdatingWorkItem, setIsUpdatingWorkItem] = useState(false);
      const [isFetchingProjectInsights, setIsFetchingProjectInsights] = useState(false);
      const [editingProjectId, setEditingProjectId] = useState(null);
      const [isSavingCashFlowEntry, setIsSavingCashFlowEntry] = useState(false);    
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
      const [workItemFormData, setWorkItemFormData] = useState(initialWorkItemFormData);
      const [calculatedWorkItemPreview, setCalculatedWorkItemPreview] = useState(null);

      // Cash Flow Data (within a project)
      const [showCashFlowForm, setShowCashFlowForm] = useState(false);
      const [cashFlowFormData, setCashFlowFormData] = useState({ date: new Date().toISOString().split('T')[0], description: '', type: '', amount: '', categoryId: '' });
      const [editingCashFlowEntry, setEditingCashFlowEntry] = useState(null);    
    
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

    const [projectNameError, setProjectNameError] = useState(null);
    
      const handleWorkItemFormChange = useCallback((e, paramKeyToUpdate = null) => {
        const { name, value } = e.target;

        setWorkItemFormData(prev => {
            // Jika dropdown template yang berubah
            if (name === 'templateKey') {
                // Saat template baru dipilih, reset semua nilai input
                return {
                    ...initialWorkItemFormData, // Gunakan state awal yang bersih
                    templateKey: value,
                };
            }
            
            // Jika input parameter skema yang berubah
            if (paramKeyToUpdate) {
                return {
                    ...prev,
                    parameterValues: {
                        ...prev.parameterValues,
                        [paramKeyToUpdate]: value,
                    },
                };
            }

            // Untuk input lain seperti primaryInputValue
            return { ...prev, [name]: value };
        });
    }, []);
    
    const [priceError, setPriceError] = useState(null);


    const handleProjectFormChange = useCallback((e) => {
      const { name, value } = e.target;

      setProjectFormData(prev => {
          const newFormData = { ...prev, [name]: value };

          // Validasi Nama Proyek (tidak boleh duplikat)
          if (name === 'projectName') {
              const trimmedValue = value.trim().toLowerCase();
              // Cari proyek lain yang memiliki nama yang sama
              const isDuplicate = projects.some(
                  p => p.project_name.trim().toLowerCase() === trimmedValue && p.id !== editingProjectId
              );
              if (isDuplicate) {
                  setProjectNameError('Nama proyek sudah ada. Silakan gunakan nama lain.');
              } else {
                  setProjectNameError(null);
              }
          }

          // Validasi harga (hanya boleh angka)
          if (name === 'projectPrice') {
              if (value && !/^\d+$/.test(value)) {
                  setPriceError('Harga proyek hanya boleh berisi angka.');
              } else {
                  setPriceError(null);
              }
          }

          // Validasi tanggal (logika yang sudah ada)
          const startDate = name === 'startDate' ? value : newFormData.startDate;
          const dueDate = name === 'dueDate' ? value : newFormData.dueDate;
          if (startDate && dueDate) {
              if (new Date(startDate) > new Date(dueDate)) {
                  setDateError('Tanggal mulai tidak boleh melebihi tanggal tenggat.');
              } else {
                  setDateError(null);
              }
          } else {
              setDateError(null);
          }
          
          return newFormData;
      });
  }, [projects, editingProjectId]);


    // Fetchers for active and archived projects
    const fetchActiveProjects = useCallback(() => {
        if (!userId) return;
        setIsLoading(true);
        apiService.fetchProjects(userId)
            .then(fetchedProjects => setProjects(fetchedProjects || []))
            .catch(error => showToast('error', `Error fetching projects: ${error.message}`))
            .finally(() => setIsLoading(false));
    }, [userId, showToast]);

    const fetchArchivedProjects = useCallback(() => {
        if (!userId) return;
        setIsLoading(true);
        apiService.fetchArchivedProjectsApi(userId)
            .then(data => setArchivedProjects(data || []))
            .catch(error => showToast('error', `Error fetching archived projects: ${error.message}`))
            .finally(() => setIsLoading(false));
    }, [userId, showToast]);

    // Project Handlers
    const handleSelectProject = useCallback(async (projectId) => {
        setIsLoading(true);
        try {
          const selectedProjectFull = await apiService.fetchProjectByIdApi(userId, projectId);
          if (selectedProjectFull) {
            setCurrentProjectId(projectId);
            setCurrentProject(selectedProjectFull);
            setCalculatedWorkItemPreview(null);
            setWorkItemFormData(initialWorkItemFormData);
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
    }, [userId, showToast]);

    const handleSaveOrUpdateProject = useCallback(async () => {
      // Validasi di sisi frontend (ini sudah benar)
      if (!projectFormData.projectName.trim()) {
          showToast('error', 'Nama proyek wajib diisi.');
          return;
      }
      if (projectNameError) {
          showToast('error', projectNameError);
          return;
      }
      if (dateError) {
          showToast('error', dateError);
          return;
      }
      if (priceError) {
          showToast('error', priceError);
          return;
      }
      setIsSavingProject(true);
  
      try {
          let savedProject;
  
          // ================= PERUBAIKAN UTAMA DI SINI =================
          // Ubah format payload dari snake_case menjadi camelCase
          const payload = {
              projectName: projectFormData.projectName,
              customerName: projectFormData.customerName,
              location: projectFormData.location,
              startDate: projectFormData.startDate,
              dueDate: projectFormData.dueDate,
              projectPrice: projectFormData.projectPrice
          };
          // =============================================================
  
          if (editingProjectId) {
              // Sekarang payload sudah sesuai dengan yang diharapkan backend
              savedProject = await apiService.updateProjectApi(userId, editingProjectId, payload);
              
              setProjects(prev => prev.map(p => (p.id === editingProjectId ? savedProject : p)));
  
              if (currentProjectId === editingProjectId) {
                  setCurrentProject(savedProject);
              }
              showToast('success', 'Proyek berhasil diperbarui!');
          } else {
              // Untuk 'create' Anda juga sudah menggunakan camelCase, jadi ini akan tetap konsisten
              savedProject = await apiService.createProjectApi(userId, payload);
              setProjects(prev => [savedProject, ...prev].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
              showToast('success', 'Proyek berhasil dibuat!');
          }
  
          // Reset form (logika ini sudah benar)
          setShowProjectForm(false);
          setEditingProjectId(null);
          setProjectFormData(initialProjectFormData);
          setProjectNameError(null);
          setDateError(null);
          setPriceError(null);
      } catch (e) {
          console.error("Save/Update project error:", e);
          const errorMessage = e.response?.data?.message || e.message;
          showToast('error', `Gagal menyimpan proyek: ${errorMessage}`);
      } finally {
          setIsSavingProject(false);
      }
    }, [projectFormData, userId, showToast, editingProjectId, currentProjectId, dateError, projectNameError, priceError]);

    const handleDeleteProject = useCallback(async (projectIdToDelete) => {
        const projName = projects.find(p => p.id === projectIdToDelete)?.project_name;
        if (!await showConfirm({
          title: 'Konfirmasi Hapus',
          message: 'Apakah Anda yakin ingin menghapus proyek ini?'
      })) return;
        try {
          await apiService.deleteProjectApi(userId, projectIdToDelete);
          setProjects(prev => prev.filter(p => p.id !== projectIdToDelete));
          showToast('success', 'Project deleted!');
          if (currentProjectId === projectIdToDelete) { setCurrentProjectId(null); setCurrentProject(null); setProjectInsights(''); }
        } catch (e) { console.error("Delete project error:", e); showToast('error', `Delete project error: ${e.message}`); }
    }, [projects, showConfirm, userId, showToast]);

    const handleStartEditProject = useCallback(async (projectId) => {
      if (!projectId) {
          setProjectFormData(initialProjectFormData);
          setEditingProjectId(null);
          setDateError(null);
          setPriceError(null);
          setProjectNameError(null);
          setShowProjectForm(true);
          return;
      }

      setIsSavingProject(true);
      setShowProjectForm(true);
      try {
          const projectToEdit = await apiService.fetchProjectByIdApi(userId, projectId);
          
          if (projectToEdit) {
              setProjectFormData({
                  projectName: projectToEdit.project_name || '',
                  customerName: projectToEdit.customer_name || '',
                  location: projectToEdit.location || '',
                  startDate: projectToEdit.start_date ? projectToEdit.start_date.split('T')[0] : '',
                  dueDate: projectToEdit.due_date ? projectToEdit.due_date.split('T')[0] : '',
                  projectPrice: projectToEdit.project_price?.toString() || ''
              });
              setEditingProjectId(projectId);
              setDateError(null);
              setPriceError(null);
              setProjectNameError(null);
          } else {
              showToast('error', 'Gagal memuat data proyek untuk diedit.');
              setShowProjectForm(false);
          }
      } catch (error) {
          console.error("Error fetching project for edit:", error);
          showToast('error', `Gagal memuat data proyek: ${error.message}`);
          setShowProjectForm(false);
      } finally {
          setIsSavingProject(false);
      }
    }, [userId, showToast]);

    const handleCancelEdit = () => {
      setShowProjectForm(false);
      setEditingProjectId(null);
      setProjectFormData(initialProjectFormData);
      setDateError(null);
      setPriceError(null);
      setProjectNameError(null);
    };

    const handleArchiveProject = useCallback(async (projectIdToArchive) => {
            if (!await showConfirm({title: 'Konfirmasi Arsip',
              message: 'Apakah Anda yakin ingin mengarsipkan proyek ini?'})) return;
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
                showToast('success', 'Proyek berhasil diarsipkan!');
            } catch (error) {
                console.error("Error archiving project:", error);
                showToast('error', `Gagal untuk mengarsip proyek: ${error.message}`);
            }
        }, [showConfirm, userId, showToast]);

    const handleUnarchiveProject = useCallback(async (projectIdToUnarchive) => {
            if (!await showConfirm({title: 'Konfirmasi Batal Arsip',
              message: 'Apakah Anda yakin ingin membatalkan pengarsipan proyek ini?'})) return;
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
        }, [showConfirm, userId, showToast]);

    // Work Item Handlers (within a project)
    const previewWorkItemCalculation = useCallback((templateKey, currentFormData) => {
      if (!userId || !templateKey || materialPrices.length === 0 || Object.keys(userWorkItemTemplates).length === 0) {
        setCalculatedWorkItemPreview(null);
        return;
    }
        const template = userWorkItemTemplates[templateKey];
        if (!template) {
          setCalculatedWorkItemPreview(null);
          return;
        }
    
        let calculatedOutputValue;
        let outputDetails = {};
        let inputDetails = {};
    
        let primaryInputDisplaySnapshotText = 'N/A';
        let primaryInputValueForDB = null;
    
        const schemaType = template.calculation_schema_type;
        const schema = schemaType ? CALCULATION_SCHEMAS[schemaType] : null;
    
        if (schema && !schema.isSimple) { // Complex Schema-based calculation
          const parsedParams = {};
          let allInputsValidForCalc = true;
          for (const inputDef of schema.inputs) {
            const userVal = currentFormData.parameterValues[inputDef.key];
            let val = parseFloat(userVal);
            if (userVal === undefined || userVal === '' || isNaN(val)) { // If empty or not a number
              // Use default value from schema if available, otherwise calculation might fail or use 0
              val = inputDef.defaultValue !== undefined ? parseFloat(inputDef.defaultValue) : 0;
               if (userVal !== undefined && userVal !== '' && isNaN(parseFloat(userVal))) { // if user typed something invalid
                  allInputsValidForCalc = false; // Mark as not fully valid for calculation if needed
               }
            }
            parsedParams[inputDef.key] = val;
          }
    
          // Only proceed with calculation if critical inputs are valid (schema.calculate should be robust)
          calculatedOutputValue = schema.calculate(parsedParams);
    
          if (calculatedOutputValue === null || isNaN(calculatedOutputValue)) {
              // showToast('info', `Please provide valid inputs for ${schema.name}.`);
              setCalculatedWorkItemPreview(null); // Don't show preview if calculation fails
              return;
          }
    
          outputDetails = {
            label: schema.output.label,
            value: calculatedOutputValue,
            unit: schema.output.unitSymbol,
          };
          // Store both what user typed (currentFormData.parameterValues) & what was parsed for calc
          inputDetails = {
              type: 'schema',
              parametersSnapshot: { ...currentFormData.parameterValues },
              parsedParameters: parsedParams,
              schemaDiagram: schema.diagramUrl
          };
              primaryInputDisplaySnapshotText = schema.inputs.map(inputDef =>
                `${inputDef.label}: ${currentFormData.parameterValues[inputDef.key] || (parsedParams[inputDef.key] !== undefined ? parsedParams[inputDef.key] + ' (default)' : '-')}${inputDef.unitSymbol}`
            ).join('; ');
          primaryInputValueForDB = calculatedOutputValue;
        } else {
          const valStr = currentFormData.primaryInputValue;
          calculatedOutputValue = parseFloat(valStr);
    
          if (valStr === undefined || valStr.trim() === '' || isNaN(calculatedOutputValue)) {
              setCalculatedWorkItemPreview(null);
              return;
          }
          if (calculatedOutputValue < 0) {
              setCalculatedWorkItemPreview(null);
              return;
          }
    
    
          const unitName = template.primary_input_unit_id ?
                           (userUnits.find(u => u.id === template.primary_input_unit_id)?.unit_name || '') :
                           (CALCULATION_SCHEMAS.SIMPLE_PRIMARY_INPUT.output.unitSymbol || '');
          const label = template.primary_input_label || CALCULATION_SCHEMAS.SIMPLE_PRIMARY_INPUT.output.label;
    
          outputDetails = { label, value: calculatedOutputValue, unit: unitName };
          inputDetails = { type: 'simple', primaryInputValue: calculatedOutputValue, primaryInputUnit: unitName };
    
              primaryInputDisplaySnapshotText = `${label}: ${calculatedOutputValue} ${unitName}`;
          primaryInputValueForDB = calculatedOutputValue;
        }
    
        // Common logic for calculating component costs
        let totalItemCost = 0;
        const calculatedComponents = (template.components || []).map(comp => {
          const priceInfo = materialPrices.find(p => p.id === comp.material_price_id);
          const pricePerUnit = priceInfo ? priceInfo.price : 0;
          const quantity = calculatedOutputValue * comp.coefficient; // Key change: use calculatedOutputValue
          const cost = quantity * pricePerUnit;
          totalItemCost += cost;
          return {
              name: comp.display_name,
              unit: priceInfo?.unit || comp.unit_snapshot || 'N/A',
              quantity,
              pricePerUnit,
              cost,
              component_type: comp.component_type,
              component_name_snapshot: comp.display_name,
              material_price_id_snapshot: comp.material_price_id,
              coefficient_snapshot: comp.coefficient,
              component_type_snapshot: comp.component_type,
              unit_snapshot: priceInfo?.unit || comp.unit_snapshot || 'N/A',
              price_per_unit_snapshot: pricePerUnit,
              quantity_calculated: quantity,
              cost_calculated: cost,
          };
        });
    
        const previewData = {
          // --- Fields expected by backend for direct DB columns ---
          userId: userId,
          source_definition_id_snapshot: template.id,
          definition_name_snapshot: template.name,
          definition_key_snapshot: template.key,
          calculation_value: primaryInputValueForDB,
          primary_input_display_snapshot: primaryInputDisplaySnapshotText,
          total_item_cost_snapshot: totalItemCost,
          components_snapshot: calculatedComponents.map(c => ({
              component_name_snapshot: c.component_name_snapshot,
              material_price_id_snapshot: c.material_price_id_snapshot,
              coefficient_snapshot: c.coefficient_snapshot,
              component_type_snapshot: c.component_type_snapshot,
              unit_snapshot: c.unit_snapshot,
              price_per_unit_snapshot: c.price_per_unit_snapshot,
              quantity_calculated: c.quantity_calculated,
              cost_calculated: c.cost_calculated,
          })),
          input_details_snapshot_json: JSON.stringify(inputDetails),
          output_details_snapshot_json: JSON.stringify(outputDetails), // Contains the main calculated value & label
          calculation_schema_type_snapshot: schemaType || 'SIMPLE_PRIMARY_INPUT',
    
    
          // --- Fields primarily for frontend preview UI ---
          templateKey: template.id,
          name: template.name,
          categoryName: userWorkItemCategories.find(c => c.id === template.category_id)?.category_name || 'Uncategorized',
          calculationSchemaType: schemaType || 'SIMPLE_PRIMARY_INPUT',
          inputDetails: inputDetails,
          outputDetails: outputDetails,
          components: calculatedComponents,
          totalItemCost: totalItemCost,
        };
        setCalculatedWorkItemPreview(previewData);
      }, [userId, userWorkItemTemplates, materialPrices, userUnits, userWorkItemCategories, showToast]);

    const handleAddWorkItemToProject = useCallback(async () => {
        if (!currentProject || !calculatedWorkItemPreview) { showToast('error', 'No project or item not calculated.'); return; }
            console.log("SENDING TO BACKEND (calculatedWorkItemPreview):", JSON.stringify(calculatedWorkItemPreview, null, 2));
        setIsAddingWorkItem(true);
        try {
          const updatedProject = await apiService.addWorkItemToProjectApi(userId, currentProject.id, calculatedWorkItemPreview);
          setCurrentProject(updatedProject);
          setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
          showToast('success', `Item Pekerjaan "${calculatedWorkItemPreview.name}" berhasil ditambahkan!`);
          setWorkItemFormData(initialWorkItemFormData); 
          setCalculatedWorkItemPreview(null); 
          setShowWorkItemForm(false);
        } catch (e) { console.error("Add work item error:", e); showToast('error', `Add work item error: ${e.message}`); }
        setIsAddingWorkItem(false);
    }, [currentProject, calculatedWorkItemPreview, userId, showToast]);

    const handleStartEditWorkItem = useCallback((workItemToEdit) => {
      // Log untuk debugging, periksa apakah objek workItemToEdit memiliki `input_details_snapshot`
      console.log("Memulai edit untuk item:", workItemToEdit);

      if (!workItemToEdit) return;

      let inputDetails = {};
      try {
          // Logika parsing yang lebih aman: Cek jika string, parse. Jika sudah objek, gunakan langsung.
          if (typeof workItemToEdit.input_details_snapshot === 'string') {
            inputDetails = JSON.parse(workItemToEdit.input_details_snapshot || '{}');
          } else if (typeof workItemToEdit.input_details_snapshot === 'object' && workItemToEdit.input_details_snapshot !== null) {
            inputDetails = workItemToEdit.input_details_snapshot;
          }
        } catch (e) {
          console.error("Gagal memproses input_details_snapshot:", e);
          inputDetails = {}; // Fallback ke objek kosong jika ada error
        }

        // Siapkan form data berdasarkan tipe skema
        const newFormData = {
          ...initialWorkItemFormData,
          templateKey: workItemToEdit.source_definition_id_snapshot,
        };

        // Isi form data dari 'inputDetails' yang sudah dipastikan sebagai objek
        if (inputDetails.type === 'schema' && inputDetails.parametersSnapshot) {
          newFormData.parameterValues = inputDetails.parametersSnapshot;
        } else {
          // Fallback ke input sederhana jika bukan schema atau jika parameterSnapshot tidak ada
          newFormData.primaryInputValue = workItemToEdit.calculation_value?.toString() || '';
        }

      setEditingWorkItemId(workItemToEdit.id);
      setWorkItemFormData(newFormData);
      setShowWorkItemForm(true);
      setCalculatedWorkItemPreview(null);
    }, [setEditingWorkItemId, setWorkItemFormData, setShowWorkItemForm]);

    const handleCancelEditWorkItem = useCallback(() => {
      setEditingWorkItemId(null);
      setShowWorkItemForm(false);
      setWorkItemFormData(initialWorkItemFormData);
      setCalculatedWorkItemPreview(null);
    }, [setEditingWorkItemId, setShowWorkItemForm, setWorkItemFormData, setCalculatedWorkItemPreview]);

    const handleUpdateWorkItem = useCallback(async () => {
      if (!editingWorkItemId || !currentProject || !calculatedWorkItemPreview) {
          showToast('error', 'Data tidak lengkap untuk memperbarui item.');
          return;
      }
      setIsUpdatingWorkItem(true);
      try {
          const updatedProject = await apiService.updateWorkItemApi(userId, currentProject.id, editingWorkItemId, calculatedWorkItemPreview);
          setCurrentProject(updatedProject);
          setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
          showToast('success', `Item Pekerjaan "${calculatedWorkItemPreview.name}" berhasil diperbarui!`);
          
          // Reset setelah berhasil
          handleCancelEditWorkItem();
      } catch (e) {
          console.error("Update work item error:", e);
          showToast('error', `Gagal memperbarui item: ${e.message}`);
      } finally {
          setIsUpdatingWorkItem(false);
      }
    }, [editingWorkItemId, currentProject, calculatedWorkItemPreview, userId, showToast, handleCancelEditWorkItem]);

    const handleSaveWorkItem = useCallback(() => {
      if (editingWorkItemId) {
          handleUpdateWorkItem();
      } else {
          handleAddWorkItemToProject();
      }
    }, [editingWorkItemId, handleUpdateWorkItem, handleAddWorkItemToProject]);

    const handleDeleteWorkItem = useCallback(async (workItemId) => {
      const isConfirmed = await showConfirm({
        title: 'Konfirmasi Hapus',
        message: 'Apakah Anda yakin ingin menghapus item pekerjaan ini?'
    });
      if (!currentProject || !isConfirmed) {
          return; // Batalkan jika tidak ada proyek atau pengguna menekan "Batal"
      }
      
      try {
          const updatedProject = await apiService.deleteWorkItemFromProjectApi(currentProject.id, workItemId);
          setCurrentProject(updatedProject);
          setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
          showToast('success', 'Item Pekerjaan berhasil dihapus!');
        } catch (e) { console.error("Delete work item error:", e); showToast('error', `Delete work item error: ${e.message}`); }
      }, [currentProject, showConfirm, userId, showToast]);
    
    // Cash Flow Handlers (within a project)
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
          showToast('success', `Biaya Lain-Lain ${editingCashFlowEntry ? 'diperbarui' : 'ditambahkan'}!`);
          setShowCashFlowForm(false); setEditingCashFlowEntry(null);
          const firstCfCategory = userCashFlowCategories.length > 0 ? userCashFlowCategories[0] : { id: '' };
          setCashFlowFormData({ date: new Date().toISOString().split('T')[0], description: '', type: '', amount: '', categoryId: firstCfCategory.id });
        } catch (e) { console.error("Error saving cash flow entry:", e); showToast('error', `Save cash flow entry error: ${e.message}`); }
        setIsSavingCashFlowEntry(false);
    }, [cashFlowFormData, currentProject, userId, apiService, editingCashFlowEntry, setCurrentProject, setProjects, showToast, setShowCashFlowForm, setEditingCashFlowEntry, userCashFlowCategories, setCashFlowFormData, setIsSavingCashFlowEntry]);

    const handleEditCashFlowEntry = useCallback((entry) => {
      if (entry) {
          // MODE EDIT: 'entry' berisi data, isi form dengannya.
          setEditingCashFlowEntry(entry);
          setCashFlowFormData({
              date: entry.entry_date ? entry.entry_date.split('T')[0] : new Date().toISOString().split('T')[0],
              description: entry.description || '',
              type: entry.entry_type || 'expense', // default ke 'expense' jika tidak ada
              amount: entry.amount?.toString() || '',
              categoryId: entry.category_id || ''
          });
      } else {
          // MODE TAMBAH BARU: 'entry' adalah null, reset form ke state awal.
          setEditingCashFlowEntry(null);
          const firstCategory = userCashFlowCategories.length > 0 ? userCashFlowCategories[0] : { id: '' };
          setCashFlowFormData({
              date: new Date().toISOString().split('T')[0],
              description: '',
              type: 'expense', // Selalu default ke 'expense' untuk entri baru
              amount: '',
              categoryId: '' // Biarkan kosong agar user memilih
          });
      }
      setShowCashFlowForm(true); // Tampilkan form dalam kedua kasus
  }, [userCashFlowCategories]); // Tambahkan dependensi

  // Tambahkan fungsi baru untuk membatalkan
  const handleCancelCashFlowForm = useCallback(() => {
      setShowCashFlowForm(false);
      setEditingCashFlowEntry(null);
      setCashFlowFormData({ date: new Date().toISOString().split('T')[0], description: '', type: 'expense', amount: '', categoryId: '' });
  }, []);

    const handleDeleteCashFlowEntry = useCallback(async (entryId) => {
      const isConfirmed = await showConfirm({
        title: 'Konfirmasi Hapus',
        message: 'Apakah Anda yakin ingin menghapus entri biaya ini?'
    });
      if (!currentProject || !isConfirmed) {
          return; // Batalkan jika tidak ada proyek atau pengguna menekan "Batal"
      }
      
      try {
          const updatedProject = await apiService.deleteCashFlowEntryApi(currentProject.id, entryId);
          setCurrentProject(updatedProject);
          setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
          showToast('success', 'Biaya Lain-Lain berhasil dihapus!');
      } catch (e) {
          console.error("Error deleting cash flow entry:", e);
          showToast('error', `Gagal menghapus entri: ${e.message}`);
      }
    }, [currentProject, showConfirm, userId, apiService, setCurrentProject, setProjects, showToast]);

    const handleCashFlowFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setCashFlowFormData(prev => ({ ...prev, [name]: value }));
      }, [setCashFlowFormData]);

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
    
        if (!await showConfirm(`Delete cash flow category "${categoryObjectToDelete.category_name}"?`)) return;
        try {
          await apiService.deleteCashFlowCategoryApi(categoryObjectToDelete.id);
          setUserCashFlowCategories(prev => prev.filter(cat => cat.id !== categoryObjectToDelete.id));
          showToast('success', `Cash flow category "${categoryObjectToDelete.category_name}" deleted.`);
          if (cashFlowFormData?.categoryId === categoryObjectToDelete.id) {
            setCashFlowFormData(prev => ({ ...prev, categoryId: (userCashFlowCategories.find(c => c.id !== categoryObjectToDelete.id) || { id: '' }).id }));
          }
        } catch (error) { console.error("Error deleting cash flow category:", error); showToast('error', `Failed to delete cash flow category: ${error.message}`); }
      }, [showConfirm, userId, apiService, setUserCashFlowCategories, showToast, cashFlowFormData, setCashFlowFormData, userCashFlowCategories, projects, currentProject]);

      const handleUpdateCashFlowCategory = useCallback(async (categoryId, newName) => {
        // Validasi dasar
        if (!newName || !newName.trim()) {
            showToast('error', 'Nama kategori tidak boleh kosong.');
            return;
        }

        // Cek duplikasi (tidak termasuk kategori yang sedang diedit)
        const isDuplicate = userCashFlowCategories.some(
            cat => cat.category_name.toLowerCase() === newName.trim().toLowerCase() && cat.id !== categoryId
        );

        if (isDuplicate) {
            showToast('error', `Kategori dengan nama "${newName}" sudah ada.`);
            return;
        }
        
        try {
            const updatedCategory = await apiService.updateCashFlowCategoryApi(categoryId, { category_name: newName.trim() });
            
            // Perbarui state secara lokal
            setUserCashFlowCategories(prev => 
                prev.map(cat => cat.id === categoryId ? updatedCategory : cat)
                    .sort((a, b) => a.category_name.localeCompare(b.category_name))
            );
            showToast('success', 'Kategori berhasil diperbarui!');
        } catch (error) {
            console.error("Error updating cash flow category:", error);
            showToast('error', `Gagal memperbarui kategori: ${error.message}`);
        }
    }, [userCashFlowCategories, showToast, setUserCashFlowCategories]);
    // AI Insights
    const handleFetchProjectInsights = useCallback(async () => {
        if (!currentProject) { showToast('error', 'No project selected.'); return; }
        setIsFetchingProjectInsights(true); setProjectInsights(''); setShowInsightsModal(true);
        const workItemsSummary = (currentProject.workItems || []).map(item =>
          `- ${item.definition_name_snapshot} (${item.primary_input_display_snapshot}): ${formatCurrency(parseFloat(item.total_item_cost_snapshot))}`
        ).join('\n');
        const prompt = `Analyze the following construction project budget for a project in Indonesia. Project Name: ${currentProject.project_name}. Total Estimated Budget: ${formatCurrency(currentProject.direct_cost_estimate)}. Work Items:\n${workItemsSummary || "No work items detailed."}\nProvide a brief analysis covering: 1. Overall project scope impression. 2. Potential cost-saving suggestions or areas to watch. 3. Common risks or considerations. 4. One or two general recommendations. Keep the response concise and actionable. Format with markdown.`;
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

    const handleGenerateProjectReport = useCallback(async (projectId) => {
      if (!projectId) {
          showToast('error', 'Project ID tidak ditemukan.');
          return;
      }

      const project = projects.find(p => p.id === projectId) || currentProject;
      if (!project) {
          showToast('error', 'Data proyek tidak ditemukan untuk membuat nama file.');
          return;
      }
      
      setIsGeneratingReport(true);
      showToast('info', 'Mempersiapkan laporan PDF...');

      try {
          // Ganti '/api/projects' jika prefix API Anda berbeda
          const response = await fetch(`/api/projects/${projectId}/report`);

          if (!response.ok) {
              // Mencoba membaca pesan error dari backend jika ada
              const errorText = await response.text();
              throw new Error(`Gagal membuat laporan: ${response.status} ${errorText}`);
          }

          // Mengambil data sebagai blob (file)
          const blob = await response.blob();
          // Membuat URL sementara untuk file blob
          const url = window.URL.createObjectURL(blob);
          
          // Membuat elemen link sementara untuk memicu download
          const link = document.createElement('a');
          link.href = url;
          const fileName = `RAB-${project.project_name.replace(/\s+/g, '_')}.pdf`;
          link.setAttribute('download', fileName);
          
          // Menambahkan link ke body, mengkliknya, lalu menghapusnya
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);

          // Melepaskan URL objek setelah selesai
          window.URL.revokeObjectURL(url);
          showToast('success', 'Laporan PDF berhasil diunduh.');
      } catch (error) {
          console.error("Error generating PDF report:", error);
          showToast('error', `Gagal mengunduh laporan: ${error.message}`);
      } finally {
          setIsGeneratingReport(false);
      }
  }, [projects, currentProject, showToast]);

    const fetchProjectById = useCallback((projectId) => {
      handleSelectProject(projectId);
  }, [handleSelectProject]);
  
  const handleStartAddWorkItem = useCallback(() => {
    setEditingWorkItemId(null); 
    setWorkItemFormData(initialWorkItemFormData);
    setCalculatedWorkItemPreview(null); 
    setShowWorkItemForm(true); 
}, []);

const clearProjects = useCallback(() => {
  setProjects([]);
  setArchivedProjects([]);
  setCurrentProjectId(null);
  setCurrentProject(null);
}, []);

    useEffect(() => {
      const templateKey = workItemFormData.templateKey;

      // Periksa apakah template sudah dipilih
      if (templateKey && userWorkItemTemplates && userWorkItemTemplates[templateKey]) {
          // Panggil fungsi kalkulasi pratinjau setiap kali form data berubah
          previewWorkItemCalculation(templateKey, workItemFormData);
      } else {
          // Jika tidak ada template yang dipilih, pastikan pratinjau kosong
          setCalculatedWorkItemPreview(null);
      }
  }, [
      workItemFormData,
      userWorkItemTemplates,
      previewWorkItemCalculation,
      setCalculatedWorkItemPreview
  ]);
    // This hook will be complex, so it returns a large object
    return {
        // State
        projectNameError,
        priceError,
        dateError,
        projects,
        archivedProjects,
        isLoading,
        isDetailLoading,
        currentProjectId,
        currentProject,
        currentProjectView, // Return the state
        showProjectForm,
        projectFormData,
        isSavingProject,
        showWorkItemForm,
        workItemFormData,
        calculatedWorkItemPreview,
        isAddingWorkItem,
        showCashFlowForm,
        cashFlowFormData,
        editingCashFlowEntry,
        isSavingCashFlowEntry,
        projectInsights,
        showInsightsModal,
        isFetchingProjectInsights,
        isGeneratingReport,
        editingProjectId,
        handleStartEditProject,
        handleSaveOrUpdateProject,
        handleCancelEdit, 
        handleGenerateProjectReport,
        reportContentRef,
        // Setters
        setCurrentProject,
        setCurrentProjectView,
        setShowProjectForm,
        setProjectFormData,
        setShowWorkItemForm,
        setWorkItemFormData,
        setCalculatedWorkItemPreview,
        setShowCashFlowForm,
        setCashFlowFormData,
        setEditingCashFlowEntry,
        setShowInsightsModal,
        
        // Handlers
        fetchActiveProjects,
        fetchArchivedProjects,
        handleSelectProject,
        handleSaveOrUpdateProject,
        handleDeleteProject,
        handleArchiveProject,
        handleUnarchiveProject,
        handleAddWorkItemToProject,
        handleDeleteWorkItem,
        handleSaveCashFlowEntry,
        handleEditCashFlowEntry,
        handleDeleteCashFlowEntry,
        handleDeleteCashFlowCategory,
        handleProjectFormChange,
        handleWorkItemFormChange,
        handleCashFlowFormChange,
        editingWorkItemId,
        isUpdatingWorkItem,
        handleStartEditWorkItem,
        handleCancelEditWorkItem,
        handleSaveWorkItem,
        handleCancelCashFlowForm,
        handleUpdateCashFlowCategory,
        fetchProjectById,
        handleStartAddWorkItem,
        clearProjects,
    };
};
