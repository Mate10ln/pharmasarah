import React, { createContext, useContext, useReducer, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { Product, Client, Sale, PurchaseOrder, SaleItem } from '../types';
import { mockProducts, mockClients, mockSales, mockPurchaseOrders } from '../data/mockData';
import useLocalStorage from '../hooks/useLocalStorage';

interface AppState {
  products: Product[];
  clients: Client[];
  sales: Sale[];
  purchaseOrders: PurchaseOrder[];
  notifications: string[];
}

type Action =
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'CREATE_SALE'; payload: Sale }
  | { type: 'UPDATE_SALE_STATUS'; payload: { saleId: string; status: 'Paid' | 'Unpaid' } }
  | { type: 'DELETE_SALE'; payload: { saleId: string, items: SaleItem[] } }
  | { type: 'ADD_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'CREATE_PO'; payload: PurchaseOrder }
  | { type: 'RECEIVE_PO_ITEMS'; payload: { poId: string; receivedItems: { productId: string; quantity: number }[] } }
  | { type: 'DELETE_PO'; payload: string };


const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'ADD_PRODUCT': {
      const existingSkus = state.products.map(p => parseInt(p.sku, 10)).filter(num => !isNaN(num));
      const maxSku = existingSkus.length > 0 ? Math.max(...existingSkus) : 0;
      const newSku = (maxSku + 1).toString().padStart(5, '0');
      
      const newProduct = { ...action.payload, sku: newSku };

      return {
        ...state,
        products: [...state.products, newProduct],
      };
    }
    case 'UPDATE_PRODUCT':
      // Prevent updating to an SKU that already exists, unless it's the same product
      if (state.products.some(p => p.id !== action.payload.id && p.sku.toLowerCase() === action.payload.sku.toLowerCase())) {
          alert('A product with this SKU already exists.');
          return state;
      }
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p),
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };
    case 'ADD_CLIENT':
      return {
        ...state,
        clients: [...state.clients, action.payload],
      };
    case 'UPDATE_CLIENT':
        return {
            ...state,
            clients: state.clients.map(c => c.id === action.payload.id ? action.payload : c)
        };
    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter(c => c.id !== action.payload),
      };
    case 'CREATE_SALE':
      const newProducts = [...state.products];
      let lowStockNotifications: string[] = [];

      action.payload.items.forEach(item => {
        const productIndex = newProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          const oldQuantity = newProducts[productIndex].quantity;
          newProducts[productIndex].quantity -= item.quantity;
          const updatedProduct = newProducts[productIndex];
          if (updatedProduct.quantity <= updatedProduct.lowStockThreshold && oldQuantity > updatedProduct.lowStockThreshold) {
            lowStockNotifications.push(`Low stock alert: ${updatedProduct.name} is now at ${updatedProduct.quantity}.`);
          }
        }
      });
      return {
        ...state,
        products: newProducts,
        sales: [action.payload, ...state.sales],
        notifications: [...state.notifications, ...lowStockNotifications]
      };
    case 'UPDATE_SALE_STATUS':
      return {
        ...state,
        sales: state.sales.map(sale => sale.id === action.payload.saleId ? { ...sale, status: action.payload.status } : sale)
      }
    case 'DELETE_SALE': {
        const productsToUpdate = [...state.products];
        action.payload.items.forEach(item => {
            const productIndex = productsToUpdate.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
            productsToUpdate[productIndex].quantity += item.quantity;
            }
        });
        return {
            ...state,
            products: productsToUpdate,
            sales: state.sales.filter(s => s.id !== action.payload.saleId),
        };
    }
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: []
      };
    case 'CREATE_PO':
      return {
        ...state,
        purchaseOrders: [action.payload, ...state.purchaseOrders],
      };
    case 'RECEIVE_PO_ITEMS': {
      const { poId, receivedItems } = action.payload;
      const updatedProducts = [...state.products];
      const updatedPurchaseOrders = state.purchaseOrders.map(po => {
        if (po.id === poId) {
          const updatedPoItems = po.items.map(item => {
            const received = receivedItems.find(r => r.productId === item.productId);
            if (received && received.quantity > 0) {
              const newReceived = item.quantityReceived + received.quantity;
              item.quantityReceived = Math.min(newReceived, item.quantityOrdered);
              
              const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
              if (productIndex !== -1) {
                updatedProducts[productIndex].quantity += received.quantity;
              }
            }
            return item;
          });

          const totalOrdered = updatedPoItems.reduce((sum, i) => sum + i.quantityOrdered, 0);
          const totalReceived = updatedPoItems.reduce((sum, i) => sum + i.quantityReceived, 0);
          
          let newStatus: 'Pending' | 'Partially Received' | 'Completed' = 'Pending';
          if (totalReceived > 0 && totalReceived < totalOrdered) {
            newStatus = 'Partially Received';
          } else if (totalReceived >= totalOrdered) {
            newStatus = 'Completed';
          }

          return { ...po, items: updatedPoItems, status: newStatus };
        }
        return po;
      });

      return {
        ...state,
        products: updatedProducts,
        purchaseOrders: updatedPurchaseOrders,
      };
    }
    case 'DELETE_PO':
      return {
        ...state,
        purchaseOrders: state.purchaseOrders.filter(po => po.id !== action.payload),
      };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useLocalStorage<AppState>('pharmaSarahState', {
    products: mockProducts,
    clients: mockClients,
    sales: mockSales,
    purchaseOrders: mockPurchaseOrders,
    notifications: [],
  });
  
  const dispatch = useCallback((action: Action) => {
    setState(prevState => appReducer(prevState, action));
  }, [setState]);

  const contextValue = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};