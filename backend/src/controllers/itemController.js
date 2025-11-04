const Item = require('../models/Item');

// 물품 목록 조회
exports.getItems = async (req, res, next) => {
  try {
    const { fridgeId, category, expiringSoon } = req.query;

    let query = { userId: req.userId };

    if (fridgeId) {
      query.fridgeId = fridgeId;
    }

    if (category) {
      query.category = category;
    }

    if (expiringSoon) {
      const days = parseInt(expiringSoon) || 7;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      query.expirationDate = { $lte: futureDate };
    }

    const items = await Item.find(query).sort({ expirationDate: 1 });
    res.json({ items });
  } catch (error) {
    next(error);
  }
};

// 물품 생성
exports.createItem = async (req, res, next) => {
  try {
    const { name, category, quantity, unit, expirationDate, purchaseDate, imageUrl, memo, position, fridgeId } = req.body;

    const item = await Item.create({
      name,
      category,
      quantity,
      unit,
      expirationDate,
      purchaseDate,
      imageUrl,
      memo,
      position,
      fridgeId,
      userId: req.userId,
    });

    res.status(201).json({
      message: '물품이 추가되었습니다',
      item,
    });
  } catch (error) {
    next(error);
  }
};

// 물품 상세 조회
exports.getItem = async (req, res, next) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!item) {
      return res.status(404).json({ error: '물품을 찾을 수 없습니다' });
    }

    res.json({ item });
  } catch (error) {
    next(error);
  }
};

// 물품 수정
exports.updateItem = async (req, res, next) => {
  try {
    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ error: '물품을 찾을 수 없습니다' });
    }

    res.json({
      message: '물품이 수정되었습니다',
      item,
    });
  } catch (error) {
    next(error);
  }
};

// 물품 삭제
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!item) {
      return res.status(404).json({ error: '물품을 찾을 수 없습니다' });
    }

    res.json({ message: '물품이 삭제되었습니다' });
  } catch (error) {
    next(error);
  }
};

// 유통기한 임박/만료 물품 조회
exports.getExpiringItems = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    // 유통기한 임박 물품 (오늘 ~ 7일 후)
    const expiringItems = await Item.find({
      userId: req.userId,
      expirationDate: {
        $gte: now,
        $lte: futureDate,
      },
    }).sort({ expirationDate: 1 });

    // 유통기한 만료 물품 (오늘 이전)
    const expiredItems = await Item.find({
      userId: req.userId,
      expirationDate: {
        $lt: now,
      },
    }).sort({ expirationDate: -1 });

    res.json({
      expiringItems,
      expiredItems,
      expiringCount: expiringItems.length,
      expiredCount: expiredItems.length,
    });
  } catch (error) {
    next(error);
  }
};
