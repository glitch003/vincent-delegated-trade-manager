import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import { DialogueScheduleExecutionDetails } from '@/components/dialogue-schedule-execution-details';
import { DialogueWithdraw } from '@/components/dialogue-withdraw';
import { EnforcementDisclaimer } from '@/components/enforcement-disclaimer';
import { Info } from '@/components/info';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { JwtContext } from '@/contexts/jwt';
import { useBackend, Schedule } from '@/hooks/useBackend';
import { shortenHex } from '@/lib/hex';
import { cn } from '@/lib/utils';

const BASE = LIT_EVM_CHAINS.base;

function renderSchedulesTable(activeSchedules: Schedule[]) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-left">Frequency</TableHead>
          <TableHead className="text-center">Last Run</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="text-right">Details</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {activeSchedules.map((schedule) => {
          const {
            disabled,
            lastFinishedAt,
            failedAt,
            _id: uniqueKey,
            data: { updatedAt },
          } = schedule;

          // TODO check this is completely correct
          const lastRunAt = lastFinishedAt || failedAt || updatedAt;
          const failedAfterLastRun =
            failedAt && lastFinishedAt ? new Date(lastFinishedAt) <= new Date(failedAt) : false;

          const active = !disabled;
          return (
            <TableRow key={uniqueKey}>
              <TableCell className="text-left">Weekly</TableCell>
              <TableCell className="text-center">{new Date(lastRunAt).toLocaleString()}</TableCell>
              <TableCell className="text-center">
                <span
                  className={cn(
                    active && !failedAfterLastRun && 'text-green-500',
                    active && failedAfterLastRun && 'text-red-500'
                  )}
                >
                  {!active ? 'Inactive' : failedAfterLastRun ? 'Failed' : 'Active'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <DialogueScheduleExecutionDetails schedule={schedule} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const { createSchedule, getSchedules } = useBackend();
  const { authInfo } = useContext(JwtContext);

  const getUserSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const schedules = await getSchedules();
      setSchedules(schedules);
    } catch (error) {
      console.error('Error fetching active Schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, getSchedules, setSchedules]);
  useEffect(() => {
    getUserSchedules();
  }, [getUserSchedules]);

  const createUserSchedule = useCallback(async () => {
    try {
      setLoading(true);
      await createSchedule();
    } catch (error) {
      console.error('Error creating Schedule:', error);
      alert('Error creating Schedule. Please try again.');
    } finally {
      setLoading(false);
    }

    await getUserSchedules();
  }, [setLoading, createSchedule, getUserSchedules]);

  return (
    <Card className="w-full max-w-3xl bg-white p-8 shadow-sm rounded-lg">
      <CardHeader className="space-y-3 text-center">
        <CardTitle className="text-3xl font-bold text-gray-900">Vincent Yield Maximizer</CardTitle>
        <CardDescription className="space-y-2">
          <p className="text-gray-800 font-medium">
            This agent helps you earn more yield on your USDC.
          </p>
          <p className="text-gray-600">
            It automatically moves your funds into the highest-yielding Morpho vault.
          </p>
        </CardDescription>
      </CardHeader>

      <Separator />

      {schedules.length ? (
        <CardContent className="space-y-6 text-center">
          <EnforcementDisclaimer />

          <div className="space-y-4">
            {renderSchedulesTable(schedules)}

            <DialogueWithdraw schedule={schedules[0]} onDelete={getUserSchedules} />
          </div>
        </CardContent>
      ) : (
        <CardContent className="space-y-6 text-center">
          <div className="space-y-3">
            <p className="font-semibold text-gray-900">How it works:</p>
            <div>
              {authInfo?.pkp.ethAddress ? (
                <p className="text-gray-700">
                  1. Deposit USDC on Base to{' '}
                  <a
                    href={`${BASE.blockExplorerUrls[0]}/address/${authInfo?.pkp.ethAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:opacity-80"
                    title={authInfo?.pkp.ethAddress}
                  >
                    {authInfo?.pkp.ethAddress ? shortenHex(authInfo?.pkp.ethAddress) : 'Loading...'}
                  </a>{' '}
                  (minimum 50 USDC)
                </p>
              ) : (
                <p className="text-gray-700">
                  1. Deposit USDC on Base to your PKP address (minimum 50 USDC)
                </p>
              )}
              <p className="text-gray-700">
                2. Active your Agent Below To Start Optimizing Your Yield!
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              disabled={loading}
              onClick={createUserSchedule}
              className="w-full bg-purple-600 text-white hover:bg-purple-700 py-2 px-4 rounded-md transition-colors"
            >
              {loading ? <Spinner /> : 'Activate Agent To Maximize Yield'}
            </Button>

            <EnforcementDisclaimer />
          </div>
        </CardContent>
      )}

      <Separator />

      <CardFooter className="flex flex-col items-center">
        <Info />
      </CardFooter>
    </Card>
  );
};
