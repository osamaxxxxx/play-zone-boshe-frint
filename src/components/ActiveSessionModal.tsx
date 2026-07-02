import { useState, useEffect, useRef } from 'react';
import { usePlayZone, MenuItem } from '../PlayZoneContext';

export default function ActiveSessionModal() {
  const { rooms, currentRoom, setShowActiveModal, switchMode, addOrder, removeOrder, pauseSession, endSession, settings } = usePlayZone();
  const roomsRef = useRef(rooms);
  roomsRef.current = rooms;
  const [showOrderMenu, setShowOrderMenu] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<MenuItem | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [timeStr, setTimeStr] = useState('00:00:00');
  const [remainingStr, setRemainingStr] = useState<string | null>(null);
  const [playCost, setPlayCost] = useState(0);
  const [ordersCost, setOrdersCost] = useState(0);
  const [remainingPct, setRemainingPct] = useState(100);
  const [showTimeAlert, setShowTimeAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const alertTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!currentRoom?.id) return;
    const iv = setInterval(() => {
      const room = roomsRef.current.find(r => r.id === currentRoom.id);
      const s = room?.session;
      if (!s) return;
      const now = s.paused && s.pauseStartTime ? s.pauseStartTime.getTime() : Date.now();
      const elapsed = now - s.startTime.getTime() - s.pausedTime;
      const h = Math.floor(elapsed / 3600000);
      const m = Math.floor((elapsed % 3600000) / 60000);
      const sec = Math.floor((elapsed % 60000) / 1000);
      setTimeStr(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`);

      if (s.duration && !s.paused) {
        const remaining = s.duration * 3600000 - elapsed;
        const pct = Math.max(0, (remaining / (s.duration * 3600000)) * 100);
        setRemainingPct(pct);

        if (remaining > 0) {
          const rh = Math.floor(remaining / 3600000);
          const rm = Math.floor((remaining % 3600000) / 60000);
          const rs = Math.floor((remaining % 60000) / 1000);
          setRemainingStr(`${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}:${String(rs).padStart(2, '0')}`);

          if (pct <= 10) {
            showAlert('⚠️ الوقت على وشك الانتهاء!');
          }
        } else {
          setRemainingStr('00:00:00');
          setRemainingPct(0);
          showAlert('⏰ انتهى الوقت!');
        }
      } else {
        setRemainingStr(null);
        setRemainingPct(100);
      }

      let pc = 0;
      const pivot = s.paused && s.pauseStartTime ? s.pauseStartTime : new Date();
      s.timeSegments.forEach(seg => {
        const end = seg.endTime ? new Date(seg.endTime) : pivot;
        const dur = (end.getTime() - new Date(seg.startTime).getTime()) / 3600000;
        pc += dur * seg.rate;
      });
      const oc = s.orders.reduce((sum, o) => sum + o.price * o.quantity, 0);
      setPlayCost(pc);
      setOrdersCost(oc);
    }, 1000);
    return () => { clearInterval(iv); if (alertTimer.current) clearTimeout(alertTimer.current); };
  }, [currentRoom?.id]);

  const showAlert = (msg: string) => {
    setAlertMsg(msg);
    setShowTimeAlert(true);
    if (alertTimer.current) clearTimeout(alertTimer.current);
    alertTimer.current = setTimeout(() => setShowTimeAlert(false), 4000);
  };

  if (!currentRoom?.session) return null;
  const session = currentRoom.session;

  const arcRadius = 90;
  const circumference = 2 * Math.PI * arcRadius;
  const offset = circumference * (1 - remainingPct / 100);

  const progressColor =
    remainingPct > 50 ? '#10b981' :
    remainingPct > 25 ? '#f59e0b' :
    remainingPct > 10 ? '#f97316' :
    '#ef4444';

  const ringClass =
    remainingPct <= 10 && remainingPct > 0 ? 'animate-ring-pulse' :
    remainingPct === 0 ? 'animate-ring-shake' : '';

  return (
    <div className="fixed inset-0 bg-black/70 modal-overlay z-50 flex items-center justify-center p-0 md:p-4" onClick={() => setShowActiveModal(false)}>
      <div className={`modal-content bg-gray-900 rounded-2xl max-w-2xl w-full border max-h-[90vh] overflow-y-auto ${
        remainingPct <= 10 ? (remainingPct === 0 ? 'border-red-500 animate-modal-shake' : 'border-orange-500 animate-modal-pulse') : 'border-purple-500/30'
      }`} onClick={e => e.stopPropagation()}
        style={remainingPct <= 10 && remainingPct > 0 ? { boxShadow: '0 0 30px rgba(249,115,22,0.5)' } : remainingPct === 0 ? { boxShadow: '0 0 40px rgba(239,68,68,0.6)' } : {}}>
        <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold">الغرفة {currentRoom.number}</h2>
            <button onClick={() => setShowActiveModal(false)} className="text-gray-400 hover:text-white p-2"><i className="fa-solid fa-times text-xl"></i></button>
          </div>
        </div>

        {showTimeAlert && (
          <div className={`px-6 py-3 text-center font-bold text-lg animate-slide-down ${
            alertMsg.includes('انتهى') ? 'bg-red-600/80 text-white' : 'bg-orange-600/80 text-white'
          }`}>
            {alertMsg}
          </div>
        )}

        <div className="p-6 space-y-6">
          {session.duration ? (
            <div className="rounded-xl p-6 text-center relative"
              style={{ background: remainingPct <= 10
                ? `linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(249,115,22,0.2) 100%)`
                : 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(59,130,246,0.2) 100%)',
                border: remainingPct <= 10 ? `1px solid ${progressColor}40` : '1px solid rgba(139,92,246,0.3)' }}>
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="relative" style={{ width: 220, height: 220 }}>
                  <svg width="220" height="220" className="transform -rotate-90">
                    <circle cx="110" cy="110" r={arcRadius} fill="none" stroke="#374151" strokeWidth="12"/>
                    <circle cx="110" cy="110" r={arcRadius} fill="none" stroke={progressColor} strokeWidth="12"
                      strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                      className={ringClass} style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-sm text-gray-400">الوقت المتبقي</p>
                    <p className={`text-3xl font-bold font-mono ${remainingPct <= 10 ? 'text-red-400' : 'text-green-400'}`}>
                      {remainingStr || '--:--:--'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{Math.round(remainingPct)}%</p>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-1">الوقت المنقضي</p>
                    <div className="text-3xl md:text-4xl font-bold text-white font-mono mb-3">{timeStr}</div>
                    <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
                      <div className={`px-3 md:px-4 py-2 rounded-full font-bold text-sm md:text-base text-white`}
                        style={{ background: session.mode === 'single' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                        <i className={`fa-solid ${session.mode === 'single' ? 'fa-user' : 'fa-users'} ml-2`}></i>
                        <span>{session.mode === 'single' ? 'Single' : 'Multi'}</span>
                      </div>
                      <div className="bg-white/20 backdrop-blur-md px-3 md:px-4 py-2 rounded-full text-sm md:text-base">
                        <i className="fa-solid fa-coins ml-2"></i>
                        <span>{session.rate}</span> ج/ساعة
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-6 text-center relative"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(59,130,246,0.2) 100%)',
                border: '1px solid rgba(139,92,246,0.3)' }}>
              <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-2">الوقت المنقضي</p>
                  <div className="text-4xl font-bold text-white font-mono">{timeStr}</div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <div className={`px-4 py-2 rounded-full font-bold text-sm md:text-base text-white`}
                    style={{ background: session.mode === 'single' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    <i className={`fa-solid ${session.mode === 'single' ? 'fa-user' : 'fa-users'} ml-2`}></i>
                    <span>{session.mode === 'single' ? 'Single' : 'Multi'}</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm md:text-base">
                    <i className="fa-solid fa-coins ml-2"></i>
                    <span>{session.rate}</span> ج/ساعة
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-3">تبديل وضع اللعب</label>
            <div className="grid grid-cols-2 gap-3">
              {(['single', 'multi'] as const).map(mode => (
                <button key={mode} onClick={() => switchMode(mode)} disabled={session.mode === mode}
                  className={`rounded-lg p-4 text-center transition font-bold ${
                    session.mode === mode
                      ? 'border-2 border-white text-white'
                      : 'bg-gray-800 border-2 border-gray-700 hover:border-white text-white'
                  }`}
                  style={session.mode === mode && mode === 'single' ? { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' } :
                         session.mode === mode && mode === 'multi' ? { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' } : {}}>
                  <i className={`${mode === 'single' ? 'fa-solid fa-user' : 'fa-solid fa-users'} text-xl md:text-2xl mb-2`}></i>
                  <p className="text-sm md:text-base">{mode === 'single' ? 'Single' : 'Multi'}</p>
                  <p className="text-xs opacity-80">{mode === 'single' ? '2 دراع' : '4 دراع'}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">الأوردرات</label>
              <button onClick={() => setShowOrderMenu(!showOrderMenu)}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                <i className="fa-solid fa-plus ml-2"></i>إضافة أوردر
              </button>
            </div>
            <div className="space-y-2">
              {session.orders.length === 0 ? (
                <p className="text-center text-gray-500 py-4">لا توجد أوردرات</p>
              ) : (
                session.orders.map((order, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{order.name}</span>
                      <span className="text-gray-400">× {order.quantity}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{order.price * order.quantity} ج</span>
                      <button onClick={() => removeOrder(i)} className="text-red-400 hover:text-red-300 p-2">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {showOrderMenu && (
              <div className="mt-3 bg-gray-800 rounded-xl p-4">
                {selectedOrderItem ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <i className={`${selectedOrderItem.icon} text-3xl text-purple-400`}></i>
                      <div>
                        <p className="text-lg font-bold">{selectedOrderItem.name}</p>
                        <p className="text-sm text-gray-400">{selectedOrderItem.price} ج × {orderQty} = {selectedOrderItem.price * orderQty} ج</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <button onClick={() => setOrderQty(Math.max(1, orderQty - 1))}
                        className="w-12 h-12 rounded-xl bg-gray-700 hover:bg-gray-600 text-2xl font-bold"><i className="fa-solid fa-minus"></i></button>
                      <span className="text-3xl font-bold w-12 text-center">{orderQty}</span>
                      <button onClick={() => setOrderQty(orderQty + 1)}
                        className="w-12 h-12 rounded-xl bg-gray-700 hover:bg-gray-600 text-2xl font-bold"><i className="fa-solid fa-plus"></i></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => { setSelectedOrderItem(null); setOrderQty(1); }}
                        className="py-3 rounded-lg bg-gray-700 font-bold">رجوع</button>
                      <button onClick={() => { addOrder(selectedOrderItem.name, selectedOrderItem.price, orderQty); setSelectedOrderItem(null); setOrderQty(1); }}
                        className="py-3 rounded-lg font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                        <i className="fa-solid fa-check ml-2"></i>إضافة {orderQty}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {settings.menuItems.map(item => (
                      <button key={item.id} onClick={() => { setSelectedOrderItem(item); setOrderQty(1); }}
                        className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-lg p-3 text-center transition">
                        <i className={`${item.icon} text-2xl mb-2 text-purple-400`}></i>
                        <p className="text-sm">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.price} ج</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">تكلفة اللعب</span>
              <span className="font-bold">{Math.round(playCost)} ج</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">الأوردرات</span>
              <span className="font-bold">{Math.round(ordersCost)} ج</span>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">الإجمالي</span>
                <span className="text-2xl font-bold text-purple-400">{Math.round(playCost + ordersCost)} ج</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={pauseSession} className="font-bold py-3 rounded-lg text-white"
              style={{ background: '#d97706' }}>
              <i className="fa-solid fa-pause ml-2"></i>
              {session.paused ? 'استئناف' : 'إيقاف مؤقت'}
            </button>
            <button onClick={endSession} className="font-bold py-3 rounded-lg text-white"
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
              <i className="fa-solid fa-stop ml-2"></i>
              إنهاء الجلسة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
