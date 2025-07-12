import React from 'react';
import { Save, Loader2, X } from 'lucide-react';

const PriceFormModal = ({ isOpen, onClose, editingPrice, isSaving, pricesManager }) => {
    // Ambil semua state form dan handler dari pricesManager
    const {
        priceFormData,
        handlePriceFormChange,
        handleSavePrice,
        handleUpdatePrice,
        unitSelectionMode,
        userUnits,
    } = pricesManager;

    if (!isOpen) return null;

    const handleSaveClick = async () => {
        let success = false;
        if (editingPrice) {
            success = await handleUpdatePrice(editingPrice);
        } else {
            success = await handleSavePrice();
        }

        if (success) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl transform transition-all animate-scaleIn">
                <div className="flex justify-between items-center p-5 border-b border-gray-200">
                    <h3 className="text-xl font-medium text-gray-800">
                        {editingPrice ? 'Edit Harga' : 'Tambah Harga Baru'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Item</label>
                            <input
                                type="text"
                                name="name"
                                value={priceFormData.name}
                                onChange={handlePriceFormChange}
                                placeholder="Cth: Semen Portland, Pasir, Jasa Tukang"
                                className="p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <select
                                name="unitSelector"
                                value={unitSelectionMode === 'custom' ? '' : priceFormData.unitId}
                                onChange={handlePriceFormChange}
                                className="p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none w-full"
                            >
                                {userUnits && userUnits.map(u => <option key={u.id} value={u.id}>{u.unit_name}</option>)}
                            </select>
                        </div>

                        {unitSelectionMode === 'custom' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Unit Baru</label>
                                <input
                                    type="text"
                                    name="customUnitName"
                                    value={priceFormData.customUnitName}
                                    onChange={handlePriceFormChange}
                                    placeholder="Cth: Buah, Meter, Sak"
                                    className="p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none w-full"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={priceFormData.price}
                                    onChange={handlePriceFormChange}
                                    placeholder="Harga dalam Rupiah"
                                    min="0"
                                    className="p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none w-full"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-3 p-5 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSaveClick}
                        disabled={isSaving}
                        className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center justify-center transition-colors disabled:opacity-50 min-w-[150px]"
                    >
                        {isSaving ? <Loader2 size={18} className="mr-2 animate-spin"/> : <Save size={18} className="mr-2"/>}
                        {isSaving ? (editingPrice ? 'Menyimpan...' : 'Menambahkan...') : (editingPrice ? 'Simpan Perubahan' : 'Tambah Harga')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PriceFormModal;