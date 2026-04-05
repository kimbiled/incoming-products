// src/features/receiving/constants.ts

// Переменная окружения задаётся в .env.local
// NEXT_PUBLIC_RESTAURANT_ID=REST_1 или REST_2

export const RESTAURANT_ID: string =
  process.env.NEXT_PUBLIC_RESTAURANT_ID ?? 'REST_1';

// По ресторану подставляем код для описания/подразделения
export function codeByRestaurant(restaurantId: string): 'F' | 'FH' {
  // REST_1 → Farhi → 'F', REST_2 → Farhi Hall → 'FH'
  return restaurantId === 'REST_2' ? 'FH' : 'F';
}
