# Smart Fridge - Express + React 버전

Node.js + Express 백엔드와 React + Vite 프론트엔드로 구성된 스마트 냉장고 관리 시스템입니다.

## 📁 프로젝트 구조

```
webprogramming-express/
├── backend/          (Node.js + Express API - 포트 3001)
│   ├── src/
│   │   ├── config/       (데이터베이스 설정)
│   │   ├── controllers/  (비즈니스 로직)
│   │   ├── middleware/   (인증, 에러 핸들링)
│   │   ├── models/       (Mongoose 모델)
│   │   ├── routes/       (API 라우트)
│   │   ├── utils/        (JWT 유틸리티)
│   │   └── server.js     (메인 서버)
│   ├── uploads/          (업로드된 이미지)
│   ├── .env              (환경 변수)
│   └── package.json
│
├── frontend/         (React + Vite - 포트 5173)
│   └── (향후 생성)
│
└── README.md
```

## 🚀 백엔드 설치 및 실행

### 1. 의존성 설치
```bash
cd backend
npm install
```

### 2. 환경 변수 설정
`backend/.env` 파일이 이미 생성되어 있습니다:
```env
MONGODB_URI=mongodb+srv://admin:12345@cluster0.lcb34ay.mongodb.net/smart-fridge?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-in-production-please
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. 서버 실행
```bash
npm run dev  # 개발 모드 (nodemon)
npm start    # 프로덕션 모드
```

서버가 실행되면:
- API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## 📡 API 엔드포인트

### 인증 (Auth)
```
POST   /api/auth/register  - 회원가입
POST   /api/auth/login     - 로그인
GET    /api/auth/me        - 현재 사용자 정보 (인증 필요)
```

### 냉장고 (Fridges)
```
GET    /api/fridges        - 냉장고 목록 조회
POST   /api/fridges        - 냉장고 생성
GET    /api/fridges/:id    - 냉장고 상세 조회
PUT    /api/fridges/:id    - 냉장고 수정
DELETE /api/fridges/:id    - 냉장고 삭제
```

### 물품 (Items)
```
GET    /api/items                - 물품 목록 조회
POST   /api/items                - 물품 생성
GET    /api/items/expiring       - 유통기한 임박/만료 물품
GET    /api/items/:id            - 물품 상세 조회
PUT    /api/items/:id            - 물품 수정
DELETE /api/items/:id            - 물품 삭제
```

### 파일 업로드 (Upload)
```
POST   /api/upload        - 이미지 업로드 (multipart/form-data)
```

## 🔐 JWT 인증

모든 API 요청(인증 제외)은 Authorization 헤더에 JWT 토큰이 필요합니다:

```
Authorization: Bearer <your-jwt-token>
```

### 로그인 예시
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

응답:
```json
{
  "message": "로그인 성공",
  "user": {
    "id": "...",
    "name": "...",
    "email": "..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 📊 데이터 모델

### User (사용자)
- name: String (필수)
- email: String (필수, 고유)
- password: String (필수, 최소 6자, 해시됨)

### Fridge (냉장고)
- name: String (필수)
- description: String
- icon: String (기본: 🧊)
- color: String (기본: #3b82f6)
- userId: ObjectId (필수)

### Item (물품)
- name: String (필수)
- category: Enum (필수) - 채소, 과일, 육류, 해산물, 유제품, 음료, 조미료, 냉동식품, 기타
- quantity: Number (필수, 기본: 1)
- unit: String (필수, 기본: 개)
- expirationDate: Date (필수)
- purchaseDate: Date (기본: 현재)
- imageUrl: String
- memo: String
- position: { shelf: Number, column: Number }
- notificationSent: Boolean (기본: false)
- fridgeId: ObjectId (필수)
- userId: ObjectId (필수)

## 🛠 기술 스택

### 백엔드
- **Node.js** - JavaScript 런타임
- **Express** - 웹 프레임워크
- **MongoDB + Mongoose** - 데이터베이스
- **JWT (jsonwebtoken)** - 인증
- **bcryptjs** - 비밀번호 암호화
- **Multer** - 파일 업로드
- **CORS** - Cross-Origin Resource Sharing
- **dotenv** - 환경 변수 관리
- **nodemon** - 개발 서버 (hot reload)

## 📝 다음 단계: 프론트엔드 생성

프론트엔드를 생성하려면:

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# Vite + React 프로젝트 생성
npm create vite@latest . -- --template react-ts

# 의존성 설치
npm install

# 추가 패키지 설치
npm install react-router-dom axios
npm install -D tailwindcss postcss autoprefixer
npm install framer-motion react-toastify lucide-react

# Tailwind CSS 초기화
npx tailwindcss init -p
```

프론트엔드 구현 가이드는 별도로 제공됩니다.

## 🔐 관리자 페이지 (EJS)

관리자 페이지는 EJS 템플릿 엔진을 사용하여 서버 사이드 렌더링(SSR)으로 구현되었습니다.

### 접속 방법

1. **관리자 계정 생성** (최초 1회만 실행)
   ```
   http://localhost:3001/admin/setup
   ```

2. **관리자 로그인**
   ```
   URL: http://localhost:3001/admin/login
   아이디: admin
   비밀번호: admin123
   ```

### 관리자 기능

| 페이지 | URL | 설명 |
|--------|-----|------|
| 로그인 | `/admin/login` | 관리자 로그인 |
| 대시보드 | `/admin/dashboard` | 전체 통계 (사용자, 냉장고, 식품 수) |
| 사용자 관리 | `/admin/users` | 사용자 목록 조회/삭제 |
| 냉장고 관리 | `/admin/fridges` | 냉장고 목록 조회 |
| 냉장고 상세 | `/admin/fridges/:id` | 냉장고 내 식품 목록 조회 |

### 관리자 파일 구조
```
backend/src/
├── models/Admin.js           # 관리자 모델
├── middleware/adminAuth.js   # 세션 인증 미들웨어
├── routes/admin.js           # 관리자 라우트
└── views/admin/              # EJS 템플릿
    ├── login.ejs             # 로그인 페이지
    ├── dashboard.ejs         # 대시보드
    ├── users.ejs             # 사용자 관리
    ├── fridges.ejs           # 냉장고 목록
    └── fridge-detail.ejs     # 냉장고 상세 (식품 목록)
```

### 기술 스택 (관리자)
- **EJS** - 템플릿 엔진 (서버 사이드 렌더링)
- **express-session** - 세션 기반 인증

## 🔥 현재 상태

✅ **완료:**
- Express 서버 설정
- MongoDB 연결
- JWT 인증 시스템
- 사용자 인증 API
- 냉장고 CRUD API
- 물품 CRUD API
- 이미지 업로드 API
- 유통기한 알림 API
- 에러 핸들링
- React + Vite 프론트엔드
- 관리자 페이지 (EJS)

⏳ **진행 예정:**
- 추가 기능 개선

## 📌 중요 사항

1. **환경 변수**: 프로덕션에서는 반드시 `JWT_SECRET`을 변경하세요
2. **MongoDB**: MongoDB Atlas 클라우드 데이터베이스 사용 중
3. **CORS**: 프론트엔드 URL이 변경되면 `.env`의 `FRONTEND_URL`도 수정하세요
4. **포트**: 백엔드는 3001, 프론트엔드는 5173 포트 사용

## 🤝 기여

이슈나 풀 리퀘스트는 언제든 환영합니다!

## 📄 라이선스

MIT License
