import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, XCircle, Edit3, Save, X } from 'lucide-react';

const ManageUnitsModal = ({
    showManageUnitsModal,
    setShowManageUnitsModal,
    newUnitName,
    setNewUnitName,
    handleAddNewUnit,
    userUnits,
    handleDeleteUnit,
    handleUpdateUnit,
}) => {
    const [editingUnit, setEditingUnit] = useState(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        if (!showManageUnitsModal) {
            setEditingUnit(null);
            setEditingName('');
        }
    }, [showManageUnitsModal]);

    if (!showManageUnitsModal) return null;

    const unitList = userUnits ? Object.values(userUnits) : [];

    const handleStartEdit = (unit) => {
        setEditingUnit(unit);
        setEditingName(unit.unit_name);
    };

    const handleCancelEdit = () => {
        setEditingUnit(null);
        setEditingName('');
    };

    const handleSaveEdit = () => {
        if (!editingUnit || !editingName.trim()) return;
        handleUpdateUnit(editingUnit.id, editingName.trim());
        handleCancelEdit();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowManageUnitsModal(false)}>
            <div className="bg-industrial-light p-6 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col border border-industrial-gray-light" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-industrial-gray-light">
                    <h3 className="text-xl font-bold text-industrial-accent">Kelola Unit</h3>
                    <button onClick={() => setShowManageUnitsModal(false)} className="p-1 text-industrial-gray-dark hover:text-industrial-dark"><XCircle size={24} /></button>
                </div>

                {/* Form Add New */}
                <div className="mb-4 flex space-x-2">
                    <input
                        type="text"
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        placeholder="Tambah Unit Baru (mis: m², ls, unit)"
                        className="w-full p-2 bg-white border border-industrial-gray-light rounded-md text-industrial-dark placeholder-industrial-gray focus:outline-none focus:ring-2 focus:ring-industrial-accent"
                    />
                    <button onClick={handleAddNewUnit} className="px-4 py-2 bg-industrial-accent text-white rounded-md flex items-center shadow-sm hover:bg-industrial-accent-dark transition-colors">
                        <PlusCircle size={18} className="mr-2" /> Tambah
                    </button>
                </div>

                {/* List of Units */}
                <div className="overflow-y-auto flex-grow space-y-2 pr-1 -mr-2">
                    {unitList.length === 0 && <p className="text-industrial-gray text-center p-4">Tidak ada unit.</p>}
                    
                    {[...unitList].sort((a, b) => (a.unit_name || '').localeCompare(b.unit_name || '')).map(unitObj => (
                        <div key={unitObj.id} className="flex justify-between items-center p-2 bg-white border border-industrial-gray-light rounded-md">
                            {editingUnit && editingUnit.id === unitObj.id ? (
                                <>
                                    <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()} className="flex-grow p-1 bg-white border border-industrial-accent rounded-md text-industrial-dark focus:outline-none focus:ring-2 focus:ring-industrial-accent" autoFocus />
                                    <div className="flex items-center ml-2">
                                        <button onClick={handleSaveEdit} className="p-1.5 text-green-600 hover:text-green-700" title="Simpan"><Save size={18} /></button>
                                        <button onClick={handleCancelEdit} className="p-1.5 text-gray-500 hover:text-gray-700" title="Batal"><X size={18} /></button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="text-industrial-dark">{unitObj.unit_name}</span>
                                    <div className="flex items-center">
                                        <button onClick={() => handleStartEdit(unitObj)} className="p-1.5 text-industrial-gray-dark hover:text-industrial-accent" title="Edit"><Edit3 size={16} /></button>
                                        <button onClick={() => handleDeleteUnit(unitObj)} className="p-1.5 text-red-500 hover:text-red-700" title="Hapus"><Trash2 size={16} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-industrial-gray-light text-right">
                    <button onClick={() => setShowManageUnitsModal(false)} className="px-5 py-2 text-sm font-medium text-industrial-dark bg-industrial-gray-light/50 border border-industrial-gray-light rounded-md hover:bg-industrial-gray-light">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageUnitsModal;
