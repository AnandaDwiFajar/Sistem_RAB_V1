import React from 'react';
import { Save, X } from 'lucide-react';

const CashFlowForm = ({ formData, setFormData, onSave, onCancel, isSaving, categories, editingEntry }) => {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="p-4 my-4 bg-gray-50 border border-industrial-gray-light rounded-lg">
            <h3 className="text-lg font-semibold mb-4">{editingEntry ? 'Edit Entri Arus Kas' : 'Tambah Entri Arus Kas'}</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-industrial-dark">Deskripsi</label>
                    <input type="text" name="description" value={formData.description || ''} onChange={handleInputChange} className="w-full p-2 mt-1 bg-white border border-industrial-gray-light rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-industrial-dark">Jumlah</label>
                    <input type="number" name="amount" value={formData.amount || ''} onChange={handleInputChange} className="w-full p-2 mt-1 bg-white border border-industrial-gray-light rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-industrial-dark">Tanggal</label>
                    <input type="date" name="date" value={formData.date || ''} onChange={handleInputChange} className="w-full p-2 mt-1 bg-white border border-industrial-gray-light rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-industrial-dark">Kategori</label>
                    <select name="category_id" value={formData.category_id || ''} onChange={handleInputChange} className="w-full p-2 mt-1 bg-white border border-industrial-gray-light rounded-md">
                        <option value="">-- Pilih Kategori --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-industrial-dark">Tipe</label>
                    <select name="type" value={formData.type || 'expense'} onChange={handleInputChange} className="w-full p-2 mt-1 bg-white border border-industrial-gray-light rounded-md">
                        <option value="expense">Pengeluaran</option>
                        <option value="income">Pemasukan</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-industrial-dark rounded-md"><X size={18} className="mr-2" />Batal</button>
                <button onClick={onSave} disabled={isSaving} className="px-4 py-2 bg-industrial-accent text-white rounded-md flex items-center">
                    <Save size={18} className="mr-2" />{isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
            </div>
        </div>
    );
};

export default CashFlowForm;