import { OrderDirection, VaultOrderBy } from '@morpho-org/blue-api-sdk';
import { Response } from 'express';

import { BASE_CHAIN_ID, getMorphoVaults } from '../jobs/optimizeMorphoYield/utils';

export const handleGetTopStrategyRoute = async (req: Request, res: Response) => {
  const vaults = await getMorphoVaults({
    first: 1,
    orderBy: VaultOrderBy.AvgNetApy,
    orderDirection: OrderDirection.Desc,
    where: {
      assetSymbol_in: ['USDC'],
      chainId_in: [BASE_CHAIN_ID],
      whitelisted: true,
    },
  });

  const topVault = vaults[0];
  if (!topVault) {
    throw new Error('No vault found when looking for top yielding vault');
  }

  res.json({ data: topVault, success: true });
};
