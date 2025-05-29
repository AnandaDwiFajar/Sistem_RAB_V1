// controllers/workItemDefinitionController.js
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
// uuidv4 is not used in this specific function, but keep if used elsewhere in file
// const { v4: uuidv4 } = require('uuid');

const getUserIdFromRequest = (req) => req.params.userId || req.body.userId || req.query.userId;



exports.getUserWorkItemDefinitions = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    try {
        // Step 1: Fetch base definitions with necessary IDs and names
        const [baseDefinitions] = await pool.query(
    `SELECT
        wid.id, wid.definition_key, wid.name,
        wid.category_id,
        udwic.category_name,
        wid.primary_input_label, wid.primary_input_nature,
        wid.primary_input_unit_id,
        udu.unit_name AS primary_input_unit_name
     FROM work_item_definitions wid
     LEFT JOIN user_defined_work_item_categories udwic ON wid.category_id = udwic.id
     LEFT JOIN user_defined_units udu ON wid.primary_input_unit_id = udu.id
     WHERE wid.user_id = ?
     ORDER BY wid.name ASC`,
    [userId]
);

        if (baseDefinitions.length === 0) {
            return res.json([]); // Return empty if no definitions found
        }

        // Step 2: For each definition, fetch its components
const fullDefinitions = await Promise.all(
    baseDefinitions.map(async (def) => {
        const [componentsData] = await pool.query(
            `SELECT display_name, material_price_id, coefficient, component_type
             FROM definition_components
             WHERE definition_id = ?`,
            [def.id]
        );

                // Map component data to the structure frontend expects/needs.
                // The frontend's handleOpenTemplateForm adds 'tempId' and 'selectedResourceId'.
                // Backend should provide the persistent data.
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

// Implement getWorkItemDefinitionById, updateWorkItemDefinition, deleteWorkItemDefinition
// updateWorkItemDefinition will also likely need transactions to handle component changes.
// deleteWorkItemDefinition is simpler (cascading delete should handle components if schema is set up for it,
// or manually delete components first).

exports.getWorkItemDefinitionById = async (req, res) => { // Placeholder
    res.status(501).json({ message: "Get Work Item Definition By ID - Not Implemented" });
};
exports.updateWorkItemDefinition = async (req, res) => { // Placeholder
    res.status(501).json({ message: "Update Work Item Definition - Not Implemented" });
};
exports.deleteWorkItemDefinition = async (req, res) => { // Placeholder
    const { definitionId } = req.params;
    const userId = getUserIdFromRequest(req);
     if (!userId || !definitionId) return res.status(400).json({ message: "User ID and Definition ID required."});

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // First delete components associated with this definition
        await connection.query('DELETE FROM definition_components WHERE definition_id = ?', [definitionId]);
        // Then delete the definition itself
        const [result] = await connection.query('DELETE FROM work_item_definitions WHERE id = ? AND user_id = ?', [definitionId, userId]);

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

exports.addWorkItemDefinition = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });
    
    const {
        name, definition_key, category_id,
        primary_input_label, primary_input_nature, primary_input_unit_id,
        components 
    } = req.body;

    if (!name || !definition_key || !category_id || !primary_input_label || !primary_input_nature || !primary_input_unit_id) {
        return res.status(400).json({ message: "All definition fields are required." });
    }

    const newDefinitionId = uuidv4();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            `INSERT INTO work_item_definitions
             (id, user_id, definition_key, name, category_id, primary_input_label, primary_input_nature, primary_input_unit_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [newDefinitionId, userId, definition_key, name, category_id, primary_input_label, primary_input_nature, primary_input_unit_id]
        );

        let savedComponents = [];
        if (components && components.length > 0) {
            for (const comp of components) {
                const newComponentId = uuidv4();
                await connection.query(
                    `INSERT INTO definition_components
                     (id, definition_id, display_name, material_price_id, coefficient, component_type)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [newComponentId, newDefinitionId, comp.display_name, comp.material_price_id || null, comp.coefficient, comp.component_type]
                );
                savedComponents.push({ // Reconstruct for response
                    // id: newComponentId, // Component's own DB id
                    display_name: comp.display_name,
                    material_price_id: comp.material_price_id || null,
                    coefficient: parseFloat(comp.coefficient),
                    component_type: comp.component_type
                });
            }
        }
        await connection.commit();

        // Construct the full definition object to return
        // Fetch category_name and primary_input_unit_name for the response
        const [catNameRow] = await connection.query('SELECT category_name FROM user_defined_work_item_categories WHERE id = ?', [category_id]);
        const [unitNameRow] = await connection.query('SELECT unit_name FROM user_defined_units WHERE id = ?', [primary_input_unit_id]);

        const fullNewDefinition = {
            id: newDefinitionId,
            user_id: userId,
            definition_key,
            name,
            category_id,
            category_name: catNameRow[0]?.category_name || null,
            primary_input_label,
            primary_input_nature,
            primary_input_unit_id,
            primary_input_unit_name: unitNameRow[0]?.unit_name || null,
            components: savedComponents
        };
        res.status(201).json(fullNewDefinition); // Return the full object

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


// Placeholder for updateWorkItemDefinition - this also needs careful implementation for components
exports.updateWorkItemDefinition = async (req, res) => {
    const { definitionId } = req.params;
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    const {
        name, definition_key, category_id,
        primary_input_label, primary_input_nature, primary_input_unit_id,
        components // This will be the new list of components
    } = req.body;

    // Basic validation
    if (!name || !definition_key || !category_id || !primary_input_label || !primary_input_nature || !primary_input_unit_id) {
        return res.status(400).json({ message: "All definition fields are required." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Update the main definition record
        const [updateResult] = await connection.query(
            `UPDATE work_item_definitions SET
                name = ?, definition_key = ?, category_id = ?,
                primary_input_label = ?, primary_input_nature = ?, primary_input_unit_id = ?
             WHERE id = ? AND user_id = ?`,
            [name, definition_key, category_id, primary_input_label, primary_input_nature, primary_input_unit_id, definitionId, userId]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Definition not found or not owned by user." });
        }

        // Handle components: delete existing and insert new ones
        // This is a common strategy; more sophisticated diffing is complex.
        await connection.query('DELETE FROM definition_components WHERE definition_id = ?', [definitionId]);

        let updatedComponentsData = [];
        if (components && components.length > 0) {
            for (const comp of components) {
                const newComponentId = uuidv4();
                await connection.query(
                    `INSERT INTO definition_components
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

        // Fetch category_name and primary_input_unit_name for the response
        const [catNameRow] = await connection.query('SELECT category_name FROM user_defined_work_item_categories WHERE id = ?', [category_id]);
        const [unitNameRow] = await connection.query('SELECT unit_name FROM user_defined_units WHERE id = ?', [primary_input_unit_id]);

        // Construct the full definition object to return
        const fullUpdatedDefinition = {
            id: definitionId,
            user_id: userId,
            definition_key,
            name,
            category_id,
            category_name: catNameRow[0]?.category_name || null,
            primary_input_label,
            primary_input_nature,
            primary_input_unit_id,
            primary_input_unit_name: unitNameRow[0]?.unit_name || null,
            components: updatedComponentsData
        };
        res.json(fullUpdatedDefinition); // Return the full updated object

    } catch (error) {
        await connection.rollback();
        console.error("Error updating work item definition:", error);
        if (error.code === 'ER_DUP_ENTRY') { // For definition_key if it's unique and conflicts
            return res.status(409).json({ message: 'Definition key might conflict with an existing one.' });
        }
        res.status(500).json({ message: "Failed to update work item definition", error: error.message });
    } finally {
        connection.release();
    }
};


exports.deleteWorkItemDefinition = async (req, res) => { // Placeholder (Original was fine)
    const { definitionId } = req.params;
    const userId = getUserIdFromRequest(req);
     if (!userId || !definitionId) return res.status(400).json({ message: "User ID and Definition ID required."});

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // First delete components associated with this definition
        await connection.query('DELETE FROM definition_components WHERE definition_id = ?', [definitionId]);
        // Then delete the definition itself
        const [result] = await connection.query('DELETE FROM work_item_definitions WHERE id = ? AND user_id = ?', [definitionId, userId]);

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


// getWorkItemDefinitionById remains a placeholder for now
exports.getWorkItemDefinitionById = async (req, res) => {
    const { definitionId } = req.params;
    const userId = getUserIdFromRequest(req); // Assuming userId might be part of auth or path

    if (!userId || !definitionId) {
        return res.status(400).json({ message: "User ID and Definition ID are required." });
    }

    try {
        const [definitionsData] = await pool.query(
            `SELECT
                wid.id, wid.definition_key, wid.name,
                wid.category_id, udwic.category_name,
                wid.primary_input_label, wid.primary_input_nature,
                wid.primary_input_unit_id, udu.unit_name as primary_input_unit_name
             FROM work_item_definitions wid
             LEFT JOIN user_defined_work_item_categories udwic ON wid.category_id = udwic.id
             LEFT JOIN user_defined_units udu ON wid.primary_input_unit_id = udu.id
             WHERE wid.id = ? AND wid.user_id = ?`,
            [definitionId, userId]
        );

        if (definitionsData.length === 0) {
            return res.status(404).json({ message: "Work item definition not found or not owned by user." });
        }

        const def = definitionsData[0];

        const [componentsData] = await pool.query(
            `SELECT id, display_name, material_price_id, coefficient, component_type
             FROM definition_components
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

        const fullDefinition = {
            ...def,
            components: components
        };

        res.json(fullDefinition);

    } catch (error) {
        console.error("Error fetching work item definition by ID:", error);
        res.status(500).json({ message: "Failed to fetch work item definition", error: error.message });
    }
};