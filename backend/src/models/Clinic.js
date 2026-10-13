const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Prootech is sold as one complete product. Legacy values are accepted only
// so existing clinics continue to load without a data migration.
const ALL_FEATURES = ['all'];
const PACKAGE_FEATURES = {
  Unified: ALL_FEATURES,
  Starter: ALL_FEATURES,
  Professional: ALL_FEATURES,
  Premium: ALL_FEATURES,
  'VIP Custom': ALL_FEATURES,
};

const clinicSchema = new mongoose.Schema({
  // ── Identity ─────────────────────────────────────────────────────
  doctorName:  { type: String, required: true, trim: true },
  clinicName:  { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  logo:        { type: String, default: '' }, // clinic logo stored at creation

  // ── Auth ──────────────────────────────────────────────────────────
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },

  // ── Package ───────────────────────────────────────────────────────
  package: {
    type: String,
    enum: ['Unified', 'Starter', 'Professional', 'Premium', 'VIP Custom'],
    default: 'Unified',
  },
  packagePrice:    { type: Number, default: 0 },  // price paid
  billingCycle:    { type: String, enum: ['monthly', 'yearly', 'lifetime'], default: 'yearly' },

  // ── Subscription ──────────────────────────────────────────────────
  subscriptionStatus: {
    type: String,
    enum: ['trial', 'active', 'grace_period', 'suspended', 'expired', 'cancelled'],
    default: 'trial',
  },
  trialStartDate:    { type: Date, default: Date.now },
  trialEndDate:      { type: Date },            // 15 days from creation
  subscriptionStart: { type: Date },
  subscriptionEnd:   { type: Date },
  gracePeriodEnd:    { type: Date },            // subscriptionEnd + 15 days
  renewalReminderSent: { type: Boolean, default: false },
  gracePeriodWarningSent: { type: Boolean, default: false },
  totalRevenue:      { type: Number, default: 0 }, // cumulative payments

  // ── Domain ────────────────────────────────────────────────────────
  domain:            { type: String, default: '' },  // e.g. dr-ahmed.com
  domainConnected:   { type: Boolean, default: false },
  domainNotes:       { type: String, default: '' },  // internal notes for admin
  domainCpanelUrl:   { type: String, default: '' },  // Hostinger/Cloudflare panel link for doctor
  domainLive:        { type: Boolean, default: false }, // verified reachable over HTTP(S)
  domainCheckedAt:   { type: Date },
  domainHelpRequested: { type: Boolean, default: false }, // doctor asked Prootech to link it

  // ── WhatsApp API (per-clinic WhatsApp server session) ─────────────
  waApiUrl:      { type: String, default: '' },   // e.g. https://wa.prootech.agency
  waApiKey:      { type: String, default: '' },   // API key / Bearer token
  waSessionId:   { type: String, default: '' },   // unique session ID per clinic
  waPhone:       { type: String, default: '' },   // doctor's WhatsApp phone
  waConnected:   { type: Boolean, default: false },
  waConnectedAt: { type: Date },

  // ── Contact ───────────────────────────────────────────────────────
  phone:    { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  country:  { type: String, default: '' },
  city:     { type: String, default: '' },

  // ── Status ────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'active',
  },

  // ── Onboarding ────────────────────────────────────────────────────
  onboardingCompleted: { type: Boolean, default: false },
  onboardingStep:      { type: Number, default: 0 },

  // ── Meta ──────────────────────────────────────────────────────────
  internalNotes: { type: String, default: '' },
  activatedAt:   { type: Date },
  lastLogin:     { type: Date },
}, { timestamps: true });

// ── Virtuals ──────────────────────────────────────────────────────
clinicSchema.virtual('features').get(function () {
  return ALL_FEATURES;
});

clinicSchema.virtual('isSubscriptionActive').get(function () {
  const now = new Date();
  if (this.subscriptionStatus === 'trial' && this.trialEndDate > now) return true;
  if (this.subscriptionStatus === 'active' && this.subscriptionEnd > now) return true;
  if (this.subscriptionStatus === 'grace_period' && this.gracePeriodEnd > now) return true;
  return false;
});

clinicSchema.virtual('daysUntilExpiry').get(function () {
  const now = new Date();
  const end = this.subscriptionEnd || this.trialEndDate;
  if (!end) return null;
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
});

clinicSchema.set('toJSON', { virtuals: true });
clinicSchema.set('toObject', { virtuals: true });

// ── Hooks ─────────────────────────────────────────────────────────
clinicSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Set trial end date on creation
clinicSchema.pre('save', function (next) {
  if (this.isNew && !this.trialEndDate) {
    this.trialEndDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days
  }
  next();
});

clinicSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

clinicSchema.statics.PACKAGE_FEATURES = PACKAGE_FEATURES;

module.exports = mongoose.model('Clinic', clinicSchema);
