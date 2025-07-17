import { ethers } from 'ethers';

import { LIT_RPC } from '@lit-protocol/constants';
import { getVincentToolClient } from '@lit-protocol/vincent-app-sdk';
import { bundledVincentTool as erc20ApprovalTool } from '@lit-protocol/vincent-tool-erc20-approval';
// @ts-ignore
import { bundledVincentTool as morphoTool } from '@lit-protocol/vincent-tool-morpho';
import { bundledVincentTool as uniswapSwapTool } from '@lit-protocol/vincent-tool-uniswap-swap';

import { env } from '../../../env';

const { VINCENT_DELEGATEE_PRIVATE_KEY } = env;

export const ethersSigner = new ethers.Wallet(
  VINCENT_DELEGATEE_PRIVATE_KEY,
  new ethers.providers.StaticJsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
);

export function getErc20ApprovalToolClient() {
  return getVincentToolClient({
    ethersSigner,
    bundledVincentTool: erc20ApprovalTool,
  });
}

// TODO leaving this here as we will use it later to allow funding with any coin
export function getUniswapToolClient() {
  return getVincentToolClient({
    ethersSigner,
    bundledVincentTool: uniswapSwapTool,
  });
}

export function getMorphoToolClient() {
  return getVincentToolClient({
    ethersSigner,
    // @ts-ignore
    bundledVincentTool: morphoTool,
  });
}
