// components/Toast.js
import React from 'react';
import { CheckCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ toastMessage }) => {
  if (!toastMessage) return null;

  return (
    <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white z-[100] ${
      toastMessage.type === 'success' ? 'bg-green-600' :
      toastMessage.type === 'info' ? 'bg-sky-600' : 'bg-red-600'
    }`}>
      <div className="flex items-center">
        {toastMessage.type === 'success' ? <CheckCircle size={20} className="mr-2"/> :
         toastMessage.type === 'info' ? <Info size={20} className="mr-2"/> :
         <AlertTriangle size={20} className="mr-2"/>}
        {toastMessage.message}
      </div>
    </div>
  );
};

export default Toast;
