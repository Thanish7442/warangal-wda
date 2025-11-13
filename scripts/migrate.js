/**
 * scripts/migrate-sqlite-to-firestore.js
 *
 * Reads from data/wda.db (SQLite) and writes documents to Firestore collections:
 * - admins -> admins
 * - students -> students
 * - fees -> fees
 * - contacts -> contacts  (optional, if table exists)
 *
 * Usage:
 *   node scripts/migrate-sqlite-to-firestore.js
 *
 * IMPORTANT:
 * - Make a backup of data/wda.db before running.
 * - Ensure FIREBASE_SERVICE_ACCOUNT is set in your .env (points to service account JSON).
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { initFirebase } = require('../lib/db-firebase');

const SQLITE_PATH = path.join(__dirname, '..', 'data', 'wda.db');

async function main() {
  if (!fs.existsSync(SQLITE_PATH)) {
    console.error('SQLite DB not found at', SQLITE_PATH);
    process.exit(1);
  }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('FIREBASE_SERVICE_ACCOUNT env var missing. Set it in .env (e.g., ./data/firebase-service-account.json)');
    process.exit(1);
  }

  // init firebase
  let firebase;
  try {
    firebase = initFirebase(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
    process.exit(1);
  }
  const dbFirestore = firebase.db;
  const FieldValue = firebase.admin.firestore.FieldValue;

  // open sqlite
  const sqliteDb = new sqlite3.Database(SQLITE_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('Failed to open sqlite DB:', err);
      process.exit(1);
    }
  });

  // helper: run SQL and return rows as Promise
  function allAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  // helper: write in batches (Firestore batch limit 500)
  async function writeInBatches(collectionName, docs) {
    const BATCH_LIMIT = 450; // safe < 500
    let i = 0;
    while (i < docs.length) {
      const batch = dbFirestore.batch();
      const slice = docs.slice(i, i + BATCH_LIMIT);
      slice.forEach(doc => {
        const ref = dbFirestore.collection(collectionName).doc(); // auto-id
        batch.set(ref, doc);
      });
      await batch.commit();
      console.log(`Wrote ${slice.length} docs to ${collectionName}`);
      i += BATCH_LIMIT;
    }
  }

  try {
    // 1) MIGRATE ADMINS (if exists)
    let rows = [];
    try {
      rows = await allAsync('SELECT * FROM admins');
      if (rows.length) {
        const docs = rows.map(r => {
          // keep password_hash as-is (already hashed); don't migrate plain text passwords
          return {
            username: r.username || '',
            password_hash: r.password_hash || '',
            created_at: r.created_at ? new Date(r.created_at) : FieldValue.serverTimestamp()
          };
        });
        await writeInBatches('admins', docs);
      } else {
        console.log('No rows in admins table (or table empty).');
      }
    } catch (err) {
      console.log('Skipping admins (table may not exist).', err.message || err);
    }

    // 2) MIGRATE STUDENTS
    try {
      rows = await allAsync('SELECT * FROM students');
      if (rows.length) {
        const docs = rows.map(r => {
          // try to normalize DOB to ISO if present
          let dob = null;
          if (r.dob) {
            try { dob = new Date(r.dob); if (isNaN(dob)) dob = null; } catch { dob = null; }
          }
          return {
            fullname: r.fullname || '',
            email: r.email || '',
            phone: r.phone || '',
            course: r.course || '',
            dob: dob ? dob : null,
            notes: r.notes || '',
            created_at: r.created_at ? new Date(r.created_at) : FieldValue.serverTimestamp()
          };
        });
        await writeInBatches('students', docs);
      } else {
        console.log('No rows in students table (or table empty).');
      }
    } catch (err) {
      console.log('Skipping students (table may not exist).', err.message || err);
    }

    // 3) MIGRATE FEES
    try {
      rows = await allAsync('SELECT * FROM fees');
      if (rows.length) {
        // Because fees in SQLite likely reference numeric student id,
        // we will store student_id as string matching the original numeric id in a field original_sqlite_student_id
        // so you can later map them if needed. Alternatively, if you prefer, you can attempt to map
        // to Firestore student doc IDs — but that requires reading inserted student docs first.
        const docs = rows.map(r => {
          let paid_on = null;
          if (r.paid_on) {
            try { paid_on = new Date(r.paid_on); if (isNaN(paid_on)) paid_on = null; } catch { paid_on = null; }
          }
          return {
            // we store original sqlite student id for manual mapping later
            original_student_id: r.student_id != null ? String(r.student_id) : null,
            student_id: r.student_id ? String(r.student_id) : null, // convenience (string)
            amount: Number(r.amount) || 0,
            method: r.method || '',
            note: r.note || '',
            paid_on: paid_on ? paid_on : FieldValue.serverTimestamp(),
            created_at: r.paid_on ? (paid_on ? paid_on : FieldValue.serverTimestamp()) : FieldValue.serverTimestamp()
          };
        });
        await writeInBatches('fees', docs);
      } else {
        console.log('No rows in fees table (or table empty).');
      }
    } catch (err) {
      console.log('Skipping fees (table may not exist).', err.message || err);
    }

    // 4) MIGRATE CONTACTS (optional)
    try {
      rows = await allAsync('SELECT * FROM contacts');
      if (rows.length) {
        const docs = rows.map(r => {
          return {
            name: r.name || r.fullname || '',
            email: r.email || '',
            phone: r.phone || '',
            message: r.message || r.notes || '',
            created_at: r.created_at ? new Date(r.created_at) : FieldValue.serverTimestamp()
          };
        });
        await writeInBatches('contacts', docs);
      } else {
        console.log('No rows in contacts table (or table empty).');
      }
    } catch (err) {
      console.log('Skipping contacts (table may not exist).', err.message || err);
    }

    // 5) OPTIONAL: create a mapping collection to correlate original sqlite ids -> new firestore ids
    // Note: above we kept original_student_id inside fee docs. If you want to map SQLite numeric student IDs
    // to Firestore document IDs, we must query Firestore students and match by unique fields (like fullname+phone/email).
    // That mapping depends on your data quality; implement only if necessary.

    console.log('Migration finished. Review Firestore console to confirm documents.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    sqliteDb.close();
    process.exit(0);
  }
}

main();
