const Lead = require('../models/Lead');
const ProductSettings = require('../models/ProductSettings');
const { sendWhatsApp, buildThankYouMessage } = require('../services/whatsappService');

exports.submitLead = async (req, res) => {
  try {
    const lead = await Lead.create(req.body);
    res.status(201).json({ success: true, message: 'تم إرسال طلبك بنجاح، سنتواصل معك قريباً', lead });

    // Fire-and-forget auto-reply
    const whatsappTarget = lead.whatsapp || lead.phone;
    if (whatsappTarget) {
      try {
        const settings = await ProductSettings.findOne({ singleton: 'main' });
        if (settings?.autoReplyEnabled && settings?.whatsappApiKey) {
          const msg = buildThankYouMessage(settings.autoReplyMessage, lead.doctorName);
          await sendWhatsApp(whatsappTarget, msg, settings.whatsappApiKey);
        }
      } catch (e) {
        console.error('[auto-reply]', e.message);
      }
    }
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getLeads = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { doctorName: { $regex: search, $options: 'i' } },
        { clinicName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, leads, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead) return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    res.json({ success: true, lead });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    res.json({ success: true, message: 'تم الحذف' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalLeads = await Lead.countDocuments();
    const demoRequests = await Lead.countDocuments({ wantsDemo: true });
    const newLeads = await Lead.countDocuments({ status: 'new' });
    const wonLeads = await Lead.countDocuments({ status: 'won' });

    const packageStats = await Lead.aggregate([
      { $match: { selectedPackage: { $ne: '' } } },
      { $group: { _id: '$selectedPackage', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const recentLeads = await Lead.find().sort({ createdAt: -1 }).limit(5);

    // Revenue: sum of actualPaidAmount across all leads
    const revenueAgg = await Lead.aggregate([
      { $match: { actualPaidAmount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$actualPaidAmount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Domain requests
    const domainRequests = await Lead.countDocuments({ wantsDomain: true });

    res.json({
      success: true,
      stats: {
        totalLeads,
        demoRequests,
        newLeads,
        wonLeads,
        topPackage: packageStats[0]?._id || '—',
        totalRevenue,
        domainRequests,
      },
      recentLeads,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
