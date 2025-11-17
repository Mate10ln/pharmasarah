
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { InventoryIcon, ClientsIcon, AlertIcon, DashboardIcon } from './shared/Icons';
import { AppView } from '../types';

interface DashboardProps {
    setActiveView: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
  const { state } = useAppContext();
  const { products, clients, sales } = state;

  const lowStockItems = products.filter(p => p.quantity <= p.lowStockThreshold);

  // FIX: Explicitly type clientBalances to ensure Object.values returns number[] and totalDebt is inferred as a number.
  const clientBalances: Record<string, number> = sales.reduce((acc, sale) => {
    if (sale.status === 'Unpaid') {
      if (!acc[sale.clientId]) {
        acc[sale.clientId] = 0;
      }
      acc[sale.clientId] += sale.total;
    }
    return acc;
  }, {} as Record<string, number>);

  const clientsWithDebt = Object.keys(clientBalances).length;
  const totalDebt = Object.values(clientBalances).reduce((sum, amount) => sum + amount, 0);

  const StatCard = ({ icon: Icon, title, value, color, onClick }: { icon: React.FC<any>, title: string, value: string | number, color: string, onClick?: () => void }) => (
    <div className={`bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`} onClick={onClick}>
        <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white"/>
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's a summary of your pharmacy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon={InventoryIcon} title="Low Stock Items" value={lowStockItems.length} color="bg-red-500" onClick={() => setActiveView('inventory')} />
        <StatCard icon={ClientsIcon} title="Clients with Debt" value={clientsWithDebt} color="bg-yellow-500" onClick={() => setActiveView('clients')}/>
        <StatCard icon={DashboardIcon} title="Total Outstanding" value={`$${totalDebt.toFixed(2)}`} color="bg-blue-500" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <AlertIcon className="h-6 w-6 text-red-500 mr-2"/>
            Low Stock Alerts
        </h2>
        <p className="text-gray-600 mt-1 mb-4">These items need to be restocked soon.</p>
        <div className="overflow-x-auto">
            {lowStockItems.length > 0 ? (
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Product Name</th>
                            <th scope="col" className="px-6 py-3">SKU</th>
                            <th scope="col" className="px-6 py-3 text-right">Qty Left</th>
                            <th scope="col" className="px-6 py-3 text-right">Threshold</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lowStockItems.map(item => (
                            <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                    {item.name}
                                </th>
                                <td className="px-6 py-4">{item.sku}</td>
                                <td className="px-6 py-4 text-right font-bold text-red-600">{item.quantity}</td>
                                <td className="px-6 py-4 text-right">{item.lowStockThreshold}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-center text-gray-500 py-8">No items are currently low on stock. Great job!</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
