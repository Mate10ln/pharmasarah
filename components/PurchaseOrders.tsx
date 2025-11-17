
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { PurchaseOrder, Product } from '../types';
import Modal from './shared/Modal';
import { PlusIcon, TrashIcon, CameraIcon, CloseIcon, SearchIcon } from './shared/Icons';

declare const ZXing: any;

const BarcodeScanner: React.FC<{ onScan: (result: string) => void; onClose: () => void }> = ({ onScan, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<any>(null);

    const startScan = useCallback(async () => {
        if (!codeReaderRef.current) {
            codeReaderRef.current = new ZXing.BrowserMultiFormatReader();
        }
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            const deviceId = videoDevices.length > 1 ? videoDevices[1].deviceId : videoDevices[0]?.deviceId;

            if (videoRef.current && deviceId) {
                codeReaderRef.current.decodeFromVideoDevice(deviceId, videoRef.current, (result: any, err: any) => {
                    if (result) {
                        onScan(result.getText());
                    }
                    if (err && !(err instanceof ZXing.NotFoundException)) {
                        console.error(err);
                    }
                });
            } else if (!deviceId) {
                alert("No camera found. Please ensure a camera is connected and permissions are granted.");
                onClose();
            }
        } catch (error) {
            console.error("Error accessing camera:", error);
            alert("Could not access camera. Please ensure permissions are granted.");
            onClose();
        }
    }, [onScan, onClose]);

    const stopScan = useCallback(() => {
        if (codeReaderRef.current) {
            codeReaderRef.current.reset();
        }
    }, []);

    // FIX: Imported 'useEffect' above to resolve the 'Cannot find name' error.
    useEffect(() => {
        startScan();
        return () => {
            stopScan();
        };
    }, [startScan, stopScan]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center p-4">
            <video ref={videoRef} className="w-full max-w-lg rounded-lg" />
            <button onClick={onClose} className="mt-4 p-3 bg-white rounded-full text-gray-800 shadow-lg">
                <CloseIcon className="h-6 w-6" />
            </button>
        </div>
    );
};


type NewPOItem = { productId: string; quantityOrdered: number; };

const PurchaseOrders: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isReceiveModalOpen, setReceiveModalOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [newPOItems, setNewPOItems] = useState<NewPOItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isScannerOpen, setScannerOpen] = useState(false);
    
    // State for receive modal inputs
    const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});

    const filteredProducts = useMemo(() => {
        return state.products.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [state.products, searchTerm]);

    const handleCreatePO = () => {
        if (newPOItems.length === 0) {
            alert("Please add items to the purchase order.");
            return;
        }
        const newPO: PurchaseOrder = {
            id: `po${Date.now()}`,
            poNumber: `PO-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
            date: new Date().toISOString(),
            status: 'Pending',
            items: newPOItems.map(item => ({ ...item, quantityReceived: 0 })),
        };
        dispatch({ type: 'CREATE_PO', payload: newPO });
        setCreateModalOpen(false);
        setNewPOItems([]);
    };

    const handleDeletePO = (po: PurchaseOrder) => {
        if(window.confirm(`Are you sure you want to delete PO ${po.poNumber}? This action cannot be undone.`)) {
            dispatch({ type: 'DELETE_PO', payload: po.id });
        }
    };
    
    const handleReceiveItems = () => {
        if (!selectedPO) return;
        const receivedItems = Object.entries(receivedQuantities)
            .map(([productId, quantity]) => ({ productId, quantity: Number(quantity) || 0 }))
            .filter(item => item.quantity > 0);

        if (receivedItems.length === 0) {
            alert("Please enter quantities for received items.");
            return;
        }

        dispatch({ type: 'RECEIVE_PO_ITEMS', payload: { poId: selectedPO.id, receivedItems } });
        setReceiveModalOpen(false);
        setSelectedPO(null);
        setReceivedQuantities({});
    };

    const openReceiveModal = (po: PurchaseOrder) => {
        setSelectedPO(po);
        setReceiveModalOpen(true);
    };

    const addProductToPO = (product: Product) => {
        const exists = newPOItems.find(i => i.productId === product.id);
        if (exists) {
            setNewPOItems(newPOItems.map(i => i.productId === product.id ? { ...i, quantityOrdered: i.quantityOrdered + 1 } : i));
        } else {
            setNewPOItems([...newPOItems, { productId: product.id, quantityOrdered: 1 }]);
        }
    };

    const handleScannedBarcode = (result: string) => {
        setScannerOpen(false);
        const product = state.products.find(p => p.sku.toLowerCase() === result.toLowerCase() || p.barcode === result);
        if (product) {
            addProductToPO(product);
        } else {
            alert('Product not found for this SKU/barcode.');
        }
    };
    
    const updatePOItemQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            setNewPOItems(newPOItems.filter(i => i.productId !== productId));
        } else {
            setNewPOItems(newPOItems.map(i => i.productId === productId ? { ...i, quantityOrdered: quantity } : i));
        }
    };

    const getStatusColor = (status: PurchaseOrder['status']) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Partially Received': return 'bg-blue-100 text-blue-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const sortedPOs = useMemo(() => 
        [...state.purchaseOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.purchaseOrders]);

    return (
        <div className="space-y-6">
            {isScannerOpen && <BarcodeScanner onScan={handleScannedBarcode} onClose={() => setScannerOpen(false)} />}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Purchase Orders</h1>
                    <p className="text-gray-600 mt-1">Create and manage your stock orders.</p>
                </div>
                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg shadow-md hover:bg-brand-blue-dark transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    Create New PO
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedPOs.map(po => (
                    <div key={po.id} className="bg-white p-5 rounded-xl shadow-md flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-gray-800">{po.poNumber}</h3>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(po.status)}`}>{po.status}</span>
                            </div>
                            <p className="text-sm text-gray-500">{new Date(po.date).toLocaleDateString()}</p>
                            <ul className="text-sm mt-3 space-y-1 text-gray-600">
                                {po.items.slice(0, 3).map(item => {
                                    const product = state.products.find(p => p.id === item.productId);
                                    return <li key={item.productId} className="flex justify-between"><span>{product?.name || '...'}</span> <span>{item.quantityReceived}/{item.quantityOrdered}</span></li>;
                                })}
                                {po.items.length > 3 && <li>...and {po.items.length - 3} more</li>}
                            </ul>
                        </div>
                        <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2">
                            <button disabled={po.status === 'Completed'} onClick={() => openReceiveModal(po)} className="flex-grow py-2 text-sm bg-brand-green text-white rounded-md hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed">
                                Receive Stock
                            </button>
                            <button onClick={() => handleDeletePO(po)} className="text-red-500 hover:text-red-700 p-2" title="Delete Purchase Order"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create PO Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Purchase Order">
                <div className="flex flex-col md:flex-row gap-4 h-[60vh]">
                    <div className="md:w-1/2 flex flex-col">
                        <div className="relative mb-2">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="h-5 w-5 text-gray-400" /></div>
                            <input type="text" placeholder="Search or scan products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md"/>
                            <button type="button" onClick={() => setScannerOpen(true)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-brand-blue" title="Scan Barcode to Add"><CameraIcon className="h-5 w-5"/></button>
                        </div>
                        <ul className="flex-1 overflow-y-auto border rounded-md p-2">
                           {filteredProducts.map(p => (
                               <li key={p.id} onClick={() => addProductToPO(p)} className="p-2 hover:bg-gray-100 cursor-pointer rounded-md">
                                   {p.name} <span className="text-xs text-gray-500">({p.sku})</span>
                               </li>
                           ))} 
                        </ul>
                    </div>
                    <div className="md:w-1/2 flex flex-col">
                        <h4 className="font-semibold mb-2">Order Items</h4>
                        <ul className="flex-1 overflow-y-auto border rounded-md p-2 space-y-2">
                            {newPOItems.length > 0 ? newPOItems.map(item => {
                                const product = state.products.find(p => p.id === item.productId);
                                return (
                                <li key={item.productId} className="flex items-center justify-between gap-2">
                                    <span className="flex-1 truncate">{product?.name}</span>
                                    <input type="number" min="1" value={item.quantityOrdered} onChange={e => updatePOItemQuantity(item.productId, parseInt(e.target.value) || 1)} className="w-16 px-2 py-1 border rounded-md"/>
                                    <button onClick={() => updatePOItemQuantity(item.productId, 0)} className="text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                </li>
                                )
                            }) : <p className="text-gray-500 text-center pt-4">Select products to add them here.</p>}
                        </ul>
                        <button onClick={handleCreatePO} className="mt-4 w-full py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark">Save PO</button>
                    </div>
                </div>
            </Modal>
            
            {/* Receive Stock Modal */}
            <Modal isOpen={isReceiveModalOpen} onClose={() => setReceiveModalOpen(false)} title={`Receive Stock for ${selectedPO?.poNumber}`}>
                <div className="space-y-4">
                    <ul className="max-h-80 overflow-y-auto space-y-2 pr-2">
                        {selectedPO?.items.map(item => {
                             const product = state.products.find(p => p.id === item.productId);
                             const remaining = item.quantityOrdered - item.quantityReceived;
                             return (
                                <li key={item.productId} className="p-2 border rounded-md grid grid-cols-3 gap-2 items-center">
                                    <div>
                                        <p className="font-semibold truncate">{product?.name}</p>
                                        <p className="text-xs text-gray-500">Received: {item.quantityReceived}/{item.quantityOrdered}</p>
                                    </div>
                                    <input 
                                        type="number" 
                                        placeholder="Qty"
                                        min="0"
                                        max={remaining}
                                        value={receivedQuantities[item.productId] || ''}
                                        onChange={e => setReceivedQuantities({...receivedQuantities, [item.productId]: Math.min(parseInt(e.target.value), remaining) })}
                                        className="w-full px-2 py-1 border rounded-md"
                                        disabled={remaining <= 0}
                                    />
                                    {remaining <=0 && <span className="text-sm text-green-600 text-center">Fulfilled</span>}
                                </li>
                             )
                        })}
                    </ul>
                    <button onClick={handleReceiveItems} className="w-full py-2 px-4 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark">Confirm & Add to Stock</button>
                </div>
            </Modal>
        </div>
    );
};

export default PurchaseOrders;