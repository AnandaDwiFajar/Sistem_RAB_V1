// components/modals/ConfirmModal.js
import React from 'react';

const ConfirmModal = ({ confirmModal }) => {
  if (!confirmModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-700 p-6 rounded-lg shadow-xl max-w-sm w-full">
        <h3 className="text-lg font-semibold text-white mb-4">Confirm Action</h3>
        <p className="text-slate-300 mb-6">{confirmModal.message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={confirmModal.onCancel}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmModal.onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
