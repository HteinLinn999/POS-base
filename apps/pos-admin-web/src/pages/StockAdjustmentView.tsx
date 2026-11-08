import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Paper, Text, Group, Button, NumberInput, Select, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAdjustments, IconHistory } from '@tabler/icons-react';
import { api } from '../api/axios';

interface StockAdjustmentProps {
  currentBranchId: string;
}

interface BranchStockOption {
  productId: string;
  quantity: number;
  product: {
    name: string;
  };
}

interface StockAuditHistory {
  id: string;
  createdAt: string;
  transactionType: string;
  quantity: number;
  reason?: string | null;
  product?: {
    name?: string;
  } | null;
}

export const StockAdjustmentView = ({ currentBranchId }: StockAdjustmentProps) => {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [txType, setTxType] = useState<string>('ADJUSTMENT');

  const queryClient = useQueryClient();

  const { data: stocks = [] } = useQuery<BranchStockOption[]>({
    queryKey: ['branchStocks', currentBranchId],
    queryFn: async () => {
      const response = await api.get(`/branch-stocks/${currentBranchId}`);
      return response.data;
    },
    enabled: !!currentBranchId && currentBranchId !== 'undefined',
  });

  const { data: auditHistories = [] } = useQuery<StockAuditHistory[]>({
    queryKey: ['stockAuditHistory'],
    queryFn: async () => {
      const response = await api.get('/branch-stocks/history/audit');
      return response.data;
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async (payload: {
      branchId: string;
      productId: string;
      quantity: number;
      transactionType: string;
      reason: string;
    }) => api.post('/branch-stocks/adjust', payload),
    onSuccess: () => {
      notifications.show({
        title: 'အောင်မြင်ပါသည်',
        message: 'Stock စာရင်း ချိန်ညှိမှု ပြီးစီးပါပြီ',
        color: 'teal',
      });
      queryClient.invalidateQueries({ queryKey: ['branchStocks', currentBranchId] });
      queryClient.invalidateQueries({ queryKey: ['stockAuditHistory'] });
      setAdjustmentQty(0);
      setReason('');
      setSelectedProductId(null);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'မအောင်မြင်ပါ';

      notifications.show({
        title: 'အမှားအယွင်းရှိပါသည်',
        message,
        color: 'red',
      });
    },
  });

  const handleExecuteAdjustment = () => {
    if (!currentBranchId || currentBranchId === 'undefined') {
      notifications.show({
        title: 'သတိပေးချက်',
        message: 'လက်ရှိဆိုင်ခွဲကို ရွေးချယ်ပေးပါ။',
        color: 'yellow',
      });
      return;
    }

    if (!selectedProductId || !reason.trim() || adjustmentQty === 0) {
      notifications.show({
        title: 'သတိပေးချက်',
        message: 'ကုန်ပစ္စည်း၊ သုညမဟုတ်သော ပမာဏနှင့် အကြောင်းရင်း (Reason) ကို ထည့်ပါ။',
        color: 'yellow',
      });
      return;
    }

    adjustMutation.mutate({
      branchId: currentBranchId,
      productId: selectedProductId,
      quantity: adjustmentQty,
      transactionType: txType,
      reason: reason.trim(),
    });
  };

  const productOptions = stocks.map((stock) => ({
    value: stock.productId,
    label: `${stock.product.name} (လက်ရှိလက်ကျန်: ${stock.quantity})`,
  }));

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-3 sm:gap-6 sm:p-4 lg:p-6">
      {/* Page Header */}
      <Paper p="md" radius="md" className="min-w-0 border border-[#2e303a] bg-[#1f2028] sm:p-4">
        <Group gap="sm" wrap="nowrap" align="center">
          <IconAdjustments size={28} className="shrink-0 text-cyan-400" />
          <Text size="lg" fw={800} className="min-w-0 break-words text-white sm:text-xl">
            စာရင်းညှိနှိုင်းခြင်းနှင့် ပျက်စီးဆုံးရှုံးမှု (Stock Adjustments &amp; Wastage)
          </Text>
        </Group>
        <Text size="xs" c="dimmed" mt={4}>
          စာရင်းစစ်ခြင်း၊ ပစ္စည်းကွဲအက်ပျက်စီးခြင်းများအတွက် လက်ကျန်အရေအတွက်ကို တိုး/လျှော့ ချိန်ညှိရန်
        </Text>
      </Paper>

      {/* Adjustment Form */}
      <Paper p="md" radius="md" className="flex min-w-0 flex-col gap-4 border border-[#2e303a] bg-[#1f2028] sm:p-4">
        <Text fw={700} size="md" className="text-white">
          ပစ္စည်းလက်ကျန် ပြင်ဆင်ရန် ဖောင်
        </Text>

        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <Select
            label="ကုန်ပစ္စည်းရွေးချယ်ပါ"
            placeholder="ပစ္စည်းအမည်..."
            data={productOptions}
            value={selectedProductId}
            onChange={setSelectedProductId}
            searchable
            nothingFoundMessage="ပစ္စည်းမတွေ့ပါ"
            disabled={!currentBranchId || currentBranchId === 'undefined'}
            className="min-w-0"
            styles={{
              input: {
                backgroundColor: '#16171d',
                color: '#fff',
                border: '1px solid #2e303a',
              },
            }}
          />
          <Select
            label="ပြုလုပ်မည့် အမျိုးအစား (Type)"
            data={[
              { value: 'ADJUSTMENT', label: 'စာရင်းစစ် ချိန်ညှိခြင်း (Adjustment)' },
              { value: 'STOCK_OUT', label: 'ပျက်စီးဆုံးရှုံး / သက်တမ်းကုန် (Wastage)' },
            ]}
            value={txType}
            onChange={(value) => setTxType(value || 'ADJUSTMENT')}
            className="min-w-0"
            styles={{
              input: {
                backgroundColor: '#16171d',
                color: '#fff',
                border: '1px solid #2e303a',
              },
            }}
          />
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <NumberInput
            label="တိုးမည့် သို့မဟုတ် လျှော့မည့် အရေအတွက် (+ သို့မဟုတ် -)"
            value={adjustmentQty}
            onChange={(value) => setAdjustmentQty(Number(value) || 0)}
            allowNegative
            className="min-w-0"
            styles={{
              input: {
                backgroundColor: '#16171d',
                color: '#fff',
                border: '1px solid #2e303a',
              },
            }}
          />
          <TextInput
            label="အကြောင်းရင်း (Reason)"
            placeholder="ဥပမာ - စာရင်းစစ် အပိုတွေ့ရှိ / ဖန်ပုလင်းကွဲအက်"
            value={reason}
            onChange={(event) => setReason(event.currentTarget.value)}
            className="min-w-0"
            styles={{
              input: {
                backgroundColor: '#16171d',
                color: '#fff',
                border: '1px solid #2e303a',
              },
            }}
          />
        </div>

        <Group justify="flex-end" mt="md">
          <Button
            color="cyan"
            onClick={handleExecuteAdjustment}
            loading={adjustMutation.isPending}
            disabled={adjustMutation.isPending}
            className="w-full sm:w-auto"
          >
            စာရင်းအတည်ပြု သိမ်းဆည်းမည်
          </Button>
        </Group>
      </Paper>

      {/* Audit Trail */}
      <Paper
        radius="md"
        className="mt-1 flex min-w-0 shrink-0 flex-col overflow-hidden border border-[#2e303a] bg-[#1f2028]"
      >
        <div className="border-b border-[#2e303a] p-3 sm:p-4">
          <Group gap="sm" wrap="nowrap" align="center">
            <IconHistory size={22} className="shrink-0 text-cyan-400" />
            <Text size="lg" fw={700} className="min-w-0 break-words text-white">
              စနစ်အတွင်း အသေးစိတ် အဝင်/အထွက် မှတ်တမ်း (Audit Trail Logs)
            </Text>
          </Group>
        </div>

        <div className="min-w-0 overflow-x-auto">
          <Table
            verticalSpacing="md"
            horizontalSpacing="lg"
            highlightOnHover
            className="w-full min-w-[900px]"
          >
            <Table.Thead className="bg-[#16171d]">
              <Table.Tr>
                <Table.Th className="whitespace-nowrap text-gray-400">အချိန်</Table.Th>
                <Table.Th className="text-gray-400">ကုန်ပစ္စည်းအမည်</Table.Th>
                <Table.Th className="text-gray-400">အမျိုးအစား</Table.Th>
                <Table.Th className="text-gray-400">ပမာဏ</Table.Th>
                <Table.Th className="text-gray-400">အကြောင်းရင်း / မှတ်တမ်း</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {auditHistories.length > 0 ? (
                auditHistories.map((history) => (
                  <Table.Tr key={history.id} className="border-b border-[#2e303a]">
                    <Table.Td className="whitespace-nowrap font-mono text-xs text-gray-300">
                      {new Date(history.createdAt).toLocaleString('en-MM')}
                    </Table.Td>
                    <Table.Td className="font-bold text-white">
                      {history.product?.name || 'Unknown'}
                    </Table.Td>
                    <Table.Td>
                      <span className="whitespace-nowrap rounded bg-blue-950 px-2 py-1 font-mono text-xs text-blue-400">
                        {history.transactionType}
                      </span>
                    </Table.Td>
                    <Table.Td className="font-mono text-cyan-400">{history.quantity}</Table.Td>
                    <Table.Td className="max-w-[360px] whitespace-normal break-words text-gray-300">
                      {history.reason || '-'}
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={5} className="py-10 text-center text-gray-400">
                    မှတ်တမ်း မရှိသေးပါ။
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </div>
      </Paper>
    </div>
  );
};
