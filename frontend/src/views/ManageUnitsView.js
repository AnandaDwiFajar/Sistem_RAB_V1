import React, { useState, useEffect, useCallback } from 'react';
import { Settings, PlusCircle, Loader2, AlertTriangle, Edit3, Trash2, Save, X } from 'lucide-react';
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

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showManageUnitsModal, setShowManageUnitsModal] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [editingName, setEditingName] = useState('');

    const handleStartEdit = (unit) => {
        setEditingUnit(unit);
        setEditingName(unit.unit_name);
    };

    const handleCancelEdit = () => {
        setEditingUnit(null);
        setEditingName('');
    };

    const handleSaveEdit = async () => {
        if (!editingUnit || !editingName.trim()) return;
        await handleUpdateUnit(editingUnit.id, editingName.trim());
        handleCancelEdit();
    };
    
    const handleDelete = async (unit) => {
        await handleDeleteUnit(unit)
    }

    const UnitsGrid = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userUnits.map(unit => (
                <div key={unit.id} className="bg-white border border-industrial-gray-light rounded-lg shadow-sm p-4 flex items-center justify-between transition-all duration-300">
                    {editingUnit && editingUnit.id === unit.id ? (
                        <>
                            <input 
                                type="text" 
                                value={editingName} 
                                onChange={(e) => setEditingName(e.target.value)} 
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') handleCancelEdit();
                                }}
                                className="w-full p-1 bg-white border border-industrial-accent rounded-md text-industrial-dark focus:outline-none focus:ring-2 focus:ring-industrial-accent" 
                                autoFocus 
                            />
                            <div className="flex items-center space-x-2 ml-3">
                                <button onClick={handleSaveEdit} className="p-1.5 text-green-600 hover:text-green-700 rounded-full hover:bg-green-100" title="Simpan"><Save size={18} /></button>
                                <button onClick={handleCancelEdit} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200" title="Batal"><X size={18} /></button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="font-medium text-industrial-dark">{unit.unit_name}</p>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleStartEdit(unit)} className="p-1.5 text-industrial-gray-dark hover:text-industrial-accent rounded-full hover:bg-blue-100" title="Edit"><Edit3 size={16} /></button>
                                <button onClick={() => handleDelete(unit)} className="p-1.5 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100" title="Hapus"><Trash2 size={16} /></button>
                            </div>
                        </>
                    )}
                </div>
            ))}
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
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="pb-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-industrial-dark">Kelola Unit</h1>
                <button
                    onClick={() => setShowManageUnitsModal(true)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-industrial-accent rounded-md hover:bg-industrial-accent-dark shadow-sm transition-colors"
                >
                    <PlusCircle size={18} className="mr-2"/> Tambah Unit
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
            ) : userUnits.length === 0 ? (
                <NoDataDisplay />
            ) : (
                <UnitsGrid />
            )}

            <ManageUnitsModal
                showManageUnitsModal={showManageUnitsModal}
                setShowManageUnitsModal={setShowManageUnitsModal}
                newUnitName={newUnitName}
                setNewUnitName={setNewUnitName}
                handleAddNewUnit={handleAddNewUnit}
            />
        </div>
    );
};

export default ManageUnitsView;