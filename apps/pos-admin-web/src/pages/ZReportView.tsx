import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Paper, Text, Group, Button, NumberInput, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconReportMoney, IconPrinter } from '@tabler/icons-react';
import { useReactToPrint } from 'react-to-print';
import { api } from '../api/axios';

interface ZReportProps {
  currentBranchId: string;
  currentCashierId: string;
}

export const ZReportView = ({ currentBranchId, currentCashierId }: ZReportProps) => {
  const [openingCash, setOpeningCash] = useState<number>(50000);
  const [actualCash, setActualCash] = useState<number>(0);
  const [reportData, setReportData] = useState<any>(null);

  // 🔹 API မခေါ်ခင်မှာတောင် Input တွေနဲ့ Real-time တွက်ချက်ပြရန်
  const expectedCash = openingCash + (reportData ? Number(reportData.totalSales) : 0);
  const liveDifference = actualCash - expectedCash;

  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Z-Report-${currentBranchId}`,
  });

  const closeShiftMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/reports/close-shift', payload);
      return res.data; // Backend က ပို့လိုက်သော response JSON (`{ success, message, data }`) ကို ယူခြင်း
    },
    onSuccess: (res: any) => {
      // 💡 ဤနေရာတွင် res သည် Backend က Return ပို့လိုက်သော object ဖြစ်သည် (ဥပမာ - res.data မဟုတ်တော့ပါ)
      const reportInfo = res.data; 
      setReportData(reportInfo);
      
      const diff = reportInfo.difference;
      notifications.show({
        title: 'Shift ပိတ်ခြင်း အောင်မြင်ပါသည် 🟢',
        message: `ကွာဟချက် (Difference): ${diff} ကျပ်`,
        color: Number(diff) < 0 ? 'red' : 'teal',
      });
    },
    onError: (err: any) => {
      notifications.show({
        title: 'အမှားအယွင်းရှိပါသည် ❌',
        message: err?.response?.data?.message || err?.message || 'မအောင်မြင်ပါ',
        color: 'red',
      });
    },
  });
  
  const handleCloseShift = () => {
    closeShiftMutation.mutate({
      branchId: currentBranchId,
      cashierId: currentCashierId,
      openingCash,
      actualCash,
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-2 p-6">
      <Paper p="lg" radius="md" className="bg-[#1f2028] border border-[#2e303a]">
        <Group gap="sm">
          <IconReportMoney size={28} className="text-cyan-400" />
          <Text size="xl" fw={800} className="text-white">နေ့ချုပ်နှင့် Shift ပိတ်သိမ်းခြင်း (Z-Report & Shift Closing)</Text>
        </Group>
        <Text size="xs" c="dimmed" mt={4}>ငွေသေတ္တာတွင်းရှိ လက်တွေ့ငွေသားနှင့် စနစ်တွက်ချက်မှု တိုက်ဆိုင်စစ်ဆေးရန်</Text>
      </Paper>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Paper p="lg" radius="md" className="bg-[#1f2028] border border-[#2e303a] flex flex-col gap-4">
          <Text fw={700} size="md" className="text-white">Shift ပိတ်ရန် ငွေစာရင်းထည့်သွင်းရန်</Text>
          <NumberInput
            label="Shift စတင်ချိန် ငွေလက်ကျန် (Opening Cash)"
            value={openingCash}
            onChange={(val) => setOpeningCash(Number(val) || 0)}
            styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' } }}
          />
          <NumberInput
            label="လက်တွေ့ ငွေသေတ္တာထဲရှိ ငွေသားရေတွက်ချက်မှု (Actual Cash Count)"
            value={actualCash}
            onChange={(val) => setActualCash(Number(val) || 0)}
            styles={{ input: { backgroundColor: '#16171d', color: '#fff', border: '1px solid #2e303a' } }}
          />
          <Button color="cyan" mt="md" onClick={handleCloseShift} loading={closeShiftMutation.isPending}>
            Shift ပိတ်သိမ်းပြီး Z-Report ထုတ်မည်
          </Button>
        </Paper>

        <Paper p="lg" radius="md" className="bg-[#1f2028] border border-[#2e303a] flex flex-col gap-4">
          <Group justify="between">
            <Text fw={700} size="md" className="text-white">Z-Report ငွေစာရင်းရှင်းတမ်း (Preview)</Text>
            {reportData && (
              <Button leftSection={<IconPrinter size={16} />} color="teal" size="xs" onClick={() => handlePrint()}>
                ပရင့်ထုတ်မည်
              </Button>
            )}
          </Group>

          {/* Thermal Receipt Preview */}
          <div ref={componentRef} className="p-4 bg-white text-black rounded font-mono text-sm flex flex-col gap-2">
            <div className="text-center font-bold text-base">CITY MART (Z-REPORT)</div>
            <div className="text-center text-xs text-gray-600">Branch: {currentBranchId}</div>
            <Divider my="xs" />
            <div className="flex justify-between">
              <span>ဖွင့်ငွေ (Opening Cash):</span>
              <span>{openingCash.toLocaleString()} ကျပ်</span>
            </div>
            <div className="flex justify-between">
              <span>စုစုပေါင်းရောင်းရငွေ:</span>
              <span>{reportData ? Number(reportData.totalSales).toLocaleString() : '0'} ကျပ်</span>
            </div>
            <div className="flex justify-between">
              <span>မျှော်လင့်ထားသောငွေ (Expected):</span>
              <span>{expectedCash.toLocaleString()} ကျပ်</span>
            </div>
            <div className="flex justify-between">
              <span>လက်တွေ့ငွေ (Actual):</span>
              <span>{actualCash.toLocaleString()} ကျပ်</span>
            </div>
            <Divider my="xs" />
            <div className="flex justify-between font-bold">
              <span>ကွာဟချက် (Difference):</span>
              <span className={liveDifference < 0 ? 'text-red-600' : 'text-green-600'}>
                {liveDifference.toLocaleString()} ကျပ်
              </span>
            </div>
            <div className="text-center text-xs text-gray-500 mt-4">--- ကျေးဇူးတင်ပါတယ် ---</div>
          </div>
        </Paper>
      </div>
    </div>
  );
};