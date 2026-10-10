const PricingPackage = require('../models/PricingPackage');

exports.getAll = async (req, res) => {
  try {
    const packages = await PricingPackage.find().sort('displayOrder');
    res.json({ success: true, packages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getActive = async (req, res) => {
  try {
    const packages = await PricingPackage.find({ isActive: true }).sort('displayOrder');
    res.json({ success: true, packages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const pkg = await PricingPackage.create(req.body);
    res.status(201).json({ success: true, package: pkg });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const pkg = await PricingPackage.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pkg) return res.status(404).json({ success: false, message: 'الباقة غير موجودة' });
    res.json({ success: true, package: pkg });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const pkg = await PricingPackage.findByIdAndDelete(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, message: 'الباقة غير موجودة' });
    res.json({ success: true, message: 'تم حذف الباقة' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
