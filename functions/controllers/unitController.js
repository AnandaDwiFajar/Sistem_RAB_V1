// controllers/unitController.js
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Helper ini TIDAK AMAN untuk produksi.
// Di produksi, Anda harus mendapatkan userId dari token otentikasi yang sudah diverifikasi.
const getUserIdFromRequest = (req) => {
    // Jika Anda menggunakan middleware otentikasi Firebase, ini akan menjadi:
    // return req.user.uid; 
    return req.params.userId || req.body.userId || req.query.userId;
};


exports.getUserUnits = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    try {
        const [units] = await pool.query(
            'SELECT id, unit_name FROM unit_categories ORDER BY unit_name ASC'
        );
        res.json(units);
    } catch (error) {
        console.error('Error fetching user units:', error);
        res.status(500).json({ message: 'Failed to fetch units', error: error.message });
    }
};

exports.addUnit = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    const { unit_name } = req.body;
    if (!unit_name || unit_name.trim() === '') {
        return res.status(400).json({ message: 'Unit name cannot be empty.' });
    }
    const trimmedUnitName = unit_name.trim();
    const newUnitId = uuidv4();
    try {
        const [existing] = await pool.query(
            'SELECT id FROM unit_categories WHERE unit_name = ?',
            [trimmedUnitName]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: `Unit "${trimmedUnitName}" already exists.` });
        }

        await pool.query(
            'INSERT INTO unit_categories (id, user_id, unit_name) VALUES (?, ?, ?)',
            [newUnitId, userId, trimmedUnitName]
        );
        res.status(201).json({ id: newUnitId, user_id: userId, unit_name: trimmedUnitName });
    } catch (error) {
        console.error('Error adding unit:', error);
        res.status(500).json({ message: 'Failed to add unit', error: error.message });
    }
};

/**
 * @description Updates an existing unit's name.
 * @route PUT /api/units/:unitId
 */
exports.updateUnit = async (req, res) => {
    const { unitId } = req.params;
    const userId = getUserIdFromRequest(req);
    const { unit_name } = req.body;

    if (!unitId) {
        return res.status(400).json({ message: "Unit ID is required." });
    }
    if (!unit_name || unit_name.trim() === '') {
        return res.status(400).json({ message: 'Unit name cannot be empty.' });
    }
    const trimmedUnitName = unit_name.trim();

    try {
        // 1. Check if the new name already exists for another unit owned by the user
        const [existing] = await pool.query(
            'SELECT id FROM unit_categories WHERE unit_name = ? AND id != ?',
            [trimmedUnitName, unitId]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: `Unit name "${trimmedUnitName}" already exists.` });
        }

        // 2. Perform the update
        const [result] = await pool.query(
            'UPDATE unit_categories SET unit_name = ? WHERE id = ?',
            [trimmedUnitName, unitId]
        );

        // 3. Check if the update was successful
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Unit not found or not owned by user.' });
        }

        // 4. Return the updated unit
        res.json({ id: unitId, user_id: userId, unit_name: trimmedUnitName });

    } catch (error) {
        console.error('Error updating unit:', error);
        res.status(500).json({ message: 'Failed to update unit', error: error.message });
    }
};


exports.deleteUnit = async (req, res) => {
    const { unitId } = req.params;

    if (!unitId) return res.status(400).json({ message: "Unit ID is required." });

    try {
        const [prices] = await pool.query('SELECT COUNT(*) as count FROM material_prices WHERE unit_id = ?', [unitId]);
        const [definitions] = await pool.query('SELECT COUNT(*) as count FROM work_item_components WHERE primary_input_unit_id = ?', [unitId]);

        if (prices[0].count > 0 || definitions[0].count > 0) {
            return res.status(400).json({ message: 'Unit is in use and cannot be deleted.' });
        }

        const [result] = await pool.query(
            'DELETE FROM unit_categories WHERE id = ?',
            [unitId]
        );
        
        // Pengecekan ini sekarang menjadi valid.
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Unit not found or not owned by user.' });
        }
        
        res.json({ message: 'Unit deleted successfully' });
    } catch (error) {
       if (error.code === 'ER_ROW_IS_REFERENCED_2') {
           return res.status(400).json({ message: 'Unit is in use and cannot be deleted (database constraint).' });
       }
        console.error('Error deleting unit:', error);
        res.status(500).json({ message: 'Failed to delete unit', error: error.message });
    }
};
