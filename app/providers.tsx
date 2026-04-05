'use client';

import { ConfigProvider, theme as antdTheme } from 'antd';
import 'antd/dist/reset.css';
import React from 'react';
import { AuthProvider } from '../app/AuthContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#111827',
          borderRadius: 12,
          colorBgContainer: '#ffffff',
          colorText: '#0f172a',
        },
        components: {
          Card: { paddingLG: 16 },
          Input: { controlHeight: 38 },
          Select: { controlHeight: 38 },
          DatePicker: { controlHeight: 38 },
          Tabs: { titleFontSizeLG: 14 },
        },
      }}
    >
      <AuthProvider>{children}</AuthProvider>
    </ConfigProvider>
  );
}
