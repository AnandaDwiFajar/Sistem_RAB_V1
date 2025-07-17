import React, { useState, useEffect, useCallback } from 'react';
import { Settings, PlusCircle, Loader2, AlertTriangle } from 'lucide-react';
import { getUnits } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import ManageUnitsModal from '../components/modals/ManageUnitsModal';

const ManageUnitsView = () => {
    const { userId } = useAuth();
    const { 
        userUnits, 
        handleAddNewUnit, 
        handleDeleteUnit, 
        handleUpdateUnit, 
        newUnitName, 
        setNewUnitName 
    } = useUserData();

    const [units, setUnits] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showManageUnitsModal, setShowManageUnitsModal] = useState(false);

    const fetchUnits = useCallback(async () => {
        if (!userId) return;
        try {
            setIsLoading(true);
            const data = await getUnits(userId);
            setUnits(data);
            setError(null);
        } catch (error) {
            console.error("Error fetching units:", error);
            setError("Gagal memuat data unit. Silakan coba lagi nanti.");
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchUnits();
    }, [fetchUnits]);

    const handleUnitsUpdated = () => {
        fetchUnits();
    };

    const UnitsTable = () => (
        <div className="overflow-x-auto bg-white border border-industrial-gray-light rounded-lg shadow-sm">
            <table className="w-full min-w-max text-left">
                <thead className="bg-gray-50 border-b border-industrial-gray-light">
                    <tr>
                        <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider">Nama Unit</th>
                    </tr>
                </thead>
                <tbody className="text-industrial-dark">
                    {units.map(unit => (
                        <tr key={unit.id} className="border-b border-industrial-gray-light hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 font-medium">{unit.unit_name}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const NoDataDisplay = () => (
        <div className="text-center py-16 px-6 border-2 border-dashed border-industrial-gray-light rounded-lg">
            <Settings size={48} className="mx-auto text-industrial-gray" />
            <h3 className="mt-4 text-xl font-semibold text-industrial-dark">Belum Ada Data Unit</h3>
            <p className="mt-2 text-industrial-gray-dark">Tambahkan unit baru untuk digunakan dalam data harga.</p>
            <div className="mt-6">
                 <button
                    onClick={() => setShowManageUnitsModal(true)}
                    className="flex items-center mx-auto px-4 py-2 bg-industrial-accent text-white font-semibold rounded-md hover:bg-industrial-accent-dark shadow-sm transition-colors"
                >
                    <PlusCircle size={18} className="mr-2"/> Tambah Unit Baru
                </button>
            </div>
        </div>
    );
    
    return (
        <div className="p-8">
            <div className="flex justify-end items-center space-x-3 mb-6">
                <button
                    onClick={() => setShowManageUnitsModal(true)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-industrial-accent rounded-md hover:bg-industrial-accent-dark shadow-sm transition-colors"
                >
                    <PlusCircle size={18} className="mr-2"/> Tambah/Kelola Unit
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-8 text-industrial-gray">
                    <Loader2 className="animate-spin mr-2" />
                    <span>Memuat data unit...</span>
                </div>
            ) : error ? (
                 <div className="flex items-center justify-center p-8 text-red-600 bg-red-100 rounded-lg">
                    <AlertTriangle className="mr-2" />
                    <span>{error}</span>
                </div>
            ) : units.length === 0 ? (
                <NoDataDisplay />
            ) : (
                <UnitsTable />
            )}

            <ManageUnitsModal
                showManageUnitsModal={showManageUnitsModal}
                setShowManageUnitsModal={setShowManageUnitsModal}
                newUnitName={newUnitName}
                setNewUnitName={setNewUnitName}
                handleAddNewUnit={handleAddNewUnit}
                userUnits={userUnits}
                handleDeleteUnit={handleDeleteUnit}
                handleUpdateUnit={handleUpdateUnit}
                onUnitsUpdated={handleUnitsUpdated}
            />
        </div>
    );
};

export default ManageUnitsView;