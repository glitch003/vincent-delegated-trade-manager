import { ethers } from 'ethers';

import { env } from '../../../../env';

export const { BASE_RPC_URL } = env;

export const BASE_CHAIN_ID = 8453;

export const baseProvider = new ethers.providers.StaticJsonRpcProvider(BASE_RPC_URL, {
  chainId: BASE_CHAIN_ID,
  name: 'base',
});
