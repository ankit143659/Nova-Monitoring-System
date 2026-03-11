import React from 'react';
import { ActivityLogEntry } from '../types';
import { Clock, AppWindow, Calendar } from 'lucide-react';

interface ActivityHistoryProps {
  activities: Record<string, Record<string, ActivityLogEntry>> | null; // Date -> Timestamp -> Entry
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({ activities }) => {
  if (!activities) {
    return (
      <div className="bg-surface rounded-2xl border border-surfaceLight p-8 text-center text-slate-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>No activity history available.</p>
      </div>
    );
  }

  // Flatten and sort activities
  const sortedActivities: (ActivityLogEntry & { date: string, time: string })[] = [];
  
  Object.entries(activities).forEach(([date, timeMap]) => {
    Object.entries(timeMap).forEach(([timeKey, entry]) => {
        // Parse the time key HHMMSS to readable
        const formattedTime = `${timeKey.slice(0,2)}:${timeKey.slice(2,4)}:${timeKey.slice(4,6)}`;
        sortedActivities.push({
            ...entry,
            date,
            time: formattedTime
        });
    });
  });

  // Sort descending by date + time
  sortedActivities.sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.time}`).getTime();
    const timeB = new Date(`${b.date}T${b.time}`).getTime();
    return timeB - timeA;
  });

  const recentActivities = sortedActivities.slice(0, 20); // Show last 20

  return (
    <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden flex flex-col h-full relative">
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md sticky top-0 z-10">
        <h3 className="font-bold flex items-center gap-2 text-white font-display tracking-tight">
          <Clock className="w-5 h-5 text-accent" />
          Recent Activity
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-black/20 px-2 py-1 rounded border border-white/5">
          Live Feed
        </span>
      </div>

      <div className="overflow-y-auto flex-1 p-0 custom-scrollbar">
        <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-500 sticky top-0 backdrop-blur-sm z-10">
                <tr>
                    <th className="p-4 font-bold border-b border-white/5">Time</th>
                    <th className="p-4 font-bold border-b border-white/5">Application</th>
                    <th className="p-4 font-bold border-b border-white/5">Window Title</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {recentActivities.map((activity, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4 whitespace-nowrap">
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-300 font-mono group-hover:text-primary transition-colors">{activity.time}</span>
                                <span className="text-[10px] text-slate-600">{activity.date}</span>
                            </div>
                        </td>
                        <td className="p-4">
                            <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                                <div className="p-1.5 rounded bg-white/5 text-slate-400 group-hover:text-white group-hover:bg-primary/20 transition-colors">
                                   <AppWindow className="w-3 h-3" />
                                </div>
                                {activity.processName || 'Unknown'}
                            </div>
                        </td>
                        <td className="p-4">
                            <div className="text-xs text-slate-500 truncate max-w-[150px] md:max-w-[250px] font-mono opacity-80 group-hover:opacity-100 transition-opacity" title={activity.windowTitle}>
                                {activity.windowTitle}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};
