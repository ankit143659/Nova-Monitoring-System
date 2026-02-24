import React, { useEffect, useState } from 'react';
import { database } from './services/firebase';
import { ref, onValue } from 'firebase/database';
import { DeviceListEntry } from './types';
import { DeviceDetail } from './components/DeviceDetail';
import { DeviceCard } from './components/DeviceCard';
import { GlobalControlPanel } from './components/GlobalControlPanel';
import { LayoutDashboard, Server } from 'lucide-react';

function App() {
  const [devices, setDevices] = useState<Record<string, DeviceListEntry>>({});
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExamMode, setIsExamMode] = useState(false);

  useEffect(() => {
    const devicesRef = ref(database, 'devices_list');
    
    // Using onValue for real-time updates of the device list
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDevices(data);
      } else {
        setDevices({});
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-slate-400 animate-pulse">
        <div className="flex flex-col items-center gap-4">
           <LayoutDashboard className="w-12 h-12 text-primary" />
           <p className="tracking-widest font-mono uppercase text-sm">Initializing Nova Monitor...</p>
        </div>
      </div>
    );
  }

  // View: Device Detail
  if (selectedDeviceId) {
    return (
      <div className="h-screen bg-background text-slate-200 overflow-hidden font-sans">
        <main className="h-full relative bg-background/50">
           {/* Background Grid Pattern */}
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ 
                 backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
                 backgroundSize: '40px 40px' 
               }} 
           />
           <DeviceDetail 
             deviceId={selectedDeviceId} 
             onBack={() => setSelectedDeviceId(null)}
           />
        </main>
      </div>
    );
  }

  // View: Dashboard (Device Grid)
  const sortedDevices = Object.entries(devices).sort(([, a], [, b]) => {
     // Online first, then last seen
     if (a.status === 'online' && b.status !== 'online') return -1;
     if (a.status !== 'online' && b.status === 'online') return 1;
     return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime();
  });

  return (
    <div className="min-h-screen bg-background text-slate-200 font-sans p-6 md:p-10 relative">
       {/* Background Grid Pattern */}
       <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }} 
       />

       <div className="max-w-7xl mx-auto relative z-10">
          <header className="mb-10 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Server className="w-8 h-8 text-primary" />
                NOVA MONITOR
              </h1>
              <p className="text-slate-400 mt-2">Centralized Laboratory Monitoring System</p>
            </div>
            <div className="bg-surfaceLight/30 px-4 py-2 rounded-full border border-surfaceLight text-xs font-mono text-slate-400">
               Total Devices: <span className="text-white font-bold">{sortedDevices.length}</span>
            </div>
          </header>

          {sortedDevices.length > 0 && (
             <GlobalControlPanel 
                devices={devices} 
                isExamMode={isExamMode}
                onToggleExamMode={setIsExamMode}
             />
          )}

          {sortedDevices.length === 0 ? (
             <div className="text-center py-20 bg-surface/30 rounded-3xl border border-surfaceLight border-dashed">
                <p className="text-slate-500">No devices connected.</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedDevices.map(([id, entry]) => (
                   <DeviceCard 
                     key={id} 
                     deviceId={id} 
                     entry={entry} 
                     onClick={() => setSelectedDeviceId(id)} 
                     isExamMode={isExamMode}
                   />
                ))}
             </div>
          )}
       </div>
    </div>
  );
}

export default App;