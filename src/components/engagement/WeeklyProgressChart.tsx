import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const MOCK_DATA = [
  { day: 'Mon', questions: 12 },
  { day: 'Tue', questions: 18 },
  { day: 'Wed', questions: 5 },
  { day: 'Thu', questions: 25 },
  { day: 'Fri', questions: 15 },
  { day: 'Sat', questions: 32 },
  { day: 'Sun', questions: 20 },
];

export default function WeeklyProgressChart() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="card-glass border-white/5 p-4 h-64 flex items-center justify-center">
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Initializing...</div>
      </div>
    );
  }

  return (
    <div className="card-glass border-white/5 p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-neon-cyan" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Weekly Activity</span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-neon-cyan">Questions Solved</span>
      </div>

      <div className="h-48 w-full min-h-[192px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <LineChart data={MOCK_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 900 }}
              dy={10}
            />
            <YAxis hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '8px' }}
              itemStyle={{ color: '#00f3ff', fontSize: '10px', fontWeight: 900 }}
              labelStyle={{ display: 'none' }}
            />
            <Line 
              type="monotone" 
              dataKey="questions" 
              stroke="#00f3ff" 
              strokeWidth={3} 
              dot={{ fill: '#00f3ff', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#00f3ff', strokeWidth: 4, fill: '#000' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
