import React, { useState, useEffect } from 'react';
import { DeviceListEntry, ActiveSession } from '../types';
import { Monitor, Shield, Clock, AlertOctagon } from 'lucide-react';

interface DeviceCardProps {
  labId: string;
  deviceId: string;
  entry: DeviceListEntry;
  activeSession?: ActiveSession; // Received from parent
  onClick: () => void;
  isExamMode: boolean;
  violationCount: number;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ 
  labId,
  deviceId, 
  entry, 
  activeSession, 
  onClick, 
  isExamMode, 
  violationCount 
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Update local time every 5 seconds to check for offline timeouts
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  // Logic: Device is online ONLY if DB says online AND last_seen is less than 60 seconds ago
  // We now rely on the parent component (App.tsx) to pass the correct 'entry.status' which is already calculated based on time
  const isOnline = entry.status === 'online';

  // Check for restricted browser activity if Exam Mode is active
  const isRestricted = isExamMode && isOnline && activeSession && (
    ['chrome', 'firefox', 'msedge', 'safari', 'brave', 'opera', 'discord', 'whatsapp', 'telegram'].some(app => 
      activeSession.process.toLowerCase().includes(app)
    )
  );

  return (
    <button
      onClick={onClick}
      className={`relative group flex flex-col items-start text-left p-6 rounded-3xl border transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] overflow-hidden ${
        isRestricted
          ? 'bg-red-950/30 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
          : isOnline 
            ? 'glass glass-hover shadow-xl shadow-black/20' 
            : 'bg-surfaceLight/10 border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
      }`}
    >
      {/* Background Gradient for Online State */}
      {isOnline && !isRestricted && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
      
      {/* Violation Background Animation */}
      {isRestricted && (
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(239,68,68,0.05)_10px,rgba(239,68,68,0.05)_20px)] animate-pulse-slow pointer-events-none" />
      )}

      <div className="flex justify-between items-start w-full mb-5 relative z-10">
        <div className={`p-3.5 rounded-2xl backdrop-blur-md border transition-colors duration-300 ${
            isRestricted ? 'bg-red-500/20 border-red-500/30 text-red-400' :
            isOnline ? 'bg-primary/10 border-primary/20 text-primary group-hover:bg-primary/20 group-hover:text-white group-hover:border-primary/40' : 'bg-slate-800/50 border-white/5 text-slate-500'
        }`}>
          <Monitor className="w-7 h-7" />
        </div>
        
        <div className="flex flex-col items-end gap-2">
            <div className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-full border backdrop-blur-md shadow-sm ${
            isRestricted 
                ? 'bg-red-500 text-white border-red-400 shadow-red-500/20'
                : isOnline 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
            }`}>
              <div className="relative flex h-2 w-2">
                {(isOnline || isRestricted) && (
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRestricted ? 'bg-white' : 'bg-emerald-400'}`}></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isRestricted ? 'bg-white' : isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
              </div>
              <span className="uppercase tracking-wider">{isRestricted ? 'VIOLATION' : isOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            {isExamMode && violationCount > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-white bg-red-500 px-2.5 py-1 rounded-full shadow-lg shadow-red-500/20 animate-bounce">
                    <AlertOctagon className="w-3 h-3 fill-white/20" />
                    <span>{violationCount}</span>
                </div>
            )}
        </div>
      </div>

      <div className="relative z-10 w-full">
        <h3 className="text-xl font-display font-bold text-white mb-1 truncate w-full tracking-tight group-hover:text-primary-200 transition-colors">
          {entry.device_name}
        </h3>
        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mb-6">
          <span className="bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/20">{labId}</span>
          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{entry.hostname || deviceId}</span>
          <div className="flex items-center gap-1.5 opacity-60">
            <Clock className="w-3 h-3" />
            <span>{new Date(entry.last_seen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </div>

        <div className="w-full mt-auto pt-4 border-t border-white/5 group-hover:border-white/10 transition-colors">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2.5 flex items-center gap-2">
            Current Activity
            {isOnline && <span className="w-1 h-1 rounded-full bg-primary/50 animate-pulse" />}
          </p>
          {isOnline && activeSession ? (
             <div className="flex items-start gap-3 text-sm text-slate-300 bg-surface/30 p-2.5 rounded-xl border border-white/5 group-hover:bg-surface/50 transition-colors">
               <div className="p-1.5 bg-accent/10 rounded-lg text-accent">
                 <Shield className="w-4 h-4" />
               </div>
               <div className="flex flex-col overflow-hidden">
                  <span className="font-medium truncate leading-tight text-slate-200">{activeSession.process}</span>
                  <span className="text-[11px] text-slate-500 truncate mt-0.5 font-mono opacity-80">{activeSession.window}</span>
               </div>
             </div>
          ) : (
             <div className="text-xs text-slate-600 italic py-2 pl-1">
               {isOnline ? 'Waiting for activity...' : 'Device offline'}
             </div>
          )}
        </div>
      </div>
    </button>
  );
};