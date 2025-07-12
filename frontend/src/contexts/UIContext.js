// src/contexts/UIContext.js
import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import Toast from '../components/Toast';
import ConfirmModal from '../components/modals/ConfirmModal';

const UIContext = createContext();
export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
    const [toastMessage, setToastMessage] = useState(null);
    // Inisialisasi state dengan benar
    const [confirmModal, setConfirmModal] = useState({ 
        isOpen: false, 
        title: '', 
        message: '', 
        onConfirm: null, 
        onCancel: null 
    });

    const showToast = useCallback((type, message) => {
        setToastMessage({ type, message });
    }, []);
    

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3500);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    // PERBAIKAN UTAMA: Fungsi sekarang menerima objek { title, message }
    const showConfirm = useCallback(({ title, message }) => new Promise((resolve) => {
        setConfirmModal({
            isOpen: true,
            title: title,
            message: message,
            onConfirm: () => { setConfirmModal(s => ({...s, isOpen: false})); resolve(true); },
            onCancel: () => { setConfirmModal(s => ({...s, isOpen: false})); resolve(false); }
        });
    }), []);

    const value = { showToast, showConfirm };

    return (
        <UIContext.Provider value={value}>
            {children}
            <Toast toastMessage={toastMessage} setToastMessage={setToastMessage} />
            
            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={confirmModal.onCancel}
            />        
            </UIContext.Provider>
    );
};