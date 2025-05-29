// components/MaterialPricesView.js
import { DollarSign, PlusCircle, Edit3, Trash2, Save, Settings, Info, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { OTHER_UNIT_MARKER } from '../utils/constants';

const MaterialPricesView = ({
  showPriceForm,
  setShowPriceForm,
  editingPrice,
  setEditingPrice,
  priceFormData,
  handlePriceFormChange,
  handleSavePrice,
  isSavingPrice,
  materialPrices,
  isLoading,
  handleEditPrice,
  handleDeletePrice,
  userUnits,
  setPriceFormData,
  unitSelectionMode,
  setShowManageUnitsModal,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-sky-400 flex items-center">
          <DollarSign size={30} className="mr-3"/>Material & Labor Prices
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowManageUnitsModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shadow-md flex items-center transition-all duration-150 ease-in-out transform hover:scale-105"
          >
            <Settings size={20} className="mr-2"/> Manage Units
          </button>
          <button
            onClick={() => {
              setShowPriceForm(!showPriceForm);
              setEditingPrice(null);
              const firstUnit = userUnits.length > 0 ? userUnits[0] : {id: ''};
              setPriceFormData({ name: '', unitId: firstUnit.id, customUnitName: '', price: '' });
              // setUnitSelectionMode('select'); // This is handled by handlePriceFormChange or useEffect
            }}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md shadow-md flex items-center transition-all duration-150 ease-in-out transform hover:scale-105"
          >
            <PlusCircle size={20} className="mr-2"/> {showPriceForm ? 'Cancel' : 'Add New Price'}
          </button>
        </div>
      </div>

      {showPriceForm && (
        <div className="p-6 bg-slate-700 rounded-lg shadow-lg space-y-4 animate-fadeIn">
          <h3 className="text-xl font-medium text-white">{editingPrice ? 'Edit Price' : 'Add New Price Item'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              name="name"
              value={priceFormData.name}
              onChange={handlePriceFormChange}
              placeholder="Item Name (e.g., Semen Portland)"
              className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none"
            />
            <div>
              <select
                name="unitSelector" // Changed from unitId to unitSelector to match handler
                value={unitSelectionMode === 'custom' ? OTHER_UNIT_MARKER : priceFormData.unitId}
                onChange={handlePriceFormChange}
                className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none w-full"
              >
                <option value="">-- Select Unit --</option>
                {userUnits.sort((a,b) => a.unit_name.localeCompare(b.unit_name)).map(u => <option key={u.id} value={u.id}>{u.unit_name}</option>)}
                <option value={OTHER_UNIT_MARKER}>Other (Specify)</option>
              </select>
              {unitSelectionMode === 'custom' && (
                <input
                  type="text"
                  name="customUnitName"
                  value={priceFormData.customUnitName}
                  onChange={handlePriceFormChange}
                  placeholder="Specify Unit Name"
                  className="mt-2 p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none w-full"
                />
              )}
            </div>
            <input
              type="number"
              name="price"
              value={priceFormData.price}
              onChange={handlePriceFormChange}
              placeholder="Price (Rp)"
              min="0"
              className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => { setShowPriceForm(false); setEditingPrice(null); }}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePrice}
              disabled={isSavingPrice}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center transition-colors disabled:opacity-50"
            >
              <Save size={18} className="mr-2"/>
              {isSavingPrice ? (editingPrice ? 'Saving...' : 'Adding...') : (editingPrice ? 'Save Changes' : 'Add Price')}
            </button>
          </div>
        </div>
      )}

      {isLoading && materialPrices.length === 0 && !showPriceForm && (
        <div className="text-center p-4 text-slate-400">Loading prices...</div>
      )}
      {!isLoading && materialPrices.length === 0 && !showPriceForm && (
        <div className="p-6 bg-slate-700 rounded-lg text-center text-slate-300">
          <Info size={24} className="mx-auto mb-2 text-sky-500"/>
          No material or labor prices found. Add some to get started!
        </div>
      )}

      {materialPrices.length > 0 && (
        <div className="overflow-x-auto bg-slate-700 rounded-lg shadow-lg">
          <table className="w-full min-w-max text-left text-slate-300">
            <thead className="bg-slate-800 text-slate-400">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Unit</th>
                <th className="p-4">Price (Rp)</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {materialPrices.sort((a,b) => a.name.localeCompare(b.name)).map(price => (
                <tr key={price.id} className="border-b border-slate-600 hover:bg-slate-600/50 transition-colors">
                  <td className="p-4 text-white">{price.name}</td>
                  <td className="p-4">{price.unit}</td>
                  <td className="p-4 text-sky-400">{formatCurrency(price.price)}</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleEditPrice(price)} className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors">
                      <Edit3 size={18}/>
                    </button>
                    <button onClick={() => handleDeletePrice(price.id)} className="p-2 text-red-500 hover:text-red-400 transition-colors">
                      <Trash2 size={18}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MaterialPricesView;
