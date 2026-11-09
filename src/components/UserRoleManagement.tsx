import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Check, 
  X, 
  Edit3, 
  Shield, 
  Eye, 
  CheckCircle2, 
  KeyRound, 
  Users as UsersIcon, 
  ShoppingBag, 
  Package, 
  Boxes, 
  Truck, 
  ClipboardList, 
  BarChart3 
} from 'lucide-react';
import { User, Role } from '../types/aybos';
import { useStore } from '../context/StoreContext';

interface UserRoleManagementProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser?: (user: User) => void;
  onToggleUserStatus: (userId: string) => void;
  onSwitchUser: (user: User) => void;
  actionTrigger?: { module: string; timestamp: number };
}

export const UserRoleManagement: React.FC<UserRoleManagementProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onToggleUserStatus,
  onSwitchUser,
  actionTrigger
}) => {
  const store = useStore();

  // Search & Filter
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<Role>('CASHIER');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [password, setPassword] = useState('Password123!');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canManage = currentUser.role === 'MANAGER';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Listen to Top Bar primary action trigger
  useEffect(() => {
    if (actionTrigger?.module === 'USERS' && actionTrigger.timestamp > 0) {
      handleOpenAdd();
    }
  }, [actionTrigger]);

  // Open Drawer for Create
  const handleOpenAdd = () => {
    if (!canManage) return;
    setEditingUser(null);
    setName('');
    setUsername('');
    setRole('CASHIER');
    setStatus('ACTIVE');
    setPassword('Password123!');
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  // Open Drawer for Edit
  const handleOpenEdit = (user: User) => {
    if (!canManage) return;
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setRole(user.role);
    setStatus(user.status);
    setPassword('••••••••');
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingUser(null);
    setFormErrors({});
  };

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    const errors: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedName) errors.name = 'Full employee name is required.';
    if (!trimmedUsername) errors.username = 'Username is required.';

    const duplicate = users.find(u => 
      u.username.toLowerCase() === trimmedUsername && (!editingUser || u.id !== editingUser.id)
    );
    if (duplicate) {
      errors.username = `Username "${trimmedUsername}" is already taken.`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingUser) {
      const updatedUser: User = {
        ...editingUser,
        name: trimmedName,
        username: trimmedUsername,
        role,
        status
      };

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      } else {
        store.updateUser(updatedUser);
      }
      showToast(`User account "${trimmedName}" updated.`);
    } else {
      onAddUser({
        name: trimmedName,
        username: trimmedUsername,
        role,
        status,
        lastLogin: 'Never'
      });
      showToast(`Staff account "${trimmedName}" registered.`);
    }

    handleCloseDrawer();
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      const matchesSearch = q === '' ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // Permission Matrix Data (Modules × Roles)
  const permissionMatrix = [
    {
      module: 'POS Terminal',
      icon: ShoppingBag,
      description: 'Barcode register checkout, cash & card tender processing',
      manager: { access: 'FULL', label: 'Full Access' },
      cashier: { access: 'FULL', label: 'Full Access' },
      inventory: { access: 'NONE', label: 'No Access' },
      purchasing: { access: 'NONE', label: 'No Access' }
    },
    {
      module: 'Product Catalog',
      icon: Package,
      description: 'SKU master list, pricing margins, barcodes & categories',
      manager: { access: 'FULL', label: 'Full Access' },
      cashier: { access: 'NONE', label: 'No Access' },
      inventory: { access: 'READ', label: 'Read-Only' },
      purchasing: { access: 'READ', label: 'Read-Only' }
    },
    {
      module: 'Inventory & Ledger',
      icon: Boxes,
      description: 'Stock on hand, health bars, loss write-offs & audit log',
      manager: { access: 'FULL', label: 'Full Access' },
      cashier: { access: 'NONE', label: 'No Access' },
      inventory: { access: 'FULL', label: 'Full Access' },
      purchasing: { access: 'NONE', label: 'No Access' }
    },
    {
      module: 'Suppliers Registry',
      icon: Truck,
      description: 'Vendor master, corporate contacts & payment terms',
      manager: { access: 'FULL', label: 'Full Access' },
      cashier: { access: 'NONE', label: 'No Access' },
      inventory: { access: 'NONE', label: 'No Access' },
      purchasing: { access: 'FULL', label: 'Full Access' }
    },
    {
      module: 'Purchase Orders',
      icon: ClipboardList,
      description: 'Replenishment restock orders & dockside inwarding (GRN)',
      manager: { access: 'FULL', label: 'Full Access' },
      cashier: { access: 'NONE', label: 'No Access' },
      inventory: { access: 'RECEIVE', label: 'Receive Only' },
      purchasing: { access: 'FULL', label: 'Full Access' }
    },
    {
      module: 'Dashboard & Reports',
      icon: BarChart3,
      description: 'Executive revenue analytics, Recharts & CSV exports',
      manager: { access: 'FULL', label: 'Full Access' },
      cashier: { access: 'NONE', label: 'No Access' },
      inventory: { access: 'NONE', label: 'No Access' },
      purchasing: { access: 'NONE', label: 'No Access' }
    },
    {
      module: 'Users & Roles',
      icon: ShieldCheck,
      description: 'Staff directory, RBAC governance & security policies',
      manager: { access: 'FULL', label: 'Full Access' },
      cashier: { access: 'NONE', label: 'No Access' },
      inventory: { access: 'NONE', label: 'No Access' },
      purchasing: { access: 'NONE', label: 'No Access' }
    }
  ];

  const renderAccessBadge = (access: string, label: string) => {
    if (access === 'FULL') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
          <span>{label}</span>
        </span>
      );
    }
    if (access === 'READ' || access === 'RECEIVE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Eye className="w-3 h-3 text-blue-600" />
          <span>{label}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center text-slate-300 text-xs">
        —
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col min-h-0 space-y-3 relative overflow-y-auto pr-1" dir="ltr">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PERMISSION MATRIX (MODULES × ROLES) READ-ONLY GRID */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex-shrink-0">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Role-Based Access Control (RBAC) Permission Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Read-only matrix enforced throughout the platform navigation and data actions
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-800 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Full Access
            </span>
            <span className="flex items-center gap-1 text-blue-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Read-Only
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-300" /> Hidden / No Access
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100/60 text-slate-700 border-b border-slate-200 font-bold select-none">
                <th className="py-2.5 px-4 w-64">System Module</th>
                <th className="py-2.5 px-4 text-center">
                  <span className="text-purple-800 font-extrabold">MANAGER</span>
                </th>
                <th className="py-2.5 px-4 text-center">
                  <span className="text-blue-800 font-extrabold">CASHIER</span>
                </th>
                <th className="py-2.5 px-4 text-center">
                  <span className="text-amber-800 font-extrabold">INVENTORY</span>
                </th>
                <th className="py-2.5 px-4 text-center">
                  <span className="text-emerald-800 font-extrabold">PURCHASING</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionMatrix.map(row => {
                const Icon = row.icon;
                return (
                  <tr key={row.module} className="h-11 hover:bg-slate-50 transition">
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{row.module}</div>
                          <div className="text-xs text-slate-400">{row.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-center">
                      {renderAccessBadge(row.manager.access, row.manager.label)}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {renderAccessBadge(row.cashier.access, row.cashier.label)}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {renderAccessBadge(row.inventory.access, row.inventory.label)}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {renderAccessBadge(row.purchasing.access, row.purchasing.label)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* STAFF ACCOUNTS TABLE WITH STATUS TOGGLE & EDIT (NO INTERNAL IDS) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex-1 min-h-0 flex flex-col">
        
        {/* Table Toolbar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-shrink-0">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter staff by name or username..."
              className="w-full pl-9 pr-8 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white h-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 hidden sm:block">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1 text-sm rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
            >
              <option value="ALL">All Roles ({users.length})</option>
              <option value="MANAGER">Manager</option>
              <option value="CASHIER">Cashier</option>
              <option value="INVENTORY">Inventory Clerk</option>
              <option value="PURCHASING">Purchasing Officer</option>
            </select>
          </div>
        </div>

        {/* User Table (Rows: 52px tall, NO INTERNAL ID DISPLAYED) */}
        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-700 font-semibold select-none text-xs">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Role Badge</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-center">Status Toggle</th>
                <th className="py-3 px-4 text-center">Simulate Session</th>
                {canManage && <th className="py-3 px-4 text-center">Actions</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <UsersIcon className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">No staff members found</h4>
                      <p className="text-[13px] text-slate-500 mt-0.5">Try adjusting your search query or role filter.</p>
                      <button
                        onClick={() => { setSearch(''); setRoleFilter('ALL'); }}
                        className="mt-3 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-xs transition"
                      >
                        Reset filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const isCurrent = u.id === currentUser.id;
                  const isActive = u.status === 'ACTIVE';

                  return (
                    <tr key={u.id} className={`h-[52px] hover:bg-slate-50 transition ${isCurrent ? 'bg-emerald-50/40' : ''}`}>
                      
                      {/* Employee Name (NO INTERNAL ID) */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                            u.role === 'MANAGER' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            u.role === 'CASHIER' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            u.role === 'INVENTORY' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                                  Current
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-2.5 px-4 text-slate-600 text-sm">
                        {u.username}
                      </td>

                      {/* Role Badge */}
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          u.role === 'MANAGER' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          u.role === 'CASHIER' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          u.role === 'INVENTORY' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Last Activity (Inter tabular-nums) */}
                      <td className="py-2.5 px-4 text-slate-500 text-xs tabular-nums">
                        {u.lastLogin || 'Never'}
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              if (u.role === 'MANAGER' && isActive) {
                                showToast('Manager account cannot be deactivated to prevent system lockout.');
                                return;
                              }
                              onToggleUserStatus(u.id);
                              showToast(`Account status toggled for ${u.name}.`);
                            }}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isActive ? 'bg-emerald-600' : 'bg-slate-300'
                            }`}
                            title={`Click to ${isActive ? 'Deactivate' : 'Activate'}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className={`text-xs font-semibold ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>

                      {/* Session Simulator */}
                      <td className="py-2.5 px-4 text-center">
                        {!isCurrent ? (
                          <button
                            onClick={() => {
                              onSwitchUser(u);
                              showToast(`Switched active session to ${u.name} (${u.role}).`);
                            }}
                            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition h-7 shadow-2xs border border-slate-200"
                          >
                            Simulate
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-xs flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active Now</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition focus-visible:outline-2 focus-visible:outline-emerald-500"
                            title="Edit staff details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      )}

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT STAFF ACCOUNT SLIDE-OVER DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" dir="ltr">
          <div 
            onClick={handleCloseDrawer}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {editingUser ? 'Edit Staff Account' : 'Register Staff Account'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      RBAC functional assignment & security credentials
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCloseDrawer}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
                
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">
                    Employee Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="e.g. Youssef Khaled"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 bg-white ${
                      formErrors.name ? 'border-red-400 bg-red-50/50' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-600 mt-1 font-medium">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">
                    Login Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (formErrors.username) setFormErrors(prev => ({ ...prev, username: '' }));
                    }}
                    placeholder="e.g. youssef_k"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 bg-white ${
                      formErrors.username ? 'border-red-400 bg-red-50/50' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.username && (
                    <p className="text-xs text-red-600 mt-1 font-medium">{formErrors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">
                    Assigned Role (RBAC Scope) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 text-sm"
                  >
                    <option value="CASHIER">CASHIER — POS Terminal only</option>
                    <option value="INVENTORY">INVENTORY — Stock balances, audit ledger & catalog read</option>
                    <option value="PURCHASING">PURCHASING — Suppliers, PO restock & catalog read</option>
                    <option value="MANAGER">MANAGER — Full administrative access to all 7 modules</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">
                    Account Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 text-sm"
                  >
                    <option value="ACTIVE">Active Account</option>
                    <option value="INACTIVE">Suspended / Inactive</option>
                  </select>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    <span>Authentication Credentials</span>
                  </div>
                  <p>
                    {editingUser 
                      ? 'Password remains protected. Staff members can reset credentials via manager authorization.' 
                      : 'Account is provisioned with default supermarket staff credentials.'}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition h-10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition h-10 active:scale-98"
                  >
                    {editingUser ? 'Save Account' : 'Register Account'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
