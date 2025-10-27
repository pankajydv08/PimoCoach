import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface ChartWrapperProps {
  data: ChartData<'line'>;
  options?: ChartOptions<'line'>;
  height?: number;
}

export default function ChartWrapper({ data, options, height = 220 }: ChartWrapperProps) {
  const defaultOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    interaction: { mode: 'index' as const, intersect: false },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: 100,
        ticks: { callback: (v) => `${v}%` as any }
      }
    }
  };

  return (
    <div style={{ height }}>
      <Line data={data} options={{ ...defaultOptions, ...(options || {}) }} />
    </div>
  );
}
