// controllers/cashFlowCategoryController.js
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const getUserIdFromRequest = (req) => req.params.userId || req.body.userId || req.query.userId;

exports.getUserCashFlowCategories = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    try {
        const [categories] = await pool.query('SELECT id, category_name FROM user_defined_cash_flow_categories WHERE user_id = ? ORDER BY category_name ASC', [userId]);
        res.json(categories); // Send array of objects {id, category_name}
    } catch (error) {
        console.error('Error fetching user cash flow categories:', error);
        res.status(500).json({ message: 'Failed to fetch cash flow categories', error: error.message });
    }
};

exports.addCashFlowCategory = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    const { category_name } = req.body;

    if (!category_name || category_name.trim() === '') {
        return res.status(400).json({ message: 'Category name cannot be empty.' });
    }
    const trimmedCategoryName = category_name.trim();
    const newCategoryId = uuidv4();
    try {
        const [existing] = await pool.query('SELECT id FROM user_defined_cash_flow_categories WHERE user_id = ? AND category_name = ?', [userId, trimmedCategoryName]);
        if (existing.length > 0) {
            return res.status(409).json({ message: `Category "${trimmedCategoryName}" already exists.` });
        }

        await pool.query('INSERT INTO user_defined_cash_flow_categories (id, user_id, category_name) VALUES (?, ?, ?)', [newCategoryId, userId, trimmedCategoryName]);
        res.status(201).json({ id: newCategoryId, user_id: userId, category_name: trimmedCategoryName, message: 'Cash flow category added successfully' });
    } catch (error) {
        console.error('Error adding cash flow category:', error);
        res.status(500).json({ message: 'Failed to add cash flow category', error: error.message });
    }
};

exports.deleteCashFlowCategory = async (req, res) => {
    const { categoryId } = req.params;
    const userId = getUserIdFromRequest(req);

    if (!userId) return res.status(401).json({ message: "User ID is required for deletion." });
    if (!categoryId) return res.status(400).json({ message: "Category ID is required." });

    try {
        // Check for usage (MySQL schema has ON DELETE RESTRICT on project_cash_flow_entries.category_id)
        // A simpler check just against the project_cash_flow_entries table for the given user.
         const [entries] = await pool.query(
            `SELECT COUNT(pcf.id) as count
             FROM project_cash_flow_entries pcf
             JOIN projects p ON pcf.project_id = p.id
             WHERE pcf.category_id = ? AND p.user_id = ?`, [categoryId, userId]
        );
        if (entries[0].count > 0) {
            return res.status(400).json({ message: 'Cash flow category is in use by project entries and cannot be deleted.' });
        }

        const [result] = await pool.query('DELETE FROM user_defined_cash_flow_categories WHERE id = ? AND user_id = ?', [categoryId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cash flow category not found or not owned by user.' });
        }
        res.json({ message: 'Cash flow category deleted successfully' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(400).json({ message: 'Category is referenced by other records and cannot be deleted (database constraint).' });
        }
        console.error('Error deleting cash flow category:', error);
        res.status(500).json({ message: 'Failed to delete cash flow category', error: error.message });
    }
};