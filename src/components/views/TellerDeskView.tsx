import React, { useState } from 'react';
import { FinancialTransaction, StaffMember, SystemUser } from '../../types';
import { storage } from '../../services/storage';
import { formatBDT } from '../../utils/formatters';
import {
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  ShieldCheck,
  PlusCircle,
  FileCheck,
  Printer,
  X,
  Wallet,
} from 'lucide-react';

interface TellerDeskViewProps {
  currentDate: string;
  currentUser: SystemUser;
  onOpenNewVisit: () => void;
}

export const TellerDeskView: React.FC<TellerDeskViewProps> = ({
  currentDate,
  currentUser,
  onOpenNewVisit,
}) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() =>
    storage.getTransactions({ date: currentDate })
  );
  const [staffList] = useState<StaffMember[]>(() => storage.getAllStaff());
  const [isQuickTxnOpen, setIsQuickTxnOpen] = useState(false);
  const [txnType, setTxnType] = useState<'GIVEN' | 'TAKEN'>('GIVEN');

  // Quick Counter Transaction State
  const [selectedDsrId, setSelectedDsrId] = useState(staffList.find(s => s.role === 'DSR')?.id || '');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'bKash' | 'Bank Transfer'>('Cash');

  const refreshTxns = () => {
    setTransactions(storage.getTransactions({ date: currentDate }));
  };

  const dsrStaff = staffList.filter(s => s.role === 'DSR');

  // Calculations
  const drawerBase = 200000; // Teller opening float
  const totalReceived = transactions
    .filter(t => t.type === 'GIVEN')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDisbursed = transactions
    .filter(t => t.type === 'TAKEN')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentVaultCash = drawerBase + totalReceived - totalDisbursed;

  const handlePostTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const dsr = staffList.find(s => s.id === selectedDsrId);
    if (!dsr || !amount || Number(amount) <= 0) return;

    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    storage.addSingleTransaction({
      type: txnType,
      dsrId: dsr.id,
      dsrName: dsr.name,
      date: currentDate,
      time: timeStr,
      amount: Number(amount),
      reason: reason || (txnType === 'GIVEN' ? 'Daily Collection Counter Deposit' : 'Field Operational Advance'),
      paymentMode,
      verifiedBy: `${currentUser.displayName} (টেলার)`,
      remarks: 'Posted via Teller Cash Desk Counter',
    });

    storage.addAuditLog({
      actor: currentUser.displayName,
      role: currentUser.role,
      action: txnType === 'GIVEN' ? 'RECEIVE_COLLECTION' : 'DISBURSE_FLOAT',
      module: 'TELLER',
      details: `Teller posted ${txnType} ৳${Number(amount).toLocaleString()} for ${dsr.name}.`,
    });

    refreshTxns();
    setIsQuickTxnOpen(false);
    setAmount('');
    setReason('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 p-5 rounded-2xl border border-amber-800/40 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white">
              টেলার ক্যাশ কাউন্টার ও ভল্ট ব্যালেন্সিং (Teller Desk)
            </h2>
          </div>
          <p className="text-xs text-amber-200/70 mt-1">
            ডিএসআর কালেকশন ক্যাশ গ্রহণ, ফিল্ড ফ্লোট বিতরণ এবং ট্রেজারি হিসাব মিলকরণ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setTxnType('GIVEN');
              setIsQuickTxnOpen(true);
            }}
            id="teller-receive-btn"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>+ ডিএসআর কালেকশন গ্রহণ (Receive)</span>
          </button>

          <button
            onClick={() => {
              setTxnType('TAKEN');
              setIsQuickTxnOpen(true);
            }}
            id="teller-disburse-btn"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>- ফ্লোট বিতরণ (Disburse)</span>
          </button>
        </div>
      </div>

      {/* Drawer Balancing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Opening Drawer Float */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>ওপেনিং ক্যাশ ড্রয়ার ফ্লোট</span>
            <Wallet className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {formatBDT(drawerBase)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ট্রেজারি থেকে প্রাপ্ত সকালের প্রারম্ভিক ক্যাশ</p>
        </div>

        {/* Total Cash Received */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
            <span>আজ মোট প্রাপ্তি (+ GIVEN)</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 mt-2">
            {formatBDT(totalReceived)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ডিএসআরদের মার্কেট কালেকশন জমা</p>
        </div>

        {/* Total Float Disbursed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-rose-700">
            <span>আজ মোট বিতরণ (- TAKEN)</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-700 mt-2">
            {formatBDT(totalDisbursed)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">দৈনিক ফিল্ড খরচ ও ট্রানজিট ফ্লোট</p>
        </div>

        {/* Closing Vault Balance */}
        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900">
            <span>বর্তমান ভল্ট ক্যাশ ব্যালেন্স</span>
            <Coins className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-xl font-black text-amber-900 mt-2">
            {formatBDT(currentVaultCash)}
          </div>
          <p className="text-[11px] text-amber-700 mt-1">প্রারম্ভিক + প্রাপ্তি - বিতরণ</p>
        </div>
      </div>

      {/* Today's Counter Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              আজকের ক্যাশ কাউন্টার ভাউচার ও রসিদ লগ ({transactions.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">তারিখ: {currentDate}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/70 text-[10.5px] font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">ভাউচার নং ও সময়</th>
                <th className="py-2.5 px-4">লেনদেনের ধরন</th>
                <th className="py-2.5 px-4">ডিএসআর নাম</th>
                <th className="py-2.5 px-4">বিবরণ / কারণ</th>
                <th className="py-2.5 px-4">মাধ্যম</th>
                <th className="py-2.5 px-4 text-right">পরিমাণ (BDT)</th>
                <th className="py-2.5 px-4 text-center">যাচাইকারী</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map(txn => (
                <tr key={txn.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono">
                    <div className="font-bold text-slate-900">{txn.voucherNo}</div>
                    <div className="text-[10px] text-slate-400">{txn.time}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        txn.type === 'GIVEN'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {txn.type === 'GIVEN' ? 'জমা গ্রহণ (GIVEN)' : 'ফ্লোট প্রদান (TAKEN)'}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900">{txn.dsrName}</td>

                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{txn.reason}</td>

                  <td className="py-3 px-4">
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      {txn.paymentMode}
                    </span>
                  </td>

                  <td
                    className={`py-3 px-4 text-right font-black font-mono text-sm ${
                      txn.type === 'GIVEN' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {formatBDT(txn.amount)}
                  </td>

                  <td className="py-3 px-4 text-center text-[11px] text-slate-500">
                    {txn.verifiedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Transaction Modal */}
      {isQuickTxnOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-800">
                  {txnType === 'GIVEN'
                    ? 'ডিএসআর ক্যাশ গ্রহণ রসিদ (Receive Money Given)'
                    : 'ডিএসআর ফ্লোট বিতরণ ভাউচার (Disburse Money Taken)'}
                </h3>
              </div>
              <button
                onClick={() => setIsQuickTxnOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostTransaction} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ডিএসআর নির্বাচন করুন *</label>
                <select
                  value={selectedDsrId}
                  onChange={e => setSelectedDsrId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500 bg-white"
                >
                  {dsrStaff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.staffCode}) — {s.route || 'রুট'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">টাকার পরিমাণ (BDT ৳) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500 font-mono text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">পেমেন্ট মাধ্যম *</label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500 bg-white"
                  >
                    <option value="Cash">Cash (নগদ টাকা)</option>
                    <option value="bKash">bKash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">উদ্দেশ্য / বিবরণ</label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={
                    txnType === 'GIVEN'
                      ? 'যেমন: ধানমন্ডি রিটেইলার মার্কেট কালেকশন'
                      : 'যেমন: দৈনিক মোটরসাইকেল ফুয়েল ও টিএ-ডিএ'
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickTxnOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl font-bold transition shadow-xs cursor-pointer ${
                    txnType === 'GIVEN' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {txnType === 'GIVEN' ? 'জমা গ্রহণ নিশ্চিত করুন' : 'বিতরণ নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
