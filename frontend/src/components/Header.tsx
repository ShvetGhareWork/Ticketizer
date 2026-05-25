'use client';

import React, { useEffect, useState } from 'react';
import { Terminal, Activity, Wifi, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  connectionStatus: 'ONLINE' | 'OFFLINE' | 'SIMULATED';
  latency: number | null;
}

export default function Header({ connectionStatus, latency }: HeaderProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().replace('T', ' ').substring(0, 19));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusDetails = () => {
    switch (connectionStatus) {
      case 'ONLINE':
        return {
          color: 'bg-emerald-500 text-emerald-500 border-emerald-500',
          label: 'GATEWAY // CONNECTED',
          icon: <Wifi className="w-4 h-4 text-emerald-500" />,
        };
      case 'SIMULATED':
        return {
          color: 'bg-amber-500 text-amber-500 border-amber-500',
          label: 'SANDBOX // SIMULATED CORE',
          icon: <Activity className="w-4 h-4 text-amber-500 animate-pulse" />,
        };
      case 'OFFLINE':
        default:
        return {
          color: 'bg-red-500 text-red-500 border-red-500 animate-pulse',
          label: 'FAULT // OFF-LINE',
          icon: <ShieldAlert className="w-4 h-4 text-red-500" />,
        };
    }
  };

  const status = getStatusDetails();

  return (
    <header className="border-b border-neutral-800 bg-[#050505] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none">
      {/* Brand Branding */}
      <div className="flex items-center gap-3">
        <div className="bg-white text-black p-2 flex items-center justify-center">
          <Terminal className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h1 id="sys-branding-title" className="text-sm font-bold tracking-widest text-white">
            TICKETFLOW // TRANSACTIONAL CORE GATEWAY
          </h1>
          <p className="text-[10px] text-neutral-500 tracking-wider">
            SECURE HIGH-CONCURRENCY SEAT BOOKING SECTOR v1.0.4
          </p>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-neutral-400">
        {/* Live Clock */}
        <div className="hidden sm:block">
          <span className="text-neutral-600">SYS_TIME: </span>
          <span className="font-mono text-neutral-300">{time || '0000-00-00 00:00:00'}</span>
        </div>

        {/* Latency */}
        <div>
          <span className="text-neutral-600">RTT: </span>
          <span className="font-mono text-neutral-300">
            {connectionStatus === 'OFFLINE' 
              ? 'N/A' 
              : latency !== null 
                ? `${latency}ms` 
                : '1ms'}
          </span>
        </div>

        {/* Throughput */}
        <div className="hidden md:block">
          <span className="text-neutral-600">THROUGHPUT: </span>
          <span className="font-mono text-neutral-300">200 RPS</span>
        </div>

        {/* Connectivity Status Dot */}
        <div className={`flex items-center gap-2 border border-neutral-800 px-3 py-1 bg-black`}>
          <span className="relative flex h-2 w-2">
            {connectionStatus !== 'OFFLINE' && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.color.split(' ')[0]} opacity-75`}></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${status.color.split(' ')[0]}`}></span>
          </span>
          <span className={`font-bold tracking-widest text-[10px] ${status.color.split(' ')[1]}`}>
            {status.label}
          </span>
          <span className="ml-1">{status.icon}</span>
        </div>
      </div>
    </header>
  );
}
