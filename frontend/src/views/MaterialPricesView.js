import React from 'react';
import { DollarSign, PlusCircle, Edit3, Trash2, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const MaterialPricesView = ({ materialPricesManager, onAddNew, onEdit }) => {
    // Destructure properties from materialPricesManager with default values
    const { 
        materialPrices = [], 
        isLoading = true, 
        handleDeletePrice,
        handleUpdatePrice,
        handleEditPrice
    } = materialPricesManager || {};

    // Show a loading spinner if the manager is not yet available or if it's loading
    if (isLoading && materialPrices.length === 0) {
        return (
            <div className="flex items-center justify-center p-8 text-industrial-gray">
                <Loader2 className="animate-spin mr-2" />
                <span>Memuat data harga...</span>
            </div>
        );
    }
    
    const NoDataDisplay = () => (
        <div className="text-center py-16 px-6 border-2 border-dashed border-industrial-gray-light rounded-lg">
            <DollarSign size={48} className="mx-auto text-industrial-gray" />
            <h3 className="mt-4 text-xl font-semibold text-industrial-dark">Belum Ada Data Harga</h3>
            <p className="mt-2 text-industrial-gray-dark">Tambahkan harga bahan atau jasa untuk memulai perhitungan RAB Anda.</p>
            <div className="mt-6">
                <button
                    onClick={onAddNew}
                    className="flex items-center mx-auto px-4 py-2 bg-industrial-accent text-white font-semibold rounded-md hover:bg-industrial-accent-dark shadow-sm transition-colors"
                >
                    <PlusCircle size={18} className="mr-2"/> Tambah Harga Baru
                </button>
            </div>
        </div>
    );

    const PricesTable = () => (
        <div className="overflow-x-auto bg-white border border-industrial-gray-light rounded-lg shadow-sm">
            <table className="w-full min-w-max text-left">
                <thead className="bg-gray-50 border-b border-industrial-gray-light">
                    <tr>
                        <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider">Nama</th>
                        <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider">Unit</th>
                        <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider text-right">Harga (Rp)</th>
                        <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="text-industrial-dark">
                    {materialPrices.map(price => (
                        <tr key={price.id} className="border-b border-industrial-gray-light hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 font-medium">{price.name}</td>
                            <td className="p-4 text-industrial-gray-dark">{price.unit}</td>
                            <td className="p-4 font-semibold text-right">{formatCurrency(price.price)}</td>
                            <td className="p-4 text-right">
                                <button onClick={() => onEdit(price)} className="p-2 text-industrial-gray-dark hover:text-industrial-accent transition-colors" title="Edit Harga">
                                    <Edit3 size={16}/>
                                </button>
                                <button onClick={() => handleDeletePrice(price.id)} className="p-2 text-red-500 hover:text-red-700 transition-colors" title="Hapus Harga">
                                    <Trash2 size={16}/>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="pb-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-industrial-dark">Harga Material</h1>
                <button
                    onClick={onAddNew}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-industrial-accent rounded-md hover:bg-industrial-accent-dark shadow-sm transition-colors"
                >
                    <PlusCircle size={18} className="mr-2"/> Tambah Harga Baru
                </button>
            </div>
            
            {!isLoading && materialPrices.length === 0 ? <NoDataDisplay /> : <PricesTable />}
        </div>
    );
};

export default MaterialPricesView;