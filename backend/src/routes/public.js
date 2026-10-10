const router = require('express').Router();
const { getSettings } = require('../controllers/settingsController');
const { getLanding } = require('../controllers/landingController');
const { getActive: getPricing } = require('../controllers/pricingController');
const { getActive: getTestimonials } = require('../controllers/testimonialController');
const { getActive: getFAQs } = require('../controllers/faqController');
const { submitLead } = require('../controllers/leadController');

router.get('/settings', getSettings);
router.get('/landing', getLanding);
router.get('/pricing', getPricing);
router.get('/testimonials', getTestimonials);
router.get('/faqs', getFAQs);
router.post('/leads', submitLead);

module.exports = router;
