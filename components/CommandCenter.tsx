import React, { useState } from 'react';
import { CommandAction } from '../types';
import { Power, RotateCw, Camera, Lock, MessageSquare, Globe, Keyboard, Bell, Terminal, Command, Send } from 'lucide-react';

interface CommandCenterProps {
  onSendCommand: (action: CommandAction, data: any) => void;
  isOnline: boolean;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ onSendCommand, isOnline }) => {
  const [activeTab, setActiveTab] = useState<'power' | 'tools' | 'input' | 'keys'>('power');
  const [customInput, setCustomInput] = useState('');
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [modalOpen, setModalOpen] = useState<{ type: string; title: string } | null>(null);

  const handleModalSubmit = () => {
    if (!modalOpen) return;
    
    if (modalOpen.type === 'message_box') {
      onSendCommand('message_box', { title: 'Admin Message', message: customInput });
    } else if (modalOpen.type === 'open_website') {
      onSendCommand('open_website', { url: customInput });
    } else if (modalOpen.type === 'type_text') {
      onSendCommand('type_text', { text: customInput });
    }
    
    setModalOpen(null);
    setCustomInput('');
  };

  // Correctly routing to 'press_combination' or 'press_key' based on the Python script requirements
  const handleSendKey = (keyString: string) => {
    const cleanKey = keyString.toLowerCase().trim();
    if (cleanKey.includes('+')) {
      onSendCommand('press_combination', { combo: cleanKey });
    } else {
      onSendCommand('press_key', { key: cleanKey });
    }
  };

  const handleSendCustomKey = () => {
    if (!customKeyInput.trim()) return;
    handleSendKey(customKeyInput);
    setCustomKeyInput('');
  };

  const CommandButton = ({ 
    action, 
    label, 
    icon: Icon, 
    variant = 'default',
    onClick
  }: { 
    action?: CommandAction, 
    label: string, 
    icon: any, 
    variant?: 'default' | 'danger' | 'warning',
    onClick?: () => void 
  }) => {
    const baseClasses = "flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border gap-2 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
      default: "bg-surfaceLight/30 border-surfaceLight hover:bg-primary/20 hover:border-primary/50 text-slate-200",
      danger: "bg-surfaceLight/30 border-surfaceLight hover:bg-red-500/20 hover:border-red-500/50 text-red-400",
      warning: "bg-surfaceLight/30 border-surfaceLight hover:bg-amber-500/20 hover:border-amber-500/50 text-amber-400"
    };

    return (
      <button 
        className={`${baseClasses} ${variants[variant]}`}
        onClick={onClick ? onClick : () => action && onSendCommand(action, {})}
        disabled={!isOnline}
      >
        <Icon className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">{label}</span>
      </button>
    );
  };

  const KeyButton = ({ label, keyName }: { label: string, keyName: string }) => (
    <button
      onClick={() => handleSendKey(keyName)}
      disabled={!isOnline}
      className="flex items-center justify-center px-4 py-3 bg-surfaceLight/40 border border-surfaceLight rounded-lg hover:bg-accent/20 hover:border-accent hover:text-white transition-all active:scale-95 text-xs font-mono font-bold text-slate-300 disabled:opacity-50"
    >
      {label}
    </button>
  );

  return (
    <div className="bg-surface rounded-2xl border border-surfaceLight overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-surfaceLight flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2 text-slate-200">
          <Terminal className="w-5 h-5 text-accent" />
          Command Center
        </h3>
        <div className="flex bg-surfaceLight/50 p-1 rounded-lg overflow-x-auto">
          {(['power', 'tools', 'input', 'keys'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {activeTab === 'power' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <CommandButton action="shutdown" label="Shutdown" icon={Power} variant="danger" />
            <CommandButton action="restart" label="Restart" icon={RotateCw} variant="warning" />
            <CommandButton action="lock" label="Lock PC" icon={Lock} />
            <CommandButton action="screenshot" label="Screenshot" icon={Camera} />
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <CommandButton 
              label="Message Box" 
              icon={MessageSquare} 
              onClick={() => setModalOpen({ type: 'message_box', title: 'Send Message Popup' })} 
            />
            <CommandButton 
              label="Open URL" 
              icon={Globe} 
              onClick={() => setModalOpen({ type: 'open_website', title: 'Open Website URL' })} 
            />
            <CommandButton 
              label="Send Toast" 
              icon={Bell} 
              onClick={() => setModalOpen({ type: 'notify', title: 'Send Notification Toast' })} 
            />
          </div>
        )}

        {activeTab === 'input' && (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             <CommandButton 
              label="Type Text" 
              icon={Keyboard} 
              onClick={() => setModalOpen({ type: 'type_text', title: 'Type Text Remotely' })} 
            />
           </div>
        )}

        {activeTab === 'keys' && (
          <div className="space-y-6">
             {/* Custom Key Input Section */}
             <div className="bg-surfaceLight/10 p-4 rounded-xl border border-surfaceLight/50">
                <label className="text-xs text-primary font-bold uppercase mb-2 block flex items-center gap-2">
                   <Command className="w-3 h-3" /> Custom Key Combination
                </label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={customKeyInput}
                        onChange={(e) => setCustomKeyInput(e.target.value)}
                        placeholder="e.g. ctrl+alt+delete, alt+f4, enter"
                        className="flex-1 bg-background border border-surfaceLight rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary font-mono placeholder:text-slate-600"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendCustomKey();
                        }}
                    />
                    <button 
                        onClick={handleSendCustomKey}
                        className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!isOnline || !customKeyInput.trim()}
                    >
                        SEND <Send className="w-3 h-3" />
                    </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                    Type keys separated by <code>+</code>. Examples: <code>ctrl+c</code>, <code>shift+a</code>, <code>win+r</code>.
                </p>
             </div>

             <div>
               <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-bold">Quick Keys</p>
               <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                 <KeyButton label="ENTER" keyName="enter" />
                 <KeyButton label="ESC" keyName="esc" />
                 <KeyButton label="TAB" keyName="tab" />
                 <KeyButton label="SPACE" keyName="space" />
                 <KeyButton label="⌫ BKSP" keyName="backspace" />
                 <KeyButton label="WIN" keyName="win" />
                 <KeyButton label="ALT+F4" keyName="alt+f4" />
                 <KeyButton label="PRT SCR" keyName="print_screen" />
               </div>
             </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-surfaceLight p-6 rounded-2xl w-full max-w-md shadow-2xl transform transition-all">
            <h4 className="text-lg font-bold text-white mb-4">{modalOpen.title}</h4>
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter value..."
              className="w-full bg-background border border-surfaceLight rounded-lg p-3 text-white focus:outline-none focus:border-primary mb-6"
              autoFocus
              onKeyDown={(e) => {
                  if (e.key === 'Enter') handleModalSubmit();
              }}
            />
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => { setModalOpen(null); setCustomInput(''); }}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleModalSubmit}
                className="px-6 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                disabled={!customInput.trim()}
              >
                Send Command
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};