import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Product } from '../types';
import Modal from './shared/Modal';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, CameraIcon, CloseIcon } from './shared/Icons';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

const BarcodeScanner: React.FC<{ onScan: (result: string) => void; onClose: () => void }> = ({ onScan, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

    const startScan = useCallback(async () => {
        if (!codeReaderRef.current) {
            codeReaderRef.current = new BrowserMultiFormatReader();
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            const deviceId = videoDevices.length > 1 ? videoDevices[1].deviceId : videoDevices[0]?.deviceId;

            if (!deviceId) {
                alert("No camera found.");
                onClose();
                return;
            }

            if (videoRef.current) {
                codeReaderRef.current.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
                    if (result) onScan(result.getText());
                    if (err && !(err instanceof NotFoundException)) console.error(err);
                });
            }
        } catch (error) {
            console.error("Camera access error:", error);
            alert("Could not access camera.");
            onClose();
        }
    }, [onScan, onClose]);

    const stopScan = useCallback(() => {
        codeReaderRef.current?.reset();
    }, []);

    useEffect(() => {
        startScan();
        return () => stopScan();
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

const emptyProduct: Omit<Product, 'id'> = {
    name: '',
    sku: '',
    barcode: '',
    category: '',
    price: 0,
    costPrice: 0,
    quantity: 0,
    lowStockThreshold: 10
};

const Inventory: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productData, setProductData] = useState<Omit<Product, 'id'>>(emptyProduct);
    const [searchTerm, setSearchTerm] = useState('');
    const [isScannerOpen, setScannerOpen] = useState(false);

    useEffect(() => {
        setProductData(editingProduct || emptyProduct);
    }, [editingProduct]);

    const handleOpenModal = (product: Product | null = null) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setProductData(emptyProduct);
    };

    const handleSaveProduct = () => {
        if (!productData.name) {
            alert('Product name is required.');
            return;
        }

        if (editingProduct) {
            dispatch({ type: 'UPDATE_PRODUCT', payload: { ...editingProduct, ...productData } });
        } else {
            dispatch({ type: 'ADD_PRODUCT', payload: { ...productData, id: `prod${Date.now()}` } });
        }

        handleCloseModal();
    };

    const handleDeleteProduct = (product: Product) => {
        if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
            dispatch({ type: 'DELETE_PRODUCT', payload: product.id });
        }
    };

    const filteredProducts = useMemo(() => {
        return state.products
            .filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.category.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [state.products, searchTerm]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumber = e.target.type === 'number';
        setProductData({ ...productData, [name]: isNumber ? parseFloat(value) || 0 : value });
    };

    const handleScannedBarcode = (result: string) => {
        setScannerOpen(false);
        setProductData(prev => ({ ...prev, barcode: result }));
    };

    return (
        <div className="space-y-6">
            {isScannerOpen && <BarcodeScanner onScan={handleScannedBarcode} onClose={() => setScannerOpen(false)} />}
            
            {/* Header & Add button */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Inventory</h1>
                    <p className="text-gray-600 mt-1">Manage your product stock.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg shadow-md hover:bg-brand-blue-dark transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    Add New Product
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search by name, SKU, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-blue focus:border-brand-blue"
                />
            </div>

            {/* Product Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Product Name</th>
                                <th className="px-6 py-3">SKU</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3 text-right">Cost</th>
                                <th className="px-6 py-3 text-right">Price</th>
                                <th className="px-6 py-3 text-right">Quantity</th>
                                <th className="px-6 py-3 text-right">Threshold</th>
                                <th className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => (
                                <tr key={product.id} className={`border-b ${product.quantity <= product.lowStockThreshold ? 'bg-red-50' : 'bg-white'}`}>
                                    <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                                    <td className="px-6 py-4">{product.sku}</td>
                                    <td className="px-6 py-4">{product.category}</td>
                                    <td className="px-6 py-4 text-right">${product.costPrice.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right">${product.price.toFixed(2)}</td>
                                    <td className={`px-6 py-4 text-right font-bold ${product.quantity <= product.lowStockThreshold ? 'text-red-600' : 'text-gray-800'}`}>{product.quantity}</td>
                                    <td className="px-6 py-4 text-right">{product.lowStockThreshold}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            <button onClick={() => handleOpenModal(product)} className="text-brand-blue hover:text-brand-blue-dark" title="Edit Product"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleDeleteProduct(product)} className="text-red-500 hover:text-red-700" title="Delete Product"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingProduct ? "Edit Product" : "Add New Product"}>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="name" type="text" placeholder="Product Name" value={productData.name} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-brand-blue focus:border-brand-blue"/>
                        <input name="category" type="text" placeholder="Category (Optional)" value={productData.category} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-brand-blue focus:border-brand-blue"/>
                        {editingProduct ? (
                            <input name="sku" type="text" placeholder="SKU (Unique)" value={productData.sku} readOnly className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-500"/>
                        ) : (
                            <div className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500">SKU will be auto-generated</div>
                        )}
                        <div className="relative">
                            <input name="barcode" type="text" placeholder="Barcode (Optional)" value={productData.barcode || ''} onChange={handleInputChange} className="w-full pl-3 pr-10 py-2 border rounded-md focus:ring-brand-blue focus:border-brand-blue"/>
                            <button type="button" onClick={() => setScannerOpen(true)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-brand-blue"><CameraIcon className="h-5 w-5"/></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input name="costPrice" type="number" placeholder="Cost Price" value={productData.costPrice || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-brand-blue focus:border-brand-blue"/>
                        <input name="price" type="number" placeholder="Sell Price" value={productData.price || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-brand-blue focus:border-brand-blue"/>
                        <input name="quantity" type="number" placeholder="Quantity" value={productData.quantity || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-brand-blue focus:border-brand-blue"/>
                        <input name="lowStockThreshold" type="number" placeholder="Low Stock Threshold" value={productData.lowStockThreshold || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:ring-brand-blue focus:border-brand-blue"/>
                    </div>

                    <button onClick={handleSaveProduct} className="w-full py-2 px-4 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark transition-colors">
                        Save Product
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default Inventory;
