// src/components/ProjectCashFlowView.js
import React from 'react';
import { PlusCircle, Save, Edit3, Trash2, Settings } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const ProjectCashFlowView = React.memo(({
    currentProject, // Passed down for context
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
    // Removed 'if (!currentProject) return null;'

    const sortedCashFlowEntries = [...(currentProject.cashFlowEntries || [])].sort((a,b) => new Date(b.entry_date) - new Date(a.entry_date));
    const getCategoryName = (categoryId) => userCashFlowCategories.find(c => c.id === categoryId)?.category_name || 'N/A';

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-700/30 rounded-lg shadow"><h5 className="text-sm text-green-300 font-medium">Total Income</h5><p className="text-2xl font-bold text-green-400">{formatCurrency(currentProject.actual_income || 0)}</p></div>
                <div className="p-4 bg-red-700/30 rounded-lg shadow"><h5 className="text-sm text-red-300 font-medium">Total Expenses</h5><p className="text-2xl font-bold text-red-400">{formatCurrency(currentProject.actual_expenses || 0)}</p></div>
                <div className="p-4 bg-sky-700/30 rounded-lg shadow"><h5 className="text-sm text-sky-300 font-medium">Net Cash Flow</h5><p className="text-2xl font-bold text-sky-400">{formatCurrency((currentProject.actual_income || 0) - (currentProject.actual_expenses || 0))}</p></div>
            </div>
            <div className="flex flex-wrap justify-between items-center gap-3"> {/* Added flex-wrap and gap for responsiveness */}
                <h4 className="text-xl font-medium text-white">Cash Flow Entries:</h4>
                <div className="flex space-x-3"> {/* Wrapper for buttons */}
                    <button
                        onClick={() => setShowManageCashFlowCategoriesModal(true)} // <-- Use the prop
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shadow-md flex items-center"
                    >
                        <Settings size={20} className="mr-2"/> Manage Categories
                    </button>
                    <button 
                        onClick={() => {
                            setShowCashFlowForm(!showCashFlowForm);
                            setEditingCashFlowEntry(null);
                            const firstCat = userCashFlowCategories.length > 0 ? userCashFlowCategories[0] : {id:''};
                            setCashFlowFormData({ date: new Date().toISOString().split('T')[0], description: '', type: 'expense', amount: '', categoryId: firstCat.id });
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md shadow-md flex items-center"
                    >
                        <PlusCircle size={20} className="mr-2"/> {showCashFlowForm ? 'Cancel Entry' : 'Add Cash Flow Entry'}
                    </button>
                </div>
            </div>
            {showCashFlowForm && ( <div className="p-6 bg-slate-700 rounded-lg shadow-lg space-y-4 animate-fadeIn">
                <h3 className="text-xl font-medium text-white">{editingCashFlowEntry ? 'Edit Cash Flow Entry' : 'Add New Cash Flow Entry'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="date" name="date" value={cashFlowFormData.date} onChange={handleCashFlowFormChange} className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white"/>
                    <select name="type" value={cashFlowFormData.type} onChange={handleCashFlowFormChange} className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white"><option value="expense">Expense</option><option value="income">Income</option></select>
                </div>
                <input // THIS IS A CASH FLOW INPUT
                    type="text" name="description" value={cashFlowFormData.description} onChange={handleCashFlowFormChange} placeholder="Description" className="w-full p-3 bg-slate-800 border border-slate-600 rounded-md text-white"/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input // THIS IS A CASH FLOW INPUT
                        type="number" name="amount" value={cashFlowFormData.amount} onChange={handleCashFlowFormChange} placeholder="Amount (Rp)" min="0" className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white"/>
                    <select name="categoryId" value={cashFlowFormData.categoryId} onChange={handleCashFlowFormChange} className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white">
                        <option value="">-- Select Category --</option>
                        {userCashFlowCategories.sort((a,b) => a.category_name.localeCompare(b.category_name)).map(cat => <option key={cat.id} value={cat.id}>{cat.category_name}</option>)}
                    </select>
                </div>
                <div className="flex justify-end space-x-3">
                    <button onClick={() => { setShowCashFlowForm(false); setEditingCashFlowEntry(null); }} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md">Cancel</button>
                    <button onClick={handleSaveCashFlowEntry} disabled={isSavingCashFlowEntry} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center disabled:opacity-50">
                        <Save size={18} className="mr-2"/> {isSavingCashFlowEntry ? 'Saving...' : 'Save Entry'}</button>
                </div></div>)}
            {/* ... list of cash flow entries ... */}
            {sortedCashFlowEntries.length > 0 ? ( <div className="overflow-x-auto bg-slate-700/70 rounded-lg shadow-lg">
                <table className="w-full min-w-max text-left text-slate-300">
                    <thead className="bg-slate-800 text-slate-400"><tr><th className="p-4">Date</th><th className="p-4">Description</th><th className="p-4">Category</th><th className="p-4 text-right">Amount (Rp)</th><th className="p-4 text-right">Actions</th></tr></thead>
                    <tbody>{sortedCashFlowEntries.map(entry => (
                        <tr key={entry.id} className={`border-b border-slate-600 hover:bg-slate-600/50 ${entry.is_auto_generated ? 'opacity-70' : (entry.entry_type === 'income' ? 'bg-green-900/30' : 'bg-red-900/30')}`}>
                            <td className="p-4 text-white">{new Date(entry.entry_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                            <td className="p-4 text-white">
                            {entry.description}
                            {entry.is_auto_generated ? (               // now a real boolean
                                <span className="text-xs text-sky-400 ml-1">(Otomatis)</span>
                            ) : null}
                            </td>
                            <td className="p-4">{getCategoryName(entry.category_id)}</td>
                            <td className={`p-4 text-right font-semibold ${entry.entry_type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{entry.entry_type === 'income' ? '+' : '-'} {formatCurrency(parseFloat(entry.amount))}</td>
                            <td className="p-4 text-right space-x-2">{!entry.is_auto_generated && (<><button onClick={() => handleEditCashFlowEntry(entry)} className="p-2 text-yellow-400 hover:text-yellow-300"><Edit3 size={18}/></button><button onClick={() => handleDeleteCashFlowEntry(entry.id)} className="p-2 text-red-500 hover:text-red-400"><Trash2 size={18}/></button></>)}</td>
                        </tr>))}</tbody></table></div>
            ) : ( <p className="text-slate-400 text-center py-4">No cash flow entries for this project yet.</p> )}
        </div>
    );
});

export default ProjectCashFlowView;