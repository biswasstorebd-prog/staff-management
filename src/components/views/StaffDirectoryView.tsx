import React, { useState } from 'react';
import { StaffMember, StaffRole, BranchOutlet } from '../../types';
import { storage } from '../../services/storage';
import { formatBDT, toBengaliDigits } from '../../utils/formatters';
import {
  Users,
  Search,
  Plus,
  Fingerprint,
  Phone,
  Mail,
  Shield,
  Briefcase,
  Edit2,
  CheckCircle2,
  XCircle,
  X,
  Filter,
  Building2,
  Clock,
  Trash2,
} from 'lucide-react';
import { BiometricTerminalModal } from '../BiometricTerminalModal';

export const StaffDirectoryView: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>(() => storage.getAllStaff());
  const [outlets] = useState<BranchOutlet[]>(() => storage.getOutlets());
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [kioskStaffId, setKioskStaffId] = useState<string | undefined>(undefined);

  // Add Form State
  const [formData, setFormData] = useState({
    staffCode: '',
    name: '',
    nameBn: '',
    role: 'DSR' as StaffRole,
    designation: '',
    department: '',
    branchId: 'outlet_1',
    branchName: 'ঢাকা প্রধান আউটলেট',
    shiftStartTime: '09:00 AM',
    shiftEndTime: '05:00 PM',
    phone: '',
    email: '',
    route: '',
    baseOpeningBalance: 0,
    status: 'active' as 'active' | 'inactive',
    fingerprintEnrolled: false,
    joinedDate: new Date().toISOString().split('T')[0],
  });

  const refreshList = () => {
    setStaffList(storage.getAllStaff());
  };

  const filteredStaff = staffList.filter(staff => {
    const matchesRole = roleFilter === 'ALL' || staff.role === roleFilter;
    const matchesBranch = selectedBranchId === 'ALL' || staff.branchId === selectedBranchId;
    const matchesSearch =
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.nameBn.includes(searchTerm) ||
      staff.staffCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.phone.includes(searchTerm) ||
      staff.designation.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesBranch && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormData({
      staffCode: `STF-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      nameBn: '',
      role: 'DSR',
      designation: 'Daily Sales Representative',
      department: 'Sales & Distribution',
      branchId: outlets[0]?.id || 'outlet_1',
      branchName: outlets[0]?.nameBn || 'ঢাকা প্রধান আউটলেট',
      shiftStartTime: '09:00 AM',
      shiftEndTime: '05:00 PM',
      phone: '+880 1',
      email: '',
      route: '',
      baseOpeningBalance: 5000,
      status: 'active',
      fingerprintEnrolled: false,
      joinedDate: new Date().toISOString().split('T')[0],
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormData({
      staffCode: staff.staffCode,
      name: staff.name,
      nameBn: staff.nameBn,
      role: staff.role,
      designation: staff.designation,
      department: staff.department,
      branchId: staff.branchId || outlets[0]?.id || 'outlet_1',
      branchName: staff.branchName || outlets[0]?.nameBn || 'ঢাকা প্রধান আউটলেট',
      shiftStartTime: staff.shiftStartTime || '09:00 AM',
      shiftEndTime: staff.shiftEndTime || '05:00 PM',
      phone: staff.phone,
      email: staff.email || '',
      route: staff.route || '',
      baseOpeningBalance: staff.baseOpeningBalance,
      status: staff.status,
      fingerprintEnrolled: staff.fingerprintEnrolled,
      joinedDate: staff.joinedDate,
    });
    setIsAddModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const matchedOutlet = outlets.find(o => o.id === formData.branchId);
    const branchName = matchedOutlet ? matchedOutlet.nameBn : formData.branchName;

    if (editingStaff) {
      storage.updateStaffMember({
        ...editingStaff,
        ...formData,
        branchName,
      });
    } else {
      storage.addStaffMember({
        ...formData,
        branchName,
      });
    }

    refreshList();
    setIsAddModalOpen(false);
    setEditingStaff(null);
  };

  const openBiometricEnrollment = (staffId: string) => {
    setKioskStaffId(staffId);
    setIsKioskOpen(true);
  };

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case 'Administrator':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Manager':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Teller':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DSR':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              কর্মী ব্যবস্থাপনা ও মাস্টার প্রোফাইল (Staff Management)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            শাখা ও আউটলেটভিত্তিক কর্মী নিয়োগ, শিফট সময়সূচি ও ফিঙ্গারপ্রিন্ট বায়োমেট্রিক নিবন্ধন
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenAddModal}
            id="add-new-staff-btn"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন কর্মী যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Branch / Outlet Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedBranchId}
              onChange={e => setSelectedBranchId(e.target.value)}
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

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="নাম, কোড, মোবাইল বা পদবি..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-indigo-500 text-slate-800"
            />
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'ALL', label: 'সব কর্মী' },
            { id: 'DSR', label: 'ডিএসআর' },
            { id: 'Manager', label: 'ম্যানেজার' },
            { id: 'Teller', label: 'টেলার' },
            { id: 'Other Staff', label: 'অন্যান্য কর্মী' },
            { id: 'Administrator', label: 'অ্যাডমিন' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                roleFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">কর্মী পরিচিতি</th>
                <th className="py-3 px-4">শাখা / আউটলেট</th>
                <th className="py-3 px-4">রোল ও পদবি</th>
                <th className="py-3 px-4">শিফট সময়</th>
                <th className="py-3 px-4">যোগাযোগ</th>
                <th className="py-3 px-4 text-center">বায়োমেট্রিক</th>
                <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    কোনো কর্মীর রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredStaff.map(staff => (
                  <tr key={staff.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{staff.name}</div>
                      <div className="text-[11px] text-slate-500">{staff.nameBn}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {staff.staffCode}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">
                        {staff.branchName || 'ঢাকা প্রধান আউটলেট'}
                      </div>
                      <div className="text-[10px] text-slate-400">এজেন্ট আউটলেট</div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${getRoleBadge(
                          staff.role
                        )}`}
                      >
                        {staff.role}
                      </span>
                      <div className="text-[11px] text-slate-600 mt-1">{staff.designation}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{staff.shiftStartTime || '09:00 AM'} - {staff.shiftEndTime || '05:00 PM'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">৮ ঘণ্টা অফিস শিফট</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-700">{staff.phone}</div>
                      {staff.email && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {staff.email}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {staff.fingerprintEnrolled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>নিবন্ধিত</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => openBiometricEnrollment(staff.id)}
                          className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200 cursor-pointer transition"
                        >
                          <Fingerprint className="w-3 h-3 text-amber-600 animate-pulse" />
                          <span>এনরোল করুন</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          staff.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                        title={staff.status}
                      />
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openBiometricEnrollment(staff.id)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="বায়োমেট্রিক পাঞ্চ / এনরোল টার্মিনাল"
                        >
                          <Fingerprint className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(staff)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="সম্পাদনা করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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

      {/* Biometric Terminal Modal for Enrollment / Verification */}
      {isKioskOpen && (
        <BiometricTerminalModal
          isOpen={isKioskOpen}
          onClose={() => {
            setIsKioskOpen(false);
            refreshList();
          }}
          onSuccess={() => {
            refreshList();
          }}
          initialStaffId={kioskStaffId}
        />
      )}

      {/* Add / Edit Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">
                  {editingStaff ? 'কর্মী প্রোফাইল সম্পাদনা' : 'নতুন কর্মী যোগ করুন'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    কর্মী কোড (Staff Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.staffCode}
                    onChange={e => setFormData({ ...formData, staffCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    সিস্টেম রোল (Role) *
                  </label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as StaffRole })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500 bg-white"
                  >
                    <option value="DSR">DSR (ডিএসআর - মূল ব্যাংক প্রতিনিধি)</option>
                    <option value="Manager">Manager (আউটলেট ম্যানেজার)</option>
                    <option value="Teller">Teller (টেলার / ক্যাশিয়ার)</option>
                    <option value="Other Staff">Other Staff (অন্যান্য কর্মী)</option>
                    <option value="Administrator">Administrator (অ্যাডমিনিস্ট্রেটর)</option>
                  </select>
                </div>
              </div>

              {/* Outlet / Branch Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    শাখা / আউটলেট (Branch / Outlet) *
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={e => {
                      const matched = outlets.find(o => o.id === e.target.value);
                      setFormData({
                        ...formData,
                        branchId: e.target.value,
                        branchName: matched ? matched.nameBn : formData.branchName,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500 bg-white font-medium"
                  >
                    {outlets.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.nameBn} ({o.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">পদবি (Designation)</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Senior Teller"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    নাম (ইংরেজি) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahim"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    নাম (বাংলায়)
                  </label>
                  <input
                    type="text"
                    value={formData.nameBn}
                    onChange={e => setFormData({ ...formData, nameBn: e.target.value })}
                    placeholder="যেমন: রহিম উদ্দিন"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500"
                  />
                </div>
              </div>

              {/* Shift Timing Configuration */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                <div className="font-bold text-indigo-950 text-[11px] uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>শিফট সময়সূচি (Shift Timings for Late/OT calculation)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">শিফট শুরু (Start Time)</label>
                    <input
                      type="text"
                      value={formData.shiftStartTime}
                      onChange={e => setFormData({ ...formData, shiftStartTime: e.target.value })}
                      placeholder="09:00 AM"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">শিফট সমাপ্তি (End Time)</label>
                    <input
                      type="text"
                      value={formData.shiftEndTime}
                      onChange={e => setFormData({ ...formData, shiftEndTime: e.target.value })}
                      placeholder="05:00 PM"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ইমেইল</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.fingerprintEnrolled}
                    onChange={e =>
                      setFormData({ ...formData, fingerprintEnrolled: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span>বায়োমেট্রিক ফিঙ্গারপ্রিন্ট নথিভুক্ত আছে</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.status === 'active'}
                    onChange={e =>
                      setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })
                    }
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span>সক্রিয় কর্মী (Active)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
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
