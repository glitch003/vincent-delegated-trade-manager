import React, { useCallback, useEffect, useState } from 'react';
import { Delete, Pause, Play } from 'lucide-react';

import { useBackend, Schedule } from '@/hooks/useBackend';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DialogueEditSchedule } from '@/components/dialogue-edit-schedule';
import { FREQUENCIES } from '@/components/select-frequency';
import { Spinner } from '@/components/ui/spinner';
import { DialogueScheduleFailedDetails } from '@/components/dialogue-schedule-failed-details';

import { cn } from '@/lib/utils';

function renderSchedulesTable(
  activeSchedules: Schedule[],
  handleUpdatedSchedule: (updatedSchedule: Schedule) => Promise<void>,
  handleDisableSchedule: (scheduleId: string) => Promise<void>,
  handleEnableSchedule: (scheduleId: string) => Promise<void>,
  handleDeleteSchedule: (scheduleId: string) => Promise<void>
) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Frequency</TableHead>
          <TableHead>Last Update</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {activeSchedules.map((schedule) => {
          const {
            disabled,
            lastFinishedAt,
            failedAt,
            _id: uniqueKey,
            data: { purchaseIntervalHuman, updatedAt },
          } = schedule;

          const failedAfterLastRun =
            failedAt && lastFinishedAt ? new Date(lastFinishedAt) <= new Date(failedAt) : false;

          const active = !disabled;
          return (
            <TableRow key={uniqueKey}>
              <TableCell>
                {FREQUENCIES.find((freq) => freq.value === purchaseIntervalHuman)?.label ||
                  purchaseIntervalHuman}
              </TableCell>
              <TableCell>{new Date(updatedAt).toLocaleString()}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    active && !failedAfterLastRun && 'text-green-500',
                    active && failedAfterLastRun && 'text-red-500'
                  )}
                >
                  {!active ? 'Inactive' : failedAfterLastRun ? 'Failed' : 'Active'}
                  {failedAfterLastRun && <DialogueScheduleFailedDetails schedule={schedule} />}
                </span>
              </TableCell>
              <TableCell>
                <Box className="flex flex-row items-center justify-end gap-2 p-1">
                  <DialogueEditSchedule schedule={schedule} onUpdate={handleUpdatedSchedule} />
                  {active ? (
                    <Button
                      variant="destructive"
                      onClick={() => handleDisableSchedule(schedule._id)}
                    >
                      <Pause />
                    </Button>
                  ) : (
                    <Button variant="default" onClick={() => handleEnableSchedule(schedule._id)}>
                      <Play />
                    </Button>
                  )}
                  <Button variant="destructive" onClick={() => handleDeleteSchedule(schedule._id)}>
                    <Delete />
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function renderSpinner() {
  return (
    <div className="flex items-center justify-center">
      <Spinner />
    </div>
  );
}

function renderContent(
  activeSchedules: Schedule[],
  isLoading: boolean,
  handleUpdatedSchedule: (updatedSchedule: Schedule) => Promise<void>,
  handleDisableSchedule: (scheduleId: string) => Promise<void>,
  handleEnableSchedule: (scheduleId: string) => Promise<void>,
  handleDeleteSchedule: (scheduleId: string) => Promise<void>
) {
  console.log('activeSchedules', activeSchedules);
  if (!activeSchedules.length && isLoading) {
    return renderSpinner();
  } else if (activeSchedules.length) {
    return renderSchedulesTable(
      activeSchedules,
      handleUpdatedSchedule,
      handleDisableSchedule,
      handleEnableSchedule,
      handleDeleteSchedule
    );
  } else {
    return <div className="flex justify-center">No active Schedules</div>;
  }
}

export const ActiveSchedules: React.FC = () => {
  const [activeSchedules, setActiveSchedules] = useState<Schedule[]>([]);
  const { deleteSchedule, disableSchedule, enableSchedule, getSchedules } = useBackend();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const schedules = await getSchedules();

        setActiveSchedules(schedules);
      } catch (error) {
        console.error('Error fetching active Schedules:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedules();
  }, [getSchedules]);

  const handleDisableSchedule = useCallback(
    async (scheduleId: string) => {
      try {
        await disableSchedule(scheduleId);

        const updatedSchedules = [...activeSchedules];
        const index = updatedSchedules.findIndex((schedule) => schedule._id === scheduleId);
        updatedSchedules[index].disabled = true;
        setActiveSchedules(updatedSchedules);
      } catch (error) {
        console.error('Error disabling Schedule:', error);
      }
    },
    [activeSchedules, disableSchedule, setActiveSchedules]
  );

  const handleEnableSchedule = useCallback(
    async (scheduleId: string) => {
      try {
        await enableSchedule(scheduleId);

        const updatedSchedules = [...activeSchedules];
        const index = updatedSchedules.findIndex((schedule) => schedule._id === scheduleId);
        updatedSchedules[index].disabled = false;
        setActiveSchedules(updatedSchedules);
      } catch (error) {
        console.error('Error disabling Schedule:', error);
      }
    },
    [activeSchedules, enableSchedule, setActiveSchedules]
  );

  const handleUpdatedSchedule = useCallback(
    async (updatedSchedule: Schedule) => {
      try {
        const updatedSchedules = [...activeSchedules];
        const index = updatedSchedules.findIndex(
          (schedule) => schedule._id === updatedSchedule._id
        );
        updatedSchedules[index] = updatedSchedule;
        setActiveSchedules(updatedSchedules);
      } catch (error) {
        console.error('Error disabling Schedule:', error);
      }
    },
    [activeSchedules, setActiveSchedules]
  );

  const handleDeleteSchedule = useCallback(
    async (scheduleId: string) => {
      try {
        await deleteSchedule(scheduleId);

        const updatedSchedules = [
          ...activeSchedules.filter((schedule) => schedule._id !== scheduleId),
        ];
        setActiveSchedules(updatedSchedules);
      } catch (error) {
        console.error('Error disabling Schedule:', error);
      }
    },
    [activeSchedules, deleteSchedule, setActiveSchedules]
  );

  return (
    <Card data-test-id="active-schedules" className="w-full bg-white p-6 shadow-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Active Schedules</CardTitle>
      </CardHeader>

      <Separator />

      <CardContent>
        {renderContent(
          activeSchedules,
          isLoading,
          handleUpdatedSchedule,
          handleDisableSchedule,
          handleEnableSchedule,
          handleDeleteSchedule
        )}
      </CardContent>
    </Card>
  );
};
