import { useMemo, useState } from 'react';
import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import { LITEVMChain } from '@lit-protocol/types';
import { ethers } from 'ethers';

const ERC20_ABI = ['function balanceOf(address owner) view returns (uint256)'];

const WETH_CONTRACT_ADDRESSES: Record<number, string> = {
  [LIT_EVM_CHAINS.ethereum.chainId]: '0xC02aaA39b223FE8D0a0e5C4F27eAD9083C756Cc2',
  [LIT_EVM_CHAINS.bsc.chainId]: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
  [LIT_EVM_CHAINS.polygon.chainId]: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
  [LIT_EVM_CHAINS.avalanche.chainId]: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
  [LIT_EVM_CHAINS.arbitrum.chainId]: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  [LIT_EVM_CHAINS.base.chainId]: '0x4200000000000000000000000000000000000006',
  [LIT_EVM_CHAINS.baseSepolia.chainId]: '0x4200000000000000000000000000000000000006',
  [LIT_EVM_CHAINS.optimism.chainId]: '0x4200000000000000000000000000000000000006',
};

export const useChain = () => {
  const [chain, setChain] = useState<LITEVMChain>(LIT_EVM_CHAINS.base);

  const provider = useMemo(() => new ethers.providers.JsonRpcProvider(chain.rpcUrls[0]), [chain]);
  const wethContract = useMemo(
    () => new ethers.Contract(WETH_CONTRACT_ADDRESSES[chain.chainId], ERC20_ABI, provider),
    [chain, provider]
  );

  return {
    chain,
    setChain,
    provider,
    wethContract,
  };
};
