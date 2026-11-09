// AYBOS Central Typed Data Layer Specifications

export type Role = 'MANAGER' | 'CASHIER' | 'INVENTORY' | 'PURCHASING';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  itemCount: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  categoryId: string;
  unit: 'PCS' | 'KG' | 'PACK' | 'BOX';
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  currentStock: number;
  status: 'ACTIVE' | 'DISCONTINUED';
}

export type MovementType = 'SALE' | 'RECEIVED' | 'DAMAGED' | 'EXPIRED' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  qty: number;
  balanceAfter: number;
  reason?: string;
  userId: string;
  timestamp: string;
  refId: string;
  // Aliases for compatibility
  movementType?: MovementType | string;
  quantityDelta?: number;
  referenceId?: string;
  notes?: string;
  performedBy?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  cashierId: string;
  cashierName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  tenderedAmount: number;
  changeDue: number;
  paymentMethod: 'CASH' | 'CARD';
  timestamp: string;
  saleNumber?: string;
}

// Aliases for compatibility
export type SalesReceipt = Sale;
export type CartItem = {
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
};

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export type POStatus = 'DRAFT' | 'SENT' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED' | 'PENDING_APPROVAL' | 'ISSUED' | 'PARTIALLY_RECEIVED' | 'COMPLETED';

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
  status?: POStatus;
}

// Alias for compatibility
export type POItem = PurchaseOrderItem;

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: POStatus;
  items: PurchaseOrderItem[];
  totalCost: number;
  createdAt: string;
  expectedDelivery: string;
  approvedBy?: string;
  notes?: string;
}

