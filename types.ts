export interface DeviceInfo {
  device_id: string;
  device_name: string;
  hostname: string;
  username?: string;
  ip_address?: string;
  mac_address?: string;
  os?: string;
  status: 'online' | 'offline';
  last_seen: string;
}

export interface DeviceListEntry {
  device_name: string;
  hostname: string;
  status: 'online' | 'offline';
  last_seen: string;
  labId: string;
  deviceId: string;
}

export interface ActiveSession {
  window: string;
  process: string;
  startTime: string;
  lastUpdate: string;
  endTime?: string;
  duration?: number;
}

export interface SystemInfo {
  cpu: number;
  memory: number;
  disk: number;
  timestamp: string;
}

export interface ActivityLogEntry {
  windowTitle: string;
  processName: string;
  startTime: string;
  endTime?: string;
  duration?: number;
}

export interface CommandLogEntry {
  id: string;
  action: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  timestamp: string;
  completedAt?: string;
  result?: any;
  error?: string;
}

export type CommandAction = 
  | 'shutdown' 
  | 'restart' 
  | 'screenshot' 
  | 'lock' 
  | 'message_box' 
  | 'notify'
  | 'open_website'
  | 'type_text'
  | 'press_key'        // Added to match Python script
  | 'press_combination'; // Added to match Python script