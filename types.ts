
export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  price: number;
  costPrice: number;
  quantity: number;
  lowStockThreshold: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  email: string;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  price: number; // Price at the time of sale
}

export interface Sale {
  id: string;
  clientId: string;
  items: SaleItem[];
  total: number;
  date: string; // ISO string
  status: 'Paid' | 'Unpaid';
}

export interface PurchaseOrderItem {
  productId: string;
  quantityOrdered: number;
  quantityReceived: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string; // ISO string
  items: PurchaseOrderItem[];
  status: 'Pending' | 'Partially Received' | 'Completed';
}


export type AppView = 'dashboard' | 'inventory' | 'clients' | 'sales' | 'reports' | 'purchaseorders';