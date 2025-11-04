const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');

// Multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${randomStr}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('지원되는 이미지 형식이 아닙니다'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// 이미지 업로드 (인증 필요)
router.post('/', auth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일을 선택해주세요' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({
      message: '이미지가 업로드되었습니다',
      imageUrl,
    });
  } catch (error) {
    res.status(500).json({ error: '이미지 업로드 중 오류가 발생했습니다' });
  }
});

module.exports = router;
