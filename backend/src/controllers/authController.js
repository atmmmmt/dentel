const jwt = require('jsonwebtoken');
const ProductAdmin = require('../models/ProductAdmin');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'البريد وكلمة المرور مطلوبان' });

    const admin = await ProductAdmin.findOne({ email }).select('+password');
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }
    if (!admin.isActive) return res.status(401).json({ success: false, message: 'الحساب غير نشط' });

    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    const token = signToken(admin._id);
    res.json({ success: true, token, admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, admin: req.admin });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, password, newPassword } = req.body;
    const admin = await ProductAdmin.findById(req.admin._id).select('+password');

    if (name) admin.name = name;
    if (email) admin.email = email;

    if (password && newPassword) {
      const valid = await admin.comparePassword(password);
      if (!valid) return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
      admin.password = newPassword;
    }

    await admin.save();
    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
