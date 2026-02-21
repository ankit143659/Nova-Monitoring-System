import React, { useEffect, useState } from 'react';
import { database } from '../services/firebase';
import { ref, onValue } from 'firebase/database';
import { DeviceListEntry, ActiveSession } from '../types';
import { Monitor, Circle, Shield, Clock } from 'lucide-react';

interface DeviceCardProps {
  deviceId: string;
  entry: DeviceListEntry;
  onClick: () => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ deviceId, entry, onClick }) => {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Listen for real-time active session updates for this card
    const activeRef = ref(database, `devices/${deviceId}/active`);
    const unsubscribe = onValue(activeRef, (snapshot) => {
      setActiveSession(snapshot.val());
    });

    // Update local time every 5 seconds to check for offline timeouts
    const interval = setInterval(() => setNow(Date.now()), 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [deviceId]);

  // Logic: Device is online ONLY if DB says online AND last_seen is less than 60 seconds ago
  const isOnline = entry.status === 'online' && (now - new Date(entry.last_seen).getTime() < 60000);

  return (
    <button
      onClick={onClick}
      className={`relative group flex flex-col items-start text-left p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
        isOnline 
          ? 'bg-surface border-surfaceLight hover:border-primary/50 shadow-lg hover:shadow-primary/10' 
          : 'bg-surface/50 border-surfaceLight/50 opacity-70 grayscale hover:grayscale-0'
      }`}
    >
      <div className="flex justify-between items-start w-full mb-4">
        <div className={`p-3 rounded-xl ${isOnline ? 'bg-primary/10 text-primary' : 'bg-slate-700/30 text-slate-500'}`}>
          <Monitor className="w-8 h-8" />
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full border ${
          isOnline 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
        }`}>
          <Circle className="w-2 h-2 fill-current" />
          <span className="uppercase">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-100 mb-1 truncate w-full">{entry.device_name}</h3>
      <p className="text-xs text-slate-400 font-mono mb-6 flex items-center gap-2">
        <span>{entry.hostname}</span>
        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
        <Clock className="w-3 h-3" />
        <span>{new Date(entry.last_seen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      </p>

      <div className="w-full mt-auto pt-4 border-t border-surfaceLight/50">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Current Activity</p>
        {isOnline && activeSession ? (
           <div className="flex items-start gap-2 text-sm text-slate-300">
             <Shield className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
             <div className="flex flex-col overflow-hidden">
                <span className="font-medium truncate leading-tight">{activeSession.process}</span>
                <span className="text-xs text-slate-500 truncate mt-0.5">{activeSession.window}</span>
             </div>
           </div>
        ) : (
           <div className="text-xs text-slate-600 italic">
             {isOnline ? 'Waiting for activity...' : 'Device offline'}
           </div>
        )}
      </div>
      
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </button>
  );
};