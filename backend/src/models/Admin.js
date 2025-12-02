const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, '아이디를 입력해주세요'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, '비밀번호를 입력해주세요'],
      minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다'],
    },
    name: {
      type: String,
      required: [true, '이름을 입력해주세요'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// 비밀번호 해싱 미들웨어
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 비밀번호 비교 메서드
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
