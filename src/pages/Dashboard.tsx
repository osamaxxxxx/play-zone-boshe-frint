import { useEffect } from 'react';
import { usePlayZone, Room } from '../PlayZoneContext';

const statusConfig: Record<string, { cardClass: string; icon: string; text: string }> = {
  available: { cardClass: 'card-available', icon: 'fa-solid fa-check-circle', text: 'متاح' },
  busy: { cardClass: 'card-busy', icon: 'fa-solid fa-fire', text: 'مشغول' },
  maintenance: { cardClass: 'card-maintenance', icon: 'fa-solid fa-tools', text: 'تحت الصيانة' },
};

export default function Dashboard() {
  const { rooms, handleRoomClick, todayRevenue, loading, loadReceipts } = usePlayZone();

  useEffect(() => {
    const now = new Date();
    loadReceipts(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }, []);

  const available = rooms.filter(r => r.status === 'available').length;
  const busy = rooms.filter(r => r.status === 'busy').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-purple-400 mb-4"></i>
          <p className="text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-4">
        <div className="stats-grid grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {[
            { bg: 'bg-green-500/20 border-green-500/50', icon: 'fa-solid fa-check-circle text-green-400', label: 'متاح', count: available, color: 'text-green-400' },
            { bg: 'bg-red-500/20 border-red-500/50', icon: 'fa-solid fa-fire text-red-400', label: 'مشغول', count: busy, color: 'text-red-400' },
            { bg: 'bg-purple-500/20 border-purple-500/50', icon: 'fa-solid fa-coins text-purple-400', label: 'إيرادات اليوم', count: `${todayRevenue.toLocaleString()} ج`, color: 'text-purple-400' },
          ].map((item, i) => (
            <div key={i} className={`${item.bg} border rounded-xl p-3 md:p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-300">{item.label}</p>
                  <p className={`text-xl md:text-2xl font-bold ${item.color}`}>{item.count}</p>
                </div>
                <i className={`${item.icon} text-2xl md:text-3xl`}></i>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {rooms.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <i className="fa-solid fa-gamepad text-6xl mb-4 opacity-30"></i>
            <p className="text-xl">لا توجد أجهزة مضافة</p>
            <p className="text-sm mt-2">أضف جهازاً من صفحة الإعدادات</p>
          </div>
        ) : (
        <div className="rooms-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {rooms.map(room => {
            const cfg = statusConfig[room.status] || statusConfig.available;
            return (
              <div key={room.id} onClick={() => handleRoomClick(room.id)}
                className={`${cfg.cardClass} rounded-2xl p-5 md:p-6 cursor-pointer transform hover:scale-105 active:scale-95 transition-all`}
                role="button" tabIndex={0} aria-label={`غرفة ${room.number} - ${cfg.text}`}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRoomClick(room.id); } }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                    <span className="text-sm font-bold">{room.type}</span>
                  </div>
                  <i className={`${cfg.icon} text-2xl`}></i>
                </div>
                <div className="text-center">
                  <h3 className="text-3xl md:text-4xl font-bold mb-2">غرفة {room.number}</h3>
                  <p className="text-sm opacity-90">{cfg.text}</p>
                    <div className="mt-2 flex flex-wrap gap-1 justify-center">
                    {room.games.map((game, i) => (
                      <span key={i} className="bg-black/30 backdrop-blur-md px-2 py-1 rounded text-xs">{game}</span>
                    ))}
                  </div>
                  {room.status === 'busy' && room.session && (
                    <div className="mt-4 bg-black/30 backdrop-blur-md rounded-lg p-3">
                      <div className="flex items-center justify-center gap-4">
                        {room.session.duration && (
                          <div className="relative" style={{ width: 80, height: 80 }}>
                            <svg width="80" height="80" className="transform -rotate-90">
                              <circle cx="40" cy="40" r="36" fill="none" stroke="#374151" strokeWidth="6"/>
                              <circle cx="40" cy="40" r="36" fill="none" stroke="#10b981" strokeWidth="6"
                                strokeDasharray={2 * Math.PI * 36} strokeDashoffset="0" strokeLinecap="round"
                                id={`circle-progress-${room.id}`} style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}/>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-bold font-mono" id={`circle-text-${room.id}`}>--%</span>
                            </div>
                          </div>
                        )}
                        <div className={`${room.session.duration ? 'flex-1' : 'w-full'} text-right`}>
                          <div className="timer-display text-xl font-bold font-mono" id={`timer-${room.id}`}>00:00:00</div>
                          {room.session.duration && (
                            <div className="text-xs font-mono mt-1 text-green-400" id={`remaining-${room.id}`}></div>
                          )}
                          <div className="flex items-center justify-end gap-2 text-xs mt-2">
                            <span>{room.session.mode === 'single' ? 'Single' : 'Multi'}</span>
                            <i className={`fa-solid ${room.session.mode === 'single' ? 'fa-user' : 'fa-users'}`}></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {room.status === 'available' && (
                  <button className="w-full mt-4 bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-md py-3 rounded-lg font-bold transition">
                    بدء جلسة
                  </button>
                )}
              </div>
            );
          })}
        </div>)}
      </div>
    </div>
  );
}
