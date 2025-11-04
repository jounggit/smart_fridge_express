const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '이름을 입력해주세요'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, '이메일을 입력해주세요'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, '유효한 이메일을 입력해주세요'],
    },
    password: {
      type: String,
      required: [true, '비밀번호를 입력해주세요'],
      minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다'],
      select: false, // 기본적으로 password 필드는 조회하지 않음
    },
  },
  {
    timestamps: true,
  }
);

// 비밀번호 해싱 미들웨어
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 비밀번호 비교 메서드
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
