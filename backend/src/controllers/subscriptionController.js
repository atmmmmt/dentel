const Clinic = require('../models/Clinic');
const { sendPlatformMessage } = require('../services/platformWhatsApp');

// ── Check & update subscription statuses (run periodically) ──────────────
exports.checkAllSubscriptions = async () => {
  const now = new Date();
  const clinics = await Clinic.find({ status: { $ne: 'suspended' } });

  for (const clinic of clinics) {
    let changed = false;

    // Trial expired → grace period
    if (clinic.subscriptionStatus === 'trial' && clinic.trialEndDate < now) {
      clinic.subscriptionStatus = 'grace_period';
      clinic.gracePeriodEnd = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      changed = true;
      await sendWhatsAppWarning(clinic, 'trial_expired');
    }

    // Active expired → grace period
    if (clinic.subscriptionStatus === 'active' && clinic.subscriptionEnd < now) {
      clinic.subscriptionStatus = 'grace_period';
      clinic.gracePeriodEnd = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      clinic.gracePeriodWarningSent = false;
      changed = true;
    }

    // Grace period expired → suspended
    if (clinic.subscriptionStatus === 'grace_period' && clinic.gracePeriodEnd < now) {
      clinic.subscriptionStatus = 'suspended';
      // Keep clinic account accessible for read-only medical record retrieval.
      // Subscription status, not account suspension, controls writes.
      changed = true;
      await sendWhatsAppWarning(clinic, 'suspended');
    }

    // Renewal reminder: 30 days (شهر) before subscription end
    if (
      clinic.subscriptionStatus === 'active' &&
      !clinic.renewalReminderSent &&
      clinic.subscriptionEnd &&
      (clinic.subscriptionEnd - now) < 30 * 24 * 60 * 60 * 1000
    ) {
      clinic.renewalReminderSent = true;
      changed = true;
      await sendWhatsAppWarning(clinic, 'renewal_reminder');
    }

    // Grace period warning: 3 days before grace ends
    if (
      clinic.subscriptionStatus === 'grace_period' &&
      !clinic.gracePeriodWarningSent &&
      clinic.gracePeriodEnd &&
      (clinic.gracePeriodEnd - now) < 3 * 24 * 60 * 60 * 1000
    ) {
      clinic.gracePeriodWarningSent = true;
      changed = true;
      await sendWhatsAppWarning(clinic, 'grace_warning');
    }

    if (changed) await clinic.save({ validateBeforeSave: false });
  }
};

// ── Send WhatsApp warning via Prootech's main WhatsApp ──────────────────
const sendWhatsAppWarning = async (clinic, type) => {
  const phone = clinic.whatsapp || clinic.phone;
  if (!phone) return;

  const messages = {
    trial_expired: `مرحباً ${clinic.doctorName}،\n\nانتهت فترة التجربة المجانية لنظام عيادتك.\nلديك 15 يوماً كفترة سماح لتجديد الاشتراك.\n\nللتجديد تواصل معنا الآن:\nProotech Agency`,
    renewal_reminder: `مرحباً د. ${String(clinic.doctorName).replace(/^(د\.|دكتور)\s*/, '')}،\n\nنذكّركم بأن اشتراك نظام «${clinic.clinicName}» سينتهي بعد شهر تقريباً (${clinic.subscriptionEnd ? new Date(clinic.subscriptionEnd).toLocaleDateString('ar-EG') : ''}).\nيرجى ترتيب التجديد خلال هذا الشهر لاستمرار الخدمة دون انقطاع.\n\nمع تحيات فريق Prootech`,
    grace_warning: `تنبيه هام - ${clinic.doctorName}\n\nلديك 3 أيام فقط قبل إيقاف نظام عيادتك.\nتواصل معنا فوراً للتجديد وتجنب الإيقاف.\n\nProotech Agency`,
    suspended: `${clinic.doctorName}،\n\nتم إيقاف نظام عيادتك مؤقتاً بسبب انتهاء الاشتراك.\nتواصل مع Prootech Agency لإعادة التفعيل.`,
  };

  const msg = messages[type];
  if (!msg) return;

  // Prootech's own number (VAYRO)
  await sendPlatformMessage(phone, msg);
};

// ── Renew subscription (admin action) ────────────────────────────────────
exports.renewSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { packagePrice } = req.body;
    const clinic = await Clinic.findById(id);
    if (!clinic) return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });

    const now = new Date();
    // أول تفعيل مدفوع = 13 شهر (سنة + شهر مجاني للجميع). التجديدات اللاحقة سنة/شهر عادي.
    const isFirstActivation = !clinic.subscriptionStart && (clinic.totalRevenue || 0) === 0;
    const months = isFirstActivation ? 13 : 12;
    const start = now;
    // Early renewal keeps the days already paid for: extend from the current end date.
    const stillActive = clinic.subscriptionStatus === 'active' && clinic.subscriptionEnd && clinic.subscriptionEnd > now;
    const end = new Date(stillActive ? clinic.subscriptionEnd : now);
    end.setMonth(end.getMonth() + months);

    clinic.subscriptionStatus = 'active';
    clinic.subscriptionStart = start;
    clinic.subscriptionEnd = end;
    clinic.gracePeriodEnd = null;
    clinic.billingCycle = 'yearly';
    clinic.package = 'Unified';
    clinic.status = 'active';
    clinic.renewalReminderSent = false;
    clinic.gracePeriodWarningSent = false;

    if (packagePrice !== undefined) {
      const amount = Number(packagePrice);
      if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ success: false, message: 'المبلغ المدفوع غير صالح' });
      clinic.packagePrice = amount;
      clinic.totalRevenue = (clinic.totalRevenue || 0) + amount;
    }

    await clinic.save({ validateBeforeSave: false });

    // Send success message to doctor
    await sendWhatsAppWarning(clinic, null);

    res.json({ success: true, clinic, message: 'تم تجديد الاشتراك' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get revenue stats ─────────────────────────────────────────────────────
exports.getRevenueStats = async (req, res) => {
  try {
    const clinics = await Clinic.find();
    const now = new Date();

    const totalRevenue = clinics.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
    const activeCount = clinics.filter(c => c.subscriptionStatus === 'active').length;
    const trialCount = clinics.filter(c => c.subscriptionStatus === 'trial').length;
    const graceCount = clinics.filter(c => c.subscriptionStatus === 'grace_period').length;
    const suspendedCount = clinics.filter(c => c.subscriptionStatus === 'suspended').length;
    const expiringSoon = clinics.filter(c =>
      c.subscriptionStatus === 'active' && c.subscriptionEnd &&
      (c.subscriptionEnd - now) < 30 * 24 * 60 * 60 * 1000
    ).length;

    // Monthly revenue (this month)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenue = clinics
      .filter(c => c.subscriptionStart >= thisMonth)
      .reduce((sum, c) => sum + (c.packagePrice || 0), 0);

    // Recent payments (clinics with subscription this month)
    const recentPayments = clinics
      .filter(c => c.subscriptionStart >= thisMonth)
      .sort((a, b) => b.subscriptionStart - a.subscriptionStart)
      .slice(0, 5)
      .map(c => ({
        clinicName: c.clinicName,
        doctorName: c.doctorName,
        amount: c.packagePrice,
        plan: c.billingCycle,
        package: c.package,
        date: c.subscriptionStart,
      }));

    res.json({
      success: true,
      stats: {
        totalRevenue, monthlyRevenue, activeCount, trialCount,
        graceCount, suspendedCount, expiringSoon,
        totalClinics: clinics.length,
      },
      recentPayments,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
