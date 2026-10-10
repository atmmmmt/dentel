const LandingContent = require('../models/LandingContent');

const getOrCreate = async () => {
  let content = await LandingContent.findOne({ singleton: 'main' });
  if (!content) content = await LandingContent.create({ singleton: 'main' });
  return content;
};

exports.getLanding = async (req, res) => {
  try {
    const content = await getOrCreate();
    res.json({ success: true, content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateLanding = async (req, res) => {
  try {
    const content = await LandingContent.findOneAndUpdate(
      { singleton: 'main' },
      { $set: req.body },
      { new: true, upsert: true, runValidators: false }
    );
    res.json({ success: true, content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
