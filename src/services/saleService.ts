import { Sale, StockMovement, Product } from '../types/aybos';
import { StorageRepository } from '../data/storage';
import { delay } from './delay';

export const saleService = {
  async getAll(): Promise<Sale[]> {
    await delay(70);
    return StorageRepository.getSales();
  },

  async getById(id: string): Promise<Sale | null> {
    await delay(50);
    const sales = StorageRepository.getSales();
    return sales.find(s => s.id === id) || null;
  },

  async getDailySales(dateString?: string): Promise<Sale[]> {
    await delay(60);
    const sales = StorageRepository.getSales();
    const targetDate = dateString || new Date().toISOString().substring(0, 10);
    return sales.filter(s => s.timestamp.startsWith(targetDate));
  },

  /**
   * Records a sale transaction, deducts product stock balances, and generates
   * immutable StockMovement records for each line item.
   */
  async processSale(saleData: Omit<Sale, 'id'>): Promise<{ sale: Sale; movements: StockMovement[]; updatedProducts: Product[] }> {
    await delay(100);
    const sales = StorageRepository.getSales();
    const products = StorageRepository.getProducts();
    const movements = StorageRepository.getMovements();

    const newSaleId = `sale-${Date.now()}`;
    const newSale: Sale = {
      ...saleData,
      id: newSaleId
    };

    const newMovements: StockMovement[] = [];
    const updatedProducts = products.map(prod => {
      const soldItem = newSale.items.find(i => i.productId === prod.id);
      if (soldItem) {
        const newStock = Math.max(0, prod.currentStock - soldItem.quantity);
        const mov: StockMovement = {
          id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: prod.id,
          productName: prod.name,
          type: 'SALE',
          qty: -soldItem.quantity,
          balanceAfter: newStock,
          reason: `POS Terminal Sale ${newSale.receiptNumber} (${newSale.paymentMethod})`,
          userId: newSale.cashierId,
          timestamp: newSale.timestamp,
          refId: newSale.receiptNumber,
          // Legacy aliases
          movementType: 'SALE',
          quantityDelta: -soldItem.quantity,
          referenceId: newSale.receiptNumber,
          notes: `POS Register Checkout (${newSale.paymentMethod})`
        };
        newMovements.push(mov);
        return { ...prod, currentStock: newStock };
      }
      return prod;
    });

    // Persist all changes atomically
    StorageRepository.setSales([newSale, ...sales]);
    StorageRepository.setProducts(updatedProducts);
    StorageRepository.setMovements([...newMovements, ...movements]);

    return {
      sale: newSale,
      movements: newMovements,
      updatedProducts
    };
  },

  async create(saleData: Omit<Sale, 'id'>): Promise<Sale> {
    const result = await this.processSale(saleData);
    return result.sale;
  }
};
