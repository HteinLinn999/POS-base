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
  IconTrash
} from '@tabler/icons-react';
import { SaleType } from '@pos/shared-types';
import { useCartStore, type ActiveView } from './store/useCartStore';

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
  const [activeTheme, setActiveTheme] = useState<IThemeConfig>(POS_THEMES[0]);
  const inputRef = useRef<HTMLInputElement>(null);

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
    isLeftNavOpen,
    toggleLeftNav,
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

  // 3. Select အတွက် data ကို သီးသန့် variable ဖြင့် ပြင်ဆင်ခြင်း (Infinite Loop မတက်စေရန်)
  const branchDropdownData = branches.map((b: any) => ({
    value: b.id,
    label: `${b.name} (${b.code})`
  }));

  const [memberModalOpened, { open: openMemberModal, close: closeMemberModal }] = useDisclosure(false);
  const [searchPhone, setSearchPhone] = useState<string>('');

  const [currentUser, setCurrentUser] = useState<{ name: string; shift: string }>({
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
    fetchBranches();
  }, [fetchBranches]);

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


  //  const [branches, setBranches] = useState<any[]>([]);

  // Component Mount ဖြစ်ချိန်တွင် Backend မှ Branch များကို လှမ်းဆွဲရန်
  // useEffect(() => {
  //   api.get('/branches')
  //     .then((res) => {
  //       if (res.data && res.data.length > 0) {
  //         setBranches(res.data);
  //         // ပထမဆုံး Branch ကို Default အနေဖြင့် သတ်မှတ်ပေးခြင်း (မရှိသေးပါက)
  //         if (!currentBranchId) {
  //           setCurrentBranchId(res.data[0].id);
  //         }
  //       }
  //     })
  //     .catch((err) => console.error("Branch ဆွဲယူရာတွင် အမှားရှိပါသည်", err));
  // }, [currentBranchId, setCurrentBranchId]);

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

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${activeTheme.bg} text-[#f3f4f6] transition-colors duration-300`}>
      <nav
        className={`${activeTheme.panel} flex h-full shrink-0 flex-col justify-between overflow-hidden border-r ${activeTheme.border} transition-all duration-300 ease-in-out print:hidden ${isLeftNavOpen ? 'w-[240px] px-4 py-6' : 'w-0 border-r-0 px-0 py-6'}`}
        aria-hidden={!isLeftNavOpen}
      >
        <div className="flex flex-col w-full gap-6">
          <div className="flex h-10 w-full items-center justify-start gap-3 overflow-hidden px-2">
            <IconReceipt size={32} className={activeTheme.primaryText} />
            <span className="whitespace-nowrap text-lg font-bold tracking-wide text-white">CITY MART</span>
          </div>

          <div className="mt-4 flex w-full flex-col gap-2">
            {[
              { id: 'counter', label: 'အရောင်းကောင်တာ', icon: <IconShoppingCart size={20} /> },
              { id: 'inventory', label: 'ပစ္စည်းအဝင်/အထွက်', icon: <IconBox size={20} /> },
              { id: 'history', label: 'အရောင်းမှတ်တမ်း', icon: <IconHistory size={20} /> },
              { id: 'crm', label: 'ဖောက်သည်အသင်းဝင် (CRM)', icon: <IconUsers size={20} /> },
              { id: 'staff', label: 'ဝန်ထမ်းစီမံရန်', icon: <IconUser size={20} /> },
              { id: 'settings', label: 'ဆိုင်ဆက်တင်များ', icon: <IconSettings size={20} /> },
            ].map((menu) => (
              <Button
                key={menu.id}
                variant={activeView === menu.id ? 'filled' : 'subtle'}
                color={activeView === menu.id ? activeTheme.badgeColor : 'gray'}
                className="h-11 justify-start"
                size="md"
                leftSection={menu.icon}
                onClick={() => setActiveView(menu.id as ActiveView)}
              >
                <span className="text-base font-medium">{menu.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="w-full bg-[#16171d] p-3 rounded-lg border border-[#2e303a] overflow-hidden cursor-pointer hover:bg-[#1f2028]" onClick={() => {
          setCurrentUser(prev => ({
            name: prev.name === 'cashier_01' ? 'manager_admin' : 'cashier_01',
            shift: prev.name === 'cashier_01' ? 'NIGHT SHIFT' : 'MORNING SHIFT'
          }));
          notifications.show({ title: 'Shift ဂျာစာရင်းပြောင်းလဲခြင်း', message: 'ဝန်ထမ်းအကောင့်နှင့် တာဝန်ကျချိန်အား ပြောင်းလဲလိုက်ပါသည်', color: 'blue' });
        }}>
          <Group gap="xs">
            <ActionIcon variant="light" color={activeTheme.badgeColor} size="md" radius="xl">
              <IconUser size={18} />
            </ActionIcon>
            <div className="flex flex-col truncate">
              <Text size="xs" className="text-white font-bold truncate">{currentUser.name}</Text>
              <Text size="10px" className="text-gray-500 font-semibold tracking-wider">{currentUser.shift}</Text>
            </div>
          </Group>
        </div>
      </nav>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-6 print:hidden">
        <div className="mb-6 flex items-center gap-4">
          <ActionIcon variant="light" color="cyan" size="xl" radius="md" onClick={toggleLeftNav} title="ဘယ်ဘက် Sidebar ဖွင့်/ပိတ်ရန်">
            <IconMenu2 size={24} />
          </ActionIcon>

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

          <Select
            placeholder="ဆိုင်ခွဲရွေးချယ်ပါ"
            data={branchDropdownData}
            value={currentBranchId}
            onChange={(val) => {
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
              input: { backgroundColor: activeTheme.inputBg, color: '#fff', border: '1px solid #2e303a', width: '280px' }
            }}
          />

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
          </Paper>
        ) : activeView === 'history' ? (
          <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-y-auto pr-2">
            <div className="grid grid-cols-3 gap-4 shrink-0">
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
                <Text size="xs" color="gray" fw={700} className="tracking-wider">AVERAGE BASKET (ပျမ်းမျှကျသင့်ငွေ)</Text>
                <Text size="28px" fw={900} className="text-orange-400 mt-1 font-mono">
                  {salesOrders.length > 0
                    ? Math.round(salesOrders.reduce((sum, o) => sum + o.totalAmount, 0) / salesOrders.length).toLocaleString()
                    : 0
                  } <span className="text-xs font-bold">MMK</span>
                </Text>
              </Paper>
            </div>

            {salesOrders.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <Paper p="xl" radius="md" className="bg-[#1f2028] border border-[#2e303a] md:col-span-2">
                  <div className="mb-4">
                    <Text size="sm" fw={800} className="text-white">DAILY SALES REVENUE (နေ့ရက်အလိုက် အရောင်းရငွေပြဇယား)</Text>
                    <Text size="11px" className="text-gray-500 font-mono mt-0.5">PostgreSQL Daily Time-Series Revenue Volumes</Text>
                  </div>
                  <BarChart
                    h={220}
                    data={salesOrders.map((order) => ({
                      date: new Date(order.createdAt).toLocaleDateString('en-MM', { month: 'short', day: 'numeric' }),
                      "အရောင်းရငွေ (MMK)": Number(order.totalAmount)
                    })).reverse()}
                    dataKey="date"
                    series={[{ name: 'အရောင်းရငွေ (MMK)', color: 'cyan.6' }]}
                    tickLine="y"
                    gridAxis="x"
                    textColor="#9ca3af"
                    className="font-mono text-xs"
                  />
                </Paper>

                <Paper p="xl" radius="md" className="bg-[#1f2028] border border-[#2e303a] flex flex-col">
                  <div className="mb-4">
                    <Text size="sm" fw={800} className="text-white">CATEGORY SALES SHARE (အုပ်စုအလိုက် အရောင်းဝေစု)</Text>
                    <Text size="11px" className="text-gray-500 font-mono mt-0.5">Live Database Category Performance</Text>
                  </div>
                  <div className="relative h-[180px] w-full flex items-center justify-center my-auto">
                    <DonutChart
                      size={140}
                      thickness={20}
                      data={[
                        { name: 'အချိုရည် / စားသောက်ကုန်', value: 60, color: 'cyan.6' },
                        { name: 'လတ်ဆတ်သောအသား', value: 25, color: 'teal.6' },
                        { name: 'မုန့်နှင့် သရေစာ', value: 15, color: 'orange.6' },
                      ]}
                      className="font-mono text-xs"
                    />
                  </div>
                </Paper>
              </div>
            )}

            <Paper className={`shrink-0 ${activeTheme.panel} border ${activeTheme.border} rounded-lg`} radius="md">
              <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover className="w-full">
                <Table.Thead className={`${activeTheme.bg}`}>
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
                      <Table.Tr
                        key={order.id}
                        className={`border-b ${activeTheme.border} cursor-pointer hover:bg-[#16171d]`}
                        onClick={() => {
                          setSelectedOrder(order);
                          openDetail();
                        }}
                      >
                        <Table.Td className="font-mono text-white font-bold">{order.invoiceNo}</Table.Td>
                        <Table.Td className="text-gray-300">{new Date(order.createdAt).toLocaleString('en-MM')}</Table.Td>
                        <Table.Td><Badge variant="light" color="blue" size="md">{order.paymentMethod}</Badge></Table.Td>
                        <Table.Td className="font-mono text-gray-400">{Number(order.cashReceived || 0).toLocaleString()} MMK</Table.Td>
                        <Table.Td className="font-mono text-gray-400">{Number(order.changeGiven || 0).toLocaleString()} MMK</Table.Td>
                        <Table.Td className="font-semibold text-[#10b981] font-mono">{Number(order.totalAmount || 0).toLocaleString()} MMK</Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </div>
        ) : activeView === 'inventory' ? (
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
                <NumberInput label="ရင်းဈေး (Cost Price)" placeholder="0 MMK" value={prodCost} onChange={(val) => setProdCost(val || 0)} thousandSeparator="," styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a', fontFamily: 'monospace' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} />
                <NumberInput label="ရောင်းဈေး (Selling Price)" placeholder="0 MMK" value={prodPrice} onChange={(val) => setProdPrice(val || 0)} thousandSeparator="," styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a', fontFamily: 'monospace' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} />
                <NumberInput label="အစဦးလက်ကျန်အရေအတွက်" placeholder="0" value={prodStock} onChange={(val) => setProdStock(val || 0)} thousandSeparator="," styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a', fontFamily: 'monospace' }, label: { color: '#9ca3af', fontWeight: 600, marginBottom: '4px' } }} />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
          <Paper p="xl" radius="md" className={`flex-1 overflow-y-auto ${activeTheme.panel} border ${activeTheme.border}`}>
            <div className="mb-6">
              <Text size="xl" fw={800} className="text-white">CUSTOMER RELATIONSHIP MANAGEMENT (CRM & Loyalty)</Text>
              <Text size="xs" className="text-gray-400 mt-1">ဖောက်သည်အသင်းဝင်များ၏ အချက်အလက်များနှင့် သစ္စာစောင့်သိမှုအမှတ်များကို စီမံခန့်ခွဲရန်</Text>
            </div>
            <Table verticalSpacing="md" horizontalSpacing="lg">
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
          <Paper p="xl" radius="md" className={`flex-1 overflow-y-auto ${activeTheme.panel} border ${activeTheme.border}`}>
            <div className="mb-6">
              <Text size="xl" fw={800} className="text-white">STAFF MANAGEMENT (ဝန်ထမ်းစီမံခန့်ခွဲမှုစနစ်)</Text>
              <Text size="xs" className="text-gray-400 mt-1">ကောင်တာဝန်ထမ်းများနှင့် မန်နေဂျာများ၏ တာဝန်ကျချိန်နှင့် အခြေအနေများကို စစ်ဆေးရန်</Text>
            </div>
            <Table verticalSpacing="md" horizontalSpacing="lg">
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
        ) : (
          <Paper className={`flex-1 flex flex-col items-center justify-center p-12 ${activeTheme.panel} border ${activeTheme.border}`} radius="md">
            <IconBox size={64} className="text-gray-500 mb-4" />
            <Text size="xl" className="text-white font-bold mb-2">City Mart {activeView} Module</Text>
          </Paper>
        )}
      </main>

      {activeView === 'counter' && (
        <aside className={`${activeTheme.panel} flex h-full w-[380px] shrink-0 flex-col justify-between border-l ${activeTheme.border} p-6 print:hidden`}>
          <div className={`border-b ${activeTheme.border} pb-6`}>
            <div className="mb-2 flex items-center gap-3">
              <IconReceipt size={32} className={activeTheme.primaryText} />
              <h2 className="m-0 text-2xl font-bold text-white">City Mart Counter</h2>
            </div>
            <p className="m-0 text-sm text-gray-400">Enterprise Modern Multi-Theme စနစ်</p>

            <div className={`mt-4 p-3 rounded-lg border ${activeTheme.bg} ${activeTheme.border} mb-4`}>
              <Text size="xs" fw={700} color="gray" className="mb-2">CUSTOMER LOYALTY (မန်ဘာဖောက်သည်)</Text>
              {selectedCustomer ? (
                <div className="flex justify-between items-center bg-[#1f2028] p-2 rounded border border-cyan-800">
                  <div className="flex flex-col">
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
                  className='mt-2.5'
                  onClick={openMemberModal}
                >
                  🔍 မန်ဘာရှာရန် (F4 နှိပ်ပါ)
                </Button>
              )}
            </div>

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

            <div className="mt-6 flex flex-col gap-2 max-h-[220px] overflow-y-auto">
              <Text size="xs" fw={700} color="red" className="tracking-wider flex items-center gap-1">
                🚨 LOW STOCK NOTIFICATIONS (လက်ကျန်ပြတ်လုနီးပါးစာရင်း)
              </Text>
              {lowStockItems.length === 0 ? (
                <Text size="xs" color="gray" className="italic mt-1">ပစ္စည်းလက်ကျန်များအားလုံး စိုပြေအဆင်ပြေနေပါသည်</Text>
              ) : (
                lowStockItems.map((prod) => (
                  <div key={prod.id} className="flex justify-between items-center bg-[#ef444415] border border-[#ef444430] p-2.5 rounded-md">
                    <div className="flex flex-col truncate max-w-[180px]">
                      <Text size="xs" fw="bold" className="text-white truncate">{prod.name}</Text>
                      <Text size="10px" className="text-gray-500 font-mono">{prod.barcode}</Text>
                    </div>
                    <Badge color="red" variant="filled" size="sm" className="font-bold">Qty: {prod.stockQuantity}</Badge>
                  </div>
                ))
              )}
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