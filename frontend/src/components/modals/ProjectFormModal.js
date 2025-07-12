// src/components/modals/ProjectFormModal.js
import React from 'react';
import { Save, XCircle } from 'lucide-react';

const ProjectFormModal = ({
    showModal,
    handleClose,
    formData,
    handleFormChange,
    handleSubmit,
    isSaving,
    editingProjectId,
    dateError,
    priceError,
    projectNameError
}) => {
    // Jangan render apa pun jika modal tidak seharusnya ditampilkan
    if (!showModal) {
        return null;
    }

    return (
        // Latar belakang gelap (overlay)
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={handleClose} // Menutup modal saat mengklik di luar
        >
            {/* Kontainer Modal */}
            <div 
                className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()} // Mencegah modal tertutup saat mengklik di dalam
            >
                {/* Header Modal */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b">
                    <h3 className="text-xl font-semibold text-sky-600">
                        {editingProjectId ? 'Edit Detail Proyek' : 'Buat Proyek Baru'}
                    </h3>
                    <button onClick={handleClose} className="p-1 text-gray-500 hover:text-gray-700">
                        <XCircle size={24}/>
                    </button>
                </div>

                {/* Body Modal (Form) */}
                {/* [PERBAIKAN] Mengganti 'pr-2' dengan 'pr-4' untuk memberi ruang pada focus ring */}
                <div className="overflow-y-auto space-y-4 p-2">
                    <input
                        type="text" name="projectName" value={formData.projectName}
                        onChange={handleFormChange} placeholder="Nama Proyek (wajib)"
                        className={`w-full p-3 bg-gray-50 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            projectNameError ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-sky-500'
                        }`}
                    />
                    {projectNameError && (
                        <p className="text-sm text-red-600 -mt-2">{projectNameError}</p>
                    )}
                    <input
                        type="text" name="customerName" value={formData.customerName}
                        onChange={handleFormChange} placeholder="Nama Pelanggan"
                        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-shadow"
                    />
                    <input
                        type="text" name="location" value={formData.location}
                        onChange={handleFormChange} placeholder="Lokasi Proyek"
                        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-shadow"
                    />
                    <input
                        type="text" // Ubah ke "text" untuk kontrol penuh
                        inputMode="numeric" // Tampilkan keyboard numerik di mobile
                        pattern="[0-9]*" // Bantuan tambahan untuk browser
                        name="projectPrice"
                        value={formData.projectPrice}
                        onChange={handleFormChange}
                        placeholder="Harga Proyek (Contoh: 50000000)"
                        className={`w-full p-3 bg-gray-50 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            priceError ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-sky-500'
                        }`}
                    />
                    {priceError && (
                        <p className="text-sm text-red-600 -mt-2">{priceError}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal Mulai</label>
                            <input
                                type="date" name="startDate" value={formData.startDate}
                                onChange={handleFormChange}
                                className={`w-full p-3 bg-gray-50 border rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                    dateError ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-sky-500'
                                }`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal Tenggat</label>
                            <input
                                type="date" name="dueDate" value={formData.dueDate}
                                onChange={handleFormChange}
                                className={`w-full p-3 bg-gray-50 border rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                    dateError ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-sky-500'
                                }`}
                            />
                        </div>
                    </div>
                    {dateError && (
                        <p className="text-sm text-red-600 -mt-2">{dateError}</p>
                    )}
                </div>
                
                {/* Footer Modal (Tombol Aksi) */}
                <div className="mt-6 pt-4 border-t text-right space-x-3">
                    <button
                        onClick={handleClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:opacity-50"
                    >
                        <Save size={18} className="mr-2"/>
                        {isSaving ? 'Menyimpan...' : (editingProjectId ? 'Simpan Perubahan' : 'Buat Proyek')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectFormModal;
