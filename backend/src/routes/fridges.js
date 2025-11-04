const express = require('express');
const router = express.Router();
const fridgeController = require('../controllers/fridgeController');
const auth = require('../middleware/auth');

// 모든 라우트에 인증 미들웨어 적용
router.use(auth);

// 냉장고 목록 조회 & 생성
router
  .route('/')
  .get(fridgeController.getFridges)
  .post(fridgeController.createFridge);

// 냉장고 상세 조회 & 수정 & 삭제
router
  .route('/:id')
  .get(fridgeController.getFridge)
  .put(fridgeController.updateFridge)
  .delete(fridgeController.deleteFridge);

module.exports = router;
