import * as admin from 'firebase-admin';
import { join } from 'path';
import { readFileSync } from 'fs';

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  join(__dirname, 'serviceAccountKey.json');

let initialized = false;
try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    initialized = true;
  }
} catch (err) {
  console.warn('⚠️ Firebase not initialized. Missing or invalid service account file.');
}

export const firebaseAdmin = admin;
export const firebaseBucket: any = initialized
  ? admin.storage().bucket()
  : undefined;
