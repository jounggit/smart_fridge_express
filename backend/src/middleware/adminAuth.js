// 관리자 세션 인증 미들웨어
const requireAdminAuth = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  }
  res.redirect('/admin/login');
};

module.exports = { requireAdminAuth };
