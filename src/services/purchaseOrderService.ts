import { PurchaseOrder, POStatus, StockMovement, Product } from '../types/aybos';
import { StorageRepository } from '../data/storage';
import { delay } from './delay';

export const purchaseOrderService = {
  async getAll(): Promise<PurchaseOrder[]> {
    await delay(70);
    return StorageRepository.getOrders();
  },

  async getById(id: string): Promise<PurchaseOrder | null> {
    await delay(50);
    const orders = StorageRepository.getOrders();
    return orders.find(o => o.id === id) || null;
  },

  async create(data: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>): Promise<PurchaseOrder> {
    await delay(90);
    const orders = StorageRepository.getOrders();
    const newPO: PurchaseOrder = {
      ...data,
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    StorageRepository.setOrders([newPO, ...orders]);
    return newPO;
  },

  async updateStatus(id: string, status: POStatus, approvedBy?: string): Promise<PurchaseOrder> {
    await delay(75);
    const orders = StorageRepository.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) {
      throw new Error(`Purchase Order with ID "${id}" not found.`);
    }

    const updated: PurchaseOrder = {
      ...orders[index],
      status,
      ...(approvedBy ? { approvedBy } : {})
    };

    orders[index] = updated;
    StorageRepository.setOrders(orders);
    return updated;
  },

  /**
   * Receives goods for a Purchase Order:
   * 1. Increments product on-hand inventory balances.
   * 2. Automatically logs an immutable StockMovement for each received item.
   * 3. Updates received quantities on line items.
   * 4. Updates PO status to PARTIAL or RECEIVED.
   */
  async receiveItems(
    id: string,
    receivedList: { productId: string; receivedQty: number }[],
    userId: string
  ): Promise<{ order: PurchaseOrder; movements: StockMovement[]; updatedProducts: Product[] }> {
    await delay(110);
    const orders = StorageRepository.getOrders();
    const products = StorageRepository.getProducts();
    const movements = StorageRepository.getMovements();

    const poIndex = orders.findIndex(o => o.id === id);
    if (poIndex === -1) {
      throw new Error(`Purchase order "${id}" not found.`);
    }

    const order = orders[poIndex];
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newMovements: StockMovement[] = [];

    // Increment stocks
    const updatedProducts = products.map(prod => {
      const match = receivedList.find(r => r.productId === prod.id && r.receivedQty > 0);
      if (match) {
        const newStock = prod.currentStock + match.receivedQty;
        const mov: StockMovement = {
          id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: prod.id,
          productName: prod.name,
          type: 'RECEIVED',
          qty: match.receivedQty,
          balanceAfter: newStock,
          reason: `Goods receipt for Purchase Order ${order.poNumber}`,
          userId,
          timestamp,
          refId: order.poNumber,
          // Legacy aliases
          movementType: 'RECEIVED',
          quantityDelta: match.receivedQty,
          referenceId: `GRN-${order.poNumber}`,
          notes: 'Dock receiving confirmation'
        };
        newMovements.push(mov);
        return { ...prod, currentStock: newStock };
      }
      return prod;
    });

    // Update PO items
    const updatedItems = order.items.map(item => {
      const rcv = receivedList.find(r => r.productId === item.productId);
      const added = rcv?.receivedQty || 0;
      return {
        ...item,
        receivedQty: item.receivedQty + added
      };
    });

    const isFullyReceived = updatedItems.every(i => i.receivedQty >= i.orderedQty);
    const hasAnyReceived = updatedItems.some(i => i.receivedQty > 0);
    const nextStatus: POStatus = isFullyReceived ? 'RECEIVED' : hasAnyReceived ? 'PARTIAL' : order.status;

    const updatedOrder: PurchaseOrder = {
      ...order,
      items: updatedItems,
      status: nextStatus
    };

    orders[poIndex] = updatedOrder;

    // Persist all
    StorageRepository.setOrders(orders);
    StorageRepository.setProducts(updatedProducts);
    StorageRepository.setMovements([...newMovements, ...movements]);

    return {
      order: updatedOrder,
      movements: newMovements,
      updatedProducts
    };
  }
};
