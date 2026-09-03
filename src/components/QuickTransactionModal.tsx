import React, { useState } from 'react';
import { DSRStaff, MovementType } from '../types';
import { formatBDT, getTodayDateString } from '../utils/formatters';
import { storage } from '../services/storage';
import { SignaturePad } from './SignaturePad';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  FileCheck2,
  Calendar,
  Clock,
  User,
  ShieldCheck,
} from 'lucide-react';

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffList: DSRStaff[];
  selectedDate?: string;
}

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
  selectedDate,
}) => {
  const [type, setType] = useState<MovementType>('GIVEN');
  const [staffId, setStaffId] = useState<string>(staffList[0]?.id || '');
  const [date, setDate] = useState<string>(selectedDate || getTodayDateString());
  const [time, setTime] = useState<string>('02:30 PM');
  const [amount, setAmount] = useState<number>(10000);
  const [reason, setReason] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'bKash' | 'Bank Transfer'>('Cash');
  const [verifiedBy, setVerifiedBy] = useState<string>('Cashier / Accounts Officer');
  const [remarks, setRemarks] = useState<string>('');
  const [signature, setSignature] = useState<string>('');

  if (!isOpen) return null;

  const currentStaff = staffList.find(s => s.id === staffId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId || !amount || amount <= 0) {
      alert('Please fill in valid DSR and amount.');
      return;
    }

    storage.addSingleTransaction({
      type,
      dsrId: staffId,
      dsrName: currentStaff?.name || 'DSR Staff',
      date,
      time,
      amount: Number(amount),
      reason: reason || (type === 'GIVEN' ? 'Market Cash Deposit' : 'Field Operational Advance'),
      paymentMode,
      verifiedBy,
      remarks,
      signature,
    });

    onSuccess();
    onClose();
  };

  const isGiven = type === 'GIVEN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div
          className={`px-6 py-4 text-white flex items-center justify-between transition ${
            isGiven
              ? 'bg-gradient-to-r from-emerald-800 to-slate-900'
              : 'bg-gradient-to-r from-amber-800 to-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {isGiven ? (
              <ArrowDownRight className="w-5 h-5 text-emerald-300" />
            ) : (
              <ArrowUpRight className="w-5 h-5 text-amber-300" />
            )}
            <div>
              <h3 className="font-bold text-base">
                Post Standalone {isGiven ? 'Money Given' : 'Money Taken'} Voucher
              </h3>
              <p className="text-[11px] text-slate-200">
                Independent financial voucher committed directly to audit ledger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Movement Type Toggle */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Financial Movement Classification *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('GIVEN')}
                className={`py-2 px-3 rounded-lg font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  isGiven
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                Money Given To Office
              </button>
              <button
                type="button"
                onClick={() => setType('TAKEN')}
                className={`py-2 px-3 rounded-lg font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  !isGiven
                    ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-amber-600" />
                Money Taken From Office
              </button>
            </div>
          </div>

          {/* DSR Select */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              DSR Staff Member *
            </label>
            <select
              value={staffId}
              onChange={e => setStaffId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white"
              required
            >
              {staffList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.staffCode}) - {s.route}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Transaction Amount (৳) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">
                ৳
              </span>
              <input
                type="number"
                min="1"
                value={amount || ''}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full text-sm font-mono font-bold pl-7 pr-3 py-2 rounded-lg border border-slate-300"
                placeholder="e.g. 25000"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Formatted: <span className="font-bold text-slate-800">{formatBDT(amount)}</span>
            </p>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Transaction Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Time
              </label>
              <input
                type="text"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                placeholder="02:30 PM"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason / Purpose *
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              placeholder={
                isGiven
                  ? 'e.g. Supplementary afternoon cash collection from retail stores'
                  : 'e.g. Urgent vehicle fuel & roadside allowance'
              }
              required
            />
          </div>

          {/* Mode & Verifier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              >
                <option value="Cash">Cash Currency</option>
                <option value="bKash">bKash MFS</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Verified By
              </label>
              <input
                type="text"
                value={verifiedBy}
                onChange={e => setVerifiedBy(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          {/* Signature */}
          <div>
            <SignaturePad
              label="DSR Signature"
              onSave={setSignature}
              initialSignature={signature}
            />
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-bold text-white rounded-lg cursor-pointer shadow-xs transition ${
                isGiven
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              Post & Commit Voucher
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
