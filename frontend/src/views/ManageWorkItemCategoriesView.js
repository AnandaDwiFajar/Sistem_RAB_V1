import React, { useState, useCallback } from 'react';
import { ClipboardList, PlusCircle, Loader2, AlertTriangle, Edit3, Trash2, Save, X } from 'lucide-react';
import { useUserData } from '../hooks/useUserData';
import ManageWorkItemCategoriesModal from '../components/modals/ManageWorkItemCategoriesModal';

const ManageWorkItemCategoriesView = () => {
    const { 
        userWorkItemCategories,
        handleAddNewWorkItemCategory,
        handleDeleteWorkItemCategory,
        handleUpdateWorkItemCategory,
        newCategoryName,
        setNewCategoryName,
    } = useUserData();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingName, setEditingName] = useState('');

    const handleStartEdit = (category) => {
        setEditingCategory(category);
        setEditingName(category.category_name);
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        setEditingName('');
    };

    const handleSaveEdit = async () => {
        if (!editingCategory || !editingName.trim()) return;
        await handleUpdateWorkItemCategory(editingCategory.id, editingName.trim());
        handleCancelEdit();
    };

    const handleDelete = async (category) => {
        await handleDeleteWorkItemCategory(category);
    };

    const CategoriesTable = () => (
        <div className="overflow-x-auto bg-white border border-industrial-gray-light rounded-lg shadow-sm">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-industrial-gray-light">
                    <tr>
                        <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider w-full">Nama Kategori</th>
                        <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="text-industrial-dark">
                    {userWorkItemCategories.map(category => (
                        <tr key={category.id} className="border-b border-industrial-gray-light hover:bg-gray-50/50 transition-colors">
                            {editingCategory && editingCategory.id === category.id ? (
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
                                    <td className="p-4 font-medium">{category.category_name}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => handleStartEdit(category)} className="p-1.5 text-industrial-gray-dark hover:text-industrial-accent" title="Edit"><Edit3 size={16} /></button>
                                            <button onClick={() => handleDelete(category)} className="p-1.5 text-red-500 hover:text-red-700" title="Hapus"><Trash2 size={16} /></button>
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
            <ClipboardList size={48} className="mx-auto text-industrial-gray" />
            <h3 className="mt-4 text-xl font-semibold text-industrial-dark">Belum Ada Kategori</h3>
            <p className="mt-2 text-industrial-gray-dark">Tambahkan kategori baru untuk komponen pekerjaan.</p>
            <div className="mt-6">
                 <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center mx-auto px-4 py-2 bg-industrial-accent text-white font-semibold rounded-md hover:bg-industrial-accent-dark shadow-sm transition-colors"
                >
                    <PlusCircle size={18} className="mr-2"/> Tambah Kategori Baru
                </button>
            </div>
        </div>
    );
    
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-industrial-dark mb-6">Kelola Kategori Komponen Pekerjaan</h1>
            <div className="flex justify-end items-center space-x-3 mb-6">
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-industrial-accent rounded-md hover:bg-industrial-accent-dark shadow-sm transition-colors"
                >
                    <PlusCircle size={18} className="mr-2"/> Tambah Kategori
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-8 text-industrial-gray">
                    <Loader2 className="animate-spin mr-2" />
                    <span>Memuat data...</span>
                </div>
            ) : error ? (
                 <div className="flex items-center justify-center p-8 text-red-600 bg-red-100 rounded-lg">
                    <AlertTriangle className="mr-2" />
                    <span>{error}</span>
                </div>
            ) : userWorkItemCategories.length === 0 ? (
                <NoDataDisplay />
            ) : (
                <CategoriesTable />
            )}

            <ManageWorkItemCategoriesModal
                showManageCategoriesModal={showModal}
                setShowManageCategoriesModal={setShowModal}
                newCategoryName={newCategoryName}
                setNewCategoryName={setNewCategoryName}
                handleAddNewWorkItemCategory={handleAddNewWorkItemCategory}
            />
        </div>
    );
};

export default ManageWorkItemCategoriesView;