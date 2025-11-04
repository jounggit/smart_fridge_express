const mongoose = require('mongoose');

const fridgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '냉장고 이름을 입력해주세요'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      default: '🧊',
    },
    color: {
      type: String,
      default: '#3b82f6',
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

module.exports = mongoose.model('Fridge', fridgeSchema);
