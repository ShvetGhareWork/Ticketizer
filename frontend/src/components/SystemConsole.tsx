'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal, ShieldAlert, Trash2 } from 'lucide-react';

export interface ConsoleLogEntry {
  id: string;
  timestamp: string; // Format: HH:MM:SS
  type: 'INGRESS' | 'SYSTEM' | 'ERROR' | 'SUCCESS' | 'CONFLICT';
  message: string;
}

interface SystemConsoleProps {
  logs: ConsoleLogEntry[];
  onClearLogs: () => void;
  onInjectSimulatedLock?: () => void;
}

export default function SystemConsole({ logs, onClearLogs, onInjectSimulatedLock }: SystemConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogTypeColor = (type: ConsoleLogEntry['type'], isLatest: boolean) => {
    if (isLatest) return 'text-[#22c55e] font-bold'; // Sharp neon green for newest line
    
    switch (type) {
      case 'ERROR':
        return 'text-red-500 font-semibold';
      case 'CONFLICT':
        return 'text-amber-500 font-semibold';
      case 'SUCCESS':
        return 'text-emerald-400';
      case 'INGRESS':
        return 'text-neutral-200';
      case 'SYSTEM':
      default:
        return 'text-neutral-500';
    }
  };

  return (
    <div className="border border-neutral-800 bg-[#050505] flex flex-col h-full select-none">
      {/* Console Header Bar */}
      <div className="border-b border-neutral-800 px-3 py-2 bg-neutral-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
            SYSTEM_DIAGNOSTICS_CONSOLE // REAL-TIME INGRESS
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onInjectSimulatedLock && (
            <button
              onClick={onInjectSimulatedLock}
              className="text-[9px] border border-amber-600/50 hover:border-amber-500 bg-amber-950/20 hover:bg-amber-900/20 px-2 py-0.5 text-amber-400 transition-colors uppercase font-bold tracking-wider"
              title="Inject concurrent external lock booking onto random seat to simulate high traffic"
            >
              + Inject Conflict
            </button>
          )}
          <button
            onClick={onClearLogs}
            className="text-[10px] text-neutral-500 hover:text-white p-0.5 hover:bg-neutral-900 transition-colors"
            title="Wipe diagnostics feed cache"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div 
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-5 h-[180px] min-h-[180px] max-h-[220px]"
      >
        <div className="space-y-0.5">
          {logs.length === 0 ? (
            <div className="text-neutral-600 italic select-none">
              [SYSTEM] DIAGNOSTICS IDLE. LISTENING ON PORT 8080/API/V1...
            </div>
          ) : (
            logs.map((log, index) => {
              const isLatest = index === logs.length - 1;
              const typeColor = getLogTypeColor(log.type, isLatest);
              
              return (
                <div key={log.id} className="flex items-start gap-2 hover:bg-neutral-900/50 px-1 py-0.5">
                  <span className="text-neutral-600 shrink-0">[{log.timestamp}]</span>
                  <span className="shrink-0 font-bold tracking-wider text-[10px] select-all">
                    {log.type}:
                  </span>
                  <span className={`break-all ${typeColor}`}>
                    {log.message}
                  </span>
                  {isLatest && (
                    <span className="inline-block w-1.5 h-3.5 bg-[#22c55e] ml-1 animate-pulse-fast shrink-0 align-middle" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Terminal Footer Info */}
      <div className="border-t border-neutral-800 px-3 py-1 bg-black text-[9px] text-neutral-600 flex items-center justify-between">
        <span>LOGS_CACHE: {logs.length}/50 LINES</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          DIAG_DAEMON_OK
        </span>
      </div>
    </div>
  );
}
