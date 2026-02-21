import React from 'react';
import { SystemInfo } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Cpu, HardDrive, Disc } from 'lucide-react';

interface SystemResourcesProps {
  systemInfo: SystemInfo | null;
}

export const SystemResources: React.FC<SystemResourcesProps> = ({ systemInfo }) => {
  if (!systemInfo) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-surfaceLight/20 rounded-xl p-4 animate-pulse h-32 flex items-center justify-center">
            <span className="text-slate-600">Waiting for system data...</span>
          </div>
        ))}
      </div>
    );
  }

  const createData = (value: number) => [
    { name: 'Used', value: value },
    { name: 'Free', value: 100 - value },
  ];

  const ResourceCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) => (
    <div className="bg-surfaceLight/30 rounded-xl p-4 border border-surfaceLight flex flex-col items-center relative overflow-hidden">
      <div className="flex items-center justify-between w-full mb-2 z-10">
        <div className="flex items-center gap-2 text-slate-300">
          <Icon className="w-4 h-4" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        <span className="font-mono font-bold text-lg">{value.toFixed(1)}%</span>
      </div>
      
      <div className="h-32 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={createData(value)}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={55}
              startAngle={180}
              endAngle={0}
              paddingAngle={5}
              dataKey="value"
            >
              <Cell key="used" fill={color} stroke="none" />
              <Cell key="free" fill="#334155" stroke="none" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pt-8">
           <span className="text-xs text-slate-500 font-medium">USAGE</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ResourceCard 
        title="CPU Load" 
        value={systemInfo.cpu} 
        icon={Cpu} 
        color="#3b82f6" // blue-500
      />
      <ResourceCard 
        title="Memory" 
        value={systemInfo.memory} 
        icon={HardDrive} 
        color="#a855f7" // purple-500
      />
      <ResourceCard 
        title="Disk" 
        value={systemInfo.disk} 
        icon={Disc} 
        color="#06b6d4" // cyan-500
      />
    </div>
  );
};
