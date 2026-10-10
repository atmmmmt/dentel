const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  doctorName: { type: String, required: true, trim: true },
  clinicName: { type: String, trim: true, default: '' },
  phone: { type: String, required: true, trim: true },
  whatsapp: { type: String, trim: true, default: '' },
  email: { type: String, lowercase: true, trim: true, default: '' },
  country: { type: String, default: '' },
  city: { type: String, default: '' },
  selectedPackage: { type: String, default: '' },
  message: { type: String, default: '' },
  wantsDemo: { type: Boolean, default: false },
  preferredContactMethod: { type: String, enum: ['whatsapp', 'phone', 'email'], default: 'whatsapp' },
  status: {
    type: String,
    enum: ['new', 'contacted', 'demo_sent', 'proposal_sent', 'won', 'lost'],
    default: 'new',
  },
  internalNotes: { type: String, default: '' },
  // domain add-on
  wantsDomain: { type: Boolean, default: false },
  domainName: { type: String, default: '' },
  // billing preference
  billingCycle: { type: String, enum: ['monthly', 'yearly', ''], default: '' },
  // payment tracking (admin fills after deal won)
  actualPaidAmount: { type: Number, default: 0 },
  paymentDate: { type: Date },
  paymentNotes: { type: String, default: '' },
  // design theme preference
  preferredTheme: { type: String, enum: ['royal', 'ocean', 'mint', ''], default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
