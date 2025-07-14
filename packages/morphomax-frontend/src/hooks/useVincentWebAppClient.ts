import { useState } from 'react';
import { getVincentWebAppClient } from '@lit-protocol/vincent-sdk';
import { APP_ID } from '@/config';

export const useVincentWebAppClient = () => {
  const [vincentWebAppClient] = useState(() => getVincentWebAppClient({ appId: APP_ID }));

  return vincentWebAppClient;
};
