const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const getServiceAccountFromEnv = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    clientId: process.env.FIREBASE_CLIENT_ID,
  };
};

const getStorageBucket = () => process.env.FIREBASE_STORAGE_BUCKET;

const connectDB = async () => {
  try {
    if (admin.apps.length > 0) {
      return;
    }

    const serviceAccountFromEnv = getServiceAccountFromEnv();
    if (serviceAccountFromEnv) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountFromEnv),
        storageBucket: getStorageBucket(),
      });
      console.log('Firebase Admin initialized from environment variables');
      return;
    }

    const serviceAccountPath = path.join(__dirname, '../../firebaseServiceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath)),
        storageBucket: getStorageBucket(),
      });
      console.log('Firebase Admin initialized from local service account file');
      return;
    }

    throw new Error(
      'Firebase credentials not found. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY, or provide backend/firebaseServiceAccountKey.json'
    );
  } catch (error) {
    console.error(`Firebase initialization error: ${error.message}`);
    process.exit(1);
  }
};

const db = admin.firestore;
module.exports = { connectDB, db, admin };
