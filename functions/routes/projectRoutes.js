// routes/projectRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const projectController = require('../controllers/projectController');
// const { protect } = require('../middleware/authMiddleware'); // Middleware otentikasi Anda

// --- Rute Proyek & Work Items yang Sudah Ada ---
router.get('/user/:userId', projectController.getUserProjects);
router.post('/user/:userId', projectController.addProject);
router.put('/:projectId', projectController.updateProject);
router.get('/:projectId/user/:userId', projectController.getProjectById);
router.delete('/:projectId/user/:userId', projectController.deleteProject);

// --- Rute Arsip ---
router.get('/user/:userId/archived', /* protect, */ projectController.getArchivedUserProjects);
router.put('/:projectId/archive', /* protect, */ projectController.archiveProject);
router.put('/:projectId/unarchive', /* protect, */ projectController.unarchiveProject);

// --- Rute Work Items ---
router.post('/:projectId/work-items', /* protect, */ projectController.addWorkItemToProject);
router.put('/:projectId/work-items/:workItemId', /* protect, */ projectController.updateWorkItemFromProject);
router.delete('/:projectId/work-items/:workItemId', /* protect, */ projectController.deleteWorkItemFromProject);

// --- Rute Cash Flow ---
router.post('/:projectId/cashflow-entries', /* protect, */ projectController.addManualCashFlowEntry);
router.put('/:projectId/cashflow-entries/:entryId', /* protect, */ projectController.updateManualCashFlowEntry);
router.delete('/:projectId/cashflow-entries/:entryId', /* protect, */ projectController.deleteManualCashFlowEntry);


// ======================================================================
// --- ✅ RUTE BARU UNTUK LAPORAN PDF ---
// ======================================================================
router.get(
    '/:projectId/report',
    // protect, // Aktifkan middleware otentikasi jika diperlukan
    projectController.generateProjectReport // Hubungkan ke controller baru
);


module.exports = router;