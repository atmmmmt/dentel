const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const permissionSchema = new mongoose.Schema({
  appointments: { view: Boolean, create: Boolean, update: Boolean },
  patients: { view: Boolean, create: Boolean, update: Boolean },
  finance: { view: Boolean, create: Boolean, update: Boolean },
  settings: { view: Boolean, update: Boolean },
}, { _id: false });

const staffSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['admin', 'dentist', 'receptionist', 'assistant'], default: 'assistant' },
  permissions: { type: permissionSchema, default: () => ({}) },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });

staffSchema.index({ clinicId: 1, email: 1 }, { unique: true });
staffSchema.pre('save', async function (next) { if (!this.isModified('password')) return next(); this.password = await bcrypt.hash(this.password, 12); next(); });
staffSchema.methods.comparePassword = function (value) { return bcrypt.compare(value, this.password); };
staffSchema.methods.toJSON = function () { const data = this.toObject(); delete data.password; return data; };

module.exports = mongoose.model('ClinicStaff', staffSchema);
