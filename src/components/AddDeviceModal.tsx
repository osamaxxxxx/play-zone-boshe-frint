import { useState } from 'react';
import { usePlayZone } from '../PlayZoneContext';

export default function AddDeviceModal() {
  const { settings, setShowAddDeviceModal, addDevice } = usePlayZone();
  const [number, setNumber] = useState('');
  const [type, setType] = useState('PS4');
  const [selectedGames, setSelectedGames] = useState<string[]>([]);

  const toggleGame = (game: string) => {
    setSelectedGames(prev =>
      prev.includes(game) ? prev.filter(g => g !== game) : [...prev, game]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 modal-overlay z-50 flex items-center justify-center p-0 md:p-4" onClick={() => setShowAddDeviceModal(false)}>
      <div className="modal-content bg-gray-900 rounded-2xl max-w-md w-full border border-purple-500/30 overflow-y-auto max-h-screen md:max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold">إضافة جهاز جديد</h2>
            <button onClick={() => setShowAddDeviceModal(false)} className="text-gray-400 hover:text-white p-2"><i className="fa-solid fa-times text-xl"></i></button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">رقم الجهاز</label>
            <input type="text" value={number} onChange={e => setNumber(e.target.value)} placeholder="مثال: 11"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">نوع الجهاز</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500">
              <option value="PS4">PS4</option>
              <option value="PS5">PS5</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">الألعاب المدعومة</label>
            <div className="flex flex-wrap gap-2 bg-gray-800 border border-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto">
              {settings.games.map(game => (
                <button key={game} type="button" onClick={() => toggleGame(game)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    selectedGames.includes(game)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}>
                  {game}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => addDevice(number, type, selectedGames)}
            className="w-full text-white font-bold py-4 rounded-lg"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <i className="fa-solid fa-plus ml-2"></i>
            إضافة الجهاز
          </button>
        </div>
      </div>
    </div>
  );
}
