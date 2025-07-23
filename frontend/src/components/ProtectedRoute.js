import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Outlet, useOutletContext } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
    // FIX: Destructure 'userRole', 'userId', dan 'isLoading' secara langsung dari context.
    // 'userData' tidak ada di dalam AuthContext.
    const { userRole, userId, isLoading } = useAuth();
    
    // Ambil context yang diteruskan dari parent route (AppLayout)
    const outletContext = useOutletContext();

    // Tampilkan status loading selagi otentikasi diperiksa
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <span>Memeriksa otorisasi...</span>
            </div>
        );
    }

    // Jika tidak ada user yang login (userId null), arahkan ke halaman login.
    if (!userId) {
        return <Navigate to="/login" replace />;
    }

    // Jika role yang diizinkan ada dan role pengguna tidak termasuk di dalamnya,
    // arahkan pengguna kembali ke halaman utama (dashboard).
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/" replace />;
    }

    // Jika pengguna sudah login dan memiliki role yang sesuai,
    // render route selanjutnya dan TERUSKAN CONTEXT yang sudah diterima.
    return <Outlet context={outletContext} />;
};

export default ProtectedRoute;
