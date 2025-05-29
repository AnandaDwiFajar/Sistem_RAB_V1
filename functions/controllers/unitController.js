// controllers/unitController.js
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Helper to simulate auth - REMOVE THIS IN PRODUCTION
const getUserIdFromRequest = (req) => req.params.userId || req.body.userId || req.query.userId;


exports.getUserUnits = async (req, res) => {
    const userId = getUserIdFromRequest(req); // TODO: Get userId from authenticated session/token
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    try {
        const [units] = await pool.query('SELECT id, unit_name FROM user_defined_units WHERE user_id = ? ORDER BY unit_name ASC', [userId]);
        res.json(units); // Send array of objects {id, unit_name}
    } catch (error) {
        console.error('Error fetching user units:', error);
        res.status(500).json({ message: 'Failed to fetch units', error: error.message });
    }
};

exports.addUnit = async (req, res) => {
    const userId = getUserIdFromRequest(req); // TODO: Get userId from authenticated session/token
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    const { unit_name } = req.body;

    if (!unit_name || unit_name.trim() === '') {
        return res.status(400).json({ message: 'Unit name cannot be empty.' });
    }
    const trimmedUnitName = unit_name.trim();
    const newUnitId = uuidv4();
    try {
        const [existing] = await pool.query('SELECT id FROM user_defined_units WHERE user_id = ? AND unit_name = ?', [userId, trimmedUnitName]);
        if (existing.length > 0) {
            return res.status(409).json({ message: `Unit "${trimmedUnitName}" already exists.` });
        }

        await pool.query('INSERT INTO user_defined_units (id, user_id, unit_name) VALUES (?, ?, ?)', [newUnitId, userId, trimmedUnitName]);
        res.status(201).json({ id: newUnitId, user_id: userId, unit_name: trimmedUnitName, message: 'Unit added successfully' });
    } catch (error) {
        console.error('Error adding unit:', error);
        res.status(500).json({ message: 'Failed to add unit', error: error.message });
    }
};

exports.deleteUnit = async (req, res) => {
    // Note: In a RESTful design, userId might come from auth, and unitId from path params
    const { unitId } = req.params;
    const userId = getUserIdFromRequest(req); // Example: If passed as query param ?userId=...
                                            // Or, if you design route as /user/:userId/units/:unitId
                                            // Or best, from auth: const userId = req.user.id;

    if (!userId) return res.status(401).json({ message: "User ID is required for deletion." });


    try {
        // Check for usage (simplified - your schema has ON DELETE RESTRICT for some cases)
        const [prices] = await pool.query('SELECT COUNT(*) as count FROM material_prices WHERE unit_id = ? AND user_id = ?', [unitId, userId]);
        const [definitionsPrimary] = await pool.query('SELECT COUNT(*) as count FROM work_item_definitions WHERE primary_input_unit_id = ? AND user_id = ?', [unitId, userId]);

        if (prices[0].count > 0 || definitionsPrimary[0].count > 0) {
            return res.status(400).json({ message: 'Unit is in use by material prices or definitions and cannot be deleted.' });
        }

        const [result] = await pool.query('DELETE FROM user_defined_units WHERE id = ? AND user_id = ?', [unitId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Unit not found or not owned by user.' });
        }
        res.json({ message: 'Unit deleted successfully' });
    } catch (error) {
         if (error.code === 'ER_ROW_IS_REFERENCED_2') { // MySQL specific error for FK violation
             return res.status(400).json({ message: 'Unit is in use by other records and cannot be deleted (database constraint).' });
        }
        console.error('Error deleting unit:', error);
        res.status(500).json({ message: 'Failed to delete unit', error: error.message });
    }
};