
import React from 'react';
import { User } from '../types';
import { Sun, Calendar, BookOpen } from 'lucide-react';

interface ActivityStatsProps {
  activityLog: User['activityLog'];
}

const ActivityStats: React.FC<ActivityStatsProps> = ({ activityLog }) => {
  const formatMinutes = (minutes: number) => {
    if (minutes < 1) return 'أقل من دقيقة';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    let result = '';
    if (hours > 0) result += `${hours} ساعة`;
    if (mins > 0) result += ` ${mins} دقيقة`;
    return result.trim();
  };

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7); // YYYY-MM

  const dailyMinutes = activityLog?.[today] || 0;
  
  const monthlyMinutes = Object.entries(activityLog || {})
    .filter(([date]) => date.startsWith(thisMonth))
    .reduce((sum, [, minutes]) => sum + Number(minutes), 0);

  // Approximate term as last 3 months
  const termMonths = [...Array(3)].map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().substring(0, 7);
  });
  const termMinutes = Object.entries(activityLog || {})
    .filter(([date]) => termMonths.includes(date.substring(0, 7)))
    .reduce((sum, [, minutes]) => sum + Number(minutes), 0);

  const stats = [
    { icon: <Sun />, label: 'نشاط اليوم', value: formatMinutes(dailyMinutes), color: 'text-amber-400' },
    { icon: <Calendar />, label: 'نشاط الشهر', value: formatMinutes(monthlyMinutes), color: 'text-blue-400' },
    { icon: <BookOpen />, label: 'نشاط الفصل', value: formatMinutes(termMinutes), color: 'text-green-400' },
  ];

  return (
    <div className="space-y-4">
      {stats.map((stat, i) => (
        <div key={i} className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color} bg-white/5`}>
              {stat.icon}
            </div>
            <span className="font-bold text-sm text-gray-300">{stat.label}</span>
          </div>
          <span className={`font-black text-lg ${stat.color}`}>{stat.value}</span>
        </div>
      ))}
    </div>
  );
};

export default ActivityStats;
