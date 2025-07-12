// controllers/cashFlowCategoryController.js
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const getUserIdFromRequest = (req) => req.params.userId || req.body.userId || req.query.userId;

exports.getUserCashFlowCategories = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    try {
        const [categories] = await pool.query(
            `SELECT id, category_name
             FROM other_cost_categories
             ORDER BY category_name ASC`,
            [userId]
        );
        res.json(categories);
    } catch (error) {
        console.error('Error fetching user cash flow categories:', error);
        res.status(500).json({ message: 'Failed to fetch cash flow categories', error: error.message });
    }
};

exports.addCashFlowCategory = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    const { category_name } = req.body;
    if (!category_name || !category_name.trim()) {
        return res.status(400).json({ message: 'Category name cannot be empty.' });
    }
    const trimmed = category_name.trim();
    const newId = uuidv4();

    try {
        const [existing] = await pool.query(
            `SELECT id
             FROM other_cost_categories
             WHERE category_name = ?`,
            [trimmed]
        );
        if (existing.length) {
            return res.status(409).json({ message: `Category "${trimmed}" already exists.` });
        }

        await pool.query(
            `INSERT INTO other_cost_categories (id, user_id, category_name)
             VALUES (?, ?, ?)`,
            [newId, userId, trimmed]
        );
        res.status(201).json({ id: newId, user_id: userId, category_name: trimmed, message: 'Cash flow category added successfully' });
    } catch (error) {
        console.error('Error adding cash flow category:', error);
        res.status(500).json({ message: 'Failed to add cash flow category', error: error.message });
    }
};

exports.deleteCashFlowCategory = async (req, res) => {
    const { categoryId } = req.params;

    if (!categoryId) return res.status(400).json({ message: "Category ID is required." });

    try {
        // Cek penggunaan di project_transactions
        const [usage] = await pool.query(
            `SELECT COUNT(pt.id) AS count
             FROM project_transactions pt
             JOIN projects p ON pt.project_id = p.id
             WHERE pt.transaction_category_id = ?`,
            [categoryId]
        );
        if (usage[0].count > 0) {
            return res.status(400).json({ message: 'Category is in use and cannot be deleted.' });
        }

        const [result] = await pool.query(
            `DELETE FROM other_cost_categories
             WHERE id = ?`,
            [categoryId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cash flow category not found or not owned by user.' });
        }
        res.json({ message: 'Cash flow category deleted successfully' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'Category is referenced by other records and cannot be deleted.' });
        }
        console.error('Error deleting cash flow category:', error);
        res.status(500).json({ message: 'Failed to delete cash flow category', error: error.message });
    }
};
