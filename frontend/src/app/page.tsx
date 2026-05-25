'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import SeatMap, { Seat, SeatStatus } from '@/components/SeatMap';
import CheckoutPanel from '@/components/CheckoutPanel';
import SystemConsole, { ConsoleLogEntry } from '@/components/SystemConsole';
import { Layers, Database, ShieldAlert } from 'lucide-react';

export default function TicketFlowDashboard() {
  // ─────────────────────────────────────────────────────────────────────────────
  // CORE STATE ORCHESTRATION (MULTI-SEAT CAPABLE)
  // ─────────────────────────────────────────────────────────────────────────────
  const [seats, setSeats] = useState<Record<string, Seat>>({});
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [bookingReferences, setBookingReferences] = useState<Record<string, string>>({});
  const [connectionStatus, setConnectionStatus] = useState<'ONLINE' | 'OFFLINE' | 'SIMULATED'>('SIMULATED');
  const [latency, setLatency] = useState<number | null>(null);
  const [logs, setLogs] = useState<ConsoleLogEntry[]>([]);
  const [concurrencyActive, setConcurrencyActive] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Refs for callbacks
  const seatsRef = useRef(seats);
  const selectedSeatIdsRef = useRef(selectedSeatIds);
  
  useEffect(() => {
    seatsRef.current = seats;
  }, [seats]);

  useEffect(() => {
    selectedSeatIdsRef.current = selectedSeatIds;
  }, [selectedSeatIds]);

  // Track locally-booked mock seat IDs to prevent them from being wiped out by polling
  const [localMockBookedSeatIds, setLocalMockBookedSeatIds] = useState<string[]>([]);
  const localMockBookedSeatIdsRef = useRef<string[]>([]);

  const updateLocalMockBookedSeats = useCallback((seatIds: string[], action: 'ADD' | 'REMOVE' | 'RESET') => {
    setLocalMockBookedSeatIds(prev => {
      let next = [...prev];
      if (action === 'ADD') {
        seatIds.forEach(id => {
          if (!next.includes(id)) next.push(id);
        });
      } else if (action === 'REMOVE') {
        next = next.filter(id => !seatIds.includes(id));
      } else if (action === 'RESET') {
        next = [];
      }
      localMockBookedSeatIdsRef.current = next;
      return next;
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // STYLED LOGGER HELPER
  // ─────────────────────────────────────────────────────────────────────────────
  const addLog = useCallback((type: ConsoleLogEntry['type'], message: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0]; // Format: HH:MM:SS
    const newEntry: ConsoleLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timeStr,
      type,
      message,
    };
    setLogs((prev) => [...prev.slice(-49), newEntry]); // Cap at 50 lines
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // SEAT GRID INITIAL LOCAL SEED
  // ─────────────────────────────────────────────────────────────────────────────
  const generateInitialLocalSeats = () => {
    const initialSeats: Record<string, Seat> = {};
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const seededBooked = new Set([
      'A5', 'A12', 'B3', 'B18', 'C8', 'C19', 'D1', 'D20', 
      'E10', 'E11', 'F14', 'G2', 'G19', 'H6', 'H15', 'I4', 'J10', 'J11', 'J12'
    ]);

    let idCounter = 1;
    rows.forEach((row) => {
      for (let col = 1; col <= 20; col++) {
        const seatNum = `${row}${col}`;
        initialSeats[seatNum] = {
          id: String(idCounter++), // Matches sequential database IDs
          row,
          number: col,
          status: seededBooked.has(seatNum) ? 'BOOKED' : 'AVAILABLE',
        };
      }
    });
    return initialSeats;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SYNC Live Inventory from Backend Database & Redis
  // ─────────────────────────────────────────────────────────────────────────────
  const syncLiveInventory = useCallback(async (isInitial = false) => {
    setIsRefreshing(true);
    const startTime = performance.now();
    try {
      const response = await fetch('http://localhost:8080/api/v1/reservations/show/1/seats', {
        method: 'GET',
        mode: 'cors',
        headers: { 'Accept': 'application/json' },
      });

      const rtt = Math.round(performance.now() - startTime);
      setLatency(rtt);

      if (response.ok) {
        const data = await response.json();
        
        // Convert array to Record<seatNumber, Seat>
        const fetchedSeats: Record<string, Seat> = {};
        
        data.forEach((s: any) => {
          fetchedSeats[s.seatNumber] = {
            id: s.id,
            row: s.row,
            number: parseInt(s.seatNumber.replace(/[^\d]/g, '')),
            status: s.status as SeatStatus,
          };
        });

        // Merge user's active selections so they aren't wiped out by polling
        selectedSeatIdsRef.current.forEach(seatId => {
          if (fetchedSeats[seatId]) {
            // Keep client selections marked as locked/selected locally
            fetchedSeats[seatId].status = 'AVAILABLE'; 
          }
        });

        // Merge locally booked mock seats so they aren't wiped out by database polling
        localMockBookedSeatIdsRef.current.forEach(seatId => {
          if (fetchedSeats[seatId]) {
            fetchedSeats[seatId].status = 'BOOKED';
          }
        });

        setSeats(fetchedSeats);
        
        if (connectionStatus !== 'ONLINE') {
          setConnectionStatus('ONLINE');
          addLog('SUCCESS', `GATEWAY CONNECTED: Linked to Spring Boot Core. Latency: ${rtt}ms.`);
        }
        
        if (isInitial) {
          addLog('SUCCESS', `DATABASE SYNC: Retrieved absolute seat ledger from PostgreSQL & Redis.`);
        }
      }
    } catch (err) {
      // Backend offline -> run simulated sandbox
      setLatency(1);
      if (connectionStatus !== 'SIMULATED') {
        setConnectionStatus('SIMULATED');
        addLog('SYSTEM', 'GATEWAY STANDBY: Local backend offline. Initializing simulated memory ledger.');
      }
      
      // Initialize with local seeded mock data if seats state is empty
      if (Object.keys(seatsRef.current).length === 0) {
        setSeats(generateInitialLocalSeats());
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [connectionStatus, addLog]);

  // Synchronize on load
  useEffect(() => {
    syncLiveInventory(true);
  }, []);

  // Periodic polling daemon (every 4 seconds) to reconcile seat state transitions
  useEffect(() => {
    const daemon = setInterval(() => {
      syncLiveInventory(false);
    }, 4000);
    return () => clearInterval(daemon);
  }, [syncLiveInventory]);

  // ─────────────────────────────────────────────────────────────────────────────
  // INGRESS SEAT LOCK: OPTIMISTIC STATE & CONCURRENCY HANDSHAKE
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSelectSeat = useCallback(async (seatId: string) => {
    const targetSeat = seatsRef.current[seatId];
    if (!targetSeat || targetSeat.status !== 'AVAILABLE') return;

    // Check if seat is already in active selected cart
    if (selectedSeatIdsRef.current.includes(seatId)) return;

    addLog('INGRESS', `INGRESS BLOCK: Lock request dispatched for Seat ${seatId}.`);

    // 1. Optimistic Lock State Update (Amber locally instantly)
    setSelectedSeatIds((prev) => [...prev, seatId]);

    // 2. Dispatch network handshake
    try {
      if (connectionStatus === 'ONLINE') {
        // Generate a completely random User ID per seat to guarantee no unique constraint collisions (idx_booking_user_show)
        const uniqueUserId = Math.floor(Math.random() * 1000000) + 1000;
        const response = await fetch(`http://localhost:8080/api/v1/reservations/show/1/seat/${targetSeat.id}?userId=${uniqueUserId}`, {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          // Lock validated by database and Redis
          setSeats((prev) => ({
            ...prev,
            [seatId]: { ...prev[seatId], status: 'LOCKED' }
          }));
          setBookingReferences((prev) => ({
            ...prev,
            [seatId]: data.bookingId
          }));
          addLog('SUCCESS', `LEASE CONFIRMED: Secured Seat ${seatId}. UUID: ${data.bookingId}.`);
        } else if (response.status === 409) {
          // 409 Conflict Catch
          setSeats((prev) => ({
            ...prev,
            [seatId]: { ...prev[seatId], status: 'BOOKED' }
          }));
          setSelectedSeatIds((prev) => prev.filter(id => id !== seatId));
          addLog('CONFLICT', `409 CONFLICT: Seat ${seatId} was reserved concurrently by another client.`);
        } else {
          throw new Error('API Lock Ingress Rejected');
        }
      } else {
        // Simulated Sandbox Mode
        await new Promise((resolve) => setTimeout(resolve, 300));
        const mockUUID = `UUID-${Math.random().toString(36).substring(2, 10).toUpperCase()}-MOCK`;
        setSeats((prev) => ({
          ...prev,
          [seatId]: { ...prev[seatId], status: 'LOCKED' }
        }));
        setBookingReferences((prev) => ({
          ...prev,
          [seatId]: mockUUID
        }));
        addLog('SUCCESS', `SANDBOX LOCK: Secured Seat ${seatId}. Simulated UUID: ${mockUUID}.`);
      }
    } catch (err) {
      setSelectedSeatIds((prev) => prev.filter(id => id !== seatId));
      addLog('ERROR', `LOCK INGRESS FAILED: Connection handshake aborted. Seat ${seatId} released.`);
    }
  }, [connectionStatus, addLog]);

  // ─────────────────────────────────────────────────────────────────────────────
  // WEBHOOK DISPATCH: BATCH TRANSACTION SETTLEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  const handleAuthorizePayment = useCallback(async (refs: string[]) => {
    if (refs.length === 0) return;

    // Identify which seats in this cart are mock
    const mockSeatIds: string[] = [];
    selectedSeatIdsRef.current.forEach(seatId => {
      const ref = bookingReferences[seatId];
      if (ref && (ref.includes('-MOCK') || connectionStatus === 'SIMULATED')) {
        mockSeatIds.push(seatId);
      }
    });

    try {
      if (connectionStatus === 'ONLINE') {
        // Dispatch parallel webhook calls for each selected seat reference
        const webhookPromises = refs.map(async (ref) => {
          // INTERCEPT MOCK TOKENS: Handle sandbox references locally
          if (ref.includes('-MOCK')) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            return { txnId: `TXN_MOCK_${Math.random().toString(36).substring(2, 8).toUpperCase()}` };
          }

          const txnId = `TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          
          const response = await fetch('http://localhost:8080/api/v1/payments/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingReference: ref,
              paymentTransactionId: txnId,
              paymentStatus: 'SUCCESS',
            }),
          });
          
          if (!response.ok) throw new Error(`Webhook rejected for reference ${ref}`);
          return { txnId };
        });

        const results = await Promise.all(webhookPromises);
        
        results.forEach(({ txnId }) => {
          addLog('SUCCESS', `PAYMENT VERIFIED: Settlement resolved. Ledger Txn: ${txnId}.`);
        });
      } else {
        // Simulated Sandbox
        await new Promise((resolve) => setTimeout(resolve, 800));
        addLog('SUCCESS', `SANDBOX SETTLEMENT: Transactions resolved successfully.`);
      }
    } catch (err) {
      addLog('ERROR', `TRANSACTION FAULT: One or more payment settle routings failed.`);
    } finally {
      // Mark mock seats as BOOKED locally
      if (mockSeatIds.length > 0) {
        updateLocalMockBookedSeats(mockSeatIds, 'ADD');
        setSeats(prev => {
          const updated = { ...prev };
          mockSeatIds.forEach(id => {
            if (updated[id]) {
              updated[id] = { ...updated[id], status: 'BOOKED' };
            }
          });
          return updated;
        });
      }

      // Clean up local client selections and sync live DB state instantly
      setSelectedSeatIds([]);
      setBookingReferences({});
      setTimeout(() => syncLiveInventory(false), 500);
    }
  }, [connectionStatus, bookingReferences, addLog, syncLiveInventory, updateLocalMockBookedSeats]);

  // ─────────────────────────────────────────────────────────────────────────────
  // WEBHOOK DISPATCH: BATCH PAYMENT REVERSAL
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSimulateReversal = useCallback(async (refs: string[]) => {
    if (refs.length === 0) return;

    // Identify which seats in this cart are mock
    const mockSeatIds: string[] = [];
    selectedSeatIdsRef.current.forEach(seatId => {
      const ref = bookingReferences[seatId];
      if (ref && (ref.includes('-MOCK') || connectionStatus === 'SIMULATED')) {
        mockSeatIds.push(seatId);
      }
    });

    try {
      if (connectionStatus === 'ONLINE') {
        const webhookPromises = refs.map(async (ref) => {
          // INTERCEPT MOCK TOKENS: Handle sandbox reversals locally
          if (ref.includes('-MOCK')) {
            await new Promise((resolve) => setTimeout(resolve, 150));
            return ref;
          }

          const txnId = `TXN_FAIL_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          
          const response = await fetch('http://localhost:8080/api/v1/payments/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingReference: ref,
              paymentTransactionId: txnId,
              paymentStatus: 'FAILED',
            }),
          });
          
          if (!response.ok) throw new Error(`Reversal rejected for reference ${ref}`);
          return ref;
        });

        await Promise.all(webhookPromises);
        addLog('INGRESS', `REVERSAL DISPATCH: Wiped ${refs.length} bookings. Seats returned to AVAILABLE.`);
      } else {
        // Simulated Sandbox
        await new Promise((resolve) => setTimeout(resolve, 500));
        addLog('INGRESS', `SANDBOX REVERSAL: Cancelled checkout. Seats returned to AVAILABLE.`);
      }
    } catch (err) {
      addLog('ERROR', `REVERSAL FAULT: Failed to complete batch inventory release.`);
    } finally {
      // Remove mock seats from local mock booked seats, and set status to AVAILABLE
      if (mockSeatIds.length > 0) {
        updateLocalMockBookedSeats(mockSeatIds, 'REMOVE');
        setSeats(prev => {
          const updated = { ...prev };
          mockSeatIds.forEach(id => {
            if (updated[id]) {
              updated[id] = { ...updated[id], status: 'AVAILABLE' };
            }
          });
          return updated;
        });
      }

      setSelectedSeatIds([]);
      setBookingReferences({});
      setTimeout(() => syncLiveInventory(false), 500);
    }
  }, [connectionStatus, bookingReferences, addLog, syncLiveInventory, updateLocalMockBookedSeats]);

  // ─────────────────────────────────────────────────────────────────────────────
  // BATCH LEASE TIMEOUT CALLBACK
  // ─────────────────────────────────────────────────────────────────────────────
  const handleLeaseTimeout = useCallback(() => {
    if (selectedSeatIdsRef.current.length === 0) return;
    const activeSeats = [...selectedSeatIdsRef.current];

    setSeats((prev) => {
      const updated = { ...prev };
      activeSeats.forEach(seatId => {
        updated[seatId] = { ...updated[seatId], status: 'AVAILABLE' };
      });
      return updated;
    });

    addLog('ERROR', `LEASE EXPIRED: Timeout evicted leases for seats [${activeSeats.join(', ')}]. Inventory reclaimed.`);
    setSelectedSeatIds([]);
    setBookingReferences({});
    
    if (connectionStatus === 'ONLINE') {
      // Refresh backend state
      setTimeout(() => syncLiveInventory(false), 500);
    }
  }, [connectionStatus, addLog, syncLiveInventory]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CORE DB ADMINISTRATIVE RESET WEBHOOK (FLUSH DATABASE)
  // ─────────────────────────────────────────────────────────────────────────────
  const handleFlushDatabase = async () => {
    addLog('SYSTEM', 'FLUSH COMMAND: Dispatched administrative core flush request to gateway...');
    try {
      if (connectionStatus === 'ONLINE') {
        const response = await fetch('http://localhost:8080/api/v1/reservations/flush', {
          method: 'POST',
        });

        if (response.ok) {
          setSelectedSeatIds([]);
          setBookingReferences({});
          updateLocalMockBookedSeats([], 'RESET');
          addLog('SUCCESS', 'FLUSH COMPLETE: Backend bookings wiped. PostgreSQL seats & Redis sets reset to AVAILABLE.');
          // Immediate re-sync
          syncLiveInventory(false);
        } else {
          throw new Error('Flush command rejected by backend');
        }
      } else {
        // Simulated Sandbox Reset
        await new Promise((resolve) => setTimeout(resolve, 600));
        setSelectedSeatIds([]);
        setBookingReferences({});
        updateLocalMockBookedSeats([], 'RESET');
        
        // Reset all local seats to AVAILABLE
        setSeats((prev) => {
          const reset: Record<string, Seat> = {};
          Object.keys(prev).forEach(key => {
            reset[key] = { ...prev[key], status: 'AVAILABLE' };
          });
          return reset;
        });
        
        addLog('SUCCESS', 'SANDBOX FLUSHED: Wiped all local locks & bookings. All 200 seat nodes reset to AVAILABLE.');
      }
    } catch (err) {
      addLog('ERROR', 'FLUSH FAILED: Administrative gateway request timed out or was refused.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MOCK HIGH-CONCURRENCY CONFLICT TRAFFIC GENERATOR
  // ─────────────────────────────────────────────────────────────────────────────
  const handleInjectSimulatedLock = useCallback(() => {
    const currentSeats = seatsRef.current;
    const activeSelection = selectedSeatIdsRef.current;
    const availableSeats = Object.values(currentSeats).filter(s => s.status === 'AVAILABLE' && !activeSelection.includes(s.row + s.number));
    
    if (availableSeats.length === 0) return;

    // Pick random available seat to book or lock
    const randomSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
    const seatKey = randomSeat.row + randomSeat.number;
    const isLockOnly = Math.random() > 0.4;
    const actionStatus: SeatStatus = isLockOnly ? 'LOCKED' : 'BOOKED';
    const userId = Math.floor(Math.random() * 200) + 700;

    setSeats((prev) => ({
      ...prev,
      [seatKey]: { ...prev[seatKey], status: actionStatus }
    }));

    if (actionStatus === 'LOCKED') {
      addLog('CONFLICT', `CONCURRENT LOCK: Remote user (userId=${userId}) leased Seat ${seatKey} in background.`);
      
      // Auto-unlock simulated leases after 15 seconds
      setTimeout(() => {
        setSeats((prev) => {
          if (prev[seatKey]?.status === 'LOCKED') {
            addLog('SYSTEM', `LEASE RECLAIMED: Background lease for Seat ${seatKey} expired. Released.`);
            return {
              ...prev,
              [seatKey]: { ...prev[seatKey], status: 'AVAILABLE' }
            };
          }
          return prev;
        });
      }, 15000);

    } else {
      addLog('SUCCESS', `EXTERNAL BOOKING: Finalized permanent ticket transaction for Seat ${seatKey} by client ${userId}.`);
    }
  }, [addLog]);

  // Concurrency Loop Daemon
  useEffect(() => {
    if (!concurrencyActive) return;

    const runConLoop = () => {
      const timeout = Math.floor(Math.random() * 4000) + 4000;
      return setTimeout(() => {
        if (Math.random() < 0.25) {
          handleInjectSimulatedLock();
        }
        timer = runConLoop();
      }, timeout);
    };

    let timer = runConLoop();
    return () => clearTimeout(timer);
  }, [concurrencyActive, handleInjectSimulatedLock]);

  // Clear system console cache
  const handleClearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <div className="flex flex-col flex-1 gap-4 md:gap-6 lg:gap-8">
      {/* Component A: Gateway Diagnostics Header */}
      <Header connectionStatus={connectionStatus} latency={latency} />

      {/* Main Structural Matrix split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 flex-1 items-start">
        
        {/* Left Side: Seat Map Grid (Cols 1 to 8) */}
        <div className="lg:col-span-8 flex flex-col h-full gap-4">
          
          {/* Seating Header & Admin Operations */}
          <div className="border border-neutral-800 bg-[#050505] p-3 flex flex-wrap items-center justify-between gap-4 select-none">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#f59e0b]" />
              <span className="text-xs uppercase font-extrabold tracking-wider text-white">
                AUDITORIUM SEATING MATRIX // SECTOR-1
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-[10px] text-neutral-400 font-mono">
              <button 
                onClick={() => setConcurrencyActive(!concurrencyActive)}
                className={`px-2 py-0.5 border font-bold uppercase transition-colors ${
                  concurrencyActive 
                    ? 'border-emerald-600 bg-emerald-950/20 text-emerald-400' 
                    : 'border-neutral-800 bg-black text-neutral-500 hover:border-neutral-700'
                }`}
                title="Toggle background activity generator"
              >
                Simulator: {concurrencyActive ? 'ACTIVE' : 'MUTED'}
              </button>

              {/* Live Sync Indicator */}
              <button 
                onClick={() => syncLiveInventory(true)}
                disabled={isRefreshing}
                className="px-2 py-0.5 border border-neutral-800 hover:border-white bg-black text-neutral-400 hover:text-white transition-all font-bold uppercase flex items-center gap-1 disabled:opacity-50"
              >
                <Database className={`w-3 h-3 ${isRefreshing && 'animate-spin'}`} />
                Sync
              </button>

              {/* CRITICAL: DB Flush Administrator Trigger */}
              <button 
                onClick={handleFlushDatabase}
                className="px-3 py-0.5 border border-red-800/80 bg-red-950/30 text-red-400 hover:bg-red-900/40 hover:border-red-500 transition-all font-extrabold uppercase flex items-center gap-1"
                title="Wipe database bookings table and restore 200 AVAILABLE seats in PostgreSQL and Redis sets"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Flush DB
              </button>
            </div>
          </div>

          {/* Seat Grid Component */}
          <SeatMap
            seats={seats}
            selectedSeatIds={selectedSeatIds}
            onSelectSeat={handleSelectSeat}
            onLogMessage={addLog}
          />
        </div>

        {/* Right Side: Control Panels & Command logs (Cols 9 to 12) */}
        <div className="lg:col-span-4 flex flex-col gap-4 h-full justify-between">
          
          {/* Checkout Panel Zone */}
          <div className="flex-1 min-h-[360px]">
            {selectedSeatIds.length > 0 ? (
              <CheckoutPanel
                selectedSeats={selectedSeatIds}
                bookingReferences={bookingReferences}
                onAuthorizePayment={handleAuthorizePayment}
                onSimulateReversal={handleSimulateReversal}
                onTimeout={handleLeaseTimeout}
                onLogMessage={addLog}
              />
            ) : (
              /* Idle Brutalist Standby Card */
              <div className="border border-neutral-800 bg-[#050505] p-6 text-center flex flex-col items-center justify-center h-full min-h-[380px] select-none">
                <div className="border border-neutral-800 bg-black p-4 inline-block mb-4">
                  <Database className="w-8 h-8 text-neutral-500 stroke-[1.5] animate-pulse" />
                </div>
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-white mb-2">
                  TRANSACTIONAL CORE STANDBY
                </h3>
                <p className="text-[10px] text-neutral-500 max-w-[240px] leading-5 mx-auto uppercase">
                  Gateway idle. Click one or more available seat Nodes from the grid to allocate locks into the basket.
                </p>
                <div className="w-16 border-t border-neutral-800 my-6 mx-auto"></div>
                <div className="text-[9px] text-neutral-600 font-mono tracking-wider">
                  LISTENING FOR TRANSACTION INGRESS_
                </div>
              </div>
            )}
          </div>

          {/* System Console Diagnostics Log */}
          <div>
            <SystemConsole 
              logs={logs} 
              onClearLogs={handleClearLogs}
              onInjectSimulatedLock={handleInjectSimulatedLock}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
