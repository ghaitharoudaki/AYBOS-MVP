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
  addSupplier: (supplierData: Omit<Supplier, 'id'>) => Promise<Supplier>;
  updateSupplier: (supplier: Supplier) => Promise<Supplier>;
  createPO: (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>) => Promise<PurchaseOrder>;
  approvePO: (poId: string) => Promise<void>;
  addUser: (userData: Omit<User, 'id'>) => Promise<User>;
  updateUser: (user: User) => Promise<User>;
  toggleUserStatus: (userId: string) => Promise<void>;
  switchUser: (user: User) => void;
  resetToSeeds: () => void;
  refreshData: () => Promise<void>;
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

  // Derived low stock counter for notifications
  const lowStockCount = products.filter(p => p.currentStock <= p.reorderLevel).length;

  // Complete a sale: atomically deducts stock and generates SALE movements
  const completeSale = async (receipt: Sale): Promise<Sale> => {
    const result = await saleService.processSale(receipt);
    
    // Update React states
    setSales(prev => [result.sale, ...prev]);
    setProducts(result.updatedProducts);
    setMovements(prev => [...result.movements, ...prev]);

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

    return newProd;
  };

  const updateProduct = async (product: Product): Promise<Product> => {
    const updated = await productService.update(product.id, product);
    setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
    return updated;
  };

  // Supplier management
  const addSupplier = async (supplierData: Omit<Supplier, 'id'>): Promise<Supplier> => {
    const newSup = await supplierService.create(supplierData);
    setSuppliers(prev => [newSup, ...prev]);
    return newSup;
  };

  const updateSupplier = async (supplier: Supplier): Promise<Supplier> => {
    const updated = await supplierService.update(supplier.id, supplier);
    setSuppliers(prev => prev.map(s => s.id === supplier.id ? updated : s));
    return updated;
  };

  // Purchase order creation and approval
  const createPO = async (
    poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>
  ): Promise<PurchaseOrder> => {
    const newPO = await purchaseOrderService.create(poData);
    setOrders(prev => [newPO, ...prev]);
    return newPO;
  };

  const approvePO = async (poId: string): Promise<void> => {
    const updated = await purchaseOrderService.updateStatus(
      poId, 
      'SENT', 
      `${currentUser.name} (${currentUser.role})`
    );
    setOrders(prev => prev.map(o => o.id === poId ? updated : o));
  };

  // User & RBAC management
  const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    const newUser = await authService.createUser(userData);
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = async (user: User): Promise<User> => {
    const updated = await authService.updateUser(user);
    setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
    if (currentUser.id === user.id) {
      setCurrentUser(updated);
    }
    return updated;
  };

  const toggleUserStatus = async (userId: string): Promise<void> => {
    const updated = await authService.toggleUserStatus(userId);
    setUsers(prev => prev.map(u => u.id === userId ? updated : u));
  };

  const switchUser = (user: User): void => {
    setCurrentUser(user);
    StorageRepository.setCurrentUserId(user.id);
  };

  const resetToSeeds = (): void => {
    StorageRepository.resetToSeeds();
    refreshData();
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
        addSupplier,
        updateSupplier,
        createPO,
        approvePO,
        addUser,
        updateUser,
        toggleUserStatus,
        switchUser,
        resetToSeeds,
        refreshData
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
