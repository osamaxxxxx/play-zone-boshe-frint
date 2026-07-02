import { useState } from 'react';
import { usePlayZone } from '../PlayZoneContext';

const quickTimes = [
  { label: '١٥ د', hours: 0.25 },
  { label: '٣٠ د', hours: 0.5 },
  { label: '٤٥ د', hours: 0.75 },
  { label: '١ س', hours: 1 },
  { label: '١.٥ س', hours: 1.5 },
  { label: '٢ س', hours: 2 },
  { label: '٣ س', hours: 3 },
];

export default function StartSessionModal() {
  const { currentRoom, selectedSessionType, selectedMode, setSelectedSessionType, setSelectedMode, setShowStartModal, startSession } = usePlayZone();
  const [durationH, setDurationH] = useState(1);
  const [durationM, setDurationM] = useState(0);
  const [useCustomTime, setUseCustomTime] = useState(false);

  const totalHours = durationH + durationM / 60;

  return (
    <div className="fixed inset-0 bg-black/70 modal-overlay z-50 flex items-center justify-center p-0 md:p-4" onClick={() => setShowStartModal(false)}>
      <div className="modal-content bg-gray-900 rounded-2xl max-w-md w-full border border-purple-500/30 overflow-y-auto max-h-screen md:max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold">بدء جلسة جديدة</h2>
            <button onClick={() => setShowStartModal(false)} className="text-gray-400 hover:text-white p-2"><i className="fa-solid fa-times text-xl"></i></button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">رقم الغرفة</label>
            <input type="text" value={currentRoom?.number || ''} readOnly className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 opacity-70" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">نوع الجلسة</label>
            <div className="grid grid-cols-2 gap-3">
              {(['timed', 'open'] as const).map(type => (
                <button key={type} onClick={() => setSelectedSessionType(type)}
                  className={`rounded-lg p-4 text-center transition ${
                    selectedSessionType === type
                      ? 'border-2 border-purple-500 bg-purple-500/20'
                      : 'bg-gray-800 border-2 border-gray-700 hover:border-purple-500'
                  }`}>
                  <i className={`${type === 'timed' ? 'fa-regular fa-clock' : 'fa-solid fa-infinity'} text-2xl mb-2`}></i>
                  <p className="text-sm">{type === 'timed' ? 'بوقت محدد' : 'مفتوحة'}</p>
                </button>
              ))}
            </div>
          </div>
          {selectedSessionType === 'timed' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">المدة</label>
                <button onClick={() => { setUseCustomTime(!useCustomTime); if (!useCustomTime) { setDurationH(0); setDurationM(0); } }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${useCustomTime ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                  {useCustomTime ? 'مخصص' : 'سريع'}
                </button>
              </div>
              {useCustomTime ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">ساعات</label>
                    <input type="number" value={durationH} min="0" max="12"
                      onChange={e => setDurationH(parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 text-center text-2xl font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">دقائق</label>
                    <select value={durationM} onChange={e => setDurationM(parseInt(e.target.value))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 text-center text-2xl font-bold">
                      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {quickTimes.map(qt => (
                    <button key={qt.label} onClick={() => { setDurationH(Math.floor(qt.hours)); setDurationM(Math.round((qt.hours % 1) * 60)); }}
                      className={`rounded-lg py-4 text-center font-bold transition ${
                        Math.abs(totalHours - qt.hours) < 0.01
                          ? 'bg-purple-600 border-2 border-purple-400 text-white'
                          : 'bg-gray-800 border-2 border-gray-700 hover:border-purple-500 text-white'
                      }`}>
                      <p className="text-sm">{qt.label}</p>
                    </button>
                  ))}
                </div>
              )}
              {useCustomTime && totalHours > 0 && (
                <div className="mt-3 bg-gray-800/50 rounded-lg p-3 text-center">
                  <span className="text-gray-400 text-sm">المدة المحددة: </span>
                  <span className="text-xl font-bold text-purple-400 font-mono">
                    {String(durationH).padStart(2, '0')}:{String(durationM).padStart(2, '0')}:00
                  </span>
                </div>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">وضع اللعب</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setSelectedMode('single')}
                className={`rounded-lg p-4 text-center transition text-white ${
                  selectedMode === 'single' ? 'border-2 border-white' : 'bg-gray-800 border-2 border-gray-700 hover:border-white'
                } ${selectedMode === 'single' ? 'mode-single' : ''}`}>
                <i className="fa-solid fa-user text-2xl mb-2"></i>
                <p className="font-bold">Single</p>
                <p className="text-xs opacity-80">2 دراع</p>
              </button>
              <button onClick={() => setSelectedMode('multi')}
                className={`rounded-lg p-4 text-center transition ${
                  selectedMode === 'multi'
                    ? 'border-2 border-white mode-multi'
                    : 'bg-gray-800 border-2 border-gray-700 hover:border-white'
                }`}>
                <i className="fa-solid fa-users text-2xl mb-2"></i>
                <p className="font-bold text-white">Multi</p>
                <p className="text-xs opacity-80 text-white">4 دراع</p>
              </button>
            </div>
          </div>
          <button onClick={() => startSession(selectedSessionType === 'timed' ? durationH + durationM / 60 : null)}
            className="w-full text-white font-bold py-4 rounded-lg relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <i className="fa-solid fa-play ml-2"></i>
            بدء الجلسة
          </button>
        </div>
      </div>
    </div>
  );
}
