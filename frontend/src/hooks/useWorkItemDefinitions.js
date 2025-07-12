import { useState, useEffect, useCallback } from 'react';
import * as apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { slugify, generateId } from '../utils/helpers';
import { DEFAULT_PRIMARY_INPUT_LABELS } from '../utils/constants';
import { CALCULATION_SCHEMAS } from '../utils/calculationSchemas';

export const useWorkItemDefinitions = (materialPrices, userWorkItemCategories, userUnits) => {
    const { userId } = useAuth();
    const { showToast, showConfirm } = useUI();
    
    const [userWorkItemTemplates, setUserWorkItemTemplates] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingDefinition, setIsSavingDefinition] = useState(false);
    const [isSuggestingComponents, setIsSuggestingComponents] = useState(false);
    
    // Form state
    const [showTemplateForm, setShowTemplateForm] = useState(false);
    const [editingTemplateData, setEditingTemplateData] = useState(null);
    const [selectedTemplateKeyForEditing, setSelectedTemplateKeyForEditing] = useState(null);

    // --- PERBAIKAN 1: Buat fungsi fetch yang bisa dipanggil ulang ---
    const fetchWorkItemDefinitions = useCallback(() => {
        if (!userId) {
            setUserWorkItemTemplates({});
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
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
            .finally(() => setIsLoading(false));
    }, [userId, showToast]);

    // --- PERBAIKAN 2: Gunakan fungsi fetch di dalam useEffect ---
    useEffect(() => {
        fetchWorkItemDefinitions();
    }, [fetchWorkItemDefinitions]);
    
    // Handlers
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
            calculation_schema_type: '',
            primary_input_label: DEFAULT_PRIMARY_INPUT_LABELS[0],
            primary_input_nature: 'volume',
            primary_input_unit_id: firstUnit.id,
            components: [{ tempId: generateId(), display_name: '', material_price_id: '', coefficient: 0, component_type: 'material', selectedResourceId: '' }],
          });
          setSelectedTemplateKeyForEditing(null);
        }
        setShowTemplateForm(true);
    }, [userWorkItemTemplates, userWorkItemCategories, userUnits]);

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
    }, [materialPrices]);
    
    const handleAddTemplateComponent = useCallback(() => setEditingTemplateData(prev => ({ ...prev, components: [...(prev.components || []), { tempId: generateId(), display_name: '', material_price_id: '', coefficient: 0, component_type: 'material', selectedResourceId: '' }] })), [setEditingTemplateData]);
    const handleRemoveTemplateComponent = useCallback((index) => setEditingTemplateData(prev => ({ ...prev, components: prev.components.filter((_, i) => i !== index) })), [setEditingTemplateData]);

    const handleSaveWorkItemTemplate = useCallback(async () => {
        if (!editingTemplateData || !editingTemplateData.name?.trim()) {
          showToast('error', 'Nama template wajib diisi.');
          return;
        }
    
        // --- VALIDASI BARU DITAMBAHKAN DI SINI ---
        if (!editingTemplateData.calculation_schema_type) {
            showToast('error', 'Anda harus memilih Jenis Kalkulasi.');
            return;
        }
        // --- AKHIR VALIDASI BARU ---
    
        if ((editingTemplateData.components || []).some(c => !c.display_name?.trim() || c.coefficient === undefined)) {
          showToast('error', 'Setiap komponen harus memiliki nama tampilan dan koefisien.');
          return;
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
    }, [editingTemplateData, showToast, userId, selectedTemplateKeyForEditing]);
    
    const handleDeleteWorkItemDefinition = useCallback(async (definitionIdToDelete) => {
        const template = userWorkItemTemplates[definitionIdToDelete];
        if (!template) return;
        if (!await showConfirm({title: 'Konfirmasi Hapus', message: `Hapus "${template.name}"?`})) return;
        try {
          await apiService.deleteWorkItemDefinitionApi(userId, definitionIdToDelete);
          setUserWorkItemTemplates(prev => { const newTemplates = { ...prev }; delete newTemplates[definitionIdToDelete]; return newTemplates; });
          showToast('success', `Komponen Pekerjaan "${template.name}" berhasil dihapus.`);
        } catch (e) { console.error("Delete definition error:", e); showToast('error', `Error deleting definition: ${e.message}`); }
    }, [userWorkItemTemplates, showConfirm, userId, showToast]);

    const handleSuggestComponents = useCallback(async () => {
            if (!editingTemplateData || !editingTemplateData.name.trim()) {
                showToast('error', 'Please enter a template name first to get suggestions.');
                return;
            }
            setIsSuggestingComponents(true);
            showToast('info', '✨ Getting component suggestions from AI...');
    
            // --- Determine the primary output description for AI context ---
            let outputDescription = "the main work item output"; // Default context
            const schemaKey = editingTemplateData.calculation_schema_type;
    
            if (schemaKey && CALCULATION_SCHEMAS[schemaKey] && !CALCULATION_SCHEMAS[schemaKey].isSimple) {
                const schema = CALCULATION_SCHEMAS[schemaKey];
                outputDescription = `${schema.output.label} (unit: ${schema.output.unitSymbol})`;
            } else if (editingTemplateData.primary_input_label && editingTemplateData.primary_input_unit_id) {
                const unitObj = userUnits.find(u => u.id === editingTemplateData.primary_input_unit_id);
                const unitName = unitObj ? unitObj.unit_name : 'units'; // Default to 'units' if not found
                outputDescription = `${editingTemplateData.primary_input_label} (measured in ${unitName})`;
            }
            // --- End of determining output description ---
    
            const prompt = `
                Analyze the Indonesian construction work item named "${editingTemplateData.name}".
                The primary calculated output of this work item is typically related to "${outputDescription}".
                
                Your task is to suggest a list of **ONLY material and labor components** typically required for this work item.
                **DO NOT include tools or equipment (e.g., "concrete mixer", "scaffolding", "alat bantu") as separate components.**
                
                Provide the response STRICTLY as a JSON array of objects. Each object in the array MUST have the following fields:
                1.  "componentName": string (e.g., "Semen Portland (PC)", "Pekerja Terampil", "Cat Tembok Dasar").
                2.  "unit": string (standard Indonesian construction unit for the component, e.g., "kg", "m³", "OH" for Orang Hari, "Liter", "Zak").
                3.  "type": string. This field is CRITICAL. It MUST be either the exact string **"material"** OR the exact string **"labor"**. No other values (such as "tool", "equipment", or "material_service") are permitted for this "type" field.
                4.  "coefficient": number. This numeric value MUST represent a realistic, standard quantity of this specific component typically required to produce **ONE SINGLE UNIT** of the work item's primary output (which is "${outputDescription}"). These coefficients should reflect common Indonesian construction practices and standard analysis (similar to those found in Analisa Harga Satuan Pekerjaan - AHSP if a general equivalent exists).
                
                Example 1: For "Pekerjaan Plesteran Dinding 1m² tebal 15mm" (primary output is "1m² of plaster"):
                [
                    {"componentName": "Semen Portland (PC)", "unit": "kg", "type": "material", "coefficient": 6.24},
                    {"componentName": "Pasir Pasang", "unit": "m³", "type": "material", "coefficient": 0.024},
                    {"componentName": "Pekerja", "unit": "OH", "type": "labor", "coefficient": 0.20},
                    {"componentName": "Tukang Batu", "unit": "OH", "type": "labor", "coefficient": 0.10},
                    {"componentName": "Mandor", "unit": "OH", "type": "labor", "coefficient": 0.01}
                ]
                
                Example 2: For "Pekerjaan Pengecatan Tembok Baru (1 lapis plamuur, 1 lapis cat dasar, 2 lapis cat penutup) per 1m²" (primary output is "1m² of painted wall"):
                [
                    {"componentName": "Plamuur Tembok", "unit": "kg", "type": "material", "coefficient": 0.10},
                    {"componentName": "Cat Dasar Tembok", "unit": "kg", "type": "material", "coefficient": 0.10},
                    {"componentName": "Cat Penutup Tembok (2 lapis)", "unit": "kg", "type": "material", "coefficient": 0.26},
                    {"componentName": "Pekerja", "unit": "OH", "type": "labor", "coefficient": 0.02},
                    {"componentName": "Tukang Cat", "unit": "OH", "type": "labor", "coefficient": 0.063},
                    {"componentName": "Mandor", "unit": "OH", "type": "labor", "coefficient": 0.003}
                ]
                
                If a standard coefficient is highly variable or unknown for a minor material or labor component, suggest a small placeholder like 0.01 or 0.001.
                The focus MUST be on typical direct materials and labor. The "type" field MUST ONLY be "material" or "labor".
                
                Only provide the JSON array as your response. Do not include any other text, explanation, or markdown formatting.              `;
    
            try {
                const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
                const generationConfig = {
                    responseMimeType: "application/json",
                };
    
                const payload = { contents: chatHistory, generationConfig };
                const apiKey = "AIzaSyC83nvUw1uSU_VX1uLiUpjMDoy1bXwIojo"; // API Key will be injected by the environment
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
    
                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`API error: ${response.status} ${errorBody}`);
                }
                const result = await response.json();
    
                if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                    let suggestedComponentsRaw;
                    const rawText = result.candidates[0].content.parts[0].text;
                    try {
                        // Try to parse directly, then try to strip markdown if direct parse fails
                        suggestedComponentsRaw = JSON.parse(rawText);
                    } catch (initialParseError) {
                        console.warn("Initial JSON parse failed, trying to strip markdown. Error:", initialParseError);
                        const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
                        if (jsonMatch && jsonMatch[1]) {
                            try {
                                suggestedComponentsRaw = JSON.parse(jsonMatch[1]);
                            } catch (markdownParseError) {
                                console.error("Error parsing AI JSON response even after stripping markdown:", markdownParseError, "Raw text:", rawText);
                                showToast('error', 'AI response was not valid JSON after attempting to strip markdown.');
                                setIsSuggestingComponents(false);
                                return;
                            }
                        } else {
                            console.error("Error parsing AI JSON response (no markdown found):", initialParseError, "Raw text:", rawText);
                            showToast('error', 'AI response was not valid JSON.');
                            setIsSuggestingComponents(false);
                            return;
                        }
                    }
    
                    if (Array.isArray(suggestedComponentsRaw)) {
                        const newComponentsFromAI = suggestedComponentsRaw.map(sugComp => {
                            const matchingPriceItem = materialPrices.find(p =>
                                p.name.toLowerCase() === (sugComp.componentName || "").toLowerCase() &&
                                (p.unit && sugComp.unit && p.unit.toLowerCase() === sugComp.unit.toLowerCase())
                            );
                            return {
                                tempId: generateId(),
                                display_name: sugComp.componentName || "Unnamed Component",
                                material_price_id: matchingPriceItem ? matchingPriceItem.id : '',
                                coefficient: (typeof sugComp.coefficient === 'number' && !isNaN(sugComp.coefficient)) ? sugComp.coefficient : 0,
                                component_type: sugComp.type || 'material',
                                selectedResourceId: matchingPriceItem ? matchingPriceItem.id : ''
                            };
                        });
    
                        setEditingTemplateData(prev => ({
                            ...prev,
                            components: [
                                ...(prev.components || []).filter(c => c.display_name && c.display_name.trim() !== ''),
                                ...newComponentsFromAI
                            ]
                        }));
                        showToast('success', `${newComponentsFromAI.length} component suggestions added! Please review names, resources, and coefficients.`);
                    } else {
                        showToast('error', 'AI suggestions format was unexpected (not an array).');
                        console.error("Gemini response content was not an array:", suggestedComponentsRaw);
                    }
                } else {
                    showToast('error', 'Could not get suggestions from AI. Response was empty or malformed.');
                    console.error("Gemini response structure malformed or empty:", result);
                }
            } catch (error) {
                console.error("Error suggesting components:", error);
                showToast('error', `AI suggestion error: ${error.message}`);
            }
            setIsSuggestingComponents(false);
    }, [editingTemplateData, userUnits, materialPrices, showToast]);
    
    return {
        // State
        userWorkItemTemplates,
        isLoading,
        isSavingDefinition,
        isSuggestingComponents,
        showTemplateForm,
        editingTemplateData,
        selectedTemplateKeyForEditing,
        
        // Setters
        setShowTemplateForm,
        setEditingTemplateData,
        setSelectedTemplateKeyForEditing,
        
        // Handlers
        handleOpenTemplateForm,
        handleTemplateFormChange,
        handleTemplateComponentChange,
        handleAddTemplateComponent,
        handleRemoveTemplateComponent,
        handleSaveWorkItemTemplate,
        handleDeleteWorkItemDefinition,
        handleSuggestComponents,

        // --- PERBAIKAN 3: Ekspor fungsi fetch ---
        fetchWorkItemDefinitions,
    };
};
