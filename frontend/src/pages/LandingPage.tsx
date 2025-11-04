import { Link } from 'react-router-dom';
import { Refrigerator, Bell, Camera, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="text-8xl animate-bounce">🧊</div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            스마트 냉장고 관리
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            냉장고 속 식품을 체계적으로 관리하고,
            <br />
            유통기한을 놓치지 마세요!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              시작하기
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors border-2 border-blue-600"
            >
              로그인
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-4">
              <Refrigerator className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              다중 냉장고 관리
            </h3>
            <p className="text-gray-600 text-center">
              여러 개의 냉장고를 한 곳에서 관리하세요
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-4">
              <Bell className="w-12 h-12 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              유통기한 알림
            </h3>
            <p className="text-gray-600 text-center">
              유통기한이 임박한 식품을 자동으로 알려드립니다
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-4">
              <Camera className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              이미지 업로드
            </h3>
            <p className="text-gray-600 text-center">
              식품 사진을 등록하여 더 쉽게 관리하세요
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-4">
              <ShieldCheck className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              안전한 보안
            </h3>
            <p className="text-gray-600 text-center">
              JWT 기반의 안전한 인증 시스템으로 보호됩니다
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 bg-white rounded-2xl shadow-xl p-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                식품 낭비 감소
              </div>
              <p className="text-gray-600">
                유통기한 관리로 버려지는 식품을 줄이세요
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                체계적 관리
              </div>
              <p className="text-gray-600">
                카테고리별로 식품을 정리하고 관리하세요
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                모바일 지원
              </div>
              <p className="text-gray-600">
                언제 어디서나 냉장고를 확인하세요
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 Smart Fridge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
