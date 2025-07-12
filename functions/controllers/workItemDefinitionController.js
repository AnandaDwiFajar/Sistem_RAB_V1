// controllers/workItemDefinitionController.js
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const getUserIdFromRequest = (req) => req.params.userId || req.body.userId || req.query.userId;

exports.getUserWorkItemDefinitions = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    try {
        const [baseDefinitions] = await pool.query(
            `SELECT
                wid.id, wid.definition_key, wid.name,
                wid.category_id,
                udwic.category_name,
                wid.calculation_schema_type
            FROM work_item_components wid
            LEFT JOIN work_item_categories udwic ON wid.category_id = udwic.id
            ORDER BY wid.name ASC`,
            [userId]
        );

        if (baseDefinitions.length === 0) {
            return res.json([]);
        }

        const fullDefinitions = await Promise.all(
            baseDefinitions.map(async (def) => {
                const [componentsData] = await pool.query(
                    `SELECT display_name, material_price_id, coefficient, component_type
                     FROM work_items
                     WHERE definition_id = ?`,
                    [def.id]
                );
                const components = componentsData.map(c => ({
                    display_name: c.display_name,
                    material_price_id: c.material_price_id,
                    coefficient: parseFloat(c.coefficient),
                    component_type: c.component_type
                }));
                return { ...def, components: components };
            })
        );
        res.json(fullDefinitions);
    } catch (error) {
        console.error("Error fetching work item definitions:", error);
        res.status(500).json({ message: "Failed to fetch work item definitions", error: error.message });
    }
};

exports.getWorkItemDefinitionById = async (req, res) => {
    const { definitionId } = req.params;
    const userId = getUserIdFromRequest(req);

    if (!userId || !definitionId) {
        return res.status(400).json({ message: "User ID and Definition ID are required." });
    }

    try {
        const [definitionsData] = await pool.query(
            `SELECT
                wid.id, wid.definition_key, wid.name,
                wid.category_id, udwic.category_name,
                wid.calculation_schema_type
            FROM work_item_components wid
            LEFT JOIN work_item_categories udwic ON wid.category_id = udwic.id
            WHERE wid.id = ?`,
            [definitionId, userId]
        );

        if (definitionsData.length === 0) {
            return res.status(404).json({ message: "Work item definition not found or not owned by user." });
        }
        const def = definitionsData[0];
        const [componentsData] = await pool.query(
            `SELECT id, display_name, material_price_id, coefficient, component_type
             FROM work_items
             WHERE definition_id = ?
             ORDER BY display_name ASC`,
            [def.id]
        );
        const components = componentsData.map(c => ({
            display_name: c.display_name,
            material_price_id: c.material_price_id,
            coefficient: parseFloat(c.coefficient),
            component_type: c.component_type
        }));
        const fullDefinition = { ...def, components: components };
        res.json(fullDefinition);
    } catch (error) {
        console.error("Error fetching work item definition by ID:", error);
        res.status(500).json({ message: "Failed to fetch work item definition", error: error.message });
    }
};

exports.addWorkItemDefinition = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });
    
    const {
        name, definition_key, category_id,
        calculation_schema_type, // <<< DESTRUCTURED NEW FIELD
        components 
    } = req.body;

    const isSimpleSchema = !calculation_schema_type || calculation_schema_type === 'SIMPLE_PRIMARY_INPUT';

    if (!name || !definition_key || !category_id) {
        return res.status(400).json({ message: "Name, definition key, and category are required." });
    }

    const newDefinitionId = uuidv4();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            `INSERT INTO work_item_components
             (id, user_id, definition_key, name, category_id, 
              calculation_schema_type)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                newDefinitionId, userId, definition_key, name, category_id,
                calculation_schema_type || 'SIMPLE_PRIMARY_INPUT' // Store default if not provided
            ]
        );

        let savedComponents = [];
        if (components && components.length > 0) {
            for (const comp of components) {
                const newComponentId = uuidv4();
                await connection.query(
                    `INSERT INTO work_items
                     (id, definition_id, display_name, material_price_id, coefficient, component_type)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [newComponentId, newDefinitionId, comp.display_name, comp.material_price_id || null, comp.coefficient, comp.component_type]
                );
                savedComponents.push({
                    display_name: comp.display_name,
                    material_price_id: comp.material_price_id || null,
                    coefficient: parseFloat(comp.coefficient),
                    component_type: comp.component_type
                });
            }
        }
        await connection.commit();

        const [catNameRow] = await connection.query('SELECT category_name FROM work_item_categories WHERE id = ?', [category_id]);

        const fullNewDefinition = {
            id: newDefinitionId,
            user_id: userId,
            definition_key,
            name,
            category_id,
            category_name: catNameRow[0]?.category_name || null,
            calculation_schema_type: calculation_schema_type || 'SIMPLE_PRIMARY_INPUT', // <<< INCLUDE IN RESPONSE
            components: savedComponents
        };
        res.status(201).json(fullNewDefinition);

    } catch (error) {
        await connection.rollback();
        console.error("Error adding work item definition:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Definition key might already exist for this user.' });
        }
        res.status(500).json({ message: "Failed to add work item definition", error: error.message });
    } finally {
        connection.release();
    }
};

exports.updateWorkItemDefinition = async (req, res) => {
    const { definitionId } = req.params;
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    const {
        name, definition_key, category_id,
        calculation_schema_type, // <<< DESTRUCTURED NEW FIELD
        components 
    } = req.body;

    const isSimpleSchema = !calculation_schema_type || calculation_schema_type === 'SIMPLE_PRIMARY_INPUT';

    if (!name || !definition_key || !category_id) {
        return res.status(400).json({ message: "Name, definition key, and category are required." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [updateResult] = await connection.query(
            `UPDATE work_item_components SET
                name = ?, definition_key = ?, category_id = ?,
                calculation_schema_type = ?
             WHERE id = ?`,
            [
                name, definition_key, category_id,
                calculation_schema_type || 'SIMPLE_PRIMARY_INPUT',
                definitionId, userId
            ]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Definition not found or not owned by user." });
        }

        await connection.query('DELETE FROM work_items WHERE definition_id = ?', [definitionId]);
        let updatedComponentsData = [];
        if (components && components.length > 0) {
            for (const comp of components) {
                const newComponentId = uuidv4();
                await connection.query(
                    `INSERT INTO work_items
                     (id, definition_id, display_name, material_price_id, coefficient, component_type)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [newComponentId, definitionId, comp.display_name, comp.material_price_id || null, comp.coefficient, comp.component_type]
                );
                updatedComponentsData.push({
                    display_name: comp.display_name,
                    material_price_id: comp.material_price_id || null,
                    coefficient: parseFloat(comp.coefficient),
                    component_type: comp.component_type
                });
            }
        }
        await connection.commit();

        const [catNameRow] = await connection.query('SELECT category_name FROM work_item_categories WHERE id = ?', [category_id]);
        const fullUpdatedDefinition = {
            id: definitionId,
            user_id: userId,
            definition_key,
            name,
            category_id,
            category_name: catNameRow[0]?.category_name || null,
            calculation_schema_type: calculation_schema_type || 'SIMPLE_PRIMARY_INPUT', // <<< INCLUDE IN RESPONSE
            components: updatedComponentsData
        };
        res.json(fullUpdatedDefinition);

    } catch (error) {
        await connection.rollback();
        console.error("Error updating work item definition:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Definition key might conflict with an existing one.' });
        }
        res.status(500).json({ message: "Failed to update work item definition", error: error.message });
    } finally {
        connection.release();
    }
};

// Your deleteWorkItemDefinition function seems okay as it doesn't directly depend on calculation_schema_type
// for its delete logic, but ensure it's complete if you copied it partially before.
exports.deleteWorkItemDefinition = async (req, res) => {
    const { definitionId } = req.params;
    const userId = getUserIdFromRequest(req);
    if (!userId || !definitionId) return res.status(400).json({ message: "User ID and Definition ID required."});

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM work_items WHERE definition_id = ?', [definitionId]);
        const [result] = await connection.query('DELETE FROM work_item_components WHERE id = ?', [definitionId, userId]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Definition not found or not owned by user.' });
        }
        await connection.commit();
        res.json({ message: 'Work item definition deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error("Error deleting work item definition:", error);
        res.status(500).json({ message: "Failed to delete work item definition", error: error.message });
    } finally {
        connection.release();
    }
};