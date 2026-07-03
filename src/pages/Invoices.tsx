import { useState, useEffect } from 'react';
import { usePlayZone, ReceiptData, parseUTCDate } from '../PlayZoneContext';

export default function Invoices() {
  const { loadReceipts, receipts, setShowReceiptDetail, showReceiptDetail, deleteReceipt, deleteAllReceipts } = usePlayZone();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [day, setDay] = useState('');

  useEffect(() => {
    loadReceipts(year, month, day ? parseInt(day) : undefined);
  }, []);

  const search = () => loadReceipts(year, month, day ? parseInt(day) : undefined);

  const totalTimeCharge = receipts.reduce((s, r) => s + r.timeCharge, 0);
  const totalOrders = receipts.reduce((s, r) => s + r.ordersTotal, 0);
  const totalRevenue = receipts.reduce((s, r) => s + r.grandTotal, 0);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;
    await deleteReceipt(id);
    search();
  };

  const handleDeleteAll = async () => {
    if (receipts.length === 0) return;
    if (!confirm(`هل أنت متأكد من حذف جميع الفواتير (${receipts.length})؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    if (!confirm('تأكيد مرة أخرى: حذف كل الفواتير?')) return;
    await deleteAllReceipts(year, month);
    search();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Summary */}
      {receipts.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 text-center">
            <div className="text-xs text-gray-400 mb-1">وقت اللعب</div>
            <div className="text-lg font-bold text-purple-400">{totalTimeCharge.toFixed(2)} ج</div>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 text-center">
            <div className="text-xs text-gray-400 mb-1">الأوردرات</div>
            <div className="text-lg font-bold text-yellow-400">{totalOrders.toFixed(2)} ج</div>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 text-center">
            <div className="text-xs text-gray-400 mb-1">الإجمالي</div>
            <div className="text-lg font-bold text-green-400">{totalRevenue.toFixed(2)} ج</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div>
          <label className="block text-xs text-gray-400 mb-1">السنة</label>
          <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || now.getFullYear())}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 w-20 text-sm focus:outline-none focus:border-purple-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">الشهر</label>
          <input type="number" min="1" max="12" value={month} onChange={e => setMonth(parseInt(e.target.value) || 1)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 w-20 text-sm focus:outline-none focus:border-purple-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">اليوم</label>
          <input type="number" min="1" max="31" value={day} onChange={e => setDay(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 w-20 text-sm focus:outline-none focus:border-purple-500" placeholder="الكل" />
        </div>
        <button onClick={search} className="mt-5 px-4 py-2 rounded-lg text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
          <i className="fa-solid fa-search ml-2"></i>بحث
        </button>
        {receipts.length > 0 && (
          <button onClick={handleDeleteAll} className="mt-5 px-4 py-2 rounded-lg text-sm font-bold bg-red-600/80 hover:bg-red-600 text-white">
            <i className="fa-solid fa-trash ml-2"></i>حذف الكل
          </button>
        )}
      </div>

      <div className="bg-gray-900/50 rounded-2xl border border-purple-500/30 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-700">
          <h3 className="text-lg md:text-xl font-bold">سجل الفواتير {receipts.length > 0 && `(${receipts.length})`}</h3>
        </div>
        {receipts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">لا توجد فواتير</div>
        ) : (
          <div className="divide-y divide-gray-700">
            {receipts.map((r: ReceiptData) => (
              <div key={r.id} className="p-4 hover:bg-gray-800/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold truncate">{r.deviceName}</span>
                    <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded">{r.deviceType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowReceiptDetail(r)} className="text-blue-400 hover:text-blue-300 shrink-0 p-1">
                      <i className="fa-solid fa-eye"></i>
                    </button>
                    <button onClick={e => handleDelete(r.id, e)} className="text-red-400 hover:text-red-300 shrink-0 p-1">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs">التاريخ</span>
                    <span className="text-xs">{parseUTCDate(r.createdAt).toLocaleString('ar-EG')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">المدة</span>
                    <span>{r.totalDuration}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">طريقة الدفع</span>
                    <span className="text-xs">{r.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">وقت اللعب</span>
                    <span className="font-bold">{r.timeCharge} ج</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">أوردرات</span>
                    <span>{r.ordersTotal} ج</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-500">{r.totalDuration}</span>
                  <span className="font-bold text-purple-400">{r.grandTotal} ج</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Detail Modal */}
      {showReceiptDetail && (
        <div className="fixed inset-0 bg-black/70 modal-overlay z-50 flex items-center justify-center p-0 md:p-4" onClick={() => setShowReceiptDetail(null)}>
          <div className="modal-content bg-gray-900 rounded-2xl max-w-md w-full border border-purple-500/30 overflow-y-auto max-h-screen md:max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-900">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">تفاصيل الفاتورة</h2>
                <button onClick={() => setShowReceiptDetail(null)} className="text-gray-400 hover:text-white p-2"><i className="fa-solid fa-times text-xl"></i></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">الجهاز</span>
                  <span className="font-bold">{showReceiptDetail.deviceName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">النوع</span>
                  <span className="font-bold">{showReceiptDetail.deviceType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">طريقة الدفع</span>
                  <span className="font-bold">{showReceiptDetail.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">البداية</span>
                  <span className="text-sm">{parseUTCDate(showReceiptDetail.startTime).toLocaleString('ar-EG')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">النهاية</span>
                  <span className="text-sm">{parseUTCDate(showReceiptDetail.endTime).toLocaleString('ar-EG')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">المدة</span>
                  <span className="font-bold">{showReceiptDetail.totalDuration}</span>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <p className="text-sm font-semibold mb-2">تفاصيل الوقت:</p>
                  {showReceiptDetail.modeEntries.map((m, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{m.duration} × {m.mode}</span>
                      <span className="font-bold">{m.charge} ج</span>
                    </div>
                  ))}
                </div>
                {showReceiptDetail.orderItems.length > 0 && (
                  <div className="border-t border-gray-700 pt-3">
                    <p className="text-sm font-semibold mb-2">الأوردرات:</p>
                    {showReceiptDetail.orderItems.map((o, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{o.name} x{o.quantity}</span>
                        <span className="font-bold">{o.total} ج</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400">تكلفة اللعب</span>
                    <span className="font-bold">{showReceiptDetail.timeCharge} ج</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400">الأوردرات</span>
                    <span className="font-bold">{showReceiptDetail.ordersTotal} ج</span>
                  </div>
                  <div className="flex items-center justify-between text-xl font-bold text-purple-400 pt-2 border-t border-gray-700">
                    <span>الإجمالي</span>
                    <span>{showReceiptDetail.grandTotal} ج</span>
                  </div>
                </div>
              </div>
              <button onClick={e => handleDelete(showReceiptDetail.id, e as any)} className="w-full py-2 rounded-lg text-sm font-bold bg-red-600/80 hover:bg-red-600 text-white">
                <i className="fa-solid fa-trash ml-2"></i>حذف الفاتورة
              </button>
              <div className="text-center text-xs text-gray-500">{parseUTCDate(showReceiptDetail.createdAt).toLocaleString('ar-EG')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
