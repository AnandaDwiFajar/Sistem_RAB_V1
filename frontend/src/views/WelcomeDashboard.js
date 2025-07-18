import React from 'react';

const WelcomeDashboard = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50 text-center">
            <h1 className="text-4xl font-bold text-industrial-dark mb-4">Selamat Datang!</h1>
            <p className="text-lg text-industrial-gray-dark">
                Pilih proyek dari sidebar untuk memulai, atau buat proyek baru.
            </p>
        </div>
    );
};

export default WelcomeDashboard;
