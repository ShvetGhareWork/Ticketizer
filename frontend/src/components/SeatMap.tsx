'use client';

import React, { useRef, useEffect } from 'react';
import { Layers } from 'lucide-react';

export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED';

export interface Seat {
  id: string; // e.g. "A12"
  row: string; // "A" - "J"
  number: number; // 1 - 20
  status: SeatStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// MEMOIZED SEAT NODE COMPONENT
// Custom equality function guarantees a SeatNode only re-renders if its specific
// state (status, selection) changes.
// ─────────────────────────────────────────────────────────────────────────────
interface SeatNodeProps {
  id: string;
  row: string;
  number: number;
  status: SeatStatus;
  isSelected: boolean;
  onClick: (id: string) => void;
  renderTrackerRef: React.MutableRefObject<number>;
}

const SeatNode = React.memo(
  function SeatNode({ id, row, number, status, isSelected, onClick, renderTrackerRef }: SeatNodeProps) {
    // Increment the render tracker whenever this node renders to measure performance
    renderTrackerRef.current += 1;

    // Determine colors strictly based on the high-contrast cinema noir brutalist theme:
    // - AVAILABLE: Thin charcoal border, dark gray background, white text on hover.
    // - LOCKED (Amber): Amber background, black text, pointer-events disabled.
    // - BOOKED (Crimson): Low-contrast dark crimson background, muted gray text, line-through.
    let statusClasses = '';
    
    switch (status) {
      case 'BOOKED':
        statusClasses = 'bg-red-950/45 text-red-500 border-red-950/80 cursor-not-allowed pointer-events-none line-through';
        break;
      case 'LOCKED':
        statusClasses = 'bg-[#f59e0b] text-black border-[#f59e0b] cursor-not-allowed pointer-events-none font-extrabold';
        break;
      case 'AVAILABLE':
      default:
        if (isSelected) {
          // If selected but waiting, it is treated as optimistically locked (turns amber)
          statusClasses = 'bg-[#f59e0b] text-black border-[#f59e0b] animate-pulse font-extrabold';
        } else {
          statusClasses = 'bg-[#121212] hover:bg-white text-neutral-400 hover:text-black border-neutral-800 hover:border-white transition-colors cursor-pointer';
        }
        break;
    }

    return (
      <button
        onClick={() => onClick(id)}
        disabled={status !== 'AVAILABLE'}
        className={`w-full aspect-square border text-[9px] font-mono flex flex-col items-center justify-center select-none font-bold uppercase transition-all duration-75 relative ${statusClasses}`}
        title={`Seat ${id} (${status})`}
      >
        <span>{id}</span>
      </button>
    );
  },
  (prevProps, nextProps) => {
    // Custom memoization comparator to block unnecessary renders
    return (
      prevProps.status === nextProps.status &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.id === nextProps.id
    );
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEAT MAP COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface SeatMapProps {
  seats: Record<string, Seat>;
  selectedSeatIds: string[];
  onSelectSeat: (seatId: string) => void;
  onLogMessage: (type: 'INGRESS' | 'SYSTEM' | 'ERROR' | 'SUCCESS' | 'CONFLICT', message: string) => void;
}

export default function SeatMap({ seats, selectedSeatIds, onSelectSeat, onLogMessage }: SeatMapProps) {
  // A ref to count how many individual SeatNodes rendered in this tick
  const renderTracker = useRef<number>(0);

  useEffect(() => {
    // After render completes, check the count and log the memoization benefits
    if (renderTracker.current > 0) {
      if (renderTracker.current === 200) {
        onLogMessage('SYSTEM', `GRID INITIALIZED: 200 seat nodes rendered successfully.`);
      } else {
        const skipped = 200 - renderTracker.current;
        onLogMessage('SYSTEM', `GRID OPTIMIZATION: Rendered ${renderTracker.current} seat node(s). Skipped ${skipped} inactive nodes via React.memo cache.`);
      }
      renderTracker.current = 0; // Reset
    }
  });

  // Rows A through J, columns 1 to 20
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
                const seat = seats[seatId] || { id: seatId, row, number: col, status: 'AVAILABLE' };
                const isSelected = selectedSeatIds.includes(seatId);
                
                return (
                  <SeatNode
                    key={seatId}
                    id={seatId}
                    row={row}
                    number={col}
                    status={seat.status}
                    isSelected={isSelected}
                    onClick={onSelectSeat}
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
            <span className="w-3.5 h-3.5 border border-[#f59e0b] bg-[#f59e0b] block"></span>
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
