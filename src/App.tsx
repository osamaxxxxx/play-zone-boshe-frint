import { useEffect } from 'react';
import { PlayZoneProvider, usePlayZone } from './PlayZoneContext';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Devices from './pages/Devices';
import Settings from './pages/Settings';
import StartSessionModal from './components/StartSessionModal';
import ActiveSessionModal from './components/ActiveSessionModal';
import InvoiceModal from './components/InvoiceModal';
import AddDeviceModal from './components/AddDeviceModal';
import EditDeviceModal from './components/EditDeviceModal';
import AddMenuItemModal from './components/AddMenuItemModal';

const pageTitles: Record<string, string> = {
  dashboard: 'الرئيسية', invoices: 'الفواتير', devices: 'الأجهزة', settings: 'الإعدادات',
};

function AppContent() {
  const { activePage, setActivePage, showStartModal, showActiveModal, showInvoiceModal, showAddDeviceModal, showEditDeviceModal, showAddMenuItemModal, notifications, dismissNotification } = usePlayZone();

  useEffect(() => {
    const update = () => {
      const el = document.getElementById('currentTime');
      if (el) el.textContent = new Date().toLocaleTimeString('ar-EG');
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex">
      <aside className="sidebar w-64 bg-black/30 backdrop-blur-md border-l border-purple-500/30 min-h-screen fixed right-0 top-0 z-30 hidden md:block">
        <div className="p-6 border-b border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-3 rounded-xl"><i className="fa-solid fa-gamepad text-2xl"></i></div>
            <div><h1 className="text-xl font-bold neon-text">PlayZone</h1><p className="text-xs text-gray-300">نظام الإدارة</p></div>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {[
            { key: 'dashboard', icon: 'fa-solid fa-home', label: 'الرئيسية' },
            { key: 'invoices', icon: 'fa-solid fa-file-invoice', label: 'الفواتير' },
            { key: 'devices', icon: 'fa-solid fa-tv', label: 'الأجهزة' },
            { key: 'settings', icon: 'fa-solid fa-cog', label: 'الإعدادات' },
          ].map(item => (
            <button key={item.key} onClick={() => setActivePage(item.key)}
              className={`sidebar-item w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right ${activePage === item.key ? 'active' : ''}`}>
              <i className={`${item.icon} text-xl`}></i><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 right-0 left-0 p-4 border-t border-purple-500/30">
        </div>
      </aside>

      <main className="flex-1 md:mr-64 pb-20 md:pb-0">
        <header className="bg-black/30 backdrop-blur-md border-b border-purple-500/30 sticky top-0 z-20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold">{pageTitles[activePage] || 'الرئيسية'}</h2>
              <div className="header-time bg-gray-800 px-3 md:px-4 py-2 rounded-lg text-sm md:text-base">
                <i className="fa-regular fa-clock ml-2"></i><span id="currentTime"></span>
              </div>
            </div>
          </div>
        </header>

        <div id="dashboard" className={`page ${activePage === 'dashboard' ? 'active' : ''}`}><Dashboard /></div>
        <div id="invoices" className={`page ${activePage === 'invoices' ? 'active' : ''}`}><Invoices /></div>
        <div id="devices" className={`page ${activePage === 'devices' ? 'active' : ''}`}><Devices /></div>
        <div id="settings" className={`page ${activePage === 'settings' ? 'active' : ''}`}><Settings /></div>
      </main>

      <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-purple-500/30 z-40 md:hidden flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {[
          { key: 'dashboard', icon: 'fa-solid fa-home', label: 'الرئيسية' },
          { key: 'invoices', icon: 'fa-solid fa-file-invoice', label: 'الفواتير' },
          { key: 'devices', icon: 'fa-solid fa-tv', label: 'الأجهزة' },
          { key: 'settings', icon: 'fa-solid fa-cog', label: 'الإعدادات' },
        ].map(item => (
          <button key={item.key} onClick={() => { setActivePage(item.key); window.scrollTo(0, 0); }}
            className={`bottom-nav-item flex-1 flex flex-col items-center justify-center py-3 px-2 text-gray-400 transition-all min-h-[60px] ${activePage === item.key ? '!text-purple-500' : ''}`}>
            <i className={`${item.icon} text-xl mb-1`}></i><span className="text-xs font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>

      {showStartModal && <StartSessionModal />}
      {showActiveModal && <ActiveSessionModal />}
      {showInvoiceModal && <InvoiceModal />}
      {showAddDeviceModal && <AddDeviceModal />}
      {showEditDeviceModal && <EditDeviceModal />}
      {showAddMenuItemModal && <AddMenuItemModal />}

      {/* Global notifications */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90%] max-w-md" style={{ direction: 'rtl' }}>
        {notifications.map(n => (
          <div key={n.id}
            className={`animate-slide-down px-5 py-4 rounded-xl shadow-2xl text-white font-bold text-base flex items-center gap-3 cursor-pointer ${
              n.type === 'alert' ? 'bg-red-600' : 'bg-orange-600'
            }`}
            onClick={() => dismissNotification(n.id)}
            style={n.type === 'alert' ? { boxShadow: '0 0 30px rgba(239,68,68,0.6)' } : { boxShadow: '0 0 20px rgba(249,115,22,0.5)' }}>
            <i className={`fa-solid ${n.type === 'alert' ? 'fa-exclamation-triangle' : 'fa-clock'} text-xl`}></i>
            <div className="flex-1">
              <p className="text-sm opacity-80">غرفة {n.roomNumber}</p>
              <p>{n.message}</p>
            </div>
            <i className="fa-solid fa-times text-sm opacity-70"></i>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <PlayZoneProvider>
      <AppContent />
    </PlayZoneProvider>
  );
}
