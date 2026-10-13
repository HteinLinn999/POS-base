import { create } from "zustand";
import { SaleType } from "@pos/shared-types";
import { api } from "../api/axios";
import { notifications } from "@mantine/notifications";

// ၁။ ခြင်းတောင်းထဲရှိ ကုန်ပစ္စည်းတစ်ခုချင်းစီ၏ Data Structure (Type Safety)
export interface ICartItem {
  id: string;
  name: string;
  barcode: string;
  price: number;
  quantity: number;
  saleType: SaleType;
  total: number;
  stockQuantity: number;
}

// ၂။ အရောင်းဘောက်ချာ (Sales Order) ၏ Data Structure
export interface ISalesOrder {
  id: string;
  totalAmount: number;
  cashReceived: number;
  changeGiven: number;
  paymentMethod: string;
  cashierId: string;
  createdAt: string;
  invoiceNo: string;
  orderItems?: {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    product: { name: string };
  }[];
}

// ၃။ Admin Dashboard ၏ Active Views များ
export type ActiveView =
  | "counter"
  | "inventory"
  | "history"
  | "staff"
  | "crm"
  | "settings";

export interface ICategoryFromApi {
  id: string;
  name: string;
}

export interface ILowStockProduct {
  id: string;
  name: string;
  barcode: string;
  stockQuantity: number;
}

// ၄။ Zustand Store State နှင့် Actions များ သတ်မှတ်ခြင်း
interface ICartState {
  cartItems: ICartItem[];
  isLeftNavOpen: boolean;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  toggleLeftNav: () => void;
  addItemByBarcode: (barcode: string) => Promise<void>;
  submitCheckout: (
    cashReceived: number,
    paymentMethod: string,
  ) => Promise<void>;
  clearCart: () => void;

  salesOrders: ISalesOrder[];
  isSalesLoading: boolean;
  fetchSalesOrders: () => Promise<void>;

  categories: ICategoryFromApi[];
  fetchCategories: () => Promise<void>;

  lowStockItems: ILowStockProduct[];
  fetchLowStockItems: () => Promise<void>;

  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;

  offlineQueue: any[];
  isOnline: boolean;
  syncOfflineOrders: () => Promise<void>;

  currentBranchId: string;
  setCurrentBranchId: (branchId: string) => void;
}

interface IProductFromApi {
  id: string;
  name: string;
  barcode: string;
  price: number;
  saleType: SaleType;
  unitOfMeasurement: string;
  stockQuantity: number;
}

// ၅။ Zustand Store တည်ဆောက်ခြင်း
export const useCartStore = create<ICartState>((set, get) => ({
  cartItems: [],
  isLeftNavOpen: true,
  salesOrders: [],
  isSalesLoading: false,
  activeView: "counter",
  categories: [],
  lowStockItems: [],

  // 🌐 Network status နှင့် LocalStorage မှ offline queue ကို စတင်ဖတ်ရှုခြင်း
  isOnline: typeof window !== "undefined" ? navigator.onLine : true,
  offlineQueue:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("offline_orders_queue") || "[]")
      : [],

  setActiveView: (view: ActiveView) => set({ activeView: view }),
  toggleLeftNav: () =>
    set((state) => ({ isLeftNavOpen: !state.isLeftNavOpen })),

  // 🛒 Barcode ဖြင့် ခြင်းတောင်းထဲသို့ ပစ္စည်းထည့်ခြင်း (Stock Validation ပါဝင်သည်)
  addItemByBarcode: async (barcode: string) => {
    const { data: foundProduct } = await api.get<IProductFromApi>(
      `/products/barcode/${encodeURIComponent(barcode)}`,
    );

    // 🛡️ Stock Validation: ပစ္စည်းလက်ကျန် မရှိပါက (<= 0) ချက်ချင်း Error တက်စေခြင်း
    if (foundProduct.stockQuantity <= 0) {
      throw new Error(
        `ကုန်ပစ္စည်း "${foundProduct.name}" မှာ လက်ကျန် မရှိတော့ပါ`,
      );
    }

    const cartItems = get().cartItems;
    const existingItemIndex = cartItems.findIndex(
      (item) => item.barcode === barcode,
    );

    if (existingItemIndex > -1) {
      const updatedCart = [...cartItems];
      const item = updatedCart[existingItemIndex];

      // 🛡️ လက်ကျန်ပမာဏထက် ကျော်လွန်၍ အရေအတွက် တိုးမရအောင် ကာကွယ်ခြင်း
      if (item.quantity + 1 > foundProduct.stockQuantity) {
        throw new Error(
          `ကုန်ပစ္စည်း "${foundProduct.name}" ၏ လက်ကျန် (${foundProduct.stockQuantity}) ထက် ကျော်လွန်နေပါပြီ`,
        );
      }

      const newQuantity = item.quantity + 1;
      updatedCart[existingItemIndex] = {
        ...item,
        quantity: newQuantity,
        total: newQuantity * item.price,
      };
      set({ cartItems: updatedCart });
    } else {
      const newItem: ICartItem = {
        id: foundProduct.id,
        name: foundProduct.name,
        barcode: foundProduct.barcode,
        price: Number(foundProduct.price),
        quantity: 1,
        saleType: foundProduct.saleType,
        total: Number(foundProduct.price),
        stockQuantity: foundProduct.stockQuantity,
      };
      set({ cartItems: [...cartItems, newItem] });
    }
  },

  // 💳 ငွေရှင်းခြင်း လုပ်ငန်းစဉ် (Offline-First နှင့် Idempotency Key ပါဝင်သည်)
  submitCheckout: async (cashReceived: number, paymentMethod: string) => {
    const currentCart = get().cartItems;
    if (currentCart.length === 0)
      throw new Error("ခြင်းတောင်းထဲတွင် ပစ္စည်းမရှိပါ");

    const totalAmount = currentCart.reduce((sum, item) => sum + item.total, 0);
    const changeGiven = cashReceived - totalAmount;

    if (changeGiven < 0) {
      throw new Error("ဝယ်သူပေးငွေသည် ကျသင့်ငွေထက် နည်းနေပါသည်");
    }

    const orderPayload: any = {
      totalAmount,
      cashReceived,
      changeGiven,
      paymentMethod,
      branchId: get().currentBranchId, 
      cashierId: "9f074d0e-953e-4b40-9a3d-425886616238",
      items: currentCart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      // 🛡️ Idempotency Key: လိုင်းမကောင်း၍ Request ထပ်သွားလျှင် Server တွင် Duplicated Orders များ မဖြစ်စေရန် Unique ID ထည့်ခြင်း
      idempotencyKey: crypto.randomUUID(),
    };

    // 🌐 Offline Mode စစ်ဆေးခြင်း: လိုင်းမရှိပါက LocalStorage ထဲ ယာယီသိမ်းဆည်းမည်
    if (!navigator.onLine) {
      const offlineQueue = [...get().offlineQueue, orderPayload];
      localStorage.setItem(
        "offline_orders_queue",
        JSON.stringify(offlineQueue),
      );
      set({ offlineQueue });

      // 🧹 အော်ဒါသိမ်းပြီးသည်နှင့် ခြင်းတောင်းအား အလိုအလျောက် ရှင်းလင်းခြင်း
      get().clearCart();

      notifications.show({
        title: "အင်တာနက်လိုင်း မရှိပါ (Offline Mode)",
        message:
          "ဘောက်ချာအား Local တွင် သိမ်းဆည်းပြီး လိုင်းပြန်လာပါက Auto Sync လုပ်ပါမည်",
        color: "yellow",
      });
      return;
    }

    try {
      await api.post("/orders/checkout", orderPayload);
      // 🧹 Online ဖြင့် အောင်မြင်ပါက ခြင်းတောင်း ရှင်းလင်းခြင်း
      get().clearCart();
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "ငွေရှင်းခြင်း လုပ်ငန်းစဉ် မအောင်မြင်ပါ။";
      throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  },

  // 🔄 အင်တာနက်လိုင်း ပြန်လာချိန်တွင် Offline Queue ရှိ အော်ဒါများကို Server သို့ Sync တင်ခြင်း
  syncOfflineOrders: async () => {
    const queue = get().offlineQueue;
    if (queue.length === 0 || !navigator.onLine) return;

    try {
      for (const order of queue) {
        await api.post("/orders/checkout", order);
      }
      localStorage.removeItem("offline_orders_queue");
      set({ offlineQueue: [] });
      notifications.show({
        title: "Offline Sync အောင်မြင်သည် 🟢",
        message:
          "လိုင်းပြတ်တောက်စဥ်က ရောင်းချခဲ့သော ဘောက်ချာများ Server သို့ Sync ပြီးပါပြီ",
        color: "teal",
      });
    } catch (e) {
      console.error("Sync failed", e);
    }
  },

  clearCart: () => set({ cartItems: [] }),

  fetchSalesOrders: async () => {
    set({ isSalesLoading: true });
    try {
      const { data } = await api.get<ISalesOrder[]>("/orders");
      set({ salesOrders: data });
    } catch (error) {
      notifications.show({
        title: "ဒေတာဆွဲယူမှု အမှား",
        message: "အရောင်းမှတ်တမ်းများ ယူ၍မရပါ",
        color: "red",
      });
    } finally {
      set({ isSalesLoading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const { data } = await api.get<ICategoryFromApi[]>(
        "/products/categories",
      );
      set({ categories: data });
    } catch (error) {
      console.error("Category ဆွဲယူမှု ကျရှုံးပါသည်", error);
    }
  },

  fetchLowStockItems: async () => {
    try {
      const { data } = await api.get<ILowStockProduct[]>("/products/low-stock");
      set({ lowStockItems: data });
    } catch (error) {
      console.error("Low Stock ဆွဲယူမှု ကျရှုံးပါသည်", error);
    }
  },

  // 🗑️ ခြင်းတောင်းထဲမှ ပစ္စည်းတစ်ခုချင်း ဖျက်ထုတ်ခြင်း
  removeItem: (id: string) => {
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.id !== id),
    }));
  },

  // 🔢 ခြင်းတောင်းထဲရှိ ပစ္စည်းအရေအတွက်ကို တိုး/လျှော့ ချိန်ညှိခြင်း
  updateQuantity: (id: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        item.id === id
          ? { ...item, quantity, total: quantity * item.price }
          : item,
      ),
    }));
  },

  currentBranchId: "default-branch-uuid", // ပုံသေ သို့မဟုတ် ရွေးချယ်ထားသော ဆိုင်ခွဲ ID
  setCurrentBranchId: (branchId: string) => set({ currentBranchId: branchId }),

}));

// 🌐 Window Online/Offline Events များအား အလိုအလျောက် နားထောင်စောင့်ကြည့်ခြင်း
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    useCartStore.getState().syncOfflineOrders();
    useCartStore.setState({ isOnline: true });
  });
  window.addEventListener("offline", () => {
    useCartStore.setState({ isOnline: false });
  });
}
