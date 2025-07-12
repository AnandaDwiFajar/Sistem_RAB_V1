// components/modals/ManageUnitsModal.js
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

    // Handler to start editing a unit
    const handleStartEdit = (unit) => {
        setEditingUnit(unit);
        setEditingName(unit.unit_name);
    };

    // Handler to cancel the edit
    const handleCancelEdit = () => {
        setEditingUnit(null);
        setEditingName('');
    };

    // Handler to save the edited unit
    const handleSaveEdit = () => {
        if (!editingUnit || !editingName.trim()) return; // Basic validation
        handleUpdateUnit(editingUnit.id, editingName.trim());
        handleCancelEdit(); // Exit editing mode after saving
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[95] p-4 animate-fadeIn">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-sky-600">Kelola Unit</h3>
                    <button onClick={() => setShowManageUnitsModal(false)} className="p-1 text-gray-500 hover:text-gray-700">
                        <XCircle size={24} />
                    </button>
                </div>

                {/* --- Form to Add New Unit --- */}
                <div className="mb-4 flex space-x-2">
                    <input
                        type="text"
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        placeholder="Tambah Unit Baru (mis: m², ls, unit)"
                        className="flex-grow p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    />
                    <button
                        onClick={handleAddNewUnit}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center shadow-md transition-colors"
                    >
                        <PlusCircle size={18} className="mr-2" /> Tambah
                    </button>
                </div>

                {/* --- List of Existing Units --- */}
                <div className="overflow-y-auto flex-grow space-y-2 pr-1 -mr-2">
                    {unitList.length === 0 && <p className="text-gray-500 text-center p-4">Tidak Ada Unit.</p>}
                    
                    {[...unitList]
                        .sort((a, b) => (a.unit_name || '').localeCompare(b.unit_name || ''))
                        .map(unitObj => (
                            <div key={unitObj.id} className="flex justify-between items-center p-2 bg-gray-100 border border-gray-200 rounded-md">
                                {editingUnit && editingUnit.id === unitObj.id ? (
                                    // --- EDITING VIEW ---
                                    <>
                                        <input
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                            className="flex-grow p-1 bg-white border border-sky-500 rounded-md text-gray-700 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                            autoFocus
                                        />
                                        <div className="flex items-center ml-2">
                                            <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:text-green-700 transition-colors" title="Simpan">
                                                <Save size={18} />
                                            </button>
                                            <button onClick={handleCancelEdit} className="p-1 text-gray-500 hover:text-gray-700 transition-colors" title="Batal">
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    // --- DISPLAY VIEW ---
                                    <>
                                        <span className="text-gray-700">{unitObj.unit_name}</span>
                                        <div className="flex items-center">
                                            <button onClick={() => handleStartEdit(unitObj)} className="p-1 text-yellow-500 hover:text-yellow-600 transition-colors" title="Edit">
                                                <Edit3 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteUnit(unitObj)} className="p-1 text-red-500 hover:text-red-600 transition-colors" title="Hapus">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                </div>

                {/* --- Close Button --- */}
                <div className="mt-6 pt-4 border-t border-gray-200 text-right">
                    <button
                        onClick={() => setShowManageUnitsModal(false)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageUnitsModal;
