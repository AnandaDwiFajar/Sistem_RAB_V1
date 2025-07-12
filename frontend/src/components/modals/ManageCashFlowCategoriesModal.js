// components/modals/ManageCashFlowCategoriesModal.js
import React from 'react';
import { PlusCircle, Trash2, XCircle } from 'lucide-react';

const ManageCashFlowCategoriesModal = ({
    showManageCashFlowCategoriesModal,
    setShowManageCashFlowCategoriesModal,
    newCashFlowCategoryName,
    setNewCashFlowCategoryName,
    handleAddNewCashFlowCategory,
    userCashFlowCategories,
    handleDeleteCashFlowCategory,
}) => {
    if (!showManageCashFlowCategoriesModal) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[95] p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[70vh] flex flex-col border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-sky-600">Kelola Kategori Biaya</h3>
                    <button onClick={() => setShowManageCashFlowCategoriesModal(false)} className="p-1 text-gray-500 hover:text-gray-700">
                        <XCircle size={24}/>
                    </button>
                </div>
                <div className="mb-4 flex space-x-2">
                    <input
                        type="text"
                        value={newCashFlowCategoryName}
                        onChange={(e) => setNewCashFlowCategoryName(e.target.value)}
                        placeholder="Nama Kategori Baru"
                        className="flex-grow p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    />
                    <button
                        onClick={handleAddNewCashFlowCategory}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center shadow-sm"
                    >
                        <PlusCircle size={18} className="mr-2"/> Tambah
                    </button>
                </div>
                <div className="overflow-y-auto flex-grow space-y-2 pr-1">
                    {userCashFlowCategories.length === 0 && <p className="text-gray-500 text-center">Belum ada kategori.</p>}
                    {userCashFlowCategories
                        .filter(cat => cat.category_name && cat.category_name !== 'Harga Proyek') // Tambahkan filter ini
                        .sort((a, b) => a.category_name.localeCompare(b.category_name))
                        .map(catObj => (
                            <div key={catObj.id} className="flex justify-between items-center p-2 bg-gray-100 rounded-md border border-gray-200">
                                <span className="text-gray-700">{catObj.category_name}</span>
                                <button onClick={() => handleDeleteCashFlowCategory(catObj)} className="p-1 text-red-500 hover:text-red-600">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))
                    }
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 text-right">
                    <button
                        onClick={() => setShowManageCashFlowCategoriesModal(false)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageCashFlowCategoriesModal;