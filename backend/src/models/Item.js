const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '물품명을 입력해주세요'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, '카테고리를 선택해주세요'],
      enum: ['채소', '과일', '육류', '해산물', '유제품', '음료', '조미료', '냉동식품', '기타'],
    },
    quantity: {
      type: Number,
      required: [true, '수량을 입력해주세요'],
      min: [1, '수량은 최소 1 이상이어야 합니다'],
      default: 1,
    },
    unit: {
      type: String,
      required: [true, '단위를 입력해주세요'],
      trim: true,
      default: '개',
    },
    expirationDate: {
      type: Date,
      required: [true, '유통기한을 입력해주세요'],
      index: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    imageUrl: {
      type: String,
    },
    memo: {
      type: String,
      trim: true,
    },
    position: {
      shelf: {
        type: Number,
        min: 1,
        max: 10,
      },
      column: {
        type: Number,
        min: 1,
        max: 10,
      },
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    fridgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fridge',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 유통기한과 userId로 복합 인덱스 생성
itemSchema.index({ expirationDate: 1, userId: 1 });
itemSchema.index({ fridgeId: 1, userId: 1 });

module.exports = mongoose.model('Item', itemSchema);
