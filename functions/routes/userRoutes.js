const pool = require('../config/db');
const express = require('express');
const router = express.Router();

// Nanti, Anda akan mengimpor controller dari file terpisah
// const userController = require('../controllers/userController');

// Dummy controller function untuk tes
const getUserProfile = async (req, res) => {
    const { userId } = req.params;
    console.log(`[BACKEND] Mencari profil di DB untuk user: ${userId}`);

    try {
        // Ganti 'users' dengan nama tabel pengguna Anda jika berbeda
        const [rows] = await pool.query(
            'SELECT id, role FROM users WHERE id = ?', 
            [userId]
        );

        if (rows.length === 0) {
            console.error(`[BACKEND] Pengguna dengan ID ${userId} tidak ditemukan di database.`);
            return res.status(404).json({ message: "Profil pengguna tidak ditemukan di database aplikasi." });
        }
        
        const userProfile = rows[0];
        
        console.log('[BACKEND] Profil pengguna ditemukan:', userProfile);

        if (userProfile.role) {
            console.log(`[BACKEND] Peran sebelum normalisasi: '${userProfile.role}'`);
            userProfile.role = userProfile.role.toLowerCase().replace('_', ' ');
            console.log(`[BACKEND] Peran setelah normalisasi: '${userProfile.role}'`);
        } else {
            console.log('[BACKEND] Pengguna tidak memiliki peran yang ditentukan.');
        }
        
        console.log('DATA PROFIL YANG AKAN DIKIRIM KE FRONTEND:', userProfile);
        
        res.status(200).json(userProfile);

    } catch (error) {
        console.error("Error di controller getUserProfile:", error);
        res.status(500).json({ message: "Gagal mengambil profil pengguna dari database." });
    }
};

// DEFINISI ROUTE: GET /api/users/profile/:userId
// Ini adalah endpoint yang akan menangani permintaan dari frontend
router.get('/profile/:userId', getUserProfile);


module.exports = router;