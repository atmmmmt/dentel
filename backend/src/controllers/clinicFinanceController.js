const ClinicInvoice = require('../models/ClinicInvoice');
const ClinicPatient = require('../models/ClinicPatient');

const crypto = require('crypto');
const invoiceNumber = () => `INV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
const scope = req => ({ clinicId: req.clinic._id });
const escapeRegex = value => String(value).replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '');

exports.getInvoices = async (req, res) => {
  try {
    const { search = '', status, page = 1, limit = 30 } = req.query;
    const filter = scope(req);
    if (status && status !== 'all') filter.status = status;
    if (search) filter.$or = [
      { number: { $regex: escapeRegex(search), $options: 'i' } },
      { patientName: { $regex: escapeRegex(search), $options: 'i' } },
      { patientPhone: { $regex: escapeRegex(search), $options: 'i' } },
    ];
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [invoices, total] = await Promise.all([
      ClinicInvoice.find(filter).sort({ issuedAt: -1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      ClinicInvoice.countDocuments(filter),
    ]);
    res.json({ success: true, invoices, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getSummary = async (req, res) => {
  try {
    const invoices = await ClinicInvoice.find(scope(req), 'total paidAmount balance status currency issuedAt dueDate');
    const byCurrency = invoices.reduce((acc, invoice) => {
      const currency = invoice.currency || 'USD';
      const item = acc[currency] || { currency, billed: 0, collected: 0, outstanding: 0, overdue: 0 };
      item.billed += invoice.total; item.collected += invoice.paidAmount; item.outstanding += invoice.balance;
      if (invoice.status !== 'paid' && invoice.status !== 'void' && invoice.dueDate && invoice.dueDate < new Date()) item.overdue += invoice.balance;
      acc[currency] = item; return acc;
    }, {});
    res.json({ success: true, summary: Object.values(byCurrency) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createInvoice = async (req, res) => {
  try {
    const { patientId, items, discount, dueDate, currency, notes } = req.body;
    const patient = await ClinicPatient.findOne({ _id: patientId, clinicId: req.clinic._id });
    if (!patient) return res.status(400).json({ success: false, message: 'المريض غير موجود' });
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ success: false, message: 'أضف بنداً واحداً على الأقل' });
    const invoice = await ClinicInvoice.create({
      clinicId: req.clinic._id, number: invoiceNumber(), patientId: patient._id,
      patientName: patient.name, patientPhone: patient.phone, items, discount, dueDate: dueDate || undefined, currency, notes,
    });
    res.status(201).json({ success: true, invoice });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await ClinicInvoice.findOne({ _id: req.params.id, ...scope(req) });
    if (!invoice) return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    ['items', 'discount', 'dueDate', 'currency', 'notes'].forEach(key => { if (req.body[key] !== undefined) invoice[key] = req.body[key]; });
    if (invoice.status === 'void') return res.status(409).json({ success: false, message: 'لا يمكن تعديل فاتورة ملغاة' });
    await invoice.save();
    res.json({ success: true, invoice });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.addPayment = async (req, res) => {
  try {
    const invoice = await ClinicInvoice.findOne({ _id: req.params.id, ...scope(req) });
    if (!invoice) return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    if (invoice.status === 'void') return res.status(409).json({ success: false, message: 'لا يمكن دفع فاتورة ملغاة' });
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > invoice.balance) return res.status(400).json({ success: false, message: 'قيمة الدفعة غير صالحة' });
    invoice.payments.push({ amount, method: req.body.method, note: req.body.note, paidAt: req.body.paidAt || new Date() });
    await invoice.save();
    res.json({ success: true, invoice });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.voidInvoice = async (req, res) => {
  try {
    const invoice = await ClinicInvoice.findOne({ _id: req.params.id, ...scope(req) });
    if (!invoice) return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    if (invoice.paidAmount > 0) return res.status(400).json({ success: false, message: 'لا يمكن إلغاء فاتورة تحتوي على دفعات' });
    invoice.status = 'void'; await invoice.save();
    res.json({ success: true, invoice });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getCollections = async (req, res) => {
  try {
    const invoices = await ClinicInvoice.find({ ...scope(req), status: { $in: ['unpaid', 'partial'] }, balance: { $gt: 0 } }).sort({ balance: -1 });
    res.json({ success: true, invoices });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
