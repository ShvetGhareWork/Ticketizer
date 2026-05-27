'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED';

export interface Seat {
  id: string; // Database sequential ID (e.g. "1")
  row: string; // "A" - "J"
  number: number; // 1 - 20
  status: SeatStatus;
}

export interface AllocationManifest {
  bookingId: string;
  seatId: string;
  seatLabel: string;
  status: string; // "PENDING", "VERIFYING", "CONFIRMED", "FAILED"
  qrCodePayload?: string;
  price?: number;
  hallName?: string;
  venue?: string;
  showId?: number;
  bookingIds?: string[];
  seatIds?: string[];
  seatLabels?: string[];
  qrCodePayloads?: string[];
}

export interface ConsoleLogEntry {
  id: string;
  timestamp: string;
  type: 'INGRESS' | 'SYSTEM' | 'ERROR' | 'SUCCESS' | 'CONFLICT' | 'INFO';
  message: string;
}

interface AppContextType {
  authToken: string | null;
  currentShowId: number;
  seats: Record<string, Seat>;
  activeAllocation: AllocationManifest | null;
  connectionStatus: 'ONLINE' | 'OFFLINE' | 'SIMULATED';
  latency: number | null;
  logs: ConsoleLogEntry[];
  isRefreshing: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  loginWithGoogle: (googleCredentialToken: string) => Promise<boolean>;
  register: (fullName: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  setCurrentShowId: (showId: number) => void;
  syncLiveInventory: (isInitial?: boolean) => Promise<void>;
  selectSeat: (seatId: string) => Promise<void>;
  clearActiveAllocation: () => void;
  setActiveAllocation: (alloc: AllocationManifest | null) => void;
  addLog: (type: ConsoleLogEntry['type'], message: string) => void;
  clearLogs: () => void;
  flushDatabase: () => Promise<void>;
  simulateExternalLock: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentShowId, setCurrentShowIdState] = useState<number>(1);
  const [seats, setSeats] = useState<Record<string, Seat>>({});
  const [activeAllocation, setActiveAllocation] = useState<AllocationManifest | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'ONLINE' | 'OFFLINE' | 'SIMULATED'>('SIMULATED');
  const [latency, setLatency] = useState<number | null>(null);
  const [logs, setLogs] = useState<ConsoleLogEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Keep references for callbacks to prevent closure stale states
  const authTokenRef = useRef(authToken);
  const currentShowIdRef = useRef(currentShowId);
  const seatsRef = useRef(seats);
  const activeAllocationRef = useRef(activeAllocation);

  useEffect(() => { authTokenRef.current = authToken; }, [authToken]);
  useEffect(() => { currentShowIdRef.current = currentShowId; }, [currentShowId]);
  useEffect(() => { seatsRef.current = seats; }, [seats]);
  useEffect(() => { activeAllocationRef.current = activeAllocation; }, [activeAllocation]);

  // Load token from localStorage on mount (for persistent dev ease)
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setAuthToken(savedToken);
      setConnectionStatus('ONLINE');
      addLog('SYSTEM', 'RESTORED SESSION: Session token loaded from localStorage.');
    }
  }, []);

  const addLog = useCallback((type: ConsoleLogEntry['type'], message: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newEntry: ConsoleLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timeStr,
      type,
      message,
    };
    setLogs((prev) => [...prev.slice(-49), newEntry]); // Keep last 50 lines
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // CORE AUTH: LOGIN
  // ─────────────────────────────────────────────────────────────────────────────
  const login = async (email: string, password?: string): Promise<boolean> => {
    addLog('SYSTEM', `AUTH REQUEST: Initiating secure login handshake for ${email}...`);
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.accessToken;
        setAuthToken(token);
        localStorage.setItem('authToken', token);
        setConnectionStatus('ONLINE');
        addLog('SUCCESS', 'AUTH RESOLVED: Access token captured. Gateway ONLINE.');
        return true;
      } else {
        addLog('ERROR', `AUTH REFUSED: Relational gateway returned status ${response.status}. Credentials rejected.`);
        return false;
      }
    } catch {
      addLog('ERROR', 'AUTH FAILBACK: Relational gateway offline. Activating local simulated credentials...');
      const simulatedToken = `simulated-token-${btoa(email)}`;
      setAuthToken(simulatedToken);
      localStorage.setItem('authToken', simulatedToken);
      setConnectionStatus('SIMULATED');
      addLog('SUCCESS', 'AUTH RESOLVED (SIMULATED): Handshake succeeded in offline sandbox mode.');
      return true;
    }
  };

  const loginWithGoogle = async (googleCredentialToken: string): Promise<boolean> => {
    addLog('SYSTEM', 'AUTH REQUEST: Initiating secure Google OAuth handshake...');
    
    let email = 'google-user@gmail.com';
    let fullName = 'Google User';
    
    try {
      if (googleCredentialToken) {
        const base64Url = googleCredentialToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        email = payload.email || email;
        fullName = payload.name || payload.given_name || fullName;
      }
    } catch (err) {
      addLog('ERROR', 'AUTH REQUEST: Google token payload parsing failed.');
    }
    
    try {
      // Try logging in first to avoid triggering a 409 Conflict console error for returning users
      let loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'google-oauth-mock' }),
      });

      // If user doesn't exist yet, attempt registration
      if (!loginRes.ok) {
        const regRes = await fetch('http://localhost:8080/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, password: 'google-oauth-mock' }),
        });

        if (regRes.ok || regRes.status === 409) {
          loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'google-oauth-mock' }),
          });
        }
      }

      if (loginRes.ok) {
        const data = await loginRes.json();
        const token = data.accessToken;
        setAuthToken(token);
        localStorage.setItem('authToken', token);
        setConnectionStatus('ONLINE');
        addLog('SUCCESS', 'AUTH RESOLVED (GOOGLE): Google account synced and stored in relational database.');
        return true;
      }
      throw new Error('Google registration handshake failed');
    } catch {
      const simulatedToken = `google-token-${btoa(email)}`;
      setAuthToken(simulatedToken);
      localStorage.setItem('authToken', simulatedToken);
      setConnectionStatus('SIMULATED');
      addLog('SUCCESS', `AUTH RESOLVED (GOOGLE): Secure token received for ${email}. (SIMULATED mode)`);
      return true;
    }
  };

  const register = async (fullName: string, email: string, password?: string): Promise<boolean> => {
    addLog('SYSTEM', `REGISTER REQUEST: Registering account for ${fullName} (${email})...`);
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });
      if (response.ok) {
        addLog('SUCCESS', 'REGISTRATION SUCCESS: Account provisioned. Logging in...');
        return await login(email, password);
      } else {
        addLog('ERROR', `REGISTRATION REFUSED: Relational gateway returned status ${response.status}. Account exists or validation failed.`);
        return false;
      }
    } catch {
      addLog('ERROR', 'REGISTRATION FAILBACK: Relational gateway offline. Activating local simulated user...');
      const simulatedToken = `simulated-token-${btoa(email)}`;
      setAuthToken(simulatedToken);
      localStorage.setItem('authToken', simulatedToken);
      setConnectionStatus('SIMULATED');
      addLog('SUCCESS', 'AUTH RESOLVED: Sandbox user registered and logged in.');
      return true;
    }
  };

  const logout = useCallback(() => {
    setAuthToken(null);
    localStorage.removeItem('authToken');
    setActiveAllocation(null);
    setSeats({});
    setConnectionStatus('SIMULATED');
    addLog('SYSTEM', 'SESSION TERMINATED: User logged out. Swapped to offline sandbox.');
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // INVENTORY SYNC
  // ─────────────────────────────────────────────────────────────────────────────
  const generateInitialLocalSeats = () => {
    const initialSeats: Record<string, Seat> = {};
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const seededBooked = new Set([
      'A5', 'A12', 'B3', 'B18', 'C8', 'C19', 'D1', 'D20', 'E10',
      'E11', 'F14', 'G2', 'G19', 'H6', 'H15', 'I4', 'J10', 'J11', 'J12'
    ]);

    let idCounter = currentShowIdRef.current === 1 ? 1 : 201;
    rows.forEach((row) => {
      for (let col = 1; col <= 20; col++) {
        const seatNum = `${row}${col}`;
        initialSeats[seatNum] = {
          id: String(idCounter++),
          row,
          number: col,
          status: seededBooked.has(seatNum) ? 'BOOKED' : 'AVAILABLE',
        };
      }
    });
    return initialSeats;
  };

  const syncLiveInventory = useCallback(async (isInitial = false) => {
    setIsRefreshing(true);
    const startTime = performance.now();
    const showId = currentShowIdRef.current;
    
    // Build headers - include Bearer auth if logged in
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (authTokenRef.current) {
      headers['Authorization'] = `Bearer ${authTokenRef.current}`;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/v1/reservations/show/${showId}/seats`, {
        method: 'GET',
        mode: 'cors',
        headers,
      });
      const rtt = Math.round(performance.now() - startTime);
      setLatency(rtt);

      if (response.ok) {
        const data = await response.json();
        const fetchedSeats: Record<string, Seat> = {};
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

        data.forEach((s: any) => {
          // Parse sequential ID to coordinates
          const idNum = Number(s.id);
          // Standardize ID offset for show 2 (which ranges from 201 to 400)
          const adjustedId = showId === 1 ? idNum : idNum - 200;
          const rowIndex = Math.floor((adjustedId - 1) / 20);
          const colNumber = ((adjustedId - 1) % 20) + 1;
          const rowLabel = rows[rowIndex] || 'A';
          const seatLabel = s.seatNumber || `${rowLabel}${colNumber}`;

          fetchedSeats[seatLabel] = {
            id: String(s.id),
            row: rowLabel,
            number: colNumber,
            status: s.status as SeatStatus,
          };
        });

        // Retain local client selections/locks so they aren't wiped out by polling
        if (activeAllocationRef.current) {
          const currentAlloc = activeAllocationRef.current;
          const labels = currentAlloc.seatLabels || [currentAlloc.seatLabel];
          labels.forEach((lbl: string) => {
            if (fetchedSeats[lbl]) {
              fetchedSeats[lbl].status = 'LOCKED';
            }
          });
        }

        setSeats(fetchedSeats);

        if (connectionStatus !== 'ONLINE' && authTokenRef.current) {
          setConnectionStatus('ONLINE');
          addLog('SUCCESS', `GATEWAY SYNC: Linked to Ticketizer cluster. Latency: ${rtt}ms.`);
        }
        if (isInitial) {
          addLog('SUCCESS', `LEDGER SYNC: Seat statuses loaded from PostgreSQL & Redis cache.`);
        }
      } else {
        if (response.status === 403 || response.status === 401) {
          setAuthToken(null);
          localStorage.removeItem('authToken');
          setSeats({});
          setConnectionStatus('SIMULATED');
          addLog('ERROR', 'SESSION CONFLICT: Relational database rejected active token. Please sign in again.');
          return;
        }
        throw new Error('Database server returned error status');
      }
    } catch (err) {
      setLatency(1);
      if (connectionStatus !== 'SIMULATED') {
        setConnectionStatus('SIMULATED');
        addLog('SYSTEM', 'GATEWAY STANDBY: Local backend offline. Running simulated memory ledger.');
      }
      // Populate local sandbox grid if empty
      if (Object.keys(seatsRef.current).length === 0 || isInitial) {
        setSeats(generateInitialLocalSeats());
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [connectionStatus, addLog]);

  const setCurrentShowId = (showId: number) => {
    setCurrentShowIdState(showId);
    currentShowIdRef.current = showId;
    setSeats({}); // Wipe old seat mapping to trigger full layout rebuild
    setTimeout(() => syncLiveInventory(true), 100);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // INGRESS LOCK HANDSHAKE
  // ─────────────────────────────────────────────────────────────────────────────
  const selectSeat = async (seatId: string) => {
    const seat = seatsRef.current[seatId];
    if (!seat) return;

    if (!authTokenRef.current) {
      addLog('ERROR', 'SECURE ACCESS DENIED: Authentication required to lock inventory slots.');
      return;
    }

    const currentAlloc = activeAllocationRef.current;

    // 1. Deselection Toggle: If they clicked a seat that is already selected
    if (currentAlloc && (currentAlloc.seatLabels?.includes(seatId) || currentAlloc.seatLabel === seatId)) {
      addLog('INFO', `DESELECTED: Releasing local hold on Seat ${seatId}.`);
      
      const labels = currentAlloc.seatLabels || [currentAlloc.seatLabel];
      const ids = currentAlloc.seatIds || [currentAlloc.seatId];
      const bookingIds = currentAlloc.bookingIds || [currentAlloc.bookingId];
      
      const index = labels.indexOf(seatId);
      if (index > -1) {
        const nextSeatLabels = labels.filter((_: string, i: number) => i !== index);
        const nextSeatIds = ids.filter((_: string, i: number) => i !== index);
        const nextBookingIds = bookingIds.filter((_: string, i: number) => i !== index);

        // Revert local seat status to AVAILABLE
        setSeats((prev) => ({
          ...prev,
          [seatId]: { ...prev[seatId], status: 'AVAILABLE' }
        }));

        if (nextSeatLabels.length === 0) {
          setActiveAllocation(null);
          activeAllocationRef.current = null;
          addLog('INFO', 'LEASE RELEASED: Cleaned active basket.');
        } else {
          const updatedAlloc: AllocationManifest = {
            bookingId: nextBookingIds.join(','),
            bookingIds: nextBookingIds,
            seatId: nextSeatIds[0],
            seatIds: nextSeatIds,
            seatLabel: nextSeatLabels.join(', '),
            seatLabels: nextSeatLabels,
            status: 'PENDING',
            showId: currentAlloc.showId,
          };
          setActiveAllocation(updatedAlloc);
          activeAllocationRef.current = updatedAlloc;
        }
      }
      return;
    }

    // Only allow selecting AVAILABLE seats
    if (seat.status !== 'AVAILABLE') return;

    // Step 2: Optimistic UI update (Amber)
    setSeats((prev) => ({
      ...prev,
      [seatId]: { ...prev[seatId], status: 'LOCKED' },
    }));
    addLog('INGRESS', `LEASE ACQUIRING: Dispatching fast-path lock handshake for Seat ${seatId}...`);

    try {
      const showId = currentShowIdRef.current;
      const response = await fetch(`http://localhost:8080/api/v1/reservations/show/${showId}/seat/${seat.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokenRef.current}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Append or initialize allocation manifest
        let updatedAlloc: AllocationManifest;
        if (currentAlloc) {
          const nextSeatLabels = [...(currentAlloc.seatLabels || [currentAlloc.seatLabel]), seatId];
          const nextSeatIds = [...(currentAlloc.seatIds || [currentAlloc.seatId]), seat.id];
          const nextBookingIds = [...(currentAlloc.bookingIds || [currentAlloc.bookingId]), data.bookingId];
          
          updatedAlloc = {
            bookingId: nextBookingIds.join(','),
            bookingIds: nextBookingIds,
            seatId: nextSeatIds[0],
            seatIds: nextSeatIds,
            seatLabel: nextSeatLabels.join(', '),
            seatLabels: nextSeatLabels,
            status: 'PENDING',
            showId,
          };
        } else {
          updatedAlloc = {
            bookingId: data.bookingId,
            bookingIds: [data.bookingId],
            seatId: seat.id,
            seatIds: [seat.id],
            seatLabel: seatId,
            seatLabels: [seatId],
            status: 'PENDING',
            showId,
          };
        }
        
        setActiveAllocation(updatedAlloc);
        activeAllocationRef.current = updatedAlloc;
        addLog('SUCCESS', `LEASE CAPTURED: Seat ${seatId} locked. Booking ID: ${data.bookingId.substring(0, 8)}...`);
      } else if (response.status === 409) {
        // Conflict! Target seat locked/booked in background
        setSeats((prev) => ({
          ...prev,
          [seatId]: { ...prev[seatId], status: 'BOOKED' },
        }));
        addLog('CONFLICT', `CONCURRENT COLLISION: Seat ${seatId} was booked by another client in the background.`);
      } else {
        throw new Error('Lock refused');
      }
    } catch (err) {
      // Revert optimistic lock
      setSeats((prev) => ({
        ...prev,
        [seatId]: { ...prev[seatId], status: 'AVAILABLE' },
      }));
      addLog('ERROR', `LEASE LOCK FAULT: Relational lock gateway refused slot allocation for Seat ${seatId}.`);
    }
  };

  const clearActiveAllocation = useCallback(() => {
    if (activeAllocationRef.current) {
      const labels = activeAllocationRef.current.seatLabels || [activeAllocationRef.current.seatLabel];
      setSeats((prev) => {
        const next = { ...prev };
        labels.forEach((lbl: string) => {
          if (next[lbl] && next[lbl].status === 'LOCKED') {
            next[lbl] = { ...next[lbl], status: 'AVAILABLE' };
          }
        });
        return next;
      });
      addLog('INFO', `LEASE RELEASED: Cleaned active basket. Seats ${labels.join(', ')} returned to available pool.`);
    }
    setActiveAllocation(null);
  }, [addLog]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CORE DB FLUSH / RESET
  // ─────────────────────────────────────────────────────────────────────────────
  const flushDatabase = async () => {
    addLog('SYSTEM', 'FLUSH PROTOCOL: Dispatching administrative core flush request...');
    try {
      const headers: Record<string, string> = {};
      if (authTokenRef.current) {
        headers['Authorization'] = `Bearer ${authTokenRef.current}`;
      }

      const response = await fetch('http://localhost:8080/api/v1/reservations/flush', {
        method: 'POST',
        headers,
      });

      if (response.ok) {
        setActiveAllocation(null);
        addLog('SUCCESS', 'FLUSH COMMAND: Database wiped. Rebuilding 200 AVAILABLE seats in memory.');
        await syncLiveInventory(true);
      } else {
        throw new Error('Flush command refused');
      }
    } catch (err) {
      // Simulated flush fallback
      setActiveAllocation(null);
      setSeats((prev) => {
        const reset: Record<string, Seat> = {};
        Object.keys(prev).forEach((key) => {
          reset[key] = { ...prev[key], status: 'AVAILABLE' };
        });
        return reset;
      });
      addLog('SUCCESS', 'SANDBOX RESET: Reset all local seats to AVAILABLE.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SIMULATION loop daemon
  // ─────────────────────────────────────────────────────────────────────────────
  const simulateExternalLock = useCallback(() => {
    const currentSeats = seatsRef.current;
    const activeAlloc = activeAllocationRef.current;
    const availableSeats = Object.values(currentSeats).filter(
      (s) => s.status === 'AVAILABLE' && (!activeAlloc || activeAlloc.seatLabel !== (s.row + s.number))
    );

    if (availableSeats.length === 0) return;

    const randomSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
    const seatKey = randomSeat.row + randomSeat.number;
    const isLockOnly = Math.random() > 0.4;
    const actionStatus: SeatStatus = isLockOnly ? 'LOCKED' : 'BOOKED';
    const userId = Math.floor(Math.random() * 200) + 700;

    setSeats((prev) => ({
      ...prev,
      [seatKey]: { ...prev[seatKey], status: actionStatus },
    }));

    if (actionStatus === 'LOCKED') {
      addLog('CONFLICT', `CONCURRENT LOCK: External user (Client-${userId}) leased Seat ${seatKey} in background.`);
      // Auto-reclaim locks after 15s
      setTimeout(() => {
        setSeats((prev) => {
          if (prev[seatKey]?.status === 'LOCKED') {
            addLog('SYSTEM', `LEASE RECLAIMED: Background lease for Seat ${seatKey} expired. Released.`);
            return {
              ...prev,
              [seatKey]: { ...prev[seatKey], status: 'AVAILABLE' },
            };
          }
          return prev;
        });
      }, 15000);
    } else {
      addLog('SUCCESS', `EXTERNAL BOOKING: Finalized permanent ticket transaction for Seat ${seatKey} by Client-${userId}.`);
    }
  }, [addLog]);

  // Initial Sync
  useEffect(() => {
    syncLiveInventory(true);
  }, []);

  // Real-time Inventory Polling Daemon (Runs every 4 seconds when ONLINE / Token is present)
  useEffect(() => {
    if (!authToken) return;

    const interval = setInterval(() => {
      // Don't poll if payment is processing or active order is being verified
      if (activeAllocationRef.current && activeAllocationRef.current.status === 'VERIFYING') return;
      
      syncLiveInventory(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [authToken, syncLiveInventory]);

  return (
    <AppContext.Provider
      value={{
        authToken,
        currentShowId,
        seats,
        activeAllocation,
        connectionStatus,
        latency,
        logs,
        isRefreshing,
        login,
        loginWithGoogle,
        register,
        logout,
        setCurrentShowId,
        syncLiveInventory,
        selectSeat,
        clearActiveAllocation,
        setActiveAllocation,
        addLog,
        clearLogs,
        flushDatabase,
        simulateExternalLock,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
