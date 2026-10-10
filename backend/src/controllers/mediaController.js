const Media = require('../models/Media');
const { cloudinary } = require('../config/cloudinary');

exports.getMedia = async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 });
    res.json({ success: true, media });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم رفع أي ملف' });

    const media = await Media.create({
      title: req.body.title || req.file.originalname,
      url: req.file.path,
      publicId: req.file.filename,
      type: req.file.mimetype.startsWith('image') ? 'image' : 'file',
      size: req.file.size || 0,
      alt: req.body.alt || '',
    });

    res.status(201).json({ success: true, media });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ success: false, message: 'الملف غير موجود' });

    if (media.publicId) {
      await cloudinary.uploader.destroy(media.publicId);
    }

    await media.deleteOne();
    res.json({ success: true, message: 'تم حذف الملف' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
