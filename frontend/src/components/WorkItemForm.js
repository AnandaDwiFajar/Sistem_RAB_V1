import React from 'react';
import { Save, X } from 'lucide-react';

const WorkItemForm = ({ formData, setFormData, onSave, onCancel, isSaving, templates, categories, editingWorkItem }) => {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTemplateChange = (e) => {
        const templateId = e.target.value;
        const template = Object.values(templates).find(t => t.id === templateId);
        if (template) {
            setFormData(prev => ({
                ...prev,
                template_id: templateId,
                name: template.name,
                category_id: template.category_id,
            }));
        }
    };

    return (
        <div className="p-4 my-4 bg-gray-50 border border-industrial-gray-light rounded-lg">
            <h3 className="text-lg font-semibold mb-4">{editingWorkItem ? 'Edit Pekerjaan' : 'Tambah Pekerjaan Baru'}</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-industrial-dark">Gunakan Template</label>
                    <select onChange={handleTemplateChange} className="w-full p-2 mt-1 bg-white border border-industrial-gray-light rounded-md">
                        <option value="">-- Pilih Template --</option>
                        {Object.values(templates).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-industrial-dark">Nama Pekerjaan</label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full p-2 mt-1 bg-white border border-industrial-gray-light rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-industrial-dark">Kategori</label>
                    <select name="category_id" value={formData.category_id || ''} onChange={handleInputChange} className="w-full p-2 mt-1 bg-white border border-industrial-gray-light rounded-md">
                        <option value="">-- Pilih Kategori --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-industrial-dark">Volume</label>
                    <input type="number" name="volume" value={formData.volume || ''} onChange={handleInputChange} className="w-full p-2 mt-1 bg-white border border-industrial-gray-light rounded-md" />
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

export default WorkItemForm;