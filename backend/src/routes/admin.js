const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/User');
const Fridge = require('../models/Fridge');
const Item = require('../models/Item');
const { requireAdminAuth } = require('../middleware/adminAuth');

// 로그인 페이지
router.get('/login', (req, res) => {
  if (req.session && req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { error: null });
});

// 로그인 처리
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.render('admin/login', { error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.render('admin/login', { error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    req.session.admin = {
      id: admin._id,
      username: admin.username,
      name: admin.name,
    };

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Admin login error:', error);
    res.render('admin/login', { error: '로그인 중 오류가 발생했습니다.' });
  }
});

// 로그아웃
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
    res.redirect('/admin/login');
  });
});

// 대시보드
router.get('/dashboard', requireAdminAuth, async (req, res) => {
  try {
    const [userCount, fridgeCount, itemCount, recentUsers] = await Promise.all([
      User.countDocuments(),
      Fridge.countDocuments(),
      Item.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5),
    ]);

    res.render('admin/dashboard', {
      admin: req.session.admin,
      stats: { userCount, fridgeCount, itemCount },
      recentUsers,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('admin/dashboard', {
      admin: req.session.admin,
      stats: { userCount: 0, fridgeCount: 0, itemCount: 0 },
      recentUsers: [],
    });
  }
});

// 사용자 목록
router.get('/users', requireAdminAuth, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.render('admin/users', { admin: req.session.admin, users });
  } catch (error) {
    console.error('Users list error:', error);
    res.render('admin/users', { admin: req.session.admin, users: [] });
  }
});

// 사용자 삭제
router.post('/users/:id/delete', requireAdminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/users');
  } catch (error) {
    console.error('User delete error:', error);
    res.redirect('/admin/users');
  }
});

// 냉장고 목록
router.get('/fridges', requireAdminAuth, async (req, res) => {
  try {
    const fridges = await Fridge.find().populate('userId', 'name email').sort({ createdAt: -1 });
    res.render('admin/fridges', { admin: req.session.admin, fridges });
  } catch (error) {
    console.error('Fridges list error:', error);
    res.render('admin/fridges', { admin: req.session.admin, fridges: [] });
  }
});

// 냉장고 상세 (식품 목록)
router.get('/fridges/:id', requireAdminAuth, async (req, res) => {
  try {
    const fridge = await Fridge.findById(req.params.id).populate('userId', 'name email');
    if (!fridge) {
      return res.redirect('/admin/fridges');
    }
    const items = await Item.find({ fridgeId: req.params.id }).sort({ expirationDate: 1 });
    res.render('admin/fridge-detail', { admin: req.session.admin, fridge, items });
  } catch (error) {
    console.error('Fridge detail error:', error);
    res.redirect('/admin/fridges');
  }
});

// 초기 관리자 생성 (한 번만 실행)
router.get('/setup', async (req, res) => {
  try {
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      return res.send('관리자가 이미 존재합니다. <a href="/admin/login">로그인</a>');
    }

    const admin = new Admin({
      username: 'admin',
      password: 'admin123',
      name: '관리자',
    });
    await admin.save();

    res.send('관리자 계정이 생성되었습니다.<br>아이디: admin<br>비밀번호: admin123<br><a href="/admin/login">로그인하기</a>');
  } catch (error) {
    console.error('Admin setup error:', error);
    res.status(500).send('관리자 생성 중 오류가 발생했습니다.');
  }
});

module.exports = router;
