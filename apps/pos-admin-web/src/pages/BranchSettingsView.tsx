import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TextInput, Loader, Paper, Text, Group, Button, Modal, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBuildingStore, IconPlus, IconTrash } from '@tabler/icons-react';
import { api } from '../api/axios';
import axios from 'axios';
import { useCartStore } from '../store/useCartStore';

export const BranchSettingsView = () => {
  const [opened, setOpened] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const queryClient = useQueryClient();

  // ၁။ ဆိုင်ခွဲအားလုံးကို ဆွဲထုတ်ခြင်း
  const { data: branches, isLoading, error } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data;
    },
  });

  const fetchBranches = useCartStore((state) => state.fetchBranches);

  // ၂။ ဆိုင်ခွဲအသစ် ဆောက်ရန် Mutation
  const createBranchMutation = useMutation({
    mutationFn: async (newBranch: {
      name: string;
      code: string; address?: string; phone?: string
    }) => {
      return await api.post('/branches', newBranch);
    },
    onSuccess: async() => {
      notifications.show({
        title: 'အောင်မြင်ပါသည်',
        message: 'ဆိုင်ခွဲအသစ် ထည့်သွင်းပြီးပါပြီ', color: 'teal'
      });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      await fetchBranches();
      setOpened(false);
      setName('');
      setCode('');
      setAddress('');
      setPhone('');
    },
    onError: (error: unknown) => {
      let msg = 'ဆိုင်ခွဲထည့်သွင်းခြင်း မအောင်မြင်ပါ';
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || msg;
      }
      notifications.show({ title: 'အမှားအယွင်းရှိပါသည်', message: msg, color: 'red' });
    },
  });

  // ၃။ ဆိုင်ခွဲဖျက်ရန် Mutation
  const deleteBranchMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/branches/${id}`);
    },
    onSuccess: () => {
      notifications.show({ title: 'အောင်မြင်ပါသည်', message: 'ဆိုင်ခွဲကို ဖျက်ပြီးပါပြီ', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (error: unknown) => {
      let msg = 'ဆိုင်ခွဲဖျက်ခြင်း မအောင်မြင်ပါ';
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || msg;
      }
      notifications.show({ title: 'အမှားအယွင်းရှိပါသည်', message: msg, color: 'red' });
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
        <Text c="red" size="lg" fw={700}>ဆိုင်ခွဲစာရင်း ထုတ်ယူရာတွင် အမှားအယွင်း ရှိနေပါသည်ခင်ဗျာ။</Text>
      </Paper>
    );
  }

  const handleCreateBranch = () => {
    if (!name || !code) {
      notifications.show({ title: 'သတိပေးချက်', message: 'ဆိုင်ခွဲအမည်နှင့် ကုဒ် (Code) ထည့်ရန် လိုအပ်ပါသည်။', color: 'yellow' });
      return;
    }
    createBranchMutation.mutate({ name, code, address, phone });
  };


  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-2 p-6">
      {/* Header & Add Button */}
      <Paper p="lg" radius="md" className="bg-[#1f2028] border border-[#2e303a]">
        <Group justify="between" align="center">
          <div>
            <Group gap="sm">
              <IconBuildingStore size={28} className="text-cyan-400" />
              <Text size="xl" fw={800} className="text-white">ဆိုင်ခွဲများ စီမံခန့်ခွဲမှု (Branch Settings)</Text>
            </Group>
            <Text size="xs" c="dimmed" mt={4}>ဆိုင်ခွဲအသစ်များ ထည့်သွင်းခြင်းနှင့် စီမံခန့်ခွဲရန်</Text>
          </div>

          <Button
            color="cyan"
            leftSection={<IconPlus size={18} />}
            onClick={() => setOpened(true)}
          >
            ဆိုင်ခွဲအသစ် ထည့်ရန်
          </Button>
        </Group>
      </Paper>

      {/* Table Section */}
      <Paper radius="md" className="flex flex-1 flex-col overflow-hidden bg-[#1f2028] border border-[#2e303a]">
        <div className="flex-1 overflow-y-auto">
          <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover className="w-full" stickyHeader>
            <Table.Thead className="bg-[#16171d] sticky top-0 z-10">
              <Table.Tr>
                <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">ဆိုင်ခွဲ ကုဒ် (Code)</Table.Th>
                <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">ဆိုင်ခွဲအမည်</Table.Th>
                <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">လိပ်စာ</Table.Th>
                <Table.Th className="text-gray-400 font-semibold border-b border-gray-700">ဖုန်းနံပါတ်</Table.Th>
                <Table.Th className="text-gray-400 font-semibold border-b border-gray-700 text-right">လုပ်ဆောင်ချက်</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {branches && branches.length > 0 ? (
                branches.map((branch: any) => (
                  <Table.Tr key={branch.id} className="border-b border-[#2e303a] hover:bg-[#16171d]">
                    <Table.Td className="font-mono text-cyan-400 font-bold">{branch.code}</Table.Td>
                    <Table.Td className="font-medium text-white">{branch.name}</Table.Td>
                    <Table.Td className="text-gray-300">{branch.address || '-'}</Table.Td>
                    <Table.Td className="font-mono text-gray-300">{branch.phone || '-'}</Table.Td>
                    <Table.Td className="text-right">
                      {branch.code !== 'HQ-001' && (
                        <Button
                          size="xs"
                          variant="light"
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => deleteBranchMutation.mutate(branch.id)}
                        >
                          ဖျက်ရန်
                        </Button>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={5} className="text-center py-20 text-gray-400 border-none">
                    <Text size="lg">ဆိုင်ခွဲစာရင်း မရှိသေးပါ။</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </div>
      </Paper>

      {/* Create Branch Modal */}
      <Modal opened={opened} onClose={() => setOpened(false)} title="ဆိုင်ခွဲအသစ် ထည့်သွင်းခြင်း" centered styles={{ content: { backgroundColor: '#1f2028', color: '#fff' }, header: { backgroundColor: '#1f2028' } }}>
        <Stack>
          <TextInput
            label="ဆိုင်ခွဲအမည် (Branch Name)"
            placeholder="ဥပမာ - Branch A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' } }}
          />
          <TextInput
            label="ဆိုင်ခွဲ ကုဒ် (Code)"
            placeholder="ဥပမာ - BR-001"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' } }}
          />
          <TextInput
            label="လိပ်စာ (Address)"
            placeholder="ဆိုင်ခွဲတည်နေရာ..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' } }}
          />
          <TextInput
            label="ဖုန်းနံပါတ် (Phone)"
            placeholder="ဆက်သွယ်ရန် ဖုန်း..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' } }}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setOpened(false)} className="bg-transparent text-gray-300 border-gray-600">မလုပ်တော့ပါ</Button>
            <Button color="cyan" onClick={handleCreateBranch} loading={createBranchMutation.isPending}>ဖန်တီးမည်</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};