// controllers/materialPriceController.js
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const getUserIdFromRequest = (req) => req.params.userId || req.body.userId || req.query.userId;

exports.getUserMaterialPrices = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });
    try {
        // Join with user_defined_units to get unit_name
        const query = `
            SELECT mp.id, mp.item_name, mp.price, mp.unit_id, udu.unit_name
            FROM material_prices mp
            JOIN user_defined_units udu ON mp.unit_id = udu.id
            WHERE mp.user_id = ?
            ORDER BY mp.item_name ASC
        `;
        const [prices] = await pool.query(query, [userId]);
        // Adapt to match frontend expectation: { id, name, unit (string), price }
        const formattedPrices = prices.map(p => ({
            id: p.id,
            name: p.item_name,
            unit: p.unit_name, // from the join
            price: parseFloat(p.price) // ensure it's a number
        }));
        res.json(formattedPrices);
    } catch (error) {
        console.error("Error fetching material prices:", error);
        res.status(500).json({ message: "Failed to fetch material prices", error: error.message });
    }
};

exports.addMaterialPrice = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    const { item_name, unit_id, price } = req.body; // unit_id is the FK to user_defined_units

    if (!item_name || !unit_id || price === undefined || price === null) {
        return res.status(400).json({ message: "Item name, unit ID, and price are required." });
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        return res.status(400).json({ message: "Invalid price amount."});
    }

    const newPriceId = uuidv4();
    try {
        const [existing] = await pool.query(
            'SELECT id FROM material_prices WHERE user_id = ? AND item_name = ? AND unit_id = ?',
            [userId, item_name.trim(), unit_id]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: `Price for "${item_name.trim()}" with the selected unit already exists.` });
        }

        await pool.query(
            'INSERT INTO material_prices (id, user_id, item_name, unit_id, price) VALUES (?, ?, ?, ?, ?)',
            [newPriceId, userId, item_name.trim(), unit_id, parseFloat(price)]
        );
         // Fetch the joined data to return unit_name
        const [newPriceData] = await pool.query(
            `SELECT mp.id, mp.item_name, mp.price, mp.unit_id, udu.unit_name
             FROM material_prices mp
             JOIN user_defined_units udu ON mp.unit_id = udu.id
             WHERE mp.id = ?`, [newPriceId]
        );

        res.status(201).json({
            id: newPriceData[0].id,
            name: newPriceData[0].item_name,
            unit: newPriceData[0].unit_name,
            price: parseFloat(newPriceData[0].price),
            message: 'Material price added successfully'
        });
    } catch (error) {
        console.error("Error adding material price:", error);
        res.status(500).json({ message: "Failed to add material price", error: error.message });
    }
};

exports.updateMaterialPrice = async (req, res) => {
    const { priceId } = req.params;
    const userId = getUserIdFromRequest(req); // Assuming passed in body for updates or from auth
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    const { item_name, unit_id, price } = req.body;

    if (!item_name || !unit_id || price === undefined || price === null) {
        return res.status(400).json({ message: "Item name, unit ID, and price are required." });
    }
     if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        return res.status(400).json({ message: "Invalid price amount."});
    }

    try {
        // Check if another item with the same name and unit exists for this user (excluding the current one)
        const [existing] = await pool.query(
            'SELECT id FROM material_prices WHERE user_id = ? AND item_name = ? AND unit_id = ? AND id != ?',
            [userId, item_name.trim(), unit_id, priceId]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: `Another price for "${item_name.trim()}" with the selected unit already exists.` });
        }

        const [result] = await pool.query(
            'UPDATE material_prices SET item_name = ?, unit_id = ?, price = ? WHERE id = ? AND user_id = ?',
            [item_name.trim(), unit_id, parseFloat(price), priceId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Material price not found or not owned by user." });
        }
        // Fetch the joined data to return unit_name
        const [updatedPriceData] = await pool.query(
            `SELECT mp.id, mp.item_name, mp.price, mp.unit_id, udu.unit_name
             FROM material_prices mp
             JOIN user_defined_units udu ON mp.unit_id = udu.id
             WHERE mp.id = ?`, [priceId]
        );
        res.json({
            id: updatedPriceData[0].id,
            name: updatedPriceData[0].item_name,
            unit: updatedPriceData[0].unit_name,
            price: parseFloat(updatedPriceData[0].price),
            message: 'Material price updated successfully'
        });
    } catch (error) {
        console.error("Error updating material price:", error);
        res.status(500).json({ message: "Failed to update material price", error: error.message });
    }
};

exports.deleteMaterialPrice = async (req, res) => {
    const { priceId } = req.params;
    const userId = getUserIdFromRequest(req); // Assuming passed as query param for DELETE
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    try {
         // Check if used in definition_components (via material_price_id)
        const [components] = await pool.query('SELECT COUNT(*) as count FROM definition_components WHERE material_price_id = ?', [priceId]);
        // Note: The FK on definition_components is ON DELETE SET NULL for material_price_id.
        // If it was ON DELETE RESTRICT, this check would be more critical before attempting delete.
        // For now, we'll let the database handle it or just inform the user.
        if (components[0].count > 0) {
            // You might want to just warn, or prevent if business logic dictates.
            // The schema allows SET NULL, so deletion will proceed.
            console.warn(`Material price ${priceId} is used in definition components; FK will be set to NULL.`);
        }

        const [result] = await pool.query('DELETE FROM material_prices WHERE id = ? AND user_id = ?', [priceId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Material price not found or not owned by user." });
        }
        res.json({ message: 'Material price deleted successfully' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(400).json({ message: 'Material price is referenced by other records and cannot be deleted (database constraint).' });
        }
        console.error("Error deleting material price:", error);
        res.status(500).json({ message: "Failed to delete material price", error: error.message });
    }
};