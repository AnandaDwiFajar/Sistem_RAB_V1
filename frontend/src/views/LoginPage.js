// src/views/LoginPage.js - VERSI FINAL (Mandiri dengan Context)

import React, { useState } from 'react';
import { Lock, Mail, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // 1. Import hook 'useAuth'

// 2. Hapus props onLogin, loginError, dan isLoggingIn dari parameter
const LoginPage = () => {
    // 3. Ambil 'handleLogin' langsung dari context
    const { handleLogin } = useAuth();

    // 4. Komponen ini sekarang mengelola state UI-nya sendiri
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localLoginError, setLocalLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // 5. Ubah handleSubmit menjadi async dan kelola state lokal
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setLocalLoginError('Email dan password wajib diisi.');
            return;
        }

        setLocalLoginError('');
        setIsLoggingIn(true);
        
        // Panggil fungsi login dari context dan tunggu hasilnya
        const result = await handleLogin(email, password);
        
        if (!result.success) {
            // Jika login gagal, tampilkan pesan error dari context
            setLocalLoginError(result.error);
        }
        // Jika login berhasil, AuthContext akan otomatis mengubah state pengguna,
        // dan App.js akan menampilkan halaman utama. Tidak perlu melakukan apa-apa lagi.

        setIsLoggingIn(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-800">
            <div className="p-8 bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
                <h1 className="text-3xl font-bold text-sky-600 mb-8 text-center">
                    Login ke Perencana Anggaran
                </h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Alamat Email
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={18} className="text-gray-400" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 pl-10 bg-gray-50 border border-gray-300 rounded-md ..."
                                placeholder="anda@contoh.com"
                                disabled={isLoggingIn} // Menggunakan state isLoggingIn lokal
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Kata Sandi
                        </label>
                        <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-gray-400" />
                            </div>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 pl-10 bg-gray-50 border border-gray-300 rounded-md ..."
                                placeholder="••••••••"
                                disabled={isLoggingIn} // Menggunakan state isLoggingIn lokal
                            />
                        </div>
                    </div>

                    {/* Menampilkan error dari state lokal */}
                    {localLoginError && (
                        <p className="text-sm text-red-600 text-center">{localLoginError}</p>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoggingIn} // Menggunakan state isLoggingIn lokal
                            className="w-full flex items-center justify-center px-4 py-3 bg-sky-500 ..."
                        >
                            {isLoggingIn ? (
                                <Loader2 size={20} className="animate-spin mr-2" />
                            ) : (
                                <LogIn size={20} className="mr-2" />
                            )}
                            {isLoggingIn ? 'Masuk...' : 'Login'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;