// lib/db-firebase.js
const admin = require('firebase-admin');
const fs = require('fs');

function initFirebase(serviceAccountPath) {
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Service account JSON not found at ${serviceAccountPath}`);
  }
  const serviceAccount = require(serviceAccountPath);

  // avoid initializing twice in dev watch
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  const db = admin.firestore();

  return { admin, db };
}

module.exports = { initFirebase };
