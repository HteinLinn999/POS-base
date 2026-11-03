import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Paper, Text, Group, Button, NumberInput, Select, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAdjustments, IconHistory } from '@tabler/icons-react';
import { api } from '../api/axios';

interface StockAdjustmentProps {
  currentBranchId: string;
}

export const StockAdjustmentView = ({ currentBranchId }: StockAdjustmentProps) => {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [txType, setTxType] = useState<string>('ADJUSTMENT');

  const queryClient = useQueryClient();

  // ကုန်ပစ္စည်းစာရင်းများ ဆွဲထုတ်ရန်
  const { data: stocks } = useQuery({
    queryKey: ['branchStocks', currentBranchId],
    queryFn: async () => {
      const res = await api.get(`/branch-stocks/${currentBranchId}`);
      return res.data;
    },
  });

  // Audit History များကို ဆွဲထုတ်ရန်
  const { data: auditHistories } = useQuery({
    queryKey: ['stockAuditHistory'],
    queryFn: async () => {
      const res = await api.get('/branch-stocks/history/audit');
      return res.data;
    },
  });

  // Adjustment Mutation
  const adjustMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/branch-stocks/adjust', payload);
    },
    onSuccess: () => {
      notifications.show({ title: 'အောင်မြင်ပါသည်', message: 'Stock စာရင်း ချိန်ညှိမှု ပြီးစီးပါပြီ', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['branchStocks', currentBranchId] });
      queryClient.invalidateQueries({ queryKey: ['stockAuditHistory'] });
      setAdjustmentQty(0);
      setReason('');
    },
    onError: (err: any) => {
      notifications.show({ title: 'အမှားအယွင်းရှိပါသည်', message: err?.response?.data?.message || 'မအောင်မြင်ပါ', color: 'red' });
    },
  });

  const handleExecuteAdjustment = () => {
    if (!selectedProductId || !reason) {
      notifications.show({ title: 'သတိပေးချက်', message: 'ကုန်ပစ္စည်းနှင့် အကြောင်းရင်း (Reason) ကို မဖြစ်မနေ ထည့်ပါ', color: 'yellow' });
      return;
    }
    adjustMutation.mutate({
      branchId: currentBranchId,
      productId: selectedProductId,
      quantity: adjustmentQty,
      transactionType: txType,
      reason,
    });
  };

  const productOptions = stocks?.map((s: any) => ({
    value: s.productId,
    label: `${s.product.name} (လက်ရှိလက်ကျန်: ${s.quantity})`,
  })) || [];

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-2 p-6">
      <Paper p="lg" radius="md" className="bg-[#1f2028] border border-[#2e303a]">
        <Group gap="sm">
          <IconAdjustments size={28} className="text-cyan-400" />
          <Text size="xl" fw={800} className="text-white">စာရင်းညှိနှိုင်းခြင်းနှင့် ပျက်စီးဆုံးရှုံးမှု (Stock Adjustments & Wastage)</Text>
        </Group>
        <Text size="xs" c="dimmed" mt={4}>စာရင်းစစ်ခြင်း၊ ပစ္စည်းကွဲအက်ပျက်စီးခြင်းများအတွက် လက်ကျန်အရေအတွက်ကို တိုး/လျှော့ ချိန်ညှိရန်</Text>
      </Paper>

      {/* Adjustment Form */}
      <Paper p="lg" radius="md" className="bg-[#1f2028] border border-[#2e303a] flex flex-col gap-4">
        <Text fw={700} size="md" className="text-white">ပစ္စည်းလက်ကျန် ပြင်ဆင်ရန် ဖောင်</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="ကုန်ပစ္စည်းရွေးချယ်ပါ"
            placeholder="ပစ္စည်းအမည်..."
            data={productOptions}
            value={selectedProductId}
            onChange={setSelectedProductId}
            searchable
            styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' } }}
          />
          <Select
            label="ပြုလုပ်မည့် အမျိုးအစား (Type)"
            data={[
              { value: 'ADJUSTMENT', label: 'စာရင်းစစ် ချိန်ညှိခြင်း (Adjustment)' },
              { value: 'STOCK_OUT', label: 'ပျက်စီးဆုံးရှုံး / သက်တမ်းကုန် (Wastage)' },
            ]}
            value={txType}
            onChange={(val) => setTxType(val || 'ADJUSTMENT')}
            styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' } }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberInput
            label="တိုးမည့် သို့မဟုတ် လျှော့မည့် အရေအတွက် (+ သို့မဟုတ် -)"
            value={adjustmentQty}
            onChange={(val) => setAdjustmentQty(Number(val) || 0)}
            styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' } }}
          />
          <TextInput
            label="အကြောင်းရင်း (Reason)"
            placeholder="ဥပမာ - စာရင်းစစ် အပိုတွေ့ရှိ / ဖန်ပုလင်းကွဲအက်"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' } }}
          />
        </div>

        <Group justify="flex-end" mt="md">
          <Button color="cyan" onClick={handleExecuteAdjustment} loading={adjustMutation.isPending}>
            စာရင်းအတည်ပြု သိမ်းဆည်းမည်
          </Button>
        </Group>
      </Paper>

      {/* Comprehensive Audit Trail Table */}
      <Paper radius="md" className="flex flex-col overflow-hidden bg-[#1f2028] border border-[#2e303a] mt-4">
        <div className="p-4 border-b border-[#2e303a]">
          <Group gap="sm">
            <IconHistory size={22} className="text-cyan-400" />
            <Text size="lg" fw={700} className="text-white">စနစ်အတွင်း အသေးစိတ် အဝင်/အထွက် မှတ်တမ်း (Audit Trail Logs)</Text>
          </Group>
        </div>
        <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover className="w-full">
          <Table.Thead className="bg-[#16171d]">
            <Table.Tr>
              <Table.Th className="text-gray-400">အချိန်</Table.Th>
              <Table.Th className="text-gray-400">ကုန်ပစ္စည်းအမည်</Table.Th>
              <Table.Th className="text-gray-400">အမျိုးအစား</Table.Th>
              <Table.Th className="text-gray-400">ပမာဏ</Table.Th>
              <Table.Th className="text-gray-400">အကြောင်းရင်း / မှတ်တမ်း</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {auditHistories && auditHistories.length > 0 ? (
              auditHistories.map((hist: any) => (
                <Table.Tr key={hist.id} className="border-b border-[#2e303a]">
                  <Table.Td className="text-gray-300 font-mono text-xs">{new Date(hist.createdAt).toLocaleString('en-MM')}</Table.Td>
                  <Table.Td className="text-white font-bold">{hist.product?.name || 'Unknown'}</Table.Td>
                  <Table.Td><span className="text-xs px-2 py-1 rounded bg-blue-950 text-blue-400 font-mono">{hist.transactionType}</span></Table.Td>
                  <Table.Td className="font-mono text-cyan-400">{hist.quantity}</Table.Td>
                  <Table.Td className="text-gray-300">{hist.reason || '-'}</Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={5} className="text-center py-10 text-gray-400">မှတ်တမ်း မရှိသေးပါ။</Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </div>
  );
};