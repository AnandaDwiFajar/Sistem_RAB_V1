// src/components/LoginPage.js
import React, { useState } from 'react';
import { Lock, Mail, LogIn, Loader2 } from 'lucide-react'; // Example icons

const LoginPage = ({ onLogin, loginError, isLoggingIn }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) {
            // Basic validation, or rely on onLogin to handle it
            return;
        }
        onLogin(email, password);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-100">
            <div className="p-8 bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
                <h1 className="text-3xl font-bold text-sky-500 mb-8 text-center">
                    Login to Budget Planner
                </h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-slate-300 mb-1"
                        >
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={18} className="text-slate-500" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 pl-10 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
                                placeholder="you@example.com"
                                disabled={isLoggingIn}
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-slate-300 mb-1"
                        >
                            Password
                        </label>
                        <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-slate-500" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 pl-10 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
                                placeholder="••••••••"
                                disabled={isLoggingIn}
                            />
                        </div>
                    </div>

                    {loginError && (
                        <p className="text-sm text-red-400 text-center">{loginError}</p>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full flex items-center justify-center px-4 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-md shadow-md transition-colors duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoggingIn ? (
                                <Loader2 size={20} className="animate-spin mr-2" />
                            ) : (
                                <LogIn size={20} className="mr-2" />
                            )}
                            {isLoggingIn ? 'Logging in...' : 'Login'}
                        </button>
                    </div>
                </form>
                {/* You can add links for Sign Up or Forgot Password here later */}
            </div>
        </div>
    );
};

export default LoginPage;