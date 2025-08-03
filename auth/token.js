const jwt = require('jsonwebtoken');
const { encryptAES, decryptAES } = require('../utils/crypto');

function createToken(payload) {
  const encrypted = encryptAES(JSON.stringify(payload));
  return jwt.sign({ data: encrypted }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return JSON.parse(decryptAES(decoded.data));
  } catch {
    return null;
  }
}

module.exports = { createToken, verifyToken };
