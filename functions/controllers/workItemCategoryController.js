// controllers/workItemCategoryController.js
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Helper to simulate auth - REMOVE THIS IN PRODUCTION & use proper auth
const getUserIdFromRequest = (req) => req.params.userId || req.body.userId || req.query.userId;


exports.getUserWorkItemCategories = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    try {
        const [categories] = await pool.query('SELECT id, category_name FROM user_defined_work_item_categories WHERE user_id = ? ORDER BY category_name ASC', [userId]);

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
        const [existing] = await pool.query('SELECT id FROM user_defined_work_item_categories WHERE user_id = ? AND category_name = ?', [userId, trimmedCategoryName]);
        if (existing.length > 0) {
            return res.status(409).json({ message: `Category "${trimmedCategoryName}" already exists.` });
        }

        await pool.query('INSERT INTO user_defined_work_item_categories (id, user_id, category_name) VALUES (?, ?, ?)', [newCategoryId, userId, trimmedCategoryName]);
        res.status(201).json({ id: newCategoryId, user_id: userId, category_name: trimmedCategoryName, message: 'Work item category added successfully' });
    } catch (error) {
        console.error('Error adding work item category:', error);
        res.status(500).json({ message: 'Failed to add work item category', error: error.message });
    }
};

exports.deleteWorkItemCategory = async (req, res) => {
    const { categoryId } = req.params;
    const userId = getUserIdFromRequest(req); // e.g., from query: req.query.userId

    if (!userId) return res.status(401).json({ message: "User ID is required for deletion." });
    if (!categoryId) return res.status(400).json({ message: "Category ID is required." });

    try {
        // Check for usage (MySQL schema has ON DELETE RESTRICT on work_item_definitions.category_id)
        const [definitions] = await pool.query('SELECT COUNT(*) as count FROM work_item_definitions WHERE category_id = ? AND user_id = ?', [categoryId, userId]);
        if (definitions[0].count > 0) {
            return res.status(400).json({ message: 'Category is in use by work item definitions and cannot be deleted.' });
        }

        const [result] = await pool.query('DELETE FROM user_defined_work_item_categories WHERE id = ? AND user_id = ?', [categoryId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Work item category not found or not owned by user.' });
        }
        res.json({ message: 'Work item category deleted successfully' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(400).json({ message: 'Category is referenced by other records and cannot be deleted (database constraint).' });
        }
        console.error('Error deleting work item category:', error);
        res.status(500).json({ message: 'Failed to delete work item category', error: error.message });
    }
};