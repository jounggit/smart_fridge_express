require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/error');

// Express 앱 생성
const app = express();

// 데이터베이스 연결
connectDB();

// 미들웨어
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공 (업로드된 이미지)
app.use('/uploads', express.static('uploads'));

// 라우트
app.use('/api/auth', require('./routes/auth'));
app.use('/api/fridges', require('./routes/fridges'));
app.use('/api/items', require('./routes/items'));
app.use('/api/upload', require('./routes/upload'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다' });
});

// 에러 핸들러
app.use(errorHandler);

// 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Frontend URL: ${process.env.FRONTEND_URL}`);
});
