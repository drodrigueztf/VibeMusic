// config/db.js
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const connectDB = async () => {
  try {
    const serviceAccountPath = path.join(__dirname, '../../firebaseServiceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath))
      });
      console.log('✅ Firebase Admin initialized with service account key');
    } else {
      console.warn('⚠️ Firebase Service Account Key not found. Using application default credentials or unitialized state.');
      // Attempt default init or suggest user to create the file
      admin.initializeApp();
    }
  } catch (error) {
    console.error(`❌ Firebase initialization error: ${error.message}`);
    process.exit(1);
  }
};

const db = admin.firestore;
module.exports = { connectDB, db, admin };
