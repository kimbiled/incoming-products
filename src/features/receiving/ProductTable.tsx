'use client';

import React, { useMemo } from 'react';
import { Table, InputNumber, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { LineDraft, Product } from '@/types';
import { rowTotal } from '@/helpers/math';

export type DraftMap = Record<string, LineDraft>;

type Props = {
  products: Product[];
  draft: DraftMap;
  onChange: (next: DraftMap) => void;
  onFocusRow?: (productId: string) => void;
  kgReadOnly?: boolean;
  activeProductId?: string;
};

export const ProductTable: React.FC<Props> = ({
  products,
  draft,
  onChange,
  onFocusRow,
  kgReadOnly,
  activeProductId,
}) => {
  const columns: ColumnsType<Product> = useMemo(
    () => [
      {
        title: 'Товар',
        dataIndex: 'name',
        key: 'name',
        render: (_, r) => (
          <div className="flex items-center gap-2">
            {r.unit === 'kg' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                KG
              </span>
            )}
            <div className="font-medium">{r.name}</div>
            <div className="text-xs text-gray-500">[{r.unit}]</div>
          </div>
        ),
      },
      {
        title: 'Кол-во',
        key: 'qty',
        width: 180,
        render: (_, r) => (
          <div className="flex items-center gap-2">
            <InputNumber
              className="w-full"
              value={draft[r.id]?.qty ?? 0}
              min={0}
              step={r.unit === 'kg' ? 0.001 : 1}
              onChange={(v) =>
                onChange({
                  ...draft,
                  [r.id]: { qty: Number(v || 0), price: draft[r.id]?.price },
                })
              }
              onFocus={() => onFocusRow?.(r.id)}
              readOnly={r.unit === 'kg' && !!kgReadOnly}
            />
            <span className="text-gray-500 text-xs">{r.unit}</span>
          </div>
        ),
      },
      {
        title: 'Цена',
        key: 'price',
        width: 180,
        render: (_, r) => (
          <InputNumber
            className="w-full"
            min={0}
            step={0.01}
            value={draft[r.id]?.price}
            onChange={(v) =>
              onChange({
                ...draft,
                [r.id]: { qty: draft[r.id]?.qty || 0, price: v as number },
              })
            }
            placeholder="KZT"
          />
        ),
      },
      {
        title: 'Итого',
        key: 'total',
        width: 160,
        render: (_, r) => {
          const l = draft[r.id] || { qty: 0, price: 0 };
          const total = rowTotal(r.unit, l.qty || 0, l.price || 0);
          return (
            <div className="font-semibold">{total.toLocaleString()} ₸</div>
          );
        },
      },
    ],
    [draft, onChange, onFocusRow, kgReadOnly],
  );

  return (
    <div className="relative">
      <Table
        rowKey="id"
        dataSource={products}
        columns={columns}
        pagination={false}
        sticky
        locale={{
          emptyText: (
            <Empty
              description="Нет строк"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
        rowClassName={(record) => {
          const base: string[] = [];
          if (record.unit === 'kg') base.push('bg-amber-50/20');
          if (activeProductId && activeProductId === record.id)
            base.push('ring-2 ring-amber-300');
          return base.join(' ');
        }}
      />
    </div>
  );
};
