import React, { useState, useEffect } from 'react';
import { DeviceListEntry } from '../types';
import { Monitor, Circle, Clock } from 'lucide-react';

interface DeviceListProps {
  devices: Record<string, DeviceListEntry>;
  selectedDeviceId: string | null;
  onSelectDevice: (id: string) => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({ devices, selectedDeviceId, onSelectDevice }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  const sortedDeviceIds = Object.keys(devices).sort((a, b) => {
    // Determine online status based on time
    const isOnlineA = devices[a].status === 'online' && (now - new Date(devices[a].last_seen).getTime() < 60000);
    const isOnlineB = devices[b].status === 'online' && (now - new Date(devices[b].last_seen).getTime() < 60000);

    // Online devices first
    if (isOnlineA && !isOnlineB) return -1;
    if (!isOnlineA && isOnlineB) return 1;
    return 0;
  });

  return (
    <div className="flex flex-col h-full bg-surface border-r border-surfaceLight">
      <div className="p-6 border-b border-surfaceLight">
        <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
          <Monitor className="w-6 h-6" />
          <span>NEXUS</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Device Management</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sortedDeviceIds.length === 0 && (
          <div className="text-center text-slate-500 py-10">
            No devices found.
          </div>
        )}
        
        {sortedDeviceIds.map((deviceId) => {
          const device = devices[deviceId];
          const isSelected = selectedDeviceId === deviceId;
          const isOnline = device.status === 'online' && (now - new Date(device.last_seen).getTime() < 60000);
          
          return (
            <button
              key={deviceId}
              onClick={() => onSelectDevice(deviceId)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 border ${
                isSelected 
                  ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' 
                  : 'bg-surfaceLight/30 border-transparent hover:bg-surfaceLight/50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`font-semibold truncate ${isSelected ? 'text-primary' : 'text-slate-200'}`}>
                  {device.device_name}
                </span>
                <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                  isOnline ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                }`}>
                  <Circle className="w-2 h-2 fill-current" />
                  <span className="uppercase font-bold">{isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Monitor className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{device.hostname}</span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <Clock className="w-3 h-3" />
                <span>Last seen: {new Date(device.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-surfaceLight text-center text-xs text-slate-500">
        Nexus System v1.0
      </div>
    </div>
  );
};