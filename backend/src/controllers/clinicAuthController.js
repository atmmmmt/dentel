const jwt = require('jsonwebtoken');
const Clinic = require('../models/Clinic');
const ClinicStaff = require('../models/ClinicStaff');

const signToken = (id, type = 'clinic') => jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: '14d' });

exports.login = async (req, res) => {
  try {
    const { slug } = req.params;
    const { email, password } = req.body;
    const clinic = await Clinic.findOne({ slug }).select('+password');
    if (!clinic) return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    if (clinic.status === 'suspended') return res.status(403).json({ success: false, message: 'الحساب موقوف، تواصل مع Prootech' });
    const normalizedEmail = String(email || '').toLowerCase().trim();
    let actor;
    let token;
    if (clinic.email === normalizedEmail && await clinic.comparePassword(password)) {
      actor = { id: clinic._id, name: clinic.doctorName, role: 'owner' };
      token = signToken(clinic._id);
    } else {
      const staff = await ClinicStaff.findOne({ clinicId: clinic._id, email: normalizedEmail, isActive: true }).select('+password');
      if (!staff || !(await staff.comparePassword(password))) return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
      staff.lastLogin = new Date();
      await staff.save({ validateBeforeSave: false });
      actor = { id: staff._id, name: staff.name, role: staff.role, permissions: staff.permissions };
      token = signToken(staff._id, 'staff');
    }
    clinic.lastLogin = new Date();
    await clinic.save({ validateBeforeSave: false });
    res.json({ success: true, token, clinic, actor });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getMe = async (req, res) => res.json({ success: true, clinic: req.clinic, actor: req.actor });

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const account = req.staff
      ? await ClinicStaff.findById(req.staff._id).select('+password')
      : await Clinic.findById(req.clinic._id).select('+password');
    if (!(await account.comparePassword(currentPassword))) return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
    account.password = newPassword;
    await account.save();
    res.json({ success: true, message: 'تم تغيير كلمة المرور' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
