const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { startSession, getStatus, disconnect, sendTest, getWaInfo } = require('../controllers/waSessionController');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { getLanding, updateLanding } = require('../controllers/landingController');
const { getAll: getPricing, create: createPkg, update: updatePkg, remove: deletePkg } = require('../controllers/pricingController');
const { getAll: getTestimonials, create: createTestimonial, update: updateTestimonial, remove: deleteTestimonial } = require('../controllers/testimonialController');
const { getAll: getFAQs, create: createFAQ, update: updateFAQ, remove: deleteFAQ } = require('../controllers/faqController');
const { getLeads, getLead, updateLead, deleteLead, getDashboardStats } = require('../controllers/leadController');
const { getMedia, uploadMedia, deleteMedia } = require('../controllers/mediaController');
const { upload } = require('../config/cloudinary');

router.use(protect);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

router.get('/landing', getLanding);
router.put('/landing', updateLanding);

router.get('/pricing', getPricing);
router.post('/pricing', createPkg);
router.put('/pricing/:id', updatePkg);
router.delete('/pricing/:id', deletePkg);

router.get('/testimonials', getTestimonials);
router.post('/testimonials', createTestimonial);
router.put('/testimonials/:id', updateTestimonial);
router.delete('/testimonials/:id', deleteTestimonial);

router.get('/faqs', getFAQs);
router.post('/faqs', createFAQ);
router.put('/faqs/:id', updateFAQ);
router.delete('/faqs/:id', deleteFAQ);

router.get('/leads', getLeads);
router.get('/leads/:id', getLead);
router.put('/leads/:id', updateLead);
router.delete('/leads/:id', deleteLead);
router.get('/dashboard-stats', getDashboardStats);

// WhatsApp session (WaOTP)
router.get('/wa/info',        getWaInfo);
router.post('/wa/start',      startSession);
router.get('/wa/status',      getStatus);
router.post('/wa/disconnect', disconnect);
router.post('/wa/test',       sendTest);

router.get('/media', getMedia);
router.post('/media', upload.single('image'), uploadMedia);
router.delete('/media/:id', deleteMedia);

module.exports = router;
