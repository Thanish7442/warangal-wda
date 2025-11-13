// scripts/init-db.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const DB_FILE = './data/wda.db';
const db = new sqlite3.Database(DB_FILE);

async function run() {
  db.serialize(async () => {
    // Create folders if needed (create 'data' folder manually in project or ensure existence)
    db.run(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT,
        email TEXT,
        phone TEXT,
        course TEXT,
        dob TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        amount REAL,
        paid_on DATETIME DEFAULT CURRENT_TIMESTAMP,
        method TEXT,
        note TEXT,
        FOREIGN KEY(student_id) REFERENCES students(id)
      );
    `);

    // Create a default admin if none exists
    db.get(`SELECT COUNT(*) as cnt FROM admins`, async (err, row) => {
      if (err) return console.error(err);
      if (row.cnt === 0) {
        const defaultUser = 'admin';
        const defaultPass = 'password123'; // change after first login
        const hash = await bcrypt.hash(defaultPass, 10);
        db.run(`INSERT INTO admins (username, password_hash) VALUES (?, ?)`, [defaultUser, hash], function(err2) {
          if (err2) return console.error('Error creating default admin:', err2);
          console.log('Created default admin -> username: admin  password:', defaultPass);
          console.log('Please change this password after first login.');
          process.exit(0);
        });
      } else {
        console.log('Admin user exists — no default admin created.');
        process.exit(0);
      }
    });
  });
}

run().catch(console.error);
