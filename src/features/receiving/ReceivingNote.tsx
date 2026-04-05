'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import type { Supplier, Status, Warehouse, Product, LineItem } from '@/types';
import { SupplierSelect } from '@/components/SupplierSelect';
import { DateTimeField } from '@/components/DateTimeField';
import {
  RESTAURANT_ID,
  codeByRestaurant,
} from '@/features/receiving/constants';
import {
  fetchSuppliers,
  fetchWarehouses,
  fetchProducts,
  postReceipt,
} from '@/api/tillypad';
import {
  Select,
  Tabs,
  Input,
  DatePicker,
  Modal,
  message,
  Tooltip,
  Empty,
} from 'antd';
import { useCurrentUser } from '../../../app/AuthContext';
import { ProductTable, type DraftMap } from '@/features/receiving/ProductTable';
import { fmtMoney } from '@/helpers/format';
import { rowTotal } from '@/helpers/math';
import { useScale } from '@/hooks/useScale';
import { JsonPreview } from '@/components/JsonPreview';

export const ReceivingNote: React.FC = () => {
  const user = useCurrentUser();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [supplierId, setSupplierId] = useState<string | undefined>();
  const [status, setStatus] = useState<Status>('registered');
  const [warehouseId, setWarehouseId] = useState<string>('');

  const [noteTime, setNoteTime] = useState<Dayjs>(dayjs());
  const [draft, setDraft] = useState<DraftMap>({});
  const [focusedProductId, setFocusedProductId] = useState<string | null>(null);

  // Дополнительно
  const [notes, setNotes] = useState('');
  const descriptionCode = codeByRestaurant(RESTAURANT_ID);
  const subdivision = descriptionCode;

  // Счёт-фактура
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Dayjs | null>(null);
  const [documentDate, setDocumentDate] = useState<Dayjs>(dayjs());

  // Весы
  const scale = useScale({ simulate: true });

  useEffect(() => {
    fetchSuppliers(RESTAURANT_ID).then(setSuppliers);
    fetchWarehouses(RESTAURANT_ID).then((ws) => {
      setWarehouses(ws);
      const preferred =
        ws.find((w) =>
          user.role === 'cook' ? /кухн/i.test(w.name) : /бар/i.test(w.name),
        )?.id ?? ws[0]?.id;
      setWarehouseId(preferred || '');
    });
    fetchProducts(RESTAURANT_ID).then(setProducts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Автоввод веса для kg
  useEffect(() => {
    if (!scale.connected || scale.lastWeight == null) return;
    const pid =
      focusedProductId ||
      products.find((p) => p.unit === 'kg' && !draft[p.id]?.qty)?.id;
    if (!pid) return;
    setDraft((prev) => ({
      ...prev,
      [pid]: { qty: +scale.lastWeight!.toFixed(3), price: prev[pid]?.price },
    }));
  }, [scale.lastWeight, scale.connected, focusedProductId, products, draft]);

  // Итемы и сумма
  const items: LineItem[] = useMemo(
    () =>
      products
        .map((p) => ({
          productId: p.id,
          productName: p.name,
          unit: p.unit,
          quantity: draft[p.id]?.qty || 0,
          price: draft[p.id]?.price || 0,
          total: rowTotal(
            p.unit,
            draft[p.id]?.qty || 0,
            draft[p.id]?.price || 0,
          ),
        }))
        .filter((i) => i.quantity > 0 && i.price > 0),
    [products, draft],
  );

  const grandTotal = useMemo(
    () => items.reduce((s, i) => s + i.total, 0),
    [items],
  );

  // Гейтинг
  const canPickStatusAndWarehouse = !!supplierId;
  const canEditProducts = canPickStatusAndWarehouse && !!warehouseId;
  const canSubmit = canEditProducts && items.length > 0;

  const submit = async () => {
    if (!supplierId) return message.error('Выберите поставщика.');
    if (!warehouseId) return message.error('Выберите склад.');
    if (items.length === 0)
      return message.error(
        'Добавьте хотя бы одну позицию с количеством и ценой.',
      );

    const payload = {
      restaurantId: RESTAURANT_ID,
      supplierId,
      createdAt: noteTime.toDate().toISOString(),
      items,
      grandTotal,
      header: {
        status,
        warehouseId,
        employeeId: user.id,
        employeeName: user.name,
        descriptionCode,
        notes,
        subdivision,
        invoiceNumber,
        invoiceDate: invoiceDate
          ? invoiceDate.toDate().toISOString().slice(0, 10)
          : undefined,
        documentDate: documentDate.toDate().toISOString(),
      },
    };

    Modal.info({
      title: 'Проверка перед отправкой',
      width: 780,
      content: <JsonPreview data={payload} />,
    });
    const { ok } = await postReceipt(payload);
    ok
      ? (message.success('Отправлено'), setDraft({}))
      : message.error('Ошибка при отправке');
  };

  const renderStatusBadge = (s: Status) => {
    const text = s === 'registered' ? 'Зарегистрирован' : 'Не готов';
    const cls =
      s === 'registered'
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
        : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${cls}`}>{text}</span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Хедер (карточка) */}
      <div className="rounded-3xl p-5 shadow-sm bg-white/90 border border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-xl font-semibold tracking-tight"
              style={{ color: 'var(--brand)' }}
            >
              Приходная накладная
            </h2>
            <p className="text-gray-500 text-sm">
              Ресторан <span className="font-medium">{RESTAURANT_ID}</span> ·
              Пользователь:
              <span className="font-medium"> {user.name}</span> (
              <span className="uppercase">{user.role}</span>)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {renderStatusBadge(status)}
            <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
              Код: {descriptionCode}
            </span>
            <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
              Подразделение: {subdivision}
            </span>
          </div>
        </div>

        {/* Шаги */}
        <div className="mt-4 grid md:grid-cols-4 gap-4">
          {/* Шаг 1 */}
          <div className="rounded-2xl p-3 border border-gray-100 bg-gray-50">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              Шаг 1
            </div>
            <div className="font-medium">Поставщик</div>
            <div className="mt-2">
              {suppliers.length ? (
                <SupplierSelect
                  suppliers={suppliers}
                  value={supplierId}
                  onChange={setSupplierId}
                />
              ) : (
                <Empty
                  description="Нет поставщиков"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </div>

          {/* Шаг 2 */}
          <div
            className={`rounded-2xl p-3 border ${
              canPickStatusAndWarehouse
                ? 'bg-gray-50 border-gray-100'
                : 'bg-gray-50/50 border-dashed border-gray-200'
            }`}
          >
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              Шаг 2
            </div>
            <div className="font-medium">Статус и склад</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Tooltip
                title={
                  !canPickStatusAndWarehouse
                    ? 'Сначала выберите поставщика'
                    : ''
                }
              >
                <Select
                  className="w-full"
                  value={status}
                  onChange={setStatus}
                  disabled={!canPickStatusAndWarehouse}
                  options={[
                    { value: 'registered', label: 'Зарегистрирован' },
                    { value: 'not_ready', label: 'Не готов' },
                  ]}
                />
              </Tooltip>
              <Tooltip
                title={
                  !canPickStatusAndWarehouse
                    ? 'Сначала выберите поставщика'
                    : ''
                }
              >
                {warehouses.length ? (
                  <Select
                    className="w-full"
                    value={warehouseId}
                    onChange={setWarehouseId}
                    disabled={!canPickStatusAndWarehouse}
                    options={warehouses.map((w) => ({
                      value: w.id,
                      label: w.name,
                    }))}
                    placeholder="Склад"
                  />
                ) : (
                  <div className="col-span-1">
                    <Empty
                      description="Нет складов"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  </div>
                )}
              </Tooltip>
            </div>
          </div>

          {/* Шаг 3 */}
          <div
            className={`rounded-2xl p-3 border ${
              canEditProducts
                ? 'bg-gray-50 border-gray-100'
                : 'bg-gray-50/50 border-dashed border-gray-200'
            }`}
          >
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              Шаг 3
            </div>
            <div className="font-medium">Дата</div>
            <div className="mt-2">
              <DateTimeField value={noteTime} onChange={setNoteTime} />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              По умолчанию — текущее; можно изменить.
            </p>
          </div>

          {/* Шаг 4 */}
          <div
            className={`rounded-2xl p-3 border ${
              canEditProducts
                ? 'bg-gray-50 border-gray-100'
                : 'bg-gray-50/50 border-dashed border-gray-200'
            }`}
          >
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              Шаг 4
            </div>
            <div className="font-medium">Весы</div>
            <div className="mt-2 flex gap-2">
              <button
                className="px-4 py-2 rounded-2xl text-white disabled:opacity-50"
                style={{
                  background: 'linear-gradient(90deg, var(--brand), #2c2c2c)',
                }}
                onClick={scale.connect}
                disabled={
                  !canEditProducts || scale.connecting || scale.connected
                }
              >
                {scale.connected
                  ? 'Подключено'
                  : scale.connecting
                  ? 'Подключение…'
                  : 'Подключить'}
              </button>
              <button
                className="px-3 py-2 rounded-2xl bg-gray-100"
                onClick={scale.disconnect}
                disabled={!scale.connected}
              >
                Отключить
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Сейчас — симуляция (каждые ~3 сек).
            </p>
          </div>
        </div>
      </div>

      {/* Таблица товаров */}
      <div className="rounded-3xl shadow-sm border border-gray-100 bg-white/90">
        <div className="p-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">Шаг 5 — товары и цены</div>
          <div className="text-sm font-semibold">
            Итого: {fmtMoney(grandTotal)}
          </div>
        </div>
        {products.length ? (
          <div
            className={`${
              canEditProducts ? '' : 'pointer-events-none opacity-50'
            }`}
          >
            <ProductTable
              products={products}
              draft={draft}
              onChange={setDraft}
              onFocusRow={setFocusedProductId}
              kgReadOnly={scale.connected}
              activeProductId={focusedProductId ?? undefined}
            />
          </div>
        ) : (
          <div className="py-8">
            <Empty
              description="Нет товаров"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
        {!canEditProducts && products.length > 0 && (
          <div className="px-4 pb-4 text-sm text-gray-500">
            Чтобы редактировать товары, выберите поставщика и склад.
          </div>
        )}
        <div className="p-4 flex justify-end gap-2">
          <button
            className="px-3 py-2 rounded-2xl bg-gray-100"
            onClick={() => setDraft({})}
          >
            Сбросить
          </button>
          <Tooltip
            title={
              !canSubmit ? 'Добавьте товары и заполните цену/количество' : ''
            }
          >
            <button
              className="px-4 py-2 rounded-2xl text-white disabled:opacity-50"
              style={{
                background: 'linear-gradient(90deg, var(--brand), #2c2c2c)',
              }}
              onClick={submit}
              disabled={!canSubmit}
            >
              Сохранить / Отправить
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Вкладки */}
      <div className="rounded-3xl shadow-sm bg-white/90 p-4 border border-gray-100">
        <Tabs
          items={[
            {
              key: 'more',
              label: 'Дополнительно',
              children: (
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Сотрудник</div>
                    <Input value={`${user.name} (${user.id})`} readOnly />
                    <div className="text-[11px] text-gray-400 mt-1">
                      Подставляется из аккаунта. Роль: {user.role}.
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Описание (код)
                    </div>
                    <Input value={descriptionCode} readOnly />
                    <div className="text-[11px] text-gray-400 mt-1">
                      F — Farhi; FH — Farhi Hall (по ресторану).
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Подразделение
                    </div>
                    <Input value={subdivision} readOnly />
                  </div>
                  <div className="md:col-span-3">
                    <div className="text-sm text-gray-600 mb-1">Заметки</div>
                    <Input.TextArea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Комментарий (необязательно)"
                    />
                  </div>
                </div>
              ),
            },
            {
              key: 'invoice',
              label: 'Счёт-фактура',
              children: (
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Номер документа
                    </div>
                    <Input
                      placeholder="№ счёт-фактуры"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Дата документа
                    </div>
                    <DatePicker
                      className="w-full"
                      value={invoiceDate}
                      onChange={setInvoiceDate}
                      format="YYYY-MM-DD"
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Дата (сегодня) и время
                    </div>
                    <DatePicker
                      className="w-full"
                      showTime
                      value={documentDate}
                      onChange={(v) => setDocumentDate(v ?? dayjs())}
                      format="YYYY-MM-DD HH:mm:ss"
                    />
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};
