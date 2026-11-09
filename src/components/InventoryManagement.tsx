import React, { useState, useMemo, useEffect } from 'react';
import { 
  Boxes, 
  History, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Calendar, 
  RotateCcw, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Layers 
} from 'lucide-react';
import { Product, StockMovement, MovementType, User } from '../types/aybos';

interface InventoryManagementProps {
  products: Product[];
  movements: StockMovement[];
  currentUser: User;
  onStockAdjustment: (productId: string, delta: number, type: MovementType, notes: string) => void;
  actionTrigger?: { module: string; timestamp: number };
}

type TabType = 'stock' | 'ledger';
type DateFilterPreset = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';

export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  products,
  movements,
  currentUser,
  onStockAdjustment,
  actionTrigger
}) => {
  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<TabType>('stock');

  // Stock Levels Table Filters & Pagination (Default rows per page = 25)
  const [stockSearch, setStockSearch] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'HEALTHY' | 'LOW' | 'OUT'>('ALL');
  const [stockPage, setStockPage] = useState<number>(1);
  const [stockPageSize, setStockPageSize] = useState<number>(25);
  const [stockSortField, setStockSortField] = useState<'name' | 'stock' | 'reorder' | 'valuation'>('name');
  const [stockSortDir, setStockSortDir] = useState<'asc' | 'desc'>('asc');

  // Movement Ledger Filters & Pagination (Default rows per page = 25)
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<string>('ALL');
  const [ledgerProductFilter, setLedgerProductFilter] = useState<string>('ALL');
  const [ledgerDatePreset, setLedgerDatePreset] = useState<DateFilterPreset>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [ledgerPage, setLedgerPage] = useState<number>(1);
  const [ledgerPageSize, setLedgerPageSize] = useState<number>(25);

  // Record Movement Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerProductId, setDrawerProductId] = useState<string>(products[0]?.id || '');
  const [drawerType, setDrawerType] = useState<MovementType>('DAMAGED');
  const [drawerQty, setDrawerQty] = useState<string>('1');
  const [drawerReason, setDrawerReason] = useState<string>('');
  const [drawerError, setDrawerError] = useState<string | null>(null);

  // Toast notification state
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // RBAC Permission: Cashier is read-only
  const isCashier = currentUser.role === 'CASHIER';
  const canAdjust = currentUser.role === 'MANAGER' || currentUser.role === 'INVENTORY';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Listen to Top Bar primary action trigger
  useEffect(() => {
    if (actionTrigger?.module === 'INVENTORY' && actionTrigger.timestamp > 0) {
      handleOpenDrawer();
    }
  }, [actionTrigger]);

  // --- KPI CALCULATIONS ---
  const totalSkus = products.length;
  const totalUnitsInStock = products.reduce((acc, p) => acc + p.currentStock, 0);
  const lowStockProducts = products.filter(p => p.currentStock <= p.reorderLevel);
  const outOfStockCount = products.filter(p => p.currentStock <= 0).length;
  const criticalLowCount = lowStockProducts.length - outOfStockCount;

  // Monthly Expired / Damaged calculation
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const monthlyDamagedExpiredMovements = movements.filter(m => {
    const isLoss = m.type === 'DAMAGED' || m.type === 'EXPIRED' || m.movementType === 'DAMAGE' || m.movementType === 'EXPIRY';
    const isThisMonth = (m.timestamp || '').startsWith(currentMonthPrefix);
    return isLoss && isThisMonth;
  });

  const monthlyLossUnits = monthlyDamagedExpiredMovements.reduce((sum, m) => {
    const rawQty = m.qty !== undefined ? Math.abs(m.qty) : Math.abs(m.quantityDelta || 0);
    return sum + rawQty;
  }, 0);

  const monthlyLossEstimatedValue = monthlyDamagedExpiredMovements.reduce((sum, m) => {
    const prod = products.find(p => p.id === m.productId);
    const rawQty = m.qty !== undefined ? Math.abs(m.qty) : Math.abs(m.quantityDelta || 0);
    const cost = prod ? prod.costPrice : 5.0;
    return sum + (rawQty * cost);
  }, 0);

  // Open Drawer from table or button
  const handleOpenDrawer = (productId?: string) => {
    if (isCashier) return;
    setDrawerProductId(productId || products[0]?.id || '');
    setDrawerType('DAMAGED');
    setDrawerQty('1');
    setDrawerReason('');
    setDrawerError(null);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setDrawerError(null);
  };

  // Drawer Submit Handler
  const handleDrawerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCashier) return;

    const prod = products.find(p => p.id === drawerProductId);
    if (!prod) {
      setDrawerError('Please select a valid product.');
      return;
    }

    const qty = parseInt(drawerQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setDrawerError('Adjustment quantity must be an integer greater than 0.');
      return;
    }

    const trimmedReason = drawerReason.trim();
    if (!trimmedReason || trimmedReason.length < 3) {
      setDrawerError('A clear justification / reason is required for audit compliance.');
      return;
    }

    if ((drawerType === 'DAMAGED' || drawerType === 'EXPIRED') && qty > prod.currentStock) {
      setDrawerError(`Quantity (${qty}) exceeds current on-hand balance (${prod.currentStock} ${prod.unit}).`);
      return;
    }

    const delta = (drawerType === 'DAMAGED' || drawerType === 'EXPIRED') ? -qty : qty;
    onStockAdjustment(prod.id, delta, drawerType, trimmedReason);

    showToast(`Recorded ${drawerType} movement for ${prod.name}.`);
    handleCloseDrawer();
  };

  // --- TAB 1: STOCK LEVELS FILTERING & SORTING ---
  const filteredStockProducts = useMemo(() => {
    const q = stockSearch.trim().toLowerCase();

    return products
      .filter(p => {
        const matchesQuery = q === '' ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q);

        let matchesStatus = true;
        if (stockStatusFilter === 'OUT') {
          matchesStatus = p.currentStock <= 0;
        } else if (stockStatusFilter === 'LOW') {
          matchesStatus = p.currentStock > 0 && p.currentStock <= p.reorderLevel;
        } else if (stockStatusFilter === 'HEALTHY') {
          matchesStatus = p.currentStock > p.reorderLevel;
        }

        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        let aVal: any = a[stockSortField as keyof Product];
        let bVal: any = b[stockSortField as keyof Product];

        if (stockSortField === 'valuation') {
          aVal = a.currentStock * a.costPrice;
          bVal = b.currentStock * b.costPrice;
        } else if (stockSortField === 'stock') {
          aVal = a.currentStock;
          bVal = b.currentStock;
        } else if (stockSortField === 'reorder') {
          aVal = a.reorderLevel;
          bVal = b.reorderLevel;
        } else if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal as string).toLowerCase();
        }

        if (aVal < bVal) return stockSortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return stockSortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [products, stockSearch, stockStatusFilter, stockSortField, stockSortDir]);

  // Stock Pagination
  const totalStockItems = filteredStockProducts.length;
  const totalStockPages = Math.max(1, Math.ceil(totalStockItems / stockPageSize));
  const validStockPage = Math.min(stockPage, totalStockPages);
  const stockStartIndex = (validStockPage - 1) * stockPageSize;
  const paginatedStockProducts = filteredStockProducts.slice(stockStartIndex, stockStartIndex + stockPageSize);

  // --- TAB 2: MOVEMENT LEDGER FILTERING ---
  const filteredMovements = useMemo(() => {
    const q = ledgerSearch.trim().toLowerCase();
    const todayStr = new Date().toISOString().substring(0, 10);

    return movements.filter(m => {
      const ref = m.refId || m.referenceId || '';
      const notes = m.reason || m.notes || '';
      const matchesSearch = q === '' ||
        m.productName.toLowerCase().includes(q) ||
        ref.toLowerCase().includes(q) ||
        notes.toLowerCase().includes(q);

      const mType = (m.type || m.movementType || '').toUpperCase();
      let matchesType = true;
      if (ledgerTypeFilter !== 'ALL') {
        if (ledgerTypeFilter === 'DAMAGED') {
          matchesType = mType === 'DAMAGED' || mType === 'DAMAGE';
        } else if (ledgerTypeFilter === 'EXPIRED') {
          matchesType = mType === 'EXPIRED' || mType === 'EXPIRY';
        } else if (ledgerTypeFilter === 'RECEIVED') {
          matchesType = mType === 'RECEIVED' || mType === 'PURCHASE_RECEIPT';
        } else {
          matchesType = mType === ledgerTypeFilter;
        }
      }

      const matchesProduct = ledgerProductFilter === 'ALL' || m.productId === ledgerProductFilter;

      let matchesDate = true;
      const mDate = (m.timestamp || '').substring(0, 10);

      if (customStartDate && mDate < customStartDate) matchesDate = false;
      if (customEndDate && mDate > customEndDate) matchesDate = false;

      if (!customStartDate && !customEndDate && ledgerDatePreset !== 'ALL') {
        if (ledgerDatePreset === 'TODAY') {
          matchesDate = mDate === todayStr;
        } else if (ledgerDatePreset === 'WEEK') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const weekStr = sevenDaysAgo.toISOString().substring(0, 10);
          matchesDate = mDate >= weekStr;
        } else if (ledgerDatePreset === 'MONTH') {
          matchesDate = mDate.startsWith(currentMonthPrefix);
        }
      }

      return matchesSearch && matchesType && matchesProduct && matchesDate;
    });
  }, [movements, ledgerSearch, ledgerTypeFilter, ledgerProductFilter, ledgerDatePreset, customStartDate, customEndDate, currentMonthPrefix]);

  // Ledger Pagination
  const totalLedgerItems = filteredMovements.length;
  const totalLedgerPages = Math.max(1, Math.ceil(totalLedgerItems / ledgerPageSize));
  const validLedgerPage = Math.min(ledgerPage, totalLedgerPages);
  const ledgerStartIndex = (validLedgerPage - 1) * ledgerPageSize;
  const paginatedMovements = filteredMovements.slice(ledgerStartIndex, ledgerStartIndex + ledgerPageSize);

  const isLedgerFilterActive = ledgerSearch !== '' || ledgerTypeFilter !== 'ALL' || ledgerProductFilter !== 'ALL' || ledgerDatePreset !== 'ALL' || customStartDate !== '' || customEndDate !== '';

  const handleResetLedgerFilters = () => {
    setLedgerSearch('');
    setLedgerTypeFilter('ALL');
    setLedgerProductFilter('ALL');
    setLedgerDatePreset('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setLedgerPage(1);
  };

  return (
    <div className="h-full flex flex-col min-h-0 space-y-3 relative">

      {/* Toast Feedback */}
      {feedback && (
        <div className={`fixed top-16 right-6 z-50 text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border animate-in fade-in slide-in-from-top-2 duration-200 ${
          feedback.type === 'error'
            ? 'bg-red-900 text-white border-red-700'
            : 'bg-slate-900 text-white border-slate-700'
        }`}>
          {feedback.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* TOP: 4 KPI CARDS (Flex-shrink-0) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
        
        {/* KPI 1: Total SKUs */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total Tracked SKUs</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            {totalSkus}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <span className="text-emerald-700 font-semibold">100% active</span> master catalog items
          </div>
        </div>

        {/* KPI 2: Units in Stock */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Units in Stock</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            {totalUnitsInStock.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Physical on-hand inventory
          </div>
        </div>

        {/* KPI 3: Low-Stock Items */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Low-Stock Items</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
              lowStockProducts.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums flex items-baseline gap-2">
            <span>{lowStockProducts.length}</span>
            {outOfStockCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                {outOfStockCount} depleted
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {criticalLowCount} items below safety threshold
          </div>
        </div>

        {/* KPI 4: Expired / Damaged this Month */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Expired / Damaged</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-700 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums flex items-baseline gap-2">
            <span>{monthlyLossUnits}</span>
            <span className="text-xs font-medium text-slate-400">units</span>
            <span className="text-xs font-semibold text-red-700 ml-auto tabular-nums">
              -${monthlyLossEstimatedValue.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Write-offs this month across cold room & floor
          </div>
        </div>

      </div>

      {/* TWO-TAB NAVIGATOR (Stock Levels vs Movement Ledger) */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-2 shadow-2xs flex-shrink-0">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3.5 py-1.5 rounded-md text-sm font-semibold transition h-8 flex items-center gap-1.5 ${
              activeTab === 'stock'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4 text-emerald-600" />
            <span>Stock Levels ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3.5 py-1.5 rounded-md text-sm font-semibold transition h-8 flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-emerald-600" />
            <span>Movement Ledger ({movements.length})</span>
          </button>
        </div>

        {isCashier && (
          <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs border border-slate-200 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>Read-Only (Cashier)</span>
          </div>
        )}
      </div>

      {/* ========================================================
          TAB 1: STOCK LEVELS (Table with stock bar & quick Adjust)
         ======================================================== */}
      {activeTab === 'stock' && (
        <div className="flex-1 min-h-0 flex flex-col space-y-3">
          
          {/* Search & Status Filter Toolbar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-shrink-0">
            
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={stockSearch}
                onChange={(e) => {
                  setStockSearch(e.target.value);
                  setStockPage(1);
                }}
                placeholder="Filter by product name, SKU or barcode..."
                className="w-full pl-9 pr-8 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 h-9"
              />
              {stockSearch && (
                <button
                  onClick={() => setStockSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-slate-600 hidden sm:block">Status:</span>
                <select
                  value={stockStatusFilter}
                  onChange={(e) => {
                    setStockStatusFilter(e.target.value as any);
                    setStockPage(1);
                  }}
                  className="px-2.5 py-1 text-sm rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
                >
                  <option value="ALL">All Stock Levels</option>
                  <option value="HEALTHY">Optimal (&gt; Threshold)</option>
                  <option value="LOW">Low Stock Warning</option>
                  <option value="OUT">Depleted (Zero Units)</option>
                </select>
              </div>

              {(stockSearch || stockStatusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setStockSearch('');
                    setStockStatusFilter('ALL');
                    setStockPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-medium transition flex items-center gap-1 h-9"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

          </div>

          {/* Stock Balances Table Card: Internal scroll, sticky header, pinned pagination */}
          <div className="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                  <tr className="text-slate-700 font-semibold select-none text-xs">
                    <th className="py-3 px-4 font-mono">SKU</th>
                    <th 
                      onClick={() => {
                        setStockSortField('name');
                        setStockSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                      }}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Product Title</span>
                        {stockSortField === 'name' ? (
                          stockSortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => {
                        setStockSortField('stock');
                        setStockSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                      }}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>On-Hand Quantity</span>
                        {stockSortField === 'stock' ? (
                          stockSortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4 w-52">Stock vs. Reorder Level</th>
                    <th 
                      onClick={() => {
                        setStockSortField('reorder');
                        setStockSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                      }}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Threshold</span>
                        {stockSortField === 'reorder' ? (
                          stockSortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => {
                        setStockSortField('valuation');
                        setStockSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                      }}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Valuation (Cost)</span>
                        {stockSortField === 'valuation' ? (
                          stockSortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Quick Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedStockProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No products match your inventory filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedStockProducts.map(p => {
                      const isZero = p.currentStock === 0;
                      const isCritical = p.currentStock <= p.reorderLevel;
                      const valuation = p.currentStock * p.costPrice;

                      const targetCapacity = Math.max(p.reorderLevel * 2, 20);
                      const barPercent = Math.min(100, Math.max(0, Math.round((p.currentStock / targetCapacity) * 100)));

                      return (
                        <tr key={p.id} className="h-[52px] hover:bg-slate-50 transition">
                          
                          {/* SKU (Mono) */}
                          <td className="py-2.5 px-4 font-mono text-slate-700 font-medium whitespace-nowrap text-xs">
                            {p.sku}
                          </td>

                          {/* Product Name (Mono ONLY on barcode) */}
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-slate-900 leading-snug">
                              {p.name}
                            </div>
                            <div className="text-xs text-slate-400">
                              Barcode: <span className="font-mono">{p.barcode}</span>
                            </div>
                          </td>

                          {/* On-hand Quantity */}
                          <td className="py-2.5 px-4 tabular-nums font-semibold whitespace-nowrap text-sm">
                            <span className="text-slate-900 font-bold">{p.currentStock}</span>
                            <span className="text-slate-500 ml-1 font-normal text-xs">{p.unit}</span>
                          </td>

                          {/* Stock Bar */}
                          <td className="py-2.5 px-4">
                            <div className="space-y-1 w-full max-w-[190px]">
                              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                                <span className={isZero ? 'text-red-700 font-bold' : isCritical ? 'text-amber-700 font-semibold' : 'text-slate-600'}>
                                  {isZero ? '0% of target' : `${barPercent}% capacity`}
                                </span>
                                <span className="text-xs tabular-nums text-slate-400">
                                  {p.currentStock}/{p.reorderLevel} min
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isZero 
                                      ? 'w-0' 
                                      : isCritical 
                                        ? 'bg-amber-500' 
                                        : 'bg-emerald-600'
                                  }`}
                                  style={{ width: `${barPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Threshold */}
                          <td className="py-2.5 px-4 tabular-nums text-slate-600 whitespace-nowrap text-sm">
                            {p.reorderLevel} {p.unit}
                          </td>

                          {/* Valuation */}
                          <td className="py-2.5 px-4 tabular-nums text-slate-700 font-medium whitespace-nowrap text-sm">
                            ${valuation.toFixed(2)}
                          </td>

                          {/* Status Badge */}
                          <td className="py-2.5 px-4 text-center whitespace-nowrap">
                            {isZero ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                <span>Out of Stock</span>
                              </span>
                            ) : isCritical ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>Low Warning</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Optimal</span>
                              </span>
                            )}
                          </td>

                          {/* Quick Adjust Button */}
                          <td className="py-2.5 px-4 text-center whitespace-nowrap">
                            {canAdjust ? (
                              <button
                                onClick={() => handleOpenDrawer(p.id)}
                                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold transition border border-slate-200 h-7 flex items-center justify-center gap-1 mx-auto focus-visible:outline-2 focus-visible:outline-emerald-500"
                                title="Record loss, damage or count correction"
                              >
                                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Adjust</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">Locked</span>
                            )}
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pinned Pagination at the bottom of the card */}
            {totalStockItems > 0 && (
              <div className="flex-shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <div>
                  Showing <strong className="text-slate-900 font-semibold tabular-nums">{stockStartIndex + 1}</strong> to{' '}
                  <strong className="text-slate-900 font-semibold tabular-nums">{Math.min(stockStartIndex + stockPageSize, totalStockItems)}</strong> of{' '}
                  <strong className="text-slate-900 font-semibold tabular-nums">{totalStockItems}</strong> items
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setStockPage(prev => Math.max(1, prev - 1))}
                    disabled={validStockPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition h-8"
                  >
                    Previous
                  </button>
                  <span className="px-2 text-xs font-semibold text-slate-700 tabular-nums">
                    Page {validStockPage} of {totalStockPages}
                  </span>
                  <button
                    onClick={() => setStockPage(prev => Math.min(totalStockPages, prev + 1))}
                    disabled={validStockPage === totalStockPages}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition h-8"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================
          TAB 2: MOVEMENT LEDGER (Chronological Audit Log)
         ======================================================== */}
      {activeTab === 'ledger' && (
        <div className="flex-1 min-h-0 flex flex-col space-y-3">
          
          {/* Movement Ledger Filters Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2.5 flex-shrink-0">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={ledgerSearch}
                  onChange={(e) => {
                    setLedgerSearch(e.target.value);
                    setLedgerPage(1);
                  }}
                  placeholder="Search by reference ID, item name, or reason..."
                  className="w-full pl-9 pr-8 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 h-9"
                />
                {ledgerSearch && (
                  <button
                    onClick={() => setLedgerSearch('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-slate-600 hidden sm:block">Type:</span>
                  <select
                    value={ledgerTypeFilter}
                    onChange={(e) => {
                      setLedgerTypeFilter(e.target.value);
                      setLedgerPage(1);
                    }}
                    className="px-2.5 py-1 text-sm rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
                  >
                    <option value="ALL">All Types</option>
                    <option value="SALE">SALE</option>
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="DAMAGED">DAMAGED</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="ADJUSTMENT">ADJUSTMENT</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-slate-600 hidden sm:block">Product:</span>
                  <select
                    value={ledgerProductFilter}
                    onChange={(e) => {
                      setLedgerProductFilter(e.target.value);
                      setLedgerPage(1);
                    }}
                    className="px-2.5 py-1 text-sm rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 max-w-[160px] truncate"
                  >
                    <option value="ALL">All Products</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-slate-600 hidden sm:block">Date:</span>
                  <select
                    value={ledgerDatePreset}
                    onChange={(e) => {
                      setLedgerDatePreset(e.target.value as DateFilterPreset);
                      setCustomStartDate('');
                      setCustomEndDate('');
                      setLedgerPage(1);
                    }}
                    className="px-2.5 py-1 text-sm rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
                  >
                    <option value="ALL">All Time</option>
                    <option value="TODAY">Today</option>
                    <option value="WEEK">Last 7 Days</option>
                    <option value="MONTH">This Month</option>
                  </select>
                </div>

                {isLedgerFilterActive && (
                  <button
                    onClick={handleResetLedgerFilters}
                    className="px-2.5 py-1.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-medium transition flex items-center gap-1 h-9"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}

              </div>

            </div>

            {/* Custom Date Range Pickers */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[13px] text-slate-500">
              <span className="font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Custom Range:</span>
              </span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setLedgerDatePreset('ALL');
                  setLedgerPage(1);
                }}
                className="px-2 py-1 rounded-md border border-slate-300 text-sm bg-slate-50 focus:bg-white"
              />
              <span>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setLedgerDatePreset('ALL');
                  setLedgerPage(1);
                }}
                className="px-2 py-1 rounded-md border border-slate-300 text-sm bg-slate-50 focus:bg-white"
              />
              <span className="ml-auto text-slate-400 text-xs">
                Matching logs: <strong className="text-slate-700 tabular-nums">{totalLedgerItems}</strong>
              </span>
            </div>

          </div>

          {/* Chronological Ledger Table Card: Internal scroll, sticky header, pinned pagination */}
          <div className="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                  <tr className="text-slate-700 font-semibold select-none text-xs">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4 text-center">Movement Type</th>
                    <th className="py-3 px-4 text-center">Quantity Delta</th>
                    <th className="py-3 px-4 text-center">Balance After</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4 font-mono">Reference</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedMovements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No movement audit records match your active criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedMovements.map(m => {
                      const rawQty = m.qty !== undefined ? m.qty : (m.quantityDelta ?? 0);
                      const isPositive = rawQty > 0;
                      const rawType = (m.type || m.movementType || 'ADJUSTMENT').toUpperCase();

                      let typeLabel = rawType;
                      let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';

                      if (rawType === 'SALE') {
                        badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                        typeLabel = 'SALE';
                      } else if (rawType === 'RECEIVED' || rawType === 'PURCHASE_RECEIPT') {
                        badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                        typeLabel = 'RECEIVED';
                      } else if (rawType === 'DAMAGED' || rawType === 'DAMAGE') {
                        badgeStyle = 'bg-red-50 text-red-700 border-red-200';
                        typeLabel = 'DAMAGED';
                      } else if (rawType === 'EXPIRED' || rawType === 'EXPIRY') {
                        badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
                        typeLabel = 'EXPIRED';
                      } else if (rawType === 'ADJUSTMENT') {
                        badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                        typeLabel = 'ADJUSTMENT';
                      }

                      const dateDisplay = (m.timestamp || '').replace('T', ' ').substring(0, 16) || 'Just now';

                      return (
                        <tr key={m.id} className="h-[52px] hover:bg-slate-50 transition">
                          
                          {/* Date & Time (Inter with tabular-nums) */}
                          <td className="py-2.5 px-4 whitespace-nowrap text-slate-600 text-xs tabular-nums">
                            {dateDisplay}
                          </td>

                          {/* Item Name */}
                          <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                            {m.productName}
                          </td>

                          {/* Movement Type Badge */}
                          <td className="py-2.5 px-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${badgeStyle}`}>
                              {typeLabel}
                            </span>
                          </td>

                          {/* Quantity Delta */}
                          <td className="py-2.5 px-4 text-center tabular-nums font-bold whitespace-nowrap text-sm">
                            <span className={isPositive ? 'text-emerald-700' : 'text-red-600'}>
                              {isPositive ? `+${rawQty}` : rawQty}
                            </span>
                          </td>

                          {/* Balance After */}
                          <td className="py-2.5 px-4 text-center tabular-nums font-semibold text-slate-800 whitespace-nowrap text-sm">
                            {m.balanceAfter !== undefined ? m.balanceAfter : '—'}
                          </td>

                          {/* User (Inter) */}
                          <td className="py-2.5 px-4 whitespace-nowrap text-slate-700 text-xs">
                            {m.performedBy || m.userId || 'Staff User'}
                          </td>

                          {/* Reference (Mono) */}
                          <td className="py-2.5 px-4 font-mono text-slate-500 text-xs whitespace-nowrap">
                            {m.refId || m.referenceId || 'MANUAL-ADJ'}
                          </td>

                          {/* Reason / Notes (Inter) */}
                          <td className="py-2.5 px-4 text-slate-600 text-xs max-w-xs truncate" title={m.reason || m.notes || '—'}>
                            {m.reason || m.notes || '—'}
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pinned Pagination at the bottom of the card */}
            {totalLedgerItems > 0 && (
              <div className="flex-shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <div>
                  Showing <strong className="text-slate-900 font-semibold tabular-nums">{ledgerStartIndex + 1}</strong> to{' '}
                  <strong className="text-slate-900 font-semibold tabular-nums">{Math.min(ledgerStartIndex + ledgerPageSize, totalLedgerItems)}</strong> of{' '}
                  <strong className="text-slate-900 font-semibold tabular-nums">{totalLedgerItems}</strong> records
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setLedgerPage(prev => Math.max(1, prev - 1))}
                    disabled={validLedgerPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition h-8"
                  >
                    Previous
                  </button>
                  <span className="px-2 text-xs font-semibold text-slate-700 tabular-nums">
                    Page {validLedgerPage} of {totalLedgerPages}
                  </span>
                  <button
                    onClick={() => setLedgerPage(prev => Math.min(totalLedgerPages, prev + 1))}
                    disabled={validLedgerPage === totalLedgerPages}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition h-8"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================
          RECORD MOVEMENT DRAWER (Manual, Damaged, Expired)
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
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Record Stock Movement</h3>
                    <p className="text-xs text-slate-400">
                      Physical audit, breakage write-off, or expiry adjustment
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCloseDrawer}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDrawerSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
                
                {drawerError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{drawerError}</span>
                  </div>
                )}

                {/* 1. Select Product */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">
                    Select Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={drawerProductId}
                    onChange={(e) => setDrawerProductId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 text-sm"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.currentStock} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Movement Type */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">
                    Movement Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['DAMAGED', 'EXPIRED', 'ADJUSTMENT'] as MovementType[]).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setDrawerType(t)}
                        className={`py-2 px-2 rounded-lg text-xs font-semibold border transition text-center ${
                          drawerType === t
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Quantity */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">
                    Quantity to Adjust <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={drawerQty}
                    onChange={(e) => setDrawerQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 tabular-nums font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 text-sm"
                  />
                </div>

                {/* 4. Reason / Justification */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">
                    Mandatory Reason / Justification <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={drawerReason}
                    onChange={(e) => setDrawerReason(e.target.value)}
                    placeholder="e.g. Dropped carton during aisle restock, bottle shattered"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
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
                    Post Movement
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
