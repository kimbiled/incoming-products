// src/types/index.ts

// Единицы измерения
export type Unit = 'kg' | 'pcs';

// Поставщик
export interface Supplier {
  id: string;
  name: string;
}

// Продукт
export interface Product {
  id: string;
  name: string;
  unit: Unit;
}

// Черновик строки (в процессе редактирования)
export interface LineDraft {
  qty: number;
  price?: number;
}

// Итоговая строка для отправки
export interface LineItem {
  productId: string;
  productName: string;
  unit: Unit;
  quantity: number;
  price: number;
  total: number;
}

// Статус накладной
export type Status = 'registered' | 'not_ready';

// Роли пользователей
export type Role = 'cook' | 'barista' | 'manager';

// Склад
export interface Warehouse {
  id: string;
  name: string;
  restaurantId: string; // REST_1 или REST_2
}

// Текущий пользователь
export interface CurrentUser {
  id: string;
  name: string;
  role: Role;
  restaurantId: string; // REST_1 или REST_2
}

// Основной payload накладной
export interface ReceiptPayload {
  restaurantId: string;
  supplierId: string;
  createdAt: string; // ISO
  items: LineItem[];
  grandTotal: number;
}
