import { create } from "zustand";
import { SaleType } from "@pos/shared-types";
import { api } from "../api/axios";

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
  // 🛒 တကယ့် ငွေရှင်း API လုပ်ဆောင်ချက် အသစ် ⭐
  submitCheckout: (
    cashReceived: number,
    paymentMethod: string,
  ) => Promise<void>;
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

  toggleLeftNav: () =>
    set((state) => ({ isLeftNavOpen: !state.isLeftNavOpen })),

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
        id: foundProduct.id, // Backend က UUID ပြန်ပေးတာကို သုံး
        name: foundProduct.name,
        barcode: foundProduct.barcode,
        price: Number(foundProduct.price), // ⭐ Number ပြောင်း (Decimal ဖြစ်နိုင်)
        quantity: 1,
        saleType: foundProduct.saleType,
        total: Number(foundProduct.price),
      };
      set({ cartItems: [...cartItems, newItem] });
    }
  },
  // 🚀 အသစ် — ခြင်းတောင်းထဲရှိ ပစ္စည်းအားလုံးအား Nest.js Database Transaction ဆီသို့ လှမ်းပို့မည့် နေရာ ⭐
  submitCheckout: async (cashReceived: number, paymentMethod: string) => {
    const currentCart = get().cartItems;
    if (currentCart.length === 0)
      throw new Error("ခြင်းတောင်းထဲတွင် ပစ္စည်းမရှိပါ");

    const totalAmount = currentCart.reduce((sum, item) => sum + item.total, 0);
    const changeGiven = cashReceived - totalAmount;

    if (changeGiven < 0) {
      throw new Error("ဝယ်သူပေးငွေသည် ကျသင့်ငွေထက် နည်းနေပါသည်");
    }

    // Backend 'CreateOrderDto' က မျှော်လင့်ထားသည့် Payload ပုံစံအတိုင်း ဒေတာအား စနစ်တကျ တည်ဆောက်ခြင်း
    const orderPayload = {
      totalAmount,
      cashReceived,
      changeGiven,
      paymentMethod,
      cashierId: "9f074d0e-953e-4b40-9a3d-425886616238", // ယာယီ စမ်းသပ်မည့် Cashier User UUID
      items: currentCart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
    };

    try {
      // Nest.js Checkout Endpoint ဆီသို့ ဒေတာအား အပြီးသတ် လှမ်းပို့ခြင်း 🎯
      await api.post("/orders/checkout", orderPayload);
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "ငွေရှင်းခြင်း လုပ်ငန်းစဉ် မအောင်မြင်ပါ။ နောက်မှ ပြန်ကြိုးစားပါ";
      throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  },
  clearCart: () => set({ cartItems: [] }),
}));
