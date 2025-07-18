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

    const UnitsTable = () => (
        <div className="overflow-x-auto bg-white border border-industrial-gray-light rounded-lg shadow-sm">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-industrial-gray-light">
                    <tr>
                        <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider w-full">Nama Unit</th>
                        <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="text-industrial-dark">
                    {userUnits.map(unit => (
                        <tr key={unit.id} className="border-b border-industrial-gray-light hover:bg-gray-50/50 transition-colors">
                            {editingUnit && editingUnit.id === unit.id ? (
                                <>
                                    <td className="p-4">
                                        <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()} className="w-full p-1 bg-white border border-industrial-accent rounded-md text-industrial-dark focus:outline-none focus:ring-2 focus:ring-industrial-accent" autoFocus />
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={handleSaveEdit} className="p-1.5 text-green-600 hover:text-green-700" title="Simpan"><Save size={18} /></button>
                                            <button onClick={handleCancelEdit} className="p-1.5 text-gray-500 hover:text-gray-700" title="Batal"><X size={18} /></button>
                                        </div>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td className="p-4 font-medium">{unit.unit_name}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => handleStartEdit(unit)} className="p-1.5 text-industrial-gray-dark hover:text-industrial-accent" title="Edit"><Edit3 size={16} /></button>
                                            <button onClick={() => handleDelete(unit)} className="p-1.5 text-red-500 hover:text-red-700" title="Hapus"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </>
                            )}
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
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
                <UnitsTable />
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