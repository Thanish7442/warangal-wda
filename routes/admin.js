// routes/admin.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const admin = require('firebase-admin'); // ensure firebase-admin is initialized in your main server file
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'wda.db'); // safer absolute-ish path
const db = new sqlite3.Database(DB_FILE);

/** helpers */
function findAdminByEmail(email, callback) {
  db.get(`SELECT * FROM admins WHERE email = ?`, [email], (err, row) => {
    if (err) return callback(err);
    callback(null, row || null);
  });
}
function findAdminByUsername(username, callback) {
  db.get(`SELECT * FROM admins WHERE username = ?`, [username], (err, row) => {
    if (err) return callback(err);
    callback(null, row || null);
  });
}

/** requireAuth middleware:
 *  - accepts session-based req.session.admin
 *  - accepts Authorization: Bearer <idToken>
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.admin && req.session.admin.id) {
    return next();
  }

  const authHeader = (req.headers.authorization || '').trim();
  if (authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1];
    return admin.auth().verifyIdToken(idToken)
      .then(decoded => {
        const email = decoded.email || null;
        if (!email) return res.redirect('/admin/login');

        findAdminByEmail(email, (err, adminRow) => {
          if (err) {
            console.error('DB error checking admin by email:', err);
            return res.redirect('/admin/login');
          }
          if (!adminRow) return res.redirect('/admin/login');

          // attach session for downstream compatibility
          req.session = req.session || {};
          req.session.admin = { id: adminRow.id, username: adminRow.username, email: adminRow.email };
          return next();
        });
      })
      .catch(err => {
        console.warn('Firebase token verify failed:', err);
        return res.redirect('/admin/login');
      });
  }

  // fallback: not authorized
  return res.redirect('/admin/login');
}

/* TEMP debug route */
router.get('/debug/list-admins', (req, res) => {
  db.all('SELECT id, username, email, password_hash FROM admins', (err, rows) => {
    if (err) return res.status(500).send('DB error: ' + err.message);
    const safe = rows.map(r => ({ id: r.id, username: r.username, email: r.email, has_hash: !!r.password_hash }));
    res.json(safe);
  });
});

/* ---------- ROUTES ---------- */

// render login page (legacy)
router.get('/login', (req, res) => {
  res.render('admin/login', { title: 'Admin Login', error: null });
});

/**
 * POST /admin/login
 * Accepts:
 *  - JSON { idToken }  (from frontend Firebase client)  OR
 *  - form-encoded username & password (legacy)
 */
router.post('/login', (req, res) => {
  // Support either JSON body or form-encoded
  const idToken = (req.body && req.body.idToken) || null;
  const username = (req.body && req.body.username) || null;
  const password = (req.body && req.body.password) || null;

  // 1) If idToken provided -> verify and login by email
  if (idToken) {
    return admin.auth().verifyIdToken(idToken)
      .then(decoded => {
        const email = decoded.email || null;
        if (!email) return res.status(400).send('Invalid token (no email)');

        findAdminByEmail(email, (err, row) => {
          if (err) {
            console.error('DB error', err);
            return res.status(500).send('Server error');
          }
          if (!row) {
            return res.status(403).send('Not authorized');
          }

          // Set session and respond success (redirect or JSON)
          req.session = req.session || {};
          req.session.admin = { id: row.id, username: row.username, email: row.email };

          // If request expects JSON (fetch), return 200 OK JSON, otherwise redirect
          if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
            return res.json({ ok: true, uid: row.id, username: row.username });
          }
          return res.redirect('/admin');
        });
      })
      .catch(err => {
        console.error('Failed to verify idToken:', err);
        return res.status(401).send('Invalid token');
      });
  }

  // 2) Legacy username/password flow
  if (!username || !password) {
    return res.render('admin/login', { title: 'Admin Login', error: 'Missing credentials' });
  }

  findAdminByUsername(username, async (err, row) => {
    if (err) {
      console.error('DB error', err);
      return res.render('admin/login', { title: 'Admin Login', error: 'Server error' });
    }
    if (!row) {
      return res.render('admin/login', { title: 'Admin Login', error: 'Invalid username or password' });
    }

    try {
      const ok = await bcrypt.compare(password, row.password_hash);
      if (!ok) {
        return res.render('admin/login', { title: 'Admin Login', error: 'Invalid username or password' });
      }

      req.session = req.session || {};
      req.session.admin = { id: row.id, username: row.username, email: row.email };
      return res.redirect('/admin');
    } catch (bcryptErr) {
      console.error('bcrypt compare error', bcryptErr);
      return res.render('admin/login', { title: 'Admin Login', error: 'Server error' });
    }
  });
});

// Logout
router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.redirect('/admin/login');
    });
  } else {
    res.redirect('/admin/login');
  }
});

// Admin dashboard and other routes unchanged (they use requireAuth)
router.get('/', requireAuth, (req, res) => {
  db.serialize(() => {
    db.get(`SELECT COUNT(*) AS cnt FROM students`, (err, srow) => {
      db.get(`SELECT COUNT(*) AS cnt FROM fees`, (err2, frow) => {
        db.all(`SELECT * FROM students ORDER BY created_at DESC LIMIT 8`, (err3, students) => {
          db.all(`SELECT fees.*, students.fullname FROM fees LEFT JOIN students ON fees.student_id = students.id ORDER BY paid_on DESC LIMIT 8`, (err4, fees) => {
            res.render('admin/dashboard', {
              title: 'Admin - Dashboard',
              admin: req.session.admin,
              stats: { students: srow?.cnt || 0, fees: frow?.cnt || 0 },
              students: students || [],
              fees: fees || []
            });
          });
        });
      });
    });
  });
});

/* STUDENT CRUD */
// ... keep the rest of your routes as-is (no changes needed) ...

module.exports = router;
