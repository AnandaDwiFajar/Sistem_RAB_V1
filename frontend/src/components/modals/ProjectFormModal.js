import React from 'react';
import { Save, XCircle, Loader2 } from 'lucide-react';

// Komponen FormField tidak perlu diubah
const FormField = ({ label, children, error }) => (
    <div>
        <label className="block text-sm font-medium text-industrial-dark mb-1">{label}</label>
        {children}
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
);

// Komponen FormInput tidak perlu diubah
const FormInput = ({ error, ...props }) => (
    <input 
        {...props} 
        className={`w-full p-3 bg-white border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-industrial-gray-light focus:ring-industrial-accent'
        }`}
    />
);

const ProjectFormModal = ({
    showModal,
    handleClose,
    formData,
    handleFormChange,
    handleSubmit,
    isSaving,
    editingProjectId,
    dateError,
    // Tambahkan error props baru jika ada
    projectNameError, 
    priceError,
}) => {
    if (!showModal) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={handleClose}
        >
            <div 
                className="bg-industrial-light p-6 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-industrial-gray-light"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-industrial-gray-light">
                    <h3 className="text-xl font-bold text-industrial-accent">
                        {editingProjectId ? 'Edit Detail Proyek' : 'Buat Proyek Baru'}
                    </h3>
                    <button onClick={handleClose} className="p-1 text-industrial-gray-dark hover:text-industrial-dark">
                        <XCircle size={24}/>
                    </button>
                </div>

                {/* Form Body */}
                <div className="overflow-y-auto space-y-4 pl-3 pr-2">
                    {/* --- PERBAIKAN DI SINI: Samakan 'name' dengan state 'formData' --- */}
                    <FormField label="Nama Proyek (wajib)" error={projectNameError}>
                        <FormInput
                            type="text" name="projectName" value={formData.projectName}
                            onChange={handleFormChange} placeholder="Contoh: Pembangunan Ruko 2 Lantai"
                            error={projectNameError}
                        />
                    </FormField>
                    <FormField label="Nama Pelanggan">
                        <FormInput
                            type="text" name="customerName" value={formData.customerName}
                            onChange={handleFormChange} placeholder="Contoh: Bpk. Andi"
                        />
                    </FormField>
                    <FormField label="Lokasi Proyek">
                        <FormInput
                            type="text" name="location" value={formData.location}
                            onChange={handleFormChange} placeholder="Contoh: Jl. Merdeka No. 10, Jakarta"
                        />
                    </FormField>
                    <FormField label="Nilai Kontrak Proyek (Rp)" error={priceError}>
                        <FormInput
                            type="number" name="projectPrice" value={formData.projectPrice}
                            onChange={handleFormChange} placeholder="Contoh: 500000000"
                            error={priceError}
                        />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <FormField label="Tanggal Mulai">
                            <FormInput type="date" name="startDate" value={formData.startDate} onChange={handleFormChange} error={dateError} />
                        </FormField>
                        <FormField label="Tanggal Tenggat">
                            <FormInput type="date" name="dueDate" value={formData.dueDate} onChange={handleFormChange} error={dateError} />
                        </FormField>
                    </div>
                     {dateError && (
                        <p className="text-sm text-red-600 text-center -mt-2">{dateError}</p>
                    )}
                </div>
                
                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-industrial-gray-light text-right space-x-3">
                    <button
                        onClick={handleClose}
                        className="px-5 py-2 text-sm font-medium text-industrial-dark bg-industrial-gray-light/50 border border-industrial-gray-light rounded-md hover:bg-industrial-gray-light"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || dateError || projectNameError || priceError} // <-- Tambahkan validasi di tombol
                        className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold text-white bg-industrial-accent rounded-md hover:bg-industrial-accent-dark disabled:bg-industrial-gray disabled:cursor-not-allowed shadow-sm"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin mr-2"/> : <Save size={18} className="mr-2"/>}
                        {isSaving ? 'Menyimpan...' : (editingProjectId ? 'Simpan Perubahan' : 'Buat Proyek')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectFormModal;
