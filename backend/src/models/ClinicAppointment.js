const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  clinicId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  patientName: { type: String, required: true },
  phone:       { type: String, required: true },
  service:     { type: String, default: '' },
  date:        { type: String, required: true },
  time:        { type: String, required: true },
  durationMinutes: { type: Number, min: 5, max: 480, default: 30 },
  chair: { type: String, trim: true, default: 'الكرسي الرئيسي' },
  notes:       { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  source: { type: String, enum: ['website', 'manual', 'whatsapp'], default: 'website' },
  // ── Waiting-room screen state ─────────────────────────────────────
  arrived:  { type: Boolean, default: false }, // مريض وصل وينتظر بغرفة الانتظار
  arrivedAt: { type: Date },
  calledAt: { type: Date },                    // آخر مناداة — الأحدث = "دورك الآن"
}, { timestamps: true });

module.exports = mongoose.model('ClinicAppointment', appointmentSchema);
