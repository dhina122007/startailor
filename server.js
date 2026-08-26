'use strict';

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const multer     = require('multer');
const nodemailer = require('nodemailer');
const Datastore  = require('nedb-promises');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Database ──────────────────────────────────────────────────
const db = {
  requirements:  Datastore.create({ filename: path.join(__dirname, 'data', 'requirements.db'),  autoload: true }),
  appointments:  Datastore.create({ filename: path.join(__dirname, 'data', 'appointments.db'),  autoload: true }),
};

// ── Email transporter ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST  || 'smtp.gmail.com',
  port:   parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

// ── File upload (reference images) ───────────────────────────
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `ref_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/i;
    if (allowed.test(path.extname(file.originalname)) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Helper: send email ────────────────────────────────────────
async function sendEmail({ subject, html }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[Email] Skipping — EMAIL_USER / EMAIL_PASS not set in .env');
    return;
  }
  await transporter.sendMail({
    from: `"Star Tailor Website" <${process.env.EMAIL_USER}>`,
    to:   process.env.EMAIL_TO || process.env.EMAIL_USER,
    subject,
    html,
  });
}

// ── Routes ────────────────────────────────────────────────────

/* POST /api/requirement
   Saves customer requirement to DB and emails notification. */
app.post('/api/requirement', upload.single('referenceImage'), async (req, res) => {
  try {
    const { fullName, phone, email, service, requiredDate, designDetails } = req.body;

    if (!fullName || !phone || !service) {
      return res.status(400).json({ success: false, message: 'Name, phone and service are required.' });
    }

    const record = {
      fullName,
      phone,
      email:        email || '',
      service,
      requiredDate: requiredDate || '',
      designDetails: designDetails || '',
      referenceImage: req.file ? req.file.filename : null,
      createdAt:    new Date().toISOString(),
    };

    await db.requirements.insert(record);

    // Send notification email (non-blocking)
    sendEmail({
      subject: `New Requirement — ${service} from ${fullName}`,
      html: `
        <h2 style="color:#2c2c2c;font-family:Georgia,serif;">New Customer Requirement</h2>
        <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px;">
          <tr><td style="padding:8px;border:1px solid #e0e0e0;font-weight:600;width:160px;">Name</td><td style="padding:8px;border:1px solid #e0e0e0;">${fullName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;font-weight:600;">Phone</td><td style="padding:8px;border:1px solid #e0e0e0;">${phone}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;font-weight:600;">Email</td><td style="padding:8px;border:1px solid #e0e0e0;">${email || '—'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;font-weight:600;">Service</td><td style="padding:8px;border:1px solid #e0e0e0;">${service}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;font-weight:600;">Required By</td><td style="padding:8px;border:1px solid #e0e0e0;">${requiredDate || '—'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;font-weight:600;">Design Details</td><td style="padding:8px;border:1px solid #e0e0e0;">${designDetails || '—'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;font-weight:600;">Reference Image</td><td style="padding:8px;border:1px solid #e0e0e0;">${req.file ? req.file.filename : 'None uploaded'}</td></tr>
        </table>
        <p style="font-size:12px;color:#888;margin-top:16px;">Received at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST via startailor.in</p>
      `,
    }).catch(console.error);

    res.json({ success: true, message: 'Thank you! Your requirement has been received. We will contact you soon.' });
  } catch (err) {
    console.error('[/api/requirement]', err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again or contact us directly.' });
  }
});

/* POST /api/appointment
   Sends appointment request email (no DB storage needed). */
app.post('/api/appointment', async (req, res) => {
  try {
    const { name, phone, email, service, preferredDate, preferredTime, message } = req.body;

    if (!name || !phone || !service) {
      return res.status(400).json({ success: false, message: 'Name, phone and service are required.' });
    }

    const record = {
      name, phone,
      email:         email || '',
      service,
      preferredDate: preferredDate || '',
      preferredTime: preferredTime || '',
      message:       message || '',
      createdAt:     new Date().toISOString(),
    };

    await db.appointments.insert(record);

    sendEmail({
      subject: `Appointment Request — ${service} from ${name}`,
      html: `
        <h2 style="color:#2c2c2c;font-family:Georgia,serif;">Appointment Request</h2>
        <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px;">
          <tr><td style="padding:8px;border:1px solid #e0e0e0;font-weight:600;width:160px;">Name</td><td style="padding:8px;border:1px solid #e0e0e0;">${name}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;font-weight:600;">Phone</td><td style="padding:8px;border:1px solid #e0e0e0;">${phone}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;font-weight:600;">Email</td><td style="padding:8px;border:1px solid #e0e0e0;">${email || '—'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;font-weight:600;">Service</td><td style="padding:8px;border:1px solid #e0e0e0;">${service}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;font-weight:600;">Preferred Date</td><td style="padding:8px;border:1px solid #e0e0e0;">${preferredDate || '—'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;font-weight:600;">Preferred Time</td><td style="padding:8px;border:1px solid #e0e0e0;">${preferredTime || '—'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;font-weight:600;">Message</td><td style="padding:8px;border:1px solid #e0e0e0;">${message || '—'}</td></tr>
        </table>
        <p style="font-size:12px;color:#888;margin-top:16px;">Received at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST via startailor.in</p>
      `,
    }).catch(console.error);

    res.json({ success: true, message: 'Appointment request received! We will call you to confirm.' });
  } catch (err) {
    console.error('[/api/appointment]', err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again or call us directly.' });
  }
});

/* GET /api/admin/requirements  (simple basic-auth protected) */
app.get('/api/admin/requirements', async (req, res) => {
  const auth = req.headers.authorization || '';
  const [type, creds] = auth.split(' ');
  if (type !== 'Basic') return res.status(401).json({ error: 'Unauthorized' });
  const [user, pass] = Buffer.from(creds || '', 'base64').toString().split(':');
  if (user !== (process.env.ADMIN_USER || 'admin') || pass !== (process.env.ADMIN_PASS || 'startailor2026')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const docs = await db.requirements.find({}).sort({ createdAt: -1 });
  res.json(docs);
});

/* GET /api/admin/appointments */
app.get('/api/admin/appointments', async (req, res) => {
  const auth = req.headers.authorization || '';
  const [type, creds] = auth.split(' ');
  if (type !== 'Basic') return res.status(401).json({ error: 'Unauthorized' });
  const [user, pass] = Buffer.from(creds || '', 'base64').toString().split(':');
  if (user !== (process.env.ADMIN_USER || 'admin') || pass !== (process.env.ADMIN_PASS || 'startailor2026')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const docs = await db.appointments.find({}).sort({ createdAt: -1 });
  res.json(docs);
});

// Catch-all: serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✨ Star Tailor server running at http://localhost:${PORT}\n`);
});
