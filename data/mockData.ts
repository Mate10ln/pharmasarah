
import { Product, Client, Sale, PurchaseOrder } from '../types';

export const mockProducts: Product[] = [
  { id: 'prod1', name: 'Aspirin 100mg', sku: 'ASP100', barcode: '739343011326', category: 'Pain Relief', price: 5.99, costPrice: 2.50, quantity: 150, lowStockThreshold: 20 },
  { id: 'prod2', name: 'Ibuprofen 200mg', sku: 'IBU200', barcode: '739343011327', category: 'Pain Relief', price: 8.49, costPrice: 4.00, quantity: 8, lowStockThreshold: 10 },
  { id: 'prod3', name: 'Paracetamol 500mg', sku: 'PAR500', barcode: '739343011328', category: 'Pain Relief', price: 4.99, costPrice: 2.10, quantity: 200, lowStockThreshold: 25 },
  { id: 'prod4', name: 'Vitamin C 1000mg', sku: 'VITC1000', barcode: '739343011329', category: 'Vitamins', price: 12.99, costPrice: 6.50, quantity: 80, lowStockThreshold: 15 },
  { id: 'prod5', name: 'Amoxicillin 250mg', sku: 'AMX250', barcode: '739343011330', category: 'Antibiotics', price: 15.75, costPrice: 8.00, quantity: 40, lowStockThreshold: 10 },
  { id: 'prod6', name: 'Cough Syrup', sku: 'CSYRUP', barcode: '739343011331', category: 'Cold & Flu', price: 9.99, costPrice: 5.20, quantity: 60, lowStockThreshold: 10 },
  { id: 'prod7', name: 'Band-Aids (Box of 50)', sku: 'BANDAID50', barcode: '739343011332', category: 'First Aid', price: 3.50, costPrice: 1.50, quantity: 300, lowStockThreshold: 50 },
  { id: 'prod8', name: 'Antacid Tablets', sku: 'ANTACID', barcode: '739343011333', category: 'Digestion', price: 7.25, costPrice: 3.75, quantity: 120, lowStockThreshold: 20 },
  { id: 'prod9', name: 'Allergy Relief Pills', sku: 'ALLERGY', barcode: '739343011334', category: 'Allergy', price: 18.99, costPrice: 9.80, quantity: 55, lowStockThreshold: 15 },
];

export const mockClients: Client[] = [
  { id: 'client1', name: 'John Doe', phone: '555-1234', address: '123 Main St, Anytown', email: 'john.doe@example.com' },
  { id: 'client2', name: 'Jane Smith', phone: '555-5678', address: '456 Oak Ave, Anytown', email: 'jane.smith@example.com' },
  { id: 'client3', name: 'Peter Jones', phone: '555-8765', address: '789 Pine Ln, Anytown', email: 'peter.jones@example.com' },
  { id: 'client4', name: 'Mary Johnson', phone: '555-4321', address: '101 Maple Dr, Anytown', email: 'mary.j@example.com' },
];

export const mockSales: Sale[] = [
  {
    id: 'sale1',
    clientId: 'client1',
    items: [{ productId: 'prod1', quantity: 2, price: 5.99 }, { productId: 'prod6', quantity: 1, price: 9.99 }],
    total: 21.97,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Paid',
  },
  {
    id: 'sale2',
    clientId: 'client2',
    items: [{ productId: 'prod3', quantity: 1, price: 4.99 }],
    total: 4.99,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Unpaid',
  },
  {
    id: 'sale3',
    clientId: 'client1',
    items: [{ productId: 'prod4', quantity: 1, price: 12.99 }, { productId: 'prod7', quantity: 1, price: 3.50 }],
    total: 16.49,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Unpaid',
  },
];

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po1',
    poNumber: 'PO-2024-001',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Completed',
    items: [
      { productId: 'prod1', quantityOrdered: 50, quantityReceived: 50 },
      { productId: 'prod2', quantityOrdered: 20, quantityReceived: 20 },
    ],
  },
  {
    id: 'po2',
    poNumber: 'PO-2024-002',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Partially Received',
    items: [
      { productId: 'prod3', quantityOrdered: 100, quantityReceived: 50 },
      { productId: 'prod5', quantityOrdered: 30, quantityReceived: 0 },
    ],
  },
  {
    id: 'po3',
    poNumber: 'PO-2024-003',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    items: [
      { productId: 'prod4', quantityOrdered: 40, quantityReceived: 0 },
    ],
  },
];
