import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { formatBDT, toBengaliDigits } from '../../utils/formatters';
import { BranchOutlet, StaffMonthlyReport } from '../../types';
import {
  FileBarChart2,
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  CalendarCheck,
  Navigation,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { formatMinutesBengali } from '../../utils/timeCalculators';

interface ReportsViewProps {
  currentDate: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ currentDate }) => {
  const [reportType, setReportType] = useState<
    'MONTHLY_ATTENDANCE' | 'DAILY_ATTENDANCE' | 'DSR_CASH' | 'MOVEMENT'
  >('MONTHLY_ATTENDANCE');

  // Month selector (default to current year-month, e.g. "2026-09")
  const defaultYearMonth = currentDate.substring(0, 7);
  const [selectedYearMonth, setSelectedYearMonth] = useState(defaultYearMonth);
  const [targetDate, setTargetDate] = useState(currentDate);

  const [outlets] = useState<BranchOutlet[]>(() => storage.getOutlets());
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');

  const [yearStr, monthStr] = selectedYearMonth.split('-');
  const selectedYear = parseInt(yearStr, 10) || 2026;
  const selectedMonth = parseInt(monthStr, 10) || 9;

  const monthlyReports: StaffMonthlyReport[] = storage.getStaffMonthlyReport(
    selectedYear,
    selectedMonth
  );

  const filteredMonthly = monthlyReports.filter(r =>
    selectedBranchId === 'ALL' ? true : r.branchId === selectedBranchId
  );

  const dsrSummaries = storage.getDailySummaries(targetDate);
  const attendanceRecords = storage.getAttendanceRecords(targetDate);
  const movements = storage.getMovementRecords(targetDate);

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'; // Include BOM for Excel Bengali/UTF-8

    if (reportType === 'MONTHLY_ATTENDANCE') {
      csvContent += 'Staff Code,Staff Name,Role,Branch,Total Work Days,Present Days,Absent Days,Late Days,Total Late Minutes,Early Depart Days,Overtime Minutes,Net Working Minutes,Attendance Rate %\n';
      filteredMonthly.forEach(r => {
        csvContent += `"${r.staffCode}","${r.staffName}","${r.role}","${r.branchName || ''}",${r.totalWorkingDays},${r.presentDays},${r.absentDays},${r.lateDays},${r.totalLateMinutes},${r.earlyDepartureDays},${r.totalOvertimeMinutes},${r.totalWorkingMinutes},"${r.attendancePercentage}%"\n`;
      });
    } else if (reportType === 'DAILY_ATTENDANCE') {
      csvContent += 'Staff Name,Role,Branch,Date,Arrival Time,Departure Time,Late Mins,Early Mins,Overtime Mins,Working Mins,Status,Remarks\n';
      attendanceRecords.forEach(a => {
        csvContent += `"${a.dsrName}","${a.role || ''}","${a.branchName || ''}","${a.date}","${a.arrivalTime}","${a.departureTime || ''}",${a.lateMinutes || 0},${a.earlyMinutes || 0},${a.overtimeMinutes || 0},${a.workingMinutes || 0},"${a.status}","${(a.remarks || '').replace(/"/g, '""')}"\n`;
      });
    } else if (reportType === 'DSR_CASH') {
      csvContent += 'DSR Name,Date,Arrival,Departure,Given BDT,Taken BDT,Net Position BDT,Remarks\n';
      dsrSummaries.forEach(s => {
        csvContent += `"${s.dsrName}","${s.date}","${s.arrival}","${s.departure}",${s.given},${s.taken},${s.netPosition},"${s.remarks.replace(/"/g, '""')}"\n`;
      });
    } else {
      csvContent += 'Token No,Staff Name,Role,Branch,Date,Out Time,Return Time,Duration Mins,Purpose,Destination,Status\n';
      movements.forEach(m => {
        csvContent += `"${m.tokenNo}","${m.staffName}","${m.staffRole}","${m.branchName || ''}","${m.date}","${m.outTime}","${m.actualReturnTime || m.expectedReturnTime || ''}",${m.durationMinutes || 0},"${m.purposeType}","${m.destination}","${m.isCompleted ? 'Returned' : 'In Field'}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${reportType}_REPORT_${reportType === 'MONTHLY_ATTENDANCE' ? selectedYearMonth : targetDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileBarChart2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              দাপ্তরিক রিপোর্ট ও ডাটা এক্সপোর্ট (Official Reports & Audits)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            মাসিক হাজিরা প্রতিবেদন, বিলম্ব ও ওভারটাইম স্টেটমেন্ট, এক্সেল (Excel/CSV) এক্সপোর্ট ও প্রিন্ট
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month or Date Selector depending on report */}
          {reportType === 'MONTHLY_ATTENDANCE' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <input
                type="month"
                value={selectedYearMonth}
                onChange={e => setSelectedYearMonth(e.target.value)}
                className="bg-transparent border-none text-slate-800 focus:outline-none cursor-pointer font-mono font-bold"
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <Calendar className="w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="bg-transparent border-none text-slate-800 focus:outline-none cursor-pointer font-mono"
              />
            </div>
          )}

          {/* Branch Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedBranchId}
              onChange={e => setSelectedBranchId(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">সকল শাখা</option>
              {outlets.map(o => (
                <option key={o.id} value={o.id}>
                  {o.nameBn}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="Excel compatible CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট / PDF</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setReportType('MONTHLY_ATTENDANCE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            reportType === 'MONTHLY_ATTENDANCE'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>১. মাসিক হাজিরা ও কার্যঘণ্টা প্রতিবেদন (Monthly Attendance)</span>
        </button>

        <button
          onClick={() => setReportType('DAILY_ATTENDANCE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            reportType === 'DAILY_ATTENDANCE'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>২. দৈনিক হাজিরা রেজিস্টার (Daily Attendance)</span>
        </button>

        <button
          onClick={() => setReportType('DSR_CASH')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            reportType === 'DSR_CASH'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>৩. ডিএসআর ক্যাশ ও ব্যালেন্স ডেলিভারি বিবরণী</span>
        </button>

        <button
          onClick={() => setReportType('MOVEMENT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            reportType === 'MOVEMENT'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>৪. গেটপাস ও মুভমেন্ট রেজিস্টার</span>
        </button>
      </div>

      {/* Report Data Display Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
        {/* Printable Official Letterhead */}
        <div className="p-6 border-b border-slate-200 text-center space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            এজেন্ট ব্যাংকিং আউটলেট পরিচালনা ব্যবস্থা
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {selectedBranchId === 'ALL'
              ? 'সকল শাখা ও আউটলেট সমন্বিত প্রতিবেদন'
              : outlets.find(o => o.id === selectedBranchId)?.nameBn || 'শাখা প্রতিবেদন'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {reportType === 'MONTHLY_ATTENDANCE'
              ? `মাসিক স্টাফ হাজিরা, বিলম্ব ও ওভারটাইম নিরীক্ষা বিবরণী • মাস: ${selectedYearMonth}`
              : reportType === 'DAILY_ATTENDANCE'
              ? `দৈনিক সার্বজনীন হাজিরা রেজিস্টার বিবরণী • তারিখ: ${targetDate}`
              : reportType === 'DSR_CASH'
              ? `ডিএসআর ক্যাশ ও ব্যালেন্স মুভমেন্ট অডিট • তারিখ: ${targetDate}`
              : `স্টাফ গেটপাস ও মুভমেন্ট ট্র্যাকিং লগ • তারিখ: ${targetDate}`}
          </p>
        </div>

        {/* 1. Monthly Attendance Report */}
        {reportType === 'MONTHLY_ATTENDANCE' && (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">কর্মী ও আইডি</th>
                  <th className="py-3 px-3">পদবি ও রোল</th>
                  <th className="py-3 px-3">শাখা</th>
                  <th className="py-3 px-2 text-center">কার্যদিবস</th>
                  <th className="py-3 px-2 text-center text-emerald-700">উপস্থিতি</th>
                  <th className="py-3 px-2 text-center text-amber-700">লেইট দিন (মিনিট)</th>
                  <th className="py-3 px-2 text-center text-rose-700">পূর্ব প্রস্থান</th>
                  <th className="py-3 px-2 text-center text-purple-700">ওভারটাইম</th>
                  <th className="py-3 px-2 text-center">নেট কর্মঘণ্টা</th>
                  <th className="py-3 px-3 text-center">হাজিরা হার (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMonthly.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      কোনো কর্মীর রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredMonthly.map(rep => (
                    <tr key={rep.staffId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{rep.staffName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{rep.staffCode}</div>
                      </td>

                      <td className="py-2.5 px-3 text-slate-700">{rep.role}</td>

                      <td className="py-2.5 px-3 text-slate-600">
                        {rep.branchName || 'ঢাকা প্রধান আউটলেট'}
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">
                        {rep.totalWorkingDays}
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-700">
                        {rep.presentDays}
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono text-xs">
                        <span className="font-bold text-amber-700">{rep.lateDays} দিন</span>
                        {rep.totalLateMinutes > 0 && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            ({rep.totalLateMinutes} মি.)
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono text-xs text-rose-600">
                        {rep.earlyDepartureDays} দিন
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono font-bold text-purple-700 text-xs">
                        {rep.totalOvertimeMinutes > 0
                          ? formatMinutesBengali(rep.totalOvertimeMinutes)
                          : '—'}
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono font-bold text-indigo-900">
                        {formatMinutesBengali(rep.totalWorkingMinutes)}
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${
                            rep.attendancePercentage >= 90
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : rep.attendancePercentage >= 75
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {rep.attendancePercentage}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Daily Attendance Report */}
        {reportType === 'DAILY_ATTENDANCE' && (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">কর্মী নাম</th>
                  <th className="py-2.5 px-3">রোল ও শাখা</th>
                  <th className="py-2.5 px-3 text-center">আগমনের সময়</th>
                  <th className="py-2.5 px-3 text-center">প্রস্থানের সময়</th>
                  <th className="py-2.5 px-3 text-center">বিলম্ব / ওটি</th>
                  <th className="py-2.5 px-3 text-center">উপস্থিতির স্থিতি</th>
                  <th className="py-2.5 px-3">মন্তব্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceRecords.map(att => (
                  <tr key={att.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{att.dsrName}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {att.role || 'Staff'} • {att.branchName || 'ঢাকা প্রধান আউটলেট'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                      {att.arrivalTime}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-800">
                      {att.departureTime || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-xs">
                      {att.lateMinutes ? (
                        <span className="text-amber-700 font-bold">{att.lateMinutes}মি. লেইট</span>
                      ) : att.overtimeMinutes ? (
                        <span className="text-purple-700 font-bold">+{att.overtimeMinutes}মি. ওটি</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-emerald-700">
                      {att.status}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{att.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. DSR Cash Movement Report */}
        {reportType === 'DSR_CASH' && (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">DSR Name</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-center">Arrival</th>
                  <th className="py-2.5 px-3 text-center">Departure</th>
                  <th className="py-2.5 px-3 text-right">Given (জমা)</th>
                  <th className="py-2.5 px-3 text-right">Taken (নেওয়া)</th>
                  <th className="py-2.5 px-3 text-right">Net Position</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dsrSummaries.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{item.dsrName}</td>
                    <td className="py-2.5 px-3 font-mono">{item.displayDate}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{item.arrival}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{item.departure}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700 font-mono">
                      {formatBDT(item.given)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600 font-mono">
                      {formatBDT(item.taken)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-black font-mono ${
                        item.netPosition >= 0 ? 'text-indigo-900' : 'text-rose-700'
                      }`}
                    >
                      {formatBDT(item.netPosition)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">{item.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Movement Report */}
        {reportType === 'MOVEMENT' && (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">টোকেন নং</th>
                  <th className="py-2.5 px-3">কর্মীর নাম ও রোল</th>
                  <th className="py-2.5 px-3">উদ্দেশ্য</th>
                  <th className="py-2.5 px-3">গন্তব্য</th>
                  <th className="py-2.5 px-3 text-center">বাহির সময়</th>
                  <th className="py-2.5 px-3 text-center">ফেরত সময়</th>
                  <th className="py-2.5 px-3 text-center">মোট সময়</th>
                  <th className="py-2.5 px-3 text-center">অনুমোদনকারী</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-800">{m.tokenNo}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold">{m.staffName}</span> ({m.staffRole})
                    </td>
                    <td className="py-2.5 px-3 text-sky-800 font-semibold">{m.purposeType}</td>
                    <td className="py-2.5 px-3 text-slate-600">{m.destination}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{m.outTime}</td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {m.actualReturnTime || m.expectedReturnTime || 'অফিসের বাইরে'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-indigo-900 font-bold">
                      {m.durationMinutes && m.durationMinutes > 0
                        ? formatMinutesBengali(m.durationMinutes)
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center text-[11px] text-slate-500">
                      {m.approvedBy || 'স্বয়ংক্রিয়'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Print Signatory Footer for Official Audit Submissions */}
        <div className="p-8 pt-12 border-t border-slate-200 grid grid-cols-3 gap-8 text-center text-xs font-semibold text-slate-700">
          <div>
            <div className="border-t border-slate-400 pt-2">প্রস্তুতকারক (Prepared By)</div>
            <div className="text-[10px] text-slate-400">টেলার / হিসাবরক্ষক</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-2">যাচাইকারী (Verified By)</div>
            <div className="text-[10px] text-slate-400">শাখা ইনচার্জ / সহকারী ম্যানেজার</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-2">অনুমোদনকারী (Branch Manager)</div>
            <div className="text-[10px] text-slate-400">এজেন্ট ব্যাংকিং আউটলেট ম্যানেজার</div>
          </div>
        </div>
      </div>
    </div>
  );
};
