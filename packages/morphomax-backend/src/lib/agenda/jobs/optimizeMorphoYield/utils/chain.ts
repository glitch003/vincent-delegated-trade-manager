import { ethers } from 'ethers';

import { LIT_EVM_CHAINS } from '@lit-protocol/constants';

export const BASE_NAME = 'base';
export const BASE_CHAIN_ID = 8453;
export const BASE_RPC_URL = LIT_EVM_CHAINS[BASE_NAME].rpcUrls[0];

export const baseProvider = new ethers.providers.StaticJsonRpcProvider(BASE_RPC_URL, {
  chainId: BASE_CHAIN_ID,
  name: 'base',
});
