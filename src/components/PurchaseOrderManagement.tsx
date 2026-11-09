import React, { useState, useMemo, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  CheckCircle, 
  PackageCheck, 
  FileCheck2, 
  Search, 
  X, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Trash2, 
  RotateCcw, 
  Eye, 
  Send,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PurchaseOrder, POItem, Supplier, Product, User, POStatus } from '../types/aybos';

interface PurchaseOrderManagementProps {
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  products: Product[];
  currentUser: User;
  onCreatePO: (order: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>) => void;
  onApprovePO: (poId: string) => void;
  onReceivePO: (poId: string, receivedItems: { productId: string; receivedQty: number }[]) => void;
  actionTrigger?: { module: string; timestamp: number };
}

export const PurchaseOrderManagement: React.FC<PurchaseOrderManagementProps> = ({
  orders,
  suppliers,
  products,
  currentUser,
  onCreatePO,
  onApprovePO,
  onReceivePO,
  actionTrigger
}) => {
  // Search & Status Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Pagination (Default rows per page = 25)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Modal / Drawer states
  const [isNewPODrawerOpen, setIsNewPODrawerOpen] = useState(false);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [selectedPODetails, setSelectedPODetails] = useState<PurchaseOrder | null>(null);

  // New PO Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().substring(0, 10);
  });
  const [notes, setNotes] = useState('');
  const [poLines, setPoLines] = useState<{ productId: string; orderedQty: number; unitCost: number }[]>([]);
  const [newPOError, setNewPOError] = useState<string | null>(null);

  // Goods Receiving Inputs (productId -> quantity receiving today)
  const [receiveInputs, setReceiveInputs] = useState<Record<string, number>>({});
  const [receivingError, setReceivingError] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // RBAC Permissions
  const canCreate = currentUser.role === 'MANAGER' || currentUser.role === 'PURCHASING';
  const canApprove = currentUser.role === 'MANAGER';
  const canReceive = currentUser.role === 'MANAGER' || currentUser.role === 'INVENTORY';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Listen to Top Bar primary action button trigger
  useEffect(() => {
    if (actionTrigger?.module === 'PURCHASING' && actionTrigger.timestamp > 0) {
      handleOpenNewPO();
    }
  }, [actionTrigger]);

  // Find all low-stock / critical products in catalog
  const lowStockCatalogProducts = useMemo(() => {
    return products.filter(p => p.currentStock <= p.reorderLevel);
  }, [products]);

  // Open "New PO" Drawer
  const handleOpenNewPO = () => {
    if (!canCreate) return;
    const defaultSup = suppliers[0]?.id || '';
    setSelectedSupplierId(defaultSup);
    
    const firstSuggested = lowStockCatalogProducts[0] || products[0];
    if (firstSuggested) {
      const suggestedQty = Math.max(10, (firstSuggested.reorderLevel * 2) - firstSuggested.currentStock);
      setPoLines([{
        productId: firstSuggested.id,
        orderedQty: suggestedQty,
        unitCost: firstSuggested.costPrice
      }]);
    } else {
      setPoLines([]);
    }

    setNotes('');
    setNewPOError(null);
    setIsNewPODrawerOpen(true);
  };

  // Add line item
  const handleAddLineItem = (productId?: string) => {
    const targetProd = productId ? products.find(p => p.id === productId) : products[0];
    if (!targetProd) return;

    const existingIndex = poLines.findIndex(l => l.productId === targetProd.id);
    if (existingIndex >= 0) {
      setPoLines(prev => prev.map((l, i) => i === existingIndex ? { ...l, orderedQty: l.orderedQty + 10 } : l));
      return;
    }

    const suggestedQty = Math.max(10, (targetProd.reorderLevel * 2) - targetProd.currentStock);
    setPoLines(prev => [
      ...prev,
      {
        productId: targetProd.id,
        orderedQty: suggestedQty,
        unitCost: targetProd.costPrice
      }
    ]);
  };

  // "Add all low-stock items" button action
  const handleAddAllLowStockItems = () => {
    if (lowStockCatalogProducts.length === 0) {
      showToast('No products are currently at or below reorder threshold.');
      return;
    }

    const newLines = [...poLines];
    let addedCount = 0;

    lowStockCatalogProducts.forEach(lowProd => {
      const existing = newLines.find(l => l.productId === lowProd.id);
      const suggestedQty = Math.max(15, (lowProd.reorderLevel * 2) - lowProd.currentStock);

      if (existing) {
        existing.orderedQty = Math.max(existing.orderedQty, suggestedQty);
      } else {
        newLines.push({
          productId: lowProd.id,
          orderedQty: suggestedQty,
          unitCost: lowProd.costPrice
        });
        addedCount++;
      }
    });

    setPoLines(newLines);
    showToast(`Added ${addedCount} depleted & low-stock items to purchase order.`);
  };

  const handleRemoveLine = (idx: number) => {
    setPoLines(prev => prev.filter((_, i) => i !== idx));
  };

  const updateLineProduct = (idx: number, pId: string) => {
    const found = products.find(p => p.id === pId);
    setPoLines(prev => prev.map((item, i) => i === idx ? {
      ...item,
      productId: pId,
      unitCost: found?.costPrice || item.unitCost
    } : item));
  };

  const updateLineQty = (idx: number, qty: number) => {
    setPoLines(prev => prev.map((item, i) => i === idx ? { ...item, orderedQty: Math.max(1, qty) } : item));
  };

  const updateLineCost = (idx: number, cost: number) => {
    setPoLines(prev => prev.map((item, i) => i === idx ? { ...item, unitCost: Math.max(0, cost) } : item));
  };

  const calculatedGrandTotal = useMemo(() => {
    return poLines.reduce((sum, item) => sum + (item.orderedQty * item.unitCost), 0);
  }, [poLines]);

  const handleCreatePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;

    if (poLines.length === 0) {
      setNewPOError('Please add at least one line item to the order.');
      return;
    }

    const sup = suppliers.find(s => s.id === selectedSupplierId);
    if (!sup) {
      setNewPOError('Please select a valid supplier.');
      return;
    }

    const poItems: POItem[] = poLines.map(l => {
      const prod = products.find(p => p.id === l.productId);
      return {
        productId: l.productId,
        productName: prod?.name || 'Unknown item',
        sku: prod?.sku || 'SKU-000',
        orderedQty: l.orderedQty,
        receivedQty: 0,
        unitCost: l.unitCost
      };
    });

    onCreatePO({
      supplierId: sup.id,
      supplierName: sup.name,
      status: 'SENT',
      items: poItems,
      totalCost: Number(calculatedGrandTotal.toFixed(2)),
      expectedDelivery: expectedDeliveryDate,
      notes: notes.trim() || `Replenishment PO issued to ${sup.name}`,
      approvedBy: `${currentUser.name} (${currentUser.role})`
    });

    setIsNewPODrawerOpen(false);
    showToast(`Purchase order registered & sent to ${sup.name}.`);
  };

  const handleOpenReceiveModal = (po: PurchaseOrder) => {
    setReceivingPO(po);
    const initialInputs: Record<string, number> = {};
    po.items.forEach(item => {
      const remaining = Math.max(0, item.orderedQty - item.receivedQty);
      initialInputs[item.productId] = remaining;
    });
    setReceiveInputs(initialInputs);
    setReceivingError(null);
  };

  const handleConfirmReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingPO || !canReceive) return;

    const payload = Object.entries(receiveInputs).map(([productId, receivedQty]) => ({
      productId,
      receivedQty: Number(receivedQty) || 0
    }));

    const totalArrivedUnits = payload.reduce((sum, item) => sum + item.receivedQty, 0);
    if (totalArrivedUnits <= 0) {
      setReceivingError('Please specify at least 1 unit arriving in this delivery batch.');
      return;
    }

    onReceivePO(receivingPO.id, payload);
    setReceivingPO(null);
    showToast(`Successfully received ${totalArrivedUnits} units for PO ${receivingPO.poNumber}. Stock updated!`);
  };

  const getStepperStatus = (status: POStatus): { step: number; label: string } => {
    if (status === 'RECEIVED' || status === 'COMPLETED') {
      return { step: 3, label: 'Received' };
    }
    if (status === 'PARTIAL' || status === 'PARTIALLY_RECEIVED') {
      return { step: 2.5, label: 'Partially Received' };
    }
    if (status === 'SENT' || status === 'ISSUED') {
      return { step: 2, label: 'Sent' };
    }
    if (status === 'CANCELLED') {
      return { step: 0, label: 'Cancelled' };
    }
    return { step: 1, label: 'Draft' };
  };

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter(o => {
      const matchesQuery = q === '' ||
        o.poNumber.toLowerCase().includes(q) ||
        o.supplierName.toLowerCase().includes(q) ||
        (o.items || []).some(item => item.productName.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q));

      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        const s = o.status;
        if (statusFilter === 'RECEIVED') matchesStatus = s === 'RECEIVED' || s === 'COMPLETED';
        else if (statusFilter === 'SENT') matchesStatus = s === 'SENT' || s === 'ISSUED';
        else if (statusFilter === 'PARTIAL') matchesStatus = s === 'PARTIAL' || s === 'PARTIALLY_RECEIVED';
        else if (statusFilter === 'DRAFT') matchesStatus = s === 'DRAFT' || s === 'PENDING_APPROVAL';
        else matchesStatus = s === statusFilter;
      }

      return matchesQuery && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // Pagination Calculations
  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  return (
    <div className="h-full flex flex-col min-h-0 space-y-3 relative">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Low-stock Smart Suggestion Alert Strip (Flex-shrink-0) */}
      {lowStockCatalogProducts.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-amber-900">Restock Advisory: </span>
              <span className="text-amber-800">
                <strong className="font-semibold">{lowStockCatalogProducts.length} items</strong> are currently at or below their safety reorder threshold.
              </span>
            </div>
          </div>

          {canCreate && (
            <button
              onClick={() => {
                handleOpenNewPO();
                setTimeout(() => handleAddAllLowStockItems(), 100);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition flex items-center gap-1.5 flex-shrink-0 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Restock PO ({lowStockCatalogProducts.length} Items)</span>
            </button>
          )}
        </div>
      )}

      {/* Filter and Search Bar (Flex-shrink-0) */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-shrink-0">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by PO number, supplier, or product line..."
            className="w-full pl-9 pr-8 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 h-9"
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

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600 hidden sm:block">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 text-sm rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
          >
            <option value="ALL">All PO Statuses ({orders.length})</option>
            <option value="DRAFT">Draft / Pending</option>
            <option value="SENT">Sent to Supplier</option>
            <option value="PARTIAL">Partially Received</option>
            <option value="RECEIVED">Received & Stock Inwarded</option>
          </select>

          {(search || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-medium transition flex items-center gap-1 h-9"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

      </div>

      {/* Orders List Table Card: Internal scroll, sticky header, 52px rows, pinned pagination */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-700 font-semibold select-none text-xs">
                <th className="py-3 px-4 font-mono">PO Number</th>
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4">Delivery / Created</th>
                <th className="py-3 px-4 w-52">Lifecycle Stepper</th>
                <th className="py-3 px-4">Ordered Items</th>
                <th className="py-3 px-4">Total Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <ClipboardList className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">No purchase orders found</h4>
                      <p className="text-[13px] text-slate-500 mt-0.5">Try clearing your filters or create a new restocking order.</p>
                      {canCreate && (
                        <button
                          onClick={handleOpenNewPO}
                          className="mt-3 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs focus-visible:outline-2 focus-visible:outline-emerald-500"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create Purchase Order</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map(po => {
                  const stepper = getStepperStatus(po.status);
                  const isReceived = po.status === 'RECEIVED' || po.status === 'COMPLETED';
                  const isPartial = po.status === 'PARTIAL' || po.status === 'PARTIALLY_RECEIVED';
                  const isSent = po.status === 'SENT' || po.status === 'ISSUED';
                  const isDraft = po.status === 'DRAFT' || po.status === 'PENDING_APPROVAL';

                  const totalOrderedUnits = (po.items || []).reduce((sum, i) => sum + i.orderedQty, 0);
                  const totalReceivedUnits = (po.items || []).reduce((sum, i) => sum + (i.receivedQty || 0), 0);

                  return (
                    <tr key={po.id} className="h-[52px] hover:bg-slate-50 transition">
                      
                      {/* PO Number (Mono) */}
                      <td className="py-2.5 px-4 font-mono text-slate-800 font-bold whitespace-nowrap text-xs">
                        {po.poNumber}
                      </td>

                      {/* Supplier (NO INTERNAL ID) */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{po.supplierName}</div>
                      </td>

                      {/* Delivery / Created (Inter with tabular-nums) */}
                      <td className="py-2.5 px-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1 text-xs tabular-nums">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Exp: {po.expectedDelivery || '2026-11-15'}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 tabular-nums">
                          Issued: {po.createdAt.substring(0, 10)}
                        </div>
                      </td>

                      {/* Status Stepper (Draft -> Sent -> Received / Partial) */}
                      <td className="py-2.5 px-4">
                        <div className="space-y-1 w-full max-w-[210px]">
                          <div className="flex items-center justify-between relative">
                            <div className="absolute top-2 left-2 right-2 h-0.5 bg-slate-200 -z-0" />
                            <div 
                              className={`absolute top-2 left-2 h-0.5 transition-all duration-300 -z-0 ${
                                isPartial ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ 
                                width: isPartial 
                                  ? '80%' 
                                  : `${Math.min(100, Math.max(0, ((stepper.step - 1) / 2) * 100))}%` 
                              }}
                            />

                            {/* Step 1: Draft */}
                            <div className="flex flex-col items-center relative z-10">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                                stepper.step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                1
                              </div>
                              <span className="text-xs text-slate-500 mt-0.5">Draft</span>
                            </div>

                            {/* Step 2: Sent */}
                            <div className="flex flex-col items-center relative z-10">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                                stepper.step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                2
                              </div>
                              <span className="text-xs text-slate-500 mt-0.5">Sent</span>
                            </div>

                            {/* Step 3: Received (Fully Green) OR Partially Received (Half-filled Amber with ratio e.g. 25/40) */}
                            <div className="flex flex-col items-center relative z-10">
                              {isPartial ? (
                                <>
                                  <div 
                                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-amber-950 border border-amber-500 overflow-hidden relative shadow-2xs"
                                    title={`Partially Received: ${totalReceivedUnits}/${totalOrderedUnits} units`}
                                  >
                                    {/* Left half amber, right half white */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-amber-400 50% to-white 50%" />
                                    <span className="relative z-10 text-[9px] font-extrabold text-amber-900 leading-none">½</span>
                                  </div>
                                  <span className="text-xs text-amber-800 font-semibold mt-0.5 tabular-nums">
                                    {totalReceivedUnits}/{totalOrderedUnits}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                                    stepper.step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    3
                                  </div>
                                  <span className="text-xs text-slate-500 mt-0.5">Received</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Ordered Items Summary */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {po.items.length} {po.items.length === 1 ? 'line item' : 'line items'}
                        </div>
                        <div className="text-xs text-slate-400 tabular-nums">
                          {totalReceivedUnits} / {totalOrderedUnits} units received
                        </div>
                      </td>

                      {/* Total Cost (Inter tabular-nums) */}
                      <td className="py-2.5 px-4 tabular-nums font-bold text-emerald-700 whitespace-nowrap text-sm">
                        ${po.totalCost.toFixed(2)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          isReceived ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          isPartial ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          isSent ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          isDraft ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isReceived ? 'bg-emerald-500' :
                            isPartial ? 'bg-amber-500' :
                            isSent ? 'bg-blue-500' :
                            'bg-purple-500'
                          }`} />
                          <span>{stepper.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {isDraft && canApprove && (
                            <button
                              onClick={() => onApprovePO(po.id)}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1 shadow-2xs h-8"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {(isSent || isPartial) && canReceive && (
                            <button
                              onClick={() => handleOpenReceiveModal(po)}
                              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs h-8 active:scale-98"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Mark as Received</span>
                            </button>
                          )}

                          {isReceived && (
                            <span className="text-slate-500 text-xs font-semibold flex items-center gap-1">
                              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Inwarded</span>
                            </span>
                          )}

                          <button
                            onClick={() => setSelectedPODetails(po)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition"
                            title="Inspect order details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pinned Pagination at the bottom of the card */}
        {totalItems > 0 && (
          <div className="flex-shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing <strong className="text-slate-900 font-semibold tabular-nums">{startIndex + 1}</strong> to{' '}
              <strong className="text-slate-900 font-semibold tabular-nums">{endIndex}</strong> of{' '}
              <strong className="text-slate-900 font-semibold tabular-nums">{totalItems}</strong> purchase orders
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={validCurrentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition h-8"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <span className="px-2 text-xs font-semibold text-slate-700 tabular-nums">
                Page {validCurrentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={validCurrentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition h-8"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          "NEW PURCHASE ORDER" FLOW DRAWER
         ======================================================== */}
      {isNewPODrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" dir="ltr">
          <div 
            onClick={() => setIsNewPODrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Create Purchase Order</h3>
                    <p className="text-xs text-slate-400">
                      Restock replenishment workflow (Draft → Sent → Received)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsNewPODrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePOSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
                
                {newPOError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{newPOError}</span>
                  </div>
                )}

                {/* 1. Supplier & Expected Delivery */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-sm">
                      Choose Supplier / Vendor <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 text-sm"
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.paymentTerms})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-sm">
                      Expected Dock Delivery Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={expectedDeliveryDate}
                      onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
                    />
                  </div>
                </div>

                {/* 2. Low-Stock Smart Suggestions Strip */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Low-Stock Inventory Recommendations</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddAllLowStockItems}
                      className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-2xs flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add all low-stock items ({lowStockCatalogProducts.length})</span>
                    </button>
                  </div>

                  <p className="text-xs text-emerald-800">
                    The system prioritizes items currently at or below their safety reorder threshold with automatic restock quantities.
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {lowStockCatalogProducts.slice(0, 5).map(prod => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleAddLineItem(prod.id)}
                        className="px-2 py-0.5 rounded-full bg-white border border-emerald-300 text-xs text-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1"
                        title="Click to add single product line"
                      >
                        <span>{prod.name}</span>
                        <span className="font-bold text-amber-700 tabular-nums">({prod.currentStock}/{prod.reorderLevel})</span>
                        <Plus className="w-3 h-3 text-emerald-600" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Product Line Items */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-sm">
                      Order Line Items ({poLines.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAddLineItem()}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item Line</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {poLines.map((line, idx) => {
                      const lineSubtotal = line.orderedQty * line.unitCost;
                      const prod = products.find(p => p.id === line.productId);

                      return (
                        <div 
                          key={idx}
                          className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2.5"
                        >
                          <div className="flex-1 min-w-0">
                            <select
                              value={line.productId}
                              onChange={(e) => updateLineProduct(idx, e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 h-8"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (${p.costPrice.toFixed(2)} cost)
                                </option>
                              ))}
                            </select>
                            <div className="text-xs text-slate-400 mt-0.5">
                              SKU: <span className="font-mono">{prod?.sku}</span> • Stock: {prod?.currentStock} {prod?.unit}
                            </div>
                          </div>

                          <div className="w-24">
                            <label className="text-xs text-slate-400 font-medium block">Qty:</label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={line.orderedQty}
                              onChange={(e) => updateLineQty(idx, parseInt(e.target.value) || 1)}
                              className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs tabular-nums font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white h-8"
                            />
                          </div>

                          <div className="w-24">
                            <label className="text-xs text-slate-400 font-medium block">Unit ($):</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={line.unitCost}
                              onChange={(e) => updateLineCost(idx, parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs tabular-nums text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white h-8"
                            />
                          </div>

                          <div className="w-24 text-right">
                            <label className="text-xs text-slate-400 font-medium block">Line Total:</label>
                            <span className="font-bold text-emerald-700 text-xs tabular-nums block mt-1">
                              ${lineSubtotal.toFixed(2)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                            title="Remove line"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">
                    Procurement Notes / Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Priority morning unloading at dock bay 2"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                {/* Grand Total Bar & Submit */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Auto-Calculated Total Cost:</div>
                    <div className="text-xl font-bold text-emerald-700 tabular-nums">
                      ${calculatedGrandTotal.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNewPODrawerOpen(false)}
                      className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition h-10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition flex items-center gap-1.5 h-10 active:scale-98"
                    >
                      <Send className="w-4 h-4" />
                      <span>Issue & Send PO</span>
                    </button>
                  </div>
                </div>

              </form>

            </div>
          </div>
        </div>
      )}

      {/* "MARK AS RECEIVED" GOODS INWARDING CONFIRMATION MODAL */}
      {receivingPO && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Dockside Inwarding (GRN) — <span className="font-mono">{receivingPO.poNumber}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Supplier: <strong className="text-slate-800">{receivingPO.supplierName}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setReceivingPO(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {receivingError && (
              <div className="p-3 my-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{receivingError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReceiveSubmit} className="mt-4 space-y-4 text-sm">
              
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 leading-relaxed text-xs">
                Confirm quantities physically unloaded and verified at the warehouse loading dock today. 
                Submitting will <strong>automatically increase product stock</strong> and write <strong>immutable RECEIVED records</strong> to the inventory movement ledger.
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {receivingPO.items.map(item => {
                  const already = item.receivedQty || 0;
                  const remaining = Math.max(0, item.orderedQty - already);
                  const currentVal = receiveInputs[item.productId] ?? remaining;

                  return (
                    <div 
                      key={item.productId}
                      className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 text-xs truncate">
                          {item.productName}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          SKU: <span className="font-mono">{item.sku}</span> • Ordered: <span className="tabular-nums font-medium">{item.orderedQty}</span> • Already in: <span className="tabular-nums font-medium">{already}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <label className="text-xs text-slate-500 font-medium">Arrived:</label>
                        <input
                          type="number"
                          min="0"
                          max={remaining}
                          value={currentVal}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setReceiveInputs(prev => ({
                              ...prev,
                              [item.productId]: val
                            }));
                          }}
                          className="w-18 px-2 py-1 rounded-md border border-slate-300 text-xs tabular-nums font-bold text-center text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 h-8"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReceivingPO(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition h-10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition flex items-center gap-1.5 h-10 active:scale-98"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Confirm Dock Receipt & Inward Stock</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* PO DETAILS INSPECTION MODAL */}
      {selectedPODetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>Purchase Order Inspection:</span>
                  <span className="font-mono text-emerald-700">{selectedPODetails.poNumber}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vendor: <strong className="text-slate-800">{selectedPODetails.supplierName}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedPODetails(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>Issued Date: <strong className="tabular-nums text-slate-800">{selectedPODetails.createdAt.substring(0, 10)}</strong></div>
                <div>Expected Arrival: <strong className="tabular-nums text-slate-800">{selectedPODetails.expectedDelivery}</strong></div>
                <div>Status: <strong className="text-emerald-700">{selectedPODetails.status}</strong></div>
                <div>Grand Total: <strong className="tabular-nums text-emerald-700 font-bold">${selectedPODetails.totalCost.toFixed(2)}</strong></div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1.5">Line Items:</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2 font-mono">SKU</th>
                        <th className="p-2 text-center">Ordered</th>
                        <th className="p-2 text-center">Received</th>
                        <th className="p-2 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPODetails.items.map((it, i) => (
                        <tr key={i}>
                          <td className="p-2 font-medium text-slate-900">{it.productName}</td>
                          <td className="p-2 font-mono text-slate-500">{it.sku}</td>
                          <td className="p-2 text-center tabular-nums font-semibold">{it.orderedQty}</td>
                          <td className="p-2 text-center tabular-nums text-emerald-700 font-bold">{it.receivedQty || 0}</td>
                          <td className="p-2 text-right tabular-nums">${it.unitCost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedPODetails.notes && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
                  <span className="font-semibold text-slate-800">Notes:</span> {selectedPODetails.notes}
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedPODetails(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
