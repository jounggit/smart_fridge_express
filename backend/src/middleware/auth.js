const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: '인증이 필요합니다' });
    }

    // 토큰 검증
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
    }

    // 사용자 조회
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // 요청 객체에 사용자 정보 추가
    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error) {
    res.status(401).json({ error: '인증에 실패했습니다' });
  }
};

module.exports = auth;
