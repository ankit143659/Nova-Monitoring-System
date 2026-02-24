import React, { useState } from 'react';
import { database } from '../services/firebase';
import { ref, set } from 'firebase/database';
import { DeviceListEntry, CommandAction } from '../types';
import { Power, RotateCw, Lock, AlertTriangle, X, Check, ShieldAlert } from 'lucide-react';

interface GlobalControlPanelProps {
  devices: Record<string, DeviceListEntry>;
  isExamMode: boolean;
  onToggleExamMode: (enabled: boolean) => void;
}

export const GlobalControlPanel: React.FC<GlobalControlPanelProps> = ({ devices, isExamMode, onToggleExamMode }) => {
  const [confirmAction, setConfirmAction] = useState<{ action: CommandAction; label: string } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Filter online devices
  const onlineDevices = Object.entries(devices).filter(([, entry]) => {
     const isRecent = new Date(entry.last_seen).getTime() > Date.now() - 120000;
     return entry.status === 'online' && isRecent;
  });

  const handleGlobalCommand = async () => {
    if (!confirmAction) return;
    
    setIsExecuting(true);
    const { action } = confirmAction;

    try {
      const promises = onlineDevices.map(([deviceId]) => {
        const commandId = crypto.randomUUID();
        const commandRef = ref(database, `devices/${deviceId}/commands/${commandId}`);
        
        const commandData = {
          action,
          data: {},
          status: 'PENDING',
          timestamp: new Date().toISOString(),
          targetDevice: deviceId
        };

        return set(commandRef, commandData);
      });

      await Promise.all(promises);
      setConfirmAction(null);
    } catch (error) {
      console.error("Failed to execute global command:", error);
      alert("Failed to execute command on some devices.");
    } finally {
      setIsExecuting(false);
    }
  };

  if (onlineDevices.length === 0) {
      return null;
  }

  return (
    <div className="mb-8 bg-surface/50 border border-surfaceLight rounded-2xl p-6 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Global Controls
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                    Execute actions on <span className="text-white font-bold">{onlineDevices.length}</span> online devices simultaneously.
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <button 
                    onClick={() => onToggleExamMode(!isExamMode)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all active:scale-95 ${
                        isExamMode 
                        ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/20 animate-pulse' 
                        : 'bg-surfaceLight/30 hover:bg-surfaceLight border-surfaceLight text-slate-200'
                    }`}
                >
                    <ShieldAlert className="w-4 h-4" /> 
                    {isExamMode ? 'Exam Mode ACTIVE' : 'Enable Exam Mode'}
                </button>

                <div className="w-px h-8 bg-surfaceLight mx-2 hidden md:block" />

                <button 
                    onClick={() => setConfirmAction({ action: 'lock', label: 'Lock All Devices' })}
                    className="flex items-center gap-2 px-4 py-2 bg-surfaceLight/30 hover:bg-surfaceLight border border-surfaceLight rounded-lg text-slate-200 transition-all active:scale-95"
                >
                    <Lock className="w-4 h-4" /> Lock All
                </button>
                <button 
                    onClick={() => setConfirmAction({ action: 'restart', label: 'Restart All Devices' })}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 rounded-lg transition-all active:scale-95"
                >
                    <RotateCw className="w-4 h-4" /> Restart All
                </button>
                <button 
                    onClick={() => setConfirmAction({ action: 'shutdown', label: 'Shutdown All Devices' })}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-lg transition-all active:scale-95"
                >
                    <Power className="w-4 h-4" /> Shutdown All
                </button>
            </div>
        </div>

        {/* Confirmation Modal */}
        {confirmAction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-surface border border-surfaceLight p-6 rounded-2xl w-full max-w-md shadow-2xl transform transition-all scale-100">
                    <div className="flex items-center gap-4 mb-4 text-amber-500">
                        <div className="p-3 bg-amber-500/10 rounded-full">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white">Confirm Global Action</h4>
                            <p className="text-xs text-amber-500 uppercase font-bold tracking-wider">Warning: Irreversible</p>
                        </div>
                    </div>
                    
                    <p className="text-slate-300 mb-6">
                        Are you sure you want to <strong>{confirmAction.label}</strong>? 
                        <br/>
                        This command will be sent to <strong>{onlineDevices.length}</strong> online devices immediately.
                    </p>

                    <div className="flex gap-3 justify-end">
                        <button 
                            onClick={() => setConfirmAction(null)}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                            disabled={isExecuting}
                        >
                            <X className="w-4 h-4" /> Cancel
                        </button>
                        <button 
                            onClick={handleGlobalCommand}
                            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20"
                            disabled={isExecuting}
                        >
                            {isExecuting ? (
                                <RotateCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            {isExecuting ? 'Executing...' : 'Yes, Execute'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
