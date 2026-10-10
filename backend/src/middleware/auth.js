const jwt = require('jsonwebtoken');
const ProductAdmin = require('../models/ProductAdmin');

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;

    if (!token) return res.status(401).json({ success: false, message: 'غير مصرح — يرجى تسجيل الدخول' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await ProductAdmin.findById(decoded.id);

    if (!admin || !admin.isActive) return res.status(401).json({ success: false, message: 'الحساب غير نشط' });

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'رمز الجلسة غير صالح' });
  }
};

module.exports = { protect };
