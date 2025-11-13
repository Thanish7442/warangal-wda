// routes/admin.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const DB_FILE = './data/wda.db';
const db = new sqlite3.Database(DB_FILE);

// Middleware: require login
function requireAuth(req, res, next) {
  if (req.session && req.session.admin && req.session.admin.id) return next();
  return res.redirect('/admin/login');
}

// Login page
router.get('/login', (req, res) => {
  res.render('admin/login', { title: 'Admin Login', error: null });
});

// Login POST
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM admins WHERE username = ?`, [username], async (err, row) => {
    if (err) {
      console.error(err);
      return res.render('admin/login', { title: 'Admin Login', error: 'Server error' });
    }
    if (!row) {
      return res.render('admin/login', { title: 'Admin Login', error: 'Invalid username or password' });
    }
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return res.render('admin/login', { title: 'Admin Login', error: 'Invalid username or password' });
    }
    // Set session
    req.session.admin = { id: row.id, username: row.username };
    return res.redirect('/admin');
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// Admin dashboard
router.get('/', requireAuth, (req, res) => {
  // Fetch counts and recent entries
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

// List students
router.get('/students', requireAuth, (req, res) => {
  db.all(`SELECT * FROM students ORDER BY created_at DESC`, (err, rows) => {
    res.render('admin/students', { title: 'Students', admin: req.session.admin, students: rows || [] });
  });
});

// New student form
router.get('/students/new', requireAuth, (req, res) => {
  res.render('admin/student_form', { title: 'Add Student', admin: req.session.admin, student: null });
});

// Create student
router.post('/students', requireAuth, (req, res) => {
  const { fullname, email, phone, course, dob, notes } = req.body;
  db.run(`INSERT INTO students (fullname,email,phone,course,dob,notes) VALUES (?,?,?,?,?,?)`,
    [fullname, email, phone, course, dob, notes],
    function(err) {
      if (err) {
        console.error(err);
        return res.redirect('/admin/students');
      }
      res.redirect('/admin/students');
    });
});

// Edit student
router.get('/students/:id/edit', requireAuth, (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM students WHERE id = ?`, [id], (err, row) => {
    res.render('admin/student_form', { title: 'Edit Student', admin: req.session.admin, student: row || null });
  });
});

router.post('/students/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const { fullname, email, phone, course, dob, notes } = req.body;
  db.run(`UPDATE students SET fullname=?,email=?,phone=?,course=?,dob=?,notes=? WHERE id=?`,
    [fullname, email, phone, course, dob, notes, id],
    function(err) {
      if (err) console.error(err);
      res.redirect('/admin/students');
    });
});

// Delete student
router.post('/students/:id/delete', requireAuth, (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM students WHERE id=?`, [id], function(err) {
    if (err) console.error(err);
    // Also delete their fees
    db.run(`DELETE FROM fees WHERE student_id=?`, [id], function(err2) {
      if (err2) console.error(err2);
      res.redirect('/admin/students');
    });
  });
});

/* FEES / PAYMENTS */

// List fees
router.get('/fees', requireAuth, (req, res) => {
  db.all(`SELECT fees.*, students.fullname FROM fees LEFT JOIN students ON fees.student_id = students.id ORDER BY paid_on DESC`, (err, rows) => {
    res.render('admin/fees', { title: 'Fees', admin: req.session.admin, fees: rows || [] });
  });
});

// New fee form
router.get('/fees/new', requireAuth, (req, res) => {
  db.all(`SELECT id, fullname FROM students ORDER BY fullname`, (err, rows) => {
    res.render('admin/fee_form', { title: 'Add Fee', admin: req.session.admin, students: rows || [] });
  });
});

// Create fee
router.post('/fees', requireAuth, (req, res) => {
  const { student_id, amount, method, note } = req.body;
  db.run(`INSERT INTO fees (student_id, amount, method, note) VALUES (?,?,?,?)`,
    [student_id || null, amount || 0, method || 'cash', note || ''],
    function(err) {
      if (err) console.error(err);
      res.redirect('/admin/fees');
    });
});

// Delete fee
router.post('/fees/:id/delete', requireAuth, (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM fees WHERE id=?`, [id], function(err) {
    if (err) console.error(err);
    res.redirect('/admin/fees');
  });
});

module.exports = router;
