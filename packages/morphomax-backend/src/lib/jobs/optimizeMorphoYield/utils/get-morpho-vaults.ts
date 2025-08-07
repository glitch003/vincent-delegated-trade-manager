import { OrderDirection, VaultOrderBy } from '@morpho-org/blue-api-sdk';

import { getVaults } from '../morphoLoader';

export interface GetVaultsQueryVariables {
  first?: number;
  orderBy: VaultOrderBy;
  orderDirection: OrderDirection;
  skip?: number;
  where: {
    assetSymbol_in: string[];
    chainId_in: number[];
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
