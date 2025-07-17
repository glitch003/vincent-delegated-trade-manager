import React from 'react';

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
import { Info } from '@/components/info';
import { useBackend } from '@/hooks/useBackend';

export const Presentation: React.FC = () => {
  const { getJwt } = useBackend();

  return (
    <Card data-testId="presentation" className="w-full md:max-w-md bg-white p-8 shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Vincent Morphomax Agent</CardTitle>
        <CardDescription className="text-gray-600">
          Automatic Morpho yield optimization agent
        </CardDescription>
      </CardHeader>

      <Separator className="my-4" />

      <CardContent className="text-center">
        <p className="text-gray-700">
          Welcome to the Vincent Morphomax Agent. This application allows you to set up automated
          vault rebalancing to optimize your yield in Base chain using Morpho lending platform.
        </p>
        <p className="mt-4 text-gray-700">Support for more chains and tokens coming soon.</p>
        <p className="mt-4 text-gray-700">
          To get started, please Auth with Vincent to manage your Morphomax schedules.
        </p>
      </CardContent>

      <CardFooter className="flex flex-col items-center">
        <Button onClick={getJwt} className="bg-purple-600 text-white hover:bg-purple-700">
          Auth with Vincent
        </Button>
        <Info />
      </CardFooter>
    </Card>
  );
};
