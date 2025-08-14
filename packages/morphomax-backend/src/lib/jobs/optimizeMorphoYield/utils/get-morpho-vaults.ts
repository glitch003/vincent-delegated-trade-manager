import { OrderDirection, VaultOrderBy } from '@morpho-org/blue-api-sdk';

import { baseProvider } from './chain';
import { env } from '../../../env';
import { getVaults } from '../morphoLoader';

const { MINIMUM_VAULT_TOTAL_ASSETS_USD } = env;

export interface GetVaultsQueryVariables {
  first?: number;
  orderBy: VaultOrderBy;
  orderDirection: OrderDirection;
  skip?: number;
  where: {
    assetSymbol_in: string[];
    chainId_in: number[];
    totalAssetsUsd_gte: number;
    whitelisted: boolean;
  };
}

export interface MorphoVaultInfo {
  address: string;
  asset: {
    address: string;
    decimals: number;
    name: string;
    symbol: string;
  };
  chain: {
    id: number;
    network: string;
  };
  id: string;
  name: string;
  state: {
    apy: number;
    avgApy: number;
    avgNetApy: number;
    netApy: number;
  };
  symbol: string;
  whitelisted: boolean;
}

export async function getMorphoVaults(
  queryVariables: GetVaultsQueryVariables
): Promise<MorphoVaultInfo[]> {
  const vaults = await getVaults(queryVariables);

  return vaults.map(
    (vault) =>
      ({
        address: vault.address,
        asset: {
          address: vault.asset.address,
          decimals: vault.asset.decimals,
          name: vault.asset.name,
          symbol: vault.asset.symbol,
        },
        chain: {
          id: vault.chain.id,
          network: vault.chain.network,
        },
        id: vault.id,
        name: vault.name,
        state: {
          apy: vault.state?.apy || 0,
          avgApy: vault.state?.avgApy || 0,
          avgNetApy: vault.state?.avgNetApy || 0,
          netApy: vault.state?.netApy || 0,
        },
        symbol: vault.symbol,
        whitelisted: vault.whitelisted,
      }) as MorphoVaultInfo
  );
}

export async function getTopMorphoVault() {
  const vaults = await getMorphoVaults({
    first: 1,
    orderBy: VaultOrderBy.NetApy,
    orderDirection: OrderDirection.Desc,
    where: {
      assetSymbol_in: ['USDC'],
      chainId_in: [baseProvider.network.chainId],
      totalAssetsUsd_gte: MINIMUM_VAULT_TOTAL_ASSETS_USD,
      whitelisted: true,
    },
  });

  const topVault = vaults[0];
  if (!topVault) {
    throw new Error('No vault found when looking for top yielding vault');
  }

  return topVault;
}
