// src/components/ProjectCashFlowView.js
import React from 'react';
import { PlusCircle, Save, Edit3, Trash2, Settings } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const ProjectCashFlowView = React.memo(({
    currentProject,
    showCashFlowForm,
    setShowCashFlowForm,
    cashFlowFormData,
    setCashFlowFormData,
    handleCashFlowFormChange,
    userCashFlowCategories,
    editingCashFlowEntry,
    setEditingCashFlowEntry,
    handleSaveCashFlowEntry,
    isSavingCashFlowEntry,
    handleEditCashFlowEntry,
    handleDeleteCashFlowEntry,
    setShowManageCashFlowCategoriesModal
}) => {
    const expenseEntries = (currentProject.cashFlowEntries || [])
        .sort((a, b) => new Date(b.created_at || b.entry_date) - new Date(a.created_at || a.entry_date));
    const getCategoryName = (categoryId) => userCashFlowCategories.find(c => c.id === categoryId)?.category_name;
    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-wrap justify-between items-center gap-3">
                {/* Section Title - Light Theme */}
                <h4 className="text-xl font-medium text-gray-700">Daftar Biaya Lain-Lain:</h4>
                <div className="flex space-x-3">
                    {/* Buttons - Retained strong colors for actions, check contrast if needed */}
                    <button
                        onClick={() => setShowManageCashFlowCategoriesModal(true)}
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md shadow-md flex items-center"
                    >
                        <Settings size={20} className="mr-2"/> Kelola Kategori
                    </button>
                    <button
                        onClick={() => {
                            setShowCashFlowForm(!showCashFlowForm);
                            setEditingCashFlowEntry(null);
                            const firstCat = userCashFlowCategories.length > 0 ? userCashFlowCategories[0] : {id: ''};
                            setCashFlowFormData({ date: new Date().toISOString().split('T')[0], description: '', type: '', amount: '', categoryId: firstCat.id });
                        }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md shadow-md flex items-center"
                    >
                        <PlusCircle size={20} className="mr-2"/> {showCashFlowForm ? 'Batal' : 'Tambah Biaya Baru'}
                    </button>
                </div>
            </div>
            {showCashFlowForm && (
                // Form Container - Light Theme
                <div className="p-6 bg-white rounded-lg shadow-lg space-y-4 animate-fadeIn border border-gray-200">
    <h3 className="text-xl font-medium text-gray-700">{editingCashFlowEntry ? 'Edit Biaya' : 'Tambah Biaya Lain-Lain'}</h3>
    
    {/* Kolom deskripsi sekarang di atas */}
    <input
        type="text"
        name="description"
        value={cashFlowFormData.description}
        onChange={handleCashFlowFormChange}
        placeholder="Deskripsi Biaya (cth: Pembelian paku, Upah mandor)"
        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-700 focus:ring-sky-500 focus:border-sky-500"
    />

    {/* Kolom Jumlah dan Kategori */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
            type="number"
            name="amount"
            value={cashFlowFormData.amount}
            onChange={handleCashFlowFormChange}
            placeholder="Jumlah (Rp)"
            min="0"
            className="p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-700 focus:ring-sky-500 focus:border-sky-500"
        />
        <select
            name="categoryId"
            value={cashFlowFormData.categoryId}
            onChange={handleCashFlowFormChange}
            className="p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-700 focus:ring-sky-500 focus:border-sky-500"
        >
            <option value="">-- Pilih Kategori --</option>
            {userCashFlowCategories
                                .filter(cat => cat.category_name !== 'Harga Proyek')
                                .sort((a, b) => a.category_name.localeCompare(b.category_name))
                                .map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.category_name}
                                    </option>
                                ))}
        </select>
    </div>

    {/* Tombol Aksi Form */}
    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
        <button
            onClick={() => { setShowCashFlowForm(false); setEditingCashFlowEntry(null); }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
        >
            Batal
        </button>
        <button
            onClick={handleSaveCashFlowEntry}
            disabled={isSavingCashFlowEntry}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center disabled:opacity-50 transition-colors"
        >
            <Save size={18} className="mr-2"/>
            {isSavingCashFlowEntry ? 'Menyimpan...' : 'Simpan Biaya'}
        </button>
    </div>
</div>

            )}
            {expenseEntries.length > 0 ? (
                // Table Container - Light Theme
                <div className="overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
                    <table className="w-full min-w-max text-left">
                        {/* Table Head - Light Theme */}
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="p-4">Deskripsi</th>
                                <th className="p-4">Kategori</th>
                                <th className="p-4 text-right">Jumlah (Rp)</th>
                                <th className="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        {/* Table Body - Light Theme */}
                        <tbody>
                            {expenseEntries.map(entry => (
                                <tr key={entry.id} className={`border-b border-gray-200 hover:bg-gray-50 ${entry.is_auto_generated ? 'opacity-70' : (entry.entry_type === 'income' ? 'bg-green-50' : 'bg-red-50')}`}>
                                    <td className="p-4 text-gray-700">
                                        {entry.description}
                                        {entry.is_auto_generated ? (
                                            <span className="text-xs text-sky-600 ml-1">(Otomatis)</span>
                                        ) : null}
                                    </td>
                                    <td className="p-4 text-gray-600">{getCategoryName(entry.category_id)}</td>
                                    <td className={`p-4 text-right font-semibold ${entry.entry_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{entry.entry_type === 'income' ? '+' : '-'} {formatCurrency(parseFloat(entry.amount))}</td>
                                    <td className="p-4 text-right space-x-2">
                                        {!entry.is_auto_generated && (
                                            <>
                                                {/* Action Icons - Light Theme */}
                                                <button onClick={() => handleEditCashFlowEntry(entry)} className="p-2 text-yellow-500 hover:text-yellow-600"><Edit3 size={18}/></button>
                                                <button 
                                                onClick={() => {
                                                    console.log(`Mencoba menghapus entri: ${entry.id}`);
                                                    handleDeleteCashFlowEntry(entry.id);
                                                }} 
                                                className="p-2 text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 size={18}/>
                                            </button>                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                // "No entries" text - Light Theme
                <p className="text-gray-500 text-center py-4">Belum ada daftar biaya lain-lain untuk proyek ini.</p>
            )}
        </div>
    );
});

export default ProjectCashFlowView;