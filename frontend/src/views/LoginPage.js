// src/views/LoginPage.js
import React, { useState } from 'react';
import { Lock, Mail, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
    const { handleLogin } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localLoginError, setLocalLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setLocalLoginError('Email dan password wajib diisi.');
            return;
        }
        setLocalLoginError('');
        setIsLoggingIn(true);
        const result = await handleLogin(email, password);
        if (!result.success) {
            setLocalLoginError(result.error);
        }
        setIsLoggingIn(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-industrial-light font-sans">
            <div className="p-10 bg-industrial-white rounded-lg shadow-2xl w-full max-w-md border border-industrial-gray-light">
                <h1 className="text-3xl font-bold text-industrial-accent mb-2 text-center">
                    RAB Pro
                </h1>
                <p className="text-industrial-gray text-center mb-8">Login untuk Melanjutkan</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-industrial-dark mb-1">
                            Alamat Email
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={18} className="text-industrial-gray" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 pl-10 bg-white border border-industrial-gray-light rounded-md text-industrial-dark placeholder-industrial-gray focus:outline-none focus:ring-2 focus:ring-industrial-accent focus:border-transparent transition-all"
                                placeholder="anda@contoh.com"
                                disabled={isLoggingIn}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-industrial-dark mb-1">
                            Kata Sandi
                        </label>
                        <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-industrial-gray" />
                            </div>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 pl-10 bg-white border border-industrial-gray-light rounded-md text-industrial-dark placeholder-industrial-gray focus:outline-none focus:ring-2 focus:ring-industrial-accent focus:border-transparent transition-all"
                                placeholder="••••••••"
                                disabled={isLoggingIn}
                            />
                        </div>
                    </div>

                    {localLoginError && (
                        <p className="text-sm text-red-600 text-center">{localLoginError}</p>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full flex items-center justify-center px-4 py-3 bg-industrial-accent text-white font-bold rounded-md hover:bg-industrial-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-industrial-white focus:ring-industrial-accent transition-colors disabled:bg-industrial-gray disabled:cursor-not-allowed"
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