import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { motion } from 'motion/react';

interface ChartProps {
  type: 'area' | 'bar';
  data: any[];
  dataKey: string;
  color?: string;
  title: string;
}

export const RealTimeChart: React.FC<ChartProps> = ({ type, data, dataKey, color = '#4f46e5', title }) => {
  const gradientId = useMemo(() => `gradient-${title.replace(/\s+/g, '-').toLowerCase()}`, [title]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded border border-slate-100 bg-white/95 p-2 shadow-lg backdrop-blur-md">
          <p className="mb-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</p>
          <p className="text-xs font-black text-slate-900">
            {payload[0].value.toLocaleString()} 
            <span className="ml-1 text-[9px] font-medium text-slate-400 lowercase">unit/log</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{title}</h3>
        <div className="flex h-4 items-center gap-1.5 rounded bg-indigo-50 px-1.5 py-0.5">
          <div className="h-1 w-1 animate-pulse rounded-full bg-indigo-500" />
          <span className="text-[9px] font-black text-indigo-600 tracking-tighter uppercase">LIVE STREAM</span>
        </div>
      </div>
      
      <div className="relative h-56 w-full min-h-[14rem]">
        <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={0}>
          {type === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="step"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                animationDuration={1500}
              />
            </AreaChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey={dataKey} radius={[2, 2, 0, 0]} animationDuration={1000}>
                {data.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={color} 
                    fillOpacity={0.9 - (index * 0.05)} 
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
