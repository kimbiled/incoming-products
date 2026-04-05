'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseScaleOptions {
  simulate?: boolean; // true — включить симуляцию
  baudRate?: number; // для реальных весов (Web Serial)
}

export function useScale(opts: UseScaleOptions = {}) {
  const { simulate = true, baudRate = 9600 } = opts;
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastWeight, setLastWeight] = useState<number | null>(null);
  const portRef = useRef<any>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  const connect = useCallback(async () => {
    if (
      simulate ||
      typeof navigator === 'undefined' ||
      !(navigator as any).serial
    ) {
      // включаем фейковое подключение, если нет Web Serial API
      setConnected(true);
      return;
    }
    try {
      setConnecting(true);
      const n = navigator as any;
      const port = await n.serial.requestPort();
      await port.open({ baudRate });
      portRef.current = port;
      setConnected(true);

      const reader = port.readable.getReader();
      readerRef.current = reader as any;
      const decoder = new TextDecoder();

      (async () => {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          const match = text.match(/([0-9]+(?:\.[0-9]+)?)/);
          if (match) setLastWeight(parseFloat(match[1]));
        }
      })();
    } catch (err) {
      console.error('Ошибка при подключении к весам:', err);
    } finally {
      setConnecting(false);
    }
  }, [simulate, baudRate]);

  const disconnect = useCallback(async () => {
    try {
      await readerRef.current?.cancel();
      await portRef.current?.close?.();
    } finally {
      setConnected(false);
    }
  }, []);

  // симуляция: каждые 3 сек подбрасываем случайный вес
  useEffect(() => {
    if (!connected || !simulate) return;
    const t = setInterval(() => {
      const weight = +(Math.random() * 3 + 0.2).toFixed(3);
      setLastWeight(weight);
    }, 3000);
    return () => clearInterval(t);
  }, [connected, simulate]);

  return { connecting, connected, connect, disconnect, lastWeight };
}
