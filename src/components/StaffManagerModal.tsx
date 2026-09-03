import React, { useState } from 'react';
import { DSRStaff } from '../types';
import { formatBDT } from '../utils/formatters';
import { storage } from '../services/storage';
import { Users, Plus, Phone, MapPin, X, Check, Wallet } from 'lucide-react';

interface StaffManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: DSRStaff[];
  onRefresh: () => void;
}

export const StaffManagerModal: React.FC<StaffManagerModalProps> = ({
  isOpen,
  onClose,
  staffList,
  onRefresh,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [phone, setPhone] = useState('');
  const [route, setRoute] = useState('');
  const [baseOpeningBalance, setBaseOpeningBalance] = useState<number>(5000);

  if (!isOpen) return null;

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    storage.addStaff({
      name: name.trim(),
      staffCode: staffCode.trim() || `DSR-${Math.floor(100 + Math.random() * 900)}`,
      phone: phone.trim() || '+880 1700-000000',
      route: route.trim() || 'General Territory',
      baseOpeningBalance: Number(baseOpeningBalance) || 0,
      status: 'active',
    });

    setName('');
    setStaffCode('');
    setPhone('');
    setRoute('');
    setIsAdding(false);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-base">DSR Staff Directory & Routes</h3>
              <p className="text-xs text-slate-300">
                Manage Daily Sales Representatives, assigned territories, and baseline balances
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Registered DSR Staff ({staffList.length})
            </span>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New DSR
              </button>
            )}
          </div>

          {/* Add form */}
          {isAdding && (
            <form
              onSubmit={handleAddStaff}
              className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-indigo-200">
                <span className="font-bold text-indigo-950">Add New DSR Profile</span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    DSR Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Rahim, Karim"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Staff Code / ID
                  </label>
                  <input
                    type="text"
                    value={staffCode}
                    onChange={e => setStaffCode(e.target.value)}
                    placeholder="e.g. DSR-106"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone / Contact
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+880 17XX-XXXXXX"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Route / Territory
                  </label>
                  <input
                    type="text"
                    value={route}
                    onChange={e => setRoute(e.target.value)}
                    placeholder="e.g. Dhanmondi & Mohammadpur"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Baseline Opening Float (৳)
                </label>
                <input
                  type="number"
                  value={baseOpeningBalance}
                  onChange={e => setBaseOpeningBalance(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold cursor-pointer"
                >
                  Save DSR
                </button>
              </div>
            </form>
          )}

          {/* List */}
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
            {staffList.map(s => (
              <div
                key={s.id}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-sm">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      {s.name}
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {s.staffCode}
                      </span>
                    </div>
                    <div className="text-slate-500 flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {s.route}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {s.phone}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">
                    Base Float
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    {formatBDT(s.baseOpeningBalance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
