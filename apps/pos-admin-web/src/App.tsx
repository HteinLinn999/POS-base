import { useState, useRef, useEffect } from 'react';
import { TextInput, Table, Paper, Text, Button, Badge, ActionIcon, Menu, Group, Modal, NumberInput, Select, Divider } from '@mantine/core';
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
  IconPrinter
} from '@tabler/icons-react';
import { SaleType } from '@pos/shared-types';
import { useCartStore } from './store/useCartStore'; // Zustand အား စနစ်တကျ Import ခေါ်ယူခြင်း ⭐

import { api } from './api/axios';
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

function App() {
  const [barcode, setBarcode] = useState<string>('');

  //default theme
  const [activeTheme, setActiveTheme] = useState<IThemeConfig>(POS_THEMES[0]);
  const inputRef = useRef<HTMLInputElement>(null);


  // 🛒 အသစ် — ငွေရှင်းရာတွင် ဝယ်သူပေးငွေနှင့် Payment Method စစ်ဆေးရန် UI States ⭐
  const [cashReceived, setCashReceived] = useState<number | string>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [loading, setLoading] = useState<boolean>(false);

  // Mantine Modal State Control (စလစ်ပြသရန် ဖွင့်/ပိတ် ခလုတ်) ⭐
  const [opened, { open, close }] = useDisclosure(false);

  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);


  //form for import and export items
  const [prodName, setProdName] = useState<string>('');
  const [prodBarcode, setProdBarcode] = useState<string>('');
  const [prodSku, setProdSku] = useState<string>('');
  const [prodPrice, setProdPrice] = useState<number | string>('');
  const [prodCost, setProdCost] = useState<number | string>('');
  const [prodStock, setProdStock] = useState<number | string>('');
  const [prodSaleType, setProdSaleType] = useState<string>('UNIT');
  const [prodUnit, setProdUnit] = useState<string>('Pcs');
  const [prodCategoryId, setProdCategoryId] = useState<string>('9f074d0e-953e-4b40-9a3d-425886616238'); // Dynamic FK Placeholder
  const [formLoading, setFormLoading] = useState<boolean>(false);

  const { cartItems, isLeftNavOpen, toggleLeftNav, addItemByBarcode, clearCart, submitCheckout, activeView, setActiveView, fetchSalesOrders, salesOrders, categories }
    = useCartStore();

  useEffect(() => {
    inputRef.current?.focus();
    if (activeView === 'history') fetchSalesOrders();
  }, [activeView, fetchSalesOrders]);

  useEffect(() => {
    if (activeView === 'inventory') {
      useCartStore.getState().fetchCategories();
    }
  }, [activeView]);

  // Keyboard shortcut အဖြစ် F12 နှိပ်ပါက မောက်စ်မကိုင်ဘဲ ငွေရှင်းစလစ် တန်းပွင့်လာစေရန် ⭐
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (cartItems.length > 0) open();
      }
      if (e.key === 'Escape') {
        if (cartItems.length > 0) {
          e.preventDefault();
          clearCart(); // ခြင်းတောင်းအားလုံး ဖျက်ဆီးခြင်း
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
  }, [cartItems, open,clearCart]);


  // Modal ပွင့်လာလျှင် ကျသင့်ငွေအား ဝယ်သူပေးငွေနေရာတွင် အလိုအလျောက် default အဆင်သင့် ဖြည့်ပေးထားခြင်း
  useEffect(() => {
    if (opened) {
      const totalAmount = cartItems.reduce((sum: number, item) => sum + item.total, 0);
      setCashReceived(totalAmount);
    }
  }, [opened, cartItems]);

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    //const handleBarcodeSubmit = async (e: React.ChangeEvent) => {
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
      const msg =
        error?.response?.data?.message     // NestJS error body
        ?? error?.message                   // Network error
        ?? 'မသိသော အမှားတစ်ခု ဖြစ်ပွားခဲ့သည်';

      notifications.show({
        title: 'အရောင်းအမှား',
        message: Array.isArray(msg) ? msg.join(', ') : msg, // NestJS ValidationPipe array ပြန်နိုင်
        color: 'red',
        icon: <IconBarcode size={16} />,
      });
    }

    setBarcode('');
  };

  const grandTotal = cartItems.reduce((sum: number, item) => sum + item.total, 0);
  const changeGiven = Number(cashReceived) - grandTotal;


  // 🖨️ Browser window မှတစ်ဆင့် တကယ့် Thermal Printer ဆီသို့ ပုံစံထုတ်ပေးမည့် Native Print Logic ⭐
  // const handlePrintReceipt = () => {
  //   window.print(); // ၎င်းသည် မျက်နှာပြင်ပေါ်ရှိ print layout အား ပရင်တာဆီ ပို့ပေးမည် ဖြစ်သည်
  //   clearCart(); // ပရင့်ထုတ်ပြီးပါက ကောင်တာခြင်းတောင်းအား တစ်ခါတည်း ရှင်းလင်းပေးခြင်း
  //   close();
  // };

  // 🚀 အသစ် — ငွေရှင်းခလုတ် နှိပ်လိုက်သည့်အခါ တကယ့် PostgreSQL DB ထဲသို့ သွားသိမ်းပြီးမှ ပရင့်ထုတ်မည့် စနစ် ⭐
  const handleFinalCheckout = async () => {
    setLoading(true);
    try {
      // ၁။ Zustand မှတစ်ဆင့် Backend API Transaction စနစ်သို့ လှမ်းပို့သိမ်းခိုင်းခြင်း 🎯
      await submitCheckout(Number(cashReceived), paymentMethod);

      // ၂။ DB ထဲတွင် အောင်မြင်စွာ သိမ်းဆည်းပြီးမှသာ စက်ပြင် Thermal Printer အား ပရင့်ထုတ်ခိုင်းခြင်း
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
      // Nest.js Backend ၏ create product endpoint ဆီသို့ တိုက်ရိုက် လှမ်းအော်ပို့လွှတ်ခြင်း 🎯
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

      // အောင်မြင်ပါက Form ခွက်များအားအကုန်လုံး သန့်ရှင်းရေး Reset ပြန်ချပေးခြင်း
      setProdName(''); setProdBarcode(''); setProdSku(''); setProdPrice(''); setProdCost(''); setProdStock('');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'ပစ္စည်းအသစ်ဆောက်မှု ကျရှုံးပါသည်';
      notifications.show({ title: 'သိမ်းဆည်းမှု မအောင်မြင်ပါ ❌', message: Array.isArray(msg) ? msg.join(', ') : msg, color: 'red' });
    } finally {
      setFormLoading(false);
    }
  };

  console.log('categories :' + { categories })
  return (
    <div className={`flex h-screen w-screen overflow-hidden ${activeTheme.bg} text-[#f3f4f6] transition-colors duration-300`}>
      {/* 🔴 ၁။ ဘယ်ဘက်ခြမ်း - အဆင့်မြှင့်တင်ထားသော ဒိုင်နမစ် Navigation Navbar */}
      <nav
        className={`${activeTheme.panel} flex h-full shrink-0 flex-col justify-between overflow-hidden border-r ${activeTheme.border} transition-all duration-300 ease-in-out print:hidden ${isLeftNavOpen ? 'w-[240px] px-4 py-6' : 'w-0 border-r-0 px-0 py-6'
          }`}
        aria-hidden={!isLeftNavOpen}
      >
        <div className="flex flex-col w-full gap-6">
          <div className="flex h-10 w-full items-center justify-start gap-3 overflow-hidden px-2">
            <IconReceipt size={32} className={activeTheme.primaryText} />
            <span className="whitespace-nowrap text-lg font-bold tracking-wide text-white">CITY MART</span>
          </div>

          {/* Menu Links List - activeView အပေါ်မူတည်၍ တကယ့် Highlight အစစ်အမှန် လင်းစေမည့်စနစ် 🎯 ⭐ */}
          <div className="mt-4 flex w-full flex-col gap-2">
            <Button
              variant={activeView === 'counter' ? 'filled' : 'subtle'}
              color={activeView === 'counter' ? activeTheme.badgeColor : 'gray'}
              size="md"
              /* 🔗 FIXED: activeView ကိုက်ညီပါက Background အား Active Theme အရောင်အတိုင်း တောက်ခနဲ လင်းခိုင်းခြင်း 🎯 */
              className={`h-12 w-full justify-start transition-all duration-200 ${activeView === 'counter'
                ? 'bg-cyan-600 text-white font-bold shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-[#2e303a]'
                }`}
              leftSection={<IconShoppingCart size={22} />}
              onClick={() => setActiveView('counter')}
            >
              <span className="text-base font-medium">အရောင်းကောင်တာ</span>
            </Button>

            <Button
              variant={activeView === 'inventory' ? 'filled' : 'subtle'}
              color={activeView === 'inventory' ? activeTheme.badgeColor : 'gray'}
              size="md"
              /* 🔗 FIXED: activeView ကိုက်ညီပါက Background အား Active Theme အရောင်အတိုင်း တောက်ခနဲ လင်းခိုင်းခြင်း 🎯 */
              className={`h-12 w-full justify-start transition-all duration-200 ${activeView === 'inventory'
                ? 'bg-cyan-600 text-white font-bold shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-[#2e303a]'
                }`}
              leftSection={<IconBox size={22} />}
              onClick={() => setActiveView('inventory')}
            >
              <span className="text-base font-medium">ပစ္စည်းအဝင်/အထွက်</span>
            </Button>

            <Button
              variant={activeView === 'history' ? 'filled' : 'subtle'}
              color={activeView === 'history' ? activeTheme.badgeColor : 'gray'}
              size="md"
              /* 🔗 FIXED: activeView ကိုက်ညီပါက Background အား Active Theme အရောင်အတိုင်း တောက်ခနဲ လင်းခိုင်းခြင်း 🎯 */
              className={`h-12 w-full justify-start transition-all duration-200 ${activeView === 'history'
                ? 'bg-cyan-600 text-white font-bold shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-[#2e303a]'
                }`}
              leftSection={<IconHistory size={22} />}
              onClick={() => setActiveView('history')}
            >
              <span className="text-base font-medium">အရောင်းမှတ်တမ်း</span>
            </Button>

            <Button
              variant={activeView === 'staff' ? 'filled' : 'subtle'}
              color={activeView === 'staff' ? activeTheme.badgeColor : 'gray'}
              size="md"
              /* 🔗 FIXED: activeView ကိုက်ညီပါက Background အား Active Theme အရောင်အတိုင်း တောက်ခနဲ လင်းခိုင်းခြင်း 🎯 */
              className={`h-12 w-full justify-start transition-all duration-200 ${activeView === 'staff'
                ? 'bg-cyan-600 text-white font-bold shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-[#2e303a]'
                }`}
              leftSection={<IconUser size={22} />}
              onClick={() => setActiveView('staff')}
            >
              <span className="text-base font-medium">ဝန်ထမ်းစီမံရန်</span>
            </Button>
          </div>

        </div>

        {/* 👤 အောက်ခြေ ဝန်ထမ်း Profile ပြကွက်သစ် */}
        <div className="w-full bg-[#16171d] p-3 rounded-lg border border-[#2e303a] overflow-hidden">
          <Group gap="xs">
            <ActionIcon variant="light" color={activeTheme.badgeColor} size="md" radius="xl">
              <IconUser size={18} />
            </ActionIcon>
            <div className="flex flex-col truncate">
              <Text size="xs" className="text-white font-bold truncate">cashier_01</Text>
              <Text size="10px" className="text-gray-500 font-semibold tracking-wider">MORNING SHIFT</Text>
            </div>
          </Group>
        </div>
      </nav>


      {/* 🟢 ၂။ အလယ်ခြမ်း - Active View အပေါ်မူတည်ပြီး ကွက်တိ ဒိုင်နမစ် ပြောင်းလဲမည့် မျက်နှာပြင်ပြကွက် */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-6 print:hidden">

        {/* Top Action Bar */}
        <div className="mb-6 flex items-center gap-4">
          <ActionIcon variant="light" color="cyan" size="xl" radius="md" onClick={toggleLeftNav} title="ဘယ်ဘက် Sidebar ဖွင့်/ပိတ်ရန်">
            <IconMenu2 size={24} />
          </ActionIcon>

          {/* အရောင်းကောင်တာ မျက်နှာပြင်ဖြစ်မှသာ Barcode Input Form အား ပြသခိုင်းခြင်း ⭐ */}
          {activeView === 'counter' && (
            <form onSubmit={handleBarcodeSubmit} className="min-w-0 flex-1">
              <TextInput
                ref={inputRef}
                leftSection={<IconBarcode size={24} className="text-gray-400" />}
                placeholder="စမ်းသပ်ရန် Barcode စကန်ဖတ်ပါ (8850001234567)..."
                size="lg"
                radius="md"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onBlur={() => {
                  if (!opened) {
                    inputRef.current?.focus();
                  }
                }}

                styles={{
                  input: {
                    backgroundColor: activeTheme.inputBg,
                    color: '#ffffff',
                    fontSize: '16px',
                  },
                }}

              />
            </form>
          )}
          {activeView !== 'counter' && <div className="flex-1"><Text size="xl" className="text-white font-bold capitalize">{activeView} Dashboard</Text></div>}

          {/* Theme Selector Menu */}
          <Menu shadow="md" width={200} trigger="click" position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="light" color="cyan" size="xl" radius="md" title="Theme ပြောင်းရန်"><IconPalette size={24} /></ActionIcon>
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

        {/* 🔄 activeView 'counter' ဖြစ်ပါက Table ပြမည်၊ မဟုတ်ပါက Placeholder ပြမည့် Dynamic Content Area ⭐ */}
        {activeView === 'counter' ? (
          <Paper className={`flex-1 overflow-y-auto rounded-lg border ${activeTheme.panel} ${activeTheme.border}`} radius="md">
            <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover className="w-full">
              <Table.Thead className={`${activeTheme.bg} sticky top-0 z-10`}>
                <Table.Tr>
                  <Table.Th className="border-b border-gray-700 font-semibold text-gray-400">စဉ်</Table.Th>
                  <Table.Th className="border-b border-gray-700 font-semibold text-gray-400">ကုန်ပစ္စည်းအမည်</Table.Th>
                  <Table.Th className="border-b border-gray-700 font-semibold text-gray-400">ဘားကုဒ်</Table.Th>
                  <Table.Th className="border-b border-gray-700 font-semibold text-gray-400">ဈေးနှုန်း</Table.Th>
                  <Table.Th className="border-b border-gray-700 font-semibold text-gray-400">အရေအတွက်</Table.Th>
                  <Table.Th className="border-b border-gray-700 font-semibold text-gray-400">စုစုပေါင်း ကျသင့်ငွေ</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {cartItems.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6} className="border-none py-20 text-center text-gray-400">
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
                        <Badge
                          color={item.stockQuantity <= 10 ? 'red' : 'gray'}
                          variant={item.stockQuantity <= 10 ? 'filled' : 'light'}
                          size="sm"
                          className={item.stockQuantity <= 10 ? 'animate-pulse font-bold' : ''}
                        // လက်ကျန်နည်းပါက အနီရောင်ဖြင့် တုန်ခါသတိပေးခိုင်းခြင်း 🚨
                        >
                          {item.stockQuantity <= 10 ? `လက်ကျန်ပြတ်လုနီးပါး (${item.stockQuantity})` : `							လက်ကျန်အဆင်ပြေ (${item.stockQuantity})`}
                        </Badge>
                      </Table.Td>

                      <Table.Td>
                        <Badge color={item.saleType === SaleType.WEIGHT ? 'teal' : activeTheme.badgeColor} variant="light" size="lg">
                          {item.quantity} {item.saleType === SaleType.WEIGHT ? 'Kg' : 'Pcs'}
                        </Badge>
                      </Table.Td>
                      <Table.Td className="font-semibold text-[#10b981]">{item.total.toLocaleString()} MMK</Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        ) : activeView === 'history' ? (
          /* 📊 အဆင့် ၁၆ - ဥပဒေအမှန်အတိုင်း အပြည့်စုံဆုံး တည်ဆောက်ထားသော အရောင်းမှတ်တမ်း Grid View Layout ⭐ */
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">

            {/* 📈 ၁။ ထိပ်ဆုံးက Key Analytics Summary Stat Cards ပြကွက် */}
            <div className="grid grid-cols-3 gap-4">
              <Paper p="md" radius="md" className={`${activeTheme.panel} border ${activeTheme.border}`}>
                <Text size="xs" color="gray" fw={700} className="tracking-wider">TOTAL REVENUE (စုစုပေါင်း အရောင်းရငွေ)</Text>
                <Text size="28px" fw={900} className="text-[#10b981] mt-1 font-mono">
                  {salesOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()} <span className="text-xs font-bold">MMK</span>
                </Text>
              </Paper>

              <Paper p="md" radius="md" className={`${activeTheme.panel} border ${activeTheme.border}`}>
                <Text size="xs" color="gray" fw={700} className="tracking-wider">TOTAL INVOICES (စုစုပေါင်း ဘောက်ချာစောင်ရေ)</Text>
                <Text size="28px" fw={900} className="text-[#00d8ff] mt-1 font-mono">
                  {salesOrders.length} <span className="text-xs font-bold">စောင်</span>
                </Text>
              </Paper>

              <Paper p="md" radius="md" className={`${activeTheme.panel} border ${activeTheme.border}`}>
                <Text size="xs" color="gray" fw={700} className="tracking-wider">AVERAGE BASKET (ဘောက်ချာတစ်ခုချင်းစီ၏ ပျမ်းမျှကျသင့်ငွေ)</Text>
                <Text size="28px" fw={900} className="text-orange-400 mt-1 font-mono">
                  {salesOrders.length > 0
                    ? Math.round(salesOrders.reduce((sum, o) => sum + o.totalAmount, 0) / salesOrders.length).toLocaleString()
                    : 0
                  } <span className="text-xs font-bold">MMK</span>
                </Text>
              </Paper>
            </div>

            {/* 📅 ၂။ တကယ့် အသေးစိတ် စာရင်းဇယားကွက် (Sales Table Container) */}
            <Paper className={`flex-1 overflow-y-auto ${activeTheme.panel} border ${activeTheme.border} rounded-lg`} radius="md">
              <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover className="w-full">
                <Table.Thead className={`${activeTheme.bg} sticky top-0 z-10`}>
                  <Table.Tr>
                    <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">ဘောက်ချာနံပါတ်</Table.Th>
                    <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">နေ့ရက် / အချိန်</Table.Th>
                    <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">ငွေရှင်းစနစ်</Table.Th>
                    <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">ဝယ်သူပေးငွေ</Table.Th>
                    <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">ပြန်အမ်းငွေ</Table.Th>
                    <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">စုစုပေါင်း ကျသင့်ငွေ</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {salesOrders.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6} className="text-center text-gray-400 py-20 border-none">
                        <Text size="lg">ဒေတာဘေ့စ်ထဲတွင် အရောင်းမှတ်တမ်းစာရင်း မရှိသေးပါဗျာ။</Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    salesOrders.map((order) => (
                      <Table.Tr key={order.id} className={`border-b ${activeTheme.border} cursor-pointer hover:bg-[#16171d]`}
                        onClick={() => {
                          // 💡 အဆင့် ၁၆.၄ တွင် ဤနေရာ၌ ဘောက်ချာကို ကလစ်နှိပ်ပါက အသေးစိတ်ပစ္စည်းစာရင်း Modal ကို ချိတ်ဆက်ပြသပါမည်
                          //  notifications.show({ title: 'ဘောက်ချာအသေးစိတ်', message: `Invoice ID: ${order.id.slice(0, 8)}... အား ရွေးချယ်ထားပါသည်`, color: 'cyan' });
                          setSelectedOrder(order);
                          openDetail();
                        }}>
                        <Table.Td className="font-mono text-white font-bold">INV-{order.id.slice(0, 8).toUpperCase()}</Table.Td>
                        <Table.Td className="text-gray-300">{new Date(order.createdAt).toLocaleString('en-MM')}</Table.Td>
                        <Table.Td><Badge variant="light" color="blue" size="md">{order.paymentMethod}</Badge></Table.Td>
                        <Table.Td className="font-mono text-gray-400">{order.cashReceived.toLocaleString()} MMK</Table.Td>
                        <Table.Td className="font-mono text-gray-400">{order.changeGiven.toLocaleString()} MMK</Table.Td>
                        <Table.Td className="font-semibold text-[#10b981] font-mono">{order.totalAmount.toLocaleString()} MMK</Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </div>
        ) : activeView === 'inventory' ? (
          /* 📦 အဆင့် ၁၇ — 🔗 FIXED: keyboardType အမှားများအားလုံးအား မန်တင်း NumberInput စံနှုန်းစစ်စစ်ဖြင့် အစားထိုးပြင်ဆင်ပြီးပါပြီ 🎯 ⭐ */
          <Paper p="xl" radius="md" className={`flex-1 overflow-y-auto ${activeTheme.panel} border ${activeTheme.border}`} style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div className="mb-6">
              <Text size="xl" fw={800} className="text-white">NEW PRODUCT ENTRY (ကုန်ပစ္စည်းအသစ် ထည့်သွင်းခြင်းForm)</Text>
              <Text size="xs" className="text-gray-400 mt-1">လုပ်ငန်းခွင်သုံး စနစ်အတွင်းသို့ ကုန်ပစ္စည်းအချက်အလက်အသစ်များ အပြီးသတ် သတ်မှတ်သိမ်းဆည်းရန် ဖြစ်ပါသည်</Text>
            </div>

            <form onSubmit={handleProductSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <TextInput label="ကုန်ပစ္စည်းအမည်" placeholder="ဥပမာ - Pepsi Can 330ml" required value={prodName} onChange={(e) => setProdName(e.target.value)} styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} />
                <TextInput label="ဘားကုဒ်နံပါတ် (Barcode)" placeholder="စကန်ဖတ်ပါ သို့မဟုတ် ရိုက်ထည့်ပါ..." required value={prodBarcode} onChange={(e) => setProdBarcode(e.target.value)} styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a', fontFamily: 'monospace' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <TextInput label="SKU ကုဒ်နံပါတ်" placeholder="ဥပမာ - PEPSI-330" required value={prodSku} onChange={(e) => setProdSku(e.target.value)} styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} />
                <Select label="ရောင်းချသည့်ပုံစံ (Sale Type)" data={['UNIT', 'WEIGHT']} value={prodSaleType} onChange={(val) => setProdSaleType(val || 'UNIT')} styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* 🔗 NumberInputs များကို သန့်ရှင်းစွာ ချိန်ညှိခြင်း (ကီးဘုတ်ဖြင့် စာရိုက်ပြင်ဆင်၍ ရပါသည်) */}
                <NumberInput label="ရင်းဈေး (Cost Price)" placeholder="0 MMK" value={prodCost} onChange={(val) => setProdCost(val || 0)} thousandSeparator="," styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a', fontFamily: 'monospace' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} />
                <NumberInput label="ရောင်းဈေး (Selling Price)" placeholder="0 MMK" value={prodPrice} onChange={(val) => setProdPrice(val || 0)} thousandSeparator="," styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a', fontFamily: 'monospace' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} />
                <NumberInput label="အစဦးလက်ကျန်အရေအတွက်" placeholder="0" value={prodStock} onChange={(val) => setProdStock(val || 0)} thousandSeparator="," styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a', fontFamily: 'monospace' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="တိုင်းတာသည့်ယူနစ် (Unit)"
                  placeholder="တိုင်းတာသည့် ယူနစ်ရွေးချယ်ပါ"
                  data={['Pcs', 'Kg', 'Pack', 'Gram', 'Bottle', 'Box']} // City Mart တွင် အသုံးအများဆုံး စံပြယူနစ်စာရင်းများ
                  value={prodUnit}
                  onChange={(val) => setProdUnit(val || 'Pcs')}
                  styles={{
                    input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' },
                    label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' }
                  }} />

                <Select
                  label="ကုန်ပစ္စည်းအုပ်စု (Category)"
                  placeholder={categories.length === 0 ? "Category များအား ဆွဲယူနေပါသည်..." : "ပစ္စည်းအုပ်စု ရွေးချယ်ပါ"}

                  // 🎯 သော့ချက်အဆင့် — ရရှိလာသော ဒေတာများအား မန်တင်းစံနှုန်း Specs အတိုင်း ဒိုင်နမစ် အပိုင် Mapping ပြုလုပ်ပေးခြင်း
                  data={categories.map((cat) => ({
                    value: String(cat.id),   // 🔗 String() အုပ်ပြီး သတ်မှတ်လိုက်ခြင်းကြောင့် Framework Error လုံးဝ မတက်တော့ပါ
                    label: String(cat.name)  // 🔗 String() အုပ်ပြီး သတ်မှတ်လိုက်ခြင်းကြောင့် Framework Error လုံးဝ မတက်တော့ပါ
                  }))}

                  value={prodCategoryId}
                  onChange={(val) => setProdCategoryId(val || '')}
                  styles={{
                    input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' },
                    label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' }
                  }}
                />
                {/* <Select label="ကုန်ပစ္စည်းအုပ်စု (Category)" data={[{ value: '9f074d0e-953e-4b40-9a3d-425886616238', label: 'အချိုရည် / စားသောက်ကုန်' }]} value={prodCategoryId} onChange={(val) => setProdCategoryId(val || '')} styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} /> */}
              </div>

              <Divider color="#2e303a" className="my-2" />

              <Group justify="flex-end">
                <Button type="submit" color={activeTheme.badgeColor} size="md" loading={formLoading} className="px-8 font-bold">
                  ကုန်ပစ္စည်းအသစ်သိမ်းဆည်းမည်
                </Button>
              </Group>
            </form>
          </Paper>
        ) : (
          /* အရောင်းမှတ်တမ်း၊ အင်ဗင်ထရီ နှင့် အရောင်းကောင်တာ မဟုတ်သော ကျန်ရှိသည့် Views များအတွက် Placeholder */
          <Paper className={`flex-1 flex flex-col items-center justify-center p-12 ${activeTheme.panel} border ${activeTheme.border}`} radius="md">
            <IconBox size={64} className="text-gray-500 mb-4" />
            <Text size="xl" className="text-white font-bold mb-2">City Mart {activeView} Module</Text>
          </Paper>
        )}
      </main>

      {/* 💡 FIXED: activeView === 'counter' ဖြစ်မှသာ ညာဘက်ခြမ်း Checkout Sidebar Panel အား ချပြခိုင်းခြင်း ⭐ */}
      {activeView === 'counter' && (
        <aside className={`${activeTheme.panel} flex h-full w-[380px] shrink-0 flex-col justify-between border-l ${activeTheme.border} p-6 print:hidden`}>
          <div className={`border-b ${activeTheme.border} pb-6`}>
            <div className="mb-2 flex items-center gap-3">
              <IconReceipt size={32} className={activeTheme.primaryText} />
              <h2 className="m-0 text-2xl font-bold text-white">City Mart Counter</h2>
            </div>
            <p className="m-0 text-sm text-gray-400">Enterprise Modern Multi-Theme စနစ်</p>

            <div className="mt-12 flex justify-between text-lg text-gray-300">
              <span>စုစုပေါင်း ပစ္စည်းအမျိုးအစား:</span>
              <span className="font-bold text-white">{cartItems.length} မျိုး</span>
            </div>

            <div className={`mt-8 flex flex-col rounded-lg border ${activeTheme.bg} ${activeTheme.border} p-4`}>
              <span className="text-sm font-semibold tracking-wider text-gray-400">TOTAL AMOUNT</span>
              <span className="mt-2 font-mono text-4xl font-extrabold text-[#10b981]">
                {grandTotal.toLocaleString()} <span className="text-lg font-bold">MMK</span>
              </span>
            </div>
          </div>

          <Button
            color={activeTheme.badgeColor}
            size="xl"
            radius="md"
            className="h-auto w-full py-4 text-xl font-bold shadow-lg"
            leftSection={<IconReceipt size={24} />}
            onClick={open}
            disabled={cartItems.length === 0}
          >
            ငွေရှင်းမည် (F2)
          </Button>
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

        {/* --------------------- */}
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

          {/* ⚠️ အဆင့် ၂၂ အပြီးသတ် FIXED: Brackets နှင့် Styles အမှား ၄ ခုစလုံးအား ရာနှုန်းပြည့် ခြေဖျက်ပြီးသား ကုဒ်စစ်စစ် ဖြစ်ပါသည် 🎯 ⭐ */}
          {
            (paymentMethod === 'KPay' || paymentMethod === 'WaveMoney') && (
              <Paper p="sm" radius="md" className="mt-4 flex flex-col items-center justify-center bg-white border border-gray-200 p-4">
                <Text fw={700} size="xs" className="mb-3 tracking-wide text-gray-700 text-center w-full">
                  [ LIVE DIGITAL PAYMENT QR CODE ]
                </Text>


                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`CITYMART-POS|TOTAL:${grandTotal}|METHOD:${paymentMethod}`)}`}
                  alt="Digital Payment QR Code"
                  style={{ width: '200px', height: '200px', objectFit: 'contain', margin: '0 auto' }}
                  className="shadow-md my-3 block rounded-md"
                />

                <Text fw={600} size="xs" className="text-gray-500 mt-2.5 text-center w-full ">
                  ကျသင့်ငွေ အတိအကျ - {grandTotal.toLocaleString()} MMK
                </Text>
              </Paper>
            )
          }

        </div>
        {/* --------------------- */}
        {/* 🖨️ ပရင်တာမှ ထွက်လာမည့် တကယ့် 80mm စက္ကူလိပ်ဒီဇိုင်း (Print Layer Area) */}
        <div id="receipt-print-area" className="p-4 font-mono text-sm leading-relaxed text-gray-200 print:text-black print:p-0 print:w-[80mm] mx-auto bg-[#16171d] print:bg-white rounded-lg border border-[#2e303a] print:border-none">
          {/* 🔗 FIXED: Random ဂဏန်းများအစား တကယ့် PostgreSQL Database မှ ထွက်လာသော တရားဝင် စီစဉ်နံပါတ်အား ထုတ်ပြခြင်း 🎯 ⭐ */}
          <div className="text-center mb-4">
            <Text size="xl" className="font-extrabold text-white print:text-black">CITY MART SUPERMARKET</Text>
            <div className="text-left mt-4 text-xs border-b border-dashed border-gray-600 pb-2">
              <div>နေ့ရက် - {new Date().toLocaleString('en-MM')}</div>

              {/* ⚠️ ဤနေရာတွင် ရွေးချယ်ထားသော ဘောက်ချာ သို့မဟုတ် ခြင်းတောင်းမှ ထွက်လာသော invoiceNo အား ကွက်တိ ချိတ်ဆက်ခြင်း */}
              <div className="font-bold text-white print:text-black">
                ဘောက်ချာနံပါတ် - {selectedOrder ? selectedOrder.invoiceNo : `INV-${new Date().getFullYear()}-XXXXX`}
              </div>

              <div>ငွေရှင်းစနစ် - {paymentMethod}</div>
              <div>ဝန်ထမ်း - cashier_01</div>
            </div>
          </div>

          {/* စလစ်ထဲရှိ ပစ္စည်းစာရင်းဇယားအကျဉ်း */}
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

          {/* စုစုပေါင်းငွေ တွက်ချက်မှုပြကွက် */}
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

        {/* Modal အောက်ခြေ ပရင့်ထုတ်မည့် ခလုတ် (ပရင့်ထုတ်ချိန်တွင် ၎င်းခလုတ်များ အလိုအလျောက် ပျောက်နေရပါမည်) */}
        <Group className="mt-6 print:hidden" justify="flex-end">
          <Button variant="subtle" color="gray" onClick={close} disabled={loading}>ပယ်ဖျက်မည်</Button>
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

      {/* show the details of items list */}
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
            {/* ဘောက်ချာ၏ ပင်မ Metadata အချက်အလက်များ */}
            <div className="grid grid-cols-2 gap-3 bg-[#16171d] p-4 rounded-md border border-[#2e303a]">
              <div><Text size="xs" color="gray">INVOICE NO :</Text><Text fw="bold" color="cyan">INV-{selectedOrder.id.slice(0, 8).toUpperCase()}</Text></div>
              <div><Text size="xs" color="gray">DATE / TIME :</Text><Text fw="bold">{new Date(selectedOrder.createdAt).toLocaleString('en-MM')}</Text></div>
              <div><Text size="xs" color="gray">PAYMENT METHOD :</Text><Badge color="blue" variant="light">{selectedOrder.paymentMethod}</Badge></div>
              <div><Text size="xs" color="gray">CASHIER ID :</Text><Text fw="bold" size="xs" className="truncate">{selectedOrder.cashierId}</Text></div>
            </div>

            {/* ဝယ်ယူသွားခဲ့သော ပစ္စည်းစာရင်းဇယားကွက် သီးသန့်ပြကွက် */}
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

            {/* စုစုပေါင်းငွေရှင်းတမ်း ဖြတ်ပိုင်းအကျဉ်း */}
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


    </div>
  );
}

export default App;
