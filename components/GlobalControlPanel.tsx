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
      const promises = onlineDevices.map(([id, device]) => {
        const { labId, deviceId } = device;
        const commandId = crypto.randomUUID();
        const commandRef = ref(database, `Labs/${labId}/${deviceId}/commands/${commandId}`);
        
        const formattedLabId = labId.toLowerCase();
        const formattedDeviceId = deviceId.toLowerCase().replace(/^pc_/, 'sys');
        
        const commandData = {
          action,
          data: {},
          status: 'PENDING',
          timestamp: new Date().toISOString(),
          targetDevice: `${formattedLabId}_${formattedDeviceId}`
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
    <>
      <div className="mb-10 glass-panel rounded-3xl p-8 relative overflow-hidden group">
          {/* Background Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-primary/15 transition-colors duration-700" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8 relative z-10">
            <div className="flex items-start gap-5">
                <div className="p-4 bg-gradient-to-br from-amber-500/20 to-amber-600/5 rounded-2xl border border-amber-500/20 shadow-lg shadow-amber-900/10">
                   <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                    <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3 tracking-tight">
                        Global Command Center
                    </h3>
                    <p className="text-slate-400 text-sm mt-1.5 font-light leading-relaxed max-w-md">
                        Execute synchronized actions across <span className="text-white font-bold">{onlineDevices.length} active devices</span>. 
                        <span className="block text-xs text-slate-500 mt-1">Authorized personnel only. All actions are logged.</span>
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                <button 
                    onClick={() => onToggleExamMode(!isExamMode)}
                    className={`flex items-center gap-3 px-6 py-3.5 rounded-xl transition-all duration-300 active:scale-95 font-medium border shadow-lg ${
                        isExamMode 
                        ? 'bg-gradient-to-r from-red-600 to-red-500 text-white border-red-400 shadow-red-500/30 animate-pulse-slow' 
                        : 'bg-surfaceLight/30 hover:bg-surfaceLight/50 border-white/10 text-slate-200 hover:text-white hover:border-white/20'
                    }`}
                >
                    <ShieldAlert className={`w-5 h-5 ${isExamMode ? 'animate-bounce' : ''}`} /> 
                    <div className="flex flex-col items-start leading-none gap-1">
                        <span className="text-xs uppercase tracking-wider opacity-80">Security Protocol</span>
                        <span>{isExamMode ? 'Exam Mode ACTIVE' : 'Enable Exam Mode'}</span>
                    </div>
                </button>

                <div className="w-px h-12 bg-white/10 mx-2 hidden xl:block" />

                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={() => setConfirmAction({ action: 'lock', label: 'Lock All Devices' })}
                        className="flex items-center gap-2 px-5 py-3 bg-surfaceLight/20 hover:bg-surfaceLight/40 border border-white/5 hover:border-white/10 text-slate-200 rounded-xl transition-all active:scale-95 backdrop-blur-sm"
                    >
                        <Lock className="w-4 h-4" /> Lock All
                    </button>
                    <button 
                        onClick={() => setConfirmAction({ action: 'restart', label: 'Restart All Devices' })}
                        className="flex items-center gap-2 px-5 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-500 rounded-xl transition-all active:scale-95 backdrop-blur-sm"
                    >
                        <RotateCw className="w-4 h-4" /> Restart
                    </button>
                    <button 
                        onClick={() => setConfirmAction({ action: 'shutdown', label: 'Shutdown All Devices' })}
                        className="flex items-center gap-2 px-5 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-500 rounded-xl transition-all active:scale-95 backdrop-blur-sm"
                    >
                        <Power className="w-4 h-4" /> Shutdown
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                <div className="bg-surface border border-white/10 p-8 rounded-3xl w-full max-w-lg shadow-2xl transform transition-all scale-100 relative overflow-hidden">
                    {/* Modal Background Effects */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex items-start gap-5 mb-6">
                        <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500 shadow-lg shadow-amber-500/5">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-display font-bold text-white tracking-tight">Confirm Mass Action</h4>
                            <p className="text-xs text-amber-500 uppercase font-bold tracking-widest mt-1.5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Warning: Irreversible Operation
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-surfaceLight/30 rounded-xl p-5 mb-8 border border-white/5">
                        <p className="text-slate-300 leading-relaxed">
                            Are you sure you want to <strong className="text-white">{confirmAction.label}</strong>? 
                            <br/>
                            This command will be broadcast to <strong className="text-white">{onlineDevices.length} active devices</strong> immediately.
                        </p>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button 
                            onClick={() => setConfirmAction(null)}
                            className="px-6 py-3 text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-medium hover:bg-white/5 rounded-lg"
                            disabled={isExecuting}
                        >
                            <X className="w-4 h-4" /> Cancel
                        </button>
                        <button 
                            onClick={handleGlobalCommand}
                            className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-500/25 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={isExecuting}
                        >
                            {isExecuting ? (
                                <RotateCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            {isExecuting ? 'Broadcasting...' : 'Confirm Execution'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};
