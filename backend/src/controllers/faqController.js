const FAQ = require('../models/FAQ');

exports.getAll = async (req, res) => {
  try {
    const items = await FAQ.find().sort('displayOrder');
    res.json({ success: true, faqs: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getActive = async (req, res) => {
  try {
    const items = await FAQ.find({ isActive: true }).sort('displayOrder');
    res.json({ success: true, faqs: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const item = await FAQ.create(req.body);
    res.status(201).json({ success: true, faq: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'السؤال غير موجود' });
    res.json({ success: true, faq: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await FAQ.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'السؤال غير موجود' });
    res.json({ success: true, message: 'تم الحذف' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
