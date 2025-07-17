import React, { FormEvent, useCallback, useState } from 'react';
import { Pencil } from 'lucide-react';

import { SelectFrequency } from '@/components/select-frequency';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Schedule, useBackend } from '@/hooks/useBackend';

export interface EditDialogProps {
  schedule: Schedule;
  onUpdate?: (updatedSchedule: Schedule) => void;
}

export const DialogueEditSchedule: React.FC<EditDialogProps> = ({ schedule, onUpdate }) => {
  const { data } = schedule;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<string>(data.purchaseIntervalHuman);

  const { editSchedule } = useBackend();

  const handleEditSchedule = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!frequency) {
        alert('Please select a frequency.');
        return;
      }
      try {
        setLoading(true);
        const updatedSchedule = await editSchedule(schedule._id, {
          name: data.name,
          purchaseIntervalHuman: frequency,
        });
        onUpdate?.(updatedSchedule);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    },
    [data.name, schedule, editSchedule, frequency, onUpdate]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleEditSchedule}>
          <DialogHeader>
            <DialogTitle>Edit Morphomax Schedule</DialogTitle>
            <DialogDescription>
              Make changes to your Morpho maxing Schedule here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <Box className="grid gap-4 py-4">
            <SelectFrequency
              required
              value={frequency}
              onChange={setFrequency}
              disabled={loading}
            />
          </Box>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
