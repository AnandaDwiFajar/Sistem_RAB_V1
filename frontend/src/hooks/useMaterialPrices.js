import { useState, useEffect, useCallback } from 'react';
import * as apiService from '../services/apiService'; // Pastikan path ini benar
import { useAuth } from '../contexts/AuthContext'; // Pastikan path ini benar
import { useUI } from '../contexts/UIContext'; // Pastikan path ini benar

/**
 * Custom hook untuk mengelola data harga material.
 * @param {Array} userUnits - Daftar unit yang dimiliki pengguna.
 * @param {Function} setUserUnits - Fungsi untuk memperbarui state unit pengguna.
 * @return {Object} - State dan handler untuk halaman harga material.
 */
export const useMaterialPrices = (userUnits, setUserUnits) => {
    const { userId } = useAuth();
    const { showToast, showConfirm } = useUI();

    const [materialPrices, setMaterialPrices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingPrice, setIsSavingPrice] = useState(false);

    const [showPriceForm, setShowPriceForm] = useState(false);
    const [editingPrice, setEditingPrice] = useState(null);
    
    const [priceFormData, setPriceFormData] = useState({ name: '', unitId: '', customUnitName: '', price: '' });
    const [unitSelectionMode, setUnitSelectionMode] = useState('select');

    // State internal untuk unit agar tidak memicu re-render yang tidak perlu.
    const [internalUserUnits, setInternalUserUnits] = useState(userUnits);
    useEffect(() => {
        setInternalUserUnits(userUnits);
    }, [userUnits]);
    
    const fetchMaterialPrices = useCallback(() => {
        if (!userId) {
            setMaterialPrices([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        apiService.fetchMaterialPrices(userId)
            .then(data => {
                const validData = (data || []).filter(item => item && typeof item.name === 'string');
                const sortedData = validData.sort((a, b) => a.name.localeCompare(b.name));
                setMaterialPrices(sortedData);
            })
            .catch(error => {
                console.error("Error fetching material prices:", error);
                showToast('error', `Gagal mengambil data harga: ${error.message}`);
                setMaterialPrices([]);
            })
            .finally(() => setIsLoading(false));
    }, [userId, showToast]);
    
    useEffect(() => {
        fetchMaterialPrices();
    }, [fetchMaterialPrices]);
    
    // Efek untuk mengatur unit default pada form.
    useEffect(() => {
        if (internalUserUnits.length > 0 && !priceFormData.unitId && unitSelectionMode === 'select' && !editingPrice) {
            setPriceFormData(prev => ({ ...prev, unitId: internalUserUnits[0].id }));
        }
    }, [internalUserUnits, priceFormData.unitId, unitSelectionMode, editingPrice]);

    // Handler untuk perubahan pada input form.
    const handlePriceFormChange = useCallback((e) => {
        const { name, value } = e.target;
        if (name === "unitSelector") {
            setUnitSelectionMode('select');
            setPriceFormData(prev => ({ ...prev, unitId: value, customUnitName: '' }));
        } else {
            setPriceFormData(prev => ({ ...prev, [name]: value }));
        }
    }, []);

    const handleUpdatePrice = useCallback(async (priceToUpdate) => {
        if (!priceToUpdate) {
            showToast('error', 'Kesalahan: Tidak ada item yang dipilih untuk diedit.');
            return false;
        }

        if (!priceFormData.name?.trim() || !priceFormData.unitId || !priceFormData.price) {
            showToast('error', 'Nama, unit, dan harga wajib diisi.');
            return false;
        }
        const priceValue = parseFloat(priceFormData.price);
        if (isNaN(priceValue) || priceValue < 0) {
            showToast('error', 'Jumlah harga tidak valid.');
            return false;
        }

        const pricePayload = { name: priceFormData.name.trim(), unit_id: priceFormData.unitId, price: priceValue };
        setIsSavingPrice(true);

        try {
            const apiResponseData = await apiService.updateMaterialPriceApi(priceToUpdate.id, pricePayload, userId);
            
            const updatedPriceEntry = {
                id: apiResponseData.id,
                name: apiResponseData.name,
                unit: apiResponseData.unit,
                unit_id: apiResponseData.unit_id,
                price: parseFloat(apiResponseData.price)
            };

            setMaterialPrices(prev => prev.map(p => p.id === priceToUpdate.id ? updatedPriceEntry : p).sort((a, b) => a.name.localeCompare(b.name)));
            showToast('success', 'Harga berhasil diperbarui!');
            
            // Reset form ke kondisi awal.
            const firstUnitAvailable = userUnits.length > 0 ? userUnits[0] : { id: '' };
            setPriceFormData({ name: '', unitId: firstUnitAvailable.id, customUnitName: '', price: '' });
            setUnitSelectionMode('select');
            setShowPriceForm(false);
            setEditingPrice(null);
            
            return true;
        } catch (e) {
            console.error("Update price error:", e);
            showToast('error', `Gagal memperbarui harga: ${e.message}`);
            return false;
        } finally {
            setIsSavingPrice(false);
        }
    }, [priceFormData, userId, showToast, userUnits]);

    
    // ✅ FUNGSI BARU: Untuk mereset form saat modal ditutup
    const handleClosePriceForm = useCallback(() => {
        setShowPriceForm(false);
        setEditingPrice(null);
        
        const firstUnitAvailable = userUnits.length > 0 ? userUnits[0] : { id: '' };
        setPriceFormData({ name: '', unitId: firstUnitAvailable.id, customUnitName: '', price: '' });
        setUnitSelectionMode('select');
    }, [userUnits]);

    // ✅ FUNGSI BARU: Untuk menangani penambahan item baru
    const handleAddNewPrice = () => {
        setEditingPrice(null); 
        
        const firstUnitAvailable = userUnits.length > 0 ? userUnits[0] : { id: '' };
        setPriceFormData({ name: '', unitId: firstUnitAvailable.id, customUnitName: '', price: '' });
        setUnitSelectionMode('select');
        
        setShowPriceForm(true);
    };
    

    const handleSavePrice = useCallback(async () => {
        let unitToUseId = priceFormData.unitId;
    
        if (unitSelectionMode === 'custom') {
            if (!priceFormData.customUnitName?.trim()) {
                showToast('error', 'Nama unit baru harus diisi.'); return false;
            }
            try {
                const addedUnit = await apiService.addUnitApi(userId, priceFormData.customUnitName.trim());
                unitToUseId = addedUnit.id;
                setUserUnits(prev => [...prev, { id: addedUnit.id, unit_name: addedUnit.unit_name }].sort((a, b) => a.unit_name.localeCompare(b.unit_name)));
                showToast('info', `Unit baru "${addedUnit.unit_name}" berhasil ditambahkan.`);
            } catch (e) {
                if (e.message?.toLowerCase().includes('already exists')) {
                    const existingUnit = userUnits.find(u => u.unit_name.toLowerCase() === priceFormData.customUnitName.trim().toLowerCase());
                    if (existingUnit) {
                        unitToUseId = existingUnit.id;
                        showToast('info', `Menggunakan unit yang sudah ada: "${existingUnit.unit_name}".`);
                    } else {
                        showToast('error', `Gagal menangani unit: ${e.message}.`); return false;
                    }
                } else {
                    showToast('error', `Gagal menyimpan unit baru: ${e.message}`); return false;
                }
            }
        }
    
        if (!priceFormData.name?.trim() || !unitToUseId || !priceFormData.price) {
            showToast('error', 'Nama, unit, dan harga wajib diisi.'); return false;
        }
        const priceValue = parseFloat(priceFormData.price);
        if (isNaN(priceValue) || priceValue < 0) { showToast('error', 'Jumlah harga tidak valid.'); return false; }
    
        const pricePayload = { name: priceFormData.name.trim(), unit_id: unitToUseId, price: priceValue };
        setIsSavingPrice(true);
        try {
            const apiResponseData = await apiService.addMaterialPriceApi(userId, pricePayload);
            
            const newPriceEntry = {
                id: apiResponseData.id,
                name: apiResponseData.name,
                unit: apiResponseData.unit,
                unit_id: apiResponseData.unit_id,
                price: parseFloat(apiResponseData.price)
            };
    
            setMaterialPrices(prev => [...prev, newPriceEntry].sort((a, b) => a.name.localeCompare(b.name)));
            showToast('success', 'Harga berhasil ditambahkan!');
            
            // Reset form ke kondisi awal.
            const firstUnitAvailable = userUnits.length > 0 ? userUnits[0] : { id: '' };
            setPriceFormData({ name: '', unitId: firstUnitAvailable.id, customUnitName: '', price: '' });
            setUnitSelectionMode('select');
            setShowPriceForm(false);
            setEditingPrice(null);

            return true;
        } catch (e) {
            console.error("Save price error:", e);
            showToast('error', `Gagal menyimpan harga: ${e.message}`);
            return false;
        } finally {
            setIsSavingPrice(false);
        }
    }, [priceFormData, unitSelectionMode, userId, showToast, userUnits, setUserUnits]);
    
    // --- PERBAIKAN UTAMA DI SINI ---
    const handleEditPrice = useCallback((price) => {
        // Log 1: Pastikan fungsi dipanggil dengan data yang benar
        console.log("1. [handleEditPrice] Fungsi dipanggil dengan data:", price);

        if (!price || typeof price.id === 'undefined') {
            console.error("handleEditPrice dipanggil dengan data harga yang tidak valid:", price);
            showToast('error', 'Gagal memulai mode edit: data tidak valid.');
            return;
        }

        // Log 2: Konfirmasi bahwa state 'editingPrice' diatur
        console.log("2. [handleEditPrice] Menyimpan item yang sedang diedit ke state 'editingPrice'.");
        setEditingPrice(price);

        // Log 3: Siapkan data yang akan dimasukkan ke dalam form
        const formDataToSet = {
            name: price.name || '',
            price: price.price?.toString() || '',
            unitId: price.unit_id || '',
            customUnitName: '', 
        };
        console.log("3. [handleEditPrice] Data yang disiapkan untuk form:", formDataToSet);

        const unitExistsInList = internalUserUnits.some(u => u.id === price.unit_id);
        
        if (unitExistsInList) {
            console.log(`4. [handleEditPrice] Unit dengan ID '${price.unit_id}' ditemukan. Mode diatur ke 'select'.`);
            setUnitSelectionMode('select');
        } else {
            console.log(`4. [handleEditPrice] Unit dengan ID '${price.unit_id}' TIDAK ditemukan. Mode diatur ke 'custom'.`);
            setUnitSelectionMode('custom');
            formDataToSet.unitId = ''; 
            formDataToSet.customUnitName = price.unit || '';
            console.log("   -> Nama unit custom diisi dengan:", price.unit || '');
        }
        
        // Log 5: Konfirmasi sebelum state form di-update
        console.log("5. [handleEditPrice] Mengupdate 'priceFormData' dengan data yang sudah disiapkan.");
        setPriceFormData(formDataToSet);

        // Log 6: Tampilkan modal
        console.log("6. [handleEditPrice] Menampilkan modal form (setShowPriceForm -> true).");
        setShowPriceForm(true);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [internalUserUnits, showToast]);

    const handleDeletePrice = useCallback(async (priceIdToDelete) => {
        const confirmed = await showConfirm({
            title: 'Konfirmasi Hapus',
            message: 'Apakah Anda yakin ingin menghapus item harga ini?'
        });
        if (!confirmed) return;

        try {
            await apiService.deleteMaterialPriceApi(priceIdToDelete, userId);
            setMaterialPrices(prevPrices => prevPrices.filter(price => price.id !== priceIdToDelete));
            showToast('success', 'Harga berhasil dihapus!');
        } catch (e) { 
            console.error("Delete price error:", e); 
            showToast('error', `Gagal menghapus harga: ${e.message}`); 
        }
    }, [showConfirm, userId, showToast]);
    
    
    return {
        // State
        materialPrices,
        isLoading,
        isSavingPrice,
        showPriceForm,
        editingPrice,
        priceFormData,
        unitSelectionMode,
        userUnits: internalUserUnits,
        
        // Setters
        setShowPriceForm,
        setEditingPrice,
        setPriceFormData,
        handleAddNewPrice,
        handleClosePriceForm,
        // Handlers
        handlePriceFormChange,
        handleSavePrice,
        handleUpdatePrice,
        handleEditPrice,
        handleDeletePrice,
        fetchMaterialPrices,
    };
};
