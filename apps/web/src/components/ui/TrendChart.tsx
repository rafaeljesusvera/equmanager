'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Point = { label: string; value: number };

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs shadow-md">
      <div className="font-bold text-stone-500">{label}</div>
      <div className="mt-0.5 text-base font-bold text-stone-900">{payload[0]?.value}</div>
    </div>
  );
}

export function TrendChart({
  data,
  total,
  label,
  color = '#15803d',
}: {
  data: Point[];
  total: number;
  label: string;
  color?: string;
}) {
  const prev = data[data.length - 2]?.value ?? 0;
  const curr = data[data.length - 1]?.value ?? 0;
  const diff = curr - prev;
  const gradId = `trend-${color.replace('#', '')}`;

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
      <div className="flex items-end justify-between px-4 pt-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
            {label}
          </div>
          <div className="mt-0.5 text-3xl font-bold tracking-tight text-stone-900">
            {total.toLocaleString('es-ES')}
          </div>
        </div>
        {diff !== 0 && (
          <div
            className={`mb-1 rounded-full px-2 py-0.5 text-xs font-bold ${
              diff > 0
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {diff > 0 ? '+' : ''}{diff} este mes
          </div>
        )}
      </div>
      <div className="h-20 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
