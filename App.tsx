import React, { useEffect, useState, useRef } from 'react';
import { database } from './services/firebase';
import { ref, onValue } from 'firebase/database';
import { DeviceListEntry } from './types';
import { DeviceDetail } from './components/DeviceDetail';
import { DeviceCard } from './components/DeviceCard';
import { GlobalControlPanel } from './components/GlobalControlPanel';
import { ViolationList } from './components/ViolationList';
import { ViolationHistory } from './components/ViolationHistory';
import { LayoutDashboard, Server, MoreVertical, History, ArrowLeft, Monitor } from 'lucide-react';

// Restricted apps list for Exam Mode
const RESTRICTED_APPS = ['chrome', 'firefox', 'msedge', 'safari', 'brave', 'opera', 'discord', 'whatsapp', 'telegram'];

function App() {
  // Store full device data flattened from Labs
  const [devices, setDevices] = useState<Record<string, any>>({});
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<{labId: string, deviceId: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExamMode, setIsExamMode] = useState(false);
  
  // Violation tracking state
  const [violations, setViolations] = useState<Record<string, { count: number, lastApp: string, time: string, studentName: string, events: { app: string, time: string }[], labId: string, deviceId: string }>>({});
  const lastViolatingAppRef = useRef<Record<string, string | null>>({});
  const [showHistory, setShowHistory] = useState(false);
  
  // Track local updates to bypass timezone issues
  const deviceTimeoutsRef = useRef<Record<string, { lastSeenStr: string, localTimestamp: number }>>({});
  
  // Real-time clock for accurate online status
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Listen to the root 'Labs' node to get full real-time data across all labs
    const labsRef = ref(database, 'Labs');
    
    const unsubscribe = onValue(labsRef, (snapshot) => {
      const data = snapshot.val();
      const flattenedDevices: Record<string, any> = {};
      
      if (data) {
        Object.entries(data).forEach(([labId, labDevices]: [string, any]) => {
          if (labDevices) {
            Object.entries(labDevices).forEach(([deviceId, deviceData]: [string, any]) => {
              const uniqueId = `${labId}|${deviceId}`;
              const currentLastSeen = deviceData?.info?.last_seen;
              
              const tracker = deviceTimeoutsRef.current[uniqueId];
              if (!tracker || tracker.lastSeenStr !== currentLastSeen) {
                  deviceTimeoutsRef.current[uniqueId] = {
                      lastSeenStr: currentLastSeen,
                      localTimestamp: Date.now()
                  };
              }

              flattenedDevices[uniqueId] = {
                ...deviceData,
                labId,
                deviceId,
                _localLastUpdate: deviceTimeoutsRef.current[uniqueId].localTimestamp
              };
            });
          }
        });
      }
      setDevices(flattenedDevices);
      setLoading(false);
    });

    // Update local time every 5 seconds to keep "Online" status and counts accurate
    const interval = setInterval(() => setNow(Date.now()), 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Violation Detection Logic
  useEffect(() => {
    if (!isExamMode) {
      // Do NOT clear violations here. Persist them until manually cleared.
      lastViolatingAppRef.current = {};
      return;
    }

    Object.entries(devices).forEach(([id, device]: [string, any]) => {
      if (!device?.info || !device?.active) return;

      const { info, active, labId, deviceId, _localLastUpdate } = device;
      const isOnline = info.status === 'online' && (now - _localLastUpdate < 60000);

      if (isOnline && active.process) {
        const processName = active.process.toLowerCase();
        const isRestricted = RESTRICTED_APPS.some(app => processName.includes(app));
        const lastApp = lastViolatingAppRef.current[id];

        if (isRestricted) {
          // Only increment count if the app changed (e.g., switched from Chrome to Edge) 
          // or if it's a new violation session (was not violating before)
          if (processName !== lastApp) {
            setViolations(prev => {
              const current = prev[id] || { 
                  count: 0, 
                  lastApp: '', 
                  time: '', 
                  studentName: info.username || info.hostname,
                  events: [],
                  labId,
                  deviceId
              };
              
              const newEvent = { app: active.process, time: new Date().toLocaleTimeString() };
              
              return {
                ...prev,
                [id]: {
                  ...current,
                  count: current.count + 1,
                  lastApp: active.process,
                  time: newEvent.time,
                  studentName: info.username || info.hostname,
                  deviceId: id, // Ensure ID is available for the list component
                  labId,
                  events: [...current.events, newEvent]
                }
              };
            });
            lastViolatingAppRef.current[id] = processName;
          }
        } else {
          // Reset last violating app if currently safe, so re-opening counts as new violation
          if (lastApp) {
            lastViolatingAppRef.current[id] = null;
          }
        }
      } else {
        // If offline, reset tracking for this device
        if (lastViolatingAppRef.current[id]) {
            lastViolatingAppRef.current[id] = null;
        }
      }
    });
  }, [devices, isExamMode, now]); // Add 'now' dependency

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-slate-400 relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        <div className="flex flex-col items-center gap-6 relative z-10 animate-pulse-slow">
           <div className="relative">
             <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
             <LayoutDashboard className="w-16 h-16 text-primary relative z-10" />
           </div>
           <p className="tracking-[0.2em] font-display uppercase text-sm text-primary/80">Initializing Nova Monitor...</p>
        </div>
      </div>
    );
  }

  // View: Device Detail
  if (selectedDevice) {
    return (
      <div className="h-screen bg-background text-slate-200 overflow-hidden font-sans relative selection:bg-primary/30 selection:text-primary-100">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        <main className="h-full relative z-10 backdrop-blur-[1px]">
           <DeviceDetail 
             labId={selectedDevice.labId}
             deviceId={selectedDevice.deviceId} 
             onBack={() => setSelectedDevice(null)}
           />
        </main>
      </div>
    );
  }

  // Transform raw device data to list entries for sorting and display
  const deviceEntries: [string, DeviceListEntry][] = Object.entries(devices).map(([id, data]: [string, any]) => {
      // Ensure we have info, fallback if missing
      const info = data.info || { 
          device_name: 'Unknown Device', 
          hostname: data.deviceId, 
          status: 'offline', 
          last_seen: new Date().toISOString() 
      };
      
      // Calculate real-time status using local update tracker
      const isOnline = info.status === 'online' && (now - data._localLastUpdate < 60000);
      
      return [id, { ...info, status: isOnline ? 'online' : 'offline', labId: data.labId, deviceId: data.deviceId }];
  });

  // Sort devices
  const sortedDevices = deviceEntries.sort(([, a], [, b]) => {
     // Online first, then last seen
     if (a.status === 'online' && b.status !== 'online') return -1;
     if (a.status !== 'online' && b.status === 'online') return 1;
     return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime();
  });

  // Filter devices if lab is selected
  const displayedDevices = selectedLabId 
    ? sortedDevices.filter(([, d]) => d.labId === selectedLabId)
    : sortedDevices;

  // Calculate counts
  const totalDevices = displayedDevices.length;
  const onlineDevices = displayedDevices.filter(([, d]) => d.status === 'online').length;
  
  const labIds = Array.from(new Set(sortedDevices.map(([, d]) => d.labId))).sort();

  return (
    <div className="min-h-screen bg-background text-slate-200 font-sans p-6 md:p-10 relative selection:bg-primary/30 selection:text-primary-100">
       {/* Background Effects */}
       <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
       <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
       </div>

       {/* Violation History Modal */}
       {showHistory && (
          <ViolationHistory 
             violations={violations} 
             onClose={() => setShowHistory(false)} 
             onClear={() => setViolations({})}
          />
       )}

       <div className="max-w-7xl mx-auto relative z-10">
          <header className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-4">
                {selectedLabId && (
                  <button 
                    onClick={() => setSelectedLabId(null)}
                    className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                )}
                <h1 className="text-4xl md:text-5xl font-bold text-white flex items-center gap-4 font-display tracking-tight">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
                    <Server className="w-10 h-10 text-primary relative z-10" />
                  </div>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                    {selectedLabId ? `NOVA MONITOR - ${selectedLabId}` : 'NOVA MONITOR'}
                  </span>
                </h1>
              </div>
              <p className="text-slate-400 mt-2 font-light tracking-wide text-sm md:text-base border-l-2 border-primary/30 pl-3 ml-1">
                {selectedLabId ? `Viewing devices in ${selectedLabId}` : 'Centralized Laboratory Monitoring System'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="glass px-6 py-3 rounded-full flex items-center gap-3 shadow-lg shadow-black/20">
                   <div className="flex flex-col items-end">
                     <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Total Devices</span>
                     <span className="text-xl font-display font-bold text-white leading-none">{totalDevices}</span>
                   </div>
                   <div className="h-8 w-px bg-white/10" />
                   <div className="flex flex-col items-end">
                     <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Online</span>
                     <span className="text-xl font-display font-bold text-emerald-400 leading-none">
                        {onlineDevices}
                     </span>
                   </div>
                </div>

                <button 
                    onClick={() => setShowHistory(true)}
                    className="p-3 glass rounded-full hover:bg-white/10 transition-colors relative group"
                    title="View Violation History"
                >
                    <MoreVertical className="w-6 h-6 text-slate-300 group-hover:text-white" />
                    {Object.keys(violations).length > 0 && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                    )}
                </button>
            </div>
          </header>

          {/* Violation List - Shows only when violations exist AND Exam Mode is active */}
          {isExamMode && Object.keys(violations).length > 0 && (
             <ViolationList 
                violations={violations} 
                onClear={() => setViolations({})}
             />
          )}

          {displayedDevices.length > 0 && (
             <GlobalControlPanel 
                devices={Object.fromEntries(displayedDevices)} 
                isExamMode={isExamMode}
                onToggleExamMode={setIsExamMode}
             />
          )}

          {!selectedLabId ? (
             // Show Labs
             labIds.length === 0 ? (
                 <div className="text-center py-32 glass rounded-3xl border-dashed border-2 border-white/10 flex flex-col items-center justify-center gap-4">
                    <div className="p-4 rounded-full bg-surfaceLight/30">
                       <Server className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-slate-500 font-light text-lg">No labs found in the network.</p>
                 </div>
             ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {labIds.map(labId => {
                       const labDevices = sortedDevices.filter(([, d]) => d.labId === labId);
                       const total = labDevices.length;
                       const online = labDevices.filter(([, d]) => d.status === 'online').length;
                       
                       return (
                         <button key={labId} onClick={() => setSelectedLabId(labId)} className="glass glass-hover p-6 rounded-3xl border border-white/5 text-left flex flex-col gap-4 transition-all hover:-translate-y-1">
                            <div className="flex items-center gap-4">
                               <div className="p-4 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                                  <Server className="w-8 h-8" />
                               </div>
                               <div>
                                  <h3 className="text-2xl font-display font-bold text-white tracking-tight">{labId}</h3>
                                  <p className="text-slate-400 text-sm mt-1">{total} Devices Total</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2 pt-4 border-t border-white/5">
                               <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                  {online} Online
                               </div>
                               <div className="flex items-center gap-2 text-slate-500 text-sm font-bold bg-slate-500/10 px-3 py-1.5 rounded-lg border border-slate-500/20">
                                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                                  {total - online} Offline
                               </div>
                            </div>
                         </button>
                       )
                    })}
                 </div>
             )
          ) : (
             // Show Devices for selected lab
             displayedDevices.length === 0 ? (
                 <div className="text-center py-32 glass rounded-3xl border-dashed border-2 border-white/10 flex flex-col items-center justify-center gap-4">
                    <div className="p-4 rounded-full bg-surfaceLight/30">
                       <Monitor className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-slate-500 font-light text-lg">No devices connected in this lab.</p>
                 </div>
             ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {displayedDevices.map(([id, entry]) => (
                       <DeviceCard 
                         key={id} 
                         labId={entry.labId}
                         deviceId={entry.deviceId} 
                         entry={entry} 
                         activeSession={devices[id]?.active}
                         onClick={() => setSelectedDevice({ labId: entry.labId, deviceId: entry.deviceId })} 
                         isExamMode={isExamMode}
                         violationCount={violations[id]?.count || 0}
                       />
                    ))}
                 </div>
             )
          )}
       </div>
    </div>
  );
}

export default App;