import { useState } from 'react';
import { usePlayZone } from '../PlayZoneContext';

export default function Settings() {
  const { settings, setSettings, setShowAddMenuItemModal, setEditingMenuItem, removeMenuItem, saveSettings } = usePlayZone();
  const [newGame, setNewGame] = useState('');

  const updatePrice = (device: 'ps4' | 'ps5', mode: 'single' | 'multi', val: string) => {
    const num = parseFloat(val) || 0;
    setSettings(prev => ({
      ...prev,
      pricing: { ...prev.pricing, [device]: { ...prev.pricing[device], [mode]: num } }
    }));
  };

  const addGame = () => {
    const trimmed = newGame.trim();
    if (trimmed && !settings.games.includes(trimmed)) {
      setSettings(prev => ({ ...prev, games: [...prev.games, trimmed] }));
      setNewGame('');
    }
  };

  const removeGame = (idx: number) => {
    setSettings(prev => ({ ...prev, games: prev.games.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="bg-gray-900/50 rounded-2xl border border-purple-500/30 p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-bold mb-6">أسعار اللعب</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-4 text-blue-400">PS4</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Single (2 دراع) - السعر بالساعة</label>
                <input type="number" value={settings.pricing.ps4.single}
                  onChange={e => updatePrice('ps4', 'single', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm mb-2">Multi (4 دراع) - السعر بالساعة</label>
                <input type="number" value={settings.pricing.ps4.multi}
                  onChange={e => updatePrice('ps4', 'multi', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500" />
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-purple-400">PS5</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Single (2 دراع) - السعر بالساعة</label>
                <input type="number" value={settings.pricing.ps5.single}
                  onChange={e => updatePrice('ps5', 'single', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm mb-2">Multi (4 دراع) - السعر بالساعة</label>
                <input type="number" value={settings.pricing.ps5.multi}
                  onChange={e => updatePrice('ps5', 'multi', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-2xl border border-purple-500/30 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg md:text-xl font-bold">قائمة الأوردرات</h3>
          <button onClick={() => setShowAddMenuItemModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
            <i className="fa-solid fa-plus ml-2"></i>
            <span className="hidden md:inline">إضافة صنف</span>
            <span className="md:hidden">إضافة</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {settings.menuItems.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              <i className="fa-solid fa-utensils text-4xl mb-2 opacity-30"></i>
              <p>لا توجد أصناف مضافة</p>
            </div>
          ) : settings.menuItems.map(item => (
            <div key={item.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className={`${item.icon} text-2xl text-purple-400`}></i>
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm text-gray-400">{item.price} ج</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditingMenuItem(item); setShowAddMenuItemModal(true); }} className="text-blue-400 hover:text-blue-300 p-2">
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button onClick={() => removeMenuItem(item.id)} className="text-red-400 hover:text-red-300 p-2">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-2xl border border-purple-500/30 p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-bold mb-6">الألعاب</h3>
        <div className="flex gap-2 mb-4">
          <input type="text" value={newGame} onChange={e => setNewGame(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addGame()}
            placeholder="اسم اللعبة..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500" />
          <button onClick={addGame}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {settings.games.length === 0 ? (
            <div className="w-full text-center py-6 text-gray-500">
              <i className="fa-solid fa-gamepad text-3xl mb-2 opacity-30"></i>
              <p>لا توجد ألعاب مضافة</p>
            </div>
          ) : settings.games.map((game, i) => (
            <div key={i} className="bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
              <span>{game}</span>
              <button onClick={() => removeGame(i)} className="text-red-400 hover:text-red-300 p-1">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      </div>

      <button onClick={saveSettings}
        className="w-full py-4 rounded-lg font-bold text-lg text-white"
        style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
        <i className="fa-solid fa-save ml-2"></i>
        حفظ الإعدادات
      </button>
    </div>
  );
}
