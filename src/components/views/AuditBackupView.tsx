import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { SystemAuditEntry, SystemUser } from '../../types';
import {
  ShieldAlert,
  Download,
  Upload,
  RotateCcw,
  Search,
  CheckCircle2,
  FileText,
  Database,
  History,
  Wifi,
  WifiOff,
  RefreshCw,
  Lock,
  Users,
  ShieldCheck,
  Server,
  HardDrive,
} from 'lucide-react';

interface AuditBackupViewProps {
  onResetData: () => void;
}

export const AuditBackupView: React.FC<AuditBackupViewProps> = ({ onResetData }) => {
  const [auditLogs, setAuditLogs] = useState<SystemAuditEntry[]>(() => storage.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const syncQueue = storage.getOfflineQueue();
  const pendingCount = syncQueue.filter(q => q.status === 'PENDING').length;

  const filteredLogs = auditLogs.filter(l => {
    const matchesModule = moduleFilter === 'ALL' || l.module === moduleFilter;
    const matchesSearch =
      l.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.module.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesModule && matchesSearch;
  });

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const result = await storage.syncOfflineQueueToServer();
      setSyncFeedback(
        `সফলভাবে ${result.syncedCount} টি অফলাইন রেকর্ড মূল সার্ভার ডাটাবেসে সিঙ্ক সম্পন্ন হয়েছে!`
      );
      setAuditLogs(storage.getAuditLogs());
    } catch {
      setSyncFeedback('সার্ভার সংযোগ বিচ্ছিন্ন। লোকাল ক্যাশে রেকর্ডগুলো সংরক্ষিত আছে।');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadBackup = () => {
    const backupData = {
      version: '2.0.0',
      system: 'Agent Banking Outlet Staff & Biometric Attendance System',
      exportedAt: new Date().toISOString(),
      outlets: storage.getOutlets(),
      staffMembers: storage.getAllStaff(),
      attendance: storage.getAttendanceRecords(),
      movements: storage.getMovementRecords(),
      offlineQueue: storage.getOfflineQueue(),
      auditLogs: storage.getAuditLogs(),
    };

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `AGENT_BANK_ATTENDANCE_BACKUP_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.staffMembers && Array.isArray(json.staffMembers)) {
          localStorage.setItem('staff_master_members_v1', JSON.stringify(json.staffMembers));
        }
        if (json.outlets && Array.isArray(json.outlets)) {
          localStorage.setItem('branch_outlets_v1', JSON.stringify(json.outlets));
        }
        if (json.attendance && Array.isArray(json.attendance)) {
          localStorage.setItem('dsr_attendance_records_v1', JSON.stringify(json.attendance));
        }
        if (json.movements && Array.isArray(json.movements)) {
          localStorage.setItem('staff_movement_records_v1', JSON.stringify(json.movements));
        }
        if (json.auditLogs && Array.isArray(json.auditLogs)) {
          localStorage.setItem('system_audit_logs_v1', JSON.stringify(json.auditLogs));
        }

        setRestoreStatus('সফলভাবে ব্যাকআপ ডাটাবেসে রিস্টোর করা হয়েছে!');
        setAuditLogs(storage.getAuditLogs());
        setTimeout(() => window.location.reload(), 1200);
      } catch {
        setRestoreStatus('ভুল বা ক্ষতিগ্রস্ত JSON ফাইল। রিস্টোর ব্যর্থ হয়েছে।');
      }
    };
    reader.readAsText(file);
  };

  // Local storage metrics
  const totalStaff = storage.getAllStaff().length;
  const totalAttendance = storage.getAttendanceRecords().length;
  const totalMovements = storage.getMovementRecords().length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              সিস্টেম অডিট লগ, অফলাইন সিঙ্ক ও ইউজার রোল ম্যানেজমেন্ট
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            অফলাইন টু অনলাইন অটো সিঙ্ক, লোকাল ক্যাশে ডাটাবেস ও সিকিউর অডিট ট্রেইল
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>সম্পূর্ণ ডাটাবেস ব্যাকআপ (JSON)</span>
          </button>

          <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>ব্যাকআপ রিস্টোর</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={onResetData}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ফ্যাক্টরি রিসেট</span>
          </button>
        </div>
      </div>

      {restoreStatus && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{restoreStatus}</span>
        </div>
      )}

      {/* Sync Status & Offline Queue Monitor Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sync Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">
                🔄 অফলাইন → অনলাইন অটোমেটিক সিঙ্ক ইঞ্জিন (Offline-to-Online Sync Engine)
              </h3>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                pendingCount > 0
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {pendingCount > 0 ? (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>{pendingCount} টি রেকর্ড সিঙ্কের অপেক্ষায়</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3" />
                  <span>সকল রেকর্ড সার্ভারের সাথে সিঙ্কড ✓</span>
                </>
              )}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            ইন্টারনেট না থাকলেও স্থানীয় পিসির লোকাল ডাটাবেসে নির্ভুলভাবে ফিঙ্গারপ্রিন্ট হাজিরা ও মুভমেন্ট সংরক্ষিত হয়। ইন্টারনেট সংযোগ পাওয়া মাত্র স্বয়ংক্রিয়ভাবে বা নিচের বোতাম চেপে কেন্দ্রীয় ক্লাউড সার্ভারের সাথে সিঙ্ক নিশ্চিত করা যায়।
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500 font-mono">
              সর্বশেষ অটো সিঙ্ক: <span className="font-bold text-slate-700">সক্রিয় (প্রতি ৩০ সেকেন্ডে যাচাই)</span>
            </div>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'সার্ভার সিঙ্ক চলছে...' : 'এখনই সার্ভার সিঙ্ক করুন (Force Sync Now)'}</span>
            </button>
          </div>

          {syncFeedback && (
            <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}
        </div>

        {/* Local Storage & Cache Monitor */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">💾 লোকাল ডাটাবেস ও ক্যাশে স্ট্যাটাস</h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">মোট কর্মী ডাটা:</span>
              <span className="font-mono font-bold text-slate-800">{totalStaff} জন</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">মোট হাজিরা রেকর্ড:</span>
              <span className="font-mono font-bold text-slate-800">{totalAttendance} টি</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">মোট গেটপাস মুভমেন্ট:</span>
              <span className="font-mono font-bold text-slate-800">{totalMovements} টি</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">অডিট লগ এন্ট্রি:</span>
              <span className="font-mono font-bold text-indigo-600">{auditLogs.length} টি</span>
            </div>
          </div>
        </div>
      </div>

      {/* User & Role Management Matrix Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              🔐 ইউজার রোল ও অ্যাক্সেস পারমিশন ম্যাট্রিক্স (Role-Based Access Control)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">ব্যাংকিং নিরাপত্তা মানদণ্ড</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-[10.5px] font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">সিস্টেম রোল (Role)</th>
                <th className="py-2.5 px-4 text-center">বায়োমেট্রিক এনরোলমেন্ট</th>
                <th className="py-2.5 px-4 text-center">হাজিরা ভেরিফিকেশন</th>
                <th className="py-2.5 px-4 text-center">গেটপাস অনুমোদন</th>
                <th className="py-2.5 px-4 text-center">ক্যাশ ও ভাউচার লেজার</th>
                <th className="py-2.5 px-4 text-center">সিস্টেম অডিট ও সিঙ্ক</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-4 font-bold text-rose-700">Administrator</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ পূর্ণ অ্যাক্সেস</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ পূর্ণ অ্যাক্সেস</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ অনুমোদন ও ইস্যু</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ সার্বজনীন লেজার</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ পূর্ণ কনফিগার</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-purple-700">Manager</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ এনরোল করতে পারেন</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ হাজিরা নিরীক্ষা</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ অনুমোদন ও ইস্যু</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ শাখা লেজার ও ক্লোজিং</td>
                <td className="py-3 px-4 text-center text-slate-400">রিভিউ অনলি</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-amber-700">Teller</td>
                <td className="py-3 px-4 text-center text-slate-400">অনুমতি নেই</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ নিজস্ব পাঞ্চ</td>
                <td className="py-3 px-4 text-center text-indigo-600 font-bold">রিকোয়েস্ট করতে পারেন</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ ক্যাশ পোস্টিং</td>
                <td className="py-3 px-4 text-center text-slate-400">অনুমতি নেই</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-emerald-700">DSR (মূল ব্যাংক প্রতিনিধি)</td>
                <td className="py-3 px-4 text-center text-slate-400">অনুমতি নেই</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ ফিঙ্গারপ্রিন্ট চেক-ইন</td>
                <td className="py-3 px-4 text-center text-slate-400">প্রযোজ্য নয় (মূল ব্যাংক)</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ ক্যাশ/ব্যালেন্স ডেলিভারি</td>
                <td className="py-3 px-4 text-center text-slate-400">অনুমতি নেই</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter and Search Bar for Audit Log */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">সকল মডিউল (All Modules)</option>
              <option value="ATTENDANCE">ATTENDANCE (হাজিরা)</option>
              <option value="MOVEMENT">MOVEMENT (মুভমেন্ট)</option>
              <option value="STAFF">STAFF (কর্মী)</option>
              <option value="FINANCIAL">FINANCIAL (আর্থিক)</option>
              <option value="SYNC">SYNC (সার্ভার সিঙ্ক)</option>
            </select>
          </div>

          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="অ্যাক্টর, অ্যাকশন বা বিবরণ খুঁজুন..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-indigo-500 text-slate-800"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500">
          মোট রেকর্ড: <span className="font-bold text-slate-800">{filteredLogs.length}</span> টি
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">সময় ও তারিখ</th>
                <th className="py-3 px-4">ব্যবহারকারী (Actor)</th>
                <th className="py-3 px-4">মডিউল</th>
                <th className="py-3 px-4">অ্যাকশন</th>
                <th className="py-3 px-4">বিস্তারিত তথ্য</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                    কোনো অডিট লগ পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                      {new Date(log.timestamp).toLocaleString('bn-BD', { hour12: true })}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-sans">
                      <div className="font-bold text-slate-800">{log.actor}</div>
                      <div className="text-[10px] text-slate-400">{log.role}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {log.module}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-bold text-indigo-700">
                      {log.action}
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-700 leading-relaxed">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
