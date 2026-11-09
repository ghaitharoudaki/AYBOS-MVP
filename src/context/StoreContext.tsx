import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Product, 
  Category, 
  Supplier, 
  PurchaseOrder, 
  Sale, 
  StockMovement, 
  User, 
  MovementType, 
  POStatus 
} from '../types/aybos';
import { StorageRepository } from '../data/storage';
import { 
  productService, 
  saleService, 
  inventoryService, 
  supplierService, 
  purchaseOrderService, 
  authService 
} from '../services';

interface StoreContextType {
  // State
  loading: boolean;
  currentUser: User;
  users: User[];
  categories: Category[];
  products: Product[];
  suppliers: Supplier[];
  orders: PurchaseOrder[];
  sales: Sale[];
  movements: StockMovement[];
  lowStockCount: number;

  // Actions
  completeSale: (saleData: Sale) => Promise<Sale>;
  receivePO: (poId: string, receivedList: { productId: string; receivedQty: number }[]) => Promise<void>;
  adjustStock: (productId: string, delta: number, type: MovementType, notes: string) => Promise<void>;
  addProduct: (productData: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (product: Product) => Promise<Product>;
  deleteProduct: (id: string) => Promise<boolean>;
  addSupplier: (supplierData: Omit<Supplier, 'id'>) => Promise<Supplier>;
  updateSupplier: (supplier: Supplier) => Promise<Supplier>;
  deleteSupplier: (id: string) => Promise<boolean>;
  createPO: (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>) => Promise<PurchaseOrder>;
  approvePO: (poId: string) => Promise<void>;
  addUser: (userData: Omit<User, 'id'>) => Promise<User>;
  updateUser: (user: User) => Promise<User>;
  toggleUserStatus: (userId: string) => Promise<void>;
  switchUser: (user: User) => void;
  resetToSeeds: () => void;
  refreshData: () => Promise<void>;

  // Global Toasts
  toasts: { id: string; message: string; type: 'success' | 'info' | 'warning' | 'error' }[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  dismissToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<User[]>(() => StorageRepository.getUsers());
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const all = StorageRepository.getUsers();
    const currId = StorageRepository.getCurrentUserId();
    return all.find(u => u.id === currId) || all[0];
  });
  const [categories, setCategories] = useState<Category[]>(() => StorageRepository.getCategories());
  const [products, setProducts] = useState<Product[]>(() => StorageRepository.getProducts());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => StorageRepository.getSuppliers());
  const [orders, setOrders] = useState<PurchaseOrder[]>(() => StorageRepository.getOrders());
  const [sales, setSales] = useState<Sale[]>(() => StorageRepository.getSales());
  const [movements, setMovements] = useState<StockMovement[]>(() => StorageRepository.getMovements());

  // Reload state from repository
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [u, curr, cats, prods, sups, ords, sls, movs] = await Promise.all([
        authService.getAllUsers(),
        authService.getCurrentUser(),
        productService.getCategories(),
        productService.getAll(),
        supplierService.getAll(),
        purchaseOrderService.getAll(),
        saleService.getAll(),
        inventoryService.getMovements()
      ]);
      setUsers(u);
      setCurrentUser(curr);
      setCategories(cats);
      setProducts(prods);
      setSuppliers(sups);
      setOrders(ords);
      setSales(sls);
      setMovements(movs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Global Toasts State
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'warning' | 'error' }[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts(prev => [...prev.slice(-3), { id, message, type }]); // Keep last 4 max
    setTimeout(() => {
      dismissToast(id);
    }, 3800);
  }, [dismissToast]);

  // Derived low stock counter for notifications
  const lowStockCount = products.filter(p => p.currentStock <= p.reorderLevel).length;

  // Complete a sale: atomically deducts stock and generates SALE movements
  const completeSale = async (receipt: Sale): Promise<Sale> => {
    const result = await saleService.processSale(receipt);
    
    // Update React states
    setSales(prev => [result.sale, ...prev]);
    setProducts(result.updatedProducts);
    setMovements(prev => [...result.movements, ...prev]);

    const num = result.sale.receiptNumber || result.sale.saleNumber || receipt.receiptNumber || receipt.saleNumber || '#0001';
    showToast(`Sale ${num} completed successfully (${result.sale.paymentMethod || 'CASH'}).`, 'success');
    return result.sale;
  };

  // Inward goods from a purchase order: increments stock and generates RECEIVED movements
  const receivePO = async (
    poId: string, 
    receivedList: { productId: string; receivedQty: number }[]
  ): Promise<void> => {
    const result = await purchaseOrderService.receiveItems(poId, receivedList, currentUser.id);

    setOrders(prev => prev.map(o => o.id === poId ? result.order : o));
    setProducts(result.updatedProducts);
    setMovements(prev => [...result.movements, ...prev]);

    showToast(`Goods received for ${result.order.poNumber}. Inventory balances updated.`, 'success');
  };

  // Adjust stock for loss, damage, expiry, or manual audit corrections
  const adjustStock = async (
    productId: string, 
    delta: number, 
    type: MovementType, 
    notes: string
  ): Promise<void> => {
    const result = await inventoryService.adjustStock({
      productId,
      qty: delta,
      type,
      reason: notes,
      userId: currentUser.id
    });

    setProducts(prev => prev.map(p => p.id === productId ? result.updatedProduct : p));
    setMovements(prev => [result.movement, ...prev]);

    showToast(`Stock movement recorded (${type}: ${delta > 0 ? `+${delta}` : delta} units).`, 'success');
  };

  // Product catalog management
  const addProduct = async (prodData: Omit<Product, 'id'>): Promise<Product> => {
    const newProd = await productService.create(prodData);
    setProducts(prev => [newProd, ...prev]);

    // If initial stock exists, log an adjustment movement
    if (newProd.currentStock > 0) {
      const { movement } = await inventoryService.adjustStock({
        productId: newProd.id,
        qty: newProd.currentStock,
        type: 'ADJUSTMENT',
        reason: 'Initial inventory on-hand setup',
        userId: currentUser.id,
        refId: 'INITIAL-CATALOG'
      });
      setMovements(prev => [movement, ...prev]);
    }

    showToast(`Product "${newProd.name}" added to catalog.`, 'success');
    return newProd;
  };

  const updateProduct = async (product: Product): Promise<Product> => {
    const updated = await productService.update(product.id, product);
    setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
    showToast(`Product "${updated.name}" updated successfully.`, 'success');
    return updated;
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    const target = products.find(p => p.id === id);
    const success = await productService.delete(id);
    if (success) {
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast(`Product "${target?.name || id}" removed from catalog.`, 'success');
    }
    return success;
  };

  // Supplier management
  const addSupplier = async (supplierData: Omit<Supplier, 'id'>): Promise<Supplier> => {
    const newSup = await supplierService.create(supplierData);
    setSuppliers(prev => [newSup, ...prev]);
    showToast(`Supplier "${newSup.name}" registered.`, 'success');
    return newSup;
  };

  const updateSupplier = async (supplier: Supplier): Promise<Supplier> => {
    const updated = await supplierService.update(supplier.id, supplier);
    setSuppliers(prev => prev.map(s => s.id === supplier.id ? updated : s));
    showToast(`Supplier "${updated.name}" updated.`, 'success');
    return updated;
  };

  const deleteSupplier = async (id: string): Promise<boolean> => {
    const target = suppliers.find(s => s.id === id);
    const success = await supplierService.delete(id);
    if (success) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
      showToast(`Supplier "${target?.name || id}" deleted.`, 'success');
    }
    return success;
  };

  // Purchase order creation and approval
  const createPO = async (
    poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>
  ): Promise<PurchaseOrder> => {
    const newPO = await purchaseOrderService.create(poData);
    setOrders(prev => [newPO, ...prev]);
    showToast(`Purchase order ${newPO.poNumber} created as Draft.`, 'success');
    return newPO;
  };

  const approvePO = async (poId: string): Promise<void> => {
    const updated = await purchaseOrderService.updateStatus(
      poId, 
      'SENT', 
      `${currentUser.name} (${currentUser.role})`
    );
    setOrders(prev => prev.map(o => o.id === poId ? updated : o));
    showToast(`Purchase order ${updated.poNumber} approved & dispatched to supplier.`, 'success');
  };

  // User & RBAC management
  const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    const newUser = await authService.createUser(userData);
    setUsers(prev => [...prev, newUser]);
    showToast(`Staff account for "${newUser.name}" created.`, 'success');
    return newUser;
  };

  const updateUser = async (user: User): Promise<User> => {
    const updated = await authService.updateUser(user);
    setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
    if (currentUser.id === user.id) {
      setCurrentUser(updated);
    }
    showToast(`Staff account "${updated.name}" updated.`, 'success');
    return updated;
  };

  const toggleUserStatus = async (userId: string): Promise<void> => {
    const target = users.find(u => u.id === userId);
    const updated = await authService.toggleUserStatus(userId);
    setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    showToast(`Account status for "${target?.name || userId}" changed to ${updated.status}.`, 'info');
  };

  const switchUser = (user: User): void => {
    setCurrentUser(user);
    StorageRepository.setCurrentUserId(user.id);
    showToast(`Switched active user session to ${user.name} (${user.role}).`, 'info');
  };

  const resetToSeeds = (): void => {
    StorageRepository.resetToSeeds();
    refreshData();
    showToast('All data restored to realistic store seeds.', 'info');
  };

  return (
    <StoreContext.Provider
      value={{
        loading,
        currentUser,
        users,
        categories,
        products,
        suppliers,
        orders,
        sales,
        movements,
        lowStockCount,
        completeSale,
        receivePO,
        adjustStock,
        addProduct,
        updateProduct,
        deleteProduct,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        createPO,
        approvePO,
        addUser,
        updateUser,
        toggleUserStatus,
        switchUser,
        resetToSeeds,
        refreshData,
        toasts,
        showToast,
        dismissToast
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
