# Dentovi — Claude animation implementation briefs

Project: GitLab `salemalnajjar7/dentel`, branch `feature/annual-subscription`.
Stack: React + Vite + JSX, Tailwind CSS, Framer Motion, Lucide, Arabic RTL. Preserve routing, business logic, user-data protections and individual clinic branding.

Design source:
- `frontend/public/dentovi-mark.svg`
- `frontend/public/dentovi-icon.svg`
- `frontend/public/dentovi-horizontal.svg`
- `frontend/src/components/shared/BrandLogo.jsx`
- `DENTOVI_BRAND_GUIDE.md`

Brand colors navy #0B2D4A; teal #0FB5A7; mint #A7EAD9; white #FFFFFF; charcoal #1F2937. Fonts Inter / Tajawal.

## 1. Hero and logo cinematic reveal (prompt for Claude)
Implement a polished 1.8-second Dentovi animated identity in React + Framer Motion. Start with a simple line-drawn silhouette of a tooth and elegantly form the D shape by scaling/path drawing, then fade/slide in 'Dentovi' wordmark, then the subtitle 'منصة إدارة عيادات الأسنان'. Smooth professional easing, no cartoon wiggles or harsh bounce. Use provided SVG vectors, never fabricate an unrelated logo. Run once on the public SaaS landing hero, do not block navigation or main content. Respect reduced motion, SSR-safe, accessible. Keep responsive 320-1920px, RTL site with the wordmark LTR. Code directly in repo, run build, describe changed files.

## 2. Loading animation
Create a short Dentovi product loading microanimation based on `frontend/src/components/public/LoadingScreen.jsx`. Animated SVG D arc draws itself (stroke dasharray) then tooth fades/settles in; subtitle appears softly; timing <= 1.5s; spinner/indicator responds to actual loading state rather than a fake fixed wait whenever existing app architecture allows. Never prevent interactivity or keep the screen overlay after the app is ready. Respect `prefers-reduced-motion`. No added heavyweight animation libraries.

## 3. Dashboard microinteractions
Apply restrained professional motion to the SaaS product-admin navigation and dashboards: active nav pill slides subtly, small stat card stagger 40-70ms, button hover 1-2px rise, modal opacity and 6-10px vertical entrance, success toasts 250ms. Avoid animating high-frequency dental records charts, destructive actions, patient data, or clinic-owned color themes. No layout shift or bounce; Framer Motion and Tailwind only. Support keyboard, focus-visible, reduced-motion and mobile.

## 4. Logo social reel animation
Create a 12-15 second 1080x1920 promotional animated HTML scene for Dentovi using React + CSS/Framer Motion (or pure HTML/CSS if more suitable), designed for screen recording at 30 fps. Start with scattered appointment cards and a quiet ordered transition into one Dentovi dashboard, then the stylized tooth+D forms and brand text 'Dentovi' appears, finally: 'كل عيادتك. بنظام واحد.' Use navy/teal only plus white/mint. Premium dental SaaS tone for large medical clinics. No claims like '2500 clinics', 'HIPAA certified', or unsupported uptime numbers. No fake customer testimonials. Text in Arabic must be accurate, RTL, Tajawal. Logo must remain consistent and not morph into another symbol. Provide a playable preview and production-ready files.

## 5. Website experience enhancement
Refine animation rhythm for `frontend/src/components/landing/Sections.jsx` and `frontend/src/components/public/Navbar.jsx`: subtle section reveal once on intersection, micro movement in product preview and CTA, pointer-precise hover, 60fps performance, avoid excessive blur/filter and parallax on mobile, ensure header contrast while scrolling. Keep link focus and all CTA behavior intact, no UI redesign without approval.

### Quality gate
No new paid services; avoid unapproved marketing claims; do not change `main`, do not publish live; run `npm run build` from `frontend` before claiming success. Return changed files, commit SHA and screenshots/video of the animation where supported. Keep animations subtle for a premium dental-clinic target audience.
