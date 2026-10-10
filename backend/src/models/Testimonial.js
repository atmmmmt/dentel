const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  doctorName: { type: String, required: true },
  clinicName: { type: String, default: '' },
  location: { type: String, default: '' },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  text: { type: String, required: true },
  image: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
