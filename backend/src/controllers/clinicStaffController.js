const ClinicStaff = require('../models/ClinicStaff');

const ROLE_PERMISSIONS = {
  admin: { appointments: { view: true, create: true, update: true }, patients: { view: true, create: true, update: true }, finance: { view: true, create: true, update: true }, settings: { view: true, update: true } },
  dentist: { appointments: { view: true, create: true, update: true }, patients: { view: true, create: true, update: true }, finance: { view: true, create: true, update: true }, settings: { view: true, update: false } },
  receptionist: { appointments: { view: true, create: true, update: true }, patients: { view: true, create: true, update: false }, finance: { view: true, create: true, update: false }, settings: { view: false, update: false } },
  assistant: { appointments: { view: true, create: false, update: true }, patients: { view: true, create: false, update: true }, finance: { view: false, create: false, update: false }, settings: { view: false, update: false } },
};
const withDefaults = ({ role, permissions }) => ({ ...ROLE_PERMISSIONS[role || 'assistant'], ...(permissions || {}) });

exports.getStaff = async (req, res) => { try { const staff = await ClinicStaff.find({ clinicId: req.clinic._id }).sort({ createdAt: -1 }); res.json({ success: true, staff }); } catch (err) { res.status(500).json({ success: false, message: err.message }); } };
exports.createStaff = async (req, res) => { try { const { name, email, password, role, permissions } = req.body; if (!name || !email || !password) return res.status(400).json({ success: false, message: 'الاسم والبريد وكلمة المرور مطلوبة' }); const member = await ClinicStaff.create({ clinicId: req.clinic._id, name, email, password, role, permissions: withDefaults({ role, permissions }) }); res.status(201).json({ success: true, staff: member }); } catch (err) { res.status(400).json({ success: false, message: err.code === 11000 ? 'هذا البريد مستخدم في فريق العيادة' : err.message }); } };
exports.updateStaff = async (req, res) => { try { const member = await ClinicStaff.findOne({ _id: req.params.id, clinicId: req.clinic._id }).select('+password'); if (!member) return res.status(404).json({ success: false, message: 'الموظف غير موجود' }); ['name', 'role', 'isActive'].forEach(key => { if (req.body[key] !== undefined) member[key] = req.body[key]; }); if (req.body.permissions) member.permissions = withDefaults({ role: req.body.role || member.role, permissions: req.body.permissions }); if (req.body.password) member.password = req.body.password; await member.save(); res.json({ success: true, staff: member }); } catch (err) { res.status(400).json({ success: false, message: err.message }); } };
exports.deleteStaff = async (req, res) => { try { await ClinicStaff.findOneAndDelete({ _id: req.params.id, clinicId: req.clinic._id }); res.json({ success: true }); } catch (err) { res.status(500).json({ success: false, message: err.message }); } };
exports.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
