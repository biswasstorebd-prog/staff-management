import React, { useState } from 'react';
import { StaffMovementRecord, SystemUser } from '../../types';
import { storage } from '../../services/storage';
import {
  UserCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Navigation,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  MapPin,
} from 'lucide-react';

interface ManagerDeskViewProps {
  currentDate: string;
  currentUser: SystemUser;
}

export const ManagerDeskView: React.FC<ManagerDeskViewProps> = ({
  currentDate,
  currentUser,
}) => {
  const [movements, setMovements] = useState<StaffMovementRecord[]>(() =>
    storage.getMovementRecords(currentDate)
  );

  const refreshList = () => {
    setMovements(storage.getMovementRecords(currentDate));
  };

  const handleApprove = (rec: StaffMovementRecord) => {
    storage.updateMovementRecord({
      ...rec,
      approvalStatus: 'Approved',
      approvedBy: `${currentUser.displayName} (${currentUser.role})`,
    });

    storage.addAuditLog({
      actor: currentUser.displayName,
      role: currentUser.role,
      action: 'APPROVE_MOVEMENT',
      module: 'MANAGER',
      details: `Manager approved gate pass ${rec.tokenNo} for ${rec.staffName} (${rec.purposeType}).`,
    });

    refreshList();
  };

  const handleReject = (rec: StaffMovementRecord) => {
    storage.updateMovementRecord({
      ...rec,
      approvalStatus: 'Rejected',
      approvedBy: `${currentUser.displayName} (${currentUser.role})`,
    });

    storage.addAuditLog({
      actor: currentUser.displayName,
      role: currentUser.role,
      action: 'REJECT_MOVEMENT',
      module: 'MANAGER',
      details: `Manager rejected gate pass ${rec.tokenNo} for ${rec.staffName}.`,
    });

    refreshList();
  };

  const pendingList = movements.filter(m => m.approvalStatus === 'Pending');
  const approvedList = movements.filter(m => m.approvalStatus === 'Approved');

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-5 rounded-2xl border border-purple-900/40 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck2 className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white">
              ম্যানেজার ডেস্ক ও অনুমোদন নিয়ন্ত্রণ (Manager Desk)
            </h2>
          </div>
          <p className="text-xs text-purple-200/70 mt-1">
            ফিল্ড মুভমেন্ট, গেটপাস অনুমোদন ও কর্মীদের দৈনিক কার্যক্রম নিরীক্ষণ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-purple-900/50 rounded-xl border border-purple-700/50 text-xs font-bold text-purple-200">
            মুলতুবি আবেদন: <span className="text-white font-black">{pendingList.length}</span> টি
          </div>
        </div>
      </div>

      {/* Pending Approvals Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-amber-50/50 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
              অনুমোদনের জন্য অপেক্ষমাণ মুভমেন্ট রিকোয়েস্ট ({pendingList.length})
            </h3>
          </div>
          <span className="text-[11px] text-amber-800 font-medium">
            নিশ্চিত করতে অনুমোদন অথবা বাতিল করুন
          </span>
        </div>

        {pendingList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            বর্তমানে অনুমোদনের জন্য কোনো মুলতুবি গেটপাস আবেদন নেই।
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingList.map(rec => (
              <div
                key={rec.id}
                className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{rec.staffName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                      {rec.staffRole}
                    </span>
                    <span className="text-[10px] font-mono text-indigo-600 font-bold">
                      {rec.tokenNo}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="font-semibold text-sky-800">{rec.purposeType}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {rec.destination}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    বাহির সময়: {rec.outTime} | সম্ভাব্য ফেরত: {rec.expectedReturnTime || '—'}
                  </div>
                  {rec.remarks && (
                    <div className="text-[11px] text-slate-500 italic">কারণ: {rec.remarks}</div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleReject(rec)}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>প্রত্যাখ্যান</span>
                  </button>

                  <button
                    onClick={() => handleApprove(rec)}
                    className="px-3.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-500 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>অনুমোদন করুন</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Movements List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              অনুমোদিত ফিল্ড মুভমেন্ট তালিকা ({approvedList.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/70 text-[10.5px] font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">টোকেন</th>
                <th className="py-2.5 px-4">কর্মী</th>
                <th className="py-2.5 px-4">উদ্দেশ্য</th>
                <th className="py-2.5 px-4">গন্তব্য</th>
                <th className="py-2.5 px-4 text-center">বাহির সময়</th>
                <th className="py-2.5 px-4 text-center">অনুমোদনকারী</th>
                <th className="py-2.5 px-4 text-center">স্থিতি</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {approvedList.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{rec.tokenNo}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{rec.staffName}</td>
                  <td className="py-3 px-4 text-sky-800 font-semibold">{rec.purposeType}</td>
                  <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{rec.destination}</td>
                  <td className="py-3 px-4 text-center font-mono">{rec.outTime}</td>
                  <td className="py-3 px-4 text-center text-slate-500 text-[11px]">{rec.approvedBy}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rec.isCompleted ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {rec.isCompleted ? 'ফেরত এসেছেন' : 'ফিল্ডে কর্মরত'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
