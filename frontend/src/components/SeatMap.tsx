'use client';

import React, { useRef, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface SeatNodeProps {
  id: string; // Seat Label (e.g. "A12")
  dbId: string; // Database ID (e.g. "12")
  row: string;
  number: number;
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED';
  isSelected: boolean;
  onClick: (id: string) => void;
  renderTrackerRef: React.MutableRefObject<number>;
}

const SeatNode = React.memo(
  function SeatNode({ id, dbId, row, number, status, isSelected, onClick, renderTrackerRef }: SeatNodeProps) {
    renderTrackerRef.current += 1;

    let statusClasses = '';
    
    switch (status) {
      case 'BOOKED':
        statusClasses = 'bg-red-950/45 text-red-500 border-red-950/80 cursor-not-allowed pointer-events-none line-through';
        break;
      case 'LOCKED':
        if (isSelected) {
          // Current user's selected/leased seat (Amber pulsing)
          statusClasses = 'bg-[#d97706] text-black border-[#d97706] animate-pulse font-extrabold cursor-pointer';
        } else {
          // Locked by another user (Static Amber)
          statusClasses = 'bg-[#d97706]/20 text-[#d97706] border-[#d97706]/40 cursor-not-allowed pointer-events-none font-bold';
        }
        break;
      case 'AVAILABLE':
      default:
        if (isSelected) {
          statusClasses = 'bg-[#d97706] text-black border-[#d97706] animate-pulse font-extrabold cursor-pointer';
        } else {
          statusClasses = 'bg-[#121212] hover:bg-white text-neutral-400 hover:text-black border-neutral-800 hover:border-white transition-colors cursor-pointer';
        }
        break;
    }

    return (
      <button
        onClick={() => onClick(id)}
        disabled={status === 'BOOKED' || (status === 'LOCKED' && !isSelected)}
        className={`w-full aspect-square border text-[9px] font-mono flex flex-col items-center justify-center select-none font-bold uppercase transition-all duration-75 relative ${statusClasses}`}
        title={`Seat ${id} (DB ID: ${dbId}, Status: ${status})`}
      >
        <span>{id}</span>
      </button>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.status === nextProps.status &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.id === nextProps.id &&
      prevProps.dbId === nextProps.dbId
    );
  }
);

export default function SeatMap() {
  const { seats, activeAllocation, selectSeat, addLog } = useApp();
  const renderTracker = useRef<number>(0);

  useEffect(() => {
    if (renderTracker.current > 0) {
      if (renderTracker.current === 200) {
        addLog('SYSTEM', `GRID HYDRO-COMPACTION: 200 seat vectors rendered to layout layer.`);
      } else {
        const skipped = 200 - renderTracker.current;
        addLog('SYSTEM', `LAYOUT OPTIMIZATION: Rendered ${renderTracker.current} nodes. Memo skipped ${skipped} static cells.`);
      }
      renderTracker.current = 0;
    }
  });

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const columns = Array.from({ length: 20 }, (_, i) => i + 1);

  // Group stats
  const totalSeats = 200;
  const bookedCount = Object.values(seats).filter(s => s.status === 'BOOKED').length;
  const lockedCount = Object.values(seats).filter(s => s.status === 'LOCKED').length;
  const availableCount = totalSeats - bookedCount - lockedCount;

  return (
    <div className="border border-neutral-800 bg-[#050505] p-5 flex flex-col justify-between h-full select-none">
      <div className="space-y-6">
        {/* Stage Bar */}
        <div>
          <div className="w-full bg-[#111] border border-neutral-800 py-2.5 text-center text-[10px] text-neutral-400 font-bold tracking-[0.3em] uppercase mb-8">
            ▲ ▲ SCREEN / STAGE DIRECTION ▲ ▲
          </div>
        </div>

        {/* 10x20 Seat Grid Layout */}
        <div className="overflow-x-auto pb-4">
          <div 
            className="min-w-[640px] grid gap-1 bg-black p-2 border border-neutral-900"
            style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}
          >
            {rows.map((row) =>
              columns.map((col) => {
                const seatId = `${row}${col}`;
                const seat = seats[seatId] || { id: '', row, number: col, status: 'AVAILABLE' };
                const isSelected = activeAllocation !== null && (activeAllocation.seatLabel === seatId || !!activeAllocation.seatLabels?.includes(seatId));
                
                return (
                  <SeatNode
                    key={seatId}
                    id={seatId}
                    dbId={seat.id}
                    row={row}
                    number={col}
                    status={seat.status}
                    isSelected={isSelected}
                    onClick={selectSeat}
                    renderTrackerRef={renderTracker}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Grid Legend & Statistics Footer */}
      <div className="border-t border-neutral-900 mt-6 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Color Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border border-neutral-800 bg-[#121212] block"></span>
            <span className="text-neutral-500 uppercase">AVAILABLE ({availableCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border border-[#d97706] bg-[#d97706]/20 block"></span>
            <span className="text-neutral-500 uppercase">LOCKED ({lockedCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border border-red-950/80 bg-red-950/45 block"></span>
            <span className="text-neutral-500 uppercase">BOOKED ({bookedCount})</span>
          </div>
        </div>

        {/* Occupancy Indicator */}
        <div className="flex items-center gap-2 text-[10px] font-mono border border-neutral-900 px-3 py-1.5 bg-black">
          <Layers className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-500">OCCUPANCY RATE:</span>
          <span className="text-white font-extrabold">
            {((bookedCount / totalSeats) * 100).toFixed(1)}%
          </span>
          <span className="text-neutral-700">|</span>
          <span className="text-neutral-400">
            {bookedCount}/{totalSeats} SECURED
          </span>
        </div>
      </div>
    </div>
  );
}
