const mongoose = require('mongoose');

const pricingPackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subtitle: { type: String, default: '' },
  price: { type: String, required: true },
  priceMonthly: { type: String, default: '' },
  priceYearly: { type: String, default: '' },
  currency: { type: String, default: '$' },
  badge: { type: String, default: '' },
  features: { type: [String], default: [] },
  isHighlighted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  buttonText: { type: String, default: 'اطلب الآن' },
}, { timestamps: true });

module.exports = mongoose.model('PricingPackage', pricingPackageSchema);
