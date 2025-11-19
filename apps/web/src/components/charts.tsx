'use client';

import { useMemo } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  showLabels?: boolean;
}

export function LineChart({
  data,
  height = 200,
  color = '#2d3494',
  showGrid = true,
  showLabels = true,
}: LineChartProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const { points, maxValue, minValue } = useMemo(() => {
    if (!data.length) return { points: '', maxValue: 0, minValue: 0 };

    const values = data.map((d) => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    const width = 100;
    const step = width / (data.length - 1 || 1);

    const pointsArray = data.map((d, i) => {
      const x = i * step;
      const y = height - ((d.value - min) / range) * (height - 20);
      return `${x},${y}`;
    });

    return {
      points: pointsArray.join(' '),
      maxValue: max,
      minValue: min,
    };
  }, [data, height]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Line chart showing data trends"
      >
        {showGrid && (
          <g className="text-gray-200" stroke="currentColor" strokeWidth="0.2">
            <line x1="0" y1="0" x2="100" y2="0" />
            <line x1="0" y1={height / 4} x2="100" y2={height / 4} />
            <line x1="0" y1={height / 2} x2="100" y2={height / 2} />
            <line x1="0" y1={(height * 3) / 4} x2="100" y2={(height * 3) / 4} />
            <line x1="0" y1={height} x2="100" y2={height} />
          </g>
        )}

        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
          className={prefersReducedMotion ? '' : 'transition-all duration-300'}
        />

        <polyline
          fill={`url(#gradient-${color.replace('#', '')})`}
          stroke="none"
          points={`0,${height} ${points} 100,${height}`}
          className={prefersReducedMotion ? '' : 'transition-all duration-300'}
        />

        <defs>
          <linearGradient
            id={`gradient-${color.replace('#', '')}`}
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {showLabels && (
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{data[0]?.label}</span>
          <span>{data[Math.floor(data.length / 2)]?.label}</span>
          <span>{data[data.length - 1]?.label}</span>
        </div>
      )}
    </div>
  );
}

interface BarChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
}

export function BarChart({ data, height = 200, color = '#2d3494' }: BarChartProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const maxValue = useMemo(() => {
    if (!data.length) return 0;
    return Math.max(...data.map((d) => d.value));
  }, [data]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-2" role="img" aria-label="Bar chart showing data distribution">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <span className="text-sm text-gray-600 w-24 text-right truncate">
            {item.label}
          </span>
          <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
            <div
              className={`h-full rounded-full ${prefersReducedMotion ? '' : 'transition-all duration-500'}`}
              style={{
                width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <span className="text-sm font-medium text-gray-900 w-12 text-right">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

interface PieChartProps {
  data: DataPoint[];
  size?: number;
  colors?: string[];
}

export function PieChart({
  data,
  size = 200,
  colors = ['#2d3494', '#0784b5', '#16a34a', '#f59e0b', '#dc2626'],
}: PieChartProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const { paths, total } = useMemo(() => {
    if (!data.length) return { paths: [], total: 0 };

    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = -90;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    const paths = data.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const angle = (item.value / total) * 360;
      const endAngle = currentAngle + angle;

      const startX = centerX + radius * Math.cos((currentAngle * Math.PI) / 180);
      const startY = centerY + radius * Math.sin((currentAngle * Math.PI) / 180);
      const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
      const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const path = `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

      currentAngle = endAngle;

      return {
        path,
        color: colors[index % colors.length],
        label: item.label,
        value: item.value,
        percentage: percentage.toFixed(1),
      };
    });

    return { paths, total };
  }, [data, colors]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        role="img"
        aria-label="Pie chart showing data distribution"
      >
        {paths.map((item, index) => (
          <path 
            key={index} 
            d={item.path} 
            fill={item.color}
            className={prefersReducedMotion ? '' : 'transition-all duration-300'}
          />
        ))}
      </svg>
      <div className="grid grid-cols-2 gap-2 w-full">
        {paths.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-600 truncate">
              {item.label}: {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
