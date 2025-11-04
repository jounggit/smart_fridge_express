import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../lib/api';
import { ArrowLeft, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getCategoryIcon,
  getCategoryColor,
  formatDate,
  formatRelativeDate,
  type ItemCategory,
} from '../lib/utils';

interface NotificationItem {
  _id: string;
  name: string;
  category: ItemCategory;
  expirationDate: string;
  fridgeId: string;
  imageUrl?: string;
}

export default function NotificationsPage() {
  const [expiringItems, setExpiringItems] = useState<NotificationItem[]>([]);
  const [expiredItems, setExpiredItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await itemsAPI.getExpiring(7);
      setExpiringItems(response.data.expiringItems || []);
      setExpiredItems(response.data.expiredItems || []);
    } catch (error: any) {
      toast.error('알림을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🔔</div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const totalCount = expiringItems.length + expiredItems.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">알림</h1>
              <p className="text-gray-600">
                총 {totalCount}개의 알림이 있습니다
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {totalCount === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-gray-600 text-lg">
              모든 물품이 신선합니다!
            </p>
            <p className="text-gray-500 text-sm mt-2">
              유통기한 임박 또는 만료된 물품이 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Expired Items */}
            {expiredItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h2 className="text-xl font-semibold text-red-900">
                    유통기한 만료 ({expiredItems.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {expiredItems.map((item) => (
                    <div
                      key={item._id}
                      className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-600 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/fridge/${item.fridgeId}`)}
                    >
                      <div className="flex gap-4">
                        {item.imageUrl && (
                          <img
                            src={`http://localhost:3001${item.imageUrl}`}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">
                              {getCategoryIcon(item.category)}
                            </span>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {item.name}
                            </h3>
                          </div>
                          <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${getCategoryColor(item.category)}`}>
                            {item.category}
                          </div>
                          <p className="text-red-600 font-medium text-sm">
                            유통기한: {formatDate(item.expirationDate)} (
                            {formatRelativeDate(item.expirationDate)})
                          </p>
                          <p className="text-red-700 text-sm font-semibold mt-1">
                            ⚠️ 유통기한이 지났습니다
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expiring Soon Items */}
            {expiringItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <h2 className="text-xl font-semibold text-orange-900">
                    유통기한 임박 ({expiringItems.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {expiringItems.map((item) => (
                    <div
                      key={item._id}
                      className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-600 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/fridge/${item.fridgeId}`)}
                    >
                      <div className="flex gap-4">
                        {item.imageUrl && (
                          <img
                            src={`http://localhost:3001${item.imageUrl}`}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">
                              {getCategoryIcon(item.category)}
                            </span>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {item.name}
                            </h3>
                          </div>
                          <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${getCategoryColor(item.category)}`}>
                            {item.category}
                          </div>
                          <p className="text-orange-600 font-medium text-sm">
                            유통기한: {formatDate(item.expirationDate)} (
                            {formatRelativeDate(item.expirationDate)})
                          </p>
                          <p className="text-orange-700 text-sm font-semibold mt-1">
                            ⏰ 유통기한이 임박했습니다
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
