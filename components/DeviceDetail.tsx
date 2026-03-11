import React, { useEffect, useState, useRef } from 'react';
import { database } from '../services/firebase';
import { ref, onValue, set } from 'firebase/database';
import { DeviceInfo, ActiveSession, CommandAction, ActivityLogEntry, CommandLogEntry } from '../types';
import { Monitor, Activity, Terminal, Shield, Wifi, WifiOff, ArrowLeft } from 'lucide-react';
import { ActivityHistory } from './ActivityHistory';
import { CommandCenter } from './CommandCenter';

interface DeviceDetailProps {
  labId: string;
  deviceId: string;
  onBack: () => void;
}

export const DeviceDetail: React.FC<DeviceDetailProps> = ({ labId, deviceId, onBack }) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [activities, setActivities] = useState<Record<string, Record<string, ActivityLogEntry>> | null>(null);
  const [lastCommand, setLastCommand] = useState<CommandLogEntry | null>(null);
  const [now, setNow] = useState(Date.now());
  
  const lastSeenStrRef = useRef<string | null>(null);
  const localUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    const unsubscribeInfo = onValue(ref(database, `Labs/${labId}/${deviceId}/info`), (snapshot) => {
      const info = snapshot.val();
      if (info && info.last_seen !== lastSeenStrRef.current) {
          lastSeenStrRef.current = info.last_seen;
          localUpdateRef.current = Date.now();
      }
      setDeviceInfo(info);
    });

    const unsubscribeActive = onValue(ref(database, `Labs/${labId}/${deviceId}/active`), (snapshot) => {
      setActiveSession(snapshot.val());
    });

    const unsubscribeActivities = onValue(ref(database, `Labs/${labId}/${deviceId}/activities`), (snapshot) => {
      setActivities(snapshot.val());
    });

    // Listen to the last response to show feedback
    const unsubscribeResponses = onValue(ref(database, `Labs/${labId}/${deviceId}/responses`), (snapshot) => {
        const responses = snapshot.val();
        if (responses) {
            const keys = Object.keys(responses);
            const lastKey = keys[keys.length - 1];
            setLastCommand(responses[lastKey]);
        }
    });

    // Update local time every 5 seconds to check for offline timeouts
    const interval = setInterval(() => setNow(Date.now()), 5000);

    return () => {
      unsubscribeInfo();
      unsubscribeActive();
      unsubscribeActivities();
      unsubscribeResponses();
      clearInterval(interval);
    };
  }, [labId, deviceId]);

  const handleSendCommand = (action: CommandAction, data: any) => {
    const commandId = crypto.randomUUID();
    const commandRef = ref(database, `Labs/${labId}/${deviceId}/commands/${commandId}`);
    
    const formattedLabId = labId.toLowerCase();
    const formattedDeviceId = deviceId.toLowerCase().replace(/^pc_/, 'sys');
    
    const commandData = {
      action,
      data,
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      targetDevice: `${formattedLabId}_${formattedDeviceId}`
    };

    set(commandRef, commandData).catch(err => console.error(err));
  };

  if (!deviceInfo) return <div className="p-8 text-center text-slate-500">Loading device details...</div>;

  // Logic: Device is online ONLY if DB says online AND local update was within 60 seconds (bypasses timezone issues)
  const isOnline = deviceInfo.status === 'online' && (now - localUpdateRef.current < 60000);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Navbar */}
      <div className="glass border-b border-white/5 p-4 flex items-center gap-4 flex-shrink-0 z-20 shadow-md">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-display font-bold text-white text-lg leading-tight tracking-tight">{deviceInfo.device_name}</h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
               <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
               {isOnline ? 'ONLINE & CONNECTED' : 'OFFLINE'}
            </div>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Top Section: Stats & Log */}
        <div className="space-y-6">
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Device Info Card */}
                <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group">
                   <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500 rotate-12">
                      <Monitor className="w-40 h-40" />
                   </div>
                   <div className="flex items-start justify-between mb-6 relative z-10">
                      <div>
                          <div className="text-xs text-primary font-bold uppercase tracking-widest mb-1">System Identity</div>
                          <div className="text-2xl font-display font-bold text-white tracking-tight">{deviceInfo.hostname}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border backdrop-blur-sm ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                          {isOnline ? 'Active' : 'Inactive'}
                      </span>
                   </div>
                   <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 relative z-10">
                       <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold tracking-wider">IP Address</span> 
                          <span className="font-mono text-slate-200">{deviceInfo.ip_address || 'N/A'}</span>
                       </div>
                       <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold tracking-wider">Current User</span> 
                          <span className="font-mono text-slate-200">{deviceInfo.username || 'N/A'}</span>
                       </div>
                   </div>
                </div>

                {/* Activity Card */}
                <div className="glass-panel rounded-3xl p-6 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-[50px] pointer-events-none" />
                    
                    <div className="flex items-center gap-2 mb-4 text-xs text-accent font-bold uppercase tracking-widest relative z-10">
                        <Activity className="w-4 h-4" /> Live Task Monitor
                    </div>
                    {activeSession && isOnline ? (
                        <div className="mt-1 relative z-10">
                            <div className="text-lg font-bold text-white flex items-center gap-3 truncate">
                                <div className="p-2 bg-accent/10 rounded-lg text-accent">
                                  <Shield className="w-5 h-5" />
                                </div>
                                {activeSession.process}
                            </div>
                            <div className="text-xs text-slate-400 mt-3 truncate bg-black/20 p-3 rounded-xl border border-white/5 font-mono">
                                {activeSession.window}
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500 italic py-4 flex items-center gap-2 relative z-10">
                           <div className="w-2 h-2 rounded-full bg-slate-600" />
                           {isOnline ? 'No active task detected' : 'Monitoring paused (Device Offline)'}
                        </div>
                    )}
                </div>
            </div>

            {/* Compact Status Log */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 shadow-inner backdrop-blur-sm">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Terminal className="w-3 h-3" /> System Console Log
                </h3>
                <div className="font-mono text-xs space-y-2 max-h-[100px] overflow-y-auto pr-2">
                    {lastCommand && (
                        <div className={`flex items-start gap-3 p-2 rounded-lg ${lastCommand.status === 'COMPLETED' ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' : 'bg-slate-800/50 text-slate-300 border border-white/5'}`}>
                            <span className="text-slate-500 shrink-0 opacity-70">[{new Date(lastCommand.timestamp || new Date().toISOString()).toLocaleTimeString([], {hour12: false})}]</span>
                            <span className="font-bold">{(lastCommand.action || 'UNKNOWN').toUpperCase()}</span>
                            <span className="opacity-70">status: {lastCommand.status}</span>
                        </div>
                    )}
                    <div className="text-slate-500 flex items-start gap-2 px-2">
                        <span className="text-primary">&gt;</span> <span>System monitoring active... awaiting commands.</span>
                    </div>
                    {!isOnline && (
                         <div className="text-red-400/80 flex items-start gap-2 px-2">
                            <span>!</span> <span>Connection lost with host. Retrying...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Bottom Section: Command & History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
          <CommandCenter onSendCommand={handleSendCommand} isOnline={isOnline || false} />
          <ActivityHistory activities={activities} />
        </div>
      </div>
    </div>
  );
};