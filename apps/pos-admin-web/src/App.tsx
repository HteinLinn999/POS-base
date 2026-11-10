import { useState, useRef, useEffect } from 'react';
import {
  TextInput,
  Table,
  Paper,
  Text,
  Button,
  Badge,
  ActionIcon,
  Menu,
  Group,
  Modal,
  NumberInput,
  Select,
  Divider,
} from '@mantine/core';
import { BarChart, DonutChart } from '@mantine/charts';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBarcode,
  IconShoppingCart,
  IconReceipt,
  IconMenu2,
  IconPalette,
  IconBox,
  IconHistory,
  IconUser,
  IconPrinter,
  IconUsers,
  IconSettings,
  IconMinus,
  IconPlus,
  IconTrash,
  IconBuildingStore,
  IconAdjustments,
  IconTruckDelivery,
  IconReportMoney
} from '@tabler/icons-react';
import { SaleType } from '@pos/shared-types';
import { useCartStore, type ActiveView } from './store/useCartStore';

import { api } from './api/axios';
import { BranchStockView } from './pages/BranchStockView';
import { BranchSettingsView } from './pages/BranchSettingsView';
import { SalesHistoryView } from './pages/SalesHistoryView';
import { StockAdjustmentView } from './pages/StockAdjustmentView';
import { GoodsReceivingView } from './pages/GoodsReceivingView';
import { ZReportView } from './pages/ZReportView';

interface IThemeConfig {
  id: string;
  name: string;
  bg: string;
  panel: string;
  border: string;
  primaryText: string;
  badgeColor: string;
  inputBg: string;
}

const POS_THEMES: IThemeConfig[] = [
  { id: 'midnight', name: 'Midnight Dark 🌙', bg: 'bg-[#16171d]', panel: 'bg-[#1f2028]', border: 'border-[#2e303a]', primaryText: 'text-[#00d8ff]', badgeColor: 'cyan', inputBg: '#1f2028' },
  { id: 'emerald', name: 'Clean Emerald 🧼', bg: 'bg-[#0f172a]', panel: 'bg-[#1e293b]', border: 'border-[#334155]', primaryText: 'text-[#10b981]', badgeColor: 'teal', inputBg: '#1e293b' },
  { id: 'ocean', name: 'Ocean Cyan 💎', bg: 'bg-[#0c4a6e]', panel: 'bg-[#0284c7]', border: 'border-[#38bdf8]', primaryText: 'text-[#e0f2fe]', badgeColor: 'blue', inputBg: '#0284c7' },
  { id: 'amber', name: 'Cyberpunk Amber 🔥', bg: 'bg-[#1a1105]', panel: 'bg-[#261a0c]', border: 'border-[#402e12]', primaryText: 'text-[#f59e0b]', badgeColor: 'orange', inputBg: '#261a0c' },
  { id: 'amethyst', name: 'Royal Amethyst 🍇', bg: 'bg-[#1e1b4b]', panel: 'bg-[#312e81]', border: 'border-[#4338ca]', primaryText: 'text-[#a78bfa]', badgeColor: 'grape', inputBg: '#312e81' }
];

// Desktop POS workspace sizing. The center workspace always keeps at least
// MAIN_MIN_WIDTH, so dragging either side panel cannot squeeze it indefinitely.
const SIDEBAR_DEFAULT_WIDTH = 240;
const SIDEBAR_MIN_WIDTH = 72;
const SIDEBAR_MAX_WIDTH = 320;
const SIDEBAR_LABEL_THRESHOLD = 220;
const COUNTER_DEFAULT_WIDTH = 380;
const COUNTER_MIN_WIDTH = 300;
const COUNTER_MAX_WIDTH = 520;
const MAIN_MIN_WIDTH = 360;
const RESIZE_HANDLE_WIDTH = 10;
const RESIZE_RESERVED_SPACE = MAIN_MIN_WIDTH + RESIZE_HANDLE_WIDTH * 2 + 4;

type ResizeTarget = 'sidebar' | 'counter';

interface ResizeDragState {
  target: ResizeTarget;
  pointerId: number;
  startX: number;
  startWidth: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

function App() {
  const [barcode, setBarcode] = useState<string>('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(SIDEBAR_DEFAULT_WIDTH);
  const [counterWidth, setCounterWidth] = useState<number>(COUNTER_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const layoutRef = useRef<HTMLDivElement>(null);
  const resizeDragRef = useRef<ResizeDragState | null>(null);
  const [activeTheme, setActiveTheme] = useState<IThemeConfig>(POS_THEMES[0]);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSidebarExpanded = sidebarWidth >= SIDEBAR_LABEL_THRESHOLD;

  const [cashReceived, setCashReceived] = useState<number | string>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [loading, setLoading] = useState<boolean>(false);

  const [opened, { open, close }] = useDisclosure(false);
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [prodName, setProdName] = useState<string>('');
  const [prodBarcode, setProdBarcode] = useState<string>('');
  const [prodSku, setProdSku] = useState<string>('');
  const [prodPrice, setProdPrice] = useState<number | string>('');
  const [prodCost, setProdCost] = useState<number | string>('');
  const [prodStock, setProdStock] = useState<number | string>('');
  const [prodSaleType, setProdSaleType] = useState<string>('UNIT');
  const [prodUnit, setProdUnit] = useState<string>('Pcs');
  const [prodCategoryId, setProdCategoryId] = useState<string>('9f074d0e-953e-4b40-9a3d-425886616238');
  const [formLoading, setFormLoading] = useState<boolean>(false);

  const {
    cartItems,
    addItemByBarcode,
    clearCart,
    submitCheckout,
    activeView,
    setActiveView,
    fetchSalesOrders,
    salesOrders,
    categories,
    lowStockItems,
    removeItem,
    updateQuantity,
    selectedCustomer,
    setSelectedCustomer,
    searchCustomerByPhone
  } = useCartStore();

  // 1. Store မှ fetchBranches နှင့် branches များကို ယူသုံးရန်
  const { branches, fetchBranches, currentBranchId, setCurrentBranchId } = useCartStore();

  // 2. App စတင် တင်ვიလာချိန် (Mount ဖြစ်ချိန်) တွင် တစ်ကြိမ်တည်း Branch များကို လှမ်းဆွဲရန်
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);
  // }, []);

  // 3. Select အတွက် data ကို သီးသန့် variable ဖြင့် ပြင်ဆင်ခြင်း (Infinite Loop မတက်စေရန်)
  const branchDropdownData = branches.map((b: any) => ({
    value: b.id,
    label: `${b.name} (${b.code})`
  }));

  const [memberModalOpened, { open: openMemberModal, close: closeMemberModal }] = useDisclosure(false);
  const [searchPhone, setSearchPhone] = useState<string>('');

  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; shift: string }>({
    id: 'default-cashier-id',
    name: 'cashier_01',
    shift: 'MORNING SHIFT'
  });


  useEffect(() => {
    if (!opened && !memberModalOpened) {
      inputRef.current?.focus();
    }

    useCartStore.getState().fetchLowStockItems();
    if (activeView === 'history') {
      fetchSalesOrders();
    }
  }, [activeView, fetchSalesOrders, opened, memberModalOpened]);


  useEffect(() => {
    if (activeView === 'inventory') {
      useCartStore.getState().fetchCategories();
    }
  }, [activeView]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (cartItems.length > 0) open();
      }
      if (e.key === 'F4') {
        e.preventDefault();
        openMemberModal();
      }
      if (e.key === 'Escape') {
        if (cartItems.length > 0) {
          e.preventDefault();
          clearCart();
          notifications.show({
            title: 'ခြင်းတောင်း ရှင်းလင်းပြီးပါပြီ 🧹',
            message: 'ခြင်းတောင်းထဲရှိ ပစ္စည်းစာရင်းများအားလုံးကို ရှင်းလင်းလိုက်ပါသည်',
            color: 'orange',
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, open, clearCart]);

  useEffect(() => {
    if (opened) {
      const totalAmount = cartItems.reduce((sum: number, item) => sum + item.total, 0);
      setCashReceived(totalAmount);
    }
  }, [opened, cartItems]);

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      await addItemByBarcode(barcode);
      notifications.show({
        title: 'ပစ္စည်း ထည့်ပြီးပါပြီ',
        message: `Barcode: ${barcode} အား ခြင်းတောင်းထဲ ထည့်သွင်းအောင်မြင်သည်`,
        color: 'teal',
        icon: <IconShoppingCart size={16} />,
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? error?.message ?? 'မသိသော အမှားတစ်ခု ဖြစ်ပွားခဲ့သည်';
      notifications.show({
        title: 'အရောင်းအမှား',
        message: Array.isArray(msg) ? msg.join(', ') : msg,
        color: 'red',
        icon: <IconBarcode size={16} />,
      });
    }
    setBarcode('');
  };

  const grandTotal = cartItems.reduce((sum: number, item) => sum + item.total, 0);
  const changeGiven = Number(cashReceived) - grandTotal;

  const handleFinalCheckout = async () => {
    setLoading(true);
    try {
      await submitCheckout(Number(cashReceived), paymentMethod);
      window.print();
      notifications.show({
        title: 'အရောင်းအောင်မြင်ပါသည်',
        message: 'ဘောက်ချာအား ဒေတာဘေ့စ်ထဲ သိမ်းဆည်းပြီး ပရင့်ထုတ်ပြီးပါပြီ',
        color: 'green',
        icon: <IconReceipt size={16} />,
      });
      clearCart();
      close();
    } catch (error: any) {
      notifications.show({
        title: 'ငွေရှင်းမှု ကျရှုံးပါသည်',
        message: error.message,
        color: 'red',
        icon: <IconReceipt size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodBarcode || !prodSku) {
      notifications.show({ title: 'ဖြည့်စွက်ရန် လိုအပ်ပါသည်', message: 'အမည်၊ ဘားကုဒ် နှင့် SKU ကုဒ်များအား ဖြည့်စွက်ပါ', color: 'orange' });
      return;
    }

    setFormLoading(true);
    try {
      await api.post('/products', {
        name: prodName,
        barcode: prodBarcode,
        sku: prodSku,
        price: Number(prodPrice) || 0,
        cost: Number(prodCost) || 0,
        stockQuantity: Number(prodStock) || 0,
        saleType: prodSaleType,
        unitOfMeasurement: prodUnit,
        categoryId: prodCategoryId
      });

      notifications.show({ title: 'သိမ်းဆည်းပြီးပါပြီ 🟢', message: `ကုန်ပစ္စည်း: ${prodName} အား ဒေတာဘေ့စ်ထဲသို့ အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ`, color: 'teal' });
      setProdName(''); setProdBarcode(''); setProdSku(''); setProdPrice(''); setProdCost(''); setProdStock('');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'ပစ္စည်းအသစ်ဆောက်မှု ကျရှုံးပါသည်';
      notifications.show({ title: 'သိမ်းဆည်းမှု မအောင်မြင်ပါ ❌', message: Array.isArray(msg) ? msg.join(', ') : msg, color: 'red' });
    } finally {
      setFormLoading(false);
    }
  };

  const getLayoutWidth = () =>
    layoutRef.current?.getBoundingClientRect().width ??
    (typeof window !== 'undefined' ? window.innerWidth : 1440);

  const getMaxSidebarWidth = () =>
    clamp(
      getLayoutWidth() - counterWidth - RESIZE_RESERVED_SPACE,
      SIDEBAR_MIN_WIDTH,
      SIDEBAR_MAX_WIDTH,
    );

  const getMaxCounterWidth = () =>
    clamp(
      getLayoutWidth() - sidebarWidth - RESIZE_RESERVED_SPACE,
      COUNTER_MIN_WIDTH,
      COUNTER_MAX_WIDTH,
    );

  const startPanelResize = (
    target: ResizeTarget,
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    // Only the primary mouse button or touch/pen contact can start a resize.
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeDragRef.current = {
      target,
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: target === 'sidebar' ? sidebarWidth : counterWidth,
    };
    setIsResizing(true);
  };

  const movePanelResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = resizeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;

    if (drag.target === 'sidebar') {
      // Moving the left divider right increases the sidebar width.
      setSidebarWidth(clamp(
        drag.startWidth + deltaX,
        SIDEBAR_MIN_WIDTH,
        getMaxSidebarWidth(),
      ));
    } else {
      // Moving the right divider left increases the counter panel width.
      setCounterWidth(clamp(
        drag.startWidth - deltaX,
        COUNTER_MIN_WIDTH,
        getMaxCounterWidth(),
      ));
    }
  };

  const stopPanelResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (resizeDragRef.current?.pointerId !== event.pointerId) return;

    resizeDragRef.current = null;
    setIsResizing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleResizeKeyDown = (
    target: ResizeTarget,
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    const step = event.shiftKey ? 32 : 12;
    const minWidth = target === 'sidebar' ? SIDEBAR_MIN_WIDTH : COUNTER_MIN_WIDTH;
    const maxWidth = target === 'sidebar' ? getMaxSidebarWidth() : getMaxCounterWidth();
    const currentWidth = target === 'sidebar' ? sidebarWidth : counterWidth;

    let nextWidth = currentWidth;
    if (event.key === 'Home') nextWidth = minWidth;
    else if (event.key === 'End') nextWidth = maxWidth;
    else if (target === 'sidebar' && event.key === 'ArrowLeft') nextWidth -= step;
    else if (target === 'sidebar' && event.key === 'ArrowRight') nextWidth += step;
    else if (target === 'counter' && event.key === 'ArrowLeft') nextWidth += step;
    else if (target === 'counter' && event.key === 'ArrowRight') nextWidth -= step;
    else return;

    event.preventDefault();
    const safeWidth = clamp(nextWidth, minWidth, maxWidth);
    if (target === 'sidebar') setSidebarWidth(safeWidth);
    else setCounterWidth(safeWidth);
  };

  // Prevent text selection and keep a consistent resize cursor while dragging.
  useEffect(() => {
    if (!isResizing) return;

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [isResizing]);

  return (
    <div
      ref={layoutRef}
      style={{
        '--sidebar-width': `${sidebarWidth}px`,
        '--counter-width': `${counterWidth}px`,
      } as React.CSSProperties}
      className={`relative flex h-screen min-h-0 w-full min-w-0 flex-col overflow-hidden lg:flex-row
        ${activeTheme.bg} text-[#f3f4f6] transition-colors duration-300`}
    >
      {isMobileNavOpen && (
        <button
          type="button"
          aria-label="Sidebar ပိတ်ရန်"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden print:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      <nav
        id="primary-sidebar"
        aria-label="Primary navigation"
        className={`${activeTheme.panel} fixed inset-y-0 left-0 z-50 flex h-full w-[min(85vw,280px)] shrink-0
          flex-col justify-between overflow-hidden border-r ${activeTheme.border} px-4 py-6
          transform transition-transform duration-300 ease-in-out print:hidden
          lg:relative lg:inset-auto lg:z-auto lg:visible lg:translate-x-0 lg:w-[var(--sidebar-width)]
          ${isMobileNavOpen ? 'visible translate-x-0' : '-translate-x-full invisible lg:visible'}
          ${isSidebarExpanded ? 'lg:px-4' : 'lg:px-2'}`}
      >
        <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-6">
          <div className={`flex  w-full shrink-0 items-center overflow-hidden px-2 ${isSidebarExpanded || isMobileNavOpen ? 'justify-start gap-3' : 'justify-center lg:gap-0'}`}>
            <IconReceipt size={32} className={`${activeTheme.primaryText} shrink-0`} />
            {(isSidebarExpanded || isMobileNavOpen) && (
              <span className="whitespace-nowrap text-lg font-bold tracking-wide text-white">CITY MART</span>
            )}
          </div>

          <div className={`flex min-h-0 min-w-0 w-full flex-1 flex-col gap-1 overflow-x-auto overflow-y-auto  pr-1 ${!isSidebarExpanded && !isMobileNavOpen ? 'lg:items-center lg:overflow-x-hidden' : ''}`}>
            <div className={`flex flex-col gap-1 ${isSidebarExpanded || isMobileNavOpen ? 'w-max min-w-full' : 'w-full min-w-0'}`}>
              {[
                { id: 'counter', label: 'အရောင်းကောင်တာ', icon: <IconShoppingCart size={20} /> },
                { id: 'inventory', label: 'ပစ္စည်းအဝင်/အထွက်', icon: <IconBox size={20} /> },
                { id: 'branch-stocks', label: 'ဆိုင်ခွဲအလိုက် လက်ကျန်', icon: <IconBuildingStore size={20} /> },
                { id: 'stock-adjustment', label: 'စာရင်းညှိနှိုင်းခြင်းနှင့် မှတ်တမ်း', icon: <IconAdjustments size={20} /> },
                { id: 'goods-receiving', label: 'ကုန်ပစ္စည်းအဝင် (PO/Receiving)', icon: <IconTruckDelivery size={20} /> },
                { id: 'branch-settings', label: 'ဆိုင်ခွဲများ စီမံရန်', icon: <IconBuildingStore size={20} /> },
                { id: 'history', label: 'အရောင်းမှတ်တမ်း', icon: <IconHistory size={20} /> },
                { id: 'z-report', label: 'နေ့ချုပ်နှင့် Shift ပိတ်ခြင်း (Z-Report)', icon: <IconReportMoney size={20} /> },
                { id: 'crm', label: 'ဖောက်သည်အသင်းဝင် (CRM)', icon: <IconUsers size={20} /> },
                { id: 'staff', label: 'ဝန်ထမ်းစီမံရန်', icon: <IconUser size={20} /> },
                { id: 'settings', label: 'ဆိုင်ဆက်တင်များ', icon: <IconSettings size={20} /> },
              ].map((menu) => (
                <Button
                  key={menu.id}
                  type="button"
                  aria-label={menu.label}
                  title={!isSidebarExpanded && !isMobileNavOpen ? menu.label : undefined}
                  variant={activeView === menu.id ? 'filled' : 'subtle'}
                  color={activeView === menu.id ? activeTheme.badgeColor : 'gray'}
                  className={`h-11 shrink-0 ${isSidebarExpanded || isMobileNavOpen ? 'w-max min-w-full' : 'w-full min-w-0'}`}
                  size="md"
                  leftSection={menu.icon}
                  onClick={() => {
                    setActiveView(menu.id as ActiveView);
                    setIsMobileNavOpen(false);
                  }}
                  styles={{
                    root: {
                      paddingInline: isSidebarExpanded || isMobileNavOpen ? undefined : 0,
                    },
                    inner: {
                      justifyContent: isSidebarExpanded || isMobileNavOpen ? 'flex-start' : 'center',
                    },
                    section: {
                      marginInlineEnd: isSidebarExpanded || isMobileNavOpen ? undefined : 0,
                    },
                    label: {
                      display: isSidebarExpanded || isMobileNavOpen ? undefined : 'none',
                      flex: isSidebarExpanded || isMobileNavOpen ? 1 : '0 0 auto',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                    },
                  }}
                >
                  {(isSidebarExpanded || isMobileNavOpen) && (
                    <span className="whitespace-nowrap text-base font-medium">{menu.label}</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`w-full shrink-0 cursor-pointer overflow-hidden rounded-lg border border-[#2e303a] bg-[#16171d] p-3 hover:bg-[#1f2028] ${!isSidebarExpanded && !isMobileNavOpen ? 'lg:flex lg:justify-center lg:p-2' : ''}`}
          onClick={() => {
            setCurrentUser(prev => ({
              id: prev.name === 'cashier_01' ? 'admin-user-uuid-02' : 'cashier-user-uuid-01',
              name: prev.name === 'cashier_01' ? 'manager_admin' : 'cashier_01',
              shift: prev.name === 'cashier_01' ? 'NIGHT SHIFT' : 'MORNING SHIFT'
            }));
            notifications.show({ title: 'Shift ဂျာစာရင်းပြောင်းလဲခြင်း', message: 'ဝန်ထမ်းအကောင့်နှင့် တာဝန်ကျချိန်အား ပြောင်းလဲလိုက်ပါသည်', color: 'blue' });
          }}
        >
          <Group gap="xs" wrap="nowrap" justify={isSidebarExpanded || isMobileNavOpen ? 'flex-start' : 'center'}>
            <ActionIcon variant="light" color={activeTheme.badgeColor} size="md" radius="xl">
              <IconUser size={18} />
            </ActionIcon>
            {(isSidebarExpanded || isMobileNavOpen) && (
              <div className="flex min-w-0 flex-col truncate">
                <Text size="xs" className="truncate font-bold text-white">{currentUser.name}</Text>
                <Text size="10px" className="font-semibold tracking-wider text-gray-500">{currentUser.shift}</Text>
              </div>
            )}
          </Group>
        </div>
      </nav>

      {activeView === 'counter' && (
        <div
          role="separator"
          aria-label="Sidebar အကျယ်ပြောင်းရန်"
          aria-orientation="vertical"
          aria-valuemin={SIDEBAR_MIN_WIDTH}
          aria-valuemax={getMaxSidebarWidth()}
          aria-valuenow={Math.round(sidebarWidth)}
          aria-valuetext={`${Math.round(sidebarWidth)} pixels`}
          tabIndex={0}
          title="ဖိဆွဲပြီး Sidebar အကျယ်ပြောင်းပါ။ Arrow keys ဖြင့်လည်း ပြောင်းနိုင်သည်။"
          className="group hidden w-2.5 shrink-0 cursor-col-resize touch-none select-none items-center justify-center bg-transparent outline-none hover:bg-cyan-500/10 focus-visible:bg-cyan-500/10 lg:flex"
          onPointerDown={(event) => startPanelResize('sidebar', event)}
          onPointerMove={movePanelResize}
          onPointerUp={stopPanelResize}
          onPointerCancel={stopPanelResize}
          onLostPointerCapture={() => {
            resizeDragRef.current = null;
            setIsResizing(false);
          }}
          onKeyDown={(event) => handleResizeKeyDown('sidebar', event)}
          onDoubleClick={() => setSidebarWidth(SIDEBAR_DEFAULT_WIDTH)}
        >
          <span className="h-12 w-1 rounded-full bg-[#4b5563] transition-colors group-hover:bg-cyan-400 group-focus-visible:bg-cyan-400" />
        </div>
      )}

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3 sm:p-4 lg:min-w-[360px] lg:p-6 print:hidden">
        <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-6 sm:gap-4">
          <ActionIcon
            variant="light"
            color="cyan"
            size="xl"
            radius="md"
            onClick={() => {
              if (window.matchMedia('(max-width: 1023px)').matches) {
                setIsMobileNavOpen(true);
              } else {
                setSidebarWidth((currentWidth) =>
                  currentWidth >= SIDEBAR_LABEL_THRESHOLD
                    ? SIDEBAR_MIN_WIDTH
                    : SIDEBAR_DEFAULT_WIDTH,
                );
              }
            }}
            title="Sidebar ဖွင့်/ပိတ်ရန်"
            aria-label="Sidebar ဖွင့်/ပိတ်ရန်"
            aria-controls="primary-sidebar"
            aria-expanded={isSidebarExpanded}
          >
            <IconMenu2 size={24} />
          </ActionIcon>

          {
            activeView === 'counter' && (
              <form onSubmit={handleBarcodeSubmit} className="min-w-0 flex-1 basis-full sm:basis-auto">
                <TextInput
                  ref={inputRef}
                  leftSection={<IconBarcode size={26} className="text-cyan-400 animate-pulse" />}
                  placeholder="စမ်းသပ်ရန် Barcode စကန်ဖတ်ပါ (8850001234567)..."
                  size="lg"
                  radius="md"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  styles={{
                    input: {
                      backgroundColor: activeTheme.inputBg,
                      color: '#ffffff',
                      fontSize: '16px',
                      border: '2px solid #00d8ff', // ထင်ရှားစေရန် Border အရောင်ထည့်ခြင်း

                    },
                  }}
                />
              </form>
            )}
          {activeView !== 'counter' &&
            <div className="flex-1">
              <Text size="xl" className="text-white font-bold capitalize">
                {activeView} Dashboard
              </Text>
            </div>
          }

          {
            (activeView === 'branch-stocks' ||
              activeView === 'history' ||
              activeView === 'inventory' ||
              activeView === 'counter' ||
              activeView === 'stock-adjustment' ||
              activeView === 'goods-receiving' ||
              activeView === 'z-report') && (
              <Select
                placeholder="ဆိုင်ခွဲရွေးချယ်ပါ"
                data={branchDropdownData}
                value={currentBranchId}
                onChange={(val) => {
                  //  console.log('currentBranchId :', val)
                  if (val) {
                    setCurrentBranchId(val);
                    notifications.show({
                      title: 'ဆိုင်ခွဲပြောင်းလဲပြီးပါပြီ 🟢',
                      message: 'လက်ရှိရောင်းချမည့် ဆိုင်ခွဲကို အောင်မြင်စွာ ပြောင်းလိုက်ပါပြီ',
                      color: 'teal'
                    });
                  }
                }}
                styles={{
                  root: { width: 'min(220px, 100%)' },
                  input: { backgroundColor: activeTheme.inputBg, color: '#fff', border: '1px solid #2e303a', width: '100%' }
                }}
              />
            )
          }


          <Menu shadow="md" width={200} trigger="click" position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="light" color="cyan" size="xl" radius="md" title="Theme ပြောင်းရန်">
                <IconPalette size={24} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown className="border-[#2e303a] bg-[#1f2028]">
              <Menu.Label className="font-bold text-gray-400">POS Themes ရွေးချယ်ပါ</Menu.Label>
              {POS_THEMES.map((t) => (
                <Menu.Item key={t.id} className="text-white transition-colors duration-200 hover:bg-[#2e303a]" onClick={() => setActiveTheme(t)}>
                  <Group gap="xs">
                    <div className={`h-3 w-3 rounded-full ${t.bg}`} />
                    <Text size="sm">{t.name}</Text>
                  </Group>
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </div>

        {activeView === 'counter' ? (
          <Paper className={`flex-1 min-h-0 min-w-0 overflow-hidden rounded-lg border ${activeTheme.panel} ${activeTheme.border}`} radius="md">
            <div className="h-full w-full overflow-auto">
              <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover className="w-full min-w-[900px]">
                <Table.Thead className={`${activeTheme.bg} sticky top-0 z-10`}>
                  <Table.Tr>
                    <Table.Th className="border-b border-gray-700 font-semibold text-gray-400">စဉ်</Table.Th>
                    <Table.Th className="border-b border-gray-700 font-semibold text-gray-400">ကုန်ပစ္စည်းအမည်</Table.Th>
                    <Table.Th className="border-b border-gray-700 font-semibold text-gray-400">ဘားကုဒ်</Table.Th>
                    <Table.Th className="border-b border-gray-700 font-semibold text-gray-400">ဈေးနှုန်း</Table.Th>
                    <Table.Th className="border-b border-gray-700 font-semibold text-gray-400">အရေအတွက်</Table.Th>
                    <Table.Th className="border-b border-gray-700 font-semibold text-gray-400">စုစုပေါင်း ကျသင့်ငွေ</Table.Th>
                    <Table.Th className="text-gray-400 text-center">လုပ်ဆောင်ချက်</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {cartItems.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={7} className="border-none py-20 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-3">
                          <IconShoppingCart size={48} className="animate-pulse text-gray-500" />
                          <Text size="lg">ခြင်းတောင်းထဲတွင် ပစ္စည်းမရှိသေးပါ။ Barcode စကန်ဖတ်မှုကို စတင်ပါ။</Text>
                        </div>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    cartItems.map((item, index: number) => (
                      <Table.Tr key={item.id} className={`border-b ${activeTheme.border}`}>
                        <Table.Td>{index + 1}</Table.Td>
                        <Table.Td className="font-medium text-white">{item.name}</Table.Td>
                        <Table.Td className="font-mono text-gray-300">{item.barcode}</Table.Td>
                        <Table.Td>{item.price.toLocaleString()} MMK</Table.Td>
                        <Table.Td>
                          <Group justify="center" gap="xs">
                            <ActionIcon size="sm" color="gray" variant="subtle" onClick={() => updateQuantity(item.id, item.quantity - 1)}><IconMinus size={14} /></ActionIcon>
                            <Badge variant="light" size="lg" color="cyan" className="font-mono font-bold">
                              {item.quantity} {item.saleType === SaleType.WEIGHT ? 'Kg' : 'Pcs'}
                            </Badge>
                            <ActionIcon size="sm" color="gray" variant="subtle" onClick={() => updateQuantity(item.id, item.quantity + 1)}><IconPlus size={14} /></ActionIcon>
                          </Group>
                          <Badge
                            color={item.stockQuantity <= 10 ? 'red' : 'gray'}
                            variant={item.stockQuantity <= 10 ? 'filled' : 'light'}
                            size="sm"
                            className={item.stockQuantity <= 10 ? 'animate-pulse font-bold' : ''}
                          >
                            {item.stockQuantity <= 10 ? `လက်ကျန်ပြတ်လုနီးပါး (${item.stockQuantity})` : `လက်ကျန်အဆင်ပြေ (${item.stockQuantity})`}
                          </Badge>
                        </Table.Td>
                        <Table.Td className="font-semibold text-[#10b981]">{item.total.toLocaleString()} MMK</Table.Td>
                        <Table.Td className="text-center">
                          <ActionIcon color="red" variant="subtle" onClick={() => removeItem(item.id)} title="ပယ်ဖျက်ရန်"><IconTrash size={18} /></ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </div>
          </Paper>
        ) : activeView === 'branch-stocks' ? (
          <BranchStockView currentBranchId={currentBranchId} />
        ) : activeView === 'branch-settings' ? (
          <BranchSettingsView />
        ) : activeView === 'stock-adjustment' ? (
          <StockAdjustmentView currentBranchId={currentBranchId} />
        ) : activeView === 'goods-receiving' ? (
          <GoodsReceivingView currentBranchId={currentBranchId} />
        ) : activeView === 'history' ? (
          // <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-y-auto pr-2">
          //   <div className="grid grid-cols-3 gap-4 shrink-0">
          //     <Paper p="md" radius="md" className={`${activeTheme.panel} border ${activeTheme.border}`}>
          //       <Text size="xs" color="gray" fw={700} className="tracking-wider">TOTAL REVENUE (စုစုပေါင်း အရောင်းရငွေ)</Text>
          //       <Text size="28px" fw={900} className="text-[#10b981] mt-1 font-mono">
          //         {salesOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()} <span className="text-xs font-bold">MMK</span>
          //       </Text>
          //     </Paper>

          //     <Paper p="md" radius="md" className={`${activeTheme.panel} border ${activeTheme.border}`}>
          //       <Text size="xs" color="gray" fw={700} className="tracking-wider">TOTAL INVOICES (စုစုပေါင်း ဘောက်ချာစောင်ရေ)</Text>
          //       <Text size="28px" fw={900} className="text-[#00d8ff] mt-1 font-mono">
          //         {salesOrders.length} <span className="text-xs font-bold">စောင်</span>
          //       </Text>
          //     </Paper>

          //     <Paper p="md" radius="md" className={`${activeTheme.panel} border ${activeTheme.border}`}>
          //       <Text size="xs" color="gray" fw={700} className="tracking-wider">AVERAGE BASKET (ပျမ်းမျှကျသင့်ငွေ)</Text>
          //       <Text size="28px" fw={900} className="text-orange-400 mt-1 font-mono">
          //         {salesOrders.length > 0
          //           ? Math.round(salesOrders.reduce((sum, o) => sum + o.totalAmount, 0) / salesOrders.length).toLocaleString()
          //           : 0
          //         } <span className="text-xs font-bold">MMK</span>
          //       </Text>
          //     </Paper>
          //   </div>

          //   {salesOrders.length > 0 && (
          //     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          //       <Paper p="xl" radius="md" className="bg-[#1f2028] border border-[#2e303a] md:col-span-2">
          //         <div className="mb-4">
          //           <Text size="sm" fw={800} className="text-white">DAILY SALES REVENUE (နေ့ရက်အလိုက် အရောင်းရငွေပြဇယား)</Text>
          //           <Text size="11px" className="text-gray-500 font-mono mt-0.5">PostgreSQL Daily Time-Series Revenue Volumes</Text>
          //         </div>
          //         <BarChart
          //           h={220}
          //           data={salesOrders.map((order) => ({
          //             date: new Date(order.createdAt).toLocaleDateString('en-MM', { month: 'short', day: 'numeric' }),
          //             "အရောင်းရငွေ (MMK)": Number(order.totalAmount)
          //           })).reverse()}
          //           dataKey="date"
          //           series={[{ name: 'အရောင်းရငွေ (MMK)', color: 'cyan.6' }]}
          //           tickLine="y"
          //           gridAxis="x"
          //           textColor="#9ca3af"
          //           className="font-mono text-xs"
          //         />
          //       </Paper>

          //       <Paper p="xl" radius="md" className="bg-[#1f2028] border border-[#2e303a] flex flex-col">
          //         <div className="mb-4">
          //           <Text size="sm" fw={800} className="text-white">CATEGORY SALES SHARE (အုပ်စုအလိုက် အရောင်းဝေစု)</Text>
          //           <Text size="11px" className="text-gray-500 font-mono mt-0.5">Live Database Category Performance</Text>
          //         </div>
          //         <div className="relative h-[180px] w-full flex items-center justify-center my-auto">
          //           <DonutChart
          //             size={140}
          //             thickness={20}
          //             data={[
          //               { name: 'အချိုရည် / စားသောက်ကုန်', value: 60, color: 'cyan.6' },
          //               { name: 'လတ်ဆတ်သောအသား', value: 25, color: 'teal.6' },
          //               { name: 'မုန့်နှင့် သရေစာ', value: 15, color: 'orange.6' },
          //             ]}
          //             className="font-mono text-xs"
          //           />
          //         </div>
          //       </Paper>
          //     </div>
          //   )}

          //   <Paper className={`shrink-0 ${activeTheme.panel} border ${activeTheme.border} rounded-lg`} radius="md">
          //     <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover className="w-full">
          //       <Table.Thead className={`${activeTheme.bg}`}>
          //         <Table.Tr>
          //           <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">ဘောက်ချာနံပါတ်</Table.Th>
          //           <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">နေ့ရက် / အချိန်</Table.Th>
          //           <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">ငွေရှင်းစနစ်</Table.Th>
          //           <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">ဝယ်သူပေးငွေ</Table.Th>
          //           <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">ပြန်အမ်းငွေ</Table.Th>
          //           <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">စုစုပေါင်း ကျသင့်ငွေ</Table.Th>
          //         </Table.Tr>
          //       </Table.Thead>
          //       <Table.Tbody>
          //         {salesOrders.length === 0 ? (
          //           <Table.Tr>
          //             <Table.Td colSpan={6} className="text-center text-gray-400 py-20 border-none">
          //               <Text size="lg">ဒေတာဘေ့စ်ထဲတွင် အရောင်းမှတ်တမ်းစာရင်း မရှိသေးပါဗျာ။</Text>
          //             </Table.Td>
          //           </Table.Tr>
          //         ) : (
          //           salesOrders.map((order) => (
          //             <Table.Tr
          //               key={order.id}
          //               className={`border-b ${activeTheme.border} cursor-pointer hover:bg-[#16171d]`}
          //               onClick={() => {
          //                 setSelectedOrder(order);
          //                 openDetail();
          //               }}
          //             >
          //               <Table.Td className="font-mono text-white font-bold">{order.invoiceNo}</Table.Td>
          //               <Table.Td className="text-gray-300">{new Date(order.createdAt).toLocaleString('en-MM')}</Table.Td>
          //               <Table.Td><Badge variant="light" color="blue" size="md">{order.paymentMethod}</Badge></Table.Td>
          //               <Table.Td className="font-mono text-gray-400">{Number(order.cashReceived || 0).toLocaleString()} MMK</Table.Td>
          //               <Table.Td className="font-mono text-gray-400">{Number(order.changeGiven || 0).toLocaleString()} MMK</Table.Td>
          //               <Table.Td className="font-semibold text-[#10b981] font-mono">{Number(order.totalAmount || 0).toLocaleString()} MMK</Table.Td>
          //             </Table.Tr>
          //           ))
          //         )}
          //       </Table.Tbody>
          //     </Table>
          //   </Paper>
          // </div>
          <SalesHistoryView
            currentBranchId={currentBranchId}
            activeTheme={{
              panel: 'bg-[#1f2028]',
              border: 'border-[#2e303a]',
              bg: 'bg-[#16171d]'
            }}
          />
        ) : activeView === 'inventory' ? (
          <Paper p="xl" radius="md" className={`flex-1 min-h-0 min-w-0 overflow-auto ${activeTheme.panel} border ${activeTheme.border}`} style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div className="mb-6">
              <Text size="xl" fw={800} className="text-white">NEW PRODUCT ENTRY (ကုန်ပစ္စည်းအသစ် ထည့်သွင်းခြင်းForm)</Text>
              <Text size="xs" className="text-gray-400 mt-1">လုပ်ငန်းခွင်သုံး စနစ်အတွင်းသို့ ကုန်ပစ္စည်းအချက်အလက်အသစ်များ အပြီးသတ် သတ်မှတ်သိမ်းဆည်းရန် ဖြစ်ပါသည်</Text>
            </div>

            <form onSubmit={handleProductSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="ကုန်ပစ္စည်းအမည်" placeholder="ဥပမာ - Pepsi Can 330ml" required value={prodName} onChange={(e) => setProdName(e.target.value)} styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} />
                <TextInput label="ဘားကုဒ်နံပါတ် (Barcode)" placeholder="စကန်ဖတ်ပါ သို့မဟုတ် ရိုက်ထည့်ပါ..." required value={prodBarcode} onChange={(e) => setProdBarcode(e.target.value)} styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a', fontFamily: 'monospace' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput label="SKU ကုဒ်နံပါတ်" placeholder="ဥပမာ - PEPSI-330" required value={prodSku} onChange={(e) => setProdSku(e.target.value)} styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} />
                <Select label="ရောင်းချသည့်ပုံစံ (Sale Type)" data={['UNIT', 'WEIGHT']} value={prodSaleType} onChange={(val) => setProdSaleType(val || 'UNIT')} styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <NumberInput label="ရင်းဈေး (Cost Price)" placeholder="0 MMK" value={prodCost} onChange={(val) => setProdCost(val || 0)} thousandSeparator="," styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a', fontFamily: 'monospace' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} />
                <NumberInput label="ရောင်းဈေး (Selling Price)" placeholder="0 MMK" value={prodPrice} onChange={(val) => setProdPrice(val || 0)} thousandSeparator="," styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a', fontFamily: 'monospace' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} />
                <NumberInput label="အစဦးလက်ကျန်အရေအတွက်" placeholder="0" value={prodStock} onChange={(val) => setProdStock(val || 0)} thousandSeparator="," styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a', fontFamily: 'monospace' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="တိုင်းတာသည့်ယူနစ် (Unit)"
                  placeholder="တိုင်းတာသည့် ယူနစ်ရွေးချယ်ပါ"
                  data={['Pcs', 'Kg', 'Pack', 'Gram', 'Bottle', 'Box']}
                  value={prodUnit}
                  onChange={(val) => setProdUnit(val || 'Pcs')}
                  styles={{
                    input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' },
                    label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' }
                  }} />

                <Select
                  label="ကုန်ပစ္စည်းအုပ်စု (Category)"
                  placeholder={categories.length === 0 ? "Category များအား ဆွဲယူနေပါသည်..." : "ပစ္စည်းအုပ်စု ရွေးချယ်ပါ"}
                  data={categories.map((cat) => ({
                    value: String(cat.id),
                    label: String(cat.name)
                  }))}
                  value={prodCategoryId}
                  onChange={(val) => setProdCategoryId(val || '')}
                  styles={{
                    input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' },
                    label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' }
                  }}
                />
              </div>

              <Divider color="#2e303a" className="my-2" />

              <Group justify="flex-end">
                <Button type="submit" color={activeTheme.badgeColor} size="md" loading={formLoading} className="px-8 font-bold">
                  ကုန်ပစ္စည်းအသစ်သိမ်းဆည်းမည်
                </Button>
              </Group>
            </form>
          </Paper>
        ) : activeView === 'crm' ? (
          <Paper p="xl" radius="md" className={`flex-1 min-h-0 min-w-0 overflow-auto ${activeTheme.panel} border ${activeTheme.border}`}>
            <div className="mb-6">
              <Text size="xl" fw={800} className="text-white">CUSTOMER RELATIONSHIP MANAGEMENT (CRM & Loyalty)</Text>
              <Text size="xs" className="text-gray-400 mt-1">ဖောက်သည်အသင်းဝင်များ၏ အချက်အလက်များနှင့် သစ္စာစောင့်သိမှုအမှတ်များကို စီမံခန့်ခွဲရန်</Text>
            </div>
            <Table verticalSpacing="md" horizontalSpacing="lg" className="min-w-[640px]">
              <Table.Thead className={activeTheme.bg}>
                <Table.Tr>
                  <Table.Th className="text-gray-400">ဖောက်သည်အမည်</Table.Th>
                  <Table.Th className="text-gray-400">ဖုန်းနံပါတ်</Table.Th>
                  <Table.Th className="text-gray-400">အသင်းဝင်အဆင့် (Tier)</Table.Th>
                  <Table.Th className="text-gray-400">စုဆောင်းရရှိած အမှတ် (Points)</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr className={`border-b ${activeTheme.border}`}>
                  <Table.Td className="text-white font-bold">ဦးမောင်မောင်</Table.Td>
                  <Table.Td className="font-mono text-gray-300">09-912345678</Table.Td>
                  <Table.Td><Badge color="orange">GOLD MEMBER</Badge></Table.Td>
                  <Table.Td className="font-mono text-[#10b981] font-bold">1,250 PTS</Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Paper>
        ) : activeView === 'staff' ? (
          <Paper p="xl" radius="md" className={`flex-1 min-h-0 min-w-0 overflow-auto ${activeTheme.panel} border ${activeTheme.border}`}>
            <div className="mb-6">
              <Text size="xl" fw={800} className="text-white">STAFF MANAGEMENT (ဝန်ထမ်းစီမံခန့်ခွဲမှုစနစ်)</Text>
              <Text size="xs" className="text-gray-400 mt-1">ကောင်တာဝန်ထမ်းများနှင့် မန်နေဂျာများ၏ တာဝန်ကျချိန်နှင့် အခြေအနေများကို စစ်ဆေးရန်</Text>
            </div>
            <Table verticalSpacing="md" horizontalSpacing="lg" className="min-w-[720px]">
              <Table.Thead className={activeTheme.bg}>
                <Table.Tr>
                  <Table.Th className="text-gray-400">အကောင့်အမည် (Username)</Table.Th>
                  <Table.Th className="text-gray-400">ရာထူး (Role)</Table.Th>
                  <Table.Th className="text-gray-400">တာဝန်ကျချိန် (Shift)</Table.Th>
                  <Table.Th className="text-gray-400">အခြေအနေ (Status)</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr className={`border-b ${activeTheme.border}`}>
                  <Table.Td className="text-white font-bold">cashier_01</Table.Td>
                  <Table.Td><Badge color="blue">CASHIER</Badge></Table.Td>
                  <Table.Td className="text-gray-300">MORNING SHIFT (08:00 - 16:00)</Table.Td>
                  <Table.Td><Badge color="teal" variant="dot">Online Active</Badge></Table.Td>
                </Table.Tr>
                <Table.Tr className={`border-b ${activeTheme.border}`}>
                  <Table.Td className="text-white font-bold">manager_admin</Table.Td>
                  <Table.Td><Badge color="grape">ADMIN / MANAGER</Badge></Table.Td>
                  <Table.Td className="text-gray-300">NIGHT SHIFT (16:00 - 00:00)</Table.Td>
                  <Table.Td><Badge color="gray" variant="dot">Offline</Badge></Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Paper>
        ) : activeView === 'z-report' ? (
          <ZReportView currentBranchId={currentBranchId} currentCashierId={currentUser.id || 'default-cashier'} />
        ) :
          (
            <Paper className={`flex-1 flex flex-col items-center justify-center p-12 ${activeTheme.panel} border ${activeTheme.border}`} radius="md">
              <IconBox size={64} className="text-gray-500 mb-4" />
              <Text size="xl" className="text-white font-bold mb-2">City Mart {activeView} Module</Text>
            </Paper>
          )}
      </main>

      {activeView === 'counter' && (
        <div
          role="separator"
          aria-label="Counter panel အကျယ်ပြောင်းရန်"
          aria-orientation="vertical"
          aria-valuemin={COUNTER_MIN_WIDTH}
          aria-valuemax={getMaxCounterWidth()}
          aria-valuenow={Math.round(counterWidth)}
          aria-valuetext={`${Math.round(counterWidth)} pixels`}
          tabIndex={0}
          title="ဖိဆွဲပြီး Counter panel အကျယ်ပြောင်းပါ။ Arrow keys ဖြင့်လည်း ပြောင်းနိုင်သည်။"
          className="group hidden w-2.5 shrink-0 cursor-col-resize touch-none select-none items-center justify-center bg-transparent outline-none hover:bg-cyan-500/10 focus-visible:bg-cyan-500/10 lg:flex"
          onPointerDown={(event) => startPanelResize('counter', event)}
          onPointerMove={movePanelResize}
          onPointerUp={stopPanelResize}
          onPointerCancel={stopPanelResize}
          onLostPointerCapture={() => {
            resizeDragRef.current = null;
            setIsResizing(false);
          }}
          onKeyDown={(event) => handleResizeKeyDown('counter', event)}
          onDoubleClick={() => setCounterWidth(COUNTER_DEFAULT_WIDTH)}
        >
          <span className="h-12 w-1 rounded-full bg-[#4b5563] transition-colors group-hover:bg-cyan-400 group-focus-visible:bg-cyan-400" />
        </div>
      )}

      {activeView === 'counter' && (
        <aside className={`${activeTheme.panel} flex h-[34vh] min-h-[220px] max-h-[360px] w-full shrink-0
        flex-col justify-between overflow-hidden border-t ${activeTheme.border} p-3 print:hidden
        sm:p-4 lg:h-full lg:min-h-0 lg:max-h-none lg:w-[var(--counter-width)] lg:min-w-0 lg:border-l lg:border-t-0 lg:p-6`}>
          {/* Upper Section */}
          <div className={`flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto border-b ${activeTheme.border} pb-4 pr-1`}>
            <div>
              {/* Title Header */}
              <div className="flex min-w-0 items-center gap-3">
                <IconReceipt size={32} className={`${activeTheme.primaryText} shrink-0`} />
                <h2 className="m-0 min-w-0 truncate text-xl font-bold text-white xl:text-2xl">City Mart Counter</h2>
              </div>
              <p className="m-0 text-sm text-gray-400">Enterprise Modern Multi-Theme စနစ်</p>
            </div>

            {/* Customer Loyalty Section */}
            <div className={`mt-4 p-3 rounded-lg border ${activeTheme.bg} ${activeTheme.border} mb-4`}>
              <Text size="xs" fw={700} c="dimmed" className="mb-1.5 uppercase tracking-wider">CUSTOMER LOYALTY (မန်ဘာဖောက်သည်)</Text>
              {selectedCustomer ? (
                <div className="flex justify-between items-center bg-[#1f2028] p-2 rounded border border-cyan-800">
                  <div className="flex flex-col truncate pr-2">
                    <Text size="xs" fw="bold" className="text-white">{selectedCustomer.name}</Text>
                    <Text size="10px" className="text-cyan-400 font-mono">{selectedCustomer.phone} | {selectedCustomer.tier}</Text>
                  </div>
                  <Button size="xs" color="red" variant="subtle" onClick={() => setSelectedCustomer(null)}>ဖယ်ရှားရန်</Button>
                </div>
              ) : (
                <Button
                  fullWidth
                  variant="light"
                  color="cyan"
                  size="xs"
                  className='mt-1'
                  onClick={openMemberModal}
                >
                  🔍 မန်ဘာရှာရန် (F4 နှိပ်ပါ)
                </Button>
              )}
            </div>

            {/* Total Items Info */}
            <div className="flex flex-wrap items-center justify-between gap-1 px-1 text-base text-gray-300">
              <span className="text-sm">စုစုပေါင်း ပစ္စည်းအမျိုးအစား:</span>
              <span className="font-bold text-white text-lg">{cartItems.length} မျိုး</span>
            </div>

            <div className={`flex flex-col rounded-lg border ${activeTheme.bg} ${activeTheme.border} p-4 text-center shadow-inner`}>
              <span className="text-sm font-semibold tracking-widest text-gray-400">TOTAL AMOUNT</span>
              <span className="mt-1 break-words font-mono text-2xl font-extrabold text-[#10b981] xl:text-3xl">
                {grandTotal.toLocaleString()} <span className="text-lg font-bold">MMK</span>
              </span>
            </div>

            {/* Low Stock Notifications Section */}
            <div className="flex flex-col gap-2">
              <Text size="xs" fw={700} color="red" className="tracking-wider flex items-center gap-1">
                🚨 LOW STOCK NOTIFICATIONS (လက်ကျန်ပြတ်လုနီးပါးစာရင်း)
              </Text>
              <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">

                {lowStockItems.length === 0 ? (
                  <Text size="xs" color="gray" className="italicpy-2 text-center">
                    ပစ္စည်းလက်ကျန်များအားလုံး စိုပြေအဆင်ပြေနေပါသည်
                  </Text>
                ) : (
                  lowStockItems.map((prod) => (
                    <div key={prod.id} className="flex justify-between items-center bg-[#ef444415] border border-[#ef444430] p-2.5 rounded-md">
                      <div className="flex flex-col truncate pr-2 ">
                        <Text size="xs" fw="bold" className="text-white truncate">{prod.name}</Text>
                        <Text size="10px" className="text-gray-500 font-mono">{prod.barcode}</Text>
                      </div>
                      <Badge color="red" variant="filled" size="sm" className="font-bold">Qty: {prod.stockQuantity}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Bottom Checkout Button */}
          <div className="shrink-0 pt-3 sm:pt-4">
            <Button
              color={activeTheme.badgeColor}
              size="xl"
              radius="md"
              className="h-auto w-full py-4 text-lg font-bold shadow-lg xl:text-xl"
              leftSection={<IconReceipt size={22} />}
              onClick={open}
              disabled={cartItems.length === 0}
            >
              ငွေရှင်းမည် (F2)
            </Button>
          </div>
        </aside>
      )}

      <Modal
        opened={opened}
        onClose={close}
        title="အရောင်းစလစ်ဘောက်ချာ (Invoice Receipt)"
        centered
        size="md"
        classNames={{
          content: 'bg-[#1f2028] border border-[#2e303a] text-white print:bg-white print:text-black print:border-none print:shadow-none',
          header: 'bg-[#1f2028] border-b border-[#2e303a] text-white print:hidden',
        }}
      >
        <div className="flex flex-col gap-4 mb-6 print:hidden">
          <Select
            label="ငွေပေးချေမှုစနစ်"
            placeholder="ရွေးချယ်ပါ"
            data={['Cash', 'KPay', 'WaveMoney', 'Card']}
            value={paymentMethod}
            onChange={(val) => setPaymentMethod(val || 'Cash')}
            styles={{
              label: { color: '#9ca3af', fontWeight: 600, marginBottom: '6px' },
              input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' }
            }}
          />

          <NumberInput
            label="ဝယ်သူပေးငွေ (Cash Received)"
            size="md"
            min={grandTotal}
            value={cashReceived}
            onChange={(val) => setCashReceived(val || 0)}
            thousandSeparator=","
            suffix=" MMK"
            styles={{
              label: { color: '#9ca3af', fontWeight: 600, marginBottom: '6px' },
              input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' }
            }}
          />

          <div className="flex justify-between p-3 bg-[#16171d] rounded-md border border-[#2e303a] mt-2">
            <span className="text-gray-400 font-bold">ပြန်အမ်းငွေ (Change Given):</span>
            <span className="font-mono font-bold text-orange-400">
              {changeGiven >= 0 ? `${changeGiven.toLocaleString()} MMK` : 'ငွေမလောက်ပါ'}
            </span>
          </div>

          {(paymentMethod === 'KPay' || paymentMethod === 'WaveMoney') && (
            <Paper p="sm" radius="md" className="mt-4 flex flex-col items-center justify-center bg-white border border-gray-200 p-4">
              <Text fw={700} size="xs" className="mb-3 tracking-wide text-gray-700 text-center w-full">
                [ LIVE DIGITAL PAYMENT QR CODE ]
              </Text>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`CITYMART-POS|TOTAL:${grandTotal}\vert{}METHOD:${paymentMethod}`)}`}
                alt="Digital Payment QR Code"
                style={{ width: '200px', height: '200px', objectFit: 'contain', margin: '0 auto' }}
                className="shadow-md my-3 block rounded-md"
              />
              <Text fw={600} size="xs" className="text-gray-500 mt-2.5 text-center w-full">
                ကျသင့်ငွေ အတိအကျ - {grandTotal.toLocaleString()} MMK
              </Text>
            </Paper>
          )}
        </div>

        <div id="receipt-print-area" className="p-4 font-mono text-sm leading-relaxed text-gray-200 print:text-black print:p-0 print:w-[80mm] mx-auto bg-[#16171d] print:bg-white rounded-lg border border-[#2e303a] print:border-none">
          <div className="text-center mb-4">
            <Text size="xl" className="font-extrabold text-white print:text-black">CITY MART SUPERMARKET</Text>
            <div className="text-left mt-4 text-xs border-b border-dashed border-gray-600 pb-2">
              <div>နေ့ရက် - {new Date().toLocaleString('en-MM')}</div>
              <div className="font-bold text-white print:text-black">
                ဘောက်ချာနံပါတ် - {selectedOrder ? selectedOrder.invoiceNo : `INV-${new Date().getFullYear()}-XXXXX`}
              </div>
              <div>ငွေရှင်းစနစ် - {paymentMethod}</div>
              <div>ဝန်ထမ်း - cashier_01</div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-xs border-b border-dashed border-gray-600 pb-2 mb-2">
            <div className="flex justify-between font-bold text-white print:text-black">
              <span className="w-1/2">ပစ္စည်းအမည်</span>
              <span className="w-1/4 text-center">နှုန်း x ရေ</span>
              <span className="w-1/4 text-right">သင့်ငွေ</span>
            </div>
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between text-gray-300 print:text-black">
                <span className="w-1/2 truncate">{item.name}</span>
                <span className="w-1/4 text-center">{item.price} x {item.quantity}</span>
                <span className="w-1/4 text-right">{item.total.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1 text-xs font-bold pt-2">
            <div className="flex justify-between text-white print:text-black">
              <span>စုစုပေါင်း ကျသင့်ငွေ (TOTAL):</span>
              <span>{grandTotal.toLocaleString()} MMK</span>
            </div>
            <div className="flex justify-between text-gray-400 print:text-black text-[11px] font-normal italic text-center mt-4 w-full justify-center">
              --- ဝယ်ယူအားပေးမှုကို အထူးကျေးဇူးတင်ပါသည် ---
            </div>
          </div>
        </div>

        <Group className="mt-6 print:hidden" justify="flex-end">
          <Button variant="subtle" color="gray" onClick={close} disabled={loading}>ပယ်ဖျက်မည်</Button>
          <Button
            color="orange"
            leftSection={<IconPrinter size={18} />}
            onClick={() => {
              window.print();
              notifications.show({
                title: 'ဒစ်ဂျစ်တယ် PDF စလစ် 🟢',
                message: 'ဘောက်ချာစလစ်အား PDF အဖြစ် ထုတ်ယူရန် အဆင်သင့်ဖြစ်ပါပြီ',
                color: 'orange',
              });
            }}
            disabled={cartItems.length === 0}
          >
            PDF ထုတ်မည်
          </Button>
          <Button
            color="teal"
            leftSection={<IconPrinter size={18} />}
            onClick={handleFinalCheckout}
            loading={loading}
            disabled={changeGiven < 0}
          >
            အပြီးသတ်ငွေရှင်းမည် (Print)
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={detailOpened}
        onClose={closeDetail}
        title={<Text fw={700} size="lg">ဘောက်ချာအသေးစိတ် စာရင်းမှတ်တမ်း</Text>}
        centered
        size="lg"
        classNames={{
          content: 'bg-[#1f2028] border border-[#2e303a] text-white',
          header: 'bg-[#1f2028] border-b border-[#2e303a] text-white',
        }}
      >
        {selectedOrder && (
          <div className="flex flex-col gap-4 font-mono text-sm">
            <div className="grid grid-cols-2 gap-3 bg-[#16171d] p-4 rounded-md border border-[#2e303a]">
              <div><Text size="xs" color="gray">INVOICE NO :</Text><Text fw="bold" color="cyan">INV-{selectedOrder.id.slice(0, 8).toUpperCase()}</Text></div>
              <div><Text size="xs" color="gray">DATE / TIME :</Text><Text fw="bold">{new Date(selectedOrder.createdAt).toLocaleString('en-MM')}</Text></div>
              <div><Text size="xs" color="gray">PAYMENT METHOD :</Text><Badge color="blue" variant="light">{selectedOrder.paymentMethod}</Badge></div>
              <div><Text size="xs" color="gray">CASHIER ID :</Text><Text fw="bold" size="xs" className="truncate">{selectedOrder.cashierId}</Text></div>
            </div>

            <Text fw={700} size="sm" color="gray" className="mt-2">PURCHASED ITEMS (ဝယ်ယူခဲ့သော ပစ္စည်းများ)</Text>
            <Table verticalSpacing="xs" className="w-full bg-[#16171d] rounded-md overflow-hidden">
              <Table.Thead className="bg-[#2e303a]">
                <Table.Tr>
                  <Table.Th className="text-gray-400 font-semibold text-xs">ကုန်ပစ္စည်းအမည်</Table.Th>
                  <Table.Th className="text-gray-400 font-semibold text-xs text-center">အရေအတွက်</Table.Th>
                  <Table.Th className="text-gray-400 font-semibold text-xs text-right">ယူနစ်ဈေး</Table.Th>
                  <Table.Th className="text-gray-400 font-semibold text-xs text-right">ကျသင့်ငွေ</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {selectedOrder.orderItems?.map((item: any) => (
                  <Table.Tr key={item.id} className="border-b border-[#2e303a]">
                    <Table.Td className="text-white text-xs">{item.product?.name || 'Unknown Item'}</Table.Td>
                    <Table.Td className="text-center text-xs fw-bold text-orange-400">{item.quantity} Pcs/Kg</Table.Td>
                    <Table.Td className="text-right text-xs">{item.unitPrice.toLocaleString()} MMK</Table.Td>
                    <Table.Td className="text-right text-xs fw-bold text-[#10b981]">{(item.quantity * item.unitPrice).toLocaleString()} MMK</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            <Divider color="#2e303a" className="my-2" />
            <div className="flex flex-col gap-2 bg-[#16171d] p-4 rounded-md border border-[#2e303a]">
              <div className="flex justify-between text-xs text-gray-400"><span>ဝယ်သူပေးငွေ (CASH RECEIVED):</span><span>{selectedOrder.cashReceived.toLocaleString()} MMK</span></div>
              <div className="flex justify-between text-xs text-gray-400"><span>ပြန်အမ်းငွေ (CHANGE GIVEN):</span><span>{selectedOrder.changeGiven.toLocaleString()} MMK</span></div>
              <Divider color="#2e303a" variant="dashed" className="my-1" />
              <div className="flex justify-between text-base fw-extrabold text-[#10b981]"><span>TOTAL AMOUNT :</span><span>{selectedOrder.totalAmount.toLocaleString()} MMK</span></div>
            </div>

            <Group justify="flex-end" className="mt-4">
              <Button color="gray" variant="subtle" onClick={closeDetail}>ပိတ်မည်</Button>
            </Group>
          </div>
        )}
      </Modal>

      {/* 🔍 မန်ဘာရှာဖွေရန် သီးသန့် Pop-up Modal */}
      <Modal
        opened={memberModalOpened}
        onClose={closeMemberModal}
        title={<Text fw={700} size="md">ဖောက်သည်မန်ဘာ ရှာဖွေရန်</Text>}
        centered
        trapFocus={true}
        size="sm"
        classNames={{
          content: 'bg-[#1f2028] border border-[#2e303a] text-white',
          header: 'bg-[#1f2028] border-b border-[#2e303a] text-white',
        }}
      >
        <div className="flex flex-col gap-4 py-2">
          <TextInput
            data-autofocus
            placeholder="ဖုန်းနံပါတ် ရိုက်ထည့်ပါ..."
            size="md"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                await searchCustomerByPhone(searchPhone);
                setSearchPhone('');
                closeMemberModal();
              }
            }}
            styles={{
              input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' }
            }}
          />
          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={closeMemberModal}>ပယ်ဖျက်မည်</Button>
            <Button
              color="teal"
              onClick={async () => {
                await searchCustomerByPhone(searchPhone);
                setSearchPhone('');
                closeMemberModal();
              }}
            >
              ရှာဖွေမည်
            </Button>
          </Group>
        </div>
      </Modal>
    </div>
  );
}

export default App;