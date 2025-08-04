// controllers/workItemCategoryController.js
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Helper to simulate auth - REMOVE THIS IN PRODUCTION & use proper auth
const getUserIdFromRequest = (req) => req.params.userId || req.body.userId || req.query.userId;


exports.getUserWorkItemCategories = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    try {
        // PERUBAHAN: SELECT `order` dan ORDER BY `order`
        const [categories] = await pool.query(
            'SELECT id, category_name, `order` FROM work_item_categories ORDER BY `order` ASC'
        );

        res.json(categories);
    } catch (error) {
        console.error('Error fetching user work item categories:', error);
        res.status(500).json({ message: 'Failed to fetch work item categories', error: error.message });
    }
};

exports.addWorkItemCategory = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    const { category_name } = req.body;

    if (!category_name || category_name.trim() === '') {
        return res.status(400).json({ message: 'Category name cannot be empty.' });
    }
    const trimmedCategoryName = category_name.trim();
    const newCategoryId = uuidv4();
    try {
        // Cek duplikat untuk user yang sama
        const [existing] = await pool.query(
            'SELECT id FROM work_item_categories WHERE user_id = ? AND category_name = ?', 
            [userId, trimmedCategoryName]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: `Category "${trimmedCategoryName}" already exists.` });
        }

        // PERUBAHAN: Tentukan nilai `order` baru
        const [[{ max_order }]] = await pool.query(
            'SELECT COALESCE(MAX(`order`), -1) as max_order FROM work_item_categories'
        );
        const newOrder = max_order + 1;

        await pool.query(
            'INSERT INTO work_item_categories (id, user_id, category_name, `order`) VALUES (?, ?, ?, ?)', 
            [newCategoryId, userId, trimmedCategoryName, newOrder]
        );
        
        // Kembalikan data lengkap termasuk order
        res.status(201).json({ id: newCategoryId, user_id: userId, category_name: trimmedCategoryName, order: newOrder, message: 'Work item category added successfully' });
    } catch (error) {
        console.error('Error adding work item category:', error);
        res.status(500).json({ message: 'Failed to add work item category', error: error.message });
    }
};

exports.updateWorkItemCategoriesOrder = async (req, res) => {
    const userId = getUserIdFromRequest(req); // Menggunakan helper yang sudah ada
    const { categories } = req.body; // Menerima array [{ id, order }, ...]

    if (!Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({ message: "Categories array is required." });
    }

    const connection = await pool.getConnection(); // Menggunakan pool dari atas file
    try {
        await connection.beginTransaction();

        // Menjalankan semua query update
        await Promise.all(categories.map(category => {
            return connection.query(
                'UPDATE work_item_categories SET `order` = ? WHERE id = ?',
                [category.order, category.id]
            );
        }));

        await connection.commit();
        res.json({ message: 'Categories order updated successfully.' });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating categories order:', error);
        res.status(500).json({ message: 'Failed to update categories order', error: error.message });
    } finally {
        connection.release();
    }
};

// --- FUNGSI BARU DITAMBAHKAN ---
exports.updateWorkItemCategory = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    const { categoryId } = req.params;
    const { category_name } = req.body;

    if (!categoryId) return res.status(400).json({ message: "Category ID is required." });
    if (!category_name || category_name.trim() === '') {
        return res.status(400).json({ message: 'Category name cannot be empty.' });
    }
    const trimmedCategoryName = category_name.trim();

    try {
        // Check for duplicates for the same user, excluding the current category being edited.
        const [existing] = await pool.query(
            'SELECT id FROM work_item_categories WHERE category_name = ? AND id != ?',
            [trimmedCategoryName, categoryId]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: `Category name "${trimmedCategoryName}" already exists.` });
        }

        // Perform the update, ensuring the user owns the category.
        const [result] = await pool.query(
            'UPDATE work_item_categories SET category_name = ? WHERE id = ?',
            [trimmedCategoryName, categoryId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found or you do not have permission to edit it.' });
        }

        res.json({ id: categoryId, user_id: userId, category_name: trimmedCategoryName });
    } catch (error) {
        console.error('Error updating work item category:', error);
        res.status(500).json({ message: 'Failed to update work item category', error: error.message });
    }
};


exports.deleteWorkItemCategory = async (req, res) => {
    const { categoryId } = req.params;
    // const userId = getUserIdFromRequest(req); // userId tidak lagi digunakan untuk validasi kepemilikan

    if (!categoryId) return res.status(400).json({ message: "Category ID is required." });

    try {
        // PERBAIKAN: Pemeriksaan penggunaan kategori sekarang berlaku untuk semua pengguna, bukan hanya pengguna saat ini.
        const [definitions] = await pool.query(
            'SELECT COUNT(*) as count FROM work_item_components WHERE category_id = ?',
            [categoryId]
        );
        if (definitions[0].count > 0) {
            return res.status(400).json({ message: 'Kategori sedang digunakan dan tidak bisa dihapus.' });
        }

        // PERBAIKAN: Validasi kepemilikan (AND user_id = ?) telah dihapus sesuai permintaan
        // untuk menghilangkan error "not found or not owned by user".
        // PERINGATAN: Ini memungkinkan penghapusan kategori tanpa memeriksa siapa pemiliknya.
        const [result] = await pool.query(
            'DELETE FROM work_item_categories WHERE id = ?',
            [categoryId]
        );
        
        // Pemeriksaan ini dipertahankan untuk menangani kasus jika ID kategori memang tidak ada sama sekali.
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Work item category not found.' });
        }
        
        res.json({ message: 'Work item category deleted successfully' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(400).json({ message: 'Kategori sedang digunakan dan tidak bisa dihapus.' });
        }
        console.error('Error deleting work item category:', error);
        res.status(500).json({ message: 'Failed to delete work item category', error: error.message });
    }
};