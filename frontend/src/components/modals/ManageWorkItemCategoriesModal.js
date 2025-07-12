// components/modals/ManageWorkItemCategoriesModal.js
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
    handleUpdateWorkItemCategory, // <-- Prop baru untuk logika update
}) => {
    // State untuk melacak kategori mana yang sedang diedit
    const [editingCategory, setEditingCategory] = useState(null); // Menyimpan objek kategori lengkap
    const [editingName, setEditingName] = useState(''); // Menyimpan teks untuk input field saat edit

    // Reset state edit saat modal ditutup
    useEffect(() => {
        if (!showManageCategoriesModal) {
            setEditingCategory(null);
            setEditingName('');
        }
    }, [showManageCategoriesModal]);

    if (!showManageCategoriesModal) return null;

    // Handler untuk memulai mode edit
    const handleStartEdit = (category) => {
        setEditingCategory(category);
        setEditingName(category.category_name);
    };

    // Handler untuk membatalkan edit
    const handleCancelEdit = () => {
        setEditingCategory(null);
        setEditingName('');
    };

    // Handler untuk menyimpan hasil edit
    const handleSaveEdit = () => {
        if (!editingCategory || !editingName.trim()) return; // Validasi dasar
        // Panggil fungsi update dari props
        handleUpdateWorkItemCategory(editingCategory.id, editingName.trim());
        handleCancelEdit(); // Keluar dari mode edit setelah menyimpan
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[95] p-4 animate-fadeIn">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-sky-600">Kelola Kategori Komponen Pekerjaan</h3>
                    <button onClick={() => setShowManageCategoriesModal(false)} className="p-1 text-gray-500 hover:text-gray-700">
                        <XCircle size={24}/>
                    </button>
                </div>

                {/* --- Form untuk menambah kategori baru --- */}
                <div className="mb-4 flex space-x-2">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNewWorkItemCategory()}
                        placeholder="Nama Kategori Baru"
                        className="flex-grow p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    />
                    <button
                        onClick={handleAddNewWorkItemCategory}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center shadow-md transition-colors"
                    >
                        <PlusCircle size={18} className="mr-2"/> Tambah
                    </button>
                </div>

                {/* --- Daftar kategori yang sudah ada --- */}
                <div className="overflow-y-auto flex-grow space-y-2 pr-1 -mr-2">
                    {userWorkItemCategories.length === 0 && <p className="text-gray-500 text-center">Tidak Ada Kategori.</p>}
                    
                    {[...userWorkItemCategories]
                        .sort((a, b) => a.category_name.localeCompare(b.category_name))
                        .map(catObj => (
                            <div key={catObj.id} className="flex justify-between items-center p-2 bg-gray-100 border border-gray-200 rounded-md">
                                {editingCategory && editingCategory.id === catObj.id ? (
                                    // --- Tampilan saat mode EDIT ---
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
                                    // --- Tampilan saat mode NORMAL ---
                                    <>
                                        <span className="text-gray-700">{catObj.category_name}</span>
                                        <div className="flex items-center">
                                            <button onClick={() => handleStartEdit(catObj)} className="p-1 text-yellow-500 hover:text-yellow-600 transition-colors" title="Edit">
                                                <Edit3 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteWorkItemCategory(catObj)} className="p-1 text-red-500 hover:text-red-600 transition-colors" title="Hapus">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                </div>

                {/* --- Tombol Tutup --- */}
                <div className="mt-6 pt-4 border-t border-gray-200 text-right">
                    <button
                        onClick={() => setShowManageCategoriesModal(false)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageWorkItemCategoriesModal;
