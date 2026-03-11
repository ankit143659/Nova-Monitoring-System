import React from 'react';
import { AlertOctagon, X } from 'lucide-react';

interface ViolationEntry {
  deviceId: string;
  labId: string;
  studentName: string;
  count: number;
  lastApp: string;
  time: string;
  events?: { app: string; time: string }[];
}

interface ViolationListProps {
  violations: Record<string, ViolationEntry>;
  onClear?: () => void;
}

export const ViolationList: React.FC<ViolationListProps> = ({ violations, onClear }) => {
  const violationList = Object.values(violations);

  if (violationList.length === 0) return null;

  return (
    <div className="mb-8 glass-panel rounded-3xl border border-red-500/30 overflow-hidden relative animate-in slide-in-from-top-4 duration-500">
      {/* Background Pulse */}
      <div className="absolute inset-0 bg-red-500/5 animate-pulse-slow pointer-events-none" />
      
      <div className="p-4 border-b border-red-500/20 flex items-center justify-between bg-red-500/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-red-500 rounded-lg shadow-lg shadow-red-500/20 animate-bounce">
             <AlertOctagon className="w-5 h-5 text-white" />
           </div>
           <div>
             <h3 className="font-display font-bold text-white text-lg tracking-tight">Exam Mode Violations</h3>
             <p className="text-red-300 text-xs font-mono">Active Monitoring Protocol • {violationList.length} Students Flagged</p>
           </div>
        </div>
        {onClear && (
            <button onClick={onClear} className="p-2 hover:bg-white/10 rounded-full text-red-300 hover:text-white transition-colors">
                <X className="w-4 h-4" />
            </button>
        )}
      </div>

      <div className="max-h-60 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left">
           <thead className="bg-red-500/5 text-[10px] uppercase tracking-widest text-red-300 sticky top-0 backdrop-blur-sm">
              <tr>
                 <th className="p-4 font-bold">Student / System</th>
                 <th className="p-4 font-bold text-center">Violation Count</th>
                 <th className="p-4 font-bold">Last Detected App</th>
                 <th className="p-4 font-bold text-right">Time</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-red-500/10">
              {violationList.map((v) => (
                 <tr key={v.deviceId} className="hover:bg-red-500/10 transition-colors">
                    <td className="p-4">
                       <div className="font-bold text-white">{v.studentName}</div>
                       <div className="text-xs text-red-400/70 font-mono">{v.labId} • {v.deviceId}</div>
                    </td>
                    <td className="p-4 text-center">
                       <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white font-bold shadow-lg shadow-red-500/20">
                          {v.count}
                       </span>
                    </td>
                    <td className="p-4">
                       <div className="flex items-center gap-2 text-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          {v.lastApp}
                       </div>
                    </td>
                    <td className="p-4 text-right font-mono text-xs text-red-300/70">
                       {v.time}
                    </td>
                 </tr>
              ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};
