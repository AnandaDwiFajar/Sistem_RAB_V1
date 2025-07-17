import React from 'react';
import { PlusCircle, XCircle } from 'lucide-react';

const ManageUnitsModal = ({
    showManageUnitsModal,
    setShowManageUnitsModal,
    newUnitName,
    setNewUnitName,
    handleAddNewUnit,
}) => {
    if (!showManageUnitsModal) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowManageUnitsModal(false)}>
            <div className="bg-industrial-light p-6 rounded-lg shadow-2xl max-w-md w-full flex flex-col border border-industrial-gray-light" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-industrial-gray-light">
                    <h3 className="text-xl font-bold text-industrial-accent">Tambah Unit Baru</h3>
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
                    <button onClick={() => {handleAddNewUnit(); setShowManageUnitsModal(false);}} className="px-4 py-2 bg-industrial-accent text-white rounded-md flex items-center shadow-sm hover:bg-industrial-accent-dark transition-colors">
                        <PlusCircle size={18} className="mr-2" /> Tambah
                    </button>
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