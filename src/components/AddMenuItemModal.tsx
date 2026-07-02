import { useState } from 'react';
import { usePlayZone, FA_ICONS } from '../PlayZoneContext';

export default function AddMenuItemModal() {
  const { setShowAddMenuItemModal, addMenuItem, updateMenuItem, editingMenuItem } = usePlayZone();
  const [name, setName] = useState(editingMenuItem?.name || '');
  const [price, setPrice] = useState(editingMenuItem?.price?.toString() || '');
  const [icon, setIcon] = useState(editingMenuItem?.icon || 'fa-solid fa-utensils');

  const isEdit = !!editingMenuItem;

  const handleSave = () => {
    if (isEdit) {
      updateMenuItem(editingMenuItem.id, name, parseInt(price) || 0, icon);
    } else {
      addMenuItem(name, parseInt(price) || 0, icon);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 modal-overlay z-50 flex items-center justify-center p-0 md:p-4" onClick={() => setShowAddMenuItemModal(false)}>
      <div className="modal-content bg-gray-900 rounded-2xl max-w-md w-full border border-purple-500/30 overflow-y-auto max-h-screen md:max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold">{isEdit ? 'تعديل الصنف' : 'إضافة صنف جديد'}</h2>
            <button onClick={() => setShowAddMenuItemModal(false)} className="text-gray-400 hover:text-white p-2"><i className="fa-solid fa-times text-xl"></i></button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">اسم الصنف</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: ريد بول"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">السعر</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="25"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">الأيقونة</label>
            <div className="grid grid-cols-4 gap-2 bg-gray-800 border border-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto">
              {FA_ICONS.filter(item => !item.group).map(item => (
                <button key={item.value} type="button" onClick={() => setIcon(item.value!)}
                  className={`p-2 rounded-lg text-center transition ${
                    icon === item.value
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`} title={item.label}>
                  <i className={`${item.value} text-xl`}></i>
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSave}
            className="w-full text-white font-bold py-4 rounded-lg"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <i className={`fa-solid ${isEdit ? 'fa-pen' : 'fa-plus'} ml-2`}></i>
            {isEdit ? 'تعديل الصنف' : 'إضافة الصنف'}
          </button>
        </div>
      </div>
    </div>
  );
}
