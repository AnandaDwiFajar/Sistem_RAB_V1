// routes/unitRoutes.js
const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');
router.get('/user/:userId', unitController.getUserUnits);
router.post('/user/:userId', unitController.addUnit);
router.put('/:unitId', unitController.updateUnit);
router.delete('/:unitId', unitController.deleteUnit);
module.exports = router;
