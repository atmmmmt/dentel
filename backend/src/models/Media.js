const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  type: { type: String, default: 'image' },
  size: { type: Number, default: 0 },
  alt: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Media', mediaSchema);
