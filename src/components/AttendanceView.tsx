import React, { useState } from 'react';
import { AttendanceRecord, DSRStaff } from '../types';
import { formatDateDDMMYYYY, formatStandardDate, getTodayDateString } from '../utils/formatters';
import { storage } from '../services/storage';
import {
  Clock,
  UserCheck,
  Calendar,
  Search,
  Plus,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  MapPin,
} from 'lucide-react';

interface AttendanceViewProps {
  attendanceRecords: AttendanceRecord[];
  staffList: DSRStaff[];
  onRefresh: () => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendanceRecords,
  staffList,
  onRefresh,
  selectedDate,
  onDateChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuickCheckIn, setShowQuickCheckIn] = useState(false);
  const [checkInStaffId, setCheckInStaffId] = useState(staffList[0]?.id || '');
  const [checkInTime, setCheckInTime] = useState('09:15 AM');
  const [checkOutTime, setCheckOutTime] = useState('05:10 PM');
  const [checkInRemarks, setCheckInRemarks] = useState('');
  const [checkInStatus, setCheckInStatus] = useState<AttendanceRecord['status']>('Departed');

  const filteredRecords = attendanceRecords.filter(r => {
    if (selectedDate && r.date !== selectedDate) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!r.dsrName.toLowerCase().includes(q) && !(r.remarks || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find(s => s.id === checkInStaffId);
    if (!staff) return;

    storage.saveAttendance({
      dsrId: staff.id,
      dsrName: staff.name,
      date: selectedDate,
      arrivalTime: checkInTime,
      departureTime: checkOutTime,
      status: checkInStatus,
      remarks: checkInRemarks || `Attendance recorded for ${staff.name}`,
    });

    setShowQuickCheckIn(false);
    setCheckInRemarks('');
    onRefresh();
  };

  return (
    <div className="space-y-6" id="attendance-view-container">
      {/* Information Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                DSR Staff Attendance & Field Movement Register
              </h2>
              <p className="text-xs text-slate-500">
                Logically separated module — tracking daily arrival, departure, and field status.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuickCheckIn(true)}
            id="quick-attendance-btn"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Log Attendance Only
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300">
            <Calendar className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-700">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => onDateChange(e.target.value)}
              id="attendance-date-picker"
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden"
            />
          </div>

          <button
            onClick={() => onDateChange('2026-09-03')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedDate === '2026-09-03'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            03-09-2026
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search DSR attendance..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            id="search-attendance-input"
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
        id="attendance-table-card"
      >
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Attendance Records for {formatDateDDMMYYYY(selectedDate)}
          </span>
          <span className="text-[11px] text-slate-500">
            {filteredRecords.length} Staff Checked-In
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="attendance-register-table">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">DSR Staff</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Arrival Time</th>
                <th className="py-3 px-4">Departure Time</th>
                <th className="py-3 px-4">Attendance Status</th>
                <th className="py-3 px-4">Remarks / Field Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No attendance records for {formatDateDDMMYYYY(selectedDate)}.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => {
                  const staff = staffList.find(s => s.id === rec.dsrId);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 transition">
                      {/* DSR Staff */}
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                            {rec.dsrName.charAt(0)}
                          </div>
                          <div>
                            <div>{rec.dsrName}</div>
                            {staff && (
                              <div className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" />
                                {staff.route}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">
                        {formatDateDDMMYYYY(rec.date)}
                      </td>

                      {/* Arrival */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          {rec.arrivalTime || '—'}
                        </span>
                      </td>

                      {/* Departure */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-indigo-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-600" />
                          {rec.departureTime || '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            rec.status === 'Departed'
                              ? 'bg-slate-100 text-slate-700 border border-slate-300'
                              : rec.status === 'In Field'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          <CheckCircle className="w-3 h-3" />
                          {rec.status}
                        </span>
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-4 text-slate-600 max-w-sm">
                        {rec.remarks || 'Standard field visit'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Check-in Modal */}
      {showQuickCheckIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Log Attendance Entry (Without Financial Movement)
            </h3>
            <form onSubmit={handleQuickSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  DSR Staff
                </label>
                <select
                  value={checkInStaffId}
                  onChange={e => setCheckInStaffId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden"
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.staffCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Arrival Time
                  </label>
                  <input
                    type="text"
                    value={checkInTime}
                    onChange={e => setCheckInTime(e.target.value)}
                    placeholder="09:15 AM"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departure Time
                  </label>
                  <input
                    type="text"
                    value={checkOutTime}
                    onChange={e => setCheckOutTime(e.target.value)}
                    placeholder="05:10 PM"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={checkInStatus}
                  onChange={e => setCheckInStatus(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                >
                  <option value="Departed">Departed (Full Day Complete)</option>
                  <option value="In Field">In Field (Currently on Route)</option>
                  <option value="Present">Present in Office</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={checkInRemarks}
                  onChange={e => setCheckInRemarks(e.target.value)}
                  placeholder="e.g. Route clearance, visits completed"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickCheckIn(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                >
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
