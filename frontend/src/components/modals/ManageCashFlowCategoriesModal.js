import React, { useState } from 'react';
import { PlusCircle, Trash2, XCircle, Edit3, Save, X } from 'lucide-react';

const ManageCashFlowCategoriesModal = ({
    showManageCashFlowCategoriesModal,
    setShowManageCashFlowCategoriesModal,
    newCashFlowCategoryName,
    setNewCashFlowCategoryName,
    handleAddNewCashFlowCategory,
    userCashFlowCategories = [],
    handleDeleteCashFlowCategory,
    handleUpdateCashFlowCategory, // Prop baru untuk handle update
}) => {
    // State internal untuk mengelola item mana yang sedang diedit
    const [editingState, setEditingState] = useState({ id: null, name: '' });

    if (!showManageCashFlowCategoriesModal) return null;

    const categoryList = userCashFlowCategories
        .filter(cat => cat.category_name && cat.category_name !== 'Harga Proyek')
        .sort((a, b) => a.category_name.localeCompare(b.category_name));

    // --- Handler untuk edit inline ---
    const handleStartEdit = (category) => {
        setEditingState({ id: category.id, name: category.category_name });
    };

    const handleCancelEdit = () => {
        setEditingState({ id: null, name: '' });
    };

    const handleConfirmUpdate = () => {
        if (editingState.id && editingState.name.trim()) {
            handleUpdateCashFlowCategory(editingState.id, editingState.name.trim());
            handleCancelEdit(); // Keluar dari mode edit setelah submit
        }
    };
    
    const handleCloseModal = () => {
        handleCancelEdit(); // Pastikan mode edit dibatalkan saat modal ditutup
        setShowManageCashFlowCategoriesModal(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={handleCloseModal}>
            <div className="bg-industrial-light p-6 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col border border-industrial-gray-light" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-industrial-gray-light">
                    <h3 className="text-xl font-bold text-industrial-accent">Kelola Kategori Biaya Lain</h3>
                    <button onClick={handleCloseModal} className="p-1 text-industrial-gray-dark hover:text-industrial-dark"><XCircle size={24} /></button>
                </div>

                {/* Form Add New */}
                <div className="mb-4 flex space-x-2">
                    <input
                        type="text"
                        value={newCashFlowCategoryName}
                        onChange={(e) => setNewCashFlowCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNewCashFlowCategory()}
                        placeholder="Nama Kategori Baru"
                        className="w-full p-2 bg-white border border-industrial-gray-light rounded-md text-industrial-dark placeholder-industrial-gray focus:outline-none focus:ring-2 focus:ring-industrial-accent"
                    />
                    <button onClick={handleAddNewCashFlowCategory} className="px-4 py-2 bg-industrial-accent text-white rounded-md flex items-center shadow-sm hover:bg-industrial-accent-dark transition-colors shrink-0">
                        <PlusCircle size={18} className="mr-2" /> Tambah
                    </button>
                </div>

                {/* List of Categories */}
                <div className="overflow-y-auto flex-grow space-y-2 pr-1 -mr-2">
                    {categoryList.length === 0 && <p className="text-industrial-gray text-center p-4">Tidak ada kategori.</p>}
                    
                    {categoryList.map(catObj => (
                        <div key={catObj.id} className="flex justify-between items-center p-2 bg-white border border-industrial-gray-light rounded-md">
                            {editingState.id === catObj.id ? (
                                // --- TAMPILAN EDIT ---
                                <div className="flex-grow flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={editingState.name}
                                        onChange={(e) => setEditingState({ ...editingState, name: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && handleConfirmUpdate()}
                                        className="w-full p-1 border-b-2 border-industrial-accent bg-transparent focus:outline-none"
                                        autoFocus
                                    />
                                    <button onClick={handleConfirmUpdate} className="p-1.5 text-green-600 hover:text-green-800" title="Simpan">
                                        <Save size={16} />
                                    </button>
                                    <button onClick={handleCancelEdit} className="p-1.5 text-gray-500 hover:text-gray-700" title="Batal">
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                // --- TAMPILAN NORMAL ---
                                <>
                                    <span className="text-industrial-dark">{catObj.category_name}</span>
                                    <div className='flex items-center'>
                                        <button onClick={() => handleStartEdit(catObj)} className="p-1.5 text-industrial-gray-dark hover:text-industrial-accent" title="Edit">
                                            <Edit3 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteCashFlowCategory(catObj)} className="p-1.5 text-red-500 hover:text-red-700" title="Hapus">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-industrial-gray-light text-right">
                    <button onClick={handleCloseModal} className="px-5 py-2 text-sm font-medium text-industrial-dark bg-industrial-gray-light/50 border border-industrial-gray-light rounded-md hover:bg-industrial-gray-light">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageCashFlowCategoriesModal;