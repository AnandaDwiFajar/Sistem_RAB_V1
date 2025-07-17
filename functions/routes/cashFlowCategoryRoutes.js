// routes/cashFlowCategoryRoutes.js
const express = require('express');
const router = express.Router();
const cashFlowCategoryController = require('../controllers/cashFlowCategoryController');

router.get('/user/:userId', cashFlowCategoryController.getUserCashFlowCategories);
router.post('/user/:userId', cashFlowCategoryController.addCashFlowCategory);
router.put('/:categoryId', cashFlowCategoryController.updateCashFlowCategory);
router.delete('/:categoryId', cashFlowCategoryController.deleteCashFlowCategory);

module.exports = router;