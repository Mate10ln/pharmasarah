import React, { useState } from 'react';
import { AppView } from '../types';
import { DashboardIcon, InventoryIcon, ClientsIcon, SalesIcon, ReportsIcon, LogoutIcon, MenuIcon, CloseIcon, LogoIcon, POIcon } from './shared/Icons';

interface SidebarProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  onLogout: () => void;
}

const navItems = [
  { view: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { view: 'sales', label: 'New Sale', icon: SalesIcon },
  { view: 'inventory', label: 'Inventory', icon: InventoryIcon },
  { view: 'purchaseorders', label: 'Purchase Orders', icon: POIcon },
  { view: 'clients', label: 'Clients', icon: ClientsIcon },
  { view: 'reports', label: 'Reports & Export', icon: ReportsIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  // FIX: Updated the type of the 'icon' prop to be more specific, resolving a type error.
  const NavLink = ({ view, label, icon: Icon }: { view: AppView; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }) => (
    <button
      onClick={() => { setActiveView(view); setIsOpen(false); }}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
        activeView === view
          ? 'bg-brand-blue text-white'
          : 'text-gray-600 hover:bg-brand-blue/10 hover:text-brand-blue'
      }`}
    >
      <Icon className="h-5 w-5 mr-3" />
      <span>{label}</span>
    </button>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
        <div className="flex items-center justify-between h-20 px-4 border-b">
          <div className="flex items-center space-x-3">
              <LogoIcon className="h-10 w-10 text-brand-blue" />
              <span className="text-xl font-bold text-gray-800">PharmaSarah</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-800">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <NavLink key={item.view} view={item.view as AppView} label={item.label} icon={item.icon} />
          ))}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={onLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors duration-200"
          >
            <LogoutIcon className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="absolute top-4 left-4 z-20 lg:hidden">
         <button onClick={() => setIsOpen(!isOpen)} className="p-2 bg-white rounded-full shadow-md text-gray-600 hover:bg-gray-100">
            <MenuIcon className="h-6 w-6" />
         </button>
      </div>

      {/* Mobile/Tablet Sidebar (Overlay) */}
      <div
        className={`fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      ></div>
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:w-64 bg-white shadow-md flex-shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;