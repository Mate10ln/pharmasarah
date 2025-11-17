
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { SaleItem, Product, Client } from '../types';
import { BarcodeIcon, TrashIcon, UserIcon, PlusIcon, MinusIcon, SearchIcon, CameraIcon, CloseIcon } from './shared/Icons';
import Modal from './shared/Modal';

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

    useEffect(() => {
        startScan();
        return () => {
            stopScan();
        };
    }, [startScan, stopScan]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center">
            <video ref={videoRef} className="w-full max-w-lg rounded-lg" />
            <button onClick={onClose} className="mt-4 p-3 bg-white rounded-full text-gray-800 shadow-lg">
                <CloseIcon className="h-6 w-6" />
            </button>
        </div>
    );
};

const Sales: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [productSearch, setProductSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [isClientListVisible, setClientListVisible] = useState(false);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [isAddClientModalOpen, setAddClientModalOpen] = useState(false);
  const [newClient, setNewClient] = useState<Omit<Client, 'id'>>({ name: '', phone: '', address: '', email: '' });
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const clientSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);
  
  // Close client list when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
            setClientListVisible(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = useMemo(() => {
    return state.products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [state.products, productSearch]);

  const filteredClients = useMemo(() => {
    return state.clients.filter(c => 
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.includes(clientSearch)
    );
  }, [state.clients, clientSearch]);

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    const productInStock = state.products.find(p => p.id === product.id);
    
    if (!productInStock || productInStock.quantity <= (existingItem?.quantity || 0)) {
        alert(`${product.name} is out of stock or not enough quantity available.`);
        return;
    }

    if (existingItem) {
      setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { productId: product.id, quantity: 1, price: product.price }]);
    }
  };

  const updateQuantity = (productId: string, change: 1 | -1) => {
    const itemInCart = cart.find(item => item.productId === productId);
    if (!itemInCart) return;

    if (change === 1) {
        const productInStock = state.products.find(p => p.id === productId);
        if(!productInStock || productInStock.quantity <= itemInCart.quantity) {
            alert(`Not enough stock for ${productInStock?.name}.`);
            return;
        }
    }

    if (itemInCart.quantity + change <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
    } else {
      setCart(cart.map(item => item.productId === productId ? { ...item, quantity: item.quantity + change } : item));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };
  
  const handleBarcodeLookup = (code: string) => {
    const product = state.products.find(p => p.sku.toLowerCase() === code.toLowerCase() || p.barcode === code);
    if (product) {
        addToCart(product);
        if (barcodeInputRef.current) barcodeInputRef.current.value = '';
    } else {
        alert('Product not found for this SKU/barcode.');
    }
  }

  const handleManualBarcode = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleBarcodeLookup(e.currentTarget.value);
    }
  }

  const handleScannedBarcode = (result: string) => {
    setScannerOpen(false);
    handleBarcodeLookup(result);
  };

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  
  const isSaleCompletable = cart.length > 0 && selectedClientId !== '';

  const completeSale = () => {
    if (!isSaleCompletable) return;
    
    dispatch({
      type: 'CREATE_SALE',
      payload: {
        id: `sale${Date.now()}`,
        clientId: selectedClientId,
        items: cart,
        total,
        date: new Date().toISOString(),
        status: paymentStatus,
      },
    });

    alert('Sale completed successfully!');
    setCart([]);
    setSelectedClientId('');
    setClientSearch('');
    setPaymentStatus('Paid');
  };

  const handleAddClient = () => {
    if(newClient.name && newClient.phone) {
      const newClientId = `client${Date.now()}`;
      dispatch({ type: 'ADD_CLIENT', payload: { ...newClient, id: newClientId } });
      setAddClientModalOpen(false);
      setNewClient({ name: '', phone: '', address: '', email: '' });
      setSelectedClientId(newClientId);
      const addedClient = { ...newClient, id: newClientId };
      setClientSearch(addedClient.name);
    } else {
      alert("Name and phone are required.");
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {isScannerOpen && <BarcodeScanner onScan={handleScannedBarcode} onClose={() => setScannerOpen(false)} />}
      
      {/* Left Side: Product Selection */}
      <div className="lg:w-1/2 flex flex-col bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Products</h2>
        <div className="mb-4 space-y-2">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <BarcodeIcon className="h-5 w-5 text-gray-400" /></div>
                <input ref={barcodeInputRef} type="text" placeholder="Scan or enter SKU..." onKeyDown={handleManualBarcode} className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-brand-blue focus:border-brand-blue" />
                <button onClick={() => setScannerOpen(true)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-brand-blue" title="Scan with camera"><CameraIcon className="h-5 w-5"/></button>
            </div>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="h-5 w-5 text-gray-400" /></div>
                <input type="text" placeholder="Search by name..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-blue focus:border-brand-blue" />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <ul className="space-y-2">
            {filteredProducts.map(product => (
              <li key={product.id} onClick={() => addToCart(product)} className="flex justify-between items-center p-3 rounded-lg hover:bg-brand-gray cursor-pointer transition-colors">
                <div>
                  <p className="font-semibold text-gray-800">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.sku} - In Stock: {product.quantity}</p>
                </div>
                <p className="font-bold text-brand-blue">${product.price.toFixed(2)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Side: Cart */}
      <div className="lg:w-1/2 flex flex-col bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Current Sale</h2>
        <div className="flex-1 overflow-y-auto mb-4">
            {cart.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                    {cart.map(item => {
                        const product = state.products.find(p => p.id === item.productId);
                        if (!product) return null;
                        return (
                            <li key={item.productId} className="py-4 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-800">{product.name}</p>
                                    <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><MinusIcon className="h-4 w-4"/></button>
                                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><PlusIcon className="h-4 w-4"/></button>
                                    <button onClick={() => removeFromCart(item.productId)} className="ml-2 text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5"/></button>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            ) : <p className="text-center text-gray-500 py-16">Cart is empty</p>}
        </div>
        
        <div className="border-t pt-4 space-y-4">
          <div className="relative" ref={clientSearchRef}>
            <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                    <UserIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" value={clientSearch} onChange={(e) => {setClientSearch(e.target.value); setSelectedClientId('');}} onFocus={() => setClientListVisible(true)} placeholder="Search for a client..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-blue focus:border-brand-blue"/>
                </div>
                <button onClick={() => setAddClientModalOpen(true)} className="p-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-dark" title="Add New Client"><PlusIcon className="w-5 h-5"/></button>
            </div>
            {isClientListVisible && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {filteredClients.length > 0 ? filteredClients.map(client => (
                        <li key={client.id} onClick={() => { setSelectedClientId(client.id); setClientSearch(client.name); setClientListVisible(false); }} className="px-4 py-2 hover:bg-brand-gray cursor-pointer">
                            {client.name} - {client.phone}
                        </li>
                    )) : <li className="px-4 py-2 text-gray-500">No clients found.</li>}
                </ul>
            )}
          </div>

          <div className="flex justify-between items-center text-2xl font-bold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setPaymentStatus('Paid')} className={`w-full py-2 rounded-lg ${paymentStatus === 'Paid' ? 'bg-brand-green text-white' : 'bg-gray-200 text-gray-700'}`}>Paid</button>
             <button onClick={() => setPaymentStatus('Unpaid')} className={`w-full py-2 rounded-lg ${paymentStatus === 'Unpaid' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Unpaid</button>
          </div>
          <button 
            onClick={completeSale}
            disabled={!isSaleCompletable}
            title={!isSaleCompletable ? 'Add items to cart and select a client to proceed' : 'Complete Sale'}
            className={`w-full py-3 text-white font-bold rounded-lg transition-colors text-lg ${
                isSaleCompletable 
                ? 'bg-brand-blue hover:bg-brand-blue-dark' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Complete Sale
          </button>
        </div>
      </div>

      <Modal isOpen={isAddClientModalOpen} onClose={() => setAddClientModalOpen(false)} title="Add New Client">
        <div className="space-y-4">
            <input type="text" placeholder="Name" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-blue focus:border-brand-blue" />
            <input type="text" placeholder="Phone" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-blue focus:border-brand-blue" />
            <input type="email" placeholder="Email (Optional)" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-blue focus:border-brand-blue" />
            <input type="text" placeholder="Address (Optional)" value={newClient.address} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-blue focus:border-brand-blue" />
            <button onClick={handleAddClient} className="w-full py-2 px-4 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark transition-colors">Save Client</button>
        </div>
      </Modal>
    </div>
  );
};

export default Sales;
