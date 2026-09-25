import { create } from 'zustand';
import { SaleType } from '@pos/shared-types';
import { api } from '../api/axios';   // ⭐ အသစ် import

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
  isLeftNavOpen: boolean;
  toggleLeftNav: () => void;
  addItemByBarcode: (barcode: string) => Promise<void>;
  clearCart: () => void;
}

// Backend က response ပုံစံ
interface IProductFromApi {
  id: string;
  name: string;
  barcode: string;
  price: number;
  saleType: SaleType;
  unitOfMeasurement: string;
  stockQuantity: number;
}

export const useCartStore = create<ICartState>((set, get) => ({
  cartItems: [],
  isLeftNavOpen: true,

  toggleLeftNav: () => set((state) => ({ isLeftNavOpen: !state.isLeftNavOpen })),

  addItemByBarcode: async (barcode: string) => {
    // ⭐ mockDb အစား — Backend API ကို ခေါ်
    const { data: foundProduct } = await api.get<IProductFromApi>(
      `/products/barcode/${encodeURIComponent(barcode)}`,
    );

    const cartItems = get().cartItems;
    const existingItemIndex = cartItems.findIndex(
      (item) => item.barcode === barcode,
    );

    if (existingItemIndex > -1) {
      const updatedCart = [...cartItems];
      const item = updatedCart[existingItemIndex];
      const newQuantity = item.quantity + 1;

      updatedCart[existingItemIndex] = {
        ...item,
        quantity: newQuantity,
        total: newQuantity * item.price,
      };
      set({ cartItems: updatedCart });
    } else {
      const newItem: ICartItem = {
        id: foundProduct.id,                // Backend က UUID ပြန်ပေးတာကို သုံး
        name: foundProduct.name,
        barcode: foundProduct.barcode,
        price: Number(foundProduct.price),  // ⭐ Number ပြောင်း (Decimal ဖြစ်နိုင်)
        quantity: 1,
        saleType: foundProduct.saleType,
        total: Number(foundProduct.price),
      };
      set({ cartItems: [...cartItems, newItem] });
    }
  },

  clearCart: () => set({ cartItems: [] }),
}));