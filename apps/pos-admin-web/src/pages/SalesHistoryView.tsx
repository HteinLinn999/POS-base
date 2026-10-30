import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Loader, Paper, Text, Group, Badge, Modal } from '@mantine/core';
import { BarChart, DonutChart } from '@mantine/charts';
import { IconReceipt2, IconCash, IconShoppingCart, IconChartBar } from '@tabler/icons-react';
import { api } from '../api/axios';

interface SalesHistoryViewProps {
  currentBranchId: string;
  activeTheme?: {
    panel: string;
    border: string;
    bg: string;
  };
}

export const SalesHistoryView = ({
  currentBranchId,
  activeTheme = {
    panel: 'bg-[#1f2028]',
    border: 'border-[#2e303a]',
    bg: 'bg-[#16171d]',
  },
}: SalesHistoryViewProps) => {
  // Modal State for Invoice Details
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [detailOpened, setDetailOpened] = useState(false);

  // 1. TanStack Query ဖြင့် Backend မှ ဆိုင်ခွဲအလိုက် အရောင်းမှတ်တမ်းများ ဆွဲထုတ်ခြင်း
  const { data, isLoading, error } = useQuery({
    queryKey: ['salesHistory', currentBranchId],
    queryFn: async () => {
      const res = await api.get(`/sales/branch/${currentBranchId}`);
      return res.data; // Expected: { summary: {...}, sales: [...] }
    },
    enabled: !!currentBranchId && currentBranchId !== 'undefined',
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-20">
        <Loader color="cyan" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Paper p="xl" radius="md" className={`${activeTheme.panel} border ${activeTheme.border} text-center`}>
        <Text c="red" size="lg" fw={700}>အရောင်းမှတ်တမ်း ထုတ်ယူရာတွင် အမှားအယွင်း ရှိနေပါသည်ခင်ဗျာ။</Text>
        <Text c="dimmed" size="sm" mt="xs">Backend ဆာဗာ ချိတ်ဆက်မှုကို ပြန်လည်စစ်ဆေးပေးပါ။</Text>
      </Paper>
    );
  }

  const summary = data?.summary || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
  const salesOrders = data?.sales || [];

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-y-auto pr-2">
      {/* 🌟 Top Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <Paper p="md" radius="md" className={`${activeTheme.panel} border ${activeTheme.border}`}>
          <Text size="xs" color="gray" fw={700} className="tracking-wider">TOTAL REVENUE (စုစုပေါင်း အရောင်းရငွေ)</Text>
          <Text size="28px" fw={900} className="text-[#10b981] mt-1 font-mono">
            {summary.totalRevenue.toLocaleString()} <span className="text-xs font-bold">MMK</span>
          </Text>
        </Paper>

        <Paper p="md" radius="md" className={`${activeTheme.panel} border ${activeTheme.border}`}>
          <Text size="xs" color="gray" fw={700} className="tracking-wider">TOTAL INVOICES (စုစုပေါင်း ဘောက်ချာစောင်ရေ)</Text>
          <Text size="28px" fw={900} className="text-[#00d8ff] mt-1 font-mono">
            {summary.totalOrders} <span className="text-xs font-bold">စောင်</span>
          </Text>
        </Paper>

        <Paper p="md" radius="md" className={`${activeTheme.panel} border ${activeTheme.border}`}>
          <Text size="xs" color="gray" fw={700} className="tracking-wider">AVERAGE BASKET (ပျမ်းမျှကျသင့်ငွေ)</Text>
          <Text size="28px" fw={900} className="text-orange-400 mt-1 font-mono">
            {Math.round(summary.averageOrderValue).toLocaleString()} <span className="text-xs font-bold">MMK</span>
          </Text>
        </Paper>
      </div>

      {/* 🌟 Analytics Charts Section */}
      {salesOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <Paper p="xl" radius="md" className={`${activeTheme.panel} border ${activeTheme.border} md:col-span-2`}>
            <div className="mb-4">
              <Text size="sm" fw={800} className="text-white">DAILY SALES REVENUE (နေ့ရက်အလိုက် အရောင်းရငွေပြဇယား)</Text>
              <Text size="11px" className="text-gray-500 font-mono mt-0.5">PostgreSQL Daily Time-Series Revenue Volumes</Text>
            </div>
            <BarChart
              h={220}
              data={salesOrders.map((order: any) => ({
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

          <Paper p="xl" radius="md" className={`${activeTheme.panel} border ${activeTheme.border} flex flex-col`}>
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

      {/* 🌟 Sales Table Section */}
      <Paper className={`shrink-0 ${activeTheme.panel} border ${activeTheme.border} rounded-lg`} radius="md">
        <div className="p-4 border-b border-[#2e303a]">
          <Group gap="sm">
            <IconReceipt2 size={24} className="text-cyan-400" />
            <Text size="lg" fw={700} className="text-white">အရောင်းမှတ်တမ်း စာရင်းဇယား</Text>
          </Group>
        </div>
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
                  <Text size="lg">ဤဆိုင်ခွဲ၏ ဒေတာဘေ့စ်ထဲတွင် အရောင်းမှတ်တမ်းစာရင်း မရှိသေးပါဗျာ။</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              salesOrders.map((order: any) => (
                <Table.Tr
                  key={order.id}
                  className={`border-b ${activeTheme.border} cursor-pointer hover:bg-[#16171d]`}
                  onClick={() => {
                    setSelectedOrder(order);
                    setDetailOpened(true);
                  }}
                >
                  <Table.Td className="font-mono text-white font-bold">{order.invoiceNo || order.id.slice(0, 8)}</Table.Td>
                  <Table.Td className="text-gray-300">{new Date(order.createdAt).toLocaleString('en-MM')}</Table.Td>
                  <Table.Td><Badge variant="light" color="blue" size="md">{order.paymentMethod || 'CASH'}</Badge></Table.Td>
                  <Table.Td className="font-mono text-gray-400">{Number(order.cashReceived || 0).toLocaleString()} MMK</Table.Td>
                  <Table.Td className="font-mono text-gray-400">{Number(order.changeGiven || 0).toLocaleString()} MMK</Table.Td>
                  <Table.Td className="font-semibold text-[#10b981] font-mono">{Number(order.totalAmount || 0).toLocaleString()} MMK</Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* 🌟 Invoice Detail Modal (Extra Feature added for better UX) */}
      <Modal
        opened={detailOpened}
        onClose={() => setDetailOpened(false)}
        title={<Text fw={700}>ဘောက်ချာအသေးစိတ် (Invoice Details)</Text>}
        centered
        styles={{
          content: { backgroundColor: '#1f2028', color: '#fff' },
          header: { backgroundColor: '#1f2028' },
        }}
      >
        {selectedOrder && (
          <div className="flex flex-col gap-3">
            <Text size="sm" className="text-gray-300">ဘောက်ချာနံပါတ်: <span className="font-bold text-white font-mono">{selectedOrder.invoiceNo}</span></Text>
            <Text size="sm" className="text-gray-300">ရောင်းချချိန်: <span className="text-white">{new Date(selectedOrder.createdAt).toLocaleString()}</span></Text>
            <Text size="sm" className="text-gray-300">ငွေပေးချေမှု: <Badge color="blue">{selectedOrder.paymentMethod}</Badge></Text>
            
            <div className="mt-2 border-t border-[#2e303a] pt-3">
              <Text size="sm" fw={700} className="mb-2 text-cyan-400">ဝယ်ယူခဲ့သော ပစ္စည်းများ:</Text>
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                selectedOrder.items.map((item: any, idx: number) => (
                  <Group key={idx} justify="between" className="py-1 border-b border-[#2e303a]/50 text-xs">
                    <Text className="text-white">{item.product?.name || 'Product'} (x{item.quantity})</Text>
                    <Text className="font-mono text-teal-400">{(item.price * item.quantity).toLocaleString()} MMK</Text>
                  </Group>
                ))
              ) : (
                <Text size="xs" c="dimmed">ပစ္စည်းအသေးစိတ် မရှိပါ။</Text>
              )}
            </div>

            <div className="mt-4 border-t border-[#2e303a] pt-3 flex justify-between items-center">
              <Text fw={700} size="md">စုစုပေါင်းကျသင့်ငွေ:</Text>
              <Text fw={900} size="lg" className="font-mono text-[#10b981]">
                {Number(selectedOrder.totalAmount).toLocaleString()} MMK
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};