import React, { useState, useMemo, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  X, 
  LayoutGrid, 
  List, 
  Package, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  Edit3, 
  Building2 
} from 'lucide-react';
import { Supplier, User } from '../types/aybos';
import { useStore } from '../context/StoreContext';

interface SupplierManagementProps {
  suppliers: Supplier[];
  currentUser: User;
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  actionTrigger?: { module: string; timestamp: number };
}

type ViewMode = 'cards' | 'table';

export const SupplierManagement: React.FC<SupplierManagementProps> = ({
  suppliers,
  currentUser,
  onAddSupplier,
  onUpdateSupplier,
  actionTrigger
}) => {
  const store = useStore();
  const { orders = [] } = store;

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // RBAC permissions: Managers and Purchasing officers can add/edit
  const canEdit = currentUser.role === 'MANAGER' || currentUser.role === 'PURCHASING';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Listen to Top Bar primary action button trigger
  useEffect(() => {
    if (actionTrigger?.module === 'SUPPLIERS' && actionTrigger.timestamp > 0) {
      handleOpenAdd();
    }
  }, [actionTrigger]);

  // Derive per-supplier metadata: last order date & products count
  const supplierStats = useMemo(() => {
    const stats: Record<string, { lastOrderDate: string; orderCount: number; estimatedSkus: number }> = {};

    suppliers.forEach(s => {
      const matchingOrders = orders.filter(o => o.supplierId === s.id);
      const sortedOrders = [...matchingOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const latestOrder = sortedOrders[0];

      const uniqueProductIds = new Set<string>();
      matchingOrders.forEach(o => {
        (o.items || []).forEach(item => uniqueProductIds.add(item.productId));
      });

      stats[s.id] = {
        lastOrderDate: latestOrder ? latestOrder.createdAt.substring(0, 10) : 'No orders yet',
        orderCount: matchingOrders.length,
        estimatedSkus: uniqueProductIds.size || Math.floor(4 + (parseInt(s.id.slice(-1)) || 2) * 2)
      };
    });

    return stats;
  }, [suppliers, orders]);

  // Drawer Open / Reset
  const handleOpenAdd = () => {
    if (!canEdit) return;
    setEditingSupplier(null);
    setName('');
    setContactPerson('');
    setPhone('+963 11 ');
    setEmail('');
    setAddress('');
    setPaymentTerms('Net 30 Days');
    setStatus('ACTIVE');
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    if (!canEdit) return;
    setEditingSupplier(sup);
    setName(sup.name);
    setContactPerson(sup.contactPerson);
    setPhone(sup.phone);
    setEmail(sup.email);
    setAddress(sup.address);
    setPaymentTerms(sup.paymentTerms);
    setStatus(sup.status);
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingSupplier(null);
    setFormErrors({});
  };

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    const errors: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedContact = contactPerson.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) errors.name = 'Supplier company name is required.';
    if (!trimmedContact) errors.contact = 'Account manager / contact person is required.';
    if (!trimmedPhone || trimmedPhone.length < 6) errors.phone = 'Valid phone number is required.';
    if (!trimmedEmail || !trimmedEmail.includes('@')) errors.email = 'Valid corporate email is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingSupplier) {
      onUpdateSupplier({
        ...editingSupplier,
        name: trimmedName,
        contactPerson: trimmedContact,
        phone: trimmedPhone,
        email: trimmedEmail,
        address: address.trim(),
        paymentTerms,
        status
      });
      showToast(`Supplier "${trimmedName}" profile updated.`);
    } else {
      onAddSupplier({
        name: trimmedName,
        contactPerson: trimmedContact,
        phone: trimmedPhone,
        email: trimmedEmail,
        address: address.trim(),
        paymentTerms,
        status
      });
      showToast(`Supplier "${trimmedName}" registered in directory.`);
    }

    handleCloseDrawer();
  };

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return suppliers.filter(s => {
      const matchesQuery = q === '' ||
        s.name.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q);

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [suppliers, search, statusFilter]);

  const activeCount = suppliers.filter(s => s.status === 'ACTIVE').length;

  return (
    <div className="h-full flex flex-col min-h-0 space-y-3 relative">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter and View Mode Toolbar (Flex-shrink-0) */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-shrink-0">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers by name, contact person, or email..."
            className="w-full pl-9 pr-8 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 h-9 placeholder:text-slate-400"
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

        {/* Status Filter & View Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-slate-600 hidden sm:block">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1 text-sm rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
            >
              <option value="ALL">All Vendors ({suppliers.length})</option>
              <option value="ACTIVE">Active Contracts ({activeCount})</option>
              <option value="INACTIVE">Inactive ({suppliers.length - activeCount})</option>
            </select>
          </div>

          {(search || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
              }}
              className="px-2.5 py-1.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-medium transition flex items-center gap-1 h-9"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* Card / Table View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-sm font-medium transition ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-sm font-medium transition ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================
          VIEW 1: CARDS VIEW (Scrolls vertically inside container)
         ======================================================== */}
      {viewMode === 'cards' && (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {filteredSuppliers.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-xl border border-slate-200">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No suppliers match your search</h3>
              <p className="text-[13px] text-slate-500 mt-0.5">Try clearing your search query or registering a new vendor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredSuppliers.map(s => {
                const stats = supplierStats[s.id] || { lastOrderDate: 'No orders yet', orderCount: 0, estimatedSkus: 0 };
                const isActive = s.status === 'ACTIVE';

                return (
                  <div 
                    key={s.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top row: Status Badge (NO INTERNAL ID) */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {s.paymentTerms}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{s.status}</span>
                        </span>
                      </div>

                      {/* Company Name */}
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition leading-snug">
                        {s.name}
                      </h3>
                      
                      {/* Account Contact */}
                      <p className="text-xs text-slate-600 font-medium mt-1 mb-2.5 flex items-center gap-1.5">
                        <span className="text-slate-400 text-xs">Contact:</span>
                        <strong className="text-slate-800">{s.contactPerson}</strong>
                      </p>

                      {/* Contact Details Block (Inter with tabular-nums for phone) */}
                      <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="tabular-nums text-slate-700">{s.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate text-slate-700">{s.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate text-slate-500">{s.address || 'Standard Depot Delivery'}</span>
                        </div>
                      </div>

                      {/* Products Supplied & Last Order Stats */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-150">
                          <div className="text-slate-400 text-xs uppercase font-semibold flex items-center gap-1">
                            <Package className="w-3 h-3 text-slate-400" />
                            <span>Supplied Items</span>
                          </div>
                          <div className="font-bold text-slate-800 tabular-nums mt-0.5">
                            {stats.estimatedSkus} catalog items
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-150">
                          <div className="text-slate-400 text-xs uppercase font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Last Order Date</span>
                          </div>
                          <div className="text-slate-700 font-medium text-xs mt-0.5 truncate tabular-nums">
                            {stats.lastOrderDate}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Card Footer: Edit Action */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-end">
                      {canEdit ? (
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-emerald-500"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Profile</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">Read-only</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          VIEW 2: TABLE VIEW (Sticky header, 52px rows, internal scroll, NO ID COLUMN)
         ======================================================== */}
      {viewMode === 'table' && (
        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-700 font-semibold select-none text-xs">
                  <th className="py-3 px-4">Supplier Company</th>
                  <th className="py-3 px-4">Key Contact Person</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Payment Terms</th>
                  <th className="py-3 px-4 text-center">Supplied Items</th>
                  <th className="py-3 px-4">Last Order Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {canEdit && <th className="py-3 px-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredSuppliers.map(s => {
                  const stats = supplierStats[s.id] || { lastOrderDate: '—', orderCount: 0, estimatedSkus: 0 };
                  const isActive = s.status === 'ACTIVE';

                  return (
                    <tr key={s.id} className="h-[52px] hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">{s.name}</td>
                      <td className="py-2.5 px-4 text-slate-700 whitespace-nowrap">{s.contactPerson}</td>
                      <td className="py-2.5 px-4 text-slate-700 tabular-nums text-xs whitespace-nowrap">{s.phone}</td>
                      <td className="py-2.5 px-4 text-slate-600 text-xs whitespace-nowrap">{s.email}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                          {s.paymentTerms}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center tabular-nums font-semibold text-slate-800 text-sm whitespace-nowrap">
                        {stats.estimatedSkus} SKUs
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 tabular-nums text-xs whitespace-nowrap">
                        {stats.lastOrderDate}
                      </td>
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition focus-visible:outline-2 focus-visible:outline-emerald-500"
                            title="Edit vendor profile"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          ADD / EDIT SUPPLIER RIGHT-SIDE DRAWER
         ======================================================== */}
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
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {editingSupplier ? 'Edit Vendor Profile' : 'Register New Vendor'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Corporate contact details & commercial credit terms
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
                
                {/* Company Name */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">
                    Company / Vendor Legal Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="e.g. Al-Madina Food Supplies Ltd"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 bg-white ${
                      formErrors.name ? 'border-red-400 bg-red-50/50' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-600 mt-1 font-medium">{formErrors.name}</p>
                  )}
                </div>

                {/* Key Account Person */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">
                    Key Account Representative <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => {
                      setContactPerson(e.target.value);
                      if (formErrors.contact) setFormErrors(prev => ({ ...prev, contact: '' }));
                    }}
                    placeholder="e.g. Adel Al-Mansour"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 bg-white ${
                      formErrors.contact ? 'border-red-400 bg-red-50/50' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.contact && (
                    <p className="text-xs text-red-600 mt-1 font-medium">{formErrors.contact}</p>
                  )}
                </div>

                {/* Phone & Email (Inter with tabular-nums) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-sm">
                      Direct Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: '' }));
                      }}
                      placeholder="+963 11 445 8890"
                      className={`w-full px-3 py-2 rounded-lg border tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 bg-white ${
                        formErrors.phone ? 'border-red-400 bg-red-50/50' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{formErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-sm">
                      Orders Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                      }}
                      placeholder="orders@vendor.com"
                      className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 bg-white ${
                        formErrors.email ? 'border-red-400 bg-red-50/50' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{formErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">
                    Warehouse / Fulfillment Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Industrial District Sector 4, Damascus"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 bg-white"
                  />
                </div>

                {/* Payment Terms & Contract Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-sm">
                      Payment Terms <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
                    >
                      <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                      <option value="Net 15 Days">Net 15 Days</option>
                      <option value="Net 30 Days">Net 30 Days</option>
                      <option value="Net 45 Days">Net 45 Days</option>
                      <option value="Net 60 Days">Net 60 Days</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-sm">
                      Vendor Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
                    >
                      <option value="ACTIVE">Active Vendor</option>
                      <option value="INACTIVE">Suspended / Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Footer Buttons */}
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
                    {editingSupplier ? 'Save Changes' : 'Register Vendor'}
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
