import React, { useRef } from 'react';
import { PlusCircle, Save, Edit3, Trash2, DollarSign } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { CSSTransition } from 'react-transition-group';

// --- Reusable Form Components for Consistency ---
const FormField = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-industrial-dark mb-1">{label}</label>
        {children}
    </div>
);
const FormInput = (props) => (
    <input {...props} className="w-full p-2 bg-white border border-industrial-gray-light rounded-md text-industrial-dark placeholder-industrial-gray focus:outline-none focus:ring-2 focus:ring-industrial-accent" />
);
const FormSelect = ({ children, ...props }) => (
    <select {...props} className="w-full p-2 bg-white border border-industrial-gray-light rounded-md text-industrial-dark focus:outline-none focus:ring-2 focus:ring-industrial-accent">
        {children}
    </select>
);

const ProjectCashFlowView = ({
    currentProject,
    // Props dari projectsManager
    showCashFlowForm,
    setShowCashFlowForm,
    cashFlowFormData,
    handleCashFlowFormChange,
    handleSaveCashFlowEntry,
    isSavingCashFlowEntry,
    editingCashFlowEntry,
    handleEditCashFlowEntry,
    handleDeleteCashFlowEntry,
    handleCancelCashFlowForm,
    // Props dari App.js
    userCashFlowCategories = [], // Default ke array kosong untuk keamanan
}) => {
    const formRef = useRef(null);
    // --- Defensive Coding: Pastikan data adalah array ---
    const cashFlowEntries = Array.isArray(currentProject?.cashFlowEntries) ? currentProject.cashFlowEntries : [];
    const safeCategories = Array.isArray(userCashFlowCategories) ? userCashFlowCategories : [];

    const getCategoryName = (categoryId) => safeCategories.find(c => c.id === categoryId)?.category_name || 'Tidak Diketahui';
    const handleAddNewEntry = () => {
        handleEditCashFlowEntry(null); // Panggil dengan null untuk membuka form baru
    };

    
    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center space-x-3">
                <button
                    onClick={showCashFlowForm ? handleCancelCashFlowForm : handleAddNewEntry} // <-- Logika yang disederhanakan
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-industrial-accent rounded-md hover:bg-industrial-accent-dark shadow-sm transition-colors"
                >
                    <PlusCircle size={18} className="mr-2"/> {showCashFlowForm ? 'Batal' : 'Tambah Biaya Lain'}
                </button>
            </div>
            <CSSTransition
                nodeRef={formRef}
                in={showCashFlowForm}
                timeout={300}
                classNames="form-transition"
                unmountOnExit
            >
                            <div ref={formRef} className="p-6 bg-white border border-industrial-gray-light rounded-lg shadow-lg space-y-4 animate-fadeIn">
                    <h3 className="text-xl font-bold text-industrial-accent pb-4 border-b border-industrial-gray-light">
                        {editingCashFlowEntry ? 'Edit Biaya Lain' : 'Tambah Biaya Lain Baru'}
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <FormField label="Deskripsi Biaya">
                            <FormInput
                                type="text"
                                name="description"
                                value={cashFlowFormData.description}
                                onChange={handleCashFlowFormChange}
                                placeholder="Contoh: Biaya Overhead, Biaya Lain"
                            />
                        </FormField>

                        <FormField label="Jumlah (Rp)">
                            <FormInput
                                type="number"
                                name="amount"
                                value={cashFlowFormData.amount}
                                onChange={handleCashFlowFormChange}
                                placeholder="500000"
                                min="0"
                            />
                        </FormField>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-industrial-gray-light">
                        <button type="button" onClick={handleCancelCashFlowForm} className="px-5 py-2 text-sm font-medium text-industrial-dark bg-industrial-gray-light/50 border border-industrial-gray-light rounded-md hover:bg-industrial-gray-light">
                            Batal
                        </button>
                        <button onClick={handleSaveCashFlowEntry} disabled={isSavingCashFlowEntry} className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold text-white bg-industrial-accent rounded-md hover:bg-industrial-accent-dark disabled:bg-industrial-gray">
                            <Save size={18} className="mr-2"/> {isSavingCashFlowEntry ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </CSSTransition>

            {cashFlowEntries.length > 0 ? (
                <div className="overflow-x-auto bg-white border border-industrial-gray-light rounded-lg shadow-sm">
                    <table className="w-full min-w-max text-left">
                        <thead className="bg-gray-50 border-b border-industrial-gray-light">
                            <tr>
                                <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider">Deskripsi</th>
                                <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider text-right">Jumlah</th>
                                <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-industrial-dark">
                            {cashFlowEntries.map(entry => (
                                <tr key={entry.id} className="border-b border-industrial-gray-light hover:bg-gray-50/50">
                                    <td className="p-4 font-medium">{entry.description}</td>
                                    <td className={`p-4 font-semibold text-right ${entry.entry_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {entry.entry_type === 'income' ? '+' : '-'} {formatCurrency(parseFloat(entry.amount))}
                                    </td>
                                    <td className="p-4 text-right">
                                        {!entry.is_auto_generated && (
                                            <>
                                                <button onClick={() => handleEditCashFlowEntry(entry)} className="p-1.5 text-industrial-gray-dark hover:text-industrial-accent" title="Edit"><Edit3 size={16}/></button>
                                                <button onClick={() => handleDeleteCashFlowEntry(entry.id)} className="p-1.5 text-red-500 hover:text-red-700" title="Hapus"><Trash2 size={16}/></button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                !showCashFlowForm && (
                     <div className="text-center py-12 px-6 border-2 border-dashed border-industrial-gray-light rounded-lg">
                        <DollarSign size={48} className="mx-auto text-industrial-gray" />
                        <h3 className="mt-4 text-xl font-semibold text-industrial-dark">Belum Ada Biaya Lain</h3>
                        <p className="mt-2 text-industrial-gray-dark">Tambahkan biaya lain untuk proyek ini.</p>
                    </div>
                )
            )}
        </div>
    );
};

export default React.memo(ProjectCashFlowView);