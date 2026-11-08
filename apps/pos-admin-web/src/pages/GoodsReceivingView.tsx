import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconTruckDelivery } from '@tabler/icons-react';
import { api } from '../api/axios';

interface GoodsReceivingViewProps {
  currentBranchId: string;
}

interface ItemRow {
  rowKey: string;
  productId: string;
  quantity: number;
  costPrice: number;
}

interface StockInPayload {
  branchId: string;
  referenceNo: string;
  supplierName: string;
  items: Array<{
    productId: string;
    quantity: number;
    costPrice: number;
  }>;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
}

export const GoodsReceivingView = ({ currentBranchId }: GoodsReceivingViewProps) => {
  const rowIdRef = useRef(0);

  const createEmptyRow = (): ItemRow => ({
    rowKey: `receiving-row-${rowIdRef.current++}`,
    productId: '',
    quantity: 1,
    costPrice: 0,
  });

  const [referenceNo, setReferenceNo] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [rows, setRows] = useState<ItemRow[]>(() => [createEmptyRow()]);

  const queryClient = useQueryClient();

  const { data: products = [], isLoading: productsLoading } = useQuery<ProductOption[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data;
    },
  });

  const bulkStockInMutation = useMutation({
    mutationFn: async (payload: StockInPayload) => {
      return api.post('/branch-stocks/bulk-stock-in', payload);
    },
    onSuccess: () => {
      notifications.show({
        title: 'အောင်မြင်ပါသည်',
        message: 'ပစ္စည်းအဝင်စာရင်းများ ဂိုဒေါင်သို့ အောင်မြင်စွာ ဝင်ရောက်သွားပါပြီ',
        color: 'teal',
      });

      queryClient.invalidateQueries({ queryKey: ['branchStocks', currentBranchId] });

      setReferenceNo('');
      setSupplierName('');
      setRows([createEmptyRow()]);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'ပစ္စည်းအဝင်စာရင်း သိမ်းဆည်းခြင်း မအောင်မြင်ပါ';

      notifications.show({
        title: 'အမှားအယွင်းရှိပါသည်',
        message,
        color: 'red',
      });
    },
  });

  const handleAddRow = () => {
    const newRow = createEmptyRow();
    setRows((previousRows) => [...previousRows, newRow]);
  };

  const handleRemoveRow = (rowKey: string) => {
    setRows((previousRows) => previousRows.filter((row) => row.rowKey !== rowKey));
  };

  const handleRowChange = (
    rowKey: string,
    field: 'productId' | 'quantity' | 'costPrice',
    value: string | number | null
  ) => {
    setRows((previousRows) =>
      previousRows.map((row) => {
        if (row.rowKey !== rowKey) return row;

        switch (field) {
          case 'productId':
            return { ...row, productId: typeof value === 'string' ? value : '' };
          case 'quantity':
            return { ...row, quantity: Number(value) || 1 };
          case 'costPrice':
            return { ...row, costPrice: Number(value) || 0 };
          default:
            return row;
        }
      })
    );
  };

  const handleSubmit = () => {
    if (!currentBranchId || currentBranchId === 'undefined') {
      notifications.show({
        title: 'သတိပေးချက်',
        message: 'လက်ရှိဆိုင်ခွဲကို ရွေးချယ်ပေးပါ။',
        color: 'yellow',
      });
      return;
    }

    if (!referenceNo.trim() || rows.some((row) => !row.productId || row.quantity <= 0)) {
      notifications.show({
        title: 'သတိပေးချက်',
        message: 'PO နံပါတ်နှင့် ကုန်ပစ္စည်း/အရေအတွက်များကို ပြည့်စုံစွာ ဖြည့်စွက်ပါ',
        color: 'yellow',
      });
      return;
    }

    bulkStockInMutation.mutate({
      branchId: currentBranchId,
      referenceNo: referenceNo.trim(),
      supplierName: supplierName.trim(),
      // rowKey is UI-only; do not send it to the backend.
      items: rows.map(({ rowKey, ...item }) => item),
    });
  };

  const productOptions = products.map((product) => ({
    value: product.id,
    label: `${product.name} (SKU: ${product.sku})`,
  }));

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-3 sm:gap-6 sm:p-4 lg:p-6">
      {/* Page Header */}
      <Paper p="md" radius="md" className="min-w-0 border border-[#2e303a] bg-[#1f2028] sm:p-4">
        <Group gap="sm" wrap="nowrap" align="center">
          <IconTruckDelivery size={28} className="shrink-0 text-cyan-400" />
          <Text size="lg" fw={800} className="min-w-0 break-words text-white sm:text-xl">
            ကုန်ပစ္စည်းအဝင်လက်ခံခြင်း (Goods Receiving &amp; PO Stock-In)
          </Text>
        </Group>
        <Text size="xs" c="dimmed" mt={4}>
          ကုန်သွင်းသူ (Supplier) ထံမှ ပစ္စည်းများ ရောက်ရှိလာသည့်အခါ အစုလိုက်အပြုံလိုက် စာရင်းသွင်းရန်
        </Text>
      </Paper>

      {/* Purchase Order / Supplier Details */}
      <Paper p="md" radius="md" className="flex min-w-0 flex-col gap-4 border border-[#2e303a] bg-[#1f2028] sm:p-4">
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <TextInput
            label="PO နံပါတ် / ဘေလ်နံပါတ် (Reference No)"
            placeholder="ဥပမာ - PO-2026-001"
            value={referenceNo}
            onChange={(event) => setReferenceNo(event.currentTarget.value)}
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
            label="ကုန်သွင်းသူအမည် (Supplier Name)"
            placeholder="ဥပမာ - A One Distribution"
            value={supplierName}
            onChange={(event) => setSupplierName(event.currentTarget.value)}
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
      </Paper>

      {/* Dynamic Items */}
      <Paper p="md" radius="md" className="flex min-w-0 flex-col gap-4 border border-[#2e303a] bg-[#1f2028] sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Text fw={700} size="md" className="text-white">
            အဝင်မည့် ကုန်ပစ္စည်းစာရင်းများ
          </Text>
          <Button
            size="sm"
            variant="light"
            color="cyan"
            leftSection={<IconPlus size={16} />}
            onClick={handleAddRow}
            className="w-full sm:w-auto"
          >
            ပစ္စည်းတန်း ထပ်ထည့်ရန်
          </Button>
        </div>

        <Stack gap="sm">
          {rows.map((row, index) => (
            <div
              key={row.rowKey}
              className="grid min-w-0 grid-cols-1 items-end gap-3 rounded-md border border-[#2e303a] bg-[#16171d] p-3 sm:grid-cols-12"
            >
              <div className="min-w-0 sm:col-span-6">
                <Select
                  label={index === 0 ? 'ကုန်ပစ္စည်း' : undefined}
                  placeholder={productsLoading ? 'ပစ္စည်းစာရင်း ဆွဲယူနေသည်...' : 'ကုန်ပစ္စည်း ရွေးချယ်ပါ'}
                  data={productOptions}
                  value={row.productId || null}
                  onChange={(value) => handleRowChange(row.rowKey, 'productId', value)}
                  searchable
                  nothingFoundMessage="ပစ္စည်းမတွေ့ပါ"
                  disabled={productsLoading}
                  styles={{
                    input: {
                      backgroundColor: '#1f2028',
                      color: '#fff',
                      border: '1px solid #2e303a',
                    },
                  }}
                />
              </div>

              <div className="min-w-0 sm:col-span-3">
                <NumberInput
                  label={index === 0 ? 'အရေအတွက်' : undefined}
                  placeholder="အရေအတွက်"
                  min={1}
                  value={row.quantity}
                  onChange={(value) => handleRowChange(row.rowKey, 'quantity', value)}
                  styles={{
                    input: {
                      backgroundColor: '#1f2028',
                      color: '#fff',
                      border: '1px solid #2e303a',
                    },
                  }}
                />
              </div>

              <div className="min-w-0 sm:col-span-2">
                <NumberInput
                  label={index === 0 ? 'ဝယ်ဈေး (Cost)' : undefined}
                  placeholder="ဝယ်ဈေး"
                  min={0}
                  value={row.costPrice}
                  onChange={(value) => handleRowChange(row.rowKey, 'costPrice', value)}
                  styles={{
                    input: {
                      backgroundColor: '#1f2028',
                      color: '#fff',
                      border: '1px solid #2e303a',
                    },
                  }}
                />
              </div>

              <div className="flex justify-end sm:col-span-1">
                {rows.length > 1 && (
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    size="lg"
                    aria-label={`ပစ္စည်းတန်း ${index + 1} ဖယ်ရှားရန်`}
                    onClick={() => handleRemoveRow(row.rowKey)}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                )}
              </div>
            </div>
          ))}
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button
            color="cyan"
            onClick={handleSubmit}
            loading={bulkStockInMutation.isPending}
            disabled={bulkStockInMutation.isPending}
            className="w-full sm:w-auto"
          >
            ပစ္စည်းအဝင် အတည်ပြု သိမ်းဆည်းမည်
          </Button>
        </Group>
      </Paper>
    </div>
  );
};
