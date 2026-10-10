require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5100;

connectDB().then(() => {
  // Run subscription check every 6 hours
  const { checkAllSubscriptions } = require('./controllers/subscriptionController');
  checkAllSubscriptions().catch(console.error);
  setInterval(() => checkAllSubscriptions().catch(console.error), 6 * 60 * 60 * 1000);
});

app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:5180',
  'http://localhost:5180',
  'https://app.prootech-cloud.com',
  'https://dr-ayhamdarwish.com',
  'https://dash-dintist.euphoria-motiva.com',
];
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || ALLOWED_ORIGINS.includes(origin)),
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'طلبات كثيرة، حاول لاحقاً' });
app.use('/api/', limiter);

app.use('/api/product/auth', require('./routes/auth'));
app.use('/api/product/public', require('./routes/public'));
app.use('/api/product/admin', require('./routes/admin'));

// Clinic multi-tenant routes
app.use('/api/product/admin/clinics', require('./routes/clinicAdmin'));
app.use('/api/clinic/:slug/auth', require('./routes/clinicAuth'));
app.use('/api/clinic/:slug/dash', require('./routes/clinicDash'));
app.use('/api/clinic/:slug/public', require('./routes/clinicPublic'));

// Public: resolve custom domain to clinic slug
app.get('/api/clinic/by-domain', require('./controllers/clinicDashController').getClinicByDomain);

app.get('/api/product/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Serve frontend for custom clinic domains
const FRONTEND_DIST = path.join(__dirname, '../../frontend/dist');
app.use(express.static(FRONTEND_DIST));
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Product Platform Backend running on port ${PORT}`);
});
