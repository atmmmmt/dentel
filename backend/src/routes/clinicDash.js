const router = require('express').Router({ mergeParams: true });
const { clinicProtect, requireFeature, requirePermission } = require('../middleware/clinicAuth');
const { upload } = require('../config/cloudinary');
const c = require('../controllers/clinicDashController');
const wa = require('../controllers/whatsappController');
const p = require('../controllers/clinicPatientController');
const finance = require('./clinicFinance');
const staff = require('./clinicStaff');

router.use(clinicProtect);
router.use('/finance', requirePermission('finance', 'view'), finance);
router.use('/staff', requirePermission('settings', 'update'), staff);

// Dashboard stats
router.get('/stats', c.getDashboardStats);

// Clinic info (for login page branding)
router.get('/info', c.getClinicInfo);

// Settings
router.get('/settings', c.getSettings);
router.put('/settings', c.updateSettings);

// Onboarding
router.post('/onboarding/step', c.completeOnboardingStep);

// Services
router.get('/services', c.getServices);
router.post('/services', c.addService);
router.put('/services/:serviceId', c.updateService);
router.delete('/services/:serviceId', c.deleteService);

// Working hours
router.get('/working-hours', c.getWorkingHours);
router.put('/working-hours', c.updateWorkingHours);

// Gallery
router.get('/gallery', c.getGallery);
router.post('/gallery', c.addGalleryItem);
router.delete('/gallery/:itemId', c.deleteGalleryItem);

// Appointments
router.get('/appointments', requirePermission('appointments', 'view'), c.getAppointments);
router.post('/appointments', requirePermission('appointments', 'create'), c.createAppointment);
router.put('/appointments/:id', requirePermission('appointments', 'update'), c.updateAppointment);
router.post('/appointments/:id/call', requirePermission('appointments', 'update'), c.callAppointment);
router.post('/appointments/:id/arrived', requirePermission('appointments', 'update'), c.setArrived);
router.delete('/appointments/:id', requirePermission('appointments', 'update'), c.deleteAppointment);

// Patients — advanced patient file with dental chart (Premium+)
router.get('/patients', requirePermission('patients', 'view'), requireFeature('patient_file'), p.getPatients);
router.post('/patients', requirePermission('patients', 'create'), requireFeature('patient_file'), p.createPatient);
router.get('/patients/:id', requirePermission('patients', 'view'), requireFeature('patient_file'), p.getPatient);
router.put('/patients/:id', requirePermission('patients', 'update'), requireFeature('patient_file'), p.updatePatient);
router.delete('/patients/:id', requirePermission('patients', 'update'), requireFeature('patient_file'), p.deletePatient);
router.post('/patients/:id/sessions', requirePermission('patients', 'update'), requireFeature('patient_file'), p.addSession);
router.put('/patients/:id/sessions/:sessionId', requirePermission('patients', 'update'), requireFeature('patient_file'), p.updateSession);
router.delete('/patients/:id/sessions/:sessionId', requirePermission('patients', 'update'), requireFeature('patient_file'), p.deleteSession);
router.post('/patients/:id/media', requirePermission('patients', 'update'), p.addMedia);
router.delete('/patients/:id/media/:mediaId', requirePermission('patients', 'update'), p.deleteMedia);
router.post('/patients/:id/periodontal-exams', requirePermission('patients', 'update'), p.addPeriodontalExam);
router.delete('/patients/:id/periodontal-exams/:examId', requirePermission('patients', 'update'), p.deletePeriodontalExam);
router.post('/patients/:id/endodontic-cases', requirePermission('patients', 'update'), p.addEndodonticCase);
router.put('/patients/:id/endodontic-cases/:caseId', requirePermission('patients', 'update'), p.updateEndodonticCase);
router.delete('/patients/:id/endodontic-cases/:caseId', requirePermission('patients', 'update'), p.deleteEndodonticCase);

// WhatsApp
router.get('/whatsapp/info', wa.getWaInfo);
router.get('/whatsapp/qr', wa.getQR);
router.get('/whatsapp/status', wa.getStatus);
router.post('/whatsapp/send-test', wa.sendTest);
router.post('/whatsapp/send-reminder', wa.sendReminder);
router.put('/whatsapp/phone', wa.updateWaPhone);

// Domain
router.get('/domain', c.getDomainSettings);
router.put('/domain', c.saveDomain);
router.get('/domain/verify', c.verifyDomain);
router.post('/domain/help', c.requestDomainHelp);

// Upload
router.post('/upload', requirePermission('patients', 'update'), upload.single('image'), c.uploadImage);

module.exports = router;
