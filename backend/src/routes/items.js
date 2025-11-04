const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const auth = require('../middleware/auth');

// 모든 라우트에 인증 미들웨어 적용
router.use(auth);

// 유통기한 임박/만료 물품 조회
router.get('/expiring', itemController.getExpiringItems);

// 물품 목록 조회 & 생성
router
  .route('/')
  .get(itemController.getItems)
  .post(itemController.createItem);

// 물품 상세 조회 & 수정 & 삭제
router
  .route('/:id')
  .get(itemController.getItem)
  .put(itemController.updateItem)
  .delete(itemController.deleteItem);

module.exports = router;
