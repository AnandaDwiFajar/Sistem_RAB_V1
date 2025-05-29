// controllers/projectController.js
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const getUserIdFromRequest = (req) => req.params.userId || req.body.userId || req.query.userId || (req.user && req.user.id);

// --- INTERNAL HELPER FUNCTION to get full project details ---
async function getFullProjectDetails(projectId, userId, dbClient) { // dbClient can be pool or a specific connection
    // 1. Fetch the main project details
    const [projectRows] = await dbClient.query(
        'SELECT * FROM projects WHERE id = ? AND user_id = ?',
        [projectId, userId]
    );

    if (projectRows.length === 0) {
        return null; // Project not found or not owned by user
    }
    const project = projectRows[0];

    // Parse main numeric fields and boolean
    project.total_calculated_budget = parseFloat(project.total_calculated_budget);
    project.actual_income = parseFloat(project.actual_income);
    project.actual_expenses = parseFloat(project.actual_expenses);
    project.is_archived = Boolean(project.is_archived);


    // 2. Fetch associated work items
    const workItemsSQL = `
        SELECT 
            pwi.id, 
            pwi.source_definition_id_snapshot,
            pwi.definition_name_snapshot,
            pwi.definition_key_snapshot,
            pwi.primary_input_value, 
            pwi.primary_input_display_snapshot,
            pwi.total_item_cost_snapshot,
            pwi.added_at
        FROM project_work_items pwi
        WHERE pwi.project_id = ?
        ORDER BY pwi.added_at DESC`;
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
            return {
                ...wi,
                primary_input_value: parseFloat(wi.primary_input_value),
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

    // 3. Fetch associated cash flow entries
    const cashFlowSQL = `
        SELECT 
            pcf.id, 
            pcf.entry_date, 
            pcf.description, 
            pcf.entry_type, 
            pcf.amount, 
            pcf.category_id, 
            udcfc.category_name AS cash_flow_category_name,
            pcf.is_auto_generated,
            pcf.linked_project_work_item_id
        FROM project_cash_flow_entries pcf
        LEFT JOIN user_defined_cash_flow_categories udcfc ON pcf.category_id = udcfc.id
        WHERE pcf.project_id = ? 
        ORDER BY pcf.entry_date DESC, pcf.created_at DESC`;
    const [cashFlowRows] = await dbClient.query(cashFlowSQL, [projectId]);
    project.cashFlowEntries = cashFlowRows.map(cf => ({ ...cf, amount: parseFloat(cf.amount) }));

    return project;
}
// --- END OF HELPER FUNCTION ---

// --- CONTROLLER FUNCTIONS ---

exports.getUserProjects = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });
    try {
        const [projects] = await pool.query(
            'SELECT id, project_name, total_calculated_budget, actual_income, actual_expenses, created_at, is_archived FROM projects WHERE user_id = ? AND is_archived = FALSE ORDER BY created_at DESC',
            [userId]
        );
        const formattedProjects = projects.map(p => ({
            ...p,
            is_archived: Boolean(p.is_archived),
            total_calculated_budget: parseFloat(p.total_calculated_budget),
            actual_income: parseFloat(p.actual_income),
            actual_expenses: parseFloat(p.actual_expenses),
        }));
        res.json(formattedProjects);
    } catch (error) {
        console.error("Error fetching active projects:", error);
        res.status(500).json({ message: "Failed to fetch active projects", error: error.message });
    }
};

exports.getArchivedUserProjects = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });
    try {
        const [projects] = await pool.query(
            'SELECT id, project_name, total_calculated_budget, actual_income, actual_expenses, created_at, updated_at, is_archived FROM projects WHERE user_id = ? AND is_archived = TRUE ORDER BY updated_at DESC',
            [userId]
        );
        const formattedProjects = projects.map(p => ({
            ...p,
            is_archived: Boolean(p.is_archived),
            total_calculated_budget: parseFloat(p.total_calculated_budget),
            actual_income: parseFloat(p.actual_income),
            actual_expenses: parseFloat(p.actual_expenses),
        }));
        res.json(formattedProjects);
    } catch (error) {
        console.error("Error fetching archived projects:", error);
        res.status(500).json({ message: "Failed to fetch archived projects", error: error.message });
    }
};

exports.addProject = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "User ID is required." });
    const { projectName } = req.body;
    if (!projectName || projectName.trim() === '') {
        return res.status(400).json({ message: 'Project name is required.' });
    }
    const newProjectId = uuidv4();
    try {
        await pool.query(
            'INSERT INTO projects (id, user_id, project_name) VALUES (?, ?, ?)',
            [newProjectId, userId, projectName.trim()]
        );
        const newProjectData = await getFullProjectDetails(newProjectId, userId, pool);
        if (!newProjectData) {
            return res.status(404).json({ message: "Project created but could not be retrieved." });
        }
        res.status(201).json(newProjectData);
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ message: "Failed to create project", error: error.message });
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

exports.archiveProject = async (req, res) => {
    const { projectId } = req.params;
    // Assuming userId is obtained from auth middleware (req.user.id) or passed in body/query for this action
    const userId = getUserIdFromRequest(req); 

    if (!userId) return res.status(401).json({ message: "User authentication required." });
    if (!projectId) return res.status(400).json({ message: "Project ID is required." });

    try {
        const [result] = await pool.query(
            'UPDATE projects SET is_archived = TRUE, updated_at = NOW() WHERE id = ? AND user_id = ? AND is_archived = FALSE',
            [projectId, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Project not found, not owned by user, or already archived." });
        }
        const archivedProject = await getFullProjectDetails(projectId, userId, pool);
        res.json(archivedProject);
    } catch (error) {
        console.error("Error archiving project:", error);
        res.status(500).json({ message: "Failed to archive project", error: error.message });
    }
};

exports.unarchiveProject = async (req, res) => {
    const { projectId } = req.params;
    const userId = getUserIdFromRequest(req);

    if (!userId) return res.status(401).json({ message: "User authentication required." });
    if (!projectId) return res.status(400).json({ message: "Project ID is required." });

    try {
        const [result] = await pool.query(
            'UPDATE projects SET is_archived = FALSE, updated_at = NOW() WHERE id = ? AND user_id = ? AND is_archived = TRUE',
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

exports.deleteProject = async (req, res) => {
    const { projectId } = req.params;
    const userId = getUserIdFromRequest(req);

    if (!userId || !projectId) return res.status(400).json({ message: "User ID and Project ID required."});
    try {
        const [result] = await pool.query('DELETE FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Project not found or not owned by user.' });
        }
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ message: "Failed to delete project", error: error.message });
    }
};

exports.addWorkItemToProject = async (req, res) => {
    const { projectId } = req.params;
    const { userId } = req.query; // As per your apiService.js for this route
    const workItemData = req.body;

    if (!userId) return res.status(400).json({ message: "User ID query parameter is required." });
    if (!projectId) return res.status(400).json({ message: "Project ID path parameter is required." });
    if (!workItemData || !workItemData.templateKey || !workItemData.name || workItemData.totalItemCost === undefined || !workItemData.definition_key) {
        return res.status(400).json({ message: "Invalid or incomplete work item data provided." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const newProjectWorkItemId = uuidv4();
        let primaryInputValue = 0;
        if (workItemData.userInput && typeof workItemData.userInput === 'object' && Object.keys(workItemData.userInput).length > 0) {
            primaryInputValue = Object.values(workItemData.userInput)[0];
        }
        primaryInputValue = parseFloat(primaryInputValue) || 0;

        await connection.query(
            `INSERT INTO project_work_items (id, project_id, source_definition_id_snapshot, definition_name_snapshot, definition_key_snapshot, primary_input_value, primary_input_display_snapshot, total_item_cost_snapshot, added_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [newProjectWorkItemId, projectId, workItemData.templateKey, workItemData.name, workItemData.definition_key, primaryInputValue, workItemData.primaryInputDisplay, parseFloat(workItemData.totalItemCost)]
        );

        if (workItemData.components && workItemData.components.length > 0) {
            for (const comp of workItemData.components) {
                const newSnapshotComponentId = uuidv4();
                await connection.query(
                    `INSERT INTO project_work_item_components_snapshot (id, project_work_item_id, component_name_snapshot, source_material_price_id_snapshot, unit_snapshot, coefficient_snapshot, component_type_snapshot, quantity_calculated, price_per_unit_snapshot, cost_calculated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [newSnapshotComponentId, newProjectWorkItemId, comp.name, comp.material_price_id || null, comp.unit, parseFloat(comp.coefficient), comp.component_type, parseFloat(comp.quantity), parseFloat(comp.pricePerUnit), parseFloat(comp.cost)]
                );
            }
        }

        const workItemCost = parseFloat(workItemData.totalItemCost);
        const defaultWorkItemExpenseCategoryId = '6283ba61-3964-11f0-83df-a036bc676c09'; // Ensure this is YOUR valid ID
        const newCashFlowEntryId = uuidv4();
        await connection.query(
            `INSERT INTO project_cash_flow_entries (id, project_id, entry_date, description, entry_type, amount, category_id, is_auto_generated, linked_project_work_item_id) VALUES (?, ?, CURDATE(), ?, 'expense', ?, ?, TRUE, ?)`,
            [newCashFlowEntryId, projectId, `Automatic expense for work item: ${workItemData.name}`, workItemCost, defaultWorkItemExpenseCategoryId, newProjectWorkItemId]
        );

        await connection.query(
            `UPDATE projects SET total_calculated_budget = total_calculated_budget + ?, actual_expenses = actual_expenses + ? WHERE id = ? AND user_id = ?`,
            [workItemCost, workItemCost, projectId, userId]
        );

        await connection.commit();
        const updatedProject = await getFullProjectDetails(projectId, userId, connection);
        res.status(201).json(updatedProject);
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error adding work item to project:", error);
        res.status(500).json({ message: "Failed to add work item to project", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.deleteWorkItemFromProject = async (req, res) => {
    const { projectId, workItemId } = req.params;
    const { userId } = req.query;
    if (!userId || !projectId || !workItemId) { return res.status(400).json({ message: "Required IDs missing."}); }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const [projectOwnerRows] = await connection.query('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
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
        const [linkedCF] = await connection.query('SELECT id, amount FROM project_cash_flow_entries WHERE linked_project_work_item_id = ? AND is_auto_generated = TRUE AND project_id = ?', [workItemId, projectId]);
        if (linkedCF.length > 0) {
            costToReverseFromActualExpenses = parseFloat(linkedCF[0].amount);
            await connection.query('DELETE FROM project_cash_flow_entries WHERE id = ?', [linkedCF[0].id]);
        }
        
        await connection.query('DELETE FROM project_work_items WHERE id = ?', [workItemId]); // Assumes ON DELETE CASCADE for components_snapshot

        const [updateResult] = await connection.query(
            'UPDATE projects SET total_calculated_budget = total_calculated_budget - ?, actual_expenses = actual_expenses - ? WHERE id = ? AND user_id = ?',
            [workItemCost, costToReverseFromActualExpenses, projectId, userId]
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

exports.addManualCashFlowEntry = async (req, res) => {
    const { projectId } = req.params;
    const { userId } = req.query;
    const { date, description, type, amount, category_id } = req.body;

    if (!userId || !projectId || !date || !description || !type || amount === undefined || !category_id) {
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
            `INSERT INTO project_cash_flow_entries (id, project_id, entry_date, description, entry_type, amount, category_id, is_auto_generated, linked_project_work_item_id) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, NULL)`,
            [newCashFlowEntryId, projectId, date, description.trim(), type, parsedAmount, category_id]
        );

        let projectUpdateQuery;
        if (type === 'income') {
            projectUpdateQuery = 'UPDATE projects SET actual_income = actual_income + ? WHERE id = ? AND user_id = ?';
        } else {
            projectUpdateQuery = 'UPDATE projects SET actual_expenses = actual_expenses + ? WHERE id = ? AND user_id = ?';
        }
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
    const { date, description, type, amount, category_id } = req.body;

    if (!userId || !projectId || !entryId || !date || !description || !type || amount === undefined || !category_id) {
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
            'SELECT amount AS old_amount, entry_type AS old_type FROM project_cash_flow_entries WHERE id = ? AND project_id = ?',
            [entryId, projectId]
        );
        if (oldEntries.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Cash flow entry to update not found." });
        }
        const oldEntry = oldEntries[0];
        const oldAmount = parseFloat(oldEntry.old_amount);

        const [updateResult] = await connection.query(
            `UPDATE project_cash_flow_entries SET entry_date = ?, description = ?, entry_type = ?, amount = ?, category_id = ?, updated_at = NOW() WHERE id = ? AND project_id = ?`,
            [date, description.trim(), type, parsedNewAmount, category_id, entryId, projectId]
        );
        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Cash flow entry not found or no changes made during update." });
        }

        let queryReverseOld;
        if (oldEntry.old_type === 'income') {
            queryReverseOld = 'UPDATE projects SET actual_income = actual_income - ? WHERE id = ? AND user_id = ?';
        } else {
            queryReverseOld = 'UPDATE projects SET actual_expenses = actual_expenses - ? WHERE id = ? AND user_id = ?';
        }
        await connection.query(queryReverseOld, [oldAmount, projectId, userId]);

        let queryApplyNew;
        if (type === 'income') {
            queryApplyNew = 'UPDATE projects SET actual_income = actual_income + ? WHERE id = ? AND user_id = ?';
        } else {
            queryApplyNew = 'UPDATE projects SET actual_expenses = actual_expenses + ? WHERE id = ? AND user_id = ?';
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

exports.deleteManualCashFlowEntry = async (req, res) => {
    const { projectId, entryId } = req.params;
    const { userId } = req.query;
    if (!userId || !projectId || !entryId) {
         return res.status(400).json({ message: "Required IDs missing."});
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const [projectOwnerRows] = await connection.query('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
        if (projectOwnerRows.length === 0) {
            await connection.rollback();
            return res.status(403).json({ message: "Forbidden: Project not found or not owned by user." });
        }

        const [entries] = await connection.query('SELECT amount, entry_type FROM project_cash_flow_entries WHERE id = ? AND project_id = ?', [entryId, projectId]);
        if (entries.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Cash flow entry not found in this project." });
        }
        const entryToDelete = entries[0];
        
        await connection.query('DELETE FROM project_cash_flow_entries WHERE id = ?', [entryId]);
        
        const parsedAmount = parseFloat(entryToDelete.amount);
        let projectUpdateQuery;
        if (entryToDelete.entry_type === 'income') {
            projectUpdateQuery = 'UPDATE projects SET actual_income = actual_income - ? WHERE id = ? AND user_id = ?';
        } else {
            projectUpdateQuery = 'UPDATE projects SET actual_expenses = actual_expenses - ? WHERE id = ? AND user_id = ?';
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
};

exports.getCashFlowSummaryByMonth = async (req, res) => {
    const userId = getUserIdFromRequest(req);
    let { month } = req.query; // Expecting YYYY-MM format from frontend

    if (!userId) return res.status(401).json({ message: "User ID is required." });

    // Default to current month if not provided by the frontend
    if (!month) {
        const today = new Date();
        const year = today.getFullYear();
        // JavaScript months are 0-indexed, so add 1. Pad with '0' if needed.
        const currentMonthNum = (today.getMonth() + 1).toString().padStart(2, '0');
        month = `${year}-${currentMonthNum}`;
    } else if (!/^\d{4}-\d{2}$/.test(month)) { // Validate YYYY-MM format
        return res.status(400).json({ message: "Invalid month format. Please use YYYY-MM." });
    }

    try {
        // SQL to get per-project income and expenses for the selected month
        const projectMonthlyDataSql = `
            SELECT
                p.id AS project_id,
                p.project_name,
                COALESCE(SUM(CASE WHEN pcf.entry_type = 'income' THEN pcf.amount ELSE 0 END), 0) AS project_monthly_income,
                COALESCE(SUM(CASE WHEN pcf.entry_type = 'expense' THEN pcf.amount ELSE 0 END), 0) AS project_monthly_expenses
            FROM
                projects p
            LEFT JOIN
                project_cash_flow_entries pcf ON p.id = pcf.project_id AND DATE_FORMAT(pcf.entry_date, '%Y-%m') = ?
            WHERE
                p.user_id = ? AND
                p.is_archived = FALSE
            GROUP BY
                p.id, p.project_name
            ORDER BY
                p.project_name ASC;
        `;

        const [projectSummariesFromDb] = await pool.query(projectMonthlyDataSql, [month, userId]);

        let totalOverallIncome = 0;
        let totalOverallExpenses = 0;

        const formattedProjectSummaries = projectSummariesFromDb.map(ps => {
            const income = parseFloat(ps.project_monthly_income);
            const expenses = parseFloat(ps.project_monthly_expenses);
            totalOverallIncome += income;
            totalOverallExpenses += expenses;
            return {
                id: ps.project_id,
                project_name: ps.project_name,
                monthly_income: income,
                monthly_expenses: expenses,
                monthly_net_cash_flow: income - expenses,
            };
        });

        // Get all unique months that have any cash flow data for this user (for the dropdown)
        const [monthRows] = await pool.query(
            `SELECT DISTINCT DATE_FORMAT(pcf.entry_date, '%Y-%m') AS month_year
             FROM project_cash_flow_entries pcf
             JOIN projects p ON pcf.project_id = p.id
             WHERE p.user_id = ? AND p.is_archived = FALSE AND pcf.entry_date IS NOT NULL
             ORDER BY month_year DESC`,
            [userId]
        );
        const availableMonths = monthRows.map(r => r.month_year);

        res.json({
            selectedMonth: month, // Echo back the month for which data was processed
            overallSummary: {
                totalOverallIncome,
                totalOverallExpenses,
                totalOverallNetCashFlow: totalOverallIncome - totalOverallExpenses,
            },
            // Only include projects that had some activity in that month, or all if you prefer
            projectMonthlySummaries: formattedProjectSummaries.filter(p => p.monthly_income > 0 || p.monthly_expenses > 0),
            availableMonths, // This list helps the frontend populate its month selector
        });

    } catch (error) {
        console.error("Error fetching cash flow summary by month:", error);
        res.status(500).json({ message: "Failed to fetch cash flow summary", error: error.message });
    }
};