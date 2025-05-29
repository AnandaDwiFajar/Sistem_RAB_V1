// routes/cashFlowCategoryRoutes.js
const express = require('express');
const router = express.Router();
const cashFlowCategoryController = require('../controllers/cashFlowCategoryController');

// TODO: Secure these routes

router.get('/user/:userId', cashFlowCategoryController.getUserCashFlowCategories);
router.post('/user/:userId', cashFlowCategoryController.addCashFlowCategory);
router.delete('/:categoryId', cashFlowCategoryController.deleteCashFlowCategory);

module.exports = router;