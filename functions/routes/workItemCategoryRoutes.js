// routes/workItemCategoryRoutes.js
const express = require('express');
const router = express.Router();
const workItemCategoryController = require('../controllers/workItemCategoryController');

// TODO: Secure these routes with authentication middleware in a real app

// GET all work item categories for a user
router.get('/user/:userId', workItemCategoryController.getUserWorkItemCategories);
// POST a new work item category for a user
router.post('/user/:userId', workItemCategoryController.addWorkItemCategory);
// DELETE a work item category (categoryId in path, userId can be in query or from auth)
router.put('/:categoryId', workItemCategoryController.updateWorkItemCategory);
router.delete('/:categoryId', workItemCategoryController.deleteWorkItemCategory);

module.exports = router;