const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/wave', 'audio/x-wav'];
const coverTypes = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'audio') {
    if (audioTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Invalid file type. Only MP3 and WAV files are allowed.'), false);
    return;
  }

  if (file.fieldname === 'cover') {
    if (coverTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Invalid image type. Only JPEG, PNG and WebP are allowed.'), false);
    return;
  }

  cb(new Error('Unexpected upload field.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

module.exports = { upload };
