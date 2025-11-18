// scripts/list-admins.js
require('dotenv').config();
const path = require('path');

try {
  const { initFirebase } = require('../lib/db-firebase');

  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  console.log('Using FIREBASE_SERVICE_ACCOUNT →', svc);

  const firebase = initFirebase(svc);
  const db = firebase.db;

  (async () => {
    const snap = await db.collection('admins').get();
    console.log('Admins count:', snap.size);

    snap.forEach(doc => {
      console.log(' - ID:', doc.id, 'DATA:', doc.data());
    });

    process.exit(0);
  })();

} catch (err) {
  console.error('LIST ADMINS ERROR:', err && err.stack ? err.stack : err);
  process.exit(1);
}
