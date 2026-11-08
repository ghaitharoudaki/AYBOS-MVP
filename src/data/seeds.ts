import { 
  Category, 
  Product, 
  Supplier, 
  Sale, 
  PurchaseOrder, 
  StockMovement, 
  User 
} from '../types/aybos';

export const SEED_USERS: User[] = [
  { id: 'usr-1', username: 'admin', name: 'Dr. Tariq (Store Manager)', role: 'MANAGER', status: 'ACTIVE', lastLogin: '2026-11-08 09:15' },
  { id: 'usr-2', username: 'cashier1', name: 'Zaid Al-Ali (Cashier 1)', role: 'CASHIER', status: 'ACTIVE', lastLogin: '2026-11-08 08:30' },
  { id: 'usr-3', username: 'inven1', name: 'Sami Mansour (Stock Clerk)', role: 'INVENTORY', status: 'ACTIVE', lastLogin: '2026-11-08 07:55' },
  { id: 'usr-4', username: 'purch1', name: 'Layla Kareem (Purchasing)', role: 'PURCHASING', status: 'ACTIVE', lastLogin: '2026-11-07 16:40' },
  { id: 'usr-5', username: 'cashier2', name: 'Nour Kassem (Cashier 2)', role: 'CASHIER', status: 'ACTIVE', lastLogin: '2026-11-08 10:00' },
];

export const SEED_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Dairy & Eggs', description: 'Fresh milk, yogurts, cheeses, eggs and dairy spreads', itemCount: 7 },
  { id: 'cat-2', name: 'Bakery & Bread', description: 'Freshly baked artisan breads, toast, baguettes, buns', itemCount: 6 },
  { id: 'cat-3', name: 'Beverages & Juices', description: 'Spring waters, sodas, natural juices, tea, coffee', itemCount: 6 },
  { id: 'cat-4', name: 'Pantry Staples', description: 'Rice, pasta, grains, cooking oils, flour, spices', itemCount: 6 },
  { id: 'cat-5', name: 'Snacks & Sweets', description: 'Chips, biscuits, chocolates, wafers, crackers', itemCount: 5 },
  { id: 'cat-6', name: 'Fresh Produce', description: 'Fruits, vegetables, herbs, organic farm greens', itemCount: 5 },
  { id: 'cat-7', name: 'Household & Cleaning', description: 'Detergents, soaps, sanitizers, surface cleaners', itemCount: 5 },
];

export const SEED_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Al-Madina Food Supplies Ltd',
    contactPerson: 'Adel Al-Mansour',
    phone: '+963 11 445 8890',
    email: 'orders@almadina-supplies.sy',
    address: 'Industrial District Sector 4, Damascus',
    paymentTerms: 'Net 30 Days',
    status: 'ACTIVE'
  },
  {
    id: 'sup-2',
    name: 'Baraka Fresh Farms Dairy Co.',
    contactPerson: 'Hassan Barakat',
    phone: '+963 11 223 9901',
    email: 'delivery@baraka-farms.com',
    address: 'Agricultural Oasis Highway KM 12',
    paymentTerms: 'Net 15 Days',
    status: 'ACTIVE'
  },
  {
    id: 'sup-3',
    name: 'Sham Grains & Mills Trading',
    contactPerson: 'Rana Al-Khateeb',
    phone: '+963 11 881 3320',
    email: 'wholesale@sham-grains.net',
    address: 'Warehouse Hub 8, Central Logistics Park',
    paymentTerms: 'Net 45 Days',
    status: 'ACTIVE'
  },
  {
    id: 'sup-4',
    name: 'Orontes Beverage Bottlers',
    contactPerson: 'Omar Jabbour',
    phone: '+963 31 221 4400',
    email: 'distribution@orontes-drinks.sy',
    address: 'Spring Valley Road Sector B, Homs',
    paymentTerms: 'Cash on Delivery',
    status: 'ACTIVE'
  },
  {
    id: 'sup-5',
    name: 'Mediterranean Orchard Produce',
    contactPerson: 'Maya Haddad',
    phone: '+963 41 876 5521',
    email: 'fresh@med-orchards.sy',
    address: 'Coastal Agro Terminal, Latakia',
    paymentTerms: 'Net 15 Days',
    status: 'ACTIVE'
  },
  {
    id: 'sup-6',
    name: 'CleanCare Hygiene Chemical Corp',
    contactPerson: 'Fadi Sakkal',
    phone: '+963 21 665 9912',
    email: 'commercial@cleancare-corp.com',
    address: 'Chemical Free Zone Lot 19, Aleppo',
    paymentTerms: 'Net 30 Days',
    status: 'ACTIVE'
  }
];

export const SEED_PRODUCTS: Product[] = [
  // Category 1: Dairy & Eggs (7 items)
  {
    id: 'prod-1',
    sku: 'SKU-MILK-001',
    barcode: '628100123001',
    name: 'Almarai Full Cream Fresh Milk 1L',
    categoryId: 'cat-1',
    unit: 'PCS',
    costPrice: 4.20,
    sellingPrice: 5.50,
    reorderLevel: 25,
    currentStock: 42,
    status: 'ACTIVE'
  },
  {
    id: 'prod-2',
    sku: 'SKU-EGG-002',
    barcode: '628100123002',
    name: 'Farm Fresh Brown Eggs (Pack of 30)',
    categoryId: 'cat-1',
    unit: 'PACK',
    costPrice: 14.50,
    sellingPrice: 18.00,
    reorderLevel: 15,
    currentStock: 8, // Low stock warning!
    status: 'ACTIVE'
  },
  {
    id: 'prod-3',
    sku: 'SKU-YOG-003',
    barcode: '628100123003',
    name: 'Greek Natural Yogurt Tub 500g',
    categoryId: 'cat-1',
    unit: 'PCS',
    costPrice: 5.10,
    sellingPrice: 7.20,
    reorderLevel: 15,
    currentStock: 22,
    status: 'ACTIVE'
  },
  {
    id: 'prod-4',
    sku: 'SKU-CHZ-004',
    barcode: '628100123004',
    name: 'Traditional Halloumi Cheese 250g',
    categoryId: 'cat-1',
    unit: 'PCS',
    costPrice: 7.80,
    sellingPrice: 10.50,
    reorderLevel: 20,
    currentStock: 16, // Low stock warning!
    status: 'ACTIVE'
  },
  {
    id: 'prod-5',
    sku: 'SKU-BTR-005',
    barcode: '628100123005',
    name: 'Pure Salted Table Butter 200g',
    categoryId: 'cat-1',
    unit: 'PCS',
    costPrice: 4.50,
    sellingPrice: 6.25,
    reorderLevel: 15,
    currentStock: 28,
    status: 'ACTIVE'
  },
  {
    id: 'prod-6',
    sku: 'SKU-LBN-006',
    barcode: '628100123006',
    name: 'Creamy Labneh Spread 400g',
    categoryId: 'cat-1',
    unit: 'PCS',
    costPrice: 4.80,
    sellingPrice: 6.50,
    reorderLevel: 15,
    currentStock: 0, // Depleted!
    status: 'ACTIVE'
  },
  {
    id: 'prod-7',
    sku: 'SKU-CHED-007',
    barcode: '628100123007',
    name: 'Aged Red Cheddar Block 200g',
    categoryId: 'cat-1',
    unit: 'PCS',
    costPrice: 6.20,
    sellingPrice: 8.75,
    reorderLevel: 12,
    currentStock: 19,
    status: 'ACTIVE'
  },

  // Category 2: Bakery & Bread (6 items)
  {
    id: 'prod-8',
    sku: 'SKU-BRD-008',
    barcode: '628100123008',
    name: 'Artisan Whole Wheat Toast Bread 600g',
    categoryId: 'cat-2',
    unit: 'PCS',
    costPrice: 2.80,
    sellingPrice: 3.75,
    reorderLevel: 20,
    currentStock: 34,
    status: 'ACTIVE'
  },
  {
    id: 'prod-9',
    sku: 'SKU-BAG-009',
    barcode: '628100123009',
    name: 'Crispy French Baguette 300g',
    categoryId: 'cat-2',
    unit: 'PCS',
    costPrice: 1.20,
    sellingPrice: 1.80,
    reorderLevel: 25,
    currentStock: 40,
    status: 'ACTIVE'
  },
  {
    id: 'prod-10',
    sku: 'SKU-CRO-010',
    barcode: '628100123010',
    name: 'All-Butter Croissant 4-Pack',
    categoryId: 'cat-2',
    unit: 'PACK',
    costPrice: 5.50,
    sellingPrice: 7.50,
    reorderLevel: 10,
    currentStock: 12,
    status: 'ACTIVE'
  },
  {
    id: 'prod-11',
    sku: 'SKU-BUN-011',
    barcode: '628100123011',
    name: 'Sesame Brioche Burger Buns 6-Pack',
    categoryId: 'cat-2',
    unit: 'PACK',
    costPrice: 3.20,
    sellingPrice: 4.50,
    reorderLevel: 15,
    currentStock: 25,
    status: 'ACTIVE'
  },
  {
    id: 'prod-12',
    sku: 'SKU-PIT-012',
    barcode: '628100123012',
    name: 'White Lebanese Pita Flatbread 10s',
    categoryId: 'cat-2',
    unit: 'PACK',
    costPrice: 1.50,
    sellingPrice: 2.25,
    reorderLevel: 30,
    currentStock: 55,
    status: 'ACTIVE'
  },
  {
    id: 'prod-13',
    sku: 'SKU-MUF-013',
    barcode: '628100123013',
    name: 'Chocolate Chip Jumbo Muffins 2-Pack',
    categoryId: 'cat-2',
    unit: 'PACK',
    costPrice: 3.80,
    sellingPrice: 5.20,
    reorderLevel: 10,
    currentStock: 7, // Low stock warning!
    status: 'ACTIVE'
  },

  // Category 3: Beverages & Juices (6 items)
  {
    id: 'prod-14',
    sku: 'SKU-WTR-014',
    barcode: '628100123014',
    name: 'Pure Springs Mineral Water 1.5L x 6',
    categoryId: 'cat-3',
    unit: 'PACK',
    costPrice: 7.00,
    sellingPrice: 9.50,
    reorderLevel: 30,
    currentStock: 75,
    status: 'ACTIVE'
  },
  {
    id: 'prod-15',
    sku: 'SKU-ORJ-015',
    barcode: '628100123015',
    name: 'Freshly Squeezed Valencia Orange Juice 1L',
    categoryId: 'cat-3',
    unit: 'PCS',
    costPrice: 3.90,
    sellingPrice: 5.50,
    reorderLevel: 20,
    currentStock: 28,
    status: 'ACTIVE'
  },
  {
    id: 'prod-16',
    sku: 'SKU-COL-016',
    barcode: '628100123016',
    name: 'Classic Sparkle Cola Cans 330ml x 6',
    categoryId: 'cat-3',
    unit: 'PACK',
    costPrice: 4.80,
    sellingPrice: 6.75,
    reorderLevel: 25,
    currentStock: 48,
    status: 'ACTIVE'
  },
  {
    id: 'prod-17',
    sku: 'SKU-TEA-017',
    barcode: '628100123017',
    name: 'Ceylon Black Tea Finest Blend 100 Bags',
    categoryId: 'cat-3',
    unit: 'BOX',
    costPrice: 6.50,
    sellingPrice: 9.00,
    reorderLevel: 15,
    currentStock: 32,
    status: 'ACTIVE'
  },
  {
    id: 'prod-18',
    sku: 'SKU-COF-018',
    barcode: '628100123018',
    name: 'Roasted Arabica Whole Bean Coffee 500g',
    categoryId: 'cat-3',
    unit: 'PACK',
    costPrice: 12.00,
    sellingPrice: 16.50,
    reorderLevel: 10,
    currentStock: 14,
    status: 'ACTIVE'
  },
  {
    id: 'prod-19',
    sku: 'SKU-APJ-019',
    barcode: '628100123019',
    name: 'Pressed Crisp Green Apple Juice 1L',
    categoryId: 'cat-3',
    unit: 'PCS',
    costPrice: 3.50,
    sellingPrice: 4.90,
    reorderLevel: 15,
    currentStock: 21,
    status: 'ACTIVE'
  },

  // Category 4: Pantry Staples (6 items)
  {
    id: 'prod-20',
    sku: 'SKU-RIC-020',
    barcode: '628100123020',
    name: 'Royal Basmati Premium Rice 5kg',
    categoryId: 'cat-4',
    unit: 'PACK',
    costPrice: 32.00,
    sellingPrice: 42.00,
    reorderLevel: 10,
    currentStock: 4, // Critical low!
    status: 'ACTIVE'
  },
  {
    id: 'prod-21',
    sku: 'SKU-OIL-021',
    barcode: '628100123021',
    name: 'Golden Sunflower Cooking Oil 1.8L',
    categoryId: 'cat-4',
    unit: 'PCS',
    costPrice: 12.50,
    sellingPrice: 16.50,
    reorderLevel: 15,
    currentStock: 26,
    status: 'ACTIVE'
  },
  {
    id: 'prod-22',
    sku: 'SKU-OLV-022',
    barcode: '628100123022',
    name: 'Extra Virgin Cold Pressed Olive Oil 750ml',
    categoryId: 'cat-4',
    unit: 'PCS',
    costPrice: 16.00,
    sellingPrice: 22.50,
    reorderLevel: 12,
    currentStock: 18,
    status: 'ACTIVE'
  },
  {
    id: 'prod-23',
    sku: 'SKU-PAS-023',
    barcode: '628100123023',
    name: 'Italian Bronze-Cut Penne Rigate 500g',
    categoryId: 'cat-4',
    unit: 'PACK',
    costPrice: 2.10,
    sellingPrice: 3.20,
    reorderLevel: 25,
    currentStock: 60,
    status: 'ACTIVE'
  },
  {
    id: 'prod-24',
    sku: 'SKU-SUG-024',
    barcode: '628100123024',
    name: 'Fine White Granulated Sugar 2kg',
    categoryId: 'cat-4',
    unit: 'PACK',
    costPrice: 3.80,
    sellingPrice: 5.20,
    reorderLevel: 20,
    currentStock: 35,
    status: 'ACTIVE'
  },
  {
    id: 'prod-25',
    sku: 'SKU-FLR-025',
    barcode: '628100123025',
    name: 'All-Purpose Wheat Baking Flour 2kg',
    categoryId: 'cat-4',
    unit: 'PACK',
    costPrice: 3.20,
    sellingPrice: 4.60,
    reorderLevel: 20,
    currentStock: 44,
    status: 'ACTIVE'
  },

  // Category 5: Snacks & Sweets (5 items)
  {
    id: 'prod-26',
    sku: 'SKU-CHO-026',
    barcode: '628100123026',
    name: 'Belgian Dark Chocolate Bar 100g',
    categoryId: 'cat-5',
    unit: 'PCS',
    costPrice: 6.00,
    sellingPrice: 8.50,
    reorderLevel: 20,
    currentStock: 0, // Depleted!
    status: 'ACTIVE'
  },
  {
    id: 'prod-27',
    sku: 'SKU-CHP-027',
    barcode: '628100123027',
    name: 'Crispy Kettle Sea Salt Potato Chips 175g',
    categoryId: 'cat-5',
    unit: 'PACK',
    costPrice: 2.60,
    sellingPrice: 3.90,
    reorderLevel: 25,
    currentStock: 52,
    status: 'ACTIVE'
  },
  {
    id: 'prod-28',
    sku: 'SKU-WFR-028',
    barcode: '628100123028',
    name: 'Hazelnut Cream Filled Wafers 200g',
    categoryId: 'cat-5',
    unit: 'PACK',
    costPrice: 3.20,
    sellingPrice: 4.75,
    reorderLevel: 15,
    currentStock: 30,
    status: 'ACTIVE'
  },
  {
    id: 'prod-29',
    sku: 'SKU-NUT-029',
    barcode: '628100123029',
    name: 'Roasted & Salted Mixed Cashews 250g',
    categoryId: 'cat-5',
    unit: 'PACK',
    costPrice: 9.50,
    sellingPrice: 13.50,
    reorderLevel: 12,
    currentStock: 22,
    status: 'ACTIVE'
  },
  {
    id: 'prod-30',
    sku: 'SKU-BIS-030',
    barcode: '628100123030',
    name: 'Traditional Butter Digestive Biscuits 400g',
    categoryId: 'cat-5',
    unit: 'PACK',
    costPrice: 2.80,
    sellingPrice: 4.00,
    reorderLevel: 15,
    currentStock: 38,
    status: 'ACTIVE'
  },

  // Category 6: Fresh Produce (5 items)
  {
    id: 'prod-31',
    sku: 'SKU-APL-031',
    barcode: '628100123031',
    name: 'Crisp Red Gala Apples',
    categoryId: 'cat-6',
    unit: 'KG',
    costPrice: 3.50,
    sellingPrice: 4.90,
    reorderLevel: 20,
    currentStock: 45,
    status: 'ACTIVE'
  },
  {
    id: 'prod-32',
    sku: 'SKU-BAN-032',
    barcode: '628100123032',
    name: 'Cavendish Sweet Ripe Bananas',
    categoryId: 'cat-6',
    unit: 'KG',
    costPrice: 2.20,
    sellingPrice: 3.25,
    reorderLevel: 25,
    currentStock: 60,
    status: 'ACTIVE'
  },
  {
    id: 'prod-33',
    sku: 'SKU-TOM-033',
    barcode: '628100123033',
    name: 'Greenhouse Vine Ripe Red Tomatoes',
    categoryId: 'cat-6',
    unit: 'KG',
    costPrice: 2.40,
    sellingPrice: 3.60,
    reorderLevel: 20,
    currentStock: 38,
    status: 'ACTIVE'
  },
  {
    id: 'prod-34',
    sku: 'SKU-CUC-034',
    barcode: '628100123034',
    name: 'Crisp Farm Fresh Cucumbers',
    categoryId: 'cat-6',
    unit: 'KG',
    costPrice: 1.80,
    sellingPrice: 2.70,
    reorderLevel: 20,
    currentStock: 32,
    status: 'ACTIVE'
  },
  {
    id: 'prod-35',
    sku: 'SKU-POT-035',
    barcode: '628100123035',
    name: 'Organic Golden Baking Potatoes',
    categoryId: 'cat-6',
    unit: 'KG',
    costPrice: 1.60,
    sellingPrice: 2.40,
    reorderLevel: 30,
    currentStock: 70,
    status: 'ACTIVE'
  },

  // Category 7: Household & Cleaning (5 items)
  {
    id: 'prod-36',
    sku: 'SKU-DET-036',
    barcode: '628100123036',
    name: 'Active Enzyme Laundry Liquid Detergent 3L',
    categoryId: 'cat-7',
    unit: 'PCS',
    costPrice: 14.50,
    sellingPrice: 19.90,
    reorderLevel: 15,
    currentStock: 24,
    status: 'ACTIVE'
  },
  {
    id: 'prod-37',
    sku: 'SKU-DSH-037',
    barcode: '628100123037',
    name: 'Antibacterial Lemon Dishwashing Soap 1L',
    categoryId: 'cat-7',
    unit: 'PCS',
    costPrice: 3.20,
    sellingPrice: 4.80,
    reorderLevel: 20,
    currentStock: 42,
    status: 'ACTIVE'
  },
  {
    id: 'prod-38',
    sku: 'SKU-TIS-038',
    barcode: '628100123038',
    name: 'Ultra-Soft 3-Ply Facial Tissues 5-Pack',
    categoryId: 'cat-7',
    unit: 'PACK',
    costPrice: 5.00,
    sellingPrice: 7.20,
    reorderLevel: 15,
    currentStock: 28,
    status: 'ACTIVE'
  },
  {
    id: 'prod-39',
    sku: 'SKU-CLN-039',
    barcode: '628100123039',
    name: 'Multi-Surface Disinfectant Spray 750ml',
    categoryId: 'cat-7',
    unit: 'PCS',
    costPrice: 4.10,
    sellingPrice: 5.95,
    reorderLevel: 15,
    currentStock: 35,
    status: 'ACTIVE'
  },
  {
    id: 'prod-40',
    sku: 'SKU-TRH-040',
    barcode: '628100123040',
    name: 'Heavy-Duty Trash Bags 50L (Roll of 20)',
    categoryId: 'cat-7',
    unit: 'PACK',
    costPrice: 4.80,
    sellingPrice: 6.90,
    reorderLevel: 20,
    currentStock: 30,
    status: 'ACTIVE'
  }
];

export const SEED_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-101',
    poNumber: 'PO-2026-00101',
    supplierId: 'sup-2',
    supplierName: 'Baraka Fresh Farms Dairy Co.',
    status: 'SENT',
    createdAt: '2026-11-06 10:30',
    expectedDelivery: '2026-11-09',
    approvedBy: 'Dr. Tariq (Store Manager)',
    totalCost: 512.50,
    notes: 'Priority morning delivery for fresh milk and brown eggs.',
    items: [
      { productId: 'prod-1', productName: 'Almarai Full Cream Fresh Milk 1L', sku: 'SKU-MILK-001', orderedQty: 50, receivedQty: 0, unitCost: 4.20 },
      { productId: 'prod-2', productName: 'Farm Fresh Brown Eggs (Pack of 30)', sku: 'SKU-EGG-002', orderedQty: 20, receivedQty: 0, unitCost: 14.50 },
    ]
  },
  {
    id: 'po-102',
    poNumber: 'PO-2026-00102',
    supplierId: 'sup-3',
    supplierName: 'Sham Grains & Mills Trading',
    status: 'PARTIAL',
    createdAt: '2026-11-04 14:15',
    expectedDelivery: '2026-11-07',
    approvedBy: 'Dr. Tariq (Store Manager)',
    totalCost: 1280.00,
    notes: 'Scheduled monthly grains shipment.',
    items: [
      { productId: 'prod-20', productName: 'Royal Basmati Premium Rice 5kg', sku: 'SKU-RIC-020', orderedQty: 40, receivedQty: 25, unitCost: 32.00 }
    ]
  },
  {
    id: 'po-103',
    poNumber: 'PO-2026-00103',
    supplierId: 'sup-1',
    supplierName: 'Al-Madina Food Supplies Ltd',
    status: 'RECEIVED',
    createdAt: '2026-11-02 09:00',
    expectedDelivery: '2026-11-05',
    approvedBy: 'Dr. Tariq (Store Manager)',
    totalCost: 440.00,
    notes: 'Completed restocking of premium cooking oils.',
    items: [
      { productId: 'prod-21', productName: 'Golden Sunflower Cooking Oil 1.8L', sku: 'SKU-OIL-021', orderedQty: 20, receivedQty: 20, unitCost: 12.50 },
      { productId: 'prod-23', productName: 'Italian Bronze-Cut Penne Rigate 500g', sku: 'SKU-PAS-023', orderedQty: 50, receivedQty: 50, unitCost: 2.10 }
    ]
  }
];

export const SEED_SALES: Sale[] = [
  {
    id: 'sale-1',
    receiptNumber: 'REC-2026-00431',
    cashierId: 'usr-2',
    cashierName: 'Zaid Al-Ali',
    items: [
      { productId: 'prod-14', productName: 'Pure Springs Mineral Water 1.5L x 6', quantity: 2, unitPrice: 9.50, subtotal: 19.00 },
      { productId: 'prod-8', productName: 'Artisan Whole Wheat Toast Bread 600g', quantity: 1, unitPrice: 3.75, subtotal: 3.75 }
    ],
    subtotal: 22.75,
    discount: 0.00,
    tax: 1.14,
    grandTotal: 23.89,
    tenderedAmount: 30.00,
    changeDue: 6.11,
    paymentMethod: 'CASH',
    timestamp: '2026-11-07 08:35:12'
  },
  {
    id: 'sale-2',
    receiptNumber: 'REC-2026-00432',
    cashierId: 'usr-2',
    cashierName: 'Zaid Al-Ali',
    items: [
      { productId: 'prod-1', productName: 'Almarai Full Cream Fresh Milk 1L', quantity: 2, unitPrice: 5.50, subtotal: 11.00 },
      { productId: 'prod-2', productName: 'Farm Fresh Brown Eggs (Pack of 30)', quantity: 1, unitPrice: 18.00, subtotal: 18.00 }
    ],
    subtotal: 29.00,
    discount: 0.00,
    tax: 1.45,
    grandTotal: 30.45,
    tenderedAmount: 30.45,
    changeDue: 0.00,
    paymentMethod: 'CARD',
    timestamp: '2026-11-07 09:12:44'
  },
  {
    id: 'sale-3',
    receiptNumber: 'REC-2026-00433',
    cashierId: 'usr-5',
    cashierName: 'Nour Kassem',
    items: [
      { productId: 'prod-27', productName: 'Crispy Kettle Sea Salt Potato Chips 175g', quantity: 3, unitPrice: 3.90, subtotal: 11.70 },
      { productId: 'prod-16', productName: 'Classic Sparkle Cola Cans 330ml x 6', quantity: 1, unitPrice: 6.75, subtotal: 6.75 }
    ],
    subtotal: 18.45,
    discount: 0.00,
    tax: 0.92,
    grandTotal: 19.37,
    tenderedAmount: 20.00,
    changeDue: 0.63,
    paymentMethod: 'CASH',
    timestamp: '2026-11-07 10:04:19'
  },
  {
    id: 'sale-4',
    receiptNumber: 'REC-2026-00434',
    cashierId: 'usr-5',
    cashierName: 'Nour Kassem',
    items: [
      { productId: 'prod-36', productName: 'Active Enzyme Laundry Liquid Detergent 3L', quantity: 1, unitPrice: 19.90, subtotal: 19.90 },
      { productId: 'prod-37', productName: 'Antibacterial Lemon Dishwashing Soap 1L', quantity: 2, unitPrice: 4.80, subtotal: 9.60 }
    ],
    subtotal: 29.50,
    discount: 2.00,
    tax: 1.38,
    grandTotal: 28.88,
    tenderedAmount: 28.88,
    changeDue: 0.00,
    paymentMethod: 'CARD',
    timestamp: '2026-11-07 11:45:00'
  },
  {
    id: 'sale-5',
    receiptNumber: 'REC-2026-00435',
    cashierId: 'usr-2',
    cashierName: 'Zaid Al-Ali',
    items: [
      { productId: 'prod-31', productName: 'Crisp Red Gala Apples', quantity: 2, unitPrice: 4.90, subtotal: 9.80 },
      { productId: 'prod-32', productName: 'Cavendish Sweet Ripe Bananas', quantity: 3, unitPrice: 3.25, subtotal: 9.75 }
    ],
    subtotal: 19.55,
    discount: 0.00,
    tax: 0.98,
    grandTotal: 20.53,
    tenderedAmount: 50.00,
    changeDue: 29.47,
    paymentMethod: 'CASH',
    timestamp: '2026-11-07 13:20:15'
  },
  {
    id: 'sale-6',
    receiptNumber: 'REC-2026-00436',
    cashierId: 'usr-2',
    cashierName: 'Zaid Al-Ali',
    items: [
      { productId: 'prod-18', productName: 'Roasted Arabica Whole Bean Coffee 500g', quantity: 1, unitPrice: 16.50, subtotal: 16.50 },
      { productId: 'prod-10', productName: 'All-Butter Croissant 4-Pack', quantity: 1, unitPrice: 7.50, subtotal: 7.50 }
    ],
    subtotal: 24.00,
    discount: 0.00,
    tax: 1.20,
    grandTotal: 25.20,
    tenderedAmount: 25.20,
    changeDue: 0.00,
    paymentMethod: 'CARD',
    timestamp: '2026-11-07 15:10:32'
  },
  {
    id: 'sale-7',
    receiptNumber: 'REC-2026-00437',
    cashierId: 'usr-5',
    cashierName: 'Nour Kassem',
    items: [
      { productId: 'prod-22', productName: 'Extra Virgin Cold Pressed Olive Oil 750ml', quantity: 1, unitPrice: 22.50, subtotal: 22.50 },
      { productId: 'prod-23', productName: 'Italian Bronze-Cut Penne Rigate 500g', quantity: 3, unitPrice: 3.20, subtotal: 9.60 },
      { productId: 'prod-33', productName: 'Greenhouse Vine Ripe Red Tomatoes', quantity: 2, unitPrice: 3.60, subtotal: 7.20 }
    ],
    subtotal: 39.30,
    discount: 0.00,
    tax: 1.97,
    grandTotal: 41.27,
    tenderedAmount: 50.00,
    changeDue: 8.73,
    paymentMethod: 'CASH',
    timestamp: '2026-11-07 16:42:08'
  },
  {
    id: 'sale-8',
    receiptNumber: 'REC-2026-00438',
    cashierId: 'usr-5',
    cashierName: 'Nour Kassem',
    items: [
      { productId: 'prod-29', productName: 'Roasted & Salted Mixed Cashews 250g', quantity: 2, unitPrice: 13.50, subtotal: 27.00 },
      { productId: 'prod-15', productName: 'Freshly Squeezed Valencia Orange Juice 1L', quantity: 2, unitPrice: 5.50, subtotal: 11.00 }
    ],
    subtotal: 38.00,
    discount: 3.80,
    tax: 1.71,
    grandTotal: 35.91,
    tenderedAmount: 35.91,
    changeDue: 0.00,
    paymentMethod: 'CARD',
    timestamp: '2026-11-07 18:05:50'
  },
  {
    id: 'sale-9',
    receiptNumber: 'REC-2026-00439',
    cashierId: 'usr-2',
    cashierName: 'Zaid Al-Ali',
    items: [
      { productId: 'prod-40', productName: 'Heavy-Duty Trash Bags 50L (Roll of 20)', quantity: 2, unitPrice: 6.90, subtotal: 13.80 },
      { productId: 'prod-38', productName: 'Ultra-Soft 3-Ply Facial Tissues 5-Pack', quantity: 1, unitPrice: 7.20, subtotal: 7.20 }
    ],
    subtotal: 21.00,
    discount: 0.00,
    tax: 1.05,
    grandTotal: 22.05,
    tenderedAmount: 25.00,
    changeDue: 2.95,
    paymentMethod: 'CASH',
    timestamp: '2026-11-07 19:30:11'
  },
  {
    id: 'sale-10',
    receiptNumber: 'REC-2026-00440',
    cashierId: 'usr-2',
    cashierName: 'Zaid Al-Ali',
    items: [
      { productId: 'prod-1', productName: 'Almarai Full Cream Fresh Milk 1L', quantity: 3, unitPrice: 5.50, subtotal: 16.50 },
      { productId: 'prod-8', productName: 'Artisan Whole Wheat Toast Bread 600g', quantity: 1, unitPrice: 3.75, subtotal: 3.75 }
    ],
    subtotal: 20.25,
    discount: 0.00,
    tax: 1.01,
    grandTotal: 21.26,
    tenderedAmount: 21.26,
    changeDue: 0.00,
    paymentMethod: 'CARD',
    timestamp: '2026-11-08 08:15:30'
  },
  {
    id: 'sale-11',
    receiptNumber: 'REC-2026-00441',
    cashierId: 'usr-2',
    cashierName: 'Zaid Al-Ali',
    items: [
      { productId: 'prod-3', productName: 'Greek Natural Yogurt Tub 500g', quantity: 2, unitPrice: 7.20, subtotal: 14.40 },
      { productId: 'prod-5', productName: 'Pure Salted Table Butter 200g', quantity: 1, unitPrice: 6.25, subtotal: 6.25 }
    ],
    subtotal: 20.65,
    discount: 0.00,
    tax: 1.03,
    grandTotal: 21.68,
    tenderedAmount: 30.00,
    changeDue: 8.32,
    paymentMethod: 'CASH',
    timestamp: '2026-11-08 08:45:19'
  },
  {
    id: 'sale-12',
    receiptNumber: 'REC-2026-00442',
    cashierId: 'usr-5',
    cashierName: 'Nour Kassem',
    items: [
      { productId: 'prod-14', productName: 'Pure Springs Mineral Water 1.5L x 6', quantity: 4, unitPrice: 9.50, subtotal: 38.00 }
    ],
    subtotal: 38.00,
    discount: 0.00,
    tax: 1.90,
    grandTotal: 39.90,
    tenderedAmount: 40.00,
    changeDue: 0.10,
    paymentMethod: 'CASH',
    timestamp: '2026-11-08 09:10:02'
  },
  {
    id: 'sale-13',
    receiptNumber: 'REC-2026-00443',
    cashierId: 'usr-5',
    cashierName: 'Nour Kassem',
    items: [
      { productId: 'prod-21', productName: 'Golden Sunflower Cooking Oil 1.8L', quantity: 1, unitPrice: 16.50, subtotal: 16.50 },
      { productId: 'prod-24', productName: 'Fine White Granulated Sugar 2kg', quantity: 1, unitPrice: 5.20, subtotal: 5.20 },
      { productId: 'prod-25', productName: 'All-Purpose Wheat Baking Flour 2kg', quantity: 1, unitPrice: 4.60, subtotal: 4.60 }
    ],
    subtotal: 26.30,
    discount: 0.00,
    tax: 1.32,
    grandTotal: 27.62,
    tenderedAmount: 27.62,
    changeDue: 0.00,
    paymentMethod: 'CARD',
    timestamp: '2026-11-08 09:35:40'
  },
  {
    id: 'sale-14',
    receiptNumber: 'REC-2026-00444',
    cashierId: 'usr-2',
    cashierName: 'Zaid Al-Ali',
    items: [
      { productId: 'prod-17', productName: 'Ceylon Black Tea Finest Blend 100 Bags', quantity: 1, unitPrice: 9.00, subtotal: 9.00 },
      { productId: 'prod-30', productName: 'Traditional Butter Digestive Biscuits 400g', quantity: 2, unitPrice: 4.00, subtotal: 8.00 }
    ],
    subtotal: 17.00,
    discount: 0.00,
    tax: 0.85,
    grandTotal: 17.85,
    tenderedAmount: 20.00,
    changeDue: 2.15,
    paymentMethod: 'CASH',
    timestamp: '2026-11-08 09:55:12'
  },
  {
    id: 'sale-15',
    receiptNumber: 'REC-2026-00445',
    cashierId: 'usr-2',
    cashierName: 'Zaid Al-Ali',
    items: [
      { productId: 'prod-39', productName: 'Multi-Surface Disinfectant Spray 750ml', quantity: 1, unitPrice: 5.95, subtotal: 5.95 },
      { productId: 'prod-4', productName: 'Traditional Halloumi Cheese 250g', quantity: 1, unitPrice: 10.50, subtotal: 10.50 }
    ],
    subtotal: 16.45,
    discount: 0.00,
    tax: 0.82,
    grandTotal: 17.27,
    tenderedAmount: 17.27,
    changeDue: 0.00,
    paymentMethod: 'CARD',
    timestamp: '2026-11-08 10:08:55'
  }
];

export const SEED_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-1',
    productId: 'prod-20',
    productName: 'Royal Basmati Premium Rice 5kg',
    type: 'RECEIVED',
    qty: 25,
    balanceAfter: 29,
    reason: 'Received partial shipment from Sham Grains',
    userId: 'usr-3',
    timestamp: '2026-11-07 11:20:00',
    refId: 'PO-2026-00102'
  },
  {
    id: 'mov-2',
    productId: 'prod-26',
    productName: 'Belgian Dark Chocolate Bar 100g',
    type: 'EXPIRED',
    qty: -6,
    balanceAfter: 0,
    reason: 'Melted/expired batch written off with manager sign-off',
    userId: 'usr-3',
    timestamp: '2026-11-07 16:00:00',
    refId: 'EXP-AUDIT-2026'
  },
  {
    id: 'mov-3',
    productId: 'prod-6',
    productName: 'Creamy Labneh Spread 400g',
    type: 'DAMAGED',
    qty: -4,
    balanceAfter: 0,
    reason: 'Fallen crate breakage in cold room',
    userId: 'usr-3',
    timestamp: '2026-11-07 17:30:00',
    refId: 'DMG-COLD-01'
  },
  {
    id: 'mov-4',
    productId: 'prod-1',
    productName: 'Almarai Full Cream Fresh Milk 1L',
    type: 'SALE',
    qty: -3,
    balanceAfter: 42,
    reason: 'POS Register checkout',
    userId: 'usr-2',
    timestamp: '2026-11-08 08:15:30',
    refId: 'REC-2026-00440'
  },
  {
    id: 'mov-5',
    productId: 'prod-3',
    productName: 'Greek Natural Yogurt Tub 500g',
    type: 'SALE',
    qty: -2,
    balanceAfter: 22,
    reason: 'POS Register checkout',
    userId: 'usr-2',
    timestamp: '2026-11-08 08:45:19',
    refId: 'REC-2026-00441'
  }
];
