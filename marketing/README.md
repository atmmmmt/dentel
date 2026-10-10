# حقيبة التسويق — Prootech

افتح `index.html` لمشاهدة الأفكار الخمس، الفيديوهات، الكاروسيلات، والكابشن الجاهز للنسخ.

| الملف | المقاس | الوصف |
|---|---|---|
| `videos/01-day-without-paper.mp4` | 1080×1920 · 18 ث | يوم بلا دفتر — قبل/بعد |
| `videos/02-your-name-online.mp4` | 1080×1920 · 16 ث | اسمك على الإنترنت — الدومين والحجز |
| `videos/03-vip-waiting-room.mp4` | 1080×1920 · 15 ث | غرفة انتظار VIP (مع صوت النداء) |
| `carousels/01-monthly-loss/` | 6 × 1080×1350 | كم تخسر عيادتك كل شهر؟ |
| `carousels/02-ready-in-48h/` | 6 × 1080×1350 | جاهز خلال 48 ساعة + عرض 13 شهراً |

## التعديل وإعادة التصدير
المصادر في `src/` (HTML بنفس هوية المنصة: IBM Plex Sans Arabic + Inter، كحلي `#0B2A40`، تركواز `#1FA6A6`).
افتح أي ملف فيديو في المتصفح لمعاينته متحركاً، ثم صدّره:

```bash
npm i puppeteer-core@23.11.1
node render.js video src/video1-day.html videos/01-day-without-paper.mp4 18
node render.js video src/video3-waiting.html videos/03-vip-waiting-room.mp4 15 --audio src/audio/chime.wav
node render.js slides src/carousel1-loss.html carousels/01-monthly-loss/slide
```
يتطلب Google Chrome و ffmpeg.
