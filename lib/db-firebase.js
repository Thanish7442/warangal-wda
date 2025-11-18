// lib/db-firebase.js
const admin = require('firebase-admin');
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * initFirebase accepts either:
 * - a path to a service account JSON file, or
 * - a raw JSON string (the full service account JSON) passed via env var.
 *
 * For environments like Render where it's easier to set a large JSON env var,
 * you can set `FIREBASE_SERVICE_ACCOUNT_JSON` to the JSON string and call
 * `initFirebase(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)`.
 */
function initFirebase(serviceAccountPathOrJson) {
  let serviceAccount = null;

  // Try treating the input as a path first
  try {
    if (serviceAccountPathOrJson && fs.existsSync(serviceAccountPathOrJson)) {
      serviceAccount = require(serviceAccountPathOrJson);
    }
  } catch (err) {
    // fallthrough to try parse as JSON string
  }

  // If not a path, try parsing as JSON string
  if (!serviceAccount) {
    try {
      if (!serviceAccountPathOrJson) throw new Error('No service account provided');
      // If the value looks like a path that doesn't exist, still try JSON parse
      serviceAccount = typeof serviceAccountPathOrJson === 'object' ? serviceAccountPathOrJson : JSON.parse(serviceAccountPathOrJson);
    } catch (err) {
      // If we still don't have a valid serviceAccount, throw helpful error
      throw new Error('Invalid Firebase service account: provide an existing file path or a valid JSON string');
    }
  }

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
