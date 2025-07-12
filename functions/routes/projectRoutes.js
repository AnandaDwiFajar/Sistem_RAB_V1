// routes/projectRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const projectController = require('../controllers/projectController');
// const { protect } = require('../middleware/authMiddleware'); // Your auth middleware

// Existing routes
router.get('/user/:userId', projectController.getUserProjects);
router.post('/user/:userId', projectController.addProject);
router.put('/:projectId', projectController.updateProject); 
router.get('/:projectId/user/:userId', projectController.getProjectById); // Assuming userId is part of the path for this
router.delete('/:projectId/user/:userId', projectController.deleteProject); // Assuming userId is part of the path for this

router.get('/user/:userId/archived', /* protect, */ projectController.getArchivedUserProjects);
router.put('/:projectId/archive', /* protect, */ projectController.archiveProject);     // Using PUT to change state
router.put('/:projectId/unarchive', /* protect, */ projectController.unarchiveProject);
router.post(
    '/:projectId/work-items',
    // protect,
    projectController.addWorkItemToProject
);
router.put(
    '/:projectId/work-items/:workItemId',
    // protect, // Terapkan middleware otentikasi jika diperlukan
    projectController.updateWorkItemFromProject // Hubungkan ke controller yang baru dibuat
);

router.delete(
    '/:projectId/work-items/:workItemId',
    // yourAuthMiddleware, // if you use it
    projectController.deleteWorkItemFromProject
);

// --- ADD THIS NEW ROUTE for Manual Cash Flow Entries ---
// This will handle POST requests to /api/projects/:projectId/cashflow-entries
// (assuming your projectRoutes is mounted at /api/projects in your main server file)
router.post(
    '/:projectId/cashflow-entries',
    // protect, // Apply authentication middleware if needed
    projectController.addManualCashFlowEntry // Make sure this function exists in projectController.js
);
router.delete(
    '/:projectId/cashflow-entries/:entryId',
    // protect, // Apply authentication middleware if needed
    projectController.deleteManualCashFlowEntry // We will create this controller function next
);

router.put(
    '/:projectId/cashflow-entries/:entryId',
    // protect, // Your auth middleware
    projectController.updateManualCashFlowEntry // Needs to be implemented
);

router.get('/summary/cashflow', projectController.getCashFlowSummaryByMonth);

module.exports = router;