import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Inventory from './components/Inventory';
import Clients from './components/Clients';
import Sales from './components/Sales';
import Reports from './components/Reports';
import PurchaseOrders from './components/PurchaseOrders';
import { AppView } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<AppView>('dashboard');

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveView('dashboard');
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard setActiveView={setActiveView} />;
      case 'inventory':
        return <Inventory />;
      case 'clients':
        return <Clients />;
      case 'sales':
        return <Sales />;
      case 'reports':
        return <Reports />;
      case 'purchaseorders':
        return <PurchaseOrders />;
      default:
        return <Dashboard setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-gray text-gray-800">
      <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-20 overflow-y-auto">
        {renderActiveView()}
      </main>
    </div>
  );
};

export default App;