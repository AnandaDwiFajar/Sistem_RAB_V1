// controllers/projectController.js
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const getUserIdFromRequest = (req) => req.params.userId || req.body.userId || req.query.userId || (req.user && req.user.id);


// --- INTERNAL HELPER FUNCTION to get full project details ---
async function getFullProjectDetails(projectId, userId, dbClient) {
    const [projectRows] = await dbClient.query(
        'SELECT * FROM projects WHERE id = ?',
        [projectId] // Cukup projectId, karena kepemilikan sudah divalidasi di controller
    );

    if (projectRows.length === 0) {
        return null;
    }
    const project = projectRows[0];

    // Parse main numeric fields and boolean
    project.direct_cost_estimate = parseFloat(project.direct_cost_estimate);
    project.project_price = parseFloat(project.project_price);
    project.total_calculated_income = parseFloat(project.total_calculated_income);
    project.is_archived = Boolean(project.is_archived);
    project.total_budget_plan_cost = parseFloat(project.total_budget_plan_cost);

    // ====================== PERBAIKAN UTAMA DI SINI ======================
    // 2. Fetch associated work items DENGAN JOIN untuk mendapatkan category_id
    const workItemsSQL = `
        SELECT 
            pwi.id, 
            pwi.source_definition_id_snapshot,
            pwi.definition_name_snapshot,
            pwi.definition_key_snapshot,
            pwi.calculation_value, 
            pwi.primary_input_display_snapshot,
            pwi.total_item_cost_snapshot,
            pwi.added_at,
            pwi.input_details_json, 
            pwi.output_details_json,
            pwi.schema_type AS calculation_schema_type_snapshot,
            wd.category_id 
        FROM 
            project_work_items pwi
        LEFT JOIN 
            work_item_components wd ON pwi.source_definition_id_snapshot = wd.id
        WHERE 
            pwi.project_id = ?
        ORDER BY 
            pwi.added_at DESC`;
    // ===================================================================
            
    const [workItemsRows] = await dbClient.query(workItemsSQL, [projectId]);

    project.workItems = await Promise.all(
        workItemsRows.map(async (wi) => {
            const componentsSQL = `
                SELECT 
                    pwics.id AS component_snapshot_id, 
                    pwics.component_name_snapshot,
                    pwics.unit_snapshot,
                    pwics.coefficient_snapshot,
                    pwics.component_type_snapshot,
                    pwics.quantity_calculated,
                    pwics.price_per_unit_snapshot,
                    pwics.cost_calculated,
                    pwics.source_material_price_id_snapshot
                FROM project_work_item_components_snapshot pwics
                WHERE pwics.project_work_item_id = ?`;
            const [comps] = await dbClient.query(componentsSQL, [wi.id]);
            let inputDetailsSnapshot = {};
            try {
                // Ganti nama `input_details_json` menjadi `input_details_snapshot` agar sesuai dengan frontend
                inputDetailsSnapshot = JSON.parse(wi.input_details_json || '{}');
            } catch (e) {
                console.error(`Gagal parse input_details_json untuk work item ${wi.id}:`, wi.input_details_json);
            }
            return {
                ...wi,
                input_details_snapshot: inputDetailsSnapshot,
                calculation_value: parseFloat(wi.calculation_value),
                total_item_cost_snapshot: parseFloat(wi.total_item_cost_snapshot),
                components_snapshot: comps.map(c => ({
                    ...c,
                    coefficient_snapshot: parseFloat(c.coefficient_snapshot),
                    quantity_calculated: parseFloat(c.quantity_calculated),
                    price_per_unit_snapshot: parseFloat(c.price_per_unit_snapshot),
                    cost_calculated: parseFloat(c.cost_calculated)
                }))
            };
        })
    );

    // 3. Fetch associated cash flow entries (tidak ada perubahan)
    const cashFlowSQL = `
      SELECT 
        pt.id, 
        pt.transaction_date AS entry_date, 
        pt.details AS description,
        pt.transaction_value AS amount
      FROM project_transactions pt
      WHERE pt.project_id = ?
      ORDER BY pt.transaction_date DESC, pt.created_at DESC
    `;
    const [cashFlowRows] = await dbClient.query(cashFlowSQL, [projectId]);
    project.cashFlowEntries = cashFlowRows.map(cf => ({ ...cf, amount: parseFloat(cf.amount) }));

    return project;
}

exports.getUserProjects = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });
    try {
        const [projects] = await pool.query(
            `SELECT id, project_name, customer_name, direct_cost_estimate, project_price, total_budget_plan_cost, created_at, is_archived 
             FROM projects 
             WHERE is_archived = FALSE 
             ORDER BY created_at DESC`,
          );
        const formattedProjects = projects.map(p => ({
            ...p,
            is_archived: Boolean(p.is_archived),
            direct_cost_estimate: parseFloat(p.direct_cost_estimate),
            actual_income: parseFloat(p.actual_income),
            actual_expenses: parseFloat(p.actual_expenses),
        }));
        res.json(formattedProjects);
    } catch (error) {
        console.error("Error fetching active projects:", error);
        res.status(500).json({ message: "Failed to fetch active projects", error: error.message });
    }
};

exports.addProject = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    // DIUBAH: Ambil juga projectPrice
    const { projectName, customerName, location, startDate, dueDate, projectPrice } = req.body;

    if (!projectName || projectName.trim() === '') {
        return res.status(400).json({ message: 'Nama proyek wajib diisi.' });
    }

    const parsedProjectPrice = parseFloat(projectPrice) || 0;
    const newProjectId = uuidv4();
    
    // BARU: Menggunakan transaksi database
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Masukkan data proyek utama ke tabel 'projects'
        await connection.query(
            'INSERT INTO projects (id, user_id, project_name, customer_name, location, start_date, due_date, project_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [newProjectId, userId, projectName.trim(), customerName, location, startDate, dueDate, parsedProjectPrice]
        );

        // 3. Commit transaksi jika semua berhasil
        await connection.commit();
        
        const newProjectData = await getFullProjectDetails(newProjectId, userId, connection);
        if (!newProjectData) {
            return res.status(404).json({ message: "Project created but could not be retrieved." });
        }
        res.status(201).json(newProjectData);

    } catch (error) {
        // Rollback transaksi jika terjadi error
        await connection.rollback();
        console.error("Error creating project with cash flow:", error);
        res.status(500).json({ message: "Failed to create project", error: error.message });
    } finally {
        // Selalu lepaskan koneksi
        connection.release();
    }
};

exports.getProjectById = async (req, res) => {
    const { projectId } = req.params;
    const userId = req.params.userId; // As per your route: /:projectId/user/:userId

    if (!userId) return res.status(401).json({ message: "User ID parameter is required." });
    if (!projectId) return res.status(400).json({ message: "Project ID parameter is required." });

    try {
        const project = await getFullProjectDetails(projectId, userId, pool);
        if (!project) {
            return res.status(404).json({ message: "Project not found or not owned by user." });
        }
        res.json(project);
    } catch (error) {
        console.error(`Error fetching project by ID (${projectId}):`, error);
        res.status(500).json({ message: "Failed to fetch project details", error: error.message });
    }
};

exports.deleteProject = async (req, res) => {
    const { projectId } = req.params;
    const userId = getUserIdFromRequest(req);

    if (!userId || !projectId) return res.status(400).json({ message: "User ID and Project ID required."});
    try {
        const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [projectId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Project not found or not owned by user.' });
        }
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ message: "Failed to delete project", error: error.message });
    }
};

exports.unarchiveProject = async (req, res) => {
    const { projectId } = req.params;
    const userId = getUserIdFromRequest(req);

    if (!userId) return res.status(401).json({ message: "User authentication required." });
    if (!projectId) return res.status(400).json({ message: "Project ID is required." });

    try {
        const [result] = await pool.query(
            'UPDATE projects SET is_archived = FALSE, updated_at = NOW() WHERE id = ? AND is_archived = TRUE',
            [projectId, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Project not found, not owned by user, or not currently archived." });
        }
        const unarchivedProject = await getFullProjectDetails(projectId, userId, pool);
        res.json(unarchivedProject);
    } catch (error) {
        console.error("Error unarchiving project:", error);
        res.status(500).json({ message: "Failed to unarchive project", error: error.message });
    }
};

exports.getArchivedUserProjects = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });

    try {
        // --- KODE BARU: Kueri SQL yang dimodifikasi ---
        const query = `
            SELECT 
                p.id, 
                p.project_name, 
                p.created_at, 
                p.updated_at, 
                p.is_archived,
                p.total_budget_plan_cost AS total_cost,
                COUNT(pwi.id) AS work_items_count
            FROM 
                projects p
            LEFT JOIN 
                project_transactions pt ON p.id = pt.project_id
            LEFT JOIN 
                project_work_items pwi ON p.id = pwi.project_id
            WHERE 
                p.user_id = ? AND p.is_archived = TRUE
            GROUP BY
                p.id
            ORDER BY 
                p.updated_at DESC
        `;
        const [projects] = await pool.query(query, [userId]);
        
        // --- KODE BARU: Sesuaikan pemetaan data ---
        const formattedProjects = projects.map(p => ({
            ...p,
            is_archived: Boolean(p.is_archived),
            total_cost: parseFloat(p.total_cost || 0),
            work_items_count: parseInt(p.work_items_count || 0, 10),
            projectName: p.project_name,
            workItemsCount: parseInt(p.work_items_count || 0, 10),
            totalCost: parseFloat(p.total_cost || 0),
            createdAt: p.created_at
        }));

        res.json(formattedProjects);
    } catch (error) {
        console.error("Error fetching archived projects:", error);
        res.status(500).json({ message: "Failed to fetch archived projects", error: error.message });
    }
};


exports.archiveProject = async (req, res) => {
    const { projectId } = req.params;
    // Gunakan helper yang sudah kita buat untuk mendapatkan konteks lengkap


    if (!projectId) return res.status(400).json({ message: "Project ID is required." });

    try {
        // Bangun kueri secara dinamis
        let query = 'UPDATE projects SET is_archived = TRUE, updated_at = NOW() WHERE id = ? AND is_archived = FALSE';
        const queryParams = [projectId];


        const [result] = await pool.query(query, queryParams);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Project not found, not owned by user, or already archived." });
        }
        
        // Ambil data proyek yang baru diarsip untuk dikirim kembali
        const [archivedProjectRows] = await pool.query('SELECT * FROM projects WHERE id = ?', [projectId]);
        
        res.json(archivedProjectRows[0]);

    } catch (error) {
        console.error("Error archiving project:", error);
        res.status(500).json({ message: "Failed to archive project", error: error.message });
    }
};

exports.addWorkItemToProject = async (req, res) => {
    const { projectId } = req.params;
    const userId = getUserIdFromRequest(req); // Ensures userId is resolved from query, body, or req.user
    const workItemData = req.body; // This is calculatedWorkItemPreview from frontend

    if (!userId) return res.status(401).json({ message: "User ID is required." }); // Changed from 400
    if (!projectId) return res.status(400).json({ message: "Project ID path parameter is required." });

    // --- UPDATED VALIDATION ---
    // These are the fields explicitly prepared by frontend for the backend DB
    const {
        source_definition_id_snapshot,
        definition_name_snapshot,
        definition_key_snapshot,
        calculation_value,
        primary_input_display_snapshot,
        total_item_cost_snapshot,
        components_snapshot, // This is the array of component snapshots
        input_details_snapshot_json,    // Stringified JSON from frontend
        output_details_snapshot_json,   // Stringified JSON from frontend
        calculation_schema_type_snapshot // String from frontend
    } = workItemData;

    if (!source_definition_id_snapshot ||
        !definition_name_snapshot ||
        !definition_key_snapshot ||
        calculation_value === undefined || // Can be 0, so check for undefined
        !primary_input_display_snapshot ||
        total_item_cost_snapshot === undefined || // Can be 0
        !Array.isArray(components_snapshot) // Ensure it's an array
        // input_details_snapshot_json, output_details_snapshot_json, calculation_schema_type_snapshot can be optional for now
       ) {
        console.log("Validation failed. Missing fields:", {
            source_definition_id_snapshot,
            definition_name_snapshot,
            definition_key_snapshot,
            calculation_value,
            primary_input_display_snapshot,
            total_item_cost_snapshot,
            isComponentsArray: Array.isArray(components_snapshot)
        });
        return res.status(400).json({ message: "Invalid or incomplete work item data provided for main fields." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const newProjectWorkItemId = uuidv4();

        // --- INSERT INTO project_work_items ---
        // Using the directly provided snapshot fields from workItemData
        await connection.query(
            `INSERT INTO project_work_items (
                id, project_id, source_definition_id_snapshot, definition_name_snapshot, 
                definition_key_snapshot, calculation_value, primary_input_display_snapshot, 
                total_item_cost_snapshot, 
                components_snapshot,
                input_details_json,
                output_details_json,
                schema_type,
                added_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                newProjectWorkItemId, projectId, source_definition_id_snapshot, definition_name_snapshot,
                definition_key_snapshot, parseFloat(calculation_value), primary_input_display_snapshot,
                parseFloat(total_item_cost_snapshot),
                JSON.stringify(components_snapshot || []),
                input_details_snapshot_json || '{}',
                output_details_snapshot_json || '{}',
                calculation_schema_type_snapshot || 'SIMPLE_PRIMARY_INPUT'
            ]
        );
        if (components_snapshot && components_snapshot.length > 0) {
            for (const compSnap of components_snapshot) { // Iterate the correct snapshot array
                const newSnapshotComponentId = uuidv4();
                await connection.query(
                    `INSERT INTO project_work_item_components_snapshot (
                        id, project_work_item_id, component_name_snapshot, 
                        source_material_price_id_snapshot, unit_snapshot, coefficient_snapshot, 
                        component_type_snapshot, quantity_calculated, price_per_unit_snapshot, 
                        cost_calculated
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        newSnapshotComponentId, newProjectWorkItemId, compSnap.component_name_snapshot,
                        compSnap.material_price_id_snapshot || null, // Use the field from compSnap
                        compSnap.unit_snapshot,
                        parseFloat(compSnap.coefficient_snapshot),
                        compSnap.component_type_snapshot,
                        parseFloat(compSnap.quantity_calculated),
                        parseFloat(compSnap.price_per_unit_snapshot),
                        parseFloat(compSnap.cost_calculated)
                    ]
                );
            }
        }

        const workItemCostForSummary = parseFloat(total_item_cost_snapshot);
        // Update project summary
        await connection.query(
            `UPDATE projects 
             SET direct_cost_estimate = direct_cost_estimate + ?, 
                 total_budget_plan_cost = total_budget_plan_cost + ? 
             WHERE id = ?`,
            [workItemCostForSummary, workItemCostForSummary, projectId, userId]
        );

        await connection.commit();
        const updatedProject = await getFullProjectDetails(projectId, userId, connection); // Use connection from transaction
        res.status(201).json(updatedProject);

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error adding work item to project:", error); // This will log the detailed SQL error if it happens
        res.status(500).json({ message: "Failed to add work item to project", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.deleteWorkItemFromProject = async (req, res) => {
    const { projectId, workItemId } = req.params;
    const { userId } = req.query;
    if (!projectId || !workItemId) { return res.status(400).json({ message: "Required IDs missing."}); }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const [projectOwnerRows] = await connection.query('SELECT id FROM projects WHERE id = ?', [projectId]);
        if (projectOwnerRows.length === 0) {
            await connection.rollback();
            return res.status(403).json({ message: "Forbidden: Project not found or not owned by user." });
        }

        const [workItems] = await connection.query('SELECT total_item_cost_snapshot FROM project_work_items WHERE id = ? AND project_id = ?', [workItemId, projectId]);
        if (workItems.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Work item not found in this project." });
        }
        const workItemCost = parseFloat(workItems[0].total_item_cost_snapshot);

        let costToReverseFromActualExpenses = 0;
        const [linkedCF] = await connection.query(  `SELECT id, transaction_value AS amount
                                                        FROM project_transactions
                                                     WHERE project_id = ?`, [projectId]);
        if (linkedCF.length > 0) {
            costToReverseFromActualExpenses = parseFloat(linkedCF[0].amount);
            await connection.query('DELETE FROM project_transactions WHERE id = ?', [linkedCF[0].id]);
        }
        
        await connection.query('DELETE FROM project_work_items WHERE id = ?', [workItemId]);

        const [updateResult] = await connection.query(
            'UPDATE projects SET direct_cost_estimate = direct_cost_estimate - ?, total_budget_plan_cost = total_budget_plan_cost - ? WHERE id = ?',
            // Gunakan workItemCost untuk mengurangi kedua kolom
            [workItemCost, workItemCost, projectId] // <-- DIUBAH: Parameter kedua sekarang adalah workItemCost
        );
        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Failed to update project summary; project may not be owned by user." });
        }
        
        await connection.commit();
        const updatedProject = await getFullProjectDetails(projectId, userId, connection);
        res.json(updatedProject);
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error deleting work item from project:", error);
        res.status(500).json({ message: "Failed to delete work item from project", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.updateWorkItemFromProject = async (req, res) => {
    const { projectId, workItemId } = req.params;
    const userId = getUserIdFromRequest(req);
    const updatedWorkItemData = req.body; // Ini adalah calculatedWorkItemPreview yang baru

    if (!userId || !projectId || !workItemId) {
        return res.status(400).json({ message: "User, Project, and Work Item IDs are required." });
    }

    // Validasi data yang masuk (sama seperti saat add)
    const {
        total_item_cost_snapshot: newTotalCostSnapshot,
        components_snapshot,
        // ... field lainnya yang relevan
    } = updatedWorkItemData;

    if (newTotalCostSnapshot === undefined || !Array.isArray(components_snapshot)) {
        return res.status(400).json({ message: "Invalid or incomplete updated work item data." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Dapatkan biaya item pekerjaan LAMA untuk menghitung selisih
        const [oldWorkItems] = await connection.query(
            'SELECT total_item_cost_snapshot FROM project_work_items WHERE id = ? AND project_id = ?',
            [workItemId, projectId]
        );

        if (oldWorkItems.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Work item not found in this project." });
        }
        const oldWorkItemCost = parseFloat(oldWorkItems[0].total_item_cost_snapshot);
        const newWorkItemCost = parseFloat(newTotalCostSnapshot);

        // 2. Hapus komponen snapshot LAMA yang terkait dengan item pekerjaan ini
        await connection.query(
            'DELETE FROM project_work_item_components_snapshot WHERE project_work_item_id = ?',
            [workItemId]
        );

        // 3. Update data utama di tabel project_work_items
        await connection.query(
            `UPDATE project_work_items SET 
                source_definition_id_snapshot = ?, definition_name_snapshot = ?, definition_key_snapshot = ?,
                calculation_value = ?, primary_input_display_snapshot = ?, total_item_cost_snapshot = ?,
                components_snapshot = ?, input_details_json = ?, output_details_json = ?,
                schema_type = ?, updated_at = NOW()
            WHERE id = ?`,
            [
                updatedWorkItemData.source_definition_id_snapshot, updatedWorkItemData.definition_name_snapshot, updatedWorkItemData.definition_key_snapshot,
                parseFloat(updatedWorkItemData.calculation_value), updatedWorkItemData.primary_input_display_snapshot, newWorkItemCost,
                JSON.stringify(updatedWorkItemData.components_snapshot || []),
                updatedWorkItemData.input_details_snapshot_json || '{}',
                updatedWorkItemData.output_details_snapshot_json || '{}',
                updatedWorkItemData.calculation_schema_type_snapshot || 'SIMPLE_PRIMARY_INPUT',
                workItemId
            ]
        );

        // 4. Masukkan komponen snapshot BARU
        if (components_snapshot && components_snapshot.length > 0) {
            for (const compSnap of components_snapshot) {
                const newSnapshotComponentId = uuidv4();
                await connection.query(
                    `INSERT INTO project_work_item_components_snapshot (
                        id, project_work_item_id, component_name_snapshot, source_material_price_id_snapshot, 
                        unit_snapshot, coefficient_snapshot, component_type_snapshot, quantity_calculated, 
                        price_per_unit_snapshot, cost_calculated
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        newSnapshotComponentId, workItemId, compSnap.component_name_snapshot, compSnap.material_price_id_snapshot || null,
                        compSnap.unit_snapshot, parseFloat(compSnap.coefficient_snapshot), compSnap.component_type_snapshot,
                        parseFloat(compSnap.quantity_calculated), parseFloat(compSnap.price_per_unit_snapshot), parseFloat(compSnap.cost_calculated)
                    ]
                );
            }
        }

        // 5. Update ringkasan biaya proyek dengan menghitung selisihnya
        const costDifference = newWorkItemCost - oldWorkItemCost;
        await connection.query(
            `UPDATE projects 
             SET direct_cost_estimate = direct_cost_estimate + ?, 
                 total_budget_plan_cost = total_budget_plan_cost + ? 
             WHERE id = ?`,
            [costDifference, costDifference, projectId]
        );

        await connection.commit();
        
        // Kirim kembali data proyek yang sudah lengkap dan terupdate
        const updatedProject = await getFullProjectDetails(projectId, userId, connection);
        res.status(200).json(updatedProject);

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error updating work item in project:", error);
        res.status(500).json({ message: "Failed to update work item", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.addManualCashFlowEntry = async (req, res) => {
    const { projectId } = req.params;
    const { userId } = req.query;
    const { date, description, amount } = req.body;

    if (!userId || !projectId || !date || !description || amount === undefined) {
        return res.status(400).json({ message: "All fields for cash flow entry are required."});
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount."});
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const newCashFlowEntryId = uuidv4();
        await connection.query(
        `INSERT INTO project_transactions
            (id, project_id, transaction_date, details, transaction_value)
        VALUES (?, ?, ?, ?, ?)`,
        [ newCashFlowEntryId, projectId, date, description.trim(), parsedAmount ]
        );
        let projectUpdateQuery;

        projectUpdateQuery = 'UPDATE projects SET total_budget_plan_cost = total_budget_plan_cost + ? WHERE id = ?';

        const [updateResult] = await connection.query(projectUpdateQuery, [parsedAmount, projectId, userId]);
        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Project not found for summary update." });
        }

        await connection.commit();
        const updatedProject = await getFullProjectDetails(projectId, userId, connection);
        res.status(201).json(updatedProject);
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error adding manual cash flow entry:", error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ message: `Invalid category ID: The selected cash flow category does not exist.`});
        }
        res.status(500).json({ message: "Failed to add cash flow entry", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.updateManualCashFlowEntry = async (req, res) => {
    const { projectId, entryId } = req.params;
    const { userId } = req.query;
    const { date, description, amount } = req.body;

    if (!userId || !projectId || !entryId || !date || !description || amount === undefined) {
         return res.status(400).json({ message: "All fields are required for update."});
    }
    const parsedNewAmount = parseFloat(amount);
    if (isNaN(parsedNewAmount) || parsedNewAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount for update."});
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const [oldEntries] = await connection.query(
        `SELECT transaction_value AS old_amount
        FROM project_transactions
        WHERE id = ? AND project_id = ?`,
            [entryId, projectId]
        );
        if (oldEntries.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Cash flow entry to update not found." });
        }
        const oldEntry = oldEntries[0];
        const oldAmount = parseFloat(oldEntry.old_amount);

        const [updateResult] = await connection.query(
        `UPDATE project_transactions
        SET transaction_date = ?, details = ?, transaction_value = ?, updated_at = NOW()
        WHERE id = ? AND project_id = ?`,            
        [date, description.trim(), parsedNewAmount, entryId, projectId]
        );
        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Cash flow entry not found or no changes made during update." });
        }

        let queryReverseOld;
        if (oldEntry.old_type === 'income') {
            queryReverseOld = 'UPDATE projects SET project_price = project_price - ? WHERE id = ?';
        } else {
            queryReverseOld = 'UPDATE projects SET total_budget_plan_cost = total_budget_plan_cost - ? WHERE id = ?';
        }
        await connection.query(queryReverseOld, [oldAmount, projectId, userId]);

        let queryApplyNew;
        if (oldEntry.old_type === 'income') {
            queryApplyNew = 'UPDATE projects SET project_price = project_price + ? WHERE id = ?';
        } else {
            queryApplyNew = 'UPDATE projects SET total_budget_plan_cost = total_budget_plan_cost + ? WHERE id = ?';
        }
        const [projectUpdateResult] = await connection.query(queryApplyNew, [parsedNewAmount, projectId, userId]);
        if (projectUpdateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(500).json({ message: "Cash flow entry updated, but failed to update project summary. Operation rolled back." });
        }

        await connection.commit();
        const updatedProject = await getFullProjectDetails(projectId, userId, connection);
        res.json(updatedProject);
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error updating cash flow entry:", error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ message: `Invalid category ID: The selected cash flow category does not exist.`});
        }
        res.status(500).json({ message: "Failed to update cash flow entry", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.updateProject = async (req, res) => {
    const { projectId } = req.params;
    // Gunakan helper yang sudah ada untuk mendapatkan userId
    const userId = getUserIdFromRequest(req); 
    const { projectName, customerName, location, startDate, dueDate, projectPrice } = req.body;

    if (!userId) {
        return res.status(401).json({ message: "User ID is required for authentication." });
    }
    if (!projectName || projectName.trim() === '') {
        return res.status(400).json({ message: 'Nama proyek wajib diisi.' });
    }
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Buat query UPDATE ke database
        const [result] = await connection.query(
            `UPDATE projects SET 
                project_name = ?, 
                customer_name = ?, 
                location = ?, 
                start_date = ?, 
                due_date = ?, 
                project_price = ?,
                updated_at = NOW() 
             WHERE id = ? AND user_id = ?`, // <-- Klausa user_id sangat PENTING untuk keamanan
            [
                projectName.trim(),
                customerName,
                location,
                startDate,
                dueDate,
                parseFloat(projectPrice) || 0,
                projectId,
                userId
            ]
        );

        // 2. Periksa apakah ada baris yang terpengaruh
        if (result.affectedRows === 0) {
            await connection.rollback();
            // Ini terjadi jika projectId tidak ditemukan atau bukan milik user tersebut
            return res.status(404).json({ message: "Project not found or you do not have permission to edit it." });
        }

        // 3. Commit transaksi jika berhasil
        await connection.commit();

        // 4. Ambil data proyek yang lengkap dan terbaru untuk dikirim kembali ke frontend
        const updatedProjectData = await getFullProjectDetails(projectId, userId, connection);
        if (!updatedProjectData) {
            // Seharusnya tidak terjadi, tapi sebagai pengaman
            return res.status(404).json({ message: "Project was updated, but could not be retrieved." });
        }
        
        res.status(200).json(updatedProjectData);

    } catch (error) {
        await connection.rollback(); // Rollback jika ada error
        console.error('Error updating project:', error);
        res.status(500).json({ message: 'Server error while updating project.', error: error.message });
    } finally {
        if (connection) connection.release(); // Selalu lepaskan koneksi
    }
};

exports.deleteManualCashFlowEntry = async (req, res) => {
    const { projectId, entryId } = req.params;
    const { userId } = req.query;
    if (!projectId || !entryId) {
         return res.status(400).json({ message: "Required IDs missing."});
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const [projectOwnerRows] = await connection.query('SELECT id FROM projects WHERE id = ?', [projectId]);
        if (projectOwnerRows.length === 0) {
            await connection.rollback();
            return res.status(403).json({ message: "Forbidden: Project not found or not owned by user." });
        }

        const [entries] = await connection.query(  `SELECT transaction_value AS amount
   FROM project_transactions
   WHERE id = ? AND project_id = ?`, [entryId, projectId]);
        if (entries.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Cash flow entry not found in this project." });
        }
        const entryToDelete = entries[0];
        
        await connection.query('DELETE FROM project_transactions WHERE id = ?', [entryId]);
        
        const parsedAmount = parseFloat(entryToDelete.amount);
        let projectUpdateQuery;
        if (entryToDelete.entry_type === 'income') {
            projectUpdateQuery = 'UPDATE projects SET project_price = project_price - ? WHERE id = ?';
        } else {
            projectUpdateQuery = 'UPDATE projects SET total_budget_plan_cost = total_budget_plan_cost - ? WHERE id = ?';
        }
        const [updateProjectResult] = await connection.query(projectUpdateQuery, [parsedAmount, projectId, userId]);
        if (updateProjectResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Failed to update project summary after deleting cash flow entry." });
        }
        
        await connection.commit();
        const updatedProject = await getFullProjectDetails(projectId, userId, connection);
        res.json(updatedProject);
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("[BE_DELETE_CF] CATCH BLOCK ERROR:", error);
        res.status(500).json({ message: "Failed to delete cash flow entry", detail: error.message });
    } finally {
        if (connection) connection.release();
    }
    
    module.exports = {
        getFullProjectDetails,
        getUserProjects,
        addProject,
        getProjectById,
        deleteProject,
        unarchiveProject,
        getArchivedUserProjects,
        archiveProject,
        addWorkItemToProject,
        deleteWorkItemFromProject,
        updateWorkItemFromProject,
        addManualCashFlowEntry,
        updateManualCashFlowEntry,
        updateProject,
        deleteManualCashFlowEntry
    };
};

