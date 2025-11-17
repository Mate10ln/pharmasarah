
import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Sale } from '../types';
import { TrashIcon } from './shared/Icons';

const Reports: React.FC = () => {
    const { state, dispatch } = useAppContext();

    const sortedSales = useMemo(() => 
        [...state.sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.sales]);

    const handleUpdateStatus = (saleId: string, status: 'Paid' | 'Unpaid') => {
        dispatch({ type: 'UPDATE_SALE_STATUS', payload: { saleId, status } });
    };

    const handleDeleteSale = (sale: Sale) => {
        if(window.confirm(`Are you sure you want to delete this sale? This will add ${sale.items.reduce((acc, item) => acc + item.quantity, 0)} items back to stock.`)) {
            dispatch({ type: 'DELETE_SALE', payload: { saleId: sale.id, items: sale.items } });
        }
    }

    const convertToCSV = (data: any[], headers: string[]) => {
        const headerRow = headers.join(',');
        const rows = data.map(item =>
            headers.map(header => JSON.stringify(item[header.toLowerCase().replace(/ /g, '')] || '', (key, value) => value === null ? '' : value)).join(',')
        );
        return [headerRow, ...rows].join('\n');
    };

    const downloadCSV = (data: string, filename: string) => {
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const exportInventory = () => {
        const headers = ['SKU', 'Name', 'Category', 'CostPrice', 'Price', 'Quantity', 'LowStockThreshold', 'Barcode'];
        const csvData = convertToCSV(state.products, headers);
        downloadCSV(csvData, 'inventory.csv');
    };

    const exportClients = () => {
        const headers = ['Name', 'Phone', 'Email', 'Address'];
        const csvData = convertToCSV(state.clients, headers);
        downloadCSV(csvData, 'clients.csv');
    };

    const exportSales = () => {
        const salesData = state.sales.map(sale => {
            const client = state.clients.find(c => c.id === sale.clientId);
            const items = sale.items.map(item => {
                const product = state.products.find(p => p.id === item.productId);
                return `${item.quantity}x ${product?.name || 'N/A'}`;
            }).join('; ');

            return {
                id: sale.id,
                date: new Date(sale.date).toLocaleString(),
                client: client?.name || 'N/A',
                items,
                total: sale.total,
                status: sale.status
            };
        });
        const headers = ['ID', 'Date', 'Client', 'Items', 'Total', 'Status'];
        const csvData = convertToCSV(salesData, headers);
        downloadCSV(csvData, 'sales.csv');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Reports & Export</h1>
                    <p className="text-gray-600 mt-1">View sales history and export your data.</p>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Export Data</h2>
                <div className="flex flex-wrap gap-4">
                    <button onClick={exportInventory} className="px-4 py-2 bg-brand-green text-white rounded-lg hover:opacity-90">Export Inventory (CSV)</button>
                    <button onClick={exportClients} className="px-4 py-2 bg-brand-green text-white rounded-lg hover:opacity-90">Export Clients (CSV)</button>
                    <button onClick={exportSales} className="px-4 py-2 bg-brand-green text-white rounded-lg hover:opacity-90">Export Sales (CSV)</button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <h2 className="text-xl font-bold text-gray-800 p-6">Sales History</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Client</th>
                                <th scope="col" className="px-6 py-3">Items</th>
                                <th scope="col" className="px-6 py-3 text-right">Total</th>
                                <th scope="col" className="px-6 py-3 text-center">Status</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSales.map(sale => {
                                const client = state.clients.find(c => c.id === sale.clientId);
                                const itemSummary = sale.items.map(i => {
                                    const product = state.products.find(p => p.id === i.productId);
                                    return `${i.quantity}x ${product?.name || '...'}`;
                                }).join(', ');

                                return (
                                <tr key={sale.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{new Date(sale.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{client?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{itemSummary}</td>
                                    <td className="px-6 py-4 text-right font-semibold">${sale.total.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center">
                                       <select 
                                         value={sale.status}
                                         onChange={(e) => handleUpdateStatus(sale.id, e.target.value as 'Paid' | 'Unpaid')}
                                         className={`text-xs p-1 rounded-md border-2 ${sale.status === 'Paid' ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'}`}
                                       >
                                         <option value="Paid">Paid</option>
                                         <option value="Unpaid">Unpaid</option>
                                       </select>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => handleDeleteSale(sale)} className="text-red-500 hover:text-red-700" title="Delete Sale"><TrashIcon className="w-5 h-5 mx-auto"/></button>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
