import { Product, Category } from '../types/aybos';
import { StorageRepository } from '../data/storage';
import { delay } from './delay';

export const productService = {
  async getAll(): Promise<Product[]> {
    await delay(70);
    return StorageRepository.getProducts();
  },

  async getById(id: string): Promise<Product | null> {
    await delay(50);
    const products = StorageRepository.getProducts();
    return products.find(p => p.id === id) || null;
  },

  async getByBarcode(barcode: string): Promise<Product | null> {
    await delay(40);
    const products = StorageRepository.getProducts();
    const cleanBarcode = barcode.trim();
    return products.find(p => p.barcode === cleanBarcode) || null;
  },

  async getCategories(): Promise<Category[]> {
    await delay(60);
    return StorageRepository.getCategories();
  },

  async create(data: Omit<Product, 'id'>): Promise<Product> {
    await delay(90);
    const products = StorageRepository.getProducts();
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}`
    };
    const updated = [newProduct, ...products];
    StorageRepository.setProducts(updated);

    // Update category itemCount
    const categories = StorageRepository.getCategories();
    const catIndex = categories.findIndex(c => c.id === data.categoryId);
    if (catIndex >= 0) {
      categories[catIndex].itemCount = (categories[catIndex].itemCount || 0) + 1;
      StorageRepository.setCategories(categories);
    }

    return newProduct;
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    await delay(80);
    const products = StorageRepository.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Product with ID "${id}" not found.`);
    }

    const updatedProduct: Product = {
      ...products[index],
      ...updates
    };

    products[index] = updatedProduct;
    StorageRepository.setProducts(products);
    return updatedProduct;
  },

  async delete(id: string): Promise<boolean> {
    await delay(70);
    const products = StorageRepository.getProducts();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    StorageRepository.setProducts(filtered);
    return true;
  }
};
