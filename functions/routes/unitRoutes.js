// routes/unitRoutes.js
const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');

// TODO: Secure these routes with authentication middleware in a real app
// The :userId param here is a placeholder for how you'd scope data.
// Proper auth would put req.user.id from a token.

// GET all units for a user
router.get('/user/:userId', unitController.getUserUnits);
// POST a new unit for a user
router.post('/user/:userId', unitController.addUnit); // userId in path, unit_name in body
// DELETE a unit (unitId in path, userId can be in query for this example)
router.delete('/:unitId', unitController.deleteUnit); // Assumes userId will be passed as query e.g. /api/units/uuid-of-unit?userId=uuid-of-user

module.exports = router;