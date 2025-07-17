import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, XCircle, Edit3, Save, X } from 'lucide-react';

const ManageWorkItemCategoriesModal = ({
    showManageCategoriesModal,
    setShowManageCategoriesModal,
    newCategoryName,
    setNewCategoryName,
    handleAddNewWorkItemCategory,
    userWorkItemCategories,
    handleDeleteWorkItemCategory,
    handleUpdateWorkItemCategory,
}) => {
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        if (!showManageCategoriesModal) {
            setEditingCategory(null);
            setEditingName('');
        }
    }, [showManageCategoriesModal]);

    if (!showManageCategoriesModal) return null;

    const handleStartEdit = (category) => {
        setEditingCategory(category);
        setEditingName(category.category_name);
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        setEditingName('');
    };

    const handleSaveEdit = () => {
        if (!editingCategory || !editingName.trim()) return;
        handleUpdateWorkItemCategory(editingCategory.id, editingName.trim());
        handleCancelEdit();
    };
    
    const categoryList = userWorkItemCategories ? [...userWorkItemCategories].sort((a, b) => a.category_name.localeCompare(b.category_name)) : [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowManageCategoriesModal(false)}>
            <div className="bg-industrial-light p-6 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col border border-industrial-gray-light" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-industrial-gray-light">
                    <h3 className="text-xl font-bold text-industrial-accent">Kelola Kategori Pekerjaan</h3>
                    <button onClick={() => setShowManageCategoriesModal(false)} className="p-1 text-industrial-gray-dark hover:text-industrial-dark"><XCircle size={24} /></button>
                </div>

                {/* Form Add New */}
                <div className="mb-4 flex space-x-2">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNewWorkItemCategory()}
                        placeholder="Nama Kategori Baru"
                        className="w-full p-2 bg-white border border-industrial-gray-light rounded-md text-industrial-dark placeholder-industrial-gray focus:outline-none focus:ring-2 focus:ring-industrial-accent"
                    />
                    <button onClick={handleAddNewWorkItemCategory} className="px-4 py-2 bg-industrial-accent text-white rounded-md flex items-center shadow-sm hover:bg-industrial-accent-dark transition-colors">
                        <PlusCircle size={18} className="mr-2" /> Tambah
                    </button>
                </div>

                {/* List of Categories */}
                <div className="overflow-y-auto flex-grow space-y-2 pr-1 -mr-2">
                    {categoryList.length === 0 && <p className="text-industrial-gray text-center p-4">Tidak ada kategori.</p>}
                    
                    {categoryList.map(catObj => (
                        <div key={catObj.id} className="flex justify-between items-center p-2 bg-white border border-industrial-gray-light rounded-md">
                            {editingCategory && editingCategory.id === catObj.id ? (
                                <>
                                    <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()} className="flex-grow p-1 bg-white border border-industrial-accent rounded-md text-industrial-dark focus:outline-none focus:ring-2 focus:ring-industrial-accent" autoFocus />
                                    <div className="flex items-center ml-2">
                                        <button onClick={handleSaveEdit} className="p-1.5 text-green-600 hover:text-green-700" title="Simpan"><Save size={18} /></button>
                                        <button onClick={handleCancelEdit} className="p-1.5 text-gray-500 hover:text-gray-700" title="Batal"><X size={18} /></button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="text-industrial-dark">{catObj.category_name}</span>
                                    <div className="flex items-center">
                                        <button onClick={() => handleStartEdit(catObj)} className="p-1.5 text-industrial-gray-dark hover:text-industrial-accent" title="Edit"><Edit3 size={16} /></button>
                                        <button onClick={() => handleDeleteWorkItemCategory(catObj)} className="p-1.5 text-red-500 hover:text-red-700" title="Hapus"><Trash2 size={16} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-industrial-gray-light text-right">
                    <button onClick={() => setShowManageCategoriesModal(false)} className="px-5 py-2 text-sm font-medium text-industrial-dark bg-industrial-gray-light/50 border border-industrial-gray-light rounded-md hover:bg-industrial-gray-light">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageWorkItemCategoriesModal;
