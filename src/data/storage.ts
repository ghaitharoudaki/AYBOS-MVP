import { 
  Category, 
  Product, 
  Supplier, 
  Sale, 
  PurchaseOrder, 
  StockMovement, 
  User 
} from '../types/aybos';
import { 
  SEED_CATEGORIES, 
  SEED_PRODUCTS, 
  SEED_SUPPLIERS, 
  SEED_PURCHASE_ORDERS, 
  SEED_SALES, 
  SEED_MOVEMENTS, 
  SEED_USERS 
} from './seeds';

const STORAGE_KEYS = {
  USERS: 'aybos_data_users',
  CATEGORIES: 'aybos_data_categories',
  PRODUCTS: 'aybos_data_products',
  SUPPLIERS: 'aybos_data_suppliers',
  ORDERS: 'aybos_data_orders',
  SALES: 'aybos_data_sales',
  MOVEMENTS: 'aybos_data_movements',
  CURRENT_USER_ID: 'aybos_data_current_user_id',
};

// Safe LocalStorage helpers with fallback to memory seeds
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[AYBOS Storage] Failed to load key ${key}, using seeds:`, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[AYBOS Storage] Failed to persist key ${key}:`, err);
  }
}

export const StorageRepository = {
  // Users
  getUsers: (): User[] => loadFromStorage(STORAGE_KEYS.USERS, SEED_USERS),
  setUsers: (users: User[]): void => saveToStorage(STORAGE_KEYS.USERS, users),

  // Current User Session
  getCurrentUserId: (): string => loadFromStorage(STORAGE_KEYS.CURRENT_USER_ID, SEED_USERS[0].id),
  setCurrentUserId: (id: string): void => saveToStorage(STORAGE_KEYS.CURRENT_USER_ID, id),

  // Categories
  getCategories: (): Category[] => loadFromStorage(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES),
  setCategories: (categories: Category[]): void => saveToStorage(STORAGE_KEYS.CATEGORIES, categories),

  // Products
  getProducts: (): Product[] => loadFromStorage(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS),
  setProducts: (products: Product[]): void => saveToStorage(STORAGE_KEYS.PRODUCTS, products),

  // Suppliers
  getSuppliers: (): Supplier[] => loadFromStorage(STORAGE_KEYS.SUPPLIERS, SEED_SUPPLIERS),
  setSuppliers: (suppliers: Supplier[]): void => saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers),

  // Purchase Orders
  getOrders: (): PurchaseOrder[] => loadFromStorage(STORAGE_KEYS.ORDERS, SEED_PURCHASE_ORDERS),
  setOrders: (orders: PurchaseOrder[]): void => saveToStorage(STORAGE_KEYS.ORDERS, orders),

  // Sales
  getSales: (): Sale[] => loadFromStorage(STORAGE_KEYS.SALES, SEED_SALES),
  setSales: (sales: Sale[]): void => saveToStorage(STORAGE_KEYS.SALES, sales),

  // Stock Movements
  getMovements: (): StockMovement[] => loadFromStorage(STORAGE_KEYS.MOVEMENTS, SEED_MOVEMENTS),
  setMovements: (movements: StockMovement[]): void => saveToStorage(STORAGE_KEYS.MOVEMENTS, movements),

  // Reset entire database to initial seeds
  resetToSeeds: (): void => {
    saveToStorage(STORAGE_KEYS.USERS, SEED_USERS);
    saveToStorage(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
    saveToStorage(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
    saveToStorage(STORAGE_KEYS.SUPPLIERS, SEED_SUPPLIERS);
    saveToStorage(STORAGE_KEYS.ORDERS, SEED_PURCHASE_ORDERS);
    saveToStorage(STORAGE_KEYS.SALES, SEED_SALES);
    saveToStorage(STORAGE_KEYS.MOVEMENTS, SEED_MOVEMENTS);
    saveToStorage(STORAGE_KEYS.CURRENT_USER_ID, SEED_USERS[0].id);
  }
};
