import dynamic from 'next/dynamic';

// SSR desactivado: Recharts accede a APIs de browser (ResizeObserver, etc.)
export const TrendChartWrapper = dynamic(
  () => import('./TrendChart').then((m) => m.TrendChart),
  { ssr: false },
);
