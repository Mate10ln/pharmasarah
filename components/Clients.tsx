import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Client } from '../types';
import Modal from './shared/Modal';
import { PlusIcon, UserGroupIcon, MailIcon, PhoneIcon, LocationMarkerIcon, EditIcon, TrashIcon, SearchIcon } from './shared/Icons';

const emptyClient: Omit<Client, 'id'> = { name: '', phone: '', address: '', email: '' };

const Clients: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [clientData, setClientData] = useState<Omit<Client, 'id'>>(emptyClient);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showOnlyDebtors, setShowOnlyDebtors] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (editingClient) {
            setClientData(editingClient);
        } else {
            setClientData(emptyClient);
        }
    }, [editingClient]);

    const clientBalances = useMemo(() => {
        return state.sales.reduce((acc, sale) => {
            if (sale.status === 'Unpaid') {
                if (!acc[sale.clientId]) acc[sale.clientId] = 0;
                acc[sale.clientId] += sale.total;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [state.sales]);

    const filteredClients = useMemo(() => {
        let clients = state.clients;
        if (showOnlyDebtors) {
            clients = clients.filter(client => (clientBalances[client.id] || 0) > 0);
        }
        if (searchTerm) {
            clients = clients.filter(client => 
                client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.phone.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return clients.sort((a,b) => a.name.localeCompare(b.name));
    }, [state.clients, showOnlyDebtors, clientBalances, searchTerm]);

    const handleOpenModal = (client: Client | null = null) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
        setClientData(emptyClient);
    };

    const handleSaveClient = () => {
        if (clientData.name && clientData.phone) {
            if (editingClient) {
                dispatch({ type: 'UPDATE_CLIENT', payload: { ...editingClient, ...clientData } });
            } else {
                dispatch({ type: 'ADD_CLIENT', payload: { ...clientData, id: `client${Date.now()}` } });
            }
            handleCloseModal();
        } else {
            alert('Name and phone are required.');
        }
    };

    const handleDeleteClient = (client: Client) => {
        if (window.confirm(`Are you sure you want to delete ${client.name}?`)) {
            dispatch({ type: 'DELETE_CLIENT', payload: client.id });
        }
    };

    const handleUpdateStatus = (saleId: string, status: 'Paid' | 'Unpaid') => {
        dispatch({ type: 'UPDATE_SALE_STATUS', payload: { saleId, status } });
    };
    
    const viewClientDetails = (client: Client) => {
        setSelectedClient(client);
        setIsDetailModalOpen(true);
    };

    const ClientDetailView = () => {
        if (!selectedClient) return null;
        const clientSales = state.sales.filter(s => s.clientId === selectedClient.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return (
            <div>
                <div className="p-4 border-b">
                    <h3 className="text-lg font-bold">{selectedClient.name}</h3>
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                        <p className="flex items-center"><PhoneIcon className="h-4 w-4 mr-2" />{selectedClient.phone}</p>
                        <p className="flex items-center"><MailIcon className="h-4 w-4 mr-2" />{selectedClient.email || 'N/A'}</p>
                        <p className="flex items-center"><LocationMarkerIcon className="h-4 w-4 mr-2" />{selectedClient.address || 'N/A'}</p>
                    </div>
                </div>
                <div className="p-4">
                    <h4 className="font-semibold mb-2">Purchase History</h4>
                    <div className="max-h-64 overflow-y-auto">
                        {clientSales.length > 0 ? (
                            <ul className="space-y-2">
                                {clientSales.map(sale => {
                                    const productDetails = sale.items.map(item => {
                                        const product = state.products.find(p => p.id === item.productId);
                                        return `${item.quantity}x ${product?.name || 'Unknown'}`;
                                    }).join(', ');
                                    return (
                                        <li key={sale.id} className="p-2 border rounded-md">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-gray-800">${sale.total.toFixed(2)}</p>
                                                    <p className="text-xs text-gray-500">{new Date(sale.date).toLocaleDateString()}</p>
                                                </div>
                                                {sale.status === 'Unpaid' ? (
                                                    <button onClick={() => handleUpdateStatus(sale.id, 'Paid')} className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors">
                                                        Mark as Paid
                                                    </button>
                                                ) : (
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${sale.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{sale.status}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 truncate">{productDetails}</p>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">No purchase history found.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Clients</h1>
                    <p className="text-gray-600 mt-1">Manage your client information and balances.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg shadow-md hover:bg-brand-blue-dark transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    Add New Client
                </button>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="text" placeholder="Search by name or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-blue focus:border-brand-blue" />
                </div>
                <label className="flex items-center space-x-2 cursor-pointer flex-shrink-0">
                    <input type="checkbox" checked={showOnlyDebtors} onChange={() => setShowOnlyDebtors(!showOnlyDebtors)} className="rounded text-brand-blue focus:ring-brand-blue"/>
                    <span className="text-sm font-medium text-gray-700">Show only debtors</span>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map(client => (
                    <div key={client.id} className="bg-white p-5 rounded-xl shadow-md flex flex-col justify-between">
                        <div onClick={() => viewClientDetails(client)} className="cursor-pointer">
                            <div className="flex justify-between items-start">
                               <div>
                                 <h3 className="text-lg font-bold text-gray-800">{client.name}</h3>
                                 <p className="text-sm text-gray-500">{client.phone}</p>
                               </div>
                               <UserGroupIcon className="h-8 w-8 text-gray-300" />
                            </div>
                            <div className="mt-4">
                                <p className="text-sm text-gray-500">Unpaid Balance</p>
                                <p className={`text-2xl font-bold ${clientBalances[client.id] > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    ${ (clientBalances[client.id] || 0).toFixed(2) }
                                </p>
                            </div>
                        </div>
                        <div className="border-t mt-4 pt-3 flex items-center justify-end gap-2">
                           <button onClick={() => handleOpenModal(client)} className="text-brand-blue hover:text-brand-blue-dark p-1" title="Edit Client"><EditIcon className="w-5 h-5"/></button>
                           <button onClick={() => handleDeleteClient(client)} className="text-red-500 hover:text-red-700 p-1" title="Delete Client"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingClient ? "Edit Client" : "Add New Client"}>
                <div className="space-y-4">
                    <input type="text" placeholder="Name" value={clientData.name} onChange={(e) => setClientData({ ...clientData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-blue focus:border-brand-blue" />
                    <input type="text" placeholder="Phone" value={clientData.phone} onChange={(e) => setClientData({ ...clientData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-blue focus:border-brand-blue" />
                    <input type="email" placeholder="Email (Optional)" value={clientData.email} onChange={(e) => setClientData({ ...clientData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-blue focus:border-brand-blue" />
                    <input type="text" placeholder="Address (Optional)" value={clientData.address} onChange={(e) => setClientData({ ...clientData, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-blue focus:border-brand-blue" />
                    <button onClick={handleSaveClient} className="w-full py-2 px-4 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark transition-colors">Save Client</button>
                </div>
            </Modal>
            
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Client Details">
                <ClientDetailView />
            </Modal>
        </div>
    );
};

export default Clients;