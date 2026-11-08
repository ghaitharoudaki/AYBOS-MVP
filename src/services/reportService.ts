import { Product, Sale } from '../types/aybos';
import { StorageRepository } from '../data/storage';
import { delay } from './delay';

export interface DailySummaryReport {
  targetDate: string;
  totalRevenue: number;
  cashTotal: number;
  cardTotal: number;
  taxTotal: number;
  transactionCount: number;
  averageBasket: number;
  totalItemsSold: number;
}

export interface LowStockAlertReport {
  critical: Product[];
  outOfStock: Product[];
  totalAlerts: number;
}

export interface InventoryValuationReport {
  totalSkus: number;
  totalQuantity: number;
  totalCostValue: number;
  totalRetailValue: number;
  potentialMargin: number;
}

export const reportService = {
  async getDailySummary(dateString?: string): Promise<DailySummaryReport> {
    await delay(70);
    const sales = StorageRepository.getSales();
    const targetDate = dateString || new Date().toISOString().substring(0, 10);
    
    // Filter sales matching the date prefix (YYYY-MM-DD)
    const matchingSales = sales.filter(s => s.timestamp.startsWith(targetDate));

    const totalRevenue = matchingSales.reduce((acc, s) => acc + s.grandTotal, 0);
    const cashTotal = matchingSales.filter(s => s.paymentMethod === 'CASH').reduce((acc, s) => acc + s.grandTotal, 0);
    const cardTotal = matchingSales.filter(s => s.paymentMethod === 'CARD').reduce((acc, s) => acc + s.grandTotal, 0);
    const taxTotal = matchingSales.reduce((acc, s) => acc + s.tax, 0);
    const transactionCount = matchingSales.length;
    const averageBasket = transactionCount > 0 ? totalRevenue / transactionCount : 0;
    const totalItemsSold = matchingSales.reduce((acc, s) => {
      return acc + s.items.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);

    return {
      targetDate,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      cashTotal: Number(cashTotal.toFixed(2)),
      cardTotal: Number(cardTotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      transactionCount,
      averageBasket: Number(averageBasket.toFixed(2)),
      totalItemsSold
    };
  },

  async getLowStockAlerts(): Promise<LowStockAlertReport> {
    await delay(50);
    const products = StorageRepository.getProducts();

    const outOfStock = products.filter(p => p.currentStock <= 0);
    const critical = products.filter(p => p.currentStock > 0 && p.currentStock <= p.reorderLevel);

    return {
      critical,
      outOfStock,
      totalAlerts: outOfStock.length + critical.length
    };
  },

  async getInventoryValuation(): Promise<InventoryValuationReport> {
    await delay(60);
    const products = StorageRepository.getProducts();

    let totalQuantity = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;

    for (const prod of products) {
      totalQuantity += prod.currentStock;
      totalCostValue += prod.currentStock * prod.costPrice;
      totalRetailValue += prod.currentStock * prod.sellingPrice;
    }

    const potentialMargin = totalRetailValue > 0 
      ? ((totalRetailValue - totalCostValue) / totalRetailValue) * 100 
      : 0;

    return {
      totalSkus: products.length,
      totalQuantity,
      totalCostValue: Number(totalCostValue.toFixed(2)),
      totalRetailValue: Number(totalRetailValue.toFixed(2)),
      potentialMargin: Number(potentialMargin.toFixed(1))
    };
  },

  async getRecentTransactions(limit: number = 10): Promise<Sale[]> {
    await delay(50);
    const sales = StorageRepository.getSales();
    return sales.slice(0, limit);
  }
};
