const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

// 회원가입
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 필수 필드 검증
    if (!name || !email || !password) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요' });
    }

    // 이메일 중복 체크
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: '이미 사용 중인 이메일입니다' });
    }

    // 사용자 생성
    const user = await User.create({
      name,
      email,
      password,
    });

    // JWT 토큰 생성
    const token = generateToken(user._id);

    res.status(201).json({
      message: '회원가입이 완료되었습니다',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// 로그인
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 검증
    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요' });
    }

    // 사용자 조회 (password 포함)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 일치하지 않습니다' });
    }

    // 비밀번호 확인
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 일치하지 않습니다' });
    }

    // JWT 토큰 생성
    const token = generateToken(user._id);

    res.json({
      message: '로그인 성공',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// 현재 사용자 정보 조회
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
