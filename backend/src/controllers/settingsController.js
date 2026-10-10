const ProductSettings = require('../models/ProductSettings');

const getOrCreate = async () => {
  let settings = await ProductSettings.findOne({ singleton: 'main' });
  if (!settings) settings = await ProductSettings.create({ singleton: 'main' });
  return settings;
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await getOrCreate();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await ProductSettings.findOneAndUpdate(
      { singleton: 'main' },
      { $set: req.body },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
