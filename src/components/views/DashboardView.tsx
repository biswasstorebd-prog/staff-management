import React, { useState } from 'react';
import { StaffMember, SystemUser } from '../../types';
import { storage } from '../../services/storage';
import { formatBDT, toBengaliDigits } from '../../utils/formatters';
import {
  Users,
  UserCheck,
  Navigation,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  PlusCircle,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Coins,
  Fingerprint,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { MainNavSection } from '../Sidebar';
import { BiometricTerminalModal } from '../BiometricTerminalModal';

interface DashboardViewProps {
  currentDate: string;
  currentUser: SystemUser;
  onNavigate: (section: MainNavSection) => void;
  onOpenNewVisit: () => void;
  onOpenNewMovement: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentDate,
  currentUser,
  onNavigate,
  onOpenNewVisit,
  onOpenNewMovement,
}) => {
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const stats = storage.getStatsSummary(currentDate);
  const staffList = storage.getAllStaff();
  const dsrSummaries = storage.getDailySummaries(currentDate);
  const movements = storage.getMovementRecords(currentDate);
  const offlineQueue = storage.getOfflineQueue();
  const pendingSyncCount = offlineQueue.filter(q => q.status === 'PENDING').length;

  const activeMovements = movements.filter(m => !m.isCompleted);
  const pendingApprovals = movements.filter(m => m.approvalStatus === 'Pending');

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {currentUser.role} কন্ট্রোল প্যানেল
            </span>
            <span className="text-xs text-slate-400">তারিখ: {currentDate}</span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                pendingSyncCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {pendingSyncCount > 0 ? (
                <>
                  <WifiOff className="w-2.5 h-2.5" />
                  <span>{pendingSyncCount} অফলাইন কিউ</span>
                </>
              ) : (
                <>
                  <Wifi className="w-2.5 h-2.5" />
                  <span>সার্ভার সিঙ্কড</span>
                </>
              )}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1 text-white tracking-tight">
            স্বাগতম, {currentUser.displayName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            এজেন্ট ব্যাংকিং আউটলেট স্টাফ হাজিরা, বায়োমেট্রিক ও ক্যাশ মুভমেন্ট কন্ট্রোল
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsKioskOpen(true)}
            id="dash-biometric-kiosk-btn"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Fingerprint className="w-4 h-4" />
            <span>🖐️ বায়োমেট্রিক পাঞ্চ Kiosk (:5050)</span>
          </button>

          <button
            onClick={onOpenNewVisit}
            id="dash-quick-visit-btn"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ ডিএসআর ক্যাশ এন্ট্রি</span>
          </button>

          <button
            onClick={onOpenNewMovement}
            id="dash-quick-movement-btn"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-sky-400" />
            <span>+ গেটপাস / মুভমেন্ট</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              মোট কর্মী (৫ ক্যাটাগরি)
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">
              {toBengaliDigits(stats.totalStaffCount)} জন
            </span>
            <span className="text-xs text-slate-500 font-medium">সক্রিয় স্টাফ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            অ্যাডমিন, ম্যানেজার, টেলার, ডিএসআর ও অন্যান্য
          </p>
        </div>

        {/* Present Today */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              আজ উপস্থিত কর্মী
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">
              {toBengaliDigits(stats.presentStaffCount)} জন
            </span>
            <span className="text-xs text-slate-500 font-medium">হাজিরা নথিভুক্ত</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            বায়োমেট্রিক ও ভেরিফায়েড উপস্থিতি
          </p>
        </div>

        {/* Field Movements */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              বাইরে / ফিল্ডে কর্মরত
            </span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-600">
              {toBengaliDigits(stats.fieldMovementCount)} জন
            </span>
            <span className="text-xs text-slate-500 font-medium">গেটপাস সক্রিয়</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            ব্যাংক, কাস্টমার ভিজিট ও মার্কেট কালেকশন
          </p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              মুলতুবি অনুমোদন
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">
              {toBengaliDigits(stats.pendingApprovalsCount)} টি
            </span>
            <span className="text-xs text-slate-500 font-medium">অপেক্ষমাণ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            ম্যানেজার দ্বারা যাচাইয়ের অপেক্ষায়
          </p>
        </div>
      </div>

      {/* DSR Money Movement Focus Panel (Core Requirement Guaranteed) */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-5 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                ডিএসআর দৈনিক নগদ লেনদেন ও ক্যাশ পজিশন (DSR Cash Flow)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                আলাদা আর্থিক ট্রানজেকশন
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              অফিসে জমা ও নেওয়া টাকা সম্পূর্ণ আলাদা স্বাধীন ভাউচারে সংরক্ষিত হয়
            </p>
          </div>

          <button
            onClick={() => onNavigate('dsr')}
            className="text-xs text-indigo-300 hover:text-white font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <span>সম্পূর্ণ ডিএসআর সামারি ও লেজার দেখুন</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Financial Figures */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Total Given */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-emerald-900/40">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <ArrowDownRight className="w-4 h-4" />
              <span>আজ অফিসে জমা মোট টাকা (Given To Office)</span>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-300">
              {formatBDT(stats.totalCashGivenToday)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              মার্কেট সেলস ও কালেকশন বাবদ গৃহীত ক্যাশ
            </p>
          </div>

          {/* Total Taken */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-rose-900/40">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
              <ArrowUpRight className="w-4 h-4" />
              <span>আজ অফিস থেকে নেওয়া টাকা (Taken From Office)</span>
            </div>
            <div className="mt-2 text-2xl font-black text-rose-300">
              {formatBDT(stats.totalCashTakenToday)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              ফিল্ড খরচ, ফুয়েল ও দৈনিক ট্রানজিট ফ্লোট
            </p>
          </div>

          {/* Net Position */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-indigo-800/40">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
              <Coins className="w-4 h-4 text-indigo-400" />
              <span>আজকের নেট ক্যাশ পজিশন (Net Cash Position)</span>
            </div>
            <div
              className={`mt-2 text-2xl font-black ${
                stats.netCashPositionToday >= 0 ? 'text-indigo-200' : 'text-rose-400'
              }`}
            >
              {formatBDT(stats.netCashPositionToday)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              সূত্র: জমা টাকা (Given) - নেওয়া টাকা (Taken)
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Today's DSR Benchmark Activity & Active Field Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DSR Table Highlights */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                আজকের ডিএসআর ক্যাশ সামারি (হাজিরা ও ফিন্যান্স)
              </h4>
            </div>
            <button
              onClick={() => onNavigate('dsr')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition cursor-pointer"
            >
              বিস্তারিত টেবিল →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {dsrSummaries.slice(0, 4).map(item => (
              <div key={item.id} className="p-3.5 hover:bg-slate-50/70 transition flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">{item.dsrName}</span>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      আসা: {item.arrival} | প্রস্থান: {item.departure}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    মন্তব্য: {item.remarks}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-emerald-700">
                    জমা: {formatBDT(item.given)}
                  </div>
                  <div className="text-xs font-bold text-rose-600">
                    নেওয়া: {formatBDT(item.taken)}
                  </div>
                  <div className="text-[11px] font-bold text-slate-800">
                    নেট: {formatBDT(item.netPosition)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Field Movements / Gate Pass */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-sky-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                ফিল্ড মুভমেন্ট ও গেটপাস ট্র্যাকিং
              </h4>
            </div>
            <button
              onClick={() => onNavigate('movement')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition cursor-pointer"
            >
              গেটপাস খাতা →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {movements.slice(0, 4).map(mov => (
              <div key={mov.id} className="p-3.5 hover:bg-slate-50/70 transition flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">{mov.staffName}</span>
                    <span className="text-[10px] font-semibold bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">
                      {mov.purposeType}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {mov.tokenNo}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    গন্তব্য: {mov.destination}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-slate-700">
                    বাহির: {mov.outTime}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    ফেরত: {mov.actualReturnTime || mov.expectedReturnTime || 'অপেক্ষমাণ'}
                  </div>
                  <span
                    className={`inline-block text-[9.5px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                      mov.isCompleted
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {mov.isCompleted ? 'ফেরত এসেছেন' : 'অফিসের বাইরে'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Biometric Terminal Modal */}
      {isKioskOpen && (
        <BiometricTerminalModal
          isOpen={isKioskOpen}
          onClose={() => setIsKioskOpen(false)}
        />
      )}
    </div>
  );
};
