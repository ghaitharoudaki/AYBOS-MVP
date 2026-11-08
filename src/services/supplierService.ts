import { Supplier } from '../types/aybos';
import { StorageRepository } from '../data/storage';
import { delay } from './delay';

export const supplierService = {
  async getAll(): Promise<Supplier[]> {
    await delay(60);
    return StorageRepository.getSuppliers();
  },

  async getById(id: string): Promise<Supplier | null> {
    await delay(50);
    const suppliers = StorageRepository.getSuppliers();
    return suppliers.find(s => s.id === id) || null;
  },

  async create(data: Omit<Supplier, 'id'>): Promise<Supplier> {
    await delay(90);
    const suppliers = StorageRepository.getSuppliers();
    const newSupplier: Supplier = {
      ...data,
      id: `sup-${Date.now()}`
    };
    StorageRepository.setSuppliers([newSupplier, ...suppliers]);
    return newSupplier;
  },

  async update(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    await delay(80);
    const suppliers = StorageRepository.getSuppliers();
    const index = suppliers.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error(`Supplier with ID "${id}" not found.`);
    }

    const updated: Supplier = {
      ...suppliers[index],
      ...updates
    };

    suppliers[index] = updated;
    StorageRepository.setSuppliers(suppliers);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await delay(70);
    const suppliers = StorageRepository.getSuppliers();
    const filtered = suppliers.filter(s => s.id !== id);
    if (filtered.length === suppliers.length) return false;
    StorageRepository.setSuppliers(filtered);
    return true;
  }
};
