import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Barcode, 
  AlertTriangle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  Eye, 
  PackageSearch, 
  RotateCcw 
} from 'lucide-react';
import { Product, Category, User } from '../types/aybos';
import { useStore } from '../context/StoreContext';
import { productService } from '../services';

interface ProductManagementProps {
  products: Product[];
  categories: Category[];
  currentUser: User;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct?: (id: string) => void;
  actionTrigger?: { module: string; timestamp: number };
}

type SortField = 'name' | 'barcode' | 'category' | 'sellingPrice' | 'costPrice' | 'currentStock' | 'status';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  categories,
  currentUser,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  actionTrigger
}) => {
  const store = useStore();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination state: Default rows per page = 25
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Right-Side Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete Confirmation Modal State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast / Feedback State
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Drawer Form State
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-1');
  const [unit, setUnit] = useState<'PCS' | 'KG' | 'PACK' | 'BOX'>('PCS');
  const [costPrice, setCostPrice] = useState<string>('5.00');
  const [sellingPrice, setSellingPrice] = useState<string>('7.50');
  const [reorderLevel, setReorderLevel] = useState<string>('10');
  const [stock, setStock] = useState<string>('20');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // RBAC Permission: Cashier is read-only; Manager has full access
  const isReadOnly = currentUser.role !== 'MANAGER';
  const isCashier = isReadOnly;
  const canEdit = currentUser.role === 'MANAGER';

  // Category Theme Colors for initial avatar tiles
  const getCategoryTheme = (catId: string) => {
    switch (catId) {
      case 'cat-1': return { bg: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'cat-2': return { bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'cat-3': return { bg: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
      case 'cat-4': return { bg: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'cat-5': return { bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'cat-6': return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'cat-7': return { bg: 'bg-slate-200 text-slate-800 border-slate-300' };
      default: return { bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedStatus]);

  // Listen to Top Bar primary action button trigger
  useEffect(() => {
    if (actionTrigger?.module === 'PRODUCTS' && actionTrigger.timestamp > 0) {
      handleOpenAdd();
    }
  }, [actionTrigger]);

  // Open Drawer for New Product
  const handleOpenAdd = () => {
    if (isCashier) return;
    setEditingProduct(null);
    setName('');
    setBarcode(`628100${Math.floor(100000 + Math.random() * 900000)}`);
    setCategoryId(categories[0]?.id || 'cat-1');
    setUnit('PCS');
    setCostPrice('4.50');
    setSellingPrice('6.95');
    setReorderLevel('10');
    setStock('25');
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  // Open Drawer for Edit or View
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setBarcode(product.barcode);
    setCategoryId(product.categoryId);
    setUnit(product.unit);
    setCostPrice(product.costPrice.toFixed(2));
    setSellingPrice(product.sellingPrice.toFixed(2));
    setReorderLevel(product.reorderLevel.toString());
    setStock(product.currentStock.toString());
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingProduct(null);
    setFormErrors({});
  };

  // Drawer Form Validation & Submit
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCashier) return;

    const errors: Record<string, string> = {};
    const trimmedName = name.trim();
    const cleanBarcode = barcode.trim();
    const numPrice = parseFloat(sellingPrice);
    const numCost = parseFloat(costPrice);
    const numReorder = parseInt(reorderLevel, 10);
    const numStock = parseInt(stock, 10);

    if (!trimmedName) {
      errors.name = 'Product name is required.';
    }

    if (!cleanBarcode) {
      errors.barcode = 'Universal barcode is required.';
    } else {
      const barcodeExists = products.find(p => 
        p.barcode.toLowerCase() === cleanBarcode.toLowerCase() && 
        (!editingProduct || p.id !== editingProduct.id)
      );
      if (barcodeExists) {
        errors.barcode = `Barcode already assigned to "${barcodeExists.name}" (SKU: ${barcodeExists.sku}).`;
      }
    }

    if (isNaN(numPrice) || numPrice <= 0) {
      errors.sellingPrice = 'Retail price must be greater than $0.00.';
    }

    if (isNaN(numCost) || numCost < 0) {
      errors.costPrice = 'Cost price cannot be negative.';
    }

    if (!isNaN(numPrice) && !isNaN(numCost) && numPrice < numCost) {
      errors.sellingPrice = `Retail price ($${numPrice.toFixed(2)}) cannot be lower than cost price ($${numCost.toFixed(2)}).`;
    }

    if (isNaN(numReorder) || numReorder < 0) {
      errors.reorderLevel = 'Reorder threshold cannot be negative.';
    }

    if (isNaN(numStock) || numStock < 0) {
      errors.stock = 'Initial on-hand stock cannot be negative.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name: trimmedName,
        barcode: cleanBarcode,
        categoryId,
        unit,
        costPrice: Number(numCost.toFixed(2)),
        sellingPrice: Number(numPrice.toFixed(2)),
        reorderLevel: numReorder,
        currentStock: numStock
      };
      onUpdateProduct(updated);
      showFeedback(`Product "${trimmedName}" updated successfully.`);
    } else {
      const generatedSku = `SKU-${cleanBarcode.slice(-4)}-${Math.floor(10 + Math.random() * 90)}`;
      onAddProduct({
        sku: generatedSku,
        barcode: cleanBarcode,
        name: trimmedName,
        categoryId,
        unit,
        costPrice: Number(numCost.toFixed(2)),
        sellingPrice: Number(numPrice.toFixed(2)),
        reorderLevel: numReorder,
        currentStock: numStock,
        status: 'ACTIVE'
      });
      showFeedback(`Product "${trimmedName}" registered in catalog.`);
    }

    handleCloseDrawer();
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete || isCashier) return;
    setIsDeleting(true);

    try {
      if (onDeleteProduct) {
        onDeleteProduct(productToDelete.id);
      } else {
        await productService.delete(productToDelete.id);
        await store.refreshData();
      }
      showFeedback(`Product "${productToDelete.name}" removed from catalog.`);
    } catch (err) {
      console.error(err);
      showFeedback('Failed to delete product. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered & Sorted Products
  const filteredAndSortedProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products
      .filter(p => {
        const matchesSearch = query === '' ||
          p.name.toLowerCase().includes(query) ||
          p.barcode.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query);

        const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;

        let matchesStatus = true;
        if (selectedStatus === 'OUT_OF_STOCK') {
          matchesStatus = p.currentStock <= 0;
        } else if (selectedStatus === 'LOW_STOCK') {
          matchesStatus = p.currentStock > 0 && p.currentStock <= p.reorderLevel;
        } else if (selectedStatus === 'IN_STOCK') {
          matchesStatus = p.currentStock > p.reorderLevel;
        }

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        let aVal: any = a[sortField as keyof Product];
        let bVal: any = b[sortField as keyof Product];

        if (sortField === 'category') {
          const catA = categories.find(c => c.id === a.categoryId)?.name || '';
          const catB = categories.find(c => c.id === b.categoryId)?.name || '';
          aVal = catA.toLowerCase();
          bVal = catB.toLowerCase();
        } else if (sortField === 'status') {
          const getStatusRank = (p: Product) => p.currentStock <= 0 ? 0 : p.currentStock <= p.reorderLevel ? 1 : 2;
          aVal = getStatusRank(a);
          bVal = getStatusRank(b);
        } else if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal as string).toLowerCase();
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [products, categories, search, selectedCategory, selectedStatus, sortField, sortDirection]);

  // Pagination Calculations
  const totalItems = filteredAndSortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedProducts = filteredAndSortedProducts.slice(startIndex, endIndex);

  const isFilterActive = search !== '' || selectedCategory !== 'ALL' || selectedStatus !== 'ALL';

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
  };

  return (
    <div className="h-full flex flex-col min-h-0 space-y-3 relative">
      
      {/* Toast Feedback Notification */}
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

      {/* Filter and Control Toolbar (Height-stable, 14px inputs & labels) */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex-shrink-0 space-y-2.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Global Catalog Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, barcode or SKU..."
              className="w-full pl-9 pr-8 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 h-9 transition placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-emerald-500"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter & Status Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium text-slate-600 hidden sm:block">
                Category:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1 text-sm rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
              >
                <option value="ALL">All Categories ({products.length})</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium text-slate-600 hidden sm:block">
                Status:
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)}
                className="px-2.5 py-1 text-sm rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
              >
                <option value="ALL">All Stock Statuses</option>
                <option value="IN_STOCK">In Stock (Optimal)</option>
                <option value="LOW_STOCK">Low Stock Warning</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>

            {isFilterActive && (
              <button
                onClick={handleClearFilters}
                className="px-2.5 py-1.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-medium transition flex items-center gap-1 h-9"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

          </div>

        </div>

        {/* Filter Summary & Result Stats */}
        <div className="flex items-center justify-between text-[13px] text-slate-500 pt-1.5 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-800 font-semibold tabular-nums">{totalItems}</strong> {totalItems === 1 ? 'product' : 'products'}
            {isFilterActive && ' (filtered)'}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 font-medium text-slate-700 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

      </div>

      {/* Main Data Table Card: Fills remaining height, internal scroll with sticky header, pinned pagination */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {totalItems === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
              <PackageSearch className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {isFilterActive ? 'No matching products found' : 'No products in catalog'}
            </h3>
            <p className="text-[13px] text-slate-500 mt-1 max-w-md mx-auto">
              {isFilterActive 
                ? 'We could not find any products matching your active search or filter criteria. Try adjusting your terms.'
                : 'Your supermarket inventory master catalog is currently empty. Add your first product to begin.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {isFilterActive ? (
                <button
                  onClick={handleClearFilters}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              ) : canEdit ? (
                <button
                  onClick={handleOpenAdd}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Product</span>
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-700 font-semibold select-none text-xs">
                  <th className="py-3 px-4 w-12 text-center">Item</th>

                  <th 
                    onClick={() => handleSort('name')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Product Name & SKU</span>
                      {sortField === 'name' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-4">
                    Universal Barcode
                  </th>

                  <th 
                    onClick={() => handleSort('category')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      {sortField === 'category' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('sellingPrice')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Retail Price</span>
                      {sortField === 'sellingPrice' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('costPrice')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Cost Price</span>
                      {sortField === 'costPrice' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('currentStock')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Stock On Hand</span>
                      {sortField === 'currentStock' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('status')}
                    className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100/70 transition"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Status</span>
                      {sortField === 'status' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-4 text-center w-24">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedProducts.map(p => {
                  const category = categories.find(c => c.id === p.categoryId);
                  const theme = getCategoryTheme(p.categoryId);
                  const isOutOfStock = p.currentStock <= 0;
                  const isLowStock = p.currentStock > 0 && p.currentStock <= p.reorderLevel;

                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => handleOpenEdit(p)}
                      className="h-[52px] hover:bg-slate-50/80 cursor-pointer transition group"
                    >
                      {/* Product Image / Initial Avatar */}
                      <td className="py-2.5 px-4 text-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${theme.bg} shadow-2xs`}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      </td>

                      {/* Name & SKU (Mono ONLY on SKU) */}
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition leading-snug">
                          {p.name}
                        </div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5">
                          {p.sku}
                        </div>
                      </td>

                      {/* Barcode (Mono) */}
                      <td className="py-2.5 px-4 font-mono text-slate-600 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Barcode className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{p.barcode}</span>
                        </div>
                      </td>

                      {/* Category Chip */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                          {category?.name || 'General'}
                        </span>
                      </td>

                      {/* Retail Price (Inter with tabular-nums) */}
                      <td className="py-2.5 px-4 tabular-nums font-bold text-emerald-700 text-sm whitespace-nowrap">
                        ${p.sellingPrice.toFixed(2)}
                      </td>

                      {/* Cost Price */}
                      <td className="py-2.5 px-4 tabular-nums text-slate-600 whitespace-nowrap text-sm">
                        ${p.costPrice.toFixed(2)}
                      </td>

                      {/* Stock Level */}
                      <td className="py-2.5 px-4 tabular-nums font-semibold whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-900 font-bold">{p.currentStock}</span>
                          <span className="text-slate-400 text-xs font-normal">{p.unit}</span>
                          <span className="text-xs text-slate-400 font-normal">
                            (Min: {p.reorderLevel})
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            <span>Out of Stock</span>
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Low ({p.currentStock} left)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>In Stock</span>
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-2.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {canEdit ? (
                            <>
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition focus-visible:outline-2 focus-visible:outline-emerald-500"
                                title="Edit product"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setProductToDelete(p)}
                                className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md transition focus-visible:outline-2 focus-visible:outline-red-500"
                                title="Delete product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pinned Pagination Bar at the bottom of the card */}
        {totalItems > 0 && (
          <div className="flex-shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing <strong className="text-slate-900 font-semibold tabular-nums">{startIndex + 1}</strong> to{' '}
              <strong className="text-slate-900 font-semibold tabular-nums">{endIndex}</strong> of{' '}
              <strong className="text-slate-900 font-semibold tabular-nums">{totalItems}</strong> entries
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={validCurrentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition flex items-center gap-1 shadow-2xs h-8"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - validCurrentPage) <= 1)
                  .map((pageNum, idx, arr) => {
                    const prevPage = arr[idx - 1];
                    const showEllipsis = prevPage && pageNum - prevPage > 1;

                    return (
                      <React.Fragment key={pageNum}>
                        {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                        <button
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                            validCurrentPage === pageNum
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={validCurrentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition flex items-center gap-1 shadow-2xs h-8"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          RIGHT-SIDE SLIDE-OVER DRAWER (Add / Edit Product)
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
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {isCashier 
                        ? 'Product Details' 
                        : editingProduct 
                          ? 'Edit Product' 
                          : 'Register New Product'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {editingProduct ? `SKU: ${editingProduct.sku}` : 'Fill in the catalog specification'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCloseDrawer}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  title="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
                
                {isReadOnly && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                    <span>Your {currentUser.role} role has read-only catalog permissions. Form fields are view-only.</span>
                  </div>
                )}

                {/* 1. Product Name */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-sm">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={isCashier}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="e.g. Almarai Full Cream Fresh Milk 1L"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 transition ${
                      formErrors.name ? 'border-red-400 bg-red-50/50' : 'border-slate-300 bg-white'
                    } disabled:bg-slate-100 disabled:text-slate-500`}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-600 mt-1 font-medium">{formErrors.name}</p>
                  )}
                </div>

                {/* 2. Barcode & SKU */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-sm flex items-center justify-between">
                      <span>Barcode <span className="text-red-500">*</span></span>
                      <span className="text-xs text-slate-400 font-mono">EAN-13</span>
                    </label>
                    <input
                      type="text"
                      disabled={isCashier}
                      value={barcode}
                      onChange={(e) => {
                        setBarcode(e.target.value);
                        if (formErrors.barcode) setFormErrors(prev => ({ ...prev, barcode: '' }));
                      }}
                      placeholder="628100123456"
                      className={`w-full px-3 py-2 rounded-lg border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 transition ${
                        formErrors.barcode ? 'border-red-400 bg-red-50/50' : 'border-slate-300 bg-white'
                      } disabled:bg-slate-100 disabled:text-slate-500`}
                    />
                    {formErrors.barcode && (
                      <p className="text-xs text-red-600 mt-1 font-medium leading-tight">{formErrors.barcode}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-sm">
                      SKU Code
                    </label>
                    <input
                      type="text"
                      disabled
                      value={editingProduct ? editingProduct.sku : 'Auto-generated'}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-sm bg-slate-100 text-slate-500 h-9"
                    />
                  </div>
                </div>

                {/* 3. Category & Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-sm">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      disabled={isCashier}
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 disabled:bg-slate-100"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-sm">
                      Unit of Measure <span className="text-red-500">*</span>
                    </label>
                    <select
                      disabled={isCashier}
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 disabled:bg-slate-100"
                    >
                      <option value="PCS">Piece (PCS)</option>
                      <option value="KG">Kilogram (KG)</option>
                      <option value="PACK">Pack (PACK)</option>
                      <option value="BOX">Box / Carton (BOX)</option>
                    </select>
                  </div>
                </div>

                {/* 4. Cost & Retail Prices */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-sm">
                      Cost Price ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={isCashier}
                      value={costPrice}
                      onChange={(e) => {
                        setCostPrice(e.target.value);
                        if (formErrors.costPrice) setFormErrors(prev => ({ ...prev, costPrice: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-lg border tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 bg-white ${
                        formErrors.costPrice ? 'border-red-400 bg-red-50/50' : 'border-slate-300'
                      } disabled:bg-slate-100`}
                    />
                    {formErrors.costPrice && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{formErrors.costPrice}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-sm">
                      Retail Price ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      disabled={isCashier}
                      value={sellingPrice}
                      onChange={(e) => {
                        setSellingPrice(e.target.value);
                        if (formErrors.sellingPrice) setFormErrors(prev => ({ ...prev, sellingPrice: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-lg border tabular-nums text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 bg-white ${
                        formErrors.sellingPrice ? 'border-red-400 bg-red-50/50' : 'border-slate-300'
                      } disabled:bg-slate-100`}
                    />
                    {formErrors.sellingPrice && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{formErrors.sellingPrice}</p>
                    )}
                  </div>
                </div>

                {/* 5. Inventory Stock & Reorder Threshold */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-sm">
                      {editingProduct ? 'Current On-Hand Stock' : 'Initial Stock Quantity'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={isCashier}
                      value={stock}
                      onChange={(e) => {
                        setStock(e.target.value);
                        if (formErrors.stock) setFormErrors(prev => ({ ...prev, stock: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-lg border tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 ${
                        formErrors.stock ? 'border-red-400 bg-red-50/50' : 'border-slate-300 bg-white'
                      } disabled:bg-slate-100`}
                    />
                    {formErrors.stock && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{formErrors.stock}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-sm">
                      Reorder Threshold <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={isCashier}
                      value={reorderLevel}
                      onChange={(e) => {
                        setReorderLevel(e.target.value);
                        if (formErrors.reorderLevel) setFormErrors(prev => ({ ...prev, reorderLevel: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-lg border tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 ${
                        formErrors.reorderLevel ? 'border-red-400 bg-red-50/50' : 'border-slate-300 bg-white'
                      } disabled:bg-slate-100`}
                    />
                    {formErrors.reorderLevel && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{formErrors.reorderLevel}</p>
                    )}
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition h-10"
                  >
                    {isCashier ? 'Close' : 'Cancel'}
                  </button>

                  {!isCashier && (
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition h-10 active:scale-98"
                    >
                      {editingProduct ? 'Save Changes' : 'Register Product'}
                    </button>
                  )}
                </div>

              </form>

            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm">
                  Delete Product Confirmation
                </h3>
                <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to delete <strong className="text-slate-900 font-semibold">{productToDelete.name}</strong>?
                </p>
                <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div>SKU: <strong className="font-mono text-slate-800">{productToDelete.sku}</strong></div>
                  <div>Barcode: <strong className="font-mono text-slate-800">{productToDelete.barcode}</strong></div>
                  <div>On-hand stock: <strong className="tabular-nums text-slate-800">{productToDelete.currentStock} {productToDelete.unit}</strong></div>
                </div>
                <p className="text-xs text-red-600 mt-2 font-medium">
                  Warning: This action will permanently remove this item from the active master catalog.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition h-9"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-xs transition flex items-center gap-1.5 h-9"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
