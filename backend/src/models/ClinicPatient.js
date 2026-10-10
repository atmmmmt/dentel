const mongoose = require('mongoose');

// FDI numbering: 11-18, 21-28 (upper) / 31-38, 41-48 (lower)
const TOOTH_CONDITIONS = [
  'healthy', 'caries', 'fracture', 'missing', 'extraction', 'filling',
  'treatment', 'implant', 'crown', 'bridge', 'veneer', 'root_canal',
  'cleaning', 'sealant', 'temporary', 'other'
];

const toothRecordSchema = new mongoose.Schema({
  tooth:     { type: Number, required: true, min: 11, max: 48 },
  condition: { type: String, enum: TOOTH_CONDITIONS, required: true },
  note:      { type: String, default: '' },
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  date:  { type: String, default: () => new Date().toISOString().split('T')[0] },
  title: { type: String, default: '' },   // e.g. service name or session title
  notes: { type: String, default: '' },   // free-text written record
  teeth: { type: [toothRecordSchema], default: [] },
}, { timestamps: true });

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['xray', 'periapical', 'panoramic', 'photo', 'document'], default: 'photo' },
  tooth: { type: Number, min: 11, max: 48 },
  title: { type: String, default: '' },
  note: { type: String, default: '' },
  capturedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const periodontalToothSchema = new mongoose.Schema({
  tooth: { type: Number, required: true, min: 11, max: 48 },
  pocketDepths: { type: [Number], default: [] }, // six probing points per tooth
  bleeding: { type: Boolean, default: false },
  recession: { type: Number, default: 0 },
  mobility: { type: Number, min: 0, max: 3, default: 0 },
}, { _id: false });

const periodontalExamSchema = new mongoose.Schema({
  date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  note: { type: String, default: '' },
  teeth: { type: [periodontalToothSchema], default: [] },
}, { timestamps: true });

const endoCanalSchema = new mongoose.Schema({ name: { type: String, required: true }, workingLength: { type: Number }, note: { type: String, default: '' } }, { _id: false });
const endodonticCaseSchema = new mongoose.Schema({
  tooth: { type: Number, required: true, min: 11, max: 48 },
  diagnosis: { type: String, default: '' },
  status: { type: String, enum: ['planned', 'in_progress', 'completed', 'failed'], default: 'planned' },
  canals: { type: [endoCanalSchema], default: [] },
  notes: { type: String, default: '' },
  openedAt: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  completedAt: { type: String, default: '' },
}, { timestamps: true });

const clinicPatientSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true, index: true },

  name:      { type: String, required: true, trim: true },
  phone:     { type: String, default: '', trim: true },
  gender:    { type: String, enum: ['male', 'female', ''], default: '' },
  birthYear: { type: Number, default: null },
  address:   { type: String, default: '' },
  notes:     { type: String, default: '' },  // general medical notes (allergies, conditions...)

  sessions: { type: [sessionSchema], default: [] },
  media: { type: [mediaSchema], default: [] },
  periodontalExams: { type: [periodontalExamSchema], default: [] },
  endodonticCases: { type: [endodonticCaseSchema], default: [] },
}, { timestamps: true });

clinicPatientSchema.index({ clinicId: 1, name: 1 });
clinicPatientSchema.index({ clinicId: 1, phone: 1 });

clinicPatientSchema.statics.TOOTH_CONDITIONS = TOOTH_CONDITIONS;

module.exports = mongoose.model('ClinicPatient', clinicPatientSchema);
