import React, { useState, FormEvent } from 'react';

import { useBackend } from '@/hooks/useBackend';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FREQUENCIES, SelectFrequency } from '@/components/select-frequency';

export interface CreateScheduleProps {
  onCreate?: () => void;
}

export const CreateSchedule: React.FC<CreateScheduleProps> = ({ onCreate }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [name] = useState<string>('name');
  const [frequency, setFrequency] = useState<string>(FREQUENCIES[0].value);
  const { createSchedule } = useBackend();

  const handleCreateSchedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!frequency) {
      alert('Please select a frequency.');
      return;
    }

    try {
      setLoading(true);
      await createSchedule({
        name,
        purchaseIntervalHuman: frequency,
      });
      onCreate?.();
    } catch (error) {
      console.error('Error creating Schedule:', error);
      alert('Error creating Schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col justify-between bg-white p-6 shadow-sm">
      <form onSubmit={handleCreateSchedule}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Morpho Vault Maximizer Agent</CardTitle>
          <CardDescription className="mt-2 text-gray-600">
            This agent periodically maximizes your Morpho USDC vault positions by choosing the
            highest yielding vault and moving all invested funds into it.
            <br />
            <br />
            <strong>How It Works (Powered by Vincent):</strong>
            <br />
            Typically, building automated crypto spending agents involves trusting agent developers
            or wallet SaaS companies for <strong>key management</strong>. Vincent enables a more
            secure and simpler process.
            <br />
            <br />
            The agent operates using permissions securely delegated by you, following strict rules
            you establish during setup—such as only being able to execute withdrawals and deposits
            at Morpho. These onchain rules are cryptographically enforced by{' '}
            <a
              href="https://litprotocol.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Lit Protocol
            </a>
            , ensuring every action stays within your guardrails. With Vincent, you achieve powerful
            automation combined with secure, permissioned execution.
            <br />
            <br />
            <strong>Requirements:</strong> Ensure your wallet holds at least 50 USDC for the agent
            to make deposits. Also some ETH is required for gas fees.
          </CardDescription>
        </CardHeader>

        <Separator className="my-8" />

        <CardContent className="my-8">
          <Box className="space-y-4">
            <SelectFrequency
              required
              value={frequency}
              onChange={setFrequency}
              disabled={loading}
            />
          </Box>
        </CardContent>

        <Separator className="my-8" />

        <CardFooter className="flex justify-center">
          <Button className="w-full" type="submit">
            Create Schedule
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
