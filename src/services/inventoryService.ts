import { Product, StockMovement, MovementType } from '../types/aybos';
import { StorageRepository } from '../data/storage';
import { delay } from './delay';

export interface StockAdjustmentInput {
  productId: string;
  qty: number; // Positive number for addition, or signed
  type: MovementType;
  reason?: string;
  userId: string;
  refId?: string;
}

export const inventoryService = {
  async getStockLevels(): Promise<Product[]> {
    await delay(60);
    return StorageRepository.getProducts();
  },

  async getMovements(productId?: string): Promise<StockMovement[]> {
    await delay(70);
    const movements = StorageRepository.getMovements();
    if (productId) {
      return movements.filter(m => m.productId === productId);
    }
    return movements;
  },

  /**
   * Adjusts on-hand stock and appends an immutable movement record.
   * Handles DAMAGED, EXPIRED, RECEIVED, SALE, ADJUSTMENT.
   */
  async adjustStock(input: StockAdjustmentInput): Promise<{ movement: StockMovement; updatedProduct: Product }> {
    await delay(80);
    const products = StorageRepository.getProducts();
    const movements = StorageRepository.getMovements();

    const prodIndex = products.findIndex(p => p.id === input.productId);
    if (prodIndex === -1) {
      throw new Error(`Product with ID "${input.productId}" not found.`);
    }

    const currentProd = products[prodIndex];
    
    // Normalize delta: DAMAGED and EXPIRED decrease stock, RECEIVED increases, ADJUSTMENT can be signed
    let delta = input.qty;
    if (input.type === 'DAMAGED' || input.type === 'EXPIRED') {
      delta = -Math.abs(input.qty);
    }

    const newStock = Math.max(0, currentProd.currentStock + delta);
    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const referenceId = input.refId || `ADJ-${Date.now().toString().slice(-6)}`;

    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: currentProd.id,
      productName: currentProd.name,
      type: input.type,
      qty: delta,
      balanceAfter: newStock,
      reason: input.reason || `Inventory adjustment (${input.type})`,
      userId: input.userId,
      timestamp: nowIso,
      refId: referenceId,
      // Legacy aliases
      movementType: input.type,
      quantityDelta: delta,
      referenceId,
      notes: input.reason || `Inventory adjustment (${input.type})`
    };

    const updatedProduct: Product = {
      ...currentProd,
      currentStock: newStock
    };

    products[prodIndex] = updatedProduct;

    // Persist to storage
    StorageRepository.setProducts(products);
    StorageRepository.setMovements([movement, ...movements]);

    return { movement, updatedProduct };
  }
};
