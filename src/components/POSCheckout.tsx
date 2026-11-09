import React, { useState, useEffect, useRef } from 'react';
import { 
  Barcode, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Printer, 
  RotateCcw, 
  PauseCircle, 
  PlayCircle,
  Tag, 
  ShoppingBag, 
  Percent, 
  DollarSign, 
  X, 
  User as UserIcon,
  AlertTriangle,
  ReceiptText,
  Clock,
  Sparkles,
  ArrowRight,
  Milk,
  Croissant,
  Coffee,
  Wheat,
  Cookie,
  Apple,
  Package
} from 'lucide-react';
import { Product, CartItem, SalesReceipt, User } from '../types/aybos';
import { ConfirmModal } from './ConfirmModal';

interface POSCheckoutProps {
  products: Product[];
  currentUser: User;
  onCompleteSale: (receipt: SalesReceipt) => void;
}

export const POSCheckout: React.FC<POSCheckoutProps> = ({ products, currentUser, onCompleteSale }) => {
  // --- State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleNumber, setSaleNumber] = useState<string>('#0001');
  const [heldCarts, setHeldCarts] = useState<{ id: string; saleNumber: string; cart: CartItem[]; timestamp: string }[]>([]);
  
  // Discount state (percentage or fixed dollar)
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [discountValue, setDiscountValue] = useState<string>('');
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');
  
  // Feedback & Receipt Modal
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [itemWarning, setItemWarning] = useState<{ productId: string; text: string } | null>(null);
  const [receiptModal, setReceiptModal] = useState<SalesReceipt | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // References
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Quick categories derived from products or predefined
  const categories = [
    { id: 'ALL', name: 'All Items' },
    { id: 'cat-1', name: 'Dairy & Eggs', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'cat-2', name: 'Bakery & Bread', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'cat-3', name: 'Beverages', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    { id: 'cat-4', name: 'Pantry & Grains', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { id: 'cat-5', name: 'Snacks & Sweets', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { id: 'cat-6', name: 'Fresh Produce', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'cat-7', name: 'Household', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  ];

  // Category soft colors and Lucide icons for ~88px tile header
  const getCategoryTheme = (catId: string) => {
    switch (catId) {
      case 'cat-1': 
        return { bg: 'bg-blue-50/80 text-blue-600', border: 'border-blue-100', icon: Milk };
      case 'cat-2': 
        return { bg: 'bg-amber-50/80 text-amber-600', border: 'border-amber-100', icon: Croissant };
      case 'cat-3': 
        return { bg: 'bg-cyan-50/80 text-cyan-600', border: 'border-cyan-100', icon: Coffee };
      case 'cat-4': 
        return { bg: 'bg-orange-50/80 text-orange-600', border: 'border-orange-100', icon: Wheat };
      case 'cat-5': 
        return { bg: 'bg-purple-50/80 text-purple-600', border: 'border-purple-100', icon: Cookie };
      case 'cat-6': 
        return { bg: 'bg-emerald-50/80 text-emerald-600', border: 'border-emerald-100', icon: Apple };
      case 'cat-7': 
        return { bg: 'bg-teal-50/80 text-teal-600', border: 'border-teal-100', icon: Sparkles };
      default: 
        return { bg: 'bg-slate-50 text-slate-600', border: 'border-slate-200', icon: Package };
    }
  };

  // Keyboard Shortcuts (F2: search, F4: hold, F9: clear, F12: complete, Esc: dismiss)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleHoldSale();
      } else if (e.key === 'F9') {
        e.preventDefault();
        handleClearCart();
      } else if (e.key === 'F12') {
        e.preventDefault();
        if (canCompleteSale) {
          handleCompleteSaleSubmit();
        }
      } else if (e.key === 'Escape') {
        if (receiptModal) {
          setReceiptModal(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add Item to Cart
  const addItemToCart = (product: Product, quantityToAdd = 1) => {
    if (product.currentStock <= 0) {
      setItemWarning({ productId: product.id, text: `"${product.name}" is out of stock` });
      setTimeout(() => setItemWarning(null), 3000);
      return;
    }

    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity + quantityToAdd > product.currentStock) {
          setItemWarning({
            productId: product.id,
            text: `Limit reached: only ${product.currentStock} ${product.unit} available on hand`
          });
          setTimeout(() => setItemWarning(null), 3500);
          return prevCart;
        }
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantityToAdd, total: (item.quantity + quantityToAdd) * item.unitPrice }
            : item
        );
      } else {
        return [...prevCart, {
          product,
          quantity: quantityToAdd,
          unitPrice: product.sellingPrice,
          total: quantityToAdd * product.sellingPrice
        }];
      }
    });

    setItemWarning(null);
  };

  // Handle Search Input (Barcode scan or exact SKU hit on Enter)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    // Search by exact barcode or SKU first
    const exactMatch = products.find(p => 
      p.barcode.toLowerCase() === query || 
      p.sku.toLowerCase() === query
    );

    if (exactMatch) {
      addItemToCart(exactMatch);
      setSearchQuery('');
      return;
    }

    // Partial search match
    const matches = products.filter(p => p.name.toLowerCase().includes(query));
    if (matches.length === 1) {
      addItemToCart(matches[0]);
      setSearchQuery('');
    } else if (matches.length === 0) {
      setItemWarning({ productId: 'search-miss', text: `No item found for code: "${searchQuery}"` });
      setTimeout(() => setItemWarning(null), 3000);
    }
  };

  // Adjust item quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.currentStock) {
            setItemWarning({
              productId,
              text: `Max stock limit (${item.product.currentStock} ${item.product.unit}) reached`
            });
            setTimeout(() => setItemWarning(null), 3000);
            return item;
          }
          setItemWarning(null);
          return { ...item, quantity: newQty, total: newQty * item.unitPrice };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    if (itemWarning?.productId === productId) {
      setItemWarning(null);
    }
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    setIsClearConfirmOpen(true);
  };

  const executeClearCart = () => {
    setCart([]);
    setCashTendered('');
    setDiscountValue('');
    setItemWarning(null);
    triggerToast('Current sale cart cleared');
    setIsClearConfirmOpen(false);
  };

  const handleHoldSale = () => {
    if (cart.length === 0) return;
    const holdRecord = {
      id: `hold-${Date.now()}`,
      saleNumber,
      cart,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setHeldCarts(prev => [holdRecord, ...prev]);
    setCart([]);
    setCashTendered('');
    setDiscountValue('');
    // Increment sale number
    const currentNum = parseInt(saleNumber.replace('#', '')) || 1;
    setSaleNumber(`#${String(currentNum + 1).padStart(4, '0')}`);
    triggerToast(`Sale ${saleNumber} placed on hold`);
  };

  const restoreHeldCart = (heldId: string) => {
    const found = heldCarts.find(h => h.id === heldId);
    if (!found) return;
    if (cart.length > 0) {
      // Put current on hold first
      handleHoldSale();
    }
    setCart(found.cart);
    setSaleNumber(found.saleNumber);
    setHeldCarts(prev => prev.filter(h => h.id !== heldId));
    triggerToast(`Restored sale ${found.saleNumber}`);
  };

  // --- Financial Calculations ---
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);

  // Discount calculation
  let calculatedDiscount = 0;
  const numDiscountVal = parseFloat(discountValue) || 0;
  if (numDiscountVal > 0) {
    if (discountType === 'PERCENT') {
      calculatedDiscount = (subtotal * Math.min(100, numDiscountVal)) / 100;
    } else {
      calculatedDiscount = Math.min(subtotal, numDiscountVal);
    }
  }
  calculatedDiscount = Number(calculatedDiscount.toFixed(2));

  const discountedSubtotal = Math.max(0, subtotal - calculatedDiscount);
  const vat = Number((discountedSubtotal * 0.05).toFixed(2)); // 5% VAT
  const total = Number((discountedSubtotal + vat).toFixed(2));

  // Cash tender calculations
  const numericTendered = parseFloat(cashTendered) || 0;
  const isCashSufficient = paymentMethod === 'CARD' || numericTendered >= total;
  const changeDue = paymentMethod === 'CASH' ? Math.max(0, numericTendered - total) : 0;
  const canCompleteSale = cart.length > 0 && isCashSufficient && total > 0;

  // Finalize Sale
  const handleCompleteSaleSubmit = () => {
    if (!canCompleteSale) return;

    const receipt: SalesReceipt = {
      id: `rec-${Date.now()}`,
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      items: cart.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.total
      })),
      subtotal,
      discount: Number(calculatedDiscount.toFixed(2)),
      tax: vat,
      grandTotal: total,
      tenderedAmount: paymentMethod === 'CARD' ? total : numericTendered,
      changeDue: Number(changeDue.toFixed(2)),
      paymentMethod,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    onCompleteSale(receipt);
    setReceiptModal(receipt);
    triggerToast(`Sale ${saleNumber} completed`);
  };

  const handleStartNewSale = () => {
    setReceiptModal(null);
    setCart([]);
    setCashTendered('');
    setDiscountValue('');
    setItemWarning(null);
    const currentNum = parseInt(saleNumber.replace('#', '')) || 1;
    setSaleNumber(`#${String(currentNum + 1).padStart(4, '0')}`);
    searchInputRef.current?.focus();
  };

  // Filtered Products for left grid
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-[#F6F7F9]" dir="ltr">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Two-column Viewport Container (Left 60% / Right 40%) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* ========================================================
            LEFT COLUMN (60%): PRODUCT BROWSING & SCANNING
           ======================================================== */}
        <section className="flex-1 lg:w-[60%] flex flex-col min-w-0 border-r border-slate-200 bg-[#F6F7F9] overflow-hidden">
          
          {/* Top Search & Barcode Scan Bar */}
          <div className="p-4 bg-white border-b border-slate-200 flex flex-col gap-3 flex-shrink-0">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Barcode className="w-5 h-5 text-emerald-600" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Scan barcode or search products... (Press Enter or F2)"
                className="w-full pl-11 pr-24 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans text-sm bg-slate-50 focus:bg-white transition placeholder:text-slate-400 shadow-2xs h-12"
              />
              <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-slate-500 bg-slate-200 rounded border border-slate-300">
                  F2
                </kbd>
                <span className="text-xs text-slate-400">Scan</span>
              </div>
            </form>

            {/* Category Filter Chips (Horizontally Scrollable) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              {categories.map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition h-8 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Grid Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                <Search className="w-10 h-10 stroke-[1.5] mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No matching products</p>
                <p className="text-xs text-slate-400 mt-1">Try another category or scan a universal barcode</p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                {filteredProducts.map(product => {
                  const isOutOfStock = product.currentStock <= 0;
                  const isLowStock = product.currentStock <= product.reorderLevel && !isOutOfStock;
                  const theme = getCategoryTheme(product.categoryId);
                  const CategoryIcon = theme.icon;

                  return (
                    <button
                      key={product.id}
                      disabled={isOutOfStock}
                      onClick={() => addItemToCart(product)}
                      className={`group relative flex flex-col text-left p-2.5 rounded-xl border transition-all text-xs select-none ${
                        isOutOfStock 
                          ? 'bg-slate-100/70 border-slate-200 opacity-50 cursor-not-allowed'
                          : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-xs active:scale-[0.98]'
                      }`}
                    >
                      {/* Product Visual Area (~88px tall with distinct soft color & small lucide icon) */}
                      <div className={`w-full h-[88px] rounded-lg ${theme.bg} ${theme.border} border flex items-center justify-center mb-2 relative overflow-hidden transition group-hover:scale-[1.01]`}>
                        <div className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-xs flex items-center justify-center shadow-2xs">
                          <CategoryIcon className="w-5 h-5 stroke-[1.75]" />
                        </div>
                      </div>

                      {/* Product Name (2 lines max) */}
                      <div className="font-semibold text-slate-900 line-clamp-2 min-h-[32px] leading-tight mb-2 text-xs">
                        {product.name}
                      </div>

                      {/* Price & Stock status footer */}
                      <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900 tabular-nums">
                          ${product.sellingPrice.toFixed(2)}
                        </span>

                        {/* Stock indicator badge: show ONLY for Low and Out of stock */}
                        <div>
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Out
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Low: {product.currentStock}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Held sales bar if any */}
          {heldCarts.length > 0 && (
            <div className="p-3 bg-amber-50 border-t border-amber-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 text-xs text-amber-800 font-medium">
                <PauseCircle className="w-4 h-4 text-amber-600" />
                <span>{heldCarts.length} sale(s) on hold:</span>
                <div className="flex items-center gap-1.5">
                  {heldCarts.map(h => (
                    <button
                      key={h.id}
                      onClick={() => restoreHeldCart(h.id)}
                      className="px-2 py-0.5 rounded bg-white border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition flex items-center gap-1"
                    >
                      <PlayCircle className="w-3 h-3 text-amber-700" />
                      <span>{h.saleNumber} ({h.cart.length} items)</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </section>

        {/* ========================================================
            RIGHT COLUMN (40%): CART & CHECKOUT (PINNED RECEIPT)
           ======================================================== */}
        <aside className="w-full lg:w-[40%] flex flex-col bg-white overflow-hidden shadow-sm flex-shrink-0">
          
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs">
                {saleNumber}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">Current Sale</h2>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Walk-in Customer
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-sans">
                  <span>Cashier: </span>
                  <span className="font-semibold text-slate-700">{currentUser.name}</span>
                </div>
              </div>
            </div>

            {/* Hold & Clear Action Buttons (Visible outline buttons, 40px high, shortcut hints) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleHoldSale}
                disabled={cart.length === 0}
                className="px-3 h-10 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-700 active:bg-slate-100 text-xs font-semibold transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
                title="Hold Sale (F4)"
              >
                <PauseCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Hold</span>
                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-slate-500 bg-slate-100 rounded border border-slate-200">
                  F4
                </kbd>
              </button>

              <button
                type="button"
                onClick={handleClearCart}
                disabled={cart.length === 0}
                className="px-3 h-10 rounded-lg border border-slate-300 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-slate-700 active:bg-red-100 text-xs font-semibold transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-200"
                title="Clear Cart (F9)"
              >
                <RotateCcw className="w-4 h-4 text-slate-500 group-hover:text-red-600 flex-shrink-0" />
                <span>Clear</span>
                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-slate-500 bg-slate-100 rounded border border-slate-200">
                  F9
                </kbd>
              </button>
            </div>
          </div>

          {/* Inline Stock Warning Banner */}
          {itemWarning && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{itemWarning.text}</span>
              </div>
              <button onClick={() => setItemWarning(null)} className="text-amber-600 hover:text-amber-900">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Cart Line Items List (Scrollable) */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <ShoppingBag className="w-7 h-7 stroke-[1.5]" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Scan or tap a product to begin</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Items scanned with a barcode reader or clicked from the left catalog will appear here.
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {cart.map(item => (
                  <div 
                    key={item.product.id}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition flex items-center justify-between bg-white text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="font-semibold text-slate-900 truncate">{item.product.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-slate-600">{item.product.sku}</span>
                        <span>•</span>
                        <span className="tabular-nums">${item.unitPrice.toFixed(2)}</span>
                        <span>•</span>
                        <span className="text-slate-400">Stock: {item.product.currentStock}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Quantity Stepper (- 1 +) */}
                      <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-7 h-7 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold transition shadow-2xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-bold tabular-nums text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-7 h-7 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold transition shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="w-16 text-right font-bold text-slate-900 tabular-nums">
                        ${item.total.toFixed(2)}
                      </div>

                      {/* Remove item */}
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary & Checkout Block (Pinned to bottom) */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 flex-shrink-0">
            
            {/* Discount & Subtotal Rows (14px font size, clean spacing) */}
            <div className="space-y-2.5 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Subtotal ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
                <span className="tabular-nums font-semibold text-slate-900 text-sm">${subtotal.toFixed(2)}</span>
              </div>

              {/* Discount Row: Clearer % / $ segmented toggle and 40px high, min-96px wide input */}
              <div className="flex items-center justify-between gap-3 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-slate-700 font-medium">Discount</span>
                  {/* Clearer % / $ Segmented Toggle */}
                  <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 shadow-2xs h-10 items-center">
                    <button
                      type="button"
                      onClick={() => setDiscountType('PERCENT')}
                      className={`h-8.5 px-3 rounded-md text-xs font-bold transition flex items-center justify-center gap-1 ${
                        discountType === 'PERCENT'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Percentage Discount (%)"
                    >
                      <Percent className="w-3.5 h-3.5" />
                      <span>%</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('FIXED')}
                      className={`h-8.5 px-3 rounded-md text-xs font-bold transition flex items-center justify-center gap-1 ${
                        discountType === 'FIXED'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Fixed Amount Discount ($)"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>$</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step={discountType === 'PERCENT' ? '1' : '0.01'}
                      placeholder="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-24 min-w-[96px] h-10 px-3 rounded-lg border border-slate-300 text-right tabular-nums text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs transition"
                    />
                  </div>
                  {calculatedDiscount > 0 && (
                    <span className="font-semibold text-red-600 tabular-nums text-sm whitespace-nowrap">
                      -${calculatedDiscount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">VAT (5% Standard)</span>
                <span className="tabular-nums font-semibold text-slate-900 text-sm">${vat.toFixed(2)}</span>
              </div>
            </div>

            {/* Prominent Total Card (36-40px bold, emerald-tinted) */}
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  Total Payable
                </span>
                <span className="text-xs text-emerald-700">
                  {cart.length} line items
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tabular-nums tracking-tight">
                ${total.toFixed(2)}
              </div>
            </div>

            {/* Payment Segmented Control (Cash | Card) */}
            <div className="grid grid-cols-2 gap-2 bg-slate-200/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'CASH'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('CARD');
                  setCashTendered(total.toString());
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'CARD'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Card</span>
              </button>
            </div>

            {/* Cash Tender Details & Fast Money Buttons */}
            {paymentMethod === 'CASH' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none text-xs font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder="Amount Received..."
                      className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-slate-300 font-semibold tabular-nums text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
                    />
                  </div>

                  <div className="w-36 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-right">
                    <div className="text-xs text-slate-400 font-medium leading-none">Change Due:</div>
                    <div className={`text-sm font-bold tabular-nums leading-tight ${
                      !isCashSufficient ? 'text-red-600' : changeDue > 0 ? 'text-emerald-700' : 'text-slate-800'
                    }`}>
                      {!isCashSufficient ? `-$${(total - numericTendered).toFixed(2)}` : `$${changeDue.toFixed(2)}`}
                    </div>
                  </div>
                </div>

                {/* Quick denomination buttons (Exact, 5, 10, 20, 50, 100) */}
                <div className="grid grid-cols-6 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setCashTendered(total.toString())}
                    className="py-1.5 px-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-md font-bold text-slate-700 text-center"
                  >
                    Exact
                  </button>
                  {[5, 10, 20, 50, 100].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCashTendered(val.toString())}
                      className="py-1.5 px-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-md font-bold text-slate-700 tabular-nums text-center"
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Card Terminal Confirmation State */
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-xs text-blue-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>Awaiting payment terminal response...</span>
                </div>
                <span className="font-bold tabular-nums text-blue-900">${total.toFixed(2)}</span>
              </div>
            )}

            {/* Primary Action Button (56px tall, full width) */}
            <button
              onClick={handleCompleteSaleSubmit}
              disabled={!canCompleteSale}
              className="w-full h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Complete Sale</span>
              <kbd className="px-2 py-0.5 text-xs bg-emerald-800/80 rounded text-emerald-100 font-semibold">
                F12
              </kbd>
            </button>

          </div>

        </aside>

      </div>

      {/* ========================================================
          RECEIPT MODAL (Verified Sale Ticket with Print & New Sale)
         ======================================================== */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 font-sans text-xs">
            
            {/* Header info */}
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base mx-auto mb-2 shadow-xs">
                AY
              </div>
              <h3 className="font-bold text-base text-slate-900">AYBOS SUPERMARKET</h3>
              <p className="text-xs text-slate-500">Central Store Branch #01</p>
              <div className="mt-2 text-xs text-slate-700 font-mono font-bold">
                Receipt: {receiptModal.receiptNumber}
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                {receiptModal.timestamp} • Cashier: {receiptModal.cashierName}
              </div>
            </div>

            {/* Line items list */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 max-h-48 overflow-y-auto">
              {receiptModal.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-slate-800">
                  <span className="truncate pr-2">{item.productName} × {item.quantity}</span>
                  <span className="tabular-nums font-semibold">${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Financial summary */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="tabular-nums">${receiptModal.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (5%):</span>
                <span className="tabular-nums">${receiptModal.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
                <span>Total Paid:</span>
                <span className="tabular-nums text-emerald-700">${receiptModal.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span>Method: {receiptModal.paymentMethod}</span>
                <span className="tabular-nums">Tendered: ${receiptModal.tenderedAmount.toFixed(2)}</span>
              </div>
              {receiptModal.paymentMethod === 'CASH' && (
                <div className="flex justify-between text-xs font-semibold text-slate-800">
                  <span>Change Due:</span>
                  <span className="tabular-nums">${receiptModal.changeDue.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="text-center pt-3 text-xs text-slate-400">
              Thank you for shopping at AYBOS!
            </div>

            {/* Modal action buttons */}
            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                onClick={() => window.print()}
                className="py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              <button
                onClick={handleStartNewSale}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <span>New Sale</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Clear Cart Confirmation Modal */}
      <ConfirmModal
        isOpen={isClearConfirmOpen}
        title="Clear Current Sale?"
        message={`Are you sure you want to remove all ${cart.length} item${cart.length > 1 ? 's' : ''} from sale ${saleNumber}? This action will discard the current customer basket.`}
        confirmLabel="Clear Cart"
        cancelLabel="Keep Basket"
        isDestructive={true}
        onConfirm={executeClearCart}
        onCancel={() => setIsClearConfirmOpen(false)}
      />

    </div>
  );
};
