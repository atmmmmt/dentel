const router = require('express').Router({ mergeParams: true });
const { clinicProtect } = require('../middleware/clinicAuth');
const { login, getMe, updatePassword } = require('../controllers/clinicAuthController');

router.post('/login', login);
router.get('/me', clinicProtect, getMe);
router.put('/password', clinicProtect, updatePassword);

module.exports = router;
