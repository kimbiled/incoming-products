'use client'

import React from 'react'
import { DatePicker } from 'antd'
import dayjs, { Dayjs } from 'dayjs'

type Props = {
  value: Dayjs
  onChange: (v: Dayjs) => void
}

export const DateTimeField: React.FC<Props> = ({ value, onChange }) => (
  <DatePicker
    className="w-full"
    showTime
    value={value}
    onChange={(v) => onChange(v ?? dayjs())}
    format="YYYY-MM-DD HH:mm:ss"
  />
)
