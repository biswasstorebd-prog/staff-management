import React, { useState } from 'react';
import { AttendanceRecord, StaffMember, StaffRole, BranchOutlet } from '../../types';
import { storage } from '../../services/storage';
import {
  CalendarCheck,
  Search,
  Plus,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  Calendar,
  Fingerprint,
  Building2,
  Wifi,
  WifiOff,
  Navigation,
  ArrowRight,
  Sparkles,
  PenTool,
  Check,
  ShieldCheck,
  FileSignature,
} from 'lucide-react';
import { BiometricTerminalModal } from '../BiometricTerminalModal';
import { formatMinutesBengali } from '../../utils/timeCalculators';

interface UniversalAttendanceViewProps {
  currentDate: string;
}

export const UniversalAttendanceView: React.FC<UniversalAttendanceViewProps> = ({
  currentDate,
}) => {
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>(() =>
    storage.getAttendanceRecords(currentDate)
  );
  const [staffList] = useState<StaffMember[]>(() => storage.getAllStaff());
  const [outlets] = useState<BranchOutlet[]>(() => storage.getOutlets());
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [kioskStaffId, setKioskStaffId] = useState<string | undefined>(undefined);
  const [kioskAction, setKioskAction] = useState<'CHECK_IN' | 'MOVEMENT_OUT' | 'MOVEMENT_RETURN' | 'CHECK_OUT'>('CHECK_IN');

  // Digital Signature Viewer Modal
  const [signaturePreview, setSignaturePreview] = useState<{
    staffName: string;
    type: string;
    time: string;
    signatureUrl: string;
    verifiedMethod?: string;
  } | null>(null);

  // Form State
  const [punchStaffId, setPunchStaffId] = useState(staffList[0]?.id || '');
  const [arrivalTime, setArrivalTime] = useState('08:57 AM');
  const [departureTime, setDepartureTime] = useState('05:02 PM');
  const [punchStatus, setPunchStatus] = useState<AttendanceRecord['status']>('Present');
  const [remarks, setRemarks] = useState('');

  const refreshAttendance = (dateToFetch: string) => {
    setAttendanceList(storage.getAttendanceRecords(dateToFetch));
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    refreshAttendance(newDate);
  };

  const filteredAttendance = attendanceList.filter(att => {
    const staff = staffList.find(s => s.id === att.staffId || s.id === att.dsrId || s.name === att.dsrName);
    const matchesRole = roleFilter === 'ALL' || (staff && staff.role === roleFilter);
    const matchesBranch = branchFilter === 'ALL' || (att.branchId === branchFilter || staff?.branchId === branchFilter);
    const matchesSearch =
      att.dsrName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (att.remarks && att.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesRole && matchesBranch && matchesSearch;
  });

  const handleSavePunch = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find(s => s.id === punchStaffId);
    if (!staff) return;

    storage.saveAttendance({
      dsrId: staff.id,
      dsrName: staff.name,
      staffId: staff.id,
      staffName: staff.name,
      role: staff.role,
      branchId: staff.branchId,
      branchName: staff.branchName,
      date: selectedDate,
      arrivalTime,
      departureTime: departureTime || undefined,
      status: punchStatus,
      remarks,
    });

    storage.addAuditLog({
      actor: 'Admin / Manager',
      role: 'Administrator',
      action: 'ATTENDANCE_PUNCH',
      module: 'ATTENDANCE',
      details: `Punched attendance for ${staff.name} (${staff.role}) on ${selectedDate} at ${arrivalTime}.`,
    });

    refreshAttendance(selectedDate);
    setIsPunchModalOpen(false);
    setRemarks('');
  };

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Field':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Departed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Late':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'On Leave':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  // Metrics calculation
  const totalPresent = filteredAttendance.filter(a => a.status === 'Present' || a.status === 'Late' || a.status === 'Departed').length;
  const lateCount = filteredAttendance.filter(a => a.lateMinutes && a.lateMinutes > 0).length;
  const onTimeCount = Math.max(0, totalPresent - lateCount);
  const inFieldCount = filteredAttendance.filter(a => a.status === 'In Field').length;
  const totalOvertimeMinutes = filteredAttendance.reduce((acc, curr) => acc + (curr.overtimeMinutes || 0), 0);

  const openKioskForStaff = (
    staffId?: string,
    action: 'CHECK_IN' | 'MOVEMENT_OUT' | 'MOVEMENT_RETURN' | 'CHECK_OUT' = 'CHECK_IN'
  ) => {
    setKioskStaffId(staffId);
    setKioskAction(action);
    setIsKioskOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              সার্বজনীন দৈনিক হাজিরা খাতা (Daily Attendance Register)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            আউটলেটে উপস্থিতি, বাইরে যাওয়া-আসা এবং বিকেলে ফাইনাল আউট — ফিঙ্গারপ্রিন্ট ও ডিজিটাল স্বাক্ষর সমন্বিত ব্যবস্থা
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => handleDateChange(e.target.value)}
              className="bg-transparent border-none text-slate-800 focus:outline-none cursor-pointer font-mono"
            />
          </div>

          <button
            onClick={() => setIsPunchModalOpen(true)}
            id="open-punch-modal-btn"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>ম্যানুয়াল এন্ট্রি</span>
          </button>
        </div>
      </div>

      {/* CORE 3-STEP FLOW BANNER AS REQUESTED BY USER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-3xl text-white shadow-md border border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-indigo-800/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base text-white">
              দৈনিক হাজিরা ও মুভমেন্ট সাইকেল (Daily Attendance & Signature Flow)
            </h3>
          </div>
          <span className="text-[11px] px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
            SecuGen / BioAPI :5050 Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Action 1: Morning Check-in */}
          <div className="bg-white/10 hover:bg-white/15 transition p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ১. সকালে উপস্থিতি
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  ০৮:৫৭ AM
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">আউটলেটে প্রেজেন্ট পাঞ্চ</h4>
              <p className="text-xs text-slate-300">
                ফিঙ্গারপ্রিন্ট দিয়ে আউটলেটে আগমন নিশ্চিত করুন ও ডিজিটাল স্বাক্ষর সংযুক্ত করুন।
              </p>
            </div>
            <button
              onClick={() => openKioskForStaff(undefined, 'CHECK_IN')}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Fingerprint className="w-4 h-4" />
              <span>উপস্থিতি পাঞ্চ (Finger+Sign)</span>
            </button>
          </div>

          {/* Action 2: Field Movement Out */}
          <div className="bg-white/10 hover:bg-white/15 transition p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" /> ২. বাইরে যাওয়া (Gate Pass)
                </span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-mono">
                  ১১:২০ AM
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">মুভমেন্ট কারণ ও স্বাক্ষর</h4>
              <p className="text-xs text-slate-300">
                ব্যাংক বা গ্রাহক ভিজিটে বাইরে যাওয়ার সময় ফিঙ্গারপ্রিন্ট ও গেটপাস সাইন দিয়ে যান।
              </p>
            </div>
            <button
              onClick={() => openKioskForStaff(undefined, 'MOVEMENT_OUT')}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <PenTool className="w-4 h-4" />
              <span>বাইরে যাওয়ার গেটপাস পাঞ্চ</span>
            </button>
          </div>

          {/* Action 3: Evening Final Out */}
          <div className="bg-white/10 hover:bg-white/15 transition p-4 rounded-2xl border border-white/10 flex flex-col justify-between ring-2 ring-rose-500/40">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-400" /> ৪. বিকেলে ফাইনাল আউট
                </span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-mono">
                  ০৫:০২ PM
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">চূড়ান্ত প্রস্থান (Finger + Signature)</h4>
              <p className="text-xs text-slate-300">
                বিকেলে ফাইনাল আউটে ফিঙ্গারপ্রিন্ট ও ডিজিটাল স্বাক্ষর উভয়ই আবশ্যক।
              </p>
            </div>
            <button
              onClick={() => openKioskForStaff(undefined, 'CHECK_OUT')}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <FileSignature className="w-4 h-4" />
              <span>বিকেলে ফাইনাল আউট পাঞ্চ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">মোট উপস্থিত</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{totalPresent} জন</div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">হাজিরা রেকর্ডভুক্ত</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">সময়মতো আগমন</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{onTimeCount} জন</div>
          <div className="text-[10px] text-slate-400 mt-0.5">০৯:১৫ AM এর পূর্বে</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">বিলম্ব উপস্থিতি (Late)</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{lateCount} জন</div>
          <div className="text-[10px] text-amber-700 mt-0.5">বিলম্ব গণ্য হয়েছে</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">বাইরে ফিল্ডে (In Field)</div>
          <div className="text-xl font-bold text-sky-600 mt-1 font-mono">{inFieldCount} জন</div>
          <div className="text-[10px] text-sky-700 mt-0.5">অফিসের বাইরে কাজে</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500">মোট ওভারটাইম</div>
          <div className="text-xl font-bold text-purple-700 mt-1 font-mono">
            {formatMinutesBengali(totalOvertimeMinutes)}
          </div>
          <div className="text-[10px] text-purple-600 mt-0.5">০৫:০০ PM এর পর</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Branch / Outlet Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">সকল শাখা / আউটলেট (All Outlets)</option>
              {outlets.map(o => (
                <option key={o.id} value={o.id}>
                  {o.nameBn} ({o.code})
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold">
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">সকল পদবী / রোল</option>
              <option value="Administrator">Administrator</option>
              <option value="Manager">Manager</option>
              <option value="Teller">Teller</option>
              <option value="DSR">DSR</option>
              <option value="Other Staff">Other Staff</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="কর্মী বা রিমার্কস খুঁজুন..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Attendance Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">তারিখ ও অবস্থা</th>
                <th className="py-3 px-4">কর্মী পরিচিতি</th>
                <th className="py-3 px-4">শাখা / আউটলেট</th>
                <th className="py-3 px-4 text-center">আগমন (Check-in)</th>
                <th className="py-3 px-4">মুভমেন্ট (বাইরে যাওয়া-আসা)</th>
                <th className="py-3 px-4 text-center">প্রস্থান (Final Out)</th>
                <th className="py-3 px-4 text-center">নেট কর্মঘণ্টা</th>
                <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-center">পাঞ্চ ও অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    নির্বাচিত ফিল্টারে কোনো হাজিরার রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredAttendance.map(att => {
                  const staff = staffList.find(
                    s => s.id === att.staffId || s.id === att.dsrId || s.name === att.dsrName
                  );

                  // Movements for this staff on this date
                  const staffMovements = storage
                    .getMovementRecords(att.date)
                    .filter(m => m.staffId === (staff?.id || att.dsrId) || m.staffName === att.dsrName);

                  const hasCheckInSign = Boolean(att.checkInSignature || att.signature);
                  const hasFinalOutSign = Boolean(att.finalOutSignature);

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition">
                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-slate-600 font-medium whitespace-nowrap">
                        {att.date}
                        <div className="text-[10px] text-slate-400">
                          {att.syncStatus === 'SYNCED' ? (
                            <span className="text-emerald-600 flex items-center gap-0.5">
                              <Wifi className="w-3 h-3" /> সিঙ্কড
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-0.5">
                              <WifiOff className="w-3 h-3" /> লোকাল ক্যাশে
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Staff Name & Role */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{att.dsrName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {staff?.staffCode || 'EMP-000'} • {staff?.designation || staff?.role}
                        </div>
                      </td>

                      {/* Branch / Outlet */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-700">
                          {att.branchName || staff?.branchName || 'ঢাকা প্রধান আউটলেট'}
                        </span>
                      </td>

                      {/* Check-in / Arrival with Late calculation & Signature preview */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="font-mono font-bold text-emerald-700 text-xs">
                          {att.arrivalTime || '—'}
                        </div>
                        <div className="flex flex-col items-center gap-1 mt-0.5">
                          {att.lateMinutes && att.lateMinutes > 0 ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              {att.lateMinutes} মি. বিলম্ব
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium text-emerald-700">
                              সময়মতো ✓
                            </span>
                          )}

                          {hasCheckInSign && (
                            <button
                              type="button"
                              onClick={() =>
                                setSignaturePreview({
                                  staffName: att.dsrName,
                                  type: 'উপস্থিতি স্বাক্ষর (Check-in Signature)',
                                  time: att.arrivalTime || '08:57 AM',
                                  signatureUrl: att.checkInSignature || att.signature || '',
                                  verifiedMethod: att.verifiedMethod,
                                })
                              }
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-0.5 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200 cursor-pointer"
                              title="স্বাক্ষর বিস্তারিত দেখুন"
                            >
                              <PenTool className="w-2.5 h-2.5" />
                              <span>স্বাক্ষর দেখুন</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Movement Tracking */}
                      <td className="py-3 px-4">
                        {staffMovements.length === 0 ? (
                          <div className="flex items-center justify-between text-slate-400 text-xs">
                            <span>মুভমেন্ট নেই</span>
                            <button
                              type="button"
                              onClick={() => openKioskForStaff(staff?.id || att.dsrId, 'MOVEMENT_OUT')}
                              className="text-[10px] text-sky-600 hover:underline font-bold"
                            >
                              + বাইরে যাওয়া
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {staffMovements.map(m => (
                              <div
                                key={m.id}
                                className="text-[11px] bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 space-y-0.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span>
                                    <span className="font-bold text-slate-800">{m.outTime}</span>
                                    {' → '}
                                    <span className="font-bold text-indigo-700">
                                      {m.actualReturnTime || m.expectedReturnTime || 'ফিল্ডে'}
                                    </span>
                                    <span className="text-slate-500 text-[10px] ml-1">
                                      ({m.destination})
                                    </span>
                                  </span>
                                  {m.durationMinutes && m.durationMinutes > 0 && (
                                    <span className="text-[10px] font-bold text-sky-800">
                                      {m.durationMinutes}মি.
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-500">
                                  <span>কারণ: {m.purposeType}</span>
                                  {m.signature && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSignaturePreview({
                                          staffName: m.staffName,
                                          type: `মুভমেন্ট গেটপাস স্বাক্ষর (${m.purposeType})`,
                                          time: m.outTime,
                                          signatureUrl: m.signature || '',
                                          verifiedMethod: 'BIOMETRIC_AND_SIGNATURE',
                                        })
                                      }
                                      className="font-bold text-sky-700 hover:text-sky-900 flex items-center gap-0.5 hover:underline cursor-pointer"
                                    >
                                      <PenTool className="w-2.5 h-2.5" />
                                      <span>গেটপাস সাইন</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Check-out with Early / Overtime and Final Signature */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-800 text-xs">
                          {att.departureTime || '—'}
                        </div>
                        <div className="flex flex-col items-center gap-1 mt-0.5">
                          {att.overtimeMinutes && att.overtimeMinutes > 0 ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              +{att.overtimeMinutes} মি. ওভারটাইম
                            </span>
                          ) : att.earlyMinutes && att.earlyMinutes > 0 ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              {att.earlyMinutes} মি. পূর্বে প্রস্থান
                            </span>
                          ) : null}

                          {hasFinalOutSign && (
                            <button
                              type="button"
                              onClick={() =>
                                setSignaturePreview({
                                  staffName: att.dsrName,
                                  type: 'বিকেলে ফাইনাল আউট স্বাক্ষর (Final Out Signature)',
                                  time: att.departureTime || '05:02 PM',
                                  signatureUrl: att.finalOutSignature || '',
                                  verifiedMethod: 'BIOMETRIC_AND_SIGNATURE',
                                })
                              }
                              className="text-[10px] font-bold text-rose-700 hover:text-rose-900 inline-flex items-center gap-0.5 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 cursor-pointer"
                              title="ফাইনাল আউট স্বাক্ষর বিস্তারিত দেখুন"
                            >
                              <FileSignature className="w-2.5 h-2.5" />
                              <span>ফাইনাল সাইন দেখুন</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Net Working Hours */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-indigo-900 whitespace-nowrap">
                        {att.workingMinutes && att.workingMinutes > 0 ? (
                          <span>{formatMinutesBengali(att.workingMinutes)}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status & Method */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                            att.status
                          )}`}
                        >
                          {att.status === 'Present'
                            ? 'উপস্থিত'
                            : att.status === 'In Field'
                            ? 'ফিল্ডে মুভমেন্ট'
                            : att.status === 'Departed'
                            ? 'প্রস্থান করেছেন'
                            : att.status === 'Late'
                            ? 'বিলম্বিত উপস্থিতি'
                            : att.status}
                        </span>
                        {(hasCheckInSign || hasFinalOutSign) && (
                          <div className="text-[10px] font-semibold text-emerald-700 mt-1 flex items-center justify-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> ফিঙ্গার + সাইন
                          </div>
                        )}
                      </td>

                      {/* Actions: Contextual Quick Punch */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {att.status === 'Departed' ? (
                            <button
                              onClick={() => openKioskForStaff(staff?.id || att.dsrId, 'CHECK_OUT')}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>স্লিপ দেখুন</span>
                            </button>
                          ) : att.status === 'In Field' ? (
                            <button
                              onClick={() => openKioskForStaff(staff?.id || att.dsrId, 'MOVEMENT_RETURN')}
                              className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>ফিরে আসা</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => openKioskForStaff(staff?.id || att.dsrId, 'MOVEMENT_OUT')}
                                className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                                title="বাইরে কাজের জন্য গেটপাস পাঞ্চ"
                              >
                                <Navigation className="w-3 h-3 text-sky-600" />
                                <span>বাইরে যাওয়া</span>
                              </button>
                              <button
                                onClick={() => openKioskForStaff(staff?.id || att.dsrId, 'CHECK_OUT')}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                                title="বিকেলে ফিঙ্গার ও সাইন দিয়ে ফাইনাল আউট"
                              >
                                <FileSignature className="w-3 h-3 text-rose-600" />
                                <span>ফাইনাল আউট</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Biometric Terminal Modal */}
      {isKioskOpen && (
        <BiometricTerminalModal
          isOpen={isKioskOpen}
          onClose={() => {
            setIsKioskOpen(false);
            refreshAttendance(selectedDate);
          }}
          onSuccess={() => {
            refreshAttendance(selectedDate);
          }}
          initialStaffId={kioskStaffId}
          initialDate={selectedDate}
          initialAction={kioskAction}
        />
      )}

      {/* Digital Signature Full Preview Modal */}
      {signaturePreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  ডিজিটাল স্বাক্ষর যাচাই সনদ (Verified Signature Slip)
                </h3>
              </div>
              <button
                onClick={() => setSignaturePreview(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5 font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-500">কর্মীর নাম:</span>
                  <span className="font-bold text-slate-800">{signaturePreview.staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">স্বাক্ষরের ধরন:</span>
                  <span className="font-bold text-indigo-700">{signaturePreview.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">সময়:</span>
                  <span className="font-bold font-mono text-slate-800">{signaturePreview.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ভেরিফিকেশন মাধ্যম:</span>
                  <span className="font-bold text-emerald-700">
                    ফিঙ্গারপ্রিন্ট + ডিজিটাল স্বাক্ষর (SecuGen BioAPI :5050)
                  </span>
                </div>
              </div>

              {/* Signature Display */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  রেকর্ডকৃত ক্যাপচার্ড ডিজিটাল স্বাক্ষর:
                </label>
                <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-4 bg-white flex items-center justify-center min-h-[140px]">
                  {signaturePreview.signatureUrl ? (
                    <img
                      src={signaturePreview.signatureUrl}
                      alt="Verified Signature"
                      className="max-h-28 object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">কোনো স্বাক্ষর পাওয়া যায়নি</span>
                  )}
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">স্বাক্ষর এনক্রিপ্ট ও ক্যাশে সংরক্ষিত</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  VALIDATED ✓
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট</span>
              </button>
              <button
                type="button"
                onClick={() => setSignaturePreview(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Punch Modal */}
      {isPunchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">
                  হাজিরা নথিভুক্ত করুন (Attendance Punch)
                </h3>
              </div>
              <button
                onClick={() => setIsPunchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePunch} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">কর্মী নির্বাচন করুন *</label>
                <select
                  value={punchStaffId}
                  onChange={e => setPunchStaffId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500 bg-white font-medium text-slate-800"
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.staffCode}) — {s.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">আগমনের সময় (Arrival) *</label>
                  <input
                    type="text"
                    required
                    value={arrivalTime}
                    onChange={e => setArrivalTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500 font-mono"
                    placeholder="08:57 AM"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">প্রস্থানের সময় (Departure)</label>
                  <input
                    type="text"
                    value={departureTime}
                    onChange={e => setDepartureTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500 font-mono"
                    placeholder="05:02 PM"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">হাজিরা স্ট্যাটাস *</label>
                <select
                  value={punchStatus}
                  onChange={e => setPunchStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500 bg-white"
                >
                  <option value="Present">Present (উপস্থিত)</option>
                  <option value="In Field">In Field (ফিল্ডে কর্মরত)</option>
                  <option value="Late">Late (দেরিতে উপস্থিতি)</option>
                  <option value="Departed">Departed (প্রস্থান করেছেন)</option>
                  <option value="On Leave">On Leave (ছুটিতে)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">রিমার্কস / মন্তব্য</label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="যেমন: নিয়মিত হাজিরা, ব্যাংকিং ভিজিট ইত্যাদি..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPunchModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition shadow-xs cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

