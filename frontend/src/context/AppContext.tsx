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
  isVerified: boolean;
  currentShowId: number;
  currentEventId: string | null;
  seats: Record<string, Seat>;
  activeAllocation: AllocationManifest | null;
  connectionStatus: 'ONLINE' | 'OFFLINE' | 'SIMULATED';
  latency: number | null;
  logs: ConsoleLogEntry[];
  isRefreshing: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  loginWithGoogle: (googleCredentialToken: string) => Promise<boolean>;
  register: (fullName: string, email: string, password?: string, phoneNumber?: string, verificationMethod?: string) => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
  resendOtp: (method?: string) => Promise<boolean>;
  logout: () => void;
  setCurrentShowId: (showId: number, eventId?: string) => void;
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
  const [isVerified, setIsVerified] = useState<boolean>(true);
  const [currentShowId, setCurrentShowIdState] = useState<number>(1);
  const [currentEventId, setCurrentEventIdState] = useState<string | null>(null);
  const [seats, setSeats] = useState<Record<string, Seat>>({});
  const [activeAllocation, setActiveAllocation] = useState<AllocationManifest | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'ONLINE' | 'OFFLINE' | 'SIMULATED'>('SIMULATED');
  const [latency, setLatency] = useState<number | null>(null);
  const [logs, setLogs] = useState<ConsoleLogEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [seatsPerEvent, setSeatsPerEvent] = useState<Record<string, Record<string, Seat>>>({});

  // Keep references for callbacks to prevent closure stale states
  const authTokenRef = useRef(authToken);
  const currentShowIdRef = useRef(currentShowId);
  const currentEventIdRef = useRef(currentEventId);
  const seatsRef = useRef(seats);
  const seatsPerEventRef = useRef(seatsPerEvent);
  const activeAllocationRef = useRef(activeAllocation);

  useEffect(() => { authTokenRef.current = authToken; }, [authToken]);
  useEffect(() => { currentShowIdRef.current = currentShowId; }, [currentShowId]);
  useEffect(() => { currentEventIdRef.current = currentEventId; }, [currentEventId]);
  useEffect(() => { seatsRef.current = seats; }, [seats]);
  useEffect(() => { seatsPerEventRef.current = seatsPerEvent; }, [seatsPerEvent]);
  useEffect(() => { activeAllocationRef.current = activeAllocation; }, [activeAllocation]);

  // Load token and activeAllocation from storage on mount (for persistent dev ease)
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedVerified = localStorage.getItem('isVerified');
    if (savedVerified) {
      setIsVerified(savedVerified === 'true');
    }
    if (savedToken) {
      setAuthToken(savedToken);
      authTokenRef.current = savedToken; // Update ref immediately to prevent race conditions during initial sync
      setConnectionStatus('ONLINE');
      addLog('SYSTEM', 'RESTORED SESSION: Session token loaded from localStorage.');
    }
    const savedAlloc = sessionStorage.getItem('activeAllocation');
    if (savedAlloc) {
      try {
        const parsed = JSON.parse(savedAlloc);
        setActiveAllocation(parsed);
        activeAllocationRef.current = parsed;
        addLog('SYSTEM', 'RESTORED LEASE: Active allocation loaded from sessionStorage.');
      } catch (e) {
        console.error("Failed to parse activeAllocation from sessionStorage", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save activeAllocation to sessionStorage when it changes
  useEffect(() => {
    if (activeAllocation) {
      sessionStorage.setItem('activeAllocation', JSON.stringify(activeAllocation));
    } else {
      sessionStorage.removeItem('activeAllocation');
    }
  }, [activeAllocation]);


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
        
        const isUserVerified = data.isVerified ?? true;
        setIsVerified(isUserVerified);
        localStorage.setItem('isVerified', isUserVerified ? 'true' : 'false');
        
        localStorage.setItem('userEmail', data.email || email);
        localStorage.setItem('userName', data.fullName || '');
        localStorage.setItem('userPhone', data.phoneNumber || '');
        localStorage.setItem('verificationMethod', data.verificationMethod || 'EMAIL');
        
        setConnectionStatus('ONLINE');
        if (!isUserVerified) {
          addLog('SYSTEM', 'AUTH WARNING: Account is unverified. OTP verification required.');
        } else {
          addLog('SUCCESS', 'AUTH RESOLVED: Access token captured. Gateway ONLINE.');
        }
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
      setIsVerified(true);
      localStorage.setItem('isVerified', 'true');
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
      const response = await fetch('http://localhost:8080/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName }),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.accessToken;
        setAuthToken(token);
        localStorage.setItem('authToken', token);
        setIsVerified(true);
        localStorage.setItem('isVerified', 'true');
        setConnectionStatus('ONLINE');
        addLog('SUCCESS', 'AUTH RESOLVED (GOOGLE): Google account synced and stored in relational database.');
        return true;
      }
      throw new Error('Google registration handshake failed');
    } catch {
      const simulatedToken = `google-token-${btoa(email)}`;
      setAuthToken(simulatedToken);
      localStorage.setItem('authToken', simulatedToken);
      setIsVerified(true);
      localStorage.setItem('isVerified', 'true');
      setConnectionStatus('SIMULATED');
      addLog('SUCCESS', `AUTH RESOLVED (GOOGLE): Secure token received for ${email}. (SIMULATED mode)`);
      return true;
    }
  };

  const register = async (
    fullName: string, 
    email: string, 
    password?: string, 
    phoneNumber?: string, 
    verificationMethod?: string
  ): Promise<boolean> => {
    addLog('SYSTEM', `REGISTER REQUEST: Registering account for ${fullName} (${email})...`);
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, phoneNumber, verificationMethod }),
      });
      if (response.ok) {
        const data = await response.json();
        const token = data.accessToken;
        setAuthToken(token);
        localStorage.setItem('authToken', token);
        
        setIsVerified(false);
        localStorage.setItem('isVerified', 'false');
        
        localStorage.setItem('userEmail', data.email || email);
        localStorage.setItem('userName', data.fullName || fullName);
        localStorage.setItem('userPhone', data.phoneNumber || phoneNumber || '');
        localStorage.setItem('verificationMethod', data.verificationMethod || verificationMethod || 'EMAIL');
        
        setConnectionStatus('ONLINE');
        addLog('SUCCESS', 'REGISTRATION SUCCESS: Account provisioned. OTP verification required.');
        return true;
      } else {
        addLog('ERROR', `REGISTRATION REFUSED: Relational gateway returned status ${response.status}. Account exists or validation failed.`);
        return false;
      }
    } catch {
      addLog('ERROR', 'REGISTRATION FAILBACK: Relational gateway offline. Activating local simulated user...');
      const simulatedToken = `simulated-token-${btoa(email)}`;
      setAuthToken(simulatedToken);
      localStorage.setItem('authToken', simulatedToken);
      setIsVerified(true);
      localStorage.setItem('isVerified', 'true');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', fullName);
      localStorage.setItem('userPhone', phoneNumber || '');
      localStorage.setItem('verificationMethod', 'EMAIL');
      setConnectionStatus('SIMULATED');
      addLog('SUCCESS', 'AUTH RESOLVED: Sandbox user registered and logged in.');
      return true;
    }
  };

  const verifyOtp = async (otp: string): Promise<boolean> => {
    const email = localStorage.getItem('userEmail');
    if (!email) {
      addLog('ERROR', 'OTP VERIFY FAILED: No active user session email resolved.');
      return false;
    }
    addLog('SYSTEM', `OTP SUBMITTING: Dispatching verification code ${otp} for ${email}...`);
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      if (response.ok) {
        setIsVerified(true);
        localStorage.setItem('isVerified', 'true');
        addLog('SUCCESS', 'OTP SUCCESS: Code validated! Account has been unlocked.');
        return true;
      } else {
        const data = await response.json();
        addLog('ERROR', `OTP REFUSED: verification failed: ${data.error || 'Invalid code'}`);
        return false;
      }
    } catch {
      addLog('SUCCESS', 'OTP SUCCESS (SIMULATED): Simulated validation. Account unlocked.');
      setIsVerified(true);
      localStorage.setItem('isVerified', 'true');
      return true;
    }
  };

  const resendOtp = async (method?: string): Promise<boolean> => {
    const email = localStorage.getItem('userEmail');
    if (!email) return false;
    const activeMethod = method || localStorage.getItem('verificationMethod') || 'EMAIL';
    addLog('SYSTEM', `OTP RESENDING: Requesting new code via ${activeMethod}...`);
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verificationMethod: activeMethod }),
      });
      if (response.ok) {
        localStorage.setItem('verificationMethod', activeMethod);
        addLog('SUCCESS', `OTP RESENT: A fresh verification code has been dispatched via ${activeMethod}.`);
        return true;
      }
      return false;
    } catch {
      addLog('SUCCESS', `OTP RESENT (SIMULATED): A simulated verification code was sent via ${activeMethod}.`);
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
    const showId = currentShowIdRef.current;
    
    let venueName = "";
    let eventTitle = "";
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('currentEvent');
        if (stored) {
          const parsed = JSON.parse(stored);
          venueName = parsed.venue || "";
          eventTitle = parsed.title || "";
        }
      } catch (e) {
        console.error("Failed to parse currentEvent", e);
      }
    }

    const lowerVenue = venueName.toLowerCase();
    const lowerTitle = eventTitle.toLowerCase();

    // Dynamic venue configs (stadium vs sphere vs comedy club)
    let rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']; // 10 rows standard
    let colsCount = 20; // 20 columns standard
    
    if (lowerVenue.includes('sphere')) {
      // Las Vegas Sphere Premium Seating Configuration
      rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']; // 12 rows
      colsCount = 15; // 15 columns
    } else if (
      lowerVenue.includes('sofi') || 
      lowerVenue.includes('stadium') || 
      lowerVenue.includes('field') || 
      lowerVenue.includes('modi') || 
      lowerVenue.includes('wankhede') || 
      lowerTitle.includes('world cup')
    ) {
      // Large Arena / Stadium Configuration (e.g. Narendra Modi, SoFi, Lumen Field)
      rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N']; // 14 rows
      colsCount = 24; // 24 columns
    } else if (lowerVenue.includes('theater') || lowerVenue.includes('comedy') || lowerVenue.includes('club')) {
      // Intimate comedy theater seating configuration
      rows = ['A', 'B', 'C', 'D', 'E', 'F']; // 6 rows
      colsCount = 12; // 12 columns
    } else {
      // Show ID fallback
      if (showId === 1) {
        rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N']; // 14 rows
        colsCount = 24;
      } else if (showId === 2) {
        rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']; // 12 rows
        colsCount = 15;
      } else if (showId === 3) {
        rows = ['A', 'B', 'C', 'D', 'E', 'F']; // 6 rows
        colsCount = 12;
      }
    }
    
    const seededBooked = new Set<string>();
    
    // Deterministic seeded booked seats that differ significantly per showId and venue hash
    const seedVal = showId + venueName.length + eventTitle.length;
    rows.forEach((row, rowIndex) => {
      for (let col = 1; col <= colsCount; col++) {
        // Hash formula generates completely unique seat layouts for each show ID and venue combination
        const hash = (rowIndex * 7 + col * 13 + seedVal * 31) % 10;
        if (hash === 0 || hash === 3) {
          seededBooked.add(`${row}${col}`);
        }
      }
    });

    let idCounter = showId === 1 ? 1 : (showId === 2 ? 337 : 517);
    rows.forEach((row) => {
      for (let col = 1; col <= colsCount; col++) {
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
    const eventId = currentEventIdRef.current;


    
    // Build headers - include Bearer auth if logged in (only send real tokens to live backend)
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    const token = authTokenRef.current;
    const isSimulatedToken = token?.startsWith('simulated-token-') || token?.startsWith('google-token-');
    if (token && !isSimulatedToken) {
      headers['Authorization'] = `Bearer ${token}`;
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
        // Generate the correctly-dimensioned layout for this specific venue
        const fetchedSeats: Record<string, Seat> = generateInitialLocalSeats();

        // Overlay status info from database records onto matching coordinates
        data.forEach((s: any) => {
          const seatLabel = s.seatNumber;
          if (seatLabel && fetchedSeats[seatLabel]) {
            fetchedSeats[seatLabel].status = s.status as SeatStatus;
            fetchedSeats[seatLabel].id = String(s.id);
            (fetchedSeats[seatLabel] as any).isReal = true;
          }
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
        if ((response.status === 403 || response.status === 401) && authTokenRef.current && !isSimulatedToken) {
          setAuthToken(null);
          localStorage.removeItem('authToken');
          setSeats(generateInitialLocalSeats());
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

  const setCurrentShowId = (showId: number, eventId?: string) => {
    // Save current seats before switching
    const prevEventId = currentEventIdRef.current;
    const prevShowId = currentShowIdRef.current;
    if (prevEventId) {
      const key = `${prevEventId}_${prevShowId}`;
      setSeatsPerEvent((prev) => ({
        ...prev,
        [key]: seatsRef.current,
      }));
    }

    setCurrentShowIdState(showId);
    currentShowIdRef.current = showId;
    
    const nextEventId = eventId || prevEventId;
    if (eventId) {
      setCurrentEventIdState(eventId);
      currentEventIdRef.current = eventId;
    }
    
    // Clear active allocation if it belongs to a different show or a different event to prevent seat selection bleed
    if (
      activeAllocationRef.current && 
      (activeAllocationRef.current.showId !== showId || (eventId && prevEventId !== eventId))
    ) {
      setActiveAllocation(null);
      activeAllocationRef.current = null;
    }

    // Try loading saved seats for the new event & show
    if (nextEventId) {
      const newKey = `${nextEventId}_${showId}`;
      const savedSeats = seatsPerEventRef.current[newKey];
      if (savedSeats && Object.keys(savedSeats).length > 0) {
        setSeats(savedSeats);
      } else {
        setSeats({}); // Re-generate/Sync fresh
      }
    } else {
      setSeats({});
    }
    
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
        setSeats((prev) => {
          const next = {
            ...prev,
            [seatId]: { ...prev[seatId], status: 'AVAILABLE' as SeatStatus }
          };
          const eventId = currentEventIdRef.current;
          const showId = currentShowIdRef.current;
          if (eventId) {
            const key = `${eventId}_${showId}`;
            setSeatsPerEvent((prevMap) => ({
              ...prevMap,
              [key]: next
            }));
          }
          return next;
        });

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

    const token = authTokenRef.current;
    const isSimulatedToken = token?.startsWith('simulated-token-') || token?.startsWith('google-token-');
    const showId = currentShowIdRef.current;

    const isLiveSeat = (seat as any).isReal && connectionStatus === 'ONLINE' && !isSimulatedToken;

    if (!isLiveSeat) {
      // Step 2: Optimistic UI update (Amber) and update local cache
      setSeats((prev) => {
        const next = {
          ...prev,
          [seatId]: { ...prev[seatId], status: 'LOCKED' as SeatStatus },
        };
        const eventId = currentEventIdRef.current;
        if (eventId) {
          const key = `${eventId}_${showId}`;
          setSeatsPerEvent((prevMap) => ({
            ...prevMap,
            [key]: next,
          }));
        }
        return next;
      });
      
      // Simulate lock locally and return immediately
      const data = { bookingId: `sim-booking-${showId}-${seat.id}-${Math.random().toString(36).substring(2, 7)}` };
      
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
      addLog('SUCCESS', `LEASE CAPTURED (SANDBOX): Seat ${seatId} locked. Booking ID: ${data.bookingId.substring(0, 8)}...`);
      return;
    }



    // Step 2: Optimistic UI update (Amber)
    setSeats((prev) => ({
      ...prev,
      [seatId]: { ...prev[seatId], status: 'LOCKED' },
    }));
    addLog('INGRESS', `LEASE ACQUIRING: Dispatching fast-path lock handshake for Seat ${seatId}...`);

    try {
      const showId = currentShowIdRef.current;
      
      let eventTitle = '';
      let venue = '';
      let startTime = '';
      let eventImage = '';
      try {
        const stored = sessionStorage.getItem('currentEvent');
        if (stored) {
          const parsed = JSON.parse(stored);
          eventTitle = parsed.title || '';
          venue = parsed.venue ? `${parsed.venue}, ${parsed.city || ''}` : '';
          eventImage = parsed.image || '';
          
          const eventDate = parsed.date || '';
          const eventTime = parsed.time || '';
          startTime = eventDate && eventTime ? `${eventDate} • ${eventTime}` : (eventDate || eventTime || '');
        }
      } catch (e) {
        console.error("Failed to parse currentEvent:", e);
      }

      const eventTitleWithImage = eventTitle + ":::imageURL:::" + eventImage;
      const response = await fetch(`http://localhost:8080/api/v1/reservations/show/${showId}/seat/${seat.id}?eventTitle=${encodeURIComponent(eventTitleWithImage)}&venue=${encodeURIComponent(venue)}&startTime=${encodeURIComponent(startTime)}`, {
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
            next[lbl] = { ...next[lbl], status: 'BOOKED' };
          }
        });
        
        // Also update seatsPerEvent cache!
        const eventId = currentEventIdRef.current;
        const showId = currentShowIdRef.current;
        if (eventId) {
          const key = `${eventId}_${showId}`;
          setSeatsPerEvent((prevMap) => ({
            ...prevMap,
            [key]: next
          }));
        }
        
        return next;
      });
      addLog('INFO', `LEASE RELEASED: finalized transactions. Seats ${labels.join(', ')} confirmed and BOOKED.`);
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
    if (isInitialized) {
      syncLiveInventory(true);
    }
  }, [isInitialized]);

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
        isVerified,
        currentShowId,
        currentEventId,
        seats,
        activeAllocation,
        connectionStatus,
        latency,
        logs,
        isRefreshing,
        login,
        loginWithGoogle,
        register,
        verifyOtp,
        resendOtp,
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
