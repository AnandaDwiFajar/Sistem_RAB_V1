// components/modals/ManageWorkItemCategoriesModal.js
import React from 'react';
import { PlusCircle, Trash2, XCircle } from 'lucide-react';

const ManageWorkItemCategoriesModal = ({
  showManageCategoriesModal,
  setShowManageCategoriesModal,
  newCategoryName,
  setNewCategoryName,
  handleAddNewWorkItemCategory,
  userWorkItemCategories,
  handleDeleteWorkItemCategory,
}) => {
  if (!showManageCategoriesModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[95] p-4">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[70vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sky-400">Manage Work Item Categories</h3>
          <button onClick={() => setShowManageCategoriesModal(false)} className="p-1 text-slate-400 hover:text-white">
            <XCircle size={24}/>
          </button>
        </div>
        <div className="mb-4 flex space-x-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            className="flex-grow p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
          />
          <button
            onClick={handleAddNewWorkItemCategory}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center"
          >
            <PlusCircle size={18} className="mr-2"/> Add
          </button>
        </div>
        <div className="overflow-y-auto flex-grow space-y-2 pr-1">
          {userWorkItemCategories.length === 0 && <p className="text-slate-400 text-center">No categories yet.</p>}
          {userWorkItemCategories.sort((a,b) => a.category_name.localeCompare(b.category_name)).map(catObj => (
            <div key={catObj.id} className="flex justify-between items-center p-2 bg-slate-700 rounded-md">
              <span className="text-white">{catObj.category_name}</span>
              <button onClick={() => handleDeleteWorkItemCategory(catObj)} className="p-1 text-red-500 hover:text-red-400">
                <Trash2 size={16}/>
              </button>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-slate-700 text-right">
          <button
            onClick={() => setShowManageCategoriesModal(false)}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageWorkItemCategoriesModal;
