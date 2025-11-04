const Fridge = require('../models/Fridge');
const Item = require('../models/Item');

// 냉장고 목록 조회
exports.getFridges = async (req, res, next) => {
  try {
    const fridges = await Fridge.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ fridges });
  } catch (error) {
    next(error);
  }
};

// 냉장고 생성
exports.createFridge = async (req, res, next) => {
  try {
    const { name, description, icon, color } = req.body;

    const fridge = await Fridge.create({
      name,
      description,
      icon: icon || '🧊',
      color: color || '#3b82f6',
      userId: req.userId,
    });

    res.status(201).json({
      message: '냉장고가 생성되었습니다',
      fridge,
    });
  } catch (error) {
    next(error);
  }
};

// 냉장고 상세 조회
exports.getFridge = async (req, res, next) => {
  try {
    const fridge = await Fridge.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!fridge) {
      return res.status(404).json({ error: '냉장고를 찾을 수 없습니다' });
    }

    res.json({ fridge });
  } catch (error) {
    next(error);
  }
};

// 냉장고 수정
exports.updateFridge = async (req, res, next) => {
  try {
    const { name, description, icon, color } = req.body;

    const fridge = await Fridge.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, description, icon, color },
      { new: true, runValidators: true }
    );

    if (!fridge) {
      return res.status(404).json({ error: '냉장고를 찾을 수 없습니다' });
    }

    res.json({
      message: '냉장고가 수정되었습니다',
      fridge,
    });
  } catch (error) {
    next(error);
  }
};

// 냉장고 삭제
exports.deleteFridge = async (req, res, next) => {
  try {
    const fridge = await Fridge.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!fridge) {
      return res.status(404).json({ error: '냉장고를 찾을 수 없습니다' });
    }

    // 냉장고의 모든 물품도 삭제
    await Item.deleteMany({ fridgeId: req.params.id });

    res.json({ message: '냉장고가 삭제되었습니다' });
  } catch (error) {
    next(error);
  }
};
