import React, { useEffect, useState } from 'react';
import { database } from '../services/firebase';
import { ref, onValue, set } from 'firebase/database';
import { DeviceInfo, ActiveSession, CommandAction, ActivityLogEntry, CommandLogEntry } from '../types';
import { Monitor, Activity, Terminal, Shield, Wifi, WifiOff, ArrowLeft } from 'lucide-react';
import { ActivityHistory } from './ActivityHistory';
import { CommandCenter } from './CommandCenter';

interface DeviceDetailProps {
  deviceId: string;
  onBack: () => void;
}

export const DeviceDetail: React.FC<DeviceDetailProps> = ({ deviceId, onBack }) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [activities, setActivities] = useState<Record<string, Record<string, ActivityLogEntry>> | null>(null);
  const [lastCommand, setLastCommand] = useState<CommandLogEntry | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const deviceRef = ref(database, `devices/${deviceId}`);
    
    const unsubscribeInfo = onValue(ref(database, `devices/${deviceId}/info`), (snapshot) => {
      setDeviceInfo(snapshot.val());
    });

    const unsubscribeActive = onValue(ref(database, `devices/${deviceId}/active`), (snapshot) => {
      setActiveSession(snapshot.val());
    });

    const unsubscribeActivities = onValue(ref(database, `devices/${deviceId}/activities`), (snapshot) => {
      setActivities(snapshot.val());
    });

    // Listen to the last response to show feedback
    const unsubscribeResponses = onValue(ref(database, `devices/${deviceId}/responses`), (snapshot) => {
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
  }, [deviceId]);

  const handleSendCommand = (action: CommandAction, data: any) => {
    const commandId = crypto.randomUUID();
    const commandRef = ref(database, `devices/${deviceId}/commands/${commandId}`);
    
    const commandData = {
      action,
      data,
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      targetDevice: deviceId
    };

    set(commandRef, commandData).catch(err => console.error(err));
  };

  if (!deviceInfo) return <div className="p-8 text-center text-slate-500">Loading device details...</div>;

  // Logic: Device is online ONLY if DB says online AND last_seen is less than 60 seconds ago
  const isOnline = deviceInfo.status === 'online' && (now - new Date(deviceInfo.last_seen).getTime() < 60000);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Navbar */}
      <div className="bg-surface border-b border-surfaceLight p-3 flex items-center gap-3 flex-shrink-0 z-20 shadow-sm">
          <button 
            onClick={onBack}
            className="p-1.5 hover:bg-surfaceLight rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-slate-100 text-sm leading-tight">{deviceInfo.device_name}</h2>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
               <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
               {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Top Section: Stats & Log */}
        <div className="space-y-3">
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Device Info Card */}
                <div className="bg-surface border border-surfaceLight rounded-xl p-4 relative overflow-hidden group">
                   <div className="absolute right-2 top-2 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Monitor className="w-16 h-16" />
                   </div>
                   <div className="flex items-start justify-between mb-3 relative z-10">
                      <div>
                          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-0.5">Device</div>
                          <div className="text-lg font-bold text-slate-100">{deviceInfo.hostname}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${isOnline ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                          {isOnline ? 'Connected' : 'Disconnected'}
                      </span>
                   </div>
                   <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 relative z-10">
                       <div><span className="text-slate-600 block">IP:</span> {deviceInfo.ip_address || 'N/A'}</div>
                       <div><span className="text-slate-600 block">User:</span> {deviceInfo.username || 'N/A'}</div>
                   </div>
                </div>

                {/* Activity Card */}
                <div className="bg-surface border border-surfaceLight rounded-xl p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
                        <Activity className="w-3 h-3 text-primary" /> Active Task
                    </div>
                    {activeSession && isOnline ? (
                        <div className="mt-1">
                            <div className="text-sm font-bold text-slate-200 flex items-center gap-2 truncate">
                                <Shield className="w-4 h-4 text-accent" />
                                {activeSession.process}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 truncate bg-surfaceLight/20 p-1.5 rounded">
                                {activeSession.window}
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-slate-600 italic py-2">
                           {isOnline ? 'No active task detected' : 'Monitoring paused'}
                        </div>
                    )}
                </div>
            </div>

            {/* Compact Status Log */}
            <div className="bg-background border border-surfaceLight rounded-xl p-3 shadow-inner">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Terminal className="w-3 h-3" /> System Log
                </h3>
                <div className="font-mono text-[11px] space-y-1 max-h-[80px] overflow-y-auto">
                    {lastCommand && (
                        <div className={`flex items-start gap-2 ${lastCommand.status === 'COMPLETED' ? 'text-green-400' : 'text-slate-400'}`}>
                            <span className="text-slate-600 shrink-0">[{new Date(lastCommand.timestamp || new Date().toISOString()).toLocaleTimeString([], {hour12: false})}]</span>
                            <span>{(lastCommand.action || 'UNKNOWN').toUpperCase()}: {lastCommand.status}</span>
                        </div>
                    )}
                    <div className="text-slate-600 flex items-start gap-2">
                        <span>&gt;</span> <span>System monitoring active...</span>
                    </div>
                    {!isOnline && (
                         <div className="text-red-900/50 flex items-start gap-2">
                            <span>!</span> <span>Connection lost with host.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Bottom Section: Command & History */}
        {/* We use h-[500px] or flex-1 to fill space, but min-h ensures visibility */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-[450px]">
          <CommandCenter onSendCommand={handleSendCommand} isOnline={isOnline || false} />
          <ActivityHistory activities={activities} />
        </div>
      </div>
    </div>
  );
};