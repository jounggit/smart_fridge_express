import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ItemCategory =
  | '채소'
  | '과일'
  | '육류'
  | '해산물'
  | '유제품'
  | '음료'
  | '조미료'
  | '냉동식품'
  | '기타';

export function getCategoryIcon(category: ItemCategory): string {
  const icons: Record<ItemCategory, string> = {
    채소: '🥬',
    과일: '🍎',
    육류: '🥩',
    해산물: '🐟',
    유제품: '🥛',
    음료: '🥤',
    조미료: '🧂',
    냉동식품: '🧊',
    기타: '📦',
  };
  return icons[category] || '📦';
}

export function getCategoryColor(category: ItemCategory): string {
  const colors: Record<ItemCategory, string> = {
    채소: 'bg-green-100 text-green-800 border-green-200',
    과일: 'bg-red-100 text-red-800 border-red-200',
    육류: 'bg-pink-100 text-pink-800 border-pink-200',
    해산물: 'bg-blue-100 text-blue-800 border-blue-200',
    유제품: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    음료: 'bg-purple-100 text-purple-800 border-purple-200',
    조미료: 'bg-orange-100 text-orange-800 border-orange-200',
    냉동식품: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    기타: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export type ExpirationStatus = 'expired' | 'warning' | 'fresh';

export function getExpirationStatus(expirationDate: string | Date): {
  status: ExpirationStatus;
  daysLeft: number;
  color: string;
  bgColor: string;
} {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      status: 'expired',
      daysLeft,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
    };
  } else if (daysLeft <= 3) {
    return {
      status: 'warning',
      daysLeft,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
    };
  } else {
    return {
      status: 'fresh',
      daysLeft,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
    };
  }
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateKorean(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '오늘';
  } else if (diffDays === 1) {
    return '내일';
  } else if (diffDays === -1) {
    return '어제';
  } else if (diffDays > 0) {
    return `${diffDays}일 후`;
  } else {
    return `${Math.abs(diffDays)}일 전`;
  }
}
