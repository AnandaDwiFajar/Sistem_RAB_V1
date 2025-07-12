// controllers/materialPriceController.js
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const getUserIdFromRequest = (req) => req.user?.uid || req.params.userId || req.body.userId || req.query.userId;

exports.getUserMaterialPrices = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    try {
        const query = `
            SELECT mp.id, mp.item_name as name, mp.price, mp.unit_id, u.unit_name as unit
            FROM material_prices mp
            JOIN unit_categories u ON mp.unit_id = u.id
            ORDER BY mp.item_name ASC
        `;
        const [prices] = await pool.query(query);
        
        res.json(prices.map(p => ({...p, price: parseFloat(p.price) })));

    } catch (error) {
        console.error("Error fetching material prices:", error);
        res.status(500).json({ message: "Failed to fetch material prices", error: error.message });
    }
};

exports.addMaterialPrice = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    const { name, unit_id, price } = req.body;

    if (!name || !unit_id || price === undefined) {
        return res.status(400).json({ message: "Nama material, unit dan harga harus diisi!" });
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        return res.status(400).json({ message: "Jumlah harga tidak valid." });
    }

    const newPriceId = uuidv4();
    try {
        const [existing] = await pool.query(
            'SELECT id FROM material_prices WHERE item_name = ? AND unit_id = ?',
            [name.trim(), unit_id]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: `Harga untuk "${name.trim()}" dengan unit yang dipilih sudah ada.` });
        }

        await pool.query(
            'INSERT INTO material_prices (id, user_id, item_name, unit_id, price) VALUES (?, ?, ?, ?, ?)',
            [newPriceId, userId, name.trim(), unit_id, parseFloat(price)]
        );

        const [newPriceData] = await pool.query(
           `SELECT mp.id, mp.item_name as name, mp.price, mp.unit_id, u.unit_name as unit
            FROM material_prices mp
            JOIN unit_categories u ON mp.unit_id = u.id
            WHERE mp.id = ?`, [newPriceId]
        );

        res.status(201).json({
            id: newPriceData[0].id,
            name: newPriceData[0].name,
            unit: newPriceData[0].unit,
            unit_id: newPriceData[0].unit_id,
            price: parseFloat(newPriceData[0].price),
        });
    } catch (error) {
        console.error("Error adding material price:", error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ message: "Unit yang dipilih tidak valid atau tidak ada." });
        }
        res.status(500).json({ message: "Failed to add material price", error: error.message });
    }
};


exports.updateMaterialPrice = async (req, res) => {
    const { priceId } = req.params;
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    const { name, unit_id, price } = req.body;

    if (!name || !unit_id || price === undefined) {
        return res.status(400).json({ message: "Nama material, unit dan harga harus diisi!" });
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        return res.status(400).json({ message: "Jumlah harga tidak valid."});
    }

    try {
        const [existing] = await pool.query(
            'SELECT id FROM material_prices WHERE item_name = ? AND unit_id = ? AND id != ?',
            [name.trim(), unit_id, priceId]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: `Harga lain untuk "${name.trim()}" dengan unit yang dipilih sudah ada.` });
        }
        
        const [result] = await pool.query(
            'UPDATE material_prices SET item_name = ?, unit_id = ?, price = ? WHERE id = ?',
            [name.trim(), unit_id, parseFloat(price), priceId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Harga material tidak ditemukan atau bukan milik Anda." });
        }

        const [updatedPriceData] = await pool.query(
           `SELECT mp.id, mp.item_name as name, mp.price, mp.unit_id, u.unit_name as unit
            FROM material_prices mp
            JOIN unit_categories u ON mp.unit_id = u.id
            WHERE mp.id = ?`, [priceId]
        );

        res.json({
            id: updatedPriceData[0].id,
            name: updatedPriceData[0].name,
            unit: updatedPriceData[0].unit,
            unit_id: updatedPriceData[0].unit_id,
            price: parseFloat(updatedPriceData[0].price),
        });
    } catch (error) {
        console.error("Error updating material price:", error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ message: "Unit yang dipilih tidak valid atau tidak ada." });
        }
        res.status(500).json({ message: "Failed to update material price", error: error.message });
    }
};


exports.deleteMaterialPrice = async (req, res) => {
    const { priceId } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM material_prices WHERE id = ? ', [priceId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Harga material tidak ditemukan atau bukan milik Anda." });
        }
        res.json({ message: 'Harga material berhasil dihapus' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(400).json({ message: 'Harga material ini digunakan di data lain dan tidak bisa dihapus.' });
        }
        console.error("Error deleting material price:", error);
        res.status(500).json({ message: "Gagal menghapus harga material", error: error.message });
    }
};
