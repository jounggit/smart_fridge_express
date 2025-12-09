import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fridgesAPI, itemsAPI, uploadAPI } from '../lib/api';
import { ArrowLeft, Plus, Trash2, Upload, X, Snowflake, Move, MoreVertical } from 'lucide-react';
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
  position?: { x: number; y: number };
}

const categories: ItemCategory[] = [
  '채소', '과일', '육류', '해산물', '유제품', '음료', '조미료', '냉동식품', '기타'
];

// 냉장고 크기 상수
const FRIDGE_WIDTH = 800;
const FRIDGE_HEIGHT = 600;
const ITEM_WIDTH = 80;
const ITEM_HEIGHT = 96;
const GRID_COLS = 7;
const GRID_ROWS = 4;
const PADDING = 20;

// 그리드 셀 크기 계산
const CELL_WIDTH = (FRIDGE_WIDTH - PADDING * 2) / GRID_COLS;
const CELL_HEIGHT = (FRIDGE_HEIGHT - PADDING * 2) / GRID_ROWS;

// 좌표를 그리드 위치로 스냅
function snapToGrid(x: number, y: number): { x: number; y: number } {
  // 그리드 셀 인덱스 계산
  const col = Math.round((x - PADDING) / CELL_WIDTH);
  const row = Math.round((y - PADDING) / CELL_HEIGHT);

  // 경계 제한
  const boundedCol = Math.max(0, Math.min(col, GRID_COLS - 1));
  const boundedRow = Math.max(0, Math.min(row, GRID_ROWS - 1));

  // 셀 중앙 위치 계산
  const snappedX = PADDING + boundedCol * CELL_WIDTH + (CELL_WIDTH - ITEM_WIDTH) / 2;
  const snappedY = PADDING + boundedRow * CELL_HEIGHT + (CELL_HEIGHT - ITEM_HEIGHT) / 2;

  return { x: Math.round(snappedX), y: Math.round(snappedY) };
}

// 빈 공간을 찾아 새 아이템 위치 계산
function findEmptyPosition(existingItems: Item[]): { x: number; y: number } {
  // 그리드 기반으로 빈 자리 찾기
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = PADDING + col * CELL_WIDTH + (CELL_WIDTH - ITEM_WIDTH) / 2;
      const y = PADDING + row * CELL_HEIGHT + (CELL_HEIGHT - ITEM_HEIGHT) / 2;

      // 해당 위치에 다른 아이템이 있는지 확인
      const isOccupied = existingItems.some(item => {
        const itemX = item.position?.x || 0;
        const itemY = item.position?.y || 0;
        return Math.abs(itemX - x) < ITEM_WIDTH && Math.abs(itemY - y) < ITEM_HEIGHT;
      });

      if (!isOccupied) {
        return { x: Math.round(x), y: Math.round(y) };
      }
    }
  }

  // 빈 자리가 없으면 첫번째 그리드 위치
  return snapToGrid(PADDING, PADDING);
}

export default function FridgeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fridge, setFridge] = useState<Fridge | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [doorOpen, setDoorOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<Item | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const fridgeRef = useRef<HTMLDivElement>(null);
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
      // 위치가 없는 아이템에 그리드 기반 위치 할당
      const rawItems = itemsRes.data.items || [];
      const itemsWithPosition: Item[] = [];

      rawItems.forEach((item: Item) => {
        if (item.position && (item.position.x !== 0 || item.position.y !== 0)) {
          // 이미 위치가 있으면 그대로 사용
          itemsWithPosition.push(item);
        } else {
          // 위치가 없으면 빈 공간 찾아서 배치
          const newPos = findEmptyPosition(itemsWithPosition);
          itemsWithPosition.push({ ...item, position: newPos });
        }
      });

      setItems(itemsWithPosition);
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

  // 페이지 로드 후 자동으로 문 열기 애니메이션
  useEffect(() => {
    if (!loading && fridge) {
      const timer = setTimeout(() => setDoorOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [loading, fridge]);

  // 드래그 시작
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, item: Item) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (fridgeRef.current) {
      const rect = fridgeRef.current.getBoundingClientRect();
      const itemX = item.position?.x || 0;
      const itemY = item.position?.y || 0;

      setDragOffset({
        x: clientX - rect.left - itemX,
        y: clientY - rect.top - itemY
      });
      setDragPosition({ x: itemX, y: itemY });
    }

    setDraggedItem(item);
  };

  // 드래그 중
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!draggedItem || !fridgeRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const rect = fridgeRef.current.getBoundingClientRect();
    let newX = clientX - rect.left - dragOffset.x;
    let newY = clientY - rect.top - dragOffset.y;

    // 경계 제한
    newX = Math.max(0, Math.min(newX, rect.width - 80));
    newY = Math.max(0, Math.min(newY, rect.height - 96));

    setDragPosition({ x: newX, y: newY });
  }, [draggedItem, dragOffset]);

  // 드래그 종료
  const handleDragEnd = useCallback(async () => {
    if (!draggedItem) return;

    // 그리드 위치로 스냅
    const snappedPosition = snapToGrid(dragPosition.x, dragPosition.y);

    // 로컬 상태 업데이트
    setItems(prev => prev.map(item =>
      item._id === draggedItem._id
        ? { ...item, position: snappedPosition }
        : item
    ));

    // 서버에 위치 저장
    try {
      await itemsAPI.update(draggedItem._id, { position: snappedPosition });
    } catch (error) {
      console.error('위치 저장 실패:', error);
    }

    setDraggedItem(null);
  }, [draggedItem, dragPosition]);

  // 드래그 이벤트 리스너
  useEffect(() => {
    if (draggedItem) {
      const handleMove = (e: MouseEvent | TouchEvent) => handleDragMove(e);
      const handleEnd = () => handleDragEnd();

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);

      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [draggedItem, handleDragMove, handleDragEnd]);

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

    // 빈 공간을 찾아 새 아이템 위치 계산
    const newPosition = findEmptyPosition(items);

    try {
      await itemsAPI.create({
        ...newItem,
        fridgeId: id,
        position: newPosition,
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
      setSelectedItem(null);
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🧊</div>
          <p className="text-cyan-300">냉장고 열는 중...</p>
        </div>
      </div>
    );
  }

  if (!fridge) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pb-20">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-300" />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{fridge.icon}</span>
              <div>
                <h1 className="text-xl font-bold text-white">{fridge.name}</h1>
                {fridge.description && (
                  <p className="text-slate-400 text-sm">{fridge.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleDeleteFridge}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 냉장고 컨테이너 */}
        <div className="max-w-4xl mx-auto">
          {/* 물품 개수 & 추가 버튼 */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Snowflake className="w-5 h-5 text-cyan-400 animate-pulse" />
                <span className="text-cyan-300 font-medium">
                  {items.length}개의 물품
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <span className="flex items-center gap-1">
                  <Move className="w-4 h-4" />
                  드래그하여 이동
                </span>
                <span className="flex items-center gap-1">
                  <MoreVertical className="w-4 h-4" />
                  상세 보기
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-500/30"
            >
              <Plus className="w-5 h-5" />
              물품 추가
            </button>
          </div>

          {/* 실제 냉장고 UI */}
          <div className="relative perspective-1000">
            {/* 냉장고 본체 */}
            <div
              className="relative bg-gradient-to-b from-slate-600 to-slate-700 rounded-3xl p-2 shadow-2xl"
              style={{
                boxShadow: `0 0 60px ${fridge.color}30, inset 0 0 30px rgba(0,0,0,0.3)`,
                border: `3px solid ${fridge.color}`,
              }}
            >
              {/* 냉장고 내부 */}
              <div
                ref={fridgeRef}
                className={`relative bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl overflow-hidden transition-all duration-700 ${
                  doorOpen ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  height: '600px',
                  boxShadow: 'inset 0 0 50px rgba(100, 200, 255, 0.3)',
                }}
              >
                {/* 냉기 효과 */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cyan-200/40 to-transparent animate-pulse" />
                  {/* 냉기 파티클 */}
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-white/60 rounded-full animate-float"
                      style={{
                        left: `${10 + (i * 12)}%`,
                        top: `${10 + (i % 3) * 30}%`,
                        animationDelay: `${i * 0.3}s`,
                        animationDuration: `${3 + (i % 2)}s`,
                      }}
                    />
                  ))}
                </div>

                {/* 내부 조명 */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-3 bg-yellow-200/80 rounded-b-full shadow-lg pointer-events-none" style={{ boxShadow: '0 10px 40px rgba(255, 230, 150, 0.5)' }} />

                {/* 선반 라인 (시각적 가이드) */}
                <div className="absolute inset-0 pointer-events-none">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0 h-1 bg-slate-300/50"
                      style={{ top: `${i * 25}%` }}
                    />
                  ))}
                </div>

                {/* 아이템들 */}
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <div className="text-8xl mb-4 opacity-50">📦</div>
                    <p className="text-lg mb-2">냉장고가 비어있어요</p>
                    <p className="text-sm text-slate-400">물품을 추가해보세요!</p>
                  </div>
                ) : (
                  items.map((item) => {
                    const expStatus = getExpirationStatus(item.expirationDate);
                    const isDragging = draggedItem?._id === item._id;
                    const position = isDragging ? dragPosition : (item.position || { x: 0, y: 0 });

                    return (
                      <div
                        key={item._id}
                        className={`absolute cursor-grab active:cursor-grabbing transition-shadow ${
                          isDragging ? 'z-[200] shadow-2xl scale-105' : 'z-10 hover:z-[100]'
                        }`}
                        style={{
                          left: position.x,
                          top: position.y,
                          transition: isDragging ? 'none' : 'box-shadow 0.2s',
                        }}
                        onMouseDown={(e) => handleDragStart(e, item)}
                        onTouchStart={(e) => handleDragStart(e, item)}
                      >
                        <div
                          className={`relative w-20 h-24 rounded-lg overflow-hidden shadow-lg group ${
                            expStatus.status === 'expired'
                              ? 'ring-2 ring-red-500 ring-offset-2'
                              : expStatus.status === 'warning'
                              ? 'ring-2 ring-orange-400 ring-offset-2'
                              : ''
                          } ${expStatus.status === 'expired' ? 'animate-shake' : ''}`}
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,240,240,0.95))',
                            boxShadow: isDragging
                              ? '0 20px 40px rgba(0,0,0,0.3)'
                              : '0 4px 12px rgba(0,0,0,0.15)'
                          }}
                        >
                          {/* 아이템 이미지 또는 아이콘 */}
                          {item.imageUrl ? (
                            <img
                              src={`http://localhost:3001${item.imageUrl}`}
                              alt={item.name}
                              className="w-full h-16 object-cover pointer-events-none"
                              draggable={false}
                            />
                          ) : (
                            <div className="w-full h-16 flex items-center justify-center bg-gradient-to-b from-white to-slate-100 text-3xl pointer-events-none">
                              {getCategoryIcon(item.category)}
                            </div>
                          )}

                          {/* 아이템 이름 */}
                          <div className="absolute bottom-0 left-0 right-0 bg-white/95 px-1 py-1 pointer-events-none">
                            <p className="text-xs font-medium text-slate-700 truncate text-center">
                              {item.name}
                            </p>
                          </div>

                          {/* 점 세개 메뉴 버튼 */}
                          <button
                            className="absolute top-1 left-1 w-5 h-5 bg-white/90 rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer z-10"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedItem(item);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-3 h-3 text-slate-600" />
                          </button>

                          {/* 유통기한 경고 표시 */}
                          {expStatus.status !== 'fresh' && (
                            <div className={`absolute top-1 right-1 w-3 h-3 rounded-full pointer-events-none ${
                              expStatus.status === 'expired' ? 'bg-red-500 animate-ping' : 'bg-orange-400'
                            }`} />
                          )}

                          {/* 호버 시 툴팁 */}
                          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {item.quantity}{item.unit} · {formatRelativeDate(item.expirationDate)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 문이 닫혀있을 때 */}
              <div
                className={`absolute inset-2 bg-gradient-to-b from-slate-500 to-slate-600 rounded-2xl transition-all duration-700 flex items-center justify-center ${
                  doorOpen ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100'
                }`}
              >
                <button
                  onClick={() => setDoorOpen(true)}
                  className="text-white text-lg font-medium"
                >
                  <div className="text-6xl mb-4">{fridge.icon}</div>
                  <p>클릭하여 열기</p>
                </button>
              </div>

              {/* 냉장고 손잡이 */}
              <div
                className="absolute right-6 top-1/2 transform -translate-y-1/2 w-3 h-20 bg-slate-400 rounded-full shadow-inner"
                style={{ boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.3)' }}
              />
            </div>

            {/* 냉장고 그림자 */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-4/5 h-8 bg-black/20 rounded-full blur-xl" />
          </div>

          {/* 문 닫기 버튼 */}
          {doorOpen && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setDoorOpen(false)}
                className="text-slate-400 hover:text-cyan-400 transition-colors text-sm"
              >
                🚪 문 닫기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 아이템 상세 모달 */}
      {selectedItem && !draggedItem && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[300]"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedItem.imageUrl && (
              <img
                src={`http://localhost:3001${selectedItem.imageUrl}`}
                alt={selectedItem.name}
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
            )}

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{getCategoryIcon(selectedItem.category)}</span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(selectedItem.category)}`}>
                    {selectedItem.category}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">수량</span>
                <span className="font-medium">{selectedItem.quantity}{selectedItem.unit}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">구매일</span>
                <span className="font-medium">{formatDate(selectedItem.purchaseDate)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">유통기한</span>
                <span className={`font-medium ${getExpirationStatus(selectedItem.expirationDate).color}`}>
                  {formatDate(selectedItem.expirationDate)} ({formatRelativeDate(selectedItem.expirationDate)})
                </span>
              </div>
              {selectedItem.memo && (
                <div className="py-2">
                  <span className="text-gray-500 block mb-1">메모</span>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{selectedItem.memo}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                닫기
              </button>
              <button
                onClick={() => handleDeleteItem(selectedItem._id)}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[300] overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8 shadow-2xl">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
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
                  className="flex-1 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors disabled:bg-gray-400"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 커스텀 애니메이션 스타일 */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) scale(1.1);
            opacity: 0.3;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out infinite;
        }

        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
