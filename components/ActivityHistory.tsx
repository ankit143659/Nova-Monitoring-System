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
    <div className="bg-surface rounded-2xl border border-surfaceLight overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-surfaceLight flex items-center justify-between bg-surface/50 backdrop-blur-sm sticky top-0">
        <h3 className="font-bold flex items-center gap-2 text-slate-200">
          <Clock className="w-5 h-5 text-accent" />
          Recent Activity
        </h3>
        <span className="text-xs text-slate-500 bg-surfaceLight/30 px-2 py-1 rounded">
          Last 20 entries
        </span>
      </div>

      <div className="overflow-y-auto flex-1 p-0">
        <table className="w-full text-left border-collapse">
            <thead className="bg-surfaceLight/20 text-xs uppercase text-slate-500 sticky top-0">
                <tr>
                    <th className="p-3 font-medium">Time</th>
                    <th className="p-3 font-medium">Application</th>
                    <th className="p-3 font-medium">Window Title</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-surfaceLight/50">
                {recentActivities.map((activity, idx) => (
                    <tr key={idx} className="hover:bg-surfaceLight/20 transition-colors">
                        <td className="p-3 whitespace-nowrap">
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400 font-mono">{activity.time}</span>
                                <span className="text-[10px] text-slate-600">{activity.date}</span>
                            </div>
                        </td>
                        <td className="p-3">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <AppWindow className="w-3 h-3 text-primary/70" />
                                {activity.processName || 'Unknown'}
                            </div>
                        </td>
                        <td className="p-3">
                            <div className="text-xs text-slate-400 truncate max-w-[200px] md:max-w-[300px]" title={activity.windowTitle}>
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
