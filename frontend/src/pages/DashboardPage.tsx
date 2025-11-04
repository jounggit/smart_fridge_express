import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fridgesAPI, itemsAPI } from '../lib/api';
import { Plus, Bell, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

interface Fridge {
  _id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  createdAt: string;
}

interface NotificationItem {
  _id: string;
  name: string;
  expirationDate: string;
  fridgeId: string;
  category: string;
}

export default function DashboardPage() {
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [expiringItems, setExpiringItems] = useState<NotificationItem[]>([]);
  const [expiredItems, setExpiredItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFridge, setNewFridge] = useState({
    name: '',
    description: '',
    icon: '🧊',
    color: '#3b82f6',
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchFridges = useCallback(async () => {
    try {
      const response = await fridgesAPI.getAll();
      setFridges(response.data.fridges);
    } catch (error: any) {
      toast.error('냉장고 목록을 불러오는데 실패했습니다');
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await itemsAPI.getExpiring(7);
      setExpiringItems(response.data.expiringItems || []);
      setExpiredItems(response.data.expiredItems || []);
    } catch (error: any) {
      toast.error('알림을 불러오는데 실패했습니다');
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchFridges(), fetchNotifications()]);
    toast.success('새로고침 완료!');
  }, [fetchFridges, fetchNotifications]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFridges(), fetchNotifications()]);
      setLoading(false);
    };
    loadData();
  }, [fetchFridges, fetchNotifications]);

  const handleAddFridge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fridgesAPI.create(newFridge);
      toast.success('냉장고가 추가되었습니다');
      setShowAddModal(false);
      setNewFridge({ name: '', description: '', icon: '🧊', color: '#3b82f6' });
      fetchFridges();
    } catch (error: any) {
      toast.error('냉장고 추가에 실패했습니다');
    }
  };

  const iconOptions = ['🧊', '❄️', '🍎', '🥗', '🍱', '🧃', '🥡', '🍲'];
  const colorOptions = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#06b6d4', '#6366f1', '#ef4444'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🧊</div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                안녕하세요, {user?.name}님! 👋
              </h1>
              <p className="text-gray-600 mt-1">냉장고를 관리해보세요</p>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Notifications */}
        {(expiringItems.length > 0 || expiredItems.length > 0) && (
          <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">알림</h2>
            </div>
            <div className="space-y-2">
              {expiredItems.slice(0, 3).map((item) => (
                <div
                  key={item._id}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-red-800 font-medium">
                    {item.name} - 유통기한 만료
                  </p>
                </div>
              ))}
              {expiringItems.slice(0, 3).map((item) => (
                <div
                  key={item._id}
                  className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <p className="text-orange-800 font-medium">
                    {item.name} - 유통기한 임박
                  </p>
                </div>
              ))}
            </div>
            {(expiringItems.length + expiredItems.length > 3) && (
              <button
                onClick={() => navigate('/notifications')}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                모두 보기 →
              </button>
            )}
          </div>
        )}

        {/* Fridges */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">내 냉장고</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            냉장고 추가
          </button>
        </div>

        {fridges.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">🧊</div>
            <p className="text-gray-600 mb-4">아직 냉장고가 없습니다</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              첫 냉장고 만들기
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fridges.map((fridge) => (
              <button
                key={fridge._id}
                onClick={() => navigate(`/fridge/${fridge._id}`)}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow p-6 text-left"
                style={{ borderTop: `4px solid ${fridge.color}` }}
              >
                <div className="text-4xl mb-3">{fridge.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {fridge.name}
                </h3>
                {fridge.description && (
                  <p className="text-gray-600 text-sm">{fridge.description}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add Fridge Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              냉장고 추가
            </h2>
            <form onSubmit={handleAddFridge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름
                </label>
                <input
                  type="text"
                  value={newFridge.name}
                  onChange={(e) =>
                    setNewFridge({ ...newFridge, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 주방 냉장고"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명 (선택)
                </label>
                <input
                  type="text"
                  value={newFridge.description}
                  onChange={(e) =>
                    setNewFridge({ ...newFridge, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 1층 주방"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  아이콘
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewFridge({ ...newFridge, icon })}
                      className={`text-3xl p-3 rounded-lg border-2 transition-colors ${
                        newFridge.icon === icon
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  색상
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewFridge({ ...newFridge, color })}
                      className={`h-12 rounded-lg border-2 transition-all ${
                        newFridge.color === color
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewFridge({ name: '', description: '', icon: '🧊', color: '#3b82f6' });
                  }}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
