import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  Plus, 
  CheckCircle, 
  PackageCheck, 
  FileCheck2, 
  Truck, 
  Search, 
  X, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Trash2, 
  Clock, 
  Building2, 
  DollarSign, 
  Layers, 
  RotateCcw,
  Eye,
  Send
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
}

export const PurchaseOrderManagement: React.FC<PurchaseOrderManagementProps> = ({
  orders,
  suppliers,
  products,
  currentUser,
  onCreatePO,
  onApprovePO,
  onReceivePO
}) => {
  // Search & Status Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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

  // Find all low-stock / critical products in catalog (at or below reorderLevel)
  const lowStockCatalogProducts = useMemo(() => {
    return products.filter(p => p.currentStock <= p.reorderLevel);
  }, [products]);

  // Open "New PO" Drawer
  const handleOpenNewPO = () => {
    if (!canCreate) return;
    const defaultSup = suppliers[0]?.id || '';
    setSelectedSupplierId(defaultSup);
    
    // Initial suggested line item: pick first low stock item if available, otherwise first product
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

    // Avoid duplicate lines if possible
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

  // Calculate Subtotal & Total
  const calculatedGrandTotal = useMemo(() => {
    return poLines.reduce((sum, item) => sum + (item.orderedQty * item.unitCost), 0);
  }, [poLines]);

  // Submit New PO
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
      status: 'SENT', // Transitions directly to SENT ready for warehouse dock receipt
      items: poItems,
      totalCost: Number(calculatedGrandTotal.toFixed(2)),
      expectedDelivery: expectedDeliveryDate,
      notes: notes.trim() || `Replenishment PO issued to ${sup.name}`,
      approvedBy: `${currentUser.name} (${currentUser.role})`
    });

    setIsNewPODrawerOpen(false);
    showToast(`Purchase order registered & sent to ${sup.name}.`);
  };

  // Open "Mark as Received" Goods Inwarding Dialog
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

  // Confirm Inwarding of Goods: increases stock & writes RECEIVED ledger entries
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

  // Helper for status stepper
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

  // Filtered Orders
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

  return (
    <div className="space-y-4 relative">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Purchase Orders & Receiving
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Vendor procurement workflow: Draft $\rightarrow$ Sent $\rightarrow$ Received dockside check-in
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              onClick={handleOpenNewPO}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs h-9 active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>New Purchase Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Low-stock Smart Suggestion Alert Strip */}
      {lowStockCatalogProducts.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
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
                // trigger adding low stock items in drawer
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

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by PO Number, vendor, or product line..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 h-9"
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
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
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
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-medium transition flex items-center gap-1 h-9"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

      </div>

      {/* Orders List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold select-none">
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

            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No purchase orders match your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(po => {
                  const stepper = getStepperStatus(po.status);
                  const isReceived = po.status === 'RECEIVED' || po.status === 'COMPLETED';
                  const isPartial = po.status === 'PARTIAL' || po.status === 'PARTIALLY_RECEIVED';
                  const isSent = po.status === 'SENT' || po.status === 'ISSUED';
                  const isDraft = po.status === 'DRAFT' || po.status === 'PENDING_APPROVAL';

                  const totalOrderedUnits = (po.items || []).reduce((sum, i) => sum + i.orderedQty, 0);
                  const totalReceivedUnits = (po.items || []).reduce((sum, i) => sum + (i.receivedQty || 0), 0);

                  return (
                    <tr key={po.id} className="hover:bg-slate-50 transition">
                      
                      {/* PO Number */}
                      <td className="py-3 px-4 font-mono text-slate-800 font-bold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{po.poNumber}</span>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{po.supplierName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {po.supplierId}</div>
                      </td>

                      {/* Delivery / Created */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Exp: {po.expectedDelivery || '2026-11-15'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Issued: {po.createdAt.substring(0, 10)}
                        </div>
                      </td>

                      {/* Status Stepper (Draft -> Sent -> Received) */}
                      <td className="py-3 px-4">
                        <div className="space-y-1 w-full max-w-[190px]">
                          {/* 3 Step Indicator Dots */}
                          <div className="flex items-center justify-between relative">
                            {/* Connecting line */}
                            <div className="absolute top-2 left-2 right-2 h-0.5 bg-slate-200 -z-0" />
                            <div 
                              className="absolute top-2 left-2 h-0.5 bg-emerald-500 transition-all duration-300 -z-0"
                              style={{ width: `${Math.min(100, Math.max(0, ((stepper.step - 1) / 2) * 100))}%` }}
                            />

                            {/* Step 1: Draft */}
                            <div className="flex flex-col items-center relative z-10">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                stepper.step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                1
                              </div>
                              <span className="text-[9px] text-slate-500 mt-0.5">Draft</span>
                            </div>

                            {/* Step 2: Sent */}
                            <div className="flex flex-col items-center relative z-10">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                stepper.step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                2
                              </div>
                              <span className="text-[9px] text-slate-500 mt-0.5">Sent</span>
                            </div>

                            {/* Step 3: Received */}
                            <div className="flex flex-col items-center relative z-10">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                stepper.step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                3
                              </div>
                              <span className="text-[9px] text-slate-500 mt-0.5">Received</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Ordered Items Summary */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {po.items.length} {po.items.length === 1 ? 'line item' : 'line items'}
                        </div>
                        <div className="text-[11px] text-slate-400 tabular-nums">
                          {totalReceivedUnits} / {totalOrderedUnits} units received
                        </div>
                      </td>

                      {/* Total Cost */}
                      <td className="py-3 px-4 tabular-nums font-bold text-emerald-700 whitespace-nowrap text-sm">
                        ${po.totalCost.toFixed(2)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
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
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* Approve if Draft */}
                          {isDraft && canApprove && (
                            <button
                              onClick={() => onApprovePO(po.id)}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1 shadow-2xs h-8"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* "Mark as Received" button if Sent or Partial */}
                          {(isSent || isPartial) && canReceive && (
                            <button
                              onClick={() => handleOpenReceiveModal(po)}
                              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs h-8 active:scale-98"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Mark as Received</span>
                            </button>
                          )}

                          {/* Completed check badge */}
                          {isReceived && (
                            <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Stock Inwarded</span>
                            </span>
                          )}

                          {/* Inspect PO Details */}
                          <button
                            onClick={() => setSelectedPODetails(po)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition"
                            title="Inspect order details"
                          >
                            <Eye className="w-3.5 h-3.5" />
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
              
              {/* Drawer Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Create Purchase Order</h3>
                    <p className="text-[11px] text-slate-400">
                      Restock replenishment workflow (Draft $\rightarrow$ Sent $\rightarrow$ Received)
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

              {/* Drawer Form Body */}
              <form onSubmit={handleCreatePOSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                
                {newPOError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{newPOError}</span>
                  </div>
                )}

                {/* 1. Supplier & Expected Delivery */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Choose Supplier / Vendor <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.paymentTerms})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Expected Dock Delivery Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={expectedDeliveryDate}
                      onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
                    />
                  </div>
                </div>

                {/* 2. Low-Stock Smart Suggestions Strip & "Add all low-stock items" button */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Low-Stock Inventory Recommendations</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddAllLowStockItems}
                      className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition shadow-2xs flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add all low-stock items ({lowStockCatalogProducts.length})</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-emerald-800">
                    The system prioritizes items currently at or below their safety reorder threshold with automatic target restock quantities.
                  </p>

                  {/* Quick Pill Chips of Low Stock Items */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {lowStockCatalogProducts.slice(0, 5).map(prod => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleAddLineItem(prod.id)}
                        className="px-2 py-0.5 rounded-full bg-white border border-emerald-300 text-[10px] text-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1"
                        title="Click to add single product line"
                      >
                        <span>{prod.name}</span>
                        <span className="font-bold text-amber-700">({prod.currentStock}/{prod.reorderLevel})</span>
                        <Plus className="w-2.5 h-2.5 text-emerald-600" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Product Line Items */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-xs">
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
                          {/* Product select */}
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
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              SKU: {prod?.sku} • Stock: {prod?.currentStock} {prod?.unit}
                            </div>
                          </div>

                          {/* Ordered Qty */}
                          <div className="w-24">
                            <label className="text-[10px] text-slate-400 font-medium block">Qty:</label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={line.orderedQty}
                              onChange={(e) => updateLineQty(idx, parseInt(e.target.value) || 1)}
                              className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs tabular-nums font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white h-8"
                            />
                          </div>

                          {/* Unit Cost */}
                          <div className="w-24">
                            <label className="text-[10px] text-slate-400 font-medium block">Unit ($):</label>
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

                          {/* Subtotal */}
                          <div className="w-24 text-right">
                            <label className="text-[10px] text-slate-400 font-medium block">Line Total:</label>
                            <span className="font-bold text-emerald-700 text-xs tabular-nums block mt-1">
                              ${lineSubtotal.toFixed(2)}
                            </span>
                          </div>

                          {/* Remove row */}
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
                  <label className="block text-slate-700 font-semibold mb-1">
                    Procurement Notes / Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Priority morning unloading at dock bay 2"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                {/* Grand Total Bar & Submit */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Auto-Calculated Total Cost:</div>
                    <div className="text-xl font-bold text-emerald-700 tabular-nums">
                      ${calculatedGrandTotal.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNewPODrawerOpen(false)}
                      className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition h-10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 h-10 active:scale-98"
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

      {/* ========================================================
          "MARK AS RECEIVED" GOODS INWARDING CONFIRMATION MODAL
         ======================================================== */}
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
                    Dockside Inwarding (GRN) — {receivingPO.poNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">
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

            <form onSubmit={handleConfirmReceiveSubmit} className="mt-4 space-y-4 text-xs">
              
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 leading-relaxed text-[11px]">
                Confirm quantities physically unloaded and verified at the warehouse loading dock today. 
                Submitting will <strong>automatically increase product stock</strong> and write <strong>immutable RECEIVED records</strong> to the inventory movement ledger.
              </div>

              {/* Line items verification list */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {receivingPO.items.map(item => {
                  const already = item.receivedQty || 0;
                  const remaining = Math.max(0, item.orderedQty - already);
                  const currentVal = receiveInputs[item.productId] ?? remaining;

                  return (
                    <div 
                      key={item.productId}
                      className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 text-xs truncate">
                          {item.productName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono">SKU: {item.sku}</span>
                          <span>•</span>
                          <span>Ordered: <strong>{item.orderedQty}</strong></span>
                          <span>•</span>
                          <span>Prev Received: <strong className="text-emerald-700">{already}</strong></span>
                        </div>
                      </div>

                      <div className="w-28 text-right flex-shrink-0">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Receiving Today:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.orderedQty}
                          value={currentVal}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setReceiveInputs(prev => ({ ...prev, [item.productId]: val }));
                          }}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-bold text-center tabular-nums text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReceivingPO(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition h-9"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 h-9 active:scale-98"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Confirm Receipt & Update Stock</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================
          INSPECT PO DETAILS MODAL
         ======================================================== */}
      {selectedPODetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{selectedPODetails.poNumber} Details</h3>
                <p className="text-slate-500 text-[11px]">Supplier: {selectedPODetails.supplierName}</p>
              </div>
              <button onClick={() => setSelectedPODetails(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>Created: <strong className="font-mono">{selectedPODetails.createdAt}</strong></div>
                <div>Expected: <strong className="font-mono">{selectedPODetails.expectedDelivery}</strong></div>
                <div>Approved By: <strong>{selectedPODetails.approvedBy || 'Pending'}</strong></div>
                <div>Status: <strong className="text-emerald-700">{selectedPODetails.status}</strong></div>
              </div>

              <div>
                <div className="font-bold text-slate-800 mb-1.5">Line Items:</div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedPODetails.items.map(item => (
                    <div key={item.productId} className="p-2.5 rounded border border-slate-200 bg-white flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">{item.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold tabular-nums">
                          {item.receivedQty} / {item.orderedQty} units
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold tabular-nums">
                          ${(item.orderedQty * item.unitCost).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700">Total Purchase Cost:</span>
                <span className="text-base font-bold text-emerald-700 tabular-nums">
                  ${selectedPODetails.totalCost.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedPODetails(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
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
