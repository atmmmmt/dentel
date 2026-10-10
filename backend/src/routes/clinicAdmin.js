const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  getClinics, getClinic, createClinic, updateClinic, checkSlug, getWelcomeKit,
  resetPassword, deleteClinic, getStats, verifyDomain,
} = require('../controllers/clinicAdminController');
const { renewSubscription, getRevenueStats } = require('../controllers/subscriptionController');

router.use(protect);

router.get('/stats', getStats);
router.get('/revenue', getRevenueStats);
router.get('/slug-check', checkSlug);
router.get('/', getClinics);
router.get('/:id', getClinic);
router.get('/:id/welcome-kit', getWelcomeKit);
router.post('/', createClinic);
router.put('/:id', updateClinic);
router.post('/:id/reset-password', resetPassword);
router.post('/:id/renew', renewSubscription);
router.get('/:id/verify-domain', verifyDomain);
router.delete('/:id', deleteClinic);

module.exports = router;
