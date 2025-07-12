// src/contexts/AuthContext.js - VERSI BARU
/* eslint-disable require-jsdoc, camelcase */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import * as apiService from '../services/apiService';

const firebaseConfig = {
    apiKey: "AIzaSyBHNm5cvd-pjcIA2s4X-tCzGymi5CEXDng",
    authDomain: "sistem-rab.firebaseapp.com",
    projectId: "sistem-rab",
    storageBucket: "sistem-rab.firebasestorage.app",
    messagingSenderId: "673801722173",
    appId: "1:673801722173:web:af20b061336004dd818d54"
};

let app;
let auth;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error("Error initializing Firebase Auth:", error);
}

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
        setIsLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setUserId(user.uid);
        try {
          const profileData = await apiService.fetchUserProfile(user.uid);
          setUserRole(profileData.role || 'staff_operasional');
        } catch (error) {
          console.error("Failed to fetch user role:", error);
          setUserRole('staff_operasional');
        }
      } else {
        setUserId(null);
        setUserRole(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  // UBAH: Ganti nama 'login' menjadi 'handleLogin' dan sesuaikan logikanya
  const handleLogin = useCallback(async (email, password) => {
    if (!auth) {
      return { success: false, error: "Layanan otentikasi tidak tersedia." };
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Jika berhasil, AuthProvider sudah menangani state. Cukup kembalikan status sukses.
      return { success: true, error: null };
    } catch (error) {
      // Jika gagal, tangkap error dan kembalikan pesan yang sesuai.
      const errorMessage = error.code === 'auth/invalid-credential' ? 'Email atau password salah.' : 'Gagal login. Silakan coba lagi nanti.';
      return { success: false, error: errorMessage };
    }
  }, []); // Dependency array kosong karena 'auth' stabil

  const logout = useCallback(() => {
    if (!auth) return Promise.reject(new Error("Authentication service not available."));
    return signOut(auth);
  }, []);

  const value = {
    currentUser,
    userId,
    userRole,
    isLoading,
    handleLogin, // <-- Sediakan 'handleLogin'
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}