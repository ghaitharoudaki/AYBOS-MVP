import { User } from '../types/aybos';
import { StorageRepository } from '../data/storage';
import { delay } from './delay';

export const authService = {
  async getAllUsers(): Promise<User[]> {
    await delay(50);
    return StorageRepository.getUsers();
  },

  async getCurrentUser(): Promise<User> {
    await delay(30);
    const users = StorageRepository.getUsers();
    const currentId = StorageRepository.getCurrentUserId();
    const found = users.find(u => u.id === currentId);
    return found || users[0];
  },

  async setCurrentUser(id: string): Promise<User> {
    await delay(40);
    const users = StorageRepository.getUsers();
    const found = users.find(u => u.id === id);
    if (!found) {
      throw new Error(`User with ID "${id}" not found.`);
    }
    StorageRepository.setCurrentUserId(id);
    return found;
  },

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    await delay(80);
    const users = StorageRepository.getUsers();
    const newUser: User = {
      ...data,
      id: `usr-${Date.now()}`
    };
    const updated = [...users, newUser];
    StorageRepository.setUsers(updated);
    return newUser;
  },

  async toggleUserStatus(id: string): Promise<User> {
    await delay(60);
    const users = StorageRepository.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User with ID "${id}" not found.`);
    }

    const updatedUser: User = {
      ...users[index],
      status: users[index].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    };

    users[index] = updatedUser;
    StorageRepository.setUsers(users);
    return updatedUser;
  },

  async updateUser(user: User): Promise<User> {
    await delay(70);
    const users = StorageRepository.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index === -1) {
      throw new Error(`User with ID "${user.id}" not found.`);
    }

    users[index] = { ...users[index], ...user };
    StorageRepository.setUsers(users);
    return users[index];
  }
};
