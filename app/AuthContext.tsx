'use client';

import React, { createContext, useContext } from 'react';
import type { CurrentUser } from '../src/types/index';
import { RESTAURANT_ID } from '@/features/receiving/constants';

// мок-пользователь (тестовый)
const mockUser: CurrentUser = {
  id: 'u-101',
  name: 'Иван Повар',
  role: 'cook',
  restaurantId: RESTAURANT_ID,
};

const AuthCtx = createContext<CurrentUser>(mockUser);

export const useCurrentUser = () => useContext(AuthCtx);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthCtx.Provider value={mockUser}>{children}</AuthCtx.Provider>
);
