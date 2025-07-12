// src/contexts/DataContext.js - VERSI FINAL YANG BENAR

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as apiService from '../services/apiService';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export function useData() {
    return useContext(DataContext);
}

export function DataProvider({ children }) {
    // 1. STATE UNTUK SEMUA DATA MASTER
    const { userId } = useAuth();
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [userUnits, setUserUnits] = useState([]);
    const [materialPrices, setMaterialPrices] = useState([]);
    const [userWorkItemCategories, setUserWorkItemCategories] = useState([]);
    const [userWorkItemTemplates, setUserWorkItemTemplates] = useState({});
    const [userCashFlowCategories, setUserCashFlowCategories] = useState([]);

    // 2. FUNGSI UNTUK MEMANIPULASI DATA (disediakan untuk seluruh aplikasi)
    const addUnit = useCallback((newUnit) => {
        if (!newUnit || !newUnit.id) return;
        setUserUnits(prev => [...prev, newUnit].sort((a, b) => a.unit_name.localeCompare(b.unit_name)));
    }, []);

    const deleteUnit = useCallback(async (unitId) => {
        // Hapus dari state secara optimis
        setUserUnits(prev => prev.filter(unit => unit.id !== unitId));
        // Panggil API untuk hapus di backend (tanpa menunggu)
        try {
            await apiService.deleteUnitApi(userId, unitId);
        } catch (error) {
            // Jika gagal, mungkin perlu logika untuk mengembalikan state
            console.error("Gagal menghapus unit di backend:", error);
        }
    }, [userId]);

    const addCashFlowCategory = useCallback((newCategory) => {
        setUserCashFlowCategories(prev => [...prev, newCategory].sort((a, b) => a.category_name.localeCompare(b.category_name)));
    }, []);

    const deleteCashFlowCategory = useCallback(async (categoryId) => {
        setUserCashFlowCategories(prev => prev.filter(cat => cat.id !== categoryId));
        try {
            await apiService.deleteCashFlowCategoryApi(userId, categoryId);
        } catch (error) {
            console.error("Gagal menghapus kategori arus kas di backend:", error);
        }
    }, [userId]);

    // ... (Anda bisa menambahkan fungsi lain seperti addWorkItemCategory, dll. di sini)

    // 3. USEEFFECT UNTUK MEMUAT SEMUA DATA AWAL SAAT USER LOGIN
    useEffect(() => {
        // Hanya berjalan jika ada userId
        if (userId) {
            const fetchInitialData = async () => {
                setIsLoadingData(true);
                try {
                    // Ambil semua data master secara paralel
                    const [units, prices, workItemCats, definitions, cashFlowCats] = await Promise.all([
                        apiService.fetchUserUnits(userId),
                        apiService.fetchMaterialPrices(userId),
                        apiService.fetchWorkItemCategories(userId),
                        apiService.fetchWorkItemDefinitions(userId),
                        apiService.fetchCashFlowCategories(userId)
                    ]);

                    // Simpan hasil ke masing-masing state
                    setUserUnits(units || []);
                    setMaterialPrices(prices || []);
                    setUserWorkItemCategories(workItemCats || []);
                    setUserCashFlowCategories(cashFlowCats || []);

                    const loadedTemplates = {};
                    (definitions || []).forEach(t => { loadedTemplates[t.id] = t; });
                    setUserWorkItemTemplates(loadedTemplates);

                    console.log("[DataContext] Semua data master berhasil dimuat.", { units, prices });
                } catch (error) {
                    console.error("[DataContext] Gagal memuat data master:", error);
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchInitialData();
        } else {
            // Jika user logout, bersihkan semua data
            setIsLoadingData(false);
            setUserUnits([]);
            setMaterialPrices([]);
            // ... bersihkan state lainnya
        }
    }, [userId]); // Dependensi hanya pada userId

    // 4. USEMEMO UNTUK MENYEDIAKAN VALUE (STATE & FUNGSI) KE KOMPONEN ANAK
    // Ini memastikan value hanya diperbarui jika salah satu datanya benar-benar berubah
    const value = useMemo(() => ({
        isLoadingData,
        userUnits,
        materialPrices,
        userWorkItemCategories,
        userWorkItemTemplates,
        userCashFlowCategories,
        addUnit,
        deleteUnit,
        addCashFlowCategory,
        deleteCashFlowCategory,
        // ... sediakan fungsi lain di sini
    }), [
        isLoadingData, 
        userUnits, 
        materialPrices, 
        userWorkItemCategories, 
        userWorkItemTemplates, 
        userCashFlowCategories
    ]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}