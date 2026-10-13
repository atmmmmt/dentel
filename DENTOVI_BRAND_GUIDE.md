# Dentovi — brand identity (v1)

## Positioning
Dentovi is a premium, all-in-one dental clinic management platform. Arabic: **دينتوفي — منصة إدارة عيادات الأسنان**. Audience: modern dental clinics, multi-chair practices and dental centers.

## Visual system
- Navy (primary): `#0B2D4A`
- Teal (brand accent and primary action): `#0FB5A7`
- Hover teal: `#078C86`
- Mint (soft accent): `#A7EAD9`
- White: `#FFFFFF`
- Charcoal: `#1F2937`
- Secondary text: `#728197`

Arabic typography: **Tajawal**. English typography: **Inter**. Default RTL for Arabic; render the English wordmark LTR.

## Asset inventory
- `frontend/public/dentovi-horizontal.svg` — horizontal lockup for presentations and marketing.
- `frontend/public/dentovi-mark.svg` — standalone D / tooth mark for UI.
- `frontend/public/dentovi-icon.svg` — square app icon, also used as favicon.
- `frontend/public/favicon.svg` — favicon identical to app icon.
- `frontend/src/components/shared/BrandLogo.jsx` — responsive React wordmark implementation.

## Usage rules
- Keep icon proportions; provide enough clear space.
- For websites and dashboard headers use the React BrandLogo component.
- Dark hero / navy backgrounds use `<BrandLogo light />`; white backgrounds use default.
- Never override the individual **clinic-owned** logo, website colors, or domain.
- A brand symbol should never replace a functioning control or obscure patient information.
- Marketing animations respect `prefers-reduced-motion`.
- Avoid claims about customers, uptime, compliance certification, or case studies unless verifiable.
- PROOTECH AGENCY may appear as developer credit where contractually appropriate; it must not replace the product name.
- The SVG logo assets are original vector approximations of the approved visual board; verify against design sign-off before production exports.
