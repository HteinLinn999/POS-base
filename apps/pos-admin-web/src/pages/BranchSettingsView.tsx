import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TextInput, Loader, Paper, Text, Group, Button, Modal, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBuildingStore, IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { api } from '../api/axios';
import axios from 'axios';
import { useCartStore } from '../store/useCartStore';

export const BranchSettingsView = () => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const [opened, setOpened] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const queryClient = useQueryClient();

  const fetchBranches = useCartStore((state) => state.fetchBranches);

  // ၁။ ဆိုင်ခွဲအားလုံးကို ဆွဲထုတ်ခြင်း
  const { data: branches, isLoading, error } = useQuery(
    {
      queryKey: ['branches'],
      queryFn: async () => {
        const res = await api.get('/branches');
        return res.data;
      },
    }
  );

  // ၂။ ဆိုင်ခွဲအသစ် ဆောက်ရန် Mutation
  const createBranchMutation = useMutation(
    {
      mutationFn: async (
        newBranch: {
          name: string;
          code: string;
          address?: string;
          phone?: string
        }) => {
        return await api.post('/branches', newBranch);
      },
      onSuccess: async () => {
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
    }
  );

  //၃။ ဆိုင်ခွဲပြင်ရန်
  const updateBranchMutation = useMutation({
    mutationFn: async (
      data: {
        id: string;
        payload: {
          name: string;
          code: string;
          address?: string;
          phone?: string
        }
      }
    ) => {
      return await api.patch(`/branches/${data.id}`, data.payload)
    },
    onSuccess: async () => {
      notifications.show({ title: 'အောင်မြင်ပါသည်', message: 'ဆိုင်ခွဲအချက်အလက် ပြင်ဆင်ပြီးပါပြီ', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      await fetchBranches();
      handleCloseModal();
    },
    onError: async (error: unknown) => {
      let msg = 'ဆိုင်ခွဲပြင်ဆင်ခြင်း မအောင်ပြင်ပါ';
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || msg;
      }
      notifications.show({ title: 'အမှားအယွင်းရှိပါသည်', message: msg, color: 'red' });
    }
  })


  // ၄။ ဆိုင်ခွဲဖျက်ရန် Mutation
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

  // const handleCreateBranch = () => {
  //   if (!name || !code) {
  //     notifications.show({ title: 'သတိပေးချက်', message: 'ဆိုင်ခွဲအမည်နှင့် ကုဒ် (Code) ထည့်ရန် လိုအပ်ပါသည်။', color: 'yellow' });
  //     return;
  //   }
  //   createBranchMutation.mutate({ name, code, address, phone });
  // };


  const handleOpenCrate = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setAddress('');
    setPhone('');
    setOpened(true);
  }

  const handleOpenEdit = (branch: any) => {
    setEditingId(branch.id);
    setName(branch.name);
    setCode(branch.code);
    setAddress(branch.address || '');
    setPhone(branch.phone || '');
    setOpened(true);
  };

  const handleCloseModal = () => {
    setOpened(false);
    setEditingId(null);
    setName('');
    setCode('');
    setAddress('');
    setPhone('');
  };


  const handleSubmitBranch = () => {
    if (!name.trim() || !code.trim()) {
      notifications.show({
        title: 'သတိပေးချက်',
        message: 'ဆိုင်ခွဲအမည်နှင့် ကုဒ် (Code) ထည့်ရန် လိုအပ်ပါသည်။',
        color: 'yellow',
      });
      return;
    }
    if (editingId) {
      // Update Mode
      updateBranchMutation.mutate({
        id: editingId,
        payload: { name, code, address, phone },
      });
    } else {
      // Create Mode
      createBranchMutation.mutate({ name, code, address, phone });
    }

  }

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
  const isSaving = createBranchMutation.isPending || updateBranchMutation.isPending;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-3 sm:gap-6 sm:p-4 lg:p-6">
      {/* Header & Add Button */}
      <Paper p="md" radius="md" className="min-w-0 bg-[#1f2028] border border-[#2e303a] sm:p-4">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Group gap="sm" wrap="nowrap" align="center">
              <IconBuildingStore size={28} className="shrink-0 text-cyan-400" />
              <Text size="xl" fw={800} className="min-w-0 break-words text-white">ဆိုင်ခွဲများ စီမံခန့်ခွဲမှု (Branch Settings)</Text>
            </Group>
            <Text size="xs" c="dimmed" mt={4}>ဆိုင်ခွဲအသစ်များ ထည့်သွင်းခြင်းနှင့် ပြင်ဆင်ရန်</Text>
          </div>

          <Button
            color="cyan"
            className="w-full shrink-0 sm:w-auto"
            leftSection={<IconPlus size={18} />}
            onClick={handleOpenCrate}
          >
            ဆိုင်ခွဲအသစ် ထည့်ရန်
          </Button>
        </div>
      </Paper>

      {/* Table Section */}
      <Paper radius="md" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#1f2028] border border-[#2e303a]">
        <div className="min-h-0 min-w-0 flex-1 overflow-auto">
          <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover className="w-full min-w-[760px]" stickyHeader>
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

                      <Group gap='xs' justify='flex-end'>
                        <Button
                          size="xs"
                          variant="light"
                          color="cyan"
                          leftSection={<IconEdit size={14} />}
                          onClick={() => handleOpenEdit(branch)}
                        >
                          ပြင်ရန်
                        </Button>

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
                      </Group>
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


      {/* Create / Edit Branch Modal */}

      <Modal opened={opened} onClose={handleCloseModal}
        title="ဆိုင်ခွဲအသစ် ထည့်သွင်းခြင်း"
        centered
        styles={{
          content: {
            backgroundColor: '#1f2028',
            color: '#fff',
            maxWidth: 'calc(100vw - 2rem)',
            maxHeight: 'calc(100dvh - 2rem)',
            overflowY: 'auto',
          },
          header: { backgroundColor: '#1f2028' },
        }}>
        <Stack gap="md">
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

          <Group justify="flex-end" mt="md" className="flex-col-reverse sm:flex-row">
            <Button
              variant="default"
              onClick={handleCloseModal}
              className="w-full border-gray-600 bg-transparent text-gray-300 sm:w-auto"
            >
              မလုပ်တော့ပါ
            </Button>
            <Button
              color="cyan"
              onClick={handleSubmitBranch}
              loading={isSaving}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {editingId ? "ပြင်ဆင်မည်" : "ဖန်တီးမည်"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};