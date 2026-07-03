import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, ReactNode } from 'react';
import api from './api';
import { playBeep, playAlert, playWarning } from './sound';

export interface Room {
  id: number; number: string; backendId?: string;
  status: 'available' | 'busy' | 'reserved' | 'maintenance';
  type: string; games: string[]; reservedTime?: string;
  session?: SessionData | null;
}

export interface TimeSegment {
  mode: 'single' | 'multi'; rate: number; startTime: string; endTime?: string | null;
}

export interface SessionData {
  backendId?: string;
  startTime: Date; mode: 'single' | 'multi'; duration: number | null;
  rate: number; orders: OrderItem[];
  timeSegments: TimeSegment[]; paused: boolean; pausedTime: number; pauseStartTime?: Date;
}

export interface OrderItem { name: string; price: number; quantity: number; }
export interface MenuItem { id: number; name: string; price: number; icon: string; }

export interface ReceiptData {
  id: string; deviceName: string; deviceType: string;
  startTime: string; endTime: string; totalDuration: string;
  modeEntries: { mode: string; duration: string; charge: number }[];
  orderItems: { name: string; price: number; quantity: number; total: number }[];
  timeCharge: number; ordersTotal: number; grandTotal: number;
  paymentMethod: string;
  createdAt: string;
}

export interface AppSettings {
  pricing: { ps4: { single: number; multi: number }; ps5: { single: number; multi: number } };
  menuItems: MenuItem[];
  games: string[];
}

export interface AlertNotification {
  id: string; roomNumber: string; message: string; type: 'warning' | 'alert';
}

interface PlayZoneState {
  rooms: Room[]; receipts: ReceiptData[]; todayRevenue: number;
  settings: AppSettings;
  currentRoom: Room | null; activePage: string;
  selectedSessionType: 'timed' | 'open'; selectedMode: 'single' | 'multi'; selectedPayment: string;
  showStartModal: boolean; showActiveModal: boolean; showInvoiceModal: boolean;
  showAddDeviceModal: boolean; showEditDeviceModal: boolean; editingDevice: Room | null;
  showAddMenuItemModal: boolean; showReceiptDetail: ReceiptData | null;
  editingMenuItem: MenuItem | null;
  loading: boolean;
  setActivePage: (p: string) => void;
  setCurrentRoom: (r: Room | null) => void;
  setSelectedSessionType: (t: 'timed' | 'open') => void;
  setSelectedMode: (m: 'single' | 'multi') => void;
  setSelectedPayment: (p: string) => void;
  setShowStartModal: (s: boolean) => void;
  setShowActiveModal: (s: boolean) => void;
  setShowInvoiceModal: (s: boolean) => void;
  setShowAddDeviceModal: (s: boolean) => void;
  setShowEditDeviceModal: (s: boolean) => void;
  setEditingDevice: (r: Room | null) => void;
  setShowAddMenuItemModal: (s: boolean) => void;
  setEditingMenuItem: (item: MenuItem | null) => void;
  setShowReceiptDetail: (r: ReceiptData | null) => void;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  invoiceDataRef: React.MutableRefObject<any>;
  handleRoomClick: (roomId: number) => void;
  startSession: (duration: number | null) => Promise<void>;
  switchMode: (newMode: 'single' | 'multi') => void;
  addOrder: (name: string, price: number, quantity?: number) => void;
  removeOrder: (index: number) => void;
  pauseSession: () => void;
  endSession: () => void;
  confirmPayment: () => Promise<void>;
  addDevice: (number: string, type: string, games: string[]) => Promise<void>;
  toggleMaintenance: (roomId: number) => Promise<void>;
  deleteDevice: (roomId: number) => Promise<void>;
  updateDevice: (roomId: number, number: string, type: string, games: string[]) => Promise<void>;
  addMenuItem: (name: string, price: number, icon: string) => void;
  updateMenuItem: (id: number, name: string, price: number, icon: string) => void;
  removeMenuItem: (id: number) => void;
  saveSettings: () => Promise<void>;
  loadReceipts: (year: number, month: number, day?: number) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
  deleteAllReceipts: (year?: number, month?: number) => Promise<void>;
  notifications: AlertNotification[];
  dismissNotification: (id: string) => void;
}

const PlayZoneContext = createContext<PlayZoneState | null>(null);
export const usePlayZone = () => useContext(PlayZoneContext)!;

const FA_ICONS = [
  { label: 'مشروبات', group: true },
  { value: 'fa-solid fa-glass-whiskey', label: 'كأس' },
  { value: 'fa-solid fa-wine-bottle', label: 'زجاجة' },
  { value: 'fa-solid fa-mug-hot', label: 'مشروب ساخن' },
  { value: 'fa-solid fa-tint', label: 'ماء' },
  { value: 'fa-solid fa-juice-box', label: 'عصير' },
  { value: 'fa-solid fa-coffee', label: 'قهوة' },
  { value: 'fa-solid fa-martini-glass', label: 'كوكتيل' },
  { label: 'طعام', group: true },
  { value: 'fa-solid fa-hamburger', label: 'برجر' },
  { value: 'fa-solid fa-pizza-slice', label: 'بيتزا' },
  { value: 'fa-solid fa-hotdog', label: 'هوت دوج' },
  { value: 'fa-solid fa-cookie-bite', label: 'شيبس' },
  { value: 'fa-solid fa-bowl-food', label: 'وجبة' },
  { value: 'fa-solid fa-fish', label: 'سمك' },
  { value: 'fa-solid fa-drumstick-bite', label: 'دجاج' },
  { label: 'أخرى', group: true },
  { value: 'fa-solid fa-utensils', label: 'أدوات مائدة' },
  { value: 'fa-solid fa-candy', label: 'حلوى' },
  { value: 'fa-solid fa-ice-cream', label: 'آيس كريم' },
];

function parseMenuItems(json: string): MenuItem[] {
  try { return JSON.parse(json); } catch { return []; }
}

export function parseUTCDate(dateVal: any): Date {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date) return dateVal;
  if (typeof dateVal === 'string') {
    if (!dateVal.endsWith('Z') && !dateVal.includes('+') && !/-\d{2}:\d{2}$/.test(dateVal)) {
      const normalized = dateVal.includes('T') ? dateVal : dateVal.replace(' ', 'T');
      return new Date(normalized + 'Z');
    }
  }
  return new Date(dateVal);
}

export function PlayZoneProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [settings, setSettings] = useState<AppSettings>({
    pricing: { ps4: { single: 30, multi: 50 }, ps5: { single: 40, multi: 60 } },
    menuItems: [],
    games: [],
  });
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedSessionType, setSelectedSessionType] = useState<'timed' | 'open'>('timed');
  const [selectedMode, setSelectedMode] = useState<'single' | 'multi'>('single');
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [showStartModal, setShowStartModal] = useState(false);
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [showEditDeviceModal, setShowEditDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Room | null>(null);
  const [showAddMenuItemModal, setShowAddMenuItemModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [showReceiptDetail, setShowReceiptDetail] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const warnedRef = useRef<Set<string>>(new Set());

  const timersRef = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());
  const invoiceDataRef = useRef<any>(null);

  const mapMode = (m: string): 'single' | 'multi' => m === 'Multi' ? 'multi' : 'single';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [devRes, priceRes, todayRes, settingsRes, sessionsRes] = await Promise.all([
        api.get('/devices').catch(() => ({ data: [] })),
        api.get('/priceconfig').catch(() => ({ data: [] })),
        api.get('/receipts/today').catch(() => ({ data: { totalRevenue: 0 } })),
        api.get('/settings').catch(() => ({ data: {} })),
        api.get('/sessions/active').catch(() => ({ data: [] })),
      ]);

      const devices: any[] = devRes.data;
      const prices: any[] = priceRes.data;
      const siteSettings: Record<string, string> = settingsRes.data;
      const activeSessions: any[] = sessionsRes.data;

      setTodayRevenue(todayRes.data.totalRevenue || 0);

      const priceMap: Record<string, number> = {};
      prices.forEach((p: any) => {
        priceMap[`${p.deviceType}_${p.mode}`] = p.pricePerHour;
      });
      const ps4Single = priceMap['PS4_Single'] || 30;
      const ps4Multi = priceMap['PS4_Multi'] || 50;
      const ps5Single = priceMap['PS5_Single'] || 40;
      const ps5Multi = priceMap['PS5_Multi'] || 60;

      const gamesList: string[] = siteSettings.games
        ? siteSettings.games.split(',').map(g => g.trim()).filter(g => g)
        : [];
      const menuItems: MenuItem[] = siteSettings.menuItems
        ? parseMenuItems(siteSettings.menuItems)
        : [];

      setSettings({
        pricing: { ps4: { single: ps4Single, multi: ps4Multi }, ps5: { single: ps5Single, multi: ps5Multi } },
        games: gamesList,
        menuItems,
      });

      const mappedRooms: Room[] = devices.map((d: any, i: number) => ({
        id: i + 1,
        backendId: d.id,
        number: d.name.replace(/[^0-9]/g, '') || String(i + 1),
        status: d.status === 'InUse' ? 'busy' : d.status === 'Maintenance' ? 'maintenance' : 'available',
        type: d.type,
        games: d.games ? d.games.split(',').map((g: string) => g.trim()).filter((g: string) => g) : [],
        session: null,
      }));

      // Restore active sessions
      activeSessions.forEach((as: any) => {
        const room = mappedRooms.find(r => r.backendId === as.deviceId);
        if (!room) return;
        const modeLogs: any[] = as.modeLogs || [];
        const lastLog = modeLogs.length > 0 ? modeLogs[modeLogs.length - 1] : null;
        const orders: any[] = as.orderItems || [];

        const timeSegments: TimeSegment[] = modeLogs.map((log: any) => {
          const isPs5 = room.type.toLowerCase() === 'ps5';
          const mode = mapMode(log.mode);
          const rate = isPs5
            ? (mode === 'single' ? ps5Single : ps5Multi)
            : (mode === 'single' ? ps4Single : ps4Multi);
          return { mode, rate, startTime: log.startTime, endTime: log.endTime };
        });

        room.status = 'busy';
        const isPaused = as.isPaused || false;
        let pausedTime = as.pausedTimeMs || 0;
        let restoredPauseStartTime: Date | undefined;
        if (isPaused && as.pauseStartedAt) {
          const serverPauseStart = parseUTCDate(as.pauseStartedAt);
          pausedTime += Math.max(0, Date.now() - serverPauseStart.getTime());
          restoredPauseStartTime = new Date();
        } else if (isPaused) {
          restoredPauseStartTime = new Date();
        }
        room.session = {
          backendId: as.id,
          startTime: parseUTCDate(as.startTime),
          mode: lastLog ? mapMode(lastLog.mode) : 'single',
          duration: as.durationMinutes ? as.durationMinutes / 60 : null,
          rate: timeSegments.length > 0 ? timeSegments[timeSegments.length - 1].rate : 30,
          orders: orders.map((o: any) => ({ name: o.name, price: o.price, quantity: o.quantity })),
          timeSegments,
          paused: isPaused,
          pausedTime,
          pauseStartTime: restoredPauseStartTime,
        };
      });

      setRooms(mappedRooms);

      // Start timers for busy rooms + suppress duplicate alerts if time already critical
      warnedRef.current.clear();
      mappedRooms.filter(r => r.status === 'busy' && r.session).forEach(r => {
        if (r.session && r.session.duration) {
          const elapsed = Date.now() - r.session.startTime.getTime() - r.session.pausedTime;
          const remaining = r.session.duration * 3600000 - elapsed;
          if (remaining <= 0) warnedRef.current.add(`${r.id}_0min`);
          else if (remaining <= 60000) warnedRef.current.add(`${r.id}_1min`);
          else if (remaining <= 300000) warnedRef.current.add(`${r.id}_5min`);
        }
        startTimer(r.id);
      });
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteReceipt = useCallback(async (id: string) => {
    try { await api.delete(`/receipts/${id}`); }
    catch { /* ignore */ }
  }, []);

  const deleteAllReceipts = useCallback(async (year?: number, month?: number) => {
    try {
      const params: Record<string, any> = {};
      if (year) params.year = year;
      if (month) params.month = month;
      await api.delete('/receipts', { params });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const loadReceipts = useCallback(async (year: number, month: number, day?: number) => {
    try {
      const params: Record<string, any> = { year, month };
      if (day) params.day = day;
      const res = await api.get('/receipts/by-date', { params });
      setReceipts(res.data);
    } catch { setReceipts([]); }
  }, []);

  const openModal = (setter: (s: boolean) => void) => {
    setter(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModalAction = (setter: (s: boolean) => void) => {
    setter(false);
    document.body.style.overflow = 'auto';
  };

  const handleRoomClick = (roomId: number) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    if (room.status === 'available') {
      setCurrentRoom(room);
      setSelectedSessionType('timed');
      setSelectedMode('single');
      openModal(setShowStartModal);
    } else if (room.status === 'busy') {
      setCurrentRoom(room);
      openModal(setShowActiveModal);
    }
  };

  const startTimer = (roomId: number) => {
    const existing = timersRef.current.get(roomId);
    if (existing) clearInterval(existing);
    const interval = setInterval(() => {
      setRooms(prev => {
        const room = prev.find(r => r.id === roomId);
        if (!room?.session) return prev;
        const now = room.session.paused && room.session.pauseStartTime ? room.session.pauseStartTime.getTime() : Date.now();
        const elapsed = now - room.session.startTime.getTime() - room.session.pausedTime;
        const h = Math.floor(elapsed / 3600000);
        const m = Math.floor((elapsed % 3600000) / 60000);
        const s = Math.floor((elapsed % 60000) / 1000);
        const el = document.getElementById(`timer-${room.id}`);
        if (el) el.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        if (room.session.duration && !room.session.paused) {
          const remaining = room.session.duration * 3600000 - elapsed;
          const pct = Math.max(0, (remaining / (room.session.duration * 3600000)) * 100);
          const rel = document.getElementById(`remaining-${room.id}`);
          if (rel) {
            if (remaining > 0) {
              const rh = Math.floor(remaining / 3600000);
              const rm = Math.floor((remaining % 3600000) / 60000);
              const rs = Math.floor((remaining % 60000) / 1000);
              rel.textContent = `⏳ ${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}:${String(rs).padStart(2, '0')}`;
              rel.style.color = pct > 25 ? '#10b981' : pct > 10 ? '#f97316' : '#ef4444';
            } else {
              rel.textContent = '⏰ انتهى الوقت'; rel.style.color = '#ef4444';
              if (!warnedRef.current.has(`${roomId}_0min`)) {
                warnedRef.current.add(`${roomId}_0min`);
                playAlert();
                addNotif(room.number, '⏰ انتهى الوقت!', 'alert');
              }
            }
          }
          // update circular progress
          const circle = document.getElementById(`circle-progress-${room.id}`);
          if (circle) {
            const circumference = 2 * Math.PI * 36;
            const offset = circumference * (1 - pct / 100);
            circle.style.strokeDashoffset = String(offset);
            circle.style.stroke = pct > 50 ? '#10b981' : pct > 25 ? '#f59e0b' : pct > 10 ? '#f97316' : '#ef4444';
          }
          const ct = document.getElementById(`circle-text-${room.id}`);
          if (ct) ct.textContent = `${Math.round(pct)}%`;

          // alerts (only when not paused)
          if (remaining <= 0 && !warnedRef.current.has(`${roomId}_0min`)) {
            warnedRef.current.add(`${roomId}_0min`);
            playAlert();
            addNotif(room.number, '⏰ انتهى الوقت!', 'alert');
          } else if (remaining > 0 && remaining <= 60000 && !warnedRef.current.has(`${roomId}_1min`)) {
            warnedRef.current.add(`${roomId}_1min`);
            playBeep();
            addNotif(room.number, '⚠️ تبقت دقيقة واحدة!', 'warning');
          } else if (remaining > 0 && remaining <= 300000 && !warnedRef.current.has(`${roomId}_5min`)) {
            warnedRef.current.add(`${roomId}_5min`);
            playWarning();
            addNotif(room.number, '⚠️ تبقى ٥ دقائق', 'warning');
          }
        }
        return prev;
      });
    }, 1000);
    timersRef.current.set(roomId, interval);
  };

  const startSession = async (duration: number | null) => {
    if (!currentRoom) return;
    const rate = settings.pricing[currentRoom.type.toLowerCase() as 'ps4' | 'ps5'][selectedMode];
    const mode = selectedMode;

    try {
      const res = await api.post('/sessions/start', {
        deviceId: currentRoom.backendId,
        mode: mode === 'single' ? 'Single' : 'Multi',
        isOpenTime: duration === null,
        durationMinutes: duration ? Math.round(duration * 60) : null,
      });
      const backendSessionId = res.data?.id;
      const serverStartTime = res.data?.startTime ? parseUTCDate(res.data.startTime) : new Date();

      const updatedRoom: Room = {
        ...currentRoom, status: 'busy',
        session: {
          backendId: backendSessionId,
          startTime: serverStartTime, mode, duration, rate,
          orders: [],
          timeSegments: [{ mode, rate, startTime: new Date().toISOString(), endTime: null }],
          paused: false, pausedTime: 0,
        }
      };
      setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
      setCurrentRoom(updatedRoom);
      closeModalAction(setShowStartModal);
      startTimer(updatedRoom.id);
    } catch {
      const updatedRoom: Room = {
        ...currentRoom, status: 'busy',
        session: {
          startTime: new Date(), mode, duration, rate,
          orders: [],
          timeSegments: [{ mode, rate, startTime: new Date().toISOString(), endTime: null }],
          paused: false, pausedTime: 0,
        }
      };
      setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
      setCurrentRoom(updatedRoom);
      closeModalAction(setShowStartModal);
      startTimer(updatedRoom.id);
    }
  };

  const switchMode = (newMode: 'single' | 'multi') => {
    if (!currentRoom?.session) return;
    if (newMode === currentRoom.session.mode) return;
    const updatedRoom = { ...currentRoom, session: { ...currentRoom.session, timeSegments: [...currentRoom.session.timeSegments], orders: [...currentRoom.session.orders] } };
    if (!updatedRoom.session) return;
    const segs = updatedRoom.session.timeSegments;
    segs[segs.length - 1] = { ...segs[segs.length - 1], endTime: new Date().toISOString() };
    const newRate = settings.pricing[updatedRoom.type.toLowerCase() as 'ps4' | 'ps5'][newMode];
    segs.push({ mode: newMode, rate: newRate, startTime: new Date().toISOString(), endTime: null });
    updatedRoom.session.mode = newMode;
    updatedRoom.session.rate = newRate;

    if (updatedRoom.session.backendId) {
      api.post(`/sessions/${updatedRoom.session.backendId}/switch-mode`, { newMode }).catch(() => {});
    }

    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
    setCurrentRoom(updatedRoom);
  };

  const addOrder = (name: string, price: number, quantity: number = 1) => {
    if (!currentRoom?.session) return;
    const updatedRoom = { ...currentRoom, session: { ...currentRoom.session, timeSegments: [...currentRoom.session.timeSegments], orders: [...currentRoom.session.orders] } };
    const existing = updatedRoom.session!.orders.find(o => o.name === name);
    if (existing) existing.quantity += quantity;
    else updatedRoom.session!.orders.push({ name, price, quantity });

    if (updatedRoom.session.backendId) {
      api.post(`/sessions/${updatedRoom.session.backendId}/add-order`, { name, price, quantity }).catch(() => {});
    }

    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
    setCurrentRoom(updatedRoom);
  };

  const removeOrder = (index: number) => {
    if (!currentRoom?.session) return;
    const updatedRoom = { ...currentRoom, session: { ...currentRoom.session, timeSegments: [...currentRoom.session.timeSegments], orders: [...currentRoom.session.orders] } };
    updatedRoom.session!.orders.splice(index, 1);
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
    setCurrentRoom(updatedRoom);
  };

  const pauseSession = () => {
    if (!currentRoom?.session) return;
    const updatedRoom = { ...currentRoom, session: { ...currentRoom.session } };
    if (!updatedRoom.session) return;
    updatedRoom.session.paused = !updatedRoom.session.paused;
    if (updatedRoom.session.paused) {
      updatedRoom.session.pauseStartTime = new Date();
    } else if (updatedRoom.session.pauseStartTime) {
      updatedRoom.session.pausedTime += Date.now() - updatedRoom.session.pauseStartTime.getTime();
      updatedRoom.session.pauseStartTime = undefined;
    }
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
    setCurrentRoom(updatedRoom);

    if (updatedRoom.session.backendId) {
      api.post(`/sessions/${updatedRoom.session.backendId}/pause`, {
        isPaused: updatedRoom.session.paused,
      }).then(res => {
        const data = res.data;
        if (data) {
          setRooms(prev => prev.map(r =>
            r.session?.backendId === data.id
              ? { ...r, session: { ...r.session!, pausedTime: data.pausedTimeMs, paused: data.isPaused, pauseStartTime: data.pauseStartedAt ? new Date() : undefined } }
              : r
          ));
        }
      }).catch(() => {});
    }
  };

  const endSession = () => {
    closeModalAction(setShowActiveModal);
    if (!currentRoom?.session) return;
    const s = currentRoom.session;
    const now = new Date();
    const elapsed = now.getTime() - s.startTime.getTime() - s.pausedTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const durationStr = `${hours} ساعة و ${minutes} دقيقة`;
    const totalHours = elapsed / 3600000;

    let playCost = 0;
    const breakdown: { mode: string; duration: number; cost: number }[] = [];
    s.timeSegments.forEach(seg => {
      const end = seg.endTime ? parseUTCDate(seg.endTime).getTime() : now.getTime();
      const start = parseUTCDate(seg.startTime).getTime();
      const durHours = (end - start) / 3600000;
      const cost = durHours * seg.rate;
      playCost += cost;
      breakdown.push({ mode: seg.mode, duration: Math.round((end - start) / 60000), cost: Math.round(cost) });
    });

    const ordersCost = s.orders.reduce((sum, o) => sum + o.price * o.quantity, 0);
    const totalCost = Math.round(playCost + ordersCost);

    if (s.backendId) {
      api.post(`/sessions/${s.backendId}/end`).catch(() => {});
    }

    const timer = timersRef.current.get(currentRoom.id);
    if (timer) clearInterval(timer);

    const invoiceData = {
      room: currentRoom.number,
      sessionId: s.backendId || '',
      duration: durationStr,
      totalHours,
      playCost: Math.round(playCost),
      ordersCost: Math.round(ordersCost),
      totalCost,
      breakdown,
      orders: [...s.orders],
      startTime: s.startTime.toISOString(),
      endTime: now.toISOString(),
      deviceName: `${currentRoom.type} - غرفة ${currentRoom.number}`,
      deviceType: currentRoom.type,
      modeEntries: breakdown.map(b => ({
        mode: b.mode === 'single' ? 'Single' : 'Multi',
        duration: `${String(Math.floor(b.duration / 60)).padStart(2, '0')}:${String(b.duration % 60).padStart(2, '0')}:00`,
        charge: b.cost
      })),
      orderItems: s.orders.map(o => ({ name: o.name, price: o.price, quantity: o.quantity, total: o.price * o.quantity })),
      timeCharge: Math.round(playCost),
      ordersTotal: Math.round(ordersCost),
      grandTotal: totalCost,
    };

    setCurrentRoom({ ...currentRoom, session: null, status: 'available' });
    setRooms(prev => prev.map(r => r.id === currentRoom.id ? { ...r, session: null, status: 'available' as const } : r));

    setTimeout(() => {
      invoiceDataRef.current = invoiceData;
      openModal(setShowInvoiceModal);
    }, 300);
  };

  const confirmPayment = async () => {
    const inv = invoiceDataRef.current;
    if (!inv) { closeModalAction(setShowInvoiceModal); return; }

    try {
      const totalSecs = Math.round(inv.totalHours * 3600);
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;

      await api.post('/receipts', {
        sessionId: inv.sessionId || '',
        deviceName: inv.deviceName,
        deviceType: inv.deviceType,
        startTime: inv.startTime,
        endTime: inv.endTime,
        totalDuration: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
        modeEntries: inv.modeEntries,
        orderItems: inv.orderItems.map((o: any) => ({ name: o.name, price: o.price, quantity: o.quantity })),
        timeCharge: inv.timeCharge,
        ordersTotal: inv.ordersTotal,
        grandTotal: inv.grandTotal,
        paymentMethod: selectedPayment,
      });

      const todayRes = await api.get('/receipts/today').catch(() => ({ data: { totalRevenue: 0 } }));
      setTodayRevenue(todayRes.data.totalRevenue || 0);

      closeModalAction(setShowInvoiceModal);
    } catch {
      closeModalAction(setShowInvoiceModal);
    }
    (window as any).__invoiceData = null;
    invoiceDataRef.current = null;
  };

  const addDevice = async (number: string, type: string, games: string[]) => {
    try {
      const gamesStr = games.join(',');
      const res = await api.post('/devices', { name: `جهاز ${number}`, type, games: gamesStr });
      const d = res.data;
      const newRoom: Room = {
        id: rooms.length + 1,
        backendId: d.id,
        number, status: 'available', type,
        games: games,
      };
      setRooms(prev => [...prev, newRoom]);
      closeModalAction(setShowAddDeviceModal);
    } catch {
      const newRoom: Room = {
        id: rooms.length + 1, number, status: 'available', type,
        games: games,
      };
      setRooms(prev => [...prev, newRoom]);
      closeModalAction(setShowAddDeviceModal);
    }
  };

  const toggleMaintenance = async (roomId: number) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    if (room.status === 'busy') { alert('لا يمكن وضع جهاز مشغول تحت الصيانة'); return; }
    const newStatus = room.status === 'maintenance' ? 'Available' : 'Maintenance';
    try {
      if (room.backendId) await api.put(`/devices/${room.backendId}`, { status: newStatus });
      setRooms(prev => prev.map(r =>
        r.id === roomId ? { ...r, status: newStatus === 'Available' ? 'available' as const : 'maintenance' as const } : r
      ));
    } catch { /* local only */ }
  };

  const deleteDevice = async (roomId: number) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room || room.status === 'busy') return;
    if (!confirm('هل أنت متأكد من حذف هذا الجهاز؟')) return;
    const timer = timersRef.current.get(roomId);
    if (timer) { clearInterval(timer); timersRef.current.delete(roomId); }
    try {
      if (room.backendId) await api.delete(`/devices/${room.backendId}`);
      setRooms(prev => prev.filter(r => r.id !== roomId));
    } catch { setRooms(prev => prev.filter(r => r.id !== roomId)); }
  };

  const updateDevice = async (roomId: number, number: string, type: string, games: string[]) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const gamesStr = games.join(',');
    try {
      if (room.backendId) await api.put(`/devices/${room.backendId}`, { name: `جهاز ${number}`, type, games: gamesStr });
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, number, type, games } : r));
    } catch { setRooms(prev => prev.map(r => r.id === roomId ? { ...r, number, type, games } : r)); }
    closeModalAction(setShowEditDeviceModal);
  };

  const addMenuItem = (name: string, price: number, icon: string) => {
    const newItem: MenuItem = { id: Date.now(), name, price, icon: icon || 'fa-solid fa-utensils' };
    setSettings(prev => ({ ...prev, menuItems: [...prev.menuItems, newItem] }));
    closeModalAction(setShowAddMenuItemModal);
  };

  const updateMenuItem = (id: number, name: string, price: number, icon: string) => {
    setSettings(prev => ({
      ...prev,
      menuItems: prev.menuItems.map(item => item.id === id ? { ...item, name, price, icon: icon || item.icon } : item)
    }));
    setEditingMenuItem(null);
    closeModalAction(setShowAddMenuItemModal);
  };

  const removeMenuItem = (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
      setSettings(prev => ({ ...prev, menuItems: prev.menuItems.filter(i => i.id !== id) }));
    }
  };

  const saveSettings = async () => {
    const p = settings.pricing;
    try {
      await Promise.all([
        api.post('/priceconfig', { deviceType: 'PS4', mode: 'Single', pricePerHour: p.ps4.single }),
        api.post('/priceconfig', { deviceType: 'PS4', mode: 'Multi', pricePerHour: p.ps4.multi }),
        api.post('/priceconfig', { deviceType: 'PS5', mode: 'Single', pricePerHour: p.ps5.single }),
        api.post('/priceconfig', { deviceType: 'PS5', mode: 'Multi', pricePerHour: p.ps5.multi }),
        api.post('/settings', {
          games: settings.games.join(','),
          menuItems: JSON.stringify(settings.menuItems),
        }),
      ]);
      addNotif('', '✅ تم حفظ الإعدادات بنجاح', 'warning');
    } catch {
      addNotif('', '❌ فشل حفظ الإعدادات', 'alert');
    }
  };

  function addNotif(_roomNumber: string, message: string, type: 'warning' | 'alert') {
    const id = `${Date.now()}_${Math.random()}`;
    setNotifications(prev => [...prev, { id, roomNumber: _roomNumber, message, type }]);
    setTimeout(() => dismissNotification(id), 5000);
  }

  const contextValue = useMemo(() => ({
    rooms, receipts, todayRevenue, settings, currentRoom, activePage,
    selectedSessionType, selectedMode, selectedPayment,
    showStartModal, showActiveModal, showInvoiceModal,
    showAddDeviceModal, showEditDeviceModal, editingDevice,
    showAddMenuItemModal, showReceiptDetail, loading,
    setActivePage, setCurrentRoom,
    setSelectedSessionType, setSelectedMode, setSelectedPayment,
    setShowStartModal: (s: boolean) => s ? openModal(setShowStartModal) : closeModalAction(setShowStartModal),
    setShowActiveModal: (s: boolean) => s ? openModal(setShowActiveModal) : closeModalAction(setShowActiveModal),
    setShowInvoiceModal: (s: boolean) => s ? openModal(setShowInvoiceModal) : closeModalAction(setShowInvoiceModal),
    setShowAddDeviceModal: (s: boolean) => s ? openModal(setShowAddDeviceModal) : closeModalAction(setShowAddDeviceModal),
    setShowEditDeviceModal: (s: boolean) => s ? openModal(setShowEditDeviceModal) : closeModalAction(setShowEditDeviceModal),
    setEditingDevice,
    setShowAddMenuItemModal: (s: boolean) => s ? openModal(setShowAddMenuItemModal) : closeModalAction(setShowAddMenuItemModal),
    setEditingMenuItem,
    setShowReceiptDetail, setSettings,
    invoiceDataRef,
    handleRoomClick, startSession, switchMode, addOrder, removeOrder,
    pauseSession, endSession, confirmPayment,
    addDevice, toggleMaintenance, deleteDevice, updateDevice,
    addMenuItem, updateMenuItem, removeMenuItem, saveSettings,
    loadReceipts, deleteReceipt, deleteAllReceipts, notifications, dismissNotification,
    editingMenuItem,
  }), [
    rooms, receipts, todayRevenue, settings, currentRoom, activePage,
    selectedSessionType, selectedMode, selectedPayment,
    showStartModal, showActiveModal, showInvoiceModal,
    showAddDeviceModal, showEditDeviceModal, editingDevice,
    showAddMenuItemModal, showReceiptDetail, loading,
    editingMenuItem, notifications,
  ]);

  return (
    <PlayZoneContext.Provider value={contextValue}>
      {children}
    </PlayZoneContext.Provider>
  );
}

export { FA_ICONS };
