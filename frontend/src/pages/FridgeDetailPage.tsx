import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fridgesAPI, itemsAPI, uploadAPI } from '../lib/api';
import { ArrowLeft, Plus, Pencil, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getCategoryIcon,
  getCategoryColor,
  getExpirationStatus,
  formatDate,
  formatRelativeDate,
  type ItemCategory,
} from '../lib/utils';

interface Fridge {
  _id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
}

interface Item {
  _id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: string;
  expirationDate: string;
  purchaseDate: string;
  imageUrl?: string;
  memo?: string;
  position?: { shelf: number; column: number };
}

const categories: ItemCategory[] = [
  '채소', '과일', '육류', '해산물', '유제품', '음료', '조미료', '냉동식품', '기타'
];

export default function FridgeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fridge, setFridge] = useState<Fridge | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '채소' as ItemCategory,
    quantity: 1,
    unit: '개',
    expirationDate: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    memo: '',
    imageUrl: '',
  });

  const fetchData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [fridgeRes, itemsRes] = await Promise.all([
        fridgesAPI.getOne(id),
        itemsAPI.getAll(id),
      ]);
      setFridge(fridgeRes.data.fridge);
      setItems(itemsRes.data.items || []);
    } catch (error: any) {
      toast.error('데이터를 불러오는데 실패했습니다');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB를 초과할 수 없습니다');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('지원되는 이미지 형식이 아닙니다');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingImage(true);
    try {
      const response = await uploadAPI.uploadImage(file);
      setNewItem({ ...newItem, imageUrl: response.data.imageUrl });
      toast.success('이미지가 업로드되었습니다');
    } catch (error: any) {
      toast.error('이미지 업로드에 실패했습니다');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await itemsAPI.create({
        ...newItem,
        fridgeId: id,
      });
      toast.success('물품이 추가되었습니다');
      setShowAddModal(false);
      setNewItem({
        name: '',
        category: '채소',
        quantity: 1,
        unit: '개',
        expirationDate: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        memo: '',
        imageUrl: '',
      });
      setImagePreview(null);
      fetchData();
    } catch (error: any) {
      toast.error('물품 추가에 실패했습니다');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await itemsAPI.delete(itemId);
      toast.success('물품이 삭제되었습니다');
      fetchData();
    } catch (error: any) {
      toast.error('물품 삭제에 실패했습니다');
    }
  };

  const handleDeleteFridge = async () => {
    if (!id || !confirm('냉장고와 모든 물품이 삭제됩니다. 계속하시겠습니까?')) return;

    try {
      await fridgesAPI.delete(id);
      toast.success('냉장고가 삭제되었습니다');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error('냉장고 삭제에 실패했습니다');
    }
  };

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

  if (!fridge) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm" style={{ borderTop: `4px solid ${fridge.color}` }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={handleDeleteFridge}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-5xl">{fridge.icon}</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{fridge.name}</h1>
              {fridge.description && (
                <p className="text-gray-600">{fridge.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Add Item Button */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            물품 목록 ({items.length}개)
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            물품 추가
          </button>
        </div>

        {/* Items Grid */}
        {items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-600 mb-4">아직 물품이 없습니다</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              첫 물품 추가하기
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const expStatus = getExpirationStatus(item.expirationDate);
              return (
                <div
                  key={item._id}
                  className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 ${expStatus.bgColor}`}
                >
                  {item.imageUrl && (
                    <img
                      src={`http://localhost:3001${item.imageUrl}`}
                      alt={item.name}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                  )}

                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="p-1 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>

                  <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      수량: {item.quantity}{item.unit}
                    </p>
                    <p className={`font-medium ${expStatus.color}`}>
                      유통기한: {formatDate(item.expirationDate)} ({formatRelativeDate(item.expirationDate)})
                    </p>
                    <p className="text-gray-600">
                      구매일: {formatDate(item.purchaseDate)}
                    </p>
                    {item.memo && (
                      <p className="text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                        {item.memo}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">물품 추가</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    물품명 *
                  </label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 우유"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 *
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value as ItemCategory })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {getCategoryIcon(cat)} {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    수량 *
                  </label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    단위 *
                  </label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="개, 병, kg 등"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    유통기한 *
                  </label>
                  <input
                    type="date"
                    value={newItem.expirationDate}
                    onChange={(e) => setNewItem({ ...newItem, expirationDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    구매일
                  </label>
                  <input
                    type="date"
                    value={newItem.purchaseDate}
                    onChange={(e) => setNewItem({ ...newItem, purchaseDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메모
                </label>
                <textarea
                  value={newItem.memo}
                  onChange={(e) => setNewItem({ ...newItem, memo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="추가 정보를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이미지
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setNewItem({ ...newItem, imageUrl: '' });
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {uploadingImage ? '업로드 중...' : '이미지 업로드'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  최대 5MB, JPG/PNG/GIF/WebP
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewItem({
                      name: '',
                      category: '채소',
                      quantity: 1,
                      unit: '개',
                      expirationDate: '',
                      purchaseDate: new Date().toISOString().split('T')[0],
                      memo: '',
                      imageUrl: '',
                    });
                    setImagePreview(null);
                  }}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
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
