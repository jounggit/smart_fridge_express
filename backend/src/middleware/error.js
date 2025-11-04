// 에러 핸들링 미들웨어
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: errors.join(', ') });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ error: `${field}가 이미 존재합니다` });
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    return res.status(400).json({ error: '유효하지 않은 ID입니다' });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: '토큰이 만료되었습니다' });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    error: err.message || '서버 오류가 발생했습니다',
  });
};

module.exports = errorHandler;
