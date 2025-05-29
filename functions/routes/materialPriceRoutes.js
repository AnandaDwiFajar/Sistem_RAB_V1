// routes/materialPriceRoutes.js
const express = require('express');
const router = express.Router();
const materialPriceController = require('../controllers/materialPriceController');

// Assuming :userId in path for GET list, and in body/query for mutations for this example
// TODO: Secure with auth
router.get('/user/:userId', materialPriceController.getUserMaterialPrices);
router.post('/user/:userId', materialPriceController.addMaterialPrice); // Pass userId in path
router.put('/:priceId', materialPriceController.updateMaterialPrice); // Pass userId in body (or from auth)
router.delete('/:priceId', materialPriceController.deleteMaterialPrice); // Pass userId as query: /:priceId?userId=xxx

module.exports = router;