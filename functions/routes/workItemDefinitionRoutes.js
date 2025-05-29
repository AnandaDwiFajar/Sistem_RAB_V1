// routes/workItemDefinitionRoutes.js
const express = require('express');
const router = express.Router();
const workItemDefinitionController = require('../controllers/workItemDefinitionController');

// TODO: Secure these routes

router.get('/user/:userId', workItemDefinitionController.getUserWorkItemDefinitions);
router.post('/user/:userId', workItemDefinitionController.addWorkItemDefinition);
router.get('/:definitionId/user/:userId', workItemDefinitionController.getWorkItemDefinitionById); // Get single definition
router.put('/:definitionId/user/:userId', workItemDefinitionController.updateWorkItemDefinition);
router.delete('/:definitionId/user/:userId', workItemDefinitionController.deleteWorkItemDefinition);

module.exports = router;