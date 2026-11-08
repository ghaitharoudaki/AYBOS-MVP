# Implementation Plan: AYBOS Typed Data Layer & Central Reactive Store

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and persistence decisions were confirmed via Phase 1 clarification:
> - **Central State Management**: **React Context API** (`StoreContext` / `useStore`) to provide a clean, zero-external-dependency reactive state layer.
> - **Data Persistence**: **localStorage** with automatic initialization and fallback to pre-populated realistic seeds, allowing changes to persist across page reloads with an instant "Reset to Demo Data" option.
> - **Zero UI Regression**: All existing layouts, colors, tables, modals, and the POS interface remain identical in visual design and behavior while switching to clean async service and hook calls.

---

## 1. Overview & Core Concept

This refactoring replaces direct in-component mock state mutations with a formal, production-grade enterprise data architecture. The application UI will be completely decoupled from storage specifics, preparing AYBOS for future backend REST API integration without changing any visual styling or user workflows.

### Key Value
- **Clean Separation of Concerns**: Views interact strictly through asynchronous service abstractions and a reactive central store.
- **Automated Ledger Integrity**: Any sale checkout, purchase order receipt, or inventory write-off automatically emits immutable `StockMovement` records and maintains consistent on-hand product stock.
- **Realistic Demonstration Volume**: Seeded with 40 diverse supermarket products across 7 realistic categories, 6 suppliers, 15 historical sales transactions, and 3 purchase orders in different lifecycle stages.

---

## 2. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AYBOS UI PRESENTATION LAYER                     │
│  [POS Terminal] [Product Catalog] [Inventory Ledger] [Suppliers]      │
│  [Purchase Orders] [Dashboard & Reports] [Users & Roles]              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ consumes via useStore()
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   CENTRAL STORE (React Context API)                    │
│   - products, categories, suppliers, orders, movements, sales, users   │
│   - Automated stock calculation & movement record dispatching         │
│   - Synchronization to localStorage with seed initialization           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ calls async services
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     ASYNC SERVICE LAYER (/src/services)                 │
│  - productService.ts          - saleService.ts                         │
│  - inventoryService.ts        - supplierService.ts                     │
│  - purchaseOrderService.ts    - reportService.ts                       │
│  - authService.ts                                                      │
│  (Simulates async Promises with 50-150ms latency, ready for REST APIs) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ reads/writes
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              PERSISTENCE & SEED REPOSITORY (/src/data)                 │
│  - storage.ts (localStorage get/set with error handling)               │
│  - seeds.ts (40 Products, 7 Categories, 6 Suppliers, 15 Sales, 3 POs)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model & Type Definitions (`/src/types`)

We will define precise TypeScript contracts conforming strictly to the requested schemas:

1. **`Role` & `User`**:
   - `Role`: `'MANAGER' | 'CASHIER' | 'INVENTORY' | 'PURCHASING'`
   - `User`: `{ id, username, name, role, status: 'ACTIVE' | 'INACTIVE', lastLogin? }`

2. **`Product` & `Category`**:
   - `Category`: `{ id, name, description, itemCount }`
   - `Product`: `{ id, sku, barcode, name, categoryId, unit: 'PCS' | 'KG' | 'PACK' | 'BOX', costPrice, sellingPrice, reorderLevel, currentStock, status: 'ACTIVE' | 'DISCONTINUED' }`

3. **`StockMovement`**:
   - `MovementType`: `'SALE' | 'RECEIVED' | 'DAMAGED' | 'EXPIRED' | 'ADJUSTMENT'`
   - `StockMovement`: `{ id, productId, productName, type: MovementType, qty: number, balanceAfter: number, reason?: string, userId: string, timestamp: string, refId: string }`

4. **`Sale` & `SaleItem`**:
   - `SaleItem`: `{ productId, productName, quantity, unitPrice, subtotal }`
   - `Sale`: `{ id, receiptNumber, cashierId, cashierName, items: SaleItem[], subtotal, discount, tax, grandTotal, tenderedAmount, changeDue, paymentMethod: 'CASH' | 'CARD', timestamp }`

5. **`Supplier`**:
   - `Supplier`: `{ id, name, contactPerson, phone, email, address, paymentTerms, status: 'ACTIVE' | 'INACTIVE' }`

6. **`PurchaseOrder` & `PurchaseOrderItem`**:
   - `POStatus`: `'DRAFT' | 'SENT' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'`
   - `PurchaseOrderItem`: `{ productId, productName, sku, orderedQty, receivedQty, unitCost }`
   - `PurchaseOrder`: `{ id, poNumber, supplierId, supplierName, status: POStatus, items: PurchaseOrderItem[], totalCost, createdAt, expectedDelivery, approvedBy?, notes? }`

---

## 4. Asynchronous Service Layer (`/src/services`)

Each service will expose modular async functions returning Promises with realistic mini-delays (e.g. 60–120ms):

- **`productService`**: `getAll()`, `getById(id)`, `create(data)`, `update(id, data)`, `delete(id)`
- **`saleService`**: `getAll()`, `getById(id)`, `create(data)`, `getDailySales(date)`
- **`inventoryService`**: `getStockLevels()`, `getMovements(productId?)`, `adjustStock(productId, qty, type, reason, userId, refId)`
- **`supplierService`**: `getAll()`, `getById(id)`, `create(data)`, `update(id, data)`
- **`purchaseOrderService`**: `getAll()`, `getById(id)`, `create(data)`, `updateStatus(id, status)`, `receiveItems(id, receivedItems, userId)`
- **`reportService`**: `getDailySummary(date)`, `getLowStockAlerts()`, `getInventoryValuation()`
- **`authService`**: `getCurrentUser()`, `getAllUsers()`, `createUser(data)`, `switchUser(id)`, `toggleStatus(id)`

---

## 5. Central Store & Automatic Inventory Tracking (`/src/context/StoreContext.tsx`)

The React Context store will manage the entire in-memory application state and serialize to `localStorage`:
- **When a Sale is completed**:
  - Decrements each purchased product's `currentStock`.
  - Automatically appends a `StockMovement` with `type: 'SALE'`, negative `qty`, and `refId = sale.receiptNumber`.
- **When a Purchase Order is Received / Partially Received**:
  - Increments each arrived product's `currentStock`.
  - Automatically appends a `StockMovement` with `type: 'RECEIVED'`, positive `qty`, and `refId = po.poNumber`.
- **When Damage or Expiration is logged**:
  - Decrements the product's `currentStock`.
  - Automatically appends a `StockMovement` with `type: 'DAMAGED'` or `type: 'EXPIRED'`.

---

## 6. Seed Dataset Specification (`/src/data/seeds.ts`)

- **7 Categories**: Fresh Dairy & Eggs, Bakery & Baked Goods, Beverages & Juices, Pantry Staples, Snacks & Confectionery, Fresh Produce, Household & Cleaning.
- **40 Realistic Supermarket Products**: Complete with barcodes (EAN-13), SKUs, unit costs, selling prices, reorder thresholds, and active stock levels (including 3 low-stock items and 2 out-of-stock items for alerts).
- **6 Realistic Regional Suppliers**: Complete with address, phone, email, and payment terms (Net 15, Net 30, COD).
- **15 Historical Sales**: Covering varying times of day, item combinations, payment methods, and cash tender amounts.
- **3 Purchase Orders**: One `SENT` (awaiting dock delivery), one `PARTIAL` (partially received), and one `RECEIVED` (fully inwarded).
- **5 Staff Accounts**: Covering MANAGER, CASHIER 1, CASHIER 2, INVENTORY, and PURCHASING roles.

---

## 7. Migration Steps for Existing Components
- [x] **1. Domain Type Layer**: Updated `types/aybos.ts` and `types/index.ts` with all requested standard types and backward-compatible aliases.
- [x] **2. Realistic Seed Dataset**: Built `/src/data/seeds.ts` with 40 products across 7 categories, 6 suppliers, 15 historical sales, and 3 purchase orders.
- [x] **3. LocalStorage Persistence**: Built `/src/data/storage.ts` with safe storage reading, saving, and reset-to-seed capability.
- [x] **4. Asynchronous Domain Services**: Built `/src/services/*` implementing all 7 services (`productService`, `saleService`, `inventoryService`, `supplierService`, `purchaseOrderService`, `reportService`, `authService`) returning Promises with simulated delay.
- [x] **5. Central Reactive Store**: Built `/src/context/StoreContext.tsx` providing `StoreProvider` and `useStore()` hook with automated inventory balance updates and immutable `StockMovement` logging.
- [x] **6. Component Integration**: Bound `App.tsx` and all 7 modules to consume the store without modifying any UI layout or visual styling.
- [x] **7. Verification**: Executed `compile_applet` and `lint_applet` (`$ tsc --noEmit`), passing cleanly with zero errors.

