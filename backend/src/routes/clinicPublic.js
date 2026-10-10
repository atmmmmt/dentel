const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/clinicPublicController');

router.get('/',              ctrl.getClinicPublic);
router.get('/services',      ctrl.getClinicServices);
router.get('/gallery',       ctrl.getClinicGallery);
router.get('/faq',           ctrl.getClinicFAQ);
router.get('/availability',  ctrl.getClinicAvailability);
router.get('/waiting',       ctrl.getWaitingScreen);
router.post('/book',         ctrl.bookAppointment);

module.exports = router;
