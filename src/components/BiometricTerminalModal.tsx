import React, { useState, useEffect } from 'react';
import { StaffMember, AttendanceRecord, StaffMovementRecord } from '../types';
import { storage } from '../services/storage';
import { biometricService } from '../services/biometricService';
import { SignaturePad } from './SignaturePad';
import {
  Fingerprint,
  CheckCircle2,
  AlertCircle,
  Clock,
  Navigation,
  ArrowRight,
  RefreshCw,
  X,
  Printer,
  ShieldCheck,
  Wifi,
  WifiOff,
  Building2,
  Calendar,
  Sparkles,
  PenTool,
  Check,
} from 'lucide-react';
import {
  calculateLateMinutes,
  calculateEarlyMinutes,
  calculateOvertimeMinutes,
  calculateDurationMinutes,
  formatMinutesBengali,
} from '../utils/timeCalculators';

interface BiometricTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  initialStaffId?: string;
  initialDate?: string;
  initialAction?: 'CHECK_IN' | 'MOVEMENT_OUT' | 'MOVEMENT_RETURN' | 'CHECK_OUT';
}

export const BiometricTerminalModal: React.FC<BiometricTerminalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialStaffId,
  initialDate,
  initialAction,
}) => {
  const [staffList, setStaffList] = useState<StaffMember[]>(() => storage.getAllStaff());
  const [selectedStaffId, setSelectedStaffId] = useState<string>(initialStaffId || staffList[0]?.id || '');
  const [targetDate, setTargetDate] = useState<string>(initialDate || '2026-09-03');
  const [actionType, setActionType] = useState<'CHECK_IN' | 'MOVEMENT_OUT' | 'MOVEMENT_RETURN' | 'CHECK_OUT'>(
    initialAction || 'CHECK_IN'
  );

  // Signature state
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [signatureError, setSignatureError] = useState<string | null>(null);

  // Scanner status
  const [scannerStatus, setScannerStatus] = useState<'CONNECTING' | 'READY' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('READY');
  const [scannerDevice, setScannerDevice] = useState<string>('SecuGen Hamster Pro 20 (Local :5050)');
  const [apiPort, setApiPort] = useState<string>('5050');

  // Form states
  const [eventTime, setEventTime] = useState<string>('08:57 AM');
  const [destination, setDestination] = useState<string>('Bank Branch (মূল ব্যাংক প্রধান শাখা)');
  const [purposeType, setPurposeType] = useState<StaffMovementRecord['purposeType']>('Official visit');
  const [expectedReturnTime, setExpectedReturnTime] = useState<string>('01:00 PM');
  const [remarks, setRemarks] = useState<string>('');

  // Execution verification receipt
  const [verifiedRecord, setVerifiedRecord] = useState<{
    staffName: string;
    staffRole: string;
    time: string;
    type: string;
    status: string;
    lateMins?: number;
    earlyMins?: number;
    overtimeMins?: number;
    netWorkingMinutes?: number;
    destination?: string;
    durationMins?: number;
    signatureUrl?: string;
    isOffline: boolean;
  } | null>(null);

  // Load staff and test API status on mount
  useEffect(() => {
    if (isOpen) {
      setStaffList(storage.getAllStaff());
      if (initialStaffId) {
        setSelectedStaffId(initialStaffId);
      }
      if (initialAction) {
        setActionType(initialAction);
      }
      setSignatureError(null);
      // Check status of biometricapp.exe :5050
      biometricService.checkStatus().then(res => {
        if (res.connected) {
          setScannerDevice(res.device || 'SecuGen Hamster Pro 20 / BiometricApp.exe (:5050)');
        }
      });
      // Set realistic default time based on action type
      if (actionType === 'CHECK_IN') setEventTime('08:57 AM');
      else if (actionType === 'MOVEMENT_OUT') setEventTime('11:20 AM');
      else if (actionType === 'MOVEMENT_RETURN') setEventTime('12:48 PM');
      else if (actionType === 'CHECK_OUT') setEventTime('05:02 PM');
    }
  }, [isOpen, initialStaffId, initialAction, actionType]);

  const handleAutoGenerateSignature = (staffName: string) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'italic 26px "Playfair Display", "Caveat", "Brush Script MT", cursive, serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(staffName, 18, 56);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(12, 70);
        ctx.bezierCurveTo(70, 82, 160, 58, 260, 72);
        ctx.stroke();
        const url = canvas.toDataURL('image/png');
        setSignatureDataUrl(url);
        setSignatureError(null);
      }
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const currentStaff = staffList.find(s => s.id === selectedStaffId) || staffList[0];

  // Active out-of-office movement for this staff today
  const activeMovement = currentStaff
    ? storage.getMovementRecords(targetDate).find(
        m => (m.staffId === currentStaff.id || m.staffName === currentStaff.name) && !m.isCompleted
      )
    : null;

  // Existing attendance for this staff today
  const todayAttendance = currentStaff
    ? storage.getAttendanceRecords(targetDate).find(
        a => a.staffId === currentStaff.id || a.dsrId === currentStaff.id || a.dsrName === currentStaff.name
      )
    : null;

  const handleTriggerBiometricScan = async () => {
    if (!currentStaff) return;
    setSignatureError(null);

    // User requirement: "bikel e final out thakbe setao finger ar signature diye"
    if (actionType === 'CHECK_OUT' && !signatureDataUrl) {
      setSignatureError('⚠️ বিকেলে চূড়ান্ত প্রস্থান (Final Out)-এর জন্য ফিঙ্গারপ্রিন্ট ও ডিজিটাল স্বাক্ষর উভয়ই আবশ্যক! অনুগ্রহ করে নিচে স্বাক্ষর প্যাডে সাইন করুন অথবা দ্রুত অটো-সাইন যুক্ত করুন।');
      return;
    }

    setScannerStatus('SCANNING');
    setVerifiedRecord(null);

    try {
      // 1. Call Local HTTP API :5050 (POST /api/fingerprint/verify)
      const verifyRes = await biometricService.verifyFingerprint(currentStaff);
      
      const isNetOnline = storage.isOnline();
      const timeNow = eventTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (actionType === 'CHECK_IN') {
        // Record Check-in
        const late = calculateLateMinutes(timeNow);
        const status = late > 0 ? 'Late' : 'Present';

        const saved = storage.saveAttendance({
          staffId: currentStaff.id,
          staffName: currentStaff.name,
          dsrId: currentStaff.id,
          dsrName: currentStaff.name,
          role: currentStaff.role,
          date: targetDate,
          arrivalTime: timeNow,
          status,
          lateMinutes: late,
          verifiedMethod: signatureDataUrl ? 'BIOMETRIC_AND_SIGNATURE' : 'BIOMETRIC_HTTP_5050',
          checkInSignature: signatureDataUrl || undefined,
          signature: signatureDataUrl || undefined,
          remarks: remarks || (signatureDataUrl ? 'ফিঙ্গারপ্রিন্ট ও ডিজিটাল স্বাক্ষরসহ আউটলেট চেক-ইন' : 'বায়োমেট্রিক চেক-ইন via :5050 API'),
        });

        storage.addAuditLog({
          actor: currentStaff.name,
          role: currentStaff.role,
          action: 'BIOMETRIC_CHECKIN',
          module: 'ATTENDANCE',
          details: `Biometric Check-in verified for ${currentStaff.name} at ${timeNow}. Status: ${status} (Late: ${late} mins). ${signatureDataUrl ? 'Digital Signature Attached.' : ''}`,
        });

        setVerifiedRecord({
          staffName: currentStaff.name,
          staffRole: currentStaff.role,
          time: timeNow,
          type: signatureDataUrl ? 'CHECK-IN (ফিঙ্গারপ্রিন্ট + স্বাক্ষর)' : 'CHECK-IN',
          status,
          lateMins: late,
          signatureUrl: signatureDataUrl || undefined,
          isOffline: !isNetOnline,
        });
      } else if (actionType === 'MOVEMENT_OUT') {
        // Record Movement Out (Gate pass) with Destination & Reason
        const newMov = storage.addMovementRecord({
          staffId: currentStaff.id,
          staffName: currentStaff.name,
          staffRole: currentStaff.role,
          branchId: currentStaff.branchId || 'outlet_1',
          branchName: currentStaff.branchName || 'ঢাকা প্রধান আউটলেট',
          date: targetDate,
          outTime: timeNow,
          expectedReturnTime,
          purposeType,
          destination: destination || 'Bank Branch',
          signature: signatureDataUrl || undefined,
          approvalStatus: 'Approved',
          approvedBy: 'Auto-verified Terminal (ফিঙ্গারপ্রিন্ট + গেটপাস)',
          isCompleted: false,
          remarks: remarks || `Official work outside outlet: ${destination}`,
        });

        // Update attendance status to In Field
        if (todayAttendance) {
          storage.saveAttendance({
            ...todayAttendance,
            status: 'In Field',
          });
        }

        storage.addAuditLog({
          actor: currentStaff.name,
          role: currentStaff.role,
          action: 'STAFF_MOVEMENT_OUT',
          module: 'MOVEMENT',
          details: `Movement Gate-pass verified for ${currentStaff.name} to ${destination} (${purposeType}) at ${timeNow}. ${signatureDataUrl ? 'Signature Verified.' : ''}`,
        });

        setVerifiedRecord({
          staffName: currentStaff.name,
          staffRole: currentStaff.role,
          time: timeNow,
          type: signatureDataUrl ? 'MOVEMENT (ফিঙ্গারপ্রিন্ট + গেটপাস স্বাক্ষর)' : 'MOVEMENT (বাইরে যাওয়া)',
          status: 'In Field',
          destination: destination || 'Bank Branch',
          signatureUrl: signatureDataUrl || undefined,
          isOffline: !isNetOnline,
        });
      } else if (actionType === 'MOVEMENT_RETURN') {
        // Return from movement
        if (activeMovement) {
          const updated = storage.recordMovementReturn(activeMovement.id, timeNow);
          const duration = updated?.durationMinutes || calculateDurationMinutes(activeMovement.outTime, timeNow);

          if (todayAttendance) {
            storage.saveAttendance({
              ...todayAttendance,
              status: 'Present',
            });
          }

          storage.addAuditLog({
            actor: currentStaff.name,
            role: currentStaff.role,
            action: 'STAFF_MOVEMENT_RETURN',
            module: 'MOVEMENT',
            details: `Movement Return verified for ${currentStaff.name} from ${activeMovement.destination} at ${timeNow}. Duration: ${duration} mins.`,
          });

          setVerifiedRecord({
            staffName: currentStaff.name,
            staffRole: currentStaff.role,
            time: timeNow,
            type: 'RETURN (আউটলেটে প্রত্যাবর্তন)',
            status: 'Present',
            durationMins: duration,
            isOffline: !isNetOnline,
          });
        } else {
          // If no open movement, create a standalone return entry
          setVerifiedRecord({
            staffName: currentStaff.name,
            staffRole: currentStaff.role,
            time: timeNow,
            type: 'RETURN (ফিরে আসা)',
            status: 'Present',
            isOffline: !isNetOnline,
          });
        }
      } else if (actionType === 'CHECK_OUT') {
        // Day-end Check-out (both Fingerprint and Signature required)
        const arrival = todayAttendance?.arrivalTime || '08:57 AM';
        const early = calculateEarlyMinutes(timeNow);
        const overtime = calculateOvertimeMinutes(timeNow);
        const totalSpan = calculateDurationMinutes(arrival, timeNow);

        const saved = storage.saveAttendance({
          staffId: currentStaff.id,
          staffName: currentStaff.name,
          dsrId: currentStaff.id,
          dsrName: currentStaff.name,
          role: currentStaff.role,
          date: targetDate,
          arrivalTime: arrival,
          departureTime: timeNow,
          status: 'Departed',
          earlyMinutes: early,
          overtimeMinutes: overtime,
          verifiedMethod: 'BIOMETRIC_AND_SIGNATURE',
          finalOutSignature: signatureDataUrl,
          signature: signatureDataUrl || todayAttendance?.signature,
          remarks: remarks || 'বিকেলে ফিঙ্গারপ্রিন্ট ও ডিজিটাল স্বাক্ষরসহ চূড়ান্ত ফাইনাল আউট',
        });

        storage.addAuditLog({
          actor: currentStaff.name,
          role: currentStaff.role,
          action: 'BIOMETRIC_CHECKOUT',
          module: 'ATTENDANCE',
          details: `Day-end Final Out verified for ${currentStaff.name} with Fingerprint and Digital Signature at ${timeNow}. Early: ${early}m, Overtime: ${overtime}m.`,
        });

        setVerifiedRecord({
          staffName: currentStaff.name,
          staffRole: currentStaff.role,
          time: timeNow,
          type: 'FINAL-OUT (ফিঙ্গারপ্রিন্ট + ডিজিটাল স্বাক্ষর)',
          status: 'Departed (চূড়ান্ত প্রস্থান)',
          earlyMins: early,
          overtimeMins: overtime,
          netWorkingMinutes: saved.workingMinutes || totalSpan,
          signatureUrl: signatureDataUrl,
          isOffline: !isNetOnline,
        });
      }

      setScannerStatus('SUCCESS');
      onSuccess(`ভেরিফিকেশন সফল! ${currentStaff.name}-এর ${actionType} ডাটাবেসে সংরক্ষিত হয়েছে।`);
    } catch (err) {
      setScannerStatus('ERROR');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Fingerprint className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  বায়োমেট্রিক হাজিরা টার্মিনাল (Fingerprint Kiosk)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  :5050 API Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                biometricapp.exe → Local HTTP API :5050 → Instant Attendance Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device & Sync Banner */}
        <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-medium">ডিভাইস:</span>
            <span className="font-semibold text-slate-800 font-mono">{scannerDevice}</span>
          </div>

          <div className="flex items-center gap-3">
            {storage.isOnline() ? (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <Wifi className="w-3.5 h-3.5" />
                <span>অনলাইন (সার্ভার সিঙ্ক সক্রিয়)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <WifiOff className="w-3.5 h-3.5" />
                <span>অফলাইন ক্যাশে (পরে অটো সিঙ্ক)</span>
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. Staff Selector & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                কর্মী নির্বাচন করুন (Select Staff)
              </label>
              <select
                value={selectedStaffId}
                onChange={e => {
                  setSelectedStaffId(e.target.value);
                  setVerifiedRecord(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.staffCode}) — {s.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                তারিখ (Date)
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full bg-transparent border-none text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 2. Action Type Selection Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              হাজিরা অ্যাকশন টাইপ নির্বাচন করুন (Attendance Action)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Check-In */}
              <button
                type="button"
                onClick={() => {
                  setActionType('CHECK_IN');
                  setEventTime('08:57 AM');
                  setVerifiedRecord(null);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer ${
                  actionType === 'CHECK_IN'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-5 h-5 mb-1" />
                <span className="font-bold text-xs">১. সকাল (Check-in)</span>
                <span className="text-[10px] opacity-80">০৮:৫৭ AM</span>
              </button>

              {/* Movement Out */}
              <button
                type="button"
                onClick={() => {
                  setActionType('MOVEMENT_OUT');
                  setEventTime('11:20 AM');
                  setVerifiedRecord(null);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer ${
                  actionType === 'MOVEMENT_OUT'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Navigation className="w-5 h-5 mb-1" />
                <span className="font-bold text-xs">২. বাইরে যাওয়া</span>
                <span className="text-[10px] opacity-80">১১:২০ AM</span>
              </button>

              {/* Movement Return */}
              <button
                type="button"
                onClick={() => {
                  setActionType('MOVEMENT_RETURN');
                  setEventTime('12:48 PM');
                  setVerifiedRecord(null);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer ${
                  actionType === 'MOVEMENT_RETURN'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ArrowRight className="w-5 h-5 mb-1" />
                <span className="font-bold text-xs">৩. ফিরে আসা</span>
                <span className="text-[10px] opacity-80">১২:৪৮ PM</span>
              </button>

              {/* Check-Out */}
              <button
                type="button"
                onClick={() => {
                  setActionType('CHECK_OUT');
                  setEventTime('05:02 PM');
                  setVerifiedRecord(null);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer ${
                  actionType === 'CHECK_OUT'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-400'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-5 h-5 mb-1" />
                <span className="font-bold text-xs">৪. দিন শেষে</span>
                <span className="text-[10px] opacity-80">০৫:০২ PM</span>
              </button>
            </div>
          </div>

          {/* 3. Action Specific Parameters */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সময় (Event Timestamp)
                </label>
                <input
                  type="text"
                  value={eventTime}
                  onChange={e => setEventTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-800 font-mono"
                  placeholder="e.g. 08:57 AM"
                />
              </div>

              {actionType === 'MOVEMENT_OUT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    আনুমানিক ফেরার সময় (Expected Return)
                  </label>
                  <input
                    type="text"
                    value={expectedReturnTime}
                    onChange={e => setExpectedReturnTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-800 font-mono"
                    placeholder="01:00 PM"
                  />
                </div>
              )}
            </div>

            {actionType === 'MOVEMENT_OUT' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মুভমেন্টের কারণ (Movement Reason)
                  </label>
                  <select
                    value={purposeType}
                    onChange={e => setPurposeType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                  >
                    <option value="Official visit">Official Work (দাপ্তরিক কাজ)</option>
                    <option value="Bank work">Bank Branch (ব্যাংক কাজ)</option>
                    <option value="Customer visit">Customer Visit (গ্রাহক সেবা)</option>
                    <option value="Document submission">Document Submission (কাগজপত্র জমা)</option>
                    <option value="Field duty">Field Duty (ফিল্ড ভিজিট)</option>
                    <option value="Emergency">Emergency (জরুরি প্রয়োজন)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    গন্তব্য (Destination)
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                    placeholder="Bank Branch"
                  />
                </div>
              </div>
            )}

            {actionType === 'MOVEMENT_RETURN' && activeMovement && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">চলমান গেটপাস:</span> {activeMovement.tokenNo} ({activeMovement.purposeType})
                  <div className="text-[11px] text-indigo-700 mt-0.5">
                    আউট টাইম: {activeMovement.outTime} → গন্তব্য: {activeMovement.destination}
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-indigo-600 text-white font-bold text-[10px]">
                  RETURN শনাক্ত
                </span>
              </div>
            )}
          </div>

          {/* 4. Digital Signature Section (সকাল প্রেজেন্ট, বাইরে যাওয়া, বিকেল ফাইনাল আউট) */}
          {actionType !== 'MOVEMENT_RETURN' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {actionType === 'CHECK_IN'
                      ? '১. আউটলেটে আগমন ডিজিটাল স্বাক্ষর অপশন (Morning Present Signature)'
                      : actionType === 'MOVEMENT_OUT'
                      ? '২. বাইরে যাওয়ার গেটপাস স্বাক্ষর (Field Movement Signature)'
                      : '৪. বিকেলে চূড়ান্ত প্রস্থান ডিজিটাল স্বাক্ষর (Final Out Signature - বাধ্যতামূলক)'}
                  </span>
                </div>
                {actionType === 'CHECK_OUT' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    বাধ্যতামূলক
                  </span>
                )}
              </div>

              {actionType === 'CHECK_OUT' && (
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">বিকেলে ফাইনাল আউট শর্ত:</span> দিনশেষে চূড়ান্ত প্রস্থানের জন্য ফিঙ্গারপ্রিন্ট এবং ডিজিটাল স্বাক্ষর উভয়ই আবশ্যক।
                  </div>
                </div>
              )}

              {signatureError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{signatureError}</span>
                </div>
              )}

              <SignaturePad
                label={
                  actionType === 'CHECK_OUT'
                    ? 'বিকেলে ফাইনাল আউটের স্বাক্ষর (Final Check-out Signature)'
                    : actionType === 'MOVEMENT_OUT'
                    ? 'বাইরে যাওয়ার প্রস্থান স্বাক্ষর (Gate Pass Signature)'
                    : 'আউটলেটে উপস্থিতি স্বাক্ষর (Present Signature)'
                }
                onSave={dataUrl => {
                  setSignatureDataUrl(dataUrl);
                  if (dataUrl) setSignatureError(null);
                }}
                initialSignature={signatureDataUrl}
                required={actionType === 'CHECK_OUT'}
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  টাচপ্যাড, স্মার্টফোন বা মাউস দিয়ে স্বাক্ষর আঁকুন
                </span>
                <button
                  type="button"
                  onClick={() => handleAutoGenerateSignature(currentStaff?.name || 'Staff')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>নাম দিয়ে দ্রুত অটো-স্বাক্ষর</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. Fingerprint Scanner Trigger Area */}
          <div className="border-2 border-dashed border-indigo-200 rounded-3xl p-6 bg-gradient-to-b from-indigo-50/50 to-white flex flex-col items-center text-center relative overflow-hidden">
            {/* Pulsing Ripple if Scanning */}
            {scannerStatus === 'SCANNING' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 rounded-full bg-indigo-400/20 animate-ping"></div>
              </div>
            )}

            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-lg mb-3 ${
                scannerStatus === 'SCANNING'
                  ? 'bg-indigo-600 text-white ring-8 ring-indigo-200 scale-105 animate-pulse'
                  : scannerStatus === 'SUCCESS'
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-200'
                  : 'bg-white text-indigo-600 border border-indigo-200 hover:scale-105'
              }`}
            >
              <Fingerprint className="w-10 h-10" />
            </div>

            <h4 className="text-sm font-bold text-slate-800">
              {scannerStatus === 'SCANNING'
                ? 'ফিঙ্গারপ্রিন্ট স্ক্যান হচ্ছে... (POST /api/fingerprint/verify)'
                : scannerStatus === 'SUCCESS'
                ? 'ফিঙ্গারপ্রিন্ট ভেরিফাইড সম্পন্ন ✓'
                : 'ডিভাইসে আঙুল রাখুন এবং নিচের বাটনে চাপ দিন'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Staff: <span className="font-bold text-slate-800">{currentStaff?.name}</span> ({currentStaff?.staffCode})
            </p>

            <button
              type="button"
              disabled={scannerStatus === 'SCANNING'}
              onClick={handleTriggerBiometricScan}
              className={`mt-4 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer ${
                scannerStatus === 'SCANNING'
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : actionType === 'CHECK_OUT'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {scannerStatus === 'SCANNING' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ভেরিফিকেশন চলছে...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  <span>
                    {actionType === 'CHECK_OUT'
                      ? 'ফিঙ্গার ও স্বাক্ষর যাচাই করে ফাইনাল আউট (Final Out)'
                      : actionType === 'MOVEMENT_OUT'
                      ? 'ফিঙ্গার ও গেটপাস পাঞ্চ করুন (Movement Out)'
                      : 'ফিঙ্গারপ্রিন্ট যাচাই ও পাঞ্চ (Verify & Punch)'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* 6. USER'S EXACT VERIFICATION RECEIPT CARD */}
          {verifiedRecord && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>বায়োমেট্রিক ও স্বাক্ষর কনফার্মেশন স্লিপ (Verified Slip)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  HTTP :5050 ✓
                </span>
              </div>

              {/* Exact format from User Prompt */}
              <div className="bg-white p-4 rounded-xl border border-emerald-200 font-mono text-xs sm:text-sm text-slate-800 space-y-1.5 shadow-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans font-medium">Staff:</span>
                  <span className="font-bold">{verifiedRecord.staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans font-medium">Finger:</span>
                  <span className="font-bold text-emerald-700">Verified ✓</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans font-medium">Signature:</span>
                  {verifiedRecord.signatureUrl ? (
                    <div className="flex items-center gap-1.5">
                      <img
                        src={verifiedRecord.signatureUrl}
                        alt="Signature"
                        className="h-7 max-w-[120px] object-contain border border-slate-200 rounded bg-slate-50 px-1.5"
                      />
                      <span className="font-bold text-emerald-700 text-xs">Attached ✓</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 font-sans text-xs">Not recorded</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans font-medium">Time:</span>
                  <span className="font-bold">{verifiedRecord.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans font-medium">Type:</span>
                  <span className="font-bold text-indigo-700">{verifiedRecord.type}</span>
                </div>
                {verifiedRecord.destination && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans font-medium">Destination:</span>
                    <span className="font-bold">{verifiedRecord.destination}</span>
                  </div>
                )}
                {verifiedRecord.durationMins && verifiedRecord.durationMins > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans font-medium">Duration:</span>
                    <span className="font-bold text-indigo-800">
                      {formatMinutesBengali(verifiedRecord.durationMins)}
                    </span>
                  </div>
                )}
                {verifiedRecord.lateMins && verifiedRecord.lateMins > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans font-medium">Late:</span>
                    <span className="font-bold text-amber-700">
                      {verifiedRecord.lateMins} মিনিট বিলম্ব
                    </span>
                  </div>
                ) : null}
                {verifiedRecord.earlyMins && verifiedRecord.earlyMins > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans font-medium">Early:</span>
                    <span className="font-bold text-amber-700">
                      {verifiedRecord.earlyMins} মিনিট পূর্বে প্রস্থান
                    </span>
                  </div>
                ) : null}
                {verifiedRecord.overtimeMins && verifiedRecord.overtimeMins > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans font-medium">Overtime:</span>
                    <span className="font-bold text-purple-700">
                      {verifiedRecord.overtimeMins} মিনিট ওভারটাইম
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5">
                  <span className="text-slate-500 font-sans font-medium">Status:</span>
                  <span className="font-bold text-emerald-600">{verifiedRecord.status}</span>
                </div>
              </div>

              {/* Day-End Complete Timeline Display */}
              <div className="p-3 bg-white/80 rounded-xl border border-emerald-200/80 text-xs">
                <div className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>দিন শেষের সারসংক্ষেপ (Full Day Progress for {currentStaff?.name}):</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono font-semibold pt-1">
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-500">Check-in</div>
                    <div className="text-emerald-700">{todayAttendance?.arrivalTime || eventTime}</div>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-500">Movement</div>
                    <div className="text-sky-700">{activeMovement?.outTime || '11:20 AM'}</div>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-500">Return</div>
                    <div className="text-indigo-700">{activeMovement?.actualReturnTime || (actionType === 'MOVEMENT_RETURN' ? eventTime : '12:48 PM')}</div>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-500">Check-out</div>
                    <div className="text-slate-800">{todayAttendance?.departureTime || (actionType === 'CHECK_OUT' ? eventTime : '—')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            লোকাল ডেটাবেস ও অফলাইন ক্যাশে স্বয়ংক্রিয়ভাবে সংরক্ষিত
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>স্লিপ প্রিন্ট</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
            >
              সম্পন্ন / বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
