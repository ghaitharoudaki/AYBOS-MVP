import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Boxes, 
  Truck, 
  ClipboardList, 
  BarChart3, 
  Users, 
  Bell, 
  Search, 
  PanelLeftClose, 
  PanelLeft, 
  HelpCircle,
  RotateCcw,
  Shield,
  ChevronDown
} from 'lucide-react';

import { 
  User, 
  Role,
  Product, 
  Supplier, 
  PurchaseOrder, 
  SalesReceipt, 
  MovementType 
} from './types/aybos';

import { StoreProvider, useStore } from './context/StoreContext';
import { POSCheckout } from './components/POSCheckout';
import { ProductManagement } from './components/ProductManagement';
import { InventoryManagement } from './components/InventoryManagement';
import { SupplierManagement } from './components/SupplierManagement';
import { PurchaseOrderManagement } from './components/PurchaseOrderManagement';
import { DashboardReporting } from './components/DashboardReporting';
import { UserRoleManagement } from './components/UserRoleManagement';
import { AboutDocsModal } from './components/AboutDocsModal';

type ActiveModule = 'POS' | 'PRODUCTS' | 'INVENTORY' | 'SUPPLIERS' | 'PURCHASING' | 'DASHBOARD' | 'USERS';

// RBAC Allowed Modules Mapping
const ROLE_ALLOWED_MODULES: Record<Role, ActiveModule[]> = {
  CASHIER: ['POS'],
  INVENTORY: ['INVENTORY', 'PRODUCTS'],
  PURCHASING: ['SUPPLIERS', 'PURCHASING', 'PRODUCTS'],
  MANAGER: ['POS', 'PRODUCTS', 'INVENTORY', 'SUPPLIERS', 'PURCHASING', 'DASHBOARD', 'USERS']
};

function AppContent() {
  const {
    currentUser,
    users,
    categories,
    products,
    suppliers,
    orders,
    sales,
    movements,
    lowStockCount,
    completeSale,
    receivePO,
    adjustStock,
    addProduct,
    updateProduct,
    addSupplier,
    updateSupplier,
    createPO,
    approvePO,
    addUser,
    updateUser,
    toggleUserStatus,
    switchUser,
    resetToSeeds
  } = useStore();

  // Layout & Navigation State
  const [activeModule, setActiveModule] = useState<ActiveModule>('POS');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // --- Handlers coordinating with Central Store & Async Services ---
  const handleCompleteSale = async (newReceipt: SalesReceipt) => {
    await completeSale(newReceipt);
  };

  const handleAddProduct = async (newProdData: Omit<Product, 'id'>) => {
    await addProduct(newProdData);
  };

  const handleUpdateProduct = async (updatedProd: Product) => {
    await updateProduct(updatedProd);
  };

  const handleStockAdjustment = async (
    productId: string, 
    delta: number, 
    type: MovementType, 
    notes: string
  ) => {
    await adjustStock(productId, delta, type, notes);
  };

  const handleAddSupplier = async (newSupData: Omit<Supplier, 'id'>) => {
    await addSupplier(newSupData);
  };

  const handleUpdateSupplier = async (updatedSup: Supplier) => {
    await updateSupplier(updatedSup);
  };

  const handleCreatePO = async (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>) => {
    await createPO(poData);
  };

  const handleApprovePO = async (poId: string) => {
    await approvePO(poId);
  };

  const handleReceivePO = async (
    poId: string, 
    receivedList: { productId: string; receivedQty: number }[]
  ) => {
    await receivePO(poId, receivedList);
  };

  const handleAddUser = async (newUserData: Omit<User, 'id'>) => {
    await addUser(newUserData);
  };

  const handleToggleUserStatus = async (userId: string) => {
    await toggleUserStatus(userId);
  };

  // User Role & RBAC Module Permissibility
  const userRole: Role = currentUser?.role || 'MANAGER';
  const allowedModules = ROLE_ALLOWED_MODULES[userRole] || ROLE_ALLOWED_MODULES.MANAGER;

  // Auto-redirect if current activeModule is not allowed for the active role
  useEffect(() => {
    if (!allowedModules.includes(activeModule)) {
      setActiveModule(allowedModules[0] || 'POS');
    }
  }, [userRole, activeModule, allowedModules]);

  const handleSwitchUser = (user: User) => {
    switchUser(user);
    const targetAllowed = ROLE_ALLOWED_MODULES[user.role] || ROLE_ALLOWED_MODULES.MANAGER;
    if (!targetAllowed.includes(activeModule)) {
      setActiveModule(targetAllowed[0] || 'POS');
    }
    setUserMenuOpen(false);
  };

  const handleSwitchRole = (targetRole: Role) => {
    // Find an account matching this role, or create a demo session
    const targetUser = users.find(u => u.role === targetRole) || {
      id: `usr-demo-${targetRole.toLowerCase()}`,
      name: `${targetRole.charAt(0) + targetRole.slice(1).toLowerCase()} User`,
      username: targetRole.toLowerCase(),
      role: targetRole,
      status: 'ACTIVE' as const,
      lastLogin: 'Just now'
    };
    switchUser(targetUser);
    const targetAllowed = ROLE_ALLOWED_MODULES[targetRole] || ROLE_ALLOWED_MODULES.MANAGER;
    setActiveModule(targetAllowed[0] || 'POS');
    setUserMenuOpen(false);
  };

  // All 7 potential navigation modules
  const navItems = [
    { id: 'POS' as ActiveModule, label: 'POS Terminal', icon: ShoppingCart, subtitle: 'Register scanning & checkout' },
    { id: 'PRODUCTS' as ActiveModule, label: 'Product Catalog', icon: Package, subtitle: 'SKU master & barcodes' },
    { id: 'INVENTORY' as ActiveModule, label: 'Inventory & Ledger', icon: Boxes, subtitle: 'Real-time stock balances' },
    { id: 'SUPPLIERS' as ActiveModule, label: 'Suppliers', icon: Truck, subtitle: 'Vendor contacts & terms' },
    { id: 'PURCHASING' as ActiveModule, label: 'Purchase Orders', icon: ClipboardList, subtitle: 'Restock orders & receiving' },
    { id: 'DASHBOARD' as ActiveModule, label: 'Dashboard & Reports', icon: BarChart3, subtitle: 'Daily sales reconciliation' },
    { id: 'USERS' as ActiveModule, label: 'Users & Roles', icon: Users, subtitle: 'Staff access & RBAC' },
  ];

  // RBAC: Strictly hide modules that the active role is not permitted to access
  const visibleNavItems = navItems.filter(item => allowedModules.includes(item.id));
  const currentNav = navItems.find(n => n.id === activeModule) || visibleNavItems[0] || navItems[0];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F6F7F9] text-slate-900 font-sans antialiased" dir="ltr">
      
      {/* ========================================================
          SLIM LEFT SIDEBAR (240px, collapsible to 72px)
          Deep Navy (#0F172A)
         ======================================================== */}
      <aside 
        className={`flex flex-col bg-[#0F172A] text-slate-300 border-r border-slate-800 transition-all duration-200 z-30 flex-shrink-0 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
        }`}
      >
        {/* Brand Logo & Collapse Toggle */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-base shadow-xs flex-shrink-0">
              AY
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <span className="font-bold tracking-tight text-white text-base">
                  AYBOS
                </span>
                <span className="block text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                  Retail Core OS
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title={sidebarCollapsed ? "Expand sidebar (240px)" : "Collapse sidebar (72px)"}
          >
            {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* RBAC Filtered Navigation Modules: Hidden (not just disabled) if inaccessible */}
        <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition relative group ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-r-full" />
                )}

                <Icon className={`w-5 h-5 flex-shrink-0 transition ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'
                }`} />

                {!sidebarCollapsed && (
                  <span className="truncate text-left text-[13px] font-medium tracking-tight">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Documentation Link + User Profile Card */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 flex-shrink-0">
          
          {/* Subtle About / Documentation link */}
          <button
            onClick={() => setIsDocsModalOpen(true)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title="About AYBOS & Documentation"
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0 text-slate-400" />
            {!sidebarCollapsed && <span>About & Documentation</span>}
          </button>

          {/* User profile card & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={`w-full flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>

              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-white truncate leading-tight">
                    {currentUser?.name || 'Staff User'}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-code font-medium mt-0.5 flex items-center justify-between">
                    <span>{currentUser?.role || 'ROLE'}</span>
                    <span className="text-[9px] text-slate-400">Switch ▾</span>
                  </div>
                </div>
              )}
            </button>

            {/* Quick Switch User & Demo RBAC Dropdown */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2.5 z-50 text-xs">
                
                {/* Header with live RBAC badge */}
                <div className="px-1.5 pb-2 border-b border-slate-800 mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Role Switcher (Demo RBAC)</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                    LIVE
                  </span>
                </div>

                {/* 4 Quick Role Switcher Buttons */}
                <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                  {(['MANAGER', 'CASHIER', 'INVENTORY', 'PURCHASING'] as Role[]).map(r => {
                    const isCurrent = userRole === r;
                    return (
                      <button
                        key={r}
                        onClick={() => handleSwitchRole(r)}
                        className={`px-2.5 py-2 rounded-lg text-left text-xs font-semibold transition border flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{r}</span>
                          {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className={`text-[10px] font-normal mt-0.5 ${isCurrent ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {r === 'CASHIER' ? 'POS only' :
                           r === 'INVENTORY' ? 'Stock & Catalog' :
                           r === 'PURCHASING' ? 'Suppliers & POs' : 'All 7 Modules'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Staff Accounts Submenu */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="px-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Staff Accounts</span>
                    <span className="font-mono text-[9px] text-slate-500">{users.length} registered</span>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => handleSwitchUser(u)}
                        className={`w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between hover:bg-slate-800 transition ${
                          u.id === currentUser?.id ? 'bg-slate-800 text-white font-bold' : 'text-slate-300'
                        }`}
                      >
                        <span className="truncate text-xs">{u.name}</span>
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                          u.role === 'MANAGER' ? 'bg-purple-900/60 text-purple-300' :
                          u.role === 'CASHIER' ? 'bg-blue-900/60 text-blue-300' :
                          u.role === 'INVENTORY' ? 'bg-amber-900/60 text-amber-300' :
                          'bg-emerald-900/60 text-emerald-300'
                        }`}>
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset to Seeds action */}
                <div className="mt-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      if (window.confirm('Reset all catalog, inventory, sales, and orders back to initial realistic seeds?')) {
                        resetToSeeds();
                        setUserMenuOpen(false);
                      }
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-md text-amber-400 hover:bg-amber-950/40 text-[11px] font-medium flex items-center gap-1.5 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Data to Seeds</span>
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </aside>

      {/* ========================================================
          RIGHT MAIN CONTENT AREA (Flex-1)
          Light background (#F6F7F9)
         ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Minimal Content Top Bar (Height: 56px) */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 shadow-2xs z-20">
          
          {/* Page Title & Subtitle */}
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              {currentNav.label}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block leading-none mt-0.5">
              {currentNav.subtitle}
            </p>
          </div>

          {/* Right Top Bar Controls: Global Search + Notifications + Profile */}
          <div className="flex items-center gap-3">
            
            {/* Minimal Global Search */}
            <div className="relative w-48 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search products or orders..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition h-9 placeholder:text-slate-400"
              />
            </div>

            {/* Notification Bell with Low-Stock Count Badge (Navigates to Dashboard or Inventory if permitted) */}
            <button
              onClick={() => {
                if (allowedModules.includes('DASHBOARD')) {
                  setActiveModule('DASHBOARD');
                } else if (allowedModules.includes('INVENTORY')) {
                  setActiveModule('INVENTORY');
                }
              }}
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title={`${lowStockCount} items at or below reorder threshold`}
            >
              <Bell className="w-4 h-4" />
              {lowStockCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center leading-none">
                  {lowStockCount}
                </span>
              )}
            </button>

            {/* User Avatar Chip with Role Switcher trigger */}
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 text-left hover:opacity-90 transition group cursor-pointer"
              title="Click to toggle user & role switcher"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center group-hover:ring-2 group-hover:ring-emerald-500 transition shadow-2xs">
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-none flex items-center gap-1">
                  <span>{currentUser?.name || 'Staff User'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition" />
                </div>
                <div className="text-[10px] text-emerald-600 font-code font-bold mt-0.5">
                  {currentUser?.role || 'ROLE'}
                </div>
              </div>
            </button>

          </div>

        </header>

        {/* Scrollable Workspace Container */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 min-h-0 bg-[#F6F7F9]">
          
          {activeModule === 'POS' && (
            <POSCheckout
              products={products}
              currentUser={currentUser}
              onCompleteSale={handleCompleteSale}
            />
          )}

          {activeModule === 'PRODUCTS' && (
            <ProductManagement
              products={products}
              categories={categories}
              currentUser={currentUser}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
            />
          )}

          {activeModule === 'INVENTORY' && (
            <InventoryManagement
              products={products}
              movements={movements}
              currentUser={currentUser}
              onStockAdjustment={handleStockAdjustment}
            />
          )}

          {activeModule === 'SUPPLIERS' && (
            <SupplierManagement
              suppliers={suppliers}
              currentUser={currentUser}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
            />
          )}

          {activeModule === 'PURCHASING' && (
            <PurchaseOrderManagement
              orders={orders}
              suppliers={suppliers}
              products={products}
              currentUser={currentUser}
              onCreatePO={handleCreatePO}
              onApprovePO={handleApprovePO}
              onReceivePO={handleReceivePO}
            />
          )}

          {activeModule === 'DASHBOARD' && (
            <DashboardReporting
              products={products}
              receipts={sales}
              orders={orders}
              onNavigateToPO={() => setActiveModule('PURCHASING')}
              onNavigateToInventory={() => setActiveModule('INVENTORY')}
            />
          )}

          {activeModule === 'USERS' && (
            <UserRoleManagement
              users={users}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={updateUser}
              onToggleUserStatus={handleToggleUserStatus}
              onSwitchUser={handleSwitchUser}
            />
          )}

        </main>

      </div>

      {/* About / Documentation Modal */}
      <AboutDocsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
