const ClinicPatient = require('../models/ClinicPatient');

const patientQuery = (req, id) => ({ clinicId: req.clinic._id, ...(id ? { _id: id } : {}) });
const getPatient = (req) => ClinicPatient.findOne(patientQuery(req, req.params.id));

exports.getPatients = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = patientQuery(req);
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];
    const [patients, total] = await Promise.all([
      ClinicPatient.find(query, '-sessions.teeth -periodontalExams.teeth').sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      ClinicPatient.countDocuments(query),
    ]);
    res.json({ success: true, patients, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createPatient = async (req, res) => {
  try {
    const { name, phone, gender, birthYear, address, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'اسم المريض مطلوب' });
    const patient = await ClinicPatient.create({ clinicId: req.clinic._id, name, phone, gender, birthYear, address, notes });
    res.status(201).json({ success: true, patient });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.getPatient = async (req, res) => {
  try {
    const patient = await getPatient(req);
    if (!patient) return res.status(404).json({ success: false, message: 'المريض غير موجود' });
    res.json({ success: true, patient });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updatePatient = async (req, res) => {
  try {
    const { name, phone, gender, birthYear, address, notes } = req.body;
    const patient = await ClinicPatient.findOneAndUpdate(patientQuery(req, req.params.id), { $set: { name, phone, gender, birthYear, address, notes } }, { new: true, runValidators: true });
    if (!patient) return res.status(404).json({ success: false, message: 'المريض غير موجود' });
    res.json({ success: true, patient });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.deletePatient = async (req, res) => {
  try { await ClinicPatient.findOneAndDelete(patientQuery(req, req.params.id)); res.json({ success: true, message: 'تم حذف ملف المريض' }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.addSession = async (req, res) => {
  try {
    const patient = await getPatient(req); if (!patient) return res.status(404).json({ success: false, message: 'المريض غير موجود' });
    const { date, title, notes, teeth } = req.body; patient.sessions.push({ date, title, notes, teeth: teeth || [] }); await patient.save();
    res.status(201).json({ success: true, patient });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.updateSession = async (req, res) => {
  try {
    const patient = await getPatient(req); if (!patient) return res.status(404).json({ success: false, message: 'المريض غير موجود' });
    const session = patient.sessions.id(req.params.sessionId); if (!session) return res.status(404).json({ success: false, message: 'الجلسة غير موجودة' });
    ['date', 'title', 'notes', 'teeth'].forEach(key => { if (req.body[key] !== undefined) session[key] = req.body[key]; }); await patient.save();
    res.json({ success: true, patient });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.deleteSession = async (req, res) => {
  try {
    const patient = await getPatient(req); if (!patient) return res.status(404).json({ success: false, message: 'المريض غير موجود' });
    patient.sessions.pull({ _id: req.params.sessionId }); await patient.save(); res.json({ success: true, patient });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.addMedia = async (req, res) => {
  try {
    const patient = await getPatient(req); if (!patient) return res.status(404).json({ success: false, message: 'المريض غير موجود' });
    const { url, type, tooth, title, note, capturedAt } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'رابط الملف مطلوب' });
    patient.media.push({ url, type, tooth: tooth || undefined, title, note, capturedAt }); await patient.save();
    res.status(201).json({ success: true, patient });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.deleteMedia = async (req, res) => {
  try { const patient = await getPatient(req); if (!patient) return res.status(404).json({ success: false, message: 'المريض غير موجود' }); patient.media.pull({ _id: req.params.mediaId }); await patient.save(); res.json({ success: true, patient }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.addPeriodontalExam = async (req, res) => {
  try { const patient = await getPatient(req); if (!patient) return res.status(404).json({ success: false, message: 'المريض غير موجود' }); patient.periodontalExams.push({ date: req.body.date, note: req.body.note, teeth: req.body.teeth || [] }); await patient.save(); res.status(201).json({ success: true, patient }); }
  catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.deletePeriodontalExam = async (req, res) => {
  try { const patient = await getPatient(req); if (!patient) return res.status(404).json({ success: false, message: 'المريض غير موجود' }); patient.periodontalExams.pull({ _id: req.params.examId }); await patient.save(); res.json({ success: true, patient }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.addEndodonticCase = async (req, res) => {
  try { const patient = await getPatient(req); if (!patient) return res.status(404).json({ success: false, message: 'المريض غير موجود' }); patient.endodonticCases.push(req.body); await patient.save(); res.status(201).json({ success: true, patient }); }
  catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.updateEndodonticCase = async (req, res) => {
  try { const patient = await getPatient(req); if (!patient) return res.status(404).json({ success: false, message: 'المريض غير موجود' }); const item = patient.endodonticCases.id(req.params.caseId); if (!item) return res.status(404).json({ success: false, message: 'الحالة غير موجودة' }); ['tooth', 'diagnosis', 'status', 'canals', 'notes', 'openedAt', 'completedAt'].forEach(key => { if (req.body[key] !== undefined) item[key] = req.body[key]; }); await patient.save(); res.json({ success: true, patient }); }
  catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.deleteEndodonticCase = async (req, res) => {
  try { const patient = await getPatient(req); if (!patient) return res.status(404).json({ success: false, message: 'المريض غير موجود' }); patient.endodonticCases.pull({ _id: req.params.caseId }); await patient.save(); res.json({ success: true, patient }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
