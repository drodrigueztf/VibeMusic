const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userDoc = await db().collection('users').doc(decoded.id).get();

    if (!userDoc.exists) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    const userData = userDoc.data();
    delete userData.password;
    
    req.user = { _id: userDoc.id, ...userData };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const userDoc = await db().collection('users').doc(decoded.id).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        delete userData.password;
        req.user = { _id: userDoc.id, ...userData };
      }
    }
  } catch (error) {
    // Silently continue without auth
  }
  next();
};

module.exports = { auth, optionalAuth };
