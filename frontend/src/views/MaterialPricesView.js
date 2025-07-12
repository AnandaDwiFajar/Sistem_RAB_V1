// views/MaterialPricesView.js

import React from 'react';
import { DollarSign, PlusCircle, Edit3, Trash2, Settings, Info, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
// Impor modal tidak lagi diperlukan di sini karena dirender oleh App.js

// PERBAIKAN: Komponen sekarang menerima 'onAddNew' dan 'onEdit' dari props
const MaterialPricesView = ({ pricesManager, setShowManageUnitsModal, onAddNew, onEdit }) => {
    // State dan handler untuk modal (isModalOpen, editingPrice, dll.) sudah DIHAPUS dari sini.
    // Logika tersebut sekarang dikelola oleh App.js

    if (!pricesManager) {
        return (
            <div className="flex items-center justify-center p-8 text-gray-500">
                <Loader2 className="animate-spin mr-2" />
                <span>Memuat manajer harga...</span>
            </div>
        );
    }

    // Destructuring state yang relevan dari pricesManager
    const {
        materialPrices,
        isLoading,
        handleDeletePrice,
    } = pricesManager;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-3xl font-semibold text-sky-600 flex items-center">
                    <DollarSign size={30} className="mr-3"/>Daftar Harga Satuan
                </h2>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowManageUnitsModal(true)}
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md shadow-md flex items-center transition-all duration-150 ease-in-out transform hover:scale-105"
                    >
                        <Settings size={20} className="mr-2"/> Kelola Unit
                    </button>
                    <button
                        onClick={onAddNew} // PERBAIKAN: Panggil prop 'onAddNew'
                        className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md shadow-md flex items-center transition-all duration-150 ease-in-out transform hover:scale-105"
                    >
                        <PlusCircle size={20} className="mr-2"/> Tambah Harga Baru
                    </button>
                </div>
            </div>

            {/* Bagian untuk menampilkan pesan loading atau 'data kosong' (tidak ada perubahan) */}
            {isLoading && materialPrices.length === 0 && (
                <div className="text-center p-4 text-gray-500">Memuat harga...</div>
            )}
            {!isLoading && materialPrices.length === 0 && (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
                    <Info size={24} className="mx-auto mb-2 text-sky-500"/>
                    Belum ada harga material atau jasa. Tambahkan beberapa untuk memulai!
                </div>
            )}

            {/* Tabel Harga */}
            {materialPrices.length > 0 && (
                <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    <table className="w-full min-w-max text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="p-4">Nama</th>
                                <th className="p-4">Unit</th>
                                <th className="p-4">Harga (Rp)</th>
                                <th className="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {materialPrices.map(price => (
                                <tr key={price.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-800 font-medium">{price.name}</td>
                                    <td className="p-4">{price.unit}</td>
                                    <td className="p-4 text-sky-600 font-semibold">{formatCurrency(price.price)}</td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => onEdit(price)} className="p-2 text-yellow-500 hover:text-yellow-600 transition-colors">
                                            <Edit3 size={18}/>
                                        </button>
                                        <button onClick={() => handleDeletePrice(price.id)} className="p-2 text-red-600 hover:text-red-700 transition-colors">
                                            <Trash2 size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* PERBAIKAN: Render komponen modal sudah DIHAPUS dari sini */}
        </div>
    );
};

export default MaterialPricesView;