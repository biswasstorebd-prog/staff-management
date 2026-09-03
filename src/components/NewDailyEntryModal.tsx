import React, { useState, useEffect } from 'react';
import { DSRStaff, DailyDSRVisitForm } from '../types';
import { formatBDT, getTodayDateString } from '../utils/formatters';
import { storage } from '../services/storage';
import { SignaturePad } from './SignaturePad';
import {
  X,
  Calendar,
  Clock,
  User,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface NewDailyEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffList: DSRStaff[];
  selectedDate?: string;
  initialDsrId?: string;
}

const COMMON_GIVEN_REASONS = [
  'মূল ব্যাংক থেকে ক্যাশ ও ব্যালেন্স রিফিল সরবরাহ (Bank Requisition Refill for Outlet)',
  'কাস্টমার ক্যাশ উত্তোলন মেটাতে জরুরি ক্যাশ সরবরাহ (Emergency Cash Refill for Cash-out)',
  'ইলেকট্রনিক ব্যালেন্স / লিমিট রিফিল সরবরাহ (Electronic Float / Balance Refill)',
  'রেমিট্যান্স পেমেন্ট ফান্ড রিফিল (Foreign Remittance Disbursement Fund)',
  'সরকারি ভাতা / বয়স্ক ভাতা বিতরণের স্পেশাল ক্যাশ ডেলিভারি (Social Safety Allowance Cash)',
  'অন্যান্য ক্যাশ বা ব্যালেন্স সরবরাহ (Other Requisition Settlement)',
];

const COMMON_TAKEN_REASONS = [
  'আউটলেটের উদ্বৃত্ত ক্যাশ মূল ব্যাংকে জমা প্রেরণ (Excess Cash Sent to Main Bank via DSR)',
  'ইলেকট্রনিক ব্যালেন্স ক্রয়ের বিপরীতে নগদ ক্যাশ প্রদান (Cash Given for Electronic Balance Purchase)',
  'দিনের শেষ ক্যাশ উদ্বৃত্ত মূল ব্যাংকে ফেরত (Day-End Cash Surplus Returned to Main Bank)',
  'কাস্টমার ডিপোজিট ফান্ড মূল ব্যাংকে হস্তান্তর (Customer Deposit Collected Sent to Principal Bank)',
  'ব্যাংক চালান ও কমিশন সমন্বয় (Bank Challan & Fee Adjustment)',
  'অন্যান্য ক্যাশ মূল ব্যাংকে ফেরত (Other Cash Return to Bank)',
];

export const NewDailyEntryModal: React.FC<NewDailyEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
  selectedDate,
  initialDsrId,
}) => {
  const defaultDate = selectedDate || getTodayDateString();
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    initialDsrId || (staffList[0]?.id || '')
  );

  const currentStaff = staffList.find(s => s.id === selectedStaffId);

  const [date, setDate] = useState<string>(defaultDate);
  const [arrivalTime, setArrivalTime] = useState<string>('09:15 AM');
  const [departureTime, setDepartureTime] = useState<string>('05:10 PM');
  const [openingBalance, setOpeningBalance] = useState<number>(
    currentStaff?.baseOpeningBalance || 5000
  );

  // Agent Banking Specific Fields
  const [parentBank, setParentBank] = useState<string>(
    currentStaff?.parentBank || 'Sonali Bank PLC (Principal Branch)'
  );
  const [requisitionNo, setRequisitionNo] = useState<string>(
    `REQ-BNK-${getTodayDateString().replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [medium, setMedium] = useState<'Cash' | 'Electronic Balance' | 'Both'>('Cash');

  // Money Given fields (Delivered from Bank to Outlet)
  const [moneyGivenToOffice, setMoneyGivenToOffice] = useState<boolean>(true);
  const [amountGiven, setAmountGiven] = useState<number>(50000);
  const [givenReason, setGivenReason] = useState<string>(COMMON_GIVEN_REASONS[0]);

  // Money Taken fields (Sent from Outlet to Bank via DSR)
  const [moneyTakenFromOffice, setMoneyTakenFromOffice] = useState<boolean>(true);
  const [amountTaken, setAmountTaken] = useState<number>(20000);
  const [takenReason, setTakenReason] = useState<string>(COMMON_TAKEN_REASONS[0]);

  // Remarks & Signature
  const [remarks, setRemarks] = useState<string>('');
  const [dsrSignature, setDsrSignature] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Update opening balance & bank when staff changes
  useEffect(() => {
    if (currentStaff) {
      setOpeningBalance(currentStaff.baseOpeningBalance || 0);
      if (currentStaff.parentBank) {
        setParentBank(currentStaff.parentBank);
      }
    }
  }, [currentStaff]);

  if (!isOpen) return null;

  // Live Calculations
  const calculatedGiven = moneyGivenToOffice ? Number(amountGiven) || 0 : 0;
  const calculatedTaken = moneyTakenFromOffice ? Number(amountTaken) || 0 : 0;
  const netPosition = calculatedGiven - calculatedTaken; // Given - Taken
  const closingBalance = openingBalance + netPosition; // Total Net effect

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      alert('অনুগ্রহ করে একজন ডিএসআর (ব্যাংক প্রতিনিধি) নির্বাচন করুন');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: DailyDSRVisitForm = {
        dsrId: selectedStaffId,
        dsrName: currentStaff?.name || 'Unknown DSR',
        date,
        arrivalTime,
        departureTime,
        openingBalance,
        moneyGivenToOffice,
        amountGiven: calculatedGiven,
        givenReason,
        moneyTakenFromOffice,
        amountTaken: calculatedTaken,
        takenReason,
        parentBank,
        requisitionNo,
        medium,
        remarks: remarks || `মূল ব্যাংক ডিএসআর ডেলিভারি এন্ট্রি - ${currentStaff?.name || 'DSR'}`,
        dsrSignature,
      };

      storage.recordDailyVisit(payload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('ডিএসআর ক্যাশ ও ব্যালেন্স এন্ট্রি সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      id="new-entry-modal-backdrop"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col"
        id="new-entry-modal-card"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold tracking-tight">
                মূল ব্যাংক ডিএসআর ক্যাশ ও ব্যালেন্স ডেলিভারি এন্ট্রি (DSR Cash & Balance Movement)
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              মূল ব্যাংক থেকে ক্যাশ/ব্যালেন্স রিফিল (Given) ও আউটলেটের উদ্বৃত্ত ক্যাশ ব্যাংকে প্রেরণ (Taken) সম্পূর্ণ স্বতন্ত্র আর্থিক ভাউচারে সংরক্ষিত
            </p>
          </div>
          <button
            onClick={onClose}
            id="close-daily-entry-btn"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Agent Banking Policy Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">এজেন্ট ব্যাংকিং কার্যপ্রক্রিয়া:</span> ডিএসআর মূল ব্যাংক কর্তৃক নিয়োগপ্রাপ্ত প্রতিনিধি। তিনি আউটলেটের চাহিদা মোতাবেক ব্যাংক থেকে ক্যাশ বা ইলেকট্রনিক ব্যালেন্স ডেলিভারি করেন এবং অতিরিক্ত ক্যাশ ব্যাংকে জমা নিয়ে যান।
            </div>
          </div>

          {/* Top Row: DSR Selection, Parent Bank, Requisition */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                ১. মূল ব্যাংক ডিএসআর ও রিকুইজিশন তথ্য (DSR & Bank Requisition)
              </span>
              <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                ব্যাংক প্রতিনিধি ভেরিফিকেশন
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* DSR Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মূল ব্যাংক ডিএসআর (প্রতিনিধি) *
                </label>
                <select
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                  id="dsr-select-dropdown"
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.staffCode}) - {s.parentBank || 'Principal Bank'}
                    </option>
                  ))}
                </select>
                {currentStaff && (
                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                    নিয়োগকর্তা: <span className="text-slate-700 font-medium">{currentStaff.parentBank || 'মূল ব্যাংক'}</span>
                  </p>
                )}
              </div>

              {/* Requisition Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  রিকুইজিশন স্লিপ নম্বর (Requisition No.) *
                </label>
                <input
                  type="text"
                  value={requisitionNo}
                  onChange={e => setRequisitionNo(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="REQ-BNK-..."
                  required
                />
              </div>

              {/* Delivery Medium */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ডেলিভারি মাধ্যম (Medium) *
                </label>
                <select
                  value={medium}
                  onChange={e => setMedium(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="Cash">ক্যাশ কারেন্সি (Physical Cash)</option>
                  <option value="Electronic Balance">ইলেকট্রনিক ব্যালেন্স / লিমিট (E-Balance)</option>
                  <option value="Both">উভয় (Cash + E-Balance)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  তারিখ (Delivery Date) *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  id="entry-date-input"
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Arrival & Departure Times */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  আউটলেটে পৌঁছানোর সময় (Arrival)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={arrivalTime}
                    onChange={e => setArrivalTime(e.target.value)}
                    id="arrival-time-input"
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    placeholder="e.g. 09:15 AM"
                  />
                  <button
                    type="button"
                    onClick={() => setArrivalTime('09:15 AM')}
                    className="text-[11px] px-2 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition whitespace-nowrap cursor-pointer"
                  >
                    09:15 AM
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-600" />
                  হস্তান্তর শেষে প্রস্থান (Departure)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={departureTime}
                    onChange={e => setDepartureTime(e.target.value)}
                    id="departure-time-input"
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    placeholder="e.g. 05:10 PM"
                  />
                  <button
                    type="button"
                    onClick={() => setDepartureTime('05:10 PM')}
                    className="text-[11px] px-2 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition whitespace-nowrap cursor-pointer"
                  >
                    05:10 PM
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Separate Financial Movements */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ২. ক্যাশ ও ব্যালেন্স লেনদেন হিসাব (Independent Financial Records)
              </span>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                বাধ্যতামূলক নিয়ম: Given এবং Taken আলাদা ভাউচারে সংরক্ষিত
              </span>
            </div>

            {/* BLOCK A: Money Given To Office */}
            <div
              className={`p-4 rounded-xl border transition ${
                moneyGivenToOffice
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : 'border-slate-200 bg-slate-50 opacity-80'
              }`}
              id="money-given-section"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      মূল ব্যাংক থেকে ক্যাশ / ব্যালেন্স সরবরাহ (Given to Outlet — Cash & Balance Inflow)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      আউটলেটের চাহিদা মতো ডিএসআর মূল ব্যাংক থেকে যে ক্যাশ বা ব্যালেন্স আউটলেটে হস্তান্তর করেছেন
                    </p>
                  </div>
                </div>

                {/* Yes/No Toggle */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setMoneyGivenToOffice(true)}
                    id="money-given-yes-btn"
                    className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                      moneyGivenToOffice
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Yes (গৃহীত)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMoneyGivenToOffice(false);
                      setAmountGiven(0);
                    }}
                    id="money-given-no-btn"
                    className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                      !moneyGivenToOffice
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    No (নেই)
                  </button>
                </div>
              </div>

              {moneyGivenToOffice && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-emerald-200/70">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      সরবরাহকৃত টাকার পরিমাণ (Amount Given) ৳ *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">
                        ৳
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={amountGiven || ''}
                        onChange={e => setAmountGiven(Number(e.target.value) || 0)}
                        id="amount-given-input"
                        placeholder="e.g. 50000"
                        className="w-full text-sm font-mono font-bold pl-7 pr-3 py-2 rounded-lg border border-emerald-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        required={moneyGivenToOffice}
                      />
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium mt-1">
                      {formatBDT(calculatedGiven)} (ক্রেডিট ভাউচার V-GIV তৈরি হবে)
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      সরবরাহের কারণ / খাত (Given Reason) *
                    </label>
                    <select
                      value={givenReason}
                      onChange={e => setGivenReason(e.target.value)}
                      id="given-reason-select"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      {COMMON_GIVEN_REASONS.map((r, idx) => (
                        <option key={idx} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* BLOCK B: Money Taken From Office */}
            <div
              className={`p-4 rounded-xl border transition ${
                moneyTakenFromOffice
                  ? 'border-amber-300 bg-amber-50/40'
                  : 'border-slate-200 bg-slate-50 opacity-80'
              }`}
              id="money-taken-section"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 font-bold">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      আউটলেট থেকে মূল ব্যাংকে প্রেরিত ক্যাশ (Money Taken to Bank — Outflow)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      আউটলেটের উদ্বৃত্ত ক্যাশ বা ব্যালেন্স ক্রয়ের বিপরীতে ডিএসআরের মাধ্যমে ব্যাংকে ফেরত প্রেরিত অর্থ
                    </p>
                  </div>
                </div>

                {/* Yes/No Toggle */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setMoneyTakenFromOffice(true)}
                    id="money-taken-yes-btn"
                    className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                      moneyTakenFromOffice
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Yes (প্রেরিত)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMoneyTakenFromOffice(false);
                      setAmountTaken(0);
                    }}
                    id="money-taken-no-btn"
                    className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                      !moneyTakenFromOffice
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    No (নেই)
                  </button>
                </div>
              </div>

              {moneyTakenFromOffice && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-amber-200/70">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ব্যাংকে প্রেরিত টাকার পরিমাণ (Amount Taken) ৳ *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">
                        ৳
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={amountTaken || ''}
                        onChange={e => setAmountTaken(Number(e.target.value) || 0)}
                        id="amount-taken-input"
                        placeholder="e.g. 20000"
                        className="w-full text-sm font-mono font-bold pl-7 pr-3 py-2 rounded-lg border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        required={moneyTakenFromOffice}
                      />
                    </div>
                    <p className="text-[11px] text-amber-800 font-medium mt-1">
                      {formatBDT(calculatedTaken)} (ডেবিট ভাউচার V-TAK তৈরি হবে)
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ব্যাংকে প্রেরণের কারণ / বিবরণ (Taken Reason) *
                    </label>
                    <select
                      value={takenReason}
                      onChange={e => setTakenReason(e.target.value)}
                      id="taken-reason-select"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    >
                      {COMMON_TAKEN_REASONS.map((r, idx) => (
                        <option key={idx} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Live Position & Calculation Summary */}
          <div className="bg-slate-900 text-white p-4 rounded-xl shadow-inner">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                Live Position Summary (Required Calculation)
              </span>
              <span className="text-[11px] text-slate-400">
                Formula: Net Position = Total Given - Total Taken
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Opening Balance
                </span>
                <span className="text-sm font-bold font-mono text-slate-200">
                  {formatBDT(openingBalance)}
                </span>
              </div>

              <div className="bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800/50">
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 block font-semibold">
                  Total Given
                </span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  +{formatBDT(calculatedGiven)}
                </span>
              </div>

              <div className="bg-amber-950/60 p-2.5 rounded-lg border border-amber-800/50">
                <span className="text-[10px] uppercase tracking-wider text-amber-400 block font-semibold">
                  Total Taken
                </span>
                <span className="text-sm font-bold font-mono text-amber-400">
                  -{formatBDT(calculatedTaken)}
                </span>
              </div>

              <div className="bg-indigo-950/80 p-2.5 rounded-lg border border-indigo-700/60">
                <span className="text-[10px] uppercase tracking-wider text-indigo-300 block font-bold">
                  Closing / Net Position
                </span>
                <span className="text-base font-extrabold font-mono text-white">
                  {formatBDT(netPosition)}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 4: Digital Signature & Remarks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <SignaturePad
                label="মূল ব্যাংক ডিএসআর ডিজিটাল স্বাক্ষর (Bank Representative Signature)"
                onSave={setDsrSignature}
                initialSignature={dsrSignature}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                ডেলিভারি নোট ও বিশেষ মন্তব্য (Delivery Notes)
              </label>
              <textarea
                rows={4}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                id="entry-remarks-input"
                placeholder="রিকুইজিশন ডেলিভারি, নোটের ডিনমিনেশন, ক্যাশ কাউন্টিং বা ব্যাংক নির্দেশনার নোট..."
                className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>
              অডিট কমিট: ১ আগমন লগ + {moneyGivenToOffice && calculatedGiven > 0 ? '১ রিফিল ভাউচার (V-GIV)' : '০'}{' '}
              + {moneyTakenFromOffice && calculatedTaken > 0 ? '১ ব্যাংক ফেরত ভাউচার (V-TAK)' : '০'}।
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              id="cancel-daily-entry-btn"
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              id="submit-daily-entry-btn"
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ ও ভাউচার ইস্যু'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
