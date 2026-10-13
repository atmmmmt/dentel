const jwt = require('jsonwebtoken');
const Clinic = require('../models/Clinic');
const ClinicStaff = require('../models/ClinicStaff');

const clinicProtect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null;
    if (!token) return res.status(401).json({ success: false, message: 'غير مصرح' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!['clinic', 'staff'].includes(decoded.type)) return res.status(401).json({ success: false, message: 'رمز غير صالح' });
    const staff = decoded.type === 'staff' ? await ClinicStaff.findById(decoded.id) : null;
    if (decoded.type === 'staff' && (!staff || !staff.isActive)) return res.status(401).json({ success: false, message: 'حساب الموظف غير نشط' });
    const clinic = await Clinic.findById(staff?.clinicId || decoded.id);
    if (!clinic || clinic.status === 'suspended') return res.status(401).json({ success: false, message: 'الحساب غير نشط' });
    // Expired subscriptions remain readable to preserve access to patient records.
    // Check expiration dates on each request independently of the background scheduler.
    const now = new Date();
    const hasAccess = clinic.subscriptionStatus === 'trial'
      ? clinic.trialEndDate && clinic.trialEndDate > now
      : clinic.subscriptionStatus === 'active'
        ? clinic.subscriptionEnd && clinic.subscriptionEnd > now
        : clinic.subscriptionStatus === 'grace_period'
          ? clinic.gracePeriodEnd && clinic.gracePeriodEnd > now
          : false;
    if (!hasAccess && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return res.status(403).json({ success: false, code: 'SUBSCRIPTION_EXPIRED', message: 'انتهى الاشتراك السنوي. البيانات متاحة للعرض فقط حتى يتم التجديد.' });
    }
    req.clinic = clinic;
    req.staff = staff;
    req.actor = staff ? { id: staff._id, name: staff.name, role: staff.role, permissions: staff.permissions } : { id: clinic._id, name: clinic.doctorName, role: 'owner' };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'رمز الجلسة غير صالح' });
  }
};

// Kept for backwards-compatible routes. The product has one complete plan.
const requireFeature = () => (req, res, next) => next();
const requirePermission = (module, action) => (req, res, next) => {
  if (!req.staff || req.actor.role === 'admin') return next();
  if (req.actor.permissions?.[module]?.[action]) return next();
  return res.status(403).json({ success: false, message: 'لا تملك الصلاحية الكافية لهذا الإجراء' });
};

module.exports = { clinicProtect, requireFeature, requirePermission };
