'use client';

import React from 'react';
import { Select } from 'antd';
import type { Supplier } from '@/types';

type Props = {
  suppliers: Supplier[];
  value?: string;
  onChange: (id: string) => void;
};

export const SupplierSelect: React.FC<Props> = ({
  suppliers,
  value,
  onChange,
}) => (
  <Select
    placeholder="Выберите поставщика"
    value={value}
    onChange={onChange}
    options={suppliers.map((s) => ({ label: s.name, value: s.id }))}
    showSearch
    filterOption={(input, option) =>
      (option?.label as string).toLowerCase().includes(input.toLowerCase())
    }
    getPopupContainer={(trigger) => trigger.parentElement as HTMLElement}
    className="w-full"
  />
);
