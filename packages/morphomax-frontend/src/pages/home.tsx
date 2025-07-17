import React, { useState } from 'react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CreateSchedule } from '@/components/create-schedule';
import { ActiveSchedules } from '@/components/active-schedules';
import { Info } from '@/components/info';
import { Wallet } from '@/components/wallet';

enum Tab {
  CreateSchedule = 'create-schdeule',
  ActiveSchedules = 'active-schedules',
  Wallet = 'wallet',
}

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CreateSchedule);

  return (
    <div
      className={'flex flex-col items-center justify-center min-h-screen min-w-screen bg-gray-100'}
    >
      <Tabs
        data-testId="morphomax-tabs"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as Tab)}
        className="bg-white p-6 shadow-sm w-full xl:max-w-4xl h-full"
      >
        <TabsList className="mb-4 flex space-x-2 rounded-md bg-gray-200 p-2 w-full">
          <TabsTrigger value={Tab.CreateSchedule}>Create Schedule</TabsTrigger>
          <TabsTrigger value={Tab.ActiveSchedules}>Active Schedules</TabsTrigger>
          <TabsTrigger value={Tab.Wallet}>Wallet</TabsTrigger>
        </TabsList>

        <TabsContent value={Tab.CreateSchedule}>
          <CreateSchedule onCreate={() => setActiveTab(Tab.ActiveSchedules)} />
        </TabsContent>
        <TabsContent value={Tab.ActiveSchedules}>
          <ActiveSchedules />
        </TabsContent>
        <TabsContent value={Tab.Wallet}>
          <Wallet />
        </TabsContent>
      </Tabs>

      <Info />
    </div>
  );
};
