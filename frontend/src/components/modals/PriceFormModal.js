import React from 'react';
import { Save, Loader2, XCircle } from 'lucide-react';

// Reusable form components (tidak berubah)
const FormField = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-industrial-dark mb-1">{label}</label>
        {children}
    </div>
);
const FormInput = (props) => (
    <input {...props} className="w-full p-3 bg-white border border-industrial-gray-light rounded-md text-industrial-dark placeholder-industrial-gray focus:outline-none focus:ring-2 focus:ring-industrial-accent" />
);
const FormSelect = ({ children, ...props }) => (
    <select {...props} className="w-full p-3 bg-white border border-industrial-gray-light rounded-md text-industrial-dark focus:outline-none focus:ring-2 focus:ring-industrial-accent">
        {children}
    </select>
);


const PriceFormModal = ({ isOpen, onClose, editingPrice, isSaving, pricesManager }) => {
    const {
        priceFormData,
        handlePriceFormChange,
        handleSavePrice,
        handleUpdatePrice, // <-- 1. Ambil fungsi update dari props
        userUnits,
    } = pricesManager;

    if (!isOpen) return null;

    // --- PERBAIKAN UTAMA DI SINI ---
    const handleSaveClick = async () => {
        // 2. Cek apakah sedang dalam mode edit atau tidak
        const success = editingPrice ? await handleUpdatePrice(editingPrice) : await handleSavePrice();

        if (success) {
            onClose(); // Tutup modal jika operasi berhasil
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={onClose}>
            <div className="bg-industrial-light p-6 rounded-lg shadow-2xl w-full max-w-lg flex flex-col border border-industrial-gray-light" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-industrial-gray-light">
                    <h3 className="text-xl font-bold text-industrial-accent">
                        {editingPrice ? 'Edit Harga' : 'Tambah Harga Baru'}
                    </h3>
                    <button onClick={onClose} className="p-1 text-industrial-gray-dark hover:text-industrial-dark">
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="space-y-4">
                    <FormField label="Nama Item (Bahan/Jasa)">
                        <FormInput
                            type="text"
                            name="name"
                            value={priceFormData.name}
                            onChange={handlePriceFormChange}
                            placeholder="Contoh: Semen Portland, Pasir, Jasa Tukang"
                        />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Unit">
                            <FormSelect
                                name="unitId"
                                value={priceFormData.unitId}
                                onChange={handlePriceFormChange}
                            >
                                <option value="">-- Pilih Unit --</option>
                                {userUnits && userUnits.map(u => <option key={u.id} value={u.id}>{u.unit_name}</option>)}
                            </FormSelect>
                        </FormField>
                        <FormField label="Harga (Rp)">
                            <FormInput
                                type="number"
                                name="price"
                                value={priceFormData.price}
                                onChange={handlePriceFormChange}
                                placeholder="Harga dalam Rupiah"
                                min="0"
                            />
                        </FormField>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-industrial-gray-light text-right space-x-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-industrial-dark bg-industrial-gray-light/50 border border-industrial-gray-light rounded-md hover:bg-industrial-gray-light">
                        Batal
                    </button>
                    <button
                        onClick={handleSaveClick}
                        disabled={isSaving}
                        className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold text-white bg-industrial-accent rounded-md hover:bg-industrial-accent-dark disabled:bg-industrial-gray disabled:cursor-not-allowed shadow-sm"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin mr-2"/> : <Save size={18} className="mr-2"/>}
                        {isSaving ? 'Menyimpan...' : (editingPrice ? 'Simpan Perubahan' : 'Tambah Harga')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PriceFormModal;