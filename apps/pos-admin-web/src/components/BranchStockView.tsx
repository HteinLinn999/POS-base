import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStocksByBranch } from "../../services/stockService";
import { Table, TextInput, Loader, Paper, Text, Group, Button, NumberInput, Modal, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { IconBuildingStore, IconEdit, IconSearch, IconArrowsExchange } from "@tabler/icons-react";
import { api } from "../api/axios";
import axios from 'axios';

interface BranchStockViewProps {
  currentBranchId: string;
}

export const BranchStockView = ({ currentBranchId }: BranchStockViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stock Edit States
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [editModalOpened, setEditModalOpened] = useState(false);

  // 🌟 Transfer States & Modal
  const [transferModalOpened, setTransferModalOpened] = useState(false);
  const [transferItem, setTransferItem] = useState<any | null>(null);
  const [targetBranchId, setTargetBranchId] = useState<string | null>(null);
  const [transferQty, setTransferQty] = useState<number>(1);

  const queryClient = useQueryClient();

  // ၁။ TanStack Query ဖြင့် သတ်မှတ်ထားသော ဆိုင်ခွဲ၏ Stock Data များကို ဆွဲထုတ်ခြင်း
  const { data: stocks, isLoading, error } = useQuery({
    queryKey: ['branchStocks', currentBranchId],
    queryFn: () => fetchStocksByBranch(currentBranchId),
    enabled: !!currentBranchId && currentBranchId !== 'undefined',
  });

  // ၂။ ဆိုင်ခွဲများစာရင်းကို ဆွဲထုတ်ရန် (Transfer လုပ်ရန် အခြား Branch များကို ရွေးချယ်နိုင်ရန်)
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data;
    },
  });

  // ၃။ Stock Update Mutation
  const updateStockMutation = useMutation({
    mutationFn: async (data: { branchId: string; productId: string; quantity: number }) => {
      return await api.post(`/branch-stocks/update`, data);
    },
    onSuccess: () => {
      notifications.show({
        title: 'အောင်မြင်ပါသည်',
        message: 'Stock ပမာဏကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ', color: 'teal'
      });
      queryClient.invalidateQueries({ queryKey: ['branchStocks', currentBranchId] });
      setEditModalOpened(false);
    },
    onError: (error: unknown) => {
      let msg = 'Stock ပြင်ဆင်ခြင်း မအောင်မြင်ပါ';
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || msg;
      }
      notifications.show({ title: 'အမှားအယွင်းရှိပါသည်', message: msg, color: 'red' });
    },
  });

  // ၄။ 🌟 Stock Transfer Mutation (Branch-to-Branch)
  const transferStockMutation = useMutation({
    mutationFn: async (data: { fromBranchId: string; toBranchId: string; productId: string; quantity: number }) => {
      return await api.post('/branch-stocks/transfer', data);
    },
    onSuccess: () => {
      notifications.show({ title: 'အောင်မြင်ပါသည်', message: 'ပစ္စည်းလွှဲပြောင်းမှု အောင်မြင်ပါသည်', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['branchStocks', currentBranchId] });
      setTransferModalOpened(false);
    },
    onError: (error: unknown) => {
      let errorMessage = 'ပစ္စည်းလွှဲပြောင်းခြင်း မအောင်မြင်ပါ';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      notifications.show({ title: 'အမှားအယွင်းရှိပါသည်', message: errorMessage, color: 'red' });
    },
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
      <Paper p="xl" radius="md" className="bg-[#1f2028] border border-[#2e303a] text-center">
        <Text c="red" size="lg" fw={700}>Stock စာရင်း ထုတ်ယူရာတွင် အမှားအယွင်း ရှိနေပါသည်ခင်ဗျာ။</Text>
        <Text c="dimmed" size="sm" mt="xs">Backend ဆာဗာ ချိတ်ဆက်မှုကို ပြန်လည်စစ်ဆေးပေးပါ။</Text>
      </Paper>
    );
  }

  const filteredStocks = stocks?.filter((item) =>
    item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenEdit = (item: any) => {
    setSelectedItem(item);
    setNewQuantity(item.quantity);
    setEditModalOpened(true);
  };

  const handleOpenTransfer = (item: any) => {
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

  // Target Branch များကို ရွေးချယ်ရန် Format လုပ်ခြင်း (မိမိ လက်ရှိ Branch ကို ဖယ်ထုတ်မည်)
  const branchOptions = branches
    ? branches
        .filter((b: any) => b.id !== currentBranchId)
        .map((b: any) => ({ value: b.id, label: `${b.name} (${b.code})` }))
    : [];

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-2">
      {/* 🌟 Header & Search Section */}
      <Paper p="lg" radius="md" className="bg-[#1f2028] border border-[#2e303a]">
        <Group justify="between" align="center">
          <div>
            <Group gap="sm">
              <IconBuildingStore size={28} className="text-cyan-400" />
              <Text size="xl" fw={800} className="text-white">ဆိုင်ခွဲအလိုက် ပစ္စည်းလက်ကျန် စာရင်း (Multi-Store Stock)</Text>
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              ရွေးချယ်ထားသော ဆိုင်ခွဲ၏ Real-time ကုန်ပစ္စည်းလက်ကျန် စာရင်းများနှင့် လွှဲပြောင်းမှုများ ပြုလုပ်ရန်
            </Text>
          </div>
          <TextInput
            placeholder="ပစ္စည်းအမည် သို့မဟုတ် SKU ဖြင့် ရှာရန်..."
            leftSection={<IconSearch size={18} className="text-gray-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="md" className="w-[320px]"
            styles={{
              input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' }
            }}
          />
        </Group>
      </Paper>

      {/* 🌟 Main Data Table Section */}
      <Paper radius="md" className="flex flex-1 flex-col overflow-hidden bg-[#1f2028] border border-[#2e303a]">
        <div className="flex-1 overflow-y-auto">
          <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover className="w-full" stickyHeader>
            <Table.Thead className="bg-[#16171d] sticky top-0 z-10">
              <Table.Tr>
                <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">SKU ကုဒ်</Table.Th>
                <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">ကုန်ပစ္စည်းအမည်</Table.Th>
                <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">ရောင်းဈေး (MMK)</Table.Th>
                <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">လက်ကျန် အရေအတွက် (Stock)</Table.Th>
                <Table.Th className="text-gray-400 font-semibold border-b border-gray-700 text-right">လုပ်ဆောင်ချက်</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredStocks && filteredStocks.length > 0 ? (
                filteredStocks.map((item) => (
                  <Table.Tr key={item.id} className="border-b border-[#2e303a] hover:bg-[#16171d]">
                    <Table.Td className="font-mono text-cyan-400 font-bold">{item.product.sku}</Table.Td>
                    <Table.Td className="font-medium text-white">{item.product.name}</Table.Td>
                    <Table.Td className="font-mono text-gray-300">{item.product.price.toLocaleString()} MMK</Table.Td>
                    <Table.Td>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold font-mono ${
                        item.quantity > 10 ? 'bg-teal-950 text-teal-400 border border-teal-800' : 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
                      }`}>
                        {item.quantity} ခု ({item.quantity > 10 ? 'လက်ကျန်အဆင်ပြေ' : 'လက်ကျန်ပြတ်လုနီးပါး'})
                      </span>
                    </Table.Td>
                    <Table.Td className="text-right">
                      <Group gap="xs" justify="flex-end">
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
                  <Table.Td colSpan={5} className="text-center py-20 text-gray-400 border-none">
                    <Text size="lg">ဤဆိုင်ခွဲတွင် ကုန်ပစ္စည်းလက်ကျန် စာရင်း မရှိသေးပါ။</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </div>
      </Paper>

      {/* 1. Stock Edit Modal */}
      <Modal opened={editModalOpened} onClose={() => setEditModalOpened(false)} title="ပစ္စည်းလက်ကျန် (Stock) ချိန်ညှိခြင်း" centered styles={{ content: { backgroundColor: '#1f2028', color: '#fff' }, header: { backgroundColor: '#1f2028' } }}>
        {selectedItem && (
          <div className="flex flex-col gap-4">
            <Text size="sm" className="text-gray-300">ကုန်ပစ္စည်း: <span className="font-bold text-white">{selectedItem.product.name}</span></Text>
            <NumberInput
              label="လက်ကျန် အရေအတွက် အသစ်"
              value={newQuantity}
              onChange={(val) => setNewQuantity(Number(val) || 0)}
              min={0}
              styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' } }}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setEditModalOpened(false)} className="bg-transparent text-gray-300 border-gray-600">မလုပ်တော့ပါ</Button>
              <Button color="cyan" onClick={handleSaveStock} loading={updateStockMutation.isPending}>အတည်ပြုမည်</Button>
            </Group>
          </div>
        )}
      </Modal>

      {/* 2. 🌟 Branch-to-Branch Transfer Modal */}
      <Modal opened={transferModalOpened} onClose={() => setTransferModalOpened(false)} title="ဆိုင်ခွဲအချင်းချင်း ပစ္စည်းလွှဲပြောင်းခြင်း (Stock Transfer)" centered styles={{ content: { backgroundColor: '#1f2028', color: '#fff' }, header: { backgroundColor: '#1f2028' } }}>
        {transferItem && (
          <div className="flex flex-col gap-4">
            <Text size="sm" className="text-gray-300">လွှဲပြောင်းမည့်ပစ္စည်း: <span className="font-bold text-white">{transferItem.product.name}</span></Text>
            <Text size="xs" className="text-cyan-400">လက်ရှိလက်ကျန်: {transferItem.quantity} ခု</Text>

            <Select
              label="သို့ ပို့မည့် ဆိုင်ခွဲ (Target Branch)"
              placeholder="ဆိုင်ခွဲရွေးချယ်ပါ..."
              data={branchOptions}
              value={targetBranchId}
              onChange={setTargetBranchId}
              styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' } }}
            />

            <NumberInput
              label="လွှဲပြောင်းမည့် အရေအတွက် (Quantity)"
              value={transferQty}
              onChange={(val) => setTransferQty(Number(val) || 1)}
              min={1}
              max={transferItem.quantity}
              styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' } }}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setTransferModalOpened(false)} className="bg-transparent text-gray-300 border-gray-600">မလုပ်တော့ပါ</Button>
              <Button color="orange" onClick={handleExecuteTransfer} loading={transferStockMutation.isPending}>လွှဲပြောင်းမည်</Button>
            </Group>
          </div>
        )}
      </Modal>
    </div>
  );
};