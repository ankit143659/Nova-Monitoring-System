import React, { useState } from 'react';
import { AlertOctagon, X, ChevronDown, ChevronUp, Clock, AppWindow } from 'lucide-react';

interface ViolationEvent {
  app: string;
  time: string;
}

interface ViolationEntry {
  deviceId: string;
  labId: string;
  studentName: string;
  count: number;
  lastApp: string;
  time: string;
  events: ViolationEvent[];
}

interface ViolationHistoryProps {
  violations: Record<string, ViolationEntry>;
  onClose: () => void;
  onClear: () => void;
}

export const ViolationHistory: React.FC<ViolationHistoryProps> = ({ violations, onClose, onClear }) => {
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
  const violationList = Object.values(violations);

  if (violationList.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-surface border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
            </button>
            <div className="text-center py-8">
                <div className="p-4 bg-emerald-500/10 rounded-full inline-block mb-4">
                    <AlertOctagon className="w-12 h-12 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Violations Recorded</h3>
                <p className="text-slate-400">Great job! No restricted activity has been detected during this session.</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-red-500/30 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] relative overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-red-950/20">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500 rounded-xl shadow-lg shadow-red-500/20">
                    <AlertOctagon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-2xl font-display font-bold text-white tracking-tight">Violation History</h3>
                    <p className="text-red-300 text-sm">Total Violations: <span className="font-bold text-white">{violationList.reduce((acc, v) => acc + v.count, 0)}</span> • Students Flagged: <span className="font-bold text-white">{violationList.length}</span></p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={onClear}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                    Clear History
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {violationList.map((v) => (
                <div key={v.deviceId} className="bg-surfaceLight/10 border border-white/5 rounded-2xl overflow-hidden transition-all hover:border-red-500/30">
                    <button 
                        onClick={() => setExpandedDevice(expandedDevice === v.deviceId ? null : v.deviceId)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold border border-red-500/20">
                                {v.count}
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white">{v.studentName}</h4>
                                <p className="text-xs text-slate-400 font-mono">{v.labId} • {v.deviceId}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-0.5">Last Violation</div>
                                <div className="text-sm text-red-300 flex items-center justify-end gap-2">
                                    {v.lastApp} <span className="text-slate-500">•</span> {v.time}
                                </div>
                            </div>
                            {expandedDevice === v.deviceId ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                        </div>
                    </button>
                    
                    {/* Expanded Details */}
                    {expandedDevice === v.deviceId && (
                        <div className="border-t border-white/5 bg-black/20 p-4 animate-in slide-in-from-top-2 duration-200">
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pl-2">Detailed Timeline</h5>
                            <div className="space-y-2">
                                {v.events.slice().reverse().map((event, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <AppWindow className="w-4 h-4 text-red-400" />
                                            <span className="text-sm text-slate-200 font-medium">{event.app}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                            <Clock className="w-3 h-3" />
                                            {event.time}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
