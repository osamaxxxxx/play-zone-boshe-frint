import { usePlayZone } from '../PlayZoneContext';

const statusText: Record<string, string> = {
  available: 'متاح', busy: 'مشغول', reserved: 'محجوز', maintenance: 'تحت الصيانة',
};

export default function Devices() {
  const { rooms, setShowAddDeviceModal, setShowEditDeviceModal, setEditingDevice, toggleMaintenance, deleteDevice } = usePlayZone();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg md:text-xl font-bold">إدارة الأجهزة</h3>
        <button onClick={() => setShowAddDeviceModal(true)}
          className="px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold text-sm md:text-base text-white"
          style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
          <i className="fa-solid fa-plus ml-2"></i>
          <span className="hidden md:inline">إضافة جهاز</span>
          <span className="md:hidden">إضافة</span>
        </button>
      </div>
      <div className="devices-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {rooms.map(room => (
          <div key={room.id} className="bg-gray-900/50 rounded-2xl border border-purple-500/30 p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl md:text-2xl font-bold">جهاز {room.number}</h3>
              <span className="bg-purple-600 px-3 py-1 rounded-full text-sm font-bold">{room.type}</span>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">الحالة</p>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                room.status === 'available' ? 'bg-green-600' :
                room.status === 'busy' ? 'bg-red-600' :
                room.status === 'maintenance' ? 'bg-gray-600' : 'bg-yellow-600'
              }`}>{statusText[room.status] || room.status}</span>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">الألعاب المدعومة</p>
              <div className="flex flex-wrap gap-2">
                {room.games.map((game, i) => (
                  <span key={i} className="bg-gray-800 px-3 py-1 rounded-lg text-sm">{game}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => toggleMaintenance(room.id)}
                disabled={room.status === 'busy'}
                className="bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 py-2 rounded-lg text-sm font-bold disabled:opacity-50 text-white">
                <i className="fa-solid fa-tools ml-1"></i>
                {room.status === 'maintenance' ? 'تشغيل' : 'صيانة'}
              </button>
              <button onClick={() => deleteDevice(room.id)}
                disabled={room.status === 'busy'}
                className="bg-red-600 hover:bg-red-700 active:bg-red-800 py-2 rounded-lg text-sm font-bold disabled:opacity-50 text-white">
                <i className="fa-solid fa-trash ml-1"></i>حذف
              </button>
              <button onClick={() => { setEditingDevice(room); setShowEditDeviceModal(true); }}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 py-2 rounded-lg text-sm font-bold text-white">
                <i className="fa-solid fa-edit ml-1"></i>تعديل
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
