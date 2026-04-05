'use client';

import React from 'react';

type Props = { data: unknown };

export const JsonPreview: React.FC<Props> = ({ data }) => (
  <pre className="mt-2 max-h-[60vh] overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-800">
    {JSON.stringify(data, null, 2)}
  </pre>
);
