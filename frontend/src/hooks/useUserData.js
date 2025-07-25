/* eslint-disable require-jsdoc, camelcase, no-unused-vars, react/prop-types*/
import { useState, useEffect, useCallback } from 'react';
import * as apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';

export const useUserData = () => {
    const { userId } = useAuth();
    const { showToast, showConfirm } = useUI();

    const [userWorkItemCategories, setUserWorkItemCategories] = useState([]);
    const [userUnits, setUserUnits] = useState([]);

    const [newCategoryName, setNewCategoryName] = useState('');
    const [newUnitName, setNewUnitName] = useState('');

    const isUnitValid = (unit) => {
        return unit && unit.id && typeof unit.unit_name === 'string' && unit.unit_name.trim() !== '';
    };

    // --- FETCHERS ---
    useEffect(() => {
        if (!userId) {
            setUserWorkItemCategories([]);
            setUserUnits([]);
            return;
        }

        apiService.fetchWorkItemCategories(userId)
            .then(data => setUserWorkItemCategories(data || [])) // Hapus sort dari sini
            .catch(err => {
                showToast('error', 'Gagal memuat kategori item pekerjaan.');
                console.error(err);
            });

        apiService.fetchUserUnits(userId) 
            .then(data => setUserUnits(data || []))
            .catch(err => {
                showToast('error', 'Gagal memuat satuan.');
                console.error(err);
            });
    }, [userId, showToast]);

    useEffect(() => {
        if (!userId) return;

        const fetchAllData = async () => {
            try {
                const units = await apiService.fetchUserUnits(userId);
                const validUnits = (units || []).filter(isUnitValid);
                
                console.log('UNIT DATA FROM API:', units);
                console.log('VALID UNITS AFTER FILTERING:', validUnits);

                setUserUnits(validUnits);
            } catch (error) {
                console.error("Failed to fetch user data:", error);
                showToast('error', `Gagal memuat data pengguna: ${error.message}`);
            }
        };
        fetchAllData();
    }, [userId, showToast]);

    // --- ADD HANDLERS ---
    const handleAddNewWorkItemCategory = useCallback(async () => {
        if (!newCategoryName.trim()) { showToast('error', 'Nama kategori tidak boleh kosong.'); return; }
        try {
            const addedCategory = await apiService.addWorkItemCategoryApi(userId, newCategoryName.trim());
            setUserWorkItemCategories(prev => [...prev, addedCategory]); // Hapus sort dari sini
            setNewCategoryName('');
            showToast('success', `Kategori "${addedCategory.category_name}" ditambahkan.`);
        } catch (error) {
            showToast('error', `Gagal menambahkan kategori: ${error.message}`);
        }
    }, [newCategoryName, userId, showToast]);

    const handleAddNewUnit = useCallback(async () => {
        if (!newUnitName.trim()) { showToast('error', 'Nama satuan tidak boleh kosong.'); return; }
         try {
            const addedUnit = await apiService.addUnitApi(userId, newUnitName.trim());
            setUserUnits(prev => [...prev, addedUnit].sort((a, b) => a.unit_name.localeCompare(b.unit_name)));
            setNewUnitName('');
            showToast('success', `Satuan "${addedUnit.unit_name}" ditambahkan.`);
        } catch (error)
            {
            showToast('error', `Gagal menambahkan satuan: ${error.message}`);
        }
    }, [newUnitName, userId, showToast]);
    
    // --- UPDATE HANDLERS ---
    const handleUpdateUnit = useCallback(async (unitId, newName) => {
        if (!newName.trim()) {
            showToast('error', 'Nama unit tidak boleh kosong.');
            return;
        }
        try {
            const updatedUnit = await apiService.updateUnitApi(unitId, { unit_name: newName.trim() });
            setUserUnits(prevUnits =>
                prevUnits.map(unit =>
                    unit.id === unitId ? updatedUnit : unit
                ).sort((a, b) => (a.unit_name || '').localeCompare(b.unit_name || ''))
            );
            showToast('success', `Unit "${updatedUnit.unit_name}" berhasil diperbarui.`);
        } catch (error) {
            console.error("Failed to update unit:", error);
            showToast('error', `Gagal memperbarui unit: ${error.message}`);
        }
    }, [userId, showToast]);

    const handleUpdateWorkItemCategory = useCallback(async (categoryId, newName) => {
        if (!newName.trim()) {
            showToast('error', 'Nama kategori tidak boleh kosong.');
            return;
        }
        try {
            // Asumsi fungsi di apiService bernama updateWorkItemCategoryApi
            const updatedCategory = await apiService.updateWorkItemCategoryApi(categoryId, { category_name: newName.trim() });
            setUserWorkItemCategories(prevCategories =>
                prevCategories.map(cat =>
                    cat.id === categoryId ? updatedCategory : cat
                ) // Hapus sort dari sini
            );
            showToast('success', `Kategori "${updatedCategory.category_name}" berhasil diperbarui.`);
        } catch (error) {
            console.error("Failed to update work item category:", error);
            showToast('error', `Gagal memperbarui kategori: ${error.message}`);
        }
    }, [userId, showToast]);


    // --- DELETE HANDLERS ---
    const handleDeleteUnit = useCallback(async (unitToDelete, materialPrices, workItemTemplates) => {
        if (!isUnitValid(unitToDelete)) {
            showToast('error', 'Tidak dapat menghapus unit karena data tidak valid.');
            console.error("Validation failed for unit object:", unitToDelete);
            return;
        }
        
        const unitName = unitToDelete.unit_name;
        
        const templatesArray = Array.isArray(workItemTemplates) ? workItemTemplates : (workItemTemplates ? Object.values(workItemTemplates) : []);
        const pricesArray = Array.isArray(materialPrices) ? materialPrices : (materialPrices ? Object.values(materialPrices) : []);

        const isUsedInPrices = pricesArray.some(price => price.unit === unitName);
        const isUsedInDefinitions = templatesArray.some(def => def.primary_input_unit_name === unitName);

        if (isUsedInPrices || isUsedInDefinitions) {
            const usageInfo = [];
            if (isUsedInPrices) usageInfo.push("Harga Material");
            if (isUsedInDefinitions) usageInfo.push("Definisi Pekerjaan");
            showToast('error', `Satuan "${unitName}" sedang digunakan di ${usageInfo.join(' & ')} dan tidak bisa dihapus.`);
            return;
        }

        const confirmed = await showConfirm({
            title: 'Konfirmasi Hapus',
            message: `Apakah Anda yakin ingin menghapus unit "${unitName}"?`
        });

        if (!confirmed) return;

        try {
            await apiService.deleteUnitApi(unitToDelete.id);
            setUserUnits(prev => prev.filter(u => u.id !== unitToDelete.id));
            showToast('success', `Unit "${unitName}" berhasil dihapus.`);
        } catch (error) {
            console.error("Failed to delete unit:", error);
            showToast('error', `Gagal menghapus unit: ${error.message}`);
        }
    }, [userId, showToast, showConfirm]);
    
    const handleDeleteCashFlowCategory = useCallback(async (categoryToDelete, allProjects = [], currentProject = null) => {
        let isUsed = false;
        const allLoadedProjects = [...allProjects];
        if (currentProject && !allLoadedProjects.find(p => p.id === currentProject.id)) {
            allLoadedProjects.push(currentProject);
        }

        for (const proj of allLoadedProjects) {
            const entries = proj.cashFlowEntries || [];
            if (entries.some(entry => entry.category_id === categoryToDelete.id)) {
                isUsed = true;
                break;
            }
        }

        if (isUsed) {
            showToast('error', `Kategori "${categoryToDelete.category_name}" sedang digunakan dan tidak bisa dihapus.`);
            return;
        }

        const confirmed = await showConfirm({
            title: 'Konfirmasi Hapus',
            message: `Apakah Anda yakin ingin menghapus kategori "${categoryToDelete.category_name}"?`
        });
        if (!confirmed) return;

        try {
            await apiService.deleteCashFlowCategoryApi(categoryToDelete.id);
            setUserCashFlowCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
            showToast('success', `Kategori "${categoryToDelete.category_name}" berhasil dihapus.`);
        } catch (error) {
            console.error("Error deleting cash flow category:", error);
            showToast('error', `Gagal menghapus kategori: ${error.message}`);
        }
    }, [userId, showToast, showConfirm]);
    
    const handleDeleteWorkItemCategory = useCallback(async (categoryToDelete, templates = {}) => {
        const isUsed = Object.values(templates).some(template => template.category_id === categoryToDelete.id);

        if (isUsed) {
            showToast('error', `Kategori "${categoryToDelete.category_name}" sedang digunakan dan tidak bisa dihapus.`);
            return;
        }

        const confirmed = await showConfirm({
            title: 'Konfirmasi Hapus',
            message: `Apakah Anda yakin ingin menghapus kategori "${categoryToDelete.category_name}"?`
        });
        if (!confirmed) return;

        try {
            await apiService.deleteWorkItemCategoryApi(categoryToDelete.id);
            setUserWorkItemCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
            showToast('success', `Kategori "${categoryToDelete.category_name}" berhasil dihapus.`);
        } catch (error) {
            console.error("Error deleting work item category:", error);
            showToast('error', `Gagal menghapus kategori: ${error.message}`);
        }
    }, [userId, showToast, showConfirm]);


    const handleUpdateCategoriesOrder = async (orderedCategories) => {
        const originalOrder = [...userWorkItemCategories];
        try {
            const payload = orderedCategories.map((category, index) => ({
                id: category.id,
                order: index
            }));
            
            // --- PERBAIKAN: Kirim 'userId' sebagai parameter pertama ---
            await apiService.updateWorkItemCategoriesOrderApi(userId, payload);
            
            showToast('success', 'Urutan kategori berhasil diperbarui.');
        } catch (error) {
            console.error("Failed to update categories order", error);
            setUserWorkItemCategories(originalOrder);
            showToast('error', `Gagal memperbarui urutan: ${error.message}`);
        }
    };


    return {
        userWorkItemCategories,
        userUnits,
        newCategoryName,
        setNewCategoryName,
        newUnitName,
        setNewUnitName,
        handleAddNewWorkItemCategory,
        handleAddNewUnit,
        handleUpdateUnit,
        handleUpdateWorkItemCategory,
        handleDeleteWorkItemCategory,
        handleDeleteUnit,
        handleUpdateCategoriesOrder,
        setUserWorkItemCategories,
        };
};
