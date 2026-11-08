import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TextInput,
  Loader,
  Paper,
  Text,
  Group,
  Button,
  NumberInput,
  Modal,
  Select,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconBuildingStore,
  IconEdit,
  IconSearch,
  IconArrowsExchange,
} from '@tabler/icons-react';
import { fetchStocksByBranch } from '../../services/stockService';
import { api } from '../api/axios';
import axios from 'axios';

interface BranchStockViewProps {
  currentBranchId: string;
}

interface BranchStockItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    sku: string;
    price: number | string;
  };
}

interface BranchOption {
  id: string;
  name: string;
  code: string;
}

export const BranchStockView = ({ currentBranchId }: BranchStockViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<BranchStockItem | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [editModalOpened, setEditModalOpened] = useState(false);

  const [transferModalOpened, setTransferModalOpened] = useState(false);
  const [transferItem, setTransferItem] = useState<BranchStockItem | null>(null);
  const [targetBranchId, setTargetBranchId] = useState<string | null>(null);
  const [transferQty, setTransferQty] = useState<number>(1);

  const queryClient = useQueryClient();

  const {
    data: stocks,
    isLoading,
    error,
  } = useQuery<BranchStockItem[]>({
    queryKey: ['branchStocks', currentBranchId],
    queryFn: () => fetchStocksByBranch(currentBranchId),
    enabled: !!currentBranchId && currentBranchId !== 'undefined',
  });

  const { data: branches } = useQuery<BranchOption[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data;
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async (data: {
      branchId: string;
      productId: string;
      quantity: number;
    }) => api.post('/branch-stocks/update', data),
    onSuccess: () => {
      notifications.show({
        title: 'အောင်မြင်ပါသည်',
        message: 'Stock ပမာဏကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ',
        color: 'teal',
      });
      queryClient.invalidateQueries({ queryKey: ['branchStocks', currentBranchId] });
      setEditModalOpened(false);
    },
    onError: (error: unknown) => {
      let message = 'Stock ပြင်ဆင်ခြင်း မအောင်မြင်ပါ';
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      notifications.show({
        title: 'အမှားအယွင်းရှိပါသည်',
        message,
        color: 'red',
      });
    },
  });

  const transferStockMutation = useMutation({
    mutationFn: async (data: {
      fromBranchId: string;
      toBranchId: string;
      productId: string;
      quantity: number;
    }) => api.post('/branch-stocks/transfer', data),
    onSuccess: () => {
      notifications.show({
        title: 'အောင်မြင်ပါသည်',
        message: 'ပစ္စည်းလွှဲပြောင်းမှု အောင်မြင်ပါသည်',
        color: 'teal',
      });
      queryClient.invalidateQueries({ queryKey: ['branchStocks', currentBranchId] });
      setTransferModalOpened(false);
    },
    onError: (error: unknown) => {
      let message = 'ပစ္စည်းလွှဲပြောင်းခြင်း မအောင်မြင်ပါ';
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      notifications.show({
        title: 'အမှားအယွင်းရှိပါသည်',
        message,
        color: 'red',
      });
    },
  });

  const filteredStocks = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return stocks ?? [];

    return (stocks ?? []).filter((item) =>
      item.product.name.toLocaleLowerCase().includes(query) ||
      item.product.sku.toLocaleLowerCase().includes(query)
    );
  }, [stocks, searchQuery]);

  const branchOptions = useMemo(
    () =>
      (branches ?? [])
        .filter((branch) => branch.id !== currentBranchId)
        .map((branch) => ({
          value: branch.id,
          label: `${branch.name} (${branch.code})`,
        })),
    [branches, currentBranchId]
  );

  const handleOpenEdit = (item: BranchStockItem) => {
    setSelectedItem(item);
    setNewQuantity(item.quantity);
    setEditModalOpened(true);
  };

  const handleOpenTransfer = (item: BranchStockItem) => {
    setTransferItem(item);
    setTransferQty(1);
    setTargetBranchId(null);
    setTransferModalOpened(true);
  };

  const handleSaveStock = () => {
    if (!selectedItem) return;

    updateStockMutation.mutate({
      branchId: currentBranchId,
      productId: selectedItem.productId,
      quantity: newQuantity,
    });
  };

  const handleExecuteTransfer = () => {
    if (!transferItem || !targetBranchId) return;

    transferStockMutation.mutate({
      fromBranchId: currentBranchId,
      toBranchId: targetBranchId,
      productId: transferItem.productId,
      quantity: transferQty,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] w-full items-center justify-center p-6 sm:p-10">
        <Loader color="cyan" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Paper p="md" radius="md" className="border border-[#2e303a] bg-[#1f2028] text-center sm:p-6">
        <Text c="red" size="lg" fw={700}>
          Stock စာရင်း ထုတ်ယူရာတွင် အမှားအယွင်း ရှိနေပါသည်ခင်ဗျာ။
        </Text>
        <Text c="dimmed" size="sm" mt="xs">
          Backend ဆာဗာ ချိတ်ဆက်မှုကို ပြန်လည်စစ်ဆေးပေးပါ။
        </Text>
      </Paper>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-3 sm:gap-6 sm:p-4 lg:p-6">
      {/* Header and Search */}
      <Paper p="md" radius="md" className="min-w-0 border border-[#2e303a] bg-[#1f2028] sm:p-4">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Group gap="sm" wrap="nowrap" align="center">
              <IconBuildingStore size={28} className="shrink-0 text-cyan-400" />
              <Text size="lg" fw={800} className="min-w-0 break-words text-white sm:text-xl">
                ဆိုင်ခွဲအလိုက် ပစ္စည်းလက်ကျန် စာရင်း (Multi-Store Stock)
              </Text>
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              ရွေးချယ်ထားသော ဆိုင်ခွဲ၏ Real-time ကုန်ပစ္စည်းလက်ကျန် စာရင်းများနှင့် လွှဲပြောင်းမှုများ ပြုလုပ်ရန်
            </Text>
          </div>

          <TextInput
            placeholder="ပစ္စည်းအမည် သို့မဟုတ် SKU ဖြင့် ရှာရန်..."
            leftSection={<IconSearch size={18} className="text-gray-400" />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            size="md"
            className="w-full shrink-0 lg:w-[320px]"
            styles={{
              input: {
                backgroundColor: '#16171d',
                color: '#fff',
                border: '1px solid #2e303a',
              },
            }}
          />
        </div>
      </Paper>

      {/* Stock Table: horizontal scroll on narrow screens */}
      <Paper radius="md" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-[#2e303a] bg-[#1f2028]">
        <div className="min-h-0 min-w-0 flex-1 overflow-auto">
          <Table
            verticalSpacing="md"
            horizontalSpacing="lg"
            highlightOnHover
            className="w-full min-w-[780px]"
            stickyHeader
          >
            <Table.Thead className="sticky top-0 z-10 bg-[#16171d]">
              <Table.Tr>
                <Table.Th className="border-b border-gray-700 font-semibold text-gray-400">SKU ကုဒ်</Table.Th>
                <Table.Th className="border-b border-gray-700 font-semibold text-gray-400">ကုန်ပစ္စည်းအမည်</Table.Th>
                <Table.Th className="border-b border-gray-700 font-semibold text-gray-400">ရောင်းဈေး (MMK)</Table.Th>
                <Table.Th className="border-b border-gray-700 font-semibold text-gray-400">လက်ကျန် အရေအတွက် (Stock)</Table.Th>
                <Table.Th className="border-b border-gray-700 text-right font-semibold text-gray-400">လုပ်ဆောင်ချက်</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredStocks.length > 0 ? (
                filteredStocks.map((item) => (
                  <Table.Tr key={item.id} className="border-b border-[#2e303a] hover:bg-[#16171d]">
                    <Table.Td className="font-mono font-bold text-cyan-400">{item.product.sku}</Table.Td>
                    <Table.Td className="font-medium text-white">{item.product.name}</Table.Td>
                    <Table.Td className="whitespace-nowrap font-mono text-gray-300">
                      {Number(item.product.price).toLocaleString()} MMK
                    </Table.Td>
                    <Table.Td>
                      <span
                        className={`inline-flex whitespace-nowrap items-center rounded-full px-3 py-1 text-xs font-bold font-mono ${
                          item.quantity > 10
                            ? 'border border-teal-800 bg-teal-950 text-teal-400'
                            : 'animate-pulse border border-red-800 bg-red-950 text-red-400'
                        }`}
                      >
                        {item.quantity} ခု ({item.quantity > 10 ? 'လက်ကျန်အဆင်ပြေ' : 'လက်ကျန်ပြတ်လုနီးပါး'})
                      </span>
                    </Table.Td>
                    <Table.Td className="text-right">
                      <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <Button
                          size="xs"
                          variant="light"
                          color="cyan"
                          leftSection={<IconEdit size={14} />}
                          onClick={() => handleOpenEdit(item)}
                        >
                          ပြင်ရန်
                        </Button>
                        <Button
                          size="xs"
                          variant="light"
                          color="orange"
                          leftSection={<IconArrowsExchange size={14} />}
                          onClick={() => handleOpenTransfer(item)}
                        >
                          လွှဲပြောင်းမည်
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={5} className="border-none py-16 text-center text-gray-400 sm:py-20">
                    <Text size="lg">ဤဆိုင်ခွဲတွင် ကုန်ပစ္စည်းလက်ကျန် စာရင်း မရှိသေးပါ။</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </div>
      </Paper>

      {/* Stock Edit Modal */}
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title="ပစ္စည်းလက်ကျန် (Stock) ချိန်ညှိခြင်း"
        centered
        size="md"
        styles={{
          content: {
            backgroundColor: '#1f2028',
            color: '#fff',
            maxWidth: 'calc(100vw - 2rem)',
            maxHeight: 'calc(100dvh - 2rem)',
            overflowY: 'auto',
          },
          header: { backgroundColor: '#1f2028' },
        }}
      >
        {selectedItem && (
          <div className="flex min-w-0 flex-col gap-4">
            <Text size="sm" className="break-words text-gray-300">
              ကုန်ပစ္စည်း: <span className="font-bold text-white">{selectedItem.product.name}</span>
            </Text>
            <NumberInput
              label="လက်ကျန် အရေအတွက် အသစ်"
              value={newQuantity}
              onChange={(value) => setNewQuantity(Number(value) || 0)}
              min={0}
              className="w-full"
              styles={{
                input: {
                  backgroundColor: '#16171d',
                  color: '#fff',
                  border: '1px solid #2e303a',
                },
              }}
            />
            <Group justify="flex-end" mt="md" className="flex-col-reverse sm:flex-row">
              <Button
                variant="default"
                onClick={() => setEditModalOpened(false)}
                className="w-full border-gray-600 bg-transparent text-gray-300 sm:w-auto"
              >
                မလုပ်တော့ပါ
              </Button>
              <Button
                color="cyan"
                onClick={handleSaveStock}
                loading={updateStockMutation.isPending}
                disabled={updateStockMutation.isPending}
                className="w-full sm:w-auto"
              >
                အတည်ပြုမည်
              </Button>
            </Group>
          </div>
        )}
      </Modal>

      {/* Branch-to-Branch Transfer Modal */}
      <Modal
        opened={transferModalOpened}
        onClose={() => setTransferModalOpened(false)}
        title="ဆိုင်ခွဲအချင်းချင်း ပစ္စည်းလွှဲပြောင်းခြင်း (Stock Transfer)"
        centered
        size="md"
        styles={{
          content: {
            backgroundColor: '#1f2028',
            color: '#fff',
            maxWidth: 'calc(100vw - 2rem)',
            maxHeight: 'calc(100dvh - 2rem)',
            overflowY: 'auto',
          },
          header: { backgroundColor: '#1f2028' },
        }}
      >
        {transferItem && (
          <div className="flex min-w-0 flex-col gap-4">
            <Text size="sm" className="break-words text-gray-300">
              လွှဲပြောင်းမည့်ပစ္စည်း: <span className="font-bold text-white">{transferItem.product.name}</span>
            </Text>
            <Text size="xs" className="text-cyan-400">
              လက်ရှိလက်ကျန်: {transferItem.quantity} ခု
            </Text>

            <Select
              label="သို့ ပို့မည့် ဆိုင်ခွဲ (Target Branch)"
              placeholder="ဆိုင်ခွဲရွေးချယ်ပါ..."
              data={branchOptions}
              value={targetBranchId}
              onChange={setTargetBranchId}
              searchable
              styles={{
                input: {
                  backgroundColor: '#16171d',
                  color: '#fff',
                  border: '1px solid #2e303a',
                },
              }}
            />

            <NumberInput
              label="လွှဲပြောင်းမည့် အရေအတွက် (Quantity)"
              value={transferQty}
              onChange={(value) => setTransferQty(Number(value) || 1)}
              min={1}
              max={transferItem.quantity}
              styles={{
                input: {
                  backgroundColor: '#16171d',
                  color: '#fff',
                  border: '1px solid #2e303a',
                },
              }}
            />

            <Group justify="flex-end" mt="md" className="flex-col-reverse sm:flex-row">
              <Button
                variant="default"
                onClick={() => setTransferModalOpened(false)}
                className="w-full border-gray-600 bg-transparent text-gray-300 sm:w-auto"
              >
                မလုပ်တော့ပါ
              </Button>
              <Button
                color="orange"
                onClick={handleExecuteTransfer}
                loading={transferStockMutation.isPending}
                disabled={transferStockMutation.isPending || !targetBranchId}
                className="w-full sm:w-auto"
              >
                လွှဲပြောင်းမည်
              </Button>
            </Group>
          </div>
        )}
      </Modal>
    </div>
  );
};
