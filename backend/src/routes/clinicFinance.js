const router = require('express').Router({ mergeParams: true });
const finance = require('../controllers/clinicFinanceController');

router.get('/summary', finance.getSummary);
router.get('/collections', finance.getCollections);
router.get('/invoices', finance.getInvoices);
router.post('/invoices', finance.createInvoice);
router.put('/invoices/:id', finance.updateInvoice);
router.post('/invoices/:id/payments', finance.addPayment);
router.post('/invoices/:id/void', finance.voidInvoice);

module.exports = router;
