const router = require('express').Router({ mergeParams: true });
const staff = require('../controllers/clinicStaffController');
router.get('/', staff.getStaff);
router.post('/', staff.createStaff);
router.put('/:id', staff.updateStaff);
router.delete('/:id', staff.deleteStaff);
module.exports = router;
