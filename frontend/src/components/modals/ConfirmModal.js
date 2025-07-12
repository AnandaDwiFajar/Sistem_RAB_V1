// components/modals/ConfirmModal.js
import React from 'react';

// PERBAIKAN: Terima props satu per satu, bukan dalam satu objek
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  // Sekarang pengecekannya langsung ke 'isOpen'
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-700 p-6 rounded-lg shadow-xl max-w-sm w-full">
        {/* Sekarang variabel 'title' dan 'message' bisa langsung digunakan */}
        <h3 className="text-lg font-semibold text-white mb-4">{title || 'Konfirmasi'}</h3>
        <p className="text-slate-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
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