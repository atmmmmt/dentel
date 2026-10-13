# Dentovi — Hostinger single-app deployment

Use the branch `feature/annual-subscription` **only if that branch is available in the source repository connected to Hostinger**. A GitLab branch does not automatically appear in a GitHub-connected repository.

Hostinger -> Deploy Web App:
- Framework preset: Express
- Node: 22.x
- Package manager: npm
- Root directory: `.` (repository root; clear the former `backend`)
- Entry file: `backend/src/index.js`
- Build/install behavior: root `package.json` postinstall installs both backend and frontend, compiles frontend to `frontend/dist`, and Express serves it on the same origin.
- Environment variables must be entered in Hostinger hPanel, **never commit secrets**.
- `VITE_PLATFORM_HOST` must match the exact production host **at build time**, e.g. `dentovi.com`. This identifies the SaaS platform rather than a tenant domain.
- `PLATFORM_HOST` should match the same host, without `https://`; `PUBLIC_APP_URL` and `FRONTEND_URL` use `https://`.
- Add `MONGODB_URI`, `JWT_SECRET`, Cloudinary secrets, secure admin credentials, WhatsApp VAYRO keys when enabled.
- Set `NODE_ENV=production`; do not force `PORT` if Hostinger provides it.
- Make sure MongoDB Atlas connectivity allows Hostinger's production outbound IPs.
- Run smoke tests after deployment: `/api/product/health`, `/`, `/product-admin/login`, `/clinic/<slug>/login`, favicon, assets, and navigation refresh.
- Run the frontend build and backend smoke tests before calling this production-ready. This repository commit does not constitute a passing build or live deployment.
- Do not seed demo/test data into an existing production database.
- If Hostinger's builder disables postinstall or does not support nested npm scripts, use a VPS or prebuilt ZIP deployment instead; inspect build logs before changing settings.

## Important: fullstack build fix (October 2026)
The platform is **one Express application** serving its Vite React bundle from `frontend/dist`. A backend-only deployment fails with ENOENT for `frontend/dist/index.html`.

Hostinger Express deployment MUST use the GitHub repository holding the latest source:
- GitHub mirror: `atmmmmt/dentel` (Hostinger GitHub integration)
- Branch: `main`
- Root directory: `.` (repo root, **not backend**)
- Entry file: `backend/src/index.js`
- Node version: `22.x`
- Package manager: `npm`

The repository root now has a `postinstall` **and** `build` script using `scripts/hostinger-build.cjs`. Both install missing nested dependencies and compile `frontend/dist/index.html`. The script supports production `NODE_ENV` while explicitly including the frontend's Vite dev dependencies. In logs, look for `[Dentovi Build] Build React frontend to frontend/dist` and `Both backend and frontend are ready`.

If the Hostinger build UI exposes a build command, use `npm run build`. Test the compiled bundle with `npm run verify:build` locally. **Do not** choose Root directory `backend`; otherwise the frontend source is absent.

For the Hostinger preview domain `coral-goldfish-711868.hostingersite.com`, set:
```
FRONTEND_URL=https://coral-goldfish-711868.hostingersite.com
PUBLIC_APP_URL=https://coral-goldfish-711868.hostingersite.com
PLATFORM_HOST=coral-goldfish-711868.hostingersite.com
VITE_PLATFORM_HOST=coral-goldfish-711868.hostingersite.com
NODE_ENV=production
```
After DNS is attached to Dentovi's final domain, replace these values with the final domain and **redeploy** so the frontend Vite hostname is rebuilt.

Smoke-test `/api/product/health`, `/`, `/product-admin/login`, and the clinic login route. Restart alone does not re-run the frontend build; use Redeploy. Avoid publishing debug stack traces or committing environment secrets.
