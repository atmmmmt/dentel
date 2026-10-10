const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  tooth: { type: Number, min: 11, max: 48 },
  quantity: { type: Number, min: 1, default: 1 },
  unitPrice: { type: Number, min: 0, required: true },
  taxRate: { type: Number, min: 0, max: 100, default: 0 },
}, { _id: true });

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, min: 0.01, required: true },
  method: { type: String, enum: ['cash', 'card', 'transfer', 'other'], default: 'cash' },
  note: { type: String, default: '' },
  paidAt: { type: Date, default: Date.now },
}, { _id: true });

const clinicInvoiceSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true, index: true },
  number: { type: String, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicPatient', required: true },
  patientName: { type: String, required: true, trim: true },
  patientPhone: { type: String, default: '' },
  issuedAt: { type: Date, default: Date.now },
  dueDate: { type: Date },
  currency: { type: String, default: 'USD', uppercase: true, trim: true },
  items: { type: [itemSchema], validate: value => value.length > 0 },
  discount: { type: Number, min: 0, default: 0 },
  subtotal: { type: Number, min: 0, default: 0 },
  taxTotal: { type: Number, min: 0, default: 0 },
  total: { type: Number, min: 0, default: 0 },
  paidAmount: { type: Number, min: 0, default: 0 },
  balance: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['unpaid', 'partial', 'paid', 'void'], default: 'unpaid' },
  notes: { type: String, default: '' },
  payments: { type: [paymentSchema], default: [] },
}, { timestamps: true });

clinicInvoiceSchema.index({ clinicId: 1, number: 1 }, { unique: true });
clinicInvoiceSchema.index({ clinicId: 1, patientId: 1, status: 1 });

clinicInvoiceSchema.methods.recalculate = function () {
  this.subtotal = this.items.reduce((sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0), 0);
  this.taxTotal = this.items.reduce((sum, item) => sum + ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0) * (Number(item.taxRate) || 0) / 100), 0);
  this.total = Math.max(0, this.subtotal + this.taxTotal - (Number(this.discount) || 0));
  this.paidAmount = this.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  this.balance = Math.max(0, this.total - this.paidAmount);
  if (this.status !== 'void') this.status = this.balance === 0 ? 'paid' : this.paidAmount > 0 ? 'partial' : 'unpaid';
};

clinicInvoiceSchema.pre('validate', function (next) { this.recalculate(); next(); });

module.exports = mongoose.model('ClinicInvoice', clinicInvoiceSchema);
