import { create } from 'zustand';
import { SaleType } from '@pos/shared-types';

export interface ICartItem {
  id: string;
  name: string;
  barcode: string;
  price: number;
  quantity: number;
  saleType: SaleType;
  total: number;
}

interface ICartState {
  cartItems: ICartItem[];
  isLeftNavOpen: boolean; // ဘယ်ဘက် Nav Sidebar ၏ ပွင့်/ပိတ် State ⭐
  toggleLeftNav: () => void; // ဘယ်ဘက် Nav Sidebar အား Toggle လုပ်မည့် Function ⭐
  addItemByBarcode: (barcode: string) => Promise<void>;
  clearCart: () => void;
}

export const useCartStore = create<ICartState>((set, get) => ({
  cartItems: [],
  isLeftNavOpen: true, // Default အနေဖြင့် ဘယ်ဘက် Sidebar အား အဖွင့်ထားမည်

  toggleLeftNav: () => set((state) => ({ isLeftNavOpen: !state.isLeftNavOpen })),

  addItemByBarcode: async (barcode: string) => {
    const mockDb: Record<string, { name: string; price: number; saleType: SaleType }> = {
      '8850123456789': { name: 'Coca Cola Can', price: 1500, saleType: SaleType.UNIT },
      '8850987654321': { name: 'City Mart Premium Bread', price: 2800, saleType: SaleType.UNIT },
    };

    const foundProduct = mockDb[barcode];
    if (!foundProduct) {
      throw new Error('ကုန်ပစ္စည်း ရှာမတွေ့ပါ။ Barcode ပြန်လည် စစ်ဆေးပါ!');
    }

    const cartItems = get().cartItems;
    const existingItemIndex = cartItems.findIndex(item => item.barcode === barcode);

    if (existingItemIndex > -1) {
      const updatedCart = [...cartItems];
      const item = updatedCart[existingItemIndex];
      const newQuantity = item.quantity + 1;
      
      updatedCart[existingItemIndex] = {
        ...item,
        quantity: newQuantity,
        total: newQuantity * item.price
      };
      set({ cartItems: updatedCart });
    } else {
      const newItem: ICartItem = {
        id: Math.random().toString(),
        name: foundProduct.name,
        barcode: barcode,
        price: foundProduct.price,
        quantity: 1,
        saleType: foundProduct.saleType,
        total: foundProduct.price
      };
      set({ cartItems: [...cartItems, newItem] });
    }
  },

  clearCart: () => set({ cartItems: [] })
}));