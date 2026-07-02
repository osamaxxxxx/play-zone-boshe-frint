import { useState, useRef } from 'react';
import { usePlayZone } from '../PlayZoneContext';

const paymentMethods = [
  { key: 'cash', icon: 'fa-solid fa-money-bill-wave', label: 'كاش', color: 'border-green-500' },
  { key: 'vodafone', icon: 'fa-solid fa-mobile-alt', label: 'فودافون كاش', color: 'border-red-500' },
  { key: 'instapay', icon: 'fa-solid fa-university', label: 'إنستا باي', color: 'border-blue-500' },
];

export default function InvoiceModal() {
  const { selectedPayment, setSelectedPayment, setShowInvoiceModal, confirmPayment, invoiceDataRef } = usePlayZone();
  const [paid, setPaid] = useState(false);
  const [customPlayCost, setCustomPlayCost] = useState<number | null>(null);
  const [useCustomCost, setUseCustomCost] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const inv = invoiceDataRef?.current;
  if (!inv) return null;

  const playCost = useCustomCost ? (customPlayCost ?? inv.playCost) : inv.playCost;
  const totalCost = Math.round(playCost + inv.ordersCost);

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>فاتورة</title>
      <style>
        body { font-family: 'Courier New', monospace; margin: 20px; text-align: center; }
        h1 { font-size: 18px; margin-bottom: 5px; }
        hr { border: 1px dashed #000; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        td { padding: 4px 0; }
        .total { font-size: 18px; font-weight: bold; margin-top: 10px; }
        .footer { font-size: 11px; color: #666; margin-top: 15px; }
      </style></head><body>
      <h1>🧾 Play Zone</h1>
      <p>${inv.room}</p>
      <p>${new Date().toLocaleString('ar-EG')}</p>
      <hr>
      <table>
        <tr><td>المدة</td><td>${inv.duration}</td></tr>
        ${(inv.breakdown || []).map((b: any) => `
          <tr><td>${b.duration} دقيقة × ${b.mode === 'single' ? 'Single' : 'Multi'}</td><td>${b.cost} ج</td></tr>
        `).join('')}
        <tr><td>تكلفة اللعب</td><td>${playCost} ج</td></tr>
        <tr><td>الأوردرات</td><td>${inv.ordersCost} ج</td></tr>
        <tr><td>طريقة الدفع</td><td>${paymentMethods.find(p => p.key === selectedPayment)?.label || selectedPayment}</td></tr>
      </table>
      <hr>
      <div class="total">الإجمالي: ${totalCost} ج</div>
      <div class="footer">شكراً لزيارتكم</div>
      <script>window.onload = () => { window.print(); window.close(); }</script>
      </body></html>`);
    win.document.close();
  };

  const handleConfirm = async () => {
    if (useCustomCost) {
      inv.playCost = playCost;
      inv.totalCost = totalCost;
      inv.timeCharge = playCost;
      inv.grandTotal = totalCost;
    }
    setPaid(true);
    await confirmPayment();
  };

  return (
    <div className="fixed inset-0 bg-black/70 modal-overlay z-50 flex items-center justify-center p-0 md:p-4" onClick={() => setShowInvoiceModal(false)}>
      <div className="modal-content bg-gray-900 rounded-2xl max-w-md w-full border border-purple-500/30 overflow-y-auto max-h-screen md:max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-900">
          <h2 className="text-xl md:text-2xl font-bold text-center">الفاتورة</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">الغرفة</span>
              <span className="font-bold">{inv.room}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">المدة</span>
              <span className="font-bold">{inv.duration}</span>
            </div>
            <div className="border-t border-gray-700 pt-3">
              <div className="space-y-2 mb-3">
                {inv.breakdown.map((b: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{b.duration} دقيقة × {b.mode === 'single' ? 'Single' : 'Multi'}</span>
                    <span className="font-bold">{b.cost} ج</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-700 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">تكلفة اللعب</span>
                <span className="font-bold">{playCost} ج</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">الأوردرات</span>
                <span className="font-bold">{inv.ordersCost} ج</span>
              </div>
              <div className="flex items-center justify-between text-xl font-bold text-purple-400 pt-2 border-t border-gray-700">
                <span>الإجمالي</span>
                <span>{totalCost} ج</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium">تعديل سعر اللعب</label>
              <button onClick={() => { setUseCustomCost(!useCustomCost); if (!useCustomCost) setCustomPlayCost(inv.playCost); }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  useCustomCost ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}>
                {useCustomCost ? 'مفعل' : 'تعديل'}
              </button>
            </div>
            {useCustomCost && (
              <input type="number" value={customPlayCost ?? ''} onChange={e => setCustomPlayCost(parseFloat(e.target.value) || 0)}
                placeholder="أدخل السعر المخصص"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">طريقة الدفع</label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map(pm => (
                <button key={pm.key} onClick={() => setSelectedPayment(pm.key)}
                  className={`bg-gray-800 border-2 rounded-lg p-3 text-center transition ${
                    selectedPayment === pm.key ? pm.color : 'border-gray-700'
                  }`}>
                  <i className={`${pm.icon} text-xl mb-1`}></i>
                  <p className="text-xs">{pm.label}</p>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleConfirm} disabled={paid}
            className="w-full text-white font-bold py-4 rounded-lg disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <i className="fa-solid fa-check ml-2"></i>
            {paid ? 'تم الدفع' : 'تأكيد الدفع'}
          </button>
          <button onClick={handlePrint}
            className="w-full font-bold py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition">
            <i className="fa-solid fa-print ml-2"></i>
            طباعة الفاتورة
          </button>
        </div>
      </div>
    </div>
  );
}
