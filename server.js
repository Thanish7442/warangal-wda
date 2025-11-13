// server.js (cleaned - OpenAI removed)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcrypt');
const { initFirebase } = require('./lib/db-firebase');

const app = express();
const PORT = process.env.PORT || 3000;

/* -------------------------
   Basic setup
   ------------------------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

/* Sessions */
if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'));
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: './data' }),
  secret: process.env.SESSION_SECRET || 'replace-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 4 }
}));

/* make session admin available to views */
app.use((req, res, next) => {
  res.locals.admin = req.session?.admin || null;
  next();
});

/* -------------------------
   Initialize Firestore
   ------------------------- */
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountPath) {
  console.error('FIREBASE_SERVICE_ACCOUNT not set in .env (expected path to service account JSON).');
  process.exit(1);
}
let firebase;
try {
  firebase = initFirebase(serviceAccountPath); // returns { admin, db }
  console.log('Initialized Firebase Firestore');
} catch (err) {
  console.error('Failed to init Firebase:', err);
  process.exit(1);
}
const db = firebase.db;

/* Ensure default admin exists */
(async () => {
  try {
    const snap = await db.collection('admins').limit(1).get();
    if (snap.empty) {
      const defaultUser = 'admin';
      const defaultPass = 'password123';
      const hash = await bcrypt.hash(defaultPass, 10);
      await db.collection('admins').add({
        username: defaultUser,
        password_hash: hash,
        created_at: firebase.admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Created default admin: ${defaultUser} / ${defaultPass} (change immediately)`);
    } else {
      console.log('Admin exists in Firestore.');
    }
  } catch (err) {
    console.error('Error ensuring default admin exists:', err);
  }
})();

/* -------------------------
   Public routes
   ------------------------- */
app.get('/', (req, res) => res.render('index', { title: 'Warangal Defence Academy' }));
app.get('/about', (req, res) => res.render('about', { title: 'About - WDA' }));
app.get('/courses', (req, res) => res.render('courses', { title: 'Courses - WDA' }));
app.get('/contact', (req, res) => res.render('contact', { title: 'Contact - WDA', success: false }));

app.post('/contact', async (req, res) => {
  try {
    console.log('Contact submission:', req.body);
    await db.collection('contacts').add({ ...req.body, created_at: firebase.admin.firestore.FieldValue.serverTimestamp() });
    return res.render('contact', { title: 'Contact - WDA', success: true });
  } catch (err) {
    console.error('Contact save error:', err);
    return res.render('contact', { title: 'Contact - WDA', success: false });
  }
});

/* Optional chat placeholder page (no AI) */
app.get('/chat', (req, res) => res.render('chat', { title: 'Chat - WDA' }));

/* -------------------------
   Admin routes (Firestore-backed)
   ------------------------- */
function requireAdmin(req, res, next) {
  if (req.session?.admin?.id) return next();
  return res.redirect('/admin/login');
}

app.get('/admin/login', (req, res) => res.render('admin/login', { title: 'Admin Login', error: null }));

app.post('/admin/login', async (req, res) => {
  try {
    console.log('[ADMIN LOGIN] body:', req.body);
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.render('admin/login', { title: 'Admin Login', error: 'Please enter username and password' });
    }

    const q = await db.collection('admins').where('username', '==', username).limit(1).get();
    if (q.empty) return res.render('admin/login', { title: 'Admin Login', error: 'Invalid username or password' });

    const doc = q.docs[0];
    const adminData = doc.data();
    if (!adminData.password_hash) {
      console.error('[ADMIN LOGIN] admin missing password_hash:', adminData);
      return res.render('admin/login', { title: 'Admin Login', error: 'Server problem with admin record' });
    }

    const ok = await bcrypt.compare(password, adminData.password_hash);
    if (!ok) return res.render('admin/login', { title: 'Admin Login', error: 'Invalid username or password' });

    req.session.admin = { id: doc.id, username: adminData.username };
    console.log(`[ADMIN LOGIN] success for ${username}`);
    return res.redirect('/admin');
  } catch (err) {
    console.error('[ADMIN LOGIN] Unexpected error:', err);
    return res.render('admin/login', { title: 'Admin Login', error: 'Server error — check logs' });
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

/* Admin dashboard */
app.get('/admin', requireAdmin, async (req, res) => {
  try {
    const studentsSnap = await db.collection('students').orderBy('created_at', 'desc').limit(8).get();
    const feesSnap = await db.collection('fees').orderBy('paid_on', 'desc').limit(8).get();
    const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const fees = feesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const studentsCount = (await db.collection('students').get()).size;
    const feesCount = (await db.collection('fees').get()).size;

    res.render('admin/dashboard', { title: 'Admin Dashboard', admin: req.session.admin, stats: { students: studentsCount, fees: feesCount }, students, fees });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.render('admin/dashboard', { title: 'Admin Dashboard', admin: req.session.admin, stats: { students: 0, fees: 0 }, students: [], fees: [] });
  }
});

/* STUDENT CRUD */
app.get('/admin/students', requireAdmin, async (req, res) => {
  try {
    const snap = await db.collection('students').orderBy('created_at', 'desc').get();
    const students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.render('admin/students', { title: 'Students', admin: req.session.admin, students });
  } catch (err) {
    console.error('List students error:', err);
    res.render('admin/students', { title: 'Students', admin: req.session.admin, students: [] });
  }
});

app.get('/admin/students/new', requireAdmin, (req, res) => res.render('admin/student_form', { title: 'Add Student', admin: req.session.admin, student: null }));

app.post('/admin/students', requireAdmin, async (req, res) => {
  try {
    const { fullname, email, phone, course, dob, notes } = req.body;
    await db.collection('students').add({ fullname, email, phone, course, dob: dob || null, notes, created_at: firebase.admin.firestore.FieldValue.serverTimestamp() });
    res.redirect('/admin/students');
  } catch (err) {
    console.error('Create student error:', err);
    res.redirect('/admin/students');
  }
});

app.get('/admin/students/:id/edit', requireAdmin, async (req, res) => {
  try {
    const doc = await db.collection('students').doc(req.params.id).get();
    if (!doc.exists) return res.redirect('/admin/students');
    res.render('admin/student_form', { title: 'Edit Student', admin: req.session.admin, student: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error('Edit student error:', err);
    res.redirect('/admin/students');
  }
});

app.post('/admin/students/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { fullname, email, phone, course, dob, notes } = req.body;
    await db.collection('students').doc(id).update({ fullname, email, phone, course, dob: dob || null, notes });
    res.redirect('/admin/students');
  } catch (err) {
    console.error('Update student error:', err);
    res.redirect('/admin/students');
  }
});

app.post('/admin/students/:id/delete', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    await db.collection('students').doc(id).delete();
    // delete fees referencing this student
    const feesSnap = await db.collection('fees').where('student_id', '==', id).get();
    const batch = db.batch();
    feesSnap.forEach(d => batch.delete(d.ref));
    await batch.commit();
    res.redirect('/admin/students');
  } catch (err) {
    console.error('Delete student error:', err);
    res.redirect('/admin/students');
  }
});

/* FEES */
app.get('/admin/fees', requireAdmin, async (req, res) => {
  try {
    const snap = await db.collection('fees').orderBy('paid_on', 'desc').get();
    const fees = [];
    for (const d of snap.docs) {
      const data = d.data();
      let fullname = 'Unknown';
      if (data.student_id) {
        const sdoc = await db.collection('students').doc(data.student_id).get();
        if (sdoc.exists) fullname = sdoc.data().fullname;
      }
      fees.push({ id: d.id, fullname, ...data });
    }
    res.render('admin/fees', { title: 'Fees', admin: req.session.admin, fees });
  } catch (err) {
    console.error('List fees error:', err);
    res.render('admin/fees', { title: 'Fees', admin: req.session.admin, fees: [] });
  }
});

app.get('/admin/fees/new', requireAdmin, async (req, res) => {
  try {
    const snap = await db.collection('students').orderBy('fullname').get();
    const students = snap.docs.map(d => ({ id: d.id, fullname: d.data().fullname }));
    res.render('admin/fee_form', { title: 'Add Fee', admin: req.session.admin, students });
  } catch (err) {
    console.error('Add fee form error:', err);
    res.render('admin/fee_form', { title: 'Add Fee', admin: req.session.admin, students: [] });
  }
});

app.post('/admin/fees', requireAdmin, async (req, res) => {
  try {
    const { student_id, amount, method, note } = req.body;
    await db.collection('fees').add({ student_id: student_id || null, amount: Number(amount) || 0, method: method || 'cash', note: note || '', paid_on: firebase.admin.firestore.FieldValue.serverTimestamp() });
    res.redirect('/admin/fees');
  } catch (err) {
    console.error('Create fee error:', err);
    res.redirect('/admin/fees');
  }
});

app.post('/admin/fees/:id/delete', requireAdmin, async (req, res) => {
  try {
    await db.collection('fees').doc(req.params.id).delete();
    res.redirect('/admin/fees');
  } catch (err) {
    console.error('Delete fee error:', err);
    res.redirect('/admin/fees');
  }
});

/* 404 & error handler */
app.use((req, res) => res.status(404).render('404', { title: 'Page not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Server error');
});

/* Start server */
app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
