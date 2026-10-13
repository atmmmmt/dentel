const router = require('express').Router({ mergeParams: true });
const finance = require('../controllers/clinicFinanceController');
const { requirePermission } = require('../middleware/clinicAuth');

router.get('/summary', finance.getSummary);
router.get('/collections', finance.getCollections);
router.get('/invoices', finance.getInvoices);
router.post('/invoices', requirePermission('finance', 'create'), finance.createInvoice);
router.put('/invoices/:id', requirePermission('finance', 'update'), finance.updateInvoice);
router.post('/invoices/:id/payments', requirePermission('finance', 'update'), finance.addPayment);
router.post('/invoices/:id/void', requirePermission('finance', 'update'), finance.voidInvoice);

module.exports = router;
