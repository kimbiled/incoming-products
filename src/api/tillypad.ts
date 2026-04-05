// src/api/tillypad.ts
import type { Product, Supplier, Warehouse } from '@/types'

const mockSuppliers: Supplier[] = [
  { id: 'sup-1', name: 'Metro' },
  { id: 'sup-2', name: 'Small Local Farm' },
  { id: 'sup-3', name: 'Beverage Co' },
]

// продукты (единицы измерения уже вбиты в Tillypad: kg / pcs)
const mockProducts: Product[] = [
  { id: 'p-apple', name: 'Яблоко', unit: 'kg' },
  { id: 'p-beef', name: 'Говядина вырезка', unit: 'kg' },
  { id: 'p-cola', name: 'Cola 0.5L', unit: 'pcs' },
]

// склады по ресторанам
const mockWarehouses: (Warehouse & { restaurantId: string })[] = [
  { id: 'wh-1', name: 'Основной склад кухни', restaurantId: 'REST_1' },
  { id: 'wh-2', name: 'Склад бара',           restaurantId: 'REST_1' },
  { id: 'wh-3', name: 'Основной склад кухни', restaurantId: 'REST_2' },
  { id: 'wh-4', name: 'Склад бара',           restaurantId: 'REST_2' },
]

export async function fetchSuppliers(restaurantId: string): Promise<Supplier[]> {
  await delay(120)
  // при необходимости можно фильтровать по restaurantId
  return mockSuppliers
}

export async function fetchProducts(restaurantId: string): Promise<Product[]> {
  await delay(120)
  return mockProducts
}

export async function fetchWarehouses(restaurantId: string): Promise<Warehouse[]> {
  await delay(120)
  return mockWarehouses.filter(w => w.restaurantId === restaurantId)
}

// имитация POST /receipts
export async function postReceipt(payload: unknown): Promise<{ ok: boolean }> {
  // eslint-disable-next-line no-console
  console.log('POST /api/receipts (mock):', payload)
  await delay(200)
  return { ok: true }
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
