import React, { useState } from 'react';
import { StaffMovementRecord, StaffMember, SystemUser, BranchOutlet } from '../../types';
import { storage } from '../../services/storage';
import { toBengaliDigits } from '../../utils/formatters';
import {
  Navigation,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  FileCheck,
  AlertCircle,
  X,
  Printer,
  ChevronRight,
  Fingerprint,
  Building2,
  Calendar,
} from 'lucide-react';
import { BiometricTerminalModal } from '../BiometricTerminalModal';
import { formatMinutesBengali } from '../../utils/timeCalculators';

interface MovementViewProps {
  currentDate: string;
  currentUser: SystemUser;
  isNewMovementModalOpen?: boolean;
  onCloseNewMovementModal?: () => void;
}

export const MovementView: React.FC<MovementViewProps> = ({
  currentDate,
  currentUser,
}) => {
  const [movements, setMovements] = useState<StaffMovementRecord[]>(() =>
    storage.getMovementRecords(currentDate)
  );
  const [staffList] = useState<StaffMember[]>(() => storage.getAllStaff());
  const [outlets] = useState<BranchOutlet[]>(() => storage.getOutlets());
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [kioskStaffId, setKioskStaffId] = useState<string | undefined>(undefined);
  const [selectedTokenForPrint, setSelectedTokenForPrint] = useState<StaffMovementRecord | null>(null);

  // Form State for new gate pass
  const [selectedStaffId, setSelectedStaffId] = useState(staffList[0]?.id || '');
  const [purposeType, setPurposeType] = useState<StaffMovementRecord['purposeType']>('Official visit');
  const [destination, setDestination] = useState('Bank Branch (মূল ব্যাংক প্রধান শাখা)');
  const [outTime, setOutTime] = useState('11:20 AM');
  const [expectedReturnTime, setExpectedReturnTime] = useState('01:00 PM');
  const [remarks, setRemarks] = useState('');

  const refreshMovements = () => {
    setMovements(storage.getMovementRecords(currentDate));
  };

  const filteredMovements = movements.filter(m => {
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? !m.isCompleted
        : m.isCompleted;

    const matchesBranch = branchFilter === 'ALL' ? true : m.branchId === branchFilter;

    const matchesSearch =
      m.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.tokenNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.purposeType.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesBranch && matchesSearch;
  });

  const handleMarkReturn = (record: StaffMovementRecord) => {
    const returnTimeStr = '12:48 PM'; // Default user realistic demonstration time or current
    storage.recordMovementReturn(record.id, returnTimeStr);
    refreshMovements();
  };

  const handleCreateMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find(s => s.id === selectedStaffId);
    if (!staff) return;

    storage.addMovementRecord({
      staffId: staff.id,
      staffName: staff.name,
      staffRole: staff.role,
      branchId: staff.branchId || 'outlet_1',
      branchName: staff.branchName || 'ঢাকা প্রধান আউটলেট',
      date: currentDate,
      outTime,
      expectedReturnTime,
      purposeType,
      destination,
      remarks,
      approvalStatus: 'Approved',
      approvedBy: `${currentUser.displayName} (${currentUser.role})`,
      isCompleted: false,
    });

    refreshMovements();
    setIsAddModalOpen(false);
    setDestination('');
    setRemarks('');
  };

  // Metrics
  const activeCount = movements.filter(m => !m.isCompleted).length;
  const completedCount = movements.filter(m => m.isCompleted).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              স্টাফ মুভমেন্ট ও গেটপাস রেজিস্টার (Staff Movement Tracking)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            কর্মীদের অফিসিয়াল ভিজিট (Bank Branch, Customer), বাইরে যাওয়া-আসা ও ফিঙ্গারপ্রিন্ট ভিত্তিক রিটার্ন অনুমোদন
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setKioskStaffId(undefined);
              setIsKioskOpen(true);
            }}
            id="movement-kiosk-btn"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Fingerprint className="w-4 h-4 animate-pulse" />
            <span>ফিঙ্গারপ্রিন্ট মুভমেন্ট টার্মিনাল</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            id="issue-new-gatepass-btn"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন মুভমেন্ট এন্ট্রি</span>
          </button>
        </div>
      </div>

      {/* Movement Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">আজকের মোট মুভমেন্ট</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{movements.length} টি</div>
          <div className="text-[10px] text-slate-500 mt-0.5">নিবন্ধিত গেটপাস</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">বাইরে অবস্থানরত (Active)</div>
          <div className="text-xl font-bold text-sky-600 mt-1 font-mono">{activeCount} জন</div>
          <div className="text-[10px] text-sky-700 mt-0.5">এখনও ফেরত আসেননি</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">সম্পন্ন মুভমেন্ট (Returned)</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{completedCount} টি</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">অফিসে ফেরত এসেছেন</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">বায়োমেট্রিক ইন্টিগ্রেশন</div>
          <div className="text-xl font-bold text-indigo-600 mt-1 font-mono">সক্রিয় (:5050)</div>
          <div className="text-[10px] text-indigo-700 mt-0.5">আঙুলের ছাপে ভেরিফাইড</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Branch / Outlet Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">সকল শাখা / আউটলেট</option>
              {outlets.map(o => (
                <option key={o.id} value={o.id}>
                  {o.nameBn}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সকল ({movements.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'ACTIVE' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              বাইরে অবস্থানরত ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'COMPLETED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ফেরত আসা ({completedCount})
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="নাম, টোকেন বা গন্তব্য খুঁজুন..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-indigo-500 text-slate-800"
          />
        </div>
      </div>

      {/* Movement Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">টোকেন নম্বর</th>
                <th className="py-3 px-4">কর্মী পরিচিতি</th>
                <th className="py-3 px-4">মুভমেন্টের কারণ ও গন্তব্য</th>
                <th className="py-3 px-4 text-center">বাইরে যাওয়া (Out)</th>
                <th className="py-3 px-4 text-center">ফিরে আসা (Return)</th>
                <th className="py-3 px-4 text-center">মোট সময়</th>
                <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    কোনো মুভমেন্টের রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredMovements.map(mov => (
                  <tr key={mov.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-sky-800 whitespace-nowrap">
                      {mov.tokenNo}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{mov.staffName}</div>
                      <div className="text-[10px] text-slate-500">{mov.staffRole} • {mov.branchName || 'ঢাকা প্রধান আউটলেট'}</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800">{mov.purposeType}</div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{mov.destination}</span>
                      </div>
                      {mov.remarks && (
                        <div className="text-[10px] text-slate-400 italic mt-0.5">{mov.remarks}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                      {mov.outTime}
                    </td>

                    <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                      {mov.actualReturnTime ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {mov.actualReturnTime}
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10.5px]">
                          সম্ভাব্য: {mov.expectedReturnTime || '০১:০০ PM'}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-semibold text-indigo-900 whitespace-nowrap">
                      {mov.durationMinutes && mov.durationMinutes > 0 ? (
                        <span>{formatMinutesBengali(mov.durationMinutes)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          mov.isCompleted
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200 animate-pulse'
                        }`}
                      >
                        {mov.isCompleted ? 'ফেরত এসেছেন ✓' : 'বাইরে অবস্থানরত'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {!mov.isCompleted && (
                          <button
                            onClick={() => handleMarkReturn(mov)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10.5px] font-bold transition cursor-pointer whitespace-nowrap"
                            title="অফিসে ফেরার সময় নথিভুক্ত করুন"
                          >
                            ফেরত আগমন
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedTokenForPrint(mov)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="গেটপাস প্রিন্ট ভিউ"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Biometric Terminal Modal for Movement Out / Return */}
      {isKioskOpen && (
        <BiometricTerminalModal
          isOpen={isKioskOpen}
          onClose={() => {
            setIsKioskOpen(false);
            refreshMovements();
          }}
          onSuccess={() => {
            refreshMovements();
          }}
          initialStaffId={kioskStaffId}
          initialDate={currentDate}
        />
      )}

      {/* Add Gate Pass Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-800">
                  নতুন স্টাফ মুভমেন্ট / গেটপাস ইস্যু
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMovement} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">কর্মী নির্বাচন করুন *</label>
                <select
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500 bg-white font-medium text-slate-800"
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.staffCode}) — {s.role} ({s.branchName || 'ঢাকা আউটলেট'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">মুভমেন্টের কারণ (Purpose) *</label>
                  <select
                    value={purposeType}
                    onChange={e => setPurposeType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500 bg-white"
                  >
                    <option value="Official visit">Official visit (দাপ্তরিক কাজ)</option>
                    <option value="Bank work">Bank work (মূল ব্যাংক শাখা কাজ)</option>
                    <option value="Customer visit">Customer visit (গ্রাহক সেবা)</option>
                    <option value="Document submission">Document submission (কাগজপত্র জমা)</option>
                    <option value="Field duty">Field duty (মাঠপর্যায়ে কাজ)</option>
                    <option value="Emergency">Emergency (জরুরি প্রয়োজন)</option>
                    <option value="Personal errand">Personal errand (ব্যক্তিগত কাজ)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">গন্তব্য (Destination) *</label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    placeholder="e.g. Bank Branch"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">প্রস্থানের সময় (Out Time) *</label>
                  <input
                    type="text"
                    required
                    value={outTime}
                    onChange={e => setOutTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500 font-mono"
                    placeholder="11:20 AM"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">সম্ভাব্য ফেরার সময় (Expected Return)</label>
                  <input
                    type="text"
                    value={expectedReturnTime}
                    onChange={e => setExpectedReturnTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500 font-mono"
                    placeholder="01:00 PM"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">মন্তব্য / অনুমোদন নোট</label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="যেমন: ব্যাংক শাখা থেকে ড্রাফট ও ক্যাশ সমাহার কাজ..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold transition shadow-xs cursor-pointer"
                >
                  ইস্যু ও অনুমোদন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gate Pass Print Voucher Slip */}
      {selectedTokenForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-sky-800 font-mono">GATE PASS SLIP</span>
              <button
                onClick={() => setSelectedTokenForPrint(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2 text-xs font-mono">
              <div className="text-center font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                {selectedTokenForPrint.branchName || 'এজেন্ট আউটলেট'}
              </div>
              <div className="flex justify-between">
                <span>Token:</span>
                <span className="font-bold">{selectedTokenForPrint.tokenNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Staff:</span>
                <span className="font-bold">{selectedTokenForPrint.staffName}</span>
              </div>
              <div className="flex justify-between">
                <span>Out Time:</span>
                <span>{selectedTokenForPrint.outTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Return Time:</span>
                <span>{selectedTokenForPrint.actualReturnTime || selectedTokenForPrint.expectedReturnTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Purpose:</span>
                <span>{selectedTokenForPrint.purposeType}</span>
              </div>
              <div className="flex justify-between">
                <span>Destination:</span>
                <span>{selectedTokenForPrint.destination}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-sky-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
