'use client';

import dynamic from 'next/dynamic';

type Point = { label: string; value: number };

const AdminGrowthChart = dynamic(
  () => import('./AdminGrowthChart').then((m) => ({ default: m.AdminGrowthChart })),
  { ssr: false, loading: () => <div className="mt-3 h-16 w-full animate-pulse rounded-xl bg-stone-100" /> },
);

export function AdminGrowthChartWrapper({
  data,
  color,
}: {
  data: Point[];
  color: string;
}) {
  return <AdminGrowthChart data={data} color={color} />;
}
